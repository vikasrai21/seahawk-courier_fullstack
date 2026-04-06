import React from 'react';
import { 
  AlertTriangle, 
  ChevronDown, 
  ChevronRight, 
  ChevronUp, 
  Info, 
  Printer, 
  TrendingUp, 
  Zap, 
  ShieldCheck,
  Truck,
  Target,
  Trophy,
  Activity,
  ArrowRight,
  Clock
} from 'lucide-react';

const GROUP_ORDER = ['Trackon', 'DTDC', 'Delhivery', 'B2B', 'BlueDart', 'GEC', 'LTL'];

const THEME = {
  Trackon:   { accent: '#f97316', headerBg: 'bg-orange-50/50',  headerText: 'text-orange-900', icon: Truck },
  DTDC:      { accent: '#ef4444', headerBg: 'bg-red-50/50',     headerText: 'text-red-900',    icon: ShieldCheck },
  Delhivery: { accent: '#e11d48', headerBg: 'bg-rose-50/50',    headerText: 'text-rose-900',   icon: Zap },
  B2B:       { accent: '#6366f1', headerBg: 'bg-indigo-50/50',  headerText: 'text-indigo-900', icon: ShieldCheck },
  GEC:       { accent: '#06b6d4', headerBg: 'bg-cyan-50/50',    headerText: 'text-cyan-900',   icon: Truck },
  LTL:       { accent: '#94a3b8', headerBg: 'bg-slate-100/50',  headerText: 'text-slate-800',  icon: Truck },
  BlueDart:  { accent: '#2563eb', headerBg: 'bg-blue-50/50',    headerText: 'text-blue-900',   icon: ShieldCheck },
};

export default function ResultsPanel({
  best, sortMode, fmt, fmtP, results,
  odaOn, expanded, setExpanded,
  pColor, setQuoteCourier, showAll, setShowAll,
  fmtI,
}) {
  if (!results.length) return null;

  // Find Speed Champion (Lowest lead time or highest manual rank)
  // Since we don't have lead time in the raw object, we use level=premium as proxy or best rank
  const speedChamp = [...results].sort((a,b) => (a.level === 'premium' ? -1 : 1) - (b.level === 'premium' ? -1 : 1))[0];
  const costWinner = [...results].sort((a,b) => a.bk.total - b.bk.total)[0];

  const groups = {};
  results.forEach(r => { (groups[r.group] ??= []).push(r); });

  const sortedNames = GROUP_ORDER.filter(g => groups[g]);
  Object.keys(groups).forEach(g => { if (!sortedNames.includes(g)) sortedNames.push(g); });
  const visible = showAll ? sortedNames : sortedNames.slice(0, 5);

  return (
    <div className="animate-in space-y-6">
      {/* Best Choice Spotlight Card */}
      {best && (
        <div className="rounded-[40px] bg-slate-900 border border-slate-800 p-8 shadow-2xl shadow-slate-900/40 relative overflow-hidden group/spot">
           <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 blur-[120px] pointer-events-none transition-all duration-1000 group-hover/spot:bg-blue-500/20" />
           
           <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 relative z-10">
              <div className="flex items-center gap-6">
                 <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center border transition-all duration-500 ${best.profit >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
                    <Trophy size={32} className="animate-bounce" />
                 </div>
                 <div>
                    <div className="flex items-center gap-3 mb-2">
                       <h2 className="text-2xl font-black text-white leading-none tracking-tight">Intelligence Pick</h2>
                       <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Matched via {sortMode === 'profit' ? 'Profit Delta' : 'Landed Cost'}
                       </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-lg font-bold text-slate-100">{best.label}</span>
                       <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] font-black text-slate-500 uppercase tracking-widest">{best.mode}</span>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto">
                 <SpotStat label="Buy (Landed)" value={fmt(best.bk.total)} />
                 <SpotStat label="Sell (Target)" value={fmt(best.sell)} />
                 <SpotStat label="Est. Profit" value={fmt(best.profit)} highlight={best.profit < 0} />
                 <SpotStat label="Net Margin" value={fmtP(best.margin)} />
              </div>
           </div>
        </div>
      )}

      {/* Grid of Courier Groups */}
      <div className="grid grid-cols-1 gap-6">
        {visible.map(gName => {
          const rows = groups[gName];
          const t = THEME[gName] || THEME.LTL;
          const Icon = t.icon;

          return (
            <div key={gName} className="rounded-[32px] border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500">
              {/* Group Header */}
              <div className={`px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 ${t.headerBg} dark:bg-slate-800/30`}>
                <div className="flex items-center gap-5">
                   {rows[0].logo ? (
                      <div className="w-16 h-10 bg-white rounded-xl border border-slate-200/80 p-2 flex items-center justify-center shadow-sm">
                         <img src={rows[0].logo} alt={gName} className="max-h-full object-contain filter grayscale hover:grayscale-0 transition-all duration-500" />
                      </div>
                   ) : (
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
                         <Icon size={20} />
                      </div>
                   )}
                   <div>
                      <h3 className="text-base font-black text-slate-800 dark:text-white tracking-tight uppercase">{gName}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Network Capability: {rows.length} Modes</p>
                   </div>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                   <div className="w-1 h-1 rounded-full bg-slate-300 animate-pulse" />
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Channels</span>
                </div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((r) => {
                  const isBest = r.id === best?.id;
                  const isSpeedChamp = r.id === speedChamp?.id;
                  const isCostWinner = r.id === costWinner?.id;
                  const open = expanded === r.id;

                  return (
                    <div key={r.id} className={`transition-all duration-300 ${open ? 'bg-slate-50 dark:bg-slate-800/30' : 'bg-transparent'}`}>
                      <button
                        onClick={() => setExpanded(open ? null : r.id)}
                        className="w-full text-left px-6 py-5 flex items-center gap-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${open ? 'rotate-90 bg-slate-900 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                           <ChevronRight size={16} />
                        </div>

                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-3 mb-1">
                              <span className="text-base font-black text-slate-800 dark:text-white tracking-tight">{r.mode}</span>
                              {isBest && <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/20">Recommended</span>}
                              {isSpeedChamp && !isBest && <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 flex items-center gap-1"><Clock size={10}/> Speed Champ</span>}
                              {isCostWinner && !isBest && <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">Value Pick</span>}
                           </div>
                           <div className="flex items-center gap-3">
                              <span className={`text-[10px] font-black uppercase tracking-widest ${r.level === 'premium' ? 'text-amber-500' : 'text-slate-400'}`}>
                                 {r.level === 'premium' ? 'Priority Network' : 'Normal Velocity'}
                              </span>
                              {r.bk.mcwApplied && <div className="w-1 h-1 rounded-full bg-rose-400" />}
                              {r.bk.mcwApplied && <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Weight Floor Active</span>}
                           </div>
                        </div>

                        <div className="hidden lg:grid grid-cols-4 gap-8 tabular-nums shrink-0">
                           <DataCell label="Full Cost" value={fmt(r.bk.total)} />
                           <DataCell label="Sell Target" value={fmt(r.sell)} />
                           <DataCell label="Margin Delta" value={fmtP(r.margin)} color={pColor(r.margin)} />
                           <div className="text-right w-32 border-l border-slate-100 dark:border-slate-800 pl-8">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Yield / Unit</p>
                               <div className={`text-xl font-black ${r.profit > 0 ? 'text-emerald-500 font-system' : 'text-rose-500'}`}>{fmt(r.profit)}</div>
                           </div>
                        </div>

                        <div className="lg:hidden text-right shrink-0">
                           <div className="text-base font-black text-slate-800 dark:text-white mb-0.5">{fmt(r.bk.total)}</div>
                           <div className={`text-[11px] font-black ${r.profit > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{fmt(r.profit)}</div>
                        </div>
                      </button>

                      {/* Expanded Intelligence Panel */}
                      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${open ? 'max-h-[800px] border-b border-slate-100 dark:border-slate-800' : 'max-h-0'}`}>
                         <div className="px-6 pb-8 pt-2 space-y-6">
                            {/* Calculation Logic (Industrial Stripe) */}
                            <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4">
                               <div className="w-10 h-10 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                                  <Activity size={20} />
                               </div>
                               <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Engine Calculation Path</p>
                                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-relaxed italic">
                                     "{r.bk.breakdown?.costBreakdown || 'Standard slab calculation applied via source contract pricing tables.'}"
                                  </p>
                               </div>
                            </div>

                            {/* Detailed Quantum Components */}
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                               <BreakdownItem label="Base Multiplier" val={fmt(r.bk.base)} />
                               <BreakdownItem label={`FSC (${r.bk.fscPct})`} val={fmt(r.bk.fsc)} />
                               {r.bk.docket > 0 && <BreakdownItem label="Document Processing" val={fmt(r.bk.docket)} />}
                               {r.bk.handling > 0 && <BreakdownItem label="Cargo Handling" val={fmt(r.bk.handling)} />}
                               {r.bk.fov > 0 && <BreakdownItem label="FOV Risk Premium" val={fmt(r.bk.fov)} highlight />}
                               {r.bk.green > 0 && <BreakdownItem label="Green Compliance" val={fmt(r.bk.green)} />}
                               <BreakdownItem label="GST Delta (18%)" val={fmt(r.bk.gst)} />
                               {r.bk.oda > 0 && <BreakdownItem label="ODA Logistics Surcharge" val={fmt(r.bk.oda)} highlight />}
                               <div className="md:col-start-5 rounded-3xl bg-slate-900 p-5 text-white shadow-xl shadow-slate-900/10 border border-slate-800 group/tot">
                                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2 group-hover/tot:text-blue-400 transition-colors">Net Landed Cost</p>
                                  <div className="text-2xl font-black tabular-nums">{fmt(r.bk.total)}</div>
                               </div>
                            </div>

                            {/* Actions & Alerts */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                               <div className="flex gap-4">
                                  {r.bk.notes.length > 0 && (
                                     <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                                        <AlertTriangle size={14} className="text-amber-600" />
                                        <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">{r.bk.notes[0]}</span>
                                     </div>
                                  )}
                               </div>
                               <div className="flex items-center gap-3">
                                  <button
                                     onClick={(e) => { e.stopPropagation(); setQuoteCourier(r); }}
                                     className="px-6 py-3 bg-slate-900 hover:bg-black text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-slate-900/10 transition-all active:scale-95 flex items-center gap-3 group/btn"
                                  >
                                     <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" /> Engage {gName} Logistics
                                  </button>
                               </div>
                            </div>
                         </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {sortedNames.length > 5 && (
        <button 
          onClick={() => setShowAll(!showAll)} 
          className="w-full py-5 rounded-[28px] border-2 border-dashed border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 hover:border-blue-500/30 hover:text-blue-500 transition-all group"
        >
          {showAll ? 'Collapse Tier 2 Networks' : `Engage ${sortedNames.length - 5} Extended Delivery Nodes`}
        </button>
      )}
    </div>
  );
}

function SpotStat({ label, value, highlight }) {
  return (
    <div className="flex flex-col">
       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</span>
       <span className={`text-xl font-black tabular-nums transition-colors ${highlight ? 'text-rose-500' : 'text-white'}`}>{value}</span>
    </div>
  );
}

function DataCell({ label, value, color }) {
  return (
    <div className="text-right">
       <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</div>
       <div className={`text-sm font-black tabular-nums ${color || 'text-slate-800 dark:text-slate-200'}`}>{value}</div>
    </div>
  );
}

function BreakdownItem({ label, val, highlight }) {
  return (
    <div className={`p-4 rounded-3xl border transition-all duration-300 shadow-sm ${highlight ? 'bg-rose-500/5 border-rose-500/20' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}>
       <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 leading-none">{label}</div>
       <div className={`text-sm font-black tabular-nums ${highlight ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>{val}</div>
    </div>
  );
}
