import { useState, useEffect, useMemo } from 'react';
import { 
  Printer, 
  MessageCircle, 
  BarChart3, 
  TrendingUp, 
  Package, 
  Download,
  Table as TableIcon,
  PieChart as PieIcon,
  Box
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import api from '../services/api';
import { PageLoader } from '../components/ui/Loading';
import { useFetch } from '../hooks/useFetch';
import { sendWhatsAppReport } from '../utils/whatsapp';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../context/AuthContext';
import KPI from '../components/dashboard/KPI';
import { EmptyState } from '../components/ui/EmptyState';

const fmt    = n => `₹${Number(n||0).toLocaleString('en-IN')}`;
const fmtNum = n => Number(n||0).toLocaleString('en-IN');
const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#6366f1', '#ec4899'];

// Premium Tooltip
function CustomTooltip({ active, payload, label, suffix = '' }) {
  if (active && payload?.length) {
    return (
      <div className="rounded-[20px] border border-slate-200 bg-white/90 p-4 shadow-2xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90 animate-in fade-in zoom-in duration-200">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          {label}
        </p>
        {payload.map((entry, i) => (
          <div key={i} className="flex items-center justify-between gap-8 mb-1 last:mb-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{entry.name}</span>
            <span className="text-sm font-black" style={{ color: entry.color }}>
              {typeof entry.value === 'number' ? entry.value.toLocaleString('en-IN') : entry.value}{suffix}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function MonthlyReportPage({ toast }) {
  const { isOwner } = useAuth();
  const now  = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [rows,  setRows]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [clientFilter] = useState('');
  const [showWA, setShowWA] = useState(false);
  const { data: clients } = useFetch('/clients');

  const load = async () => {
    setLoading(true);
    try {
      const pad = String(month).padStart(2, '0');
      const from = `${year}-${pad}-01`;
      const daysInMonth = new Date(year, month, 0).getDate();
      const to = `${year}-${pad}-${daysInMonth}`;
      
      // Attempt stats endpoint first
      try {
         const res = await api.get(`/shipments/stats/monthly?year=${year}&month=${month}`);
         if (res.data?.length) {
           setRows(res.data);
           setLoading(false);
           return;
         }
      } catch(e) { /* fallback to direct fetch */ }

      const res = await api.get(`/shipments?dateFrom=${from}&dateTo=${to}&limit=5000`);
      const data = res.data?.shipments || res.data || [];
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      toast?.(err.message, 'error');
      setRows([]);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [year, month]);

  const filtered     = clientFilter ? rows.filter(r => r.clientCode === clientFilter) : rows;
  const totalRevenue = filtered.reduce((a,r) => a+(r.amount||0), 0);
  const totalWeight  = filtered.reduce((a,r) => a+(r.weight||0), 0);
  const clientCodes  = [...new Set(rows.map(r => r.clientCode))].filter(Boolean);
  const monthName    = `${months[month-1]} ${year}`;

  const byClient = useMemo(() => filtered.reduce((acc,r) => {
    if (!acc[r.clientCode]) acc[r.clientCode] = { count:0, amount:0, weight:0 };
    acc[r.clientCode].count++;
    acc[r.clientCode].amount += r.amount||0;
    acc[r.clientCode].weight += r.weight||0;
    return acc;
  }, {}), [filtered]);

  const byDay = useMemo(() => filtered.reduce((acc,r) => {
    const d = r.date || 'Unknown';
    if (!acc[d]) acc[d] = { count:0, amount:0 };
    acc[d].count++;
    acc[d].amount += r.amount||0;
    return acc;
  }, {}), [filtered]);

  // Chart data
  const dailyChartData = useMemo(() =>
    Object.entries(byDay)
      .sort((a,b) => a[0].localeCompare(b[0]))
      .map(([date, d]) => ({ date: date.slice(-2), count: d.count, revenue: d.amount })),
    [byDay]
  );

  const clientChartData = useMemo(() =>
    Object.entries(byClient)
      .sort((a,b) => b[1].amount - a[1].amount)
      .slice(0, 8)
      .map(([code, d]) => {
        const info = clients?.find(c => c.code === code);
        return { name: info?.company?.substring(0, 15) || code, revenue: d.amount, count: d.count };
      }),
    [byClient, clients]
  );

  const deliveredCount = filtered.filter(r => r.status === 'Delivered').length;
  const deliveryRate = filtered.length > 0 ? ((deliveredCount / filtered.length) * 100) : 0;

  const handleSendWA = (clientCode) => {
    const data   = clientCode ? rows.filter(r => r.clientCode === clientCode) : filtered;
    const client = clientCode ? clients?.find(c => c.code === clientCode) : null;
    const phone  = client?.whatsapp || client?.phone || '';
    if (clientCode && !phone) { toast?.('No communication node found for this client.', 'error'); setShowWA(false); return; }

    const result = sendWhatsAppReport({
      rows: data, client, phoneRaw: phone,
      dateLabel: monthName, reportType: 'Monthly Intelligence Report',
    });
    setShowWA(false);
    if (result.error) { toast?.(result.error, 'error'); return; }
    toast?.('Report Sent Successfully ✓', 'success');
  };

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-8 min-h-screen transition-all duration-500">
      <div className="print:hidden">
        <PageHeader
          title="Monthly Report"
          subtitle={`Aggregated logistics performance for ${monthName}`}
          icon={TrendingUp}
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <select className="bg-transparent border-none outline-none text-xs font-black uppercase tracking-widest px-3 py-1 cursor-pointer" value={month} onChange={e => setMonth(Number(e.target.value))}>
                  {months.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
                </select>
                <div className="w-px h-4 bg-slate-200 dark:bg-slate-800" />
                <select className="bg-transparent border-none outline-none text-xs font-black uppercase tracking-widest px-3 py-1 cursor-pointer" value={year} onChange={e => setYear(Number(e.target.value))}>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              <div className="relative">
                <button 
                  onClick={() => setShowWA(!showWA)}
                  className="flex items-center gap-2.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                >
                  <MessageCircle size={14} /> Share on WhatsApp
                </button>
                {showWA && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowWA(false)} />
                    <div className="absolute right-0 top-full mt-3 bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-[0_30px_70px_rgba(0,0,0,0.15)] z-50 min-w-[280px] py-4 overflow-hidden animate-in slide-in-from-top-4 duration-300">
                      <div className="px-5 py-3 bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/30 mb-2">
                        <p className="text-[10px] text-blue-700 dark:text-blue-400 font-black uppercase tracking-widest">WhatsApp Sharing</p>
                        <p className="text-[9px] text-blue-600/60 dark:text-blue-400/40 mt-1">Automatic attachments for large datasets</p>
                      </div>
                      <div className="max-h-[300px] overflow-y-auto px-2">
                        {clientCodes.length === 0 ? (
                          <p className="px-4 py-4 text-[10px] text-slate-400 uppercase font-black text-center">No active clients this period</p>
                        ) : clientCodes.map(code => {
                          const info  = clients?.find(c => c.code === code);
                          const hasWA = !!(info?.whatsapp || info?.phone);
                          return (
                            <button 
                              key={code} 
                              disabled={!hasWA}
                              onClick={() => handleSendWA(code)}
                              className={`w-full text-left px-3 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-2xl flex items-center gap-3 transition-all ${!hasWA ? 'opacity-20 grayscale cursor-not-allowed' : ''}`}
                            >
                              <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                <MessageCircle size={14} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-tight">{code}</p>
                                <p className="text-[10px] text-slate-400 truncate">{info?.company || 'N/A'}</p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button 
                onClick={() => window.print()}
                className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-900 dark:hover:border-white transition-all active:scale-90"
              >
                <Printer size={16} />
              </button>
            </div>
          }
        />
      </div>

      {loading ? <PageLoader /> : filtered.length === 0 ? (
        <EmptyState icon="📭" title={`No activities in ${monthName}`} description="Select another period or adjust filters." />
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* KPI Dashboard Strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI label="Monthly Volume" value={fmtNum(filtered.length)} icon={Package} accent="#3b82f6" sub={`${monthName} Period`}  />
            {isOwner && <KPI label="Total Revenue" value={fmt(totalRevenue)} icon={TrendingUp} accent="#10b981" sub={`Avg ${fmt(totalRevenue/(filtered.length||1))}/sh`} />}
            <KPI label="Tonnage Managed" value={`${fmtNum(totalWeight)} kg`} icon={Box} accent="#8b5cf6" sub={`High Density Transit`} />
            <KPI label="Fulfillment Rate" value={`${deliveryRate.toFixed(1)}%`} icon={Download} accent="#f59e0b" sub="Successful Deliveries" />
          </div>

          {/* Analytics Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Daily Trend Flow */}
            <div className="lg:col-span-2 rounded-[32px] border border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none mb-1">Activity Volume</h3>
                    <p className="text-xs font-bold text-slate-500">Daily shipment distribution</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-[10px] font-black text-slate-400">
                    <div className="w-2 h-2 rounded-full bg-blue-500" /> VOLUME
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dailyChartData}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#f1f5f9" strokeDasharray="10 10" vertical={false} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.05)', radius: 8 }} />
                  <Bar dataKey="count" name="Shipments" fill="url(#barGrad)" radius={[8, 8, 4, 4]} barSize={filtered.length > 500 ? 12 : 24} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Client Concentration */}
            <div className="rounded-[32px] border border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-8 shadow-sm overflow-hidden relative">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <PieIcon size={20} />
                </div>
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none mb-1">Concentration</h3>
                  <p className="text-xs font-bold text-slate-500">Market share by revenue</p>
                </div>
              </div>
              
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie 
                    data={clientChartData} 
                    dataKey={isOwner ? "revenue" : "count"} 
                    nameKey="name" 
                    innerRadius={60} 
                    outerRadius={85} 
                    paddingAngle={4} 
                    stroke="none"
                    animationBegin={200}
                    animationDuration={1500}
                  >
                    {clientChartData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip suffix={isOwner ? "" : " units"} />} />
                </PieChart>
              </ResponsiveContainer>

              <div className="mt-8 space-y-3">
                {clientChartData.slice(0, 4).map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="w-2.5 h-2.5 rounded-full shadow-sm group-hover:scale-125 transition-transform" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-tight">{c.name}</span>
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums">
                      {isOwner ? fmt(c.revenue) : `${c.count} units`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Data Hub */}
          <div className="grid grid-cols-1 gap-6">
            <div className="rounded-[32px] border border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900">
                    <TableIcon size={20} />
                  </div>
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none mb-1">Operational Ledger</h3>
                    <p className="text-xs font-bold text-slate-500">Per-client performance metrics</p>
                  </div>
                </div>
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest hidden md:block">
                  Click on client code for targeted relay
                </div>
              </div>

              <div className="table-shell relative overflow-visible">
                <table className="tbl w-full border-collapse">
                  <thead className="table-head">
                    <tr>
                      <th className="text-left p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identifier</th>
                      <th className="text-left p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Business Entity</th>
                      <th className="text-right p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Shipments</th>
                      <th className="text-right p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Gross Weight</th>
                      {isOwner && <th className="text-right p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue Impact</th>}
                      <th className="text-center p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Quick Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {Object.entries(byClient).sort((a,b) => b[1].amount - a[1].amount).map(([code, d]) => {
                      const info = clients?.find(c => c.code === code);
                      return (
                        <tr key={code} className="table-row group">
                          <td className="p-4">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-[11px] font-black text-blue-600">
                              {code}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm font-black text-slate-800 dark:text-slate-200">{info?.company || 'Unregistered Client'}</div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-tight">{info?.city || 'Local Territory'}</div>
                          </td>
                          <td className="p-4 text-right">
                             <div className="text-sm font-black text-slate-700 dark:text-slate-300 tabular-nums">{fmtNum(d.count)}</div>
                             <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Units</div>
                          </td>
                          <td className="p-4 text-right">
                             <div className="text-sm font-black text-slate-700 dark:text-slate-300 tabular-nums">{d.weight.toFixed(1)}</div>
                             <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Kilograms</div>
                          </td>
                          {isOwner && (
                            <td className="p-4 text-right">
                               <div className="text-sm font-black text-emerald-600 tabular-nums">{fmt(d.amount)}</div>
                               <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Realized</div>
                            </td>
                          )}
                          <td className="p-4 text-center">
                             <button 
                                onClick={() => handleSendWA(code)}
                                className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 text-emerald-500 hover:bg-emerald-600 hover:text-white transition-all active:scale-90"
                                title="Relay via WhatsApp"
                             >
                               <MessageCircle size={14} />
                             </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
