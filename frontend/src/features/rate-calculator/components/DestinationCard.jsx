import { Search, Loader, X, MapPin, AlertTriangle, CheckCircle, Zap } from 'lucide-react';

export default function DestinationCard({
  pinLoad,
  query,
  handleQueryChange,
  zone,
  setQuery,
  setZone,
  setLocInfo,
  setExpanded,
  isPin,
  suggestions,
  selectCity,
  pinError,
  locInfo,
  odaOn,
  setOdaOn,
  odaAmt,
  setOdaAmt,
  zoneConf,
  delhiveryOda,
}) {
  const zoneBadges = [
    ['TK', zone?.trackon],
    ['DL', zone ? `Z-${zone.delhivery}` : null],
    ['DTDC', zone?.dtdc],
    ['PT', zone?.pt],
    ['SH', zone?.seahawkZone],
  ].filter(([, value]) => value);

  return (
    <div className="rounded-[32px] border border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-6 shadow-sm backdrop-blur-xl relative overflow-hidden group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
           <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${locInfo && zone ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-400'}`}>
              <MapPin size={16} />
           </div>
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none">Destination</h3>
        </div>
        {locInfo && zone && (
          <div className={`animate-in fade-in zoom-in-95 duration-300 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
            delhiveryOda || odaOn
              ? 'border-rose-200 bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:border-rose-800/50'
              : 'border-emerald-200 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:border-emerald-800/50'
          }`}>
            {delhiveryOda ? 'Delhivery ODA' : odaOn ? 'Custom ODA' : 'Standard Area'}
          </div>
        )}
      </div>

      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          {pinLoad ? <Loader className="w-4 h-4 text-blue-500 animate-spin" /> : <Search className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />}
        </div>
        <input 
          className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl pl-11 pr-10 py-3 text-sm font-black placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 transition-all tabular-nums" 
          placeholder="PIN or City Name…" 
          value={query} 
          onChange={(e) => handleQueryChange(e.target.value)} 
          maxLength={50} 
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setZone(null); setLocInfo(null); setExpanded(null); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isPin && query.length < 6 && <p className="text-[10px] font-bold text-slate-400 mt-2 ml-1 animate-pulse uppercase tracking-widest">Waiting for 6 digits…</p>}
      
      {suggestions.length > 0 && (
        <div className="absolute left-6 right-6 mt-1 z-50 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 shadow-2xl backdrop-blur-xl overflow-hidden max-h-48 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
          {suggestions.map((c, i) => (
            <button key={i} onClick={() => selectCity(c)} className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-b border-slate-100 dark:border-slate-800 last:border-0 flex items-center gap-3 transition-all group/item">
              <MapPin size={12} className="text-slate-300 group-hover/item:text-blue-500" />
              <div className="flex flex-col">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">{c.label}</span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{c.state}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {pinError && (
        <div className="mt-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/50 flex items-center gap-2 animate-in slide-in-from-top-2">
           <AlertTriangle size={14} className="text-rose-500" />
           <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest leading-none">{pinError}</p>
        </div>
      )}

      {locInfo && zone && (
        <div className="mt-4 space-y-4 animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
             <div className="flex flex-col">
                <span className="text-xs font-black text-slate-800 dark:text-white leading-none mb-1 uppercase tracking-tight">{locInfo.label}</span>
                <span className="text-[10px] font-bold text-slate-400 tabular-nums uppercase tracking-widest">{locInfo.pincode || 'City Match'}</span>
             </div>
             <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCircle size={16} />
             </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {zoneBadges.map(([k, v]) => (
              <span key={k} className="text-[9px] font-black bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-600 dark:text-slate-400 shadow-sm uppercase tracking-tighter">
                <span className="text-slate-300 dark:text-slate-600 mr-1">{k}:</span>{v}
              </span>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer group/oda">
               <div className="relative">
                 <input type="checkbox" checked={odaOn} onChange={(e) => setOdaOn(e.target.checked)} className="peer sr-only" />
                 <div className="w-8 h-4 bg-slate-200 rounded-full peer-checked:bg-rose-500 transition-all duration-300" />
                 <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-all duration-300 peer-checked:translate-x-4 shadow-sm" />
               </div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover/oda:text-slate-600 transition-colors">Force ODA</span>
            </label>
            {odaOn && (
              <div className="flex items-center gap-2 animate-in slide-in-from-right-2">
                <span className="text-[10px] font-black text-rose-500">₹</span>
                <input type="number" min="0" className="w-16 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/50 rounded-lg px-2 py-1 text-center text-[10px] font-black text-rose-600 tabular-nums placeholder:text-rose-200 focus:ring-0" value={odaAmt} onChange={(e) => setOdaAmt(e.target.value)} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
