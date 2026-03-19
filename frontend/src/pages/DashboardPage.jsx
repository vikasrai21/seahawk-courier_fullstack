// DashboardPage.jsx — Phase 3 Enhanced Dashboard
// Features: Pending actions, RTO alerts, profit margin, activity feed,
//           pinned clients, keyboard shortcuts, client comparison

import { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  RefreshCw, AlertTriangle, TrendingUp, TrendingDown,
  Package, CheckCircle, Clock, RotateCcw, DollarSign,
  Bell, ChevronRight, Star, StarOff, Search, Zap,
  Truck, FileText, BarChart2, ArrowUp, ArrowDown
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line
} from 'recharts';
import api from '../services/api';
import { StatCard } from '../components/ui/StatCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PageLoader } from '../components/ui/Loading';
import { useAuth } from '../context/AuthContext';

const fmt    = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const fmtNum = n => Number(n || 0).toLocaleString('en-IN');
const COLORS  = ['#1a2b5e','#2563eb','#7c3aed','#0891b2','#059669','#d97706','#ef4444','#ec4899'];

// ── Pinned Clients (stored in localStorage) ───────────────────────────────
function usePinnedClients() {
  const [pinned, setPinned] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pinnedClients') || '[]'); } catch { return []; }
  });
  const toggle = (code) => {
    const next = pinned.includes(code) ? pinned.filter(c => c !== code) : [...pinned, code].slice(0, 6);
    setPinned(next);
    localStorage.setItem('pinnedClients', JSON.stringify(next));
  };
  return { pinned, toggle };
}

// ── Keyboard shortcuts ────────────────────────────────────────────────────
function useKeyboardShortcuts(navigate) {
  const [showHelp, setShowHelp] = useState(false);
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) { setShowHelp(h => !h); return; }
      if (e.key === 'n' || e.key === 'N') { navigate('/app/entry'); return; }
      if (e.key === 'i' || e.key === 'I') { navigate('/app/import'); return; }
      if (e.key === 'd' || e.key === 'D') { navigate('/app/daily'); return; }
      if (e.key === 'a' || e.key === 'A') { navigate('/app/all'); return; }
      if (e.key === 't' || e.key === 'T') { navigate('/app/track'); return; }
      if (e.key === 'Escape') setShowHelp(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);
  return { showHelp, setShowHelp };
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export default function DashboardPage() {
  const { user, isAdmin, hasRole } = useAuth();
  const navigate = useNavigate();
  const { pinned, toggle: togglePin } = usePinnedClients();
  const { showHelp, setShowHelp } = useKeyboardShortcuts(navigate);

  const [stats,       setStats]      = useState(null);
  const [actions,     setActions]    = useState(null);
  const [rtoAlerts,   setRtoAlerts]  = useState([]);
  const [activity,    setActivity]   = useState([]);
  const [clients,     setClients]    = useState([]);
  const [profit,      setProfit]     = useState(null);
  const [comparison,  setComparison] = useState(null);
  const [loading,     setLoading]    = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const calls = [
        api.get('/shipments/stats/today'),
        api.get('/ops/pending-actions'),
        api.get('/ops/recent-activity?limit=10'),
        api.get('/clients'),
      ];
      if (isAdmin || hasRole('OPS_MANAGER')) {
        calls.push(api.get('/ops/rto-alerts'));
        calls.push(api.get('/ops/profit-summary?dateFrom=' + new Date(Date.now() - 30*86400000).toISOString().split('T')[0]));
        calls.push(api.get('/ops/client-comparison'));
      }
      const results = await Promise.allSettled(calls);
      if (results[0].status === 'fulfilled') setStats(results[0].value);
      if (results[1].status === 'fulfilled') setActions(results[1].value);
      if (results[2].status === 'fulfilled') setActivity(results[2].value || []);
      if (results[3].status === 'fulfilled') setClients(results[3].value || []);
      if (results[4]?.status === 'fulfilled') setRtoAlerts(results[4].value?.alerts || []);
      if (results[5]?.status === 'fulfilled') setProfit(results[5].value);
      if (results[6]?.status === 'fulfilled') setComparison(results[6].value);
      setLastUpdated(new Date());
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const courierData = (stats?.byCourier || []).map(c => ({ name: c.courier || 'Other', value: parseInt(c._count?.id || c.cnt || 0) }));
  const pinnedClients = clients.filter(c => pinned.includes(c.code));

  if (loading) return <PageLoader />;

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Good {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{today}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowHelp(true)} title="Keyboard shortcuts (?)" className="btn-secondary btn-sm">
            <Zap className="w-3.5 h-3.5" /> Shortcuts
          </button>
          <button onClick={load} className="btn-secondary btn-sm gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* ── RTO Alerts ── */}
      {rtoAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm font-bold text-red-700">⚠️ High RTO Rate Alert (Last 30 days)</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {rtoAlerts.map(a => (
              <div key={a.courier} className="flex items-center gap-2 bg-white border border-red-200 rounded-lg px-3 py-1.5">
                <span className="text-sm font-semibold text-gray-800">{a.courier}</span>
                <span className="text-xs font-bold text-red-600">{a.rate}% RTO</span>
                <span className="text-xs text-gray-400">({a.rto}/{a.total})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Pending Actions Banner ── */}
      {actions?.total > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-bold text-amber-700">{actions.total} items need your attention</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {actions.pendingNDRs > 0 && (
              <Link to="/app/ndr" className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-sm font-semibold text-gray-800 hover:bg-amber-50">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                {actions.pendingNDRs} Pending NDRs
              </Link>
            )}
            {actions.draftInvoices > 0 && (
              <Link to="/app/invoices" className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-sm font-semibold text-gray-800 hover:bg-amber-50">
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                {actions.draftInvoices} Draft Invoices
              </Link>
            )}
            {actions.todayPickups > 0 && (
              <Link to="/app/pickups" className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-sm font-semibold text-gray-800 hover:bg-amber-50">
                <Package className="w-3.5 h-3.5 text-amber-500" />
                {actions.todayPickups} Pickups Today
              </Link>
            )}
            {actions.rtoShipments > 0 && (
              <Link to="/app/all?status=RTO" className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-sm font-semibold text-gray-800 hover:bg-amber-50">
                <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                {actions.rtoShipments} Stale RTOs
              </Link>
            )}
            {actions.overdueShipments > 0 && (
              <Link to="/app/pending" className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-sm font-semibold text-gray-800 hover:bg-amber-50">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                {actions.overdueShipments} Overdue (7+ days)
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── Today's Stats ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Today's Overview</h2>
          <span className="badge badge-blue">{stats?.date || new Date().toISOString().split('T')[0]}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard label="Shipments"   value={stats?.total || 0}                   icon="📦" color="navy" />
          <StatCard label="Delivered"   value={stats?.delivered || 0}               icon="✅" color="green" />
          <StatCard label="In Transit"  value={stats?.inTransit || 0}               icon="🚚" color="blue" />
          <StatCard label="Revenue"     value={fmt(stats?.amount)}                  icon="💰" color="purple" />
          <StatCard label="Weight (kg)" value={`${(stats?.weight || 0).toFixed(1)}`} icon="⚖️" color="yellow" />
        </div>
      </div>

      {/* ── Profit Summary (admin/ops only) ── */}
      {profit && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-navy-800 to-navy-600 rounded-xl p-4 text-white" style={{ background: 'linear-gradient(135deg, #1a2b5e, #2563eb)' }}>
            <div className="text-xs opacity-60 mb-1 uppercase tracking-wide">30-day Revenue</div>
            <div className="text-xl font-black">{fmt(profit.totalRevenue)}</div>
            <div className="text-xs opacity-50 mt-1">{fmtNum(profit.totalShipments)} shipments</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Avg per Shipment</div>
            <div className="text-xl font-black text-gray-900">{fmt(profit.avgPerShipment)}</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Total Weight</div>
            <div className="text-xl font-black text-gray-900">{(profit.totalWeight || 0).toFixed(1)} kg</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Top Courier</div>
            <div className="text-xl font-black text-gray-900">{profit.byCourier?.[0]?.courier || '—'}</div>
            <div className="text-xs text-gray-400">{fmt(profit.byCourier?.[0]?.revenue || 0)}</div>
          </div>
        </div>
      )}

      {/* ── Main grid: charts + activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Courier breakdown */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Today by Courier</h3>
          {courierData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={courierData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4,4,0,0]}>
                    {courierData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 grid grid-cols-2 gap-1">
                {courierData.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-700">{c.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{c.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <Truck className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">No shipments today yet</p>
            </div>
          )}
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Activity Feed</h3>
            <Link to="/app/audit" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          {activity.length > 0 ? (
            <div className="space-y-2.5 max-h-64 overflow-y-auto">
              {activity.map(a => (
                <div key={a.id} className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    {a.action === 'CREATE' ? '➕' : a.action === 'STATUS_CHANGE' ? '🔄' : a.action === 'DELETE' ? '🗑️' : '✏️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 leading-snug">
                      <span className="font-semibold">{a.user}</span>{' '}
                      {a.action === 'CREATE' ? 'created' : a.action === 'STATUS_CHANGE' ? 'updated status of' : a.action === 'DELETE' ? 'deleted' : 'updated'}{' '}
                      <span className="font-mono text-navy-600">{a.entityId}</span>
                    </p>
                    <p className="text-[10px] text-gray-400">{new Date(a.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No recent activity</p>
          )}
        </div>
      </div>

      {/* ── Client Comparison (admin/ops only) ── */}
      {comparison?.clients?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-orange-500" />
              <h3 className="text-sm font-bold text-gray-700">Client Month-over-Month</h3>
              <span className="text-xs text-gray-400">{comparison.lastMonth} → {comparison.thisMonth}</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Client','This Month','Last Month','Change','Revenue (This)','Revenue Change'].map(h => (
                    <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: '.72rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.clients.slice(0, 8).map(c => (
                  <tr key={c.code} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ fontWeight: 700, fontSize: '.82rem' }}>{c.company}</div>
                      <div style={{ fontSize: '.68rem', color: '#9ca3af' }}>{c.code}</div>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '.82rem', fontWeight: 700 }}>{fmtNum(c.thisCount)}</td>
                    <td style={{ padding: '10px 16px', fontSize: '.82rem', color: '#6b7280' }}>{fmtNum(c.lastCount)}</td>
                    <td style={{ padding: '10px 16px' }}>
                      {c.countChange !== null ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '.78rem', fontWeight: 700, color: c.countChange >= 0 ? '#16a34a' : '#dc2626' }}>
                          {c.countChange >= 0 ? <ArrowUp style={{ width: 12 }} /> : <ArrowDown style={{ width: 12 }} />}
                          {Math.abs(c.countChange)}%
                        </span>
                      ) : <span style={{ color: '#9ca3af', fontSize: '.72rem' }}>New</span>}
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: '.82rem', fontWeight: 700 }}>{fmt(c.thisRevenue)}</td>
                    <td style={{ padding: '10px 16px' }}>
                      {c.revenueChange !== null ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '.78rem', fontWeight: 700, color: c.revenueChange >= 0 ? '#16a34a' : '#dc2626' }}>
                          {c.revenueChange >= 0 ? <ArrowUp style={{ width: 12 }} /> : <ArrowDown style={{ width: 12 }} />}
                          {Math.abs(c.revenueChange)}%
                        </span>
                      ) : <span style={{ color: '#9ca3af', fontSize: '.72rem' }}>New</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Pinned Clients ── */}
      {clients.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Pinned Clients</h3>
            <span className="text-xs text-gray-400">(click ★ on any client to pin)</span>
          </div>
          {pinnedClients.length === 0 ? (
            <div className="text-sm text-gray-400 py-2">
              No pinned clients yet. Go to{' '}
              <Link to="/app/clients" className="text-blue-600 hover:underline">Clients page</Link>{' '}
              and click the star icon on your top clients.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {pinnedClients.map(c => (
                <Link key={c.code} to={`/app/all?client=${c.code}`}
                  className="flex flex-col items-center p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-all text-center">
                  <div className="w-8 h-8 rounded-lg bg-navy-600 text-white flex items-center justify-center font-bold text-sm mb-1.5" style={{ background: '#1a2b5e' }}>
                    {c.code[0]}
                  </div>
                  <span className="text-xs font-bold text-gray-800 truncate w-full text-center">{c.company}</span>
                  <span className="text-[10px] text-gray-400">{c.code}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Link to="/app/entry"   className="btn-primary btn-sm">➕ New Entry <kbd className="ml-1 text-[9px] opacity-60 bg-white/20 rounded px-1">N</kbd></Link>
          <Link to="/app/import"  className="btn-secondary btn-sm">📥 Import <kbd className="ml-1 text-[9px] opacity-50 bg-gray-100 rounded px-1">I</kbd></Link>
          <Link to="/app/daily"   className="btn-secondary btn-sm">📋 Daily Sheet <kbd className="ml-1 text-[9px] opacity-50 bg-gray-100 rounded px-1">D</kbd></Link>
          <Link to="/app/all"     className="btn-secondary btn-sm">📦 All Shipments <kbd className="ml-1 text-[9px] opacity-50 bg-gray-100 rounded px-1">A</kbd></Link>
          <Link to="/app/track"   className="btn-secondary btn-sm">🔍 Track <kbd className="ml-1 text-[9px] opacity-50 bg-gray-100 rounded px-1">T</kbd></Link>
          <Link to="/app/pending" className="btn-secondary btn-sm">⏳ Pending</Link>
          <Link to="/app/invoices" className="btn-secondary btn-sm">🧾 Invoices</Link>
        </div>
      </div>

      {lastUpdated && (
        <p className="text-xs text-gray-400 text-right">Last updated: {lastUpdated.toLocaleTimeString()}</p>
      )}

      {/* ── Keyboard Shortcuts Modal ── */}
      {showHelp && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowHelp(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-orange-500" />
              <h3 className="font-bold text-gray-900">Keyboard Shortcuts</h3>
            </div>
            <div className="space-y-2">
              {[
                ['N', 'New Entry'],
                ['I', 'Import Excel'],
                ['D', 'Daily Sheet'],
                ['A', 'All Shipments'],
                ['T', 'Track Shipment'],
                ['?', 'Toggle this help'],
                ['Esc', 'Close modal'],
              ].map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{label}</span>
                  <kbd className="px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs font-mono font-bold">{key}</kbd>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">Shortcuts don't work when typing in a field.</p>
            <button onClick={() => setShowHelp(false)} className="btn-primary btn-sm w-full mt-4">Got it</button>
          </div>
        </div>
      )}
    </div>
  );
}
