'use strict';
const { z } = require('zod');

const money = z.coerce.number().finite().positive('Amount must be greater than 0');
const clientCode = z.string().trim().min(1, 'Client code is required').max(20).transform(v => v.toUpperCase());

const rechargeOrderSchema = z.object({
  clientCode,
  amount: money.min(100, 'Minimum recharge amount is 100'),
});

const rechargeVerifySchema = z.object({
  clientCode,
  amount: money,
  razorpay_order_id: z.string().trim().min(1, 'Order id is required'),
  razorpay_payment_id: z.string().trim().min(1, 'Payment id is required'),
  razorpay_signature: z.string().trim().optional().default(''),
});

const walletDebitSchema = z.object({
  clientCode,
  amount: money,
  description: z.string().trim().max(200).optional(),
  reference: z.string().trim().max(100).optional(),
});

const walletAdjustSchema = z.object({
  clientCode,
  amount: money,
  type: z.enum(['CREDIT', 'DEBIT']),
  description: z.string().trim().min(3, 'Description is required').max(200),
});

const walletTransactionsQuerySchema = z.object({
  type: z.enum(['CREDIT', 'DEBIT']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  dateFrom: z.string().trim().optional(),
  dateTo: z.string().trim().optional(),
});

module.exports = {
  rechargeOrderSchema,
  rechargeVerifySchema,
  walletDebitSchema,
  walletAdjustSchema,
  walletTransactionsQuerySchema,
};
