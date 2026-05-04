"use strict";
// dev-helpers.js — Shared utilities for developer hub sub-routers
// Extracted from developer.routes.js for DRY across sub-modules

const prisma = require("../config/prisma");
const integrationIngestSvc = require("../services/integration-ingest.service");

const ALLOWED_KEY_SCOPES = ['orders:create', 'webhooks:read', 'webhooks:replay', 'events:read', 'sandbox:write'];
const APPROVABLE_ACTIONS = ['INTEGRATION_SETTINGS_CHANGE', 'API_KEY_POLICY_CHANGE', 'DISPUTE_SETTLEMENT', 'RETENTION_POLICY_CHANGE'];
const CONNECTOR_AUTH_TYPES = ['none', 'api_key', 'bearer', 'basic'];
const SENSITIVE_FIELD_RE = /(token|secret|password|authorization|api[-_]?key|phone|email)/i;
const SUPPORTED_PROVIDERS = integrationIngestSvc.SUPPORTED_ECOM_PROVIDERS;

function resolveClientCode(req) {
  if (req.user?.role === 'CLIENT') return req.user.clientCode || null;
  return String(req.query?.clientCode || req.body?.clientCode || '').trim().toUpperCase() || null;
}

function parseScopes(inputScopes) {
  const scopes = integrationIngestSvc.normalizeScopes(inputScopes);
  return scopes.filter((scope) => ALLOWED_KEY_SCOPES.includes(scope) || scope === '*');
}

async function requireIntegrationScope({ clientCode, requiredScope, preferredKeyId = null }) {
  const client = await prisma.client.findUnique({
    where: { code: clientCode },
    select: { brandSettings: true },
  });
  const policies = client?.brandSettings?.integrationKeyPolicies || {};
  const activeKeys = await prisma.clientApiKey.findMany({
    where: {
      clientCode,
      active: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    select: { id: true },
    orderBy: [{ lastUsedAt: 'desc' }, { createdAt: 'desc' }],
  });
  const ordered = Number.isFinite(preferredKeyId)
    ? [...activeKeys.filter((k) => k.id === preferredKeyId), ...activeKeys.filter((k) => k.id !== preferredKeyId)]
    : activeKeys;
  const matchedKey = ordered.find((k) => integrationIngestSvc.hasScope(policies[String(k.id)] || {}, requiredScope));
  return { matchedKey };
}

async function upsertKeyPolicy(clientCode, keyId, patch) {
  const client = await prisma.client.findUnique({
    where: { code: clientCode },
    select: { brandSettings: true },
  });
  const current = (client?.brandSettings && typeof client.brandSettings === 'object') ? client.brandSettings : {};
  const map = { ...(current.integrationKeyPolicies || {}) };
  const existing = map[String(keyId)] || {};
  map[String(keyId)] = { ...existing, ...patch };
  await prisma.client.update({
    where: { code: clientCode },
    data: { brandSettings: { ...current, integrationKeyPolicies: map } },
  });
}

function normalizeApprovalAction(input) {
  const action = String(input || '').trim().toUpperCase();
  return APPROVABLE_ACTIONS.includes(action) ? action : null;
}

function maskSecret(value) {
  const raw = String(value || '');
  if (!raw) return '';
  if (raw.length <= 8) return `${raw.slice(0, 2)}***${raw.slice(-1)}`;
  return `${raw.slice(0, 3)}***${raw.slice(-3)}`;
}

function redactSensitive(value) {
  if (Array.isArray(value)) return value.map(redactSensitive);
  if (!value || typeof value !== 'object') return value;
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (SENSITIVE_FIELD_RE.test(String(k))) {
      out[k] = typeof v === 'string' ? maskSecret(v) : '***';
      continue;
    }
    out[k] = redactSensitive(v);
  }
  return out;
}

function sanitizeConnector(connector, provider) {
  const authType = String(connector?.authType || 'none').trim().toLowerCase();
  const safeAuthType = CONNECTOR_AUTH_TYPES.includes(authType) ? authType : 'none';
  const timeoutMs = Math.min(60000, Math.max(2000, parseInt(connector?.timeoutMs, 10) || 10000));
  const retryAttempts = Math.min(6, Math.max(1, parseInt(connector?.retryAttempts, 10) || 3));
  const retryBaseDelayMs = Math.min(10000, Math.max(200, parseInt(connector?.retryBaseDelayMs, 10) || 600));

  return {
    enabled: Boolean(connector?.enabled),
    providerType: ['amazon', 'flipkart', 'myntra', 'ajio'].includes(provider) ? 'marketplace' : (provider === 'custom' ? 'custom' : 'erp'),
    baseUrl: String(connector?.baseUrl || '').trim(),
    orderPullPath: String(connector?.orderPullPath || '').trim(),
    orderAckPath: String(connector?.orderAckPath || '').trim(),
    webhookPath: String(connector?.webhookPath || '').trim(),
    authType: safeAuthType,
    credentials: {
      headerName: String(connector?.credentials?.headerName || 'x-api-key').trim() || 'x-api-key',
      apiKey: String(connector?.credentials?.apiKey || '').trim(),
      token: String(connector?.credentials?.token || '').trim(),
      username: String(connector?.credentials?.username || '').trim(),
      password: String(connector?.credentials?.password || '').trim(),
    },
    timeoutMs,
    retryAttempts,
    retryBaseDelayMs,
    verifySsl: connector?.verifySsl !== false,
  };
}

function isValidHttpUrl(value) {
  try {
    const u = new URL(String(value || '').trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function redactIntegrationConfig(config) {
  if (!config || typeof config !== 'object') return config;
  const clone = JSON.parse(JSON.stringify(config));
  if (!clone.connector || typeof clone.connector !== 'object') return clone;
  clone.connector.credentials = clone.connector.credentials || {};
  if (clone.connector.credentials.apiKey) clone.connector.credentials.apiKey = maskSecret(clone.connector.credentials.apiKey);
  if (clone.connector.credentials.token) clone.connector.credentials.token = maskSecret(clone.connector.credentials.token);
  if (clone.connector.credentials.password) clone.connector.credentials.password = maskSecret(clone.connector.credentials.password);
  return clone;
}

async function pickLiveIngestKey(clientCode, clientBrandSettings, preferredKeyId = null) {
  const rows = await prisma.clientApiKey.findMany({
    where: {
      clientCode,
      active: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { id: true, name: true, lastUsedAt: true, createdAt: true },
    orderBy: [{ lastUsedAt: 'desc' }, { createdAt: 'desc' }],
  });
  if (!rows.length) return null;
  const policies = clientBrandSettings?.integrationKeyPolicies || {};
  const ordered = preferredKeyId
    ? [...rows.filter((r) => r.id === preferredKeyId), ...rows.filter((r) => r.id !== preferredKeyId)]
    : rows;
  return ordered.find((row) => {
    const policy = policies[String(row.id)] || {};
    const mode = String(policy.mode || 'live').toLowerCase() === 'sandbox' ? 'sandbox' : 'live';
    return mode === 'live' && integrationIngestSvc.hasScope(policy, 'orders:create');
  }) || null;
}

module.exports = {
  ALLOWED_KEY_SCOPES,
  APPROVABLE_ACTIONS,
  CONNECTOR_AUTH_TYPES,
  SENSITIVE_FIELD_RE,
  SUPPORTED_PROVIDERS,
  resolveClientCode,
  parseScopes,
  requireIntegrationScope,
  upsertKeyPolicy,
  normalizeApprovalAction,
  maskSecret,
  redactSensitive,
  sanitizeConnector,
  isValidHttpUrl,
  redactIntegrationConfig,
  pickLiveIngestKey,
};
