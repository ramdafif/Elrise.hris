import { NextRequest, NextResponse } from 'next/server';
import { resolveServerSession, resolveEffectiveTenantId } from '@/lib/auth/session';
import { authorize } from '@/lib/security/authorization';
import { projectRepository } from '@/lib/db/repositories/project.repository';
import { AuditLogService } from '@/lib/security/audit';

export async function GET(req: NextRequest) {
  try {
    const actor = await resolveServerSession(req);
    const { searchParams } = new URL(req.url);
    const tenantId = resolveEffectiveTenantId(actor, searchParams.get('tenantId'));

    const authResult = authorize({
      actor,
      action: 'project.read',
      resource: { type: 'project', tenantId },
    });

    if (!authResult.allowed) {
      return NextResponse.json(
        { error: authResult.reason || 'Akses ditolak.' },
        { status: authResult.statusCode || 403 }
      );
    }

    let projects = await projectRepository.findProjects(tenantId);

    // If actor is restricted to specific projects (ADMIN_PROJECT)
    if (actor.scopeType === 'PROJECT' || actor.role === 'ADMIN_PROJECT') {
      const allowedIds = actor.projectIds || [];
      projects = projects.filter((p) => allowedIds.includes(p.id));
    }

    return NextResponse.json({
      success: true,
      projects,
      actorScope: {
        role: actor.role,
        scopeType: actor.scopeType,
        tenantId,
        projectIds: actor.projectIds || [],
      },
    });
  } catch (err: any) {
    const status = err.statusCode || (err.name === 'AuthenticationError' ? 401 : 500);
    return NextResponse.json({ error: err.message || 'Gagal memuat data proyek.' }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await resolveServerSession(req);
    const body = await req.json();
    const tenantId = resolveEffectiveTenantId(actor, body.tenantId);

    const authResult = authorize({
      actor,
      action: 'project.create',
      resource: { type: 'project', tenantId },
    });

    if (!authResult.allowed) {
      return NextResponse.json(
        { error: authResult.reason || 'Akses ditolak.' },
        { status: authResult.statusCode || 403 }
      );
    }

    if (!body.name || !body.code) {
      return NextResponse.json(
        { error: 'Nama dan kode proyek wajib diisi.' },
        { status: 422 }
      );
    }

    const project = await projectRepository.createProject(
      {
        code: body.code.trim().toUpperCase(),
        name: body.name.trim(),
        description: body.description?.trim(),
        status: body.status || 'ACTIVE',
        startDate: body.startDate || new Date().toISOString().split('T')[0],
        endDate: body.endDate,
        location: body.location?.trim(),
        managerId: body.managerId,
        budget: body.budget ? Number(body.budget) : undefined,
      },
      tenantId
    );

    AuditLogService.log({
      tenantId,
      actorId: actor.id,
      actorRole: actor.role,
      actorName: actor.name,
      action: 'PROJECT_CREATED' as any,
      entityType: 'Project',
      entityId: project.id,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent') || 'Browser',
      status: 'SUCCESS',
      after: { id: project.id, code: project.code, name: project.name },
    });

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (err: any) {
    const status = err.statusCode || (err.name === 'AuthenticationError' ? 401 : 500);
    return NextResponse.json({ error: err.message || 'Gagal membuat proyek baru.' }, { status });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const actor = await resolveServerSession(req);
    const body = await req.json();
    const projectId = body.id || body.projectId;

    if (!projectId) {
      return NextResponse.json({ error: 'ID proyek wajib disertakan.' }, { status: 400 });
    }

    const tenantId = resolveEffectiveTenantId(actor, body.tenantId);

    const authResult = authorize({
      actor,
      action: 'project.update',
      resource: { type: 'project', id: projectId, projectId, tenantId },
    });

    if (!authResult.allowed) {
      return NextResponse.json(
        { error: authResult.reason || 'Akses ditolak.' },
        { status: authResult.statusCode || 403 }
      );
    }

    const updated = await projectRepository.updateProject(projectId, body.updates || body, tenantId);

    if (!updated) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, project: updated });
  } catch (err: any) {
    const status = err.statusCode || (err.name === 'AuthenticationError' ? 401 : 500);
    return NextResponse.json({ error: err.message || 'Gagal memperbarui data proyek.' }, { status });
  }
}
