import { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Package, Search, CheckCircle2, Clock, Truck, XCircle, MapPin, ArrowRight, ExternalLink, MessageCircle } from 'lucide-react';
import api from '../../services/api';

const STATUS_CONFIG = {
  PENDING:             { label: 'Pending',            color: 'amber',   icon: Clock },
  APPROVED:            { label: 'Approved',           color: 'blue',    icon: CheckCircle2 },
  LABEL_READY:         { label: 'Label Ready',        color: 'teal',    icon: CheckCircle2 },
  PICKUP_BOOKED:       { label: 'Pickup Booked',      color: 'indigo',  icon: Truck },
  IN_TRANSIT:          { label: 'In Transit',         color: 'violet',  icon: Truck },
  RECEIVED:            { label: 'Received',           color: 'emerald', icon: CheckCircle2 },
  RETURNED_TO_CLIENT:  { label: 'Returned to Client', color: 'green',   icon: CheckCircle2 },
  REJECTED:            { label: 'Rejected',           color: 'red',     icon: XCircle },
};

const RETURN_METHODS = {
  PICKUP: 'Doorstep Pickup',
  SELF_SHIP: 'Self-ship (Prepaid Label)',
};

function normalizeMethod(method) {
  return String(method || 'PICKUP').trim().toUpperCase() === 'SELF_SHIP' ? 'SELF_SHIP' : 'PICKUP';
}

function buildWhatsAppShareLink(ret) {
  const phone = String(ret?.pickupPhone || '').replace(/\D/g, '');
  if (!phone || !ret?.labelUrl) return null;
  const message = [
    `Sea Hawk return label`,
    `Original AWB: ${ret.originalAwb}`,
    ret.reverseAwb ? `Reverse AWB: ${ret.reverseAwb}` : null,
    `Download label: ${ret.labelUrl}`,
    'Please pack the item and hand over at any nearby courier drop-off point.',
  ].filter(Boolean).join('\n');
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

const REASONS = [
  { value: 'customer_return', label: 'Customer Return' },
  { value: 'damaged',         label: 'Damaged Product' },
  { value: 'wrong_item',      label: 'Wrong Item Delivered' },
  { value: 'size_exchange',   label: 'Size / Exchange' },
  { value: 'quality_issue',   label: 'Quality Issue' },
  { value: 'other',           label: 'Other' },
];

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-${cfg.color}-50 text-${cfg.color}-700 ring-1 ring-${cfg.color}-200/50`}>
      <Icon size={13} strokeWidth={2.5} />
      {cfg.label}
    </span>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className={`rounded-2xl border border-${color}-100 bg-${color}-50/50 p-4 text-center`}>
      <p className={`text-2xl font-black text-${color}-700`}>{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">{label}</p>
    </div>
  );
}

// ── Return Request Form Modal ─────────────────────────────────────────────
function ReturnForm({ shipment, onClose, onSubmit }) {
  const [reason, setReason] = useState('');
  const [returnMethod, setReturnMethod] = useState('PICKUP');
  const [reasonDetail, setReasonDetail] = useState('');
  const [pickupAddress, setPickupAddress] = useState(shipment.destination || '');
  const [pickupCity, setPickupCity] = useState('');
  const [pickupState, setPickupState] = useState('');
  const [pickupPincode, setPickupPincode] = useState(shipment.pincode || '');
  const [pickupPhone, setPickupPhone] = useState(shipment.phone || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return;
    setSubmitting(true);
    try {
      await onSubmit({
        shipmentId: shipment.id,
        returnMethod,
        reason, reasonDetail,
        pickupAddress, pickupCity, pickupState, pickupPincode, pickupPhone,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all';
  const labelCls = 'text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <RotateCcw size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Request Return</h3>
              <p className="text-xs text-slate-500">AWB: {shipment.awb} • {shipment.consignee}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelCls}>Reason for Return *</label>
            <select value={reason} onChange={e => setReason(e.target.value)} className={inputCls} required>
              <option value="">Select a reason...</option>
              {REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Additional Details</label>
            <textarea value={reasonDetail} onChange={e => setReasonDetail(e.target.value)} className={inputCls} rows={2} placeholder="Optional — describe the issue..." />
          </div>

          <div className="bg-emerald-50/50 rounded-2xl p-4 space-y-2">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Return Method</p>
            <label className="flex items-start gap-3 rounded-xl bg-white p-3 border border-emerald-100 cursor-pointer">
              <input
                type="radio"
                name="returnMethod"
                value="PICKUP"
                checked={returnMethod === 'PICKUP'}
                onChange={e => setReturnMethod(e.target.value)}
                className="mt-0.5"
              />
              <span>
                <span className="block text-sm font-bold text-slate-800">Doorstep Pickup</span>
                <span className="block text-xs text-slate-500">Sea Hawk schedules reverse pickup from customer address.</span>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-xl bg-white p-3 border border-emerald-100 cursor-pointer">
              <input
                type="radio"
                name="returnMethod"
                value="SELF_SHIP"
                checked={returnMethod === 'SELF_SHIP'}
                onChange={e => setReturnMethod(e.target.value)}
                className="mt-0.5"
              />
              <span>
                <span className="block text-sm font-bold text-slate-800">Self-ship (Prepaid Label)</span>
                <span className="block text-xs text-slate-500">Generate prepaid label and drop at nearby courier point.</span>
              </span>
            </label>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <MapPin size={14} /> Pickup Address (Customer)
            </p>
            <input value={pickupAddress} onChange={e => setPickupAddress(e.target.value)} className={inputCls} placeholder="Street address" />
            <div className="grid grid-cols-2 gap-3">
              <input value={pickupCity} onChange={e => setPickupCity(e.target.value)} className={inputCls} placeholder="City" />
              <input value={pickupState} onChange={e => setPickupState(e.target.value)} className={inputCls} placeholder="State" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input value={pickupPincode} onChange={e => setPickupPincode(e.target.value)} className={inputCls} placeholder="Pincode" />
              <input value={pickupPhone} onChange={e => setPickupPhone(e.target.value)} className={inputCls} placeholder="Phone" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
            <button type="submit" disabled={submitting || !reason} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-bold shadow-lg shadow-orange-500/20 hover:shadow-orange-500/40 transition-all disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Request Return'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function ClientReturnsPage({ toast }) {
  const [tab, setTab] = useState('returns'); // 'returns' | 'eligible'
  const [returns, setReturns] = useState([]);
  const [eligible, setEligible] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const statusFilter = '';
  const [returnForm, setReturnForm] = useState(null); // shipment to return

  const loadReturns = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      const res = await api.get(`/portal/returns?${params}`);
      setReturns(res.data?.items || []);
    } catch { /* ignore */ }
  }, [search]);

  const loadEligible = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      const res = await api.get(`/portal/returns/eligible?${params}`);
      setEligible(res.data?.items || []);
    } catch { /* ignore */ }
  }, [search]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadReturns(), loadEligible()]).finally(() => setLoading(false));
  }, [loadReturns, loadEligible]);

  const handleSubmitReturn = async (data) => {
    try {
      await api.post('/portal/returns', data);
      toast?.({ type: 'success', message: 'Return request submitted! Our team will process it shortly.' });
      setReturnForm(null);
      setTab('returns');
      loadReturns();
      loadEligible();
    } catch (err) {
      toast?.({ type: 'error', message: err.response?.data?.message || err.message });
    }
  };

  const pendingCount = returns.filter(r => r.status === 'PENDING').length;
  const activeCount = returns.filter(r => ['APPROVED', 'LABEL_READY', 'PICKUP_BOOKED', 'IN_TRANSIT'].includes(r.status)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
              <RotateCcw size={20} strokeWidth={2.5} />
            </div>
            Returns
          </h1>
          <p className="text-sm text-slate-500 mt-1">Request and track product returns</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Pending" value={pendingCount} color="amber" />
        <StatCard label="Active" value={activeCount} color="blue" />
        <StatCard label="Completed" value={returns.filter(r => r.status === 'RETURNED_TO_CLIENT').length} color="emerald" />
        <StatCard label="Total" value={returns.length} color="slate" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1">
        <button onClick={() => setTab('returns')} className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${tab === 'returns' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
          My Returns {returns.length > 0 && <span className="ml-1.5 text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{returns.length}</span>}
        </button>
        <button onClick={() => setTab('eligible')} className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${tab === 'eligible' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
          Request Return {eligible.length > 0 && <span className="ml-1.5 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{eligible.length}</span>}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={tab === 'returns' ? 'Search by AWB...' : 'Search delivered shipments...'} className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition-all" />
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading...</div>
      ) : tab === 'returns' ? (
        /* ── Returns List ── */
        returns.length === 0 ? (
          <div className="text-center py-20">
            <RotateCcw size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">No return requests yet</p>
            <p className="text-xs text-slate-400 mt-1">Switch to "Request Return" to initiate one</p>
          </div>
        ) : (
          <div className="space-y-3">
            {returns.map((ret) => {
              const method = normalizeMethod(ret.returnMethod);
              const waLink = buildWhatsAppShareLink(ret);
              return (
                <div key={ret.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-bold text-slate-900">AWB: {ret.originalAwb}</span>
                        <StatusBadge status={ret.status} />
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                          {RETURN_METHODS[method]}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span>{ret.shipment?.consignee || '—'}</span>
                        <span>•</span>
                        <span>{ret.shipment?.destination || '—'}</span>
                        <span>•</span>
                        <span className="capitalize">{ret.reason?.replace(/_/g, ' ')}</span>
                      </div>
                      {ret.reverseAwb && (
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          <ArrowRight size={12} className="text-indigo-500" />
                          <span className="font-medium text-indigo-600">Reverse AWB: {ret.reverseAwb}</span>
                          <span className="text-slate-400">({ret.reverseCourier})</span>
                        </div>
                      )}
                      {method === 'SELF_SHIP' && ret.labelUrl && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <a
                            href={ret.labelUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition-colors"
                          >
                            <ExternalLink size={12} />
                            Download Prepaid Label
                          </a>
                          {waLink && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                            >
                              <MessageCircle size={12} />
                              Share on WhatsApp
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      {new Date(ret.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* ── Eligible Shipments ── */
        eligible.length === 0 ? (
          <div className="text-center py-20">
            <Package size={48} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">No eligible shipments</p>
            <p className="text-xs text-slate-400 mt-1">Only delivered shipments without active returns are shown</p>
          </div>
        ) : (
          <div className="space-y-3">
            {eligible.map(s => (
              <div key={s.id} className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-all group">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900">{s.consignee || 'Customer'}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>AWB: {s.awb}</span>
                      <span>•</span>
                      <span>{s.destination || '—'}</span>
                      <span>•</span>
                      <span>{s.courier}</span>
                      <span>•</span>
                      <span>{s.date}</span>
                    </div>
                  </div>
                  <button onClick={() => setReturnForm(s)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 text-orange-600 text-xs font-bold hover:bg-orange-100 transition-all group-hover:shadow-sm">
                    <RotateCcw size={14} strokeWidth={2.5} />
                    Return
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Return Request Form Modal */}
      {returnForm && (
        <ReturnForm
          shipment={returnForm}
          onClose={() => setReturnForm(null)}
          onSubmit={handleSubmitReturn}
        />
      )}
    </div>
  );
}
