'use strict';

const prisma = require('../../config/prisma');
const pdf = require('../../services/pdf.service');
const R = require('../../utils/response');
const { resolveClientCode, enrichWalletReceipt } = require('./shared');
const notify = require('../../services/notification.service');

async function getWallet(req, res) {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const [client, txns] = await Promise.all([
    prisma.client.findUnique({
      where: { code: clientCode },
      select: { code: true, company: true, walletBalance: true, autoTopupRule: true },
    }),
    prisma.walletTransaction.findMany({ where: { clientCode }, orderBy: { createdAt: 'desc' }, take: 50 }),
  ]);

  R.ok(res, { wallet: client, txns: txns.map(enrichWalletReceipt) });
}

async function receipt(req, res) {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const [client, txn] = await Promise.all([
    prisma.client.findUnique({
      where: { code: clientCode },
      select: { code: true, company: true, address: true, gst: true, phone: true },
    }),
    prisma.walletTransaction.findFirst({
      where: { id: parseInt(req.params.id, 10), clientCode },
    }),
  ]);
  if (!client || !txn) return R.notFound(res, 'Wallet transaction');
  if (txn.type !== 'CREDIT') return R.badRequest(res, 'Only credit transactions have GST receipts.');

  const enrichedTxn = enrichWalletReceipt(txn);
  const buf = await pdf.generateWalletReceiptPDF(enrichedTxn, client);
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="wallet-receipt-${enrichedTxn.receiptNo}.pdf"`,
    'Content-Length': buf.length,
  });
  res.send(buf);
}

function normaliseAutoTopupRule(input = {}) {
  const enabled = Boolean(input.enabled);
  const threshold = Math.max(0, Number(input.threshold || 0));
  const amount = Math.max(0, Number(input.amount || 0));
  const channel = String(input.channel || 'WHATSAPP').trim().toUpperCase();
  return {
    enabled,
    threshold: Number(threshold.toFixed(2)),
    amount: Number(amount.toFixed(2)),
    channel: ['WHATSAPP', 'EMAIL'].includes(channel) ? channel : 'WHATSAPP',
    whatsapp: String(input.whatsapp || '').replace(/\D/g, '') || null,
  };
}

async function getAutoTopup(req, res) {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const client = await prisma.client.findUnique({
    where: { code: clientCode },
    select: { code: true, autoTopupRule: true, whatsapp: true },
  });
  if (!client) return R.notFound(res, 'Client');

  const rule = normaliseAutoTopupRule({
    ...(client.autoTopupRule || {}),
    whatsapp: client.autoTopupRule?.whatsapp || client.whatsapp || '',
  });
  R.ok(res, { rule });
}

async function updateAutoTopup(req, res) {
  const clientCode = await resolveClientCode(req, req.body);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const rule = normaliseAutoTopupRule(req.body || {});
  if (rule.enabled && (rule.threshold < 100 || rule.amount < 100)) {
    return R.badRequest(res, 'Threshold and top-up amount must be at least ₹100 when auto-topup is enabled.');
  }
  if (rule.enabled && rule.channel === 'WHATSAPP' && !rule.whatsapp) {
    return R.badRequest(res, 'WhatsApp number is required for WhatsApp auto-topup alerts.');
  }

  await prisma.client.update({
    where: { code: clientCode },
    data: { autoTopupRule: rule },
  });

  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'CLIENT_WALLET_AUTOTOPUP_UPDATED',
      entity: 'CLIENT',
      entityId: clientCode,
      newValue: rule,
      ip: req.ip,
    },
  });

  R.ok(res, { rule }, 'Auto-topup rule updated.');
}

async function triggerAutoTopup(req, res) {
  const clientCode = await resolveClientCode(req, req.body);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const client = await prisma.client.findUnique({
    where: { code: clientCode },
    select: { company: true, walletBalance: true, whatsapp: true, email: true, autoTopupRule: true },
  });
  if (!client) return R.notFound(res, 'Client');

  const rule = normaliseAutoTopupRule({
    ...(client.autoTopupRule || {}),
    whatsapp: client.autoTopupRule?.whatsapp || client.whatsapp || '',
  });
  if (!rule.enabled) return R.badRequest(res, 'Auto-topup is disabled for this client.');
  if (client.walletBalance > rule.threshold) {
    return R.badRequest(res, `Current wallet balance is above threshold (₹${rule.threshold}).`);
  }

  const paymentUrl = `${req.protocol}://${req.get('host')}/portal/wallet`;
  const msg = `Sea Hawk Auto-Topup Alert\nClient: ${clientCode}\nBalance: ₹${Number(client.walletBalance || 0).toFixed(2)}\nSuggested top-up: ₹${Number(rule.amount || 0).toFixed(2)}\nPay link: ${paymentUrl}`;
  if (rule.channel === 'EMAIL' && client.email) {
    await notify.sendEmail({
      to: client.email,
      subject: `Wallet Auto-Topup Alert — ${clientCode}`,
      text: msg,
      html: `<p>${msg.replace(/\n/g, '<br/>')}</p>`,
    });
  } else {
    await notify.sendWhatsApp(rule.whatsapp || client.whatsapp || '', msg);
  }

  await prisma.auditLog.create({
    data: {
      userId: req.user.id,
      userEmail: req.user.email,
      action: 'CLIENT_WALLET_AUTOTOPUP_TRIGGERED',
      entity: 'CLIENT',
      entityId: clientCode,
      newValue: { channel: rule.channel, threshold: rule.threshold, amount: rule.amount },
      ip: req.ip,
    },
  });

  R.ok(res, { sent: true }, `Auto-topup ${rule.channel === 'EMAIL' ? 'email' : 'WhatsApp'} alert sent.`);
}

async function monthlyLedgerExport(req, res) {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const month = String(req.query?.month || '').trim();
  if (!/^\d{4}-\d{2}$/.test(month)) return R.badRequest(res, 'month must be in YYYY-MM format');
  const start = `${month}-01`;
  const endDate = new Date(`${start}T00:00:00.000Z`);
  endDate.setUTCMonth(endDate.getUTCMonth() + 1);
  const end = endDate.toISOString().slice(0, 10);

  const rows = await prisma.walletTransaction.findMany({
    where: {
      clientCode,
      createdAt: { gte: new Date(`${start}T00:00:00.000Z`), lt: new Date(`${end}T00:00:00.000Z`) },
    },
    orderBy: { createdAt: 'asc' },
  });

  const header = ['Date', 'TransactionId', 'Type', 'Amount', 'Balance', 'Description', 'Reference', 'PaymentMode', 'Status'];
  const csvRows = rows.map((row) => [
    new Date(row.createdAt).toISOString().slice(0, 10),
    row.id,
    row.type,
    Number(row.amount || 0).toFixed(2),
    Number(row.balance || 0).toFixed(2),
    (row.description || '').replace(/"/g, '""'),
    row.reference || '',
    row.paymentMode || '',
    row.status || '',
  ]);
  const csv = [header, ...csvRows].map((cols) => cols.map((v) => `"${String(v ?? '')}"`).join(',')).join('\n');

  res.set({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="wallet-ledger-${clientCode}-${month}.csv"`,
  });
  res.send(csv);
}

module.exports = {
  getWallet,
  receipt,
  getAutoTopup,
  updateAutoTopup,
  triggerAutoTopup,
  monthlyLedgerExport,
};
