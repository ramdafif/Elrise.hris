'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Award,
  Plus,
  CheckCircle2,
  Clock,
  UserCheck,
  FileCheck2,
  Target,
  Search,
  Filter,
  AlertCircle,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { KpiReview, Employee, UserSession } from '@/lib/types';
import { checkPermission } from '@/lib/security/authorization';

interface KpiReviewViewProps {
  kpiReviews: KpiReview[];
  employees: Employee[];
  session: UserSession;
  onRefresh: () => void;
  showToast: (text: string, type?: 'success' | 'error') => void;
}

export const KpiReviewView: React.FC<KpiReviewViewProps> = ({
  kpiReviews,
  employees,
  session,
  onRefresh,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [periodFilter, setPeriodFilter] = useState<string>('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSelfModalOpen, setIsSelfModalOpen] = useState(false);
  const [isManagerModalOpen, setIsManagerModalOpen] = useState(false);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);

  const [selectedKpi, setSelectedKpi] = useState<KpiReview | null>(null);

  // Form states
  const [newEmployeeId, setNewEmployeeId] = useState('');
  const [newPeriod, setNewPeriod] = useState('Q1 2026');

  const [selfScore, setSelfScore] = useState<number>(85);
  const [selfNotes, setSelfNotes] = useState('');

  const [managerScore, setManagerScore] = useState<number>(88);
  const [managerNotes, setManagerNotes] = useState('');

  const [finalScore, setFinalScore] = useState<number>(87);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper mappings
  const employeeMap = new Map(employees.map((e) => [e.id, e]));

  // Calculate stats
  const totalReviews = kpiReviews.length;
  const finalizedReviews = kpiReviews.filter((k) => k.status === 'FINALIZED');
  const avgFinalScore =
    finalizedReviews.length > 0
      ? Math.round(finalizedReviews.reduce((sum, k) => sum + (k.finalScore || 0), 0) / finalizedReviews.length)
      : 0;
  const pendingSelf = kpiReviews.filter((k) => k.status === 'DRAFT').length;
  const pendingManager = kpiReviews.filter((k) => k.status === 'SUBMITTED').length;

  // Filtered reviews
  const filteredReviews = kpiReviews.filter((kpi) => {
    const emp = employeeMap.get(kpi.employeeId);
    const empName = emp ? emp.fullName.toLowerCase() : '';
    const matchesSearch =
      empName.includes(searchTerm.toLowerCase()) ||
      kpi.period.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || kpi.status === statusFilter;
    const matchesPeriod = periodFilter === 'ALL' || kpi.period === periodFilter;
    return matchesSearch && matchesStatus && matchesPeriod;
  });

  const getStatusBadge = (status: KpiReview['status']) => {
    switch (status) {
      case 'DRAFT':
        return {
          label: 'Menunggu Evaluasi Mandiri',
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          icon: Clock,
        };
      case 'SUBMITTED':
        return {
          label: 'Menunggu Review Manajer',
          bg: 'bg-blue-50 text-blue-800 border-blue-200',
          icon: UserCheck,
        };
      case 'REVIEWED':
        return {
          label: 'Siap Difinalisasi HR',
          bg: 'bg-purple-50 text-purple-800 border-purple-200',
          icon: FileCheck2,
        };
      case 'FINALIZED':
        return {
          label: 'Selesai & Terkunci',
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          icon: CheckCircle2,
        };
    }
  };

  const getScoreRating = (score: number) => {
    if (score >= 90) return { label: 'Istimewa (A+)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (score >= 80) return { label: 'Sangat Baik (A)', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (score >= 70) return { label: 'Baik (B)', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
    if (score >= 60) return { label: 'Cukup (C)', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { label: 'Butuh Bimbingan (D)', color: 'text-rose-700 bg-rose-50 border-rose-200' };
  };

  // Handlers
  const handleCreateKpi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployeeId) {
      showToast('Pilih karyawan yang akan diinisiasi evaluasi kinerjanya.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/kpi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': session.role,
          'x-employee-id': session.employeeId || '',
        },
        body: JSON.stringify({
          action: 'CREATE',
          kpiData: {
            employeeId: newEmployeeId,
            period: newPeriod,
          },
          session,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Inisiasi KPI periode ${newPeriod} berhasil dibuat.`);
        setIsCreateModalOpen(false);
        setNewEmployeeId('');
        onRefresh();
      } else {
        showToast(data.error || 'Gagal inisiasi KPI.', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan jaringan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitSelf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKpi) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/kpi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': session.role,
          'x-employee-id': session.employeeId || '',
        },
        body: JSON.stringify({
          action: 'SUBMIT_SELF',
          kpiId: selectedKpi.id,
          selfScore,
          selfNotes,
          session,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Evaluasi mandiri KPI berhasil dikirim ke atasan langsung.');
        setIsSelfModalOpen(false);
        setSelectedKpi(null);
        onRefresh();
      } else {
        showToast(data.error || 'Gagal mengirim evaluasi mandiri.', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan jaringan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKpi) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/kpi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': session.role,
          'x-employee-id': session.employeeId || '',
        },
        body: JSON.stringify({
          action: 'SUBMIT_MANAGER',
          kpiId: selectedKpi.id,
          managerScore,
          managerNotes,
          session,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Penilaian kinerja manajer berhasil disimpan dan siap difinalisasi HR.');
        setIsManagerModalOpen(false);
        setSelectedKpi(null);
        onRefresh();
      } else {
        showToast(data.error || 'Gagal menyimpan penilaian manajer.', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan jaringan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKpi) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/kpi', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': session.role,
          'x-employee-id': session.employeeId || '',
        },
        body: JSON.stringify({
          action: 'FINALIZE',
          kpiId: selectedKpi.id,
          finalScore,
          session,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Skor akhir evaluasi kinerja resmi difinalisasi dan dikunci.');
        setIsFinalizeModalOpen(false);
        setSelectedKpi(null);
        onRefresh();
      } else {
        showToast(data.error || 'Gagal memfinalisasi KPI.', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan jaringan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="kpi-review-view" className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {session.role === 'EMPLOYEE' ? 'Penilaian Kinerja Saya (KPI)' : 'Evaluasi Kinerja & KPI Karyawan'}
            </h1>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
              Siklus 2026
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {session.role === 'EMPLOYEE'
              ? 'Isi evaluasi pencapaian mandiri, tinjau umpan balik manajer, dan pantau skor akhir kinerja.'
              : 'Kelola alur evaluasi kinerja 360° terintegrasi dengan prinsip empat mata antara karyawan, manajer langsung, dan HR.'}
          </p>
        </div>

        {checkPermission(session.role, 'kpi.create') && (
          <button
            id="btn-create-kpi"
            onClick={() => {
              setNewEmployeeId(employees[0]?.id || '');
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4" />
            Inisiasi Periode KPI
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Evaluasi</span>
            <span className="rounded-md bg-slate-100 p-1.5 text-slate-700">
              <Award className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{totalReviews}</p>
          <p className="text-xs text-slate-500 mt-0.5">Siklus aktif periode ini</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Rata-rata Skor Final</span>
            <span className="rounded-md bg-emerald-100 p-1.5 text-emerald-700">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{avgFinalScore || '-'}</p>
          <p className="text-xs text-emerald-600 mt-0.5 font-medium">Dari evaluasi terfinalisasi</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Menunggu Self-Review</span>
            <span className="rounded-md bg-amber-100 p-1.5 text-amber-700">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-900">{pendingSelf}</p>
          <p className="text-xs text-slate-500 mt-0.5">Draft pengisian staf</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Menunggu Review Manajer</span>
            <span className="rounded-md bg-blue-100 p-1.5 text-blue-700">
              <UserCheck className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-900">{pendingManager}</p>
          <p className="text-xs text-slate-500 mt-0.5">Antrean atasan langsung</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama karyawan atau periode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="h-3.5 w-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="ALL">Semua Status</option>
            <option value="DRAFT">Menunggu Evaluasi Mandiri</option>
            <option value="SUBMITTED">Menunggu Review Manajer</option>
            <option value="REVIEWED">Siap Difinalisasi HR</option>
            <option value="FINALIZED">Selesai (Terkunci)</option>
          </select>

          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="ALL">Semua Periode</option>
            <option value="Q1 2026">Q1 2026</option>
            <option value="Semester 1 2026">Semester 1 2026</option>
          </select>
        </div>
      </div>

      {/* KPI Review Cards / List */}
      {filteredReviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <Award className="mx-auto h-12 w-12 text-slate-300" />
          <h3 className="mt-3 text-base font-semibold text-slate-800">Tidak ada data review KPI</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            Belum ada berkas penilaian kinerja yang cocok dengan filter atau terdaftar pada sistem saat ini.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredReviews.map((kpi) => {
            const emp = employeeMap.get(kpi.employeeId);
            const statusConfig = getStatusBadge(kpi.status);
            const StatusIcon = statusConfig.icon;
            const finalRating = kpi.finalScore ? getScoreRating(kpi.finalScore) : null;

            // Authorization logic for action buttons
            const isMySelfReview = session.employeeId === kpi.employeeId;
            const isManagerOfThisEmp = emp?.managerId === session.employeeId || session.role === 'ADMIN_PROJECT';
            const isHrOrAdmin = session.role === 'SUPERADMIN' || session.role === 'ADMIN_PT';

            const canFillSelf = (isMySelfReview || isHrOrAdmin) && kpi.status === 'DRAFT';
            const canReviewManager = (isManagerOfThisEmp || isHrOrAdmin) && !isMySelfReview && kpi.status === 'SUBMITTED';
            const canFinalize = isHrOrAdmin && (kpi.status === 'REVIEWED' || kpi.status === 'SUBMITTED');

            return (
              <motion.div
                key={kpi.id}
                id={`kpi-card-${kpi.id}`}
                layout
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:border-slate-300 transition-colors"
              >
                {/* Card Top: Employee Info & Status */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-800">
                      {emp ? emp.fullName.slice(0, 2).toUpperCase() : 'EM'}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">
                        {emp ? emp.fullName : kpi.employeeId}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {emp?.positionId} • {emp?.departmentId}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${statusConfig.bg}`}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      {statusConfig.label}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">{kpi.period}</span>
                  </div>
                </div>

                {/* Score Indicators Grid */}
                <div className="grid grid-cols-3 gap-2 my-4">
                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-center">
                    <span className="text-[11px] font-medium text-slate-500 block">Evaluasi Mandiri</span>
                    <span className="text-lg font-bold text-slate-800">
                      {kpi.selfScore !== undefined ? kpi.selfScore : '-'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Bobot 30%</span>
                  </div>

                  <div className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-center">
                    <span className="text-[11px] font-medium text-slate-500 block">Review Atasan</span>
                    <span className="text-lg font-bold text-slate-800">
                      {kpi.managerScore !== undefined ? kpi.managerScore : '-'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Bobot 70%</span>
                  </div>

                  <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-2.5 text-center">
                    <span className="text-[11px] font-medium text-emerald-800 block">Skor Final HR</span>
                    <span className="text-lg font-bold text-emerald-900">
                      {kpi.finalScore !== undefined ? kpi.finalScore : '-'}
                    </span>
                    {finalRating ? (
                      <span className="text-[10px] font-medium text-emerald-700 block truncate">
                        {finalRating.label}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 block">Belum dikunci</span>
                    )}
                  </div>
                </div>

                {/* Evaluation Notes (if any) */}
                <div className="space-y-2 text-xs">
                  {kpi.selfNotes && (
                    <div className="rounded-md bg-slate-50 p-2 border border-slate-100">
                      <span className="font-semibold text-slate-700 block mb-0.5">Catatan Mandiri:</span>
                      <p className="text-slate-600 leading-relaxed">{kpi.selfNotes}</p>
                    </div>
                  )}

                  {kpi.managerNotes && (
                    <div className="rounded-md bg-blue-50/50 p-2 border border-blue-100">
                      <span className="font-semibold text-blue-900 block mb-0.5">Umpan Balik Atasan:</span>
                      <p className="text-slate-600 leading-relaxed">{kpi.managerNotes}</p>
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    ID: {kpi.id}
                  </span>

                  <div className="flex items-center gap-2">
                    {canFillSelf && (
                      <button
                        onClick={() => {
                          setSelectedKpi(kpi);
                          setSelfScore(kpi.selfScore || 85);
                          setSelfNotes(kpi.selfNotes || '');
                          setIsSelfModalOpen(true);
                        }}
                        className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 shadow-xs transition-colors"
                      >
                        Isi Evaluasi Mandiri
                      </button>
                    )}

                    {canReviewManager && (
                      <button
                        onClick={() => {
                          setSelectedKpi(kpi);
                          setManagerScore(kpi.managerScore || 88);
                          setManagerNotes(kpi.managerNotes || '');
                          setIsManagerModalOpen(true);
                        }}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 shadow-xs transition-colors"
                      >
                        Beri Nilai Manajer
                      </button>
                    )}

                    {canFinalize && (
                      <button
                        onClick={() => {
                          setSelectedKpi(kpi);
                          const s = kpi.selfScore ?? 80;
                          const m = kpi.managerScore ?? 85;
                          setFinalScore(kpi.finalScore || Math.round(s * 0.3 + m * 0.7));
                          setIsFinalizeModalOpen(true);
                        }}
                        className="rounded-lg bg-purple-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-800 shadow-xs transition-colors"
                      >
                        Finalisasi & Kunci
                      </button>
                    )}

                    {kpi.status === 'FINALIZED' && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Terkunci Permanen
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: Inisiasi KPI (HR / Manager) */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-base font-semibold text-slate-900">Inisiasi Periode KPI Baru</h3>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateKpi} className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Karyawan</label>
                  <select
                    value={newEmployeeId}
                    onChange={(e) => setNewEmployeeId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.employeeId}) - {emp.departmentId}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Periode Penilaian</label>
                  <select
                    value={newPeriod}
                    onChange={(e) => setNewPeriod(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="Q1 2026">Q1 2026 (Januari - Maret 2026)</option>
                    <option value="Q2 2026">Q2 2026 (April - Juni 2026)</option>
                    <option value="Semester 1 2026">Semester 1 2026</option>
                    <option value="Tahunan 2026">Tahunan 2026</option>
                  </select>
                </div>

                <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      Berkas KPI akan dibuat dalam status <strong>DRAFT</strong>. Karyawan yang bersangkutan akan diarahkan mengisi evaluasi mandiri sebelum ditinjau oleh manajer.
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Memproses...' : 'Buat Berkas KPI'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Evaluasi Mandiri (Employee) */}
      <AnimatePresence>
        {isSelfModalOpen && selectedKpi && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-amber-600" />
                  <h3 className="text-base font-semibold text-slate-900">Evaluasi Mandiri Kinerja</h3>
                </div>
                <button
                  onClick={() => setIsSelfModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitSelf} className="mt-4 space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700">Skor Penilaian Mandiri (0 - 100)</label>
                    <span className="text-sm font-bold text-amber-700">{selfScore}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selfScore}
                    onChange={(e) => setSelfScore(Number(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>0 (Kurang)</span>
                    <span>75 (Standar)</span>
                    <span>100 (Sempurna)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Catatan Pencapaian & Inisiatif
                  </label>
                  <textarea
                    rows={3}
                    value={selfNotes}
                    onChange={(e) => setSelfNotes(e.target.value)}
                    placeholder="Jelaskan pencapaian target, inovasi, atau proyek yang berhasil Anda selesaikan pada periode ini..."
                    required
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsSelfModalOpen(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Mengirim...' : 'Kirim ke Atasan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Penilaian Manajer */}
      <AnimatePresence>
        {isManagerModalOpen && selectedKpi && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  <h3 className="text-base font-semibold text-slate-900">Penilaian Manajerial</h3>
                </div>
                <button
                  onClick={() => setIsManagerModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <div className="my-3 rounded-lg bg-slate-50 p-2.5 border border-slate-200 text-xs">
                <span className="font-semibold text-slate-700 block">Evaluasi Mandiri Staf:</span>
                <p className="text-slate-600 italic mt-0.5">&quot;{selectedKpi.selfNotes || 'Tidak ada catatan'}&quot;</p>
                <span className="text-[11px] text-slate-500 block mt-1">Skor Mandiri: <strong>{selectedKpi.selfScore}</strong></span>
              </div>

              <form onSubmit={handleSubmitManager} className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-700">Skor Penilaian Manajer (0 - 100)</label>
                    <span className="text-sm font-bold text-blue-700">{managerScore}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={managerScore}
                    onChange={(e) => setManagerScore(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Umpan Balik & Rekomendasi Manajerial
                  </label>
                  <textarea
                    rows={3}
                    value={managerNotes}
                    onChange={(e) => setManagerNotes(e.target.value)}
                    placeholder="Berikan umpan balik konstruktif mengenai kualitas kerja, kolaborasi tim, dan area pengembangan staf..."
                    required
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsManagerModalOpen(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Penilaian'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: Finalisasi Skor (HR Admin) */}
      <AnimatePresence>
        {isFinalizeModalOpen && selectedKpi && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="h-5 w-5 text-purple-600" />
                  <h3 className="text-base font-semibold text-slate-900">Finalisasi & Kunci Skor KPI</h3>
                </div>
                <button
                  onClick={() => setIsFinalizeModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleFinalize} className="mt-4 space-y-4">
                <div className="rounded-lg bg-purple-50/50 p-3 border border-purple-100 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Skor Mandiri (30%):</span>
                    <span className="font-semibold text-slate-800">{selectedKpi.selfScore ?? '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Skor Manajer (70%):</span>
                    <span className="font-semibold text-slate-800">{selectedKpi.managerScore ?? '-'}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Skor Akhir Resmi HR (0 - 100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={finalScore}
                    onChange={(e) => setFinalScore(Number(e.target.value))}
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Rating tier: <strong>{getScoreRating(finalScore).label}</strong>
                  </span>
                </div>

                <div className="rounded-lg bg-amber-50 p-3 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    Perhatian: Setelah difinalisasi, berkas KPI akan berstatus <strong>FINALIZED</strong> dan menjadi arsip permanen untuk audit kepatuhan dan pertimbangan kenaikan golongan.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsFinalizeModalOpen(false)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-purple-700 px-4 py-2 text-xs font-medium text-white hover:bg-purple-800 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Memproses...' : 'Kunci Skor Final'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
