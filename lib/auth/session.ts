// Session & Role-Based Access Control (RBAC) System
// Implements: Platform Owner -> Tenant -> Project -> Employee Hierarchy
// Server-Authoritative Identity: Zero trust in client-supplied roles or unverified tenant headers.

import { UserRole, ScopeType, UserSession } from '../types';
import { SecurityActor, ExtendedPermission } from '../security/authorization';
import { REGISTERED_TENANTS } from '../security/tenant';

export interface DemoUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  scopeType: ScopeType;
  tenantId?: string; // Company / PT ID
  tenantName?: string;
  projectIds?: string[]; // Project IDs for PROJECT_ADMIN/PROJECT_MANAGER
  primaryProjectId?: string;
  projectName?: string;
  employeeId?: string;
  avatar: string;
  description: string;
  tierBadge: string;
}

export const DEMO_USERS: DemoUser[] = [
  // --- 1. SUPERADMIN (Platform Owner Level - Above Tenant) ---
  {
    id: 'user-superadmin',
    email: 'bambang.soediro@nusantaratech.co.id',
    name: 'Bambang Soediro, M.Sc.',
    role: 'SUPERADMIN',
    scopeType: 'PLATFORM_GLOBAL',
    tenantId: 'tenant-elkyno-01', // Active view context, can cross-access all
    tenantName: 'Platform Owner (Global View)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    description: 'Platform Superadmin: Akses penuh ke seluruh PT, Proyek, Karyawan, Payroll & Audit Log Platform.',
    tierBadge: 'SUPERADMIN',
  },

  // --- 2. ADMIN_PT (Tenant / Company Level - Legal Customer Boundary) ---
  {
    id: 'user-admin-pt',
    email: 'budi.hartono@nusantaratech.co.id',
    name: 'Budi Hartono, MBA',
    role: 'ADMIN_PT',
    scopeType: 'TENANT',
    tenantId: 'tenant-elkyno-01',
    tenantName: 'PT Elkyno Technology Tbk',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    description: 'Admin PT: Mengelola seluruh proyek, karyawan, absensi, cuti, lembur, dan payroll di PT Elkyno.',
    tierBadge: 'ADMIN PT',
  },

  // --- 3. ADMIN_PROJECT (Project Level - Operational Scope inside Tenant) ---
  {
    id: 'user-admin-project',
    email: 'tri.nugroho@nusantaratech.co.id',
    name: 'Tri Nugroho (Admin Proyek Jakarta)',
    role: 'ADMIN_PROJECT',
    scopeType: 'PROJECT',
    tenantId: 'tenant-elkyno-01',
    tenantName: 'PT Elkyno Technology Tbk',
    projectIds: ['prj-jkt-01'],
    primaryProjectId: 'prj-jkt-01',
    projectName: 'Project Jakarta Smart City',
    employeeId: 'emp-004',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    description: 'Admin Project: Mengelola operasional staf, presensi, cuti & lembur khusus Proyek Jakarta (Tanpa akses payroll perusahaan).',
    tierBadge: 'ADMIN PROJECT',
  },

  // --- 4. EMPLOYEE (Self-Service ESS - Self Scope Only) ---
  {
    id: 'user-employee',
    email: 'farhan.akbar@nusantaratech.co.id',
    name: 'Farhan Maulana Akbar',
    role: 'EMPLOYEE',
    scopeType: 'SELF',
    tenantId: 'tenant-elkyno-01',
    tenantName: 'PT Elkyno Technology Tbk',
    employeeId: 'emp-005',
    projectIds: ['prj-jkt-01'],
    primaryProjectId: 'prj-jkt-01',
    projectName: 'Project Jakarta Smart City',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    description: 'Karyawan (ESS): Akses mandiri hanya untuk data profil pribadi, absensi, cuti, lembur, dan slip gaji sendiri.',
    tierBadge: 'EMPLOYEE',
  },
];

// Re-export unified permissions from lib/security/authorization (Single Source of Truth)
export type { Permission, ExtendedPermission } from '../security/authorization';
export { checkPermission, hasPermission, authorize, assertAuthorized } from '../security/authorization';

/**
 * Tab Accessibility Matrix per UserRole - Strictly the 4 Active Roles
 */
export const ROLE_ALLOWED_TABS: Record<UserRole, string[]> = {
  SUPERADMIN: [
    'DASHBOARD',
    'PROJECTS',
    'EMPLOYEES',
    'ATTENDANCE',
    'LEAVE_OVERTIME',
    'KPI_PERFORMANCE',
    'PAYROLL',
    'TAX_REGULATION',
    'AUDIT_LOG',
    'SECURITY_CENTER',
  ],
  ADMIN_PT: [
    'DASHBOARD',
    'PROJECTS',
    'EMPLOYEES',
    'ATTENDANCE',
    'LEAVE_OVERTIME',
    'KPI_PERFORMANCE',
    'PAYROLL',
    'TAX_REGULATION',
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
    'PROJECTS',
    'EMPLOYEES',
    'ATTENDANCE',
    'LEAVE_OVERTIME',
    'KPI_PERFORMANCE',
    'PAYROLL', // Own payslip only
  ],
};

export function isTabAllowed(role: UserRole, tabId: string): boolean {
  const allowed = ROLE_ALLOWED_TABS[role] || ['DASHBOARD'];
  return allowed.includes(tabId);
}

export const ROLE_LABELS: Record<
  UserRole,
  { title: string; badgeColor: string; description: string; scopeBadge: string }
> = {
  SUPERADMIN: {
    title: 'Superadmin (Platform Owner)',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Pemilik Platform SaaS: Akses penuh ke seluruh PT, Proyek, Karyawan, Payroll, Konfigurasi & Audit Log Platform.',
    scopeBadge: 'Platform Global Scope',
  },
  ADMIN_PT: {
    title: 'Admin PT (Tenant Scope)',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Pengelola penuh seluruh operasional, karyawan, proyek, payroll, pajak & kepatuhan di dalam PT.',
    scopeBadge: 'Tenant Scope (Seluruh Proyek di PT)',
  },
  ADMIN_PROJECT: {
    title: 'Admin Project (Project Scope)',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Pengelola operasional proyek: staf, presensi, cuti, lembur, dan KPI pada proyek yang ditugaskan.',
    scopeBadge: 'Project Scope (Proyek Tertugaskan)',
  },
  EMPLOYEE: {
    title: 'Karyawan (Self-Service ESS)',
    badgeColor: 'bg-[#E6FAF8] text-[#009FE3] border-[#ABEFC6]',
    description: 'Presensi mandiri (WFO/WFH), ajukan cuti & lembur, lihat slip gaji pribadi.',
    scopeBadge: 'Employee Self-Service (ESS)',
  },
};

/**
 * Default initial active session for instant interactivity
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
 * CRITICAL SECURITY PRINCIPLES:
 * 1. Zero Trust: Never trusts client headers `x-user-role`, `role` query param, or client body role!
 * 2. Fail Secure: If session is missing or invalid, throws AuthenticationError (401).
 * 3. Never falls back to SUPERADMIN or any default user.
 * 4. Production Authentication strictly separated from Development/Demo Authentication.
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
 * Throws 403 on cross-tenant IDOR attempt, or 400 if Superadmin omits required target tenant.
 */
export function resolveEffectiveTenantId(actor: SecurityActor, requestedTenantId?: string | null): string {
  if (actor.role === 'SUPERADMIN' || actor.scopeType === 'PLATFORM_GLOBAL') {
    const target = actor.targetTenantId || requestedTenantId;
    if (!target) {
      const error = new Error('Akses ditolak: Operasi tenant untuk Superadmin/Platform Global wajib menentukan target tenant ID secara eksplisit.');
      (error as any).statusCode = 400;
      throw error;
    }
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
