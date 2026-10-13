'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Receipt,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  FileText,
  Search,
  Filter,
  ShieldAlert,
  ExternalLink,
} from 'lucide-react';
import { Reimbursement, Employee, UserSession } from '@/lib/types';
import { formatIdr, formatDateId } from '@/lib/format';
import { checkPermission } from '@/lib/security/authorization';

interface ReimbursementSectionProps {
  reimbursements: Reimbursement[];
  employees: Employee[];
  session: UserSession;
  onRefresh?: () => void;
  showToast?: (text: string, type?: 'success' | 'error') => void;
}

export const ReimbursementSection: React.FC<ReimbursementSectionProps> = ({
  reimbursements = [],
  employees = [],
  session,
  onRefresh,
  showToast = () => {},
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [rejectModal, setRejectModal] = useState<{
    open: boolean;
    id: string;
    employeeName: string;
    reason: string;
  }>({
    open: false,
    id: '',
    employeeName: '',
    reason: '',
  });

  // Create Form State
  const [formEmployeeId, setFormEmployeeId] = useState(session.employeeId || employees[0]?.id || '');
  const [formCategory, setFormCategory] = useState('Transport & Perjalanan Dinas');
  const [formAmount, setFormAmount] = useState<number>(150000);
  const [formDescription, setFormDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const employeeMap = new Map(employees.map((e) => [e.id, e]));

  const isEmployee = session.role === 'EMPLOYEE';
  const isManager = session.role === 'ADMIN_PROJECT';
  const canApprove = checkPermission(session.role, 'reimbursement.approve');
  const canCreate = checkPermission(session.role, 'reimbursement.create');

  // Filtered reimbursements
  const filtered = reimbursements.filter((r) => {
    const emp = employeeMap.get(r.employeeId);
    const empName = emp ? emp.fullName.toLowerCase() : '';
    const matchesSearch =
      empName.includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || r.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Statistics
  const totalCount = reimbursements.length;
  const pendingCount = reimbursements.filter((r) => r.status === 'PENDING').length;
  const approvedTotalAmount = reimbursements
    .filter((r) => r.status === 'APPROVED')
    .reduce((sum, r) => sum + r.amount, 0);
  const rejectedCount = reimbursements.filter((r) => r.status === 'REJECTED').length;

  // Actions
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formAmount <= 0) {
      showToast('Nominal klaim biaya harus lebih besar dari Rp 0.', 'error');
      return;
    }
    if (!formDescription) {
      showToast('Keterangan pengeluaran wajib diisi.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reimbursement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': session.role,
          'x-employee-id': session.employeeId || '',
        },
        body: JSON.stringify({
          action: 'CREATE',
          reimbursementData: {
            employeeId: isEmployee ? session.employeeId : formEmployeeId,
            category: formCategory,
            amount: Number(formAmount),
            description: formDescription,
            receiptUrl: '/receipts/sample-receipt.pdf',
          },
          session,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Pengajuan klaim biaya reimbursement berhasil dibuat.');
        setIsCreateModalOpen(false);
        setFormDescription('');
        setFormAmount(150000);
        if (onRefresh) onRefresh();
      } else {
        showToast(data.error || 'Gagal mengajukan reimbursement.', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan jaringan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'APPROVED' | 'REJECTED', reason?: string) => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reimbursement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': session.role,
          'x-employee-id': session.employeeId || '',
        },
        body: JSON.stringify({
          action: 'UPDATE_STATUS',
          reimbursementId: id,
          status,
          rejectionReason: reason,
          session,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(
          status === 'APPROVED'
            ? 'Klaim reimbursement berhasil disetujui.'
            : 'Klaim reimbursement telah ditolak.'
        );
        if (onRefresh) onRefresh();
      } else {
        showToast(data.error || 'Gagal memperbarui status klaim.', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan jaringan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="reimbursement-section" className="space-y-4">
      {/* Quick Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-slate-500 block">Total Pengajuan Klaim</span>
          <p className="mt-1 text-xl font-bold text-slate-900">{totalCount}</p>
          <span className="text-[10px] text-slate-400 block mt-0.5">Semua berkas aktif</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-amber-700 block">Menunggu Persetujuan</span>
          <p className="mt-1 text-xl font-bold text-amber-800">{pendingCount}</p>
          <span className="text-[10px] text-amber-600 block mt-0.5">Antrean verifikasi</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-emerald-700 block">Total Klaim Disetujui</span>
          <p className="mt-1 text-xl font-bold text-emerald-800 font-mono">
            {formatIdr(approvedTotalAmount)}
          </p>
          <span className="text-[10px] text-emerald-600 block mt-0.5">Siap dibayarkan</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <span className="text-[11px] font-medium text-rose-700 block">Klaim Ditolak</span>
          <p className="mt-1 text-xl font-bold text-rose-800">{rejectedCount}</p>
          <span className="text-[10px] text-rose-500 block mt-0.5">Tidak memenuhi syarat</span>
        </div>
      </div>

      {/* Filter and Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari pemohon atau deskripsi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-2.5 py-1 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="Transport & Perjalanan Dinas">Transport & Dinas</option>
            <option value="Internet & Fasilitas WFH">Internet & WFH</option>
            <option value="Pengobatan & Rawat Jalan">Pengobatan & Rawat Jalan</option>
            <option value="Sertifikasi & Pelatihan Teknis">Sertifikasi & Pelatihan</option>
            <option value="Konsumsi Meeting Lembur">Konsumsi Lembur</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 focus:outline-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">Menunggu Persetujuan</option>
            <option value="APPROVED">Disetujui</option>
            <option value="REJECTED">Ditolak</option>
          </select>
        </div>

        {canCreate && (
          <button
            id="btn-open-reimbursement-modal"
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 shadow-2xs transition-colors shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            Ajukan Klaim Reimbursement
          </button>
        )}
      </div>

      {/* Reimbursement Table & List */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <Receipt className="mx-auto h-8 w-8 text-slate-300 mb-2" />
            Tidak ada data klaim reimbursement yang cocok dengan filter saat ini.
          </div>
        ) : (
          <>
            {/* Mobile View */}
            <div className="md:hidden divide-y divide-slate-100">
              {filtered.map((item) => {
                const emp = employeeMap.get(item.employeeId);
                const isOwnClaim = session.employeeId === item.employeeId;

                return (
                  <div key={`m-${item.id}`} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-900">
                          {emp ? emp.fullName : item.employeeId}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {emp?.positionId} • {formatDateId(item.createdAt)}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                          item.status === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : item.status === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {item.status === 'APPROVED' && <CheckCircle2 className="h-3 w-3" />}
                        {item.status === 'REJECTED' && <XCircle className="h-3 w-3" />}
                        {item.status === 'PENDING' && <Clock className="h-3 w-3" />}
                        {item.status === 'APPROVED'
                          ? 'Disetujui'
                          : item.status === 'REJECTED'
                          ? 'Ditolak'
                          : 'Menunggu'}
                      </span>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-2.5 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] font-medium text-slate-600">{item.category}</span>
                        <span className="font-mono font-bold text-slate-900">{formatIdr(item.amount)}</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">{item.description}</p>
                      {item.rejectionReason && (
                        <p className="text-rose-600 text-[10px] mt-1 font-medium">
                          Alasan Ditolak: {item.rejectionReason}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    {item.status === 'PENDING' && canApprove && (
                      <div className="flex items-center justify-end gap-2 pt-1">
                        {isOwnClaim ? (
                          <span className="text-[10px] text-amber-700 font-medium flex items-center gap-1">
                            <ShieldAlert className="h-3 w-3" />
                            Four-Eyes: Dilarang menyetujui klaim sendiri
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setRejectModal({
                                  open: true,
                                  id: item.id,
                                  employeeName: emp ? emp.fullName : item.employeeId,
                                  reason: '',
                                })
                              }
                              className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                            >
                              Tolak
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(item.id, 'APPROVED')}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                            >
                              Setujui
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Pemohon</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">Deskripsi &amp; Lampiran</th>
                    <th className="px-4 py-3 text-right">Nominal (IDR)</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Aksi / Kontrol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((item) => {
                    const emp = employeeMap.get(item.employeeId);
                    const isOwnClaim = session.employeeId === item.employeeId;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">
                            {emp ? emp.fullName : item.employeeId}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {emp?.departmentId} • {formatDateId(item.createdAt)}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                            {item.category}
                          </span>
                        </td>

                        <td className="px-4 py-3 max-w-xs">
                          <p className="text-slate-800 line-clamp-2">{item.description}</p>
                          {item.receiptUrl && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 mt-0.5 font-medium hover:underline cursor-pointer">
                              <ExternalLink className="h-2.5 w-2.5" />
                              Lihat Kwitansi / Nota
                            </span>
                          )}
                          {item.rejectionReason && (
                            <p className="text-[10px] text-rose-600 mt-0.5 font-medium">
                              Alasan: {item.rejectionReason}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          {formatIdr(item.amount)}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                              item.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : item.status === 'REJECTED'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {item.status === 'APPROVED' && <CheckCircle2 className="h-3 w-3" />}
                            {item.status === 'REJECTED' && <XCircle className="h-3 w-3" />}
                            {item.status === 'PENDING' && <Clock className="h-3 w-3" />}
                            {item.status === 'APPROVED'
                              ? 'Disetujui'
                              : item.status === 'REJECTED'
                              ? 'Ditolak'
                              : 'Menunggu'}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-center">
                          {item.status === 'PENDING' ? (
                            canApprove ? (
                              isOwnClaim ? (
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-medium bg-amber-50 px-2 py-1 rounded border border-amber-200 cursor-not-allowed"
                                  title="Prinsip Empat Mata (Four-Eyes): Karyawan dilarang menyetujui klaim pengeluaran miliknya sendiri."
                                >
                                  <ShieldAlert className="h-3 w-3" />
                                  Four-Eyes Protected
                                </span>
                              ) : (
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(item.id, 'APPROVED')}
                                    className="rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-700 shadow-2xs"
                                  >
                                    Setujui
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setRejectModal({
                                        open: true,
                                        id: item.id,
                                        employeeName: emp ? emp.fullName : item.employeeId,
                                        reason: '',
                                      })
                                    }
                                    className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
                                  >
                                    Tolak
                                  </button>
                                </div>
                              )
                            ) : (
                              <span className="text-[11px] text-slate-400">Menunggu Review</span>
                            )
                          ) : (
                            <span className="text-[11px] text-slate-400">Selesai Diproses</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal: Ajukan Klaim Reimbursement */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl border border-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-base font-semibold text-slate-900">Formulir Klaim Reimbursement</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreate} className="mt-4 space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Karyawan Pemohon
                  </label>
                  {isEmployee ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-medium text-slate-800">
                      {session.name} ({session.employeeId})
                    </div>
                  ) : (
                    <select
                      value={formEmployeeId}
                      onChange={(e) => setFormEmployeeId(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {employees.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.fullName} ({e.employeeId}) - {e.departmentId}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Kategori Pengeluaran
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Transport & Perjalanan Dinas">Transport & Perjalanan Dinas</option>
                    <option value="Internet & Fasilitas WFH">Internet & Fasilitas WFH</option>
                    <option value="Pengobatan & Rawat Jalan">Pengobatan & Rawat Jalan</option>
                    <option value="Sertifikasi & Pelatihan Teknis">Sertifikasi & Pelatihan Teknis</option>
                    <option value="Konsumsi Meeting Lembur">Konsumsi Meeting Lembur</option>
                    <option value="Operasional Kantor Lainnya">Operasional Kantor Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Nominal Pengeluaran (IDR) *
                  </label>
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Terbilang: {formatIdr(formAmount)}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Deskripsi &amp; Keperluan Pengeluaran *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Contoh: Tiket kereta perjalanan dinas cabang Surabaya..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="rounded-lg bg-emerald-50 p-2.5 border border-emerald-200 text-emerald-800 text-[11px] flex items-start gap-2">
                  <FileText className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    Struk / nota kwitansi pembelian wajib disimpan untuk verifikasi fisik saat pencairan keuangan.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Mengirim...' : 'Kirim Klaim'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Penolakan Klaim */}
      <AnimatePresence>
        {rejectModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl border border-slate-200"
            >
              <h3 className="text-sm font-bold text-slate-900">Alasan Penolakan Klaim</h3>
              <p className="text-xs text-slate-500 mt-1">
                Klaim milik <strong>{rejectModal.employeeName}</strong> akan ditolak.
              </p>

              <textarea
                rows={3}
                required
                placeholder="Tuliskan alasan penolakan (misal: nota tidak jelas, di luar plafon kebijakan)..."
                value={rejectModal.reason}
                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                className="mt-3 w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
              />

              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRejectModal({ open: false, id: '', employeeName: '', reason: '' })}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateStatus(
                      rejectModal.id,
                      'REJECTED',
                      rejectModal.reason || 'Klaim tidak memenuhi syarat'
                    );
                    setRejectModal({ open: false, id: '', employeeName: '', reason: '' });
                  }}
                  className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-700"
                >
                  Tolak Klaim
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
