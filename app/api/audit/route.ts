import { NextRequest, NextResponse } from 'next/server';
import { auditRepository } from '@/lib/db/repositories/audit.repository';
import { parseCursorPagination } from '@/lib/security/validation';
import { authorize } from '@/lib/security/authorization';
import { resolveServerSession } from '@/lib/auth/session';

export async function GET(req: NextRequest) {
  try {
    const actor = await resolveServerSession(req);
    const tenantId = (actor.scopeType === 'PLATFORM_GLOBAL' && !actor.targetTenantId)
      ? undefined
      : (actor.targetTenantId || actor.tenantId);

    const authResult = authorize({
      actor,
      action: 'audit.read',
      resource: { type: 'audit', tenantId: tenantId || actor.tenantId },
    });

    if (!authResult.allowed) {
      return NextResponse.json(
        { error: authResult.reason || 'Akses ditolak: Anda tidak memiliki hak akses melihat audit log.' },
        { status: authResult.statusCode || 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const pagination = parseCursorPagination(searchParams);
    if (!pagination.isValid) {
      return NextResponse.json(pagination.errorResponse, { status: 422 });
    }

    const actionFilter = searchParams.get('action');
    const entityFilter = searchParams.get('entityType') || searchParams.get('entity') || searchParams.get('module');
    const searchFilter = searchParams.get('search') || searchParams.get('q');

    const result = await auditRepository.findCursorPaginated({
      tenantId,
      cursor: pagination.params.cursor,
      limit: pagination.params.limit,
      action: actionFilter,
      module: entityFilter,
      entity: entityFilter,
      search: searchFilter,
    });

    return NextResponse.json({
      success: true,
      items: result.items,
      auditLogs: result.items,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
      total: result.total,
    });
  } catch (error: any) {
    const status = error.statusCode || (error.name === 'AuthenticationError' ? 401 : 400);
    return NextResponse.json({ error: error.message || 'Gagal mengambil audit log' }, { status });
  }
}

