'use strict';
const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const crypto = require('crypto');

// Shopify/WooCommerce integration management
async function connectChannel(clientCode, { platform, shopDomain, accessToken, apiKey, apiSecret, webhookSecret, defaultCourier, defaultWarehouse, autoFulfill }) {
  const existing = await prisma.channelIntegration.findUnique({ where: { clientCode_platform: { clientCode, platform } } });
  if (existing) throw new Error(`${platform} integration already exists for this client`);
  return prisma.channelIntegration.create({
    data: { clientCode, platform: platform.toUpperCase(), shopDomain, accessToken, apiKey, apiSecret, webhookSecret: webhookSecret || crypto.randomBytes(32).toString('hex'), syncEnabled: true, autoFulfill: !!autoFulfill, defaultCourier, defaultWarehouse, status: 'ACTIVE' },
  });
}

async function disconnectChannel(integrationId) {
  return prisma.channelIntegration.update({ where: { id: parseInt(integrationId) }, data: { status: 'DISCONNECTED', syncEnabled: false, accessToken: null } });
}

async function getClientIntegrations(clientCode) {
  return prisma.channelIntegration.findMany({ where: { clientCode }, orderBy: { createdAt: 'desc' } });
}

async function processShopifyOrder(clientCode, orderPayload) {
  const integration = await prisma.channelIntegration.findUnique({ where: { clientCode_platform: { clientCode, platform: 'SHOPIFY' } } });
  if (!integration || integration.status !== 'ACTIVE') throw new Error('Shopify integration not active');
  const order = orderPayload;
  const shipmentData = {
    clientCode, channelSource: 'SHOPIFY', channelOrderId: String(order.id || order.order_number),
    consignee: `${order.shipping_address?.first_name || ''} ${order.shipping_address?.last_name || ''}`.trim(),
    destination: [order.shipping_address?.address1, order.shipping_address?.address2, order.shipping_address?.city, order.shipping_address?.province].filter(Boolean).join(', '),
    pincode: order.shipping_address?.zip, phone: order.shipping_address?.phone || order.customer?.phone,
    codAmount: order.financial_status === 'pending' ? Number(order.total_price || 0) : 0,
    codStatus: order.financial_status === 'pending' ? 'PENDING' : null,
    contents: (order.line_items || []).map(i => i.title).join(', '),
    declaredValue: Number(order.total_price || 0),
  };
  await prisma.channelIntegration.update({ where: { id: integration.id }, data: { lastSyncAt: new Date() } });
  logger.info(`[Channel] Shopify order ${order.id} ingested for ${clientCode}`);
  return shipmentData;
}

async function processWooCommerceOrder(clientCode, orderPayload) {
  const integration = await prisma.channelIntegration.findUnique({ where: { clientCode_platform: { clientCode, platform: 'WOOCOMMERCE' } } });
  if (!integration || integration.status !== 'ACTIVE') throw new Error('WooCommerce integration not active');
  const order = orderPayload;
  const shipmentData = {
    clientCode, channelSource: 'WOOCOMMERCE', channelOrderId: String(order.id || order.number),
    consignee: `${order.shipping?.first_name || ''} ${order.shipping?.last_name || ''}`.trim(),
    destination: [order.shipping?.address_1, order.shipping?.address_2, order.shipping?.city, order.shipping?.state].filter(Boolean).join(', '),
    pincode: order.shipping?.postcode, phone: order.billing?.phone,
    codAmount: order.payment_method === 'cod' ? Number(order.total || 0) : 0,
    codStatus: order.payment_method === 'cod' ? 'PENDING' : null,
    contents: (order.line_items || []).map(i => i.name).join(', '),
    declaredValue: Number(order.total || 0),
  };
  await prisma.channelIntegration.update({ where: { id: integration.id }, data: { lastSyncAt: new Date() } });
  logger.info(`[Channel] WooCommerce order ${order.id} ingested for ${clientCode}`);
  return shipmentData;
}

function verifyShopifyWebhook(body, hmacHeader, secret) {
  const hash = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmacHeader || ''));
}

module.exports = { connectChannel, disconnectChannel, getClientIntegrations, processShopifyOrder, processWooCommerceOrder, verifyShopifyWebhook };
