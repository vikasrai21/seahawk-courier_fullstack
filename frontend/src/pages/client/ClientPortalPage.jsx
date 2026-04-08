import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Area, AreaChart, ResponsiveContainer, CartesianGrid, Tooltip, XAxis, YAxis, LineChart, Line, Legend, ReferenceDot } from 'recharts';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { useDebounce } from '../../hooks/useDebounce';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

function getClientAssistantFollowups(message) {
  const text = String(message?.text || '').toLowerCase();
  const actionType = message?.action?.type || '';
  if (actionType === 'TRACK_AWB' || text.includes('track')) return ['Show my shipments', 'Raise support ticket', 'Create pickup'];
  if (actionType === 'PICKUP_CREATE' || text.includes('pickup')) return ['Show my pickups', 'Track AWB', 'Raise support ticket'];
  if (actionType === 'NDR_RESPOND' || actionType === 'NDR_LIST' || text.includes('ndr')) return ['Show my NDRs', 'Track AWB', 'Raise support ticket'];
  if (actionType === 'SUPPORT_TICKET' || actionType === 'SUPPORT_TICKET_LIST' || text.includes('ticket')) return ['Show my tickets', 'Track AWB', 'Show my shipments'];
  return ['Track AWB', 'Show my shipments', 'Create pickup'];
}

function getClientChipIcon(label) {
  const value = String(label || '').toLowerCase();
  if (value.includes('track')) return '◎';
  if (value.includes('shipment')) return '▣';
  if (value.includes('pickup')) return '↥';
  if (value.includes('ticket')) return '?';
  if (value.includes('ndr')) return '!';
  return '•';
}

function PortalAssistantAvatar({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="portalOrbBg" x1="10" y1="6" x2="54" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE68A" />
          <stop offset="0.45" stopColor="#FB7185" />
          <stop offset="1" stopColor="#A78BFA" />
        </linearGradient>
        <linearGradient id="portalFace" x1="19" y1="18" x2="45" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF9F4" />
          <stop offset="1" stopColor="#FFE8F1" />
        </linearGradient>
        <linearGradient id="portalVisor" x1="22" y1="24" x2="43" y2="35" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7C2D12" />
          <stop offset="1" stopColor="#9D174D" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill="url(#portalOrbBg)" />
      <circle cx="21" cy="16" r="10" fill="white" opacity="0.24" />
      <circle cx="32" cy="31" r="18.5" fill="url(#portalFace)" />
      <path d="M17 25C18.8 18.2 24.5 13 32 13C37.8 13 43.6 16.1 46.6 21.2C43.2 24.8 38.8 26.8 33 26.8C27.8 26.8 23 25.8 17 25Z" fill="#831843" />
      <path d="M20.5 27C24.8 29 28.7 29.8 33.2 29.8C37.7 29.8 41.6 28.8 45.2 26.5V38.2C45.2 45 39.6 50.5 32.7 50.5H31.5C24.7 50.5 19.2 45 19.2 38.2V29.4C19.2 28.6 19.7 27.7 20.5 27Z" fill="url(#portalFace)" />
      <rect x="23" y="27.4" width="18" height="8.8" rx="4.4" fill="url(#portalVisor)" />
      <circle className="portal-avatar-eye" cx="28.8" cy="31.8" r="1.8" fill="#FFF7ED" />
      <circle className="portal-avatar-eye" cx="35.2" cy="31.8" r="1.8" fill="#FFF7ED" />
      <path d="M27.5 40C29.5 42 34.3 42 36.8 39.7" stroke="#F43F5E" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="23.5" cy="36.3" r="2.4" fill="#FDA4AF" opacity="0.45" />
      <circle cx="40.8" cy="36.3" r="2.4" fill="#FDA4AF" opacity="0.45" />
      <circle cx="49.5" cy="18.5" r="5.2" fill="#34D399" />
      <path d="M49.5 14.7V22.3" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M45.7 18.5H53.3" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

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

const ACTION_GROUPS = [
  {
    key: 'operations',
    title: 'Operations',
    subtitle: 'Daily movement actions',
    actions: [
      { to: '/portal/bulk-track', icon: '🔍', title: 'Bulk AWB Tracking', description: 'Search many shipments together and spot stuck parcels in one pass.', tone: 'blue', featured: true },
      { to: '/portal/map', icon: '🗺️', title: 'Live Shipment Map', description: 'Watch active shipments move in real time across your service lanes.', tone: 'teal', featured: true },
      { to: '/portal/pickups', icon: '📦', title: 'Raise Pickup Request', description: 'Schedule a pickup quickly when your dispatch team needs same-day action.', tone: 'green' },
    ],
  },
  {
    key: 'issues',
    title: 'Issues',
    subtitle: 'Recovery and exception workflows',
    actions: [
      { to: '/portal/ndr', icon: '⚠️', title: 'NDR Self-Service', description: 'Resolve failed attempts, update remarks, and recover at-risk orders.', tone: 'rose' },
      { to: '/portal/rto-intelligence', icon: '📊', title: 'RTO Intelligence', description: 'Understand return patterns and spot the lanes driving cost leakage.', tone: 'orange' },
      { to: '/portal/pod', icon: '📸', title: 'Digital PODs', description: 'Access proof-of-delivery records without bouncing between screens.', tone: 'blue' },
    ],
  },
  {
    key: 'system',
    title: 'System',
    subtitle: 'Configuration and communication',
    actions: [
      { to: '/portal/import', icon: '📤', title: 'Order Import', description: 'Upload bulk orders and get them into the shipment pipeline faster.', tone: 'amber' },
      { to: '/portal/notifications', icon: '🔔', title: 'Notification Preferences', description: 'Tune alerts so teams only get the updates that matter.', tone: 'slate' },
      { to: '/portal/support', icon: '🎫', title: 'Support Tickets', description: 'Check open issues, ticket history, and response status in one place.', tone: 'slate' },
      { to: '/portal/branding', icon: '🌐', title: 'Branded Tracking', description: 'Manage the customer-facing tracking experience under your own brand.', tone: 'teal' },
    ],
  },
];

const WOW_FACTORS = [
  { label: 'Premium Tracking Experience', value: 'White-label + live events', accent: '#2563eb' },
  { label: 'Operational Reliability', value: 'Carrier-linked status sync', accent: '#0f766e' },
  { label: 'Client Confidence Layer', value: 'SLA, RTO and support visibility', accent: '#c2410c' },
];

export default function ClientPortalPage({ toast }) {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
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
  const [intel, setIntel] = useState(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantInput, setAssistantInput] = useState('');
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState([
    { role: 'assistant', text: 'Hi! I can help with shipments, AWB tracking, pickups, NDRs, and support tickets.' },
  ]);

  const assistantSuggestions = [
    'Show my latest shipments',
    'Track AWB 123456',
    'List NDRs that need action',
    'Create a pickup for tomorrow',
    'Raise a support ticket for delayed delivery',
  ];

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
      if (debouncedSearch) shipmentQ.set('search', debouncedSearch);
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

  const fetchIntelligence = async () => {
    try {
      const query = new URLSearchParams();
      query.set('range', range);
      query.set('limit', '12');
      if (range === 'custom' && dateFrom && dateTo) {
        query.set('date_from', dateFrom);
        query.set('date_to', dateTo);
      }
      const res = await api.get(`/portal/intelligence?${query.toString()}`);
      setIntel(res.data || null);
    } catch (e) {
      toast?.(e.message || 'Failed to load shipment intelligence', 'error');
    }
  };

  const sendAssistant = async (payload = {}) => {
    const messageText = payload.message || assistantInput.trim();
    if (!messageText && !payload.action) return;

    if (messageText) {
      setAssistantMessages((prev) => [...prev, { role: 'user', text: messageText }]);
    }
    setAssistantInput('');
    setAssistantBusy(true);
    try {
      const history = assistantMessages.slice(-6).map((m) => ({ role: m.role, text: m.text }));
      const res = await api.post('/portal/assistant', payload.action
        ? { ...payload, message: messageText, history }
        : { message: messageText, history }
      );
      const reply = res.data?.reply || 'Done.';
      setAssistantMessages((prev) => [...prev, { role: 'assistant', text: reply, action: res.data?.action }]);
    } catch (e) {
      toast?.(e.message || 'Assistant failed to respond', 'error');
    } finally {
      setAssistantBusy(false);
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
    fetchIntelligence();
  }, [range, dateFrom, dateTo, statusFilter, courierFilter, debouncedSearch]);

  useEffect(() => {
    fetchPerformance();
  }, [perfDays]);

  useEffect(() => {
    if (!socket) return undefined;

    const refresh = () => {
      fetchPortalData();
      fetchPerformance();
      fetchIntelligence();
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

  const movementInsights = useMemo(() => {
    if (!trendData.length) return { wowPct: 0, peak: null, thisWeek: 0, lastWeek: 0 };
    const values = trendData.map((t) => Number(t.shipments || 0));
    const peakVal = Math.max(...values);
    const peak = trendData.find((t) => Number(t.shipments || 0) === peakVal) || null;
    const thisWeek = values.slice(-7).reduce((a, b) => a + b, 0);
    const lastWeek = values.slice(-14, -7).reduce((a, b) => a + b, 0);
    const wowPct = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : (thisWeek > 0 ? 100 : 0);
    return { wowPct, peak, thisWeek, lastWeek };
  }, [trendData]);

  const performanceData = useMemo(() => {
    return (performance?.series || []).map((row) => ({
      ...row,
      day: String(row.date).slice(5),
    }));
  }, [performance]);

  const intelItems = intel?.items || [];
  const smartAlerts = useMemo(() => {
    const alerts = [];
    const inTransit = Number(stats?.totals?.inTransit || 0);
    const rto = Number(stats?.totals?.rto || 0);
    const ndr = Number(stats?.totals?.ndr || 0);
    if (inTransit >= 10) alerts.push({ tone: 'blue', text: `${inTransit} shipments are active in the network right now.` });
    if (rto > 0) alerts.push({ tone: 'red', text: `${rto} shipments are in RTO flow and need recovery attention.` });
    if (ndr > 0) alerts.push({ tone: 'orange', text: `${ndr} shipments need NDR action to prevent delivery failures.` });
    if (!alerts.length) alerts.push({ tone: 'green', text: 'No critical alerts right now. Operations look stable.' });
    return alerts.slice(0, 3);
  }, [stats]);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#f4f8ff 0%,#eef4fd 34%,#f8fbff 100%)', fontFamily: "'Sora','Manrope','Segoe UI',sans-serif", position: 'relative', overflowX: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: -120, right: -140, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle,rgba(56,189,248,0.17) 0%,rgba(56,189,248,0) 70%)' }} />
        <div style={{ position: 'absolute', top: 240, left: -160, width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle,rgba(251,146,60,0.16) 0%,rgba(251,146,60,0) 72%)' }} />
      </div>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          height: 70,
          background: 'rgba(255,255,255,0.8)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(219,230,244,0.7)',
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
          <Link
            to="/portal/notifications"
            style={{
              textDecoration: 'none',
              border: '1px solid #e2e8f0',
              background: '#fff',
              color: '#0f172a',
              borderRadius: 999,
              padding: '7px 12px',
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: '.04em',
              textTransform: 'uppercase',
            }}
            title="Open notification preferences"
          >
            Alert Settings
          </Link>
          <Link
            to="/portal/notifications"
            style={{ position: 'relative', cursor: 'pointer', transition: 'transform 0.2s' }}
            title="Notification preferences"
          >
            <span style={{ fontSize: 20 }}>🔔</span>
            <div style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, background: '#ef4444', borderRadius: '50%', border: '2px solid #fff' }} />
          </Link>
          <div style={{ width: 1, height: 24, background: '#e2e8f0' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{user?.name}</div>
              <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>Client Account</div>
            </div>
            <div 
              style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #f97316, #fb923c)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: 14, boxShadow: '0 4px 12px rgba(249,115,22,0.2)', cursor: 'pointer', transition: 'transform 0.2s' }}
              onClick={handleLogout}
              title="Click to Sign Out"
            >
              {user?.name?.[0]?.toUpperCase() || 'C'}
            </div>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1240, margin: '0 auto', padding: '28px 20px 40px', position: 'relative', zIndex: 1 }}>
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
              <div className="portal-hero-inner" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.15fr) minmax(240px,.95fr) 165px', gap: 20, alignItems: 'start' }}>
                <div>
                  <h1 style={{ margin: 0, color: '#f8fbff', fontSize: 32, lineHeight: 1.08, fontWeight: 900, letterSpacing: '-0.4px', maxWidth: 480 }}>
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
                      Sync with Couriers
                    </button>
                    <Link
                      to="/portal/shipments"
                      className="portal-btn-secondary"
                      style={{ textDecoration: 'none', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '11px 18px', background: 'rgba(255,255,255,0.08)', color: '#f8fafc', fontSize: 13, fontWeight: 700, transition: 'all 0.2s' }}
                    >
                      Create / Manage Shipments
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
                <div style={{ background: 'rgba(15,23,42,0.4)', borderRadius: 18, border: '1px solid rgba(148,197,253,0.1)', padding: 14, height: '100%', minHeight: 156 }}>
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
                    { label: 'RTO Risk', value: stats?.totals?.rto || 0, tone: '#f9a8d4' },
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

        <section style={{ marginBottom: 18 }}>
          <div style={{ borderRadius: 18, border: '1px solid #dbe6f4', background: 'linear-gradient(145deg,#ffffff 0%,#f9fbff 60%,#f7faff 100%)', boxShadow: '0 14px 34px -24px rgba(15,23,42,0.35)', padding: 14 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {WOW_FACTORS.map((item) => (
                <div key={item.label} className="wow-factor-card" style={{ flex: '1 1 280px', minWidth: 220, border: '1px solid #e5edf8', borderRadius: 14, padding: '12px 14px', background: '#fff', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '.11em', color: '#64748b' }}>{item.label}</div>
                  <div style={{ marginTop: 6, fontSize: 14, fontWeight: 900, color: '#0f172a' }}>{item.value}</div>
                  <div style={{ marginTop: 10, height: 4, borderRadius: 999, background: '#eef3fb' }}>
                    <div style={{ width: '78%', height: '100%', borderRadius: 999, background: `linear-gradient(90deg,${item.accent},#93c5fd)` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ marginBottom: 18 }}>
          <PortalPanel
            eyebrow="Smart Alerts"
            title="Actionable Signals"
            subtitle="Real-time alerts from your shipment pipeline."
          >
            <div style={{ display: 'grid', gap: 8 }}>
              {smartAlerts.map((alert, idx) => (
                <div key={idx} style={{ border: '1px solid #e5edf8', borderRadius: 12, padding: '10px 12px', background: '#f8fbff', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 999, background: alert.tone === 'red' ? '#ef4444' : alert.tone === 'orange' ? '#f97316' : alert.tone === 'green' ? '#16a34a' : '#2563eb' }} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>{alert.text}</div>
                </div>
              ))}
            </div>
          </PortalPanel>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12, marginBottom: 18 }}>
          <MetricCard icon="📦" label="Total Shipments" value={stats?.totals?.total || 0} hint="Volume" color="#2563eb" />
          <MetricCard icon="🧾" label="Booked" value={stats?.totals?.booked || 0} hint="Created" color="#475569" />
          <MetricCard icon="🚚" label="In Transit" value={stats?.totals?.inTransit || 0} hint="Moving" color="#f97316" />
          <MetricCard icon="🏁" label="Out For Delivery" value={stats?.totals?.outForDelivery || 0} hint="Near Delivery" color="#0ea5e9" />
          <MetricCard icon="✅" label="Delivered" value={stats?.totals?.delivered || 0} hint={`${stats?.totals?.deliveredPct || 0}% Success`} color="#0c7a52" />
          <MetricCard icon="⚠️" label="Returns/RTO" value={stats?.totals?.rto || 0} hint="At Risk" color="#ef4444" />
        </section>

        <section className="portal-top-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.08fr) minmax(0,.92fr)', gap: 16, marginBottom: 18 }}>
          <PortalPanel
            eyebrow="Shipment Pulse"
            title="Movement Trend"
            subtitle="See order volume over the selected period with highlights that explain performance shifts."
            action={(
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>{stats?.range?.from} to {stats?.range?.to}</div>
                <div style={{ marginTop: 4, fontSize: 10, fontWeight: 900, color: movementInsights.wowPct >= 0 ? '#0c7a52' : '#b42318' }}>
                  {movementInsights.wowPct >= 0 ? '+' : ''}{movementInsights.wowPct}% vs last week
                </div>
              </div>
            )}
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
            <div style={{ height: 280, position: 'relative' }}>
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
                    formatter={(value) => [`${value} Shipments`, 'Movement']}
                    labelFormatter={(value) => `Date: ${value}`}
                    contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 12px 28px rgba(15,23,42,0.15)', fontWeight: 700, padding: '12px 16px' }}
                    itemStyle={{ color: '#0f172a', fontWeight: 900 }}
                  />
                  <Area type="monotone" dataKey="shipments" stroke="#2563eb" strokeWidth={4} fill="url(#portalTrendFill)" animationDuration={1800} filter="url(#shadow)" />
                  {movementInsights.peak && (
                    <ReferenceDot
                      x={movementInsights.peak.day}
                      y={movementInsights.peak.shipments}
                      r={6}
                      fill="#ea580c"
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
              {movementInsights.peak && (
                <div style={{ position: 'absolute', top: 8, right: 10, borderRadius: 999, border: '1px solid #ffd8bd', background: '#fff3ec', color: '#c2410c', fontSize: 10, fontWeight: 900, padding: '5px 10px' }}>
                  Peak {movementInsights.peak.shipments} on {movementInsights.peak.day}
                </div>
              )}
              {!trendData.length && (
                <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                  <div style={{ textAlign: 'center', maxWidth: 320 }}>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>No movement data yet</div>
                    <Link to="/portal/import" style={{ display: 'inline-block', marginTop: 10, textDecoration: 'none', border: '1px solid #dbe6f4', borderRadius: 999, padding: '8px 12px', fontSize: 11, fontWeight: 800, color: '#0f172a', background: '#fff' }}>
                      Import first shipments
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </PortalPanel>

          <PortalPanel
            eyebrow="Quick Actions"
            title="Move Fast"
            subtitle="Actions are grouped by intent so teams know exactly where to click first."
          >
            <div style={{ display: 'grid', gap: 12 }}>
              {ACTION_GROUPS.map((group) => (
                <div key={group.key} style={{ border: '1px solid #e8eef8', borderRadius: 14, padding: 10, background: '#fbfdff' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '.08em' }}>{group.title}</div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>{group.subtitle}</div>
                  </div>
                  <div className="portal-action-group-row" style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                    {group.actions.map((action) => (
                      <div key={action.title} style={{ flex: '0 0 240px' }}>
                        <ActionTile {...action} />
                      </div>
                    ))}
                    {group.key === 'system' && (
                      <div style={{ flex: '0 0 240px' }}>
                        <ActionTile
                          icon="🎫"
                          title={ticketOpen ? 'Close Ticket Composer' : 'Raise Support Ticket'}
                          description="Open a quick issue form right here when a shipment needs immediate help."
                          tone="slate"
                          onClick={() => setTicketOpen((v) => !v)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
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

        <section style={{ background: 'linear-gradient(180deg,#ffffff 0%,#f8fbff 100%)', border: '1px solid #d9e8fb', borderRadius: 18, padding: 16, boxShadow: '0 14px 30px -18px rgba(37,99,235,0.3)', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10, flexWrap: 'wrap' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>Delivery Performance Dashboard</h3>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12 }}>Delivered vs RTO vs failed delivery behavior for your shipments.</p>
              <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, border: '1px solid #c7dbf3', background: '#eff6ff', color: '#1d4ed8', padding: '4px 10px', fontSize: 10.5, fontWeight: 900 }}>
                Client Health Score: {performance?.summary?.successRate || 0}%
              </div>
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

        <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,.8fr)', gap: 16, marginBottom: 18 }}>
          <PortalPanel
            eyebrow="Shipment Intelligence"
            title="Risk Radar"
            subtitle="Flags SLA breaches, stuck scans, and high RTO risk based on live tracking signals."
          >
            {intelItems.length === 0 ? (
              <div style={{ padding: 14, color: '#64748b', fontSize: 13 }}>No critical risks detected in the selected range.</div>
            ) : (
              <div style={{ display: 'grid', gap: 10 }}>
                {intelItems.map((item) => (
                  <div key={item.id} style={{ border: '1px solid #e5edf8', borderRadius: 14, padding: 12, background: '#f8fbff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                      <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#0f172a' }}>{item.awb}</div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#c2410c' }}>{item.rtoRiskScore}% RTO risk</div>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12, color: '#475569' }}>
                      {item.destination || 'Destination'} · {item.status} · {item.courier || 'Courier'}
                    </div>
                    <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {(item.flags || []).map((f) => (
                        <span key={f} style={{ fontSize: 10, fontWeight: 800, padding: '4px 8px', borderRadius: 999, background: '#fff1e6', color: '#c2410c', border: '1px solid #ffd8bd' }}>
                          {f.replace('_', ' ')}
                        </span>
                      ))}
                      <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 8px', borderRadius: 999, background: '#eef2ff', color: '#3730a3', border: '1px solid #c7d2fe' }}>
                        {item.idleHours}h since scan
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PortalPanel>

          <PortalPanel
            eyebrow="Summary"
            title="Risk Breakdown"
            subtitle="Quick view of exceptions that need attention."
            tone="accent"
          >
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 800, color: '#0f172a' }}>
                <span>Flagged</span>
                <span>{intel?.summary?.flagged || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 800, color: '#0f172a' }}>
                <span>SLA Breach</span>
                <span>{intel?.summary?.slaBreaches || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 800, color: '#0f172a' }}>
                <span>Stuck in Scan</span>
                <span>{intel?.summary?.stuckInScan || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 800, color: '#0f172a' }}>
                <span>High RTO Risk</span>
                <span>{intel?.summary?.highRtoRisk || 0}</span>
              </div>
            </div>
          </PortalPanel>
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
          ) : shipments.length === 0 ? (
            <div style={{ padding: 28, textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: 36 }}>📭</div>
              <div style={{ marginTop: 8, fontWeight: 800, color: '#334155' }}>No shipments yet in this view.</div>
              <div style={{ marginTop: 6, fontSize: 13 }}>Create your first shipment flow to activate tracking and analytics.</div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/portal/import" style={{ textDecoration: 'none', border: '1px solid #dbe6f4', borderRadius: 999, padding: '8px 12px', fontSize: 11, fontWeight: 900, color: '#0f172a', background: '#fff' }}>
                  Upload First Shipment Batch
                </Link>
                <Link to="/portal/pickups" style={{ textDecoration: 'none', border: '1px solid #f7c9aa', borderRadius: 999, padding: '8px 12px', fontSize: 11, fontWeight: 900, color: '#c2410c', background: '#fff3ec' }}>
                  Raise Pickup Request
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
                <thead>
                  <tr style={{ background: 'linear-gradient(180deg,#f8fbff 0%,#fdfefe 100%)' }}>
                    {['AWB', 'Date', 'Consignee', 'Destination', 'Courier', 'Weight', 'Status'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '12px 14px', borderBottom: '1px solid #e5edf8', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 800 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shipments.map((s, i) => (
                    <tr key={s.id} className="portal-row" style={{ background: i % 2 ? '#fcfdff' : '#fff', borderBottom: '1px solid #eef3fb', transition: 'background 180ms ease, transform 180ms ease' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>{s.awb}</td>
                      <td style={{ padding: '12px 14px', color: '#475569' }}>{s.date}</td>
                      <td style={{ padding: '12px 14px', color: '#334155' }}>{s.consignee || '—'}</td>
                      <td style={{ padding: '12px 14px', color: '#475569' }}>{s.destination || '—'}</td>
                      <td style={{ padding: '12px 14px', color: '#475569' }}>{s.courier || '—'}</td>
                      <td style={{ padding: '12px 14px', color: '#475569' }}>{s.weight ? `${s.weight} kg` : '—'}</td>
                      <td style={{ padding: '12px 14px' }}><StatusBadge status={s.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ padding: 14, borderTop: '1px solid #edf2fa', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Showing <strong style={{ color: '#334155' }}>{shipments.length}</strong> shipments
            </div>
            <Link to="/portal/shipments" style={{ textDecoration: 'none', color: '#e8580a', fontSize: 13, fontWeight: 800 }}>
              View all shipments →
            </Link>
          </div>
        </section>
      </main>

      <div style={{ position: 'fixed', right: 24, bottom: 24, zIndex: 50 }}>
        {!assistantOpen ? (
          <button
            type="button"
            onClick={() => setAssistantOpen(true)}
            className="portal-launcher"
            style={{
              borderRadius: 999,
              background: 'linear-gradient(145deg,#fff8eb 0%,#fff1f7 52%,#f3f0ff 100%)',
              color: '#0f172a',
              border: '1px solid rgba(255,255,255,0.9)',
              padding: '8px 12px 8px 8px',
              fontSize: 12,
              fontWeight: 800,
              boxShadow: '0 22px 42px -24px rgba(251,113,133,0.34), 0 14px 24px -22px rgba(168,85,247,0.28), inset 0 1px 0 rgba(255,255,255,0.92)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div className="portal-avatar-float" style={{ width: 38, height: 38, borderRadius: '50%', overflow: 'hidden', boxShadow: '0 6px 16px rgba(124,58,237,0.25)' }}>
              <PortalAssistantAvatar size={38} />
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
              <div style={{ fontSize: 12, fontWeight: 900 }}>Assistant</div>
              <div style={{ fontSize: 10, color: '#e11d48', fontWeight: 800 }}>Client Care Copilot</div>
            </div>
          </button>
        ) : (
          <div style={{
            width: 340,
            maxHeight: 520,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(255,248,251,0.96) 100%)',
            backdropFilter: 'blur(18px)',
            border: '1px solid rgba(255,255,255,0.82)',
            borderRadius: 18,
            boxShadow: '0 24px 56px -34px rgba(190,24,93,0.35)',
            display: 'grid',
            gridTemplateRows: 'auto 1fr auto',
            overflow: 'hidden',
          }}>
            <div style={{ padding: 12, borderBottom: '1px solid rgba(251,207,232,0.55)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg,#fff1f2 0%,#faf5ff 58%,#fff7ed 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="portal-avatar-float" style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', boxShadow: '0 6px 16px rgba(124,58,237,0.18)' }}>
                  <PortalAssistantAvatar size={34} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: '#0f172a' }}>Client Assistant</div>
                  <div style={{ fontSize: 10, color: '#e11d48', fontWeight: 800 }}>Portal Care Guide</div>
                </div>
              </div>
              <button type="button" onClick={() => setAssistantOpen(false)} style={{ border: 0, background: 'transparent', color: '#64748b', cursor: 'pointer' }}>Close</button>
            </div>
            <div style={{ padding: 12, overflowY: 'auto', display: 'grid', gap: 8 }}>
              {assistantMessages.map((m, idx) => (
                <div key={idx} style={{ justifySelf: m.role === 'user' ? 'end' : 'start', maxWidth: '92%' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    {m.role === 'assistant' && (
                      <div className="portal-avatar-float" style={{ width: 28, height: 28, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
                        <PortalAssistantAvatar size={28} />
                      </div>
                    )}
                    <div style={{
                      background: m.role === 'user' ? '#0f172a' : '#f8fbff',
                      color: m.role === 'user' ? '#fff' : '#0f172a',
                      border: m.role === 'user' ? '1px solid #0f172a' : '1px solid #e5edf8',
                      borderRadius: 12,
                      padding: '8px 10px',
                      fontSize: 12,
                      whiteSpace: 'pre-wrap',
                    }}>
                      {m.text}
                      {m.action?.confirmRequired && (
                        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => sendAssistant({ action: m.action, confirm: true })}
                            style={{ border: '1px solid #f7c9aa', background: '#fff3ec', borderRadius: 10, padding: '6px 8px', fontSize: 11, fontWeight: 800, color: '#c2410c', cursor: 'pointer' }}
                          >
                            Run Action
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  {m.role === 'assistant' && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6, marginLeft: 36 }}>
                      {getClientAssistantFollowups(m).map((label) => (
                        <button
                          className="portal-follow-chip"
                          key={`${idx}-${label}`}
                          type="button"
                          onClick={() => sendAssistant({ message: label })}
                          style={{
                            borderRadius: 999,
                            border: '1px solid rgba(251,113,133,0.16)',
                            background: 'linear-gradient(135deg,#fff8eb 0%, #fff1f2 48%, #faf5ff 100%)',
                            color: '#9f1239',
                            fontSize: 10.5,
                            fontWeight: 900,
                            padding: '6px 11px',
                            cursor: 'pointer',
                            boxShadow: '0 10px 20px -16px rgba(244,114,182,0.45), inset 0 1px 0 rgba(255,255,255,0.95)',
                            letterSpacing: '0.01em',
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                              minWidth: 16,
                              height: 16,
                              borderRadius: 999,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'rgba(251,113,133,0.1)',
                              color: '#e11d48',
                              fontSize: 9,
                              fontWeight: 900,
                              lineHeight: 1,
                            }}>{getClientChipIcon(label)}</span>
                            {label}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {assistantSuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => sendAssistant({ message: s })}
                    style={{
                      borderRadius: 999,
                      border: '1px solid #dbe6f4',
                      background: '#f8fbff',
                      color: '#0f172a',
                      fontSize: 11,
                      fontWeight: 800,
                      padding: '6px 10px',
                      cursor: 'pointer',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ padding: 10, borderTop: '1px solid #edf2fa', display: 'flex', gap: 8 }}>
              <input
                value={assistantInput}
                onChange={(e) => setAssistantInput(e.target.value)}
                placeholder="Ask about a shipment or request an action..."
                style={{ flex: 1, borderRadius: 10, border: '1px solid #dbe6f4', padding: '8px 10px', fontSize: 12 }}
                onKeyDown={(e) => { if (e.key === 'Enter') sendAssistant(); }}
              />
              <button
                type="button"
                onClick={() => sendAssistant()}
                disabled={assistantBusy}
                style={{ borderRadius: 10, border: '1px solid #0f172a', background: '#0f172a', color: '#fff', padding: '8px 10px', fontSize: 12, fontWeight: 800, cursor: assistantBusy ? 'not-allowed' : 'pointer' }}
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>

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
        .portal-launcher::before {
          content: '';
          position: absolute;
          inset: -8px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(251,113,133,0.18) 0%, rgba(251,113,133,0) 66%);
          animation: portalLauncherPulse 3.8s ease-out infinite;
        }
        .portal-launcher::after {
          content: '';
          position: absolute;
          inset: 10px;
          border-radius: 999px;
          background: radial-gradient(circle at 50% 0%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 58%);
          pointer-events: none;
        }
        .portal-follow-chip {
          transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease, filter 160ms ease;
        }
        .portal-follow-chip:hover {
          transform: translateY(-1px);
          filter: saturate(1.05);
          box-shadow: 0 12px 22px -16px rgba(244,114,182,0.32), inset 0 1px 0 rgba(255,255,255,0.98);
          border-color: rgba(251,113,133,0.28);
        }
        .portal-follow-chip:active {
          transform: translateY(0px) scale(0.98);
        }
        .portal-avatar-float { animation: portalAvatarFloat 4.2s ease-in-out infinite; transform-origin: center; }
        .portal-avatar-eye { animation: portalAvatarBlink 5.4s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }
        @keyframes portalAvatarFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-2px) rotate(1deg); }
        }
        @keyframes portalAvatarBlink {
          0%, 43%, 45%, 100% { transform: scaleY(1); }
          44% { transform: scaleY(0.12); }
        }
        @keyframes portalLauncherPulse {
          0% { transform: scale(0.92); opacity: 0.26; }
          72% { transform: scale(1.1); opacity: 0; }
          100% { transform: scale(1.1); opacity: 0; }
        }
        @keyframes panelFloat {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
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
        .wow-factor-card:hover {
          border-color: #c7dbf3 !important;
          box-shadow: 0 12px 22px -18px rgba(15,23,42,0.5);
          animation: panelFloat 1.8s ease-in-out infinite;
        }
        .portal-row:hover {
          background: #f5f9ff !important;
          transform: scale(1.001);
        }
        .portal-action-group-row::-webkit-scrollbar {
          height: 8px;
        }
        .portal-action-group-row::-webkit-scrollbar-thumb {
          background: #dbe6f4;
          border-radius: 999px;
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
          .portal-action-group-row > div {
            flex-basis: 210px !important;
          }
        }
        @media (max-width: 820px) {
          .portal-ticket-meta {
            grid-template-columns: 1fr !important;
          }
          .portal-action-group-row > div {
            flex-basis: 82vw !important;
          }
        }
      `}</style>
    </div>
  );
}
