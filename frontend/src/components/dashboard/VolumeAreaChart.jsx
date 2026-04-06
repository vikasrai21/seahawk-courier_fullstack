import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const fmt = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function VolumeAreaChart({ data, dark, hideRevenue }) {
  const T = {
    grid: dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    text: dark ? '#94a3b8' : '#475569',
    stop1: dark ? '#3b82f6' : '#2563eb',
    stop2: dark ? '#10b981' : '#059669',
  };

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={T.stop1} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={T.stop1} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={T.stop2} stopOpacity={0.2}/>
              <stop offset="95%" stopColor={T.stop2} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={T.grid} />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: T.text, fontWeight: 600 }}
            tickFormatter={(str) => {
              const d = new Date(str);
              return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
            }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: T.text, fontWeight: 600 }}
          />
          <Tooltip 
            contentStyle={{ 
              background: dark ? '#0f172a' : '#fff', 
              border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              borderRadius: '12px',
              fontSize: '12px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value, name) => [
              name === 'revenue' ? fmt(value) : value, 
              name === 'revenue' ? 'Revenue' : 'Shipments'
            ]}
          />
          <Area 
            type="monotone" 
            dataKey="count" 
            stroke={T.stop1} 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorCount)" 
            animationDuration={1500}
            name="count"
          />
          {!hideRevenue && (
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke={T.stop2} 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorRev)" 
              animationDuration={1500}
              name="revenue"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
