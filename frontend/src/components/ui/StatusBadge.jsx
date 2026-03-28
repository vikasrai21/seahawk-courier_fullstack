import React from 'react';

const STATUS_COLORS = {
  Delivered:      { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' },
  InTransit:      { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-500' },
  Booked:         { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-500' },
  OutForDelivery: { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
  Delayed:        { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' },
  RTO:            { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' },
  Cancelled:      { bg: 'bg-red-50', text: 'text-red-600', dot: 'bg-red-400' },
};

export const STATUSES = Object.keys(STATUS_COLORS);

export function StatusBadge({ status, className = '' }) {
  // Normalize status key handling standard ones vs random courier outputs
  const normalizedKey = Object.keys(STATUS_COLORS).find(k => k.toLowerCase() === (status || '').toLowerCase());
  const theme = STATUS_COLORS[normalizedKey] || { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${theme.bg} ${theme.text} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${theme.dot} ${status === 'OutForDelivery' || status === 'InTransit' ? 'animate-pulse' : ''}`}></span>
      {status || 'Unknown'}
    </span>
  );
}
