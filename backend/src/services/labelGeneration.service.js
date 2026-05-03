/* ============================================================
   labelGeneration.service.js — Feature #1: Multi-Carrier Shipping Label Generation
   Generates PDF shipping labels in 4x6 and A4 formats for all carriers.
   ============================================================ */
'use strict';

const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const PDFDocument = require('pdfkit');
const bwipjs = require('bwip-js');

const LABEL_FORMATS = { '4x6': { width: 288, height: 432 }, A4: { width: 595, height: 842 } };

async function generateLabel(shipmentId, format = '4x6') {
  const shipment = await prisma.shipment.findUnique({
    where: { id: parseInt(shipmentId) },
    include: { client: { select: { company: true, address: true, phone: true, gst: true } }, warehouse: true },
  });
  if (!shipment) throw new Error('Shipment not found');

  const dims = LABEL_FORMATS[format] || LABEL_FORMATS['4x6'];
  const doc = new PDFDocument({ size: [dims.width, dims.height], margin: 12 });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));

  // Generate barcode
  let barcodeBuffer = null;
  try {
    barcodeBuffer = await bwipjs.toBuffer({
      bcid: 'code128', text: shipment.awb, scale: 3, height: 10, includetext: true,
      textxalign: 'center', textsize: 8,
    });
  } catch (e) { logger.warn(`Barcode generation failed for ${shipment.awb}: ${e.message}`); }

  const is4x6 = format === '4x6';
  const fs = is4x6 ? 8 : 10;
  const hfs = is4x6 ? 11 : 14;
  const m = 12;
  let y = m;

  // Header
  doc.fontSize(hfs).font('Helvetica-Bold').text('SEA HAWK COURIER & CARGO', m, y, { width: dims.width - 2 * m, align: 'center' });
  y += hfs + 4;
  doc.moveTo(m, y).lineTo(dims.width - m, y).stroke(); y += 6;

  // AWB + Barcode section
  doc.fontSize(is4x6 ? 14 : 18).font('Helvetica-Bold').text(`AWB: ${shipment.awb}`, m, y, { width: dims.width - 2 * m, align: 'center' });
  y += (is4x6 ? 16 : 22);

  if (barcodeBuffer) {
    const bw = is4x6 ? 200 : 300;
    const bh = is4x6 ? 40 : 60;
    doc.image(barcodeBuffer, (dims.width - bw) / 2, y, { width: bw, height: bh });
    y += bh + 6;
  }
  doc.moveTo(m, y).lineTo(dims.width - m, y).stroke(); y += 8;

  // From section
  const pickupAddr = shipment.warehouse
    ? `${shipment.warehouse.name}, ${shipment.warehouse.address}, ${shipment.warehouse.city} - ${shipment.warehouse.pincode}`
    : `${shipment.client?.company || shipment.clientCode}, ${shipment.client?.address || 'N/A'}`;
  doc.fontSize(fs - 1).font('Helvetica-Bold').text('FROM:', m, y); y += fs + 2;
  doc.fontSize(fs).font('Helvetica').text(pickupAddr, m, y, { width: dims.width - 2 * m }); y += fs * 2 + 6;
  doc.moveTo(m, y).lineTo(dims.width - m, y).stroke(); y += 8;

  // To section
  doc.fontSize(fs - 1).font('Helvetica-Bold').text('TO:', m, y); y += fs + 2;
  doc.fontSize(fs + 1).font('Helvetica-Bold').text(shipment.consignee || 'N/A', m, y); y += fs + 4;
  doc.fontSize(fs).font('Helvetica').text(shipment.destination || 'N/A', m, y); y += fs + 2;
  if (shipment.pincode) { doc.text(`PIN: ${shipment.pincode}`, m, y); y += fs + 2; }
  if (shipment.phone) { doc.text(`Ph: ${shipment.phone}`, m, y); y += fs + 2; }
  y += 4; doc.moveTo(m, y).lineTo(dims.width - m, y).stroke(); y += 8;

  // Shipment details grid
  const colW = (dims.width - 2 * m) / 3;
  const detailRow = (label, val, col) => {
    const x = m + col * colW;
    doc.fontSize(fs - 2).font('Helvetica-Bold').text(label, x, y);
    doc.fontSize(fs).font('Helvetica').text(String(val || 'N/A'), x, y + fs);
  };
  detailRow('COURIER', shipment.courier, 0);
  detailRow('WEIGHT', `${Number(shipment.weight || 0).toFixed(2)} kg`, 1);
  detailRow('SERVICE', shipment.service, 2);
  y += fs * 2 + 8;

  detailRow('DATE', shipment.date, 0);
  detailRow('MODE', shipment.codAmount > 0 ? 'COD' : 'PREPAID', 1);
  if (shipment.codAmount > 0) detailRow('COD AMT', `₹${Number(shipment.codAmount).toFixed(2)}`, 2);
  y += fs * 2 + 8;
  doc.moveTo(m, y).lineTo(dims.width - m, y).stroke(); y += 6;

  // Footer
  doc.fontSize(fs - 2).font('Helvetica').text(`Client: ${shipment.clientCode} | Dept: ${shipment.department || '-'}`, m, y, { width: dims.width - 2 * m, align: 'center' });

  doc.end();
  const pdfBuffer = await new Promise((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));

  // Update shipment with label metadata
  await prisma.shipment.update({
    where: { id: shipment.id },
    data: { labelFormat: format, labelGeneratedAt: new Date() },
  });

  logger.info(`Label generated for AWB ${shipment.awb} (${format})`);
  return { buffer: pdfBuffer, filename: `Label_${shipment.awb}_${format}.pdf`, awb: shipment.awb };
}

async function generateBulkLabels(shipmentIds, format = '4x6') {
  const results = [];
  for (const id of shipmentIds) {
    try {
      const label = await generateLabel(id, format);
      results.push({ id, awb: label.awb, success: true });
    } catch (err) {
      results.push({ id, success: false, error: err.message });
    }
  }
  return results;
}

module.exports = { generateLabel, generateBulkLabels, LABEL_FORMATS };
