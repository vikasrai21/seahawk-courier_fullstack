const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const badDates = [
    '2026-02-03', '2026-05-03', '2026-06-03', '2026-07-03', 
    '2026-09-03', '2026-10-03', '2026-11-03', '2026-12-03'
  ];

  for (const badDate of badDates) {
    const monthStr = badDate.substring(5, 7); // e.g. "05"
    const correctDate = `2026-03-${monthStr}`;
    
    const qty = await prisma.shipment.count({ where: { date: badDate } });
    if (qty > 0) {
      console.log(`Fixing ${qty} shipments from ${badDate} -> ${correctDate}`);
      await prisma.$executeRawUnsafe(`UPDATE shipments SET date = '${correctDate}' WHERE date = '${badDate}'`);
    }
  }

  // Also verify total March shipments now
  const countMar = await prisma.shipment.count({ 
    where: { date: { gte: '2026-03-01', lte: '2026-03-31' } } 
  });
  console.log('Total March Shipments after fix:', countMar);
  
  process.exit(0);
}
main();
