# MULTI-TENANCY ARCHITECTURE — NUSANTARA HRIS ENTERPRISE

Dokumen ini mendefinisikan strategi isolasi penyewa (*tenant isolation*), model partisi data, dan mekanisme pencegahan kebocoran data antar-perusahaan (*cross-tenant leakage*).

---

## 1. Multi-Tenancy Model: "Pooled Database with Discriminator Column"

Untuk fase awal hingga menengah (Stage 1 s.d Stage 3), Nusantara HRIS menggunakan model **Shared Database, Shared Schema** dengan kolom pembeda penyewa (**Tenant Discriminator Column**):

- **Struktur Entitas**:
  - `Tenant`: Mewakili entitas pelanggan platform SaaS (misalnya: *Group Holding Astra*, *Grup Djarum*, atau *PT Solusi Prima*).
  - `Company`: Entitas legal di bawah tenant (anak perusahaan, PT/CV terdaftar).
  - `Branch`: Cabang operasional atau pabrik di bawah perusahaan (Jakarta HO, Surabaya Factory, Bandung Branch).
- **Pembeda Wajib**: Setiap tabel transaksional dan master memiliki kolom `tenantId` bertipe UUID dengan indeks B-Tree.

```text
┌─────────────────────────────────────────────────────────────┐
│                      TENANT CONTEXT                         │
│             Tenant A                  Tenant B              │
│       (PT Maju Bersama)         (PT Sukses Mandiri)         │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌─────────────────────────────────────────────────────────────┐
│             PRISMA CLIENT MULTI-TENANT MIDDLEWARE           │
│   • Mengekstrak tenantId dari Sesi JWT / Header Terverifikasi │
│   • Secara Otomatis Menyuntikkan: where: { tenantId }       │
│   • Menolak Eksekusi Query Tanpa Tenant Context             │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             POSTGRESQL WITH ROW-LEVEL SECURITY              │
│         Semua Baris Data Terisolasi Secara Kriptografis     │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Server-Enforced Isolation (Zero Frontend Trust)

Isolasi data antar penyewa **wajib ditegakkan di sisi server**. Dilarang keras mengandalkan pemfilteran antarmuka di sisi klien:

1. **Session-Bound Context**: `tenantId` diekstrak langsung dari token sesi JWT yang telah ditandatangani secara kriptografis oleh server.
2. **Prisma Middleware Auto-Injection**:
   ```typescript
   // Contoh prisma extension yang menyuntikkan tenantId secara transparan
   prismaClient.$use(async (params, next) => {
     const tenantId = AsyncLocalStorage.getStore()?.tenantId;
     if (tenantId && params.model !== 'Tenant') {
       if (params.action === 'findMany' || params.action === 'findFirst') {
         params.args.where = { ...params.args.where, tenantId };
       }
       if (params.action === 'create') {
         params.args.data = { ...params.args.data, tenantId };
       }
     }
     return next(params);
   });
   ```
3. **Database Row-Level Security (RLS)**:
   Sebagai lapisan pertahanan sekunder, PostgreSQL RLS dapat diaktifkan menggunakan parameter sesi database:
   ```sql
   ALTER TABLE "Employee" ENABLE ROW LEVEL SECURITY;
   CREATE POLICY tenant_isolation_policy ON "Employee"
     USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);
   ```

---

## 3. Jalur Menuju Skala Jutaan Penyewa (Tenant Sharding)

Ketika sistem berevolusi menuju Tahap 4 (Skala Nasional dengan ratusan ribu perusahaan):
- **Hybrid Sharding**: Tenant UKM berukuran kecil tetap berada di *shared database pool*, sedangkan tenant korporasi raksasa dengan > 50.000 karyawan dapat dialokasikan ke database PostgreSQL terpisah (*isolated database shard*) hanya dengan mengalihkan *connection string* pada router tenant tanpa mengubah kode aplikasi.
