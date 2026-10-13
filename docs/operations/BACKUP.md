# DATABASE BACKUP & RESTORE DRILL PROCEDURE — NUSANTARA HRIS ENTERPRISE
## Automated Snapshot, Point-In-Time Recovery & Integrity Verification

**Classification:** CONFIDENTIAL  
**Status:** SEMI-PRODUCTION READY  
**Target Metrics:** Recovery Point Objective (RPO) < 1 Jam | Recovery Time Objective (RTO) < 4 Jam

---

## 1. Backup Policy & Schedule

1. **Daily Full Automated Backup:**
   - Dijalankan setiap hari pukul 02.00 WIB saat aktivitas sistem berada pada titik terendah.
   - Menggunakan snapshot terenkripsi (AES-256) pada level database Cloud SQL / PostgreSQL.
2. **Continuous WAL Archiving (Point-in-Time Recovery):**
   - Write-Ahead Logging (WAL) dialirkan ke storage terisolasi dengan akses terbatas (*least-privilege IAM service account*).
   - Memungkinkan pemulihan ke detik tertentu sebelum terjadi insiden korupsi data atau kesalahan manusia.
3. **Retention Policy:**
   - Backup harian disimpan selama 30 hari.
   - Snapshot mingguan disimpan selama 12 minggu.
   - Snapshot penutupan buku tahunan (*Payroll Annual Archive*) disimpan selama 10 tahun sesuai kepatuhan perpajakan DJP.

---

## 2. Restore Drill & Verification Procedure (Uji Pemulihan)

*Prinsip Keamanan: Backup yang tidak pernah diuji coba pemulihannya dianggap TIDAK ADA.* Tim SecOps wajib menjalankan uji pemulihan bulanan dengan 5 langkah:

1. **Create Isolated Sandbox Database:**
   - Siapkan instance database sandbox terisolasi tanpa koneksi jaringan ke lingkungan produksi.
2. **Restore Latest Snapshot:**
   - Jalankan pemulihan data dari snapshot backup terbaru ke instance sandbox.
3. **Verify Database Schema:**
   - Jalankan verifikasi integritas skema tabel, indeks, trigger, dan foreign key constraints.
4. **Verify Data Integrity:**
   - Hitung checksum record pada tabel kritis: `Employee`, `PayrollPeriod`, `PayrollItem`, `TaxRegulation`.
5. **Verify Critical Payroll Records:**
   - Jalankan kueri rekonsiliasi matematis: pastikan seluruh perhitungan PPh 21 TER, BPJS Kesehatan, dan take-home pay pada batch terakhir identik 100% dengan catatan audit produksi.
6. **Destruction:**
   - Hancurkan instance sandbox setelah laporan verifikasi berhasil ditandatangani.
