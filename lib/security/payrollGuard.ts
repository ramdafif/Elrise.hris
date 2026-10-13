// Payroll Integrity, Four-Eyes Principle & Reconciliation Guard
// Guarantees zero payroll manipulation, immutable locked periods, and accounting consistency.

import { PayrollPeriod, PayrollItem } from '../types';

export interface ReconciliationReport {
  isBalanced: boolean;
  totalGrossPay: number;
  totalDeductions: number;
  totalNetPay: number;
  sumOfIndividualNets: number;
  variance: number;
  errors: string[];
}

export const PayrollGuard = {
  /**
   * Enforces Four-Eyes Principle (Maker-Checker Separation)
   * The person who calculates or initiates payroll CANNOT be the same person who approves or locks it.
   */
  validateMakerChecker(
    calculatorId: string,
    approverId: string,
    tenantRequiresFourEyes = true
  ): { isValid: boolean; error?: string } {
    if (!tenantRequiresFourEyes) {
      return { isValid: true };
    }

    if (calculatorId && approverId && calculatorId === approverId) {
      return {
        isValid: false,
        error:
          'Prinsip Empat Mata (Four-Eyes Principle / Maker-Checker): Pejabat yang mengkalkulasi payroll tidak diperkenankan menyetujui atau mengunci payroll yang sama. Wajib diverifikasi oleh pejabat checker terpisah.',
      };
    }

    return { isValid: true };
  },

  /**
   * Asserts payroll period immutability
   * If status is LOCKED or PAID, all updates, deletes, or recalculations are strictly prohibited.
   */
  assertImmutability(period: PayrollPeriod): void {
    if (period.status === 'LOCKED' || period.status === 'PAID') {
      throw new Error(
        `[SECURITY_VIOLATION] Periode penggajian "${period.name}" telah berstatus ${period.status} (Permanen / Immutable). Segala modifikasi data ditolak. Koreksi harus dilakukan melalui periode penyesuaian (Adjustment Payroll) berikutnya.`
      );
    }
  },

  /**
   * Asserts that an attendance record can be modified or corrected.
   * If the record's date falls within a LOCKED or PAID payroll period, modification is strictly prohibited.
   */
  assertAttendanceModifiable(attendanceDate: string, payrollPeriods: PayrollPeriod[]): void {
    const lockedPeriod = payrollPeriods.find(
      (p) =>
        (p.status === 'LOCKED' || p.status === 'PAID') &&
        attendanceDate >= p.startDate &&
        attendanceDate <= p.endDate
    );

    if (lockedPeriod) {
      throw new Error(
        `[SECURITY_VIOLATION] Presensi tanggal ${attendanceDate} berada dalam periode penggajian "${lockedPeriod.name}" yang telah berstatus ${lockedPeriod.status} (Immutable). Koreksi presensi pada periode terkunci tidak diperbolehkan.`
      );
    }
  },

  /**
   * Mathematical and Accounting Reconciliation Audit
   * Validates:
   * 1. Total Gross - Total Deductions === Total Net
   * 2. Sum(employee.netSalary) === period.totalNetPay
   * 3. No negative net salaries
   */
  reconcilePeriod(period: PayrollPeriod, items: PayrollItem[]): ReconciliationReport {
    const errors: string[] = [];

    let calculatedTotalGross = 0;
    let calculatedTotalDeductions = 0;
    let calculatedTotalNet = 0;

    for (const item of items) {
      calculatedTotalGross += item.grossSalary;
      calculatedTotalDeductions += item.totalDeductions;
      calculatedTotalNet += item.netSalary;

      // Individual integrity checks
      const expectedItemNet = item.grossSalary - item.totalDeductions;
      if (Math.abs(expectedItemNet - item.netSalary) > 1) {
        errors.push(
          `Ketidaksesuaian hitungan pada staf ${item.employeeId}: Bruto (${item.grossSalary}) - Potongan (${item.totalDeductions}) != Bersih (${item.netSalary})`
        );
      }

      if (item.netSalary < 0) {
        errors.push(
          `Gaji bersih negatif terdeteksi pada staf ${item.employeeId} (Rp ${item.netSalary}). Potongan melebihi penghasilan.`
        );
      }
    }

    // Batch level reconciliation
    const batchAccountingNet = calculatedTotalGross - calculatedTotalDeductions;
    const batchVariance = Math.abs(calculatedTotalNet - period.totalNetPay);

    if (batchVariance > 1) {
      errors.push(
        `Ketidaksesuaian rekapitulasi batch: Total pada periode (Rp ${period.totalNetPay}) tidak sama dengan jumlah slip individual (Rp ${calculatedTotalNet}). Selisih: Rp ${batchVariance}`
      );
    }

    if (Math.abs(batchAccountingNet - calculatedTotalNet) > 1) {
      errors.push(
        `Ketidaksesuaian akuntansi batch: Total Bruto (Rp ${calculatedTotalGross}) - Total Potongan (Rp ${calculatedTotalDeductions}) != Total Net (Rp ${calculatedTotalNet})`
      );
    }

    return {
      isBalanced: errors.length === 0,
      totalGrossPay: calculatedTotalGross,
      totalDeductions: calculatedTotalDeductions,
      totalNetPay: calculatedTotalNet,
      sumOfIndividualNets: calculatedTotalNet,
      variance: batchVariance,
      errors,
    };
  },
};
