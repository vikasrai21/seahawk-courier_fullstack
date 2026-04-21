'use strict';

const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const logger = require('./logger');
const { DEFAULT_OWNER_EMAIL } = require('./owner');

function isTrue(value) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
}

async function ensureStartupOwner() {
  if (!isTrue(process.env.AUTO_BOOTSTRAP_OWNER)) {
    return { skipped: true, reason: 'AUTO_BOOTSTRAP_OWNER disabled' };
  }

  const email = String(process.env.OWNER_EMAIL || DEFAULT_OWNER_EMAIL).trim().toLowerCase();
  const password = String(process.env.OWNER_PASSWORD || '').trim();
  const name = String(process.env.OWNER_NAME || 'Owner').trim() || 'Owner';
  const branch = String(process.env.OWNER_BRANCH || 'HQ').trim() || 'HQ';

  if (!email) {
    logger.warn('Startup owner bootstrap skipped: OWNER_EMAIL is empty.');
    return { skipped: true, reason: 'OWNER_EMAIL empty' };
  }

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    const needsUpdate = existing.role !== 'OWNER' || existing.active !== true || existing.name !== name || (existing.branch || '') !== branch;
    if (!needsUpdate) {
      return { skipped: true, reason: 'owner already present', email };
    }

    await prisma.user.update({
      where: { email },
      data: {
        role: 'OWNER',
        active: true,
        name,
        branch,
      },
      select: { id: true, email: true },
    });

    logger.info(`Startup owner bootstrap normalized existing owner account for ${email}.`);
    return { updated: true, email };
  }

  if (!password) {
    logger.warn('Startup owner bootstrap skipped: OWNER_PASSWORD is required when creating a new owner account.');
    return { skipped: true, reason: 'OWNER_PASSWORD missing', email };
  }

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: 'OWNER',
      branch,
      active: true,
      mustChangePassword: false,
    },
    select: { id: true, email: true },
  });

  logger.info(`Startup owner bootstrap created owner account for ${email}.`);
  return { created: true, email };
}

module.exports = {
  ensureStartupOwner,
};
