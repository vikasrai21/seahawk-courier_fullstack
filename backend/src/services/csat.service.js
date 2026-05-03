'use strict';
const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const crypto = require('crypto');
const notification = require('./notification.service');
const config = require('../config');

async function createSurvey(shipmentId) {
  const shipment = await prisma.shipment.findUnique({ where: { id: parseInt(shipmentId) }, select: { id: true, awb: true, clientCode: true, consignee: true, phone: true, status: true } });
  if (!shipment) throw new Error('Shipment not found');
  if (shipment.status !== 'Delivered') throw new Error('Survey only for delivered shipments');
  const existing = await prisma.customerFeedback.findFirst({ where: { shipmentId: shipment.id } });
  if (existing) return existing;
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 86400000); // 7 days
  const feedback = await prisma.customerFeedback.create({
    data: { shipmentId: shipment.id, awb: shipment.awb, clientCode: shipment.clientCode, rating: 0, token, expiresAt },
  });
  // Send survey via WhatsApp
  if (shipment.phone) {
    const baseUrl = String(config.app?.publicBaseUrl || '').replace(/\/+$/, '');
    const surveyUrl = `${baseUrl}/feedback/${token}`;
    const msg = `Hi ${shipment.consignee || 'there'}! 📦\n\nYour shipment (AWB: ${shipment.awb}) has been delivered.\n\nPlease share your delivery experience:\n${surveyUrl}\n\nYour feedback helps us improve! ⭐\n\n— Sea Hawk Courier`;
    await notification.sendWhatsApp(shipment.phone, msg).catch(e => logger.warn(`CSAT WhatsApp failed: ${e.message}`));
  }
  return feedback;
}

async function submitFeedback(token, data) {
  const feedback = await prisma.customerFeedback.findUnique({ where: { token } });
  if (!feedback) throw new Error('Survey not found');
  if (feedback.submittedAt) throw new Error('Survey already submitted');
  if (feedback.expiresAt < new Date()) throw new Error('Survey has expired');
  return prisma.customerFeedback.update({
    where: { token },
    data: {
      rating: Math.min(5, Math.max(1, parseInt(data.rating) || 3)),
      comment: data.comment || null,
      deliveryRating: data.deliveryRating ? Math.min(5, Math.max(1, parseInt(data.deliveryRating))) : null,
      packagingRating: data.packagingRating ? Math.min(5, Math.max(1, parseInt(data.packagingRating))) : null,
      communicationRating: data.communicationRating ? Math.min(5, Math.max(1, parseInt(data.communicationRating))) : null,
      issues: Array.isArray(data.issues) ? data.issues : [],
      respondentName: data.respondentName || null, respondentPhone: data.respondentPhone || null,
      submittedAt: new Date(),
    },
  });
}

async function getCSATDashboard({ clientCode, dateFrom, dateTo } = {}) {
  const where = { submittedAt: { not: null } };
  if (clientCode) where.clientCode = clientCode;
  if (dateFrom || dateTo) { where.createdAt = {}; if (dateFrom) where.createdAt.gte = new Date(dateFrom); if (dateTo) where.createdAt.lte = new Date(dateTo); }
  const [avg, total, distribution] = await Promise.all([
    prisma.customerFeedback.aggregate({ where, _avg: { rating: true, deliveryRating: true, packagingRating: true, communicationRating: true }, _count: { id: true } }),
    prisma.customerFeedback.count({ where: { ...where, submittedAt: { not: null } } }),
    prisma.customerFeedback.groupBy({ by: ['rating'], where, _count: { id: true }, orderBy: { rating: 'asc' } }),
  ]);
  const csat = avg._count.id > 0 ? ((avg._avg.rating / 5) * 100).toFixed(1) : 0;
  const nps = await calculateNPS(where);
  return {
    csatScore: Number(csat), totalResponses: total, npsScore: nps,
    averages: { overall: Number((avg._avg.rating || 0).toFixed(2)), delivery: Number((avg._avg.deliveryRating || 0).toFixed(2)), packaging: Number((avg._avg.packagingRating || 0).toFixed(2)), communication: Number((avg._avg.communicationRating || 0).toFixed(2)) },
    distribution: distribution.map(d => ({ rating: d.rating, count: d._count.id })),
  };
}

async function calculateNPS(where) {
  const feedbacks = await prisma.customerFeedback.findMany({ where: { ...where, submittedAt: { not: null } }, select: { rating: true } });
  if (feedbacks.length === 0) return 0;
  const promoters = feedbacks.filter(f => f.rating >= 4).length;
  const detractors = feedbacks.filter(f => f.rating <= 2).length;
  return Number((((promoters - detractors) / feedbacks.length) * 100).toFixed(1));
}

async function getFeedbackByToken(token) {
  return prisma.customerFeedback.findUnique({ where: { token }, include: { shipment: { select: { awb: true, consignee: true, courier: true, status: true, date: true } } } });
}

module.exports = { createSurvey, submitFeedback, getCSATDashboard, getFeedbackByToken };
