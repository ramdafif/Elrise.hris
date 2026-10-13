// Official Indonesian Overtime Engine
// Legal Reference: Peraturan Pemerintah (PP) No. 35 Tahun 2021 Pasal 31 - 34

/**
 * Calculates hourly base wage: 1/173 x (Basic Salary + Fixed Allowance)
 * Sesuai PP 35/2021 Pasal 32 ayat (1)
 */
export function calculateHourlyWage(basicSalary: number, fixedAllowance: number): number {
  const wageBase = basicSalary + fixedAllowance;
  return Math.round(wageBase / 173);
}

/**
 * Calculates weighted overtime hours under PP 35/2021
 * - Normal Working Day:
 *   - Hour 1: 1.5x
 *   - Hour 2 and subsequent: 2.0x
 * - Weekend / Official Holiday:
 *   - First 7-8 hours: 2.0x
 *   - Hour 8-9: 3.0x
 *   - Hour 9+: 4.0x
 */
export function calculateWeightedOvertimeHours(
  durationHours: number,
  isHolidayOrWeekend: boolean = false
): number {
  if (durationHours <= 0) return 0;

  if (!isHolidayOrWeekend) {
    if (durationHours <= 1) {
      return durationHours * 1.5;
    } else {
      // 1.5 for first hour, 2.0 for remaining hours
      return 1.5 + (durationHours - 1) * 2.0;
    }
  } else {
    // Weekend / Holiday
    if (durationHours <= 8) {
      return durationHours * 2.0;
    } else if (durationHours <= 9) {
      return 8 * 2.0 + (durationHours - 8) * 3.0;
    } else {
      return 8 * 2.0 + 1 * 3.0 + (durationHours - 9) * 4.0;
    }
  }
}

/**
 * Computes exact overtime pay in Rupiah
 */
export function calculateOvertimePay(
  basicSalary: number,
  fixedAllowance: number,
  durationHours: number,
  isHolidayOrWeekend: boolean = false
): {
  hourlyWage: number;
  weightedHours: number;
  overtimePay: number;
  regulation: string;
} {
  const hourlyWage = calculateHourlyWage(basicSalary, fixedAllowance);
  const weightedHours = calculateWeightedOvertimeHours(durationHours, isHolidayOrWeekend);
  const overtimePay = Math.round(hourlyWage * weightedHours);

  return {
    hourlyWage,
    weightedHours,
    overtimePay,
    regulation: 'PP No. 35 Tahun 2021 Pasal 31 - 34',
  };
}
