# GOVERNMENT REGULATION REGISTRY — NUSANTARA HRIS ENTERPRISE

Dokumen ini merupakan registri resmi peraturan perundang-undangan Republik Indonesia yang menjadi dasar hukum implementasi sistem Nusantara HRIS.

---

## Regulatory Registry Index

| Regulasi | Nomor & Tahun | Instansi Berwenang | Tanggal Efektif | Domain Kepatuhan | Implementasi Internal | Status Verifikasi |
| :--- | :--- | :--- | :---: | :--- | :--- | :---: |
| **Tarif Pemotongan PPh 21 TER** | PP No. 58 Tahun 2023 | Kemenkeu RI / DJP | 1 Jan 2024 | Perpajakan Karyawan | `lib/payrollEngine.ts` (Tabel TER A, B, C) | **Aktif & Terverifikasi** |
| **Petunjuk Pelaksanaan PPh 21** | PMK No. 168 Tahun 2023 | Kemenkeu RI / DJP | 1 Jan 2024 | Tata Cara Pemotongan | Klasifikasi Status PTKP & Bukti Potong | **Aktif & Terverifikasi** |
| **Waktu Kerja, Lembur, PKWT, PHK**| PP No. 35 Tahun 2021 | Kemnaker RI | 2 Feb 2021 | Ketenagakerjaan | Formula lembur 1/173 & Pengali Berjenjang | **Aktif & Terverifikasi** |
| **Cipta Kerja (Ketenagakerjaan)** | UU No. 6 Tahun 2023 | DPR RI & Presiden RI | 31 Mar 2023 | Payung Hukum HR | Hak Cuti, Pesangon, Upah Minimum | **Aktif & Terverifikasi** |
| **Ketenagakerjaan (Pokok)** | UU No. 13 Tahun 2003 | Depnaker RI | 25 Mar 2003 | Landasan Ketenagakerjaan | Kuota Cuti, Aturan Upah Pokok 75% | **Aktif & Terverifikasi** |
| **Jaminan Kesehatan Nasional** | Perpres No. 64 Tahun 2020 | BPJS Kesehatan | 1 Jul 2020 | Jaminan Kesehatan | Iuran 1% Pekerja, 4% Perusahaan, Plafon 12 Juta | **Aktif & Terverifikasi** |
| **Penyelenggaraan Jaminan Pensiun**| PP No. 45 Tahun 2015 | BPJS Ketenagakerjaan | 1 Jul 2015 | Jaminan Hari Tua & Pensiun | Plafon JP Rp 10.042.300 / bulan | **Aktif & Terverifikasi** |
| **Tunjangan Hari Raya (THR)** | Permenaker No. 6 Tahun 2016 | Kemnaker RI | 8 Mar 2016 | Hak Hari Raya Keagamaan | Kalkulator Proporsional Masa Kerja | **Aktif & Terverifikasi** |
| **Pelindungan Data Pribadi (UU PDP)**| UU No. 27 Tahun 2022 | Kominfo / Lembaga PDP | 17 Okt 2024 | Privasi & Keamanan Informasi | Masking NIK/NPWP/Bank & Audit Trail | **Aktif & Terverifikasi** |

---

## Aturan Pembaruan Regulasi (Regulation Versioning Rule)

> **ATURAN MUTLAK:**  
> Jika pemerintah menerbitkan peraturan baru yang mengubah tarif, formula, atau batas upah:
> 1. Dilarang menimpa (*overwrite*) data konfigurasi aturan lama.
> 2. Buat versi baru dalam skema konfigurasi dengan menetapkan atribut `effectiveFrom` dan `effectiveUntil`.
> 3. Perhitungan historis payroll masa lalu wajib tetap mengevaluasi versi aturan yang berlaku pada periode tanggal tersebut.
