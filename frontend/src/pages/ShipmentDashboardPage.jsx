import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Filter, Download, RefreshCw, ChevronLeft, ChevronRight,
  Eye, Edit2, Trash2, Plus, Package, TrendingUp, CheckCircle2,
  Monitor, Zap, Activity
} from 'lucide-react';
import api from '../services/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import ShipmentForm from '../components/ShipmentForm';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { EmptyState } from '../components/ui/EmptyState';
import { useDebounce } from '../hooks/useDebounce';
import { useDataStore } from '../stores/dataStore';
import TimelineModal from '../components/shipments/TimelineModal';

const fmt     = n => `₹${Number(n||0).toLocaleString('en-IN')}`;
const fmtWt   = n => `${Number(n||0).toFixed(3)} kg`;

const COURIERS = ['Delhivery','DTDC','Trackon','BlueDart','FedEx','DHL','Other'];
const STATUSES = ['Booked','InTransit','OutForDelivery','Delivered','Delayed','RTO','Cancelled'];

export default function ShipmentDashboardPage({ toast }) {
  const { isAdmin, hasRole } = useAuth();
  const [rows,       setRows]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [total,      setTotal]      = useState(0);
  const [stats,      setStats]      = useState(null);
  const [page,       setPage]       = useState(1);
  const pageSize = 25;
  const [filters,    setFilters]    = useState({
    search: '', courier: '', status: '', clientCode: '', dateFrom: '', dateTo: '',
  });
  const [sortBy,     setSortBy]     = useState('createdAt');
  const [sortDir,    setSortDir]    = useState('desc');
  const [showFilters,setShowFilters]= useState(false);
  const [editShip,   setEditShip]   = useState(null);
  const [viewShipment, setViewShipment] = useState(null);
  const [editLoading,setEditLoading]= useState(false);
  const clients = useDataStore((state) => state.clients);
  const fetchClients = useDataStore((state) => state.fetchClients);
  const fetchShipments = useDataStore((state) => state.fetchShipments);
  const setStoreShipments = useDataStore((state) => state.setShipments);
  const invalidateShipments = useDataStore((state) => state.invalidateShipments);
  const searchRef = useRef();
  const { socket } = useSocket();

  const canEdit   = isAdmin || hasRole('OPS_MANAGER') || hasRole('STAFF');
  const canDelete = isAdmin;

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
      const { shipments, meta } = await fetchShipments(Object.fromEntries(p.entries()), false);
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
  useEffect(() => {
    if (!socket) return undefined;
    const refresh = () => load();
    socket.on('shipment:created', refresh);
    socket.on('shipment:status-updated', refresh);
    return () => {
      socket.off('shipment:created', refresh);
      socket.off('shipment:status-updated', refresh);
    };
  }, [socket, load]);

  const setFilter = (k, v) => { setFilters(f => ({ ...f, [k]: v })); setPage(1); };
  const hasFilters = Object.values(filters).some(Boolean);
  const pages = Math.max(1, Math.ceil(total / pageSize));

  const sort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortBy(col); setSortDir('desc'); }
  };

  const handleDelete = async (s) => {
    if (!confirm(`Delete shipment ${s.awb}? This cannot be undone.`)) return;
    try {
      await api.delete(`/shipments/${s.id}`);
      const nextRows = rows.filter((x) => x.id !== s.id);
      setRows(nextRows);
      setStoreShipments(nextRows, { pagination: { total: Math.max(total - 1, 0) }, stats });
      setTotal(t => t - 1);
      invalidateShipments();
      toast?.('Shipment deleted', 'success');
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
      toast?.('Shipment updated', 'success');
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
        {sortBy === col && <span className="text-[10px] text-blue-500">{sortDir==='desc'?'↓':'↑'}</span>}
      </div>
    </th>
  );

  return (
    <div className="mx-auto max-w-[1440px] p-6 lg:p-8 space-y-8 animate-in fade-in duration-700">
      <PageHeader
        title="Shipment Dashboard"
        subtitle={`${total.toLocaleString()} shipments in your operations list.`}
        icon={Monitor}
        actions={
          <div className="flex gap-2 flex-wrap">
            <button onClick={load} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 hover:text-slate-600 transition-all">
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={exportCSV} className="hidden sm:flex items-center gap-2 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 hover:text-slate-600 transition-all font-black text-[10px] uppercase tracking-widest">
              <Download size={16} /> Export Delta
            </button>
            {canEdit && (
              <button onClick={() => setEditShip({})} className="px-5 py-2.5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-slate-900/10 flex items-center gap-2 hover:bg-black transition-all active:scale-95">
                <Plus size={16} /> New Shipment
              </button>
            )}
          </div>
        }
      />

      {/* Analytics Strip */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label:'Total Shipments', val: stats.count?.toLocaleString() || total.toLocaleString(), icon: Package, color:'blue' },
            { label:'Total Revenue', val: fmt(stats.totalAmount), icon: TrendingUp, color:'emerald' },
            { label:'Total Weight', val: fmtWt(stats.totalWeight), icon: Zap, color:'purple' },
            { label:'Delivered', val: Number(stats.delivered ?? rows.filter(r => r.status === 'Delivered').length).toLocaleString(), icon: CheckCircle2, color:'emerald' },
          ].map(({ label, val, icon: Icon, color }) => (
            <div key={label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow group">
               <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 text-${color}-500 flex items-center justify-center shrink-0 border border-${color}-500/20 group-hover:scale-110 transition-transform`}>
                  <Icon size={18} />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">{label}</p>
                  <p className="text-xl font-black text-slate-800 dark:text-white tabular-nums">{val}</p>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* High-Velocity Command Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm p-4">
        <div className="flex gap-4 flex-wrap items-center">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={searchRef}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-11 pr-4 py-3.5 text-xs font-black uppercase tracking-widest text-slate-700 dark:text-white placeholder:text-slate-200 focus:ring-2 focus:ring-blue-500/10 transition-all font-mono"
              placeholder="Search AWB, consignee, destination..."
              value={filters.search}
              onChange={e => setFilter('search', e.target.value)}
              onKeyDown={e => e.key === 'Enter' && load()}
            />
          </div>
          <select className="bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500 appearance-none min-w-[160px]" value={filters.courier} onChange={e => setFilter('courier',e.target.value)}>
            <option value="">All Carriers</option>
            {COURIERS.map(c => <option key={c}>{c.toUpperCase()}</option>)}
          </select>
          <select className="bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500 appearance-none min-w-[160px]" value={filters.status} onChange={e => setFilter('status',e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.map(s => <option key={s}>{s.toUpperCase()}</option>)}
          </select>
          <button
            onClick={() => setShowFilters(f=>!f)}
            className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${showFilters ? 'bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/10' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600'}`}
          >
            <Filter size={14} /> Filters {hasFilters && <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded-md ml-1">ACTIVE</span>}
          </button>
        </div>

        {showFilters && (
          <div className="flex gap-6 mt-6 flex-wrap pt-6 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2">
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Date From</label>
              <input type="date" className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600" value={filters.dateFrom} onChange={e=>setFilter('dateFrom',e.target.value)}/>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Date To</label>
              <input type="date" className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600" value={filters.dateTo} onChange={e=>setFilter('dateTo',e.target.value)}/>
            </div>
            {(isAdmin || hasRole('OPS_MANAGER')) && (
              <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Client Entity</label>
                <select className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 appearance-none" value={filters.clientCode} onChange={e=>setFilter('clientCode',e.target.value)}>
                  <option value="">Select Target Client</option>
                  {clients.map(c=><option key={c.code} value={c.code}>{c.code.toUpperCase()} — {c.company.toUpperCase()}</option>)}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Shipment Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[40px] shadow-sm overflow-hidden overflow-x-auto">
        {loading ? (
            <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <RefreshCw className="w-12 h-12 animate-spin mb-6 text-blue-500" />
            <span className="text-[12px] font-black uppercase tracking-[0.4em] animate-pulse">Loading shipments</span>
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon="📦"
            title="No shipments found"
            message={hasFilters ? 'No shipment matches the selected filters.' : 'No shipment has been added yet.'}
          />
        ) : (
          <table className="w-full whitespace-nowrap border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                <Th col="awb" label="AWB" />
                <Th col="date" label="Date" />
                <Th col="clientCode" label="Client" />
                <Th col="consignee" label="Consignee" />
                <Th col="destination" label="Destination" />
                <Th col="courier" label="Courier" />
                <Th col="weight" label="Weight (KG)" align="right" />
                <Th col="amount" label="Amount (₹)" align="right" />
                <Th col="status" label="Status" align="center" />
                <Th col="actions" label="Action" align="right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {rows.map(s => (
                <tr key={s.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all duration-300">
                  <td className="p-4">
                    <div className="font-mono text-[13px] font-black text-slate-900 dark:text-white tracking-tight">{s.awb}</div>
                    <div className="text-[9px] font-bold text-slate-400 mt-1 flex items-center gap-1.5 uppercase tracking-widest leading-none">
                      <Activity size={10} className="text-blue-500" /> {s.status || 'BOOKED'}
                    </div>
                  </td>
                  <td className="p-4 font-black text-[11px] text-slate-400 uppercase tracking-widest">{s.date}</td>
                  <td className="p-4 font-black text-[11px] text-slate-900 dark:text-white">{s.clientCode}</td>
                  <td className="p-4 uppercase text-[11px] font-black text-slate-700 dark:text-slate-300 max-w-[160px] truncate">{s.consignee}</td>
                  <td className="p-4">
                     <div className="flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all">
                        <span className="text-[14px]">📍</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.destination}</span>
                     </div>
                  </td>
                  <td className="p-4">
                     <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
                        {s.courier || 'UNASSIGNED'}
                     </span>
                  </td>
                  <td className="p-4 text-right font-black text-[11px] text-slate-400 tabular-nums">{fmtWt(s.weight)}</td>
                  <td className="p-4 text-right font-black text-[13px] text-slate-900 dark:text-white tabular-nums">{fmt(s.amount)}</td>
                  <td className="p-4 text-center">
                    <StatusBadge status={s.status} />
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setViewShipment(s)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm"><Eye size={14} /></button>
                      {canEdit && (
                        <button onClick={() => setEditShip(s)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-400 hover:bg-amber-500 hover:text-white transition-all shadow-sm"><Edit2 size={14} /></button>
                      )}
                      {canDelete && (
                        <button onClick={() => handleDelete(s)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 text-slate-400 hover:bg-rose-500 hover:text-white transition-all shadow-sm"><Trash2 size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && pages > 1 && (
          <div className="flex items-center justify-between px-8 py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <p className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400">Page <span className="text-slate-900 dark:text-white">{page}</span> of <span className="text-slate-900 dark:text-white">{pages}</span></p>
            <div className="flex items-center gap-2">
              <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-600 disabled:opacity-20 transition-all shadow-sm"><ChevronLeft size={16} /></button>
              <button disabled={page===pages} onClick={()=>setPage(p=>p+1)} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-600 disabled:opacity-20 transition-all shadow-sm"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {editShip !== null && (
        <Modal title={editShip.id ? `Edit Shipment - ${editShip.awb}` : 'Create Shipment'} onClose={()=>setEditShip(null)}>
          <ShipmentForm initial={editShip} loading={editLoading} onSave={handleEditSave} onCancel={()=>setEditShip(null)} />
        </Modal>
      )}

      {viewShipment && (
        <TimelineModal shipment={viewShipment} onClose={() => setViewShipment(null)} />
      )}
    </div>
  );
}
