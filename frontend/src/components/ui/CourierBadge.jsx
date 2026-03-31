import React from 'react';

const COURIER_CONFIG = {
  BlueDart: { bg: '#eef2ff', color: '#1e40af', border: '#bfdbfe', icon: 'BD' },
  DTDC:     { bg: '#fff1f2', color: '#be123c', border: '#fecdd3', icon: 'DT' },
  Delhivery:{ bg: '#f8fafc', color: '#0f172a', border: '#e2e8f0', icon: 'DL' },
  FedEx:    { bg: '#f5f3ff', color: '#5b21b6', border: '#ddd6fe', icon: 'FX' },
  DHL:      { bg: '#fefce8', color: '#854d0e', border: '#fef08a', icon: 'DH' },
  'Ecom Express': { bg: '#ecfdf5', color: '#065f46', border: '#d1fae5', icon: 'EX' },
  XpressBees:     { bg: '#fff7ed', color: '#9a3412', border: '#ffedd5', icon: 'XB' },
  Shadowfax:      { bg: '#f0f9ff', color: '#075985', border: '#bae6fd', icon: 'SF' },
};

export function CourierBadge({ name, className = '' }) {
  const config = COURIER_CONFIG[name] || { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0', icon: '??' };
  
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div 
        style={{ 
          backgroundColor: config.bg, 
          color: config.color, 
          borderColor: config.border 
        }}
        className="w-6 h-6 rounded-lg border flex items-center justify-center text-[8px] font-black tracking-tighter shadow-sm"
      >
        {config.icon}
      </div>
      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{name || 'Unknown'}</span>
    </div>
  );
}
