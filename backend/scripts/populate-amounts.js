'use strict';
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { calcShipmentRate } = require('../src/services/smartRevenue.service');

async function main() {
  // Fetch all shipments with amount = 0
  const shipments = await prisma.shipment.findMany({
    where: { amount: 0 },
    select: {
      id: true, destination: true, pincode: true,
      weight: true, courier: true, service: true, amount: true,
    },
  });
  console.log(`Found ${shipments.length} shipments with amount = 0`);

  let updated = 0, skipped = 0, errors = 0;

  for (const s of shipments) {
    try {
      const result = await calcShipmentRate(s);
      const calc = result.calculated || 0;
      if (calc > 0) {
        await prisma.shipment.update({ where: { id: s.id }, data: { amount: calc } });
        updated++;
      } else {
        skipped++;
      }
    } catch (err) {
      errors++;
    }
    if ((updated + skipped + errors) % 100 === 0) {
      console.log(`  Progress: ${updated} updated, ${skipped} skipped, ${errors} errors`);
    }
  }

  console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`);

  const final = await prisma.shipment.groupBy({
    by: ['courier'], _count: { id: true }, _sum: { amount: true },
  });
  console.log('\nFinal courier breakdown:');
  final.forEach(c => console.log(`  ${c.courier}: ${c._count.id} shipments, Rs ${c._sum.amount || 0}`));

  const zeroLeft = await prisma.shipment.count({ where: { amount: 0 } });
  console.log(`\nShipments still at Rs 0: ${zeroLeft}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
