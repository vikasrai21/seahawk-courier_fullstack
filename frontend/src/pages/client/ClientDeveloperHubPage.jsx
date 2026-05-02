import { useEffect, useState } from "react";
import api from "../../services/api";

export default function ClientDeveloperHubPage({ toast }) {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [keys, setKeys] = useState([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdToken, setCreatedToken] = useState("");
  const PROVIDERS = [
    "amazon",
    "flipkart",
    "myntra",
    "ajio",
    "custom",
    "tally",
    "sap",
    "netsuite",
  ];
  const SCOPE_OPTIONS = [
    "orders:create",
    "webhooks:read",
    "webhooks:replay",
    "events:read",
    "sandbox:write",
  ];
  const [provider, setProvider] = useState("amazon");
  const [mode, setMode] = useState("live");
  const [scopes, setScopes] = useState(["orders:create"]);
  const [updatingPolicyId, setUpdatingPolicyId] = useState(null);
  const [rotatingKeyId, setRotatingKeyId] = useState(null);
  const [eventInspector, setEventInspector] = useState([]);
  const [deadLetters, setDeadLetters] = useState([]);
  const [replayPayload, setReplayPayload] = useState(
    '{\n  "order_number": "AMZ-ORDER-1001",\n  "shipping_address": {\n    "name": "Test User",\n    "city": "Delhi",\n    "phone": "9999999999",\n    "zip": "110001"\n  },\n  "weight": 0.6\n}',
  );
  const [replayIdempotencyKey, setReplayIdempotencyKey] = useState("");
  const [replaying, setReplaying] = useState(false);
  const [operationKeyId, setOperationKeyId] = useState("");
  const [settings, setSettings] = useState({
    enabled: false,
    sourceLabel: "amazon",
    defaultWeightKg: 0.5,
    mappings: {
      referenceId: "",
      consignee: "",
      destination: "",
      phone: "",
      pincode: "",
      weight: "",
    },
    staticValues: { destination: "", pincode: "" },
  });
  const [logs, setLogs] = useState([]);
  const [diagnostics, setDiagnostics] = useState(null);
  const [pullRuns, setPullRuns] = useState({ summary: null, rows: [] });
  const [savingSettings, setSavingSettings] = useState(false);
  const [connectorTestPath, setConnectorTestPath] = useState("/");
  const [connectorTesting, setConnectorTesting] = useState(false);
  const [connectorPulling, setConnectorPulling] = useState(false);
  const [connectorTestResult, setConnectorTestResult] = useState(null);

  const [webhooks, setWebhooks] = useState([]);
  const [supportedEvents, setSupportedEvents] = useState([]);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookEvents, setNewWebhookEvents] = useState([
    "shipment.delivered",
  ]);
  const [newWebhookDesc, setNewWebhookDesc] = useState("");
  const [creatingWebhook, setCreatingWebhook] = useState(false);
  const [webhookTestId, setWebhookTestId] = useState(null);
  const loadKeys = async () => {
    setLoading(true);
    try {
      const res = await api.get("/portal/developer/keys");
      setKeys(res.data || []);
    } catch (err) {
      toast?.(err.message || "Failed to load developer keys", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadWebhooks = async () => {
    try {
      const res = await api.get("/portal/developer/webhooks");
      setWebhooks(res.data || []);
      const evRes = await api.get("/portal/developer/webhook-events");
      setSupportedEvents(evRes.data?.events || []);
    } catch (err) {
      toast?.(err.message || "Failed to load webhooks", "error");
    }
  };

  const loadProviderSettings = async (nextProvider) => {
    try {
      const res = await api.get(
        `/portal/developer/integrations/settings?provider=${encodeURIComponent(nextProvider)}`,
      );
      if (res.data) {
        setSettings((prev) => ({
          ...prev,
          ...res.data,
          mappings: { ...prev.mappings, ...(res.data.mappings || {}) },
          staticValues: {
            ...prev.staticValues,
            ...(res.data.staticValues || {}),
          },
        }));
      }
    } catch (err) {
      toast?.(err.message || "Failed to load integration settings", "error");
    }
  };

  const loadLogsAndDiagnostics = async (
    nextProvider = provider,
    keyId = operationKeyId,
  ) => {
    try {
      const results = await Promise.allSettled([
        api.get(
          `/portal/developer/integrations/logs?provider=${encodeURIComponent(nextProvider)}&limit=25${keyId ? `&keyId=${encodeURIComponent(keyId)}` : ""}`,
        ),
        api.get("/portal/developer/integrations/diagnostics"),
        api.get(
          `/portal/developer/integrations/events?limit=80${keyId ? `&keyId=${encodeURIComponent(keyId)}` : ""}`,
        ),
        api.get(
          `/portal/developer/integrations/dead-letters?limit=40${keyId ? `&keyId=${encodeURIComponent(keyId)}` : ""}`,
        ),
        api.get(
          `/portal/developer/integrations/pull-runs?provider=${encodeURIComponent(nextProvider)}&limit=20${keyId ? `&keyId=${encodeURIComponent(keyId)}` : ""}`,
        ),
      ]);
      const [l, d, ev, dlq, pr] = results;
      setLogs(l.status === "fulfilled" ? l.value.data || [] : []);
      setDiagnostics(d.status === "fulfilled" ? d.value.data || null : null);
      setEventInspector(ev.status === "fulfilled" ? ev.value.data || [] : []);
      setDeadLetters(dlq.status === "fulfilled" ? dlq.value.data || [] : []);
      setPullRuns(
        pr.status === "fulfilled"
          ? pr.value.data || { summary: null, rows: [] }
          : { summary: null, rows: [] },
      );
    } catch (err) {
      // Promise.allSettled will rarely throw, but catch unexpected errors silently.
      console.warn("Diagnostics degrade: ", err);
    }
  };

  useEffect(() => {
    loadKeys();
    loadWebhooks();
    loadProviderSettings(provider);
    loadLogsAndDiagnostics(provider);
  }, []);

  const createKey = async (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return toast?.("Key name is required", "error");
    setCreating(true);
    try {
      const res = await api.post("/portal/developer/keys", {
        name: newKeyName.trim(),
        mode,
        scopes,
      });
      const token = res.data?.token || "";
      if (token) {
        setCreatedToken(token);
        toast?.(
          "API key created. Copy it now; it will not be shown again.",
          "success",
        );
      } else {
        toast?.("API key created", "success");
      }
      setNewKeyName("");
      await loadKeys();
    } catch (err) {
      toast?.(err.message || "Failed to create API key", "error");
    } finally {
      setCreating(false);
    }
  };

  const createWebhook = async (e) => {
    e.preventDefault();
    if (!newWebhookUrl.trim())
      return toast?.("Webhook URL is required", "error");
    if (
      !newWebhookUrl.startsWith("https://") &&
      !newWebhookUrl.startsWith("http://")
    ) {
      return toast?.(
        "Webhook URL must start with http:// or https://",
        "error",
      );
    }
    setCreatingWebhook(true);
    try {
      const res = await api.post("/portal/developer/webhooks", {
        url: newWebhookUrl.trim(),
        events: newWebhookEvents,
        description: newWebhookDesc.trim(),
      });
      toast?.("Webhook created. Secret: " + res.data?.secret, "success");
      setNewWebhookUrl("");
      setNewWebhookDesc("");
      await loadWebhooks();
    } catch (err) {
      toast?.(err.message || "Failed to create webhook", "error");
    } finally {
      setCreatingWebhook(false);
    }
  };

  const deleteWebhook = async (id) => {
    if (!window.confirm("Are you sure you want to delete this webhook?"))
      return;
    try {
      await api.delete(`/portal/developer/webhooks/${id}`);
      toast?.("Webhook deleted", "success");
      await loadWebhooks();
    } catch (err) {
      toast?.(err.message || "Failed to delete webhook", "error");
    }
  };

  const testWebhook = async (id) => {
    setWebhookTestId(id);
    try {
      const res = await api.post(`/portal/developer/webhooks/${id}/test`);
      toast?.(res.message || "Test webhook delivered", "success");
      await loadWebhooks();
    } catch (err) {
      toast?.(err.message || "Test webhook failed", "error");
    } finally {
      setWebhookTestId(null);
    }
  };

  const toggleWebhookEvent = (ev) => {
    setNewWebhookEvents((prev) =>
      prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev],
    );
  };

  const updateKeyPolicy = async (keyId, next) => {
    setUpdatingPolicyId(keyId);
    try {
      await api.patch(`/portal/developer/keys/${keyId}/policy`, next);
      toast?.("Key policy updated", "success");
      await loadKeys();
      await loadLogsAndDiagnostics(provider);
    } catch (err) {
      toast?.(err.message || "Failed to update key policy", "error");
    } finally {
      setUpdatingPolicyId(null);
    }
  };

  const replayWebhook = async () => {
    setReplaying(true);
    try {
      const parsed = JSON.parse(replayPayload);
      const res = await api.post("/portal/developer/integrations/replay", {
        provider,
        payload: parsed,
        idempotencyKey: replayIdempotencyKey || undefined,
        keyId: operationKeyId || undefined,
      });
      toast?.(res.message || "Replay submitted", "success");
      await loadLogsAndDiagnostics(provider);
    } catch (err) {
      toast?.(err.message || "Replay failed", "error");
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
      toast?.("API key revoked", "success");
      await loadKeys();
    } catch (err) {
      toast?.(err.message || "Failed to revoke API key", "error");
    }
  };

  const rotateKey = async (id) => {
    setRotatingKeyId(id);
    try {
      const res = await api.post(`/portal/developer/keys/${id}/rotate`);
      const token = res.data?.token || "";
      if (token) {
        setCreatedToken(token);
        toast?.("API key rotated. Copy the new token now.", "success");
      } else {
        toast?.("API key rotated", "success");
      }
      await loadKeys();
      await loadLogsAndDiagnostics(provider);
    } catch (err) {
      toast?.(err.message || "Failed to rotate API key", "error");
    } finally {
      setRotatingKeyId(null);
    }
  };

  const copyToken = async () => {
    if (!createdToken) return;
    try {
      await navigator.clipboard.writeText(createdToken);
      toast?.("Token copied", "success");
    } catch {
      toast?.("Unable to copy token", "error");
    }
  };

  const saveIntegrationSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const payload = { ...settings, provider };
      await api.post("/portal/developer/integrations/settings", payload);
      toast?.("Integration settings saved", "success");
      await loadLogsAndDiagnostics(provider);
    } catch (err) {
      toast?.(err.message || "Failed to save integration settings", "error");
    } finally {
      setSavingSettings(false);
    }
  };

  const retryDeadLetter = async (id) => {
    try {
      const res = await api.post(
        `/portal/developer/integrations/dead-letters/${id}/retry`,
        {
          idempotencyKey: replayIdempotencyKey || undefined,
          keyId: operationKeyId || undefined,
        },
      );
      toast?.(res.message || "Dead-letter retried", "success");
      await loadLogsAndDiagnostics(provider);
    } catch (err) {
      toast?.(err.message || "Dead-letter retry failed", "error");
    }
  };

  const testConnector = async () => {
    setConnectorTesting(true);
    setConnectorTestResult(null);
    try {
      const res = await api.post(
        `/portal/developer/integrations/connectors/${provider}/test`,
        {
          path: connectorTestPath || "/",
        },
      );
      setConnectorTestResult(res.data || null);
      toast?.(res.message || "Connector probe succeeded", "success");
    } catch (err) {
      toast?.(err.message || "Connector probe failed", "error");
    } finally {
      setConnectorTesting(false);
    }
  };

  const runConnectorPull = async () => {
    setConnectorPulling(true);
    try {
      const res = await api.post(
        `/portal/developer/integrations/connectors/${provider}/pull`,
        {
          keyId: operationKeyId || undefined,
        },
      );
      const payload = res.data || {};
      toast?.(
        `Connector pull complete · pulled ${payload.pulled || 0}, created ${payload.created || 0}, duplicate ${payload.duplicate || 0}, failed ${payload.failed || 0}`,
        "success",
      );
      await loadLogsAndDiagnostics(provider);
    } catch (err) {
      toast?.(err.message || "Connector pull failed", "error");
    } finally {
      setConnectorPulling(false);
    }
  };

  return (
    <div className="min-h-full">
      <main className="client-premium-main max-w-6xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Manage client API keys, connector settings, webhook replays, and integration diagnostics from one engineering workspace.</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">This hub is where your technical team can provision access, inspect event flows, replay payloads, and validate connector health without leaving the portal.</p>
        </div>
      </div>
        <section className="client-premium-card p-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Create API Key
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
            Use these keys to push orders to Seahawk integration endpoints from
            your ERP or marketplace bridge.
          </p>
          <form onSubmit={createKey} className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="e.g. Amazon Marketplace Key"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
            />
            <button className="btn-primary" type="submit" disabled={creating}>
              {creating ? "Creating..." : "Create Key"}
            </button>
          </form>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg border border-slate-200 dark:border-slate-700/60 p-3">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Key Mode
              </div>
              <div className="flex gap-2">
                {["live", "sandbox"].map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border ${mode === m ? "border-orange-300 bg-orange-50 text-orange-700" : "border-slate-200 dark:border-slate-700/60 bg-white text-slate-600 dark:text-slate-300"}`}
                    onClick={() => setMode(m)}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700/60 p-3">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Key Scopes
              </div>
              <div className="flex flex-wrap gap-2">
                {SCOPE_OPTIONS.map((scope) => (
                  <label
                    key={scope}
                    className="inline-flex items-center gap-1 text-xs border rounded-full px-2 py-1"
                  >
                    <input
                      type="checkbox"
                      checked={scopes.includes(scope)}
                      onChange={() => toggleScope(scope)}
                    />
                    <span>{scope}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {createdToken && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="text-xs font-bold text-amber-800 mb-2">
                Copy this token now (shown only once)
              </div>
              <div className="font-mono text-xs break-all text-amber-900">
                {createdToken}
              </div>
              <button
                type="button"
                className="mt-2 btn-secondary"
                onClick={copyToken}
              >
                Copy Token
              </button>
            </div>
          )}
        </section>

        <section className="client-premium-card p-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
            Active Keys
          </h2>
          {loading ? (
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Loading keys...
            </div>
          ) : keys.length === 0 ? (
            <div className="text-sm text-slate-500 dark:text-slate-400">
              No API keys created yet.
            </div>
          ) : (
            <div className="space-y-2">
              {keys.map((k) => (
                <div
                  key={k.id}
                  className="border rounded-lg p-3 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold text-sm text-slate-900 dark:text-white">
                      {k.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Created {new Date(k.createdAt).toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Mode: <strong>{k.mode || "live"}</strong> · Scopes:{" "}
                      <strong>
                        {(k.scopes || []).join(", ") || "orders:create"}
                      </strong>
                    </div>
                    <div className="mt-2 flex gap-2 flex-wrap">
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={rotatingKeyId === k.id}
                        onClick={() => rotateKey(k.id)}
                      >
                        {rotatingKeyId === k.id ? "Rotating..." : "Rotate Key"}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={updatingPolicyId === k.id}
                        onClick={() =>
                          updateKeyPolicy(k.id, {
                            mode: "live",
                            scopes: k.scopes || ["orders:create"],
                          })
                        }
                      >
                        Set Live
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={updatingPolicyId === k.id}
                        onClick={() =>
                          updateKeyPolicy(k.id, {
                            mode: "sandbox",
                            scopes: k.scopes || ["orders:create"],
                          })
                        }
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

        <section className="client-premium-card p-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Outbound Webhooks
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
            Receive real-time HTTP POST callbacks when your shipments change
            status. Webhooks are signed with HMAC-SHA256 for security.
          </p>

          <form
            onSubmit={createWebhook}
            className="space-y-3 mb-6 bg-slate-50 dark:bg-[#0a1228] p-4 rounded-lg border border-slate-200 dark:border-slate-700/60"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                className="input"
                placeholder="Endpoint URL (https://...)"
                value={newWebhookUrl}
                onChange={(e) => setNewWebhookUrl(e.target.value)}
              />
              <input
                className="input"
                placeholder="Description (e.g. Prod WMS)"
                value={newWebhookDesc}
                onChange={(e) => setNewWebhookDesc(e.target.value)}
              />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Subscribe to Events
              </div>
              <div className="flex flex-wrap gap-2">
                {supportedEvents.length === 0 && (
                  <span className="text-xs text-slate-500">
                    Loading events...
                  </span>
                )}
                {supportedEvents.map((ev) => (
                  <label
                    key={ev}
                    className="inline-flex items-center gap-1 text-xs border rounded-full px-2 py-1 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={newWebhookEvents.includes(ev)}
                      onChange={() => toggleWebhookEvent(ev)}
                    />
                    <span>{ev}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="pt-2">
              <button
                className="btn-primary w-full md:w-auto"
                type="submit"
                disabled={creatingWebhook}
              >
                {creatingWebhook ? "Creating..." : "Register Webhook"}
              </button>
            </div>
          </form>

          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
            Active Endpoints
          </h3>
          {webhooks.length === 0 ? (
            <div className="text-sm text-slate-500 dark:text-slate-400">
              No webhooks registered.
            </div>
          ) : (
            <div className="space-y-3">
              {webhooks.map((wh) => (
                <div
                  key={wh.id}
                  className="border rounded-lg p-4 bg-white dark:bg-[#040814] flex flex-col md:flex-row gap-4 justify-between items-start"
                >
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className={`w-2 h-2 rounded-full ${wh.active ? (wh.failCount > 0 ? "bg-amber-400" : "bg-emerald-500") : "bg-rose-500"}`}
                      />
                      <div className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                        {wh.description || "Webhook"}
                      </div>
                    </div>
                    <div className="font-mono text-xs text-slate-600 dark:text-slate-400 truncate mb-2">
                      {wh.url}
                    </div>

                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 flex flex-wrap gap-x-3 gap-y-1">
                      <span>
                        Created: {new Date(wh.createdAt).toLocaleDateString()}
                      </span>
                      {wh.lastDelivery && (
                        <span>
                          Last delivery:{" "}
                          {new Date(wh.lastDelivery).toLocaleString()}
                        </span>
                      )}
                      {wh.failCount > 0 && (
                        <span className="text-rose-500 font-medium">
                          Failed: {wh.failCount} consecutive
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {wh.events.map((ev) => (
                        <span
                          key={ev}
                          className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        >
                          {ev}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto mt-2 md:mt-0">
                    <button
                      type="button"
                      className="btn-secondary w-full text-center justify-center text-xs py-1"
                      disabled={webhookTestId === wh.id}
                      onClick={() => testWebhook(wh.id)}
                    >
                      {webhookTestId === wh.id ? "Sending..." : "Send Test"}
                    </button>
                    <button
                      type="button"
                      className="btn-danger w-full text-center justify-center text-xs py-1"
                      onClick={() => deleteWebhook(wh.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="client-premium-card p-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Integration Quickstart
          </h2>
          <div className="mb-3">
            <label className="text-xs text-slate-600 dark:text-slate-300 block mb-1">
              Operations Key (for logs/events/replay scope checks)
            </label>
            <select
              className="input"
              value={operationKeyId}
              onChange={(e) => {
                const selected = e.target.value;
                setOperationKeyId(selected);
                loadLogsAndDiagnostics(provider, selected);
              }}
            >
              <option value="">Auto select eligible key</option>
              {keys.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name} ({k.mode || "live"}) · {(k.scopes || []).join(", ")}
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
            <div>
              1. Create API key above and store it in your server secrets
              manager.
            </div>
            <div>
              2. Push orders to{" "}
              <code>
                /api/public/integrations/ecommerce/:provider/:clientCode
              </code>{" "}
              with <code>x-api-key</code> header.
            </div>
            <div>
              3. Use Draft Queue in portal for staged orders and autonomous AWB
              binding in scanner flow.
            </div>
          </div>
        </section>

        <section className="client-premium-card p-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Marketplace / OMS Bridge
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
            Configure mapping once and send Amazon/Flipkart/Myntra/Ajio (or
            custom OMS) webhooks directly into Draft Queue.
          </p>
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
                  <option key={p} value={p}>
                    {p[0].toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
              <input
                className="input"
                value={settings.sourceLabel || ""}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, sourceLabel: e.target.value }))
                }
                placeholder="Source label"
              />
              <input
                type="number"
                step="0.1"
                className="input"
                value={settings.defaultWeightKg || 0.5}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    defaultWeightKg: Number(e.target.value || 0.5),
                  }))
                }
                placeholder="Default weight kg"
              />
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!settings.enabled}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, enabled: e.target.checked }))
                }
              />
              Enable {provider} ingestion
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                className="input"
                value={settings.mappings?.referenceId || ""}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    mappings: { ...s.mappings, referenceId: e.target.value },
                  }))
                }
                placeholder="Mapping: order id path (e.g. order_number)"
              />
              <input
                className="input"
                value={settings.mappings?.consignee || ""}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    mappings: { ...s.mappings, consignee: e.target.value },
                  }))
                }
                placeholder="Mapping: consignee path"
              />
              <input
                className="input"
                value={settings.mappings?.destination || ""}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    mappings: { ...s.mappings, destination: e.target.value },
                  }))
                }
                placeholder="Mapping: destination path"
              />
              <input
                className="input"
                value={settings.mappings?.phone || ""}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    mappings: { ...s.mappings, phone: e.target.value },
                  }))
                }
                placeholder="Mapping: phone path"
              />
              <input
                className="input"
                value={settings.mappings?.pincode || ""}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    mappings: { ...s.mappings, pincode: e.target.value },
                  }))
                }
                placeholder="Mapping: pincode path"
              />
              <input
                className="input"
                value={settings.mappings?.weight || ""}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    mappings: { ...s.mappings, weight: e.target.value },
                  }))
                }
                placeholder="Mapping: weight path"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input
                className="input"
                value={settings.staticValues?.destination || ""}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    staticValues: {
                      ...s.staticValues,
                      destination: e.target.value,
                    },
                  }))
                }
                placeholder="Fallback destination"
              />
              <input
                className="input"
                value={settings.staticValues?.pincode || ""}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    staticValues: {
                      ...s.staticValues,
                      pincode: e.target.value,
                    },
                  }))
                }
                placeholder="Fallback pincode"
              />
            </div>
            <div className="rounded-lg border border-slate-200 dark:border-slate-700/60 p-3 space-y-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                External Connector (Amazon/Flipkart/Myntra/Ajio/ERP pull+ack)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  className="input"
                  value={settings.connector?.baseUrl || ""}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      connector: {
                        ...(s.connector || {}),
                        baseUrl: e.target.value,
                      },
                    }))
                  }
                  placeholder="Connector base URL (e.g. https://partner.example.com)"
                />
                <select
                  className="input"
                  value={settings.connector?.authType || "none"}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      connector: {
                        ...(s.connector || {}),
                        authType: e.target.value,
                      },
                    }))
                  }
                >
                  <option value="none">No Auth</option>
                  <option value="api_key">API Key Header</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="basic">Basic Auth</option>
                </select>
                <input
                  className="input"
                  value={settings.connector?.orderPullPath || ""}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      connector: {
                        ...(s.connector || {}),
                        orderPullPath: e.target.value,
                      },
                    }))
                  }
                  placeholder="Order pull path (e.g. /api/orders/pending)"
                />
                <input
                  className="input"
                  value={settings.connector?.orderAckPath || ""}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      connector: {
                        ...(s.connector || {}),
                        orderAckPath: e.target.value,
                      },
                    }))
                  }
                  placeholder="Order ACK path (e.g. /api/orders/ack)"
                />
                <input
                  className="input"
                  value={settings.connector?.credentials?.headerName || ""}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      connector: {
                        ...(s.connector || {}),
                        credentials: {
                          ...(s.connector?.credentials || {}),
                          headerName: e.target.value,
                        },
                      },
                    }))
                  }
                  placeholder="Auth header name (x-api-key)"
                />
                <input
                  className="input"
                  value={settings.connector?.credentials?.apiKey || ""}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      connector: {
                        ...(s.connector || {}),
                        credentials: {
                          ...(s.connector?.credentials || {}),
                          apiKey: e.target.value,
                        },
                      },
                    }))
                  }
                  placeholder="API key (will be masked on reload)"
                />
                <input
                  className="input"
                  value={settings.connector?.credentials?.token || ""}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      connector: {
                        ...(s.connector || {}),
                        credentials: {
                          ...(s.connector?.credentials || {}),
                          token: e.target.value,
                        },
                      },
                    }))
                  }
                  placeholder="Bearer token (will be masked on reload)"
                />
                <input
                  className="input"
                  value={settings.connector?.credentials?.username || ""}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      connector: {
                        ...(s.connector || {}),
                        credentials: {
                          ...(s.connector?.credentials || {}),
                          username: e.target.value,
                        },
                      },
                    }))
                  }
                  placeholder="Basic auth username"
                />
                <input
                  className="input"
                  type="password"
                  value={settings.connector?.credentials?.password || ""}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      connector: {
                        ...(s.connector || {}),
                        credentials: {
                          ...(s.connector?.credentials || {}),
                          password: e.target.value,
                        },
                      },
                    }))
                  }
                  placeholder="Basic auth password (will be masked on reload)"
                />
                <input
                  className="input"
                  type="number"
                  value={settings.connector?.timeoutMs || 10000}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      connector: {
                        ...(s.connector || {}),
                        timeoutMs: Number(e.target.value || 10000),
                      },
                    }))
                  }
                  placeholder="Timeout ms"
                />
                <input
                  className="input"
                  type="number"
                  value={settings.connector?.retryAttempts || 3}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      connector: {
                        ...(s.connector || {}),
                        retryAttempts: Number(e.target.value || 3),
                      },
                    }))
                  }
                  placeholder="Retry attempts"
                />
              </div>
              <label className="inline-flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={!!settings.connector?.enabled}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      connector: {
                        ...(s.connector || {}),
                        enabled: e.target.checked,
                      },
                    }))
                  }
                />
                Enable external connector
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input
                  className="input md:col-span-2"
                  value={connectorTestPath}
                  onChange={(e) => setConnectorTestPath(e.target.value)}
                  placeholder="Probe path (default /)"
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={testConnector}
                  disabled={connectorTesting}
                >
                  {connectorTesting ? "Testing..." : "Test Connector"}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <button
                  type="button"
                  className="btn-primary md:col-span-1"
                  onClick={runConnectorPull}
                  disabled={connectorPulling}
                >
                  {connectorPulling ? "Pulling..." : "Run Pull Now"}
                </button>
                <div className="md:col-span-2 text-xs text-slate-600 dark:text-slate-300 flex items-center">
                  Pulls pending orders from configured connector path, ingests
                  into Draft Queue, then sends ACK if configured.
                </div>
              </div>
              {connectorTestResult ? (
                <div className="text-xs rounded border border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-[#0a1228] p-2">
                  Probe OK · status{" "}
                  <strong>{connectorTestResult.status}</strong> · target{" "}
                  <code>{connectorTestResult.target}</code>
                  {connectorTestResult.preview ? (
                    <div className="mt-1 text-slate-600 dark:text-slate-300 break-all">
                      {connectorTestResult.preview}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Webhook URL:{" "}
              <code>
                /api/public/integrations/ecommerce/{provider}/YOUR_CLIENT_CODE
              </code>{" "}
              (use any active API key in <code>x-api-key</code> header).
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300">
              Recommended headers: <code>x-api-key</code> and{" "}
              <code>Idempotency-Key</code>.
            </div>
            <button className="btn-primary" disabled={savingSettings}>
              {savingSettings ? "Saving..." : "Save Integration Settings"}
            </button>
          </form>
        </section>

        <section className="client-premium-card p-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Integration Diagnostics
          </h2>
          {!diagnostics ? (
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Loading diagnostics...
            </div>
          ) : (
            <div className="text-sm text-slate-700 dark:text-slate-300 space-y-2">
              <div>
                Active API keys: <strong>{diagnostics.activeKeys}</strong>
              </div>
              <div>
                Webhook totals:{" "}
                <strong>{diagnostics.webhookStats?.total || 0}</strong> ·
                Created:{" "}
                <strong>{diagnostics.webhookStats?.created || 0}</strong> ·
                Duplicate:{" "}
                <strong>{diagnostics.webhookStats?.duplicate || 0}</strong> ·
                Failed: <strong>{diagnostics.webhookStats?.failed || 0}</strong>
              </div>
              <div>
                Dead-letter queue:{" "}
                <strong>{diagnostics.deadLetters || 0}</strong> · Sandbox
                accepted: <strong>{diagnostics.sandboxAccepted || 0}</strong>
              </div>
              <div>
                Connector pull SLO (24h): runs{" "}
                <strong>
                  {diagnostics.connectorPullSlo?.runCount24h || 0}
                </strong>{" "}
                · failure runs{" "}
                <strong>
                  {diagnostics.connectorPullSlo?.failureRuns24h || 0}
                </strong>{" "}
                · failure rate{" "}
                <strong>
                  {Number(diagnostics.connectorPullSlo?.failureRate24h || 0) *
                    100}
                  %
                </strong>
              </div>
              <div>Tips: {(diagnostics.tips || []).join(" | ")}</div>
            </div>
          )}
        </section>

        <section className="client-premium-card p-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
            Webhook Replay
          </h2>
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
            <button
              className="btn-primary"
              type="button"
              onClick={replayWebhook}
              disabled={replaying}
            >
              {replaying ? "Replaying..." : "Replay Event"}
            </button>
          </div>
        </section>

        <section className="client-premium-card p-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
            Webhook Logs ({provider})
          </h2>
          {logs.length === 0 ? (
            <div className="text-sm text-slate-500 dark:text-slate-400">
              No webhook logs yet.
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((row) => (
                <div key={row.id} className="border rounded-lg p-3 text-xs">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {row.action}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">
                    {row.entityId} · {new Date(row.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="client-premium-card p-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
            Dead-letter Queue
          </h2>
          {deadLetters.length === 0 ? (
            <div className="text-sm text-slate-500 dark:text-slate-400">
              No dead-letter events.
            </div>
          ) : (
            <div className="space-y-2">
              {deadLetters.map((row) => (
                <div key={row.id} className="border rounded-lg p-3 text-xs">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {row.payload?.provider || "provider"} ·{" "}
                    {row.error || row.payload?.reason || "unknown error"}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">
                    {new Date(row.createdAt).toLocaleString()} · requestId:{" "}
                    {row.payload?.requestId || "n/a"}
                  </div>
                  <div className="mt-2">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => retryDeadLetter(row.id)}
                    >
                      Retry Dead-letter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="client-premium-card p-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
            Connector Pull Runs ({provider})
          </h2>
          <div className="text-xs text-slate-600 dark:text-slate-300 mb-3">
            Runs: <strong>{pullRuns?.summary?.runs || 0}</strong> · Pulled:{" "}
            <strong>{pullRuns?.summary?.pulled || 0}</strong> · Created:{" "}
            <strong>{pullRuns?.summary?.created || 0}</strong> · Duplicate:{" "}
            <strong>{pullRuns?.summary?.duplicate || 0}</strong> · Failed:{" "}
            <strong>{pullRuns?.summary?.failed || 0}</strong>
          </div>
          {(pullRuns?.rows || []).length === 0 ? (
            <div className="text-sm text-slate-500 dark:text-slate-400">
              No connector pull runs yet.
            </div>
          ) : (
            <div className="space-y-2">
              {pullRuns.rows.map((row) => (
                <div key={row.id} className="border rounded-lg p-3 text-xs">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {row.entityId} · pulled {row.newValue?.pulled || 0} ·
                    created {row.newValue?.created || 0} · duplicate{" "}
                    {row.newValue?.duplicate || 0} · failed{" "}
                    {row.newValue?.failed || 0}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">
                    {new Date(row.createdAt).toLocaleString()} · requestId:{" "}
                    {row.newValue?.requestId || "n/a"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="client-premium-card p-5">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
            Live Event Inspector
          </h2>
          {eventInspector.length === 0 ? (
            <div className="text-sm text-slate-500 dark:text-slate-400">
              No events found.
            </div>
          ) : (
            <div className="space-y-2">
              {eventInspector.map((row) => (
                <div key={row.id} className="border rounded-lg p-3 text-xs">
                  <div className="font-semibold text-slate-900 dark:text-white">
                    {row.action}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">
                    {row.entityId} · {new Date(row.createdAt).toLocaleString()}
                  </div>
                  {row.newValue?.requestId ? (
                    <div className="text-slate-500 dark:text-slate-400">
                      requestId: {row.newValue.requestId}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
