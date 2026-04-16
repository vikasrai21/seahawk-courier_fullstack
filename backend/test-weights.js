const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const shipments = await prisma.shipment.findMany({ select: { date: true, weight: true }, take: 10 });
  console.log('Shipments:', shipments);
  process.exit(0);
}
main();
