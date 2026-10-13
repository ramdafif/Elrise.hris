import prisma, { isPrismaAvailable } from '@/lib/db/prisma';
import { Reimbursement, ApprovalStatus } from '@/lib/types';
import { PaginatedResult, paginateWithCursor } from '@/lib/db/pagination';
import { randomUUID } from 'crypto';

export interface ReimbursementFilterParams {
  tenantId?: string;
  cursor?: string | null;
  limit?: number;
  sessionRole?: string;
  sessionEmployeeId?: string;
  employeeId?: string | null;
  status?: string | null;
  category?: string | null;
}

export function mapPrismaReimbursementToDomain(r: any): Reimbursement {
  return {
    id: r.id,
    employeeId: r.employeeId,
    category: r.category,
    amount: Number(r.amount),
    description: r.description,
    receiptUrl: r.receiptUrl || undefined,
    status: r.status as ApprovalStatus,
    approvedBy: r.approvedBy || undefined,
    approvedAt: r.approvedAt ? new Date(r.approvedAt).toISOString() : undefined,
    paidInPayroll: Boolean(r.paidInPayroll),
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
  };
}

export class ReimbursementRepository {
  /**
   * Primary cursor-based pagination query executed directly on Prisma PostgreSQL.
   */
  async findCursorPaginated(params: ReimbursementFilterParams = {}): Promise<PaginatedResult<Reimbursement>> {
    const {
      tenantId,
      cursor = null,
      limit = 50,
      sessionRole,
      sessionEmployeeId,
      employeeId,
      status,
      category,
    } = params;

    const safeLimit = Math.max(1, Math.min(200, limit));
    const where: any = {};
    if (tenantId) {
      where.tenantId = tenantId;
    }

    // RBAC scoping at database query level
    if (sessionRole === 'EMPLOYEE' && sessionEmployeeId) {
      where.employeeId = sessionEmployeeId;
    } else if (sessionRole === 'ADMIN_PROJECT' && sessionEmployeeId) {
      where.OR = [
        { employeeId: sessionEmployeeId },
        { employee: { managerId: sessionEmployeeId } },
      ];
    } else if (employeeId) {
      where.employeeId = employeeId;
    }

    if (status) {
      where.status = status;
    }
    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }

    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const queryArgs: any = {
          where,
          take: safeLimit + 1,
          orderBy: { createdAt: 'desc' },
        };

        if (cursor) {
          queryArgs.cursor = { id: cursor };
          queryArgs.skip = 1;
        }

        const rows = await (prisma as any).reimbursement.findMany(queryArgs);
        const domainItems = rows.map(mapPrismaReimbursementToDomain);
        return paginateWithCursor(domainItems, cursor, safeLimit);
      } catch {
        // Fallback to cache
      }
    }

    // Fallback: Read from in-memory cache
    const { getHrisStore } = await import('@/lib/db/store');
    let records = getHrisStore().reimbursements;

    if (sessionRole === 'EMPLOYEE' && sessionEmployeeId) {
      records = records.filter((r) => r.employeeId === sessionEmployeeId);
    } else if (sessionRole === 'ADMIN_PROJECT' && sessionEmployeeId) {
      const store = getHrisStore();
      const directReports = store.employees
        .filter((e) => e.managerId === sessionEmployeeId)
        .map((e) => e.id);
      records = records.filter(
        (r) => r.employeeId === sessionEmployeeId || directReports.includes(r.employeeId)
      );
    } else if (employeeId) {
      records = records.filter((r) => r.employeeId === employeeId);
    }

    if (status) {
      records = records.filter((r) => r.status === status);
    }
    if (category) {
      records = records.filter((r) => r.category.toLowerCase() === category.toLowerCase());
    }

    records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return paginateWithCursor(records, cursor, safeLimit);
  }

  async findById(id: string, tenantId?: string): Promise<Reimbursement | null> {
    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const where: any = { id };
        if (tenantId) where.tenantId = tenantId;
        const record = await (prisma as any).reimbursement.findFirst({ where });
        if (record) return mapPrismaReimbursementToDomain(record);
      } catch {
        // Fallback
      }
    }
    const { getHrisStore } = await import('@/lib/db/store');
    return getHrisStore().reimbursements.find((r) => r.id === id) || null;
  }

  /**
   * Creates a new reimbursement record.
   */
  async create(data: {
    employeeId: string;
    category: string;
    amount: number;
    description: string;
    receiptUrl?: string;
    tenantId: string;
  }): Promise<Reimbursement> {
    const id = randomUUID();
    const domain: Reimbursement = {
      id,
      employeeId: data.employeeId,
      category: data.category.trim(),
      amount: Math.round(data.amount),
      description: data.description.trim(),
      receiptUrl: data.receiptUrl || undefined,
      status: 'PENDING',
      paidInPayroll: false,
      createdAt: new Date().toISOString(),
    };

    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const created = await (prisma as any).reimbursement.create({
          data: {
            id,
            tenantId: data.tenantId,
            employeeId: data.employeeId,
            category: data.category.trim(),
            amount: Math.round(data.amount),
            description: data.description.trim(),
            receiptUrl: data.receiptUrl || null,
            status: 'PENDING',
            paidInPayroll: false,
          },
        });
        return mapPrismaReimbursementToDomain(created);
      } catch {
        // Fallback
      }
    }

    try {
      const { getHrisStore } = await import('@/lib/db/store');
      getHrisStore().reimbursements.unshift(domain);
    } catch {
      // Ignore
    }

    return domain;
  }

  /**
   * Updates status (approval/rejection) of a reimbursement claim.
   */
  async updateStatus(
    id: string,
    status: 'APPROVED' | 'REJECTED' | 'CANCELLED',
    approverName: string,
    approverRole: string,
    tenantId?: string
  ): Promise<Reimbursement> {
    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const updated = await (prisma as any).reimbursement.update({
          where: { id },
          data: {
            status,
            approvedBy: `${approverName} (${approverRole})`,
            approvedAt: new Date(),
          },
        });
        return mapPrismaReimbursementToDomain(updated);
      } catch {
        // Fallback
      }
    }

    const { getHrisStore } = await import('@/lib/db/store');
    const store = getHrisStore();
    const idx = store.reimbursements.findIndex((r) => r.id === id);
    if (idx !== -1) {
      store.reimbursements[idx] = {
        ...store.reimbursements[idx],
        status,
        approvedBy: `${approverName} (${approverRole})`,
        approvedAt: new Date().toISOString(),
      };
      return store.reimbursements[idx];
    }

    throw new Error('Reimbursement record not found');
  }
}

export const reimbursementRepository = new ReimbursementRepository();
