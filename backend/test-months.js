const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const feb = await prisma.shipment.count({ where: { date: { gte: '2026-02-01', lte: '2026-02-28' } } });
  const apr = await prisma.shipment.count({ where: { date: { gte: '2026-04-01', lte: '2026-04-30' } } });
  console.log('Feb:', feb, 'Apr:', apr);
  process.exit(0);
}
main();
