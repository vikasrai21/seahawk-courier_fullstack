import React from 'react';
import { ChevronDown } from 'lucide-react';

// Inline style-based pill badges — work in both light and dark contexts
const STATUS_STYLES = {
  Booked: { bg: 'rgba(37,99,235,0.08)', color: '#2563eb', dot: '#3b82f6', border: 'rgba(37,99,235,0.15)', pulse: false },
  InTransit: { bg: 'rgba(245,158,11,0.08)', color: '#d97706', dot: '#fbbf24', border: 'rgba(245,158,11,0.15)', pulse: true },
  OutForDelivery: { bg: 'rgba(124,58,237,0.08)', color: '#7c3aed', dot: '#a78bfa', border: 'rgba(124,58,237,0.15)', pulse: true },
  Delivered: { bg: 'rgba(16,185,129,0.08)', color: '#059669', dot: '#10b981', border: 'rgba(16,185,129,0.15)', pulse: false },
  Failed: { bg: 'rgba(239,68,68,0.08)', color: '#dc2626', dot: '#ef4444', border: 'rgba(239,68,68,0.15)', pulse: false },
  NDR: { bg: 'rgba(249,115,22,0.08)', color: '#ea580c', dot: '#f97316', border: 'rgba(249,115,22,0.15)', pulse: true },
  PickedUp: { bg: 'rgba(71,85,105,0.08)', color: '#475569', dot: '#94a3b8', border: 'rgba(71,85,105,0.15)', pulse: false },
  Delayed: { bg: 'rgba(244,63,94,0.08)', color: '#e11d48', dot: '#fb7185', border: 'rgba(244,63,94,0.15)', pulse: false },
  RTO: { bg: 'rgba(190,18,60,0.08)', color: '#be123c', dot: '#e11d48', border: 'rgba(190,18,60,0.15)', pulse: false },
  RTODelivered: { bg: 'rgba(146,64,14,0.08)', color: '#92400e', dot: '#d97706', border: 'rgba(146,64,14,0.15)', pulse: false },
  Cancelled: { bg: 'rgba(100,116,139,0.08)', color: '#475569', dot: '#94a3b8', border: 'transparent', pulse: false },
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
  'failed': 'Failed',
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
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] text-[10px] font-black uppercase tracking-wider transition-all duration-300 backdrop-blur-sm ${className}`}
      style={{
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border || 'transparent'}`,
        whiteSpace: 'nowrap',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
      }}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.pulse ? 'animate-shk-badge-pulse' : ''}`}
        style={{ background: s.dot }} />
      {label}
      {onChange && <ChevronDown size={10} className="ml-0.5 opacity-60" />}
      <style>{`
        @keyframes shk-badge-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.8); }
        }
        .animate-shk-badge-pulse { animation: shk-badge-pulse 2s ease-in-out infinite; }
      `}</style>
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
