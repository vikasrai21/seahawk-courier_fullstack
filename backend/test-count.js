const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.shipment.count();
  console.log('Total Shipments in DB:', count);
  process.exit(0);
}
main();
