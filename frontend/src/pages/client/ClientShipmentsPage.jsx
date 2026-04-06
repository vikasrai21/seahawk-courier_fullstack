import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Package, 
  Search, 
  MapPin, 
  ChevronRight, 
  ArrowLeft, 
  LayoutGrid, 
  Activity,
  History,
  ExternalLink,
  Zap
} from 'lucide-react';
import api from '../../services/api';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { PageLoader } from '../../components/ui/Loading';
import { EmptyState } from '../../components/ui/EmptyState';
import { useDebounce } from '../../hooks/useDebounce';
import { PageHeader } from '../../components/ui/PageHeader';
import TimelineModal from '../../components/shipments/TimelineModal';

const TRACKING_LINKS = {
  Delhivery: (a) => `https://www.delhivery.com/track/package/${a}`,
  DTDC: (a) => `https://www.dtdc.in/tracking/tracking.asp?TrkType=awb&strCNNo=${a}`,
  Trackon: (a) => `https://www.trackoncourier.com/tracking?trackingId=${a}`,
  BlueDart: (a) => `https://www.bluedart.com/tracking?trackFor=0&track=awb&trackNo=${a}`,
  FedEx: (a) => `https://www.fedex.com/fedextrack/?trknbr=${a}`,
  DHL: (a) => `https://www.dhl.com/en/express/tracking.html?AWB=${a}`,
};

export default function ClientShipmentsPage({ toast }) {
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [selectedShipment, setSelectedShipment] = useState(null);
  const dSearch = useDebounce(search, 300);

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

  if (loading && !rows.length) return <PageLoader />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12">
      {/* Slim Industrial Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl sticky top-0 z-50 px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
           <div className="flex items-center gap-4">
              <Link to="/portal" className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all">
                 <ArrowLeft size={18} />
              </Link>
              <div>
                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none mb-1">Logistics Table</h4>
                 <div className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Shipment Repository</div>
              </div>
           </div>
           <div className="flex items-center gap-3">
              <Link to="/portal/bulk-track" className="hidden sm:flex items-center gap-2 text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-lg uppercase tracking-widest border border-blue-100 dark:border-blue-500/20 shadow-sm">
                 Bulk Intelligence
              </Link>
              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
              <Link to="/portal/map" className="p-2 bg-slate-900 dark:bg-slate-800 rounded-xl text-white hover:bg-black transition-all">
                 <LayoutGrid size={18} />
              </Link>
           </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl p-6 lg:p-8 space-y-8 animate-in fade-in duration-700">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
           {/* Command Control: Search & Summary */}
           <div className="lg:col-span-8 space-y-4">
              <div className="rounded-[40px] bg-slate-900 border border-slate-800 p-8 shadow-2xl shadow-slate-900/10 relative overflow-hidden group">
                 <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 blur-[90px] pointer-events-none group-hover:bg-blue-500/20 transition-all duration-1000" />
                 <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                    <div className="flex-1 w-full">
                       <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                          <input 
                            className="w-full bg-white/5 border border-white/10 rounded-[22px] pl-11 pr-4 py-4 text-sm font-bold text-white placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20 transition-all" 
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
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Tactical Snapshot</span>
                 </div>
                 <div className="text-5xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter mb-2">{total}</div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active filtered deliveries</p>
              </div>
           </div>
        </div>

        {/* High-Velocity Table View */}
        <div className="space-y-4">
           {rows.length === 0 && !loading ? (
             <div className="rounded-[40px] border border-dashed border-slate-200 dark:border-slate-800 p-24 text-center bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm">
                <Package size={48} className="mx-auto text-slate-200 mb-6" />
                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">No Active Flux Detected</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">Adjust your filtration parameters or search query to locate specific shipment nodes in the 90-day archive.</p>
             </div>
           ) : (
             <div className="rounded-[40px] border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 shadow-sm backdrop-blur-xl overflow-hidden">
                <div className="overflow-x-auto">
                   <table className="w-full min-w-[1000px] text-sm">
                      <thead>
                         <tr className="bg-slate-50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                            {['Dispatched', 'AWB Identity', 'Consignee Node', 'Destination Label', 'Carrier Force', 'Status Flow', 'Engage'].map(h => (
                               <th key={h} className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{h}</th>
                            ))}
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                         {rows.map((s) => (
                           <tr 
                             key={s.id} 
                             onClick={() => setSelectedShipment(s)}
                             className="group hover:bg-white dark:hover:bg-slate-800/50 transition-all cursor-pointer"
                           >
                              <td className="px-6 py-5">
                                 <div className="flex flex-col">
                                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 leading-none mb-1">{s.date}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">90-Day Loop</span>
                                 </div>
                              </td>
                              <td className="px-6 py-5">
                                 <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-slate-900 dark:text-white font-mono tabular-nums bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">{s.awb}</span>
                                    <Activity size={12} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-all animate-pulse" />
                                 </div>
                              </td>
                              <td className="px-6 py-5 text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">{s.consignee || 'UNRECORDED'}</td>
                              <td className="px-6 py-5">
                                 <div className="flex items-center gap-2">
                                    <MapPin size={14} className="text-slate-300" />
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate max-w-[160px]">{s.destination || 'Global Pincode'}</span>
                                 </div>
                              </td>
                              <td className="px-6 py-5">
                                 <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">{s.courier || 'TBA'}</span>
                                 </div>
                              </td>
                              <td className="px-6 py-5"><StatusBadge status={s.status} /></td>
                              <td className="px-6 py-5">
                                 {TRACKING_LINKS[s.courier] ? (
                                   <a 
                                     href={TRACKING_LINKS[s.courier](s.awb)} 
                                     target="_blank" rel="noreferrer" 
                                     onClick={(e) => e.stopPropagation()}
                                     className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-500/30 transition-all shadow-sm"
                                   >
                                      <ExternalLink size={16} />
                                   </a>
                                 ) : (
                                   <div className="w-10 h-10 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-200">
                                      <ChevronRight size={16} />
                                   </div>
                                 )}
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
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Showing Delta: {((page - 1) * 25) + 1} TO {Math.min(page * 25, total)} OF {total}
             </div>
             <div className="flex gap-2">
                <button onClick={() => setPage((p) => p - 1)} disabled={page === 1} className="px-6 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all disabled:opacity-30">Prev Loop</button>
                <button onClick={() => setPage((p) => p + 1)} disabled={page * 25 >= total} className="px-6 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all disabled:opacity-30">Next Loop</button>
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
