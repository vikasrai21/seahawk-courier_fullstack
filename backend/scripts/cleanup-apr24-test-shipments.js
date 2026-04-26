#!/usr/bin/env node
'use strict';

const path = require('path');
require('../node_modules/dotenv').config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('../node_modules/@prisma/client');

const prisma = new PrismaClient();

const WINDOW_START = new Date('2026-04-24T09:13:00+05:30');
const WINDOW_END = new Date('2026-04-24T09:16:59.999+05:30');
const SHIPMENT_ID_MIN = 2471;
const SHIPMENT_ID_MAX = 2624;
const AWB_PREFIXES = ['LCLCRT', 'LCLSCN', 'LCLIMP'];
const USER_EMAIL = 'ops.manager@seahawk.com';
const BULK_IMPORT_BATCH_KEYS = [
  'imp_1777002233525',
  'imp_1777002233534',
  'imp_1777002237976',
  'imp_1777002238414',
  'imp_1777002241972',
  'imp_1777002244388',
  'imp_1777002245909',
  'imp_1777002247373',
  'imp_1777002248581',
  'imp_1777002251341',
  'imp_1777002315243',
  'imp_1777002315771',
  'imp_1777002319819',
  'imp_1777002320205',
  'imp_1777002323673',
  'imp_1777002324309',
  'imp_1777002328145',
  'imp_1777002328466',
  'imp_1777002331039',
  'imp_1777002331164',
  'imp_1777002385409',
  'imp_1777002385418',
  'imp_1777002388292',
];

function printHeader() {
  console.log('Cleanup target: April 24, 2026 test-created shipments');
  console.log(`Window (IST): 2026-04-24 09:13:00 to 2026-04-24 09:16:59.999`);
  console.log(`Window (UTC): ${WINDOW_START.toISOString()} to ${WINDOW_END.toISOString()}`);
  console.log(`Shipment IDs: ${SHIPMENT_ID_MIN}-${SHIPMENT_ID_MAX}`);
  console.log(`AWB prefixes: ${AWB_PREFIXES.join(', ')}`);
  console.log('');
}

async function loadCandidates() {
  const shipments = await prisma.shipment.findMany({
    where: {
      id: { gte: SHIPMENT_ID_MIN, lte: SHIPMENT_ID_MAX },
      createdAt: { gte: WINDOW_START, lte: WINDOW_END },
    },
    orderBy: [{ id: 'asc' }],
    select: {
      id: true,
      awb: true,
      remarks: true,
      createdAt: true,
    },
  });

  const candidateShipments = shipments.filter((shipment) =>
    AWB_PREFIXES.some((prefix) => shipment.awb.startsWith(prefix))
  );
  const shipmentIds = candidateShipments.map((shipment) => shipment.id);
  const shipmentIdStrings = shipmentIds.map(String);

  const [importRows, trackingEvents, ndrEvents, createAudits, bulkAudits] = await Promise.all([
    prisma.shipmentImportRow.findMany({
      where: { shipmentId: { in: shipmentIds } },
      orderBy: [{ id: 'asc' }],
      select: { id: true, shipmentId: true, batchKey: true, awb: true },
    }),
    prisma.trackingEvent.findMany({
      where: { shipmentId: { in: shipmentIds } },
      orderBy: [{ id: 'asc' }],
      select: { id: true, shipmentId: true },
    }),
    prisma.nDREvent.findMany({
      where: { shipmentId: { in: shipmentIds } },
      orderBy: [{ id: 'asc' }],
      select: { id: true, shipmentId: true },
    }),
    prisma.auditLog.findMany({
      where: {
        action: 'CREATE',
        entity: 'SHIPMENT',
        userEmail: USER_EMAIL,
        createdAt: { gte: WINDOW_START, lte: WINDOW_END },
      },
      orderBy: [{ id: 'asc' }],
      select: { id: true, entityId: true },
    }),
    prisma.auditLog.findMany({
      where: {
        action: 'BULK_IMPORT',
        entity: 'SHIPMENT',
        userEmail: USER_EMAIL,
        createdAt: { gte: WINDOW_START, lte: WINDOW_END },
      },
      orderBy: [{ id: 'asc' }],
      select: { id: true, newValue: true },
    }),
  ]);

  const candidateCreateAudits = createAudits.filter((audit) => shipmentIdStrings.includes(String(audit.entityId || '')));
  const candidateBulkAudits = bulkAudits.filter((audit) => {
    const batchKey = audit?.newValue?.batchKey;
    return typeof batchKey === 'string' && BULK_IMPORT_BATCH_KEYS.includes(batchKey);
  });

  return {
    candidateShipments,
    importRows,
    trackingEvents,
    ndrEvents,
    candidateCreateAudits,
    candidateBulkAudits,
  };
}

function summarize({ candidateShipments, importRows, trackingEvents, ndrEvents, candidateCreateAudits, candidateBulkAudits }) {
  const byPrefix = candidateShipments.reduce((acc, shipment) => {
    const prefix = AWB_PREFIXES.find((value) => shipment.awb.startsWith(value)) || 'OTHER';
    acc[prefix] = (acc[prefix] || 0) + 1;
    return acc;
  }, {});

  const byRemarks = candidateShipments.reduce((acc, shipment) => {
    const key = String(shipment.remarks || '').trim() || '(empty)';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const linkedBatches = [...new Set(importRows.map((row) => row.batchKey))].sort();

  return {
    shipmentCount: candidateShipments.length,
    trackingEventCount: trackingEvents.length,
    ndrEventCount: ndrEvents.length,
    importRowCount: importRows.length,
    createAuditCount: candidateCreateAudits.length,
    bulkAuditCount: candidateBulkAudits.length,
    byPrefix,
    byRemarks,
    linkedBatches,
    firstShipmentId: candidateShipments[0]?.id || null,
    lastShipmentId: candidateShipments[candidateShipments.length - 1]?.id || null,
    firstFiveAwbs: candidateShipments.slice(0, 5).map((shipment) => shipment.awb),
    lastFiveAwbs: candidateShipments.slice(-5).map((shipment) => shipment.awb),
  };
}

async function run() {
  const confirm = process.argv.includes('--confirm');
  printHeader();

  const candidates = await loadCandidates();
  const summary = summarize(candidates);
  console.log(JSON.stringify(summary, null, 2));
  console.log('');

  if (!confirm) {
    console.log('Dry run only. No rows were deleted.');
    console.log('To execute deletion, run: node backend/scripts/cleanup-apr24-test-shipments.js --confirm');
    return;
  }

  if (summary.shipmentCount !== 154) {
    throw new Error(`Safety stop: expected 154 shipments, found ${summary.shipmentCount}. Aborting.`);
  }
  if (summary.importRowCount !== 46) {
    throw new Error(`Safety stop: expected 46 linked import rows, found ${summary.importRowCount}. Aborting.`);
  }

  const shipmentIds = candidates.candidateShipments.map((shipment) => shipment.id);
  const importRowIds = candidates.importRows.map((row) => row.id);
  const createAuditIds = candidates.candidateCreateAudits.map((audit) => audit.id);
  const bulkAuditIds = candidates.candidateBulkAudits.map((audit) => audit.id);

  const result = await prisma.$transaction(async (tx) => {
    const deletedImportRows = importRowIds.length
      ? await tx.shipmentImportRow.deleteMany({ where: { id: { in: importRowIds } } })
      : { count: 0 };

    const deletedTrackingEvents = await tx.trackingEvent.deleteMany({ where: { shipmentId: { in: shipmentIds } } });
    const deletedNdrEvents = await tx.nDREvent.deleteMany({ where: { shipmentId: { in: shipmentIds } } });
    const deletedShipments = await tx.shipment.deleteMany({ where: { id: { in: shipmentIds } } });

    const deletedCreateAudits = createAuditIds.length
      ? await tx.auditLog.deleteMany({ where: { id: { in: createAuditIds } } })
      : { count: 0 };

    const deletedBulkAudits = bulkAuditIds.length
      ? await tx.auditLog.deleteMany({ where: { id: { in: bulkAuditIds } } })
      : { count: 0 };

    return {
      deletedImportRows: deletedImportRows.count,
      deletedTrackingEvents: deletedTrackingEvents.count,
      deletedNdrEvents: deletedNdrEvents.count,
      deletedShipments: deletedShipments.count,
      deletedCreateAudits: deletedCreateAudits.count,
      deletedBulkAudits: deletedBulkAudits.count,
    };
  });

  console.log('Deletion complete:');
  console.log(JSON.stringify(result, null, 2));
}

run()
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
