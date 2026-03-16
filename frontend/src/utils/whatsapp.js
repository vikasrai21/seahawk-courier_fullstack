import * as XLSX from 'xlsx';

const fmt    = n => `₹${Number(n||0).toLocaleString('en-IN')}`;
const fmtNum = n => Number(n||0).toFixed(1);
const LIMIT  = 5; // above this, always send Excel + short summary

function resolveNumber(raw) {
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits) return null;
  return digits.startsWith('91') ? digits : '91' + digits;
}

function buildTextReport({ rows, clientInfo, dateLabel, reportType }) {
  const total  = rows.reduce((a, r) => a + (r.amount || 0), 0);
  const weight = rows.reduce((a, r) => a + (r.weight || 0), 0);
  return [
    `🦅 *Seahawk Courier & Cargo*`,
    `📅 *${reportType} — ${dateLabel}*`,
    clientInfo ? `👤 *${clientInfo.company} (${clientInfo.code})*` : '',
    ``,
    ...rows.map((r, i) =>
      `${i + 1}. *${r.awb}* | ${r.consignee || '—'} | ${r.destination || '—'} | ${r.courier || '—'} | ${fmt(r.amount)}`
    ),
    ``,
    `📊 *Total Shipments:* ${rows.length}`,
    `💰 *Total Amount:* ${fmt(total)}`,
    `⚖️ *Total Weight:* ${fmtNum(weight)} kg`,
    ``,
    `Thank you for your business! 🙏`,
  ].filter(Boolean).join('\n');
}

function downloadExcel({ rows, clientInfo, dateLabel, reportType }) {
  const sheetRows = rows.map((r, i) => ({
    'Sr.':         i + 1,
    'Date':        r.date,
    'AWB No':      r.awb,
    'Consignee':   r.consignee || '',
    'Destination': r.destination || '',
    'Courier':     r.courier || '',
    'Dept':        r.department || '',
    'Weight (kg)': r.weight || 0,
    'Amount (₹)':  r.amount || 0,
    'Status':      r.status || '',
  }));

  const headerRows = [
    ['Seahawk Courier & Cargo'],
    [`${reportType} — ${dateLabel}`],
    ...(clientInfo ? [[`Client: ${clientInfo.code} — ${clientInfo.company}`]] : []),
    [`Generated: ${new Date().toLocaleDateString('en-IN')}`],
    [],
  ];

  const ws = XLSX.utils.aoa_to_sheet(headerRows);
  XLSX.utils.sheet_add_json(ws, sheetRows, { origin: { r: headerRows.length, c: 0 } });
  ws['!cols'] = [
    { wch: 4 }, { wch: 12 }, { wch: 18 }, { wch: 25 }, { wch: 18 },
    { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 14 },
  ];

  const total  = rows.reduce((a, r) => a + (r.amount || 0), 0);
  const weight = rows.reduce((a, r) => a + (r.weight || 0), 0);
  const summaryStart = headerRows.length + sheetRows.length + 1;
  XLSX.utils.sheet_add_aoa(ws, [
    [],
    ['', '', '', '', '', '', '', 'Total Weight (kg):', parseFloat(weight.toFixed(1))],
    ['', '', '', '', '', '', '', 'Total Amount (₹):',  parseFloat(total.toFixed(2))],
    ['', '', '', '', '', '', '', 'Total Shipments:',   rows.length],
  ], { origin: { r: summaryStart, c: 0 } });

  const wb    = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  const fname = clientInfo
    ? `seahawk-${clientInfo.code}-${dateLabel.replace(/[\s\/]/g, '-')}.xlsx`
    : `seahawk-report-${dateLabel.replace(/[\s\/]/g, '-')}.xlsx`;
  XLSX.writeFile(wb, fname);
  return fname;
}

// Main export — call this everywhere instead of building WA messages manually
export function sendWhatsAppReport({ rows, client, phoneRaw, dateLabel, reportType = 'Report' }) {
  const number = resolveNumber(phoneRaw);
  if (!number) return { error: 'No WhatsApp number saved for this client. Edit the client card to add one.' };

  const clientInfo = client ? { code: client.code, company: client.company } : null;
  const total      = rows.reduce((a, r) => a + (r.amount || 0), 0);
  const weight     = rows.reduce((a, r) => a + (r.weight || 0), 0);

  let message;
  let usedExcel = false;

  if (rows.length > LIMIT) {
    // Download Excel first
    const fname = downloadExcel({ rows, clientInfo, dateLabel, reportType });
    usedExcel   = true;
    message = [
      `🦅 *Seahawk Courier & Cargo*`,
      `📅 *${reportType} — ${dateLabel}*`,
      clientInfo ? `👤 *${clientInfo.company} (${clientInfo.code})*` : '',
      ``,
      `📎 The detailed report has been saved as an Excel file on your device:`,
      `   📄 *${fname}*`,
      ``,
      `📊 *Quick Summary*`,
      `   Shipments: *${rows.length}*`,
      `   Amount:    *${fmt(total)}*`,
      `   Weight:    *${fmtNum(weight)} kg*`,
      ``,
      `📌 To attach: tap the 📎 icon in WhatsApp → Files → select the file above.`,
      ``,
      `Thank you for your business! 🙏`,
    ].filter(Boolean).join('\n');
  } else {
    message = buildTextReport({ rows, clientInfo, dateLabel, reportType });
  }

  window.open(`https://wa.me/${number}?text=${encodeURIComponent(message)}`, '_blank');
  return { ok: true, usedExcel };
}
