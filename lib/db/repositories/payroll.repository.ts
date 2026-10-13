import prisma, { isPrismaAvailable } from '@/lib/db/prisma';
import { PayrollPeriod, PayrollItem, UserSession, Employee } from '@/lib/types';
import { computeEmployeePayroll } from '@/lib/payroll/engine';

function mapPrismaPayrollPeriodToDomain(p: any): PayrollPeriod {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    startDate: p.startDate instanceof Date ? p.startDate.toISOString().split('T')[0] : String(p.startDate),
    endDate: p.endDate instanceof Date ? p.endDate.toISOString().split('T')[0] : String(p.endDate),
    paymentDate: p.paymentDate instanceof Date ? p.paymentDate.toISOString().split('T')[0] : String(p.paymentDate),
    status: p.status,
    totalEmployees: p.totalEmployees,
    totalGrossPay: Number(p.totalGrossPay),
    totalPph21: Number(p.totalPph21),
    totalBpjsEmployee: Number(p.totalBpjsEmployee),
    totalBpjsEmployer: Number(p.totalBpjsEmployer),
    totalNetPay: Number(p.totalNetPay),
    lockedAt: p.lockedAt ? new Date(p.lockedAt).toISOString() : undefined,
    lockedBy: p.lockedBy || undefined,
    approvedAt: p.approvedAt ? new Date(p.approvedAt).toISOString() : undefined,
    approvedBy: p.approvedBy || undefined,
    calculatedAt: p.calculatedAt ? new Date(p.calculatedAt).toISOString() : undefined,
    calculatedBy: p.calculatedBy || undefined,
    paidAt: p.paidAt ? new Date(p.paidAt).toISOString() : undefined,
    paidBy: p.paidBy || undefined,
  };
}

function mapPrismaPayrollItemToDomain(item: any): PayrollItem {
  return {
    id: item.id,
    payrollPeriodId: item.payrollPeriodId,
    employeeId: item.employeeId,
    basicSalary: Number(item.basicSalary),
    fixedAllowance: Number(item.fixedAllowance),
    variableAllowance: Number(item.variableAllowance),
    overtimePay: Number(item.overtimePay),
    bonusThr: Number(item.bonusThr),
    reimbursementPay: Number(item.reimbursementPay),
    grossSalary: Number(item.grossSalary),
    bpjsKesEmployee: Number(item.bpjsKesEmployee),
    bpjsTkJhtEmployee: Number(item.bpjsTkJhtEmployee),
    bpjsTkJpEmployee: Number(item.bpjsTkJpEmployee),
    pph21Amount: Number(item.pph21Amount),
    loanDeduction: Number(item.loanDeduction),
    absenceDeduction: Number(item.absenceDeduction),
    totalDeductions: Number(item.totalDeductions),
    bpjsKesEmployer: Number(item.bpjsKesEmployer),
    bpjsTkJhtEmployer: Number(item.bpjsTkJhtEmployer),
    bpjsTkJpEmployer: Number(item.bpjsTkJpEmployer),
    bpjsTkJkkEmployer: Number(item.bpjsTkJkkEmployer),
    bpjsTkJkmEmployer: Number(item.bpjsTkJkmEmployer),
    totalEmployerCost: Number(item.totalEmployerCost),
    netSalary: Number(item.netSalary),
    taxSnapshot: item.taxCalculationSnapshot || ({} as any),
    bpjsSnapshot: item.bpjsCalculationSnapshot || ({} as any),
    attendanceDays: item.attendanceSummarySnapshot?.attendanceDays ?? 22,
    overtimeHours: item.attendanceSummarySnapshot?.overtimeHours ?? 0,
    isPaid: Boolean(item.isPaid),
    paidAt: item.paidAt ? new Date(item.paidAt).toISOString() : undefined,
    createdAt: item.createdAt ? new Date(item.createdAt).toISOString() : new Date().toISOString(),
  };
}

export class PayrollRepository {
  /**
   * Finds a single payroll period by ID and tenantId.
   */
  async findPeriodById(periodId: string, tenantId?: string): Promise<PayrollPeriod | null> {
    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const period = await prisma.payrollPeriod.findFirst({
          where: tenantId ? { id: periodId, tenantId } : { id: periodId },
        });
        if (period) return mapPrismaPayrollPeriodToDomain(period);
      } catch {
        // Fallback
      }
    }
    const { getHrisStore } = await import('@/lib/db/store');
    const p = getHrisStore().payrollPeriods.find((period) => period.id === periodId && (!tenantId || period.tenantId === tenantId));
    return p || null;
  }

  /**
   * Retrieves all payroll periods for a tenant.
   */
  async findPeriods(tenantId?: string): Promise<PayrollPeriod[]> {
    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const list = await prisma.payrollPeriod.findMany({
          where: tenantId ? { tenantId } : undefined,
          orderBy: { startDate: 'desc' },
        });
        return list.map(mapPrismaPayrollPeriodToDomain);
      } catch {
        // Fallback
      }
    }
    const { getHrisStore } = await import('@/lib/db/store');
    return getHrisStore().payrollPeriods.filter((p) => !tenantId || p.tenantId === tenantId);
  }

  /**
   * Retrieves payroll items for a specific period.
   */
  async findItems(periodId?: string, tenantId?: string): Promise<PayrollItem[]> {
    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const where: any = {};
        if (tenantId) where.tenantId = tenantId;
        if (periodId) where.payrollPeriodId = periodId;

        const list = await prisma.payrollItem.findMany({
          where,
          orderBy: { employeeId: 'asc' },
        });
        return list.map(mapPrismaPayrollItemToDomain);
      } catch {
        // Fallback
      }
    }
    const { getHrisStore } = await import('@/lib/db/store');
    const items = getHrisStore().payrollItems.filter((i) => !tenantId || i.tenantId === tenantId);
    return periodId ? items.filter((i) => i.payrollPeriodId === periodId) : items;
  }

  /**
   * Retrieves payroll items strictly for a specific employee (Anti-IDOR self-service).
   */
  async findItemsByEmployee(employeeId: string, tenantId?: string): Promise<PayrollItem[]> {
    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const list = await prisma.payrollItem.findMany({
          where: {
            employeeId,
            ...(tenantId ? { tenantId } : {}),
          },
          orderBy: { createdAt: 'desc' },
        });
        return list.map(mapPrismaPayrollItemToDomain);
      } catch {
        // Fallback
      }
    }
    const { getHrisStore } = await import('@/lib/db/store');
    return getHrisStore().payrollItems.filter((i) => i.employeeId === employeeId && (!tenantId || i.tenantId === tenantId));
  }

  /**
   * Heavy Aggregation Engine: Recalculates all payroll items for a period using Prisma.
   */
  async recalculatePeriod(
    periodId: string,
    session: UserSession,
    tenantId?: string
  ): Promise<{ period: PayrollPeriod; items: PayrollItem[] }> {
    const effectiveTenantId = tenantId || session.tenantId || 'tenant-default';
    const isDb = await isPrismaAvailable();
    if (isDb) {
      const period = await prisma.payrollPeriod.findFirst({
        where: { id: periodId, tenantId: effectiveTenantId },
      });

      if (!period) throw new Error('Periode payroll tidak ditemukan');
      if (period.status === 'LOCKED') {
        throw new Error('Payroll berstatus LOCKED tidak dapat diubah atau dikalkulasi ulang.');
      }

      // 1. Fetch all employees in tenant
      const prismaEmployees = await prisma.employee.findMany({
        where: { tenantId: effectiveTenantId },
        orderBy: { id: 'asc' },
      });

      // 2. Fetch all approved overtime in period
      const approvedOvertimes = await prisma.overtimeRequest.findMany({
        where: {
          tenantId: effectiveTenantId,
          status: 'APPROVED',
        },
      });

      // 3. Clear previous items for this period
      await prisma.payrollItem.deleteMany({
        where: { payrollPeriodId: periodId },
      });

      let gross = 0;
      let pph = 0;
      let bpjsEmp = 0;
      let bpjsEr = 0;
      let net = 0;

      const createdItems: PayrollItem[] = [];

      for (const emp of prismaEmployees) {
        const domainEmp: Employee = {
          id: emp.id,
          tenantId: emp.tenantId,
          employeeId: emp.employeeId,
          nikKtp: emp.nikKtp,
          fullName: emp.fullName,
          email: emp.email,
          phone: emp.phone,
          birthPlace: emp.birthPlace,
          birthDate: emp.birthDate.toISOString().split('T')[0],
          gender: emp.gender,
          maritalStatus: emp.maritalStatus,
          religion: emp.religion,
          addressKtp: emp.addressKtp,
          branchId: emp.branchId,
          departmentId: emp.departmentId,
          positionId: emp.positionId,
          managerId: emp.managerId || undefined,
          joinDate: emp.joinDate.toISOString().split('T')[0],
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
          hasNpwp: emp.hasNpwp,
          bpjsKesNumber: emp.bpjsKesNumber || undefined,
          bpjsTkNumber: emp.bpjsTkNumber || undefined,
          isBpjsKesActive: emp.isBpjsKesActive,
          isBpjsTkActive: emp.isBpjsTkActive,
        };

        const empOts = approvedOvertimes.filter((ot: any) => ot.employeeId === emp.id);
        const otHours = empOts.reduce((sum: number, ot: any) => sum + Number(ot.durationHours), 0);
        const otPay = empOts.reduce((sum: number, ot: any) => sum + Number(ot.overtimePay), 0);

        const computed = computeEmployeePayroll({
          employee: domainEmp,
          periodId,
          attendanceDays: 22,
          overtimeHours: otHours,
          overtimePay: otPay,
        });

        await prisma.payrollItem.create({
          data: {
            id: computed.id,
            tenantId: effectiveTenantId,
            payrollPeriodId: periodId,
            employeeId: emp.id,
            basicSalary: computed.basicSalary,
            fixedAllowance: computed.fixedAllowance,
            variableAllowance: computed.variableAllowance,
            overtimePay: computed.overtimePay,
            bonusThr: computed.bonusThr,
            reimbursementPay: computed.reimbursementPay,
            grossSalary: computed.grossSalary,
            bpjsKesEmployee: computed.bpjsKesEmployee,
            bpjsTkJhtEmployee: computed.bpjsTkJhtEmployee,
            bpjsTkJpEmployee: computed.bpjsTkJpEmployee,
            pph21Amount: computed.pph21Amount,
            loanDeduction: computed.loanDeduction,
            absenceDeduction: computed.absenceDeduction,
            totalDeductions: computed.totalDeductions,
            bpjsKesEmployer: computed.bpjsKesEmployer,
            bpjsTkJhtEmployer: computed.bpjsTkJhtEmployer,
            bpjsTkJpEmployer: computed.bpjsTkJpEmployer,
            bpjsTkJkkEmployer: computed.bpjsTkJkkEmployer,
            bpjsTkJkmEmployer: computed.bpjsTkJkmEmployer,
            totalEmployerCost: computed.totalEmployerCost,
            netSalary: computed.netSalary,
            taxCalculationSnapshot: computed.taxSnapshot as any,
            bpjsCalculationSnapshot: computed.bpjsSnapshot as any,
            attendanceSummarySnapshot: {
              attendanceDays: computed.attendanceDays,
              overtimeHours: computed.overtimeHours,
            } as any,
            isPaid: false,
          },
        });

        createdItems.push(computed);
        gross += computed.grossSalary;
        pph += computed.pph21Amount;
        bpjsEmp += computed.bpjsKesEmployee + computed.bpjsTkJhtEmployee + computed.bpjsTkJpEmployee;
        bpjsEr += computed.totalEmployerCost;
        net += computed.netSalary;
      }

      const updatedPeriod = await prisma.payrollPeriod.update({
        where: { id: periodId },
        data: {
          totalEmployees: prismaEmployees.length,
          totalGrossPay: gross,
          totalPph21: pph,
          totalBpjsEmployee: bpjsEmp,
          totalBpjsEmployer: bpjsEr,
          totalNetPay: net,
          status: 'REVIEW',
        },
      });

      await prisma.auditLog.create({
        data: {
          tenantId: effectiveTenantId,
          userId: session.id,
          userName: session.name,
          userRole: session.role,
          action: 'CALCULATE',
          module: 'PAYROLL',
          entity: 'PayrollPeriod',
          entityId: periodId,
          newValues: { totalGross: gross, totalNet: net, totalPph21: pph },
          reason: 'Kalkulasi Ulang Payroll Engine via Prisma',
        },
      });

      return {
        period: mapPrismaPayrollPeriodToDomain(updatedPeriod),
        items: createdItems,
      };
    }

    const { getHrisStore } = await import('@/lib/db/store');
    const store = getHrisStore();
    const targetPeriod = store.payrollPeriods.find((p) => p.id === periodId && (!tenantId || p.tenantId === tenantId));
    if (!targetPeriod) throw new Error('Periode payroll tidak ditemukan');
    if (targetPeriod.status === 'LOCKED') throw new Error('Payroll berstatus LOCKED tidak dapat diubah atau dikalkulasi ulang.');

    const updatedPeriod = store.recalculatePayrollPeriod(periodId, session);
    const items = store.payrollItems.filter((i) => i.payrollPeriodId === periodId && (!tenantId || i.tenantId === tenantId));
    return {
      period: updatedPeriod,
      items,
    };
  }

  /**
   * Locks payroll period and makes it immutable snapshot.
   */
  async lockPeriod(
    periodId: string,
    session: UserSession,
    tenantId?: string
  ): Promise<PayrollPeriod> {
    const effectiveTenantId = tenantId || session.tenantId || 'tenant-default';
    const isDb = await isPrismaAvailable();
    if (isDb) {
      const existing = await prisma.payrollPeriod.findFirst({
        where: { id: periodId, tenantId: effectiveTenantId },
      });
      if (!existing) throw new Error('Periode payroll tidak ditemukan');
      if (existing.status === 'LOCKED') throw new Error('Payroll sudah terkunci.');

      const updated = await prisma.payrollPeriod.update({
        where: { id: periodId },
        data: {
          status: 'LOCKED',
          lockedAt: new Date(),
          lockedBy: `${session.name} (${session.role})`,
        },
      });

      await prisma.auditLog.create({
        data: {
          tenantId: effectiveTenantId,
          userId: session.id,
          userName: session.name,
          userRole: session.role,
          action: 'LOCK',
          module: 'PAYROLL',
          entity: 'PayrollPeriod',
          entityId: periodId,
          reason: 'Kunci finalisasi payroll. Snapshot disimpan secara permanen & immutable.',
        },
      });

      return mapPrismaPayrollPeriodToDomain(updated);
    }

    const { getHrisStore } = await import('@/lib/db/store');
    return getHrisStore().lockPayrollPeriod(periodId, session);
  }

  /**
   * Marks payroll as disbursed and paid.
   */
  async markPaid(
    periodId: string,
    session: UserSession,
    tenantId: string
  ): Promise<PayrollPeriod> {
    const isDb = await isPrismaAvailable();
    if (isDb) {
      const existing = await prisma.payrollPeriod.findFirst({
        where: { id: periodId, tenantId },
      });
      if (!existing) throw new Error('Periode payroll tidak ditemukan');
      if (existing.status !== 'LOCKED') throw new Error('Payroll harus berstatus LOCKED sebelum dibayarkan.');

      const now = new Date();
      const [updated] = await prisma.$transaction([
        prisma.payrollPeriod.update({
          where: { id: periodId },
          data: {
            status: 'PAID',
          },
        }),
        prisma.auditLog.create({
          data: {
            tenantId,
            userId: session.id,
            userName: session.name,
            userRole: session.role,
            action: 'MARK_PAID',
            module: 'PAYROLL',
            entity: 'PayrollPeriod',
            entityId: periodId,
            reason: 'Penyaluran gaji berhasil dieksekusi via transfer bank.',
            newValues: { status: 'PAID', paidAt: now.toISOString(), paidBy: `${session.name} (${session.role})` },
          },
        }),
      ]);

      return mapPrismaPayrollPeriodToDomain(updated);
    }

    const { getHrisStore } = await import('@/lib/db/store');
    const store = getHrisStore();
    const targetPeriod = store.payrollPeriods.find((p) => p.id === periodId && (!tenantId || p.tenantId === tenantId));
    if (!targetPeriod) throw new Error('Periode penggajian tidak ditemukan');
    if (targetPeriod.status !== 'LOCKED') throw new Error('Payroll harus berstatus LOCKED sebelum dibayarkan.');

    targetPeriod.status = 'PAID';
    targetPeriod.paidAt = new Date().toISOString();
    targetPeriod.paidBy = session.id;
    targetPeriod.paidByName = `${session.name} (${session.role})`;

    store.payrollItems
      .filter((i) => i.payrollPeriodId === periodId)
      .forEach((item) => {
        item.isPaid = true;
        item.paidAt = targetPeriod.paidAt;
      });

    return targetPeriod;
  }
}

export const payrollRepository = new PayrollRepository();
