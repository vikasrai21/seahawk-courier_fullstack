import { useEffect, useState } from 'react';
import api from '../services/api';

export default function CODDashboardPage({ toast }) {
  const [summary, setSummary] = useState(null);
  const [remittances, setRemittances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, r] = await Promise.all([api.get('/features/cod/summary'), api.get('/features/cod/remittances')]);
        setSummary(s.data); setRemittances(r.data?.remittances || []);
      } catch (e) { toast?.(e.message, 'error'); } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="page-shell"><div className="card animate-pulse h-64" /></div>;

  const cards = [
    { label: 'Total COD', val: `₹${(summary?.total?.amount || 0).toLocaleString()}`, sub: `${summary?.total?.count || 0} shipments`, icon: '💰', bg: 'from-slate-500/10 to-slate-500/5' },
    { label: 'Pending Collection', val: `₹${(summary?.pending?.amount || 0).toLocaleString()}`, sub: `${summary?.pending?.count || 0} awaiting`, icon: '⏳', bg: 'from-amber-500/10 to-amber-500/5' },
    { label: 'Collected', val: `₹${(summary?.collected?.amount || 0).toLocaleString()}`, sub: `${summary?.collected?.count || 0} collected`, icon: '📦', bg: 'from-blue-500/10 to-blue-500/5' },
    { label: 'Remitted', val: `₹${(summary?.remitted?.amount || 0).toLocaleString()}`, sub: `${summary?.remitted?.count || 0} settled`, icon: '✅', bg: 'from-emerald-500/10 to-emerald-500/5' },
  ];

  return (
    <div className="page-shell">
      <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">COD Remittance Dashboard</h1>
      <p className="text-sm text-slate-500 mt-1">Track cash-on-delivery collections and settlement across all clients.</p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {cards.map((c, i) => (
          <div key={i} className={`card bg-gradient-to-br ${c.bg} animate-in`} style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex justify-between items-start"><span className="text-2xl">{c.icon}</span></div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">{c.label}</div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{c.val}</div>
            <div className="text-xs text-slate-500 mt-1">{c.sub}</div>
          </div>
        ))}
      </div>
      <div className="page-section mt-6">
        <h2 className="font-bold text-slate-900 dark:text-white mb-4">Remittance Batches</h2>
        <div className="table-shell">
          <table className="tbl"><thead><tr>
            <th className="table-head">Remittance #</th><th className="table-head">Client</th><th className="table-head">Courier</th>
            <th className="table-head">Amount</th><th className="table-head">Net</th><th className="table-head">Status</th><th className="table-head">Date</th>
          </tr></thead><tbody>
            {remittances.map(r => (
              <tr key={r.id} className="table-row">
                <td className="px-4 py-3 text-sm font-mono font-bold">{r.remittanceNo}</td>
                <td className="px-4 py-3 text-sm">{r.client?.company || r.clientCode}</td>
                <td className="px-4 py-3 text-sm">{r.courier}</td>
                <td className="px-4 py-3 text-sm font-bold">₹{Number(r.totalAmount || 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-sm text-emerald-600 font-bold">₹{Number(r.netAmount || 0).toLocaleString()}</td>
                <td className="px-4 py-3"><span className={`badge ${r.status === 'REMITTED' ? 'badge-success' : r.status === 'COLLECTED' ? 'badge-info' : 'badge-warning'}`}>{r.status}</span></td>
                <td className="px-4 py-3 text-sm text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {!remittances.length && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">No remittance batches yet</td></tr>}
          </tbody></table>
        </div>
      </div>
    </div>
  );
}
