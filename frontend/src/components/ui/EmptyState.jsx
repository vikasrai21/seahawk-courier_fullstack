// src/components/ui/EmptyState.jsx — Reusable empty state with icon, message, action
export function EmptyState({ icon = '📭', title = 'Nothing here yet', message, action, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-base font-semibold text-gray-700 mb-1">{title}</h3>
      {message && <p className="text-sm text-gray-400 max-w-xs">{message}</p>}
      {action && onAction && (
        <button onClick={onAction} className="mt-4 btn-secondary btn-sm">
          {action}
        </button>
      )}
    </div>
  );
}
