# INCIDENT RESPONSE PROTOCOL — NUSANTARA HRIS ENTERPRISE

Dokumen ini mendefinisikan hierarki keparahan insiden (*Incident Severity Hierarchy*), alur eskalasi, dan protokol komunikasi darurat jika terjadi gangguan layanan HRIS.

---

## 1. Incident Severity Classification

| Tingkat Keparahan | Definisi & Dampak Operasional | Target Respon Awal | Target Resolusi |
| :---: | :--- | :---: | :---: |
| **P0 - Kritis (Critical Outage)** | Sistem mati total; payroll macet pada hari gajian (tanggal 25 s.d akhir bulan); kebocoran data sensitif karyawan (PII leak). | **< 15 Menit** | **< 2 Jam** |
| **P1 - Tinggi (High Impact)** | Presensi Clock In/Out gagal di seluruh cabang; penghitungan PPh 21 menghasilkan galat sistemik; fungsi persetujuan cuti lumpuh. | **< 30 Menit** | **< 4 Jam** |
| **P2 - Sedang (Medium Impact)** | Fitur ekspor bank BCA/Mandiri gagal untuk cabang tertentu; keterlambatan pengiriman email slip gaji; penurunan performa query dasbor. | **< 2 Jam** | **< 12 Jam** |
| **P3 - Rendah (Low Impact)** | Kesalahan penulisan teks minor pada antarmuka; glitch tampilan pada resolusi layar tertentu; masalah kosmetik visual. | **< 1 Hari Kerja**| **Sprint Berikutnya** |

---

## 2. Emergency Escalation Hierarchy

1. **Incident Commander (IC)**: Memimpin koordinasi respons teknis dan menentukan strategi penanganan.
2. **Technical Lead**: Melakukan isolasi akar penyebab masalah (*Root Cause Analysis*) dan menyusun patch perbaikan darurat (*hotfix*).
3. **Communications Lead**: Menyampaikan pembaruan status berkala kepada manajemen dan pelanggan tenant setiap 30 menit selama insiden P0 aktif.
4. **Post-Mortem Review**: Dalam waktu 48 jam pasca-resolusi insiden P0/P1, tim wajib menyusun laporan *Blameless Post-Mortem* yang mencakup kronologi kejadian, akar penyebab, dampak finansial/operasional, serta rencana tindakan preventif agar insiden serupa tidak terulang kembali.
