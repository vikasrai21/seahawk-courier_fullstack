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
  Target
} from 'lucide-react';

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
    <div className="animate-in space-y-4">
      {best && (
        <div className={`rounded-[24px] border px-5 py-4 shadow-sm ${best.profit >= 0 ? 'border-emerald-200 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_55%,#f0fdf4_100%)]' : 'border-rose-200 bg-[linear-gradient(135deg,#fff1f2_0%,#ffffff_55%,#fff7ed_100%)]'}`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${best.profit >= 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-rose-200 bg-rose-50 text-rose-600'}`}>
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-500 mb-1">
                  {sortMode === 'profit' ? 'Best Profit Match' : 'Lowest Cost Match'}
                </p>
                <h2 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2 flex-wrap">
                  {best.label}
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600">{best.mode}</span>
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="Buy" value={fmt(best.bk.total)} />
              <Stat label="Sell" value={fmt(best.sell)} />
              <Stat label="Profit" value={fmt(best.profit)} highlight={best.profit < 0} />
              <Stat label="Margin" value={fmtP(best.margin)} />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {visible.map(gName => {
          const rows = groups[gName];
          const t = THEME[gName] || THEME.LTL;
          const Icon = t.icon;

          return (
            <div key={gName} className={`group overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm`}>
              <div className={`${t.headerBg} px-5 py-3 flex items-center justify-between border-b border-slate-100`}>
                <div className="flex items-center gap-4">
                  {rows[0].logo ? (
                    <div className="h-8 w-16 flex items-center justify-center bg-white rounded-xl border border-slate-200 px-2 py-1">
                      <img src={rows[0].logo} alt={gName} className="max-h-full max-w-full object-contain" />
                    </div>
                  ) : (
                    <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-200`}>
                      <Icon className={`w-5 h-5 ${t.headerText}`} />
                    </div>
                  )}
                  <div>
                    <h3 className={`text-base font-bold ${t.headerText} tracking-tight`}>{gName}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Verified Contract Modes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold bg-white text-slate-500 px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                    {rows.length} {rows.length > 1 ? 'Variants' : 'Variant'}
                  </span>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {rows.map((r) => {
                  const isBest = r.id === best?.id;
                  const open = expanded === r.id;

                  return (
                    <div key={r.id} className="transition-all duration-300">
                      {/* Row button */}
                      <button
                        onClick={() => setExpanded(open ? null : r.id)}
                        className={`w-full text-left px-5 py-4 flex items-center gap-4 transition-colors
                          ${isBest ? 'bg-emerald-50/50' : open ? 'bg-slate-50' : 'hover:bg-slate-50/70'}`}
                      >
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center overflow-hidden transition-transform duration-300 ${open ? 'rotate-90 bg-slate-200/70' : 'bg-slate-100'}`}>
                          <ChevronRight className={`w-4 h-4 text-slate-400`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-[15px] font-bold text-slate-800 tracking-tight">{r.mode}</span>
                            <span className={`badge ${r.level === 'premium' ? 'badge-amber' : 'badge-gray'}`}>
                              {r.badgeLabel || (r.level === 'premium' ? 'Express' : 'Standard')}
                            </span>
                            {isBest && <span className="badge badge-green shadow-sm">Recommended</span>}
                            {r.profit < 0 && <span className="badge badge-rose">Net Loss</span>}
                            {r.bk.notes.length > 0 && <Info className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500 transition-colors" />}
                          </div>
                        </div>

                        <div className="hidden lg:flex items-center gap-8 tabular-nums shrink-0 pr-2">
                          <DataCol label="Buy Cost" value={fmt(r.bk.total)} />
                          <DataCol label="Sell Price" value={fmt(r.sell)} />
                          <DataCol label="Margin" value={fmtP(r.margin)} color={pColor(r.margin)} />
                          <div className="text-right w-28">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Your Profit</p>
                            <p className={`text-base font-black ${r.profit > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{fmt(r.profit)}</p>
                          </div>
                        </div>

                        <div className="lg:hidden text-right shrink-0">
                          <p className="text-sm font-bold text-slate-800">{fmt(r.bk.total)}</p>
                          <p className={`text-[11px] font-black ${r.profit > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>{r.profit > 0 ? '+' : ''}{fmt(r.profit)}</p>
                        </div>
                      </button>

                      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${open ? 'max-h-[800px] border-b border-slate-100' : 'max-h-0'}`}>
                        <div className="bg-slate-50 px-5 py-5 border-t border-slate-100">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex flex-col">
                              <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em]">Detailed Calculation</span>
                              <p className="text-[11px] text-slate-400 font-medium">Billed on <span className="text-slate-600 font-bold">{r.bk.breakdown?.baseDesc || 'Actual Weight'}</span></p>
                            </div>
                            <div className="flex gap-2">
                              {r.bk.mcwApplied && <span className="badge badge-amber border-amber-200 shadow-sm">MCW Active</span>}
                              {odaOn && <span className="badge badge-blue border-indigo-200">Out Of Delivery (ODA)</span>}
                            </div>
                          </div>

                          <div className="bg-white p-4 rounded-2xl mb-5 border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center border border-orange-100 text-orange-500">
                                    <Target className="w-4 h-4" />
                                </div>
                                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                    <span className="font-bold text-orange-600 uppercase text-[10px] tracking-wider block mb-0.5">Logic Applied:</span> 
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
                            <div className="md:col-start-5 rounded-2xl border border-slate-200 bg-slate-900 p-4 text-white shadow-sm">
                              <p className="text-[10px] text-white/60 font-bold uppercase tracking-widest mb-1">Total Buy</p>
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

                          <div className="flex flex-col sm:flex-row items-center justify-between mt-5 pt-4 border-t border-slate-200 gap-4">
                            <div className="flex items-center gap-4">
                                <div className="text-center sm:text-left">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Profit Snapshot</p>
                                    <div className="flex items-center gap-3">
                                        <span className={`text-[13px] font-bold px-4 py-1.5 rounded-xl border ${r.profit > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                            {r.profit > 0 ? `+${fmt(r.profit)}` : fmt(r.profit)} Net
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setQuoteCourier(r); }}
                                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-[12px] font-semibold text-white hover:bg-slate-800"
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
        <button onClick={() => setShowAll(!showAll)} className="w-full py-3 text-[13px] font-bold text-slate-500 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 hover:text-slate-800 transition-all shadow-sm flex items-center justify-center gap-2">
          {showAll ? <><ChevronUp className="w-5 h-5" />Show Standard Partners</> : <><ChevronDown className="w-5 h-5" />Explore {sortedNames.length - 5} More Delivery Groups</>}
        </button>
      )}

      {results.length > 1 && best && (
        <div className="rounded-[22px] border border-slate-200 bg-white px-5 py-4 shadow-sm flex flex-col md:flex-row items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-orange-50 flex items-center justify-center border border-orange-100">
            <Zap className="w-5 h-5 text-orange-500" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-base font-bold text-slate-900 mb-1">Margin Snapshot</h4>
            <p className="text-[13px] text-slate-500 leading-relaxed">
                Using <span className="font-extrabold text-slate-900">{best.label}</span> over the weakest visible option improves margin by about <span className="font-extrabold text-emerald-600">{fmtI((best.profit - results[results.length - 1].profit) * 100)}</span> per 100 shipments.
            </p>
          </div>
          <button className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[12px] font-semibold text-slate-700 hover:bg-slate-100">Review Mix</button>
        </div>
      )}
    </div>
  );
}

/* ── SUBCOMPONENTS ───────────────────────────────────────────────────────── */

function Stat({ label, value, highlight }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
      <p className={`text-lg font-black tracking-tight text-slate-900 ${highlight ? 'text-rose-600' : ''}`}>{value}</p>
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
