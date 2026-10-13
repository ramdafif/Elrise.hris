# AUDIT POLICY — NUSANTARA HRIS ENTERPRISE

Dokumen ini mendefinisikan kebijakan perekaman, integritas, dan pemeriksaan jejak audit (*Audit Trail Policy*) untuk seluruh operasi sistem.

---

## 1. Lingkup Perekaman Audit (Scope of Audit Logging)

Seluruh operasi berikut **wajib** menghasilkan rekaman audit di tabel `AuditLog`:
1. **Master Karyawan**: Penambahan karyawan baru, perubahan gaji pokok/tunjangan, pembaruan nomor rekening bank, dan penghentian hubungan kerja.
2. **Penggajian (Payroll)**: Inisiasi periode, eksekusi kalkulasi ulang, persetujuan nominal, penguncian periode (`LOCKED`), dan pengunduhan berkas transfer bank.
3. **Presensi & Lembur**: Koreksi jam kehadiran manual oleh HR, persetujuan SPKL lembur, dan persetujuan/penolakan cuti.
4. **Keamanan & Konfigurasi**: Percobaan login administratif yang gagal, perubahan hak akses peran (RBAC), dan pembaruan tabel regulasi.

---

## 2. Format Rekaman Jejak Audit

Setiap entri jejak audit mencakup parameter wajib:
- `id`: UUID v4 unik.
- `timestamp`: Stempel waktu UTC dengan resolusi milidetik.
- `userId` & `userName`: Identitas operator yang melakukan aksi.
- `userRole`: Peran sistem saat aksi dilakukan.
- `action`: Jenis aksi (`CREATE`, `UPDATE`, `DELETE`, `CALCULATE`, `APPROVE`, `REJECT`, `LOCK`, `EXPORT`).
- `module`: Domain terkait (`EMPLOYEE`, `PAYROLL`, `ATTENDANCE`, `LEAVE`, `OVERTIME`, `TAX_RULE`, `BPJS_RULE`).
- `entityId`: Kunci primer dari baris data yang terpengaruh.
- `oldValues`: Snapshot JSON dari nilai data sebelum perubahan.
- `newValues`: Snapshot JSON dari nilai data sesudah perubahan.
- `reason`: Alasan operasional yang wajib diisi untuk aksi berisiko tinggi.
- `ipAddress`: Alamat IP asal permintaan.

---

## 3. Ketentuan Imutabilitas (Immutability Mandate)

> **ATURAN MUTLAK KEPATUHAN:**  
> Tabel `AuditLog` bersifat *Append-Only*. Dilarang keras menyediakan API, endpoint, atau perintah database yang dapat mengubah (`UPDATE`) atau menghapus (`DELETE`) rekaman log audit.
