// C:\Users\hp\OneDrive\Desktop\seahawk-full_stack\backend\src\tests\unit\pdfService.test.js
'use strict';

const mockDoc = {
  on: vi.fn(function(event, cb) {
    if (event === 'end') setTimeout(cb, 10);
    if (event === 'data') setTimeout(() => cb(Buffer.from('PDF_DATA')), 5);
    return this;
  }),
  page: { width: 300, height: 400 },
  rect: vi.fn().mockReturnThis(),
  fill: vi.fn().mockReturnThis(),
  stroke: vi.fn().mockReturnThis(),
  fontSize: vi.fn().mockReturnThis(),
  fillColor: vi.fn().mockReturnThis(),
  font: vi.fn().mockReturnThis(),
  text: vi.fn().mockReturnThis(),
  moveTo: vi.fn().mockReturnThis(),
  lineTo: vi.fn().mockReturnThis(),
  strokeColor: vi.fn().mockReturnThis(),
  lineWidth: vi.fn().mockReturnThis(),
  image: vi.fn().mockReturnThis(),
  roundedRect: vi.fn().mockReturnThis(),
  fillAndStroke: vi.fn().mockReturnThis(),
  save: vi.fn().mockReturnThis(),
  restore: vi.fn().mockReturnThis(),
  addPage: vi.fn().mockReturnThis(),
  end: vi.fn().mockReturnThis(),
};

// Variable must start with 'mock' to be used in vi.mock factory
vi.mock('pdfkit', () => {
  const m = vi.fn(() => mockDoc);
  return m;
});

const pdfService = require('../../services/pdf.service');

describe('pdf.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates a shipping label with correct AWB', async () => {
    const buffer = await pdfService.generateShippingLabel({ awb: 'AWB123', consignee: 'Test' });
    expect(buffer.toString()).toBe('PDF_DATA');
    expect(mockDoc.text).toHaveBeenCalledWith(expect.stringContaining('AWB123'), expect.any(Number), expect.any(Number), expect.any(Object));
  });

  it('handles Haryana client (intra-state) for CGST/SGST', async () => {
    const client = { company: 'Haryana Corp', gst: '06AAA', address: 'Gurgaon, Haryana' };
    await pdfService.generateInvoicePDF({ invoiceNo: 'INV1', gstAmount: 18, gstPercent: 18 }, [], client);
    expect(mockDoc.text).toHaveBeenCalledWith(expect.stringContaining('CGST + SGST'), expect.any(Number), expect.any(Number), expect.any(Object));
  });

  it('handles Delhi client (inter-state) for IGST', async () => {
    const client = { company: 'Delhi Corp', gst: '07AAA', address: 'New Delhi, Delhi' };
    await pdfService.generateInvoicePDF({ invoiceNo: 'INV2', gstAmount: 18, gstPercent: 18 }, [], client);
    expect(mockDoc.text).toHaveBeenCalledWith(expect.stringContaining('IGST'), expect.any(Number), expect.any(Number), expect.any(Object));
  });

  it('generates wallet receipt with taxable amount', async () => {
    const txn = { amount: 100, taxableAmount: 85, gstAmount: 15, receiptNo: 'R1' };
    await pdfService.generateWalletReceiptPDF(txn, { company: 'C1' });
    expect(mockDoc.text).toHaveBeenCalledWith(expect.stringContaining('WALLET TOP-UP'), expect.any(Number), expect.any(Number), expect.any(Object));
  });

  it('generates bulk labels and adds pages', async () => {
    const shipments = [{ awb: '1' }, { awb: '2' }, { awb: '3' }, { awb: '4' }, { awb: '5' }];
    await pdfService.generateBulkLabels(shipments);
    expect(mockDoc.addPage).toHaveBeenCalled();
  });
});
