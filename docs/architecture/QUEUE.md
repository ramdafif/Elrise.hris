# QUEUE & BACKGROUND JOBS ARCHITECTURE — NUSANTARA HRIS ENTERPRISE

Dokumen ini merinci arsitektur pemrosesan asinkron untuk tugas-tugas komputasi berat, menjamin latensi respon API tetap di bawah 200 milidetik bahkan saat memproses ribuan data secara serentak.

---

## 1. Mengapa Background Jobs Wajib?

Operasi penggajian bulanan untuk 10.000 karyawan melibatkan jutaan perhitungan: penarikan absensi 30 hari, perhitungan jam lembur bertingkat PP 35/2021, evaluasi bracket tarif TER PP 58/2023, hingga pemotongan iuran jaminan sosial.

Mengeksekusi proses ini secara sinkron di dalam satu siklus permintaan HTTP (*HTTP request cycle*) akan mengakibatkan:
- Gateway timeout (HTTP 504).
- Beban lonjakan memori (*memory spike*) yang dapat memicu *crash* pada server aplikasi.
- Ketidaknyamanan pengguna yang harus menatap layar pemuatan (*loading spinner*) tanpa kepastian.

---

## 2. Job Queue Architecture

Sistem mengadopsi pola antrean terdistribusi berbasis **Redis** dan **BullMQ**:

```text
[Next.js Web / API]
       │
       ▼ (Enqueue Job Payload)
┌─────────────────────────────────────────────────────────────┐
│                  REDIS QUEUE MANAGER                        │
│   ├── queue:payroll-calculation                             │
│   ├── queue:payslip-pdf-generation                          │
│   ├── queue:bank-export-generation                          │
│   └── queue:notification-dispatch                           │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼ (Pekerja 1)                  ▼ (Pekerja N)
┌──────────────────────────────┐┌─────────────────────────────┐
│ PAYROLL CALCULATION WORKER   ││ NOTIFICATION DISPATCH WORKER│
│ - Proses per 100 staf/chunk  ││ - Kirim slip via Email / WA │
│ - Update progress % ke Redis ││ - Retry dengan backoff expo │
└──────────────┬───────────────┘└─────────────────────────────┘
               │
               ▼ (Simpan Snapshot Hasil)
┌─────────────────────────────────────────────────────────────┐
│                 POSTGRESQL DATABASE                         │
│             Data Tersimpan Aman & Akurat                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Daftar Worker Jobs Standar

| Nama Job | Pemicu (Trigger) | Perilaku & Toleransi Kesalahan |
| :--- | :--- | :--- |
| `payroll.calculate_period` | HR menekan tombol "Kalkulasi Ulang" | Membagi daftar staf ke dalam chunk 200 orang; pembaruan progress bar real-time; idempotent. |
| `payroll.generate_payslips` | Periode payroll berstatus `LOCKED` | Menghasilkan PDF slip gaji resmi secara massal dan mengunggah ke penyimpanan dokumen. |
| `payroll.export_bank_batch` | Permintaan unduh format bank | Menyusun berkas teks/CSV BCA Payroll atau Mandiri MCM dalam format stream. |
| `notification.send_whatsapp` | Cuti diajukan / Lembur disetujui | Mengirim pesan singkat ke manajer dengan tautan aksi satu klik. Retry hingga 3x jika gagal jaringan. |
| `compliance.check_expiry` | Cron harian (pukul 01:00 WIB) | Memeriksa kontrak PKWT dan dokumen kerja yang akan kedaluwarsa dalam 30 hari. |
