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

function StatCard({ title, value, previous, format, icon: Icon, tone, subtitle }) {
  const trend = useMemo(() => getTrend(value, previous), [value, previous]);
  const trendLabel = previous ? `${trend.up ? 'Up' : 'Down'} ${trend.delta}% vs last period` : 'No prior period';
  const toneMap = {
    orange: 'from-orange-500/20 to-orange-100/5 border-orange-300/20',
    blue: 'from-sky-500/20 to-sky-100/5 border-sky-300/20',
    red: 'from-rose-500/20 to-rose-100/5 border-rose-300/20',
    green: 'from-emerald-500/20 to-emerald-100/5 border-emerald-300/20',
  };

  return (
    <div className={`rounded-3xl border bg-white shadow-sm p-5 animate-[fadeIn_.45s_ease] bg-gradient-to-br ${toneMap[tone] || toneMap.orange}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-black text-slate-900">
            <AnimatedNumber value={value} format={format} />
          </p>
          <p className={`mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${trend.up ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {trend.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trendLabel}
          </p>
          <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="rounded-2xl bg-slate-900 p-3 text-white shadow-lg">
          <Icon size={18} />
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

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard title="Total Shipments" value={kpis.totalShipments || 0} previous={prev.totalShipments || 0} icon={Package} tone="orange" subtitle={`Across ${dateLabel}`} />
      <StatCard title="Delivered" value={kpis.delivered || 0} previous={prev.delivered || 0} icon={Target} tone="green" subtitle="Successfully completed" />
      <StatCard title="Failed Deliveries" value={failedCurrent} previous={failedPrevious} icon={Truck} tone="red" subtitle="Needs attention and recovery" />
      <StatCard title="Revenue" value={kpis.totalRevenue || 0} previous={prev.totalRevenue || 0} format="currency" icon={IndianRupee} tone="blue" subtitle="Booked client billing" />
    </div>
  );
}
