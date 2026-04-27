import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { FetchErrorState } from '../../components/ui/FetchErrorState';
import TimelineModal from '../../components/shipments/TimelineModal';
import {
  Package, Truck, CheckCircle2, AlertTriangle, RefreshCw,
  ArrowUpRight, MapPin, Upload, Search, Headphones, RotateCcw,
  TrendingUp, TrendingDown, Minus, ShoppingBag, Eye
} from 'lucide-react';

const formatRelativeTime = (value) => {
  if (!value) return 'just now';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return 'just now';
  const diffMs = Math.max(0, Date.now() - date.getTime());
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const RANGE_OPTIONS = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
  { key: 'this_month', label: 'Month' },
];

/* ── Micro Sparkline ─────────────────────────────────────────────── */
function MiniSparkline({ values = [], color = '#22d3ee', height = 28 }) {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const w = 64;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${height - (v / max) * height}`).join(' ');
  return (
    <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`} className="opacity-60">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Trend Indicator ─────────────────────────────────────────────── */
function TrendBadge({ value }) {
  if (!value || value === 0) return <Minus size={10} className="text-slate-400" />;
  return value > 0
    ? <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-emerald-500"><TrendingUp size={10}/>{value}%</span>
    : <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-rose-500"><TrendingDown size={10}/>{Math.abs(value)}%</span>;
}

export default function ClientPortalPage({ toast }) {
  const { socket } = useSocket();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [intel, setIntel] = useState(null);
  const [range, setRange] = useState('30d');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [fetchErrors, setFetchErrors] = useState({
    portal: null,
    intelligence: null,
  });

  const fetchPortalData = async () => {
    setLoading(true);
    setFetchErrors((prev) => ({ ...prev, portal: null }));
    try {
      const query = new URLSearchParams();
      query.set('range', range);
      if (range === 'custom' && dateFrom && dateTo) {
        query.set('date_from', dateFrom);
        query.set('date_to', dateTo);
      }
      const statQuery = query.toString();
      const shipmentQuery = new URLSearchParams(query);
      shipmentQuery.set('limit', '6');
      const [statsResponse, shipmentsResponse] = await Promise.all([
        api.get(`/portal/stats?${statQuery}`),
        api.get(`/portal/shipments?${shipmentQuery.toString()}`),
      ]);
      setStats(statsResponse.data || {});
      setShipments(shipmentsResponse.data?.shipments || []);
    } catch (error) {
      setFetchErrors((prev) => ({ ...prev, portal: error }));
    } finally {
      setLoading(false);
    }
  };

  const fetchIntelligence = async () => {
    setFetchErrors((prev) => ({ ...prev, intelligence: null }));
    try {
      const query = new URLSearchParams();
      query.set('range', range);
      query.set('limit', '5');
      if (range === 'custom' && dateFrom && dateTo) {
        query.set('date_from', dateFrom);
        query.set('date_to', dateTo);
      }
      const response = await api.get(`/portal/intelligence?${query.toString()}`);
      setIntel(response.data || null);
    } catch (error) {
      setFetchErrors((prev) => ({ ...prev, intelligence: error }));
    }
  };

  const syncLiveStatuses = async () => {
    setSyncing(true);
    try {
      const payload = { range, limit: 30 };
      if (range === 'custom' && dateFrom && dateTo) {
        payload.date_from = dateFrom;
        payload.date_to = dateTo;
      }
      const response = await api.post('/portal/sync-tracking', payload);
      toast?.(response.message || 'Live status sync complete', 'success');
      setLastSyncAt(new Date());
      await fetchPortalData();
      await fetchIntelligence();
    } catch (error) {
      toast?.(error.message || 'Live status sync failed', 'error');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => { fetchPortalData(); fetchIntelligence(); }, [range, dateFrom, dateTo]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => { fetchPortalData(); fetchIntelligence(); };
    socket.on('shipment:created', refresh);
    socket.on('shipment:status-updated', refresh);
    return () => { socket.off('shipment:created', refresh); socket.off('shipment:status-updated', refresh); };
  }, [socket, range, dateFrom, dateTo]);

  const trendData = useMemo(() => (stats?.trend || []).map((row) => ({ ...row, day: String(row.date).slice(5) })), [stats]);

  const movementInsights = useMemo(() => {
    if (!trendData.length) return { wowPct: 0 };
    const values = trendData.map((row) => Number(row.shipments || 0));
    const thisWeek = values.slice(-7).reduce((sum, v) => sum + v, 0);
    const lastWeek = values.slice(-14, -7).reduce((sum, v) => sum + v, 0);
    const wowPct = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : (thisWeek > 0 ? 100 : 0);
    return { wowPct };
  }, [trendData]);

  const totals = stats?.totals || {};
  const attentionCount = Number(totals.ndr || 0) + Number(totals.rto || 0);
  const sparklineValues = trendData.slice(-12).map((row) => Number(row.shipments || 0));

  const STATUS_COLORS = {
    Delivered: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    InTransit: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    Booked: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
    Pending: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    RTO: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
    NDR: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  };

  const quickActions = [
    { to: '/portal/shipments', label: 'Shipments', icon: Package, color: 'text-cyan-500' },
    { to: '/portal/track', label: 'Track', icon: Search, color: 'text-blue-500' },
    { to: '/portal/map', label: 'Live Map', icon: MapPin, color: 'text-emerald-500' },
    { to: '/portal/pickups', label: 'Pickup', icon: Truck, color: 'text-amber-500' },
    { to: '/portal/ndr', label: 'NDR', icon: AlertTriangle, color: 'text-rose-500' },
    { to: '/portal/import', label: 'Import', icon: Upload, color: 'text-indigo-500' },
    { to: '/portal/returns', label: 'Returns', icon: RotateCcw, color: 'text-purple-500' },
    { to: '/portal/support', label: 'Support', icon: Headphones, color: 'text-slate-500' },
  ];

  return (
    <div className="bento-portal space-y-3">

      {/* ── Row 0: Compact Header Bar ── */}
      <div className="client-premium-card flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-black text-slate-900 dark:text-white">Command Center</h1>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Synced {formatRelativeTime(lastSyncAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100/80 dark:bg-slate-800/60 rounded-full p-0.5">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setRange(option.key)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                  range === option.key
                    ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={syncLiveStatuses}
            disabled={syncing}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-orange-600 hover:border-orange-300 transition-all"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {(fetchErrors.portal || fetchErrors.intelligence) && (
        <section className="grid gap-2">
          {fetchErrors.portal && <FetchErrorState compact title="Portal summary failed" error={fetchErrors.portal} onRetry={fetchPortalData} />}
          {fetchErrors.intelligence && <FetchErrorState compact title="Intelligence panel failed" error={fetchErrors.intelligence} onRetry={fetchIntelligence} />}
        </section>
      )}

      {/* ── Row 1: KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {[
          { label: 'Total Shipments', value: Number(totals.total || 0), icon: Package, color: 'text-cyan-500', bg: 'bg-cyan-500/10', trend: movementInsights.wowPct, spark: sparklineValues, sparkColor: '#22d3ee' },
          { label: 'In Transit', value: Number(totals.inTransit || 0), icon: Truck, color: 'text-blue-500', bg: 'bg-blue-500/10', trend: null, spark: null, sparkColor: '#3b82f6' },
          { label: 'Delivered', value: `${Number(totals.deliveredPct || 0)}%`, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', trend: Number(totals.deliveredPct || 0) - 85, spark: null, sparkColor: '#10b981' },
          { label: 'Needs Attention', value: attentionCount, icon: AlertTriangle, color: attentionCount > 0 ? 'text-rose-500' : 'text-slate-400', bg: attentionCount > 0 ? 'bg-rose-500/10' : 'bg-slate-500/10', trend: null, spark: null, sparkColor: '#f43f5e' },
        ].map(({ label, value, icon: Icon, color, bg, trend, spark, sparkColor }) => (
          <div key={label} className="client-premium-card px-4 py-3 flex items-start justify-between group hover:shadow-md transition-shadow">
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{label}</p>
              <p className={`text-2xl font-black tabular-nums ${color}`}>{loading ? '—' : value}</p>
              {trend !== null && <TrendBadge value={trend} />}
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center`}>
                <Icon size={16} className={color} />
              </div>
              {spark && <MiniSparkline values={spark} color={sparkColor} />}
            </div>
          </div>
        ))}
      </div>

      {/* ── Row 2: Bento Grid (Shipments + Quick Actions) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">

        {/* Recent Shipments — spans 2 cols */}
        <div className="client-premium-card lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/60">
            <h2 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Recent Shipments</h2>
            <Link to="/portal/shipments" className="text-[10px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-0.5">
              View All <ArrowUpRight size={10} />
            </Link>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw size={18} className="animate-spin text-slate-300" />
            </div>
          ) : shipments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ShoppingBag size={28} className="text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-400">No shipments yet</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Import orders or raise a pickup to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-800/40">
              {shipments.slice(0, 6).map((s) => {
                const statusKey = (s.status || '').replace(/\s+/g, '');
                const statusClass = STATUS_COLORS[statusKey] || 'bg-slate-100 text-slate-600';
                return (
                  <div
                    key={s.id || s.awb}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors"
                    onClick={() => setSelectedShipment(s)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-white font-mono">{s.awb}</span>
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md ${statusClass}`}>{s.status}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {s.consignee || '—'} · {s.destination || '—'} · {s.courier || '—'}
                      </p>
                    </div>
                    <Eye size={13} className="text-slate-300 shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions — 1 col */}
        <div className="client-premium-card">
          <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/60">
            <h2 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-1 p-2">
            {quickActions.map(({ to, label, icon: Icon, color }) => (
              <Link
                key={to}
                to={to}
                className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon size={15} className={color} />
                </div>
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Row 3: Insights Strip ── */}
      {intel?.items?.length > 0 && (
        <div className="client-premium-card px-4 py-2.5">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Intelligence</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(intel.items || []).slice(0, 3).map((item, i) => (
              <div key={i} className="flex-1 min-w-[200px] rounded-lg bg-slate-50 dark:bg-slate-800/40 px-3 py-2 text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                {item.summary || item.title || item.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedShipment && <TimelineModal shipment={selectedShipment} onClose={() => setSelectedShipment(null)} />}

      <style>{`
        .bento-portal .client-premium-card {
          box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.03);
        }
        @media (prefers-color-scheme: dark) {
          .bento-portal .client-premium-card {
            box-shadow: 0 1px 3px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04);
          }
        }
      `}</style>
    </div>
  );
}
