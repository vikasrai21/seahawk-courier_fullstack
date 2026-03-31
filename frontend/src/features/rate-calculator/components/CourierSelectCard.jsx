import React from 'react';
import { ShieldCheck, Truck, Zap, Globe } from 'lucide-react';
import { COURIER_GROUPS } from '../core';

export default function CourierSelectCard({ selGroup, setSelGroup }) {
  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <Truck className="w-4 h-4 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">Select Courier</h3>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Partner Focus</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 flex-1">
        {COURIER_GROUPS.map((g) => (
          <button
            key={g.id}
            onClick={() => setSelGroup(g.id)}
            className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all relative group ${
              selGroup === g.id
                ? 'border-indigo-500 bg-indigo-50/50 ring-4 ring-indigo-50'
                : 'border-slate-50 bg-slate-50/30 hover:border-slate-200 hover:bg-white'
            }`}
          >
            {g.logo ? (
              <div className="h-8 w-full flex items-center justify-center mb-1">
                <img 
                  src={g.logo} 
                  alt={g.label} 
                  className={`max-h-full max-w-[80%] object-contain filter ${selGroup === g.id ? 'drop-shadow-sm' : 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100'} transition-all`}
                />
              </div>
            ) : (
              <span className="text-xl mb-1 group-hover:scale-110 transition-transform">{g.icon}</span>
            )}
            
            <span className={`text-[10px] font-bold text-center leading-tight ${
              selGroup === g.id ? 'text-indigo-700' : 'text-slate-500'
            }`}>
              {g.label}
            </span>
            {selGroup === g.id && (
              <div className="absolute top-1 right-1">
                <ShieldCheck className="w-3 h-3 text-indigo-500" />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-50">
        <p className="text-[10px] text-slate-400 italic">
          Selecting a specific partner focuses the ODA checks and serviceability alerts.
        </p>
      </div>
    </div>
  );
}
