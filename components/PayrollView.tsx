'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  CreditCard,
  Lock,
  Unlock,
  RefreshCw,
  Download,
  FileSpreadsheet,
  FileCheck2,
  AlertCircle,
  Eye,
  CheckCircle2,
  DollarSign,
  Printer,
  Gift,
  Building,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import {
  PayrollPeriod,
  PayrollItem,
  Employee,
  Company,
  UserSession,
} from '@/lib/types';
import { formatIdr, formatDateId } from '@/lib/format';
import { calculateThr } from '@/lib/payroll/thr';
import { checkPermission } from '@/lib/security/authorization';

interface PayrollViewProps {
  payrollPeriods: PayrollPeriod[];
  payrollItems: PayrollItem[];
  employees: Employee[];
  company: Company;
  session: UserSession;
  onRecalculate: (periodId: string) => void;
  onLock: (periodId: string) => void;
  onMarkPaid: (periodId: string) => void;
}

export const PayrollView: React.FC<PayrollViewProps> = ({
  payrollPeriods,
  payrollItems,
  employees,
  company,
  session,
  onRecalculate,
  onLock,
  onMarkPaid,
}) => {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(
    payrollPeriods[0]?.id || ''
  );
  const [searchTerm, setSearchTerm] = useState('');

  // Selected item for Payslip Modal
  const [selectedPayslipItem, setSelectedPayslipItem] = useState<{
    item: PayrollItem;
    employee: Employee;
  } | null>(null);

  // Bank Export Modal
  const [isBankExportModalOpen, setIsBankExportModalOpen] = useState(false);
  const [bankExportType, setBankExportType] = useState<'BCA' | 'MANDIRI'>('BCA');

  // THR Calculator Modal
  const [isThrModalOpen, setIsThrModalOpen] = useState(false);
  const [thrEmployeeId, setThrEmployeeId] = useState(employees[0]?.id || '');
  const [thrTenureMonths, setThrTenureMonths] = useState(12);

  // Role permissions
  const canCalculate = checkPermission(session.role, 'payroll.calculate');
  const canLock = checkPermission(session.role, 'payroll.lock');
  const canApprove = checkPermission(session.role, 'payroll.approve');
  const canExport = checkPermission(session.role, 'reports.read');
  const isEmployee = session.role === 'EMPLOYEE';
  const isManager = session.role === 'ADMIN_PROJECT';

  // Manager isolation: Managers are strictly forbidden from corporate payroll
  if (isManager) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
        <h3 className="text-sm font-bold text-rose-900">Akses Dibatasi (Kerahasiaan Kompensasi &amp; Gaji)</h3>
        <p className="mt-1 text-xs text-rose-700">
          Sesuai kebijakan keamanan dan tata kelola HRIS, modul Penggajian hanya dapat diakses oleh Administrator HR, Tim Payroll, dan Finance.
        </p>
      </div>
    );
  }

  const currentPeriod =
    payrollPeriods.find((p) => p.id === selectedPeriodId) || payrollPeriods[0];

  const currentPeriodItems = payrollItems.filter(
    (item) => item.payrollPeriodId === currentPeriod?.id
  );

  const filteredItems = currentPeriodItems.filter((item) => {
    const emp = employees.find((e) => e.id === item.employeeId);
    if (!emp) return false;
    // Data privacy: employee only sees own payroll record
    if (isEmployee && emp.id !== session.employeeId) return false;
    if (searchTerm === '') return true;
    return (
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.nikKtp.includes(searchTerm)
    );
  });

  // Employee personal payroll metrics
  const myPayrollItem = currentPeriodItems.find((it) => it.employeeId === session.employeeId);
  const myGross = myPayrollItem?.grossSalary || 0;
  const myPph21 = myPayrollItem?.pph21Amount || 0;
  const myBpjsEmp = myPayrollItem
    ? myPayrollItem.bpjsKesEmployee + myPayrollItem.bpjsTkJhtEmployee + myPayrollItem.bpjsTkJpEmployee
    : 0;
  const myBpjsComp = myPayrollItem
    ? myPayrollItem.bpjsKesEmployer +
      myPayrollItem.bpjsTkJhtEmployer +
      myPayrollItem.bpjsTkJkkEmployer +
      myPayrollItem.bpjsTkJkmEmployer +
      myPayrollItem.bpjsTkJpEmployer
    : 0;
  const myNet = myPayrollItem?.netSalary || 0;

  // Selected employee for THR calculation - locked to self for employees
  const effectiveThrEmployeeId = isEmployee ? session.employeeId : thrEmployeeId;
  const selectedThrEmployee =
    employees.find((e) => e.id === effectiveThrEmployeeId) || employees[0];
  const thrCalculation = selectedThrEmployee
    ? calculateThr(
        Number(selectedThrEmployee.basicSalary),
        Number(selectedThrEmployee.fixedAllowance),
        thrTenureMonths
      )
    : { monthlyWage: 0, tenureMonths: 0, multiplier: 0, thrAmount: 0, isProrated: false, regulation: '' };

  // Bank Export Generation
  const generateBankCsv = () => {
    if (bankExportType === 'BCA') {
      let csv = 'NoRekening,NamaPenerima,Nominal,Berita\n';
      currentPeriodItems.forEach((item) => {
        const emp = employees.find((e) => e.id === item.employeeId);
        if (emp) {
          csv += `${emp.bankAccountNumber},"${emp.fullName}",${item.netSalary},"Gaji ${currentPeriod?.name}"\n`;
        }
      });
      return csv;
    } else {
      let csv = 'BeneficiaryAccount,BeneficiaryName,Amount,Remark\n';
      currentPeriodItems.forEach((item) => {
        const emp = employees.find((e) => e.id === item.employeeId);
        if (emp) {
          csv += `${emp.bankAccountNumber},"${emp.fullName}",${item.netSalary},"Payroll ${currentPeriod?.code}"\n`;
        }
      });
      return csv;
    }
  };

  const handleDownloadCsv = () => {
    const csvContent = generateBankCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `PAYROLL_TRANSFER_${bankExportType}_${currentPeriod?.code}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              {isEmployee ? 'Penggajian & Slip Gaji Mandiri' : 'Kalkulasi Penggajian & PPh 21 TER'}
            </h2>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                currentPeriod?.status === 'LOCKED'
                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                  : currentPeriod?.status === 'PAID'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              Status: {currentPeriod?.status}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Perhitungan Otomatis: PP No. 58/2023 (PPh 21 TER), BPJS Kesehatan Perpres 64/2020, &amp; BPJS TK PP 44-45/2015
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selector */}
          <select
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            className="w-full sm:w-auto rounded-lg border border-slate-300 bg-white px-3 py-2 sm:py-1.5 text-xs font-semibold text-slate-800 focus:outline-hidden"
          >
            {payrollPeriods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.status})
              </option>
            ))}
          </select>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* THR Calculator */}
            <button
              type="button"
              onClick={() => setIsThrModalOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 sm:py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 active:scale-98 transition-all"
            >
              <Gift className="h-3.5 w-3.5 text-amber-600" />
              <span>Kalkulator THR</span>
            </button>

            {/* Bank Transfer Export */}
            {canExport && (
              <button
                type="button"
                onClick={() => setIsBankExportModalOpen(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 sm:py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 active:scale-98 transition-all"
              >
                <Download className="h-3.5 w-3.5 text-slate-600" />
                <span>Export Bank</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Recalculate Engine */}
            {canCalculate && currentPeriod?.status !== 'LOCKED' && currentPeriod?.status !== 'PAID' && (
              <button
                id="btn-recalculate-payroll"
                type="button"
                onClick={() => onRecalculate(currentPeriod.id)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 sm:py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 active:scale-98 transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Kalkulasi Ulang</span>
              </button>
            )}

            {/* Lock Payroll */}
            {canLock && currentPeriod?.status === 'REVIEW' && (
              <button
                id="btn-lock-payroll"
                type="button"
                onClick={() => {
                  if (confirm('Kunci periode payroll? Data akan dibuat permanen (immutable snapshot) dan tidak dapat diedit lagi.')) {
                    onLock(currentPeriod.id);
                  }
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 sm:py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 active:scale-98 transition-all"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Kunci Periode</span>
              </button>
            )}

            {/* Mark as Paid */}
            {canApprove && currentPeriod?.status === 'LOCKED' && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Tandai seluruh gaji periode ini telah ditransfer ke rekening bank karyawan?')) {
                    onMarkPaid(currentPeriod.id);
                  }
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 sm:py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 active:scale-98 transition-all"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Tandai Ditransfer</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Segregation of Duties (Four-Eyes Principle) Lifecycle & Audit Pipeline */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                Pemisahan Tugas &amp; Prinsip Empat Mata (Segregation of Duties)
                <span className="text-[10px] font-normal text-slate-400">| Four-Eyes Principle</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Pemeriksaan independen: Pengkalkulasi (Maker), Pengunci (Verifier), dan Pembayar (Disburser) wajib terpisah.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-bold ${
                currentPeriod?.status === 'PAID'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : currentPeriod?.status === 'LOCKED'
                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              {currentPeriod?.status === 'PAID'
                ? '✓ Siklus Selesai (PAID)'
                : currentPeriod?.status === 'LOCKED'
                ? '🔒 Terkunci (Menunggu Transfer Finance)'
                : '⏳ Tahap Perhitungan (Draf)'}
            </span>
          </div>
        </div>

        {/* Step-by-step Visual Pipeline: Dihitung oleh X -> Dikunci oleh Y -> Dibayarkan oleh Z */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Step 1: Dihitung oleh */}
          <div
            className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
              currentPeriod?.calculatedBy || currentPeriod?.calculatedAt
                ? 'border-emerald-200 bg-emerald-50/40'
                : 'border-slate-200 bg-slate-50/50'
            }`}
          >
            <div
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                currentPeriod?.calculatedBy || currentPeriod?.calculatedAt
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {currentPeriod?.calculatedBy || currentPeriod?.calculatedAt ? '✓' : '1'}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                1. Dihitung Oleh
              </span>
              <p className="text-xs font-bold text-slate-900 truncate" title={currentPeriod?.calculatedByName || currentPeriod?.calculatedBy}>
                {currentPeriod?.calculatedByName || currentPeriod?.calculatedBy || 'Belum Dihitung'}
              </p>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {currentPeriod?.calculatedAt ? formatDateId(currentPeriod.calculatedAt) : 'Menunggu kalkulasi'}
              </span>
            </div>
          </div>

          {/* Step 2: Dikunci oleh */}
          <div
            className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
              currentPeriod?.lockedBy || currentPeriod?.lockedAt
                ? 'border-indigo-200 bg-indigo-50/40'
                : 'border-slate-200 bg-slate-50/50'
            }`}
          >
            <div
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                currentPeriod?.lockedBy || currentPeriod?.lockedAt
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {currentPeriod?.lockedBy || currentPeriod?.lockedAt ? '✓' : '2'}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                2. Dikunci Oleh
              </span>
              <p className="text-xs font-bold text-slate-900 truncate" title={currentPeriod?.lockedByName || currentPeriod?.lockedBy}>
                {currentPeriod?.lockedByName || currentPeriod?.lockedBy || (currentPeriod?.status === 'LOCKED' ? 'Terkunci' : 'Belum Dikunci')}
              </p>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {currentPeriod?.lockedAt ? formatDateId(currentPeriod.lockedAt) : 'Menunggu verifikasi & kunci'}
              </span>
            </div>
          </div>

          {/* Step 3: Dibayarkan oleh */}
          <div
            className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${
              currentPeriod?.paidBy || currentPeriod?.status === 'PAID'
                ? 'border-emerald-200 bg-emerald-50/40'
                : 'border-slate-200 bg-slate-50/50'
            }`}
          >
            <div
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                currentPeriod?.paidBy || currentPeriod?.status === 'PAID'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {currentPeriod?.paidBy || currentPeriod?.status === 'PAID' ? '✓' : '3'}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                3. Dibayarkan Oleh
              </span>
              <p className="text-xs font-bold text-slate-900 truncate" title={currentPeriod?.paidByName || currentPeriod?.paidBy}>
                {currentPeriod?.paidByName || currentPeriod?.paidBy || (currentPeriod?.status === 'PAID' ? 'Ditransfer' : 'Menunggu Transfer Finance')}
              </p>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {currentPeriod?.paidAt ? formatDateId(currentPeriod.paidAt) : 'Menunggu pencairan'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Financial Metric Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3">
        {/* Gross Pay */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-3.5 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-medium text-slate-500">
            {isEmployee ? 'Bruto Saya' : 'Bruto (Gross)'}
          </span>
          <p className="text-base sm:text-lg font-bold font-mono text-slate-900 mt-1">
            {formatIdr(isEmployee ? myGross : currentPeriod?.totalGrossPay)}
          </p>
          <span className="text-[9px] sm:text-[10px] text-slate-400">
            {isEmployee ? 'Upah kotor periode ini' : 'Total upah kotor'}
          </span>
        </div>

        {/* PPh 21 TER */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-3.5 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-medium text-slate-500">PPh 21 TER</span>
          <p className="text-base sm:text-lg font-bold font-mono text-amber-600 mt-1">
            {formatIdr(isEmployee ? myPph21 : currentPeriod?.totalPph21)}
          </p>
          <span className="text-[9px] sm:text-[10px] text-slate-400">PP 58/2023</span>
        </div>

        {/* BPJS Employee */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-3.5 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-medium text-slate-500">
            {isEmployee ? 'Pot. BPJS Saya' : 'Pot. BPJS Karyawan'}
          </span>
          <p className="text-base sm:text-lg font-bold font-mono text-blue-600 mt-1">
            {formatIdr(isEmployee ? myBpjsEmp : currentPeriod?.totalBpjsEmployee)}
          </p>
          <span className="text-[9px] sm:text-[10px] text-slate-400">Kes 1% + JHT 2% + JP 1%</span>
        </div>

        {/* BPJS Employer */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-3.5 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-medium text-slate-500">Beban BPJS PT</span>
          <p className="text-base sm:text-lg font-bold font-mono text-indigo-600 mt-1">
            {formatIdr(isEmployee ? myBpjsComp : currentPeriod?.totalBpjsEmployer)}
          </p>
          <span className="text-[9px] sm:text-[10px] text-slate-400">Ditanggung Perusahaan</span>
        </div>

        {/* Net Take-Home Pay */}
        <div className="col-span-2 lg:col-span-1 rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 sm:p-3.5 shadow-xs">
          <span className="text-[10px] sm:text-[11px] font-semibold text-emerald-800">
            {isEmployee ? 'Gaji Bersih Diterima' : 'Total Take Home Pay (Net)'}
          </span>
          <p className="text-lg sm:text-xl font-bold font-mono text-emerald-700 mt-1">
            {formatIdr(isEmployee ? myNet : currentPeriod?.totalNetPay)}
          </p>
          <span className="text-[9px] sm:text-[10px] text-emerald-600">
            {isEmployee ? 'Transfer ke Rekening Bank' : `Ditransfer ke ${currentPeriod?.totalEmployees} staf`}
          </span>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {isEmployee
                ? 'Rincian Slip Gaji Mandiri Saya'
                : `Rincian Komponen Gaji per Karyawan (${filteredItems.length} Staf)`}
            </h3>
            <p className="text-xs text-slate-500">
              Audit snapshot tersimpan secara deterministik dan transparan
            </p>
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Cari karyawan di payroll..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden"
            />
          </div>
        </div>

        {/* MOBILE VIEW: Payroll Cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Tidak ada data penggajian yang sesuai filter.
            </div>
          ) : (
            filteredItems.map((item) => {
              const emp = employees.find((e) => e.id === item.employeeId);
              if (!emp) return null;

              const terDetail = item.taxSnapshot;
              const totalEmployeeBpjs =
                item.bpjsKesEmployee + item.bpjsTkJhtEmployee + item.bpjsTkJpEmployee;

              return (
                <div key={item.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{emp.fullName}</p>
                      <p className="text-[11px] font-mono text-slate-400">
                        {emp.employeeId} &bull; {emp.bankName}
                      </p>
                    </div>
                    <span className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                      {emp.ptkpStatus.replace('_', '/')} &bull; TER {terDetail?.terCategory}
                    </span>
                  </div>

                  {/* Net Salary Highlight */}
                  <div className="rounded-xl bg-emerald-50/80 border border-emerald-200 p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
                        Take Home Pay
                      </span>
                      <p className="text-lg font-bold font-mono text-emerald-700">
                        {formatIdr(item.netSalary)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedPayslipItem({ item, employee: emp })}
                      className="flex items-center gap-1.5 rounded-lg bg-white border border-emerald-300 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-xs hover:bg-emerald-50 active:scale-98 transition-all"
                    >
                      <Eye className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Slip Gaji</span>
                    </button>
                  </div>

                  {/* 2x2 Key Breakdown */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                      <span className="text-[10px] text-slate-500">Penghasilan Bruto</span>
                      <p className="font-mono font-bold text-slate-800">{formatIdr(item.grossSalary)}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2 border border-slate-100">
                      <span className="text-[10px] text-slate-500">Gaji Pokok</span>
                      <p className="font-mono font-medium text-slate-800">{formatIdr(item.basicSalary)}</p>
                    </div>
                    <div className="rounded-lg bg-rose-50/50 p-2 border border-rose-100">
                      <span className="text-[10px] text-rose-700">Potongan BPJS</span>
                      <p className="font-mono font-semibold text-rose-600">-{formatIdr(totalEmployeeBpjs)}</p>
                    </div>
                    <div className="rounded-lg bg-amber-50/50 p-2 border border-amber-100">
                      <span className="text-[10px] text-amber-800">PPh 21 TER ({terDetail?.terRatePercent}%)</span>
                      <p className="font-mono font-semibold text-amber-700">-{formatIdr(item.pph21Amount)}</p>
                    </div>
                  </div>

                  {item.overtimePay > 0 && (
                    <div className="flex items-center justify-between rounded-lg bg-emerald-50/50 px-2.5 py-1.5 text-xs text-emerald-800 border border-emerald-100">
                      <span>Lembur PP 35 ({item.overtimeHours} Jam):</span>
                      <span className="font-mono font-bold">{formatIdr(item.overtimePay)}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* DESKTOP VIEW: Payroll Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-semibold uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="px-3 py-2.5">Karyawan</th>
                <th className="px-3 py-2.5 text-right">Gaji Pokok</th>
                <th className="px-3 py-2.5 text-right">Tunjangan</th>
                <th className="px-3 py-2.5 text-right">Lembur PP 35</th>
                <th className="px-3 py-2.5 text-right">Bruto</th>
                <th className="px-3 py-2.5 text-right">BPJS Karyawan</th>
                <th className="px-3 py-2.5 text-right">PPh 21 TER</th>
                <th className="px-3 py-2.5 text-right font-bold text-slate-900">Take Home Pay</th>
                <th className="px-3 py-2.5 text-center">Slip Gaji</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredItems.map((item) => {
                const emp = employees.find((e) => e.id === item.employeeId);
                if (!emp) return null;

                const terDetail = item.taxSnapshot;
                const totalEmployeeBpjs =
                  item.bpjsKesEmployee + item.bpjsTkJhtEmployee + item.bpjsTkJpEmployee;

                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Employee info */}
                    <td className="px-3 py-2.5 font-sans">
                      <p className="font-semibold text-slate-900">{emp.fullName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {emp.employeeId} &bull; {emp.ptkpStatus.replace('_', '/')} (TER {terDetail?.terCategory})
                      </p>
                    </td>

                    {/* Basic Salary */}
                    <td className="px-3 py-2.5 text-right text-slate-800">
                      {formatIdr(item.basicSalary)}
                    </td>

                    {/* Allowances */}
                    <td className="px-3 py-2.5 text-right text-slate-700">
                      {formatIdr(item.fixedAllowance + item.variableAllowance)}
                    </td>

                    {/* Overtime Pay */}
                    <td className="px-3 py-2.5 text-right text-slate-700">
                      {item.overtimePay > 0 ? (
                        <span className="text-emerald-700 font-semibold">{formatIdr(item.overtimePay)}</span>
                      ) : (
                        '-'
                      )}
                    </td>

                    {/* Gross */}
                    <td className="px-3 py-2.5 text-right font-bold text-slate-900">
                      {formatIdr(item.grossSalary)}
                    </td>

                    {/* BPJS Deductions */}
                    <td className="px-3 py-2.5 text-right text-rose-600">
                      -{formatIdr(totalEmployeeBpjs)}
                    </td>

                    {/* PPh 21 TER */}
                    <td className="px-3 py-2.5 text-right text-amber-700">
                      -{formatIdr(item.pph21Amount)}
                      <span className="block text-[9px] font-sans text-slate-400">
                        ({terDetail?.terRatePercent}%)
                      </span>
                    </td>

                    {/* Net Pay */}
                    <td className="px-3 py-2.5 text-right font-bold text-emerald-700 text-sm">
                      {formatIdr(item.netSalary)}
                    </td>

                    {/* Payslip Action */}
                    <td className="px-3 py-2.5 text-center font-sans">
                      <button
                        type="button"
                        onClick={() => setSelectedPayslipItem({ item, employee: emp })}
                        className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-200"
                      >
                        <Eye className="h-3.5 w-3.5 text-slate-500" />
                        <span>Slip Gaji</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Official Indonesian Payslip (Slip Gaji Resmi Elektronik) */}
      {selectedPayslipItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 p-0 sm:p-4 backdrop-blur-xs">
          <div className="max-h-[92vh] w-full sm:max-w-2xl overflow-y-auto rounded-t-2xl sm:rounded-xl border border-slate-300 bg-white p-4 sm:p-6 shadow-2xl">
            {/* Kop Slip Gaji */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-slate-900 pb-4 gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold">
                  <Building className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-tight">
                    {company.name}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-500">
                    {company.address} &bull; NPWP: {company.taxId} &bull; NIB: {company.nib}
                  </p>
                </div>
              </div>
              <div className="sm:text-right flex sm:flex-col justify-between items-center sm:items-end">
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] sm:text-xs font-bold uppercase text-slate-800">
                  SLIP GAJI RESMI
                </span>
                <p className="text-[10px] sm:text-[11px] font-mono text-slate-500 mt-0.5 sm:mt-1">
                  Periode: {currentPeriod?.name}
                </p>
              </div>
            </div>

            {/* Employee Metadata Box */}
            <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 rounded-lg bg-slate-50 p-3 text-xs border border-slate-200">
              <div>
                <p><strong>Nama Karyawan:</strong> {selectedPayslipItem.employee.fullName}</p>
                <p className="mt-0.5"><strong>NIK KTP:</strong> <span className="font-mono">{selectedPayslipItem.employee.nikKtp}</span></p>
                <p className="mt-0.5"><strong>NPWP:</strong> <span className="font-mono">{selectedPayslipItem.employee.npwp}</span></p>
                <p className="mt-0.5"><strong>Status PTKP:</strong> {selectedPayslipItem.employee.ptkpStatus.replace('_', '/')} (Kategori TER {selectedPayslipItem.item.taxSnapshot?.terCategory})</p>
              </div>
              <div>
                <p><strong>ID Pegawai:</strong> <span className="font-mono">{selectedPayslipItem.employee.employeeId}</span></p>
                <p className="mt-0.5"><strong>Rekening Bank:</strong> {selectedPayslipItem.employee.bankName} - <span className="font-mono">{selectedPayslipItem.employee.bankAccountNumber}</span></p>
                <p className="mt-0.5"><strong>Hari Hadir:</strong> {selectedPayslipItem.item.attendanceDays} Hari Kerja</p>
                <p className="mt-0.5"><strong>Jam Lembur:</strong> {selectedPayslipItem.item.overtimeHours} Jam (PP 35/2021)</p>
              </div>
            </div>

            {/* Earnings & Deductions Tables */}
            <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
              {/* Earnings */}
              <div className="rounded-lg border border-slate-200 p-3">
                <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-1 text-[11px] uppercase tracking-wider text-emerald-800">
                  A. Penghasilan (Penerimaan)
                </h4>
                <div className="mt-2 space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="font-sans">Gaji Pokok:</span>
                    <span>{formatIdr(selectedPayslipItem.item.basicSalary)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans">Tunjangan Tetap:</span>
                    <span>{formatIdr(selectedPayslipItem.item.fixedAllowance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans">Tunjangan Kehadiran:</span>
                    <span>{formatIdr(selectedPayslipItem.item.variableAllowance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans">Upah Lembur PP 35/2021:</span>
                    <span>{formatIdr(selectedPayslipItem.item.overtimePay)}</span>
                  </div>
                  {selectedPayslipItem.item.bonusThr > 0 && (
                    <div className="flex justify-between text-amber-700">
                      <span className="font-sans">Bonus / THR:</span>
                      <span>{formatIdr(selectedPayslipItem.item.bonusThr)}</span>
                    </div>
                  )}
                  {selectedPayslipItem.item.reimbursementPay > 0 && (
                    <div className="flex justify-between text-blue-700">
                      <span className="font-sans">Reimbursement:</span>
                      <span>{formatIdr(selectedPayslipItem.item.reimbursementPay)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-slate-900">
                    <span className="font-sans">Penghasilan Bruto:</span>
                    <span>{formatIdr(selectedPayslipItem.item.grossSalary)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="rounded-lg border border-slate-200 p-3">
                <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-1 text-[11px] uppercase tracking-wider text-rose-800">
                  B. Pemotongan
                </h4>
                <div className="mt-2 space-y-1 font-mono">
                  <div className="flex justify-between">
                    <span className="font-sans">PPh 21 TER ({selectedPayslipItem.item.taxSnapshot?.terRatePercent}%):</span>
                    <span>{formatIdr(selectedPayslipItem.item.pph21Amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans">BPJS Kesehatan (1%):</span>
                    <span>{formatIdr(selectedPayslipItem.item.bpjsKesEmployee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans">BPJS TK JHT (2%):</span>
                    <span>{formatIdr(selectedPayslipItem.item.bpjsTkJhtEmployee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-sans">BPJS TK JP (1%):</span>
                    <span>{formatIdr(selectedPayslipItem.item.bpjsTkJpEmployee)}</span>
                  </div>
                  {selectedPayslipItem.item.loanDeduction > 0 && (
                    <div className="flex justify-between">
                      <span className="font-sans">Cicilan Pinjaman:</span>
                      <span>{formatIdr(selectedPayslipItem.item.loanDeduction)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-slate-200 pt-1 font-bold text-rose-700">
                    <span className="font-sans">Total Pemotongan:</span>
                    <span>{formatIdr(selectedPayslipItem.item.totalDeductions)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Salary Summary */}
            <div className="mt-3 sm:mt-4 rounded-xl bg-emerald-50 p-3.5 sm:p-4 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-[11px] sm:text-xs font-semibold text-emerald-900">
                  GAJI BERSIH DITERIMA (TAKE HOME PAY):
                </span>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  Ditransfer langsung ke rekening {selectedPayslipItem.employee.bankName}
                </p>
              </div>
              <div className="sm:text-right">
                <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-800">
                  {formatIdr(selectedPayslipItem.item.netSalary)}
                </span>
              </div>
            </div>

            {/* Employer Contribution Transparency Section */}
            <div className="mt-3 rounded-lg bg-slate-50 p-3 border border-slate-200 text-[10px] sm:text-[11px] text-slate-600">
              <span className="font-bold text-slate-800">
                Informasi Iuran Jaminan Sosial Ditanggung Perusahaan (Total: {formatIdr(selectedPayslipItem.item.totalEmployerCost)}):
              </span>
              <p className="mt-0.5 leading-relaxed">
                BPJS Kes (4%): {formatIdr(selectedPayslipItem.item.bpjsKesEmployer)} &bull; BPJS TK JHT (3.7%): {formatIdr(selectedPayslipItem.item.bpjsTkJhtEmployer)} &bull; BPJS TK JP (2%): {formatIdr(selectedPayslipItem.item.bpjsTkJpEmployer)} &bull; JKK: {formatIdr(selectedPayslipItem.item.bpjsTkJkkEmployer)} &bull; JKM: {formatIdr(selectedPayslipItem.item.bpjsTkJkmEmployer)}
              </p>
            </div>

            {/* Footer and Print Button */}
            <div className="mt-4 sm:mt-5 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-3">
              <div className="text-[10px] sm:text-[11px] text-slate-400">
                Dokumen resmi digenerate secara elektronik pada {new Date().toLocaleDateString('id-ID')}.
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3.5 py-2 sm:py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 active:scale-98 transition-all"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Cetak / PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPayslipItem(null)}
                  className="flex-1 sm:flex-initial rounded-lg bg-slate-900 px-4 py-2 sm:py-1.5 text-xs font-semibold text-white hover:bg-slate-800 active:scale-98 transition-all"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Export Bank Transfer (BCA / Mandiri Format) */}
      {isBankExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4 backdrop-blur-xs">
          <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900">
              Export File Batch Transfer Penggajian
            </h3>
            <p className="text-xs text-slate-500">
              Format transfer resmi untuk diupload ke KlikBCA Bisnis atau Mandiri Cash Management (MCM).
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-700">Pilih Format Perbankan</label>
                <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBankExportType('BCA')}
                    className={`rounded-lg border p-2.5 text-left text-xs font-medium transition-colors ${
                      bankExportType === 'BCA'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    BCA Payroll (KlikBCA Bisnis)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBankExportType('MANDIRI')}
                    className={`rounded-lg border p-2.5 text-left text-xs font-medium transition-colors ${
                      bankExportType === 'MANDIRI'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    Mandiri Cash Management (MCM)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700">Preview Data Transfer ({currentPeriodItems.length} Penerima)</label>
                <textarea
                  readOnly
                  rows={6}
                  value={generateBankCsv()}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-slate-50 p-2 font-mono text-[11px] text-slate-700 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsBankExportModalOpen(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-xs"
                >
                  <Download className="h-4 w-4" />
                  <span>Unduh File CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Kalkulator THR Keagamaan (Permenaker 6/2016) */}
      {isThrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4 backdrop-blur-xs">
          <div className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900">
              Kalkulator THR Keagamaan (Permenaker No. 6/2016)
            </h3>
            <p className="text-xs text-slate-500">
              Formula resmi pemerintah: Masa kerja &ge; 12 bulan = 1 bulan upah; Masa kerja 1-12 bulan = pro-rata (N/12).
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-700">Pilih Karyawan</label>
                {isEmployee ? (
                  <div className="mt-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800">
                    {session.name} ({session.employeeId})
                  </div>
                ) : (
                  <select
                    value={thrEmployeeId}
                    onChange={(e) => setThrEmployeeId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-hidden"
                  >
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.fullName} ({e.employeeId})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-700">Masa Kerja Berjalan (Bulan)</label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={thrTenureMonths}
                  onChange={(e) => setThrTenureMonths(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-mono text-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="rounded-lg bg-amber-50 p-3.5 border border-amber-200 text-xs">
                <h5 className="font-bold text-amber-950">Rincian Hak THR Keagamaan:</h5>
                <div className="mt-2 space-y-1 text-slate-700">
                  <div className="flex justify-between">
                    <span>Upah Dasar (Gaji Pokok + Tunj. Tetap):</span>
                    <span className="font-mono font-bold">{formatIdr(thrCalculation.monthlyWage)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pengali Masa Kerja ({thrCalculation.tenureMonths} Bulan):</span>
                    <span className="font-mono font-bold text-amber-800">
                      {thrCalculation.multiplier} ({thrCalculation.isProrated ? 'Pro-rata' : '1 Bulan Penuh'})
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-amber-200 pt-1.5 font-bold text-slate-900 text-sm">
                    <span>Hak THR Keagamaan:</span>
                    <span className="font-mono text-emerald-700">{formatIdr(thrCalculation.thrAmount)}</span>
                  </div>
                </div>
                <p className="mt-2 text-[10px] text-amber-800 font-medium">
                  Dasar Hukum: {thrCalculation.regulation}
                </p>
              </div>

              <div className="flex justify-end border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsThrModalOpen(false)}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
