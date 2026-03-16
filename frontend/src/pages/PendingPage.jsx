import { useState, useEffect } from 'react';
import api from '../services/api';
import { StatusBadge, STATUSES } from '../components/ui/StatusBadge';
import { PageLoader, EmptyState } from '../components/ui/Loading';

const PENDING_STATUSES = ['Booked', 'InTransit', 'OutForDelivery', 'Delayed', 'RTO'];
const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function PendingPage({ toast }) {
  const [shipments, setShip]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('');

  const load = async () => {
    setLoading(true);
    try {
      // Load all non-delivered, non-cancelled
      const all = await Promise.all(
        PENDING_STATUSES.map((s) => api.get(`/shipments?status=${s}&limit=200`))
      );
      const rows = all.flatMap((r) => r.data || []);
      rows.sort((a, b) => b.date.localeCompare(a.date));
      setShip(rows);
    } catch (err) { toast?.(err.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (s, status) => {
    try {
      await api.patch(`/shipments/${s.id}/status`, { status });
      setShip((prev) => prev.map((x) => x.id === s.id ? { ...x, status } : x));
      toast?.('Status updated', 'success');
    } catch (err) { toast?.(err.message, 'error'); }
  };

  const shown = filter ? shipments.filter((s) => s.status === filter) : shipments;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending & Delayed</h1>
          <p className="text-sm text-gray-500 mt-0.5">{shipments.length} open shipments</p>
        </div>
        <select className="input w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All pending</option>
          {PENDING_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Count badges */}
      <div className="flex flex-wrap gap-2 mb-5">
        {PENDING_STATUSES.map((s) => {
          const cnt = shipments.filter((x) => x.status === s).length;
          return cnt > 0 ? (
            <button key={s} onClick={() => setFilter(filter === s ? '' : s)}
              className={`badge cursor-pointer ${filter === s ? 'badge-blue' : 'badge-gray'}`}>
              {s}: {cnt}
            </button>
          ) : null;
        })}
      </div>

      {loading ? <PageLoader /> : shown.length === 0 ? (
        <EmptyState icon="✅" title="All caught up!" description="No pending shipments" />
      ) : (
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Date</th><th>AWB</th><th>Client</th><th>Consignee</th>
                <th>Destination</th><th>Courier</th><th>Amt</th><th>Status</th><th>Update</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((s) => (
                <tr key={s.id}>
                  <td className="text-xs text-gray-500">{s.date}</td>
                  <td className="font-mono text-xs font-bold text-navy-600">{s.awb}</td>
                  <td className="text-xs font-semibold">{s.clientCode}</td>
                  <td className="text-xs">{s.consignee}</td>
                  <td className="text-xs">{s.destination}</td>
                  <td className="text-xs">{s.courier}</td>
                  <td className="text-xs">{fmt(s.amount)}</td>
                  <td><StatusBadge status={s.status} /></td>
                  <td>
                    <select
                      className="input text-xs py-1 w-36"
                      value={s.status}
                      onChange={(e) => updateStatus(s, e.target.value)}
                    >
                      {STATUSES.map((st) => <option key={st}>{st}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
