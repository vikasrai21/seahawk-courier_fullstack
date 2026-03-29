// src/utils/bootstrap-users.js
// Local helper to restore demo users and/or reset admin password.
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

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
      company: 'Sea Hawk Demo Client',
      contact: 'Client Demo User',
      phone: '9999999999',
    },
    update: {
      company: 'Sea Hawk Demo Client',
      contact: 'Client Demo User',
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
  const resetAdminOnly = hasFlag('--reset-admin');
  const restoreDemo = hasFlag('--restore-demo') || !resetAdminOnly;

  await ensureClient();

  const results = [];

  if (restoreDemo) {
    for (const user of DEMO_USERS) {
      results.push(await upsertUser(user, true));
    }
  } else {
    results.push(await upsertUser(DEMO_USERS[0], true));
  }

  console.log('\nBootstrap complete:');
  console.log('• ADMIN       → admin@seahawk.com / Admin@12345');
  console.log('• OPS_MANAGER → ops.manager@seahawk.com / Ops@12345');
  console.log('• CLIENT      → client.user@seahawk.com / Client@12345');
  console.log(`• CLIENT code → ${DEFAULT_CLIENT_CODE}`);
  console.log(`• Updated     → ${results.map(r => r.email).join(', ')}`);

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
