const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const rows = await prisma.shipmentImportRow.findMany({ select: { date: true }, take: 5 });
  console.log('Import Row Dates:', rows);
  process.exit(0);
}
main();
