// src/utils/seed.js
// Safe seed:
// - creates a random admin on first run
// - does not auto-create demo clients or demo users
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const ADMIN_EMAIL = 'admin@seahawk.com';

async function createRandomFirstAdmin() {
  const existing = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });
  if (existing) return null;

  const rawPassword = crypto.randomBytes(12).toString('base64').slice(0, 16);
  const hashed = await bcrypt.hash(rawPassword, 12);

  await prisma.user.create({
    data: { name: 'Admin', email: ADMIN_EMAIL, password: hashed, role: 'ADMIN' },
  });

  return rawPassword;
}

async function seed() {
  console.log('🌱 Seeding database...');

  const firstAdminPassword = await createRandomFirstAdmin();

  if (firstAdminPassword) {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║        SEAHAWK — FIRST TIME SETUP        ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║  Email:    ${ADMIN_EMAIL.padEnd(29)} ║`);
    console.log(`║  Password: ${firstAdminPassword.padEnd(29)} ║`);
    console.log('╠══════════════════════════════════════════╣');
    console.log('║  ⚠️  SAVE THIS PASSWORD — shown once only ║');
    console.log('╚══════════════════════════════════════════╝\n');
  } else {
    console.log('✅ Admin user already exists — preserving current password.');
  }

  await prisma.$disconnect();
}

seed().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
