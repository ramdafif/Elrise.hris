# AGENTS / AI DEVELOPMENT RULES — NUSANTARA HRIS ENTERPRISE

> **Governance Directive for All AI Coding Agents & Engineers**  
> Dokumen ini merupakan aturan baku dan mutlak bagi seluruh agen AI (dan developer manusia) yang berkontribusi pada repositori Nusantara HRIS. Setiap modifikasi kode, skema, arsitektur, maupun konfigurasi **wajib** mematuhi 20 aturan fundamental di bawah ini tanpa pengecualian.

---

## 20 Golden Rules of Engineering

1. **Jangan merusak architecture existing.**  
   Patuhi pola Modular Monolith dan domain boundary yang telah ditetapkan. Jangan merombak arsitektur atau mengacak file tanpa persetujuan eksplisit.
2. **Jangan menghapus fitur tanpa alasan.**  
   Fitur yang telah dibangun memiliki dependensi operasional. Tidak diperbolehkan memangkas kontrol atau menghapus fitur yang sedang berjalan.
3. **Jangan mengubah database schema secara destructive.**  
   Dilarang keras melakukan `DROP COLUMN` atau `DROP TABLE` secara langsung di lingkungan produksi atau migrasi yang aktif.
4. **Jangan hardcode government regulation.**  
   Tarif PPh 21 TER, PTKP, batas upah BPJS Kesehatan, plafon BPJS Ketenagakerjaan JP, serta formula lembur PP 35/2021 harus selalu disimpan dalam tabel konfigurasi atau rule versioning (`effectiveFrom`, `effectiveUntil`).
5. **Jangan menggunakan floating point untuk uang.**  
   Operasi aritmatika finansial (gaji, tunjangan, potongan pajak, BPJS) **wajib** menggunakan tipe `Decimal` (atau integer sen/rupiah bulat dengan pembulatan presisi bank). Jangan pernah memakai `float` atau `double` murni JavaScript yang rentan *floating point inaccuracy*.
6. **Jangan bypass authorization.**  
   Validasi Role-Based Access Control (RBAC) dan Tenant Context wajib dieksekusi di level server pada setiap API endpoint dan Server Action. Jangan mengandalkan proteksi tampilan di sisi klien (frontend-only).
7. **Jangan memasukkan business logic kompleks ke UI.**  
   Pemisahan *Separation of Concerns* wajib dijaga: logic kalkulasi pajak, formula lembur, dan agregasi data harus berada di service layer atau domain calculation engine, bukan di dalam komponen React/JSX.
8. **Jangan membuat duplicate utility.**  
   Periksa utilitas format rupiah, kalkulator tanggal, parser waktu, dan validator sebelum membuat fungsi pembantu baru. Manfaatkan file terpusat di `/lib/utils.ts` atau domain service terkait.
9. **Cari existing component/service sebelum membuat baru.**  
   Hindari redundansi komponen tombol, modal, badge status, tabel, atau hook state. Gunakan kembali komponen yang sudah teruji.
10. **Semua feature baru harus memiliki validation.**  
    Setiap payload permintaan dari user harus divalidasi menggunakan schema validator (seperti Zod/TypeScript guards) sebelum diproses oleh database.
11. **Critical business logic harus memiliki test.**  
    Perhitungan gaji bersih (*Take-Home Pay*), tarif TER PPh 21 (PP 58/2023), iuran BPJS Kesehatan (1% & 4%), serta upah lembur wajib diverifikasi melalui unit/integration tests.
12. **Update dokumentasi jika architecture berubah.**  
    Dokumentasi adalah bagian terintegrasi dari source code (*Documentation as Code*). Jika terjadi perubahan skema, API, atau alur bisnis, segera perbarui file terkait di `/docs/`.
13. **Update migration jika schema berubah.**  
    Setiap modifikasi model di `prisma/schema.prisma` wajib disertai dengan langkah migrasi data yang kompatibel ke belakang (*backward compatible*).
14. **Jangan menggunakan "any" kecuali benar-benar diperlukan.**  
    TypeScript strict mode wajib dipatuhi. Gunakan interfaces, enums, unions, atau generic types yang eksplisit.
15. **Jangan menyimpan secret dalam source code.**  
    API keys, password database, JWT secret, dan kredensial eksternal wajib dimuat melalui environment variables (`.env`).
16. **Jangan menggunakan data pribadi nyata dalam seed.**  
    Data dummy wajib bersifat sintetis. Dilarang keras memakai NIK KTP, NPWP, nomor rekening bank, atau nomor telepon warga negara nyata.
17. **Jangan menghapus audit trail.**  
    Tabel `AuditLog` bersifat append-only (*immutable*). Tidak boleh ada operasi `DELETE` atau `UPDATE` terhadap rekaman jejak audit kepatuhan.
18. **Jangan mengubah locked payroll.**  
    Periode penggajian yang telah berstatus `LOCKED` atau `PAID` menjadi *snapshot permanen*. Koreksi apa pun harus dilakukan melalui periode penyesuaian (*adjustment payroll*) berikutnya.
19. **Jangan melakukan destructive migration tanpa explicit migration plan.**  
    Terapkan pola migrasi 4 tahap: *Add new structure* -> *Migrate data* -> *Switch application* -> *Remove old structure*.
20. **Semua perubahan critical harus backward compatible.**  
    Kontrak API dan format data lama tidak boleh rusak ketika ada penambahan fitur atau versi baru.

---

## AI Agent Workflow Protocol

Setiap kali agent menerima instruksi penambahan atau pembaruan fitur:
1. **Analyze Existing Architecture**: Periksa relasi modul, skema Prisma, dan service layer saat ini.
2. **Locate Existing Capabilities**: Telusuri komponen dan helper yang sudah tersedia.
3. **Determine Multi-tenant & Security Impact**: Pastikan `tenantId` dan proteksi hak akses tetap terjaga.
4. **Implement Safely**: Kode ditulis secara modular, type-safe, dan bersih dari *anti-slop* visual clichés.
5. **Verify & Build**: Jalankan linter dan compiler untuk memastikan integritas codebase.
6. **Synchronize Docs**: Dokumentasikan perubahan pada file spesifikasi domain atau ADR terkait.
