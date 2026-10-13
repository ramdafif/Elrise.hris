import { NextRequest, NextResponse } from 'next/server';
import { getHrisStore } from '@/lib/db/store';
import { employeeRepository } from '@/lib/db/repositories/employee.repository';
import { projectRepository } from '@/lib/db/repositories/project.repository';
import { EmployeeCreateSchema, EmployeeUpdateSchema, formatZodErrors, parseCursorPagination } from '@/lib/security/validation';
import { authorize } from '@/lib/security/authorization';
import { resolveServerSession, resolveEffectiveTenantId } from '@/lib/auth/session';
import { RateLimiters } from '@/lib/security/rateLimiter';
import { AuditLogService } from '@/lib/security/audit';

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const rateCheck = RateLimiters.generalApi(clientIp);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan. Silakan tunggu beberapa saat.' },
        { status: 429 }
      );
    }

    // Resolve server-authoritative session (fails 401 if unauthenticated)
    const actor = await resolveServerSession(req);
    const body = await req.json();

    const tenantId = resolveEffectiveTenantId(actor, body.tenantId);
    const action =
      body.action ||
      (body.employee || body.employeeData ? 'CREATE' : (body.id || body.employeeId) && body.updates ? 'UPDATE' : undefined);
    const employeeData = body.employeeData || body.employee;
    const employeeId = body.employeeId || body.id;
    const updates = body.updates ? { ...body.updates } : undefined;
    const reason = body.reason;

    const store = getHrisStore();

    if (action === 'CREATE' && employeeData) {
      const authResult = authorize({
        actor,
        action: 'employee.create',
        resource: { type: 'employee', tenantId },
      });

      if (!authResult.allowed) {
        return NextResponse.json(
          { error: authResult.reason || 'Akses ditolak: Anda tidak memiliki wewenang membuat data karyawan.' },
          { status: authResult.statusCode || 403 }
        );
      }

      // Mass assignment protection: Enforce tenantId from authenticated actor context
      employeeData.tenantId = tenantId;

      // Validate with Zod schema
      const parseResult = EmployeeCreateSchema.safeParse(employeeData);
      if (!parseResult.success) {
        return NextResponse.json(
          { error: 'Validasi data gagal', details: formatZodErrors(parseResult.error) },
          { status: 422 }
        );
      }

      // Await primary write
      const created = await store.addEmployee(employeeData, {
        id: actor.id,
        name: actor.name,
        role: actor.role,
        email: actor.email,
        scopeType: actor.scopeType,
        tenantId,
      });

      AuditLogService.log({
        tenantId,
        actorId: actor.id,
        actorRole: actor.role,
        actorName: actor.name,
        action: 'EMPLOYEE_CREATED',
        entityType: 'Employee',
        entityId: created.id,
        ipAddress: clientIp,
        userAgent: req.headers.get('user-agent') || 'Browser',
        status: 'SUCCESS',
        after: { id: created.id, fullName: created.fullName, departmentId: created.departmentId },
      });

      return NextResponse.json({ success: true, employee: created });
    }

    if (action === 'UPDATE' && employeeId && updates) {
      const authResult = authorize({
        actor,
        action: 'employee.update',
        resource: { type: 'employee', id: employeeId, employeeId, tenantId },
      });

      if (!authResult.allowed) {
        return NextResponse.json(
          { error: authResult.reason || 'Akses ditolak.' },
          { status: authResult.statusCode || 403 }
        );
      }

      // Self-scope Anti-IDOR enforcement: EMPLOYEE can only update their own record
      if (actor.role === 'EMPLOYEE' && actor.employeeId !== employeeId) {
        return NextResponse.json(
          { error: 'Akses ditolak: Karyawan dilarang mengubah data karyawan lain.' },
          { status: 403 }
        );
      }

      // Mass Assignment Defense: Protected properties cannot be modified through update
      delete updates.id;
      delete updates.tenantId;
      delete updates.role;
      delete updates.employeeId;

      // Salary protection: Non-executive cannot modify compensation
      if (actor.role !== 'SUPERADMIN' && actor.role !== 'ADMIN_PT') {
        delete updates.basicSalary;
        delete updates.fixedAllowance;
        delete updates.mealAllowance;
        delete updates.transportAllowance;
        delete updates.communicationAllowance;
      }

      // Validate updates with Zod
      const parseResult = EmployeeUpdateSchema.safeParse(updates);
      if (!parseResult.success) {
        return NextResponse.json(
          { error: 'Validasi pembaruan data gagal', details: formatZodErrors(parseResult.error) },
          { status: 422 }
        );
      }

      const updated = await store.updateEmployee(
        employeeId,
        updates,
        {
          id: actor.id,
          name: actor.name,
          role: actor.role,
          email: actor.email,
          scopeType: actor.scopeType,
          tenantId,
        },
        reason
      );

      AuditLogService.log({
        tenantId,
        actorId: actor.id,
        actorRole: actor.role,
        actorName: actor.name,
        action: 'EMPLOYEE_UPDATED',
        entityType: 'Employee',
        entityId: employeeId,
        ipAddress: clientIp,
        userAgent: req.headers.get('user-agent') || 'Browser',
        status: 'SUCCESS',
        after: updates,
      });

      return NextResponse.json({ success: true, employee: updated });
    }

    if (action === 'TERMINATE' && employeeId) {
      const authResult = authorize({
        actor,
        action: 'employee.delete',
        resource: { type: 'employee', id: employeeId, tenantId },
      });

      if (!authResult.allowed) {
        return NextResponse.json(
          { error: authResult.reason || 'Akses ditolak: Anda tidak memiliki wewenang menonaktifkan karyawan.' },
          { status: authResult.statusCode || 403 }
        );
      }

      await employeeRepository.terminate(
        employeeId,
        {
          id: actor.id,
          name: actor.name,
          role: actor.role,
          email: actor.email,
          scopeType: actor.scopeType,
          tenantId,
        },
        reason || 'Karyawan Dinonaktifkan',
        tenantId
      );

      AuditLogService.log({
        tenantId,
        actorId: actor.id,
        actorRole: actor.role,
        actorName: actor.name,
        action: 'EMPLOYEE_TERMINATED',
        entityType: 'Employee',
        entityId: employeeId,
        ipAddress: clientIp,
        userAgent: req.headers.get('user-agent') || 'Browser',
        status: 'SUCCESS',
        after: { employeeId, reason },
      });

      return NextResponse.json({ success: true, employeeId });
    }

    return NextResponse.json({ error: 'Aksi karyawan tidak valid' }, { status: 400 });
  } catch (error: any) {
    const status = error.statusCode || (error.name === 'AuthenticationError' ? 401 : 500);
    return NextResponse.json({ error: error.message || 'Gagal memproses data karyawan' }, { status });
  }
}

export async function PATCH(req: NextRequest) {
  return POST(req);
}

export async function GET(req: NextRequest) {
  try {
    const actor = await resolveServerSession(req);
    const { searchParams } = new URL(req.url);
    const tenantId = resolveEffectiveTenantId(actor, searchParams.get('tenantId'));

    const authResult = authorize({
      actor,
      action: 'employee.read',
      resource: { type: 'employee', tenantId },
    });

    if (!authResult.allowed) {
      return NextResponse.json(
        { error: authResult.reason || 'Akses ditolak.' },
        { status: authResult.statusCode || 403 }
      );
    }

    // Validate cursor pagination parameters (limit 1-200, default 50)
    const pagination = parseCursorPagination(searchParams);
    if (!pagination.isValid) {
      return NextResponse.json(pagination.errorResponse, { status: 422 });
    }

    // Server-side filtering parameters
    const search = searchParams.get('search')?.trim();
    const departmentId = searchParams.get('departmentId')?.trim();
    const status = searchParams.get('status')?.trim();
    const requestedProjectId = searchParams.get('projectId')?.trim();

    let allowedEmployeeIds: string[] | undefined = undefined;

    // ADMIN_PROJECT scoping: only see employees assigned to their project(s)
    if (actor.scopeType === 'PROJECT' && actor.projectIds && actor.projectIds.length > 0) {
      const assignments = await projectRepository.findAssignments({ tenantId });
      const myProjectAssignments = assignments.filter((a) =>
        actor.projectIds!.includes(a.projectId)
      );
      allowedEmployeeIds = Array.from(new Set(myProjectAssignments.map((a) => a.employeeId)));
    } else if (requestedProjectId) {
      const assignments = await projectRepository.findAssignments({ tenantId, projectId: requestedProjectId });
      allowedEmployeeIds = Array.from(new Set(assignments.map((a) => a.employeeId)));
    }

    const paginated = await employeeRepository.findCursorPaginated({
      cursor: pagination.params.cursor,
      limit: pagination.params.limit,
      search: search || undefined,
      departmentId: departmentId || undefined,
      status: status || undefined,
      allowedEmployeeIds,
      tenantId,
      sessionRole: actor.role,
      sessionEmployeeId: actor.employeeId,
    });

    // Mask salary data for ADMIN_PROJECT and non-authorized roles (only SUPERADMIN and ADMIN_PT can view company salary data)
    const canViewSalary = actor.role === 'SUPERADMIN' || actor.role === 'ADMIN_PT';

    const safeEmployees = paginated.items.map((emp) => {
      if (!canViewSalary && actor.employeeId !== emp.id) {
        return {
          ...emp,
          basicSalary: 0,
          fixedAllowance: 0,
          mealAllowance: 0,
          transportAllowance: 0,
          communicationAllowance: 0,
          bankAccountNumber: '***HIDDEN***',
        };
      }
      return emp;
    });

    return NextResponse.json({
      success: true,
      ...paginated,
      employees: safeEmployees,
      actorScope: {
        role: actor.role,
        scopeType: actor.scopeType,
        tenantId,
        projectIds: actor.projectIds || [],
      },
    });
  } catch (error: any) {
    const status = error.statusCode || (error.name === 'AuthenticationError' ? 401 : 500);
    return NextResponse.json({ error: error.message || 'Gagal mengambil data karyawan' }, { status });
  }
}
