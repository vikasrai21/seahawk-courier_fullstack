import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Area, AreaChart, ResponsiveContainer, CartesianGrid, Tooltip, XAxis, YAxis, LineChart, Line, Legend } from 'recharts';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { SkeletonTable } from '../../components/ui/Skeleton';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

function RangeChip({ active, label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: active ? '1px solid #f97316' : '1px solid #dbe6f4',
        background: active ? '#fff4ec' : '#fff',
        color: active ? '#e8580a' : '#334155',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        padding: '7px 12px',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function MetricCard({ icon, label, value, hint, color }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5edf8',
        borderRadius: 16,
        padding: 18,
        boxShadow: '0 8px 24px -12px rgba(11,31,58,0.2)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 800, color, background: `${color}1f`, borderRadius: 999, padding: '4px 10px' }}>
          {hint}
        </span>
      </div>
      <div style={{ fontSize: 30, lineHeight: 1, fontWeight: 900, color: '#0b1f3a' }}>{value}</div>
      <div style={{ marginTop: 8, color: '#5a6b80', fontSize: 13, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function PortalPanel({ title, eyebrow, subtitle, action, children, tone = 'light', style = {} }) {
  const backgrounds = {
    light: '#fff',
    dark: 'linear-gradient(145deg,#0f2748 0%,#102d57 60%,#173d70 100%)',
    accent: 'linear-gradient(180deg,#fffaf5 0%,#ffffff 100%)',
  };
  const borders = {
    light: '1px solid #e5edf8',
    dark: '1px solid rgba(147,197,253,0.2)',
    accent: '1px solid #fde2cc',
  };

  return (
    <section
      style={{
        background: backgrounds[tone] || backgrounds.light,
        border: borders[tone] || borders.light,
        borderRadius: 22,
        padding: 18,
        boxShadow: tone === 'dark'
          ? '0 22px 42px -28px rgba(15,39,72,0.9)'
          : '0 14px 34px -24px rgba(11,31,58,0.35)',
        ...style,
      }}
    >
      {(title || subtitle || action || eyebrow) && (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
          <div>
            {eyebrow && (
              <div style={{ marginBottom: 6, fontSize: 11, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: tone === 'dark' ? '#93c5fd' : '#f97316' }}>
                {eyebrow}
              </div>
            )}
            {title && <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: tone === 'dark' ? '#f8fbff' : '#0f172a' }}>{title}</h3>}
            {subtitle && <p style={{ margin: '6px 0 0', color: tone === 'dark' ? '#c9d9f2' : '#64748b', fontSize: 13, lineHeight: 1.55 }}>{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function ActionTile({ to, icon, title, description, tone = 'blue', featured = false, onClick }) {
  const palette = {
    blue: { bg: 'linear-gradient(180deg,#f7fbff 0%,#eef5ff 100%)', border: '#d7e6ff', iconBg: '#dbeafe', iconColor: '#1d4ed8', title: '#173b72' },
    orange: { bg: 'linear-gradient(180deg,#fff8f2 0%,#fff1e6 100%)', border: '#ffd8bd', iconBg: '#ffedd5', iconColor: '#c2410c', title: '#9a3412' },
    purple: { bg: 'linear-gradient(180deg,#fbf8ff 0%,#f4efff 100%)', border: '#e8dbff', iconBg: '#ede9fe', iconColor: '#7c3aed', title: '#5b21b6' },
    green: { bg: 'linear-gradient(180deg,#f4fdf7 0%,#ecfaf0 100%)', border: '#ccefd6', iconBg: '#dcfce7', iconColor: '#15803d', title: '#166534' },
    rose: { bg: 'linear-gradient(180deg,#fff6f6 0%,#fff0f0 100%)', border: '#ffd7d7', iconBg: '#ffe4e6', iconColor: '#be123c', title: '#9f1239' },
    slate: { bg: 'linear-gradient(180deg,#f8fafc 0%,#f1f5f9 100%)', border: '#dbe4ee', iconBg: '#e2e8f0', iconColor: '#475569', title: '#334155' },
    teal: { bg: 'linear-gradient(180deg,#f0fdff 0%,#e6fafb 100%)', border: '#bfe9ef', iconBg: '#ccfbf1', iconColor: '#0f766e', title: '#115e59' },
    amber: { bg: 'linear-gradient(180deg,#fffbea 0%,#fff5cf 100%)', border: '#ffe48c', iconBg: '#fef3c7', iconColor: '#b45309', title: '#92400e' },
  };
  const colors = palette[tone] || palette.blue;
  const cardStyle = {
    textDecoration: 'none',
    display: 'block',
    minHeight: featured ? 132 : 108,
    background: colors.bg,
    border: `1px solid ${colors.border}`,
    borderRadius: 18,
    padding: featured ? '16px 16px 14px' : '14px',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 18px 28px -24px rgba(15,23,42,0.45)',
    transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
  };

  const content = (
    <div style={cardStyle} className="portal-action-tile">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: featured ? 18 : 14 }}>
        <div style={{ width: featured ? 44 : 38, height: featured ? 44 : 38, borderRadius: 13, display: 'grid', placeItems: 'center', background: colors.iconBg, color: colors.iconColor, fontSize: featured ? 20 : 17, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)' }}>
          {icon}
        </div>
        <div style={{ fontSize: 18, color: colors.iconColor, fontWeight: 700, opacity: 0.7 }}>→</div>
      </div>
      <div style={{ fontSize: featured ? 16 : 14, fontWeight: 900, color: colors.title, marginBottom: 5 }}>{title}</div>
      <div style={{ fontSize: 11.5, lineHeight: 1.45, color: '#58677b', maxWidth: featured ? '90%' : '100%' }}>{description}</div>
      {featured && (
        <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, padding: '5px 9px', background: 'rgba(255,255,255,0.75)', border: `1px solid ${colors.border}`, fontSize: 10.5, fontWeight: 800, color: colors.title }}>
          Open workspace
        </div>
      )}
    </div>
  );

  if (to) return <Link to={to} style={{ textDecoration: 'none' }}>{content}</Link>;
  return (
    <button type="button" onClick={onClick} style={{ border: 0, padding: 0, background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
      {content}
    </button>
  );
}

const RANGE_OPTIONS = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: 'this_month', label: 'This month' },
  { key: 'custom', label: 'Custom' },
];

const ACTIONS = [
  { to: '/portal/bulk-track', icon: '🔍', title: 'Bulk AWB Tracking', description: 'Search many shipments together and spot stuck parcels in one pass.', tone: 'blue', featured: true },
  { to: '/portal/map', icon: '🗺️', title: 'Live Shipment Map', description: 'Watch active shipments move in real time across your service lanes.', tone: 'teal', featured: true },
  { to: '/portal/invoices', icon: '🧾', title: 'Download Invoices', description: 'Open GST invoices, exports, and receipt history for finance teams.', tone: 'orange' },
  { to: '/portal/wallet', icon: '💳', title: 'Wallet & Payments', description: 'Review balance, top-ups, and recharge receipts without leaving the portal.', tone: 'purple' },
  { to: '/portal/pickups', icon: '📦', title: 'Raise Pickup Request', description: 'Schedule a pickup quickly when your dispatch team needs same-day action.', tone: 'green' },
  { to: '/portal/ndr', icon: '⚠️', title: 'NDR Self-Service', description: 'Resolve failed attempts, update remarks, and recover at-risk orders.', tone: 'rose' },
  { to: '/portal/rates', icon: '💸', title: 'Rate Calculator', description: 'Quote shipments faster with courier and pricing comparisons.', tone: 'purple' },
  { to: '/portal/import', icon: '📤', title: 'Order Import', description: 'Upload bulk orders and get them into the shipment pipeline faster.', tone: 'amber' },
  { to: '/portal/pod', icon: '📸', title: 'Digital PODs', description: 'Access proof-of-delivery records without bouncing between screens.', tone: 'blue' },
  { to: '/portal/rto-intelligence', icon: '📊', title: 'RTO Intelligence', description: 'Understand return patterns and spot the lanes driving cost leakage.', tone: 'orange' },
  { to: '/portal/notifications', icon: '🔔', title: 'Notification Preferences', description: 'Tune alerts so teams only get the updates that matter.', tone: 'slate' },
  { to: '/portal/support', icon: '🎫', title: 'Support Tickets', description: 'Check open issues, ticket history, and response status in one place.', tone: 'slate' },
  { to: '/portal/branding', icon: '🌐', title: 'Branded Tracking', description: 'Manage the customer-facing tracking experience under your own brand.', tone: 'teal' },
];

export default function ClientPortalPage({ toast }) {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [courierFilter, setCourierFilter] = useState('');
  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketAwb, setTicketAwb] = useState('');
  const [ticketPriority, setTicketPriority] = useState('normal');
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [ticketSuccess, setTicketSuccess] = useState(null);
  const [ticketCopied, setTicketCopied] = useState(false);
  const [range, setRange] = useState('30d');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [performance, setPerformance] = useState(null);
  const [perfDays, setPerfDays] = useState(30);

  const fetchPortalData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      query.set('range', range);
      if (range === 'custom' && dateFrom && dateTo) {
        query.set('date_from', dateFrom);
        query.set('date_to', dateTo);
      }

      const statQ = query.toString();
      const shipmentQ = new URLSearchParams(query);
      shipmentQ.set('limit', '50');
      if (search) shipmentQ.set('search', search);
      if (statusFilter) shipmentQ.set('status', statusFilter);
      if (courierFilter) shipmentQ.set('courier', courierFilter);

      const [sRes, shRes] = await Promise.all([
        api.get(`/portal/stats?${statQ}`),
        api.get(`/portal/shipments?${shipmentQ.toString()}`),
      ]);

      setStats(sRes.data || {});
      setShipments(shRes.data?.shipments || []);
    } catch (e) {
      toast?.(e.message || 'Failed to load portal data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformance = async () => {
    try {
      const res = await api.get(`/portal/performance?days=${perfDays}`);
      setPerformance(res.data || null);
    } catch (e) {
      toast?.(e.message || 'Failed to load performance dashboard', 'error');
    }
  };

  const syncLiveStatuses = async () => {
    try {
      const payload = { range, limit: 30 };
      if (range === 'custom' && dateFrom && dateTo) {
        payload.date_from = dateFrom;
        payload.date_to = dateTo;
      }
      const res = await api.post('/portal/sync-tracking', payload);
      toast?.(res.message || 'Live status sync complete', 'success');
      await fetchPortalData();
    } catch (e) {
      toast?.(e.message || 'Live status sync failed', 'error');
    }
  };

  const submitSupportTicket = async () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      toast?.('Subject and message are required', 'error');
      return;
    }

    setSubmittingTicket(true);
    try {
      const res = await api.post('/portal/support-ticket', {
        subject: ticketSubject.trim(),
        message: ticketMessage.trim(),
        awb: ticketAwb.trim(),
        priority: ticketPriority,
      });
      const ticketNo = res.data?.ticketNo || 'TICKET';
      toast?.(res.message || `Ticket ${ticketNo} submitted`, 'success');
      setTicketSuccess({
        ticketNo,
        message: res.message || 'Support ticket submitted successfully',
      });
      setTicketOpen(false);
      setTicketSubject('');
      setTicketMessage('');
      setTicketAwb('');
      setTicketPriority('normal');
    } catch (e) {
      toast?.(e.message || 'Failed to submit support ticket', 'error');
    } finally {
      setSubmittingTicket(false);
    }
  };

  useEffect(() => {
    fetchPortalData();
  }, [range, dateFrom, dateTo, statusFilter, courierFilter]);

  useEffect(() => {
    fetchPerformance();
  }, [perfDays]);

  useEffect(() => {
    if (!socket) return undefined;

    const refresh = () => {
      fetchPortalData();
      fetchPerformance();
    };

    socket.on('shipment:created', refresh);
    socket.on('shipment:status-updated', refresh);

    return () => {
      socket.off('shipment:created', refresh);
      socket.off('shipment:status-updated', refresh);
    };
  }, [socket, range, dateFrom, dateTo, statusFilter, courierFilter, perfDays, search]);

  useEffect(() => {
    if (!ticketSuccess) return undefined;

    setTicketCopied(false);
    const closeTimer = setTimeout(() => setTicketSuccess(null), 5500);
    return () => clearTimeout(closeTimer);
  }, [ticketSuccess]);

  const copyTicketNumber = async () => {
    const no = ticketSuccess?.ticketNo;
    if (!no) return;

    try {
      await navigator.clipboard.writeText(no);
      setTicketCopied(true);
      toast?.('Ticket number copied', 'success');
    } catch {
      toast?.('Unable to copy ticket number', 'error');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const filteredShipments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return shipments;
    return shipments.filter((s) => (
      s.awb?.toLowerCase().includes(q)
      || s.consignee?.toLowerCase().includes(q)
      || s.destination?.toLowerCase().includes(q)
      || s.courier?.toLowerCase().includes(q)
    ));
  }, [search, shipments]);

  const courierOptions = useMemo(() => {
    const set = new Set(shipments.map((s) => s.courier).filter(Boolean));
    return Array.from(set).sort();
  }, [shipments]);

  const trendData = useMemo(() => {
    return (stats?.trend || []).map((t) => ({
      ...t,
      day: String(t.date).slice(5),
    }));
  }, [stats]);

  const performanceData = useMemo(() => {
    return (performance?.series || []).map((row) => ({
      ...row,
      day: String(row.date).slice(5),
    }));
  }, [performance]);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#f7faff 0%,#eef4fd 100%)', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          height: 70,
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(219,230,244,0.6)',
          boxShadow: '0 4px 24px -12px rgba(15,23,42,0.08)',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <img src="/images/logo.png" alt="Sea Hawk" style={{ height: 38, borderRadius: 10, border: '1px solid rgba(219,230,244,0.8)', padding: 2, background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }} />
          <div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.3px' }}>Sea Hawk Courier</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 0 2px rgba(34,197,94,0.2)', animation: 'pulseLive 2s infinite' }} />
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Live Sync</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ position: 'relative', cursor: 'pointer', transition: 'transform 0.2s', className: 'hover:scale-110' }}>
            <span style={{ fontSize: 20 }}>🔔</span>
            <div style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: '#ef4444', borderRadius: '50%', border: '2px solid #fff' }} />
          </div>
          <div style={{ width: 1, height: 24, background: '#e2e8f0' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{user?.name}</div>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>Client Account</div>
            </div>
            <div 
              style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #f97316, #fb923c)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: 14, boxShadow: '0 4px 12px rgba(249,115,22,0.2)', cursor: 'pointer', transition: 'transform 0.2s', className: 'hover:scale-105 active:scale-95' }}
              onClick={handleLogout}
              title="Click to Sign Out"
            >
              {user?.name?.[0]?.toUpperCase() || 'C'}
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1240, margin: '0 auto', padding: '28px 20px 40px' }}>
        <section className="portal-hero-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.35fr) minmax(280px,.75fr)', gap: 16, marginBottom: 18 }}>
          <PortalPanel
            tone="dark"
            style={{ position: 'relative', overflow: 'hidden' }}
          >
            <div style={{ position: 'absolute', inset: 'auto -60px -80px auto', width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle,rgba(56,189,248,0.22) 0%,rgba(56,189,248,0) 72%)' }} />
            <div style={{ position: 'absolute', inset: '-60px auto auto -30px', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(251,146,60,0.16) 0%,rgba(251,146,60,0) 72%)' }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, padding: '7px 12px', background: 'rgba(148,197,253,0.14)', border: '1px solid rgba(148,197,253,0.24)', color: '#dbeafe', fontSize: 11, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 16 }}>
                Live Client Command Center
              </div>
              <div className="portal-hero-inner" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(260px,1fr) 170px', gap: 24, alignItems: 'start' }}>
                <div>
                  <h1 style={{ margin: 0, color: '#f8fbff', fontSize: 36, lineHeight: 1.05, fontWeight: 900, letterSpacing: '-0.5px', maxWidth: 480 }}>
                    Command Center
                  </h1>
                  <p style={{ margin: '14px 0 0', color: '#c9d9f2', fontSize: 14, lineHeight: 1.6, maxWidth: 460 }}>
                    Your live dashboard for intelligent shipping. Spot delivery friction early, track real-time drops, and optimize cash flow in one unified workspace.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 24 }}>
                    <button
                      onClick={syncLiveStatuses}
                      className="portal-btn-primary"
                      style={{ border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, padding: '11px 18px', background: 'linear-gradient(180deg,#fb923c 0%,#ea580c 100%)', color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 20px -8px rgba(234,88,12,0.8)', transition: 'all 0.2s' }}
                    >
                      Sync Live Now
                    </button>
                    <Link
                      to="/portal/shipments"
                      className="portal-btn-secondary"
                      style={{ textDecoration: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '11px 18px', background: 'rgba(255,255,255,0.08)', color: '#f8fafc', fontSize: 13, fontWeight: 700, transition: 'all 0.2s' }}
                    >
                      Open Shipment Desk
                    </Link>
                    <button
                      onClick={fetchPortalData}
                      className="portal-btn-ghost"
                      style={{ border: 0, borderRadius: 12, padding: '11px 16px', background: 'transparent', color: '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s' }}
                    >
                      Refresh
                    </button>
                  </div>
                </div>

                {/* Activity Feed in Middle! */}
                <div style={{ background: 'rgba(15,23,42,0.4)', borderRadius: 18, border: '1px solid rgba(148,197,253,0.1)', padding: 16, height: '100%', minHeight: 180 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Activity</div>
                    <div style={{ fontSize: 10, color: '#475569', fontWeight: 600 }}>Last 24h</div>
                  </div>
                  <div style={{ display: 'grid', gap: 14 }}>
                    {(stats?.recentActivity?.length > 0 ? stats.recentActivity : [
                      { id: 1, type: 'delivered', icon: '✅', title: 'Shipment Delivered', desc: 'AWB #SHK-99281 reached DEL', time: '2m ago', color: '#4ade80' },
                      { id: 2, type: 'issue', icon: '⚠️', title: 'NDR Raised', desc: 'Consignee rejected delivery', time: '14m ago', color: '#fb923c' },
                      { id: 3, type: 'pickup', icon: '📦', title: 'Pickup Scheduled', desc: '35 parcels pending scan', time: '1h ago', color: '#60a5fa' }
                    ]).slice(0, 3).map((act, i) => (
                      <div key={act.id || i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.05)', display: 'grid', placeItems: 'center', fontSize: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
                          {act.icon || '📌'}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9' }}>{act.title}</div>
                          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{act.desc}</div>
                        </div>
                        <div style={{ marginLeft: 'auto', fontSize: 10, color: act.color || '#64748b', fontWeight: 600 }}>{act.time}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 10 }}>
                  {[
                    { label: 'Active Shipments', value: stats?.totals?.inTransit || 0, tone: '#38bdf8' },
                    { label: 'Delivered Success', value: `${stats?.totals?.deliveredPct || 0}%`, tone: '#4ade80' },
                    { label: 'Wallet Ready', value: fmt(stats?.wallet), tone: '#f9a8d4' },
                  ].map((item) => (
                    <div key={item.label} style={{ borderRadius: 16, padding: '12px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(201,217,242,0.14)' }}>
                      <div style={{ fontSize: 10, color: '#a9bddc', fontWeight: 700, marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#f8fbff' }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </PortalPanel>

          <PortalPanel
            eyebrow="Focus Window"
            title="Date Context"
            subtitle="Changes here instantly slice all charts and data below."
            style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
          >
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {RANGE_OPTIONS.map((r) => (
                <RangeChip key={r.key} label={r.label} active={range === r.key} onClick={() => setRange(r.key)} />
              ))}
            </div>
            {range === 'custom' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <input className="tw-input" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ border: '1px solid #dbe6f4', borderRadius: 10, padding: '9px 12px', fontSize: 12, background: '#f8fafc', fontWeight: 600 }} />
                <input className="tw-input" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ border: '1px solid #dbe6f4', borderRadius: 10, padding: '9px 12px', fontSize: 12, background: '#f8fafc', fontWeight: 600 }} />
              </div>
            )}
            <div style={{ borderRadius: 16, padding: 18, background: '#f8fafc', border: '1px solid #e2e8f0', flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#64748b', marginBottom: 6 }}>Currently Viewing</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>{stats?.range?.from || '—'} to {stats?.range?.to || '—'}</div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#f97316', textTransform: 'uppercase' }}>Insight</div>
                  <div style={{ marginTop: 4, fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Delivery stable</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase' }}>Coverage</div>
                  <div style={{ marginTop: 4, fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{courierOptions.length || 0} Network lanes</div>
                </div>
              </div>
            </div>
          </PortalPanel>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12, marginBottom: 18 }}>
          <MetricCard icon="📦" label="Total Shipments" value={stats?.totals?.total || 0} hint="Volume" color="#2563eb" />
          <MetricCard icon="🧾" label="Booked" value={stats?.totals?.booked || 0} hint="Created" color="#475569" />
          <MetricCard icon="🚚" label="In Transit" value={stats?.totals?.inTransit || 0} hint="Moving" color="#f97316" />
          <MetricCard icon="🏁" label="Out For Delivery" value={stats?.totals?.outForDelivery || 0} hint="Near Delivery" color="#0ea5e9" />
          <MetricCard icon="✅" label="Delivered" value={stats?.totals?.delivered || 0} hint={`${stats?.totals?.deliveredPct || 0}% Success`} color="#0c7a52" />
          <MetricCard icon="💰" label="Wallet Balance" value={fmt(stats?.wallet)} hint="Live" color="#9333ea" />
        </section>

        <section className="portal-top-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.08fr) minmax(0,.92fr)', gap: 16, marginBottom: 18 }}>
          <PortalPanel
            eyebrow="Shipment Pulse"
            title="Movement Trend"
            subtitle="See order volume over the selected period with a smoother growth-style view."
            action={<span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>{stats?.range?.from} to {stats?.range?.to}</span>}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 10, marginBottom: 14 }}>
              {[
                { label: 'Total', value: stats?.totals?.total || 0, color: '#1d4ed8' },
                { label: 'Delivered', value: stats?.totals?.delivered || 0, color: '#16a34a' },
                { label: 'Attention Needed', value: (stats?.totals?.ndr || 0) + (stats?.totals?.rto || 0), color: '#ea580c' },
              ].map((item) => (
                <div key={item.label} style={{ borderRadius: 16, padding: 14, background: '#f8fbff', border: '1px solid #e5edf8' }}>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>{item.label}</div>
                  <div style={{ marginTop: 6, fontSize: 22, fontWeight: 900, color: '#0f172a' }}>{item.value}</div>
                  <div style={{ marginTop: 10, height: 4, borderRadius: 999, background: '#e6eef8', overflow: 'hidden' }}>
                    <div style={{ width: '72%', height: '100%', background: item.color, borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ height: 260, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%" minWidth={250}>
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="portalTrendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                    <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                      <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#3b82f6" floodOpacity="0.25"/>
                    </filter>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} dy={10} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} dx={-10} />
                  <Tooltip 
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 12px 28px rgba(15,23,42,0.15)', fontWeight: 700, padding: '12px 16px' }} 
                    itemStyle={{ color: '#0f172a', fontWeight: 900 }}
                  />
                  <Area type="monotone" dataKey="shipments" stroke="#2563eb" strokeWidth={4} fill="url(#portalTrendFill)" animationDuration={1800} filter="url(#shadow)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </PortalPanel>

          <PortalPanel
            eyebrow="Quick Actions"
            title="Move Fast"
            subtitle="The most-used client tools now live in a single action deck with clearer hierarchy."
          >
            <div className="portal-actions-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }}>
              {ACTIONS.map((action) => (
                <ActionTile key={action.title} {...action} />
              ))}
              <ActionTile
                icon="🎫"
                title={ticketOpen ? 'Close Ticket Composer' : 'Raise Support Ticket'}
                description="Open a quick issue form right here when a shipment needs immediate help."
                tone="slate"
                onClick={() => setTicketOpen((v) => !v)}
              />
            </div>
            {ticketOpen && (
              <div style={{ marginTop: 14, border: '1px solid #e2eaf5', borderRadius: 18, padding: 14, background: 'linear-gradient(180deg,#fcfdff 0%,#f8fbff 100%)' }}>
                <div style={{ display: 'grid', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: '#f97316', marginBottom: 6 }}>Support Desk</div>
                    <div style={{ fontSize: 17, fontWeight: 900, color: '#0f172a' }}>Create a ticket without leaving the dashboard</div>
                  </div>
                  <input className="tw-input" value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)} placeholder="Subject (e.g. Shipment delayed)" style={{ border: '1px solid #dbe6f4', borderRadius: 12, padding: '10px 12px', fontSize: 12, color: '#334155', background: '#fff' }} />
                  <div className="portal-ticket-meta" style={{ display: 'grid', gridTemplateColumns: '1fr 150px', gap: 8 }}>
                    <input className="tw-input" value={ticketAwb} onChange={(e) => setTicketAwb(e.target.value)} placeholder="AWB (optional)" style={{ border: '1px solid #dbe6f4', borderRadius: 12, padding: '10px 12px', fontSize: 12, color: '#334155', background: '#fff' }} />
                    <select className="tw-select" value={ticketPriority} onChange={(e) => setTicketPriority(e.target.value)} style={{ border: '1px solid #dbe6f4', borderRadius: 12, padding: '10px 12px', fontSize: 12, color: '#334155', background: '#fff' }}>
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <textarea className="tw-input" value={ticketMessage} onChange={(e) => setTicketMessage(e.target.value)} placeholder="Describe the issue..." rows={4} style={{ border: '1px solid #dbe6f4', borderRadius: 12, padding: '10px 12px', fontSize: 12, resize: 'vertical', color: '#334155', background: '#fff' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Use this for delays, delivery issues, POD mismatches, or account questions.</div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button type="button" onClick={() => setTicketOpen(false)} style={{ border: '1px solid #dbe6f4', background: '#fff', borderRadius: 12, padding: '9px 12px', fontSize: 12, fontWeight: 700, color: '#475569', cursor: 'pointer' }}>Cancel</button>
                      <button type="button" onClick={submitSupportTicket} disabled={submittingTicket} style={{ border: '1px solid #f7c9aa', background: submittingTicket ? '#fff7f2' : '#fff3ec', borderRadius: 12, padding: '9px 12px', fontSize: 12, fontWeight: 800, color: '#c2410c', cursor: submittingTicket ? 'not-allowed' : 'pointer', opacity: submittingTicket ? 0.75 : 1 }}>
                        {submittingTicket ? 'Submitting...' : 'Submit Ticket'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </PortalPanel>
        </section>

        <section style={{ background: '#fff', border: '1px solid #e5edf8', borderRadius: 18, padding: 16, boxShadow: '0 8px 24px -14px rgba(11,31,58,0.2)', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>Delivery Performance Dashboard</h3>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12 }}>Delivered vs RTO vs failed delivery behavior for your shipments.</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[30, 60, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setPerfDays(d)}
                  style={{
                    border: perfDays === d ? '1px solid #f97316' : '1px solid #dbe6f4',
                    background: perfDays === d ? '#fff4ec' : '#fff',
                    color: perfDays === d ? '#c2410c' : '#334155',
                    borderRadius: 999,
                    padding: '7px 12px',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {d} Days
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12, marginBottom: 14 }}>
            <MetricCard icon="✅" label="Delivered" value={performance?.summary?.delivered || 0} hint="Success" color="#0c7a52" />
            <MetricCard icon="↩️" label="RTO" value={performance?.summary?.rto || 0} hint="Returns" color="#b42318" />
            <MetricCard icon="⚠️" label="Failed / NDR" value={performance?.summary?.failed || 0} hint="Attention" color="#c2410c" />
            <MetricCard icon="📈" label="Success Rate" value={`${performance?.summary?.successRate || 0}%`} hint={`${performance?.days || 30} Days`} color="#2563eb" />
          </div>

          <div style={{ height: 260, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%" minWidth={250}>
              <LineChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} dy={10} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} dx={-10} />
                <Tooltip 
                  contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 12px 28px rgba(15,23,42,0.15)', fontWeight: 700, padding: '12px 16px' }} 
                  itemStyle={{ color: '#0f172a', fontWeight: 900 }}
                />
                <Legend wrapperStyle={{ paddingTop: 20, fontSize: 12, fontWeight: 700 }} />
                <Line type="monotone" dataKey="delivered" stroke="#16a34a" strokeWidth={3} dot={false} activeDot={{ r: 6 }} name="Delivered" animationDuration={1800} />
                <Line type="monotone" dataKey="rto" stroke="#dc2626" strokeWidth={3} dot={false} activeDot={{ r: 6 }} name="RTO" animationDuration={1800} />
                <Line type="monotone" dataKey="failed" stroke="#ea580c" strokeWidth={3} dot={false} activeDot={{ r: 6 }} name="Failed / NDR" animationDuration={1800} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section style={{ background: '#fff', border: '1px solid #e5edf8', borderRadius: 18, overflow: 'hidden', boxShadow: '0 8px 24px -14px rgba(11,31,58,0.2)' }}>
          <div style={{ padding: 16, borderBottom: '1px solid #edf2fa', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>Shipments</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input
                className="tw-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search AWB, consignee, destination..."
                style={{ border: '1px solid #dbe6f4', borderRadius: 10, fontSize: 12, padding: '8px 10px', minWidth: 230, color: '#334155', background: '#fff' }}
              />
              <select className="tw-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ border: '1px solid #dbe6f4', borderRadius: 10, fontSize: 12, padding: '8px 10px', color: '#334155', background: '#fff' }}>
                <option value="">All Status</option>
                <option value="Booked">Booked</option>
                <option value="InTransit">In Transit</option>
                <option value="OutForDelivery">Out For Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Delayed">Delayed</option>
                <option value="NDR">NDR</option>
                <option value="RTO">RTO</option>
              </select>
              <select className="tw-select" value={courierFilter} onChange={(e) => setCourierFilter(e.target.value)} style={{ border: '1px solid #dbe6f4', borderRadius: 10, fontSize: 12, padding: '8px 10px', color: '#334155', background: '#fff' }}>
                <option value="">All Couriers</option>
                {courierOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: 20 }}>
              <SkeletonTable columns={8} rows={5} />
            </div>
          ) : filteredShipments.length === 0 ? (
            <div style={{ padding: 28, textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: 36 }}>📭</div>
              <div style={{ marginTop: 8, fontWeight: 700 }}>No shipments found in this range.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(180deg,#f8fbff 0%,#fdfefe 100%)' }}>
                    {['AWB', 'Date', 'Consignee', 'Destination', 'Courier', 'Weight', 'Amount', 'Status'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px 14px', borderBottom: '1px solid #e5edf8', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 800 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredShipments.map((s, i) => (
                    <tr key={s.id} style={{ background: i % 2 ? '#fcfdff' : '#fff', borderBottom: '1px solid #eef3fb', transition: 'background 180ms ease' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>{s.awb}</td>
                      <td style={{ padding: '12px 14px', color: '#475569' }}>{s.date}</td>
                      <td style={{ padding: '12px 14px', color: '#334155' }}>{s.consignee || '—'}</td>
                      <td style={{ padding: '12px 14px', color: '#475569' }}>{s.destination || '—'}</td>
                      <td style={{ padding: '12px 14px', color: '#475569' }}>{s.courier || '—'}</td>
                      <td style={{ padding: '12px 14px', color: '#475569' }}>{s.weight ? `${s.weight} kg` : '—'}</td>
                      <td style={{ padding: '12px 14px', color: '#334155', fontWeight: 700 }}>{fmt(s.amount || 0)}</td>
                      <td style={{ padding: '12px 14px' }}><StatusBadge status={s.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ padding: 14, borderTop: '1px solid #edf2fa', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Showing <strong style={{ color: '#334155' }}>{filteredShipments.length}</strong> shipments
            </div>
            <Link to="/portal/shipments" style={{ textDecoration: 'none', color: '#e8580a', fontSize: 13, fontWeight: 800 }}>
              View all shipments →
            </Link>
          </div>
        </section>
      </main>

      <Modal
        open={Boolean(ticketSuccess)}
        onClose={() => setTicketSuccess(null)}
        title="Ticket Submitted"
        size="sm"
        footer={(
          <>
            <button onClick={copyTicketNumber} className="btn-secondary">
              {ticketCopied ? 'Copied' : 'Copy Ticket Number'}
            </button>
            <button onClick={() => setTicketSuccess(null)} className="btn-primary">Done</button>
          </>
        )}
      >
        <div style={{ display: 'grid', gap: 10, animation: 'ticketPopupIn 220ms ease-out' }}>
          <div style={{ width: 42, height: 42, borderRadius: 999, display: 'grid', placeItems: 'center', background: '#ecfdf3', border: '1px solid #b8efd0', color: '#0c7a52', fontSize: 20, animation: 'ticketPulse 900ms ease-out' }}>
            ✓
          </div>
          <p style={{ margin: 0, color: '#334155', fontSize: 14 }}>{ticketSuccess?.message}</p>
          <div style={{ background: '#f8fbff', border: '1px solid #dbe6f4', borderRadius: 10, padding: '8px 10px' }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>Ticket Number</div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', fontFamily: 'monospace' }}>{ticketSuccess?.ticketNo}</div>
          </div>
          <p style={{ margin: 0, color: '#64748b', fontSize: 12 }}>
            Our team has received your request and will reach out shortly.
          </p>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: 11 }}>
            This popup closes automatically in a few seconds.
          </p>
        </div>
      </Modal>

      <style>{`
        @keyframes ticketPopupIn {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ticketPulse {
          0% { transform: scale(0.9); }
          65% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        @keyframes pulseLive {
          0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
          70% { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
          100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
        }
        .portal-action-tile:hover {
          transform: translateY(-2px);
          box-shadow: 0 22px 36px -24px rgba(15,23,42,0.48);
        }
        .portal-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 10px 24px -10px rgba(234,88,12,0.95) !important; filter: brightness(1.05); }
        .portal-btn-secondary:hover { background: rgba(255,255,255,0.15) !important; }
        .portal-btn-ghost:hover { color: #f8fafc !important; background: rgba(255,255,255,0.06) !important; }
        @media (max-width: 1080px) {
          .portal-hero-grid,
          .portal-top-grid,
          .portal-hero-inner {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 1024px) {
          .portal-actions-grid {
            grid-template-columns: repeat(2,minmax(0,1fr)) !important;
          }
        }
        @media (max-width: 820px) {
          .portal-actions-grid,
          .portal-ticket-meta {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
