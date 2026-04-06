import { Users, X, Search, ChevronRight, AlertCircle } from 'lucide-react';

export default function ClientCard({
  selClient,
  setSelClient,
  setContracts,
  setClientSearch,
  contractLoad,
  contracts,
  activeContract,
  fmt,
  clientSearch,
  setShowClients,
  showClients,
  filteredClients,
}) {
  return (
    <div className="rate-section">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
           <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-500 ${selClient ? 'bg-indigo-500/10 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
              <Users size={14} />
           </div>
           <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Client</h3>
              <p className="text-xs text-slate-500">Search to apply contracts</p>
           </div>
        </div>
        {selClient && (
          <button
            onClick={() => { setSelClient(null); setContracts([]); setClientSearch(''); }}
            className="p-1.5 rounded-md bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all border border-rose-500/20"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {selClient ? (
        <div className="space-y-4 reveal">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-900 border border-indigo-500/20 flex items-center justify-center font-semibold text-sm text-indigo-600">
               {selClient.company?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
               <p className="font-semibold text-sm text-slate-900 dark:text-white truncate tracking-tight">{selClient.company}</p>
               <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-slate-500">{selClient.code}</span>
                  {contractLoad && (
                    <div className="flex items-center gap-1">
                       <div className="w-1 h-1 rounded-full bg-blue-500 animate-ping" />
                       <span className="text-[10px] text-blue-500">Syncing…</span>
                    </div>
                  )}
               </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-2">
             <div className="text-xs text-slate-500">
                Active contracts: <span className={`font-semibold ${contracts.length > 0 ? 'text-indigo-600' : 'text-slate-300'}`}>{contracts.length}</span>
             </div>
             <div className="text-xs text-slate-500 text-right">
                Pricing: <span className={`font-semibold ${activeContract ? 'text-emerald-600' : 'text-slate-300'}`}>{activeContract ? 'Contract' : 'Proposal'}</span>
             </div>
          </div>

          {!contractLoad && !contracts.length && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 animate-in slide-in-from-top-2">
               <AlertCircle size={14} className="text-amber-500 shrink-0" />
               <span className="text-xs text-amber-700">No private contracts found. Using proposal rates.</span>
            </div>
          )}
        </div>
      ) : (
        <div className="relative group/search reveal">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10 transition-transform duration-300 group-focus-within/search:scale-110">
             <Search size={16} className="text-slate-300 group-focus-within/search:text-indigo-500" />
          </div>
          <input
            className="input pl-10 pr-9 py-3 text-sm font-semibold"
            placeholder="Search client…"
            value={clientSearch}
            onChange={(e) => { setClientSearch(e.target.value); setShowClients(true); }}
            onFocus={() => setShowClients(true)}
          />
          {showClients && clientSearch && (
            <div className="absolute top-[calc(100%+12px)] left-0 right-0 z-[100] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in slide-in-from-top-4 duration-300">
               <div className="p-3 bg-slate-50 dark:bg-black/20 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500 ml-3">Results ({filteredClients.length})</span>
               </div>
               <div className="max-h-[300px] overflow-y-auto">
                 {filteredClients.length > 0 ? filteredClients.map((c) => (
                   <button
                     key={c.id}
                     onClick={() => { setSelClient(c); setShowClients(false); setClientSearch(''); }}
                     className="w-full text-left px-4 py-3 hover:bg-indigo-500/5 dark:hover:bg-indigo-500/10 flex items-center gap-4 transition-all group/item border-b border-slate-50 dark:border-slate-800 last:border-0"
                   >
                     <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover/item:bg-indigo-500 group-hover/item:text-white transition-all transform group-hover/item:scale-110">
                        {c.company?.[0]?.toUpperCase()}
                     </div>
                     <div className="flex-1">
                        <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 tracking-tight leading-none mb-1 group-hover/item:text-indigo-600 transition-colors">{c.company}</p>
                        <p className="text-[11px] text-slate-400">{c.code}</p>
                     </div>
                     <ChevronRight size={16} className="text-slate-300 opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all" />
                   </button>
                 )) : (
                   <div className="p-8 text-center">
                      <p className="text-xs text-slate-400">No clients found</p>
                   </div>
                 )}
               </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
