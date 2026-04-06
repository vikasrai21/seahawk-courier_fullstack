// src/utils/scheduler.js — Background jobs + token cleanup + DB backups
'use strict';
const cron   = require('node-cron');
const prisma = require('../config/prisma');
const logger = require('./logger');
const config = require('../config');
const { cleanupExpiredTokens } = require('../services/auth.service');
const { syncTrackingEvents } = require('../services/carrier.service');
const geocode = require('../services/geocode.service');

// ── Tracking sync ──────────────────────────────────────────────────────────
async function syncTracking() {
  try {
    logger.info('Scheduler: starting tracking sync...');
    const pending = await prisma.shipment.findMany({
      where: { status: { notIn: ['Delivered', 'RTO', 'Cancelled'] } },
      select: { id: true, awb: true, courier: true },
      take: 200,
    });
    logger.info(`Scheduler: ${pending.length} shipments to sync`);

    let synced = 0;
    let failed = 0;

    for (const shipment of pending) {
      if (!shipment.awb || !shipment.courier) continue;

      try {
        await syncTrackingEvents(shipment.id, shipment.awb, shipment.courier);
        synced += 1;
      } catch (err) {
        failed += 1;
        logger.warn('Scheduler: shipment sync failed', {
          shipmentId: shipment.id,
          awb: shipment.awb,
          courier: shipment.courier,
          error: err.message,
        });
      }
    }

    logger.info(`Scheduler: tracking sync finished (${synced} synced, ${failed} failed)`);
  } catch (err) {
    logger.error('Scheduler: tracking sync failed', { error: err.message });
  }
}

// ── DB Backup to S3 / R2 ──────────────────────────────────────────────────
async function backupDatabase() {
  if (!config.backups.s3Bucket) {
    logger.warn('Scheduler: DB backup skipped — BACKUP_S3_BUCKET not configured');
    return;
  }
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  const date  = new Date().toISOString().split('T')[0];
  const file  = `/tmp/seahawk-backup-${date}.sql`;

  try {
    logger.info('Scheduler: starting DB backup...');
    const dbUrl = config.db.url;
    await execAsync(`pg_dump "${dbUrl}" -f "${file}" --no-password`);

    // Upload to S3/R2
    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    const fs = require('fs');
    const s3 = new S3Client({
      region: config.backups.s3Region,
      credentials: { accessKeyId: config.backups.s3Key, secretAccessKey: config.backups.s3Secret },
    });
    const fileStream = fs.createReadStream(file);
    await s3.send(new PutObjectCommand({
      Bucket: config.backups.s3Bucket,
      Key:    `backups/seahawk-${date}.sql`,
      Body:   fileStream,
    }));
    fs.unlinkSync(file);
    logger.info(`Scheduler: DB backup uploaded → s3://${config.backups.s3Bucket}/backups/seahawk-${date}.sql`);
  } catch (err) {
    logger.error('Scheduler: DB backup failed', { error: err.message });
  }
}

// ── NDR auto-escalation ───────────────────────────────────────────────────
async function escalateStaleNDRs() {
  try {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const stale = await prisma.nDREvent.findMany({
      where: { action: 'PENDING', createdAt: { lt: threeDaysAgo } },
      select: { id: true, awb: true },
    });
    if (stale.length > 0) {
      logger.warn(`Scheduler: ${stale.length} NDRs pending > 3 days — consider escalation`);
    }
  } catch (err) {
    logger.error('Scheduler: NDR check failed', { error: err.message });
  }
}

// ── Geo cache refresh for map pins ────────────────────────────────────────
async function refreshGeoCache() {
  try {
    const recent = await prisma.shipment.findMany({
      where: {
        status: { notIn: ['Delivered', 'RTO', 'Cancelled'] },
      },
      select: { pincode: true, destination: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 120,
    });
    const queries = recent.map((row) => row.pincode || row.destination).filter(Boolean);
    const refreshed = await geocode.refreshGeoCache(queries);
    logger.info(`Scheduler: geo cache refresh completed (${refreshed} new pins)`);
  } catch (err) {
    logger.error('Scheduler: geo cache refresh failed', { error: err.message });
  }
}

// ── Start all scheduled jobs ──────────────────────────────────────────────
function startScheduler() {
  // Tracking sync every 30 minutes
  cron.schedule('*/30 * * * *', syncTracking);

  // Cleanup expired/revoked refresh tokens — daily at 3am
  cron.schedule('0 3 * * *', () => {
    cleanupExpiredTokens().catch(err => logger.error('Token cleanup failed', { error: err.message }));
  });

  // DB backup — daily at 2am (only if configured)
  cron.schedule('0 2 * * *', backupDatabase);

  // NDR escalation check — daily at 9am
  cron.schedule('0 9 * * *', escalateStaleNDRs);

  // Geo cache refresh — hourly
  cron.schedule('15 * * * *', refreshGeoCache);

  logger.info('Scheduler started: tracking sync (30m), token cleanup (3am), DB backup (2am), NDR check (9am), geo cache (hourly)');
}

module.exports = { startScheduler };
