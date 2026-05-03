/* ============================================================
   ndrAutomation.service.js — Feature #2: Automated NDR Management Workflows
   Auto-reattempt scheduling, escalation rules, auto-RTO after N failures.
   ============================================================ */
'use strict';

const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const notification = require('./notification.service');

const DEFAULT_RULES = {
  maxAttempts: 3,
  reattemptDelayHours: 24,
  autoRTOAfterAttempts: 3,
  escalateAfterAttempts: 2,
  autoSendWhatsApp: true,
  autoSendEmail: true,
};

async function processNDREvent(shipmentId, ndrData = {}) {
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: { ndrEvents: { orderBy: { createdAt: 'desc' } }, client: { select: { company: true, email: true, phone: true, notificationConfig: true } } },
  });
  if (!shipment) throw new Error('Shipment not found');

  const attemptCount = shipment.ndrEvents.length + 1;
  const rules = { ...DEFAULT_RULES };

  // Create NDR event
  const ndrEvent = await prisma.nDREvent.create({
    data: {
      shipmentId,
      awb: shipment.awb,
      reason: ndrData.reason || 'Delivery attempt failed',
      description: ndrData.description || '',
      attemptNo: attemptCount,
      action: 'PENDING',
    },
  });

  // Determine automated action
  let automatedAction = null;

  if (attemptCount >= rules.autoRTOAfterAttempts) {
    // Auto-RTO: Too many failed attempts
    automatedAction = 'AUTO_RTO';
    await prisma.shipment.update({ where: { id: shipmentId }, data: { status: 'RTO', ndrStatus: 'RTO_INITIATED' } });
    await prisma.nDREvent.update({ where: { id: ndrEvent.id }, data: { action: 'RTO_INITIATED' } });
    logger.info(`[NDR-Auto] AWB ${shipment.awb}: Auto-RTO after ${attemptCount} attempts`);
  } else if (attemptCount >= rules.escalateAfterAttempts) {
    // Escalate to ops team
    automatedAction = 'ESCALATED';
    await prisma.nDREvent.update({ where: { id: ndrEvent.id }, data: { action: 'ESCALATED' } });
    await notification.sendOpsEscalationAlert({
      clientCode: shipment.clientCode, awb: shipment.awb, ndrId: ndrEvent.id,
      urgency: 'HIGH', note: `${attemptCount} failed attempts. Requires manual intervention.`,
    }).catch(e => logger.warn(`[NDR-Auto] Escalation email failed: ${e.message}`));
    logger.info(`[NDR-Auto] AWB ${shipment.awb}: Escalated after ${attemptCount} attempts`);
  } else {
    // Schedule reattempt
    automatedAction = 'REATTEMPT_SCHEDULED';
    const reattemptDate = new Date(Date.now() + rules.reattemptDelayHours * 3600000);
    await prisma.nDREvent.update({ where: { id: ndrEvent.id }, data: { action: 'REATTEMPT_SCHEDULED' } });
    logger.info(`[NDR-Auto] AWB ${shipment.awb}: Reattempt scheduled for ${reattemptDate.toISOString()}`);
  }

  // Send notifications to consignee
  if (rules.autoSendWhatsApp && shipment.phone) {
    const msg = attemptCount >= rules.autoRTOAfterAttempts
      ? `⚠️ Your shipment (AWB: ${shipment.awb}) delivery has been unsuccessful after ${attemptCount} attempts. It will be returned to the sender. Contact ${shipment.client?.company || 'support'} for assistance.`
      : `📦 Delivery attempt #${attemptCount} for AWB ${shipment.awb} was unsuccessful. Reason: ${ndrData.reason || 'Not available'}.\n\nWe'll reattempt delivery. Please ensure availability or contact us to update delivery instructions.`;
    await notification.sendWhatsApp(shipment.phone, msg).catch(e => logger.warn(`NDR WhatsApp failed: ${e.message}`));
  }

  return { ndrEvent, automatedAction, attemptCount, maxAttempts: rules.maxAttempts };
}

async function getAutomationStats() {
  const [total, pending, escalated, autoRto, reattempt] = await Promise.all([
    prisma.nDREvent.count(),
    prisma.nDREvent.count({ where: { action: 'PENDING' } }),
    prisma.nDREvent.count({ where: { action: 'ESCALATED' } }),
    prisma.nDREvent.count({ where: { action: 'RTO_INITIATED' } }),
    prisma.nDREvent.count({ where: { action: 'REATTEMPT_SCHEDULED' } }),
  ]);
  return { total, pending, escalated, autoRto, reattempt };
}

async function updateNDRAction(ndrId, action, data = {}) {
  const ndr = await prisma.nDREvent.findUnique({ where: { id: parseInt(ndrId) } });
  if (!ndr) throw new Error('NDR event not found');

  const update = { action };
  if (data.newAddress) update.newAddress = data.newAddress;
  if (action === 'RESOLVED' || action === 'DELIVERED') update.resolvedAt = new Date();

  return prisma.nDREvent.update({ where: { id: parseInt(ndrId) }, data: update });
}

async function processScheduledReattempts() {
  const pending = await prisma.nDREvent.findMany({
    where: { action: 'REATTEMPT_SCHEDULED', resolvedAt: null },
    include: { shipment: { select: { id: true, awb: true, status: true } } },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });

  let processed = 0;
  for (const ndr of pending) {
    if (['Delivered', 'RTO', 'Cancelled'].includes(ndr.shipment?.status)) {
      await prisma.nDREvent.update({ where: { id: ndr.id }, data: { action: 'CLOSED', resolvedAt: new Date() } });
      processed++;
    }
  }
  return { checked: pending.length, processed };
}

module.exports = { processNDREvent, getAutomationStats, updateNDRAction, processScheduledReattempts };
