import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PageLoader } from '../../components/ui/Loading';
import { EmptyState } from '../../components/ui/EmptyState';
import { useDebounce } from '../../hooks/useDebounce';

const TRACKING_LINKS = {
  Delhivery: (a) => `https://www.delhivery.com/track/package/${a}`,
  DTDC: (a) => `https://www.dtdc.in/tracking/tracking.asp?TrkType=awb&strCNNo=${a}`,
  Trackon: (a) => `https://www.trackoncourier.com/tracking?trackingId=${a}`,
  BlueDart: (a) => `https://www.bluedart.com/tracking?trackFor=0&track=awb&trackNo=${a}`,
  FedEx: (a) => `https://www.fedex.com/fedextrack/?trknbr=${a}`,
  DHL: (a) => `https://www.dhl.com/en/express/tracking.html?AWB=${a}`,
};

export default function ClientShipmentsPage({ toast }) {
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const dSearch = useDebounce(search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page, limit: 25, range: '90d', ...(dSearch && { search: dSearch }), ...(status && { status }) });
      const r = await api.get(`/portal/shipments?${p}`);
      setRows(r.data?.shipments || r.data || []);
      setTotal(r.data?.pagination?.total || 0);
    } catch (e) {
      toast?.(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [page, dSearch, status]);

  useEffect(() => { load(); }, [load]);

  if (loading && !rows.length) return <PageLoader />;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7faff_0%,#eef4fd_100%)]">
      <header className="border-b border-slate-200/70 bg-white/90 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/portal" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:text-slate-700">← Portal</Link>
            <div>
              <div className="text-sm font-black text-slate-900">My Shipments</div>
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-orange-500">Shipment Desk</div>
            </div>
          </div>
          <Link to="/portal/bulk-track" className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.08em] text-sky-700">
            Bulk Track
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl p-6 space-y-6">
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.12fr)_320px]">
          <div className="overflow-hidden rounded-[28px] border border-slate-200/60 bg-[linear-gradient(145deg,#fffaf5_0%,#ffffff_70%)] p-6 shadow-[0_22px_44px_-30px_rgba(194,65,12,0.35)]">
            <div className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-orange-600">
              Search & Filter
            </div>
            <h1 className="mt-4 max-w-2xl text-3xl font-black leading-tight text-slate-900">A cleaner shipment table with better filters, spacing, and track-out actions.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
              Search AWBs, destination, or consignee, then jump straight to external carrier tracking when needed.
            </p>
          </div>
          <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.38)]">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-orange-500">Snapshot</div>
            <div className="mt-2 text-4xl font-black text-slate-900">{total}</div>
            <p className="mt-2 text-sm text-slate-500">Shipments across the last 90 days in the current filter set.</p>
          </div>
        </section>

        <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.38)]">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_auto]">
            <input
              className="input"
              placeholder="Search AWB, consignee, destination..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            <select className="input" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All statuses</option>
              {['Booked', 'InTransit', 'OutForDelivery', 'Delivered', 'Delayed', 'RTO'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <Link to="/portal/map" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100">
              Open Map
            </Link>
          </div>
        </section>

        {rows.length === 0 && !loading ? (
          <div className="rounded-[26px] border border-slate-200 bg-white p-8 shadow-sm">
            <EmptyState icon="📦" title="No shipments found" message="Try adjusting your search or filters." />
          </div>
        ) : (
          <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_18px_42px_-32px_rgba(15,23,42,0.38)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="border-b bg-slate-50">
                  <tr>
                    {['Date', 'AWB', 'Consignee', 'Destination', 'Courier', 'Status', 'Track'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((s, index) => (
                    <tr key={s.id} className={index % 2 ? 'bg-slate-50/40' : 'bg-white'}>
                      <td className="px-4 py-3 text-slate-600">{s.date}</td>
                      <td className="px-4 py-3 font-mono text-xs font-black text-slate-800">{s.awb}</td>
                      <td className="px-4 py-3 text-slate-700">{s.consignee || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{s.destination || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{s.courier || '—'}</td>
                      <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                      <td className="px-4 py-3">
                        {TRACKING_LINKS[s.courier] ? (
                          <a href={TRACKING_LINKS[s.courier](s.awb)} target="_blank" rel="noreferrer" className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 transition hover:bg-sky-100">
                            Track →
                          </a>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {total > 25 && (
          <div className="flex items-center justify-between rounded-[22px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
            <span>Showing {((page - 1) * 25) + 1}–{Math.min(page * 25, total)} of {total}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">← Prev</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={page * 25 >= total} className="rounded-xl border border-slate-200 bg-white px-4 py-2 font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
