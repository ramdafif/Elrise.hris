# STRUKTUR FOLDER & PANDUAN PENGEMBANGAN SISTEM
## Nusantara HRIS & Payroll Enterprise (PT Elkyno Technology)

Dokumen ini menyajikan pemetaan lengkap seluruh direktori dan file dalam repositori, fungsi masing-masing berkas, serta **Panduan Cepat Lokasi Modifikasi** (*Where to Change What*) untuk mempermudah pemeliharaan dan penambahan fitur.

---

## DAFTAR ISI
1. [Peta Hirarki Direktori](#1-peta-hirarki-direktori)
2. [Penjelasan Lengkap Setiap File & Fungsinya](#2-penjelasan-lengkap-setiap-file--fungsinya)
   - [Berkas Konfigurasi Root](#21-berkas-konfigurasi-root)
   - [Aplikasi & Halaman Utama (`app/`)](#22-aplikasi--halaman-utama-app)
   - [Endpoint API Backend (`app/api/`)](#23-endpoint-api-backend-appapi)
   - [Komponen Antarmuka / UI (`components/`)](#24-komponen-antarmuka--ui-components)
   - [Konfigurasi & Regulasi (`config/`)](#25-konfigurasi--regulasi-config)
   - [Core Logic, Payroll Engine & Keamanan (`lib/`)](#26-core-logic-payroll-engine--keamanan-lib)
   - [Custom Hooks & Pola Akses Data (`lib/hooks/`)](#27-custom-hooks--pola-akses-data-libhooks)
   - [Database Schema & Repositories (`prisma/` & `lib/db/repositories/`)](#28-database-schema--repositories-prisma--libdbrepositories)
   - [Pengujian Keamanan (`tests/`)](#29-pengujian-keamanan-tests)
   - [Dokumentasi Teknis (`docs/`)](#210-dokumentasi-teknis-docs)
3. [Panduan Cepat: Mengubah Bagian A Ada di File Mana?](#3-panduan-cepat-mengubah-bagian-a-ada-di-file-mana)
   - [Identitas Perusahaan, Branding & Footer](#31-identitas-perusahaan-branding--footer)
   - [Tampilan Antarmuka (UI / Halaman)](#32-tampilan-antarmuka-ui--halaman)
   - [Logika Bisnis Finansial & Payroll](#33-logika-bisnis-finansial--payroll)
   - [Presensi, Cuti & Lembur](#34-presensi-cuti--lembur)
   - [Hak Akses, Role & Keamanan (RBAC & IDOR)](#35-hak-akses-role--keamanan-rbac--idor)
   - [Data Awal / Dummy Karyawan & Master Data](#36-data-awal--dummy-karyawan--master-data)
   - [Database & Skema Relasional](#37-database--skema-relasional)
   - [Endpoint Backend & Routing](#38-endpoint-backend--routing)

---

## 1. PETA HIRARKI DIREKTORI

```text
├── AGENTS.md                   # 20 Aturan Fundamental & Governance AI/Developer
├── CHANGELOG.md                # Riwayat perubahan dan rilis sistem
├── PROJECT_STATUS.md           # Status modul, checklist fitur, dan arsitektur
├── README.md                   # Dokumentasi umum, instalasi, dan panduan proyek
├── TECHNICAL_DEBT.md           # Catatan utang teknis dan rencana refactoring
├── StrukturFolder.md           # (File Ini) Dokumentasi struktur file & panduan perubahan
├── package.json                # Manifest dependensi npm dan skrip build
├── bun.lock                    # Lockfile dependensi package manager Bun
├── next.config.ts              # Konfigurasi Next.js, HTTP Security Headers, & CSP
├── next-env.d.ts               # Deklarasi tipe bawaan Next.js
├── tsconfig.json               # Konfigurasi TypeScript compiler (strict mode)
├── postcss.config.mjs          # Konfigurasi PostCSS untuk Tailwind CSS v4
├── eslint.config.mjs           # Konfigurasi ESLint flat-config
├── .eslintrc.json              # Konfigurasi aturan linting legacy/ekstensi Next.js
├── metadata.json               # Metadata platform AI Studio
├── .env.example                # Template variabel lingkungan sistem
├── .gitignore                  # Berkas yang diabaikan oleh Git
│
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root Layout, HTML shell, & fetch-protection shim
│   ├── globals.css             # Konfigurasi CSS Tailwind & styling global
│   ├── page.tsx                # Halaman utama aplikasi, state orchestrator, & dynamic imports
│   ├── error.tsx               # Error boundary penanganan kegagalan runtime App Router
│   ├── not-found.tsx           # Halaman 404 penanganan rute tidak ditemukan App Router
│   └── api/                    # Endpoint REST API Backend
│       ├── data/route.ts       # Endpoint data referensi statis terpusat (Fase 2)
│       ├── employees/route.ts  # CRUD pegawai, cursor pagination, RBAC & PII masking
│       ├── attendance/route.ts # Presensi check-in/out, koreksi jam & audit log
│       ├── leave/route.ts      # Pengajuan & persetujuan cuti (Anti-Self-Approval)
│       ├── overtime/route.ts   # Pengajuan & persetujuan lembur (PP 35/2021)
│       ├── payroll/route.ts    # Kalkulasi batch gaji & penguncian periode
│       ├── reimbursement/route.ts # Pengajuan klaim & approval 1-tier manager
│       ├── loan/route.ts       # Pinjaman karyawan & pemotongan payroll
│       ├── loans/route.ts      # Rute alias kompatibilitas ke loan/route.ts
│       ├── employee-loans/route.ts # Rute alias kompatibilitas ke loan/route.ts
│       ├── documents/route.ts  # CRUD dokumen digital & filtering PII UU PDP
│       ├── kpi/route.ts        # Siklus evaluasi KPI (self, manager, HR)
│       ├── kpi-reviews/route.ts # Rute alias kompatibilitas ke kpi/route.ts
│       ├── audit/route.ts      # Jejak audit immutable & filter modul
│       ├── audit-logs/route.ts # Rute alias kompatibilitas ke audit/route.ts
│       ├── regulations/route.ts# Konfigurasi tarif pajak TER & BPJS dinamis
│       ├── health/route.ts     # Health-check liveness probe untuk container
│       ├── health/ready/route.ts # Readiness probe kesiapan database
│       └── security/           # Endpoint audit & pengujian keamanan
│           ├── overview/route.ts # Ringkasan postur keamanan & insiden
│           └── test/route.ts     # Penetrasi simulasi RBAC/IDOR otomatis
│
├── components/                 # Komponen Antarmuka Pengguna (React Client Components)
│   ├── Navbar.tsx              # Navigasi atas, Role Switcher, & indikator sesi
│   ├── DashboardView.tsx       # Tampilan ringkasan metrik, KPI, & kalender
│   ├── EmployeesView.tsx       # Re-export wrapper kompatibilitas ke components/employees/
│   ├── employees/              # Dekomposisi modular modul data pegawai (Fase 3)
│   │   ├── index.tsx           # Assembling UI EmployeesView & integrasi useEmployees
│   │   ├── EmployeeFilters.tsx # Bilah pencarian & filter departemen, cabang, status
│   │   ├── EmployeeListTable.tsx # Tabel desktop & kartu mobile daftar pegawai
│   │   ├── EmployeeFormModal.tsx # Modal form tambah pegawai, edit gaji, & kontak ESS
│   │   └── EmployeeDetailPanel.tsx # Panel detail profil, dokumen, & pinjaman
│   ├── AttendanceView.tsx      # Antarmuka presensi (WFO/WFH/Klien), koreksi, & rekap
│   ├── LeaveOvertimeView.tsx   # Portal cuti & lembur, kalkulator jam, verifikasi atasan
│   ├── PayrollView.tsx         # Slip gaji, kalkulator THR, PPh 21 TER, & penguncian
│   ├── EmployeeDocumentsSection.tsx # Vault arsip dokumen digital karyawan & kepatuhan UU PDP
│   ├── ReimbursementSection.tsx # Pengajuan & approval klaim biaya operasional/medis
│   ├── EmployeeLoanSection.tsx # Pengajuan pinjaman, jadwal cicilan, & pelunasan
│   ├── KpiReviewView.tsx       # Evaluasi kinerja berkala pegawai (self, manager, HR)
│   ├── TaxRegulationView.tsx   # Modul referensi regulasi (PP 58/2023, BPJS, PTKP)
│   ├── AuditLogView.tsx        # Jejak audit aktivitas immutable & kepatuhan
│   ├── SecurityCenterView.tsx  # Pusat pemantauan UU PDP, enkripsi, & postur siber
│   └── ViewSkeleton.tsx        # Skeleton loading seragam untuk code-splitting next/dynamic (Fase 4)
│
├── config/                     # Konfigurasi Sistem & Regulasi Statis
│   ├── governmentRegulations.ts# Master tarif pajak TER, BPJS, lembur, & PTKP
│   ├── featureFlags.ts         # Toggle fitur (MFA, Multi-tenant, Strict mode)
│   ├── systemConfig.ts         # Batasan sistem, timeout, format mata uang/tanggal
│   └── index.ts                # Barrel export konfigurasi terpusat
│
├── hooks/                      # Root Custom Hooks (Kompatibilitas Alias)
│   ├── use-mobile.ts           # Deteksi ukuran viewport layar ponsel responsif
│   └── useEmployees.ts         # Re-export hook pegawai ke lib/hooks/useEmployees.ts
│
├── lib/                        # Pustaka Logika Bisnis & Utilitas Sistem
│   ├── types.ts                # Deklarasi tipe TypeScript domain bisnis & DTO
│   ├── utils.ts                # Helper fungsi umum & penggabung class Tailwind (cn)
│   ├── format.ts               # Pemformatan mata uang Rupiah, tanggal, & persentase
│   ├── auth/
│   │   └── session.ts          # Session manager, role permissions, & allowed tabs
│   ├── data/
│   │   └── reference-data.ts   # Master data referensi statis untuk endpoint /api/data (Fase 2)
│   ├── db/                     # Lapisan Akses Database & Persistence Engine
│   │   ├── prisma.ts           # Inisialisasi PrismaClient singleton aktif
│   │   ├── pagination.ts       # Utility cursor-based pagination helper & metadata
│   │   ├── repository.ts       # Interface kontrak dasar BaseRepository
│   │   ├── store.ts            # Lapisan wrapper/facade kompatibilitas ke repositories
│   │   ├── seed-data.ts        # Data awal sintetis komprehensif profil perusahaan & histori
│   │   └── repositories/       # Repository Pattern aktif berbasis Prisma Client (Fase 1)
│   │       ├── index.ts        # Barrel export seluruh instance repositori
│   │       ├── employee.repository.ts   # Operasi database model Employee & sanitasi
│   │       ├── attendance.repository.ts # Operasi database presensi & koreksi
│   │       ├── leave.repository.ts      # Operasi database pengajuan cuti
│   │       ├── overtime.repository.ts   # Operasi database SPKL lembur
│   │       ├── payroll.repository.ts    # Operasi database payroll period & items
│   │       ├── organization.repository.ts # Operasi database Company, Branch, Department
│   │       └── audit.repository.ts      # Operasi database append-only AuditLog
│   ├── hooks/                  # Custom Data Fetching Hooks Terstandarisasi (Fase 3)
│   │   └── useEmployees.ts     # Custom hook data pegawai: paginasi cursor, filter, & CRUD aman
│   ├── leave/
│   │   └── balance.ts          # Mesin kalkulasi saldo cuti & deteksi collision jadwal
│   ├── payroll/                # Mesin Komputasi Finansial Ketenagakerjaan
│   │   ├── tax.ts              # Kalkulator PPh 21 TER (PP 58/2023 & PMK 168/2023)
│   │   ├── bpjs.ts             # Kalkulator BPJS Kesehatan & Ketenagakerjaan
│   │   ├── overtime.ts         # Kalkulator upah lembur resmi PP 35/2021
│   │   ├── thr.ts              # Kalkulator THR Keagamaan (Permenaker 6/2016)
│   │   └── engine.ts           # Mesin utama orkestrasi penggajian & take-home pay
│   └── security/               # Arsitektur Keamanan & Kepatuhan UU PDP
│       ├── authorization.ts    # RBAC matrix, permission check, & anti-self-approval
│       ├── audit.ts            # Audit log recorder immutable
│       ├── classification.ts   # Klasifikasi data privasi (UU PDP No. 27/2022)
│       ├── crypto.ts           # Enkripsi simetris data sensitif (AES-256-GCM)
│       ├── mfa.ts              # Manajemen autentikasi ganda Multi-Factor Authentication
│       ├── payrollGuard.ts     # Proteksi anti-modifikasi payroll terkunci
│       ├── rateLimiter.ts      # Pencegahan brute-force API
│       ├── tenant.ts           # Isolasi multi-tenant data boundary
│       └── validation.ts       # Validator input payload & sanitasi
│
├── prisma/                     # Konfigurasi Database Relasional Prisma ORM
│   ├── schema.prisma           # Skema relational database PostgreSQL aktif (Fase 1)
│   └── seed.ts                 # Skrip resmi seeding data awal ke database via Prisma
│
├── scripts/                    # Skrip Operasional & Infrastruktur
│   └── ensure-db.sh            # Skrip otomatisasi inisialisasi & verifikasi database
│
├── tests/                      # Suite Pengujian Otomatis
│   └── security/
│       └── run-security-tests.ts # Otomasi pengujian RBAC, IDOR, & kebocoran data
│
└── docs/                       # Dokumentasi Standar Enterprise
    ├── architecture/           # 10 Dokumen arsitektur sistem, database, caching, dll.
    ├── business/               # 9 Dokumen domain bisnis HR, payroll, pajak, cuti, dll.
    ├── compliance/             # 5 Dokumen kepatuhan regulasi UU PDP, BPJS, pajak, dll.
    ├── decisions/ADR/          # 10 Dokumen Architecture Decision Records (ADR)
    ├── engineering/            # 10 Dokumen standar koding, API conventions, testing, dll.
    ├── operations/             # 5 Dokumen deployment, backup, monitoring, incident, dll.
    ├── product/                # 5 Dokumen visi produk, roadmap, prinsip, dan mission.
    └── security/               # 10 Dokumen arsitektur keamanan, otentikasi, enkripsi, dll.
```

---

## 2. PENJELASAN LENGKAP SETIAP FILE & FUNGSINYA

### 2.1. Berkas Konfigurasi Root

| Nama File | Deskripsi & Tanggung Jawab Utama |
| :--- | :--- |
| **`package.json`** | Menyimpan daftar dependensi npm (Next.js 15, React 19, Tailwind CSS v4, Lucide React, `@prisma/client`, Zod, dll.) serta perintah skrip (`dev`, `build`, `start`, `lint`, `db:push`, `db:seed`, `db:generate`). |
| **`bun.lock`** | Berkas lockfile dependensi package manager Bun untuk memastikan determinisme versi paket yang diinstal. |
| **`next.config.ts`** | Mengatur perilaku kompilasi Next.js, HTTP Security Headers (`Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`), pembatasan domain gambar, dan kompresi aset. |
| **`next-env.d.ts`** | Deklarasi tipe bawaan Next.js untuk integrasi compiler TypeScript. |
| **`tsconfig.json`** | Mengonfigurasi compiler TypeScript dengan pengaturan `strict: true`, target `ES2022`, dan path alias `@/*` yang merujuk ke root repositori. |
| **`postcss.config.mjs`** | Mengaktifkan plugin `@tailwindcss/postcss` untuk pemrosesan utilitas Tailwind CSS generasi ke-4. |
| **`eslint.config.mjs` / `.eslintrc.json`** | Konfigurasi linter ESLint untuk menjaga konsistensi sintaksis TypeScript, aturan penamaan, dan pencegahan potensi bug kode. |
| **`AGENTS.md`** | Dokumen tata kelola berisi **20 Golden Rules of Engineering** yang wajib dipatuhi oleh developer dan agen AI (larangan floating point untuk uang, larangan hardcode regulasi, proteksi audit trail, pencegahan IDOR, dll.). |
| **`PROJECT_STATUS.md`** | Laporan status komprehensif kesiapan fitur, modul stabil, status migrasi arsitektur fase 1–4, dan catatan build. |
| **`TECHNICAL_DEBT.md`** | Registri utang teknis yang mencatat kompromi sistemik, prioritas penyelesaian, dan status refactoring berkelanjutan. |
| **`README.md`** | Dokumentasi panduan umum aplikasi, fitur unggulan kepatuhan Indonesia, dan instruksi menjalankan sistem di lingkungan lokal maupun Cloud. |
| **`CHANGELOG.md`** | Catatan kronologis riwayat rilis sistem, penambahan fitur keamanan, dan perbaikan bug. |
| **`StrukturFolder.md`** | Berkas dokumentasi peta direktori lengkap dan panduan navigasi modifikasi sistem (*Where to Change What*). |
| **`.env.example`** | Template variabel lingkungan sistem (DATABASE_URL, AUTH_SECRET, ENCRYPTION_KEY, GEMINI_API_KEY) tanpa membocorkan nilai rahasia (secrets). |
| **`.gitignore`** | Berkas daftar pola file dan direktori yang diabaikan oleh Git (`node_modules/`, `.next/`, `.env*`, dll.). |
| **`metadata.json`** | Konfigurasi platform AI Studio untuk nama aplikasi, deskripsi ringkas, hak izin container (geolocation), dan major capabilities server-side. |
| **`scripts/ensure-db.sh`** | Skrip utilitas shell untuk memverifikasi kesiapan database dan menjalankan `prisma db push` serta `prisma generate` saat inisialisasi lingkungan. |

---

### 2.2. Aplikasi & Halaman Utama (`app/`)

| Nama File | Deskripsi & Tanggung Jawab Utama |
| :--- | :--- |
| **`app/layout.tsx`** | Layout akar aplikasi Next.js (App Router). Mengatur tag `<html>`, `<head>`, `<body>`, menyuntikkan font Inter, metadata OpenGraph, serta **script shim proteksi `window.fetch`** agar aman di berbagai lingkungan browser dan iframe container. |
| **`app/globals.css`** | Titik masuk CSS global. Mengimpor `@import "tailwindcss";`, mengatur reset baseline browser, serta styling custom scrollbar responsif. |
| **`app/page.tsx`** | **Komponen Utama Aplikasi (Single-Page State Orchestrator & Lazy Loader)**. Mengelola state sesi pengguna (`currentSession`), navigasi tab aktif (`activeTab`), pemanggilan data referensi statis (`fetchData`), penanganan notifikasi toast, rendering Navbar, perutean tab bersyarat RBAC, dan Footer aplikasi. **Diperbarui di Fase 4**: Mengimpor seluruh komponen tampilan secara dinamis (`next/dynamic`) dengan fallback skeleton loading seragam (`ViewSkeleton.tsx`) dan pembatasan unduhan modul berbasis `isTabAllowed()`. |
| **`app/error.tsx`** | Error boundary penanganan kegagalan runtime tidak terduga pada Next.js App Router dengan opsi coba lagi (*retry*). |
| **`app/not-found.tsx`** | Halaman ramah pengguna penanganan rute tidak ditemukan (HTTP 404) dengan navigasi kembali ke dashboard utama. |

---

### 2.3. Endpoint API Backend (`app/api/`)

| Nama File | Method | Deskripsi & Tanggung Jawab Utama |
| :--- | :--- | :--- |
| **`app/api/data/route.ts`** | `GET, OPTIONS` | **Penyedia Data Referensi Statis Ter-Sanitasi (Fase 2)**. Mengembalikan data organisasi, cabang, departemen, posisi, jenis cuti, komponen gaji, dan regulasi pemerintah sesuai sesi. Tidak lagi mengembalikan data transaksional massal. |
| **`app/api/employees/route.ts`** | `GET, POST, PUT, DELETE` | Mengelola data karyawan. Mendukung paginasi cursor (`?cursor=&limit=`), filtering server-side, pencegahan eskalasi hak akses (*privilege escalation*), masking NIK/NPWP/rekening/kompensasi untuk non-admin, dan pencatatan audit log mutasi. |
| **`app/api/attendance/route.ts`** | `GET, POST` | Mengelola absensi harian (check-in / check-out) berbasis label lokasi self-declared (WFO/WFH/CLIENT_SITE) dan jam kerja dinamis per cabang, workflow pengajuan koreksi kehadiran oleh staf, verifikasi koreksi oleh atasan langsung/HR, dan paginasi cursor. |
| **`app/api/leave/route.ts`** | `GET, POST` | Mengelola pengajuan cuti tahunan, sakit, dan melahirkan. Menerapkan kalkulasi saldo kuota dinamis (`lib/leave/balance.ts`), validasi bentrok tanggal jadwal cuti, approval satu tingkat berbasis hierarki atasan langsung (`managerId`), dan **Anti-Self-Approval** (atasan dilarang menyetujui cutinya sendiri). |
| **`app/api/overtime/route.ts`** | `GET, POST` | Mengelola pengajuan Surat Perintah Kerja Lembur (SPKL). Memvalidasi batasan lembur PP 35/2021 (maks 4 jam/hari, 18 jam/minggu), menghitung kompensasi lembur, verifikasi persetujuan atasan langsung (`managerId`), mencegah self-approval, serta menyamarkan nominal upah lembur dari pantauan manajer. |
| **`app/api/payroll/route.ts`** | `GET, POST` | Mengelola proses penggajian korporat. Melakukan kalkulasi batch untuk karyawan aktif, menghitung PPh 21 TER (PP 58/2023), BPJS, pinjaman, dan take-home pay. Mengunci periode (`LOCKED`/`PAID`) agar tidak dapat diubah lagi. Menolak total akses dari role non-payroll/finance. |
| **`app/api/reimbursement/route.ts`** | `GET, POST` | Mengelola pengajuan klaim pengeluaran karyawan (Transportasi, Medis, Operasional, Makan). Memvalidasi batas pagu per kategori, approval satu tingkat berbasis atasan langsung (`managerId`), Anti-Self-Approval dengan audit security alert, dan integrasi komponen penambah payroll non-pajak. |
| **`app/api/loan/route.ts`** | `GET, POST` | Mengelola fasilitas pinjaman karyawan korporat. Menghitung tenor & cicilan bulanan pemotong payroll, whitelist validasi status (`ACTIVE`, `COMPLETED`, `CANCELLED`), pembatasan scoping data manajer, dan Anti-Self-Approval. |
| **`app/api/loans/route.ts` / `app/api/employee-loans/route.ts`** | `GET, POST` | Rute alias kompatibilitas yang mendelegasikan request langsung ke `loan/route.ts`. |
| **`app/api/documents/route.ts`** | `GET, POST, DELETE` | Mengelola penyimpanan dokumen digital karyawan (KTP, NPWP, Kontrak, Sertifikat). Menerapkan penyaringan visibilitas role-based dan perlindungan data sensitif PII (UU PDP No. 27/2022). |
| **`app/api/kpi/route.ts` / `app/api/kpi-reviews/route.ts`** | `GET, POST` | Mengelola siklus evaluasi kinerja karyawan: input bobot/target, evaluasi mandiri (*self-score*), review atasan langsung (*manager-score*), serta finalisasi approval HR. |
| **`app/api/audit/route.ts` / `app/api/audit-logs/route.ts`** | `GET` | Mengembalikan jejak audit aktivitas sistem (*Immutable Audit Trail*). Dilindungi ketat hanya untuk role `SUPER_ADMIN`, `TENANT_ADMIN`, dan `AUDITOR`. Mendukung filter modul dan paginasi. |
| **`app/api/regulations/route.ts`** | `GET, POST` | Mengembalikan dan memperbarui konfigurasi aturan ketenagakerjaan pemerintah Indonesia (tarif TER, PTKP, plafon BPJS). |
| **`app/api/health/route.ts`** | `GET` | Health-check liveness probe untuk container Cloud Run / Docker (`{"status": "healthy"}`). |
| **`app/api/health/ready/route.ts`** | `GET` | Readiness probe untuk memverifikasi kesiapan koneksi database relasional Prisma. |
| **`app/api/security/overview/route.ts`** | `GET` | Mengagregasi metrik keamanan sistem: total insiden, skor postur keamanan, kepatuhan enkripsi, dan ringkasan audit trail. |
| **`app/api/security/test/route.ts`** | `POST` | Menjalankan uji penetrasi simulasi internal untuk membuktikan ketahanan sistem terhadap serangan IDOR, injeksi, dan bypass RBAC. |

---

### 2.4. Komponen Antarmuka / UI (`components/`)

| Nama File | Deskripsi & Tanggung Jawab Utama |
| :--- | :--- |
| **`components/Navbar.tsx`** | Bilah navigasi atas responsif. Memiliki pemilih peran instan (**Role Switcher**: Super Admin, Tenant Admin, HR Admin, Payroll Admin, Finance, Manager, Employee, Auditor) untuk simulasi hak akses, penanda identitas tenant/perusahaan, lonceng notifikasi, dan drawer menu mobile. |
| **`components/DashboardView.tsx`** | Dashboard analitik operasional dan eksekutif. Menampilkan kartu metrik utama (Total Pegawai, Kehadiran Hari Ini, Pengajuan Pending, Estimasi Biaya Payroll), kalender kerja interaktif, grafik status karyawan, dan ringkasan permohonan approval. |
| **`components/EmployeesView.tsx`** | Re-export wrapper kompatibilitas ke `components/employees/index.tsx`. Mempertahankan kompatibilitas impor lama di seluruh aplikasi. |
| **`components/employees/index.tsx`** | **Orkestrator Modul Data Induk Pegawai (Fase 3)**. Merakit komponen pencarian/filter, tabel, panel detail, dan modal formulir. Menggunakan hook `useEmployees` untuk seluruh operasi API, paginasi cursor, dan manipulasi data. |
| **`components/employees/EmployeeFilters.tsx`** | Komponen bilah pencarian dan filter dropdown (Departemen, Cabang, Status Kerja) dengan scoping otomatis untuk manajer serta badge indikator jumlah pegawai hasil filter. |
| **`components/employees/EmployeeListTable.tsx`** | Komponen representasi data pegawai: tampilan kartu responsif untuk mobile dan tabel data penuh untuk desktop, lengkap dengan masking data finansial non-admin dan tombol pagination load more. |
| **`components/employees/EmployeeFormModal.tsx`** | Kumpulan modal formulir: pendaftaran karyawan baru (16 digit NIK, NPWP, UMK, PTKP), modal penyesuaian gaji ber-audit trail, dan modal pembaruan kontak mandiri (ESS). |
| **`components/employees/EmployeeDetailPanel.tsx`** | Panel dialog komprehensif profil karyawan dengan navigasi sub-tab: Ringkasan Profil & Kompensasi, Berkas Dokumen Digital (`EmployeeDocumentsSection`), dan Fasilitas Pinjaman (`EmployeeLoanSection`). |
| **`components/AttendanceView.tsx`** | Modul presensi harian. Menyediakan panel check-in & check-out interaktif dengan pemilihan lokasi kerja (*WFO*, *WFH*, *Client Site*), jam kerja dinamis cabang, alur pengajuan koreksi jam masuk/pulang, tabel log kehadiran, dan statistik kehadiran bulanan. |
| **`components/LeaveOvertimeView.tsx`** | Portal pengelolaan cuti dan lembur karyawan. Formulir pengajuan cuti (integrasi kuota dinamis & deteksi collision), formulir lembur (panduan kompensasi PP 35/2021), tab persetujuan atasan langsung (`managerId`), serta modal verifikasi persetujuan/penolakan dengan alasan resmi. |
| **`components/PayrollView.tsx`** | Pusat komputasi dan manajemen penggajian. Pemilih periode gaji, tombol eksekusi kalkulasi massal, ringkasan total beban perusahaan, tabel rincian gaji karyawan, kartu interaktif **Slip Gaji Resmi (Payslip)** dengan rincian PPh 21 TER & BPJS lengkap, kalkulator simulasi THR, fungsi cetak slip gaji (`window.print`), dan tombol kunci periode (*Lock Payroll*). |
| **`components/EmployeeDocumentsSection.tsx`** | **Vault Arsip Dokumen Digital Karyawan**. Mengatur unggahan berkas identitas dan perjanjian kerja, klasifikasi kategori dokumen, serta penyaringan visibilitas berbasis perizinan RBAC (UU PDP No. 27/2022). *(Sebelumnya salah terdokumentasikan sebagai DocumentsView.tsx).* |
| **`components/ReimbursementSection.tsx`** | **Portal Klaim Penggantian Biaya (Reimbursement)**. Formulir pengajuan klaim operasional dan medis, pemantauan batas pagu pengeluaran, daftar persetujuan atasan langsung, dan status pencairan. *(Sebelumnya salah terdokumentasikan sebagai ReimbursementView.tsx).* |
| **`components/EmployeeLoanSection.tsx`** | **Modul Fasilitas Pinjaman Karyawan**. Simulasi plafon pinjaman, pilihan tenor pembayaran, jadwal pemotongan angsuran gaji otomatis bulanan, dan histori sisa pokok pinjaman. *(Sebelumnya salah terdokumentasikan sebagai LoanView.tsx).* |
| **`components/KpiReviewView.tsx`** | Pusat evaluasi kinerja berkala pegawai. Tampilan indikator kinerja utama (KPI), pengisian skor evaluasi mandiri, ulasan penilaian atasan langsung, serta ringkasan komparasi skor tim. |
| **`components/TaxRegulationView.tsx`** | Modul ensiklopedia regulasi tenaga kerja dan pajak. Menampilkan tabel resmi tarif PPh 21 TER Kategori A, B, C (PP 58/2023), matriks PTKP (TK/0 sampai K/3), batas upah maksimal BPJS Kesehatan & JP, serta tabel pengali upah lembur resmi PP 35/2021. |
| **`components/AuditLogView.tsx`** | Antarmuka jejak audit kepatuhan (*Immutable Audit Trail*). Menampilkan linimasa aktivitas pengguna yang mencakup aktor, peran, aksi (*CREATE, UPDATE, DELETE, LOCK, APPROVE*), modul terkait, serta perbandingan nilai lama dan baru (*diff*). |
| **`components/SecurityCenterView.tsx`** | Pusat pemantauan keamanan siber dan perlindungan data pribadi (UU PDP No. 27/2022). Menyajikan skor postur keamanan, verifikasi enkripsi at-rest AES-256-GCM, daftar peringatan keamanan real-time, status isolasi multi-tenant, dan tombol eksekusi uji penetrasi otomatis. |
| **`components/ViewSkeleton.tsx`** | **Komponen Loading Skeleton Seragam (Fase 4)**. Digunakan sebagai fallback `loading` pada seluruh impor `next/dynamic` di `app/page.tsx` untuk menampilkan placeholder animasi bilah navigasi, kartu metrik ringkasan, dan tabel data saat modul sedang diunduh secara asinkron. |

---

### 2.5. Konfigurasi & Regulasi (`config/`)

| Nama File | Deskripsi & Tanggung Jawab Utama |
| :--- | :--- |
| **`config/governmentRegulations.ts`** | **Pusat Aturan Regulasi Ketenagakerjaan Indonesia**. Menyimpan tabel batas PTKP, tabel persentase tarif efektif rata-rata (TER) PPh 21 Kategori A, B, C, ketentuan persentase BPJS Kesehatan (4% pemberi kerja, 1% pekerja, plafon Rp 12.000.000), batas upah BPJS TK JP (Rp 10.042.300), tarif JKK & JKM, serta rumus jam lembur PP 35/2021. Memastikan tidak ada aturan hukum yang di-hardcode di dalam komponen UI. |
| **`config/featureFlags.ts`** | Pengaturan saklar fitur sistem (mengaktifkan/menonaktifkan MFA, enforcement rate limit, audit logging level, dan multi-tenancy). |
| **`config/systemConfig.ts`** | Parameter umum sistem seperti batas ukuran unggahan dokumen, timeout sesi, format tanggal baku Indonesia, dan mata uang default (`IDR`). |
| **`config/index.ts`** | Barrel export untuk mengekspor seluruh konfigurasi secara modular dan terpusat. |

---

### 2.6. Core Logic, Payroll Engine & Keamanan (`lib/`)

#### Direktori Akar `lib/`
- **`lib/types.ts`**: Seluruh deklarasi tipe TypeScript untuk entitas bisnis (`Employee`, `UserRole`, `AttendanceRecord`, `LeaveRequest`, `OvertimeRequest`, `PayrollPeriod`, `PayrollItem`, `AuditLog`, `TaxCalculationDetail`, `BPJSCalculationResult`, dll.).
- **`lib/utils.ts`**: Utilitas umum seperti penggabung class Tailwind CSS (`cn`), generator ID unik, dan pembantu manipulasi tanggal.
- **`lib/format.ts`**: Utilitas pemformatan mata uang Rupiah (`formatRupiah`), format persentase, penanggalan bahasa Indonesia, dan format durasi jam.

#### Subdirektori `lib/data/` (Data Referensi Terpisah - Fase 2)
- **`lib/data/reference-data.ts`**: Kumpulan master data referensi statis terstruktur (perusahaan, cabang, departemen, posisi, jenis cuti, komponen gaji, dan matriks regulasi) yang disajikan oleh endpoint `/api/data` untuk membebaskan payload awal dari data transaksional berat.

#### Subdirektori `lib/payroll/` (Engine Finansial)
- **`lib/payroll/tax.ts`**: Mesin kalkulasi PPh 21 TER Indonesia berdasarkan PP No. 58/2023 jo. PMK No. 168/2023. Menentukan kategori TER berdasarkan status PTKP dan menghitung pajak masa secara akurat dengan penalti 120% bagi yang tidak memiliki NPWP.
- **`lib/payroll/bpjs.ts`**: Mesin kalkulasi iuran BPJS Kesehatan (Perpres 64/2020) dan BPJS Ketenagakerjaan 4 program (JHT, JP, JKK, JKM) dengan penerapan batas upah (*wage ceiling*) secara ketat.
- **`lib/payroll/overtime.ts`**: Mesin kalkulasi upah lembur resmi PP No. 35/2021. Menghitung upah lembur sejam (1/173 × upah bulanan) dan mengalikan durasi lembur berdasarkan skema hari kerja (1.5x jam pertama, 2x jam berikutnya) atau hari libur (2x, 3x, 4x).
- **`lib/payroll/thr.ts`**: Mesin kalkulasi Tunjangan Hari Raya (THR) Keagamaan sesuai Permenaker No. 6/2016 (1 bulan gaji penuh untuk masa kerja ≥ 12 bulan, dan proporsional untuk masa kerja 1–12 bulan).
- **`lib/payroll/engine.ts`**: Orkestrator utama penggajian. Menyatukan gaji pokok, tunjangan tetap, tunjangan variabel, hasil hitungan lembur, bonus, potongan pinjaman, potongan absensi, iuran BPJS, dan PPh 21 ke dalam `PayrollItem` serta menghasilkan nilai akhir *Take-Home Pay* menggunakan pembulatan presisi.

#### Subdirektori `lib/security/` (Arsitektur Keamanan & UU PDP)
- **`lib/security/authorization.ts`**: Sumber kebenaran tunggal (*Single Source of Truth*) hak akses (*Role-Based Access Control* / RBAC), fungsi evaluasi perizinan (`checkPermission` & alias `hasPermission`), penegakan Segregation of Duties (Finance dibatasi dari kalkulasi/kunci payroll), proteksi kepemilikan data antar hierarki atasan (`managerId`) dan departemen, serta aturan Anti-Self-Approval.
- **`lib/security/audit.ts`**: Layanan perekaman jejak audit (*AuditLogService*). Menyimpan setiap mutasi data dengan sifat *append-only* (tidak dapat diubah atau dihapus).
- **`lib/security/classification.ts`**: Klasifikasi tingkat kerahasiaan data (RESTRICTED, CONFIDENTIAL, INTERNAL, PUBLIC) untuk kepatuhan Undang-Undang Perlindungan Data Pribadi (UU PDP No. 27/2022).
- **`lib/security/crypto.ts`**: Utilitas enkripsi dan dekripsi simetris data sensitif pada saat tersimpan (*data at-rest*) menggunakan algoritma teruji AES-256-GCM.
- **`lib/security/mfa.ts`**: Manajemen Multi-Factor Authentication berbasis TOTP (Time-Based One-Time Password) untuk pengamanan akun administrator dan personel payroll.
- **`lib/security/payrollGuard.ts`**: Pengawal integritas data payroll. Menolak modifikasi atau penghapusan terhadap periode gaji yang berstatus `LOCKED` atau `PAID`.
- **`lib/security/rateLimiter.ts`**: Mekanisme pembatas laju permintaan (*Rate Limiting*) di level memori server untuk menangkal serangan brute-force dan DoS.
- **`lib/security/tenant.ts`**: Manajemen isolasi multi-tenant untuk memastikan query data tidak pernah bocor ke perusahaan/organisasi lain.
- **`lib/security/validation.ts`**: Skema validasi masukan data (Zod / TypeScript guards) untuk mencegah serangan injeksi dan payload berbahaya.

#### Subdirektori `lib/leave/` & `lib/auth/`
- **`lib/leave/balance.ts`**: Mesin kalkulasi saldo kuota cuti tahunan dinamis, pemotongan kuota, dan deteksi tumpang-tindih (*collision check*) tanggal cuti antar karyawan.
- **`lib/auth/session.ts`**: Pengelola sesi pengguna, mock switching profil, matriks izin tab (`ROLE_ALLOWED_TABS`), dan fungsi verifikasi hak buka tab (`isTabAllowed()`).

---

### 2.7. Custom Hooks & Pola Akses Data (`lib/hooks/`)

Subdirektori `lib/hooks/` (dengan re-export alias di `hooks/`) menyimpan custom React hooks yang menjadi **standar arsitektur pemanggilan data (Data Access Pattern)** pada aplikasi. Pola ini diperkenalkan pada **Fase 3** sebagai aturan baku pemisahan logika bisnis dari komponen tampilan (*Separation of Concerns*).

#### Pola Standar: `lib/hooks/useEmployees.ts`
Berkas ini mengabstraksikan seluruh siklus hidup data karyawan dalam satu antarmuka reaktif:
1. **Pemisahan Tanggung Jawab Mutlak (*Decoupling*)**: Komponen antarmuka (seperti `EmployeeListTable`, `EmployeeFilters`, `EmployeeFormModal`) **DILARANG KERAS** memanggil `fetch('/api/...')` secara langsung. Seluruh pemanggilan jaringan dikelola di dalam hook.
2. **Paginasi Kursor Terintegrasi**: Mengelola state `nextCursor`, `hasMore`, `total`, dan metode `loadMore()` yang memuat halaman data berikutnya tanpa mengulang pemuatan data sebelumnya.
3. **Filter & Pencarian Sisi Server**: Menyediakan fungsi `refetch(newFilters)` yang mengompilasi parameter query pencarian, departemen, dan status kerja ke URL API.
4. **Mutasi Data Aman & Optimistic UI**: Menyediakan metode `createEmployee`, `updateEmployee`, dan `deleteEmployee` yang secara otomatis menyuntikkan header keamanan RBAC (`x-user-role`, `x-employee-id`), memperbarui state lokal secara reaktif, memicu toast notifikasi (`onSuccess` / `onError`), dan melakukan rollback jika terjadi kegagalan server.
5. **State Loading & Submitting**: Membedakan antara `isLoading` (pengambilan data awal/filter) dan `isSubmitting` (eksekusi operasi tulis pada modal formulir).

> **Panduan Developer Baru**:
> Setiap kali menambahkan modul atau domain data baru di masa depan (misal: Absensi, Klaim, atau Cuti), developer **wajib** membuat satu custom hook khusus per domain data di bawah `lib/hooks/` (contoh: `useAttendance`, `useLeaveRequests`) yang mengadopsi pola `useEmployees`. Komponen UI hanya bertugas menerima data dan memicu callback event.

---

### 2.8. Database Schema & Repositories (`prisma/` & `lib/db/repositories/`)

Setelah **Fase 1** selesai, sistem Nusantara HRIS **SUDAH SEPENUHNYA TERSAMBUNG** ke database relasional PostgreSQL melalui Prisma ORM. Lapisan ini merupakan fondasi persistensi data utama yang aktif:

#### 1. Skema Database Relasional (`prisma/schema.prisma`)
Berkas ini mendefinisikan skema fisik tabel database yang mencerminkan model data:
- `Tenant`, `Company`, `Branch`, `Department`, `Position` (Hierarki Organisasi)
- `Employee`, `User` (Data Induk Pegawai, Kredensial, & Role)
- `AttendanceRecord`, `LeaveRequest`, `LeaveType`, `OvertimeRequest` (Operasional Presensi & Ketenagakerjaan)
- `PayrollPeriod`, `PayrollItem`, `SalaryComponent` (Penggajian, Pajak TER, & BPJS)
- `Reimbursement`, `EmployeeLoan` (Finansial Karyawan)
- `Document` (Arsip Dokumen Digital)
- `AuditLog` (Jejak Audit Forensik Bersifat Append-Only)
- `GovernmentRegulation` (Konfigurasi Tarif Pajak & Regulasi Pemerintah)

#### 2. Klien Database Singleton (`lib/db/prisma.ts`)
Menginisialisasi instance tunggal `PrismaClient` yang aman digunakan pada Next.js development (mencegah memory leak dari hot-reloading) dan production.

#### 3. Lapisan Repositori Aktif (`lib/db/repositories/`)
Seluruh operasi query dan mutasi database kini dialihkan secara eksklusif ke lapisan repositori:
- **`employee.repository.ts`**: Mengelola query database karyawan, paginasi cursor Prisma (`take`, `skip`, `cursor`), filter relasional, dan sanitasi PII.
- **`attendance.repository.ts`**: Mengelola pencatatan absensi, pengajuan koreksi, dan agregasi statistik presensi.
- **`leave.repository.ts`**: Menyimpan dan memvalidasi pengajuan cuti serta histori persetujuan atasan.
- **`overtime.repository.ts`**: Menyimpan SPKL lembur dan kalkulasi jam kerja.
- **`payroll.repository.ts`**: Mengelola siklus kalkulasi batch gaji, penyimpanan item slip gaji, dan penguncian periode payroll.
- **`organization.repository.ts`**: Mengelola data perusahaan, kantor cabang, divisi departemen, dan jabatan kerja.
- **`audit.repository.ts`**: Menyimpan rekaman jejak audit ke tabel database `AuditLog` tanpa opsi modifikasi/hapus.

#### 4. Lapisan Wrapper / Facade Kompatibilitas (`lib/db/store.ts`)
Setelah Fase 1, berkas **`lib/db/store.ts` BUKAN LAGI penampung data mandiri di dalam memori**. Berkas ini bertindak sebagai lapisan **Facade / Adapter Kompatibilitas** yang membungkus panggilan ke `lib/db/repositories/` agar kode lama yang masih mengandalkan antarmuka `store` tetap dapat berjalan mulus tanpa merusak arsitektur yang sudah ada.

#### 5. Seeding Data Resmi (`prisma/seed.ts`)
Skrip resmi untuk mengisi database kosong dengan 50+ data profil karyawan sintetis, cabang, departemen, konfigurasi pajak TER, dan riwayat absensi menggunakan Prisma Client.

#### 6. Utilitas Paginasi (`lib/db/pagination.ts`)
Fungsi pembantu pembuatan kursor berbasis ID atau timestamp, parser query string (`cursor`, `limit`), dan generator metadata paginasi terstandarisasi.

---

### 2.9. Pengujian Keamanan (`tests/`)

- **`tests/security/run-security-tests.ts`**: Skrip pengujian otomatis untuk memverifikasi ketahanan backend terhadap celah keamanan siber:
  1. **Uji Isolasi IDOR**: Memastikan staf tidak dapat melihat atau mengubah data pegawai lain.
  2. **Uji Anti-Self-Approval**: Memastikan manajer ditolak secara absolut saat mencoba menyetujui permohonan cuti atau lemburnya sendiri.
  3. **Uji Proteksi Data Gaji**: Memastikan manajer ditolak saat mencoba mengakses rincian payroll atau nominal upah lembur bawahannya.
  4. **Uji Integritas Payroll Terkunci**: Memastikan periode penggajian yang berstatus `LOCKED` atau `PAID` menolak segala bentuk mutasi data (*tamper-proof*).

---

### 2.10. Dokumentasi Teknis (`docs/`)

Direktori `docs/` berisi dokumentasi resmi berstandar enterprise yang mencakup 8 pilar tata kelola:
- **`docs/architecture/`**: 10 Dokumen arsitektur sistem, database relasional, caching, antrian pesan (queue), isolasi multi-tenancy, dan model ancaman (*threat model*).
- **`docs/business/`**: 9 Dokumen spesifikasi domain bisnis (siklus hidup pegawai, aturan presensi, perhitungan lembur, saldo cuti, formula BPJS, dan orkestrasi penggajian).
- **`docs/compliance/`**: 5 Dokumen kepatuhan hukum Republik Indonesia (UU Ketenagakerjaan No. 13/2003 jo. Perpu 2/2022, PP 35/2021, PP 58/2023, Perpres 64/2020, dan UU PDP No. 27/2022).
- **`docs/decisions/ADR/`**: 10 Dokumen Architecture Decision Records (ADR-0001 s/d ADR-0010) yang merekam justifikasi pemilihan arsitektur modular monolith, PostgreSQL, Prisma, dan pengamanan dokumen.
- **`docs/engineering/`**: 10 Dokumen standar rekayasa perangkat lunak (konvensi API, standar koding TypeScript, alur kerja Git, strategi pengujian, dan penanganan error terpusat).
- **`docs/operations/`**: 5 Dokumen operasional produksi (prosedur deployment Cloud Run, pencadangan database, disaster recovery, pemantauan sistem, dan penanganan insiden).
- **`docs/product/`**: 5 Dokumen strategi produk (visi Nusantara HRIS, misi perusahaan, prinsip desain produk, dan peta jalan jangka panjang).
- **`docs/security/`**: 10 Dokumen standar keamanan siber (otentikasi, otorisasi RBAC, enkripsi data at-rest/in-transit, manajemen kunci rahasia, dan daftar periksa keamanan).

---

## 3. PANDUAN CEPAT: MENGUBAH BAGIAN A ADA DI FILE MANA?

Gunakan panduan pencarian cepat di bawah ini saat ingin melakukan kustomisasi atau penambahan fitur spesifik:

### 3.1. Identitas Perusahaan, Branding & Footer

| Bagian yang Ingin Diubah | Lokasi File | Keterangan / Baris Terkait |
| :--- | :--- | :--- |
| **Nama Perusahaan di Footer** | `app/page.tsx` | Bagian elemen `<footer id="app-footer">` di bagian paling bawah file `app/page.tsx`. |
| **Teks Hak Cipta / Deskripsi Footer** | `app/page.tsx` | Tag `<p>` di dalam elemen footer `app/page.tsx`. |
| **Data Induk Perusahaan (Alamat, NPWP, Bank)** | `lib/db/seed-data.ts` | Objek `initialCompany` (nama resmi, legal name, NPWP korporat, rekening bank). |
| **Nama Brand di Navbar** | `components/Navbar.tsx` | Header brand logo dan teks nama aplikasi di bagian atas `Navbar.tsx`. |
| **Judul Tab Browser & Meta Deskripsi** | `app/layout.tsx` & `metadata.json` | Konfigurasi `metadata` (`title`, `description`, `openGraph`) di `app/layout.tsx` dan `metadata.json`. |

---

### 3.2. Tampilan Antarmuka (UI / Halaman)

| Bagian yang Ingin Diubah | Lokasi File | Keterangan / Baris Terkait |
| :--- | :--- | :--- |
| **Menu Tab Navigasi Utama** | `app/page.tsx` & `components/Navbar.tsx` | Definisi array tab di `Navbar.tsx` dan kondisi `activeTab` di `app/page.tsx`. |
| **Daftar Pilihan Peran di Role Switcher** | `components/Navbar.tsx` | Array `ROLES` dan fungsi `onRoleChange`. |
| **Tampilan Kartu Ringkasan di Dashboard** | `components/DashboardView.tsx` | Komponen kartu KPI (Pegawai, Kehadiran, Pending Approval, Biaya Payroll). |
| **Kalender Operasional di Dashboard** | `components/DashboardView.tsx` | Seksi widget kalender bulanan dan daftar hari libur nasional. |
| **Tabel Data Karyawan & Kolom Direktori** | `components/employees/EmployeeListTable.tsx` & `EmployeeFilters.tsx` | Komponen tabel karyawan desktop/mobile, baris filter, dan search input. |
| **Form Tambah / Edit Karyawan** | `components/employees/EmployeeFormModal.tsx` | Modal formulir pendaftaran pegawai baru, penyesuaian gaji, dan form kontak ESS. |
| **Tampilan Dialog Detail Profil Karyawan** | `components/employees/EmployeeDetailPanel.tsx` | Modal detail data pribadi, kontrak, gaji, pajak, dokumen, dan pinjaman. |
| **Vault Arsip Dokumen Digital Karyawan** | `components/EmployeeDocumentsSection.tsx` | Komponen pengelolaan berkas KTP, NPWP, kontrak, dan perlindungan data PII. |
| **Portal Pengajuan & Approval Klaim** | `components/ReimbursementSection.tsx` | Komponen klaim penggantian biaya operasional/medis dan verifikasi atasan. |
| **Modul Fasilitas Pinjaman Karyawan** | `components/EmployeeLoanSection.tsx` | Komponen simulasi pinjaman, jadwal tenor, dan riwayat pemotongan gaji. |
| **Tombol Presensi Check-In / Check-Out** | `components/AttendanceView.tsx` | Tombol interaktif presensi dan panel status kehadiran harian. |
| **Tampilan Format Slip Gaji (Payslip)** | `components/PayrollView.tsx` | Modal detail slip gaji interaktif, rincian potongan, dan tombol `window.print()`. |
| **Form Pengajuan Cuti & Saldo Cuti** | `components/LeaveOvertimeView.tsx` | Tab formulir pengajuan cuti dan visualisasi saldo kuota tahunan. |
| **Form Pengajuan Lembur & Estimasi Upah** | `components/LeaveOvertimeView.tsx` | Tab formulir SPKL lembur dan ringkasan kalkulasi durasi jam. |
| **Modal Persetujuan / Penolakan Atasan** | `components/LeaveOvertimeView.tsx` | Dialog approval cuti/lembur dengan input catatan alasan persetujuan/penolakan. |
| **Tampilan Tabel Tarif Pajak & BPJS** | `components/TaxRegulationView.tsx` | Komponen tabel tarif TER PPh 21 Kategori A/B/C dan rincian persentase BPJS. |
| **Tampilan Linimasa Jejak Audit** | `components/AuditLogView.tsx` | Komponen tabel jejak audit dan pemfilteran berdasarkan modul. |
| **Tampilan Status Keamanan & UU PDP** | `components/SecurityCenterView.tsx` | Panel metrik postur keamanan siber, log insiden, dan status enkripsi. |

---

### 3.3. Logika Bisnis Finansial & Payroll

| Bagian yang Ingin Diubah | Lokasi File | Keterangan / Baris Terkait |
| :--- | :--- | :--- |
| **Tabel Tarif TER PPh 21 (PP 58/2023)** | `config/governmentRegulations.ts` | Array `TER_RATES_CATEGORY_A`, `TER_RATES_CATEGORY_B`, dan `TER_RATES_CATEGORY_C`. |
| **Nilai Batas Penghasilan Tidak Kena Pajak (PTKP)** | `config/governmentRegulations.ts` | Objek `PTKP_VALUES` (TK/0 = 54jt, K/0 = 58.5jt, dst). |
| **Logika Penentuan Kategori TER & PPh 21 Bulanan** | `lib/payroll/tax.ts` | Fungsi `calculateTERPPh21()` dan penentuan kategori dari status PTKP. |
| **Persentase & Plafon Upah BPJS Kesehatan** | `config/governmentRegulations.ts` & `lib/payroll/bpjs.ts` | Batas upah maksimal (default Rp 12.000.000), porsi 4% pemberi kerja, dan 1% pekerja di fungsi `calculateBpjsKesehatan()`. |
| **Persentase & Plafon Upah BPJS Ketenagakerjaan JP** | `config/governmentRegulations.ts` & `lib/payroll/bpjs.ts` | Batas plafon iuran Jaminan Pensiun (default Rp 10.042.300) dan tarif iuran JHT, JP, JKK, JKM di fungsi `calculateBpjsKetenagakerjaan()`. |
| **Formula Perhitungan Upah Lembur (PP 35/2021)** | `lib/payroll/overtime.ts` | Rumus pembagi upah sejam (1/173) dan pengali hari kerja (1.5x, 2x) serta hari libur di fungsi `calculateOvertimePay()`. |
| **Formula Perhitungan THR Keagamaan** | `lib/payroll/thr.ts` | Logika perhitungan masa kerja proporsional dan masa kerja penuh di fungsi `calculateTHR()`. |
| **Komponen Take-Home Pay & Orkestrasi Gaji** | `lib/payroll/engine.ts` | Fungsi `calculateEmployeePayroll()` yang menyatukan gaji bruto, seluruh tunjangan, potongan pajak, BPJS, pinjaman, dan take-home pay. |
| **Proses Eksekusi Batch Payroll & Kunci Periode** | `app/api/payroll/route.ts` | Handler POST untuk kalkulasi batch, locking status periode (`LOCKED`/`PAID`), dan validasi proteksi payroll. |

---

### 3.4. Presensi, Cuti & Lembur

| Bagian yang Ingin Diubah | Lokasi File | Keterangan / Baris Terkait |
| :--- | :--- | :--- |
| **Batas Jam Masuk Kantor & Toleransi Keterlambatan** | `app/api/attendance/route.ts` & `config/systemConfig.ts` | Logika penentuan status `LATE` (jam kerja dinamis cabang atau default jam 08:30) pada saat check-in. |
| **Jam Kerja Kantor Cabang & Toleransi Keterlambatan** | `lib/db/seed-data.ts` & `lib/db/store.ts` | Properti `workStartTime` per kantor cabang dan evaluasi keterlambatan saat check-in. |
| **Alur Koreksi Kehadiran (Attendance Correction)** | `app/api/attendance/route.ts` & `components/AttendanceView.tsx` | Form pengajuan koreksi waktu masuk/keluar oleh karyawan, verifikasi atasan langsung, dan pencatatan jejak audit. |
| **Maksimal Kuota & Mesin Saldo Cuti (Leave Balance Engine)** | `lib/leave/balance.ts` & `app/api/leave/route.ts` | Kalkulasi saldo dinamis, akumulasi hari cuti pending, dan validasi bentrok/overlap tanggal cuti. |
| **Batas Maksimal Jam Lembur Harian / Mingguan** | `app/api/overtime/route.ts` & `config/governmentRegulations.ts` | Validasi batas PP 35/2021 (maksimal 4 jam per hari dan 18 jam per minggu). |
| **Hak Persetujuan Berbasis Hierarki Langsung (managerId)** | `app/api/leave/route.ts`, `app/api/overtime/route.ts`, `app/api/reimbursement/route.ts`, `app/api/loan/route.ts` | Pengecekan hierarki atasan langsung (`managerId`), Anti-Self-Approval, dan pencatatan audit log keamanan. |

---

### 3.5. Hak Akses, Role & Keamanan (RBAC & IDOR)

| Bagian yang Ingin Diubah | Lokasi File | Keterangan / Baris Terkait |
| :--- | :--- | :--- |
| **Daftar Izin Tiap Peran (RBAC Permission Matrix)** | `lib/security/authorization.ts` | Objek `ROLE_EXTENDED_PERMISSIONS` yang memetakan izin untuk setiap `UserRole`. |
| **Aturan Anti-Self-Approval (Cuti & Lembur)** | `lib/security/authorization.ts` | Fungsi `validateApprovalAuthorization()` yang melarang atasan menyetujui permohonan miliknya sendiri. |
| **Pembatasan Departemen Manajer (Scope Guard)** | `lib/security/authorization.ts` | Fungsi `isManagerOfDepartment()` untuk memastikan manajer hanya dapat mengakses staf di divisinya. |
| **Penyaringan Data Sensitif Berdasarkan Peran** | `app/api/data/route.ts` | Logika filtering respons `GET /api/data` yang menyensor gaji dan dokumen untuk non-admin. |
| **Pencatatan Audit Trail Aktivitas Baru** | `lib/security/audit.ts` | Panggilan metode `AuditLogService.log()` untuk merekam mutasi entitas data baru. |
| **Algoritma & Kunci Enkripsi Data Sensitif** | `lib/security/crypto.ts` | Implementasi enkripsi AES-256-GCM pada fungsi `encryptData()` dan `decryptData()`. |
| **Aturan Proteksi Periode Payroll Terkunci** | `lib/security/payrollGuard.ts` | Pemeriksaan status periode `LOCKED`/`PAID` untuk mencegah manipulasi data masa lalu. |
| **Aturan Pembatasan Laju Request (Rate Limit)** | `lib/security/rateLimiter.ts` | Ambang batas maksimal request per IP/token pada fungsi `checkRateLimit()`. |

---

### 3.6. Data Awal / Dummy Karyawan & Master Data

| Bagian yang Ingin Diubah | Lokasi File | Keterangan / Baris Terkait |
| :--- | :--- | :--- |
| **Daftar Karyawan Dummy (Nama, NIK, Gaji, PTKP)** | `lib/db/seed-data.ts` | Array `initialEmployees` (berisi 50+ data profil lengkap karyawan sintetis). |
| **Daftar Departemen & Divisi Perusahaan** | `lib/db/seed-data.ts` | Array `initialDepartments` (Teknologi, HR, Finance, Operasional, dll). |
| **Daftar Jabatan / Posisi Kerja** | `lib/db/seed-data.ts` | Array `initialPositions` (Software Engineer, HR Manager, Accountant, dll). |
| **Daftar Hari Libur Nasional Indonesia** | `lib/db/seed-data.ts` | Array `initialHolidays` (Tahun Baru, Idul Fitri, Hari Kemerdekaan, Natal, dll). |
| **Jenis-Jenis Cuti yang Tersedia** | `lib/db/seed-data.ts` | Array `initialLeaveTypes` (Cuti Tahunan, Sakit, Melahirkan, Cuti Menikah, dll). |
| **Riwayat Transaksi Penggajian Sebelumnya** | `lib/db/seed-data.ts` | Array `initialPayrollPeriods` dan `initialPayrollItems`. |

---

### 3.7. Database & Skema Relasional

| Bagian yang Ingin Diubah | Lokasi File | Keterangan / Baris Terkait |
| :--- | :--- | :--- |
| **Definisi Tabel & Relasi Database Relasional** | `prisma/schema.prisma` | Model Prisma (`Employee`, `AttendanceRecord`, `PayrollItem`, `AuditLog`, dll). |
| **Lapisan Akses Data & Repositori Database** | `lib/db/repositories/` & `lib/db/prisma.ts` | Operasi transaksional aktif ke PostgreSQL (Employee, Attendance, Leave, Overtime, Payroll, Organization, Audit). |
| **Lapisan Wrapper / Facade Kompatibilitas** | `lib/db/store.ts` | Lapisan adapter facade yang mendelegasikan pemanggilan ke repositories (bukan in-memory store). |
| **Tipe Data TypeScript untuk Entitas Database** | `lib/types.ts` | Interface TypeScript yang menyelaraskan kontrak antara frontend dan backend. |

---

### 3.8. Endpoint Backend & Routing

| Bagian yang Ingin Diubah | Lokasi File | Keterangan / Baris Terkait |
| :--- | :--- | :--- |
| **Menambahkan Endpoint API Baru** | `app/api/[nama-fitur]/route.ts` | Buat folder baru di bawah `app/api/` dengan file `route.ts` berisi method `GET`, `POST`, `PUT`, atau `DELETE`. |
| **Konfigurasi HTTP Headers & Keamanan API** | `next.config.ts` | Bagian `async headers()` untuk menambahkan header keamanan khusus. |
| **Penanganan Error Terpusat & Response Formatter** | `lib/utils.ts` & `app/api/*` | Pola `NextResponse.json({ error: ... }, { status: ... })` terstandarisasi. |

---

## 4. TATA CARA VERIFIKASI SETELAH MELAKUKAN PERUBAHAN

Setiap kali Anda selesai melakukan modifikasi pada berkas manapun:

1. **Jalankan Verifikasi Linter**:
   ```bash
   npm run lint
   ```
   *Memastikan tidak ada kesalahan tipe TypeScript, sintaksis yang salah, atau variabel yang tidak digunakan.*

2. **Jalankan Verifikasi Build**:
   ```bash
   npm run build
   ```
   *Memastikan kompilasi Next.js (Server & Client Components) berjalan sukses tanpa kegagalan tipe.*

3. **Jalankan Pengujian Keamanan**:
   ```bash
   npx tsx tests/security/run-security-tests.ts
   ```
   *Memastikan tidak ada celah keamanan IDOR baru, bypass role, atau kebocoran data gaji yang tidak sengaja terbuka.*
