'use strict';
const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const crypto = require('crypto');

function getRazorpay() {
  const key = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key || !secret) throw new Error('Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  const Razorpay = require('razorpay');
  return new Razorpay({ key_id: key, key_secret: secret });
}

async function createOrder(clientCode, amount, description) {
  const rz = getRazorpay();
  const amountPaise = Math.round(Number(amount) * 100);
  if (amountPaise < 100) throw new Error('Minimum amount is ₹1');
  const receipt = `WLT-${clientCode}-${Date.now().toString(36).toUpperCase()}`;
  const rzOrder = await rz.orders.create({ amount: amountPaise, currency: 'INR', receipt, notes: { clientCode, type: 'wallet_recharge' } });
  const order = await prisma.paymentOrder.create({
    data: { clientCode, amount, razorpayOrderId: rzOrder.id, status: 'CREATED', description: description || 'Wallet Recharge', receipt },
  });
  logger.info(`[Razorpay] Order ${rzOrder.id} created for ${clientCode}: ₹${amount}`);
  return { orderId: rzOrder.id, amount: amountPaise, currency: 'INR', receipt, key: process.env.RAZORPAY_KEY_ID, paymentOrderId: order.id };
}

async function verifyPayment({ razorpay_order_id, razorpay_payment_id, razorpay_signature }) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error('Razorpay secret not configured');
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  if (expected !== razorpay_signature) throw new Error('Payment signature verification failed');
  const order = await prisma.paymentOrder.findUnique({ where: { razorpayOrderId: razorpay_order_id } });
  if (!order) throw new Error('Payment order not found');
  if (order.status === 'PAID') return { already: true, order };

  // Update order and credit wallet
  const walletSvc = require('./wallet.service');
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.paymentOrder.update({
      where: { razorpayOrderId: razorpay_order_id },
      data: { razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature, status: 'PAID', paidAt: new Date() },
    });
    return result;
  });
  // Credit wallet outside transaction
  await walletSvc.credit({ clientCode: order.clientCode, amount: Number(order.amount), reason: 'RAZORPAY_RECHARGE', ref: razorpay_payment_id }).catch(e => logger.error(`Wallet credit after payment failed: ${e.message}`));
  logger.info(`[Razorpay] Payment verified: ${razorpay_payment_id} for ${order.clientCode}`);
  return { verified: true, order: updated };
}

async function handleWebhook(body, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error('Webhook secret not configured');
  const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex');
  if (expected !== signature) throw new Error('Webhook signature invalid');
  const event = body.event;
  const payload = body.payload?.payment?.entity;
  if (!payload) return { skipped: true, reason: 'No payment entity' };
  if (event === 'payment.captured') {
    const order = await prisma.paymentOrder.findUnique({ where: { razorpayOrderId: payload.order_id } });
    if (order && order.status !== 'PAID') {
      await prisma.paymentOrder.update({ where: { id: order.id }, data: { status: 'PAID', razorpayPaymentId: payload.id, paidAt: new Date() } });
      const walletSvc = require('./wallet.service');
      await walletSvc.credit({ clientCode: order.clientCode, amount: Number(order.amount), reason: 'RAZORPAY_RECHARGE', ref: payload.id }).catch(e => logger.error(`Webhook wallet credit failed: ${e.message}`));
    }
  } else if (event === 'payment.failed') {
    const order = await prisma.paymentOrder.findUnique({ where: { razorpayOrderId: payload.order_id } });
    if (order) await prisma.paymentOrder.update({ where: { id: order.id }, data: { status: 'FAILED', failedAt: new Date() } });
  }
  return { processed: true, event };
}

async function getPaymentHistory(clientCode, { page = 1, limit = 20 } = {}) {
  const take = Math.min(Number(limit) || 20, 100);
  const skip = (Math.max(1, Number(page)) - 1) * take;
  const [orders, total] = await Promise.all([
    prisma.paymentOrder.findMany({ where: { clientCode }, orderBy: { createdAt: 'desc' }, take, skip }),
    prisma.paymentOrder.count({ where: { clientCode } }),
  ]);
  return { orders, pagination: { page: Number(page), limit: take, total } };
}

module.exports = { createOrder, verifyPayment, handleWebhook, getPaymentHistory };
