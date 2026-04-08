const SEAHAWK_API_URL = 'https://YOUR-BACKEND-DOMAIN/api/public/integrations/excel/import';
const SEAHAWK_SYNC_KEY = 'PUT_YOUR_INTEGRATION_SYNC_API_KEY_HERE';
const SHEET_NAME = 'Shipments';

function syncSeahawkShipments() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error(`Sheet "${SHEET_NAME}" not found.`);
  }

  const values = sheet.getDataRange().getValues();
  if (!values.length) {
    Logger.log('No rows found.');
    return;
  }

  const headers = values[0].map((value) => String(value || '').trim().toLowerCase());
  const rows = values.slice(1).filter((row) => row.some((cell) => String(cell || '').trim() !== ''));

  const shipments = rows.map((row) => mapShipment(headers, row)).filter((row) => row.awb);
  if (!shipments.length) {
    Logger.log('No AWBs found to sync.');
    return;
  }

  const response = UrlFetchApp.fetch(SEAHAWK_API_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-sync-key': SEAHAWK_SYNC_KEY,
    },
    payload: JSON.stringify({ shipments }),
    muteHttpExceptions: true,
  });

  Logger.log(response.getContentText());
}

function mapShipment(headers, row) {
  const data = {};
  headers.forEach((header, index) => {
    data[header] = row[index];
  });

  return {
    date: toIsoDate(data.date || data.dispatch_date || data.ship_date),
    clientCode: cleanString(data.client || data.clientcode || data.party || data.account || 'MISC').toUpperCase(),
    awb: cleanString(data.awb || data.awb_no || data.docket || data.tracking || data.cnno).toUpperCase(),
    consignee: cleanString(data.consignee || data.receiver || data.recipient || data.name),
    destination: cleanString(data.destination || data.city || data.location || data.to),
    courier: cleanString(data.courier || data.carrier || data.vendor),
    department: cleanString(data.department || data.dept || data.branch),
    service: cleanString(data.service || data.mode || data.product || 'Standard'),
    weight: toNumber(data.weight || data.wt || data.kg),
    amount: toNumber(data.amount || data.amt || data.rate || data.price),
    remarks: cleanString(data.remarks || data.notes || data.comment),
    status: 'Booked',
  };
}

function cleanString(value) {
  return String(value || '').trim();
}

function toNumber(value) {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num : 0;
}

function toIsoDate(value) {
  if (!value) return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  if (Object.prototype.toString.call(value) === '[object Date]' && !Number.isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }

  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const match = text.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (match) {
    const dd = match[1].padStart(2, '0');
    const mm = match[2].padStart(2, '0');
    const yyyy = match[3].length === 2 ? `20${match[3]}` : match[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
}
