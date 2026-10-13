# ERROR HANDLING SYSTEM — NUSANTARA HRIS ENTERPRISE

Dokumen ini mendefinisikan taksonomi kesalahan terpusat (*Centralized Error Taxonomy*), format respons kesalahan standar, dan aturan penanganan kegagalan sistem.

---

## 1. Centralized Error Taxonomy

Setiap kesalahan aplikasi diklasifikasikan ke dalam kode error yang terstandarisasi:

| Kode Error | Kategori | HTTP Status | Deskripsi bagi Pengguna |
| :--- | :--- | :---: | :--- |
| `AUTH_UNAUTHORIZED` | Otentikasi | 401 | Sesi Anda telah berakhir. Silakan masuk kembali. |
| `AUTH_FORBIDDEN` | Otorisasi | 403 | Anda tidak memiliki wewenang untuk mengakses data ini. |
| `TENANT_NOT_FOUND` | Multi-Tenant | 404 | Konteks penyewa perusahaan tidak ditemukan. |
| `EMPLOYEE_NOT_FOUND` | Master HR | 404 | Catatan data karyawan tidak ditemukan dalam sistem. |
| `PAYROLL_PERIOD_LOCKED` | Penggajian | 409 | Periode payroll telah dikunci dan tidak dapat diubah lagi. |
| `PAYROLL_CALCULATION_FAILED`| Finansial | 422 | Terjadi kesalahan komputasi pada pemrosesan komponen gaji. |
| `INVALID_TAX_RULE` | Regulasi | 422 | Aturan konfigurasi PPh 21 TER tidak valid atau kedaluwarsa. |
| `INVALID_BPJS_RULE` | Regulasi | 422 | Konfigurasi batas plafon upah BPJS tidak ditemukan. |
| `OVERTIME_LIMIT_EXCEEDED` | Kepatuhan | 422 | Durasi lembur melebihi batas legal PP 35/2021 (maks 4 jam/hari). |
| `VALIDATION_ERROR` | Masukan | 400 | Data yang Anda kirimkan tidak memenuhi format yang valid. |
| `INTERNAL_SERVER_ERROR` | Sistem | 500 | Terjadi kendala internal pada server. Silakan hubungi admin. |

---

## 2. Standard JSON Error Response Contract

Seluruh API endpoint dan Server Actions mengembalikan struktur respons kesalahan yang seragam:

```json
{
  "success": false,
  "error": {
    "code": "PAYROLL_PERIOD_LOCKED",
    "message": "Periode penggajian Agustus 2026 telah dikunci resmi dan tidak dapat diubah.",
    "details": {
      "periodId": "8b5840e6-b08e-4a64-9be8-c5cbcfb00001",
      "lockedAt": "2026-08-25T14:30:00Z",
      "lockedBy": "Dewi Sartika (Payroll Admin)"
    },
    "requestId": "req-9a8b7c6d-5e4f"
  }
}
```

> **KEBIJAKAN KEAMANAN:**  
> Dilarang keras mengekspos *internal stack trace*, query SQL mentah, atau path berkas server dalam respons error kepada pengguna publik.
