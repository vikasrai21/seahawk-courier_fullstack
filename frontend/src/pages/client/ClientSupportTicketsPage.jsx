import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LifeBuoy, MessageSquareText, Send, TimerReset } from 'lucide-react';
import api from '../../services/api';
import { PageLoader } from '../../components/ui/Loading';
import ClientPortalPageIntro from '../../components/client/ClientPortalPageIntro';

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
    <div className="min-h-full pb-10">
      <div className="mx-auto client-premium-main">
        <ClientPortalPageIntro
          eyebrow="Client Help Desk"
          title="Support now feels like a conversation hub instead of a dead-end ticket list."
          description="Open the latest thread, review status updates in context, and respond without breaking your operational flow."
          badges={[`${tickets.length} conversations`, active?.ticketNo ? `Active ${active.ticketNo}` : 'No ticket selected', 'Threaded updates']}
          actions={(
            <>
              <Link to="/portal" className="client-action-btn-secondary">
                Back to portal
              </Link>
              <Link to="/portal/shipments" className="client-action-btn-primary">
                Review shipments first
              </Link>
            </>
          )}
          aside={(
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="client-page-metric">
                <div className="flex items-center justify-between gap-3">
                  <span className="client-page-metric-label">Open conversations</span>
                  <LifeBuoy size={16} className="text-orange-500" />
                </div>
                <div className="client-page-metric-value">{tickets.length}</div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Each ticket keeps its replies and operational updates in one place.</p>
              </div>
              <div className="client-page-metric">
                <div className="flex items-center justify-between gap-3">
                  <span className="client-page-metric-label">Reply state</span>
                  <MessageSquareText size={16} className="text-sky-500" />
                </div>
                <div className="mt-2 text-base font-black text-slate-950 dark:text-white">{reply.trim() ? 'Draft ready' : 'No draft yet'}</div>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Select a ticket and add context before sending your response.</p>
              </div>
            </div>
          )}
        />

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[360px,minmax(0,1fr)]">
          <div className="client-section-card overflow-hidden p-0">
            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
              <div className="client-page-eyebrow">Inbox</div>
              <h2 className="mt-3 text-lg font-black text-slate-900 dark:text-white">Your complaints and queries</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Select a ticket to see the full conversation and respond.</p>
            </div>
            {tickets.length === 0 ? (
              <div className="p-8 text-sm text-slate-500 dark:text-slate-300">No tickets yet.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.ticketNo}
                    onClick={() => loadTicket(ticket.ticketNo)}
                    className={`w-full p-4 text-left transition ${active?.ticketNo === ticket.ticketNo ? 'bg-sky-50 dark:bg-sky-950/30' : 'hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-mono text-xs font-black text-slate-800 dark:text-slate-100">{ticket.ticketNo}</div>
                      <span className="badge badge-info">{ticket.status}</span>
                    </div>
                    <div className="mt-2 text-sm font-black text-slate-900 dark:text-white">{ticket.subject}</div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-300">{ticket.awb || 'General issue'} · {new Date(ticket.createdAt).toLocaleDateString('en-IN')}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="client-section-card">
            {!active ? (
              <div className="grid min-h-[420px] place-items-center text-center">
                <div>
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-200">
                    <TimerReset size={28} />
                  </div>
                  <div className="mt-4 text-lg font-black text-slate-900 dark:text-white">Select a ticket to open the conversation.</div>
                  <div className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-300">
                    Tickets raised from the portal dashboard will appear here with their full timeline and replies.
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/70">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-xl font-black text-slate-900 dark:text-white">{active.subject}</div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-300">{active.ticketNo} · {active.awb || 'No AWB linked'} · {active.status}</div>
                    </div>
                    <PriorityPill priority={active.priority} />
                  </div>
                </div>

                <div className="max-h-[440px] space-y-3 overflow-y-auto pr-1">
                  {(active.timeline || []).map((item, idx) => (
                    <div key={`${item.at}-${idx}`} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/65">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{item.type === 'comment' ? item.by : 'Ticket Update'}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-300">{new Date(item.at).toLocaleString('en-IN')}</div>
                      </div>
                      <div className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                        {item.message || item.note || 'Ticket created'}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                  <div className="client-page-eyebrow">Reply</div>
                  <label className="mt-3 block text-sm font-bold text-slate-900 dark:text-white">Add more details</label>
                  <textarea
                    className="input mt-2"
                    rows={4}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Share additional details, screenshot links, or request an update..."
                  />
                  <div className="mt-3 flex justify-end">
                    <button className="client-action-btn-primary" onClick={sendReply} disabled={sending || !reply.trim()}>
                      <Send size={14} />
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

