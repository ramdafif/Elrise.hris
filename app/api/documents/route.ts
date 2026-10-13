import { NextRequest, NextResponse } from 'next/server';
import { getHrisStore } from '@/lib/db/store';
import { EmployeeDocument, UserSession } from '@/lib/types';
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
      action: 'documents.read',
      resource: { type: 'document', tenantId },
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
    let docs = store.documents.filter((d) =>
      d.tenantId === tenantId ||
      (!d.tenantId && store.employees.find((e) => e.id === d.employeeId)?.tenantId === tenantId)
    );

    // 1. Role-based scoping (Anti-IDOR & PII Document Privacy)
    if (actor.role === 'EMPLOYEE' || actor.scopeType === 'SELF') {
      if (filterEmployeeId && filterEmployeeId !== actor.employeeId) {
        return NextResponse.json(
          { error: 'Akses ditolak: Karyawan dilarang mengakses dokumen karyawan lain (Anti-IDOR Protection).' },
          { status: 403 }
        );
      }
      docs = docs.filter((d) => d.employeeId === actor.employeeId);
    } else if (actor.scopeType === 'PROJECT' || actor.role === 'ADMIN_PROJECT') {
      const { projectRepository } = await import('@/lib/db/repositories/project.repository');
      const assignments = await projectRepository.findAssignments({ tenantId });
      const myProjectEmpIds = assignments
        .filter((asg) => (actor.projectIds || []).includes(asg.projectId))
        .map((asg) => asg.employeeId);
      docs = docs.filter((d) => myProjectEmpIds.includes(d.employeeId));
    }

    if (filterEmployeeId) {
      docs = docs.filter((d) => d.employeeId === filterEmployeeId);
    }

    // Sort descending by createdAt
    docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const paginated = paginateWithCursor(docs, pagination.params.cursor, pagination.params.limit);

    return NextResponse.json({
      success: true,
      ...paginated,
      documents: paginated.items,
    });
  } catch (error: any) {
    const status = error.statusCode || (error.name === 'AuthenticationError' ? 401 : 500);
    return NextResponse.json({ error: error.message || 'Gagal mengambil dokumen karyawan' }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const actor = await resolveServerSession(req);
    const body = await req.json();
    const tenantId = resolveEffectiveTenantId(actor, body.tenantId);

    const { action, documentData, documentId } = body as {
      action: 'UPLOAD' | 'VERIFY';
      documentData?: {
        employeeId?: string;
        category: EmployeeDocument['category'];
        fileName: string;
        fileUrl?: string;
        fileSizeKb?: number;
        expiryDate?: string;
      };
      documentId?: string;
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

    if (action === 'UPLOAD') {
      const authResult = authorize({
        actor,
        action: 'documents.upload',
        resource: { type: 'document', tenantId },
      });

      if (!authResult.allowed) {
        return NextResponse.json(
          { error: authResult.reason || 'Akses ditolak: Anda tidak memiliki hak akses mengunggah berkas dokumen.' },
          { status: authResult.statusCode || 403 }
        );
      }

      if (!documentData) {
        return NextResponse.json({ error: 'Data berkas dokumen tidak lengkap.' }, { status: 400 });
      }

      const targetEmpId = (actor.role === 'EMPLOYEE' || actor.scopeType === 'SELF')
        ? actor.employeeId!
        : documentData.employeeId || actor.employeeId!;

      if (!documentData.category) {
        return NextResponse.json({ error: 'Kategori berkas wajib dipilih.' }, { status: 422 });
      }

      if (!documentData.fileName || !documentData.fileName.trim()) {
        return NextResponse.json({ error: 'Nama berkas dokumen tidak boleh kosong.' }, { status: 422 });
      }

      const newDoc: EmployeeDocument = {
        id: `doc-${Date.now()}`,
        tenantId,
        employeeId: targetEmpId,
        category: documentData.category,
        fileName: documentData.fileName.trim(),
        fileUrl: documentData.fileUrl || '#',
        fileSizeKb: documentData.fileSizeKb || Math.floor(Math.random() * 800) + 120,
        expiryDate: documentData.expiryDate,
        isVerified: false,
        createdAt: new Date().toISOString(),
      };

      store.documents.unshift(newDoc);

      AuditLogService.log({
        tenantId,
        actorId: actor.id,
        actorRole: actor.role,
        actorName: actor.name,
        action: 'CREATE',
        entityType: 'EmployeeDocument',
        entityId: newDoc.id,
        ipAddress: clientIp,
        userAgent: req.headers.get('user-agent') || 'Browser',
        status: 'SUCCESS',
        metadata: {
          employeeId: newDoc.employeeId,
          category: newDoc.category,
          fileName: newDoc.fileName,
        },
      });

      return NextResponse.json({ success: true, document: newDoc });
    }

    if (action === 'VERIFY') {
      const authResult = authorize({
        actor,
        action: 'documents.verify',
        resource: { type: 'document', id: documentId, tenantId },
      });

      if (!authResult.allowed) {
        return NextResponse.json(
          { error: authResult.reason || 'Akses ditolak: Verifikasi keabsahan dokumen wajib dilakukan oleh HR Admin atau Petugas Legal.' },
          { status: authResult.statusCode || 403 }
        );
      }

      if (!documentId) {
        return NextResponse.json({ error: 'Parameter documentId wajib disertakan.' }, { status: 400 });
      }

      const target = store.documents.find((d) => d.id === documentId);
      if (!target) {
        return NextResponse.json({ error: 'Berkas dokumen tidak ditemukan.' }, { status: 404 });
      }

      if (target.tenantId && target.tenantId !== tenantId) {
        return NextResponse.json({ error: 'Akses ditolak: Dokumen milik tenant lain.' }, { status: 403 });
      }

      // Anti-Self-Verification (Four-Eyes Principle)
      if (target.employeeId === actor.employeeId) {
        return NextResponse.json(
          { error: 'Pelanggaran Tata Kelola: Anda dilarang memverifikasi dokumen milik Anda sendiri.' },
          { status: 403 }
        );
      }

      target.isVerified = true;
      target.verifiedBy = `${session.name} (${session.role})`;

      AuditLogService.log({
        tenantId,
        actorId: actor.id,
        actorRole: actor.role,
        actorName: actor.name,
        action: 'APPROVE',
        entityType: 'EmployeeDocument',
        entityId: target.id,
        ipAddress: clientIp,
        userAgent: req.headers.get('user-agent') || 'Browser',
        status: 'SUCCESS',
        metadata: {
          employeeId: target.employeeId,
          category: target.category,
          fileName: target.fileName,
        },
      });

      return NextResponse.json({ success: true, document: target });
    }

    return NextResponse.json({ error: 'Aksi dokumen tidak dikenali.' }, { status: 400 });
  } catch (error: any) {
    const status = error.statusCode || (error.name === 'AuthenticationError' ? 401 : 500);
    return NextResponse.json({ error: error.message || 'Gagal memproses dokumen' }, { status });
  }
}
