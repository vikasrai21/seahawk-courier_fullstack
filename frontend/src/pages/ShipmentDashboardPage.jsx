import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Filter, X, Download, RefreshCw, ChevronLeft, ChevronRight,
  Eye, Edit2, Trash2, Plus, Package, TrendingUp, CheckCircle2,
  ExternalLink, Clock, Monitor
} from 'lucide-react';
import api from '../services/api';
import { StatusBadge, formatStatusLabel } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
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

  const Th = ({ col, label, align='left' }) => (
    <th className={`p-4 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer select-none hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors ${align==='right'?'text-right':align==='center'?'text-center':'text-left'}`} onClick={() => sort(col)}>
      <div className={`flex items-center gap-1.5 ${align==='right'?'justify-end':align==='center'?'justify-center':''}`}>
        {label}
        {sortBy === col && <span className="text-[10px] text-orange-500">{sortDir==='desc'?'↓':'↑'}</span>}
      </div>
    </th>
  );

  return (
    <div className="mx-auto max-w-[1400px] p-6 lg:p-8 animate-[fadeIn_0.5s_ease-out]">
      {/* Header */}
      <PageHeader
        title="Shipment Dashboard"
        subtitle={`${total.toLocaleString()} total shipments actively tracked.`}
        icon={Monitor}
        actions={
          <div className="flex gap-2 flex-wrap">
            <button onClick={load} className="btn-secondary btn-sm gap-1.5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 transition-all rounded-xl">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
            <button onClick={exportCSV} className="btn-secondary btn-sm gap-1.5 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 transition-all rounded-xl">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            {canEdit && (
              <button onClick={() => setEditShip({})} className="bg-slate-900 dark:bg-orange-500 text-white px-4 py-2 text-sm font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-1.5 active:scale-95">
                <Plus className="w-4 h-4" /> New Shipment
              </button>
            )}
          </div>
        }
      />

      {/* Stats strip */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label:'Total Shipments', val: stats.count?.toLocaleString() || total.toLocaleString(), icon: Package,      color:'blue'   },
            { label:'Total Revenue',   val: fmt(stats.totalAmount),                                  icon: TrendingUp,   color:'emerald'  },
            { label:'Total Weight',    val: fmtWt(stats.totalWeight),                                icon: Package,      color:'purple' },
            { label:'Delivered',       val: rows.filter(r=>r.status==='Delivered').length,           icon: CheckCircle2, color:'emerald'  },
          ].map(({ label, val, icon: Icon, color }) => (
            <div key={label} className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 rounded-xl bg-${color}-50 dark:bg-${color}-900/20 flex items-center justify-center shrink-0 border border-${color}-100 dark:border-${color}-800`}>
                <Icon className={`w-5 h-5 text-${color}-500`} />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{val}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search + filters bar */}
      <div className="bg-white dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-3 mb-6">
        <div className="flex gap-3 flex-wrap items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={searchRef}
              className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm rounded-xl pl-9 pr-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              placeholder="Search AWB, Consignee, Destination..."
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && load()}
            />
          </div>
          {/* Courier */}
          <select className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-xl px-3 py-2 w-36 outline-none" value={filters.courier} onChange={e => setFilter('courier',e.target.value)}>
            <option value="">All Couriers</option>
            {COURIERS.map(c => <option key={c}>{c}</option>)}
          </select>
          {/* Status */}
          <select className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-xl px-3 py-2 w-36 outline-none" value={filters.status} onChange={e => setFilter('status',e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          {/* More filters toggle */}
          <button
            onClick={() => setShowFilters(f=>!f)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl border transition-all ${showFilters ? 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
          >
            <Filter className="w-4 h-4" /> Filters {hasFilters && <span className="bg-orange-500 text-white px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ml-1">ON</span>}
          </button>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all">
              <X className="w-4 h-4" /> Clear
            </button>
          )}
          {/* Page size */}
          <select className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-xl px-2 py-2 w-20 outline-none ml-auto" value={pageSize} onChange={e=>{setPageSize(+e.target.value);setPage(1);}}>
            {PAGE_SIZES.map(n=><option key={n}>{n}</option>)}
          </select>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="flex gap-4 mt-4 flex-wrap pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date From</label>
              <input type="date" className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-xl px-3 py-1.5 w-36 outline-none" value={filters.dateFrom} onChange={e=>setFilter('dateFrom',e.target.value)}/>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date To</label>
              <input type="date" className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-xl px-3 py-1.5 w-36 outline-none" value={filters.dateTo} onChange={e=>setFilter('dateTo',e.target.value)}/>
            </div>
            {(isAdmin || hasRole('OPS_MANAGER')) && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Client</label>
                <select className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-xl px-3 py-1.5 w-48 outline-none" value={filters.clientCode} onChange={e=>setFilter('clientCode',e.target.value)}>
                  <option value="">All Clients</option>
                  {clients.map(c=><option key={c.code} value={c.code}>{c.code} — {c.company}</option>)}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mb-4 text-orange-500" />
            <span className="text-sm font-bold tracking-wider uppercase">Loading Shipments</span>
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
            <table className="w-full whitespace-nowrap border-collapse">
              <thead className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <Th col="awb"       label="AWB / Tracking ID" />
                  <Th col="date"      label="Date" />
                  <Th col="clientCode"label="Client" />
                  <Th col="consignee" label="Consignee" />
                  <Th col="destination" label="Destination" />
                  <Th col="courier"   label="Carrier" />
                  <Th col="weight"    label="Weight" align="right" />
                  <Th col="amount"    label="Amount" align="right" />
                  <Th col="status"    label="Status" align="center" />
                  <Th col="actions"   label="Actions" align="right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 border-none">
                {rows.map(s => {
                  const trackUrl = s.courier && TRACKING_LINKS[s.courier] ? TRACKING_LINKS[s.courier](s.awb) : null;
                  return (
                    <tr key={s.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-4">
                        <div className="font-mono text-sm font-black text-slate-900 dark:text-white tracking-tight">{s.awb}</div>
                        {s.trackingEvents?.[0] && (
                          <div className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1.5 uppercase tracking-wider">
                            <Clock className="w-3 h-3 text-orange-400" />
                            {s.trackingEvents[0].status}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-bold text-slate-500">{s.date}</span>
                      </td>
                      <td className="p-4">
                        <div className="text-xs font-black text-slate-700 dark:text-slate-200">{s.clientCode}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200 max-w-[140px] truncate" title={s.consignee}>{s.consignee}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[100px] truncate">📍 {s.destination}</div>
                      </td>
                      <td className="p-4">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-black text-slate-600 dark:text-slate-300">
                          {s.courier || '—'}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-xs font-bold text-slate-500 tabular-nums">{fmtWt(s.weight)}</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{fmt(s.amount)}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-center">
                          <StatusBadge status={s.status} />
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-30 group-hover:opacity-100 transition-opacity">
                          {trackUrl && (
                            <a href={trackUrl} target="_blank" rel="noopener noreferrer"
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-blue-500 hover:text-white transition-all shadow-sm shadow-slate-200 dark:shadow-none" title="Track via Carrier">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button onClick={() => setViewShip(s)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-indigo-500 hover:text-white transition-all shadow-sm shadow-slate-200 dark:shadow-none" title="Interactive Timeline">
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {canEdit && (
                            <button onClick={() => setEditShip(s)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-yellow-500 hover:text-white transition-all shadow-sm shadow-slate-200 dark:shadow-none" title="Edit Shipment">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button onClick={() => handleDelete(s)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-rose-500 hover:text-white transition-all shadow-sm shadow-slate-200 dark:shadow-none" title="Delete">
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
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400">
              Showing <span className="text-slate-700 dark:text-slate-200">{((page-1)*pageSize)+1}–{Math.min(page*pageSize,total)}</span> of <span className="text-slate-700 dark:text-slate-200">{total.toLocaleString()}</span>
            </p>
            <div className="flex items-center gap-1.5">
              <button disabled={page===1} onClick={()=>setPage(p=>p-1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 transition-colors shadow-sm bg-slate-50 dark:bg-slate-800">
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({length:Math.min(5,pages)},(_,i)=>{
                let p2;
                if (pages<=5) p2=i+1;
                else if (page<=3) p2=i+1;
                else if (page>=pages-2) p2=pages-4+i;
                else p2=page-2+i;
                return (
                  <button key={p2} onClick={()=>setPage(p2)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-black transition-all shadow-sm ${page===p2 ? 'bg-orange-500 text-white shadow-orange-500/20 border-orange-500' : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-white dark:hover:bg-slate-700'}`}>
                    {p2}
                  </button>
                );
              })}
              <button disabled={page===pages} onClick={()=>setPage(p=>p+1)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 transition-colors shadow-sm bg-slate-50 dark:bg-slate-800">
                <ChevronRight className="w-4 h-4" />
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
