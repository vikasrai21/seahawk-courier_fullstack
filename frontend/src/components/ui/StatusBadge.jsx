import React from 'react';

// Inline style-based pill badges — work in both light and dark contexts
const STATUS_STYLES = {
  Delivered: { bg: 'rgba(12,122,82,0.1)', color: '#0c7a52', dot: '#0c7a52', pulse: false },
  InTransit: { bg: 'rgba(37,99,235,0.1)', color: '#1d4ed8', dot: '#3b82f6', pulse: true },
  Booked: { bg: 'rgba(100,116,139,0.1)', color: '#475569', dot: '#64748b', pulse: false },
  OutForDelivery: { bg: 'rgba(217,119,6,0.1)', color: '#b45309', dot: '#f59e0b', pulse: true },
  Delayed: { bg: 'rgba(234,88,12,0.1)', color: '#c2410c', dot: '#f97316', pulse: false },
  PickedUp: { bg: 'rgba(124,58,237,0.1)', color: '#7c3aed', dot: '#8b5cf6', pulse: false },
  Failed: { bg: 'rgba(239,68,68,0.1)', color: '#dc2626', dot: '#ef4444', pulse: false },
  RTO: { bg: 'rgba(200,48,58,0.1)', color: '#c8303a', dot: '#ef4444', pulse: false },
  RTODelivered: { bg: 'rgba(120,53,15,0.1)', color: '#92400e', dot: '#b45309', pulse: false },
  Cancelled: { bg: 'rgba(239,68,68,0.07)', color: '#dc2626', dot: '#ef4444', pulse: false },
};

export const STATUSES = Object.keys(STATUS_STYLES);
export const STATUS_OPTIONS = [
  'Booked',
  'PickedUp',
  'InTransit',
  'OutForDelivery',
  'Delivered',
  'Failed',
  'Delayed',
  'RTO',
  'RTODelivered',
  'Cancelled',
];

const ALIASES = {
  'picked up': 'PickedUp',
  pickedup: 'PickedUp',
  'in transit': 'InTransit',
  intransit: 'InTransit',
  'out for delivery': 'OutForDelivery',
  outfordelivery: 'OutForDelivery',
  'rto delivered': 'RTODelivered',
  rtodelivered: 'RTODelivered',
};

const LABELS = {
  Booked: 'Booked',
  PickedUp: 'Picked Up',
  InTransit: 'In Transit',
  OutForDelivery: 'Out for Delivery',
  Delivered: 'Delivered',
  Failed: 'Failed',
  Delayed: 'Delayed',
  RTO: 'RTO',
  RTODelivered: 'RTO Delivered',
  Cancelled: 'Cancelled',
};

export function normalizeStatus(status) {
  const raw = String(status || '').trim();
  if (!raw) return raw;
  const canonical = ALIASES[raw.toLowerCase()] || raw;
  return Object.keys(STATUS_STYLES).find((key) => key.toLowerCase() === canonical.toLowerCase()) || canonical;
}

export function formatStatusLabel(status) {
  const canonical = normalizeStatus(status);
  return LABELS[canonical] || status || 'Unknown';
}

export function StatusBadge({ status, className = '' }) {
  const key = normalizeStatus(status);
  const s = STATUS_STYLES[key] || { bg: 'rgba(100,116,139,0.1)', color: '#475569', dot: '#94a3b8', pulse: false };
  const label = formatStatusLabel(status);

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 10px', borderRadius: 99,
        fontSize: 11, fontWeight: 700, letterSpacing: '0.02em',
        background: s.bg, color: s.color,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: s.dot, flexShrink: 0,
        animation: s.pulse ? 'shkPulse 1.6s ease-in-out infinite' : 'none',
      }} />
      {label}
      <style>{`@keyframes shkPulse { 0%,100%{opacity:1} 50%{opacity:0.35} }`}</style>
    </span>
  );
}
