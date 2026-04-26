#!/usr/bin/env node
/**
 * runtime-proof.mjs  —  Seahawk Multi-Round Runtime Stability Proof
 * ─────────────────────────────────────────────────────────────────────────────
 * Runs the perf suite N rounds (default 3) and saves a JSON + markdown report.
 * Uses the same isolated, self-tagging approach as local-load-runner.mjs.
 * All created test data is cleaned up automatically after each round.
 *
 * Usage:
 *   node scripts/perf/runtime-proof.mjs          # 3 rounds, auto-cleanup
 *   node scripts/perf/runtime-proof.mjs --rounds 5
 *   node scripts/perf/runtime-proof.mjs --no-cleanup
 */
'use strict';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const path    = require('path');
const fs      = require('fs');
require('dotenv').config({ path: path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '../../.env') });

const BASE_URL   = process.env.PERF_BASE_URL || 'http://localhost:3001';
const TIMEOUT_MS = 15_000;
const PERF_TAG   = 'PERF_TEST:';

const argv = process.argv.slice(2);
const ROUNDS   = parseInt(argv[argv.indexOf('--rounds') + 1] || '3', 10) || 3;
const CLEANUP  = !argv.includes('--no-cleanup');

const STAFF_CREDS  = { email: 'ops.manager@seahawk.com', password: process.env.OPS_MANAGER_PASSWORD || 'password123' };
const CLIENT_CREDS = { email: process.env.CLIENT_EMAIL || 'client@demo.com', password: process.env.CLIENT_PASSWORD || 'password123' };

function uid() { return Math.random().toString(36).slice(2, 8).toUpperCase(); }
function runId() { return `${Date.now().toString(36).toUpperCase()}${uid()}`; }
function perfAwb(tag, rid) { return `${tag}${rid}${uid()}`; }

async function request(method, urlPath, body, token) {
  const ctrl  = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const t0    = Date.now();
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}${urlPath}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    const ms   = Date.now() - t0;
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, ms, data };
  } catch (err) {
    return { ok: false, status: 0, ms: Date.now() - t0, error: err.message };
  } finally {
    clearTimeout(timer);
  }
}

async function login(creds) {
  const r = await request('POST', '/api/auth/login', creds);
  if (!r.ok || !r.data?.token) throw new Error(`Login failed for ${creds.email}: ${r.data?.message || r.error}`);
  return r.data.token;
}

function pct(arr, p) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.max(0, Math.ceil((p / 100) * s.length) - 1)];
}

function avg(arr) {
  return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
}

async function runRound(round, staffToken, clientToken) {
  const RID  = runId();
  const today = new Date().toISOString().split('T')[0];
  const scenarios = {};

  // ── create ──
  {
    const t = [], f = [];
    for (let i = 0; i < 8; i++) {
      const r = await request('POST', '/api/shipments', {
        awb: perfAwb('LCLCRT', RID), clientCode: 'MISC', consignee: 'PERF CONSIGNEE',
        destination: 'DELHI', weight: 0.5, amount: 0, courier: 'Delhivery',
        service: 'Standard', date: today, remarks: `${PERF_TAG} proof r=${round} rid=${RID}`,
      }, staffToken);
      r.ok ? t.push(r.ms) : f.push(r.ms);
    }
    scenarios['shipments:create'] = { timings: t, failures: f.length };
  }

  // ── scan ──
  {
    const t = [], f = [];
    for (let i = 0; i < 6; i++) {
      const r = await request('POST', '/api/shipments/scan', {
        awb: perfAwb('LCLSCN', RID), courier: 'Delhivery',
        options: { captureOnly: true, source: 'perf_proof' },
      }, staffToken);
      r.ok ? t.push(r.ms) : f.push(r.ms);
    }
    scenarios['shipments:scan'] = { timings: t, failures: f.length };
  }

  // ── import ──
  {
    const t = [], f = [];
    const batch = Array.from({ length: 8 }, () => ({
      awb: perfAwb('LCLIMP', RID), clientCode: 'MISC', consignee: 'PERF IMPORT',
      destination: 'MUMBAI', weight: 1.0, amount: 0, courier: 'Delhivery',
      service: 'Standard', date: today, remarks: `${PERF_TAG} proof import r=${round}`,
    }));
    for (let i = 0; i < 4; i++) {
      const r = await request('POST', '/api/shipments/import', { shipments: batch }, staffToken);
      r.ok ? t.push(r.ms) : f.push(r.ms);
    }
    scenarios['shipments:import'] = { timings: t, failures: f.length };
  }

  // ── dashboard ──
  {
    const t = [], f = [];
    for (let i = 0; i < 8; i++) {
      const r = await request('GET', '/api/portal/stats?range=this_month', null, clientToken);
      r.ok ? t.push(r.ms) : f.push(r.ms);
    }
    scenarios['portal:dashboard'] = { timings: t, failures: f.length };
  }

  // ── tracking refresh ──
  {
    const t = [], f = [];
    for (let i = 0; i < 8; i++) {
      const r = await request('POST', '/api/portal/sync-tracking', { limit: 5 }, clientToken);
      r.ok ? t.push(r.ms) : f.push(r.ms);
    }
    scenarios['portal:tracking-refresh'] = { timings: t, failures: f.length };
  }

  // Summarise
  const summary = {};
  for (const [name, data] of Object.entries(scenarios)) {
    summary[name] = {
      avg:      avg(data.timings),
      p50:      pct(data.timings, 50),
      p95:      pct(data.timings, 95),
      failures: data.failures,
      samples:  data.timings.length + data.failures,
    };
  }
  return summary;
}

async function cleanup() {
  const { execSync } = require('child_process');
  const scriptPath = path.join(
    path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')),
    '../cleanup-perf-shipments.js'
  );
  try {
    execSync(`node "${scriptPath}" --confirm`, { stdio: 'pipe' });
    console.log('  🧹 Perf data cleaned up');
  } catch (err) {
    console.warn('  ⚠️  Cleanup warning:', err.message);
  }
}

function buildMarkdown(rounds, meta) {
  const names = Object.keys(rounds[0] || {});
  const lines = [
    '# Seahawk Runtime Proof Report',
    '',
    `**Generated:** ${meta.generatedAt}  `,
    `**Backend:** ${meta.baseUrl}  `,
    `**Rounds:** ${rounds.length}  `,
    `**Auto-cleanup:** ${meta.cleanup}`,
    '',
  ];

  for (let i = 0; i < rounds.length; i++) {
    const r = rounds[i];
    lines.push(`## Round ${i + 1}`);
    lines.push('');
    lines.push('| Scenario | avg | p50 | p95 | failures |');
    lines.push('|---|---|---|---|---|');
    for (const name of names) {
      const s = r[name];
      const p95mark = s.p95 > 5000 ? '❌' : s.p95 > 2000 ? '⚠️' : '✅';
      lines.push(`| ${name} | ${s.avg}ms | ${s.p50}ms | ${p95mark} ${s.p95}ms | ${s.failures}/${s.samples} |`);
    }
    lines.push('');
  }

  // Aggregate across rounds
  lines.push('## Aggregate (all rounds)');
  lines.push('');
  lines.push('| Scenario | avg p95 | worst p95 | best p95 | total failures |');
  lines.push('|---|---|---|---|---|');
  for (const name of names) {
    const p95s     = rounds.map(r => r[name]?.p95 || 0).filter(Boolean);
    const avgP95   = Math.round(p95s.reduce((a, b) => a + b, 0) / (p95s.length || 1));
    const worstP95 = Math.max(...p95s);
    const bestP95  = Math.min(...p95s);
    const totalFail = rounds.reduce((a, r) => a + (r[name]?.failures || 0), 0);
    const mark = worstP95 > 5000 ? '❌' : worstP95 > 2000 ? '⚠️' : '✅';
    lines.push(`| ${name} | ${avgP95}ms | ${mark} ${worstP95}ms | ${bestP95}ms | ${totalFail} |`);
  }

  lines.push('');
  lines.push('## Targets');
  lines.push('| Scenario | Target p95 |');
  lines.push('|---|---|');
  lines.push('| shipments:create | 500ms |');
  lines.push('| shipments:scan | 700ms |');
  lines.push('| shipments:import | 1500ms |');
  lines.push('| portal:dashboard | 900ms |');
  lines.push('| portal:tracking-refresh | 1500ms |');

  return lines.join('\n');
}

async function main() {
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║   Seahawk Runtime Stability Proof                    ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`  Target:  ${BASE_URL}`);
  console.log(`  Rounds:  ${ROUNDS}`);
  console.log(`  Cleanup: ${CLEANUP ? 'yes (auto after each round)' : 'no'}`);
  console.log('');

  let staffToken, clientToken;
  try {
    console.log('⏳ Logging in...');
    [staffToken, clientToken] = await Promise.all([login(STAFF_CREDS), login(CLIENT_CREDS)]);
    console.log('✅ Login OK\n');
  } catch (err) {
    console.error('❌ Login failed:', err.message);
    console.error('   Start backend: npm --prefix backend run dev');
    process.exit(1);
  }

  const roundResults = [];
  for (let round = 1; round <= ROUNDS; round++) {
    console.log(`── Round ${round}/${ROUNDS} ─────────────────────────────────────`);
    const result = await runRound(round, staffToken, clientToken);
    roundResults.push(result);

    for (const [name, s] of Object.entries(result)) {
      const mark = s.p95 > 5000 ? '❌' : s.p95 > 2000 ? '⚠️ ' : '✅';
      console.log(`  ${mark} ${name.padEnd(28)} avg ${String(s.avg).padStart(5)}ms  p95 ${String(s.p95).padStart(5)}ms  fail ${s.failures}/${s.samples}`);
    }

    if (CLEANUP) await cleanup();
    console.log('');
  }

  // Write reports
  const ts  = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 23);
  const dir = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '../../perf-reports');
  fs.mkdirSync(dir, { recursive: true });

  const meta = { generatedAt: new Date().toISOString(), baseUrl: BASE_URL, cleanup: CLEANUP };
  fs.writeFileSync(path.join(dir, `runtime-proof-${ts}.json`), JSON.stringify({ meta, rounds: roundResults }, null, 2));
  fs.writeFileSync(path.join(dir, `runtime-proof-${ts}.md`),   buildMarkdown(roundResults, meta));

  console.log(`📝 Reports saved to: backend/perf-reports/runtime-proof-${ts}.*`);
  console.log('');
}

main().catch(err => {
  console.error('Proof runner error:', err.message);
  process.exit(1);
});
