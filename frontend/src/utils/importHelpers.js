// ── Column auto-detection ─────────────────────────────────────────────────
// Maps any variation of a column name to our internal field name
export const FIELD_PATTERNS = {
  date:        [/^date$/i, /^dt$/i, /^dispatch.?date$/i, /^ship.?date$/i],
  clientCode:  [/^client/i, /^party/i, /^account/i, /^cust/i, /^company/i],
  awb:         [/^awb/i, /^airway/i, /^docket/i, /^consign.?no/i, /^tracking/i, /^cn\.?no/i, /^shipment.?no/i, /^doc.?no/i],
  consignee:   [/^consignee/i, /^receiver/i, /^recipient/i, /^deliver.?to/i, /^name/i],
  destination: [/^dest/i, /^city/i, /^to/i, /^location/i, /^place/i, /^pin/i],
  courier:     [/^courier/i, /^carrier/i, /^vendor/i, /^service.?provider/i, /^through/i],
  department:  [/^dept/i, /^department/i, /^division/i, /^branch/i, /^ref/i],
  weight:      [/^wt/i, /^weight/i, /^kg/i, /^gross/i, /^we?g?h?t$/i],
  amount:      [/^amt/i, /^amount/i, /^charges?/i, /^rate/i, /^price/i, /^freight/i, /^bill/i, /^rs/i, /^₹/i, /^total/i],
  status:      [/^status/i, /^state/i, /^delivery.?status/i],
  remarks:     [/^remark/i, /^note/i, /^comment/i, /^narration/i, /^description/i],
  service:     [/^service/i, /^mode/i, /^type/i, /^product/i],
};

export function detectField(colName) {
  const name = String(colName).trim();
  for (const [field, patterns] of Object.entries(FIELD_PATTERNS)) {
    if (patterns.some(p => p.test(name))) return field;
  }
  return null;
}

export function buildColumnMap(headers) {
  const map = {};
  const unmapped = [];
  headers.forEach(h => {
    const field = detectField(h);
    if (field && !map[field]) map[field] = h; // first match wins
    else if (!field) unmapped.push(h);
  });
  return { map, unmapped };
}

export function excelSerialToIsoDate(serial) {
  if (!Number.isFinite(serial)) return new Date().toISOString().split('T')[0];
  const wholeDays = Math.floor(serial);
  const utcMillis = Date.UTC(1899, 11, 30) + (wholeDays * 86400000);
  return new Date(utcMillis).toISOString().split('T')[0];
}

export function excelDateToString(val, ambiguousFormat = 'DMY') {
  if (typeof val === 'number') {
    return excelSerialToIsoDate(val);
  }
  if (typeof val === 'string') {
    // DD/MM/YYYY or DD-MM-YYYY
    const m = val.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
    if (m) {
      const first = Number(m[1]);
      const second = Number(m[2]);
      const y = m[3].length === 2 ? '20' + m[3] : m[3];
      let month = second;
      let day = first;

      if (first <= 12 && second <= 12 && ambiguousFormat === 'MDY') {
        month = first;
        day = second;
      } else if (first > 12 && second <= 12) {
        day = first;
        month = second;
      } else if (second > 12 && first <= 12) {
        month = first;
        day = second;
      }

      return `${y}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    }
    // YYYY-MM-DD already
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    return val;
  }
  return new Date().toISOString().split('T')[0];
}

export function smartNormalizeDates(rows) {
  const isoRows = rows.filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(String(row.date || '')));
  if (!isoRows.length) return rows;

  const monthCounts = isoRows.reduce((acc, row) => {
    const ym = row.date.slice(0, 7);
    acc[ym] = (acc[ym] || 0) + 1;
    return acc;
  }, {});

  const dominantMonth = Object.entries(monthCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0];

  if (!dominantMonth) return rows;
  const dominantMonthNo = Number(dominantMonth.slice(5, 7));

  return rows.map((row) => {
    const m = String(row.date || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return row;

    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);

    if (row.date.slice(0, 7) === dominantMonth) return row;
    if (month > 12 || day > 12) return row;
    if (day !== dominantMonthNo) return row;

    return {
      ...row,
      date: `${year}-${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}`,
      _dateCorrected: true,
    };
  });
}

export function mapRows(rawRows, colMap, dateFormat = 'DMY') {
  const rows = rawRows.map(row => {
    const s = {};
    for (const [field, col] of Object.entries(colMap)) {
      if (col && row[col] !== undefined && row[col] !== '') {
        s[field] = row[col];
      }
    }
    // Sanitise
    if (s.date)        s.date        = excelDateToString(s.date, dateFormat);
    else               s.date        = new Date().toISOString().split('T')[0];
    if (s.awb)         s.awb         = String(s.awb).trim();
    if (s.clientCode)  s.clientCode  = String(s.clientCode).trim().toUpperCase();
    if (s.consignee)   s.consignee   = String(s.consignee).trim().toUpperCase();
    if (s.destination) s.destination = String(s.destination).trim().toUpperCase();
    if (s.courier)     s.courier     = String(s.courier).trim();
    if (s.department)  s.department  = String(s.department).trim();
    if (s.remarks)     s.remarks     = String(s.remarks).trim();
    if (s.weight)      s.weight      = parseFloat(s.weight)  || 0;
    if (s.amount)      s.amount      = parseFloat(s.amount)  || 0;
    return s;
  }).filter(s => s.awb && String(s.awb).trim() !== '' && String(s.awb).trim() !== 'undefined');

  return smartNormalizeDates(rows);
}
