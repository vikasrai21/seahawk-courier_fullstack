import { useState, useEffect } from 'react';
import {
  TrendingUp, Package, IndianRupee, Truck, Users,
  AlertTriangle, CheckCircle, Clock, BarChart2,
  RefreshCw, ArrowUp, ArrowDown, FileText, Calculator,
  Shield, Zap, Activity
} from 'lucide-react';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

const fmt  = n => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
const fmtP = n => `${Number(n || 0).toFixed(1)}%`;
const fmtN = n => Number(n || 0).toLocaleString('en-IN');

function tokens(dark) {
  return dark ? {
    bg:        '#080d18',
    surface:   '#0f1724',
    surfaceHi: '#141e2e',
    border:    '#1a2840',
    text:      '#f0f4ff',
    textMid:   '#8899b8',
    textDim:   '#3d5070',
    orange:    '#f97316',
    blue:      '#3b82f6',
    green:     '#22c55e',
    red:       '#ef4444',
    yellow:    '#f59e0b',
    purple:    '#a855f7',
    shadow:    '0 2px 12px rgba(0,0,0,0.4)',
  } : {
    bg:        '#f0f3fa',
    surface:   '#ffffff',
    surfaceHi: '#f5f8ff',
    border:    '#dde4f0',
    text:      '#0f172a',
    textMid:   '#4a5878',
    textDim:   '#94a3b8',
    orange:    '#ea6c0a',
    blue:      '#2563eb',
    green:     '#16a34a',
    red:       '#dc2626',
    yellow:    '#d97706',
    purple:    '#9333ea',
    shadow:    '0 2px 12px rgba(15,23,42,0.07)',
  };
}

/* ── KPI Card ── */
function KPI({ label, value, sub, icon: Icon, accent, trend, dark }) {
  const T = tokens(dark);
  const up = trend >= 0;
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 16, padding: '18px 16px',
      boxShadow: T.shadow, position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accent, borderRadius: '16px 16px 0 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={17} color={accent} />
        </div>
        {trend !== undefined && trend !== null && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '3px 8px', color: up ? T.green : T.red, background: up ? (dark ? 'rgba(34,197,94,0.1)' : 'rgba(22,163,74,0.08)') : (dark ? 'rgba(239,68,68,0.1)' : 'rgba(220,38,38,0.08)') }}>
            {up ? <ArrowUp size={9} /> : <ArrowDown size={9} />}{Math.abs(trend)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: T.text, letterSpacing: '-0.5px', lineHeight: 1, fontFamily: 'Syne, sans-serif' }}>{value}</div>
      <div style={{ fontSize: 12, color: T.textMid, marginTop: 5, fontWeight: 500 }}>{label}</div>
      {sub && <div style={{ fontSize: 10, color: T.textDim, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

/* ── Mini progress bar ── */
function MiniBar({ label, value, max, color, dark }) {
  const T = tokens(dark);
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <span style={{ fontSize: 11, color: T.textMid, width: 110, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, background: T.surfaceHi, borderRadius: 6, height: 6, overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 6, background: color, width: `${pct}%`, transition: 'width 0.8s ease' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: T.text, width: 70, textAlign: 'right', flexShrink: 0 }}>{fmt(value)}</span>
    </div>
  );
}

/* ── Section card ── */
function SCard({ title, icon: Icon, iconColor, children, dark }) {
  const T = tokens(dark);
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20, boxShadow: T.shadow }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${iconColor}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={13} color={iconColor} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

export default function OperationsDashboard({ toast }) {
  const { dark } = useTheme();
  const T = tokens(dark);

  const [data,        setData]        = useState(null);
  const [rateHealth,  setRateHealth]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [ops, health] = await Promise.all([
        api.get('/ops/dashboard'),
        api.get('/rates/health'),
      ]);
      // api.js interceptor already unwraps response.data → so ops = { success, data, ... }
      setData(ops?.data || ops);
      setRateHealth(health?.data || health || []);
      setLastRefresh(new Date());
    } catch (e) {
      toast?.('Failed to load operations dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading && !data) return (
    <div style={{ padding: 40, textAlign: 'center', color: T.textDim }}>
      <RefreshCw size={28} style={{ margin: '0 auto 12px', animation: 'spin 1s linear infinite', display: 'block', opacity: 0.5 }} />
      <p style={{ fontSize: 13 }}>Loading operations dashboard…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!data) return (
    <div style={{ padding: 40, textAlign: 'center', color: T.textDim }}>
      <AlertTriangle size={28} style={{ margin: '0 auto 12px', opacity: 0.4, display: 'block' }} />
      <p style={{ fontSize: 13 }}>No operations data available.</p>
      <button onClick={load} style={{ marginTop: 12, padding: '8px 16px', background: T.orange, color: '#fff', border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
        Try Again
      </button>
    </div>
  );

  const { overview, topCouriers, topClients, courierBreakdown, dailyTrend, recentShipments, quotes, reconciliation } = data;

  const staleRates    = Array.isArray(rateHealth) ? rateHealth.filter(r => r.stale)    : [];
  const criticalRates = Array.isArray(rateHealth) ? rateHealth.filter(r => r.critical) : [];

  const maxRevCourier = Math.max(...(courierBreakdown || []).map(c => c.revenue || 0), 1);
  const maxRevClient  = Math.max(...(topClients || []).map(c => c.revenue || 0), 1);

  const trendData = dailyTrend || [];
  const todayData = trendData[trendData.length - 1];
  const yestData  = trendData[trendData.length - 2];
  const shipTrend = yestData?.count > 0
    ? Math.round(((todayData?.count || 0) - yestData.count) / yestData.count * 100)
    : null;

  const maxDayCount = Math.max(...trendData.map(x => x.count || 0), 1);

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1480, margin: '0 auto', fontFamily: "'Outfit', sans-serif", color: T.text }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: T.text, margin: 0, letterSpacing: '-0.3px', fontFamily: 'Syne, sans-serif' }}>
            Operations Dashboard
          </h1>
          <p style={{ fontSize: 11, color: T.textDim, margin: '3px 0 0', fontFamily: 'monospace' }}>
            {lastRefresh && `Last refreshed ${lastRefresh.toLocaleTimeString('en-IN')}`}
          </p>
        </div>
        <button onClick={load} disabled={loading} style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: T.surface, border: `1px solid ${T.border}`,
          color: T.textMid, padding: '9px 16px', borderRadius: 11,
          fontSize: 12, fontWeight: 700, cursor: 'pointer',
          boxShadow: T.shadow, opacity: loading ? 0.6 : 1,
        }}>
          <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Alerts */}
      {(criticalRates.length > 0 || staleRates.length > 0) && (
        <div style={{
          background: criticalRates.length > 0 ? (dark ? 'rgba(239,68,68,0.08)' : 'rgba(220,38,38,0.05)') : (dark ? 'rgba(245,158,11,0.08)' : 'rgba(217,119,6,0.05)'),
          border: `1px solid ${criticalRates.length > 0 ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}`,
          borderRadius: 13, padding: '12px 16px', marginBottom: 20,
          display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap',
        }}>
          <AlertTriangle size={15} color={criticalRates.length > 0 ? T.red : T.yellow} style={{ marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: criticalRates.length > 0 ? T.red : T.yellow, margin: '0 0 6px' }}>
              {criticalRates.length > 0
                ? `⚠️ ${criticalRates.length} courier rate set(s) are over 6 months old`
                : `${staleRates.length} courier rate set(s) are over 90 days old`}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(criticalRates.length > 0 ? criticalRates : staleRates).map(r => (
                <span key={r.partner} style={{ fontSize: 10, padding: '2px 9px', borderRadius: 20, fontWeight: 700, background: criticalRates.length > 0 ? (dark ? 'rgba(239,68,68,0.15)' : 'rgba(220,38,38,0.1)') : (dark ? 'rgba(245,158,11,0.15)' : 'rgba(217,119,6,0.1)'), color: criticalRates.length > 0 ? T.red : T.yellow }}>
                  {r.partner} — {r.ageInDays}d old
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KPI Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 14 }}>
        <KPI label="Today's Shipments"   value={fmtN(overview?.todayShipments)}  icon={Package}      accent={T.blue}   sub={`${fmtN(overview?.weekShipments)} this week`}             trend={shipTrend} dark={dark} />
        <KPI label="Today's Revenue"     value={fmt(overview?.todayRevenue)}      icon={IndianRupee}  accent={T.green}  sub={`${fmt(overview?.monthRevenue)} this month`}                            dark={dark} />
        <KPI label="Pending Deliveries"  value={fmtN(overview?.pendingCount)}     icon={Clock}        accent={T.yellow} sub="Booked + In Transit"                                                     dark={dark} />
        <KPI label="Delivery Rate"       value={fmtP(overview?.deliveryRate)}     icon={CheckCircle}  accent={overview?.deliveryRate > 85 ? T.green : T.yellow} sub={`${fmtN(overview?.deliveredCount)} delivered this month`} dark={dark} />
      </div>

      {/* KPI Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
        <KPI label="Quotes Generated"    value={fmtN(quotes?.total || 0)}         icon={FileText}     accent={T.purple} sub={quotes ? `Avg margin ${fmtP(quotes.avgMargin)}` : 'No data'} dark={dark} />
        <KPI label="Avg Quote Profit"    value={fmt(quotes?.avgProfit || 0)}       icon={TrendingUp}   accent={T.green}  sub="Per shipment, all quotes"                                     dark={dark} />
        <KPI label="Rate Versions"       value={fmtN(Array.isArray(rateHealth) ? rateHealth.length : 0)} icon={Calculator} accent={staleRates.length > 0 ? T.yellow : T.green} sub={staleRates.length > 0 ? `${staleRates.length} stale` : 'All current'} dark={dark} />
        <KPI label="Reconciled Invoices" value={fmtN(reconciliation?.totalInvoices || 0)} icon={Shield} accent={T.textMid} sub="Partner invoices verified"                              dark={dark} />
      </div>

      {/* Mid section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 16 }}>

        {/* Daily trend */}
        <SCard title="Last 7 Days — Activity" icon={Activity} iconColor={T.blue} dark={dark}>
          {trendData.length === 0
            ? <p style={{ fontSize: 12, color: T.textDim }}>No data yet.</p>
            : trendData.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 10, color: T.textDim, width: 42, flexShrink: 0 }}>
                  {new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })}
                </span>
                <div style={{ flex: 1, background: T.surfaceHi, borderRadius: 6, height: 18, overflow: 'hidden', position: 'relative' }}>
                  <div style={{
                    height: '100%', borderRadius: 6,
                    background: `linear-gradient(90deg, ${T.blue}, ${T.blue}88)`,
                    width: `${Math.min((d.count / maxDayCount) * 100, 100)}%`,
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6,
                    transition: 'width 0.8s ease',
                  }}>
                    {d.count > 0 && <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>{d.count}</span>}
                  </div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: T.text, width: 64, textAlign: 'right', flexShrink: 0 }}>{fmt(d.revenue)}</span>
              </div>
            ))
          }
        </SCard>

        {/* Top couriers */}
        <SCard title="Top Couriers — This Month" icon={Truck} iconColor={T.green} dark={dark}>
          {(courierBreakdown || []).length === 0
            ? <p style={{ fontSize: 12, color: T.textDim }}>No data yet.</p>
            : (courierBreakdown || []).slice(0, 6).map((c, i) => (
              <MiniBar key={i} label={c.courier || 'Unknown'} value={c.revenue} max={maxRevCourier}
                color={[T.orange, T.blue, T.purple, T.cyan, T.green, T.yellow][i] || T.textDim} dark={dark} />
            ))
          }
        </SCard>

        {/* Top clients */}
        <SCard title="Top Clients — This Month" icon={Users} iconColor={T.purple} dark={dark}>
          {(topClients || []).length === 0
            ? <p style={{ fontSize: 12, color: T.textDim }}>No data yet.</p>
            : (topClients || []).map((c, i) => (
              <MiniBar key={i} label={c.company || c.code} value={c.revenue} max={maxRevClient}
                color={[T.purple, T.blue, T.cyan, T.green, T.yellow][i] || T.textDim} dark={dark} />
            ))
          }
        </SCard>
      </div>

      {/* Rate health table */}
      {Array.isArray(rateHealth) && rateHealth.length > 0 && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, overflow: 'hidden', marginBottom: 16, boxShadow: T.shadow }}>
          <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Rate Version Health</span>
            <span style={{ fontSize: 10, color: T.textDim }}>Stale = &gt;90 days · Critical = &gt;180 days</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
            {rateHealth.map(r => (
              <div key={r.partner} style={{
                padding: '14px 16px',
                borderRight: `1px solid ${T.border}`,
                borderBottom: `1px solid ${T.border}`,
                background: r.critical ? (dark ? 'rgba(239,68,68,0.06)' : 'rgba(220,38,38,0.04)') : r.stale ? (dark ? 'rgba(245,158,11,0.06)' : 'rgba(217,119,6,0.04)') : 'transparent',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: r.critical ? T.red : r.stale ? T.yellow : T.green, boxShadow: `0 0 6px ${r.critical ? T.red : r.stale ? T.yellow : T.green}` }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: T.text, textTransform: 'capitalize' }}>{r.partner}</span>
                </div>
                <p style={{ fontSize: 10, color: T.textDim, margin: '2px 0' }}>w.e.f. {r.label}</p>
                <p style={{ fontSize: 10, fontWeight: 700, color: r.critical ? T.red : r.stale ? T.yellow : T.green, margin: 0 }}>
                  {r.ageInDays}d {r.critical ? '⚠️ CRITICAL' : r.stale ? '⚠️ Stale' : '✓ OK'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent shipments table */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: T.shadow }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}` }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.textMid, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Recent Shipments — Last 7 Days</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: T.surfaceHi }}>
                {['Date','AWB','Consignee','Destination','Courier','Amount','Status'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textDim, textTransform: 'uppercase', letterSpacing: '0.07em', borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(recentShipments || []).map(s => (
                <tr key={s.id} style={{ borderBottom: `1px solid ${T.border}` }}
                  onMouseEnter={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = T.surfaceHi)}
                  onMouseLeave={e => Array.from(e.currentTarget.cells).forEach(td => td.style.background = 'transparent')}
                >
                  <td style={{ padding: '10px 14px', color: T.textDim }}>{s.date}</td>
                  <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700, color: T.text }}>{s.awb}</td>
                  <td style={{ padding: '10px 14px', color: T.text, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.consignee}</td>
                  <td style={{ padding: '10px 14px', color: T.textMid, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.destination}</td>
                  <td style={{ padding: '10px 14px', color: T.textMid }}>{s.courier}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 700, color: T.text }}>{fmt(s.amount)}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                      background: s.status === 'Delivered' ? (dark ? 'rgba(34,197,94,0.12)' : 'rgba(22,163,74,0.08)') : s.status === 'Booked' ? (dark ? 'rgba(59,130,246,0.12)' : 'rgba(37,99,235,0.08)') : (dark ? 'rgba(245,158,11,0.12)' : 'rgba(217,119,6,0.08)'),
                      color: s.status === 'Delivered' ? T.green : s.status === 'Booked' ? T.blue : T.yellow,
                    }}>{s.status}</span>
                  </td>
                </tr>
              ))}
              {(!recentShipments || !recentShipments.length) && (
                <tr>
                  <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: T.textDim, fontSize: 12 }}>No shipments found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Outfit:wght@400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
