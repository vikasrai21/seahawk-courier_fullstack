const { Worker } = require('bullmq');
const redis = require('../config/redis');
const logger = require('../utils/logger');
const { scanAwbAndUpdate } = require('../services/shipment.service');

const initWorkers = () => {
  if (!redis || redis.status !== 'ready') {
    logger.warn('[BullMQ] Redis is not ready or disabled. Worker not started.');
    return;
  }

  const worker = new Worker('bulk-scan', async (job) => {
    const { awbs, userId, courier, captureOnly } = job.data;
    const results = { successful: [], failed: [] };
    
    let processed = 0;
    
    for (const awb of awbs) {
      try {
        const data = await scanAwbAndUpdate(awb, userId, courier, {
          captureOnly: !!captureOnly,
          source: 'scanner_bulk',
        });
        results.successful.push({ awb, data: data.shipment, meta: data.meta || {} });
      } catch (err) {
        results.failed.push({ awb, error: err.message });
      }
      processed++;
      await job.updateProgress(Math.floor((processed / awbs.length) * 100));
    }
    
    return results;
  }, { connection: redis, concurrency: 1 });

  worker.on('completed', (job, returnvalue) => {
    logger.info(`[BullMQ] Bulk scan job ${job.id} completed.`, { successes: returnvalue.successful.length, failures: returnvalue.failed.length });
  });

  worker.on('failed', (job, err) => {
    logger.error(`[BullMQ] Bulk scan job ${job.id} failed.`, { error: err.message });
  });

  logger.info('[BullMQ] Scanner worker initialized and listening on "bulk-scan" queue');
};

module.exports = { initWorkers };
