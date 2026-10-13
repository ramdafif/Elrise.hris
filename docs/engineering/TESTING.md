# TESTING STRATEGY — NUSANTARA HRIS ENTERPRISE

Dokumen ini mendefinisikan piramida pengujian perangkat lunak (*Testing Pyramid*), cakupan uji wajib, dan protokol pengujian regresi untuk perhitungan penggajian nasional.

---

## 1. Testing Pyramid Structure

```text
          ▲
         / \     E2E Tests (Cypress / Playwright)
        /   \    - Critical User Journeys (Onboarding -> Clock In -> Payroll Run)
       /─────\
      /       \   Integration Tests (Jest / Vitest with DB Test Container)
     /         \  - Multi-tenant Isolation, Transactional Rollbacks, API Contracts
    /───────────\
   /             \ Unit Tests (High Volume, Fast Execution)
  /               \- Deterministic Engines: PPh 21 TER, Lembur PP 35, BPJS, Date/Money Utils
 └─────────────────┘
```

---

## 2. Prioritas Pengujian Wajib (Non-Negotiable Test Scenarios)

1. **Perhitungan PPh 21 TER (PP 58/2023)**:
   - Verifikasi 44 tier Kategori A, 40 tier Kategori B, dan 41 tier Kategori C.
   - Verifikasi nilai batas bawah dan batas atas di setiap tier.
   - Verifikasi bahwa penghasilan bruto di bawah PTKP bulanan menghasilkan potongan Rp 0 (0.0%).
2. **Kalkulasi Lembur PP 35/2021**:
   - Lembur hari kerja: 1 jam pertama (1.5x) dan jam berikutnya (2.0x).
   - Lembur hari libur mingguan: Jam 1–8 (2.0x), jam 9 (3.0x), jam 10–12 (4.0x).
   - Pembagi upah per jam `(Gaji Pokok + Tunjangan Tetap) / 173`.
3. **Plafon Upah BPJS**:
   - Uji batas atas upah BPJS Kesehatan Rp 12.000.000 (Iuran pekerja tidak melebihi Rp 120.000).
   - Uji batas plafon upah BPJS Ketenagakerjaan JP Rp 10.042.300 (Iuran pekerja tidak melebihi Rp 100.423).
4. **Isolasi Multi-Tenant**:
   - Memastikan pengguna Tenant A tidak dapat melihat atau mengubah catatan milik Tenant B.
