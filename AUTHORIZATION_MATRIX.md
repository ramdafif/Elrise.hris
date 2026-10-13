# AUTHORIZATION_MATRIX.md — 4-Role Permission & Scope Matrix

**Domain:** Operational Matrix of Privileges  
**Version:** 2.0  
**Date:** 2026-10-02  

---

## 1. Master Authorization Matrix

| Resource / Action | SUPERADMIN | ADMIN_PT | ADMIN_PROJECT | EMPLOYEE |
|---|---|---|---|---|
| **Tenants** | ALL (Global) | Own PT Only | Own PT Context | Own PT Context |
| **Projects (List & Read)** | ALL (Global) | ALL in Own PT | Assigned Projects Only | Own Project Context |
| **Projects (Create/Update)** | ALL (Global) | ALL in Own PT | Prohibited | Prohibited |
| **Project Assignment** | ALL (Global) | ALL in Own PT | Prohibited | Prohibited |
| **Employees (List & Search)** | ALL (Global) | ALL in Own PT | Assigned Projects Only | Prohibited (Self Only) |
| **Employee (Create)** | ALLOW | ALLOW (Own PT) | Prohibited | Prohibited |
| **Employee (Update Personal)** | ALLOW | ALLOW (Own PT) | Prohibited | ALLOW (Self Profile) |
| **Employee (Update Contract/Salary)** | ALLOW | ALLOW (Own PT) | Prohibited | Prohibited |
| **Attendance (View All)** | ALL (Global) | ALL in Own PT | Assigned Projects Only | Prohibited |
| **Attendance (Clock In/Out ESS)** | ALLOW | ALLOW | ALLOW | ALLOW (Self ESS) |
| **Attendance (Approval)** | ALLOW | ALLOW (Own PT) | Assigned Projects Only | Prohibited |
| **Leave & Overtime (View All)** | ALL (Global) | ALL in Own PT | Assigned Projects Only | Prohibited |
| **Leave & Overtime (Submit)** | ALLOW | ALLOW | ALLOW | ALLOW (Self ESS) |
| **Leave & Overtime (Approve)** | ALLOW | ALLOW (Own PT) | Assigned Projects Only | Prohibited |
| **Payroll (Full Calculation/Lock)** | ALL (Global) | ALLOW (Own PT) | **STRICTLY DENIED** | **STRICTLY DENIED** |
| **Payslip (View)** | ALL (Global) | ALL in Own PT | **STRICTLY DENIED** | ALLOW (Self Payslip Only) |
| **Reimbursement (Submit)** | ALLOW | ALLOW | ALLOW | ALLOW (Self ESS) |
| **Reimbursement (Approve)** | ALLOW | ALLOW (Own PT) | Assigned Projects Only | Prohibited |
| **Employee Loans** | ALL (Global) | ALLOW (Own PT) | Prohibited | ALLOW (Self View/Apply) |
| **KPI (Self-Review)** | ALLOW | ALLOW | ALLOW | ALLOW (Self Review) |
| **KPI (Manager/Reviewer Approval)** | ALLOW | ALLOW (Own PT) | Assigned Projects Only | Prohibited |
| **Documents (Download/Upload)** | ALL (Global) | ALL in Own PT | Assigned Projects Only | ALLOW (Self Docs Only) |
| **Tenant Settings & Policies** | ALL (Global) | ALLOW (Own PT) | Prohibited | Prohibited |
| **Platform System Management** | ALL (Global) | Prohibited | Prohibited | Prohibited |
| **Audit Logs** | ALL (Global) | ALL in Own PT | Assigned Projects (Activity) | Prohibited |

---

## 2. Invariant Rules for Developers

1. **Never Bypass `authorize()`:** Every API endpoint handling private or sensitive data MUST invoke `authorize({ actor, action, resource })`.
2. **Never Return Cross-Tenant Records:** If `actor.scopeType !== 'PLATFORM_GLOBAL'`, repository queries MUST include `{ tenantId: actor.tenantId }`.
3. **No Executive Payroll for Project Admins:** Any endpoint serving salary details MUST verify that `actor.role === 'SUPERADMIN'` or `actor.role === 'ADMIN_PT'` or (`actor.role === 'EMPLOYEE' && targetEmployeeId === actor.employeeId`).
