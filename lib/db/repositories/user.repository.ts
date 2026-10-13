import prisma, { isPrismaAvailable } from '@/lib/db/prisma';
import { UserRole, ScopeType } from '@/lib/types';
import { SecurityActor } from '@/lib/security/authorization';

export interface DbUserRecord {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  tenantId?: string | null;
  employeeId?: string | null;
  projectIds?: string[];
  scopeType: ScopeType;
}

export class UserRepository {
  /**
   * Resolves a trusted SecurityActor from a verified userId.
   * STRICT SECURITY RULES:
   * 1. Identity must exist in the authoritative database / identity store.
   * 2. Active status must be true.
   * 3. Role must strictly be one of: SUPERADMIN, ADMIN_PT, ADMIN_PROJECT, EMPLOYEE.
   * 4. Scope and tenant/project boundaries are server-derived, never client-controlled.
   */
  async findSecurityActorById(userId: string): Promise<SecurityActor | null> {
    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      return null;
    }

    const cleanUserId = userId.trim();
    const isDb = await isPrismaAvailable();

    if (isDb) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: cleanUserId },
          include: {
            employee: { select: { id: true, tenantId: true } },
            scopes: true,
          },
        });

        if (!user || !user.isActive) {
          return null;
        }

        // Validate role is strictly the canonical 4-role enum
        const role = user.role as UserRole;
        if (role !== 'SUPERADMIN' && role !== 'ADMIN_PT' && role !== 'ADMIN_PROJECT' && role !== 'EMPLOYEE') {
          throw new Error(`[SECURITY_VIOLATION] User ${user.id} has invalid/deprecated authorization role: ${user.role}`);
        }

        // Derive scope type
        let scopeType: ScopeType = 'TENANT';
        if (role === 'SUPERADMIN') {
          scopeType = 'PLATFORM_GLOBAL';
        } else if (role === 'ADMIN_PT') {
          scopeType = 'TENANT';
        } else if (role === 'ADMIN_PROJECT') {
          scopeType = 'PROJECT';
        } else if (role === 'EMPLOYEE') {
          scopeType = 'SELF';
        }

        // Project IDs from scopes
        const projectIds: string[] = [];
        if (user.scopes && user.scopes.length > 0) {
          for (const s of user.scopes) {
            if (Array.isArray(s.projectIds)) {
              projectIds.push(...(s.projectIds as string[]));
            }
          }
        }

        const effectiveTenantId = user.tenantId || user.employee?.tenantId || undefined;

        // Non-platform roles MUST be bound to a tenant
        if (role !== 'SUPERADMIN' && !effectiveTenantId) {
          throw new Error(`[SECURITY_VIOLATION] Non-superadmin user ${user.id} is missing tenant binding.`);
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role,
          scopeType,
          tenantId: effectiveTenantId,
          employeeId: user.employee?.id,
          projectIds: projectIds.length > 0 ? Array.from(new Set(projectIds)) : undefined,
        };
      } catch (err: unknown) {
        if ((err as Error).message.includes('SECURITY_VIOLATION')) {
          throw err;
        }
        // Fall back to memory identity store if database error
      }
    }

    // In-memory identity registry fallback for development / seed ONLY
    const isProduction = process.env.AUTH_MODE === 'production' || process.env.NODE_ENV === 'production';
    if (isProduction) {
      // Production mode MUST strictly require a valid database user account
      return null;
    }

    const { DEMO_USERS } = await import('@/lib/auth/session');
    const demoUser = DEMO_USERS.find((u) => u.id === cleanUserId);

    if (!demoUser) {
      return null;
    }

    // Validate role
    const role = demoUser.role as UserRole;
    if (role !== 'SUPERADMIN' && role !== 'ADMIN_PT' && role !== 'ADMIN_PROJECT' && role !== 'EMPLOYEE') {
      throw new Error(`[SECURITY_VIOLATION] Demo user ${demoUser.id} has invalid authorization role.`);
    }

    return {
      id: demoUser.id,
      email: demoUser.email,
      name: demoUser.name,
      role,
      scopeType: demoUser.scopeType,
      tenantId: demoUser.tenantId,
      employeeId: demoUser.employeeId,
      projectIds: demoUser.projectIds,
    };
  }
}

export const userRepository = new UserRepository();
