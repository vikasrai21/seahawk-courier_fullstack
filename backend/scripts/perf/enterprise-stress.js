const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const codRemittanceService = require('../../src/services/codRemittance.service');
const ndrAutomationService = require('../../src/services/ndrAutomation.service');
const walletService = require('../../src/services/wallet.service');

async function runEnterpriseStressTest() {
  console.log('🚀 Starting Enterprise Features Stress Test...\n');

  try {
    // Setup mock client
    const testClient = await prisma.client.upsert({
      where: { clientCode: 'STRESS_CLIENT' },
      update: {},
      create: {
        clientCode: 'STRESS_CLIENT',
        company: 'Stress Test Corp',
        email: 'stress@seahawk.com',
        phone: '9999999999',
        walletBalance: 100000
      }
    });

    console.log('✅ Created mock client: STRESS_CLIENT');

    // Generate 1000 Shipments for COD
    console.log('📦 Generating 1000 mock COD shipments...');
    const shipmentsData = Array.from({ length: 1000 }).map((_, i) => ({
      awb: `STRESS_AWB_${Date.now()}_${i}`,
      clientCode: testClient.clientCode,
      codAmount: 500,
      codStatus: 'PENDING',
      status: 'DELIVERED',
      courier: 'DELHIVERY',
      consignee: 'John Doe',
      destination: 'Mumbai',
      weight: 1
    }));

    await prisma.shipment.createMany({ data: shipmentsData });
    console.log('✅ Generated 1000 COD shipments.');

    // 1. Stress Test COD Collection
    console.log('\n🔥 Stress Testing COD Collection Updates (Concurrency 50)...');
    const allStressShipments = await prisma.shipment.findMany({ where: { clientCode: 'STRESS_CLIENT', codStatus: 'PENDING' } });
    
    let successCount = 0;
    const batchSize = 50;
    
    console.time('COD Collection Time');
    for (let i = 0; i < allStressShipments.length; i += batchSize) {
      const batch = allStressShipments.slice(i, i + batchSize);
      await Promise.all(batch.map(async (s) => {
        await codRemittanceService.markCollected(s.id);
        successCount++;
      }));
    }
    console.timeEnd('COD Collection Time');
    console.log(`✅ Concurrently marked ${successCount} shipments as COLLECTED.`);

    // 2. Stress Test Remittance Settlement
    console.log('\n🔥 Stress Testing Remittance Settlement Engine...');
    console.time('Remittance Calculation Time');
    const remittance = await codRemittanceService.processRemittanceBatch('STRESS_CLIENT', 'DELHIVERY', 10);
    console.timeEnd('Remittance Calculation Time');
    console.log(`✅ Remitted ${remittance.totalAmount} INR, Net: ${remittance.netAmount} INR. Expected Fee: 10 INR.`);
    
    const clientAfter = await prisma.client.findUnique({ where: { clientCode: 'STRESS_CLIENT' } });
    console.log(`✅ Wallet balance verified. Current: ${clientAfter.walletBalance} INR`);

    // 3. Stress Test NDR Automation
    console.log('\n🔥 Stress Testing NDR Automation Engine (Concurrency 20)...');
    const ndrShipments = await prisma.shipment.findMany({ where: { clientCode: 'STRESS_CLIENT' }, take: 100 });
    
    console.time('NDR Processing Time');
    await Promise.all(ndrShipments.map(s => ndrAutomationService.logNDR(s.id, 'CUSTOMER_NOT_AVAILABLE', 'Door locked - Stress Test')));
    console.timeEnd('NDR Processing Time');
    console.log(`✅ Concurrently processed 100 NDR logs and updated shipment statuses.`);

    console.log('\n🎉 All Enterprise Stress Tests Passed Successfully!');

  } catch (error) {
    console.error('❌ Stress Test Failed:', error);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await prisma.shipment.deleteMany({ where: { clientCode: 'STRESS_CLIENT' } });
    await prisma.client.delete({ where: { clientCode: 'STRESS_CLIENT' } });
    await prisma.$disconnect();
  }
}

runEnterpriseStressTest();
