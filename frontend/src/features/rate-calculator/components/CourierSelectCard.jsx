import React from 'react';
import { ShieldCheck, Truck } from 'lucide-react';
import { COURIER_GROUPS } from '../core';

export default function CourierSelectCard({ selGroup, setSelGroup }) {
  return (
    <div className="card h-full !p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
          <Truck className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800">Courier Focus</h3>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Partner Focus</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 flex-1">
        {COURIER_GROUPS.map((g) => (
          <button
            key={g.id}
            onClick={() => setSelGroup(g.id)}
            className={`flex flex-col items-center justify-center min-h-[82px] p-2.5 rounded-[20px] border transition-all relative group ${
              selGroup === g.id
                ? 'border-slate-900 bg-slate-900 text-white shadow-[0_12px_24px_rgba(15,23,42,0.12)]'
                : 'border-slate-200 bg-white hover:border-amber-200 hover:bg-amber-50/30'
            }`}
          >
            {g.logo ? (
              <div className="h-7 w-full flex items-center justify-center mb-1">
                <img 
                  src={g.logo} 
                  alt={g.label} 
                  className={`max-h-full max-w-[80%] object-contain filter ${selGroup === g.id ? 'brightness-0 invert opacity-95' : 'grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100'} transition-all`}
                />
              </div>
            ) : (
              <span className="text-xl mb-1 group-hover:scale-110 transition-transform">{g.icon}</span>
            )}
            
            <span className={`text-[10px] font-bold text-center leading-tight ${
              selGroup === g.id ? 'text-white' : 'text-slate-600'
            }`}>
              {g.label}
            </span>
            {selGroup === g.id && (
              <div className="absolute top-1 right-1">
                <ShieldCheck className="w-3 h-3 text-amber-300" />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100">
        <p className="text-[10px] text-slate-500">
          Narrow the list to one partner when you want cleaner serviceability and ODA feedback.
        </p>
      </div>
    </div>
  );
}
