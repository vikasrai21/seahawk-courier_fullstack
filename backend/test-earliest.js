const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const first = await prisma.shipment.findFirst({ orderBy: { date: 'asc' } });
  const countMar = await prisma.shipment.count({ where: { date: { gte: '2026-03-01', lte: '2026-03-31' } } });
  const total = await prisma.shipment.count();
  console.log('Earliest:', first?.date);
  console.log('March Shipments:', countMar);
  console.log('Total Shipments in DB:', total);
  process.exit(0);
}
main();
