'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Building2,
  Users,
  Clock,
  CalendarDays,
  CreditCard,
  FileCheck,
  History,
  ChevronDown,
  UserCheck,
  Building,
  Menu,
  X,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  BadgeCheck,
  Award,
  FolderKanban,
  Layers,
  Globe2,
  Sliders,
} from 'lucide-react';
import { UserRole, UserSession } from '@/lib/types';
import { DEMO_USERS, DemoUser, isTabAllowed, ROLE_LABELS } from '@/lib/auth/session';
import { ElriseLogo, ElriseSymbol } from './ElriseLogo';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  session: UserSession;
  setSession: (session: UserSession) => void;
  companyName: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  session,
  setSession,
  companyName,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const time = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setTimeStr(`${time} WIB`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const switchUser = (user: DemoUser) => {
    setSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      scopeType: user.scopeType,
      tenantId: user.tenantId,
      employeeId: user.employeeId,
      projectIds: user.projectIds,
      primaryProjectId: user.primaryProjectId,
      avatar: user.avatar,
      description: user.description,
    });

    // Check if current tab is allowed in the new role & tenant
    if (user.role === 'SUPERADMIN' && currentTab !== 'CLIENTS' && currentTab !== 'AUDIT_LOG' && currentTab !== 'SECURITY_CENTER') {
      setCurrentTab('CLIENTS');
    } else if (!isTabAllowed(user.role, currentTab, user.tenantId)) {
      setCurrentTab(user.role === 'SUPERADMIN' ? 'CLIENTS' : 'DASHBOARD');
    }

    setIsRoleDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  const getRoleBadgeColor = (role: UserRole) => {
    return ROLE_LABELS[role]?.badgeColor || 'bg-[#E6F5F1] text-[#197568] border-[#2FA493]/30';
  };

  // Exactly 5 Canonical Business Roles
  const activeBusinessUsers = DEMO_USERS;

  const allNavItems = [
    { id: 'CLIENTS', label: 'Kelola Client & Lisensi PT', shortLabel: 'Client PT', icon: Sliders },
    { id: 'DASHBOARD', label: 'Ikhtisar', shortLabel: 'Ikhtisar', icon: Building2 },
    { id: 'PROJECTS', label: 'Proyek & Unit Kerja', shortLabel: 'Proyek', icon: FolderKanban },
    { id: 'EMPLOYEES', label: 'Data Karyawan', shortLabel: 'Karyawan', icon: Users },
    { id: 'ATTENDANCE', label: 'Presensi & ESS', shortLabel: 'Presensi', icon: Clock },
    { id: 'LEAVE_OVERTIME', label: 'Cuti, Lembur & Klaim', shortLabel: 'Cuti/Lembur', icon: CalendarDays },
    { id: 'KPI_PERFORMANCE', label: 'Penilaian Kinerja (KPI)', shortLabel: 'KPI & Kinerja', icon: Award },
    { id: 'PAYROLL', label: 'Penggajian (Payroll)', shortLabel: 'Payroll', icon: CreditCard },
    { id: 'TAX_REGULATION', label: 'Kepatuhan & Pajak', shortLabel: 'Pajak & BPJS', icon: FileCheck },
    { id: 'AUDIT_LOG', label: 'Audit Trail', shortLabel: 'Audit Log', icon: History },
    { id: 'SECURITY_CENTER', label: 'Pusat Keamanan', shortLabel: 'Keamanan', icon: ShieldCheck },
  ];

  // Filter navigation tabs dynamically based on current user's role & tenant feature licenses
  const navItems = allNavItems
    .filter((item) => isTabAllowed(session.role, item.id, session.tenantId))
    .map((item) => {
      if (item.id === 'PAYROLL' && session.role === 'EMPLOYEE') {
        return {
          ...item,
          label: 'Slip Gaji Saya (ESS)',
          shortLabel: 'Slip Gaji',
        };
      }
      if (item.id === 'EMPLOYEES' && session.role === 'EMPLOYEE') {
        return {
          ...item,
          label: 'Profil Saya (ESS)',
          shortLabel: 'Profil Saya',
        };
      }
      if (item.id === 'KPI_PERFORMANCE' && session.role === 'EMPLOYEE') {
        return {
          ...item,
          label: 'KPI Saya (Self-Review)',
          shortLabel: 'KPI Saya',
        };
      }
      return item;
    });

  const handleTabClick = (tabId: string) => {
    setCurrentTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const getCompanyDisplayName = () => {
    if (session.role === 'SUPERADMIN') {
      return 'ELRISE Cloud Platform';
    }
    if (session.tenantId?.includes('pt-b') || session.tenantId?.includes('holding-02')) {
      return 'PT Beta Solusi Sejahtera (PT B)';
    }
    return 'PT Alpha Digital Nusantara (PT A)';
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#DFE7E8] bg-white shadow-xs">
        {/* Top Header Bar: ELRISE Brand, Hierarchy Context, Time, Role Switcher */}
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 py-2.5">
          <div className="flex items-center gap-3 min-w-0">
            {/* ELRISE Brand Logo */}
            <ElriseLogo size="md" variant="full" theme="light" />

            {/* Tenant / Context Hierarchy Divider */}
            <div className="hidden sm:block h-6 w-px bg-[#DFE7E8]" />

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-bold text-[#162D43] truncate">
                  {getCompanyDisplayName()}
                </span>
                {session.role === 'SUPERADMIN' ? (
                  <span className="shrink-0 rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200">
                    PLATFORM OWNER
                  </span>
                ) : (
                  <span className="shrink-0 rounded bg-[#E6F5F1] px-1.5 py-0.5 text-[10px] font-bold text-[#197568] border border-[#2FA493]/30">
                    TENANT ACTIVE
                  </span>
                )}
              </div>

              {/* Context Breadcrumbs */}
              <div className="flex items-center gap-1 text-[11px] text-[#64748B] truncate mt-0.5">
                {session.role === 'SUPERADMIN' ? (
                  <span className="flex items-center gap-1 font-medium text-[#123456]">
                    <Globe2 className="h-3 w-3 text-[#2FA493]" />
                    <span>ELRISE PLATFORM</span>
                    <span>&rarr;</span>
                    <span className="text-[#197568] font-bold">Kelola Seluruh Client (PT)</span>
                  </span>
                ) : session.role === 'ADMIN_PT' ? (
                  <span className="flex items-center gap-1 font-medium text-[#123456]">
                    <Building2 className="h-3 w-3 text-[#2FA493]" />
                    <span>{session.tenantId?.includes('pt-b') ? 'PT Beta' : 'PT Alpha'}</span>
                    <span>&rarr;</span>
                    <span className="text-[#197568] font-bold">Operasional HR &amp; Penggajian (Payroll)</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-medium text-[#197568]">
                    <UserCheck className="h-3 w-3 text-[#2FA493]" />
                    <span>{session.tenantId?.includes('pt-b') ? 'PT Beta' : 'PT Alpha'}</span>
                    <span>&rarr;</span>
                    <span className="text-[#162D43]">Portal Mandiri Karyawan (ESS)</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Indonesian Time (Desktop only) */}
            <div className="hidden lg:flex items-center gap-1.5 rounded-lg bg-[#F3F4EF] border border-[#DFE7E8] px-2.5 py-1 text-xs font-mono text-[#162D43]">
              <Clock className="h-3.5 w-3.5 text-[#2FA493]" />
              <span>{timeStr || '09:00:00 WIB'}</span>
            </div>

            {/* Role Switcher Dropdown (1 Superadmin, 1 Admin PT A, 1 Karyawan PT A, 1 Admin PT B, 1 Karyawan PT B) */}
            <div className="relative">
              <motion.button
                id="role-switcher-btn"
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="flex items-center gap-1.5 sm:gap-2 rounded-xl border border-[#DFE7E8] bg-white px-2.5 sm:px-3 py-1.5 text-left text-xs font-medium text-[#162D43] shadow-xs hover:bg-[#F3F4EF] focus:outline-hidden transition-colors"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#123456] text-white font-bold text-xs">
                  {session.name.charAt(0)}
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-[10px] text-[#64748B] leading-tight">Role Aktif:</span>
                  <span className="font-bold text-[#162D43] leading-tight truncate max-w-[130px]">
                    {session.name.split('(')[0]}
                  </span>
                </div>
                <span
                  className={`rounded border px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold ${getRoleBadgeColor(
                    session.role
                  )}`}
                >
                  {session.role === 'SUPERADMIN'
                    ? 'SUPERADMIN'
                    : session.tenantId?.includes('pt-b')
                    ? session.role === 'ADMIN_PT'
                      ? 'ADMIN PT B'
                      : 'KARYAWAN PT B'
                    : session.role === 'ADMIN_PT'
                    ? 'ADMIN PT A'
                    : 'KARYAWAN PT A'}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-[#64748B] shrink-0 transition-transform duration-200 ${
                    isRoleDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </motion.button>

              <AnimatePresence>
                {isRoleDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="fixed sm:absolute inset-x-3 sm:inset-x-auto sm:right-0 top-16 sm:top-auto sm:mt-2 max-w-sm sm:w-92 rounded-2xl border border-[#DFE7E8] bg-white p-2.5 shadow-2xl z-50"
                  >
                    <div className="flex items-center justify-between border-b border-[#DFE7E8] px-3 py-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <BadgeCheck className="h-4 w-4 text-[#2FA493]" />
                          <p className="text-xs font-bold text-[#162D43]">
                            Pilih Akun Simulasi (5 Role)
                          </p>
                        </div>
                        <p className="text-[11px] text-[#64748B] mt-0.5">
                          Uji hak akses: 1 Superadmin, 1 Admin PT A &amp; B, 1 Karyawan PT A &amp; B
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsRoleDropdownOpen(false)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-1 space-y-1.5 max-h-[65vh] overflow-y-auto pr-1">
                      {activeBusinessUsers.map((user) => {
                        const isSelected = user.id === session.id;
                        return (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => switchUser(user)}
                            className={`w-full text-left flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-xs transition-colors border ${
                              isSelected
                                ? 'bg-[#E6F5F1] border-[#2FA493] text-[#162D43] shadow-xs'
                                : 'hover:bg-[#F3F4EF] border-transparent text-[#64748B]'
                            }`}
                          >
                            <div
                              className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
                                user.role === 'SUPERADMIN'
                                  ? 'bg-[#123456] text-white'
                                  : user.tenantId?.includes('pt-b')
                                  ? 'bg-[#2FA493] text-white'
                                  : 'bg-[#163D66] text-white'
                              }`}
                            >
                              {user.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 flex-wrap">
                                <p className="font-bold truncate text-[#162D43]">{user.name}</p>
                                <span
                                  className={`shrink-0 rounded text-[8px] font-bold px-1.5 py-0.5 border ${
                                    user.role === 'SUPERADMIN'
                                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                                      : user.tenantId?.includes('pt-b')
                                      ? user.role === 'ADMIN_PT'
                                        ? 'bg-teal-50 text-teal-800 border-teal-200'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : user.role === 'ADMIN_PT'
                                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                                      : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  }`}
                                >
                                  {user.tierBadge}
                                </span>
                              </div>
                              <p className="text-[10px] text-[#64748B] font-medium truncate mt-0.5">
                                {user.tenantName || 'ELRISE Global'}
                              </p>
                              <p className="text-[10px] text-[#64748B] line-clamp-1 mt-0.5">{user.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-[#DFE7E8] bg-white text-[#162D43] hover:bg-[#F3F4EF] focus:outline-hidden"
              aria-label="Buka Menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Primary Desktop Navigation Bar */}
        <div className="mx-auto max-w-7xl px-2 sm:px-6">
          <nav className="relative flex space-x-1 overflow-x-auto py-1 scrollbar-none scroll-smooth">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  type="button"
                  onClick={() => handleTabClick(item.id)}
                  className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs transition-colors ${
                    isActive
                      ? 'text-[#197568] font-bold'
                      : 'text-[#64748B] hover:text-[#162D43] hover:bg-[#F3F4EF]'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="activeTabUnderline"
                      className="absolute inset-0 rounded-lg bg-[#E6F5F1] border border-[#2FA493]/30 z-0"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isActive ? 'text-[#197568]' : 'text-[#64748B]'}`} />
                    <span>{item.shortLabel}</span>
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile Drawer Slide-over Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-[#123456]/50 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative ml-auto flex h-full w-full max-w-xs flex-col bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-[#DFE7E8] px-4 py-3.5">
                <ElriseLogo size="sm" variant="full" />
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Current Active User Profile */}
              <div className="border-b border-[#DFE7E8] bg-[#F3F4EF] p-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#123456] font-bold text-white text-sm">
                    {session.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-[#162D43] truncate">{session.name}</p>
                    <p className="text-[10px] text-[#64748B] truncate">{session.email}</p>
                    <div className="mt-1">
                      <span className={`inline-block rounded text-[9px] px-1.5 py-0.2 font-bold border ${getRoleBadgeColor(session.role)}`}>
                        {session.role}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                  Menu Hak Akses
                </p>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleTabClick(item.id)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-[#E6F5F1] text-[#197568] border border-[#2FA493]/30'
                          : 'text-[#162D43] hover:bg-[#F3F4EF]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 ${isActive ? 'text-[#197568]' : 'text-[#64748B]'}`} />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </button>
                  );
                })}
              </div>

              <div className="border-t border-[#DFE7E8] p-3 bg-[#F3F4EF]">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsRoleDropdownOpen(true);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#123456] hover:bg-[#0D2742] py-2.5 text-xs font-bold text-white shadow-xs transition-all active:scale-98"
                >
                  <UserCheck className="h-4 w-4 text-[#2FA493]" />
                  <span>Ganti Akun Demo (5 Role)</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Quick-Navigation Bar for Mobile */}
      <div className="fixed bottom-0 inset-x-0 z-30 block md:hidden border-t border-[#DFE7E8] bg-white/95 backdrop-blur-md px-2 py-1 shadow-lg">
        <div className="flex items-center justify-around gap-1">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item.id)}
                className={`relative flex flex-1 flex-col items-center justify-center py-1.5 rounded-xl text-[10px] font-medium transition-colors ${
                  isActive ? 'text-[#197568] font-bold bg-[#E6F5F1]' : 'text-[#64748B] hover:text-[#162D43]'
                }`}
              >
                <Icon className={`h-4 w-4 mb-0.5 ${isActive ? 'text-[#197568]' : 'text-[#64748B]'}`} />
                <span className="truncate max-w-[64px]">{item.shortLabel}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-1 flex-col items-center justify-center py-1.5 rounded-xl text-[10px] font-medium text-[#64748B] hover:text-[#162D43]"
          >
            <Menu className="h-4 w-4 mb-0.5 text-[#64748B]" />
            <span>Menu</span>
          </button>
        </div>
      </div>
    </>
  );
};
