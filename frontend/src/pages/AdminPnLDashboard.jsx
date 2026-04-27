import { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle, 
  Activity, 
  BarChart2, 
  PieChart as PieIcon,
  RefreshCw,
  Target
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  Legend, 
  LineChart, 
  Line
} from 'recharts';
import api from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import KPI from '../components/dashboard/KPI';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmtPct = (n) => `${Number(n || 0).toFixed(1)}%`;

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'];

const PERIODS = [
  { label: 'Today', days: 0 },
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: 'This Month', days: -2 }, // Custom handle in backend if needed
  { label: 'All', days: -1 }
];

function dateRange(days) {
  if (days < 0) return {};
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { dateFrom: from.toISOString().split('T')[0], dateTo: to.toISOString().split('T')[0] };
}

// Premium Admin Tooltip
function AdminTooltip({ active, payload, label }) {
  if (active && payload?.length) {
    return (
      <div className="rounded-[20px] border border-slate-800 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in duration-200">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 border-b border-slate-800 pb-2">
          {label}
        </p>
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-8 mb-1.5 last:mb-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{entry.name}</span>
            <span className="text-sm font-black" style={{ color: entry.color || '#fff' }}>
              {entry.name.includes('%') || entry.name.includes('Margin') ? fmtPct(entry.value) : fmt(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function AdminPnLDashboard({ toast }) {
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(dateRange(period));
      const r = await api.get(`/ops/profit-summary?${params}`);
      setData(r.data);
    } catch (e) {
      toast?.(e.message || 'Failed to load P&L data', 'error');
    } finally {
      setLoading(false);
    }
  }, [period, toast]);

  useEffect(() => { load(); }, [load]);

  const isProfitable = (data?.marginPct || 0) > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-blue-500 mb-2">
              <Activity size={18} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Executive Control Room</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Real-Time P&L</h1>
            <p className="text-sm font-medium text-slate-400 mt-1">Live margin calculations and cost arbitrage</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-slate-800">
              {PERIODS.map(p => (
                <button
                  key={p.label}
                  onClick={() => setPeriod(p.days)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    period === p.days ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button onClick={load} className="p-2.5 rounded-2xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-blue-500 hover:border-blue-500 transition-all active:scale-90">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Aggregating Financials</p>
          </div>
        ) : data ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Primary KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/50 border border-slate-800 rounded-[24px] p-6 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/10 blur-[50px] group-hover:bg-blue-500/20 transition-all duration-700" />
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400"><DollarSign size={16} /></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Gross Billed (Sell)</span>
                </div>
                <div className="text-3xl font-black text-white tabular-nums relative z-10">{fmt(data.totalRevenue)}</div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-[24px] p-6 relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-32 h-32 bg-rose-500/10 blur-[50px] group-hover:bg-rose-500/20 transition-all duration-700" />
                <div className="flex items-center gap-3 mb-4 relative z-10">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center text-rose-400"><TrendingDown size={16} /></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Carrier Cost (Buy)</span>
                </div>
                <div className="text-3xl font-black text-white tabular-nums relative z-10">{fmt(data.totalCost)}</div>
              </div>

              <div className="bg-slate-900/50 border border-slate-800 rounded-[24px] p-6 relative overflow-hidden group lg:col-span-2">
                <div className={`absolute right-0 top-0 w-64 h-64 blur-[80px] transition-all duration-1000 ${isProfitable ? 'bg-emerald-500/10 group-hover:bg-emerald-500/20' : 'bg-red-500/10 group-hover:bg-red-500/20'}`} />
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isProfitable ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {isProfitable ? <TrendingUp size={16} /> : <AlertTriangle size={16} />}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Net Arbitrage (Profit)</span>
                    </div>
                    <div className="flex items-baseline gap-4">
                      <div className="text-5xl font-black text-white tabular-nums tracking-tighter">{fmt(data.totalProfit)}</div>
                      <div className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest border ${isProfitable ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                        {fmtPct(data.marginPct)} Margin
                      </div>
                    </div>
                  </div>
                  {data.rtoBleed > 0 && (
                    <div className="hidden sm:block text-right border-l border-slate-800 pl-6">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400/70 mb-2 flex items-center justify-end gap-1"><AlertTriangle size={12}/> RTO Bleed</div>
                      <div className="text-xl font-black text-red-400">{fmt(data.rtoBleed)}</div>
                      <div className="text-[9px] font-bold text-slate-500 uppercase mt-1">{data.rtoCount} Shipments</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Courier Arbitrage Table */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-[32px] p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <BarChart2 size={20} />
                </div>
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none mb-1">Carrier Margins</h3>
                  <p className="text-xs font-bold text-slate-500">Cost vs Sell arbitrage per courier</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="p-4 pl-0 text-[10px] font-black text-slate-500 uppercase tracking-widest">Courier Entity</th>
                      <th className="p-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Volume</th>
                      <th className="p-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Billed (Sell)</th>
                      <th className="p-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Cost (Buy)</th>
                      <th className="p-4 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Net Profit</th>
                      <th className="p-4 pr-0 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest">Margin %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {data.byCourier?.sort((a,b) => b.profit - a.profit).map((c) => (
                      <tr key={c.courier} className="group hover:bg-slate-800/20 transition-colors">
                        <td className="p-4 pl-0 font-bold text-white uppercase">{c.courier}</td>
                        <td className="p-4 text-right text-sm font-black text-slate-400">{c.count.toLocaleString()}</td>
                        <td className="p-4 text-right text-sm font-black text-blue-400">{fmt(c.revenue)}</td>
                        <td className="p-4 text-right text-sm font-black text-rose-400">{fmt(c.cost)}</td>
                        <td className="p-4 text-right text-sm font-black text-emerald-400">{fmt(c.profit)}</td>
                        <td className="p-4 pr-0 text-right">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${c.marginPct >= 10 ? 'bg-emerald-500/10 text-emerald-400' : c.marginPct > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
                            {fmtPct(c.marginPct)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Visual Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <div className="bg-slate-900/50 border border-slate-800 rounded-[32px] p-8 h-[400px]">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Revenue vs Cost Breakdown</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.byCourier}>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="5 5" vertical={false} />
                      <XAxis dataKey="courier" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} />
                      <Tooltip content={<AdminTooltip />} cursor={{ fill: '#1e293b', opacity: 0.4 }} />
                      <Legend wrapperStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
                      <Bar dataKey="revenue" name="Revenue (Sell)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="cost" name="Cost (Buy)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
               </div>
               <div className="bg-slate-900/50 border border-slate-800 rounded-[32px] p-8 h-[400px]">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Profit Margin Distribution</h3>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.byCourier} layout="vertical">
                      <CartesianGrid stroke="#1e293b" strokeDasharray="5 5" horizontal={false} />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} />
                      <YAxis dataKey="courier" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#64748b' }} dx={-10} />
                      <Tooltip content={<AdminTooltip />} cursor={{ fill: '#1e293b', opacity: 0.4 }} />
                      <Bar dataKey="marginPct" name="Margin %" radius={[0, 4, 4, 0]}>
                        {data.byCourier?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.marginPct >= 10 ? '#10b981' : entry.marginPct > 0 ? '#f59e0b' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
