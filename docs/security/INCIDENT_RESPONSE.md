# INCIDENT RESPONSE PLAN — NUSANTARA HRIS ENTERPRISE
## Security Incident Classification, Escalation, Containment, and Remediation Protocol

**Classification:** CONFIDENTIAL  
**Status:** SEMI-PRODUCTION READY  
**Compliance Standard:** UU PDP No. 27/2022 (Pasal 46: Pemberitahuan Kegagalan Pelindungan Data Pribadi dalam 3x24 Jam)

---

## 1. Severity Classification Matrix

| Level | Kategori | Kriteria Kejadian | Target Respons & Resolusi |
|---|---|---|---|
| **P0 (Critical)** | Kegagalan Masif / Pelanggaran Data | - Kebocoran data NIK/NPWP/Gaji lintas tenant.<br>- Manipulasi data penggajian periode yang telah dikunci.<br>- Pengambilalihan akun `SUPER_ADMIN`.<br>- Akses tidak sah ke database produksi. | Respons: < 15 menit<br>Containment: < 1 jam<br>Laporan Resmi: 3x24 jam |
| **P1 (High)** | Gangguan Keamanan Terbatas | - Brute force terdistribusi terhadap endpoint login.<br>- Bug IDOR yang terdeteksi sebelum eksploitasi eksternal.<br>- Kegagalan verifikasi Four-Eyes pada approval payroll. | Respons: < 1 jam<br>Resolusi: < 4 jam |
| **P2 (Medium)** | Pelanggaran Kebijakan Operasional | - Upaya akses dokumen melampaui batas wewenang.<br>- Rate-limiting spike pada endpoint pencarian.<br>- Kegagalan backup harian terjadwal. | Respons: < 4 jam<br>Resolusi: < 24 jam |
| **P3 (Low)** | Anomali Minor / Informasional | - Log audit error format.<br>- Percobaan login gagal tunggal dengan email keliru. | Review berkala mingguan |

---

## 2. Nine-Step Security Breach Response Workflow

1. **Detection & Identification:** Mendeteksi anomali melalui alert sistem monitoring atau laporan pengguna.
2. **Containment (Isolasi Darurat):**
   - Nonaktifkan akun/sesi yang terkompromi melalui panel Security Center.
   - Jika terjadi kebocoran lintas tenant, aktifkan emergency read-only mode atau kunci periode payroll terkait.
3. **Evidence Preservation:** Ambil snapshot log audit, access log HTTP, database snapshot, dan memori kontainer tanpa memodifikasi timestamp.
4. **Impact Assessment:** Evaluasi jumlah record, subjek data (pegawai terdampak), dan parameter data yang terekspos sesuai mandat UU PDP.
5. **Eradication:** Cabut celah keamanan (*hotfix deployment*), rotasi seluruh credential/secret (`AUTH_SECRET`, `ENCRYPTION_KEY`, DB passwords).
6. **Recovery & Verification:** Pulihkan data dari snapshot terpercaya (*point-in-time recovery*), verifikasi integritas saldo payroll dan formula pajak.
7. **Official Notification:** Jika terjadi kegagalan pelindungan data pribadi, kirim pemberitahuan tertulis kepada Lembaga PDP dan Subjek Data dalam waktu 3x24 jam sesuai Pasal 46 UU PDP.
8. **Regression Test Addition:** Buat skenario pengujian otomatis baru di `/tests/security/` untuk memastikan celah serupa tidak pernah berulang.
9. **Post-Mortem & Architecture Review:** Dokumentasikan akar masalah (*Root Cause Analysis*), pembaruan arsitektur, dan langkah preventif jangka panjang di `/docs/decisions/`.
