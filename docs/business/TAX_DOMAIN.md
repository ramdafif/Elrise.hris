# TAX DOMAIN SPECIFICATION — NUSANTARA HRIS ENTERPRISE

Dokumen ini mendefinisikan implementasi teknis pemotongan Pajak Penghasilan Pasal 21 (PPh 21) di Indonesia berdasarkan **Peraturan Pemerintah (PP) No. 58 Tahun 2023** dan **Peraturan Menteri Keuangan (PMK) No. 168 Tahun 2023**.

---

## 1. Konsep PPh 21 TER (Tarif Efektif Rata-Rata)

Mulai 1 Januari 2024, pemotongan PPh 21 untuk masa pajak bulanan (Januari sampai dengan November) tidak lagi menggunakan estimasi tahunan biaya jabatan dan tarif progresif Pasal 17 ayat (1) huruf a UU HPP, melainkan menggunakan **Tarif Efektif Bulanan (TER Bulanan)** yang diklasifikasikan ke dalam 3 kategori:

### Kategori TER Bulanan
1. **Kategori A**:
   - Status PTKP: **TK/0** (PTKP Rp 54.000.000), **TK/1** (Rp 58.500.000), **K/0** (Rp 58.500.000).
   - Memiliki 44 lapisan rentang penghasilan bruto (Tarif 0% untuk bruto $\le$ Rp 5.400.000 hingga 34% untuk bruto > Rp 1.400.000.000).
2. **Kategori B**:
   - Status PTKP: **TK/2** (Rp 63.000.000), **TK/3** (Rp 67.500.000), **K/1** (Rp 63.000.000), **K/2** (Rp 67.500.000).
   - Memiliki 40 lapisan rentang penghasilan bruto (Tarif 0% untuk bruto $\le$ Rp 6.200.000 hingga 34%).
3. **Kategori C**:
   - Status PTKP: **K/3** (Rp 72.000.000).
   - Memiliki 41 lapisan rentang penghasilan bruto (Tarif 0% untuk bruto $\le$ Rp 6.600.000 hingga 34%).

---

## 2. Formula Pemotongan Masa Pajak Bulanan (Jan – Nov)

$$\text{PPh 21 Terutang} = \text{Penghasilan Bruto Sebulan} \times \text{Tarif Efektif TER Kategori}$$

Contoh Kasus:
- Karyawan status **K/1** (Kategori TER B).
- Penghasilan bruto bulan bersangkutan: **Rp 10.000.000**.
- Berdasarkan tabel Lampiran PP 58/2023, rentang bruto Rp 9.650.000 s.d Rp 10.050.000 dikenakan tarif **2.0%**.
- PPh 21 dipotong: $10.000.000 \times 2\% = \text{Rp } 200.000$.

---

## 3. Formula Rekonsiliasi Masa Pajak Terakhir (Desember)

Pada masa pajak Desember (atau masa pajak saat pegawai tetap berhenti bekerja):
1. Hitung seluruh penghasilan bruto selama 1 tahun kalender (Januari s.d Desember).
2. Kurangkan biaya pengurang resmi:
   - Biaya Jabatan: 5% dari bruto (maksimal **Rp 500.000/bulan** atau **Rp 6.000.000/tahun**).
   - Iuran Pensiun / JHT yang dibayar sendiri oleh pekerja.
3. Hitung Penghasilan Neto Setahun = Bruto Setahun - Pengurang.
4. Hitung Penghasilan Kena Pajak (PKP) = Neto Setahun - PTKP.
5. Hitung PPh 21 Terutang Setahun menggunakan tarif progresif Pasal 17 ayat (1) huruf a UU HPP:
   - 0 s.d Rp 60.000.000: 5%
   - > Rp 60.000.000 s.d Rp 250.000.000: 15%
   - > Rp 250.000.000 s.d Rp 500.000.000: 25%
   - > Rp 500.000.000 s.d Rp 5.000.000.000: 30%
   - > Rp 5.000.000.000: 35%
6. PPh 21 Masa Desember = PPh 21 Terutang Setahun - Akumulasi PPh 21 yang telah dipotong pada masa Januari s.d November.
