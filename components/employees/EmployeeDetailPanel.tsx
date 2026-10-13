'use client';

import React, { useState } from 'react';
import { X, FileText, CreditCard, Lock } from 'lucide-react';
import {
  Employee,
  Department,
  Branch,
  Position,
  UserSession,
  EmployeeDocument,
  EmployeeLoan,
} from '@/lib/types';
import { formatIdr, formatDateId } from '@/lib/format';
import { getTerCategory } from '@/lib/payroll/tax';
import { EmployeeDocumentsSection } from '../EmployeeDocumentsSection';
import { EmployeeLoanSection } from '../EmployeeLoanSection';

export interface EmployeeDetailPanelProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  branches: Branch[];
  positions: Position[];
  session: UserSession;
  canViewSalaries: boolean;
  canEditCompensation: boolean;
  documents?: EmployeeDocument[];
  employeeLoans?: EmployeeLoan[];
  onRefresh?: () => void;
  showToast?: (text: string, type?: 'success' | 'error') => void;
  onOpenSalaryEdit: (employee: Employee) => void;
}

export const EmployeeDetailPanel: React.FC<EmployeeDetailPanelProps> = ({
  employee,
  isOpen,
  onClose,
  departments,
  branches,
  positions,
  session,
  canViewSalaries,
  canEditCompensation,
  documents = [],
  employeeLoans = [],
  onRefresh,
  showToast,
  onOpenSalaryEdit,
}) => {
  const [detailModalTab, setDetailModalTab] = useState<'PROFILE' | 'DOCUMENTS' | 'LOANS'>('PROFILE');

  if (!isOpen || !employee) return null;

  const dept = departments.find((d) => d.id === employee.departmentId);
  const pos = positions.find((p) => p.id === employee.positionId);
  const branch = branches.find((b) => b.id === employee.branchId);
  const terCategory = getTerCategory(employee.ptkpStatus);

  const empDocsCount = documents.filter((d) => d.employeeId === employee.id).length;
  const empLoansCount = employeeLoans.filter((l) => l.employeeId === employee.id).length;

  const handleClose = () => {
    setDetailModalTab('PROFILE');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl max-h-[85vh] rounded-2xl border border-slate-200 bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-800 font-bold">
              {employee.fullName.charAt(0)}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{employee.fullName}</h3>
              <p className="text-xs text-slate-500 font-mono">
                ID: {employee.employeeId} &bull; Bergabung: {formatDateId(employee.joinDate)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sub-tab Navigation */}
        <div className="border-b border-slate-200 bg-slate-50 px-6">
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => setDetailModalTab('PROFILE')}
              className={`border-b-2 py-2.5 text-xs font-semibold transition-colors ${
                detailModalTab === 'PROFILE'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Ringkasan Profil &amp; Gaji
            </button>
            <button
              type="button"
              onClick={() => setDetailModalTab('DOCUMENTS')}
              className={`flex items-center gap-1.5 border-b-2 py-2.5 text-xs font-semibold transition-colors ${
                detailModalTab === 'DOCUMENTS'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Berkas Dokumen</span>
              <span className="rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] text-slate-700 font-mono">
                {empDocsCount}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setDetailModalTab('LOANS')}
              className={`flex items-center gap-1.5 border-b-2 py-2.5 text-xs font-semibold transition-colors ${
                detailModalTab === 'LOANS'
                  ? 'border-emerald-600 text-emerald-800'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>Pinjaman &amp; Kasbon</span>
              <span className="rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] text-slate-700 font-mono">
                {empLoansCount}
              </span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {detailModalTab === 'PROFILE' && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200 space-y-1.5">
                  <h4 className="font-semibold text-slate-900 border-b border-slate-200 pb-1 mb-2">
                    Identitas &amp; Kontak
                  </h4>
                  <p>
                    <strong>NIK KTP:</strong> <span className="font-mono">{employee.nikKtp}</span>
                  </p>
                  <p>
                    <strong>NPWP:</strong> <span className="font-mono">{employee.npwp}</span>
                  </p>
                  <p>
                    <strong>Email:</strong> {employee.email}
                  </p>
                  <p>
                    <strong>Telepon:</strong> {employee.phone}
                  </p>
                  <p>
                    <strong>Alamat:</strong> {employee.addressKtp}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 p-3.5 border border-slate-200 space-y-1.5">
                  <h4 className="font-semibold text-slate-900 border-b border-slate-200 pb-1 mb-2">
                    Penempatan &amp; Pajak
                  </h4>
                  <p>
                    <strong>Divisi:</strong> {dept?.name || '-'}
                  </p>
                  <p>
                    <strong>Jabatan:</strong> {pos?.title || '-'}
                  </p>
                  <p>
                    <strong>Cabang:</strong> {branch?.name || '-'}
                  </p>
                  <p>
                    <strong>Status PTKP:</strong> {employee.ptkpStatus.replace('_', '/')} (Kategori TER {terCategory})
                  </p>
                  <p>
                    <strong>Bank:</strong> {employee.bankName} -{' '}
                    {canViewSalaries ? employee.bankAccountNumber : '••••••••••••'}
                  </p>
                </div>
              </div>

              {canViewSalaries ? (
                <div className="rounded-lg bg-emerald-50/70 p-3.5 border border-emerald-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-emerald-950">Struktur Kompensasi &amp; Gaji</h4>
                      <p className="text-emerald-800 font-mono mt-0.5">
                        Gaji Pokok: <strong>{formatIdr(employee.basicSalary)}</strong> | Tunjangan:{' '}
                        <strong>{formatIdr(employee.fixedAllowance)}</strong>
                      </p>
                    </div>
                    {canEditCompensation && (
                      <button
                        type="button"
                        onClick={() => onOpenSalaryEdit(employee)}
                        className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 shadow-xs"
                      >
                        Ubah Gaji
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg bg-slate-100 p-3.5 border border-slate-200 text-slate-500 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-slate-400" />
                  <span>
                    Informasi kompensasi dan rekening karyawan bersifat rahasia (Akses HR/Payroll Admin).
                  </span>
                </div>
              )}
            </>
          )}

          {detailModalTab === 'DOCUMENTS' && (
            <EmployeeDocumentsSection
              documents={documents}
              employee={employee}
              session={session}
              onRefresh={onRefresh}
              showToast={showToast}
            />
          )}

          {detailModalTab === 'LOANS' && (
            <EmployeeLoanSection
              loans={employeeLoans}
              employee={employee}
              session={session}
              onRefresh={onRefresh}
              showToast={showToast}
            />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 flex justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
