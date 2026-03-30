import { Search, Loader, X, MapPin, AlertTriangle, CheckCircle } from 'lucide-react';

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
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Destination</p>
      <div className="relative">
        {pinLoad ? <Loader className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 animate-spin" /> : <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />}
        <input className="input pl-8 text-[13px] h-9" placeholder="PIN code or city…" value={query} onChange={(e) => handleQueryChange(e.target.value)} maxLength={50} />
        {zone && (
          <button
            onClick={() => { setQuery(''); setZone(null); setLocInfo(null); setExpanded(null); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {isPin && query.length < 6 && <p className="text-[10px] text-slate-400 mt-1">Enter all 6 digits…</p>}
      {suggestions.length > 0 && (
        <div className="border border-slate-100 rounded-lg mt-1 overflow-hidden max-h-36 overflow-y-auto">
          {suggestions.map((c, i) => (
            <button key={i} onClick={() => selectCity(c)} className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-[12px] border-b border-slate-50 last:border-0 flex items-center gap-2 transition-colors">
              <MapPin className="w-3 h-3 text-slate-300 shrink-0" />
              <span><strong className="text-slate-700">{c.label}</strong><span className="text-slate-400 ml-1">— {c.state}</span></span>
            </button>
          ))}
        </div>
      )}
      {pinError && (
        <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{pinError}</p>
      )}
      {locInfo && zone && (
        <div className="mt-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-semibold text-slate-700 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-500" /> {locInfo.label}
              {locInfo.pincode && <span className="text-slate-400 font-normal ml-1">· {locInfo.pincode}</span>}
            </p>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${odaOn ? 'bg-amber-100 text-amber-700' : 'bg-emerald-50 text-emerald-600'}`}>{odaOn ? 'ODA' : 'Standard'}</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {[['TK', zone.trackon], ['DL', 'Z-' + zone.delhivery], ['DTDC', zone.dtdc], ['BD', zone.bd], ['GEC', zone.gec], ['LTL', zone.ltl]].map(([k, v]) => (
              <span key={k} className="text-[9px] bg-white border border-slate-200 rounded px-1.5 py-0.5 text-slate-500 font-mono">
                <span className="text-slate-300">{k}</span> {v}
              </span>
            ))}
          </div>
          {zoneConf && (
            <div className="flex items-center gap-1 mt-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${zoneConf === 'high' ? 'bg-emerald-400' : zoneConf === 'medium' ? 'bg-blue-400' : 'bg-amber-400'}`} />
              <span className={`text-[9px] font-medium ${zoneConf === 'high' ? 'text-emerald-600' : zoneConf === 'medium' ? 'text-blue-500' : 'text-amber-500'}`}>
                {zoneConf === 'high' ? 'High' : zoneConf === 'medium' ? 'Medium' : 'Low'} confidence
              </span>
            </div>
          )}
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-500 font-medium">
              <input type="checkbox" checked={odaOn} onChange={(e) => setOdaOn(e.target.checked)} className="w-3 h-3 rounded" />
              ODA surcharge
            </label>
            {odaOn && (
              <div className="flex items-center gap-1 ml-auto">
                <span className="text-[10px] text-slate-400">₹</span>
                <input type="number" min="0" className="w-14 text-[10px] border border-slate-200 rounded px-1.5 py-0.5 text-center" value={odaAmt} onChange={(e) => setOdaAmt(e.target.value)} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
