# ADR-0007: Private Storage and Secure Document Access Architecture

- **Status:** Accepted
- **Date:** 2026-09-06
- **Deciders:** Security Lead, Compliance Officer

---

## Context
Dokumen karyawan (KTP, NPWP, Kartu Keluarga, Kontrak Kerja PKWT, Slip Gaji, Surat Dokter) mengandung data pribadi sensitif yang dilindungi oleh UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP). Menyimpan file-file ini di direktori publik atau bucket storage publik merupakan pelanggaran hukum berat.

## Decision
Kami menetapkan arsitektur **Private Authenticated Storage**:
1. Seluruh berkas disimpan dalam private cloud object storage (Google Cloud Storage / AWS S3 / MinIO) yang tidak dapat diakses secara langsung dari internet publik (*Zero Public Access*).
2. Akses unduh dan pratinjau dokumen hanya diizinkan melalui **Pre-signed URLs** berjangka waktu kedaluwarsa singkat (maksimal 15 menit) atau melalui proxy endpoint terotentikasi di sisi server.
3. Server memvalidasi hak akses (RBAC, Tenant Context, dan Object-Level Authorization) sebelum menerbitkan URL akses.
4. Setiap pengunggahan divalidasi MIME-type murni (magic bytes), batas ukuran berkas (maksimal 5MB), dan sanitasi nama file untuk mencegah directory traversal.

## Alternatives Considered
- **Public CDN / Static File Hosting**: Ditolak keras karena dokumen sensitif karyawan dapat terindeks mesin pencari atau ditebak URL-nya.
- **Menyimpan Berkas Langsung di Database (BLOB)**: Ditolak karena menyebabkan pembengkakan drastis pada ukuran backup database transaksional PostgreSQL.

## Consequences
- **Positif**: Kepatuhan penuh terhadap standar ISO 27001 dan UU PDP; tidak ada kebocoran dokumen antar-karyawan; audit trail tercatat setiap kali dokumen diakses.
- **Negatif**: Dibutuhkan pemanggilan endpoint terotentikasi sebelum klien dapat menampilkan atau mengunduh dokumen.
