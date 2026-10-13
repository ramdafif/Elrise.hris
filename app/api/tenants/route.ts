import { NextRequest, NextResponse } from 'next/server';
import { resolveServerSession } from '@/lib/auth/session';
import {
  getAllRegisteredTenants,
  getTenantContext,
  updateTenantSettings,
  REGISTERED_TENANTS,
  TenantContext,
} from '@/lib/security/tenant';
import { AuditLogService } from '@/lib/security/audit';

export async function GET(req: NextRequest) {
  try {
    const actor = await resolveServerSession(req);

    // Only Superadmin is authorized to manage clients globally
    if (actor.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Akses ditolak: Hanya Superadmin Platform yang berwenang mengelola client & lisensi.' },
        { status: 403 }
      );
    }

    const tenants = getAllRegisteredTenants();
    return NextResponse.json({
      success: true,
      tenants,
    });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Gagal mengambil data client' }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await resolveServerSession(req);

    if (actor.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Akses ditolak: Hanya Superadmin Platform yang berwenang mengubah konfigurasi client.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const action = body.action || 'UPDATE_SETTINGS';

    if (action === 'UPDATE_SETTINGS') {
      const { tenantId, adminName, adminEmail, adminPhone, allowedModules, isActive, maxEmployees, tier } = body;

      if (!tenantId) {
        return NextResponse.json({ error: 'tenantId wajib disertakan.' }, { status: 400 });
      }

      const updated = updateTenantSettings(tenantId, {
        adminName,
        adminEmail,
        adminPhone,
        allowedModules,
        isActive,
        maxEmployees,
        tier,
      });

      // Audit Log
      AuditLogService.log({
        tenantId,
        actorId: actor.id,
        actorRole: actor.role,
        actorName: actor.name,
        action: 'UPDATE_TENANT_SETTINGS',
        entityType: 'TENANT_SETTINGS',
        entityId: tenantId,
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: req.headers.get('user-agent') || 'Browser',
        status: 'SUCCESS',
        metadata: {
          tenantId,
          adminName,
          allowedModulesCount: allowedModules?.length,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Pengaturan client ${updated.tenantName} berhasil diperbarui.`,
        tenant: updated,
      });
    }

    if (action === 'CREATE_CLIENT') {
      const { tenantName, tenantCode, adminName, adminEmail, adminPhone, tier, allowedModules, maxEmployees } = body;

      if (!tenantName || !tenantCode || !adminName || !adminEmail) {
        return NextResponse.json(
          { error: 'Nama PT, kode tenant, nama admin, dan email admin wajib diisi.' },
          { status: 400 }
        );
      }

      const newId = `tenant-${tenantCode.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
      const newTenant: TenantContext = {
        tenantId: newId,
        tenantName,
        tenantCode,
        legalName: tenantName,
        isActive: true,
        adminName,
        adminEmail,
        adminPhone,
        tier: tier || 'GROWTH',
        allowedModules: allowedModules || ['EMPLOYEES', 'ATTENDANCE', 'LEAVE_OVERTIME', 'PAYROLL'],
        maxEmployees: maxEmployees || 50,
        createdAt: new Date().toISOString(),
      };

      REGISTERED_TENANTS[newId] = newTenant;

      AuditLogService.log({
        tenantId: newId,
        actorId: actor.id,
        actorRole: actor.role,
        actorName: actor.name,
        action: 'CREATE_TENANT',
        entityType: 'TENANT',
        entityId: newId,
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: req.headers.get('user-agent') || 'Browser',
        status: 'SUCCESS',
        metadata: { tenantName, newId },
      });

      return NextResponse.json({
        success: true,
        message: `Client baru ${tenantName} berhasil didaftarkan.`,
        tenant: newTenant,
      });
    }

    return NextResponse.json({ error: 'Aksi tidak dikenal.' }, { status: 400 });
  } catch (error: any) {
    const status = error.statusCode || 500;
    return NextResponse.json({ error: error.message || 'Gagal memproses konfigurasi client' }, { status });
  }
}
