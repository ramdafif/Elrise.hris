# LOGGING & OBSERVABILITY — NUSANTARA HRIS ENTERPRISE

Dokumen ini mendefinisikan standar pencatatan log aplikasi (*Application Logging*), penelusuran terdistribusi (*Distributed Tracing*), dan metrik kesehatan sistem.

---

## 1. Structured Logging Standard (JSON Output)

Seluruh log server wajib dicetak dalam format terstruktur JSON untuk mempermudah agregasi di cloud log collectors (seperti Google Cloud Logging, Datadog, atau ELK Stack):

```json
{
  "timestamp": "2026-09-06T18:25:01.123Z",
  "level": "INFO",
  "service": "nusantara-hris-payroll",
  "tenantId": "t-001-nusantara-tech",
  "userId": "usr-8899",
  "requestId": "req-12345-abcdef",
  "message": "Payroll batch calculation completed successfully",
  "context": {
    "periodId": "pay-2026-08",
    "totalEmployees": 450,
    "durationMs": 1420
  }
}
```

---

## 2. Log Levels & Usage Guidelines

- **DEBUG**: Informasi diagnosis teknis terperinci, hanya diaktifkan di lingkungan pengembangan lokal (*development environment*).
- **INFO**: Peristiwa operasional normal yang signifikan (contoh: *User logged in*, *Payroll period opened*, *Export file generated*).
- **WARN**: Kondisi tidak biasa yang tidak menyebabkan crash namun patut diperhatikan (contoh: *Employee clocked in 2 meters outside geofence*, *Slow query detected > 500ms*).
- **ERROR**: Kegagalan operasional yang membutuhkan penanganan (contoh: *Failed to send payslip email*, *Database connection pool timeout*).

---

## 3. Data Sanitization Policy in Logs

Dilarang keras mencatat data sensitif (*Sensitive PII*) dalam log mentah:
- **DILARANG**: Kata sandi (*password*), token otentikasi utuh (*Bearer Token*), nomor rekening bank utuh, nomor kartu kredit/debit.
- **WAJIB DISAMARKAN**: NIK, NPWP, dan nomor telepon wajib disamarkan jika muncul dalam log diagnostik.
