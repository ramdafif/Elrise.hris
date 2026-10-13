import { NextRequest, NextResponse } from 'next/server';
import { getHrisStore } from '@/lib/db/store';
import { EmployeeLoan, UserSession } from '@/lib/types';
import { authorize } from '@/lib/security/authorization';
import { resolveServerSession, resolveEffectiveTenantId } from '@/lib/auth/session';
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
      action: 'loan.read',
      resource: { type: 'loan', tenantId },
    });

    if (!authResult.allowed) {
      return NextResponse.json(
        { error: authResult.reason || 'Akses ditolak.' },
        { status: authResult.statusCode || 403 }
      );
    }

    const filterEmployeeId = searchParams.get('filterEmployeeId');

    const pagination = parseCursorPagination(searchParams);
    if (!pagination.isValid) {
      return NextResponse.json(pagination.errorResponse, { status: 422 });
    }

    const store = getHrisStore();

    // Filter by tenant with strict isolation
    let loans = store.employeeLoans.filter((l) =>
      l.tenantId === tenantId ||
      (!l.tenantId && store.employees.find((e) => e.id === l.employeeId)?.tenantId === tenantId)
    );

    if (actor.role === 'EMPLOYEE' || actor.scopeType === 'SELF') {
      if (filterEmployeeId && filterEmployeeId !== actor.employeeId) {
        return NextResponse.json(
          { error: 'Akses ditolak: Karyawan dilarang mengakses data pinjaman karyawan lain (Anti-IDOR Protection).' },
          { status: 403 }
        );
      }
      loans = loans.filter((l) => l.employeeId === actor.employeeId);
    } else if (actor.scopeType === 'PROJECT' || actor.role === 'ADMIN_PROJECT') {
      const { projectRepository } = await import('@/lib/db/repositories/project.repository');
      const assignments = await projectRepository.findAssignments({ tenantId });
      const myProjectEmpIds = assignments
        .filter((asg) => (actor.projectIds || []).includes(asg.projectId))
        .map((asg) => asg.employeeId);
      loans = loans.filter((l) => myProjectEmpIds.includes(l.employeeId));
    }

    if (filterEmployeeId) {
      loans = loans.filter((l) => l.employeeId === filterEmployeeId);
    }

    // Sort descending by createdAt
    loans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const paginated = paginateWithCursor(loans, pagination.params.cursor, pagination.params.limit);

    return NextResponse.json({
      success: true,
      ...paginated,
      employeeLoans: paginated.items,
    });
  } catch (error: any) {
    const status = error.statusCode || (error.name === 'AuthenticationError' ? 401 : 500);
    return NextResponse.json({ error: error.message || 'Gagal mengambil data pinjaman karyawan' }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const actor = await resolveServerSession(req);
    const body = await req.json();
    const tenantId = resolveEffectiveTenantId(actor, body.tenantId);
    const { action, loanData, loanId, status } = body as {
      action: 'CREATE' | 'UPDATE_STATUS';
      loanData?: {
        employeeId: string;
        principalAmount: number;
        installmentCount: number;
        purpose: string;
        startDate: string;
      };
      loanId?: string;
      status?: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
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
        action: 'loan.create',
        resource: { type: 'loan', tenantId },
      });

      if (!authResult.allowed) {
        return NextResponse.json(
          { error: authResult.reason || 'Akses ditolak: Pendaftaran pinjaman karyawan hanya dapat dilakukan oleh HR/Admin sesuai kebijakan kredit internal perusahaan.' },
          { status: authResult.statusCode || 403 }
        );
      }

      if (!loanData) {
        return NextResponse.json({ error: 'Data formulir pinjaman karyawan tidak lengkap.' }, { status: 400 });
      }

      const targetEmp = store.employees.find((e) => e.id === loanData.employeeId);
      if (!targetEmp) {
        return NextResponse.json({ error: 'Karyawan yang bersangkutan tidak ditemukan.' }, { status: 404 });
      }

      const principalAmount = Number(loanData.principalAmount);
      const installmentCount = Number(loanData.installmentCount);

      if (!principalAmount || principalAmount < 1000000) {
        return NextResponse.json({ error: 'Plafon pinjaman minimal adalah Rp 1.000.000.' }, { status: 422 });
      }

      if (!installmentCount || installmentCount < 1 || installmentCount > 60) {
        return NextResponse.json({ error: 'Tenor cicilan harus berkisar antara 1 hingga 60 bulan.' }, { status: 422 });
      }

      if (!loanData.purpose || !loanData.purpose.trim()) {
        return NextResponse.json({ error: 'Tujuan/peruntukan pinjaman wajib diisi.' }, { status: 422 });
      }

      const monthlyDeduction = Math.round(principalAmount / installmentCount);

      const newLoan: EmployeeLoan = {
        id: `loan-${Date.now()}`,
        tenantId,
        employeeId: loanData.employeeId,
        principalAmount,
        installmentCount,
        monthlyDeduction,
        remainingBalance: principalAmount,
        purpose: loanData.purpose.trim(),
        status: 'ACTIVE',
        startDate: loanData.startDate || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      };

      store.employeeLoans.unshift(newLoan);

      AuditLogService.log({
        tenantId,
        actorId: actor.id,
        actorRole: actor.role,
        actorName: actor.name,
        action: 'CREATE',
        entityType: 'EmployeeLoan',
        entityId: newLoan.id,
        ipAddress: clientIp,
        userAgent: req.headers.get('user-agent') || 'Browser',
        status: 'SUCCESS',
        metadata: {
          employeeId: newLoan.employeeId,
          principalAmount: newLoan.principalAmount,
          monthlyDeduction: newLoan.monthlyDeduction,
          installmentCount: newLoan.installmentCount,
        },
      });

      return NextResponse.json({ success: true, employeeLoan: newLoan });
    }

    if (action === 'UPDATE_STATUS') {
      const authResult = authorize({
        actor,
        action: 'loan.approve',
        resource: { type: 'loan', id: loanId, tenantId },
      });

      if (!authResult.allowed) {
        return NextResponse.json(
          { error: authResult.reason || 'Akses ditolak: Anda tidak memiliki wewenang mengubah status pinjaman karyawan.' },
          { status: authResult.statusCode || 403 }
        );
      }

      if (!loanId || !status) {
        return NextResponse.json({ error: 'Parameter loanId dan status wajib disertakan.' }, { status: 400 });
      }

      const validStatuses = ['ACTIVE', 'COMPLETED', 'CANCELLED'];
      if (!validStatuses.includes(status as string)) {
        return NextResponse.json(
          { error: 'Status pinjaman tidak valid. Status yang diizinkan: ACTIVE, COMPLETED, CANCELLED.' },
          { status: 422 }
        );
      }

      const target = store.employeeLoans.find((l) => l.id === loanId);
      if (!target) {
        return NextResponse.json({ error: 'Data pinjaman tidak ditemukan.' }, { status: 404 });
      }

      if (target.tenantId && target.tenantId !== tenantId) {
        return NextResponse.json({ error: 'Akses ditolak: Data pinjaman milik tenant lain.' }, { status: 403 });
      }

      // Anti-Self-Approval (Four-Eyes Principle)
      if (target.employeeId === actor.employeeId) {
        AuditLogService.log({
          tenantId,
          actorId: actor.id,
          actorRole: actor.role,
          actorName: actor.name,
          action: 'SECURITY_ALERT',
          entityType: 'EmployeeLoan',
          entityId: target.id,
          ipAddress: clientIp,
          userAgent: req.headers.get('user-agent') || 'Browser',
          status: 'FAILURE',
          metadata: {
            alertType: 'SELF_APPROVAL_ATTEMPT_LOAN',
            reason: 'Percobaan persetujuan pinjaman karyawan sendiri (Self-Approval dicegah).',
            targetEmployeeId: target.employeeId,
          },
        });

        return NextResponse.json(
          {
            error: 'Prinsip Empat Mata (Four-Eyes Principle): Anda tidak dapat menyetujui pengajuan pinjaman milik Anda sendiri.',
          },
          { status: 403 }
        );
      }

      // Project Scope validation for ADMIN_PROJECT
      if (actor.role === 'ADMIN_PROJECT') {
        const { projectRepository } = await import('@/lib/db/repositories/project.repository');
        const assignments = await projectRepository.findAssignments({ tenantId });
        const myProjectEmpIds = assignments
          .filter((asg) => actor.projectIds?.includes(asg.projectId))
          .map((asg) => asg.employeeId);
        if (!myProjectEmpIds.includes(target.employeeId)) {
          return NextResponse.json(
            { error: 'Akses ditolak: Anda hanya berwenang memproses pinjaman staf pada proyek yang Anda kelola.' },
            { status: 403 }
          );
        }
      }

      target.status = status;
      if (status === 'COMPLETED' || status === 'CANCELLED') {
        target.remainingBalance = 0;
      }

      AuditLogService.log({
        tenantId,
        actorId: actor.id,
        actorRole: actor.role,
        actorName: actor.name,
        action: 'UPDATE',
        entityType: 'EmployeeLoan',
        entityId: target.id,
        ipAddress: clientIp,
        userAgent: req.headers.get('user-agent') || 'Browser',
        status: 'SUCCESS',
        metadata: { status, employeeId: target.employeeId },
      });

      return NextResponse.json({ success: true, employeeLoan: target });
    }

    return NextResponse.json({ error: 'Aksi pinjaman tidak dikenali.' }, { status: 400 });
  } catch (error: any) {
    const status = error.statusCode || (error.name === 'AuthenticationError' ? 401 : 500);
    return NextResponse.json({ error: error.message || 'Gagal memproses pinjaman' }, { status });
  }
}
