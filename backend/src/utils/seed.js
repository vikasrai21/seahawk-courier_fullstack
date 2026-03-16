// src/utils/seed.js — Create initial admin user
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('🌱 Seeding database...');

  // Create default admin
  const password = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@seahawk.com' },
    create: { name: 'Admin', email: 'admin@seahawk.com', password, role: 'ADMIN' },
    update: { role: 'ADMIN', password }, // Always fix role + password on re-seed
  });
  console.log(`✅ Admin user: admin@seahawk.com / admin123`);

  // Create a sample client
  await prisma.client.upsert({
    where: { code: 'SAMPLE' },
    create: { code: 'SAMPLE', company: 'Sample Company Ltd', contact: 'John Doe', phone: '9999999999' },
    update: {},
  });
  console.log('✅ Sample client created: code = SAMPLE');

  console.log('\n⚠️  IMPORTANT: Change the admin password after first login!\n');
  await prisma.$disconnect();
}

seed().catch((e) => { console.error(e); process.exit(1); });
