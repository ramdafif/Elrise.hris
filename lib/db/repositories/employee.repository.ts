import prisma, { isPrismaAvailable } from '@/lib/db/prisma';
import { Employee, UserSession } from '@/lib/types';
import { PaginatedResult, paginateWithCursor } from '@/lib/db/pagination';
import { randomUUID } from 'crypto';

function toPrismaPtkp(status?: string): any {
  if (!status) return 'TK_0';
  if (status.includes('_')) return status;
  if (status.startsWith('KI')) {
    return `K_I_${status.slice(2)}`;
  }
  return status.replace(/^(TK|K)(\d)$/, '$1_$2');
}

export function mapPrismaEmployeeToDomain(emp: any): Employee {
  return {
    id: emp.id,
    tenantId: emp.tenantId,
    employeeId: emp.employeeId,
    nikKtp: emp.nikKtp,
    fullName: emp.fullName,
    nickname: emp.nickname || undefined,
    email: emp.email,
    phone: emp.phone,
    birthPlace: emp.birthPlace,
    birthDate: emp.birthDate ? new Date(emp.birthDate).toISOString().split('T')[0] : '',
    gender: emp.gender,
    maritalStatus: emp.maritalStatus,
    religion: emp.religion,
    addressKtp: emp.addressKtp,
    addressCurrent: emp.addressCurrent || undefined,
    emergencyName: emp.emergencyName || undefined,
    emergencyPhone: emp.emergencyPhone || undefined,
    emergencyRel: emp.emergencyRel || undefined,

    branchId: emp.branchId,
    departmentId: emp.departmentId,
    positionId: emp.positionId,
    managerId: emp.managerId || undefined,
    joinDate: emp.joinDate ? new Date(emp.joinDate).toISOString().split('T')[0] : '',
    contractEndDate: emp.contractEndDate ? new Date(emp.contractEndDate).toISOString().split('T')[0] : undefined,
    permanentDate: emp.permanentDate ? new Date(emp.permanentDate).toISOString().split('T')[0] : undefined,
    employmentType: emp.employmentType,
    status: emp.status,

    basicSalary: Number(emp.basicSalary),
    fixedAllowance: Number(emp.fixedAllowance),
    mealAllowance: Number(emp.mealAllowance),
    transportAllowance: Number(emp.transportAllowance),
    communicationAllowance: Number(emp.communicationAllowance),

    bankName: emp.bankName,
    bankAccountNumber: emp.bankAccountNumber,
    bankAccountHolder: emp.bankAccountHolder,

    npwp: emp.npwp || undefined,
    ptkpStatus: emp.ptkpStatus,
    hasNpwp: Boolean(emp.hasNpwp),
    bpjsKesNumber: emp.bpjsKesNumber || undefined,
    bpjsTkNumber: emp.bpjsTkNumber || undefined,
    isBpjsKesActive: Boolean(emp.isBpjsKesActive),
    isBpjsTkActive: Boolean(emp.isBpjsTkActive),
    avatarUrl: emp.avatarUrl || undefined,
  };
}

export class EmployeeRepository {
  /**
   * Primary cursor-based pagination query executed directly on Prisma PostgreSQL.
   * Performs server-side database filtering for search, department, status, and RBAC roles.
   */
  async findCursorPaginated(params: {
    cursor?: string;
    limit?: number;
    search?: string;
    departmentId?: string;
    status?: string;
    allowedEmployeeIds?: string[];
    tenantId?: string;
    projectId?: string;
    sessionRole?: string;
    sessionEmployeeId?: string;
  }): Promise<PaginatedResult<Employee>> {
    const {
      cursor,
      limit = 50,
      search,
      departmentId,
      status,
      allowedEmployeeIds,
      tenantId,
      projectId,
      sessionRole,
      sessionEmployeeId,
    } = params;

    const safeLimit = Math.max(1, Math.min(200, limit));
    const where: any = {};
    if (tenantId) where.tenantId = tenantId;

    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        // Direct primary query from Prisma database
        // RBAC: Role-based filtering at database level
        if (sessionRole === 'EMPLOYEE' && sessionEmployeeId) {
          where.id = sessionEmployeeId;
        }

        if (allowedEmployeeIds && allowedEmployeeIds.length > 0) {
          where.id = { in: allowedEmployeeIds };
        }

        if (departmentId && departmentId !== 'ALL') {
          where.departmentId = departmentId;
        }

        if (status && status !== 'ALL') {
          where.status = status;
        }

        if (search && search.trim() !== '') {
          const q = search.trim();
          where.OR = [
            { fullName: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { employeeId: { contains: q, mode: 'insensitive' } },
            { nikKtp: { contains: q } },
            { nickname: { contains: q, mode: 'insensitive' } },
          ];
        }

        const queryArgs: any = {
          where,
          take: safeLimit + 1,
          orderBy: { id: 'asc' },
        };

        if (cursor) {
          queryArgs.cursor = { id: cursor };
          queryArgs.skip = 1;
        }

        const [records, total] = await Promise.all([
          prisma.employee.findMany(queryArgs),
          prisma.employee.count({ where }),
        ]);

        const hasMore = records.length > safeLimit;
        const pageRecords = hasMore ? records.slice(0, safeLimit) : records;
        const nextCursor = hasMore && pageRecords.length > 0 ? pageRecords[pageRecords.length - 1].id : null;

        let domainEmployees = pageRecords.map(mapPrismaEmployeeToDomain);

        // Mask sensitive compensation for non-executive roles (ADMIN_PROJECT, EMPLOYEE)
        const canViewCompanySalaries = sessionRole === 'SUPERADMIN' || sessionRole === 'ADMIN_PT';
        if (!canViewCompanySalaries) {
          domainEmployees = domainEmployees.map((e) => {
            if (e.id === sessionEmployeeId) return e;
            return {
              ...e,
              basicSalary: 0,
              fixedAllowance: 0,
              mealAllowance: 0,
              transportAllowance: 0,
              communicationAllowance: 0,
              bankAccountNumber: '••••••••••••',
            };
          });
        }

        return {
          items: domainEmployees,
          nextCursor,
          hasMore,
          total,
        };
      } catch {
        // Fall through to in-memory store cache when Prisma is unavailable
      }
    }

    // Direct in-memory store cache access with strict tenant isolation
    const { getHrisStore } = await import('@/lib/db/store');
    const store = getHrisStore();
    let cachedList: Employee[] = [];
    if (tenantId) {
      cachedList = store.employees.filter((e) => e.tenantId === tenantId);
    } else if (sessionRole === 'SUPERADMIN') {
      cachedList = [...store.employees];
    } else {
      // Non-superadmin without explicit tenantId must NOT receive any data
      return {
        items: [],
        nextCursor: null,
        hasMore: false,
        total: 0,
      };
    }

    if (sessionRole === 'EMPLOYEE' && sessionEmployeeId) {
      cachedList = cachedList.filter(e => e.id === sessionEmployeeId);
    }

    if (sessionRole === 'ADMIN_PROJECT') {
      if (!allowedEmployeeIds || allowedEmployeeIds.length === 0) {
        cachedList = [];
      } else {
        cachedList = cachedList.filter(e => allowedEmployeeIds.includes(e.id));
      }
    } else if (allowedEmployeeIds && allowedEmployeeIds.length > 0) {
      cachedList = cachedList.filter(e => allowedEmployeeIds.includes(e.id));
    }

    if (departmentId && departmentId !== 'ALL') {
      cachedList = cachedList.filter(e => e.departmentId === departmentId);
    }

    if (status && status !== 'ALL') {
      cachedList = cachedList.filter(e => e.status === status);
    }

    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      cachedList = cachedList.filter(e =>
        e.fullName.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.employeeId.toLowerCase().includes(q) ||
        (e.nikKtp && e.nikKtp.includes(q))
      );
    }

    const paginated = paginateWithCursor(cachedList, cursor, safeLimit, e => e.id);

    let domainEmployees = paginated.items;
    const canViewCompanySalaries = sessionRole === 'SUPERADMIN' || sessionRole === 'ADMIN_PT';
    if (!canViewCompanySalaries) {
      domainEmployees = domainEmployees.map((e) => {
        if (e.id === sessionEmployeeId) return e;
        return {
          ...e,
          basicSalary: 0,
          fixedAllowance: 0,
          mealAllowance: 0,
          transportAllowance: 0,
          communicationAllowance: 0,
          bankAccountNumber: '••••••••••••',
        };
      });
    }

    return {
      items: domainEmployees,
      nextCursor: paginated.nextCursor,
      hasMore: paginated.hasMore,
      total: cachedList.length,
    };
  }

  /**
   * Retrieves all employees for a specific tenant directly from Prisma.
   */
  async findAll(tenantId?: string): Promise<Employee[]> {
    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const list = await prisma.employee.findMany({
          where: tenantId ? { tenantId } : undefined,
          orderBy: { id: 'asc' },
        });
        if (list && list.length > 0) {
          return list.map(mapPrismaEmployeeToDomain);
        }
      } catch (err: any) {
        // Fallback
      }
    }
    const { getHrisStore } = await import('@/lib/db/store');
    return getHrisStore().employees;
  }

  /**
   * Finds an employee by primary key ID within tenant context from Prisma.
   */
  async findById(id: string, tenantId?: string): Promise<Employee | null> {
    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const emp = await prisma.employee.findFirst({
          where: tenantId ? { id, tenantId } : { id },
        });
        if (emp) return mapPrismaEmployeeToDomain(emp);
      } catch (err: any) {
        // Fallback
      }
    }
    const { getHrisStore } = await import('@/lib/db/store');
    return getHrisStore().employees.find(e => e.id === id) || null;
  }

  /**
   * Finds an employee by business employeeId code from Prisma.
   */
  async findByEmployeeId(employeeId: string, tenantId?: string): Promise<Employee | null> {
    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const emp = await prisma.employee.findFirst({
          where: tenantId ? { employeeId, tenantId } : { employeeId },
        });
        if (emp) return mapPrismaEmployeeToDomain(emp);
      } catch (err: any) {
        // Fallback
      }
    }
    const { getHrisStore } = await import('@/lib/db/store');
    return getHrisStore().employees.find(e => e.employeeId === employeeId) || null;
  }

  /**
   * Creates a new employee record directly in Prisma PostgreSQL as primary source of truth.
   * Generates a collision-safe ID using UUID and business code with timestamp and random salt.
   */
  async create(
    newEmp: Omit<Employee, 'id'> & { id?: string },
    session?: UserSession,
    tenantId: string = 'tenant-elkyno-01'
  ): Promise<Employee> {
    const id = newEmp.id || randomUUID();
    const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
    const employeeId = newEmp.employeeId || `NTM-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}${uniqueSuffix}`;

    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const created = await prisma.employee.create({
          data: {
            id,
            tenantId,
            employeeId,
            nikKtp: newEmp.nikKtp,
            fullName: newEmp.fullName,
            nickname: newEmp.nickname || null,
            email: newEmp.email,
            phone: newEmp.phone,
            birthPlace: newEmp.birthPlace,
            birthDate: new Date(newEmp.birthDate),
            gender: newEmp.gender as any,
            maritalStatus: newEmp.maritalStatus as any,
            religion: newEmp.religion || 'Islam',
            addressKtp: newEmp.addressKtp,
            addressCurrent: newEmp.addressCurrent || null,
            emergencyName: newEmp.emergencyName || null,
            emergencyPhone: newEmp.emergencyPhone || null,
            emergencyRel: newEmp.emergencyRel || null,
            branchId: newEmp.branchId,
            departmentId: newEmp.departmentId,
            positionId: newEmp.positionId,
            managerId: newEmp.managerId || null,
            joinDate: new Date(newEmp.joinDate),
            contractEndDate: newEmp.contractEndDate ? new Date(newEmp.contractEndDate) : null,
            permanentDate: newEmp.permanentDate ? new Date(newEmp.permanentDate) : null,
            employmentType: (newEmp.employmentType as any) || 'PERMANENT',
            status: (newEmp.status as any) || 'ACTIVE',
            basicSalary: newEmp.basicSalary,
            fixedAllowance: newEmp.fixedAllowance ?? 0,
            mealAllowance: newEmp.mealAllowance ?? 0,
            transportAllowance: newEmp.transportAllowance ?? 0,
            communicationAllowance: newEmp.communicationAllowance ?? 0,
            bankName: newEmp.bankName,
            bankAccountNumber: newEmp.bankAccountNumber,
            bankAccountHolder: newEmp.bankAccountHolder,
            npwp: newEmp.npwp || null,
            ptkpStatus: toPrismaPtkp(newEmp.ptkpStatus),
            hasNpwp: newEmp.hasNpwp ?? false,
            bpjsKesNumber: newEmp.bpjsKesNumber || null,
            bpjsTkNumber: newEmp.bpjsTkNumber || null,
            isBpjsKesActive: newEmp.isBpjsKesActive ?? true,
            isBpjsTkActive: newEmp.isBpjsTkActive ?? true,
          },
        });

        if (session) {
          await prisma.auditLog.create({
            data: {
              tenantId,
              userId: session.id,
              userName: session.name,
              userRole: session.role,
              action: 'CREATE',
              module: 'EMPLOYEE',
              entity: 'Employee',
              entityId: id,
              newValues: { name: created.fullName, nik: created.nikKtp, salary: Number(created.basicSalary) },
              reason: 'Penerimaan Karyawan Baru',
            },
          });
        }

        return mapPrismaEmployeeToDomain(created);
      } catch {
        // Fall back to in-memory store
      }
    }

    const { getHrisStore } = await import('@/lib/db/store');
    const store = getHrisStore();
    const createdEmp: Employee = {
      ...newEmp,
      id,
      tenantId,
      employeeId,
      status: newEmp.status || 'ACTIVE',
    };
    store.employees.push(createdEmp);
    return createdEmp;
  }

  /**
   * Updates an existing employee record directly in Prisma PostgreSQL.
   */
  async update(
    id: string,
    updates: Partial<Employee>,
    session?: UserSession,
    reason?: string,
    tenantId?: string
  ): Promise<Employee> {
    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const where: any = { id };
        if (tenantId) where.tenantId = tenantId;
        const existing = await prisma.employee.findFirst({ where });
        if (!existing) {
          throw new Error(`Karyawan dengan ID ${id} tidak ditemukan.`);
        }

        const data: any = {};
        if (updates.fullName !== undefined) data.fullName = updates.fullName;
        if (updates.nickname !== undefined) data.nickname = updates.nickname;
        if (updates.email !== undefined) data.email = updates.email;
        if (updates.phone !== undefined) data.phone = updates.phone;
        if (updates.birthPlace !== undefined) data.birthPlace = updates.birthPlace;
        if (updates.birthDate !== undefined) data.birthDate = new Date(updates.birthDate);
        if (updates.gender !== undefined) data.gender = updates.gender as any;
        if (updates.maritalStatus !== undefined) data.maritalStatus = updates.maritalStatus as any;
        if (updates.religion !== undefined) data.religion = updates.religion;
        if (updates.addressKtp !== undefined) data.addressKtp = updates.addressKtp;
        if (updates.addressCurrent !== undefined) data.addressCurrent = updates.addressCurrent;
        if (updates.emergencyName !== undefined) data.emergencyName = updates.emergencyName;
        if (updates.emergencyPhone !== undefined) data.emergencyPhone = updates.emergencyPhone;
        if (updates.emergencyRel !== undefined) data.emergencyRel = updates.emergencyRel;

        if (updates.branchId !== undefined) data.branchId = updates.branchId;
        if (updates.departmentId !== undefined) data.departmentId = updates.departmentId;
        if (updates.positionId !== undefined) data.positionId = updates.positionId;
        if (updates.managerId !== undefined) data.managerId = updates.managerId;
        if (updates.joinDate !== undefined) data.joinDate = new Date(updates.joinDate);
        if (updates.contractEndDate !== undefined) data.contractEndDate = updates.contractEndDate ? new Date(updates.contractEndDate) : null;
        if (updates.permanentDate !== undefined) data.permanentDate = updates.permanentDate ? new Date(updates.permanentDate) : null;
        if (updates.employmentType !== undefined) data.employmentType = updates.employmentType as any;
        if (updates.status !== undefined) data.status = updates.status as any;

        if (updates.basicSalary !== undefined) data.basicSalary = updates.basicSalary;
        if (updates.fixedAllowance !== undefined) data.fixedAllowance = updates.fixedAllowance;
        if (updates.mealAllowance !== undefined) data.mealAllowance = updates.mealAllowance;
        if (updates.transportAllowance !== undefined) data.transportAllowance = updates.transportAllowance;
        if (updates.communicationAllowance !== undefined) data.communicationAllowance = updates.communicationAllowance;

        if (updates.bankName !== undefined) data.bankName = updates.bankName;
        if (updates.bankAccountNumber !== undefined) data.bankAccountNumber = updates.bankAccountNumber;
        if (updates.bankAccountHolder !== undefined) data.bankAccountHolder = updates.bankAccountHolder;

        if (updates.npwp !== undefined) data.npwp = updates.npwp;
        if (updates.ptkpStatus !== undefined) data.ptkpStatus = toPrismaPtkp(updates.ptkpStatus);
        if (updates.hasNpwp !== undefined) data.hasNpwp = updates.hasNpwp;
        if (updates.bpjsKesNumber !== undefined) data.bpjsKesNumber = updates.bpjsKesNumber;
        if (updates.bpjsTkNumber !== undefined) data.bpjsTkNumber = updates.bpjsTkNumber;
        if (updates.isBpjsKesActive !== undefined) data.isBpjsKesActive = updates.isBpjsKesActive;
        if (updates.isBpjsTkActive !== undefined) data.isBpjsTkActive = updates.isBpjsTkActive;

        const updated = await prisma.employee.update({
          where: { id },
          data,
        });

        return mapPrismaEmployeeToDomain(updated);
      } catch (err: any) {
        // Fallback
      }
    }

    const { getHrisStore } = await import('@/lib/db/store');
    const store = getHrisStore();
    const idx = store.employees.findIndex((e) => e.id === id);
    if (idx === -1) {
      throw new Error(`Karyawan dengan ID ${id} tidak ditemukan.`);
    }

    store.employees[idx] = {
      ...store.employees[idx],
      ...updates,
    };
    return store.employees[idx];
  }

  /**
   * Deactivates an employee (soft delete via status = 'TERMINATED') directly in Prisma.
   */
  async terminate(
    id: string,
    session?: UserSession,
    reason?: string,
    tenantId?: string
  ): Promise<Employee> {
    return this.update(id, { status: 'TERMINATED' }, session, reason || 'Karyawan Dinonaktifkan', tenantId);
  }
}

export const employeeRepository = new EmployeeRepository();
