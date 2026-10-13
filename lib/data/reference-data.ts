/**
 * Reference Data Definitions for Nusantara HRIS Enterprise
 * Small reference tables that remain in /api/data for client-side configuration & lookups.
 */

import { BPJS_CONFIG } from '@/lib/payroll/bpjs';
import {
  TER_CATEGORY_A_BRACKETS,
  TER_CATEGORY_B_BRACKETS,
  TER_CATEGORY_C_BRACKETS,
} from '@/lib/payroll/tax';
import { DEMO_USERS } from '@/lib/auth/session';

export const REFERENCE_JOB_GRADES = [
  { id: 'jg-01', code: 'JG-1', name: 'Entry Level / Officer', minSalary: 5067381, maxSalary: 8500000, level: 1 },
  { id: 'jg-02', code: 'JG-2', name: 'Junior Specialist / Engineer', minSalary: 7500000, maxSalary: 14000000, level: 2 },
  { id: 'jg-03', code: 'JG-3', name: 'Senior Specialist / Lead', minSalary: 13000000, maxSalary: 25000000, level: 3 },
  { id: 'jg-04', code: 'JG-4', name: 'Manager / Department Head', minSalary: 22000000, maxSalary: 45000000, level: 4 },
  { id: 'jg-05', code: 'JG-5', name: 'Director / C-Level', minSalary: 40000000, maxSalary: 95000000, level: 5 },
];

export const REFERENCE_SHIFT_SCHEDULES = [
  { id: 'shift-01', code: 'REG-0830', name: 'Regular Office Hours', startTime: '08:30', endTime: '17:00', breakMinutes: 60, isDefault: true },
  { id: 'shift-02', code: 'OPS-MORN', name: 'Operational Morning', startTime: '07:00', endTime: '15:30', breakMinutes: 60, isDefault: false },
  { id: 'shift-03', code: 'OPS-AFTN', name: 'Operational Afternoon', startTime: '15:00', endTime: '23:30', breakMinutes: 60, isDefault: false },
  { id: 'shift-04', code: 'OPS-NGHT', name: 'Operational Night', startTime: '23:00', endTime: '07:30', breakMinutes: 60, isDefault: false },
];

export const REFERENCE_PTKP_RULES = [
  { code: 'TK_0', status: 'TK/0', description: 'Tidak Kawin tanpa tanggungan', annualPtkp: 54000000, terCategory: 'A' },
  { code: 'TK_1', status: 'TK/1', description: 'Tidak Kawin, 1 tanggungan', annualPtkp: 58500000, terCategory: 'A' },
  { code: 'TK_2', status: 'TK/2', description: 'Tidak Kawin, 2 tanggungan', annualPtkp: 63000000, terCategory: 'B' },
  { code: 'TK_3', status: 'TK/3', description: 'Tidak Kawin, 3 tanggungan', annualPtkp: 67500000, terCategory: 'B' },
  { code: 'K_0', status: 'K/0', description: 'Kawin tanpa tanggungan', annualPtkp: 58500000, terCategory: 'A' },
  { code: 'K_1', status: 'K/1', description: 'Kawin, 1 tanggungan', annualPtkp: 63000000, terCategory: 'B' },
  { code: 'K_2', status: 'K/2', description: 'Kawin, 2 tanggungan', annualPtkp: 67500000, terCategory: 'B' },
  { code: 'K_3', status: 'K/3', description: 'Kawin, 3 tanggungan', annualPtkp: 72000000, terCategory: 'C' },
];

export const REFERENCE_PPH21_BRACKETS = [
  { layer: 1, minIncome: 0, maxIncome: 60000000, rate: 0.05, label: '0 s/d Rp 60.000.000 (5%)' },
  { layer: 2, minIncome: 60000000, maxIncome: 250000000, rate: 0.15, label: 'Rp 60.000.000 s/d Rp 250.000.000 (15%)' },
  { layer: 3, minIncome: 250000000, maxIncome: 500000000, rate: 0.25, label: 'Rp 250.000.000 s/d Rp 500.000.000 (25%)' },
  { layer: 4, minIncome: 500000000, maxIncome: 5000000000, rate: 0.30, label: 'Rp 500.000.000 s/d Rp 5.000.000.000 (30%)' },
  { layer: 5, minIncome: 5000000000, maxIncome: Infinity, rate: 0.35, label: 'Di atas Rp 5.000.000.000 (35%)' },
];

export const REFERENCE_PPH21_DEC_CONFIGS = {
  biayaJabatanRate: 0.05,
  biayaJabatanMaxMonthly: 500000,
  biayaJabatanMaxAnnual: 6000000,
  nonNpwpPenaltyRate: 1.2,
  legalBasis: 'UU No. 7 Tahun 2021 (UU HPP) jo. PMK No. 168 Tahun 2023',
};

export const REFERENCE_SALARY_COMPONENTS = [
  { id: 'sc-01', code: 'BASIC', name: 'Gaji Pokok', type: 'EARNING', isTaxable: true, isBpjsBase: true, isFixed: true },
  { id: 'sc-02', code: 'ALLOW_FIXED', name: 'Tunjangan Jabatan / Fungsional', type: 'EARNING', isTaxable: true, isBpjsBase: true, isFixed: true },
  { id: 'sc-03', code: 'ALLOW_MEAL', name: 'Tunjangan Makan', type: 'EARNING', isTaxable: true, isBpjsBase: false, isFixed: false },
  { id: 'sc-04', code: 'ALLOW_TRANS', name: 'Tunjangan Transportasi', type: 'EARNING', isTaxable: true, isBpjsBase: false, isFixed: false },
  { id: 'sc-05', code: 'ALLOW_COMM', name: 'Tunjangan Komunikasi', type: 'EARNING', isTaxable: true, isBpjsBase: false, isFixed: false },
  { id: 'sc-06', code: 'OVERTIME', name: 'Upah Kerja Lembur (PP 35/2021)', type: 'EARNING', isTaxable: true, isBpjsBase: false, isFixed: false },
  { id: 'sc-07', code: 'THR', name: 'Tunjangan Hari Raya Keagamaan', type: 'EARNING', isTaxable: true, isBpjsBase: false, isFixed: false },
  { id: 'sc-08', code: 'DEDUCT_BPJS_KES', name: 'Iuran BPJS Kesehatan (1%)', type: 'DEDUCTION', isTaxable: false, isBpjsBase: false, isFixed: false },
  { id: 'sc-09', code: 'DEDUCT_BPJS_JHT', name: 'Iuran BPJS Ketenagakerjaan JHT (2%)', type: 'DEDUCTION', isTaxable: false, isBpjsBase: false, isFixed: false },
  { id: 'sc-10', code: 'DEDUCT_BPJS_JP', name: 'Iuran BPJS Ketenagakerjaan JP (1%)', type: 'DEDUCTION', isTaxable: false, isBpjsBase: false, isFixed: false },
  { id: 'sc-11', code: 'DEDUCT_PPH21', name: 'Potongan PPh 21 TER / Pasal 17', type: 'DEDUCTION', isTaxable: false, isBpjsBase: false, isFixed: false },
  { id: 'sc-12', code: 'DEDUCT_LOAN', name: 'Potongan Pinjaman Karyawan', type: 'DEDUCTION', isTaxable: false, isBpjsBase: false, isFixed: false },
];

export function getFullReferenceData() {
  return {
    jobGrades: REFERENCE_JOB_GRADES,
    shiftSchedules: REFERENCE_SHIFT_SCHEDULES,
    ptkpRules: REFERENCE_PTKP_RULES,
    bpjsConfigs: BPJS_CONFIG,
    terRates: {
      categoryA: TER_CATEGORY_A_BRACKETS,
      categoryB: TER_CATEGORY_B_BRACKETS,
      categoryC: TER_CATEGORY_C_BRACKETS,
    },
    pph21Brackets: REFERENCE_PPH21_BRACKETS,
    pph21DecConfigs: REFERENCE_PPH21_DEC_CONFIGS,
    users: (process.env.AUTH_MODE === 'production' || process.env.NODE_ENV === 'production')
      ? []
      : DEMO_USERS.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          employeeId: u.employeeId,
          description: u.description,
        })),
    salaryComponents: REFERENCE_SALARY_COMPONENTS,
  };
}
