import prisma, { isPrismaAvailable } from '@/lib/db/prisma';
import {
  Company,
  Branch,
  Department,
  Position,
  Holiday,
  GovernmentRegulation,
  Reimbursement,
  EmployeeLoan,
  EmployeeDocument,
  KpiReview,
} from '@/lib/types';
import { getHrisStore } from '../store';

export class OrganizationRepository {
  async getCompany(tenantId?: string): Promise<Company | null> {
    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const comp = await prisma.company.findFirst({
          where: tenantId ? { tenantId } : undefined,
        });
        if (comp) {
          return {
            id: comp.id,
            tenantId: comp.tenantId,
            name: comp.name,
            legalName: comp.legalName,
            taxId: comp.taxId,
            nib: comp.nib,
            bpjsKesCompanyId: comp.bpjsKesCompanyId,
            bpjsTkCompanyId: comp.bpjsTkCompanyId,
            address: comp.address,
            city: comp.city,
            postalCode: comp.postalCode,
            phone: comp.phone,
            email: comp.email,
            website: comp.website || '',
            bankName: comp.bankName,
            bankAccountNumber: comp.bankAccountNumber,
            bankAccountHolder: comp.bankAccountHolder,
          };
        }
      } catch {
        // Fallback
      }
    }
    return getHrisStore().company;
  }

  async getBranches(tenantId?: string): Promise<Branch[]> {
    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const list = await prisma.branch.findMany({
          where: tenantId ? { tenantId } : undefined,
          orderBy: { code: 'asc' },
        });
        if (list && list.length > 0) {
          return list.map((b: any) => ({
            id: b.id,
            code: b.code,
            name: b.name,
            address: b.address,
            city: b.city,
            umrAmount: Number(b.umrAmount),
            latitude: Number(b.latitude),
            longitude: Number(b.longitude),
            radiusMeters: b.radiusMeters,
            workStartTime: b.workStartTime || '08:30',
            workEndTime: b.workEndTime || '17:00',
          }));
        }
      } catch {
        // Fallback
      }
    }
    return getHrisStore().branches;
  }

  async getDepartments(tenantId?: string): Promise<Department[]> {
    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const list = await prisma.department.findMany({
          where: tenantId ? { tenantId } : undefined,
          orderBy: { code: 'asc' },
        });
        if (list && list.length > 0) {
          return list.map((d: any) => ({
            id: d.id,
            code: d.code,
            name: d.name,
            description: d.description || undefined,
            costCenter: d.costCenter,
          }));
        }
      } catch {
        // Fallback
      }
    }
    return getHrisStore().departments;
  }

  async getPositions(tenantId?: string): Promise<Position[]> {
    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const list = await prisma.position.findMany({
          where: tenantId ? { tenantId } : undefined,
          orderBy: { code: 'asc' },
        });
        if (list && list.length > 0) {
          return list.map((p: any) => ({
            id: p.id,
            departmentId: p.departmentId,
            code: p.code,
            title: p.title,
            level: p.level,
            baseSalaryMin: Number(p.baseSalaryMin),
            baseSalaryMax: Number(p.baseSalaryMax),
          }));
        }
      } catch {
        // Fallback
      }
    }
    return getHrisStore().positions;
  }

  async getHolidays(): Promise<Holiday[]> {
    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const list = await prisma.holiday.findMany({
          orderBy: { date: 'asc' },
        });
        if (list && list.length > 0) {
          return list.map((h: any) => ({
            id: h.id,
            name: h.name,
            date: h.date instanceof Date ? h.date.toISOString().split('T')[0] : String(h.date),
            isCollective: Boolean(h.isCollective),
            description: h.description || undefined,
          }));
        }
      } catch {
        // Fallback
      }
    }
    return getHrisStore().holidays;
  }

  async getRegulations(): Promise<GovernmentRegulation[]> {
    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const list = await prisma.governmentRegulation.findMany({
          where: { isActive: true },
          orderBy: { category: 'asc' },
        });
        if (list && list.length > 0) {
          return list.map((r: any) => ({
            id: r.id,
            category: r.category as any,
            regulationName: r.regulationName,
            regulationNumber: r.regulationNumber,
            officialSource: r.officialSource,
            sourceUrl: r.sourceUrl || undefined,
            effectiveFrom: r.effectiveFrom instanceof Date ? r.effectiveFrom.toISOString().split('T')[0] : String(r.effectiveFrom),
            effectiveUntil: r.effectiveUntil ? new Date(r.effectiveUntil).toISOString().split('T')[0] : undefined,
            version: r.version,
            isActive: Boolean(r.isActive),
            verifiedAt: r.verifiedAt ? new Date(r.verifiedAt).toISOString().split('T')[0] : '',
            verifiedBy: r.verifiedBy,
            parameters: (r.parameters as any) || {},
          }));
        }
      } catch {
        // Fallback
      }
    }
    return getHrisStore().regulations;
  }

  async getReimbursements(tenantId?: string): Promise<Reimbursement[]> {
    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const list = await prisma.reimbursement.findMany({
          where: tenantId ? { tenantId } : undefined,
          orderBy: { createdAt: 'desc' },
        });
        if (list && list.length > 0) {
          return list.map((r: any) => ({
            id: r.id,
            employeeId: r.employeeId,
            category: r.category,
            amount: Number(r.amount),
            description: r.description,
            receiptUrl: r.receiptUrl || undefined,
            status: r.status,
            approvedBy: r.approvedBy || undefined,
            approvedAt: r.approvedAt ? new Date(r.approvedAt).toISOString() : undefined,
            paidInPayroll: Boolean(r.paidInPayroll),
            createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
          }));
        }
      } catch {
        // Fallback
      }
    }
    return getHrisStore().reimbursements;
  }

  async getEmployeeLoans(tenantId?: string): Promise<EmployeeLoan[]> {
    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const list = await prisma.employeeLoan.findMany({
          where: tenantId ? { tenantId } : undefined,
          orderBy: { createdAt: 'desc' },
        });
        if (list && list.length > 0) {
          return list.map((l: any) => ({
            id: l.id,
            employeeId: l.employeeId,
            principalAmount: Number(l.principalAmount),
            installmentCount: l.installmentCount,
            monthlyDeduction: Number(l.monthlyDeduction),
            remainingBalance: Number(l.remainingBalance),
            purpose: l.purpose,
            status: l.status,
            startDate: l.startDate instanceof Date ? l.startDate.toISOString().split('T')[0] : String(l.startDate),
            createdAt: l.createdAt ? new Date(l.createdAt).toISOString() : new Date().toISOString(),
          }));
        }
      } catch {
        // Fallback
      }
    }
    return getHrisStore().employeeLoans;
  }

  async getEmployeeDocuments(tenantId?: string): Promise<EmployeeDocument[]> {
    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const list = await prisma.employeeDocument.findMany({
          where: tenantId ? { tenantId } : undefined,
          orderBy: { createdAt: 'desc' },
        });
        if (list && list.length > 0) {
          return list.map((d: any) => ({
            id: d.id,
            employeeId: d.employeeId,
            category: d.category,
            fileName: d.fileName,
            fileUrl: d.fileUrl,
            fileSizeKb: d.fileSizeKb,
            expiryDate: d.expiryDate ? new Date(d.expiryDate).toISOString().split('T')[0] : undefined,
            isVerified: Boolean(d.isVerified),
            verifiedBy: d.verifiedBy || undefined,
            createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : new Date().toISOString(),
          }));
        }
      } catch {
        // Fallback
      }
    }
    return getHrisStore().documents;
  }

  async getKpiReviews(tenantId?: string): Promise<KpiReview[]> {
    const isDb = await isPrismaAvailable();
    if (isDb) {
      try {
        const list = await prisma.kpiReview.findMany({
          where: tenantId ? { tenantId } : undefined,
          orderBy: { createdAt: 'desc' },
        });
        if (list && list.length > 0) {
          return list.map((k: any) => ({
            id: k.id,
            employeeId: k.employeeId,
            period: k.period,
            selfScore: k.selfScore ?? undefined,
            selfNotes: k.selfNotes ?? undefined,
            managerScore: k.managerScore ?? undefined,
            managerNotes: k.managerNotes ?? undefined,
            finalScore: k.finalScore ?? undefined,
            status: k.status,
            createdAt: k.createdAt ? new Date(k.createdAt).toISOString() : new Date().toISOString(),
          }));
        }
      } catch {
        // Fallback
      }
    }
    return getHrisStore().kpiReviews;
  }
}

export const organizationRepository = new OrganizationRepository();
