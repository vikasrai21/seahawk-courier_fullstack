require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { assertSafeBootstrap, isTrue } = require('./bootstrap-guard');
const { DEFAULT_OWNER_EMAIL } = require('./owner');

async function main() {
  const guard = assertSafeBootstrap('bootstrap-owner');
  const email = String(process.env.OWNER_EMAIL || DEFAULT_OWNER_EMAIL).trim().toLowerCase();
  const password = String(process.env.OWNER_PASSWORD || 'Owner@12345');
  const name = String(process.env.OWNER_NAME || 'Owner').trim();
  const branch = String(process.env.OWNER_BRANCH || 'HQ').trim();
  const showPasswords = process.argv.includes('--show-passwords') || guard.showPasswords || isTrue(process.env.SHOW_BOOTSTRAP_PASSWORDS);
  const hashed = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({ where: { email } });
  const user = existing
    ? await prisma.user.update({
        where: { email },
        data: { name, branch, role: 'ADMIN', active: true, password: hashed },
        select: { id: true, email: true, role: true },
      })
    : await prisma.user.create({
        data: { name, email, branch, role: 'ADMIN', active: true, password: hashed },
        select: { id: true, email: true, role: true },
      });

  console.log('\nOwner account ready:');
  console.log(`• Email    → ${email}`);
  console.log(`• Password → ${showPasswords ? password : 'hidden (use --show-passwords or SHOW_BOOTSTRAP_PASSWORDS=true)'}`);
  console.log(`• Role     → ${user.role}`);

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
