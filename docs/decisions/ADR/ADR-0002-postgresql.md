# ADR-0002: Selection of PostgreSQL as Primary Relational Database

- **Status:** Accepted
- **Date:** 2026-09-06
- **Deciders:** Database Administrator, Lead Architect

---

## Context
Sistem HR & Payroll menangani data transaksional keuangan yang sangat sensitif, catatan kependudukan resmi, serta memerlukan relasi antarentitas yang ketat. Pemilihan mesin database harus menjamin integritas data tanpa kompromi.

## Decision
Kami memilih **PostgreSQL 15+** sebagai basis data relasional utama untuk Nusantara HRIS:
1. Dukungan tipe data numerik presisi tinggi (`NUMERIC`/`DECIMAL`) untuk perhitungan mata uang rupiah tanpa galat pembulatan.
2. Kemampuan partisi tabel native (*Declarative Table Partitioning*) untuk menangani ratusan juta log presensi harian.
3. Kepatuhan ACID mutlak untuk menjaga konsistensi penguncian periode payroll.
4. Dukungan tipe data JSONB yang canggih untuk menyimpan snapshot aturan audit dan konfigurasi pajak.

## Alternatives Considered
- **MySQL / MariaDB**: Kurang memiliki fitur lanjutan untuk partisi berkala dan indeks JSONB sefleksibel PostgreSQL.
- **MongoDB / NoSQL**: Ditolak karena data penggajian bersifat sangat terelasi (*highly relational*) dan memerlukan jaminan integritas referensial foreign key.

## Consequences
- **Positif**: Integritas data terjamin; ekosistem tools enterprise sangat matang; performa query analitik terbukti stabil.
- **Negatif**: Membutuhkan pengelolaan *connection pooling* (seperti PgBouncer) saat lalu lintas transaksi meningkat drastis.
