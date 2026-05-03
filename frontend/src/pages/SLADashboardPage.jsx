import { useEffect, useState } from 'react';
import api from '../services/api';

export default function SLADashboardPage({ toast }) {
  const [rules, setRules] = useState([]);
  const [breaches, setBreaches] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', courier: '', maxDays: 5, warningDays: 4, notifyEmail: true, notifyWhatsapp: false, escalateTo: '' });
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  const load = async () => {
    try { const res = await api.get('/features/sla/rules'); setRules(res.data || []); } catch (e) { toast?.(e.message, 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    try { await api.post('/features/sla/rules', form); toast?.('Rule saved', 'success'); setShowForm(false); load(); }
    catch (e) { toast?.(e.message, 'error'); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this SLA rule?')) return;
    try { await api.delete(`/features/sla/rules/${id}`); toast?.('Deleted', 'success'); load(); } catch (e) { toast?.(e.message, 'error'); }
  };

  const checkNow = async () => {
    setChecking(true);
    try { const res = await api.post('/features/sla/check'); setBreaches(res.data); toast?.(`Checked ${res.data?.checked} rules, found ${res.data?.breaches} breaches`, res.data?.breaches > 0 ? 'warning' : 'success'); }
    catch (e) { toast?.(e.message, 'error'); } finally { setChecking(false); }
  };

  if (loading) return <div className="page-shell"><div className="card animate-pulse h-64" /></div>;

  return (
    <div className="page-shell">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">SLA Monitoring</h1>
          <p className="text-sm text-slate-500 mt-1">Configure delivery SLA rules and receive automatic breach alerts.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={checkNow} disabled={checking}>{checking ? '⏳ Checking...' : '🔍 Check Now'}</button>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Add Rule'}</button>
        </div>
      </div>

      {breaches && (
        <div className={`card mt-4 animate-in ${breaches.breaches > 0 ? 'border-l-4 border-l-rose-500' : 'border-l-4 border-l-emerald-500'}`}>
          <div className="flex justify-between items-center">
            <div>
              <span className="text-lg font-black">{breaches.breaches > 0 ? '⚠️' : '✅'} {breaches.breaches} breach{breaches.breaches !== 1 ? 'es' : ''} found</span>
              <span className="text-sm text-slate-500 ml-2">({breaches.checked} rules checked)</span>
            </div>
          </div>
          {breaches.details?.length > 0 && (
            <div className="table-shell mt-3">
              <table className="tbl"><thead><tr>
                <th className="table-head">AWB</th><th className="table-head">Client</th><th className="table-head">Courier</th>
                <th className="table-head">Days</th><th className="table-head">Max</th><th className="table-head">Severity</th>
              </tr></thead><tbody>
                {breaches.details.slice(0, 20).map((b, i) => (
                  <tr key={i} className="table-row">
                    <td className="px-4 py-2 text-sm font-mono font-bold">{b.awb}</td>
                    <td className="px-4 py-2 text-sm">{b.clientCode}</td>
                    <td className="px-4 py-2 text-sm">{b.courier}</td>
                    <td className="px-4 py-2 text-sm font-bold text-rose-600">{b.days}d</td>
                    <td className="px-4 py-2 text-sm">{b.maxDays}d</td>
                    <td className="px-4 py-2"><span className={`badge ${b.severity === 'BREACH' ? 'badge-error' : 'badge-warning'}`}>{b.severity}</span></td>
                  </tr>
                ))}
              </tbody></table>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="card mt-4 animate-in">
          <h2 className="font-bold text-slate-900 dark:text-white mb-4">New SLA Rule</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><label className="label">Rule Name</label><input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Metro Delivery SLA" /></div>
            <div><label className="label">Courier (blank = all)</label><input className="input" value={form.courier} onChange={e => setForm(p => ({ ...p, courier: e.target.value }))} placeholder="Delhivery" /></div>
            <div><label className="label">Max Days</label><input className="input" type="number" value={form.maxDays} onChange={e => setForm(p => ({ ...p, maxDays: Number(e.target.value) }))} /></div>
            <div><label className="label">Warning Days</label><input className="input" type="number" value={form.warningDays} onChange={e => setForm(p => ({ ...p, warningDays: Number(e.target.value) }))} /></div>
            <div><label className="label">Escalation Email</label><input className="input" value={form.escalateTo} onChange={e => setForm(p => ({ ...p, escalateTo: e.target.value }))} placeholder="ops@company.com" /></div>
            <div className="flex items-center gap-4 pt-6">
              <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={form.notifyEmail} onChange={e => setForm(p => ({ ...p, notifyEmail: e.target.checked }))} /> Email</label>
              <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={form.notifyWhatsapp} onChange={e => setForm(p => ({ ...p, notifyWhatsapp: e.target.checked }))} /> WhatsApp</label>
            </div>
          </div>
          <button className="btn-primary mt-4" onClick={save}>Save Rule</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
        {rules.map((rule, i) => (
          <div key={rule.id} className={`card animate-in ${!rule.active ? 'opacity-50' : ''}`} style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex justify-between items-start">
              <div className="font-bold text-slate-900 dark:text-white">{rule.name}</div>
              <span className={`badge ${rule.active ? 'badge-success' : 'badge-warning'}`}>{rule.active ? 'Active' : 'Disabled'}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-1 text-xs text-slate-500">
              <div>Courier: <span className="font-bold">{rule.courier || 'All'}</span></div>
              <div>Max: <span className="font-bold text-rose-600">{rule.maxDays} days</span></div>
              <div>Warning: <span className="font-bold text-amber-600">{rule.warningDays} days</span></div>
              <div>Alerts: {[rule.notifyEmail && '📧', rule.notifyWhatsapp && '📱'].filter(Boolean).join(' ') || 'None'}</div>
            </div>
            {rule.escalateTo && <div className="text-[10px] text-slate-400 mt-2">→ {rule.escalateTo}</div>}
            <button className="btn-ghost btn-sm text-rose-500 mt-3" onClick={() => remove(rule.id)}>Delete</button>
          </div>
        ))}
        {!rules.length && <div className="col-span-full text-center text-slate-400 py-12">No SLA rules configured yet.</div>}
      </div>
    </div>
  );
}
