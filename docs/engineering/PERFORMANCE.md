# PERFORMANCE BUDGET & MONITORING — NUSANTARA HRIS ENTERPRISE

Dokumen ini mendefinisikan anggaran kinerja (*Performance Budget*), ambang batas latensi, dan panduan optimasi basis data.

---

## 1. Performance Budgets

| Komponen / Aksi Sistem | Target Ambang Batas | Kondisi Beban |
| :--- | :---: | :--- |
| **Clock In / Out (Presensi GPS)** | **< 300 ms** | 1.000 transaksi bersamaan per detik |
| **Buka Dasbor Eksekutif HR** | **< 800 ms** | Pemuatan awal (*First Contentful Paint*) |
| **Pencarian Data Master Karyawan** | **< 150 ms** | Database 100.000 karyawan terindeks |
| **Kalkulasi Payroll 1 Karyawan** | **< 5 ms** | Komputasi deterministik murni |
| **Kalkulasi Payroll Batch 1.000 Staf**| **< 5 detik** | Background queue worker |
| **Generate Slip Gaji PDF** | **< 500 ms / file** | Serverless render worker |

---

## 2. Anti-Patterns to Ban (Pencegahan Masalah Kinerja)

1. **N+1 Database Query**:
   - Dilarang keras melakukan query di dalam loop:
     ```typescript
     // ❌ BURUK: N+1 Queries
     for (const emp of employees) {
       const attendance = await db.attendance.findMany({ where: { employeeId: emp.id } });
     }

     //  BAIK: Single Joined / In-Query
     const attendance = await db.attendance.findMany({
       where: { employeeId: { in: employees.map(e => e.id) } }
     });
     ```
2. **Missing Indexes pada Foreign Keys**: Seluruh kolom relasi foreign key dan kolom filter (`tenantId`, `status`, `date`) wajib memiliki indeks B-Tree.
3. **Unbounded Queries**: Dilarang menjalankan query `findMany()` tanpa klausa batasan `take` / pagination.
