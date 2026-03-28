// src/pages/client/ClientPortalPage.jsx
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/ui/StatusBadge';

const fmt = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;

function StatCard({ icon, label, value, sub, to, color = '#3b82f6' }) {
  return (
    <Link to={to} style={{
      display: 'block', textDecoration: 'none',
      background: '#ffffff', borderRadius: 16,
      border: '1px solid #e8f0fb',
      padding: '20px 22px',
      boxShadow: '0 4px 24px -4px rgba(11,31,58,0.07)',
      transition: 'all 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 36px -6px rgba(11,31,58,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 24px -4px rgba(11,31,58,0.07)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 24 }}>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color, background: `${color}15`, padding: '3px 9px', borderRadius: 99, letterSpacing: '0.04em' }}>{sub}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: '#0b1f3a', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#5a6b80', marginTop: 6, fontWeight: 500 }}>{label}</div>
    </Link>
  );
}

export default function ClientPortalPage({ toast }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatus] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/portal/stats'),
      api.get('/portal/shipments?limit=10'),
    ]).then(([sRes, shRes]) => {
      setStats(sRes.data);
      setShipments(shRes.data?.shipments || []);
    }).catch(e => toast?.(e.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const filtered = shipments.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q || s.awb?.toLowerCase().includes(q) || s.consignee?.toLowerCase().includes(q) || s.destination?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7fd', fontFamily: "'DM Sans',-apple-system,sans-serif" }}>

      {/* Top Nav */}
      <header style={{
        background: '#fff', borderBottom: '1px solid #e2eaf5',
        padding: '0 24px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 20,
        boxShadow: '0 1px 12px rgba(11,31,58,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/images/logo.png" alt="Sea Hawk" style={{ height: 34, width: 'auto', objectFit: 'contain', background: '#fff', borderRadius: 7, padding: 2, border: '1px solid #e2eaf5' }} />
          <div>
            <div style={{ fontWeight: 800, color: '#0b1f3a', fontSize: 14, lineHeight: 1.2 }}>Sea Hawk Courier</div>
            <div style={{ fontSize: 10, color: '#e8580a', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Client Portal</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0b1f3a' }}>{user?.name}</div>
            <div style={{ fontSize: 10, color: '#8a9ab0' }}>Client Account</div>
          </div>
          <button onClick={handleLogout} style={{
            padding: '7px 14px', borderRadius: 8, border: '1px solid #dde4f0',
            background: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#5a6b80',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#fdedef'; e.currentTarget.style.color = '#c8303a'; e.currentTarget.style.borderColor = '#f9c4c7'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#5a6b80'; e.currentTarget.style.borderColor = '#dde4f0'; }}
          >Sign Out</button>
        </div>
      </header>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 20px' }}>

        {/* Welcome */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0b1f3a', margin: 0 }}>
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ fontSize: 13, color: '#5a6b80', margin: '4px 0 0' }}>Here's your shipment overview</p>
        </div>

        {/* Stat cards */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14, marginBottom: 28 }}>
            {[1, 2, 3, 4].map(i => <div key={i} style={{ height: 110, borderRadius: 16, background: '#e8f0fb', animation: 'pulse 1.5s ease infinite' }} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14, marginBottom: 28 }}>
            <StatCard icon="📦" label="Total Shipments" value={stats?.total || 0} sub="ALL TIME" color="#3b82f6" to="/portal" />
            <StatCard icon="🚚" label="In Transit" value={stats?.transit || 0} sub="ACTIVE" color="#f97316" to="/portal" />
            <StatCard icon="✅" label="Delivered" value={stats?.delivered || 0} sub="COMPLETED" color="#0c7a52" to="/portal" />
            <StatCard icon="💰" label="Wallet Balance" value={fmt(stats?.wallet)} sub="BALANCE" color="#a855f7" to="/portal" />
          </div>
        )}

        {/* Quick nav */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 28, flexWrap: 'wrap' }}>
          {[
            { label: 'Track a Shipment', icon: '🔍', to: '/track', external: true },
            { label: 'My Invoices', icon: '🧾', to: '/portal/invoices' },
            { label: 'Wallet & Payments', icon: '💳', to: '/portal/wallet' },
          ].map(({ label, icon, to, external }) => (
            <Link key={label} to={to} target={external ? '_blank' : undefined} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 16px', borderRadius: 99,
              background: '#fff', border: '1px solid #dde4f0',
              textDecoration: 'none', fontSize: 12, fontWeight: 600, color: '#2c3a4d',
              boxShadow: '0 2px 8px rgba(11,31,58,0.05)',
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#e8580a'; e.currentTarget.style.color = '#e8580a'; e.currentTarget.style.background = '#fff3ec'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#dde4f0'; e.currentTarget.style.color = '#2c3a4d'; e.currentTarget.style.background = '#fff'; }}
            >
              <span>{icon}</span> {label}
            </Link>
          ))}
        </div>

        {/* Recent shipments */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #e2eaf5', overflow: 'hidden', boxShadow: '0 4px 24px -4px rgba(11,31,58,0.07)' }}>
          <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #f0f4fb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0b1f3a', margin: 0 }}>Recent Shipments</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search AWB, consignee…"
                style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #dde4f0', fontSize: 12, outline: 'none', width: 180, background: '#f7faff' }}
              />
              <select value={statusFilter} onChange={e => setStatus(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #dde4f0', fontSize: 12, outline: 'none', background: '#f7faff', color: '#2c3a4d' }}>
                <option value="">All Status</option>
                <option value="Booked">Booked</option>
                <option value="InTransit">In Transit</option>
                <option value="OutForDelivery">Out For Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Delayed">Delayed</option>
                <option value="RTO">RTO</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#8a9ab0', fontSize: 13 }}>Loading shipments…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#8a9ab0', fontSize: 13 }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              No shipments found
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f7faff' }}>
                    {['AWB', 'Date', 'Consignee', 'Destination', 'Courier', 'Weight', 'Status'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#5a6b80', fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid #e8f0fb', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f0f4fb', background: i % 2 === 0 ? '#fff' : '#fafbff', transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f0f6ff'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafbff'}
                    >
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0b1f3a', fontFamily: 'monospace', fontSize: 11 }}>{s.awb}</td>
                      <td style={{ padding: '10px 14px', color: '#5a6b80', whiteSpace: 'nowrap' }}>{s.date}</td>
                      <td style={{ padding: '10px 14px', color: '#2c3a4d', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.consignee || '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#5a6b80', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.destination || '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#5a6b80' }}>{s.courier || '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#5a6b80' }}>{s.weight ? `${s.weight}kg` : '—'}</td>
                      <td style={{ padding: '10px 14px' }}><StatusBadge status={s.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ padding: '12px 20px', borderTop: '1px solid #f0f4fb', display: 'flex', justifyContent: 'flex-end' }}>
            <Link to="/portal/shipments" style={{ fontSize: 12, fontWeight: 700, color: '#e8580a', textDecoration: 'none' }}>
              View all shipments →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
