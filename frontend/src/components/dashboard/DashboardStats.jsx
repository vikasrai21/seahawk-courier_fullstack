import { useEffect, useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, IndianRupee, Package, Target, Truck } from 'lucide-react';

const fmtCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const fmtNumber = (n) => Number(n || 0).toLocaleString('en-IN');

function AnimatedNumber({ value, format = 'number', duration = 700 }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame;
    const start = performance.now();
    const from = display;
    const to = Number(value || 0);

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + ((to - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  if (format === 'currency') return <>{fmtCurrency(display)}</>;
  if (format === 'percent') return <>{`${display.toFixed(1)}%`}</>;
  return <>{fmtNumber(display)}</>;
}

function getTrend(current, previous) {
  if (!previous) return { delta: 0, up: true };
  const delta = ((current - previous) / previous) * 100;
  return { delta: Number.isFinite(delta) ? Math.abs(delta).toFixed(1) : '0.0', up: delta >= 0 };
}

// ── Today Pulse Bar ───────────────────────────────────────────────────────
function TodayPulse({ stats }) {
  const items = [
    { label: 'Bookings', value: stats?.Booked || 0, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Out for Delivery', value: stats?.OutForDelivery || 0, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Delivered', value: stats?.Delivered || 0, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Failed/RTO', value: (stats?.Failed || 0) + (stats?.RTO || 0), color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-4 bg-slate-900 shadow-lg border border-slate-800 rounded-2xl p-2 px-4 mb-6 shadow-slate-900/10">
      <div className="flex items-center gap-2 pr-4 border-r border-slate-800">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Today's Pulse</span>
      </div>
      <div className="flex flex-1 items-center justify-around gap-4 py-1">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <div className={`px-2 py-0.5 rounded-lg ${item.bg} ${item.color} text-[10px] font-black tabular-nums`}>
              {item.value}
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ title, value, previous, format, icon: Icon, tone }) {
  const trend = useMemo(() => getTrend(value, previous), [value, previous]);
  
  const toneMap = {
    orange: { gradient: 'from-orange-500 to-amber-600 shadow-orange-500/30', text: 'text-white', title: 'text-orange-100', icon: 'bg-white/20 text-white', trendUp: 'bg-white/20 text-white', trendDown: 'bg-white/20 text-white', barValue: 'bg-white', barTrack: 'bg-black/10' },
    blue:   { gradient: 'from-blue-600 to-indigo-600 shadow-blue-500/30', text: 'text-white', title: 'text-blue-100', icon: 'bg-white/20 text-white', trendUp: 'bg-emerald-400 bg-opacity-20 text-emerald-50', trendDown: 'bg-rose-400 bg-opacity-20 text-rose-50', barValue: 'bg-white', barTrack: 'bg-black/10' },
    red:    { gradient: 'from-rose-500 to-red-600 shadow-rose-500/30', text: 'text-white', title: 'text-rose-100', icon: 'bg-white/20 text-white', trendUp: 'bg-white/20 text-white', trendDown: 'bg-white/20 text-white', barValue: 'bg-white', barTrack: 'bg-black/10' },
    green:  { gradient: 'from-emerald-500 to-teal-600 shadow-emerald-500/30', text: 'text-white', title: 'text-emerald-100', icon: 'bg-white/20 text-white', trendUp: 'bg-white/20 text-white', trendDown: 'bg-white/20 text-white', barValue: 'bg-white', barTrack: 'bg-black/10' },
  };
  const t = toneMap[tone] || toneMap.orange;

  return (
    <div className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${t.gradient} p-6 shadow-lg transition-transform hover:-translate-y-1`}>
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-xl" />
      <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-black/5 blur-lg" />
      
      <div className="relative flex items-start justify-between">
        <div className={`rounded-2xl ${t.icon} p-3 shadow-inner backdrop-blur-sm`}>
          <Icon size={24} strokeWidth={2.5} />
        </div>
        <div className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider ${trend.up ? t.trendUp : t.trendDown} backdrop-blur-sm`}>
          {trend.up ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownRight size={12} strokeWidth={3} />}
          {trend.delta}%
        </div>
      </div>

      <div className="relative mt-5">
        <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${t.title}`}>{title}</p>
        <p className={`mt-2 text-4xl font-black tracking-tight ${t.text}`}>
          <AnimatedNumber value={value} format={format} />
        </p>
        <div className="mt-4 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className={`text-[9px] font-bold uppercase tracking-widest ${t.title}`}>vs previous</span>
          </div>
          <div className={`h-1 flex-1 rounded-full ${t.barTrack} overflow-hidden`}>
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${t.barValue}`}
              style={{ width: `${Math.min(100, Math.max(10, trend.delta * 2))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardStats({ overview, previousOverview, dateLabel }) {
  const kpis = overview?.kpis || {};
  const prev = previousOverview?.kpis || {};
  const failedCurrent = Number(overview?.byStatus?.Failed || 0);
  const failedPrevious = Number(previousOverview?.byStatus?.Failed || 0);
  const todayStats = overview?.todayStats || overview?.byStatus || {};

  return (
    <div className="space-y-6">
      <TodayPulse stats={todayStats} />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Shipments" value={kpis.totalShipments || 0} previous={prev.totalShipments || 0} icon={Package} tone="orange" />
        <StatCard title="Delivered Rate" value={((kpis.delivered || 0) / (kpis.totalShipments || 1)) * 100} previous={((prev.delivered || 0) / (prev.totalShipments || 1)) * 100} format="percent" icon={Target} tone="green" />
        <StatCard title="Failed Deliveries" value={failedCurrent} previous={failedPrevious} icon={Truck} tone="red" />
        <StatCard title="Revenue" value={kpis.totalRevenue || 0} previous={prev.totalRevenue || 0} format="currency" icon={IndianRupee} tone="blue" />
      </div>
    </div>
  );
}
