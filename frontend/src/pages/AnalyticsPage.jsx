import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  TrendingUp, 
  Package, 
  CheckCircle2, 
  RotateCcw, 
  RefreshCw, 
  Award, 
  LayoutGrid, 
  List, 
  BarChart3, 
  PieChart as PieIcon,
  Zap,
  Target,
  ArrowRight
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend,
  AreaChart,
  Area
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import KPI from '../components/dashboard/KPI';
import DashboardAlerts from '../components/dashboard/DashboardAlerts';
import CarrierMatchmaker from '../components/analytics/CarrierMatchmaker';
import { PageHeader } from '../components/ui/PageHeader';
import { CourierBadge } from '../components/ui/CourierBadge';

const fmt    = n => `₹${Number(n||0).toLocaleString('en-IN')}`;
const fmtPct = n => `${Number(n||0).toFixed(1)}%`;

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#6366f1', '#ec4899'];

const PERIODS = [
  { label:'Today',    days:0  },
  { label:'7d',   days:7  },
  { label:'30d',  days:30 },
  { label:'90d',  days:90 },
  { label:'1Y',   days:365},
  { label:'All', days:-1 },
];

function dateRange(days) {
  if (days < 0) return {};
  const to   = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return {
    dateFrom: from.toISOString().split('T')[0],
    dateTo:   to.toISOString().split('T')[0],
  };
}

// Premium Tooltip Component
function CustomTooltip({ active, payload, label, suffix = '', isCurrency = false }) {
  if (active && payload?.length) {
    return (
      <div className="rounded-[20px] border border-slate-200 bg-white/90 p-4 shadow-2xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90 animate-in fade-in zoom-in duration-200">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 border-b border-slate-100 dark:border-slate-800 pb-2">{label}</p>
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-8 mb-1 last:mb-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{entry.name}</span>
            <span className="text-sm font-black" style={{ color: entry.color }}>
              {isCurrency ? fmt(entry.value) : entry.value.toLocaleString('en-IN')}{suffix}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function AnalyticsPage({ toast }) {
  const { isOwner } = useAuth();
  const [period,    setPeriod]    = useState(30);
  const [overview,  setOverview]  = useState(null);
  const [couriers,  setCouriers]  = useState([]);
  const [monthly,   setMonthly]   = useState([]);
  const [ndr,       setNdr]       = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [density,   setDensity]   = useState(() => localStorage.getItem('sh-density') || 'Normal');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(dateRange(period));
      const [r1, r2, r3, r4] = await Promise.all([
        api.get(`/analytics/overview?${params}`),
        api.get(`/analytics/couriers?${params}`),
        api.get('/analytics/monthly'),
        api.get('/analytics/ndr'),
      ]);
      setOverview(r1.data);
      setCouriers(r2.data?.carriers || r2.data || []);
      setMonthly(r3.data?.months || r3.data || []);
      setNdr(r4.data);
    } catch(e) { toast?.(e.message, 'error'); }
    finally { setLoading(false); }
  }, [period, toast]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    localStorage.setItem('sh-density', density);
  }, [density]);

  const kpis = overview?.kpis;

  // Intelligence: Revenue Projection Logic
  const projectionData = useMemo(() => {
    if (!monthly || monthly.length === 0) return [];
    const lastMonth = monthly[monthly.length - 1];
    const prevMonth = monthly[monthly.length - 2] || lastMonth;
    const growth = prevMonth.revenue ? (lastMonth.revenue / prevMonth.revenue) : 1;
    
    return monthly.map((m, i) => {
      const item = { ...m };
      if (i === monthly.length - 1) {
        item.projected = Math.round(m.revenue * growth);
      }
      return item;
    });
  }, [monthly]);

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-8 min-h-screen">
      <PageHeader
        title="Performance Analytics"
        subtitle="Real-time courier benchmarking and logistics efficiency intel"
        icon={Target}
        actions={
          <div className="flex items-center gap-3">
            {/* Density Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
              <button 
                onClick={() => setDensity('Normal')} 
                className={`p-2 rounded-xl transition-all ${density === 'Normal' ? 'bg-white dark:bg-slate-800 text-blue-500 shadow-sm' : 'text-slate-400'}`}
              >
                <LayoutGrid size={16} />
              </button>
              <button 
                onClick={() => setDensity('Compact')} 
                className={`p-2 rounded-xl transition-all ${density === 'Compact' ? 'bg-white dark:bg-slate-800 text-blue-500 shadow-sm' : 'text-slate-400'}`}
              >
                <List size={16} />
              </button>
            </div>

            {/* Period Selector */}
            <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
              {PERIODS.map(p => (
                <button 
                  key={p.days}
                  onClick={() => setPeriod(p.days)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    period === p.days ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button 
              onClick={load} 
              className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:text-blue-500 hover:border-blue-500 transition-all active:scale-90"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Processing Analytics Node</p>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* KPI Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI label="Global Volume" value={kpis?.totalShipments?.toLocaleString() || '0'} icon={Package} accent="#3b82f6" sub={`${PERIODS.find(p=>p.days===period)?.label} performance`} dark={true} />
            <KPI label="Success Ratio" value={`${kpis?.deliveryRate || '0'}%`} icon={CheckCircle2} accent="#10b981" sub="Across all carriers" dark={true} />
            <KPI label="Return Velocity" value={`${kpis?.rtoRate || '0'}%`} icon={RotateCcw} accent="#ef4444" sub="Risk corridor monitoring" dark={true} />
            {isOwner && <KPI label="Realized Revenue" value={fmt(kpis?.totalRevenue || 0)} icon={TrendingUp} accent="#f59e0b" sub="Gross logistics income" dark={true} />}
          </div>

          {/* AI Intelligence Layer */}
          <CarrierMatchmaker couriers={couriers} />

          {/* Primary Visualization Layer */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Long-term Performance Trend */}
            <div className="lg:col-span-2 rounded-[32px] border border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none mb-1">Growth Intelligence</h3>
                    <p className="text-xs font-bold text-slate-500">Monthly scale & financial velocity</p>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={projectionData}>
                  <defs>
                    <linearGradient id="areaBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="areaAmber" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="areaPurple" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#f1f5f9" strokeDasharray="10 10" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} dy={10} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} />
                  {isOwner && <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} />}
                  <Tooltip content={<CustomTooltip isCurrency={isOwner} />} />
                  <Legend wrapperStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '20px' }} />
                  <Area yAxisId="left" type="monotone" dataKey="shipments" name="Volume" stroke="#3b82f6" strokeWidth={3} fill="url(#areaBlue)" animationDuration={1500} />
                  {isOwner && <Area yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" stroke="#f59e0b" strokeWidth={3} fill="url(#areaAmber)" animationDuration={1500} />}
                  {isOwner && <Area yAxisId="right" type="monotone" dataKey="projected" name="Target Forecast" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" fill="url(#areaPurple)" animationDuration={2000} />}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Status Heatmap */}
            <div className="rounded-[32px] border border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-8 shadow-sm relative overflow-hidden">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <PieIcon size={20} />
                </div>
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none mb-1">Status Mix</h3>
                  <p className="text-xs font-bold text-slate-500">Operational distribution</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie 
                    data={overview?.byStatus} 
                    dataKey="count" 
                    nameKey="status" 
                    innerRadius={65} 
                    outerRadius={90} 
                    paddingAngle={6} 
                    stroke="none"
                    animationDuration={1500}
                  >
                    {overview?.byStatus?.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-6 grid grid-cols-2 gap-3">
                 {overview?.byStatus?.slice(0, 4).map((s, i) => (
                   <div key={s.status} className="flex flex-col p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 truncate">{s.status}</span>
                      </div>
                      <span className="text-sm font-black text-slate-800 dark:text-white tabular-nums">{s.count.toLocaleString()}</span>
                   </div>
                 ))}
              </div>
            </div>
          </div>

          {/* Carrier Performance Ledger */}
          <div className="rounded-[32px] border border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Award size={20} />
                </div>
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none mb-1">Carrier Benchmark</h3>
                  <p className="text-xs font-bold text-slate-500">Multidimensional contractor performance</p>
                </div>
              </div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-4 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
                {couriers.length} Carriers Identified
              </div>
            </div>

            <div className={`table-shell overflow-visible ${density === 'Compact' ? 'density-compact' : ''}`}>
              <table className="tbl w-full border-collapse">
                <thead className="table-head">
                  <tr>
                    <th className="text-left p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Carrier Entity</th>
                    <th className="text-right p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Volume</th>
                    <th className="text-right p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Success %</th>
                    <th className="text-right p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">RTO Rate</th>
                    <th className="text-right p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg TAT</th>
                    {isOwner && <th className="text-right p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue</th>}
                    <th className="text-right p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {couriers.map((c, i) => {
                    const rate = c.deliveryRate || (c.delivered && c.total ? (c.delivered/c.total*100) : 0);
                    const isHealthy = rate >= 90;
                    return (
                      <tr key={c.carrier || i} className="table-row group">
                        <td className="p-4">
                          <CourierBadge name={c.carrier || c.courier} />
                        </td>
                        <td className="p-4 text-right">
                          <div className="text-sm font-black text-slate-800 dark:text-white tabular-nums">{(c.total || c.count).toLocaleString()}</div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Requests</div>
                        </td>
                        <td className="p-4 text-right">
                          <div className={`text-sm font-black tabular-nums ${isHealthy ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {fmtPct(rate)}
                          </div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Efficiency</div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="text-sm font-black text-rose-500 tabular-nums">{c.rto || 0}</div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Returns</div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="text-sm font-black text-slate-700 dark:text-slate-300 tabular-nums">
                            {c.avgDeliveryDays ? `${c.avgDeliveryDays.toFixed(1)}d` : '—'}
                          </div>
                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Lead Time</div>
                        </td>
                        {isOwner && (
                          <td className="p-4 text-right">
                            <div className="text-sm font-black text-blue-600 tabular-nums">{fmt(c.revenue || c.totalRevenue || 0)}</div>
                            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Billed</div>
                          </td>
                        )}
                        <td className="p-4 text-right">
                          <div className={`w-2 h-2 rounded-full inline-block ${isHealthy ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* NDR Analysis Node */}
          {ndr?.byReason?.length > 0 && (
            <div className="rounded-[32px] border border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                  <Zap size={20} />
                </div>
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none mb-1">Failure Intelligence</h3>
                  <p className="text-xs font-bold text-slate-500">Primary delivery rejection drivers</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={ndr.byReason} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid stroke="#f1f5f9" strokeDasharray="10 10" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="reason" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b', textTransform: 'uppercase' }} width={180} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(239,68,68,0.05)', radius: 4 }} />
                  <Bar dataKey="count" fill="#ef4444" radius={[0, 8, 8, 0]} name="Occurrences" barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      <style>{`
        .density-compact .table-row { height: 44px !important; }
        .density-compact .p-4 { padding: 6px 16px !important; }
        .density-compact .CourierBadge { transform: scale(0.85); transform-origin: left; }
      `}</style>
    </div>
  );
}
