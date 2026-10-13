# ADR-0008: REST API Platform v1 Architecture and Versioning

- **Status:** Accepted
- **Date:** 2026-09-06
- **Deciders:** API Architect, Integration Lead

---

## Context
Platform perlu menyediakan antarmuka terprogram untuk integrasi dengan sistem eksternal (sistem ERP, mesin absensi biometrik, core banking perbankan, dan aplikasi mobile pihak ketiga).

## Decision
Kami menetapkan standar **API v1 Platform**:
1. Base path terpusat di `/api/v1/*` dengan versioning eksplisit pada URI untuk menjaga backward compatibility.
2. Otentikasi ganda: Sesi berbasis Cookie/JWT untuk browser web dan API Key / Bearer Token dengan hashing SHA-256 untuk integrasi server-to-server.
3. Penegakan isolasi tenant wajib di tingkat middleware: setiap request API Key hanya memiliki cakupan (*scope*) tenant pemiliknya.
4. Pembatasan laju (*rate limiting*) menggunakan token bucket / sliding window per API key dan per IP.
5. Format respons terstandarisasi:
   - Sukses: `{ success: true, data: ..., meta: { page, limit, total } }`
   - Gagal: `{ success: false, error: { code, message, details, requestId } }`

## Alternatives Considered
- **GraphQL**: Ditolak untuk tahap v1 karena kompleksitas autorisasi field-level dan risiko query mendalam (*N+1 resource exhaustion attacks*) yang berpotensi membebani database transaksional.
- **Unversioned API**: Ditolak karena setiap pembaruan skema data berpotensi merusak integrasi mesin absensi pihak ketiga.

## Consequences
- **Positif**: Integrator pihak ketiga memiliki kejelasan kontrak data; keamanan terisolasi penuh per tenant; debugging mudah dengan pelacakan `requestId`.
- **Negatif**: Perlu pemeliharaan dokumentasi OpenAPI/Swagger yang disiplin.
