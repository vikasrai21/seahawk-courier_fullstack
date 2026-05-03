// src/components/ui/EmptyState.jsx — Premium empty state with animated illustrations
export function EmptyState({ icon = '📭', title = 'Nothing here yet', message, action, onAction, variant = 'default' }) {
  const variants = {
    default: { gradient: 'from-amber-50 to-sky-50 dark:from-amber-900/20 dark:to-sky-900/20', border: 'border-amber-100 dark:border-amber-800/30' },
    search: { gradient: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20', border: 'border-blue-100 dark:border-blue-800/30' },
    error: { gradient: 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20', border: 'border-red-100 dark:border-red-800/30' },
    success: { gradient: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20', border: 'border-emerald-100 dark:border-emerald-800/30' },
  };
  const v = variants[variant] || variants.default;

  return (
    <div className="card mx-auto flex max-w-xl flex-col items-center justify-center py-16 px-8 text-center shk-empty-state">
      {/* Animated floating icon */}
      <div className={`shk-empty-icon mb-6 flex h-20 w-20 items-center justify-center rounded-[1.6rem] border ${v.border} bg-gradient-to-br ${v.gradient} text-4xl`}>
        {typeof icon === 'string' ? icon : icon}
      </div>

      {/* Decorative dots */}
      <div className="shk-empty-dots mb-4">
        <span className="shk-dot" style={{ animationDelay: '0s' }} />
        <span className="shk-dot" style={{ animationDelay: '0.15s' }} />
        <span className="shk-dot" style={{ animationDelay: '0.3s' }} />
      </div>

      <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-2 tracking-tight">{title}</h3>
      {message && <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">{message}</p>}
      {action && onAction && (
        <button onClick={onAction} className="mt-6 btn-primary btn-sm pressable shk-empty-action">
          {action}
        </button>
      )}

      <style>{`
        .shk-empty-state {
          animation: shk-empty-reveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .shk-empty-icon {
          animation: shk-empty-float 4s ease-in-out infinite;
          box-shadow: 0 16px 32px rgba(249, 115, 22, 0.06);
        }
        .shk-empty-dots {
          display: flex;
          gap: 6px;
        }
        .shk-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #cbd5e1;
          animation: shk-dot-bounce 1.4s ease-in-out infinite;
        }
        [data-theme="dark"] .shk-dot { background: #475569; }
        .shk-empty-action {
          animation: shk-empty-action-in 0.5s ease 0.3s backwards;
        }
        @keyframes shk-empty-reveal {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shk-empty-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes shk-dot-bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
        @keyframes shk-empty-action-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
