'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  FileCheck2,
  ExternalLink,
  ShieldCheck,
  Calculator,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { GovernmentRegulation, TaxPtkpStatus } from '@/lib/types';
import { calculatePph21Monthly, getTerCategory } from '@/lib/payroll/tax';
import { formatIdr } from '@/lib/format';

interface TaxRegulationViewProps {
  regulations: GovernmentRegulation[];
}

export const TaxRegulationView: React.FC<TaxRegulationViewProps> = ({
  regulations,
}) => {
  // Interactive Simulator State
  const [simGross, setSimGross] = useState<number>(18500000);
  const [simPtkp, setSimPtkp] = useState<TaxPtkpStatus>('TK_0');
  const [simHasNpwp, setSimHasNpwp] = useState<boolean>(true);

  const simResult = calculatePph21Monthly(simGross, simPtkp, simHasNpwp);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          Kepatuhan Regulasi Pemerintah & Mesin PPh 21 TER
        </h2>
        <p className="text-xs text-slate-500">
          Aturan Perpajakan &amp; Ketenagakerjaan Resmi Indonesia (DJP Kemenkeu &amp; Kemenaker RI)
        </p>
      </div>

      {/* Interactive TER PPh 21 Calculator Simulator */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="rounded-lg bg-amber-50 p-2 text-amber-600 border border-amber-200">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Simulator Transparansi PPh 21 TER (PP 58/2023 &amp; PMK 168/2023)
            </h3>
            <p className="text-xs text-slate-500">
              Uji coba perhitungan instan dengan transparansi langkah demi langkah
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inputs */}
          <div className="space-y-3 lg:col-span-1 border-b lg:border-b-0 lg:border-r border-slate-100 pb-4 lg:pb-0 lg:pr-6">
            <div>
              <label className="text-[11px] font-medium text-slate-700">Penghasilan Bruto Sebulan (IDR)</label>
              <input
                type="number"
                step={500000}
                min={0}
                value={simGross}
                onChange={(e) => setSimGross(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono text-sm font-bold text-slate-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-700">Status PTKP Karyawan</label>
              <select
                value={simPtkp}
                onChange={(e) => setSimPtkp(e.target.value as TaxPtkpStatus)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-hidden"
              >
                <option value="TK_0">TK/0 - Tidak Kawin, 0 Tanggungan (TER A)</option>
                <option value="TK_1">TK/1 - Tidak Kawin, 1 Tanggungan (TER A)</option>
                <option value="K_0">K/0 - Kawin, 0 Tanggungan (TER A)</option>
                <option value="TK_2">TK/2 - Tidak Kawin, 2 Tanggungan (TER B)</option>
                <option value="TK_3">TK/3 - Tidak Kawin, 3 Tanggungan (TER B)</option>
                <option value="K_1">K/1 - Kawin, 1 Tanggungan (TER B)</option>
                <option value="K_2">K/2 - Kawin, 2 Tanggungan (TER B)</option>
                <option value="K_3">K/3 - Kawin, 3 Tanggungan (TER C)</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-700 pt-1">
              <input
                type="checkbox"
                checked={simHasNpwp}
                onChange={(e) => setSimHasNpwp(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              Memiliki NPWP / NIK Terverifikasi DJP
            </label>
          </div>

          {/* Outputs & Steps */}
          <div className="lg:col-span-2 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                <span className="text-[11px] text-slate-500">Kategori TER:</span>
                <p className="text-xl font-bold text-slate-900 mt-0.5">
                  Kategori {simResult.terCategory}
                </p>
                <span className="text-[10px] text-slate-500">Status: {simPtkp.replace('_', '/')}</span>
              </div>

              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                <span className="text-[11px] text-slate-500">Tarif Efektif Rata-Rata:</span>
                <p className="text-xl font-bold font-mono text-amber-600 mt-0.5">
                  {simResult.terRatePercent}%
                </p>
                <span className="text-[10px] text-slate-500">Lampiran PMK 168/2023</span>
              </div>

              <div className="rounded-lg bg-amber-50 p-3 border border-amber-200">
                <span className="text-[11px] font-semibold text-amber-900">PPh 21 Terutang Masa Ini:</span>
                <p className="text-xl font-bold font-mono text-amber-800 mt-0.5">
                  {formatIdr(simResult.pph21MonthlyAmount)}
                </p>
                <span className="text-[10px] text-amber-700">Dipotong dari slip gaji</span>
              </div>
            </div>

            {/* Step-by-step transparency audit trail */}
            <div className="rounded-lg border border-slate-200 p-3 bg-white">
              <h5 className="text-xs font-semibold text-slate-900 mb-2">
                Rincian Transparansi Langkah Perhitungan:
              </h5>
              <div className="divide-y divide-slate-100 text-xs">
                {simResult.calculationSteps.map((step, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 gap-0.5 sm:gap-2">
                    <span className="text-slate-600">{step.description}</span>
                    <span className="font-mono font-bold text-slate-900 shrink-0">{step.amountOrRate}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Official Government Regulations Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {regulations.map((reg) => (
          <div key={reg.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                  {reg.regulationNumber}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5" /> Terverifikasi DJP/Kemenaker
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 mt-2.5">
                {reg.regulationName}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Sumber Resmi: <strong>{reg.officialSource}</strong> &bull; Berlaku Efektif: {reg.effectiveFrom} (Versi {reg.version})
              </p>

              <div className="mt-3 rounded-lg bg-slate-50 p-3 border border-slate-200 text-xs space-y-1">
                {Object.entries(reg.parameters).map(([key, val]) => (
                  <div key={key} className="flex justify-between text-[11px]">
                    <span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                    <span className="font-medium text-slate-800 font-mono text-right max-w-xs truncate">
                      {Array.isArray(val) ? val.join(', ') : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">Terakhir diverifikasi: {reg.verifiedAt}</span>
              <a
                href={reg.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-emerald-600 font-medium hover:underline"
              >
                <span>JDIH Resmi</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
