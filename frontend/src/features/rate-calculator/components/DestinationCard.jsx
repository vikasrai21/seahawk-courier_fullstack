import { Search, Loader, X, MapPin, AlertTriangle, CheckCircle, Crosshair } from 'lucide-react';

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
  const pinDigits = String(query || '').replace(/\D/g, '');
  const pinProgress = Math.min(pinDigits.length, 6);
  const pinVerified = !!locInfo?.pincode && !pinError && !pinLoad;
  const pinActive = isPin || pinLoad || pinVerified || !!pinError;
  const inputTone = pinError
    ? 'border-rose-300 bg-rose-50/30 text-rose-800'
    : pinVerified
      ? 'border-emerald-300 bg-emerald-50/20 text-emerald-800'
      : pinLoad
        ? 'border-blue-300 bg-blue-50/20 text-slate-900'
        : 'border-slate-200';

  const zoneBadges = [
    ['TK', zone?.trackon],
    ['DL', zone ? `Z-${zone.delhivery}` : null],
    ['DTDC', zone?.dtdc],
    ['PT', zone?.pt],
    ['SH', zone?.seahawkZone],
  ].filter(([, value]) => value);

  return (
    <div className="rate-section flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
           <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-500 ${locInfo && zone ? 'bg-orange-500/10 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
              <Crosshair size={14} className={pinLoad ? 'animate-pulse' : ''} />
           </div>
           <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Destination</h3>
              <p className="text-xs text-slate-500">PIN or city</p>
           </div>
        </div>
        {locInfo && zone && (
          <div className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
            delhiveryOda || odaOn
              ? 'border-rose-500/20 bg-rose-500/5 text-rose-600'
              : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600'
          }`}>
            {delhiveryOda ? 'ODA' : odaOn ? 'Custom ODA' : 'Standard'}
          </div>
        )}
      </div>

      <div className="relative mb-4">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10">
          {pinLoad ? <Loader className="w-4 h-4 text-orange-500 animate-spin" /> : <Search className="w-4 h-4 text-slate-300 transition-colors" />}
        </div>
        <input 
          className={`input pl-10 pr-9 py-3 text-sm font-semibold ${inputTone}`}
          placeholder={isPin ? '000000' : 'PIN or city'} 
          value={query} 
          onChange={(e) => handleQueryChange(e.target.value)} 
          maxLength={isPin ? 6 : 50}
          inputMode={isPin ? 'numeric' : 'text'}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setZone(null); setLocInfo(null); setExpanded(null); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex-1">
        {pinActive && (
          <div className="flex items-center gap-2 mb-3 px-1">
            <div className={`w-1.5 h-1.5 rounded-full ${pinError ? 'bg-rose-500' : pinVerified ? 'bg-emerald-500' : pinLoad ? 'bg-blue-500 animate-pulse' : 'bg-orange-500 animate-pulse'}`} />
            <p className={`text-xs ${pinError ? 'text-rose-500' : pinVerified ? 'text-emerald-600' : 'text-slate-400'}`}>
              {pinError
                ? 'PIN validation failed'
                : pinLoad
                  ? 'Validating PIN…'
                  : pinVerified
                    ? `PIN ${locInfo.pincode} verified`
                    : `PIN ${pinProgress}/6`}
            </p>
          </div>
        )}
        
        {suggestions.length > 0 && (
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden max-h-40 overflow-y-auto animate-in slide-in-from-top-2 duration-300 mb-3">
            {suggestions.map((c, i) => (
              <button key={i} onClick={() => selectCity(c)} className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 last:border-0 flex items-center gap-3 transition-all group/item">
                <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover/item:bg-blue-500 group-hover/item:text-white transition-all">
                   <MapPin size={12} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{c.label}</span>
                  <span className="text-[10px] text-slate-400">{c.state}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {pinError && (
          <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/10 flex items-center gap-3 animate-in slide-in-from-top-2 mb-3">
             <AlertTriangle size={16} className="text-rose-500" />
             <p className="text-xs text-rose-700">{pinError}</p>
          </div>
        )}

        {locInfo && zone && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-800">
               <div className="flex flex-col">
                  <span className="text-xs font-semibold text-slate-800 dark:text-white">{locInfo.label}</span>
                  <span className="text-[11px] text-slate-500">Pincode: {locInfo.pincode || 'System'}</span>
               </div>
               <CheckCircle size={16} className="text-emerald-500" />
            </div>

            <div className="flex flex-wrap gap-2">
              {zoneBadges.map(([k, v]) => (
                <span key={k} className="text-[11px] text-slate-600 bg-slate-100 border border-slate-200 rounded-md px-2 py-1">
                  {k}: {v}
                </span>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer">
                 <div className="relative">
                   <input type="checkbox" checked={odaOn} onChange={(e) => setOdaOn(e.target.checked)} className="peer sr-only" />
                   <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 rounded-full peer-checked:bg-rose-500 transition-all duration-300" />
                   <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 peer-checked:translate-x-4 shadow-sm" />
                 </div>
                 <span className="text-xs text-slate-600">Force ODA</span>
              </label>
              {odaOn && (
                <div className="flex items-center gap-2 animate-in slide-in-from-right-4 transition-all">
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-rose-400">₹</span>
                    <input type="number" min="0" className="w-20 bg-rose-500/[0.03] border border-rose-500/20 rounded-lg pl-6 pr-2 py-1.5 text-xs font-semibold text-rose-600 tabular-nums focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500/40 outline-none transition-all" value={odaAmt} onChange={(e) => setOdaAmt(e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
