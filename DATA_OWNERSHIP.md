# DATA_OWNERSHIP.md — Data Ownership & Relational Integrity Specifications

**Domain:** Data Architecture & Integrity Enforcements  
**Version:** 2.0  
**Date:** 2026-10-02  

---

## 1. Ownership Chains

Every entity in the database has an unambiguous, unbroken ownership path back to its legal Tenant:

| Entity | Direct Parent | Ownership Chain | Scoping Keys |
|---|---|---|---|
| `Tenant` | Platform | Platform $\rightarrow$ Tenant | `id` |
| `Project` | Tenant | Platform $\rightarrow$ Tenant $\rightarrow$ Project | `tenantId`, `code` |
| `Employee` | Tenant | Platform $\rightarrow$ Tenant $\rightarrow$ Employee | `tenantId`, `employeeId` |
| `EmployeeProjectAssignment` | Employee & Project | Platform $\rightarrow$ Tenant $\rightarrow$ Project $\leftrightarrow$ Employee | `tenantId`, `projectId`, `employeeId` |
| `AttendanceRecord` | Employee & Project | Platform $\rightarrow$ Tenant $\rightarrow$ Employee $\rightarrow$ Attendance | `tenantId`, `employeeId`, `projectId` |
| `LeaveRequest` | Employee | Platform $\rightarrow$ Tenant $\rightarrow$ Employee $\rightarrow$ Leave | `tenantId`, `employeeId` |
| `OvertimeRequest` | Employee | Platform $\rightarrow$ Tenant $\rightarrow$ Employee $\rightarrow$ Overtime | `tenantId`, `employeeId` |
| `PayrollPeriod` | Tenant | Platform $\rightarrow$ Tenant $\rightarrow$ PayrollPeriod | `tenantId`, `periodKey` |
| `PayrollItem` | PayrollPeriod & Employee | Platform $\rightarrow$ Tenant $\rightarrow$ PayrollPeriod $\rightarrow$ Employee | `tenantId`, `periodId`, `employeeId` |
| `Reimbursement` | Employee | Platform $\rightarrow$ Tenant $\rightarrow$ Employee $\rightarrow$ Reimbursement | `tenantId`, `employeeId` |
| `EmployeeLoan` | Employee | Platform $\rightarrow$ Tenant $\rightarrow$ Employee $\rightarrow$ Loan | `tenantId`, `employeeId` |
| `KpiReview` | Employee | Platform $\rightarrow$ Tenant $\rightarrow$ Employee $\rightarrow$ KPI | `tenantId`, `employeeId` |
| `EmployeeDocument` | Employee | Platform $\rightarrow$ Tenant $\rightarrow$ Employee $\rightarrow$ Document | `tenantId`, `employeeId` |
| `AuditLog` | Tenant | Platform $\rightarrow$ Tenant $\rightarrow$ AuditLog | `tenantId`, `actorId` |

---

## 2. Invariant Rules Against Relational Mismatches

1. **Foreign Key Tenant Consistency:**
   An employee cannot reference a `branchId`, `departmentId`, or `positionId` belonging to a different tenant.
2. **Project Assignment Integrity:**
   An `EmployeeProjectAssignment` must reference a `Project` and an `Employee` having identical `tenantId` values:
   $$\text{assignment.tenantId} == \text{assignment.employee.tenantId} == \text{assignment.project.tenantId}$$
3. **Immutable Audit Logs:**
   The `AuditLog` entity is strictly append-only. No `UPDATE` or `DELETE` operations are supported or permitted by repository methods or API routes.
