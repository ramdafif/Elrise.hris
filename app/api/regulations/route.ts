import { NextRequest, NextResponse } from 'next/server';
import { getHrisStore } from '@/lib/db/store';
import { GovernmentRegulation, UserSession } from '@/lib/types';
import { resolveServerSession } from '@/lib/auth/session';
import { authorize } from '@/lib/security/authorization';

export async function POST(req: NextRequest) {
  try {
    const actor = await resolveServerSession(req);

    const authResult = authorize({
      actor,
      action: 'settings.update',
      resource: { type: 'setting' },
    });

    if (!authResult.allowed) {
      return NextResponse.json(
        { error: authResult.reason || 'Akses ditolak: Anda tidak memiliki wewenang mengubah konfigurasi regulasi ketenagakerjaan.' },
        { status: authResult.statusCode || 403 }
      );
    }

    const body = await req.json();
    const { regulationId, updates } = body as {
      regulationId: string;
      updates: Partial<GovernmentRegulation>;
    };

    if (!regulationId || !updates) {
      return NextResponse.json({ error: 'ID regulasi dan perubahan wajib disertakan.' }, { status: 400 });
    }

    const store = getHrisStore();
    const reg = store.regulations.find((r) => r.id === regulationId);
    if (!reg) return NextResponse.json({ error: 'Regulasi tidak ditemukan' }, { status: 404 });

    const session: UserSession = {
      id: actor.id,
      name: actor.name,
      role: actor.role,
      email: actor.email,
      scopeType: actor.scopeType,
      tenantId: actor.tenantId,
      employeeId: actor.employeeId,
      projectIds: actor.projectIds,
    };

    const oldValues = { ...reg };
    Object.assign(reg, updates);
    reg.version += 1;
    reg.verifiedAt = new Date().toISOString().split('T')[0];
    reg.verifiedBy = `${actor.name} (${actor.role})`;

    store.logAudit(session, 'UPDATE', 'TAX_RULE', 'GovernmentRegulation', regulationId, {
      oldValues,
      newValues: reg,
      reason: 'Pembaruan Parameter Regulasi Pemerintah (Dynamic Rule Engine)',
    });

    return NextResponse.json({ success: true, regulation: reg });
  } catch (error: any) {
    const status = error.statusCode || (error.name === 'AuthenticationError' ? 401 : 400);
    return NextResponse.json({ error: error.message || 'Gagal mengubah regulasi' }, { status });
  }
}
