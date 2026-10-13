# SCALABILITY ROADMAP — NUSANTARA HRIS ENTERPRISE

Roadmap ini menggambarkan evolusi bertahap platform Nusantara HRIS dari aplikasi skala tunggal (*single enterprise*) menuju infrastruktur SaaS HR & Payroll skala nasional yang melayani jutaan tenaga kerja di Indonesia.

---

## Tahap Evolusi Skalabilitas

```text
┌───────────────────────────┐      ┌───────────────────────────┐
│   STAGE 1: INTERNAL HRIS  │ ---> │     STAGE 2: SME SAAS     │
│   1 Perusahaan (100-1K)   │      │   Banyak Entitas (1K-50K) │
└─────────────┬─────────────┘      └─────────────┬─────────────┘
              │                                  │
              ▼                                  ▼
┌───────────────────────────┐      ┌───────────────────────────┐
│   STAGE 3: ENTERPRISE     │ ---> │ STAGE 4: NATIONAL PLATFORM│
│  Konglomerasi (50K-500K)  │      │ Jutaan Rekaman Karyawan   │
└───────────────────────────┘      └───────────────────────────┘
```

---

## Rincian Tahap Perkembangan

### Stage 1 — Internal Enterprise HRIS (Fase Saat Ini)
*Kapasitas: 1 Perusahaan / Multi-Cabang | 100 – 1.000 Karyawan*
- **Arsitektur**: Modular Monolith, Next.js App Router, Prisma ORM, PostgreSQL transaksional.
- **Kemampuan Utama**:
  - Master data karyawan komprehensif (NIK, NPWP, BPJS, Bank, Hubungan Kerja).
  - Presensi digital berbasis GPS geofence 150 meter.
  - Alur persetujuan cuti dan lembur berjenjang (PP 35/2021).
  - Mesin kalkulasi PPh 21 TER (PP 58/2023 & PMK 168/2023).
  - Iuran BPJS Kesehatan dan 5 program BPJS Ketenagakerjaan.
  - Export berkas batch transfer perbankan (BCA Payroll & Mandiri MCM).
  - Slip gaji resmi elektronik dan kalkulator THR keagamaan Permenaker 6/2016.
  - Audit trail append-only untuk kepatuhan tata kelola.

### Stage 2 — Multi-Company SME SaaS
*Kapasitas: 10 – 1.000 Perusahaan UKM | 1.000 – 50.000 Karyawan*
- **Arsitektur**: Logical Tenant Isolation via `tenantId`, Redis Caching Layer, Background Queue Worker (BullMQ).
- **Kemampuan Baru**:
  - Tenant onboarding otomatis & manajemen langganan multi-tier.
  - Asynchronous batch calculation untuk payroll (pemrosesan latar belakang dengan progress bar).
  - Ekspor e-SPT Masa PPh 21 format resmi DJP (CSV Ebupot 21/26).
  - Ekspor berkas pelaporan SIPP Online BPJS Ketenagakerjaan.
  - Notifikasi otomatis WhatsApp Gateway & Email untuk pengingat persetujuan cuti dan distribusi slip gaji berpassword.

### Stage 3 — Enterprise & Conglomerate Tier
*Kapasitas: Perusahaan Konglomerasi & BUMN | 50.000 – 500.000 Karyawan*
- **Arsitektur**: Read-Replicas untuk laporan analitik, Database Table Partitioning (partisi per bulan untuk data kehadiran), S3 Presigned Document Storage.
- **Kemampuan Baru**:
  - Struktur holding bertingkat: *Holding Group* -> *Subsidiary Companies* -> *Business Units* -> *Branches*.
  - Integrasi perbankan langsung (Direct Host-to-Host BCA Snap API & Mandiri Cash Management API).
  - Integrasi mesin absensi fisik (Fingerprint & Face Recognition terminal via webhook bridge).
  - Multi-tier approval matrix dinamis berdasarkan nominal budget dan hierarki jabatan.
  - Rekonsiliasi otomatis PPh 21 masa pajak Desember (Pasal 17 Tahunan vs akumulasi Jan–Nov).

### Stage 4 — National-Scale Platform Ecosystem
*Kapasitas: Multi-Tenant Nasional | Ratusan Ribu Perusahaan & Jutaan Karyawan*
- **Arsitektur**: Domain Microservices Terseleksi (Payroll Engine Microservice, Attendance Event Ingestion Service), Kafka / Cloud PubSub Event Bus, Dedicated Analytical Data Warehouse (ClickHouse / BigQuery).
- **Kemampuan Baru**:
  - Ekosistem Open API publik berstandar industri bagi pengembang pihak ketiga.
  - Integrasi langsung ke portal pemerintah (Satu Data Ketenagakerjaan Kemnaker, BPJS Health & Employment Direct Bridge).
  - Asisten AI cerdas untuk ringkasan kepatuhan undang-undang ketenagakerjaan dan deteksi anomali absensi/klaim lembur.
  - FinTech & Employee Wellness Integration: *Earned Wage Access* (EWA resmi dan aman), asuransi tambahan pekerja, dan perencanaan dana pensiun terintegrasi.
