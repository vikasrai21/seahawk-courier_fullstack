const { Queue } = require('bullmq');
const redis = require('./redis');
const logger = require('../utils/logger');

let scanQueue = null;
if (redis) {
  try {
    scanQueue = new Queue('bulk-scan', { connection: redis });
    logger.info('[BullMQ] bulk-scan queue initialized');
  } catch (e) {
    logger.error('[BullMQ] failed to initialize queue', { error: e.message });
  }
} else {
  logger.info('[BullMQ] Redis disabled; bulk-scan queue not initialized');
}

module.exports = { scanQueue };
