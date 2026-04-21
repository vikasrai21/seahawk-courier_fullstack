import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Bot, Send, Zap, Brain, History, BookOpen, Loader2, CheckCircle, AlertCircle, ArrowRight, Sparkles, Terminal, Clock, TrendingUp, Package, Users, RefreshCw } from 'lucide-react';
import api from '../services/api';

const QUICK_ACTIONS = [
  { label: 'System Overview', msg: 'Show overview', icon: TrendingUp, color: '#3b82f6' },
  { label: 'Daily Report', msg: 'Show daily report', icon: Clock, color: '#f59e0b' },
  { label: 'Pending NDRs', msg: 'Pending NDRs', icon: AlertCircle, color: '#ef4444' },
  { label: 'Wallet Status', msg: 'Wallet status', icon: Package, color: '#10b981' },
  { label: 'Courier Performance', msg: 'Courier performance', icon: TrendingUp, color: '#8b5cf6' },
  { label: 'Top Clients', msg: 'Client analytics', icon: Users, color: '#06b6d4' },
];

function MarkdownRenderer({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let inTable = false;
  let tableRows = [];

  const renderInline = (line) => {
    return line
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code style="background:rgba(99,102,241,0.1);padding:1px 5px;border-radius:4px;font-family:monospace;font-size:11px">$1</code>');
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('## ')) {
      if (inTable) { elements.push(<table key={`t${i}`} style={{ width: '100%', borderCollapse: 'collapse', margin: '8px 0', fontSize: 12 }}><tbody>{tableRows}</tbody></table>); tableRows = []; inTable = false; }
      elements.push(<h3 key={i} style={{ fontSize: 14, fontWeight: 800, margin: '10px 0 6px', color: 'var(--shk-text, #0f172a)' }} dangerouslySetInnerHTML={{ __html: renderInline(line.slice(3)) }} />);
    } else if (line.startsWith('### ')) {
      if (inTable) { elements.push(<table key={`t${i}`} style={{ width: '100%', borderCollapse: 'collapse', margin: '8px 0', fontSize: 12 }}><tbody>{tableRows}</tbody></table>); tableRows = []; inTable = false; }
      elements.push(<h4 key={i} style={{ fontSize: 12, fontWeight: 700, margin: '8px 0 4px', color: 'var(--shk-text-mid, #475569)', textTransform: 'uppercase', letterSpacing: '0.05em' }} dangerouslySetInnerHTML={{ __html: renderInline(line.slice(4)) }} />);
    } else if (line.startsWith('|') && line.includes('|')) {
      const cells = line.split('|').filter(c => c.trim()).map(c => c.trim());
      if (cells.every(c => /^[-:]+$/.test(c))) continue;
      const isHeader = !inTable;
      inTable = true;
      tableRows.push(
        <tr key={`tr${i}`} style={{ borderBottom: '1px solid rgba(148,163,184,0.15)' }}>
          {cells.map((c, ci) => isHeader
            ? <th key={ci} style={{ padding: '6px 8px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--shk-text-dim, #94a3b8)' }} dangerouslySetInnerHTML={{ __html: renderInline(c) }} />
            : <td key={ci} style={{ padding: '6px 8px', fontSize: 12, color: 'var(--shk-text, #0f172a)' }} dangerouslySetInnerHTML={{ __html: renderInline(c) }} />
          )}
        </tr>
      );
    } else if (line.startsWith('• ') || line.startsWith('- ')) {
      if (inTable) { elements.push(<table key={`t${i}`} style={{ width: '100%', borderCollapse: 'collapse', margin: '8px 0', fontSize: 12 }}><tbody>{tableRows}</tbody></table>); tableRows = []; inTable = false; }
      elements.push(<div key={i} style={{ display: 'flex', gap: 6, padding: '2px 0', fontSize: 12, color: 'var(--shk-text-mid, #475569)' }}><span style={{ color: 'var(--shk-orange, #f97316)', fontWeight: 700 }}>›</span><span dangerouslySetInnerHTML={{ __html: renderInline(line.slice(2)) }} /></div>);
    } else if (line.trim()) {
      if (inTable) { elements.push(<table key={`t${i}`} style={{ width: '100%', borderCollapse: 'collapse', margin: '8px 0', fontSize: 12 }}><tbody>{tableRows}</tbody></table>); tableRows = []; inTable = false; }
      elements.push(<p key={i} style={{ fontSize: 12, lineHeight: 1.6, margin: '4px 0', color: 'var(--shk-text-mid, #475569)' }} dangerouslySetInnerHTML={{ __html: renderInline(line) }} />);
    }
  }
  if (inTable && tableRows.length) {
    elements.push(<table key="tf" style={{ width: '100%', borderCollapse: 'collapse', margin: '8px 0', fontSize: 12 }}><tbody>{tableRows}</tbody></table>);
  }
  return <>{elements}</>;
}

export default function OwnerAgentPage({ toast }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [memory, setMemory] = useState(null);
  const [actionHistory, setActionHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('chat');
  const [snapshot, setSnapshot] = useState(null);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    // Load initial snapshot
    api.post('/ops/agent/chat', { message: 'show overview', history: [] })
      .then(res => {
        const d = res.data;
        if (d?.reply) {
          setMessages([{ role: 'assistant', content: d.reply, suggestions: d.suggestions || [], timestamp: new Date() }]);
        }
        if (d?.snapshot) setSnapshot(d.snapshot);
      }).catch(() => {});
  }, []);

  const loadMemory = async () => {
    try {
      const res = await api.get('/ops/agent/memory');
      setMemory(res.data || {});
    } catch { toast?.('Failed to load memory', 'error'); }
  };

  const loadHistory = async () => {
    try {
      const res = await api.get('/ops/agent/history?limit=30');
      setActionHistory(res.data || []);
    } catch { toast?.('Failed to load history', 'error'); }
  };

  const sendMessage = async (text) => {
    if (!text?.trim() || loading) return;
    const userMsg = { role: 'user', content: text.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.slice(-10).map(m => ({ role: m.role, text: m.content }));
      const res = await api.post('/ops/agent/chat', { message: text.trim(), history });
      const data = res.data;
      if (data) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.reply || 'Processing...',
          suggestions: data.suggestions || [],
          requiresConfirmation: data.requiresConfirmation,
          action: data.action,
          actionData: data.actionData,
          timestamp: new Date(),
        }]);
        if (data.snapshot) setSnapshot(data.snapshot);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Something went wrong. Try again.', timestamp: new Date() }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const executeAction = async (action, params) => {
    setLoading(true);
    try {
      const res = await api.post('/ops/agent/execute', { action, params });
      const result = res.data;
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: result?.message || result?.error || '✅ Action completed.',
        timestamp: new Date(),
        suggestions: ['Show overview'],
      }]);
      toast?.(result?.message || 'Action executed', result?.error ? 'error' : 'success');
    } catch (err) {
      toast?.('Execution failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', background: 'var(--shk-bg)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--shk-border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 14,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
          }}>
            <Bot size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--shk-text)', margin: 0, lineHeight: 1.2 }}>HawkAI Enterprise Agent</h1>
            <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--shk-text-dim)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              Owner Command Center • {snapshot ? `${snapshot.activeShipments} active shipments` : 'Loading...'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[{ id: 'chat', label: 'Chat', icon: Terminal }, { id: 'memory', label: 'Memory', icon: Brain }, { id: 'history', label: 'History', icon: History }].map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (tab.id === 'memory') loadMemory(); if (tab.id === 'history') loadHistory(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 700,
                background: activeTab === tab.id ? 'var(--shk-text)' : 'transparent',
                color: activeTab === tab.id ? 'var(--shk-bg)' : 'var(--shk-text-dim)',
                transition: 'all 0.2s',
              }}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'chat' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Quick Actions */}
          <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--shk-border)', display: 'flex', gap: 8, overflowX: 'auto', flexShrink: 0 }}>
            {QUICK_ACTIONS.map((qa) => (
              <button key={qa.label} onClick={() => sendMessage(qa.msg)} disabled={loading}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8,
                  border: '1px solid var(--shk-border)', background: 'var(--shk-surface)', cursor: 'pointer',
                  fontSize: 11, fontWeight: 600, color: 'var(--shk-text-mid)', whiteSpace: 'nowrap',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = qa.color; e.currentTarget.style.color = qa.color; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--shk-border)'; e.currentTarget.style.color = 'var(--shk-text-mid)'; }}
              >
                <qa.icon size={12} style={{ color: qa.color }} /> {qa.label}
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', animation: 'shkFadeInUp 0.3s ease' }}>
                <div style={{
                  maxWidth: msg.role === 'user' ? '70%' : '85%',
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                    : 'var(--shk-surface)',
                  color: msg.role === 'user' ? '#fff' : 'var(--shk-text)',
                  border: msg.role === 'user' ? 'none' : '1px solid var(--shk-border)',
                  boxShadow: msg.role === 'user'
                    ? '0 4px 12px rgba(99,102,241,0.2)'
                    : '0 2px 8px rgba(0,0,0,0.04)',
                }}>
                  {msg.role === 'user' ? (
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, lineHeight: 1.5 }}>{msg.content}</p>
                  ) : (
                    <MarkdownRenderer text={msg.content} />
                  )}

                  {/* Confirmation button */}
                  {msg.requiresConfirmation && (
                    <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                      <button onClick={() => executeAction(msg.action, msg.actionData || msg.action?.params)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
                          background: '#10b981', color: '#fff', border: 'none', cursor: 'pointer',
                          fontSize: 12, fontWeight: 700,
                        }}
                      >
                        <CheckCircle size={14} /> Confirm
                      </button>
                      <button onClick={() => setMessages(prev => [...prev, { role: 'assistant', content: 'Action cancelled.', timestamp: new Date() }])}
                        style={{
                          padding: '8px 16px', borderRadius: 8, background: 'transparent',
                          color: 'var(--shk-text-dim)', border: '1px solid var(--shk-border)', cursor: 'pointer',
                          fontSize: 12, fontWeight: 600,
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {/* Suggestion chips */}
                  {msg.suggestions?.length > 0 && (
                    <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {msg.suggestions.map((s, si) => (
                        <button key={si} onClick={() => sendMessage(s)} disabled={loading}
                          style={{
                            padding: '4px 10px', borderRadius: 6, border: '1px solid var(--shk-border)',
                            background: 'transparent', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                            color: 'var(--shk-text-mid)', transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.borderColor = '#6366f1'; e.currentTarget.style.color = '#6366f1'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--shk-border)'; e.currentTarget.style.color = 'var(--shk-text-mid)'; }}
                        >
                          {s} <ArrowRight size={10} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 16, background: 'var(--shk-surface)', border: '1px solid var(--shk-border)', maxWidth: '60%' }}>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--shk-text-dim)' }}>HawkAI is thinking...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px 24px', borderTop: '1px solid var(--shk-border)', flexShrink: 0, background: 'var(--shk-surface)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="Ask HawkAI anything... (e.g., 'enter shipment for April 18, client ABC, AWB X123, to Mumbai')"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: 12,
                    border: '1px solid var(--shk-border)', background: 'var(--shk-bg)',
                    fontSize: 13, color: 'var(--shk-text)', outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#6366f1'}
                  onBlur={e => e.currentTarget.style.borderColor = 'var(--shk-border)'}
                />
              </div>
              <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()}
                style={{
                  width: 44, height: 44, borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: input.trim() ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'var(--shk-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                  boxShadow: input.trim() ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
                }}
              >
                <Send size={18} color="#fff" />
              </button>
            </div>
            <p style={{ fontSize: 10, color: 'var(--shk-text-dim)', marginTop: 6, textAlign: 'center' }}>
              <Sparkles size={10} style={{ verticalAlign: 'middle' }} /> HawkAI learns from your decisions and applies them automatically over time
            </p>
          </div>
        </div>
      )}

      {activeTab === 'memory' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--shk-text)', margin: 0 }}>Agent Memory</h2>
              <p style={{ fontSize: 12, color: 'var(--shk-text-dim)', margin: '4px 0 0' }}>
                {memory?.totalMemories || 0} patterns learned
              </p>
            </div>
            <button onClick={loadMemory} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--shk-border)', background: 'var(--shk-surface)', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--shk-text-mid)' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>

          {memory?.topCategories?.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
              {memory.topCategories.map((cat, i) => (
                <div key={i} style={{ padding: 16, borderRadius: 14, border: '1px solid var(--shk-border)', background: 'var(--shk-surface)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--shk-text-dim)' }}>{cat.category.replace(/_/g, ' ')}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--shk-text)', marginTop: 4 }}>{cat._count.id}</div>
                  <div style={{ fontSize: 10, color: 'var(--shk-text-dim)' }}>patterns • {cat._sum?.frequency || 0} total uses</div>
                </div>
              ))}
            </div>
          )}

          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--shk-text)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recent Learnings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(memory?.recentLearnings || []).map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--shk-border)', background: 'var(--shk-surface)' }}>
                <Brain size={16} style={{ color: '#8b5cf6', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--shk-text)' }}>
                    When <span style={{ color: '#6366f1', fontWeight: 700 }}>{m.contextKey}</span> → prefer <span style={{ color: '#10b981', fontWeight: 700 }}>{m.decision}</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--shk-text-dim)' }}>
                    {m.category.replace(/_/g, ' ')} • used {m.frequency}x
                  </div>
                </div>
              </div>
            ))}
            {!memory?.recentLearnings?.length && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--shk-text-dim)', fontSize: 13 }}>
                <Brain size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                <p>No memories yet. Start using the agent and it will learn from your decisions.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--shk-text)', margin: 0 }}>Action History</h2>
            <button onClick={loadHistory} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--shk-border)', background: 'var(--shk-surface)', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--shk-text-mid)' }}>
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {actionHistory.map((action, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, border: '1px solid var(--shk-border)', background: 'var(--shk-surface)' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  background: action.status === 'DONE' ? 'rgba(16,185,129,0.1)' : action.status === 'FAILED' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                }}>
                  {action.status === 'DONE' ? <CheckCircle size={16} color="#10b981" /> : action.status === 'FAILED' ? <AlertCircle size={16} color="#ef4444" /> : <Clock size={16} color="#f59e0b" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--shk-text)' }}>{action.actionType?.replace(/_/g, ' ')}</div>
                  <div style={{ fontSize: 10, color: 'var(--shk-text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Confidence: {Math.round((action.confidence || 0) * 100)}% • {new Date(action.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                  background: action.status === 'DONE' ? 'rgba(16,185,129,0.1)' : action.status === 'FAILED' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                  color: action.status === 'DONE' ? '#10b981' : action.status === 'FAILED' ? '#ef4444' : '#f59e0b',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>{action.status}</span>
              </div>
            ))}
            {!actionHistory.length && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--shk-text-dim)', fontSize: 13 }}>
                <History size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                <p>No actions yet. Use the chat to interact with HawkAI.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes shkFadeInUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
