import { useCallback, useEffect, useState } from 'react';
import {
  Search, ChevronLeft, ChevronRight, Zap, TrendingUp, MapPin, Package, ArrowUpRight,
  ArrowDownRight, IndianRupee, Filter, Truck, AlertTriangle, ChevronsLeft,
  ChevronsRight, Sparkles
} from 'lucide-react';
import api from '../../services/api';

const fmtCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const fmtNumber = (n) => Number(n || 0).toLocaleString('en-IN');

const PAGE_SIZES = [10, 25, 50, 100];

const ZONE_COLORS = {
  'Delhi & NCR': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
  'North India': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' },
  'Metro Cities': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-500' },
  'Rest of India': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
  'North East': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  'Diplomatic / Port Blair': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500' },
};

function ZoneBadge({ zone }) {
  const colors = ZONE_COLORS[zone] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${colors.bg} ${colors.text} ${colors.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {zone}
    </span>
  );
}

function ShipTypeBadge({ type }) {
  const map = {
    doc: { label: 'DOC', bg: 'bg-sky-50 text-sky-700 border-sky-200' },
    surface: { label: 'SFC', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
    air: { label: 'AIR', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
  };
  const t = map[type] || map.doc;
  return (
    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-wider border ${t.bg}`}>
      {t.label}
    </span>
  );
}

function DiffIndicator({ recorded, calculated }) {
  if (!calculated) return <span className="text-slate-300 text-xs">—</span>;
  const diff = calculated - recorded;
  const pct = recorded > 0 ? ((diff / recorded) * 100).toFixed(0) : calculated > 0 ? '+∞' : '0';
  if (Math.abs(diff) < 1) return <span className="text-slate-400 text-[10px]">≈ same</span>;

  return (
    <div className={`flex items-center gap-1 text-[10px] font-bold ${diff > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
      {diff > 0 ? <ArrowUpRight size={11} strokeWidth={2.5} /> : <ArrowDownRight size={11} strokeWidth={2.5} />}
      <span>{diff > 0 ? '+' : ''}{fmtCurrency(diff)}</span>
      <span className="text-[9px] opacity-60">({pct}%)</span>
    </div>
  );
}

// ── Summary Header ─────────────────────────────────────────────────────
function SummaryHeader({ summary, loading }) {
  if (!summary && !loading) return null;

  const items = [
    {
      label: 'Reference Value',
      value: fmtCurrency(summary?.calculatedRevenue),
      icon: Sparkles,
      tone: 'text-emerald-600 bg-emerald-50 ring-emerald-200/50',
      sub: `${fmtNumber(summary?.calculatedCount)} shipments matched to rate rules`,
    },
    {
      label: 'Recorded Billing',
      value: fmtCurrency(summary?.recordedRevenue),
      icon: IndianRupee,
      tone: 'text-blue-600 bg-blue-50 ring-blue-200/50',
      sub: `Authoritative for invoicing`,
    },
    {
      label: 'Reference Gap',
      value: fmtCurrency(summary?.revenueGap),
      icon: TrendingUp,
      tone: summary?.revenueGap >= 0 ? 'text-emerald-600 bg-emerald-50 ring-emerald-200/50' : 'text-rose-600 bg-rose-50 ring-rose-200/50',
      sub: summary?.revenueGap >= 0 ? 'Reference is above recorded' : 'Recorded is above reference',
    },
    {
      label: 'Avg / Shipment',
      value: fmtCurrency(summary?.avgPerShipment),
      icon: Package,
      tone: 'text-violet-600 bg-violet-50 ring-violet-200/50',
      sub: `${fmtNumber(summary?.totalShipments)} total shipments`,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
      {items.map((item) => (
        <div key={item.label} className="group rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
          <div className="flex items-center justify-between mb-3">
            <div className={`flex items-center justify-center w-9 h-9 rounded-xl ring-1 ${item.tone}`}>
              <item.icon size={18} strokeWidth={2.5} />
            </div>
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
          <p className={`text-xl font-black tracking-tight mt-0.5 ${loading ? 'animate-pulse text-slate-300' : 'text-slate-900'}`}>
            {loading ? '...' : item.value}
          </p>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">{loading ? '' : item.sub}</p>
        </div>
      ))}
    </div>
  );
}

// ── Zone Distribution Mini-Bar ─────────────────────────────────────────
function ZoneDistribution({ zones }) {
  if (!zones?.length) return null;
  const maxRevenue = Math.max(...zones.map(z => z.revenue), 1);

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {zones.slice(0, 6).map((z) => {
        const colors = ZONE_COLORS[z.zone] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };
        const widthPct = Math.max(8, (z.revenue / maxRevenue) * 100);
        return (
          <div key={z.zone} className={`flex-1 min-w-[120px] rounded-xl border p-2.5 ${colors.bg} ${colors.border} transition-all hover:scale-[1.02]`}>
            <div className="flex items-center justify-between">
              <span className={`text-[9px] font-black uppercase tracking-wider ${colors.text}`}>{z.zone}</span>
              <span className={`text-[10px] font-bold ${colors.text}`}>{z.count}</span>
            </div>
            <p className={`text-sm font-black ${colors.text} mt-1`}>{fmtCurrency(z.revenue)}</p>
            <div className="mt-1.5 h-1 bg-white/60 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${colors.text.replace('text-', 'bg-')}`} style={{ width: `${widthPct}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function SmartRevenueTable({ dateFrom, dateTo }) {
  const [summary, setSummary] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Fetch summary
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (dateFrom) params.append('dateFrom', dateFrom);
        if (dateTo) params.append('dateTo', dateTo);
        const res = await api.get(`/analytics/smart-revenue?${params}`);
        setSummary(res?.data || res);
      } catch (err) {
        console.error('Smart revenue summary error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [dateFrom, dateTo]);

  // Fetch details (paginated)
  const fetchDetails = useCallback(async () => {
    try {
      setDetailLoading(true);
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      params.append('page', page);
      params.append('limit', limit);
      if (search) params.append('q', search);
      const res = await api.get(`/analytics/smart-revenue/details?${params}`);
      setDetails(res?.data || res);
    } catch (err) {
      console.error('Smart revenue details error:', err);
    } finally {
      setDetailLoading(false);
    }
  }, [dateFrom, dateTo, page, limit, search]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Reset page on search/limit change
  useEffect(() => {
    setPage(1);
  }, [search, limit]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const pagination = details?.pagination || {};
  const rows = details?.details || [];

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white shadow-[0_8px_32px_rgba(15,23,42,0.04)] overflow-hidden">
      {/* ── Title Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-200/50">
            <Zap size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 tracking-tight">Reference Rate Audit</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              Recorded shipment amount is authoritative; calculated value is only a rate-card reference
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
            <Sparkles size={12} className="text-emerald-600" />
            <span className="text-[10px] font-bold text-emerald-700">REFERENCE ONLY</span>
          </div>
        </div>
      </div>

      {/* ── Summary Cards ── */}
      <div className="px-6 pt-5">
        <SummaryHeader summary={summary} loading={loading} />
        <ZoneDistribution zones={summary?.byZone} />
      </div>

      {/* ── Search + Page Size Controls ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-t border-slate-100 bg-slate-50/50">
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search AWB, destination, courier..."
              className="pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none w-64 transition-all"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-sm pressable"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchInput(''); }}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-slate-200 text-slate-600 hover:bg-slate-300 transition-all"
            >
              Clear
            </button>
          )}
        </form>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={12} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Show</span>
          </div>
          <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-white">
            {PAGE_SIZES.map((size) => (
              <button
                key={size}
                onClick={() => setLimit(size)}
                className={`px-3 py-1.5 text-[11px] font-bold transition-all ${
                  limit === size
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/80 border-y border-slate-100">
              <th className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">AWB</th>
              <th className="px-3 py-3 text-left text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Destination</th>
              <th className="px-3 py-3 text-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Weight</th>
              <th className="px-3 py-3 text-left text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Courier</th>
              <th className="px-3 py-3 text-left text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Zone</th>
              <th className="px-3 py-3 text-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Type</th>
              <th className="px-3 py-3 text-right text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Recorded ₹</th>
              <th className="px-3 py-3 text-right text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Calculated ₹</th>
              <th className="px-3 py-3 text-right text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Diff</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {detailLoading ? (
              Array.from({ length: limit }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {Array.from({ length: 9 }).map((_, j) => (
                    <td key={j} className="px-3 py-3"><div className="h-4 bg-slate-100 rounded-md" /></td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <AlertTriangle size={32} className="text-slate-300" />
                    <p className="text-sm font-semibold text-slate-400">No shipments found</p>
                    <p className="text-xs text-slate-400">Try adjusting your search or date range</p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  className="group hover:bg-violet-50/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold text-slate-800 font-mono tracking-wide">{row.awb || '—'}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin size={11} className="text-slate-400 shrink-0" />
                      <span className="text-xs text-slate-700 truncate max-w-[140px]" title={row.destination}>
                        {row.destination || row.resolvedLocation || '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="text-xs font-bold text-slate-700 tabular-nums">{row.weight} kg</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <Truck size={11} className="text-slate-400 shrink-0" />
                      <span className="text-xs text-slate-600 truncate max-w-[100px]">{row.courier || '—'}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3"><ZoneBadge zone={row.zone} /></td>
                  <td className="px-3 py-3 text-center"><ShipTypeBadge type={row.shipType} /></td>
                  <td className="px-3 py-3 text-right">
                    <span className={`text-xs tabular-nums font-semibold ${row.recordedAmount > 0 ? 'text-slate-700' : 'text-slate-300'}`}>
                      {row.recordedAmount > 0 ? fmtCurrency(row.recordedAmount) : '₹0'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className={`text-xs tabular-nums font-black ${row.calculatedAmount > 0 ? 'text-emerald-700' : 'text-slate-300'}`}>
                      {row.calculatedAmount > 0 ? fmtCurrency(row.calculatedAmount) : '₹0'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <DiffIndicator recorded={row.recordedAmount} calculated={row.calculatedAmount} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {/* ── Footer Totals ── */}
          {!detailLoading && rows.length > 0 && (
            <tfoot>
              <tr className="bg-slate-50/80 border-t border-slate-200">
                <td colSpan={6} className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Page Total
                </td>
                <td className="px-3 py-3 text-right text-xs font-bold text-slate-700 tabular-nums">
                  {fmtCurrency(details?.pageTotals?.recordedTotal)}
                </td>
                <td className="px-3 py-3 text-right text-xs font-black text-emerald-700 tabular-nums">
                  {fmtCurrency(details?.pageTotals?.calculatedTotal)}
                </td>
                <td className="px-3 py-3 text-right">
                  <DiffIndicator
                    recorded={details?.pageTotals?.recordedTotal || 0}
                    calculated={details?.pageTotals?.calculatedTotal || 0}
                  />
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* ── Pagination ── */}
      {pagination.totalPages > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/30">
          <div className="text-[11px] text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{((page - 1) * limit) + 1}</strong>–
            <strong className="text-slate-800">{Math.min(page * limit, pagination.total)}</strong>{' '}
            of <strong className="text-slate-800">{fmtNumber(pagination.total)}</strong> shipments
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(1)}
              disabled={page <= 1}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronsLeft size={14} />
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={14} />
            </button>

            {/* Page numbers */}
            {(() => {
              const pages = [];
              const total = pagination.totalPages;
              const start = Math.max(1, page - 2);
              const end = Math.min(total, page + 2);
              for (let i = start; i <= end; i++) {
                pages.push(
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                      i === page
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {i}
                  </button>
                );
              }
              return pages;
            })()}

            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={14} />
            </button>
            <button
              onClick={() => setPage(pagination.totalPages)}
              disabled={page >= pagination.totalPages}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronsRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
