import { NextRequest, NextResponse } from 'next/server';
import { resolveServerSession } from '@/lib/auth/session';
import { authorize } from '@/lib/security/authorization';
import { projectRepository } from '@/lib/db/repositories/project.repository';
import { AuditLogService } from '@/lib/security/audit';

export async function GET(req: NextRequest) {
  try {
    const actor = await resolveServerSession(req);
    const authResult = authorize({
      actor,
      action: 'project.read',
      resource: { type: 'project_assignment', tenantId: actor.tenantId },
    });

    if (!authResult.allowed) {
      return NextResponse.json(
        { error: authResult.reason || 'Akses ditolak.' },
        { status: authResult.statusCode || 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId') || undefined;
    const employeeId = searchParams.get('employeeId') || undefined;

    const tenantId = actor.tenantId || 'tenant-elkyno-01';
    let assignments = await projectRepository.findAssignments({
      tenantId,
      projectId,
      employeeId,
    });

    // If actor has PROJECT scope, only show assignments in their allowed projects
    if (actor.scopeType === 'PROJECT' && actor.projectIds && actor.projectIds.length > 0) {
      assignments = assignments.filter((a) => actor.projectIds!.includes(a.projectId));
    }

    return NextResponse.json({ success: true, assignments });
  } catch (err: any) {
    console.error('Error fetching project assignments:', err);
    return NextResponse.json({ error: 'Gagal memuat penugasan proyek.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await resolveServerSession(req);
    const authResult = authorize({
      actor,
      action: 'project.assign',
      resource: { type: 'project_assignment', tenantId: actor.tenantId },
    });

    if (!authResult.allowed) {
      return NextResponse.json(
        { error: authResult.reason || 'Akses ditolak: Anda tidak memiliki wewenang penugasan proyek.' },
        { status: authResult.statusCode || 403 }
      );
    }

    const body = await req.json();
    if (!body.employeeId || !body.projectId) {
      return NextResponse.json(
        { error: 'employeeId dan projectId wajib diisi.' },
        { status: 422 }
      );
    }

    const tenantId = actor.tenantId || 'tenant-elkyno-01';

    // If actor is ADMIN_PROJECT, verify that they are assigning within their allowed projects
    if (actor.scopeType === 'PROJECT' && actor.projectIds) {
      if (!actor.projectIds.includes(body.projectId)) {
        return NextResponse.json(
          { error: 'Akses ditolak: Anda hanya dapat menugaskan karyawan pada proyek yang Anda kelola.' },
          { status: 403 }
        );
      }
    }

    const assignment = await projectRepository.assignEmployee(
      {
        employeeId: body.employeeId,
        projectId: body.projectId,
        role: body.role || 'MEMBER',
        startDate: body.startDate || new Date().toISOString().split('T')[0],
        endDate: body.endDate,
        status: body.status || 'ACTIVE',
        isPrimary: Boolean(body.isPrimary),
      },
      tenantId
    );

    AuditLogService.log({
      tenantId,
      actorId: actor.id,
      actorRole: actor.role,
      actorName: actor.name,
      action: 'PROJECT_ASSIGNMENT' as any,
      entityType: 'EmployeeProjectAssignment',
      entityId: assignment.id,
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent') || 'Browser',
      status: 'SUCCESS',
      after: {
        id: assignment.id,
        employeeId: assignment.employeeId,
        projectId: assignment.projectId,
        role: assignment.role,
      },
    });

    return NextResponse.json({ success: true, assignment }, { status: 201 });
  } catch (err: any) {
    console.error('Error assigning employee to project:', err);
    return NextResponse.json({ error: 'Gagal menugaskan karyawan ke proyek.' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const actor = await resolveServerSession(req);
    const authResult = authorize({
      actor,
      action: 'project.assign',
      resource: { type: 'project_assignment', tenantId: actor.tenantId },
    });

    if (!authResult.allowed) {
      return NextResponse.json(
        { error: authResult.reason || 'Akses ditolak.' },
        { status: authResult.statusCode || 403 }
      );
    }

    const body = await req.json();
    const assignmentId = body.id || body.assignmentId;
    if (!assignmentId || !body.status) {
      return NextResponse.json({ error: 'ID penugasan dan status wajib diisi.' }, { status: 400 });
    }

    const tenantId = actor.tenantId || 'tenant-elkyno-01';
    const updated = await projectRepository.updateAssignmentStatus(
      assignmentId,
      body.status,
      body.endDate,
      tenantId
    );

    if (!updated) {
      return NextResponse.json({ error: 'Penugasan tidak ditemukan.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, assignment: updated });
  } catch (err: any) {
    console.error('Error updating project assignment:', err);
    return NextResponse.json({ error: 'Gagal memperbarui status penugasan.' }, { status: 500 });
  }
}
