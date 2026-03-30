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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Shipment Type</p>
      <div className="space-y-1 mb-3">
        {[
          { id: 'doc', icon: <FileText className="w-3.5 h-3.5" />, label: 'Document / Packet', desc: 'Express · per consignment' },
          { id: 'surface', icon: <Truck className="w-3.5 h-3.5" />, label: 'Surface Cargo', desc: 'Road · per kg' },
          { id: 'air', icon: <Wind className="w-3.5 h-3.5" />, label: 'Air Cargo', desc: 'Air · per kg · MCW 3kg' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => { setType(t.id); setExpanded(null); setShowAll(false); }}
            className={`w-full text-left px-2.5 py-2 rounded-lg text-[11px] transition-all flex items-center gap-2.5 ${
              shipType === t.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <span className={shipType === t.id ? 'text-white/70' : 'text-slate-300'}>{t.icon}</span>
            <div>
              <p className="font-semibold leading-tight">{t.label}</p>
              <p className={shipType === t.id ? 'text-white/50 text-[10px]' : 'text-slate-400 text-[10px]'}>{t.desc}</p>
            </div>
          </button>
        ))}
      </div>
      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Speed</p>
      <div className="flex gap-1 bg-slate-100 p-0.5 rounded-lg">
        {[
          ['all', 'All'],
          ['economy', 'Normal'],
          ['premium', 'Priority'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setSvcLevel(id)}
            className={`flex-1 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
              svcLevel === id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-slate-400 mt-1.5 text-center font-medium">
        {ecoCount} normal · {premCount} priority
      </p>
      {shipType === 'air' && (
        <div className="mt-2 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5">
          <p className="text-[9px] text-amber-600">
            <strong>Note:</strong> Air cargo: Trackon + BlueDart only from Delhi/NCR.
          </p>
        </div>
      )}
    </div>
  );
}
