// backend/scripts/import-delhivery-pincodes.js
'use strict';

const fs = require('fs');
const path = require('path');
const prisma = require('../src/config/prisma');
const logger = require('../src/utils/logger');

/**
 * import-delhivery-pincodes.js
 * 
 * Usage: node scripts/import-delhivery-pincodes.js
 * 
 * Parses the Delhivery B2B Pincode CSV and imports/upserts into the database.
 * CSV Structure expected: ,Pin,Dispatch Center,Origin Center,Return Center,Facility City,Facility State,ODA
 */

async function main() {
  const csvPath = path.join(__dirname, '../../RATE CARDS/B2B_Pincode_List_seahawkcouriercargorp b2br_2026-03-30.csv');
  
  logger.info(`[Import] Starting Delhivery pincode import from: ${csvPath}`);
  
  if (!fs.existsSync(csvPath)) {
    logger.error(`[Import] CSV file not found at: ${csvPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim() !== '');
  
  // Skip header (line 0)
  const dataLines = lines.slice(1);
  logger.info(`[Import] Found ${dataLines.length} lines to process.`);

  const batchSize = 500; // Smaller batches for upsert stability
  let totalImported = 0;
  let totalSkipped = 0;

  for (let i = 0; i < dataLines.length; i += batchSize) {
    const batch = dataLines.slice(i, i + batchSize);
    
    // Parse batch
    const items = batch.map(line => {
      // Structure: index, Pin, Dispatch, Origin, Return, City, State, ODA
      const parts = line.split(',');
      if (parts.length < 8) return null;

      const pincode = parts[1]?.trim();
      const city = parts[5]?.trim();
      const state = parts[6]?.trim();
      const odaString = parts[7]?.trim().toLowerCase();
      const oda = odaString === 'true';

      if (!pincode || pincode.length !== 6 || isNaN(pincode)) {
        return null;
      }

      return { pincode, oda, facilityCity: city, facilityState: state };
    }).filter(Boolean);

    if (items.length === 0) {
      totalSkipped += batch.length;
      continue;
    }

    // Perform upserts in parallel within the batch
    try {
      await Promise.all(items.map(item => 
        prisma.delhiveryPincode.upsert({
          where: { pincode: item.pincode },
          update: {
            oda: item.oda,
            facilityCity: item.facilityCity,
            facilityState: item.facilityState,
            updatedAt: new Date(),
          },
          create: {
            pincode: item.pincode,
            oda: item.oda,
            facilityCity: item.facilityCity,
            facilityState: item.facilityState,
          }
        })
      ));
      totalImported += items.length;
      totalSkipped += (batch.length - items.length);
      
      if (totalImported % 2000 === 0 || totalImported === dataLines.length) {
        logger.info(`[Import] Progress: ${totalImported} imported, ${totalSkipped} skipped...`);
      }
    } catch (err) {
      logger.error(`[Import] Error in batch processing at lines ${i}-${i + batchSize}: ${err.message}`);
    }
  }

  logger.info(`[Import] Finished. Total Imported/Updated: ${totalImported}, Skipped: ${totalSkipped}`);
}

main()
  .catch(e => {
    logger.error(`[Import] Fatal error: ${e.message}`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
