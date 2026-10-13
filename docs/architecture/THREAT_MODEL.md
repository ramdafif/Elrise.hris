# SECURITY THREAT MODEL — NUSANTARA HRIS ENTERPRISE

Dokumen ini mengidentifikasi potensi ancaman keamanan terhadap aset data HRIS nasional, tingkat dampak, probabilitas keterjadian, serta mekanisme mitigasi preventif dan reaktif.

---

## Threat Modeling Matrix

| ID | Vektor Ancaman (Threat Vector) | Dampak | Probabilitas | Strategi Mitigasi Nusantara HRIS |
| :--- | :--- | :---: | :---: | :--- |
| **TM-01** | **Kebocoran Data Lintas Tenant (Cross-Tenant Data Leak)** | **Kritis** | Rendah | Prisma middleware yang secara otomatis menyuntikkan klausa `tenantId` pada setiap query database; pengujian isolasi tenant secara otomatis pada pipeline CI/CD. |
| **TM-02** | **Manipulasi Nominal Payroll (Payroll Fraud)** | **Kritis** | Rendah | Snapshot perhitungan tidak dapat diubah pasca-kunci (`LOCKED`); pemisahan peran (*Segregation of Duties*) antara kalkulator (Payroll Admin) dan penyetujui (Finance Director); audit trail lengkap. |
| **TM-03** | **Penyusupan Akun Karyawan / Manajer (Account Takeover)** | **Tinggi** | Sedang | Penguncian akun setelah 5x gagal sandi; pembatasan sesi peramban; MFA wajib bagi peran administratif; cookie HTTP-Only. |
| **TM-04** | **Pemalsuan Lokasi Presensi (GPS Spoofing)** | **Sedang** | Tinggi | Validasi ganda: koordinat GPS browser + deteksi sinyal emulator/mock location; pencatatan alamat IP jaringan kantor sebagai verifikasi sekunder. |
| **TM-05** | **Eksfiltrasi Data Pribadi Karyawan (PII Harvesting)** | **Tinggi** | Rendah | Penyamaran otomatis (*Masking*) pada NIK, NPWP, dan nomor rekening di antarmuka umum; pembatasan laju ekspor data (*Rate Limiting*) maksimal 50 baris per unduhan tanpa otorisasi Super Admin. |
| **TM-06** | **Injeksi Kode SQL (SQL Injection)** | **Kritis** | Sangat Rendah | Penggunaan Prisma ORM dengan parameterized queries secara penuh; pelarangan raw query tanpa sanitasi ketat. |
| **TM-07** | **Unggahan Berkas Berbahaya (Malicious File Upload)** | **Tinggi** | Sedang | Pemeriksaan Magic Byte berkas (PDF/JPG/PNG); pembatasan ukuran berkas maksimal 5MB; penyimpanan berkas terisolasi di Object Storage tanpa izin eksekusi. |
| **TM-08** | **Eskalasi Hak Akses (Privilege Escalation)** | **Kritis** | Rendah | Otorisasi peran (RBAC) divalidasi ulang di level server pada setiap Server Action dan API endpoint; verifikasi kepemilikan data sebelum mengizinkan pembaruan. |
