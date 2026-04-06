// src/utils/cache.js — Simple Redis cache with in-memory fallback
'use strict';
const logger = require('./logger');
const config = require('../config');
const Redis = require('ioredis');

function createCacheAPI({
  loggerInstance = logger,
  redisUrl = config.redis.url,
  RedisClass = Redis,
} = {}) {
  let redisClient = null;
  const memCache  = new Map(); // fallback when Redis unavailable

  async function getRedis() {
    if (redisClient) return redisClient;
    if (!redisUrl) return null;

    try {
      const client = new RedisClass(redisUrl, {
        maxRetriesPerRequest: 2,
        enableReadyCheck: true,
        lazyConnect: true,
      });
      client.on('error', (err) => loggerInstance.warn('Redis error (cache disabled):', err.message));
      await client.connect();
      redisClient = client;
      loggerInstance.info('Cache: Redis connected');
      return redisClient;
    } catch (err) {
      loggerInstance.warn('Cache: Redis unavailable — using in-memory fallback');
      loggerInstance.warn(`Cache: Redis init error: ${err.message}`);
      return null;
    }
  }

  // ── get ───────────────────────────────────────────────────────────────────
  async function get(key) {
    try {
      const redis = await getRedis();
      if (redis) {
        const val = await redis.get(key);
        return val ? JSON.parse(val) : null;
      }
      // in-memory fallback
      const entry = memCache.get(key);
      if (!entry) return null;
      if (Date.now() > entry.expiresAt) { memCache.delete(key); return null; }
      return entry.value;
    } catch (err) {
      loggerInstance.warn(`Cache get failed for ${key}:`, err.message);
      return null;
    }
  }

  // ── set ───────────────────────────────────────────────────────────────────
  async function set(key, value, ttlSeconds = 300) {
    try {
      const redis = await getRedis();
      if (redis) {
        await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        return;
      }
      // in-memory fallback
      memCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
    } catch (err) {
      loggerInstance.warn(`Cache set failed for ${key}:`, err.message);
    }
  }

  // ── del ───────────────────────────────────────────────────────────────────
  async function del(key) {
    try {
      const redis = await getRedis();
      if (redis) {
        await redis.del(key);
        return;
      }
      memCache.delete(key);
    } catch (err) {
      loggerInstance.warn(`Cache del failed for ${key}:`, err.message);
    }
  }

  async function delByPrefix(prefix) {
    try {
      const redis = await getRedis();
      if (redis) {
        const stream = redis.scanStream({ match: `${prefix}*`, count: 100 });
        const keys = [];
        return await new Promise((resolve, reject) => {
          stream.on('data', (resultKeys) => {
            if (Array.isArray(resultKeys) && resultKeys.length) keys.push(...resultKeys);
          });
          stream.on('end', async () => {
            if (keys.length) await redis.del(...keys);
            resolve();
          });
          stream.on('error', reject);
        });
      }

      for (const key of [...memCache.keys()]) {
        if (key.startsWith(prefix)) memCache.delete(key);
      }
    } catch (err) {
      loggerInstance.warn(`Cache delByPrefix failed for ${prefix}:`, err.message);
    }
  }

  // ── wrap — cache-aside helper ─────────────────────────────────────────────
  // Usage: const data = await cache.wrap('key', () => expensiveQuery(), 300)
  async function wrap(key, fn, ttlSeconds = 300) {
    const cached = await get(key);
    if (cached !== null) return cached;
    const fresh = await fn();
    await set(key, fresh, ttlSeconds);
    return fresh;
  }

  return { get, set, del, delByPrefix, wrap };
}

const defaultCache = createCacheAPI();

module.exports = { ...defaultCache, createCacheAPI };
