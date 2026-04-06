import React, { useState } from 'react';
import { ChevronDown, RefreshCw } from 'lucide-react';
import { StatusBadge, normalizeStatus, formatStatusLabel } from './StatusBadge';
import api from '../../services/api';

const STATUS_TRANSITIONS = {
  Booked: ['PickedUp', 'Cancelled'],
  PickedUp: ['InTransit', 'RTO', 'Cancelled'],
  InTransit: ['OutForDelivery', 'RTO', 'Failed'],
  OutForDelivery: ['Delivered', 'Failed', 'RTO'],
  Failed: ['InTransit', 'RTO'],
  RTO: ['RTODelivered', 'InTransit'],
};

export default function QuickStatus({ shipment, onUpdate, toast }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const currentStatus = normalizeStatus(shipment.status);
  const transitions = STATUS_TRANSITIONS[currentStatus] || [];

  const update = async (newStatus) => {
    setSaving(true);
    setOpen(false);
    try {
      await api.patch(`/shipments/${shipment.id}/status`, { status: newStatus });
      onUpdate(shipment.id, newStatus);
      toast?.(`Updated to ${formatStatusLabel(newStatus)}`, 'success');
    } catch (err) {
      toast?.(err.message, 'error');
    } finally { 
      setSaving(false); 
    }
  };

  if (transitions.length === 0) {
    return <StatusBadge status={shipment.status} />;
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(o => !o);
        }}
        disabled={saving}
        className="flex items-center gap-1.5 px-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
        title="Click to update status"
      >
        <StatusBadge status={shipment.status} />
        {!saving && <ChevronDown size={12} className="text-slate-400 group-hover:text-slate-600 transition-colors" />}
        {saving && <RefreshCw size={12} className="text-slate-400 animate-spin" />}
      </button>

      {open && (
        <>
          <div 
            className="fixed inset-0 z-[60]" 
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }} 
          />
          <div className="absolute z-[70] top-full left-0 mt-2 min-w-[180px] p-1.5 bg-white dark:bg-slate-900 rounded-[20px] shadow-[0_20px_50px_rgba(15,23,42,0.15)] border border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-2 duration-200">
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Update Status</span>
            </div>
            <div className="space-y-0.5">
              {transitions.map(s => (
                <button 
                  key={s} 
                  onClick={(e) => {
                    e.stopPropagation();
                    update(s);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-2 group/item"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover/item:bg-blue-500 transition-colors" />
                  {formatStatusLabel(s)}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
