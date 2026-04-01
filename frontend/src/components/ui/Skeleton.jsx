import React from 'react';

const SKELETON_STYLES = "relative overflow-hidden rounded-2xl bg-slate-100 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent";

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
    <div className={`rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.05)] ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <div className={`${SKELETON_STYLES} h-3 w-20 rounded-full`} />
        <div className={`${SKELETON_STYLES} h-9 w-9 rounded-2xl`} />
      </div>
      <div className={`${SKELETON_STYLES} mb-3 h-8 w-1/2 rounded-2xl`} />
      <div className={`${SKELETON_STYLES} h-3 w-1/3 rounded-full`} />
    </div>
  );
}

export function SkeletonTable({ rows = 6, cols = 5, className = '' }) {
  return (
    <div className={`w-full space-y-3 p-4 rounded-[28px] bg-white border border-slate-200/80 shadow-[0_14px_34px_rgba(15,23,42,0.05)] ${className}`}>
      {/* Header Row */}
      <div className="flex gap-4 mb-6">
        {[...Array(cols)].map((_, i) => (
          <div key={i} className={`${SKELETON_STYLES} h-6 rounded-xl flex-1`} />
        ))}
      </div>
      {/* Body Rows */}
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4">
          {[...Array(cols)].map((_, j) => (
            <div key={j} className={`${SKELETON_STYLES} h-12 rounded-2xl flex-1`} />
          ))}
        </div>
      ))}
    </div>
  );
}
