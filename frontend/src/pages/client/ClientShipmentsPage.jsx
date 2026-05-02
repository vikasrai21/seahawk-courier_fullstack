import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Package, 
  Search, 
  MapPin, 
  Activity,
  Zap,
  ArrowUpRight,
  Filter,
  Boxes,
  Download,
  Calendar,
  RefreshCw,
  Clock,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import api from '../../services/api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PageLoader } from '../../components/ui/Loading';
import { useDebounce } from '../../hooks/useDebounce';
import TimelineModal from '../../components/shipments/TimelineModal';
import { useSocket } from '../../context/SocketContext';

export default function ClientShipmentsPage({ toast }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [range, setRange] = useState(searchParams.get('range') || 'custom');
  const [dateFrom, setDateFrom] = useState(searchParams.get('date_from') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('date_to') || '');
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const dSearch = useDebounce(search, 300);
  const { socket } = useSocket();

  const exportToCSV = async () => {
    try {
      const p = new URLSearchParams({
        range,
        ...(dSearch && { search: dSearch }),
        ...(status && { status }),
        ...(dateFrom && { date_from: dateFrom }),
        ...(dateTo && { date_to: dateTo })
      });
      const res = await api.get(`/portal/shipments/export?${p}`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `client_shipments_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (err) {
      toast?.('Export failed: ' + err.message, 'error');
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = new URLSearchParams({ 
        page, 
        limit, 
        range, 
        ...(dSearch && { search: dSearch }), 
        ...(status && { status }),
        ...(dateFrom && { date_from: dateFrom }),
        ...(dateTo && { date_to: dateTo })
      });
      const r = await api.get(`/portal/shipments?${p}`);
      setRows(r.data?.shipments || r.data || []);
      setTotal(r.data?.pagination?.total || 0);
      setLastUpdated(new Date());
    } catch (e) {
      setError(e.message || 'Failed to load shipments');
      toast?.(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [page, limit, dSearch, status, range, dateFrom, dateTo, toast]);

  useEffect(() => { load(); }, [load]);
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

  if (loading && !rows.length) return <PageLoader />;

  return (
    <div className="min-h-full pb-12">
      <div className="mx-auto client-premium-main animate-in fade-in duration-700">
        {/* Page Header & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Shipments</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {lastUpdated && (
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Clock size={11} /> {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            {(search || status || dateFrom || dateTo) && (
              <button type="button" onClick={() => { setSearch(''); setStatus(''); setDateFrom(''); setDateTo(''); setPage(1); }} className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-600 hover:bg-amber-100 transition-all text-[10px] font-black uppercase tracking-widest">
                <RotateCcw size={12} /> Reset
              </button>
            )}
            <button type="button" onClick={exportToCSV} className="client-action-btn-secondary flex items-center gap-2">
              <Download size={14} /> Export CSV
            </button>
            <button type="button" onClick={() => load()} className="client-action-btn-secondary flex items-center gap-2">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            <button type="button" onClick={() => navigate('/portal/bulk-track')} className="client-action-btn-primary flex items-center gap-2">
              <Boxes size={14} /> Bulk Track
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 mb-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[240px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm font-semibold placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500/20 outline-none transition-all dark:text-white"
                placeholder="Search AWB, consignee, destination..." 
                value={search} 
                onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
              />
            </div>
            
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
               <input 
                 type="date"
                 className="bg-transparent border-none text-sm font-semibold text-slate-600 dark:text-slate-300 py-1 px-2 outline-none w-[130px] focus:ring-0" 
                 value={dateFrom} 
                 onChange={(e) => { setDateFrom(e.target.value); setRange('custom'); setPage(1); }}
               />
               <span className="text-slate-300 dark:text-slate-600 text-xs font-black">—</span>
               <input 
                 type="date"
                 className="bg-transparent border-none text-sm font-semibold text-slate-600 dark:text-slate-300 py-1 px-2 outline-none w-[130px] focus:ring-0" 
                 value={dateTo} 
                 onChange={(e) => { setDateTo(e.target.value); setRange('custom'); setPage(1); }}
               />
            </div>

            <select 
              className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-sky-500/20 transition-all min-w-[160px]"
              value={status} 
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              {['Booked', 'PickedUp', 'InTransit', 'OutForDelivery', 'Delivered', 'Delayed', 'NDR', 'RTO', 'Failed', 'Cancelled'].map(s => (
                <option key={s} value={s}>{s.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
           {rows.length === 0 && !loading ? (
              <div className="client-section-card border-dashed p-16 text-center md:p-24">
                <Package size={48} className="mx-auto text-slate-200 mb-6" />
                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">No shipments match current filters</h3>
                <p className="mx-auto max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-100 mb-4">Adjust your date range, status filter, or search term to bring shipments into view.</p>
                <button 
                  onClick={() => { setSearch(''); setStatus(''); setDateFrom(''); setDateTo(''); setPage(1); }}
                  className="client-action-btn-secondary"
                >
                  Reset all filters
                </button>
             </div>
           ) : (
              <div className="client-data-table">
                <div className="overflow-x-auto">
                   <table className="w-full min-w-[1000px] text-sm">
                      <thead>
                          <tr>
                            {['Date', 'AWB', 'Consignee', 'Destination', 'Courier', 'ETA', 'Status', 'Action'].map(h => (
                               <th key={h}>{h}</th>
                            ))}
                         </tr>
                      </thead>
                      <tbody>
                         {rows.map((s) => (
                           <tr 
                             key={s.id} 
                             onClick={() => setSelectedShipment(s)}
                              className="group cursor-pointer"
                           >
                              <td>
                                 <div className="flex flex-col">
                                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 leading-none mb-1">{s.date}</span>

                                 </div>
                              </td>
                              <td>
                                 <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-slate-900 dark:text-white font-mono tabular-nums bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">{s.awb}</span>
                                    <Activity size={12} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-all animate-pulse" />
                                 </div>
                              </td>
                              <td className="text-xs font-black uppercase tracking-tight text-slate-700 dark:text-white">{s.consignee || '—'}</td>
                              <td>
                                 <div className="flex items-center gap-2">
                                    <MapPin size={14} className="text-slate-300 dark:text-slate-100" />
                                    <span className="max-w-[160px] truncate text-xs font-bold text-slate-600 dark:text-slate-100">{s.destination || '-'}</span>
                                 </div>
                              </td>
                              <td>
                                 <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-100">{s.courier || '-'}</span>
                                 </div>
                              </td>
                              <td>
                                <span className={`text-[10px] font-bold tabular-nums px-2 py-1 rounded-lg ${
                                  s.eta && !['Delivered','RTO','Cancelled'].includes(s.status) && new Date(s.eta) < new Date()
                                    ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                                    : 'text-slate-500 dark:text-slate-400'
                                }`}>
                                  {s.eta && !['Delivered','RTO','Cancelled'].includes(s.status) && new Date(s.eta) < new Date() && <AlertTriangle size={10} className="inline mr-1 -mt-0.5" />}
                                  {s.eta ? new Date(s.eta).toLocaleDateString('en-GB', { day:'2-digit', month:'short' }) : '-'}
                                </span>
                              </td>
                              <td><StatusBadge status={s.status} /></td>
                               <td>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/portal/track?awb=${encodeURIComponent(s.awb)}`);
                                    }}
                                     className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm transition-all hover:border-blue-500/30 hover:text-blue-500 dark:border-slate-700/60 dark:bg-[#0c1631] dark:text-white"
                                    title="Open internal tracking"
                                  >
                                    Track
                                    <ArrowUpRight size={14} />
                                  </button>
                               </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
           )}
        </div>

        {(total > 0) && (
          <div className="flex flex-wrap items-center justify-between gap-4 px-2">
             <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-100">
                <span>Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total}</span>
                <select 
                  className="bg-transparent border border-slate-200 dark:border-slate-700 rounded px-2 py-1 focus:outline-none"
                  value={limit}
                  onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                >
                  <option value="25">25 per page</option>
                  <option value="50">50 per page</option>
                  <option value="100">100 per page</option>
                </select>
             </div>
             <div className="flex items-center gap-1.5">
                <button onClick={() => setPage(1)} disabled={page === 1} className="client-action-btn-secondary px-3 py-2 text-[10px] disabled:opacity-30">First</button>
                <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} className="client-action-btn-secondary px-3 py-2 text-[10px] disabled:opacity-30">Prev</button>
                <div className="px-3 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-black">
                  {page} / {Math.ceil(total / limit) || 1}
                </div>
                <button onClick={() => setPage((p) => p + 1)} disabled={page * limit >= total} className="client-action-btn-secondary px-3 py-2 text-[10px] disabled:opacity-30">Next</button>
             </div>
          </div>
        )}
      </div>

      {selectedShipment && (
        <TimelineModal
          shipmentId={selectedShipment.id}
          onClose={() => setSelectedShipment(null)}
        />
      )}
    </div>
  );
}

