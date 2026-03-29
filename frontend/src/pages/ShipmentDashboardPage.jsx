import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Filter, X, Download, RefreshCw, ChevronLeft, ChevronRight,
  Eye, Edit2, Trash2, Plus, Package, TrendingUp, CheckCircle2,
  ExternalLink, Clock
} from 'lucide-react';
import api from '../services/api';
import { StatusBadge, formatStatusLabel } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import ShipmentForm from '../components/ShipmentForm';
import { useAuth } from '../context/AuthContext';
import { EmptyState } from '../components/ui/EmptyState';
import { useDebounce } from '../hooks/useDebounce';
import { useDataStore } from '../stores/dataStore';

const fmt     = n => `₹${Number(n||0).toLocaleString('en-IN')}`;
const fmtWt   = n => `${Number(n||0).toFixed(3)} kg`;

const COURIERS = ['Delhivery','DTDC','Trackon','BlueDart','FedEx','DHL','Other'];
const STATUSES = ['Booked','InTransit','OutForDelivery','Delivered','Delayed','RTO','Cancelled'];
const PAGE_SIZES = [25, 50, 100];

const TRACKING_LINKS = {
  Delhivery: a => `https://www.delhivery.com/track/package/${a}`,
  DTDC:      a => `https://www.dtdc.in/tracking/tracking.asp?TrkType=awb&strCNNo=${a}`,
  Trackon:   a => `https://www.trackoncourier.com/tracking?trackingId=${a}`,
  BlueDart:  a => `https://www.bluedart.com/tracking?trackFor=0&track=awb&trackNo=${a}`,
  FedEx:     a => `https://www.fedex.com/fedextrack/?trknbr=${a}`,
  DHL:       a => `https://www.dhl.com/en/express/tracking.html?AWB=${a}`,
};

export default function ShipmentDashboardPage({ toast }) {
  const { isAdmin, hasRole } = useAuth();
  const [rows,       setRows]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [total,      setTotal]      = useState(0);
  const [stats,      setStats]      = useState(null);
  const [page,       setPage]       = useState(1);
  const [pageSize,   setPageSize]   = useState(25);
  const [filters,    setFilters]    = useState({
    search: '', courier: '', status: '', clientCode: '', dateFrom: '', dateTo: '',
  });
  const [sortBy,     setSortBy]     = useState('createdAt');
  const [sortDir,    setSortDir]    = useState('desc');
  const [showFilters,setShowFilters]= useState(false);
  const [editShip,   setEditShip]   = useState(null);
  const [viewShip,   setViewShip]   = useState(null);
  const [editLoading,setEditLoading]= useState(false);
  const clients = useDataStore((state) => state.clients);
  const fetchClients = useDataStore((state) => state.fetchClients);
  const fetchShipments = useDataStore((state) => state.fetchShipments);
  const setStoreShipments = useDataStore((state) => state.setShipments);
  const invalidateShipments = useDataStore((state) => state.invalidateShipments);
  const searchRef = useRef();

  const canEdit   = isAdmin || hasRole('OPS_MANAGER') || hasRole('STAFF');
  const canDelete = isAdmin;

  // Debounce the search field — prevents API call on every keystroke
  const debouncedSearch = useDebounce(filters.search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({
        page, limit: pageSize, sortBy, sortDir,
        ...(debouncedSearch       && { search:     debouncedSearch }),
        ...(filters.courier    && { courier:     filters.courier }),
        ...(filters.status     && { status:      filters.status }),
        ...(filters.clientCode && { clientCode:  filters.clientCode }),
        ...(filters.dateFrom   && { dateFrom:    filters.dateFrom }),
        ...(filters.dateTo     && { dateTo:      filters.dateTo }),
      });
      const { shipments, meta } = await fetchShipments(Object.fromEntries(p.entries()), true);
      setRows(shipments || []);
      setTotal(meta?.pagination?.total || 0);
      setStats(meta?.stats || null);
    } catch (err) {
      toast?.(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, filters.courier, filters.status, filters.clientCode, filters.dateFrom, filters.dateTo, sortBy, sortDir, fetchShipments, toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { fetchClients({ limit: 200 }).catch(() => {}); }, [fetchClients]);

  const setFilter = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1); };
  const clearFilters = () => { setFilters({ search:'',courier:'',status:'',clientCode:'',dateFrom:'',dateTo:'' }); setPage(1); };
  const hasFilters = Object.values(filters).some(Boolean);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  const sort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const handleDelete = async (s) => {
    if (!confirm(`Delete AWB ${s.awb}? This cannot be undone.`)) return;
    try {
      await api.delete(`/shipments/${s.id}`);
      const nextRows = rows.filter((x) => x.id !== s.id);
      setRows(nextRows);
      setStoreShipments(nextRows, { pagination: { total: Math.max(total - 1, 0) }, stats });
      setTotal(t => t - 1);
      invalidateShipments();
      toast?.('Deleted', 'success');
    } catch (err) { toast?.(err.message, 'error'); }
  };

  const handleEditSave = async (form) => {
    setEditLoading(true);
    try {
      const res = await api.put(`/shipments/${editShip.id}`, form);
      const nextRows = rows.map((x) => x.id === editShip.id ? res.data : x);
      setRows(nextRows);
      setStoreShipments(nextRows, { pagination: { total }, stats });
      invalidateShipments();
      setEditShip(null);
      toast?.('Saved', 'success');
    } catch (err) { toast?.(err.message, 'error'); }
    finally { setEditLoading(false); }
  };

  const exportCSV = () => {
    const header = ['AWB','Date','Client','Consignee','Destination','Courier','Weight','Amount','Status'];
    const lines = [header, ...rows.map(s => [
      s.awb, s.date, s.clientCode, s.consignee||'', s.destination||'',
      s.courier||'', s.weight, s.amount, s.status,
    ])].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(','));
    const blob = new Blob([lines.join('\n')], { type:'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `shipments-${new Date().toISOString().slice(0,10)}.csv`; a.click();
  };

  const Th = ({ col, label }) => (
    <th className="th cursor-pointer select-none hover:bg-gray-50" onClick={() => sort(col)}>
      <div className="flex items-center gap-1">
        {label}
        {sortBy === col && <span className="text-[10px]">{sortDir==='desc'?'↓':'↑'}</span>}
      </div>
    </th>
  );

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Shipment Dashboard</h1>
          <p className="text-xs text-gray-400 mt-0.5">{total.toLocaleString()} total shipments</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={load} className="btn-secondary btn-sm gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <button onClick={exportCSV} className="btn-secondary btn-sm gap-1.5">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          {canEdit && (
            <button onClick={() => setEditShip({})} className="btn-primary btn-sm gap-1.5">
              <Plus className="w-3.5 h-3.5" /> New Shipment
            </button>
          )}
        </div>
      </div>

      {/* Stats strip */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label:'Total Shipments', val: stats.count?.toLocaleString() || total.toLocaleString(), icon: Package,      color:'blue'   },
            { label:'Total Revenue',   val: fmt(stats.totalAmount),                                  icon: TrendingUp,   color:'green'  },
            { label:'Total Weight',    val: fmtWt(stats.totalWeight),                                icon: Package,      color:'purple' },
            { label:'Delivered',       val: rows.filter(r=>r.status==='Delivered').length,           icon: CheckCircle2, color:'green'  },
          ].map(({ label, val, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3 shadow-sm">
              <div className={`w-8 h-8 rounded-lg bg-${color}-50 flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 text-${color}-500`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-sm font-bold text-gray-900">{val}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search + filters bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 mb-4">
        <div className="flex gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              ref={searchRef}
              className="input pl-8 text-sm h-8"
              placeholder="AWB, consignee, destination…"
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && load()}
            />
          </div>
          {/* Courier */}
          <select className="input text-sm h-8 w-36" value={filters.courier} onChange={e => setFilter('courier',e.target.value)}>
            <option value="">All Couriers</option>
            {COURIERS.map(c => <option key={c}>{c}</option>)}
          </select>
          {/* Status */}
          <select className="input text-sm h-8 w-36" value={filters.status} onChange={e => setFilter('status',e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          {/* More filters toggle */}
          <button
            onClick={() => setShowFilters(f=>!f)}
            className={`btn-secondary btn-sm gap-1.5 ${showFilters ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}`}
          >
            <Filter className="w-3.5 h-3.5" /> Filters {hasFilters && <span className="badge badge-orange text-[9px]">ON</span>}
          </button>
          {hasFilters && (
            <button onClick={clearFilters} className="btn-secondary btn-sm gap-1.5 text-red-500">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
          {/* Page size */}
          <select className="input text-sm h-8 w-20 ml-auto" value={pageSize} onChange={e=>{setPageSize(+e.target.value);setPage(1);}}>
            {PAGE_SIZES.map(n=><option key={n}>{n}</option>)}
          </select>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="flex gap-2 mt-2 flex-wrap">
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Date From</label>
              <input type="date" className="input text-sm h-8 w-36" value={filters.dateFrom} onChange={e=>setFilter('dateFrom',e.target.value)}/>
            </div>
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Date To</label>
              <input type="date" className="input text-sm h-8 w-36" value={filters.dateTo} onChange={e=>setFilter('dateTo',e.target.value)}/>
            </div>
            {(isAdmin || hasRole('OPS_MANAGER')) && (
              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Client</label>
                <select className="input text-sm h-8 w-44" value={filters.clientCode} onChange={e=>setFilter('clientCode',e.target.value)}>
                  <option value="">All Clients</option>
                  {clients.map(c=><option key={c.code} value={c.code}>{c.code} — {c.company}</option>)}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" /> Loading…
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon="📦"
            title="No shipments found"
            message={hasFilters ? 'No shipments match your current filters.' : 'No shipments yet — create one with New Entry.'}
            action={hasFilters ? 'Clear filters' : undefined}
            onAction={hasFilters ? clearFilters : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <Th col="awb"       label="AWB / Tracking ID" />
                  <Th col="date"      label="Date" />
                  <Th col="clientCode"label="Client" />
                  <Th col="consignee" label="Consignee" />
                  <Th col="destination" label="Destination" />
                  <Th col="courier"   label="Carrier" />
                  <Th col="weight"    label="Weight" />
                  <Th col="amount"    label="Amount" />
                  <Th col="status"    label="Status" />
                  <th className="th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(s => {
                  const trackUrl = s.courier && TRACKING_LINKS[s.courier] ? TRACKING_LINKS[s.courier](s.awb) : null;
                  return (
                    <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                      <td>
                        <div className="font-mono text-xs font-bold text-navy-700">{s.awb}</div>
                        {s.trackingEvents?.[0] && (
                          <div className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {s.trackingEvents[0].status}
                          </div>
                        )}
                      </td>
                      <td className="text-xs text-gray-500 whitespace-nowrap">{s.date}</td>
                      <td className="text-xs font-semibold">{s.clientCode}</td>
                      <td className="text-xs max-w-[120px] truncate" title={s.consignee}>{s.consignee}</td>
                      <td className="text-xs text-gray-500 max-w-[100px] truncate">{s.destination}</td>
                      <td className="text-xs">{s.courier || '—'}</td>
                      <td className="text-xs text-right">{fmtWt(s.weight)}</td>
                      <td className="text-xs text-right font-medium">{fmt(s.amount)}</td>
                      <td><StatusBadge status={s.status} /></td>
                      <td>
                        <div className="flex items-center gap-1">
                          {trackUrl && (
                            <a href={trackUrl} target="_blank" rel="noopener noreferrer"
                              className="p-1 rounded hover:bg-blue-50 text-blue-500" title="Track on carrier site">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button onClick={() => setViewShip(s)}
                            className="p-1 rounded hover:bg-gray-100 text-gray-500" title="View timeline">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {canEdit && (
                            <button onClick={() => setEditShip(s)}
                              className="p-1 rounded hover:bg-yellow-50 text-yellow-600" title="Edit">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => handleDelete(s)}
                              className="p-1 rounded hover:bg-red-50 text-red-500" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs text-gray-500">
              Showing {((page-1)*pageSize)+1}–{Math.min(page*pageSize,total)} of {total.toLocaleString()}
            </p>
            <div className="flex items-center gap-1">
              <button disabled={page===1} onClick={()=>setPage(p=>p-1)}
                className="btn-secondary btn-xs" aria-label="Previous">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              {/* Page pills */}
              {Array.from({length:Math.min(5,pages)},(_,i)=>{
                let p2;
                if (pages<=5) p2=i+1;
                else if (page<=3) p2=i+1;
                else if (page>=pages-2) p2=pages-4+i;
                else p2=page-2+i;
                return (
                  <button key={p2} onClick={()=>setPage(p2)}
                    className={`w-7 h-7 rounded text-xs font-semibold ${page===p2 ? 'bg-navy-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                    {p2}
                  </button>
                );
              })}
              <button disabled={page===pages} onClick={()=>setPage(p=>p+1)}
                className="btn-secondary btn-xs" aria-label="Next">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editShip !== null && (
        <Modal title={editShip.id ? `Edit — ${editShip.awb}` : 'New Shipment'} onClose={()=>setEditShip(null)}>
          <ShipmentForm
            initial={editShip}
            loading={editLoading}
            onSave={handleEditSave}
            onCancel={()=>setEditShip(null)}
          />
        </Modal>
      )}

      {/* View / Timeline Modal */}
      {viewShip && <TrackingTimelineModal shipment={viewShip} onClose={()=>setViewShip(null)} toast={toast} />}
    </div>
  );
}

/* ── Inline Timeline Modal ─────────────────────────────────────────────── */
function TrackingTimelineModal({ shipment, onClose, toast }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding,  setAdding]  = useState(false);
  const [form,    setForm]    = useState({ status:'InTransit', location:'', description:'' });
  const { isAdmin, hasRole }  = useAuth();
  const canAdd = isAdmin || hasRole('OPS_MANAGER') || hasRole('STAFF');

  const STATUSES_TL = ['Booked','PickedUp','InTransit','Reached Hub','OutForDelivery','Delivered','Failed Delivery','RTO Initiated','RTODelivered'];

  useEffect(() => {
    api.get(`/tracking/${shipment.awb}`)
      .then(r => setData(r.data))
      .catch(e => toast?.(e.message,'error'))
      .finally(() => setLoading(false));
  }, [shipment.awb]);

  const addEvent = async () => {
    if (!form.status) return;
    setAdding(true);
    try {
      await api.post(`/tracking/${shipment.awb}/event`, form);
      const r = await api.get(`/tracking/${shipment.awb}`);
      setData(r.data);
      setForm({ status:'InTransit', location:'', description:'' });
      toast?.('Event added','success');
    } catch(e) { toast?.(e.message,'error'); }
    finally { setAdding(false); }
  };

  const forceSync = async () => {
    try {
      const r = await api.post(`/tracking/${shipment.awb}/sync`);
      toast?.(`Synced ${r.data.eventsAdded} new events`,'success');
      const r2 = await api.get(`/tracking/${shipment.awb}`);
      setData(r2.data);
    } catch(e) { toast?.(e.message,'error'); }
  };

  return (
    <Modal title={`Timeline — ${shipment.awb}`} onClose={onClose} wide>
      {loading ? (
        <div className="flex justify-center py-8"><RefreshCw className="w-6 h-6 animate-spin text-gray-300"/></div>
      ) : (
        <div className="space-y-4">
          {/* Shipment meta */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 bg-gray-50 rounded-lg">
            {[
              ['Consignee',   data?.shipment?.consignee],
              ['Destination', data?.shipment?.destination],
              ['Carrier',     data?.shipment?.courier],
              ['Status',      data?.shipment?.status],
            ].map(([l,v]) => v ? (
              <div key={l}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{l}</p>
                <p className="text-sm font-semibold text-gray-800">{l === 'Status' ? formatStatusLabel(v) : v}</p>
              </div>
            ) : null)}
          </div>

          {/* Sync button */}
          {data?.shipment?.courier && canAdd && (
            <button onClick={forceSync} className="btn-secondary btn-sm gap-1.5 w-full">
              <RefreshCw className="w-3.5 h-3.5" /> Sync from {data.shipment.courier}
            </button>
          )}

          {/* Timeline */}
          {(data?.events?.length || 0) === 0 ? (
            <p className="text-center text-sm text-gray-400 py-4">No tracking events yet</p>
          ) : (
            <div className="relative pl-6 space-y-0">
              {(data?.events || []).map((e,i) => (
                <div key={e.id} className="relative pb-4">
                  {i < data.events.length-1 && (
                    <div className="absolute left-[-17px] top-3 bottom-0 w-px bg-gray-200"/>
                  )}
                  <div className={`absolute left-[-20px] top-1.5 w-3 h-3 rounded-full border-2 border-white ring-2 ${
                    i===0 ? 'bg-orange-500 ring-orange-200' :
                    e.status==='Delivered' ? 'bg-green-500 ring-green-200' :
                    'bg-blue-400 ring-blue-100'
                  }`}/>
                  <div className="bg-white border border-gray-100 rounded-lg p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                    <span className={`text-xs font-bold ${i===0?'text-orange-600':'text-gray-700'}`}>{formatStatusLabel(e.status)}</span>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">
                        {new Date(e.createdAt).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
                      </span>
                    </div>
                    {e.location && <p className="text-xs text-gray-500 mt-0.5">📍 {e.location}</p>}
                    {e.description && <p className="text-xs text-gray-600 mt-0.5">{e.description}</p>}
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold mt-1 inline-block ${
                      e.source==='API' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'
                    }`}>{e.source}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add manual event */}
          {canAdd && (
            <div className="border border-dashed border-gray-200 rounded-lg p-3 bg-gray-50/50">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Add Manual Event</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <select className="input text-xs" value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                  {STATUSES_TL.map(s => <option key={s} value={s}>{formatStatusLabel(s)}</option>)}
                </select>
                <input className="input text-xs" placeholder="Location (optional)" value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))}/>
              </div>
              <input className="input text-xs w-full mb-2" placeholder="Description (optional)" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
              <button onClick={addEvent} disabled={adding} className="btn-primary btn-sm w-full">
                {adding ? 'Saving…' : '+ Add Event'}
              </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
