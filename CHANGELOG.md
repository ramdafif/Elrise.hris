# CHANGELOG — NUSANTARA HRIS ENTERPRISE

Seluruh perubahan penting pada proyek ini dicatat dalam format [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) dengan standar [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]
### Planned
- Transisi background queue worker dari in-memory ke Redis / BullMQ untuk pemrosesan payroll massal (> 100.000 karyawan).
- Integrasi Payment Gateway API perbankan langsung (BCA Snap API & Mandiri Cash Management API).
- Mobile Native Shell (PWA & Android TWA) untuk presensi biometrik wajah offline dengan sinkronisasi terenkripsi.

---

## [1.2.0] - 2026-09-08
### Added & Hardened (Fase 3: Segregation of Duties / Four-Eyes Principle)
- **Payroll Four-Eyes Principle Enforcement (`app/api/payroll/route.ts`)**:
  - Penegakan aturan anti-self-lock: User yang melakukan `RECALCULATE` (Maker) ditolak keras ketika mencoba melakukan `LOCK` (Verifier/Checker) atas periode yang sama.
  - Penegakan aturan anti-self-disburse: User yang melakukan `LOCK` ditolak keras ketika mencoba melakukan `MARK_PAID` (Disburser/Payer/Finance) atas periode yang sama.
  - Audit Trail terpisah: Setiap `PayrollPeriod` kini mencatat `calculatedBy`, `calculatedByName`, `calculatedAt`, `lockedBy`, `lockedByName`, `lockedAt`, serta `paidBy`, `paidByName`, dan `paidAt`.
  - Executive Override: Peran `SUPER_ADMIN` dan `TENANT_ADMIN` diizinkan melakukan override eksekutif darurat dengan pencatatan peringatan keamanan (`SECURITY_ALERT`) pada jejak audit audit-log yang tidak dapat dimanipulasi.
- **Visual Four-Eyes Audit Pipeline (`components/PayrollView.tsx`)**:
  - Komponen visual alur hidup payroll berjenjang: *1. Dihitung oleh X* &rarr; *2. Dikunci oleh Y* &rarr; *3. Dibayarkan oleh Z* dengan indikator status audit dan tanggal eksekusi.
  - Tampilan umpan balik error responsif terhadap penolakan Four-Eyes secara real-time pada aksi antarmuka pengguna.

---

## [1.0.0] - 2026-09-06
### Added
- **National Scale Governance & Documentation**:
  - Penambahan master dokumen visi, misi, prinsip, dan North Star metric (`/docs/product/`).
  - Arsitektur sistem lengkap: Modular Monolith, Multi-Tenancy isolasi `tenantId`, Keamanan & Threat Model, Skalabilitas skala nasional (`/docs/architecture/`).
  - Spesifikasi logika domain: Payroll, PPh 21 TER (PP 58/2023), BPJS Kes & TK, Lembur PP 35/2021, dan siklus hidup karyawan (`/docs/business/`).
  - Registri regulasi pemerintah dan kepatuhan UU PDP No. 27/2022 (`/docs/compliance/`).
  - Standar koding TypeScript strict, konvensi API & Database, serta Architecture Decision Records ADR-0001 s/d ADR-0005.
- **Indonesian Payroll Engine**:
  - Implementasi penuh pemotongan PPh 21 TER bulanan Kategori A, B, dan C berdasarkan PP 58/2023 dan PMK 168/2023.
  - Perhitungan BPJS Kesehatan (1% karyawan, 4% perusahaan dengan plafon Rp 12.000.000).
  - Perhitungan BPJS Ketenagakerjaan (JHT 2%/3.7%, JP 1%/2% plafon Rp 10.042.300, JKK 0.24%-1.74%, JKM 0.30%).
  - Kalkulator Lembur PP 35/2021 dengan pengali bertingkat dinamis (hari kerja vs libur) berbasis rumus `(Gaji Pokok + Tunjangan Tetap)/173`.
  - Kalkulator Tunjangan Hari Raya (THR) Keagamaan Permenaker No. 6/2016.
  - Export data transfer perbankan format BCA Payroll & Mandiri MCM.
  - Pembuatan Slip Gaji Elektronik resmi berstandar korporat Indonesia dengan rincian iuran perusahaan.
- **Attendance & Geofencing System**:
  - Presensi digital real-time (Clock In/Clock Out) terikat koordinat GPS dan radius geofence kantor (default 150 meter).
  - Pelacakan jenis kehadiran: WFO, WFH, dan Tugas Luar Klien.
- **Leave & Overtime Management**:
  - Formulir pengajuan cuti berjenjang dengan persetujuan bertingkat atasan dan HR.
  - Dialog penolakan terstruktur (*Reason requirement*) yang tercatat pada audit trail.
- **Mobile Responsive Design**:
  - Bottom navigation bar responsif untuk ponsel pintar.
  - Slide-over drawer menu lengkap dengan simulasi peran pengguna (RBAC switch).
  - Tampilan kartu (*card list view*) khusus layar sentuh pada modul Karyawan, Presensi, Payroll, dan Log Audit.
  - Transformasi seluruh modal menjadi *bottom sheet* ramah ibu jari (*touch-optimized*).
- **Auditability & RBAC**:
  - Jejak audit *append-only* untuk seluruh operasi kritis data.
  - Dukungan peran: Super Admin, HR Admin, HR Staff, Payroll Admin, Manager, Employee, dan Auditor.

---

## [0.2.0] - 2026-09-05
### Added
- Simulator regulasi pajak PPh 21 TER interaktif dengan rincian tahapan perhitungan per bracket.
- Dasbor eksekutif dengan widget metrik penting, grafik distribusi anggaran gaji per divisi, dan daftar persetujuan tertunda.
- Model Prisma komprehensif (`prisma/schema.prisma`) dengan tipe data `Decimal` untuk seluruh komponen finansial.

---

## [0.1.0] - 2026-09-01
### Added
- Inisialisasi struktur Next.js 15 dengan TypeScript dan Tailwind CSS.
- Pembuatan komponen tata letak dasar dan master data awal karyawan.
