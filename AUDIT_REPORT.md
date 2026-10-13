# AUDIT_REPORT.md — Nusantara HRIS Enterprise 4-Role Architecture Audit

**Author:** Senior SaaS & HRIS Domain Architect, Security & Database Engineer  
**Date:** 2026-10-02  
**Status:** APPROVED FOR REMEDIATION  
**Repository:** Nusantara HRIS Enterprise  

---

## 1. Executive Summary

This audit assesses the current state of Nusantara HRIS Enterprise against the required **Four-Role SaaS Business Model**:
1. **SUPERADMIN** (Platform Owner, Global Platform Scope)
2. **ADMIN_PT** (Tenant/Company Level, Tenant Scope, All Projects within Tenant)
3. **ADMIN_PROJECT** (Project Level, Project Scope, Assigned Projects within Tenant)
4. **EMPLOYEE** (Self-Service ESS, Self Scope Only)

The remediation focuses on simplifying active business roles to these exact four while preserving a robust, granular permission engine and scope model capable of supporting future roles without re-engineering.

---

## 2. Current Architecture & Findings

### 2.1 Current Role Structure (P1 - Excessive Role Surface Area)
- **Previous state:** Codebase contained up to 13 separate roles (`PLATFORM_SUPER_ADMIN`, `PLATFORM_ADMIN`, `PLATFORM_SUPPORT`, `PLATFORM_AUDITOR`, `TENANT_ADMIN`, `HR_ADMIN`, `HR_STAFF`, `PAYROLL_ADMIN`, `FINANCE`, `AUDITOR`, `PROJECT_ADMIN`, `PROJECT_MANAGER`, `EMPLOYEE`).
- **Remediation:** Standardize active business roles to:
  - `SUPERADMIN`
  - `ADMIN_PT`
  - `ADMIN_PROJECT`
  - `EMPLOYEE`
- Maintain aliases (`PLATFORM_SUPER_ADMIN -> SUPERADMIN`, `TENANT_ADMIN -> ADMIN_PT`, `PROJECT_ADMIN -> ADMIN_PROJECT`) for backward compatibility in internal permission mapping so no regression occurs.

### 2.2 Scope vs. Role Model (Target Architecture)
The authorization system strictly decouples **Role** from **Scope**:
```
User
 └── Role (SUPERADMIN | ADMIN_PT | ADMIN_PROJECT | EMPLOYEE)
      └── Scope (PLATFORM_GLOBAL | TENANT | PROJECT | SELF)
           └── Permission (e.g. employee.read, payroll.read)
                └── Resource (TenantId, ProjectId, EmployeeId)
```

| Active Role | Scope Type | Tenant Access | Project Access | Employee Access | Payroll Access |
|---|---|---|---|---|---|
| **SUPERADMIN** | `PLATFORM_GLOBAL` | ALL Tenants / PTs | ALL Projects | ALL Employees | Full Platform Payroll |
| **ADMIN_PT** | `TENANT` | Own PT (e.g. PT ABC) | ALL Projects in PT | ALL Employees in PT | Full Tenant Payroll |
| **ADMIN_PROJECT** | `PROJECT` | Own PT (e.g. PT ABC) | Assigned Projects Only | Employees in Assigned Projects | Project Operational Only (Restricted Salary/Payroll) |
| **EMPLOYEE** | `SELF` | Own PT Context | Assigned Project Context | Self Only (`employeeId === actor.employeeId`) | Own Payslip Only |

### 2.3 Security Vulnerability Audit
1. **Client-Controlled Headers (P0 - Critical):**  
   - Eliminating any residual reliance on client-supplied `x-user-role`, `x-tenant-id`, or query string parameters (`?role=`, `?tenantId=`).
   - Server-authoritative resolution implemented via `resolveServerSession(req)` where session token maps to trusted server actor state.
2. **Hardcoded Tenant Identifiers (P1 - High):**  
   - Removed defaults like `'tenant-nusantara-01'` and `'DEFAULT_TENANT_ID'`.
   - New records derive `tenantId` strictly from the authenticated actor's verified tenant scope.
3. **Cross-Tenant IDOR & Relational Integrity (P0 - Critical):**  
   - Enforce composite verification: An employee must belong to the tenant of the branch, position, department, and project assignment.
   - For `ADMIN_PROJECT`, employee operations are rejected if the employee does not have an active assignment to one of the admin's assigned projects.
4. **Payroll Data Leakage (P0 - Critical):**  
   - `EMPLOYEE` can only view `GET /api/payroll` where `employeeId === actor.employeeId`.
   - `ADMIN_PROJECT` cannot view overall executive salary ledgers or sensitive company compensation.
   - `ADMIN_PT` has full access to all payroll records within their tenant.
   - `SUPERADMIN` has cross-tenant platform payroll oversight.

### 2.4 Database & Persistence Layer (P1 - High)
- Prisma Schema defines `Project`, `EmployeeProjectAssignment`, `Tenant`, `Employee`, etc.
- In-memory repository dual layer ensures high availability in environments without a provisioned local PostgreSQL server, with seamless schema parity and transactional integrity.
- Historical project assignments preserved with `AssignmentStatus` (`ACTIVE`, `COMPLETED`, `TRANSFERRED`, `INACTIVE`), `startDate`, `endDate`, and `isPrimary`.

---

## 3. Risk Assessment & Severity Classification

| Risk Code | Domain | Description | Severity | Remediation Strategy |
|---|---|---|---|---|
| SEC-01 | Auth | Client manipulation of role or tenant | P0 | Centralized `resolveServerSession` + `authorize()` |
| SEC-02 | Auth | IDOR on employee salary or documents | P0 | Strict actor `employeeId` matching for `EMPLOYEE` role |
| SEC-03 | Scope | Project Admin accessing unassigned project | P0 | Server-side array check `actor.projectIds.includes(resource.projectId)` |
| DAT-01 | Model | Disconnected employee project history | P1 | `EmployeeProjectAssignment` audit and backfill |
| DAT-02 | Integrity | Cross-tenant foreign key mismatch | P1 | Application-level invariant check in store & repositories |
| UX-01 | Frontend | Confusion of user active scope | P2 | Visual breadcrumbs: `[Platform] -> [PT ABC] -> [Project Jakarta]` |

---

## 4. Implementation Plan & Affected Files

1. **`lib/types.ts`**:
   - Primary active roles: `SUPERADMIN`, `ADMIN_PT`, `ADMIN_PROJECT`, `EMPLOYEE`.
   - Extensible scope types: `PLATFORM_GLOBAL`, `TENANT`, `PROJECT`, `SELF` (alias `EMPLOYEE`).
2. **`lib/auth/session.ts`**:
   - Streamline `DEMO_USERS` to spotlight the 4 active roles.
   - Map permissions and tabs for the 4 roles.
   - Maintain alias mapping for backward compatibility.
3. **`lib/security/authorization.ts`**:
   - Core `authorize({ actor, action, resource })` updated for `SUPERADMIN`, `ADMIN_PT`, `ADMIN_PROJECT`, `EMPLOYEE`.
4. **`lib/db/repositories/project.repository.ts` & `lib/db/store.ts`**:
   - Direct support for multi-project assignment and tenant scoping.
5. **API Endpoints (`app/api/*`)**:
   - Verify `employees`, `projects`, `attendance`, `leave`, `overtime`, `payroll`, `reimbursement`, `kpi`, `documents`, `audit`.
6. **Frontend (`components/Navbar.tsx`, `components/ProjectsView.tsx`, `app/page.tsx`)**:
   - Update user switcher to clearly demonstrate the 4 distinct roles and their contextual scopes.
7. **Documentation**:
   - Generate all 8 requested architecture documents.
8. **Automated Verification**:
   - Run Node.js security matrix tests verifying ALLOW/DENY boundaries for all 4 roles across tenants and projects.
