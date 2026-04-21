import { describe, it, expect, vi } from 'vitest';

// Mock all DB-touching service dependencies so flows can be imported without DB
vi.mock('../../services/client.service', () => ({ createClient: vi.fn(), updateClient: vi.fn(), getClients: vi.fn(), deactivateClient: vi.fn() }));
vi.mock('../../services/invoice.service', () => ({ generateInvoice: vi.fn(), listInvoices: vi.fn(), markPaid: vi.fn() }));
vi.mock('../../services/wallet.service', () => ({ credit: vi.fn(), debit: vi.fn(), adjust: vi.fn(), getWallet: vi.fn(), getTransactions: vi.fn() }));
vi.mock('../../services/shipment.service', () => ({ createShipment: vi.fn(), searchShipments: vi.fn(), deleteShipment: vi.fn() }));
vi.mock('../../services/ndr.service', () => ({ getPendingNDRs: vi.fn(), resolveNDR: vi.fn() }));
vi.mock('../../config/prisma', () => ({ client: { findMany: vi.fn() }, shipment: { count: vi.fn(), findMany: vi.fn() } }));
vi.mock('../../utils/logger', () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }));

const flowRegistry = require('../../utils/agentFlows');

const EXPECTED_FLOWS = [
  'CREATE_CLIENT', 'UPDATE_CLIENT', 'DEACTIVATE_CLIENT', 'CLIENT_STATS', 'LIST_CLIENTS',
  'CREATE_SHIPMENT', 'TRACK_SHIPMENT', 'UPDATE_SHIPMENT_STATUS', 'DELETE_SHIPMENT',
  'SEARCH_SHIPMENTS', 'MONTHLY_STATS',
  'GENERATE_INVOICE', 'LIST_INVOICES', 'MARK_INVOICE_PAID',
  'WALLET_CREDIT', 'WALLET_BALANCE', 'WALLET_DEBIT', 'WALLET_ADJUST', 'WALLET_HISTORY',
  'NEGATIVE_WALLETS',
  'LIST_NDRS', 'RESOLVE_NDR',
  'LIST_RETURNS', 'APPROVE_RETURN', 'REJECT_RETURN', 'RETURN_STATS',
  'SYSTEM_OVERVIEW', 'COURIER_PERFORMANCE', 'DAILY_REPORT',
];

describe('agentFlows registry', () => {
  describe('getFlow', () => {
    it('returns null for unknown flow IDs', () => {
      expect(flowRegistry.getFlow('NONEXISTENT_FLOW_XYZ')).toBeNull();
    });

    it('returns null for null/empty input', () => {
      expect(flowRegistry.getFlow(null)).toBeNull();
      expect(flowRegistry.getFlow('')).toBeNull();
      expect(flowRegistry.getFlow(undefined)).toBeNull();
    });

    EXPECTED_FLOWS.forEach(flowId => {
      it(`flow "${flowId}" exists and has the correct shape`, () => {
        const flow = flowRegistry.getFlow(flowId);
        expect(flow, `Flow "${flowId}" must be registered`).toBeDefined();
        expect(flow.id).toBe(flowId);
        expect(typeof flow.description).toBe('string');
        expect(flow.description.length).toBeGreaterThan(0);
        expect(Array.isArray(flow.requiredFields)).toBe(true);
        expect(typeof flow.executor).toBe('function');
      });
    });

    it('every requiredField has a key and prompt', () => {
      EXPECTED_FLOWS.forEach(flowId => {
        const flow = flowRegistry.getFlow(flowId);
        if (!flow) return;
        for (const field of flow.requiredFields) {
          expect(field.key, `Flow "${flowId}" field missing key`).toBeDefined();
          expect(field.prompt, `Flow "${flowId}" field "${field.key}" missing prompt`).toBeDefined();
        }
      });
    });

    it('every optionalField (if present) has key and prompt', () => {
      EXPECTED_FLOWS.forEach(flowId => {
        const flow = flowRegistry.getFlow(flowId);
        if (!flow || !flow.optionalFields) return;
        expect(Array.isArray(flow.optionalFields)).toBe(true);
        for (const field of flow.optionalFields) {
          expect(field.key).toBeDefined();
          expect(field.prompt).toBeDefined();
        }
      });
    });

    it('flows with confirmBeforeExecute also have formatSummary', () => {
      EXPECTED_FLOWS.forEach(flowId => {
        const flow = flowRegistry.getFlow(flowId);
        if (!flow || !flow.confirmBeforeExecute) return;
        expect(typeof flow.formatSummary, `Flow "${flowId}" missing formatSummary`).toBe('function');
      });
    });
  });

  describe('getAllFlows', () => {
    it('returns an object with all registered flows', () => {
      const all = flowRegistry.getAllFlows?.();
      if (all) {
        expect(typeof all).toBe('object');
        expect(Object.keys(all).length).toBeGreaterThan(20);
      }
    });
  });
});
