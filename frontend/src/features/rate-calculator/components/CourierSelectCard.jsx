import React from 'react';
import { ShieldCheck, Target, Layers } from 'lucide-react';
import { COURIER_GROUPS } from '../core';

export default function CourierSelectCard({ selGroup, setSelGroup }) {
  return (
    <div className="rate-section h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
           <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-amber-500/10 text-amber-600">
              <Target size={14} />
           </div>
           <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Partner matrix</h3>
              <p className="text-xs text-slate-500">Filter by group</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 flex-1">
        {COURIER_GROUPS.map((g) => {
          const active = selGroup === g.id;
          return (
            <button
              key={g.id}
              onClick={() => setSelGroup(g.id)}
              className={`flex flex-col items-center justify-center min-h-[62px] p-2.5 rounded-lg border transition-all duration-300 relative group/item ${
                active
                  ? 'border-slate-900 dark:border-slate-700 bg-slate-900 text-white'
                  : 'border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 text-slate-600 hover:border-amber-500/30 hover:bg-amber-500/[0.03]'
              }`}
            >
              {g.logo ? (
                <div className="h-5 w-full flex items-center justify-center mb-1.5">
                  <img 
                    src={g.logo} 
                    alt={g.label} 
                    className={`max-h-full max-w-[85%] object-contain transition-all duration-500 ${active ? 'brightness-0 invert opacity-100 scale-110' : 'grayscale opacity-40 group-hover/item:grayscale-0 group-hover/item:opacity-100 group-hover/item:scale-110'}`}
                  />
                </div>
              ) : (
                <span className={`text-lg mb-1 transition-transform duration-500 ${active ? 'scale-110' : 'opacity-40 group-hover/item:scale-110 group-hover/item:opacity-100'}`}>{g.icon}</span>
              )}
              
              <span className={`text-[11px] font-semibold text-center leading-none ${active ? 'text-white' : 'text-slate-500 group-hover/item:text-slate-700 dark:group-hover/item:text-slate-200'}`}>
                {g.label}
              </span>

              {active && (
                <div className="absolute top-2 right-2 animate-in zoom-in-50 duration-300">
                  <ShieldCheck size={14} className="text-amber-400" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-start gap-2">
         <Layers size={12} className="text-slate-300 shrink-0 mt-0.5" />
         <p className="text-xs text-slate-500">
           Narrow results by partner group.
         </p>
      </div>
    </div>
  );
}
