import { useState, useEffect } from 'react';
import {
  TrendingUp, Package, IndianRupee, Truck, Users,
  AlertTriangle, CheckCircle, Clock, BarChart2,
  RefreshCw, ArrowUp, ArrowDown, FileText, Calculator,
  Shield, Zap, Activity
} from 'lucide-react';
import api from '../services/api';

const fmt  = n => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
const fmtP = n => `${Number(n || 0).toFixed(1)}%`;
const fmtN = n => Number(n || 0).toLocaleString('en-IN');

function KPI({ label, value, sub, icon: Icon, color, trend }) {
  const colors = {
    blue:  'bg-blue-50 border-blue-100 text-blue-700',
    green: 'bg-green-50 border-green-100 text-green-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    purple:'bg-purple-50 border-purple-100 text-purple-700',
    slate: 'bg-slate-50 border-slate-100 text-slate-700',
    red:   'bg-red-50 border-red-100 text-red-700',
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-bold flex items-center gap-0.5 ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trend >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs font-semibold text-gray-600 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function MiniBar({ label, value, max, color = 'bg-blue-500' }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-28 truncate shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-700 w-16 text-right shrink-0">{fmt(value)}</span>
    </div>
  );
}

export default function OperationsDashboard({ toast }) {
  const [data, setData] = useState(null);
  const [rateHealth, setRateHealth] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [ops, health] = await Promise.all([
        api.get('/ops/dashboard'),
        api.get('/rates/health'),
      ]);
      setData(ops.data?.data);
      setRateHealth(health.data?.data || []);
      setLastRefresh(new Date());
    } catch (e) {
      toast?.('Failed to load dashboard', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading && !data) return (
    <div className="p-6 text-center">
      <RefreshCw className="w-8 h-8 mx-auto animate-spin text-slate-400 mb-3" />
      <p className="text-gray-400">Loading operations dashboard…</p>
    </div>
  );

  if (!data) return null;

  const { overview, topCouriers, topClients, courierBreakdown, dailyTrend, recentShipments, quotes, reconciliation } = data;
  const staleRates = rateHealth.filter(r => r.stale);
  const criticalRates = rateHealth.filter(r => r.critical);

  const maxRevCourier = Math.max(...(courierBreakdown || []).map(c => c.revenue), 1);
  const maxRevClient  = Math.max(...(topClients || []).map(c => c.revenue), 1);

  // Simple trend from daily data
  const trendData = dailyTrend || [];
  const todayData = trendData[trendData.length - 1];
  const yestData  = trendData[trendData.length - 2];
  const shipTrend = yestData?.count > 0 ? Math.round(((todayData?.count || 0) - yestData.count) / yestData.count * 100) : null;

  return (
    <div className="p-4 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operations Dashboard</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            {lastRefresh && `Last refreshed ${lastRefresh.toLocaleTimeString('en-IN')}`}
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 bg-slate-800 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-700 disabled:opacity-50">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Critical alerts */}
      {(criticalRates.length > 0 || staleRates.length > 0) && (
        <div className={`rounded-2xl p-4 mb-4 flex flex-wrap items-start gap-3 ${criticalRates.length > 0 ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
          <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${criticalRates.length > 0 ? 'text-red-600' : 'text-amber-600'}`} />
          <div className="flex-1">
            <p className={`font-bold text-sm ${criticalRates.length > 0 ? 'text-red-800' : 'text-amber-800'}`}>
              {criticalRates.length > 0
                ? `⚠️ ${criticalRates.length} courier rate set(s) are over 6 months old — calculations may be inaccurate`
                : `${staleRates.length} courier rate set(s) are over 90 days old — consider verifying with partners`}
            </p>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {(criticalRates.length > 0 ? criticalRates : staleRates).map(r => (
                <span key={r.partner} className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${criticalRates.length > 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  {r.partner} — {r.ageInDays}d old
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KPI label="Today's Shipments" value={fmtN(overview.todayShipments)} icon={Package}
          color="blue" sub={`${fmtN(overview.weekShipments)} this week`} trend={shipTrend} />
        <KPI label="Today's Revenue" value={fmt(overview.todayRevenue)} icon={IndianRupee}
          color="green" sub={`${fmt(overview.monthRevenue)} this month`} />
        <KPI label="Pending Deliveries" value={fmtN(overview.pendingCount)} icon={Clock}
          color={overview.pendingCount > 50 ? 'amber' : 'slate'}
          sub="Booked + In Transit" />
        <KPI label="Delivery Rate" value={fmtP(overview.deliveryRate)} icon={CheckCircle}
          color={overview.deliveryRate > 85 ? 'green' : 'amber'}
          sub={`${fmtN(overview.deliveredCount)} delivered this month`} />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KPI label="Quotes Generated" value={fmtN(quotes?.total || 0)} icon={FileText}
          color="purple" sub={quotes ? `Avg margin ${fmtP(quotes.avgMargin)}` : 'No data'} />
        <KPI label="Avg Quote Profit" value={fmt(quotes?.avgProfit || 0)} icon={TrendingUp}
          color="green" sub="Per shipment, all quotes" />
        <KPI label="Rate Versions" value={fmtN(rateHealth.length)} icon={Calculator}
          color={staleRates.length > 0 ? 'amber' : 'green'}
          sub={staleRates.length > 0 ? `${staleRates.length} stale` : 'All current'} />
        <KPI label="Reconciled Invoices" value={fmtN(reconciliation?.totalInvoices || 0)} icon={Shield}
          color="slate" sub="Partner invoices verified" />
      </div>

      {/* Mid section: 3 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">

        {/* Daily trend */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h2 className="font-bold text-sm text-gray-700 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500" />Last 7 Days — Shipment Activity
          </h2>
          <div className="space-y-2">
            {trendData.length === 0 && <p className="text-xs text-gray-400">No data yet.</p>}
            {trendData.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 w-10 shrink-0">
                  {new Date(d.date).toLocaleDateString('en-IN', { weekday:'short', day:'numeric' })}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-3 relative overflow-hidden">
                  <div className="h-3 rounded-full bg-blue-500 flex items-center justify-end pr-1 text-[8px] text-white font-bold"
                    style={{ width: `${Math.min((d.count / Math.max(...trendData.map(x => x.count), 1)) * 100, 100)}%` }}>
                    {d.count}
                  </div>
                </div>
                <span className="text-[10px] font-bold text-gray-600 w-16 text-right shrink-0">{fmt(d.revenue)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top couriers */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h2 className="font-bold text-sm text-gray-700 mb-3 flex items-center gap-2">
            <Truck className="w-4 h-4 text-green-500" />Top Couriers — This Month
          </h2>
          <div className="space-y-2.5">
            {(courierBreakdown || []).slice(0, 6).map((c, i) => (
              <MiniBar key={i} label={c.courier || 'Unknown'} value={c.revenue} max={maxRevCourier}
                color={i === 0 ? 'bg-slate-700' : i === 1 ? 'bg-blue-500' : i === 2 ? 'bg-blue-400' : 'bg-blue-200'} />
            ))}
            {(!courierBreakdown || !courierBreakdown.length) && <p className="text-xs text-gray-400">No data yet.</p>}
          </div>
        </div>

        {/* Top clients */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <h2 className="font-bold text-sm text-gray-700 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-500" />Top Clients — This Month
          </h2>
          <div className="space-y-2.5">
            {(topClients || []).map((c, i) => (
              <MiniBar key={i} label={c.company || c.code} value={c.revenue} max={maxRevClient}
                color={i === 0 ? 'bg-purple-600' : i === 1 ? 'bg-purple-400' : 'bg-purple-200'} />
            ))}
            {(!topClients || !topClients.length) && <p className="text-xs text-gray-400">No data yet.</p>}
          </div>
        </div>
      </div>

      {/* Rate health table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-4">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-sm text-gray-700">Rate Version Health — All Partners</h2>
          <span className="text-[10px] text-gray-400">Stale = &gt;90 days · Critical = &gt;180 days</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-50">
          {rateHealth.map(r => (
            <div key={r.partner} className={`p-3 ${r.critical ? 'bg-red-50' : r.stale ? 'bg-amber-50' : 'bg-green-50/40'}`}>
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`w-2 h-2 rounded-full ${r.critical ? 'bg-red-500' : r.stale ? 'bg-amber-500' : 'bg-green-500'}`} />
                <span className="text-xs font-bold text-gray-700 capitalize">{r.partner}</span>
              </div>
              <p className="text-[10px] text-gray-500">w.e.f. {r.label}</p>
              <p className={`text-[10px] font-semibold mt-0.5 ${r.critical ? 'text-red-700' : r.stale ? 'text-amber-700' : 'text-green-700'}`}>
                {r.ageInDays}d old {r.critical ? '⚠️ CRITICAL' : r.stale ? '⚠️ Stale' : '✓ OK'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent shipments */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-bold text-sm text-gray-700">Recent Shipments — Last 7 Days</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                {['Date','AWB','Consignee','Destination','Courier','Amount','Status'].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(recentShipments || []).map(s => (
                <tr key={s.id} className="border-t border-gray-50 hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-500">{s.date}</td>
                  <td className="px-3 py-2 font-mono font-bold text-slate-700">{s.awb}</td>
                  <td className="px-3 py-2 text-gray-700 max-w-[120px] truncate">{s.consignee}</td>
                  <td className="px-3 py-2 text-gray-500 max-w-[120px] truncate">{s.destination}</td>
                  <td className="px-3 py-2 text-gray-600">{s.courier}</td>
                  <td className="px-3 py-2 font-bold text-gray-800">{fmt(s.amount)}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      s.status==='Delivered'?'bg-green-100 text-green-700':
                      s.status==='Booked'?'bg-blue-100 text-blue-700':
                      'bg-amber-100 text-amber-700'}`}>{s.status}</span>
                  </td>
                </tr>
              ))}
              {(!recentShipments || !recentShipments.length) && (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-gray-400">No shipments found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
