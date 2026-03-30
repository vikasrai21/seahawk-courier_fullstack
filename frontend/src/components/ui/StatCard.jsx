export function StatCard({ label, value, sub, icon, color = 'blue', trend }) {
  const colors = {
    blue:   'bg-white border border-blue-100 text-blue-900',
    green:  'bg-white border border-emerald-100 text-emerald-900',
    yellow: 'bg-white border border-amber-100 text-amber-900',
    red:    'bg-white border border-red-100 text-red-900',
    navy:   'bg-white border border-slate-200 text-slate-900',
    purple: 'bg-white border border-violet-100 text-violet-900',
  };

  const iconColors = {
    blue: 'text-blue-500', green: 'text-emerald-500', yellow: 'text-amber-500',
    red: 'text-red-500', navy: 'text-slate-500', purple: 'text-violet-500',
  };

  return (
    <div className={`rounded-xl p-4 ${colors[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
          {sub && <p className="mt-0.5 text-[11px] text-slate-400">{sub}</p>}
        </div>
        {icon && <div className={`text-xl ${iconColors[color] || 'text-slate-300'}`}>{icon}</div>}
      </div>
      {trend !== undefined && (
        <p className={`mt-2 text-[11px] font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs yesterday
        </p>
      )}
    </div>
  );
}
