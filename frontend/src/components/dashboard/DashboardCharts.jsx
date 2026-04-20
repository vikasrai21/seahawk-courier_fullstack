import { BarChart3, PieChart as PieIcon, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import { CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, AreaChart, Area, BarChart, Bar, Legend } from 'recharts';
import { EmptyState } from '../ui/EmptyState';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#f97316', '#14b8a6', '#0f172a', '#38bdf8', '#ef4444', '#a855f7', '#06b6d4', '#84cc16'];
const DELAY_COLORS = ['#ef4444', '#f97316', '#eab308', '#14b8a6', '#6366f1'];

function CustomTooltip({ active, payload, label, prefix = '', suffix = '' }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white/90 p-3 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/90">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-sm font-black" style={{ color: entry.color || '#0f172a' }}>
            {prefix}{typeof entry.value === 'number' ? entry.value.toLocaleString('en-IN') : entry.value}{suffix}
            <span className="ml-2 text-[10px] font-semibold text-slate-400">{entry.name}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

function ChartShell({ title, icon: Icon, insight, tone = 'default', children }) {
  const iconColors = { orange: 'text-orange-500', blue: 'text-blue-500', purple: 'text-purple-500', green: 'text-emerald-500', red: 'text-rose-500', default: 'text-slate-500' };

  return (
    <div className={`group relative overflow-hidden rounded-[24px] border border-slate-200/80 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)]`}>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r opacity-30 group-hover:opacity-100 transition-opacity" style={{ backgroundImage: `linear-gradient(to right, transparent, ${iconColors[tone]?.split('-')[1] || 'gray'})` }} />
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <Icon size={14} className={iconColors[tone] || iconColors.default} strokeWidth={2.5} />
            {title}
          </div>
          <p className="mt-2 text-[13px] font-bold text-slate-700 leading-snug tracking-tight">{insight}</p>
        </div>
      </div>
      <div className="relative">
        {children}
      </div>
    </div>
  );
}

export default function DashboardCharts({ overview, courierAnalytics, rangeLabel, opsData, smartRevenue }) {
  const { isOwner } = useAuth();
  
  const statusData = Object.entries(overview?.byStatus || {})
    .map(([name, value]) => ({ name, value: Number(value || 0) }))
    .filter((item) => item.value > 0);

  // Use smart revenue daily trend if available (provides calculated revenue), otherwise fallback to overview
  const smartTrendInfo = smartRevenue?.dailyTrend?.reduce((acc, d) => {
    acc[d.date] = d.revenue;
    return acc;
  }, {}) || {};

  const trendData = (overview?.dailyTrend || opsData?.dailyTrend || []).map(d => ({ ...d, label: d.date }));

  // Build courier data: use smart revenue calculated figures for revenue
  const smartByCourier = (smartRevenue?.byCourier || []).reduce((map, c) => {
    map[c.courier] = { smartRevenue: c.revenue, smartCount: c.count };
    return map;
  }, {});

  const courierData = courierAnalytics?.couriers?.slice(0, 8).map((item) => {
    const smart = smartByCourier[item.courier] || {};
    return {
      name: item.courier || 'Unknown',
      deliveryRate: item.deliveryRate || 0,
      count: smart.smartCount || item.total || 0,
      revenue: smart.smartRevenue || item.revenue || 0,
      hasSmartRevenue: !!smart.smartRevenue,
    };
  }) || [];

  // Delay data from ops
  const delayData = (opsData?.delayedByCourier || []).slice(0, 8);
  const totalDelayed = delayData.reduce((sum, d) => sum + d.count, 0);

  // Revenue vs Cost from daily trend (estimate cost at ~72% of revenue)
  const revCostData = trendData.map(d => {
    const label = d.label || d.date;
    // Prefer smart calculated revenue if available for the specific date
    const finalRevenue = smartTrendInfo[label] || d.revenue || 0;
    return {
      label,
      revenue: finalRevenue,
      cost: Math.round(finalRevenue * 0.72),
      profit: Math.round(finalRevenue * 0.28),
    };
  });

  const totalShipments = Number(overview?.kpis?.totalShipments || opsData?.overview?.totalShipments || 0);
  const maxTrend = trendData.reduce((best, item) => Math.max(best, item.count || 0), 0);
  const totalProfit = revCostData.reduce((sum, d) => sum + d.profit, 0);

  return (
    <div className="space-y-6">
      {/* Row 1: Revenue vs Cost + Status Pie */}
      <div className={`grid gap-6 ${isOwner ? 'xl:grid-cols-2' : 'xl:grid-cols-1 max-w-4xl'}`}>
        {isOwner && (
          <ChartShell title="Revenue vs Cost" icon={DollarSign} tone="green" insight={`Estimated profit: ₹${totalProfit.toLocaleString('en-IN')} over ${rangeLabel}`}>
          {revCostData.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revCostData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="costArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="6 6" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip content={<CustomTooltip prefix="₹" />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" fill="url(#revArea)" strokeWidth={3} animationDuration={1200} />
                <Area type="monotone" dataKey="cost" name="Est. Cost" stroke="#ef4444" fill="url(#costArea)" strokeWidth={2} strokeDasharray="6 4" animationDuration={1400} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon="💰" title="No revenue data" message="Revenue vs cost charts will appear as shipments generate revenue." />
          )}
        </ChartShell>
        )}

        <ChartShell title="Status Distribution" icon={PieIcon} tone="blue" insight={`Composition of ${totalShipments} shipments in current range`}>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="flex-1 w-full flex justify-center">
              {statusData.length ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={statusData} innerRadius={65} outerRadius={95} paddingAngle={4} dataKey="value" stroke="none">
                      {statusData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip suffix=" units" />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState icon="📦" title="No status data" message="Distribution requires active shipment records." />
              )}
            </div>
            {statusData.length > 0 && (
              <div className="w-full sm:w-48 space-y-2">
                {statusData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between group cursor-default">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full ring-2 ring-offset-2 transition-all group-hover:scale-125" style={{ backgroundColor: COLORS[index % COLORS.length], '--tw-ring-color': COLORS[index % COLORS.length] }} />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{item.name}</span>
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ChartShell>
      </div>

      {/* Row 2: Volume Trend + Delay Analysis */}
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartShell title="Volume Trend" icon={TrendingUp} tone="orange" insight={`${maxTrend ? `Peak hit ${maxTrend} units` : 'Shipment velocity'} during ${rangeLabel}`}>
          {trendData.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="shipmentArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="6 6" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" stroke="#f97316" fill="url(#shipmentArea)" strokeWidth={4} animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon="📈" title="No trend data" message="Volume metrics will appear as shipments are booked." />
          )}
        </ChartShell>

        <ChartShell title="Delay Analysis" icon={AlertTriangle} tone="red" insight={`${totalDelayed} shipments stuck in transit > 7 days across ${delayData.length} couriers`}>
          {delayData.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={delayData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="6 6" vertical={false} />
                <XAxis dataKey="courier" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip content={<CustomTooltip suffix=" delayed" />} />
                <Bar dataKey="count" name="Delayed" radius={[8, 8, 0, 0]} animationDuration={1000}>
                  {delayData.map((_, i) => <Cell key={i} fill={DELAY_COLORS[i % DELAY_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">No Delayed Shipments</p>
              <p className="text-xs text-slate-500 mt-1">All in-transit shipments are within normal delivery windows.</p>
            </div>
          )}
        </ChartShell>
      </div>

      {/* Row 3: Courier Reliability */}
      <ChartShell title="Courier Reliability" icon={BarChart3} tone="purple" insight="Real-time delivery performance benchmarks by carrier">
        {courierData.length ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Carrier Partner</th>
                  <th className="text-center py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Shipments</th>
                  {isOwner && <th className="text-center py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <div className="flex items-center justify-center gap-1.5">
                      <span>Calculated Revenue</span>
                      <span className="inline-flex items-center rounded-full bg-violet-100 px-1.5 py-0.5 text-[8px] font-black text-violet-700 dark:bg-violet-900/40 dark:text-violet-300">AI</span>
                    </div>
                  </th>}
                  <th className="text-right py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Success Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {courierData.map((c, i) => (
                  <tr key={c.name} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{c.name}</span>
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      <span className="text-xs font-bold text-slate-500 tabular-nums">{c.count}</span>
                    </td>
                    {isOwner && (
                      <td className="py-4 text-center">
                        <span className={`text-xs font-bold tabular-nums ${c.hasSmartRevenue ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>₹{Number(c.revenue || 0).toLocaleString('en-IN')}</span>
                      </td>
                    )}
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <div className="w-24 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden hidden sm:block">
                          <div className="h-full bg-orange-500 rounded-full transition-all duration-700" style={{ width: `${c.deliveryRate}%` }} />
                        </div>
                        <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums w-12">{c.deliveryRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon="🚚" title="Insufficient Courier Data" message="Courier-specific performance metrics will populate as tracking data matures." />
        )}
      </ChartShell>
    </div>
  );
}
