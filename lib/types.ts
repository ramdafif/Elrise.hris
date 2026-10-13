// Nusantara HRIS Enterprise - Core Type Definitions

export type UserRole = 'SUPERADMIN' | 'ADMIN_PT' | 'ADMIN_PROJECT' | 'EMPLOYEE';

/**
 * Strict role validator: Only accepts exact canonical roles.
 * Runtime role guessing is strictly forbidden.
 */
export function normalizeUserRole(rawRole?: string): UserRole {
  if (!rawRole) {
    throw new Error('[SECURITY_VIOLATION] Role tidak boleh kosong.');
  }
  const clean = rawRole.trim().toUpperCase();
  if (clean === 'SUPERADMIN') return 'SUPERADMIN';
  if (clean === 'ADMIN_PT') return 'ADMIN_PT';
  if (clean === 'ADMIN_PROJECT') return 'ADMIN_PROJECT';
  if (clean === 'EMPLOYEE') return 'EMPLOYEE';
  throw new Error(`[SECURITY_VIOLATION] Peran '${rawRole}' tidak sah. Sistem otorisasi hanya menerima: SUPERADMIN, ADMIN_PT, ADMIN_PROJECT, EMPLOYEE.`);
}

export type ScopeType = 'PLATFORM_GLOBAL' | 'TENANT' | 'PROJECT' | 'SELF';

export interface UserScope {
  id: string;
  userId: string;
  scopeType: ScopeType;
  tenantId?: string;
  projectIds?: string[];
  createdAt?: string;
}

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';

export interface Project {
  id: string;
  tenantId: string;
  code: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  startDate: string;
  endDate?: string;
  location?: string;
  managerId?: string;
  budget?: number;
  createdAt: string;
  updatedAt?: string;
}

export type AssignmentStatus = 'ACTIVE' | 'COMPLETED' | 'TRANSFERRED' | 'INACTIVE';
export type ProjectPosition = 'PROJECT_LEAD' | 'ENGINEER' | 'ANALYST' | 'COORDINATOR' | 'OPERATOR' | 'MEMBER';

export interface EmployeeProjectAssignment {
  id: string;
  tenantId: string;
  employeeId: string;
  projectId: string;
  projectPosition: string; // Operational functional assignment (NEVER determines system authorization)
  role?: string; // Backward compatibility alias mapping to projectPosition
  assignmentType?: string; // Alias
  startDate: string;
  endDate?: string;
  status: AssignmentStatus;
  isPrimary: boolean;
  projectCode?: string;
  projectName?: string;
  employeeName?: string;
  createdAt: string;
  updatedAt?: string;
}

export type TenantTier = 'STARTER' | 'GROWTH' | 'ENTERPRISE';
export type TenantStatus = 'ACTIVE' | 'TRIAL' | 'SUSPENDED' | 'EXPIRED';

export interface Tenant {
  id: string;
  code: string;
  name: string;
  legalName: string;
  tier: TenantTier;
  status: TenantStatus;
  maxEmployees: number;
  storageLimitMb: number;
  features: string[];
  subscriptionEndsAt?: string;
  createdAt: string;
}

export interface TenantEntitlement {
  maxEmployees: number;
  currentEmployees: number;
  features: string[];
  canAddEmployee: boolean;
  canAccessApi: boolean;
  canAccessCustomReports: boolean;
  canRunAdvancedPayroll: boolean;
}

export type Gender = 'MALE' | 'FEMALE';
export type MaritalStatus = 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';
export type EmploymentType = 'PERMANENT' | 'CONTRACT' | 'PROBATION' | 'INTERNSHIP';
export type EmployeeStatus = 'ACTIVE' | 'ON_LEAVE' | 'PROBATION' | 'SUSPENDED' | 'RESIGNED' | 'TERMINATED';

export type TaxPtkpStatus =
  | 'TK_0' // Tidak Kawin, 0 Tanggungan (Rp 54.000.000)
  | 'TK_1' // Tidak Kawin, 1 Tanggungan (Rp 58.500.000)
  | 'TK_2' // Tidak Kawin, 2 Tanggungan (Rp 63.000.000)
  | 'TK_3' // Tidak Kawin, 3 Tanggungan (Rp 67.500.000)
  | 'K_0'  // Kawin, 0 Tanggungan (Rp 58.500.000)
  | 'K_1'  // Kawin, 1 Tanggungan (Rp 63.000.000)
  | 'K_2'  // Kawin, 2 Tanggungan (Rp 67.500.000)
  | 'K_3'; // Kawin, 3 Tanggungan (Rp 72.000.000)

export type AttendanceStatus =
  | 'PRESENT'
  | 'LATE'
  | 'EARLY_LEAVE'
  | 'HALF_DAY'
  | 'ABSENT'
  | 'ON_LEAVE'
  | 'HOLIDAY'
  | 'BUSINESS_TRIP';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type PayrollStatus =
  | 'DRAFT'
  | 'CALCULATING'
  | 'REVIEW'
  | 'APPROVED'
  | 'LOCKED'
  | 'PAID';

export interface Company {
  id: string;
  tenantId?: string;
  name: string;
  legalName: string;
  taxId: string; // NPWP
  nib: string; // NIB
  bpjsKesCompanyId: string;
  bpjsTkCompanyId: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  email: string;
  website: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  address: string;
  city: string;
  umrAmount: number;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  workStartTime?: string; // Standard check-in time e.g. "08:30"
  workEndTime?: string; // Standard check-out time e.g. "17:00"
}

export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
  costCenter: string;
}

export interface Position {
  id: string;
  departmentId: string;
  code: string;
  title: string;
  level: string;
  baseSalaryMin: number;
  baseSalaryMax: number;
}

export interface Employee {
  id: string;
  tenantId?: string;
  employeeId: string; // NTM-2023-001
  nikKtp: string;
  fullName: string;
  nickname?: string;
  email: string;
  phone: string;
  birthPlace: string;
  birthDate: string; // ISO date
  gender: Gender;
  maritalStatus: MaritalStatus;
  religion: string;
  addressKtp: string;
  addressCurrent?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  emergencyRel?: string;

  branchId: string;
  departmentId: string;
  positionId: string;
  managerId?: string;
  joinDate: string;
  contractEndDate?: string;
  permanentDate?: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;

  // Compensation
  basicSalary: number;
  fixedAllowance: number; // Tunjangan Jabatan
  mealAllowance: number; // per hari kehadiran
  transportAllowance: number; // per hari kehadiran
  communicationAllowance: number;

  // Bank Info
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;

  // Tax & BPJS
  npwp?: string;
  ptkpStatus: TaxPtkpStatus;
  hasNpwp: boolean;
  bpjsKesNumber?: string;
  bpjsTkNumber?: string;
  isBpjsKesActive: boolean;
  isBpjsTkActive: boolean;

  avatarUrl?: string;
  projectAssignments?: EmployeeProjectAssignment[];
}

export interface SalaryHistory {
  id: string;
  employeeId: string;
  oldSalary: number;
  newSalary: number;
  effectiveDate: string;
  reason: string;
  approvedBy: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  tenantId?: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  checkIn?: string; // ISO DateTime
  checkOut?: string; // ISO DateTime
  workDurationMin: number;
  lateDurationMin: number;
  earlyLeaveMin: number;
  status: AttendanceStatus;
  workLocation: 'WFO' | 'WFH' | 'CLIENT_SITE';
  latitudeIn?: number;
  longitudeIn?: number;
  source: 'MOBILE_APP' | 'WEB_PORTAL' | 'BIOMETRIC_DEVICE' | 'MANUAL_INPUT';
  notes?: string;
  isCorrected?: boolean;
  correctionNotes?: string;
  proposedCheckIn?: string;
  proposedCheckOut?: string;
  correctedBy?: string;
  correctedAt?: string;
  approvalStatus: ApprovalStatus;
}

export type Attendance = AttendanceRecord;

export interface LeaveType {
  id: string;
  code: string;
  name: string;
  annualEntitlement: number;
  carryForwardMax: number;
  requiresAttachment: boolean;
  isPaid: boolean;
}

export interface LeaveRequest {
  id: string;
  tenantId?: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  attachmentUrl?: string;
  status: ApprovalStatus;
  managerNotes?: string;
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface OvertimeRequest {
  id: string;
  tenantId?: string;
  employeeId: string;
  date: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationHours: number;
  calculatedHours: number; // PP 35/2021 weighted hours
  overtimePay: number;
  reason: string;
  status: ApprovalStatus;
  managerNotes?: string;
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  payrollPeriodId?: string;
  createdAt: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  isCollective: boolean;
  description?: string;
}

// -------------------------------------------------------------
// PAYROLL & TAX BREAKDOWN SCHEMAS
// -------------------------------------------------------------

export interface TaxCalculationDetail {
  ptkpStatus: TaxPtkpStatus;
  terCategory: 'A' | 'B' | 'C';
  grossMonthlyIncome: number;
  terRatePercent: number; // e.g. 0.75 for 0.75%
  pph21MonthlyAmount: number;
  regulationBasis: string; // PP 58/2023 & PMK 168/2023
  hasNpwp: boolean;
  npwpPenaltyMultiplier: number; // 1.0 if has NPWP, 1.2 if non-NPWP (historically 20% surcharge, now standard NIK)
  calculationSteps: {
    description: string;
    amountOrRate: string;
  }[];
}

export interface BpjsCalculationDetail {
  bpjsKesBaseWage: number;
  bpjsKesWageCeiling: number; // Rp 12.000.000 (Perpres 64/2020)
  bpjsKesEmployeeRate: number; // 1%
  bpjsKesEmployerRate: number; // 4%
  bpjsKesEmployeeAmount: number;
  bpjsKesEmployerAmount: number;

  bpjsTkJhtBaseWage: number;
  bpjsTkJhtEmployeeRate: number; // 2%
  bpjsTkJhtEmployerRate: number; // 3.7%
  bpjsTkJhtEmployeeAmount: number;
  bpjsTkJhtEmployerAmount: number;

  bpjsTkJpBaseWage: number;
  bpjsTkJpWageCeiling: number; // Rp 10.042.300 (Edaran BPJS Ketenagakerjaan terbaru)
  bpjsTkJpEmployeeRate: number; // 1%
  bpjsTkJpEmployerRate: number; // 2%
  bpjsTkJpEmployeeAmount: number;
  bpjsTkJpEmployerAmount: number;

  bpjsTkJkkRate: number; // 0.24% (Tingkat Risiko Sangat Rendah / Kantor)
  bpjsTkJkkAmount: number;
  bpjsTkJkmRate: number; // 0.30%
  bpjsTkJkmAmount: number;

  totalEmployeeDeduction: number;
  totalEmployerContribution: number;
  regulations: string[];
}

export interface PayrollItem {
  id: string;
  tenantId?: string;
  payrollPeriodId: string;
  employeeId: string;

  // Earnings
  basicSalary: number;
  fixedAllowance: number;
  variableAllowance: number; // Attendance-based meal & transport
  overtimePay: number;
  bonusThr: number;
  reimbursementPay: number;
  grossSalary: number;

  // Employee Deductions
  bpjsKesEmployee: number;
  bpjsTkJhtEmployee: number;
  bpjsTkJpEmployee: number;
  pph21Amount: number;
  loanDeduction: number;
  absenceDeduction: number;
  totalDeductions: number;

  // Employer Contributions
  bpjsKesEmployer: number;
  bpjsTkJhtEmployer: number;
  bpjsTkJpEmployer: number;
  bpjsTkJkkEmployer: number;
  bpjsTkJkmEmployer: number;
  totalEmployerCost: number;

  netSalary: number;

  // Immutable Calculation Snapshots
  taxSnapshot: TaxCalculationDetail;
  bpjsSnapshot: BpjsCalculationDetail;
  attendanceDays: number;
  overtimeHours: number;

  isPaid: boolean;
  paidAt?: string;
  createdAt: string;
}

export interface PayrollPeriod {
  id: string;
  tenantId?: string;
  code: string; // e.g. 2026-03
  name: string; // Periode Maret 2026
  startDate: string;
  endDate: string;
  paymentDate: string;
  status: PayrollStatus;
  totalEmployees: number;
  totalGrossPay: number;
  totalPph21: number;
  totalBpjsEmployee: number;
  totalBpjsEmployer: number;
  totalNetPay: number;
  lockedAt?: string;
  lockedBy?: string;
  lockedByName?: string;
  approvedAt?: string;
  approvedBy?: string;
  approvedByName?: string;
  calculatedAt?: string;
  calculatedBy?: string;
  calculatedByName?: string;
  paidAt?: string;
  paidBy?: string;
  paidByName?: string;
}

export interface GovernmentRegulation {
  id: string;
  category: 'PPH21_TER' | 'BPJS_KES' | 'BPJS_TK' | 'OVERTIME' | 'THR' | 'MINIMUM_WAGE';
  regulationName: string;
  regulationNumber: string;
  officialSource: string;
  sourceUrl?: string;
  effectiveFrom: string;
  effectiveUntil?: string;
  version: number;
  isActive: boolean;
  notes?: string;
  verifiedAt: string;
  verifiedBy: string;
  parameters: Record<string, any>;
}

export interface Reimbursement {
  id: string;
  tenantId?: string;
  employeeId: string;
  category: string;
  amount: number;
  description: string;
  receiptUrl?: string;
  status: ApprovalStatus;
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  paidInPayroll: boolean;
  createdAt: string;
}

export interface EmployeeLoan {
  id: string;
  tenantId?: string;
  employeeId: string;
  principalAmount: number;
  installmentCount: number;
  monthlyDeduction: number;
  remainingBalance: number;
  purpose: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startDate: string;
  createdAt: string;
}

export interface KpiReview {
  id: string;
  tenantId?: string;
  employeeId: string;
  period: string;
  selfScore?: number;
  managerScore?: number;
  finalScore?: number;
  selfNotes?: string;
  managerNotes?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'REVIEWED' | 'FINALIZED';
  createdAt: string;
}

export interface EmployeeDocument {
  id: string;
  tenantId?: string;
  employeeId: string;
  category: 'KTP' | 'NPWP' | 'KK' | 'BPJS' | 'CONTRACT' | 'DIPLOMA' | 'CERTIFICATE' | 'MEDICAL';
  fileName: string;
  fileUrl: string;
  fileSizeKb: number;
  expiryDate?: string;
  isVerified: boolean;
  verifiedBy?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  tenantId?: string;
  userId?: string;
  userName: string;
  userRole: string;
  actorScope?: string; // PLATFORM_GLOBAL, TENANT, PROJECT, EMPLOYEE
  targetTenantId?: string; // Cross-tenant target
  targetProjectId?: string; // Project target
  action:
    | 'CREATE'
    | 'UPDATE'
    | 'DELETE'
    | 'CALCULATE'
    | 'APPROVE'
    | 'REJECT'
    | 'LOCK'
    | 'EXPORT'
    | 'PAY'
    | 'CROSS_TENANT_ACCESS'
    | 'IMPERSONATION'
    | 'SECURITY_ALERT';
  module:
    | 'EMPLOYEE'
    | 'PAYROLL'
    | 'ATTENDANCE'
    | 'LEAVE'
    | 'OVERTIME'
    | 'TAX_RULE'
    | 'BPJS_RULE'
    | 'REIMBURSEMENT'
    | 'PROJECT'
    | 'SECURITY';
  entity: string;
  entityId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  reason?: string;
  ipAddress?: string;
  timestamp: string;
}

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  scopeType: ScopeType;
  tenantId?: string; // Active or assigned tenant ID
  tenantName?: string;
  impersonatedTenantId?: string; // Target tenant when Platform Admin impersonates
  employeeId?: string;
  branchId?: string;
  departmentId?: string;
  projectIds?: string[]; // Project IDs accessible under PROJECT scope
  primaryProjectId?: string;
  avatar?: string;
  description?: string;
}
