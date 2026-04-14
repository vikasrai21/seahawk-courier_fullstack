export function FetchErrorState({
  title = 'Could not load data',
  error,
  onRetry,
  compact = false,
}) {
  const message = error?.message || error || 'Request failed.';
  const incidentId = error?.incidentId;

  return (
    <div
      className={`rounded-xl border border-red-200 bg-red-50 text-red-800 ${compact ? 'p-3 text-xs' : 'p-4 text-sm'}`}
      role="alert"
    >
      <div className="font-semibold">{title}</div>
      <div className="mt-1">{message}</div>
      {incidentId && <div className="mt-1 font-mono text-[11px] text-red-700/90">Incident ID: {incidentId}</div>}
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary mt-3">
          Retry
        </button>
      )}
    </div>
  );
}

