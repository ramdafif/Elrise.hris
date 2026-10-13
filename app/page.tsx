'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import dynamic from 'next/dynamic';
import { Navbar } from '@/components/Navbar';
import { ViewSkeleton } from '@/components/ViewSkeleton';

// Dynamic lazy imports with uniform ViewSkeleton fallback
const DashboardView = dynamic(
  () => import('@/components/DashboardView').then((mod) => mod.DashboardView),
  {
    loading: () => <ViewSkeleton title="Dashboard & Ikhtisar Operasional" subtitle="Memuat ringkasan KPI, presensi hari ini, dan pengajuan tertunda..." />,
  }
);

const EmployeesView = dynamic(
  () => import('@/components/EmployeesView').then((mod) => mod.EmployeesView),
  {
    loading: () => <ViewSkeleton title="Direktori Data Karyawan" subtitle="Memuat basis data pegawai, struktur organisasi, dan profil..." />,
  }
);

const AttendanceView = dynamic(
  () => import('@/components/AttendanceView').then((mod) => mod.AttendanceView),
  {
    loading: () => <ViewSkeleton title="Presensi & Log Kehadiran" subtitle="Memuat riwayat check-in/out, GPS radius, dan permohonan koreksi presensi..." />,
  }
);

const LeaveOvertimeView = dynamic(
  () => import('@/components/LeaveOvertimeView').then((mod) => mod.LeaveOvertimeView),
  {
    loading: () => <ViewSkeleton title="Pengelolaan Cuti & Lembur" subtitle="Memuat alur persetujuan cuti berjenjang dan kalkulasi lembur PP 35/2021..." />,
  }
);

const KpiReviewView = dynamic(
  () => import('@/components/KpiReviewView').then((mod) => mod.KpiReviewView),
  {
    loading: () => <ViewSkeleton title="Evaluasi Kinerja & Penilaian KPI" subtitle="Memuat metrik penilaian kinerja, tinjauan manajer, dan review mandiri..." />,
  }
);

const PayrollView = dynamic(
  () => import('@/components/PayrollView').then((mod) => mod.PayrollView),
  {
    loading: () => <ViewSkeleton title="Manajemen Penggajian & PPh 21 TER" subtitle="Memuat lembar kerja payroll, kalkulasi PPh 21 TER PP 58/2023, dan BPJS..." />,
  }
);

const TaxRegulationView = dynamic(
  () => import('@/components/TaxRegulationView').then((mod) => mod.TaxRegulationView),
  {
    loading: () => <ViewSkeleton title="Kepatuhan Regulasi Pemerintah" subtitle="Memuat tarif PPh 21 TER, PTKP, plafon BPJS, dan formula lembur..." />,
  }
);

const AuditLogView = dynamic(
  () => import('@/components/AuditLogView').then((mod) => mod.AuditLogView),
  {
    loading: () => <ViewSkeleton title="Log Audit & Jejak Kepatuhan" subtitle="Memuat jejak audit kepatuhan ISO 27001 dan rekaman immutable aktivitas..." />,
  }
);

const SecurityCenterView = dynamic(
  () => import('@/components/SecurityCenterView').then((mod) => mod.SecurityCenterView),
  {
    loading: () => <ViewSkeleton title="Pusat Keamanan & Kontrol Akses" subtitle="Memuat kontrol keamanan RBAC, enkripsi data, dan sesi aktif..." />,
  }
);

const ProjectsView = dynamic(
  () => import('@/components/ProjectsView').then((mod) => mod.ProjectsView),
  {
    loading: () => <ViewSkeleton title="Manajemen Proyek & Penugasan" subtitle="Memuat proyek operasional tenant dan penugasan karyawan..." />,
  }
);
import { DEMO_USERS, isTabAllowed, ROLE_LABELS } from '@/lib/auth/session';
import {
  UserSession,
  Company,
  Branch,
  Department,
  Position,
  Employee,
  AttendanceRecord,
  LeaveRequest,
  LeaveType,
  OvertimeRequest,
  PayrollPeriod,
  PayrollItem,
  AuditLog,
  GovernmentRegulation,
  Reimbursement,
  EmployeeLoan,
  EmployeeDocument,
  KpiReview,
} from '@/lib/types';
import { Loader2, AlertCircle, CheckCircle2, ShieldAlert, ArrowLeft } from 'lucide-react';

export default function HomePage() {
  // Navigation & User Session State (Defaults to Superadmin)
  const [activeTab, setActiveTab] = useState('DASHBOARD');
  const [currentSession, setCurrentSession] = useState<UserSession>(DEMO_USERS[0]);

  // System Data State
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [company, setCompany] = useState<Company | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequest[]>([]);
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [regulations, setRegulations] = useState<GovernmentRegulation[]>([]);
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([]);
  const [employeeLoans, setEmployeeLoans] = useState<EmployeeLoan[]>([]);
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [kpiReviews, setKpiReviews] = useState<KpiReview[]>([]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const applyData = (data: any) => {
    if (data.company) setCompany(data.company);
    if (data.branches) setBranches(data.branches);
    if (data.departments) setDepartments(data.departments);
    if (data.positions) setPositions(data.positions);
    if (data.employees) setEmployees(data.employees);
    if (data.attendances) setAttendances(data.attendances);
    if (data.leaveRequests) setLeaveRequests(data.leaveRequests);
    if (data.leaveTypes) setLeaveTypes(data.leaveTypes);
    if (data.overtimeRequests) setOvertimeRequests(data.overtimeRequests);
    if (data.payrollPeriods) setPayrollPeriods(data.payrollPeriods);
    if (data.payrollItems) setPayrollItems(data.payrollItems);
    if (data.auditLogs) setAuditLogs(data.auditLogs);
    if (data.regulations) setRegulations(data.regulations);
    if (data.reimbursements) setReimbursements(data.reimbursements);
    if (data.employeeLoans) setEmployeeLoans(data.employeeLoans);
    if (data.documents) setDocuments(data.documents);
    if (data.kpiReviews) setKpiReviews(data.kpiReviews);
  };

  // Refresh data after actions (Segregated Reference Data + Dedicated Transactional Endpoints)
  const fetchData = async (sess: UserSession = currentSession) => {
    try {
      const headers: Record<string, string> = {
        'x-session-id': sess.id,
      };
      if (sess.impersonatedTenantId) {
        headers['x-target-tenant-id'] = sess.impersonatedTenantId;
      }

      // 1. Fetch Reference Data
      const refPromise = fetch('/api/data', { headers }).then((r) => (r.ok ? r.json() : null));

      // 2. Fetch Transactional Data in parallel from dedicated endpoints
      const empPromise = fetch('/api/employees?limit=200', { headers }).then((r) => (r.ok ? r.json() : null));
      const attPromise = fetch('/api/attendance?limit=100', { headers }).then((r) => (r.ok ? r.json() : null));
      const leavePromise = fetch('/api/leave?limit=100', { headers }).then((r) => (r.ok ? r.json() : null));
      const otPromise = fetch('/api/overtime?limit=100', { headers }).then((r) => (r.ok ? r.json() : null));

      // Strictly allow only SUPERADMIN and ADMIN_PT to access payroll API
      const canAccessPayroll = sess.role === 'SUPERADMIN' || sess.role === 'ADMIN_PT';
      const payPromise = canAccessPayroll
        ? fetch('/api/payroll?limit=100', { headers }).then((r) => (r.ok ? r.json() : null))
        : Promise.resolve(null);

      const reimbPromise = fetch('/api/reimbursement?limit=100', { headers }).then((r) => (r.ok ? r.json() : null));
      const loanPromise = fetch('/api/loan?limit=100', { headers }).then((r) => (r.ok ? r.json() : null));
      const docPromise = fetch('/api/documents?limit=100', { headers }).then((r) => (r.ok ? r.json() : null));
      const kpiPromise = fetch('/api/kpi?limit=100', { headers }).then((r) => (r.ok ? r.json() : null));

      const canAccessAudit = sess.role === 'SUPERADMIN' || sess.role === 'ADMIN_PT';
      const auditPromise = canAccessAudit
        ? fetch('/api/audit?limit=100', { headers }).then((r) => (r.ok ? r.json() : null))
        : Promise.resolve(null);

      const [refData, empData, attData, leaveData, otData, payData, reimbData, loanData, docData, kpiData, auditData] =
        await Promise.all([
          refPromise,
          empPromise,
          attPromise,
          leavePromise,
          otPromise,
          payPromise,
          reimbPromise,
          loanPromise,
          docPromise,
          kpiPromise,
          auditPromise,
        ]);

      if (refData) applyData(refData);
      if (empData?.employees) setEmployees(empData.employees);
      if (attData?.attendances) setAttendances(attData.attendances);
      if (leaveData?.leaveRequests) setLeaveRequests(leaveData.leaveRequests);
      if (otData?.overtimeRequests) setOvertimeRequests(otData.overtimeRequests);
      if (payData) {
        if (payData.payrollPeriods) setPayrollPeriods(payData.payrollPeriods);
        if (payData.payrollItems) setPayrollItems(payData.payrollItems);
      }
      if (reimbData?.reimbursements) setReimbursements(reimbData.reimbursements);
      if (loanData?.employeeLoans) setEmployeeLoans(loanData.employeeLoans);
      if (docData?.documents) setDocuments(docData.documents);
      if (kpiData?.kpiReviews) setKpiReviews(kpiData.kpiReviews);
      if (auditData?.auditLogs) setAuditLogs(auditData.auditLogs);
    } catch (err) {
      console.error('Error fetching HRIS data:', err);
      showToast('Gagal memuat data dari server.', 'error');
    }
  };

  useEffect(() => {
    let isCancelled = false;

    const loadInitialData = async () => {
      try {
        await fetchData(currentSession);
      } catch (err) {
        if (!isCancelled) {
          console.error('Error initializing HRIS data:', err);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSession.role, currentSession.employeeId]);

  // Clock In handler
  const handleCheckIn = async (location: 'WFO' | 'WFH' | 'CLIENT_SITE' = 'WFO') => {
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CHECK_IN',
          employeeId: currentSession.employeeId,
          workLocation: location,
          session: currentSession,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Presensi masuk berhasil dicatat! Selamat bekerja.');
        fetchData();
      } else {
        showToast(data.error || 'Gagal melakukan check-in', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan jaringan', 'error');
    }
  };

  // Clock Out handler
  const handleCheckOut = async () => {
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CHECK_OUT',
          employeeId: currentSession.employeeId,
          session: currentSession,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Presensi pulang berhasil dicatat! Terima kasih.');
        fetchData();
      } else {
        showToast(data.error || 'Gagal melakukan check-out', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan jaringan', 'error');
    }
  };

  // Attendance Correction handlers
  const handleRequestAttendanceCorrection = async (
    attendanceId: string,
    proposedCheckIn?: string,
    proposedCheckOut?: string,
    notes?: string
  ) => {
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REQUEST_CORRECTION',
          attendanceId,
          proposedCheckIn,
          proposedCheckOut,
          notes,
          session: currentSession,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Pengajuan koreksi presensi berhasil dikirim ke atasan.');
        fetchData();
      } else {
        showToast(data.error || 'Gagal mengajukan koreksi presensi', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan jaringan', 'error');
    }
  };

  const handleApproveAttendanceCorrection = async (attendanceId: string) => {
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'APPROVE_CORRECTION',
          attendanceId,
          session: currentSession,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Pengajuan koreksi presensi disetujui & jam kerja diperbarui.');
        fetchData();
      } else {
        showToast(data.error || 'Gagal menyetujui koreksi presensi', 'error');
      }
    } catch {
      showToast('Gagal memproses persetujuan koreksi', 'error');
    }
  };

  const handleRejectAttendanceCorrection = async (attendanceId: string, reason: string) => {
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REJECT_CORRECTION',
          attendanceId,
          reason,
          session: currentSession,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Pengajuan koreksi presensi ditolak.');
        fetchData();
      } else {
        showToast(data.error || 'Gagal menolak koreksi presensi', 'error');
      }
    } catch {
      showToast('Gagal memproses penolakan koreksi', 'error');
    }
  };

  // Leave Approval handlers
  const handleApproveLeave = async (leaveId: string) => {
    try {
      const res = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_STATUS',
          requestId: leaveId,
          status: 'APPROVED',
          session: currentSession,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Permohonan cuti disetujui.');
        fetchData();
      } else {
        showToast(data.error || 'Gagal menyetujui permohonan cuti', 'error');
      }
    } catch {
      showToast('Gagal memproses persetujuan cuti', 'error');
    }
  };

  const handleRejectLeave = async (leaveId: string, reason: string) => {
    try {
      const res = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_STATUS',
          requestId: leaveId,
          status: 'REJECTED',
          rejectionReason: reason,
          session: currentSession,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Permohonan cuti ditolak.');
        fetchData();
      } else {
        showToast(data.error || 'Gagal memproses penolakan cuti', 'error');
      }
    } catch {
      showToast('Gagal memproses penolakan cuti', 'error');
    }
  };

  const handleAddLeave = async (req: Omit<LeaveRequest, 'id' | 'status' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE',
          requestData: req,
          session: currentSession,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Pengajuan cuti berhasil dikirim.');
        fetchData();
      } else {
        showToast(data.error || 'Gagal mengajukan cuti', 'error');
      }
    } catch {
      showToast('Gagal mengirim pengajuan cuti', 'error');
    }
  };

  // Overtime Approval handlers
  const handleApproveOvertime = async (otId: string) => {
    try {
      const res = await fetch('/api/overtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_STATUS',
          requestId: otId,
          status: 'APPROVED',
          session: currentSession,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Lembur disetujui dan siap dikalkulasikan ke payroll.');
        fetchData();
      } else {
        showToast(data.error || 'Gagal menyetujui lembur', 'error');
      }
    } catch {
      showToast('Gagal memproses lembur', 'error');
    }
  };

  const handleRejectOvertime = async (otId: string, reason: string) => {
    try {
      const res = await fetch('/api/overtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_STATUS',
          requestId: otId,
          status: 'REJECTED',
          rejectionReason: reason,
          session: currentSession,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Pengajuan lembur ditolak.');
        fetchData();
      } else {
        showToast(data.error || 'Gagal menolak lembur', 'error');
      }
    } catch {
      showToast('Gagal menolak lembur', 'error');
    }
  };

  const handleAddOvertime = async (req: {
    employeeId: string;
    date: string;
    startTime: string;
    endTime: string;
    durationHours: number;
    reason: string;
    isHoliday?: boolean;
  }) => {
    try {
      const res = await fetch('/api/overtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE',
          requestData: req,
          session: currentSession,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Pengajuan lembur PP 35/2021 berhasil diajukan.');
        fetchData();
      } else {
        showToast(data.error || 'Gagal mengajukan lembur', 'error');
      }
    } catch {
      showToast('Gagal mengajukan lembur', 'error');
    }
  };


  // Payroll Calculation handlers
  const handleRecalculatePayroll = async (periodId: string) => {
    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodId,
          action: 'calculate',
          userName: currentSession.name,
          userRole: currentSession.role,
        }),
      });
      if (res.ok) {
        showToast('Payroll berhasil dikalkulasi ulang dengan aturan TER & BPJS terbaru!');
        fetchData();
      }
    } catch {
      showToast('Gagal menghitung payroll', 'error');
    }
  };

  const handleLockPayroll = async (periodId: string) => {
    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodId,
          action: 'lock',
          userName: currentSession.name,
          userRole: currentSession.role,
        }),
      });
      if (res.ok) {
        showToast('Periode payroll berhasil dikunci (immutable audit snapshot).');
        fetchData();
      }
    } catch {
      showToast('Gagal mengunci periode payroll', 'error');
    }
  };

  const handleMarkPaidPayroll = async (periodId: string) => {
    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodId,
          action: 'mark_paid',
          userName: currentSession.name,
          userRole: currentSession.role,
        }),
      });
      if (res.ok) {
        showToast('Status payroll berhasil diperbarui menjadi DITRANSFER (PAID).');
        fetchData();
      }
    } catch {
      showToast('Gagal memperbarui status payroll', 'error');
    }
  };

  // Employee Add & Update handlers
  const handleAddEmployee = async (emp: Omit<Employee, 'id'>) => {
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee: emp,
          userName: currentSession.name,
          userRole: currentSession.role,
        }),
      });
      if (res.ok) {
        showToast('Karyawan baru berhasil didaftarkan ke sistem.');
        fetchData();
      }
    } catch {
      showToast('Gagal mendaftarkan karyawan baru', 'error');
    }
  };

  const handleUpdateEmployee = async (id: string, updates: Partial<Employee>, reason: string = 'Penyesuaian profil karyawan') => {
    try {
      const res = await fetch('/api/employees', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          updates,
          reason,
          userName: currentSession.name,
          userRole: currentSession.role,
        }),
      });
      if (res.ok) {
        showToast('Data kompensasi karyawan berhasil disesuaikan.');
        fetchData();
      }
    } catch {
      showToast('Gagal memperbarui data karyawan', 'error');
    }
  };

  if (isLoading || !company) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="mt-3 text-sm font-semibold text-slate-800">
          Memuat Sistem Nusantara HRIS Enterprise...
        </p>
        <p className="text-xs text-slate-500">
          Inisialisasi 52 Rekening Pegawai, Mesin PPh 21 TER, &amp; BPJS Indonesia
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 font-sans text-slate-900 antialiased">
      {/* Toast Notification Banner with Motion */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.96 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-slate-900/95 backdrop-blur-md px-4 py-3 text-xs font-semibold text-white shadow-2xl border border-slate-700"
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Top Navigation */}
      <Navbar
        companyName={company.name}
        currentTab={activeTab}
        setCurrentTab={setActiveTab}
        session={currentSession}
        setSession={setCurrentSession}
      />

      {/* Main Application Container with Motion Transition */}
      <main className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-8">
        <AnimatePresence mode="wait">
          {!isTabAllowed(currentSession.role, activeTab) ? (
            <motion.div
              key={`restricted-${activeTab}-${currentSession.role}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl border border-rose-200 bg-white p-8 text-center shadow-xs"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4 border border-rose-100">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                Akses Dibatasi oleh Kebijakan Keamanan RBAC
              </h2>
              <p className="mt-2 text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Role Anda saat ini (<strong className="text-slate-900">{ROLE_LABELS[currentSession.role]?.title || currentSession.role}</strong>) tidak memiliki hak otorisasi untuk mengakses modul <span className="font-mono font-bold text-rose-700">{activeTab}</span>.
              </p>
              <p className="mt-1 text-[11px] text-slate-400 max-w-md mx-auto">
                Silakan beralih ke role yang memiliki otorisasi (seperti Super Admin atau HR Manager) melalui tombol simulasi di pojok kanan atas.
              </p>
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => setActiveTab('DASHBOARD')}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 active:scale-98 transition-all"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Kembali ke Ikhtisar</span>
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`tab-${activeTab}-${currentSession.role}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              {activeTab === 'DASHBOARD' && isTabAllowed(currentSession.role, 'DASHBOARD') && (
                <DashboardView
                  employees={employees}
                  attendances={attendances}
                  leaveRequests={leaveRequests}
                  overtimeRequests={overtimeRequests}
                  payrollPeriods={payrollPeriods}
                  session={currentSession}
                  onCheckIn={handleCheckIn}
                  onCheckOut={handleCheckOut}
                  onApproveLeave={handleApproveLeave}
                  onRejectLeave={handleRejectLeave}
                  onApproveOvertime={handleApproveOvertime}
                  onRejectOvertime={handleRejectOvertime}
                  onNavigateTab={(tab) => {
                    const mapped = tab.toUpperCase().replace('-', '_');
                    setActiveTab(mapped);
                  }}
                />
              )}

              {activeTab === 'PROJECTS' && isTabAllowed(currentSession.role, 'PROJECTS') && (
                <ProjectsView
                  session={currentSession}
                  employees={employees}
                  showToast={showToast}
                />
              )}

              {activeTab === 'EMPLOYEES' && isTabAllowed(currentSession.role, 'EMPLOYEES') && (
                <EmployeesView
                  employees={employees}
                  departments={departments}
                  branches={branches}
                  positions={positions}
                  session={currentSession}
                  documents={documents}
                  employeeLoans={employeeLoans}
                  onRefresh={() => fetchData()}
                  showToast={showToast}
                  onAddEmployee={handleAddEmployee}
                  onUpdateEmployee={handleUpdateEmployee}
                />
              )}

              {activeTab === 'ATTENDANCE' && isTabAllowed(currentSession.role, 'ATTENDANCE') && (
                <AttendanceView
                  attendances={attendances}
                  employees={employees}
                  branches={branches}
                  session={currentSession}
                  onCheckIn={handleCheckIn}
                  onCheckOut={handleCheckOut}
                  onRequestCorrection={handleRequestAttendanceCorrection}
                  onApproveCorrection={handleApproveAttendanceCorrection}
                  onRejectCorrection={handleRejectAttendanceCorrection}
                />
              )}

              {activeTab === 'LEAVE_OVERTIME' && isTabAllowed(currentSession.role, 'LEAVE_OVERTIME') && (
                <LeaveOvertimeView
                  leaveRequests={leaveRequests}
                  leaveTypes={leaveTypes}
                  overtimeRequests={overtimeRequests}
                  employees={employees}
                  session={currentSession}
                  reimbursements={reimbursements}
                  onRefresh={() => fetchData()}
                  showToast={showToast}
                  onAddLeave={handleAddLeave}
                  onApproveLeave={handleApproveLeave}
                  onRejectLeave={handleRejectLeave}
                  onAddOvertime={handleAddOvertime}
                  onApproveOvertime={handleApproveOvertime}
                  onRejectOvertime={handleRejectOvertime}
                />
              )}

              {activeTab === 'KPI_PERFORMANCE' && isTabAllowed(currentSession.role, 'KPI_PERFORMANCE') && (
                <KpiReviewView
                  kpiReviews={kpiReviews}
                  employees={employees}
                  session={currentSession}
                  onRefresh={() => fetchData()}
                  showToast={showToast}
                />
              )}

              {activeTab === 'PAYROLL' && isTabAllowed(currentSession.role, 'PAYROLL') && (
                <PayrollView
                  payrollPeriods={payrollPeriods}
                  payrollItems={payrollItems}
                  employees={employees}
                  company={company}
                  session={currentSession}
                  onRecalculate={handleRecalculatePayroll}
                  onLock={handleLockPayroll}
                  onMarkPaid={handleMarkPaidPayroll}
                />
              )}

              {activeTab === 'TAX_REGULATION' && isTabAllowed(currentSession.role, 'TAX_REGULATION') && (
                <TaxRegulationView regulations={regulations} />
              )}

              {activeTab === 'AUDIT_LOG' && isTabAllowed(currentSession.role, 'AUDIT_LOG') && (
                <AuditLogView auditLogs={auditLogs} />
              )}

              {activeTab === 'SECURITY_CENTER' && isTabAllowed(currentSession.role, 'SECURITY_CENTER') && (
                <SecurityCenterView session={currentSession} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer id="app-footer" className="mt-8 sm:mt-12 border-t border-slate-200 bg-white py-6 pb-24 md:pb-6">
        <div className="mx-auto max-w-7xl px-4 text-center text-xs text-slate-500 sm:px-6 lg:px-8">
          <p className="font-semibold text-slate-700">PT Elkyno Technology</p>
          <p className="mt-1 text-slate-500">Enterprise HRIS &amp; Payroll Management System</p>
        </div>
      </footer>
    </div>
  );
}
