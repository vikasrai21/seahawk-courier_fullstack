import { describe, expect, it } from 'vitest';

const scannerFlow = await import('../../services/scannerFlow.service.js');

describe('scannerFlow.service', () => {
  describe('evaluateLookupCoverage', () => {
    it('requires a photo when destination and contact clues are missing', () => {
      const result = scannerFlow.evaluateLookupCoverage({
        clientCode: 'IMPORTCL',
        consignee: '',
        destination: '',
        pincode: '',
        phone: '',
      });

      expect(result.readyForNoPhoto).toBe(false);
      expect(result.missingForNoPhoto).toContain('destination');
      expect(result.missingForNoPhoto).toContain('pincode');
      expect(result.missingForNoPhoto).not.toContain('consignee');
    });

    it('allows no-photo processing when lookup has enough operational fields', () => {
      const result = scannerFlow.evaluateLookupCoverage({
        clientCode: 'IMPORTCL',
        consignee: 'Ravi Kumar',
        destination: 'Ludhiana',
        pincode: '141001',
        phone: '',
      });

      expect(result.readyForNoPhoto).toBe(true);
      expect(result.readyForAutoApprove).toBe(true);
      expect(result.missingForNoPhoto).toHaveLength(0);
    });

    it('does not treat MISC as a valid client match for auto-approval', () => {
      const result = scannerFlow.evaluateLookupCoverage({
        clientCode: 'MISC',
        consignee: 'Receiver',
        destination: 'Delhi',
        pincode: '110001',
      });

      expect(result.presence.clientCode).toBe(false);
      expect(result.readyForAutoApprove).toBe(false);
    });
  });

  describe('shouldAutoApproveScan', () => {
    it('auto-approves when all confidence scores clear the threshold', () => {
      const result = scannerFlow.shouldAutoApproveScan({
        ocrHints: {
          clientCode: 'IMPORTCL',
          consignee: 'Receiver',
          destination: 'Delhi',
          clientNameConfidence: 0.95,
          consigneeConfidence: 0.93,
          destinationConfidence: 0.91,
          pincodeConfidence: 0.96,
        },
        shipment: null,
        autoApproveThreshold: 0.85,
      });

      expect(result).toBe(true);
    });

    it('keeps review required when confidences are missing or too low', () => {
      const lowConfidence = scannerFlow.shouldAutoApproveScan({
        ocrHints: {
          clientCode: 'IMPORTCL',
          consignee: 'Receiver',
          destination: 'Delhi',
          clientNameConfidence: 0.95,
          consigneeConfidence: 0.52,
          destinationConfidence: 0.91,
        },
        shipment: null,
        autoApproveThreshold: 0.85,
      });

      const miscClient = scannerFlow.shouldAutoApproveScan({
        ocrHints: {
          clientCode: 'MISC',
          consignee: 'Receiver',
          destination: 'Delhi',
          clientNameConfidence: 0.95,
          consigneeConfidence: 0.91,
          destinationConfidence: 0.91,
          pincodeConfidence: 0.91,
        },
        shipment: null,
        autoApproveThreshold: 0.85,
      });

      expect(lowConfidence).toBe(false);
      expect(miscClient).toBe(false);
    });
  });

  describe('buildScanResultPayload', () => {
    it('normalizes AWB output and marks pending review when auto-approval is not safe', () => {
      const result = scannerFlow.buildScanResultPayload({
        awb: 'scan_test_123',
        shipment: {
          id: 42,
          courier: 'DTDC',
          clientCode: 'IMPORTCL',
          consignee: 'RECEIVER',
          destination: 'DELHI',
          pincode: '110001',
          weight: 1.5,
          amount: 120,
          date: '2026-04-21',
        },
        ocrHints: {
          clientCode: 'IMPORTCL',
          clientName: 'Import Ledger Client',
        },
      });

      expect(result.awb).toBe('SCAN_TEST_123');
      expect(result.status).toBe('pending_review');
      expect(result.reviewRequired).toBe(true);
      expect(result.autoApproved).toBe(false);
      expect(result.shipmentId).toBe(42);
    });

    it('marks payload ok when auto-approval signals are strong enough', () => {
      const result = scannerFlow.buildScanResultPayload({
        awb: 'scan_test_456',
        shipment: {
          id: 43,
          courier: 'Trackon',
          clientCode: 'IMPORTCL',
          consignee: 'RECEIVER',
          destination: 'DELHI',
          pincode: '110001',
          weight: 2.4,
          amount: 240,
          date: '2026-04-21',
          client: { company: 'Import Ledger Client' },
        },
        ocrHints: {
          clientCode: 'IMPORTCL',
          clientName: 'Import Ledger Client',
          consignee: 'Receiver',
          destination: 'Delhi',
          pincode: '110001',
          clientNameConfidence: 0.94,
          consigneeConfidence: 0.92,
          destinationConfidence: 0.91,
          pincodeConfidence: 0.95,
        },
      });

      expect(result.awb).toBe('SCAN_TEST_456');
      expect(result.status).toBe('ok');
      expect(result.reviewRequired).toBe(false);
      expect(result.autoApproved).toBe(true);
    });
  });
});
