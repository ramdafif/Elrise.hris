// Nusantara HRIS Enterprise - Centralized Server-Side Authorization Engine
// Implements: User -> Role -> Scope -> Permission -> Resource
// Enforces: Platform Global Scope, Tenant Isolation, Project Scope, Anti-IDOR, SoD

import { UserRole, ScopeType } from '../types';
import { assertTenantIsolation } from './tenant';

export type ExtendedPermission =
  | 'employee.read'
  | 'employee.create'
  | 'employee.update'
  | 'employee.delete'
  | 'employee.salary.read'
  | 'employee.salary.update'
  | 'attendance.read'
  | 'attendance.create'
  | 'attendance.approve'
  | 'leave.read'
  | 'leave.create'
  | 'leave.approve'
  | 'overtime.read'
  | 'overtime.create'
  | 'overtime.approve'
  | 'payroll.read'
  | 'payroll.calculate'
  | 'payroll.approve'
  | 'payroll.lock'
  | 'payslip.read'
  | 'documents.read'
  | 'documents.download'
  | 'documents.upload'
  | 'documents.verify'
  | 'reimbursement.read'
  | 'reimbursement.create'
  | 'reimbursement.approve'
  | 'loan.read'
  | 'loan.create'
  | 'loan.approve'
  | 'kpi.read'
  | 'kpi.create'
  | 'kpi.submit'
  | 'kpi.review'
  | 'kpi.finalize'
  | 'project.read'
  | 'project.create'
  | 'project.update'
  | 'project.delete'
  | 'project.assign'
  | 'tax.read'
  | 'bpjs.read'
  | 'settings.read'
  | 'settings.update'
  | 'audit.read'
  | 'reports.read'
  | 'platform.manage'
  | 'tenant.impersonate';

export type Permission = ExtendedPermission;

export interface SecurityActor {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  scopeType: ScopeType;
  tenantId?: string;
  employeeId?: string;
  projectIds?: string[];
  targetTenantId?: string; // Explicit target for platform admin cross-tenant actions
}

export const ROLE_EXTENDED_PERMISSIONS: Record<UserRole, ExtendedPermission[]> = {
  // 1. SUPERADMIN (Platform Owner - Client & License Management Only)
  SUPERADMIN: [
    'settings.read', 'settings.update',
    'audit.read', 'reports.read',
    'platform.manage', 'tenant.impersonate',
  ],

  // 2. ADMIN_PT (Tenant / Company Scope - Full PT Management)
  ADMIN_PT: [
    'employee.read', 'employee.create', 'employee.update', 'employee.delete',
    'employee.salary.read', 'employee.salary.update',
    'attendance.read', 'attendance.create', 'attendance.approve',
    'leave.read', 'leave.create', 'leave.approve',
    'overtime.read', 'overtime.create', 'overtime.approve',
    'payroll.read', 'payroll.calculate', 'payroll.approve', 'payroll.lock',
    'payslip.read', 'documents.read', 'documents.download', 'documents.upload', 'documents.verify',
    'reimbursement.read', 'reimbursement.create', 'reimbursement.approve',
    'loan.read', 'loan.create', 'loan.approve',
    'kpi.read', 'kpi.create', 'kpi.submit', 'kpi.review', 'kpi.finalize',
    'project.read', 'project.create', 'project.update', 'project.delete', 'project.assign',
    'tax.read', 'bpjs.read',
    'settings.read', 'settings.update',
    'audit.read', 'reports.read',
  ],

  // 3. ADMIN_PROJECT (Assigned Project Scope - Operational Unit Management)
  ADMIN_PROJECT: [
    'employee.read', 'employee.update',
    'attendance.read', 'attendance.create', 'attendance.approve',
    'leave.read', 'leave.create', 'leave.approve',
    'overtime.read', 'overtime.create', 'overtime.approve',
    'documents.read', 'documents.download', 'documents.upload',
    'reimbursement.read', 'reimbursement.create', 'reimbursement.approve',
    'kpi.read', 'kpi.create', 'kpi.submit', 'kpi.review',
    'project.read',
    'reports.read',
    'audit.read',
  ],

  // 4. EMPLOYEE (Self Scope Only - Employee Self Service)
  EMPLOYEE: [
    'employee.read', // Own profile only
    'attendance.read', 'attendance.create',
    'leave.read', 'leave.create',
    'overtime.read', 'overtime.create',
    'reimbursement.read', 'reimbursement.create',
    'loan.read',
    'kpi.read', 'kpi.submit',
    'payslip.read', 'documents.read', 'documents.upload',
    'project.read',
  ],
};

export function checkPermission(role: UserRole | string, permission: ExtendedPermission): boolean {
  if (role !== 'SUPERADMIN' && role !== 'ADMIN_PT' && role !== 'ADMIN_PROJECT' && role !== 'EMPLOYEE') {
    return false;
  }
  const permissions = ROLE_EXTENDED_PERMISSIONS[role as UserRole] || [];
  return permissions.includes(permission);
}

export const hasPermission = checkPermission;

export interface AuthorizationResource {
  type:
    | 'employee'
    | 'attendance'
    | 'leave'
    | 'overtime'
    | 'payroll'
    | 'reimbursement'
    | 'loan'
    | 'kpi'
    | 'document'
    | 'project'
    | 'project_assignment'
    | 'audit'
    | 'setting'
    | 'system';
  id?: string;
  tenantId?: string;
  projectId?: string;
  projectIds?: string[];
  employeeId?: string;
  managerId?: string;
}

export interface AuthorizationContext {
  actor: SecurityActor;
  action: ExtendedPermission;
  resource: AuthorizationResource;
}

export interface AuthorizationResult {
  allowed: boolean;
  reason?: string;
  statusCode?: number;
}

/**
 * Centralized Server-Side Authorization Engine
 * Evaluates: Authentication -> Platform/Tenant Identity -> Role -> Tenant Scope -> Project Scope -> Resource Ownership -> Permission -> Action
 */
export function authorize(context: AuthorizationContext): AuthorizationResult {
  const { actor, action, resource } = context;

  // 1. Authentication check
  if (!actor || !actor.id) {
    return {
      allowed: false,
      reason: 'Autentikasi gagal: Sesi pengguna tidak ditemukan atau kedaluwarsa.',
      statusCode: 401,
    };
  }

  // 2. Base RBAC Permission check
  if (!checkPermission(actor.role, action)) {
    return {
      allowed: false,
      reason: `Wewenang tidak cukup: Peran ${actor.role} tidak memiliki hak akses '${action}'.`,
      statusCode: 403,
    };
  }

  // 3. Tenant Isolation & Scope Check
  if (actor.scopeType === 'PLATFORM_GLOBAL' || actor.role === 'SUPERADMIN') {
    // Superadmin performing tenant-owned resource operation MUST identify target tenant
    const tenantScopedTypes = ['employee', 'attendance', 'leave', 'overtime', 'payroll', 'reimbursement', 'loan', 'kpi', 'document', 'project', 'project_assignment'];
    if (tenantScopedTypes.includes(resource.type) && !resource.tenantId && !actor.targetTenantId) {
      return {
        allowed: false,
        reason: `Akses ditolak: Operasi '${resource.type}' oleh Superadmin wajib menentukan target tenant ID secara eksplisit.`,
        statusCode: 400,
      };
    }
  } else {
    // Non-platform actors MUST strictly belong to a tenant
    if (!actor.tenantId) {
      return {
        allowed: false,
        reason: 'Akses ditolak: Akun pengguna tidak terasosiasi dengan tenant yang valid.',
        statusCode: 403,
      };
    }

    // Non-platform actors MUST strictly match the resource's tenantId
    if (resource.tenantId) {
      try {
        assertTenantIsolation(actor.tenantId, resource.tenantId, resource.type, actor.scopeType);
      } catch (err: unknown) {
        return {
          allowed: false,
          reason: (err as Error).message,
          statusCode: 403,
        };
      }
    }
  }

  // 4. Project Scope Isolation Check (Role != Scope requirement)
  // If the actor is ADMIN_PROJECT (Project Scope):
  // Note: ADMIN_PT has TENANT scope and automatically accesses ALL projects inside their tenant!
  if (actor.scopeType === 'PROJECT' || actor.role === 'ADMIN_PROJECT') {
    const actorProjects = actor.projectIds || [];

    // If resource specifies a project, ensure actor is assigned to it
    if (resource.projectId) {
      if (!actorProjects.includes(resource.projectId)) {
        return {
          allowed: false,
          reason: `Akses ditolak: Anda tidak memiliki akses ke Proyek ${resource.projectId}. Lingkup proyek terbatas pada: [${actorProjects.join(', ')}].`,
          statusCode: 403,
        };
      }
    }

    // If resource specifies multiple projects (e.g. employee assigned to projects), ensure at least 1 overlaps
    if (resource.projectIds && resource.projectIds.length > 0) {
      const hasOverlap = resource.projectIds.some((pId) => actorProjects.includes(pId));
      if (!hasOverlap) {
        return {
          allowed: false,
          reason: `Akses ditolak: Karyawan tidak terdaftar pada proyek yang Anda kelola.`,
          statusCode: 403,
        };
      }
    }

    // Strict Payroll Security: Project Admin must NEVER access sensitive company salary or payroll ledgers
    if (
      action.startsWith('payroll.') ||
      action.startsWith('employee.salary.') ||
      action.startsWith('tax.') ||
      action.startsWith('bpjs.')
    ) {
      return {
        allowed: false,
        reason: 'Akses ditolak: Pengelola proyek dilarang mengakses data keuangan, kompensasi, dan penggajian perusahaan.',
        statusCode: 403,
      };
    }
  }

  // 5. Resource Ownership & Anti-IDOR Check (for EMPLOYEE - Self Scope Only)
  if (actor.role === 'EMPLOYEE' || actor.scopeType === 'SELF') {
    if (resource.employeeId && actor.employeeId) {
      if (resource.employeeId !== actor.employeeId) {
        return {
          allowed: false,
          reason: 'Akses ditolak: Karyawan dilarang mengakses data karyawan lain (Anti-IDOR Protection).',
          statusCode: 403,
        };
      }
    }

    // Employees cannot perform approval actions
    if (action.endsWith('.approve') || action.endsWith('.lock') || action.endsWith('.calculate')) {
      return {
        allowed: false,
        reason: 'Akses ditolak: Karyawan tidak memiliki hak persetujuan atau modifikasi status.',
        statusCode: 403,
      };
    }
  }

  return { allowed: true };
}

/**
 * Asserts authorization, throwing an Error with status code if unauthorized
 */
export function assertAuthorized(context: AuthorizationContext): void {
  const result = authorize(context);
  if (!result.allowed) {
    const error = new Error(result.reason || 'Akses ditolak.');
    (error as any).statusCode = result.statusCode || 403;
    throw error;
  }
}

/**
 * Legacy compatibility helper for Employee records
 */
export function authorizeEmployeeAccess(
  actor: SecurityActor,
  targetEmployee: { id: string; tenantId?: string },
  permission: ExtendedPermission
): AuthorizationResult {
  return authorize({
    actor,
    action: permission,
    resource: {
      type: 'employee',
      id: targetEmployee.id,
      tenantId: targetEmployee.tenantId,
      employeeId: targetEmployee.id,
    },
  });
}
