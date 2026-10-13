'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  CalendarDays,
  Clock,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  FileText,
  Receipt,
} from 'lucide-react';
import {
  LeaveRequest,
  LeaveType,
  OvertimeRequest,
  Employee,
  UserSession,
  Reimbursement,
} from '@/lib/types';
import { formatIdr, formatDateId } from '@/lib/format';
import { calculateOvertimePay } from '@/lib/payroll/overtime';
import { checkPermission } from '@/lib/security/authorization';
import { calculateLeaveBalance, checkLeaveDateOverlap } from '@/lib/leave/balance';
import { ReimbursementSection } from './ReimbursementSection';

interface LeaveOvertimeViewProps {
  leaveRequests: LeaveRequest[];
  leaveTypes: LeaveType[];
  overtimeRequests: OvertimeRequest[];
  employees: Employee[];
  session: UserSession;
  reimbursements?: Reimbursement[];
  onRefresh?: () => void;
  showToast?: (text: string, type?: 'success' | 'error') => void;
  onAddLeave: (req: Omit<LeaveRequest, 'id' | 'status' | 'createdAt'>) => void;
  onApproveLeave: (id: string) => void;
  onRejectLeave: (id: string, reason: string) => void;
  onAddOvertime: (req: {
    employeeId: string;
    date: string;
    startTime: string;
    endTime: string;
    durationHours: number;
    reason: string;
    isHoliday?: boolean;
  }) => void;
  onApproveOvertime: (id: string) => void;
  onRejectOvertime: (id: string, reason: string) => void;
}

export const LeaveOvertimeView: React.FC<LeaveOvertimeViewProps> = ({
  leaveRequests,
  leaveTypes,
  overtimeRequests,
  employees,
  session,
  reimbursements = [],
  onRefresh,
  showToast,
  onAddLeave,
  onApproveLeave,
  onRejectLeave,
  onAddOvertime,
  onApproveOvertime,
  onRejectOvertime,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'LEAVE' | 'OVERTIME' | 'REIMBURSEMENT'>('LEAVE');

  // Modals
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isOvertimeModalOpen, setIsOvertimeModalOpen] = useState(false);
  const [rejectModal, setRejectModal] = useState<{
    open: boolean;
    type: 'LEAVE' | 'OVERTIME';
    id: string;
    employeeName: string;
    reason: string;
  }>({
    open: false,
    type: 'LEAVE',
    id: '',
    employeeName: '',
    reason: '',
  });

  // Leave Form
  const [leaveForm, setLeaveForm] = useState({
    employeeId: session.employeeId || employees[0]?.id || '',
    leaveTypeId: leaveTypes[0]?.id || 'leave-ann',
    startDate: '2026-03-10',
    endDate: '2026-03-12',
    totalDays: 2,
    reason: '',
  });

  // Overtime Form
  const [otForm, setOtForm] = useState({
    employeeId: session.employeeId || employees[0]?.id || '',
    date: '2026-03-08',
    startTime: '17:30',
    endTime: '20:30',
    durationHours: 3,
    reason: 'Penyelesaian laporan akhir bulan',
    isHoliday: false,
  });

  // Selected employee for Overtime Calculation Preview
  const selectedOtEmployee = employees.find((e) => e.id === otForm.employeeId) || employees[0];
  const otPreview = selectedOtEmployee
    ? calculateOvertimePay(
        Number(selectedOtEmployee.basicSalary),
        Number(selectedOtEmployee.fixedAllowance),
        otForm.durationHours,
        otForm.isHoliday
      )
    : { hourlyWage: 0, weightedHours: 0, overtimePay: 0, regulation: '' };

  // Role permissions
  const canApproveLeave = checkPermission(session.role, 'leave.approve');
  const canApproveOvertime = checkPermission(session.role, 'overtime.approve');
  const canRequestLeave = checkPermission(session.role, 'leave.create');
  const canRequestOvertime = checkPermission(session.role, 'overtime.create');
  const isEmployee = session.role === 'EMPLOYEE';
  const isManager = session.role === 'ADMIN_PROJECT';
  const canViewAllSalaries = session.role === 'SUPERADMIN' || session.role === 'ADMIN_PT';

  const managerRecord = employees.find((e) => e.id === session.employeeId);
  const managerDeptId = managerRecord?.departmentId;

  // Direct subordinate verification for project admin approval
  const isDirectSubordinateOfUser = (targetEmpId: string) => {
    if (session.role !== 'ADMIN_PROJECT') return true;
    const targetEmp = employees.find((e) => e.id === targetEmpId);
    return (
      targetEmp?.managerId === session.employeeId ||
      (managerRecord && targetEmp?.managerId === managerRecord.employeeId)
    );
  };

  // Real-time leave balance and conflict calculation for the form
  const selectedLeaveType = leaveTypes.find((t) => t.id === leaveForm.leaveTypeId);
  const leaveYear = new Date(leaveForm.startDate || '2026-01-01').getFullYear();
  const activeLeaveBalance = selectedLeaveType
    ? calculateLeaveBalance(leaveForm.employeeId, selectedLeaveType, leaveRequests, leaveYear)
    : null;

  const activeConflict = checkLeaveDateOverlap(
    leaveForm.employeeId,
    leaveForm.startDate,
    leaveForm.endDate,
    leaveRequests
  );

  // Filter requests based on role hierarchy
  const displayedLeaveRequests = isEmployee
    ? leaveRequests.filter((req) => req.employeeId === session.employeeId)
    : isManager
    ? leaveRequests.filter((req) => {
        if (req.employeeId === session.employeeId) return true;
        const emp = employees.find((e) => e.id === req.employeeId);
        return emp?.departmentId === managerDeptId;
      })
    : leaveRequests;

  const displayedOvertimeRequests = isEmployee
    ? overtimeRequests.filter((ot) => ot.employeeId === session.employeeId)
    : isManager
    ? overtimeRequests.filter((ot) => {
        if (ot.employeeId === session.employeeId) return true;
        const emp = employees.find((e) => e.id === ot.employeeId);
        return emp?.departmentId === managerDeptId;
      })
    : overtimeRequests;

  // Department-scoped employee candidates for modals (managers can only create for direct subordinates)
  const eligibleModalEmployees = isEmployee
    ? employees.filter((e) => e.id === session.employeeId)
    : isManager
    ? employees.filter((e) => isDirectSubordinateOfUser(e.id) || e.id === session.employeeId)
    : employees;

  const handleCreateLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.reason) {
      alert('Alasan cuti wajib diisi!');
      return;
    }
    if (activeLeaveBalance && !activeLeaveBalance.isUnlimited && leaveForm.totalDays > activeLeaveBalance.remainingDays) {
      alert(
        `Kuota cuti "${activeLeaveBalance.leaveTypeName}" tidak mencukupi!\nSisa kuota: ${activeLeaveBalance.remainingDays} hari.\nAnda mengajukan: ${leaveForm.totalDays} hari.`
      );
      return;
    }
    if (activeConflict.hasConflict) {
      const conf = activeConflict.conflictingRequest!;
      const statusLabel = conf.status === 'APPROVED' ? 'Disetujui' : 'Menunggu Persetujuan';
      alert(
        `Permohonan bentrok!\nRentang tanggal cuti (${leaveForm.startDate} s.d ${leaveForm.endDate}) bentrok dengan permohonan lain (${conf.startDate} s.d ${conf.endDate}) yang berstatus "${statusLabel}".`
      );
      return;
    }
    onAddLeave(leaveForm);
    setIsLeaveModalOpen(false);
  };

  const handleCreateOvertime = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otForm.reason) {
      alert('Alasan/keterangan pekerjaan lembur wajib diisi!');
      return;
    }
    onAddOvertime(otForm);
    setIsOvertimeModalOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {isEmployee ? 'Pengajuan Cuti & Lembur Mandiri' : 'Manajemen Cuti & Lembur (PP 35/2021)'}
          </h2>
          <p className="text-xs text-slate-500">
            Kepatuhan Hak Cuti Karyawan &amp; Formula Resmi Pengupahan Lembur Kemenaker RI
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'LEAVE' ? (
            canRequestLeave && (
              <button
                id="btn-open-leave-modal"
                type="button"
                onClick={() => setIsLeaveModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Ajukan Cuti / Izin</span>
              </button>
            )
          ) : (
            canRequestOvertime && (
              <button
                id="btn-open-ot-modal"
                type="button"
                onClick={() => setIsOvertimeModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Ajukan Lembur (PP 35/2021)</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="border-b border-slate-200 overflow-x-auto">
        <nav className="flex space-x-2 sm:space-x-4 min-w-max">
          <button
            type="button"
            onClick={() => setActiveSubTab('LEAVE')}
            className={`flex items-center gap-2 border-b-2 py-3 px-2 sm:px-1 text-xs font-semibold transition-colors ${
              activeSubTab === 'LEAVE'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            <span>Permohonan Cuti ({displayedLeaveRequests.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('OVERTIME')}
            className={`flex items-center gap-2 border-b-2 py-3 px-2 sm:px-1 text-xs font-semibold transition-colors ${
              activeSubTab === 'OVERTIME'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Pengajuan Lembur PP 35/2021 ({displayedOvertimeRequests.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('REIMBURSEMENT')}
            className={`flex items-center gap-2 border-b-2 py-3 px-2 sm:px-1 text-xs font-semibold transition-colors ${
              activeSubTab === 'REIMBURSEMENT'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="h-4 w-4" />
            <span>Klaim Biaya / Reimbursement ({reimbursements.length})</span>
          </button>
        </nav>
      </div>

      {/* TAB 1: LEAVE REQUESTS */}
      {activeSubTab === 'LEAVE' && (
        <div className="space-y-4">
          {/* Quick Quota Balance Cards for Employee */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {leaveTypes.slice(0, 4).map((lt) => {
              const targetEmpId = isEmployee ? (session.employeeId || 'emp-001') : (leaveForm.employeeId || employees[0]?.id || 'emp-001');
              const bal = calculateLeaveBalance(targetEmpId, lt, leaveRequests, 2026);
              return (
                <div key={lt.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
                  <span className="text-[11px] font-medium text-slate-500 block truncate">{lt.name}</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-xl font-bold text-slate-900 font-mono">
                      {bal.isUnlimited ? '∞' : bal.remainingDays}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {bal.isUnlimited ? 'hari' : `/ ${bal.totalEntitlement} hari`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 pt-1.5 border-t border-slate-100 font-mono">
                    <span>Terpakai: {bal.usedDays}d</span>
                    <span>Pending: {bal.pendingDays}d</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          {/* MOBILE VIEW: Leave Cards */}
          <div className="md:hidden divide-y divide-slate-100">
            {displayedLeaveRequests.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                Belum ada permohonan cuti.
              </div>
            ) : (
              displayedLeaveRequests.map((req) => {
                const emp = employees.find((e) => e.id === req.employeeId);
                const lType = leaveTypes.find((t) => t.id === req.leaveTypeId);

                return (
                  <div key={`mob-leave-${req.id}`} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 leading-tight">
                          {emp?.fullName || req.employeeId}
                        </h4>
                        <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {emp?.employeeId}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          req.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : req.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {req.status === 'APPROVED' ? 'Disetujui' : req.status === 'REJECTED' ? 'Ditolak' : 'Menunggu Approval'}
                      </span>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-2.5 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Jenis Cuti:</span>
                        <span className="font-semibold text-slate-800">{lType?.name || 'Cuti Tahunan'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Periode:</span>
                        <span className="font-medium text-slate-700">
                          {formatDateId(req.startDate)} - {formatDateId(req.endDate)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Total Durasi:</span>
                        <span className="font-bold text-slate-900">{req.totalDays} Hari</span>
                      </div>
                      {req.reason && (
                        <div className="border-t border-slate-200/60 pt-1 text-slate-600 italic text-[11px]">
                          &ldquo;{req.reason}&rdquo;
                        </div>
                      )}
                    </div>

                    {req.status === 'PENDING' && (
                      req.employeeId === session.employeeId ? (
                        <div className="text-[11px] text-amber-700 font-medium pt-1 bg-amber-50 px-2.5 py-1.5 rounded border border-amber-200">
                          Pengajuan Mandiri (Menunggu Verifikasi Atasan)
                        </div>
                      ) : canApproveLeave && isManager && !isDirectSubordinateOfUser(req.employeeId) ? (
                        <div className="text-[11px] text-slate-600 font-medium pt-1 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200 text-center">
                          Menunggu Atasan Langsung
                        </div>
                      ) : canApproveLeave ? (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => onApproveLeave(req.id)}
                            className="flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 active:scale-98 transition-all"
                          >
                            Setujui
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRejectModal({
                                open: true,
                                type: 'LEAVE',
                                id: req.id,
                                employeeName: emp?.fullName || req.employeeId,
                                reason: 'Kebutuhan operasional mendesak',
                              });
                            }}
                            className="flex-1 rounded-lg border border-slate-300 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-98 transition-all"
                          >
                            Tolak
                          </button>
                        </div>
                      ) : (
                        <div className="text-[11px] text-amber-700 font-medium pt-1">
                          Menunggu verifikasi atasan
                        </div>
                      )
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* DESKTOP VIEW: Leave Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                <tr>
                  <th className="px-4 py-3">Pegawai</th>
                  <th className="px-4 py-3">Jenis Cuti</th>
                  <th className="px-4 py-3">Periode Cuti</th>
                  <th className="px-4 py-3 text-center">Durasi</th>
                  <th className="px-4 py-3">Alasan</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedLeaveRequests.map((req) => {
                  const emp = employees.find((e) => e.id === req.employeeId);
                  const lType = leaveTypes.find((t) => t.id === req.leaveTypeId);

                  return (
                    <tr key={req.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{emp?.fullName || req.employeeId}</p>
                        <p className="text-[11px] font-mono text-slate-400">{emp?.employeeId}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-800">{lType?.name || 'Cuti Tahunan'}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatDateId(req.startDate)} s.d. {formatDateId(req.endDate)}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-900">
                        {req.totalDays} Hari
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                        {req.reason}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                            req.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : req.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {req.status === 'APPROVED' ? 'Disetujui' : req.status === 'REJECTED' ? 'Ditolak' : 'Menunggu Approval'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {req.status === 'PENDING' ? (
                          req.employeeId === session.employeeId ? (
                            <span className="inline-block rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 border border-amber-200">
                              Pengajuan Mandiri (Menunggu Atasan)
                            </span>
                          ) : canApproveLeave && isManager && !isDirectSubordinateOfUser(req.employeeId) ? (
                            <span className="inline-block rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 border border-slate-200">
                              Menunggu Atasan Langsung
                            </span>
                          ) : canApproveLeave ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onApproveLeave(req.id)}
                                className="rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-emerald-700 transition-colors"
                              >
                                Setujui
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectModal({
                                    open: true,
                                    type: 'LEAVE',
                                    id: req.id,
                                    employeeName: emp?.fullName || req.employeeId,
                                    reason: 'Kebutuhan proyek',
                                  });
                                }}
                                className="rounded border border-slate-300 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                              >
                                Tolak
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-amber-700 font-medium">Menunggu Verifikasi</span>
                          )
                        ) : (
                          <span className="text-[11px] text-slate-400">Selesai</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}

      {/* TAB 2: OVERTIME REQUESTS */}
      {activeSubTab === 'OVERTIME' && (
        <div className="space-y-4">
          {/* PP 35/2021 Regulation Infobox */}
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-xs text-slate-700">
            <HelpCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-900">
                Formula Perhitungan Lembur Sesuai PP No. 35 Tahun 2021
              </h4>
              <p className="mt-0.5 text-slate-600 leading-relaxed">
                Upah per jam = <strong>1/173 × (Gaji Pokok + Tunjangan Tetap)</strong>. Pada hari kerja biasa: Jam ke-1 dihitung <strong>1.5×</strong>, jam ke-2 dan seterusnya dihitung <strong>2.0×</strong> upah per jam. Pada hari libur: dihitung <strong>2.0× s.d. 4.0×</strong>.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            {/* MOBILE VIEW: Overtime Cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {displayedOvertimeRequests.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  Belum ada pengajuan lembur.
                </div>
              ) : (
                displayedOvertimeRequests.map((ot) => {
                  const emp = employees.find((e) => e.id === ot.employeeId);
                  return (
                    <div key={`mob-ot-${ot.id}`} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 leading-tight">
                            {emp?.fullName || ot.employeeId}
                          </h4>
                          <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                            {emp?.employeeId}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                            ot.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : ot.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {ot.status === 'APPROVED' ? 'Disetujui' : ot.status === 'REJECTED' ? 'Ditolak' : 'Menunggu Approval'}
                        </span>
                      </div>

                      <div className="rounded-lg bg-slate-50 p-2.5 space-y-1.5 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Tanggal:</span>
                          <span className="font-semibold text-slate-800">{formatDateId(ot.date)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Jam:</span>
                          <span className="font-mono text-slate-700">{ot.startTime} - {ot.endTime}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Durasi Riil / Bobot PP 35:</span>
                          <span className="font-mono font-medium text-slate-800">
                            {ot.durationHours} Jam &bull; <strong className="text-emerald-700">{ot.calculatedHours} Jam Upah</strong>
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-200/60 pt-1">
                          <span className="text-slate-600 font-medium">Upah Lembur:</span>
                          <span className="font-mono font-bold text-sm text-emerald-700">{formatIdr(ot.overtimePay)}</span>
                        </div>
                        {ot.reason && (
                          <div className="border-t border-slate-200/60 pt-1 text-slate-600 italic text-[11px]">
                            &ldquo;{ot.reason}&rdquo;
                          </div>
                        )}
                      </div>

                      {ot.status === 'PENDING' && (
                        ot.employeeId === session.employeeId ? (
                          <div className="text-[11px] text-amber-700 font-medium pt-1 bg-amber-50 px-2.5 py-1.5 rounded border border-amber-200">
                            Pengajuan Mandiri (Menunggu Verifikasi Atasan)
                          </div>
                        ) : canApproveOvertime && isManager && !isDirectSubordinateOfUser(ot.employeeId) ? (
                          <div className="text-[11px] text-slate-600 font-medium pt-1 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200 text-center">
                            Menunggu Atasan Langsung
                          </div>
                        ) : canApproveOvertime ? (
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => onApproveOvertime(ot.id)}
                              className="flex-1 rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 active:scale-98 transition-all"
                            >
                              Setujui
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setRejectModal({
                                  open: true,
                                  type: 'OVERTIME',
                                  id: ot.id,
                                  employeeName: emp?.fullName || ot.employeeId,
                                  reason: 'Tidak disetujui atasan',
                                });
                              }}
                              className="flex-1 rounded-lg border border-slate-300 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-98 transition-all"
                            >
                              Tolak
                            </button>
                          </div>
                        ) : (
                          <div className="text-[11px] text-amber-700 font-medium pt-1">
                            Menunggu verifikasi atasan
                          </div>
                        )
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* DESKTOP VIEW: Overtime Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Pegawai</th>
                    <th className="px-4 py-3">Tanggal Lembur</th>
                    <th className="px-4 py-3">Rentang Jam</th>
                    <th className="px-4 py-3 text-center">Durasi Riil</th>
                    <th className="px-4 py-3 text-center">Bobot PP 35/2021</th>
                    <th className="px-4 py-3 text-right">Upah Lembur</th>
                    <th className="px-4 py-3">Tugas / Alasan</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedOvertimeRequests.map((ot) => {
                    const emp = employees.find((e) => e.id === ot.employeeId);
                    return (
                      <tr key={ot.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">{emp?.fullName || ot.employeeId}</p>
                          <p className="text-[11px] font-mono text-slate-400">{emp?.employeeId}</p>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-700">
                          {formatDateId(ot.date)}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-800">
                          {ot.startTime} - {ot.endTime}
                        </td>
                        <td className="px-4 py-3 text-center font-mono">
                          {ot.durationHours} Jam
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-emerald-700">
                          {ot.calculatedHours} Jam Upah
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          {canViewAllSalaries || ot.employeeId === session.employeeId
                            ? formatIdr(ot.overtimePay)
                            : '••••••••'}
                        </td>
                        <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                          {ot.reason}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                              ot.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : ot.status === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {ot.status === 'APPROVED' ? 'Disetujui' : ot.status === 'REJECTED' ? 'Ditolak' : 'Menunggu Approval'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {ot.status === 'PENDING' ? (
                            ot.employeeId === session.employeeId ? (
                              <span className="inline-block rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 border border-amber-200">
                                Pengajuan Mandiri (Menunggu Atasan)
                              </span>
                            ) : canApproveOvertime && isManager && !isDirectSubordinateOfUser(ot.employeeId) ? (
                              <span className="inline-block rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 border border-slate-200">
                                Menunggu Atasan Langsung
                              </span>
                            ) : canApproveOvertime ? (
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => onApproveOvertime(ot.id)}
                                  className="rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-emerald-700 transition-colors"
                                >
                                  Setujui
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRejectModal({
                                      open: true,
                                      type: 'OVERTIME',
                                      id: ot.id,
                                      employeeName: emp?.fullName || ot.employeeId,
                                      reason: 'Tidak disetujui atasan',
                                    });
                                  }}
                                  className="rounded border border-slate-300 px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                                >
                                  Tolak
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-amber-700 font-medium">Menunggu Verifikasi</span>
                            )
                          ) : (
                            <span className="text-[11px] text-slate-400">Selesai</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: REIMBURSEMENT CLAIMS */}
      {activeSubTab === 'REIMBURSEMENT' && (
        <ReimbursementSection
          reimbursements={reimbursements}
          employees={employees}
          session={session}
          onRefresh={onRefresh}
          showToast={showToast}
        />
      )}

      {/* Modal: Ajukan Cuti Baru */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4 backdrop-blur-xs">
          <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900">Formulir Pengajuan Cuti / Izin</h3>
            <p className="text-xs text-slate-500">
              Pengajuan akan diteruskan kepada Manajer divisi untuk diverifikasi dan disetujui.
            </p>

            <form onSubmit={handleCreateLeave} className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-700">Karyawan Pemohon</label>
                {isEmployee ? (
                  <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800">
                    {session.name} ({session.employeeId})
                  </div>
                ) : (
                  <select
                    value={leaveForm.employeeId}
                    onChange={(e) => setLeaveForm({ ...leaveForm, employeeId: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-hidden"
                  >
                    {eligibleModalEmployees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.fullName} ({e.employeeId})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700">Jenis Cuti</label>
                <select
                  value={leaveForm.leaveTypeId}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveTypeId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-hidden"
                >
                  {leaveTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Hak: {t.annualEntitlement} hari)
                    </option>
                  ))}
                </select>
              </div>

              {/* Real-time Leave Balance Indicator Card */}
              {activeLeaveBalance && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-2.5 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-emerald-800 font-medium">
                    <span>Saldo Kuota Cuti {leaveYear}:</span>
                    <span className="font-bold">
                      {activeLeaveBalance.isUnlimited
                        ? 'Tanpa Batas Kuota (Unpaid)'
                        : `Sisa ${activeLeaveBalance.remainingDays} dari ${activeLeaveBalance.totalEntitlement} hari`}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-600 pt-1 border-t border-emerald-200/60 font-mono">
                    <div>Hak: <span className="font-semibold">{activeLeaveBalance.annualEntitlement}d</span></div>
                    <div>Terpakai: <span className="font-semibold text-slate-800">{activeLeaveBalance.usedDays}d</span></div>
                    <div>Pending: <span className="font-semibold text-amber-700">{activeLeaveBalance.pendingDays}d</span></div>
                  </div>
                </div>
              )}

              {/* Real-time Overlap Conflict Warning */}
              {activeConflict.hasConflict && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Bentrok Jadwal Cuti Terdeteksi!</p>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Rentang tanggal bentrok dengan permohonan ({activeConflict.conflictingRequest?.startDate} s.d{' '}
                      {activeConflict.conflictingRequest?.endDate}) berstatus{' '}
                      <span className="font-semibold">
                        {activeConflict.conflictingRequest?.status === 'APPROVED' ? 'Disetujui' : 'Menunggu Approval'}
                      </span>.
                    </p>
                  </div>
                </div>
              )}

              {/* Quota Exceeded Warning */}
              {activeLeaveBalance && !activeLeaveBalance.isUnlimited && leaveForm.totalDays > activeLeaveBalance.remainingDays && (
                <div className="rounded-lg border border-rose-300 bg-rose-50 p-2.5 text-xs text-rose-900 flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Kuota Cuti Tidak Mencukupi!</p>
                    <p className="text-[11px] text-rose-800 mt-0.5">
                      Anda mengajukan <span className="font-bold">{leaveForm.totalDays} hari</span>, sedangkan sisa kuota Anda adalah{' '}
                      <span className="font-bold">{activeLeaveBalance.remainingDays} hari</span>.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-700">Tanggal Mulai</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-700">Tanggal Selesai</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700">Total Hari Kerja</label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  required
                  value={leaveForm.totalDays}
                  onChange={(e) => setLeaveForm({ ...leaveForm, totalDays: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono text-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700">Alasan Permohonan Cuti</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Keterangan keperluan cuti..."
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsLeaveModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs"
                >
                  Kirim Pengajuan Cuti
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ajukan Lembur PP 35/2021 dengan Live Calculation */}
      {isOvertimeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4 backdrop-blur-xs">
          <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900">
              Formulir Pengajuan Lembur (Kalkulasi PP 35/2021)
            </h3>
            <p className="text-xs text-slate-500">
              Sistem menghitung upah lembur secara real-time berdasarkan pasal 31-34 PP 35/2021.
            </p>

            <form onSubmit={handleCreateOvertime} className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-700">Karyawan Pelaksana Lembur</label>
                {isEmployee ? (
                  <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800">
                    {session.name} ({session.employeeId})
                  </div>
                ) : (
                  <select
                    value={otForm.employeeId}
                    onChange={(e) => setOtForm({ ...otForm, employeeId: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-hidden"
                  >
                    {eligibleModalEmployees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.fullName} ({e.employeeId})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-700">Tanggal Pelaksanaan</label>
                  <input
                    type="date"
                    required
                    value={otForm.date}
                    onChange={(e) => setOtForm({ ...otForm, date: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-700">Total Durasi Jam Lembur</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    step={0.5}
                    required
                    value={otForm.durationHours}
                    onChange={(e) => setOtForm({ ...otForm, durationHours: Number(e.target.value) })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono text-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-700">Jam Mulai</label>
                  <input
                    type="time"
                    required
                    value={otForm.startTime}
                    onChange={(e) => setOtForm({ ...otForm, startTime: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono text-slate-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-700">Jam Selesai</label>
                  <input
                    type="time"
                    required
                    value={otForm.endTime}
                    onChange={(e) => setOtForm({ ...otForm, endTime: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono text-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={otForm.isHoliday}
                  onChange={(e) => setOtForm({ ...otForm, isHoliday: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                Lembur pada Hari Libur Resmi / Istirahat Mingguan (Faktor 2.0x+)
              </label>

              <div>
                <label className="text-[11px] font-medium text-slate-700">Rincian Pekerjaan Lembur</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh: Deployment sistem v2.4 dan monitoring live..."
                  value={otForm.reason}
                  onChange={(e) => setOtForm({ ...otForm, reason: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:outline-hidden"
                />
              </div>

              {/* LIVE SIMULATION RESULT */}
              <div className="rounded-lg bg-emerald-50 p-3 border border-emerald-200 text-xs">
                <h5 className="font-bold text-emerald-950">Simulasi Upah Lembur PP 35/2021:</h5>
                <div className="mt-1.5 space-y-1 text-slate-700">
                  <div className="flex justify-between">
                    <span>Upah Per Jam (1/173 × Upah Pokok &amp; Tetap):</span>
                    <span className="font-mono font-semibold">
                      {canViewAllSalaries || otForm.employeeId === session.employeeId
                        ? formatIdr(otPreview.hourlyWage)
                        : '•••••••• (Kerahasiaan Gaji)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bobot Jam Konversi ({otForm.durationHours} Jam Riil):</span>
                    <span className="font-mono font-semibold text-emerald-800">{otPreview.weightedHours} Jam Upah</span>
                  </div>
                  <div className="flex justify-between border-t border-emerald-200 pt-1 font-bold text-slate-900">
                    <span>Estimasi Upah Lembur Diterima:</span>
                    <span className="font-mono text-sm text-emerald-700">
                      {canViewAllSalaries || otForm.employeeId === session.employeeId
                        ? formatIdr(otPreview.overtimePay)
                        : 'Dihitung otomatis di Payroll Engine'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsOvertimeModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs"
                >
                  Kirim Pengajuan Lembur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Konfirmasi Penolakan Cuti / Lembur */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4 backdrop-blur-xs">
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-600 mb-2">
              <XCircle className="h-5 w-5" />
              <h3 className="text-base font-bold text-slate-900">
                Tolak Pengajuan {rejectModal.type === 'LEAVE' ? 'Cuti' : 'Lembur'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Karyawan: <strong>{rejectModal.employeeName}</strong>. Mohon cantumkan alasan penolakan agar tercatat pada audit trail.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-700">Alasan Penolakan</label>
                <textarea
                  rows={3}
                  value={rejectModal.reason}
                  onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                  placeholder="Masukkan alasan..."
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModal({ open: false, type: 'LEAVE', id: '', employeeName: '', reason: '' })}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (rejectModal.type === 'LEAVE') {
                      onRejectLeave(rejectModal.id, rejectModal.reason || 'Kebutuhan operasional mendesak');
                    } else {
                      onRejectOvertime(rejectModal.id, rejectModal.reason || 'Tidak disetujui atasan');
                    }
                    setRejectModal({ open: false, type: 'LEAVE', id: '', employeeName: '', reason: '' });
                  }}
                  className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 shadow-xs"
                >
                  Konfirmasi Penolakan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
