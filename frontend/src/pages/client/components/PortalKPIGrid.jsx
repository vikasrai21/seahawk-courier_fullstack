import { Area, AreaChart, ResponsiveContainer } from 'recharts';

function PortalSparkline({ color, values }) {
  const data = (values.length ? values : [0, 0, 0]).map((value, index) => ({ index, value }));

  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`portal-spark-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={`url(#portal-spark-${color.replace('#', '')})`}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function PortalKPIGrid({ cards, sparklineValues }) {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.title} className="client-premium-card p-4">
          <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-300">{card.title}</div>
          <div className={`mt-1 text-3xl font-black ${card.tone}`}>{card.value}</div>
          <div className="mt-1 flex items-center gap-2 text-xs font-black">
            <span className={card.trend >= 0 ? 'text-emerald-500 dark:text-emerald-300' : 'text-rose-500 dark:text-rose-300'}>
              {card.trend >= 0 ? '↑' : '↓'} {Math.abs(card.trend)}%
            </span>
            <span className="text-slate-500 dark:text-slate-300">{card.sub}</span>
          </div>
          <div className="mt-2">
            <PortalSparkline color={card.trend >= 0 ? '#34d399' : '#fb7185'} values={sparklineValues} />
          </div>
        </div>
      ))}
    </section>
  );
}
