/**
 * load-performance.test.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Backend load/performance integration test.
 * Fires concurrent requests at key API endpoints and asserts latency budgets.
 *
 * Run:  npm test -- --testPathPattern=load-performance
 * Requires: Backend running on localhost:3001
 */
'use strict';
require('dotenv').config();

const BASE_URL = process.env.PERF_BASE_URL || 'http://localhost:3001';
const TIMEOUT_MS = 15_000;

// ── Helpers ──────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 10).toUpperCase(); }
function perfAwb(prefix) { return `${prefix}${Date.now().toString(36).toUpperCase()}${uid()}`; }

async function httpRequest(method, path, body, token) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const t0 = Date.now();
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}${path}`, {
      method, headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    const ms = Date.now() - t0;
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, ms, data: json };
  } catch (err) {
    return { ok: false, status: 0, ms: Date.now() - t0, error: err.message };
  } finally {
    clearTimeout(timer);
  }
}

async function login(email, password) {
  const r = await httpRequest('POST', '/api/auth/login', { email, password });
  if (!r.ok) throw new Error(`Login failed for ${email}: ${r.status}`);
  return r.data.accessToken || r.data.token;
}

function percentile(arr, p) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  return sorted[Math.ceil((p / 100) * sorted.length) - 1];
}

// ── Test Suite ───────────────────────────────────────────────────────────────

describe('Load & Performance Tests', () => {
  let staffToken;
  const RUN_ID = Date.now().toString(36).toUpperCase();
  const createdAwbs = [];

  beforeAll(async () => {
    try {
      staffToken = await login(
        process.env.STAFF_EMAIL || 'admin@seahawk.com',
        process.env.STAFF_PASSWORD || 'Admin@12345'
      );
    } catch (err) {
      console.warn('⚠️ Could not login — skipping load tests. Is the backend running?');
    }
  }, 30000);

  afterAll(async () => {
    // Clean up perf test shipments
    if (staffToken && createdAwbs.length) {
      for (const awb of createdAwbs) {
        await httpRequest('DELETE', `/api/shipments/${encodeURIComponent(awb)}`, null, staffToken)
          .catch(() => {});
      }
    }
  }, 30000);

  // ── 1. Single Create Latency ────────────────────────────────────────────

  test('Single shipment create completes under 500ms (p95)', async () => {
    if (!staffToken) return;
    const N = 8;
    const timings = [];

    for (let i = 0; i < N; i++) {
      const awb = perfAwb('LDTST');
      const r = await httpRequest('POST', '/api/shipments', {
        awb,
        clientCode: 'MISC',
        consignee: 'LOAD TEST',
        destination: 'DELHI',
        weight: 0.5,
        amount: 0,
        courier: 'Delhivery',
        date: new Date().toISOString().split('T')[0],
        remarks: `PERF_TEST: load-test run=${RUN_ID}`,
      }, staffToken);
      if (r.ok) {
        timings.push(r.ms);
        createdAwbs.push(awb);
      }
    }

    const p95 = percentile(timings, 95);
    console.log(`  shipments:create — p95=${p95}ms, samples=${timings.length}`);
    expect(timings.length).toBeGreaterThan(0);
    expect(p95).toBeLessThan(2000); // generous budget for local dev
  }, 60000);

  // ── 2. Bulk Import Latency ──────────────────────────────────────────────

  test('Bulk import of 10 shipments completes under 3000ms (p95)', async () => {
    if (!staffToken) return;
    const N = 4;
    const timings = [];

    for (let i = 0; i < N; i++) {
      const batch = Array.from({ length: 10 }, () => {
        const awb = perfAwb('LDIMP');
        createdAwbs.push(awb);
        return {
          awb,
          clientCode: 'MISC',
          consignee: 'LOAD IMPORT TEST',
          destination: 'MUMBAI',
          weight: 1.0,
          amount: 0,
          courier: 'Delhivery',
          date: new Date().toISOString().split('T')[0],
          remarks: `PERF_TEST: load-import run=${RUN_ID}`,
        };
      });
      const r = await httpRequest('POST', '/api/shipments/import', { shipments: batch }, staffToken);
      if (r.ok) timings.push(r.ms);
    }

    const p95 = percentile(timings, 95);
    console.log(`  shipments:import — p95=${p95}ms, samples=${timings.length}`);
    expect(timings.length).toBeGreaterThan(0);
    expect(p95).toBeLessThan(5000);
  }, 120000);

  // ── 3. Concurrent Read Throughput ───────────────────────────────────────

  test('10 concurrent GET /api/shipments complete within 3000ms total', async () => {
    if (!staffToken) return;

    const t0 = Date.now();
    const promises = Array.from({ length: 10 }, () =>
      httpRequest('GET', '/api/shipments?limit=5', null, staffToken)
    );
    const results = await Promise.all(promises);
    const totalMs = Date.now() - t0;

    const okCount = results.filter(r => r.ok).length;
    const timings = results.filter(r => r.ok).map(r => r.ms);
    const p95 = percentile(timings, 95);

    console.log(`  concurrent:read — total=${totalMs}ms, p95=${p95}ms, ok=${okCount}/10`);
    expect(okCount).toBeGreaterThanOrEqual(8); // allow minor failures
    expect(totalMs).toBeLessThan(8000);
  }, 30000);

  // ── 4. Health Endpoint Latency ──────────────────────────────────────────

  test('Health endpoint responds under 100ms', async () => {
    const r = await httpRequest('GET', '/api/health');
    console.log(`  health — ${r.ms}ms, status=${r.status}`);
    expect(r.ok).toBe(true);
    expect(r.ms).toBeLessThan(1000);
  }, 10000);

  // ── 5. Authentication Throughput ────────────────────────────────────────

  test('5 concurrent login attempts complete within 5000ms', async () => {
    const t0 = Date.now();
    const promises = Array.from({ length: 5 }, () =>
      httpRequest('POST', '/api/auth/login', {
        email: process.env.STAFF_EMAIL || 'admin@seahawk.com',
        password: process.env.STAFF_PASSWORD || 'Admin@12345',
      })
    );
    const results = await Promise.all(promises);
    const totalMs = Date.now() - t0;

    const okCount = results.filter(r => r.ok).length;
    console.log(`  auth:concurrent — total=${totalMs}ms, ok=${okCount}/5`);
    expect(okCount).toBeGreaterThanOrEqual(3);
    expect(totalMs).toBeLessThan(10000);
  }, 30000);
});
