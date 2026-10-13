import { NextRequest, NextResponse } from 'next/server';
import { getHrisStore } from '@/lib/db/store';
import { UserSession } from '@/lib/types';
import { authorize } from '@/lib/security/authorization';
import { resolveServerSession, resolveEffectiveTenantId } from '@/lib/auth/session';
import { AuditLogService } from '@/lib/security/audit';
import { parseCursorPagination } from '@/lib/security/validation';
import { reimbursementRepository } from '@/lib/db/repositories/reimbursement.repository';

export async function GET(req: NextRequest) {
  try {
    const actor = await resolveServerSession(req);
    const { searchParams } = new URL(req.url);
    const tenantId = resolveEffectiveTenantId(actor, searchParams.get('tenantId'));

    const authResult =  authorize({
      actor,
      action: 'reimbursement.read',
      resource: { type: 'reimbursement', tenantId },
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

    const result = await reimbursementRepository.findCursorPaginated({
      tenantId,
      cursor: pagination.params.cursor,
      limit: pagination.params.limit,
      sessionRole: actor.role,
      sessionEmployeeId: actor.employeeId,
      employeeId: searchParams.get('filterEmployeeId') || (actor.role !== 'EMPLOYEE' ? searchParams.get('employeeId') : undefined),
      status: searchParams.get('status'),
      category: searchParams.get('category'),
    });

    return NextResponse.json({
      success: true,
      items: result.items,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
      total: result.total,
      reimbursements: result.items,
    });
  } catch (error: any) {
    const status = error.statusCode || (error.name === 'AuthenticationError' ? 401 : 500);
    return NextResponse.json({ error: error.message || 'Gagal mengambil data reimbursement' }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const actor = await resolveServerSession(req);
    const body = await req.json();
    const tenantId = resolveEffectiveTenantId(actor, body.tenantId);
    const { action, reimbursementData, reimbursementId, status, rejectionReason } = body as {
      action: 'CREATE' | 'UPDATE_STATUS';
      reimbursementData?: {
        employeeId?: string;
        category: string;
        amount: number;
        description: string;
        receiptUrl?: string;
      };
      reimbursementId?: string;
      status?: 'APPROVED' | 'REJECTED';
      rejectionReason?: string;
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
        action: 'reimbursement.create',
        resource: { type: 'reimbursement', tenantId },
      });

      if (!authResult.allowed) {
        return NextResponse.json(
          { error: authResult.reason || 'Akses ditolak: Anda tidak memiliki wewenang mengajukan reimbursement.' },
          { status: authResult.statusCode || 403 }
        );
      }

      if (!reimbursementData) {
        return NextResponse.json({ error: 'Data reimbursement tidak lengkap.' }, { status: 400 });
      }

      const isEmployee = actor.role === 'EMPLOYEE' || actor.scopeType === 'SELF';
      if (isEmployee && reimbursementData.employeeId && reimbursementData.employeeId !== actor.employeeId) {
        return NextResponse.json(
          { error: 'Akses ditolak: Karyawan dilarang mengajukan reimbursement untuk karyawan lain (Anti-IDOR).' },
          { status: 403 }
        );
      }
      const targetEmpId = isEmployee
        ? actor.employeeId!
        : reimbursementData.employeeId || actor.employeeId!;
      const amount = Number(reimbursementData.amount);

      if (!amount || amount <= 0) {
        return NextResponse.json({ error: 'Nominal klaim reimbursement harus lebih besar dari Rp 0.' }, { status: 422 });
      }

      if (!reimbursementData.category || !reimbursementData.category.trim()) {
        return NextResponse.json({ error: 'Kategori klaim biaya wajib dipilih.' }, { status: 422 });
      }

      if (!reimbursementData.description || !reimbursementData.description.trim()) {
        return NextResponse.json({ error: 'Keterangan/keperluan klaim wajib diisi.' }, { status: 422 });
      }

      const newReimbursement = await reimbursementRepository.create({
        employeeId: targetEmpId,
        category: reimbursementData.category.trim(),
        amount: Math.round(amount),
        description: reimbursementData.description.trim(),
        receiptUrl: reimbursementData.receiptUrl,
        tenantId,
      });

      AuditLogService.log({
        tenantId,
        actorId: actor.id,
        actorRole: actor.role,
        actorName: actor.name,
        action: 'CREATE',
        entityType: 'Reimbursement',
        entityId: newReimbursement.id,
        ipAddress: clientIp,
        userAgent: req.headers.get('user-agent') || 'Browser',
        status: 'SUCCESS',
        metadata: {
          employeeId: targetEmpId,
          category: newReimbursement.category,
          amount: newReimbursement.amount,
        },
      });

      return NextResponse.json({ success: true, reimbursement: newReimbursement });
    }

    if (action === 'UPDATE_STATUS') {
      const authResult = authorize({
        actor,
        action: 'reimbursement.approve',
        resource: { type: 'reimbursement', id: reimbursementId, tenantId },
      });

      if (!authResult.allowed) {
        return NextResponse.json(
          { error: authResult.reason || 'Akses ditolak: Anda tidak memiliki wewenang menyetujui klaim biaya.' },
          { status: authResult.statusCode || 403 }
        );
      }

      if (!reimbursementId || !status) {
        return NextResponse.json({ error: 'Parameter reimbursementId dan status wajib disertakan.' }, { status: 400 });
      }

      const target = await reimbursementRepository.findById(reimbursementId);
      if (!target) {
        return NextResponse.json({ error: 'Data klaim reimbursement tidak ditemukan.' }, { status: 404 });
      }

      if (target.tenantId && target.tenantId !== tenantId) {
        return NextResponse.json({ error: 'Akses ditolak: Data klaim reimbursement milik tenant lain.' }, { status: 403 });
      }

      // Anti-Self-Approval (Four-Eyes Principle)
      if (target.employeeId === actor.employeeId) {
        AuditLogService.log({
          tenantId,
          actorId: actor.id,
          actorRole: actor.role,
          actorName: actor.name,
          action: 'SECURITY_ALERT',
          entityType: 'Reimbursement',
          entityId: target.id,
          ipAddress: clientIp,
          userAgent: req.headers.get('user-agent') || 'Browser',
          status: 'FAILURE',
          metadata: {
            alertType: 'SELF_APPROVAL_ATTEMPT_REIMBURSEMENT',
            reason: 'Percobaan persetujuan klaim biaya sendiri (Self-Approval dicegah).',
            targetEmployeeId: target.employeeId,
          },
        });

        return NextResponse.json(
          {
            error: 'Prinsip Empat Mata (Four-Eyes Principle): Anda tidak dapat menyetujui pengajuan reimbursement milik Anda sendiri.',
          },
          { status: 403 }
        );
      }

      // Hierarchy validation for ADMIN_PROJECT
      if (actor.role === 'ADMIN_PROJECT') {
        const { projectRepository } = await import('@/lib/db/repositories/project.repository');
        const assignments = await projectRepository.findAssignments({ tenantId });
        const myProjectEmpIds = assignments
          .filter((asg) => (actor.projectIds || []).includes(asg.projectId))
          .map((asg) => asg.employeeId);
        if (!myProjectEmpIds.includes(target.employeeId)) {
          return NextResponse.json(
            {
              error: 'Akses ditolak: Anda hanya berwenang menyetujui pengajuan reimbursement staf pada proyek yang Anda kelola.',
            },
            { status: 403 }
          );
        }
      }

      const updated = await reimbursementRepository.updateStatus(
        reimbursementId,
        status,
        actor.name,
        actor.role
      );

      AuditLogService.log({
        tenantId,
        actorId: actor.id,
        actorRole: actor.role,
        actorName: actor.name,
        action: status === 'APPROVED' ? 'APPROVE' : 'REJECT',
        entityType: 'Reimbursement',
        entityId: updated.id,
        ipAddress: clientIp,
        userAgent: req.headers.get('user-agent') || 'Browser',
        status: 'SUCCESS',
        metadata: {
          status,
          rejectionReason,
          employeeId: updated.employeeId,
          amount: updated.amount,
        },
      });

      return NextResponse.json({ success: true, reimbursement: updated });
    }

    return NextResponse.json({ error: 'Aksi reimbursement tidak dikenali.' }, { status: 400 });
  } catch (error: any) {
    const status = error.statusCode || (error.name === 'AuthenticationError' ? 401 : 500);
    return NextResponse.json({ error: error.message || 'Gagal memproses reimbursement' }, { status });
  }
}
