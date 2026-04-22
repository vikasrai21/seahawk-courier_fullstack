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
  Boxes
} from 'lucide-react';
import api from '../../services/api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PageLoader } from '../../components/ui/Loading';
import { useDebounce } from '../../hooks/useDebounce';
import TimelineModal from '../../components/shipments/TimelineModal';
import { useSocket } from '../../context/SocketContext';
import ClientPortalPageIntro from '../../components/client/ClientPortalPageIntro';

export default function ClientShipmentsPage({ toast }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [selectedShipment, setSelectedShipment] = useState(null);
  const dSearch = useDebounce(search, 300);
  const { socket } = useSocket();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ 
        page, 
        limit: 25, 
        range: '90d', 
        ...(dSearch && { search: dSearch }), 
        ...(status && { status }) 
      });
      const r = await api.get(`/portal/shipments?${p}`);
      setRows(r.data?.shipments || r.data || []);
      setTotal(r.data?.pagination?.total || 0);
    } catch (e) {
      toast?.(e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [page, dSearch, status, toast]);

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
        <ClientPortalPageIntro
          eyebrow="Shipment List"
          title="Track, filter, and update shipments from one clear screen."
          description="Search by AWB, consignee, or destination, filter by status, and open tracking quickly."
          badges={['Last 90 days', 'Live refresh', `${total} filtered shipments`]}
          actions={(
            <>
              <button type="button" onClick={() => load()} className="client-action-btn-primary">
                Refresh list
              </button>
              <button type="button" onClick={() => navigate('/portal/bulk-track')} className="client-action-btn-secondary">
                Open bulk track
              </button>
            </>
          )}
          aside={(
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="client-page-metric">
                <div className="flex items-center justify-between gap-3">
                  <span className="client-page-metric-label">Filtered volume</span>
                  <Boxes size={16} className="text-sky-500" />
                </div>
                <div className="client-page-metric-value">{total}</div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Shipments matching your current search and status filters.</p>
              </div>
              <div className="client-page-metric">
                <div className="flex items-center justify-between gap-3">
                  <span className="client-page-metric-label">Query state</span>
                  <Filter size={16} className="text-orange-500" />
                </div>
                <div className="mt-2 text-base font-black text-slate-950 dark:text-white">{status || 'All statuses'}</div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{dSearch ? `Searching for "${dSearch}"` : 'No search term applied yet.'}</p>
              </div>
            </div>
          )}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
           <div className="lg:col-span-8 space-y-4">
              <div className="client-filter-shell relative overflow-hidden group">
                 <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 blur-[90px] pointer-events-none group-hover:bg-blue-500/20 transition-all duration-1000" />
                 <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                    <div className="flex-1 w-full">
                       <div className="relative">
                          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300 dark:text-white" />
                          <input 
                            className="client-filter-input py-4 pl-11 pr-4" 
                            placeholder="Search AWB, consignee, destination..." 
                            value={search} 
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
                          />
                       </div>
                    </div>
                    <div className="w-full md:w-56">
                       <select 
                         className="client-filter-input appearance-none px-4 py-4 uppercase tracking-[0.16em] text-slate-200" 
                         value={status} 
                         onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                       >
                          <option value="" className="bg-slate-900">All Statuses</option>
                          {['Booked', 'InTransit', 'OutForDelivery', 'Delivered', 'Delayed', 'RTO'].map(s => (
                            <option key={s} value={s} className="bg-slate-900">{s.toUpperCase()}</option>
                          ))}
                       </select>
                    </div>
                 </div>
              </div>
           </div>

           <div className="lg:col-span-4 h-full">
              <div className="client-section-card flex h-full flex-col justify-between gap-4 text-center">
                 <div className="flex items-center justify-center gap-3 mb-2">
                    <Zap size={18} className="text-blue-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-100">Quick Snapshot</span>
                 </div>
                 <div className="text-5xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter mb-2">{total}</div>
                 <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-100">Filtered shipments</p>
                 <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-left dark:border-slate-700 dark:bg-slate-900/70">
                   <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Best next step</p>
                   <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                     {total ? 'Open a row to inspect its journey or jump into live tracking for an exception.' : 'Widen filters or search by a specific AWB to bring shipments into view.'}
                   </p>
                 </div>
              </div>
           </div>
        </div>

        <div className="space-y-4">
           {rows.length === 0 && !loading ? (
              <div className="client-section-card border-dashed p-16 text-center md:p-24">
                <Package size={48} className="mx-auto text-slate-200 mb-6" />
                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">No shipments match this view yet</h3>
                <p className="mx-auto max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-100">Adjust your filters, try a different AWB or consignee search, or move to bulk tracking for a wider scan.</p>
             </div>
           ) : (
              <div className="client-data-table">
                <div className="overflow-x-auto">
                   <table className="w-full min-w-[1000px] text-sm">
                      <thead>
                          <tr>
                            {['Date', 'AWB', 'Consignee', 'Destination', 'Courier', 'Status', 'Action'].map(h => (
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
                                    <span className="text-[9px] font-bold uppercase leading-none tracking-widest text-slate-400 dark:text-slate-100">Last 90 Days</span>
                                 </div>
                              </td>
                              <td>
                                 <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-slate-900 dark:text-white font-mono tabular-nums bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">{s.awb}</span>
                                    <Activity size={12} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-all animate-pulse" />
                                 </div>
                              </td>
                              <td className="text-xs font-black uppercase tracking-tight text-slate-700 dark:text-white">{s.consignee || 'NOT AVAILABLE'}</td>
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

        {total > 25 && (
          <div className="flex items-center justify-between px-2">
             <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-100">
                Showing {((page - 1) * 25) + 1} to {Math.min(page * 25, total)} of {total}
             </div>
             <div className="flex gap-2">
                <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} className="client-action-btn-secondary px-5 py-2 text-[10px] uppercase tracking-[0.16em] disabled:translate-y-0 disabled:opacity-30">Previous</button>
                <button onClick={() => setPage((p) => p + 1)} disabled={page * 25 >= total} className="client-action-btn-secondary px-5 py-2 text-[10px] uppercase tracking-[0.16em] disabled:translate-y-0 disabled:opacity-30">Next</button>
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

