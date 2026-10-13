# ADR-0010: Personal Data Protection (UU PDP No. 27/2022) and Four-Eyes Governance

- **Status:** Accepted
- **Date:** 2026-09-06
- **Deciders:** Chief Information Security Officer (CISO), Legal Compliance Officer

---

## Context
Kepatuhan terhadap UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP) mewajibkan pengendali data pribadi untuk menerapkan enkripsi, kontrol akses yang ketat, masking data sensitif, dan pencatatan jejak audit yang tidak dapat diubah. Selain itu, dalam transaksi penggajian bernilai miliaran rupiah, prinsip tata kelola keuangan (*financial governance*) mewajibkan pencegahan manipulasi sepihak melalui prinsip pemisahan tugas.

## Decision
Kami menetapkan standar **PDP & Financial Governance**:
1. **Server-Side Data Masking**: NIK, NPWP, nomor rekening bank, dan nominal gaji disensor secara deterministik di server sebelum dikirimkan ke klien non-otoritas.
2. **Kriptografi Kuat**: Data kompensasi sensitif dienkripsi *at-rest* dengan AES-256-GCM, dan kredensial pengguna di-hash menggunakan algoritma berstandar industri (bcrypt dengan minimal 12 rounds / Argon2id).
3. **Four-Eyes Principle (Maker-Checker)**: Pejabat yang mengkalkulasi atau menyusun payroll (*maker*) dilarang keras mengunci atau menyetujui periode penggajian yang sama (*checker*).
4. **Append-Only Immutable Audit Log**: Jejak audit tidak menyediakan operasi `UPDATE` maupun `DELETE` di tingkat database dan ORM.
5. **Session Invalidation**: Sesi pengguna dapat dibatalkan secara instan jika terdeteksi aktivitas mencurigakan atau perubahan wewenang peran.

## Alternatives Considered
- **Masking di Browser/React Saja**: Ditolak karena penyerang dapat memeriksa response payload JSON melalui browser Network DevTools dan memperoleh data NIK/Gaji asli.
- **Single-Approval Payroll**: Ditolak karena risiko *insider fraud* dan kesalahan transfer dana perusahaan.

## Consequences
- **Positif**: Memenuhi standar regulasi Indonesia dan sertifikasi ISO 27001; risiko kecurangan finansial internal ditekan ke tingkat minimal.
- **Negatif**: Membutuhkan minimal dua peran pengguna berbeda (`PAYROLL_ADMIN` dan `HR_ADMIN` / `FINANCE`) untuk memproses penggajian hingga status pembayaran.
