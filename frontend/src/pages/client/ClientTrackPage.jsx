// src/pages/client/ClientTrackPage.jsx — Tracking for client portal
import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { formatStatusLabel, normalizeStatus } from '../../components/ui/StatusBadge';

const STATUS_STEPS = ['Booked', 'PickedUp', 'InTransit', 'OutForDelivery', 'Delivered'];

export default function ClientTrackPage({ toast }) {
  const [awb, setAwb]         = useState('');
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);

  async function track() {
    if (!awb.trim()) return;
    setLoading(true);
    try {
      const r = await api.get(`/tracking/public/${awb.trim()}`);
      setResult(r.data);
    } catch(e) {
      toast?.(e.message || 'AWB not found', 'error');
      setResult(null);
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen client-premium-shell">
      <header className="client-premium-header px-6 py-4 flex items-center gap-3">
        <Link to="/portal" className="text-gray-400 hover:text-gray-600">← Portal</Link>
        <span className="client-premium-title text-lg">Track Shipment</span>
      </header>
      <div className="client-premium-main max-w-3xl">
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Enter AWB / tracking number"
            value={awb}
            onChange={e => setAwb(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && track()}
          />
          <button onClick={track} disabled={loading} className="btn-primary">
            {loading ? '...' : '🔍 Track'}
          </button>
        </div>

        {result && (
          <div className="client-premium-card p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">AWB</div>
                <div className="font-mono font-bold text-gray-900">{result.shipment?.awb}</div>
              </div>
              <span className="badge badge-blue">{result.shipment?.status}</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mt-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Consignee</span> <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{result.shipment?.consignee}</span></div>
              <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Destination</span> <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{result.shipment?.destination}</span></div>
              <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Courier</span> <span className="font-bold text-orange-600 truncate">{result.shipment?.courier}</span></div>
              <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Weight</span> <span className="font-bold text-emerald-600 tabular-nums">{result.shipment?.weight} kg</span></div>
            </div>

            {(() => {
              const currentStep = STATUS_STEPS.indexOf(normalizeStatus(result.shipment?.status));
              return currentStep >= 0 ? (
                <div className="py-6 px-2 my-2 w-full mx-auto">
                  <div className="flex items-center justify-between relative px-4">
                    {/* Background line */}
                    <div className="absolute top-4 left-8 right-8 h-1 bg-slate-100 dark:bg-slate-800 -z-10 rounded-full" />
                    {/* Foreground line */}
                    <div className="absolute top-4 left-8 h-1 bg-orange-500 -z-10 rounded-full transition-all duration-700" 
                         style={{ width: `calc(${(Math.max(0, currentStep) / (STATUS_STEPS.length - 1)) * 100}% - 4rem + ${currentStep > 0 ? '2rem' : '0rem'})` }} />
                    
                    {STATUS_STEPS.map((step, i) => {
                      const isActive = i <= currentStep;
                      const isCurrent = i === currentStep;
                      
                      return (
                        <div key={step} className="flex flex-col items-center gap-2 z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-500 ${
                            isActive 
                              ? 'bg-orange-500 border-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]' 
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 shadow-sm'
                          } ${isCurrent ? 'scale-110 ring-4 ring-orange-100 dark:ring-orange-900/30' : ''}`}>
                            {isActive ? '✓' : i + 1}
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-wider text-center max-w-[80px] leading-tight ${
                            isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                          }`}>
                            {formatStatusLabel(step).replace(' ', '\n')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null;
            })()}

            {result.events?.length > 0 && (
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Tracking History</div>
                <div className="space-y-2">
                  {result.events.map((ev, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <div className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${i===0?'bg-blue-500':'bg-gray-300'}`} />
                        {i < result.events.length-1 && <div className="w-0.5 bg-gray-200 flex-1 mt-1" />}
                      </div>
                      <div className="pb-3">
                        <div className="font-medium text-gray-800">{ev.status}</div>
                        <div className="text-gray-500 text-xs">{ev.location} · {new Date(ev.timestamp).toLocaleString('en-IN')}</div>
                        {ev.description && <div className="text-gray-500 text-xs">{ev.description}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
