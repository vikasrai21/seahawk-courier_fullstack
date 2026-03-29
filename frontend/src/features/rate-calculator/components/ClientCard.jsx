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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">👤 Client — auto-loads contract rate</p>
        {selClient && (
          <button
            onClick={() => {
              setSelClient(null);
              setContracts([]);
              setClientSearch('');
            }}
            className="text-[10px] text-gray-400 hover:text-red-500 flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>
      {selClient ? (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-sm text-slate-700">{selClient.company?.[0]?.toUpperCase()}</div>
          <div>
            <p className="font-bold text-sm">{selClient.company}</p>
            <p className="text-xs text-gray-400">
              {selClient.code}
              {contractLoad && <span className="ml-2 text-blue-500">Loading contracts…</span>}
              {!contractLoad && contracts.length > 0 && <span className="ml-2 text-purple-600 font-semibold">✓ {contracts.length} contract{contracts.length > 1 ? 's' : ''} active</span>}
              {!contractLoad && !contracts.length && <span className="ml-2 text-amber-500">No active contracts — using proposal rates</span>}
            </p>
          </div>
          {activeContract && (
            <div className="ml-auto text-right">
              <p className="text-[10px] text-purple-600 font-bold uppercase">Contract Rate</p>
              <p className="text-sm font-bold">{fmt(activeContract.total)}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9 text-sm"
            placeholder="Search client by name or code…"
            value={clientSearch}
            onChange={(e) => {
              setClientSearch(e.target.value);
              setShowClients(true);
            }}
            onFocus={() => setShowClients(true)}
          />
          {showClients && clientSearch && filteredClients.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-20 bg-white border border-gray-100 rounded-xl mt-1 shadow-lg overflow-hidden">
              {filteredClients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelClient(c);
                    setShowClients(false);
                    setClientSearch('');
                  }}
                  className="w-full text-left px-3 py-2.5 hover:bg-gray-50 text-sm border-b border-gray-50 last:border-0"
                >
                  <span className="font-semibold">{c.company}</span>
                  <span className="text-gray-400 text-xs ml-2">{c.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
