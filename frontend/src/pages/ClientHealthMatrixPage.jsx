import { useState, useEffect, useCallback } from 'react';
import {
  HeartPulse,
  ShieldAlert,
  TrendingUp,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  XOctagon,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const fmtPct = (n) => `${Number(n || 0).toFixed(1)}%`;

const getGradeConfig = (grade) => {
  switch (grade) {
    case 'A': return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle2, label: 'Excellent' };
    case 'B': return { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: TrendingUp, label: 'Healthy' };
    case 'C': return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: AlertTriangle, label: 'Warning' };
    case 'D': return { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', icon: AlertTriangle, label: 'At Risk' };
    case 'F': return { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: XOctagon, label: 'Critical Bleed' };
    default: return { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: HeartPulse, label: 'Unknown' };
  }
};

export default function ClientHealthMatrixPage({ toast }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL'); // ALL, A, B, C, D, F
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/ops/client-health');
      setData(r.data);
    } catch (e) {
      toast?.(e.message || 'Failed to load health matrix', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const filtered = data.filter(c => {
    if (filter !== 'ALL' && c.grade !== filter) return false;
    if (search && !c.company.toLowerCase().includes(search.toLowerCase()) && !c.code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen selection:bg-rose-500/30">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-rose-500 mb-2">
              <HeartPulse size={18} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Owner Intelligence</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Client Health Matrix</h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Algorithmic risk scoring based on RTO bleed and margin performance (30D)</p>
          </div>
          
          <div className="flex items-center gap-3">
             <button onClick={load} className="p-2.5 rounded-2xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-rose-500 hover:border-rose-500 transition-all active:scale-90">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Search by client or code..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 transition-all"
                />
            </div>
            <div className="flex bg-white dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto max-w-full hide-scrollbar">
                {['ALL', 'A', 'B', 'C', 'D', 'F'].map(g => (
                    <button
                        key={g}
                        onClick={() => setFilter(g)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                            filter === g ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                    >
                        Grade {g === 'ALL' ? 's' : g}
                    </button>
                ))}
            </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-12 h-12 rounded-full border-4 border-rose-500/20 border-t-rose-500 animate-spin mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Calculating Risk Matrix</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
             {filtered.map(client => {
                const conf = getGradeConfig(client.grade);
                return (
                    <div key={client.code} className={`bg-white dark:bg-slate-900/40 border ${conf.border} rounded-[24px] p-6 relative overflow-hidden group hover:bg-slate-50 dark:hover:bg-slate-900/80 transition-colors`}>
                        <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] ${conf.bg} opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />
                        
                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white truncate w-40" title={client.company}>{client.company}</h3>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{client.code}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-black ${conf.bg} ${conf.color} border ${conf.border} shadow-inner`}>
                                {client.grade}
                            </div>
                        </div>

                        <div className="space-y-4 relative z-10">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400">Volume (30D)</span>
                                <span className="text-sm font-black text-slate-900 dark:text-white">{client.volume30d.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400">Delivery Rate</span>
                                <span className={`text-sm font-black tabular-nums ${(client.deliveryRate || 0) > 80 ? 'text-emerald-500' : (client.deliveryRate || 0) > 60 ? 'text-amber-500' : 'text-red-400'}`}>
                                    {fmtPct(client.deliveryRate || (client.volume30d > 0 ? ((client.volume30d - (client.rtoCount || 0)) / client.volume30d * 100) : 0))}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400">RTO Risk</span>
                                <span className={`text-sm font-black tabular-nums ${client.rtoRate > 15 ? 'text-red-400' : 'text-slate-200'}`}>
                                    {fmtPct(client.rtoRate)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-400">Margin</span>
                                <span className={`text-sm font-black tabular-nums ${client.marginPct < 10 ? 'text-red-400' : 'text-emerald-500'}`}>
                                    {fmtPct(client.marginPct)}
                                </span>
                            </div>
                            <div className="pt-4 border-t border-slate-800/50 flex justify-between items-center">
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    Wallet: <span className="text-slate-900 dark:text-white">{fmt(client.walletBalance)}</span>
                                </div>
                                <button 
                                  onClick={() => navigate(`/app/contracts?client=${client.code}`)}
                                  className={`p-2 rounded-xl bg-slate-800 hover:${conf.bg} text-slate-400 hover:${conf.color} transition-colors`}
                                  title="Adjust Rates"
                                >
                                    <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                )
             })}
             {filtered.length === 0 && (
                 <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-[32px]">
                     <ShieldAlert size={48} className="mx-auto text-slate-600 mb-4" />
                     <h3 className="text-lg font-black text-white mb-1">No Clients Found</h3>
                     <p className="text-sm font-medium text-slate-500">Adjust your filters or search query.</p>
                 </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
}
