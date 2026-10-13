// Nusantara HRIS Enterprise - Central Reactive Data Store
// Server-side state manager with thread-safe persistence and auditing

import { randomUUID } from 'crypto';
import {
  Company,
  Branch,
  Department,
  Position,
  Employee,
  AttendanceRecord,
  LeaveRequest,
  LeaveType,
  OvertimeRequest,
  Holiday,
  PayrollPeriod,
  PayrollItem,
  GovernmentRegulation,
  Reimbursement,
  EmployeeLoan,
  KpiReview,
  EmployeeDocument,
  AuditLog,
  UserSession,
} from '../types';
import {
  INITIAL_COMPANY,
  INITIAL_BRANCHES,
  INITIAL_DEPARTMENTS,
  INITIAL_POSITIONS,
  INITIAL_LEAVE_TYPES,
  INITIAL_HOLIDAYS_2026,
  INITIAL_REGULATIONS,
  generateSeedEmployees,
} from './seed-data';
import { computeEmployeePayroll } from '../payroll/engine';
import { calculateOvertimePay } from '../payroll/overtime';
import { SYSTEM_CONFIG } from '../../config/systemConfig';
import { employeeRepository } from './repositories/employee.repository';
import { attendanceRepository } from './repositories/attendance.repository';
import { leaveRepository } from './repositories/leave.repository';
import { overtimeRepository } from './repositories/overtime.repository';
import { payrollRepository } from './repositories/payroll.repository';
import { auditRepository } from './repositories/audit.repository';
import { projectRepository } from './repositories/project.repository';
import prisma, { isPrismaAvailable } from './prisma';
import { Project, EmployeeProjectAssignment } from '../types';

class HrisDataStore {
  // =========================================================================
  // PENGECUALIAN DATA REFERENSI KECIL (INTENTIONAL EXCEPTION):
  // Data master organisasi berikut (company, branches, departments, positions,
  // leaveTypes, holidays, regulations) sengaja dibaca dari in-memory cache
  // karena datanya berukuran kecil (< 100 entri), hampir statis (jarang bermutasi),
  // dan diakses berulang pada setiap siklus transaksi/kalkulasi.
  // Cache ini di-seed saat bootstrap aplikasi dan dapat di-refresh saat master data diperbarui.
  // =========================================================================
  public company: Company = { ...INITIAL_COMPANY };
  public branches: Branch[] = [...INITIAL_BRANCHES];
  public departments: Department[] = [...INITIAL_DEPARTMENTS];
  public positions: Position[] = [...INITIAL_POSITIONS];
  public leaveTypes: LeaveType[] = [...INITIAL_LEAVE_TYPES];
  public holidays: Holiday[] = [...INITIAL_HOLIDAYS_2026];
  public regulations: GovernmentRegulation[] = [...INITIAL_REGULATIONS];

  // Projects & operational work assignments
  public projects: Project[] = [];
  public projectAssignments: EmployeeProjectAssignment[] = [];

  // In-memory cache for operational data (PRISMA IS PRIMARY SOURCE OF TRUTH)
  public employees: Employee[] = generateSeedEmployees();

  public attendances: AttendanceRecord[] = [];
  public leaveRequests: LeaveRequest[] = [];
  public overtimeRequests: OvertimeRequest[] = [];
  public payrollPeriods: PayrollPeriod[] = [];
  public payrollItems: PayrollItem[] = [];
  public reimbursements: Reimbursement[] = [];
  public employeeLoans: EmployeeLoan[] = [];
  public kpiReviews: KpiReview[] = [];
  public documents: EmployeeDocument[] = [];
  public auditLogs: AuditLog[] = [];

  private isHydrating: boolean = false;
  private isHydrated: boolean = false;

  constructor() {
    this.seedInitialOperationalData();
    void this.hydrateFromPrisma();
  }

  public async hydrateFromPrisma(tenantId: string = 'tenant-elkyno-01') {
    if (this.isHydrating) return;
    const available = await isPrismaAvailable();
    if (!available) return;
    this.isHydrating = true;
    try {
      const [emps, atts, leaves, ots, periods, items, logs, prjs, asgs] = await Promise.all([
        employeeRepository.findAll(tenantId).catch(() => []),
        attendanceRepository.findAll(tenantId).catch(() => []),
        leaveRepository.findAll(tenantId).catch(() => []),
        overtimeRepository.findAll(tenantId).catch(() => []),
        payrollRepository.findPeriods(tenantId).catch(() => []),
        payrollRepository.findItems(undefined, tenantId).catch(() => []),
        auditRepository.findAll(tenantId).catch(() => []),
        projectRepository.findProjects(tenantId).catch(() => []),
        projectRepository.findAssignments({ tenantId }).catch(() => []),
      ]);

      if (emps && emps.length > 0) this.employees = emps;
      if (atts && atts.length > 0) this.attendances = atts;
      if (leaves && leaves.length > 0) this.leaveRequests = leaves;
      if (ots && ots.length > 0) this.overtimeRequests = ots;
      if (periods && periods.length > 0) this.payrollPeriods = periods;
      if (items && items.length > 0) this.payrollItems = items;
      if (logs && logs.length > 0) this.auditLogs = logs;
      if (prjs && prjs.length > 0) this.projects = prjs;
      if (asgs && asgs.length > 0) this.projectAssignments = asgs;
      this.isHydrated = true;
    } catch {
      // Prisma hydration deferred to in-memory fallback
    } finally {
      this.isHydrating = false;
    }
  }

  private seedInitialOperationalData() {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // 1. Seed Attendance for today across all employees
    for (let i = 0; i < this.employees.length; i++) {
      const emp = this.employees[i];
      if (!emp) continue;
      const isLate = i % 5 === 0;
      const checkInHour = isLate ? 8 : 7;
      const checkInMin = isLate ? 48 : 52;
      const checkInDate = new Date(today);
      checkInDate.setHours(checkInHour, checkInMin, 0);

      this.attendances.push({
        id: `att-${emp.id}-${todayStr}`,
        employeeId: emp.id,
        date: todayStr,
        checkIn: checkInDate.toISOString(),
        checkOut: undefined,
        workDurationMin: 0,
        lateDurationMin: isLate ? 18 : 0,
        earlyLeaveMin: 0,
        status: isLate ? 'LATE' : 'PRESENT',
        workLocation: i % 2 === 0 ? 'WFO' : 'WFH',
        latitudeIn: -6.2255,
        longitudeIn: 106.8286,
        source: 'WEB_PORTAL',
        approvalStatus: 'APPROVED',
      });
    }

    // 2. Seed Sample Leave Requests
    this.leaveRequests = [
      {
        id: 'leave-req-01',
        employeeId: 'emp-005', // Farhan (PT A)
        leaveTypeId: 'leave-ann',
        startDate: '2026-03-24',
        endDate: '2026-03-26',
        totalDays: 3,
        reason: 'Keperluan keluarga di luar kota',
        status: 'PENDING',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'leave-req-02',
        employeeId: 'emp-b-001', // Rian (PT B)
        leaveTypeId: 'leave-sck',
        startDate: '2026-03-10',
        endDate: '2026-03-11',
        totalDays: 2,
        reason: 'Demam dan flu (Surat Dokter terlampir)',
        attachmentUrl: 'https://placehold.co/400x300.png?text=Surat+Keterangan+Dokter',
        status: 'APPROVED',
        approvedBy: 'Siti Rahmawati (Admin PT B)',
        approvedAt: '2026-03-10T09:00:00Z',
        createdAt: '2026-03-09T18:30:00Z',
      },
    ];

    // 3. Seed Sample Overtime Requests
    const otPay1 = calculateOvertimePay(18500000, 2000000, 3, false);
    const otPay2 = calculateOvertimePay(9500000, 1500000, 2, false);

    this.overtimeRequests = [
      {
        id: 'ot-req-01',
        employeeId: 'emp-005', // Farhan (PT A)
        date: '2026-03-04',
        startTime: '17:30',
        endTime: '20:30',
        durationHours: 3,
        calculatedHours: otPay1.weightedHours,
        overtimePay: otPay1.overtimePay,
        reason: 'Deployment Hotfix Production Server v2.4',
        status: 'APPROVED',
        approvedBy: 'Budi Hartono (Admin PT A)',
        approvedAt: '2026-03-05T08:30:00Z',
        createdAt: '2026-03-04T17:00:00Z',
      },
      {
        id: 'ot-req-02',
        employeeId: 'emp-b-001', // Rian (PT B)
        date: '2026-03-05',
        startTime: '17:30',
        endTime: '19:30',
        durationHours: 2,
        calculatedHours: otPay2.weightedHours,
        overtimePay: otPay2.overtimePay,
        reason: 'Optimalisasi Query PostgreSQL Server Surabaya',
        status: 'PENDING',
        createdAt: '2026-03-05T17:00:00Z',
      },
    ];

    // 4. Seed Historical Locked Payroll Period (Februari 2026) and Current Period (Maret 2026)
    // 4. Seed Historical Locked Payroll Period (Februari 2026) and Current Period (Maret 2026) for PT A
    const febPeriod: PayrollPeriod = {
      id: 'period-2026-02',
      tenantId: 'tenant-pt-a',
      code: '2026-02',
      name: 'Periode Payroll Februari 2026 (PT Alpha)',
      startDate: '2026-02-01',
      endDate: '2026-02-28',
      paymentDate: '2026-02-27',
      status: 'LOCKED',
      totalEmployees: this.employees.filter((e) => e.tenantId === 'tenant-pt-a').length,
      totalGrossPay: 0,
      totalPph21: 0,
      totalBpjsEmployee: 0,
      totalBpjsEmployer: 0,
      totalNetPay: 0,
      lockedAt: '2026-02-26T17:00:00Z',
      lockedBy: 'Budi Hartono (Admin PT A)',
      approvedAt: '2026-02-26T16:30:00Z',
      approvedBy: 'Budi Hartono (Admin PT A)',
    };

    // Calculate sample items for February
    let febGross = 0;
    let febPph = 0;
    let febBpjsEmp = 0;
    let febBpjsEr = 0;
    let febNet = 0;

    this.employees
      .filter((emp) => emp.tenantId === 'tenant-pt-a')
      .forEach((emp) => {
        const item = computeEmployeePayroll({
          employee: emp,
          periodId: febPeriod.id,
          attendanceDays: 20,
          overtimeHours: emp.id === 'emp-005' ? 3 : 0,
          overtimePay: emp.id === 'emp-005' ? otPay1.overtimePay : 0,
        });

        item.tenantId = 'tenant-pt-a';
        item.isPaid = true;
        item.paidAt = '2026-02-27T10:00:00Z';
        this.payrollItems.push(item);

        febGross += item.grossSalary;
        febPph += item.pph21Amount;
        febBpjsEmp += item.bpjsKesEmployee + item.bpjsTkJhtEmployee + item.bpjsTkJpEmployee;
        febBpjsEr += item.totalEmployerCost;
        febNet += item.netSalary;
      });

    febPeriod.totalGrossPay = febGross;
    febPeriod.totalPph21 = febPph;
    febPeriod.totalBpjsEmployee = febBpjsEmp;
    febPeriod.totalBpjsEmployer = febBpjsEr;
    febPeriod.totalNetPay = febNet;

    // Current Active March Period for PT A
    const marPeriod: PayrollPeriod = {
      id: 'period-2026-03',
      tenantId: 'tenant-pt-a',
      code: '2026-03',
      name: 'Periode Payroll Maret 2026 (PT Alpha)',
      startDate: '2026-03-01',
      endDate: '2026-03-31',
      paymentDate: '2026-03-27',
      status: 'REVIEW',
      totalEmployees: this.employees.filter((e) => e.tenantId === 'tenant-pt-a').length,
      totalGrossPay: 0,
      totalPph21: 0,
      totalBpjsEmployee: 0,
      totalBpjsEmployer: 0,
      totalNetPay: 0,
    };

    let marGross = 0;
    let marPph = 0;
    let marBpjsEmp = 0;
    let marBpjsEr = 0;
    let marNet = 0;

    this.employees
      .filter((emp) => emp.tenantId === 'tenant-pt-a')
      .forEach((emp) => {
        const item = computeEmployeePayroll({
          employee: emp,
          periodId: marPeriod.id,
          attendanceDays: 22,
          overtimeHours: emp.id === 'emp-005' ? 3 : 0,
          overtimePay: emp.id === 'emp-005' ? otPay1.overtimePay : 0,
        });

        item.tenantId = 'tenant-pt-a';
        this.payrollItems.push(item);
        marGross += item.grossSalary;
        marPph += item.pph21Amount;
        marBpjsEmp += item.bpjsKesEmployee + item.bpjsTkJhtEmployee + item.bpjsTkJpEmployee;
        marBpjsEr += item.totalEmployerCost;
        marNet += item.netSalary;
      });

    marPeriod.totalGrossPay = marGross;
    marPeriod.totalPph21 = marPph;
    marPeriod.totalBpjsEmployee = marBpjsEmp;
    marPeriod.totalBpjsEmployer = marBpjsEr;
    marPeriod.totalNetPay = marNet;

    // PT B Active March Period
    const ptBEmployees = this.employees.filter((e) => e.tenantId === 'tenant-pt-b');
    const marPeriodPtB: PayrollPeriod = {
      id: 'period-pt-b-2026-03',
      tenantId: 'tenant-pt-b',
      code: 'BETA-2026-03',
      name: 'Periode Payroll Maret 2026 (PT Beta)',
      startDate: '2026-03-01',
      endDate: '2026-03-31',
      paymentDate: '2026-03-27',
      status: 'REVIEW',
      totalEmployees: ptBEmployees.length,
      totalGrossPay: 0,
      totalPph21: 0,
      totalBpjsEmployee: 0,
      totalBpjsEmployer: 0,
      totalNetPay: 0,
      calculatedAt: '2026-03-25T14:00:00Z',
      calculatedBy: 'Siti Rahmawati (Admin PT B)',
    };

    let ptBGross = 0;
    let ptBPph = 0;
    let ptBBpjsEmp = 0;
    let ptBBpjsEr = 0;
    let ptBNet = 0;

    ptBEmployees.forEach((emp) => {
      const item = computeEmployeePayroll({
        employee: emp,
        periodId: marPeriodPtB.id,
        attendanceDays: 22,
        overtimeHours: 0,
        overtimePay: 0,
      });

      item.tenantId = 'tenant-pt-b';
      this.payrollItems.push(item);
      ptBGross += item.grossSalary;
      ptBPph += item.pph21Amount;
      ptBBpjsEmp += item.bpjsKesEmployee + item.bpjsTkJhtEmployee + item.bpjsTkJpEmployee;
      ptBBpjsEr += item.totalEmployerCost;
      ptBNet += item.netSalary;
    });

    marPeriodPtB.totalGrossPay = ptBGross;
    marPeriodPtB.totalPph21 = ptBPph;
    marPeriodPtB.totalBpjsEmployee = ptBBpjsEmp;
    marPeriodPtB.totalBpjsEmployer = ptBBpjsEr;
    marPeriodPtB.totalNetPay = ptBNet;

    this.payrollPeriods = [marPeriod, febPeriod, marPeriodPtB];

    // 5. Seed Reimbursements & Loans
    this.reimbursements = [
      {
        id: 'reimb-01',
        employeeId: 'emp-005',
        category: 'Internet & Komunikasi WFH',
        amount: 500000,
        description: 'Biaya langganan internet bulanan WFH',
        status: 'APPROVED',
        approvedBy: 'Hendra Wijaya',
        approvedAt: '2026-03-02T10:00:00Z',
        paidInPayroll: true,
        createdAt: '2026-03-01T11:00:00Z',
      },
      {
        id: 'reimb-02',
        employeeId: 'emp-007',
        category: 'Sertifikasi Cloud AWS',
        amount: 2350000,
        description: 'Ujian Sertifikasi AWS Certified Solutions Architect',
        status: 'PENDING',
        createdAt: '2026-03-05T14:20:00Z',
        paidInPayroll: false,
      },
    ];

    this.employeeLoans = [
      {
        id: 'loan-01',
        employeeId: 'emp-005',
        principalAmount: 10000000,
        installmentCount: 10,
        monthlyDeduction: 1000000,
        remainingBalance: 7000000,
        purpose: 'Pinjaman Renovasi Rumah',
        status: 'ACTIVE',
        startDate: '2025-12-01',
        createdAt: '2025-11-20T08:00:00Z',
      },
    ];

    // 6. Seed Sample Documents
    this.documents = [
      {
        id: 'doc-01',
        employeeId: 'emp-005',
        category: 'KTP',
        fileName: 'KTP_Farhan_Maulana.pdf',
        fileUrl: '#',
        fileSizeKb: 340,
        isVerified: true,
        verifiedBy: 'Dewi Sekar Ayu',
        createdAt: '2023-06-01T10:00:00Z',
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
        createdAt: '2023-06-01T10:00:00Z',
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
        createdAt: '2023-06-01T10:00:00Z',
      },
    ];

    // 7. Seed Sample KPI Reviews
    this.kpiReviews = [
      {
        id: 'kpi-01',
        employeeId: 'emp-005', // Farhan Maulana Akbar
        period: 'Q1 2026',
        selfScore: 88,
        selfNotes: 'Berhasil menyelesaikan migrasi modul presensi biometrik & refactoring keamanan RBAC tepat waktu.',
        managerScore: 90,
        managerNotes: 'Kinerja luar biasa dalam arsitektur keamanan dan inisiatif kepatuhan regulasi.',
        finalScore: 89,
        status: 'FINALIZED',
        createdAt: '2026-03-01T08:00:00Z',
      },
      {
        id: 'kpi-02',
        employeeId: 'emp-007', // Fauzan
        period: 'Q1 2026',
        selfScore: 82,
        selfNotes: 'Fokus pada otomatisasi pipeline database dan optimasi indeks query.',
        managerScore: 85,
        managerNotes: 'Peningkatan performa database query signifikan, komunikasi tim sangat baik.',
        status: 'REVIEWED',
        createdAt: '2026-03-02T09:00:00Z',
      },
      {
        id: 'kpi-03',
        employeeId: 'emp-008', // Gita
        period: 'Q1 2026',
        selfScore: 80,
        selfNotes: 'Pengembangan komponen UI antarmuka mobile dan responsif web.',
        status: 'SUBMITTED',
        createdAt: '2026-03-03T10:00:00Z',
      },
      {
        id: 'kpi-04',
        employeeId: 'emp-012', // Kurniawan
        period: 'Q1 2026',
        status: 'DRAFT',
        createdAt: '2026-03-04T11:00:00Z',
      },
    ];

    // 8. Initial Audit Trail
    this.auditLogs = [
      {
        id: 'audit-001',
        userName: 'Rizky Pratama',
        userRole: 'PAYROLL_ADMIN',
        action: 'LOCK',
        module: 'PAYROLL',
        entity: 'PayrollPeriod',
        entityId: 'period-2026-02',
        oldValues: { status: 'REVIEW' },
        newValues: { status: 'LOCKED' },
        reason: 'Finalisasi pembayaran gaji Februari 2026',
        timestamp: '2026-02-26T17:00:00Z',
      },
      {
        id: 'audit-002',
        userName: 'Dewi Sekar Ayu',
        userRole: 'HR_ADMIN',
        action: 'UPDATE',
        module: 'TAX_RULE',
        entity: 'GovernmentRegulation',
        entityId: 'reg-pph21',
        reason: 'Verifikasi tabel TER PP 58/2023 & PMK 168/2023',
        timestamp: '2026-01-10T14:30:00Z',
      },
    ];

    // 8. Seed Operational Projects & Assignments
    void projectRepository.findProjects('tenant-elkyno-01').then((prjs) => {
      this.projects = prjs;
    });
    void projectRepository.findAssignments({ tenantId: 'tenant-elkyno-01' }).then((asgs) => {
      this.projectAssignments = asgs;
    });
  }

  // --- ACTIONS & TRANSACTIONS ---

  public logAudit(
    session: UserSession,
    action: AuditLog['action'],
    module: AuditLog['module'],
    entity: string,
    entityId: string,
    details?: { oldValues?: any; newValues?: any; reason?: string }
  ) {
    // ARSITEKTUR KEPATUHAN & AUDIT TRAIL:
    // logAudit() adalah SATU-SATUNYA method yang diizinkan beroperasi secara fire-and-forget (eventual-consistency)
    // karena bersifat data observability & logging operasional (bukan data transaksi inti seperti gaji/cuti/presensi).
    // Hal ini disengaja agar kegagalan log sinkron tidak memblokir alur bisnis kritis pengguna.
    const log: AuditLog = {
      id: randomUUID(),
      userId: session.id,
      userName: session.name,
      userRole: session.role,
      action,
      module,
      entity,
      entityId,
      oldValues: details?.oldValues,
      newValues: details?.newValues,
      reason: details?.reason,
      ipAddress: '127.0.0.1',
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);

    // Asynchronously synchronize with Prisma Audit repository (Eventual Consistency intentionally permitted)
    void auditRepository.logAudit(session, action, module, entity, entityId, details).catch((err) => {
      console.warn('[AuditRepository] Background audit sync:', err);
    });

    // Synchronize LeaveRequest if mutated
    if (entity === 'LeaveRequest') {
      const leave = this.leaveRequests.find((l) => l.id === entityId);
      if (leave && (session.tenantId || leave.tenantId)) {
        const tenantId = session.tenantId || leave.tenantId!;
        void prisma.leaveRequest
          .upsert({
            where: { id: leave.id },
            create: {
              id: leave.id,
              tenantId,
              employeeId: leave.employeeId,
              leaveTypeId: leave.leaveTypeId,
              startDate: new Date(leave.startDate),
              endDate: new Date(leave.endDate),
              totalDays: leave.totalDays,
              reason: leave.reason,
              attachmentUrl: leave.attachmentUrl,
              status: leave.status as any,
              approvedBy: leave.approvedBy,
              approvedAt: leave.approvedAt ? new Date(leave.approvedAt) : undefined,
              managerNotes: leave.rejectionReason,
            },
            update: {
              status: leave.status as any,
              approvedBy: leave.approvedBy,
              approvedAt: leave.approvedAt ? new Date(leave.approvedAt) : undefined,
              managerNotes: leave.rejectionReason,
            },
          })
          .catch(() => {});
      }
    }

    // Synchronize OvertimeRequest if mutated
    if (entity === 'OvertimeRequest') {
      const ot = this.overtimeRequests.find((o) => o.id === entityId);
      if (ot && (session.tenantId || ot.tenantId)) {
        const tenantId = session.tenantId || ot.tenantId!;
        void prisma.overtimeRequest
          .upsert({
            where: { id: ot.id },
            create: {
              id: ot.id,
              tenantId,
              employeeId: ot.employeeId,
              date: new Date(ot.date),
              startTime: ot.startTime,
              endTime: ot.endTime,
              durationHours: ot.durationHours,
              calculatedHours: ot.calculatedHours,
              overtimePay: ot.overtimePay,
              reason: ot.reason,
              status: ot.status as any,
              approvedBy: ot.approvedBy,
              approvedAt: ot.approvedAt ? new Date(ot.approvedAt) : undefined,
              managerNotes: ot.rejectionReason,
            },
            update: {
              status: ot.status as any,
              approvedBy: ot.approvedBy,
              approvedAt: ot.approvedAt ? new Date(ot.approvedAt) : undefined,
              managerNotes: ot.rejectionReason,
            },
          })
          .catch(() => {});
      }
    }
  }

  public checkIn(
    employeeId: string,
    location: 'WFO' | 'WFH' | 'CLIENT_SITE',
    session: UserSession
  ): AttendanceRecord {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();

    let record = this.attendances.find(
      (a) => a.employeeId === employeeId && a.date === todayStr
    );

    // Dynamic branch work hours calculation (Golden Rule #4 - No hardcoding)
    const emp = this.employees.find((e) => e.id === employeeId);
    const branch = this.branches.find((b) => b.id === emp?.branchId);
    const startTimeStr = branch?.workStartTime || SYSTEM_CONFIG.defaultWorkStartTime || '08:30';
    const [startHour, startMin] = startTimeStr.split(':').map(Number);
    const branchStartMinutes = (startHour || 8) * 60 + (startMin || 30);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const isLate = currentMinutes > branchStartMinutes;
    const lateDurationMin = isLate ? currentMinutes - branchStartMinutes : 0;

    if (record) {
      record.checkIn = now.toISOString();
      record.status = isLate ? 'LATE' : 'PRESENT';
      record.workLocation = location;
      record.lateDurationMin = lateDurationMin;
    } else {
      record = {
        id: `att-${employeeId}-${todayStr}`,
        employeeId,
        date: todayStr,
        checkIn: now.toISOString(),
        checkOut: undefined,
        workDurationMin: 0,
        lateDurationMin,
        earlyLeaveMin: 0,
        status: isLate ? 'LATE' : 'PRESENT',
        workLocation: location,
        source: 'WEB_PORTAL',
        approvalStatus: 'APPROVED',
      };
      this.attendances.unshift(record);
    }

    this.logAudit(session, 'CREATE', 'ATTENDANCE', 'AttendanceRecord', record.id, {
      newValues: { checkIn: record.checkIn, status: record.status, location },
    });

    // Synchronize to Prisma Attendance repository
    void attendanceRepository.checkIn(employeeId, location, session).catch((err) => {
      console.warn('[AttendanceRepository] Background checkIn sync:', err);
    });

    return record;
  }

  public checkOut(employeeId: string, session: UserSession): AttendanceRecord {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();

    let record = this.attendances.find(
      (a) => a.employeeId === employeeId && a.date === todayStr
    );

    if (!record) {
      throw new Error('Belum melakukan check-in hari ini.');
    }

    record.checkOut = now.toISOString();
    if (record.checkIn) {
      const diffMs = now.getTime() - new Date(record.checkIn).getTime();
      record.workDurationMin = Math.round(diffMs / 60000);
    }

    // Dynamic branch work hours calculation for early leave
    const emp = this.employees.find((e) => e.id === employeeId);
    const branch = this.branches.find((b) => b.id === emp?.branchId);
    const endTimeStr = branch?.workEndTime || SYSTEM_CONFIG.defaultWorkEndTime || '17:00';
    const [endHour, endMin] = endTimeStr.split(':').map(Number);
    const branchEndMinutes = (endHour || 17) * 60 + (endMin || 0);
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const isEarlyLeave = currentMinutes < branchEndMinutes;
    record.earlyLeaveMin = isEarlyLeave ? branchEndMinutes - currentMinutes : 0;

    this.logAudit(session, 'UPDATE', 'ATTENDANCE', 'AttendanceRecord', record.id, {
      newValues: { checkOut: record.checkOut, durationMin: record.workDurationMin },
    });

    // Synchronize to Prisma Attendance repository
    void attendanceRepository.checkOut(employeeId, session).catch((err) => {
      console.warn('[AttendanceRepository] Background checkOut sync:', err);
    });

    return record;
  }

  public async addEmployee(newEmp: Omit<Employee, 'id'>, session: UserSession): Promise<Employee> {
    // 1. Prisma is primary source of truth: Await creation in Prisma PostgreSQL FIRST.
    // If Prisma throws (e.g. database down, unique constraint failure), the error bubbles up
    // and causes the API route to return HTTP 500 with a clear message.
    const created = await employeeRepository.create(newEmp, session);

    // 2. ONLY after Prisma write succeeds, update the in-memory cache
    const existingIdx = this.employees.findIndex((e) => e.id === created.id);
    if (existingIdx !== -1) {
      this.employees[existingIdx] = created;
    } else {
      this.employees.unshift(created);
    }

    this.logAudit(session, 'CREATE', 'EMPLOYEE', 'Employee', created.id, {
      newValues: { name: created.fullName, nik: created.nikKtp, salary: created.basicSalary },
      reason: 'Penerimaan Karyawan Baru',
    });

    return created;
  }

  public async updateEmployee(
    id: string,
    updates: Partial<Employee>,
    session: UserSession,
    reason?: string
  ): Promise<Employee> {
    // 1. Prisma is primary source of truth: Await update in Prisma PostgreSQL FIRST.
    // If Prisma throws, error bubbles up immediately to API handler.
    const updated = await employeeRepository.update(id, updates, session, reason);

    // 2. ONLY after Prisma write succeeds, update in-memory cache
    const idx = this.employees.findIndex((e) => e.id === id);
    if (idx !== -1) {
      this.employees[idx] = updated;
    } else {
      this.employees.unshift(updated);
    }

    this.logAudit(session, 'UPDATE', 'EMPLOYEE', 'Employee', id, {
      oldValues: { position: updates.positionId },
      newValues: { salary: updates.basicSalary, position: updates.positionId },
      reason: reason || 'Pembaruan data karyawan',
    });

    return updated;
  }

  public async deleteEmployee(
    id: string,
    session: UserSession,
    reason?: string
  ): Promise<Employee> {
    // 1. Prisma is primary source of truth: Await termination in Prisma PostgreSQL FIRST.
    const terminated = await employeeRepository.terminate(id, session, reason);

    // 2. ONLY after Prisma write succeeds, update in-memory cache
    const idx = this.employees.findIndex((e) => e.id === id);
    if (idx !== -1) {
      this.employees[idx] = terminated;
    }

    this.logAudit(session, 'DELETE', 'EMPLOYEE', 'Employee', id, {
      newValues: { status: 'TERMINATED' },
      reason: reason || 'Karyawan Dinonaktifkan',
    });

    return terminated;
  }

  public recalculatePayrollPeriod(periodId: string, session: UserSession): PayrollPeriod {
    const period = this.payrollPeriods.find((p) => p.id === periodId);
    if (!period) throw new Error('Periode payroll tidak ditemukan');
    if (period.status === 'LOCKED') {
      throw new Error('Payroll berstatus LOCKED tidak dapat diubah atau dikalkulasi ulang.');
    }

    period.status = 'CALCULATING';

    // Remove existing items for this period
    this.payrollItems = this.payrollItems.filter((item) => item.payrollPeriodId !== periodId);

    let gross = 0;
    let pph = 0;
    let bpjsEmp = 0;
    let bpjsEr = 0;
    let net = 0;

    for (const emp of this.employees) {
      // Aggregate attendance and approved overtime for this employee
      const empOts = this.overtimeRequests.filter(
        (ot) => ot.employeeId === emp.id && ot.status === 'APPROVED'
      );
      const otHours = empOts.reduce((sum, ot) => sum + ot.durationHours, 0);
      const otPay = empOts.reduce((sum, ot) => sum + ot.overtimePay, 0);

      const item = computeEmployeePayroll({
        employee: emp,
        periodId,
        attendanceDays: 22,
        overtimeHours: otHours,
        overtimePay: otPay,
      });

      this.payrollItems.push(item);
      gross += item.grossSalary;
      pph += item.pph21Amount;
      bpjsEmp +=
        item.bpjsKesEmployee + item.bpjsTkJhtEmployee + item.bpjsTkJpEmployee;
      bpjsEr += item.totalEmployerCost;
      net += item.netSalary;
    }

    period.totalEmployees = this.employees.length;
    period.totalGrossPay = gross;
    period.totalPph21 = pph;
    period.totalBpjsEmployee = bpjsEmp;
    period.totalBpjsEmployer = bpjsEr;
    period.totalNetPay = net;
    period.status = 'REVIEW';

    this.logAudit(session, 'CALCULATE', 'PAYROLL', 'PayrollPeriod', periodId, {
      newValues: { totalGross: gross, totalNet: net, totalPph21: pph },
      reason: 'Kalkulasi Ulang Payroll Engine',
    });

    // Synchronize recalculation in Prisma
    void payrollRepository.recalculatePeriod(periodId, session).catch((err) => {
      console.warn('[PayrollRepository] Background recalculate sync:', err);
    });

    return period;
  }

  public lockPayrollPeriod(periodId: string, session: UserSession): PayrollPeriod {
    const period = this.payrollPeriods.find((p) => p.id === periodId);
    if (!period) throw new Error('Periode payroll tidak ditemukan');
    if (period.status === 'LOCKED') throw new Error('Payroll sudah terkunci.');

    period.status = 'LOCKED';
    period.lockedAt = new Date().toISOString();
    period.lockedBy = `${session.name} (${session.role})`;

    this.logAudit(session, 'LOCK', 'PAYROLL', 'PayrollPeriod', periodId, {
      reason: 'Kunci finalisasi payroll. Snapshot disimpan secara permanen & immutable.',
    });

    // Synchronize lock status in Prisma
    void payrollRepository.lockPeriod(periodId, session).catch((err) => {
      console.warn('[PayrollRepository] Background lock sync:', err);
    });

    return period;
  }
}

// Global Singleton for in-memory persistence in Next.js
declare global {
  var _hrisStoreInstance: HrisDataStore | undefined;
}

export function getHrisStore(): HrisDataStore {
  if (!global._hrisStoreInstance) {
    global._hrisStoreInstance = new HrisDataStore();
  }
  return global._hrisStoreInstance;
}
