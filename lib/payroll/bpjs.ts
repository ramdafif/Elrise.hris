// Official Indonesian BPJS Engine
// Legal Reference:
// - Perpres No. 64 Tahun 2020 (BPJS Kesehatan: 4% Perusahaan, 1% Karyawan, Batas Upah Rp 12.000.000)
// - PP No. 44 Tahun 2015 (JHT: 3.7% Perusahaan, 2% Karyawan; JKK: 0.24% Perusahaan; JKM: 0.30% Perusahaan)
// - PP No. 45 Tahun 2015 (JP: 2% Perusahaan, 1% Karyawan, Batas Maksimal Upah Rp 10.042.300)

import { BpjsCalculationDetail } from '../types';

export const BPJS_CONFIG = {
  kesehatan: {
    employeeRate: 0.01, // 1%
    employerRate: 0.04, // 4%
    wageCeiling: 12000000, // Rp 12.000.000
    regulation: 'Perpres No. 64 Tahun 2020',
  },
  ketenagakerjaan: {
    jht: {
      employeeRate: 0.02, // 2%
      employerRate: 0.037, // 3.7%
      wageCeiling: Infinity, // Tanpa batas maksimal
      regulation: 'PP No. 44 Tahun 2015',
    },
    jp: {
      employeeRate: 0.01, // 1%
      employerRate: 0.02, // 2%
      wageCeiling: 10042300, // Rp 10.042.300
      regulation: 'PP No. 45 Tahun 2015 jo. Edaran Resmi BPJS-TK',
    },
    jkk: {
      employerRate: 0.0024, // 0.24% (Kelompok I: Tingkat Risiko Sangat Rendah/Kantor)
      regulation: 'PP No. 44 Tahun 2015',
    },
    jkm: {
      employerRate: 0.003, // 0.30%
      regulation: 'PP No. 44 Tahun 2015',
    },
  },
};

/**
 * Calculates BPJS Kesehatan and BPJS Ketenagakerjaan
 * Base Wage: Gaji Pokok + Tunjangan Tetap (sesuai UU Ketenagakerjaan)
 */
export function calculateBpjs(
  basicSalary: number,
  fixedAllowance: number,
  isBpjsKesActive: boolean = true,
  isBpjsTkActive: boolean = true
): BpjsCalculationDetail {
  const baseWage = basicSalary + fixedAllowance;

  // 1. BPJS Kesehatan
  const kesBase = Math.min(baseWage, BPJS_CONFIG.kesehatan.wageCeiling);
  const bpjsKesEmployee = isBpjsKesActive
    ? Math.round(kesBase * BPJS_CONFIG.kesehatan.employeeRate)
    : 0;
  const bpjsKesEmployer = isBpjsKesActive
    ? Math.round(kesBase * BPJS_CONFIG.kesehatan.employerRate)
    : 0;

  // 2. BPJS TK - JHT (Jaminan Hari Tua)
  const bpjsTkJhtEmployee = isBpjsTkActive
    ? Math.round(baseWage * BPJS_CONFIG.ketenagakerjaan.jht.employeeRate)
    : 0;
  const bpjsTkJhtEmployer = isBpjsTkActive
    ? Math.round(baseWage * BPJS_CONFIG.ketenagakerjaan.jht.employerRate)
    : 0;

  // 3. BPJS TK - JP (Jaminan Pensiun)
  const jpBase = Math.min(baseWage, BPJS_CONFIG.ketenagakerjaan.jp.wageCeiling);
  const bpjsTkJpEmployee = isBpjsTkActive
    ? Math.round(jpBase * BPJS_CONFIG.ketenagakerjaan.jp.employeeRate)
    : 0;
  const bpjsTkJpEmployer = isBpjsTkActive
    ? Math.round(jpBase * BPJS_CONFIG.ketenagakerjaan.jp.employerRate)
    : 0;

  // 4. BPJS TK - JKK & JKM (Ditanggung Penuh Perusahaan)
  const bpjsTkJkkEmployer = isBpjsTkActive
    ? Math.round(baseWage * BPJS_CONFIG.ketenagakerjaan.jkk.employerRate)
    : 0;
  const bpjsTkJkmEmployer = isBpjsTkActive
    ? Math.round(baseWage * BPJS_CONFIG.ketenagakerjaan.jkm.employerRate)
    : 0;

  const totalEmployeeDeduction =
    bpjsKesEmployee + bpjsTkJhtEmployee + bpjsTkJpEmployee;
  const totalEmployerContribution =
    bpjsKesEmployer +
    bpjsTkJhtEmployer +
    bpjsTkJpEmployer +
    bpjsTkJkkEmployer +
    bpjsTkJkmEmployer;

  return {
    bpjsKesBaseWage: kesBase,
    bpjsKesWageCeiling: BPJS_CONFIG.kesehatan.wageCeiling,
    bpjsKesEmployeeRate: BPJS_CONFIG.kesehatan.employeeRate,
    bpjsKesEmployerRate: BPJS_CONFIG.kesehatan.employerRate,
    bpjsKesEmployeeAmount: bpjsKesEmployee,
    bpjsKesEmployerAmount: bpjsKesEmployer,

    bpjsTkJhtBaseWage: baseWage,
    bpjsTkJhtEmployeeRate: BPJS_CONFIG.ketenagakerjaan.jht.employeeRate,
    bpjsTkJhtEmployerRate: BPJS_CONFIG.ketenagakerjaan.jht.employerRate,
    bpjsTkJhtEmployeeAmount: bpjsTkJhtEmployee,
    bpjsTkJhtEmployerAmount: bpjsTkJhtEmployer,

    bpjsTkJpBaseWage: jpBase,
    bpjsTkJpWageCeiling: BPJS_CONFIG.ketenagakerjaan.jp.wageCeiling,
    bpjsTkJpEmployeeRate: BPJS_CONFIG.ketenagakerjaan.jp.employeeRate,
    bpjsTkJpEmployerRate: BPJS_CONFIG.ketenagakerjaan.jp.employerRate,
    bpjsTkJpEmployeeAmount: bpjsTkJpEmployee,
    bpjsTkJpEmployerAmount: bpjsTkJpEmployer,

    bpjsTkJkkRate: BPJS_CONFIG.ketenagakerjaan.jkk.employerRate,
    bpjsTkJkkAmount: bpjsTkJkkEmployer,
    bpjsTkJkmRate: BPJS_CONFIG.ketenagakerjaan.jkm.employerRate,
    bpjsTkJkmAmount: bpjsTkJkmEmployer,

    totalEmployeeDeduction,
    totalEmployerContribution,
    regulations: [
      BPJS_CONFIG.kesehatan.regulation,
      BPJS_CONFIG.ketenagakerjaan.jht.regulation,
      BPJS_CONFIG.ketenagakerjaan.jp.regulation,
      BPJS_CONFIG.ketenagakerjaan.jkk.regulation,
      BPJS_CONFIG.ketenagakerjaan.jkm.regulation,
    ],
  };
}
