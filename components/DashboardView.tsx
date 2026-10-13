'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CreditCard,
  Building,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  CalendarDays,
  FileCheck2,
  X,
  ShieldCheck,
  Eye,
  FileText,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Employee,
  AttendanceRecord,
  PayrollPeriod,
  LeaveRequest,
  OvertimeRequest,
  UserSession,
} from '@/lib/types';
import { formatIdr } from '@/lib/format';

interface DashboardViewProps {
  employees: Employee[];
  attendances: AttendanceRecord[];
  payrollPeriods: PayrollPeriod[];
  leaveRequests: LeaveRequest[];
  overtimeRequests: OvertimeRequest[];
  session: UserSession;
  onNavigateTab: (tab: string) => void;
  onCheckIn: (location: 'WFO' | 'WFH' | 'CLIENT_SITE') => void;
  onCheckOut: () => void;
  onApproveLeave: (id: string) => void;
  onRejectLeave: (id: string, reason: string) => void;
  onApproveOvertime: (id: string) => void;
  onRejectOvertime: (id: string, reason: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  employees,
  attendances,
  payrollPeriods,
  leaveRequests,
  overtimeRequests,
  session,
  onNavigateTab,
  onCheckIn,
  onCheckOut,
  onApproveLeave,
  onRejectLeave,
  onApproveOvertime,
  onRejectOvertime,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<'WFO' | 'WFH' | 'CLIENT_SITE'>('WFO');
  const [rejectDialog, setRejectDialog] = useState<{
    isOpen: boolean;
    type: 'LEAVE' | 'OVERTIME';
    id: string;
    title: string;
    reason: string;
  }>({
    isOpen: false,
    type: 'LEAVE',
    id: '',
    title: '',
    reason: '',
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendances = attendances.filter((a) => a.date === todayStr);

  const activeEmployees = employees.filter((e) => e.status === 'ACTIVE');
  const presentCount = todayAttendances.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
  const lateCount = todayAttendances.filter((a) => a.status === 'LATE').length;
  const wfhCount = todayAttendances.filter((a) => a.workLocation === 'WFH').length;

  const currentPeriod = payrollPeriods[0] || null;

  // Role permissions
  const canApprove = session.role === 'SUPERADMIN' || session.role === 'ADMIN_PT' || session.role === 'ADMIN_PROJECT';
  const isEmployee = session.role === 'EMPLOYEE';
  const isProjectAdmin = session.role === 'ADMIN_PROJECT';
  const isManager = isProjectAdmin;
  const canViewSalaries = session.role === 'SUPERADMIN' || session.role === 'ADMIN_PT';
  const isAuditor = !canApprove;

  const userRecord = employees.find((e) => e.id === session.employeeId);
  const managerDeptId = userRecord?.departmentId;
  const managerDeptName = managerDeptId === 'dept-eng' ? 'Engineering' : managerDeptId === 'dept-prod' ? 'Product' : managerDeptId === 'dept-hr' ? 'HR' : managerDeptId === 'dept-fin' ? 'Finance' : managerDeptId === 'dept-mkt' ? 'Marketing' : 'Operasional';

  // Scoped employees for Project Admin
  const scopedEmployees = isProjectAdmin
    ? employees.filter((e) => e.projectAssignments?.some((pa) => session.projectIds?.includes(pa.projectId)) || e.id === session.employeeId || e.departmentId === managerDeptId)
    : activeEmployees;

  // Department attendance for Project Admin
  const todayAttList = attendances.filter((a) => a.date === todayStr);
  const managerTeamAtt = isProjectAdmin
    ? todayAttList.filter((a) => scopedEmployees.some((e) => e.id === a.employeeId))
    : todayAttList;
  const managerTeamPresent = managerTeamAtt.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
  const managerTeamLate = managerTeamAtt.filter((a) => a.status === 'LATE').length;
  const managerTeamWfh = managerTeamAtt.filter((a) => a.workLocation === 'WFH').length;
  const managerTeamWfo = managerTeamAtt.filter((a) => a.workLocation === 'WFO').length;
  const managerTeamAbsent = Math.max(0, scopedEmployees.length - managerTeamPresent);

  // Employee personal requests & overtime
  const myLeaves = leaveRequests.filter((l) => l.employeeId === session.employeeId);
  const myOvertimes = overtimeRequests.filter((o) => o.employeeId === session.employeeId);
  const myApprovedOvertimes = myOvertimes.filter((o) => o.status === 'APPROVED');
  const myTotalOvertimeHours = myApprovedOvertimes.reduce((acc, o) => acc + o.durationHours, 0);
  const myTotalOvertimePay = myApprovedOvertimes.reduce((acc, o) => acc + o.overtimePay, 0);
  const myApprovedLeavesCount = myLeaves.filter((l) => l.status === 'APPROVED').reduce((acc, l) => acc + l.totalDays, 0);
  const myRemainingLeaveQuota = Math.max(0, 12 - myApprovedLeavesCount);

  // Pending requests scoped by role
  const pendingLeaves = isProjectAdmin
    ? leaveRequests.filter((l) => l.status === 'PENDING' && scopedEmployees.some((e) => e.id === l.employeeId))
    : leaveRequests.filter((l) => l.status === 'PENDING');

  const pendingOvertimes = isProjectAdmin
    ? overtimeRequests.filter((o) => o.status === 'PENDING' && scopedEmployees.some((e) => e.id === o.employeeId))
    : overtimeRequests.filter((o) => o.status === 'PENDING');

  const totalPendingApprovals = pendingLeaves.length + pendingOvertimes.length;

  // Department distribution data for Recharts
  const deptMap: Record<string, number> = {
    Engineering: 0,
    Product: 0,
    HR: 0,
    Finance: 0,
    Marketing: 0,
    Operations: 0,
  };

  employees.forEach((emp) => {
    if (emp.departmentId === 'dept-eng') deptMap.Engineering++;
    else if (emp.departmentId === 'dept-prod') deptMap.Product++;
    else if (emp.departmentId === 'dept-hr') deptMap.HR++;
    else if (emp.departmentId === 'dept-fin') deptMap.Finance++;
    else if (emp.departmentId === 'dept-mkt') deptMap.Marketing++;
    else if (emp.departmentId === 'dept-ops') deptMap.Operations++;
  });

  const departmentChartData = Object.entries(deptMap).map(([name, total]) => ({
    name,
    total,
  }));

  // Manager Team Attendance Composition
  const managerAttendancePieData = [
    { name: 'WFO (Kantor)', value: managerTeamWfo, color: '#10b981' },
    { name: 'WFH (Remote)', value: managerTeamWfh, color: '#3b82f6' },
    { name: 'Terlambat (>08:30)', value: managerTeamLate, color: '#f59e0b' },
    { name: 'Belum Presensi', value: managerTeamAbsent, color: '#94a3b8' },
  ].filter((item) => item.value > 0);
  // Payroll Cost Composition
  const payrollPieData = currentPeriod
    ? [
        { name: 'Gaji Bersih Karyawan', value: currentPeriod.totalNetPay, color: '#10b981' },
        { name: 'PPh 21 TER (Pajak)', value: currentPeriod.totalPph21, color: '#f59e0b' },
        { name: 'Iuran BPJS Karyawan', value: currentPeriod.totalBpjsEmployee, color: '#3b82f6' },
        { name: 'Beban BPJS Perusahaan', value: currentPeriod.totalBpjsEmployer, color: '#6366f1' },
      ]
    : [];

  // Check user today's attendance status
  const myTodayAtt = attendances.find(
    (a) => a.employeeId === session.employeeId && a.date === todayStr
  );

  const openRejectModal = (type: 'LEAVE' | 'OVERTIME', id: string, title: string) => {
    setRejectDialog({
      isOpen: true,
      type,
      id,
      title,
      reason: type === 'LEAVE' ? 'Kebutuhan tim mendesak pada periode tersebut' : 'Jam kerja lembur belum disetujui atasan',
    });
  };

  const handleConfirmReject = () => {
    if (!rejectDialog.reason.trim()) return;
    if (rejectDialog.type === 'LEAVE') {
      onRejectLeave(rejectDialog.id, rejectDialog.reason);
    } else {
      onRejectOvertime(rejectDialog.id, rejectDialog.reason);
    }
    setRejectDialog({ isOpen: false, type: 'LEAVE', id: '', title: '', reason: '' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4 sm:space-y-6"
    >
      {/* Welcome and Quick Action Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs sm:flex-row sm:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Selamat Datang, {session.name}
            </h2>
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] sm:text-xs font-semibold text-emerald-700 border border-emerald-200">
              {session.role.replace('_', ' ')}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Sistem Informasi SDM &amp; Penggajian PT Elkyno Technology &bull; Standar DJP PP 58/2023 &amp; PP 35/2021
          </p>
        </div>

        {/* Quick ESS Clock-in / Clock-out Card */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50/80 p-3">
          <div className="flex flex-col w-full sm:w-auto">
            <span className="text-[11px] font-semibold text-slate-600 mb-1">
              Presensi Mandiri (ESS):
            </span>
            <div className="flex flex-col xs:flex-row items-stretch sm:items-center gap-2">
              <select
                id="location-select"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value as any)}
                disabled={!!myTodayAtt?.checkOut}
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden"
              >
                <option value="WFO">WFO - Cyber 2 Kuningan</option>
                <option value="WFH">WFH - Rumah</option>
                <option value="CLIENT_SITE">Kunjungan Klien</option>
              </select>

              {!myTodayAtt?.checkIn ? (
                <button
                  id="btn-quick-checkin"
                  type="button"
                  onClick={() => onCheckIn(selectedLocation)}
                  className="rounded-lg bg-emerald-600 px-3.5 py-2 sm:py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors text-center"
                >
                  Clock In
                </button>
              ) : !myTodayAtt.checkOut ? (
                <button
                  id="btn-quick-checkout"
                  type="button"
                  onClick={onCheckOut}
                  className="rounded-lg bg-rose-600 px-3.5 py-2 sm:py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition-colors text-center"
                >
                  Clock Out
                </button>
              ) : (
                <span className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 text-center">
                  Presensi Selesai
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Primary Key Metric Tiles (2 columns on mobile, 4 columns on lg) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {isEmployee ? (
          <>
            {/* Employee Tile 1: My Attendance Status */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-medium text-slate-500">Presensi Hari Ini</span>
                  <div className="rounded-lg bg-emerald-50 p-1.5 sm:p-2 text-emerald-600 border border-emerald-100">
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                </div>
                <div className="mt-2 sm:mt-3">
                  <span className="text-base sm:text-lg font-bold text-slate-900 block truncate">
                    {myTodayAtt ? (myTodayAtt.status === 'PRESENT' ? 'Hadir Tepat Waktu' : 'Terlambat') : 'Belum Presensi'}
                  </span>
                  <span className="text-[10px] sm:text-xs text-slate-500">
                    {myTodayAtt ? `Masuk: ${myTodayAtt.checkIn}` : 'Silakan Clock-In'}
                  </span>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] sm:text-[11px] text-slate-600">
                <span className="truncate">Lokasi: {myTodayAtt?.workLocation || 'Belum'}</span>
                <button
                  onClick={() => onNavigateTab('ATTENDANCE')}
                  className="font-semibold text-emerald-600 hover:underline flex items-center shrink-0 ml-1"
                >
                  Presensi <ArrowUpRight className="h-3 w-3 ml-0.5" />
                </button>
              </div>
            </div>

            {/* Employee Tile 2: My Leave Quota */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-medium text-slate-500">Sisa Hak Cuti</span>
                  <div className="rounded-lg bg-purple-50 p-1.5 sm:p-2 text-purple-600 border border-purple-100">
                    <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                </div>
                <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-bold text-slate-900">{myRemainingLeaveQuota}</span>
                  <span className="text-[11px] text-slate-500">hari tersisa</span>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] sm:text-[11px] text-slate-600">
                <span className="truncate">Terpakai: {myApprovedLeavesCount} hari</span>
                <button
                  onClick={() => onNavigateTab('LEAVE_OVERTIME')}
                  className="font-semibold text-purple-600 hover:underline flex items-center shrink-0 ml-1"
                >
                  Ajukan <ArrowUpRight className="h-3 w-3 ml-0.5" />
                </button>
              </div>
            </div>

            {/* Employee Tile 3: My Overtime */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-medium text-slate-500">Lembur Disetujui</span>
                  <div className="rounded-lg bg-amber-50 p-1.5 sm:p-2 text-amber-600 border border-amber-100">
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                </div>
                <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-bold text-slate-900">{myTotalOvertimeHours}</span>
                  <span className="text-[11px] text-slate-500">Jam (PP 35)</span>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] sm:text-[11px] text-slate-600">
                <span className="truncate font-mono font-medium text-amber-800">{formatIdr(myTotalOvertimePay)}</span>
                <button
                  onClick={() => onNavigateTab('LEAVE_OVERTIME')}
                  className="font-semibold text-amber-600 hover:underline flex items-center shrink-0 ml-1"
                >
                  Rincian <ArrowUpRight className="h-3 w-3 ml-0.5" />
                </button>
              </div>
            </div>

            {/* Employee Tile 4: My Payslip Status */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-medium text-slate-500">Slip Gaji Mandiri</span>
                  <div className="rounded-lg bg-indigo-50 p-1.5 sm:p-2 text-indigo-600 border border-indigo-100">
                    <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                </div>
                <div className="mt-2 sm:mt-3">
                  <span className="text-sm sm:text-base font-bold text-slate-900 block truncate">
                    {currentPeriod?.name || 'Periode Maret 2026'}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="h-3 w-3" /> Siap Unduh (PPh 21 TER)
                  </span>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] sm:text-[11px] text-slate-600">
                <span className="truncate">Status: <strong className="text-emerald-700">{currentPeriod?.status}</strong></span>
                <button
                  onClick={() => onNavigateTab('PAYROLL')}
                  className="font-semibold text-indigo-600 hover:underline flex items-center shrink-0 ml-1"
                >
                  Buka Slip <ArrowUpRight className="h-3 w-3 ml-0.5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Metric 1: Total Employees (Scoped for Manager) */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-medium text-slate-500">
                    {isManager ? `Staf Divisi ${managerDeptName}` : 'Karyawan Aktif'}
                  </span>
                  <div className="rounded-lg bg-blue-50 p-1.5 sm:p-2 text-blue-600 border border-blue-100">
                    <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                </div>
                <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-bold text-slate-900">
                    {isManager ? scopedEmployees.length : activeEmployees.length}
                  </span>
                  <span className="text-[11px] text-slate-500">orang</span>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] sm:text-[11px] text-slate-600">
                <span className="truncate">{isManager ? `Departemen ${managerDeptName}` : 'Tetap: 48'}</span>
                <button
                  onClick={() => onNavigateTab('EMPLOYEES')}
                  className="font-semibold text-blue-600 hover:underline flex items-center shrink-0 ml-1"
                >
                  Lihat <ArrowUpRight className="h-3 w-3 ml-0.5" />
                </button>
              </div>
            </div>

            {/* Metric 2: Today Attendance (Scoped for Manager) */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-medium text-slate-500">
                    {isManager ? 'Kehadiran Tim Hari Ini' : 'Kehadiran Hari Ini'}
                  </span>
                  <div className="rounded-lg bg-emerald-50 p-1.5 sm:p-2 text-emerald-600 border border-emerald-100">
                    <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                </div>
                <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-bold text-slate-900">
                    {isManager ? managerTeamPresent : presentCount}
                  </span>
                  <span className="text-[10px] sm:text-xs font-medium text-emerald-600">
                    ({Math.round(((isManager ? managerTeamPresent : presentCount) / Math.max(isManager ? scopedEmployees.length : activeEmployees.length, 1)) * 100)}%)
                  </span>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] sm:text-[11px] text-slate-600">
                <span className="truncate">Telat: {isManager ? managerTeamLate : lateCount}</span>
                <button
                  onClick={() => onNavigateTab('ATTENDANCE')}
                  className="font-semibold text-emerald-600 hover:underline flex items-center shrink-0 ml-1"
                >
                  Presensi <ArrowUpRight className="h-3 w-3 ml-0.5" />
                </button>
              </div>
            </div>

            {/* Metric 3: Manager Remote Work vs Corporate Payroll */}
            {isManager ? (
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] sm:text-xs font-medium text-slate-500">Bekerja WFH (Remote)</span>
                    <div className="rounded-lg bg-indigo-50 p-1.5 sm:p-2 text-indigo-600 border border-indigo-100">
                      <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5">
                    <span className="text-xl sm:text-2xl font-bold text-slate-900">{managerTeamWfh}</span>
                    <span className="text-[11px] text-slate-500">anggota tim</span>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] sm:text-[11px] text-slate-600">
                  <span className="truncate">WFO: {managerTeamWfo} orang</span>
                  <button
                    onClick={() => onNavigateTab('ATTENDANCE')}
                    className="font-semibold text-indigo-600 hover:underline flex items-center shrink-0 ml-1"
                  >
                    Presensi <ArrowUpRight className="h-3 w-3 ml-0.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] sm:text-xs font-medium text-slate-500">Payroll Periode</span>
                    <div className="rounded-lg bg-indigo-50 p-1.5 sm:p-2 text-indigo-600 border border-indigo-100">
                      <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-3">
                    <span className="text-sm sm:text-xl font-bold font-mono text-slate-900 block truncate">
                      {currentPeriod ? formatIdr(currentPeriod.totalNetPay) : 'Rp 0'}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] sm:text-[11px] text-slate-600">
                  <span className="truncate">Status: <strong className="text-amber-600">{currentPeriod?.status}</strong></span>
                  <button
                    onClick={() => onNavigateTab('PAYROLL')}
                    className="font-semibold text-indigo-600 hover:underline flex items-center shrink-0 ml-1"
                  >
                    Rincian <ArrowUpRight className="h-3 w-3 ml-0.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Metric 4: Pending Approvals */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-medium text-slate-500">
                    {isManager ? 'Verifikasi Tim Tertunda' : 'Verifikasi Tertunda'}
                  </span>
                  <div className="rounded-lg bg-amber-50 p-1.5 sm:p-2 text-amber-600 border border-amber-100">
                    <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                </div>
                <div className="mt-2 sm:mt-3 flex items-baseline gap-1.5">
                  <span className="text-xl sm:text-2xl font-bold text-slate-900">{totalPendingApprovals}</span>
                  <span className="text-[10px] sm:text-xs text-amber-600 font-medium">butuh aksi</span>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] sm:text-[11px] text-slate-600">
                <span className="truncate">Cuti: {pendingLeaves.length} | Lembur: {pendingOvertimes.length}</span>
                <button
                  onClick={() => onNavigateTab('LEAVE_OVERTIME')}
                  className="font-semibold text-amber-600 hover:underline flex items-center shrink-0 ml-1"
                >
                  Proses <ArrowUpRight className="h-3 w-3 ml-0.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Visual Charts: Department Headcount & Payroll Cost Composition */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Headcount by Department */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-slate-900">Distribusi Karyawan per Departemen</h3>
              <p className="text-[11px] sm:text-xs text-slate-500">Struktur organisasi dan persebaran divisi PT NTM</p>
            </div>
            <span className="text-xs font-mono font-medium text-slate-500">52 Pegawai</span>
          </div>
          <div className="mt-4 h-60 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={45} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val: any) => [`${val} Orang`, 'Jumlah Karyawan']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="total" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Manager Team Attendance or Corporate Payroll Expenses */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-slate-900">
                {isManager ? 'Status Kehadiran Tim Divisi Hari Ini' : 'Komposisi Beban Penggajian & Pajak'}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500">
                {isManager
                  ? `Persebaran kerja staf divisi ${managerDeptName} per ${todayStr}`
                  : 'Rincian Take Home Pay, PPh 21 TER, & Iuran BPJS'}
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {isManager ? `${scopedEmployees.length} Staf Tim` : `Periode ${currentPeriod?.code}`}
            </span>
          </div>
          <div className="mt-4 h-60 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={isManager ? managerAttendancePieData : payrollPieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {(isManager ? managerAttendancePieData : payrollPieData).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [isManager ? `${val} Orang` : formatIdr(Number(val)), isManager ? 'Jumlah' : 'Nominal']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Pending Approvals Action Center / ESS Personal Status */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
        {isEmployee ? (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Status Pengajuan Mandiri Saya (Cuti &amp; Lembur)
                </h3>
                <p className="text-xs text-slate-500">
                  Pantau persetujuan pengajuan operasional Anda oleh Atasan / HR
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateTab('LEAVE_OVERTIME')}
                className="self-start sm:self-auto rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                + Ajukan Baru
              </button>
            </div>

            {myLeaves.length === 0 && myOvertimes.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Anda belum memiliki riwayat pengajuan cuti atau lembur pada periode berjalan.
              </div>
            ) : (
              <div className="mt-3 divide-y divide-slate-100">
                {myLeaves.map((l) => (
                  <div key={l.id} className="flex items-center justify-between py-3 gap-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-purple-50 p-2 text-purple-600 border border-purple-100 shrink-0">
                        <CalendarDays className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">Cuti: {l.leaveTypeId}</span>
                          <span className="text-[10px] text-slate-500">({l.totalDays} hari)</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {l.startDate} s.d. {l.endDate} &bull; &quot;{l.reason}&quot;
                        </p>
                      </div>
                    </div>
                    <div>
                      {l.status === 'PENDING' && (
                        <span className="rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 text-xs font-medium">
                          Menunggu Persetujuan
                        </span>
                      )}
                      {l.status === 'APPROVED' && (
                        <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium">
                          Disetujui
                        </span>
                      )}
                      {l.status === 'REJECTED' && (
                        <span className="rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 text-xs font-medium">
                          Ditolak: {l.rejectionReason || '-'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {myOvertimes.map((ot) => (
                  <div key={ot.id} className="flex items-center justify-between py-3 gap-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-amber-50 p-2 text-amber-600 border border-amber-100 shrink-0">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">Lembur: {ot.date}</span>
                          <span className="text-[10px] text-slate-500">({ot.durationHours} Jam)</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {ot.startTime} - {ot.endTime} &bull; Est. Upah: {formatIdr(ot.overtimePay)}
                        </p>
                      </div>
                    </div>
                    <div>
                      {ot.status === 'PENDING' && (
                        <span className="rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 text-xs font-medium">
                          Menunggu Persetujuan
                        </span>
                      )}
                      {ot.status === 'APPROVED' && (
                        <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium">
                          Disetujui
                        </span>
                      )}
                      {ot.status === 'REJECTED' && (
                        <span className="rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 text-xs font-medium">
                          Ditolak: {ot.rejectionReason || '-'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Daftar Pengajuan Butuh Verifikasi (Persetujuan Cuti &amp; Lembur)
                </h3>
                <p className="text-xs text-slate-500">
                  {isAuditor
                    ? 'Tinjauan kepatuhan permohonan operasional (Hak akses Auditor hanya-baca)'
                    : 'Manajer dan HR dapat langsung menyetujui atau menolak pengajuan operasional tim'}
                </p>
              </div>
              <span className="self-start sm:self-auto rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200">
                {totalPendingApprovals} Menunggu
              </span>
            </div>

            {totalPendingApprovals === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Tidak ada pengajuan cuti atau lembur yang menunggu persetujuan saat ini.
              </div>
            ) : (
              <div className="mt-3 divide-y divide-slate-100">
                {/* Pending Leaves */}
                {pendingLeaves.map((leave) => {
                  const emp = employees.find((e) => e.id === leave.employeeId);
                  return (
                    <div key={leave.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-3">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-purple-50 p-2 text-purple-600 border border-purple-100 shrink-0">
                          <CalendarDays className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">{emp?.fullName || leave.employeeId}</span>
                            <span className="rounded bg-purple-50 text-purple-700 px-1.5 py-0.2 text-[10px] font-semibold border border-purple-200">
                              Cuti ({leave.totalDays} hari)
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Tanggal: <strong>{leave.startDate} s.d. {leave.endDate}</strong> &bull; Alasan: &quot;{leave.reason}&quot;
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                        {leave.employeeId === session.employeeId ? (
                          <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded border border-amber-200 text-center">
                            Pengajuan Mandiri (Menunggu Atasan)
                          </span>
                        ) : canApprove ? (
                          <>
                            <button
                              type="button"
                              onClick={() => onApproveLeave(leave.id)}
                              className="w-full sm:w-auto text-center rounded-lg bg-emerald-600 px-3 py-2 sm:py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs"
                            >
                              Setujui
                            </button>
                            <button
                              type="button"
                              onClick={() => openRejectModal('LEAVE', leave.id, `Cuti: ${emp?.fullName || leave.employeeId}`)}
                              className="w-full sm:w-auto text-center rounded-lg border border-slate-300 px-3 py-2 sm:py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Tolak
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                            Mode Review ({session.role.replace('_', ' ')})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Pending Overtimes */}
                {pendingOvertimes.map((ot) => {
                  const emp = employees.find((e) => e.id === ot.employeeId);
                  return (
                    <div key={ot.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-3">
                      <div className="flex items-start gap-3">
                        <div className="rounded-lg bg-amber-50 p-2 text-amber-600 border border-amber-100 shrink-0">
                          <Clock className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">{emp?.fullName || ot.employeeId}</span>
                            <span className="rounded bg-amber-50 text-amber-700 px-1.5 py-0.2 text-[10px] font-semibold border border-amber-200">
                              Lembur PP 35/2021 ({ot.durationHours} Jam)
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Waktu: <strong>{ot.date} ({ot.startTime} - {ot.endTime})</strong>
                            {canViewSalaries || ot.employeeId === session.employeeId ? (
                              <span> &bull; Est. Upah: <strong>{formatIdr(ot.overtimePay)}</strong></span>
                            ) : null}
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Tugas: &quot;{ot.reason}&quot;
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                        {ot.employeeId === session.employeeId ? (
                          <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded border border-amber-200 text-center">
                            Pengajuan Mandiri (Menunggu Atasan)
                          </span>
                        ) : canApprove ? (
                          <>
                            <button
                              type="button"
                              onClick={() => onApproveOvertime(ot.id)}
                              className="w-full sm:w-auto text-center rounded-lg bg-emerald-600 px-3 py-2 sm:py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs"
                            >
                              Setujui
                            </button>
                            <button
                              type="button"
                              onClick={() => openRejectModal('OVERTIME', ot.id, `Lembur: ${emp?.fullName || ot.employeeId}`)}
                              className="w-full sm:w-auto text-center rounded-lg border border-slate-300 px-3 py-2 sm:py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              Tolak
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                            Mode Review ({session.role.replace('_', ' ')})
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Accessible Rejection Modal (No window.prompt) */}
      {rejectDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-rose-50 p-1.5 text-rose-600">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  Tolak Pengajuan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectDialog({ ...rejectDialog, isOpen: false })}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 space-y-3">
              <p className="text-xs text-slate-600">
                Pengajuan: <strong className="text-slate-900">{rejectDialog.title}</strong>
              </p>
              <div>
                <label className="block text-[11px] font-medium text-slate-700">
                  Alasan Penolakan (Audit Trail):
                </label>
                <textarea
                  rows={3}
                  value={rejectDialog.reason}
                  onChange={(e) => setRejectDialog({ ...rejectDialog, reason: e.target.value })}
                  placeholder="Tulis alasan penolakan yang jelas..."
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-rose-500 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setRejectDialog({ ...rejectDialog, isOpen: false })}
                className="flex-1 sm:flex-initial rounded-lg border border-slate-300 px-3.5 py-2 sm:py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="flex-1 sm:flex-initial rounded-lg bg-rose-600 px-4 py-2 sm:py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
              >
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

