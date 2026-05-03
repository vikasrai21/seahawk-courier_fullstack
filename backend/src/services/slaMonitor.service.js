'use strict';
const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const notification = require('./notification.service');

async function checkSLABreaches() {
  const rules = await prisma.sLARule.findMany({ where: { active: true } });
  if (!rules.length) return { checked: 0, breaches: 0 };

  const today = new Date();
  let breachCount = 0;
  const breaches = [];

  for (const rule of rules) {
    const where = { status: { in: ['Booked', 'InTransit', 'OutForDelivery'] } };
    if (rule.courier) where.courier = rule.courier;

    const cutoffDate = new Date(today.getTime() - rule.maxDays * 86400000).toISOString().split('T')[0];
    const warningDate = new Date(today.getTime() - rule.warningDays * 86400000).toISOString().split('T')[0];

    // Find breached shipments
    const breached = await prisma.shipment.findMany({
      where: { ...where, date: { lte: cutoffDate } },
      select: { id: true, awb: true, clientCode: true, courier: true, date: true, status: true, consignee: true },
      take: 100,
    });

    // Find warning shipments (approaching breach)
    const warning = await prisma.shipment.findMany({
      where: { ...where, date: { gt: cutoffDate, lte: warningDate } },
      select: { id: true, awb: true, clientCode: true, courier: true, date: true, status: true },
      take: 100,
    });

    for (const s of breached) {
      const daysSinceShip = Math.floor((today.getTime() - new Date(s.date).getTime()) / 86400000);
      breaches.push({ shipmentId: s.id, awb: s.awb, clientCode: s.clientCode, courier: s.courier, days: daysSinceShip, maxDays: rule.maxDays, severity: 'BREACH', ruleName: rule.name });
      breachCount++;
    }

    // Send notifications for breaches
    if (breached.length > 0 && rule.notifyEmail && rule.escalateTo) {
      const awbList = breached.slice(0, 20).map(s => s.awb).join(', ');
      await notification.sendEmail({
        to: rule.escalateTo,
        subject: `[SLA BREACH] ${breached.length} shipments exceeded ${rule.maxDays}-day SLA (${rule.name})`,
        text: `SLA Rule "${rule.name}" breached for ${breached.length} shipments.\n\nAWBs: ${awbList}\nCourier: ${rule.courier || 'All'}\nMax Days: ${rule.maxDays}\n\nPlease take immediate action.`,
        html: `<h3>SLA Breach Alert — ${rule.name}</h3><p><strong>${breached.length}</strong> shipments have exceeded the ${rule.maxDays}-day SLA.</p><p><strong>AWBs:</strong> ${awbList}</p><p><strong>Courier:</strong> ${rule.courier || 'All'}</p><p>Please log in to the dashboard for details.</p>`,
      }).catch(e => logger.warn(`SLA breach email failed: ${e.message}`));
    }

    if (warning.length > 0) {
      for (const s of warning) {
        const daysSinceShip = Math.floor((today.getTime() - new Date(s.date).getTime()) / 86400000);
        breaches.push({ shipmentId: s.id, awb: s.awb, clientCode: s.clientCode, courier: s.courier, days: daysSinceShip, maxDays: rule.maxDays, severity: 'WARNING', ruleName: rule.name });
      }
    }
  }

  logger.info(`[SLA Monitor] Checked ${rules.length} rules, found ${breachCount} breaches`);
  return { checked: rules.length, breaches: breachCount, details: breaches.slice(0, 200) };
}

async function getRules() {
  return prisma.sLARule.findMany({ orderBy: [{ active: 'desc' }, { createdAt: 'desc' }] });
}

async function upsertRule(data) {
  const payload = {
    name: data.name, courier: data.courier || null, service: data.service || null,
    maxDays: parseInt(data.maxDays), warningDays: parseInt(data.warningDays || data.maxDays - 1),
    notifyEmail: data.notifyEmail !== false, notifyWhatsapp: !!data.notifyWhatsapp,
    notifyWebhook: !!data.notifyWebhook, escalateTo: data.escalateTo || null, active: data.active !== false,
  };
  if (data.id) return prisma.sLARule.update({ where: { id: parseInt(data.id) }, data: payload });
  return prisma.sLARule.create({ data: payload });
}

async function deleteRule(ruleId) {
  return prisma.sLARule.delete({ where: { id: parseInt(ruleId) } });
}

module.exports = { checkSLABreaches, getRules, upsertRule, deleteRule };
