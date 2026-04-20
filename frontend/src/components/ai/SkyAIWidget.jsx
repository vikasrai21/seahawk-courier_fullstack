import { useState, useRef, useEffect, useCallback } from 'react';
import { Maximize2, Minimize2, Send, ChevronDown, Wallet, ShieldAlert, Package, Copy, Check } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const HISTORY_KEY = (userId) => `skyai_history_${userId}`;
const MAX_STORED = 20;

export function SkyAIWidget() {
  const { hasRole, user } = useAuth();
  const { dark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Persistent history — load from localStorage on mount
  const [messages, setMessages] = useState(() => {
    if (!user?.id) return [defaultGreeting()];
    try {
      const raw = localStorage.getItem(HISTORY_KEY(user.id));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
        }
      }
    } catch { /* ignore */ }
    return [defaultGreeting()];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  if (!hasRole('ADMIN', 'OPS_MANAGER', 'OWNER')) return null;

  function defaultGreeting() {
    return {
      id: '1',
      role: 'model',
      content: "Hello admin. I'm SkyAI. I can analyze shipments, monitor margins, or check courier metrics. What do you need?",
      timestamp: new Date(),
    };
  }

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    if (!user?.id) return;
    try {
      const toStore = messages.slice(-MAX_STORED).map(m => ({
        ...m,
        timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
      }));
      localStorage.setItem(HISTORY_KEY(user.id), JSON.stringify(toStore));
    } catch { /* ignore */ }
  }, [messages, user?.id]);

  // Ctrl+K to open SkyAI
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const sendMessage = async (userMsg) => {
    if (!userMsg.trim() || isLoading) return;
    const newUserMsg = { id: Date.now().toString(), role: 'user', content: userMsg, timestamp: new Date() };
    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content })).slice(-8);
      const { data, error } = await api.post('/ops/assistant/chat', { message: userMsg, history });
      if (error) throw new Error(error);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'model',
          content: data.reply || "I encountered an error interpreting the data.",
          actionData: data.data,
          actionType: data.action?.type,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', content: `Error: ${err.message}`, isError: true, timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    const userMsg = input.trim();
    setInput('');
    await sendMessage(userMsg);
  };

  const copyMessage = useCallback(async (msgId, content) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { /* ignore */ }
  }, []);

  const clearHistory = () => {
    const fresh = [defaultGreeting()];
    setMessages(fresh);
    if (user?.id) localStorage.removeItem(HISTORY_KEY(user.id));
  };

  const getFollowups = (msg) => {
    if (msg.role !== 'model' || msg.isError) return [];
    switch (msg.actionType) {
      case 'TRACK_SHIPMENT':    return ['Show pending NDRs', 'Courier performance', 'Track another AWB'];
      case 'LOOKUP_SHIPMENT':   return ['Track this shipment', 'Show pending NDRs', 'Negative wallets'];
      case 'GET_PENDING_NDRS':  return ['Track first AWB', 'Negative wallets', 'Courier performance'];
      case 'GET_WALLET_BALANCES': return ['Pending NDRs', 'Courier performance', 'Track AWB'];
      case 'CHECK_COURIER_PERFORMANCE': return ['Pending NDRs', 'Track AWB', 'Dashboard summary'];
      default: return ['Track AWB', 'Pending NDRs', 'Negative wallets'];
    }
  };

  const getFollowupIcon = (label) => {
    const v = String(label || '').toLowerCase();
    if (v.includes('track')) return '◎';
    if (v.includes('ndr')) return '!';
    if (v.includes('wallet')) return '₹';
    if (v.includes('courier')) return '↗';
    if (v.includes('dashboard')) return '◫';
    return '•';
  };

  const QuickDataCard = ({ actionType, data }) => {
    if (!data) return null;
    if (actionType === 'GET_PENDING_NDRS') {
      return (
        <div style={{ background: dark ? 'rgba(0,0,0,0.2)' : '#f8fafc', borderRadius: 8, padding: 12, marginTop: 8, border: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#ef4444', fontWeight: 700, fontSize: 11 }}>
            <ShieldAlert size={14} /> Critical Pending NDRs
          </div>
          {data.items?.map(ndr => (
            <div key={ndr.awb} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '4px 0', borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'}` }}>
              <span><span style={{ color: dark ? '#94a3b8' : '#64748b' }}>{ndr.clientCode}</span> • {ndr.awb}</span>
              <span style={{ fontWeight: 600 }}>₹{ndr.amount}</span>
            </div>
          ))}
        </div>
      );
    }
    if (actionType === 'GET_WALLET_BALANCES') {
      return (
        <div style={{ background: dark ? 'rgba(0,0,0,0.2)' : '#f8fafc', borderRadius: 8, padding: 12, marginTop: 8, border: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#f97316', fontWeight: 700, fontSize: 11 }}>
            <Wallet size={14} /> Negative Wallets
          </div>
          {data.negativeBalances?.length === 0
            ? <div style={{ fontSize: 11 }}>No negative balances!</div>
            : data.negativeBalances?.map(w => (
              <div key={w.code} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '4px 0', borderBottom: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'}` }}>
                <span style={{ fontWeight: 600 }}>{w.company}</span>
                <span style={{ color: '#ef4444', fontWeight: 700 }}>₹{w.walletBalance}</span>
              </div>
            ))}
        </div>
      );
    }
    if (actionType === 'TRACK_SHIPMENT' || actionType === 'LOOKUP_SHIPMENT') {
      const ship = data.shipment;
      const track = data.tracking;
      return (
        <div style={{ background: dark ? 'rgba(0,0,0,0.2)' : '#f8fafc', borderRadius: 8, padding: 12, marginTop: 8, border: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'}` }}>
          {ship && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Package size={14} style={{ color: '#6366f1' }} />
              <span style={{ fontSize: 12, fontWeight: 800, fontFamily: 'monospace', color: dark ? '#e2e8f0' : '#0f172a' }}>{ship.awb}</span>
              <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#6366f122', color: '#6366f1', textTransform: 'uppercase' }}>{ship.courier}</span>
              {ship.status && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: ship.status === 'Delivered' ? '#16a34a22' : '#f9731622', color: ship.status === 'Delivered' ? '#16a34a' : '#f97316', textTransform: 'uppercase' }}>{ship.status}</span>}
            </div>
          )}
          {ship?.consignee && <div style={{ fontSize: 11, color: dark ? '#94a3b8' : '#64748b', marginBottom: 8 }}>📦 {ship.consignee} → <span style={{ fontWeight: 600 }}>{ship.destination}</span></div>}
          {track?.events?.length > 0 && (
            <div style={{ borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'}`, paddingTop: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#6366f1', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Live Tracking</div>
              {track.events.map((ev, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, fontSize: 11, padding: '4px 0', borderBottom: idx < track.events.length - 1 ? `1px solid ${dark ? 'rgba(255,255,255,0.03)' : '#f1f5f9'}` : 'none' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 4, flexShrink: 0, background: idx === 0 ? '#16a34a' : '#cbd5e1' }} />
                  <div>
                    <div style={{ fontWeight: 600, color: dark ? '#e2e8f0' : '#334155' }}>{ev.description || ev.status}</div>
                    <div style={{ fontSize: 10, color: dark ? '#64748b' : '#94a3b8' }}>{ev.location} {ev.timestamp ? `• ${new Date(ev.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}` : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {data.error && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 6 }}>⚠ {data.error}</div>}
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          title="SkyAI — Ops Copilot (Ctrl+K)"
          className="shk-launcher"
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
            width: 68, height: 68, borderRadius: 22,
            background: 'linear-gradient(145deg, #eef8ff 0%, #eef2ff 50%, #f3e8ff 100%)',
            color: '#fff', border: '1px solid rgba(255,255,255,0.85)', cursor: 'pointer',
            boxShadow: '0 20px 44px -20px rgba(59,130,246,0.4), 0 14px 24px -20px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.95)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.2s', overflow: 'hidden',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 25% 20%, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0) 35%), radial-gradient(circle at 80% 85%, rgba(196,181,253,0.35) 0%, rgba(196,181,253,0) 42%)' }} />
          <div className="shk-avatar-float"><AssistantOrb size={60} /></div>
          <span style={{ position: 'absolute', top: 6, right: 6, width: 14, height: 14, background: '#fb7185', border: '2px solid #fff', borderRadius: '50%', boxShadow: '0 4px 10px rgba(251,113,133,0.45)' }} />
          {/* Ctrl+K hint */}
          <span style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)', fontSize: 7, fontWeight: 700, color: 'rgba(99,102,241,0.7)', whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>⌘K</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: isExpanded ? 0 : 24,
          right: isExpanded ? 0 : 24,
          width: isExpanded ? '100vw' : 380,
          height: isExpanded ? '100vh' : 560,
          background: dark
            ? 'linear-gradient(180deg, rgba(15,23,42,0.97) 0%, rgba(30,41,59,0.95) 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.98) 100%)',
          backdropFilter: 'blur(18px)',
          borderRadius: isExpanded ? 0 : 20,
          boxShadow: '0 24px 64px rgba(15,23,42,0.22)',
          border: `1px solid ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.75)'}`,
          zIndex: 1000,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            background: 'linear-gradient(135deg, #38bdf8 0%, #6366f1 52%, #8b5cf6 100%)',
            color: '#fff',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, background: 'rgba(255,255,255,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <div className="shk-avatar-float"><AssistantOrb size={34} compact /></div>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14 }}>SkyAI</div>
                <div style={{ fontSize: 10, opacity: 0.9 }}>Ops Command Copilot · <span style={{ opacity: 0.75 }}>⌘K to toggle</span></div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {/* Clear history button */}
              <button
                onClick={clearHistory}
                title="Clear chat history"
                style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700 }}
              >
                Clear
              </button>
              <button onClick={() => setIsExpanded(!isExpanded)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}>
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 4 }}>
                <ChevronDown size={20} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: 20,
            display: 'flex', flexDirection: 'column', gap: 16,
            background: dark ? '#0f172a' : '#f8fafc',
          }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                {msg.role === 'model' && (
                  <div style={{ width: 30, height: 30, borderRadius: '50%', overflow: 'hidden', boxShadow: '0 4px 12px rgba(99,102,241,0.25)', flexShrink: 0 }}>
                    <div className="shk-avatar-float"><AssistantOrb size={30} compact /></div>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ position: 'relative' }}>
                    <div style={{
                      padding: '10px 14px',
                      borderRadius: 16,
                      borderTopLeftRadius: msg.role === 'model' ? 4 : 16,
                      borderTopRightRadius: msg.role === 'user' ? 4 : 16,
                      background: msg.role === 'user' ? '#a855f7' : (dark ? '#1e293b' : '#ffffff'),
                      color: msg.role === 'user' ? '#fff' : (msg.isError ? '#ef4444' : (dark ? '#e2e8f0' : '#334155')),
                      fontSize: 13, lineHeight: 1.5,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      border: msg.role === 'model' ? `1px solid ${dark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'}` : 'none',
                      paddingRight: msg.role === 'model' ? 32 : 14,
                    }}>
                      {msg.content}
                    </div>
                    {/* Copy button — only on AI messages */}
                    {msg.role === 'model' && !msg.isError && (
                      <button
                        onClick={() => copyMessage(msg.id, msg.content)}
                        title="Copy message"
                        className="shk-copy-btn"
                        style={{
                          position: 'absolute', top: 8, right: 8,
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: copiedId === msg.id ? '#16a34a' : (dark ? '#475569' : '#94a3b8'),
                          padding: 2, borderRadius: 4,
                          opacity: 0,
                          transition: 'opacity 0.15s, color 0.15s',
                        }}
                      >
                        {copiedId === msg.id ? <Check size={11} /> : <Copy size={11} />}
                      </button>
                    )}
                  </div>

                  {/* Action Data Render */}
                  {msg.actionData && <QuickDataCard actionType={msg.actionType} data={msg.actionData} />}

                  {/* Follow-up chips */}
                  {msg.role === 'model' && !msg.isError && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                      {getFollowups(msg).map((label) => (
                        <button
                          className="shk-follow-chip"
                          key={`${msg.id}-${label}`}
                          type="button"
                          onClick={() => sendMessage(label)}
                          style={{
                            borderRadius: 999,
                            border: `1px solid ${dark ? 'rgba(125,211,252,0.18)' : 'rgba(99,102,241,0.16)'}`,
                            background: dark
                              ? 'linear-gradient(135deg, rgba(56,189,248,0.14) 0%, rgba(99,102,241,0.16) 100%)'
                              : 'linear-gradient(135deg, #eef8ff 0%, #eef2ff 52%, #f6f0ff 100%)',
                            color: dark ? '#dbeafe' : '#3730a3',
                            fontSize: 10.5, fontWeight: 900,
                            padding: '6px 11px', cursor: 'pointer',
                            letterSpacing: '0.01em',
                          }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ minWidth: 16, height: 16, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: dark ? 'rgba(125,211,252,0.12)' : 'rgba(99,102,241,0.1)', color: dark ? '#7dd3fc' : '#4f46e5', fontSize: 9, fontWeight: 900, lineHeight: 1 }}>{getFollowupIcon(label)}</span>
                            {label}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  <div style={{ fontSize: 9, color: dark ? '#475569' : '#94a3b8', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    {msg.timestamp instanceof Date
                      ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {/* Animated typing indicator */}
            {isLoading && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', overflow: 'hidden', boxShadow: '0 4px 12px rgba(99,102,241,0.25)', display: 'grid', placeItems: 'center' }}>
                  <div className="shk-avatar-float"><AssistantOrb size={30} compact /></div>
                </div>
                <div style={{
                  padding: '12px 16px', borderRadius: 16, borderTopLeftRadius: 4,
                  background: dark ? '#1e293b' : '#ffffff',
                  border: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'}`,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <span className="shk-dot shk-dot-1" />
                  <span className="shk-dot shk-dot-2" />
                  <span className="shk-dot shk-dot-3" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions (first open only) */}
          {messages.length === 1 && (
            <div style={{ padding: '0 20px 12px', display: 'flex', gap: 8, overflowX: 'auto', background: dark ? '#0f172a' : '#f8fafc' }}>
              {['Track 200062288484', 'Show negative wallets', 'Pending NDRs'].map(s => (
                <button
                  key={s} onClick={() => sendMessage(s)}
                  style={{
                    padding: '6px 12px', borderRadius: 20, whiteSpace: 'nowrap',
                    background: dark ? 'rgba(255,255,255,0.05)' : '#fff',
                    border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                    color: dark ? '#cbd5e1' : '#475569', fontSize: 11, cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#a855f7'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = dark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}
                >{s}</button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleSubmit} style={{
            padding: 16, background: dark ? '#1e293b' : '#ffffff',
            borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'}`,
            display: 'flex', gap: 12, alignItems: 'flex-end',
          }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
              placeholder="Ask about shipments, NDRs, or rates..."
              style={{
                flex: 1, resize: 'none', height: 44, padding: '12px 16px',
                borderRadius: 22, border: `1px solid ${dark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                background: dark ? 'rgba(0,0,0,0.2)' : '#f8fafc',
                color: dark ? '#fff' : '#0f172a', fontSize: 13, outline: 'none',
                fontFamily: 'inherit', transition: 'border 0.2s',
              }}
              onFocus={e => e.currentTarget.style.borderColor = '#a855f7'}
              onBlur={e => e.currentTarget.style.borderColor = dark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                background: input.trim() && !isLoading ? '#a855f7' : (dark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'),
                color: input.trim() && !isLoading ? '#fff' : (dark ? '#475569' : '#94a3b8'),
                border: 'none', cursor: input.trim() && !isLoading ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
            >
              <Send size={18} className={input.trim() && !isLoading ? 'shk-send-active' : ''} />
            </button>
          </form>
        </div>
      )}

      <style>{`
        .shk-spin { animation: shkSpin 1s linear infinite; }
        @keyframes shkSpin { 100% { transform: rotate(360deg); } }
        .shk-send-active { transform: translateX(2px) translateY(-2px); transition: transform 0.2s; }
        .shk-avatar-float { animation: shkAvatarFloat 3.8s ease-in-out infinite; transform-origin: center; }
        .shk-avatar-eye { animation: shkAvatarBlink 5.2s ease-in-out infinite; transform-origin: center; transform-box: fill-box; }

        /* Typing dots */
        .shk-dot {
          display: inline-block; width: 7px; height: 7px; border-radius: 50%;
          background: #a855f7; opacity: 0.5;
        }
        .shk-dot-1 { animation: shkDotBounce 1.2s ease-in-out infinite; }
        .shk-dot-2 { animation: shkDotBounce 1.2s ease-in-out 0.2s infinite; }
        .shk-dot-3 { animation: shkDotBounce 1.2s ease-in-out 0.4s infinite; }
        @keyframes shkDotBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-6px); opacity: 1; }
        }

        /* Copy button — show on hover of parent bubble */
        .shk-copy-btn { opacity: 0; transition: opacity 0.15s, color 0.15s; }
        div:hover > div > .shk-copy-btn { opacity: 1; }

        .shk-follow-chip {
          transition: transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease;
        }
        .shk-follow-chip:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 18px -14px rgba(79,70,229,0.45);
          border-color: rgba(99,102,241,0.28) !important;
        }
        .shk-follow-chip:active { transform: translateY(0px) scale(0.98); }

        .shk-launcher::before {
          content: ''; position: absolute; inset: -10px; border-radius: 28px;
          background: radial-gradient(circle, rgba(96,165,250,0.18) 0%, rgba(96,165,250,0) 65%);
          animation: shkPulseRing 3.6s ease-out infinite;
        }
        .shk-launcher::after {
          content: ''; position: absolute; inset: 10px; border-radius: 16px;
          background: radial-gradient(circle at 50% 0%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 55%);
          pointer-events: none;
        }

        @keyframes shkAvatarFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-2px) rotate(-1deg); }
        }
        @keyframes shkAvatarBlink {
          0%, 45%, 47%, 100% { transform: scaleY(1); }
          46% { transform: scaleY(0.12); }
        }
        @keyframes shkPulseRing {
          0% { transform: scale(0.92); opacity: 0.28; }
          70% { transform: scale(1.12); opacity: 0; }
          100% { transform: scale(1.12); opacity: 0; }
        }
      `}</style>
    </>
  );
}

function AssistantOrb({ size = 56, compact = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="orbBg" x1="10" y1="6" x2="54" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#B9F2FF" />
          <stop offset="0.4" stopColor="#60A5FA" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="faceGlow" x1="19" y1="18" x2="45" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF8F1" />
          <stop offset="1" stopColor="#FFE4F2" />
        </linearGradient>
        <linearGradient id="visor" x1="22" y1="24" x2="43" y2="35" gradientUnits="userSpaceOnUse">
          <stop stopColor="#312E81" />
          <stop offset="1" stopColor="#6D28D9" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="32" fill="url(#orbBg)" />
      <circle cx="22" cy="17" r="10" fill="white" opacity="0.24" />
      <circle cx="32" cy="31" r="18.5" fill="url(#faceGlow)" />
      <path d="M17 25C18.8 18.2 24.5 13 32 13C37.8 13 43.6 16.1 46.6 21.2C43.2 24.8 38.8 26.8 33 26.8C27.8 26.8 23 25.8 17 25Z" fill="#312E81" />
      <path d="M20.5 27C24.8 29 28.7 29.8 33.2 29.8C37.7 29.8 41.6 28.8 45.2 26.5V38.2C45.2 45 39.6 50.5 32.7 50.5H31.5C24.7 50.5 19.2 45 19.2 38.2V29.4C19.2 28.6 19.7 27.7 20.5 27Z" fill="url(#faceGlow)" />
      <rect x="23" y="27.4" width="18" height="8.8" rx="4.4" fill="url(#visor)" />
      <circle className="shk-avatar-eye" cx="28.8" cy="31.8" r="1.8" fill="#F8FAFC" />
      <circle className="shk-avatar-eye" cx="35.2" cy="31.8" r="1.8" fill="#F8FAFC" />
      <path d="M27.5 40C29.5 42 34.3 42 36.8 39.7" stroke="#EC4899" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="23.5" cy="36.3" r="2.4" fill="#FDA4AF" opacity="0.45" />
      <circle cx="40.8" cy="36.3" r="2.4" fill="#FDA4AF" opacity="0.45" />
      <path d="M17 50.5C21.2 45.4 25.9 42.8 32.2 42.8C38.5 42.8 43.1 45.3 47.2 50.2" stroke="white" strokeOpacity="0.42" strokeWidth={compact ? '2.2' : '2.6'} strokeLinecap="round" />
      <circle cx="49.5" cy="18.5" r="5.3" fill="#38BDF8" />
      <path d="M49.5 14.7V22.3" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M45.7 18.5H53.3" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="50.8" cy="17.2" r="1.2" fill="white" opacity="0.7" />
    </svg>
  );
}
