// AllShipmentsPage.jsx — Enhanced with bulk status update + quick inline status
import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Edit2, Trash2, X, CheckSquare, Square, ChevronDown, RefreshCw, Clock } from 'lucide-react';
import api from '../services/api';
import { StatusBadge, STATUSES } from '../components/ui/StatusBadge';
import { PageLoader, EmptyState } from '../components/ui/Loading';
import { Modal } from '../components/ui/Modal';
import ShipmentForm from '../components/ShipmentForm';

const fmt = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const STATUS_TRANSITIONS = {
  'Booked':           ['Picked Up', 'Cancelled'],
  'Picked Up':        ['In Transit', 'RTO', 'Cancelled'],
  'In Transit':       ['Out for Delivery', 'RTO', 'Failed'],
  'Out for Delivery': ['Delivered', 'Failed', 'RTO'],
  'Failed':           ['In Transit', 'RTO'],
  'RTO':              ['RTO Delivered', 'In Transit'],
};

// ── Inline quick status component ─────────────────────────────────────────
function QuickStatus({ shipment, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const transitions = STATUS_TRANSITIONS[shipment.status] || [];

  if (transitions.length === 0) return <StatusBadge status={shipment.status} />;

  const update = async (newStatus) => {
    setSaving(true);
    setOpen(false);
    try {
      await api.patch(`/shipments/${shipment.id}/status`, { status: newStatus });
      onUpdate(shipment.id, newStatus);
    } catch (err) {
      alert(err.message);
    } finally { setSaving(false); }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={saving}
        className="flex items-center gap-1"
        title="Click to update status"
      >
        <StatusBadge status={shipment.status} />
        {!saving && <ChevronDown className="w-3 h-3 text-gray-400" />}
        {saving && <RefreshCw className="w-3 h-3 text-gray-400 animate-spin" />}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]">
            {transitions.map(s => (
              <button key={s} onClick={() => update(s)}
                className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {s}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Shipment Timeline Modal ───────────────────────────────────────────────
function TimelineModal({ shipment, onClose }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/shipments/${shipment.id}`)
      .then(r => setEvents(r.trackingEvents || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [shipment.id]);

  const STEPS = ['Booked','Picked Up','In Transit','Out for Delivery','Delivered'];
  const currentIdx = STEPS.indexOf(shipment.status);

  return (
    <Modal open onClose={onClose} title={`Timeline — ${shipment.awb}`}>
      <div className="space-y-4">
        {/* Visual progress bar */}
        <div className="flex items-center justify-between relative">
          <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 z-0" />
          {STEPS.map((step, i) => (
            <div key={step} className="flex flex-col items-center z-10 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 
                ${i <= currentIdx ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-200 text-gray-400'}`}>
                {i < currentIdx ? '✓' : i === currentIdx ? '●' : i + 1}
              </div>
              <span className={`text-[9px] mt-1 text-center max-w-[60px] leading-tight
                ${i === currentIdx ? 'font-bold text-green-600' : 'text-gray-400'}`}>
                {step}
              </span>
            </div>
          ))}
        </div>

        {/* Event list */}
        {loading ? (
          <div className="text-center py-4 text-gray-400 text-sm">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-4 text-gray-400 text-sm">No tracking events recorded yet</div>
        ) : (
          <div className="space-y-0 max-h-64 overflow-y-auto">
            {events.map((e, i) => (
              <div key={e.id} className="flex gap-3 pb-3">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
                  {i < events.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
                </div>
                <div className="flex-1 pb-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800">{e.status}</span>
                    <span className="text-xs text-gray-400">{new Date(e.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {e.location && <div className="text-xs text-gray-500">📍 {e.location}</div>}
                  {e.description && e.description !== `Status updated to ${e.status}` && (
                    <div className="text-xs text-gray-400">{e.description}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Shipment details */}
        <div className="bg-gray-50 rounded-lg p-3 text-xs grid grid-cols-2 gap-2">
          <div><span className="text-gray-400">Client:</span> <span className="font-semibold">{shipment.clientCode}</span></div>
          <div><span className="text-gray-400">Courier:</span> <span className="font-semibold">{shipment.courier || '—'}</span></div>
          <div><span className="text-gray-400">Weight:</span> <span className="font-semibold">{shipment.weight}kg</span></div>
          <div><span className="text-gray-400">Amount:</span> <span className="font-semibold">{fmt(shipment.amount)}</span></div>
          <div><span className="text-gray-400">Date:</span> <span className="font-semibold">{shipment.date}</span></div>
          <div><span className="text-gray-400">Service:</span> <span className="font-semibold">{shipment.service}</span></div>
        </div>
      </div>
    </Modal>
  );
}

// ── Bulk Status Modal ─────────────────────────────────────────────────────
function BulkStatusModal({ selectedIds, selectedShipments, onDone, onClose, toast }) {
  const [status, setStatus]   = useState('');
  const [saving, setSaving]   = useState(false);
  const [result, setResult]   = useState(null);

  // Find common valid transitions
  const uniqueStatuses = [...new Set(selectedShipments.map(s => s.status))];
  const commonTransitions = STATUSES.filter(s => s !== 'Booked'); // allow any non-terminal for bulk

  const apply = async () => {
    if (!status) { toast?.('Select a status', 'error'); return; }
    setSaving(true);
    try {
      const res = await api.post('/ops/bulk-status', { ids: selectedIds, status });
      setResult(res);
      toast?.(`${res.updated} shipments updated to ${status}`, 'success');
    } catch (err) { toast?.(err.message, 'error'); }
    finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title={`Bulk Update — ${selectedIds.length} Shipments`}
      footer={!result ? <>
        <button onClick={onClose} className="btn-secondary">Cancel</button>
        <button onClick={apply} disabled={saving || !status} className="btn-primary">
          {saving ? 'Updating…' : `Update ${selectedIds.length} Shipments`}
        </button>
      </> : <button onClick={() => { onDone(status); onClose(); }} className="btn-primary">Done & Refresh</button>}
    >
      {!result ? (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
            {selectedIds.length} shipments selected. Shipments that can't transition to the new status will be skipped.
          </div>
          <div>
            <label className="label">New Status *</label>
            <select className="input" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="">— Select new status —</option>
              {['Picked Up','In Transit','Out for Delivery','Delivered','Failed','RTO','Cancelled'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-green-700 font-semibold">
            <CheckSquare className="w-4 h-4" /> {result.updated} updated successfully
          </div>
          {result.failed > 0 && <div className="text-red-600 text-sm">⚠️ {result.failed} shipments skipped (invalid transition)</div>}
        </div>
      )}
    </Modal>
  );
}

export default function AllShipmentsPage({ toast }) {
  const [shipments,    setShipments]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filters,      setFilters]      = useState({ q: '', status: '', courier: '', date_from: '', date_to: '' });
  const [editShip,     setEditShip]     = useState(null);
  const [timeline,     setTimeline]     = useState(null);
  const [editLoading,  setEditLoading]  = useState(false);
  const [total,        setTotal]        = useState(0);
  const [selected,     setSelected]     = useState(new Set());
  const [bulkModal,    setBulkModal]    = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await api.get(`/shipments?${params}&limit=200`);
      setShipments(res.data || res || []);
      setTotal(res.pagination?.total || res.data?.length || res.length || 0);
      setSelected(new Set());
    } catch (err) { toast?.(err.message, 'error'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (s) => {
    if (!confirm(`Delete AWB ${s.awb}?`)) return;
    try {
      await api.delete(`/shipments/${s.id}`);
      setShipments(prev => prev.filter(x => x.id !== s.id));
      toast?.('Shipment deleted', 'success');
    } catch (err) { toast?.(err.message, 'error'); }
  };

  const handleEdit = async (form) => {
    setEditLoading(true);
    try {
      const res = await api.put(`/shipments/${editShip.id}`, form);
      setShipments(prev => prev.map(s => s.id === editShip.id ? (res.data || res) : s));
      setEditShip(null);
      toast?.('Updated ✓', 'success');
    } catch (err) { toast?.(err.message, 'error'); }
    finally { setEditLoading(false); }
  };

  const handleQuickStatusUpdate = (id, newStatus) => {
    setShipments(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
  };

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const clearFilters = () => setFilters({ q: '', status: '', courier: '', date_from: '', date_to: '' });
  const hasFilters = Object.values(filters).some(Boolean);

  // ── Selection ────────────────────────────────────────────────────────────
  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (selected.size === shipments.length) setSelected(new Set());
    else setSelected(new Set(shipments.map(s => s.id)));
  };

  const selectedShipments = shipments.filter(s => selected.has(s.id));
  const totalAmt = shipments.reduce((a, s) => a + (s.amount || 0), 0);
  const totalWt  = shipments.reduce((a, s) => a + (s.weight || 0), 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Shipments</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} records</p>
        </div>
        {selected.size > 0 && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
            <span className="text-sm font-bold text-blue-700">{selected.size} selected</span>
            <button onClick={() => setBulkModal(true)} className="btn-primary btn-sm">
              🔄 Bulk Update Status
            </button>
            <button onClick={() => setSelected(new Set())} className="text-blue-400 hover:text-blue-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="relative col-span-2 sm:col-span-2">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
            <input className="input pl-8" placeholder="Search AWB, client, consignee…"
              value={filters.q} onChange={e => setFilter('q', e.target.value)} />
          </div>
          <select className="input" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <input type="date" className="input" value={filters.date_from} onChange={e => setFilter('date_from', e.target.value)} />
          <input type="date" className="input" value={filters.date_to} onChange={e => setFilter('date_to', e.target.value)} />
          <div className="flex gap-2">
            <button onClick={load} className="btn-primary btn-sm flex-1 justify-center">
              <Filter className="w-3.5 h-3.5" /> Filter
            </button>
            {hasFilters && (
              <button onClick={clearFilters} className="btn-secondary btn-sm"><X className="w-3.5 h-3.5" /></button>
            )}
          </div>
        </div>
      </div>

      {/* Totals + selection info */}
      {shipments.length > 0 && (
        <div className="flex gap-4 mb-3 text-sm text-gray-600 flex-wrap">
          <span>📦 <strong>{shipments.length}</strong> shown</span>
          <span>💰 <strong>{fmt(totalAmt)}</strong></span>
          <span>⚖️ <strong>{totalWt.toFixed(1)} kg</strong></span>
          {selected.size > 0 && <span className="text-blue-600">✓ <strong>{selected.size}</strong> selected</span>}
          <span className="text-xs text-gray-400 ml-auto">Click status badge to update · Click row to select</span>
        </div>
      )}

      {loading ? <PageLoader /> : shipments.length === 0 ? (
        <EmptyState icon="📭" title="No shipments found" description="Try adjusting your filters" />
      ) : (
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th className="w-8">
                  <button onClick={toggleAll} className="p-0.5 rounded hover:bg-white/20">
                    {selected.size === shipments.length
                      ? <CheckSquare className="w-4 h-4 text-white" />
                      : <Square className="w-4 h-4 text-white/60" />}
                  </button>
                </th>
                <th>Date</th><th>AWB</th><th>Client</th><th>Consignee</th>
                <th>Destination</th><th>Courier</th><th>Wt</th><th>Amt</th>
                <th>Status ↓click</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shipments.map(s => (
                <tr key={s.id}
                  className={`hover:bg-gray-50 transition-colors cursor-pointer ${selected.has(s.id) ? 'bg-blue-50' : ''}`}
                  onClick={() => toggleSelect(s.id)}
                >
                  <td onClick={e => e.stopPropagation()}>
                    <button onClick={() => toggleSelect(s.id)} className="p-0.5">
                      {selected.has(s.id)
                        ? <CheckSquare className="w-4 h-4 text-blue-600" />
                        : <Square className="w-4 h-4 text-gray-300" />}
                    </button>
                  </td>
                  <td className="text-xs text-gray-500">{s.date}</td>
                  <td className="font-mono font-bold text-xs text-navy-700">{s.awb}</td>
                  <td className="text-xs font-semibold">{s.clientCode}<br /><span className="font-normal text-gray-400">{s.client?.company}</span></td>
                  <td className="text-xs max-w-[100px] truncate">{s.consignee}</td>
                  <td className="text-xs">{s.destination}</td>
                  <td className="text-xs">{s.courier || '—'}</td>
                  <td className="text-xs text-right">{s.weight}</td>
                  <td className="text-xs text-right font-semibold">{fmt(s.amount)}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <QuickStatus shipment={s} onUpdate={handleQuickStatusUpdate} />
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setTimeline(s)} title="Timeline" className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg">
                        <Clock className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditShip(s)} title="Edit" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(s)} title="Delete" className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
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

      {/* Bulk status modal */}
      {bulkModal && (
        <BulkStatusModal
          selectedIds={[...selected]}
          selectedShipments={selectedShipments}
          onDone={(status) => {
            setShipments(prev => prev.map(s => selected.has(s.id) ? { ...s, status } : s));
            setSelected(new Set());
          }}
          onClose={() => setBulkModal(false)}
          toast={toast}
        />
      )}

      {/* Timeline modal */}
      {timeline && <TimelineModal shipment={timeline} onClose={() => setTimeline(null)} />}

      {/* Edit modal */}
      {editShip && (
        <Modal open onClose={() => setEditShip(null)} title={`Edit — ${editShip.awb}`}
          footer={<>
            <button onClick={() => setEditShip(null)} className="btn-secondary">Cancel</button>
            <button onClick={() => document.getElementById('shipment-form-submit')?.click()} disabled={editLoading} className="btn-primary">
              {editLoading ? 'Saving…' : 'Save Changes'}
            </button>
          </>}
        >
          <ShipmentForm initialData={editShip} onSubmit={handleEdit} submitLabel="Save Changes" />
        </Modal>
      )}
    </div>
  );
}
