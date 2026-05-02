const { chromium } = require('@playwright/test');
const crypto = require('crypto');

const BACKEND = process.env.QA_BACKEND || 'http://127.0.0.1:3001';
const FRONTEND = process.env.QA_FRONTEND || 'http://127.0.0.1:5174';
const EMAIL = process.env.QA_EMAIL || 'admin@seahawk.com';
const PASSWORD = process.env.QA_PASSWORD || 'Admin@12345';
const CLIENT = process.env.QA_CLIENT || 'SAMPLE';
const RUN = `QA${Date.now().toString().slice(-8)}`;
const today = new Date().toISOString().slice(0, 10);

const prisma = require('../backend/src/config/prisma');

class Jar {
  constructor() { this.cookies = new Map(); }
  add(setCookie) {
    const values = Array.isArray(setCookie) ? setCookie : (setCookie ? [setCookie] : []);
    for (const raw of values) {
      const pair = String(raw).split(';')[0];
      const idx = pair.indexOf('=');
      if (idx > 0) this.cookies.set(pair.slice(0, idx), pair.slice(idx + 1));
    }
  }
  header() {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }
  get(name) { return this.cookies.get(name); }
}

const results = [];
const created = { shipments: [], ndrs: [], apiKeys: [], drafts: [], sandboxRunIds: [] };
let token = '';
let jar = new Jar();

function record(feature, status, issue = '', severity = '', evidence = {}) {
  results.push({ feature, status, issue, severity, evidence });
}

async function req(path, { method = 'GET', body, headers = {}, useAuth = true, useCsrf = true } = {}) {
  const h = { ...headers };
  if (body !== undefined) h['content-type'] = 'application/json';
  if (useAuth && token) h.authorization = `Bearer ${token}`;
  if (useCsrf && jar.get('csrf_token')) h['x-csrf-token'] = jar.get('csrf_token');
  if (jar.header()) h.cookie = jar.header();
  const start = performance.now();
  const res = await fetch(`${BACKEND}${path}`, {
    method,
    headers: h,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  jar.add(res.headers.getSetCookie ? res.headers.getSetCookie() : res.headers.get('set-cookie'));
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch {}
  return { status: res.status, ok: res.ok, json, text, ms: Math.round(performance.now() - start), headers: res.headers };
}

function dataOf(response) {
  return response.json?.data ?? response.json;
}

async function loginApi() {
  await req('/api/health', { useAuth: false, useCsrf: false });
  const login = await req('/api/auth/login', {
    method: 'POST',
    body: { email: EMAIL, password: PASSWORD },
    useAuth: false,
  });
  if (!login.ok) throw new Error(`Login failed: ${login.status} ${login.text}`);
  token = login.json.data.accessToken;
  record('Authentication - API login', 'PASS', '', '', { user: login.json.data.user.email, role: login.json.data.user.role, responseMs: login.ms });
  const me = await req('/api/auth/me');
  record('Authentication - session /me', me.ok && dataOf(me)?.email === EMAIL ? 'PASS' : 'FAIL', me.ok ? '' : me.text, me.ok ? '' : 'Critical', { responseMs: me.ms });
}

async function createShipment(suffix, overrides = {}) {
  const awb = `${RUN}${suffix}`;
  const body = {
    date: today,
    clientCode: CLIENT,
    awb,
    consignee: `QA ${suffix}`,
    destination: 'DELHI',
    pincode: '110001',
    weight: 0.5,
    amount: 0,
    courier: 'Delhivery',
    department: 'QA',
    service: 'Standard',
    remarks: `OWNER_PORTAL_E2E_${RUN}`,
    ...overrides,
  };
  const res = await req('/api/shipments', { method: 'POST', body });
  if (res.ok) created.shipments.push(dataOf(res).id);
  return { res, awb };
}

async function apiBusinessFlows() {
  const before = await prisma.shipment.count({ where: { awb: { startsWith: RUN } } });
  const live = await createShipment('LIVE');
  const stored = live.res.ok ? await prisma.shipment.findUnique({ where: { awb: live.awb } }) : null;
  record('Shipment Creation - live API', live.res.ok && stored?.awb === live.awb && stored.status === 'Booked' ? 'PASS' : 'FAIL',
    live.res.ok ? '' : live.res.text, live.res.ok ? '' : 'Critical', { awb: live.awb, storedStatus: stored?.status, responseMs: live.res.ms });

  const invalid = await req('/api/shipments', { method: 'POST', body: { clientCode: CLIENT, awb: '', weight: -1 } });
  record('Shipment Creation - invalid input handling', invalid.status === 400 ? 'PASS' : 'FAIL',
    invalid.status === 400 ? '' : `Expected 400, got ${invalid.status}`, invalid.status === 400 ? '' : 'Critical',
    { status: invalid.status, message: invalid.json?.message, errors: invalid.json?.errors });

  const dryRun = await req('/api/shipments?dryRun=1', { method: 'POST', body: { clientCode: CLIENT, awb: `${RUN}DRY`, weight: 0.5, amount: 0 } });
  const dryStored = await prisma.shipment.findUnique({ where: { awb: `${RUN}DRY` } }).catch(() => null);
  record('Shipment Creation - dry run', dryRun.status === 404 || dryStored ? 'FAIL' : 'PASS',
    dryRun.status === 201 && dryStored ? 'dryRun query still created a production shipment; no dry-run contract exists.' : '',
    dryRun.status === 201 && dryStored ? 'Critical' : '', { status: dryRun.status, stored: Boolean(dryStored) });
  if (dryStored) created.shipments.push(dryStored.id);

  const lifecycle = await createShipment('FLOW');
  const flowId = dataOf(lifecycle.res)?.id;
  const direct = await req(`/api/shipments/${flowId}/status`, { method: 'PATCH', body: { status: 'InTransit' } });
  record('Shipment Management - invalid transition guard', direct.status === 400 ? 'PASS' : 'FAIL',
    direct.status === 400 ? '' : `Expected 400 guard rejection, got ${direct.status}`,
    direct.status === 400 ? '' : 'Critical', { status: direct.status, message: direct.json?.message });
  for (const status of ['PickedUp', 'InTransit', 'OutForDelivery', 'Delivered']) {
    const step = await req(`/api/shipments/${flowId}/status`, { method: 'PATCH', body: { status } });
    if (!step.ok) throw new Error(`Lifecycle ${status} failed: ${step.status} ${step.text}`);
  }
  const flowFinal = await prisma.shipment.findUnique({ where: { id: flowId }, include: { trackingEvents: true } });
  record('Shipment Management - status lifecycle', flowFinal.status === 'Delivered' && flowFinal.trackingEvents.length >= 4 ? 'PASS' : 'FAIL',
    flowFinal.status === 'Delivered' ? '' : `Final status ${flowFinal.status}`, flowFinal.status === 'Delivered' ? '' : 'Critical',
    { awb: lifecycle.awb, finalStatus: flowFinal.status, trackingEvents: flowFinal.trackingEvents.length });

  const manual = await createShipment('MANUAL');
  const manualId = dataOf(manual.res).id;
  await req(`/api/shipments/${manualId}`, { method: 'PUT', body: { destination: 'MUMBAI', consignee: 'QA MANUAL EDIT' } });
  const manualOverride = await req(`/api/shipments/${manualId}/manual-status`, { method: 'PATCH', body: { status: 'RTO', note: 'QA forced RTO' } });
  const manualStored = await prisma.shipment.findUnique({ where: { id: manualId } });
  record('Shipment Management - manual update and override', manualOverride.ok && manualStored.status === 'RTO' && manualStored.destination === 'MUMBAI' ? 'PASS' : 'FAIL',
    manualOverride.ok ? '' : manualOverride.text, manualOverride.ok ? '' : 'Critical', { awb: manual.awb, status: manualStored.status, destination: manualStored.destination });

  const ndrShip = await createShipment('NDR');
  const ndrCreate = await req('/api/ndr', { method: 'POST', body: { awb: ndrShip.awb, reason: 'Customer not available', description: `QA ${RUN}`, attemptNo: 1 } });
  const ndr = dataOf(ndrCreate);
  if (ndr?.id) created.ndrs.push(ndr.id);
  const ndrPatch = ndr?.id ? await req(`/api/ndr/${ndr.id}`, { method: 'PATCH', body: { action: 'RTO' } }) : { ok: false, text: 'NDR not created' };
  const ndrStored = await prisma.shipment.findUnique({ where: { awb: ndrShip.awb }, include: { ndrEvents: true } });
  record('Shipment Management - NDR to RTO handling', ndrCreate.ok && ndrPatch.ok && ndrStored.status === 'RTO' && ndrStored.ndrEvents.length > 0 ? 'PASS' : 'FAIL',
    ndrCreate.ok ? (ndrPatch.ok ? '' : ndrPatch.text) : ndrCreate.text, ndrCreate.ok && ndrPatch.ok ? '' : 'Critical',
    { awb: ndrShip.awb, shipmentStatus: ndrStored?.status, ndrStatus: ndrStored?.ndrStatus, events: ndrStored?.ndrEvents.length });

  const filtered = await req(`/api/shipments?client=${CLIENT}&status=Delivered&q=${lifecycle.awb}&dateFrom=${today}&dateTo=${today}&limit=10&page=1`);
  const rows = dataOf(filtered) || [];
  const pagination = filtered.json?.pagination;
  record('Filters & Search - client/date/status/search', filtered.ok && rows.length === 1 && rows[0].awb === lifecycle.awb ? 'PASS' : 'FAIL',
    filtered.ok ? '' : filtered.text, filtered.ok ? '' : 'Critical', { returned: rows.length, total: pagination?.total, awb: rows[0]?.awb });

  const page1 = await req(`/api/shipments?client=${CLIENT}&limit=10&page=1`);
  const page2 = await req(`/api/shipments?client=${CLIENT}&limit=10&page=2`);
  record('Filters & Search - pagination', page1.ok && page2.ok && page1.json.pagination?.limit === 10 ? 'PASS' : 'FAIL',
    page1.ok && page2.ok ? '' : 'Pagination request failed', 'Medium',
    { page1Total: page1.json?.pagination?.total, page1Rows: dataOf(page1)?.length, page2Rows: dataOf(page2)?.length });

  const exportAll = await req(`/api/shipments/export?client=${CLIENT}&status=Delivered`, { headers: { accept: 'text/csv' } });
  const csvLines = exportAll.text.trim().split(/\r?\n/);
  const deliveredCount = await prisma.shipment.count({ where: { clientCode: CLIENT, status: 'Delivered' } });
  record('Export Functionality - filtered CSV full dataset', exportAll.ok && csvLines.length - 1 === deliveredCount ? 'PASS' : 'FAIL',
    exportAll.ok ? `CSV rows ${csvLines.length - 1} did not equal DB count ${deliveredCount}` : exportAll.text,
    exportAll.ok && csvLines.length - 1 === deliveredCount ? '' : 'Critical',
    { csvRows: csvLines.length - 1, dbRows: deliveredCount, includesQaAwb: exportAll.text.includes(lifecycle.awb) });

  const beforeProduction = await prisma.shipment.count({ where: { environment: 'production', awb: { startsWith: RUN } } });
  const sandbox = await req('/api/sandbox/shipments', {
    method: 'POST',
    body: { clientCode: CLIENT, platformType: 'qa', order_number: `${RUN}-SBX`, consignee: 'QA Sandbox', destination: 'Bangalore', pincode: '560001', weight: 0.5 },
  });
  const sandboxAwb = dataOf(sandbox)?.shipment?.awb || dataOf(sandbox)?.awb;
  if (dataOf(sandbox)?.runId) created.sandboxRunIds.push(dataOf(sandbox).runId);
  const sandboxStored = sandboxAwb ? await prisma.shipment.findUnique({ where: { awb: sandboxAwb } }) : null;
  const afterProduction = await prisma.shipment.count({ where: { environment: 'production', awb: { startsWith: RUN } } });
  record('Sandbox vs Production - data separation', sandbox.ok && sandboxStored?.environment === 'sandbox' && beforeProduction === afterProduction ? 'PASS' : 'FAIL',
    sandbox.ok ? '' : sandbox.text, sandbox.ok ? '' : 'Critical',
    { sandboxAwb, sandboxEnvironment: sandboxStored?.environment, productionBefore: beforeProduction, productionAfter: afterProduction });

  await integrationFlow();

  const tracking = await req(`/api/tracking/${lifecycle.awb}`);
  record('API Integration - tracking timeline consistency', tracking.ok && dataOf(tracking)?.shipment?.status === 'Delivered' && dataOf(tracking)?.events?.length >= 4 ? 'PASS' : 'FAIL',
    tracking.ok ? '' : tracking.text, tracking.ok ? '' : 'Critical',
    { awb: lifecycle.awb, status: dataOf(tracking)?.shipment?.status, events: dataOf(tracking)?.events?.length });

  const after = await prisma.shipment.count({ where: { awb: { startsWith: RUN } } });
  record('Backend Data Integrity - QA records persisted', after > before ? 'PASS' : 'FAIL', after > before ? '' : 'No QA records found after creation', 'Critical', { before, after, runPrefix: RUN });
}

async function integrationFlow() {
  const original = await prisma.client.findUnique({ where: { code: CLIENT }, select: { brandSettings: true } });
  const settings = await req(`/api/portal/developer/integrations/settings?clientCode=${CLIENT}`, {
    method: 'POST',
    body: {
      provider: 'custom',
      enabled: true,
      sourceLabel: 'QA Custom',
      defaultWeightKg: 0.5,
      mappings: { referenceId: 'id', consignee: 'customer.name', destination: 'shipping.city', phone: 'customer.phone', pincode: 'shipping.pin', weight: 'weight' },
      staticValues: {},
      connector: { enabled: false },
    },
  });
  const key = await req(`/api/portal/developer/keys?clientCode=${CLIENT}`, {
    method: 'POST',
    body: { name: `QA live ${RUN}`, scopes: ['orders:create'], mode: 'live' },
  });
  const apiKey = dataOf(key)?.token;
  if (dataOf(key)?.id) created.apiKeys.push(dataOf(key).id);

  const noCsrf = await fetch(`${BACKEND}/api/public/integrations/ecommerce/custom/${CLIENT}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey || 'missing' },
    body: JSON.stringify({ id: `${RUN}-ORDER-NOCSRF`, customer: { name: 'QA No CSRF' }, shipping: { city: 'Delhi', pin: '110001' } }),
  });
  record('API Integration - external order without CSRF cookie', noCsrf.status === 403 ? 'FAIL' : 'PASS',
    noCsrf.status === 403 ? 'External API-key endpoint is blocked by CSRF middleware unless caller first obtains CSRF cookie; real ecommerce systems will not do that.' : '',
    noCsrf.status === 403 ? 'Critical' : '', { status: noCsrf.status });

  const ingest = await req(`/api/public/integrations/ecommerce/custom/${CLIENT}`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'idempotency-key': `${RUN}-ORDER-1` },
    body: { id: `${RUN}-ORDER-1`, customer: { name: 'QA API Customer', phone: '9999999999' }, shipping: { city: 'Delhi', pin: '110001' }, weight: 0.5 },
    useAuth: false,
    useCsrf: true,
  });
  const draftId = dataOf(ingest)?.draftId;
  if (draftId) created.drafts.push(draftId);
  const draft = draftId ? await prisma.draftOrder.findUnique({ where: { id: draftId } }) : null;
  record('API Integration - ecommerce order creates draft', settings.ok && key.ok && ingest.status === 201 && draft?.referenceId === `${RUN}-ORDER-1` ? 'PASS' : 'FAIL',
    ingest.ok ? '' : ingest.text, ingest.ok ? '' : 'Critical', { draftId, referenceId: draft?.referenceId, environment: draft?.environment });

  const replay = await req(`/api/public/integrations/ecommerce/custom/${CLIENT}`, {
    method: 'POST',
    headers: { 'x-api-key': apiKey, 'idempotency-key': `${RUN}-ORDER-1` },
    body: { id: `${RUN}-ORDER-1`, customer: { name: 'QA API Customer' }, shipping: { city: 'Delhi', pin: '110001' }, weight: 0.5 },
    useAuth: false,
    useCsrf: true,
  });
  record('API Integration - idempotency replay', replay.ok && dataOf(replay)?.duplicate === true ? 'PASS' : 'FAIL',
    replay.ok ? '' : replay.text, replay.ok ? '' : 'Medium', { status: replay.status, duplicate: dataOf(replay)?.duplicate });

  const sandboxKey = await req(`/api/portal/developer/keys?clientCode=${CLIENT}`, {
    method: 'POST',
    body: { name: `QA sandbox ${RUN}`, scopes: ['orders:create'], mode: 'sandbox' },
  });
  const sbxKey = dataOf(sandboxKey)?.token;
  if (dataOf(sandboxKey)?.id) created.apiKeys.push(dataOf(sandboxKey).id);
  const sbxDraftBefore = await prisma.draftOrder.count({ where: { referenceId: `${RUN}-ORDER-SBX` } });
  const sbxIngest = await req(`/api/public/integrations/ecommerce/custom/${CLIENT}`, {
    method: 'POST',
    headers: { 'x-api-key': sbxKey },
    body: { id: `${RUN}-ORDER-SBX`, customer: { name: 'QA Sandbox API' }, shipping: { city: 'Delhi', pin: '110001' } },
    useAuth: false,
    useCsrf: true,
  });
  const sbxDraftAfter = await prisma.draftOrder.count({ where: { referenceId: `${RUN}-ORDER-SBX` } });
  record('Sandbox vs Production - API key mode separation', sbxIngest.status === 202 && sbxDraftBefore === sbxDraftAfter ? 'PASS' : 'FAIL',
    sbxIngest.ok ? '' : sbxIngest.text, sbxIngest.ok ? '' : 'Critical', { status: sbxIngest.status, draftBefore: sbxDraftBefore, draftAfter: sbxDraftAfter });

  await prisma.client.update({ where: { code: CLIENT }, data: { brandSettings: original?.brandSettings || {} } }).catch(() => {});
}

async function uiFlows() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  try {
    await page.goto(`${FRONTEND}/login`, { waitUntil: 'domcontentloaded' });
    await page.locator('#email').fill(EMAIL);
    await page.locator('#password').fill(PASSWORD);
    await page.getByRole('button', { name: /Launch Dashboard/i }).click();
    await page.waitForURL(/\/app/, { timeout: 20000 });
    await page.getByText(/Command Center/i).waitFor({ timeout: 20000 }).catch(() => {});
    record('Authentication - UI login redirect', 'PASS', '', '', { url: page.url() });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForURL(/\/app/, { timeout: 20000 });
    await page.getByText(/Command Center/i).waitFor({ timeout: 20000 }).catch(() => {});
    record('Authentication - UI session persists after reload', 'PASS', '', '', { url: page.url() });

    const uiAwb = `${RUN}UI`;
    await page.goto(`${FRONTEND}/app/entry`, { waitUntil: 'domcontentloaded' });
    await page.locator('#clientCode').selectOption(CLIENT);
    await page.locator('#awb').fill(uiAwb);
    await page.locator('#consignee').fill('QA UI CUSTOMER');
    await page.locator('#destination').fill('GURGAON');
    await page.locator('#courier').selectOption('Delhivery');
    await page.locator('#weight').fill('0.5');
    await page.locator('#amount').fill('0');
    await page.getByRole('button', { name: /Complete Booking/i }).click();
    await page.getByText(`Last Saved: ${uiAwb}`).waitFor({ timeout: 20000 });
    const uiStored = await prisma.shipment.findUnique({ where: { awb: uiAwb } });
    if (uiStored?.id) created.shipments.push(uiStored.id);
    record('Shipment Creation - UI quick entry', uiStored?.awb === uiAwb ? 'PASS' : 'FAIL', uiStored ? '' : 'UI success did not persist to DB', uiStored ? '' : 'Critical', { awb: uiAwb, id: uiStored?.id });

    await page.goto(`${FRONTEND}/app/shipments`, { waitUntil: 'domcontentloaded' });
    await page.getByPlaceholder(/Search by AWB/i).fill(uiAwb).catch(async () => {
      const search = page.locator('input[placeholder*="Search"]').first();
      await search.fill(uiAwb);
    });
    await page.getByRole('button', { name: /Refresh List/i }).click().catch(() => {});
    await page.getByText(uiAwb).waitFor({ timeout: 20000 }).catch(() => {});
    const rowVisible = await page.getByText(uiAwb).isVisible().catch(() => false);
    record('Shipment Management - UI search reflects backend', rowVisible ? 'PASS' : 'FAIL', rowVisible ? '' : 'Created UI AWB not visible in shipment search', rowVisible ? '' : 'Critical', { awb: uiAwb });

    const navTargets = ['/app', '/app/shipments', '/app/ndr', '/app/sandbox-runs', '/app/pickups', '/app/track'];
    const broken = [];
    for (const target of navTargets) {
      const r = await page.goto(`${FRONTEND}${target}`, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      const text = await page.locator('body').innerText({ timeout: 5000 }).catch(() => '');
      if (!r?.ok() || /Endpoint not found|Something went wrong|Page not found/i.test(text)) broken.push({ target, status: r?.status(), text: text.slice(0, 80) });
    }
    record('UI/UX Consistency - navigation and pages', broken.length === 0 ? 'PASS' : 'FAIL', broken.length ? 'Broken/errored pages found' : '', broken.length ? 'Critical' : '', { broken });

    await page.goto(`${FRONTEND}/app`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /sign out/i }).waitFor({ timeout: 10000 }).catch(() => {});
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
    if (await logoutButton.count()) {
      await logoutButton.first().click();
      await page.waitForURL(/login|\/$/, { timeout: 10000 }).catch(() => {});
      record('Authentication - UI logout', page.url().includes('/login') || page.url().endsWith('/') ? 'PASS' : 'FAIL', page.url().includes('/login') || page.url().endsWith('/') ? '' : page.url(), page.url().includes('/login') || page.url().endsWith('/') ? '' : 'Critical', { url: page.url() });
    } else {
      record('Authentication - UI logout', 'FAIL', 'No accessible Logout/Sign out button found in authenticated shell.', 'Critical', { url: page.url() });
    }

    record('UI/UX Consistency - console errors', consoleErrors.length === 0 ? 'PASS' : 'FAIL',
      consoleErrors.length ? 'Console/page errors observed during normal flows.' : '', consoleErrors.length ? 'Medium' : '',
      { count: consoleErrors.length, sample: consoleErrors.slice(0, 5) });

    await page.goto(`${FRONTEND}/login`, { waitUntil: 'domcontentloaded' });
    await page.locator('#email').fill('bad@example.com');
    await page.locator('#password').fill('wrongPassword1!');
    await page.getByRole('button', { name: /Launch Dashboard/i }).click();
    await page.getByText(/Invalid email or password/i).waitFor({ timeout: 15000 });
    record('Error Handling - invalid login message', 'PASS', '', '', {});
  } catch (err) {
    record('UI automation flow', 'FAIL', err.message, 'Critical', { url: page.url() });
  } finally {
    await browser.close();
  }
}

async function performanceChecks() {
  const endpoints = ['/api/health', '/api/shipments?limit=25', '/api/ops/dashboard', '/api/analytics/overview'];
  const thresholds = {
    '/api/health': 800,
    '/api/shipments?limit=25': 800,
    '/api/ops/dashboard': 500,
    '/api/analytics/overview': 800,
  };
  const timings = [];
  for (const ep of endpoints) {
    await req(ep, { useAuth: ep !== '/api/health', useCsrf: false });
    const r = await req(ep, { useAuth: ep !== '/api/health', useCsrf: false });
    timings.push({ endpoint: ep, status: r.status, ms: r.ms, thresholdMs: thresholds[ep] });
  }
  const slow = timings.filter((t) => t.ms > t.thresholdMs || t.status >= 500);
  record('Performance - API response time', slow.length === 0 ? 'PASS' : 'FAIL',
    slow.length ? 'One or more core APIs exceeded target threshold or returned 5xx.' : '', slow.length ? 'Medium' : '', { timings });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const start = performance.now();
  await page.goto(`${FRONTEND}/login`, { waitUntil: 'domcontentloaded' });
  const loginLoad = Math.round(performance.now() - start);
  await browser.close();
  record('Performance - UI login page load', loginLoad < 3000 ? 'PASS' : 'FAIL', loginLoad < 3000 ? '' : 'Login page load exceeded 3s.', loginLoad < 3000 ? '' : 'Medium', { ms: loginLoad });
}

(async () => {
  try {
    await loginApi();
    await apiBusinessFlows();
    await uiFlows();
    await performanceChecks();
  } catch (err) {
    record('Runner', 'FAIL', err.stack || err.message, 'Critical', {});
  } finally {
    const summary = results.reduce((acc, r) => {
      acc.total++;
      acc[r.status.toLowerCase()] = (acc[r.status.toLowerCase()] || 0) + 1;
      return acc;
    }, { total: 0, pass: 0, fail: 0, partial: 0 });
    console.log(JSON.stringify({ run: RUN, client: CLIENT, created, summary, results }, null, 2));
    await prisma.$disconnect().catch(() => {});
  }
})();
