import React from 'react';
import { 
  AlertTriangle, 
  ChevronRight, 
  Zap, 
  ShieldCheck,
  Truck,
  Activity,
  ArrowRight,
  Clock,
  Sparkles,
  Command
} from 'lucide-react';

const GROUP_ORDER = ['Trackon', 'DTDC', 'Delhivery', 'B2B', 'BlueDart', 'GEC', 'LTL'];

const THEME = {
  Trackon:   { accent: '#f97316', headerBg: 'bg-orange-500/5',  headerText: 'text-orange-900', icon: Truck },
  DTDC:      { accent: '#ef4444', headerBg: 'bg-red-500/5',     headerText: 'text-red-900',    icon: ShieldCheck },
  Delhivery: { accent: '#e11d48', headerBg: 'bg-rose-500/5',    headerText: 'text-rose-900',   icon: Zap },
  B2B:       { accent: '#6366f1', headerBg: 'bg-indigo-500/5',  headerText: 'text-indigo-900', icon: Command },
  GEC:       { accent: '#06b6d4', headerBg: 'bg-cyan-500/5',    headerText: 'text-cyan-900',   icon: Truck },
  LTL:       { accent: '#94a3b8', headerBg: 'bg-slate-500/5',   headerText: 'text-slate-800',  icon: Truck },
  BlueDart:  { accent: '#2563eb', headerBg: 'bg-blue-500/5',    headerText: 'text-blue-900',   icon: ShieldCheck },
};

export default function ResultsPanel({
  best, sortMode, fmt, fmtP, results,
  odaOn, expanded, setExpanded,
  pColor, setQuoteCourier, showAll, setShowAll,
  fmtI,
  compact = false,
  intelligence,
}) {
  if (!results.length) return null;

  const speedChamp = [...results].sort((a,b) => (a.level === 'premium' ? -1 : 1) - (b.level === 'premium' ? -1 : 1))[0];
  const costWinner = [...results].sort((a,b) => a.bk.total - b.bk.total)[0];

  const groups = {};
  results.forEach(r => { (groups[r.group] ??= []).push(r); });

  const sortedNames = GROUP_ORDER.filter(g => groups[g]);
  Object.keys(groups).forEach(g => { if (!sortedNames.includes(g)) sortedNames.push(g); });
  const visible = showAll ? sortedNames : sortedNames.slice(0, 5);

  return (
    <div className={`reveal ${compact ? 'space-y-6' : 'space-y-10'}`}>
      {/* Best Choice Spotlight Card */}
      {best && !compact && (
        <div className="rounded-[40px] bg-slate-950 border border-slate-800 p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] relative overflow-hidden group/spot pulse-intelligence">
           <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] pointer-events-none transition-all duration-1000 group-hover/spot:bg-blue-600/20" />
           <div className="scanning-line" />
           
           <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
              <div className="flex items-center gap-8">
                 <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
                    <div className={`w-20 h-20 rounded-[28px] flex items-center justify-center border-2 shadow-2xl transition-all duration-500 relative z-10 ${best.profit >= 0 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-rose-500/10 border-rose-500/30 text-rose-500'}`}>
                       <Sparkles size={38} className="animate-bounce" />
                    </div>
                 </div>
                 <div>
                    <div className="flex items-center gap-4 mb-3">
                       <h2 className="text-3xl font-black text-white leading-none tracking-tight font-heading">Neural Pick</h2>
                       <div className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">
                          {sortMode === 'profit' ? 'Optimized for Yield' : 'Optimized for Cost'}
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="text-xl font-bold text-slate-100">{best.label}</span>
                       <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                       <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{best.mode}</span>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-10 w-full lg:w-auto border-l border-slate-800/50 pl-12">
                 <SpotStat label="Landed Cost" value={fmt(best.bk.total)} />
                 <SpotStat label="Target Sell" value={fmt(best.sell)} />
                 <SpotStat label="Est. Profit" value={fmt(best.profit)} highlight={best.profit < 0} />
                 <SpotStat label="Net Margin" value={fmtP(best.margin)} color={pColor(best.margin)} />
              </div>
           </div>
        </div>
      )}
      {best && compact && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${best.profit >= 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
                <Sparkles size={18} />
              </div>
              <div>
                <div className="text-[11px] text-slate-500">Best pick</div>
                <div className="text-sm font-semibold text-slate-900">{best.label} · {best.mode}</div>
              </div>
            </div>
            <div className="flex gap-6 text-xs">
              <MiniStat label="Cost" value={fmt(best.bk.total)} />
              <MiniStat label="Sell" value={fmt(best.sell)} />
              <MiniStat label="Margin" value={fmtP(best.margin)} />
              <MiniStat label="Profit" value={fmt(best.profit)} />
            </div>
          </div>
          {intelligence?.recommendation && (
            <div className="mt-3 text-[11px] text-slate-600">
              {intelligence.recommendation}
            </div>
          )}
          {intelligence?.notes?.length ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {intelligence.notes.slice(0, 3).map((n) => (
                <span key={n} className="text-[11px] text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-2.5 py-1">
                  {n}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {/* Grid of Courier Groups */}
      <div className={compact ? 'space-y-6' : 'space-y-12'}>
        {visible.map(gName => {
          const rows = groups[gName];
          const t = THEME[gName] || THEME.LTL;
          const Icon = t.icon;

          return (
            <div key={gName} className="relative">
              {/* Group Header Backdrop */}
              {!compact && <div className="absolute -left-6 -top-6 -right-6 h-32 bg-gradient-to-b from-slate-100/50 dark:from-slate-900/50 to-transparent -z-10 rounded-[48px]" />}
              
              <div className={`flex items-end justify-between px-2 ${compact ? 'mb-3' : 'mb-6'}`}>
                 <div className="flex items-center gap-6">
                    {rows[0].logo ? (
                       <div className={`bg-white rounded-lg border border-slate-200/60 p-2 flex items-center justify-center ${compact ? 'w-14 h-9' : 'w-20 h-12'}`}>
                          <img src={rows[0].logo} alt={gName} className="max-h-full object-contain" />
                       </div>
                    ) : (
                       <div className={`rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 ${compact ? 'w-9 h-9' : 'w-12 h-12'}`}>
                          <Icon size={compact ? 18 : 24} />
                       </div>
                    )}
                    <div>
                       <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">{gName}</h3>
                       <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[11px] text-slate-500">Network</span>
                          <div className="w-1 h-1 rounded-full bg-slate-300" />
                          <span className="text-[11px] text-blue-600">{rows.length} channels</span>
                       </div>
                    </div>
                 </div>
              </div>

              <div className={compact ? 'space-y-2' : 'space-y-3'}>
                {rows.map((r) => {
                  const isBest = r.id === best?.id;
                  const isSpeedChamp = r.id === speedChamp?.id;
                  const isCostWinner = r.id === costWinner?.id;
                  const open = expanded === r.id;

                  return (
                    <div key={r.id} className={`group ${compact ? 'rounded-xl border border-slate-200 bg-white' : 'card p-0 border-white/40 overflow-hidden'} ${isBest ? 'ring-2 ring-blue-500/20' : ''}`}>
                      <button
                        onClick={() => setExpanded(open ? null : r.id)}
                        className={`w-full text-left ${compact ? 'px-4 py-3 gap-4' : 'px-8 py-6 gap-8'} flex items-center transition-all hover:bg-white dark:hover:bg-slate-800/20 ${open ? 'bg-white dark:bg-slate-800/40' : ''}`}
                      >
                        <div className={`rounded-lg flex items-center justify-center transition-all duration-500 ${open ? 'rotate-90 bg-slate-900 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'} ${compact ? 'w-7 h-7' : 'w-10 h-10'}`}>
                           <ChevronRight size={compact ? 14 : 20} />
                        </div>

                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-3 mb-1">
                              <span className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">{r.mode}</span>
                              <div className="flex gap-2">
                                {isBest && <span className="badge-info px-2">Recommended</span>}
                                {isSpeedChamp && !isBest && <span className="badge-warning px-2 flex items-center gap-1"><Clock size={10}/> Speed</span>}
                                {isCostWinner && !isBest && <span className="badge-success px-2">Value</span>}
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                              <span className={`text-[11px] ${r.level === 'premium' ? 'text-orange-500' : 'text-slate-500'}`}>
                                 {r.level === 'premium' ? 'Priority' : 'Standard'}
                              </span>
                              {r.bk.mcwApplied && (
                                <span className="flex items-center gap-1.5 text-[11px] text-rose-500">
                                   <div className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" /> Floor Active
                                </span>
                              )}
                              {intelligence?.laneTotals && (
                                <span className="text-[11px] text-slate-400">
                                  Lane risk: {(() => {
                                    const lane = intelligence?.laneTotals;
                                    if (!lane) return '—';
                                    const rto = lane.rtoRate ?? 0;
                                    const sla = lane.slaBreachRate ?? 0;
                                    const stuck = lane.stuckRate ?? 0;
                                    const risk = Math.max(rto, sla, stuck);
                                    return risk >= 0.2 ? 'High' : risk >= 0.1 ? 'Medium' : 'Low';
                                  })()}
                                </span>
                              )}
                           </div>
                        </div>

                        <div className={`hidden lg:grid tabular-nums shrink-0 ${compact ? 'grid-cols-3 gap-6' : 'grid-cols-4 gap-12'}`}>
                           <DataCell label="Full Landed" value={fmt(r.bk.total)} />
                           <DataCell label="Sell" value={fmt(r.sell)} />
                           <DataCell label="Margin" value={fmtP(r.margin)} color={pColor(r.margin)} />
                           {!compact && (
                             <div className="text-right w-32 border-l border-slate-100 dark:border-slate-800/50 pl-12 flex flex-col justify-center">
                                 <p className="text-[11px] text-slate-400 mb-1.5 opacity-60">Est. Yield</p>
                                 <div className={`text-2xl font-black ${r.profit > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{fmt(r.profit)}</div>
                             </div>
                           )}
                        </div>

                        <div className="lg:hidden text-right shrink-0">
                           <div className="text-lg font-black text-slate-900 dark:text-white mb-0.5">{fmt(r.bk.total)}</div>
                           <div className={`text-xs font-black ${r.profit > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{fmt(r.profit)}</div>
                        </div>
                      </button>

                      {/* Expanded Intelligence Panel */}
                      <div className={`overflow-hidden transition-all duration-700 ease-in-out ${open ? 'max-h-[1000px] border-t border-slate-100 dark:border-slate-800' : 'max-h-0'}`}>
                         <div className="px-6 pb-8 pt-4 space-y-6 bg-slate-50/50 dark:bg-black/20">
                            {/* Calculation Logic */}
                            <div className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-200">
                               <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0 border border-orange-500/20">
                                  <Activity size={20} className="animate-pulse" />
                               </div>
                               <div>
                                  <p className="text-[11px] text-slate-500 mb-2 leading-none">Calculation notes</p>
                                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                                     "{r.bk.breakdown?.costBreakdown || 'Standard slab-based calculation using source contract tables.'}"
                                  </p>
                               </div>
                            </div>

                            {/* Detailed Quantum Components */}
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                               <BreakdownItem label="Base Rate" val={fmt(r.bk.base)} />
                               <BreakdownItem label={`FSC (${r.bk.fscPct})`} val={fmt(r.bk.fsc)} />
                               {r.bk.docket > 0 && <BreakdownItem label="Docket" val={fmt(r.bk.docket)} />}
                               {r.bk.handling > 0 && <BreakdownItem label="Handling" val={fmt(r.bk.handling)} />}
                               {r.bk.fov > 0 && <BreakdownItem label="Insurance" val={fmt(r.bk.fov)} highlight />}
                               {r.bk.green > 0 && <BreakdownItem label="Green" val={fmt(r.bk.green)} />}
                               <BreakdownItem label="GST (18%)" val={fmt(r.bk.gst)} />
                               {r.bk.oda > 0 && <BreakdownItem label="ODA Fee" val={fmt(r.bk.oda)} highlight />}
                               <div className="md:col-start-5 rounded-2xl bg-slate-950 p-4 text-white border border-white/10">
                                  <p className="text-[11px] text-slate-400 mb-2">Total cost</p>
                                  <div className="text-2xl font-semibold tabular-nums">{fmt(r.bk.total)}</div>
                               </div>
                            </div>

                            {/* Actions & Alerts */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-200/60 dark:border-slate-800">
                               <div className="flex gap-4">
                                  {r.bk.notes.length > 0 && (
                                     <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                                        <AlertTriangle size={16} className="text-amber-600" />
                                        <span className="text-xs text-amber-700">{r.bk.notes[0]}</span>
                                     </div>
                                  )}
                               </div>
                               <div className="flex items-center gap-4">
                                  <button
                                     onClick={(e) => { e.stopPropagation(); setQuoteCourier(r); }}
                                     className="px-5 py-3 bg-slate-950 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98] flex items-center gap-3 group/btn"
                                  >
                                     <ArrowRight size={20} className="group-hover/btn:translate-x-2 transition-transform duration-500" /> 
                                     Create quote
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
          className="w-full py-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500 hover:border-blue-500/30 hover:text-blue-500 transition-all hover:bg-blue-500/[0.02]"
        >
          {showAll ? 'Hide extra partners' : `Show ${sortedNames.length - 5} more partners`}
        </button>
      )}
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className="text-sm font-semibold text-slate-900 tabular-nums">{value}</span>
    </div>
  );
}

function SpotStat({ label, value, highlight, color }) {
  return (
    <div className="flex flex-col min-w-[140px]">
       <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 leading-none opacity-80">{label}</span>
       <span className={`text-3xl font-black tabular-nums transition-colors tracking-tighter ${highlight ? 'text-rose-500' : (color || 'text-white')}`}>{value}</span>
    </div>
  );
}

function DataCell({ label, value, color }) {
  return (
    <div className="text-right">
       <div className="text-[11px] text-slate-500 mb-2 opacity-70 leading-none">{label}</div>
       <div className={`text-lg font-semibold tabular-nums tracking-tight ${color || 'text-slate-800 dark:text-slate-100'}`}>{value}</div>
    </div>
  );
}

function BreakdownItem({ label, val, highlight }) {
  return (
    <div className={`p-4 rounded-2xl border transition-all duration-300 shadow-sm ${highlight ? 'bg-rose-500/5 border-rose-500/20' : 'bg-white/50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800'}`}>
       <div className="text-[11px] text-slate-500 mb-2 leading-none opacity-80">{label}</div>
       <div className={`text-sm font-semibold tabular-nums ${highlight ? 'text-rose-500' : 'text-slate-900 dark:text-slate-200'}`}>{val}</div>
    </div>
  );
}
