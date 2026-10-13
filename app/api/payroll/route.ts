import { NextRequest, NextResponse } from 'next/server';
import { payrollRepository } from '@/lib/db/repositories/payroll.repository';
import { UserSession } from '@/lib/types';
import { authorize } from '@/lib/security/authorization';
import { resolveServerSession, resolveEffectiveTenantId } from '@/lib/auth/session';
import { PayrollGuard } from '@/lib/security/payrollGuard';
import { RateLimiters } from '@/lib/security/rateLimiter';
import { AuditLogService } from '@/lib/security/audit';
import { parseCursorPagination } from '@/lib/security/validation';
import { paginateWithCursor } from '@/lib/db/pagination';

export async function GET(req: NextRequest) {
  try {
    const actor = await resolveServerSession(req);
    const { searchParams } = new URL(req.url);
    const tenantId = resolveEffectiveTenantId(actor, searchParams.get('tenantId'));

    // Strict Payroll Security: ADMIN_PROJECT has NO corporate payroll access
    if (actor.scopeType === 'PROJECT' || actor.role === 'ADMIN_PROJECT') {
      return NextResponse.json(
        { error: 'Akses ditolak: Pengelola proyek dilarang mengakses data keuangan, kompensasi, dan penggajian perusahaan.' },
        { status: 403 }
      );
    }

    const pagination = parseCursorPagination(searchParams);
    if (!pagination.isValid) {
      return NextResponse.json(pagination.errorResponse, { status: 422 });
    }

    // Filter tenant-scoped periods from authoritative repository
    const tenantPeriods = await payrollRepository.findPeriods(tenantId);

    // EMPLOYEE: strictly return ONLY own payslip items (Anti-IDOR protection)
    if (actor.role === 'EMPLOYEE' || actor.scopeType === 'SELF') {
      if (!actor.employeeId) {
        return NextResponse.json({ error: 'Akun karyawan tidak terhubung dengan profil karyawan.' }, { status: 403 });
      }

      const myItems = await payrollRepository.findItemsByEmployee(actor.employeeId, tenantId);

      // Sanitize period headers to not leak corporate payroll aggregates
      const sanitizedPeriods = tenantPeriods.map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        startDate: p.startDate,
        endDate: p.endDate,
        paymentDate: p.paymentDate,
        status: p.status,
        totalEmployees: 1,
        totalGrossPay: 0, // Hidden
        totalNetPay: 0,   // Hidden
        totalPph21: 0,    // Hidden
        totalBpjsEmployee: 0,
        totalBpjsEmployer: 0,
        calculatedAt: p.calculatedAt,
        calculatedBy: p.calculatedBy,
        lockedAt: p.lockedAt,
        lockedBy: p.lockedBy,
        paidAt: p.paidAt,
        paidBy: p.paidBy,
      }));

      const paginated = paginateWithCursor(myItems, pagination.params.cursor, pagination.params.limit);

      return NextResponse.json({
        success: true,
        ...paginated,
        payrollPeriods: sanitizedPeriods,
        payrollItems: paginated.items,
      });
    }

    // SUPERADMIN, ADMIN_PT
    const authResult = authorize({
      actor,
      action: 'payroll.read',
      resource: { type: 'payroll', tenantId },
    });

    if (!authResult.allowed) {
      return NextResponse.json(
        { error: authResult.reason || 'Akses ditolak.' },
        { status: authResult.statusCode || 403 }
      );
    }

    const periodIdFilter = searchParams.get('periodId') || undefined;
    const items = await payrollRepository.findItems(periodIdFilter, tenantId);

    const paginated = paginateWithCursor(items, pagination.params.cursor, pagination.params.limit);

    return NextResponse.json({
      success: true,
      ...paginated,
      payrollPeriods: tenantPeriods,
      payrollItems: paginated.items,
    });
  } catch (error: any) {
    const status = error.statusCode || (error.name === 'AuthenticationError' ? 401 : 500);
    return NextResponse.json({ error: error.message || 'Gagal mengambil data payroll' }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const actor = await resolveServerSession(req);
    const body = await req.json();

    const tenantId = resolveEffectiveTenantId(actor, body.tenantId);
    const actionRaw = (body.action || '').toUpperCase().replace('-', '_');
    const action = actionRaw === 'CALCULATE' ? 'RECALCULATE' : actionRaw === 'PAY' ? 'MARK_PAID' : actionRaw;
    const periodId = body.periodId;

    if (!periodId) {
      return NextResponse.json({ error: 'ID periode penggajian wajib disertakan.' }, { status: 400 });
    }

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

    // Financial actions rate limit (10 per minute per user)
    const rateCheck = RateLimiters.payrollAction(session.id);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Terlalu banyak instruksi payroll dalam waktu singkat. Mohon tunggu sejenak demi integritas data.' },
        { status: 429 }
      );
    }

    const targetPeriod = await payrollRepository.findPeriodById(periodId, tenantId);
    if (!targetPeriod) {
      return NextResponse.json({ error: 'Periode penggajian tidak ditemukan.' }, { status: 404 });
    }

    if (action === 'RECALCULATE') {
      const authResult = authorize({
        actor,
        action: 'payroll.calculate',
        resource: { type: 'payroll', id: periodId, tenantId },
      });

      if (!authResult.allowed) {
        return NextResponse.json(
          { error: authResult.reason || 'Akses ditolak: Anda tidak memiliki wewenang mengkalkulasi payroll.' },
          { status: authResult.statusCode || 403 }
        );
      }

      // Security check: Prevent mutation if already LOCKED or PAID
      PayrollGuard.assertImmutability(targetPeriod);

      const result = await payrollRepository.recalculatePeriod(periodId, session, tenantId);

      AuditLogService.log({
        tenantId,
        actorId: session.id,
        actorRole: session.role,
        actorName: session.name,
        action: 'PAYROLL_RECALCULATED',
        entityType: 'PayrollPeriod',
        entityId: periodId,
        ipAddress: clientIp,
        userAgent: req.headers.get('user-agent') || 'Browser',
        status: 'SUCCESS',
        metadata: { periodName: targetPeriod.name, totalEmployees: result.period.totalEmployees },
      });

      return NextResponse.json({ success: true, period: result.period, items: result.items });
    }

    if (action === 'LOCK') {
      const authResult = authorize({
        actor,
        action: 'payroll.lock',
        resource: { type: 'payroll', id: periodId, tenantId },
      });

      if (!authResult.allowed) {
        return NextResponse.json(
          { error: authResult.reason || 'Akses ditolak: Anda tidak memiliki wewenang mengunci periode payroll.' },
          { status: authResult.statusCode || 403 }
        );
      }

      PayrollGuard.assertImmutability(targetPeriod);

      // Four-Eyes Principle / Anti-Self-Lock:
      const isExecutiveOverride = session.role === 'SUPERADMIN' || session.role === 'ADMIN_PT';
      if (targetPeriod.calculatedBy && targetPeriod.calculatedBy === session.id && !isExecutiveOverride) {
        AuditLogService.log({
          tenantId,
          actorId: session.id,
          actorRole: session.role,
          actorName: session.name,
          action: 'SECURITY_ALERT',
          entityType: 'PayrollPeriod',
          entityId: periodId,
          ipAddress: clientIp,
          userAgent: req.headers.get('user-agent') || 'Browser',
          status: 'FAILURE',
          metadata: {
            alertType: 'FOUR_EYES_VIOLATION_PAYROLL_SELF_LOCK',
            reason: 'Percobaan penguncian payroll oleh pihak yang sama dengan pengkalkulasi (Self-Lock dicegah).',
            calculatedBy: targetPeriod.calculatedBy,
            attemptedBy: session.id,
          },
        });

        return NextResponse.json(
          {
            error:
              'Prinsip Pemisahan Tugas (Four-Eyes Principle): Anda tidak dapat mengunci periode penggajian yang Anda kalkulasi sendiri. Penguncian harus diverifikasi dan disetujui oleh pejabat pemeriksa (checker) terpisah.',
            details: {
              calculatedBy: targetPeriod.calculatedBy,
              attemptedBy: session.name,
            },
          },
          { status: 403 }
        );
      }

      // Verify reconciliation before locking
      const periodItems = await payrollRepository.findItems(periodId, tenantId);
      const reconciliation = PayrollGuard.reconcilePeriod(targetPeriod, periodItems);
      if (!reconciliation.isBalanced) {
        return NextResponse.json(
          {
            error: 'Integritas akuntansi gagal: Rekonsiliasi batch tidak seimbang.',
            details: reconciliation.errors,
          },
          { status: 422 }
        );
      }

      const lockedPeriod = await payrollRepository.lockPeriod(periodId, session, tenantId);

      AuditLogService.log({
        tenantId,
        actorId: session.id,
        actorRole: session.role,
        actorName: session.name,
        action: 'PAYROLL_LOCKED',
        entityType: 'PayrollPeriod',
        entityId: periodId,
        ipAddress: clientIp,
        userAgent: req.headers.get('user-agent') || 'Browser',
        status: 'SUCCESS',
        after: { status: 'LOCKED', lockedBy: session.name },
      });

      return NextResponse.json({ success: true, period: lockedPeriod });
    }

    if (action === 'MARK_PAID') {
      const authResult = authorize({
        actor,
        action: 'payroll.approve',
        resource: { type: 'payroll', id: periodId, tenantId },
      });

      if (!authResult.allowed) {
        return NextResponse.json(
          { error: authResult.reason || 'Akses ditolak: Anda tidak memiliki wewenang menandai penggajian telah dibayarkan.' },
          { status: authResult.statusCode || 403 }
        );
      }

      if (targetPeriod.status !== 'LOCKED') {
        return NextResponse.json(
          { error: 'Periode penggajian harus berstatus LOCKED sebelum dapat ditandai ditransfer/dibayarkan.' },
          { status: 400 }
        );
      }

      const isExecutiveOverride = session.role === 'SUPERADMIN' || session.role === 'ADMIN_PT';
      if (targetPeriod.lockedBy && targetPeriod.lockedBy === session.id && !isExecutiveOverride) {
        AuditLogService.log({
          tenantId,
          actorId: session.id,
          actorRole: session.role,
          actorName: session.name,
          action: 'SECURITY_ALERT',
          entityType: 'PayrollPeriod',
          entityId: periodId,
          ipAddress: clientIp,
          userAgent: req.headers.get('user-agent') || 'Browser',
          status: 'FAILURE',
          metadata: {
            alertType: 'FOUR_EYES_VIOLATION_PAYROLL_SELF_DISBURSE',
            reason: 'Percobaan pencairan/pelunasan payroll oleh pihak yang sama dengan pengunci periode (Self-Disbursement dicegah).',
            lockedBy: targetPeriod.lockedBy,
            attemptedBy: session.id,
          },
        });

        return NextResponse.json(
          {
            error:
              'Prinsip Pemisahan Tugas (Four-Eyes Principle): Anda tidak dapat menandai dibayarkan periode penggajian yang Anda kunci sendiri. Verifikasi dan pencairan harus dilakukan oleh staf/pejabat Finance independen.',
            details: {
              lockedBy: targetPeriod.lockedByName || targetPeriod.lockedBy,
              attemptedBy: session.name,
            },
          },
          { status: 403 }
        );
      }

      const paidPeriod = await payrollRepository.markPaid(periodId, session, tenantId);

      AuditLogService.log({
        tenantId,
        actorId: session.id,
        actorRole: session.role,
        actorName: session.name,
        action: 'PAYROLL_DISBURSED',
        entityType: 'PayrollPeriod',
        entityId: periodId,
        ipAddress: clientIp,
        userAgent: req.headers.get('user-agent') || 'Browser',
        status: 'SUCCESS',
        after: { status: 'PAID', approvedBy: session.name },
      });

      return NextResponse.json({ success: true, period: paidPeriod });
    }

    return NextResponse.json({ error: 'Aksi payroll tidak dikenali' }, { status: 400 });
  } catch (error: any) {
    const status = error.statusCode || (error.name === 'AuthenticationError' ? 401 : 500);
    return NextResponse.json({ error: error.message || 'Gagal memproses payroll' }, { status });
  }
}
