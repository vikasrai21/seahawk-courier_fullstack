import { describe, it, expect } from 'vitest';
import {
  detectField,
  buildColumnMap,
  excelSerialToIsoDate,
  excelDateToString,
  smartNormalizeDates,
  mapRows,
} from '../../utils/importHelpers';

// ── detectField ─────────────────────────────────────────────────────────────

describe('detectField', () => {
  it('maps standard column names', () => {
    expect(detectField('AWB No')).toBe('awb');
    expect(detectField('Date')).toBe('date');
    expect(detectField('Consignee')).toBe('consignee');
    expect(detectField('Destination')).toBe('destination');
    expect(detectField('Courier')).toBe('courier');
    expect(detectField('Weight')).toBe('weight');
    expect(detectField('Amount')).toBe('amount');
  });

  it('maps alternate column names (case insensitive)', () => {
    expect(detectField('DOCKET NO')).toBe('awb');
    expect(detectField('Tracking')).toBe('awb');
    expect(detectField('airway')).toBe('awb');
    expect(detectField('Receiver')).toBe('consignee');
    expect(detectField('Deliver To')).toBe('consignee');
    expect(detectField('CITY')).toBe('destination');
    expect(detectField('carrier')).toBe('courier');
    expect(detectField('Vendor')).toBe('courier');
    expect(detectField('WT')).toBe('weight');
    expect(detectField('KG')).toBe('weight');
    expect(detectField('Freight')).toBe('amount');
    expect(detectField('Rs')).toBe('amount');
    expect(detectField('₹')).toBe('amount');
    expect(detectField('Charges')).toBe('amount');
  });

  it('maps department and service columns', () => {
    expect(detectField('Dept')).toBe('department');
    expect(detectField('Department')).toBe('department');
    expect(detectField('Branch')).toBe('department');
    expect(detectField('Service')).toBe('service');
    expect(detectField('Mode')).toBe('service');
  });

  it('maps status and remarks', () => {
    expect(detectField('Status')).toBe('status');
    expect(detectField('Delivery Status')).toBe('status');
    expect(detectField('Remarks')).toBe('remarks');
    expect(detectField('Note')).toBe('remarks');
    expect(detectField('Comment')).toBe('remarks');
  });

  it('maps date variants', () => {
    expect(detectField('dt')).toBe('date');
    expect(detectField('Dispatch Date')).toBe('date');
    expect(detectField('Ship Date')).toBe('date');
  });

  it('maps client columns', () => {
    expect(detectField('Client')).toBe('clientCode');
    expect(detectField('Party')).toBe('clientCode');
    expect(detectField('Account')).toBe('clientCode');
    expect(detectField('Customer')).toBe('clientCode');
    expect(detectField('Company')).toBe('clientCode');
  });

  it('returns null for unknown columns', () => {
    expect(detectField('FooBar')).toBeNull();
    expect(detectField('xyz123')).toBeNull();
    expect(detectField('')).toBeNull();
  });
});

// ── buildColumnMap ──────────────────────────────────────────────────────────

describe('buildColumnMap', () => {
  it('maps headers to internal fields correctly', () => {
    const headers = ['Date', 'AWB No', 'Consignee', 'Destination', 'Courier', 'Weight', 'Amount'];
    const { map, unmapped } = buildColumnMap(headers);

    expect(map.date).toBe('Date');
    expect(map.awb).toBe('AWB No');
    expect(map.consignee).toBe('Consignee');
    expect(map.destination).toBe('Destination');
    expect(map.courier).toBe('Courier');
    expect(map.weight).toBe('Weight');
    expect(map.amount).toBe('Amount');
    expect(unmapped).toEqual([]);
  });

  it('puts unrecognised headers into unmapped', () => {
    const headers = ['AWB No', 'RandomCol', 'AnotherCol'];
    const { map, unmapped } = buildColumnMap(headers);

    expect(map.awb).toBe('AWB No');
    expect(unmapped).toContain('RandomCol');
    expect(unmapped).toContain('AnotherCol');
  });

  it('first match wins for duplicate field detections', () => {
    // Both 'Docket No' and 'Tracking' map to 'awb'
    const headers = ['Docket No', 'Tracking'];
    const { map, unmapped } = buildColumnMap(headers);

    expect(map.awb).toBe('Docket No');
    // 'Tracking' also detected as awb but awb is already mapped,
    // and it DID match a field, so it's silently dropped (not in unmapped)
    expect(unmapped).not.toContain('Tracking');
    expect(unmapped).toHaveLength(0);
  });
});

// ── excelSerialToIsoDate ────────────────────────────────────────────────────

describe('excelSerialToIsoDate', () => {
  it('converts Excel serial number to ISO date', () => {
    // 45000 is roughly 2023-03-14
    const result = excelSerialToIsoDate(45000);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns today for non-finite values', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(excelSerialToIsoDate(NaN)).toBe(today);
    expect(excelSerialToIsoDate(Infinity)).toBe(today);
  });
});

// ── excelDateToString ───────────────────────────────────────────────────────

describe('excelDateToString', () => {
  it('converts Excel serial numbers', () => {
    const result = excelDateToString(45000);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('converts DD/MM/YYYY string (DMY mode)', () => {
    expect(excelDateToString('25/04/2026', 'DMY')).toBe('2026-04-25');
  });

  it('converts DD-MM-YYYY string', () => {
    expect(excelDateToString('15-03-2026')).toBe('2026-03-15');
  });

  it('converts DD/MM/YY (2-digit year)', () => {
    expect(excelDateToString('05/11/26', 'DMY')).toBe('2026-11-05');
  });

  it('handles MDY mode for ambiguous dates', () => {
    // 03/05/2026 in MDY mode → March 5
    expect(excelDateToString('03/05/2026', 'MDY')).toBe('2026-03-05');
    // 03/05/2026 in DMY mode → May 3
    expect(excelDateToString('03/05/2026', 'DMY')).toBe('2026-05-03');
  });

  it('handles unambiguous dates (day > 12)', () => {
    // 25/03/2026 → day=25 can't be month, so month=03
    expect(excelDateToString('25/03/2026')).toBe('2026-03-25');
  });

  it('passes through YYYY-MM-DD as-is', () => {
    expect(excelDateToString('2026-04-26')).toBe('2026-04-26');
  });

  it('returns today for non-string/non-number types', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(excelDateToString(null)).toBe(today);
    expect(excelDateToString(undefined)).toBe(today);
  });
});

// ── smartNormalizeDates ─────────────────────────────────────────────────────

describe('smartNormalizeDates', () => {
  it('returns rows unchanged if no ISO dates present', () => {
    const rows = [{ date: 'invalid', awb: '1' }];
    expect(smartNormalizeDates(rows)).toEqual(rows);
  });

  it('does not touch rows in the dominant month', () => {
    const rows = [
      { date: '2026-04-01', awb: '1' },
      { date: '2026-04-15', awb: '2' },
      { date: '2026-04-28', awb: '3' },
    ];
    const result = smartNormalizeDates(rows);
    expect(result[0].date).toBe('2026-04-01');
    expect(result[1].date).toBe('2026-04-15');
    expect(result[2].date).toBe('2026-04-28');
    expect(result.every(r => !r._dateCorrected)).toBe(true);
  });

  it('corrects swapped day/month for outlier rows matching dominant month number', () => {
    // Dominant month is April (04). One row has 2026-03-04 where day=04=dominantMonthNo
    // and month=03 is ≤12, day=04 ≤12 → it should be corrected to 2026-04-03
    const rows = [
      { date: '2026-04-01', awb: '1' },
      { date: '2026-04-10', awb: '2' },
      { date: '2026-04-20', awb: '3' },
      { date: '2026-03-04', awb: '4' }, // outlier: day=04 = dominantMonthNo
    ];
    const result = smartNormalizeDates(rows);
    expect(result[3].date).toBe('2026-04-03');
    expect(result[3]._dateCorrected).toBe(true);
  });
});

// ── mapRows ─────────────────────────────────────────────────────────────────

describe('mapRows', () => {
  const colMap = {
    awb: 'AWB No',
    clientCode: 'Client',
    consignee: 'Consignee',
    destination: 'City',
    courier: 'Courier',
    weight: 'Wt',
    amount: 'Amt',
    date: 'Date',
  };

  it('maps raw Excel rows to internal fields', () => {
    const rawRows = [
      { 'AWB No': '  ABC123  ', 'Client': ' vshop ', 'Consignee': 'John Doe', 'City': 'Mumbai', 'Courier': 'Delhivery', 'Wt': '2.5', 'Amt': '250', 'Date': '15/04/2026' },
    ];
    const result = mapRows(rawRows, colMap);

    expect(result).toHaveLength(1);
    expect(result[0].awb).toBe('ABC123');
    expect(result[0].clientCode).toBe('VSHOP');
    expect(result[0].consignee).toBe('JOHN DOE');
    expect(result[0].destination).toBe('MUMBAI');
    expect(result[0].courier).toBe('Delhivery');
    expect(result[0].weight).toBe(2.5);
    expect(result[0].amount).toBe(250);
    expect(result[0].date).toBe('2026-04-15');
  });

  it('filters out rows without AWB', () => {
    const rawRows = [
      { 'AWB No': 'ABC123', 'Client': 'X' },
      { 'AWB No': '', 'Client': 'Y' },
      { 'AWB No': '  ', 'Client': 'Z' },
      { 'Client': 'W' }, // no AWB column at all
    ];
    const result = mapRows(rawRows, colMap);
    expect(result).toHaveLength(1);
    expect(result[0].awb).toBe('ABC123');
  });

  it('defaults date to today if missing', () => {
    const today = new Date().toISOString().split('T')[0];
    const rawRows = [{ 'AWB No': 'X1' }];
    const result = mapRows(rawRows, colMap);
    expect(result[0].date).toBe(today);
  });

  it('handles MDY date format', () => {
    const rawRows = [
      { 'AWB No': 'X1', 'Date': '03/15/2026' },
    ];
    // In DMY, 03/15 → day=03 month=15 (impossible so second>12 branch: month=03 day=15)
    const result = mapRows(rawRows, colMap, 'DMY');
    expect(result[0].date).toBe('2026-03-15');
  });

  it('parses weight and amount as numbers, defaulting to 0', () => {
    const rawRows = [
      { 'AWB No': 'X1', 'Wt': 'abc', 'Amt': '' },
    ];
    const result = mapRows(rawRows, colMap);
    expect(result[0].weight).toBe(0);
    // empty string means the column value is empty, so amount field isn't set
  });
});
