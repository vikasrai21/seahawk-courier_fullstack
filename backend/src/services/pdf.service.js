/* ============================================================
   pdf.service.js — Feature #6: Label & Invoice PDF Generation
   
   Uses PDFKit (pure Node.js, no headless browser needed).
   Generates:
   - Shipping label (A6 format with barcode-style AWB)
   - Invoice PDF (A4)
   ============================================================ */

"use strict";
const fs = require("fs");
const path = require("path");

const COMPANY = {
  name: "Sea Hawk Courier & Cargo",
  address: "Shop 6 & 7, Rao Lal Singh Market, Sector-18",
  city: "Gurugram – 122015, Haryana",
  phone: "+91 99115 65523 / +91 83682 01122",
  gstin: "06AJDPR0914N2Z1",
  hsnCode: "996812",
  email: "info@seahawkcourier.in",
  website: "seahawkcourier.in",
};

const BRAND = {
  navy: "#0b1f3a",
  navySoft: "#163558",
  orange: "#e8580a",
  orangeSoft: "#fff2e8",
  slate900: "#0f172a",
  slate700: "#334155",
  slate600: "#475569",
  slate500: "#64748b",
  slate300: "#cbd5e1",
  slate200: "#e2e8f0",
  slate100: "#f1f5f9",
  white: "#ffffff",
};

const BANK_DETAILS = {
  name: "ICICI BANK LTD",
  account: "1658056174",
  ifsc: "ICIC0000615",
  branch: "SECTOR 18, GURGAON",
};

const FOOTER_CTA =
  "Get Daily Stock Updates, You Can Download SeaHawk App From Play Store or App Store.";

const LOGO_PATH = path.join(__dirname, "../../public/images/logo.png");

function fmtMoney(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("en-IN");
  } catch {
    return String(value);
  }
}

function getTaxBreakdown(invoice, client) {
  const gstAmount = Number(invoice?.gstAmount || 0);
  const gstPercent = Number(invoice?.gstPercent || 18);
  const companyStateCode = String(COMPANY.gstin || "").slice(0, 2);
  const clientStateCode = String(client?.gst || "").slice(0, 2);
  const intraState = clientStateCode
    ? clientStateCode === companyStateCode
    : /haryana/i.test(String(client?.address || ""));

  if (intraState) {
    return {
      label: "CGST + SGST",
      placeOfSupply: "Haryana",
      components: [
        {
          label: `CGST @ ${(gstPercent / 2).toFixed(1)}%`,
          amount: gstAmount / 2,
        },
        {
          label: `SGST @ ${(gstPercent / 2).toFixed(1)}%`,
          amount: gstAmount / 2,
        },
      ],
    };
  }

  return {
    label: "IGST",
    placeOfSupply: client?.address || "Inter-state supply",
    components: [{ label: `IGST @ ${gstPercent}%`, amount: gstAmount }],
  };
}

/* ── Lazy load PDFKit ── */
async function getPDF() {
  try {
    return require("pdfkit");
  } catch {
    throw new Error("pdfkit not installed. Run: npm install pdfkit --save");
  }
}

function drawLogo(doc, x, y, width = 54, height = 54) {
  if (!fs.existsSync(LOGO_PATH)) return false;
  try {
    doc.image(LOGO_PATH, x, y, {
      fit: [width, height],
      align: "center",
      valign: "center",
    });
    return true;
  } catch {
    return false;
  }
}

function drawRoundedCard(
  doc,
  x,
  y,
  w,
  h,
  radius = 14,
  fill = BRAND.white,
  stroke = BRAND.slate200,
) {
  doc.save();
  doc.roundedRect(x, y, w, h, radius).fillAndStroke(fill, stroke);
  doc.restore();
}

/* ════════════════════════════════════════════════════════════
   SHIPPING LABEL — A6 (105mm × 148mm)
   ════════════════════════════════════════════════════════════ */
async function generateShippingLabel(shipment) {
  const PDFDocument = await getPDF();

  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ size: "A6", margin: 12, bufferPages: true });

    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width; // ~298pt
    const H = doc.page.height; // ~420pt

    // ── Top header band ──
    doc.rect(0, 0, W, 40).fill("#0b1f3a");
    doc
      .fontSize(11)
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .text("SEA HAWK COURIER & CARGO", 12, 10, {
        width: W - 24,
        align: "center",
      });
    doc
      .fontSize(7)
      .fillColor("rgba(255,255,255,0.7)")
      .text(COMPANY.phone, 12, 24, { width: W - 24, align: "center" });

    // ── AWB box ──
    doc
      .rect(8, 48, W - 16, 42)
      .stroke("#0b1f3a")
      .lineWidth(2);
    doc
      .fontSize(7)
      .fillColor("#666")
      .font("Helvetica")
      .text("AWB / Tracking Number", 14, 52);
    doc
      .fontSize(16)
      .fillColor("#0b1f3a")
      .font("Helvetica-Bold")
      .text(shipment.awb || "", 14, 63, { width: W - 28, align: "center" });

    // ── Barcode simulation (text-based) ──
    const barcodeY = 96;
    doc.rect(8, barcodeY, W - 16, 20).fill("#f0f0f0");
    doc
      .fontSize(5.5)
      .fillColor("#333")
      .font("Courier")
      .text(
        `||| ${(shipment.awb || "").split("").join(" |")} |||`,
        14,
        barcodeY + 4,
        { width: W - 28, align: "center" },
      );

    // ── Addresses ──
    const lblY = 125;
    doc
      .moveTo(8, lblY - 4)
      .lineTo(W - 8, lblY - 4)
      .stroke("#ddd")
      .lineWidth(0.5);

    // FROM
    doc
      .fontSize(7)
      .fillColor("#888")
      .font("Helvetica-Bold")
      .text("FROM", 10, lblY);
    doc
      .fontSize(8)
      .fillColor("#000")
      .font("Helvetica-Bold")
      .text(COMPANY.name, 10, lblY + 10);
    doc
      .fontSize(7)
      .fillColor("#333")
      .font("Helvetica")
      .text(COMPANY.address + ", " + COMPANY.city, 10, lblY + 21, {
        width: W / 2 - 14,
      });

    // TO
    doc
      .fontSize(7)
      .fillColor("#888")
      .font("Helvetica-Bold")
      .text("TO", W / 2 + 4, lblY);
    doc
      .fontSize(8)
      .fillColor("#000")
      .font("Helvetica-Bold")
      .text(shipment.consignee || "Consignee", W / 2 + 4, lblY + 10, {
        width: W / 2 - 14,
      });
    doc
      .fontSize(7.5)
      .fillColor("#0b1f3a")
      .font("Helvetica-Bold")
      .text(shipment.destination || "", W / 2 + 4, lblY + 21, {
        width: W / 2 - 14,
      });
    if (shipment.pincode) {
      doc
        .fontSize(9)
        .fillColor("#0b1f3a")
        .font("Helvetica-Bold")
        .text(`PIN: ${shipment.pincode}`, W / 2 + 4, lblY + 32, {
          width: W / 2 - 14,
        });
    }
    if (shipment.phone) {
      doc
        .fontSize(7)
        .fillColor("#333")
        .font("Helvetica")
        .text(`Ph: ${shipment.phone}`, W / 2 + 4, lblY + 43, {
          width: W / 2 - 14,
        });
    }

    // Vertical divider
    doc
      .moveTo(W / 2, lblY)
      .lineTo(W / 2, lblY + 56)
      .stroke("#ddd");

    // ── Shipment details ──
    const dtlY = 193;
    doc
      .moveTo(8, dtlY - 4)
      .lineTo(W - 8, dtlY - 4)
      .stroke("#ddd");

    const details = [
      ["Date", shipment.date],
      ["Courier", shipment.courier || "—"],
      ["Service", shipment.service],
      [
        "Weight",
        shipment.weight ? `${(shipment.weight / 1000).toFixed(3)} kg` : "—",
      ],
      ["Pieces", "1"],
      ["Status", shipment.status],
    ];

    let cx = 10,
      cy = dtlY;
    details.forEach(([lbl, val], i) => {
      const col = i < 3 ? 0 : 1;
      cx = col === 0 ? 10 : W / 2 + 4;
      cy = dtlY + (i % 3) * 20;
      doc
        .fontSize(6)
        .fillColor("#888")
        .font("Helvetica")
        .text(lbl.toUpperCase(), cx, cy);
      doc
        .fontSize(8)
        .fillColor("#000")
        .font("Helvetica-Bold")
        .text(val || "—", cx, cy + 8, { width: W / 2 - 14 });
    });

    // ── Footer ──
    doc
      .moveTo(8, H - 30)
      .lineTo(W - 8, H - 30)
      .stroke("#ddd");
    doc
      .fontSize(5.5)
      .fillColor("#999")
      .font("Helvetica")
      .text(
        `GSTIN: ${COMPANY.gstin} | ${COMPANY.website} | Printed: ${new Date().toLocaleDateString("en-IN")}`,
        8,
        H - 22,
        { width: W - 16, align: "center" },
      );

    // ── CLIENT CODE watermark ──
    if (shipment.clientCode) {
      doc
        .fontSize(8)
        .fillColor("#eee")
        .font("Helvetica-Bold")
        .text(shipment.clientCode, W - 48, 52, { width: 40, align: "right" });
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
  const subtotal = Number(invoice.subtotal || 0);
  const gstAmount = Number(
    invoice.gstAmount ||
      tax.components.reduce((sum, c) => sum + (c.amount || 0), 0),
  );
  const total = Number(invoice.total || subtotal + gstAmount);

  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ size: "A4", margin: 42, bufferPages: true });
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageM = 42;
    const W = doc.page.width;
    const H = doc.page.height;
    const contentW = W - pageM * 2;
    const delivered = items.filter((item) => item.shipment?.status === "Delivered").length;
    const rto = items.filter((item) => ["RTO", "RTODelivered"].includes(item.shipment?.status)).length;
    const baseCharges = items.reduce((sum, item) => sum + Number(item.baseAmount || item.amount || 0), 0);
    const fuelCharges = items.reduce((sum, item) => sum + Number(item.fuelSurcharge || 0), 0);

    const title = (text, y, sub = "") => {
      doc.font("Helvetica-Bold").fontSize(22).fillColor(BRAND.slate900).text(text, pageM, y);
      if (sub) doc.font("Helvetica").fontSize(9).fillColor(BRAND.slate500).text(sub, pageM, y + 28);
    };
    const header = (label) => {
      doc.rect(0, 0, W, 72).fill(BRAND.navy);
      drawLogo(doc, pageM, 15, 42, 42);
      doc.font("Helvetica-Bold").fontSize(14).fillColor(BRAND.white).text(COMPANY.name, pageM + 52, 18);
      doc.font("Helvetica").fontSize(8).fillColor("#cbd5e1").text(`${COMPANY.gstin} | ${COMPANY.phone} | ${COMPANY.email}`, pageM + 52, 38);
      doc.font("Helvetica-Bold").fontSize(10).fillColor(BRAND.white).text(label, pageM, 54, { width: contentW, align: "right" });
    };
    const keyValue = (label, value, x, y, width = 160) => {
      doc.font("Helvetica-Bold").fontSize(8).fillColor(BRAND.slate500).text(label, x, y);
      doc.font("Helvetica-Bold").fontSize(12).fillColor(BRAND.slate900).text(value || "-", x, y + 12, { width });
    };
    const metric = (label, value, x, y, w, color = BRAND.slate900) => {
      drawRoundedCard(doc, x, y, w, 68, 10, BRAND.white, BRAND.slate200);
      doc.font("Helvetica-Bold").fontSize(8).fillColor(BRAND.slate500).text(label, x + 12, y + 12, { width: w - 24 });
      doc.font("Helvetica-Bold").fontSize(20).fillColor(color).text(value, x + 12, y + 30, { width: w - 24 });
    };
    const moneyRow = (label, value, y, strong = false) => {
      doc.font(strong ? "Helvetica-Bold" : "Helvetica").fontSize(strong ? 12 : 10).fillColor(strong ? BRAND.slate900 : BRAND.slate700).text(label, pageM + 260, y, { width: 150 });
      doc.font("Helvetica-Bold").fontSize(strong ? 12 : 10).fillColor(strong ? BRAND.orange : BRAND.slate900).text(fmtMoney(value), pageM + 410, y, { width: 92, align: "right" });
    };

    // Page 1: Summary
    header("PAGE 1 / SUMMARY");
    title("Tax Invoice Summary", 104, `Invoice ${invoice.invoiceNo || "DRAFT"} | ${invoice.fromDate || "-"} to ${invoice.toDate || "-"}`);
    keyValue("BILL TO", client?.company || invoice.clientCode, pageM, 156, 240);
    keyValue("CLIENT GSTIN", client?.gst || "Unregistered", pageM, 198, 240);
    keyValue("ADDRESS", client?.address || "-", pageM, 240, 260);
    keyValue("INVOICE DATE", fmtDate(invoice.createdAt || new Date()), pageM + 330, 156);
    keyValue("PLACE OF SUPPLY", tax.placeOfSupply || "-", pageM + 330, 198);
    keyValue("TAX STRUCTURE", tax.label, pageM + 330, 240);

    const metricY = 320;
    metric("TOTAL SHIPMENTS", String(items.length), pageM, metricY, 116, BRAND.navy);
    metric("DELIVERED", String(delivered), pageM + 130, metricY, 116, "#059669");
    metric("RTO", String(rto), pageM + 260, metricY, 116, "#e11d48");
    metric("TOTAL AMOUNT", fmtMoney(total), pageM + 390, metricY, 120, BRAND.orange);

    drawRoundedCard(doc, pageM, 430, contentW, 112, 12, "#f8fafc", BRAND.slate200);
    doc.font("Helvetica-Bold").fontSize(11).fillColor(BRAND.slate900).text("Amount in words", pageM + 16, 448);
    doc.font("Helvetica").fontSize(10).fillColor(BRAND.slate700).text(amountInWords(total), pageM + 16, 470, { width: contentW - 32, lineGap: 3 });
    doc.font("Helvetica").fontSize(9).fillColor(BRAND.slate500).text(invoice.notes || "Payment due as per agreed credit terms.", pageM + 16, 510, { width: contentW - 32 });

    // Page 2: Billing breakdown
    doc.addPage();
    header("PAGE 2 / BILLING BREAKDOWN");
    title("Billing Breakdown", 104, "Charges are right-aligned and split into freight, surcharge and GST components.");
    drawRoundedCard(doc, pageM + 240, 166, 270, 188, 12, BRAND.white, BRAND.slate200);
    moneyRow("Base charges", baseCharges, 190);
    moneyRow("Fuel surcharge", fuelCharges, 218);
    moneyRow("Taxable subtotal", subtotal, 246);
    tax.components.forEach((component, index) => moneyRow(component.label, component.amount, 274 + index * 28));
    doc.moveTo(pageM + 260, 322).lineTo(pageM + 502, 322).strokeColor(BRAND.slate200).stroke();
    moneyRow("Invoice total", total, 336, true);

    drawRoundedCard(doc, pageM, 166, 206, 188, 12, "#f8fafc", BRAND.slate200);
    doc.font("Helvetica-Bold").fontSize(11).fillColor(BRAND.slate900).text("Billing metadata", pageM + 14, 186);
    [
      ["HSN/SAC", COMPANY.hsnCode],
      ["Company GSTIN", COMPANY.gstin],
      ["Client", client?.company || invoice.clientCode],
      ["Status", invoice.status || "DRAFT"],
    ].forEach(([label, value], index) => keyValue(label, value, pageM + 14, 214 + index * 32, 176));

    // Page 3+: Shipment table
    doc.addPage();
    header("PAGE 3+ / SHIPMENT LEDGER");
    title("Shipment Ledger", 104, "AWB-level billing details.");
    const cols = [
      { label: "#", x: pageM, w: 28, align: "center" },
      { label: "AWB", x: pageM + 32, w: 92 },
      { label: "Destination", x: pageM + 128, w: 118 },
      { label: "Weight", x: pageM + 250, w: 58, align: "right" },
      { label: "Status", x: pageM + 314, w: 76 },
      { label: "Amount", x: pageM + 400, w: 110, align: "right" },
    ];
    const drawLedgerHead = (y) => {
      doc.rect(pageM, y, contentW, 26).fill(BRAND.navy);
      cols.forEach((col) => doc.font("Helvetica-Bold").fontSize(7.5).fillColor(BRAND.white).text(col.label, col.x + 4, y + 9, { width: col.w - 8, align: col.align || "left" }));
      return y + 32;
    };
    let y = drawLedgerHead(158);
    items.forEach((item, index) => {
      if (y > H - 76) {
        doc.addPage();
        header("PAGE 3+ / SHIPMENT LEDGER");
        y = drawLedgerHead(104);
      }
      doc.rect(pageM, y - 5, contentW, 30).fill(index % 2 ? "#ffffff" : "#f8fafc");
      const row = [
        String(index + 1),
        item.awb || "-",
        item.destination || "-",
        `${Number(item.weight || 0).toFixed(2)}`,
        item.shipment?.status || "-",
        fmtMoney(item.amount || 0),
      ];
      cols.forEach((col, colIndex) => doc.font(colIndex === 1 || colIndex === 5 ? "Helvetica-Bold" : "Helvetica").fontSize(8.5).fillColor(BRAND.slate900).text(row[colIndex], col.x + 4, y + 4, { width: col.w - 8, align: col.align || "left" }));
      y += 30;
    });

    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.font("Helvetica").fontSize(8).fillColor(BRAND.slate500).text(`Generated ${new Date().toLocaleString("en-IN")} | Page ${i + 1} of ${range.count}`, pageM, H - 28, { width: contentW, align: "center" });
    }

    doc.end();
  });

  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });

    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width;
    const H = doc.page.height;
    const pageM = 42;
    const contentW = W - pageM * 2;

    const headerY = pageM - 8;
    const headerLeftWidth = contentW * 0.52;
    const rightColWidth = contentW - headerLeftWidth;
    const headerRightX = pageM + headerLeftWidth;

    drawRoundedCard(
      doc,
      pageM,
      headerY + 8,
      64,
      64,
      12,
      BRAND.white,
      BRAND.slate200,
    );
    drawLogo(doc, pageM + 6, headerY + 14, 52, 52);

    doc
      .fontSize(18)
      .fillColor(BRAND.slate900)
      .font("Helvetica-Bold")
      .text(COMPANY.name, pageM + 72, headerY + 14, {
        width: headerLeftWidth - 72,
      });
    doc
      .fontSize(10)
      .fillColor(BRAND.slate700)
      .font("Helvetica")
      .text(`${COMPANY.address}`, pageM + 72, headerY + 40, {
        width: headerLeftWidth - 72,
        lineGap: 2,
      })
      .text(`${COMPANY.phone} | ${COMPANY.email}`, pageM + 72, headerY + 60, {
        width: headerLeftWidth - 72,
      })
      .text(
        `GSTIN: ${COMPANY.gstin} | HSN/SAC: ${COMPANY.hsnCode}`,
        pageM + 72,
        headerY + 74,
        { width: headerLeftWidth - 72 },
      );

    doc
      .fontSize(32)
      .fillColor(BRAND.slate900)
      .font("Helvetica-Bold")
      .text("TAX INVOICE", headerRightX, headerY + 12, {
        width: rightColWidth - 4,
        align: "right",
      });
    doc
      .fontSize(10)
      .fillColor(BRAND.slate600)
      .font("Helvetica")
      .text(
        `Invoice No: ${invoice.invoiceNo || "DRAFT"}`,
        headerRightX,
        headerY + 60,
        { width: rightColWidth - 4, align: "right" },
      )
      .text(
        `Date: ${fmtDate(invoice.createdAt || new Date())}`,
        headerRightX,
        headerY + 74,
        { width: rightColWidth - 4, align: "right" },
      );

    doc
      .moveTo(pageM, headerY + 96)
      .lineTo(W - pageM, headerY + 96)
      .strokeColor(BRAND.slate300)
      .lineWidth(1)
      .stroke();

    const billingY = headerY + 110;
    const blockWidth = contentW / 2 - 12;
    doc
      .fontSize(9)
      .fillColor(BRAND.slate500)
      .font("Helvetica-Bold")
      .text("BILLING ADDRESS", pageM, billingY);
    doc
      .fontSize(15)
      .fillColor(BRAND.slate900)
      .font("Helvetica-Bold")
      .text(
        client?.company || invoice.clientCode || "Client",
        pageM,
        billingY + 18,
        { width: blockWidth },
      );
    doc
      .fontSize(9)
      .fillColor(BRAND.slate700)
      .font("Helvetica")
      .text(
        [
          client?.address,
          client?.phone ? `Phone: ${client.phone}` : null,
          client?.gst ? `GSTIN: ${client.gst}` : "GSTIN: Unregistered",
        ]
          .filter(Boolean)
          .join("\n"),
        pageM,
        billingY + 38,
        { width: blockWidth, lineGap: 2 },
      );

    const metaX = pageM + blockWidth + 24;
    const metaRows = [
      [
        "SERVICE PERIOD",
        `${invoice.fromDate || "—"} to ${invoice.toDate || "—"}`,
      ],
      ["PLACE OF SUPPLY", tax.placeOfSupply || "Inter-state supply"],
      ["TAX STRUCTURE", tax.label],
      ["COMPANY GSTIN", COMPANY.gstin],
    ];
    metaRows.forEach(([label, value], idx) => {
      const y = billingY + idx * 18;
      doc
        .fontSize(8)
        .fillColor(BRAND.slate500)
        .font("Helvetica-Bold")
        .text(label, metaX, y, { width: blockWidth + 4, align: "left" });
      doc
        .fontSize(10)
        .fillColor(BRAND.slate900)
        .font("Helvetica-Bold")
        .text(value, metaX, y + 10, { width: blockWidth + 4, align: "left" });
    });

    doc
      .moveTo(pageM, billingY + 90)
      .lineTo(W - pageM, billingY + 90)
      .strokeColor(BRAND.slate200)
      .lineWidth(1)
      .stroke();

    const tableX = pageM;
    const tableW = contentW;
    const tableHeaderHeight = 32;
    const rowHeight = 34;
    const bottomReserve = 180;
    const columns = [
      { id: "#", width: 24, align: "center" },
      { id: "ITEMS & DESCRIPTION", width: 160 },
      { id: "HSN/SAC", width: 60, align: "center" },
      { id: "QTY", width: 40, align: "right" },
      { id: "RATE", width: 62, align: "right" },
      { id: "IGST %", width: 50, align: "right" },
      { id: "IGST AMT", width: 62, align: "right" },
      { id: "AMOUNT", width: 58, align: "right" },
    ];
    const columnPositions = [];
    let acc = tableX;
    columns.forEach((column) => {
      columnPositions.push({ ...column, x: acc + 4 });
      acc += column.width;
    });

    function drawTableHeader(y) {
      doc
        .rect(tableX, y, tableW, tableHeaderHeight)
        .fill(BRAND.navy)
        .strokeColor("transparent");
      columnPositions.forEach((col) => {
        doc
          .fontSize(8)
          .fillColor(BRAND.white)
          .font("Helvetica-Bold")
          .text(col.id, col.x, y + 10, {
            width: col.width,
            align: col.align || "left",
          });
      });
    }

    function startTable(y) {
      drawTableHeader(y);
      return y + tableHeaderHeight + 6;
    }

    function ensureRowFits(currentY) {
      if (currentY + rowHeight > H - bottomReserve) {
        doc.addPage();
        const newY = startTable(pageM + 30);
        return newY;
      }
      return currentY;
    }

    let rowY = startTable(billingY + 110);
    items.forEach((item, index) => {
      rowY = ensureRowFits(rowY);
      const bgColor = index % 2 === 0 ? BRAND.white : "#f9fafb";
      doc.rect(tableX, rowY - 6, tableW, rowHeight).fill(bgColor);

      const descLines = [
        item.consignee,
        item.destination ? `Destination: ${item.destination}` : null,
        item.awb ? `AWB: ${item.awb}` : null,
        item.courier ? item.courier : null,
      ]
        .filter(Boolean)
        .join("\n");
      const taxableAmount = Number(item.baseAmount || item.amount || 0);
      const qty = Number(item.quantity || 1);
      const proportion = subtotal ? taxableAmount / subtotal : 0;
      const igstAmount = Number((gstAmount * proportion).toFixed(2));
      const igstPercent = Number(invoice.gstPercent || 0);
      const lineAmount = Number(item.amount || taxableAmount + igstAmount);

      doc
        .fontSize(9)
        .fillColor(BRAND.slate900)
        .font("Helvetica-Bold")
        .text(String(index + 1), columnPositions[0].x, rowY - 2, {
          width: columnPositions[0].width,
          align: "center",
        });
      doc
        .font("Helvetica")
        .fillColor(BRAND.slate900)
        .text(descLines || "Shipment charges", columnPositions[1].x, rowY - 6, {
          width: columnPositions[1].width,
          lineGap: 2,
        });
      doc
        .font("Helvetica")
        .fillColor(BRAND.slate700)
        .text(COMPANY.hsnCode, columnPositions[2].x, rowY, {
          width: columnPositions[2].width,
          align: "center",
        })
        .text(qty.toFixed(0), columnPositions[3].x, rowY, {
          width: columnPositions[3].width,
          align: "right",
        })
        .text(fmtMoney(taxableAmount), columnPositions[4].x, rowY, {
          width: columnPositions[4].width,
          align: "right",
        })
        .text(`${igstPercent.toFixed(0)}%`, columnPositions[5].x, rowY, {
          width: columnPositions[5].width,
          align: "right",
        })
        .text(fmtMoney(igstAmount), columnPositions[6].x, rowY, {
          width: columnPositions[6].width,
          align: "right",
        });
      doc
        .font("Helvetica-Bold")
        .fillColor(BRAND.slate900)
        .text(fmtMoney(lineAmount), columnPositions[7].x, rowY, {
          width: columnPositions[7].width,
          align: "right",
        });

      rowY += rowHeight;
      doc
        .moveTo(tableX, rowY - 4)
        .lineTo(tableX + tableW, rowY - 4)
        .strokeColor("#e2e8f0")
        .lineWidth(0.5)
        .stroke();
      doc.fillColor(BRAND.slate900);
    });

    const totalQuantity = items.reduce(
      (sum, item) => sum + Number(item.quantity || 1),
      0,
    );
    const rounding = Number((total - subtotal - gstAmount).toFixed(2));

    let summaryY = rowY + 30;
    if (summaryY + 160 > H - bottomReserve) {
      doc.addPage();
      summaryY = pageM;
    }

    const summaryWidth = contentW;
    const summaryHeight = 120;
    doc
      .rect(pageM, summaryY, summaryWidth, summaryHeight)
      .strokeColor(BRAND.slate300)
      .lineWidth(1)
      .stroke();

    const summaryLeftX = pageM + 14;
    const summaryRightX = pageM + summaryWidth - 180;

    doc
      .fontSize(8)
      .fillColor(BRAND.slate500)
      .font("Helvetica-Bold")
      .text("TOTAL QUANTITY", summaryLeftX, summaryY + 12);
    doc
      .fontSize(16)
      .fillColor(BRAND.slate900)
      .font("Helvetica-Bold")
      .text(totalQuantity, summaryLeftX, summaryY + 26);
    doc
      .fontSize(8)
      .fillColor(BRAND.slate500)
      .font("Helvetica-Bold")
      .text("TOTAL TAXABLE AMOUNT", summaryRightX, summaryY + 12, {
        align: "right",
      });
    doc
      .fontSize(12)
      .fillColor(BRAND.slate900)
      .font("Helvetica-Bold")
      .text(fmtMoney(subtotal), summaryRightX, summaryY + 24, {
        align: "right",
      });

    doc
      .fontSize(8)
      .fillColor(BRAND.slate500)
      .font("Helvetica-Bold")
      .text("IGST", summaryRightX, summaryY + 44, { align: "right" });
    doc
      .fontSize(12)
      .fillColor(BRAND.slate900)
      .font("Helvetica-Bold")
      .text(fmtMoney(gstAmount), summaryRightX, summaryY + 54, {
        align: "right",
      });

    doc
      .fontSize(8)
      .fillColor(BRAND.slate500)
      .font("Helvetica-Bold")
      .text("ROUNDING", summaryRightX, summaryY + 74, { align: "right" });
    doc
      .fontSize(12)
      .fillColor(BRAND.slate900)
      .font("Helvetica-Bold")
      .text(fmtMoney(rounding), summaryRightX, summaryY + 84, {
        align: "right",
      });

    doc
      .fontSize(10)
      .fillColor(BRAND.slate500)
      .font("Helvetica")
      .text("Amount in words:", summaryLeftX, summaryY + 60);
    doc
      .fontSize(10)
      .fillColor(BRAND.slate900)
      .font("Helvetica-Bold")
      .text(amountInWords(total), summaryLeftX, summaryY + 72, {
        width: summaryRightX - summaryLeftX - 4,
      });

    doc
      .fontSize(14)
      .fillColor(BRAND.orange)
      .font("Helvetica-Bold")
      .text("BALANCE DUE", summaryRightX, summaryY + 100, { align: "right" });
    doc
      .fontSize(20)
      .fillColor(BRAND.slate900)
      .font("Helvetica-Bold")
      .text(fmtMoney(total), summaryRightX, summaryY + 116, { align: "right" });

    let paymentY = summaryY + summaryHeight + 18;
    if (paymentY + 140 > H - 32) {
      doc.addPage();
      paymentY = pageM;
    }

    const paymentHeight = 130;
    doc
      .rect(pageM, paymentY, contentW, paymentHeight)
      .strokeColor(BRAND.slate300)
      .lineWidth(1)
      .stroke();
    doc
      .fontSize(10)
      .fillColor(BRAND.slate900)
      .font("Helvetica-Bold")
      .text("MAKE PAYMENT BY CLICKING HERE", pageM + 14, paymentY + 12);
    doc
      .fontSize(9)
      .fillColor(BRAND.slate500)
      .font("Helvetica")
      .text("Company Bank Details", pageM + 14, paymentY + 30);
    doc
      .fontSize(9)
      .fillColor(BRAND.slate700)
      .font("Helvetica")
      .text(`Bank: ${BANK_DETAILS.name}`, pageM + 14, paymentY + 44)
      .text(`Account: ${BANK_DETAILS.account}`, pageM + 14, paymentY + 56)
      .text(`IFSC: ${BANK_DETAILS.ifsc}`, pageM + 14, paymentY + 68)
      .text(`Branch: ${BANK_DETAILS.branch}`, pageM + 14, paymentY + 80);
    if (invoice.notes) {
      doc
        .fontSize(8)
        .fillColor(BRAND.slate600)
        .font("Helvetica")
        .text(invoice.notes, pageM + 14, paymentY + 100, {
          width: contentW / 2,
          lineGap: 2,
        });
    }

    const qrSize = 88;
    const qrX = W - pageM - qrSize - 12;
    doc
      .rect(qrX, paymentY + 18, qrSize, qrSize)
      .strokeColor(BRAND.slate300)
      .lineWidth(1)
      .stroke();
    doc
      .fontSize(8)
      .fillColor(BRAND.slate700)
      .font("Helvetica-Bold")
      .text("SCAN THIS QR CODE TO MAKE PAYMENT", qrX, paymentY + qrSize + 24, {
        width: qrSize,
        align: "center",
      });

    doc
      .fontSize(9)
      .fillColor(BRAND.slate500)
      .font("Helvetica")
      .text(FOOTER_CTA, pageM, H - 28, { width: contentW, align: "center" });

    doc.end();
  });
}

function amountInWords(amount) {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  const parts = [];
  if (rupees > 0) parts.push(`${numberToWords(rupees)} Rupees`);
  if (paise > 0) parts.push(`${numberToWords(paise)} Paise`);
  if (!parts.length) parts.push("Zero Rupees");
  return `${parts.join(" and ")} Only`;
}

function numberToWords(value) {
  if (!value) return "Zero";
  const units = [
    "Zero",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const scales = [
    { value: 10000000, label: "Crore" },
    { value: 100000, label: "Lakh" },
    { value: 1000, label: "Thousand" },
    { value: 100, label: "Hundred" },
  ];

  const parts = [];
  let remainder = value;

  scales.forEach(({ value: scaleValue, label }) => {
    if (remainder >= scaleValue) {
      const count = Math.floor(remainder / scaleValue);
      remainder %= scaleValue;
      parts.push(`${formatSegment(count, units, tens)} ${label}`);
    }
  });

  if (remainder > 0) {
    parts.push(formatSegment(remainder, units, tens));
  }

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function formatSegment(num, units, tens) {
  if (num === 0) return "";
  if (num < 20) return units[num];
  if (num < 100) {
    const tenPart = Math.floor(num / 10);
    const unitPart = num % 10;
    return unitPart ? `${tens[tenPart]} ${units[unitPart]}` : tens[tenPart];
  }
  const hundredPart = Math.floor(num / 100);
  const remainder = num % 100;
  const hundredText = `${units[hundredPart]} Hundred`;
  if (remainder === 0) return hundredText;
  return `${hundredText} ${formatSegment(remainder, units, tens)}`;
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
    const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });

    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width;
    const pageM = 40;

    doc.rect(0, 0, W, 72).fill("#0b1f3a");
    doc
      .fontSize(18)
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .text(COMPANY.name, pageM, 18, { width: W - pageM * 2, align: "left" });
    doc
      .fontSize(8)
      .fillColor("rgba(255,255,255,0.65)")
      .font("Helvetica")
      .text(
        `${COMPANY.address}, ${COMPANY.city}  |  ${COMPANY.phone}  |  GSTIN: ${COMPANY.gstin}`,
        pageM,
        40,
        { width: W - pageM * 2 },
      );

    doc.rect(0, 72, W, 36).fill("#e8580a");
    doc
      .fontSize(14)
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .text(
        `WALLET TOP-UP RECEIPT — ${txn.receiptNo || txn.reference || txn.paymentId || txn.id}`,
        pageM,
        84,
        { width: W - pageM * 2 },
      );

    const cY = 130;
    doc
      .fontSize(8)
      .fillColor("#888")
      .font("Helvetica")
      .text("RECEIVED FROM", pageM, cY);
    doc
      .fontSize(11)
      .fillColor("#0b1f3a")
      .font("Helvetica-Bold")
      .text(client?.company || txn.clientCode, pageM, cY + 14);
    doc
      .fontSize(8.5)
      .fillColor("#333")
      .font("Helvetica")
      .text(
        [
          client?.address,
          client?.gst ? `GSTIN: ${client.gst}` : "",
          client?.phone ? `Ph: ${client.phone}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
        pageM,
        cY + 28,
      );

    doc
      .fontSize(8)
      .fillColor("#888")
      .text("RECEIPT DATE", W - 200, cY);
    doc
      .fontSize(11)
      .fillColor("#0b1f3a")
      .font("Helvetica-Bold")
      .text(fmtDate(txn.createdAt || new Date()), W - 200, cY + 14);
    doc
      .fontSize(8)
      .fillColor("#888")
      .text("PAYMENT MODE", W - 200, cY + 34);
    doc
      .fontSize(10)
      .fillColor("#0b1f3a")
      .font("Helvetica-Bold")
      .text(txn.paymentMode || "ONLINE", W - 200, cY + 47);
    doc
      .fontSize(8)
      .fillColor("#888")
      .text("HSN / SAC", W - 200, cY + 67);
    doc
      .fontSize(10)
      .fillColor("#0b1f3a")
      .font("Helvetica-Bold")
      .text(COMPANY.hsnCode, W - 200, cY + 80);

    const tableY = 230;
    doc.rect(pageM - 4, tableY, W - pageM * 2 + 8, 22).fill("#0b1f3a");
    [
      ["Description", pageM, 240],
      ["Reference", pageM + 220, 240],
      ["Taxable Amount", pageM + 340, 240],
      ["Total", pageM + 455, 240],
    ].forEach(([label, x, y]) => {
      doc
        .fontSize(7.5)
        .fillColor("#fff")
        .font("Helvetica-Bold")
        .text(label, x, y);
    });

    doc.rect(pageM - 4, tableY + 22, W - pageM * 2 + 8, 24).fill("#f9fafb");
    doc
      .fontSize(8)
      .fillColor("#111")
      .font("Helvetica")
      .text(txn.description || "Wallet recharge receipt", pageM, tableY + 30, {
        width: 210,
      });
    doc.text(txn.paymentId || txn.reference || "-", pageM + 220, tableY + 30, {
      width: 100,
    });
    doc.text(fmtMoney(txn.taxableAmount), pageM + 340, tableY + 30, {
      width: 90,
      align: "right",
    });
    doc.text(fmtMoney(txn.amount), pageM + 455, tableY + 30, {
      width: 60,
      align: "right",
    });

    let rowY = tableY + 70;
    [
      ["Taxable amount", fmtMoney(txn.taxableAmount)],
      ["HSN / SAC", COMPANY.hsnCode],
      ...tax.components.map((item) => [item.label, fmtMoney(item.amount)]),
      ["Total received", fmtMoney(txn.amount)],
      ["Wallet balance after credit", fmtMoney(txn.balance)],
    ].forEach(([label, value]) => {
      doc
        .fontSize(9)
        .fillColor("#555")
        .font("Helvetica")
        .text(label, W - 220, rowY, { width: 120 });
      doc
        .fontSize(9)
        .fillColor("#000")
        .font("Helvetica-Bold")
        .text(value, W - 100, rowY, { width: 60, align: "right" });
      rowY += 18;
    });

    doc
      .fontSize(8)
      .fillColor("#64748b")
      .font("Helvetica")
      .text(
        `Tax type: ${tax.label} | Place of supply: ${tax.placeOfSupply}`,
        pageM,
        rowY + 16,
        { width: W - pageM * 2 },
      );

    const fY = doc.page.height - 48;
    doc
      .moveTo(pageM, fY)
      .lineTo(W - pageM, fY)
      .stroke("#eee");
    doc
      .fontSize(8)
      .fillColor("#aaa")
      .font("Helvetica")
      .text(
        `This is a computer-generated wallet receipt. GSTIN: ${COMPANY.gstin} | ${COMPANY.website}`,
        pageM,
        fY + 10,
        { width: W - pageM * 2, align: "center" },
      );

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
    const doc = new PDFDocument({
      size: "A4",
      margin: 10,
      bufferPages: true,
      autoFirstPage: false,
    });
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", resolve);
    doc.on("error", reject);

    // 4 A6 labels per A4 page (2×2 grid)
    for (let i = 0; i < shipments.length; i += 4) {
      doc.addPage();
      const batch = shipments.slice(i, i + 4);
      batch.forEach((s, j) => {
        const col = j % 2;
        const row = Math.floor(j / 2);
        const ox = 10 + col * 298;
        const oy = 10 + row * 210;
        _drawMiniLabel(doc, s, ox, oy);
      });
    }
    doc.end();
  });

  return Buffer.concat(chunks);
}

function _drawMiniLabel(doc, s, ox, oy) {
  const W = 288,
    H = 200;
  doc.rect(ox, oy, W, H).stroke("#ccc").lineWidth(0.5);
  doc.rect(ox, oy, W, 22).fill("#0b1f3a");
  doc
    .fontSize(8)
    .fillColor("#fff")
    .font("Helvetica-Bold")
    .text("SEA HAWK COURIER", ox + 4, oy + 8, {
      width: W - 8,
      align: "center",
    });
  doc
    .fontSize(10)
    .fillColor("#0b1f3a")
    .font("Courier-Bold")
    .text(s.awb || "", ox + 4, oy + 28, { width: W - 8, align: "center" });
  doc
    .fontSize(7)
    .fillColor("#555")
    .font("Helvetica")
    .text(`TO: ${s.consignee || ""}`, ox + 4, oy + 46, { width: W - 8 });
  doc
    .fontSize(8)
    .fillColor("#0b1f3a")
    .font("Helvetica-Bold")
    .text(s.destination || "", ox + 4, oy + 57, { width: W - 8 });
  if (s.pincode) {
    doc
      .fontSize(8.5)
      .fillColor("#e8580a")
      .font("Helvetica-Bold")
      .text(`PIN: ${s.pincode}`, ox + 4, oy + 69, { width: W - 8 });
  }
  doc
    .fontSize(6.5)
    .fillColor("#888")
    .font("Helvetica")
    .text(
      `${s.courier || ""} | ${s.service || ""} | ${s.weight ? (s.weight / 1000).toFixed(2) + "kg" : ""} | ${s.date || ""}`,
      ox + 4,
      oy + 83,
      { width: W - 8 },
    );
}

/* ════════════════════════════════════════════════════════════
   END-OF-DAY (EOD) MANIFEST — A4
   ════════════════════════════════════════════════════════════ */
async function generateManifestPDF(shipments, metadata = {}) {
  const PDFDocument = await getPDF();
  let QRCode;
  try {
    QRCode = require("qrcode");
  } catch (e) {
    /* ignore */
  }

  return new Promise(async (resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ size: "A4", margin: 40, bufferPages: true });

    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width;
    const H = doc.page.height;
    const pageM = 40;
    const contentW = W - pageM * 2;

    // ── Header ──
    doc.rect(0, 0, W, 72).fill("#0b1f3a");
    doc
      .fontSize(18)
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .text(COMPANY.name, pageM, 18, { width: W - pageM * 2, align: "left" });
    doc
      .fontSize(8)
      .fillColor("rgba(255,255,255,0.65)")
      .font("Helvetica")
      .text(
        `${COMPANY.address}, ${COMPANY.city}  |  ${COMPANY.phone}`,
        pageM,
        40,
        { width: W - pageM * 2 },
      );

    doc.rect(0, 72, W, 36).fill("#10b981"); // Emerald green for Ops
    doc
      .fontSize(14)
      .fillColor("#ffffff")
      .font("Helvetica-Bold")
      .text(`EOD COURIER MANIFEST`, pageM, 84, { width: W - pageM * 2 });

    // ── Meta Info ──
    const metaY = 130;
    doc
      .fontSize(9)
      .fillColor("#888")
      .font("Helvetica")
      .text("DATE", pageM, metaY);
    doc
      .fontSize(12)
      .fillColor("#000")
      .font("Helvetica-Bold")
      .text(fmtDate(metadata.date || new Date()), pageM, metaY + 14);

    doc
      .fontSize(9)
      .fillColor("#888")
      .font("Helvetica")
      .text("COURIER PARTNER", pageM + 120, metaY);
    doc
      .fontSize(12)
      .fillColor("#000")
      .font("Helvetica-Bold")
      .text(metadata.courier || "ALL COURIERS", pageM + 120, metaY + 14);

    doc
      .fontSize(9)
      .fillColor("#888")
      .font("Helvetica")
      .text("TOTAL SHIPMENTS", pageM + 300, metaY);
    doc
      .fontSize(12)
      .fillColor("#0b1f3a")
      .font("Helvetica-Bold")
      .text(String(shipments.length), pageM + 300, metaY + 14);

    // ── QR Code ──
    if (QRCode && metadata.manifestId) {
      try {
        const qrDataUrl = await QRCode.toDataURL(
          JSON.stringify({
            id: metadata.manifestId,
            type: "manifest",
            count: shipments.length,
          }),
        );
        doc.image(qrDataUrl, W - pageM - 60, metaY - 10, { width: 60 });
        doc
          .fontSize(6)
          .fillColor("#888")
          .text(metadata.manifestId, W - pageM - 60, metaY + 52, {
            width: 60,
            align: "center",
          });
      } catch (e) {
        console.error("Failed to generate QR", e);
      }
    }

    // ── Table ──
    const tableY = 200;
    const columns = [
      { id: "#", width: 20, align: "center" },
      { id: "AWB", width: 90, align: "left" },
      { id: "CONSIGNEE", width: 100, align: "left" },
      { id: "DESTINATION", width: 80, align: "left" },
      { id: "WEIGHT", width: 50, align: "right" },
      { id: "COURIER", width: 80, align: "left" },
      { id: "SIGNATURE", width: 95, align: "center" },
    ];

    let acc = pageM;
    const colPositions = columns.map((c) => {
      const pos = { ...c, x: acc };
      acc += c.width;
      return pos;
    });

    const tableHeaderHeight = 24;
    const rowHeight = 32;

    function drawHeader(y) {
      doc.rect(pageM, y, contentW, tableHeaderHeight).fill("#0b1f3a");
      colPositions.forEach((col) => {
        doc
          .fontSize(8)
          .fillColor("#fff")
          .font("Helvetica-Bold")
          .text(col.id, col.x + (col.align === "center" ? 0 : 4), y + 8, {
            width: col.width,
            align: col.align,
          });
      });
      return y + tableHeaderHeight;
    }

    let currentY = drawHeader(tableY);

    shipments.forEach((s, i) => {
      if (currentY + rowHeight > H - 60) {
        doc.addPage();
        currentY = drawHeader(pageM);
      }

      const isEven = i % 2 === 0;
      doc
        .rect(pageM, currentY, contentW, rowHeight)
        .fill(isEven ? "#ffffff" : "#f8fafc");

      doc.fontSize(8).fillColor("#333").font("Helvetica");

      // #
      doc.text(String(i + 1), colPositions[0].x, currentY + 10, {
        width: colPositions[0].width,
        align: "center",
      });
      // AWB
      doc
        .font("Helvetica-Bold")
        .text(s.awb || "-", colPositions[1].x + 4, currentY + 10, {
          width: colPositions[1].width - 8,
        });
      // Consignee
      doc
        .font("Helvetica")
        .text(
          (s.consignee || "-").substring(0, 20),
          colPositions[2].x + 4,
          currentY + 10,
          { width: colPositions[2].width - 8 },
        );
      // Destination
      doc.text(s.destination || "-", colPositions[3].x + 4, currentY + 10, {
        width: colPositions[3].width - 8,
      });
      // Weight
      const wStr = s.weight ? `${(s.weight / 1000).toFixed(2)}kg` : "-";
      doc.text(wStr, colPositions[4].x + 4, currentY + 10, {
        width: colPositions[4].width - 8,
        align: "right",
      });
      // Courier
      doc.text(s.courier || "-", colPositions[5].x + 4, currentY + 10, {
        width: colPositions[5].width - 8,
      });
      // Signature line
      doc
        .moveTo(colPositions[6].x + 10, currentY + 24)
        .lineTo(colPositions[6].x + colPositions[6].width - 10, currentY + 24)
        .stroke("#ccc");

      doc
        .moveTo(pageM, currentY + rowHeight)
        .lineTo(W - pageM, currentY + rowHeight)
        .stroke("#eee");

      currentY += rowHeight;
    });

    // ── Footer ──
    const fY = doc.page.height - 40;
    doc
      .moveTo(pageM, fY)
      .lineTo(W - pageM, fY)
      .stroke("#eee");
    doc
      .fontSize(7)
      .fillColor("#aaa")
      .font("Helvetica")
      .text(
        `Generated on ${new Date().toLocaleString("en-IN")} by SeaHawk Operations | Total Items: ${shipments.length}`,
        pageM,
        fY + 10,
        { width: contentW, align: "center" },
      );

    doc.end();
  });
}

module.exports = {
  generateShippingLabel,
  generateInvoicePDF,
  generateWalletReceiptPDF,
  generateBulkLabels,
  generateManifestPDF,
};
