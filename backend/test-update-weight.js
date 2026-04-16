const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const res = await prisma.$executeRawUnsafe('UPDATE shipments SET weight = 0.5 WHERE weight = 0 OR weight IS NULL');
  console.log('Updated rows:', res);
  process.exit(0);
}
main();
