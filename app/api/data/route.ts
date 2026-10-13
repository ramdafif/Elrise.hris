import { NextRequest, NextResponse } from 'next/server';
import { getHrisStore } from '@/lib/db/store';
import { getFullReferenceData } from '@/lib/data/reference-data';

/**
 * Reference Data Endpoint (Fase 2 Architecture)
 * Exclusively provides static and operational lookup tables:
 * Company, Branches, Departments, Positions, Job Grades, Shift Schedules,
 * Holidays, Leave Types, PTKP, BPJS, PPh 21 TER, Users, Salary Components, & Regulations.
 *
 * Transactional entities (Employees, Presensi, Cuti, Lembur, Payroll, dll.)
 * have been migrated to dedicated cursor-paginated endpoints (?cursor=&limit=50).
 */
export async function GET(req: NextRequest) {
  const store = getHrisStore();
  const fullRef = getFullReferenceData();

  return NextResponse.json(
    {
      // Core Reference Tables
      company: store.company,
      branches: store.branches,
      departments: store.departments,
      positions: store.positions,
      leaveTypes: store.leaveTypes,
      holidays: store.holidays,
      regulations: store.regulations,

      // Statutory & Configuration Lookups
      jobGrades: fullRef.jobGrades,
      shiftSchedules: fullRef.shiftSchedules,
      ptkpRules: fullRef.ptkpRules,
      bpjsConfigs: fullRef.bpjsConfigs,
      terRates: fullRef.terRates,
      pph21Brackets: fullRef.pph21Brackets,
      pph21DecConfigs: fullRef.pph21DecConfigs,
      salaryComponents: fullRef.salaryComponents,
      users: fullRef.users,

      // Deprecation & Architecture Guidance Notice
      _deprecation: {
        notice: 'Endpoint /api/data khusus untuk data referensi statis (Fase 2 Arch)',
        message:
          'Data transaksional (karyawan, absensi, cuti, lembur, payroll, dsb.) telah dipisahkan ke dedicated endpoints dengan paginasi cursor (?cursor=&limit=).',
        endpoints: {
          employees: '/api/employees?cursor=&limit=50',
          attendances: '/api/attendance?cursor=&limit=50',
          leaveRequests: '/api/leave?cursor=&limit=50',
          overtimeRequests: '/api/overtime?cursor=&limit=50',
          payroll: '/api/payroll?cursor=&limit=50',
          reimbursements: '/api/reimbursement?cursor=&limit=50',
          employeeLoans: '/api/loan?cursor=&limit=50',
          documents: '/api/documents?cursor=&limit=50',
          kpiReviews: '/api/kpi?cursor=&limit=50',
          auditLogs: '/api/audit?cursor=&limit=50',
        },
      },

      // Backward compatibility arrays (empty by default; consumers fetch from dedicated routes)
      employees: [],
      attendances: [],
      leaveRequests: [],
      overtimeRequests: [],
      payrollPeriods: [],
      payrollItems: [],
      reimbursements: [],
      employeeLoans: [],
      documents: [],
      kpiReviews: [],
      auditLogs: [],
    },
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-user-role, x-employee-id',
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-user-role, x-employee-id',
    },
  });
}
