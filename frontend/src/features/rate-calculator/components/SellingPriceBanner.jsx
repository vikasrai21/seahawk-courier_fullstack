import React from 'react';
import { Edit3, Sparkles, Target, TrendingUp, DollarSign, X } from 'lucide-react';

export default function SellingPriceBanner({
  effectiveSell,
  bannerColor,
  customPrice,
  activeContract,
  svcLevel,
  zone,
  chargeWt,
  shipType,
  proposalSell,
  fmt,
  fmtP,
  editPrice,
  setEditPrice,
  setCustomPrice,
  sortMode,
  setSortMode,
}) {
  if (!effectiveSell) return null;

  return (
    <div className={`card overflow-hidden relative group p-1 ${bannerColor === 'bg-amber-600' ? 'border-amber-500/30' : bannerColor === 'bg-blue-900' ? 'border-blue-500/30' : 'border-slate-800'}`}>
       {/* Background Animated Layer */}
       <div className={`absolute inset-0 opacity-10 transition-opacity duration-1000 group-hover:opacity-20 ${bannerColor === 'bg-amber-600' ? 'bg-amber-500' : bannerColor === 'bg-blue-900' ? 'bg-blue-500' : 'bg-slate-500'}`} />
       
       <div className="relative z-10 px-8 py-6 flex flex-wrap items-center justify-between gap-8 bg-white dark:bg-slate-950/80 backdrop-blur-3xl rounded-[30px]">
          <div className="flex-1 min-w-[300px]">
            <div className="flex items-center gap-4 mb-3">
              <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm border ${
                customPrice 
                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' 
                  : activeContract 
                    ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' 
                    : 'bg-slate-900 text-white border-slate-800'
              }`}>
                {effectiveSell.source}
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => setEditPrice(!editPrice)} 
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-800"
                >
                  <Edit3 size={14} />
                </button>
                {customPrice && (
                  <button 
                    onClick={() => { setCustomPrice(''); setEditPrice(false); }} 
                    className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all border border-rose-500/20"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {editPrice ? (
              <div className="flex items-center gap-4 mt-2 reveal">
                <div className="relative flex-1 max-w-[240px]">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300">₹</span>
                   <input
                    type="number" min="0" autoFocus
                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-blue-500/20 rounded-2xl pl-10 pr-4 py-3 text-3xl font-black text-slate-900 dark:text-white placeholder:text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all tabular-nums"
                    placeholder="0.00" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="reveal">
                <div className="flex items-baseline gap-2">
                   <h2 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white tabular-nums leading-none">
                      {fmt(effectiveSell.total)}
                   </h2>
                   <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Sell Target</span>
                </div>
                
                {!customPrice && !activeContract && svcLevel === 'all' && zone && chargeWt > 0 && shipType !== 'air' && (() => {
                  const eco = proposalSell(zone, chargeWt, shipType, 'economy', effectiveSell.total);
                  const prem = proposalSell(zone, chargeWt, shipType, 'premium', effectiveSell.total);
                  return eco && prem ? (
                    <div className="flex gap-3 mt-4">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 group/eco">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Normal</span>
                        <span className="text-xs font-black text-slate-800 dark:text-slate-200 tabular-nums">{fmt(eco.total)}</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/5 border border-orange-500/20">
                        <Sparkles size={12} className="text-orange-500" />
                        <span className="text-[9px] font-black text-orange-400 uppercase tracking-tighter underline decoration-orange-500/30 underline-offset-4">Priority</span>
                        <span className="text-xs font-black text-orange-600 tabular-nums">{fmt(prem.total)}</span>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            {effectiveSell.fsc > 0 && (
              <div className="flex items-center gap-4 mt-4 opacity-60">
                 <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Base</span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 tabular-nums">{fmt(effectiveSell.base)}</span>
                 </div>
                 <div className="w-1 h-1 rounded-full bg-slate-200" />
                 <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">FSC ({fmtP(parseFloat(effectiveSell.fscPct) || 0)})</span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 tabular-nums">{fmt(effectiveSell.fsc)}</span>
                 </div>
                 <div className="w-1 h-1 rounded-full bg-slate-200" />
                 <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">GST (18%)</span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 tabular-nums">{fmt(effectiveSell.gst)}</span>
                 </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl shrink-0 border border-slate-200/50 dark:border-slate-800">
            {['profit', 'cost'].map((mode) => {
              const active = sortMode === mode;
              const Icon = mode === 'profit' ? TrendingUp : Target;
              return (
                <button
                  key={mode}
                  onClick={() => setSortMode(mode)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-[14px] text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                    active 
                      ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/40 relative' 
                      : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {active && <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-ping" />}
                  <Icon size={16} className={active ? 'text-blue-400' : ''} />
                  {mode === 'profit' ? 'Yield Logic' : 'Cost Logic'}
                </button>
              );
            })}
          </div>
       </div>
    </div>
  );
}
