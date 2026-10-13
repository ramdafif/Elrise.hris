# AUTHORIZATION & PERMISSION SPECIFICATION — NUSANTARA HRIS ENTERPRISE
## Granular RBAC, ABAC, Object-Level Authorization & IDOR Protection

**Classification:** CONFIDENTIAL  
**Status:** SEMI-PRODUCTION READY  

---

## 1. Multi-Layer Authorization Model

Otorisasi dalam Nusantara HRIS tidak pernah mengandalkan pemeriksaan role sederhana (`if role === 'ADMIN'`). Sistem menerapkan 4 lapisan proteksi server-side:

```
[Incoming Request]
        |
        v
1. Authentication Check (Valid Session?)
        |
        v
2. Tenant Isolation Check (tenantId matching?)
        |
        v
3. Role-Based Access Control (RBAC: Has permission?)
        |
        v
4. Attribute-Based & Object-Level Check (ABAC / IDOR: Resource Owner or Team Scope?)
        |
        v
[Execute Operation & Return Data]
```

---

## 2. Granular Permission Matrix

Setiap aksi bisnis diikat ke izin eksplisit (`Permission` type):

| Modul | Izin Spesifik | Deskripsi Aksi |
|---|---|---|
| **Employee** | `employee.read` | Melihat daftar & profil dasar karyawan |
| | `employee.create` | Onboarding data pegawai baru |
| | `employee.update` | Perubahan biodata dan penugasan |
| | `employee.delete` | Terminasi pegawai (soft delete / status inaktif) |
| | `employee.salary.read` | Melihat data gaji pokok & tunjangan (HIGHLY_CONFIDENTIAL) |
| | `employee.salary.update`| Menyesuaikan kompensasi (wajib audit trail & maker-checker) |
| **Attendance** | `attendance.read` | Melihat catatan absensi |
| | `attendance.create` | Check-in / check-out mandiri (ESS) |
| | `attendance.approve`| Koreksi & verifikasi kehadiran oleh atasan |
| **Leave & OT** | `leave.read`, `leave.create`, `leave.approve` | Siklus permohonan & persetujuan cuti |
| | `overtime.read`, `overtime.create`, `overtime.approve` | Pengajuan & persetujuan lembur PP 35/2021 |
| **Payroll** | `payroll.read` | Melihat rekapitulasi penggajian |
| | `payroll.calculate` | Menjalankan kalkulator PPh 21 TER & BPJS |
| | `payroll.approve` | Verifikasi & persetujuan pembayaran gaji |
| | `payroll.lock` | Mengunci periode payroll menjadi snapshot permanen |
| | `payslip.read` | Membaca slip gaji mandiri atau tim |
| **Compliance** | `audit.read` | Melihat rekaman log jejak audit sistem |
| | `reports.read` | Mengunduh laporan rekapitulasi keuangan & pajak |
| | `settings.update` | Memperbarui konfigurasi tenant & aturan perusahaan |

---

## 3. Insecure Direct Object Reference (IDOR) & Object-Level Defense

Sistem melarang keras memercayai `id` dari client secara mentah (misal: `GET /api/employees/:id`). Setiap operasi objek menjalankan protokol verifikasi 5 langkah:

```typescript
export async function authorizeResourceAccess<T extends { id: string; tenantId: string; employeeId?: string; managerId?: string }>(
  actor: SessionUser,
  resource: T,
  requiredPermission: Permission
): Promise<boolean> {
  // 1. Validasi isolasi tenant mutlak
  if (resource.tenantId !== actor.tenantId) {
    return false; // Cross-tenant access dicegah
  }

  // 2. Periksa RBAC permission
  if (!checkPermission(actor.role, requiredPermission)) {
    return false;
  }

  // 3. Object-level resource ownership (ABAC)
  if (actor.role === 'EMPLOYEE') {
    // Karyawan HANYA boleh mengakses data miliknya sendiri
    const isOwner = resource.id === actor.employeeId || resource.employeeId === actor.employeeId;
    return isOwner;
  }

  if (actor.role === 'MANAGER') {
    // Manajer hanya boleh mengakses data staf dalam timnya atau dirinya sendiri
    const isSelf = resource.id === actor.employeeId || resource.employeeId === actor.employeeId;
    const isDirectReport = resource.managerId === actor.employeeId;
    return isSelf || isDirectReport;
  }

  return true;
}
```
