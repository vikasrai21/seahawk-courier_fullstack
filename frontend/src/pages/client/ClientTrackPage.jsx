// src/pages/client/ClientTrackPage.jsx — Tracking for client portal
import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link to="/portal" className="text-gray-400 hover:text-gray-600">← Portal</Link>
        <span className="font-bold text-gray-900">Track Shipment</span>
      </header>
      <div className="max-w-xl mx-auto p-6 space-y-6">
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
          <div className="card space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide">AWB</div>
                <div className="font-mono font-bold text-gray-900">{result.shipment?.awb}</div>
              </div>
              <span className="badge badge-blue">{result.shipment?.status}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Consignee:</span> <span className="font-medium">{result.shipment?.consignee}</span></div>
              <div><span className="text-gray-500">Destination:</span> <span className="font-medium">{result.shipment?.destination}</span></div>
              <div><span className="text-gray-500">Courier:</span> <span className="font-medium">{result.shipment?.courier}</span></div>
              <div><span className="text-gray-500">Weight:</span> <span className="font-medium">{result.shipment?.weight} kg</span></div>
            </div>
            {result.events?.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Timeline</div>
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
