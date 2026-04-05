import { BarChart3, PieChart as PieIcon, TrendingUp } from 'lucide-react';
import { CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, AreaChart, Area } from 'recharts';
import { EmptyState } from '../ui/EmptyState';

const COLORS = ['#f97316', '#14b8a6', '#0f172a', '#38bdf8', '#ef4444', '#a855f7'];

function CustomTooltip({ active, payload, label, prefix = '', suffix = '' }) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white/90 p-3 shadow-xl backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/90">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
        <p className="text-sm font-black text-slate-900 dark:text-white">
          {prefix}{payload[0].value.toLocaleString('en-IN')}{suffix}
        </p>
      </div>
    );
  }
  return null;
}

function ChartShell({ title, icon: Icon, insight, tone = 'default', children }) {
  const toneMap = {
    orange: 'from-orange-50/80 to-transparent border-orange-200/50 dark:from-orange-900/20 dark:border-orange-500/20 shadow-orange-500/5',
    blue:   'from-blue-50/80 to-transparent border-blue-200/50 dark:from-blue-900/20 dark:border-blue-500/20 shadow-blue-500/5',
    purple: 'from-purple-50/80 to-transparent border-purple-200/50 dark:from-purple-900/20 dark:border-purple-500/20 shadow-purple-500/5',
    default: 'from-slate-50 to-transparent border-slate-200 dark:from-slate-900/40 dark:border-slate-800 shadow-slate-500/5'
  };

  const currentTone = toneMap[tone] || toneMap.default;

  return (
    <div className={`group relative overflow-hidden rounded-3xl border bg-gradient-to-br bg-white/50 dark:bg-transparent ${currentTone} p-6 shadow-sm transition-all hover:shadow-md animate-[fadeIn_0.5s_ease-out] backdrop-blur-sm`}>
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-slate-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <Icon size={12} className={tone === 'orange' ? 'text-orange-500' : tone === 'blue' ? 'text-blue-500' : tone === 'purple' ? 'text-purple-500' : 'text-slate-500'} />
            {title}
          </div>
          <p className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-200 leading-snug">{insight}</p>
        </div>
      </div>
      <div className="relative">
        {children}
      </div>
    </div>
  );
}

export default function DashboardCharts({ overview, courierAnalytics, rangeLabel }) {
  const statusData = Object.entries(overview?.byStatus || {})
    .map(([name, value]) => ({ name, value: Number(value || 0) }))
    .filter((item) => item.value > 0);

  const trendData = (overview?.dailyTrend || []).map(d => ({ ...d, label: d.date }));

  const courierData = courierAnalytics?.couriers?.slice(0, 5).map((item) => ({
    name: item.courier || 'Unknown',
    deliveryRate: item.deliveryRate || 0,
    count: item.total || 0,
  })) || [];

  const totalShipments = Number(overview?.kpis?.totalShipments || 0);
  const maxTrend = trendData.reduce((best, item) => Math.max(best, item.count || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-2">
        <ChartShell title="Volume Trend" icon={TrendingUp} tone="orange" insight={`${maxTrend ? `Peak movement hit ${maxTrend} units` : 'Shipment velocity'} during ${rangeLabel}`}>
          {trendData.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="shipmentArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="6 6" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 700, fill: '#94a3b8' }} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" stroke="#f97316" fill="url(#shipmentArea)" strokeWidth={4} animationDuration={1500} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon="📈" title="No trend data" message="Volume metrics will appear as shipments are booked." />
          )}
        </ChartShell>

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

      <ChartShell title="Courier Reliability" icon={BarChart3} tone="purple" insight="Real-time delivery performance benchmarks by carrier">
        {courierData.length ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Carrier Partner</th>
                  <th className="text-center py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Shipments</th>
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
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <div className="w-24 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden hidden sm:block">
                          <div className="h-full bg-orange-500 rounded-full" style={{ width: `${c.deliveryRate}%` }} />
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
