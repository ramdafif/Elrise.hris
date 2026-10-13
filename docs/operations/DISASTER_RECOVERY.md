# DISASTER RECOVERY PLAN (DRP) — NUSANTARA HRIS ENTERPRISE
## Business Continuity, Failover Protocol, and Critical Service Restoration

**Classification:** CONFIDENTIAL  
**Status:** SEMI-PRODUCTION READY  
**RPO Target:** < 1 Jam | **RTO Target:** < 4 Jam

---

## 1. Disaster Scenarios & Recovery Strategy

| Skenario Bencana | Potensi Dampak | Strategi Pemulihan (Failover) |
|---|---|---|
| **Kegagalan Data Center Utama** | Seluruh instance aplikasi dan database tidak dapat diakses. | Failover otomatis multi-zone Cloud Run + Cloud SQL High Availability (HA) standby instance di region terpisah. |
| **Korupsi Data Payroll / Human Error** | Data penggajian terhapus atau berubah secara keliru. | Point-in-Time Recovery (PITR) dari WAL archive ke waktu tepat sebelum insiden terjadi. |
| **Kompromi Kredensial / Ransomware** | Kunci enkripsi atau credential database bocor. | Eksekusi Incident Response P0: isolasi instance, rotasi darurat seluruh keys/secret, restore data terverifikasi ke cluster bersih. |

---

## 2. Emergency Recovery Steps

1. **Deklarasi Darurat:** Incident Commander menetapkan status bencana dan mengaktifkan tim respons darurat.
2. **Pengalihan Lalu Lintas Jaringan (Traffic Rerouting):** Ubah DNS / Load Balancer ke lingkungan cadangan (*Secondary Standby Region*).
3. **Penyelarasan Data:** Verifikasi sinkronisasi database sekunder atau restore dari snapshot WAL terbaru.
4. **Validasi Kepatuhan & Integritas:** Pastikan seluruh rule perpajakan (PPh 21 TER, PTKP, BPJS) dan data audit tetap utuh.
5. **Pemberitahuan Stakeholder:** Berikan pembaruan status transparan kepada manajemen dan pengguna sesuai SLA.
