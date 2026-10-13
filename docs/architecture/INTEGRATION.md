# INTEGRATION ARCHITECTURE — NUSANTARA HRIS ENTERPRISE

Dokumen ini mendefinisikan lapisan abstraksi integrasi eksternal (Adapter Pattern), antarmuka perbankan, portal pemerintah, dan sistem akuntansi pihak ketiga.

---

## 1. Principles of External Integration

1. **Vendor Agnostic**: Logika bisnis domain tidak boleh terikat secara langsung (*tightly coupled*) pada format atau SDK spesifik vendor pihak ketiga.
2. **Adapter & Interface Pattern**: Setiap integrasi pihak ketiga diisolasi di balik sebuah antarmuka kontrak TypeScript:
   ```typescript
   export interface BankTransferProvider {
     name: string;
     generateBatchFile(items: PayrollTransferItem[]): Promise<string | Buffer>;
     verifyAccount?(accountNumber: string, bankCode: string): Promise<AccountVerificationResult>;
   }
   ```
3. **Resilience & Idempotency**: Setiap pertukaran data finansial dengan pihak luar wajib memiliki kunci idempotensi (*Idempotency Key*) untuk mencegah eksekusi transfer ganda jika terjadi kegagalan jaringan sementara.

---

## 2. Integrasi Utama

### A. Perbankan Nasional (Payroll Disbursement)
- **BCA**: Format file teks *BCA Payroll Auto-Transfer* dan integrasi API *BCA Snap / Corporate API*.
- **Bank Mandiri**: Format CSV *Mandiri Cash Management (MCM)* dan integrasi *Mandiri API Portal*.
- **BNI Direct & BRI Cash Management**: Format pertukaran data batch standar perbankan BUMN.

### B. Portal Pelaporan Pemerintah (Regulatory & Statutory)
- **Direktorat Jenderal Pajak (DJP)**: Ekspor format CSV resmi untuk impor ke aplikasi **e-Bupot 21/26** DJP Online.
- **BPJS Ketenagakerjaan**: Pembuatan berkas laporan mutasi kepesertaan bulanan untuk sistem **SIPP Online**.
- **BPJS Kesehatan**: Ekspor data iuran untuk rekonsiliasi aplikasi **Edabu (Elektronik Data Badan Usaha)**.

### C. Mesin Presensi Fisik & IoT
- Webhook bridge untuk menerima *push notification* presensi dari mesin pemindai sidik jari (*fingerprint*) atau pengenal wajah (*face recognition terminal*) yang terpasang di lokasi pabrik atau cabang.
