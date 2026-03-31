import React from 'react';
import { ChevronDown } from 'lucide-react';

// Inline style-based pill badges — work in both light and dark contexts
const STATUS_STYLES = {
  // User requested: Booked (blue)
  Booked: { bg: 'rgba(59,130,246,0.1)', color: '#2563eb', dot: '#3b82f6', border: 'rgba(59,130,246,0.2)', pulse: false },
  // User requested: In Transit (amber)
  InTransit: { bg: 'rgba(245,158,11,0.1)', color: '#d97706', dot: '#fbbf24', border: 'rgba(245,158,11,0.2)', pulse: true },
  // User requested: Out for Delivery (purple)
  OutForDelivery: { bg: 'rgba(168,85,247,0.1)', color: '#9333ea', dot: '#a855f7', border: 'rgba(168,85,247,0.2)', pulse: true },
  // User requested: Delivered (green)
  Delivered: { bg: 'rgba(34,197,94,0.1)', color: '#16a34a', dot: '#22c55e', border: 'rgba(34,197,94,0.2)', pulse: false },
  // User requested: Failed (red)
  Failed: { bg: 'rgba(239,68,68,0.1)', color: '#dc2626', dot: '#ef4444', border: 'rgba(239,68,68,0.2)', pulse: false },
  // User requested: NDR (orange)
  NDR: { bg: 'rgba(249,115,22,0.1)', color: '#ea580c', dot: '#f97316', border: 'rgba(249,115,22,0.2)', pulse: true },
  
  // Exsting / Others
  PickedUp: { bg: 'rgba(148,163,184,0.1)', color: '#475569', dot: '#94a3b8', border: 'rgba(148,163,184,0.2)', pulse: false },
  Delayed: { bg: 'rgba(244,63,94,0.06)', color: '#e11d48', dot: '#fb7185', border: 'rgba(244,63,94,0.15)', pulse: false },
  RTO: { bg: 'rgba(190,18,60,0.1)', color: '#be123c', dot: '#e11d48', border: 'rgba(190,18,60,0.2)', pulse: false },
  RTODelivered: { bg: 'rgba(146,64,14,0.1)', color: '#92400e', dot: '#d97706', border: 'rgba(146,64,14,0.2)', pulse: false },
  Cancelled: { bg: 'rgba(100,116,139,0.1)', color: '#475569', dot: '#94a3b8', border: 'transparent', pulse: false },
};

export const STATUSES = Object.keys(STATUS_STYLES);
export const STATUS_OPTIONS = [
  'Booked',
  'PickedUp',
  'InTransit',
  'OutForDelivery',
  'Delivered',
  'Failed',
  'NDR',
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
  'ndr': 'NDR',
};

const LABELS = {
  Booked: 'Booked',
  PickedUp: 'Picked Up',
  InTransit: 'In Transit',
  OutForDelivery: 'Out for Delivery',
  Delivered: 'Delivered',
  Failed: 'Failed',
  NDR: 'NDR',
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

export function StatusBadge({ status, className = '', onChange }) {
  const key = normalizeStatus(status);
  const s = STATUS_STYLES[key] || { bg: 'rgba(100,116,139,0.1)', color: '#475569', dot: '#94a3b8', border: 'transparent', pulse: false };
  const label = formatStatusLabel(status);

  const badgeObj = (
    <span
      className={className}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 10px', borderRadius: 10,
        fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
        background: s.bg, color: s.color,
        border: `1px solid ${s.border || 'transparent'}`,
        whiteSpace: 'nowrap',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
      }}
    >
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: s.dot, flexShrink: 0,
        animation: s.pulse ? 'shkPulse 1.6s ease-in-out infinite' : 'none',
      }} />
      {label}
      {onChange && <ChevronDown style={{ width: 12, height: 12, marginLeft: 2, flexShrink: 0, opacity: 0.7 }} />}
      <style>{`@keyframes shkPulse { 0%,100%{opacity:1} 50%{opacity:0.35} }`}</style>
    </span>
  );

  if (!onChange) return badgeObj;

  return (
    <div className="relative inline-block hover:opacity-80 transition-opacity cursor-pointer">
      {badgeObj}
      <select 
        value={key}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        title="Update Status"
      >
        {STATUS_OPTIONS.map(opt => (
          <option key={opt} value={opt}>{LABELS[opt] || opt}</option>
        ))}
      </select>
    </div>
  );
}
