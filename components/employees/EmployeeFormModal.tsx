'use client';

import React, { useState, useEffect } from 'react';
import { X, Phone } from 'lucide-react';
import {
  Employee,
  Department,
  Branch,
  Position,
  TaxPtkpStatus,
  EmploymentType,
} from '@/lib/types';
import { formatIdr } from '@/lib/format';

// ==========================================
// 1. ADD EMPLOYEE MODAL
// ==========================================
export interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (employeeData: Omit<Employee, 'id'>) => void;
  departments: Department[];
  branches: Branch[];
  positions: Position[];
  employeesCount: number;
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  departments,
  branches,
  positions,
  employeesCount,
}) => {
  const [form, setForm] = useState(() => ({
    employeeId: `NTM-2024-${String(employeesCount + 1).padStart(3, '0')}`,
    nikKtp: '3171012005950001',
    fullName: '',
    nickname: '',
    email: '',
    phone: '0812',
    birthPlace: 'Jakarta',
    birthDate: '1995-05-20',
    gender: 'MALE' as const,
    maritalStatus: 'SINGLE' as const,
    religion: 'Islam',
    addressKtp: 'Jl. Sudirman No. 10',
    branchId: branches[0]?.id || 'branch-jkt',
    departmentId: departments[0]?.id || 'dept-eng',
    positionId: positions[0]?.id || 'pos-swe',
    joinDate: new Date().toISOString().split('T')[0],
    employmentType: 'PERMANENT' as EmploymentType,
    status: 'ACTIVE' as const,
    basicSalary: 12000000,
    fixedAllowance: 1500000,
    mealAllowance: 40000,
    transportAllowance: 45000,
    communicationAllowance: 400000,
    bankName: 'BCA',
    bankAccountNumber: '1234567890',
    bankAccountHolder: '',
    npwp: '01.234.567.8-011.000',
    ptkpStatus: 'TK_0' as TaxPtkpStatus,
    hasNpwp: true,
    bpjsKesNumber: '0001234567890',
    bpjsTkNumber: '21098765432',
    isBpjsKesActive: true,
    isBpjsTkActive: true,
  }));

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.nikKtp) {
      alert('Nama Lengkap dan NIK KTP wajib diisi!');
      return;
    }
    onSubmit({
      ...form,
      bankAccountHolder: form.bankAccountHolder || form.fullName,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Pendaftaran Karyawan Baru</h3>
            <p className="text-xs text-slate-500">Isi data lengkap sesuai KTP, NPWP &amp; Rekening Bank</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-medium text-slate-700">Nama Lengkap (Sesuai KTP) *</label>
              <input
                type="text"
                required
                placeholder="Contoh: Rian Pratama"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-700">NIK KTP (16 Digit) *</label>
              <input
                type="text"
                required
                maxLength={16}
                value={form.nikKtp}
                onChange={(e) => setForm({ ...form, nikKtp: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="text-[11px] font-medium text-slate-700">Email Perusahaan *</label>
              <input
                type="email"
                required
                placeholder="nama@nusantaratech.co.id"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-700">Nomor WhatsApp</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-700">Status Kerja</label>
              <select
                value={form.employmentType}
                onChange={(e) => setForm({ ...form, employmentType: e.target.value as any })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden bg-white"
              >
                <option value="PERMANENT">Karyawan Tetap (PKWTT)</option>
                <option value="CONTRACT">Karyawan Kontrak (PKWT)</option>
                <option value="INTERNSHIP">Magang (Internship)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="text-[11px] font-medium text-slate-700">Departemen</label>
              <select
                value={form.departmentId}
                onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden bg-white"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-700">Jabatan / Posisi</label>
              <select
                value={form.positionId}
                onChange={(e) => setForm({ ...form, positionId: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden bg-white"
              >
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-700">Kantor Cabang</label>
              <select
                value={form.branchId}
                onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden bg-white"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} (UMR {formatIdr(b.umrAmount)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[11px] font-medium text-slate-700">Gaji Pokok (IDR/Bulan)</label>
              <input
                type="number"
                min={0}
                step={100000}
                value={form.basicSalary}
                onChange={(e) => setForm({ ...form, basicSalary: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-900 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-700">Tunjangan Tetap (Jabatan)</label>
              <input
                type="number"
                min={0}
                step={50000}
                value={form.fixedAllowance}
                onChange={(e) => setForm({ ...form, fixedAllowance: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-900 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="text-[11px] font-medium text-slate-700">Status PTKP Pajak</label>
              <select
                value={form.ptkpStatus}
                onChange={(e) => setForm({ ...form, ptkpStatus: e.target.value as TaxPtkpStatus })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden bg-white"
              >
                <option value="TK_0">TK/0 (Lajang tanpa tanggungan)</option>
                <option value="TK_1">TK/1 (Lajang 1 tanggungan)</option>
                <option value="K_0">K/0 (Menikah tanpa tanggungan)</option>
                <option value="K_1">K/1 (Menikah 1 anak)</option>
                <option value="K_2">K/2 (Menikah 2 anak)</option>
                <option value="K_3">K/3 (Menikah 3 anak)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-700">Bank Payroll</label>
              <select
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden bg-white"
              >
                <option value="BCA">BCA (Bank Central Asia)</option>
                <option value="MANDIRI">Bank Mandiri</option>
                <option value="BRI">Bank Rakyat Indonesia (BRI)</option>
                <option value="BNI">Bank Negara Indonesia (BNI)</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-700">Nomor Rekening</label>
              <input
                type="text"
                required
                value={form.bankAccountNumber}
                onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 shadow-xs"
            >
              Daftarkan Karyawan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 2. SALARY ADJUSTMENT MODAL
// ==========================================
export interface SalaryAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onSubmit: (employeeId: string, updates: { basicSalary: number; fixedAllowance: number }, reason: string) => void;
}

export const SalaryAdjustmentModal: React.FC<SalaryAdjustmentModalProps> = ({
  isOpen,
  onClose,
  employee,
  onSubmit,
}) => {
  const [form, setForm] = useState(() => ({
    basicSalary: Number(employee?.basicSalary) || 0,
    fixedAllowance: Number(employee?.fixedAllowance) || 0,
    reason: 'Penyesuaian Kompensasi Berkala (Annual Review)',
  }));

  if (!isOpen || !employee) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(
      employee.id,
      {
        basicSalary: form.basicSalary,
        fixedAllowance: form.fixedAllowance,
      },
      form.reason
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Penyesuaian Gaji</h3>
            <p className="text-xs text-slate-500 truncate max-w-[280px]">{employee.fullName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
          <p className="text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            Setiap perubahan kompensasi dicatat secara permanen di Audit Trail sistem HRIS.
          </p>

          <div>
            <label className="text-[11px] font-medium text-slate-700">Gaji Pokok Baru (IDR)</label>
            <input
              type="number"
              step={100000}
              required
              value={form.basicSalary}
              onChange={(e) => setForm({ ...form, basicSalary: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-700">Tunjangan Tetap Baru (IDR)</label>
            <input
              type="number"
              step={50000}
              required
              value={form.fixedAllowance}
              onChange={(e) => setForm({ ...form, fixedAllowance: Number(e.target.value) })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-700">Alasan Penyesuaian (Wajib Diisi)</label>
            <textarea
              rows={2}
              required
              placeholder="Contoh: Kenaikan jabatan atau penyesuaian evaluasi tahunan"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 shadow-xs"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// 3. ESS CONTACT EDIT MODAL
// ==========================================
export interface ContactEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onSubmit: (updates: { phone: string; addressKtp: string; nickname?: string }, reason: string) => void;
}

export const ContactEditModal: React.FC<ContactEditModalProps> = ({
  isOpen,
  onClose,
  employee,
  onSubmit,
}) => {
  const [form, setForm] = useState(() => ({
    phone: employee?.phone || '',
    addressKtp: employee?.addressKtp || '',
    nickname: employee?.nickname || '',
  }));

  if (!isOpen || !employee) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(
      {
        phone: form.phone,
        addressKtp: form.addressKtp,
        nickname: form.nickname,
      },
      'Pembaruan kontak mandiri oleh karyawan (ESS)'
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <Phone className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Perbarui Kontak Pribadi</h3>
              <p className="text-[11px] text-slate-500">Pembaruan nomor telepon dan alamat domisili</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-medium text-slate-700 block">Nomor WhatsApp / HP Aktif</label>
            <input
              type="text"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="font-medium text-slate-700 block">Nama Panggilan (Nickname)</label>
            <input
              type="text"
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="font-medium text-slate-700 block">Alamat Domisili KTP</label>
            <textarea
              rows={3}
              required
              value={form.addressKtp}
              onChange={(e) => setForm({ ...form, addressKtp: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="rounded-lg bg-amber-50 p-2.5 border border-amber-200 text-[11px] text-amber-800">
            <p>
              <strong>Catatan:</strong> Data gaji, jabatan, divisi, dan rekening bank tidak dapat diubah secara mandiri demi integritas audit HRIS.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-3.5 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-lg bg-emerald-600 px-4 py-1.5 font-semibold text-white hover:bg-emerald-700 shadow-xs"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
