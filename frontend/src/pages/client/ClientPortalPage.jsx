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
import ClientOnboardingWizard from './components/ClientOnboardingWizard';

const RANGE_OPTIONS = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7d' },
  { key: '30d', label: '30d' },
  { key: 'this_month', label: 'Month' },
];

/* -- Micro Sparkline ------------------------------------------------------ */
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

/* -- Trend Indicator ------------------------------------------------------ */
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
  const [pickups, setPickups] = useState([]);
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    if (!loading && stats) {
      const totalShipments = Number(stats.totals?.total || 0);
      const completed = localStorage.getItem('shk_onboarding_completed');
      const skipped = localStorage.getItem('shk_onboarding_skipped');
      if (totalShipments === 0 && !completed && !skipped) {
        setShowWizard(true);
      }
    }
  }, [loading, stats]);
  const [intel, setIntel] = useState(null);
  const [range, setRange] = useState('30d');
  const [dateFrom] = useState('');
  const [dateTo] = useState('');
  const [, setLastSyncAt] = useState(null);
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
      const [statsResponse, shipmentsResponse, pickupsResponse] = await Promise.all([
        api.get(`/portal/stats?${statQuery}`),
        api.get(`/portal/shipments?${shipmentQuery.toString()}`),
        api.get('/portal/pickups?limit=5&status=PENDING'),
      ]);
      setStats(statsResponse.data || {});
      setShipments(shipmentsResponse.data?.shipments || []);
      const pData = pickupsResponse.data?.data || pickupsResponse.data || [];
      setPickups(Array.isArray(pData) ? pData : []);
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
    <div className="bento-portal mx-auto w-full max-w-[1600px] overflow-x-hidden px-4 py-4 md:px-5 lg:px-6 lg:py-5 space-y-3">
      {showWizard && <ClientOnboardingWizard onClose={() => setShowWizard(false)} />}

      {/* -- Page Header -- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Command Center</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-slate-500 dark:text-slate-400">Overview of your logistics performance.</p>
            <div className={`w-1.5 h-1.5 rounded-full ${syncing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'} ml-2`} />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{syncing ? 'Syncing...' : 'Live Sync Active'}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100/80 dark:bg-slate-800/60 rounded-xl p-1">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setRange(option.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  range === option.key
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
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
            className="client-action-btn-secondary flex items-center gap-2"
          >
            <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing...' : 'Live Sync'}
          </button>
        </div>
      </div>

      {(fetchErrors.portal || fetchErrors.intelligence) && (
        <section className="grid gap-2">
          {fetchErrors.portal && <FetchErrorState compact title="Portal summary failed" error={fetchErrors.portal} onRetry={fetchPortalData} />}
          {fetchErrors.intelligence && <FetchErrorState compact title="Intelligence panel failed" error={fetchErrors.intelligence} onRetry={fetchIntelligence} />}
        </section>
      )}

      {/* -- Row 1: KPI Cards -- */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
        {[
          { label: 'Total', link: '/portal/shipments', value: Number(totals.total || 0), sub: `${Number(totals.deliveredPct || 0)}% delivered`, icon: Package, gradient: 'from-cyan-500/15 to-sky-500/5', iconBg: 'bg-gradient-to-br from-cyan-500 to-sky-600', color: 'text-cyan-600 dark:text-cyan-400', trend: movementInsights.wowPct, spark: sparklineValues, sparkColor: '#22d3ee' },
          { label: 'Booked', link: '/portal/shipments?status=Booked', value: Number(totals.booked || 0), sub: 'Awaiting pickup', icon: Package, gradient: 'from-violet-500/15 to-purple-500/5', iconBg: 'bg-gradient-to-br from-violet-500 to-purple-600', color: 'text-violet-600 dark:text-violet-400', trend: null, spark: null },
          { label: 'In Transit', link: '/portal/shipments?status=InTransit', value: Number(totals.inTransit || 0) + Number(totals.outForDelivery || 0), sub: `${Number(totals.outForDelivery || 0)} out for delivery`, icon: Truck, gradient: 'from-blue-500/15 to-indigo-500/5', iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600', color: 'text-blue-600 dark:text-blue-400', trend: null, spark: null },
          { label: 'Delivered', link: '/portal/shipments?status=Delivered', value: Number(totals.delivered || 0), sub: `${Number(totals.deliveredPct || 0)}% success rate`, icon: CheckCircle2, gradient: 'from-emerald-500/15 to-green-500/5', iconBg: 'bg-gradient-to-br from-emerald-500 to-green-600', color: 'text-emerald-600 dark:text-emerald-400', trend: null, spark: null },
          { label: 'Exceptions', link: '/portal/ndr', value: attentionCount, sub: `${Number(totals.ndr || 0)} NDR · ${Number(totals.rto || 0)} RTO`, icon: AlertTriangle, gradient: attentionCount > 0 ? 'from-rose-500/15 to-orange-500/5' : 'from-slate-500/10 to-slate-500/5', iconBg: attentionCount > 0 ? 'bg-gradient-to-br from-rose-500 to-orange-600' : 'bg-gradient-to-br from-slate-400 to-slate-500', color: attentionCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400', trend: null, spark: null },
        ].map(({ label, link, value, sub, icon: Icon, gradient, iconBg, color, trend, spark, sparkColor }) => (
          <Link key={label} to={link} className={`client-premium-card px-4 py-3.5 flex flex-col justify-between group hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer bg-gradient-to-br ${gradient} relative overflow-hidden min-h-[104px]`}>
            <div className="flex items-start justify-between">
              <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{label}</p>
              <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center shadow-sm`}>
                <Icon size={14} className="text-white" />
              </div>
            </div>
            <div className="mt-2">
              <p className={`text-2xl font-black tabular-nums ${color}`}>{loading ? '—' : value}</p>
              {sub && <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
              {trend !== null && <TrendBadge value={trend} />}
              {spark && <div className="mt-1"><MiniSparkline values={spark} color={sparkColor} /></div>}
            </div>
          </Link>
        ))}
      </div>

      {/* -- Status Distribution Bar -- */}
      {!loading && Number(totals.total || 0) > 0 && (() => {
        const t = Number(totals.total || 1);
        const segments = [
          { label: 'Delivered', count: Number(totals.delivered || 0), color: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-300', icon: CheckCircle2 },
          { label: 'In Transit', count: Number(totals.inTransit || 0) + Number(totals.outForDelivery || 0), color: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-300', icon: Truck },
          { label: 'Booked', count: Number(totals.booked || 0), color: 'bg-violet-500', text: 'text-violet-600 dark:text-violet-300', icon: Package },
          { label: 'NDR', count: Number(totals.ndr || 0), color: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-300', icon: AlertTriangle },
          { label: 'RTO', count: Number(totals.rto || 0), color: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-300', icon: RotateCcw },
        ].filter(s => s.count > 0);
        return (
          <div className="client-premium-card px-4 py-3 hover:shadow-lg transition-shadow">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-300">Status Segments</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Live distribution across current shipment movement.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-600 dark:bg-slate-800 dark:text-slate-200">{t} total</span>
            </div>
            <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
              {segments.map(s => (
                <div key={s.label} className={`${s.color} transition-all duration-700`} style={{ width: `${(s.count / t) * 100}%` }} title={`${s.label}: ${s.count}`} />
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-5">
              {segments.map(s => (
                <div key={s.label} className="group rounded-xl border border-slate-100 bg-white/70 px-3 py-2 transition-all hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700">
                  <div className="flex items-center justify-between">
                    <s.icon size={14} className={s.text} />
                    <span className="text-[10px] font-black text-slate-400">{Math.round((s.count / t) * 100)}%</span>
                  </div>
                  <div className={`mt-1 text-lg font-black tabular-nums ${s.text}`}>{s.count}</div>
                  <div className="text-[10px] font-bold text-slate-500 dark:text-slate-300">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* -- Row 2: Bento Grid (Shipments + Quick Actions) -- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">

        {/* Latest Activity -- spans 2 cols */}
        <div className="client-premium-card lg:col-span-2 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/60">
            <h2 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Latest Activity</h2>
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
              {[...shipments].sort((a, b) => new Date(b.updatedAt || b.date) - new Date(a.updatedAt || a.date)).slice(0, 6).map((s) => {
                const statusKey = (s.status || '').replace(/\s+/g, '');
                const statusClass = STATUS_COLORS[statusKey] || 'bg-slate-100 text-slate-600';
                const STATUS_DOT = {
                  Delivered: 'bg-emerald-500', InTransit: 'bg-blue-500', Booked: 'bg-violet-500',
                  OutForDelivery: 'bg-sky-500', NDR: 'bg-amber-500', RTO: 'bg-rose-500', Delayed: 'bg-yellow-500',
                };
                const dotColor = STATUS_DOT[statusKey] || 'bg-slate-400';
                return (
                  <div
                    key={s.id || s.awb}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 cursor-pointer transition-colors group"
                    onClick={() => setSelectedShipment(s)}
                  >
                    <div className={`w-1.5 h-9 rounded-full ${dotColor} shrink-0 opacity-60 group-hover:opacity-100 transition-opacity`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-white font-mono">{s.awb}</span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${statusClass}`}>{s.status}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {s.consignee || '—'} · {s.destination || '—'} · {s.courier || '—'}
                      </p>
                    </div>
                    <Eye size={13} className="text-slate-300 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Quick Actions + Pickups */}
        <div className="flex flex-col gap-2.5">
          {/* Quick Actions */}
          <div className="client-premium-card">
            <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/60">
              <h2 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-4 gap-2 p-3">
              {quickActions.map(({ to, label, icon: Icon, color }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex flex-col items-center gap-2 rounded-2xl px-1.5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center group-hover:scale-105 group-hover:bg-white dark:group-hover:bg-slate-800 transition-all shadow-sm">
                    <Icon size={16} className={color} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 text-center leading-tight">{label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Upcoming Pickups */}
          <div className="client-premium-card flex-1 flex flex-col">
            <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/60 flex justify-between items-center">
              <h2 className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Upcoming Pickups</h2>
              <Link to="/portal/pickups" className="text-[10px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-0.5">
                Manage
              </Link>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center py-6 text-center px-4">
              {loading ? (
                <RefreshCw size={24} className="animate-spin text-slate-300 mb-2" />
              ) : pickups.length === 0 ? (
                <>
                  <Truck size={24} className="text-slate-300 mb-2" />
                  <p className="text-xs font-bold text-slate-400">No pickups scheduled</p>
                  <Link to="/portal/pickups" className="mt-3 px-4 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    Schedule Pickup
                  </Link>
                </>
              ) : (
                <div className="w-full flex flex-col items-start text-left divide-y divide-slate-100 dark:divide-slate-800/60">
                  {pickups.slice(0, 3).map((p) => (
                    <Link key={p.id || p.requestNo} to="/portal/pickups" className="w-full py-2 flex justify-between items-center group">
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{p.requestNo}</p>
                        <p className="text-[10px] text-slate-500">{p.scheduledDate} {p.timeSlot && `· ${p.timeSlot}`}</p>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        {p.status}
                      </span>
                    </Link>
                  ))}
                  {pickups.length > 3 && (
                    <Link to="/portal/pickups" className="text-[10px] text-center w-full pt-2 text-slate-500 hover:text-sky-600">
                      +{pickups.length - 3} more
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* -- Row 3: Insights Strip -- */}
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
          box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03);
          border-radius: 16px;
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }
        .bento-portal .client-premium-card:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04);
        }
        @media (prefers-color-scheme: dark) {
          .bento-portal .client-premium-card {
            box-shadow: 0 1px 3px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04);
          }
          .bento-portal .client-premium-card:hover {
            box-shadow: 0 4px 16px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06);
          }
        }
      `}</style>
    </div>
  );
}
