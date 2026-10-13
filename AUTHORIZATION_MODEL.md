# AUTHORIZATION_MODEL.md — Nusantara HRIS Centralized Authorization Engine

**Domain:** Multi-Tenant Role-Based & Scope-Based Access Control (RBAC & SBAC)  
**Version:** 2.0 (4-Role Model)  
**Date:** 2026-10-02  

---

## 1. Core Principle: Role ≠ Scope

In Nusantara HRIS Enterprise, authorization does NOT treat a role as a fixed set of records. Authorization follows the 5-stage pipeline:

```
USER (Authenticated Actor)
  └── ROLE (SUPERADMIN | ADMIN_PT | ADMIN_PROJECT | EMPLOYEE)
        └── SCOPE (PLATFORM_GLOBAL | TENANT | PROJECT | SELF)
              └── PERMISSION (e.g. employee.read, attendance.approve, payroll.read)
                    └── RESOURCE (Target TenantId, ProjectId, EmployeeId)
```

---

## 2. Active Role & Scope Specifications

### 2.1 SUPERADMIN
- **Scope Type:** `PLATFORM_GLOBAL`
- **Rule:** May access any tenant, project, or employee. Cross-tenant access is explicitly logged with `actorScope: 'PLATFORM'` and `targetTenantId`.
- **Implementation:** Evaluated with explicit platform scope handling in `authorize()`, never an arbitrary boolean bypass.

### 2.2 ADMIN_PT
- **Scope Type:** `TENANT`
- **Rule:** Automatically authorized for ALL projects, employees, payroll, and configuration records where `resource.tenantId === actor.tenantId`.
- **Project Inheritance:** Does NOT require manual assignment to individual projects; newly created projects within the PT are immediately accessible.
- **Cross-Tenant Constraint:** Strict DENY if `resource.tenantId !== actor.tenantId`.

### 2.3 ADMIN_PROJECT
- **Scope Type:** `PROJECT`
- **Rule:** Authorized ONLY for records within `actor.tenantId` AND matching `actor.projectIds`.
- **Multiple Projects:** Supports assignment to multiple projects (`['prj-jkt-01', 'prj-bdg-03']`). If a resource belongs to `prj-sby-02`, access is DENIED (403).
- **Sensitive Payroll Restriction:** Strictly prohibited from company-wide payroll calculations, executive salaries, and banking ledgers.

### 2.4 EMPLOYEE
- **Scope Type:** `SELF` (or `EMPLOYEE`)
- **Rule:** Self-service operations only. The server strictly enforces:
  `resource.employeeId === actor.employeeId`
- Any attempt to query or mutate another employee's records (e.g. `GET /api/payroll/emp-002` while logged in as `emp-005`) yields `403 Forbidden` (Anti-IDOR).

---

## 3. The `authorize()` Engine Interface

Every API handler evaluates authorization using the unified server-authoritative method:

```typescript
const result = authorize({
  actor,       // Derived from verified session (resolveServerSession)
  action,      // e.g. 'employee.read', 'payroll.lock', 'attendance.approve'
  resource: {
    type: 'employee',
    tenantId: actor.tenantId,
    projectId: targetProjectId,
    employeeId: targetEmployeeId
  }
});

if (!result.allowed) {
  return NextResponse.json({ error: result.reason }, { status: result.statusCode || 403 });
}
```

---

## 4. Zero Trust in Client-Supplied Authorization

The server completely rejects:
- `x-user-role`
- `x-tenant-id` (unless validated under platform superadmin context)
- `searchParams.get("role")`
- `body.role` or `body.tenantId` for permission checks

Identity is derived solely from server sessions, signed tokens, or verified database credentials.
