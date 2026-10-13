# DATABASE ARCHITECTURE — NUSANTARA HRIS ENTERPRISE

Dokumen ini mendefinisikan desain skema database PostgreSQL, aturan tipe data, strategi pengindeksan (*indexing*), serta prinsip integritas data finansial nasional.

---

## 1. Engine & Database Rules

- **Database Engine**: PostgreSQL 15+ Enterprise.
- **Strict Decimal Arithmetic**:
  - Seluruh nilai mata uang (Gaji Pokok, Tunjangan, Potongan BPJS, PPh 21, Upah Lembur, Net Pay) **wajib** menggunakan tipe `Decimal(15, 2)` (atau `NUMERIC(15, 2)`).
  - Presisi ini mampu menampung nominal hingga ratusan triliun rupiah dengan akurasi 2 angka di belakang koma (sen), mencegah galat akumulasi pembulatan *floating-point*.
- **Timezone Standardization**:
  - Seluruh timestamp di database (`createdAt`, `updatedAt`, `clockInTime`, `timestamp`) disimpan dalam format **UTC**.
  - Konversi ke zona waktu lokal (**Asia/Jakarta - WIB / WITA / WIT**) dilakukan pada *presentation layer* saat data disajikan kepada pengguna.
- **Audit Columns Mandat**:
  - Setiap tabel transaksional wajib memuat kolom:
    - `id` (UUID v4)
    - `createdAt` (Timestamp UTC default `now()`)
    - `updatedAt` (Timestamp UTC auto-updated)
    - `createdBy` (User ID operator penginisiasi data)
    - `updatedBy` (User ID operator pengubah data)

---

## 2. Multi-Tenant Ready Entity Relationship

Setiap entitas bisnis di level operasional terhubung dengan `tenantId` (atau `companyId` yang memetakan ke tenant):

```text
┌─────────────────┐       ┌─────────────────┐
│     Tenant      │──────<│     Company     │
└─────────────────┘       └────────┬────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │ 1                       │ 1                       │ 1
         ▼ *                       ▼ *                       ▼ *
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     Branch      │       │   Department    │       │    Position     │
└────────┬────────┘       └────────┬────────┘       └────────┬────────┘
         │                         │                         │
         └─────────────────────────┼─────────────────────────┘
                                   │
                                   ▼ *
                          ┌─────────────────┐
                          │    Employee     │
                          └────────┬────────┘
                                   │
       ┌───────────────────────────┼───────────────────────────┐
       │ 1                         │ 1                         │ 1
       ▼ *                         ▼ *                         ▼ *
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│ AttendanceLog │           │ LeaveRequest  │           │OvertimeRequest│
└───────────────┘           └───────────────┘           └───────────────┘
       │
       └───────────────────────────┬───────────────────────────┘
                                   │ 1
                                   ▼ *
                          ┌─────────────────┐
                          │   PayrollItem   │
                          └────────▲────────┘
                                   │ *
                                   │ 1
                          ┌─────────────────┐
                          │  PayrollPeriod  │
                          └─────────────────┘
```

---

## 3. Strategi Pengindeksan (Indexing Strategy) Skala Nasional

Untuk menangani jutaan catatan karyawan dan ratusan juta log presensi tanpa degradasi performa (*slow query*), sistem menerapkan indeks komposit strategis:

| Tabel | Indeks Kolom | Tujuan Pengindeksan |
| :--- | :--- | :--- |
| `Employee` | `(tenantId, employeeId)` | Pencarian cepat berdasarkan nomor induk karyawan per tenant |
| `Employee` | `(tenantId, nikKtp)` | Validasi keunikan NIK dan pencarian data kependudukan |
| `Employee` | `(tenantId, departmentId, employmentStatus)` | Filter daftar karyawan aktif per departemen |
| `AttendanceLog` | `(tenantId, employeeId, date)` | Agregasi kehadiran bulanan karyawan tanpa pemindaian penuh |
| `AttendanceLog` | `(tenantId, date, status)` | Pelaporan rekap absensi harian perusahaan |
| `PayrollItem` | `(payrollPeriodId, employeeId)` | Pengambilan slip gaji spesifik periode |
| `AuditLog` | `(tenantId, module, timestamp DESC)` | Tampilan jejak audit real-time berurutan waktu |

---

## 4. Immutability of Financial Snapshots

Sekali periode payroll dikunci (`status = 'LOCKED'`):
- Baris pada `PayrollPeriod` dan `PayrollItem` menjadi **hanya-baca (*immutable*)**.
- Snapshot perhitungan pajak (`taxSnapshot`) dan jaminan sosial (`bpjsSnapshot`) disimpan dalam format JSON lengkap pada saat penguncian.
- Tidak ada operasi `UPDATE` atau `DELETE` yang diizinkan pada tabel ini oleh database triggers atau aplikasi.
- Jika terdapat kesalahan input data master di masa lalu, koreksi wajib dibuat melalui baris penyesuaian (*adjustment*) pada periode payroll berikutnya.
