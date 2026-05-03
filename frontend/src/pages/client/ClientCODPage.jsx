import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function ClientCODPage({ toast }) {
  const [summary, setSummary] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [sumRes, shipRes] = await Promise.all([api.get('/features/cod/summary'), api.get('/features/cod/shipments?limit=30')]);
        setSummary(sumRes.data);
        setShipments(shipRes.data?.shipments || []);
      } catch (e) { toast?.(e.message, 'error'); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="client-premium-main"><div className="card animate-pulse h-64" /></div>;

  const cards = [
    { label: 'Total COD', value: `₹${(summary?.total?.amount || 0).toLocaleString()}`, count: summary?.total?.count || 0, color: 'text-slate-900 dark:text-white' },
    { label: 'Pending', value: `₹${(summary?.pending?.amount || 0).toLocaleString()}`, count: summary?.pending?.count || 0, color: 'text-amber-600' },
    { label: 'Collected', value: `₹${(summary?.collected?.amount || 0).toLocaleString()}`, count: summary?.collected?.count || 0, color: 'text-blue-600' },
    { label: 'Remitted', value: `₹${(summary?.remitted?.amount || 0).toLocaleString()}`, count: summary?.remitted?.count || 0, color: 'text-emerald-600' },
  ];

  return (
    <div className="client-premium-main">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">COD Remittance</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Track your Cash on Delivery collections and remittance status.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((c, i) => (
          <div key={i} className="client-premium-card p-5 animate-in" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{c.label}</div>
            <div className={`text-2xl font-black mt-1 ${c.color}`}>{c.value}</div>
            <div className="text-xs text-slate-500 mt-1">{c.count} shipments</div>
          </div>
        ))}
      </div>

      <div className="client-premium-card p-5">
        <h2 className="font-bold text-slate-900 dark:text-white mb-4">COD Shipments</h2>
        <div className="table-shell">
          <table className="tbl">
            <thead><tr>
              <th className="table-head">AWB</th><th className="table-head">Client</th><th className="table-head">COD Amount</th>
              <th className="table-head">Status</th><th className="table-head">Date</th>
            </tr></thead>
            <tbody>
              {shipments.map(s => (
                <tr key={s.id} className="table-row">
                  <td className="px-4 py-3 text-sm font-mono font-bold">{s.awb}</td>
                  <td className="px-4 py-3 text-sm">{s.client?.company || s.clientCode}</td>
                  <td className="px-4 py-3 text-sm font-bold text-emerald-600">₹{Number(s.codAmount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3"><span className={`badge ${s.codStatus === 'REMITTED' ? 'badge-success' : s.codStatus === 'COLLECTED' ? 'badge-info' : 'badge-warning'}`}>{s.codStatus || 'PENDING'}</span></td>
                  <td className="px-4 py-3 text-sm text-slate-500">{s.date}</td>
                </tr>
              ))}
              {!shipments.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-400">No COD shipments found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
