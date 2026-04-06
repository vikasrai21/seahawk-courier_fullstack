import { useState, useEffect, useCallback } from 'react';
import { 
  Clock3, 
  Search, 
  Filter, 
  X, 
  CheckSquare, 
  Square, 
  RefreshCw, 
  AlertCircle, 
  ChevronRight,
  TrendingUp,
  LayoutGrid,
  Zap,
  Box
} from 'lucide-react';
import api from '../services/api';
import { StatusBadge, STATUSES } from '../components/ui/StatusBadge';
import { SkeletonTable, EmptyState } from '../components/ui/Loading';
import { PageHeader } from '../components/ui/PageHeader';
import { CourierBadge } from '../components/ui/CourierBadge';
import QuickStatus from '../components/ui/QuickStatus';
import TimelineModal from '../components/shipments/TimelineModal';
import BulkStatusModal from '../components/shipments/BulkStatusModal';

const PENDING_STATUSES = ['Booked', 'PickedUp', 'InTransit', 'OutForDelivery', 'Delayed', 'RTO'];
const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// Helper to calculate "Staleness" (hours since date)
const getStaleness = (dateStr) => {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  const diff = (new Date() - d) / (1000 * 60 * 60);
  return Math.round(diff);
};

export default function PendingPage({ toast }) {
  const [shipments, setShip]      = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('');
  const [selected, setSelected]   = useState(new Set());
  const [bulkModal, setBulkModal] = useState(false);
  const [timeline, setTimeline]   = useState(null);
  const [tab, setTab]             = useState('All');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Load all pending categories
      const all = await Promise.all(
        PENDING_STATUSES.map((s) => api.get(`/shipments?status=${s}&limit=200`))
      );
      const rows = all.flatMap((r) => r.data || []);
      rows.sort((a, b) => b.date.localeCompare(a.date));
      setShip(rows);
      setSelected(new Set());
    } catch (err) { 
      toast?.(err.message, 'error'); 
    } finally { 
      setLoading(false); 
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const ids = shown.map(s => s.id);
    if (selected.size === ids.length) setSelected(new Set());
    else setSelected(new Set(ids));
  };

  const handleQuickStatusUpdate = (id, newStatus) => {
    setShip(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
    // If it's no longer pending, it might disappear on refresh, but for now we keep the UI consistent
  };

  const shown = shipments.filter(s => {
    if (tab === 'All') return !filter || s.status === filter;
    if (tab === 'Critical') return getStaleness(s.date) > 48; // Older than 2 days
    if (tab === 'Today') return s.date === new Date().toISOString().split('T')[0];
    return true;
  });

  const totals = {
    all: shipments.length,
    critical: shipments.filter(s => getStaleness(s.date) > 48).length,
    today: shipments.filter(s => s.date === new Date().toISOString().split('T')[0]).length
  };

  return (
    <div className="mx-auto max-w-7xl p-6">
      <PageHeader
        title="Pending & Delayed"
        subtitle={`${shipments.length} shipments require active monitoring`}
        icon={Clock3}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={load} className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
              <RefreshCw size={14} className={`${loading ? 'animate-spin' : ''}`} />
            </button>
            <select 
              className="input text-xs font-bold !rounded-2xl border-slate-200 w-40" 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              {PENDING_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        }
      />

      {/* Modern Tabs */}
      <div className="flex items-center gap-1 mb-6 p-1 bg-slate-100 dark:bg-slate-900/50 rounded-[20px] w-fit border border-slate-200 dark:border-slate-800 shadow-sm">
        {[
          { id: 'All', icon: LayoutGrid, count: totals.all },
          { id: 'Critical', icon: AlertCircle, count: totals.critical, color: 'text-red-500' },
          { id: 'Today', icon: TrendingUp, count: totals.today, color: 'text-blue-500' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-[16px] text-xs font-black tracking-tight uppercase transition-all
              ${tab === t.id 
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <t.icon size={12} className={tab === t.id ? t.color : ''} />
            {t.id}
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] 
              ${tab === t.id ? 'bg-slate-100 dark:bg-slate-700' : 'bg-slate-200/50 dark:bg-slate-800/50'}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? <SkeletonTable rows={10} cols={8} /> : shown.length === 0 ? (
        <EmptyState 
          icon="📦" 
          title={tab === 'Critical' ? 'No Critical Delays' : 'All Caught Up!'} 
          description="Everything is currently in its expected state." 
        />
      ) : (
        <div className="table-shell relative overflow-visible">
          <table className="tbl w-full border-collapse">
            <thead className="table-head">
              <tr>
                <th className="w-10 p-3">
                  <button onClick={toggleAll} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800">
                    {selected.size === shown.length
                      ? <CheckSquare className="w-4 h-4 text-blue-500" />
                      : <Square className="w-4 h-4 text-slate-300" />}
                  </button>
                </th>
                <th className="text-left p-3">Shipment</th>
                <th className="text-left p-3">Recipient</th>
                <th className="text-left p-3">Courier</th>
                <th className="text-right p-3">Staleness</th>
                <th className="text-center p-3">Status</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {shown.map((s) => {
                const stale = getStaleness(s.date);
                const isCritical = stale > 48;
                return (
                  <tr 
                    key={s.id} 
                    className={`table-row cursor-pointer transition-colors group ${selected.has(s.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                    onClick={() => toggleSelect(s.id)}
                  >
                    <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                      <button onClick={() => toggleSelect(s.id)}>
                        {selected.has(s.id)
                          ? <CheckSquare className="w-4 h-4 text-blue-500" />
                          : <Square className="w-4 h-4 text-slate-200 group-hover:text-slate-300" />}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mb-0.5">{s.date}</div>
                      <div className="font-mono text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        {s.awb}
                        {isCritical && <AlertCircle size={10} className="text-red-500 animate-pulse" />}
                      </div>
                      <div className="text-[10px] text-slate-500 italic">Code: {s.clientCode}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-xs font-black text-slate-800 dark:text-slate-200">{s.consignee}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">📍 {s.destination}</div>
                    </td>
                    <td className="p-3">
                      <CourierBadge name={s.courier} />
                      <div className="text-[9px] text-slate-400 uppercase tracking-widest pl-8 mt-0.5">{s.service}</div>
                    </td>
                    <td className="p-3 text-right">
                      <div className={`text-xs font-black ${isCritical ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>
                        {stale} hrs
                      </div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase">Since Booked</div>
                    </td>
                    <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                      <QuickStatus 
                        shipment={s} 
                        onUpdate={handleQuickStatusUpdate} 
                        toast={toast}
                      />
                    </td>
                    <td className="p-3 text-right" onClick={e => e.stopPropagation()}>
                      <button 
                        onClick={() => setTimeline(s)}
                        className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:text-blue-500 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/10 transition-all active:scale-90"
                        title="View Journey"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in slide-in-from-bottom-10 duration-500">
          <div className="pointer-events-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[28px] py-3 px-4 shadow-[0_30px_70px_rgba(15,23,42,0.4)] flex items-center gap-4 border border-white/10 dark:border-slate-200">
            <div className="flex items-center gap-3 px-3 border-r border-white/20 dark:border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-blue-500/30">
                {selected.size}
              </div>
              <div className="text-xs font-black uppercase tracking-widest hidden sm:block">Shipments Selected</div>
            </div>
            
            <button 
              onClick={() => setBulkModal(true)}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95"
            >
              <Zap size={14} /> Bulk Update
            </button>

            <button 
              onClick={() => setSelected(new Set())}
              className="p-2 hover:bg-white/10 dark:hover:bg-slate-100 rounded-xl transition-all"
              title="Clear Selection"
            >
              <X size={16} className="text-white/40 dark:text-slate-400" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {timeline && (
        <TimelineModal 
          shipment={timeline} 
          onClose={() => setTimeline(null)} 
        />
      )}

      {bulkModal && (
        <BulkStatusModal
          selectedIds={[...selected]}
          onDone={load}
          onClose={() => setBulkModal(false)}
          toast={toast}
        />
      )}
    </div>
  );
}
