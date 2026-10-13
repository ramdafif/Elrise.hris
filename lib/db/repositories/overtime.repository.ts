import prisma, { isPrismaAvailable } from '@/lib/db/prisma';
import { OvertimeRequest, UserSession } from '@/lib/types';
import { getHrisStore } from '../store';

function mapPrismaOvertimeRequestToDomain(ot: any): OvertimeRequest {
  return {
    id: ot.id,
    employeeId: ot.employeeId,
    date: ot.date instanceof Date ? ot.date.toISOString().split('T')[0] : String(ot.date),
    startTime: ot.startTime,
    endTime: ot.endTime,
    durationHours: Number(ot.durationHours),
    calculatedHours: Number(ot.calculatedHours),
    overtimePay: Number(ot.overtimePay),
    reason: ot.reason,
    status: ot.status,
    managerNotes: ot.managerNotes || undefined,
    rejectionReason: ot.rejectionReason || undefined,
    approvedBy: ot.approvedBy || undefined,
    approvedAt: ot.approvedAt ? new Date(ot.approvedAt).toISOString() : undefined,
    payrollPeriodId: ot.payrollPeriodId || undefined,
    createdAt: ot.createdAt ? new Date(ot.createdAt).toISOString() : new Date().toISOString(),
  };
}

export class OvertimeRepository {
  /**
   * Retrieves all overtime requests for a tenant.
   */
  async findAll(tenantId?: string): Promise<OvertimeRequest[]> {
    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const list = await prisma.overtimeRequest.findMany({
          where: tenantId ? { tenantId } : undefined,
          orderBy: { createdAt: 'desc' },
        });
        if (list && list.length > 0) {
          return list.map(mapPrismaOvertimeRequestToDomain);
        }
      } catch {
        // Fallback
      }
    }
    return getHrisStore().overtimeRequests;
  }

  /**
   * Creates an overtime request.
   */
  async create(
    data: Omit<OvertimeRequest, 'id' | 'createdAt' | 'status'>,
    session: UserSession,
    tenantId: string
  ): Promise<OvertimeRequest> {
    const id = `ot-${Date.now()}`;
    const domain: OvertimeRequest = {
      id,
      employeeId: data.employeeId,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      durationHours: data.durationHours,
      calculatedHours: data.calculatedHours,
      overtimePay: data.overtimePay,
      reason: data.reason,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const created = await prisma.overtimeRequest.create({
          data: {
            id,
            tenantId,
            employeeId: data.employeeId,
            date: new Date(data.date),
            startTime: data.startTime,
            endTime: data.endTime,
            durationHours: data.durationHours,
            calculatedHours: data.calculatedHours,
            overtimePay: data.overtimePay,
            reason: data.reason,
            status: 'PENDING',
          },
        });
        return mapPrismaOvertimeRequestToDomain(created);
      } catch {
        // Fallback
      }
    }

    getHrisStore().overtimeRequests.unshift(domain);
    return domain;
  }

  /**
   * Updates status of an overtime request.
   */
  async updateStatus(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    approverName: string,
    session: UserSession,
    rejectionReason?: string,
    tenantId?: string
  ): Promise<OvertimeRequest> {
    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const updated = await prisma.overtimeRequest.update({
          where: { id },
          data: {
            status,
            approvedBy: approverName,
            approvedAt: new Date(),
            managerNotes: status === 'REJECTED' ? rejectionReason : undefined,
          },
        });
        return mapPrismaOvertimeRequestToDomain(updated);
      } catch {
        // Fallback
      }
    }

    const store = getHrisStore();
    const idx = store.overtimeRequests.findIndex((r) => r.id === id);
    if (idx !== -1) {
      store.overtimeRequests[idx] = {
        ...store.overtimeRequests[idx],
        status,
        approvedBy: approverName,
        approvedAt: new Date().toISOString(),
        managerNotes: status === 'REJECTED' ? rejectionReason : undefined,
      };
      return store.overtimeRequests[idx];
    }

    throw new Error('Permohonan lembur tidak ditemukan');
  }
}

export const overtimeRepository = new OvertimeRepository();
