# TAX COMPLIANCE POLICY — NUSANTARA HRIS ENTERPRISE

Dokumen ini mendefinisikan kebijakan kepatuhan perpajakan nasional dan prosedur rekonsiliasi PPh 21 resmi.

---

## 1. Compliance Standard

Nusantara HRIS menjamin kepatuhan 100% terhadap ketentuan Direktorat Jenderal Pajak (DJP) Kementerian Keuangan Republik Indonesia:
- **Ketepatan Tabel TER**: Menggunakan tabel pemotongan resmi Lampiran PP No. 58/2023 tanpa modifikasi tarif apa pun.
- **Kesesuaian Status PTKP**: Memetakan 14 status PTKP (TK/0 sampai dengan K/3) secara tepat ke dalam Kategori A, B, atau C.
- **Pajak Tidak Ber-NPWP**: Sesuai UU HPP dan regulasi terkini, NIK (16 digit) telah diintegrasikan sebagai NPWP Orang Pribadi. Bagi karyawan yang tidak memiliki validasi NPWP/NIK aktif, sistem dapat dikonfigurasi untuk memotong tarif denda tambahan 20% jika disyaratkan oleh kebijakan perpajakan yang berlaku.

---

## 2. Pelaporan Elektronik (e-Bupot 21/26 Integration)

- Sistem menghasilkan data ringkasan pemotongan bulanan yang sesuai dengan format impor berkas **e-Bupot 21/26**.
- Kode Objek Pajak standar:
  - `21-100-01`: Pegawai Tetap.
  - `21-100-02`: Penerima Pensiun Berkala.
  - `21-100-03`: Pegawai Tidak Tetap / Tenaga Kerja Lepas.
- Setiap pemotongan pajak menghasilkan nomor referensi internal yang dapat ditelusuri (*traceable reference number*).
