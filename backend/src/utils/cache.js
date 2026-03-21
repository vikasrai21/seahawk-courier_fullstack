// src/utils/cache.js — Simple Redis cache with in-memory fallback
'use strict';
const logger = require('./logger');
const config = require('../config');

let redisClient = null;
const memCache  = new Map(); // fallback when Redis unavailable

async function getRedis() {
  if (redisClient) return redisClient;
  try {
    const { createClient } = require('redis');
    const client = createClient({ url: config.redis.url });
    client.on('error', err => logger.warn('Redis error (cache disabled):', err.message));
    await client.connect();
    redisClient = client;
    logger.info('Cache: Redis connected');
    return redisClient;
  } catch {
    logger.warn('Cache: Redis unavailable — using in-memory fallback');
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
    logger.warn(`Cache get failed for ${key}:`, err.message);
    return null;
  }
}

// ── set ───────────────────────────────────────────────────────────────────
async function set(key, value, ttlSeconds = 300) {
  try {
    const redis = await getRedis();
    if (redis) {
      await redis.setEx(key, ttlSeconds, JSON.stringify(value));
      return;
    }
    // in-memory fallback
    memCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  } catch (err) {
    logger.warn(`Cache set failed for ${key}:`, err.message);
  }
}

// ── del ───────────────────────────────────────────────────────────────────
async function del(key) {
  try {
    const redis = await getRedis();
    if (redis) { await redis.del(key); return; }
    memCache.delete(key);
  } catch {}
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

module.exports = { get, set, del, wrap };
