const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  const res = await p.$queryRawUnsafe('SELECT status, COUNT(*) as count FROM shipment_import_rows GROUP BY status');
  console.log(JSON.stringify(res, (k, v) => typeof v === 'bigint' ? v.toString() : v));
}

run().finally(() => process.exit());
