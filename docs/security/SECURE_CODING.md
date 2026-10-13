# SECURE CODING GUIDELINES — NUSANTARA HRIS ENTERPRISE
## Input Validation, Mass Assignment Defense, XSS, CSRF & SQL Injection

**Classification:** CONFIDENTIAL  
**Status:** SEMI-PRODUCTION READY  

---

## 1. Zero-Trust Input Validation (Zod Schemas)

Setiap request dari browser, API client, maupun webhook dianggap **UNTRUSTED**:
- Seluruh endpoint API dan Server Action wajib memvalidasi payload menggunakan schema **Zod** sebelum diteruskan ke database atau kalkulasi bisnis.
- Tipe data divalidasi secara ketat: format string, regex NIK (16 digit angka), NPWP, email valid, enum role yang sah, dan batasan numerik/Decimal.

### Aturan Anti-Mass Assignment
Dilarang keras melakukan generic spreading dari request body ke dalam query database:
```typescript
// DILARANG (Vulnerable to Mass Assignment):
const data = await req.json();
await prisma.employee.update({ where: { id }, data });

// WAJIB (Explicit Whitelist Sanitization via Zod):
const validatedData = updateEmployeeSchema.parse(await req.json());
await prisma.employee.update({
  where: { id: actorScopedId },
  data: {
    fullName: validatedData.fullName,
    phone: validatedData.phone,
    address: validatedData.address,
    // Field seperti role, salary, dan tenantId TIDAK BOLEH di-spread sembarangan!
  }
});
```

---

## 2. SQL Injection & Database Parameterization

- Seluruh akses database menggunakan ORM (Prisma / Drizzle) yang secara otomatis melakukan parameterization query.
- Dilarang membuat raw SQL menggunakan *string concatenation* atau template literals tidak aman (`SELECT * FROM users WHERE email = '${email}'`).
- Jika raw query mutlak diperlukan, gunakan safe tagged template literal (`sql` helper) dengan parameter placeholder.

---

## 3. Cross-Site Scripting (XSS) Prevention

- Next.js React JSX secara default melakukan context-aware auto-escaping terhadap seluruh ekspresi `{variable}`.
- Penggunaan `dangerouslySetInnerHTML` dilarang keras di seluruh modul aplikasi.
- Seluruh input teks kaya (*rich-text*) disanitasi menggunakan pustaka pembersih HTML standar sebelum disimpan atau dirender.

---

## 4. Cross-Site Request Forgery (CSRF) & State-Changing Methods

- Seluruh aksi mutasi data wajib menggunakan metode HTTP eksplisit: `POST`, `PUT`, `PATCH`, atau `DELETE`.
- Penggunaan cookie otentikasi wajib dikonfigurasi dengan atribut `SameSite=Lax` atau `SameSite=Strict`.
- Header kustom seperti `X-Requested-With` atau Anti-CSRF token diverifikasi pada request mutasi kritis.

---

## 5. File Upload & Private Document Access

Aplikasi mengelola berkas rahasia seperti KTP, NPWP, Ijazah, dan Kontrak Kerja:
- **Validasi Ketat:** Validasi MIME type, ekstensi file yang diizinkan (PDF, PNG, JPG), dan batas ukuran maksimal (5MB). Eksekusi script (.exe, .sh, .php, .js) diblokir total.
- **Randomized Storage Filename:** Nama file yang diunggah diganti menggunakan UUID acak (`crypto.randomUUID()`) untuk mencegah path traversal.
- **Private Access Control:** Berkas TIDAK PERNAH disimpan di folder publik web server (`/public/`). Unduhan berkas dilayani melalui endpoint otentikasi (`/api/documents/[id]`) atau short-lived signed URL (maksimal 15 menit).
