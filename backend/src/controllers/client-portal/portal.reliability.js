'use strict';

const prisma = require('../../config/prisma');
const R = require('../../utils/response');
const { resolveClientCode } = require('./shared');
const integrationIngestSvc = require('../../services/integration-ingest.service');

async function developerDiagnostics(req, res) {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const limit = Math.min(100, Math.max(20, parseInt(req.query?.limit, 10) || 60));
  const [events, dlqRows, client] = await Promise.all([
    prisma.auditLog.findMany({
      where: {
        entity: 'INTEGRATION_WEBHOOK',
        entityId: { startsWith: `${clientCode}:` },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        action: true,
        entityId: true,
        newValue: true,
        createdAt: true,
        ip: true,
      },
    }),
    prisma.jobQueue.findMany({
      where: { type: 'INTEGRATION_DEAD_LETTER' },
      orderBy: { createdAt: 'desc' },
      take: 500,
      select: {
        id: true,
        payload: true,
        error: true,
        createdAt: true,
      },
    }),
    prisma.client.findUnique({
      where: { code: clientCode },
      select: { brandSettings: true },
    }),
  ]);

  const dlq = dlqRows
    .filter((r) => String(r?.payload?.clientCode || '').toUpperCase() === clientCode)
    .slice(0, limit);

  const eventStats = {
    total: events.length,
    created: events.filter((e) => e.action === 'INTEGRATION_DRAFT_CREATED').length,
    duplicate: events.filter((e) => e.action === 'INTEGRATION_DRAFT_DUPLICATE').length,
    failed: events.filter((e) => e.action === 'INTEGRATION_DRAFT_FAILED').length,
    sandbox: events.filter((e) => e.action === 'INTEGRATION_SANDBOX_ACCEPTED').length,
  };

  const keyPoliciesMap = client?.brandSettings?.integrationKeyPolicies || {};
  const keys = await prisma.clientApiKey.findMany({
    where: { clientCode, active: true },
    select: { id: true, name: true, lastUsedAt: true },
    orderBy: { createdAt: 'desc' },
  });

  const keysWithPolicy = keys.map((k) => {
    const p = keyPoliciesMap[String(k.id)] || {};
    return {
      id: k.id,
      name: k.name,
      lastUsedAt: k.lastUsedAt,
      mode: String(p.mode || 'live').toLowerCase() === 'sandbox' ? 'sandbox' : 'live',
      scopes: integrationIngestSvc.normalizeScopes(p.scopes),
    };
  });

  R.ok(res, {
    webhookStats: eventStats,
    events,
    deadLetters: dlq.map((row) => ({
      id: row.id,
      createdAt: row.createdAt,
      reason: row.error || row.payload?.reason || 'unknown',
      provider: row.payload?.provider || null,
      requestId: row.payload?.requestId || null,
      payload: row.payload?.body || null,
    })),
    keys: keysWithPolicy,
  });
}

module.exports = {
  developerDiagnostics,
};

