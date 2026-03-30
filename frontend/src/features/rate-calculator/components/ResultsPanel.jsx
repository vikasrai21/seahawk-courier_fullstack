import React from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, ChevronUp, Info, Printer, TrendingUp, Zap, Award } from 'lucide-react';
import { CLR } from '../core';

/* Priority order — your most-used couriers always show first */
const GROUP_ORDER = ['Trackon', 'DTDC', 'Delhivery', 'B2B', 'BlueDart', 'GEC', 'LTL'];

/* Distinct accent per courier — visible left stripe + header tint */
const THEME = {
  Trackon:   { accent: 'border-l-orange-500', headerBg: 'bg-orange-50',  headerText: 'text-orange-800', dot: 'bg-orange-500' },
  DTDC:      { accent: 'border-l-red-500',    headerBg: 'bg-red-50',     headerText: 'text-red-800',    dot: 'bg-red-500' },
  Delhivery: { accent: 'border-l-rose-500',   headerBg: 'bg-rose-50',    headerText: 'text-rose-800',   dot: 'bg-rose-500' },
  B2B:       { accent: 'border-l-blue-500',   headerBg: 'bg-blue-50',    headerText: 'text-blue-800',   dot: 'bg-blue-500' },
  GEC:       { accent: 'border-l-cyan-500',   headerBg: 'bg-cyan-50',    headerText: 'text-cyan-800',   dot: 'bg-cyan-500' },
  LTL:       { accent: 'border-l-slate-500',  headerBg: 'bg-slate-100',  headerText: 'text-slate-700',  dot: 'bg-slate-500' },
  BlueDart:  { accent: 'border-l-indigo-500', headerBg: 'bg-indigo-50',  headerText: 'text-indigo-800', dot: 'bg-indigo-500' },
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
    <>
      {/* ── Winner banner ── */}
      {best && (
        <div className={`rounded-2xl px-5 py-4 mb-5 flex flex-wrap items-center justify-between gap-4 shadow-md ${best.profit >= 0 ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white' : 'bg-gradient-to-r from-red-600 to-red-500 text-white'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                {sortMode === 'profit' ? 'Most Profitable' : 'Lowest Cost'}
              </p>
              <p className="font-bold text-lg leading-tight">{best.label} <span className="opacity-60 text-sm font-normal">({best.mode})</span></p>
            </div>
          </div>
          <div className="flex gap-6 text-center">
            <div><p className="text-[9px] opacity-60 uppercase font-bold">Cost</p><p className="font-bold text-lg tabular-nums">{fmt(best.bk.total)}</p></div>
            <div><p className="text-[9px] opacity-60 uppercase font-bold">Sell</p><p className="font-bold text-lg tabular-nums">{fmt(best.sell)}</p></div>
            <div><p className="text-[9px] opacity-60 uppercase font-bold">Profit</p><p className={`font-bold text-lg tabular-nums ${best.profit < 0 ? 'text-red-200' : ''}`}>{fmt(best.profit)}</p></div>
            <div className="hidden sm:block"><p className="text-[9px] opacity-60 uppercase font-bold">Margin</p><p className="font-bold text-lg tabular-nums">{fmtP(best.margin)}</p></div>
          </div>
        </div>
      )}

      {/* ── Grouped results ── */}
      <div className="space-y-4 mb-5">
        {visible.map(gName => {
          const rows = groups[gName];
          const t = THEME[gName] || THEME.LTL;

          return (
            <div key={gName} className={`rounded-2xl border border-slate-200 border-l-4 ${t.accent} overflow-hidden shadow-sm bg-white`}>
              {/* Group header */}
              <div className={`${t.headerBg} px-5 py-2.5 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${t.dot}`} />
                  <span className={`text-sm font-bold ${t.headerText}`}>{gName}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-semibold">{rows.length} option{rows.length > 1 ? 's' : ''}</span>
              </div>

              {/* Mode rows */}
              <div className="divide-y divide-slate-100">
                {rows.map((r) => {
                  const isBest = r.id === best?.id;
                  const open = expanded === r.id;

                  return (
                    <div key={r.id}>
                      {/* Row button */}
                      <button
                        onClick={() => setExpanded(open ? null : r.id)}
                        className={`w-full text-left px-5 py-3 flex items-center gap-4 transition-all duration-150
                          ${isBest ? 'bg-emerald-50/60' : r.profit < 0 ? 'bg-red-50/40' : 'hover:bg-slate-50'}`}
                      >
                        {/* Expand chevron */}
                        <ChevronRight className={`w-4 h-4 text-slate-300 shrink-0 transition-transform duration-200 ${open ? 'rotate-90 text-slate-500' : ''}`} />

                        {/* Mode name + badges */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[13px] font-semibold text-slate-800">{r.mode}</span>
                            <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${CLR[r.color]}`}>
                              {r.level === 'premium' ? '⚡ Priority' : 'Normal'}
                            </span>
                            {isBest && <span className="text-[9px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-sm">✦ Best</span>}
                            {r.profit < 0 && !isBest && <span className="text-[9px] font-semibold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full border border-red-200">Loss</span>}
                            {r.bk.notes.length > 0 && <Info className="w-3 h-3 text-slate-300" />}
                          </div>
                        </div>

                        {/* Numbers — desktop */}
                        <div className="hidden sm:flex items-center gap-8 tabular-nums shrink-0">
                          <div className="text-right w-20">
                            <p className="text-[9px] text-slate-400 font-medium">Cost</p>
                            <p className="text-[13px] font-semibold text-slate-700">{fmt(r.bk.total)}</p>
                          </div>
                          <div className="text-right w-20">
                            <p className="text-[9px] text-slate-400 font-medium">Sell</p>
                            <p className="text-[13px] font-semibold text-slate-700">{fmt(r.sell)}</p>
                          </div>
                          <div className="text-right w-20">
                            <p className="text-[9px] text-slate-400 font-medium">Profit</p>
                            <p className={`text-[13px] font-bold ${r.profit > 0 ? 'text-emerald-600' : r.profit < 0 ? 'text-red-500' : 'text-slate-500'}`}>{fmt(r.profit)}</p>
                          </div>
                          <div className="text-right w-14">
                            <p className="text-[9px] text-slate-400 font-medium">Margin</p>
                            <p className={`text-[13px] font-bold ${pColor(r.margin)}`}>{fmtP(r.margin)}</p>
                          </div>
                        </div>

                        {/* Numbers — mobile */}
                        <div className="sm:hidden text-right shrink-0">
                          <p className="text-[13px] font-semibold text-slate-700">{fmt(r.bk.total)}</p>
                          <p className={`text-[11px] font-bold ${r.profit > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(r.profit)}</p>
                        </div>
                      </button>

                      {/* Expanded breakdown */}
                      <div className={`overflow-hidden transition-all duration-200 ${open ? 'max-h-[600px]' : 'max-h-0'}`}>
                        <div className="bg-slate-50 border-t border-slate-200 px-5 py-4 text-[11px]">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cost Breakdown</span>
                            <div className="flex gap-2">
                              {r.bk.mcwApplied && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[9px] font-bold border border-amber-200">MCW Applied</span>}
                              {odaOn && <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-[9px] font-bold border border-blue-200">ODA +₹{odaAmt}</span>}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {[
                              ['Base Freight', fmt(r.bk.base)],
                              [`FSC (${r.bk.fscPct})`, fmt(r.bk.fsc)],
                              r.bk.docket > 0 && ['Docket', fmt(r.bk.docket)],
                              r.bk.green > 0 && ['Green Tax', fmt(r.bk.green)],
                              ['Subtotal', fmt(r.bk.subtotal)],
                              ['GST 18%', fmt(r.bk.gst)],
                              r.bk.oda > 0 && ['ODA', fmt(r.bk.oda)],
                            ].filter(Boolean).map(([label, val], i) => (
                              <div key={i} className="bg-white rounded-lg px-3 py-2 border border-slate-200">
                                <p className="text-[9px] text-slate-400 font-medium">{label}</p>
                                <p className="font-semibold text-slate-700">{val}</p>
                              </div>
                            ))}
                            <div className="bg-slate-900 rounded-lg px-3 py-2 text-white">
                              <p className="text-[9px] text-slate-400 font-medium">Total Cost</p>
                              <p className="font-bold text-base">{fmt(r.bk.total)}</p>
                            </div>
                          </div>

                          {r.bk.notes.length > 0 && (
                            <div className="mt-3 flex items-start gap-2 bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-800">
                              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-amber-500" />
                              <ul className="text-[10px] space-y-0.5 font-medium">
                                {r.bk.notes.map((n, i) => <li key={i}>{n}</li>)}
                              </ul>
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-200">
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] text-slate-500">Selling at <strong className="text-slate-700">{fmt(r.sell)}</strong></span>
                              <span className={`text-[12px] font-bold px-3 py-1 rounded-lg ${r.profit > 0 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-600 border border-red-200'}`}>
                                {r.profit > 0 ? `+${fmt(r.profit)} profit` : `${fmt(r.profit)} loss`}
                              </span>
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); setQuoteCourier(r); }}
                              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
                            >
                              <Printer className="w-3.5 h-3.5" /> Quote
                            </button>
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
        <button onClick={() => setShowAll(!showAll)} className="w-full mb-5 py-3 text-[12px] font-semibold text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 flex items-center justify-center gap-1.5 transition-all shadow-sm">
          {showAll ? <><ChevronUp className="w-4 h-4" />Show Fewer</> : <><ChevronDown className="w-4 h-4" />Show all {sortedNames.length} courier groups ({results.length} total options)</>}
        </button>
      )}

      {/* Volume insight */}
      {results.length > 1 && best && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3 mb-4 items-start">
          <Zap className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-[12px] text-slate-700">
            <strong>Monthly return:</strong> Choosing <span className="font-bold text-blue-700">{best.label}</span> over the most expensive option saves{' '}
            <strong className="text-emerald-600">{fmtI((best.profit - results[results.length - 1].profit) * 100)}</strong> per 100 shipments.
          </div>
        </div>
      )}

      {/* Loss alert */}
      {best?.profit < 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3 items-start">
          <Info className="w-5 h-5 shrink-0 text-red-400" />
          <div className="text-[12px] text-red-800">
            <strong>Selling price deficit.</strong> All courier options yield a loss at the current sell price. Use the ✏️ override in the price banner above, or switch the Speed filter to <strong>Normal</strong>.
          </div>
        </div>
      )}
    </>
  );
}
