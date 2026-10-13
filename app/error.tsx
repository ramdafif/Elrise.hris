'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <h2 className="text-2xl font-bold text-slate-900">Terjadi Kesalahan Sistem</h2>
      <p className="mt-2 text-sm text-slate-600">Silakan muat ulang halaman atau hubungi administrator sistem.</p>
      <button
        onClick={() => reset()}
        className="mt-6 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
      >
        Coba Lagi
      </button>
    </div>
  );
}
