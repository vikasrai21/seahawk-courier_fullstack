import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function ClientDeveloperHubPage({ toast }) {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [keys, setKeys] = useState([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdToken, setCreatedToken] = useState('');
  const [provider, setProvider] = useState('shopify');
  const [settings, setSettings] = useState({
    enabled: false,
    sourceLabel: 'shopify',
    defaultWeightKg: 0.5,
    mappings: {
      referenceId: '',
      consignee: '',
      destination: '',
      phone: '',
      pincode: '',
      weight: '',
    },
    staticValues: { destination: '', pincode: '' },
  });
  const [logs, setLogs] = useState([]);
  const [diagnostics, setDiagnostics] = useState(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const loadKeys = async () => {
    setLoading(true);
    try {
      const res = await api.get('/portal/developer/keys');
      setKeys(res.data?.data || []);
    } catch (err) {
      toast?.(err.message || 'Failed to load developer keys', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadProviderSettings = async (nextProvider) => {
    try {
      const res = await api.get(`/portal/developer/integrations/settings?provider=${encodeURIComponent(nextProvider)}`);
      if (res.data) {
        setSettings((prev) => ({
          ...prev,
          ...res.data,
          mappings: { ...prev.mappings, ...(res.data.mappings || {}) },
          staticValues: { ...prev.staticValues, ...(res.data.staticValues || {}) },
        }));
      }
    } catch (err) {
      toast?.(err.message || 'Failed to load integration settings', 'error');
    }
  };

  const loadLogsAndDiagnostics = async (nextProvider = provider) => {
    try {
      const [l, d] = await Promise.all([
        api.get(`/portal/developer/integrations/logs?provider=${encodeURIComponent(nextProvider)}&limit=25`),
        api.get('/portal/developer/integrations/diagnostics'),
      ]);
      setLogs(l.data || []);
      setDiagnostics(d.data || null);
    } catch (err) {
      toast?.(err.message || 'Failed to load integration diagnostics', 'error');
    }
  };

  useEffect(() => {
    loadKeys();
    loadProviderSettings(provider);
    loadLogsAndDiagnostics(provider);
  }, []);

  const createKey = async (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return toast?.('Key name is required', 'error');
    setCreating(true);
    try {
      const res = await api.post('/portal/developer/keys', { name: newKeyName.trim() });
      const token = res.data?.data?.token || '';
      if (token) {
        setCreatedToken(token);
        toast?.('API key created. Copy it now; it will not be shown again.', 'success');
      } else {
        toast?.('API key created', 'success');
      }
      setNewKeyName('');
      await loadKeys();
    } catch (err) {
      toast?.(err.message || 'Failed to create API key', 'error');
    } finally {
      setCreating(false);
    }
  };

  const revokeKey = async (id) => {
    try {
      await api.delete(`/portal/developer/keys/${id}`);
      toast?.('API key revoked', 'success');
      await loadKeys();
    } catch (err) {
      toast?.(err.message || 'Failed to revoke API key', 'error');
    }
  };

  const copyToken = async () => {
    if (!createdToken) return;
    try {
      await navigator.clipboard.writeText(createdToken);
      toast?.('Token copied', 'success');
    } catch {
      toast?.('Unable to copy token', 'error');
    }
  };

  const saveIntegrationSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const payload = { ...settings, provider };
      await api.post('/portal/developer/integrations/settings', payload);
      toast?.('Integration settings saved', 'success');
      await loadLogsAndDiagnostics(provider);
    } catch (err) {
      toast?.(err.message || 'Failed to save integration settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/portal" className="text-gray-400 hover:text-gray-600">← Portal</Link>
          <span className="font-bold text-gray-900">Developer Hub</span>
        </div>
        <span className="text-xs text-gray-500">API keys and integration bootstrap</span>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Create API Key</h2>
          <p className="text-sm text-gray-600 mb-4">
            Use these keys to push orders to Seahawk integration endpoints from your ERP/Shopify/WooCommerce bridge.
          </p>
          <form onSubmit={createKey} className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="e.g. Shopify Production Key"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
            />
            <button className="btn-primary" type="submit" disabled={creating}>
              {creating ? 'Creating...' : 'Create Key'}
            </button>
          </form>

          {createdToken && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="text-xs font-bold text-amber-800 mb-2">Copy this token now (shown only once)</div>
              <div className="font-mono text-xs break-all text-amber-900">{createdToken}</div>
              <button type="button" className="mt-2 btn-secondary" onClick={copyToken}>Copy Token</button>
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Active Keys</h2>
          {loading ? (
            <div className="text-sm text-gray-500">Loading keys...</div>
          ) : keys.length === 0 ? (
            <div className="text-sm text-gray-500">No API keys created yet.</div>
          ) : (
            <div className="space-y-2">
              {keys.map((k) => (
                <div key={k.id} className="border rounded-lg p-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-sm text-gray-900">{k.name}</div>
                    <div className="text-xs text-gray-500">Created {new Date(k.createdAt).toLocaleString()}</div>
                  </div>
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => revokeKey(k.id)}
                  >
                    Revoke
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Integration Quickstart</h2>
          <div className="text-sm text-gray-700 space-y-2">
            <div>1. Create API key above and store it in your server secrets manager.</div>
            <div>2. Push orders to <code>/api/public/integrations/excel/import</code> with <code>x-api-key</code> header.</div>
            <div>3. Use Draft Queue in portal for staged orders and autonomous AWB binding in scanner flow.</div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Shopify / WooCommerce Bridge</h2>
          <p className="text-sm text-gray-600 mb-4">Configure mapping once and send order webhooks directly into Draft Queue.</p>
          <form onSubmit={saveIntegrationSettings} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <select
                className="input"
                value={provider}
                onChange={(e) => {
                  const p = e.target.value;
                  setProvider(p);
                  loadProviderSettings(p);
                  loadLogsAndDiagnostics(p);
                }}
              >
                <option value="shopify">Shopify</option>
                <option value="woocommerce">WooCommerce</option>
              </select>
              <input className="input" value={settings.sourceLabel || ''} onChange={(e) => setSettings((s) => ({ ...s, sourceLabel: e.target.value }))} placeholder="Source label" />
              <input type="number" step="0.1" className="input" value={settings.defaultWeightKg || 0.5} onChange={(e) => setSettings((s) => ({ ...s, defaultWeightKg: Number(e.target.value || 0.5) }))} placeholder="Default weight kg" />
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!settings.enabled} onChange={(e) => setSettings((s) => ({ ...s, enabled: e.target.checked }))} />
              Enable {provider} ingestion
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input className="input" value={settings.mappings?.referenceId || ''} onChange={(e) => setSettings((s) => ({ ...s, mappings: { ...s.mappings, referenceId: e.target.value } }))} placeholder="Mapping: order id path (e.g. order_number)" />
              <input className="input" value={settings.mappings?.consignee || ''} onChange={(e) => setSettings((s) => ({ ...s, mappings: { ...s.mappings, consignee: e.target.value } }))} placeholder="Mapping: consignee path" />
              <input className="input" value={settings.mappings?.destination || ''} onChange={(e) => setSettings((s) => ({ ...s, mappings: { ...s.mappings, destination: e.target.value } }))} placeholder="Mapping: destination path" />
              <input className="input" value={settings.mappings?.phone || ''} onChange={(e) => setSettings((s) => ({ ...s, mappings: { ...s.mappings, phone: e.target.value } }))} placeholder="Mapping: phone path" />
              <input className="input" value={settings.mappings?.pincode || ''} onChange={(e) => setSettings((s) => ({ ...s, mappings: { ...s.mappings, pincode: e.target.value } }))} placeholder="Mapping: pincode path" />
              <input className="input" value={settings.mappings?.weight || ''} onChange={(e) => setSettings((s) => ({ ...s, mappings: { ...s.mappings, weight: e.target.value } }))} placeholder="Mapping: weight path" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input className="input" value={settings.staticValues?.destination || ''} onChange={(e) => setSettings((s) => ({ ...s, staticValues: { ...s.staticValues, destination: e.target.value } }))} placeholder="Fallback destination" />
              <input className="input" value={settings.staticValues?.pincode || ''} onChange={(e) => setSettings((s) => ({ ...s, staticValues: { ...s.staticValues, pincode: e.target.value } }))} placeholder="Fallback pincode" />
            </div>
            <div className="text-xs text-gray-600">
              Webhook URL: <code>/api/public/integrations/ecommerce/{provider}/YOUR_CLIENT_CODE</code> (use any active API key in <code>x-api-key</code> header).
            </div>
            <button className="btn-primary" disabled={savingSettings}>{savingSettings ? 'Saving...' : 'Save Integration Settings'}</button>
          </form>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Integration Diagnostics</h2>
          {!diagnostics ? (
            <div className="text-sm text-gray-500">Loading diagnostics...</div>
          ) : (
            <div className="text-sm text-gray-700 space-y-2">
              <div>Active API keys: <strong>{diagnostics.activeKeys}</strong></div>
              <div>Webhook totals: <strong>{diagnostics.webhookStats?.total || 0}</strong> · Created: <strong>{diagnostics.webhookStats?.created || 0}</strong> · Duplicate: <strong>{diagnostics.webhookStats?.duplicate || 0}</strong> · Failed: <strong>{diagnostics.webhookStats?.failed || 0}</strong></div>
              <div>Tips: {(diagnostics.tips || []).join(' | ')}</div>
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Webhook Logs ({provider})</h2>
          {logs.length === 0 ? (
            <div className="text-sm text-gray-500">No webhook logs yet.</div>
          ) : (
            <div className="space-y-2">
              {logs.map((row) => (
                <div key={row.id} className="border rounded-lg p-3 text-xs">
                  <div className="font-semibold text-gray-900">{row.action}</div>
                  <div className="text-gray-500">{row.entityId} · {new Date(row.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

