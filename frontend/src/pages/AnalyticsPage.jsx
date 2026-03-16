import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Package, CheckCircle2, AlertTriangle, RotateCcw, RefreshCw, BarChart2, Award } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../services/api';

const fmt    = n => `₹${Number(n||0).toLocaleString('en-IN')}`;
const fmtPct = n => `${Number(n||0).toFixed(1)}%`;

const COLORS = ['#e8580a','#0b1f3a','#4ade80','#fbbf24','#60a5fa','#a78bfa','#f87171','#34d399'];

const PERIODS = [
  { label:'Today',    days:0  },
  { label:'7 days',   days:7  },
  { label:'30 days',  days:30 },
  { label:'90 days',  days:90 },
  { label:'1 Year',   days:365},
  { label:'All time', days:-1 },
];

function dateRange(days) {
  if (days < 0) return {};
  const to   = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return {
    dateFrom: from.toISOString().split('T')[0],
    dateTo:   to.toISOString().split('T')[0],
  };
}

export default function AnalyticsPage({ toast }) {
  const [period,    setPeriod]    = useState(30);
  const [overview,  setOverview]  = useState(null);
  const [couriers,  setCouriers]  = useState([]);
  const [monthly,   setMonthly]   = useState([]);
  const [ndr,       setNdr]       = useState(null);
  const [loading,   setLoading]   = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(dateRange(period));
      const [r1,r2,r3,r4] = await Promise.all([
        api.get(`/analytics/overview?${params}`),
        api.get(`/analytics/couriers?${params}`),
        api.get('/analytics/monthly'),
        api.get('/analytics/ndr'),
      ]);
      setOverview(r1.data);
      setCouriers(r2.data?.carriers || r2.data || []);
      setMonthly(r3.data?.months || r3.data || []);
      setNdr(r4.data);
    } catch(e) { toast?.(e.message,'error'); }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => { load(); }, [load]);

  const kpi = overview?.kpis;

  const KpiCard = ({ label, val, sub, icon: Icon, color, trend }) => (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div className={`w-8 h-8 rounded-lg bg-${color}-50 flex items-center justify-center`}>
          <Icon className={`w-4 h-4 text-${color}-500`}/>
        </div>
        {trend !== undefined && (
          <span className={`text-xs font-bold ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-gray-900">{val ?? '—'}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Performance Analytics</h1>
          <p className="text-xs text-gray-400 mt-0.5">Delivery success rates, courier comparison, revenue trends</p>
        </div>
        <div className="flex gap-2 items-center">
          {/* Period selector */}
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {PERIODS.map(p => (
              <button key={p.days}
                onClick={() => setPeriod(p.days)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  period===p.days ? 'bg-white text-navy-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={load} className="btn-secondary btn-sm">
            <RefreshCw className="w-3.5 h-3.5"/>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><RefreshCw className="w-8 h-8 animate-spin text-gray-300"/></div>
      ) : (
        <div className="space-y-6">
          {/* KPI Cards */}
          {kpi && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard label="Total Shipments"  val={kpi.totalShipments?.toLocaleString()}  icon={Package}       color="blue"   />
              <KpiCard label="Delivery Rate"    val={kpi.deliveryRate}                       icon={CheckCircle2}  color="green"  />
              <KpiCard label="RTO Rate"         val={kpi.rtoRate}                            icon={RotateCcw}     color="red"    />
              <KpiCard label="Total Revenue"    val={fmt(kpi.totalRevenue)}                  icon={TrendingUp}    color="orange" />
            </div>
          )}

          {/* Charts row */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Monthly revenue trend */}
            {monthly.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <p className="text-sm font-bold text-gray-700 mb-4">Monthly Revenue & Shipments</p>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                    <XAxis dataKey="month" tick={{fontSize:10}} />
                    <YAxis yAxisId="left" tick={{fontSize:10}} tickFormatter={v=>fmt(v).replace('₹','')}/>
                    <YAxis yAxisId="right" orientation="right" tick={{fontSize:10}}/>
                    <Tooltip formatter={(v,n) => n==='revenue' ? fmt(v) : v}/>
                    <Legend wrapperStyle={{fontSize:11}}/>
                    <Line yAxisId="left"  type="monotone" dataKey="revenue"   stroke="#e8580a" strokeWidth={2} dot={false} name="Revenue (₹)"/>
                    <Line yAxisId="right" type="monotone" dataKey="shipments" stroke="#0b1f3a" strokeWidth={2} dot={false} name="Shipments"/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Status distribution */}
            {overview?.byStatus?.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <p className="text-sm font-bold text-gray-700 mb-4">Shipment Status Distribution</p>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={overview.byStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label={({status,percent})=>`${status} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                      {(overview.byStatus).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]}/>)}
                    </Pie>
                    <Tooltip/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Courier Performance Table */}
          {couriers.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                <Award className="w-4 h-4 text-orange-500"/>
                <p className="text-sm font-bold text-gray-700">Carrier Performance</p>
              </div>
              <div className="overflow-x-auto">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th className="th">Carrier</th>
                      <th className="th text-right">Shipments</th>
                      <th className="th text-right">Delivered</th>
                      <th className="th text-right">Delivery %</th>
                      <th className="th text-right">RTO</th>
                      <th className="th text-right">NDR</th>
                      <th className="th text-right">Avg. Days</th>
                      <th className="th text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {couriers.map((c,i) => (
                      <tr key={c.courier || i} className="hover:bg-gray-50">
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{background:COLORS[i%COLORS.length]}}/>
                            <span className="text-sm font-semibold">{c.carrier || c.courier || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="text-xs text-right font-medium">{c.total?.toLocaleString() || c.count}</td>
                        <td className="text-xs text-right text-green-600 font-medium">{c.delivered || '—'}</td>
                        <td className="text-xs text-right">
                          <span className={`font-bold ${(c.deliveryRate||0) >= 90 ? 'text-green-600' : (c.deliveryRate||0) >= 75 ? 'text-yellow-600' : 'text-red-500'}`}>
                            {fmtPct(c.deliveryRate || (c.delivered && c.total ? (c.delivered/c.total*100) : 0))}
                          </span>
                        </td>
                        <td className="text-xs text-right text-red-500">{c.rto || 0}</td>
                        <td className="text-xs text-right text-orange-500">{c.ndr || 0}</td>
                        <td className="text-xs text-right text-gray-500">
                          {c.avgDeliveryDays ? `${c.avgDeliveryDays.toFixed(1)}d` : '—'}
                        </td>
                        <td className="text-xs text-right font-medium">{fmt(c.revenue || c.totalRevenue || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* NDR by reason */}
          {ndr?.byReason?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-sm font-bold text-gray-700 mb-4">Top NDR Reasons</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ndr.byReason} layout="vertical" margin={{left:20}}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0"/>
                  <XAxis type="number" tick={{fontSize:10}}/>
                  <YAxis type="category" dataKey="reason" tick={{fontSize:10}} width={160}/>
                  <Tooltip/>
                  <Bar dataKey="count" fill="#e8580a" radius={[0,4,4,0]} name="Count"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
