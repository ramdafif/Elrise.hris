# ADR-0009: SaaS Multi-Tenant Subscription and Entitlement Engine

- **Status:** Accepted
- **Date:** 2026-09-06
- **Deciders:** Product Manager, Lead Architect

---

## Context
Nusantara HRIS harus siap beroperasi sebagai platform SaaS multitenant yang melayani berbagai tier pelanggan (STARTER, GROWTH, ENTERPRISE). Batasan kapasitas (kuota karyawan, penyimpanan dokumen, akses fitur lanjutan) harus dapat ditegakkan secara dinamis tanpa mengubah logika inti HR.

## Decision
Kami menetapkan arsitektur **Entitlement Service Layer**:
1. Entitas `Tenant` memiliki relasi ke `Subscription` dan `TenantPlan` (STARTER, GROWTH, ENTERPRISE).
2. Kuota fitur dikelola oleh `EntitlementService`:
   - Batas maksimum jumlah karyawan aktif (`maxEmployees`).
   - Batas penyimpanan dokumen (`storageLimitMb`).
   - Flag ketersediaan fitur (contoh: `API_ACCESS`, `CUSTOM_REPORTING`, `BIOMETRIC_SYNC`, `ADVANCED_PAYROLL`).
3. Verifikasi kuota dan hak akses fitur dieksekusi di level Server Actions / Route Handlers sebelum mutasi data dilakukan.
4. Logika penagihan (*billing*) dan gateway pembayaran dipisahkan melalui adaptor pihak ketiga (*Payment Adapter Interface*) sehingga inti HR tidak terikat pada vendor payment gateway tertentu.

## Alternatives Considered
- **Hardcoded Plan Limits di Frontend**: Ditolak keras karena pengguna dapat mem-bypass batasan karyawan dengan memanggil API langsung.
- **Tightly Coupled Payment Gateway SDK**: Ditolak karena mengganti penyedia pembayaran (Midtrans, Xendit, Stripe) akan merusak kode domain HR.

## Consequences
- **Positif**: Fleksibilitas penetapan harga dan paket; monetisasi aman tanpa kebocoran kuota; domain HR tetap murni dan agnostik terhadap vendor pembayaran.
- **Negatif**: Memerlukan evaluasi kuota server-side pada operasi pembuatan karyawan baru dan pengunggahan berkas.
