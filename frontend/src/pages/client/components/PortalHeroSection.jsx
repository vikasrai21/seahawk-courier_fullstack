import { Link } from 'react-router-dom';

const RANGE_OPTIONS = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: 'this_month', label: 'This month' },
  { key: 'custom', label: 'Custom' },
];

export default function PortalHeroSection({
  lastSyncLabel,
  trustSignals,
  range,
  setRange,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  onSync,
}) {
  return (
    <section className="client-page-intro client-premium-card relative overflow-hidden px-4 py-3 md:px-5 md:py-4 mb-4">
      <div className="portal-hero-glow opacity-50 scale-75" />
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="client-page-eyebrow text-[10px] mb-0.5">Command Center</div>
          <h1 className="text-xl font-black text-slate-950 dark:text-slate-100 md:text-2xl">Shipment Operations Overview</h1>
          <p className="mt-1 max-w-2xl text-[13px] leading-snug text-slate-500 dark:text-slate-400">
            Focused home view for shipment health, immediate attention items, and live movement.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            Last sync {lastSyncLabel}
          </span>
          <button
            type="button"
            onClick={onSync}
            className="client-action-btn-primary rounded-full px-4 py-2 text-xs"
          >
            Sync Now
          </button>
          <Link
            to="/portal/shipments"
            className="client-action-btn-secondary rounded-full px-4 py-2 text-xs"
          >
            Shipments
          </Link>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {trustSignals.map((signal) => (
          <span
            key={signal}
            className="client-page-chip text-[10px] font-black uppercase tracking-[0.12em]"
          >
            {signal}
          </span>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {RANGE_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setRange(option.key)}
            className={`rounded-full border px-3 py-1.5 text-xs font-extrabold transition ${
              range === option.key
                ? 'border-orange-300 bg-orange-50 text-orange-700 shadow-sm dark:border-orange-600 dark:bg-orange-950/40 dark:text-orange-300'
                : 'border-slate-200 bg-white/90 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {range === 'custom' && (
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <input
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
          />
          <input
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
          />
        </div>
      )}
    </section>
  );
}
