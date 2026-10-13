# ADR-0001: Adoption of Modular Monolith Architecture

- **Status:** Accepted
- **Date:** 2026-09-06
- **Deciders:** Lead Architect, Core Engineering Team

---

## Context
Nusantara HRIS dirancang dengan visi melayani perusahaan di Indonesia dari skala ratusan hingga jutaan karyawan. Terdapat pertimbangan apakah sistem harus langsung dipecah menjadi *microservices* sejak awal atau dibangun sebagai satu kesatuan (*monolith*).

## Decision
Kami memutuskan untuk mengadopsi pola **Modular Monolith**:
1. Seluruh kode aplikasi hidup dalam satu repositori (*monorepo/modular codebase*) dan dideploy sebagai satu unit layanan Next.js.
2. Setiap domain (Karyawan, Presensi, Cuti, Lembur, Payroll, Pajak, BPJS) dipisahkan secara tegas dengan direktori dan kontrak antarmuka independen.
3. Komunikasi antardomain dilakukan melalui fungsi layanan bertipe (*in-process service contracts*) tanpa overhead HTTP/gRPC internal.

## Alternatives Considered
- **Microservices Architecture**: Ditolak karena overhead operasional jaringan, kesulitan menjaga konsistensi transaksi data finansial (kebutuhan 2-Phase Commit / Saga Pattern), dan kompleksitas debugging yang belum sebanding dengan beban transaksi fase awal.
- **Classic Unstructured Monolith**: Ditolak karena rentan menghasilkan *spaghetti code* di mana modul penggajian memanipulasi langsung tabel absensi secara bebas.

## Consequences
- **Positif**: Pengembangan fitur sangat cepat; transaksi database PostgreSQL ACID terjamin penuh; biaya infrastruktur hosting minimal; jalur migrasi ke microservices di masa depan tetap terbuka karena batas domain sudah rapi.
- **Negatif**: Memerlukan disiplin tinggi bagi developer dan AI agent agar tidak melanggar batas isolasi antarmodul.
