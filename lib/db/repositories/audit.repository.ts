import prisma, { isPrismaAvailable } from '@/lib/db/prisma';
import { AuditLog, UserSession } from '@/lib/types';
import { PaginatedResult, paginateWithCursor } from '@/lib/db/pagination';
import { getHrisStore } from '../store';
import { randomUUID } from 'crypto';

export interface AuditFilterParams {
  tenantId?: string;
  cursor?: string | null;
  limit?: number;
  action?: string | null;
  module?: string | null;
  entity?: string | null;
  search?: string | null;
}

export function mapPrismaAuditLogToDomain(log: any): AuditLog {
  return {
    id: log.id,
    tenantId: log.tenantId,
    userId: log.userId || undefined,
    userName: log.userName,
    userRole: log.userRole,
    actorScope: log.actorScope || undefined,
    targetTenantId: log.targetTenantId || undefined,
    targetProjectId: log.targetProjectId || undefined,
    action: log.action,
    module: log.module,
    entity: log.entity,
    entityId: log.entityId,
    oldValues: log.oldValues || undefined,
    newValues: log.newValues || undefined,
    reason: log.reason || undefined,
    ipAddress: log.ipAddress || '127.0.0.1',
    timestamp: log.timestamp instanceof Date ? log.timestamp.toISOString() : String(log.timestamp),
  };
}

export class AuditRepository {
  /**
   * Retrieves paginated audit logs directly from Prisma PostgreSQL using cursor pagination.
   * Falls back to in-memory cache if Prisma is temporarily unavailable.
   */
  async findCursorPaginated(params: AuditFilterParams = {}): Promise<PaginatedResult<AuditLog>> {
    const {
      tenantId,
      cursor = null,
      limit = 20,
      action,
      module,
      entity,
      search,
    } = params;

    const safeLimit = Math.max(1, Math.min(200, limit));
    const where: any = {};
    if (tenantId) {
      where.tenantId = tenantId;
    }

    if (action && action !== 'ALL') {
      where.action = { equals: action, mode: 'insensitive' };
    }
    if (module && module !== 'ALL') {
      where.module = { equals: module, mode: 'insensitive' };
    }
    if (entity && entity !== 'ALL') {
      where.entity = { equals: entity, mode: 'insensitive' };
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { userName: { contains: q, mode: 'insensitive' } },
        { entityId: { contains: q, mode: 'insensitive' } },
        { reason: { contains: q, mode: 'insensitive' } },
        { action: { contains: q, mode: 'insensitive' } },
        { module: { contains: q, mode: 'insensitive' } },
      ];
    }

    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const queryArgs: any = {
          where,
          take: safeLimit + 1,
          orderBy: { timestamp: 'desc' },
        };

        if (cursor) {
          queryArgs.cursor = { id: cursor };
          queryArgs.skip = 1;
        }

        const rows = await (prisma as any).auditLog.findMany(queryArgs);
        const domainItems = rows.map(mapPrismaAuditLogToDomain);
        return paginateWithCursor(domainItems, cursor, safeLimit);
      } catch {
        // Fallback to cache
      }
    }

    // In-memory fallback
    const all = getHrisStore().auditLogs.filter((log) => !tenantId || log.tenantId === tenantId);
    let filtered = all;

    if (action && action !== 'ALL') {
      filtered = filtered.filter((l) => l.action.toLowerCase() === action.toLowerCase());
    }
    if (module && module !== 'ALL') {
      filtered = filtered.filter((l) => l.module.toLowerCase() === module.toLowerCase());
    }
    if (entity && entity !== 'ALL') {
      filtered = filtered.filter((l) => l.entity.toLowerCase() === entity.toLowerCase());
    }
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(
        (l) =>
          l.userName.toLowerCase().includes(q) ||
          l.entityId.toLowerCase().includes(q) ||
          (l.reason && l.reason.toLowerCase().includes(q))
      );
    }

    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return paginateWithCursor(filtered, cursor, safeLimit);
  }

  async findAll(tenantId?: string): Promise<AuditLog[]> {
    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const rows = await (prisma as any).auditLog.findMany({
          where: tenantId ? { tenantId } : undefined,
          orderBy: { timestamp: 'desc' },
        });
        return rows.map(mapPrismaAuditLogToDomain);
      } catch {
        // Fallback
      }
    }
    return getHrisStore().auditLogs.filter((l) => !tenantId || l.tenantId === tenantId);
  }

  async logAudit(
    session: UserSession,
    action: AuditLog['action'],
    module: AuditLog['module'],
    entity: string,
    entityId: string,
    details?: {
      oldValues?: any;
      newValues?: any;
      reason?: string;
      actorScope?: string;
      targetTenantId?: string;
      targetProjectId?: string;
      ipAddress?: string;
    },
    tenantId?: string
  ): Promise<AuditLog> {
    const resolvedTenantId = tenantId || session.tenantId || details?.targetTenantId;
    if (!resolvedTenantId) {
      throw new Error('[SECURITY_ERROR] Pencatatan audit log memerlukan identitas tenant yang valid.');
    }

    const memoryLog: AuditLog = {
      id: `audit-${randomUUID().slice(0, 8)}`,
      tenantId: resolvedTenantId,
      userId: session.id,
      userName: session.name,
      userRole: session.role,
      actorScope: details?.actorScope || session.scopeType,
      targetTenantId: details?.targetTenantId || session.impersonatedTenantId,
      targetProjectId: details?.targetProjectId || session.primaryProjectId,
      action,
      module,
      entity,
      entityId,
      oldValues: details?.oldValues,
      newValues: details?.newValues,
      reason: details?.reason,
      ipAddress: details?.ipAddress || '127.0.0.1',
      timestamp: new Date().toISOString(),
    };

    getHrisStore().auditLogs.unshift(memoryLog);

    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const created = await (prisma as any).auditLog.create({
          data: {
            id: memoryLog.id,
            tenantId: resolvedTenantId,
            userId: session.id,
            userName: session.name,
            userRole: session.role,
            actorScope: memoryLog.actorScope,
            targetTenantId: memoryLog.targetTenantId,
            targetProjectId: memoryLog.targetProjectId,
            action,
            module,
            entity,
            entityId,
            oldValues: details?.oldValues,
            newValues: details?.newValues,
            reason: details?.reason,
            ipAddress: memoryLog.ipAddress,
          },
        });
        return mapPrismaAuditLogToDomain(created);
      } catch {
        // Handled silently with in-memory log
      }
    }

    return memoryLog;
  }
}

export const auditRepository = new AuditRepository();
