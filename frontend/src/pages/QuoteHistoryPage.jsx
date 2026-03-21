import { EmptyState } from '../components/ui/EmptyState';
import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { EmptyState } from '../components/ui/EmptyState';
import { FileText, Search, Filter, TrendingUp, CheckCircle, X, Clock, Loader, ChevronDown, Printer } from 'lucide-react';
import api from '../services/api';

const fmt  = n => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const fmtP = n => `${Number(n || 0).toFixed(1)}%`;
const pColor = m => m > 30 ? 'text-green-700' : m > 15 ? 'text-amber-600' : m > 0 ? 'text-orange-500' : 'text-red-600';

const STATUS_CONFIG = {
  QUOTED:  { label:'Quoted',  color:'bg-blue-100 text-blue-700'   },
  BOOKED:  { label:'Booked',  color:'bg-green-100 text-green-700' },
  LOST:    { label:'Lost',    color:'bg-red-100 text-red-600'     },
  EXPIRED: { label:'Expired', color:'bg-gray-100 text-gray-500'   },
};

export default function QuoteHistoryPage({ toast }) {
  const [quotes, setQuotes]   = useState([]);
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const [updating, setUpdating] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      const [qRes, sRes] = await Promise.all([
        api.get('/quotes', { params }),
        api.get('/quotes/stats'),
      ]);
      setQuotes(qRes.data?.data || []);
      setTotal(qRes.data?.pagination?.total || 0);
      setStats(sRes.data?.data);
    } catch {
      toast?.('Failed to load quotes', 'error');
    } finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      await api.patch(`/quotes/${id}/status`, { status });
      toast?.(`Quote marked as ${status.toLowerCase()}`, 'success');
      load();
    } catch { toast?.('Update failed', 'error'); }
    finally { setUpdating(null); }
  };

  const printQuote = q => {
    const win = window.open('', '_blank');
    win.document.write(`
<html><head><title>Quote ${q.quoteNo}</title>
<style>body{font-family:Arial,sans-serif;padding:40px;max-width:600px;margin:auto;color:#1e293b}
h1{font-size:20px;font-weight:900}table{width:100%;border-collapse:collapse;margin:20px 0}
td,th{padding:8px 12px;border:1px solid #e2e8f0;text-align:left}th{background:#f8fafc;font-weight:600}
.total{font-size:1.5em;font-weight:900;color:#166534}.meta{color:#64748b;font-size:12px;margin-bottom:4px}
.footer{margin-top:30px;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:12px}</style>
</head><body>
<h1>Seahawk Logistics</h1>
<div class="meta">Quote No: <strong>${q.quoteNo}</strong></div>
<div class="meta">Date: ${new Date(q.createdAt).toLocaleDateString('en-IN')}</div>
<div class="meta">Valid Until: ${q.validUntil}</div>
${q.client ? `<div class="meta" style="margin-top:8px;font-size:14px;font-weight:600">${q.client.company}</div>` : ''}
<table><tr><th>Field</th><th>Value</th></tr>
<tr><td>Destination</td><td>${q.destination}</td></tr>
<tr><td>Courier Service</td><td>${q.courier} (${q.courierMode})</td></tr>
<tr><td>Chargeable Weight</td><td>${q.weight} kg</td></tr>
<tr><td>Shipment Type</td><td>${q.shipType}</td></tr>
<tr><td>Courier Cost</td><td>${fmt(q.costTotal)}</td></tr>
<tr><td><strong>Selling Price</strong></td><td class="total">${fmt(q.sellTotal)}</td></tr>
<tr><td>Your Margin</td><td style="color:${q.profit>0?'#166534':'#dc2626'};font-weight:700">${fmtP(q.margin)} (${fmt(q.profit)})</td></tr>
</table>
${q.notes ? `<p><strong>Notes:</strong> ${q.notes}</p>` : ''}
<div class="footer">Seahawk Courier & Cargo · Rates include all applicable surcharges · Valid for ${q.validUntil}</div>
</body></html>`);
    win.document.close(); win.print();
  };

  const displayed = quotes.filter(q =>
    !debouncedSearch || q.destination?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    q.quoteNo?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    q.courier?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    q.client?.company?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Quote History</h1>
      <p className="text-xs text-gray-400 mb-5">Track all quotes — conversion rates, top couriers, pipeline</p>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          {[
            ['Total Quotes', stats.total, 'text-gray-800'],
            ['Last 30 Days', stats.last30, 'text-blue-700'],
            ['Converted',    stats.byStatus?.BOOKED || 0, 'text-green-700'],
            ['Avg Margin',   fmtP(stats.avgMargin), stats.avgMargin > 20 ? 'text-green-700' : 'text-amber-600'],
            ['Avg Profit',   fmt(stats.avgProfit),  'text-gray-800'],
          ].map(([label, val, cls]) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 text-center">
              <p className={`text-xl font-bold ${cls}`}>{val}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
            placeholder="Search destination, courier, client…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="relative">
          <select className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 focus:outline-none appearance-none pr-7"
            value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                {['Quote No','Date','Client','Destination','Courier','Weight','Cost','Sell','Profit','Margin','Status','Actions'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={12} className="px-4 py-12 text-center">
                  <Loader className="w-6 h-6 animate-spin mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-400">Loading quotes…</p>
                </td></tr>
              ) : displayed.length === 0 ? (
                <tr><td colSpan={12} className="px-4 py-4">
                  <EmptyState icon="📋" title="No quotes found" message="Try adjusting your search or date range." action={debouncedSearch ? 'Clear search' : undefined} onAction={debouncedSearch ? () => setSearch('') : undefined} />
                </td></tr>
              ) : displayed.map(q => {
                const sc = STATUS_CONFIG[q.status] || STATUS_CONFIG.QUOTED;
                const isUpdating = updating === q.id;
                return (
                  <tr key={q.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-mono font-bold text-slate-700">{q.quoteNo}</td>
                    <td className="px-3 py-2.5 text-gray-500">{new Date(q.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-3 py-2.5 text-gray-700 max-w-[100px] truncate">{q.client?.company || '—'}</td>
                    <td className="px-3 py-2.5 text-gray-600 max-w-[110px] truncate">{q.destination}</td>
                    <td className="px-3 py-2.5 text-gray-700 whitespace-nowrap">{q.courier}</td>
                    <td className="px-3 py-2.5 font-bold text-gray-700">{q.weight}kg</td>
                    <td className="px-3 py-2.5 text-gray-600">{fmt(q.costTotal)}</td>
                    <td className="px-3 py-2.5 font-bold text-gray-800">{fmt(q.sellTotal)}</td>
                    <td className={`px-3 py-2.5 font-bold ${q.profit > 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(q.profit)}</td>
                    <td className={`px-3 py-2.5 font-bold ${pColor(q.margin)}`}>{fmtP(q.margin)}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${sc.color}`}>{sc.label}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => printQuote(q)} className="p-1 text-gray-400 hover:text-slate-700" title="Print Quote">
                          <Printer className="w-3 h-3" />
                        </button>
                        {q.status === 'QUOTED' && (
                          <>
                            <button onClick={() => updateStatus(q.id, 'BOOKED')} disabled={isUpdating}
                              className="text-[9px] bg-green-100 hover:bg-green-200 text-green-700 px-1.5 py-0.5 rounded font-bold disabled:opacity-50">
                              {isUpdating ? '…' : 'Booked'}
                            </button>
                            <button onClick={() => updateStatus(q.id, 'LOST')} disabled={isUpdating}
                              className="text-[9px] bg-red-100 hover:bg-red-200 text-red-700 px-1.5 py-0.5 rounded font-bold disabled:opacity-50">
                              Lost
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-400">{total} quotes total</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:border-gray-400">Prev</button>
              <span className="px-3 py-1.5 text-xs text-gray-600">Page {page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 disabled:opacity-40 hover:border-gray-400">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
