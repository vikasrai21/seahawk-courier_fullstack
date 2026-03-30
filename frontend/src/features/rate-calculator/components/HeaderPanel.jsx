import { Settings, Clock, Sparkles } from 'lucide-react';

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Rate Calculator</h1>
              <p className="text-[11px] text-slate-400 font-medium -mt-0.5">18 services across 7 partners</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`h-8 px-3 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-all ${showSettings ? 'bg-slate-900 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}
        >
          <Settings className="w-3.5 h-3.5" />
          Manage
        </button>
      </div>

      {showSettings && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Toggle Couriers</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1">
            {couriers.map((c) => (
              <button
                key={c.id}
                onClick={() => toggleHide(c.id)}
                className={`text-left px-2.5 py-1.5 rounded-lg text-[11px] flex items-center gap-2 transition-all ${
                  hiddenIds.has(c.id) ? 'text-slate-300 line-through' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${hiddenIds.has(c.id) ? 'bg-slate-200' : c.level === 'premium' ? 'bg-violet-400' : 'bg-emerald-400'}`} />
                <span className="truncate">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {recent.length > 0 && !zone && (
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          <span className="text-[10px] text-slate-400 font-medium mr-1">Recent</span>
          {recent.map((r, i) => (
            <button
              key={i}
              onClick={() => loadRecent(r)}
              className="text-[11px] bg-white border border-slate-200 rounded-full px-2.5 py-0.5 hover:border-slate-400 flex items-center gap-1 text-slate-500 transition-colors"
            >
              <Clock className="w-2.5 h-2.5 opacity-40" />
              {r.query}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
