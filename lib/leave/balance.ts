/**
 * LEAVE BALANCE & CONFLICT ENGINE — NUSANTARA HRIS ENTERPRISE
 * 
 * Sesuai UU No. 13/2003 jo. UU No. 6/2023 & Standar Operasional HR Indonesia:
 * - Menghitung sisa cuti tahun berjalan (annual entitlement, used days, carry forward)
 * - Mencegah bentrok tanggal permohonan cuti (date overlap collision)
 * - Memastikan perhitungan menggunakan integer presisi (Golden Rule #5)
 */

import { LeaveRequest, LeaveType } from '../types';

export interface LeaveBalanceSummary {
  leaveTypeId: string;
  leaveTypeName: string;
  annualEntitlement: number;
  carryForward: number;
  totalEntitlement: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
  isPaid: boolean;
  isUnlimited: boolean;
}

/**
 * Menghitung saldo cuti karyawan untuk suatu LeaveType pada tahun tertentu.
 * 
 * Formula:
 * sisaCuti = (annualEntitlement + carryForward) - totalApprovedDays
 */
export function calculateLeaveBalance(
  employeeId: string,
  leaveType: LeaveType,
  leaveRequests: LeaveRequest[],
  year: number = new Date().getFullYear(),
  carryForwardApproved: number = 0
): LeaveBalanceSummary {
  // Untuk jenis cuti yang isPaid: false (seperti cuti di luar tanggungan / unpaid leave),
  // hak cuti tidak mengurangi saldo cuti berbayar
  const isPaid = leaveType.isPaid;
  const isUnlimited = !isPaid;

  // Batasi carryForward dengan carryForwardMax
  const effectiveCarryForward = Math.min(
    Math.max(0, Math.floor(carryForwardApproved)),
    leaveType.carryForwardMax || 0
  );

  const totalEntitlement = leaveType.annualEntitlement + effectiveCarryForward;

  // Filter pengajuan cuti milik karyawan untuk leaveType ini pada tahun berjalan
  const relevantRequests = leaveRequests.filter((req) => {
    if (req.employeeId !== employeeId) return false;
    if (req.leaveTypeId !== leaveType.id) return false;

    // Periksa tahun dari startDate
    const reqYear = new Date(req.startDate).getFullYear();
    return reqYear === year;
  });

  // Hitung hari yang sudah disetujui (APPROVED)
  const usedDays = relevantRequests
    .filter((req) => req.status === 'APPROVED')
    .reduce((sum, req) => sum + Math.max(0, Math.floor(req.totalDays || 0)), 0);

  // Hitung hari yang sedang menunggu persetujuan (PENDING)
  const pendingDays = relevantRequests
    .filter((req) => req.status === 'PENDING')
    .reduce((sum, req) => sum + Math.max(0, Math.floor(req.totalDays || 0)), 0);

  // Sisa kuota resmi (berdasarkan yang telah disetujui)
  const remainingDays = isUnlimited ? 999 : Math.max(0, totalEntitlement - usedDays);

  return {
    leaveTypeId: leaveType.id,
    leaveTypeName: leaveType.name,
    annualEntitlement: leaveType.annualEntitlement,
    carryForward: effectiveCarryForward,
    totalEntitlement,
    usedDays,
    pendingDays,
    remainingDays,
    isPaid,
    isUnlimited,
  };
}

/**
 * Memvalidasi apakah pengajuan cuti baru bentrok dengan pengajuan cuti lain
 * yang sedang berstatus PENDING atau APPROVED untuk karyawan yang sama.
 * 
 * Dua rentang tanggal [S1, E1] dan [S2, E2] bentrok jika:
 * S1 <= E2 AND E1 >= S2
 */
export function checkLeaveDateOverlap(
  employeeId: string,
  startDate: string,
  endDate: string,
  leaveRequests: LeaveRequest[],
  excludeRequestId?: string
): { hasConflict: boolean; conflictingRequest?: LeaveRequest } {
  const reqStart = new Date(startDate).getTime();
  const reqEnd = new Date(endDate).getTime();

  if (isNaN(reqStart) || isNaN(reqEnd)) {
    throw new Error('Format tanggal cuti tidak valid (gunakan format YYYY-MM-DD).');
  }

  if (reqStart > reqEnd) {
    throw new Error('Tanggal mulai cuti tidak boleh lebih besar dari tanggal selesai cuti.');
  }

  for (const existing of leaveRequests) {
    if (existing.employeeId !== employeeId) continue;
    if (excludeRequestId && existing.id === excludeRequestId) continue;
    // Hanya cek permohonan yang aktif (PENDING atau APPROVED)
    if (existing.status !== 'PENDING' && existing.status !== 'APPROVED') continue;

    const existingStart = new Date(existing.startDate).getTime();
    const existingEnd = new Date(existing.endDate).getTime();

    if (reqStart <= existingEnd && reqEnd >= existingStart) {
      return {
        hasConflict: true,
        conflictingRequest: existing,
      };
    }
  }

  return { hasConflict: false };
}
