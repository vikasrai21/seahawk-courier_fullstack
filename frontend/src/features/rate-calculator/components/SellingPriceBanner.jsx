import React from 'react';
import { Edit3 } from 'lucide-react';

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
    <div className={`${bannerColor} text-white rounded-2xl p-5 mb-4 shadow-md`}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] bg-white/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">{effectiveSell.source}</span>
            <button onClick={() => setEditPrice(!editPrice)} className="bg-white/20 hover:bg-white/30 rounded-lg p-1.5 transition-all">
              <Edit3 className="w-3 h-3" />
            </button>
            {customPrice && (
              <button onClick={() => { setCustomPrice(''); setEditPrice(false); }} className="text-[10px] bg-white/20 hover:bg-red-500/50 px-2 py-0.5 rounded-lg transition-colors">
                Reset
              </button>
            )}
          </div>
          {editPrice ? (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl font-bold opacity-60">₹</span>
              <input
                type="number" min="0" autoFocus
                className="bg-white/20 border border-white/30 rounded-xl px-3 py-1.5 text-white text-2xl font-bold w-40 placeholder-white/40 focus:outline-none focus:border-white/60"
                placeholder="Price…" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)}
              />
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold">{fmt(effectiveSell.total)}</p>
              {!customPrice && !activeContract && svcLevel === 'all' && zone && chargeWt > 0 && shipType !== 'air' && (() => {
                const economy = proposalSell(zone, chargeWt, shipType, 'economy');
                const premium = proposalSell(zone, chargeWt, shipType, 'premium');
                return economy && premium ? (
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    <span className="text-[10px] bg-white/15 rounded-lg px-2 py-1">Normal: <strong>{fmt(economy.total)}</strong></span>
                    <span className="text-[10px] bg-white/15 rounded-lg px-2 py-1">Priority: <strong>{fmt(premium.total)}</strong></span>
                    <span className="text-[10px] text-white/50 self-center">each courier uses its tier&apos;s rate</span>
                  </div>
                ) : null;
              })()}
            </>
          )}
          {effectiveSell.fsc > 0 && (
            <p className="text-[10px] opacity-50 mt-0.5">
              Base {fmt(effectiveSell.base)} + FSC {fmtP(parseFloat(effectiveSell.fscPct) || 0)} {fmt(effectiveSell.fsc)} + GST {fmt(effectiveSell.gst)}
            </p>
          )}
        </div>
        <div className="flex gap-1 bg-white/15 p-1 rounded-xl shrink-0">
          {['profit', 'cost'].map((mode) => (
            <button
              key={mode}
              onClick={() => setSortMode(mode)}
              className={`px-3.5 py-2 rounded-lg text-[11px] font-bold transition-all ${sortMode === mode ? 'bg-white text-slate-800 shadow-sm' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
            >
              {mode === 'profit' ? '↑ Max Profit' : '↓ Lowest Cost'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
