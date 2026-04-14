import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function ClientDeveloperHubPage({ toast }) {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [keys, setKeys] = useState([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdToken, setCreatedToken] = useState('');
  const PROVIDERS = ['amazon', 'flipkart', 'myntra', 'ajio', 'custom', 'tally', 'sap', 'netsuite'];
  const SCOPE_OPTIONS = ['orders:create', 'webhooks:read', 'webhooks:replay', 'events:read', 'sandbox:write'];
  const [provider, setProvider] = useState('amazon');
  const [mode, setMode] = useState('live');
  const [scopes, setScopes] = useState(['orders:create']);
  const [updatingPolicyId, setUpdatingPolicyId] = useState(null);
  const [eventInspector, setEventInspector] = useState([]);
  const [deadLetters, setDeadLetters] = useState([]);
  const [replayPayload, setReplayPayload] = useState('{\n  "order_number": "AMZ-ORDER-1001",\n  "shipping_address": {\n    "name": "Test User",\n    "city": "Delhi",\n    "phone": "9999999999",\n    "zip": "110001"\n  },\n  "weight": 0.6\n}');
  const [replayIdempotencyKey, setReplayIdempotencyKey] = useState('');
  const [replaying, setReplaying] = useState(false);
  const [settings, setSettings] = useState({
    enabled: false,
    sourceLabel: 'amazon',
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
  const [connectorTestPath, setConnectorTestPath] = useState('/');
  const [connectorTesting, setConnectorTesting] = useState(false);
  const [connectorTestResult, setConnectorTestResult] = useState(null);

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
      const [l, d, ev, dlq] = await Promise.all([
        api.get(`/portal/developer/integrations/logs?provider=${encodeURIComponent(nextProvider)}&limit=25`),
        api.get('/portal/developer/integrations/diagnostics'),
        api.get('/portal/developer/integrations/events?limit=80'),
        api.get('/portal/developer/integrations/dead-letters?limit=40'),
      ]);
      setLogs(l.data || []);
      setDiagnostics(d.data || null);
      setEventInspector(ev.data || []);
      setDeadLetters(dlq.data || []);
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
      const res = await api.post('/portal/developer/keys', {
        name: newKeyName.trim(),
        mode,
        scopes,
      });
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

  const updateKeyPolicy = async (keyId, next) => {
    setUpdatingPolicyId(keyId);
    try {
      await api.patch(`/portal/developer/keys/${keyId}/policy`, next);
      toast?.('Key policy updated', 'success');
      await loadKeys();
      await loadLogsAndDiagnostics(provider);
    } catch (err) {
      toast?.(err.message || 'Failed to update key policy', 'error');
    } finally {
      setUpdatingPolicyId(null);
    }
  };

  const replayWebhook = async () => {
    setReplaying(true);
    try {
      const parsed = JSON.parse(replayPayload);
      const res = await api.post('/portal/developer/integrations/replay', {
        provider,
        payload: parsed,
        idempotencyKey: replayIdempotencyKey || undefined,
      });
      toast?.(res.message || 'Replay submitted', 'success');
      await loadLogsAndDiagnostics(provider);
    } catch (err) {
      toast?.(err.message || 'Replay failed', 'error');
    } finally {
      setReplaying(false);
    }
  };

  const toggleScope = (scope) => {
    setScopes((prev) => {
      if (prev.includes(scope)) return prev.filter((s) => s !== scope);
      return [...prev, scope];
    });
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

  const retryDeadLetter = async (id) => {
    try {
      const res = await api.post(`/portal/developer/integrations/dead-letters/${id}/retry`, {
        idempotencyKey: replayIdempotencyKey || undefined,
      });
      toast?.(res.message || 'Dead-letter retried', 'success');
      await loadLogsAndDiagnostics(provider);
    } catch (err) {
      toast?.(err.message || 'Dead-letter retry failed', 'error');
    }
  };

  const testConnector = async () => {
    setConnectorTesting(true);
    setConnectorTestResult(null);
    try {
      const res = await api.post(`/portal/developer/integrations/connectors/${provider}/test`, {
        path: connectorTestPath || '/',
      });
      setConnectorTestResult(res.data || null);
      toast?.(res.message || 'Connector probe succeeded', 'success');
    } catch (err) {
      toast?.(err.message || 'Connector probe failed', 'error');
    } finally {
      setConnectorTesting(false);
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
            Use these keys to push orders to Seahawk integration endpoints from your ERP or marketplace bridge.
          </p>
          <form onSubmit={createKey} className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="e.g. Amazon Marketplace Key"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
            />
            <button className="btn-primary" type="submit" disabled={creating}>
              {creating ? 'Creating...' : 'Create Key'}
            </button>
          </form>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="text-xs font-bold text-gray-700 mb-2">Key Mode</div>
              <div className="flex gap-2">
                {['live', 'sandbox'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border ${mode === m ? 'border-orange-300 bg-orange-50 text-orange-700' : 'border-gray-200 bg-white text-gray-600'}`}
                    onClick={() => setMode(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 p-3">
              <div className="text-xs font-bold text-gray-700 mb-2">Key Scopes</div>
              <div className="flex flex-wrap gap-2">
                {SCOPE_OPTIONS.map((scope) => (
                  <label key={scope} className="inline-flex items-center gap-1 text-xs border rounded-full px-2 py-1">
                    <input type="checkbox" checked={scopes.includes(scope)} onChange={() => toggleScope(scope)} />
                    <span>{scope}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

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
                    <div className="text-xs text-gray-500 mt-1">
                      Mode: <strong>{k.mode || 'live'}</strong> · Scopes: <strong>{(k.scopes || []).join(', ') || 'orders:create'}</strong>
                    </div>
                    <div className="mt-2 flex gap-2 flex-wrap">
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={updatingPolicyId === k.id}
                        onClick={() => updateKeyPolicy(k.id, { mode: 'live', scopes: k.scopes || ['orders:create'] })}
                      >
                        Set Live
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={updatingPolicyId === k.id}
                        onClick={() => updateKeyPolicy(k.id, { mode: 'sandbox', scopes: k.scopes || ['orders:create'] })}
                      >
                        Set Sandbox
                      </button>
                    </div>
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
            <div>2. Push orders to <code>/api/public/integrations/ecommerce/:provider/:clientCode</code> with <code>x-api-key</code> header.</div>
            <div>3. Use Draft Queue in portal for staged orders and autonomous AWB binding in scanner flow.</div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Marketplace / OMS Bridge</h2>
          <p className="text-sm text-gray-600 mb-4">Configure mapping once and send Amazon/Flipkart/Myntra/Ajio (or custom OMS) webhooks directly into Draft Queue.</p>
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
                {PROVIDERS.map((p) => (
                  <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>
                ))}
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
            <div className="rounded-lg border border-gray-200 p-3 space-y-2">
              <div className="text-xs font-bold text-gray-700">External Connector (Amazon/Flipkart/Myntra/Ajio/ERP pull+ack)</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input className="input" value={settings.connector?.baseUrl || ''} onChange={(e) => setSettings((s) => ({ ...s, connector: { ...(s.connector || {}), baseUrl: e.target.value } }))} placeholder="Connector base URL (e.g. https://partner.example.com)" />
                <select className="input" value={settings.connector?.authType || 'none'} onChange={(e) => setSettings((s) => ({ ...s, connector: { ...(s.connector || {}), authType: e.target.value } }))}>
                  <option value="none">No Auth</option>
                  <option value="api_key">API Key Header</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="basic">Basic Auth</option>
                </select>
                <input className="input" value={settings.connector?.orderPullPath || ''} onChange={(e) => setSettings((s) => ({ ...s, connector: { ...(s.connector || {}), orderPullPath: e.target.value } }))} placeholder="Order pull path (e.g. /api/orders/pending)" />
                <input className="input" value={settings.connector?.orderAckPath || ''} onChange={(e) => setSettings((s) => ({ ...s, connector: { ...(s.connector || {}), orderAckPath: e.target.value } }))} placeholder="Order ACK path (e.g. /api/orders/ack)" />
                <input className="input" value={settings.connector?.credentials?.headerName || ''} onChange={(e) => setSettings((s) => ({ ...s, connector: { ...(s.connector || {}), credentials: { ...(s.connector?.credentials || {}), headerName: e.target.value } } }))} placeholder="Auth header name (x-api-key)" />
                <input className="input" value={settings.connector?.credentials?.apiKey || ''} onChange={(e) => setSettings((s) => ({ ...s, connector: { ...(s.connector || {}), credentials: { ...(s.connector?.credentials || {}), apiKey: e.target.value } } }))} placeholder="API key (will be masked on reload)" />
                <input className="input" value={settings.connector?.credentials?.token || ''} onChange={(e) => setSettings((s) => ({ ...s, connector: { ...(s.connector || {}), credentials: { ...(s.connector?.credentials || {}), token: e.target.value } } }))} placeholder="Bearer token (will be masked on reload)" />
                <input className="input" value={settings.connector?.credentials?.username || ''} onChange={(e) => setSettings((s) => ({ ...s, connector: { ...(s.connector || {}), credentials: { ...(s.connector?.credentials || {}), username: e.target.value } } }))} placeholder="Basic auth username" />
                <input className="input" type="password" value={settings.connector?.credentials?.password || ''} onChange={(e) => setSettings((s) => ({ ...s, connector: { ...(s.connector || {}), credentials: { ...(s.connector?.credentials || {}), password: e.target.value } } }))} placeholder="Basic auth password (will be masked on reload)" />
                <input className="input" type="number" value={settings.connector?.timeoutMs || 10000} onChange={(e) => setSettings((s) => ({ ...s, connector: { ...(s.connector || {}), timeoutMs: Number(e.target.value || 10000) } }))} placeholder="Timeout ms" />
                <input className="input" type="number" value={settings.connector?.retryAttempts || 3} onChange={(e) => setSettings((s) => ({ ...s, connector: { ...(s.connector || {}), retryAttempts: Number(e.target.value || 3) } }))} placeholder="Retry attempts" />
              </div>
              <label className="inline-flex items-center gap-2 text-xs text-gray-700">
                <input type="checkbox" checked={!!settings.connector?.enabled} onChange={(e) => setSettings((s) => ({ ...s, connector: { ...(s.connector || {}), enabled: e.target.checked } }))} />
                Enable external connector
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input className="input md:col-span-2" value={connectorTestPath} onChange={(e) => setConnectorTestPath(e.target.value)} placeholder="Probe path (default /)" />
                <button type="button" className="btn-secondary" onClick={testConnector} disabled={connectorTesting}>
                  {connectorTesting ? 'Testing...' : 'Test Connector'}
                </button>
              </div>
              {connectorTestResult ? (
                <div className="text-xs rounded border border-gray-200 bg-gray-50 p-2">
                  Probe OK · status <strong>{connectorTestResult.status}</strong> · target <code>{connectorTestResult.target}</code>
                  {connectorTestResult.preview ? <div className="mt-1 text-gray-600 break-all">{connectorTestResult.preview}</div> : null}
                </div>
              ) : null}
            </div>
            <div className="text-xs text-gray-600">
              Webhook URL: <code>/api/public/integrations/ecommerce/{provider}/YOUR_CLIENT_CODE</code> (use any active API key in <code>x-api-key</code> header).
            </div>
            <div className="text-xs text-gray-600">
              Recommended headers: <code>x-api-key</code> and <code>Idempotency-Key</code>.
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
              <div>Dead-letter queue: <strong>{diagnostics.deadLetters || 0}</strong> · Sandbox accepted: <strong>{diagnostics.sandboxAccepted || 0}</strong></div>
              <div>Tips: {(diagnostics.tips || []).join(' | ')}</div>
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Webhook Replay</h2>
          <div className="grid gap-2">
            <input
              className="input"
              value={replayIdempotencyKey}
              onChange={(e) => setReplayIdempotencyKey(e.target.value)}
              placeholder="Optional Idempotency-Key"
            />
            <textarea
              className="input min-h-[140px] font-mono text-xs"
              value={replayPayload}
              onChange={(e) => setReplayPayload(e.target.value)}
            />
            <button className="btn-primary" type="button" onClick={replayWebhook} disabled={replaying}>
              {replaying ? 'Replaying...' : 'Replay Event'}
            </button>
          </div>
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

        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Dead-letter Queue</h2>
          {deadLetters.length === 0 ? (
            <div className="text-sm text-gray-500">No dead-letter events.</div>
          ) : (
            <div className="space-y-2">
              {deadLetters.map((row) => (
                <div key={row.id} className="border rounded-lg p-3 text-xs">
                  <div className="font-semibold text-gray-900">{row.payload?.provider || 'provider'} · {row.error || row.payload?.reason || 'unknown error'}</div>
                  <div className="text-gray-500">{new Date(row.createdAt).toLocaleString()} · requestId: {row.payload?.requestId || 'n/a'}</div>
                  <div className="mt-2">
                    <button type="button" className="btn-secondary" onClick={() => retryDeadLetter(row.id)}>Retry Dead-letter</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Live Event Inspector</h2>
          {eventInspector.length === 0 ? (
            <div className="text-sm text-gray-500">No events found.</div>
          ) : (
            <div className="space-y-2">
              {eventInspector.map((row) => (
                <div key={row.id} className="border rounded-lg p-3 text-xs">
                  <div className="font-semibold text-gray-900">{row.action}</div>
                  <div className="text-gray-500">{row.entityId} · {new Date(row.createdAt).toLocaleString()}</div>
                  {row.newValue?.requestId ? <div className="text-gray-500">requestId: {row.newValue.requestId}</div> : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

