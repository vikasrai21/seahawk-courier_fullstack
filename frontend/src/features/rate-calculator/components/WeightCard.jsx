import { Target, Weight, Zap } from 'lucide-react';

export default function WeightCard({
  weight,
  setWeight,
  useVol,
  setUseVol,
  dims,
  setDims,
  chargeWt,
  volWt,
  targetMargin,
  setTargetMargin,
  results,
  selGroup,
  shipType,
  fmt,
}) {
  const volumetricDivisor = (selGroup === 'B2B' || selGroup === 'LTL' || shipType === 'surface') ? 4500 : 5000;

  return (
    <div className="rounded-[32px] border border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-6 shadow-sm backdrop-blur-xl relative overflow-hidden group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
           <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${chargeWt > 0 ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-500/10 text-slate-400'}`}>
              <Weight size={16} />
           </div>
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">Mass Analytics</h3>
        </div>
        {chargeWt > 0 && (
          <div className="animate-in fade-in zoom-in-95 duration-300 px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20">
            {chargeWt.toFixed(2)} KG
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="relative">
          <input 
            type="number" 
            step="0.1" 
            min="0" 
            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-sm font-black placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 transition-all tabular-nums" 
            placeholder="Dead Weight (kg)…" 
            value={weight} 
            onChange={(e) => setWeight(e.target.value)} 
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="flex items-center justify-between cursor-pointer group/vol">
            <div className="flex items-center gap-2">
               <div className="relative">
                 <input type="checkbox" checked={useVol} onChange={(e) => setUseVol(e.target.checked)} className="peer sr-only" />
                 <div className="w-8 h-4 bg-slate-200 dark:bg-slate-700 rounded-full peer-checked:bg-blue-500 transition-all duration-300" />
                 <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-300 peer-checked:translate-x-4 shadow-sm" />
               </div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover/vol:text-slate-600 transition-colors">Volumetric Logic</span>
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase">Divisor: {volumetricDivisor}</span>
          </label>

          {useVol && (
            <div className="grid grid-cols-3 gap-2 animate-in slide-in-from-top-2 duration-300">
              {['l', 'b', 'h'].map((k) => (
                <div key={k} className="relative">
                   <input 
                    type="number" 
                    min="0" 
                    placeholder={k.toUpperCase()} 
                    className="w-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-2 py-2 text-center text-xs font-black text-slate-800 dark:text-white tabular-nums placeholder:text-slate-300 focus:ring-2 focus:ring-blue-500/10" 
                    value={dims[k]} 
                    onChange={(e) => setDims((d) => ({ ...d, [k]: e.target.value }))} 
                  />
                  <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 px-1 bg-white dark:bg-slate-900 text-[8px] font-black text-slate-400 uppercase">{k}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tactical Intel: Target Margin */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
           <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                 <Target size={14} className="text-emerald-500" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tactical Margin Target</span>
              </div>
              {targetMargin && results.length > 0 && (() => {
                const m = parseFloat(targetMargin) / 100;
                const minSell = m < 1 ? Math.round((results[0].bk.total / (1 - m)) * 100) / 100 : null;
                return minSell ? (
                  <div className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-widest animate-pulse">
                    Min Sell: {fmt(minSell)}
                  </div>
                ) : null;
              })()}
           </div>
           
           <div className="relative">
              <input 
                type="number" 
                min="0" 
                max="99" 
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl px-4 py-3 text-sm font-black placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500/20 transition-all tabular-nums" 
                placeholder="Target Margin (%)…" 
                value={targetMargin} 
                onChange={(e) => setTargetMargin(e.target.value)} 
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">%</span>
           </div>
        </div>
      </div>
    </div>
  );
}
