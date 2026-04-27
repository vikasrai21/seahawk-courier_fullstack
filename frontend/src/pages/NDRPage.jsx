import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { EmptyState } from '../components/ui/EmptyState';
import { AlertTriangle, RefreshCw, ChevronRight, Search, MessageCircle } from 'lucide-react';
import api from '../services/api';
import { Modal } from '../components/ui/Modal';

const REASONS = [
  'Customer not available',
  'Wrong address',
  'Address not found',
  'Delivery refused',
  'Customer demand postpone',
  'Security restriction',
  'Office closed',
  'Holiday / closed',
  'Package damaged',
  'Other',
];

const ACTION_LABELS = {
  PENDING:        { label:'Pending',        color:'yellow' },
  REATTEMPT:      { label:'Reattempt',      color:'blue'   },
  UPDATE_ADDRESS: { label:'Update Address', color:'purple' },
  RTO:            { label:'RTO',            color:'red'    },
  RESOLVED:       { label:'Resolved',       color:'green'  },
};

const fmt = (v) => ACTION_LABELS[v] || { label: v, color:'gray' };

/* ── WhatsApp message builder ──────────────────────────────────────────── */
function buildWhatsAppMessage(ndr) {
  const consignee = ndr.shipment?.consignee || 'Customer';
  const awb = ndr.awb || '';
  const reason = ndr.reason || 'delivery issue';
  const destination = ndr.shipment?.destination || '';
  const courier = ndr.shipment?.courier || '';
  const attempt = ndr.attemptNo || 1;
  const trackUrl = `${window.location.origin}/track/${encodeURIComponent(awb)}`;

  return (
    `Hi ${consignee},\n\n` +
    `Your Sea Hawk shipment *${awb}*${courier ? ` (via ${courier})` : ''} could not be delivered.\n\n` +
    `📋 *Reason:* ${reason}\n` +
    `📍 *Destination:* ${destination}\n` +
    `🔄 *Attempt:* #${attempt}\n\n` +
    `When would you be available for re-delivery? Please reply with a convenient date and time.\n\n` +
    `🔗 Track here: ${trackUrl}\n\n` +
    `— Sea Hawk Courier & Cargo`
  );
}

function getConsigneePhone(ndr) {
  // Try to extract phone from shipment data
  const phone = ndr.shipment?.phone || ndr.shipment?.consigneePhone || ndr.shipment?.mobile || '';
  // Clean to digits only, ensure it has country code
  const cleaned = phone.replace(/\D/g, '');
  if (!cleaned) return '';
  // If it starts with 91 and is 12 digits, or 10 digits (Indian mobile)
  if (cleaned.length === 10) return '91' + cleaned;
  if (cleaned.length === 12 && cleaned.startsWith('91')) return cleaned;
  return cleaned;
}

function openWhatsApp(ndr) {
  const phone = getConsigneePhone(ndr);
  const msg = encodeURIComponent(buildWhatsAppMessage(ndr));
  const url = phone
    ? `https://wa.me/${phone}?text=${msg}`
    : `https://wa.me/?text=${msg}`;
  window.open(url, '_blank');
}

export default function NDRPage({ toast }) {
  const [ndrs,       setNdrs]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [stats,      setStats]      = useState(null);
  const [page,       setPage]       = useState(1);
  const [filter,     setFilter]     = useState('');
  const [search,     setSearch]     = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [selected,   setSelected]   = useState(null);
  const [newNDR,     setNewNDR]     = useState(false);
  const [actionForm, setActionForm] = useState({ action:'', newAddress:'', notes:'' });
  const [saving,     setSaving]     = useState(false);

  const loadStats = () =>
    api.get('/ndr/stats').then(r => setStats(r.data)).catch(()=>{});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page, limit:25, ...(filter && { action:filter }) });
      const r = await api.get(`/ndr?${p}`);
      const data = r.data;
      setNdrs(data?.ndrs || data?.items || data || []);
    } catch(e) { toast?.(e.message,'error'); }
    finally { setLoading(false); }
  }, [page, filter]);

  useEffect(() => { load(); loadStats(); }, [load]);

  const saveAction = async () => {
    if (!actionForm.action) { toast?.('Select an action','error'); return; }
    setSaving(true);
    try {
      await api.patch(`/ndr/${selected.id}`, actionForm);
      toast?.('NDR updated','success');
      setSelected(null);
      load(); loadStats();
    } catch(e) { toast?.(e.message,'error'); }
    finally { setSaving(false); }
  };

  const filtered = ndrs.filter(n =>
    !debouncedSearch || n.awb?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    n.shipment?.consignee?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const StatCard = ({ label, val, color }) => (
    <div className={`bg-white rounded-xl border border-gray-100 p-4 shadow-sm`}>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-black text-${color}-600`}>{val ?? '—'}</p>
    </div>
  );

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">NDR Management</h1>
          <p className="text-xs text-gray-400 mt-0.5">Non-Delivery Reports — failed deliveries requiring action</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setNewNDR(true)} className="btn-primary btn-sm gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Log NDR
          </button>
          <button onClick={() => { load(); loadStats(); }} className="btn-secondary btn-sm gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <StatCard label="Total NDRs"    val={stats.total}    color="gray"   />
          <StatCard label="Pending"       val={stats.pending}  color="yellow" />
          <StatCard label="RTO Initiated" val={stats.rto}      color="red"    />
          <StatCard label="Resolved"      val={stats.resolved} color="green"  />
        </div>
      )}

      {/* Filter + Search */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 mb-4 flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"/>
          <input className="input pl-8 text-sm h-8" placeholder="AWB or consignee…"
            value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        {['','PENDING','REATTEMPT','UPDATE_ADDRESS','RTO','RESOLVED'].map(v => (
          <button key={v}
            onClick={() => { setFilter(v); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              filter===v ? 'bg-navy-600 text-white border-navy-600' : 'bg-white text-gray-500 border-gray-200 hover:border-navy-400'
            }`}>
            {v || 'All'}
          </button>
        ))}
      </div>

      {/* NDR List */}
      <div className="space-y-2">
        {loading ? (
          <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 animate-spin text-gray-300"/></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="📦"
            title={debouncedSearch ? 'No NDRs match your search' : 'No NDRs found'}
            message={debouncedSearch ? 'Try clearing your search or changing the filter.' : 'All shipments are on track — no delivery exceptions right now.'}
            action={debouncedSearch ? 'Clear search' : undefined}
            onAction={debouncedSearch ? () => setSearch('') : undefined}
          />
        ) : filtered.map(n => {
          const action = fmt(n.action || 'PENDING');
          return (
            <div key={n.id}
              className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex items-start gap-3 hover:border-orange-200 transition-colors cursor-pointer"
              onClick={() => { setSelected(n); setActionForm({ action: n.action||'PENDING', newAddress: n.newAddress||'', notes:'' }); }}>
              <div className={`w-10 h-10 rounded-xl bg-${action.color}-50 flex items-center justify-center shrink-0 mt-0.5`}>
                <AlertTriangle className={`w-5 h-5 text-${action.color}-500`}/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-bold text-navy-700">{n.awb}</span>
                  <span className={`badge badge-${action.color} text-[10px]`}>{action.label}</span>
                  {n.attemptNo > 1 && (
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                      Attempt #{n.attemptNo}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 mt-0.5">{n.reason}</p>
                {n.shipment && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {n.shipment.consignee} · {n.shipment.destination} · {n.shipment.courier}
                  </p>
                )}
                {n.description && <p className="text-xs text-gray-400 mt-0.5 italic">"{n.description}"</p>}
                <p className="text-[10px] text-gray-300 mt-1">
                  {new Date(n.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
                </p>
              </div>
              {/* Inline WhatsApp quick-action */}
              <button
                title="Resolve via WhatsApp"
                onClick={(e) => { e.stopPropagation(); openWhatsApp(n); }}
                className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 border border-green-200 transition-all shrink-0 mt-1"
              >
                <MessageCircle className="w-4 h-4" />
              </button>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0 mt-3"/>
            </div>
          );
        })}
      </div>

      {/* Action Modal */}
      {selected && (
        <Modal title={`NDR Action — ${selected.awb}`} onClose={() => setSelected(null)}>
          <div className="space-y-4">
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
              <p className="text-sm font-semibold text-orange-700">{selected.reason}</p>
              {selected.shipment && (
                <p className="text-xs text-orange-500 mt-1">
                  {selected.shipment.consignee} · {selected.shipment.destination}
                </p>
              )}
            </div>

            {/* ── WhatsApp Resolve Button ── */}
            <button
              onClick={() => openWhatsApp(selected)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm hover:from-green-600 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              <MessageCircle className="w-4 h-4" />
              Resolve via WhatsApp
            </button>
            <p className="text-[10px] text-center text-gray-400 -mt-2">Opens WhatsApp Web with pre-filled message to consignee — zero cost</p>

            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div className="space-y-1">
                <label className="form-label">Action *</label>
                <select className="input" value={actionForm.action} onChange={e => setActionForm(f=>({...f,action:e.target.value}))}>
                  <option value="">— Select action —</option>
                  <option value="REATTEMPT">🔄 Reattempt Delivery</option>
                  <option value="UPDATE_ADDRESS">📍 Update Delivery Address</option>
                  <option value="RTO">↩️ Return to Origin (RTO)</option>
                  <option value="RESOLVED">✅ Mark Resolved</option>
                </select>
              </div>

              {actionForm.action === 'UPDATE_ADDRESS' && (
                <div className="space-y-1">
                  <label className="form-label">New Delivery Address *</label>
                  <textarea className="input" rows={3} placeholder="Full corrected address…"
                    value={actionForm.newAddress} onChange={e => setActionForm(f=>({...f,newAddress:e.target.value}))}/>
                </div>
              )}

              <div className="space-y-1">
                <label className="form-label">Notes</label>
                <textarea className="input" rows={2} placeholder="Optional notes for the team…"
                  value={actionForm.notes} onChange={e => setActionForm(f=>({...f,notes:e.target.value}))}/>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={() => setSelected(null)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={saveAction} disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving…' : 'Save Action'}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Log New NDR Modal */}
      {newNDR && <CreateNDRModal onClose={() => setNewNDR(false)} toast={toast} onSaved={() => { setNewNDR(false); load(); loadStats(); }} />}
    </div>
  );
}

function CreateNDRModal({ onClose, toast, onSaved }) {
  const [form,   setForm]   = useState({ awb:'', reason: REASONS[0], description:'', attemptNo:1 });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.awb || !form.reason) { toast?.('AWB and reason required','error'); return; }
    setSaving(true);
    try {
      await api.post('/ndr', form);
      toast?.('NDR logged','success');
      onSaved();
    } catch(e) { toast?.(e.message,'error'); }
    finally { setSaving(false); }
  };

  const F = ({ label, children }) => (
    <div className="space-y-1"><label className="form-label">{label}</label>{children}</div>
  );

  return (
    <Modal title="Log NDR Event" onClose={onClose}>
      <div className="space-y-3">
        <F label="AWB Number *">
          <input className="input" placeholder="e.g. 123456789012345678" value={form.awb}
            onChange={e => setForm(f=>({...f,awb:e.target.value}))}/>
        </F>
        <F label="Reason *">
          <select className="input" value={form.reason} onChange={e => setForm(f=>({...f,reason:e.target.value}))}>
            {REASONS.map(r => <option key={r}>{r}</option>)}
          </select>
        </F>
        <F label="Attempt #">
          <input type="number" className="input" min={1} max={5} value={form.attemptNo}
            onChange={e => setForm(f=>({...f,attemptNo:+e.target.value}))}/>
        </F>
        <F label="Description (optional)">
          <textarea className="input" rows={2} placeholder="Additional notes…"
            value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))}/>
        </F>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving…' : 'Log NDR'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
