// Official Indonesian THR Engine
// Legal Reference: Peraturan Menteri Ketenagakerjaan (Permenaker) No. 6 Tahun 2016

/**
 * Calculates THR Keagamaan based on tenure (months)
 */
export function calculateThr(
  basicSalary: number,
  fixedAllowance: number,
  tenureMonths: number
): {
  monthlyWage: number;
  tenureMonths: number;
  multiplier: number;
  thrAmount: number;
  isProrated: boolean;
  regulation: string;
} {
  const monthlyWage = basicSalary + fixedAllowance;

  if (tenureMonths < 1) {
    return {
      monthlyWage,
      tenureMonths,
      multiplier: 0,
      thrAmount: 0,
      isProrated: false,
      regulation: 'Permenaker No. 6/2016 (Kurang dari 1 bulan masa kerja tidak berhak)',
    };
  }

  if (tenureMonths >= 12) {
    return {
      monthlyWage,
      tenureMonths,
      multiplier: 1.0,
      thrAmount: monthlyWage,
      isProrated: false,
      regulation: 'Permenaker No. 6/2016 Pasal 3 ayat 1 huruf a (1 bulan upah)',
    };
  } else {
    // Pro-rata: (tenureMonths / 12) * 1 bulan upah
    const multiplier = Number((tenureMonths / 12).toFixed(4));
    const thrAmount = Math.round((tenureMonths / 12) * monthlyWage);
    return {
      monthlyWage,
      tenureMonths,
      multiplier,
      thrAmount,
      isProrated: true,
      regulation: 'Permenaker No. 6/2016 Pasal 3 ayat 1 huruf b (Pro-rata masa kerja / 12)',
    };
  }
}
