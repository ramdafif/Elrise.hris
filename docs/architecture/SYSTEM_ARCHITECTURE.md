# SYSTEM ARCHITECTURE — NUSANTARA HRIS ENTERPRISE

Dokumen ini mendefinisikan dekomposisi sistem, alur pemrosesan data, pola integrasi antarmodul, dan model eksekusi dalam platform Nusantara HRIS.

---

## 1. Layered Architecture Paradigm

Sistem dipecah ke dalam empat lapisan logis yang memiliki batasan tanggung jawab yang jelas (*Separation of Concerns*):

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. PRESENTATION LAYER (React 19 / Tailwind CSS)             │
│    - Dashboard View, Employee Master, Attendance Tracker    │
│    - Responsive Mobile Cards, Bottom-Sheet Dialogs          │
│    - Client-side State Transitions & UI Interactivity       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. APPLICATION ORCHESTRATION LAYER (Next.js App Router)     │
│    - Route Handlers (/app/api/*) & Server Actions           │
│    - Session Authentication & Role Authorization (RBAC)     │
│    - Request DTO Validation & Input Sanitization            │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. DOMAIN SERVICE & CALCULATION ENGINE                      │
│    - PPh 21 TER Engine (PP 58/2023 & PMK 168/2023)          │
│    - BPJS Calculation Engine (Kesehatan & 5 Jaminan TK)     │
│    - Overtime Rule Engine (PP 35/2021 Multipliers)          │
│    - Leave Quota & Attendance Aggregator                    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. INFRASTRUCTURE & PERSISTENCE LAYER                       │
│    - Prisma ORM with Tenant Filter Injection                │
│    - PostgreSQL Database (Tables, Foreign Keys, Indexes)    │
│    - External Notification & File Export Services           │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Pola Komunikasi Antarmodul

- **In-Process Service Calls**: Komunikasi antardomain dilakukan melalui fungsi layanan bertipe data kuat (*type-safe service interfaces*). Modul Penggajian tidak menyentuh tabel presensi secara acak, melainkan memanggil metode `AttendanceService.getMonthlySummary(employeeId, period)` yang mengembalikan nilai terverifikasi.
- **Domain Events Ready**: Sistem menyiapkan antarmuka *Domain Event Listener* (misalnya `EmployeeCreated`, `LeaveApproved`, `PayrollLocked`). Di masa depan, listener ini dapat dipindahkan ke bus pesan eksternal (Redis/Kafka) tanpa mengubah logika bisnis inti.

---

## 3. Alur Eksekusi Penggajian (The Core Payroll Flow)

Proses penggajian bulanan merupakan alur bisnis paling kritis dalam sistem:

```text
[HR Admin / Scheduler]
         │
         ▼
 1. Trigger Period Initiation (Status: DRAFT)
         │
         ▼
 2. Aggregate Verified Attendance & Approved Overtime (PP 35/2021)
         │
         ▼
 3. Compute Gross Earnings (Basic Salary + Fixed/Variable Allowances + Overtime Pay)
         │
         ▼
 4. Execute BPJS Engine:
    ├─ Hitung BPJS Kesehatan (Pekerja 1%, Perusahaan 4%, Plafon 12 Juta)
    └─ Hitung BPJS TK (JHT 2%/3.7%, JP 1%/2% Plafon 10.04 Juta, JKK, JKM)
         │
         ▼
 5. Execute PPh 21 TER Engine (PP 58/2023):
    ├─ Deteksi Kategori TER berdasarkan Status PTKP (A, B, atau C)
    ├─ Cocokkan Bruto Bulanan dengan Bracket Tarif Efektif
    └─ Hitung Pajak Terutang = Bruto x Tarif TER
         │
         ▼
 6. Calculate Net Salary (Take-Home Pay):
    Net Pay = Gross Pay - (BPJS Pekerja + PPh 21 TER + Potongan Lain)
         │
         ▼
 7. Save Immutable Calculation Snapshot (Status: REVIEW)
         │
         ▼
 8. HR & Finance Verification & Approval
         │
         ▼
 9. LOCK Period (Status: LOCKED) ──> Snapshot Menjadi Permanen
         │
         ├─────────────────────────────────────────┐
         ▼                                         ▼
10. Generate Bank Transfer Batch         11. Publish Digital Payslips
    (BCA Payroll / Mandiri MCM)             to Employee ESS Portal
```
