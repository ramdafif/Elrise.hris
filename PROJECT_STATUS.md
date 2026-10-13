# PROJECT STATUS — NUSANTARA HRIS ENTERPRISE

**Current Version:** `v1.0.0`  
**Current Phase:** Stage 1 — National-Scale Architecture & Multi-Tenant Core Production Readiness  
**Target Audience:** Perusahaan Korporat, BUMN, dan UKM di Indonesia  
**Last Updated:** 2026-09-06  

---

## 1. Executive Summary

Nusantara HRIS telah menyelesaikan fondasi arsitektur **Modular Monolith** dengan tata kelola teknis skala nasional. Sistem berhasil mengintegrasikan seluruh regulasi ketenagakerjaan dan perpajakan Indonesia terkini (PPh 21 TER PP 58/2023, PMK 168/2023, Lembur PP 35/2021, BPJS Kesehatan & Ketenagakerjaan) dengan presisi angka desimal tanpa toleransi kesalahan pembulatan.

---

## 2. Status Modul Fungsional

| Modul | Status | Kepatuhan Regulasi | Catatan Implementasi |
| :--- | :---: | :---: | :--- |
| **Karyawan (HR Core)** | ✅ Lengkap | UU PDP No. 27/2022 | NIK, NPWP, BPJS, PKWT/PKWTT, Bank data, Profiling lengkap |
| **Presensi & Jam Kerja Cabang** | ⚠️ Sebagian | PP 35/2021 | Kehadiran berbasis label lokasi self-declared (WFO/WFH/Client Site) dan jam kerja dinamis per cabang, TANPA verifikasi GPS/geofencing (masuk rencana implementasi mendatang) |
| **Cuti & Izin** | ✅ Lengkap | UU 13/2003 jo. UU 6/2023 | Kuota tahunan otomatis, validasi bentrok tanggal, approval satu tingkat berbasis hierarki manager langsung (managerId), Anti-Self-Approval, alasan penolakan audit |
| **Koreksi Presensi (Attendance Correction)** | ✅ Lengkap | SOP Ketenagakerjaan | Workflow pengajuan koreksi jam check-in/out oleh staf, verifikasi atasan/HR, audit trail mutasi jam, Anti-Self-Approval |
| **Leave Balance Engine** | ✅ Lengkap | UU Ketenagakerjaan | Perhitungan sisa kuota dinamis, akumulasi hari pending, proteksi saldo negatif, dan validasi bentrok tanggal pengajuan |
| **Persetujuan Hierarki Langsung (managerId)** | ✅ Lengkap | Tata Kelola Enterprise | Mekanisme desentralisasi approval cuti, lembur, klaim, pinjaman, dan koreksi presensi berbasis relasi langsung `managerId` |
| **Lembur (Overtime)** | ✅ Lengkap | PP 35/2021 | Tiered multiplier otomatis (1.5x, 2x, 3x, 4x), validasi batas maks PP 35/2021 (4 jam/hari, 18 jam/minggu), approval atasan (managerId) |
| **Penggajian (Payroll Engine)**| ✅ Lengkap | PP 58/2023 & PMK 168/2023 | PPh 21 TER Kategori A, B, C, BPJS Kes & TK, Lock Period, perhitungan desimal presisi |
| **Pemisahan Tugas Finansial (Payroll SoD)** | ✅ Lengkap | Standar SOX / COSO | Maker-Checker: Payroll/HR Admin (kalkulasi/kunci draft) vs Finance (verifikasi & bayar); penolakan total akses manajer; Anti-Self-Approval |
| **Klaim Biaya (Reimbursement)** | ✅ Lengkap | Standar Pajak Kemenkeu | Pengajuan klaim (Transport, Medis, Operasional, Makan), pagu batas per kategori, approval atasan langsung, integrasi payroll non-taxable |
| **Pinjaman Karyawan (Employee Loan)** | ✅ Lengkap | Kebijakan Internal | Pencatatan pinjaman, tenor & angsuran otomatis pemotong payroll, whitelist status (ACTIVE/COMPLETED/CANCELLED), four-eyes approval |
| **Manajemen Kinerja (KPI & Review)** | ✅ Lengkap | Manajemen SDM Korporat | Penetapan bobot KPI, alur evaluasi mandiri (self-score), review manajer langsung, dan finalisasi HR |
| **Dokumen Karyawan & PII Vault** | ✅ Lengkap | UU PDP No. 27/2022 | Manajemen dokumen digital (KTP, NPWP, Kontrak), penyaringan visibilitas role-based, proteksi data pribadi sensitif |
| **THR Keagamaan** | ✅ Lengkap | Permenaker 6/2016 | Kalkulator proporsional masa kerja terintegrasi |
| **Slip Gaji Elektronik** | ✅ Lengkap | Standar Audit Depnaker | Rincian bruto, potongan, dan transparansi iuran pemberi kerja, cetak slip gaji |
| **Export Bank Transfer** | ✅ Lengkap | Perbankan Nasional | Format CSV/TXT BCA Payroll (KlikBCA Bisnis) & Mandiri MCM |
| **Jejak Audit (Audit Trail)** | ✅ Lengkap | Standar ISO 27001 / SOX | Append-only, snapshot old vs new value, user IP, timestamp WIB |
| **Simulator Pajak PPh 21** | ✅ Lengkap | DJP Kemenkeu RI | Kalkulator TER interaktif dengan visualisasi tier |
| **RBAC Konsolidasi & Matriks Hak Akses** | ✅ Lengkap | ISO 27001 / Zero Trust | Matriks wewenang terpusat `checkPermission` untuk 9 peran, pencegahan eskalasi hak istimewa, isolasi wewenang operasional |
| **Mobile Responsiveness** | ✅ Lengkap | UX Guidelines | Bottom navigation bar, bottom-sheet modal, mobile cards |
| **Security Hardening (UU PDP)**| ✅ Lengkap | UU No. 27/2022 | Server-side masking (NIK/NPWP/Bank), Four-Eyes Maker-Checker, Session Invalidation |
| **Multi-Tenant SaaS Core** | ✅ Lengkap | SaaS Standard | Tenant isolation, Subscription tiering (Starter/Growth/Enterprise), Entitlements |
| **Architectural Decisions (ADR)**| ✅ Lengkap (10 ADRs) | Architecture Gov | ADR-0001 sd ADR-0010 terdokumentasi lengkap di `/docs/decisions/ADR/` |

---

## 3. Status Arsitektur & Rekayasa Lanjutan

### Selesai (Tahap 1 & Tahap 2 Fondasi)
- **Multi-Tenant & Subscription Engine**: Skema dan tata kelola tenant terisolasi, batasan kuota karyawan, dan tiering layanan SaaS (ADR-0004 & ADR-0009).
- **Expanded Enterprise RBAC (9 Peran)**: Penambahan wewenang berjenjang untuk `SUPER_ADMIN`, `TENANT_ADMIN`, `HR_ADMIN`, `HR_STAFF`, `PAYROLL_ADMIN`, `FINANCE`, `MANAGER`, `EMPLOYEE`, dan `AUDITOR`.
- **Four-Eyes Governance & Financial Separation**: Pemisahan tegas wewenang penyusunan gaji (*maker*) dan penguncian/pembayaran (*checker/finance*) guna mencegah kecurangan (ADR-0010).
- **Storage & Document Security**: Arsitektur penyimpanan dokumen privat terotentikasi, validasi MIME magic-bytes, dan URL berbatas waktu (ADR-0007).
- **Background Queue Abstraction**: Desain arsitektur pemrosesan job antrean latar belakang untuk batching payroll masif (ADR-0006).
- **API Platform v1 Standard**: Spesifikasi REST API v1 dengan versioning, API key hashing, dan rate-limiting (ADR-0008).

### Rencana Implementasi Mendatang (Tahap 3 & 4)
- **Verifikasi GPS & Geofencing Presensi**: Validasi koordinat real-time mobile/web dengan toleransi radius kantor cabang (150m) dan pencegahan fake GPS (saat ini masih berstatus 'Sebagian' berbasis input lokasi mandiri dan jadwal kerja cabang).
- **Persetujuan Berjenjang Multi-Level (Multi-Tier Approval)**: Workflow eskalasi bertingkat (misal: Staf -> Supervisor -> Kadiv -> HR Director) untuk cuti panjang atau transaksi bernilai tinggi (saat ini sistem menggunakan approval 1 tingkat berbasis atasan langsung `managerId`).
- **Direct Banking Gateway**: Integrasi API Host-to-Host (BCA Snap API, Bank Mandiri Corporate Portal, BNI Direct, BRI Cash Management).
- **Government Compliance Integration**: Ekspor format siap lapor e-SPT Masa PPh 21 (DJP) dan SIPP Online BPJS Ketenagakerjaan.
- **Biometric Face Recognition**: Verifikasi presensi berbasis deteksi wajah dan anti-spoofing liveness test.

---

## 4. Risiko Arsitektur & Mitigasi

1. **Volume Data Presensi Skala Nasional**:
   - *Risiko*: 1.000.000 karyawan melakukan Clock In serentak pada pukul 08:00 WIB berpotensi membebani database transaksional.
   - *Mitigasi*: Partisi tabel bulanan pada `AttendanceLog`, read-replica, serta penerapan Redis caching untuk verifikasi jadwal kerja.
2. **Kerahasiaan Data Gaji**:
   - *Risiko*: Potensi kebocoran informasi penghasilan antar sesama karyawan atau staf non-payroll.
   - *Mitigasi*: Pengamanan ganda di tingkat query database (row-level security & middleware server), audit logging ketat, serta masking data sensitif.
3. **Perubahan Regulasi Pajak Mendadak**:
   - *Risiko*: Perubahan formula PTKP atau lapisan tarif PPh 21 oleh pemerintah dapat merusak histori penggajian sebelumnya.
   - *Mitigasi*: *Rule Versioning* dengan parameter `effectiveFrom` dan `effectiveUntil`. Data payroll masa lalu yang sudah berstatus `LOCKED` bersifat *immutable snapshot* dan tidak akan terpengaruh pembaruan aturan di masa depan.
