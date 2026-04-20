import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, Package, IndianRupee, Truck, Users,
  CheckCircle, CheckCircle2, ShieldAlert, Activity,
  RefreshCw, Zap, Shield, Calculator
} from 'lucide-react';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

// Modular Dashboard Components
import KPI from '../components/dashboard/KPI';
import SCard from '../components/dashboard/SCard';
import MiniBar from '../components/dashboard/MiniBar';
import VolumeAreaChart from '../components/dashboard/VolumeAreaChart';
import CourierPieChart from '../components/dashboard/CourierPieChart';

import DashboardAlerts from '../components/dashboard/DashboardAlerts';
import PulseFeed from '../components/dashboard/PulseFeed';
import { useNavigate } from 'react-router-dom';

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
    blue:      '#3b82f6',
    green:     '#10b981',
    red:       '#ef4444',
    purple:    '#8b5cf6',
    orange:    '#f97316',
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
    blue:      '#2563eb',
    green:     '#059669',
    red:       '#dc2626',
    purple:    '#7c3aed',
    orange:    '#ea580c',
    cyan:      '#0891b2',
    shadow:    '0 8px 32px rgba(31, 38, 135, 0.07)',
    glass:     'blur(8px)',
  };
}

export default function OperationsDashboard({ toast }) {
  const { isOwner } = useAuth();
  const { dark } = useTheme();
  const T = tokens(dark);
  const { socket, connected } = useSocket();
  const navigate = useNavigate();

  const [data,        setData]        = useState(null);
  const [rateHealth,  setRateHealth]  = useState([]);
  const [loading,     setLoading]     = useState(true);

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [ops, health] = await Promise.all([
        api.get('/ops/dashboard'),
        api.get('/rates/health'),
      ]);
      setData(ops?.data || ops);
      setRateHealth(health?.data || health || []);
    } catch (e) {
      toast?.('Transmission Failed: Logistics Node Offline', 'error');
    } finally {
      if (showLoading) setTimeout(() => setLoading(false), 400);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  // Real-time synchronization
  useEffect(() => {
    if (!socket) return;
    
    const handleUpdate = () => {
      load(false); // Refresh silently
    };

    socket.on('SHIPMENT_CREATED', handleUpdate);
    socket.on('STATUS_UPDATED', handleUpdate);
    socket.on('WALLET_UPDATED', handleUpdate);

    return () => {
      socket.off('SHIPMENT_CREATED', handleUpdate);
      socket.off('STATUS_UPDATED', handleUpdate);
      socket.off('WALLET_UPDATED', handleUpdate);
    };
  }, [socket, load]);

  if (loading && !data) return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: T.bg, color: T.textMid }}>
      <div className="pulse" style={{ width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg, ${T.blue}, ${T.purple})`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: `0 0 50px ${T.blue}40` }}>
        <RefreshCw size={32} color="#fff" className="spin" />
      </div>
      <h2 style={{ fontSize: 20, fontWeight: 900, color: T.text, margin: 0, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Reconstructing Intelligence</h2>
      <p style={{ fontSize: 13, color: T.textDim, marginTop: 10, fontWeight: 500 }}>Syncing global operational metrics...</p>
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
      <div style={{ maxWidth: 440, margin: '0 auto', background: T.surface, padding: 48, borderRadius: 36, border: `1px solid ${T.border}`, backdropFilter: T.glass, boxShadow: T.shadow }}>
        <ShieldAlert size={56} color={T.red} style={{ marginBottom: 24, opacity: 0.8 }} />
        <h2 style={{ fontSize: 22, fontWeight: 900, color: T.text, marginBottom: 12, letterSpacing: '-0.02em' }}>Intelligence Offline</h2>
        <p style={{ fontSize: 14, color: T.textMid, lineHeight: 1.6, marginBottom: 32 }}>The logistics engine failed to aggregate real-time data. Check your network connection.</p>
        <button onClick={() => load()} style={{ width: '100%', padding: '16px', background: `linear-gradient(135deg, ${T.blue}, ${T.purple})`, color: '#fff', border: 'none', borderRadius: 20, cursor: 'pointer', fontSize: 14, fontBlack: 900, textTransform: 'uppercase', letterSpacing: '0.1em', boxShadow: `0 10px 30px ${T.blue}40` }}>
          Reinitialize Engine
        </button>
      </div>
    </div>
  );

  const { overview, actions, courierBreakdown, dailyTrend, recentShipments, topClients, quotes, reconciliation } = data;
  const staleRates    = Array.isArray(rateHealth) ? rateHealth.filter(r => r.stale)    : [];
  const rtoAlerts     = (courierBreakdown || []).filter(c => c.rtoRate > 15).sort((a,b) => b.rtoRate - a.rtoRate);

  const maxRevClient  = Math.max(...(topClients || []).map(c => c.revenue || 0), 1);
  const trendData     = dailyTrend || [];
  const todayData     = trendData[trendData.length - 1];
  const yestData      = trendData[trendData.length - 2];
  const shipTrend     = yestData?.count > 0 ? Math.round(((todayData?.count || 0) - yestData.count) / yestData.count * 100) : null;

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: '32px 40px', color: T.text, transition: 'background 0.5s ease' }}>
      
      {/* Background Orbs */}
      <div style={{ position: 'fixed', top: '-10%', right: '-5%', width: '40vw', height: '40vw', background: `${T.blue}08`, filter: 'blur(120px)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '0%', left: '-5%', width: '30vw', height: '30vw', background: `${T.purple}08`, filter: 'blur(100px)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 1600, margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 20 }}>
          <div className="fade-in">
            <h1 style={{ fontSize: 32, fontWeight: 900, color: T.text, margin: 0, letterSpacing: '-0.05em', marginBottom: 4 }}>
              Operational Intelligence
            </h1>
            <p style={{ fontSize: 13, color: T.textDim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              Real-time System Status • {connected ? 'Online' : 'Offline'}
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={() => load()} disabled={loading} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: T.surface, border: `1px solid ${T.border}`,
              color: T.text, padding: '14px 28px', borderRadius: 22,
              fontSize: 12, fontWeight: 900, cursor: 'pointer',
              textTransform: 'uppercase', letterSpacing: '0.1em',
              boxShadow: T.shadow, backdropFilter: T.glass,
              transition: 'all 0.3s ease',
            }}>
              <RefreshCw size={15} style={{ animation: loading ? 'spin 1.5s linear infinite' : 'none' }} className={loading ? '' : 'refresh-icon'} />
              Sync Engine
            </button>
          </div>
        </div>

        {/* Neural Pulse News Feed */}
        <PulseFeed data={data} isOwner={isOwner} />

        {/* Actionable Notifications Panel */}
        <DashboardAlerts 
          actions={actions} 
          rtoAlerts={rtoAlerts} 
          navigate={navigate} 
        />


        {/* Primary KPIs Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 20 }}>
          <KPI label="Today's Volume"   value={fmtN(overview?.todayShipments)}  icon={Package}      accent={T.blue}   sub={`${fmtN(overview?.weekShipments)} this week`}             trend={shipTrend} dark={dark} />
          {isOwner && <KPI label="Projected Revenue" value={fmt(overview?.todayRevenue)}      icon={IndianRupee}  accent={T.green}  sub={`${fmt(overview?.monthRevenue)} monthly total`}                          dark={dark} />}
          <KPI label="Active Log"       value={fmtN(overview?.pendingCount)}     icon={Activity}       accent={T.cyan}   sub="Pending carrier pickup/transit"                                            dark={dark} />
          <KPI label="Delivery Success"  value={fmtP(overview?.deliveryRate)}     icon={CheckCircle2 || CheckCircle}  accent={T.purple} sub={`${fmtN(overview?.deliveredCount)} completed this month`} dark={dark} />
        </div>

        {/* Analytics Section with Recharts */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 32 }}>
          
          <SCard title={isOwner ? "Volume & Revenue Velocity" : "Shipment Volume Trend"} icon={TrendingUp} iconColor={T.blue} dark={dark} delay="0.1s">
            {trendData.length === 0 ? <p style={{ fontSize: 13, color: T.textDim, textAlign: 'center', padding: '40px 0' }}>Analyzing historical trends...</p> : (
              <VolumeAreaChart data={trendData} dark={dark} hideRevenue={!isOwner} />
            )}
          </SCard>

          <SCard title="Market Share Breakdown" icon={Truck} iconColor={T.green} dark={dark} delay="0.2s">
            {(courierBreakdown || []).length === 0 ? <p style={{ fontSize: 13, color: T.textDim, textAlign: 'center', padding: '40px 0' }}>Aggregating carrier data...</p> : (
              <CourierPieChart data={courierBreakdown} dark={dark} />
            )}
          </SCard>

          <SCard title="Core Client Portfolio" icon={Users} iconColor={T.purple} dark={dark} delay="0.3s">
            {(!topClients || topClients.length === 0) ? <p style={{ fontSize: 13, color: T.textDim, textAlign: 'center', padding: '40px 0' }}>Ranking business partners...</p> : (
              <div style={{ paddingTop: 8 }}>
                {topClients.map((c, i) => (
                  <MiniBar key={i} label={c.company} value={isOwner ? c.revenue : c.count} max={isOwner ? maxRevClient : Math.max(...topClients.map(x => x.count), 1)} dark={dark}
                    icon={isOwner ? IndianRupee : Package} color={[T.purple, T.blue, T.cyan, T.green][i % 4]} 
                    suffix={isOwner ? "" : " units"} />
                ))}
              </div>
            )}
          </SCard>
        </div>

        {/* Global Operational Feed */}
        <div className="fade-in-up" style={{ 
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 28, overflow: 'hidden', 
          boxShadow: T.shadow, backdropFilter: T.glass, animationDelay: '0.4s' 
        }}>
          <div style={{ padding: '24px 32px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: T.blue, boxShadow: `0 0 10px ${T.blue}` }} />
              <h3 style={{ fontSize: 16, fontWeight: 800, color: T.text, margin: 0 }}>Global Operational Feed</h3>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: T.textDim }}>Latest 15 operational events</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: T.surfaceHi }}>
                  {['Date','AWB','Consignee','Destination','Courier',isOwner ? 'Value' : 'Weight','Status'].map(h => (
                    <th key={h} style={{ padding: '16px 24px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: T.textMid, textTransform: 'uppercase', letterSpacing: '0.12em', borderBottom: `2px solid ${T.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(recentShipments || []).map((s) => (
                  <tr key={s.id} className="table-row" style={{ borderBottom: `1px solid ${T.border}`, transition: 'background 0.2s ease' }}>
                    <td style={{ padding: '18px 24px', color: T.textMid, fontSize: 13 }}>{s.date}</td>
                    <td style={{ padding: '18px 24px', fontFamily: 'monospace', fontWeight: 800, color: T.text, fontSize: 14 }}>{s.awb}</td>
                    <td style={{ padding: '18px 24px', color: T.text, fontWeight: 700, fontSize: 13 }}>{s.consignee}</td>
                    <td style={{ padding: '18px 24px', color: T.textMid, fontSize: 13 }}>{s.destination}</td>
                    <td style={{ padding: '18px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Truck size={14} color={T.blue} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{s.courier}</span>
                      </div>
                    </td>
                    <td style={{ padding: '18px 24px', fontWeight: 800, color: T.text, fontSize: 14 }}>
                      {isOwner ? fmt(s.amount) : `${s.weight || 0} kg`}
                    </td>
                    <td style={{ padding: '18px 24px' }}>
                      <span style={{
                        padding: '6px 14px', borderRadius: 12, fontSize: 11, fontWeight: 800, 
                        background: s.status === 'Delivered' ? `${T.green}15` : s.status === 'Booked' ? `${T.blue}15` : `${T.yellow}15`,
                        color: s.status === 'Delivered' ? T.green : s.status === 'Booked' ? T.blue : T.yellow,
                        border: `1px solid ${s.status === 'Delivered' ? T.green : s.status === 'Booked' ? T.blue : T.yellow}30`
                      }}>{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Additional Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginTop: 24, marginBottom: 40 }}>
           <KPI label="Quotes Finalized" value={fmtN(quotes?.total || 0)} icon={Zap} accent={T.orange} sub={isOwner ? `Avg profitability ${fmtP(quotes?.avgMargin)}` : "Registered Quotes"} dark={dark} />
           <KPI label="Invoiced Assets" value={fmtN(reconciliation?.totalInvoices || 0)} icon={Shield} accent={T.textMid} sub="Matched carrier invoices" dark={dark} />
           {isOwner && <KPI label="Avg Performance" value={fmt(quotes?.avgProfit || 0)} icon={TrendingUp} accent={T.green} sub="Target profit per shipment" dark={dark} />}
           <KPI label="Rate Authority" value={fmtN(rateHealth?.length || 0)} icon={Calculator} accent={T.blue} sub={`${staleRates.length} versions pending update`} dark={dark} />
        </div>

      </div>

      <style>{`
        .fade-in { animation: fadeIn 0.8s ease forwards; }
        .fade-in-up { animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { 
          from { opacity: 0; transform: translateY(20px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        .table-row:hover { background: ${T.surfaceHi} !important; cursor: pointer; }
        .spin { animation: spin 2s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
