# CACHING STRATEGY — NUSANTARA HRIS ENTERPRISE

Dokumen ini mendefinisikan lapisan *caching*, kebijakan masa berlaku data (*TTL*), serta mekanisme pembersihan cache (*invalidation*) untuk mengoptimalkan efisiensi sistem.

---

## 1. Multi-Tiered Caching Hierarchy

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. BROWSER / EDGE CACHING (HTTP Cache-Control Headers)      │
│    - Aset Statis, Font, Logo Perusahaan, Dokumen Regulasi   │
│    - TTL: 1 hari s.d 1 tahun (Imutabel dengan hash bundel)  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. APPLICATION MEMORY CACHING (Next.js Data Cache / SWR)    │
│    - Tabel Regulasi Statis: PTKP, Bracket PPh 21 TER, BPJS  │
│    - Daftar Departemen & Struktur Organisasi Perusahaan     │
│    - TTL: 1 jam atau invalidasi instan via tag              │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. DISTRIBUTED CACHE LAYER (Redis In-Memory Data Store)     │
│    - Token Sesi Aktif & Status Izin Pengguna                │
│    - Jadwal Shift Harian & Koordinat Geofence Cabang        │
│    - Status Progress Batch Payroll Calculation              │
│    - TTL: 5 menit s.d 24 jam                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Aturan Emas Caching Finansial

> **PERINGATAN KRITIS:**  
> Data kalkulasi penggajian yang sedang berlangsung (*Draft Payroll Calculation*) **TIDAK BOLEH** disimpan dalam cache memori yang tidak transaksional. Perhitungan finansial harus selalu membaca langsung dari database sumber untuk mencegah inkonsistensi saldo.

---

## 3. Strategi Cache Invalidation

1. **Tag-Based Invalidation**: Menggunakan `revalidateTag` Next.js saat data master diperbarui:
   - Pembaruan profil karyawan memicu invalidasi tag `employee-[id]`.
   - Pembaruan struktur departemen memicu invalidasi tag `departments-[companyId]`.
2. **TTL Otomatis**: Kunci Redis untuk rekap kehadiran real-time memiliki TTL pendek (60 detik) untuk menjamin metrik dasbor tetap segar tanpa membebani database utama.
