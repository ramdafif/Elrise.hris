# ADR-0006: Asynchronous Job Processing with Queue Abstraction

- **Status:** Accepted
- **Date:** 2026-09-06
- **Deciders:** Infrastructure Lead, Backend Architect

---

## Context
Operasi berskala besar seperti kalkulasi penggajian bulanan untuk ribuan karyawan, pembuatan ribuan berkas slip gaji PDF, pengiriman notifikasi masif, serta ekspor laporan analitik dapat memakan waktu puluhan detik hingga menit. Menjalankan operasi ini di dalam siklus permintaan HTTP sinkron akan menyebabkan koneksi timeout, pemborosan sumber daya server, dan kegagalan transaksi.

## Decision
Kami menetapkan arsitektur **Job Queue Abstraction**:
1. Seluruh operasi intensif didefinisikan sebagai *job payloads* (misal `payroll.calculate`, `payslip.generate`, `report.export`, `notification.send`).
2. Implementasi antarmuka antrean modular (`JobQueueAdapter`) yang mendukung driver in-memory untuk pengujian, serta driver Redis / BullMQ / Google Cloud Tasks / AWS SQS untuk lingkungan produksi.
3. Job worker berjalan di proses latar belakang terisolasi dengan mekanisme retry otomatis, dead-letter queue (DLQ), idempotency key, dan audit logging pada setiap kegagalan atau keberhasilan eksekusi.

## Alternatives Considered
- **Direct Synchronous Execution**: Menjalankan seluruh batch kalkulasi di dalam satu request POST HTTP; ditolak karena melanggar batas timeout gateway (30s) dan memblokir thread web server.
- **Node.js Worker Threads Tanpa Queue**: Ditolak karena kehilangan state ketika container server restart atau terjadi auto-scaling.

## Consequences
- **Positif**: Antarmuka web tetap responsif (sub-100ms); pemrosesan batch payroll skala 100.000+ karyawan dapat ditangani dengan skalabilitas horizontal worker; kegagalan satu slip gaji tidak menggagalkan seluruh batch.
- **Negatif**: Menambah dependensi infrastruktur antrean (seperti Redis) saat beralih ke skala produksi penuh.
