export function Spinner({ size = 'md' }) {
  const sz = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }[size] || 'w-6 h-6';
  return (
    <div className={`${sz} border-2 border-slate-200 dark:border-slate-800 border-t-orange-500 rounded-full animate-spin`} />
  );
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center p-20 animate-in">
      <div className="relative flex h-20 w-20 items-center justify-center rounded-[2rem] border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-[0_18px_38px_rgba(15,23,42,0.08)]">
        <div className="h-10 w-10 rounded-full border-[3px] border-slate-200 border-t-orange-500 animate-spin" />
        <div className="absolute -bottom-2 h-10 w-10 rounded-full bg-orange-100/50 blur-xl" />
      </div>
      <p className="mt-6 text-[10px] font-black uppercase tracking-[0.24em] text-slate-400 dark:text-slate-600">Loading workspace</p>
      <p className="mt-2 text-sm text-slate-500">Preparing the latest Seahawk data and interface states.</p>
    </div>
  );
}

export function EmptyState({ icon = '📭', title, description, message, action }) {
  return (
    <div className="card mx-auto flex max-w-xl flex-col items-center justify-center py-16 text-center animate-in">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-amber-100 bg-gradient-to-br from-amber-50 to-sky-50 text-4xl shadow-[0_12px_24px_rgba(249,115,22,0.08)]">{icon}</div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-2">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">{description || message}</p>
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full space-y-4 p-4 rounded-[28px] border border-slate-200/80 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <div className="relative overflow-hidden h-10 bg-slate-100 rounded-xl w-full before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent" />
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4">
          {[...Array(cols)].map((_, j) => (
            <div key={j} className="relative overflow-hidden h-12 bg-slate-100 rounded-2xl flex-1 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="p-6 bg-white border border-slate-200/80 rounded-[28px] space-y-4 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between">
        <div className="relative overflow-hidden h-3 bg-slate-100 rounded-full w-20 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent" />
        <div className="relative overflow-hidden w-8 h-8 bg-slate-100 rounded-xl before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent" />
      </div>
      <div className="relative overflow-hidden h-8 bg-slate-100 rounded-xl w-32 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent" />
      <div className="relative overflow-hidden h-2 bg-slate-100 rounded-full w-full before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/70 before:to-transparent" />
    </div>
  );
}
