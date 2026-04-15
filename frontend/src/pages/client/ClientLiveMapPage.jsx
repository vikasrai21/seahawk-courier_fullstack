import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useTheme } from '../../context/ThemeContext';

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
  const { dark } = useTheme();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [includeDelivered, setIncludeDelivered] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/portal/map/shipments?range=90d&includeDelivered=${includeDelivered ? '1' : '0'}`);
        const shipments = res?.shipments || res?.data?.shipments || [];
        setRows(shipments);
      } catch (err) {
        toast?.(err.message || 'Failed to load live map', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [includeDelivered, toast]);

  const payloadRows = useMemo(() => rows?.data?.shipments || rows?.shipments || rows || [], [rows]);
  const grouped = useMemo(() => {
    const summary = new Map();
    for (const row of payloadRows) {
      summary.set(row.status, (summary.get(row.status) || 0) + 1);
    }
    return [...summary.entries()];
  }, [payloadRows]);

  const geoRows = useMemo(() => payloadRows.filter((row) => row.geo?.lat && row.geo?.lon), [payloadRows]);

  return (
    <div className={`min-h-screen ${dark ? 'bg-slate-950' : 'bg-[linear-gradient(180deg,#f7faff_0%,#eef4fd_100%)]'}`}>
      <header className={`client-premium-header px-6 py-4 ${dark ? 'bg-slate-900/80 border-slate-800' : ''}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/portal" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-white">← Portal</Link>
            <div>
              <div className="text-sm font-black text-slate-900 dark:text-slate-100">Live Shipment Map</div>
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-orange-500 dark:text-orange-300">Geography View</div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto client-premium-main">
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_320px]">
          <div className="overflow-hidden rounded-[28px] border border-slate-200/60 bg-[linear-gradient(145deg,#0f2748_0%,#123563_55%,#174576_100%)] p-6 text-white shadow-[0_22px_50px_-30px_rgba(15,39,72,0.9)]">
            <div className="inline-flex rounded-full border border-sky-200/20 bg-sky-300/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-sky-100">
              Geography Layer
            </div>
            <h1 className="mt-4 max-w-2xl text-3xl font-black leading-tight">Watch active shipments across a cleaner, more focused India delivery grid.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
              Pins are placed from destination or latest location hints, with stronger status color separation and better side details.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIncludeDelivered((v) => !v)}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white transition hover:bg-white/20"
              >
                {includeDelivered ? 'Showing Delivered + Active' : 'Showing Active Only'}
              </button>
              {grouped.map(([status, count]) => (
                <div key={status} className="rounded-full px-3 py-1.5 text-xs font-extrabold" style={{ background: `${STATUS_COLORS[status] || '#64748b'}22`, color: '#fff' }}>
                  {status}: {count}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[26px] border border-sky-200 bg-[linear-gradient(180deg,#eff6ff_0%,#ffffff_100%)] p-5 shadow-[0_18px_40px_-28px_rgba(37,99,235,0.45)] dark:border-slate-700 dark:bg-slate-900">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-sky-600 dark:text-sky-300">Map Notes</div>
            <div className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">How to read the grid</div>
            <div className="mt-4 grid gap-3 text-sm text-slate-600 dark:text-slate-300">
              <div className="rounded-2xl border border-sky-100 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">Blue and orange markers usually need the closest attention.</div>
              <div className="rounded-2xl border border-sky-100 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">Only the most recent active shipments are geocoded for speed.</div>
              <div className="rounded-2xl border border-sky-100 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">Use pin details on the right for AWB-level context.</div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.38)] dark:border-slate-700 dark:bg-slate-900">
            <div
              style={{
                position: 'relative',
                height: 540,
                borderRadius: 22,
                overflow: 'hidden',
                background: dark
                  ? 'radial-gradient(circle at 15% 20%, #1e293b 0, #0f172a 30%, #020617 75%), linear-gradient(135deg, #020617 0%, #0f172a 100%)'
                  : 'radial-gradient(circle at 15% 20%, #dbeafe 0, #eff6ff 25%, #f8fafc 60%), linear-gradient(135deg, #fff 0%, #f8fafc 100%)',
                border: dark ? '1px solid #334155' : '1px solid #dbeafe',
              }}
            >
              <div style={{ position: 'absolute', inset: 0, backgroundImage: dark ? 'linear-gradient(to right, rgba(71,85,105,.24) 1px, transparent 1px), linear-gradient(to bottom, rgba(71,85,105,.24) 1px, transparent 1px)' : 'linear-gradient(to right, rgba(148,163,184,.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,.12) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
              <div style={{ position: 'absolute', left: 18, top: 18, color: dark ? '#e2e8f0' : '#0f172a', fontWeight: 900 }}>India Delivery Grid</div>
              {loading && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: dark ? '#94a3b8' : '#64748b' }}>Locating shipments…</div>}
              {!loading && geoRows.map((row) => {
                const pos = coordinateToPosition(row.geo.lat, row.geo.lon);
                return (
                  <div key={row.awb} style={{ position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}>
                    <div title={`${row.awb} · ${row.destination || row.geo?.label || ''}`} style={{ width: 16, height: 16, borderRadius: 999, background: STATUS_COLORS[row.status] || '#334155', boxShadow: `0 0 0 8px ${(STATUS_COLORS[row.status] || '#334155')}22` }} />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.38)] dark:border-slate-700 dark:bg-slate-900">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-orange-500 dark:text-orange-300">Pin Details</div>
            <h2 className="mt-1 text-lg font-black text-slate-900 dark:text-slate-100">Shipment list</h2>
            <div className="mt-4 space-y-3 max-h-[500px] overflow-y-auto">
              {payloadRows.length === 0 && !loading ? (
                <div className="text-sm text-slate-500 dark:text-slate-400">No active shipments found for the selected range.</div>
              ) : payloadRows.map((row) => (
                <div key={row.awb} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-mono text-xs font-black text-slate-900 dark:text-slate-100">{row.awb}</div>
                    <StatusBadge status={row.status} />
                  </div>
                  <div className="mt-2 text-sm font-black text-slate-900 dark:text-slate-100">{row.destination || row.geo?.label || 'Destination pending'}</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {row.courier || 'Courier pending'} · {row.latestEvent?.location || 'Location pending'}
                    {!row.geo && ' · Map pin pending'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

