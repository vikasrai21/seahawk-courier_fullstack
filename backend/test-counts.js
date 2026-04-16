const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const shipments = await prisma.shipment.count();
  const imports = await prisma.shipmentImportRow.count();
  console.log('Shipments:', shipments);
  console.log('Imports:', imports);
  process.exit(0);
}
main();
