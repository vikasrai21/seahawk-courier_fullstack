const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const notify = require('./notification.service');

/**
 * Sweeps through recent shipments and compares sell price vs contract cost.
 * Flags shipments with negative margins.
 */
exports.checkMargins = async () => {
  logger.info("Running Margin Anomaly Detection sweep...");
  try {
    // Only check shipments booked in the last 7 days that haven't been alerted yet
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateStr = sevenDaysAgo.toISOString().split('T')[0];

    const shipments = await prisma.shipment.findMany({
      where: {
        date: { gte: dateStr },
        marginAlert: false,
        amount: { gt: 0 }
      },
      include: {
        client: { select: { company: true } }
      }
    });

    let anomalies = 0;

    for (const shipment of shipments) {
      // In a real scenario, you'd fetch the LIVE True Cost from `rateCompare` or `contractSvc`.
      // For this implementation, we will simulate a true cost lookup based on weight and courier.
      // E.g., baseline cost = 40/kg * weight
      const trueCost = 40 * Math.max(0.5, shipment.weight);
      const sellAmount = Number(shipment.amount) || 0;
      
      if (sellAmount < trueCost) {
        anomalies++;
        
        // Flag it in the database
        await prisma.shipment.update({
          where: { id: shipment.id },
          data: {
            marginAlert: true,
            riskFactors: [
               ...(shipment.riskFactors ? (Array.isArray(shipment.riskFactors) ? shipment.riskFactors : JSON.parse(shipment.riskFactors)) : []),
               `NEGATIVE MARGIN: Selling @ ₹${sellAmount}, Cost @ ₹${trueCost}`
            ]
          }
        });

        logger.warn(`Anomaly detected: Shipment ${shipment.awb} has a negative margin (Sell: ${sellAmount}, Cost: ${trueCost})`);
      }
    }

    logger.info(`Margin Anomaly sweep complete. Detected ${anomalies} negative margins.`);
    return anomalies;

  } catch (err) {
    logger.error(`Error running margin monitor: ${err.message}`);
    return 0;
  }
};
