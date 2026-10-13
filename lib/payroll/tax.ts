// Official Indonesian Tax Engine (PPh 21)
// Legal Reference:
// - Peraturan Pemerintah (PP) No. 58 Tahun 2023
// - Peraturan Menteri Keuangan (PMK) No. 168 Tahun 2023
// - UU No. 7 Tahun 2021 tentang Harmonisasi Peraturan Perpajakan (UU HPP)

import { TaxPtkpStatus, TaxCalculationDetail } from '../types';

export interface TerRateBracket {
  maxIncome: number; // Upper limit of bracket in IDR
  rate: number; // Percent e.g. 0.25 for 0.25%
}

// ----------------------------------------------------------------------
// OFFICIAL TER KATEGORI A: TK/0 (54M), TK/1 (58.5M), K/0 (58.5M)
// Sumber: Lampiran PMK 168/2023 & PP 58/2023
// ----------------------------------------------------------------------
export const TER_CATEGORY_A_BRACKETS: TerRateBracket[] = [
  { maxIncome: 5400000, rate: 0.0 },
  { maxIncome: 5650000, rate: 0.25 },
  { maxIncome: 5950000, rate: 0.5 },
  { maxIncome: 6300000, rate: 0.75 },
  { maxIncome: 6750000, rate: 1.0 },
  { maxIncome: 7500000, rate: 1.25 },
  { maxIncome: 8550000, rate: 1.5 },
  { maxIncome: 9650000, rate: 1.75 },
  { maxIncome: 10050000, rate: 2.0 },
  { maxIncome: 10350000, rate: 2.25 },
  { maxIncome: 10700000, rate: 2.5 },
  { maxIncome: 11050000, rate: 3.0 },
  { maxIncome: 11600000, rate: 3.5 },
  { maxIncome: 12500000, rate: 4.0 },
  { maxIncome: 13750000, rate: 5.0 },
  { maxIncome: 15100000, rate: 6.0 },
  { maxIncome: 16950000, rate: 7.0 },
  { maxIncome: 19750000, rate: 8.0 },
  { maxIncome: 24150000, rate: 9.0 },
  { maxIncome: 26450000, rate: 10.0 },
  { maxIncome: 28000000, rate: 11.0 },
  { maxIncome: 30050000, rate: 12.0 },
  { maxIncome: 32400000, rate: 13.0 },
  { maxIncome: 35400000, rate: 14.0 },
  { maxIncome: 39100000, rate: 15.0 },
  { maxIncome: 43850000, rate: 16.0 },
  { maxIncome: 47800000, rate: 17.0 },
  { maxIncome: 51400000, rate: 18.0 },
  { maxIncome: 56300000, rate: 19.0 },
  { maxIncome: 62200000, rate: 20.0 },
  { maxIncome: 68600000, rate: 21.0 },
  { maxIncome: 77500000, rate: 22.0 },
  { maxIncome: 89000000, rate: 23.0 },
  { maxIncome: 103000000, rate: 24.0 },
  { maxIncome: 125000000, rate: 25.0 },
  { maxIncome: 157000000, rate: 26.0 },
  { maxIncome: 206000000, rate: 27.0 },
  { maxIncome: 337000000, rate: 28.0 },
  { maxIncome: 454000000, rate: 29.0 },
  { maxIncome: 550000000, rate: 30.0 },
  { maxIncome: 695000000, rate: 31.0 },
  { maxIncome: 910000000, rate: 32.0 },
  { maxIncome: 1400000000, rate: 33.0 },
  { maxIncome: Infinity, rate: 34.0 },
];

// ----------------------------------------------------------------------
// OFFICIAL TER KATEGORI B: TK/2 (63M), TK/3 (67.5M), K/1 (63M), K/2 (67.5M)
// Sumber: Lampiran PMK 168/2023 & PP 58/2023
// ----------------------------------------------------------------------
export const TER_CATEGORY_B_BRACKETS: TerRateBracket[] = [
  { maxIncome: 6200000, rate: 0.0 },
  { maxIncome: 6500000, rate: 0.25 },
  { maxIncome: 6850000, rate: 0.5 },
  { maxIncome: 7300000, rate: 0.75 },
  { maxIncome: 9200000, rate: 1.0 },
  { maxIncome: 10750000, rate: 1.5 },
  { maxIncome: 11250000, rate: 2.0 },
  { maxIncome: 11600000, rate: 2.5 },
  { maxIncome: 12600000, rate: 3.0 },
  { maxIncome: 13600000, rate: 4.0 },
  { maxIncome: 14950000, rate: 5.0 },
  { maxIncome: 16400000, rate: 6.0 },
  { maxIncome: 18450000, rate: 7.0 },
  { maxIncome: 21850000, rate: 8.0 },
  { maxIncome: 26000000, rate: 9.0 },
  { maxIncome: 27700000, rate: 10.0 },
  { maxIncome: 29300000, rate: 11.0 },
  { maxIncome: 31450000, rate: 12.0 },
  { maxIncome: 33950000, rate: 13.0 },
  { maxIncome: 37100000, rate: 14.0 },
  { maxIncome: 41100000, rate: 15.0 },
  { maxIncome: 45800000, rate: 16.0 },
  { maxIncome: 49500000, rate: 17.0 },
  { maxIncome: 53800000, rate: 18.0 },
  { maxIncome: 58500000, rate: 19.0 },
  { maxIncome: 64000000, rate: 20.0 },
  { maxIncome: 71000000, rate: 21.0 },
  { maxIncome: 80000000, rate: 22.0 },
  { maxIncome: 93000000, rate: 23.0 },
  { maxIncome: 109000000, rate: 24.0 },
  { maxIncome: 129000000, rate: 25.0 },
  { maxIncome: 163000000, rate: 26.0 },
  { maxIncome: 211000000, rate: 27.0 },
  { maxIncome: 374000000, rate: 28.0 },
  { maxIncome: 459000000, rate: 29.0 },
  { maxIncome: 555000000, rate: 30.0 },
  { maxIncome: 704000000, rate: 31.0 },
  { maxIncome: 957000000, rate: 32.0 },
  { maxIncome: 1405000000, rate: 33.0 },
  { maxIncome: Infinity, rate: 34.0 },
];

// ----------------------------------------------------------------------
// OFFICIAL TER KATEGORI C: K/3 (72M)
// Sumber: Lampiran PMK 168/2023 & PP 58/2023
// ----------------------------------------------------------------------
export const TER_CATEGORY_C_BRACKETS: TerRateBracket[] = [
  { maxIncome: 6600000, rate: 0.0 },
  { maxIncome: 6950000, rate: 0.25 },
  { maxIncome: 7350000, rate: 0.5 },
  { maxIncome: 7800000, rate: 0.75 },
  { maxIncome: 8850000, rate: 1.0 },
  { maxIncome: 9800000, rate: 1.25 },
  { maxIncome: 10950000, rate: 1.5 },
  { maxIncome: 11200000, rate: 1.75 },
  { maxIncome: 12050000, rate: 2.0 },
  { maxIncome: 12950000, rate: 3.0 },
  { maxIncome: 14150000, rate: 4.0 },
  { maxIncome: 15550000, rate: 5.0 },
  { maxIncome: 17050000, rate: 6.0 },
  { maxIncome: 19500000, rate: 7.0 },
  { maxIncome: 22700000, rate: 8.0 },
  { maxIncome: 26600000, rate: 9.0 },
  { maxIncome: 28100000, rate: 10.0 },
  { maxIncome: 30100000, rate: 11.0 },
  { maxIncome: 32600000, rate: 12.0 },
  { maxIncome: 35400000, rate: 13.0 },
  { maxIncome: 38900000, rate: 14.0 },
  { maxIncome: 43000000, rate: 15.0 },
  { maxIncome: 47400000, rate: 16.0 },
  { maxIncome: 51200000, rate: 17.0 },
  { maxIncome: 55800000, rate: 18.0 },
  { maxIncome: 60400000, rate: 19.0 },
  { maxIncome: 66700000, rate: 20.0 },
  { maxIncome: 74500000, rate: 21.0 },
  { maxIncome: 83200000, rate: 22.0 },
  { maxIncome: 95600000, rate: 23.0 },
  { maxIncome: 110000000, rate: 24.0 },
  { maxIncome: 134000000, rate: 25.0 },
  { maxIncome: 169000000, rate: 26.0 },
  { maxIncome: 221000000, rate: 27.0 },
  { maxIncome: 390000000, rate: 28.0 },
  { maxIncome: 463000000, rate: 29.0 },
  { maxIncome: 561000000, rate: 30.0 },
  { maxIncome: 709000000, rate: 31.0 },
  { maxIncome: 965000000, rate: 32.0 },
  { maxIncome: 1419000000, rate: 33.0 },
  { maxIncome: Infinity, rate: 34.0 },
];

/**
 * Maps Indonesian PTKP Status to PP 58/2023 & PMK 168/2023 TER Category
 */
export function getTerCategory(ptkp: TaxPtkpStatus): 'A' | 'B' | 'C' {
  switch (ptkp) {
    case 'TK_0':
    case 'TK_1':
    case 'K_0':
      return 'A';
    case 'TK_2':
    case 'TK_3':
    case 'K_1':
    case 'K_2':
      return 'B';
    case 'K_3':
      return 'C';
    default:
      return 'A';
  }
}

/**
 * Finds applicable TER rate from PMK 168/2023 table
 */
export function getTerRate(category: 'A' | 'B' | 'C', grossMonthly: number): number {
  let brackets: TerRateBracket[];
  if (category === 'A') brackets = TER_CATEGORY_A_BRACKETS;
  else if (category === 'B') brackets = TER_CATEGORY_B_BRACKETS;
  else brackets = TER_CATEGORY_C_BRACKETS;

  for (const bracket of brackets) {
    if (grossMonthly <= bracket.maxIncome) {
      return bracket.rate;
    }
  }
  return 34.0;
}

/**
 * Calculates monthly PPh 21 with full transparency audit details
 */
export function calculatePph21Monthly(
  grossIncome: number,
  ptkpStatus: TaxPtkpStatus,
  hasNpwp: boolean = true
): TaxCalculationDetail {
  const category = getTerCategory(ptkpStatus);
  const terRate = getTerRate(category, grossIncome);

  // PPh 21 = Penghasilan Bruto x Tarif Efektif Bulanan
  const basePph21 = Math.round((grossIncome * terRate) / 100);

  // Multiplier if no NPWP/NIK validated (under old rules +20%, under UU HPP NIK is NPWP)
  const npwpMultiplier = hasNpwp ? 1.0 : 1.2;
  const finalPph21 = Math.round(basePph21 * npwpMultiplier);

  const steps = [
    {
      description: 'Penghasilan Bruto Masa Pajak',
      amountOrRate: `Rp ${grossIncome.toLocaleString('id-ID')}`,
    },
    {
      description: `Status PTKP & Kategori TER (${ptkpStatus})`,
      amountOrRate: `Kategori TER ${category}`,
    },
    {
      description: 'Tarif Efektif Rata-Rata (PP 58/2023 & PMK 168/2023)',
      amountOrRate: `${terRate}%`,
    },
    {
      description: 'PPh 21 Dasar (Bruto × Tarif)',
      amountOrRate: `Rp ${basePph21.toLocaleString('id-ID')}`,
    },
  ];

  if (!hasNpwp) {
    steps.push({
      description: 'Faktor Pengali Non-NPWP (+20%)',
      amountOrRate: '120%',
    });
  }

  steps.push({
    description: 'PPh 21 Terutang Masa Ini',
    amountOrRate: `Rp ${finalPph21.toLocaleString('id-ID')}`,
  });

  return {
    ptkpStatus,
    terCategory: category,
    grossMonthlyIncome: grossIncome,
    terRatePercent: terRate,
    pph21MonthlyAmount: finalPph21,
    regulationBasis: 'PP No. 58/2023 jo. PMK No. 168/2023',
    hasNpwp,
    npwpPenaltyMultiplier: npwpMultiplier,
    calculationSteps: steps,
  };
}
