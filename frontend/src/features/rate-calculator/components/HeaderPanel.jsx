import { Settings, Clock } from 'lucide-react';

export default function HeaderPanel({
  showSettings,
  setShowSettings,
  couriers,
  hiddenIds,
  toggleHide,
  recent,
  zone,
  loadRecent,
}) {
  return (
    <>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courier Rate & Profit Calculator</h1>
          <p className="text-xs text-gray-400 mt-0.5">17 services · Trackon · Delhivery · DTDC (5) · GEC · LTL · BlueDart · B2B · All rates from partner documents</p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-all ${showSettings ? 'bg-slate-800 text-white border-slate-800' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'}`}
        >
          <Settings className="w-3.5 h-3.5" />
          Couriers
        </button>
      </div>

      {showSettings && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-4 shadow-sm">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Show / Hide Couriers</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
            {couriers.map((c) => (
              <button
                key={c.id}
                onClick={() => toggleHide(c.id)}
                className={`text-left px-2.5 py-2 rounded-lg border text-xs flex items-center gap-2 transition-all ${
                  hiddenIds.has(c.id) ? 'bg-gray-50 border-gray-200 text-gray-400 line-through' : 'bg-white border-gray-200 text-gray-800 hover:border-blue-300'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.level === 'premium' ? 'bg-violet-500' : 'bg-green-500'}`} />
                <span className="truncate">{c.label}</span>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 mt-2">Settings saved to browser. <span className="text-violet-600">● Premium</span> <span className="text-green-600">● Economy</span></p>
        </div>
      )}

      {recent.length > 0 && !zone && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-[10px] text-gray-400 self-center mr-1">Recent:</span>
          {recent.map((r, i) => (
            <button
              key={i}
              onClick={() => loadRecent(r)}
              className="text-xs bg-white border border-gray-200 rounded-full px-2.5 py-1 hover:border-slate-400 flex items-center gap-1 text-gray-600"
            >
              <Clock className="w-2.5 h-2.5 opacity-50" />
              {r.query}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
