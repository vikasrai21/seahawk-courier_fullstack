import { useEffect, useState } from 'react';
import api from '../services/api';

export default function OnboardingAdminPage({ toast }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { const res = await api.get('/features/onboarding/applications'); setApps(res.data?.applications || []); }
    catch (e) { toast?.(e.message, 'error'); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const approve = async (id) => {
    try {
      const res = await api.post(`/features/onboarding/${id}/approve`);
      toast?.(`Approved! Client code: ${res.data?.clientCode}. Temp password: ${res.data?.tempPassword}`, 'success');
      load();
    } catch (e) { toast?.(e.message, 'error'); }
  };

  const reject = async (id) => {
    const notes = prompt('Rejection reason:');
    if (!notes) return;
    try { await api.post(`/features/onboarding/${id}/reject`, { reviewNotes: notes }); toast?.('Application rejected', 'success'); load(); }
    catch (e) { toast?.(e.message, 'error'); }
  };

  if (loading) return <div className="page-shell"><div className="card animate-pulse h-64" /></div>;

  const statusColor = { PENDING: 'badge-warning', UNDER_REVIEW: 'badge-info', APPROVED: 'badge-success', REJECTED: 'badge-error' };

  return (
    <div className="page-shell">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Client Onboarding</h1>
          <p className="text-sm text-slate-500 mt-1">Review and approve self-serve client applications.</p>
        </div>
        <div className="flex gap-2 text-sm">
          <span className="badge badge-warning">{apps.filter(a => a.status === 'PENDING').length} Pending</span>
          <span className="badge badge-success">{apps.filter(a => a.status === 'APPROVED').length} Approved</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
        {apps.map((a, i) => (
          <div key={a.id} className="card animate-in" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-lg">{a.companyName}</div>
                <div className="text-xs text-slate-500 mt-0.5">{a.contactName}</div>
              </div>
              <span className={`badge ${statusColor[a.status] || 'badge-warning'}`}>{a.status}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-1 text-xs text-slate-500">
              <div>📧 {a.email}</div>
              <div>📱 {a.phone}</div>
              {a.businessType && <div>🏢 {a.businessType}</div>}
              {a.monthlyVolume && <div>📦 {a.monthlyVolume}/mo</div>}
              {a.gst && <div className="col-span-2">GST: {a.gst}</div>}
              {a.city && <div>📍 {a.city}, {a.state}</div>}
              {a.website && <div>🌐 {a.website}</div>}
            </div>
            {a.clientCode && <div className="mt-3 text-xs font-mono font-bold text-emerald-600">→ {a.clientCode}</div>}
            {a.reviewNotes && <div className="mt-2 text-xs text-rose-500 bg-rose-50 dark:bg-rose-900/20 p-2 rounded-lg">{a.reviewNotes}</div>}
            <div className="text-[10px] text-slate-400 mt-3">Applied {new Date(a.createdAt).toLocaleDateString()}</div>

            {a.status === 'PENDING' && (
              <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button className="btn-primary btn-sm flex-1" onClick={() => approve(a.id)}>✓ Approve</button>
                <button className="btn-ghost btn-sm flex-1 text-rose-500" onClick={() => reject(a.id)}>✗ Reject</button>
              </div>
            )}
          </div>
        ))}
        {!apps.length && <div className="col-span-full text-center text-slate-400 py-12">No applications yet. Share /onboarding with potential clients.</div>}
      </div>
    </div>
  );
}
