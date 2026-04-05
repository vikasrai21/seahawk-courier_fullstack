import React from 'react';
import { Edit3 } from 'lucide-react';

export default function SellingPriceBanner({
  effectiveSell,
  _bannerColor,
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
    <div className="mb-4 rounded-[24px] border border-slate-200 bg-[linear-gradient(135deg,#fffaf5_0%,#ffffff_54%,#f8fbff_100%)] px-4 py-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] bg-slate-900 text-white px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">{effectiveSell.source}</span>
            <button onClick={() => setEditPrice(!editPrice)} className="border border-slate-200 bg-white hover:bg-slate-50 rounded-lg p-1.5 transition-all text-slate-500">
              <Edit3 className="w-3 h-3" />
            </button>
            {customPrice && (
              <button onClick={() => { setCustomPrice(''); setEditPrice(false); }} className="text-[10px] border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 px-2 py-1 rounded-lg transition-colors">
                Reset
              </button>
            )}
          </div>
          {editPrice ? (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl font-bold text-slate-400">₹</span>
              <input
                type="number" min="0" autoFocus
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-900 text-2xl font-bold w-40 placeholder-slate-300 focus:outline-none focus:border-slate-400"
                placeholder="Price…" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)}
              />
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold tracking-tight text-slate-900">{fmt(effectiveSell.total)}</p>
              {!customPrice && !activeContract && svcLevel === 'all' && zone && chargeWt > 0 && shipType !== 'air' && (() => {
                const economy = proposalSell(zone, chargeWt, shipType, 'economy');
                const premium = proposalSell(zone, chargeWt, shipType, 'premium');
                return economy && premium ? (
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] border border-slate-200 bg-white rounded-lg px-2 py-1 text-slate-600">Normal: <strong className="text-slate-900">{fmt(economy.total)}</strong></span>
                    <span className="text-[10px] border border-orange-200 bg-orange-50 rounded-lg px-2 py-1 text-orange-700">Priority: <strong>{fmt(premium.total)}</strong></span>
                    <span className="text-[10px] text-slate-400 self-center">proposal-side reference only</span>
                  </div>
                ) : null;
              })()}
            </>
          )}
          {effectiveSell.fsc > 0 && (
            <p className="text-[10px] text-slate-400 mt-0.5">
              Base {fmt(effectiveSell.base)} + FSC {fmtP(parseFloat(effectiveSell.fscPct) || 0)} {fmt(effectiveSell.fsc)} + GST {fmt(effectiveSell.gst)}
            </p>
          )}
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
          {['profit', 'cost'].map((mode) => (
            <button
              key={mode}
              onClick={() => setSortMode(mode)}
              className={`px-3.5 py-2 rounded-lg text-[11px] font-bold transition-all ${sortMode === mode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-white/70'}`}
            >
              {mode === 'profit' ? '↑ Max Profit' : '↓ Lowest Cost'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
