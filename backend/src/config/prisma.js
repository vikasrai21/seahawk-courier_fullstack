// src/config/prisma.js — Singleton Prisma client
const logger = require('../utils/logger');

if ((process.env.NODE_ENV === 'test' || process.env.VITEST) && !process.env.INTEGRATION_TEST) {
  module.exports = require('./__mocks__/prisma.js');
} else {
  const { PrismaClient } = require('@prisma/client');

  // Append connection pool params to DATABASE_URL if not already present
  const dbUrl = process.env.DATABASE_URL || '';
  const poolParams = 'connection_limit=20&pool_timeout=30';
  const separator = dbUrl.includes('?') ? '&' : '?';
  const pooledUrl = dbUrl.includes('connection_limit') ? dbUrl : `${dbUrl}${separator}${poolParams}`;

  const prisma = new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
    ],
    datasources: {
      db: { url: pooledUrl },
    },
  });

  if (process.env.NODE_ENV === 'development') {
    prisma.$on('query', (e) => {
      logger.debug(`Query: ${e.query} — ${e.duration}ms`);
    });
  }

  prisma.$on('error', (e) => {
    logger.error('Prisma error:', e);
  });

  module.exports = prisma;
}
