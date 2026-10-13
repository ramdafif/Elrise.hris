/**
 * GOVERNMENT REGULATION CONFIGURATION — NUSANTARA HRIS
 * 
 * Centralized, versioned statutory rates and brackets for Indonesia:
 * - PPh 21 TER (PP 58/2023 & PMK 168/2023)
 * - BPJS Kesehatan (Perpres 64/2020)
 * - BPJS Ketenagakerjaan (PP 44/2015, PP 45/2015, etc.)
 * - Overtime Standard (PP 35/2021)
 * 
 * Rules must NEVER be hardcoded. They include effective dates for versioning.
 */

export interface TaxRegulationVersion {
  version: string;
  effectiveFrom: string;
  effectiveUntil?: string;
  description: string;
  terCategories: {
    categoryA: { ptkpCodes: string[]; description: string };
    categoryB: { ptkpCodes: string[]; description: string };
    categoryC: { ptkpCodes: string[]; description: string };
  };
  ptkpAmounts: Record<string, number>;
  annualProgressiveRates: Array<{ min: number; max: number | null; rate: number }>;
}

export interface BpjsRegulationVersion {
  version: string;
  effectiveFrom: string;
  effectiveUntil?: string;
  kesehatan: {
    employeeRate: number; // 0.01 (1%)
    companyRate: number;  // 0.04 (4%)
    maxWageCeiling: number; // Rp 12.000.000
    minWageFloorType: 'UMK';
  };
  ketenagakerjaan: {
    jht: { employeeRate: number; companyRate: number }; // 2% & 3.7%
    jp: { employeeRate: number; companyRate: number; maxWageCeiling: number }; // 1% & 2%, Rp 10.042.300
    jkk: { riskTiers: Record<number, number> }; // 0.24% to 1.74%
    jkm: { companyRate: number }; // 0.30%
  };
}

export interface OvertimeRegulationVersion {
  version: string;
  effectiveFrom: string;
  standardMonthlyDivider: number; // 173 (PP 35/2021)
  maxHoursPerDay: number; // 4 hours
  maxHoursPerWeek: number; // 18 hours
  workdayMultipliers: { firstHour: number; subsequentHours: number }; // 1.5x & 2.0x
  holidayMultipliers: { tier1To8: number; tier9: number; tier10To12: number }; // 2.0x, 3.0x, 4.0x
}

export const GOVERNMENT_TAX_RULES_V2024: TaxRegulationVersion = {
  version: 'PP-58-2023-PMK-168-2023',
  effectiveFrom: '2024-01-01',
  description: 'PPh 21 TER (Tarif Efektif Rata-Rata) PP 58/2023 & PMK 168/2023',
  terCategories: {
    categoryA: {
      ptkpCodes: ['TK/0', 'TK/1', 'K/0'],
      description: 'PTKP Rp 54.000.000 s.d Rp 58.500.000',
    },
    categoryB: {
      ptkpCodes: ['TK/2', 'TK/3', 'K/1', 'K/2'],
      description: 'PTKP Rp 63.000.000 s.d Rp 67.500.000',
    },
    categoryC: {
      ptkpCodes: ['K/3'],
      description: 'PTKP Rp 72.000.000',
    },
  },
  ptkpAmounts: {
    'TK/0': 54000000,
    'TK/1': 58500000,
    'TK/2': 63000000,
    'TK/3': 67500000,
    'K/0': 58500000,
    'K/1': 63000000,
    'K/2': 67500000,
    'K/3': 72000000,
  },
  annualProgressiveRates: [
    { min: 0, max: 60000000, rate: 0.05 },
    { min: 60000000, max: 250000000, rate: 0.15 },
    { min: 250000000, max: 500000000, rate: 0.25 },
    { min: 500000000, max: 5000000000, rate: 0.30 },
    { min: 5000000000, max: null, rate: 0.35 },
  ],
};

export const GOVERNMENT_BPJS_RULES_V2026: BpjsRegulationVersion = {
  version: 'BPJS-NATIONAL-2024-2026',
  effectiveFrom: '2024-03-01',
  kesehatan: {
    employeeRate: 0.01,
    companyRate: 0.04,
    maxWageCeiling: 12000000,
    minWageFloorType: 'UMK',
  },
  ketenagakerjaan: {
    jht: {
      employeeRate: 0.02,
      companyRate: 0.037,
    },
    jp: {
      employeeRate: 0.01,
      companyRate: 0.02,
      maxWageCeiling: 10042300,
    },
    jkk: {
      riskTiers: {
        1: 0.0024,
        2: 0.0054,
        3: 0.0089,
        4: 0.0127,
        5: 0.0174,
      },
    },
    jkm: {
      companyRate: 0.003,
    },
  },
};

export const GOVERNMENT_OVERTIME_RULES_PP35: OvertimeRegulationVersion = {
  version: 'PP-35-2021',
  effectiveFrom: '2021-02-02',
  standardMonthlyDivider: 173,
  maxHoursPerDay: 4,
  maxHoursPerWeek: 18,
  workdayMultipliers: {
    firstHour: 1.5,
    subsequentHours: 2.0,
  },
  holidayMultipliers: {
    tier1To8: 2.0,
    tier9: 3.0,
    tier10To12: 4.0,
  },
};
