// Nusantara HRIS Enterprise - Four Roles Authorization Test Suite
// Verifies compliance with Section 31 of HRIS 4-Role Architecture

import { authorize, SecurityActor } from '../lib/security/authorization';

const describe = (_name: string, fn: () => void) => { fn(); };
const test = (_name: string, fn: () => void) => { fn(); };
const expect = <T>(actual: T) => ({
  toBe: (expected: T) => {
    if (actual !== expected) {
      throw new Error(`Expected ${expected} but received ${actual}`);
    }
  },
});

describe('HRIS 4-Role Business Model & Scope Authorization Tests', () => {
  // Test Actors
  const superadmin: SecurityActor = {
    id: 'user-superadmin',
    email: 'superadmin@nusantara.co.id',
    name: 'Super Admin',
    role: 'SUPERADMIN',
    scopeType: 'PLATFORM_GLOBAL',
    tenantId: 'tenant-elkyno-01',
  };

  const adminPtA: SecurityActor = {
    id: 'user-admin-pt',
    email: 'admin.pt@elkyno.co.id',
    name: 'Admin PT Elkyno',
    role: 'ADMIN_PT',
    scopeType: 'TENANT',
    tenantId: 'tenant-elkyno-01',
  };

  const adminProjectA: SecurityActor = {
    id: 'user-admin-project',
    email: 'admin.proj@elkyno.co.id',
    name: 'Admin Project Jakarta',
    role: 'ADMIN_PROJECT',
    scopeType: 'PROJECT',
    tenantId: 'tenant-elkyno-01',
    projectIds: ['prj-jkt-01'], // Assigned only to Project Jakarta
  };

  const employeeA: SecurityActor = {
    id: 'user-employee-a',
    email: 'farhan@elkyno.co.id',
    name: 'Farhan Maulana',
    role: 'EMPLOYEE',
    scopeType: 'SELF',
    tenantId: 'tenant-elkyno-01',
    employeeId: 'emp-005',
    projectIds: ['prj-jkt-01'],
  };

  // --- 1. SUPERADMIN TESTS ---
  describe('1. SUPERADMIN Scope (Global Platform)', () => {
    test('SUPERADMIN -> Tenant A = ALLOW', () => {
      const res = authorize({
        actor: superadmin,
        action: 'employee.read',
        resource: { type: 'employee', tenantId: 'tenant-elkyno-01' },
      });
      expect(res.allowed).toBe(true);
    });

    test('SUPERADMIN -> Tenant B = ALLOW', () => {
      const res = authorize({
        actor: superadmin,
        action: 'employee.read',
        resource: { type: 'employee', tenantId: 'tenant-holding-02' },
      });
      expect(res.allowed).toBe(true);
    });

    test('SUPERADMIN -> Project A = ALLOW', () => {
      const res = authorize({
        actor: superadmin,
        action: 'project.read',
        resource: { type: 'project', tenantId: 'tenant-elkyno-01', projectId: 'prj-jkt-01' },
      });
      expect(res.allowed).toBe(true);
    });

    test('SUPERADMIN -> Project B = ALLOW', () => {
      const res = authorize({
        actor: superadmin,
        action: 'project.read',
        resource: { type: 'project', tenantId: 'tenant-elkyno-01', projectId: 'prj-sby-02' },
      });
      expect(res.allowed).toBe(true);
    });
  });

  // --- 2. ADMIN_PT TESTS ---
  describe('2. ADMIN_PT Scope (Tenant Scope - All Projects)', () => {
    test('ADMIN_PT A -> Tenant A = ALLOW', () => {
      const res = authorize({
        actor: adminPtA,
        action: 'employee.read',
        resource: { type: 'employee', tenantId: 'tenant-elkyno-01' },
      });
      expect(res.allowed).toBe(true);
    });

    test('ADMIN_PT A -> Tenant B = DENY', () => {
      const res = authorize({
        actor: adminPtA,
        action: 'employee.read',
        resource: { type: 'employee', tenantId: 'tenant-holding-02' },
      });
      expect(res.allowed).toBe(false);
      expect(res.statusCode).toBe(403);
    });

    test('ADMIN_PT A -> Project A = ALLOW', () => {
      const res = authorize({
        actor: adminPtA,
        action: 'project.read',
        resource: { type: 'project', tenantId: 'tenant-elkyno-01', projectId: 'prj-jkt-01' },
      });
      expect(res.allowed).toBe(true);
    });

    test('ADMIN_PT A -> Project B = ALLOW (Automatic PT-wide project access)', () => {
      const res = authorize({
        actor: adminPtA,
        action: 'project.read',
        resource: { type: 'project', tenantId: 'tenant-elkyno-01', projectId: 'prj-sby-02' },
      });
      expect(res.allowed).toBe(true);
    });
  });

  // --- 3. ADMIN_PROJECT TESTS ---
  describe('3. ADMIN_PROJECT Scope (Project Scope - Assigned Projects Only)', () => {
    test('ADMIN_PROJECT A -> Assigned Project A = ALLOW', () => {
      const res = authorize({
        actor: adminProjectA,
        action: 'attendance.read',
        resource: { type: 'attendance', tenantId: 'tenant-elkyno-01', projectId: 'prj-jkt-01' },
      });
      expect(res.allowed).toBe(true);
    });

    test('ADMIN_PROJECT A -> Unassigned Project B = DENY', () => {
      const res = authorize({
        actor: adminProjectA,
        action: 'attendance.read',
        resource: { type: 'attendance', tenantId: 'tenant-elkyno-01', projectId: 'prj-sby-02' },
      });
      expect(res.allowed).toBe(false);
      expect(res.statusCode).toBe(403);
    });

    test('ADMIN_PROJECT A -> Tenant B = DENY', () => {
      const res = authorize({
        actor: adminProjectA,
        action: 'attendance.read',
        resource: { type: 'attendance', tenantId: 'tenant-holding-02', projectId: 'prj-nel-01' },
      });
      expect(res.allowed).toBe(false);
      expect(res.statusCode).toBe(403);
    });

    test('ADMIN_PROJECT A -> Company Payroll = STRICTLY DENIED (403)', () => {
      const res = authorize({
        actor: adminProjectA,
        action: 'payroll.read',
        resource: { type: 'payroll', tenantId: 'tenant-elkyno-01', projectId: 'prj-jkt-01' },
      });
      expect(res.allowed).toBe(false);
      expect(res.statusCode).toBe(403);
    });
  });

  // --- 4. EMPLOYEE TESTS (Self Scope Only) ---
  describe('4. EMPLOYEE Scope (Self-Service ESS)', () => {
    test('Employee A -> Own Data = ALLOW', () => {
      const res = authorize({
        actor: employeeA,
        action: 'employee.read',
        resource: { type: 'employee', tenantId: 'tenant-elkyno-01', employeeId: 'emp-005' },
      });
      expect(res.allowed).toBe(true);
    });

    test('Employee A -> Other Employee B Data = DENY (Anti-IDOR)', () => {
      const res = authorize({
        actor: employeeA,
        action: 'employee.read',
        resource: { type: 'employee', tenantId: 'tenant-elkyno-01', employeeId: 'emp-002' },
      });
      expect(res.allowed).toBe(false);
      expect(res.statusCode).toBe(403);
    });

    test('Employee A -> Own Payslip = ALLOW', () => {
      const res = authorize({
        actor: employeeA,
        action: 'payslip.read',
        resource: { type: 'payroll', tenantId: 'tenant-elkyno-01', employeeId: 'emp-005' },
      });
      expect(res.allowed).toBe(true);
    });

    test('Employee A -> Other Employee B Payslip = DENY', () => {
      const res = authorize({
        actor: employeeA,
        action: 'payslip.read',
        resource: { type: 'payroll', tenantId: 'tenant-elkyno-01', employeeId: 'emp-002' },
      });
      expect(res.allowed).toBe(false);
      expect(res.statusCode).toBe(403);
    });
  });
});
