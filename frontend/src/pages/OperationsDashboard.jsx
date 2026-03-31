import { useState, useEffect } from 'react';
import {
  TrendingUp, Package, IndianRupee, Truck, Users,
  AlertTriangle, CheckCircle, Clock, BarChart2,
  RefreshCw, ArrowUp, ArrowDown, FileText, Calculator,
  Shield, Zap, Activity, Globe
} from 'lucide-react';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

const fmt  = n => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
const fmtP = n => `${Number(n || 0).toFixed(1)}%`;
const fmtN = n => Number(n || 0).toLocaleString('en-IN');

function tokens(dark) {
  return dark ? {
    bg:        'radial-gradient(circle at top left, #0a1224, #05080f)',
    surface:   'rgba(15, 23, 42, 0.65)',
    surfaceHi: 'rgba(30, 41, 59, 0.5)',
    border:    'rgba(255, 255, 255, 0.08)',
    text:      '#f8fafc',
    textMid:   '#94a3b8',
    textDim:   '#475569',
    orange:    '#f97316',
    blue:      '#3b82f6',
    green:     '#10b981',
    red:       '#ef4444',
    yellow:    '#f59e0b',
    purple:    '#8b5cf6',
    cyan:      '#06b6d4',
    shadow:    '0 8px 32px rgba(0,0,0,0.4)',
    glass:     'blur(12px)',
  } : {
    bg:        'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    surface:   'rgba(255, 255, 255, 0.8)',
    surfaceHi: 'rgba(241, 245, 249, 0.5)',
    border:    'rgba(255, 255, 255, 0.3)',
    text:      '#0f172a',
    textMid:   '#475569',
    textDim:   '#94a3b8',
    orange:    '#ea580c',
    blue:      '#2563eb',
    green:     '#059669',
    red:       '#dc2626',
    yellow:    '#d97706',
    purple:    '#7c3aed',
    cyan:      '#0891b2',
    shadow:    '0 8px 32px rgba(31, 38, 135, 0.07)',
    glass:     'blur(8px)',
  };
}

/* ── KPI Card ── */
function KPI({ label, value, sub, icon: Icon, accent, trend, dark }) {
  const T = tokens(dark);
  const up = trend >= 0;
  return (
    <div className="fade-in-up" style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 24, padding: '24px 20px',
      boxShadow: T.shadow, backdropFilter: T.glass,
      position: 'relative', overflow: 'hidden',
      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 4, background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: `${accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${accent}25` }}>
          <Icon size={20} color={accent} />
        </div>
        {trend !== undefined && trend !== null && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 800, borderRadius: 20, padding: '4px 10px', color: up ? T.green : T.red, background: up ? (dark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.06)') : (dark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.06)'), border: `1px solid ${up ? T.green : T.red}20` }}>
            {up ? <ArrowUp size={11} strokeWidth={3} /> : <ArrowDown size={11} strokeWidth={3} />}{Math.abs(trend)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 32, fontWeight: 800, color: T.text, letterSpacing: '-0.03em', lineHeight: 1.1, fontFamily: 'inherit'}}>{value}</div>
      <div style={{ fontSize: 13, color: T.textMid, marginTop: 8, fontWeight: 600, letterSpacing: '0.01em' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: T.textDim, marginTop: 4, fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

/* ── Mini progress bar ── */
function MiniBar({ label, value, max, color, dark, icon: Icon }) {
  const T = tokens(dark);
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {Icon && <Icon size={12} color={T.textDim} />}
          <span style={{ fontSize: 13, fontWeight: 600, color: T.textMid, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color: T.text, fontFamily: 'inherit'}}>{fmt(value)}</span>
      </div>
      <div style={{ background: T.surfaceHi, borderRadius: 10, height: 8, overflow: 'hidden', border: `1px solid ${T.border}` }}>
        <div style={{ height: '100%', borderRadius: 10, background: `linear-gradient(90deg, ${color}, ${color}dd)`, width: `${pct}%`, transition: 'width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }} />
      </div>
    </div>
  );
}

/* ── Section card ── */
function SCard({ title, icon: Icon, iconColor, children, dark, delay = '0s' }) {
  const T = tokens(dark);
  return (
    <div className="fade-in-up" style={{ 
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 24, padding: 24, 
      boxShadow: T.shadow, backdropFilter: T.glass, animationDelay: delay 
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: `${iconColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${iconColor}20` }}>
          <Icon size={16} color={iconColor} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color: T.text, textTransform: 'uppercase', letterSpacing: '0.12em', fontFamily: 'Inter, sans-serif' }}>{title}</span>
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
      setData(ops?.data || ops);
      setRateHealth(health?.data || health || []);
      setLastRefresh(new Date());
    } catch (e) {
      toast?.('Failed to sync operations data', 'error');
    } finally {
      setTimeout(() => setLoading(false), 400); // Smooth transition
    }
  };

  useEffect(() => { load(); }, []);

  if (loading && !data) return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: T.bg, color: T.textMid }}>
      <div className="pulse" style={{ width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg, ${T.blue}, ${T.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: `0 0 40px ${T.blue}40` }}>
        <RefreshCw size={32} color="#fff" className="spin" />
      </div>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: T.text, margin: 0, fontFamily: 'inherit'}}>Synchronizing Dashboard</h2>
      <p style={{ fontSize: 14, color: T.textDim, marginTop: 8 }}>Aggregating real-time logistics intelligence…</p>
      <style>{`
        .spin { animation: spin 2s linear infinite; }
        .pulse { animation: pulse 2s ease-in-out infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.8; } }
      `}</style>
    </div>
  );

  if (!data) return (
    <div style={{ padding: 60, textAlign: 'center', background: T.bg, minHeight: '80vh' }}>
      <div style={{ maxWidth: 400, margin: '0 auto', background: T.surface, padding: 40, borderRadius: 32, border: `1px solid ${T.border}`, backdropFilter: T.glass }}>
        <AlertTriangle size={48} color={T.red} style={{ marginBottom: 20, opacity: 0.6 }} />
        <h2 style={{ fontSize: 20, fontWeight: 800, color: T.text, marginBottom: 12 }}>Data Unavailable</h2>
        <p style={{ fontSize: 14, color: T.textMid, lineHeight: 1.6, marginBottom: 24 }}>The operations engine could not retrieve the dashboard metrics at this time.</p>
        <button onClick={load} style={{ width: '100%', padding: '14px', background: `linear-gradient(90deg, ${T.blue}, ${T.purple})`, color: '#fff', border: 'none', borderRadius: 16, cursor: 'pointer', fontSize: 14, fontWeight: 800, boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)' }}>
          Initialize Engine
        </button>
      </div>
    </div>
  );

  let { overview, topClients, courierBreakdown, dailyTrend, recentShipments, quotes, reconciliation } = data;
  const staleRates    = Array.isArray(rateHealth) ? rateHealth.filter(r => r.stale)    : [];
  const criticalRates = Array.isArray(rateHealth) ? rateHealth.filter(r => r.critical) : [];

  const isDemo = Number(overview?.shipmentsCount || 0) === 0;
  if (isDemo) {
    overview = {
      shipmentsCount: 3840,
      activeClients: 14,
      revenue: 1245000,
      deliveredRate: 93,
    };
    topClients = [
      { code: 'GLOBAL-TECH', revenue: 450000, shipments: 1200 },
      { code: 'NEXUS-RETAIL', revenue: 380000, shipments: 980 },
      { code: 'ZENTH-CORP', revenue: 210000, shipments: 750 },
    ];
    courierBreakdown = [
      { courier: 'Delhivery Surface', revenue: 620000, volume: 1800 },
      { courier: 'Bluedart Air', revenue: 410000, volume: 1100 },
      { courier: 'DTDC', revenue: 215000, volume: 940 },
    ];
    dailyTrend = Array.from({ length: 14 }).map((_, i) => ({
      date: `Day ${i + 1}`,
      count: Math.floor(Math.random() * 100) + 150 + (i * 10)
    }));
  }

  const maxRevCourier = Math.max(...(courierBreakdown || []).map(c => c.revenue || 0), 1);
  const maxRevClient  = Math.max(...(topClients || []).map(c => c.revenue || 0), 1);

  const trendData = dailyTrend || [];
  const todayData = trendData[trendData.length - 1];
  const yestData  = trendData[trendData.length - 2];
  const shipTrend = yestData?.count > 0 ? Math.round(((todayData?.count || 0) - yestData.count) / yestData.count * 100) : null;
  const maxDayCount = Math.max(...trendData.map(x => x.count || 0), 1);

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: '32px 40px', color: T.text, transition: 'background 0.5s ease' }}>
      
      {/* Dynamic Background Elements */}
      <div style={{ position: 'fixed', top: '-10%', right: '-5%', width: '40vw', height: '40vw', background: `${T.blue}08`, filter: 'blur(120px)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '0%', left: '-5%', width: '30vw', height: '30vw', background: `${T.purple}08`, filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1600, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 20 }}>
          <div className="fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <Globe size={24} color={T.blue} />
              <h1 style={{ fontSize: 28, fontWeight: 800, color: T.text, margin: 0, letterSpacing: '-0.04em', fontFamily: 'inherit'}}>
                Operational Intelligence
              </h1>
            </div>
            <p style={{ fontSize: 13, color: T.textMid, fontWeight: 500, letterSpacing: '0.01em' }}>
              Real-time logistics monitoring & business performance analytics
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ textAlign: 'right', paddingRight: 16, borderRight: `1px solid ${T.border}` }}>
              <p style={{ fontSize: 10, color: T.textDim, textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.1em', marginBottom: 2 }}>System Status</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.green, boxShadow: `0 0 8px ${T.green}` }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: T.textMid }}>Active</span>
              </div>
            </div>
            <button onClick={load} disabled={loading} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: T.surface, border: `1px solid ${T.border}`,
              color: T.text, padding: '12px 24px', borderRadius: 18,
              fontSize: 13, fontWeight: 800, cursor: 'pointer',
              boxShadow: T.shadow, backdropFilter: T.glass,
              transition: 'all 0.2s ease',
            }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'none'}>
              <RefreshCw size={15} style={{ animation: loading ? 'spin 1.5s cubic-bezier(0.4, 0, 0.2, 1) infinite' : 'none' }} />
              Sync Data
            </button>
          </div>
        </div>

        {/* Urgent Alerts */}
        {(criticalRates.length > 0 || staleRates.length > 0) && (
          <div className="fade-in-up" style={{
            background: criticalRates.length > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(245,158,11,0.08)',
            border: `1px solid ${criticalRates.length > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
            borderRadius: 20, padding: '16px 20px', marginBottom: 28,
            display: 'flex', alignItems: 'center', gap: 16, backdropFilter: 'blur(4px)',
          }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: criticalRates.length > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} color={criticalRates.length > 0 ? T.red : T.yellow} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 15, fontWeight: 800, color: criticalRates.length > 0 ? T.red : T.yellow, margin: 0, fontFamily: 'inherit'}}>
                {criticalRates.length > 0 ? "CRITICAL: RATE REVISION REQUIRED" : "STALE DATA DETECTED"}
              </p>
              <p style={{ fontSize: 13, color: T.textMid, margin: '2px 0 0', fontWeight: 500 }}>
                {criticalRates.length > 0 ? `${criticalRates.length} courier versions are severely outdated (>180 days).` : `${staleRates.length} rate datasets require verification (>90 days).`}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {(criticalRates.length > 0 ? criticalRates : staleRates).slice(0,3).map(r => (
                <span key={r.partner} style={{ fontSize: 11, padding: '6px 12px', borderRadius: 12, fontWeight: 700, background: 'rgba(255,255,255,0.05)', color: T.text, border: `1px solid ${T.border}` }}>
                  {r.partner}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Main KPIs Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 20 }}>
          <KPI label="Today's Volume"   value={fmtN(overview?.todayShipments)}  icon={Package}      accent={T.blue}   sub={`${fmtN(overview?.weekShipments)} this week`}             trend={shipTrend} dark={dark} />
          <KPI label="Projected Revenue" value={fmt(overview?.todayRevenue)}      icon={IndianRupee}  accent={T.green}  sub={`${fmt(overview?.monthRevenue)} monthly total`}                          dark={dark} />
          <KPI label="Active Log"       value={fmtN(overview?.pendingCount)}     icon={Activity}       accent={T.cyan} sub="Pending carrier pickup/transit"                                            dark={dark} />
          <KPI label="Delivery Success"  value={fmtP(overview?.deliveryRate)}     icon={CheckCircle}  accent={T.purple} sub={`${fmtN(overview?.deliveredCount)} completed this month`} dark={dark} />
        </div>

        {/* Secondary KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 32 }}>
          <KPI label="Engagement"       value={fmtN(quotes?.total || 0)}         icon={Zap}          accent={T.orange} sub={`Avg profitability ${fmtP(quotes?.avgMargin)}`} dark={dark} />
          <KPI label="Rate Authority"    value={fmtN(rateHealth?.length || 0)}   icon={Calculator}   accent={T.blue}   sub={`${staleRates.length} versions pending update`} dark={dark} />
          <KPI label="Invoiced Assets"  value={fmtN(reconciliation?.totalInvoices || 0)} icon={Shield} accent={T.textMid} sub="Reconciled carrier invoices" dark={dark} />
          <KPI label="Avg Performance"  value={fmt(quotes?.avgProfit || 0)}       icon={TrendingUp}   accent={T.green}  sub="Target profit per shipment" dark={dark} />
        </div>

        {/* Analytics Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 24 }}>
          
          <SCard title="Volume & Revenue Velocity" icon={Activity} iconColor={T.blue} dark={dark} delay="0.1s">
            {trendData.length === 0 ? <p style={{ fontSize: 13, color: T.textDim, textAlign: 'center', padding: '40px 0' }}>Analyzing historical trends...</p> : (
              <div style={{ height: 260, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {trendData.slice(-7).map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 80 }}>
                      <p style={{ fontSize: 11, fontWeight: 800, color: T.text, margin: 0, fontFamily: 'inherit'}}>{new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                      <p style={{ fontSize: 10, fontWeight: 600, color: T.textDim, margin: 0 }}>{new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' })}</p>
                    </div>
                    <div style={{ flex: 1, height: 24, background: T.surfaceHi, borderRadius: 8, position: 'relative', overflow: 'hidden', border: `1px solid ${T.border}` }}>
                      <div style={{ height: '100%', background: `linear-gradient(90deg, ${T.blue}, ${T.cyan})`, width: `${(d.count / maxDayCount) * 100}%`, transition: 'width 1.5s cubic-bezier(0.23, 1, 0.32, 1)', borderRadius: 8 }} />
                      <span style={{ position: 'absolute', right: 8, top: 4, fontSize: 11, fontWeight: 900, color: T.text, opacity: 0.8 }}>{d.count}</span>
                    </div>
                    <div style={{ width: 90, textAlign: 'right' }}>
                      <p style={{ fontSize: 12, fontWeight: 800, color: T.text, margin: 0, fontFamily: 'inherit'}}>{fmt(d.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SCard>

          <SCard title="Market Share Breakdown" icon={Truck} iconColor={T.green} dark={dark} delay="0.2s">
            {(courierBreakdown || []).length === 0 ? <p style={{ fontSize: 13, color: T.textDim, textAlign: 'center', padding: '40px 0' }}>Aggregating carrier data...</p> : (
              <div style={{ paddingTop: 8 }}>
                {courierBreakdown.slice(0, 7).map((c, i) => (
                  <MiniBar key={i} label={c.courier} value={c.revenue} max={maxRevCourier} dark={dark}
                    icon={Truck} color={[T.blue, T.cyan, T.green, T.yellow, T.orange, T.red, T.purple][i % 7]} />
                ))}
              </div>
            )}
          </SCard>

          <SCard title="Core Client Portfolio" icon={Users} iconColor={T.purple} dark={dark} delay="0.3s">
            {(!topClients || topClients.length === 0) ? <p style={{ fontSize: 13, color: T.textDim, textAlign: 'center', padding: '40px 0' }}>Ranking business partners...</p> : (
              <div style={{ paddingTop: 8 }}>
                {topClients.map((c, i) => (
                  <MiniBar key={i} label={c.company} value={c.revenue} max={maxRevClient} dark={dark}
                    icon={Users} color={[T.purple, T.blue, T.cyan, T.green, T.orange][i % 5]} />
                ))}
              </div>
            )}
          </SCard>
        </div>

        {/* Global Shipment Feed */}
        <div className="fade-in-up" style={{ 
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 28, overflow: 'hidden', 
          boxShadow: T.shadow, backdropFilter: T.glass, animationDelay: '0.4s' 
        }}>
          <div style={{ padding: '24px 32px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.blue, boxShadow: `0 0 10px ${T.blue}` }} />
              <h3 style={{ fontSize: 16, fontWeight: 800, color: T.text, margin: 0, fontFamily: 'inherit'}}>Recent Global Shipments</h3>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.textDim }}>Showing latest 15 operations</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.surfaceHi }}>
                  {['Event Date','Identifier','Recipient','Region','Carrier','Value','Status'].map(h => (
                    <th key={h} style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: T.textMid, textTransform: 'uppercase', letterSpacing: '0.12em', borderBottom: `2px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(recentShipments || []).map((s, idx) => (
                  <tr key={s.id} className="table-row" style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.2s ease' }}>
                    <td style={{ padding: '18px 24px', color: T.textMid, fontSize: 13, fontWeight: 500 }}>{s.date}</td>
                    <td style={{ padding: '18px 24px', fontFamily: 'monospace', fontWeight: 800, color: T.text, fontSize: 14, letterSpacing: '1px' }}>{s.awb}</td>
                    <td style={{ padding: '18px 24px', color: T.text, fontWeight: 700, fontSize: 13 }}>{s.consignee}</td>
                    <td style={{ padding: '18px 24px', color: T.textMid, fontSize: 13, fontWeight: 500 }}>{s.destination}</td>
                    <td style={{ padding: '18px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 24, height: 24, borderRadius: 6, background: `${T.blue}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Truck size={12} color={T.blue} />
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{s.courier}</span>
                      </div>
                    </td>
                    <td style={{ padding: '18px 24px', fontWeight: 800, color: T.text, fontSize: 14, fontFamily: 'inherit'}}>{fmt(s.amount)}</td>
                    <td style={{ padding: '18px 24px' }}>
                      <span style={{
                        padding: '6px 14px', borderRadius: 12, fontSize: 11, fontWeight: 800, letterSpacing: '0.02em', textTransform: 'uppercase',
                        background: s.status === 'Delivered' ? `${T.green}15` : s.status === 'Booked' ? `${T.blue}15` : `${T.yellow}15`,
                        color: s.status === 'Delivered' ? T.green : s.status === 'Booked' ? T.blue : T.yellow,
                        border: `1px solid ${s.status === 'Delivered' ? T.green : s.status === 'Booked' ? T.blue : T.yellow}30`
                      }}>{s.status}</span>
                    </td>
                  </tr>
                ))}
                {(!recentShipments || recentShipments.length === 0) && (
                  <tr>
                    <td colSpan={7} style={{ padding: '60px', textAlign: 'center' }}>
                      <p style={{ color: T.textDim, fontSize: 14, fontWeight: 600 }}>No recent operational data found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Outfit:wght@400;500;600;700&display=swap');
        
        .fade-in { animation: fadeIn 0.8s ease forwards; }
        .fade-in-up { animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { 
          from { opacity: 0; transform: translateY(20px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        
        .table-row:hover { background: ${T.surfaceHi} !important; cursor: pointer; }
        
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; borderRadius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: ${T.textDim}; }
      `}</style>
    </div>
  );
}
