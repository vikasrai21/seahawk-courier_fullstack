import React from 'react';
import { Target, Activity, Zap, Layers } from 'lucide-react';

export default function SensitivityTable({
  locInfo,
  shipType,
  visibleCouriers,
  sensitivityData,
  chargeWt,
  getPerCourierSell,
  rnd,
  fmt,
}) {
  return (
    <div className="card-premium overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl">
      <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-white/[0.02] flex items-center justify-between">
        <div>
           <div className="flex items-center gap-3 mb-1">
              <Activity size={18} className="text-blue-500" />
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase font-heading">Tactical Mass Matrix</h2>
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest uppercase">
              Terminal: {locInfo?.label} · Vector: {shipType} · Multi-Node Analysis
           </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
           <Zap size={14} className="text-blue-500" />
           <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Live Sensitivity</span>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
              <th className="px-6 py-4 text-left">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payload (KG)</span>
              </th>
              {visibleCouriers.map((courier) => (
                <th key={courier.id} className="px-6 py-4 text-right">
                  <div className="flex flex-col items-end">
                     <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight truncate max-w-[100px]">
                        {courier.label.replace('Trackon ', 'TK ').replace('Delhivery ', 'DL ').replace('BlueDart ', 'BD ').replace('DTDC ', '')}
                     </span>
                     <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter opacity-60">Delta Node</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {sensitivityData.map((row, index) => {
              const isCurrent = row.w === chargeWt;
              return (
                <tr key={index} className={`transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02] ${isCurrent ? 'bg-blue-500/[0.03] dark:bg-blue-500/[0.05]' : ''}`}>
                  <td className="px-6 py-3.5 relative">
                    {isCurrent && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />}
                    <div className="flex items-center gap-3">
                       <span className={`text-base font-black tabular-nums tracking-tight ${isCurrent ? 'text-blue-600' : 'text-slate-900 dark:text-slate-200'}`}>
                          {row.w.toFixed(2)}
                       </span>
                       {isCurrent && (
                          <span className="text-[8px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg shadow-blue-600/20">Active</span>
                       )}
                    </div>
                  </td>
                  {visibleCouriers.map((courier) => {
                    const sell = getPerCourierSell(courier);
                    const cost = row[courier.id];
                    const margin = cost && sell ? rnd(((sell - cost) / sell) * 100) : null;
                    const isProfit = margin > 15;
                    const isLoss = margin < 0;

                    return (
                      <td key={courier.id} className="px-6 py-3.5 text-right font-mono transition-all duration-300">
                        {cost ? (
                          <div className="flex flex-col items-end">
                             <div className={`text-sm font-black tabular-nums transition-colors ${isLoss ? 'text-rose-500' : isProfit ? 'text-emerald-500' : 'text-slate-900 dark:text-slate-200'}`}>
                                {fmt(cost)}
                             </div>
                             <div className={`text-[9px] font-bold uppercase tracking-tighter opacity-80 ${isLoss ? 'text-rose-400' : isProfit ? 'text-emerald-400' : 'text-slate-500'}`}>
                                {margin !== null ? `${margin > 0 ? '+' : ''}${margin.toFixed(0)}% Margin` : ''}
                             </div>
                          </div>
                        ) : (
                          <span className="text-slate-200 dark:text-slate-800 text-xl font-thin tracking-widest opacity-40">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="px-8 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-6">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
               <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Optimized Delta (&gt;15%)</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Negative Convergence</span>
            </div>
         </div>
         <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic opacity-60">Quantifying mass vs. contract yield</span>
      </div>
    </div>
  );
}
