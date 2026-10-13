# Nusantara HRIS Enterprise — National-Scale Human Resource & Payroll Platform

[![Platform](https://img.shields.io/badge/Platform-National--Scale%20HRIS-emerald.svg)](https://nusantaratech.co.id)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue.svg)](https://www.typescriptlang.org)
[![Compliance](https://img.shields.io/badge/Compliance-PP%2058%2F2023%20%7C%20PP%2035%2F2021-amber.svg)](/docs/compliance/GOVERNMENT_REGULATIONS.md)
[![Multi-Tenancy](https://img.shields.io/badge/Architecture-Multi--Tenant%20Ready-purple.svg)](/docs/architecture/MULTI_TENANCY.md)

Nusantara HRIS adalah platform Human Resources Information System (HRIS) dan Payroll komprehensif tingkat *enterprise* yang dirancang khusus untuk memenuhi lanskap regulasi ketenagakerjaan dan perpajakan di Republik Indonesia. Dibangun dengan arsitektur **Modular Monolith** berkemampuan *multi-tenancy*, sistem ini siap diskalakan dari satu perusahaan rintisan hingga ratusan ribu perusahaan dengan jutaan catatan karyawan secara andal, akurat, dan dapat diaudit secara hukum.

---

## 1. Vision & Core Philosophy

> **"Menjadi platform Human Resources dan Payroll digital yang modern, terpercaya, aman, dan mudah digunakan bagi perusahaan di Indonesia."**

### Core Engineering Principles
- **Accuracy First**: Perhitungan nominal finansial, pajak, dan iuran jaminan sosial menggunakan presisi desimal tanpa kompromi pembulatan floating-point.
- **Compliance by Design**: Implementasi regulasi nasional (PPh 21 TER PP 58/2023, PMK 168/2023, Lembur PP 35/2021, BPJS Kesehatan & Ketenagakerjaan) terintegrasi langsung dalam mesin kalkulasi.
- **Security & Privacy by Default**: Pelindungan data pribadi karyawan (NIK, NPWP, Nomor Rekening, Rekam Medis) dengan prinsip *masking*, enkripsi, dan *principle of least privilege*.
- **Auditability**: Setiap aksi kritis (penambahan karyawan, perubahan gaji, persetujuan cuti/lembur, penguncian payroll) tercatat dalam *append-only audit trail*.

---

## 2. Modul & Fitur Utama

### A. Manajemen Master Data Karyawan (HR Core)
- Master data karyawan terpadu: NIK KTP, NPWP, Nomor Kartu BPJS Kesehatan & Ketenagakerjaan.
- Manajemen struktur organisasi bertingkat: Perusahaan (*Company*), Cabang (*Branch*), Departemen (*Department*), Posisi (*Position*).
- Status hubungan kerja: PKWT (Perjanjian Kerja Waktu Tertentu), PKWTT (Tetap), Masa Percobaan (*Probation*), dan Magang (*Internship*).
- Manajemen data bank karyawan untuk proses pencairan gaji terotomatisasi.

### B. Presensi Terverifikasi Geofence & Pergeseran Shift
- Pencatatan kehadiran digital (*Clock In / Clock Out*) real-time dengan koordinat lintang & bujur (GPS).
- Validasi radius batas kantor (*geofence verification*) untuk mencegah pemalsuan lokasi kehadiran.
- Fleksibilitas metode kerja: Work From Office (WFO), Work From Home (WFH), dan Kunjungan Klien (*On-Site Client*).
- Rekapitulasi otomatis keterlambatan, pulang awal, dan durasi jam kerja harian.

### C. Manajemen Cuti & Izin Berjenjang
- Kuota cuti tahunan (12 hari kerja menurut UU Ketenagakerjaan), cuti melahirkan (90 hari), cuti duka cita, dan izin dinas luar.
- Alur persetujuan bertingkat (*multi-tier approval workflow*) oleh Manajer Divisi dan HR Admin.
- Alasan penolakan transparan yang tersimpan dalam jejak audit kepatuhan.

### D. Mesin Lembur PP 35/2021 (Live Tiered Multiplier)
- Perhitungan upah lembur resmi berbasis regulasi PP No. 35 Tahun 2021:
  - **Hari Kerja Biasa**: Jam ke-1 pengali 1.5x, jam ke-2 dst pengali 2.0x.
  - **Hari Libur Mingguan / Libur Resmi**: Jam ke-1 s.d ke-8 pengali 2.0x, jam ke-9 pengali 3.0x, jam ke-10 s.d ke-12 pengali 4.0x.
  - Upah per jam dasar: `(Gaji Pokok + Tunjangan Tetap) / 173`.
- Verifikasi Surat Perintah Kerja Lembur (SPKL) dan pembatasan durasi maksimum (4 jam/hari atau 18 jam/minggu).

### E. Penggajian Terotomasi (Indonesian Payroll Engine)
- **PPh 21 TER (Tarif Efektif Rata-Rata)**:
  - Implementasi penuh **PP No. 58 Tahun 2023** dan **PMK No. 168 Tahun 2023**.
  - Klasifikasi otomatis kategori TER A, TER B, dan TER C berdasarkan status kawin & tanggungan PTKP (TK/0 s.d K/3).
  - Skema perhitungan masa pajak bulanan (Januari–November) dan formula Pasal 17 ayat (1) huruf a UU HPP pada masa pajak Desember.
- **BPJS Kesehatan**:
  - Iuran Karyawan 1%, Tanggungan Perusahaan 4%.
  - Batas atas upah maksimal Rp 12.000.000 / bulan.
- **BPJS Ketenagakerjaan**:
  - Jaminan Hari Tua (JHT): Karyawan 2%, Perusahaan 3.7%.
  - Jaminan Pensiun (JP): Karyawan 1%, Perusahaan 2% (plafon upah resmi Rp 10.042.300/bulan).
  - Jaminan Kecelakaan Kerja (JKK): Tingkat risiko perusahaan 0.24% s.d 1.74%.
  - Jaminan Kematian (JKM): Tanggungan Perusahaan 0.30%.
- **Slip Gaji Elektronik**: Menampilkan detail bruto, potongan pajak, potongan iuran pekerja, dan transparansi beban jaminan sosial yang dibayar perusahaan.
- **Kalkulator THR Keagamaan**: Berpedoman pada Permenaker No. 6 Tahun 2016 dengan perhitungan proporsional bagi masa kerja < 12 bulan.
- **Batch Export Transfer Bank**: Format kompatibel Corporate Payroll (BCA Payroll & Mandiri MCM).

### F. Jejak Audit & Tata Kelola (Audit Trail)
- Pencatatan seluruh transaksi sistem (CREATE, UPDATE, DELETE, CALCULATE, APPROVE, REJECT, LOCK).
- Informasi terperinci: User ID, peran, timestamp WIB, IP address, *snapshot* nilai lama vs nilai baru, serta alasan operasional.

---

## 3. Tech Stack & Arsitektur

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router, Server Actions, API Routes)
- **Language**: TypeScript 5.9 (Strict Mode, 100% Type-Safe)
- **ORM & Database**: [Prisma](https://www.prisma.io/) dengan [PostgreSQL](https://www.postgresql.org/) (Multi-Tenant schema ready, Decimal precision)
- **Styling**: Tailwind CSS v4 (Mobile-First, Accessible UI, Bottom-Sheet Modals)
- **Icons & Animation**: Lucide React & Motion (`motion/react`)
- **Visualisasi & Analitik**: Recharts (Distribusi payroll per divisi, tren absensi harian)
- **Dokumentasi**: Comprehensive Documentation as Code (`/docs/`)

---

## 4. Struktur Folder Repositori

```text
/
├── README.md                          # Dokumentasi utama proyek
├── AGENTS.md                          # 20 Aturan wajib pengembangan AI/Engineer
├── CHANGELOG.md                       # Catatan rilis berbasis SemVer
├── PROJECT_STATUS.md                  # Status modul & arsitektur proyek saat ini
├── TECHNICAL_DEBT.md                  # Registri utang teknis & rencana mitigasi
├── package.json                       # Konfigurasi dependensi dan scripts
├── tsconfig.json                      # Konfigurasi TypeScript strict
├── prisma/
│   └── schema.prisma                  # Skema database PostgreSQL (Multi-Tenant, Decimal)
├── docs/                              # Pusat dokumentasi resmi proyek
│   ├── product/                       # Visi, misi, prinsip, dan roadmap
│   ├── architecture/                  # Desain sistem, multi-tenancy, keamanan, skala nasional
│   ├── business/                      # Spesifikasi domain (Payroll, Pajak, Lembur, BPJS)
│   ├── compliance/                    # Registri regulasi pemerintah RI & audit policy
│   ├── engineering/                   # Standar koding, testing, konvensi API & DB
│   ├── decisions/ADR/                 # Rekaman keputusan arsitektur (ADR-0001 s/d ADR-0005)
│   └── operations/                    # Panduan deployment, backup, dan tanggap insiden
├── app/                               # Next.js App Router (Halaman & Endpoint API)
│   ├── api/                           # Endpoint backend proxy & pemrosesan server-side
│   ├── globals.css                    # Definisi gaya Tailwind CSS
│   ├── layout.tsx                     # Shell tata letak aplikasi
│   └── page.tsx                       # Titik orkestrasional tampilan utama HRIS
├── components/                        # Komponen modular UI antarmuka
│   ├── Navbar.tsx                     # Navigasi atas, mobile drawer & switch RBAC
│   ├── DashboardView.tsx              # Dasbor metrik eksekutif & persetujuan tertunda
│   ├── EmployeesView.tsx              # Master data staf (Desktop table + Mobile cards)
│   ├── AttendanceView.tsx             # Presensi GPS & riwayat shift
│   ├── LeaveOvertimeView.tsx          # Pengajuan cuti & simulasi lembur PP 35/2021
│   ├── PayrollView.tsx                # Mesin payroll PPh 21 TER, slip gaji, export bank
│   ├── TaxRegulationView.tsx          # Simulator tarif TER PP 58/2023 & PMK 168/2023
│   └── AuditLogView.tsx               # Jejak kepatuhan & riwayat perubahan sistem
└── lib/                               # Mesin logika domain terpusat
    ├── types.ts                       # Definisi tipe data & kontrak interface
    ├── mockData.ts                    # Data benih (*synthetic seed data*)
    ├── payrollEngine.ts               # Algoritma PPh 21 TER, BPJS, & lembur PP 35
    └── utils.ts                       # Helper format rupiah, waktu WIB, dan class merging
```

---

## 5. Instalasi & Panduan Pengembangan Lokal

### Prasyarat
- Node.js versi 20 LTS atau yang lebih baru
- Paket manager `npm` atau `pnpm`
- PostgreSQL 15+ (Opsional jika menjalankan dengan database lokal)

### Langkah Instalasi
1. Clone repositori ini:
   ```bash
   git clone https://github.com/nusantara-tech/nusantara-hris.git
   cd nusantara-hris
   ```
2. Pasang seluruh dependensi:
   ```bash
   npm install
   ```
3. Siapkan variabel lingkungan:
   ```bash
   cp .env.example .env
   ```
4. Jalankan migrasi Prisma (jika terhubung ke database PostgreSQL):
   ```bash
   npx prisma migrate dev --name init
   npx prisma db seed
   ```
5. Jalankan development server:
   ```bash
   npm run dev
   ```
6. Buka peramban di `http://localhost:3000`.

---

## 6. Testing & Validasi Kualitas

- **Typecheck & Linter**:
  ```bash
  npm run lint
  ```
- **Production Build Check**:
  ```bash
  npm run build
  ```

---

## 7. Keamanan & Kepatuhan Regulasi Indonesia

Platform ini dibangun dengan kepatuhan penuh terhadap:
- **UU No. 13 Tahun 2003** jo. **UU No. 6 Tahun 2023** tentang Cipta Kerja.
- **PP No. 35 Tahun 2021** tentang PKWT, Alih Daya, Waktu Kerja, dan Pemutusan Hubungan Kerja.
- **PP No. 58 Tahun 2023** & **PMK No. 168 Tahun 2023** tentang Mekanisme Pemotongan PPh 21 TER.
- **UU No. 27 Tahun 2022** tentang Pelindungan Data Pribadi (UU PDP).
- **Peraturan BPJS Kesehatan No. 1 Tahun 2024** & Regulasi BPJS Ketenagakerjaan.

---

## 8. Kontribusi & Lisensi

Silakan pelajari [Dokumentasi Standar Koding](/docs/engineering/CODING_STANDARDS.md) dan [Git Workflow](/docs/engineering/GIT_WORKFLOW.md) sebelum mengajukan *Pull Request*.

Hak Cipta &copy; 2026 PT Elkyno Technology. Seluruh Hak Dilindungi Undang-Undang.
