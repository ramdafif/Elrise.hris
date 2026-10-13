'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  ShieldAlert,
  Edit,
  UserCheck,
  Lock,
  Briefcase,
  Building,
  MapPin,
  Users,
  ShieldCheck,
  CreditCard,
  FileText,
} from 'lucide-react';
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
import { useEmployees } from '@/lib/hooks/useEmployees';

import { EmployeeFilters } from './EmployeeFilters';
import { EmployeeListTable } from './EmployeeListTable';
import { EmployeeDetailPanel } from './EmployeeDetailPanel';
import {
  AddEmployeeModal,
  SalaryAdjustmentModal,
  ContactEditModal,
} from './EmployeeFormModal';

export * from './EmployeeFilters';
export * from './EmployeeListTable';
export * from './EmployeeDetailPanel';
export * from './EmployeeFormModal';

export interface EmployeesViewProps {
  session: UserSession;
  employees?: Employee[];
  departments: Department[];
  branches: Branch[];
  positions: Position[];
  documents?: EmployeeDocument[];
  employeeLoans?: EmployeeLoan[];
  onAddEmployee?: (emp: Omit<Employee, 'id'>) => Promise<any> | void;
  onUpdateEmployee?: (id: string, updates: Partial<Employee>, reason?: string) => Promise<any> | void;
  onRefresh?: () => void;
  showToast?: (text: string, type?: 'success' | 'error') => void;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({
  session,
  employees: propEmployees = [],
  departments,
  branches,
  positions,
  documents = [],
  employeeLoans = [],
  onAddEmployee,
  onUpdateEmployee,
  onRefresh,
  showToast,
}) => {
  // 1. Hook for all CRUD and data management
  const {
    employees,
    isLoading,
    hasMore,
    loadMore,
    createEmployee,
    updateEmployee,
  } = useEmployees({
    session,
    initialEmployees: propEmployees,
    onSuccess: (msg) => {
      showToast?.(msg, 'success');
      onRefresh?.();
    },
    onError: (msg) => {
      showToast?.(msg, 'error');
    },
  });

  // 2. Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');

  // 3. Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSalaryEditModalOpen, setIsSalaryEditModalOpen] = useState(false);
  const [isContactEditOpen, setIsContactEditOpen] = useState(false);
  const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState<Employee | null>(null);

  // 4. Role & Permissions Calculation
  const isEmployee = session.role === 'EMPLOYEE';
  const isManager = session.role === 'ADMIN_PROJECT';
  const canCreateEmployee = session.role === 'SUPERADMIN' || session.role === 'ADMIN_PT';
  const canEditCompensation = session.role === 'SUPERADMIN' || session.role === 'ADMIN_PT';
  const canViewSalaries = session.role === 'SUPERADMIN' || session.role === 'ADMIN_PT';

  // 5. ESS Identification
  const myEmployeeRecord = employees.find((e) => e.id === session.employeeId) || employees[0];

  // 6. Scoping for Project Admin
  const managerDeptId = isManager
    ? employees.find((e) => e.id === session.employeeId)?.departmentId
    : undefined;
  const managerDeptName =
    departments.find((d) => d.id === managerDeptId)?.name || 'Proyek / Divisi Anda';

  // 7. Filtered employees list
  const filteredEmployees = employees.filter((emp) => {
    if (isManager && managerDeptId && emp.departmentId !== managerDeptId) {
      return false;
    }
    const matchesSearch =
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.nikKtp.includes(searchTerm);

    const matchesDept = isManager
      ? true
      : selectedDept === 'ALL' || emp.departmentId === selectedDept;

    const matchesBranch = selectedBranch === 'ALL' || emp.branchId === selectedBranch;
    const matchesType = selectedType === 'ALL' || emp.employmentType === selectedType;

    return matchesSearch && matchesDept && matchesBranch && matchesType;
  });

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedDept('ALL');
    setSelectedBranch('ALL');
    setSelectedType('ALL');
  };

  // Handlers for Modals
  const handleOpenDetail = (emp: Employee) => {
    setSelectedEmployeeForDetail(emp);
    setIsDetailModalOpen(true);
  };

  const handleOpenSalaryEdit = (emp: Employee) => {
    setSelectedEmployeeForDetail(emp);
    setIsSalaryEditModalOpen(true);
  };

  const handleAddSubmit = async (newEmp: Omit<Employee, 'id'>) => {
    if (onAddEmployee) {
      await onAddEmployee(newEmp);
    } else {
      await createEmployee(newEmp);
    }
  };

  const handleSalaryUpdateSubmit = async (
    empId: string,
    updates: { basicSalary: number; fixedAllowance: number },
    reason: string
  ) => {
    if (onUpdateEmployee) {
      await onUpdateEmployee(empId, updates, reason);
    } else {
      await updateEmployee(empId, updates, reason);
    }
    // Update local modal view if it was currently opened
    if (selectedEmployeeForDetail && selectedEmployeeForDetail.id === empId) {
      setSelectedEmployeeForDetail((prev) => (prev ? { ...prev, ...updates } : prev));
    }
  };

  const handleContactUpdateSubmit = async (
    updates: { phone: string; addressKtp: string; nickname?: string },
    reason: string
  ) => {
    const targetId = myEmployeeRecord?.id || session.employeeId || 'emp-005';
    if (onUpdateEmployee) {
      await onUpdateEmployee(targetId, updates, reason);
    } else {
      await updateEmployee(targetId, updates, reason);
    }
    showToast?.('Kontak pribadi Anda berhasil diperbarui.', 'success');
  };

  // ==========================================
  // CASE 1: EMPLOYEE ROLE (Dedicated ESS View)
  // ==========================================
  if (isEmployee) {
    const myDept = departments.find((d) => d.id === myEmployeeRecord?.departmentId);
    const myPos = positions.find((p) => p.id === myEmployeeRecord?.positionId);
    const myBranch = branches.find((b) => b.id === myEmployeeRecord?.branchId);
    const myTerCategory = myEmployeeRecord ? getTerCategory(myEmployeeRecord.ptkpStatus) : 'A';

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-6"
      >
        {/* Header Banner */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <UserCheck className="h-3.5 w-3.5" /> Portal Karyawan Mandiri (ESS)
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200">
                <Lock className="h-3 w-3 text-slate-400" /> Akses Terisolasi
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1.5">Profil Karyawan Mandiri</h2>
            <p className="text-xs text-slate-500">
              Data Resmi Kepegawaian, Jaminan Sosial BPJS, Hak Kompensasi &amp; Status Perpajakan Terdaftar
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsContactEditOpen(true)}
            className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors"
          >
            <Edit className="h-3.5 w-3.5" />
            <span>Perbarui Kontak Pribadi</span>
          </button>
        </div>

        {/* Top Profile Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white font-bold text-2xl shadow-xs">
                {myEmployeeRecord?.fullName.charAt(0) || 'K'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{myEmployeeRecord?.fullName}</h3>
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                    AKTIF
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-500 mt-0.5">
                  NIP: <strong>{myEmployeeRecord?.employeeId}</strong> &bull; Nama Panggilan: {myEmployeeRecord?.nickname || '-'}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700 font-medium">
                    <Briefcase className="h-3 w-3 text-slate-500" />
                    {myPos?.title || 'Pegawai'}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700 font-medium">
                    <Building className="h-3 w-3 text-slate-500" />
                    {myDept?.name || 'Departemen'}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700 font-medium">
                    <MapPin className="h-3 w-3 text-slate-500" />
                    {myBranch?.name || 'Kantor Pusat'}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 border border-slate-200 text-right w-full sm:w-auto">
              <span className="text-[11px] text-slate-500 block">Tipe Perjanjian Kerja</span>
              <p className="text-xs font-bold text-slate-800 mt-0.5">
                {myEmployeeRecord?.employmentType === 'PERMANENT'
                  ? 'Karyawan Tetap (PKWTT)'
                  : myEmployeeRecord?.employmentType === 'CONTRACT'
                  ? 'Karyawan Kontrak (PKWT)'
                  : 'Magang (Internship)'}
              </p>
              <span className="text-[10px] text-slate-400 block mt-1">
                Bergabung sejak: {myEmployeeRecord ? formatDateId(myEmployeeRecord.joinDate) : '-'}
              </span>
            </div>
          </div>

          {/* Grid of 4 Detailed Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            {/* 1. Data Pribadi & Kependudukan */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-900 font-semibold">
                <Users className="h-4 w-4 text-emerald-600" />
                <span>Identitas Pribadi &amp; Kependudukan</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-[11px] text-slate-400 block">NIK KTP Resmi</span>
                  <p className="font-mono font-bold text-slate-800">{myEmployeeRecord?.nikKtp}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Jenis Kelamin</span>
                  <p className="text-slate-800">{myEmployeeRecord?.gender === 'MALE' ? 'Laki-Laki' : 'Perempuan'}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Tempat, Tgl Lahir</span>
                  <p className="text-slate-800">
                    {myEmployeeRecord?.birthPlace}, {myEmployeeRecord ? formatDateId(myEmployeeRecord.birthDate) : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Agama</span>
                  <p className="text-slate-800">{myEmployeeRecord?.religion}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Status Perkawinan</span>
                  <p className="text-slate-800">
                    {myEmployeeRecord?.maritalStatus === 'MARRIED' ? 'Menikah' : 'Belum Menikah'}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Email Perusahaan</span>
                  <p className="text-slate-800 truncate">{myEmployeeRecord?.email}</p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200/70">
                <span className="text-[11px] text-slate-400 block">Alamat Domisili KTP</span>
                <p className="text-slate-700 mt-0.5">{myEmployeeRecord?.addressKtp}</p>
              </div>
            </div>

            {/* 2. Jaminan Sosial & Kepatuhan Pajak */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-900 font-semibold">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <span>Kepatuhan Pajak &amp; BPJS Indonesia</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-[11px] text-slate-400 block">Status PTKP Pajak</span>
                  <p className="font-mono font-bold text-amber-900">
                    {myEmployeeRecord?.ptkpStatus.replace('_', '/')}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Kategori TER (PP 58/2023)</span>
                  <p className="font-bold text-blue-700">TER Kategori {myTerCategory}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Nomor Pokok Wajib Pajak (NPWP)</span>
                  <p className="font-mono text-slate-800">{myEmployeeRecord?.npwp}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">BPJS Kesehatan</span>
                  <p className="font-mono text-slate-800">
                    {myEmployeeRecord?.bpjsKesNumber} (Aktif)
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-[11px] text-slate-400 block">BPJS Ketenagakerjaan (KPJ)</span>
                  <p className="font-mono text-slate-800">
                    {myEmployeeRecord?.bpjsTkNumber} &bull; Program JHT (2%), JP (1%), JKK, JKM
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-200/70 text-[11px] text-slate-500">
                <p>Status PTKP dan BPJS tersinkronisasi resmi. Perubahan status tanggungan wajib diajukan melalui HR Admin.</p>
              </div>
            </div>

            {/* 3. Rekening Penyaluran Gaji (Payroll) */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-slate-900 font-semibold">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                <span>Rekening Payroll Bank Mandiri</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-[11px] text-slate-400 block">Bank Penyalur</span>
                  <p className="font-bold text-slate-800">{myEmployeeRecord?.bankName}</p>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Nomor Rekening Terdaftar</span>
                  <p className="font-mono font-bold text-emerald-700 text-sm">
                    {myEmployeeRecord?.bankAccountNumber}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-[11px] text-slate-400 block">Nama Pemilik Rekening</span>
                  <p className="font-medium text-slate-800">
                    {myEmployeeRecord?.bankAccountHolder || myEmployeeRecord?.fullName}
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                Rekening digunakan untuk pencairan gaji bulanan via format batch transfer KlikBCA / MCM.
              </p>
            </div>

            {/* 4. Hak Kompensasi Saya (ESS) */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 pb-2 border-b border-emerald-200 text-emerald-950 font-semibold">
                <FileText className="h-4 w-4 text-emerald-700" />
                <span>Kompensasi Pokok Terdaftar (ESS)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <span className="text-[11px] text-emerald-800 block">Gaji Pokok Resmi</span>
                  <p className="font-mono font-bold text-emerald-950 text-sm">
                    {myEmployeeRecord ? formatIdr(myEmployeeRecord.basicSalary) : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-emerald-800 block">Tunjangan Tetap</span>
                  <p className="font-mono font-bold text-emerald-950 text-sm">
                    {myEmployeeRecord ? formatIdr(myEmployeeRecord.fixedAllowance) : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-emerald-800 block">Tunjangan Makan</span>
                  <p className="font-mono text-emerald-900">
                    {myEmployeeRecord ? formatIdr(myEmployeeRecord.mealAllowance) : '-'}/hari kerja
                  </p>
                </div>
                <div>
                  <span className="text-[11px] text-emerald-800 block">Tunjangan Transport</span>
                  <p className="font-mono text-emerald-900">
                    {myEmployeeRecord ? formatIdr(myEmployeeRecord.transportAllowance) : '-'}/hari kerja
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-emerald-800 pt-1">
                Untuk rincian slip gaji bulanan, potongan pajak PPh 21 TER, dan BPJS, silakan periksa tab <strong>Slip Gaji Saya (ESS)</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Modal: Perbarui Kontak Mandiri */}
        <ContactEditModal
          isOpen={isContactEditOpen}
          onClose={() => setIsContactEditOpen(false)}
          employee={myEmployeeRecord || null}
          onSubmit={handleContactUpdateSubmit}
        />
      </motion.div>
    );
  }

  // ==============================================================
  // CASE 2: MANAGER & ADMIN ROLES (Directory with strict boundaries)
  // ==============================================================
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Header and Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {isManager ? `Direktori Tim ${managerDeptName}` : 'Direktori Data Karyawan'}
          </h2>
          <p className="text-xs text-slate-500">
            {isManager
              ? `Menampilkan ${filteredEmployees.length} staf di bawah naungan supervisi Anda`
              : `Total ${employees.length} Karyawan \u2022 Administrasi Profil, Perpajakan PTKP & Akun Finansial`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canCreateEmployee ? (
            <button
              id="btn-add-employee"
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 sm:py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 active:scale-98 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Karyawan Baru</span>
            </button>
          ) : (
            <div className="rounded-lg bg-slate-100 border border-slate-200 px-3 py-1.5 text-xs text-slate-600 flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-slate-500" />
              <span>
                {isManager ? `Akses Tim Departemen (${session.role})` : `Direktori (${session.role.replace('_', ' ')})`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar Component */}
      <EmployeeFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedDept={selectedDept}
        onDeptChange={setSelectedDept}
        selectedBranch={selectedBranch}
        onBranchChange={setSelectedBranch}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        departments={departments}
        branches={branches}
        isManager={isManager}
        managerDeptId={managerDeptId}
        managerDeptName={managerDeptName}
        filteredCount={filteredEmployees.length}
        onResetFilters={handleResetFilters}
      />

      {/* Employee List / Table Component */}
      <EmployeeListTable
        employees={filteredEmployees}
        departments={departments}
        branches={branches}
        positions={positions}
        canViewSalaries={canViewSalaries}
        canEditCompensation={canEditCompensation}
        onViewDetail={handleOpenDetail}
        onEditSalary={handleOpenSalaryEdit}
        hasMore={hasMore}
        isLoadingMore={isLoading}
        onLoadMore={loadMore}
      />

      {/* Employee Detail Modal */}
      <EmployeeDetailPanel
        employee={selectedEmployeeForDetail}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        departments={departments}
        branches={branches}
        positions={positions}
        session={session}
        canViewSalaries={canViewSalaries}
        canEditCompensation={canEditCompensation}
        documents={documents}
        employeeLoans={employeeLoans}
        onRefresh={onRefresh}
        showToast={showToast}
        onOpenSalaryEdit={(emp) => {
          setIsDetailModalOpen(false);
          handleOpenSalaryEdit(emp);
        }}
      />

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={isAddModalOpen && canCreateEmployee}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddSubmit}
        departments={departments}
        branches={branches}
        positions={positions}
        employeesCount={employees.length}
      />

      {/* Salary Adjustment Modal */}
      <SalaryAdjustmentModal
        isOpen={isSalaryEditModalOpen && canEditCompensation}
        onClose={() => setIsSalaryEditModalOpen(false)}
        employee={selectedEmployeeForDetail}
        onSubmit={handleSalaryUpdateSubmit}
      />
    </motion.div>
  );
};

export default EmployeesView;
