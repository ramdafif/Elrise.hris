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
} from 'lucide-react';
import { UserRole, UserSession } from '@/lib/types';
import { DEMO_USERS, DemoUser, isTabAllowed, ROLE_LABELS } from '@/lib/auth/session';

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
    // Check if the current tab is allowed in the newly selected role
    if (!isTabAllowed(user.role, currentTab)) {
      setCurrentTab('DASHBOARD');
    }
    setIsRoleDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  const getRoleBadgeColor = (role: UserRole) => {
    return ROLE_LABELS[role]?.badgeColor || 'bg-slate-100 text-slate-800 border-slate-200';
  };

  // Only display the 4 active business roles in the primary selector
  const activeBusinessUsers = DEMO_USERS.filter((u) =>
    ['user-superadmin', 'user-admin-pt', 'user-admin-project', 'user-employee'].includes(u.id)
  );

  const allNavItems = [
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

  // Filter navigation tabs dynamically based on the current user's role
  const navItems = allNavItems
    .filter((item) => isTabAllowed(session.role, item.id))
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
      if (item.id === 'EMPLOYEES' && session.role === 'ADMIN_PROJECT') {
        return {
          ...item,
          label: 'Anggota Tim (Departemen)',
          shortLabel: 'Tim Saya',
        };
      }
      if (item.id === 'KPI_PERFORMANCE' && session.role === 'EMPLOYEE') {
        return {
          ...item,
          label: 'KPI Saya (Self-Review)',
          shortLabel: 'KPI Saya',
        };
      }
      if (item.id === 'KPI_PERFORMANCE' && session.role === 'ADMIN_PROJECT') {
        return {
          ...item,
          label: 'Review KPI Tim',
          shortLabel: 'KPI Tim',
        };
      }
      return item;
    });

  const handleTabClick = (tabId: string) => {
    setCurrentTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const currentRoleInfo = ROLE_LABELS[session.role] || {
    title: session.role,
    scopeBadge: 'Simulasi Hak Akses',
    description: '',
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#E4E8EE] bg-white shadow-xs">
        {/* Top Banner: Organization, Time, Demo User Switcher */}
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 py-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-md bg-[#0B1728] font-bold text-[#009FE3] border border-[#15263A] shadow-xs">
              <span className="font-mono text-xs sm:text-sm font-extrabold tracking-wider">ELK</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-base font-semibold text-[#172033] tracking-tight truncate">
                  {companyName}
                </h1>
                <span className="shrink-0 rounded bg-[#EEF2F6] px-1.5 py-0.5 text-[10px] font-semibold text-[#009FE3] border border-[#E4E8EE]">
                  ELKYNO HRIS
                </span>
              </div>
              {/* Context Hierarchy: SUPERADMIN / ADMIN_PT / ADMIN_PROJECT / EMPLOYEE */}
              <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-600 truncate mt-0.5">
                {session.role === 'SUPERADMIN' ? (
                  <span className="flex items-center gap-1 font-medium text-purple-700">
                    <Globe2 className="h-3 w-3" />
                    <span>ELKYNO PLATFORM</span>
                    <span>&rarr;</span>
                    <span className="text-slate-800">Semua Tenant</span>
                    <span>&rarr;</span>
                    <span className="text-slate-500">Semua Proyek</span>
                  </span>
                ) : session.role === 'ADMIN_PT' ? (
                  <span className="flex items-center gap-1 font-medium text-blue-700">
                    <Building2 className="h-3 w-3" />
                    <span>PT Elkyno Technology</span>
                    <span>&rarr;</span>
                    <span className="text-slate-600">Seluruh Proyek (Tenant Scope)</span>
                  </span>
                ) : session.role === 'ADMIN_PROJECT' ? (
                  <span className="flex items-center gap-1 font-medium text-amber-700">
                    <FolderKanban className="h-3 w-3" />
                    <span>PT Elkyno</span>
                    <span>&rarr;</span>
                    <span className="text-slate-800 font-semibold">{session.primaryProjectId ? 'Project Jakarta Smart City' : 'Proyek Tertugaskan'}</span>
                    <span className="text-slate-400 text-[10px]">(Project Scope)</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-medium text-emerald-700">
                    <UserCheck className="h-3 w-3" />
                    <span>PT Elkyno</span>
                    <span>&rarr;</span>
                    <span className="text-slate-800">Profil &amp; ESS Mandiri</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Indonesian Time (Desktop only) */}
            <div className="hidden lg:flex items-center gap-1.5 rounded-md bg-slate-50 border border-slate-200 px-2.5 py-1 text-xs font-mono text-slate-600">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>{timeStr || '09:00:00 WIB'}</span>
            </div>

            {/* Role Switcher Dropdown with Motion */}
            <div className="relative">
              <motion.button
                id="role-switcher-btn"
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-slate-200 bg-white px-2 sm:px-3 py-1.5 text-left text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 focus:outline-hidden transition-colors"
              >
                <div className="flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                  {session.name.charAt(0)}
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-[10px] text-slate-500 leading-tight">Role Aktif (RBAC):</span>
                  <span className="font-semibold text-slate-900 leading-tight truncate max-w-[120px]">
                    {session.name.split(',')[0]}
                  </span>
                </div>
                <span
                  className={`rounded border px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold ${getRoleBadgeColor(
                    session.role
                  )}`}
                >
                  {session.role.replace('_', ' ')}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
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
                    className="fixed sm:absolute inset-x-3 sm:inset-x-auto sm:right-0 top-16 sm:top-auto sm:mt-2 max-w-sm sm:w-84 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl z-50"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <BadgeCheck className="h-4 w-4 text-emerald-600" />
                          <p className="text-xs font-bold text-slate-900">
                            Simulasi Hak Akses (RBAC)
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Pilih akun untuk menguji batasan menu & otoritas tindakan
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsRoleDropdownOpen(false)}
                        className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-1 space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
                      {activeBusinessUsers.map((user) => {
                        const isSelected = user.id === session.id;
                        return (
                          <button
                            key={user.id}
                            type="button"
                            onClick={() => switchUser(user)}
                            className={`w-full text-left flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-xs transition-colors border ${
                              isSelected
                                ? 'bg-[#EEF2F6] border-[#009FE3] text-[#172033] shadow-xs'
                                : 'hover:bg-slate-50 border-transparent text-[#667085]'
                            }`}
                          >
                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded bg-[#101D30] text-[#009FE3] font-bold text-xs overflow-hidden">
                              {user.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 flex-wrap">
                                <p className="font-bold truncate text-[#172033]">{user.name}</p>
                                <span
                                  className={`shrink-0 rounded text-[8px] font-bold px-1.5 py-0.5 border ${
                                    user.role === 'SUPERADMIN'
                                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                                      : user.role === 'ADMIN_PT'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : user.role === 'ADMIN_PROJECT'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}
                                >
                                  {user.tierBadge}
                                </span>
                              </div>
                              <p className="text-[10px] text-[#667085] font-medium truncate mt-0.5">
                                {user.projectName ? `${user.projectName} • ` : user.tenantName ? `${user.tenantName} • ` : ''}
                                {ROLE_LABELS[user.role]?.title || user.role}
                              </p>
                              <p className="text-[10px] text-[#667085] line-clamp-1 mt-0.5">{user.description}</p>
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
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:outline-hidden"
              aria-label="Buka Menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Primary Navigation Tabs with Motion Highlight */}
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
                  className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-xs transition-colors ${
                    isActive
                      ? 'text-[#009FE3] font-semibold'
                      : 'text-[#667085] hover:text-[#172033] hover:bg-[#EEF2F6]/60'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="activeTabUnderline"
                      className="absolute inset-0 rounded-md bg-[#EEF2F6] border border-[#E4E8EE] z-0"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isActive ? 'text-[#009FE3]' : 'text-[#667085]'}`} />
                    <span>{item.shortLabel}</span>
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile Drawer Slide-over Menu with Motion */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Drawer Content */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative ml-auto flex h-full w-full max-w-xs flex-col bg-white shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 font-bold text-white">
                    <Building className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">Menu Hak Akses</h3>
                    <p className="text-[10px] text-slate-500">Nusantara HRIS Platform</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Current Active User Card */}
              <div className="border-b border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 font-bold text-white text-sm">
                    {session.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-slate-900 truncate">{session.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{session.email}</p>
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-block rounded text-[9px] px-1.5 py-0.2 font-semibold border ${getRoleBadgeColor(
                          session.role
                        )}`}
                      >
                        {session.role.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Links - Filtered by current user's role */}
              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Menu Tersedia Untuk Role Anda
                </p>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleTabClick(item.id)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </button>
                  );
                })}
              </div>

              {/* Drawer Footer */}
              <div className="border-t border-slate-200 p-3 bg-slate-50">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsRoleDropdownOpen(true);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 active:scale-98 transition-all"
                >
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                  <span>Ganti Akun Demo / Role</span>
                </button>
                <p className="mt-2 text-center text-[10px] text-slate-400">
                  PT Elkyno Technology &bull; 2026
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Quick-Navigation Bar for Mobile with Role-Aware Buttons */}
      <div className="fixed bottom-0 inset-x-0 z-30 block md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md px-2 py-1 shadow-lg">
        <div className="flex items-center justify-around gap-1">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item.id)}
                className={`relative flex flex-1 flex-col items-center justify-center py-1.5 rounded-lg text-[10px] font-medium transition-colors ${
                  isActive ? 'text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 mb-0.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span className="truncate max-w-[64px]">{item.shortLabel}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-1 flex-col items-center justify-center py-1.5 rounded-lg text-[10px] font-medium text-slate-500 hover:text-slate-900"
          >
            <Menu className="h-4 w-4 mb-0.5 text-slate-400" />
            <span>Menu</span>
          </button>
        </div>
      </div>
    </>
  );
};
