# ARCHITECTURE & SECURITY SPECIFICATION — NUSANTARA HRIS ENTERPRISE
## Semi-Production Security, Privacy, Reliability, and Compliance Architecture

**Classification:** CONFIDENTIAL  
**Status:** SEMI-PRODUCTION READY  
**Target Architecture:** Secure Modular Monolith + Production-Ready Defense-in-Depth  
**Applicable Regulations:** UU PDP No. 27/2022 (Pelindungan Data Pribadi), PP 58/2023 (PPh 21 TER), PP 35/2021 (Ketenagakerjaan & Lembur), Perpres 64/2020 (BPJS Kesehatan), PP 44 & 45/2015 (BPJS Ketenagakerjaan).

---

## 1. Executive Summary & Security Objectives

Nusantara HRIS Enterprise mengelola aset informasi ketenagakerjaan dan keuangan yang sangat krusial bagi korporasi dan tenaga kerja di Indonesia:
- **Identitas Nasional:** Nomor Induk Kependudukan (NIK KTP), Nomor Pokok Wajib Pajak (NPWP), Nomor Kartu Keluarga (KK).
- **Jaminan Sosial:** Nomor BPJS Kesehatan dan Nomor BPJS Ketenagakerjaan (KPJ).
- **Finansial & Perbankan:** Rekening bank, rincian gaji pokok, tunjangan tetap/variabel, potongan pajak, iuran BPJS, dan *Take-Home Pay*.
- **Kepatuhan Fiskal:** Perhitungan PPh 21 TER bulanan, form 1721-A1, dan rekonsiliasi transfer bank.
- **Data Kepegawaian Pribadi:** Kontrak kerja, rekam presensi, riwayat cuti, log lembur, dan dokumen internal.

### 8 Pilar Objektif Keamanan
1. **Confidentiality:** Akses data hanya diberikan kepada pihak yang berhak berdasarkan *least privilege* dan verifikasi server-side.
2. **Integrity:** Nilai finansial, snapshot pajak, formulasi BPJS, dan status payroll bersifat terproteksi dari manipulasi atau race-condition.
3. **Availability:** Sistem dirancang dengan ketahanan tinggi (*health check*, *fault isolation*, serta *backup/recovery plan* teruji).
4. **Privacy:** Kepatuhan terhadap UU PDP No. 27/2022 (*Data Minimization*, *Purpose Limitation*, dan *Data Masking*).
5. **Auditability:** Setiap mutasi data, login, dan aksi manajerial tercatat dalam jejak audit kekal (*immutable append-only audit trail*).
6. **Least Privilege:** Pengguna dan akun layanan hanya memiliki wewenang minimal yang dibutuhkan untuk fungsinya.
7. **Defense in Depth:** Keamanan diterapkan berlapis mulai dari network edge, transport security, HTTP headers, middleware auth, domain guards, hingga database constraints.
8. **Secure Defaults:** Pengaturan bawaan sistem selalu memilih opsi paling aman (misalnya: enkripsi aktif, masked output by default, session httpOnly, CORS ketat).

---

## 2. Secure Modular Monolith Boundaries

Nusantara HRIS menolak dekomposisi sembrono menjadi microservices demi "terlihat enterprise". Sebagai gantinya, sistem menerapkan **Secure Modular Monolith** dengan batas domain (*bounded context*) yang terisolasi secara ketat:

```
+-------------------------------------------------------------------------+
|                        Edge & HTTP Security Gateway                     |
|  - TLS 1.3 / Strict-Transport-Security                                   |
|  - Rate Limiting (Token Bucket / Sliding Window)                        |
|  - Security Headers (CSP, X-Content-Type-Options, Referrer-Policy)      |
|  - CORS Whitelist Protection & Anti-CSRF Token Validation               |
+-------------------------------------------------------------------------+
                                    |
+-------------------------------------------------------------------------+
|                     Authentication & Session Boundary                   |
|  - Password Hashing (Argon2id / bcrypt 12 rounds)                       |
|  - Session Token Rotation & Invalidation on Privilege Change            |
|  - Progressive Lockout & Login Throttling (Anti-Brute Force)            |
|  - MFA Readiness (TOTP Verification Layer for Sensitive Roles)          |
+-------------------------------------------------------------------------+
                                    |
+-------------------------------------------------------------------------+
|                Tenant Context & Object-Level Authorization              |
|  - getCurrentTenant() Context Isolation                                  |
|  - RBAC (Role-Based) + ABAC (Attribute-Based: Manager/Team Scope)       |
|  - IDOR Protection (Ownership Verification on Every Resource ID)         |
+-------------------------------------------------------------------------+
                                    |
+-------------------------------------------------------------------------+
|                         Domain Service Layer                            |
|  +---------------------+ +----------------------+ +-------------------+ |
|  | Employee Domain     | | Attendance & Leave   | | Payroll Engine    | |
|  | - Data Masking      | | - Geo-fencing check  | | - Four-Eyes Check | |
|  | - App-Level Crypto  | | - Balance validation | | - Immutability    | |
|  | - Zod Input Guard   | | - Holiday check      | | - Reconciliation  | |
|  +---------------------+ +----------------------+ +-------------------+ |
+-------------------------------------------------------------------------+
                                    |
+-------------------------------------------------------------------------+
|                     Audit Trail & Compliance Layer                      |
|  - Append-Only AuditLog Service (Immutable records)                     |
|  - Masked Diffs (Before / After snapshots tanpa rahasia)                |
|  - Correlation ID & Request ID Traceability                             |
+-------------------------------------------------------------------------+
                                    |
+-------------------------------------------------------------------------+
|                       Storage & Data Protection                         |
|  - Parameterized ORM / Zero Raw Concatenation (Anti-SQLi)               |
|  - Database Encryption at Rest (AES-256)                                |
|  - Unique Database Constraints & Foreign Key Integrity                  |
|  - Scheduled Point-In-Time Backups & Restore Drill                      |
+-------------------------------------------------------------------------+
```

---

## 3. Data Flow & Security Perimeter

Setiap request yang masuk melalui API endpoint atau Server Action wajib melalui rantai verifikasi 6 tahap:

1. **Ingress & Throttling:** Cek IP rate limit dan endpoint quota.
2. **Session Authentication:** Validasi session token, pastikan belum expired atau direvoke.
3. **Tenant Scoping:** Muat `tenantId` dari token terverifikasi, bukan dari payload client.
4. **RBAC/ABAC Authorization:** Periksa izin spesifik (misal: `payroll.lock` atau `employee.salary.read`).
5. **Input Validation:** Jalankan schema Zod untuk mencegah Mass Assignment dan Injection.
6. **Object Ownership Check:** Pastikan `resource.tenantId === currentTenantId` dan cek kepemilikan data (mencegah IDOR).

Jika salah satu tahap gagal, request segera ditolak dengan pesan kesalahan generik tanpa membocorkan struktur internal sistem.
