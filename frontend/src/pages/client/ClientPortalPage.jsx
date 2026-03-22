// src/pages/client/ClientPortalPage.jsx — Client self-service dashboard
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { PageLoader } from '../../components/ui/Loading';

const fmt = n => `₹${Number(n||0).toLocaleString('en-IN')}`;

export default function ClientPortalPage({ toast }) {
  const { user } = useAuth();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/shipments/stats/my')
      .then(r => setStats(r.data))
      .catch(e => toast?.(e.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const cards = [
    { label: 'Total Shipments', value: stats?.total   || 0,  icon: '📦', to: '/portal/shipments' },
    { label: 'In Transit',      value: stats?.transit  || 0,  icon: '🚚', to: '/portal/shipments?status=InTransit' },
    { label: 'Delivered',       value: stats?.delivered || 0, icon: '✅', to: '/portal/shipments?status=Delivered' },
    { label: 'Wallet Balance',  value: fmt(stats?.wallet), icon: '💰', to: '/portal/wallet' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src="/images/logo.png" 
            alt="Sea Hawk Logo" 
            style={{ height: 32, width: 'auto', objectFit: 'contain' }} 
          />
          <div>
            <div className="font-bold text-gray-900">Sea Hawk Courier</div>
            <div className="text-xs text-gray-500">Client Portal</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
          <Link to="/track" target="_blank" className="btn-secondary btn-sm">🔍 Public Tracker</Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <h1 className="text-xl font-bold text-gray-900">Your Shipment Overview</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map(({ label, value, icon, to }) => (
            <Link key={label} to={to} className="card hover:shadow-md transition-shadow">
              <div className="text-2xl mb-2">{icon}</div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'My Shipments', icon: '📦', to: '/portal/shipments', desc: 'View all your shipments' },
            { label: 'Track',        icon: '🔍', to: '/portal/track',     desc: 'Track by AWB number' },
            { label: 'Invoices',     icon: '🧾', to: '/portal/invoices',  desc: 'Download invoices' },
            { label: 'Wallet',       icon: '💰', to: '/portal/wallet',    desc: 'Balance & transactions' },
          ].map(({ label, icon, to, desc }) => (
            <Link key={label} to={to} className="card flex items-center gap-3 hover:shadow-md transition-shadow">
              <span className="text-2xl">{icon}</span>
              <div>
                <div className="font-semibold text-gray-800 text-sm">{label}</div>
                <div className="text-xs text-gray-400">{desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
