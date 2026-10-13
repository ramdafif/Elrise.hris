// Zod Input Validation & Mass Assignment Defense Schemas
// Protects the application boundary from malformed payloads, injection, and invalid types.

import { z } from 'zod';

/**
 * Pagination Schema with Abuse Prevention (Max Limit: 100)
 */
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().max(100).optional(),
});

/**
 * Cursor-based Pagination Schema (Fase 2 Specification)
 * Standard parameters: ?cursor=<id>&limit=<n> (default 50, max 200).
 * Rejects out-of-bounds limit with 422.
 */
export const CursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int({ message: 'Limit harus berupa bilangan bulat' })
    .min(1, 'Limit minimal 1')
    .max(200, 'Limit maksimal 200')
    .default(50),
});

export type CursorPaginationParams = z.infer<typeof CursorPaginationSchema>;

export type CursorPaginationParseResult =
  | {
      success: true;
      isValid: true;
      data: CursorPaginationParams;
      params: CursorPaginationParams;
      error: null;
      errorResponse: null;
    }
  | {
      success: false;
      isValid: false;
      data: null;
      params: null;
      error: z.ZodError;
      errorResponse: { error: string; details: Record<string, string> };
    };

export function parseCursorPagination(searchParams: URLSearchParams): CursorPaginationParseResult {
  const rawCursor = searchParams.get('cursor') ?? undefined;
  const rawLimit = searchParams.get('limit') ?? undefined;

  const result = CursorPaginationSchema.safeParse({
    cursor: rawCursor,
    limit: rawLimit,
  });

  if (!result.success) {
    return {
      success: false,
      isValid: false,
      data: null,
      params: null,
      error: result.error,
      errorResponse: {
        error: 'Validasi parameter pagination gagal',
        details: formatZodErrors(result.error),
      },
    };
  }

  return {
    success: true,
    isValid: true,
    data: result.data,
    params: result.data,
    error: null,
    errorResponse: null,
  };
}

/**
 * Employee Filter & Pagination Schema
 */
export const EmployeeFilterSchema = CursorPaginationSchema.extend({
  search: z.string().max(100).optional(),
  departmentId: z.string().max(50).optional(),
  status: z.string().max(50).optional(),
});

export type EmployeeFilterParams = z.infer<typeof EmployeeFilterSchema>;

export function parseEmployeeFilter(searchParams: URLSearchParams) {
  const rawCursor = searchParams.get('cursor') ?? undefined;
  const rawLimit = searchParams.get('limit') ?? undefined;
  const rawSearch = searchParams.get('search') ?? undefined;
  const rawDepartmentId = searchParams.get('departmentId') ?? undefined;
  const rawStatus = searchParams.get('status') ?? undefined;

  return EmployeeFilterSchema.safeParse({
    cursor: rawCursor,
    limit: rawLimit,
    search: rawSearch,
    departmentId: rawDepartmentId,
    status: rawStatus,
  });
}

/**
 * Employee Creation Schema (Explicit Whitelist against Mass Assignment)
 */
export const EmployeeCreateSchema = z.object({
  fullName: z.string().min(2, 'Nama lengkap minimal 2 karakter').max(100),
  email: z.string().email('Format email tidak valid'),
  phone: z.string().regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, 'Format nomor telepon seluler tidak valid'),
  nikKtp: z.string().length(16, 'NIK KTP harus tepat 16 digit angka').regex(/^\d{16}$/, 'NIK KTP hanya boleh berisi angka'),
  npwp: z.string().min(15, 'NPWP minimal 15 digit').max(20),
  ptkpStatus: z.enum([
    'TK_0', 'TK_1', 'TK_2', 'TK_3',
    'K_0', 'K_1', 'K_2', 'K_3',
    'K_I_0', 'K_I_1', 'K_I_2', 'K_I_3',
  ]),
  department: z.string().min(2).max(50),
  jobTitle: z.string().min(2).max(50),
  basicSalary: z.number().min(0, 'Gaji pokok tidak boleh negatif'),
  fixedAllowance: z.number().min(0).default(0),
  variableAllowancePerDay: z.number().min(0).default(0),
  bankName: z.string().min(2).max(50),
  bankAccountNumber: z.string().min(5).max(30).regex(/^\d+$/, 'Nomor rekening harus angka'),
  hasNpwp: z.boolean().default(true),
  isBpjsKesActive: z.boolean().default(true),
  isBpjsTkActive: z.boolean().default(true),
});

/**
 * Employee Update Schema (Explicit Allowed Fields Only)
 */
export const EmployeeUpdateSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().optional(),
  address: z.string().max(255).optional(),
  department: z.string().min(2).max(50).optional(),
  jobTitle: z.string().min(2).max(50).optional(),
  bankName: z.string().min(2).max(50).optional(),
  bankAccountNumber: z.string().optional(),
  isBpjsKesActive: z.boolean().optional(),
  isBpjsTkActive: z.boolean().optional(),
});

/**
 * Salary Adjustment Schema (Requires Privilege)
 */
export const SalaryAdjustmentSchema = z.object({
  employeeId: z.string().min(1),
  newSalary: z.number().min(1000000, 'Gaji pokok minimal Rp 1.000.000'),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal YYYY-MM-DD'),
  reason: z.string().min(5, 'Alasan kenaikan/penyesuaian gaji wajib dijelaskan secara rinci').max(255),
});

/**
 * Attendance Check-In / Check-Out Schema
 */
export const AttendanceCheckSchema = z.object({
  employeeId: z.string().min(1),
  type: z.enum(['CHECK_IN', 'CHECK_OUT']),
  locationName: z.string().max(100).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  workType: z.enum(['WFO', 'WFH', 'WFA']).default('WFO'),
  notes: z.string().max(200).optional(),
});

/**
 * Leave Request Schema
 */
export const LeaveRequestSchema = z.object({
  employeeId: z.string().min(1),
  leaveType: z.enum(['ANNUAL', 'SICK', 'MATERNITY', 'UNPAID', 'IMPORTANT_REASON']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal YYYY-MM-DD'),
  totalDays: z.number().int().min(1).max(90),
  reason: z.string().min(5, 'Alasan permohonan cuti minimal 5 karakter').max(255),
});

/**
 * Overtime Request Schema (PP 35/2021)
 */
export const OvertimeRequestSchema = z.object({
  employeeId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal YYYY-MM-DD'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format waktu HH:mm'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format waktu HH:mm'),
  durationHours: z.number().min(0.5).max(12),
  reason: z.string().min(5, 'Uraian pekerjaan lembur minimal 5 karakter').max(255),
});

/**
 * Payroll Lock Request Schema
 */
export const PayrollLockSchema = z.object({
  payrollPeriodId: z.string().min(1),
  confirmationToken: z.string().min(1, 'Token konfirmasi wajib disertakan'),
  notes: z.string().max(255).optional(),
});

/**
 * Helper to safely extract and format Zod validation errors
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const formatted: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.') || 'root';
    formatted[path] = issue.message;
  }
  return formatted;
}
