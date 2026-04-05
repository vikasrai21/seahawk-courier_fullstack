// src/config/prisma.js — Singleton Prisma client
const logger = require('../utils/logger');

if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
  module.exports = require('./__mocks__/prisma.js');
} else {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient({
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'event', level: 'error' },
    ],
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
