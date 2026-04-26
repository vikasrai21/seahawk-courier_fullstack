#!/usr/bin/env node
'use strict';
const path = require('path');
require('../node_modules/dotenv').config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('../node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const [shipments, audits] = await Promise.all([
    prisma.shipment.count(),
    prisma.auditLog.count(),
  ]);
  console.log('Real shipments in DB:', shipments);
  console.log('Audit log entries:   ', audits);
}

run().catch(console.error).finally(() => prisma.$disconnect());
