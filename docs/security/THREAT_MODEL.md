# THREAT MODEL & RISK ASSESSMENT — NUSANTARA HRIS ENTERPRISE
## STRIDE Analysis, Attack Vectors, and Mitigation Architecture

**Classification:** CONFIDENTIAL  
**Status:** SEMI-PRODUCTION READY  
**Methodology:** Microsoft STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)

---

## 1. STRIDE Analysis for Indonesian HRIS

| Ancaman (STRIDE) | Skenario Risiko di HRIS | Mitigasi Arsitektur | Tingkat Keparahan |
|---|---|---|---|
| **Spoofing (Penyamaran)** | Penyerang menebak kredensial HR Admin atau memalsukan cookie sesi untuk menyamar sebagai pejabat berwenang. | Password hashing Argon2id/bcrypt 12 rounds, rate limiting brute-force, progressive delay lockout, secure httpOnly session cookies, MFA-ready enforcement untuk role sensitif. | **P0 (Critical)** |
| **Tampering (Manipulasi Data)** | Karyawan atau penyerang mengubah nominal gaji, tarif TER PPh 21, atau mengedit status payroll yang sudah disetujui. | Database constraints, transaksi ACID, Four-Eyes Principle (Maker-Checker), snapshot gaji kekal (*locked payroll immutability*), HMAC integrity check. | **P0 (Critical)** |
| **Repudiation (Penyangkalan)** | Admin menyangkal telah menaikkan gaji kerabat atau menghapus rekam absensi seorang pegawai. | Append-only immutable AuditLogService, mencatat Actor ID, IP, User Agent, Request ID, Timestamp, serta delta Before/After tanpa celah DELETE/UPDATE di level aplikasi. | **P1 (High)** |
| **Information Disclosure (Kebocoran Data)** | Akses tidak sah ke NIK KTP, nomor rekening, atau slip gaji pegawai lain via manipulasi parameter URL (IDOR). | Object-level authorization, tenant context isolation (`WHERE tenantId = ?`), server-side data masking (NIK, NPWP, Bank), sanitasi payload API. | **P0 (Critical)** |
| **Denial of Service (DDoS / DoS)** | Penyerang membanjiri kalkulasi payroll massal atau menembakkan query ekspor data tak terhingga (`?pageSize=999999`). | Pagination guard (max 100 items), rate limiting per-IP dan per-User, background task processing untuk ekspor besar, health check timeout. | **P1 (High)** |
| **Elevation of Privilege (Eskalasi Hak Akses)** | Pengguna role EMPLOYEE memodifikasi payload POST ke endpoint `/api/payroll/lock` untuk mengunci periode gaji. | Server-side RBAC validation (`hasPermission`) pada setiap endpoint dan Server Action, independent session validation, penolakan izin di sisi backend terpusat. | **P0 (Critical)** |

---

## 2. Special HRIS Risk Scenarios

1. **Cross-Tenant Data Leakage:**
   - *Risiko:* Perusahaan A dapat melihat data gaji atau karyawan Perusahaan B.
   - *Mitigasi:* Wajibkan isolasi `tenantId` pada setiap query database. Otomatisasi test integrasi `cross-tenant.test.ts` untuk memastikan kegagalan akses lintas tenant.
2. **Payroll Manipulation (Single Actor Fraud):**
   - *Risiko:* Seorang admin membuat data payroll fiktif dan langsung menyetujuinya sendiri.
   - *Mitigasi:* Pemisahan tugas (*Separation of Duties*) antara Pembuat/Kalkulator (*Maker*) dan Penyetuju/Pengunci (*Checker*).
