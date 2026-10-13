import prisma, { isPrismaAvailable } from '@/lib/db/prisma';
import { AttendanceRecord, UserSession } from '@/lib/types';
import { SYSTEM_CONFIG } from '@/config/systemConfig';
import { getHrisStore } from '../store';

function mapPrismaAttendanceToDomain(att: any): AttendanceRecord {
  return {
    id: att.id,
    employeeId: att.employeeId,
    date: att.date instanceof Date ? att.date.toISOString().split('T')[0] : String(att.date),
    checkIn: att.checkIn ? new Date(att.checkIn).toISOString() : undefined,
    checkOut: att.checkOut ? new Date(att.checkOut).toISOString() : undefined,
    workDurationMin: att.workDurationMin,
    lateDurationMin: att.lateDurationMin,
    earlyLeaveMin: att.earlyLeaveMin,
    status: att.status,
    workLocation: att.workLocation,
    latitudeIn: att.latitudeIn ? Number(att.latitudeIn) : undefined,
    longitudeIn: att.longitudeIn ? Number(att.longitudeIn) : undefined,
    source: att.source || 'WEB_PORTAL',
    notes: att.notes || undefined,
    isCorrected: Boolean(att.isCorrected),
    correctionNotes: att.correctionNotes || undefined,
    proposedCheckIn: att.proposedCheckIn ? new Date(att.proposedCheckIn).toISOString() : undefined,
    proposedCheckOut: att.proposedCheckOut ? new Date(att.proposedCheckOut).toISOString() : undefined,
    correctedBy: att.correctedBy || undefined,
    correctedAt: att.correctedAt ? new Date(att.correctedAt).toISOString() : undefined,
    approvalStatus: att.approvalStatus || 'APPROVED',
  };
}

export class AttendanceRepository {
  /**
   * Retrieves all attendance records for a tenant.
   */
  async findAll(tenantId?: string): Promise<AttendanceRecord[]> {
    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const list = await prisma.attendance.findMany({
          where: tenantId ? { tenantId } : undefined,
          orderBy: { date: 'desc' },
        });
        if (list && list.length > 0) {
          return list.map(mapPrismaAttendanceToDomain);
        }
      } catch {
        // Fallback
      }
    }
    return getHrisStore().attendances;
  }

  /**
   * Executes an employee check-in.
   */
  async checkIn(
    employeeId: string,
    location: 'WFO' | 'WFH' | 'CLIENT_SITE',
    session: UserSession,
    tenantId?: string
  ): Promise<AttendanceRecord> {
    const effectiveTenantId = tenantId || session.tenantId || 'tenant-default';
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const now = new Date();

    const isDb = await isPrismaAvailable();
    let startTimeStr = SYSTEM_CONFIG.defaultWorkStartTime || '08:30';

    if (isDb) {
      try {
        const emp = await prisma.employee.findFirst({
          where: { id: employeeId, tenantId: effectiveTenantId },
          include: { branch: true },
        });
        if ((emp?.branch as any)?.workStartTime) {
          startTimeStr = (emp?.branch as any).workStartTime;
        }
      } catch {
        // Use default
      }
    }

    const [startHour, startMin] = startTimeStr.split(':').map(Number);
    const branchStartMinutes = (startHour || 8) * 60 + (startMin || 30);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const isLate = currentMinutes > branchStartMinutes;
    const lateDurationMin = isLate ? currentMinutes - branchStartMinutes : 0;
    const attId = `att-${employeeId}-${todayStr}`;

    const memoryRecord: AttendanceRecord = {
      id: attId,
      employeeId,
      date: todayStr,
      checkIn: now.toISOString(),
      workDurationMin: 0,
      lateDurationMin,
      earlyLeaveMin: 0,
      status: isLate ? 'LATE' : 'PRESENT',
      workLocation: location,
      source: 'WEB_PORTAL',
      isCorrected: false,
      approvalStatus: 'APPROVED',
    };

    if (isDb) {
      try {
        const saved = await prisma.attendance.upsert({
          where: { employeeId_date: { employeeId, date: today } },
          create: {
            id: attId,
            tenantId: effectiveTenantId,
            employeeId,
            date: today,
            checkIn: now,
            status: isLate ? 'LATE' : 'PRESENT',
            workLocation: location,
            lateDurationMin,
            earlyLeaveMin: 0,
            workDurationMin: 0,
            source: 'WEB_PORTAL',
          },
          update: {
            checkIn: now,
            status: isLate ? 'LATE' : 'PRESENT',
            workLocation: location,
            lateDurationMin,
          },
        });
        return mapPrismaAttendanceToDomain(saved);
      } catch {
        // Fallback
      }
    }

    const store = getHrisStore();
    const existingIdx = store.attendances.findIndex((a) => a.id === attId);
    if (existingIdx !== -1) {
      store.attendances[existingIdx] = { ...store.attendances[existingIdx], ...memoryRecord };
    } else {
      store.attendances.unshift(memoryRecord);
    }

    return memoryRecord;
  }

  /**
   * Executes an employee check-out.
   */
  async checkOut(
    employeeId: string,
    session: UserSession,
    tenantId?: string
  ): Promise<AttendanceRecord> {
    const effectiveTenantId = tenantId || session.tenantId || 'tenant-default';
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const now = new Date();
    const attId = `att-${employeeId}-${todayStr}`;

    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const existing = await prisma.attendance.findFirst({
          where: { id: attId, tenantId: effectiveTenantId },
        });

        if (existing) {
          let workDurationMin = 0;
          if (existing.checkIn) {
            const diffMs = now.getTime() - new Date(existing.checkIn).getTime();
            workDurationMin = Math.round(diffMs / 60000);
          }

          const emp = await prisma.employee.findFirst({
            where: { id: employeeId, tenantId: effectiveTenantId },
            include: { branch: true },
          });

          const endTimeStr =
            (emp?.branch as any)?.workEndTime || SYSTEM_CONFIG.defaultWorkEndTime || '17:00';
          const [endHour, endMin] = endTimeStr.split(':').map(Number);
          const branchEndMinutes = (endHour || 17) * 60 + (endMin || 0);
          const currentMinutes = now.getHours() * 60 + now.getMinutes();

          const isEarlyLeave = currentMinutes < branchEndMinutes;
          const earlyLeaveMin = isEarlyLeave ? branchEndMinutes - currentMinutes : 0;

          const saved = await prisma.attendance.update({
            where: { id: attId },
            data: {
              checkOut: now,
              workDurationMin,
              earlyLeaveMin,
            },
          });

          return mapPrismaAttendanceToDomain(saved);
        }
      } catch {
        // Fallback
      }
    }

    const store = getHrisStore();
    const existing = store.attendances.find((a) => a.id === attId || (a.employeeId === employeeId && a.date === todayStr));
    if (!existing) {
      throw new Error('Belum melakukan check-in hari ini.');
    }

    let workDurationMin = 0;
    if (existing.checkIn) {
      const diffMs = now.getTime() - new Date(existing.checkIn).getTime();
      workDurationMin = Math.round(diffMs / 60000);
    }

    existing.checkOut = now.toISOString();
    existing.workDurationMin = workDurationMin;

    return existing;
  }
}

export const attendanceRepository = new AttendanceRepository();
