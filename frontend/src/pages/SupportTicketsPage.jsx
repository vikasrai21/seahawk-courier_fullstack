import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const STATUS = ['OPEN', 'IN_PROGRESS', 'WAITING_CLIENT', 'RESOLVED', 'CLOSED'];
const PRIORITY = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

function pillColor(status) {
  const map = {
    OPEN: ['#1d4ed8', '#e0ecff'],
    IN_PROGRESS: ['#c2410c', '#ffedd5'],
    WAITING_CLIENT: ['#7c3aed', '#ede9fe'],
    RESOLVED: ['#166534', '#dcfce7'],
    CLOSED: ['#334155', '#e2e8f0'],
  };
  return map[status] || ['#334155', '#e2e8f0'];
}

export default function SupportTicketsPage({ toast }) {
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [mine, setMine] = useState(false);
  const [comment, setComment] = useState('');
  const [internalComment, setInternalComment] = useState(true);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const qs = new URLSearchParams();
      qs.set('limit', '100');
      if (query) qs.set('q', query);
      if (status) qs.set('status', status);
      if (priority) qs.set('priority', priority);
      if (mine) qs.set('assignee', 'me');
      const res = await api.get(`/support/tickets?${qs.toString()}`);
      setTickets(res.data || []);
      if (!selected && (res.data || [])[0]) setSelected((res.data || [])[0].ticketNo);
    } catch (e) {
      toast?.(e.message || 'Failed to load tickets', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (ticketNo) => {
    if (!ticketNo) return;
    try {
      const res = await api.get(`/support/tickets/${ticketNo}`);
      setDetail(res.data || null);
    } catch (e) {
      toast?.(e.message || 'Failed to load ticket detail', 'error');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers((res.data || []).filter((u) => ['ADMIN', 'OPS_MANAGER', 'STAFF'].includes(u.role)));
    } catch {
      // no-op
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchUsers();
  }, [query, status, priority, mine]);

  useEffect(() => {
    fetchDetail(selected);
  }, [selected]);

  const selectedTicket = useMemo(() => tickets.find((t) => t.ticketNo === selected), [tickets, selected]);

  const updateTicket = async (patch) => {
    if (!selected) return;
    try {
      const res = await api.patch(`/support/tickets/${selected}`, patch);
      toast?.(res.message || 'Ticket updated', 'success');
      await Promise.all([fetchTickets(), fetchDetail(selected)]);
    } catch (e) {
      toast?.(e.message || 'Update failed', 'error');
    }
  };

  const sendComment = async () => {
    if (!selected || !comment.trim()) return;
    try {
      const res = await api.post(`/support/tickets/${selected}/comment`, { message: comment.trim(), internal: internalComment });
      toast?.(res.message || 'Comment added', 'success');
      setComment('');
      await fetchDetail(selected);
    } catch (e) {
      toast?.(e.message || 'Failed to add comment', 'error');
    }
  };

  return (
    <div className="portal-page">
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#0f172a' }}>Support Tickets</h1>
        <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>
          Enterprise support queue for client issues, SLA actions, assignment, and resolution workflow.
        </p>
      </div>

      <div className="portal-section" style={{ marginBottom: 14 }}>
        <div className="portal-section-body" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ticket no, client, subject, AWB..."
            style={{ maxWidth: 320 }}
          />
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="">All Status</option>
            {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="">All Priority</option>
            {PRIORITY.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#334155', fontWeight: 600 }}>
            <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} />
            Assigned to me
          </label>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 14 }}>
        <div className="portal-section">
          <div className="portal-section-head">
            <strong style={{ color: '#0f172a' }}>Queue ({tickets.length})</strong>
          </div>
          <div className="portal-section-body" style={{ padding: 0 }}>
            {loading ? (
              <div style={{ padding: 16, color: '#64748b' }}>Loading tickets…</div>
            ) : tickets.length === 0 ? (
              <div style={{ padding: 16, color: '#64748b' }}>No tickets found.</div>
            ) : (
              tickets.map((t) => {
                const [fg, bg] = pillColor(t.status);
                return (
                  <button
                    key={t.ticketNo}
                    type="button"
                    onClick={() => setSelected(t.ticketNo)}
                    style={{
                      width: '100%',
                      border: 'none',
                      borderBottom: '1px solid #eef2f8',
                      background: selected === t.ticketNo ? '#f8fbff' : '#fff',
                      textAlign: 'left',
                      padding: '12px 14px',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <div style={{ fontSize: 12, color: '#0f172a', fontWeight: 800 }}>{t.ticketNo}</div>
                      <span style={{ fontSize: 10, fontWeight: 800, color: fg, background: bg, borderRadius: 999, padding: '3px 8px' }}>{t.status}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#334155', fontWeight: 700 }}>{t.subject}</div>
                    <div style={{ marginTop: 4, fontSize: 11, color: '#64748b' }}>
                      {t.clientCode} · {t.priority} · {t.assigneeName || 'Unassigned'}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="portal-section">
          <div className="portal-section-head">
            <strong style={{ color: '#0f172a' }}>{selectedTicket?.ticketNo || 'Ticket Detail'}</strong>
          </div>
          <div className="portal-section-body">
            {!detail ? (
              <div style={{ color: '#64748b' }}>Select a ticket from queue.</div>
            ) : (
              <>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>{detail.subject}</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: '#64748b' }}>
                    Client: <strong>{detail.clientCode}</strong> · Raised by <strong>{detail.raisedBy?.email || '-'}</strong> · AWB {detail.awb || '-'}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                  <select className="input" value={detail.status} onChange={(e) => updateTicket({ status: e.target.value })}>
                    {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select className="input" value={detail.priority} onChange={(e) => updateTicket({ priority: e.target.value })}>
                    {PRIORITY.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <select
                    className="input"
                    value={detail.assigneeId || ''}
                    onChange={(e) => updateTicket({ assigneeId: e.target.value ? Number(e.target.value) : null })}
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                  </select>
                </div>

                <div style={{ border: '1px solid #e7eef9', borderRadius: 12, padding: 10, marginBottom: 10, maxHeight: 240, overflowY: 'auto', background: '#fbfdff' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#334155', marginBottom: 8 }}>Timeline</div>
                  {detail.timeline?.length ? detail.timeline.map((item, idx) => (
                    <div key={`${item.at}-${idx}`} style={{ padding: '8px 0', borderBottom: idx === detail.timeline.length - 1 ? 'none' : '1px dashed #dde7f5' }}>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(item.at).toLocaleString()}</div>
                      <div style={{ fontSize: 12, color: '#334155', fontWeight: 700 }}>{item.by}</div>
                      <div style={{ fontSize: 12, color: '#475569' }}>{item.note || item.message || '-'}</div>
                    </div>
                  )) : <div style={{ fontSize: 12, color: '#64748b' }}>No timeline entries.</div>}
                </div>

                <div style={{ display: 'grid', gap: 8 }}>
                  <textarea
                    className="input"
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write update for client/team..."
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#334155', fontWeight: 600 }}>
                      <input type="checkbox" checked={internalComment} onChange={(e) => setInternalComment(e.target.checked)} />
                      Internal note (hidden from client)
                    </label>
                    <button className="btn-primary" type="button" onClick={sendComment}>Add Comment</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
