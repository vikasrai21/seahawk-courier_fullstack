import { useState, useEffect, useCallback } from 'react';
import { Calendar, MapPin, Package, RefreshCw, Plus, User, X } from 'lucide-react';
import api from '../services/api';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  PENDING:   { bg:'bg-yellow-50',  text:'text-yellow-700',  border:'border-yellow-200' },
  CONFIRMED: { bg:'bg-blue-50',    text:'text-blue-700',    border:'border-blue-200'   },
  ASSIGNED:  { bg:'bg-purple-50',  text:'text-purple-700',  border:'border-purple-200' },
  COMPLETED: { bg:'bg-green-50',   text:'text-green-700',   border:'border-green-200'  },
  CANCELLED: { bg:'bg-gray-50',    text:'text-gray-400',    border:'border-gray-200'   },
};

const SLOT_ICONS = { Morning:'🌅', Afternoon:'☀️', Evening:'🌆' };

export default function PickupSchedulerPage({ toast }) {
  const { isAdmin, hasRole } = useAuth();
  const [pickups,   setPickups]  = useState([]);
  const [loading,   setLoading]  = useState(true);
  const [stats,     setStats]    = useState(null);
  const [page,      setPage]     = useState(1);
  const [filter,    setFilter]   = useState('');
  const [dateFilter,setDate]     = useState('');
  const [selected,  setSelected] = useState(null);
  const [showNew,   setShowNew]  = useState(false);
  const [agents,    setAgents]   = useState([]);

  const canAssign = isAdmin || hasRole('OPS_MANAGER');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page, limit:25,
        ...(filter     && { status: filter }),
        ...(dateFilter && { date:   dateFilter }),
      });
      const [r1, r2] = await Promise.all([
        api.get(`/pickups?${p}`),
        api.get('/pickups/stats'),
      ]);
      setPickups(r1.data?.pickups || r1.data || []);
      setStats(r2.data);
    } catch(e) { toast?.(e.message,'error'); }
    finally { setLoading(false); }
  }, [page, filter, dateFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    // Load agents (users with OPS_MANAGER or STAFF role)
    api.get('/auth/users?role=STAFF').then(r => setAgents(r.data||[])).catch(()=>{});
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/pickups/${id}`, { status });
      setPickups(p => p.map(x => x.id===id ? {...x, status} : x));
      toast?.('Status updated','success');
      if (selected?.id === id) setSelected(s => ({...s, status}));
    } catch(e) { toast?.(e.message,'error'); }
  };

  const assignAgent = async (id, agentId) => {
    try {
      await api.patch(`/pickups/${id}`, { assignedAgentId: agentId, status:'ASSIGNED' });
      load();
      toast?.('Agent assigned','success');
      setSelected(null);
    } catch(e) { toast?.(e.message,'error'); }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pickup Scheduler</h1>
          <p className="text-xs text-gray-400 mt-0.5">Manage and assign pickup requests</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowNew(true)} className="btn-primary btn-sm gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Schedule Pickup
          </button>
          <button onClick={load} className="btn-secondary btn-sm gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          {[
            { label:'Total',     val:stats.total,     color:'gray'   },
            { label:'Pending',   val:stats.pending,   color:'yellow' },
            { label:'Confirmed', val:stats.confirmed, color:'blue'   },
            { label:'Completed', val:stats.completed, color:'green'  },
            { label:'Cancelled', val:stats.cancelled, color:'red'    },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm text-center">
              <p className="text-xs text-gray-500">{label}</p>
              <p className={`text-xl font-black text-${color}-600 mt-0.5`}>{val ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 mb-4 flex gap-2 flex-wrap items-center">
        {['','PENDING','CONFIRMED','ASSIGNED','COMPLETED','CANCELLED'].map(v => (
          <button key={v}
            onClick={() => { setFilter(v); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              filter===v ? 'bg-navy-600 text-white border-navy-600' : 'bg-white text-gray-500 border-gray-200 hover:border-navy-400'
            }`}>
            {v || 'All'}
          </button>
        ))}
        <input type="date" className="input text-sm h-8 w-36 ml-auto"
          value={dateFilter} onChange={e=>setDate(e.target.value)}
          placeholder="Filter by date"/>
        {dateFilter && (
          <button onClick={()=>setDate('')} className="btn-secondary btn-sm gap-1">
            <X className="w-3 h-3"/>
          </button>
        )}
      </div>

      {/* Cards grid */}
      {loading ? (
        <div className="flex justify-center py-12"><RefreshCw className="w-6 h-6 animate-spin text-gray-300"/></div>
      ) : pickups.length === 0 ? (
        <EmptyState icon="📅" title="No pickups scheduled" message="No pickup requests match the current filter. Create one using the button above." />
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {pickups.map(p => {
            const sc = STATUS_COLORS[p.status] || STATUS_COLORS.PENDING;
            return (
              <div key={p.id}
                className={`bg-white border rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-all ${sc.border}`}
                onClick={() => setSelected(p)}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-navy-700">{p.requestNo || p.refNo}</span>
                    <div className={`inline-flex ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${sc.bg} ${sc.text}`}>
                      {p.status}
                    </div>
                  </div>
                  <span className="text-lg">{SLOT_ICONS[p.timeSlot] || '📦'}</span>
                </div>

                <div className="space-y-1 mb-3">
                  <div className="flex items-start gap-1.5 text-xs text-gray-600">
                    <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-orange-400"/>
                    <span className="truncate">{p.pickupAddress || p.contactAddress}, {p.pickupCity}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Calendar className="w-3 h-3 shrink-0 text-blue-400"/>
                    <span>{p.scheduledDate || p.pickupDate} · {p.timeSlot}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <User className="w-3 h-3 shrink-0 text-gray-400"/>
                    <span>{p.contactName || p.pickupContact} · {p.contactPhone || p.pickupPhone}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Package className="w-3 h-3 shrink-0 text-gray-400"/>
                    <span>{p.packageType} · {(p.weightGrams/1000).toFixed(3)}kg · {p.pieces} pc</span>
                  </div>
                </div>

                {p.assignedAgent && (
                  <div className="text-xs text-purple-600 bg-purple-50 rounded-lg px-2 py-1">
                    👤 {p.assignedAgent.name}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <Modal title={`Pickup — ${selected.requestNo || selected.refNo}`} onClose={()=>setSelected(null)}>
          <PickupDetailPanel
            pickup={selected}
            agents={agents}
            canAssign={canAssign}
            onUpdateStatus={updateStatus}
            onAssignAgent={assignAgent}
            toast={toast}
          />
        </Modal>
      )}

      {/* New Pickup Modal */}
      {showNew && (
        <Modal title="Schedule New Pickup" onClose={()=>setShowNew(false)}>
          <CreatePickupForm
            toast={toast}
            onSaved={() => { setShowNew(false); load(); }}
            onClose={() => setShowNew(false)}
          />
        </Modal>
      )}
    </div>
  );
}

function PickupDetailPanel({ pickup: p, agents, canAssign, onUpdateStatus, onAssignAgent }) {
  const [agentId, setAgentId] = useState('');
  const sc = STATUS_COLORS[p.status] || STATUS_COLORS.PENDING;

  const Row = ({ label, val }) => val ? (
    <div className="flex justify-between text-sm py-1 border-b border-gray-50">
      <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">{label}</span>
      <span className="text-gray-700 font-medium text-right max-w-[55%]">{val}</span>
    </div>
  ) : null;

  return (
    <div className="space-y-4">
      <div className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${sc.bg} ${sc.text}`}>{p.status}</div>

      <div className="space-y-0.5">
        <Row label="Contact"     val={`${p.contactName||p.pickupContact} · ${p.contactPhone||p.pickupPhone}`}/>
        <Row label="Pickup"      val={`${p.pickupAddress}, ${p.pickupCity} ${p.pickupPin}`}/>
        <Row label="Delivery"    val={p.deliveryAddress ? `${p.deliveryAddress}, ${p.deliveryCity}` : null}/>
        <Row label="Package"     val={`${p.packageType} · ${(p.weightGrams/1000).toFixed(3)}kg · ${p.pieces}pc`}/>
        <Row label="Service"     val={p.service || p.serviceType}/>
        <Row label="Carrier"     val={p.preferredCarrier}/>
        <Row label="Scheduled"   val={`${p.scheduledDate||p.pickupDate} · ${p.timeSlot}`}/>
        <Row label="Created"     val={new Date(p.createdAt).toLocaleDateString('en-IN')}/>
        {p.notes && <Row label="Notes" val={p.notes}/>}
      </div>

      {/* Status actions */}
      <div className="flex gap-2 flex-wrap">
        {p.status === 'PENDING' && (
          <button onClick={() => onUpdateStatus(p.id,'CONFIRMED')} className="btn-primary btn-sm flex-1">
            ✓ Confirm Pickup
          </button>
        )}
        {['PENDING','CONFIRMED','ASSIGNED'].includes(p.status) && (
          <button onClick={() => onUpdateStatus(p.id,'CANCELLED')} className="btn-secondary btn-sm text-red-500">
            Cancel
          </button>
        )}
        {p.status === 'ASSIGNED' && (
          <button onClick={() => onUpdateStatus(p.id,'COMPLETED')} className="btn-primary btn-sm flex-1 bg-green-600 hover:bg-green-700">
            ✅ Mark Completed
          </button>
        )}
      </div>

      {/* Assign agent */}
      {canAssign && ['PENDING','CONFIRMED'].includes(p.status) && agents.length > 0 && (
        <div className="border-t pt-3">
          <p className="text-xs font-semibold text-gray-500 mb-2">Assign Agent</p>
          <div className="flex gap-2">
            <select className="input text-sm flex-1" value={agentId} onChange={e=>setAgentId(e.target.value)}>
              <option value="">— Select agent —</option>
              {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <button disabled={!agentId} onClick={() => onAssignAgent(p.id, +agentId)} className="btn-primary btn-sm">
              Assign
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CreatePickupForm({ toast, onSaved, onClose }) {
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
  const [form, setForm] = useState({
    contactName:'', contactPhone:'', contactEmail:'',
    pickupAddress:'', pickupCity:'', pickupPin:'',
    deliveryAddress:'', deliveryCity:'', deliveryState:'',
    packageType:'Parcel', weightGrams:500, pieces:1, service:'Standard',
    scheduledDate: tomorrow.toISOString().split('T')[0], timeSlot:'Morning',
    preferredCarrier:'', notes:'',
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.contactName || !form.contactPhone || !form.pickupAddress || !form.scheduledDate) {
      toast?.('Fill in required fields','error'); return;
    }
    setSaving(true);
    try {
      await api.post('/pickups', form);
      toast?.('Pickup scheduled','success');
      onSaved();
    } catch(e) { toast?.(e.message,'error'); }
    finally { setSaving(false); }
  };

  const F = ({ label, req, children }) => (
    <div><label className="form-label">{label}{req && <span className="text-red-400"> *</span>}</label>{children}</div>
  );

  return (
    <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pickup Details</p>
      <div className="grid grid-cols-2 gap-2">
        <F label="Contact Name" req><input className="input text-sm" value={form.contactName} onChange={e=>setForm(f=>({...f,contactName:e.target.value}))}/></F>
        <F label="Phone" req><input className="input text-sm" value={form.contactPhone} onChange={e=>setForm(f=>({...f,contactPhone:e.target.value}))}/></F>
      </div>
      <F label="Pickup Address" req><textarea className="input text-sm" rows={2} value={form.pickupAddress} onChange={e=>setForm(f=>({...f,pickupAddress:e.target.value}))}/></F>
      <div className="grid grid-cols-2 gap-2">
        <F label="City" req><input className="input text-sm" value={form.pickupCity} onChange={e=>setForm(f=>({...f,pickupCity:e.target.value}))}/></F>
        <F label="PIN Code" req><input className="input text-sm" value={form.pickupPin} onChange={e=>setForm(f=>({...f,pickupPin:e.target.value}))}/></F>
      </div>

      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider pt-1">Package</p>
      <div className="grid grid-cols-3 gap-2">
        <F label="Type"><select className="input text-sm" value={form.packageType} onChange={e=>setForm(f=>({...f,packageType:e.target.value}))}>
          {['Document','Parcel','Fragile','Bulk / Cargo'].map(t=><option key={t}>{t}</option>)}
        </select></F>
        <F label="Weight (g)"><input type="number" className="input text-sm" value={form.weightGrams} onChange={e=>setForm(f=>({...f,weightGrams:+e.target.value}))}/></F>
        <F label="Pieces"><input type="number" className="input text-sm" value={form.pieces} onChange={e=>setForm(f=>({...f,pieces:+e.target.value}))}/></F>
      </div>

      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider pt-1">Schedule</p>
      <div className="grid grid-cols-2 gap-2">
        <F label="Date" req><input type="date" className="input text-sm" value={form.scheduledDate} onChange={e=>setForm(f=>({...f,scheduledDate:e.target.value}))}/></F>
        <F label="Time Slot"><select className="input text-sm" value={form.timeSlot} onChange={e=>setForm(f=>({...f,timeSlot:e.target.value}))}>
          {['Morning','Afternoon','Evening'].map(t=><option key={t}>{t}</option>)}
        </select></F>
      </div>

      <F label="Notes"><textarea className="input text-sm" rows={2} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/></F>

      <div className="flex gap-2 pt-2">
        <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button onClick={save} disabled={saving} className="btn-primary flex-1">
          {saving ? 'Scheduling…' : '📦 Schedule Pickup'}
        </button>
      </div>
    </div>
  );
}
