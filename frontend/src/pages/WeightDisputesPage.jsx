import { useEffect, useState } from 'react';
import api from '../services/api';

export default function WeightDisputesPage({ toast }) {
  const [disputes, setDisputes] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [d, s] = await Promise.all([api.get('/features/disputes'), api.get('/features/disputes/summary')]);
        setDisputes(d.data?.disputes || []); setSummary(s.data);
      } catch (e) { toast?.(e.message, 'error'); } finally { setLoading(false); }
    })();
  }, []);

  const resolve = async (id, resolution) => {
    try {
      await api.put(`/features/disputes/${id}/resolve`, { resolution, notes: 'Resolved via dashboard' });
      toast?.('Dispute resolved', 'success');
      const d = await api.get('/features/disputes'); setDisputes(d.data?.disputes || []);
    } catch (e) { toast?.(e.message, 'error'); }
  };

  if (loading) return <div className="page-shell"><div className="card animate-pulse h-64" /></div>;

  return (
    <div className="page-shell">
      <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Weight Discrepancy Disputes</h1>
      <p className="text-sm text-slate-500 mt-1">Auto-flagged when courier-billed weight exceeds booked weight by &gt;20%.</p>

      <div className="grid grid-cols-3 gap-4 mt-6">
        {[
          { label: 'Open Disputes', val: summary?.open?.count || 0, amount: summary?.open?.amount || 0, color: 'text-amber-600' },
          { label: 'Resolved', val: summary?.resolved?.count || 0, amount: summary?.resolved?.amount || 0, color: 'text-emerald-600' },
          { label: 'Total Overcharge', val: summary?.total?.count || 0, amount: summary?.total?.amount || 0, color: 'text-rose-600' },
        ].map((c, i) => (
          <div key={i} className="card animate-in" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{c.label}</div>
            <div className={`text-2xl font-black mt-1 ${c.color}`}>₹{Number(c.amount).toLocaleString()}</div>
            <div className="text-xs text-slate-500">{c.val} disputes</div>
          </div>
        ))}
      </div>

      <div className="page-section mt-6">
        <h2 className="font-bold text-slate-900 dark:text-white mb-4">Dispute Queue</h2>
        <div className="table-shell">
          <table className="tbl"><thead><tr>
            <th className="table-head">AWB</th><th className="table-head">Client</th><th className="table-head">Courier</th>
            <th className="table-head">Booked</th><th className="table-head">Billed</th><th className="table-head">Diff %</th>
            <th className="table-head">Overcharge</th><th className="table-head">Status</th><th className="table-head">Actions</th>
          </tr></thead><tbody>
            {disputes.map(d => (
              <tr key={d.id} className="table-row">
                <td className="px-4 py-3 text-sm font-mono font-bold">{d.awb}</td>
                <td className="px-4 py-3 text-sm">{d.client?.company || d.clientCode}</td>
                <td className="px-4 py-3 text-sm">{d.courier}</td>
                <td className="px-4 py-3 text-sm">{Number(d.bookedWeight).toFixed(2)} kg</td>
                <td className="px-4 py-3 text-sm font-bold text-rose-600">{Number(d.billedWeight).toFixed(2)} kg</td>
                <td className="px-4 py-3 text-sm font-bold text-rose-600">+{Number(d.discrepancyPct).toFixed(1)}%</td>
                <td className="px-4 py-3 text-sm font-bold">₹{Number(d.overchargeAmount).toLocaleString()}</td>
                <td className="px-4 py-3"><span className={`badge ${d.status === 'RESOLVED' ? 'badge-success' : d.status === 'DISPUTED' ? 'badge-info' : 'badge-warning'}`}>{d.status}</span></td>
                <td className="px-4 py-3">
                  {d.status === 'OPEN' && (
                    <div className="flex gap-1">
                      <button className="btn-sm btn-primary text-[10px]" onClick={() => resolve(d.id, 'CREDIT_NOTE')}>Credit</button>
                      <button className="btn-sm btn-ghost text-[10px]" onClick={() => resolve(d.id, 'REJECTED')}>Reject</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!disputes.length && <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400 text-sm">No weight disputes found</td></tr>}
          </tbody></table>
        </div>
      </div>
    </div>
  );
}
