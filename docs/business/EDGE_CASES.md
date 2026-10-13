# EDGE CASES & EXCEPTION HANDLING — NUSANTARA HRIS ENTERPRISE

Dokumen ini mendokumentasikan aturan penanganan kondisi khusus (*edge cases*) dan skenario batas pada pemrosesan HR & Payroll Indonesia.

---

## 1. Karyawan Bergabung di Tengah Bulan (Mid-Month Join)
- **Aturan Prorata**:
  - Gaji pokok dan tunjangan tetap dihitung berdasarkan rasio hari kerja aktif terhadap total hari kerja resmi dalam bulan kalender berjalan:
    $$\text{Gaji Prorata} = \frac{\text{Jumlah Hari Kerja Aktif}}{\text{Total Hari Kerja Bulan Berjalan}} \times (\text{Gaji Pokok} + \text{Tunjangan Tetap})$$
- **Pajak PPh 21**: Bruto prorata tetap dikenakan tarif PPh 21 TER sesuai tabel kategori status PTKP yang bersangkutan.

---

## 2. Karyawan Resign / Keluar di Tengah Bulan (Mid-Month Termination)
- Hak upah dihitung secara prorata hingga hari kerja terakhir efektif.
- **Cuti Tahunan Tersisa**: Saldo hak cuti yang belum diambil dikonversi menjadi rupiah sebagai komponen Uang Penggantian Hak (UPH):
  $$\text{Nilai Pengganti Cuti} = \text{Sisa Hari Cuti} \times \frac{\text{Upah Pokok} + \text{Tunjangan Tetap}}{\text{Hari Kerja Sebulan}}$$

---

## 3. Tunjangan Hari Raya (THR) Keagamaan (Permenaker No. 6 Tahun 2016)
- **Masa Kerja $\ge$ 12 Bulan Terus Menerus**: Berhak atas **1 (satu) bulan upah penuh** (Gaji Pokok + Tunjangan Tetap).
- **Masa Kerja $\ge$ 1 Bulan Namun < 12 Bulan**: Dihitung secara proporsional:
  $$\text{THR Proporsional} = \frac{\text{Masa Kerja (Bulan)}}{12} \times (\text{Gaji Pokok} + \text{Tunjangan Tetap})$$
- **Pekerja Lepas / Harian**: Dihitung berdasarkan rata-rata upah yang diterima dalam 12 bulan terakhir.

---

## 4. Pelampauan Batas Plafon Upah BPJS (Wage Ceiling Cap)
- **BPJS Kesehatan**: Batas maksimal upah Rp 12.000.000. Jika gaji karyawan Rp 25.000.000, iuran pekerja tetap dihitung dari Rp 12.000.000 ($1\% = \text{Rp } 120.000$).
- **BPJS Ketenagakerjaan Jaminan Pensiun (JP)**: Batas plafon upah resmi Rp 10.042.300. Jika gaji karyawan Rp 25.000.000, iuran JP pekerja tetap dihitung dari Rp 10.042.300 ($1\% = \text{Rp } 100.423$).
- **JHT & PPh 21**: Dihitung berdasarkan nilai riil tanpa pembatasan plafon atas.

---

## 5. Unpaid Leave (Cuti di Luar Tanggungan)
- Memotong gaji pokok secara proporsional terhadap hari ketidakhadiran:
  $$\text{Potongan Unpaid Leave} = \frac{\text{Hari Cuti Tanpa Upah}}{\text{Total Hari Kerja}} \times \text{Gaji Pokok}$$
- Potongan ini mengurangi Penghasilan Bruto sebelum pengenaan PPh 21 TER dan iuran jaminan sosial.

---

## 6. Periode Payroll Dikunci (Payroll Locked Safeguard)
- Dilarang keras memodifikasi data `PayrollItem` dari periode yang berstatus `LOCKED`.
- Jika terdapat kesalahan data di masa lalu (misal: lembur yang terlambat dilaporkan), koreksi dimasukkan sebagai baris penyesuaian (*Retroactive Adjustment*) pada periode payroll bulan berjalan berikutnya, disertai pencatatan alasan wajib pada `AuditLog`.
