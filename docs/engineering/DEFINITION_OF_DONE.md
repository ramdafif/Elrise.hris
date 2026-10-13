# DEFINITION OF DONE (DoD) — NUSANTARA HRIS ENTERPRISE

Sebuah fitur atau tiket perbaikan bug dinyatakan **SELESAI (DONE)** dan siap digabungkan ke dalam branch produksi hanya jika telah memenuhi seluruh kriteria dalam daftar periksa di bawah ini.

---

## Definition of Done Checklist

### 1. Kualitas Kode & Arsitektur
- [ ] Kode terimplementasi penuh sesuai ruang lingkup spesifikasi tanpa fitur liar (*unsolicited features*).
- [ ] TypeScript strict mode valid tanpa kesalahan tipe (`npm run build` sukses).
- [ ] Tidak ada penggunaan tipe `any`, variabel yang tidak terpakai, atau fungsi duplikat.
- [ ] Linter berjalan bersih tanpa peringatan atau galat (`npm run lint` sukses).
- [ ] Logika finansial menggunakan tipe `Decimal` tanpa operasi *floating-point* langsung.

### 2. Keamanan & Multi-Tenancy
- [ ] Validasi hak akses (RBAC) ditegakkan di sisi server.
- [ ] Konteks `tenantId` disuntikkan pada seluruh query data database.
- [ ] Data sensitif (NIK, NPWP, Bank) disamarkan (*masked*) pada tampilan UI umum.
- [ ] Input pengguna divalidasi dan disanitasi terhadap ancaman XSS / Injection.

### 3. Pengujian & Kepatuhan
- [ ] Unit tests untuk logika bisnis inti (PPh 21 TER, Lembur PP 35, BPJS) dibuat dan lulus uji.
- [ ] Perubahan data kritis tercatat dalam tabel `AuditLog`.
- [ ] Regulasi pemerintah tidak ditulis secara *hardcoded*, melainkan melalui konfigurasi berversi.

### 4. Pengalaman Pengguna (UX & Responsiveness)
- [ ] Antarmuka responsif di layar desktop dan ponsel pintar (target sentuh $\ge$ 44px).
- [ ] Modal pada layar ponsel bertransformasi menjadi *bottom-sheet* yang nyaman diakses.
- [ ] Menangani seluruh status UI: *Loading state*, *Error state*, dan *Empty state*.
- [ ] Tidak ada galat pada konsol browser (*zero console errors*).

### 5. Dokumentasi & Operasional
- [ ] Dokumentasi domain di `/docs/` diperbarui jika terjadi perubahan kontrak atau alur.
- [ ] Migrasi database disiapkan secara kompatibel ke belakang (*backward compatible*).
- [ ] Entri changelog ditambahkan ke `CHANGELOG.md`.
