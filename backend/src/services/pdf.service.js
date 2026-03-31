/* ============================================================
   pdf.service.js — Feature #6: Label & Invoice PDF Generation
   
   Uses PDFKit (pure Node.js, no headless browser needed).
   Generates:
   - Shipping label (A6 format with barcode-style AWB)
   - Invoice PDF (A4)
   ============================================================ */

'use strict';

const COMPANY = {
  name:    'Sea Hawk Courier & Cargo',
  address: 'Shop 6 & 7, Rao Lal Singh Market, Sector-18',
  city:    'Gurugram – 122015, Haryana',
  phone:   '+91 99115 65523 / +91 83682 01122',
  gstin:   '06AJDPR0914N2Z1',
  hsnCode: '996812',
  email:   'info@seahawkcourier.in',
  website: 'seahawkcourier.in',
};

function fmtMoney(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleDateString('en-IN');
  } catch {
    return String(value);
  }
}

function getTaxBreakdown(invoice, client) {
  const gstAmount = Number(invoice?.gstAmount || 0);
  const gstPercent = Number(invoice?.gstPercent || 18);
  const companyStateCode = String(COMPANY.gstin || '').slice(0, 2);
  const clientStateCode = String(client?.gst || '').slice(0, 2);
  const intraState = clientStateCode ? clientStateCode === companyStateCode : /haryana/i.test(String(client?.address || ''));

  if (intraState) {
    return {
      label: 'CGST + SGST',
      placeOfSupply: 'Haryana',
      components: [
        { label: `CGST @ ${(gstPercent / 2).toFixed(1)}%`, amount: gstAmount / 2 },
        { label: `SGST @ ${(gstPercent / 2).toFixed(1)}%`, amount: gstAmount / 2 },
      ],
    };
  }

  return {
    label: 'IGST',
    placeOfSupply: client?.address || 'Inter-state supply',
    components: [
      { label: `IGST @ ${gstPercent}%`, amount: gstAmount },
    ],
  };
}

/* ── Lazy load PDFKit ── */
async function getPDF() {
  try { return require('pdfkit'); }
  catch { throw new Error('pdfkit not installed. Run: npm install pdfkit --save'); }
}

/* ════════════════════════════════════════════════════════════
   SHIPPING LABEL — A6 (105mm × 148mm)
   ════════════════════════════════════════════════════════════ */
async function generateShippingLabel(shipment) {
  const PDFDocument = await getPDF();

  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ size: 'A6', margin: 12, bufferPages: true });

    doc.on('data', c => chunks.push(c));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width;   // ~298pt
    const H = doc.page.height;  // ~420pt

    // ── Top header band ──
    doc.rect(0, 0, W, 40).fill('#0b1f3a');
    doc.fontSize(11).fillColor('#ffffff').font('Helvetica-Bold')
       .text('SEA HAWK COURIER & CARGO', 12, 10, { width: W - 24, align: 'center' });
    doc.fontSize(7).fillColor('rgba(255,255,255,0.7)')
       .text(COMPANY.phone, 12, 24, { width: W - 24, align: 'center' });

    // ── AWB box ──
    doc.rect(8, 48, W - 16, 42).stroke('#0b1f3a').lineWidth(2);
    doc.fontSize(7).fillColor('#666').font('Helvetica')
       .text('AWB / Tracking Number', 14, 52);
    doc.fontSize(16).fillColor('#0b1f3a').font('Helvetica-Bold')
       .text(shipment.awb || '', 14, 63, { width: W - 28, align: 'center' });

    // ── Barcode simulation (text-based) ──
    const barcodeY = 96;
    doc.rect(8, barcodeY, W - 16, 20).fill('#f0f0f0');
    doc.fontSize(5.5).fillColor('#333').font('Courier')
       .text(`||| ${(shipment.awb||'').split('').join(' |')} |||`, 14, barcodeY + 4, { width: W - 28, align: 'center' });

    // ── Addresses ──
    const lblY = 125;
    doc.moveTo(8, lblY - 4).lineTo(W - 8, lblY - 4).stroke('#ddd').lineWidth(0.5);

    // FROM
    doc.fontSize(7).fillColor('#888').font('Helvetica-Bold')
       .text('FROM', 10, lblY);
    doc.fontSize(8).fillColor('#000').font('Helvetica-Bold')
       .text(COMPANY.name, 10, lblY + 10);
    doc.fontSize(7).fillColor('#333').font('Helvetica')
       .text(COMPANY.address + ', ' + COMPANY.city, 10, lblY + 21, { width: (W/2) - 14 });

    // TO
    doc.fontSize(7).fillColor('#888').font('Helvetica-Bold')
       .text('TO', W/2 + 4, lblY);
    doc.fontSize(8).fillColor('#000').font('Helvetica-Bold')
       .text(shipment.consignee || 'Consignee', W/2 + 4, lblY + 10, { width: (W/2) - 14 });
    doc.fontSize(7.5).fillColor('#0b1f3a').font('Helvetica-Bold')
       .text(shipment.destination || '', W/2 + 4, lblY + 21, { width: (W/2) - 14 });
    if (shipment.pincode) {
      doc.fontSize(9).fillColor('#0b1f3a').font('Helvetica-Bold')
         .text(`PIN: ${shipment.pincode}`, W/2 + 4, lblY + 32, { width: (W/2) - 14 });
    }
    if (shipment.phone) {
      doc.fontSize(7).fillColor('#333').font('Helvetica')
         .text(`Ph: ${shipment.phone}`, W/2 + 4, lblY + 43, { width: (W/2) - 14 });
    }

    // Vertical divider
    doc.moveTo(W/2, lblY).lineTo(W/2, lblY + 56).stroke('#ddd');

    // ── Shipment details ──
    const dtlY = 193;
    doc.moveTo(8, dtlY - 4).lineTo(W - 8, dtlY - 4).stroke('#ddd');

    const details = [
      ['Date',       shipment.date],
      ['Courier',    shipment.courier || '—'],
      ['Service',    shipment.service],
      ['Weight',     shipment.weight ? `${(shipment.weight/1000).toFixed(3)} kg` : '—'],
      ['Pieces',     '1'],
      ['Status',     shipment.status],
    ];

    let cx = 10, cy = dtlY;
    details.forEach(([lbl, val], i) => {
      const col = i < 3 ? 0 : 1;
      cx = col === 0 ? 10 : W/2 + 4;
      cy = dtlY + (i % 3) * 20;
      doc.fontSize(6).fillColor('#888').font('Helvetica').text(lbl.toUpperCase(), cx, cy);
      doc.fontSize(8).fillColor('#000').font('Helvetica-Bold').text(val || '—', cx, cy + 8, { width: W/2 - 14 });
    });

    // ── Footer ──
    doc.moveTo(8, H - 30).lineTo(W - 8, H - 30).stroke('#ddd');
    doc.fontSize(5.5).fillColor('#999').font('Helvetica')
       .text(`GSTIN: ${COMPANY.gstin} | ${COMPANY.website} | Printed: ${new Date().toLocaleDateString('en-IN')}`,
             8, H - 22, { width: W - 16, align: 'center' });

    // ── CLIENT CODE watermark ──
    if (shipment.clientCode) {
      doc.fontSize(8).fillColor('#eee').font('Helvetica-Bold')
         .text(shipment.clientCode, W - 48, 52, { width: 40, align: 'right' });
    }

    doc.end();
  });
}

/* ════════════════════════════════════════════════════════════
   INVOICE PDF — A4
   ════════════════════════════════════════════════════════════ */
async function generateInvoicePDF(invoice, items, client) {
  const PDFDocument = await getPDF();
  const tax = getTaxBreakdown(invoice, client);

  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });

    doc.on('data', c => chunks.push(c));
    doc.on('end',  () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width;
    const pageM = 40;

    // ── Modern Header ──
    doc.rect(0, 0, W, 100).fill('#0f172a');
    doc.fontSize(22).fillColor('#ffffff').font('Helvetica-Bold')
       .text(COMPANY.name.toUpperCase(), pageM, 30);
    
    doc.fontSize(8.5).fillColor('rgba(255,255,255,0.7)').font('Helvetica')
       .text(`${COMPANY.address}, ${COMPANY.city}`, pageM, 60);
    doc.text(`GSTIN: ${COMPANY.gstin}  |  Support: ${COMPANY.phone}`, pageM, 72);

    // ── Tax Invoice Badge ──
    doc.rect(W - 200, 30, 160, 40).fill('#f97316');
    doc.fontSize(12).fillColor('#ffffff').font('Helvetica-Bold')
       .text('TAX INVOICE', W - 200, 38, { width: 160, align: 'center' });
    doc.fontSize(8).text(invoice.invoiceNo, W - 200, 54, { width: 160, align: 'center' });

    // ── Billing Grid ──
    const gridY = 125;
    doc.fontSize(8).fillColor('#64748b').font('Helvetica-Bold').text('BILL TO', pageM, gridY);
    doc.fontSize(11).fillColor('#0f172a').font('Helvetica-Bold').text(client?.company || invoice.clientCode, pageM, gridY + 12);
    doc.fontSize(8.5).fillColor('#334155').font('Helvetica').text([
      client?.address,
      client?.gst ? `GSTIN: ${client.gst}` : 'Unregistered Client'
    ].filter(Boolean).join('\n'), pageM, gridY + 28, { width: 240 });

    const infoX = W - 200;
    const infoRows = [
      ['Invoiced On', fmtDate(invoice.createdAt || new Date())],
      ['Service Period', `${invoice.fromDate} to ${invoice.toDate}`],
      ['Place of Supply', tax.placeOfSupply],
      ['HSN Code', COMPANY.hsnCode],
    ];

    infoRows.forEach((row, i) => {
      const py = gridY + (i * 22);
      doc.fontSize(7.5).fillColor('#94a3b8').font('Helvetica').text(row[0].toUpperCase(), infoX, py);
      doc.fontSize(9).fillColor('#0f172a').font('Helvetica-Bold').text(row[1], infoX, py + 10);
    });

    // ── Table ──
    const tY = 240;
    doc.rect(pageM, tY, W - pageM*2, 24).fill('#f8fafc');
    doc.rect(pageM, tY, W - pageM*2, 1).fill('#e2e8f0');
    doc.rect(pageM, tY + 24, W - pageM*2, 1).fill('#e2e8f0');

    const columns = [
      { id: '#',       x: pageM + 5,   w: 20 },
      { id: 'AWB No',  x: pageM + 30,  w: 100 },
      { id: 'Date',    x: pageM + 135, w: 60 },
      { id: 'Consignee', x: pageM + 200, w: 120 },
      { id: 'Dest',    x: pageM + 325, w: 80 },
      { id: 'Wt(kg)',  x: pageM + 410, w: 40 },
      { id: 'Amount',  x: pageM + 455, w: 60, align: 'right' },
    ];

    columns.forEach(col => {
      doc.fontSize(7.5).fillColor('#475569').font('Helvetica-Bold').text(col.id.toUpperCase(), col.x, tY + 8, { width: col.w, align: col.align || 'left' });
    });

    let rowY = tY + 32;
    items.forEach((item, i) => {
      if (rowY > 750) {
        doc.addPage();
        rowY = 40;
      }
      doc.fontSize(8).fillColor('#1e293b').font('Helvetica').text(String(i + 1), columns[0].x, rowY);
      doc.font('Helvetica-Bold').text(item.awb, columns[1].x, rowY);
      doc.font('Helvetica').text(item.date, columns[2].x, rowY);
      doc.text((item.consignee || '').slice(0, 22), columns[3].x, rowY);
      doc.text((item.destination || '').slice(0, 16), columns[4].x, rowY);
      doc.text(((item.weight || 0) / 1000).toFixed(3), columns[5].x, rowY, { width: columns[5].w, align: 'right' });
      doc.font('Helvetica-Bold').text(Number(item.amount || 0).toFixed(2), columns[6].x, rowY, { width: columns[6].w, align: 'right' });
      
      rowY += 18;
      if (i < items.length - 1) {
        doc.moveTo(pageM, rowY - 4).lineTo(W - pageM, rowY - 4).strokeColor('#f1f5f9').lineWidth(0.5).stroke();
      }
    });

    // ── Summary ──
    rowY += 10;
    if (rowY > 650) { doc.addPage(); rowY = 50; }
    
    const summaryX = W - 220;
    doc.rect(summaryX - 10, rowY, 190, 100).fill('#f8fafc');
    
    let sy = rowY + 10;
    const sRows = [
      ['Subtotal', fmtMoney(invoice.subtotal)],
      ...tax.components.map(c => [c.label, fmtMoney(c.amount)]),
    ];

    sRows.forEach(row => {
      doc.fontSize(8.5).fillColor('#64748b').font('Helvetica').text(row[0], summaryX, sy);
      doc.fillColor('#0f172a').font('Helvetica-Bold').text(row[1], summaryX + 110, sy, { width: 60, align: 'right' });
      sy += 18;
    });

    doc.moveTo(summaryX, sy).lineTo(summaryX + 175, sy).strokeColor('#e2e8f0').stroke();
    sy += 10;
    doc.fontSize(11).fillColor('#0f172a').font('Helvetica-Bold').text('Total Due', summaryX, sy);
    doc.fontSize(14).fillColor('#0f172a').text(fmtMoney(invoice.total), summaryX + 70, sy, { width: 100, align: 'right' });

    // ── Final Decorative & Legal ──
    const footerY = doc.page.height - 70;
    doc.fontSize(7).fillColor('#94a3b8').font('Helvetica')
       .text('Certified that the particulars given above are true and correct. This is a system-generated document and requires no physical signature.', 
             pageM, footerY, { width: W - pageM*2, align: 'center' });
    
    doc.fontSize(8).fillColor('#475569').font('Helvetica-Bold')
       .text('Thank you for choosing Seahawk Courier & Cargo', pageM, footerY + 20, { width: W - pageM*2, align: 'center' });

    doc.end();
  });
}

async function generateWalletReceiptPDF(txn, client) {
  const PDFDocument = await getPDF();
  const pseudoInvoice = {
    gstAmount: Number(txn.gstAmount || 0),
    gstPercent: Number(txn.gstPercent || 18),
  };
  const tax = getTaxBreakdown(pseudoInvoice, client);

  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });

    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const W = doc.page.width;
    const pageM = 40;

    doc.rect(0, 0, W, 72).fill('#0b1f3a');
    doc.fontSize(18).fillColor('#ffffff').font('Helvetica-Bold')
      .text(COMPANY.name, pageM, 18, { width: W - pageM * 2, align: 'left' });
    doc.fontSize(8).fillColor('rgba(255,255,255,0.65)').font('Helvetica')
      .text(`${COMPANY.address}, ${COMPANY.city}  |  ${COMPANY.phone}  |  GSTIN: ${COMPANY.gstin}`,
        pageM, 40, { width: W - pageM * 2 });

    doc.rect(0, 72, W, 36).fill('#e8580a');
    doc.fontSize(14).fillColor('#ffffff').font('Helvetica-Bold')
      .text(`WALLET TOP-UP RECEIPT — ${txn.receiptNo || txn.reference || txn.paymentId || txn.id}`, pageM, 84, { width: W - pageM * 2 });

    const cY = 130;
    doc.fontSize(8).fillColor('#888').font('Helvetica').text('RECEIVED FROM', pageM, cY);
    doc.fontSize(11).fillColor('#0b1f3a').font('Helvetica-Bold')
      .text(client?.company || txn.clientCode, pageM, cY + 14);
    doc.fontSize(8.5).fillColor('#333').font('Helvetica')
      .text([client?.address, client?.gst ? `GSTIN: ${client.gst}` : '', client?.phone ? `Ph: ${client.phone}` : ''].filter(Boolean).join('\n'),
        pageM, cY + 28);

    doc.fontSize(8).fillColor('#888').text('RECEIPT DATE', W - 200, cY);
    doc.fontSize(11).fillColor('#0b1f3a').font('Helvetica-Bold')
      .text(fmtDate(txn.createdAt || new Date()), W - 200, cY + 14);
    doc.fontSize(8).fillColor('#888').text('PAYMENT MODE', W - 200, cY + 34);
    doc.fontSize(10).fillColor('#0b1f3a').font('Helvetica-Bold')
      .text(txn.paymentMode || 'ONLINE', W - 200, cY + 47);
    doc.fontSize(8).fillColor('#888').text('HSN / SAC', W - 200, cY + 67);
    doc.fontSize(10).fillColor('#0b1f3a').font('Helvetica-Bold')
      .text(COMPANY.hsnCode, W - 200, cY + 80);

    const tableY = 230;
    doc.rect(pageM - 4, tableY, W - pageM * 2 + 8, 22).fill('#0b1f3a');
    [
      ['Description', pageM, 240],
      ['Reference', pageM + 220, 240],
      ['Taxable Amount', pageM + 340, 240],
      ['Total', pageM + 455, 240],
    ].forEach(([label, x, y]) => {
      doc.fontSize(7.5).fillColor('#fff').font('Helvetica-Bold').text(label, x, y);
    });

    doc.rect(pageM - 4, tableY + 22, W - pageM * 2 + 8, 24).fill('#f9fafb');
    doc.fontSize(8).fillColor('#111').font('Helvetica')
      .text(txn.description || 'Wallet recharge receipt', pageM, tableY + 30, { width: 210 });
    doc.text(txn.paymentId || txn.reference || '-', pageM + 220, tableY + 30, { width: 100 });
    doc.text(fmtMoney(txn.taxableAmount), pageM + 340, tableY + 30, { width: 90, align: 'right' });
    doc.text(fmtMoney(txn.amount), pageM + 455, tableY + 30, { width: 60, align: 'right' });

    let rowY = tableY + 70;
    [
      ['Taxable amount', fmtMoney(txn.taxableAmount)],
      ['HSN / SAC', COMPANY.hsnCode],
      ...tax.components.map((item) => [item.label, fmtMoney(item.amount)]),
      ['Total received', fmtMoney(txn.amount)],
      ['Wallet balance after credit', fmtMoney(txn.balance)],
    ].forEach(([label, value]) => {
      doc.fontSize(9).fillColor('#555').font('Helvetica').text(label, W - 220, rowY, { width: 120 });
      doc.fontSize(9).fillColor('#000').font('Helvetica-Bold').text(value, W - 100, rowY, { width: 60, align: 'right' });
      rowY += 18;
    });

    doc.fontSize(8).fillColor('#64748b').font('Helvetica')
      .text(`Tax type: ${tax.label} | Place of supply: ${tax.placeOfSupply}`, pageM, rowY + 16, { width: W - pageM * 2 });

    const fY = doc.page.height - 48;
    doc.moveTo(pageM, fY).lineTo(W - pageM, fY).stroke('#eee');
    doc.fontSize(8).fillColor('#aaa').font('Helvetica')
      .text(`This is a computer-generated wallet receipt. GSTIN: ${COMPANY.gstin} | ${COMPANY.website}`,
        pageM, fY + 10, { width: W - pageM * 2, align: 'center' });

    doc.end();
  });
}

/* ════════════════════════════════════════════════════════════
   BULK LABELS — multiple shipments on one PDF
   ════════════════════════════════════════════════════════════ */
async function generateBulkLabels(shipments) {
  const PDFDocument = await getPDF();
  const chunks = [];

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 10, bufferPages: true, autoFirstPage: false });
    doc.on('data', c => chunks.push(c));
    doc.on('end', resolve);
    doc.on('error', reject);

    // 4 A6 labels per A4 page (2×2 grid)
    for (let i = 0; i < shipments.length; i += 4) {
      doc.addPage();
      const batch = shipments.slice(i, i + 4);
      batch.forEach((s, j) => {
        const col = j % 2;
        const row = Math.floor(j / 2);
        const ox  = 10 + col * 298;
        const oy  = 10 + row * 210;
        _drawMiniLabel(doc, s, ox, oy);
      });
    }
    doc.end();
  });

  return Buffer.concat(chunks);
}

function _drawMiniLabel(doc, s, ox, oy) {
  const W = 288, H = 200;
  doc.rect(ox, oy, W, H).stroke('#ccc').lineWidth(0.5);
  doc.rect(ox, oy, W, 22).fill('#0b1f3a');
  doc.fontSize(8).fillColor('#fff').font('Helvetica-Bold')
     .text('SEA HAWK COURIER', ox + 4, oy + 8, { width: W - 8, align: 'center' });
  doc.fontSize(10).fillColor('#0b1f3a').font('Courier-Bold')
     .text(s.awb || '', ox + 4, oy + 28, { width: W - 8, align: 'center' });
  doc.fontSize(7).fillColor('#555').font('Helvetica')
     .text(`TO: ${s.consignee || ''}`, ox + 4, oy + 46, { width: W - 8 });
  doc.fontSize(8).fillColor('#0b1f3a').font('Helvetica-Bold')
     .text(s.destination || '', ox + 4, oy + 57, { width: W - 8 });
  if (s.pincode) {
    doc.fontSize(8.5).fillColor('#e8580a').font('Helvetica-Bold')
       .text(`PIN: ${s.pincode}`, ox + 4, oy + 69, { width: W - 8 });
  }
  doc.fontSize(6.5).fillColor('#888').font('Helvetica')
     .text(`${s.courier || ''} | ${s.service || ''} | ${s.weight ? (s.weight/1000).toFixed(2)+'kg' : ''} | ${s.date || ''}`,
            ox + 4, oy + 83, { width: W - 8 });
}

module.exports = { generateShippingLabel, generateInvoicePDF, generateWalletReceiptPDF, generateBulkLabels };
