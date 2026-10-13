# MIGRATION_PLAN.md — 4-Role Architecture & Project Schema Migration Plan

**Domain:** Database Schema Migration, Backward Compatibility & Data Backfill  
**Version:** 2.0  
**Date:** 2026-10-02  

---

## 1. Migration Protocol (20 Golden Rules of Engineering)

In accordance with Rule 3, Rule 13, and Rule 19:
- DDL modifications must never drop active production tables or columns.
- The 4-stage migration pattern is enforced:
  1. **Add new structure** (Additive schema changes)
  2. **Migrate data & backfill**
  3. **Switch application logic**
  4. **Deprecate old structures safely**

---

## 2. Step-by-Step Execution Plan

### Step 1: Inspect Current Schema & Seed State
- `Tenant` model verified with primary tenant `tenant-elkyno-01` (PT Elkyno Technology Tbk) and secondary tenant `tenant-holding-02`.
- `Project` model verified with unique constraint `@@unique([tenantId, code])`.
- `EmployeeProjectAssignment` model verified with composite indexes for fast lookups.

### Step 2: Employee Assignment Backfill Strategy
When migrating existing employee records:
1. Never assign employees to random projects.
2. For unassigned employees, assign to their location/branch corresponding primary project (e.g. Jakarta employees to `PRJ-JKT-01`, Surabaya employees to `PRJ-SBY-02`).
3. Set `isPrimary: true`, `status: 'ACTIVE'`, `startDate: employee.joinDate`.

### Step 3: Role Consolidation & Mapping
- Existing user records with deprecated granular roles are mapped dynamically:
  - `PLATFORM_SUPER_ADMIN` $\rightarrow$ `SUPERADMIN`
  - `TENANT_ADMIN`, `HR_ADMIN`, `PAYROLL_ADMIN`, `FINANCE` $\rightarrow$ `ADMIN_PT`
  - `PROJECT_ADMIN`, `PROJECT_MANAGER` $\rightarrow$ `ADMIN_PROJECT`
  - `EMPLOYEE` $\rightarrow$ `EMPLOYEE`
- Permission resolution maintains the granular permission engine under the hood, guaranteeing seamless forward and backward compatibility.

### Step 4: Verification & Smoke Testing
- Run test scripts checking that:
  - Existing payroll records remain linked to `tenant-elkyno-01`.
  - Employees retain attendance histories.
  - Project managers view only their assigned projects.
