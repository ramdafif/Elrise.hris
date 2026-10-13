import { NextRequest, NextResponse } from 'next/server';
import { getHrisStore } from '@/lib/db/store';
import { OvertimeRequest, UserSession } from '@/lib/types';
import { calculateOvertimePay } from '@/lib/payroll/overtime';
import { authorize } from '@/lib/security/authorization';
import { resolveServerSession, resolveEffectiveTenantId } from '@/lib/auth/session';
import { projectRepository } from '@/lib/db/repositories/project.repository';
import { AuditLogService } from '@/lib/security/audit';
import { SYSTEM_CONFIG } from '@/config/systemConfig';
import { parseCursorPagination } from '@/lib/security/validation';
import { paginateWithCursor } from '@/lib/db/pagination';

export async function GET(req: NextRequest) {
  try {
    const actor = await resolveServerSession(req);
    const { searchParams } = new URL(req.url);
    const tenantId = resolveEffectiveTenantId(actor, searchParams.get('tenantId'));

    const authResult = authorize({
      actor,
      action: 'overtime.read',
      resource: { type: 'overtime', tenantId },
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
    let records: OvertimeRequest[] = [];

    // Filter by tenant with strict isolation
    let tenantRecords = store.overtimeRequests.filter((o) =>
      o.tenantId === tenantId ||
      (!o.tenantId && store.employees.find((e) => e.id === o.employeeId)?.tenantId === tenantId)
    );

    if (actor.role === 'EMPLOYEE' || actor.scopeType === 'SELF') {
      records = tenantRecords.filter((o) => o.employeeId === actor.employeeId);
    } else if (actor.scopeType === 'PROJECT' || actor.role === 'ADMIN_PROJECT') {
      const assignments = await projectRepository.findAssignments({ tenantId });
      const myProjectEmpIds = assignments
        .filter((asg) => actor.projectIds?.includes(asg.projectId))
        .map((asg) => asg.employeeId);
      const projOvertimes = tenantRecords.filter((o) => myProjectEmpIds.includes(o.employeeId));

      // Strictly mask overtime pay for ADMIN_PROJECT (compensation privacy)
      records = projOvertimes.map((ot) => ({
        ...ot,
        overtimePay: 0,
      }));
    } else {
      // SUPERADMIN & ADMIN_PT
      records = [...tenantRecords];
    }

    // Sort descending by date
    records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const paginated = paginateWithCursor(records, pagination.params.cursor, pagination.params.limit);

    return NextResponse.json({
      success: true,
      ...paginated,
      overtimeRequests: paginated.items,
    });
  } catch (error: any) {
    const status = error.statusCode || (error.name === 'AuthenticationError' ? 401 : 500);
    return NextResponse.json({ error: error.message || 'Gagal mengambil data lembur' }, { status });
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
      requestData?: {
        employeeId: string;
        date: string;
        startTime: string;
        endTime: string;
        durationHours: number;
        reason: string;
        isHoliday?: boolean;
      };
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
      // Security Check: An EMPLOYEE can ONLY submit overtime for themselves!
      if ((actor.role === 'EMPLOYEE' || actor.scopeType === 'SELF') && requestData.employeeId !== actor.employeeId) {
        AuditLogService.log({
          tenantId,
          actorId: actor.id,
          actorRole: actor.role,
          actorName: actor.name,
          action: 'SECURITY_ALERT',
          entityType: 'OvertimeRequest',
          entityId: 'unauthorized-create',
          ipAddress: clientIp,
          userAgent: req.headers.get('user-agent') || 'Browser',
          status: 'FAILURE',
          metadata: {
            errorMessage: 'Karyawan mencoba mengajukan lembur atas nama karyawan lain (IDOR attempt)',
          },
        });
        return NextResponse.json(
          { error: 'Pelanggaran Hak Akses: Anda hanya dapat mengajukan lembur untuk diri Anda sendiri.' },
          { status: 403 }
        );
      }

      // Security Check: ADMIN_PROJECT can only assign overtime to employees in assigned project
      if (actor.role === 'ADMIN_PROJECT' && requestData.employeeId !== actor.employeeId) {
        const assignments = await projectRepository.findAssignments({ tenantId });
        const myProjectEmpIds = assignments
          .filter((asg) => actor.projectIds?.includes(asg.projectId))
          .map((asg) => asg.employeeId);

        if (!myProjectEmpIds.includes(requestData.employeeId)) {
          return NextResponse.json(
            { error: 'Pelanggaran Hak Akses: Admin Proyek hanya dapat menugaskan lembur bagi staf proyek yang Anda kelola.' },
            { status: 403 }
          );
        }
      }

      const emp = store.employees.find((e) => e.id === requestData.employeeId);
      if (!emp) {
        return NextResponse.json({ error: 'Karyawan tidak ditemukan' }, { status: 404 });
      }

      if (!requestData.durationHours || requestData.durationHours <= 0) {
        return NextResponse.json({ error: 'Durasi jam lembur harus lebih besar dari 0.' }, { status: 400 });
      }

      // Validasi 1: Batas Maksimal Jam Lembur Harian (PP 35/2021 - Maks 4 Jam/Hari)
      const maxDailyHours = SYSTEM_CONFIG.maxOvertimeHoursPerDay || 4;
      const existingDailyRequests = store.overtimeRequests.filter(
        (ot) =>
          ot.employeeId === requestData.employeeId &&
          ot.date === requestData.date &&
          (ot.status === 'APPROVED' || ot.status === 'PENDING')
      );

      const existingDailyHours = existingDailyRequests.reduce(
        (sum, ot) => sum + (Number(ot.durationHours) || 0),
        0
      );
      const remainingDailyQuota = Math.max(0, maxDailyHours - existingDailyHours);

      if (existingDailyHours + requestData.durationHours > maxDailyHours) {
        store.logAudit(session, 'REJECT', 'OVERTIME', 'OvertimeRequest', 'daily-limit-exceeded', {
          newValues: {
            employeeId: requestData.employeeId,
            date: requestData.date,
            requestedHours: requestData.durationHours,
            existingDailyHours,
            maxDailyLimit: maxDailyHours,
            remainingDailyQuota,
          },
          reason: `Pengajuan lembur ditolak: Melebihi batas maksimal lembur harian PP 35/2021 (${maxDailyHours} jam/hari, terpakai ${existingDailyHours} jam, sisa kuota ${remainingDailyQuota} jam, diajukan ${requestData.durationHours} jam).`,
        });

        return NextResponse.json(
          {
            error: `Batas jam lembur harian terlampaui sesuai Pasal 26 PP 35/2021 (maksimal ${maxDailyHours} jam per hari). Anda telah memiliki ${existingDailyHours} jam lembur pada tanggal ${requestData.date} (sisa kuota: ${remainingDailyQuota} jam), namun Anda mengajukan ${requestData.durationHours} jam.`,
            details: {
              maxDailyHours,
              existingDailyHours,
              remainingDailyQuota,
              requestedHours: requestData.durationHours,
              regulationRef: 'Pasal 26 PP No. 35 Tahun 2021',
            },
          },
          { status: 400 }
        );
      }

      // Validasi 2: Batas Maksimal Jam Lembur Mingguan (PP 35/2021 - Maks 18 Jam/Minggu dalam 7 Hari Kalender)
      const parseDateToMs = (dStr: string) => {
        const parts = dStr.split('-').map(Number);
        return new Date(parts[0], parts[1] - 1, parts[2]).getTime();
      };

      const ONE_DAY_MS = 24 * 60 * 60 * 1000;
      const reqTime = parseDateToMs(requestData.date);
      const maxWeeklyHours = SYSTEM_CONFIG.maxOvertimeHoursPerWeek || 18;

      let maxExistingWeeklyHours = 0;
      for (let offset = 0; offset <= 6; offset++) {
        const wStart = reqTime - (6 - offset) * ONE_DAY_MS;
        const wEnd = reqTime + offset * ONE_DAY_MS;

        const windowRequests = store.overtimeRequests.filter((ot) => {
          if (ot.employeeId !== requestData.employeeId) return false;
          if (ot.status !== 'APPROVED' && ot.status !== 'PENDING') return false;
          const otTime = parseDateToMs(ot.date);
          return otTime >= wStart && otTime <= wEnd;
        });

        const windowHours = windowRequests.reduce((sum, ot) => sum + (Number(ot.durationHours) || 0), 0);
        if (windowHours > maxExistingWeeklyHours) {
          maxExistingWeeklyHours = windowHours;
        }
      }

      const remainingWeeklyQuota = Math.max(0, maxWeeklyHours - maxExistingWeeklyHours);

      if (maxExistingWeeklyHours + requestData.durationHours > maxWeeklyHours) {
        store.logAudit(session, 'REJECT', 'OVERTIME', 'OvertimeRequest', 'weekly-limit-exceeded', {
          newValues: {
            employeeId: requestData.employeeId,
            date: requestData.date,
            requestedHours: requestData.durationHours,
            existingWeeklyHours: maxExistingWeeklyHours,
            maxWeeklyLimit: maxWeeklyHours,
            remainingWeeklyQuota,
          },
          reason: `Pengajuan lembur ditolak: Melebihi batas maksimal lembur mingguan PP 35/2021 (${maxWeeklyHours} jam/minggu, terpakai ${maxExistingWeeklyHours} jam dalam 7 hari kalender, sisa kuota ${remainingWeeklyQuota} jam, diajukan ${requestData.durationHours} jam).`,
        });

        return NextResponse.json(
          {
            error: `Batas jam lembur mingguan terlampaui sesuai Pasal 26 PP 35/2021 (maksimal ${maxWeeklyHours} jam dalam 7 hari kalender). Anda telah memiliki akumulasi ${maxExistingWeeklyHours} jam lembur dalam rentang 7 hari yang mencakup tanggal ini (sisa kuota: ${remainingWeeklyQuota} jam), namun Anda mengajukan ${requestData.durationHours} jam.`,
            details: {
              maxWeeklyHours,
              existingWeeklyHours: maxExistingWeeklyHours,
              remainingWeeklyQuota,
              requestedHours: requestData.durationHours,
              regulationRef: 'Pasal 26 PP No. 35 Tahun 2021',
            },
          },
          { status: 400 }
        );
      }

      // Compute legal overtime pay using PP 35/2021
      const calculation = calculateOvertimePay(
        Number(emp.basicSalary),
        Number(emp.fixedAllowance),
        requestData.durationHours,
        requestData.isHoliday || false
      );

      const newOt: OvertimeRequest = {
        id: `ot-${Date.now()}`,
        tenantId,
        employeeId: requestData.employeeId,
        date: requestData.date,
        startTime: requestData.startTime,
        endTime: requestData.endTime,
        durationHours: requestData.durationHours,
        calculatedHours: calculation.weightedHours,
        overtimePay: calculation.overtimePay,
        reason: requestData.reason,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };

      store.overtimeRequests.unshift(newOt);

      store.logAudit(session, 'CREATE', 'OVERTIME', 'OvertimeRequest', newOt.id, {
        newValues: { duration: newOt.durationHours, pay: newOt.overtimePay, employeeId: newOt.employeeId },
        reason: 'Pengajuan Lembur Karyawan (PP 35/2021)',
      });

      return NextResponse.json({ success: true, overtimeRequest: newOt });
    }

    if (action === 'UPDATE_STATUS' && requestId && status) {
      const authResult = authorize({
        actor,
        action: 'overtime.approve',
        resource: { type: 'overtime', id: requestId, tenantId },
      });

      if (!authResult.allowed) {
        return NextResponse.json(
          { error: authResult.reason || 'Akses ditolak: Anda tidak memiliki wewenang memverifikasi pengajuan lembur.' },
          { status: authResult.statusCode || 403 }
        );
      }

      const ot = store.overtimeRequests.find((o) => o.id === requestId);
      if (!ot) {
        return NextResponse.json({ error: 'Pengajuan lembur tidak ditemukan' }, { status: 404 });
      }

      if (ot.tenantId && ot.tenantId !== tenantId) {
        return NextResponse.json({ error: 'Akses ditolak: Data lembur milik tenant lain.' }, { status: 403 });
      }

      // CRITICAL BUSINESS LOGIC: Anti-Self-Approval (Four-Eyes Principle)
      if (ot.employeeId === actor.employeeId) {
        AuditLogService.log({
          tenantId,
          actorId: actor.id,
          actorRole: actor.role,
          actorName: actor.name,
          action: 'SECURITY_ALERT',
          entityType: 'OvertimeRequest',
          entityId: requestId,
          ipAddress: clientIp,
          userAgent: req.headers.get('user-agent') || 'Browser',
          status: 'FAILURE',
          metadata: {
            errorMessage: 'Percobaan persetujuan lembur sendiri oleh pelaksana lembur (Anti-Self-Approval)',
          },
        });
        return NextResponse.json(
          { error: 'Pelanggaran Tata Kelola: Anda tidak diperkenankan menyetujui pengajuan lembur Anda sendiri.' },
          { status: 403 }
        );
      }

      // Hierarchy verification for ADMIN_PROJECT
      if (actor.role === 'ADMIN_PROJECT') {
        const assignments = await projectRepository.findAssignments({ tenantId });
        const myProjectEmpIds = assignments
          .filter((asg) => actor.projectIds?.includes(asg.projectId))
          .map((asg) => asg.employeeId);

        if (!myProjectEmpIds.includes(ot.employeeId)) {
          return NextResponse.json(
            { error: 'Akses ditolak: Admin Proyek hanya berwenang menyetujui lembur staf pada proyek yang Anda kelola.' },
            { status: 403 }
          );
        }
      }

      ot.status = status;
      if (status === 'APPROVED') {
        ot.approvedBy = `${session.name} (${session.role})`;
        ot.approvedAt = new Date().toISOString();
      } else {
        ot.rejectionReason = rejectionReason || 'Ditolak oleh atasan / HR';
      }

      store.logAudit(session, 'APPROVE', 'OVERTIME', 'OvertimeRequest', requestId, {
        newValues: { status, approvedBy: ot.approvedBy, rejectionReason: ot.rejectionReason },
        reason: status === 'APPROVED' ? 'Persetujuan Lembur' : 'Penolakan Lembur',
      });

      return NextResponse.json({ success: true, overtimeRequest: ot });
    }

    return NextResponse.json({ error: 'Permintaan tidak valid' }, { status: 400 });
  } catch (error: any) {
    const status = error.statusCode || (error.name === 'AuthenticationError' ? 401 : 500);
    return NextResponse.json({ error: error.message || 'Gagal memproses lembur' }, { status });
  }
}
