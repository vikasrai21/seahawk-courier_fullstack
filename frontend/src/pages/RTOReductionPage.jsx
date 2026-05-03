import { useEffect, useState } from 'react';
import api from '../services/api';

export default function RTOReductionPage({ toast }) {
  const [dashboard, setDashboard] = useState(null);
  const [highRisk, setHighRisk] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [d, h] = await Promise.all([api.get('/features/rto-reduction/dashboard'), api.get('/features/rto-reduction/high-risk?limit=30')]);
        setDashboard(d.data); setHighRisk(h.data || []);
      } catch (e) { toast?.(e.message, 'error'); } finally { setLoading(false); }
    })();
  }, []);

  const intervene = async (id) => {
    try {
      const res = await api.post(`/features/rto-reduction/intervene/${id}`);
      const d = res.data;
      toast?.(`${d.interventionCount} interventions triggered for ${d.awb}`, 'success');
    } catch (e) { toast?.(e.message, 'error'); }
  };

  if (loading) return <div className="page-shell"><div className="card animate-pulse h-64" /></div>;

  return (
    <div className="page-shell">
      <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">RTO Reduction Engine</h1>
      <p className="text-sm text-slate-500 mt-1">Proactively reduce returns with pre-delivery interventions and risk analysis.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[
          { label: 'Total Shipments', val: dashboard?.total || 0, icon: '📦', color: '' },
          { label: 'Delivered', val: dashboard?.delivered || 0, icon: '✅', color: 'text-emerald-600', sub: `${dashboard?.deliveryRate || 0}%` },
          { label: 'RTO', val: dashboard?.rto || 0, icon: '↩️', color: 'text-rose-600', sub: `${dashboard?.rtoRate || 0}%` },
          { label: 'High Risk Active', val: highRisk.length, icon: '⚠️', color: 'text-amber-600' },
        ].map((c, i) => (
          <div key={i} className="card animate-in" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="text-2xl">{c.icon}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">{c.label}</div>
            <div className={`text-2xl font-black mt-1 ${c.color}`}>{c.val.toLocaleString()}</div>
            {c.sub && <div className="text-xs text-slate-500">{c.sub} rate</div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Top RTO Reasons */}
        <div className="card animate-in" style={{ animationDelay: '240ms' }}>
          <h2 className="font-bold text-slate-900 dark:text-white mb-4">Top RTO Reasons</h2>
          {(dashboard?.topReasons || []).length ? dashboard.topReasons.map((r, i) => {
            const maxCount = dashboard.topReasons[0]?.count || 1;
            return (
              <div key={i} className="flex items-center gap-3 py-2">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 w-40 truncate">{r.reason || 'Unknown'}</span>
                <div className="flex-1 h-5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-600" style={{ width: `${(r.count / maxCount) * 100}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-500 w-10 text-right">{r.count}</span>
              </div>
            );
          }) : <div className="text-sm text-slate-400">No NDR data available yet</div>}
        </div>

        {/* RTO by Courier */}
        <div className="card animate-in" style={{ animationDelay: '300ms' }}>
          <h2 className="font-bold text-slate-900 dark:text-white mb-4">RTO by Courier</h2>
          {(dashboard?.rtoByCourier || []).length ? dashboard.rtoByCourier.map((c, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <span className="font-medium text-sm text-slate-700 dark:text-slate-300">{c.courier}</span>
              <span className="text-sm font-bold text-rose-600">{c.count} RTOs</span>
            </div>
          )) : <div className="text-sm text-slate-400">No RTO data yet</div>}
        </div>
      </div>

      {/* High Risk Shipments */}
      <div className="page-section mt-6">
        <h2 className="font-bold text-slate-900 dark:text-white mb-4">⚠️ High-Risk Shipments</h2>
        <div className="table-shell">
          <table className="tbl"><thead><tr>
            <th className="table-head">AWB</th><th className="table-head">Client</th><th className="table-head">Consignee</th>
            <th className="table-head">Destination</th><th className="table-head">Risk</th><th className="table-head">Courier</th><th className="table-head">Action</th>
          </tr></thead><tbody>
            {highRisk.map(s => (
              <tr key={s.id} className="table-row">
                <td className="px-4 py-3 text-sm font-mono font-bold">{s.awb}</td>
                <td className="px-4 py-3 text-sm">{s.clientCode}</td>
                <td className="px-4 py-3 text-sm">{s.consignee || '—'}</td>
                <td className="px-4 py-3 text-sm max-w-[200px] truncate">{s.destination || '⚠️ Missing'}</td>
                <td className="px-4 py-3"><span className={`badge ${(s.riskScore || 0) > 80 ? 'badge-error' : 'badge-warning'}`}>{s.riskScore || 'N/A'}</span></td>
                <td className="px-4 py-3 text-sm">{s.courier}</td>
                <td className="px-4 py-3"><button className="btn-sm btn-primary text-[10px]" onClick={() => intervene(s.id)}>Intervene</button></td>
              </tr>
            ))}
            {!highRisk.length && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">No high-risk shipments detected</td></tr>}
          </tbody></table>
        </div>
      </div>
    </div>
  );
}
