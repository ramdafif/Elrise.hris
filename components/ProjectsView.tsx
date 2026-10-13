'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FolderKanban,
  Building,
  Plus,
  Calendar,
  MapPin,
  Users,
  ShieldCheck,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { UserSession, Project, EmployeeProjectAssignment, Employee } from '@/lib/types';

interface ProjectsViewProps {
  session: UserSession;
  employees: Employee[];
  showToast: (text: string, type?: 'success' | 'error') => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ session, employees, showToast }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignments, setAssignments] = useState<EmployeeProjectAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');

  // Modals
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [isAssignEmployeeOpen, setIsAssignEmployeeOpen] = useState(false);

  // Form states
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');

  // Assign form state
  const [assignProjectId, setAssignProjectId] = useState('');
  const [assignEmployeeId, setAssignEmployeeId] = useState('');
  const [assignRole, setAssignRole] = useState('ENGINEER');
  const [assignIsPrimary, setAssignIsPrimary] = useState(true);

  const fetchProjectData = useCallback(async () => {
    try {
      const headers = {
        'x-session-id': session.id,
      };

      const [resProj, resAsg] = await Promise.all([
        fetch('/api/projects', { headers }).then((r) => (r.ok ? r.json() : null)),
        fetch('/api/projects/assignments', { headers }).then((r) => (r.ok ? r.json() : null)),
      ]);

      if (resProj?.projects) setProjects(resProj.projects);
      if (resAsg?.assignments) setAssignments(resAsg.assignments);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setIsLoading(false);
    }
  }, [session.id]);

  useEffect(() => {
    let isCancelled = false;
    Promise.resolve().then(() => {
      if (!isCancelled) {
        setIsLoading(true);
        return fetchProjectData();
      }
    }).catch((err) => {
      if (!isCancelled) console.error('Error fetching project data:', err);
    });
    return () => {
      isCancelled = true;
    };
  }, [fetchProjectData, session.role, session.tenantId]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newName) {
      showToast('Kode dan nama proyek wajib diisi.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': session.id,
        },
        body: JSON.stringify({
          code: newCode,
          name: newName,
          description: newDescription,
          location: newLocation,
          budget: newBudget ? Number(newBudget) : undefined,
          startDate: newStartDate || new Date().toISOString().split('T')[0],
          endDate: newEndDate || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Proyek baru berhasil didaftarkan ke Tenant.');
        setIsAddProjectOpen(false);
        setNewCode('');
        setNewName('');
        setNewDescription('');
        setNewLocation('');
        setNewBudget('');
        fetchProjectData();
      } else {
        showToast(data.error || 'Gagal membuat proyek.', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan jaringan.', 'error');
    }
  };

  const handleAssignEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignProjectId || !assignEmployeeId) {
      showToast('Pilih proyek dan karyawan.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/projects/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': session.id,
        },
        body: JSON.stringify({
          projectId: assignProjectId,
          employeeId: assignEmployeeId,
          role: assignRole,
          isPrimary: assignIsPrimary,
          startDate: new Date().toISOString().split('T')[0],
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('Penugasan karyawan ke proyek berhasil dicatat.');
        setIsAssignEmployeeOpen(false);
        fetchProjectData();
      } else {
        showToast(data.error || 'Gagal menugaskan karyawan.', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan jaringan.', 'error');
    }
  };

  const filteredProjects =
    selectedProjectId === 'ALL'
      ? projects
      : projects.filter((p) => p.id === selectedProjectId);

  const canManageProjects =
    session.scopeType === 'PLATFORM_GLOBAL' ||
    session.role === 'SUPERADMIN' ||
    session.role === 'ADMIN_PT';

  return (
    <div className="space-y-6">
      {/* SaaS Architectural Hierarchy Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl border border-indigo-900/50">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="h-3 w-3" /> Multi-Tenant Operational Scope
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[11px] font-medium text-indigo-200 border border-indigo-500/30">
                Role ≠ Scope Discipline
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <FolderKanban className="h-6 w-6 text-emerald-400" />
              <span>Manajemen Proyek &amp; Penugasan Personel</span>
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Model bisnis Nusantara HRIS: <strong className="text-white">Platform Owner</strong> &rarr;{' '}
              <strong className="text-white">Tenant (PT Customer)</strong> &rarr;{' '}
              <strong className="text-emerald-300">Project (Unit Operasional)</strong> &rarr;{' '}
              <strong className="text-white">Karyawan</strong>. Proyek bukanlah tenant terpisah, melainkan lingkup operasional di bawah PT.
            </p>
          </div>

          {canManageProjects && (
            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => setIsAddProjectOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-900/30 hover:bg-emerald-500 active:scale-98 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Tambah Proyek</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (projects.length > 0) setAssignProjectId(projects[0].id);
                  setIsAssignEmployeeOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-900/30 hover:bg-indigo-500 active:scale-98 transition-all"
              >
                <UserCheck className="h-4 w-4" />
                <span>Tugaskan Karyawan</span>
              </button>
            </div>
          )}
        </div>

        {/* Hierarchy Flow Visual */}
        <div className="mt-5 pt-4 border-t border-indigo-900/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block font-semibold">1. PLATFORM OWNER</span>
            <span className="font-bold text-white truncate block">Nusantara SaaS Global</span>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block font-semibold">2. TENANT / PT</span>
            <span className="font-bold text-indigo-300 truncate block">PT Elkyno Technology</span>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-emerald-500/40 bg-emerald-950/20">
            <span className="text-[10px] text-emerald-400 block font-semibold">3. OPERATIONAL PROJECT</span>
            <span className="font-bold text-emerald-200 truncate block">{projects.length} Proyek Aktif</span>
          </div>
          <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-700/60">
            <span className="text-[10px] text-slate-400 block font-semibold">4. ASSIGNMENTS</span>
            <span className="font-bold text-white truncate block">{assignments.length} Penugasan Karyawan</span>
          </div>
        </div>
      </div>

      {/* Scope Filtering & Security Note */}
      {session.scopeType === 'PROJECT' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-3 shadow-xs">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Lingkup Otorisasi Terbatas Proyek (Project Scope Active)</h4>
            <p className="mt-0.5 text-amber-800 leading-relaxed">
              Anda masuk sebagai <strong>{session.name}</strong> dengan peran <strong>{session.role}</strong>. Sistem secara otomatis mengisolasi akses data Anda khusus pada proyek terdaftar Anda ({session.projectIds?.join(', ') || 'Belum ditugaskan'}). Anda tidak dapat melihat presensi, staf, atau aktivitas di proyek cabang lain, dan data gaji tetap dibatasi (Zero Payroll Leakage).
            </p>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => {
          const projectAssignments = assignments.filter((a) => a.projectId === project.id);
          const activeAssignments = projectAssignments.filter((a) => a.status === 'ACTIVE');

          return (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-700 border border-slate-200">
                      {project.code}
                    </span>
                    <h3 className="mt-1 font-bold text-base text-slate-900 leading-snug">
                      {project.name}
                    </h3>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                      project.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : project.status === 'PLANNING'
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                  {project.description || 'Tidak ada deskripsi rinci proyek.'}
                </p>

                {/* Metadata details */}
                <div className="space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  {project.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{project.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>
                      {project.startDate} {project.endDate ? `s.d ${project.endDate}` : '(Berjalan)'}
                    </span>
                  </div>
                  {project.budget && (
                    <div className="flex items-center gap-2 font-medium text-slate-800">
                      <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>Alokasi: Rp {project.budget.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </div>

                {/* Team Personnel section */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      Personel Terdaftar ({activeAssignments.length})
                    </span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {projectAssignments.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2 text-center">
                        Belum ada karyawan yang ditugaskan ke proyek ini.
                      </p>
                    ) : (
                      projectAssignments.map((asg) => {
                        const emp = employees.find((e) => e.id === asg.employeeId);
                        return (
                          <div
                            key={asg.id}
                            className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 p-2 text-xs border border-slate-100"
                          >
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate">
                                {emp?.fullName || asg.employeeId}
                              </p>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] text-slate-500 font-medium">{asg.role}</span>
                                {asg.isPrimary && (
                                  <span className="rounded bg-emerald-100 text-emerald-800 text-[9px] px-1 font-bold">
                                    Primer
                                  </span>
                                )}
                              </div>
                            </div>
                            <span
                              className={`shrink-0 rounded px-1.5 py-0.2 text-[9px] font-bold ${
                                asg.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {asg.status}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Tenant: {session.tenantName || 'PT Elkyno Technology'}</span>
                <span className="font-mono">{project.id}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modal: Tambah Proyek */}
      <AnimatePresence>
        {isAddProjectOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setIsAddProjectOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl z-10 border border-slate-200"
            >
              <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-emerald-600" />
                <span>Pendaftaran Proyek Operasional Baru</span>
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Proyek ini akan bernaung di bawah tenant <strong>{session.tenantName || 'PT Elkyno Technology'}</strong>.
              </p>

              <form onSubmit={handleCreateProject} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Kode Proyek *</label>
                    <input
                      type="text"
                      placeholder="PRJ-SBY-03"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      required
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden font-mono uppercase"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Nama Proyek *</label>
                    <input
                      type="text"
                      placeholder="Project Semarang Hub"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      required
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Deskripsi Proyek</label>
                  <textarea
                    rows={2}
                    placeholder="Ruang lingkup kerja operasional proyek..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Lokasi Kerja</label>
                    <input
                      type="text"
                      placeholder="Gedung Pandanaran Lt. 4 Semarang"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Alokasi Anggaran (Rp)</label>
                    <input
                      type="number"
                      placeholder="2500000000"
                      value={newBudget}
                      onChange={(e) => setNewBudget(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Tanggal Mulai</label>
                    <input
                      type="date"
                      value={newStartDate}
                      onChange={(e) => setNewStartDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Tanggal Selesai</label>
                    <input
                      type="date"
                      value={newEndDate}
                      onChange={(e) => setNewEndDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="mt-5 flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAddProjectOpen(false)}
                    className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
                  >
                    Simpan Proyek
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Tugaskan Karyawan ke Proyek */}
      <AnimatePresence>
        {isAssignEmployeeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setIsAssignEmployeeOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl z-10 border border-slate-200"
            >
              <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-indigo-600" />
                <span>Penugasan Personel ke Proyek</span>
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Mencatat riwayat penugasan karyawan ke dalam lingkup operasional proyek.
              </p>

              <form onSubmit={handleAssignEmployee} className="space-y-3.5 text-xs">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Target Proyek *</label>
                  <select
                    value={assignProjectId}
                    onChange={(e) => setAssignProjectId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Karyawan *</label>
                  <select
                    value={assignEmployeeId}
                    onChange={(e) => setAssignEmployeeId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="">-- Pilih Karyawan --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.fullName} ({emp.employeeId})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Posisi Proyek (projectPosition)</label>
                    <select
                      value={assignRole}
                      onChange={(e) => setAssignRole(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                    >
                      <option value="PROJECT_COORDINATOR">Project Coordinator</option>
                      <option value="PROJECT_LEAD">Project Lead</option>
                      <option value="SITE_ENGINEER">Site Engineer</option>
                      <option value="ENGINEER">Engineer</option>
                      <option value="SUPERVISOR">Supervisor</option>
                      <option value="STAFF">Staff Operasional</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Penugasan Primer?</label>
                    <select
                      value={assignIsPrimary ? 'true' : 'false'}
                      onChange={(e) => setAssignIsPrimary(e.target.value === 'true')}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                    >
                      <option value="true">Ya, Proyek Primer</option>
                      <option value="false">Tidak, Proyek Sekunder</option>
                    </select>
                  </div>
                </div>

                <div className="mt-5 flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsAssignEmployeeOpen(false)}
                    className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-700"
                  >
                    Konfirmasi Penugasan
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
