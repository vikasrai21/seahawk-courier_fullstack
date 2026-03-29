// src/utils/seed.js
// Safe seed:
// - always ensures baseline client records exist
// - creates a random admin on first run
// - restores fixed demo logins only in non-production unless explicitly disabled
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const ADMIN_EMAIL = 'admin@seahawk.com';
const DEFAULT_CLIENT_CODE = 'SEA HAWK';
const DEMO_USERS = [
  { name: 'Admin', email: 'admin@seahawk.com', password: 'Admin@12345', role: 'ADMIN' },
  { name: 'Ops Manager', email: 'ops.manager@seahawk.com', password: 'Ops@12345', role: 'OPS_MANAGER' },
  { name: 'Client User', email: 'client.user@seahawk.com', password: 'Client@12345', role: 'CLIENT', clientCode: DEFAULT_CLIENT_CODE },
];

function shouldSeedDemoUsers() {
  if (process.env.SEED_DEMO_USERS) {
    return process.env.SEED_DEMO_USERS === 'true';
  }
  return process.env.NODE_ENV !== 'production';
}

async function ensureClient(code, company, contact, phone) {
  return prisma.client.upsert({
    where: { code },
    create: { code, company, contact, phone },
    update: { company, contact, phone },
  });
}

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

async function ensureDemoUser(user) {
  const existing = await prisma.user.findUnique({ where: { email: user.email } });
  if (existing) {
    if (user.role === 'CLIENT' && user.clientCode) {
      await prisma.clientUser.upsert({
        where: { userId: existing.id },
        create: { userId: existing.id, clientCode: user.clientCode },
        update: { clientCode: user.clientCode },
      });
    }
    return { email: user.email, created: false, passwordReset: false };
  }

  const hashed = await bcrypt.hash(user.password, 12);
  const created = await prisma.user.create({
    data: {
      name: user.name,
      email: user.email,
      password: hashed,
      role: user.role,
    },
  });

  if (user.role === 'CLIENT' && user.clientCode) {
    await prisma.clientUser.upsert({
      where: { userId: created.id },
      create: { userId: created.id, clientCode: user.clientCode },
      update: { clientCode: user.clientCode },
    });
  }

  return { email: user.email, created: true, passwordReset: false };
}

async function seed() {
  console.log('🌱 Seeding database...');

  await ensureClient(DEFAULT_CLIENT_CODE, 'Sea Hawk Demo Client', 'Client Demo User', '9999999999');
  await ensureClient('SAMPLE', 'Sample Company Ltd', 'John Doe', '9999999999');

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

  if (shouldSeedDemoUsers()) {
    const results = [];
    for (const user of DEMO_USERS) {
      results.push(await ensureDemoUser(user));
    }

    console.log('\nDemo logins available for local development:');
    console.log('• ADMIN       → admin@seahawk.com / Admin@12345');
    console.log('• OPS_MANAGER → ops.manager@seahawk.com / Ops@12345');
    console.log('• CLIENT      → client.user@seahawk.com / Client@12345');
    console.log(`• CLIENT code → ${DEFAULT_CLIENT_CODE}`);
    console.log(`• Seed mode   → ${process.env.NODE_ENV || 'development'} (${results.filter(r => r.created).length} created, ${results.filter(r => !r.created).length} preserved)\n`);
  } else {
    console.log('ℹ️ Demo users skipped (production-safe mode). Set SEED_DEMO_USERS=true to enable them explicitly.');
  }

  await prisma.$disconnect();
}

seed().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
