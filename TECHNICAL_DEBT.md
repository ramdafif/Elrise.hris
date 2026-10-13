# TECHNICAL DEBT REGISTRY — NUSANTARA HRIS ENTERPRISE

Registri ini mencatat seluruh kompromi teknis sementara, area perbaikan yang diidentifikasi, serta rencana tindak lanjut teknis agar kode tetap sehat, terukur, dan aman untuk skala nasional.

---

## Technical Debt Index

| ID | Deskripsi Masalah | Dampak Sistemik | Prioritas | Solusi yang Diusulkan | Status |
| :--- | :--- | :--- | :---: | :--- | :---: |
| **TD-001** | Kalkulasi payroll batch besar dan beban pemrosesan massal (50.000+ staf) | Berpotensi timeout/lambat jika dieksekusi secara synchronous dalam satu siklus HTTP request | **High** | 1. **Prisma Read/Write Primary**: Rute `/api/employees` telah dialihkan menggunakan Prisma sebagai sumber baca-tulis utama (await-first).<br>2. **Paginasi & Batching Endpoint**: Cursor-based repository query.<br>3. **Asynchronous Background Worker**: Implementasi Redis + BullMQ worker dengan notifikasi real-time. | **In Progress (Fase 1 Prisma Primary)** |
| **TD-002** | Isolasi tenant saat ini masih mengandalkan logical filtering manual pada query Prisma (Repository sudah konsisten menyertakan `where: { tenantId }`) | Rentan jika developer lupa menyertakan klausa `tenantId` pada query baru | **High** | Implementasi Prisma Client Extension untuk otomatis menyuntikkan `where: { tenantId }` di semua query transaksional tanpa perlu penulisan manual | Planned |
| **TD-003** | File export perbankan (BCA/Mandiri) di-generate langsung di browser | Kurang optimal untuk file teks berukuran puluhan megabyte | **Medium** | Generate file export di backend stream worker dan simpan di S3/Cloud Storage sementara dengan URL bertanda tangan (Presigned URL) | Planned |
| **TD-004** | Formula PPh 21 Pasal 17 Tahunan Masa Pajak Desember memerlukan rekonsiliasi otomatis 11 bulan sebelumnya | Membutuhkan perhitungan manual jika ada variasi penghasilan tidak teratur di akhir tahun | **Medium** | Buat modul auto-reconciliation engine untuk masa pajak Desember yang secara otomatis menarik seluruh SPT masa Jan-Nov | In Progress |
| **TD-005** | Riwayat log audit disimpan pada tabel yang sama dengan database operasional | Pada skala puluhan juta rekaman per tahun, tabel `AuditLog` dapat memperbesar cadangan database utama | **Low** | Pemisahan penyimpanan cold audit log ke PostgreSQL partition atau Time-Series Database / Data Lake terpisah setelah 90 hari | Planned |
| **TD-006** | Masking NIK, NPWP, Rekening, dan Kompensasi pada level API endpoint | Risiko kebocoran data sensitif jika API diekspos langsung | **High** | Terapkan server-side RBAC scoping dan serializer masking di seluruh endpoint API | **Resolved** |
| **TD-007** | Endpoint monolitik `/api/data` memuat seluruh data transaksional dan referensi sekaligus tanpa paginasi | Konsumsi memori dan bandwidth tinggi saat volume data karyawan dan absensi meningkat | **High** | Pisahkan `/api/data` murni untuk Reference Data; implementasikan cursor-based pagination langsung ke database Prisma findMany (`?cursor=&limit=`). Prisma adalah sumber baca-tulis utama, bukan lagi in-memory array. In-memory cache hanya digunakan untuk data referensi kecil statis dengan dokumentasi pengecualian eksplisit. | **Resolved (Prisma Primary Source of Truth)** |
| **TD-008** | Monolithic View Components (>1.000 baris per file) dan Initial Bundle Bloat (seluruh modul view diimpor statis di root page) | Menyulitkan kolaborasi tim, meningkatkan risiko konflik merge, dan memperlambat First Load JS untuk seluruh role | **High** | 1. Dekomposisi komponen view per domain (`components/employees/`) dengan Custom Hook pattern (`lib/hooks/useEmployees.ts`).<br>2. Dynamic code-splitting via `next/dynamic` dengan fallback `ViewSkeleton.tsx` dan blokade unduhan berbasis RBAC (`ROLE_ALLOWED_TABS`). | **Resolved (Fase 3 & 4)** |

---

## Protocol Pemeliharaan Technical Debt

1. Setiap developer atau AI agent yang menemukan potensi *bottleneck* atau kompromi sementara **wajib** mencatat entri baru pada tabel di atas.
2. Setiap kali ada penyelesaian perbaikan teknis, ubah status menjadi `Resolved` dan cantumkan nomor commit atau PR terkait.
3. Utang teknis berstatus **High** tidak boleh dibiarkan lebih dari 2 siklus rilis mayor.
