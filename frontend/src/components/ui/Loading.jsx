export function Spinner({ size = 'md' }) {
  const sz = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }[size] || 'w-6 h-6';
  return (
    <div className={`${sz} border-2 border-gray-200 border-t-navy-600 rounded-full animate-spin`} />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Spinner size="lg" />
        <p className="mt-3 text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  );
}

export function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-base font-semibold text-gray-800 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-4">{description}</p>}
      {action}
    </div>
  );
}
