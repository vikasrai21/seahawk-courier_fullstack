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
    <div className="rounded-[32px] border border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-6 shadow-sm backdrop-blur-xl relative overflow-hidden group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
           <div className={`w-8 h-8 rounded-xl flex items-center justify-center bg-purple-500/10 text-purple-500`}>
              <Zap size={16} />
           </div>
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">Operational Mode</h3>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        {[
          { id: 'doc', icon: <FileText size={16} />, label: 'Document / Packet', desc: 'Express · Unit' },
          { id: 'surface', icon: <Truck size={16} />, label: 'Surface Cargo', desc: 'Road · Weight' },
          { id: 'air', icon: <Wind size={16} />, label: 'Air Priority', desc: 'Air · Weight' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => { setType(t.id); setExpanded(null); setShowAll(false); }}
            className={`w-full text-left px-4 py-3 rounded-2xl border transition-all flex items-center gap-3 relative overflow-hidden group/item ${
              shipType === t.id
                ? 'bg-slate-900 border-slate-800 text-white shadow-xl shadow-slate-900/10'
                : 'bg-slate-100/50 dark:bg-slate-800/30 border-transparent text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
            }`}
          >
            <span className={shipType === t.id ? 'text-blue-400' : 'text-slate-300'}>{t.icon}</span>
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-tight">{t.label}</p>
              <p className={`text-[9px] font-bold uppercase tracking-widest ${shipType === t.id ? 'text-slate-500' : 'text-slate-400'}`}>{t.desc}</p>
            </div>
            {shipType === t.id && (
               <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
         <div className="flex items-center gap-2 mb-3">
            <Clock size={14} className="text-blue-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Velocity Filter</span>
         </div>
         <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-100 dark:border-slate-800">
            {[
              ['all', 'Global'],
              ['economy', 'Normal'],
              ['premium', 'Priority'],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setSvcLevel(id)}
                className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  svcLevel === id ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {label}
              </button>
            ))}
         </div>
         <div className="mt-3 flex items-center justify-between px-2">
            <div className="flex items-center gap-1.5">
               <div className="w-1 h-1 rounded-full bg-slate-400" />
               <span className="text-[9px] font-bold text-slate-400 uppercase">{ecoCount} Normal</span>
            </div>
            <div className="flex items-center gap-1.5">
               <div className="w-1 h-1 rounded-full bg-blue-500" />
               <span className="text-[9px] font-bold text-slate-400 uppercase">{premCount} Priority</span>
            </div>
         </div>
      </div>
    </div>
  );
}
