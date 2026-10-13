import prisma, { isPrismaAvailable } from '@/lib/db/prisma';
import { LeaveRequest, LeaveType, UserSession } from '@/lib/types';
import { getHrisStore } from '../store';

function mapPrismaLeaveRequestToDomain(req: any): LeaveRequest {
  return {
    id: req.id,
    employeeId: req.employeeId,
    leaveTypeId: req.leaveTypeId,
    startDate: req.startDate instanceof Date ? req.startDate.toISOString().split('T')[0] : String(req.startDate),
    endDate: req.endDate instanceof Date ? req.endDate.toISOString().split('T')[0] : String(req.endDate),
    totalDays: req.totalDays,
    reason: req.reason,
    attachmentUrl: req.attachmentUrl || undefined,
    status: req.status,
    managerNotes: req.managerNotes || undefined,
    rejectionReason: req.rejectionReason || undefined,
    approvedBy: req.approvedBy || undefined,
    approvedAt: req.approvedAt ? new Date(req.approvedAt).toISOString() : undefined,
    createdAt: req.createdAt ? new Date(req.createdAt).toISOString() : new Date().toISOString(),
  };
}

export class LeaveRepository {
  /**
   * Retrieves all leave requests for a tenant.
   */
  async findAll(tenantId?: string): Promise<LeaveRequest[]> {
    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const list = await prisma.leaveRequest.findMany({
          where: tenantId ? { tenantId } : undefined,
          orderBy: { createdAt: 'desc' },
        });
        if (list && list.length > 0) {
          return list.map(mapPrismaLeaveRequestToDomain);
        }
      } catch {
        // Fallback
      }
    }
    return getHrisStore().leaveRequests;
  }

  /**
   * Retrieves all leave types.
   */
  async findLeaveTypes(): Promise<LeaveType[]> {
    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const list = await prisma.leaveType.findMany({
          orderBy: { id: 'asc' },
        });
        if (list && list.length > 0) {
          return list.map((lt: any) => ({
            id: lt.id,
            code: lt.code,
            name: lt.name,
            annualEntitlement: lt.annualEntitlement,
            carryForwardMax: lt.carryForwardMax,
            requiresAttachment: Boolean(lt.requiresAttachment),
            isPaid: Boolean(lt.isPaid),
          }));
        }
      } catch {
        // Fallback
      }
    }
    return getHrisStore().leaveTypes;
  }

  /**
   * Creates a new leave request.
   */
  async create(
    data: Omit<LeaveRequest, 'id' | 'status' | 'createdAt'>,
    session: UserSession,
    tenantId: string
  ): Promise<LeaveRequest> {
    const id = `leave-${Date.now()}`;
    const domain: LeaveRequest = {
      id,
      employeeId: data.employeeId,
      leaveTypeId: data.leaveTypeId,
      startDate: data.startDate,
      endDate: data.endDate,
      totalDays: data.totalDays,
      reason: data.reason,
      attachmentUrl: data.attachmentUrl,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const created = await prisma.leaveRequest.create({
          data: {
            id,
            tenantId,
            employeeId: data.employeeId,
            leaveTypeId: data.leaveTypeId,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            totalDays: data.totalDays,
            reason: data.reason,
            attachmentUrl: data.attachmentUrl,
            status: 'PENDING',
          },
        });
        return mapPrismaLeaveRequestToDomain(created);
      } catch {
        // Fallback
      }
    }

    getHrisStore().leaveRequests.unshift(domain);
    return domain;
  }

  /**
   * Updates status of a leave request.
   */
  async updateStatus(
    id: string,
    status: 'APPROVED' | 'REJECTED',
    approverName: string,
    session: UserSession,
    rejectionReason?: string,
    tenantId?: string
  ): Promise<LeaveRequest> {
    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const updated = await prisma.leaveRequest.update({
          where: { id },
          data: {
            status,
            approvedBy: approverName,
            approvedAt: new Date(),
            managerNotes: status === 'REJECTED' ? rejectionReason : undefined,
          },
        });
        return mapPrismaLeaveRequestToDomain(updated);
      } catch {
        // Fallback
      }
    }

    const store = getHrisStore();
    const idx = store.leaveRequests.findIndex((r) => r.id === id);
    if (idx !== -1) {
      store.leaveRequests[idx] = {
        ...store.leaveRequests[idx],
        status,
        approvedBy: approverName,
        approvedAt: new Date().toISOString(),
        managerNotes: status === 'REJECTED' ? rejectionReason : undefined,
      };
      return store.leaveRequests[idx];
    }

    throw new Error('Permohonan cuti tidak ditemukan');
  }
}

export const leaveRepository = new LeaveRepository();
