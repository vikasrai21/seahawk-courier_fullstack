export function Spinner({ size = 'md' }) {
  const sz = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }[size] || 'w-6 h-6';
  return (
    <div className={`${sz} border-2 border-slate-200 dark:border-slate-800 border-t-orange-500 rounded-full animate-spin`} />
  );
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center p-20 animate-in fade-in duration-700">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-slate-100 dark:border-slate-800 rounded-full shadow-inner" />
        <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-t-orange-500 rounded-full animate-spin" />
      </div>
      <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600 animate-pulse">Syncing Seahawk...</p>
    </div>
  );
}

export function EmptyState({ icon = '📭', title, description, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
      <div className="text-6xl mb-6 grayscale opacity-80">{icon}</div>
      <h3 className="text-lg font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight mb-2">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">{description || message}</p>
      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full space-y-4 animate-pulse p-4">
      <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl w-full" />
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4">
          {[...Array(cols)].map((_, j) => (
            <div key={j} className="h-12 bg-slate-50 dark:bg-slate-800/50 rounded-lg flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full w-20" />
        <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-xl" />
      </div>
      <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-xl w-32" />
      <div className="h-2 bg-slate-50 dark:bg-slate-800 rounded-full w-full" />
    </div>
  );
}
