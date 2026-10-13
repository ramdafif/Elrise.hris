'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { History, Shield, Filter, Search, Clock, Tag } from 'lucide-react';
import { AuditLog } from '@/lib/types';
import { formatDateTimeId } from '@/lib/format';

interface AuditLogViewProps {
  auditLogs: AuditLog[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ auditLogs }) => {
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredLogs = auditLogs.filter((log) => {
    const matchModule = selectedModule === 'ALL' || log.module === selectedModule;
    const matchSearch =
      searchTerm === '' ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.reason && log.reason.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchModule && matchSearch;
  });

  const getActionBadgeColor = (action: AuditLog['action']) => {
    switch (action) {
      case 'LOCK':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'APPROVE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'REJECT':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'CREATE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'UPDATE':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">Jejak Audit &amp; Keamanan (Audit Trail)</h2>
        <p className="text-xs text-slate-500">
          Log Aktivitas Permanen &amp; Immutable untuk Kepatuhan Regulasi, ISO, dan Audit Internal
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="w-full sm:w-72 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari user, aksi, atau alasan audit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">Semua Modul</option>
            <option value="PAYROLL">Payroll (Penggajian)</option>
            <option value="EMPLOYEE">Employee (Karyawan)</option>
            <option value="ATTENDANCE">Attendance (Presensi)</option>
            <option value="LEAVE">Leave (Cuti)</option>
            <option value="OVERTIME">Overtime (Lembur)</option>
            <option value="TAX_RULE">Tax Rule (Regulasi Pajak)</option>
          </select>
        </div>
      </div>

      {/* Audit Log Content */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* MOBILE VIEW: Cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Tidak ada log audit yang sesuai kriteria filter.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatDateTimeId(log.timestamp)}</span>
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${getActionBadgeColor(
                      log.action
                    )}`}
                  >
                    {log.action}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{log.userName}</p>
                    <span className="text-[10px] text-slate-400 font-medium">{log.userRole}</span>
                  </div>
                  <div className="text-right">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                      {log.module}
                    </span>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">{log.entity}</p>
                  </div>
                </div>

                {log.reason && (
                  <div className="rounded-lg bg-slate-50 p-2 text-xs text-slate-700 border border-slate-100">
                    <span className="font-semibold text-slate-800">Alasan/Catatan: </span>
                    {log.reason}
                  </div>
                )}

                {log.newValues && (
                  <details className="text-[11px] text-slate-500">
                    <summary className="cursor-pointer text-emerald-700 font-medium hover:underline">
                      Lihat Rincian Perubahan Data
                    </summary>
                    <pre className="mt-1.5 overflow-x-auto rounded-lg bg-slate-900 p-2.5 font-mono text-[10px] text-slate-200">
                      {JSON.stringify(log.newValues, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))
          )}
        </div>

        {/* DESKTOP VIEW: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="px-4 py-3">Waktu (WIB)</th>
                <th className="px-4 py-3">Pengguna &amp; Peran</th>
                <th className="px-4 py-3">Aksi</th>
                <th className="px-4 py-3">Modul &amp; Entitas</th>
                <th className="px-4 py-3">Keterangan / Alasan</th>
                <th className="px-4 py-3">Perubahan Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-700 whitespace-nowrap">
                    {formatDateTimeId(log.timestamp)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{log.userName}</p>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {log.userRole}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${getActionBadgeColor(
                        log.action
                      )}`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{log.module}</p>
                    <p className="text-[11px] font-mono text-slate-400">{log.entity}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700 max-w-xs">
                    {log.reason || '-'}
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-500 max-w-xs">
                    {log.newValues ? (
                      <span className="block truncate text-slate-700" title={JSON.stringify(log.newValues)}>
                        {JSON.stringify(log.newValues)}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};
