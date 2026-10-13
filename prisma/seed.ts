import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres@localhost:5432/nusantara_hris?schema=public';
}
import {
  INITIAL_COMPANY,
  INITIAL_BRANCHES,
  INITIAL_DEPARTMENTS,
  INITIAL_POSITIONS,
  INITIAL_LEAVE_TYPES,
  INITIAL_HOLIDAYS_2026,
  INITIAL_REGULATIONS,
  generateSeedEmployees,
} from '../lib/db/seed-data';
import { computeEmployeePayroll } from '../lib/payroll/engine';
import { calculateOvertimePay } from '../lib/payroll/overtime';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Nusantara HRIS database with Prisma...');

  const tenantId = 'tenant-nusantara-01';

  // 1. Tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: tenantId },
    update: {},
    create: {
      id: tenantId,
      code: 'NUSANTARA-TECH',
      name: 'PT Elkyno Technology',
      legalName: 'PT Elkyno Technology Tbk',
      tier: 'ENTERPRISE',
      status: 'ACTIVE',
      maxEmployees: 50000,
      storageLimitMb: 102400,
    },
  });
  console.log(`Tenant created/verified: ${tenant.name}`);

  // 2. Company
  await prisma.company.upsert({
    where: { id: INITIAL_COMPANY.id },
    update: {},
    create: {
      id: INITIAL_COMPANY.id,
      tenantId,
      name: INITIAL_COMPANY.name,
      legalName: INITIAL_COMPANY.legalName,
      taxId: INITIAL_COMPANY.taxId,
      nib: INITIAL_COMPANY.nib,
      bpjsKesCompanyId: INITIAL_COMPANY.bpjsKesCompanyId,
      bpjsTkCompanyId: INITIAL_COMPANY.bpjsTkCompanyId,
      address: INITIAL_COMPANY.address,
      city: INITIAL_COMPANY.city,
      postalCode: INITIAL_COMPANY.postalCode,
      phone: INITIAL_COMPANY.phone,
      email: INITIAL_COMPANY.email,
      website: INITIAL_COMPANY.website,
      bankName: INITIAL_COMPANY.bankName,
      bankAccountNumber: INITIAL_COMPANY.bankAccountNumber,
      bankAccountHolder: INITIAL_COMPANY.bankAccountHolder,
    },
  });

  // 3. Branches
  for (const b of INITIAL_BRANCHES) {
    await prisma.branch.upsert({
      where: { id: b.id },
      update: {},
      create: {
        id: b.id,
        tenantId,
        companyId: INITIAL_COMPANY.id,
        code: b.code,
        name: b.name,
        address: b.address,
        city: b.city,
        umrAmount: b.umrAmount,
        latitude: b.latitude,
        longitude: b.longitude,
        radiusMeters: b.radiusMeters,
      },
    });
  }

  // 4. Departments
  for (const d of INITIAL_DEPARTMENTS) {
    await prisma.department.upsert({
      where: { id: d.id },
      update: {},
      create: {
        id: d.id,
        tenantId,
        companyId: INITIAL_COMPANY.id,
        code: d.code,
        name: d.name,
        description: d.description,
        costCenter: d.costCenter,
      },
    });
  }

  // 5. Positions
  for (const p of INITIAL_POSITIONS) {
    await prisma.position.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        tenantId,
        departmentId: p.departmentId,
        code: p.code,
        title: p.title,
        level: p.level,
        baseSalaryMin: p.baseSalaryMin,
        baseSalaryMax: p.baseSalaryMax,
      },
    });
  }

  // 6. Leave Types
  for (const lt of INITIAL_LEAVE_TYPES) {
    await prisma.leaveType.upsert({
      where: { id: lt.id },
      update: {},
      create: {
        id: lt.id,
        code: lt.code,
        name: lt.name,
        annualEntitlement: lt.annualEntitlement,
        carryForwardMax: lt.carryForwardMax,
        requiresAttachment: lt.requiresAttachment,
        isPaid: lt.isPaid,
      },
    });
  }

  // 7. Holidays
  for (const h of INITIAL_HOLIDAYS_2026) {
    await prisma.holiday.upsert({
      where: { id: h.id },
      update: {},
      create: {
        id: h.id,
        name: h.name,
        date: new Date(h.date),
        isCollective: h.isCollective,
      },
    });
  }

  // 8. Government Regulations
  for (const r of INITIAL_REGULATIONS) {
    await prisma.governmentRegulation.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        category: r.category,
        regulationName: r.regulationName,
        regulationNumber: r.regulationNumber,
        officialSource: r.officialSource,
        sourceUrl: r.sourceUrl,
        effectiveFrom: new Date(r.effectiveFrom),
        version: r.version,
        isActive: r.isActive,
        verifiedAt: new Date(r.verifiedAt),
        verifiedBy: r.verifiedBy,
        parameters: r.parameters as any,
      },
    });
  }

  // 9. Employees (Pass 1: create without managerId to avoid FK cycles)
  const employees = generateSeedEmployees();
  for (const emp of employees) {
    await prisma.employee.upsert({
      where: { id: emp.id },
      update: {},
      create: {
        id: emp.id,
        tenantId,
        employeeId: emp.employeeId,
        nikKtp: emp.nikKtp,
        fullName: emp.fullName,
        nickname: emp.nickname,
        email: emp.email,
        phone: emp.phone,
        birthPlace: emp.birthPlace,
        birthDate: new Date(emp.birthDate),
        gender: emp.gender as any,
        maritalStatus: emp.maritalStatus as any,
        religion: emp.religion,
        addressKtp: emp.addressKtp,
        branchId: emp.branchId,
        departmentId: emp.departmentId,
        positionId: emp.positionId,
        joinDate: new Date(emp.joinDate),
        employmentType: emp.employmentType as any,
        status: emp.status as any,
        basicSalary: emp.basicSalary,
        fixedAllowance: emp.fixedAllowance,
        mealAllowance: emp.mealAllowance,
        transportAllowance: emp.transportAllowance,
        communicationAllowance: emp.communicationAllowance,
        bankName: emp.bankName,
        bankAccountNumber: emp.bankAccountNumber,
        bankAccountHolder: emp.bankAccountHolder,
        npwp: emp.npwp,
        ptkpStatus: emp.ptkpStatus as any,
        hasNpwp: emp.hasNpwp,
        bpjsKesNumber: emp.bpjsKesNumber,
        bpjsTkNumber: emp.bpjsTkNumber,
        isBpjsKesActive: emp.isBpjsKesActive,
        isBpjsTkActive: emp.isBpjsTkActive,
      },
    });
  }

  // Pass 2: update managerId
  for (const emp of employees) {
    if (emp.managerId) {
      await prisma.employee.update({
        where: { id: emp.id },
        data: { managerId: emp.managerId },
      });
    }
  }
  console.log(`Seeded ${employees.length} employees successfully.`);

  // 10. Operational Data
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Attendances
  for (let i = 0; i < 25; i++) {
    const emp = employees[i];
    const isLate = i % 5 === 0;
    const checkInHour = isLate ? 8 : 7;
    const checkInMin = isLate ? 48 : 52;
    const checkInDate = new Date(today);
    checkInDate.setHours(checkInHour, checkInMin, 0);

    const attId = `att-${emp.id}-${todayStr}`;
    await prisma.attendance.upsert({
      where: { id: attId },
      update: {},
      create: {
        id: attId,
        tenantId,
        employeeId: emp.id,
        date: new Date(todayStr),
        checkIn: checkInDate,
        checkOut: undefined,
        workDurationMin: 0,
        lateDurationMin: isLate ? 18 : 0,
        earlyLeaveMin: 0,
        status: isLate ? 'LATE' : 'PRESENT',
        workLocation: i % 4 === 0 ? 'WFH' : 'WFO',
        latitudeIn: -6.2255,
        longitudeIn: 106.8286,
        source: 'WEB_PORTAL',
        approvalStatus: 'APPROVED',
      },
    });
  }

  // Leave Requests
  const leaveData = [
    {
      id: 'leave-req-01',
      employeeId: 'emp-005',
      leaveTypeId: 'leave-ann',
      startDate: new Date('2026-03-24'),
      endDate: new Date('2026-03-26'),
      totalDays: 3,
      reason: 'Keperluan keluarga di luar kota',
      status: 'PENDING',
      createdAt: new Date(Date.now() - 86400000),
    },
    {
      id: 'leave-req-02',
      employeeId: 'emp-008',
      leaveTypeId: 'leave-sck',
      startDate: new Date('2026-03-10'),
      endDate: new Date('2026-03-11'),
      totalDays: 2,
      reason: 'Demam dan flu (Surat Dokter terlampir)',
      attachmentUrl: 'https://placehold.co/400x300.png?text=Surat+Keterangan+Dokter',
      status: 'APPROVED',
      approvedBy: 'Hendra Wijaya (Manager)',
      approvedAt: new Date('2026-03-10T09:00:00Z'),
      createdAt: new Date('2026-03-09T18:30:00Z'),
    },
    {
      id: 'leave-req-03',
      employeeId: 'emp-012',
      leaveTypeId: 'leave-mar',
      startDate: new Date('2026-04-14'),
      endDate: new Date('2026-04-16'),
      totalDays: 3,
      reason: 'Pernikahan pribadi di Bandung',
      status: 'PENDING',
      createdAt: new Date(),
    },
  ];
  for (const l of leaveData) {
    await prisma.leaveRequest.upsert({
      where: { id: l.id },
      update: {},
      create: {
        id: l.id,
        tenantId,
        employeeId: l.employeeId,
        leaveTypeId: l.leaveTypeId,
        startDate: l.startDate,
        endDate: l.endDate,
        totalDays: l.totalDays,
        reason: l.reason,
        attachmentUrl: l.attachmentUrl,
        status: l.status as any,
        approvedBy: l.approvedBy,
        approvedAt: l.approvedAt,
        createdAt: l.createdAt,
      },
    });
  }

  // Overtime Requests
  const otPay1 = calculateOvertimePay(18500000, 2000000, 3, false);
  const otPay2 = calculateOvertimePay(17000000, 2000000, 2, false);

  const overtimeData = [
    {
      id: 'ot-req-01',
      employeeId: 'emp-005',
      date: new Date('2026-03-04'),
      startTime: '17:30',
      endTime: '20:30',
      durationHours: 3,
      calculatedHours: otPay1.weightedHours,
      overtimePay: otPay1.overtimePay,
      reason: 'Deployment Hotfix Production Server v2.4',
      status: 'APPROVED',
      approvedBy: 'Hendra Wijaya (Manager)',
      approvedAt: new Date('2026-03-05T08:30:00Z'),
      createdAt: new Date('2026-03-04T17:00:00Z'),
    },
    {
      id: 'ot-req-02',
      employeeId: 'emp-007',
      date: new Date('2026-03-05'),
      startTime: '17:30',
      endTime: '19:30',
      durationHours: 2,
      calculatedHours: otPay2.weightedHours,
      overtimePay: otPay2.overtimePay,
      reason: 'Database Migration & Index Rebalancing',
      status: 'PENDING',
      createdAt: new Date('2026-03-05T17:00:00Z'),
    },
  ];
  for (const ot of overtimeData) {
    await prisma.overtimeRequest.upsert({
      where: { id: ot.id },
      update: {},
      create: {
        id: ot.id,
        tenantId,
        employeeId: ot.employeeId,
        date: ot.date,
        startTime: ot.startTime,
        endTime: ot.endTime,
        durationHours: ot.durationHours,
        calculatedHours: ot.calculatedHours,
        overtimePay: ot.overtimePay,
        reason: ot.reason,
        status: ot.status as any,
        approvedBy: ot.approvedBy,
        approvedAt: ot.approvedAt,
        createdAt: ot.createdAt,
      },
    });
  }

  // Payroll Periods
  await prisma.payrollPeriod.upsert({
    where: { id: 'period-2026-02' },
    update: {},
    create: {
      id: 'period-2026-02',
      tenantId,
      code: '2026-02',
      name: 'Periode Payroll Februari 2026',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-02-28'),
      paymentDate: new Date('2026-02-27'),
      status: 'LOCKED',
      totalEmployees: employees.length,
      lockedAt: new Date('2026-02-26T17:00:00Z'),
      lockedBy: 'Rizky Pratama (Payroll Admin)',
      approvedAt: new Date('2026-02-26T16:30:00Z'),
      approvedBy: 'Dewi Sekar Ayu (HR Admin)',
    },
  });

  await prisma.payrollPeriod.upsert({
    where: { id: 'period-2026-03' },
    update: {},
    create: {
      id: 'period-2026-03',
      tenantId,
      code: '2026-03',
      name: 'Periode Payroll Maret 2026',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
      paymentDate: new Date('2026-03-27'),
      status: 'REVIEW',
      totalEmployees: employees.length,
    },
  });

  // Payroll Items for period-2026-03
  for (const emp of employees) {
    const item = computeEmployeePayroll({
      employee: emp,
      periodId: 'period-2026-03',
      attendanceDays: 22,
      overtimeHours: emp.id === 'emp-005' ? 3 : 0,
      overtimePay: emp.id === 'emp-005' ? otPay1.overtimePay : 0,
    });

    await prisma.payrollItem.upsert({
      where: {
        payrollPeriodId_employeeId: {
          payrollPeriodId: 'period-2026-03',
          employeeId: emp.id,
        },
      },
      update: {},
      create: {
        id: item.id,
        tenantId,
        payrollPeriodId: 'period-2026-03',
        employeeId: emp.id,
        basicSalary: item.basicSalary,
        fixedAllowance: item.fixedAllowance,
        variableAllowance: item.variableAllowance,
        overtimePay: item.overtimePay,
        bonusThr: item.bonusThr,
        reimbursementPay: item.reimbursementPay,
        grossSalary: item.grossSalary,
        bpjsKesEmployee: item.bpjsKesEmployee,
        bpjsTkJhtEmployee: item.bpjsTkJhtEmployee,
        bpjsTkJpEmployee: item.bpjsTkJpEmployee,
        pph21Amount: item.pph21Amount,
        loanDeduction: item.loanDeduction,
        absenceDeduction: item.absenceDeduction,
        totalDeductions: item.totalDeductions,
        bpjsKesEmployer: item.bpjsKesEmployer,
        bpjsTkJhtEmployer: item.bpjsTkJhtEmployer,
        bpjsTkJpEmployer: item.bpjsTkJpEmployer,
        bpjsTkJkkEmployer: item.bpjsTkJkkEmployer,
        bpjsTkJkmEmployer: item.bpjsTkJkmEmployer,
        totalEmployerCost: item.totalEmployerCost,
        netSalary: item.netSalary,
        taxCalculationSnapshot: item.taxSnapshot as any,
        bpjsCalculationSnapshot: item.bpjsSnapshot as any,
        attendanceSummarySnapshot: {
          attendanceDays: item.attendanceDays,
          overtimeHours: item.overtimeHours,
        } as any,
        isPaid: false,
      },
    });
  }

  // Reimbursements
  await prisma.reimbursement.upsert({
    where: { id: 'reimb-01' },
    update: {},
    create: {
      id: 'reimb-01',
      tenantId,
      employeeId: 'emp-005',
      category: 'Internet & Komunikasi WFH',
      amount: 500000,
      description: 'Biaya langganan internet bulanan WFH',
      status: 'APPROVED',
      approvedBy: 'Hendra Wijaya',
      approvedAt: new Date('2026-03-02T10:00:00Z'),
      paidInPayroll: true,
      createdAt: new Date('2026-03-01T11:00:00Z'),
    },
  });

  await prisma.reimbursement.upsert({
    where: { id: 'reimb-02' },
    update: {},
    create: {
      id: 'reimb-02',
      tenantId,
      employeeId: 'emp-007',
      category: 'Sertifikasi Cloud AWS',
      amount: 2350000,
      description: 'Ujian Sertifikasi AWS Certified Solutions Architect',
      status: 'PENDING',
      createdAt: new Date('2026-03-05T14:20:00Z'),
      paidInPayroll: false,
    },
  });

  // Employee Loans
  await prisma.employeeLoan.upsert({
    where: { id: 'loan-01' },
    update: {},
    create: {
      id: 'loan-01',
      tenantId,
      employeeId: 'emp-005',
      principalAmount: 10000000,
      installmentCount: 10,
      monthlyDeduction: 1000000,
      remainingBalance: 7000000,
      purpose: 'Pinjaman Renovasi Rumah',
      status: 'ACTIVE',
      startDate: new Date('2025-12-01'),
      createdAt: new Date('2025-11-20T08:00:00Z'),
    },
  });

  // Employee Documents
  const docs = [
    {
      id: 'doc-01',
      employeeId: 'emp-005',
      category: 'KTP',
      fileName: 'KTP_Farhan_Maulana.pdf',
      fileUrl: '#',
      fileSizeKb: 340,
      isVerified: true,
      verifiedBy: 'Dewi Sekar Ayu',
      createdAt: new Date('2023-06-01T10:00:00Z'),
    },
    {
      id: 'doc-02',
      employeeId: 'emp-005',
      category: 'CONTRACT',
      fileName: 'Perjanjian_Kerja_PKWTT_Farhan.pdf',
      fileUrl: '#',
      fileSizeKb: 1250,
      isVerified: true,
      verifiedBy: 'Dewi Sekar Ayu',
      createdAt: new Date('2023-06-01T10:00:00Z'),
    },
    {
      id: 'doc-03',
      employeeId: 'emp-005',
      category: 'NPWP',
      fileName: 'NPWP_Farhan_Maulana.pdf',
      fileUrl: '#',
      fileSizeKb: 210,
      isVerified: true,
      verifiedBy: 'Rizky Pratama',
      createdAt: new Date('2023-06-01T10:00:00Z'),
    },
  ];
  for (const doc of docs) {
    await prisma.employeeDocument.upsert({
      where: { id: doc.id },
      update: {},
      create: {
        id: doc.id,
        tenantId,
        employeeId: doc.employeeId,
        category: doc.category,
        fileName: doc.fileName,
        fileUrl: doc.fileUrl,
        fileSizeKb: doc.fileSizeKb,
        isVerified: doc.isVerified,
        verifiedBy: doc.verifiedBy,
        createdAt: doc.createdAt,
      },
    });
  }

  // KPI Reviews
  const kpis = [
    {
      id: 'kpi-01',
      employeeId: 'emp-005',
      period: 'Q1 2026',
      selfScore: 88,
      selfNotes: 'Berhasil menyelesaikan migrasi modul presensi biometrik & refactoring keamanan RBAC tepat waktu.',
      managerScore: 90,
      managerNotes: 'Kinerja luar biasa dalam arsitektur keamanan dan inisiatif kepatuhan regulasi.',
      finalScore: 89,
      status: 'FINALIZED',
      createdAt: new Date('2026-03-01T08:00:00Z'),
    },
    {
      id: 'kpi-02',
      employeeId: 'emp-007',
      period: 'Q1 2026',
      selfScore: 82,
      selfNotes: 'Fokus pada otomatisasi pipeline database dan optimasi indeks query.',
      managerScore: 85,
      managerNotes: 'Peningkatan performa database query signifikan, komunikasi tim sangat baik.',
      status: 'REVIEWED',
      createdAt: new Date('2026-03-02T09:00:00Z'),
    },
    {
      id: 'kpi-03',
      employeeId: 'emp-008',
      period: 'Q1 2026',
      selfScore: 80,
      selfNotes: 'Pengembangan komponen UI antarmuka mobile dan responsif web.',
      status: 'SUBMITTED',
      createdAt: new Date('2026-03-03T10:00:00Z'),
    },
    {
      id: 'kpi-04',
      employeeId: 'emp-012',
      period: 'Q1 2026',
      status: 'DRAFT',
      createdAt: new Date('2026-03-04T11:00:00Z'),
    },
  ];
  for (const k of kpis) {
    await prisma.kpiReview.upsert({
      where: { id: k.id },
      update: {},
      create: {
        id: k.id,
        tenantId,
        employeeId: k.employeeId,
        period: k.period,
        selfScore: k.selfScore,
        selfNotes: k.selfNotes,
        managerScore: k.managerScore,
        managerNotes: k.managerNotes,
        finalScore: k.finalScore,
        status: k.status,
        createdAt: k.createdAt,
      },
    });
  }

  // Audit Logs
  const auditLogs = [
    {
      id: 'audit-001',
      tenantId,
      userName: 'Rizky Pratama',
      userRole: 'PAYROLL_ADMIN',
      action: 'LOCK',
      module: 'PAYROLL',
      entity: 'PayrollPeriod',
      entityId: 'period-2026-02',
      oldValues: { status: 'REVIEW' },
      newValues: { status: 'LOCKED' },
      reason: 'Finalisasi pembayaran gaji Februari 2026',
      timestamp: new Date('2026-02-26T17:00:00Z'),
    },
    {
      id: 'audit-002',
      tenantId,
      userName: 'Dewi Sekar Ayu',
      userRole: 'HR_ADMIN',
      action: 'UPDATE',
      module: 'TAX_RULE',
      entity: 'GovernmentRegulation',
      entityId: 'reg-pph21',
      reason: 'Verifikasi tabel TER PP 58/2023 & PMK 168/2023',
      timestamp: new Date('2026-01-10T14:30:00Z'),
    },
  ];
  for (const a of auditLogs) {
    await prisma.auditLog.upsert({
      where: { id: a.id },
      update: {},
      create: a,
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error in seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
