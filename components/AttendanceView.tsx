'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Calendar,
  Building,
  Home,
  Briefcase,
  UserCheck,
  Edit3,
  Check,
  X,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import { AttendanceRecord, Employee, UserSession, Branch } from '@/lib/types';
import { formatTimeId, formatDateId } from '@/lib/format';
import { checkPermission } from '@/lib/security/authorization';

interface AttendanceViewProps {
  attendances: AttendanceRecord[];
  employees: Employee[];
  branches?: Branch[];
  session: UserSession;
  onCheckIn: (location: 'WFO' | 'WFH' | 'CLIENT_SITE') => void;
  onCheckOut: () => void;
  onRequestCorrection?: (
    attendanceId: string,
    proposedCheckIn?: string,
    proposedCheckOut?: string,
    notes?: string
  ) => Promise<void> | void;
  onApproveCorrection?: (attendanceId: string) => Promise<void> | void;
  onRejectCorrection?: (attendanceId: string, reason: string) => Promise<void> | void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  attendances,
  employees,
  branches = [],
  session,
  onCheckIn,
  onCheckOut,
  onRequestCorrection,
  onApproveCorrection,
  onRejectCorrection,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<'WFO' | 'WFH' | 'CLIENT_SITE'>('WFO');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'RECORDS' | 'CORRECTIONS'>('RECORDS');

  // Modal states
  const [correctionModal, setCorrectionModal] = useState<{
    open: boolean;
    record: AttendanceRecord | null;
    proposedCheckIn: string;
    proposedCheckOut: string;
    notes: string;
  }>({
    open: false,
    record: null,
    proposedCheckIn: '',
    proposedCheckOut: '',
    notes: '',
  });

  const [rejectModal, setRejectModal] = useState<{
    open: boolean;
    attendanceId: string;
    employeeName: string;
    reason: string;
  }>({
    open: false,
    attendanceId: '',
    employeeName: '',
    reason: '',
  });

  const isEmployee = session.role === 'EMPLOYEE';
  const isManager = session.role === 'ADMIN_PROJECT';
  const canApproveAttendance = checkPermission(session.role, 'attendance.approve');
  const todayStr = new Date().toISOString().split('T')[0];
  const myRecord = attendances.find(
    (a) => a.employeeId === session.employeeId && a.date === todayStr
  );

  const managerRecord = employees.find((e) => e.id === session.employeeId);
  const managerDeptId = managerRecord?.departmentId;

  // Branch-specific work schedule for current user
  const myEmployee = employees.find((e) => e.id === session.employeeId);
  const myBranch = branches.find((b) => b.id === myEmployee?.branchId);
  const branchStart = myBranch?.workStartTime || '08:30';
  const branchEnd = myBranch?.workEndTime || '17:00';
  const branchName = myBranch?.name || 'Cyber 2 Tower (Jakarta Selatan)';

  // Department-scoped employees for manager
  const scopedEmployees = isManager
    ? employees.filter((e) => e.departmentId === managerDeptId || e.id === session.employeeId)
    : employees;

  const todayList = attendances.filter((a) => a.date === todayStr);

  const scopedTodayList = isManager
    ? todayList.filter((a) => {
        if (a.employeeId === session.employeeId) return true;
        const emp = employees.find((e) => e.id === a.employeeId);
        return emp?.departmentId === managerDeptId;
      })
    : todayList;

  const rawList = isEmployee
    ? attendances.filter((a) => a.employeeId === session.employeeId)
    : scopedTodayList;

  const filteredList = rawList.filter((a) => {
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'LATE') return a.status === 'LATE';
    if (filterStatus === 'PRESENT') return a.status === 'PRESENT';
    if (filterStatus === 'WFH') return a.workLocation === 'WFH';
    if (filterStatus === 'WFO') return a.workLocation === 'WFO';
    if (filterStatus === 'CORRECTION_PENDING') return a.isCorrected && a.approvalStatus === 'PENDING';
    return true;
  });

  // Pending corrections list based on scope
  const allPendingCorrections = attendances.filter(
    (a) => a.isCorrected && a.approvalStatus === 'PENDING'
  );

  const scopedPendingCorrections = isEmployee
    ? allPendingCorrections.filter((a) => a.employeeId === session.employeeId)
    : isManager
    ? allPendingCorrections.filter((a) => {
        const emp = employees.find((e) => e.id === a.employeeId);
        return (
          emp?.managerId === session.employeeId ||
          (managerRecord && emp?.managerId === managerRecord.employeeId) ||
          emp?.departmentId === managerDeptId
        );
      })
    : allPendingCorrections;

  const handleOpenCorrection = (record: AttendanceRecord) => {
    const existingIn = record.proposedCheckIn
      ? record.proposedCheckIn.split('T')[1]?.slice(0, 5) || ''
      : record.checkIn
      ? record.checkIn.split('T')[1]?.slice(0, 5) || ''
      : '08:30';

    const existingOut = record.proposedCheckOut
      ? record.proposedCheckOut.split('T')[1]?.slice(0, 5) || ''
      : record.checkOut
      ? record.checkOut.split('T')[1]?.slice(0, 5) || ''
      : '17:00';

    setCorrectionModal({
      open: true,
      record,
      proposedCheckIn: existingIn,
      proposedCheckOut: existingOut,
      notes: record.correctionNotes || '',
    });
  };

  const handleSubmitCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionModal.record) return;
    if (!correctionModal.notes.trim()) {
      alert('Alasan / keterangan koreksi wajib diisi!');
      return;
    }

    const rec = correctionModal.record;
    const dateStr = rec.date;
    const fullProposedIn = correctionModal.proposedCheckIn
      ? `${dateStr}T${correctionModal.proposedCheckIn}:00+07:00`
      : undefined;
    const fullProposedOut = correctionModal.proposedCheckOut
      ? `${dateStr}T${correctionModal.proposedCheckOut}:00+07:00`
      : undefined;

    if (onRequestCorrection) {
      onRequestCorrection(rec.id, fullProposedIn, fullProposedOut, correctionModal.notes);
    }
    setCorrectionModal({
      open: false,
      record: null,
      proposedCheckIn: '',
      proposedCheckOut: '',
      notes: '',
    });
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModal.reason.trim()) {
      alert('Alasan penolakan wajib diisi untuk kepatuhan audit trail.');
      return;
    }
    if (onRejectCorrection) {
      onRejectCorrection(rejectModal.attendanceId, rejectModal.reason);
    }
    setRejectModal({
      open: false,
      attendanceId: '',
      employeeName: '',
      reason: '',
    });
  };

  const presentCount = scopedTodayList.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
  const lateCount = scopedTodayList.filter((a) => a.status === 'LATE').length;
  const wfhCount = scopedTodayList.filter((a) => a.workLocation === 'WFH').length;
  const totalRelevantEmployees = scopedEmployees.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          {isEmployee ? 'Presensi & Kehadiran Mandiri (ESS)' : 'Presensi & Kehadiran (ESS & HR Ops)'}
        </h2>
        <p className="text-xs text-slate-500">
          Pencatatan Jam Kerja Real-time, Verifikasi Lokasi (WFO/WFH) & Perhitungan Keterlambatan Otomatis
        </p>
      </div>

      {/* ESS Clock-In Interactive Panel */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <UserCheck className="h-3.5 w-3.5" /> Portal Karyawan Mandiri (ESS)
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                <Building className="h-3 w-3" /> {branchName}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              Presensi Hari Ini: {session.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Jadwal Cabang: <strong className="text-slate-800">{branchStart} - {branchEnd} WIB</strong> &bull; Batas Masuk: <strong className="text-slate-800">{branchStart} WIB</strong>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Location Selector */}
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 p-1 bg-slate-50">
              <button
                type="button"
                onClick={() => setSelectedLocation('WFO')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedLocation === 'WFO'
                    ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building className="h-3.5 w-3.5" />
                <span>WFO ({myBranch?.name ? myBranch.name.split(' ')[0] : 'Kantor'})</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedLocation('WFH')}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedLocation === 'WFH'
                    ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Home className="h-3.5 w-3.5" />
                <span>WFH (Rumah)</span>
              </button>
            </div>

            {/* Action Buttons */}
            {!myRecord?.checkIn ? (
              <button
                id="btn-main-checkin"
                type="button"
                onClick={() => onCheckIn(selectedLocation)}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 active:scale-98 transition-all"
              >
                <Clock className="h-4 w-4" />
                <span>Clock In Sekarang</span>
              </button>
            ) : !myRecord.checkOut ? (
              <button
                id="btn-main-checkout"
                type="button"
                onClick={onCheckOut}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 active:scale-98 transition-all"
              >
                <Clock className="h-4 w-4" />
                <span>Clock Out (Pulang)</span>
              </button>
            ) : (
              <div className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-100 px-4 py-2.5 text-xs font-semibold text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Presensi Hari Ini Selesai</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Breakdown for current user */}
        {myRecord && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Jam Masuk:</span>
              <p className="font-mono font-bold text-slate-900 mt-0.5 text-sm">
                {formatTimeId(myRecord.checkIn)}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Jam Keluar:</span>
              <p className="font-mono font-bold text-slate-900 mt-0.5 text-sm">
                {myRecord.checkOut ? formatTimeId(myRecord.checkOut) : 'Aktif Bekerja'}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Status:</span>
              <p className="font-semibold text-slate-900 mt-0.5">
                {myRecord.status === 'LATE' ? (
                  <span className="text-amber-700 font-bold">Terlambat (+{myRecord.lateDurationMin}m)</span>
                ) : (
                  <span className="text-emerald-700 font-bold">Tepat Waktu</span>
                )}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200">
              <span className="text-slate-500 block text-[11px]">Lokasi Kerja:</span>
              <p className="font-semibold text-slate-900 mt-0.5 truncate">
                {myRecord.workLocation === 'WFO' ? 'WFO (Cyber 2)' : 'WFH (Remote)'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation: Records vs Corrections */}
      <div className="border-b border-slate-200 flex items-center justify-between">
        <nav className="flex space-x-4">
          <button
            type="button"
            onClick={() => setActiveTab('RECORDS')}
            className={`flex items-center gap-2 border-b-2 py-3 px-1 text-xs font-semibold transition-colors ${
              activeTab === 'RECORDS'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Daftar Presensi ({filteredList.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('CORRECTIONS')}
            className={`flex items-center gap-2 border-b-2 py-3 px-1 text-xs font-semibold transition-colors ${
              activeTab === 'CORRECTIONS'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Edit3 className="h-4 w-4" />
            <span>
              Verifikasi Koreksi Presensi
              {scopedPendingCorrections.length > 0 && (
                <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] text-white">
                  {scopedPendingCorrections.length}
                </span>
              )}
            </span>
          </button>
        </nav>
      </div>

      {/* TAB 1: ATTENDANCE ROSTER */}
      {activeTab === 'RECORDS' && (
        <div className="space-y-4">
          {/* Summary Stats Cards */}
          {isEmployee ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-xs font-medium text-slate-500">Total Kehadiran Saya</span>
                <p className="text-2xl font-bold text-slate-900 mt-1">{rawList.length}</p>
                <span className="text-[11px] text-emerald-600 font-medium">
                  Tercatat dalam log sistem HRIS
                </span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-xs font-medium text-slate-500">Status Hari Ini</span>
                <p className="text-2xl font-bold text-emerald-700 mt-1">
                  {myRecord ? (myRecord.status === 'LATE' ? 'Terlambat' : 'Hadir') : 'Belum Presensi'}
                </p>
                <span className="text-[11px] text-slate-500">
                  {myRecord ? `Jam masuk: ${formatTimeId(myRecord.checkIn)}` : `Batas masuk: ${branchStart} WIB`}
                </span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-xs font-medium text-slate-500">Lokasi &amp; Cabang</span>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {myRecord ? (myRecord.workLocation === 'WFO' ? 'WFO (Kantor)' : 'WFH (Remote)') : '-'}
                </p>
                <span className="text-[11px] text-slate-500">{branchName}</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-xs font-medium text-slate-500">
                  {isManager ? 'Tim Hadir Hari Ini' : 'Karyawan Hadir Hari Ini'}
                </span>
                <p className="text-2xl font-bold text-slate-900 mt-1">{presentCount}</p>
                <span className="text-[11px] text-emerald-600 font-medium">
                  {Math.round((presentCount / Math.max(totalRelevantEmployees, 1)) * 100)}% dari {totalRelevantEmployees} staf {isManager ? 'divisi' : 'perusahaan'}
                </span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-xs font-medium text-slate-500">Keterlambatan Jam Kerja</span>
                <p className="text-2xl font-bold text-amber-600 mt-1">{lateCount}</p>
                <span className="text-[11px] text-slate-500">Dihitung otomatis per jadwal cabang</span>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-xs font-medium text-slate-500">Karyawan WFH (Remote)</span>
                <p className="text-2xl font-bold text-blue-600 mt-1">{wfhCount}</p>
                <span className="text-[11px] text-slate-500">Sesuai approval kebijakan hybrid-work</span>
              </div>
            </div>
          )}

          {/* Attendance Roster Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-slate-100 gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {isEmployee
                    ? 'Riwayat Presensi Mandiri'
                    : isManager
                    ? 'Rekapitulasi Kehadiran Tim Divisi'
                    : 'Rekapitulasi Kehadiran Harian'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isEmployee
                    ? `Menampilkan ${filteredList.length} rekaman presensi Anda`
                    : isManager
                    ? `Daftar presensi tim divisi Anda pada ${formatDateId(todayStr)}`
                    : `Daftar presensi seluruh pegawai pada ${formatDateId(todayStr)}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="PRESENT">Tepat Waktu</option>
                  <option value="LATE">Terlambat</option>
                  <option value="WFH">WFH Saja</option>
                  <option value="WFO">WFO Saja</option>
                  <option value="CORRECTION_PENDING">Koreksi Pending</option>
                </select>
              </div>
            </div>

            {/* MOBILE VIEW: Attendance Cards */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  Tidak ada data kehadiran yang sesuai filter.
                </div>
              ) : (
                filteredList.map((record) => {
                  const emp = employees.find((e) => e.id === record.employeeId);
                  const empBranch = branches.find((b) => b.id === emp?.branchId);
                  return (
                    <div key={`mob-att-${record.id}`} className="p-3.5 space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-900 leading-tight">
                            {emp?.fullName || record.employeeId}
                          </h4>
                          <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                            {emp?.employeeId} &bull; {empBranch?.name ? empBranch.name.split(' ')[0] : 'Kantor'}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                              record.status === 'LATE'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {record.status === 'LATE' ? 'Terlambat' : 'Tepat Waktu'}
                          </span>
                          {record.isCorrected && (
                            <span
                              className={`rounded-full px-2 py-0.2 text-[9px] font-semibold ${
                                record.approvalStatus === 'PENDING'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : record.approvalStatus === 'APPROVED'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {record.approvalStatus === 'PENDING'
                                ? 'Koreksi Ditinjau'
                                : record.approvalStatus === 'APPROVED'
                                ? 'Terkoreksi'
                                : 'Koreksi Ditolak'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-50 p-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Masuk</span>
                          <p className="font-mono font-bold text-slate-800">
                            {formatTimeId(record.checkIn)}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Keluar</span>
                          <p className="font-mono text-slate-700">
                            {record.checkOut ? formatTimeId(record.checkOut) : '--:--'}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Keterlambatan</span>
                          <p className="font-mono">
                            {record.lateDurationMin > 0 ? (
                              <span className="text-amber-700 font-bold">+{record.lateDurationMin}m</span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                        <span className="text-[11px] text-slate-500">
                          {formatDateId(record.date)}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenCorrection(record)}
                            disabled={record.isCorrected && record.approvalStatus === 'PENDING'}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          >
                            <Edit3 className="h-3 w-3" />
                            {record.isCorrected && record.approvalStatus === 'PENDING'
                              ? 'Ditinjau'
                              : 'Koreksi'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* DESKTOP VIEW: Attendance Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Nama Pegawai</th>
                    <th className="px-4 py-3">Tanggal</th>
                    <th className="px-4 py-3">Cabang &amp; Jam</th>
                    <th className="px-4 py-3">Jam Masuk</th>
                    <th className="px-4 py-3">Jam Keluar</th>
                    <th className="px-4 py-3">Keterlambatan</th>
                    <th className="px-4 py-3">Lokasi</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredList.map((record) => {
                    const emp = employees.find((e) => e.id === record.employeeId);
                    const empBranch = branches.find((b) => b.id === emp?.branchId);
                    return (
                      <tr key={record.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{emp?.fullName || record.employeeId}</div>
                          <div className="text-[11px] font-mono text-slate-400">{emp?.employeeId}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {formatDateId(record.date)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-[11px] font-medium text-slate-700 block">
                            {empBranch?.name ? empBranch.name.split(' ')[0] : 'Kantor Pusat'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {empBranch?.workStartTime || '08:30'} - {empBranch?.workEndTime || '17:00'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-slate-800 whitespace-nowrap">
                          {formatTimeId(record.checkIn)}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                          {record.checkOut ? formatTimeId(record.checkOut) : '--:--'}
                        </td>
                        <td className="px-4 py-3 font-mono whitespace-nowrap">
                          {record.lateDurationMin > 0 ? (
                            <span className="text-amber-700 font-semibold">+{record.lateDurationMin} mnt</span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium ${
                              record.workLocation === 'WFO'
                                ? 'bg-slate-100 text-slate-800'
                                : 'bg-blue-50 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {record.workLocation === 'WFO' ? <Building className="h-3 w-3" /> : <Home className="h-3 w-3" />}
                            {record.workLocation}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                                record.status === 'LATE'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {record.status === 'LATE' ? 'Terlambat' : 'Hadir Tepat Waktu'}
                            </span>
                            {record.isCorrected && (
                              <span
                                className={`rounded-full px-2 py-0.2 text-[9px] font-medium ${
                                  record.approvalStatus === 'PENDING'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : record.approvalStatus === 'APPROVED'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {record.approvalStatus === 'PENDING'
                                  ? 'Koreksi Pending'
                                  : record.approvalStatus === 'APPROVED'
                                  ? 'Terkoreksi'
                                  : 'Ditolak'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenCorrection(record)}
                            disabled={record.isCorrected && record.approvalStatus === 'PENDING'}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-40"
                          >
                            <Edit3 className="h-3 w-3" />
                            {record.isCorrected && record.approvalStatus === 'PENDING'
                              ? 'Ditinjau'
                              : 'Koreksi'}
                          </button>
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

      {/* TAB 2: CORRECTIONS VERIFICATION PANEL */}
      {activeTab === 'CORRECTIONS' && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">
              Pengajuan Koreksi Presensi ({scopedPendingCorrections.length})
            </h3>
            <p className="text-xs text-slate-500">
              Verifikasi perubahan jam masuk/pulang presensi yang diajukan oleh karyawan atau manajer.
            </p>
          </div>

          {scopedPendingCorrections.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-50" />
              Tidak ada permohonan koreksi presensi yang sedang menunggu persetujuan.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {scopedPendingCorrections.map((rec) => {
                const emp = employees.find((e) => e.id === rec.employeeId);
                const isSelf = rec.employeeId === session.employeeId;

                return (
                  <div key={`corr-${rec.id}`} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {emp?.fullName || rec.employeeId}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">({emp?.employeeId})</span>
                        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                          Menunggu Review
                        </span>
                      </div>

                      <p className="text-xs text-slate-600">
                        Tanggal Presensi: <strong className="text-slate-800">{formatDateId(rec.date)}</strong>
                      </p>

                      <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200 max-w-lg">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-semibold">Tercatat Semula</span>
                          <span className="font-mono text-slate-700 text-xs">
                            In: {formatTimeId(rec.checkIn)} &bull; Out: {rec.checkOut ? formatTimeId(rec.checkOut) : '--:--'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-emerald-700 block uppercase font-semibold">Usulan Koreksi</span>
                          <span className="font-mono text-emerald-800 font-semibold text-xs">
                            In: {rec.proposedCheckIn ? formatTimeId(rec.proposedCheckIn) : '--:--'} &bull; Out: {rec.proposedCheckOut ? formatTimeId(rec.proposedCheckOut) : '--:--'}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600">
                        <span className="font-medium text-slate-700">Alasan:</span> {rec.correctionNotes || 'Tidak ada catatan.'}
                      </p>
                    </div>

                    {/* Action buttons with Anti-Self-Approval guard */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isSelf ? (
                        <div className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
                          <ShieldAlert className="h-4 w-4" />
                          <span>Anti-Self-Approval: Menunggu atasan</span>
                        </div>
                      ) : canApproveAttendance ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onApproveCorrection && onApproveCorrection(rec.id)}
                            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs transition-colors"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Setujui</span>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setRejectModal({
                                open: true,
                                attendanceId: rec.id,
                                employeeName: emp?.fullName || rec.employeeId,
                                reason: '',
                              })
                            }
                            className="flex items-center gap-1 rounded-lg border border-rose-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Tolak</span>
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Hanya dapat ditinjau oleh atasan</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Ajukan Koreksi Presensi */}
      {correctionModal.open && correctionModal.record && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Ajukan Koreksi Presensi</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Koreksi akan dikirim ke atasan langsung untuk verifikasi dan persetujuan.
            </p>

            <form onSubmit={handleSubmitCorrection} className="mt-4 space-y-3.5">
              <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200 text-xs">
                <span className="text-slate-500 block text-[11px]">Tanggal Presensi:</span>
                <span className="font-semibold text-slate-800">{formatDateId(correctionModal.record.date)}</span>
                <div className="grid grid-cols-2 gap-2 mt-1.5 pt-1.5 border-t border-slate-200/60 font-mono text-[11px] text-slate-600">
                  <div>Tercatat In: {formatTimeId(correctionModal.record.checkIn)}</div>
                  <div>Tercatat Out: {correctionModal.record.checkOut ? formatTimeId(correctionModal.record.checkOut) : '--:--'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-700">Usulan Jam Masuk (WIB)</label>
                  <input
                    type="time"
                    required
                    value={correctionModal.proposedCheckIn}
                    onChange={(e) =>
                      setCorrectionModal({ ...correctionModal, proposedCheckIn: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono text-slate-900 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-700">Usulan Jam Pulang (WIB)</label>
                  <input
                    type="time"
                    required
                    value={correctionModal.proposedCheckOut}
                    onChange={(e) =>
                      setCorrectionModal({ ...correctionModal, proposedCheckOut: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono text-slate-900 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700">
                  Alasan / Justifikasi Koreksi <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Contoh: Lupa clock-out karena ada meeting darurat di luar kantor..."
                  value={correctionModal.notes}
                  onChange={(e) =>
                    setCorrectionModal({ ...correctionModal, notes: e.target.value })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() =>
                    setCorrectionModal({
                      open: false,
                      record: null,
                      proposedCheckIn: '',
                      proposedCheckOut: '',
                      notes: '',
                    })
                  }
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs"
                >
                  Kirim Pengajuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Tolak Pengajuan Koreksi Presensi */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Tolak Pengajuan Koreksi Presensi</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Karyawan: <strong>{rejectModal.employeeName}</strong>. Alasan penolakan wajib dicatat untuk audit trail.
            </p>

            <form onSubmit={handleConfirmReject} className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-700">Alasan Penolakan</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Keterangan mengapa pengajuan koreksi tidak dapat disetujui..."
                  value={rejectModal.reason}
                  onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() =>
                    setRejectModal({
                      open: false,
                      attendanceId: '',
                      employeeName: '',
                      reason: '',
                    })
                  }
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700 shadow-xs"
                >
                  Tolak Koreksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
};
