import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const STATUS_COLORS = {
  Booked: '#64748b',
  InTransit: '#2563eb',
  OutForDelivery: '#f97316',
  Delayed: '#dc2626',
  NDR: '#b91c1c',
  RTO: '#7c2d12',
};

function coordinateToPosition(lat, lon) {
  const india = { minLat: 6, maxLat: 38, minLon: 68, maxLon: 98 };
  const x = ((lon - india.minLon) / (india.maxLon - india.minLon)) * 100;
  const y = 100 - ((lat - india.minLat) / (india.maxLat - india.minLat)) * 100;
  return { x: Math.max(4, Math.min(96, x)), y: Math.max(6, Math.min(94, y)) };
}

export default function ClientLiveMapPage({ toast }) {
  const [rows, setRows] = useState([]);
  const [geoRows, setGeoRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/portal/map/shipments?range=30d');
        const shipments = res.data?.shipments || [];
        setRows(shipments);

        const geocoded = await Promise.all(shipments.slice(0, 24).map(async (item) => {
          const query = encodeURIComponent(item.pincode || item.locationHint || item.destination || '');
          if (!query) return null;
          try {
            const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=in&limit=1&q=${query}`);
            const data = await resp.json();
            const point = data?.[0];
            if (!point) return null;
            return {
              ...item,
              lat: Number(point.lat),
              lon: Number(point.lon),
              label: point.display_name,
            };
          } catch {
            return null;
          }
        }));

        setGeoRows(geocoded.filter(Boolean));
      } catch (err) {
        toast?.(err.message || 'Failed to load live map', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const grouped = useMemo(() => {
    const summary = new Map();
    for (const row of rows) {
      summary.set(row.status, (summary.get(row.status) || 0) + 1);
    }
    return [...summary.entries()];
  }, [rows]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link to="/portal" className="text-gray-400 hover:text-gray-600">← Portal</Link>
        <span className="font-bold text-gray-900">Live Shipment Map</span>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-5">
        <div className="card">
          <h1 className="font-bold text-gray-900">Active Shipment Geography</h1>
          <p className="text-sm text-gray-500 mt-1">Pins are placed from destination or latest scan location hints for your active shipments.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {grouped.map(([status, count]) => (
              <div key={status} className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: `${STATUS_COLORS[status] || '#64748b'}18`, color: STATUS_COLORS[status] || '#64748b' }}>
                {status}: {count}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,330px] gap-5">
          <div className="card">
            <div
              style={{
                position: 'relative',
                height: 520,
                borderRadius: 20,
                overflow: 'hidden',
                background: 'radial-gradient(circle at 15% 20%, #dbeafe 0, #eff6ff 25%, #f8fafc 60%), linear-gradient(135deg, #fff 0%, #f8fafc 100%)',
                border: '1px solid #dbeafe',
              }}
            >
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(to right, rgba(148,163,184,.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,.12) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
              <div style={{ position: 'absolute', left: 18, top: 18, color: '#0f172a', fontWeight: 800 }}>India Delivery Grid</div>
              {loading && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#64748b' }}>Locating shipments…</div>}
              {!loading && geoRows.map((row) => {
                const pos = coordinateToPosition(row.lat, row.lon);
                return (
                  <div key={row.awb} style={{ position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}>
                    <div title={`${row.awb} · ${row.destination || row.label}`} style={{ width: 14, height: 14, borderRadius: 999, background: STATUS_COLORS[row.status] || '#334155', boxShadow: `0 0 0 6px ${(STATUS_COLORS[row.status] || '#334155')}22` }} />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <h2 className="font-bold text-gray-900">Pin Details</h2>
            <div className="mt-4 space-y-3 max-h-[470px] overflow-y-auto">
              {geoRows.length === 0 && !loading ? (
                <div className="text-sm text-gray-500">No map-ready locations found yet.</div>
              ) : geoRows.map((row) => (
                <div key={row.awb} className="rounded-xl border border-gray-100 p-3 bg-gray-50">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-mono text-xs font-semibold text-gray-900">{row.awb}</div>
                    <span className="badge badge-blue">{row.status}</span>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-gray-900">{row.destination || row.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{row.courier || 'Courier pending'} · {row.latestEvent?.location || 'Destination pin'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
