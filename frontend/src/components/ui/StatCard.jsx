export function StatCard({ label, value, sub, icon, color = 'blue', trend }) {
  const colors = {
    blue:   'from-blue-500 to-blue-700 text-white',
    green:  'from-green-500 to-green-700 text-white',
    yellow: 'from-yellow-400 to-yellow-600 text-white',
    red:    'from-red-500 to-red-700 text-white',
    navy:   'from-navy-600 to-navy-700 text-white',
    purple: 'from-purple-500 to-purple-700 text-white',
  };

  return (
    <div className={`rounded-xl bg-gradient-to-br p-4 ${colors[color]} shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{label}</p>
          <p className="mt-1 text-2xl font-bold">{value}</p>
          {sub && <p className="mt-0.5 text-xs opacity-75">{sub}</p>}
        </div>
        {icon && <div className="text-2xl opacity-80">{icon}</div>}
      </div>
      {trend !== undefined && (
        <p className={`mt-2 text-xs font-medium ${trend >= 0 ? 'text-green-200' : 'text-red-200'}`}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% vs yesterday
        </p>
      )}
    </div>
  );
}
