// Session & Role-Based Access Control (RBAC) System
// Implements: Platform Owner (Superadmin) -> Tenant (Admin PT) -> Employee Hierarchy
// Superadmin: Khusus mengelola Client (PT), konfigurasi Admin PT, dan izin fitur aktif per PT.
// Admin PT: Mengelola operasional PT (Karyawan, Presensi, Cuti/Lembur, KPI, & Penggajian Payroll/BPJS).
// Employee: Mengakses ESS (Presensi, Cuti/Lembur, Slip Gaji mandiri) sesuai perusahaannya.

import { UserRole, ScopeType, UserSession } from '../types';
import { SecurityActor, ExtendedPermission } from '../security/authorization';
import { REGISTERED_TENANTS, isModuleAllowedForTenant } from '../security/tenant';

export interface DemoUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  scopeType: ScopeType;
  tenantId?: string; // Company / PT ID
  tenantName?: string;
  projectIds?: string[];
  primaryProjectId?: string;
  projectName?: string;
  employeeId?: string;
  avatar: string;
  description: string;
  tierBadge: string;
}

/**
 * Tepat 5 Akun Sesuai Spesifikasi:
 * 1 Superadmin, 1 Admin PT A, 1 Karyawan PT A, 1 Admin PT B, 1 Karyawan PT B
 */
export const DEMO_USERS: DemoUser[] = [
  // --- 1. SUPERADMIN (Platform Owner Level - Client & License Management) ---
  {
    id: 'user-superadmin',
    email: 'superadmin@elrise.id',
    name: 'Bambang Soediro (Superadmin Platform)',
    role: 'SUPERADMIN',
    scopeType: 'PLATFORM_GLOBAL',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    description: 'Superadmin Platform: Khusus kelola Client (PT), nyetting akun Admin PT, dan fitur/modul yang diizinkan untuk setiap client.',
    tierBadge: 'SUPERADMIN',
  },

  // --- 2. ADMIN PT A (Tenant / Company Level - PT Alpha) ---
  {
    id: 'user-admin-pt-a',
    email: 'budi.hartono@alphadigital.co.id',
    name: 'Budi Hartono (Admin PT A)',
    role: 'ADMIN_PT',
    scopeType: 'TENANT',
    tenantId: 'tenant-pt-a',
    tenantName: 'PT Alpha Digital Nusantara (PT A)',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    description: 'Admin PT A: Mengelola seluruh karyawan, presensi, cuti, KPI, dan penggajian (Payroll, PPh 21 TER & BPJS) di PT Alpha.',
    tierBadge: 'ADMIN PT A',
  },

  // --- 3. KARYAWAN PT A (Employee Level - PT Alpha) ---
  {
    id: 'user-emp-pt-a',
    email: 'farhan.maulana@alphadigital.co.id',
    name: 'Farhan Maulana (Karyawan PT A)',
    role: 'EMPLOYEE',
    scopeType: 'SELF',
    tenantId: 'tenant-pt-a',
    tenantName: 'PT Alpha Digital Nusantara (PT A)',
    employeeId: 'emp-005',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    description: 'Karyawan PT A (ESS): Presensi mandiri, pengajuan cuti/lembur, dan akses slip gaji di PT Alpha.',
    tierBadge: 'KARYAWAN PT A',
  },

  // --- 4. ADMIN PT B (Tenant / Company Level - PT Beta) ---
  {
    id: 'user-admin-pt-b',
    email: 'siti.rahmawati@betasolusi.co.id',
    name: 'Siti Rahmawati (Admin PT B)',
    role: 'ADMIN_PT',
    scopeType: 'TENANT',
    tenantId: 'tenant-pt-b',
    tenantName: 'PT Beta Solusi Sejahtera (PT B)',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    description: 'Admin PT B: Mengelola seluruh karyawan, presensi, cuti, KPI, dan penggajian (Payroll, PPh 21 TER & BPJS) di PT Beta.',
    tierBadge: 'ADMIN PT B',
  },

  // --- 5. KARYAWAN PT B (Employee Level - PT Beta) ---
  {
    id: 'user-emp-pt-b',
    email: 'rian.pratama@betasolusi.co.id',
    name: 'Rian Pratama (Karyawan PT B)',
    role: 'EMPLOYEE',
    scopeType: 'SELF',
    tenantId: 'tenant-pt-b',
    tenantName: 'PT Beta Solusi Sejahtera (PT B)',
    employeeId: 'emp-b-001',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    description: 'Karyawan PT B (ESS): Presensi mandiri, pengajuan cuti/lembur, dan akses slip gaji di PT Beta.',
    tierBadge: 'KARYAWAN PT B',
  },
];

// Re-export unified permissions from lib/security/authorization
export type { Permission, ExtendedPermission } from '../security/authorization';
export { checkPermission, hasPermission, authorize, assertAuthorized } from '../security/authorization';

/**
 * Tab Accessibility Matrix per UserRole:
 * Superadmin: Khusus Client (PT), Audit Platform, Keamanan Platform.
 * Admin PT: Penuh mengelola operasional HR & Payroll (Payroll dipindahkan ke Admin PT).
 * Employee: Self-service ESS (Slip Gaji, Presensi, Cuti).
 */
export const ROLE_ALLOWED_TABS: Record<UserRole, string[]> = {
  SUPERADMIN: [
    'CLIENTS', // Primary Superadmin View: Kelola Client & Lisensi Fitur PT
    'AUDIT_LOG', // Log Audit Platform
    'SECURITY_CENTER', // Keamanan Platform
  ],
  ADMIN_PT: [
    'DASHBOARD',
    'PROJECTS',
    'EMPLOYEES',
    'ATTENDANCE',
    'LEAVE_OVERTIME',
    'KPI_PERFORMANCE',
    'PAYROLL', // Pindah ke Admin PT: Penggajian, PPh 21 TER, & BPJS
    'TAX_REGULATION', // Kepatuhan Pajak & Regulasi
    'AUDIT_LOG',
    'SECURITY_CENTER',
  ],
  ADMIN_PROJECT: [
    'DASHBOARD',
    'PROJECTS',
    'EMPLOYEES',
    'ATTENDANCE',
    'LEAVE_OVERTIME',
    'KPI_PERFORMANCE',
    'AUDIT_LOG',
  ],
  EMPLOYEE: [
    'DASHBOARD',
    'EMPLOYEES',
    'ATTENDANCE',
    'LEAVE_OVERTIME',
    'KPI_PERFORMANCE',
    'PAYROLL', // Payslip ESS mandiri
  ],
};

export function isTabAllowed(role: UserRole, tabId: string, tenantId?: string): boolean {
  const allowed = ROLE_ALLOWED_TABS[role] || ['DASHBOARD'];
  if (!allowed.includes(tabId)) {
    return false;
  }

  // Khusus Admin PT dan Employee: Cek apakah fitur tersebut diizinkan oleh Superadmin untuk Tenant tersebut
  if ((role === 'ADMIN_PT' || role === 'EMPLOYEE') && tenantId) {
    const operationalModules = [
      'EMPLOYEES',
      'ATTENDANCE',
      'LEAVE_OVERTIME',
      'KPI_PERFORMANCE',
      'PAYROLL',
      'TAX_REGULATION',
      'PROJECTS',
      'AUDIT_LOG',
    ];
    if (operationalModules.includes(tabId)) {
      return isModuleAllowedForTenant(tenantId, tabId);
    }
  }

  return true;
}

export const ROLE_LABELS: Record<
  UserRole,
  { title: string; badgeColor: string; description: string; scopeBadge: string }
> = {
  SUPERADMIN: {
    title: 'Superadmin Platform',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Pengelola Platform: Mengatur Client (PT), akun Admin PT, dan fitur yang diizinkan untuk setiap client.',
    scopeBadge: 'Platform Global Scope (Client Management)',
  },
  ADMIN_PT: {
    title: 'Admin PT (Operasional & Payroll)',
    badgeColor: 'bg-[#123456]/10 text-[#123456] border-[#123456]/20',
    description: 'Pengelola penuh operasional perusahaan: Karyawan, presensi, cuti, KPI, dan penggajian (Payroll/BPJS).',
    scopeBadge: 'Tenant Scope (Company Full Access)',
  },
  ADMIN_PROJECT: {
    title: 'Admin Project',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Pengelola operasional proyek tertugaskan.',
    scopeBadge: 'Project Scope',
  },
  EMPLOYEE: {
    title: 'Karyawan (ESS)',
    badgeColor: 'bg-[#E6F5F1] text-[#197568] border-[#2FA493]/30',
    description: 'Presensi mandiri, pengajuan cuti/lembur, dan melihat slip gaji pribadi.',
    scopeBadge: 'Employee Self-Service (ESS)',
  },
};

/**
 * Default initial active session (Starts as Superadmin or Admin PT)
 */
export const DEFAULT_USER_SESSION: UserSession = {
  id: DEMO_USERS[0].id,
  email: DEMO_USERS[0].email,
  name: DEMO_USERS[0].name,
  role: DEMO_USERS[0].role,
  scopeType: DEMO_USERS[0].scopeType,
  tenantId: DEMO_USERS[0].tenantId,
  employeeId: DEMO_USERS[0].employeeId,
  projectIds: DEMO_USERS[0].projectIds,
  primaryProjectId: DEMO_USERS[0].primaryProjectId,
  avatar: DEMO_USERS[0].avatar,
  description: DEMO_USERS[0].description,
};

export class AuthenticationError extends Error {
  statusCode = 401;
  constructor(message = 'Autentikasi gagal: Sesi pengguna tidak ditemukan, tidak valid, atau kedaluwarsa.') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Resolves verified server-side session from Request.
 */
export async function resolveServerSession(req: Request): Promise<SecurityActor> {
  const { authManager } = await import('./provider');
  const actor = await authManager.authenticateRequest(req);

  // Resolve target tenant ONLY for Superadmin switching context
  let targetTenantId: string | undefined = undefined;
  if (actor.scopeType === 'PLATFORM_GLOBAL' || actor.role === 'SUPERADMIN') {
    const impersonateHeader = req.headers.get('x-target-tenant-id');
    if (impersonateHeader && REGISTERED_TENANTS[impersonateHeader]) {
      targetTenantId = impersonateHeader;
    }
  }

  return {
    ...actor,
    targetTenantId,
  };
}

/**
 * Resolves effective tenantId for an operation, enforcing strict multi-tenant boundaries.
 */
export function resolveEffectiveTenantId(actor: SecurityActor, requestedTenantId?: string | null): string {
  if (actor.role === 'SUPERADMIN' || actor.scopeType === 'PLATFORM_GLOBAL') {
    const target = actor.targetTenantId || requestedTenantId || 'tenant-pt-a';
    if (!REGISTERED_TENANTS[target]) {
      const error = new Error(`Target tenant '${target}' tidak terdaftar dalam sistem.`);
      (error as any).statusCode = 404;
      throw error;
    }
    return target;
  }

  if (!actor.tenantId) {
    const error = new Error('Akses ditolak: Akun pengguna tidak terasosiasi dengan tenant.');
    (error as any).statusCode = 403;
    throw error;
  }

  // Cross-tenant IDOR protection: Non-superadmin cannot access any other tenant
  if (requestedTenantId && requestedTenantId !== actor.tenantId) {
    const error = new Error('Akses ditolak: Percobaan akses lintas-tenant terdeteksi (Anti-IDOR Protection).');
    (error as any).statusCode = 403;
    throw error;
  }

  return actor.tenantId;
}
