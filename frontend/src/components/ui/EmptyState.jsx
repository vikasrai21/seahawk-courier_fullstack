// src/components/ui/EmptyState.jsx — Reusable empty state with icon, message, action
export function EmptyState({ icon = '📭', title = 'Nothing here yet', message, action, onAction }) {
  return (
    <div className="card mx-auto flex max-w-xl flex-col items-center justify-center py-14 px-6 text-center animate-in">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[1.4rem] border border-amber-100 bg-gradient-to-br from-amber-50 to-sky-50 text-4xl shadow-[0_12px_24px_rgba(249,115,22,0.08)]">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
      {message && <p className="text-sm text-slate-500 max-w-sm leading-relaxed">{message}</p>}
      {action && onAction && (
        <button onClick={onAction} className="mt-6 btn-secondary btn-sm pressable">
          {action}
        </button>
      )}
    </div>
  );
}
