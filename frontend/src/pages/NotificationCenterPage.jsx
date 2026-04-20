import React, { useState, useEffect, useCallback } from 'react';
import { Send, Mail, MessageCircle, Clock, CheckCircle, AlertCircle, Search, Filter, RefreshCw, Users, Calendar, FileText, ArrowRight, Loader2 } from 'lucide-react';
import api from '../services/api';

const STATUS_COLORS = {
  SENT: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: 'Sent' },
  FAILED: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', label: 'Failed' },
  QUEUED: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: 'Queued' },
  PENDING: { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8', label: 'Pending' },
};

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div style={{
      padding: 20, borderRadius: 16, border: '1px solid var(--shk-border)',
      background: 'var(--shk-surface)', display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--shk-text-dim)' }}>{label}</span>
        <Icon size={14} style={{ color: color || 'var(--shk-text-dim)' }} />
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: color || 'var(--shk-text)' }}>{value}</div>
    </div>
  );
}

export default function NotificationCenterPage({ toast }) {
  const [tab, setTab] = useState('send');
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Send form state
  const [sendMode, setSendMode] = useState('single'); // single, digest, bulk
  const [awb, setAwb] = useState('');
  const [clientCode, setClientCode] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [forceEmail, setForceEmail] = useState(true);
  const [forceWhatsapp, setForceWhatsapp] = useState(false);

  // History filters
  const [filterClient, setFilterClient] = useState('');
  const [filterChannel, setFilterChannel] = useState('');

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get('/notifications/stats');
      setStats(res.data?.data || {});
    } catch { /* ignore */ }
  }, []);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterClient) params.set('clientCode', filterClient);
      if (filterChannel) params.set('channel', filterChannel);
      params.set('limit', '50');
      const res = await api.get(`/notifications/history?${params}`);
      setHistory(res.data?.data || []);
    } catch { toast?.('Failed to load history', 'error'); }
    finally { setLoading(false); }
  }, [filterClient, filterChannel, toast]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { if (tab === 'history') loadHistory(); }, [tab, loadHistory]);

  const handleSend = async () => {
    setSending(true);
    try {
      let res;
      if (sendMode === 'single') {
        if (!awb.trim()) { toast?.('AWB is required', 'error'); setSending(false); return; }
        res = await api.post('/notifications/send-update', { awb: awb.trim(), forceEmail, forceWhatsapp });
      } else if (sendMode === 'digest') {
        if (!clientCode.trim() || !date) { toast?.('Client code and date are required', 'error'); setSending(false); return; }
        res = await api.post('/notifications/send-digest', { clientCode: clientCode.trim(), date });
      } else {
        if (!clientCode.trim() || !dateFrom || !dateTo) { toast?.('All fields are required for bulk', 'error'); setSending(false); return; }
        res = await api.post('/notifications/send-bulk', { clientCode: clientCode.trim(), dateFrom, dateTo });
      }

      const data = res.data?.data;
      if (data?.error) {
        toast?.(data.error, 'error');
      } else {
        toast?.(res.data?.message || 'Notification sent!', 'success');
        loadStats();
        setAwb(''); setClientCode('');
      }
    } catch (err) {
      toast?.(err.response?.data?.message || 'Failed to send', 'error');
    } finally { setSending(false); }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 14,
            background: 'linear-gradient(135deg, #f59e0b, #f97316)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(249,115,22,0.25)',
          }}>
            <Send size={20} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--shk-text)', margin: 0 }}>Notification Center</h1>
            <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--shk-text-dim)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Email & WhatsApp • Shipment Updates • Client Digests
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[{ id: 'send', label: 'Send', icon: Send }, { id: 'history', label: 'History', icon: Clock }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10,
                border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                background: tab === t.id ? 'var(--shk-text)' : 'transparent',
                color: tab === t.id ? 'var(--shk-bg)' : 'var(--shk-text-dim)',
                transition: 'all 0.2s',
              }}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
          <StatCard label="Total Sent" value={stats.sent || 0} icon={CheckCircle} color="#10b981" />
          <StatCard label="Failed" value={stats.failed || 0} icon={AlertCircle} color="#ef4444" />
          <StatCard label="Queued" value={stats.queued || 0} icon={Clock} color="#f59e0b" />
          <StatCard label="Delivery Rate" value={`${stats.deliveryRate || 0}%`} icon={Send} color="#3b82f6" />
        </div>
      )}

      {tab === 'send' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Send Form */}
          <div style={{ padding: 24, borderRadius: 16, border: '1px solid var(--shk-border)', background: 'var(--shk-surface)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--shk-text)', margin: '0 0 16px' }}>Send Notification</h3>

            {/* Mode Selector */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, padding: 3, borderRadius: 10, background: 'var(--shk-bg)', border: '1px solid var(--shk-border)' }}>
              {[
                { id: 'single', label: 'Single AWB', icon: FileText },
                { id: 'digest', label: 'Daily Digest', icon: Calendar },
                { id: 'bulk', label: 'Bulk Range', icon: Users },
              ].map(m => (
                <button key={m.id} onClick={() => setSendMode(m.id)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: 11, fontWeight: 700,
                    background: sendMode === m.id ? 'var(--shk-surface)' : 'transparent',
                    color: sendMode === m.id ? 'var(--shk-text)' : 'var(--shk-text-dim)',
                    boxShadow: sendMode === m.id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  <m.icon size={12} /> {m.label}
                </button>
              ))}
            </div>

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sendMode === 'single' && (
                <>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--shk-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, display: 'block' }}>AWB Number</label>
                    <input value={awb} onChange={e => setAwb(e.target.value)} placeholder="e.g. X1000280525"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--shk-border)', background: 'var(--shk-bg)', fontSize: 13, color: 'var(--shk-text)', outline: 'none', fontFamily: 'monospace', fontWeight: 600 }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--shk-text-mid)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={forceEmail} onChange={e => setForceEmail(e.target.checked)} /> <Mail size={14} /> Email
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--shk-text-mid)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={forceWhatsapp} onChange={e => setForceWhatsapp(e.target.checked)} /> <MessageCircle size={14} /> WhatsApp
                    </label>
                  </div>
                </>
              )}

              {sendMode === 'digest' && (
                <>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--shk-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, display: 'block' }}>Client Code</label>
                    <input value={clientCode} onChange={e => setClientCode(e.target.value.toUpperCase())} placeholder="e.g. ABC"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--shk-border)', background: 'var(--shk-bg)', fontSize: 13, color: 'var(--shk-text)', outline: 'none', fontWeight: 600 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--shk-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, display: 'block' }}>Date</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--shk-border)', background: 'var(--shk-bg)', fontSize: 13, color: 'var(--shk-text)', outline: 'none' }}
                    />
                  </div>
                </>
              )}

              {sendMode === 'bulk' && (
                <>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--shk-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, display: 'block' }}>Client Code</label>
                    <input value={clientCode} onChange={e => setClientCode(e.target.value.toUpperCase())} placeholder="e.g. ABC"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--shk-border)', background: 'var(--shk-bg)', fontSize: 13, color: 'var(--shk-text)', outline: 'none', fontWeight: 600 }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--shk-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, display: 'block' }}>From</label>
                      <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--shk-border)', background: 'var(--shk-bg)', fontSize: 13, color: 'var(--shk-text)', outline: 'none' }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--shk-text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, display: 'block' }}>To</label>
                      <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--shk-border)', background: 'var(--shk-bg)', fontSize: 13, color: 'var(--shk-text)', outline: 'none' }}
                      />
                    </div>
                  </div>
                </>
              )}

              <button onClick={handleSend} disabled={sending}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg, #f59e0b, #f97316)', color: '#fff',
                  fontSize: 13, fontWeight: 700, marginTop: 8,
                  boxShadow: '0 4px 16px rgba(249,115,22,0.25)',
                  opacity: sending ? 0.7 : 1, transition: 'all 0.2s',
                }}
              >
                {sending ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Sending...</> : <><Send size={16} /> Send Notification</>}
              </button>
            </div>
          </div>

          {/* Help Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: 20, borderRadius: 16, border: '1px solid var(--shk-border)', background: 'var(--shk-surface)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--shk-text)', margin: '0 0 12px' }}>How It Works</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { step: 1, title: 'Single AWB', desc: 'Send an immediate status update for one shipment to the client via email and/or WhatsApp.' },
                  { step: 2, title: 'Daily Digest', desc: 'Send a summary email with all shipments for a specific client and date — perfect for backlog entries.' },
                  { step: 3, title: 'Bulk Range', desc: 'Send a comprehensive report for a date range. Ideal for weekly/monthly client summaries.' },
                ].map(item => (
                  <div key={item.step} style={{ display: 'flex', gap: 10 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                      background: 'var(--shk-text)', color: 'var(--shk-bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800,
                    }}>{item.step}</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--shk-text)' }}>{item.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--shk-text-dim)', lineHeight: 1.5 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: 16, borderRadius: 14, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <AlertCircle size={16} style={{ color: '#3b82f6', flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1e40af' }}>Backlog Aware</div>
                  <div style={{ fontSize: 11, color: '#3b82f6', lineHeight: 1.5 }}>
                    When you enter shipments for past dates, notifications will include the actual shipment date so clients have full context.
                  </div>
                </div>
              </div>
            </div>

            {stats?.byChannel?.length > 0 && (
              <div style={{ padding: 20, borderRadius: 16, border: '1px solid var(--shk-border)', background: 'var(--shk-surface)' }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--shk-text)', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Channel Breakdown (30d)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {stats.byChannel.map((ch, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--shk-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {ch.channel === 'EMAIL' ? <Mail size={14} color="#3b82f6" /> : <MessageCircle size={14} color="#25d366" />}
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--shk-text)' }}>{ch.channel}</span>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--shk-text)' }}>{ch.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
              <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--shk-text-dim)' }} />
              <input value={filterClient} onChange={e => setFilterClient(e.target.value.toUpperCase())} placeholder="Filter by client code..."
                style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: 10, border: '1px solid var(--shk-border)', background: 'var(--shk-surface)', fontSize: 12, color: 'var(--shk-text)', outline: 'none' }}
              />
            </div>
            <select value={filterChannel} onChange={e => setFilterChannel(e.target.value)}
              style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid var(--shk-border)', background: 'var(--shk-surface)', fontSize: 12, color: 'var(--shk-text)', outline: 'none' }}
            >
              <option value="">All Channels</option>
              <option value="EMAIL">Email</option>
              <option value="WHATSAPP">WhatsApp</option>
            </select>
            <button onClick={loadHistory} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: '1px solid var(--shk-border)', background: 'var(--shk-surface)', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--shk-text-mid)' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {/* History Table */}
          <div style={{ borderRadius: 14, border: '1px solid var(--shk-border)', background: 'var(--shk-surface)', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr 1.5fr 0.8fr 1fr', padding: '10px 16px', background: 'var(--shk-bg)', borderBottom: '1px solid var(--shk-border)' }}>
              {['Client', 'AWB', 'Channel', 'Message', 'Status', 'Time'].map(h => (
                <div key={h} style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--shk-text-dim)' }}>{h}</div>
              ))}
            </div>
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: 'var(--shk-text-dim)' }} /></div>
              ) : history.length > 0 ? history.map((item, i) => {
                const st = STATUS_COLORS[item.status] || STATUS_COLORS.PENDING;
                return (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 0.8fr 1.5fr 0.8fr 1fr', padding: '10px 16px', borderBottom: '1px solid var(--shk-border)', alignItems: 'center', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--shk-bg)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--shk-text)' }}>{item.clientCode || '—'}</div>
                    <div style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 600, color: 'var(--shk-text-mid)' }}>{item.awb || '—'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {item.channel === 'EMAIL' ? <Mail size={12} color="#3b82f6" /> : <MessageCircle size={12} color="#25d366" />}
                      <span style={{ fontSize: 11, color: 'var(--shk-text-mid)' }}>{item.channel}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--shk-text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.message}</div>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: st.bg, color: st.color, textTransform: 'uppercase', letterSpacing: '0.05em', width: 'fit-content' }}>{st.label}</span>
                    <div style={{ fontSize: 10, color: 'var(--shk-text-dim)' }}>{item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}</div>
                  </div>
                );
              }) : (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--shk-text-dim)', fontSize: 13 }}>
                  <Mail size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                  <p style={{ margin: 0 }}>No notifications found. Send one to get started.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
