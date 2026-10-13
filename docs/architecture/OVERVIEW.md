# ARCHITECTURE OVERVIEW — NUSANTARA HRIS ENTERPRISE

## 1. Architectural Philosophy: "Simple Now, Scalable Later"

Nusantara HRIS menolak jebakan umum pengembangan perangkat lunak modern: menerapkan *microservices* terlalu dini (*premature microservices*). Memulai dengan microservices pada tahap awal hanya menciptakan kompleksitas operasional, latensi jaringan, tantangan konsistensi data terdistribusi (*distributed transactions*), dan beban perawatan yang berlebihan.

Sebaliknya, Nusantara HRIS mengadopsi **Modular Monolith Architecture**:
- **Kesederhanaan Operasional**: Seluruh sistem dideploy sebagai satu unit yang kohesif, menggunakan satu database PostgreSQL yang andal dan transaksional.
- **Batas Domain yang Ketat (*Strict Domain Boundaries*)**: Modul-modul bisnis (Karyawan, Presensi, Cuti, Lembur, Payroll, Pajak, BPJS) dipisahkan secara struktural. Setiap modul memiliki tanggung jawab yang terisolasi dan hanya berkomunikasi melalui kontrak antarmuka (*service contract*) yang terdefinisi rapi.
- **Jalur Evolusi yang Mulus**: Karena batas domain dijaga ketat sejak hari pertama, jika modul tertentu (seperti *Payroll Calculation Engine* atau *Attendance Ingestion*) membutuhkan skalabilitas independen di masa depan, modul tersebut dapat diekstraksi menjadi layanan mandiri tanpa perlu merombak arsitektur sistem secara keseluruhan (*zero total rewrite*).

---

## 2. High-Level Component Stack

```text
┌─────────────────────────────────────────────────────────────┐
│                       CLIENT LAYER                          │
│   Desktop Web Browser (HR Admin)  │  Mobile ESS Web / PWA   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / TLS 1.3
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 EDGE & APPLICATION GATEWAY                  │
│       Reverse Proxy (Nginx) / Cloud Run Load Balancer       │
│       Rate Limiting  •  SSL Offloading  •  Security Headers │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   NEXT.JS APPSERVICE LAYER                  │
│   • Server Actions & API Routes (/app/api/*)                │
│   • RBAC & Tenant Context Enforcement Middleware            │
│   • UI Component Rendering (Server & Client Components)     │
└──────┬───────────────────────┬───────────────────────┬──────┘
       │                       │                       │
       ▼                       ▼                       ▼
┌──────────────┐       ┌──────────────┐        ┌──────────────┐
│  HR & Master │       │ Attendance & │        │  Indonesian  │
│  Data Module │       │ Leave Module │        │Payroll Engine│
└──────┬───────┘       └──────┬───────┘        └──────┬───────┘
       │                      │                       │
       └──────────────────────┼───────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATA ACCESS LAYER (ORM)                   │
│           Prisma ORM with Multi-Tenant Middleware           │
│        Strict Decimal Arithmetic • UTC Timestamping         │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   PERSISTENCE & STORAGE                     │
│               PostgreSQL Enterprise Database                │
│       ACID Transactions • Row-Level Security • B-Tree Index │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Core Architectural Tenets

1. **Deterministic Business Core**: Perhitungan penggajian dan pajak tidak boleh menghasilkan variasi hasil dalam kondisi data yang sama. Seluruh aturan matematika diformulasikan sebagai fungsi murni (*pure functions*) yang dapat diuji dengan mudah.
2. **Immutable Auditability**: Tidak ada data histori yang hilang. Transaksi sensitif dan log perubahan bersifat *append-only*.
3. **Tenant Boundary Enforcement**: Setiap entitas bisnis terkait langsung dengan `tenantId` untuk menjamin bahwa data antar perusahaan tidak pernah bocor atau tercampur, baik saat ini maupun saat sistem mencapai skala ribuan tenant.
