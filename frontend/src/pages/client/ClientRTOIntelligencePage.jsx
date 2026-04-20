import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, AreaChart, Area } from 'recharts';
import api from '../../services/api';
import { useSocket } from '../../context/SocketContext';

/* ─── Helpers ───────────────────────────────────────────── */
const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

function riskColor(level) {
  if (level === 'HIGH') return { bg: 'bg-rose-500/15', border: 'border-rose-400/40', text: 'text-rose-300', dot: 'bg-rose-400', glow: 'shadow-[0_0_12px_rgba(244,63,94,0.4)]' };
  if (level === 'MEDIUM') return { bg: 'bg-amber-500/15', border: 'border-amber-400/40', text: 'text-amber-300', dot: 'bg-amber-400', glow: 'shadow-[0_0_12px_rgba(251,191,36,0.35)]' };
  return { bg: 'bg-emerald-500/15', border: 'border-emerald-400/40', text: 'text-emerald-300', dot: 'bg-emerald-400', glow: 'shadow-[0_0_12px_rgba(16,185,129,0.35)]' };
}

/* ─── India Map SVG Component ───────────────────────────── */
const INDIA_STATES = [
  { id: 'jk', d: 'M42,8 L48,6 L52,9 L50,14 L45,16 L40,13Z', label: 'J&K' },
  { id: 'hp', d: 'M45,16 L50,14 L54,17 L52,21 L47,20Z', label: 'HP' },
  { id: 'pb', d: 'M40,18 L45,16 L47,20 L44,24 L38,22Z', label: 'PB' },
  { id: 'rj', d: 'M28,28 L38,22 L44,24 L46,30 L42,38 L32,42 L24,38 L22,32Z', label: 'RJ' },
  { id: 'up', d: 'M44,24 L52,21 L58,22 L62,28 L58,34 L50,36 L46,30Z', label: 'UP' },
  { id: 'br', d: 'M62,28 L70,27 L74,32 L70,36 L64,35 L58,34Z', label: 'BR' },
  { id: 'wb', d: 'M70,36 L76,34 L78,42 L74,50 L70,48 L68,42Z', label: 'WB' },
  { id: 'gj', d: 'M18,36 L24,38 L26,46 L22,52 L14,50 L12,42Z', label: 'GJ' },
  { id: 'mp', d: 'M32,42 L42,38 L50,36 L52,42 L48,48 L38,50 L30,48Z', label: 'MP' },
  { id: 'mh', d: 'M22,52 L30,48 L38,50 L42,56 L38,64 L30,66 L24,62 L20,56Z', label: 'MH' },
  { id: 'ts', d: 'M42,56 L48,48 L56,50 L58,56 L52,62 L46,60Z', label: 'TS' },
  { id: 'ka', d: 'M30,66 L38,64 L42,70 L40,78 L34,80 L28,76 L26,70Z', label: 'KA' },
  { id: 'tn', d: 'M42,70 L52,68 L56,74 L54,82 L48,86 L40,82 L40,78Z', label: 'TN' },
  { id: 'kl', d: 'M34,80 L40,78 L40,82 L42,88 L38,92 L34,88Z', label: 'KL' },
  { id: 'od', d: 'M58,42 L66,40 L68,42 L70,48 L66,54 L58,56 L56,50Z', label: 'OD' },
  { id: 'ap', d: 'M46,60 L52,62 L58,56 L66,54 L64,62 L56,68 L52,68Z', label: 'AP' },
  { id: 'dl', d: 'M43,24 L45,23 L46,25 L44,26Z', label: 'DL' },
  { id: 'jh', d: 'M62,34 L70,36 L68,42 L62,40 L58,38Z', label: 'JH' },
  { id: 'ct', d: 'M52,42 L58,42 L56,50 L48,48Z', label: 'CT' },
  { id: 'ne', d: 'M78,24 L86,22 L90,28 L88,34 L82,36 L76,34 L74,28Z', label: 'NE' },
];

const CITY_POSITIONS = {
  mumbai: { x: 26, y: 56 },
  delhi: { x: 44, y: 25 },
  bengaluru: { x: 36, y: 76 },
  kolkata: { x: 72, y: 40 },
  hyderabad: { x: 48, y: 58 },
  pune: { x: 30, y: 60 },
  lucknow: { x: 54, y: 28 },
  jaipur: { x: 36, y: 30 },
  chennai: { x: 50, y: 74 },
  ahmedabad: { x: 22, y: 42 },
};

function getZoneColor(score) {
  if (score >= 70) return '#ef4444';
  if (score >= 45) return '#f59e0b';
  return '#10b981';
}

function zonePosition(key, index) {
  const normalized = String(key || '').toLowerCase();
  const match = Object.entries(CITY_POSITIONS).find(([city]) => normalized.includes(city));
  if (match) return match[1];
  const spiral = [
    { x: 55, y: 35 }, { x: 60, y: 48 }, { x: 54, y: 60 }, { x: 44, y: 56 },
    { x: 42, y: 45 }, { x: 49, y: 51 }, { x: 36, y: 60 }, { x: 64, y: 39 },
  ];
  return spiral[index % spiral.length];
}

function formatRelativeTime(value) {
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
}

function formatDateLabel(value) {
  if (!value) return 'Current cycle';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getShipmentAge(row) {
  if (row?.age !== undefined && row?.age !== null && row.age !== '') {
    const numericAge = Number(row.age);
    if (!Number.isNaN(numericAge)) return `${numericAge} day${numericAge === 1 ? '' : 's'}`;
    return String(row.age);
  }

  const dateValue = row?.shippingDate || row?.createdAt || row?.orderDate;
  if (!dateValue) return '—';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '—';
  const diffDays = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
  return `${diffDays} day${diffDays === 1 ? '' : 's'}`;
}

function downloadRiskRowsCsv(rows) {
  const headers = ['AWB', 'Consignee', 'Destination', 'Courier', 'Shipping Date', 'Risk Level', 'Risk Score'];
  const lines = rows.map((row) => [
    row.awb || '',
    row.consignee || '',
    row.destination || '',
    row.courier || '',
    formatDateLabel(row.shippingDate),
    row.riskLevel || '',
    row.riskScore || '',
  ]);
  const csv = [headers, ...lines]
    .map((line) => line.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `seahawk-risk-shipments-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/* ─── Sparkline Mini Chart ─────────────────────────────── */
function Sparkline({ data, color = '#22d3ee', height = 48 }) {
  const chartData = (data.length ? data : [0, 0, 0]).map((v, i) => ({ i, v }));
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`spk-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.4} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} fill={`url(#spk-${color.replace('#', '')})`} strokeWidth={2} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── KPI Card ─────────────────────────────────────────── */
function KPICard({ label, value, hint, hintColor = 'text-orange-300', sparkData, sparkColor, icon }) {
  return (
    <div className="client-premium-card group relative overflow-hidden rounded-2xl bg-gradient-to-b from-white to-slate-50 p-5 transition-all duration-300 hover:shadow-[0_20px_40px_-20px_rgba(56,189,248,0.15)] dark:from-[#0c1631] dark:to-[#0a1228]">
      <div className="absolute right-3 top-3 text-lg opacity-30">{icon}</div>
      <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{label}</div>
      <div className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white">{value}</div>
      <div className={`mt-1.5 text-xs font-bold ${hintColor}`}>{hint}</div>
      {sparkData && (
        <div className="mt-3">
          <Sparkline data={sparkData} color={sparkColor || '#22d3ee'} />
        </div>
      )}
    </div>
  );
}

/* ─── Risk Score Gauge ─────────────────────────────────── */
function RiskGauge({ score }) {
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (circumference * Math.min(score, 100)) / 100;
  const gaugeColor = score >= 70 ? '#ef4444' : score >= 45 ? '#f59e0b' : '#10b981';
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" fill="none" stroke="#1e293b" strokeWidth="6" />
        <circle
          cx="50" cy="50" r="42" fill="none"
          stroke={gaugeColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 1s ease', filter: `drop-shadow(0 0 6px ${gaugeColor}80)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-white">{score}%</span>
        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: gaugeColor }}>
          {score >= 70 ? 'high' : score >= 45 ? 'medium' : 'low'}
        </span>
      </div>
    </div>
  );
}

/* ─── Fallback Data ────────────────────────────────────── */
const FALLBACK_HEAT = [
  { key: 'Mumbai', total: 24, rate: 21, avgRisk: 64 },
  { key: 'Delhi', total: 21, rate: 17, avgRisk: 52 },
  { key: 'Bengaluru', total: 18, rate: 16, avgRisk: 49 },
  { key: 'Kolkata', total: 15, rate: 24, avgRisk: 67 },
  { key: 'Hyderabad', total: 13, rate: 19, avgRisk: 56 },
  { key: 'Pune', total: 11, rate: 14, avgRisk: 45 },
  { key: 'Lucknow', total: 9, rate: 28, avgRisk: 73 },
  { key: 'Jaipur', total: 8, rate: 22, avgRisk: 62 },
];

/* ─── Main Page Component ──────────────────────────────── */
export default function ClientRTOIntelligencePage({ toast }) {
  const { socket } = useSocket();
  const [data, setData] = useState(null);
  const [days, setDays] = useState(90);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('at_risk');
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastLoadedAt, setLastLoadedAt] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/portal/rto-intelligence?days=${days}`);
        setData(res.data || null);
        setLastLoadedAt(new Date());
      } catch (err) {
        toast?.(err.message || 'Failed to load delivery risk engine', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [days, toast]);

  const trendData = useMemo(
    () =>
      (data?.monthlyTrend || []).map((row) => ({
        ...row,
        loss: Number(((row.rto || 0) * 900).toFixed(0)),
        save: Number(((row.total - row.rto) * 120).toFixed(0)),
      })),
    [data]
  );

  const kpiMini = useMemo(() => {
    const source = trendData.slice(-7);
    return source.length ? source : [{ month: 'M1', rate: 0, rto: 0, total: 0, save: 0 }];
  }, [trendData]);

  const sparkRates = useMemo(() => kpiMini.map((t) => Number(t.rate || 0)), [kpiMini]);
  const sparkRto = useMemo(() => kpiMini.map((t) => Number(t.rto || 0)), [kpiMini]);
  const sparkSave = useMemo(() => kpiMini.map((t) => Number(t.save || 0)), [kpiMini]);

  const heatRows = useMemo(() => {
    const source = (data?.heatmap || []).slice(0, 10);
    const rows = source.length ? source : FALLBACK_HEAT;
    return rows.map((zone, index) => ({
      ...zone,
      total: Number(zone.total || 0),
      rate: Number(zone.rate || 0),
      avgRisk: Number(zone.avgRisk || 0),
      pos: zonePosition(zone.key, index),
    }));
  }, [data]);

  const atRiskRows = useMemo(() => {
    const rows = data?.atRiskShipments || [];
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => `${row.awb} ${row.consignee || ''} ${row.destination || ''} ${row.courier || ''}`.toLowerCase().includes(q));
  }, [data, search]);

  const rowsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(atRiskRows.length / rowsPerPage));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return atRiskRows.slice(start, start + rowsPerPage);
  }, [atRiskRows, currentPage]);

  const topRisk = selectedShipment || atRiskRows[0] || null;

  const riskDistribution = useMemo(() => ({
    low: data?.riskDistribution?.low || 0,
    medium: data?.riskDistribution?.medium || 0,
    high: data?.riskDistribution?.high || 0,
    total: Math.max(1, (data?.riskDistribution?.low || 0) + (data?.riskDistribution?.medium || 0) + (data?.riskDistribution?.high || 0)),
  }), [data]);

  const recoveredCount = (data?.summary?.totalShipments || 0) - (data?.summary?.totalRto || 0) - (data?.summary?.atRiskCount || 0);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, tab, days, data?.atRiskShipments]);

  useEffect(() => {
    if (!socket) return undefined;
    const refresh = async () => {
      try {
        const res = await api.get(`/portal/rto-intelligence?days=${days}`);
        setData(res.data || null);
        setLastLoadedAt(new Date());
      } catch {
        // Keep the last successful snapshot visible if the socket refresh fails.
      }
    };

    socket.on('shipment:created', refresh);
    socket.on('shipment:status-updated', refresh);

    return () => {
      socket.off('shipment:created', refresh);
      socket.off('shipment:status-updated', refresh);
    };
  }, [socket, days]);

  return (
    <div className="client-premium-main risk-engine-shell !max-w-[1440px] space-y-4">

        {/* ── Hero Section ─────────────────────────────────────── */}
        <section className="client-premium-card relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-slate-50 to-sky-50 p-5 md:p-6 dark:from-[#0c1631] dark:via-[#0b1328] dark:to-[#0e1835]">
          <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-sky-500/8 blur-3xl" />
          <div className="pointer-events-none absolute -left-20 bottom-0 h-60 w-60 rounded-full bg-orange-500/6 blur-3xl" />

          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-3">
                <span className="rounded-full border border-sky-300/60 bg-sky-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-sky-700 dark:border-sky-400/30 dark:bg-sky-500/10 dark:text-sky-300">Dist RTO Rate</span>
                <span className="rounded-full border border-slate-200 bg-white/80 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-400">MetricSafe</span>
              </div>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white md:text-4xl">Delivery Risk Engine</h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Advanced analytics to minimize RTOs and protect your profits. Identify high-risk shipments and take proactive actions before returns happen.
              </p>
              <p className="mt-1 text-xs text-slate-500">Distributes Shipments · Up to the management</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Last sync {formatRelativeTime(lastLoadedAt)}</span>
                <span className="rounded-full border border-cyan-300/60 bg-cyan-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300">Live data</span>
                <span className="rounded-full border border-emerald-300/60 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">Synced</span>
              </div>
              <Link to="/portal/shipments" className="rounded-lg border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:border-sky-300 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-sky-500/40 dark:hover:text-white">
                Shipments →
              </Link>
            </div>
          </div>

          {/* Controls bar */}
          <div className="relative z-10 mt-5 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50/90 p-1 dark:border-slate-700/60 dark:bg-[#0a1228]/80">
              <span className="rounded-lg bg-orange-500/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-orange-300">RTO Rate</span>
              <span className="rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">Curr NEER</span>
            </div>
            <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50/90 p-1 dark:border-slate-700/60 dark:bg-[#0a1228]/80">
              {[30, 60, 90, 180].map((value) => (
                <button
                  key={value}
                  className={`rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] transition ${
                    days === value
                      ? 'bg-orange-500 text-white shadow-[0_8px_20px_-12px_rgba(249,115,22,0.9)]'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                  onClick={() => setDays(value)}
                >
                  {value === 30 ? 'Last 30 Days' : value === 180 ? 'Custom' : `${value}d`}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center rounded-xl border border-slate-200 bg-white/90 px-3 py-2 dark:border-slate-700/60 dark:bg-[#0a1228]/80">
              <svg className="mr-2 h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Shipments..."
                className="w-48 bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-500 focus:outline-none dark:text-white"
              />
            </div>
          </div>
        </section>

        {/* ── KPI Cards ────────────────────────────────────────── */}
        <section className="grid gap-4 md:grid-cols-3">
          <KPICard
            icon="📊"
            label="RTO Rate"
            value={`${data?.summary?.rtoRate || 0}%`}
            hint={`${data?.summary?.atRiskCount || 0} at risk shipments over week`}
            hintColor="text-orange-600 dark:text-orange-300"
            sparkData={sparkRates}
            sparkColor="#f97316"
          />
          <KPICard
            icon="💰"
            label="Loss to RTOs"
            value={money(data?.summary?.estimatedLoss)}
            hint={`Potential saving ${money(data?.summary?.potentialSaved)} week`}
            hintColor="text-emerald-600 dark:text-emerald-300"
            sparkData={sparkRto}
            sparkColor="#22d3ee"
          />
          <KPICard
            icon="🛡️"
            label="Shipments Saved"
            value={(data?.summary?.totalShipments || 0) - (data?.summary?.totalRto || 0)}
            hint="Future saved this week"
            hintColor="text-sky-600 dark:text-sky-300"
            sparkData={sparkSave}
            sparkColor="#60a5fa"
          />
        </section>

        {/* ── Heatmap + RTO Trends ─────────────────────────────── */}
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,1fr)]">
          {/* India Heatmap */}
          <div className="client-premium-card rounded-2xl bg-gradient-to-b from-white to-slate-50 p-5 dark:from-[#0c1631] dark:to-[#0a1228]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-[0.1em] text-slate-900 dark:text-white">Heatmap</h3>
                <p className="mt-0.5 text-[10px] font-bold text-slate-500">RTO hotspots at 10 zones</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-400">{heatRows.length} Zones</span>
                <div className="flex items-center gap-1">
                  {[
                    { color: '#ef4444', label: 'H' },
                    { color: '#f59e0b', label: 'M' },
                    { color: '#10b981', label: 'L' },
                  ].map((l) => (
                    <span key={l.label} className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-black text-slate-300" style={{ background: `${l.color}20`, border: `1px solid ${l.color}40` }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: l.color }} />
                      {l.label}
                    </span>
                  ))}
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-500 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-400">{new Date().toLocaleDateString('en-IN')}</span>
              </div>
            </div>

            <div className="relative h-[340px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-700/40 dark:bg-[#080f22]">
              {/* Grid overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(100,116,139,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(100,116,139,0.06)_1px,transparent_1px)] bg-[size:28px_28px]" />

              {/* India map SVG */}
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full p-4" style={{ filter: 'drop-shadow(0 0 20px rgba(56,189,248,0.08))' }}>
                {INDIA_STATES.map((state) => {
                  const zone = heatRows.find((z) => {
                    const key = z.key?.toLowerCase() || '';
                    const stateMap = { dl: 'delhi', mh: 'mumbai', ka: 'bengaluru', wb: 'kolkata', ts: 'hyderabad', rj: 'jaipur', up: 'lucknow', gj: 'ahmedabad' };
                    return key.includes(stateMap[state.id] || '___');
                  });
                  const fillColor = zone ? `${getZoneColor(zone.avgRisk)}30` : 'rgba(56,189,248,0.08)';
                  const strokeColor = zone ? `${getZoneColor(zone.avgRisk)}60` : 'rgba(148,163,184,0.2)';
                  return (
                    <path
                      key={state.id}
                      d={state.d}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth="0.4"
                      className="transition-all duration-300 hover:brightness-150"
                    />
                  );
                })}
              </svg>

              {/* City bubbles */}
              {!loading && heatRows.map((zone, index) => {
                const size = 18 + Math.min(22, Math.round(zone.total / 1.5));
                return (
                  <div
                    key={`${zone.key}-${index}`}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-200 hover:scale-125"
                    style={{ left: `${zone.pos.x}%`, top: `${zone.pos.y}%` }}
                    title={`${zone.key}: ${zone.total} shipments, ${zone.rate}% RTO rate`}
                  >
                    <div
                      className="grid place-items-center rounded-full border border-white/30 text-[9px] font-black text-white"
                      style={{
                        width: size,
                        height: size,
                        background: `${getZoneColor(zone.avgRisk)}cc`,
                        boxShadow: `0 0 ${12 + zone.avgRisk / 5}px ${getZoneColor(zone.avgRisk)}60`,
                      }}
                    >
                      {zone.total}
                    </div>
                    <div className="mt-0.5 text-center text-[8px] font-black text-white/80 drop-shadow-[0_0_6px_rgba(0,0,0,0.8)]">{zone.key}</div>
                  </div>
                );
              })}

              {loading && <div className="absolute inset-0 grid place-items-center text-sm font-semibold text-slate-400">Loading heatmap...</div>}

              {/* Bottom info bar */}
              <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white/90 px-3 py-2 dark:border-slate-700/40 dark:bg-[#0a1228]/90">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-bold">RTO Hotspot Zones</span>
                  <div className="flex items-center gap-2">
                    <span>Full RTO orders:</span>
                    <span className="font-black text-orange-300">Observe and listen to shifts</span>
                  </div>
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <span className="text-[10px] font-bold text-slate-500">LMR</span>
                  <span className="text-[10px] font-bold text-slate-500">CartMgr: 13</span>
                  <div className="h-1.5 w-12 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-500">04 lines</span>
                </div>
              </div>
            </div>
          </div>

          {/* RTO Trends + Mini Chart */}
          <div className="space-y-4">
            <div className="client-premium-card rounded-2xl bg-gradient-to-b from-white to-slate-50 p-5 dark:from-[#0c1631] dark:to-[#0a1228]">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-[0.1em] text-slate-900 dark:text-white">RTO Trends</h3>
                <button className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black text-slate-500 transition hover:text-slate-900 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:text-white">
                  Resolved ▾
                </button>
              </div>
              <div style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                    <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }}
                      labelStyle={{ color: '#94a3b8' }}
                    />
                    <Line type="monotone" dataKey="rate" stroke="#60a5fa" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="rto" stroke="#f97316" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="client-premium-card rounded-2xl bg-gradient-to-b from-white to-slate-50 p-5 dark:from-[#0c1631] dark:to-[#0a1228]">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs font-black text-slate-900 dark:text-white">📈 Potential loss reduction</div>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-bold text-emerald-300">Active</span>
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-600 dark:border-slate-700/40 dark:bg-[#080f22] dark:text-slate-300">
                ⓘ Potential loss reduced by {money(data?.summary?.potentialSaved)} compared to last week
              </div>
              <div className="mt-3 text-[10px] font-bold text-slate-500">Projected for RTO trends</div>
              <div className="mt-2 h-12">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Q1', v: 40 }, { name: 'Q2', v: 55 }, { name: 'Q3', v: 35 },
                    { name: 'Q4', v: 65 }, { name: 'Q5', v: 45 },
                  ]}>
                    <Bar dataKey="v" fill="#f97316" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        {/* ── Action Bar + Tabs ─────────────────────────────────── */}
        <section className="client-premium-card rounded-2xl bg-gradient-to-b from-white to-slate-50 dark:from-[#0c1631] dark:to-[#0a1228]">
          {/* Tabs and action buttons */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-5 py-3 dark:border-slate-700/40">
            <button
              onClick={() => setTab('at_risk')}
              className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.08em] transition ${
                tab === 'at_risk'
                  ? 'bg-orange-500 text-white shadow-[0_6px_16px_-8px_rgba(249,115,22,0.8)]'
                  : 'border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              ⚡ At Risk
            </button>
            <button
              onClick={() => setTab('recovered')}
              className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.08em] transition ${
                tab === 'recovered'
                  ? 'bg-emerald-500 text-white shadow-[0_6px_16px_-8px_rgba(16,185,129,0.8)]'
                  : 'border border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Recovered {recoveredCount > 0 ? `-${recoveredCount}` : ''}
            </button>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-black text-slate-500 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-400">
              More EO ▾
            </span>

            <div className="mx-2 h-5 w-px bg-slate-200 dark:bg-slate-700" />

            {['Reschedule RTO', 'Auto Call Pending', 'Assess All'].map((action) => (
              <button key={action} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.06em] text-slate-600 transition hover:border-sky-300 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-sky-500/40 dark:hover:text-white">
                ↻ {action}
              </button>
            ))}
          </div>

          {/* Table header with count and filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-3 dark:border-slate-700/40">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Shipments At Risk</h3>
              <span className="grid h-6 min-w-[28px] place-items-center rounded-full bg-orange-500/20 px-2 text-xs font-black text-orange-300">
                {atRiskRows.length}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black text-slate-500 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-400">Recovered</span>
              <svg className="h-3.5 w-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => downloadRiskRowsCsv(atRiskRows)}
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black text-slate-600 transition hover:border-orange-300 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-orange-400/40 dark:hover:text-white"
              >
                Export CSV
              </button>
              {['Couriers', 'Risk hours', 'Filter +'].map((f) => (
                <button key={f} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-black text-slate-500 transition hover:border-sky-300 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:border-sky-500/40 dark:hover:text-white">
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="p-5">
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((row) => (
                  <div key={row} className="h-12 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800/60" />
                ))}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700/40">
                    {['Waybill', 'Age', 'Consignee', 'Shipping Date', 'Courier', 'RTO Risk Level', 'Actions'].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {paginatedRows.map((row) => {
                    const rc = riskColor(row.riskLevel);
                    const actions = row.recommendedActions || ['Contact Customer', 'Verify Order'];
                    return (
                      <tr
                        key={row.awb}
                        className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30"
                        onClick={() => setSelectedShipment(row)}
                      >
                        <td className="px-5 py-3.5 font-mono text-xs font-black text-slate-900 dark:text-white">{row.awb}</td>
                        <td className="px-5 py-3.5 text-xs font-bold text-slate-600 dark:text-slate-300">{getShipmentAge(row)}</td>
                        <td className="px-5 py-3.5 text-xs font-bold text-slate-900 dark:text-white">{row.consignee || 'Unknown'}</td>
                        <td className="px-5 py-3.5 text-xs font-bold text-slate-600 dark:text-slate-300">{formatDateLabel(row.shippingDate)}</td>
                        <td className="px-5 py-3.5 text-xs font-black uppercase text-slate-600 dark:text-slate-300">{row.courier || 'TBA'}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black ${rc.bg} ${rc.border} ${rc.text} ${rc.glow}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${rc.dot}`} />
                            {row.riskLevel}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-black text-slate-600 transition hover:border-orange-300 hover:text-slate-900 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-orange-400/40 dark:hover:text-white"
                            onClick={(e) => { e.stopPropagation(); }}
                          >
                            ✦ {actions[0]} ▾
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {atRiskRows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-sm text-slate-500">No at-risk shipments detected in this period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {!loading && atRiskRows.length > rowsPerPage && (
            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 dark:border-slate-700/40">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Showing {(currentPage - 1) * rowsPerPage + 1}-{Math.min(currentPage * rowsPerPage, atRiskRows.length)} of {atRiskRows.length}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600 transition disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-300"
                >
                  Previous
                </button>
                <span className="text-xs font-black text-slate-500 dark:text-slate-400">Page {currentPage} / {totalPages}</span>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600 transition disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-300"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>

        {/* ── Bottom Row: Insights + High-Risk Overview ─────────── */}
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,1fr)]">
          {/* Notification Insights + Distribution */}
          <div className="space-y-4">
            <div className="client-premium-card rounded-2xl bg-gradient-to-b from-white to-slate-50 p-5 dark:from-[#0c1631] dark:to-[#0a1228]">
              <div className="mb-4 flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-sky-500/15 text-xs">🔔</span>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">Notification Insights</h3>
              </div>
              <div className="space-y-2">
                {(data?.insights || []).map((line, idx) => (
                  <div key={idx} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700/40 dark:bg-[#080f22]">
                    <span className="mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-emerald-500/15 text-[10px] text-emerald-400">✓</span>
                    <span className="flex-1 text-xs font-bold text-slate-600 dark:text-slate-300">{line}</span>
                    <button className="flex-shrink-0 text-slate-600 transition hover:text-slate-400">✕</button>
                  </div>
                ))}
                {!data?.insights?.length && (
                  <>
                    <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                      <span className="mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-emerald-500/15 text-[10px] text-emerald-400">✓</span>
                      <span className="flex-1 text-xs font-bold text-slate-300">Many COD orders to tier-3 locations are flagged as high risk</span>
                      <button className="flex-shrink-0 text-slate-600 transition hover:text-slate-400">✕</button>
                    </div>
                    <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
                      <span className="mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-emerald-500/15 text-[10px] text-emerald-400">✓</span>
                      <span className="flex-1 text-xs font-bold text-slate-300">~22 new customers reported as potential RTO risk</span>
                      <button className="flex-shrink-0 text-slate-600 transition hover:text-slate-400">✕</button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* RTO Risk Distribution */}
            <div className="client-premium-card rounded-2xl bg-gradient-to-b from-white to-slate-50 p-5 dark:from-[#0c1631] dark:to-[#0a1228]">
              <h3 className="mb-1 text-sm font-black uppercase tracking-[0.1em] text-slate-900 dark:text-white">RTO Risk Distribution</h3>
              <p className="mb-4 text-[10px] font-bold text-slate-500">RTShipments TED</p>

              <div className="grid grid-cols-2 gap-4">
                {/* Percentages */}
                <div className="space-y-3">
                  <div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">{Math.round((riskDistribution.low / riskDistribution.total) * 100)}%</div>
                    <div className="text-[10px] font-bold text-slate-500">Slow</div>
                  </div>
                  <div>
                    <div className="text-3xl font-black text-slate-900 dark:text-white">{Math.round((riskDistribution.medium / riskDistribution.total) * 100)}%</div>
                    <div className="text-[10px] font-bold text-slate-500">Moderate</div>
                  </div>
                </div>
                {/* Visual bars */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500">TALLY</span>
                    <span className="text-[10px] font-bold text-slate-500">LIBRARY</span>
                    <span className="text-[10px] font-bold text-slate-500">SISCO</span>
                  </div>
                  <div className="flex gap-1">
                    <div className="h-14 flex-1 rounded-lg bg-rose-500/30" style={{ flex: riskDistribution.high }} />
                    <div className="h-14 flex-1 rounded-lg bg-amber-500/30" style={{ flex: riskDistribution.medium }} />
                    <div className="h-14 flex-1 rounded-lg bg-emerald-500/30" style={{ flex: riskDistribution.low }} />
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-black">
                    <span className="text-emerald-300">LOW</span>
                    <span className="text-amber-300">MEDIUM</span>
                    <span className="text-rose-300">HIGH</span>
                  </div>
                </div>
              </div>

              {/* Bottom insights */}
              <div className="mt-4 space-y-2">
                <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700/40 dark:bg-[#080f22]">
                  <span className="mt-0.5 text-[10px] text-slate-500">⊕</span>
                  <span className="text-[10px] font-bold text-slate-400">Many COD orders & tier-3 locations are flagged as high risk</span>
                </div>
                <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700/40 dark:bg-[#080f22]">
                  <span className="mt-0.5 text-[10px] text-slate-500">⊕</span>
                  <span className="text-[10px] font-bold text-slate-400">22 new customers reported as potential RTO risk</span>
                </div>
              </div>
            </div>
          </div>

          {/* High-Risk Shipment Overview */}
          <div className="client-premium-card rounded-2xl bg-gradient-to-b from-white to-slate-50 p-5 dark:from-[#0c1631] dark:to-[#0a1228]">
            <h3 className="mb-4 text-sm font-black text-slate-900 dark:text-white">High-Risk Shipment Overview</h3>
            {topRisk ? (
              <>
                {/* Shipment header */}
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">RTO Shipments</div>
                    <div className="mt-1 font-mono text-xl font-black text-slate-900 dark:text-white">{topRisk.awb}</div>
                    <div className="mt-0.5 text-xs font-bold text-slate-600 dark:text-slate-300">{topRisk.consignee || 'Unknown customer'}</div>
                    <div className="mt-0.5 text-[10px] font-bold uppercase text-slate-500">
                      {topRisk.destination ? `EXP BRNNE ${topRisk.destination} TRACK` : 'Destination pending'}
                    </div>
                  </div>
                  <RiskGauge score={topRisk.riskScore || 78} />
                </div>

                {/* Risk reasons */}
                <div className="space-y-2">
                  {(topRisk.reasons || ['COD order', 'High order value', 'Tier-3 location', '1 past RTO']).slice(0, 5).map((reason, i) => (
                    <div key={reason} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-700/40 dark:bg-[#080f22]">
                      <div className="flex items-center gap-2.5">
                        <span className={`grid h-5 w-5 place-items-center rounded-full text-[10px] ${
                          i < 2 ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'
                        }`}>
                          {i < 2 ? '⚠' : '◎'}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{reason}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">1:2:{(i + 1) * 10 + 30}</span>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-black text-slate-900 transition hover:border-sky-300 dark:border-slate-600 dark:bg-slate-800/60 dark:text-white dark:hover:border-sky-500/40">
                    📞 Contact Customer
                  </button>
                  <button className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-black text-slate-900 transition hover:border-orange-300 dark:border-slate-600 dark:bg-slate-800/60 dark:text-white dark:hover:border-orange-400/40">
                    🔄 Change Courier
                  </button>
                </div>
                <div className="mt-2 space-y-1.5">
                  <button className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-emerald-600 transition hover:border-emerald-300 dark:border-slate-700/40 dark:bg-[#080f22] dark:text-emerald-300 dark:hover:border-emerald-500/30">
                    <span>✓ Verify Order</span>
                    <span className="text-slate-600">→</span>
                  </button>
                  <button className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-amber-600 transition hover:border-amber-300 dark:border-slate-700/40 dark:bg-[#080f22] dark:text-amber-300 dark:hover:border-amber-500/30">
                    <span>⚠ Suppress</span>
                    <span className="text-slate-600">→</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500 dark:border-slate-700/40 dark:bg-[#080f22]">
                No high-risk shipment selected. Click a row above to inspect.
              </div>
            )}
          </div>
        </section>

      {/* ── Page-level styles ──────────────────────────────────── */}
      <style>{`
        @keyframes riskPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
