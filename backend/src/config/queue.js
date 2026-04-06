const { Queue } = require('bullmq');
const redis = require('./redis');
const logger = require('../utils/logger');

function createScanQueue({
  redisClient = redis,
  QueueClass = Queue,
  loggerInstance = logger,
} = {}) {
  if (!redisClient) {
    loggerInstance.info('[BullMQ] Redis disabled; bulk-scan queue not initialized');
    return null;
  }

  try {
    const queue = new QueueClass('bulk-scan', { connection: redisClient });
    loggerInstance.info('[BullMQ] bulk-scan queue initialized');
    return queue;
  } catch (e) {
    loggerInstance.error('[BullMQ] failed to initialize queue', { error: e.message });
    return null;
  }
}

const scanQueue = createScanQueue();

module.exports = { scanQueue, createScanQueue };
