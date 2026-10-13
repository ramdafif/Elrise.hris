# PRODUCT PRINCIPLES — NUSANTARA HRIS ENTERPRISE

Prinsip-prinsip ini memandu setiap keputusan desain produk, arsitektur teknis, dan interaksi pengguna di seluruh modul Nusantara HRIS.

---

## 1. Accuracy First (Akurasi Finansial Tanpa Kompromi)
Penggajian adalah titik paling sensitif dalam hubungan industrial antara perusahaan dan pekerja. Kesalahan perhitungan upah dapat merusak kepercayaan karyawan dan menimbulkan perselisihan ketenagakerjaan.
- Seluruh perhitungan nominal uang wajib menggunakan tipe presisi `Decimal`.
- Dilarang keras menggunakan tipe `float` atau `double` murni yang rentan *floating-point inaccuracies*.
- Setiap komponen gaji (kotor, pajak, potongan jaminan sosial, lembur, dan gaji bersih) harus saling mengunci secara matematis: `Net Pay = Gross Pay - (Employee Deductions + Tax)`.

## 2. Compliance by Design (Kepatuhan Terintegrasi Sejak Awal)
Kepatuhan hukum ketenagakerjaan dan perpajakan Indonesia bukan merupakan fitur tambahan atau pemikiran belakangan (*afterthought*), melainkan fondasi utama sistem.
- Regulasi seperti PPh 21 TER (PP 58/2023 & PMK 168/2023), upah lembur berjenjang (PP 35/2021), serta program BPJS Ketenagakerjaan dan Kesehatan dibangun langsung ke dalam mesin inti.
- Sistem harus secara otomatis memperingatkan pengguna jika ada kebijakan perusahaan yang melanggar batas legal regulasi (misalnya: lembur melebihi 4 jam/hari atau 18 jam/minggu).

## 3. Security & Privacy by Default
Data karyawan mencakup Informasi Pribadi yang Sangat Rahasia (*Personally Identifiable Information* - PII) dan data finansial.
- Data sensitif seperti NIK, NPWP, dan nomor rekening bank dilindungi dengan prinsip *masking* pada antarmuka visual.
- Hak akses dipisahkan secara ketat menggunakan *Role-Based Access Control* (RBAC) di sisi server.
- Seluruh komunikasi data wajib melalui saluran terenkripsi TLS/HTTPS.

## 4. Auditability (Dapat Diaudit Setiap Saat)
Setiap keputusan dan perubahan data penting dalam organisasi harus memiliki jejak yang tidak dapat dihapus atau diubah (*immutable audit trail*).
- Setiap tindakan pembuatan, perubahan, persetujuan, penolakan, dan penguncian penggajian mencatat: *siapa* yang melakukan, *kapan* waktu pastinya (WIB), *apa* nilai sebelum dan sesudah perubahan, serta *alasan* operasionalnya.
- Riwayat audit siap digunakan untuk keperluan audit internal, audit KAP publik, maupun verifikasi pemeriksaan pajak DJP dan pengawas ketenagakerjaan.

## 5. Configuration over Hardcoding
Regulasi hukum, kebijakan perusahaan, dan tarif premi bersifat dinamis dan akan terus berkembang di masa depan.
- Dilarang keras menuliskan angka tarif pajak, batas upah maksimal BPJS, atau plafon PTKP secara *hardcoded* di tengah fungsi logika.
- Seluruh variabel ini wajib disimpan dalam struktur data konfigurasi atau tabel aturan berversi (*rule versioning*) yang memiliki atribut tanggal berlaku (`effectiveFrom` dan `effectiveUntil`).

## 6. Modular Architecture (Modular Monolith)
Modul-modul sistem (Karyawan, Presensi, Cuti, Lembur, Payroll, Pajak, BPJS) bersifat independen namun berkomunikasi melalui kontrak antarmuka yang terdefinisi jelas (*clean contracts*).
- Modul Penggajian tidak boleh bergantung langsung pada tampilan UI modul Presensi, melainkan mengonsumsi data rekapitulasi kehadiran melalui API atau service contract.
- Pemisahan batas domain ini memungkinkan modul tertentu untuk diekstraksi menjadi microservice mandiri di masa depan jika skala transaksi nasional membutuhkannya.

## 7. User Experience (Elegan, Cepat, dan Manusiawi)
Aplikasi HR enterprise tidak boleh kaku, lambat, membingungkan, atau dipenuhi istilah teknis yang rumit.
- Desain antarmuka dirancang bersih, memiliki hierarki visual yang jelas, dan responsif optimal di komputer desktop maupun perangkat telepon pintar karyawan.
- Pengguna diberikan umpan balik interaktif secara langsung, seperti kalkulasi lembur live dan ringkasan slip gaji instan tanpa harus menunggu proses reload halaman.

## 8. Backward Compatibility (Kompatibilitas ke Belakang)
Perubahan arsitektur, pembaruan versi skema database, atau adopsi regulasi hukum baru tidak boleh merusak data masa lalu atau menghentikan alur kerja yang sudah berjalan.
- Data penggajian historis yang telah dikunci (*locked*) bersifat permanen dan tidak akan berubah nilainya meskipun tarif pajak di tahun berikutnya diperbarui oleh pemerintah.
