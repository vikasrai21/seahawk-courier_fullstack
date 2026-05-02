import { useEffect, useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, IndianRupee, Package, Target, Truck, TrendingUp, Percent, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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
function TodayPulse({ stats, label = 'Current Range' }) {
  const items = [
    { label: 'Still Booked', value: stats?.Booked || stats?.todayBooked || 0, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
    { label: 'Pending / Transit', value: stats?.OutForDelivery || 0, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
    { label: 'Delivered', value: stats?.Delivered || stats?.todayDelivered || 0, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
    { label: 'Failed/RTO', value: (stats?.Failed || 0) + (stats?.RTO || 0), color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' },
  ];

  return (
    <div className="flex flex-wrap items-center gap-4 bg-white dark:bg-[rgba(13,20,37,0.7)] shadow-sm border border-slate-200/80 dark:border-[rgba(99,130,191,0.1)] rounded-[20px] p-2.5 px-5 mb-6 dark:backdrop-blur-xl">
      <div className="flex items-center gap-2.5 pr-5 border-r border-slate-200 dark:border-[rgba(99,130,191,0.15)]">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{label}</span>
      </div>
      <div className="flex flex-1 items-center justify-around gap-4 py-1">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <div className={`px-2.5 py-1 rounded-xl border ${item.bg} ${item.color} text-[11px] font-black tabular-nums shadow-sm`}>
              {item.value}
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ title, value, previous, format, icon: Icon, tone, subtitle }) {
  const trend = useMemo(() => getTrend(value, previous), [value, previous]);
  
  const toneMap = {
    orange: 'text-orange-500 bg-orange-50 ring-orange-100/50 dark:bg-orange-500/10 dark:ring-orange-500/20',
    blue:   'text-blue-500 bg-blue-50 ring-blue-100/50 dark:bg-blue-500/10 dark:ring-blue-500/20',
    green:  'text-emerald-500 bg-emerald-50 ring-emerald-100/50 dark:bg-emerald-500/10 dark:ring-emerald-500/20',
    purple: 'text-violet-500 bg-violet-50 ring-violet-100/50 dark:bg-violet-500/10 dark:ring-violet-500/20',
    cyan:   'text-cyan-500 bg-cyan-50 ring-cyan-100/50 dark:bg-cyan-500/10 dark:ring-cyan-500/20',
    red:    'text-rose-500 bg-rose-50 ring-rose-100/50 dark:bg-rose-500/10 dark:ring-rose-500/20'
  };
  const t = toneMap[tone] || toneMap.orange;

  return (
    <div className="group relative overflow-hidden rounded-[24px] bg-white dark:bg-[rgba(13,20,37,0.65)] border border-slate-200/70 dark:border-[rgba(99,130,191,0.1)] p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.3)] transition-all hover:shadow-[0_12px_32px_rgba(15,23,42,0.08)] dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 dark:backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className={`flex items-center justify-center w-11 h-11 rounded-2xl ring-1 ${t}`}>
          <Icon size={22} strokeWidth={2.5} />
        </div>
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${trend.up ? 'text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200/50 dark:text-emerald-400 dark:bg-emerald-500/10 dark:ring-emerald-500/20' : 'text-rose-700 bg-rose-50 ring-1 ring-rose-200/50 dark:text-rose-400 dark:bg-rose-500/10 dark:ring-rose-500/20'}`}>
          {trend.up ? <ArrowUpRight size={12} strokeWidth={2.5} /> : <ArrowDownRight size={12} strokeWidth={2.5} />}
          {trend.delta}%
        </div>
      </div>
      
      <div className="mt-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{title}</p>
        <p className="mt-1 text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          <AnimatedNumber value={value} format={format} />
        </p>
        {subtitle && (
          <p className="mt-1.5 text-[11px] font-semibold text-slate-400">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

export default function DashboardStats({ overview, previousOverview, dateLabel, opsData, smartRevenue }) {
  const { isOwner } = useAuth();
  const kpis = overview?.kpis || {};
  const prev = previousOverview?.kpis || {};
  const failedCurrent = Number(overview?.byStatus?.Failed || 0);
  const failedPrevious = Number(previousOverview?.byStatus?.Failed || 0);
  const todayStats = overview?.todayStats || overview?.byStatus || {};

  // Use ops data for intelligence fields if available
  const ops = opsData?.overview || {};
  const totalShipments = kpis.totalShipments || ops.totalShipments || 0;
  const transitOut = (overview?.byStatus?.OutForDelivery || 0) + (overview?.byStatus?.InTransit || 0);

  // Smart revenue calculation
  const aiRevenue = smartRevenue?.calculatedRevenue || 0;
  const hasSmartRev = aiRevenue > 0;
  const recordedRevenue = kpis.totalRevenue || ops.monthRevenue || 0;

  // We prioritize the actual Recorded Revenue so the Gross Profit calculation remains factual
  const mainRevenue = recordedRevenue;
  const revenueSubtitle = hasSmartRev
    ? `Reference rate estimate: ₹${Number(aiRevenue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
    : `From recorded shipment amounts`;

  // Dynamically calculate profit using actual billed revenue
  const grossProfit = ops.grossProfit || 0;
  const avgMargin = ops.avgMargin || 0;

  return (
    <div className="space-y-6 relative">
      <TodayPulse stats={{ ...todayStats, todayBooked: ops.todayBooked, todayDelivered: ops.todayDelivered }} label={dateLabel || 'Current Range'} />
      <div className={`grid gap-5 md:grid-cols-2 xl:grid-cols-3 ${isOwner ? '2xl:grid-cols-6' : '2xl:grid-cols-4'}`}>
        <StatCard title="Total Shipments" value={totalShipments || kpis.totalShipments || 0} previous={prev.totalShipments || 0} icon={Package} tone="orange" subtitle={`${fmtNumber(ops.weekShipments || 0)} this week`} />
        
        {isOwner && <StatCard title="Recorded Billing" value={mainRevenue} previous={prev.totalRevenue || 0} format="currency" icon={IndianRupee} tone="blue" subtitle={revenueSubtitle} />}
        {isOwner && <StatCard title="Known Gross Profit" value={grossProfit} previous={0} format="currency" icon={TrendingUp} tone="green" subtitle={`0 until carrier buy-costs are recorded`} />}
        {isOwner && <StatCard title="Known Margin" value={avgMargin} previous={0} format="percent" icon={Percent} tone="purple" subtitle={`Reference estimates are separate`} />}
        
        <StatCard title="Delivery Rate" value={((kpis.delivered || ops.deliveredCount || 0) / (totalShipments || 1)) * 100} previous={((prev.delivered || 0) / (prev.totalShipments || 1)) * 100} format="percent" icon={Target} tone="cyan" subtitle={`${fmtNumber(kpis.delivered || ops.deliveredCount || 0)} completed`} />
        
        {!isOwner && <StatCard title="Pending / Transit" value={transitOut} previous={0} icon={Clock} tone="blue" subtitle="Awaiting completion" />}
        {!isOwner && <StatCard title="Booked Today" value={ops.todayBooked || todayStats.Booked || 0} previous={0} icon={Package} tone="purple" subtitle="New volume" />}
        
        <StatCard title="Failed / RTO" value={(ops.failedCount || failedCurrent) + (ops.rtoCount || 0)} previous={failedPrevious} icon={Truck} tone="red" subtitle={`${ops.rtoCount || 0} RTO + ${ops.failedCount || failedCurrent} failed`} />
      </div>
    </div>
  );
}

