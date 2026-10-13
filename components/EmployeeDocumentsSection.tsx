'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  Download,
  AlertCircle,
  Eye,
  Plus,
} from 'lucide-react';
import { EmployeeDocument, Employee, UserSession } from '@/lib/types';
import { formatDateId } from '@/lib/format';
import { checkPermission } from '@/lib/security/authorization';

interface EmployeeDocumentsSectionProps {
  documents: EmployeeDocument[];
  employee: Employee;
  session: UserSession;
  onRefresh?: () => void;
  showToast?: (text: string, type?: 'success' | 'error') => void;
}

export const EmployeeDocumentsSection: React.FC<EmployeeDocumentsSectionProps> = ({
  documents = [],
  employee,
  session,
  onRefresh,
  showToast = () => {},
}) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [docCategory, setDocCategory] = useState<EmployeeDocument['category']>('KTP');
  const [docName, setDocName] = useState('');
  const [docDescription, setDocDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter documents for this specific employee
  const empDocs = documents.filter((d) => d.employeeId === employee.id);

  // Permissions
  const canUpload =
    checkPermission(session.role, 'documents.upload') &&
    (session.role !== 'EMPLOYEE' || session.employeeId === employee.id);
  const canVerify = checkPermission(session.role, 'documents.verify');

  const getCategoryBadge = (category: EmployeeDocument['category']) => {
    switch (category) {
      case 'KTP':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'NPWP':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'BPJS':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'CONTRACT':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'CERTIFICATE':
      case 'DIPLOMA':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'KK':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'MEDICAL':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) {
      showToast('Nama dokumen wajib diisi.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': session.role,
          'x-employee-id': session.employeeId || '',
        },
        body: JSON.stringify({
          action: 'UPLOAD',
          documentData: {
            employeeId: employee.id,
            category: docCategory,
            fileName: docName,
            fileUrl: `/uploads/${docCategory.toLowerCase()}-${employee.id}.pdf`,
          },
          session,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(`Dokumen "${docName}" berhasil diunggah.`);
        setIsUploadModalOpen(false);
        setDocName('');
        setDocDescription('');
        if (onRefresh) onRefresh();
      } else {
        showToast(data.error || 'Gagal mengunggah dokumen.', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan jaringan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (docId: string, status: 'VERIFIED' | 'REJECTED') => {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': session.role,
          'x-employee-id': session.employeeId || '',
        },
        body: JSON.stringify({
          action: 'VERIFY',
          documentId: docId,
          status,
          session,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast(
          status === 'VERIFIED'
            ? 'Dokumen berhasil diverifikasi dan terarsip resmi.'
            : 'Dokumen ditandai tidak valid / ditolak.'
        );
        if (onRefresh) onRefresh();
      } else {
        showToast(data.error || 'Gagal memverifikasi dokumen.', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan jaringan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="employee-documents-section" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Arsip Berkas &amp; Dokumen Karyawan</h4>
          <p className="text-[11px] text-slate-500">
            KTP, NPWP, Kartu BPJS, Perjanjian Kerja (PKWT/PKWTT), dan Ijazah / Sertifikasi.
          </p>
        </div>

        {canUpload && (
          <button
            type="button"
            onClick={() => {
              setDocName(`Berkas ${docCategory} - ${employee.fullName}`);
              setIsUploadModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800 shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            Unggah Dokumen
          </button>
        )}
      </div>

      {empDocs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
          <FileText className="mx-auto h-8 w-8 text-slate-300 mb-1" />
          Belum ada berkas dokumen yang tersimpan untuk karyawan ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {empDocs.map((doc) => (
            <div
              key={doc.id}
              className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs space-y-2 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-slate-900 leading-tight">
                      {doc.fileName || `Dokumen ${doc.category}`}
                    </h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Diunggah: {formatDateId(doc.createdAt)}
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${getCategoryBadge(
                    doc.category
                  )}`}
                >
                  {doc.category}
                </span>
              </div>

              {doc.expiryDate && (
                <p className="text-[11px] text-slate-600 line-clamp-1 bg-slate-50 p-1.5 rounded border border-slate-100">
                  Masa Berlaku: {formatDateId(doc.expiryDate)}
                </p>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                <div className="flex items-center gap-1">
                  {doc.isVerified ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-[10px]">
                      <CheckCircle2 className="h-3 w-3" />
                      Terverifikasi
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-700 font-medium text-[10px]">
                      <Clock className="h-3 w-3" />
                      Menunggu Verifikasi
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  {canVerify && !doc.isVerified && (
                    <button
                      type="button"
                      onClick={() => handleVerify(doc.id, 'VERIFIED')}
                      className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                    >
                      Verifikasi
                    </button>
                  )}
                  <span className="text-[10px] text-slate-400 font-mono">
                    {doc.fileSizeKb ? `${doc.fileSizeKb} KB` : 'PDF'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Upload */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl border border-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-emerald-600" />
                  <h4 className="text-sm font-semibold text-slate-900">Unggah Berkas Karyawan</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpload} className="mt-4 space-y-3.5 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Kategori Berkas *
                  </label>
                  <select
                    value={docCategory}
                    onChange={(e) => {
                      const cat = e.target.value as EmployeeDocument['category'];
                      setDocCategory(cat);
                      setDocName(`Berkas ${cat} - ${employee.fullName}`);
                    }}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="KTP">KTP (Kartu Tanda Penduduk)</option>
                    <option value="NPWP">NPWP (Nomor Pokok Wajib Pajak)</option>
                    <option value="BPJS">Kartu BPJS Kesehatan / Ketenagakerjaan</option>
                    <option value="CONTRACT">Surat Perjanjian Kerja (PKWT / PKWTT)</option>
                    <option value="KK">Kartu Keluarga (KK)</option>
                    <option value="DIPLOMA">Ijazah Terakhir</option>
                    <option value="CERTIFICATE">Sertifikat Keahlian &amp; Pelatihan</option>
                    <option value="MEDICAL">Surat Keterangan Sehat / MCU</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Nama Dokumen *
                  </label>
                  <input
                    type="text"
                    required
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Keterangan Dokumen
                  </label>
                  <textarea
                    rows={2}
                    value={docDescription}
                    onChange={(e) => setDocDescription(e.target.value)}
                    placeholder="Contoh: Salinan KTP terlegalisir untuk verifikasi data BPJS..."
                    className="w-full rounded-lg border border-slate-200 p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="rounded-lg border-2 border-dashed border-slate-200 p-4 text-center bg-slate-50">
                  <Upload className="mx-auto h-6 w-6 text-slate-400 mb-1" />
                  <span className="text-[11px] font-medium text-slate-700 block">Pilih Berkas PDF / JPG</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Maksimal 5MB (Enkripsi PII Aktif)</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="rounded-lg bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Mengunggah...' : 'Simpan Dokumen'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
