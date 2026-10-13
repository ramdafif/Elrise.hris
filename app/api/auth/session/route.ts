import { NextRequest, NextResponse } from 'next/server';
import { resolveServerSession, DEMO_USERS } from '@/lib/auth/session';
import { getAllRegisteredTenants, getTenantContext } from '@/lib/security/tenant';
import { AuditLogService } from '@/lib/security/audit';

export async function GET(req: NextRequest) {
  try {
    const actor = await resolveServerSession(req);
    const demoUser = DEMO_USERS.find((u) => u.id === actor.id);
    const availableTenants = actor.scopeType === 'PLATFORM_GLOBAL' ? getAllRegisteredTenants() : [];

    return NextResponse.json({
      success: true,
      session: {
        id: actor.id,
        email: actor.email,
        name: actor.name,
        role: actor.role,
        scopeType: actor.scopeType,
        tenantId: actor.tenantId,
        impersonatedTenantId: actor.targetTenantId,
        employeeId: actor.employeeId,
        projectIds: actor.projectIds || [],
        primaryProjectId: demoUser?.primaryProjectId,
        projectName: demoUser?.projectName,
        tenantName: demoUser?.tenantName,
        avatar: demoUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        description: demoUser?.description || 'Pengguna terverifikasi sistem.',
        tierBadge: demoUser?.tierBadge || actor.role,
      },
      availableTenants,
      allDemoUsers: DEMO_USERS.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        scopeType: u.scopeType,
        tenantId: u.tenantId,
        tenantName: u.tenantName,
        primaryProjectId: u.primaryProjectId,
        projectName: u.projectName,
        tierBadge: u.tierBadge,
        description: u.description,
      })),
    });
  } catch (err: any) {
    const status = err.statusCode || (err.name === 'AuthenticationError' ? 401 : 500);
    return NextResponse.json({ error: err.message || 'Gagal memverifikasi sesi.' }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, targetTenantId } = body;

    const targetUser = DEMO_USERS.find((u) => u.id === sessionId);
    if (!targetUser) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan dalam sistem.' }, { status: 404 });
    }

    // If targetTenantId is requested, verify actor is PLATFORM_GLOBAL
    let effectiveTargetTenant: string | undefined = undefined;
    if (targetTenantId) {
      if (targetUser.scopeType !== 'PLATFORM_GLOBAL') {
        return NextResponse.json(
          { error: 'Akses ditolak: Hanya Platform Owner / Super Admin yang diizinkan berpindah konteks tenant.' },
          { status: 403 }
        );
      }
      const tenant = getTenantContext(targetTenantId);
      if (!tenant) {
        return NextResponse.json({ error: 'Target tenant tidak terdaftar.' }, { status: 404 });
      }
      effectiveTargetTenant = targetTenantId;

      // Log auditable impersonation / cross-tenant event
      AuditLogService.log({
        tenantId: targetTenantId,
        actorId: targetUser.id,
        actorRole: targetUser.role,
        actorName: targetUser.name,
        action: 'CROSS_TENANT_ACCESS' as any,
        entityType: 'Tenant',
        entityId: targetTenantId,
        ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
        userAgent: req.headers.get('user-agent') || 'Browser',
        status: 'SUCCESS',
        metadata: {
          impersonatingUser: targetUser.name,
          targetTenantName: tenant.tenantName,
          reason: 'Platform Admin switched tenant environment',
        },
      });
    }

    return NextResponse.json({
      success: true,
      session: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        role: targetUser.role,
        scopeType: targetUser.scopeType,
        tenantId: effectiveTargetTenant || targetUser.tenantId,
        impersonatedTenantId: effectiveTargetTenant,
        employeeId: targetUser.employeeId,
        projectIds: targetUser.projectIds || [],
        primaryProjectId: targetUser.primaryProjectId,
        projectName: targetUser.projectName,
        tenantName: targetUser.tenantName,
        avatar: targetUser.avatar,
        description: targetUser.description,
        tierBadge: targetUser.tierBadge,
      },
    });
  } catch (err: any) {
    console.error('Error switching session:', err);
    return NextResponse.json({ error: 'Gagal mengganti sesi.' }, { status: 500 });
  }
}
