# GIT WORKFLOW & COMMIT CONVENTIONS — NUSANTARA HRIS ENTERPRISE

Dokumen ini mendefinisikan strategi pencabangan (*branching model*) dan standar pesan komit Git.

---

## 1. Branching Strategy (Trunk-Based with Short-Lived Feature Branches)

```text
main ──────────────────────────────────────────────────────── (Production Ready)
       │                              ▲
       └── feature/payroll-ter-calc ──┘ (PR with automated tests passing)
```
- **`main`**: Branch utama yang selalu dalam kondisi stabil, dapat dibuild (*always green*), dan siap dideploy ke produksi kapan pun.
- **`feature/*`**: Branch fitur baru (contoh: `feature/pph21-ter-december-reconciliation`).
- **`fix/*`**: Branch perbaikan bug standar (contoh: `fix/geofence-radius-check`).
- **`hotfix/*`**: Branch perbaikan darurat untuk rilis produksi (contoh: `hotfix/bpjs-wage-cap-adjustment`).

---

## 2. Conventional Commits Standard

Setiap pesan komit wajib mematuhi format [Conventional Commits](https://www.conventionalcommits.org/):

```text
<type>(<scope>): <short summary in imperative mood>

[optional body describing why the change was made]

[optional footer with issue reference]
```

### Daftar Tipe Komit:
- `feat`: Penambahan fitur baru bagi pengguna (contoh: `feat(payroll): add BCA payroll batch export formatter`).
- `fix`: Perbaikan bug yang mempengaruhi perilaku aplikasi (contoh: `fix(overtime): correct holiday overtime 3x multiplier threshold`).
- `refactor`: Perubahan struktur kode tanpa mengubah fungsionalitas publik (contoh: `refactor(attendance): extract haversine formula into date utils`).
- `docs`: Penambahan atau pembaruan dokumentasi (contoh: `docs(compliance): update PMK 168/2023 technical specification`).
- `test`: Penambahan atau penyesuaian unit/integration test (contoh: `test(tax): add test cases for TER Category B brackets`).
- `perf`: Optimasi performa dan pengurangan waktu eksekusi query (contoh: `perf(db): add composite index on AttendanceLog(tenantId, date)`).
- `security`: Peningkatan keamanan, patching celah, atau proteksi privasi (contoh: `security(ess): enforce strict bank account masking`).
