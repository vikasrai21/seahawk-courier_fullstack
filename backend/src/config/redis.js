const logger = require('../utils/logger');

const redisUrl = process.env.REDIS_URL;
let redis = null;

if (redisUrl) {
  const Redis = require('ioredis');
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });

  redis.on('error', (err) => {
    logger.error('Redis connection error:', { error: err.message });
  });

  redis.on('connect', () => {
    logger.info('Connected to Redis server');
  });
} else {
  logger.info('Redis not configured; skipping Redis client initialization');
}

module.exports = redis;
