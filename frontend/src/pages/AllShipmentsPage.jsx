import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Edit2, Trash2, X } from 'lucide-react';
import api from '../services/api';
import { StatusBadge, STATUSES } from '../components/ui/StatusBadge';
import { PageLoader, EmptyState } from '../components/ui/Loading';
import { Modal } from '../components/ui/Modal';
import ShipmentForm from '../components/ShipmentForm';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function AllShipmentsPage({ toast }) {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filters, setFilters]     = useState({ q: '', status: '', courier: '', date_from: '', date_to: '' });
  const [editShip, setEditShip]   = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [total, setTotal]         = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await api.get(`/shipments?${params}&limit=200`);
      setShipments(res.data || []);
      setTotal(res.pagination?.total || res.data?.length || 0);
    } catch (err) { toast?.(err.message, 'error'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (s) => {
    if (!confirm(`Delete AWB ${s.awb}?`)) return;
    try {
      await api.delete(`/shipments/${s.id}`);
      setShipments((prev) => prev.filter((x) => x.id !== s.id));
      toast?.('Shipment deleted', 'success');
    } catch (err) { toast?.(err.message, 'error'); }
  };

  const handleEdit = async (form) => {
    setEditLoading(true);
    try {
      const res = await api.put(`/shipments/${editShip.id}`, form);
      setShipments((prev) => prev.map((s) => s.id === editShip.id ? res.data : s));
      setEditShip(null);
      toast?.('Shipment updated', 'success');
    } catch (err) { toast?.(err.message, 'error'); }
    finally { setEditLoading(false); }
  };

  const setFilter = (k, v) => setFilters((f) => ({ ...f, [k]: v }));
  const clearFilters = () => setFilters({ q: '', status: '', courier: '', date_from: '', date_to: '' });
  const hasFilters = Object.values(filters).some(Boolean);

  const totalAmt = shipments.reduce((a, s) => a + (s.amount || 0), 0);
  const totalWt  = shipments.reduce((a, s) => a + (s.weight || 0), 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Shipments</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} records</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="relative col-span-2 sm:col-span-1">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
            <input className="input pl-8" placeholder="Search AWB, client, consignee…"
              value={filters.q} onChange={(e) => setFilter('q', e.target.value)} />
          </div>
          <select className="input" value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <input type="date" className="input" placeholder="From"
            value={filters.date_from} onChange={(e) => setFilter('date_from', e.target.value)} />
          <input type="date" className="input" placeholder="To"
            value={filters.date_to} onChange={(e) => setFilter('date_to', e.target.value)} />
          <div className="flex gap-2">
            <button onClick={load} className="btn-primary btn-sm flex-1 justify-center">
              <Filter className="w-3.5 h-3.5" /> Filter
            </button>
            {hasFilters && (
              <button onClick={clearFilters} className="btn-secondary btn-sm">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Totals bar */}
      {shipments.length > 0 && (
        <div className="flex gap-4 mb-3 text-sm text-gray-600">
          <span>📦 <strong>{shipments.length}</strong> shown</span>
          <span>💰 <strong>{fmt(totalAmt)}</strong></span>
          <span>⚖️ <strong>{totalWt.toFixed(1)} kg</strong></span>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <PageLoader />
      ) : shipments.length === 0 ? (
        <EmptyState icon="📭" title="No shipments found" description="Try adjusting your filters" />
      ) : (
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Date</th><th>AWB</th><th>Client</th><th>Consignee</th>
                <th>Destination</th><th>Courier</th><th>Wt</th><th>Amt</th>
                <th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => (
                <tr key={s.id}>
                  <td className="text-xs text-gray-500 whitespace-nowrap">{s.date}</td>
                  <td className="font-mono text-xs font-bold text-navy-600">{s.awb}</td>
                  <td className="font-semibold text-xs">{s.clientCode}</td>
                  <td className="text-xs max-w-[120px] truncate">{s.consignee}</td>
                  <td className="text-xs">{s.destination}</td>
                  <td className="text-xs">{s.courier}</td>
                  <td className="text-xs">{s.weight}kg</td>
                  <td className="text-xs font-semibold">{fmt(s.amount)}</td>
                  <td><StatusBadge status={s.status} /></td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => setEditShip(s)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(s)} className="p-1.5 text-red-500 hover:bg-red-50 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit modal */}
      <Modal open={!!editShip} onClose={() => setEditShip(null)} title={`Edit Shipment — ${editShip?.awb}`} size="lg">
        {editShip && (
          <ShipmentForm
            initial={{ ...editShip, weight: editShip.weight, amount: editShip.amount }}
            onSubmit={handleEdit}
            onCancel={() => setEditShip(null)}
            loading={editLoading}
          />
        )}
      </Modal>
    </div>
  );
}
