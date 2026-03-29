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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">📍 Destination</p>
      <div className="relative">
        {pinLoad ? <Loader className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" /> : <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />}
        <input className="input pl-9 text-sm" placeholder="PIN code or city name…" value={query} onChange={(e) => handleQueryChange(e.target.value)} maxLength={50} />
        {zone && (
          <button
            onClick={() => {
              setQuery('');
              setZone(null);
              setLocInfo(null);
              setExpanded(null);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      {isPin && query.length < 6 && <p className="text-[10px] text-gray-400 mt-1">Enter all 6 digits…</p>}
      {suggestions.length > 0 && (
        <div className="border border-gray-100 rounded-xl mt-1 overflow-hidden max-h-40 overflow-y-auto shadow-sm">
          {suggestions.map((c, i) => (
            <button key={i} onClick={() => selectCity(c)} className="w-full text-left px-3 py-2 hover:bg-blue-50 text-xs border-b border-gray-50 last:border-0 flex items-center gap-2">
              <MapPin className="w-3 h-3 text-gray-300 shrink-0" />
              <span>
                <strong>{c.label}</strong>
                <span className="text-gray-400 ml-1">— {c.state}</span>
              </span>
            </button>
          ))}
        </div>
      )}
      {pinError && (
        <p className="text-[10px] text-red-500 mt-1.5 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {pinError}
        </p>
      )}
      {locInfo && zone && (
        <div className="mt-2 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-green-800 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> {locInfo.label}
              </p>
              {locInfo.pincode && <p className="text-[10px] text-green-600">PIN {locInfo.pincode}</p>}
            </div>
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${odaOn ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-700'}`}>{odaOn ? 'ODA' : 'Standard'}</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {[['TK', zone.trackon], ['DL', 'Z-' + zone.delhivery], ['DTDC', zone.dtdc], ['BD', zone.bd], ['GEC', zone.gec], ['LTL', zone.ltl]].map(([k, v]) => (
              <span key={k} className="text-[9px] bg-white border border-green-200 rounded-full px-1.5 py-0.5 text-green-700">
                <span className="opacity-50">{k}:</span>
                {v}
              </span>
            ))}
          </div>
          {zoneConf && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${zoneConf === 'high' ? 'bg-green-500' : zoneConf === 'medium' ? 'bg-blue-400' : 'bg-amber-400'}`} />
              <span className={`text-[9px] font-bold uppercase tracking-wide ${zoneConf === 'high' ? 'text-green-700' : zoneConf === 'medium' ? 'text-blue-600' : 'text-amber-600'}`}>
                {zoneConf === 'high' ? 'HIGH' : zoneConf === 'medium' ? 'MEDIUM' : 'LOW'} confidence
              </span>
              <span className="text-[9px] text-gray-400">{zoneConf === 'high' ? '· PIN verified · exact district known' : zoneConf === 'medium' ? '· known city · district matched' : '· state-level estimate only'}</span>
            </div>
          )}
          <div className="mt-2 pt-2 border-t border-green-100 flex items-center gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-gray-600 font-semibold">
              <input type="checkbox" checked={odaOn} onChange={(e) => setOdaOn(e.target.checked)} className="w-3 h-3" />
              ODA surcharge
            </label>
            {odaOn && (
              <div className="flex items-center gap-1 ml-auto">
                <span className="text-[10px] text-gray-400">₹</span>
                <input type="number" min="0" className="w-16 text-[10px] border border-amber-200 rounded px-1 py-0.5 text-center" value={odaAmt} onChange={(e) => setOdaAmt(e.target.value)} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
