const prisma = require('../config/prisma');

/**
 * Heuristic-based predictive risk scoring for shipments.
 * @param {Object} data - The shipment creation payload.
 * @returns {Promise<{score: number, factors: string[]}>}
 */
exports.analyzeShipment = async (data) => {
  let score = 0;
  const factors = [];

  try {
    // 1. Payment Type Risk (If we infer COD from remarks or lack of amount payment)
    // Assume if amount > 0 and no payment id, or explicitly marked COD
    if (data.remarks?.toLowerCase().includes('cod') || data.department === 'COD') {
      score += 25;
      factors.push("Cash on Delivery (High historical RTO rate)");
    }

    // 2. High Value Risk
    if (data.amount > 5000) {
      score += 15;
      factors.push(`High Cart Value (₹${data.amount})`);
    }

    // 3. Pincode Risk (Historical check)
    if (data.pincode) {
      // Check if this pincode has high NDRs historically
      const pastNdrs = await prisma.shipment.count({
        where: { pincode: data.pincode, status: 'RTO Delivered' }
      });
      if (pastNdrs > 5) { // Threshold for demonstration
        score += 20;
        factors.push(`Pincode ${data.pincode} has a history of high RTOs`);
      }
    }

    // 4. Missing phone number
    if (!data.phone || data.phone.length < 10) {
      score += 30;
      factors.push("Missing or invalid Consignee Phone Number");
    } else {
      // 5. Consignee History
      const previousReturns = await prisma.shipment.count({
        where: { phone: data.phone, status: 'RTO Delivered' }
      });
      if (previousReturns > 0) {
        score += 30;
        factors.push(`Consignee has ${previousReturns} previous returned orders`);
      }
    }

    // Cap at 100
    if (score > 100) score = 100;

    return { score, factors };
  } catch (err) {
    // Fail silently so we don't block booking
    return { score: 0, factors: [] };
  }
};
