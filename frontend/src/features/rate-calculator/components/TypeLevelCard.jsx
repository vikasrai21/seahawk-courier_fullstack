import { FileText, Truck, Wind } from 'lucide-react';

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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">📦 Shipment Type</p>
      <div className="space-y-1.5 mb-3">
        {[
          { id: 'doc', icon: <FileText className="w-3.5 h-3.5" />, label: 'Document / Packet', desc: 'Express · per consignment' },
          { id: 'surface', icon: <Truck className="w-3.5 h-3.5" />, label: 'Heavy Surface Cargo', desc: 'Road · per kg · MCW varies' },
          { id: 'air', icon: <Wind className="w-3.5 h-3.5" />, label: 'Heavy Air Cargo', desc: 'Air · per kg · MCW 3kg' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setType(t.id);
              setExpanded(null);
              setShowAll(false);
            }}
            className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center gap-2.5 ${
              shipType === t.id ? 'border-slate-700 bg-slate-50 text-slate-800' : 'border-gray-100 text-gray-600 hover:border-gray-300'
            }`}
          >
            <span className={shipType === t.id ? 'text-slate-700' : 'text-gray-400'}>{t.icon}</span>
            <div>
              <p className="font-bold">{t.label}</p>
              <p className="text-gray-400">{t.desc}</p>
            </div>
          </button>
        ))}
      </div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">🏷 Service Level</p>
      <div className="flex gap-1.5">
        {[
          ['all', 'All', null],
          ['economy', '💰 Economy', 'bg-green-600'],
          ['premium', '⭐ Premium', 'bg-violet-600'],
        ].map(([id, label, active]) => (
          <button
            key={id}
            onClick={() => setSvcLevel(id)}
            className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
              svcLevel === id ? (active || 'bg-slate-700') + ' text-white border-transparent' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-gray-400 mt-1.5 text-center">
        {ecoCount} economy · {premCount} premium
      </p>
      {shipType === 'air' && (
        <div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5">
          <p className="text-[9px] text-amber-700">
            <strong>Note:</strong> Air cargo from Delhi/NCR: Trackon Air Cargo + BlueDart Air Cargo only. Other couriers are surface-only.
          </p>
        </div>
      )}
    </div>
  );
}
