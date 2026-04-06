import { Settings, Clock, Sparkles, Sliders, Globe, Zap, X } from 'lucide-react';

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
    <div className="reveal">
      {showSettings && (
        <div className="card-premium overflow-hidden border-slate-800 bg-slate-950/90 backdrop-blur-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]">
           <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                    <Sliders size={24} />
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-white tracking-tight uppercase font-heading">Matrix Control</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Active Network Node Management</p>
                 </div>
              </div>
              <button 
                onClick={() => setShowSettings(false)}
                className="p-2 rounded-xl hover:bg-white/5 text-slate-400 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
           </div>
           
           <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                 <Globe size={14} className="text-blue-500" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Courier Availability Delta</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {couriers.map((c) => {
                  const hidden = hiddenIds.has(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleHide(c.id)}
                      className={`group relative flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-300 ${
                        hidden 
                          ? 'bg-slate-900/40 border-transparent text-slate-600 grayscale opacity-40' 
                          : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/10 ring-1 ring-white/5 hover:ring-blue-500/30'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 transition-all duration-500 ${hidden ? 'bg-slate-700' : c.level === 'premium' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]'}`} />
                      <span className={`text-[11px] font-black uppercase tracking-tight truncate ${hidden ? 'line-through' : ''}`}>{c.label}</span>
                    </button>
                  );
                })}
              </div>
           </div>
           
           <div className="px-8 py-4 bg-white/[0.02] border-t border-slate-800 flex items-center justify-between">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">System Matrix optimized for real-time engagement</span>
              <div className="flex items-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Telemetry Active</span>
              </div>
           </div>
        </div>
      )}

      {recent.length > 0 && !zone && (
        <div className="flex flex-wrap items-center gap-3 py-4 animate-in fade-in slide-in-from-left-4 duration-700">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/5 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 mr-2">
             <Clock size={12} className="text-slate-400" />
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recent Intelligence</span>
          </div>
          {recent.map((r, i) => (
            <button
              key={i}
              onClick={() => loadRecent(r)}
              className="group flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-all text-xs font-bold text-slate-500 hover:text-blue-600 shadow-sm"
            >
              <Zap size={10} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
              {r.query}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
