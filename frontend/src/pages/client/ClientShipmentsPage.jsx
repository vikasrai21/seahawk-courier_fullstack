// src/pages/client/ClientShipmentsPage.jsx — Client sees only their shipments
import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PageLoader } from '../../components/ui/Loading';
import { EmptyState } from '../../components/ui/EmptyState';
import { useDebounce } from '../../hooks/useDebounce';

const TRACKING_LINKS = {
  Delhivery: a => `https://www.delhivery.com/track/package/${a}`,
  DTDC:      a => `https://www.dtdc.in/tracking/tracking.asp?TrkType=awb&strCNNo=${a}`,
  Trackon:   a => `https://www.trackoncourier.com/tracking?trackingId=${a}`,
  BlueDart:  a => `https://www.bluedart.com/tracking?trackFor=0&track=awb&trackNo=${a}`,
  FedEx:     a => `https://www.fedex.com/fedextrack/?trknbr=${a}`,
  DHL:       a => `https://www.dhl.com/en/express/tracking.html?AWB=${a}`,
};

export default function ClientShipmentsPage({ toast }) {
  const [searchParams] = useSearchParams();
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState(searchParams.get('status') || '');
  const dSearch = useDebounce(search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page, limit: 25, range: '90d', ...(dSearch && { search: dSearch }), ...(status && { status }) });
      const r = await api.get(`/portal/shipments?${p}`);
      setRows(r.data?.shipments || r.data || []);
      setTotal(r.data?.pagination?.total || 0);
    } catch(e) { toast?.(e.message, 'error'); }
    finally { setLoading(false); }
  }, [page, dSearch, status]);

  useEffect(() => { load(); }, [load]);

  if (loading && !rows.length) return <PageLoader />;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/portal" className="text-gray-400 hover:text-gray-600">← Portal</Link>
          <span className="font-bold text-gray-900">My Shipments</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <div className="flex flex-wrap gap-3">
          <input
            className="input flex-1 min-w-48"
            placeholder="Search AWB, consignee, destination..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <select className="input w-44" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            {['Booked','InTransit','OutForDelivery','Delivered','Delayed','RTO'].map(s =>
              <option key={s} value={s}>{s}</option>
            )}
          </select>
          <Link to="/portal/bulk-track" className="btn-secondary">Bulk Track</Link>
        </div>

        {rows.length === 0 && !loading ? (
          <EmptyState icon="📦" title="No shipments found" message="Try adjusting your search or filters." />
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Date','AWB','Consignee','Destination','Courier','Status','Track'].map(h =>
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">{h}</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{s.date}</td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-800">{s.awb}</td>
                    <td className="px-4 py-3 text-gray-700">{s.consignee || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{s.destination || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{s.courier || '—'}</td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3">
                      {TRACKING_LINKS[s.courier] ? (
                        <a href={TRACKING_LINKS[s.courier](s.awb)} target="_blank" rel="noreferrer"
                           className="text-blue-600 hover:underline text-xs">Track →</a>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {total > 25 && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Showing {((page-1)*25)+1}–{Math.min(page*25, total)} of {total}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p-1)} disabled={page===1} className="btn-secondary btn-sm">← Prev</button>
              <button onClick={() => setPage(p => p+1)} disabled={page*25>=total} className="btn-secondary btn-sm">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
