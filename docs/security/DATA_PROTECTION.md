# DATA PROTECTION & PRIVACY SPECIFICATION — NUSANTARA HRIS ENTERPRISE
## Sensitive Data Classification, Masking, and Cryptographic Standards

**Classification:** CONFIDENTIAL  
**Status:** SEMI-PRODUCTION READY  
**Compliance Standard:** UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP)

---

## 1. Sensitive Data Classification Scheme

Seluruh entitas data dalam Nusantara HRIS dikategorikan ke dalam 4 tingkatan klasifikasi:

| Klasifikasi | Definisi & Contoh Data | Kontrol Akses & Proteksi |
|---|---|---|
| **PUBLIC** | Nama perusahaan, kode perusahaan, kalender libur nasional | Boleh diakses tanpa otentikasi ketat. |
| **INTERNAL** | Nama departemen, judul jabatan, jam kerja shift, memo internal | Memerlukan otentikasi pengguna terdaftar. |
| **CONFIDENTIAL** | Data presensi, pengajuan cuti, audit logs, performa kerja | Dibatasi oleh RBAC, audit logging aktif pada pembacaan. |
| **HIGHLY_CONFIDENTIAL** | NIK KTP, NPWP, Rekening Bank, Gaji Pokok, Tunjangan, PPh 21, BPJS | Enkripsi at-rest, data masking di sisi server, otorisasi ganda. |

---

## 2. Server-Side Data Masking Engine

Data bertingkat `HIGHLY_CONFIDENTIAL` wajib dimasking oleh server sebelum dikirimkan ke client/browser, kecuali pemanggil memiliki izin otorisasi spesifik (misal: Finance Admin saat memproses transfer bank):

- **Nomor Induk Kependudukan (NIK KTP 16 digit):**
  - Pola Asli: `3171012304920005`
  - Pola Masked: `************0005` (hanya 4 digit terakhir yang ditampilkan)
- **Nomor Pokok Wajib Pajak (NPWP 16 digit / NIK Format):**
  - Pola Asli: `09.234.567.8-012.000`
  - Pola Masked: `**.***.***.*-***.000`
- **Nomor Rekening Bank:**
  - Pola Asli: `5271928391`
  - Pola Masked: `******8391`
- **Gaji & Take-Home Pay (Salary Redaction):**
  - Ditampilkan penuh hanya jika pemanggil adalah pemilik rekening (`actor.employeeId === target.id`) atau memegang izin `employee.salary.read` / `payroll.read`.
  - Untuk pengguna tanpa izin (misal: Auditor Umum atau Rekan Kerja), nilai di-redact menjadi `Rp ***.***.***`.

---

## 3. Cryptographic Standards

1. **In-Transit Encryption:**
   - Mewajibkan TLS 1.3 / 1.2 dengan HSTS (`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`).
2. **Application-Level Encryption (At-Rest):**
   - Menggunakan cipher standar industri **AES-256-GCM** (Galois/Counter Mode) yang menyediakan *Authenticated Encryption with Associated Data (AEAD)*.
   - Setiap enkripsi menggunakan *Initialization Vector (IV)* acak 12 byte dan menghasilkan *Authentication Tag* 16 byte untuk mencegah tampering data.
   - Kunci enkripsi (`ENCRYPTION_KEY`) disimpan di environment secret / KMS, tidak pernah di hardcode di dalam kode sumber.
