import { describe, expect, it } from 'vitest';
import {
  changePasswordSchema,
  createUserSchema,
  loginSchema,
  verifyOTPSchema,
} from '../../validators/auth.validator.js';
import {
  clientSchema,
  contractSchema,
  importSchema,
  invoiceSchema,
  scanAwbBulkSchema,
  shipmentSchema,
  statusUpdateSchema,
} from '../../validators/shipment.validator.js';
import {
  rechargeOrderSchema,
  rechargeVerifySchema,
  walletAdjustSchema,
  walletDebitSchema,
  walletTransactionsQuerySchema,
} from '../../validators/wallet.validator.js';
import {
  autoSuggestSchema,
  bulkCalculateSchema,
  verifySchema,
} from '../../validators/rates.validator.js';
import { bulkStatusSchema } from '../../validators/ops.validator.js';

describe('validators', () => {
  it('parses shipment payloads and normalises values', () => {
    const parsed = shipmentSchema.parse({
      clientCode: 'sea',
      awb: '  AWB1  ',
      weight: '2.5',
      amount: '150',
    });

    expect(parsed.clientCode).toBe('SEA');
    expect(parsed.awb).toBe('AWB1');
    expect(parsed.weight).toBe(2.5);
    expect(parsed.amount).toBe(150);
    expect(parsed.service).toBe('Standard');
  });

  it('validates shipment status and bulk scan limits', () => {
    expect(statusUpdateSchema.parse({ status: 'Delivered' }).status).toBe('Delivered');
    expect(() => scanAwbBulkSchema.parse({ awbs: Array.from({ length: 201 }, (_, i) => `${i}`) })).toThrow();
  });

  it('applies import, client, contract, and invoice defaults', () => {
    const imported = importSchema.parse({ shipments: [{ awb: 12345 }] });
    const client = clientSchema.parse({ code: 'sea', company: 'Sea Hawk', email: null });
    const contract = contractSchema.parse({ clientCode: 'sea', name: 'Std' });

    expect(imported.shipments[0]).toMatchObject({ clientCode: 'MISC', amount: 0, status: '' });
    expect(client.code).toBe('SEA');
    expect(client.email).toBe('');
    expect(contract.clientCode).toBe('SEA');
    expect(() => invoiceSchema.parse({ clientCode: 'SEA', fromDate: '2026/01/01', toDate: '2026-01-31' })).toThrow();
  });

  it('enforces auth schemas and password policy', () => {
    expect(loginSchema.parse({ email: 'ops@test.com', password: 'x' }).email).toBe('ops@test.com');
    expect(verifyOTPSchema.parse({ email: 'ops@test.com', otp: '123456' }).otp).toBe('123456');
    expect(createUserSchema.parse({
      name: 'Ops User',
      email: 'ops@test.com',
      password: 'Secret@123',
      role: 'OPS_MANAGER',
    }).role).toBe('OPS_MANAGER');
    expect(() => changePasswordSchema.parse({ currentPassword: 'x', newPassword: 'weakpass' })).toThrow();
  });

  it('validates wallet payloads and query coercion', () => {
    expect(rechargeOrderSchema.parse({ clientCode: 'sea', amount: '250' }).clientCode).toBe('SEA');
    expect(rechargeVerifySchema.parse({
      clientCode: 'sea',
      amount: '250',
      razorpay_order_id: 'o1',
      razorpay_payment_id: 'p1',
    }).razorpay_signature).toBe('');
    expect(walletDebitSchema.parse({ clientCode: 'sea', amount: 25 }).amount).toBe(25);
    expect(walletAdjustSchema.parse({ clientCode: 'sea', amount: 25, type: 'CREDIT', description: 'Manual topup' }).type).toBe('CREDIT');
    expect(walletTransactionsQuerySchema.parse({ page: '2', limit: '10' })).toMatchObject({ page: 2, limit: 10 });
  });

  it('validates rate calculator schemas', () => {
    const auto = autoSuggestSchema.parse({ pincode: 110001, weight: '2', shipType: 'doc' });
    expect(auto.weight).toBe(2);
    expect(auto.pincode).toBe(110001);
    expect(() => autoSuggestSchema.parse({ weight: 1 })).toThrow();

    const bulk = bulkCalculateSchema.parse({ shipments: [{ state: 'Delhi', weight: 1.2 }] });
    expect(bulk.shipments[0].weight).toBe(1.2);
    expect(() => bulkCalculateSchema.parse({ shipments: [] })).toThrow();

    const verified = verifySchema.parse({ lines: [{ awb: 'A1', weight: '1.5' }] });
    expect(verified.lines[0].weight).toBe(1.5);
    expect(() => verifySchema.parse({ lines: [] })).toThrow();
  });

  it('validates ops bulk status schema', () => {
    const parsed = bulkStatusSchema.parse({ ids: ['1', '2'], status: 'InTransit' });
    expect(parsed.ids).toEqual([1, 2]);
    expect(parsed.status).toBe('InTransit');
    expect(() => bulkStatusSchema.parse({ ids: [], status: 'Delivered' })).toThrow();
  });
});
