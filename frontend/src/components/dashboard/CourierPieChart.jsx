import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#22d3ee', '#f472b6'];

export default function CourierPieChart({ data, dark }) {
  const chartData = (data || []).map(c => ({
    name: c.courier,
    value: c.revenue,
  }));

  const T = {
    text: dark ? '#8b9cc0' : '#475569',
    bg: dark ? 'rgba(13,20,37,0.95)' : '#fff',
    border: dark ? 'rgba(99,130,191,0.2)' : 'rgba(0,0,0,0.1)',
  };

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            animationBegin={0}
            animationDuration={1500}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
             contentStyle={{ 
              background: T.bg, 
              border: `1px solid ${T.border}`,
              borderRadius: '12px',
              fontSize: '12px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            wrapperStyle={{ fontSize: '10px', fontWeight: 600, color: T.text }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
