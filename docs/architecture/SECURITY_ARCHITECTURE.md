# SECURITY ARCHITECTURE — NUSANTARA HRIS ENTERPRISE

Dokumen ini menguraikan arsitektur pertahanan berlapis (*Defense-in-Depth*), model autentikasi, matriks otorisasi, enkripsi data, dan proteksi kerahasiaan informasi di Nusantara HRIS.

---

## 1. Authentication & Session Management

- **Credentials & Hashing**: Kata sandi pengguna diamankan menggunakan algoritma **Bcrypt** dengan *cost factor* minimum 12, dilengkapi garam (*salt*) unik per akun.
- **Session Tokens**: Sesi pengguna diatur menggunakan *HTTP-only, Secure, SameSite=Strict* cookies untuk memitigasi risiko serangan *Cross-Site Scripting* (XSS) dan *Cross-Site Request Forgery* (CSRF).
- **Multi-Factor Authentication (MFA)**: Wajib bagi peran administratif tingkat tinggi (`SUPER_ADMIN`, `PAYROLL_ADMIN`) menggunakan standar Time-based One-Time Password (TOTP).

---

## 2. Role-Based Access Control (RBAC) Matrix

Otorisasi dieksekusi secara ketat di sisi server (*Server-side Authorization*). Hak akses dibagi menjadi 7 peran terdefinisi:

| Peran (Role) | Akses Data Karyawan | Kelola Presensi & Cuti | Eksekusi Payroll | Lihat Slip Gaji | Baca Audit Log |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **SUPER_ADMIN** | Penuh (Semua Cabang) | Penuh | Penuh | Semua Karyawan | Ya (Semua Tenant) |
| **HR_ADMIN** | Penuh (Entitas Milik) | Penuh | Terbatas (Review) | Semua Karyawan | Ya (Entitas Milik) |
| **HR_STAFF** | Baca/Tulis Profil | Rekap Presensi/Cuti | Tidak Ada | Diri Sendiri | Terbatas |
| **PAYROLL_ADMIN** | Baca Finansial | Baca Presensi/Lembur | Penuh (Hitung & Kunci) | Semua Karyawan | Ya (Payroll Log) |
| **MANAGER** | Baca Tim Sendiri | Setujui Cuti/Lembur Tim | Tidak Ada | Diri Sendiri | Tidak Ada |
| **EMPLOYEE** | Profil Diri Sendiri | Clock In / Ajukan Cuti | Tidak Ada | Diri Sendiri | Tidak Ada |
| **AUDITOR** | Baca (Hanya-Baca) | Baca (Hanya-Baca) | Baca (Hanya-Baca) | Halaman Agregat | Ya (Audit Penuh) |

---

## 3. Data Protection & Privacy-by-Design (UU PDP No. 27/2022)

Sebagai platform pengelola data tenaga kerja nasional, Nusantara HRIS menerapkan kontrol privasi ketat:

### Masking Data Sensitif
Pada tampilan antarmuka (UI) umum dan log sistem, data pribadi disamarkan secara otomatis:
- **Nomor Rekening Bank**: Ditampilkan hanya 4 digit terakhir (misal: `**** **** 7766`).
- **Nomor Induk Kependudukan (NIK)**: Disamarkan sebagian (misal: `3174************`).
- **Nomor Pokok Wajib Pajak (NPWP)**: Disamarkan sebagian (misal: `01.***.***.*-***.***`).

Hanya pengguna dengan peran `PAYROLL_ADMIN` dan `HR_ADMIN` yang telah melalui otentikasi ganda yang memiliki hak membuka (*unmask*) data utuh untuk keperluan transfer bank atau pelaporan pajak resmi.

---

## 4. Enkripsi Data

- **Encryption in Transit**: Seluruh lalu lintas data antara peramban klien, aplikasi Next.js, dan database wajib menggunakan enkripsi **TLS 1.3**. Protokol HTTP biasa otomatis dialihkan ke HTTPS.
- **Encryption at Rest**: Database PostgreSQL dan penyimpanan dokumen kontrak kerja diamankan dengan enkripsi tingkat blok menggunakan algoritma **AES-256**.
- **Secret Management**: Tidak ada kunci API, rahasia database, atau kredensial pihak ketiga yang disimpan dalam kode sumber (*source code*). Seluruh rahasia disuntikkan saat *runtime* melalui sistem manajemen rahasia terpusat (*Secret Manager*).
