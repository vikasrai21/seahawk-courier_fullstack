import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, ResponsiveContainer, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';

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

const RANGE_OPTIONS = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: 'this_month', label: 'This month' },
  { key: 'custom', label: 'Custom' },
];

export default function ClientPortalPage({ toast }) {
  const { user, logout } = useAuth();
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

  const trendData = useMemo(() => (
    (stats?.trend || []).map((t) => ({
      ...t,
      day: String(t.date).slice(5),
    }))
  ), [stats]);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#f7faff 0%,#eef4fd 100%)', fontFamily: "'DM Sans',-apple-system,sans-serif" }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          height: 66,
          background: 'rgba(255,255,255,.9)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #dbe6f4',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/images/logo.png" alt="Sea Hawk" style={{ height: 36, borderRadius: 8, border: '1px solid #dbe6f4', padding: 2, background: '#fff' }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#0b1f3a' }}>Sea Hawk Courier</div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#e8580a', textTransform: 'uppercase' }}>Client Portal</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>{user?.name}</div>
            <div style={{ fontSize: 10, color: '#64748b' }}>Client Account</div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              border: '1px solid #dbe6f4',
              borderRadius: 10,
              background: '#fff',
              color: '#475569',
              fontWeight: 700,
              fontSize: 12,
              padding: '8px 13px',
              cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '24px 20px 36px' }}>
        <section style={{ marginBottom: 18 }}>
          <h1 style={{ margin: 0, color: '#0b1f3a', fontSize: 30, lineHeight: 1.1, fontWeight: 900 }}>
            Shipment Intelligence Dashboard
          </h1>
          <p style={{ margin: '8px 0 0', color: '#5a6b80', fontSize: 14 }}>
            Track weekly performance, delivery success, and active shipments in one place.
          </p>
        </section>

        <section style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {RANGE_OPTIONS.map((r) => (
              <RangeChip key={r.key} label={r.label} active={range === r.key} onClick={() => setRange(r.key)} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {range === 'custom' && (
              <>
                <input className="tw-input" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ border: '1px solid #dbe6f4', borderRadius: 10, padding: '7px 10px', fontSize: 12 }} />
                <input className="tw-input" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ border: '1px solid #dbe6f4', borderRadius: 10, padding: '7px 10px', fontSize: 12 }} />
              </>
            )}
            <button
              onClick={fetchPortalData}
              style={{ border: '1px solid #cddcf0', borderRadius: 10, padding: '8px 12px', background: '#fff', fontSize: 12, fontWeight: 700, color: '#334155', cursor: 'pointer' }}
            >
              Refresh
            </button>
            <button
              onClick={syncLiveStatuses}
              style={{ border: '1px solid #f7c9aa', borderRadius: 10, padding: '8px 12px', background: '#fff3ec', fontSize: 12, fontWeight: 800, color: '#c2410c', cursor: 'pointer' }}
            >
              Sync Live Statuses
            </button>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12, marginBottom: 18 }}>
          <MetricCard icon="📦" label="Total Shipments" value={stats?.totals?.total || 0} hint="Volume" color="#2563eb" />
          <MetricCard icon="🧾" label="Booked" value={stats?.totals?.booked || 0} hint="Created" color="#475569" />
          <MetricCard icon="🚚" label="In Transit" value={stats?.totals?.inTransit || 0} hint="Moving" color="#f97316" />
          <MetricCard icon="🏁" label="Out For Delivery" value={stats?.totals?.outForDelivery || 0} hint="Near Delivery" color="#0ea5e9" />
          <MetricCard icon="✅" label="Delivered" value={stats?.totals?.delivered || 0} hint={`${stats?.totals?.deliveredPct || 0}% Success`} color="#0c7a52" />
          <MetricCard icon="💰" label="Wallet Balance" value={fmt(stats?.wallet)} hint="Live" color="#9333ea" />
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr', gap: 14, marginBottom: 18 }}>
          <div style={{ background: '#fff', border: '1px solid #e5edf8', borderRadius: 18, padding: 16, boxShadow: '0 8px 24px -14px rgba(11,31,58,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>Shipment Trend</h3>
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>{stats?.range?.from} to {stats?.range?.to}</span>
            </div>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf2fa" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip />
                  <Bar dataKey="shipments" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e5edf8', borderRadius: 18, padding: 16, boxShadow: '0 8px 24px -14px rgba(11,31,58,0.2)' }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#0f172a' }}>Quick Actions</h3>
            <p style={{ margin: '6px 0 14px', fontSize: 12, color: '#64748b' }}>Move fast with one-click tools.</p>
            <div style={{ display: 'grid', gap: 8 }}>
              <Link to="/track" target="_blank" style={{ textDecoration: 'none', background: '#f8fbff', border: '1px solid #dce9fa', borderRadius: 12, padding: '10px 12px', fontWeight: 700, color: '#1e3a8a', fontSize: 13 }}>🔍 Track Any AWB</Link>
              <Link to="/portal/invoices" style={{ textDecoration: 'none', background: '#fff8f2', border: '1px solid #ffe1cb', borderRadius: 12, padding: '10px 12px', fontWeight: 700, color: '#c2410c', fontSize: 13 }}>🧾 Download Invoices</Link>
              <Link to="/portal/wallet" style={{ textDecoration: 'none', background: '#f9f5ff', border: '1px solid #e8ddff', borderRadius: 12, padding: '10px 12px', fontWeight: 700, color: '#6d28d9', fontSize: 13 }}>💳 Wallet & Payments</Link>
              <button type="button" onClick={() => setTicketOpen(v => !v)} style={{ textAlign: 'left', border: '1px solid #dbe6f4', background: '#fff', borderRadius: 12, padding: '10px 12px', fontWeight: 700, color: '#334155', fontSize: 13, cursor: 'pointer' }}>🎫 Raise Support Ticket</button>
            </div>
            {ticketOpen && (
              <div style={{ marginTop: 10, border: '1px solid #e2eaf5', borderRadius: 12, padding: 10, background: '#fcfdff' }}>
                <div style={{ display: 'grid', gap: 8 }}>
                  <input className="tw-input" value={ticketSubject} onChange={(e) => setTicketSubject(e.target.value)} placeholder="Subject (e.g. Shipment delayed)" style={{ border: '1px solid #dbe6f4', borderRadius: 10, padding: '8px 10px', fontSize: 12, color: '#334155', background: '#fff' }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 8 }}>
                    <input className="tw-input" value={ticketAwb} onChange={(e) => setTicketAwb(e.target.value)} placeholder="AWB (optional)" style={{ border: '1px solid #dbe6f4', borderRadius: 10, padding: '8px 10px', fontSize: 12, color: '#334155', background: '#fff' }} />
                    <select className="tw-select" value={ticketPriority} onChange={(e) => setTicketPriority(e.target.value)} style={{ border: '1px solid #dbe6f4', borderRadius: 10, padding: '8px 10px', fontSize: 12, color: '#334155', background: '#fff' }}>
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <textarea className="tw-input" value={ticketMessage} onChange={(e) => setTicketMessage(e.target.value)} placeholder="Describe the issue..." rows={4} style={{ border: '1px solid #dbe6f4', borderRadius: 10, padding: '8px 10px', fontSize: 12, resize: 'vertical', color: '#334155', background: '#fff' }} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button type="button" onClick={() => setTicketOpen(false)} style={{ border: '1px solid #dbe6f4', background: '#fff', borderRadius: 10, padding: '7px 10px', fontSize: 12, fontWeight: 700, color: '#475569', cursor: 'pointer' }}>Cancel</button>
                    <button type="button" onClick={submitSupportTicket} disabled={submittingTicket} style={{ border: '1px solid #f7c9aa', background: submittingTicket ? '#fff7f2' : '#fff3ec', borderRadius: 10, padding: '7px 10px', fontSize: 12, fontWeight: 800, color: '#c2410c', cursor: submittingTicket ? 'not-allowed' : 'pointer', opacity: submittingTicket ? 0.75 : 1 }}>
                      {submittingTicket ? 'Submitting...' : 'Submit Ticket'}
                    </button>
                  </div>
                </div>
              </div>
            )}
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
            <div style={{ padding: 26, color: '#64748b', fontSize: 13 }}>Loading shipments…</div>
          ) : filteredShipments.length === 0 ? (
            <div style={{ padding: 28, textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: 36 }}>📭</div>
              <div style={{ marginTop: 8, fontWeight: 700 }}>No shipments found in this range.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
                <thead>
                  <tr style={{ background: '#f8fbff' }}>
                    {['AWB', 'Date', 'Consignee', 'Destination', 'Courier', 'Weight', 'Amount', 'Status'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '11px 14px', borderBottom: '1px solid #e5edf8', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredShipments.map((s, i) => (
                    <tr key={s.id} style={{ background: i % 2 ? '#fcfdff' : '#fff', borderBottom: '1px solid #eef3fb' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>{s.awb}</td>
                      <td style={{ padding: '10px 14px', color: '#475569' }}>{s.date}</td>
                      <td style={{ padding: '10px 14px', color: '#334155' }}>{s.consignee || '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#475569' }}>{s.destination || '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#475569' }}>{s.courier || '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#475569' }}>{s.weight ? `${s.weight} kg` : '—'}</td>
                      <td style={{ padding: '10px 14px', color: '#334155', fontWeight: 700 }}>{fmt(s.amount || 0)}</td>
                      <td style={{ padding: '10px 14px' }}><StatusBadge status={s.status} /></td>
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
      `}</style>
    </div>
  );
}
