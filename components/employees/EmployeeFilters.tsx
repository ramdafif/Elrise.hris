'use client';

import React, { useState } from 'react';
import { Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Department, Branch } from '@/lib/types';

export interface EmployeeFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedDept: string;
  onDeptChange: (value: string) => void;
  selectedBranch: string;
  onBranchChange: (value: string) => void;
  selectedType: string;
  onTypeChange: (value: string) => void;
  departments: Department[];
  branches: Branch[];
  isManager: boolean;
  managerDeptId?: string;
  managerDeptName?: string;
  filteredCount: number;
  onResetFilters: () => void;
}

export const EmployeeFilters: React.FC<EmployeeFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedDept,
  onDeptChange,
  selectedBranch,
  onBranchChange,
  selectedType,
  onTypeChange,
  departments,
  branches,
  isManager,
  managerDeptId,
  managerDeptName = 'Departemen Anda',
  filteredCount,
  onResetFilters,
}) => {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const hasActiveFilters =
    searchTerm !== '' ||
    (!isManager && selectedDept !== 'ALL') ||
    selectedBranch !== 'ALL' ||
    selectedType !== 'ALL';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs">
      <div className="flex flex-col gap-3">
        {/* Search Bar + Mobile Filter Toggle Button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="employee-search"
              type="text"
              placeholder={isManager ? 'Cari anggota tim nama, NIP...' : 'Cari nama, NIK, ID pegawai...'}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-hidden"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="sm:hidden flex items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filter</span>
            {(selectedDept !== 'ALL' || selectedBranch !== 'ALL' || selectedType !== 'ALL') && (
              <span className="flex h-2 w-2 rounded-full bg-emerald-600" />
            )}
            {isMobileFilterOpen ? (
              <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            )}
          </button>
        </div>

        {/* Department, Branch, Type Filters (Disabled or scoped for Manager) */}
        <div
          className={`grid grid-cols-1 gap-2.5 sm:grid-cols-3 ${
            isMobileFilterOpen ? 'grid' : 'hidden sm:grid'
          }`}
        >
          {/* Department Filter */}
          <div>
            <label className="sm:hidden text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
              Departemen
            </label>
            <select
              id="filter-department"
              disabled={isManager}
              value={isManager ? managerDeptId || 'ALL' : selectedDept}
              onChange={(e) => onDeptChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden bg-white disabled:bg-slate-100 disabled:text-slate-500"
            >
              {isManager ? (
                <option value={managerDeptId || 'ALL'}>{managerDeptName}</option>
              ) : (
                <>
                  <option value="ALL">Semua Departemen</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* Branch Filter */}
          <div>
            <label className="sm:hidden text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
              Cabang
            </label>
            <select
              id="filter-branch"
              value={selectedBranch}
              onChange={(e) => onBranchChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden bg-white"
            >
              <option value="ALL">Semua Cabang / UMK</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Employment Type */}
          <div>
            <label className="sm:hidden text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 block">
              Status Kerja
            </label>
            <select
              id="filter-type"
              value={selectedType}
              onChange={(e) => onTypeChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden bg-white"
            >
              <option value="ALL">Semua Status Kerja</option>
              <option value="PERMANENT">Tetap (PKWTT)</option>
              <option value="CONTRACT">Kontrak (PKWT)</option>
              <option value="INTERNSHIP">Magang (Intern)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Filter Counts */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-xs text-slate-500">
        <span>
          Menampilkan <strong>{filteredCount}</strong> pegawai
          {isManager && ` dalam ${managerDeptName}`}.
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-200"
          >
            Reset filter &times;
          </button>
        )}
      </div>
    </div>
  );
};
