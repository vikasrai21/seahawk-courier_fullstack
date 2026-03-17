/* ============================================================
   queue.service.js — Feature #12: Background Job Queue
   
   Uses BullMQ (Redis-backed) for:
   - Tracking sync (every 30 min)
   - Sending notifications
   - Generating PDFs
   - Wallet deductions
   
   Falls back to in-memory queue if Redis not available.
   ============================================================ */

'use strict';

const prisma  = require('../config/prisma');
const logger  = require('../utils/logger');

/* ── Detect BullMQ availability ── */
let Queue, Worker, QueueEvents;
let bullMQAvailable = false;
try {
  const bullmq = require('bullmq');
  Queue       = bullmq.Queue;
  Worker      = bullmq.Worker;
  QueueEvents = bullmq.QueueEvents;
  bullMQAvailable = true;
} catch {
  logger.warn('BullMQ not installed — using in-memory job runner (no Redis needed in dev)');
}

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const connection = bullMQAvailable ? {
  host: new URL(REDIS_URL).hostname,
  port: parseInt(new URL(REDIS_URL).port) || 6379,
  password: new URL(REDIS_URL).password || undefined,
  tls: REDIS_URL.startsWith('rediss') ? {} : undefined,
} : null;

/* ════════════════════════════════════════════════════════════
   QUEUE DEFINITIONS
   ════════════════════════════════════════════════════════════ */
let queues = {};

function getQueue(name) {
  if (!bullMQAvailable) return null;
  if (!queues[name]) {
    queues[name] = new Queue(name, { connection, defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail:     50,
      attempts:         3,
      backoff:          { type: 'exponential', delay: 5000 },
    }});
  }
  return queues[name];
}

/* ════════════════════════════════════════════════════════════
   JOB ADDITIONS
   ════════════════════════════════════════════════════════════ */

/* Add tracking sync job for a shipment */
async function enqueueTrackingSync(shipmentId, awb, carrier, delay = 0) {
  await _logJob('SYNC_TRACKING', { shipmentId, awb, carrier });

  if (!bullMQAvailable) {
    // Dev mode: run immediately
    setTimeout(() => _runTrackingSync({ shipmentId, awb, carrier }), delay);
    return;
  }
  const q = getQueue('tracking');
  await q.add('sync', { shipmentId, awb, carrier }, {
    delay,
    jobId: `track_${awb}_${Date.now()}`,
  });
}

/* Add notification job */
async function enqueueNotification(type, data) {
  await _logJob('SEND_NOTIFICATION', { type, ...data });

  if (!bullMQAvailable) {
    setImmediate(() => _runNotification({ type, ...data }));
    return;
  }
  const q = getQueue('notifications');
  await q.add('send', { type, ...data }, { priority: type === 'OUT_FOR_DELIVERY' ? 1 : 5 });
}

/* Add PDF generation job */
async function enqueuePDFGeneration(type, id) {
  await _logJob('GEN_PDF', { type, id });

  if (!bullMQAvailable) {
    setImmediate(() => _runPDFGen({ type, id }));
    return;
  }
  const q = getQueue('pdfs');
  await q.add('generate', { type, id });
}

/* Add bulk tracking sync (all active shipments) */
async function enqueueBulkTrackingSync() {
  const active = await prisma.shipment.findMany({
    where: {
      status:  { notIn: ['Delivered', 'RTO', 'Cancelled'] },
      courier: { in: ['Delhivery', 'DTDC', 'BlueDart', 'FedEx', 'DHL'] },
    },
    select: { id: true, awb: true, courier: true },
    take:   500,
  });

  logger.info(`Bulk tracking sync: queuing ${active.length} shipments`);

  for (let i = 0; i < active.length; i++) {
    const s = active[i];
    // Stagger by 2 seconds each to avoid rate limiting
    await enqueueTrackingSync(s.id, s.awb, s.courier, i * 2000);
  }

  return active.length;
}

/* ════════════════════════════════════════════════════════════
   WORKERS — JOB PROCESSORS
   ════════════════════════════════════════════════════════════ */

function startWorkers() {
  if (!bullMQAvailable) {
    logger.info('Workers skipped — BullMQ not available (dev mode)');
    return;
  }

  /* Tracking worker */
  new Worker('tracking', async (job) => {
    return _runTrackingSync(job.data);
  }, { connection, concurrency: 5 });

  /* Notification worker */
  new Worker('notifications', async (job) => {
    return _runNotification(job.data);
  }, { connection, concurrency: 3 });

  /* PDF worker */
  new Worker('pdfs', async (job) => {
    return _runPDFGen(job.data);
  }, { connection, concurrency: 2 });

  logger.info('BullMQ workers started');
}

/* ── Job processors ── */
async function _runTrackingSync({ shipmentId, awb, carrier }) {
  const jobLog = await prisma.jobQueue.create({
    data: {
      type:      'SYNC_TRACKING',
      status:    'RUNNING',
      payload:   { shipmentId, awb, carrier },
      startedAt: new Date(),
    },
  });

  try {
    const { syncTrackingEvents } = require('./carrier.service');
    const count = await syncTrackingEvents(shipmentId, awb, carrier);

    await prisma.jobQueue.update({
      where: { id: jobLog.id },
      data:  { status: 'DONE', error: null, completedAt: new Date() },
    });

    // Check if any new NDR events need notifications
    await _checkAndSendTrackingNotifications(shipmentId);

    return { eventsAdded: count };
  } catch (err) {
    await prisma.jobQueue.update({
      where: { id: jobLog.id },
      data:  { status: 'FAILED', error: err.message, completedAt: new Date() },
    });
    throw err;
  }
}

async function _runNotification({ type, shipmentId, clientCode, data }) {
  try {
    const notify = require('./notification.service');
    if (shipmentId) {
      const s = await prisma.shipment.findUnique({ where: { id: shipmentId }, include: { client: true } });
      if (!s) return;
      if (type === 'SHIPMENT_BOOKED')      await notify.shipmentBooked(s, s.client);
      if (type === 'OUT_FOR_DELIVERY')     await notify.outForDelivery(s);
      if (type === 'DELIVERED')            await notify.delivered(s);
      if (type === 'NDR' && data?.reason)  await notify.ndrAlert(s, data.reason);
    }
  } catch (err) {
    logger.error(`Notification job failed: ${err.message}`);
    throw err;
  }
}

async function _runPDFGen({ type, id }) {
  try {
    if (type === 'LABEL') {
      const s = await prisma.shipment.findUnique({ where: { id } });
      if (!s) throw new Error('Shipment not found');
      const { generateShippingLabel } = require('./pdf.service');
      const buf = await generateShippingLabel(s);
      // In production: upload to S3/R2 and save URL
      logger.info(`Generated ${buf.length}-byte label for shipment ${id}`);
      return { size: buf.length };
    }
    if (type === 'INVOICE') {
      const inv = await prisma.invoice.findUnique({ where: { id }, include: { items: true, client: true } });
      if (!inv) throw new Error('Invoice not found');
      const { generateInvoicePDF } = require('./pdf.service');
      const buf = await generateInvoicePDF(inv, inv.items, inv.client);
      logger.info(`Generated ${buf.length}-byte invoice PDF for ${inv.invoiceNo}`);
      return { size: buf.length };
    }
  } catch (err) {
    logger.error(`PDF gen job failed: ${err.message}`);
    throw err;
  }
}

async function _checkAndSendTrackingNotifications(shipmentId) {
  const s = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    select: { id: true, status: true, courier: true },
  });
  if (!s) return;

  // Send notifications based on status changes
  if (s.status === 'OutForDelivery') await enqueueNotification('OUT_FOR_DELIVERY', { shipmentId });
  if (s.status === 'Delivered')      await enqueueNotification('DELIVERED', { shipmentId });
  if (s.status === 'Failed')         await enqueueNotification('NDR', { shipmentId, data: { reason: 'Delivery attempt failed' } });
}

/* ── Log job to DB ── */
async function _logJob(type, payload)  {
  try {
    await prisma.jobQueue.create({
      data: { type: jobName, status: 'PENDING', payload },
    });
  } catch (err) {
    logger.warn(`Failed to log job: ${err.message}`);
  }
}

/* ════════════════════════════════════════════════════════════
   SCHEDULED JOBS (run via node-cron or Railway cron)
   ════════════════════════════════════════════════════════════ */
async function setupScheduledJobs() {
  let cron;
  try { cron = require('node-cron'); }
  catch { logger.warn('node-cron not installed, skip scheduled jobs'); return; }

  // Every 30 minutes: sync all active shipment tracking
  cron.schedule('*/30 * * * *', async () => {
    logger.info('Scheduled: bulk tracking sync');
    try { await enqueueBulkTrackingSync(); }
    catch (err) { logger.error('Bulk sync failed:', err.message); }
  });

  // Daily at 9 AM: check NDR shipments older than 3 days
  cron.schedule('0 9 * * *', async () => {
    logger.info('Scheduled: NDR review check');
    try { await _checkStalledNDRs(); }
    catch (err) { logger.error('NDR check failed:', err.message); }
  });

  logger.info('Scheduled jobs set up');
}

async function _checkStalledNDRs() {
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - 3);

  const stalledNDRs = await prisma.nDREvent.findMany({
    where:   { action: 'PENDING', createdAt: { lt: threshold } },
    include: { shipment: true },
    take:    50,
  });

  for (const ndr of stalledNDRs) {
    logger.warn(`Stalled NDR: AWB ${ndr.awb}, ${Math.floor((Date.now() - ndr.createdAt) / 86400000)} days old`);
    // In production: escalate to ops manager, send alert
  }
}

/* ── Job status query ── */
async function getJobStats() {
  const [total, done, failed, running] = await Promise.all([
    prisma.jobQueue.count(),
    prisma.jobQueue.count({ where: { status: 'DONE' } }),
    prisma.jobQueue.count({ where: { status: 'FAILED' } }),
    prisma.jobQueue.count({ where: { status: 'RUNNING' } }),
  ]);
  return { total, done, failed, running, pending: total - done - failed - running };
}

module.exports = {
  enqueueTrackingSync,
  enqueueNotification,
  enqueuePDFGeneration,
  enqueueBulkTrackingSync,
  startWorkers,
  setupScheduledJobs,
  getJobStats,
};
