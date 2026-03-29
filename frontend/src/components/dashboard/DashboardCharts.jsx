import { BarChart3, PieChart as PieIcon, TrendingUp } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, AreaChart, Area } from 'recharts';
import { EmptyState } from '../ui/EmptyState';

const COLORS = ['#f97316', '#14b8a6', '#0f172a', '#38bdf8', '#ef4444', '#a855f7'];

function Insight({ title, message }) {
  return (
    <div className="mb-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className="mt-1 text-sm font-semibold text-slate-700">{message}</p>
    </div>
  );
}

function ChartShell({ title, icon: Icon, insight, children }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm animate-[fadeIn_.45s_ease]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            <Icon size={14} />
            {title}
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-700">{insight}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export default function DashboardCharts({ overview, courierAnalytics, rangeLabel }) {
  const statusData = Object.entries(overview?.byStatus || {})
    .map(([name, value]) => ({ name, value: Number(value || 0) }))
    .filter((item) => item.value > 0);
  const trendData = overview?.dailyTrend || [];
  const courierData = courierAnalytics?.couriers?.slice(0, 6).map((item) => ({
    name: item.courier || 'Unknown',
    deliveryRate: item.deliveryRate || 0,
    count: item.total || 0,
  })) || [];

  const totalShipments = Number(overview?.kpis?.totalShipments || 0);
  const delivered = Number(overview?.kpis?.delivered || 0);
  const topCourier = courierData[0];
  const maxTrend = trendData.reduce((best, item) => Math.max(best, item.count || 0), 0);

  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_1.4fr_1.1fr]">
      <ChartShell title="Status Mix" icon={PieIcon} insight={`Shipment distribution for ${rangeLabel}`}>
        {statusData.length ? (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={statusData} innerRadius={70} outerRadius={100} paddingAngle={3} dataKey="value">
                {statusData.map((entry, index) => <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState icon="📦" title="No shipment data" message="Status distribution will appear once shipments are available for this date range." />
        )}
        {statusData.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {statusData.map((item, index) => (
              <div key={item.name} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  {item.name}
                </div>
                <div className="mt-1 text-lg font-bold text-slate-900">{item.value}</div>
              </div>
            ))}
          </div>
        )}
      </ChartShell>

      <ChartShell title="Volume Trend" icon={TrendingUp} insight={`${maxTrend ? `Peak day hit ${maxTrend} shipments` : 'Daily movement'} in ${rangeLabel}`}>
        {trendData.length ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="shipmentArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#f97316" fill="url(#shipmentArea)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState icon="📈" title="No trend data" message="Pick a range with shipment movement to render the growth chart." />
        )}
        <Insight title="Context" message={delivered ? `📈 ${delivered} deliveries completed in the selected period.` : 'No deliveries recorded in this period yet.'} />
      </ChartShell>

      <ChartShell title="Courier Performance" icon={BarChart3} insight={topCourier ? `${topCourier.name} is leading with ${topCourier.deliveryRate}% delivery success.` : 'Compare delivery performance by courier'}>
        {courierData.length ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={courierData}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="deliveryRate" radius={[8, 8, 0, 0]}>
                {courierData.map((item, index) => <Cell key={item.name} fill={COLORS[index % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState icon="🚚" title="No courier comparison yet" message={totalShipments ? 'Courier stats will appear when courier-tagged shipments exist.' : 'Create shipments first to compare carriers.'} />
        )}
      </ChartShell>
    </div>
  );
}
