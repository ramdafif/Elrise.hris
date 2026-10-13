import { NextRequest, NextResponse } from 'next/server';
import { getHrisStore } from '@/lib/db/store';
import { LeaveRequest, UserSession } from '@/lib/types';
import { authorize } from '@/lib/security/authorization';
import { resolveServerSession, resolveEffectiveTenantId } from '@/lib/auth/session';
import { projectRepository } from '@/lib/db/repositories/project.repository';
import { AuditLogService } from '@/lib/security/audit';
import { calculateLeaveBalance, checkLeaveDateOverlap } from '@/lib/leave/balance';
import { parseCursorPagination } from '@/lib/security/validation';
import { paginateWithCursor } from '@/lib/db/pagination';

export async function GET(req: NextRequest) {
  try {
    const actor = await resolveServerSession(req);
    const { searchParams } = new URL(req.url);
    const tenantId = resolveEffectiveTenantId(actor, searchParams.get('tenantId'));

    const authResult = authorize({
      actor,
      action: 'leave.read',
      resource: { type: 'leave', tenantId },
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
    let records: LeaveRequest[] = [];

    // Filter by tenant with strict isolation
    let tenantRecords = store.leaveRequests.filter((l) =>
      l.tenantId === tenantId ||
      (!l.tenantId && store.employees.find((e) => e.id === l.employeeId)?.tenantId === tenantId)
    );

    if (actor.role === 'EMPLOYEE' || actor.scopeType === 'SELF') {
      records = tenantRecords.filter((l) => l.employeeId === actor.employeeId);
    } else if (actor.scopeType === 'PROJECT' || actor.role === 'ADMIN_PROJECT') {
      const assignments = await projectRepository.findAssignments({ tenantId });
      const myProjectEmpIds = assignments
        .filter((asg) => actor.projectIds?.includes(asg.projectId))
        .map((asg) => asg.employeeId);
      records = tenantRecords.filter((l) => myProjectEmpIds.includes(l.employeeId));
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
      leaveRequests: paginated.items,
    });
  } catch (error: any) {
    const status = error.statusCode || (error.name === 'AuthenticationError' ? 401 : 500);
    return NextResponse.json({ error: error.message || 'Gagal mengambil data cuti' }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const actor = await resolveServerSession(req);
    const body = await req.json();
    const tenantId = resolveEffectiveTenantId(actor, body.tenantId);

    const { action, requestData, requestId, status, rejectionReason } = body as {
      action: 'CREATE' | 'UPDATE_STATUS';
      requestData?: Omit<LeaveRequest, 'id' | 'status' | 'createdAt'>;
      requestId?: string;
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

    if (action === 'CREATE' && requestData) {
      // Security Check: An EMPLOYEE can ONLY apply for themselves!
      if ((actor.role === 'EMPLOYEE' || actor.scopeType === 'SELF') && requestData.employeeId !== actor.employeeId) {
        AuditLogService.log({
          tenantId,
          actorId: actor.id,
          actorRole: actor.role,
          actorName: actor.name,
          action: 'SECURITY_ALERT',
          entityType: 'LeaveRequest',
          entityId: 'unauthorized-create',
          ipAddress: clientIp,
          userAgent: req.headers.get('user-agent') || 'Browser',
          status: 'FAILURE',
          metadata: {
            errorMessage: 'Karyawan mencoba mengajukan cuti atas nama orang lain (IDOR attempt)',
          },
        });
        return NextResponse.json(
          { error: 'Pelanggaran Hak Akses: Anda hanya dapat mengajukan cuti untuk diri Anda sendiri.' },
          { status: 403 }
        );
      }

      // Security Check: ADMIN_PROJECT can only submit for employees assigned to their project
      if (actor.role === 'ADMIN_PROJECT' && requestData.employeeId !== actor.employeeId) {
        const assignments = await projectRepository.findAssignments({ tenantId });
        const myProjectEmpIds = assignments
          .filter((asg) => actor.projectIds?.includes(asg.projectId))
          .map((asg) => asg.employeeId);

        if (!myProjectEmpIds.includes(requestData.employeeId)) {
          return NextResponse.json(
            { error: 'Pelanggaran Hak Akses: Admin Proyek hanya dapat mendaftarkan staf pada proyek yang Anda kelola.' },
            { status: 403 }
          );
        }
      }

      // Validasi 1: Jenis Cuti
      const leaveType = store.leaveTypes.find((t) => t.id === requestData.leaveTypeId);
      if (!leaveType) {
        return NextResponse.json({ error: 'Jenis cuti yang dipilih tidak valid.' }, { status: 400 });
      }

      // Validasi 2: Kuota Cuti (Kecuali jika isPaid: false / non-kuota berbayar)
      const balance = calculateLeaveBalance(
        requestData.employeeId,
        leaveType,
        store.leaveRequests,
        new Date(requestData.startDate).getFullYear()
      );

      if (!balance.isUnlimited && requestData.totalDays > balance.remainingDays) {
        store.logAudit(session, 'REJECT', 'LEAVE', 'LeaveRequest', 'quota-exceeded', {
          newValues: {
            employeeId: requestData.employeeId,
            leaveTypeId: requestData.leaveTypeId,
            requestedDays: requestData.totalDays,
            remainingQuota: balance.remainingDays,
          },
          reason: `Pengajuan cuti ditolak: Kuota cuti "${leaveType.name}" tidak mencukupi (sisa ${balance.remainingDays} hari, diminta ${requestData.totalDays} hari).`,
        });

        return NextResponse.json(
          {
            error: `Kuota cuti tidak mencukupi. Sisa kuota untuk "${leaveType.name}" adalah ${balance.remainingDays} hari, namun Anda mengajukan ${requestData.totalDays} hari.`,
            details: balance,
          },
          { status: 400 }
        );
      }

      // Validasi 3: Bentrok Tanggal Cuti (Collision Check)
      const conflict = checkLeaveDateOverlap(
        requestData.employeeId,
        requestData.startDate,
        requestData.endDate,
        store.leaveRequests
      );

      if (conflict.hasConflict) {
        const conf = conflict.conflictingRequest!;
        const statusLabel = conf.status === 'APPROVED' ? 'Disetujui' : 'Menunggu Persetujuan';
        return NextResponse.json(
          {
            error: `Rentang tanggal cuti (${requestData.startDate} s.d ${requestData.endDate}) bentrok dengan pengajuan cuti lain (${conf.startDate} s.d ${conf.endDate}) yang berstatus ${statusLabel}.`,
          },
          { status: 400 }
        );
      }

      const newLeave: LeaveRequest = {
        ...requestData,
        id: `leave-${Date.now()}`,
        tenantId,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };
      store.leaveRequests.unshift(newLeave);

      store.logAudit(session, 'CREATE', 'LEAVE', 'LeaveRequest', newLeave.id, {
        newValues: { totalDays: newLeave.totalDays, reason: newLeave.reason, employeeId: newLeave.employeeId },
        reason: 'Pengajuan Cuti Karyawan',
      });

      return NextResponse.json({ success: true, leaveRequest: newLeave });
    }

    if (action === 'UPDATE_STATUS' && requestId && status) {
      // Permission verification
      const authResult = authorize({
        actor,
        action: 'leave.approve',
        resource: { type: 'leave', id: requestId, tenantId },
      });

      if (!authResult.allowed) {
        return NextResponse.json(
          { error: authResult.reason || 'Akses ditolak: Anda tidak memiliki wewenang memverifikasi pengajuan cuti.' },
          { status: authResult.statusCode || 403 }
        );
      }

      const leave = store.leaveRequests.find((l) => l.id === requestId);
      if (!leave) {
        return NextResponse.json({ error: 'Permohonan cuti tidak ditemukan' }, { status: 404 });
      }

      if (leave.tenantId && leave.tenantId !== tenantId) {
        return NextResponse.json({ error: 'Akses ditolak: Data cuti milik tenant lain.' }, { status: 403 });
      }

      // CRITICAL BUSINESS LOGIC: Anti-Self-Approval (Four-Eyes Principle)
      // A person can NEVER approve their own leave request!
      if (leave.employeeId === actor.employeeId) {
        AuditLogService.log({
          tenantId,
          actorId: actor.id,
          actorRole: actor.role,
          actorName: actor.name,
          action: 'SECURITY_ALERT',
          entityType: 'LeaveRequest',
          entityId: requestId,
          ipAddress: clientIp,
          userAgent: req.headers.get('user-agent') || 'Browser',
          status: 'FAILURE',
          metadata: {
            errorMessage: 'Percobaan persetujuan cuti sendiri oleh pemohon (Violates Four-Eyes Principle)',
          },
        });
        return NextResponse.json(
          { error: 'Pelanggaran Tata Kelola: Anda tidak diperkenankan menyetujui permohonan cuti Anda sendiri.' },
          { status: 403 }
        );
      }

      // For ADMIN_PROJECT: verify employee belongs to assigned project
      if (actor.role === 'ADMIN_PROJECT') {
        const assignments = await projectRepository.findAssignments({ tenantId });
        const myProjectEmpIds = assignments
          .filter((asg) => actor.projectIds?.includes(asg.projectId))
          .map((asg) => asg.employeeId);

        if (!myProjectEmpIds.includes(leave.employeeId)) {
          return NextResponse.json(
            { error: 'Akses ditolak: Admin Proyek hanya berwenang memverifikasi permohonan staf pada proyek yang Anda kelola.' },
            { status: 403 }
          );
        }
      }

      leave.status = status;
      if (status === 'APPROVED') {
        leave.approvedBy = `${session.name} (${session.role})`;
        leave.approvedAt = new Date().toISOString();
      } else {
        leave.rejectionReason = rejectionReason || 'Ditolak oleh atasan / HR';
      }

      store.logAudit(session, 'APPROVE', 'LEAVE', 'LeaveRequest', requestId, {
        newValues: { status, approvedBy: leave.approvedBy, rejectionReason: leave.rejectionReason },
        reason: status === 'APPROVED' ? 'Persetujuan Cuti' : 'Penolakan Cuti',
      });

      return NextResponse.json({ success: true, leaveRequest: leave });
    }

    return NextResponse.json({ error: 'Permintaan tidak valid' }, { status: 400 });
  } catch (error: any) {
    const status = error.statusCode || (error.name === 'AuthenticationError' ? 401 : 500);
    return NextResponse.json({ error: error.message || 'Gagal memproses cuti' }, { status });
  }
}
