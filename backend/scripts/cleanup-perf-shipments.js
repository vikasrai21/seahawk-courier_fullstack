#!/usr/bin/env node
'use strict';

/**
 * cleanup-perf-shipments.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Universal cleanup for ALL perf-test-generated shipments.
 * Safe to run at any time: dry-run by default, --confirm to actually delete.
 *
 * Detects perf shipments by:
 *   1. AWB prefix  (LCLCRT / LCLSCN / LCLIMP / LCLPRF)
 *   2. remarks tag (PERF_TEST:)
 *   3. clientCode  (PERF_TEST_CLIENT)
 *
 * Usage:
 *   node scripts/cleanup-perf-shipments.js           # dry-run
 *   node scripts/cleanup-perf-shipments.js --confirm # delete
 *   node scripts/cleanup-perf-shipments.js --confirm --since 2026-04-25  # limit by date
 */

const path = require('path');
require('../node_modules/dotenv').config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('../node_modules/@prisma/client');

const prisma = new PrismaClient();

const PERF_AWB_PREFIXES  = ['LCLCRT', 'LCLSCN', 'LCLIMP', 'LCLPRF', 'PERFTEST'];
const PERF_CLIENT_CODE   = 'PERF_TEST_CLIENT';
const PERF_REMARKS_TAG   = 'PERF_TEST:';
const PERF_USER_EMAIL    = 'ops.manager@seahawk.com';

function parseArgs() {
  const args = process.argv.slice(2);
  const confirm = args.includes('--confirm');
  const sinceIdx = args.indexOf('--since');
  const sinceStr = sinceIdx !== -1 ? args[sinceIdx + 1] : null;
  const sinceDate = sinceStr ? new Date(sinceStr) : null;
  if (sinceStr && isNaN(sinceDate?.getTime())) {
    console.error(`Invalid --since date: ${sinceStr}`);
    process.exit(1);
  }
  return { confirm, sinceDate };
}

async function loadCandidates(sinceDate) {
  const dateFilter = sinceDate ? { createdAt: { gte: sinceDate } } : {};

  // Find all shipments matching any perf marker
  const [byPrefix, byClient, byRemarks] = await Promise.all([
    // Match by AWB prefix
    prisma.$queryRawUnsafe(
      `SELECT id, awb, remarks, client_code as "clientCode", created_at as "createdAt"
       FROM shipments
       WHERE ${PERF_AWB_PREFIXES.map((_, i) => `awb LIKE $${i + 1}`).join(' OR ')}
       ${sinceDate ? `AND created_at >= '${sinceDate.toISOString()}'` : ''}
       ORDER BY id ASC`,
      ...PERF_AWB_PREFIXES.map(p => `${p}%`)
    ),

    // Match by dedicated perf client code
    prisma.shipment.findMany({
      where: { clientCode: PERF_CLIENT_CODE, ...dateFilter },
      select: { id: true, awb: true, remarks: true, clientCode: true, createdAt: true },
      orderBy: { id: 'asc' },
    }),

    // Match by remarks tag
    prisma.shipment.findMany({
      where: { remarks: { contains: PERF_REMARKS_TAG }, ...dateFilter },
      select: { id: true, awb: true, remarks: true, clientCode: true, createdAt: true },
      orderBy: { id: 'asc' },
    }),
  ]);

  // Deduplicate by id
  const seen = new Set();
  const all = [];
  for (const row of [...byPrefix, ...byClient, ...byRemarks]) {
    const id = Number(row.id);
    if (!seen.has(id)) {
      seen.add(id);
      all.push({ id, awb: row.awb, remarks: row.remarks, clientCode: row.clientCode, createdAt: row.createdAt });
    }
  }
  all.sort((a, b) => a.id - b.id);

  if (!all.length) return { shipments: [], related: null };

  const ids = all.map(r => r.id);

  // Load all related records that must be deleted first
  const [importRows, trackingEvents, ndrEvents, auditLogs] = await Promise.all([
    prisma.shipmentImportRow.findMany({
      where: { shipmentId: { in: ids } },
      select: { id: true, shipmentId: true },
    }),
    prisma.trackingEvent.findMany({
      where: { shipmentId: { in: ids } },
      select: { id: true, shipmentId: true },
    }),
    prisma.nDREvent.findMany({
      where: { shipmentId: { in: ids } },
      select: { id: true, shipmentId: true },
    }),
    prisma.auditLog.findMany({
      where: {
        OR: [
          { entityId: { in: ids.map(String) }, entity: 'SHIPMENT' },
          {
            action: { in: ['CREATE', 'BULK_IMPORT', 'SCAN'] },
            userEmail: PERF_USER_EMAIL,
            newValue: { path: ['batchKey'], string_starts_with: 'imp_' },
          },
        ],
      },
      select: { id: true },
    }),
  ]);

  return {
    shipments: all,
    related: { importRows, trackingEvents, ndrEvents, auditLogs },
  };
}

function printSummary({ shipments, related }) {
  const byPrefix = {};
  const byClient = {};
  for (const s of shipments) {
    const prefix = PERF_AWB_PREFIXES.find(p => String(s.awb || '').startsWith(p)) || 'OTHER';
    byPrefix[prefix] = (byPrefix[prefix] || 0) + 1;
    byClient[s.clientCode] = (byClient[s.clientCode] || 0) + 1;
  }

  const earliest = shipments[0]?.createdAt;
  const latest   = shipments[shipments.length - 1]?.createdAt;

  console.log('══════════════════════════════════════════');
  console.log('  Seahawk — Perf Shipment Cleanup Report');
  console.log('══════════════════════════════════════════');
  console.log(`\nTotal perf shipments found:  ${shipments.length}`);
  if (shipments.length) {
    console.log(`Earliest created:            ${earliest ? new Date(earliest).toLocaleString() : 'N/A'}`);
    console.log(`Latest created:              ${latest   ? new Date(latest).toLocaleString()   : 'N/A'}`);
    console.log('\nBy AWB prefix:');
    for (const [k, v] of Object.entries(byPrefix)) console.log(`  ${k.padEnd(14)} ${v}`);
    console.log('\nBy client code:');
    for (const [k, v] of Object.entries(byClient)) console.log(`  ${k.padEnd(22)} ${v}`);
    if (related) {
      console.log('\nRelated records to purge:');
      console.log(`  Import rows:              ${related.importRows.length}`);
      console.log(`  Tracking events:          ${related.trackingEvents.length}`);
      console.log(`  NDR events:               ${related.ndrEvents.length}`);
      console.log(`  Audit logs:               ${related.auditLogs.length}`);
    }
  }
  console.log('');
}

async function deleteAll({ shipments, related }) {
  if (!shipments.length) {
    console.log('Nothing to delete. Database is already clean.');
    return;
  }

  const ids          = shipments.map(r => r.id);
  const importRowIds = related.importRows.map(r => r.id);
  const auditIds     = related.auditLogs.map(r => r.id);

  console.log(`Deleting ${shipments.length} shipments and all related rows...`);

  const result = await prisma.$transaction(async (tx) => {
    const delImport   = importRowIds.length ? await tx.shipmentImportRow.deleteMany({ where: { id: { in: importRowIds } } }) : { count: 0 };
    const delTracking = await tx.trackingEvent.deleteMany({ where: { shipmentId: { in: ids } } });
    const delNdr      = await tx.nDREvent.deleteMany({ where: { shipmentId: { in: ids } } });
    const delShips    = await tx.shipment.deleteMany({ where: { id: { in: ids } } });
    const delAudit    = auditIds.length ? await tx.auditLog.deleteMany({ where: { id: { in: auditIds } } }) : { count: 0 };

    return {
      importRows:      delImport.count,
      trackingEvents:  delTracking.count,
      ndrEvents:       delNdr.count,
      shipments:       delShips.count,
      auditLogs:       delAudit.count,
    };
  });

  console.log('\n✅  Deletion complete:');
  console.log(`    Shipments deleted:        ${result.shipments}`);
  console.log(`    Import rows deleted:      ${result.importRows}`);
  console.log(`    Tracking events deleted:  ${result.trackingEvents}`);
  console.log(`    NDR events deleted:       ${result.ndrEvents}`);
  console.log(`    Audit logs deleted:       ${result.auditLogs}`);
}

async function run() {
  const { confirm, sinceDate } = parseArgs();

  console.log(`\nMode:  ${confirm ? '🔴 CONFIRM (will delete)' : '🟡 DRY RUN (read-only)'}`);
  if (sinceDate) console.log(`Since: ${sinceDate.toISOString()}`);
  console.log('');

  const candidates = await loadCandidates(sinceDate);
  printSummary(candidates);

  if (!confirm) {
    console.log('Dry run complete. No rows were changed.');
    console.log('To execute deletion, re-run with --confirm');
    console.log('  node scripts/cleanup-perf-shipments.js --confirm');
    return;
  }

  if (candidates.shipments.length === 0) {
    console.log('Nothing to delete.');
    return;
  }

  await deleteAll(candidates);
}

run()
  .catch(async (err) => {
    console.error('Cleanup failed:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
