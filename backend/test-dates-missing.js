const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const dates = await prisma.shipment.groupBy({ by: ['date'], _count: { id: true }, orderBy: { date: 'asc' }});
  console.log('Date distribution:', dates);
  process.exit(0);
}
main();
