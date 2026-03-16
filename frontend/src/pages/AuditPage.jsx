import { useState } from 'react';
import api from '../services/api';
import { PageLoader, EmptyState } from '../components/ui/Loading';
import { useFetch } from '../hooks/useFetch';

const ACTION_COLORS = {
  CREATE: 'badge-green', UPDATE: 'badge-blue', DELETE: 'badge-red',
  LOGIN: 'badge-gray', STATUS_CHANGE: 'badge-yellow', BULK_IMPORT: 'badge-blue',
};

export default function AuditPage() {
  const { data, loading } = useFetch('/audit?limit=100');
  const logs = data || [];

  return (
    <div className="p-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-sm text-gray-500 mt-0.5">Track all user actions for accountability</p>
      </div>

      {loading ? <PageLoader /> : logs.length === 0 ? (
        <EmptyState icon="📋" title="No audit logs yet" />
      ) : (
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr><th>Time</th><th>User</th><th>Action</th><th>Entity</th><th>ID</th><th>Details</th></tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
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
