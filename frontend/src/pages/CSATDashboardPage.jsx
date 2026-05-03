import { useEffect, useState } from 'react';
import api from '../services/api';

export default function CSATDashboardPage({ toast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const res = await api.get('/features/csat/dashboard'); setData(res.data); }
      catch (e) { toast?.(e.message, 'error'); } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="page-shell"><div className="card animate-pulse h-64" /></div>;
  if (!data) return <div className="page-shell"><div className="card p-8 text-center text-slate-400">No CSAT data yet. Surveys are sent after deliveries.</div></div>;

  const gaugeColor = data.csatScore >= 80 ? 'text-emerald-500' : data.csatScore >= 60 ? 'text-amber-500' : 'text-rose-500';
  const npsColor = data.npsScore >= 50 ? 'text-emerald-500' : data.npsScore >= 0 ? 'text-amber-500' : 'text-rose-500';

  return (
    <div className="page-shell">
      <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Customer Satisfaction</h1>
      <p className="text-sm text-slate-500 mt-1">Post-delivery feedback analytics and NPS tracking.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="card animate-in text-center">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">CSAT Score</div>
          <div className={`text-4xl font-black mt-2 ${gaugeColor}`}>{data.csatScore}%</div>
          <div className="text-xs text-slate-500 mt-1">{data.totalResponses} responses</div>
        </div>
        <div className="card animate-in text-center" style={{ animationDelay: '60ms' }}>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">NPS Score</div>
          <div className={`text-4xl font-black mt-2 ${npsColor}`}>{data.npsScore > 0 ? '+' : ''}{data.npsScore}</div>
          <div className="text-xs text-slate-500 mt-1">Net Promoter Score</div>
        </div>
        <div className="card animate-in text-center" style={{ animationDelay: '120ms' }}>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Avg Rating</div>
          <div className="text-4xl font-black mt-2 text-amber-500">{data.averages?.overall || 0} ★</div>
          <div className="text-xs text-slate-500 mt-1">out of 5.0</div>
        </div>
        <div className="card animate-in text-center" style={{ animationDelay: '180ms' }}>
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Responses</div>
          <div className="text-4xl font-black mt-2 text-blue-600">{data.totalResponses}</div>
          <div className="text-xs text-slate-500 mt-1">total feedback</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Rating Distribution */}
        <div className="card animate-in" style={{ animationDelay: '240ms' }}>
          <h2 className="font-bold text-slate-900 dark:text-white mb-4">Rating Distribution</h2>
          {[5, 4, 3, 2, 1].map(star => {
            const item = data.distribution?.find(d => d.rating === star);
            const count = item?.count || 0;
            const pct = data.totalResponses > 0 ? (count / data.totalResponses) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3 py-2">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 w-8">{star} ★</span>
                <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-amber-400 to-amber-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-500 w-12 text-right">{count}</span>
              </div>
            );
          })}
        </div>

        {/* Category Scores */}
        <div className="card animate-in" style={{ animationDelay: '300ms' }}>
          <h2 className="font-bold text-slate-900 dark:text-white mb-4">Category Breakdown</h2>
          {[
            { label: 'Delivery Speed', val: data.averages?.delivery, icon: '🚚' },
            { label: 'Packaging Quality', val: data.averages?.packaging, icon: '📦' },
            { label: 'Communication', val: data.averages?.communication, icon: '💬' },
          ].map((cat, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">{cat.icon}</span>
                <span className="font-medium text-sm text-slate-700 dark:text-slate-300">{cat.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-700" style={{ width: `${((cat.val || 0) / 5) * 100}%` }} />
                </div>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 w-8">{(cat.val || 0).toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
