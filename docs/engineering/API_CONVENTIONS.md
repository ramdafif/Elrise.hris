# API CONVENTIONS — NUSANTARA HRIS ENTERPRISE

Dokumen ini mendefinisikan standar perancangan antarmuka pemrograman aplikasi (API), format URL, konvensi payload, dan kontrak respons di lingkungan Nusantara HRIS.

---

## 1. RESTful URL & Resource Design

- Seluruh endpoint API publik/internal diawali dengan prefix versi: `/api/v1/...`
- Gunakan kata benda jamak (*plural nouns*) untuk koleksi resource:
  - `GET /api/v1/employees` - Mengambil daftar karyawan.
  - `POST /api/v1/employees` - Mendaftarkan karyawan baru.
  - `GET /api/v1/employees/:id` - Mengambil rincian profil karyawan.
  - `PATCH /api/v1/employees/:id` - Memperbarui sebagian data karyawan.
  - `POST /api/v1/payroll-periods/:id/lock` - Aksi spesifik bisnis (RPC-style action).

---

## 2. Standard Success Response Contract

Respons sukses wajib memuat amplop (*envelope*) standar:

```json
{
  "success": true,
  "data": {
    "id": "e-101",
    "employeeId": "EMP-2024-001",
    "fullName": "Budi Santoso",
    "grossSalary": 15000000.00
  },
  "meta": {
    "requestId": "req-987654",
    "timestamp": "2026-09-06T18:25:01Z"
  }
}
```

Untuk respons kumpulan data (*collections*), `meta` memuat informasi pagination cursor:

```json
{
  "success": true,
  "data": [...],
  "meta": {
    "hasNextPage": true,
    "nextCursor": "eyJpZCI6ImUtMTA1In0=",
    "totalCount": 450
  }
}
```
