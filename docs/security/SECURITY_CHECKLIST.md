# SECURITY AUDIT & VERIFICATION CHECKLIST — NUSANTARA HRIS ENTERPRISE
## Production Readiness Criteria (OWASP Top 10, ASVS & Indonesian Regulatory Compliance)

**Classification:** CONFIDENTIAL  
**Status:** SEMI-PRODUCTION VERIFIED  

---

### 1. Authentication & Session Security
- [x] Password hashing menggunakan Argon2id / bcrypt 12 rounds (Zero plaintext password).
- [x] Tidak ada user enumeration pada response login atau reset password.
- [x] Session cookie dikonfigurasi `HttpOnly`, `SameSite=Lax`, dan `Secure` pada produksi.
- [x] Invalidation sesi langsung aktif saat logout, ganti password, atau perubahan role.
- [x] Rate limiting login aktif (maksimal 5 kegagalan per 5 menit dengan progressive delay).
- [x] Kesiapan arsitektur Multi-Factor Authentication (TOTP / RFC 6238).

### 2. Authorization & Tenant Isolation
- [x] Otorisasi server-side menggunakan sistem permission granular (`hasPermission`).
- [x] Pemeriksaan hak akses tingkat objek (IDOR defense) pada setiap resource ID.
- [x] Isolasi tenant context terpusat (`getCurrentTenant()`).
- [x] Karyawan (`EMPLOYEE`) hanya dapat melihat data pribadi miliknya sendiri.
- [x] Uji otomatis `cross-tenant.test.ts` memverifikasi penolakan akses lintas tenant.

### 3. Data Protection & Privacy (UU PDP)
- [x] Klasifikasi data sensitif (`PUBLIC`, `INTERNAL`, `CONFIDENTIAL`, `HIGHLY_CONFIDENTIAL`).
- [x] Masking data server-side untuk NIK KTP, NPWP, Rekening Bank, dan Gaji.
- [x] Enkripsi AES-256-GCM tingkat aplikasi untuk field sensitif at-rest.
- [x] Enkripsi in-transit TLS 1.3 dengan HTTP Strict Transport Security (HSTS).
- [x] Rahasia dan kunci enkripsi tidak pernah bocor ke Git atau Client Bundle.

### 4. Input Validation & API Hardening
- [x] Validasi payload API menggunakan Zod schema sebelum eksekusi database.
- [x] Proteksi Mass Assignment dengan whitelist field eksplisit.
- [x] Anti-SQL Injection via parameterized query dan ORM.
- [x] Proteksi XSS (Auto-escaping React, dilarang `dangerouslySetInnerHTML`).
- [x] Security headers aktif (CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).
- [x] Proteksi penyalahgunaan paginasi (default 25, maksimal 100 items).

### 5. Payroll Integrity & Compliance
- [x] Periode penggajian yang telah `LOCKED` atau `PAID` bersifat kekal (*immutable*).
- [x] Koreksi gaji historis wajib melalui periode penyesuaian (*adjustment payroll*).
- [x] Prinsip Empat Mata (Four-Eyes Principle / Maker-Checker) untuk approval payroll.
- [x] Rekonsiliasi akuntansi: `Total Gaji Kotor - Total Potongan === Total Gaji Bersih`.
- [x] Penegakan formula resmi pemerintah: PPh 21 TER (PP 58/2023), BPJS Kes (1% & 4%), BPJS TK, Lembur (PP 35/2021).

### 6. Auditability & Operations
- [x] Jejak audit append-only (`AuditLogService`) mencatat Actor, Action, Entity, IP, dan Before/After.
- [x] Data sensitif di-mask dalam payload jejak audit.
- [x] Pemisahan tegas antara log aplikasi (kinerja/debug) dan log audit bisnis.
- [x] Endpoint pemantauan kesehatan `/api/health` dan `/api/health/ready` tanpa kebocoran rahasia.
- [x] Rencana cadangan dan pemulihan bencana (*Backup & Disaster Recovery*) terdefinisi.
