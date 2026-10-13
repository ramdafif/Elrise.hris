'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2,
  Users,
  ShieldCheck,
  CreditCard,
  Clock,
  CalendarDays,
  Award,
  FileCheck,
  FolderKanban,
  History,
  Check,
  X,
  Edit3,
  Plus,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sliders,
  Sparkles,
  Phone,
  Mail,
  UserCheck,
  Layers,
  Lock,
  Unlock,
} from 'lucide-react';
import { UserSession } from '@/lib/types';
import { TenantContext, ALL_SYSTEM_MODULES, getAllRegisteredTenants } from '@/lib/security/tenant';
import { ElriseLogo, ElriseSymbol } from './ElriseLogo';

interface ClientsViewProps {
  session: UserSession;
  showToast: (text: string, type?: 'success' | 'error') => void;
  onSwitchUser?: (userId: string) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  session,
  showToast,
  onSwitchUser,
}) => {
  const initialTenants = getAllRegisteredTenants();
  const [clients, setClients] = useState<TenantContext[]>(initialTenants);
  const [selectedClient, setSelectedClient] = useState<TenantContext | null>(initialTenants[0] || null);
  const [isEditAdminModalOpen, setIsEditAdminModalOpen] = useState(false);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Edit Admin Form state
  const [editAdminName, setEditAdminName] = useState('');
  const [editAdminEmail, setEditAdminEmail] = useState('');
  const [editAdminPhone, setEditAdminPhone] = useState('');
  const [editTier, setEditTier] = useState<'STARTER' | 'GROWTH' | 'ENTERPRISE'>('GROWTH');
  const [editMaxEmployees, setEditMaxEmployees] = useState(50);

  // New Client Form state
  const [newClientName, setNewClientName] = useState('');
  const [newClientCode, setNewClientCode] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [newTier, setNewTier] = useState<'STARTER' | 'GROWTH' | 'ENTERPRISE'>('GROWTH');

  const refreshClients = React.useCallback(async () => {
    try {
      const res = await fetch('/api/tenants', {
        headers: { 'x-session-id': session.id },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.tenants) {
          setClients(data.tenants);
          setSelectedClient((prev) => {
            if (!prev) return data.tenants[0] || null;
            return data.tenants.find((t: TenantContext) => t.tenantId === prev.tenantId) || prev;
          });
        }
      }
    } catch {
      // Retain in-memory fallback
    }
  }, [session.id]);

  useEffect(() => {
    let isCancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/tenants', {
          headers: { 'x-session-id': session.id },
        });
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.tenants) {
            setClients(data.tenants);
            setSelectedClient((prev) => {
              if (!prev) return data.tenants[0] || null;
              return data.tenants.find((t: TenantContext) => t.tenantId === prev.tenantId) || prev;
            });
          }
        }
      } catch {
        // Fallback already populated
      }
    };
    load();
    return () => {
      isCancelled = true;
    };
  }, [session.id]);

  const handleToggleModule = async (tenantId: string, moduleId: string) => {
    const client = clients.find((c) => c.tenantId === tenantId);
    if (!client) return;

    const currentModules = client.allowedModules || [];
    const isCurrentlyAllowed = currentModules.includes(moduleId);
    const newModules = isCurrentlyAllowed
      ? currentModules.filter((m) => m !== moduleId)
      : [...currentModules, moduleId];

    // Optimistic UI update
    setClients((prev) =>
      prev.map((c) => (c.tenantId === tenantId ? { ...c, allowedModules: newModules } : c))
    );
    if (selectedClient && selectedClient.tenantId === tenantId) {
      setSelectedClient({ ...selectedClient, allowedModules: newModules });
    }

    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': session.id,
        },
        body: JSON.stringify({
          action: 'UPDATE_SETTINGS',
          tenantId,
          allowedModules: newModules,
        }),
      });
      if (res.ok) {
        showToast(
          `Modul ${moduleId} berhasil ${isCurrentlyAllowed ? 'dinonaktifkan' : 'diaktifkan'} untuk ${client.tenantName}`
        );
      } else {
        showToast('Gagal menyimpan perubahan modul ke server.', 'error');
        refreshClients();
      }
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
      refreshClients();
    }
  };

  const handleOpenEditAdmin = (client: TenantContext) => {
    setSelectedClient(client);
    setEditAdminName(client.adminName || '');
    setEditAdminEmail(client.adminEmail || '');
    setEditAdminPhone(client.adminPhone || '');
    setEditTier(client.tier || 'GROWTH');
    setEditMaxEmployees(client.maxEmployees || 50);
    setIsEditAdminModalOpen(true);
  };

  const handleSaveAdminSettings = async () => {
    if (!selectedClient) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': session.id,
        },
        body: JSON.stringify({
          action: 'UPDATE_SETTINGS',
          tenantId: selectedClient.tenantId,
          adminName: editAdminName,
          adminEmail: editAdminEmail,
          adminPhone: editAdminPhone,
          tier: editTier,
          maxEmployees: editMaxEmployees,
          allowedModules: selectedClient.allowedModules,
        }),
      });

      if (res.ok) {
        showToast(`Pengaturan Admin ${selectedClient.tenantName} berhasil disimpan.`);
        setIsEditAdminModalOpen(false);
        refreshClients();
      } else {
        const data = await res.json();
        showToast(data.error || 'Gagal menyimpan pengaturan admin.', 'error');
      }
    } catch {
      showToast('Gagal menyimpan ke server.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientCode || !newAdminName || !newAdminEmail) {
      showToast('Harap lengkapi semua field wajib.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': session.id,
        },
        body: JSON.stringify({
          action: 'CREATE_CLIENT',
          tenantName: newClientName,
          tenantCode: newClientCode,
          adminName: newAdminName,
          adminEmail: newAdminEmail,
          adminPhone: newAdminPhone,
          tier: newTier,
          maxEmployees: newTier === 'ENTERPRISE' ? 100 : 50,
          allowedModules: ['EMPLOYEES', 'ATTENDANCE', 'LEAVE_OVERTIME', 'PAYROLL', 'PROJECTS', 'AUDIT_LOG'],
        }),
      });

      if (res.ok) {
        showToast(`Client ${newClientName} berhasil ditambahkan!`);
        setIsAddClientModalOpen(false);
        setNewClientName('');
        setNewClientCode('');
        setNewAdminName('');
        setNewAdminEmail('');
        setNewAdminPhone('');
        refreshClients();
      } else {
        const data = await res.json();
        showToast(data.error || 'Gagal menambahkan client.', 'error');
      }
    } catch {
      showToast('Gagal memproses pendaftaran client.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getModuleIcon = (id: string) => {
    switch (id) {
      case 'EMPLOYEES':
        return Users;
      case 'ATTENDANCE':
        return Clock;
      case 'LEAVE_OVERTIME':
        return CalendarDays;
      case 'KPI_PERFORMANCE':
        return Award;
      case 'PAYROLL':
        return CreditCard;
      case 'TAX_REGULATION':
        return FileCheck;
      case 'PROJECTS':
        return FolderKanban;
      case 'AUDIT_LOG':
        return History;
      default:
        return Sliders;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Banner - ELRISE Navy Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#123456] via-[#102C49] to-[#0A2239] p-6 sm:p-8 text-white shadow-md border border-[#197568]/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F5F1]/15 px-3 py-1 text-xs font-semibold text-[#2FA493] border border-[#2FA493]/30 backdrop-blur-xs">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Platform Owner Governance</span>
              </span>
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-mono text-slate-300">
                SaaS Multi-Tenant
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Kelola Client &amp; Pengaturan Lisensi Fitur PT
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
              Superadmin fokus mengelola entitas Client (PT), menugaskan Admin PT, dan mengatur hak akses
              modul/fitur yang diizinkan untuk setiap perusahaan. Seluruh operasional HR harian dan penggajian (Payroll/BPJS) dikelola langsung oleh masing-masing Admin PT.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsAddClientModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2FA493] hover:bg-[#258577] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all active:scale-98"
            >
              <Plus className="h-4 w-4" />
              <span>Daftarkan Client Baru</span>
            </button>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="relative z-10 mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-white/10 pt-4 text-xs">
          <div>
            <p className="text-slate-400 text-[11px]">Total Client Aktif</p>
            <p className="text-lg font-bold text-white mt-0.5">{clients.length} Perusahaan</p>
          </div>
          <div>
            <p className="text-slate-400 text-[11px]">Akun Admin PT</p>
            <p className="text-lg font-bold text-[#2FA493] mt-0.5">{clients.length} Admin Ditugaskan</p>
          </div>
          <div>
            <p className="text-slate-400 text-[11px]">Isolasi Database</p>
            <p className="text-lg font-bold text-emerald-400 mt-0.5">100% Strict Tenant</p>
          </div>
          <div>
            <p className="text-slate-400 text-[11px]">Sistem Penggajian</p>
            <p className="text-lg font-bold text-amber-300 mt-0.5">Dikelola Admin PT</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Client List & Detail Feature Config */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Registered Clients List (4 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#162D43] flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#2FA493]" />
              <span>Daftar Client Perusahaan ({clients.length})</span>
            </h2>
            <span className="text-[11px] text-[#64748B]">Pilih PT untuk kelola fitur</span>
          </div>

          <div className="space-y-3">
            {clients.map((client) => {
              const isSelected = selectedClient?.tenantId === client.tenantId;
              const isPtA = client.tenantId.includes('pt-a') || client.tenantId.includes('elkyno');
              const switchUserId = isPtA ? 'user-admin-pt-a' : 'user-admin-pt-b';

              return (
                <div
                  key={client.tenantId}
                  onClick={() => setSelectedClient(client)}
                  className={`group relative rounded-xl border p-4.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#2FA493] bg-white shadow-md ring-1 ring-[#2FA493]/30'
                      : 'border-[#DFE7E8] bg-white hover:border-[#2FA493]/60 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-black text-sm ${
                          isPtA
                            ? 'bg-[#123456] text-white'
                            : 'bg-[#2FA493] text-white'
                        }`}
                      >
                        {client.tenantCode.substring(0, 3)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-[#162D43] group-hover:text-[#123456]">
                            {client.tenantName}
                          </h3>
                        </div>
                        <p className="text-xs font-mono text-[#64748B] mt-0.5">
                          ID: <span className="font-semibold">{client.tenantCode}</span> &bull; {client.city || 'Indonesia'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                        client.tier === 'ENTERPRISE'
                          ? 'bg-[#E6F5F1] text-[#197568] border-[#2FA493]/30'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}
                    >
                      {client.tier || 'GROWTH'}
                    </span>
                  </div>

                  {/* Admin PT Cardlet */}
                  <div className="mt-3.5 rounded-lg bg-[#F3F4EF]/70 p-3 border border-[#DFE7E8] text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-[#64748B] flex items-center gap-1">
                        <UserCheck className="h-3 w-3 text-[#197568]" />
                        <span>Admin PT Tertugaskan:</span>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditAdmin(client);
                        }}
                        className="text-[11px] font-semibold text-[#197568] hover:underline flex items-center gap-1"
                      >
                        <Edit3 className="h-3 w-3" />
                        <span>Ubah</span>
                      </button>
                    </div>
                    <p className="font-bold text-[#162D43] mt-1 text-xs truncate">
                      {client.adminName || 'Belum ditugaskan'}
                    </p>
                    <p className="text-[11px] text-[#64748B] truncate mt-0.5 flex items-center gap-1">
                      <Mail className="h-2.5 w-2.5" />
                      <span>{client.adminEmail || '-'}</span>
                    </p>
                  </div>

                  {/* Summary of Active Features & Employees */}
                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#DFE7E8]/70 text-[11px]">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[#64748B]">
                        Karyawan:{' '}
                        <strong className="text-[#123456] font-bold">
                          1 Pegawai ({isPtA ? 'Farhan' : 'Rian'})
                        </strong>
                      </span>
                      <span className="text-[10px] text-[#64748B]">
                        Modul Aktif:{' '}
                        <strong className="text-[#197568] font-bold">
                          {client.allowedModules?.length || 0}/{ALL_SYSTEM_MODULES.length}
                        </strong>
                      </span>
                    </div>

                    {onSwitchUser && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSwitchUser(switchUserId);
                        }}
                        className="inline-flex items-center gap-1 font-semibold text-[#197568] hover:text-[#123456] transition-colors"
                      >
                        <span>Uji Sebagai Admin</span>
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detail Feature Toggles & Admin Settings for Selected Client (7 cols) */}
        <div className="lg:col-span-7">
          {selectedClient ? (
            <div className="rounded-2xl border border-[#DFE7E8] bg-white p-5 sm:p-6 shadow-xs space-y-6">
              {/* Header Selected Client */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#DFE7E8]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[#123456] px-2 py-0.5 text-[10px] font-mono font-bold text-white">
                      {selectedClient.tenantCode}
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-[#162D43]">
                      {selectedClient.tenantName}
                    </h2>
                  </div>
                  <p className="text-xs text-[#64748B] mt-1">
                    Konfigurasi hak akses modul dan informasi Admin PT untuk perusahaan ini.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEditAdmin(selectedClient)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#DFE7E8] bg-white px-3 py-1.5 text-xs font-semibold text-[#162D43] hover:bg-[#F3F4EF] transition-colors shadow-xs"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-[#64748B]" />
                    <span>Nyetting Admin PT</span>
                  </button>
                </div>
              </div>

              {/* Admin PT Profile Overview */}
              <div className="rounded-xl bg-[#E6F5F1]/50 border border-[#2FA493]/30 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#123456] text-white font-bold text-sm">
                      {selectedClient.adminName?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-[#162D43]">{selectedClient.adminName}</p>
                        <span className="rounded bg-[#E6F5F1] text-[#197568] px-1.5 py-0.2 text-[9px] font-bold border border-[#2FA493]/30">
                          ADMIN PT
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] mt-0.5">{selectedClient.adminEmail}</p>
                    </div>
                  </div>

                  <div className="text-right sm:border-l sm:border-[#DFE7E8] sm:pl-4 text-xs space-y-1">
                    <div>
                      <span className="text-[#64748B] text-[11px]">Karyawan Terdaftar:</span>
                      <p className="font-bold text-[#123456]">
                        1 Pegawai ({selectedClient.tenantId.includes('pt-a') || selectedClient.tenantId.includes('elkyno') ? 'Farhan Maulana' : 'Rian Pratama'})
                      </p>
                    </div>
                    <div className="text-[10px] text-[#64748B]">
                      Batas Lisensi: {selectedClient.maxEmployees || 50} Max
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature Toggles Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#162D43] flex items-center gap-1.5">
                      <Sliders className="h-4 w-4 text-[#2FA493]" />
                      <span>Fitur-Fitur yang Diizinkan untuk Client Ini</span>
                    </h3>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Nyalakan atau matikan modul. Modul yang dimatikan tidak akan dapat diakses oleh Admin PT maupun karyawannya.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-[#DFE7E8] rounded-xl border border-[#DFE7E8] bg-white overflow-hidden">
                  {ALL_SYSTEM_MODULES.map((mod) => {
                    const isAllowed = selectedClient.allowedModules?.includes(mod.id);
                    const Icon = getModuleIcon(mod.id);
                    const isPayroll = mod.id === 'PAYROLL';

                    return (
                      <div
                        key={mod.id}
                        className={`flex items-center justify-between p-3.5 transition-colors ${
                          isAllowed ? 'bg-white' : 'bg-[#F3F4EF]/40'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0 pr-4">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg mt-0.5 ${
                              isAllowed
                                ? isPayroll
                                  ? 'bg-[#123456] text-white'
                                  : 'bg-[#E6F5F1] text-[#197568]'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p
                                className={`text-xs sm:text-sm font-bold ${
                                  isAllowed ? 'text-[#162D43]' : 'text-slate-400 line-through'
                                }`}
                              >
                                {mod.name}
                              </p>
                              {isPayroll && (
                                <span className="rounded bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 text-[9px] font-bold">
                                  Dikelola Admin PT
                                </span>
                              )}
                              <span className="font-mono text-[10px] text-slate-400">({mod.id})</span>
                            </div>
                            <p className="text-xs text-[#64748B] mt-0.5 leading-snug">{mod.desc}</p>
                          </div>
                        </div>

                        {/* Interactive Toggle Switch */}
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isAllowed}
                          onClick={() => handleToggleModule(selectedClient.tenantId, mod.id)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                            isAllowed ? 'bg-[#2FA493]' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              isAllowed ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Note */}
              <div className="rounded-xl bg-[#F3F4EF] p-4 text-xs text-[#64748B] flex items-start gap-2.5 border border-[#DFE7E8]">
                <CheckCircle2 className="h-4 w-4 text-[#197568] shrink-0 mt-0.5" />
                <p>
                  Perubahan modul tersimpan secara realtime. Admin PT dan seluruh karyawannya pada <strong>{selectedClient.tenantName}</strong> akan langsung menerima konfigurasi ini pada sesi mereka.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-[#DFE7E8] bg-white p-12 text-center text-xs text-[#64748B]">
              <Building2 className="h-8 w-8 mx-auto text-slate-400 mb-2" />
              <p>Pilih salah satu client di sisi kiri untuk mengatur Admin PT dan izin fiturnya.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal: Edit Admin PT */}
      <AnimatePresence>
        {isEditAdminModalOpen && selectedClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-[#DFE7E8]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#DFE7E8]">
                <div>
                  <h3 className="text-base font-bold text-[#162D43]">
                    Nyetting Admin PT &bull; {selectedClient.tenantName}
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Atur nama penanggung jawab operasional, email login, dan kuota.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditAdminModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-[#162D43] mb-1">
                    Nama Lengkap Admin PT
                  </label>
                  <input
                    type="text"
                    value={editAdminName}
                    onChange={(e) => setEditAdminName(e.target.value)}
                    className="w-full rounded-lg border border-[#DFE7E8] px-3 py-2 text-xs focus:border-[#2FA493] focus:ring-1 focus:ring-[#2FA493] focus:outline-hidden"
                    placeholder="Contoh: Budi Hartono, MBA"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#162D43] mb-1">
                    Email Resmi Admin PT (Login)
                  </label>
                  <input
                    type="email"
                    value={editAdminEmail}
                    onChange={(e) => setEditAdminEmail(e.target.value)}
                    className="w-full rounded-lg border border-[#DFE7E8] px-3 py-2 text-xs focus:border-[#2FA493] focus:ring-1 focus:ring-[#2FA493] focus:outline-hidden"
                    placeholder="budi.hartono@alphadigital.co.id"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#162D43] mb-1">
                    Nomor Telepon / WhatsApp
                  </label>
                  <input
                    type="tel"
                    value={editAdminPhone}
                    onChange={(e) => setEditAdminPhone(e.target.value)}
                    className="w-full rounded-lg border border-[#DFE7E8] px-3 py-2 text-xs focus:border-[#2FA493] focus:ring-1 focus:ring-[#2FA493] focus:outline-hidden"
                    placeholder="+62 812-3456-7890"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#162D43] mb-1">
                      Paket Lisensi
                    </label>
                    <select
                      value={editTier}
                      onChange={(e) => setEditTier(e.target.value as any)}
                      className="w-full rounded-lg border border-[#DFE7E8] px-3 py-2 text-xs focus:border-[#2FA493] focus:ring-1 focus:ring-[#2FA493] focus:outline-hidden"
                    >
                      <option value="STARTER">Starter</option>
                      <option value="GROWTH">Growth</option>
                      <option value="ENTERPRISE">Enterprise</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#162D43] mb-1">
                      Batas Kuota Pegawai
                    </label>
                    <input
                      type="number"
                      value={editMaxEmployees}
                      onChange={(e) => setEditMaxEmployees(Number(e.target.value))}
                      className="w-full rounded-lg border border-[#DFE7E8] px-3 py-2 text-xs focus:border-[#2FA493] focus:ring-1 focus:ring-[#2FA493] focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-[#DFE7E8]">
                <button
                  type="button"
                  onClick={() => setIsEditAdminModalOpen(false)}
                  className="rounded-lg border border-[#DFE7E8] px-4 py-2 text-xs font-semibold text-[#64748B] hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleSaveAdminSettings}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#123456] hover:bg-[#0D2742] px-4 py-2 text-xs font-semibold text-white shadow-xs"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Tambah Client Baru */}
      <AnimatePresence>
        {isAddClientModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-[#DFE7E8]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#DFE7E8]">
                <div>
                  <h3 className="text-base font-bold text-[#162D43]">
                    Daftarkan Client Perusahaan Baru
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Tambah PT baru dan siapkan akun Admin PT pertamanya.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddClientModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateClient} className="mt-4 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-[#162D43] mb-1">
                      Nama Perusahaan (PT) *
                    </label>
                    <input
                      type="text"
                      required
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="w-full rounded-lg border border-[#DFE7E8] px-3 py-2 text-xs focus:border-[#2FA493] focus:ring-1 focus:ring-[#2FA493] focus:outline-hidden"
                      placeholder="PT Gamma Inovasi Makmur"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#162D43] mb-1">
                      Kode Tenant (Singkatan) *
                    </label>
                    <input
                      type="text"
                      required
                      value={newClientCode}
                      onChange={(e) => setNewClientCode(e.target.value.toUpperCase())}
                      className="w-full rounded-lg border border-[#DFE7E8] px-3 py-2 text-xs focus:border-[#2FA493] focus:ring-1 focus:ring-[#2FA493] focus:outline-hidden uppercase"
                      placeholder="GAMMA-BDG"
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-[#F3F4EF] p-3.5 border border-[#DFE7E8] space-y-3">
                  <p className="font-bold text-[#162D43] flex items-center gap-1.5 text-xs">
                    <UserCheck className="h-3.5 w-3.5 text-[#197568]" />
                    <span>Akun Admin PT Pertama</span>
                  </p>
                  <div>
                    <label className="block font-medium text-[#162D43] mb-1">Nama Admin PT *</label>
                    <input
                      type="text"
                      required
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      className="w-full rounded-lg border border-[#DFE7E8] bg-white px-3 py-2 text-xs focus:border-[#2FA493] focus:ring-1 focus:ring-[#2FA493] focus:outline-hidden"
                      placeholder="Ahmad Fauzi, S.E."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-medium text-[#162D43] mb-1">Email Admin *</label>
                      <input
                        type="email"
                        required
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        className="w-full rounded-lg border border-[#DFE7E8] bg-white px-3 py-2 text-xs focus:border-[#2FA493] focus:ring-1 focus:ring-[#2FA493] focus:outline-hidden"
                        placeholder="admin@gammainovasi.com"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-[#162D43] mb-1">No. Telp</label>
                      <input
                        type="tel"
                        value={newAdminPhone}
                        onChange={(e) => setNewAdminPhone(e.target.value)}
                        className="w-full rounded-lg border border-[#DFE7E8] bg-white px-3 py-2 text-xs focus:border-[#2FA493] focus:ring-1 focus:ring-[#2FA493] focus:outline-hidden"
                        placeholder="+62 812-..."
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-[#DFE7E8]">
                  <button
                    type="button"
                    onClick={() => setIsAddClientModalOpen(false)}
                    className="rounded-lg border border-[#DFE7E8] px-4 py-2 text-xs font-semibold text-[#64748B] hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#2FA493] hover:bg-[#258577] px-4 py-2 text-xs font-bold text-white shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>{isSaving ? 'Menyimpan...' : 'Daftarkan Client'}</span>
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
