const logger = require('../utils/logger');
const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL;
let redis = null;

if (redisUrl) {
  try {
    const options = {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) return true;
        return false;
      },
      retryStrategy: (times) => {
        // Exponential backoff with a cap of 2 seconds
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    };

    // Auto-detect TLS for Secure Redis (rediss://)
    if (redisUrl.startsWith('rediss://')) {
      options.tls = { rejectUnauthorized: true };
    }

    redis = new Redis(redisUrl, options);

    redis.on('error', (err) => {
      logger.error('Redis connection error:', { error: err.message });
    });

    redis.on('connect', () => {
      logger.info('Connected to Redis server');
    });

    redis.on('ready', () => {
      logger.info('Redis client is ready');
    });

  } catch (err) {
    logger.error('Failed to initialize Redis client', { error: err.message });
  }
} else {
  logger.info('Redis not configured; skipping Redis client initialization');
}

module.exports = redis;
