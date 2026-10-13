# SECRETS MANAGEMENT SPECIFICATION — NUSANTARA HRIS ENTERPRISE
## Environment Variables, Key Rotation, KMS & Zero-Leakage Policy

**Classification:** CONFIDENTIAL  
**Status:** SEMI-PRODUCTION READY  

---

## 1. Zero-Leakage Directive

- **Dilarang Keras Menyimpan Rahasia dalam Git/Source Code:** Seluruh API keys, password database, session secret, dan private keys wajib dimuat via environment variables.
- **Fail-Fast Startup Validation:** Sistem memeriksa keberadaan seluruh variabel wajib saat inisialisasi aplikasi. Jika variabel kunci tidak tersedia pada mode produksi, aplikasi menolak start untuk mencegah *insecure fallback*.
- **Client Bundle Isolation:** Rahasia server (`AUTH_SECRET`, `ENCRYPTION_KEY`, `DATABASE_URL`) tidak pernah diawali dengan prefix `NEXT_PUBLIC_` sehingga terisolasi dari browser DevTools.
- **Sanitized Logging:** Logger secara otomatis menyaring (*redact*) nilai rahasia, password, token otentikasi, dan cookie dari pesan log.

---

## 2. Core Secrets Inventory

| Nama Variabel | Fungsi & Kategori | Panjang / Format | Siklus Rotasi |
|---|---|---|---|
| `AUTH_SECRET` | Kunci enkripsi & verifikasi session token / JWT | Minimum 32 karakter (256-bit random hex) | 90 hari |
| `ENCRYPTION_KEY` | Kunci enkripsi AES-256-GCM data sensitif at-rest | 32 byte base64-encoded key | 180 hari (re-encrypt batch) |
| `DATABASE_URL` | Koneksi database PostgreSQL/MySQL berizin least-privilege | URL koneksi terisolasi | Sesuai rotasi DB user |
| `STORAGE_SECRET` | Kredensial penyimpanan berkas privat (S3/GCS bucket) | IAM service account key | 90 hari |
| `SMTP_PASSWORD` | Kredensial pengiriman email notifikasi & OTP | App-specific password | 180 hari |

---

## 3. Transition to Cloud Key Management (Vault / Google Cloud KMS)

Untuk kesiapan produksi penuh (*Full Production*), `lib/security/crypto.ts` dirancang modular agar dapat berpindah dari environment variables ke Google Cloud KMS / HashiCorp Vault tanpa mengubah antarmuka API service:
- Envelope encryption: Dekripsi data-encryption-key (DEK) menggunakan key-encryption-key (KEK) dari KMS.
- Automatic audit trail pada setiap akses kunci kriptografi.
