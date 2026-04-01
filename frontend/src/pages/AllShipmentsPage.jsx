// AllShipmentsPage.jsx — Enhanced with bulk status update + quick inline status + barcode scanner
import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Filter, Edit2, Trash2, X, CheckSquare, Square, ChevronDown, RefreshCw, Clock, Scan, Zap, Box, FileText } from 'lucide-react';
import api from '../services/api';
import { StatusBadge, STATUSES, formatStatusLabel, normalizeStatus } from '../components/ui/StatusBadge';
import { PageLoader, EmptyState, SkeletonTable } from '../components/ui/Loading';
import { Modal } from '../components/ui/Modal';
import ShipmentForm from '../components/ShipmentForm';
import { PageHeader } from '../components/ui/PageHeader';
import { CourierBadge } from '../components/ui/CourierBadge';

const fmt = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const STATUS_TRANSITIONS = {
  Booked: ['PickedUp', 'Cancelled'],
  PickedUp: ['InTransit', 'RTO', 'Cancelled'],
  InTransit: ['OutForDelivery', 'RTO', 'Failed'],
  OutForDelivery: ['Delivered', 'Failed', 'RTO'],
  Failed: ['InTransit', 'RTO'],
  RTO: ['RTODelivered', 'InTransit'],
};

// ── Barcode Scanner Bar ───────────────────────────────────────────────────
function BarcodeScanner({ onScan, scanning, lastScanned }) {
  const inputRef = useRef(null);
  const [value, setValue] = useState('');
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && value.trim()) {
      onScan(value.trim());
      setPulse(true);
      setValue('');
      setTimeout(() => setPulse(false), 600);
    }
  };

  return (
    <div className={`mb-4 rounded-[24px] border transition-all duration-300 shadow-sm ${
      pulse ? 'border-emerald-300 bg-emerald-50/80' : 'border-sky-200 bg-gradient-to-r from-sky-50 to-white'
    }`}>
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div className={`flex-shrink-0 ${scanning ? 'text-green-500' : 'text-blue-400'}`}>
          {scanning
            ? <RefreshCw className="w-5 h-5 animate-spin" />
            : <Scan className={`w-5 h-5 ${pulse ? 'text-green-500' : ''}`} />
          }
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Scan barcode or type AWB number and press Enter…"
          className="flex-1 bg-transparent outline-none text-sm font-mono text-gray-700 placeholder-blue-300"
          autoComplete="off"
          spellCheck={false}
        />
        {value.trim() && (
          <button
            onClick={() => { onScan(value.trim()); setValue(''); }}
            className="btn-primary btn-sm !rounded-full"
          >
            <Zap className="w-3 h-3" /> Search
          </button>
        )}
        {lastScanned && !value && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Last:</span>
            <span className="font-mono font-bold text-gray-600">{lastScanned.awb}</span>
            <span className={`px-2 py-0.5 rounded-full font-semibold ${
              lastScanned.found ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
            }`}>
              {lastScanned.found ? '✓ Found' : '✗ Not found'}
            </span>
          </div>
        )}
        <div className="flex-shrink-0 text-xs text-blue-300 hidden sm:block">
          Hardware scanner ready · Press Enter
        </div>
      </div>
    </div>
  );
}

// ── Inline quick status component ─────────────────────────────────────────
function QuickStatus({ shipment, onUpdate }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const transitions = STATUS_TRANSITIONS[normalizeStatus(shipment.status)] || [];

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
                {formatStatusLabel(s)}
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

  const STEPS = ['Booked', 'PickedUp', 'InTransit', 'OutForDelivery', 'Delivered'];
  const currentIdx = STEPS.indexOf(normalizeStatus(shipment.status));

  return (
    <Modal open onClose={onClose} title={`Timeline — ${shipment.awb}`}>
      <div className="space-y-4">
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
                {formatStatusLabel(step)}
              </span>
            </div>
          ))}
        </div>

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
              {['PickedUp','InTransit','OutForDelivery','Delivered','Failed','RTO','Cancelled'].map(s => (
                <option key={s} value={s}>{formatStatusLabel(s)}</option>
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

// ── Scanned Shipment Detail Modal ─────────────────────────────────────────
function ScannedShipmentModal({ shipment, onClose, onStatusUpdate, toast }) {
  const transitions = STATUS_TRANSITIONS[shipment.status] || [];
  const [saving, setSaving] = useState(false);

  const update = async (newStatus) => {
    setSaving(true);
    try {
      await api.patch(`/shipments/${shipment.id}/status`, { status: newStatus });
      onStatusUpdate(shipment.id, newStatus);
      toast?.(`Status updated to ${newStatus}`, 'success');
      onClose();
    } catch (err) {
      toast?.(err.message, 'error');
    } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title={`📦 Scanned — ${shipment.awb}`}>
      <div className="space-y-4">
        <div className="text-center py-3 bg-gray-50 rounded-xl">
          <div className="text-xs text-gray-400 mb-1">Current Status</div>
          <StatusBadge status={shipment.status} />
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <div className="text-xs text-gray-400">Client</div>
            <div className="font-bold">{shipment.clientCode}</div>
            <div className="text-xs text-gray-500">{shipment.client?.company}</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <div className="text-xs text-gray-400">Courier</div>
            <div className="font-bold">{shipment.courier || '—'}</div>
            <div className="text-xs text-gray-500">{shipment.service}</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <div className="text-xs text-gray-400">Consignee</div>
            <div className="font-bold text-xs">{shipment.consignee}</div>
            <div className="text-xs text-gray-500">{shipment.destination}</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <div className="text-xs text-gray-400">Amount / Weight</div>
            <div className="font-bold">{fmt(shipment.amount)}</div>
            <div className="text-xs text-gray-500">{shipment.weight} kg</div>
          </div>
        </div>
        {transitions.length > 0 && (
          <div>
            <div className="text-xs text-gray-400 mb-2 font-semibold">QUICK UPDATE STATUS</div>
            <div className="flex flex-wrap gap-2">
              {transitions.map(s => (
                <button
                  key={s}
                  onClick={() => update(s)}
                  disabled={saving}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  → {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function AllShipmentsPage({ toast }) {
  const [shipments,      setShipments]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [filters,        setFilters]        = useState({ q: '', status: '', courier: '', date_from: '', date_to: '' });
  const [editShip,       setEditShip]       = useState(null);
  const [timeline,       setTimeline]       = useState(null);
  const [editLoading,    setEditLoading]    = useState(false);
  const [total,          setTotal]          = useState(0);
  const [selected,       setSelected]       = useState(new Set());
  const [bulkModal,      setBulkModal]      = useState(false);
  const [showScanner,    setShowScanner]    = useState(false);
  const [scanning,       setScanning]       = useState(false);
  const [lastScanned,    setLastScanned]    = useState(null);   
  const [scannedShip,    setScannedShip]    = useState(null);   
  const [highlightId,    setHighlightId]    = useState(null);   
  const rowRefs = useRef({});                                    

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

  const handleScan = useCallback(async (awb) => {
    setScanning(true);
    try {
      const existing = shipments.find(s => s.awb?.toLowerCase() === awb.toLowerCase());
      if (existing) {
        setHighlightId(existing.id);
        setLastScanned({ awb, found: true });
        setScannedShip(existing);
        setTimeout(() => {
          rowRefs.current[existing.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        setTimeout(() => setHighlightId(null), 3000);
      } else {
        const res = await api.get(`/shipments?q=${encodeURIComponent(awb)}&limit=5`);
        const results = res.data || res || [];
        const match = results.find(s => s.awb?.toLowerCase() === awb.toLowerCase()) || results[0];
        if (match) {
          setLastScanned({ awb, found: true });
          setScannedShip(match);
          toast?.(`Found: ${match.awb}`, 'success');
        } else {
          setLastScanned({ awb, found: false });
          toast?.(`AWB "${awb}" not found`, 'error');
        }
      }
    } catch (err) {
      setLastScanned({ awb, found: false });
      toast?.(err.message, 'error');
    } finally { setScanning(false); }
  }, [shipments, toast]);

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
    <div className="mx-auto max-w-7xl p-6">
      <PageHeader
        title="All Shipments"
        subtitle={`${total} total records in system`}
        icon={Box}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowScanner(s => !s)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition-all ${
                showScanner
                  ? 'bg-slate-900 text-white border-slate-900 shadow-[0_10px_22px_rgba(15,23,42,0.16)]'
                  : 'bg-white text-sky-700 border-sky-200 hover:bg-sky-50'
              }`}
            >
              <Scan className="w-3.5 h-3.5" />
              {showScanner ? 'Scanner On' : 'Scan to Find'}
            </button>

            {selected.size > 0 && (
              <div className="flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 animate-in">
                <span className="text-xs font-bold text-sky-700">{selected.size} selected</span>
                <button onClick={() => setBulkModal(true)} className="btn-primary btn-sm !rounded-full">
                  <RefreshCw className="w-3 h-3" /> Bulk Status
                </button>
                <button onClick={() => setSelected(new Set())} className="p-1 text-sky-400 hover:text-sky-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        }
      />

      {showScanner && (
        <BarcodeScanner
          onScan={handleScan}
          scanning={scanning}
          lastScanned={lastScanned}
        />
      )}

      <div className="card-compact mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="relative col-span-2 sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="input pl-10 w-full text-sm" 
              placeholder="Search AWB, client, consignee…"
              value={filters.q} onChange={e => setFilter('q', e.target.value)} />
          </div>
          <select className="input text-sm" 
            value={filters.status} onChange={e => setFilter('status', e.target.value)}>
            <option value="">All statuses</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <input type="date" className="input text-sm" 
            value={filters.date_from} onChange={e => setFilter('date_from', e.target.value)} />
          <input type="date" className="input text-sm" 
            value={filters.date_to} onChange={e => setFilter('date_to', e.target.value)} />
          <div className="flex gap-2">
            <button onClick={load} className="btn-primary flex-1 !rounded-2xl text-sm">
              <Filter className="w-3.5 h-3.5" /> Filter
            </button>
            {hasFilters && (
              <button onClick={clearFilters} className="w-10 flex items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {shipments.length > 0 && (
        <div className="card-compact mb-3 flex flex-wrap gap-4 text-xs text-slate-500 font-medium px-4 py-3">
          <span className="flex items-center gap-1"><Box size={12} /> <strong>{shipments.length}</strong> shown</span>
          <span>💰 <strong>{fmt(totalAmt)}</strong></span>
          <span>⚖️ <strong>{totalWt.toFixed(1)} kg</strong></span>
          <span className="ml-auto italic">Click row to select · Status badge to quick update</span>
        </div>
      )}

      {loading ? <SkeletonTable rows={10} cols={7} /> : shipments.length === 0 ? (
        <EmptyState icon="📭" title="No shipments found" description="Try adjusting your filters" />
      ) : (
        <div className="table-shell">
          <table className="tbl w-full border-collapse">
            <thead className="table-head">
              <tr>
                <th className="w-10 p-3">
                  <button onClick={toggleAll} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    {selected.size === shipments.length
                      ? <CheckSquare className="w-4 h-4 text-orange-500" />
                      : <Square className="w-4 h-4 text-slate-300" />}
                  </button>
                </th>
                <th className="text-left p-3">Date / AWB</th>
                <th className="text-left p-3">Client</th>
                <th className="text-left p-3">Recipient / Dest.</th>
                <th className="text-left p-3">Courier</th>
                <th className="text-right p-3">Wt / Amt</th>
                <th className="text-center p-3">Status</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {shipments.map(s => (
                <tr
                  key={s.id}
                  ref={el => rowRefs.current[s.id] = el}
                  className={`table-row cursor-pointer group ${
                    selected.has(s.id) ? 'bg-orange-50/50 dark:bg-orange-900/10' :
                    highlightId === s.id ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
                  }`}
                  onClick={() => toggleSelect(s.id)}
                >
                  <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                    <button onClick={() => toggleSelect(s.id)} className="p-1 transition-transform active:scale-90">
                      {selected.has(s.id)
                        ? <CheckSquare className="w-4 h-4 text-orange-500" />
                        : <Square className="w-4 h-4 text-slate-200 group-hover:text-slate-300" />}
                    </button>
                  </td>
                  <td className="p-3">
                    <div className="text-[10px] text-slate-400 font-bold mb-0.5">{s.date}</div>
                    <div className={`font-mono font-black text-sm ${highlightId === s.id ? 'text-yellow-600' : 'text-slate-700 dark:text-slate-200'}`}>
                      {s.awb}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{s.clientCode}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{s.client?.company}</div>
                  </td>
                  <td className="p-3">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[140px]">{s.consignee}</div>
                    <div className="text-[10px] text-slate-400">📍 {s.destination}</div>
                  </td>
                  <td className="p-3">
                    <CourierBadge name={s.courier} />
                    <div className="text-[10px] text-slate-400 uppercase tracking-tight ml-8">{s.service}</div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{fmt(s.amount)}</div>
                    <div className="text-[10px] text-slate-400">{s.weight} kg</div>
                  </td>
                  <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                    <QuickStatus shipment={s} onUpdate={handleQuickStatusUpdate} />
                  </td>
                  <td className="p-3 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1 opacity-30 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setTimeline(s)} className="p-2 text-slate-400 hover:text-purple-500 hover:bg-purple-50 rounded-xl transition-colors">
                        <Clock className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditShip(s)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(s)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Floating Bulk Action Toolbar */}
      {selected.size > 0 && (
        <div className="sticky bottom-6 flex justify-center z-30 pointer-events-none w-full animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-white border border-slate-200 shadow-[0_22px_50px_rgba(15,23,42,0.14)] rounded-[24px] p-2.5 flex items-center gap-4 pointer-events-auto">
            
            <div className="flex items-center gap-3 pl-3 pr-4 border-r border-slate-200 dark:border-slate-800">
              <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold shadow-lg shadow-orange-500/30">
                {selected.size}
              </div>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Selected</span>
            </div>
            
            <div className="flex gap-2 pr-1">
              <button 
                onClick={() => setBulkModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all"
              >
                <Edit2 className="w-4 h-4 text-orange-500" /> Update Status
              </button>
              
              <button 
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-all"
                onClick={() => toast.info('Label Generation coming soon')}
              >
                <FileText className="w-4 h-4 text-blue-500" /> Print Labels
              </button>

              <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-2 self-center" />

              <button 
                onClick={() => setSelected(new Set())}
                title="Clear Selection"
                className="w-9 h-9 flex items-center justify-center bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-500 rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {scannedShip && (
        <ScannedShipmentModal
          shipment={scannedShip}
          onClose={() => setScannedShip(null)}
          onStatusUpdate={(id, status) => {
            handleQuickStatusUpdate(id, status);
            setScannedShip(null);
          }}
          toast={toast}
        />
      )}

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

      {timeline && <TimelineModal shipment={timeline} onClose={() => setTimeline(null)} />}

      {editShip && (
        <Modal open onClose={() => setEditShip(null)} title={`Edit Shipment — ${editShip.awb}`}
          footer={<div className="flex gap-2">
            <button onClick={() => setEditShip(null)} className="flex-1 px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors">Cancel</button>
            <button onClick={() => document.getElementById('shipment-form-submit')?.click()} disabled={editLoading} 
              className="flex-1 bg-slate-900 dark:bg-orange-500 text-white rounded-xl px-4 py-2 text-sm font-bold shadow-lg shadow-orange-500/20">
              {editLoading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>}
        >
          <ShipmentForm initialData={editShip} onSubmit={handleEdit} submitLabel="Save Changes" />
        </Modal>
      )}
    </div>
  );
}
