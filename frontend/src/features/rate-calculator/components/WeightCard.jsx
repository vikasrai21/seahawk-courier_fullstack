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
  fmt,
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">⚖️ Weight</p>
      <input type="number" step="0.1" min="0" className="input mb-2" placeholder="Actual weight (kg)" value={weight} onChange={(e) => setWeight(e.target.value)} />
      <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 mb-2">
        <input type="checkbox" checked={useVol} onChange={(e) => setUseVol(e.target.checked)} />
        Include volumetric (L×W×H ÷ 5000)
      </label>
      {useVol && (
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {['l', 'b', 'h'].map((k) => (
            <input key={k} type="number" min="0" placeholder={k.toUpperCase() + ' cm'} className="input text-xs py-1.5" value={dims[k]} onChange={(e) => setDims((d) => ({ ...d, [k]: e.target.value }))} />
          ))}
        </div>
      )}
      {chargeWt > 0 && (
        <div className="text-xs bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-2 text-blue-700">
          Chargeable weight: <strong>{chargeWt.toFixed(2)} kg</strong>
          {volWt > 0 && <span className="opacity-60 ml-1.5">(vol: {volWt.toFixed(2)} kg)</span>}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
          <Target className="w-3 h-3" />
          Reverse: target margin
        </p>
        <div className="flex items-center gap-2">
          <input type="number" min="0" max="99" className="input flex-1 text-xs py-1.5" placeholder="e.g. 30" value={targetMargin} onChange={(e) => setTargetMargin(e.target.value)} />
          <span className="text-xs text-gray-400 font-bold">%</span>
        </div>
        {targetMargin &&
          parseFloat(targetMargin) > 0 &&
          results.length > 0 &&
          (() => {
            const m = parseFloat(targetMargin) / 100;
            const minSell = m < 1 ? Math.round((results[0].bk.total / (1 - m)) * 100) / 100 : null;
            return minSell ? (
              <p className="text-[10px] mt-1 text-emerald-700 font-semibold">
                Charge ≥ {fmt(minSell)} using {results[0].label} to hit {targetMargin}% margin
              </p>
            ) : null;
          })()}
      </div>
    </div>
  );
}
