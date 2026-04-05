// src/utils/bootstrap-users.js
// Local helper to reset the admin password and optionally restore test users.
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const { assertSafeBootstrap, isTrue } = require('./bootstrap-guard');

const DEFAULT_CLIENT_CODE = 'SEA HAWK';
const DEMO_USERS = [
  { name: 'Admin', email: 'admin@seahawk.com', password: 'Admin@12345', role: 'ADMIN' },
  { name: 'Ops Manager', email: 'ops.manager@seahawk.com', password: 'Ops@12345', role: 'OPS_MANAGER' },
  { name: 'Client User', email: 'client.user@seahawk.com', password: 'Client@12345', role: 'CLIENT', clientCode: DEFAULT_CLIENT_CODE },
];

function hasFlag(flag) {
  return process.argv.includes(flag);
}

async function ensureClient() {
  await prisma.client.upsert({
    where: { code: DEFAULT_CLIENT_CODE },
    create: {
      code: DEFAULT_CLIENT_CODE,
      company: 'Sea Hawk Client',
      contact: 'Client User',
      phone: '9999999999',
    },
    update: {
      company: 'Sea Hawk Client',
      contact: 'Client User',
      phone: '9999999999',
    },
  });
}

async function upsertUser(definition, resetPassword = false) {
  const hashed = await bcrypt.hash(definition.password, 12);
  const existing = await prisma.user.findUnique({ where: { email: definition.email } });

  let user;
  if (existing) {
    user = await prisma.user.update({
      where: { email: definition.email },
      data: {
        name: definition.name,
        role: definition.role,
        ...(resetPassword ? { password: hashed } : {}),
      },
    });
  } else {
    user = await prisma.user.create({
      data: {
        name: definition.name,
        email: definition.email,
        password: hashed,
        role: definition.role,
      },
    });
  }

  if (definition.role === 'CLIENT' && definition.clientCode) {
    await prisma.clientUser.upsert({
      where: { userId: user.id },
      create: { userId: user.id, clientCode: definition.clientCode },
      update: { clientCode: definition.clientCode },
    });
  }

  return { email: definition.email, existed: !!existing, resetPassword };
}

async function main() {
  const guard = assertSafeBootstrap('bootstrap-users');
  const resetAdminOnly = hasFlag('--reset-admin');
  const restoreDemo = hasFlag('--restore-demo') || !resetAdminOnly;
  const showPasswords = hasFlag('--show-passwords') || guard.showPasswords || isTrue(process.env.SHOW_BOOTSTRAP_PASSWORDS);

  const results = [];

  if (restoreDemo) {
    await ensureClient();
    for (const user of DEMO_USERS) {
      results.push(await upsertUser(user, true));
    }
  } else {
    results.push(await upsertUser(DEMO_USERS[0], true));
  }

  console.log('\nBootstrap complete:');
  console.log('• ADMIN       → admin@seahawk.com');
  console.log('• OPS_MANAGER → ops.manager@seahawk.com');
  console.log('• CLIENT      → client.user@seahawk.com');
  console.log(`• CLIENT code → ${DEFAULT_CLIENT_CODE}`);
  console.log(`• Updated     → ${results.map(r => r.email).join(', ')}`);
  if (showPasswords) {
    console.log('• Passwords   → Admin@12345 / Ops@12345 / Client@12345');
  } else {
    console.log('• Passwords   → hidden (use --show-passwords or SHOW_BOOTSTRAP_PASSWORDS=true)');
  }

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
