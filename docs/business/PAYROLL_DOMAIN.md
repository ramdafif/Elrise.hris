# PAYROLL DOMAIN SPECIFICATION — NUSANTARA HRIS ENTERPRISE

Dokumen ini merupakan spesifikasi komprehensif dari mesin penggajian Nusantara HRIS, mencakup agregasi pendapatan bruto, integrasi potongan jaminan sosial, pemotongan pajak PPh 21, pembuatan slip gaji, dan format pembayaran perbankan.

---

## 1. Mathematical Equation of Net Pay

Perhitungan upah bersih (*Take-Home Pay*) menganut persamaan matematis deterministik:

$$\text{Net Pay} = \text{Gross Earnings} - (\text{Employee Statutory Deductions} + \text{PPh 21 Tax} + \text{Other Deductions})$$

Di mana:
- **Gross Earnings (Penghasilan Bruto)**:
  $$\text{Gross} = \text{Gaji Pokok} + \text{Tunjangan Tetap} + \text{Tunjangan Variabel} + \text{Upah Lembur PP 35} + \text{Bonus/THR}$$
- **Employee Statutory Deductions (Potongan Karyawan)**:
  $$\text{BPJS Kes (1\%)} + \text{BPJS TK JHT (2\%)} + \text{BPJS TK JP (1\%)}$$
- **PPh 21 Tax**:
  Pajak dihitung berdasarkan metode PPh 21 TER (PP 58/2023) menggunakan tabel tarif efektif resmi.

---

## 2. Komponen Beban Perusahaan (Employer On-Cost)

Nusantara HRIS secara transparan menghitung total biaya tenaga kerja (*Total Cost of Workforce*) yang ditanggung oleh perusahaan:
- **BPJS Kesehatan (4%)**: Maksimal basis upah Rp 12.000.000 (Iuran pemberi kerja maks: Rp 480.000).
- **BPJS TK Jaminan Hari Tua (3.7%)**: Berbasis total upah bruto.
- **BPJS TK Jaminan Pensiun (2%)**: Maksimal basis upah Rp 10.042.300 (Iuran pemberi kerja maks: Rp 200.846).
- **BPJS TK Jaminan Kecelakaan Kerja (JKK)**: 0.24% s.d 1.74% (sesuai tingkat risiko industri).
- **BPJS TK Jaminan Kematian (JKM)**: 0.30%.

Informasi ini wajib dicantumkan pada slip gaji elektronik karyawan untuk membangun transparansi hubungan industrial.

---

## 3. Siklus Hidup Periode Penggajian (Lifecycle States)

```text
[DRAFT] ──> [CALCULATING] ──> [REVIEW / VERIFIED] ──> [LOCKED] ──> [PAID]
```
- **DRAFT**: Periode dibuka; komponen gaji masih dapat disesuaikan.
- **CALCULATING**: Batch worker sedang mengeksekusi perhitungan PPh 21 dan BPJS seluruh karyawan.
- **REVIEW**: Hasil perhitungan siap ditinjau oleh Finance Controller dan HR Director.
- **LOCKED**: Periode dikunci secara permanen. Seluruh angka menjadi *immutable snapshot*. File transfer perbankan dan slip gaji resmi digenerate.
- **PAID**: Rekonsiliasi pencairan bank selesai; status pembayaran ditutup.
