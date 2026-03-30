import { Users, X } from 'lucide-react';

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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-3">
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Client</p>
        {selClient && (
          <button
            onClick={() => { setSelClient(null); setContracts([]); setClientSearch(''); }}
            className="text-[10px] text-slate-400 hover:text-red-500 flex items-center gap-0.5 transition-colors"
          >
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>
      {selClient ? (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-semibold text-sm text-slate-600">{selClient.company?.[0]?.toUpperCase()}</div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[13px] text-slate-800 truncate">{selClient.company}</p>
            <p className="text-[11px] text-slate-400">
              {selClient.code}
              {contractLoad && <span className="ml-1.5 text-blue-500">Loading…</span>}
              {!contractLoad && contracts.length > 0 && <span className="ml-1.5 text-violet-500 font-medium">✓ {contracts.length} contract{contracts.length > 1 ? 's' : ''}</span>}
              {!contractLoad && !contracts.length && <span className="ml-1.5 text-amber-500">No contracts</span>}
            </p>
          </div>
          {activeContract && (
            <div className="text-right shrink-0">
              <p className="text-[9px] text-violet-500 font-semibold uppercase">Contract</p>
              <p className="text-sm font-semibold text-slate-800">{fmt(activeContract.total)}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
          <input
            className="input pl-8 text-[13px] h-9"
            placeholder="Search client…"
            value={clientSearch}
            onChange={(e) => { setClientSearch(e.target.value); setShowClients(true); }}
            onFocus={() => setShowClients(true)}
          />
          {showClients && clientSearch && filteredClients.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-20 bg-white border border-slate-200 rounded-lg mt-1 shadow-lg overflow-hidden">
              {filteredClients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setSelClient(c); setShowClients(false); setClientSearch(''); }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-50 text-[12px] border-b border-slate-50 last:border-0 transition-colors"
                >
                  <span className="font-semibold text-slate-700">{c.company}</span>
                  <span className="text-slate-400 text-[11px] ml-2">{c.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
