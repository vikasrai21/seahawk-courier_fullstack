import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function ClientGovernancePage({ toast }) {
  const [loading, setLoading] = useState(true);
  const [diagnostics, setDiagnostics] = useState(null);
  const [evidence, setEvidence] = useState(null);
  const [approvals, setApprovals] = useState([]);
  const [requesting, setRequesting] = useState(false);
  const [deciding, setDeciding] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [d, e, a] = await Promise.all([
        api.get('/portal/developer/diagnostics?limit=100'),
        api.get('/audit/evidence-pack'),
        api.get('/portal/developer/approvals?limit=60'),
      ]);
      setDiagnostics(d.data || null);
      setEvidence(e.data || null);
      setApprovals(a.data || []);
    } catch (err) {
      toast?.(err.message || 'Failed to load governance data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const requestApproval = async () => {
    setRequesting(true);
    try {
      const res = await api.post('/portal/developer/approvals', {
        approvalAction: 'RETENTION_POLICY_CHANGE',
        reason: 'Retention policy updated from governance dashboard',
        payload: { source: 'client-governance-ui' },
      });
      toast?.(res.message || 'Approval request submitted', 'success');
      await load();
    } catch (err) {
      toast?.(err.message || 'Failed to submit approval request', 'error');
    } finally {
      setRequesting(false);
    }
  };

  const decide = async (requestNo, decision) => {
    setDeciding(requestNo);
    try {
      const res = await api.post(`/portal/developer/approvals/${encodeURIComponent(requestNo)}/decide`, { decision });
      toast?.(res.message || `Request ${decision.toLowerCase()}`, 'success');
      await load();
    } catch (err) {
      toast?.(err.message || 'Decision failed', 'error');
    } finally {
      setDeciding(null);
    }
  };

  return (
    <div className="min-h-full">
      <main className="client-premium-main">
        {loading ? (
          <div className="text-sm text-slate-500 dark:text-slate-400">Loading governance dashboards...</div>
        ) : (
          <>
            <section className="client-premium-card p-5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Account Governance</h2>
              <div className="grid md:grid-cols-3 gap-3 text-sm">
                <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg p-3">
                  <div className="text-slate-500 dark:text-slate-400">Maker-checker Coverage</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">Enabled</div>
                </div>
                <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg p-3">
                  <div className="text-slate-500 dark:text-slate-400">Integration Keys</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">{diagnostics?.keys?.length || 0}</div>
                </div>
                <div className="border border-slate-200 dark:border-slate-700/60 rounded-lg p-3">
                  <div className="text-slate-500 dark:text-slate-400">Dead-letter Events</div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">{diagnostics?.deadLetters?.length || 0}</div>
                </div>
              </div>
              <div className="mt-3">
                <button className="btn-secondary btn-sm" onClick={requestApproval} disabled={requesting}>
                  {requesting ? 'Submitting...' : 'Request Governance Approval'}
                </button>
              </div>
            </section>

            <section className="client-premium-card p-5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Compliance Evidence Pack</h2>
              {!evidence ? (
                <div className="text-sm text-slate-500 dark:text-slate-400">No evidence data available.</div>
              ) : (
                <div className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
                  <div>Generated: <strong>{new Date(evidence.generatedAt).toLocaleString()}</strong></div>
                  <div>Window: <strong>{new Date(evidence.window?.from).toLocaleString()}</strong> → <strong>{new Date(evidence.window?.to).toLocaleString()}</strong></div>
                  <div>Audit records: <strong>{evidence.metrics?.auditRecords || 0}</strong> · Failed webhooks: <strong>{evidence.metrics?.failedWebhookEvents || 0}</strong></div>
                  <div>Failed jobs: <strong>{evidence.metrics?.failedBackgroundJobs || 0}</strong> · Failed notifications: <strong>{evidence.metrics?.failedNotifications || 0}</strong></div>
                  <div className="font-mono text-xs bg-slate-50 dark:bg-[#0a1228] border border-slate-200 dark:border-slate-700/60 rounded p-2 break-all text-slate-700 dark:text-slate-300">Checksum: {evidence.checksum}</div>
                </div>
              )}
            </section>

            <section className="client-premium-card p-5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Immutable Audit Trail</h2>
              {(diagnostics?.events || []).length === 0 ? (
                <div className="text-sm text-slate-500 dark:text-slate-400">No audit events found.</div>
              ) : (
                <div className="space-y-2">
                  {diagnostics.events.slice(0, 20).map((e) => (
                    <div key={e.id} className="border border-slate-200 dark:border-slate-700/60 rounded-lg p-3 text-xs">
                      <div className="font-semibold text-slate-900 dark:text-white">{e.action}</div>
                      <div className="text-slate-500 dark:text-slate-400">{e.entityId} · {new Date(e.createdAt).toLocaleString()} · requestId: {e.newValue?.requestId || 'n/a'}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="client-premium-card p-5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Maker-Checker Approvals</h2>
              {approvals.length === 0 ? (
                <div className="text-sm text-slate-500 dark:text-slate-400">No approval requests yet.</div>
              ) : (
                <div className="space-y-2">
                  {approvals.map((a) => {
                    const requestNo = String(a.entityId || '').split(':').slice(1).join(':');
                    const status = a.action === 'APPROVAL_DECIDED' ? (a.newValue?.decision || 'DECIDED') : 'PENDING';
                    return (
                      <div key={a.id} className="border border-slate-200 dark:border-slate-700/60 rounded-lg p-3 text-xs">
                        <div className="font-semibold text-slate-900 dark:text-white">{requestNo || a.entityId}</div>
                        <div className="text-slate-500 dark:text-slate-400">{a.newValue?.approvalAction || a.newValue?.requestNo || 'approval'} · {status} · by {a.userEmail || 'system'}</div>
                        {a.action === 'APPROVAL_REQUESTED' && (
                          <div className="mt-2 flex gap-2">
                            <button className="btn-secondary btn-sm" onClick={() => decide(requestNo, 'APPROVED')} disabled={deciding === requestNo}>Approve</button>
                            <button className="btn-secondary btn-sm text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30" onClick={() => decide(requestNo, 'REJECTED')} disabled={deciding === requestNo}>Reject</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
