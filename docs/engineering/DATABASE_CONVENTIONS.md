# DATABASE CONVENTIONS & MIGRATION POLICY — NUSANTARA HRIS ENTERPRISE

Dokumen ini mengatur konvensi penamaan database PostgreSQL dan kebijakan ketat migrasi data tanpa *downtime*.

---

## 1. Naming Conventions

- **Tabel & Model Prisma**: Menggunakan format `PascalCase` di skema Prisma (misal: `Employee`, `PayrollPeriod`, `AuditLog`) dan dipetakan ke nama tabel jamak `snake_case` atau `PascalCase` konsisten.
- **Kolom / Fields**: Menggunakan format `camelCase` di Prisma dan `snake_case` di PostgreSQL (misal: `tenant_id`, `created_at`, `base_salary`).
- **Primary Keys**: Selalu menggunakan nama `id` bertipe data `UUID` (UUID v4).
- **Foreign Keys**: Menggunakan pola `<entity>Id` (misal: `companyId`, `employeeId`, `departmentId`).

---

## 2. Zero-Downtime Migration Policy (4-Phase Migration)

> **ATURAN MUTLAK PRODUKSI:**  
> Dilarang keras menjalankan perintah destruktif (`DROP COLUMN`, `DROP TABLE`, `ALTER COLUMN TYPE`) secara langsung di database produksi yang sedang aktif.

Jika perubahan skema database diperlukan, wajib menerapkan alur migrasi 4 tahap:

### Phase 1: Expand (Add New Structure)
- Tambahkan kolom baru yang bersifat `NULLABLE` atau memiliki nilai default yang aman.
- Contoh: Menambahkan kolom `fullName` untuk menggantikan `firstName` dan `lastName`. Kolom lama dan baru hidup berdampingan.

### Phase 2: Dual-Writing & Backfill (Migrate Data)
- Aplikasi diperbarui untuk menulis data ke kolom baru dan kolom lama secara bersamaan (*dual-write*).
- Jalankan script migrasi data latar belakang (*backfill job*) untuk mengisi nilai kolom baru dari baris-baris data lama.

### Phase 3: Switch Read Path
- Perbarui kode aplikasi untuk hanya membaca dan menulis ke kolom baru (`fullName`). Kolom lama tidak lagi digunakan oleh aplikasi.

### Phase 4: Contract (Remove Old Structure)
- Setelah diverifikasi selama sekurang-kurangnya 1 siklus rilis bahwa tidak ada dependensi yang tertinggal, hapus kolom lama (`firstName`, `lastName`) dalam migrasi terpisah.
