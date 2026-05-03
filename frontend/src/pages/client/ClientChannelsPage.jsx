import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function ClientChannelsPage({ toast }) {
  const [integrations, setIntegrations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ platform: 'SHOPIFY', shopDomain: '', accessToken: '', apiKey: '', apiSecret: '', autoFulfill: false });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { const res = await api.get('/features/integrations/channels'); setIntegrations(res.data || []); } catch (e) { toast?.(e.message, 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const connect = async () => {
    setSaving(true);
    try { await api.post('/features/integrations/channels', form); toast?.('Channel connected!', 'success'); setShowForm(false); load(); }
    catch (e) { toast?.(e.message, 'error'); } finally { setSaving(false); }
  };

  const disconnect = async (id) => {
    if (!confirm('Disconnect this integration?')) return;
    try { await api.delete(`/features/integrations/channels/${id}`); toast?.('Disconnected', 'success'); load(); } catch (e) { toast?.(e.message, 'error'); }
  };

  const platformIcons = { SHOPIFY: '🛍️', WOOCOMMERCE: '🔧', CUSTOM: '⚙️' };

  if (loading) return <div className="client-premium-main"><div className="card animate-pulse h-48" /></div>;

  return (
    <div className="client-premium-main">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Channel Integrations</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Connect Shopify, WooCommerce, or custom platforms to auto-sync orders.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Connect Channel'}</button>
      </div>

      {showForm && (
        <div className="client-premium-card p-5 mb-6 animate-in">
          <h2 className="font-bold text-slate-900 dark:text-white mb-4">Connect New Channel</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">Platform</label>
              <select className="input" value={form.platform} onChange={e => setForm(p => ({ ...p, platform: e.target.value }))}>
                <option value="SHOPIFY">Shopify</option><option value="WOOCOMMERCE">WooCommerce</option><option value="CUSTOM">Custom</option>
              </select>
            </div>
            <div><label className="label">Shop Domain</label><input className="input" placeholder="mystore.myshopify.com" value={form.shopDomain} onChange={e => setForm(p => ({ ...p, shopDomain: e.target.value }))} /></div>
            <div><label className="label">Access Token</label><input className="input" type="password" placeholder="shpat_..." value={form.accessToken} onChange={e => setForm(p => ({ ...p, accessToken: e.target.value }))} /></div>
            <div><label className="label">API Key</label><input className="input" placeholder="API Key" value={form.apiKey} onChange={e => setForm(p => ({ ...p, apiKey: e.target.value }))} /></div>
            <div className="flex items-center gap-2 col-span-full">
              <input type="checkbox" id="autoFulfill" checked={form.autoFulfill} onChange={e => setForm(p => ({ ...p, autoFulfill: e.target.checked }))} />
              <label htmlFor="autoFulfill" className="text-sm text-slate-600 dark:text-slate-300">Auto-fulfill orders when shipped</label>
            </div>
          </div>
          <button className="btn-primary mt-4" onClick={connect} disabled={saving}>{saving ? 'Connecting...' : 'Connect'}</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((int, i) => (
          <div key={int.id} className="client-premium-card p-5 animate-in" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{platformIcons[int.platform] || '🔌'}</span>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">{int.platform}</div>
                  <div className="text-xs text-slate-500">{int.shopDomain || 'Custom endpoint'}</div>
                </div>
              </div>
              <span className={`badge ${int.status === 'ACTIVE' ? 'badge-success' : int.status === 'ERROR' ? 'badge-error' : 'badge-warning'}`}>{int.status}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
              <div>Auto-fulfill: <span className="font-bold">{int.autoFulfill ? 'Yes' : 'No'}</span></div>
              <div>Sync: <span className="font-bold">{int.syncEnabled ? 'Active' : 'Paused'}</span></div>
              {int.lastSyncAt && <div className="col-span-2">Last sync: {new Date(int.lastSyncAt).toLocaleString()}</div>}
            </div>
            <button className="btn-ghost btn-sm text-rose-500 mt-3" onClick={() => disconnect(int.id)}>Disconnect</button>
          </div>
        ))}
        {!integrations.length && <div className="col-span-full text-center text-slate-400 py-12">No integrations connected yet.</div>}
      </div>
    </div>
  );
}
