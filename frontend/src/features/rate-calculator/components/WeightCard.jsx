import { Target } from 'lucide-react';

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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Weight</p>
      <input type="number" step="0.1" min="0" className="input glass-card h-9 text-[13px] mb-2" placeholder="Actual weight (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} />
      <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-500 mb-2 select-none">
        <input type="checkbox" checked={useVol} onChange={(e) => setUseVol(e.target.checked)} className="rounded" />
        Volumetric (L×W×H ÷ {volumetricDivisor})
      </label>
      {useVol && (
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {['l', 'b', 'h'].map((k) => (
            <input key={k} type="number" min="0" placeholder={k.toUpperCase() + ' cm'} className="input text-[11px] h-8 text-center" value={dims[k]} onChange={(e) => setDims((d) => ({ ...d, [k]: e.target.value }))} />
          ))}
        </div>
      )}
      {chargeWt > 0 && (
        <div className="text-[11px] bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1.5 text-slate-600">
          Chargeable: <strong className="text-slate-800">{chargeWt.toFixed(2)} kg</strong>
          {volWt > 0 && <span className="text-slate-400 ml-1">(vol: {volWt.toFixed(2)})</span>}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-slate-100">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <Target className="w-3 h-3" /> Target Margin
        </p>
        <div className="flex items-center gap-2">
          <input type="number" min="0" max="99" className="input flex-1 text-[11px] h-8" placeholder="e.g. 30" value={targetMargin} onChange={(e) => setTargetMargin(e.target.value)} />
          <span className="text-[11px] text-slate-400 font-semibold">%</span>
        </div>
        {targetMargin &&
          parseFloat(targetMargin) > 0 &&
          results.length > 0 &&
          (() => {
            const m = parseFloat(targetMargin) / 100;
            const minSell = m < 1 ? Math.round((results[0].bk.total / (1 - m)) * 100) / 100 : null;
            return minSell ? (
              <p className="text-[10px] mt-1 text-emerald-600 font-medium">
                Charge ≥ {fmt(minSell)} via {results[0].label}
              </p>
            ) : null;
          })()}
      </div>
    </div>
  );
}
