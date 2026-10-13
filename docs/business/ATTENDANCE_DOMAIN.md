# ATTENDANCE DOMAIN SPECIFICATION — NUSANTARA HRIS ENTERPRISE

Dokumen ini mendefinisikan aturan bisnis presensi digital, validasi batas wilayah (*geofencing*), dan integrasi jam kerja.

---

## 1. Core Logic & Invariants

- **Metode Kerja**:
  - **WFO (Work From Office)**: Wajib memverifikasi bahwa koordinat GPS perangkat berada dalam radius cabang kantor (default: radius **150 meter** dari pusat koordinat kantor).
  - **WFH (Work From Home)**: Memerlukan persetujuan penugasan kerja jarak jauh dari manajer divisi. Koordinat GPS dicatat sebagai log referensi tanpa pembatasan radius.
  - **Client / Field (Kunjungan Lapangan)**: Memerlukan input catatan nama klien/proyek dan foto lampiran aktivitas lapangan.
- **Jadwal Kerja & Shift**:
  - Shift Reguler Indonesia: 40 jam kerja per minggu (7 jam/hari untuk 6 hari kerja, atau 8 jam/hari untuk 5 hari kerja sesuai PP 35/2021).
  - Toleransi Keterlambatan (*Grace Period*): Dapat dikonfigurasi per cabang (default: 15 menit). Melewati batas waktu ini, status kehadiran otomatis diberi label `LATE` (Terlambat) dan dapat memicu pemotongan tunjangan kehadiran.

---

## 2. Inputs & Outputs

- **Input**: `employeeId`, `timestamp`, `latitude`, `longitude`, `attendanceType`, `deviceInfo`.
- **Processing**:
  - Hitung jarak Haversine antara koordinat perangkat dan koordinat cabang terdaftar:
    $$d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
  - Jika jarak $\le$ radius cabang, catat status `VERIFIED_GEOFENCE`.
- **Output**: Rekaman presensi harian, total durasi kerja efektif, status kepatuhan shift, dan ringkasan bulanan untuk modul Penggajian.
