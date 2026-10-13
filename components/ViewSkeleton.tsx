'use client';

import React from 'react';

export interface ViewSkeletonProps {
  title?: string;
  subtitle?: string;
}

export const ViewSkeleton: React.FC<ViewSkeletonProps> = ({
  title,
  subtitle,
}) => {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={title ? `Memuat ${title}...` : 'Memuat modul...'}
      className="space-y-6 animate-pulse"
    >
      {/* Header Skeleton */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          {title ? (
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-800">{title}</h2>
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
          ) : (
            <div className="h-6 w-48 rounded-lg bg-slate-200" />
          )}
          {subtitle ? (
            <p className="text-xs text-slate-500">{subtitle}</p>
          ) : (
            <div className="h-3.5 w-72 rounded-md bg-slate-200/80" />
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="h-9 w-32 rounded-lg bg-slate-200" />
        </div>
      </div>

      {/* KPI / Metric Cards Grid Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 rounded bg-slate-200" />
              <div className="h-8 w-8 rounded-lg bg-slate-100" />
            </div>
            <div className="h-7 w-32 rounded-md bg-slate-200" />
            <div className="h-3 w-40 rounded bg-slate-100" />
          </div>
        ))}
      </div>

      {/* Main Content / Table Skeleton */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {/* Filter bar placeholder */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="h-9 w-full sm:w-72 rounded-lg bg-slate-100" />
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="h-9 w-28 rounded-lg bg-slate-100" />
            <div className="h-9 w-28 rounded-lg bg-slate-100" />
          </div>
        </div>

        {/* Rows placeholder */}
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200" />
                <div className="space-y-1.5">
                  <div className="h-4 w-36 rounded bg-slate-200" />
                  <div className="h-3 w-24 rounded bg-slate-100" />
                </div>
              </div>
              <div className="hidden sm:block h-3.5 w-28 rounded bg-slate-100" />
              <div className="hidden md:block h-6 w-20 rounded-full bg-slate-100" />
              <div className="h-8 w-16 rounded-lg bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ViewSkeleton;
