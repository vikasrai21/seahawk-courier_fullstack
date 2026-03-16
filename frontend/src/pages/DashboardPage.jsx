import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../services/api';
import { StatCard } from '../components/ui/StatCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PageLoader } from '../components/ui/Loading';
import { useAuth } from '../context/AuthContext';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/shipments/stats/today');
      setStats(res.data);
      setLastUpdated(new Date());
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) return <PageLoader />;

  const courierData = (stats?.byCourier || []).map((c) => ({
    name: c.courier || 'Other',
    value: parseInt(c._count?.id || c.cnt || 0),
  }));

  const COLORS = ['#1a2b5e', '#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706'];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Good {getGreeting()}, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-sm text-gray-500 mt-0.5">{today}</p>
        </div>
        <button onClick={load} className="btn-secondary btn-sm gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Today's Overview */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Today's Overview</h2>
          <span className="badge badge-blue">{stats?.date || new Date().toISOString().split('T')[0]}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard label="Shipments"  value={stats?.total || 0}     icon="📦" color="navy" />
          <StatCard label="Delivered"  value={stats?.delivered || 0} icon="✅" color="green" />
          <StatCard label="In Transit" value={stats?.inTransit || 0} icon="🚚" color="blue" />
          <StatCard label="Revenue"    value={fmt(stats?.amount)}     icon="💰" color="purple" />
          <StatCard label="Weight (kg)" value={`${(stats?.weight || 0).toFixed(1)}`} icon="⚖️" color="yellow" />
        </div>
      </div>

      {/* Courier breakdown + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Courier breakdown */}
        <div className="card">
          <h3 className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-wide">Today by Courier</h3>
          {courierData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={courierData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {courierData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1">
                {courierData.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
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
            <p className="text-sm text-gray-400 text-center py-8">No shipments today yet</p>
          )}
        </div>

        {/* Recent activity */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Recent Activity</h3>
            <Link to="/all" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          {(stats?.recentActivity || []).length > 0 ? (
            <div className="space-y-2">
              {stats.recentActivity.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-xs font-bold text-gray-800">{s.awb}</p>
                    <p className="text-xs text-gray-500">{s.clientCode} · {s.courier || '—'}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={s.status} />
                    <p className="text-xs text-gray-400 mt-0.5">{fmt(s.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-8">No activity today</p>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Link to="/entry"   className="btn-primary btn-sm">➕ New Shipment</Link>
          <Link to="/daily"   className="btn-secondary btn-sm">📋 Daily Sheet</Link>
          <Link to="/pending" className="btn-secondary btn-sm">⏳ View Pending</Link>
          <Link to="/import"  className="btn-secondary btn-sm">📥 Import Excel</Link>
          <Link to="/sync"    className="btn-secondary btn-sm">💾 Export Backup</Link>
        </div>
      </div>

      {lastUpdated && (
        <p className="text-xs text-gray-400 text-right">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
