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
  Award,
  ShieldCheck,
  Truck,
  ArrowUpRight,
  Target
} from 'lucide-react';
import { CLR } from '../core';

/* Priority order — your most-used couriers always show first */
const GROUP_ORDER = ['Trackon', 'DTDC', 'Delhivery', 'B2B', 'BlueDart', 'GEC', 'LTL'];

/* Premium Theme Mapping */
const THEME = {
  Trackon:   { accent: 'border-l-orange-500', headerBg: 'bg-orange-50/50',  headerText: 'text-orange-900', dot: 'bg-orange-500', icon: Truck },
  DTDC:      { accent: 'border-l-red-500',    headerBg: 'bg-red-50/50',     headerText: 'text-red-900',    dot: 'bg-red-500',    icon: ShieldCheck },
  Delhivery: { accent: 'border-l-rose-500',   headerBg: 'bg-rose-50/50',    headerText: 'text-rose-900',   dot: 'bg-rose-500',   icon: Zap },
  B2B:       { accent: 'border-l-indigo-500', headerBg: 'bg-indigo-50/50',  headerText: 'text-indigo-900', dot: 'bg-indigo-500', icon: ShieldCheck },
  GEC:       { accent: 'border-l-cyan-500',   headerBg: 'bg-cyan-50/50',    headerText: 'text-cyan-900',   dot: 'bg-cyan-500',   icon: Truck },
  LTL:       { accent: 'border-l-slate-400',  headerBg: 'bg-slate-100/50',  headerText: 'text-slate-800',  dot: 'bg-slate-400',  icon: Truck },
  BlueDart:  { accent: 'border-l-blue-600',   headerBg: 'bg-blue-50/50',    headerText: 'text-blue-900',   dot: 'bg-blue-600',   icon: ShieldCheck },
};

export default function ResultsPanel({
  best, sortMode, fmt, fmtP, results, displayed,
  odaOn, odaAmt, expanded, setExpanded,
  getMarginWarning, svcLevel, customPrice, activeContract,
  pColor, setQuoteCourier, showAll, setShowAll,
  targetMargin, fmtI,
}) {
  if (!results.length) return null;

  /* group by courier company */
  const groups = {};
  results.forEach(r => { (groups[r.group] ??= []).push(r); });

  /* fixed priority order */
  const sortedNames = GROUP_ORDER.filter(g => groups[g]);
  Object.keys(groups).forEach(g => { if (!sortedNames.includes(g)) sortedNames.push(g); });
  const visible = showAll ? sortedNames : sortedNames.slice(0, 5);

  return (
    <div className="animate-in space-y-6">
      {/* ── Winner banner (Glassmorphism) ── */}
      {best && (
        <div className={`relative overflow-hidden rounded-[2rem] p-6 shadow-2xl transition-all duration-500 ${best.profit >= 0 ? 'state-profit' : 'state-loss'}`}>
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 scale-150">
            <Award className="w-32 h-32" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/30 shadow-inner">
                <Award className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-white/70 mb-1">
                  {sortMode === 'profit' ? 'Most Profitable Engine' : 'Efficiency Leader'}
                </p>
                <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  {best.label} <span className="text-white/50 font-normal text-sm bg-white/10 px-2 py-0.5 rounded-lg backdrop-blur-sm">{best.mode}</span>
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:gap-10 gap-y-4">
              <Stat label="Net Cost" value={fmt(best.bk.total)} />
              <Stat label="Quoted Sell" value={fmt(best.sell)} />
              <Stat label="Your Profit" value={fmt(best.profit)} highlight={best.profit < 0} />
              <Stat label="Net Margin" value={fmtP(best.margin)} />
            </div>
          </div>
        </div>
      )}

      {/* ── Grouped results ── */}
      <div className="grid grid-cols-1 gap-4">
        {visible.map(gName => {
          const rows = groups[gName];
          const t = THEME[gName] || THEME.LTL;
          const Icon = t.icon;

          return (
            <div key={gName} className={`group glass-card border-l-[6px] ${t.accent} !p-0 overflow-hidden`}>
              {/* Group header */}
              <div className={`${t.headerBg} px-6 py-4 flex items-center justify-between border-b border-slate-100/50 backdrop-blur-sm`}>
                <div className="flex items-center gap-4">
                  {rows[0].logo ? (
                    <div className="h-8 w-16 flex items-center justify-center bg-white rounded-xl border border-slate-200/50 shadow-sm px-2 py-1 transform transition-transform group-hover:scale-105">
                      <img src={rows[0].logo} alt={gName} className="max-h-full max-w-full object-contain" />
                    </div>
                  ) : (
                    <div className={`w-10 h-10 rounded-xl ${t.headerBg} flex items-center justify-center border border-slate-200/30`}>
                      <Icon className={`w-5 h-5 ${t.headerText}`} />
                    </div>
                  )}
                  <div>
                    <h3 className={`text-base font-bold ${t.headerText} tracking-tight`}>{gName}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Courier Partner</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold bg-white text-slate-500 px-3 py-1 rounded-full border border-slate-100 shadow-sm ring-4 ring-slate-50/50">
                    {rows.length} {rows.length > 1 ? 'Variants' : 'Variant'}
                  </span>
                </div>
              </div>

              {/* Mode rows */}
              <div className="divide-y divide-slate-100/50">
                {rows.map((r) => {
                  const isBest = r.id === best?.id;
                  const open = expanded === r.id;

                  return (
                    <div key={r.id} className="transition-all duration-300">
                      {/* Row button */}
                      <button
                        onClick={() => setExpanded(open ? null : r.id)}
                        className={`w-full text-left px-6 py-5 flex items-center gap-5 transition-all duration-300
                          ${isBest ? 'bg-emerald-50/40' : open ? 'bg-slate-50/50' : 'hover:bg-slate-50/30'}`}
                      >
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center overflow-hidden transition-transform duration-300 ${open ? 'rotate-90 bg-slate-200/50' : 'bg-slate-50'}`}>
                          <ChevronRight className={`w-4 h-4 text-slate-400`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-[15px] font-bold text-slate-800 tracking-tight">{r.mode}</span>
                            <span className={`badge ${r.level === 'premium' ? 'badge-amber' : 'badge-gray'}`}>
                              {r.level === 'premium' ? '⚡ Priority' : 'Economy'}
                            </span>
                            {isBest && <span className="badge badge-green shadow-sm">✦ Recommended</span>}
                            {r.profit < 0 && <span className="badge badge-rose">Net Loss</span>}
                            {r.bk.notes.length > 0 && <Info className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500 transition-colors" />}
                          </div>
                        </div>

                        {/* Numbers — desktop */}
                        <div className="hidden lg:flex items-center gap-12 tabular-nums shrink-0 pr-4">
                          <DataCol label="Buy Cost" value={fmt(r.bk.total)} />
                          <DataCol label="Sell Price" value={fmt(r.sell)} />
                          <DataCol label="Margin" value={fmtP(r.margin)} color={pColor(r.margin)} />
                          <div className="text-right w-28">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Your Profit</p>
                            <div className="flex items-center justify-end gap-1.5">
                                <p className={`text-base font-black ${r.profit > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{fmt(r.profit)}</p>
                                {r.profit > 0 && <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />}
                            </div>
                          </div>
                        </div>

                        {/* Numbers — mobile */}
                        <div className="lg:hidden text-right shrink-0">
                          <p className="text-sm font-bold text-slate-800">{fmt(r.bk.total)}</p>
                          <p className={`text-[11px] font-black ${r.profit > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{r.profit > 0 ? '+' : ''}{fmt(r.profit)}</p>
                        </div>
                      </button>

                      {/* Expanded breakdown */}
                      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${open ? 'max-h-[800px] border-b border-slate-100' : 'max-h-0'}`}>
                        <div className="bg-slate-50/50 px-6 py-6 border-t border-slate-100">
                          <div className="flex items-center justify-between mb-5">
                            <div className="flex flex-col">
                              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em]">Detailed Calculation</span>
                              <p className="text-[11px] text-slate-400 font-medium">Billed on <span className="text-slate-600 font-bold">{r.bk.breakdown?.baseDesc || 'Actual Weight'}</span></p>
                            </div>
                            <div className="flex gap-2">
                              {r.bk.mcwApplied && <span className="badge badge-amber border-amber-200 shadow-sm animate-pulse">Bulk MCW Active</span>}
                              {odaOn && <span className="badge badge-blue border-indigo-200">Out Of Delivery (ODA)</span>}
                            </div>
                          </div>

                          <div className="glass bg-white p-4 rounded-2xl mb-6 border-slate-200/50 shadow-premium">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100 text-indigo-500">
                                    <Target className="w-4 h-4" />
                                </div>
                                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                    <span className="font-bold text-indigo-600 uppercase text-[10px] tracking-wider block mb-0.5">Logic Applied:</span> 
                                    {r.bk.breakdown?.costBreakdown || 'Standard slab calculation'}
                                </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <BreakdownCard label="Base" val={fmt(r.bk.base)} />
                            <BreakdownCard label={`FSC (${r.bk.fscPct})`} val={fmt(r.bk.fsc)} />
                            {r.bk.docket > 0 && <BreakdownCard label="Docket (LR)" val={fmt(r.bk.docket)} />}
                            {r.bk.handling > 0 && <BreakdownCard label="Handling" val={fmt(r.bk.handling)} />}
                            {r.bk.fov > 0 && <BreakdownCard label="FOV/ROV" val={fmt(r.bk.fov)} highlight />}
                            {r.bk.green > 0 && <BreakdownCard label="Green" val={fmt(r.bk.green)} />}
                            <BreakdownCard label="GST (18%)" val={fmt(r.bk.gst)} />
                            {r.bk.oda > 0 && <BreakdownCard label="ODA Fee" val={fmt(r.bk.oda)} highlight />}
                            <div className="md:col-start-5 bg-slate-900 rounded-2xl p-4 text-white shadow-xl shadow-slate-900/10 border border-white/10">
                              <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest mb-1">Total Buy</p>
                              <p className="font-bold text-xl tracking-tight">{fmt(r.bk.total)}</p>
                            </div>
                          </div>

                          {r.bk.notes.length > 0 && (
                            <div className="mt-5 p-4 bg-amber-50/50 border border-amber-200/50 rounded-2xl flex items-start gap-3">
                              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
                              <ul className="text-[11px] space-y-1 font-semibold text-amber-800">
                                {r.bk.notes.map((n, i) => <li key={i}>{n}</li>)}
                              </ul>
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-5 border-t border-slate-200/50 gap-4">
                            <div className="flex items-center gap-4">
                                <div className="text-center sm:text-left">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Profit Snapshot</p>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[13px] font-bold px-4 py-1.5 rounded-xl border ${r.profit > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                            {r.profit > 0 ? `+${fmt(r.profit)}` : fmt(r.profit)} Net
                                        </span>
                                        <TrendingUp className={`w-5 h-5 ${r.profit > 0 ? 'text-emerald-500' : 'text-rose-400'}`} />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setQuoteCourier(r); }}
                                    className="btn-indigo btn-sm shadow-indigo-200/50"
                                >
                                    <Printer className="w-3.5 h-3.5" /> Book with {gName}
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

      {/* Show more / less */}
      {sortedNames.length > 5 && (
        <button onClick={() => setShowAll(!showAll)} className="w-full py-4 text-[13px] font-bold text-slate-500 bg-white border border-slate-200/60 rounded-2xl hover:bg-slate-50 hover:text-slate-800 transition-all shadow-sm flex items-center justify-center gap-2">
          {showAll ? <><ChevronUp className="w-5 h-5" />Show Standard Partners</> : <><ChevronDown className="w-5 h-5" />Explore {sortedNames.length - 5} More Delivery Groups</>}
        </button>
      )}

      {/* Volume insight (Premium Glass) */}
      {results.length > 1 && best && (
        <div className="glass bg-white p-6 rounded-[2rem] border-white/60 shadow-premium flex flex-col md:flex-row items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-base font-bold text-slate-800 mb-1">Strategic Profit Optimizer</h4>
            <p className="text-[13px] text-slate-500 leading-relaxed">
                By standardizing on <span className="font-extrabold text-indigo-600">{best.label}</span>, you generate an additional <span className="font-extrabold text-emerald-600">{fmtI((best.profit - results[results.length - 1].profit) * 100)}</span> in net income per 100 shipments.
            </p>
          </div>
          <button className="btn-indigo btn-sm">Optimize Mix</button>
        </div>
      )}
    </div>
  );
}

/* ── SUBCOMPONENTS ───────────────────────────────────────────────────────── */

function Stat({ label, value, highlight }) {
  return (
    <div className="flex flex-col">
      <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">{label}</p>
      <p className={`text-xl font-black tracking-tight text-white ${highlight ? 'text-rose-200' : ''}`}>{value}</p>
    </div>
  );
}

function DataCol({ label, value, color }) {
  return (
    <div className="text-right w-24">
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-[14px] font-bold ${color || 'text-slate-700'}`}>{value}</p>
    </div>
  );
}

function BreakdownCard({ label, val, highlight }) {
  return (
    <div className={`bg-white rounded-xl p-3 border border-slate-100/80 shadow-sm transition-all hover:border-slate-300 ${highlight ? 'ring-2 ring-indigo-50 border-indigo-200' : ''}`}>
      <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-[13px] font-bold ${highlight ? 'text-indigo-600' : 'text-slate-700'}`}>{val}</p>
    </div>
  );
}

