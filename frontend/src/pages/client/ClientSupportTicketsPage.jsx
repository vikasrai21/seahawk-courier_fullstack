import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { PageLoader } from '../../components/ui/Loading';

export default function ClientSupportTicketsPage({ toast }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/support/tickets?limit=50');
      setTickets(res.data || []);
    } catch (err) {
      toast?.(err.message || 'Failed to load support tickets', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadTicket = async (ticketNo) => {
    try {
      const res = await api.get(`/support/tickets/${ticketNo}`);
      setActive(res.data);
      setReply('');
    } catch (err) {
      toast?.(err.message || 'Failed to load ticket details', 'error');
    }
  };

  const sendReply = async () => {
    if (!active?.ticketNo || !reply.trim()) return;
    setSending(true);
    try {
      await api.post(`/support/tickets/${active.ticketNo}/comment`, { message: reply.trim() });
      toast?.('Reply sent', 'success');
      await loadTicket(active.ticketNo);
      await load();
    } catch (err) {
      toast?.(err.message || 'Failed to send reply', 'error');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link to="/portal" className="text-gray-400 hover:text-gray-600">← Portal</Link>
        <span className="font-bold text-gray-900">Support Tickets</span>
      </header>

      <div className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-[340px,1fr] gap-5">
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50">
            <h1 className="font-bold text-gray-900">Your Complaints & Queries</h1>
            <p className="text-xs text-gray-500 mt-1">Track replies and continue the conversation.</p>
          </div>
          {tickets.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">No tickets yet.</div>
          ) : (
            <div className="divide-y">
              {tickets.map((ticket) => (
                <button
                  key={ticket.ticketNo}
                  onClick={() => loadTicket(ticket.ticketNo)}
                  className={`w-full text-left p-4 transition ${active?.ticketNo === ticket.ticketNo ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-mono text-xs font-semibold text-gray-800">{ticket.ticketNo}</div>
                    <span className="badge badge-blue">{ticket.status}</span>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-gray-900">{ticket.subject}</div>
                  <div className="mt-1 text-xs text-gray-500">{ticket.awb || 'General issue'} · {new Date(ticket.createdAt).toLocaleDateString('en-IN')}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          {!active ? (
            <div className="text-sm text-gray-500">Open a ticket from the portal dashboard or select one from the left to view the full conversation.</div>
          ) : (
            <div className="space-y-4">
              <div className="border-b pb-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <div className="font-bold text-gray-900">{active.subject}</div>
                    <div className="text-xs text-gray-500 mt-1">{active.ticketNo} · {active.awb || 'No AWB linked'} · {active.status}</div>
                  </div>
                  <span className="badge badge-yellow">{active.priority}</span>
                </div>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto">
                {(active.timeline || []).map((item, idx) => (
                  <div key={`${item.at}-${idx}`} className="rounded-xl border border-gray-100 p-3 bg-gray-50">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-gray-900">{item.type === 'comment' ? item.by : 'Ticket Update'}</div>
                      <div className="text-xs text-gray-500">{new Date(item.at).toLocaleString('en-IN')}</div>
                    </div>
                    <div className="mt-2 text-sm text-gray-700">
                      {item.message || item.note || 'Ticket created'}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t pt-4">
                <label className="label">Add Reply</label>
                <textarea
                  className="input"
                  rows={4}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Share additional details, screenshots link, or request an update..."
                />
                <div className="mt-3 flex justify-end">
                  <button className="btn-primary" onClick={sendReply} disabled={sending || !reply.trim()}>
                    {sending ? 'Sending…' : 'Send Reply'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
