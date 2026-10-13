'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  HelpCircle,
  DollarSign,
  TrendingDown,
} from 'lucide-react';
import { EmployeeLoan, Employee, UserSession } from '@/lib/types';
import { formatIdr, formatDateId } from '@/lib/format';
import { checkPermission } from '@/lib/security/authorization';

interface EmployeeLoanSectionProps {
  loans: EmployeeLoan[];
  employee: Employee;
  session: UserSession;
  onRefresh?: () => void;
  showToast?: (text: string, type?: 'success' | 'error') => void;
}

export const EmployeeLoanSection: React.FC<EmployeeLoanSectionProps> = ({
  loans = [],
  employee,
  session,
  onRefresh,
  showToast = () => {},
}) => {
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [totalAmount, setTotalAmount] = useState<number>(3000000);
  const [monthlyDeduction, setMonthlyDeduction] = useState<number>(600000);
  const [reason, setReason] = useState('Keperluan mendesak keluarga');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter loans for this employee
  const empLoans = loans.filter((l) => l.employeeId === employee.id);

  // Permissions
  const canApply =
    checkPermission(session.role, 'loan.create') &&
    (session.role !== 'EMPLOYEE' || session.employeeId === employee.id);
  const canApprove = checkPermission(session.role, 'loan.approve');

  // Calculations
  const activeLoan = empLoans.find((l) => l.status === 'ACTIVE');

  const handleApplyLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalAmount <= 0) {
      showToast('Nominal pinjaman harus lebih besar dari Rp 0.', 'error');
      return;
    }
    if (monthlyDeduction <= 0 || monthlyDeduction > totalAmount) {
      showToast('Cicilan bulanan tidak valid.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/loan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': session.role,
          'x-employee-id': session.employeeId || '',
        },
        body: JSON.stringify({
          action: 'CREATE',
          loanData: {
            employeeId: employee.id,
            principalAmount: Number(totalAmount),
            installmentCount: Math.max(1, Math.ceil(Number(totalAmount) / Number(monthlyDeduction))),
            purpose: reason,
            startDate: new Date().toISOString().split('T')[0],
          },
          session,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Pendaftaran pinjaman kasbon berhasil diproses ke HR / Finance.');
        setIsApplyModalOpen(false);
        if (onRefresh) onRefresh();
      } else {
        showToast(data.error || 'Gagal mendaftarkan pinjaman.', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan jaringan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (loanId: string, status: 'COMPLETED' | 'CANCELLED') => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/loan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': session.role,
          'x-employee-id': session.employeeId || '',
        },
        body: JSON.stringify({
          action: 'UPDATE_STATUS',
          loanId,
          status,
          session,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(
          status === 'COMPLETED'
            ? 'Pinjaman kasbon ditandai lunas.'
            : 'Pinjaman kasbon dibatalkan.'
        );
        if (onRefresh) onRefresh();
      } else {
        showToast(data.error || 'Gagal memperbarui status pinjaman.', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan jaringan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="employee-loan-section" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Pinjaman &amp; Kasbon Karyawan</h4>
          <p className="text-[11px] text-slate-500">
            Fasilitas pinjaman darurat perusahaan dengan pemotongan otomatis pada slip gaji bulanan.
          </p>
        </div>

        {canApply && (
          <button
            type="button"
            onClick={() => setIsApplyModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800 shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Ajukan Pinjaman
          </button>
        )}
      </div>

      {/* Active Loan Card if any */}
      {activeLoan && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-emerald-100 p-2 text-emerald-800">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-950 block">Pinjaman Berjalan Aktif</span>
                <span className="text-[10px] text-emerald-700 font-mono">
                  Mulai: {formatDateId(activeLoan.startDate || activeLoan.createdAt)}
                </span>
              </div>
            </div>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
              Sedang Dicicil ({activeLoan.installmentCount} Bln)
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="rounded-lg bg-white p-2.5 border border-emerald-100">
              <span className="text-[10px] text-slate-400 block">Total Pokok Pinjaman</span>
              <span className="font-mono font-bold text-slate-900">{formatIdr(activeLoan.principalAmount)}</span>
            </div>
            <div className="rounded-lg bg-white p-2.5 border border-emerald-100">
              <span className="text-[10px] text-slate-400 block">Potongan Payroll/Bln</span>
              <span className="font-mono font-bold text-slate-900">{formatIdr(activeLoan.monthlyDeduction)}</span>
            </div>
            <div className="rounded-lg bg-white p-2.5 border border-emerald-100">
              <span className="text-[10px] text-slate-400 block">Sisa Saldo Pinjaman</span>
              <span className="font-mono font-bold text-amber-700">{formatIdr(activeLoan.remainingBalance)}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-mono">
              <span>
                Terbayar: {formatIdr(activeLoan.principalAmount - activeLoan.remainingBalance)}
              </span>
              <span>
                {Math.round(((activeLoan.principalAmount - activeLoan.remainingBalance) / activeLoan.principalAmount) * 100)}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-emerald-200 overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full transition-all"
                style={{
                  width: `${Math.max(
                    5,
                    ((activeLoan.principalAmount - activeLoan.remainingBalance) / activeLoan.principalAmount) * 100
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Loan History / All Loans */}
      {empLoans.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
          <CreditCard className="mx-auto h-8 w-8 text-slate-300 mb-1" />
          Tidak ada riwayat pinjaman atau kasbon untuk karyawan ini.
        </div>
      ) : (
        <div className="space-y-2">
          {empLoans.map((loan) => (
            <div
              key={loan.id}
              className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 font-mono">
                    {formatIdr(loan.principalAmount)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                      loan.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : loan.status === 'COMPLETED'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {loan.status === 'ACTIVE'
                      ? 'Aktif'
                      : loan.status === 'COMPLETED'
                      ? 'Lunas'
                      : 'Dibatalkan'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Cicilan: <strong>{formatIdr(loan.monthlyDeduction)}/bulan</strong> ({loan.installmentCount}x) • Keperluan: {loan.purpose}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right sm:text-right">
                  <span className="text-[10px] text-slate-400 block">Sisa Tagihan</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {formatIdr(loan.remainingBalance)}
                  </span>
                </div>

                {canApprove && loan.status === 'ACTIVE' && (
                  <div className="flex items-center gap-1.5 ml-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(loan.id, 'COMPLETED')}
                      className="rounded bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-700"
                    >
                      Tandai Lunas
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(loan.id, 'CANCELLED')}
                      className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Batalkan
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Ajukan Pinjaman */}
      <AnimatePresence>
        {isApplyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl border border-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-emerald-600" />
                  <h4 className="text-sm font-semibold text-slate-900">Formulir Pengajuan Pinjaman Kasbon</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleApplyLoan} className="mt-4 space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Nama Pemohon
                  </label>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-medium text-slate-800">
                    {employee.fullName} ({employee.employeeId})
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Nominal Pinjaman Diajukan (IDR) *
                  </label>
                  <input
                    type="number"
                    min={500000}
                    step={100000}
                    required
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Terbilang: {formatIdr(totalAmount)}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Besaran Cicilan Pemotongan Gaji per Bulan (IDR) *
                  </label>
                  <input
                    type="number"
                    min={100000}
                    step={50000}
                    required
                    value={monthlyDeduction}
                    onChange={(e) => setMonthlyDeduction(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-emerald-700 font-mono mt-0.5 block">
                    Estimasi Tenor: {Math.ceil(totalAmount / (monthlyDeduction || 1))} bulan pelunasan
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Keperluan Pinjaman *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Contoh: Biaya berobat keluarga darurat atau uang muka kontrakan..."
                    className="w-full rounded-lg border border-slate-200 p-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="rounded-lg bg-amber-50 p-2.5 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    Sesuai PP 36/2021, pemotongan pinjaman tidak boleh melebihi 50% dari total penghasilan bersih bulanan.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsApplyModalOpen(false)}
                    className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Mengirim...' : 'Ajukan Pinjaman'}
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
