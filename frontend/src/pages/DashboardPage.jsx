import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  RefreshCw, TrendingUp, TrendingDown, Package, CheckCircle,
  Clock, RotateCcw, AlertTriangle, Bell, Zap, Star,
  FileText, ArrowUp, ArrowDown, Activity, Users, IndianRupee,
  Truck, BarChart2, ChevronRight, MapPin
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, LineChart, Line, PieChart, Pie, Legend, CartesianGrid,
  AreaChart, Area
} from 'recharts';
import api from '../services/api';
import { PageLoader } from '../components/ui/Loading';
import { useAuth } from '../context/AuthContext';

const fmt    = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const fmtNum = n => Number(n || 0).toLocaleString('en-IN');
const fmtPct = n => `${Number(n || 0).toFixed(1)}%`;

const BRAND  = '#0b1f3a';
const ORANGE = '#e8580a';
const COLORS = [ORANGE, '#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706', '#ef4444', '#ec4899'];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── Stat Card ─────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, icon, accent, trend, trendVal }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: 16,
      padding: '20px 20px 16px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: accent || ORANGE, borderRadius: '16px 16px 0 0',
      }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        {trend !== undefined && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: 2,
            fontSize: 11, fontWeight: 700,
            color: trend >= 0 ? '#16a34a' : '#dc2626',
            background: trend >= 0 ? '#f0fdf4' : '#fef2f2',
            padding: '2px 8px', borderRadius: 20,
          }}>
            {trend >= 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
            {Math.abs(trendVal || trend)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: BRAND, letterSpacing: '-0.5px', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4, fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ── India Zone Map (SVG visual) ───────────────────────────────────────────
function ZoneMap({ zoneData = [] }) {
  const zones = [
    { id: 'Delhi & NCR',    x: 310, y: 155, r: 22 },
    { id: 'North India',    x: 270, y: 120, r: 18 },
    { id: 'Metro Cities',   x: 350, y: 320, r: 20 },
    { id: 'Rest of India',  x: 310, y: 240, r: 16 },
    { id: 'North East',     x: 480, y: 160, r: 14 },
    { id: 'Port Blair',     x: 460, y: 380, r: 10 },
  ];
  const maxVal = Math.max(...zoneData.map(z => z.count || 0), 1);
  const getCount = (id) => zoneData.find(z => z.zone === id)?.count || 0;

  return (
    <div style={{ position: 'relative', width: '100%', height: 320 }}>
      <svg viewBox="0 0 600 420" style={{ width: '100%', height: '100%' }}>
        {/* Simple India outline */}
        <ellipse cx="310" cy="230" rx="200" ry="170" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
        {/* Zone circles */}
        {zones.map(z => {
          const count = getCount(z.id);
          const intensity = count / maxVal;
          return (
            <g key={z.id}>
              <circle
                cx={z.x} cy={z.y}
                r={z.r + intensity * 12}
                fill={ORANGE}
                opacity={0.15 + intensity * 0.5}
              />
              <circle cx={z.x} cy={z.y} r={z.r * 0.4} fill={ORANGE} opacity={0.9} />
              <text x={z.x} y={z.y + z.r + 14} textAnchor="middle" fontSize="9" fill="#374151" fontWeight="600">
                {z.id.split(' ')[0]}
              </text>
              {count > 0 && (
                <text x={z.x} y={z.y + 3} textAnchor="middle" fontSize="8" fill="#fff" fontWeight="800">
                  {count}
                </text>
              )}
            </g>
          );
        })}
        {/* Route lines from Delhi */}
        {zones.slice(1).map(z => (
          <line key={z.id}
            x1="310" y1="155" x2={z.x} y2={z.y}
            stroke={ORANGE} strokeWidth="1" strokeDasharray="4 3" opacity="0.3"
          />
        ))}
      </svg>
      <div style={{ position: 'absolute', bottom: 8, right: 8 }}>
        <div style={{ fontSize: 10, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: ORANGE, opacity: 0.8 }} />
          Shipments today
        </div>
      </div>
    </div>
  );
}

// ── Courier Performance Table ─────────────────────────────────────────────
function CourierPerformance({ data = [] }) {
  if (!data.length) return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
      <Truck size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
      <p style={{ fontSize: 13 }}>No courier data yet</p>
    </div>
  );
  const max = Math.max(...data.map(d => d.value || 0), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.map((d, i) => (
        <div key={d.name}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: BRAND }}>{d.name}</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: ORANGE }}>{d.value}</span>
          </div>
          <div style={{ height: 6, background: '#f3f4f6', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(d.value / max) * 100}%`,
              background: `linear-gradient(90deg, ${ORANGE}, #f97316)`,
              borderRadius: 6,
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Top Clients Leaderboard ───────────────────────────────────────────────
function ClientLeaderboard({ clients = [], pinned = [], onPin }) {
  if (!clients.length) return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: '#9ca3af' }}>
      <Users size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
      <p style={{ fontSize: 13 }}>No client data yet</p>
    </div>
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {clients.slice(0, 8).map((c, i) => (
        <div key={c.code} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 0',
          borderBottom: i < clients.length - 1 ? '1px solid #f3f4f6' : 'none',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
            background: i === 0 ? ORANGE : i === 1 ? '#6b7280' : i === 2 ? '#d97706' : '#e5e7eb',
            color: i < 3 ? '#fff' : '#374151',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800,
          }}>
            {i + 1}
          </div>
          <div style={{
            width: 32, height: 32, borderRadius: 10, flexShrink: 0,
            background: BRAND, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800,
          }}>
            {(c.company || c.code)?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {c.company || c.code}
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>{fmtNum(c.count || c.shipments || 0)} shipments</div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: BRAND }}>{fmt(c.revenue || c.amount || 0)}</div>
            <button
              onClick={() => onPin?.(c.code)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: pinned.includes(c.code) ? '#f59e0b' : '#d1d5db' }}
            >
              <Star size={12} fill={pinned.includes(c.code) ? '#f59e0b' : 'none'} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, isAdmin, hasRole } = useAuth();
  const navigate = useNavigate();

  const [stats,      setStats]      = useState(null);
  const [actions,    setActions]    = useState(null);
  const [rtoAlerts,  setRtoAlerts]  = useState([]);
  const [activity,   setActivity]   = useState([]);
  const [clients,    setClients]    = useState([]);
  const [profit,     setProfit]     = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [lastUpdated,setLastUpdated]= useState(null);
  const [pinned,     setPinned]     = useState(() => {
    try { return JSON.parse(localStorage.getItem('pinnedClients') || '[]'); } catch { return []; }
  });

  const togglePin = (code) => {
    const next = pinned.includes(code)
      ? pinned.filter(c => c !== code)
      : [...pinned, code].slice(0, 6);
    setPinned(next);
    localStorage.setItem('pinnedClients', JSON.stringify(next));
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const calls = [
        api.get('/shipments/stats/today'),
        api.get('/ops/pending-actions'),
        api.get('/ops/recent-activity?limit=8'),
        api.get('/clients'),
      ];
      if (isAdmin || hasRole('OPS_MANAGER')) {
        calls.push(api.get('/ops/rto-alerts'));
        calls.push(api.get('/ops/profit-summary?dateFrom=' + new Date(Date.now() - 30*86400000).toISOString().split('T')[0]));
        calls.push(api.get('/ops/client-comparison'));
      }
      const results = await Promise.allSettled(calls);
      if (results[0]?.status === 'fulfilled') setStats(results[0].value?.data || results[0].value);
      if (results[1]?.status === 'fulfilled') setActions(results[1].value?.data || results[1].value);
      if (results[2]?.status === 'fulfilled') setActivity(results[2].value?.data || results[2].value || []);
      if (results[3]?.status === 'fulfilled') setClients(results[3].value?.data || results[3].value || []);
      if (results[4]?.status === 'fulfilled') setRtoAlerts(results[4].value?.data?.alerts || results[4].value?.alerts || []);
      if (results[5]?.status === 'fulfilled') setProfit(results[5].value?.data || results[5].value);
      if (results[6]?.status === 'fulfilled') setComparison(results[6].value?.data || results[6].value);
      setLastUpdated(new Date());
    } catch {}
    finally { setLoading(false); }
  }, [isAdmin]);

  useEffect(() => { load(); }, [load]);

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e) => {
      if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
      if (e.key === 'n') navigate('/app/entry');
      if (e.key === 'i') navigate('/app/import');
      if (e.key === 't') navigate('/app/track');
      if (e.key === 'a') navigate('/app/all');
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [navigate]);

  if (loading) return <PageLoader />;

  const courierData = (stats?.byCourier || []).map(c => ({
    name: c.courier || 'Other',
    value: parseInt(c._count?.id || c.cnt || 0),
  }));

  const topClients = [...clients]
    .sort((a, b) => (b.walletBalance || 0) - (a.walletBalance || 0))
    .slice(0, 8)
    .map(c => ({ ...c, revenue: c.walletBalance || 0, count: 0 }));

  // Build zone data from courier breakdown
  const zoneData = [];

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🦅</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: BRAND, margin: 0, letterSpacing: '-0.3px' }}>
              {getGreeting()}, {user?.name?.split(' ')[0]}
            </h1>
          </div>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>{today}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link to="/app/entry" style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            background: ORANGE, color: '#fff', borderRadius: 10, textDecoration: 'none',
            fontSize: 13, fontWeight: 700, boxShadow: '0 2px 8px rgba(232,88,10,0.35)',
          }}>
            ➕ New Entry
          </Link>
          <button onClick={load} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
            background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
            fontSize: 13, fontWeight: 600, color: '#374151', cursor: 'pointer',
          }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* ── RTO Alert ── */}
      {rtoAlerts.length > 0 && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <AlertTriangle size={16} color="#ef4444" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#dc2626' }}>High RTO Alert:</span>
          {rtoAlerts.map(a => (
            <span key={a.courier} style={{ fontSize: 12, background: '#fff', border: '1px solid #fecaca', borderRadius: 8, padding: '3px 10px', color: '#dc2626', fontWeight: 700 }}>
              {a.courier} — {a.rate}% RTO
            </span>
          ))}
        </div>
      )}

      {/* ── Pending Actions ── */}
      {actions?.total > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Bell size={16} color="#d97706" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>{actions.total} items need attention</span>
          {actions.pendingNDRs > 0 && <Link to="/app/ndr" style={{ fontSize: 12, background: '#fff', border: '1px solid #fde68a', borderRadius: 8, padding: '3px 10px', color: '#92400e', fontWeight: 700, textDecoration: 'none' }}>⚠️ {actions.pendingNDRs} NDRs</Link>}
          {actions.draftInvoices > 0 && <Link to="/app/invoices" style={{ fontSize: 12, background: '#fff', border: '1px solid #fde68a', borderRadius: 8, padding: '3px 10px', color: '#92400e', fontWeight: 700, textDecoration: 'none' }}>🧾 {actions.draftInvoices} Invoices</Link>}
          {actions.todayPickups > 0 && <Link to="/app/pickups" style={{ fontSize: 12, background: '#fff', border: '1px solid #fde68a', borderRadius: 8, padding: '3px 10px', color: '#92400e', fontWeight: 700, textDecoration: 'none' }}>📦 {actions.todayPickups} Pickups</Link>}
          {actions.rtoShipments > 0 && <Link to="/app/all?status=RTO" style={{ fontSize: 12, background: '#fff', border: '1px solid #fde68a', borderRadius: 8, padding: '3px 10px', color: '#92400e', fontWeight: 700, textDecoration: 'none' }}>↩️ {actions.rtoShipments} RTOs</Link>}
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
        <KpiCard label="Today's Shipments" value={fmtNum(stats?.total || 0)}        icon="📦" accent={BRAND} />
        <KpiCard label="Delivered"          value={fmtNum(stats?.delivered || 0)}    icon="✅" accent="#16a34a" />
        <KpiCard label="In Transit"         value={fmtNum(stats?.inTransit || 0)}    icon="🚚" accent="#2563eb" />
        <KpiCard label="Today's Revenue"    value={fmt(stats?.amount || 0)}          icon="💰" accent={ORANGE} />
        <KpiCard label="Total Weight"       value={`${(stats?.weight || 0).toFixed(1)} kg`} icon="⚖️" accent="#7c3aed" />
        {profit && <>
          <KpiCard label="30-day Revenue"   value={fmt(profit.totalRevenue || 0)}    icon="📈" accent="#0891b2" />
          <KpiCard label="Avg per Shipment" value={fmt(profit.avgPerShipment || 0)}  icon="💹" accent="#059669" />
        </>}
      </div>

      {/* ── Main Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Courier Performance */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Truck size={16} color={ORANGE} />
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: BRAND, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Courier Performance
            </h3>
          </div>
          <CourierPerformance data={courierData} />
          {courierData.length > 0 && (
            <div style={{ marginTop: 16, height: 120 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courierData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4,4,0,0]}>
                    {courierData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Shipment Zone Map */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <MapPin size={16} color={ORANGE} />
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: BRAND, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Coverage Map
            </h3>
          </div>
          <ZoneMap zoneData={zoneData} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
            {[
              { label: 'Delhi & NCR', color: ORANGE },
              { label: 'North India', color: '#2563eb' },
              { label: 'Metro Cities', color: '#7c3aed' },
              { label: 'Rest of India', color: '#059669' },
            ].map(z => (
              <div key={z.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: z.color, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: '#6b7280', fontWeight: 600 }}>{z.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Clients Leaderboard */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={16} color={ORANGE} />
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: BRAND, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Top Clients
              </h3>
            </div>
            <Link to="/app/clients" style={{ fontSize: 11, color: ORANGE, textDecoration: 'none', fontWeight: 700 }}>View all →</Link>
          </div>
          <ClientLeaderboard clients={topClients} pinned={pinned} onPin={togglePin} />
        </div>
      </div>

      {/* ── Bottom Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* 30-day Revenue Trend */}
        {profit?.byCourier?.length > 0 && (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <TrendingUp size={16} color={ORANGE} />
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: BRAND, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Revenue by Courier (30 days)
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={profit.byCourier} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="courier" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={v => fmt(v)} />
                <Bar dataKey="revenue" fill={ORANGE} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Activity Feed */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={16} color={ORANGE} />
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: BRAND, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Activity
              </h3>
            </div>
            <Link to="/app/audit" style={{ fontSize: 11, color: ORANGE, textDecoration: 'none', fontWeight: 700 }}>All →</Link>
          </div>
          {Array.isArray(activity) && activity.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220, overflowY: 'auto' }}>
              {activity.map((a, i) => (
                <div key={a.id || i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
                  }}>
                    {a.action === 'CREATE' ? '➕' : a.action === 'STATUS_CHANGE' ? '🔄' : a.action === 'DELETE' ? '🗑️' : '✏️'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, color: '#374151', margin: 0, lineHeight: 1.4 }}>
                      <strong>{a.user}</strong>{' '}
                      {a.action === 'CREATE' ? 'created' : a.action === 'STATUS_CHANGE' ? 'updated' : 'modified'}{' '}
                      <span style={{ fontFamily: 'monospace', color: ORANGE }}>{a.entityId}</span>
                    </p>
                    <p style={{ fontSize: 10, color: '#9ca3af', margin: '2px 0 0' }}>
                      {a.time ? new Date(a.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#9ca3af' }}>
              <Activity size={24} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
              <p style={{ fontSize: 12 }}>No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Client Month-over-Month ── */}
      {comparison?.clients?.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <BarChart2 size={16} color={ORANGE} />
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: BRAND, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Client Month-over-Month
            </h3>
            <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 4 }}>{comparison.lastMonth} → {comparison.thisMonth}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Client', 'This Month', 'Last Month', 'Change', 'Revenue', 'Rev. Change'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.clients.slice(0, 8).map((c, i) => (
                  <tr key={c.code} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ fontWeight: 700, color: BRAND }}>{c.company}</div>
                      <div style={{ fontSize: 10, color: '#9ca3af' }}>{c.code}</div>
                    </td>
                    <td style={{ padding: '10px 16px', fontWeight: 800, color: BRAND }}>{fmtNum(c.thisCount)}</td>
                    <td style={{ padding: '10px 16px', color: '#6b7280' }}>{fmtNum(c.lastCount)}</td>
                    <td style={{ padding: '10px 16px' }}>
                      {c.countChange !== null ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 700, color: c.countChange >= 0 ? '#16a34a' : '#dc2626', background: c.countChange >= 0 ? '#f0fdf4' : '#fef2f2', padding: '2px 8px', borderRadius: 20 }}>
                          {c.countChange >= 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                          {Math.abs(c.countChange)}%
                        </span>
                      ) : <span style={{ fontSize: 11, color: '#9ca3af' }}>New</span>}
                    </td>
                    <td style={{ padding: '10px 16px', fontWeight: 800, color: BRAND }}>{fmt(c.thisRevenue)}</td>
                    <td style={{ padding: '10px 16px' }}>
                      {c.revenueChange !== null ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 700, color: c.revenueChange >= 0 ? '#16a34a' : '#dc2626', background: c.revenueChange >= 0 ? '#f0fdf4' : '#fef2f2', padding: '2px 8px', borderRadius: 20 }}>
                          {c.revenueChange >= 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
                          {Math.abs(c.revenueChange)}%
                        </span>
                      ) : <span style={{ fontSize: 11, color: '#9ca3af' }}>New</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 800, color: BRAND, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quick Actions</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            { to: '/app/entry',    label: '➕ New Entry',      hot: 'N', primary: true },
            { to: '/app/import',   label: '📥 Import',          hot: 'I' },
            { to: '/app/daily',    label: '📋 Daily Sheet',     hot: 'D' },
            { to: '/app/all',      label: '📦 All Shipments',   hot: 'A' },
            { to: '/app/track',    label: '🔍 Track',           hot: 'T' },
            { to: '/app/pending',  label: '⏳ Pending' },
            { to: '/app/invoices', label: '🧾 Invoices' },
            { to: '/app/ndr',      label: '⚠️ NDR' },
          ].map(({ to, label, hot, primary }) => (
            <Link key={to} to={to} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px',
              background: primary ? ORANGE : '#f9fafb',
              color: primary ? '#fff' : '#374151',
              border: `1px solid ${primary ? ORANGE : '#e5e7eb'}`,
              borderRadius: 10, textDecoration: 'none',
              fontSize: 13, fontWeight: 700,
              boxShadow: primary ? '0 2px 8px rgba(232,88,10,0.25)' : 'none',
            }}>
              {label}
              {hot && <kbd style={{ fontSize: 9, opacity: 0.6, background: primary ? 'rgba(255,255,255,0.2)' : '#e5e7eb', borderRadius: 4, padding: '1px 5px', fontFamily: 'monospace' }}>{hot}</kbd>}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Pinned Clients ── */}
      {pinned.length > 0 && clients.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Star size={16} color="#f59e0b" fill="#f59e0b" />
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: BRAND, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pinned Clients</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
            {clients.filter(c => pinned.includes(c.code)).map(c => (
              <Link key={c.code} to={`/app/all?client=${c.code}`} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '14px 10px', background: '#f9fafb',
                border: '1px solid #e5e7eb', borderRadius: 12,
                textDecoration: 'none', textAlign: 'center',
                transition: 'all 0.15s',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: BRAND, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, marginBottom: 8 }}>
                  {c.code?.[0]}
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: BRAND, marginBottom: 2 }}>{c.company}</span>
                <span style={{ fontSize: 10, color: '#9ca3af' }}>{c.code}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {lastUpdated && (
        <p style={{ fontSize: 11, color: '#d1d5db', textAlign: 'right', marginTop: 16 }}>
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}