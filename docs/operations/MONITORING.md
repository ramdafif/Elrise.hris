# MONITORING & HEALTH CHECK GUIDE — NUSANTARA HRIS ENTERPRISE

Dokumen ini mendefinisikan metrik pemantauan kesehatan sistem, endpoint liveness/readiness probe, dan ambang batas peringatan (*Alerting Thresholds*).

---

## 1. System Health Probes

Sistem mengekspos endpoint pemantauan status kesehatan:
- **`GET /api/health/liveness`**: Mengembalikan status HTTP 200 jika proses Node.js sedang berjalan.
- **`GET /api/health/readiness`**: Menguji konektivitas nyata ke database PostgreSQL dan cache Redis. Mengembalikan HTTP 200 jika seluruh dependensi siap melayani lalu lintas, atau HTTP 503 jika database terputus.

---

## 2. Peringatan Dini (Critical Alerting Rules)

Sistem pemantauan dikonfigurasi untuk mengirim peringatan darurat otomatis via PagerDuty / Slack:
1. **Database Connection Pool Saturation**: Penggunaan pool koneksi PostgreSQL $\ge 85\%$ selama lebih dari 3 menit berturut-turut.
2. **API Error Rate Spike**: Persentase respons HTTP 5xx melebihi **1.0%** dari total lalu lintas dalam jendela 5 menit.
3. **Slow Payroll Worker**: Pekerja batch payroll terhenti (*stalled*) atau gagal memproses chunk selama lebih dari 10 menit.
4. **Elevated Latency**: Waktu respon P95 pada endpoint presensi Clock In melebihi **1.000 ms**.
