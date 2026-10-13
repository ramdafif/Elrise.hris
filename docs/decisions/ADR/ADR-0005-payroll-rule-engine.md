# ADR-0005: Pure Function Engine for Indonesian Payroll & Tax Calculations

- **Status:** Accepted
- **Date:** 2026-09-06
- **Deciders:** Payroll Specialist, System Architect

---

## Context
Perhitungan gaji, tarif PPh 21 TER (PP 58/2023), iuran BPJS Kesehatan/Ketenagakerjaan, dan lembur PP 35/2021 sering kali mengalami perubahan regulasi pemerintah. Jika logika perhitungan bercampur dengan logika database atau tampilan UI, perubahan regulasi akan sangat rentan menimbulkan bug.

## Decision
Kami menetapkan bahwa seluruh mesin kalkulasi penggajian diwujudkan sebagai **Pure Functions** yang deterministik:
1. Fungsi kalkulator (contoh: `calculatePph21Ter()`, `calculateBpjsContributions()`, `calculateOvertimePay()`) hanya menerima parameter masukan terstruktur dan mengembalikan objek hasil perhitungan tanpa membaca atau menulis I/O langsung.
2. Seluruh aturan tarif dan bracket batas upah dimuat sebagai parameter konfigurasi berversi (`effectiveFrom`, `effectiveUntil`).
3. Hasil kalkulasi diuji secara komprehensif menggunakan ratusan *unit test cases* acuan.

## Alternatives Considered
- **Stateful Calculation Objects**: Menyimpan state perhitungan di dalam instance class; ditolak karena rentan terhadap efek samping (*race conditions*) saat pemrosesan konkuren.
- **Database Stored Procedures**: Menulis rumus pajak di dalam PL/pgSQL; ditolak karena sulit diuji dengan unit test modern dan sulit dimonitor dalam version control.

## Consequences
- **Positif**: Mesin kalkulasi dapat diuji secara instan; 100% deterministik; mudah diadaptasi ke worker latar belakang maupun simulator antarmuka browser.
- **Negatif**: Service layer aplikasi harus bertugas mengumpulkan seluruh parameter data yang dibutuhkan sebelum memanggil fungsi kalkulasi.
