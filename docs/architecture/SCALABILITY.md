# SCALABILITY ARCHITECTURE — NUSANTARA HRIS ENTERPRISE

Dokumen ini menguraikan strategi skalabilitas teknis untuk menangani pertumbuhan beban dari ratusan hingga jutaan rekaman karyawan secara stabil dan efisien.

---

## 1. Scale Target Metrics

Sistem dirancang untuk mengakomodasi target beban kerja skala nasional berikut:
- **Perusahaan Aktif**: Hingga 100.000 tenant perusahaan.
- **Catatan Karyawan Master**: 1.000.000+ profil karyawan.
- **Log Presensi Bulanan**: 25.000.000+ rekaman per bulan (~1 juta transaksi Clock In serentak pada rentang pukul 07:30 – 08:30 WIB).
- **Slip Gaji Bulanan**: 1.000.000 slip gaji diproses tuntas dalam jendela waktu 4 jam pada hari gajian (tanggal 25).

---

## 2. Database Partitioning Strategy (Data Presensi & Log Audit)

Tabel dengan laju pertumbuhan data sangat tinggi (`AttendanceLog` dan `AuditLog`) tidak boleh dibiarkan menjadi satu tabel raksasa (*monolithic table*) yang menghambat laju query:

```sql
-- Partisi Tabel AttendanceLog berdasarkan Rentang Waktu Bulanan
CREATE TABLE "AttendanceLog" (
    id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    date DATE NOT NULL,
    clock_in TIMESTAMPTZ,
    clock_out TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL,
    PRIMARY KEY (id, date)
) PARTITION BY RANGE (date);

-- Partisi Spesifik per Bulan
CREATE TABLE attendance_log_2026_09 PARTITION OF "AttendanceLog"
    FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');

CREATE TABLE attendance_log_2026_10 PARTITION OF "AttendanceLog"
    FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
```

Keuntungan Partisi:
1. **Partition Pruning**: Query presensi bulanan hanya memindai partisi bulan bersangkutan, menghemat 95% I/O disk.
2. **Archival Ringan**: Data absensi berusia lebih dari 3 tahun dapat dialihkan ke penyimpanan dingin (*cold storage*) hanya dengan melepaskan partisi (*detach partition*) tanpa membebani performa tabel aktif.

---

## 3. Read/Write Splitting & Replica Pools

Untuk menangani pelaporan analitik HR dan pembuatan slip gaji massal tanpa mengganggu pencatatan absensi real-time:
- **Primary Database (Write Master)**: Menangani operasi tulis kritis (`Clock In/Out`, persetujuan cuti, penguncian payroll).
- **Read-Replica Pool**: Mengalirkan data via replikasi asinkron untuk melayani dashboard analitik eksekutif, pencarian master karyawan, dan unduhan riwayat audit.

---

## 4. Cursor-Based Pagination Mandat

Untuk seluruh endpoint API yang menyajikan kumpulan data besar (`/api/v1/employees`, `/api/v1/attendance`):
- **Dilarang**: Penggunaan pagination konvensional `OFFSET / LIMIT` pada tabel besar karena performanya menurun drastis seiring besarnya nilai offset.
- **Wajib**: Menggunakan **Cursor-Based Pagination** berbasis pasangan indeks `(createdAt, id)` untuk menjamin waktu respon konstan (*O(1) complexity*).
