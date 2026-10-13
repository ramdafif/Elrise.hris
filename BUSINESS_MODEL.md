# BUSINESS_MODEL.md — Nusantara HRIS Enterprise SaaS Business Hierarchy

**Domain:** SaaS HRIS Platform & Operational Hierarchy  
**Version:** 2.0 (4-Role Model)  
**Date:** 2026-10-02  

---

## 1. Overview

Nusantara HRIS Enterprise is a B2B Multi-Tenant Software-as-a-Service (SaaS) platform built for Indonesian enterprise operations. The platform is owned and maintained by the **Platform Owner** and serves multiple independent legal corporate customers (**Tenants / PT**).

Within each customer organization, operations are structured into **Projects** (operational work units/contracts), which oversee assigned **Employees**.

---

## 2. The 4-Tier Business Hierarchy

```
PLATFORM OWNER (ELKYNO)
       │
       └── SUPERADMIN (Global SaaS Governance & Multi-Tenant Oversight)
             │
             ├── PT ABC Indonesia (Tenant 1 - Legal Boundary)
             │     ├── Admin PT (Company-wide HR & Payroll Authority)
             │     │
             │     ├── Project Jakarta Smart City (Project Operational Unit)
             │     │     ├── Admin Project (Project HR & Staff Operations)
             │     │     └── Employees (ESS Self-Service)
             │     │
             │     └── Project Surabaya Logistics Hub (Project Operational Unit)
             │           ├── Admin Project (Project HR & Staff Operations)
             │           └── Employees (ESS Self-Service)
             │
             └── PT XYZ Solusi (Tenant 2 - Independent Customer Boundary)
                   ├── Admin PT (Company-wide HR & Payroll Authority)
                   │
                   ├── Project Bandung AI Lab
                   │     ├── Admin Project
                   │     └── Employees
                   │
                   └── Project Nusantara Solar Farm
                         ├── Admin Project
                         └── Employees
```

---

## 3. The Four Active Business Roles

| Role | Responsibility Boundary | Conceptual Hierarchy | Target Access Scope |
|---|---|---|---|
| **SUPERADMIN** | Platform Owner Governance | Above Tenant Level | **ALL** Tenants, Projects, Employees, Payroll, Global Logs |
| **ADMIN_PT** | Customer / Company Legal Boundary | Tenant Level | **ALL** Projects, Employees, Payroll, and Config inside own PT |
| **ADMIN_PROJECT** | Project / Work Assignment Unit | Project Level | **Assigned Projects Only** inside own PT (Restricted from company payroll) |
| **EMPLOYEE** | Self-Service Employee (ESS) | Individual Level | **Own Records Only** (Profile, Attendance, Leave, Overtime, Own Payslip) |

---

## 4. Key Business Invariants

1. **Tenant is the Legal Boundary:**  
   PT ABC and PT XYZ are completely isolated legal entities. An Admin PT or Employee from PT ABC can never see or modify records of PT XYZ.
2. **Project is an Operational Boundary, NOT a Tenant:**  
   Projects belong to a Tenant. Projects do not have independent billing, tax identifiers, or corporate isolation; they represent work scopes within a customer's contract.
3. **Employees are Multi-Project Capable:**  
   An employee belongs to a Tenant and may be assigned to one or more Projects over time through `EmployeeProjectAssignment`.
4. **Platform Superadmin is Audited:**  
   Superadmin actions across customer tenants do not silently bypass authorization; cross-tenant views are explicitly tagged and recorded in immutable audit logs.
