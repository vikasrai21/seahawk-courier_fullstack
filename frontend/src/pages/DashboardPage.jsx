import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  RefreshCw, Package, CheckCircle, Clock, AlertTriangle,
  Bell, Star, ArrowUp, ArrowDown, Activity, Users,
  Truck, BarChart2, MapPin, Zap, TrendingUp, ChevronRight,
  RotateCcw, IndianRupee, Box, Target, Award
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, LineChart, Line, PieChart, Pie, Legend, CartesianGrid,
  AreaChart, Area
} from 'recharts';
import api from '../services/api';
import { PageLoader } from '../components/ui/Loading';
import { useAuth } from '../context/AuthContext';

/* ── Formatters ────────────────────────────────────────────────────────── */
const fmt    = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const fmtNum = n => Number(n || 0).toLocaleString('en-IN');
const fmtPct = n => `${Number(n || 0).toFixed(1)}%`;

/* ── Design tokens ─────────────────────────────────────────────────────── */
const T = {
  bg:        'var(--shk-bg, #0a0f1a)',
  surface:   'var(--shk-surface, #111827)',
  surfaceHi: 'var(--shk-surface-hi, #1a2236)',
  border:    'var(--shk-border, #1f2d45)',
  borderHi:  'var(--shk-border-hi, #2d4060)',
  orange:    'var(--shk-orange, #f97316)',
  orangeDim: '#7c3410',
  blue:      'var(--shk-blue, #3b82f6)',
  green:     'var(--shk-green, #22c55e)',
  red:       'var(--shk-red, #ef4444)',
  yellow:    'var(--shk-yellow, #eab308)',
  purple:    'var(--shk-purple, #a855f7)',
  text:      'var(--shk-text, #f1f5f9)',
  textMid:   'var(--shk-text-mid, #94a3b8)',
  textDim:   'var(--shk-text-dim, #475569)',
  navy:      '#0b1f3a',
};

const CHART_COLORS = [T.orange, T.blue, T.purple, '#06b6d4', T.green, '#f59e0b', T.red, '#ec4899'];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/* ── CSS injected once ─────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;0,9..40,900;1,9..40,300&display=swap');

  .shk-dashboard * { box-sizing: border-box; }

  .shk-card {
    background: ${T.surface};
    border: 1px solid ${T.border};
    border-radius: 16px;
    transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
  }
  .shk-card:hover {
    border-color: ${T.borderHi};
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  }

  .shk-kpi:hover {
    transform: translateY(-2px);
  }

  .shk-btn-primary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 9px 18px;
    background: ${T.orange};
    color: #fff;
    border: none; border-radius: 10px;
    font-size: 13px; font-weight: 700;
    cursor: pointer; text-decoration: none;
    box-shadow: 0 0 24px rgba(249,115,22,0.35);
    transition: box-shadow 0.2s, transform 0.15s;
    font-family: inherit;
  }
  .shk-btn-primary:hover {
    box-shadow: 0 0 36px rgba(249,115,22,0.55);
    transform: translateY(-1px);
  }

  .shk-btn-ghost {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 9px 14px;
    background: transparent;
    color: ${T.textMid};
    border: 1px solid ${T.border}; border-radius: 10px;
    font-size: 13px; font-weight: 600;
    cursor: pointer; text-decoration: none;
    transition: border-color 0.2s, color 0.2s, background 0.2s;
    font-family: inherit;
  }
  .shk-btn-ghost:hover {
    border-color: ${T.borderHi};
    color: ${T.text};
    background: ${T.surfaceHi};
  }

  .shk-quick-action {
    display: flex; align-items: center; gap: 8px;
    padding: 9px 14px;
    background: ${T.surfaceHi};
    color: ${T.textMid};
    border: 1px solid ${T.border}; border-radius: 10px;
    font-size: 13px; font-weight: 600;
    cursor: pointer; text-decoration: none;
    transition: all 0.15s;
  }
  .shk-quick-action:hover {
    border-color: ${T.orange};
    color: ${T.text};
    background: rgba(249,115,22,0.08);
  }

  .shk-table-row:hover td {
    background: ${T.surfaceHi};
  }

  .shk-activity-item {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid ${T.border};
    transition: background 0.15s;
  }
  .shk-activity-item:last-child { border-bottom: none; }

  .shk-bar-fill {
    height: 6px;
    border-radius: 6px;
    background: linear-gradient(90deg, ${T.orange}, #fb923c);
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .shk-pulse {
    animation: shkPulse 2s ease-in-out infinite;
  }
  @keyframes shkPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .shk-fade-in {
    animation: shkFadeIn 0.4s ease forwards;
  }
  @keyframes shkFadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .shk-tooltip {
    background: ${T.surfaceHi} !important;
    border: 1px solid ${T.border} !important;
    border-radius: 10px !important;
    color: ${T.text} !important;
    font-size: 12px !important;
    font-family: 'DM Sans', sans-serif !important;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5) !important;
  }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: ${T.borderHi}; }
`;

/* ── Section header ─────────────────────────────────────────────────────── */
function SectionHead({ icon: Icon, label, action, actionTo }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(249,115,22,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={14} color={T.orange} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'Space Mono', monospace" }}>
          {label}
        </span>
      </div>
      {action && actionTo && (
        <Link to={actionTo} style={{ fontSize: 11, color: T.orange, textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2, opacity: 0.8 }}>
          {action} <ChevronRight size={11} />
        </Link>
      )}
    </div>
  );
}

/* ── KPI Card ───────────────────────────────────────────────────────────── */
function KpiCard({ label, value, sub, icon, accent, trend }) {
  const up = trend >= 0;
  return (
    <div className="shk-card shk-kpi shk-fade-in" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
      {/* Glow accent top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accent || T.orange, borderRadius: '16px 16px 0 0' }} />
      {/* Background icon watermark */}
      <div style={{ position: 'absolute', right: -8, bottom: -8, fontSize: 64, opacity: 0.04, userSelect: 'none', lineHeight: 1 }}>{icon}</div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accent || T.orange}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
          {icon}
        </div>
        {trend !== undefined && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            fontSize: 11, fontWeight: 700,
            color: up ? T.green : T.red,
            background: up ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            padding: '3px 8px', borderRadius: 20,
          }}>
            {up ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: T.text, letterSpacing: '-1px', lineHeight: 1, fontFamily: "'Space Mono', monospace" }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: T.textMid, marginTop: 5, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

/* ── Status Distribution Ring ───────────────────────────────────────────── */
function StatusRing({ stats }) {
  const delivered  = stats?.delivered  || 0;
  const inTransit  = stats?.inTransit  || 0;
  const pending    = stats?.pending    || 0;
  const rto        = stats?.rto        || 0;
  const total      = delivered + inTransit + pending + rto || 1;

  const data = [
    { name: 'Delivered',  value: delivered,  color: T.green  },
    { name: 'In Transit', value: inTransit,  color: T.blue   },
    { name: 'Pending',    value: pending,    color: T.yellow },
    { name: 'RTO',        value: rto,        color: T.red    },
  ].filter(d => d.value > 0);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="shk-tooltip" style={{ padding: '8px 12px' }}>
        <div style={{ color: d.color, fontWeight: 700 }}>{d.name}</div>
        <div style={{ color: T.text }}>{fmtNum(d.value)} shipments</div>
        <div style={{ color: T.textMid }}>{((d.value / total) * 100).toFixed(1)}%</div>
      </div>
    );
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data} cx="50%" cy="50%"
            innerRadius={60} outerRadius={85}
            paddingAngle={3} dataKey="value"
            stroke="none"
          >
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div style={{ position: 'relative', marginTop: -110, marginBottom: 90, textAlign: 'center', pointerEvents: 'none' }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: T.text, fontFamily: "'Space Mono', monospace" }}>{fmtNum(total)}</div>
        <div style={{ fontSize: 10, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.1em' }}>today</div>
      </div>
      {/* Legend */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {data.map(d => (
          <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: T.surfaceHi, borderRadius: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color, flexShrink: 0, boxShadow: `0 0 6px ${d.color}` }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, fontFamily: "'Space Mono', monospace" }}>{fmtNum(d.value)}</div>
              <div style={{ fontSize: 10, color: T.textDim }}>{d.name}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Courier Performance ────────────────────────────────────────────────── */
function CourierPerformance({ data = [] }) {
  if (!data.length) return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: T.textDim }}>
      <Truck size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
      <p style={{ fontSize: 12, margin: 0 }}>No courier data yet</p>
    </div>
  );
  const max = Math.max(...data.map(d => d.value || 0), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {data.map((d, i) => (
        <div key={d.name}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: CHART_COLORS[i % CHART_COLORS.length], boxShadow: `0 0 6px ${CHART_COLORS[i % CHART_COLORS.length]}` }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: T.textMid }}>{d.name}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, color: T.text, fontFamily: "'Space Mono', monospace" }}>{d.value}</span>
          </div>
          <div style={{ height: 5, background: T.surfaceHi, borderRadius: 6, overflow: 'hidden' }}>
            <div className="shk-bar-fill" style={{ width: `${(d.value / max) * 100}%`, background: `linear-gradient(90deg, ${CHART_COLORS[i % CHART_COLORS.length]}, ${CHART_COLORS[i % CHART_COLORS.length]}88)` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Custom Chart Tooltip ───────────────────────────────────────────────── */
const DarkTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="shk-tooltip" style={{ padding: '10px 14px' }}>
      {label && <div style={{ fontSize: 11, color: T.textDim, marginBottom: 6 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color || p.fill }} />
          <span style={{ color: T.text, fontWeight: 700 }}>
            {formatter ? formatter(p.value) : fmtNum(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

/* ── Top Clients ────────────────────────────────────────────────────────── */
function ClientLeaderboard({ clients = [], pinned = [], onPin }) {
  if (!clients.length) return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: T.textDim }}>
      <Users size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
      <p style={{ fontSize: 12, margin: 0 }}>No client data yet</p>
    </div>
  );
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {clients.slice(0, 7).map((c, i) => (
        <div key={c.code} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: i < clients.length - 1 ? `1px solid ${T.border}` : 'none' }}>
          <span style={{ fontSize: i < 3 ? 16 : 13, width: 24, textAlign: 'center', color: i < 3 ? T.text : T.textDim, fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>
            {i < 3 ? medals[i] : i + 1}
          </span>
          <div style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            background: `linear-gradient(135deg, ${T.orange}33, ${T.blue}33)`,
            border: `1px solid ${T.border}`,
            color: T.text,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800,
          }}>
            {(c.company || c.code)?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {c.company || c.code}
            </div>
            <div style={{ fontSize: 11, color: T.textDim }}>{fmtNum(c.count || 0)} shipments</div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: T.orange, fontFamily: "'Space Mono', monospace" }}>{fmt(c.revenue || 0)}</div>
            <button onClick={() => onPin?.(c.code)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0 0', color: pinned.includes(c.code) ? '#f59e0b' : T.textDim }}>
              <Star size={11} fill={pinned.includes(c.code) ? '#f59e0b' : 'none'} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Activity Feed ──────────────────────────────────────────────────────── */
function ActivityFeed({ activity = [] }) {
  const getIcon = (action) => {
    if (action === 'CREATE')        return { emoji: '➕', color: T.green };
    if (action === 'STATUS_CHANGE') return { emoji: '🔄', color: T.blue };
    if (action === 'DELETE')        return { emoji: '🗑️', color: T.red };
    if (action === 'LOGIN')         return { emoji: '🔐', color: T.purple };
    return { emoji: '✏️', color: T.yellow };
  };

  if (!activity.length) return (
    <div style={{ textAlign: 'center', padding: '40px 0', color: T.textDim }}>
      <Activity size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
      <p style={{ fontSize: 12, margin: 0 }}>No recent activity</p>
    </div>
  );

  return (
    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
      {activity.map((a, i) => {
        const { emoji, color } = getIcon(a.action);
        return (
          <div key={a.id || i} className="shk-activity-item">
            <div style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0, background: `${color}15`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
              {emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 12, color: T.textMid, margin: 0, lineHeight: 1.5 }}>
                <strong style={{ color: T.text }}>{a.user || 'System'}</strong>{' '}
                <span style={{ color: T.textDim }}>{a.action === 'CREATE' ? 'created' : a.action === 'STATUS_CHANGE' ? 'updated status of' : a.action === 'LOGIN' ? 'logged in' : 'modified'}</span>{' '}
                {a.entityId && <span style={{ fontFamily: "'Space Mono', monospace", color: T.orange, fontSize: 11 }}>{a.entityId}</span>}
              </p>
              <p style={{ fontSize: 10, color: T.textDim, margin: '3px 0 0', fontFamily: "'Space Mono', monospace" }}>
                {a.time ? new Date(a.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── MoM Comparison Table ───────────────────────────────────────────────── */
function MoMTable({ comparison }) {
  if (!comparison?.clients?.length) return null;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>
            {['Client', 'This Month', 'Last Month', 'Δ Shipments', 'Revenue', 'Δ Revenue'].map(h => (
              <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap', fontFamily: "'Space Mono', monospace" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {comparison.clients.slice(0, 8).map((c, i) => (
            <tr key={c.code} className="shk-table-row" style={{ borderBottom: `1px solid ${T.border}` }}>
              <td style={{ padding: '11px 14px' }}>
                <div style={{ fontWeight: 700, color: T.text }}>{c.company}</div>
                <div style={{ fontSize: 10, color: T.textDim, fontFamily: "'Space Mono', monospace" }}>{c.code}</div>
              </td>
              <td style={{ padding: '11px 14px', fontWeight: 800, color: T.text, fontFamily: "'Space Mono', monospace" }}>{fmtNum(c.thisCount)}</td>
              <td style={{ padding: '11px 14px', color: T.textDim, fontFamily: "'Space Mono', monospace" }}>{fmtNum(c.lastCount)}</td>
              <td style={{ padding: '11px 14px' }}>
                {c.countChange !== null ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: c.countChange >= 0 ? T.green : T.red, background: c.countChange >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: 20 }}>
                    {c.countChange >= 0 ? <ArrowUp size={9} /> : <ArrowDown size={9} />}
                    {Math.abs(c.countChange)}%
                  </span>
                ) : <span style={{ fontSize: 10, color: T.textDim, background: T.surfaceHi, padding: '2px 8px', borderRadius: 20 }}>New</span>}
              </td>
              <td style={{ padding: '11px 14px', fontWeight: 800, color: T.orange, fontFamily: "'Space Mono', monospace" }}>{fmt(c.thisRevenue)}</td>
              <td style={{ padding: '11px 14px' }}>
                {c.revenueChange !== null ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: c.revenueChange >= 0 ? T.green : T.red, background: c.revenueChange >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: 20 }}>
                    {c.revenueChange >= 0 ? <ArrowUp size={9} /> : <ArrowDown size={9} />}
                    {Math.abs(c.revenueChange)}%
                  </span>
                ) : <span style={{ fontSize: 10, color: T.textDim, background: T.surfaceHi, padding: '2px 8px', borderRadius: 20 }}>New</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Main Dashboard ─────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { user, isAdmin, hasRole } = useAuth();
  const navigate = useNavigate();

  const [stats,       setStats]       = useState(null);
  const [actions,     setActions]     = useState(null);
  const [rtoAlerts,   setRtoAlerts]   = useState([]);
  const [activity,    setActivity]    = useState([]);
  const [clients,     setClients]     = useState([]);
  const [profit,      setProfit]      = useState(null);
  const [comparison,  setComparison]  = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [pinned,      setPinned]      = useState(() => {
    try { return JSON.parse(localStorage.getItem('pinnedClients') || '[]'); } catch { return []; }
  });

  const togglePin = (code) => {
    const next = pinned.includes(code) ? pinned.filter(c => c !== code) : [...pinned, code].slice(0, 6);
    setPinned(next);
    localStorage.setItem('pinnedClients', JSON.stringify(next));
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const calls = [
        api.get('/shipments/stats/today'),
        api.get('/ops/pending-actions'),
        api.get('/ops/recent-activity?limit=10'),
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
    .slice(0, 7)
    .map(c => ({ ...c, revenue: c.walletBalance || 0, count: 0 }));

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  const deliveryRate = stats?.total
    ? ((stats.delivered / stats.total) * 100).toFixed(1)
    : 0;

  return (
    <>
      {/* Inject global styles once */}
      <style>{GLOBAL_CSS}</style>

      <div className="shk-dashboard" style={{
        padding: '24px',
        maxWidth: 1440,
        margin: '0 auto',
        fontFamily: "'DM Sans', -apple-system, sans-serif",
        color: T.text,
        minHeight: '100vh',
      }}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <img 
                src="/images/logo.png" 
                alt="Sea Hawk Logo" 
                style={{ 
                  height: 48, 
                  width: 'auto', 
                  objectFit: 'contain',
                  background: '#fff',
                  borderRadius: 6,
                  padding: 2
                }} 
              />
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 900, color: T.text, margin: 0, letterSpacing: '-0.5px' }}>
                  {getGreeting()}, <span style={{ color: T.orange }}>{user?.name?.split(' ')[0]}</span>
                </h1>
                <p style={{ fontSize: 12, color: T.textDim, margin: 0, fontFamily: "'Space Mono', monospace" }}>{today}</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {lastUpdated && (
              <span style={{ fontSize: 11, color: T.textDim, fontFamily: "'Space Mono', monospace", padding: '6px 12px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8 }}>
                ↻ {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <Link to="/app/entry" className="shk-btn-primary">
              ➕ New Entry
            </Link>
            <button onClick={load} className="shk-btn-ghost">
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>

        {/* ── Alert Banners ────────────────────────────────────────────── */}
        {rtoAlerts.length > 0 && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: `1px solid rgba(239,68,68,0.25)`, borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <AlertTriangle size={15} color={T.red} />
            <span style={{ fontSize: 13, fontWeight: 700, color: T.red }}>High RTO Alert:</span>
            {rtoAlerts.map(a => (
              <span key={a.courier} style={{ fontSize: 12, background: 'rgba(239,68,68,0.1)', border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 8, padding: '3px 10px', color: T.red, fontWeight: 700 }}>
                {a.courier} — {a.rate}% RTO
              </span>
            ))}
          </div>
        )}

        {actions?.total > 0 && (
          <div style={{ background: 'rgba(234,179,8,0.07)', border: `1px solid rgba(234,179,8,0.2)`, borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Bell size={15} color={T.yellow} />
            <span style={{ fontSize: 13, fontWeight: 700, color: T.yellow }}>{actions.total} items need attention</span>
            {actions.pendingNDRs > 0 && <Link to="/app/ndr" style={{ fontSize: 12, background: 'rgba(234,179,8,0.1)', border: `1px solid rgba(234,179,8,0.2)`, borderRadius: 8, padding: '3px 10px', color: T.yellow, fontWeight: 700, textDecoration: 'none' }}>⚠️ {actions.pendingNDRs} NDRs</Link>}
            {actions.draftInvoices > 0 && <Link to="/app/invoices" style={{ fontSize: 12, background: 'rgba(234,179,8,0.1)', border: `1px solid rgba(234,179,8,0.2)`, borderRadius: 8, padding: '3px 10px', color: T.yellow, fontWeight: 700, textDecoration: 'none' }}>🧾 {actions.draftInvoices} Invoices</Link>}
            {actions.todayPickups > 0 && <Link to="/app/pickups" style={{ fontSize: 12, background: 'rgba(234,179,8,0.1)', border: `1px solid rgba(234,179,8,0.2)`, borderRadius: 8, padding: '3px 10px', color: T.yellow, fontWeight: 700, textDecoration: 'none' }}>📦 {actions.todayPickups} Pickups</Link>}
            {actions.rtoShipments > 0 && <Link to="/app/all?status=RTO" style={{ fontSize: 12, background: 'rgba(234,179,8,0.1)', border: `1px solid rgba(234,179,8,0.2)`, borderRadius: 8, padding: '3px 10px', color: T.yellow, fontWeight: 700, textDecoration: 'none' }}>↩️ {actions.rtoShipments} RTOs</Link>}
          </div>
        )}

        {/* ── KPI Row ──────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 14, marginBottom: 24 }}>
          <KpiCard label="Today's Shipments" value={fmtNum(stats?.total || 0)}                   icon="📦" accent={T.orange} />
          <KpiCard label="Delivered"          value={fmtNum(stats?.delivered || 0)}               icon="✅" accent={T.green} />
          <KpiCard label="In Transit"         value={fmtNum(stats?.inTransit || 0)}               icon="🚚" accent={T.blue} />
          <KpiCard label="Delivery Rate"      value={`${deliveryRate}%`}                          icon="🎯" accent={T.purple} />
          <KpiCard label="Today's Revenue"    value={fmt(stats?.amount || 0)}                     icon="💰" accent={T.orange} />
          <KpiCard label="Total Weight"       value={`${(stats?.weight || 0).toFixed(1)} kg`}    icon="⚖️" accent="#06b6d4" />
          {profit && <>
            <KpiCard label="30-day Revenue"   value={fmt(profit.totalRevenue || 0)}               icon="📈" accent={T.green} />
            <KpiCard label="Avg / Shipment"   value={fmt(profit.avgPerShipment || 0)}             icon="💹" accent={T.yellow} />
          </>}
        </div>

        {/* ── Row 1: Status Ring + Courier + Activity ───────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 20 }}>

          {/* Status Distribution */}
          <div className="shk-card" style={{ padding: 20 }}>
            <SectionHead icon={Target} label="Today's Status" />
            <StatusRing stats={stats} />
          </div>

          {/* Courier Performance */}
          <div className="shk-card" style={{ padding: 20 }}>
            <SectionHead icon={Truck} label="Courier Performance" />
            <CourierPerformance data={courierData} />
            {courierData.length > 0 && (
              <div style={{ marginTop: 20, height: 130 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={courierData} margin={{ top: 0, right: 0, left: -32, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: T.textDim }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: T.textDim }} axisLine={false} tickLine={false} />
                    <Tooltip content={<DarkTooltip />} />
                    <Bar dataKey="value" radius={[5,5,0,0]}>
                      {courierData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="shk-card" style={{ padding: 20 }}>
            <SectionHead icon={Activity} label="Live Activity" action="View all" actionTo="/app/audit" />
            <ActivityFeed activity={Array.isArray(activity) ? activity : []} />
          </div>
        </div>

        {/* ── Row 2: Revenue Chart + Top Clients ───────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>

          {/* Revenue by Courier */}
          {profit?.byCourier?.length > 0 ? (
            <div className="shk-card" style={{ padding: 20 }}>
              <SectionHead icon={TrendingUp} label="Revenue by Courier — 30 days" />
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={profit.byCourier} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={T.orange} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={T.orange} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="courier" tick={{ fontSize: 10, fill: T.textDim }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: T.textDim }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<DarkTooltip formatter={fmt} />} />
                  <Area type="monotone" dataKey="revenue" stroke={T.orange} strokeWidth={2} fill="url(#revGrad)" dot={{ fill: T.orange, r: 4, strokeWidth: 0 }} activeDot={{ r: 6, fill: T.orange }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            /* Placeholder chart with empty state */
            <div className="shk-card" style={{ padding: 20, display: 'flex', flexDirection: 'column' }}>
              <SectionHead icon={TrendingUp} label="Revenue Trend — 30 days" />
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: T.textDim, minHeight: 180 }}>
                <TrendingUp size={32} style={{ opacity: 0.2 }} />
                <p style={{ fontSize: 12, margin: 0 }}>Revenue data will appear here</p>
              </div>
            </div>
          )}

          {/* Top Clients */}
          <div className="shk-card" style={{ padding: 20 }}>
            <SectionHead icon={Award} label="Top Clients" action="View all" actionTo="/app/clients" />
            <ClientLeaderboard clients={topClients} pinned={pinned} onPin={togglePin} />
          </div>
        </div>

        {/* ── Row 3: MoM Table ─────────────────────────────────────── */}
        {comparison?.clients?.length > 0 && (
          <div className="shk-card" style={{ padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(249,115,22,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart2 size={14} color={T.orange} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: "'Space Mono', monospace" }}>
                  Client Month-over-Month
                </span>
                <span style={{ fontSize: 11, color: T.textDim, fontFamily: "'Space Mono', monospace" }}>
                  {comparison.lastMonth} → {comparison.thisMonth}
                </span>
              </div>
            </div>
            <MoMTable comparison={comparison} />
          </div>
        )}

        {/* ── Quick Actions ────────────────────────────────────────── */}
        <div className="shk-card" style={{ padding: 20, marginBottom: 20 }}>
          <SectionHead icon={Zap} label="Quick Actions" />
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
              <Link key={to} to={to} className={primary ? 'shk-btn-primary' : 'shk-quick-action'}>
                {label}
                {hot && (
                  <kbd style={{ fontSize: 9, opacity: 0.55, background: primary ? 'rgba(255,255,255,0.15)' : T.border, borderRadius: 4, padding: '1px 5px', fontFamily: "'Space Mono', monospace" }}>
                    {hot}
                  </kbd>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* ── Pinned Clients ───────────────────────────────────────── */}
        {pinned.length > 0 && clients.length > 0 && (
          <div className="shk-card" style={{ padding: 20 }}>
            <SectionHead icon={Star} label="Pinned Clients" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
              {clients.filter(c => pinned.includes(c.code)).map(c => (
                <Link key={c.code} to={`/app/all?client=${c.code}`} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '16px 10px',
                  background: T.surfaceHi,
                  border: `1px solid ${T.border}`,
                  borderRadius: 12,
                  textDecoration: 'none', textAlign: 'center',
                  transition: 'all 0.15s',
                }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: `linear-gradient(135deg, ${T.orange}33, ${T.blue}22)`, border: `1px solid ${T.border}`, color: T.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, marginBottom: 8 }}>
                    {c.code?.[0]}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 2 }}>{c.company}</span>
                  <span style={{ fontSize: 10, color: T.textDim, fontFamily: "'Space Mono', monospace" }}>{c.code}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>
    </>
  );
}
