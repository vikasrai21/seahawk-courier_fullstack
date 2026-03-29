import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { PageLoader } from '../../components/ui/Loading';

function PriorityPill({ priority }) {
  const tone = {
    urgent: 'border-rose-200 bg-rose-50 text-rose-700',
    high: 'border-orange-200 bg-orange-50 text-orange-700',
    normal: 'border-sky-200 bg-sky-50 text-sky-700',
    low: 'border-slate-200 bg-slate-50 text-slate-700',
  }[String(priority || '').toLowerCase()] || 'border-slate-200 bg-slate-50 text-slate-700';

  return <span className={`rounded-full border px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em] ${tone}`}>{priority || 'normal'}</span>;
}

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
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7faff_0%,#eef4fd_100%)]">
      <header className="border-b border-slate-200/70 bg-white/90 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/portal" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:text-slate-700">← Portal</Link>
            <div>
              <div className="text-sm font-black text-slate-900">Support Tickets</div>
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-orange-500">Client Help Desk</div>
            </div>
          </div>
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.08em] text-sky-700">
            {tickets.length} conversations
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl p-6 space-y-6">
        <section className="overflow-hidden rounded-[28px] border border-slate-200/60 bg-[linear-gradient(145deg,#fffaf5_0%,#ffffff_70%)] p-6 shadow-[0_22px_44px_-30px_rgba(194,65,12,0.35)]">
          <div className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-orange-600">
            Issue Tracking
          </div>
          <h1 className="mt-4 max-w-2xl text-3xl font-black leading-tight text-slate-900">Support now feels like an inbox, not a plain list.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            Open a conversation, follow status changes, and send a reply without losing the thread of what happened.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[360px,minmax(0,1fr)]">
          <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_18px_42px_-32px_rgba(15,23,42,0.38)]">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-orange-500">Inbox</div>
              <h2 className="mt-1 text-lg font-black text-slate-900">Your complaints & queries</h2>
              <p className="mt-1 text-sm text-slate-500">Select a ticket to see the full conversation and respond.</p>
            </div>
            {tickets.length === 0 ? (
              <div className="p-8 text-sm text-slate-500">No tickets yet.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.ticketNo}
                    onClick={() => loadTicket(ticket.ticketNo)}
                    className={`w-full p-4 text-left transition ${active?.ticketNo === ticket.ticketNo ? 'bg-sky-50' : 'hover:bg-slate-50'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-mono text-xs font-black text-slate-800">{ticket.ticketNo}</div>
                      <span className="badge badge-blue">{ticket.status}</span>
                    </div>
                    <div className="mt-2 text-sm font-black text-slate-900">{ticket.subject}</div>
                    <div className="mt-1 text-xs text-slate-500">{ticket.awb || 'General issue'} · {new Date(ticket.createdAt).toLocaleDateString('en-IN')}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.38)]">
            {!active ? (
              <div className="grid min-h-[420px] place-items-center text-center">
                <div>
                  <div className="text-5xl">🎫</div>
                  <div className="mt-4 text-lg font-black text-slate-900">Select a ticket to open the conversation.</div>
                  <div className="mt-2 max-w-md text-sm text-slate-500">
                    Tickets raised from the portal dashboard will appear here with their full timeline and replies.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xl font-black text-slate-900">{active.subject}</div>
                      <div className="mt-1 text-xs text-slate-500">{active.ticketNo} · {active.awb || 'No AWB linked'} · {active.status}</div>
                    </div>
                    <PriorityPill priority={active.priority} />
                  </div>
                </div>

                <div className="max-h-[440px] space-y-3 overflow-y-auto pr-1">
                  {(active.timeline || []).map((item, idx) => (
                    <div key={`${item.at}-${idx}`} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-bold text-slate-900">{item.type === 'comment' ? item.by : 'Ticket Update'}</div>
                        <div className="text-xs text-slate-500">{new Date(item.at).toLocaleString('en-IN')}</div>
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-700">
                        {item.message || item.note || 'Ticket created'}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-orange-500">Reply</div>
                  <label className="mt-2 block text-sm font-bold text-slate-900">Add more details</label>
                  <textarea
                    className="input mt-2"
                    rows={4}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Share additional details, screenshot links, or request an update..."
                  />
                  <div className="mt-3 flex justify-end">
                    <button className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70" onClick={sendReply} disabled={sending || !reply.trim()}>
                      {sending ? 'Sending…' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
