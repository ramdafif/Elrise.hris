// Data Classification & Server-Side Data Masking Engine
// Compliance with UU No. 27/2022 (Pelindungan Data Pribadi)

import { Employee } from '../types';

export type DataSensitivityLevel =
  | 'PUBLIC'
  | 'INTERNAL'
  | 'CONFIDENTIAL'
  | 'HIGHLY_CONFIDENTIAL';

export interface SensitiveFieldClassification {
  field: string;
  level: DataSensitivityLevel;
  description: string;
}

export const DATA_CLASSIFICATION_REGISTRY: SensitiveFieldClassification[] = [
  { field: 'company.name', level: 'PUBLIC', description: 'Nama resmi korporasi' },
  { field: 'company.taxId', level: 'INTERNAL', description: 'NPWP Perusahaan' },
  { field: 'employee.fullName', level: 'INTERNAL', description: 'Nama lengkap karyawan' },
  { field: 'employee.department', level: 'INTERNAL', description: 'Departemen kerja' },
  { field: 'employee.nikKtp', level: 'HIGHLY_CONFIDENTIAL', description: 'Nomor Induk Kependudukan (16 digit)' },
  { field: 'employee.npwp', level: 'HIGHLY_CONFIDENTIAL', description: 'Nomor Pokok Wajib Pajak pribadi' },
  { field: 'employee.bankAccountNumber', level: 'HIGHLY_CONFIDENTIAL', description: 'Nomor rekening transfer payroll' },
  { field: 'employee.basicSalary', level: 'HIGHLY_CONFIDENTIAL', description: 'Besaran gaji pokok bulanan' },
  { field: 'employee.phone', level: 'CONFIDENTIAL', description: 'Nomor telepon seluler pribadi' },
  { field: 'employee.address', level: 'CONFIDENTIAL', description: 'Alamat tempat tinggal pegawai' },
  { field: 'payroll.netSalary', level: 'HIGHLY_CONFIDENTIAL', description: 'Take Home Pay bersih bulanan' },
  { field: 'audit.action', level: 'CONFIDENTIAL', description: 'Catatan rekam jejak audit sistem' },
];

/**
 * Mask Indonesian NIK KTP (16 digits)
 * Example: 3171012304920005 -> ************0005
 */
export function maskNik(nik?: string): string {
  if (!nik) return '****************';
  const clean = nik.replace(/\s+/g, '');
  if (clean.length < 4) return '****************';
  const lastFour = clean.slice(-4);
  return '************' + lastFour;
}

/**
 * Mask Indonesian NPWP (16 digits or 15 digits format)
 * Example: 09.234.567.8-012.000 -> **.***.***.*-***.000
 */
export function maskNpwp(npwp?: string): string {
  if (!npwp) return '**.***.***.*-***.***';
  const digits = npwp.replace(/\D/g, '');
  if (digits.length < 3) return '**.***.***.*-***.***';
  const lastThree = digits.slice(-3);
  return `**.***.***.*-***.${lastThree}`;
}

/**
 * Mask Bank Account Number
 * Example: 5271928391 -> ******8391
 */
export function maskBankAccount(account?: string): string {
  if (!account) return '**********';
  const clean = account.replace(/\s+/g, '');
  if (clean.length <= 4) return '****' + clean;
  const lastFour = clean.slice(-4);
  return '*'.repeat(Math.max(4, clean.length - 4)) + lastFour;
}

/**
 * Mask Salary Amount
 * Redacts financial values for unauthorized viewers
 */
export function maskSalary(amount: number, canView: boolean): string | number {
  if (canView) return amount;
  return 'Rp ***.***.***';
}

/**
 * Mask Phone Number
 * Example: 081234567890 -> 0812****7890
 */
export function maskPhone(phone?: string): string {
  if (!phone) return '08**********';
  const clean = phone.trim();
  if (clean.length < 8) return '08**********';
  const prefix = clean.slice(0, 4);
  const suffix = clean.slice(-4);
  return `${prefix}****${suffix}`;
}

/**
 * Context-aware Employee Data Serializer
 * Prevents over-exposure of HIGHLY_CONFIDENTIAL data to unauthorized roles
 */
export function serializeEmployeeWithMasking(
  employee: Employee,
  actor: {
    id?: string;
    employeeId?: string;
    role: string;
    permissions: string[];
  }
): Employee {
  const isOwner = actor.employeeId === employee.id;
  const isSuperAdmin = actor.role === 'SUPER_ADMIN';
  const canReadSensitive =
    isSuperAdmin ||
    actor.permissions.includes('employee.salary.read') ||
    actor.permissions.includes('payroll.read');

  // If actor is authorized or is the owner themselves, show true data
  if (isOwner || canReadSensitive) {
    return { ...employee };
  }

  // Otherwise, apply strict server-side masking
  return {
    ...employee,
    nikKtp: maskNik(employee.nikKtp),
    npwp: maskNpwp(employee.npwp),
    bankAccountNumber: maskBankAccount(employee.bankAccountNumber),
    phone: maskPhone(employee.phone),
    // Redact salary & allowances to 0 or hidden representation
    basicSalary: 0,
    fixedAllowance: 0,
    mealAllowance: 0,
    transportAllowance: 0,
    communicationAllowance: 0,
  };
}
