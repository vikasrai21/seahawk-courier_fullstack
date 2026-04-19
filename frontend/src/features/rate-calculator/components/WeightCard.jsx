import { Target, Scale } from 'lucide-react';

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
    <div className="rate-section h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
           <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-500 ${chargeWt > 0 ? 'bg-blue-500/10 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
              <Scale size={14} className={chargeWt > 0 ? 'animate-pulse' : ''} />
           </div>
           <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Weight</h3>
              <p className="text-xs text-slate-500">Actual or volumetric</p>
           </div>
        </div>
        {chargeWt > 0 && (
          <div className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[11px] font-semibold tabular-nums">
            {chargeWt.toFixed(2)} kg
          </div>
        )}
      </div>

      <div className="space-y-5 flex-1">
        <div className="grid grid-cols-1 gap-4">
          <div className="relative">
            <input 
              type="number" 
              step="0.1" 
              min="0" 
              className="input pr-10 py-3 text-sm font-semibold" 
              placeholder="0.0" 
              value={weight} 
              onChange={(e) => setWeight(e.target.value)} 
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400">kg</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-800">
            <label className="flex items-center justify-between cursor-pointer group/vol mb-2">
              <div className="flex items-center gap-3">
                 <div className="relative">
                   <input type="checkbox" checked={useVol} onChange={(e) => setUseVol(e.target.checked)} className="peer sr-only" />
                   <div className="w-10 h-5 bg-slate-200 dark:bg-slate-800 rounded-full peer-checked:bg-blue-500 transition-all duration-300" />
                   <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 peer-checked:translate-x-5 shadow-md" />
                 </div>
                 <div className="flex flex-col">
                   <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none mb-0.5">Volumetric weight</span>
                   <span className="text-[11px] text-slate-500">L × W × H</span>
                 </div>
              </div>
              <div className="text-right">
                <span className="block text-[10px] text-slate-500 mb-0.5">Factor</span>
                <span className="text-[11px] font-semibold text-blue-600 tabular-nums">1:{volumetricDivisor}</span>
              </div>
            </label>

            <div className={`grid grid-cols-3 gap-2 transition-all duration-500 ${useVol ? 'opacity-100 scale-100' : 'opacity-40 scale-95 pointer-events-none'}`}>
              {['l', 'b', 'h'].map((k) => (
                <div key={k} className="relative group/dim">
                   <input 
                    type="number" 
                    min="0" 
                    placeholder="0" 
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-2 text-center text-xs font-semibold text-slate-800 dark:text-white tabular-nums transition-all focus:border-blue-500/50" 
                    value={dims[k]} 
                    onChange={(e) => setDims((d) => ({ ...d, [k]: e.target.value }))} 
                  />
                  <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 px-1.5 bg-slate-50 dark:bg-slate-800 text-[9px] text-slate-500 leading-none">{k}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
           <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                 <Target size={14} className="text-emerald-500" />
                 <div>
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-none">Target margin</h4>
                 </div>
              </div>
              {targetMargin && results.length > 0 && (() => {
                const m = parseFloat(targetMargin) / 100;
                const minSell = m < 1 ? Math.round((results[0].bk.total / (1 - m)) * 100) / 100 : null;
                return minSell ? (
                  <div className="px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[11px] font-semibold">
                    Sell ≥ {fmt(minSell)}
                  </div>
                ) : null;
              })()}
           </div>
           
           <div className="relative group/target">
              <input 
                type="number" 
                min="0" 
                max="99" 
                className="input py-3 pr-10 text-sm font-semibold border-emerald-500/10 bg-emerald-500/[0.02] focus:border-emerald-500/40 focus:ring-emerald-500/5" 
                placeholder="20" 
                value={targetMargin} 
                onChange={(e) => setTargetMargin(e.target.value)} 
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-emerald-500/60">%</span>
           </div>
        </div>
      </div>
    </div>
  );
}
