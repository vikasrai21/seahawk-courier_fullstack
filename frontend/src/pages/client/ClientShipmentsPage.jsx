import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Package, 
  Search, 
  MapPin, 
  ChevronRight, 
  Activity,
  Zap
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
           {/* Command Control: Search & Summary */}
           <div className="lg:col-span-8 space-y-4">
              <div className="rounded-[40px] bg-slate-900 border border-slate-800 p-8 shadow-2xl shadow-slate-900/10 relative overflow-hidden group">
                 <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 blur-[90px] pointer-events-none group-hover:bg-blue-500/20 transition-all duration-1000" />
                 <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                    <div className="flex-1 w-full">
                       <div className="relative">
                          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300 dark:text-white" />
                          <input 
                            className="w-full rounded-[22px] border border-white/20 bg-white/10 py-4 pl-11 pr-4 text-sm font-bold text-white placeholder:text-slate-300 focus:ring-2 focus:ring-blue-500/20 transition-all dark:placeholder:text-slate-100" 
                            placeholder="Enter AWB, Consignee or Target Zone…" 
                            value={search} 
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }} 
                          />
                       </div>
                    </div>
                    <div className="w-full md:w-56">
                       <select 
                         className="w-full bg-white/5 border border-white/10 rounded-[22px] px-4 py-4 text-sm font-bold text-slate-300 focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none uppercase tracking-widest" 
                         value={status} 
                         onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                       >
                          <option value="" className="bg-slate-900">All Nodes</option>
                          {['Booked', 'InTransit', 'OutForDelivery', 'Delivered', 'Delayed', 'RTO'].map(s => (
                            <option key={s} value={s} className="bg-slate-900">{s.toUpperCase()}</option>
                          ))}
                       </select>
                    </div>
                 </div>
              </div>
           </div>

           {/* Quick Intelligence Widget */}
           <div className="lg:col-span-4 h-full">
              <div className="h-full rounded-[40px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm flex flex-col justify-center text-center">
                 <div className="flex items-center justify-center gap-3 mb-2">
                    <Zap size={18} className="text-blue-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-100">Tactical Snapshot</span>
                 </div>
                 <div className="text-5xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter mb-2">{total}</div>
                 <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-100">Active filtered deliveries</p>
              </div>
           </div>
        </div>

        {/* High-Velocity Table View */}
        <div className="space-y-4">
           {rows.length === 0 && !loading ? (
              <div className="rounded-[40px] border border-dashed border-slate-200 dark:border-slate-700/60 p-24 text-center bg-white/30 dark:bg-[#0c1631]/50 backdrop-blur-sm">
                <Package size={48} className="mx-auto text-slate-200 mb-6" />
                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">No Active Flux Detected</h3>
                <p className="mx-auto max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-100">Adjust your filtration parameters or search query to locate specific shipment nodes in the 90-day archive.</p>
             </div>
           ) : (
              <div className="overflow-hidden rounded-[40px] border border-slate-100 bg-white/50 shadow-sm backdrop-blur-xl dark:border-slate-700/60 dark:bg-[#0c1631]/80">
                <div className="overflow-x-auto">
                   <table className="w-full min-w-[1000px] text-sm">
                      <thead>
                          <tr className="border-b border-slate-100 bg-slate-50 dark:border-slate-700/60 dark:bg-[#0a1228]">
                            {['Dispatched', 'AWB Identity', 'Consignee Node', 'Destination Label', 'Carrier Force', 'Status Flow', 'Engage'].map(h => (
                               <th key={h} className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-100">{h}</th>
                            ))}
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                         {rows.map((s) => (
                           <tr 
                             key={s.id} 
                             onClick={() => setSelectedShipment(s)}
                              className="group cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/40"
                           >
                              <td className="px-6 py-5">
                                 <div className="flex flex-col">
                                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 leading-none mb-1">{s.date}</span>
                                    <span className="text-[9px] font-bold uppercase leading-none tracking-widest text-slate-400 dark:text-slate-100">90-Day Loop</span>
                                 </div>
                              </td>
                              <td className="px-6 py-5">
                                 <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-slate-900 dark:text-white font-mono tabular-nums bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">{s.awb}</span>
                                    <Activity size={12} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-all animate-pulse" />
                                 </div>
                              </td>
                              <td className="px-6 py-5 text-xs font-black uppercase tracking-tight text-slate-700 dark:text-white">{s.consignee || 'UNRECORDED'}</td>
                              <td className="px-6 py-5">
                                 <div className="flex items-center gap-2">
                                    <MapPin size={14} className="text-slate-300 dark:text-slate-100" />
                                    <span className="max-w-[160px] truncate text-xs font-bold text-slate-600 dark:text-slate-100">{s.destination || 'Global Pincode'}</span>
                                 </div>
                              </td>
                              <td className="px-6 py-5">
                                 <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-100">{s.courier || 'TBA'}</span>
                                 </div>
                              </td>
                              <td className="px-6 py-5"><StatusBadge status={s.status} /></td>
                               <td className="px-6 py-5">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/portal/track?awb=${encodeURIComponent(s.awb)}`);
                                    }}
                                     className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-blue-500/30 hover:text-blue-500 dark:border-slate-700/60 dark:bg-[#0c1631] dark:text-white"
                                    title="Open internal tracking"
                                  >
                                    <ChevronRight size={16} />
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

        {/* Tactical Pagination */}
        {total > 25 && (
          <div className="flex items-center justify-between px-4">
             <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-100">
                Showing Delta: {((page - 1) * 25) + 1} TO {Math.min(page * 25, total)} OF {total}
             </div>
             <div className="flex gap-2">
                <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} className="rounded-2xl border border-slate-200 bg-white px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-30 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800">Prev Loop</button>
                <button onClick={() => setPage((p) => p + 1)} disabled={page * 25 >= total} className="rounded-2xl border border-slate-200 bg-white px-6 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-30 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800">Next Loop</button>
             </div>
          </div>
        )}
      </div>

      {/* Intelligence Timeline Modal */}
      {selectedShipment && (
        <TimelineModal
          shipmentId={selectedShipment.id}
          onClose={() => setSelectedShipment(null)}
        />
      )}
    </div>
  );
}

