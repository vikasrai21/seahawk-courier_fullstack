import { PageLoader, EmptyState } from '../components/ui/Loading';
import { useFetch } from '../hooks/useFetch';
import { PageHeader } from '../components/ui/PageHeader';
import { Shield } from 'lucide-react';

const ACTION_COLORS = {
  CREATE: 'badge-green', UPDATE: 'badge-blue', DELETE: 'badge-rose',
  LOGIN: 'badge-gray', STATUS_CHANGE: 'badge-amber', BULK_IMPORT: 'badge-blue',
};

export default function AuditPage() {
  const { data, loading } = useFetch('/audit?limit=100');
  const logs = data?.data || data || [];

  return (
    <div className="p-6">
      <PageHeader
        title="Audit Logs"
        subtitle="Track user and system actions with cleaner visibility into who changed what and when."
        icon={Shield}
      />

      {loading ? <PageLoader /> : logs.length === 0 ? (
        <EmptyState icon="📋" title="No audit logs yet" />
      ) : (
        <div className="table-shell">
          <table className="tbl">
            <thead className="table-head">
              <tr><th>Time</th><th>User</th><th>Action</th><th>Entity</th><th>ID</th><th>Details</th></tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="table-row">
                  <td className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(l.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="text-xs font-medium">{l.user?.name || l.userEmail || 'System'}</td>
                  <td>
                    <span className={`badge text-[10px] ${ACTION_COLORS[l.action] || 'badge-gray'}`}>
                      {l.action}
                    </span>
                  </td>
                  <td className="text-xs font-semibold">{l.entity}</td>
                  <td className="text-xs font-mono text-gray-500">{l.entityId || '—'}</td>
                  <td className="text-xs text-gray-500 max-w-[200px] truncate">
                    {l.newValue ? JSON.stringify(l.newValue).slice(0, 80) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
