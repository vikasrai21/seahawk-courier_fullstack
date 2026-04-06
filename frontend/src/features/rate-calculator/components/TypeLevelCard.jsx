import { FileText, Truck, Wind, Clock, Zap } from 'lucide-react';

export default function TypeLevelCard({
  shipType,
  setType,
  setExpanded,
  setShowAll,
  svcLevel,
  setSvcLevel,
  ecoCount,
  premCount,
}) {
  return (
    <div className="rate-section flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
           <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-indigo-500/10 text-indigo-600">
              <Zap size={14} />
           </div>
           <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Shipment type</h3>
              <p className="text-xs text-slate-500">Mode and speed</p>
           </div>
        </div>
      </div>

      <div className="space-y-2 mb-4 flex-1">
        {[
          { id: 'doc', icon: <FileText size={18} />, label: 'Document / Packet', desc: 'Express · Unit Based' },
          { id: 'surface', icon: <Truck size={18} />, label: 'Surface Cargo', desc: 'Road · Weight Based' },
          { id: 'air', icon: <Wind size={18} />, label: 'Air Priority', desc: 'Air · Weight Based' },
        ].map((t) => {
          const active = shipType === t.id;
          return (
            <button
              key={t.id}
              onClick={() => { setType(t.id); setExpanded(null); setShowAll(false); }}
              className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all duration-300 flex items-center gap-3 relative overflow-hidden group/item ${
                active
                  ? 'bg-slate-900 border-slate-800 text-white'
                  : 'bg-white/50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/40'
              }`}
            >
              {active && <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-50" />}
              <span className={`transition-transform duration-500 ${active ? 'text-blue-400 scale-110' : 'text-slate-300 group-hover/item:scale-110'}`}>{t.icon}</span>
              <div className="flex-1 relative z-10">
                <p className="text-xs font-semibold mb-0.5">{t.label}</p>
                <p className={`text-[11px] ${active ? 'text-slate-300' : 'text-slate-400'}`}>{t.desc}</p>
              </div>
              {active ? (
                 <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                 </div>
              ) : (
                 <div className="w-5 h-5 rounded-full border border-slate-200 dark:border-slate-700 group-hover/item:border-slate-400 transition-colors" />
              )}
            </button>
          );
        })}
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
         <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
               <Clock size={14} className="text-blue-500" />
               <span className="text-xs font-semibold text-slate-700">Service level</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-500">
               <span>{ecoCount} normal</span>
               <span>{premCount} priority</span>
            </div>
         </div>
         
         <div className="flex bg-slate-100/70 dark:bg-slate-900/60 p-1 rounded-lg border border-slate-200/50 dark:border-slate-800">
            {[
              ['all', 'Global'],
              ['economy', 'Normal'],
              ['premium', 'Priority'],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setSvcLevel(id)}
                className={`flex-1 py-2 rounded-md text-xs font-semibold transition-all duration-300 ${
                  svcLevel === id ? 'bg-white dark:bg-slate-800 text-blue-600 ring-1 ring-slate-200/50 dark:ring-slate-700/50' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                {label}
              </button>
            ))}
         </div>
      </div>
    </div>
  );
}
