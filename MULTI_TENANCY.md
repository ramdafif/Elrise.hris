# MULTI_TENANCY.md — Nusantara HRIS Multi-Tenant Isolation Architecture

**Domain:** Multi-Tenant Database & Application Isolation  
**Version:** 2.0  
**Date:** 2026-10-02  

---

## 1. Multi-Tenant Tenancy Model

Nusantara HRIS Enterprise utilizes a **SaaS Pooled Database with Discriminator Column (`tenantId`) and Application-Enforced Row-Level Isolation**.

All tenant-owned models maintain a mandatory, non-null `tenantId` indexed for partition query efficiency:
- `Tenant` (Master Customer Record)
- `Project`
- `Employee`
- `EmployeeProjectAssignment`
- `Branch`, `Department`, `Position`
- `AttendanceRecord`
- `LeaveRequest`
- `OvertimeRequest`
- `PayrollPeriod`, `PayrollItem`
- `Reimbursement`
- `EmployeeLoan`
- `EmployeeDocument`
- `AuditLog`

---

## 2. Server-Enforced Isolation Rules

1. **Query Scoping:**
   ```typescript
   // Every repository query is scoped by actor.tenantId for non-platform users
   where: {
     tenantId: actor.tenantId,
     ...(actor.scopeType === 'PROJECT' ? { projectId: { in: actor.projectIds } } : {})
   }
   ```
2. **Anti-Leak Prevention:**
   Even if a client provides `?tenantId=tenant-holding-02`, the server ignores the parameter and replaces it with `actor.tenantId` for tenant users.
3. **Cross-Tenant Foreign Key Integrity:**
   The database and application layer enforce that related entities belong to the same tenant. An employee in PT ABC cannot be assigned to a branch, project, or manager in PT XYZ:
   $$\text{Employee.tenantId} \equiv \text{Branch.tenantId} \equiv \text{Project.tenantId}$$
4. **Platform Owner Cross-Tenant Context:**
   When a `SUPERADMIN` manages a specific customer, they enter an auditable target tenant context. Every mutation records both the platform actor's identity and the target customer's tenant ID.
