# OVERTIME DOMAIN SPECIFICATION — NUSANTARA HRIS ENTERPRISE

Dokumen ini mendefinisikan formula perhitungan upah lembur resmi di Indonesia berdasarkan **Peraturan Pemerintah (PP) No. 35 Tahun 2021** tentang Waktu Kerja, Hubungan Kerja, Alih Daya, Waktu Istirahat, dan Pemutusan Hubungan Kerja.

---

## 1. Formula Upah Per Jam Dasar (Hourly Base Rate)

Sesuai PP 35/2021 Pasal 32 ayat (1):
$$\text{Upah Sejam} = \frac{\text{Gaji Pokok} + \text{Tunjangan Tetap}}{173}$$

Angka 173 merupakan pembagi standar ketenagakerjaan Indonesia yang berasal dari rata-rata jam kerja per bulan:
$$\frac{52 \text{ minggu} \times 40 \text{ jam/minggu}}{12 \text{ bulan}} \approx 173.33 \rightarrow 173 \text{ jam}$$

---

## 2. Pengali Bertingkat Lembur (Tiered Multipliers)

### A. Lembur pada Hari Kerja Biasa (Workday Overtime)
- **Jam Pertama (Jam ke-1)**: Dibayar sebesar **1.5x upah sejam**.
- **Jam Berikutnya (Jam ke-2 dst)**: Dibayar sebesar **2.0x upah sejam**.

### B. Lembur pada Hari Istirahat Mingguan atau Hari Libur Resmi (Rest Day / Holiday)
Untuk perusahaan dengan sistem 5 hari kerja per minggu (8 jam/hari):
- **Jam ke-1 s.d ke-8**: Dibayar sebesar **2.0x upah sejam**.
- **Jam ke-9**: Dibayar sebesar **3.0x upah sejam**.
- **Jam ke-10 s.d ke-12**: Dibayar sebesar **4.0x upah sejam**.

---

## 3. Batasan Hukum (Compliance Safeguards)

Sesuai PP 35/2021 Pasal 26:
- Waktu kerja lembur hanya dapat dilakukan paling banyak **4 (empat) jam dalam 1 (satu) hari** dan **18 (delapan belas) jam dalam 1 (satu) minggu**.
- Lembur wajib didasari oleh Surat Perintah Kerja Lembur (SPKL) tertulis atau persetujuan digital dari pekerja bersangkutan.
- Sistem secara otomatis menolak pengajuan lembur yang melebihi batas legal ini dan memberikan peringatan kepatuhan kepada manajer.
