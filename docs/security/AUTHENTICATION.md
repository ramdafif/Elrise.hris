# AUTHENTICATION SPECIFICATION — NUSANTARA HRIS ENTERPRISE
## Semi-Production Authentication, Password Policy & MFA Readiness

**Classification:** CONFIDENTIAL  
**Status:** SEMI-PRODUCTION READY  

---

## 1. Authentication Strategy & Principles

Aplikasi Nusantara HRIS Enterprise mengadopsi prinsip **Secure Defaults** dan **Zero Trust**:
- **Tidak Pernah Menyimpan Password Plaintext**: Seluruh password disimpan menggunakan algoritma *adaptive hashing* (Argon2id / bcrypt dengan minimum 12 salt rounds).
- **No User Enumeration**: Response dari login failure dan password reset tidak pernah membocorkan apakah suatu akun atau email terdaftar dalam sistem. Selalu mengembalikan pesan generik: *"Kredensial atau informasi yang dimasukkan tidak valid"*.
- **Session Security**: Session token disimpan di cookie dengan atribut `HttpOnly`, `Secure` (pada staging/production), `SameSite=Strict`/`Lax`, dan masa berlaku terbatas.
- **Immediate Invalidation**: Sesi langsung dihanguskan (*invalidated*) saat pengguna logout, mengubah password, atau mengalami perubahan wewenang/role (*privilege rotation*).

---

## 2. Password Policy Specification

Kebijakan kata sandi dikonfigurasi melalui engine `lib/security/crypto.ts` untuk memastikan kekuatan kredensial tanpa mempersulit pengguna:

| Kriteria | Batas Minimal / Aturan | Keterangan |
|---|---|---|
| **Panjang Minimal** | 12 karakter | Mencegah serangan brute force kamus |
| **Kompleksitas** | Huruf besar, huruf kecil, angka, simbol | Memastikan entropi tinggi |
| **Common Passwords Check** | 10.000 sandi terpopuler diblokir | Termasuk: *password123*, *admin123*, dll. |
| **Reused Password Check** | 3 sandi terakhir tidak boleh digunakan kembali | Disimpan dalam bentuk hash riwayat |
| **Token Reset Expiry** | 15 menit | Single-use cryptographically random token |

---

## 3. Brute Force Protection & Progressive Lockout

Untuk mencegah serangan credential stuffing dan brute-force login:
1. **Sliding Window Rate Limiter**:
   - Maksimal **5 percobaan login gagal per IP** dalam jendela 5 menit.
   - Maksimal **5 percobaan login gagal per Akun/Email** dalam jendela 15 menit.
2. **Progressive Delay & Account Lockout**:
   - Gagal ke-3: Penundaan buatan (*artificial delay*) 2 detik sebelum respon.
   - Gagal ke-5: Akun terkunci sementara selama 15 menit. Notifikasi keamanan dikirimkan ke email terdaftar.
   - Kegagalan tercatat dalam tabel jejak audit keamanan (`SecurityEvent.FAILED_LOGIN`).

---

## 4. Multi-Factor Authentication (MFA) Architecture

Nusantara HRIS dirancang dengan kapabilitas **MFA-Ready**:
- **Metode Didukung:** Time-based One-Time Password (TOTP, RFC 6238) via Google Authenticator, Microsoft Authenticator, atau hardware tokens (WebAuthn/Passkeys).
- **Mandatory Policy for Sensitive Roles:**
  - `SUPER_ADMIN` : Wajib MFA aktif untuk login dan aksi destruktif.
  - `HR_ADMIN` : Wajib MFA untuk ekspor data massal.
  - `PAYROLL_ADMIN` : Wajib MFA untuk persetujuan (`payroll.approve`) dan penguncian (`payroll.lock`).
- **Emergency Recovery Codes:** Disediakan 8 kode darurat satu kali pakai (*single-use hashed recovery codes*) saat inisialisasi MFA.
