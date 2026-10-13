# PROJECT_MODEL.md — Project & Operational Scope Architecture

**Domain:** Operational Work Units & Employee Assignments  
**Version:** 2.0  
**Date:** 2026-10-02  

---

## 1. Project Entity Specification

A **Project** represents an operational contract, client site, or work assignment unit inside a Tenant.

```prisma
model Project {
  id          String                      @id @default(uuid())
  tenantId    String
  tenant      Tenant                      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  code        String                      // e.g. PRJ-JKT-01
  name        String                      // e.g. Project Jakarta Smart City
  description String?
  status      ProjectStatus               @default(ACTIVE)
  startDate   DateTime                    @db.Date
  endDate     DateTime?                   @db.Date
  location    String?
  managerId   String?
  budget      Decimal?                    @db.Decimal(15, 2)
  assignments EmployeeProjectAssignment[]
  createdAt   DateTime                    @default(now())
  updatedAt   DateTime                    @updatedAt

  @@unique([tenantId, code])
  @@index([tenantId, status])
}
```

### Invariants:
1. `Project.tenantId` is immutable and refers to exactly one Tenant.
2. Projects do not become independent tenants.
3. Code must be unique within a tenant (`@@unique([tenantId, code])`).

---

## 2. EmployeeProjectAssignment Entity Specification

Employees do not have a flat, single `projectId` column on the `Employee` model. Real-world enterprise staff work across multiple projects, transition between contracts, and maintain historical assignments.

```prisma
model EmployeeProjectAssignment {
  id         String           @id @default(uuid())
  tenantId   String
  tenant     Tenant           @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  employeeId String
  employee   Employee         @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  projectId  String
  project    Project          @relation(fields: [projectId], references: [id], onDelete: Cascade)
  role       String           @default("MEMBER") // PROJECT_ADMIN, LEAD, MEMBER, ENGINEER
  startDate  DateTime         @db.Date
  endDate    DateTime?        @db.Date
  status     AssignmentStatus @default(ACTIVE) // ACTIVE, COMPLETED, TRANSFERRED, INACTIVE
  isPrimary  Boolean          @default(false)
  createdAt  DateTime         @default(now())
  updatedAt  DateTime         @updatedAt

  @@index([tenantId, projectId])
  @@index([tenantId, employeeId])
  @@index([employeeId, status])
}
```

---

## 3. Assignment Lifecycles & Preservation of History

1. **Active Assignment:** An employee has an active assignment with `status: 'ACTIVE'`. One assignment is marked `isPrimary: true`.
2. **Transfer / Completion:** When an employee transitions from Project Jakarta to Project Surabaya:
   - The Jakarta assignment is updated: `status: 'TRANSFERRED'`, `endDate: '2026-03-31'`.
   - A new assignment for Surabaya is inserted: `status: 'ACTIVE'`, `startDate: '2026-04-01'`, `isPrimary: true`.
   - Historical timesheets, attendance logs, and overtime requests linked to Project Jakarta remain intact.
3. **Multi-Project Work:** An employee can be simultaneously assigned to a primary project (e.g. 80% allocation) and a secondary project (20% allocation).
