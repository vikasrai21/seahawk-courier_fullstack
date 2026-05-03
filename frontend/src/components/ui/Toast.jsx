// src/components/ui/Toast.jsx — Premium toast notification system
import { useState, useCallback, createContext, useContext } from 'react';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: { Icon: CheckCircle2, color: '#059669', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
  error: { Icon: XCircle, color: '#dc2626', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
  warning: { Icon: AlertCircle, color: '#d97706', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
  info: { Icon: Info, color: '#2563eb', bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)' },
};

let toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type, duration }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
  }, []);

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="shk-toast-container" role="alert" aria-live="polite">
        {toasts.map(t => {
          const { Icon, color, bg, border } = ICONS[t.type] || ICONS.info;
          return (
            <div
              key={t.id}
              className={`shk-toast ${t.exiting ? 'shk-toast--exit' : 'shk-toast--enter'}`}
              style={{ background: bg, borderColor: border }}
            >
              <Icon size={16} color={color} className="flex-shrink-0" />
              <span className="shk-toast-msg">{t.message}</span>
              <button onClick={() => removeToast(t.id)} className="shk-toast-close">
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>
      <style>{`
        .shk-toast-container {
          position: fixed; top: 16px; right: 16px; z-index: 99999;
          display: flex; flex-direction: column; gap: 8px;
          max-width: 380px; pointer-events: none;
        }
        .shk-toast {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 16px; border-radius: 14px; border: 1px solid;
          background: var(--shk-surface, white);
          box-shadow: 0 12px 40px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.05);
          backdrop-filter: blur(12px); pointer-events: auto; min-width: 260px;
        }
        .shk-toast--enter { animation: shk-toast-in 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards; }
        .shk-toast--exit { animation: shk-toast-out 0.25s ease forwards; }
        .shk-toast-msg {
          flex: 1; font-size: 13px; font-weight: 600;
          color: var(--shk-text, #0f172a); line-height: 1.4;
        }
        .shk-toast-close {
          padding: 4px; border-radius: 6px; color: var(--shk-text-dim, #94a3b8);
          transition: all 0.15s; flex-shrink: 0; background: none; border: none; cursor: pointer;
        }
        .shk-toast-close:hover { background: rgba(0,0,0,0.05); color: var(--shk-text,#0f172a); }
        @keyframes shk-toast-in {
          from { opacity: 0; transform: translateX(40px) scale(0.95); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes shk-toast-out {
          from { opacity: 1; transform: translateX(0) scale(1); }
          to { opacity: 0; transform: translateX(40px) scale(0.95); }
        }
        [data-theme="dark"] .shk-toast {
          background: rgba(13,20,37,0.95);
          box-shadow: 0 12px 40px rgba(0,0,0,0.4), 0 0 1px rgba(99,130,191,0.1);
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      success: (msg) => console.log('[Toast]', msg),
      error: (msg) => console.error('[Toast]', msg),
      warning: (msg) => console.warn('[Toast]', msg),
      info: (msg) => console.info('[Toast]', msg),
    };
  }
  return ctx;
}
