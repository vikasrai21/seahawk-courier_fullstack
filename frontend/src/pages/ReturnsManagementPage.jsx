import { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Search, CheckCircle2, XCircle, Truck, ArrowRight, MapPin, Phone } from 'lucide-react';
import api from '../services/api';

const STATUS_CONFIG = {
  PENDING:             { label: 'Pending',            bg: 'bg-amber-50',   text: 'text-amber-700',   ring: 'ring-amber-200/50' },
  APPROVED:            { label: 'Approved',           bg: 'bg-blue-50',    text: 'text-blue-700',    ring: 'ring-blue-200/50' },
  LABEL_READY:         { label: 'Label Ready',        bg: 'bg-teal-50',    text: 'text-teal-700',    ring: 'ring-teal-200/50' },
  PICKUP_BOOKED:       { label: 'Pickup Booked',      bg: 'bg-indigo-50',  text: 'text-indigo-700',  ring: 'ring-indigo-200/50' },
  IN_TRANSIT:          { label: 'In Transit',         bg: 'bg-violet-50',  text: 'text-violet-700',  ring: 'ring-violet-200/50' },
  RECEIVED:            { label: 'Received',           bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200/50' },
  RETURNED_TO_CLIENT:  { label: 'Returned',           bg: 'bg-green-50',   text: 'text-green-700',   ring: 'ring-green-200/50' },
  REJECTED:            { label: 'Rejected',           bg: 'bg-red-50',     text: 'text-red-700',     ring: 'ring-red-200/50' },
};

const RETURN_METHODS = {
  PICKUP: 'Doorstep Pickup',
  SELF_SHIP: 'Self-ship (Prepaid Label)',
};

function Badge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${cfg.bg} ${cfg.text} ring-1 ${cfg.ring}`}>{cfg.label}</span>;
}

function StatPill({ label, value, color = 'slate' }) {
  return (
    <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border border-${color}-100 bg-${color}-50/50`}>
      <span className={`text-xl font-black text-${color}-700`}>{value}</span>
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function formatTimelineAction(action) {
  return String(action || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// ── Detail Modal ──────────────────────────────────────────────────────────
function DetailModal({ ret, timeline, timelineLoading, onClose, onAction, actionLoading }) {
  if (!ret) return null;
  const method = String(ret.returnMethod || 'PICKUP').trim().toUpperCase() === 'SELF_SHIP' ? 'SELF_SHIP' : 'PICKUP';
  const isSelfShip = method === 'SELF_SHIP';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <RotateCcw size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Return #{ret.id}</h3>
              <p className="text-xs text-slate-500">AWB: {ret.originalAwb}</p>
            </div>
          </div>
          <Badge status={ret.status} />
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Original Shipment */}
          <div className="bg-slate-50 rounded-2xl p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Original Shipment</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-400 text-xs">Consignee:</span> <span className="font-medium">{ret.shipment?.consignee || '—'}</span></div>
              <div><span className="text-slate-400 text-xs">Destination:</span> <span className="font-medium">{ret.shipment?.destination || '—'}</span></div>
              <div><span className="text-slate-400 text-xs">Courier:</span> <span className="font-medium">{ret.shipment?.courier || '—'}</span></div>
              <div><span className="text-slate-400 text-xs">Weight:</span> <span className="font-medium">{ret.shipment?.weight || 0} kg</span></div>
              <div><span className="text-slate-400 text-xs">Client:</span> <span className="font-medium">{ret.client?.company || ret.clientCode}</span></div>
              <div><span className="text-slate-400 text-xs">Date:</span> <span className="font-medium">{ret.shipment?.date || '—'}</span></div>
            </div>
          </div>

          {/* Return Info */}
          <div className="bg-amber-50/50 rounded-2xl p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Return Details</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-slate-400 text-xs">Reason:</span> <span className="font-medium capitalize">{ret.reason?.replace(/_/g, ' ')}</span></div>
              <div><span className="text-slate-400 text-xs">Method:</span> <span className="font-medium">{RETURN_METHODS[method]}</span></div>
              <div><span className="text-slate-400 text-xs">Requested:</span> <span className="font-medium">{new Date(ret.createdAt).toLocaleDateString('en-IN')}</span></div>
            </div>
            {ret.reasonDetail && <p className="mt-2 text-sm text-slate-600 bg-white rounded-xl p-3">{ret.reasonDetail}</p>}
          </div>

          {/* Pickup Address */}
          <div className="bg-blue-50/50 rounded-2xl p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><MapPin size={12} /> Pickup Address</p>
            <div className="text-sm space-y-1">
              <p className="font-medium">{ret.pickupAddress || '—'}</p>
              <p className="text-slate-500">{[ret.pickupCity, ret.pickupState, ret.pickupPincode].filter(Boolean).join(', ')}</p>
              {ret.pickupPhone && <p className="text-slate-500 flex items-center gap-1"><Phone size={12} /> {ret.pickupPhone}</p>}
            </div>
          </div>

          {/* Reverse AWB */}
          {ret.reverseAwb && (
            <div className="bg-indigo-50/50 rounded-2xl p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Reverse Shipment</p>
              <div className="flex items-center gap-3">
                <ArrowRight size={16} className="text-indigo-500" />
                <span className="font-bold text-indigo-700">{ret.reverseAwb}</span>
                <span className="text-xs text-slate-500">via {ret.reverseCourier}</span>
              </div>
              {ret.labelUrl && (
                <a
                  href={ret.labelUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex mt-3 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 transition-colors"
                >
                  Open Label
                </a>
              )}
            </div>
          )}

          {/* Admin Notes */}
          {ret.adminNotes && (
            <div className="bg-slate-50 rounded-2xl p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Admin Notes</p>
              <p className="text-sm text-slate-600">{ret.adminNotes}</p>
            </div>
          )}

          <div className="bg-slate-50 rounded-2xl p-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Timeline</p>
            {timelineLoading ? (
              <p className="text-sm text-slate-400">Loading timeline...</p>
            ) : timeline.length === 0 ? (
              <p className="text-sm text-slate-400">No timeline events found.</p>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {timeline.map((event) => (
                  <div key={event.id} className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-xs font-bold text-slate-700">{formatTimelineAction(event.action)}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {new Date(event.createdAt).toLocaleString('en-IN')} {event.userEmail ? `• ${event.userEmail}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {ret.status === 'PENDING' && (
          <div className="p-6 border-t border-slate-100 flex gap-3">
            <button
              onClick={() => onAction('reject')}
              disabled={actionLoading}
              className="flex-1 py-2.5 rounded-xl border-2 border-red-200 text-red-600 text-sm font-bold hover:bg-red-50 transition-all disabled:opacity-50"
            >
              <XCircle size={16} className="inline mr-1.5" />Reject
            </button>
            <button
              onClick={() => onAction('approve')}
              disabled={actionLoading}
              className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-bold hover:bg-blue-600 transition-all disabled:opacity-50"
            >
              <CheckCircle2 size={16} className="inline mr-1.5" />Approve
            </button>
            <button
              onClick={() => onAction('approve-and-book')}
              disabled={actionLoading}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all disabled:opacity-50"
            >
              <Truck size={16} className="inline mr-1.5" />{isSelfShip ? 'Approve & Generate Label' : 'Approve & Book Pickup'}
            </button>
          </div>
        )}
        {ret.status === 'APPROVED' && (
          <div className="p-6 border-t border-slate-100">
            <button
              onClick={() => onAction(isSelfShip ? 'generate-label' : 'book-pickup')}
              disabled={actionLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all disabled:opacity-50"
            >
              <Truck size={16} className="inline mr-2" />{actionLoading ? (isSelfShip ? 'Generating...' : 'Booking...') : (isSelfShip ? 'Generate Prepaid Label' : 'Book Reverse Pickup')}
            </button>
          </div>
        )}
        {['LABEL_READY', 'PICKUP_BOOKED', 'IN_TRANSIT', 'RECEIVED'].includes(ret.status) && (
          <div className="p-6 border-t border-slate-100 flex gap-3">
            {ret.reverseAwb && (
              <button
                onClick={() => onAction('sync-tracking')}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl border border-indigo-200 text-indigo-700 text-sm font-bold hover:bg-indigo-50 transition-all disabled:opacity-50"
              >
                Sync Tracking
              </button>
            )}
            {['LABEL_READY', 'PICKUP_BOOKED'].includes(ret.status) && (
              <button onClick={() => onAction('status-IN_TRANSIT')} disabled={actionLoading} className="flex-1 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-bold hover:bg-violet-600 transition-all disabled:opacity-50">Mark In Transit</button>
            )}
            {ret.status === 'IN_TRANSIT' && (
              <button onClick={() => onAction('status-RECEIVED')} disabled={actionLoading} className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-all disabled:opacity-50">Mark Received at Hub</button>
            )}
            {ret.status === 'RECEIVED' && (
              <button onClick={() => onAction('status-RETURNED_TO_CLIENT')} disabled={actionLoading} className="flex-1 py-2.5 rounded-xl bg-green-500 text-white text-sm font-bold hover:bg-green-600 transition-all disabled:opacity-50">Mark Returned to Client</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function ReturnsManagementPage({ toast }) {
  const [returns, setReturns] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      params.set('limit', '50');
      const [retRes, statsRes] = await Promise.all([
        api.get(`/returns?${params}`),
        api.get('/returns/stats'),
      ]);
      setReturns(retRes.data?.items || []);
      setStats(statsRes.data || {});
    } catch { /* ignore */ }
    setLoading(false);
  }, [statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  const loadTimeline = useCallback(async (returnId) => {
    if (!returnId) {
      setTimeline([]);
      return;
    }
    setTimelineLoading(true);
    try {
      const data = await api.get(`/returns/${returnId}/timeline?limit=25`);
      setTimeline(data.data?.items || []);
    } catch {
      setTimeline([]);
    } finally {
      setTimelineLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedReturn?.id) {
      setTimeline([]);
      return;
    }
    loadTimeline(selectedReturn.id);
  }, [selectedReturn?.id, loadTimeline]);

  const handleAction = async (action) => {
    if (!selectedReturn) return;
    setActionLoading(true);
    try {
      const id = selectedReturn.id;
      if (action === 'approve') {
        await api.post(`/returns/${id}/approve`, {});
        toast?.({ type: 'success', message: 'Return approved' });
      } else if (action === 'approve-and-book') {
        await api.post(`/returns/${id}/approve`, { autoBook: true });
        toast?.({ type: 'success', message: 'Return approved & reverse pickup booked!' });
      } else if (action === 'reject') {
        await api.post(`/returns/${id}/reject`, { adminNotes: 'Rejected by admin' });
        toast?.({ type: 'success', message: 'Return rejected' });
      } else if (action === 'book-pickup') {
        await api.post(`/returns/${id}/book-pickup`);
        toast?.({ type: 'success', message: 'Reverse pickup booked successfully' });
      } else if (action === 'generate-label') {
        await api.post(`/returns/${id}/generate-label`);
        toast?.({ type: 'success', message: 'Prepaid return label generated successfully' });
      } else if (action === 'sync-tracking') {
        await api.post(`/returns/${id}/sync-tracking`, {});
        toast?.({ type: 'success', message: 'Reverse tracking synced' });
      } else if (action.startsWith('status-')) {
        const newStatus = action.replace('status-', '');
        await api.patch(`/returns/${id}/status`, { status: newStatus });
        toast?.({ type: 'success', message: `Status updated to ${newStatus}` });
      }
      setSelectedReturn(null);
      setTimeline([]);
      load();
    } catch (err) {
      toast?.({ type: 'error', message: err.response?.data?.message || err.message });
    }
    setActionLoading(false);
  };

  const FILTER_TABS = [
    { value: '',       label: 'All',       count: stats.total },
    { value: 'PENDING', label: 'Pending',   count: stats.pending },
    { value: 'APPROVED', label: 'Approved', count: stats.approved },
    { value: 'LABEL_READY', label: 'Label Ready', count: stats.labelReady },
    { value: 'PICKUP_BOOKED', label: 'Booked', count: stats.pickupBooked },
    { value: 'IN_TRANSIT', label: 'Transit', count: stats.inTransit },
    { value: 'RECEIVED', label: 'Received', count: stats.received },
    { value: 'RETURNED_TO_CLIENT', label: 'Completed', count: stats.returnedToClient },
    { value: 'REJECTED', label: 'Rejected', count: stats.rejected },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
              <RotateCcw size={20} strokeWidth={2.5} />
            </div>
            Returns Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">Review, approve, and manage reverse pickups</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        <StatPill label="Pending" value={stats.pending || 0} color="amber" />
        <StatPill label="Approved" value={stats.approved || 0} color="blue" />
        <StatPill label="Label Ready" value={stats.labelReady || 0} color="teal" />
        <StatPill label="Pickups Booked" value={stats.pickupBooked || 0} color="indigo" />
        <StatPill label="In Transit" value={stats.inTransit || 0} color="violet" />
        <StatPill label="Completed" value={stats.returnedToClient || 0} color="emerald" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by AWB, client code..." className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all" />
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 overflow-x-auto">
          {FILTER_TABS.map(t => (
            <button key={t.value} onClick={() => setStatusFilter(t.value)} className={`whitespace-nowrap px-3 py-2 rounded-xl text-xs font-bold transition-all ${statusFilter === t.value ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
              {t.label} {t.count > 0 && <span className="ml-1 text-[10px] opacity-60">({t.count})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading returns...</div>
      ) : returns.length === 0 ? (
        <div className="text-center py-20">
          <RotateCcw size={48} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 font-medium">No return requests found</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">ID</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Client</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Original AWB</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Consignee</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Reason</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Method</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Status</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Reverse AWB</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {returns.map(ret => (
                <tr key={ret.id} onClick={() => setSelectedReturn(ret)} className="border-b border-slate-50 hover:bg-orange-50/30 cursor-pointer transition-colors">
                  <td className="px-5 py-3.5 text-sm font-bold text-slate-700">#{ret.id}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{ret.client?.company || ret.clientCode}</td>
                  <td className="px-5 py-3.5 text-sm font-mono text-slate-700">{ret.originalAwb}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{ret.shipment?.consignee || '—'}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-500 capitalize">{ret.reason?.replace(/_/g, ' ')}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-500">{RETURN_METHODS[String(ret.returnMethod || 'PICKUP').trim().toUpperCase() === 'SELF_SHIP' ? 'SELF_SHIP' : 'PICKUP']}</td>
                  <td className="px-5 py-3.5"><Badge status={ret.status} /></td>
                  <td className="px-5 py-3.5 text-sm font-mono text-indigo-600">{ret.reverseAwb || '—'}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-400">{new Date(ret.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      <DetailModal
        ret={selectedReturn}
        timeline={timeline}
        timelineLoading={timelineLoading}
        onClose={() => setSelectedReturn(null)}
        onAction={handleAction}
        actionLoading={actionLoading}
      />
    </div>
  );
}
