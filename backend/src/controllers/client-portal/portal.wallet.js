'use strict';

const prisma = require('../../config/prisma');
const pdf = require('../../services/pdf.service');
const R = require('../../utils/response');
const { resolveClientCode, enrichWalletReceipt } = require('./shared');

async function getWallet(req, res) {
  const clientCode = await resolveClientCode(req);
  if (!clientCode) return R.notFound(res, 'Client profile not found.');

  const [client, txns] = await Promise.all([
    prisma.client.findUnique({ where: { code: clientCode }, select: { code: true, company: true, walletBalance: true } }),
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

module.exports = { getWallet, receipt };
