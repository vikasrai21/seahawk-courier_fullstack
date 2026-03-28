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
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 ${className}`}>
      <Skeleton className="h-4 w-1/3 mb-4" />
      <Skeleton className="h-8 w-1/2 mb-2" />
      <Skeleton className="h-3 w-1/4" />
    </div>
  );
}
