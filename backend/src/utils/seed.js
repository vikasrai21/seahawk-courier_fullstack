// src/utils/seed.js — Secure seed with random password
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const prisma  = require('../config/prisma');
const bcrypt  = require('bcryptjs');
const crypto  = require('crypto');

async function seed() {
  console.log('🌱 Seeding database...');

  // Check if admin already exists — never overwrite existing password
  const existing = await prisma.user.findUnique({ where: { email: 'admin@seahawk.com' } });

  if (existing) {
    console.log('✅ Admin user already exists — skipping seed to preserve password.');
    await prisma.$disconnect();
    return;
  }

  // Generate a secure random password on first run
  const rawPassword = crypto.randomBytes(12).toString('base64').slice(0, 16);
  const hashed      = await bcrypt.hash(rawPassword, 12);

  await prisma.user.create({
    data: { name: 'Admin', email: 'admin@seahawk.com', password: hashed, role: 'ADMIN' },
  });

  // Create a sample client
  await prisma.client.upsert({
    where:  { code: 'SAMPLE' },
    create: { code: 'SAMPLE', company: 'Sample Company Ltd', contact: 'John Doe', phone: '9999999999' },
    update: {},
  });

  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║        SEAHAWK — FIRST TIME SETUP        ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║  Email:    admin@seahawk.com              ║`);
  console.log(`║  Password: ${rawPassword.padEnd(30)} ║`);
  console.log('╠══════════════════════════════════════════╣');
  console.log('║  ⚠️  SAVE THIS PASSWORD — shown once only ║');
  console.log('╚══════════════════════════════════════════╝\n');

  await prisma.$disconnect();
}

seed().catch((e) => { console.error(e); process.exit(1); });
