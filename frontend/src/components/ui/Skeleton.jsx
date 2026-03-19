// Skeleton.jsx — Skeleton loader component
// Usage: <Skeleton /> or <Skeleton w="200px" h={24} radius={8} />
// Also exports SkeletonTable, SkeletonCard for common patterns

import React from 'react';

const shimmerStyle = {
  background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
  backgroundSize: '200% 100%',
  animation: 'skeleton-shimmer 1.4s infinite',
  borderRadius: 6,
};

// Inject animation once
if (typeof document !== 'undefined' && !document.getElementById('skeleton-style')) {
  const style = document.createElement('style');
  style.id = 'skeleton-style';
  style.textContent = `@keyframes skeleton-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`;
  document.head.appendChild(style);
}

export function Skeleton({ w = '100%', h = 16, radius = 6, style: extraStyle = {} }) {
  return (
    <div style={{ ...shimmerStyle, width: w, height: h, borderRadius: radius, ...extraStyle }} />
  );
}

// ── Skeleton table rows ───────────────────────────────────────────────────
export function SkeletonRows({ rows = 5, cols = 6 }) {
  return (
    <>
      {Array(rows).fill(0).map((_, i) => (
        <tr key={i}>
          {Array(cols).fill(0).map((__, j) => (
            <td key={j} style={{ padding: '12px 16px' }}>
              <Skeleton h={14} w={j === 0 ? '60%' : j === cols - 1 ? '40%' : '80%'} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ── Skeleton card grid ────────────────────────────────────────────────────
export function SkeletonCards({ count = 4 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
      {Array(count).fill(0).map((_, i) => (
        <div key={i} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Skeleton h={10} w="40%" />
          <Skeleton h={28} w="70%" />
          <Skeleton h={10} w="55%" />
        </div>
      ))}
    </div>
  );
}

// ── Skeleton list items ───────────────────────────────────────────────────
export function SkeletonList({ count = 5 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array(count).fill(0).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 0' }}>
          <Skeleton w={32} h={32} radius={8} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Skeleton h={13} w="60%" />
            <Skeleton h={10} w="40%" />
          </div>
          <Skeleton h={20} w={60} radius={20} />
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
