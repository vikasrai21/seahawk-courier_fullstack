import React from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, ChevronUp, Info, Printer, TrendingUp, Zap } from 'lucide-react';
import { CLR } from '../core';

export default function ResultsPanel({
  best,
  sortMode,
  fmt,
  fmtP,
  results,
  displayed,
  odaOn,
  odaAmt,
  expanded,
  setExpanded,
  getMarginWarning,
  svcLevel,
  customPrice,
  activeContract,
  pColor,
  setQuoteCourier,
  showAll,
  setShowAll,
  targetMargin,
  fmtI,
}) {
  return (
    <>
      {best && (
        <div className={`rounded-2xl p-4 mb-3 flex flex-wrap items-center justify-between gap-3 text-white ${best.profit > 0 ? 'bg-gradient-to-r from-green-600 to-emerald-500' : 'bg-gradient-to-r from-red-600 to-rose-500'}`}>
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 shrink-0" />
            <div>
              <p className="text-[10px] opacity-80 uppercase font-bold tracking-wide">{sortMode === 'profit' ? 'Most Profitable' : 'Cheapest Option'}</p>
              <p className="font-bold text-lg leading-tight">{best.label}
                <span className="opacity-70 text-sm font-normal ml-2">({best.mode})</span>
                <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${best.level === 'premium' ? 'bg-white/20' : 'bg-white/10'}`}>
                  {best.level === 'premium' ? '⭐' : '💰'} {best.level}
                </span>
              </p>
            </div>
          </div>
          <div className="flex gap-5 text-center">
            <div><p className="text-[10px] opacity-70">Courier Cost</p><p className="font-bold text-lg">{fmt(best.bk.total)}</p></div>
            <div><p className="text-[10px] opacity-70">Your Profit</p><p className={`font-bold text-lg ${best.profit < 0 ? 'text-red-200' : ''}`}>{fmt(best.profit)}</p></div>
            <div><p className="text-[10px] opacity-70">Margin</p><p className="font-bold text-lg">{fmtP(best.margin)}</p></div>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-3">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-sm text-gray-700">All Options — {sortMode === 'profit' ? 'highest profit first' : 'cheapest first'}</h2>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              {odaOn && <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">ODA +{fmt(odaAmt)}</span>}
              <span>{results.length} services</span>
            </div>
          </div>

          <div className="divide-y divide-gray-50">
            {displayed.map((r, i) => (
              <div key={r.id}>
                <div
                  onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                  className={`px-4 py-3 flex flex-wrap items-center gap-3 cursor-pointer transition-all hover:bg-gray-50 ${i === 0 ? 'bg-green-50/60' : r.profit < 0 ? 'bg-red-50/30' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${i === 0 ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="font-bold text-sm">{r.label}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${CLR[r.color]}`}>{r.mode}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${r.level === 'premium' ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-500'}`}>
                        {r.level === 'premium' ? '⭐' : '💰'} {r.level}
                      </span>
                      {i === 0 && <span className="text-[9px] font-bold bg-green-600 text-white px-1.5 py-0.5 rounded-full">{sortMode === 'profit' ? 'BEST PROFIT' : 'CHEAPEST'}</span>}
                      {r.profit < 0 && <span className="text-[9px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">LOSS</span>}
                      {r.profit >= 0 && (() => {
                        const warning = getMarginWarning(r.id, r.margin);
                        return warning ? <span className="text-[9px] font-bold bg-orange-100 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded-full">⚠ Below {warning.minMarginPct}% floor</span> : null;
                      })()}
                      {r.bk.notes.length > 0 && <span className="text-[9px] text-gray-400">⚠ {r.bk.notes[0]}</span>}
                    </div>
                    <div className="flex gap-3 mt-0.5 text-xs text-gray-400 flex-wrap">
                      <span>Cost: <strong className="text-gray-700">{fmt(r.bk.total)}</strong></span>
                      <span>Sell: <strong className="text-gray-700">{fmt(r.sell)}</strong>
                        {svcLevel === 'all' && !customPrice && !activeContract && (
                          <span className={`ml-1 ${r.level === 'premium' ? 'text-violet-500' : 'text-green-600'}`}>({r.level === 'premium' ? '⭐ prem' : '💰 eco'})</span>
                        )}
                      </span>
                      <span className="text-[10px] text-gray-300">Rate: {r.rateDate}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-5 text-right shrink-0">
                    <div><p className="text-[10px] text-gray-400">Profit</p><p className={`font-bold text-base ${r.profit > 0 ? 'text-green-700' : r.profit < 0 ? 'text-red-600' : 'text-gray-500'}`}>{fmt(r.profit)}</p></div>
                    <div><p className="text-[10px] text-gray-400">Margin</p><p className={`font-bold text-base ${pColor(r.margin)}`}>{fmtP(r.margin)}</p></div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-gray-300 shrink-0 transition-transform ${expanded === r.id ? 'rotate-90' : ''}`} />
                </div>

                {expanded === r.id && (
                  <div className="bg-slate-50 border-t border-slate-100 px-5 py-3 text-xs">
                    <p className="font-bold text-slate-700 mb-2 text-[10px] uppercase tracking-wide">Full Cost Breakdown — {r.label}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        ['Base Freight', fmt(r.bk.base)],
                        [`FSC (${r.bk.fscPct})`, fmt(r.bk.fsc)],
                        r.bk.docket > 0 && ['Docket/CN/Book', fmt(r.bk.docket)],
                        r.bk.green > 0 && ['Green/Env. tax', fmt(r.bk.green)],
                        ['Subtotal', fmt(r.bk.subtotal)],
                        ['GST 18%', fmt(r.bk.gst)],
                        r.bk.oda > 0 && ['ODA Surcharge', fmt(r.bk.oda)],
                        ['Total Cost', fmt(r.bk.total)],
                      ].filter(Boolean).map(([label, value], index) => (
                        <div key={index} className={`bg-white rounded-lg px-2.5 py-2 border ${label === 'Total Cost' ? 'border-slate-300 bg-slate-100' : 'border-gray-100'}`}>
                          <p className="text-[9px] text-gray-400 uppercase tracking-wide">{label}</p>
                          <p className={`font-bold mt-0.5 ${label === 'Total Cost' ? 'text-slate-800 text-sm' : 'text-gray-700'}`}>{value}</p>
                        </div>
                      ))}
                    </div>
                    {r.bk.notes.length > 0 && (
                      <p className="text-[10px] text-amber-600 mt-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" />{r.bk.notes.join(' · ')}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-200">
                      <span className="text-[10px] text-gray-400">If you charge {fmt(r.sell)}:</span>
                      <span className={`text-[10px] font-bold ${r.profit > 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {r.profit > 0 ? `+${fmt(r.profit)} profit (${fmtP(r.margin)})` : `${fmt(r.profit)} LOSS`}
                      </span>
                      <button onClick={() => setQuoteCourier(r)} className="ml-auto text-[10px] bg-slate-800 text-white px-2 py-1 rounded-lg hover:bg-slate-700 flex items-center gap-1">
                        <Printer className="w-2.5 h-2.5" />Use in Quote
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {results.length > 6 && (
            <button onClick={() => setShowAll(!showAll)} className="w-full py-3 text-xs font-semibold text-slate-600 hover:bg-gray-50 flex items-center justify-center gap-1 border-t border-gray-100">
              {showAll ? <><ChevronUp className="w-3.5 h-3.5" />Show less</> : <><ChevronDown className="w-3.5 h-3.5" />Show all {results.length} services</>}
            </button>
          )}
        </div>
      )}

      {results.length > 1 && best && (
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex gap-3 mb-3">
          <Zap className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
          <div className="text-sm text-slate-700">
            <strong>Monthly impact (×100 shipments):</strong>{' '}
            {best.label} vs {results[results.length - 1].label} →{' '}
            <strong className="text-green-700">{fmt(best.profit - results[results.length - 1].profit)}</strong>/shipment ={' '}
            <strong className="text-green-700">{fmtI((best.profit - results[results.length - 1].profit) * 100)}</strong>/month extra.
          </div>
        </div>
      )}

      {best?.profit < 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex gap-3">
          <Info className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">
            <strong>All couriers exceed your selling price.</strong>{' '}
            {targetMargin && `To achieve ${targetMargin}% margin, `}
            Use the manual override (✏️) above to set a higher selling price, or switch to Economy filter.
          </p>
        </div>
      )}
    </>
  );
}
