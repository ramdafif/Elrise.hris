'use client';

import React from 'react';
import { Eye, Edit, Loader2 } from 'lucide-react';
import { Employee, Department, Branch, Position } from '@/lib/types';
import { formatIdr } from '@/lib/format';
import { getTerCategory } from '@/lib/payroll/tax';

export interface EmployeeListTableProps {
  employees: Employee[];
  departments: Department[];
  branches: Branch[];
  positions: Position[];
  canViewSalaries: boolean;
  canEditCompensation: boolean;
  onViewDetail: (employee: Employee) => void;
  onEditSalary: (employee: Employee) => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
}

export const EmployeeListTable: React.FC<EmployeeListTableProps> = ({
  employees,
  departments,
  branches,
  positions,
  canViewSalaries,
  canEditCompensation,
  onViewDetail,
  onEditSalary,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
}) => {
  return (
    <div className="space-y-4">
      {/* MOBILE VIEW: Employee Cards */}
      <div className="md:hidden space-y-3">
        {employees.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500">
            Tidak ada data anggota tim yang cocok dengan kriteria pencarian.
          </div>
        ) : (
          employees.map((emp) => {
            const dept = departments.find((d) => d.id === emp.departmentId);
            const pos = positions.find((p) => p.id === emp.positionId);
            const branch = branches.find((b) => b.id === emp.branchId);
            const terCategory = getTerCategory(emp.ptkpStatus);

            return (
              <div
                key={`mobile-${emp.id}`}
                className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-800 text-sm">
                      {emp.fullName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 leading-snug">
                        {emp.fullName}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-400">
                        {emp.employeeId} &bull; {branch?.name || 'Jakarta'}
                      </p>
                    </div>
                  </div>

                  <span className="inline-block shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {emp.employmentType === 'PERMANENT' ? 'PKWTT' : emp.employmentType === 'CONTRACT' ? 'PKWT' : 'Magang'}
                  </span>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Posisi & Divisi</span>
                    <p className="font-medium text-slate-800 truncate">{pos?.title || 'Staff'}</p>
                    <p className="text-[11px] text-slate-500 truncate">{dept?.name || 'General'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Gaji Pokok</span>
                    {canViewSalaries ? (
                      <>
                        <p className="font-mono font-semibold text-slate-900">
                          {formatIdr(emp.basicSalary)}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          +{formatIdr(emp.fixedAllowance)} Tunj.
                        </p>
                      </>
                    ) : (
                      <p className="font-mono text-slate-400 text-xs mt-1">••••••••</p>
                    )}
                  </div>
                  <div className="pt-1.5 border-t border-slate-200/60">
                    <span className="text-[10px] text-slate-400 block">Bank Rekening</span>
                    <p className="font-medium text-slate-800">{emp.bankName}</p>
                    <p className="font-mono text-[11px] text-slate-500">
                      {canViewSalaries ? emp.bankAccountNumber : '••••••••••••'}
                    </p>
                  </div>
                  <div className="pt-1.5 border-t border-slate-200/60">
                    <span className="text-[10px] text-slate-400 block">Pajak PTKP</span>
                    <span className="inline-block mt-0.5 rounded bg-amber-50 px-1.5 py-0.5 font-mono text-[11px] font-bold text-amber-800 border border-amber-200">
                      {emp.ptkpStatus.replace('_', '/')} (TER {terCategory})
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onViewDetail(emp)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100"
                  >
                    <Eye className="h-3.5 w-3.5 text-slate-500" />
                    <span>Detail Profil</span>
                  </button>
                  {canEditCompensation && (
                    <button
                      type="button"
                      onClick={() => onEditSalary(emp)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 active:bg-blue-200"
                    >
                      <Edit className="h-3.5 w-3.5 text-blue-600" />
                      <span>Ubah Gaji</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP VIEW: Full Data Table */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="px-4 py-3">Pegawai</th>
                <th className="px-4 py-3">Posisi &amp; Divisi</th>
                <th className="px-4 py-3">Cabang &amp; Status</th>
                <th className="px-4 py-3 text-right">Gaji Pokok</th>
                <th className="px-4 py-3 text-center">PTKP &amp; TER</th>
                <th className="px-4 py-3">Bank &amp; Rekening</th>
                <th className="px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada data pegawai yang sesuai filter.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const dept = departments.find((d) => d.id === emp.departmentId);
                  const pos = positions.find((p) => p.id === emp.positionId);
                  const branch = branches.find((b) => b.id === emp.branchId);
                  const terCategory = getTerCategory(emp.ptkpStatus);

                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Employee Identity */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700">
                            {emp.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{emp.fullName}</p>
                            <p className="text-[11px] font-mono text-slate-400">
                              {emp.employeeId} &bull; NIK: {emp.nikKtp.slice(0, 8)}****
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Position & Department */}
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{pos?.title || 'Staff'}</p>
                        <p className="text-[11px] text-slate-500">{dept?.name || 'General'}</p>
                      </td>

                      {/* Branch & Type */}
                      <td className="px-4 py-3">
                        <p className="text-slate-800">{branch?.name || 'Jakarta'}</p>
                        <span className="inline-block mt-0.5 rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-medium text-slate-600">
                          {emp.employmentType === 'PERMANENT' ? 'PKWTT' : emp.employmentType === 'CONTRACT' ? 'PKWT' : 'Magang'}
                        </span>
                      </td>

                      {/* Salary */}
                      <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">
                        {canViewSalaries ? (
                          <>
                            <span>{formatIdr(emp.basicSalary)}</span>
                            <p className="text-[10px] font-sans text-slate-400">
                              + {formatIdr(emp.fixedAllowance)} Tunjangan
                            </p>
                          </>
                        ) : (
                          <span className="text-slate-400 font-mono text-xs italic">
                            ••••••••
                          </span>
                        )}
                      </td>

                      {/* Tax PTKP & TER Category */}
                      <td className="px-4 py-3 text-center">
                        <span className="rounded bg-amber-50 px-2 py-0.5 font-mono text-xs font-semibold text-amber-800 border border-amber-200">
                          {emp.ptkpStatus.replace('_', '/')}
                        </span>
                        <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
                          TER {terCategory}
                        </p>
                      </td>

                      {/* Bank Account */}
                      <td className="px-4 py-3">
                        <p className="text-slate-800">{emp.bankName}</p>
                        <p className="text-[11px] font-mono text-slate-500">
                          {canViewSalaries ? emp.bankAccountNumber : '••••••••••••'}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onViewDetail(emp)}
                            title="Lihat Profil Lengkap"
                            className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {canEditCompensation && (
                            <button
                              type="button"
                              onClick={() => onEditSalary(emp)}
                              title="Penyesuaian Gaji"
                              className="rounded p-1 text-blue-600 hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination / Load More Trigger */}
      {hasMore && onLoadMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-600" />
                <span>Memuat data berikutnya...</span>
              </>
            ) : (
              <span>Muat Lebih Banyak Karyawan</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
