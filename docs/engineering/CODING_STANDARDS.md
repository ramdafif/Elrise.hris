# ENGINEERING CODING STANDARDS — NUSANTARA HRIS ENTERPRISE

Dokumen ini mendefinisikan standar penulisan kode, konvensi penamaan, dan praktik terbaik bagi seluruh engineer dan AI agent di repositori Nusantara HRIS.

---

## 1. TypeScript Strict Mode & Type Safety

- **Strict Mode**: `tsconfig.json` wajib mengaktifkan `"strict": true`.
- **Dilarang Menggunakan `any`**: Penggunaan tipe `any` dilarang keras. Gunakan generic types, union types, atau `unknown` dengan *type narrowing*:
  ```typescript
  // ❌ BURUK
  function processPayload(data: any) { ... }

  //  BAIK
  function processPayload<T extends ValidatedPayload>(data: T) { ... }
  ```
- **Fungsi Murni untuk Perhitungan Finansial**: Rumus perhitungan PPh 21 TER, lembur PP 35/2021, dan jaminan sosial BPJS wajib diimplementasikan sebagai *pure functions* tanpa *side effects* atau akses langsung ke I/O database.
- **Hindari Magic Numbers & Magic Strings**: Seluruh angka persentase BPJS, batas plafon upah, kode status, dan nama peran wajib dideklarasikan sebagai konstanta (*constants*) atau `enum` bertipe.

---

## 2. Struktur Komponen React & Pemisahan Tanggung Jawab

- **Prinsip Single Responsibility**: Komponen UI hanya bertugas merender tampilan dan menangani interaksi pengguna. Logika agregasi matematika yang kompleks wajib dipindahkan ke helper service.
- **Batasan Ukuran Berkas**: Komponen UI disarankan berukuran di bawah 400 baris kode. Jika sebuah komponen berkembang melebihi batas ini, lakukan pemecahan (*refactor*) ke dalam sub-komponen modular.
- **Aksesibilitas & ID Elemen**: Setiap elemen interaktif (tombol, input formulir, tab navigasi, kartu data) wajib memiliki atribut `id` unik yang deskriptif untuk mendukung penargetan pengujian otomatis dan alat bantu aksesibilitas (*screen reader*).
