# ADR-0004: Multi-Tenancy Strategy (Pooled Database with Tenant Discriminator)

- **Status:** Accepted
- **Date:** 2026-09-06
- **Deciders:** Security Lead, Cloud Architect

---

## Context
Platform akan melayani ribuan perusahaan dengan biaya operasional yang efisien dan jaminan isolasi data yang ketat.

## Decision
Kami memilih model **Pooled Database with Tenant Discriminator Column (`tenantId`)**:
1. Seluruh tenant berbagi database dan skema tabel yang sama.
2. Setiap tabel master dan transaksional menyertakan kolom `tenantId` (UUID) dengan indeks komposit.
3. Isolasi ditegakkan secara otomatis di level server melalui Prisma Middleware dan PostgreSQL Row-Level Security (RLS).

## Alternatives Considered
- **Database-per-Tenant**: Ditolak untuk tahap awal karena biaya infrastruktur yang sangat mahal dan kompleksitas manajemen ribuan migrasi database secara bersamaan.
- **Schema-per-Tenant**: Ditolak karena PostgreSQL memiliki batas optimal jumlah skema dalam satu instance sebelum performa catalog menurun.

## Consequences
- **Positif**: Biaya hosting efisien; pembaruan skema tunggal berlaku instan untuk seluruh tenant; pemeliharaan database terpusat.
- **Negatif**: Kewajiban mutlak untuk memastikan filter `tenantId` tidak pernah terlewat pada setiap query data.
