# RELEASE PROCESS & DEPLOYMENT LIFECYCLE — NUSANTARA HRIS ENTERPRISE

Dokumen ini mendefinisikan alur rilis perangkat lunak, tahapan verifikasi kualitas, dan kebijakan peluncuran fitur.

---

## 1. Release Lifecycle Pipeline

```text
[DEVELOPMENT] ──> [AUTOMATED CI/CD] ──> [STAGING ENVIRONMENT] ──> [PRODUCTION (CANARY)]
     │                    │                     │                         │
     ▼                    ▼                     ▼                         ▼
 Local Feature     Lint, Typecheck,       QA UAT Testing,           10% Canary Traffic,
 Development &     Unit & Integration     Compliance Audit          Full Rollout &
 Peer Review       Tests Verification     Sign-off                  Rollback Ready
```

---

## 2. Verifikasi Khusus Penggajian (Payroll Certification Gate)

Setiap rilis yang memodifikasi berkas di dalam modul penggajian (`/modules/payroll/`, `lib/payrollEngine.ts`, atau skema pajak) **wajib** melalui *Payroll Certification Gate*:
1. **Gold Master Test Suite**: Menjalankan 500 kasus uji penggajian acuan (*gold test cases*) yang mencakup kombinasi status PTKP TK/0 s.d K/3, variasi lembur, dan batas upah BPJS.
2. **Zero Discrepancy Verification**: Hasil komputasi dari kode baru harus 100% identik dengan hasil acuan regulasi.
3. **Persetujuan Ganda (*Dual Sign-off*)**: Wajib mendapatkan persetujuan dari Lead Software Engineer dan Spesialis Kepatuhan Pajak/Payroll sebelum digabungkan ke branch utama (*production branch*).
