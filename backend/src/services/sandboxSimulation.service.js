'use strict';

const crypto = require('crypto');
const prisma = require('../config/prisma');

const PLATFORMS = ['shopify', 'amazon', 'flipkart', 'custom'];
const ERROR_SCENARIOS = ['invalid_address', 'courier_unavailable', 'api_failure', 'delivery_failure'];
const STATUS_FLOW = ['Created', 'In Transit', 'Out for Delivery', 'Delivered'];
const STATUS_ALIASES = {
  created: 'Created',
  booked: 'Created',
  intransit: 'In Transit',
  'in transit': 'In Transit',
  outfordelivery: 'Out for Delivery',
  'out for delivery': 'Out for Delivery',
  delivered: 'Delivered',
  rto: 'RTO',
  failed: 'Failed Delivery',
  failed_delivery: 'Failed Delivery',
  delivery_failure: 'Failed Delivery',
};
const TRACE_STEPS = [
  { key: 'api_received', label: 'API Received', step: 'api' },
  { key: 'order_created', label: 'Order Created', step: 'order' },
  { key: 'shipment_created', label: 'Shipment Created', step: 'shipment' },
  { key: 'tracking_active', label: 'Tracking Active', step: 'tracking' },
];
const SENSITIVE_KEYS = new Set([
  'authorization',
  'accessToken',
  'refreshToken',
  'token',
  'password',
  'secret',
  'apiKey',
  'key',
  'licenseKey',
  'LicenceKey',
  'loginId',
  'LoginID',
  'otp',
]);
const ERROR_FIXES = {
  SANDBOX_INVALID_ADDRESS: 'Send consignee, destination, positive weight, and a valid 6-digit pincode.',
  invalid_address: 'Send consignee, destination, positive weight, and a valid 6-digit pincode.',
  SANDBOX_COURIER_UNAVAILABLE: 'Try another courier/service or verify the origin-destination lane is enabled for this client.',
  courier_unavailable: 'Try another courier/service or verify the origin-destination lane is enabled for this client.',
  SANDBOX_API_FAILURE: 'Retry with the same requestId after checking the courier sandbox status.',
  api_failure: 'Retry with the same requestId after checking the courier sandbox status.',
  delivery_failure: 'Inspect the tracking events and validate destination contact/address before retrying.',
};
const COURIER_ALIASES = {
  trackon: 'Trackon',
  dtdc: 'DTDC',
  delhivery: 'Delhivery',
  bluedart: 'BlueDart',
  'blue dart': 'BlueDart',
  fedex: 'FedEx',
  dhl: 'DHL',
};

function normalizeCourierName(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return COURIER_ALIASES[raw.toLowerCase()] || raw;
}

function normalizePlatform(value) {
  const platform = String(value || 'custom').trim().toLowerCase();
  return PLATFORMS.includes(platform) ? platform : 'custom';
}

function normalizeStatus(value) {
  const key = String(value || '').trim().toLowerCase();
  return STATUS_ALIASES[key] || value || 'Created';
}

function normalizeErrorScenario(value) {
  const scenario = String(value || '').trim().toLowerCase();
  return ERROR_SCENARIOS.includes(scenario) ? scenario : null;
}

function makeSandboxRunId(prefix = 'SBX') {
  return `${prefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function makeRequestId(prefix = 'req') {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${prefix}_${crypto.randomBytes(12).toString('hex')}`;
}

function makeAwb() {
  return `SBX${Date.now().toString().slice(-7)}${crypto.randomInt(100, 999)}`;
}

function makeOrderRef(platform, index = 0) {
  const tag = platform.toUpperCase().slice(0, 3);
  return `${tag}-SBX-${Date.now().toString().slice(-6)}-${String(index + 1).padStart(3, '0')}`;
}

function kgFromPayload(payload = {}) {
  const grams = Number(payload.weightGrams || payload.weight_grams || 0);
  if (grams > 0) return Number((grams / 1000).toFixed(3));
  const kg = Number(payload.weight || payload.weightKg || payload.weight_kg || 0.5);
  return Number.isFinite(kg) && kg > 0 ? kg : 0.5;
}

function coalesce(...values) {
  for (const value of values) {
    const text = String(value ?? '').trim();
    if (text) return text;
  }
  return '';
}

function normalizeOrderPayload(payload = {}, platform = 'custom', index = 0) {
  const shipping = payload.shipping_address || payload.shipping || {};
  const customer = payload.customer || {};
  return {
    referenceId: coalesce(payload.referenceId, payload.orderRef, payload.order_id, payload.id, payload.order_number, payload.number, makeOrderRef(platform, index)),
    consignee: coalesce(payload.consignee, shipping.name, `${shipping.first_name || ''} ${shipping.last_name || ''}`, customer.name, `Sandbox Buyer ${index + 1}`),
    destination: coalesce(payload.destination, payload.deliveryCity, shipping.city, 'Gurugram'),
    phone: coalesce(payload.phone, shipping.phone, customer.phone, '9999999999'),
    pincode: coalesce(payload.pincode, payload.pin, shipping.zip, shipping.postcode, '122015'),
    weight: kgFromPayload(payload),
  };
}

function validateAddress(data) {
  const missing = [];
  if (!data.consignee) missing.push('consignee');
  if (!data.destination) missing.push('destination');
  if (!data.pincode) missing.push('pincode');
  if (!data.weight || Number(data.weight) <= 0) missing.push('weight');
  if (data.pincode && !/^\d{6}$/.test(String(data.pincode))) missing.push('pincode_format');
  return missing;
}

function errorForScenario(scenario) {
  if (scenario === 'invalid_address') {
    const err = new Error('Sandbox invalid address: destination and valid 6-digit pincode are required.');
    err.status = 422;
    err.code = 'SANDBOX_INVALID_ADDRESS';
    return err;
  }
  if (scenario === 'courier_unavailable') {
    const err = new Error('Sandbox courier unavailable for this lane.');
    err.status = 503;
    err.code = 'SANDBOX_COURIER_UNAVAILABLE';
    return err;
  }
  if (scenario === 'api_failure') {
    const err = new Error('Sandbox courier API failure.');
    err.status = 502;
    err.code = 'SANDBOX_API_FAILURE';
    return err;
  }
  return null;
}

function throwScenario(scenario) {
  const err = errorForScenario(normalizeErrorScenario(scenario));
  if (err) throw err;
}

function mockCarrierResponse(payload = {}) {
  const carrier = normalizeCourierName(payload.carrier || payload.courier || 'Trackon') || 'Trackon';
  const awb = String(payload.awb || makeAwb()).toUpperCase();
  return {
    order_id: coalesce(payload.orderId, payload.order_id, payload.orderRef, payload.referenceId, makeOrderRef('custom')),
    shipment_id: `SHP-${awb}`,
    awb,
    AWB: awb,
    status: 'Created',
    carrier,
    trackUrl: `/track/${encodeURIComponent(awb)}`,
    labelUrl: `/api/carrier/label/${encodeURIComponent(awb)}`,
    raw: {
      sandbox: true,
      accepted: true,
      service: payload.service || 'Standard',
      promisedTatDays: 3,
    },
  };
}

function buildEvents({ shipmentId, awb, courier, finalStatus = 'Created', errorScenario = null }) {
  const statuses = errorScenario === 'delivery_failure'
    ? ['Created', 'In Transit', 'Out for Delivery', 'Failed Delivery']
    : finalStatus === 'RTO'
      ? ['Created', 'In Transit', 'Out for Delivery', 'RTO']
      : STATUS_FLOW.slice(0, Math.max(1, STATUS_FLOW.indexOf(finalStatus) + 1));
  const now = Date.now();
  return statuses.map((status, index) => ({
    shipmentId,
    awb,
    status,
    location: index === 0 ? 'Sea Hawk Sandbox Origin Hub' : index === statuses.length - 1 ? 'Sandbox Destination Hub' : 'Sandbox Transit Hub',
    description: `Sandbox simulation: ${status}`,
    timestamp: new Date(now + index * 60 * 60 * 1000),
    source: 'SANDBOX',
    rawData: { sandbox: true, sequence: index + 1, courier },
  }));
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function sanitizeForSandboxTrace(value, depth = 0) {
  if (value == null) return value;
  if (depth > 5) return '[Truncated]';
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => sanitizeForSandboxTrace(item, depth + 1));
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== 'object') return value;
  const clean = {};
  for (const [key, raw] of Object.entries(value)) {
    if (SENSITIVE_KEYS.has(key) || SENSITIVE_KEYS.has(String(key).toLowerCase())) {
      clean[key] = '[REDACTED]';
    } else {
      clean[key] = sanitizeForSandboxTrace(raw, depth + 1);
    }
  }
  return clean;
}

function compactObject(value = {}) {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined));
}

function logLine(event, meta = {}) {
  const level = String(meta.level || 'info').toLowerCase();
  const message = meta.message || String(event || '').replaceAll('_', '.');
  return compactObject({
    at: new Date().toISOString(),
    level,
    event,
    message,
    runId: meta.runId,
    requestId: meta.requestId,
    step: meta.step,
    orderId: meta.orderId,
    shipmentId: meta.shipmentId,
    awb: meta.awb,
    durationMs: meta.durationMs,
    errorType: meta.errorType,
    meta: sanitizeForSandboxTrace(meta.meta || {}),
  });
}

function durationSince(startedAt) {
  return startedAt ? Math.max(0, Date.now() - startedAt) : null;
}

function suggestedFix(errorType) {
  return ERROR_FIXES[errorType] || 'Review the request payload, run logs, and failed step, then retry in sandbox with a stable requestId.';
}

function stepTrace(key, status = 'pending', attrs = {}) {
  const def = TRACE_STEPS.find((item) => item.key === key) || { key, label: key, step: key };
  return compactObject({
    key: def.key,
    label: def.label,
    step: def.step,
    status,
    timestamp: attrs.timestamp || null,
    durationMs: Number.isFinite(Number(attrs.durationMs)) ? Number(attrs.durationMs) : null,
    failureReason: attrs.failureReason || null,
  });
}

function buildFlowTrace({ requestId, orderCreated = false, shipmentCreated = false, trackingActive = false, error = null, timestamps = {}, durations = {} }) {
  const failedStep = error?.step || null;
  const failedKey = failedStep === 'order_received'
    ? 'order_created'
    : failedStep === 'shipment_created' || failedStep === 'courier_simulated'
      ? 'shipment_created'
      : failedStep === 'tracking_active'
        ? 'tracking_active'
        : null;
  return {
    requestId,
    steps: [
      stepTrace('api_received', 'success', { timestamp: timestamps.api_received, durationMs: durations.api }),
      stepTrace('order_created', failedKey === 'order_created' ? 'failed' : orderCreated ? 'success' : 'pending', {
        timestamp: timestamps.order_created,
        durationMs: durations.order,
        failureReason: failedKey === 'order_created' ? error?.errorMessage : null,
      }),
      stepTrace('shipment_created', failedKey === 'shipment_created' ? 'failed' : shipmentCreated ? 'success' : 'pending', {
        timestamp: timestamps.shipment_created,
        durationMs: durations.shipment,
        failureReason: failedKey === 'shipment_created' ? error?.errorMessage : null,
      }),
      stepTrace('tracking_active', failedKey === 'tracking_active' ? 'failed' : trackingActive ? 'success' : 'pending', {
        timestamp: timestamps.tracking_active,
        durationMs: durations.tracking,
        failureReason: failedKey === 'tracking_active' ? error?.errorMessage : null,
      }),
    ],
  };
}

function computeRunStatus({ totalOrders = 0, failedOrders = 0, totalShipments = 0 }) {
  if (totalOrders > 0 && failedOrders >= totalOrders) return 'failed';
  if (failedOrders > 0) return 'partial';
  if (totalOrders > 0 && totalShipments === 0) return 'partial';
  return 'success';
}

async function ensureSandboxRun({ runId, clientCode = null, platformType = 'custom', totalOrders = 0 }) {
  const id = String(runId || makeSandboxRunId()).trim();
  const existing = await prisma.sandboxRun.findUnique({ where: { runId: id } }).catch(() => null);
  if (existing) {
    const nextTotalOrders = Math.max(Number(existing.totalOrders || 0), Number(totalOrders || 0));
    return prisma.sandboxRun.update({
      where: { runId: id },
      data: {
        clientCode: existing.clientCode || (clientCode ? String(clientCode).toUpperCase() : null),
        platformType: existing.platformType || platformType,
        totalOrders: nextTotalOrders,
        status: computeRunStatus({
          totalOrders: nextTotalOrders,
          failedOrders: existing.failedOrders || 0,
          totalShipments: existing.totalShipments || 0,
        }),
      },
    });
  }

  return prisma.sandboxRun.create({
    data: {
      runId: id,
      clientCode: clientCode ? String(clientCode).toUpperCase() : null,
      platformType,
      totalOrders: Number(totalOrders || 0),
      totalShipments: 0,
      failedOrders: 0,
      status: Number(totalOrders || 0) > 0 ? 'partial' : 'success',
      logs: [logLine('run.created', { step: 'run', runId: id, requestId: makeRequestId('run'), message: 'Sandbox run created' })],
    },
  });
}

async function updateRun(runId, mutator) {
  const run = await prisma.sandboxRun.findUnique({ where: { runId } }).catch(() => null);
  if (!run) return null;
  const patch = mutator(run) || {};
  const totalOrders = patch.totalOrders ?? run.totalOrders ?? 0;
  const failedOrders = patch.failedOrders ?? run.failedOrders ?? 0;
  const totalShipments = patch.totalShipments ?? run.totalShipments ?? 0;
  return prisma.sandboxRun.update({
    where: { runId },
    data: {
      ...patch,
      status: patch.status || computeRunStatus({ totalOrders, failedOrders, totalShipments }),
    },
  });
}

function orderFlowTrace({ orderId, shipmentId = null, status = 'Created', error = null, requestId = null, awb = null, requestPayload = null, responsePayload = null, timestamps = {}, durations = {} }) {
  const failed = Boolean(error);
  const failedAt = error?.step || null;
  const shipmentExists = Boolean(shipmentId);
  const trackingActive = shipmentExists && failedAt === 'tracking_active' ? true : shipmentExists && !failed;
  return {
    orderId,
    requestId,
    shipmentId,
    awb,
    status: failed ? 'FAILED' : status,
    error: error || null,
    trace: buildFlowTrace({
      requestId,
      orderCreated: !failed || failedAt !== 'order_received',
      shipmentCreated: shipmentExists && failedAt !== 'shipment_created' && failedAt !== 'courier_simulated',
      trackingActive,
      error,
      timestamps,
      durations,
    }),
    performance: {
      apiMs: durations.api ?? null,
      orderMs: durations.order ?? null,
      shipmentMs: durations.shipment ?? null,
      trackingMs: durations.tracking ?? null,
      totalMs: Object.values(durations).reduce((sum, value) => sum + (Number(value) || 0), 0),
    },
    apiExchange: {
      request: requestPayload ? sanitizeForSandboxTrace(requestPayload) : null,
      response: responsePayload ? sanitizeForSandboxTrace(responsePayload) : null,
    },
    flow: {
      orderReceived: !failed || failedAt !== 'order_received',
      shipmentCreated: shipmentExists && failedAt !== 'shipment_created' && failedAt !== 'courier_simulated',
      appearsInClientPortal: shipmentExists && failedAt !== 'shipment_created' && failedAt !== 'courier_simulated',
      appearsInOwnerPortal: shipmentExists && failedAt !== 'shipment_created' && failedAt !== 'courier_simulated',
      trackingActive,
      failedAt: failed ? failedAt || 'unknown' : null,
    },
  };
}

async function recordOrder({ runId, order, logMessage = 'Order created', requestId = null, requestPayload = null, responsePayload = null, startedAt = null }) {
  const completedAt = new Date().toISOString();
  return updateRun(runId, (run) => ({
    orders: [
      ...toArray(run.orders),
      orderFlowTrace({
        orderId: order.order_id,
        status: order.status || 'Created',
        requestId,
        requestPayload,
        responsePayload,
        timestamps: { api_received: run.createdAt?.toISOString?.() || completedAt, order_created: completedAt },
        durations: { api: 0, order: durationSince(startedAt) },
      }),
    ],
    logs: [
      ...toArray(run.logs),
      logLine('order.created', { step: 'order', runId, requestId, orderId: order.order_id, durationMs: durationSince(startedAt), message: `${logMessage} -> ${order.order_id}` }),
    ],
  }));
}

async function recordShipment({ runId, orderId, shipment, events = [], requestId = null, requestPayload = null, responsePayload = null, startedAt = null }) {
  const completedAt = new Date().toISOString();
  return updateRun(runId, (run) => {
    const orders = toArray(run.orders);
    const existing = orders.find((row) => String(row.orderId) === String(orderId));
    const nextOrder = orderFlowTrace({
      orderId,
      shipmentId: shipment.id,
      awb: shipment.awb,
      status: shipment.status || 'Created',
      requestId: requestId || existing?.requestId || null,
      requestPayload: requestPayload || existing?.apiExchange?.request || null,
      responsePayload: responsePayload || existing?.apiExchange?.response || null,
      timestamps: {
        api_received: existing?.trace?.steps?.find((step) => step.key === 'api_received')?.timestamp || run.createdAt?.toISOString?.() || completedAt,
        order_created: existing?.trace?.steps?.find((step) => step.key === 'order_created')?.timestamp || completedAt,
        shipment_created: completedAt,
        tracking_active: toArray(events)[0]?.timestamp instanceof Date ? toArray(events)[0].timestamp.toISOString() : completedAt,
      },
      durations: {
        api: existing?.performance?.apiMs ?? 0,
        order: existing?.performance?.orderMs ?? null,
        shipment: durationSince(startedAt),
        tracking: 0,
      },
    });
    const existingIndex = orders.findIndex((row) => String(row.orderId) === String(orderId));
    const nextOrders = existingIndex >= 0
      ? orders.map((row, index) => (index === existingIndex ? { ...row, ...nextOrder } : row))
      : [...orders, nextOrder];
    return {
      totalShipments: Number(run.totalShipments || 0) + 1,
      orders: nextOrders,
      shipments: [
        ...toArray(run.shipments),
        {
          orderId,
          shipmentId: shipment.id,
          awb: shipment.awb,
          status: shipment.status,
          courier: shipment.courier,
        },
      ],
      statusProgression: [
        ...toArray(run.statusProgression),
        ...toArray(events).map((event) => ({
          at: event.timestamp instanceof Date ? event.timestamp.toISOString() : new Date(event.timestamp || Date.now()).toISOString(),
          orderId,
          shipmentId: shipment.id,
          awb: shipment.awb,
          status: event.status,
          location: event.location || null,
        })),
      ],
      logs: [
        ...toArray(run.logs),
        logLine('shipment.created', { step: 'shipment', runId, requestId, orderId, shipmentId: shipment.id, awb: shipment.awb, durationMs: durationSince(startedAt), message: `Shipment created -> ${shipment.id}` }),
        logLine('courier.simulated', { step: 'shipment', runId, requestId, orderId, shipmentId: shipment.id, awb: shipment.awb, message: 'Courier simulated -> SUCCESS' }),
        logLine('tracking.active', { step: 'tracking', runId, requestId, orderId, shipmentId: shipment.id, awb: shipment.awb, durationMs: 0, message: 'Tracking created' }),
      ],
    };
  });
}

async function recordRunError({ runId, orderId = null, shipmentId = null, errorType = 'unknown', errorMessage = 'Sandbox error', step = 'unknown', requestId = null, requestPayload = null, responsePayload = null, startedAt = null }) {
  const at = new Date().toISOString();
  return updateRun(runId, (run) => ({
    failedOrders: Number(run.failedOrders || 0) + 1,
    orders: [
      ...toArray(run.orders).filter((row) => String(row.orderId) !== String(orderId)),
      orderFlowTrace({
        orderId: orderId || `FAILED-${Date.now()}`,
        shipmentId,
        requestId,
        requestPayload,
        responsePayload,
        timestamps: { api_received: run.createdAt?.toISOString?.() || at, [step === 'order_received' ? 'order_created' : step === 'tracking_active' ? 'tracking_active' : 'shipment_created']: at },
        durations: { api: 0, [step === 'order_received' ? 'order' : step === 'tracking_active' ? 'tracking' : 'shipment']: durationSince(startedAt) },
        error: { errorType, errorMessage, step, suggestedFix: suggestedFix(errorType) },
      }),
    ],
    errors: [
      ...toArray(run.errors),
      {
        at,
        requestId,
        orderId,
        shipmentId,
        errorType,
        errorMessage,
        step,
        suggestedFix: suggestedFix(errorType),
      },
    ],
    logs: [
      ...toArray(run.logs),
      logLine('sandbox.error', { step: step === 'tracking_active' ? 'tracking' : step === 'order_received' ? 'order' : 'shipment', runId, requestId, orderId, shipmentId, errorType, durationMs: durationSince(startedAt), level: 'error', message: `Order failed -> ${errorMessage}`, meta: { suggestedFix: suggestedFix(errorType) } }),
    ],
  }));
}

async function recordStatusProgression({ runId, orderId = null, shipment, status }) {
  return updateRun(runId, (run) => ({
    statusProgression: [
      ...toArray(run.statusProgression),
      {
        at: new Date().toISOString(),
        orderId,
        shipmentId: shipment.id,
        awb: shipment.awb,
        status,
      },
    ],
    logs: [
      ...toArray(run.logs),
      logLine('tracking.status_progressed', { step: 'tracking', runId, requestId: shipment.simulationState?.requestId || null, orderId, shipmentId: shipment.id, awb: shipment.awb, message: `Status progressed -> ${status}` }),
    ],
  }));
}

function errorTypeFromError(err, fallback = null) {
  return err?.code || fallback || 'sandbox_error';
}

async function assertClient(clientCode) {
  const code = String(clientCode || '').trim().toUpperCase();
  if (!code) {
    const err = new Error('clientCode is required for sandbox simulation.');
    err.status = 400;
    throw err;
  }
  const client = await prisma.client.findUnique({ where: { code } });
  if (!client) {
    const err = new Error(`Client ${code} not found.`);
    err.status = 404;
    throw err;
  }
  return code;
}

async function createSandboxOrder({ clientCode, payload = {}, platformType = 'custom', userId = null, scenario = null, index = 0, requestId = null }) {
  const startedAt = Date.now();
  const effectiveRequestId = requestId || payload.requestId || makeRequestId();
  const platform = normalizePlatform(platformType || payload.platformType || payload.platform);
  const normalized = normalizeOrderPayload(payload, platform, index);
  const runId = payload.sandboxRunId || makeSandboxRunId('ORD');
  await ensureSandboxRun({ runId, clientCode, platformType: platform, totalOrders: 1 });

  try {
    const missing = validateAddress(normalized);
    if (missing.length || normalizeErrorScenario(scenario) === 'invalid_address') {
      const err = errorForScenario('invalid_address');
      err.details = { missing };
      throw err;
    }
    throwScenario(scenario);

    const code = await assertClient(clientCode);
    const draft = await prisma.draftOrder.create({
      data: {
        clientCode: code,
        referenceId: normalized.referenceId,
        consignee: normalized.consignee,
        destination: normalized.destination,
        phone: normalized.phone || null,
        pincode: normalized.pincode || null,
        weight: normalized.weight,
        status: 'PENDING',
        environment: 'sandbox',
        sandboxRunId: runId,
        sourcePlatform: platform,
        simulationState: {
          phase: 'ORDER_RECEIVED',
          platform,
          requestId: effectiveRequestId,
          scenario: normalizeErrorScenario(scenario),
          rawPayload: payload,
          createdByUserId: userId || null,
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'SANDBOX_ORDER_CREATED',
        entity: 'SANDBOX_ORDER',
        entityId: `${code}:${draft.referenceId}`,
        newValue: { draftId: draft.id, clientCode: code, platform, sandboxRunId: runId },
      },
    }).catch(() => {});

    const result = {
      order_id: draft.referenceId,
      status: 'Created',
      requestId: effectiveRequestId,
      sandboxRunId: runId,
      platform,
      draft,
    };
    await recordOrder({
      runId,
      order: result,
      requestId: effectiveRequestId,
      requestPayload: payload,
      responsePayload: { order_id: result.order_id, status: result.status, requestId: effectiveRequestId, sandboxRunId: runId, platform },
      startedAt,
    });
    return result;
  } catch (err) {
    await recordRunError({
      runId,
      orderId: normalized.referenceId,
      errorType: errorTypeFromError(err, normalizeErrorScenario(scenario)),
      errorMessage: err.message,
      step: 'order_received',
      requestId: effectiveRequestId,
      requestPayload: payload,
      responsePayload: { error: { code: err.code || 'SANDBOX_ERROR', message: err.message, status: err.status || 500 }, requestId: effectiveRequestId },
      startedAt,
    });
    throw err;
  }
}

async function createSandboxShipment({ clientCode, payload = {}, platformType = 'custom', userId = null, scenario = null, requestId = null }) {
  const startedAt = Date.now();
  const effectiveRequestId = requestId || payload.requestId || makeRequestId();
  const scenarioName = normalizeErrorScenario(scenario || payload.simulateError || payload.errorScenario);
  const platform = normalizePlatform(platformType || payload.platformType || payload.platform);
  const normalized = normalizeOrderPayload(payload, platform);
  const runId = payload.sandboxRunId || makeSandboxRunId('SHP');
  await ensureSandboxRun({ runId, clientCode, platformType: platform, totalOrders: 1 });

  try {
    const missing = validateAddress(normalized);
    if (missing.length || scenarioName === 'invalid_address') {
      const err = errorForScenario('invalid_address');
      err.details = { missing };
      throw err;
    }
    throwScenario(scenarioName);

    const code = await assertClient(clientCode);
    const courier = normalizeCourierName(payload.carrier || payload.courier || 'Trackon') || 'Trackon';
    const mock = mockCarrierResponse({ ...payload, orderRef: normalized.referenceId, carrier: courier });
    const finalStatus = normalizeStatus(payload.status || (scenarioName === 'delivery_failure' ? 'Failed Delivery' : 'Created'));
    const today = new Date().toISOString().slice(0, 10);

    const transactionResult = await prisma.$transaction(async (tx) => {
      const created = await tx.shipment.create({
        data: {
          date: String(payload.date || today).slice(0, 10),
          clientCode: code,
          awb: mock.awb,
          consignee: normalized.consignee,
          destination: normalized.destination,
          phone: normalized.phone || null,
          pincode: normalized.pincode || null,
          weight: normalized.weight,
          amount: Number(payload.amount || 0),
          courier,
          department: 'Sandbox',
          service: String(payload.service || 'Standard'),
          status: finalStatus,
          remarks: `SANDBOX:${runId}${payload.remarks ? ` | ${payload.remarks}` : ''}`,
          labelUrl: mock.labelUrl,
          environment: 'sandbox',
          sandboxRunId: runId,
          sourcePlatform: platform,
          simulationState: {
            phase: 'SHIPMENT_CREATED',
            platform,
            requestId: effectiveRequestId,
            scenario: scenarioName,
            orderId: normalized.referenceId,
            courierResponse: mock,
            createdByUserId: userId || null,
          },
          createdById: userId || null,
          updatedById: userId || null,
        },
      });

      const events = buildEvents({ shipmentId: created.id, awb: created.awb, courier, finalStatus, errorScenario: scenarioName });
      await tx.trackingEvent.createMany({
        data: events,
        skipDuplicates: true,
      });

      if (payload.draftId) {
        await tx.draftOrder.update({
          where: { id: Number(payload.draftId) },
          data: { status: 'FULFILLED', shipmentId: created.id },
        }).catch(() => null);
      }

      return { created, events };
    });
    const shipment = transactionResult.created;
    const events = transactionResult.events;

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'SANDBOX_SHIPMENT_CREATED',
        entity: 'SANDBOX_SHIPMENT',
        entityId: `${code}:${shipment.awb}`,
        newValue: { shipmentId: shipment.id, awb: shipment.awb, clientCode: code, platform, sandboxRunId: runId, scenario: scenarioName },
      },
    }).catch(() => {});

    await recordShipment({
      runId,
      orderId: normalized.referenceId,
      shipment,
      events,
      requestId: effectiveRequestId,
      requestPayload: payload,
      responsePayload: { order_id: normalized.referenceId, shipment_id: shipment.id, awb: shipment.awb, status: shipment.status, requestId: effectiveRequestId, sandboxRunId: runId },
      startedAt,
    });
    if (scenarioName === 'delivery_failure') {
      await recordRunError({
        runId,
        orderId: normalized.referenceId,
        shipmentId: shipment.id,
        errorType: 'delivery_failure',
        errorMessage: 'Sandbox delivery failure after out-for-delivery scan.',
        step: 'tracking_active',
        requestId: effectiveRequestId,
        requestPayload: payload,
        responsePayload: { order_id: normalized.referenceId, shipment_id: shipment.id, awb: shipment.awb, status: shipment.status, error: 'delivery_failure', requestId: effectiveRequestId },
        startedAt,
      });
    }

    return {
      order_id: normalized.referenceId,
      shipment_id: shipment.id,
      awb: shipment.awb,
      AWB: shipment.awb,
      status: shipment.status,
      requestId: effectiveRequestId,
      sandboxRunId: runId,
      courierResponse: mock,
      shipment,
    };
  } catch (err) {
    await recordRunError({
      runId,
      orderId: normalized.referenceId,
      errorType: errorTypeFromError(err, scenarioName),
      errorMessage: err.message,
      step: scenarioName === 'courier_unavailable' || scenarioName === 'api_failure' ? 'courier_simulated' : 'shipment_created',
      requestId: effectiveRequestId,
      requestPayload: payload,
      responsePayload: { error: { code: err.code || 'SANDBOX_ERROR', message: err.message, status: err.status || 500 }, requestId: effectiveRequestId },
      startedAt,
    });
    throw err;
  }
}

async function bulkGenerate({ clientCode, count = 1, platformType = 'custom', createShipments = false, userId = null, requestId = null }) {
  const safeCount = [1, 10, 100].includes(Number(count)) ? Number(count) : 1;
  const platform = normalizePlatform(platformType);
  const runId = makeSandboxRunId('BULK');
  await ensureSandboxRun({ runId, clientCode, platformType: platform, totalOrders: safeCount });
  const results = [];
  for (let index = 0; index < safeCount; index += 1) {
    const perOrderRequestId = index === 0 && requestId ? requestId : makeRequestId();
    try {
      const payload = { ...normalizeOrderPayload({}, platform, index), sandboxRunId: runId, requestId: perOrderRequestId };
      const order = await createSandboxOrder({ clientCode, payload, platformType: platform, userId, index, requestId: perOrderRequestId });
      let shipment = null;
      if (createShipments) {
        shipment = await createSandboxShipment({
          clientCode,
          payload: { ...payload, orderRef: order.order_id, draftId: order.draft.id, requestId: perOrderRequestId },
          platformType: platform,
          userId,
          requestId: perOrderRequestId,
        });
      }
      results.push({ requestId: perOrderRequestId, order_id: order.order_id, draftId: order.draft.id, shipment_id: shipment?.shipment_id || null, awb: shipment?.awb || null, status: shipment?.status || order.status });
    } catch (err) {
      results.push({ requestId: perOrderRequestId, order_id: null, draftId: null, shipment_id: null, awb: null, status: 'FAILED', error: err.message });
    }
  }
  return { runId, requestId: requestId || null, count: safeCount, platform, createShipments: Boolean(createShipments), results };
}

async function progressShipment({ awb, status = null, userId = null }) {
  const shipment = await prisma.shipment.findUnique({ where: { awb: String(awb || '').toUpperCase() } });
  if (!shipment || shipment.environment !== 'sandbox') {
    const err = new Error('Sandbox shipment not found.');
    err.status = 404;
    throw err;
  }
  const current = normalizeStatus(shipment.status);
  const requestedStatus = status ? normalizeStatus(status) : null;
  const nextStatus = requestedStatus || STATUS_FLOW[STATUS_FLOW.indexOf(current) + 1] || 'Delivered';
  const updated = await prisma.shipment.update({
    where: { id: shipment.id },
    data: {
      status: nextStatus,
      updatedById: userId || null,
      simulationState: {
        ...(shipment.simulationState || {}),
        phase: 'STATUS_PROGRESSED',
        lastProgressedAt: new Date().toISOString(),
        lastStatus: nextStatus,
      },
    },
  });
  await prisma.trackingEvent.create({
    data: {
      shipmentId: shipment.id,
      awb: shipment.awb,
      status: nextStatus,
      location: 'Sandbox Tracking Hub',
      description: `Sandbox simulation progressed to ${nextStatus}`,
      timestamp: new Date(),
      source: 'SANDBOX',
      rawData: { sandbox: true, progressedByUserId: userId || null },
    },
  });
  if (shipment.sandboxRunId) {
    await recordStatusProgression({
      runId: shipment.sandboxRunId,
      orderId: shipment.simulationState?.orderId || null,
      shipment,
      status: nextStatus,
    });
  }
  return updated;
}

function summarizeRun(run) {
  return {
    id: run.id,
    runId: run.runId,
    clientCode: run.clientCode,
    platformType: run.platformType,
    status: run.status,
    totalOrders: run.totalOrders,
    totalShipments: run.totalShipments,
    failedOrders: run.failedOrders,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
  };
}

function normalizeTraceRow(row = {}, run = {}, shipments = []) {
  const shipment = row.shipmentId
    ? shipments.find((s) => s.id === row.shipmentId)
    : shipments.find((s) => String(s.simulationState?.orderId || '') === String(row.orderId));
  const requestId = row.requestId || shipment?.simulationState?.requestId || null;
  const awb = shipment?.awb || row.awb || null;
  const trace = row.trace || buildFlowTrace({
    requestId,
    orderCreated: Boolean(row.flow?.orderReceived),
    shipmentCreated: Boolean(row.flow?.shipmentCreated),
    trackingActive: Boolean(shipment?.trackingEvents?.length) && !row.error,
    error: row.error,
    timestamps: { api_received: run.createdAt?.toISOString?.(), order_created: run.createdAt?.toISOString?.(), shipment_created: shipment?.createdAt?.toISOString?.(), tracking_active: shipment?.trackingEvents?.[0]?.timestamp?.toISOString?.() },
    durations: row.performance || {},
  });
  return {
    ...row,
    requestId,
    shipmentId: shipment?.id || row.shipmentId || null,
    awb,
    trackingEvents: shipment?.trackingEvents || [],
    trace,
    performance: row.performance || {
      apiMs: trace.steps?.find((step) => step.key === 'api_received')?.durationMs ?? null,
      orderMs: trace.steps?.find((step) => step.key === 'order_created')?.durationMs ?? null,
      shipmentMs: trace.steps?.find((step) => step.key === 'shipment_created')?.durationMs ?? null,
      trackingMs: trace.steps?.find((step) => step.key === 'tracking_active')?.durationMs ?? null,
    },
    apiExchange: row.apiExchange || { request: null, response: null },
    flow: {
      ...(row.flow || {}),
      trackingActive: Boolean(shipment?.trackingEvents?.length) && !row.error,
    },
  };
}

async function listRuns({ clientCode = null, status = null, platformType = null, page = 1, limit = 25 } = {}) {
  const where = {};
  if (clientCode) where.clientCode = String(clientCode).toUpperCase();
  if (status) where.status = String(status).toLowerCase();
  if (platformType) where.platformType = normalizePlatform(platformType);
  const take = Math.min(100, Math.max(1, Number(limit) || 25));
  const pageNo = Math.max(1, Number(page) || 1);
  const [runs, total] = await Promise.all([
    prisma.sandboxRun.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (pageNo - 1) * take, take }),
    prisma.sandboxRun.count({ where }),
  ]);
  return {
    runs: runs.map(summarizeRun),
    pagination: { total, page: pageNo, limit: take, pages: Math.ceil(total / take) },
  };
}

async function getRunDetails({ runId, clientCode = null, includeLogs = false }) {
  const where = { runId };
  if (clientCode) where.clientCode = String(clientCode).toUpperCase();
  const run = await prisma.sandboxRun.findFirst({ where });
  if (!run) {
    const err = new Error('Sandbox run not found.');
    err.status = 404;
    throw err;
  }

  const [draftOrders, shipments] = await Promise.all([
    prisma.draftOrder.findMany({
      where: { environment: 'sandbox', sandboxRunId: run.runId },
      orderBy: { createdAt: 'asc' },
      include: { shipment: { select: { id: true, awb: true, status: true } } },
    }),
    prisma.shipment.findMany({
      where: { environment: 'sandbox', sandboxRunId: run.runId },
      orderBy: { createdAt: 'asc' },
      include: { trackingEvents: { orderBy: { timestamp: 'asc' }, take: 20 } },
    }),
  ]);

  const traceRows = toArray(run.orders).map((row) => normalizeTraceRow(row, run, shipments));

  return {
    ...summarizeRun(run),
    orders: traceRows,
    shipments,
    draftOrders,
    errors: toArray(run.errors),
    statusProgression: toArray(run.statusProgression),
    logs: includeLogs ? toArray(run.logs) : [],
    logCount: toArray(run.logs).length,
  };
}

async function getRunLogs({ runId, clientCode = null, level = null, step = null, search = null, limit = 200 }) {
  const details = await getRunDetails({ runId, clientCode, includeLogs: true });
  const lowerSearch = String(search || '').trim().toLowerCase();
  const levelFilter = String(level || '').trim().toLowerCase();
  const stepFilter = String(step || '').trim().toLowerCase();
  const take = Math.min(500, Math.max(1, Number(limit) || 200));
  const logs = toArray(details.logs).filter((log) => {
    if (levelFilter && levelFilter !== 'all' && String(log.level || 'info').toLowerCase() !== levelFilter) return false;
    if (stepFilter && stepFilter !== 'all' && String(log.step || '').toLowerCase() !== stepFilter) return false;
    if (!lowerSearch) return true;
    return [log.event, log.message, log.orderId, log.awb, log.shipmentId, log.requestId]
      .some((value) => String(value || '').toLowerCase().includes(lowerSearch));
  }).slice(-take);
  return {
    runId: details.runId,
    status: details.status,
    logs,
    errors: details.errors,
    filters: { level: levelFilter || 'all', step: stepFilter || 'all', search: lowerSearch, limit: take },
  };
}

async function getDashboard({ clientCode = null, limit = 25 } = {}) {
  const whereShipment = { environment: 'sandbox' };
  const whereOrder = { environment: 'sandbox' };
  if (clientCode) {
    whereShipment.clientCode = String(clientCode).toUpperCase();
    whereOrder.clientCode = String(clientCode).toUpperCase();
  }

  const [orders, shipments, trackingActive, recentShipments] = await Promise.all([
    prisma.draftOrder.count({ where: whereOrder }),
    prisma.shipment.count({ where: whereShipment }),
    prisma.trackingEvent.count({ where: { shipment: { is: whereShipment } } }),
    prisma.shipment.findMany({
      where: whereShipment,
      orderBy: { createdAt: 'desc' },
      take: Math.min(100, Math.max(1, Number(limit) || 25)),
      include: {
        client: { select: { code: true, company: true } },
        trackingEvents: { orderBy: { timestamp: 'desc' }, take: 3 },
      },
    }),
  ]);

  return {
    environment: 'sandbox',
    stages: {
      orderReceived: orders,
      shipmentCreated: shipments,
      appearsInClientPortal: shipments,
      appearsInOwnerPortal: shipments,
      trackingActive,
    },
    recentShipments: recentShipments.map((s) => ({
      id: s.id,
      awb: s.awb,
      clientCode: s.clientCode,
      client: s.client,
      status: s.status,
      courier: s.courier,
      sandboxRunId: s.sandboxRunId,
      sourcePlatform: s.sourcePlatform,
      flow: {
        orderReceived: true,
        shipmentCreated: true,
        appearsInClientPortal: Boolean(s.clientCode),
        appearsInOwnerPortal: true,
        trackingActive: (s.trackingEvents || []).length > 0,
      },
      trackingEvents: s.trackingEvents || [],
    })),
  };
}

async function deleteRun({ runId, clientCode = null }) {
  const where = { runId };
  if (clientCode) where.clientCode = String(clientCode).toUpperCase();
  const run = await prisma.sandboxRun.findFirst({ where });
  if (!run) {
    const err = new Error('Sandbox run not found.');
    err.status = 404;
    throw err;
  }

  // Delete associated sandbox shipments, tracking events, and draft orders
  const shipments = await prisma.shipment.findMany({
    where: { environment: 'sandbox', sandboxRunId: run.runId },
    select: { id: true },
  });
  const shipmentIds = shipments.map((s) => s.id);

  if (shipmentIds.length > 0) {
    await prisma.trackingEvent.deleteMany({ where: { shipmentId: { in: shipmentIds } } });
    await prisma.draftOrder.updateMany({
      where: { environment: 'sandbox', sandboxRunId: run.runId },
      data: { shipmentId: null },
    });
    await prisma.shipment.deleteMany({ where: { id: { in: shipmentIds } } });
  }
  await prisma.draftOrder.deleteMany({ where: { environment: 'sandbox', sandboxRunId: run.runId } });
  await prisma.sandboxRun.delete({ where: { runId: run.runId } });

  return { deleted: true, runId: run.runId, shipmentsDeleted: shipmentIds.length };
}

async function cleanupOldRuns({ olderThanDays = 7, clientCode = null } = {}) {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  const where = { createdAt: { lt: cutoff } };
  if (clientCode) where.clientCode = String(clientCode).toUpperCase();
  const runs = await prisma.sandboxRun.findMany({ where, select: { runId: true } });
  let totalDeleted = 0;
  for (const run of runs) {
    try {
      await deleteRun({ runId: run.runId, clientCode });
      totalDeleted += 1;
    } catch {
      // Skip runs that fail to delete
    }
  }
  return { totalDeleted, cutoffDate: cutoff.toISOString() };
}

async function exportRun({ runId, clientCode = null }) {
  const details = await getRunDetails({ runId, clientCode, includeLogs: true });
  return {
    exportedAt: new Date().toISOString(),
    format: 'json',
    run: details,
  };
}

async function simulateErrorScenario({ clientCode, scenario, platformType = 'custom', userId = null, requestId = null }) {
  const validScenarios = [...ERROR_SCENARIOS];
  const scenarioName = normalizeErrorScenario(scenario);
  if (!scenarioName || !validScenarios.includes(scenarioName)) {
    const err = new Error(`Invalid error scenario. Valid: ${validScenarios.join(', ')}`);
    err.status = 400;
    throw err;
  }

  const platform = normalizePlatform(platformType);
  const runId = makeSandboxRunId('ERR');
  await ensureSandboxRun({ runId, clientCode, platformType: platform, totalOrders: 1 });

  try {
    if (scenarioName === 'delivery_failure') {
      // delivery_failure creates a shipment then fails it
      const result = await createSandboxShipment({
        clientCode,
        payload: { sandboxRunId: runId, platformType: platform, requestId: requestId || makeRequestId() },
        platformType: platform,
        userId,
        scenario: 'delivery_failure',
        requestId,
      });
      return { runId, requestId: requestId || result.requestId || null, scenario: scenarioName, result, simulated: true };
    }

    // Other scenarios fail at order/shipment creation
    const result = await createSandboxShipment({
      clientCode,
      payload: { sandboxRunId: runId, platformType: platform, requestId: requestId || makeRequestId() },
      platformType: platform,
      userId,
      scenario: scenarioName,
      requestId,
    });
    return { runId, requestId: requestId || result.requestId || null, scenario: scenarioName, result, simulated: true };
  } catch (err) {
    // Error was already recorded in the run by createSandboxShipment
    return {
      runId,
      requestId: requestId || null,
      scenario: scenarioName,
      simulated: true,
      failed: true,
      error: { code: err.code || 'SANDBOX_ERROR', message: err.message, status: err.status || 500 },
    };
  }
}

module.exports = {
  PLATFORMS,
  ERROR_SCENARIOS,
  STATUS_FLOW,
  normalizePlatform,
  normalizeStatus,
  normalizeErrorScenario,
  mockCarrierResponse,
  createSandboxOrder,
  createSandboxShipment,
  bulkGenerate,
  progressShipment,
  getDashboard,
  listRuns,
  getRunDetails,
  getRunLogs,
  deleteRun,
  cleanupOldRuns,
  exportRun,
  simulateErrorScenario,
};
