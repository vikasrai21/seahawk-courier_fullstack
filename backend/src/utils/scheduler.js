// src/utils/scheduler.js — Background jobs with node-cron
// Fix #9: Replaces Windows-only .bat backup with cross-platform Node.js scheduler
const cron   = require('node-cron');
const path   = require('path');
const fs     = require('fs');
const { execSync } = require('child_process');
const logger = require('./logger');
const prisma = require('../config/prisma');

// ── Daily database backup at 2:00 AM ─────────────────────────────────────
function scheduleDailyBackup() {
  const dbUrl     = process.env.DATABASE_URL;
  if (!dbUrl) return logger.warn('Scheduler: DATABASE_URL not set, skipping backup job.');

  // Parse DB name from URL
  const dbMatch   = dbUrl.match(/\/([^/?]+)(\?|$)/);
  const dbName    = dbMatch?.[1] || 'seahawk_v6';
  const backupDir = path.join(__dirname, '../../backups');

  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  cron.schedule('0 2 * * *', () => {
    const date     = new Date().toISOString().split('T')[0];
    const filename = path.join(backupDir, `backup_${dbName}_${date}.sql`);

    try {
      execSync(`pg_dump "${dbUrl}" > "${filename}"`);
      logger.info(`Backup created: ${filename}`);

      // Delete backups older than 30 days
      const files = fs.readdirSync(backupDir).filter((f) => f.endsWith('.sql'));
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
      files.forEach((f) => {
        const fp = path.join(backupDir, f);
        if (fs.statSync(fp).mtimeMs < cutoff) {
          fs.unlinkSync(fp);
          logger.info(`Old backup deleted: ${f}`);
        }
      });
    } catch (err) {
      logger.error('Backup failed', { error: err.message });
    }
  }, { timezone: 'Asia/Kolkata' });

  logger.info('Scheduler: Daily backup job registered (2:00 AM IST)');
}

// ── Weekly audit log cleanup (keep 6 months) ──────────────────────────────
function scheduleAuditCleanup() {
  cron.schedule('0 3 * * 0', async () => { // Sunday 3:00 AM
    try {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - 6);

      const result = await prisma.auditLog.deleteMany({
        where: { createdAt: { lt: cutoff } },
      });
      logger.info(`Audit cleanup: removed ${result.count} old records`);
    } catch (err) {
      logger.error('Audit cleanup failed', { error: err.message });
    }
  }, { timezone: 'Asia/Kolkata' });

  logger.info('Scheduler: Weekly audit cleanup job registered (Sunday 3:00 AM IST)');
}

// ── Daily pending shipment summary log ───────────────────────────────────
function scheduleDailyReport() {
  cron.schedule('0 8 * * *', async () => { // 8:00 AM daily
    try {
      const pending = await prisma.shipment.count({
        where: { status: { in: ['Booked', 'InTransit', 'OutForDelivery'] } },
      });
      const delayed = await prisma.shipment.count({ where: { status: 'Delayed' } });
      const rto     = await prisma.shipment.count({ where: { status: 'RTO' } });
      logger.info('Daily summary', { pending, delayed, rto, time: new Date().toISOString() });
    } catch (err) {
      logger.error('Daily summary failed', { error: err.message });
    }
  }, { timezone: 'Asia/Kolkata' });

  logger.info('Scheduler: Daily summary job registered (8:00 AM IST)');
}

function startScheduler() {
  logger.info('Starting background scheduler...');
  scheduleDailyBackup();
  scheduleAuditCleanup();
  scheduleDailyReport();
}

module.exports = { startScheduler };
