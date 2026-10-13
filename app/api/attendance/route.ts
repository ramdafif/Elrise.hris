import { NextRequest, NextResponse } from 'next/server';
import { getHrisStore } from '@/lib/db/store';
import { Attendance, UserSession } from '@/lib/types';
import { AuditLogService } from '@/lib/security/audit';
import { authorize } from '@/lib/security/authorization';
import { resolveServerSession, resolveEffectiveTenantId } from '@/lib/auth/session';
import { projectRepository } from '@/lib/db/repositories/project.repository';
import { PayrollGuard } from '@/lib/security/payrollGuard';
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
      action: 'attendance.read',
      resource: { type: 'attendance', tenantId },
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
    let records: Attendance[] = [];

    // Filter by tenant with strict isolation
    let tenantRecords = store.attendances.filter((a) =>
      a.tenantId === tenantId ||
      (!a.tenantId && store.employees.find((e) => e.id === a.employeeId)?.tenantId === tenantId)
    );

    if (actor.role === 'EMPLOYEE' || actor.scopeType === 'SELF') {
      records = tenantRecords.filter((a) => a.employeeId === actor.employeeId);
    } else if (actor.scopeType === 'PROJECT' || actor.role === 'ADMIN_PROJECT') {
      // Scoped to projects managed by this actor
      const assignments = await projectRepository.findAssignments({ tenantId });
      const myProjectEmpIds = assignments
        .filter((asg) => actor.projectIds?.includes(asg.projectId))
        .map((asg) => asg.employeeId);
      records = tenantRecords.filter((a) => myProjectEmpIds.includes(a.employeeId));
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
      attendances: paginated.items,
    });
  } catch (error: any) {
    const status = error.statusCode || (error.name === 'AuthenticationError' ? 401 : 500);
    return NextResponse.json({ error: error.message || 'Gagal mengambil data presensi' }, { status });
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
      employeeId,
      location,
      workLocation,
      attendanceId,
      proposedCheckIn,
      proposedCheckOut,
      correctionNotes,
      status,
      rejectionReason,
    } = body as {
      action: 'CHECK_IN' | 'CHECK_OUT' | 'REQUEST_CORRECTION' | 'UPDATE_CORRECTION_STATUS';
      employeeId?: string;
      location?: 'WFO' | 'WFH' | 'CLIENT_SITE';
      workLocation?: 'WFO' | 'WFH' | 'CLIENT_SITE';
      attendanceId?: string;
      proposedCheckIn?: string;
      proposedCheckOut?: string;
      correctionNotes?: string;
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

    // -------------------------------------------------------------
    // ACTION: CHECK_IN
    // -------------------------------------------------------------
    if (action === 'CHECK_IN') {
      const targetEmpId = employeeId || actor.employeeId;
      if (!targetEmpId) {
        return NextResponse.json({ error: 'ID Karyawan tidak ditemukan.' }, { status: 400 });
      }

      // Anti-Proxy Clock-In
      if ((actor.role === 'EMPLOYEE' || actor.scopeType === 'SELF') && targetEmpId !== actor.employeeId) {
        AuditLogService.log({
          tenantId,
          actorId: actor.id,
          actorRole: actor.role,
          actorName: actor.name,
          action: 'SECURITY_ALERT',
          entityType: 'Attendance',
          entityId: targetEmpId,
          ipAddress: clientIp,
          userAgent: req.headers.get('user-agent') || 'Browser',
          status: 'FAILURE',
          metadata: {
            errorMessage: 'Upaya titip absen / presensi untuk karyawan lain oleh karyawan non-admin (IDOR fraud)',
          },
        });
        return NextResponse.json(
          { error: 'Pelanggaran Disiplin & Otorisasi: Anda dilarang melakukan presensi untuk karyawan lain.' },
          { status: 403 }
        );
      }

      const effectiveLocation = workLocation || location || 'WFO';
      const record = store.checkIn(targetEmpId, effectiveLocation, session);
      return NextResponse.json({ success: true, record });
    }

    // -------------------------------------------------------------
    // ACTION: CHECK_OUT
    // -------------------------------------------------------------
    if (action === 'CHECK_OUT') {
      const targetEmpId = employeeId || actor.employeeId;
      if (!targetEmpId) {
        return NextResponse.json({ error: 'ID Karyawan tidak ditemukan.' }, { status: 400 });
      }

      if ((actor.role === 'EMPLOYEE' || actor.scopeType === 'SELF') && targetEmpId !== actor.employeeId) {
        return NextResponse.json(
          { error: 'Pelanggaran Disiplin & Otorisasi: Anda dilarang melakukan presensi untuk karyawan lain.' },
          { status: 403 }
        );
      }

      const record = store.checkOut(targetEmpId, session);
      return NextResponse.json({ success: true, record });
    }

    // -------------------------------------------------------------
    // ACTION: REQUEST_CORRECTION
    // -------------------------------------------------------------
    if (action === 'REQUEST_CORRECTION') {
      if (!attendanceId) {
        return NextResponse.json({ error: 'ID data presensi wajib disertakan.' }, { status: 400 });
      }
      if (!correctionNotes || correctionNotes.trim().length === 0) {
        return NextResponse.json({ error: 'Alasan atau catatan koreksi presensi wajib diisi.' }, { status: 400 });
      }

      const record = store.attendances.find((a) => a.id === attendanceId);
      if (!record) {
        return NextResponse.json({ error: 'Data presensi tidak ditemukan.' }, { status: 404 });
      }

      // Security check: Employee can only request correction for own record
      if ((actor.role === 'EMPLOYEE' || actor.scopeType === 'SELF') && record.employeeId !== actor.employeeId) {
        AuditLogService.log({
          tenantId,
          actorId: actor.id,
          actorRole: actor.role,
          actorName: actor.name,
          action: 'SECURITY_ALERT',
          entityType: 'AttendanceRecord',
          entityId: record.id,
          ipAddress: clientIp,
          userAgent: req.headers.get('user-agent') || 'Browser',
          status: 'FAILURE',
          metadata: {
            errorMessage: 'Karyawan mencoba mengajukan koreksi presensi milik orang lain (IDOR)',
          },
        });
        return NextResponse.json(
          { error: 'Akses ditolak: Anda hanya dapat mengajukan koreksi presensi untuk diri Anda sendiri.' },
          { status: 403 }
        );
      }

      // Admin Project hierarchy check
      if (actor.role === 'ADMIN_PROJECT' && record.employeeId !== actor.employeeId) {
        const assignments = await projectRepository.findAssignments({ tenantId });
        const myProjectEmpIds = assignments
          .filter((asg) => actor.projectIds?.includes(asg.projectId))
          .map((asg) => asg.employeeId);
        if (!myProjectEmpIds.includes(record.employeeId)) {
          return NextResponse.json(
            { error: 'Akses ditolak: Admin Proyek hanya dapat mengajukan koreksi presensi untuk staf proyek Anda.' },
            { status: 403 }
          );
        }
      }

      // Payroll Lock Guard: Verify record date is not in a LOCKED/PAID payroll period
      PayrollGuard.assertAttendanceModifiable(record.date, store.payrollPeriods);

      record.isCorrected = true;
      record.approvalStatus = 'PENDING';
      record.correctionNotes = correctionNotes.trim();
      if (proposedCheckIn) record.proposedCheckIn = proposedCheckIn;
      if (proposedCheckOut) record.proposedCheckOut = proposedCheckOut;
      record.correctedBy = actor.employeeId || actor.id;
      record.correctedAt = new Date().toISOString();

      store.logAudit(session, 'UPDATE', 'ATTENDANCE', 'AttendanceRecord', record.id, {
        newValues: {
          proposedCheckIn: record.proposedCheckIn,
          proposedCheckOut: record.proposedCheckOut,
          notes: record.correctionNotes,
          approvalStatus: 'PENDING',
        },
        reason: `Pengajuan koreksi presensi: ${correctionNotes}`,
      });

      return NextResponse.json({ success: true, record });
    }

    // -------------------------------------------------------------
    // ACTION: UPDATE_CORRECTION_STATUS
    // -------------------------------------------------------------
    if (action === 'UPDATE_CORRECTION_STATUS') {
      if (!attendanceId || !status) {
        return NextResponse.json({ error: 'ID presensi dan status persetujuan wajib diisi.' }, { status: 400 });
      }

      const authResult = authorize({
        actor,
        action: 'attendance.approve',
        resource: { type: 'attendance', id: attendanceId, tenantId },
      });

      if (!authResult.allowed) {
        return NextResponse.json(
          { error: authResult.reason || 'Akses ditolak: Anda tidak memiliki wewenang untuk menyetujui koreksi presensi.' },
          { status: authResult.statusCode || 403 }
        );
      }

      const record = store.attendances.find((a) => a.id === attendanceId);
      if (!record) {
        return NextResponse.json({ error: 'Data presensi tidak ditemukan.' }, { status: 404 });
      }

      // ANTI-SELF-APPROVAL (Four-Eyes Principle / Tata Kelola)
      if (record.employeeId === actor.employeeId) {
        AuditLogService.log({
          tenantId,
          actorId: actor.id,
          actorRole: actor.role,
          actorName: actor.name,
          action: 'SECURITY_ALERT',
          entityType: 'AttendanceRecord',
          entityId: record.id,
          ipAddress: clientIp,
          userAgent: req.headers.get('user-agent') || 'Browser',
          status: 'FAILURE',
          metadata: {
            errorMessage: 'Upaya persetujuan koreksi presensi mandiri (Anti-Self-Approval violation)',
          },
        });
        return NextResponse.json(
          { error: 'Pelanggaran Tata Kelola: Anda dilarang menyetujui permohonan koreksi presensi milik Anda sendiri (Anti-Self-Approval).' },
          { status: 403 }
        );
      }

      // Admin Project Scoping Check: verify employee belongs to assigned project
      if (actor.role === 'ADMIN_PROJECT') {
        const assignments = await projectRepository.findAssignments({ tenantId });
        const myProjectEmpIds = assignments
          .filter((asg) => actor.projectIds?.includes(asg.projectId))
          .map((asg) => asg.employeeId);

        if (!myProjectEmpIds.includes(record.employeeId)) {
          return NextResponse.json(
            { error: 'Akses ditolak: Anda hanya berwenang menyetujui presensi staf pada proyek yang Anda kelola.' },
            { status: 403 }
          );
        }
      }

      // Payroll Lock Guard: Verify record date is not in a LOCKED/PAID payroll period
      PayrollGuard.assertAttendanceModifiable(record.date, store.payrollPeriods);

      if (status === 'APPROVED') {
        // Apply proposed checkIn and checkOut
        if (record.proposedCheckIn) {
          record.checkIn = record.proposedCheckIn.includes('T')
            ? record.proposedCheckIn
            : `${record.date}T${record.proposedCheckIn}:00.000Z`;
        }
        if (record.proposedCheckOut) {
          record.checkOut = record.proposedCheckOut.includes('T')
            ? record.proposedCheckOut
            : `${record.date}T${record.proposedCheckOut}:00.000Z`;
        }

        // Recalculate workDuration, late, and earlyLeave using branch schedule
        const targetEmp = store.employees.find((e) => e.id === record.employeeId);
        const branch = store.branches.find((b) => b.id === targetEmp?.branchId);
        const startTimeStr = branch?.workStartTime || SYSTEM_CONFIG.defaultWorkStartTime || '08:30';
        const endTimeStr = branch?.workEndTime || SYSTEM_CONFIG.defaultWorkEndTime || '17:00';

        const [startH, startM] = startTimeStr.split(':').map(Number);
        const branchStartMins = (startH || 8) * 60 + (startM || 30);
        const [endH, endM] = endTimeStr.split(':').map(Number);
        const branchEndMins = (endH || 17) * 60 + (endM || 0);

        if (record.checkIn) {
          const checkInDate = new Date(record.checkIn);
          const checkInMins = checkInDate.getHours() * 60 + checkInDate.getMinutes();
          record.lateDurationMin = Math.max(0, checkInMins - branchStartMins);
          record.status = record.lateDurationMin > 0 ? 'LATE' : 'PRESENT';
        }

        if (record.checkOut) {
          const checkOutDate = new Date(record.checkOut);
          const checkOutMins = checkOutDate.getHours() * 60 + checkOutDate.getMinutes();
          record.earlyLeaveMin = Math.max(0, branchEndMins - checkOutMins);
          if (record.checkIn) {
            const diffMs = checkOutDate.getTime() - new Date(record.checkIn).getTime();
            record.workDurationMin = Math.max(0, Math.round(diffMs / 60000));
          }
        }

        record.approvalStatus = 'APPROVED';
        record.correctionNotes = (record.correctionNotes ? record.correctionNotes + ' | ' : '') + `Disetujui oleh ${session.name}`;

        store.logAudit(session, 'APPROVE', 'ATTENDANCE', 'AttendanceRecord', record.id, {
          newValues: {
            checkIn: record.checkIn,
            checkOut: record.checkOut,
            status: record.status,
            approvalStatus: 'APPROVED',
          },
          reason: 'Persetujuan koreksi presensi',
        });
      } else {
        record.approvalStatus = 'REJECTED';
        record.correctionNotes =
          (record.correctionNotes ? record.correctionNotes + ' | ' : '') +
          `Ditolak oleh ${session.name}: ${rejectionReason || 'Tidak memenuhi kriteria'}`;

        store.logAudit(session, 'REJECT', 'ATTENDANCE', 'AttendanceRecord', record.id, {
          newValues: { approvalStatus: 'REJECTED' },
          reason: rejectionReason || 'Penolakan koreksi presensi',
        });
      }

      return NextResponse.json({ success: true, record });
    }

    return NextResponse.json({ error: 'Aksi presensi tidak valid' }, { status: 400 });
  } catch (error: any) {
    const status = error.statusCode || (error.name === 'AuthenticationError' ? 401 : 400);
    return NextResponse.json(
      { error: error.message || 'Gagal memproses presensi' },
      { status }
    );
  }
}

