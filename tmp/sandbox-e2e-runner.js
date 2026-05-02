'use strict';

process.env.DISABLE_BACKGROUND_JOBS = process.env.DISABLE_BACKGROUND_JOBS || 'true';

const path = require('path');
const crypto = require('crypto');
const request = require(path.join(__dirname, '..', 'backend', 'node_modules', 'supertest'));
const app = require(path.join(__dirname, '..', 'backend', 'src', 'app'));
const prisma = require(path.join(__dirname, '..', 'backend', 'src', 'config', 'prisma'));

const CLIENT_CODE = 'SEA HAWK';
const ADMIN = { email: 'admin@seahawk.com', password: 'Admin@12345' };
const CLIENT = { email: 'client.user@seahawk.com', password: 'Client@12345' };

const results = [];
let adminToken = null;
let clientToken = null;
let apiToken = null;
let created = { order: null, shipment: null, awb: null, runIds: [], bulk: null, errorRuns: [] };

function summarizeBody(body) {
  if (!body || typeof body !== 'object') return body;
  return {
    success: body.success,
    message: body.message,
    data: body.data,
    errors: body.errors,
  };
}

function addResult(step, passed, details = {}, critical = false) {
  results.push({
    step,
    passed,
    critical,
    details,
  });
}

function expect(condition, message, details = {}) {
  if (!condition) {
    const err = new Error(message);
    err.details = details;
    throw err;
  }
}

async function api(method, url, token, body = null, headers = {}) {
  let req = request(app)[method](url).set('Accept', 'application/json');
  if (token) req = req.set('Authorization', `Bearer ${token}`);
  for (const [key, value] of Object.entries(headers)) req = req.set(key, value);
  if (body !== null) req = req.send(body);
  return req;
}

async function step(name, fn, { failFast = false, critical = false } = {}) {
  try {
    const details = await fn();
    addResult(name, true, details || {}, critical);
    return details;
  } catch (err) {
    addResult(name, false, {
      message: err.message,
      details: err.details || null,
    }, critical);
    if (failFast) {
      const stop = new Error(`STOP: ${name} failed: ${err.message}`);
      stop.report = buildReport(true);
      throw stop;
    }
    return null;
  }
}

async function login(label, credentials) {
  const res = await api('post', '/api/auth/login', null, {
    email: credentials.email,
    password: credentials.password,
    rememberMe: false,
  });
  expect(res.status === 200 && res.body?.success, `${label} login failed`, {
    status: res.status,
    body: summarizeBody(res.body),
  });
  expect(res.body?.data?.accessToken, `${label} login did not return accessToken`, summarizeBody(res.body));
  return { token: res.body.data.accessToken, user: res.body.data.user };
}

function firstData(res) {
  return res.body?.data || {};
}

async function verifyTrackingStatus(awb, expectedStatus) {
  const res = await api('get', `/api/tracking/${encodeURIComponent(awb)}`, adminToken);
  expect(res.status === 200 && res.body?.success, `tracking lookup failed for ${awb}`, {
    status: res.status,
    body: summarizeBody(res.body),
  });
  const status = res.body?.data?.shipment?.status;
  expect(status === expectedStatus, `tracking status expected ${expectedStatus}, got ${status}`, {
    awb,
    status,
    body: summarizeBody(res.body),
  });
  return res.body.data;
}

async function main() {
  await step('Auth: admin and client.user login', async () => {
    const admin = await login('admin', ADMIN);
    const client = await login('client.user', CLIENT);
    adminToken = admin.token;
    clientToken = client.token;
    return {
      admin: { email: admin.user.email, role: admin.user.role, clientCode: admin.user.clientCode || null },
      client: { email: client.user.email, role: client.user.role, clientCode: client.user.clientCode || null },
    };
  }, { failFast: true, critical: true });

  await step('Client API key: create sandbox key and authenticate public API', async () => {
    const keyName = `Sandbox E2E ${Date.now()}`;
    const keyRes = await api('post', '/api/portal/developer/keys', clientToken, {
      name: keyName,
      scopes: ['orders:create', 'sandbox:write'],
      mode: 'sandbox',
    });
    expect(keyRes.status === 200 && keyRes.body?.success, 'client.user could not create sandbox API key', {
      status: keyRes.status,
      body: summarizeBody(keyRes.body),
    });
    apiToken = keyRes.body.data.token;
    expect(apiToken, 'created API key did not include one-time token', summarizeBody(keyRes.body));

    const pubRes = await request(app)
      .post(`/api/public/integrations/ecommerce/custom/${encodeURIComponent(CLIENT_CODE)}`)
      .set('x-api-key', apiToken)
      .set('Accept', 'application/json')
      .send({ id: `api-key-check-${Date.now()}`, customer: { name: 'API Key Check' } });
    expect(pubRes.status === 202 && pubRes.body?.success, 'sandbox API key was not accepted by public integration API', {
      status: pubRes.status,
      body: summarizeBody(pubRes.body),
    });
    return {
      keyName,
      publicApiStatus: pubRes.status,
      publicApiProvider: pubRes.body.data.provider,
      publicApiMode: pubRes.body.data.mode,
      accepted: pubRes.body.data.accepted,
    };
  }, { failFast: true, critical: true });

  await step('Step 1: GET /api/sandbox/environment', async () => {
    const res = await api('get', '/api/sandbox/environment', adminToken);
    expect(res.status === 200 && res.body?.success, 'sandbox environment API unreachable or failed', {
      status: res.status,
      body: summarizeBody(res.body),
    });
    const data = firstData(res);
    expect(data.environment === 'sandbox', 'environment field is not "sandbox"', { data });
    return data;
  }, { failFast: true, critical: true });

  await step('Step 2: POST /api/sandbox/orders', async () => {
    const res = await api('post', '/api/sandbox/orders', adminToken, {
      clientCode: CLIENT_CODE,
      customer: { name: 'Test User', phone: '9999999999' },
      address: { city: 'Chennai', pincode: '600002' },
      destination: 'Chennai',
      pincode: '600002',
      weight: 0.5,
      platformType: 'custom',
    });
    expect(res.status === 201 && res.body?.success, 'order creation failed', { status: res.status, body: summarizeBody(res.body) });
    const data = firstData(res);
    expect(data.order_id, 'order_id missing', data);
    created.order = data;
    created.runIds.push(data.sandboxRunId);
    return { order_id: data.order_id, sandboxRunId: data.sandboxRunId, status: data.status };
  }, { failFast: true, critical: true });

  await step('Step 3: POST /api/sandbox/shipments', async () => {
    const res = await api('post', '/api/sandbox/shipments', adminToken, {
      clientCode: CLIENT_CODE,
      orderRef: created.order.order_id,
      consignee: 'Test User',
      destination: 'Chennai',
      phone: '9999999999',
      pincode: '600002',
      weight: 0.5,
      sandboxRunId: created.order.sandboxRunId,
      platformType: 'custom',
    });
    expect(res.status === 201 && res.body?.success, 'shipment creation failed', { status: res.status, body: summarizeBody(res.body) });
    const data = firstData(res);
    expect(data.shipment_id && data.awb && data.status === 'Created', 'shipment_id/AWB/status invalid', data);
    created.shipment = data;
    created.awb = data.awb;
    return { shipment_id: data.shipment_id, awb: data.awb, status: data.status, sandboxRunId: data.sandboxRunId };
  }, { failFast: true, critical: true });

  await step('Step 4: GET /api/tracking/:awb', async () => {
    const data = await verifyTrackingStatus(created.awb, 'Created');
    return { awb: created.awb, status: data.shipment.status, events: data.events.length };
  }, { failFast: true, critical: true });

  await step('Step 5: Progress statuses and verify tracking', async () => {
    const statuses = ['In Transit', 'Out for Delivery', 'Delivered'];
    const checks = [];
    for (const status of statuses) {
      const progress = await api('post', `/api/sandbox/shipments/${encodeURIComponent(created.awb)}/progress`, adminToken, { status });
      expect(progress.status === 200 && progress.body?.success, `progress to ${status} failed`, {
        status: progress.status,
        body: summarizeBody(progress.body),
      });
      expect(progress.body?.data?.status === status, `progress response status mismatch for ${status}`, summarizeBody(progress.body));
      const tracking = await verifyTrackingStatus(created.awb, status);
      checks.push({ status, trackingEvents: tracking.events.length });
    }
    return { awb: created.awb, checks };
  }, { failFast: true, critical: true });

  await step('Step 6: POST /api/sandbox/bulk-orders', async () => {
    const res = await api('post', '/api/sandbox/bulk-orders', adminToken, {
      clientCode: CLIENT_CODE,
      count: 10,
      platformType: 'shopify',
      createShipments: true,
    });
    expect(res.status === 201 && res.body?.success, 'bulk order creation failed', { status: res.status, body: summarizeBody(res.body) });
    const data = firstData(res);
    const rows = Array.isArray(data.results) ? data.results : [];
    expect(data.count === 10 && rows.length === 10, 'bulk result count mismatch', data);
    expect(rows.every((row) => row.order_id), 'not all bulk orders have order_id', rows);
    expect(rows.every((row) => row.shipment_id && row.awb), 'not all bulk shipments have shipment_id/AWB', rows);
    created.bulk = data;
    created.runIds.push(data.runId);
    return { runId: data.runId, orders: rows.length, shipments: rows.filter((r) => r.shipment_id).length, awbs: rows.filter((r) => r.awb).length };
  }, { failFast: true, critical: true });

  await step('Step 7: Error simulation scenarios', async () => {
    const scenarios = [
      ['Invalid Pincode', 'invalid_address'],
      ['Courier Unavailable', 'courier_unavailable'],
      ['API Failure', 'api_failure'],
      ['Delivery Failure', 'delivery_failure'],
    ];
    const out = [];
    for (const [label, scenario] of scenarios) {
      const res = await api('post', '/api/sandbox/simulate-error', adminToken, {
        clientCode: CLIENT_CODE,
        scenario,
        platformType: 'shopify',
      });
      expect(res.status === 200 && res.body?.success, `${label} simulation endpoint failed`, {
        status: res.status,
        body: summarizeBody(res.body),
      });
      const data = firstData(res);
      expect(data.simulated === true, `${label} did not mark simulated=true`, data);
      if (scenario === 'delivery_failure') {
        expect(data.result?.status === 'Failed Delivery', 'Delivery Failure did not create failed shipment', data);
      } else {
        expect(data.failed === true && data.error?.message, `${label} did not return meaningful error`, data);
      }
      created.errorRuns.push(data.runId);
      out.push({ label, scenario, runId: data.runId, failed: Boolean(data.failed), status: data.result?.status || data.error?.status, message: data.error?.message || null });
    }
    return { scenarios: out };
  }, { failFast: true, critical: true });

  await step('Step 8: Portal visibility', async () => {
    const clientShipments = await api('get', `/api/portal/shipments?search=${encodeURIComponent(created.awb)}&limit=25`, clientToken);
    expect(clientShipments.status === 200 && clientShipments.body?.success, 'client portal shipments failed', {
      status: clientShipments.status,
      body: summarizeBody(clientShipments.body),
    });
    const clientRows = clientShipments.body.data.shipments || [];
    expect(clientRows.some((s) => s.awb === created.awb), 'created AWB not visible in client portal', clientShipments.body.data);

    const ownerShipments = await api('get', `/api/tracking?search=${encodeURIComponent(created.awb)}&limit=25`, adminToken);
    expect(ownerShipments.status === 200 && ownerShipments.body?.success, 'owner tracking dashboard failed', {
      status: ownerShipments.status,
      body: summarizeBody(ownerShipments.body),
    });
    const ownerRows = ownerShipments.body.data.shipments || [];
    expect(ownerRows.some((s) => s.awb === created.awb), 'created AWB not visible in owner portal/tracking dashboard', ownerShipments.body.data);

    const portalTrack = await api('get', `/api/portal/tracking/${encodeURIComponent(created.awb)}`, clientToken);
    expect(portalTrack.status === 200 && portalTrack.body?.success, 'client portal tracking page failed', {
      status: portalTrack.status,
      body: summarizeBody(portalTrack.body),
    });
    return {
      clientPortalVisible: true,
      ownerPortalVisible: true,
      trackingPageStatus: portalTrack.body.data.shipment.status,
    };
  }, { failFast: true, critical: true });

  await step('Step 9: GET /api/sandbox/dashboard', async () => {
    const res = await api('get', `/api/sandbox/dashboard?clientCode=${encodeURIComponent(CLIENT_CODE)}&limit=50`, adminToken);
    expect(res.status === 200 && res.body?.success, 'sandbox dashboard failed', { status: res.status, body: summarizeBody(res.body) });
    const data = firstData(res);
    const recentAwbs = (data.recentShipments || []).map((s) => s.awb);
    expect(data.environment === 'sandbox', 'dashboard environment mismatch', data);
    expect(data.stages.orderReceived >= 11, 'dashboard order count lower than created data', data.stages);
    expect(data.stages.shipmentCreated >= 11, 'dashboard shipment count lower than created data', data.stages);
    expect(recentAwbs.includes(created.awb), 'dashboard recentShipments missing primary AWB', recentAwbs);
    return { stages: data.stages, primaryAwbVisible: true };
  }, { failFast: true, critical: true });

  await step('Step 10: Flow trace validation for at least 3 orders', async () => {
    const runId = created.bulk.runId;
    const res = await api('get', `/api/sandbox/runs/${encodeURIComponent(runId)}?clientCode=${encodeURIComponent(CLIENT_CODE)}`, adminToken);
    expect(res.status === 200 && res.body?.success, 'bulk run details failed', { status: res.status, body: summarizeBody(res.body) });
    const traces = (res.body.data.orders || []).slice(0, 3);
    expect(traces.length >= 3, 'fewer than 3 trace rows available', res.body.data);
    for (const trace of traces) {
      expect(trace.flow?.orderReceived, 'trace missing order created', trace);
      expect(trace.flow?.shipmentCreated, 'trace missing shipment created', trace);
      expect(trace.flow?.trackingActive, 'trace missing tracking active', trace);
      expect(trace.awb, 'trace missing AWB', trace);
      const tracking = await verifyTrackingStatus(trace.awb, trace.status || 'Created');
      expect(tracking.shipment.awb === trace.awb, 'trace tracking lookup AWB mismatch', tracking.shipment);
    }
    return { runId, traces: traces.map((t) => ({ orderId: t.orderId, shipmentId: t.shipmentId, awb: t.awb, flow: t.flow })) };
  }, { failFast: true, critical: true });

  await step('Step 11: Logging check', async () => {
    const runIds = [created.order.sandboxRunId, created.bulk.runId, ...created.errorRuns].filter(Boolean);
    const logChecks = [];
    for (const runId of runIds) {
      const res = await api('get', `/api/sandbox/runs/${encodeURIComponent(runId)}/logs?clientCode=${encodeURIComponent(CLIENT_CODE)}`, adminToken);
      expect(res.status === 200 && res.body?.success, `logs endpoint failed for ${runId}`, { status: res.status, body: summarizeBody(res.body) });
      const logs = res.body.data.logs || [];
      const errors = res.body.data.errors || [];
      expect(logs.length > 0, `no logs found for ${runId}`, res.body.data);
      logChecks.push({
        runId,
        logCount: logs.length,
        errorCount: errors.length,
        hasOrderCreation: logs.some((l) => l.step === 'order_created'),
        hasShipmentCreation: logs.some((l) => l.step === 'shipment_created'),
        hasTracking: logs.some((l) => l.step === 'tracking_created' || l.step === 'status_progressed'),
        hasErrors: errors.length > 0 || logs.some((l) => l.level === 'error'),
      });
    }
    expect(logChecks.some((r) => r.hasOrderCreation), 'no order creation logs found', logChecks);
    expect(logChecks.some((r) => r.hasShipmentCreation), 'no shipment creation logs found', logChecks);
    expect(logChecks.some((r) => r.hasTracking), 'no tracking logs found', logChecks);
    expect(logChecks.some((r) => r.hasErrors), 'no error logs found', logChecks);
    return { runsChecked: logChecks.length, logChecks };
  }, { failFast: true, critical: true });
}

function buildReport(stopped = false) {
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;
  return {
    summary: {
      totalTestsRun: total,
      passed,
      failed,
      stoppedEarly: stopped,
      sandboxWorking100Percent: failed === 0 && !stopped,
    },
    details: results,
    criticalIssues: results
      .filter((r) => !r.passed || r.critical)
      .filter((r) => !r.passed)
      .map((r) => ({
        step: r.step,
        message: r.details?.message || 'Failed',
        details: r.details?.details || null,
      })),
    artifacts: {
      clientCode: CLIENT_CODE,
      primaryAwb: created.awb,
      runIds: [...new Set([...created.runIds, ...created.errorRuns].filter(Boolean))],
    },
  };
}

(async () => {
  let report;
  try {
    await main();
    report = buildReport(false);
  } catch (err) {
    report = err.report || buildReport(true);
    if (!err.report) {
      report.criticalIssues.push({ step: 'Runner', message: err.message, details: err.details || null });
      report.summary.failed += 1;
      report.summary.totalTestsRun += 1;
      report.summary.stoppedEarly = true;
      report.summary.sandboxWorking100Percent = false;
    }
  } finally {
    try {
      await prisma.$disconnect();
    } catch {}
  }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exit(report.summary.failed === 0 ? 0 : 1);
})();
