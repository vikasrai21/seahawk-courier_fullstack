// ClientPortalPage.jsx — Client self-service portal
// Clients see ONLY their own data: shipments, invoices, wallet, NDRs
import { useState, useEffect, useCallback } from 'react';
import { Package, FileText, Wallet, AlertTriangle, Search, Download, LogOut, RefreshCw, ChevronRight, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const fmt    = n => `₹${Number(n||0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const fmtNum = n => Number(n||0).toLocaleString('en-IN');

// ── Status badge ──────────────────────────────────────────────────────────
const STATUS_COLORS = {
  'Booked':           { bg: '#eff6ff', text: '#1d4ed8' },
  'Picked Up':        { bg: '#f0fdf4', text: '#15803d' },
  'In Transit':       { bg: '#fef9c3', text: '#a16207' },
  'Out for Delivery': { bg: '#fff7ed', text: '#c2410c' },
  'Delivered':        { bg: '#f0fdf4', text: '#15803d' },
  'Failed':           { bg: '#fef2f2', text: '#dc2626' },
  'RTO':              { bg: '#fdf4ff', text: '#7e22ce' },
  'Cancelled':        { bg: '#f1f5f9', text: '#475569' },
};
function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || { bg: '#f1f5f9', text: '#475569' };
  return (
    <span style={{ background: c.bg, color: c.text, padding: '2px 10px', borderRadius: 20, fontSize: '.72rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
      {status}
    </span>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────
function Skeleton({ w = '100%', h = 18, radius = 6 }) {
  return <div style={{ width: w, height: h, background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', borderRadius: radius }} />;
}

// ── Tabs ──────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'shipments', label: 'Shipments', icon: Package },
  { id: 'invoices',  label: 'Invoices',  icon: FileText },
  { id: 'wallet',    label: 'Wallet',    icon: Wallet   },
  { id: 'ndrs',      label: 'NDRs',      icon: AlertTriangle },
];

export default function ClientPortalPage() {
  const { user, logout } = useAuth();
  const [tab,       setTab]       = useState('shipments');
  const [client,    setClient]    = useState(null);
  const [stats,     setStats]     = useState(null);
  const [loadingMe, setLoadingMe] = useState(true);

  useEffect(() => {
    api.get('/client-portal/me').then(r => {
      setClient(r.data.client);
    }).catch(() => {}).finally(() => setLoadingMe(false));

    api.get('/client-portal/shipments/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await logout();
    window.location.href = '/client-login';
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Shimmer animation */}
      <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>

      {/* ── Header ── */}
      <header style={{ background: '#0b1f3a', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/images/logo.png" alt="Sea Hawk" style={{ height: 32 }} onError={e => e.target.style.display='none'} />
          <div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '.9rem' }}>Sea Hawk Courier & Cargo</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '.68rem' }}>Client Portal</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {loadingMe ? <Skeleton w={120} h={14} /> : (
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#fff', fontSize: '.82rem', fontWeight: 700 }}>{client?.company || user?.name}</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '.68rem' }}>Code: {user?.clientCode}</div>
            </div>
          )}
          <button onClick={handleLogout} title="Logout" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}>
            <LogOut style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 20px' }}>
        {/* ── Stats row ── */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Total Shipments', val: fmtNum(stats.total),     color: '#3b82f6' },
              { label: 'Delivered',       val: fmtNum(stats.delivered), color: '#22c55e' },
              { label: 'In Transit',      val: fmtNum(stats.inTransit), color: '#f59e0b' },
              { label: 'RTO',             val: fmtNum(stats.rto),       color: '#ef4444' },
              { label: 'Wallet Balance',  val: fmt(client?.walletBalance || 0), color: '#8b5cf6' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ background: '#fff', borderRadius: 12, padding: '16px', border: '1px solid #e5e7eb', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color }}>{val}</div>
                <div style={{ fontSize: '.72rem', color: '#6b7280', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: '#fff', borderRadius: 10, padding: 4, border: '1px solid #e5e7eb', width: 'fit-content' }}>
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '.82rem', fontWeight: 700,
              background: tab === id ? '#0b1f3a' : 'transparent',
              color: tab === id ? '#fff' : '#6b7280',
              transition: 'all 0.15s',
            }}>
              <Icon style={{ width: 14, height: 14 }} />{label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        {tab === 'shipments' && <ShipmentsTab />}
        {tab === 'invoices'  && <InvoicesTab />}
        {tab === 'wallet'    && <WalletTab />}
        {tab === 'ndrs'      && <NDRsTab />}
      </div>
    </div>
  );
}

// ════════════════════════════════════════
// SHIPMENTS TAB
// ════════════════════════════════════════
function ShipmentsTab() {
  const [shipments, setShipments] = useState([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [status,    setStatus]    = useState('');
  const [selected,  setSelected]  = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ limit: 100 });
      if (search) p.set('q', search);
      if (status) p.set('status', status);
      const r = await api.get(`/client-portal/shipments?${p}`);
      setShipments(r.data.shipments || r.data || []);
      setTotal(r.data.total || 0);
    } catch {} finally { setLoading(false); }
  }, [search, status]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
      {/* Filters */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px' }}>
          <Search style={{ width: 14, height: 14, color: '#9ca3af' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search AWB, consignee..." style={{ border: 'none', background: 'none', outline: 'none', fontSize: '.82rem', width: '100%' }} />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X style={{ width: 12, height: 12 }} /></button>}
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: '.82rem', background: '#f9fafb' }}>
          <option value="">All Status</option>
          {['Booked','Picked Up','In Transit','Out for Delivery','Delivered','Failed','RTO','Cancelled'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button onClick={load} style={{ padding: '8px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer' }}><RefreshCw style={{ width: 14, height: 14 }} /></button>
        <span style={{ fontSize: '.75rem', color: '#9ca3af', marginLeft: 'auto' }}>{fmtNum(total)} shipments</span>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['Date','AWB','Consignee','Destination','Courier','Weight','Amount','Status',''].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '.72rem', fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.5px', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? Array(6).fill(0).map((_, i) => (
              <tr key={i}><td colSpan={9} style={{ padding: '12px 16px' }}><Skeleton h={16} /></td></tr>
            )) : shipments.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>📭</div>
                <div style={{ fontWeight: 600 }}>No shipments found</div>
              </td></tr>
            ) : shipments.map(s => (
              <tr key={s.id} style={{ borderTop: '1px solid #f3f4f6' }} onMouseEnter={e => e.currentTarget.style.background='#f9fafb'} onMouseLeave={e => e.currentTarget.style.background=''}>
                <td style={{ padding: '12px 16px', fontSize: '.78rem', color: '#374151' }}>{s.date}</td>
                <td style={{ padding: '12px 16px', fontSize: '.78rem', fontWeight: 700, fontFamily: 'monospace', color: '#0b1f3a' }}>{s.awb}</td>
                <td style={{ padding: '12px 16px', fontSize: '.78rem', color: '#374151', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.consignee}</td>
                <td style={{ padding: '12px 16px', fontSize: '.78rem', color: '#374151' }}>{s.destination}</td>
                <td style={{ padding: '12px 16px', fontSize: '.78rem', color: '#374151' }}>{s.courier}</td>
                <td style={{ padding: '12px 16px', fontSize: '.78rem', color: '#374151' }}>{s.weight}kg</td>
                <td style={{ padding: '12px 16px', fontSize: '.78rem', fontWeight: 700, color: '#0b1f3a' }}>{fmt(s.amount)}</td>
                <td style={{ padding: '12px 16px' }}><StatusBadge status={s.status} /></td>
                <td style={{ padding: '12px 16px' }}>
                  <button onClick={() => setSelected(s)} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', fontSize: '.72rem', color: '#374151' }}>
                    Track
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Track modal */}
      {selected && <TrackModal awb={selected.awb} shipment={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ── Track Modal ──────────────────────────────────────────────────────────
function TrackModal({ awb, shipment, onClose }) {
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/client-portal/track/${awb}`)
      .then(r => setData(r.data))
      .catch(() => setData(shipment))
      .finally(() => setLoading(false));
  }, [awb]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480, maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontWeight: 800, color: '#0b1f3a' }}>Tracking: {awb}</h3>
            <p style={{ margin: '2px 0 0', fontSize: '.75rem', color: '#9ca3af' }}>{shipment.consignee} → {shipment.destination}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X style={{ width: 18, height: 18 }} /></button>
        </div>
        <div style={{ padding: '20px 24px' }}>
          {loading ? <Skeleton h={120} /> : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <StatusBadge status={data?.status || shipment.status} />
                <span style={{ fontSize: '.75rem', color: '#9ca3af' }}>{shipment.courier}</span>
              </div>
              {/* Tracking events */}
              {(data?.trackingEvents || []).length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {data.trackingEvents.map((e, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: 16 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: i === 0 ? '#e8580a' : '#d1d5db', flexShrink: 0, marginTop: 3 }} />
                        {i < data.trackingEvents.length - 1 && <div style={{ width: 2, flex: 1, background: '#f3f4f6', minHeight: 16 }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '.82rem', fontWeight: 700, color: i === 0 ? '#0b1f3a' : '#374151' }}>{e.status}</div>
                        {e.location && <div style={{ fontSize: '.72rem', color: '#6b7280' }}>{e.location}</div>}
                        {e.description && <div style={{ fontSize: '.72rem', color: '#9ca3af' }}>{e.description}</div>}
                        <div style={{ fontSize: '.68rem', color: '#9ca3af', marginTop: 2 }}>{new Date(e.timestamp).toLocaleString('en-IN')}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px', color: '#9ca3af', fontSize: '.82rem' }}>
                  No tracking events yet. Check back soon.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════
// INVOICES TAB
// ════════════════════════════════════════
function InvoicesTab() {
  const [invoices, setInvoices] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get('/client-portal/invoices')
      .then(r => setInvoices(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const downloadPdf = (id, invoiceNo) => {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    const url = `/api/client-portal/invoices/${id}/pdf`;
    // Open in new tab — browser will handle download
    window.open(url, '_blank');
  };

  const STATUS_BADGE = { DRAFT: ['#f3f4f6','#374151'], SENT: ['#eff6ff','#1d4ed8'], PAID: ['#f0fdf4','#15803d'], CANCELLED: ['#fef2f2','#dc2626'] };

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
        <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: '#0b1f3a' }}>Your Invoices</h3>
        <p style={{ margin: '2px 0 0', fontSize: '.75rem', color: '#9ca3af' }}>Download PDF invoices for your records</p>
      </div>
      {loading ? (
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} h={60} radius={8} />)}
        </div>
      ) : invoices.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>📄</div>
          <div style={{ fontWeight: 600 }}>No invoices yet</div>
        </div>
      ) : (
        <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {invoices.map(inv => {
            const [bg, text] = STATUS_BADGE[inv.status] || STATUS_BADGE.DRAFT;
            return (
              <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', background: '#f9fafb', borderRadius: 10, border: '1px solid #f3f4f6' }}>
                <div style={{ fontSize: '1.5rem' }}>📄</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '.88rem', color: '#0b1f3a' }}>{inv.invoiceNo}</div>
                  <div style={{ fontSize: '.72rem', color: '#6b7280', marginTop: 2 }}>{inv.fromDate} to {inv.toDate} &nbsp;|&nbsp; {inv._count?.items || 0} shipments</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: '#0b1f3a', fontSize: '.88rem' }}>₹{Number(inv.total).toLocaleString('en-IN')}</div>
                  <span style={{ background: bg, color: text, padding: '2px 8px', borderRadius: 20, fontSize: '.65rem', fontWeight: 700 }}>{inv.status}</span>
                </div>
                <button onClick={() => downloadPdf(inv.id, inv.invoiceNo)} title="Download PDF" style={{ background: '#0b1f3a', border: 'none', borderRadius: 8, padding: '8px', cursor: 'pointer', color: '#fff', flexShrink: 0 }}>
                  <Download style={{ width: 14, height: 14 }} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════
// WALLET TAB
// ════════════════════════════════════════
function WalletTab() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/client-portal/wallet')
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Balance card */}
      <div style={{ background: 'linear-gradient(135deg, #0b1f3a, #1a3a6b)', borderRadius: 16, padding: '28px 24px', color: '#fff' }}>
        <div style={{ fontSize: '.78rem', opacity: .6, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Account Balance</div>
        {loading ? <Skeleton w={160} h={40} /> : (
          <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>{fmt(data?.balance || 0)}</div>
        )}
        <div style={{ fontSize: '.75rem', opacity: .5, marginTop: 8 }}>Payments accepted via UPI, bank transfer, cheque</div>
        <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(255,255,255,0.1)', borderRadius: 8, fontSize: '.78rem' }}>
          📞 To top up: Call <a href="tel:+919911565523" style={{ color: '#fbbf24', fontWeight: 700 }}>+91 99115 65523</a> or{' '}
          <a href="https://wa.me/919911565523" target="_blank" rel="noreferrer" style={{ color: '#4ade80', fontWeight: 700 }}>WhatsApp us</a>
        </div>
      </div>

      {/* Transaction history */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
          <h3 style={{ margin: 0, fontWeight: 800, fontSize: '.95rem', color: '#0b1f3a' }}>Transaction History</h3>
        </div>
        {loading ? (
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>{Array(5).fill(0).map((_, i) => <Skeleton key={i} h={44} radius={6} />)}</div>
        ) : !data?.transactions?.length ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>No transactions yet</div>
        ) : (
          <div>
            {data.transactions.map((t, i) => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderTop: i > 0 ? '1px solid #f3f4f6' : 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: t.type === 'CREDIT' ? '#f0fdf4' : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.9rem', flexShrink: 0 }}>
                  {t.type === 'CREDIT' ? '↑' : '↓'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '.82rem', fontWeight: 600, color: '#374151' }}>{t.description}</div>
                  <div style={{ fontSize: '.68rem', color: '#9ca3af' }}>{new Date(t.createdAt).toLocaleDateString('en-IN')}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: t.type === 'CREDIT' ? '#16a34a' : '#dc2626', fontSize: '.88rem' }}>
                    {t.type === 'CREDIT' ? '+' : '−'}{fmt(t.amount)}
                  </div>
                  <div style={{ fontSize: '.68rem', color: '#9ca3af' }}>Bal: {fmt(t.balance)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════
// NDRs TAB
// ════════════════════════════════════════
function NDRsTab() {
  const [ndrs,    setNdrs]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/client-portal/ndrs')
      .then(r => setNdrs(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
        <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: '#0b1f3a' }}>Non-Delivery Reports</h3>
        <p style={{ margin: '2px 0 0', fontSize: '.75rem', color: '#9ca3af' }}>Shipments with delivery exceptions — contact us to resolve</p>
      </div>
      {loading ? (
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>{Array(3).fill(0).map((_, i) => <Skeleton key={i} h={60} radius={8} />)}</div>
      ) : ndrs.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#9ca3af' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>✅</div>
          <div style={{ fontWeight: 600 }}>No delivery exceptions</div>
          <div style={{ fontSize: '.78rem', marginTop: 4 }}>All your shipments are on track</div>
        </div>
      ) : (
        <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {ndrs.map(s => (
            <div key={s.id} style={{ padding: '14px 16px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '.88rem', color: '#0b1f3a', fontFamily: 'monospace' }}>{s.awb}</div>
                  <div style={{ fontSize: '.75rem', color: '#6b7280', marginTop: 2 }}>{s.consignee} → {s.destination}</div>
                  {s.ndrEvents?.[0] && (
                    <div style={{ marginTop: 6, fontSize: '.75rem', color: '#92400e' }}>
                      ⚠️ {s.ndrEvents[0].reason}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <StatusBadge status={s.status} />
                  <div style={{ marginTop: 6 }}>
                    <a href={`https://wa.me/919911565523?text=${encodeURIComponent(`Hi! I have an NDR for AWB: ${s.awb}. Please help resolve.`)}`}
                      target="_blank" rel="noreferrer"
                      style={{ fontSize: '.72rem', color: '#15803d', fontWeight: 700, textDecoration: 'none' }}>
                      💬 Resolve on WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
