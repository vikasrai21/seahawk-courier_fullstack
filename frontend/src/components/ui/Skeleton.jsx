import React from 'react';

const SKELETON_STYLES = "animate-pulse bg-gray-200 rounded";

export function Skeleton({ className = '', style }) {
  return (
    <div className={`${SKELETON_STYLES} ${className}`} style={style} />
  );
}

export function SkeletonText({ lines = 1, className = '', lastLineWidth = '70%' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className={`${SKELETON_STYLES} h-4 w-full`} 
          style={{ width: i === lines - 1 && lines > 1 ? lastLineWidth : '100%' }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 rounded-3xl p-5 animate-pulse ${className}`}>
      <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-full w-1/3 mb-4" />
      <div className="h-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl w-1/2 mb-2" />
      <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full w-1/4" />
    </div>
  );
}

export function SkeletonTable({ rows = 6, cols = 5, className = '' }) {
  return (
    <div className={`w-full space-y-3 animate-pulse p-4 rounded-3xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 ${className}`}>
      {/* Header Row */}
      <div className="flex gap-4 mb-6">
        {[...Array(cols)].map((_, i) => (
          <div key={i} className="h-6 bg-slate-100 dark:bg-slate-800 rounded-lg flex-1" />
        ))}
      </div>
      {/* Body Rows */}
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4">
          {[...Array(cols)].map((_, j) => (
            <div key={j} className="h-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
