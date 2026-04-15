export default function PortalAttentionPanel({ items }) {
  return (
    <section className="client-premium-card p-5">
      <div className="text-[11px] font-black uppercase tracking-[0.12em] text-orange-500">Today Priority</div>
      <h2 className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">What needs attention now</h2>
      <div className="mt-3 grid gap-2">
        {items.map((item, index) => (
          <div
            key={`${item}-${index}`}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100"
          >
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}
