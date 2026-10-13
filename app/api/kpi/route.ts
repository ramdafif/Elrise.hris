import { NextRequest, NextResponse } from 'next/server';
import { getHrisStore } from '@/lib/db/store';
import { KpiReview, UserSession } from '@/lib/types';
import { authorize } from '@/lib/security/authorization';
import { resolveServerSession, resolveEffectiveTenantId } from '@/lib/auth/session';
import { projectRepository } from '@/lib/db/repositories/project.repository';
import { AuditLogService } from '@/lib/security/audit';
import { parseCursorPagination } from '@/lib/security/validation';
import { paginateWithCursor } from '@/lib/db/pagination';

export async function GET(req: NextRequest) {
  try {
    const actor = await resolveServerSession(req);
    const { searchParams } = new URL(req.url);
    const tenantId = resolveEffectiveTenantId(actor, searchParams.get('tenantId'));

    const authResult = authorize({
      actor,
      action: 'kpi.read',
      resource: { type: 'kpi', tenantId },
    });

    if (!authResult.allowed) {
      return NextResponse.json(
        { error: authResult.reason || 'Akses ditolak.' },
        { status: authResult.statusCode || 403 }
      );
    }

    const pagination = parseCursorPagination(searchParams);
    if (!pagination.isValid) {
      return NextResponse.json(pagination.errorResponse, { status: 422 });
    }

    const store = getHrisStore();
    let records: KpiReview[] = [];

    // Filter by tenant with strict isolation
    let tenantRecords = store.kpiReviews.filter((k) =>
      k.tenantId === tenantId ||
      (!k.tenantId && store.employees.find((e) => e.id === k.employeeId)?.tenantId === tenantId)
    );

    if (actor.role === 'EMPLOYEE' || actor.scopeType === 'SELF') {
      records = tenantRecords.filter((k) => k.employeeId === actor.employeeId);
    } else if (actor.scopeType === 'PROJECT' || actor.role === 'ADMIN_PROJECT') {
      const assignments = await projectRepository.findAssignments({ tenantId });
      const myProjectEmpIds = assignments
        .filter((asg) => actor.projectIds?.includes(asg.projectId))
        .map((asg) => asg.employeeId);
      records = tenantRecords.filter((k) => myProjectEmpIds.includes(k.employeeId));
    } else {
      // SUPERADMIN & ADMIN_PT
      records = [...tenantRecords];
    }

    // Sort descending by createdAt
    records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const paginated = paginateWithCursor(records, pagination.params.cursor, pagination.params.limit);

    return NextResponse.json({
      success: true,
      ...paginated,
      kpiReviews: paginated.items,
    });
  } catch (error: any) {
    const status = error.statusCode || (error.name === 'AuthenticationError' ? 401 : 500);
    return NextResponse.json({ error: error.message || 'Gagal mengambil data KPI' }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const actor = await resolveServerSession(req);
    const body = await req.json();
    const tenantId = resolveEffectiveTenantId(actor, body.tenantId);
    const {
      action,
      kpiData,
      kpiId,
      selfScore,
      selfNotes,
      managerScore,
      managerNotes,
      finalScore,
    } = body as {
      action: 'CREATE' | 'SUBMIT_SELF' | 'SUBMIT_MANAGER' | 'FINALIZE';
      kpiData?: {
        employeeId: string;
        period: string;
      };
      kpiId?: string;
      selfScore?: number;
      selfNotes?: string;
      managerScore?: number;
      managerNotes?: string;
      finalScore?: number;
    };

    const session: UserSession = {
      id: actor.id,
      name: actor.name,
      role: actor.role,
      email: actor.email,
      scopeType: actor.scopeType,
      tenantId,
      employeeId: actor.employeeId,
      projectIds: actor.projectIds,
    };

    const store = getHrisStore();

    if (action === 'CREATE') {
      const authResult = authorize({
        actor,
        action: 'kpi.create',
        resource: { type: 'kpi', tenantId },
      });

      if (!authResult.allowed) {
        return NextResponse.json(
          { error: authResult.reason || 'Akses ditolak: Anda tidak memiliki wewenang menginisiasi periode review KPI.' },
          { status: authResult.statusCode || 403 }
        );
      }

      if (!kpiData || !kpiData.employeeId || !kpiData.period) {
        return NextResponse.json({ error: 'Data inisiasi KPI tidak lengkap.' }, { status: 400 });
      }

      const newKpi: KpiReview = {
        id: `kpi-${Date.now()}`,
        tenantId,
        employeeId: kpiData.employeeId,
        period: kpiData.period,
        status: 'DRAFT',
        createdAt: new Date().toISOString(),
      };

      store.kpiReviews.unshift(newKpi);

      AuditLogService.log({
        tenantId,
        actorId: actor.id,
        actorRole: actor.role,
        actorName: actor.name,
        action: 'CREATE',
        entityType: 'KpiReview',
        entityId: newKpi.id,
        ipAddress: clientIp,
        userAgent: req.headers.get('user-agent') || 'Browser',
        status: 'SUCCESS',
        metadata: { employeeId: newKpi.employeeId, period: newKpi.period },
      });

      return NextResponse.json({ success: true, kpiReview: newKpi });
    }

    if (action === 'SUBMIT_SELF') {
      const authResult = authorize({
        actor,
        action: 'kpi.submit',
        resource: { type: 'kpi', id: kpiId, tenantId },
      });

      if (!authResult.allowed) {
        return NextResponse.json({ error: authResult.reason || 'Akses ditolak.' }, { status: authResult.statusCode || 403 });
      }

      if (!kpiId) {
        return NextResponse.json({ error: 'Parameter kpiId wajib disertakan.' }, { status: 400 });
      }

      const target = store.kpiReviews.find((k) => k.id === kpiId);
      if (!target) {
        return NextResponse.json({ error: 'Data penilaian KPI tidak ditemukan.' }, { status: 404 });
      }

      if (target.tenantId && target.tenantId !== tenantId) {
        return NextResponse.json({ error: 'Akses ditolak: Data penilaian KPI milik tenant lain.' }, { status: 403 });
      }

      // Anti-IDOR: Employee can only submit their own self-review
      if ((actor.role === 'EMPLOYEE' || actor.scopeType === 'SELF') && target.employeeId !== actor.employeeId) {
        return NextResponse.json(
          { error: 'Akses ditolak: Anda hanya dapat mengisi evaluasi mandiri KPI milik Anda sendiri.' },
          { status: 403 }
        );
      }

      const score = Number(selfScore);
      if (isNaN(score) || score < 0 || score > 100) {
        return NextResponse.json({ error: 'Skor evaluasi mandiri harus berkisar antara 0 - 100.' }, { status: 422 });
      }

      target.selfScore = score;
      target.selfNotes = selfNotes?.trim() || '';
      target.status = 'SUBMITTED';

      AuditLogService.log({
        tenantId,
        actorId: actor.id,
        actorRole: actor.role,
        actorName: actor.name,
        action: 'UPDATE',
        entityType: 'KpiReview',
        entityId: target.id,
        ipAddress: clientIp,
        userAgent: req.headers.get('user-agent') || 'Browser',
        status: 'SUCCESS',
        metadata: { action: 'SUBMIT_SELF', employeeId: target.employeeId, selfScore: score },
      });

      return NextResponse.json({ success: true, kpiReview: target });
    }

    if (action === 'SUBMIT_MANAGER') {
      const authResult = authorize({
        actor,
        action: 'kpi.review',
        resource: { type: 'kpi', id: kpiId, tenantId },
      });

      if (!authResult.allowed) {
        return NextResponse.json({ error: authResult.reason || 'Akses ditolak: Anda tidak memiliki wewenang menilai KPI staf.' }, { status: authResult.statusCode || 403 });
      }

      if (!kpiId) {
        return NextResponse.json({ error: 'Parameter kpiId wajib disertakan.' }, { status: 400 });
      }

      const target = store.kpiReviews.find((k) => k.id === kpiId);
      if (!target) {
        return NextResponse.json({ error: 'Data penilaian KPI tidak ditemukan.' }, { status: 404 });
      }

      if (target.tenantId && target.tenantId !== tenantId) {
        return NextResponse.json({ error: 'Akses ditolak: Data penilaian KPI milik tenant lain.' }, { status: 403 });
      }

      // Anti-Self-Review: Manager cannot evaluate their own performance
      if (target.employeeId === actor.employeeId) {
        return NextResponse.json(
          { error: 'Prinsip Empat Mata: Anda tidak dapat memberikan penilaian manajerial untuk diri sendiri.' },
          { status: 403 }
        );
      }

      // Project Scope Check for ADMIN_PROJECT
      if (actor.role === 'ADMIN_PROJECT') {
        const assignments = await projectRepository.findAssignments({ tenantId });
        const myProjectEmpIds = assignments
          .filter((asg) => actor.projectIds?.includes(asg.projectId))
          .map((asg) => asg.employeeId);
        if (!myProjectEmpIds.includes(target.employeeId)) {
          return NextResponse.json(
            { error: 'Akses ditolak: Anda hanya berwenang menilai staf pada proyek yang Anda kelola.' },
            { status: 403 }
          );
        }
      }

      const score = Number(managerScore);
      if (isNaN(score) || score < 0 || score > 100) {
        return NextResponse.json({ error: 'Skor penilaian manajer harus berkisar antara 0 - 100.' }, { status: 422 });
      }

      target.managerScore = score;
      target.managerNotes = managerNotes?.trim() || '';
      target.status = 'REVIEWED';

      AuditLogService.log({
        tenantId,
        actorId: actor.id,
        actorRole: actor.role,
        actorName: actor.name,
        action: 'UPDATE',
        entityType: 'KpiReview',
        entityId: target.id,
        ipAddress: clientIp,
        userAgent: req.headers.get('user-agent') || 'Browser',
        status: 'SUCCESS',
        metadata: { action: 'SUBMIT_MANAGER', employeeId: target.employeeId, managerScore: score },
      });

      return NextResponse.json({ success: true, kpiReview: target });
    }

    if (action === 'FINALIZE') {
      const authResult = authorize({
        actor,
        action: 'kpi.finalize',
        resource: { type: 'kpi', id: kpiId, tenantId },
      });

      if (!authResult.allowed) {
        return NextResponse.json({ error: authResult.reason || 'Akses ditolak: Finalisasi skor KPI hanya berwenang oleh HR Admin.' }, { status: authResult.statusCode || 403 });
      }

      if (!kpiId) {
        return NextResponse.json({ error: 'Parameter kpiId wajib disertakan.' }, { status: 400 });
      }

      const target = store.kpiReviews.find((k) => k.id === kpiId);
      if (!target) {
        return NextResponse.json({ error: 'Data penilaian KPI tidak ditemukan.' }, { status: 404 });
      }

      if (target.tenantId && target.tenantId !== tenantId) {
        return NextResponse.json({ error: 'Akses ditolak: Data penilaian KPI milik tenant lain.' }, { status: 403 });
      }

      let score = Number(finalScore);
      if (isNaN(score) || score <= 0) {
        const s = target.selfScore ?? 80;
        const m = target.managerScore ?? 85;
        score = Math.round(s * 0.3 + m * 0.7);
      }

      target.finalScore = score;
      target.status = 'FINALIZED';

      AuditLogService.log({
        tenantId,
        actorId: actor.id,
        actorRole: actor.role,
        actorName: actor.name,
        action: 'APPROVE',
        entityType: 'KpiReview',
        entityId: target.id,
        ipAddress: clientIp,
        userAgent: req.headers.get('user-agent') || 'Browser',
        status: 'SUCCESS',
        metadata: { action: 'FINALIZE', employeeId: target.employeeId, finalScore: score },
      });

      return NextResponse.json({ success: true, kpiReview: target });
    }

    return NextResponse.json({ error: 'Aksi KPI tidak dikenali.' }, { status: 400 });
  } catch (error: any) {
    const status = error.statusCode || (error.name === 'AuthenticationError' ? 401 : 500);
    return NextResponse.json({ error: error.message || 'Gagal memproses review KPI' }, { status });
  }
}
