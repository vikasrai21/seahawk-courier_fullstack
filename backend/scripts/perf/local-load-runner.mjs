#!/usr/bin/env node
/**
 * local-load-runner.mjs  —  Seahawk Isolated Performance Runner
 * ─────────────────────────────────────────────────────────────────────────────
 * Runs real HTTP requests against the local backend to measure p50/p95 latency.
 *
 * ISOLATION GUARANTEE:
 *   - All created shipments use AWB prefix "LCLCRT", "LCLIMP", "LCLSCN"
 *   - All created shipments have remarks prefixed with "PERF_TEST:"
 *   - The cleanup script (cleanup-perf-shipments.js) deletes them all by prefix
 *
 * Usage:
 *   node scripts/perf/local-load-runner.mjs              # run only
 *   node scripts/perf/local-load-runner.mjs --cleanup    # run + auto cleanup after
 *   node scripts/perf/local-load-runner.mjs --cleanup-only  # just clean, no run
 */
'use strict';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const path = require('path');
require('dotenv').config({ path: path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '../../.env') });

const BASE_URL   = process.env.PERF_BASE_URL || 'http://localhost:3001';
const TIMEOUT_MS = 15_000;
const PERF_TAG   = 'PERF_TEST:';

const args         = process.argv.slice(2);
const AUTO_CLEANUP = args.includes('--cleanup');
const CLEANUP_ONLY = args.includes('--cleanup-only');

// ── Credentials ──────────────────────────────────────────────────────────────
const STAFF_CREDS  = { email: 'ops.manager@seahawk.com', password: process.env.OPS_MANAGER_PASSWORD || 'password123' };
const CLIENT_CREDS = { email: process.env.CLIENT_EMAIL   || 'client@demo.com',     password: process.env.CLIENT_PASSWORD || 'password123' };

// ── Unique run ID so AWBs never collide across runs ──────────────────────────
const RUN_ID = `${Date.now().toString(36).toUpperCase()}`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 10).toUpperCase(); }
function perfAwb(tag) { return `${tag}${RUN_ID}${uid()}`; }

async function request(method, path, body, token) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const t0 = Date.now();
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
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

async function login(creds) {
  const r = await request('POST', '/api/auth/login', creds);
  if (!r.ok || !r.data?.token) {
    throw new Error(`Login failed for ${creds.email}: ${r.data?.message || r.error || r.status}`);
  }
  return r.data.token;
}

function percentile(arr, p) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function printScenario(name, timings, failures) {
  const p50 = percentile(timings, 50);
  const p95 = percentile(timings, 95);
  const avg = timings.length ? Math.round(timings.reduce((a, b) => a + b, 0) / timings.length) : 0;
  const failPct = timings.length + failures > 0 ? ((failures / (timings.length + failures)) * 100).toFixed(1) : '0.0';

  const p95mark = p95 > 5000 ? '❌' : p95 > 2000 ? '⚠️ ' : '✅';
  console.log(`  ${p95mark} ${name.padEnd(30)} avg ${String(avg).padStart(5)}ms  p50 ${String(p50).padStart(5)}ms  p95 ${String(p95).padStart(5)}ms  failures ${failPct}%`);
  return { name, avg, p50, p95, failures, total: timings.length + failures };
}

// ── Cleanup via Prisma directly ───────────────────────────────────────────────
async function cleanupPerfData() {
  console.log('\n🧹 Auto-cleanup: removing perf test shipments...');
  const { execSync } = require('child_process');
  try {
    const scriptPath = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '../cleanup-perf-shipments.js');
    execSync(`node "${scriptPath}" --confirm`, { stdio: 'inherit' });
  } catch (err) {
    console.warn('  Cleanup warning:', err.message);
  }
}

// ── Scenario definitions ──────────────────────────────────────────────────────
async function runCreateScenario(token, n = 8) {
  const timings = [];
  const failures = [];
  for (let i = 0; i < n; i++) {
    const r = await request('POST', '/api/shipments', {
      awb:        perfAwb('LCLCRT'),
      clientCode: 'MISC',
      consignee:  'PERF TEST CONSIGNEE',
      destination:'DELHI',
      weight:     0.5,
      amount:     0,
      courier:    'Delhivery',
      service:    'Standard',
      date:       new Date().toISOString().split('T')[0],
      remarks:    `${PERF_TAG} load-runner create run=${RUN_ID}`,
    }, token);
    if (r.ok) timings.push(r.ms);
    else failures.push(r.ms);
  }
  return printScenario('shipments:create', timings, failures.length);
}

async function runImportScenario(token, n = 4) {
  const timings = [];
  const failures = [];
  const batch = Array.from({ length: 10 }, () => ({
    awb:        perfAwb('LCLIMP'),
    clientCode: 'MISC',
    consignee:  'PERF IMPORT CONSIGNEE',
    destination:'MUMBAI',
    weight:     1.0,
    amount:     0,
    courier:    'Delhivery',
    service:    'Standard',
    date:       new Date().toISOString().split('T')[0],
    remarks:    `${PERF_TAG} load-runner import run=${RUN_ID}`,
  }));
  for (let i = 0; i < n; i++) {
    const r = await request('POST', '/api/shipments/import', { shipments: batch }, token);
    if (r.ok) timings.push(r.ms);
    else failures.push(r.ms);
  }
  return printScenario('shipments:import', timings, failures.length);
}

async function runScanScenario(token, n = 6) {
  const timings = [];
  const failures = [];
  for (let i = 0; i < n; i++) {
    const r = await request('POST', '/api/shipments/scan', {
      awb:     perfAwb('LCLSCN'),
      courier: 'Delhivery',
      options: { captureOnly: true, source: 'perf_runner' },
    }, token);
    if (r.ok) timings.push(r.ms);
    else failures.push(r.ms);
  }
  return printScenario('shipments:scan', timings, failures.length);
}

async function runDashboardScenario(clientToken, n = 8) {
  const timings = [];
  const failures = [];
  for (let i = 0; i < n; i++) {
    const r = await request('GET', '/api/portal/stats?range=this_month', null, clientToken);
    if (r.ok) timings.push(r.ms);
    else failures.push(r.ms);
  }
  return printScenario('portal:dashboard', timings, failures.length);
}

async function runTrackingRefreshScenario(clientToken, n = 8) {
  const timings = [];
  const failures = [];
  for (let i = 0; i < n; i++) {
    const r = await request('POST', '/api/portal/sync-tracking', { limit: 5 }, clientToken);
    if (r.ok) timings.push(r.ms);
    else failures.push(r.ms);
  }
  return printScenario('portal:tracking-refresh', timings, failures.length);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (CLEANUP_ONLY) {
    await cleanupPerfData();
    return;
  }

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║   Seahawk Local Performance Runner                   ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`  Target:  ${BASE_URL}`);
  console.log(`  Run ID:  ${RUN_ID}`);
  console.log(`  Cleanup: ${AUTO_CLEANUP ? 'yes (after run)' : 'no (manual with --cleanup)'}`);
  console.log('');

  // ── Login ──
  let staffToken, clientToken;
  try {
    console.log('⏳ Logging in...');
    [staffToken, clientToken] = await Promise.all([login(STAFF_CREDS), login(CLIENT_CREDS)]);
    console.log('✅ Login OK\n');
  } catch (err) {
    console.error('❌ Login failed:', err.message);
    console.error('   Is the backend running? (npm --prefix backend run dev)');
    process.exit(1);
  }

  // ── Run scenarios ──
  console.log('Running scenarios...\n');
  const results = [];
  results.push(await runCreateScenario(staffToken));
  results.push(await runScanScenario(staffToken));
  results.push(await runImportScenario(staffToken));
  results.push(await runDashboardScenario(clientToken));
  results.push(await runTrackingRefreshScenario(clientToken));

  // ── Summary ──
  console.log('\n──────────────────────────────────────────────────────');
  const allP95  = results.map(r => r.p95);
  const worstP95 = Math.max(...allP95);
  console.log(`  Worst p95: ${worstP95}ms`);
  console.log('  Targets:  create<500ms  scan<700ms  import<1500ms  dashboard<900ms  tracking<1500ms');

  // ── Cleanup ──
  if (AUTO_CLEANUP) {
    await cleanupPerfData();
  } else {
    console.log('\n  ℹ️  Test shipments were created in the DB (AWB prefix LCL*).');
    console.log('     To remove them: node scripts/cleanup-perf-shipments.js --confirm');
    console.log('     Or re-run with: node scripts/perf/local-load-runner.mjs --cleanup');
  }

  console.log('');
}

main().catch(err => {
  console.error('Runner error:', err.message);
  process.exit(1);
});
