// Core Indonesian Payroll Engine
// Provides deterministic, auditable payroll calculations with full snapshots.

import { Employee, PayrollItem } from '../types';
import { calculateBpjs } from './bpjs';
import { calculatePph21Monthly } from './tax';

export interface PayrollInputParams {
  employee: Employee;
  periodId: string;
  attendanceDays: number; // Actual present days in period
  overtimeHours: number; // Total approved overtime hours
  overtimePay: number; // Total approved overtime pay
  reimbursementAmount?: number;
  loanDeduction?: number;
  bonusThr?: number;
  absenceDays?: number;
}

export function computeEmployeePayroll(params: PayrollInputParams): PayrollItem {
  const {
    employee,
    periodId,
    attendanceDays,
    overtimeHours,
    overtimePay,
    reimbursementAmount = 0,
    loanDeduction = 0,
    bonusThr = 0,
    absenceDays = 0,
  } = params;

  // 1. Earnings
  const basicSalary = Number(employee.basicSalary);
  const fixedAllowance = Number(employee.fixedAllowance);

  // Variable allowance based on presence (Tunjangan Makan + Transport)
  const variableMeal = Number(employee.mealAllowance) * attendanceDays;
  const variableTransport = Number(employee.transportAllowance) * attendanceDays;
  const variableAllowance = variableMeal + variableTransport;

  // Deduction for unexcused absence: (absenceDays / 22) * basicSalary
  const standardWorkDaysPerMonth = 22;
  const absenceDeduction =
    absenceDays > 0
      ? Math.round((absenceDays / standardWorkDaysPerMonth) * basicSalary)
      : 0;

  // Gross Salary (Penghasilan Bruto) for the period
  const grossSalary =
    basicSalary +
    fixedAllowance +
    variableAllowance +
    overtimePay +
    bonusThr +
    reimbursementAmount;

  // 2. BPJS Calculations
  const bpjsDetail = calculateBpjs(
    basicSalary,
    fixedAllowance,
    employee.isBpjsKesActive,
    employee.isBpjsTkActive
  );

  // 3. Tax (PPh 21) Calculations under PP 58/2023 & PMK 168/2023 TER
  // Gross taxable income (Penghasilan bruto bulanan): includes basic, fixed, variable, overtime, bonus/THR
  const taxableGross = grossSalary - reimbursementAmount; // Reimbursements are non-taxable expense returns
  const taxDetail = calculatePph21Monthly(
    taxableGross,
    employee.ptkpStatus,
    employee.hasNpwp
  );

  // 4. Deductions Total
  const totalDeductions =
    bpjsDetail.totalEmployeeDeduction +
    taxDetail.pph21MonthlyAmount +
    loanDeduction +
    absenceDeduction;

  // 5. Net Salary
  const netSalary = Math.max(0, grossSalary - totalDeductions);

  return {
    id: `item-${periodId}-${employee.id}`,
    payrollPeriodId: periodId,
    employeeId: employee.id,

    // Earnings
    basicSalary,
    fixedAllowance,
    variableAllowance,
    overtimePay,
    bonusThr,
    reimbursementPay: reimbursementAmount,
    grossSalary,

    // Employee Deductions
    bpjsKesEmployee: bpjsDetail.bpjsKesEmployeeAmount,
    bpjsTkJhtEmployee: bpjsDetail.bpjsTkJhtEmployeeAmount,
    bpjsTkJpEmployee: bpjsDetail.bpjsTkJpEmployeeAmount,
    pph21Amount: taxDetail.pph21MonthlyAmount,
    loanDeduction,
    absenceDeduction,
    totalDeductions,

    // Employer Contributions
    bpjsKesEmployer: bpjsDetail.bpjsKesEmployerAmount,
    bpjsTkJhtEmployer: bpjsDetail.bpjsTkJhtEmployerAmount,
    bpjsTkJpEmployer: bpjsDetail.bpjsTkJpEmployerAmount,
    bpjsTkJkkEmployer: bpjsDetail.bpjsTkJkkAmount,
    bpjsTkJkmEmployer: bpjsDetail.bpjsTkJkmAmount,
    totalEmployerCost: bpjsDetail.totalEmployerContribution,

    netSalary,

    // Auditable Calculation Snapshots
    taxSnapshot: taxDetail,
    bpjsSnapshot: bpjsDetail,
    attendanceDays,
    overtimeHours,

    isPaid: false,
    createdAt: new Date().toISOString(),
  };
}
