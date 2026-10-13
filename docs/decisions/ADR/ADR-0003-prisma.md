# ADR-0003: Selection of Prisma as ORM & Type-Safe Query Layer

- **Status:** Accepted
- **Date:** 2026-09-06
- **Deciders:** Backend Lead, Full-Stack Engineers

---

## Context
Diperlukan lapisan akses data (*Data Access Layer*) di ekosistem TypeScript/Next.js yang memberikan keamanan tipe data (*type safety*), kemudahan migrasi skema, dan kecepatan pengembangan.

## Decision
Kami memilih **Prisma ORM**:
1. Deklarasi skema tunggal yang mudah dibaca pada `prisma/schema.prisma`.
2. Menghasilkan klien TypeScript tergenerasi otomatis (*auto-generated Prisma Client*) dengan *auto-completion* penuh.
3. Memfasilitasi integrasi middleware/extension untuk otomatis menyuntikkan klausa filter `tenantId`.

## Alternatives Considered
- **Drizzle ORM**: Sangat cepat dan tipis, namun ekosistem migrasi dan tooling relasi kompleksnya saat ini masih membutuhkan lebih banyak boilerplate dibanding Prisma.
- **Raw SQL Queries**: Menghilangkan abstraksi tipe data dan meningkatkan risiko kesalahan ketik nama kolom serta kerentanan SQL injection.

## Consequences
- **Positif**: Produktivitas developer sangat tinggi; kesalahan tipe skema terdeteksi saat waktu kompilasi (*compile-time*).
- **Negatif**: Query komputasi laporan yang sangat kompleks sesekali membutuhkan raw query parameterized (`$queryRaw`) untuk performa maksimal.
