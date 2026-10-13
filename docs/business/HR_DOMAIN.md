# HR DOMAIN SPECIFICATION — NUSANTARA HRIS ENTERPRISE

Dokumen ini mendefinisikan batas domain, entitas, aturan bisnis, dan relasi data untuk manajemen sumber daya manusia (*Human Resources Core*).

---

## 1. Domain Entities & Responsibilities

- **Company & Organization**: Entitas legal perusahaan, kantor cabang (*Branch*), departemen (*Department*), dan posisi jabatan (*Position*).
- **Employee Master Record**: Catatan tunggal kebenaran (*Single Source of Truth*) identitas pegawai:
  - Identitas Resmi: Nama lengkap, gelar, NIK KTP (16 digit), NPWP (15/16 digit format NIK).
  - Keanggotaan Jaminan Sosial: Nomor Kartu BPJS Kesehatan (13 digit), Nomor BPJS Ketenagakerjaan / KPJ (11 digit).
  - Hubungan Ketenagakerjaan: PKWT (Kontrak dengan batas waktu terdefinisi), PKWTT (Karyawan Tetap), Probation (Maksimal 3 bulan sesuai UU 13/2003), Internship.
  - Kompensasi Finansial: Gaji Pokok, Tunjangan Tetap (Jabatan, Perumahan), Tunjangan Tidak Tetap (Transport, Kehadiran).
  - Rekening Perbankan: Nama bank, nomor rekening, nama pemilik rekening (untuk validasi pencairan gaji).

---

## 2. Invariants & Business Rules

1. **Keunikan Identitas**: Kombinasi `(tenantId, employeeId)` dan `(tenantId, nikKtp)` harus bersifat unik (*strict unique constraint*).
2. **Kepatuhan Upah Minimum**: Sistem memvalidasi bahwa total Gaji Pokok + Tunjangan Tetap tidak boleh berada di bawah Upah Minimum Regional (UMR/UMK) cabang tempat karyawan bertugas.
3. **Porsi Gaji Pokok**: Sesuai UU No. 13/2003 Pasal 94, besarnya gaji pokok sedikit-dikitnya adalah **75%** dari jumlah gaji pokok dan tunjangan tetap.
4. **Masa Percobaan (Probation)**: Hanya dapat diterapkan pada perjanjian kerja waktu tidak tertentu (PKWTT). Perjanjian kerja waktu tertentu (PKWT) tidak boleh mensyaratkan adanya masa percobaan.
