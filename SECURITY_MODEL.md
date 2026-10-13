# SECURITY_MODEL.md — ELKYNO HRIS Enterprise Security, Authentication & Persistence Architecture

**Domain:** Core Application Security, Multi-Tenant Isolation, RBAC & Defense in Depth  
**Version:** 3.0  
**Date:** 2026-10-03  

---

## 1. Architectural Security Hierarchy

The system enforces a strict seven-stage pipeline from client request to database query:

```
TRUSTED AUTHENTICATED SESSION
             ↓
    TRUSTED USER IDENTITY
             ↓
        DATABASE USER
             ↓
      EXACT SYSTEM ROLE
             ↓
     SERVER-DERIVED SCOPE
             ↓
      GRANULAR PERMISSION
             ↓
      RESOURCE OWNERSHIP
             ↓
     DATABASE PERSISTENCE
```

### Core Principles
1. **The Client is Untrusted:** No client headers (`x-user-role`, `x-tenant-id`, `x-project-id`, `x-user-id`, `x-permission`) or query parameters (`?role=`, `?tenantId=`, `?projectId=`, `?userId=`) can establish authorization.
2. **Fail Secure:** Missing authentication → `401 Unauthorized`. Missing authorization/scope → `403 Forbidden`. Missing required target tenant for global operations → `400 Bad Request`.
3. **No Privileged Fallbacks:** The system never defaults missing sessions to `SUPERADMIN` or any privileged user/tenant.
4. **Environment Isolation:** Demo authentication is strictly prohibited in production (`process.env.NODE_ENV === 'production'` or `AUTH_MODE === 'production'`). Production mode enforces cryptographic session tokens and database user verification.

---

## 2. Canonical Exact 4-Role Model

Runtime authorization exclusively recognizes four canonical roles:

1. **`SUPERADMIN` (Platform Global Scope):**
   - Platform administration across all registered tenants.
   - For tenant-scoped operations, SUPERADMIN **must explicitly specify** a valid target `tenantId`.
   - Never defaults silently to any tenant.

2. **`ADMIN_PT` (Tenant Scope):**
   - Full management of human resources, contracts, compensation, and operational units inside their assigned tenant (`tenantId`).
   - Cross-tenant access is strictly blocked (`403 Forbidden` / Anti-IDOR).

3. **`ADMIN_PROJECT` (Assigned Project Scope):**
   - Operational management strictly confined to projects assigned to them (`projectIds`).
   - **Zero access** to corporate payroll ledgers, company compensation aggregates, or bank credentials.

4. **`EMPLOYEE` (Self Scope Only - ESS):**
   - Self-service operations (attendance clock-in/out, personal leave/overtime submission, personal payslip viewing, personal document uploads).
   - Identity derived from the server session relationship (`actor.employeeId`), preventing IDOR fraud.

---

## 3. Defense Against OWASP Top 10 & Indonesian Statutory Compliance

### A. Anti-IDOR (Insecure Direct Object Reference) Protection
- Every resource query validates object ownership server-side.
- If an employee attempts to query, update, or approve another employee's records (attendance, leave, overtime, loan, reimbursement, payslip, documents), the request is rejected with `403 Forbidden` and a security incident is logged.

### B. Four-Eyes Principle (Anti-Self-Approval)
- Approval operations for attendance corrections, leave requests, overtime, loans, reimbursements, and document verifications prohibit approving one's own submission.
- Payroll locking requires segregation of duties between calculator and locker.

### C. Personal Data Protection (UU PDP No. 27/2022)
- NIK KTP (16-digit) and NPWP are masked (`************0005`, `**.***.***.*-***.***`).
- Sensitive notes and PII are encrypted at rest using AES-256-GCM.
- Bank account details are masked for unauthorized roles.

### D. Payroll Period Immutability
- Payroll periods marked as `LOCKED` or `PAID` cannot be recalculated or mutated.
- Attendance records for dates belonging to locked payroll periods are immutable.

---

## 4. Multi-Tenant Data Isolation

- Every database query for tenant-scoped operations includes `{ where: { tenantId } }`.
- In-memory cache fallbacks strictly enforce `tenantId` filtering and return empty sets if an actor attempts unauthorized access.
- Cross-tenant requests produce an immediate security violation alert in `AuditLog`.
