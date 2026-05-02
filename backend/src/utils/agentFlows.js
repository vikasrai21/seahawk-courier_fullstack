'use strict';
/**
 * agentFlows.js — Flow Registry for HawkAI Conversational Engine
 * 
 * Each flow defines:
 *   - id:          Unique key
 *   - description: What it does (shown to user)
 *   - requiredFields: Fields the agent must collect before executing
 *   - optionalFields: Fields it can ask for but can skip
 *   - confirmBeforeExecute: If true, show summary and ask "Confirm?"
 *   - executor: The async function that executes the action
 *   - formatSummary: Builds a confirmation message from collected params
 */

const clientService    = require('../services/client.service');
const invoiceService   = require('../services/invoice.service');
const walletService    = require('../services/wallet.service');
const shipmentService  = require('../services/shipment.service');
const ndrService       = require('../services/ndr.service');
const prisma           = require('../config/prisma');
const logger           = require('./logger');

// Helper: safely convert Prisma Decimal to number
function toNum(val) {
  if (val === null || val === undefined) return 0;
  return typeof val === 'object' ? Number(val.toString()) : Number(val);
}

// ── Validators ──────────────────────────────────────────────────────────────
const validators = {
  clientCode: (v) => /^[A-Z][A-Z0-9]{1,9}$/i.test(String(v || '').trim()),
  phone:      (v) => /^\d{10,15}$/.test(String(v || '').replace(/\D/g, '')),
  email:      (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '')),
  date:       (v) => /^\d{4}-\d{2}-\d{2}$/.test(String(v || '')),
  amount:     (v) => { const n = parseFloat(v); return Number.isFinite(n) && n > 0; },
  weight:     (v) => { const n = parseFloat(v); return Number.isFinite(n) && n > 0; },
  awb:        (v) => String(v || '').trim().length >= 6,
  nonEmpty:   (v) => String(v || '').trim().length > 0,
  status:     (v) => ['Booked','InTransit','OutForDelivery','Delivered','NDR','RTO','Cancelled'].includes(String(v||'')),
  ndrAction:  (v) => ['REATTEMPT','UPDATE_ADDRESS','RTO'].includes(String(v||'').toUpperCase()),
};

// ── Flow Definitions ────────────────────────────────────────────────────────
const FLOWS = {

  // ─── 1. CREATE CLIENT ─────────────────────────────────────────────────────
  CREATE_CLIENT: {
    id: 'CREATE_CLIENT',
    description: 'Create a new client account',
    requiredFields: [
      { key: 'code',    prompt: '📝 What should the **client code** be? (3-5 uppercase letters, e.g. ABC)', validate: validators.clientCode },
      { key: 'company', prompt: '🏢 What is the **company name**?', validate: validators.nonEmpty },
      { key: 'phone',   prompt: '📞 **Phone number**?', validate: validators.phone },
    ],
    optionalFields: [
      { key: 'email',   prompt: '📧 Email address? (or type "skip")', validate: validators.email },
      { key: 'gst',     prompt: '🧾 GST number? (or type "skip")', validate: validators.nonEmpty },
      { key: 'address', prompt: '📍 Address? (or type "skip")', validate: validators.nonEmpty },
    ],
    confirmBeforeExecute: true,
    formatSummary: (p) => `## 🆕 New Client\n| Field | Value |\n|---|---|\n| Code | **${p.code}** |\n| Company | ${p.company} |\n| Phone | ${p.phone} |\n${p.email ? `| Email | ${p.email} |\n` : ''}${p.gst ? `| GST | ${p.gst} |\n` : ''}${p.address ? `| Address | ${p.address} |\n` : ''}`,
    executor: async (params) => {
      const data = {
        code: params.code.toUpperCase(),
        company: params.company,
        phone: String(params.phone).replace(/\D/g, ''),
        email: params.email || null,
        gst: params.gst || null,
        address: params.address || null,
      };
      const result = await clientService.upsert(data);
      return { success: true, message: `✅ Client **${result.code}** (${result.company}) created successfully!` };
    },
  },

  // ─── 2. CREATE SHIPMENT ───────────────────────────────────────────────────
  CREATE_SHIPMENT: {
    id: 'CREATE_SHIPMENT',
    description: 'Create a new shipment entry',
    requiredFields: [
      { key: 'clientCode',  prompt: '👤 **Client code**? (e.g. ABC)', validate: validators.clientCode },
      { key: 'awb',         prompt: '📦 **AWB / Tracking number**?', validate: validators.awb },
      { key: 'destination',  prompt: '📍 **Destination city**?', validate: validators.nonEmpty },
      { key: 'weight',       prompt: '⚖️ **Weight** (in kg)?', validate: validators.weight },
    ],
    optionalFields: [
      { key: 'consignee', prompt: '👤 **Consignee name**? (or "skip")', validate: validators.nonEmpty },
      { key: 'courier',   prompt: '🚚 **Courier**? (DTDC / Trackon / Delhivery or "skip")', validate: validators.nonEmpty },
    ],
    confirmBeforeExecute: true,
    formatSummary: (p) => `## 📦 New Shipment\n| Field | Value |\n|---|---|\n| Client | **${p.clientCode}** |\n| AWB | ${p.awb} |\n| Destination | ${p.destination} |\n| Weight | ${p.weight} kg |\n${p.consignee ? `| Consignee | ${p.consignee} |\n` : ''}${p.courier ? `| Courier | ${p.courier} |\n` : ''}`,
    executor: async (params) => {
      const result = await shipmentService.create({
        clientCode: params.clientCode.toUpperCase(),
        awb: params.awb,
        destination: params.destination.toUpperCase(),
        weight: parseFloat(params.weight),
        consignee: (params.consignee || 'UNKNOWN').toUpperCase(),
        courier: params.courier || 'Delhivery',
        service: 'Standard',
      });
      return { success: true, message: `✅ Shipment **${result.awb}** created for client ${result.clientCode}!` };
    },
  },

  // ─── 3. GENERATE INVOICE ──────────────────────────────────────────────────
  GENERATE_INVOICE: {
    id: 'GENERATE_INVOICE',
    description: 'Generate a GST invoice for a client',
    requiredFields: [
      { key: 'clientCode', prompt: '👤 **Client code**?', validate: validators.clientCode },
      { key: 'fromDate',   prompt: '📅 **From date**? (YYYY-MM-DD)', validate: validators.date },
      { key: 'toDate',     prompt: '📅 **To date**? (YYYY-MM-DD)', validate: validators.date },
    ],
    optionalFields: [],
    confirmBeforeExecute: true,
    formatSummary: (p) => `## 🧾 Generate Invoice\n| Field | Value |\n|---|---|\n| Client | **${p.clientCode}** |\n| From | ${p.fromDate} |\n| To | ${p.toDate} |`,
    executor: async (params) => {
      const result = await invoiceService.create({
        clientCode: params.clientCode.toUpperCase(),
        fromDate: params.fromDate,
        toDate: params.toDate,
      });
      return { success: true, message: `✅ Invoice **${result.invoiceNo}** generated! Total: ₹${result.total}` };
    },
  },

  // ─── 4. WALLET CREDIT ─────────────────────────────────────────────────────
  WALLET_CREDIT: {
    id: 'WALLET_CREDIT',
    description: 'Add money to a client wallet',
    requiredFields: [
      { key: 'clientCode',  prompt: '👤 **Client code**?', validate: validators.clientCode },
      { key: 'amount',      prompt: '💰 **Amount** to credit (₹)?', validate: validators.amount },
    ],
    optionalFields: [
      { key: 'description', prompt: '📝 **Description/reference**? (or "skip")', validate: validators.nonEmpty },
    ],
    confirmBeforeExecute: true,
    formatSummary: (p) => `## 💰 Wallet Credit\n| Field | Value |\n|---|---|\n| Client | **${p.clientCode}** |\n| Amount | ₹${p.amount} |\n${p.description ? `| Note | ${p.description} |\n` : ''}`,
    executor: async (params) => {
      const result = await walletService.credit({
        clientCode: params.clientCode.toUpperCase(),
        amount: parseFloat(params.amount),
        description: params.description || 'HawkAI credit',
      });
      return { success: true, message: `✅ Credited ₹${params.amount} to **${params.clientCode}**. New balance: ₹${result.wallet.walletBalance}` };
    },
  },

  // ─── 5. WALLET BALANCE ────────────────────────────────────────────────────
  WALLET_BALANCE: {
    id: 'WALLET_BALANCE',
    description: 'Check a client\'s wallet balance',
    requiredFields: [
      { key: 'clientCode', prompt: '👤 **Client code**?', validate: validators.clientCode },
    ],
    optionalFields: [],
    confirmBeforeExecute: false,
    executor: async (params) => {
      const client = await walletService.getWallet(params.clientCode.toUpperCase());
      return { success: true, message: `💰 **${client.code}** (${client.company})\nWallet Balance: **₹${toNum(client.walletBalance).toFixed(2)}**` };
    },
  },

  // ─── 6. TRACK SHIPMENT ────────────────────────────────────────────────────
  TRACK_SHIPMENT: {
    id: 'TRACK_SHIPMENT',
    description: 'Track a shipment via carrier API',
    requiredFields: [
      { key: 'awb', prompt: '📦 **AWB / Tracking number**?', validate: validators.awb },
    ],
    optionalFields: [],
    confirmBeforeExecute: false,
    executor: async (params) => {
      const { fetchTracking } = require('../services/carrier.service');
      const shipment = await prisma.shipment.findFirst({
        where: { awb: { contains: params.awb, mode: 'insensitive' } },
        select: { awb: true, courier: true, destination: true, clientCode: true, status: true },
      });
      const courier = shipment?.courier || 'Trackon';
      const tracking = await fetchTracking(courier, params.awb, { bypassCache: true });
      const events = (tracking.events || []).slice(0, 5).map(e => `• **${e.status}** — ${e.location || ''} — ${e.description || ''}`).join('\n');
      return { success: true, message: `## 📦 Tracking: ${params.awb}\n**Status**: ${tracking.status}\n**Courier**: ${courier}\n${shipment ? `**Client**: ${shipment.clientCode} | **Dest**: ${shipment.destination}` : ''}\n\n### Events\n${events || '_No events_'}` };
    },
  },

  // ─── 7. SEND DAILY DIGEST ─────────────────────────────────────────────────
  SEND_DAILY_DIGEST: {
    id: 'SEND_DAILY_DIGEST',
    description: 'Send a daily shipment digest to a client',
    requiredFields: [
      { key: 'clientCode', prompt: '👤 **Client code**?', validate: validators.clientCode },
      { key: 'date',       prompt: '📅 **Date**? (YYYY-MM-DD or "today")', validate: (v) => validators.date(v) || /^(today|yesterday)$/i.test(v) },
    ],
    optionalFields: [],
    confirmBeforeExecute: true,
    formatSummary: (p) => `## 📧 Send Daily Digest\n| Field | Value |\n|---|---|\n| Client | **${p.clientCode}** |\n| Date | ${p.date} |`,
    executor: async (params) => {
      const notifEngine = require('../services/notificationEngine.service');
      let date = params.date;
      if (date === 'today') date = new Date().toISOString().slice(0, 10);
      if (date === 'yesterday') { const d = new Date(); d.setDate(d.getDate()-1); date = d.toISOString().slice(0, 10); }
      const result = await notifEngine.sendDailyDigest(params.clientCode.toUpperCase(), date);
      return { success: true, message: `✅ Daily digest sent to **${params.clientCode}** for ${date}.` };
    },
  },

  // ─── 8. LIST NDRS ─────────────────────────────────────────────────────────
  LIST_NDRS: {
    id: 'LIST_NDRS',
    description: 'Show pending NDR (Non-Delivery Report) list',
    requiredFields: [],
    optionalFields: [],
    confirmBeforeExecute: false,
    executor: async () => {
      const ndrs = await prisma.shipment.findMany({
        where: { status: 'NDR', ndrStatus: 'Action Required' },
        select: { awb: true, clientCode: true, destination: true, consignee: true, date: true },
        take: 10,
        orderBy: { createdAt: 'desc' },
      });
      if (!ndrs.length) return { success: true, message: '✅ No pending NDRs! All clear.' };
      const rows = ndrs.map(n => `| ${n.awb} | ${n.clientCode} | ${n.destination} | ${n.consignee} | ${n.date} |`).join('\n');
      return { success: true, message: `## ❌ Pending NDRs (${ndrs.length})\n| AWB | Client | Destination | Consignee | Date |\n|---|---|---|---|---|\n${rows}` };
    },
  },

  // ─── 9. SYSTEM OVERVIEW ───────────────────────────────────────────────────
  SYSTEM_OVERVIEW: {
    id: 'SYSTEM_OVERVIEW',
    description: 'Show high-level system snapshot',
    requiredFields: [],
    optionalFields: [],
    confirmBeforeExecute: false,
    executor: async () => {
      const [active, ndrs, negWallets, today] = await Promise.all([
        prisma.shipment.count({ where: { status: { notIn: ['Delivered', 'RTO Delivered', 'Cancelled'] } } }),
        prisma.shipment.count({ where: { status: 'NDR', ndrStatus: 'Action Required' } }),
        prisma.client.count({ where: { walletBalance: { lt: 0 } } }),
        prisma.shipment.count({ where: { date: new Date().toISOString().slice(0, 10) } }),
      ]);
      return { success: true, message: `## 📊 System Overview\n| Metric | Value |\n|---|---|\n| Active Shipments | **${active}** |\n| Pending NDRs | **${ndrs}** |\n| Negative Wallets | **${negWallets}** |\n| Today's Entries | **${today}** |` };
    },
  },

  // ─── 10. DAILY REPORT ─────────────────────────────────────────────────────
  DAILY_REPORT: {
    id: 'DAILY_REPORT',
    description: 'Get a detailed daily operations report',
    requiredFields: [
      { key: 'date', prompt: '📅 **Which date**? (YYYY-MM-DD or "today")', validate: (v) => validators.date(v) || /^(today|yesterday)$/i.test(v) },
    ],
    optionalFields: [],
    confirmBeforeExecute: false,
    executor: async (params) => {
      let date = params.date;
      if (date === 'today') date = new Date().toISOString().slice(0, 10);
      if (date === 'yesterday') { const d = new Date(); d.setDate(d.getDate()-1); date = d.toISOString().slice(0, 10); }
      const [count, byCourier, revenue] = await Promise.all([
        prisma.shipment.count({ where: { date } }),
        prisma.shipment.groupBy({ by: ['courier'], _count: { id: true }, where: { date, courier: { not: null } } }),
        prisma.shipment.aggregate({ where: { date }, _sum: { amount: true } }),
      ]);
      const courierRows = byCourier.map(r => `| ${r.courier || 'Unknown'} | ${r._count.id} |`).join('\n');
      return { success: true, message: `## 📋 Daily Report: ${date}\n| Metric | Value |\n|---|---|\n| Total Shipments | **${count}** |\n| Total Revenue | **₹${toNum(revenue._sum?.amount).toLocaleString()}** |\n\n### By Courier\n| Courier | Count |\n|---|---|\n${courierRows || '| _None_ | 0 |'}` };
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2 FLOWS
  // ═══════════════════════════════════════════════════════════════════════════

  // ─── 11. UPDATE CLIENT ────────────────────────────────────────────────────
  UPDATE_CLIENT: {
    id: 'UPDATE_CLIENT',
    description: 'Update an existing client\'s details',
    requiredFields: [
      { key: 'code',  prompt: '👤 Which **client code** to update?', validate: validators.clientCode },
      { key: 'field', prompt: '📝 What field? (company / phone / email / gst / address)', validate: (v) => ['company','phone','email','gst','address'].includes(String(v||'').toLowerCase()) },
      { key: 'value', prompt: '✏️ New value?', validate: validators.nonEmpty },
    ],
    optionalFields: [],
    confirmBeforeExecute: true,
    formatSummary: (p) => `## ✏️ Update Client\n| Field | Value |\n|---|---|\n| Client | **${p.code}** |\n| Change | ${p.field} → ${p.value} |`,
    executor: async (params) => {
      const data = { code: params.code.toUpperCase(), [params.field.toLowerCase()]: params.value };
      const result = await clientService.upsert(data);
      return { success: true, message: `✅ Client **${result.code}** updated: ${params.field} = ${params.value}` };
    },
  },

  // ─── 12. DEACTIVATE CLIENT ────────────────────────────────────────────────
  DEACTIVATE_CLIENT: {
    id: 'DEACTIVATE_CLIENT',
    description: 'Deactivate a client account',
    requiredFields: [
      { key: 'code', prompt: '👤 Which **client code** to deactivate?', validate: validators.clientCode },
    ],
    optionalFields: [],
    confirmBeforeExecute: true,
    formatSummary: (p) => `## ⚠️ Deactivate Client **${p.code}**\nThis will prevent new shipments for this client.`,
    executor: async (params) => {
      await prisma.client.update({ where: { code: params.code.toUpperCase() }, data: { active: false } });
      return { success: true, message: `✅ Client **${params.code}** has been deactivated.` };
    },
  },

  // ─── 13. CLIENT STATS ─────────────────────────────────────────────────────
  CLIENT_STATS: {
    id: 'CLIENT_STATS',
    description: 'Show shipment stats for a client',
    requiredFields: [
      { key: 'clientCode', prompt: '👤 **Client code**?', validate: validators.clientCode },
    ],
    optionalFields: [],
    confirmBeforeExecute: false,
    executor: async (params) => {
      const data = await clientService.getClientStats(params.clientCode.toUpperCase());
      const rows = (data.byStatus || []).map(r => `| ${r.status} | ${r._count.id} | ₹${toNum(r._sum.amount).toLocaleString()} |`).join('\n');
      return { success: true, message: `## 📊 Client: ${data.client.company} (${data.client.code})\n| Metric | Value |\n|---|---|\n| Total Shipments | **${data.stats.total}** |\n| Total Revenue | **₹${toNum(data.stats.amount).toLocaleString()}** |\n| Total Weight | **${data.stats.weight} kg** |\n| Wallet | **₹${toNum(data.client.walletBalance)}** |\n\n### By Status\n| Status | Count | Amount |\n|---|---|---|\n${rows || '| - | 0 | ₹0 |'}` };
    },
  },

  // ─── 14. LIST CLIENTS ─────────────────────────────────────────────────────
  LIST_CLIENTS: {
    id: 'LIST_CLIENTS',
    description: 'Show all clients',
    requiredFields: [],
    optionalFields: [],
    confirmBeforeExecute: false,
    executor: async () => {
      const clients = await clientService.getAll();
      if (!clients.length) return { success: true, message: '📋 No clients found.' };
      const rows = clients.slice(0, 20).map(c => `| ${c.code} | ${c.company} | ₹${toNum(c.walletBalance).toFixed(0)} | ${c.active ? '✅' : '❌'} |`).join('\n');
      return { success: true, message: `## 👥 Clients (${clients.length})\n| Code | Company | Wallet | Active |\n|---|---|---|---|\n${rows}${clients.length > 20 ? `\n_...and ${clients.length - 20} more_` : ''}` };
    },
  },

  // ─── 15. UPDATE SHIPMENT STATUS ───────────────────────────────────────────
  UPDATE_SHIPMENT_STATUS: {
    id: 'UPDATE_SHIPMENT_STATUS',
    description: 'Update a shipment\'s status',
    requiredFields: [
      { key: 'awb',    prompt: '📦 **AWB number**?', validate: validators.awb },
      { key: 'status', prompt: '📋 New **status**? (Booked / InTransit / OutForDelivery / Delivered / NDR / RTO / Cancelled)', validate: validators.status },
    ],
    optionalFields: [],
    confirmBeforeExecute: true,
    formatSummary: (p) => `## 📋 Update Status\n| AWB | ${p.awb} |\n|---|---|\n| New Status | **${p.status}** |`,
    executor: async (params) => {
      const shipment = await prisma.shipment.findFirst({ where: { awb: { contains: params.awb, mode: 'insensitive' } } });
      if (!shipment) return { success: false, message: `❌ Shipment ${params.awb} not found.` };
      const result = await shipmentService.updateStatus(shipment.id, params.status);
      return { success: true, message: `✅ Shipment **${result.awb}** updated to **${result.status}**` };
    },
  },

  // ─── 16. DELETE SHIPMENT ──────────────────────────────────────────────────
  DELETE_SHIPMENT: {
    id: 'DELETE_SHIPMENT',
    description: 'Delete a shipment record',
    requiredFields: [
      { key: 'awb', prompt: '📦 **AWB number** to delete?', validate: validators.awb },
    ],
    optionalFields: [],
    confirmBeforeExecute: true,
    formatSummary: (p) => `## ⚠️ Delete Shipment\nAWB: **${p.awb}**\nThis action cannot be undone!`,
    executor: async (params) => {
      const shipment = await prisma.shipment.findFirst({ where: { awb: { contains: params.awb, mode: 'insensitive' } } });
      if (!shipment) return { success: false, message: `❌ Shipment ${params.awb} not found.` };
      await shipmentService.remove(shipment.id);
      return { success: true, message: `✅ Shipment **${params.awb}** deleted.` };
    },
  },

  // ─── 17. SEARCH SHIPMENTS ─────────────────────────────────────────────────
  SEARCH_SHIPMENTS: {
    id: 'SEARCH_SHIPMENTS',
    description: 'Search shipments by any keyword',
    requiredFields: [
      { key: 'query', prompt: '🔍 **Search query**? (AWB, client, consignee, city, courier...)', validate: validators.nonEmpty },
    ],
    optionalFields: [],
    confirmBeforeExecute: false,
    executor: async (params) => {
      const { shipments, total } = await shipmentService.getAll({ q: params.query }, 1, 10);
      if (!shipments.length) return { success: true, message: `🔍 No shipments found for "${params.query}".` };
      const rows = shipments.map(s => `| ${s.awb} | ${s.clientCode} | ${s.destination} | ${s.status} | ${s.date} |`).join('\n');
      return { success: true, message: `## 🔍 Search: "${params.query}" (${total} results)\n| AWB | Client | Dest | Status | Date |\n|---|---|---|---|---|\n${rows}` };
    },
  },

  // ─── 18. MONTHLY STATS ────────────────────────────────────────────────────
  MONTHLY_STATS: {
    id: 'MONTHLY_STATS',
    description: 'Get monthly shipment stats',
    requiredFields: [
      { key: 'month', prompt: '📅 Which **month**? (1-12)', validate: (v) => { const n = parseInt(v); return n >= 1 && n <= 12; } },
    ],
    optionalFields: [],
    confirmBeforeExecute: false,
    executor: async (params) => {
      const year = new Date().getFullYear();
      const month = parseInt(params.month);
      const stats = await shipmentService.getMonthlyStats(year, month);
      const total = stats.byDate ? stats.byDate.reduce((s, r) => s + (r._count?.id || 0), 0) : 0;
      const revenue = stats.byDate ? stats.byDate.reduce((s, r) => s + toNum(r._sum?.amount), 0) : 0;
      return { success: true, message: `## 📊 Monthly Stats: ${year}-${String(month).padStart(2,'0')}\n| Metric | Value |\n|---|---|\n| Total Shipments | **${total}** |\n| Total Revenue | **₹${revenue.toLocaleString()}** |` };
    },
  },

  // ─── 19. WALLET DEBIT ─────────────────────────────────────────────────────
  WALLET_DEBIT: {
    id: 'WALLET_DEBIT',
    description: 'Deduct money from a client wallet',
    requiredFields: [
      { key: 'clientCode', prompt: '👤 **Client code**?', validate: validators.clientCode },
      { key: 'amount',     prompt: '💸 **Amount** to debit (₹)?', validate: validators.amount },
    ],
    optionalFields: [
      { key: 'description', prompt: '📝 **Reason**? (or "skip")', validate: validators.nonEmpty },
    ],
    confirmBeforeExecute: true,
    formatSummary: (p) => `## 💸 Wallet Debit\n| Field | Value |\n|---|---|\n| Client | **${p.clientCode}** |\n| Amount | ₹${p.amount} |`,
    executor: async (params) => {
      const result = await walletService.debit({
        clientCode: params.clientCode.toUpperCase(),
        amount: parseFloat(params.amount),
        description: params.description || 'HawkAI debit',
      });
      return { success: true, message: `✅ Debited ₹${params.amount} from **${params.clientCode}**. Balance: ₹${result.wallet.walletBalance}` };
    },
  },

  // ─── 20. WALLET ADJUST ────────────────────────────────────────────────────
  WALLET_ADJUST: {
    id: 'WALLET_ADJUST',
    description: 'Admin adjustment to a client wallet (+ or -)',
    requiredFields: [
      { key: 'clientCode',  prompt: '👤 **Client code**?', validate: validators.clientCode },
      { key: 'amount',      prompt: '💰 **Amount**? (positive to add, negative to deduct)', validate: (v) => Number.isFinite(parseFloat(v)) && parseFloat(v) !== 0 },
      { key: 'description', prompt: '📝 **Reason** for adjustment?', validate: validators.nonEmpty },
    ],
    optionalFields: [],
    confirmBeforeExecute: true,
    formatSummary: (p) => `## 🔧 Wallet Adjustment\n| Client | **${p.clientCode}** |\n|---|---|\n| Amount | ₹${p.amount} |\n| Reason | ${p.description} |`,
    executor: async (params) => {
      const result = await walletService.adjust({
        clientCode: params.clientCode.toUpperCase(),
        amount: parseFloat(params.amount),
        description: params.description,
      });
      return { success: true, message: `✅ Adjusted ₹${params.amount} for **${params.clientCode}**. Balance: ₹${result.wallet.walletBalance}` };
    },
  },

  // ─── 21. WALLET HISTORY ───────────────────────────────────────────────────
  WALLET_HISTORY: {
    id: 'WALLET_HISTORY',
    description: 'Show wallet transaction history',
    requiredFields: [
      { key: 'clientCode', prompt: '👤 **Client code**?', validate: validators.clientCode },
    ],
    optionalFields: [],
    confirmBeforeExecute: false,
    executor: async (params) => {
      const { wallet, txns, total } = await walletService.getTransactions(params.clientCode.toUpperCase(), { limit: 10 });
      if (!txns.length) return { success: true, message: `💰 **${wallet.code}** — Balance: ₹${toNum(wallet.walletBalance)}\nNo transactions yet.` };
      const rows = txns.map(t => `| ${t.type} | ₹${t.amount} | ₹${t.balance} | ${t.description || '-'} |`).join('\n');
      return { success: true, message: `## 💰 Wallet: ${wallet.code} (₹${toNum(wallet.walletBalance)})\n| Type | Amount | Balance | Note |\n|---|---|---|---|\n${rows}\n_${total} total transactions_` };
    },
  },

  // ─── 22. NEGATIVE WALLETS ─────────────────────────────────────────────────
  NEGATIVE_WALLETS: {
    id: 'NEGATIVE_WALLETS',
    description: 'Show clients with negative wallet balance',
    requiredFields: [],
    optionalFields: [],
    confirmBeforeExecute: false,
    executor: async () => {
      const clients = await prisma.client.findMany({ where: { walletBalance: { lt: 0 } }, orderBy: { walletBalance: 'asc' }, select: { code: true, company: true, walletBalance: true } });
      if (!clients.length) return { success: true, message: '✅ No clients with negative balance!' };
      const rows = clients.map(c => `| ${c.code} | ${c.company} | ₹${toNum(c.walletBalance).toFixed(2)} |`).join('\n');
      return { success: true, message: `## ⚠️ Negative Wallets (${clients.length})\n| Code | Company | Balance |\n|---|---|---|\n${rows}` };
    },
  },

  // ─── 23. LIST INVOICES ────────────────────────────────────────────────────
  LIST_INVOICES: {
    id: 'LIST_INVOICES',
    description: 'Show all invoices',
    requiredFields: [],
    optionalFields: [],
    confirmBeforeExecute: false,
    executor: async () => {
      const invoices = await invoiceService.getAll();
      if (!invoices.length) return { success: true, message: '📋 No invoices found.' };
      const rows = invoices.slice(0, 15).map(i => `| ${i.invoiceNo} | ${i.clientCode} | ₹${i.total} | ${i.status || 'DRAFT'} |`).join('\n');
      return { success: true, message: `## 🧾 Invoices (${invoices.length})\n| Invoice | Client | Total | Status |\n|---|---|---|---|\n${rows}` };
    },
  },

  // ─── 24. MARK INVOICE PAID ────────────────────────────────────────────────
  MARK_INVOICE_PAID: {
    id: 'MARK_INVOICE_PAID',
    description: 'Mark an invoice as paid',
    requiredFields: [
      { key: 'invoiceId', prompt: '🧾 **Invoice ID** (number)?', validate: (v) => Number.isFinite(parseInt(v)) },
    ],
    optionalFields: [],
    confirmBeforeExecute: true,
    formatSummary: (p) => `## ✅ Mark Invoice #${p.invoiceId} as PAID`,
    executor: async (params) => {
      const result = await invoiceService.updateStatus(params.invoiceId, 'PAID');
      return { success: true, message: `✅ Invoice **${result.invoiceNo}** marked as PAID.` };
    },
  },

  // ─── 25. CREATE CONTRACT ──────────────────────────────────────────────────
  CREATE_CONTRACT: {
    id: 'CREATE_CONTRACT',
    description: 'Create a pricing contract for a client',
    requiredFields: [
      { key: 'clientCode',  prompt: '👤 **Client code**?', validate: validators.clientCode },
      { key: 'name',        prompt: '📝 **Contract name**? (e.g. "DTDC Standard")', validate: validators.nonEmpty },
      { key: 'baseRate',    prompt: '💰 **Base rate** (₹)?', validate: validators.amount },
      { key: 'pricingType', prompt: '📊 **Pricing type**? (PER_KG / FLAT / PER_SHIPMENT)', validate: (v) => ['PER_KG','FLAT','PER_SHIPMENT'].includes(String(v||'').toUpperCase()) },
    ],
    optionalFields: [
      { key: 'courier',  prompt: '🚚 **Courier**? (or "skip" for any)', validate: validators.nonEmpty },
      { key: 'minCharge', prompt: '💰 **Minimum charge** (₹)? (or "skip")', validate: validators.amount },
    ],
    confirmBeforeExecute: true,
    formatSummary: (p) => `## 📝 New Contract\n| Field | Value |\n|---|---|\n| Client | **${p.clientCode}** |\n| Name | ${p.name} |\n| Rate | ₹${p.baseRate} (${p.pricingType}) |\n${p.courier ? `| Courier | ${p.courier} |\n` : ''}`,
    executor: async (params) => {
      const contractService = require('../services/contract.service');
      const result = await contractService.upsert({
        clientCode: params.clientCode.toUpperCase(),
        name: params.name,
        baseRate: parseFloat(params.baseRate),
        pricingType: params.pricingType.toUpperCase(),
        courier: params.courier || null,
        minCharge: params.minCharge ? parseFloat(params.minCharge) : 0,
      });
      return { success: true, message: `✅ Contract **${result.name}** created for ${params.clientCode}!` };
    },
  },

  // ─── 26. CALCULATE RATE ───────────────────────────────────────────────────
  CALCULATE_RATE: {
    id: 'CALCULATE_RATE',
    description: 'Calculate shipping rate for a client',
    requiredFields: [
      { key: 'clientCode', prompt: '👤 **Client code**?', validate: validators.clientCode },
      { key: 'weight',     prompt: '⚖️ **Weight** (kg)?', validate: validators.weight },
      { key: 'courier',    prompt: '🚚 **Courier**? (DTDC / Trackon / Delhivery)', validate: validators.nonEmpty },
    ],
    optionalFields: [],
    confirmBeforeExecute: false,
    executor: async (params) => {
      const contractService = require('../services/contract.service');
      const result = await contractService.calculatePrice({
        clientCode: params.clientCode.toUpperCase(),
        courier: params.courier,
        service: 'Standard',
        weight: parseFloat(params.weight),
      });
      if (!result) return { success: true, message: `⚠️ No contract found for ${params.clientCode} + ${params.courier}. Set up a contract first.` };
      return { success: true, message: `## 💰 Rate: ${params.clientCode} → ${params.courier}\n| Component | Amount |\n|---|---|\n| Base | ₹${result.base} |\n| Fuel | ₹${result.fuelSurcharge} |\n| GST | ₹${result.gst} |\n| **Total** | **₹${result.total}** |` };
    },
  },

  // ─── 27. LIST CONTRACTS ───────────────────────────────────────────────────
  LIST_CONTRACTS: {
    id: 'LIST_CONTRACTS',
    description: 'Show all pricing contracts',
    requiredFields: [],
    optionalFields: [],
    confirmBeforeExecute: false,
    executor: async () => {
      const contractService = require('../services/contract.service');
      const contracts = await contractService.getAll();
      if (!contracts.length) return { success: true, message: '📋 No contracts found.' };
      const rows = contracts.slice(0, 15).map(c => `| ${c.clientCode} | ${c.name} | ₹${c.baseRate} | ${c.pricingType} | ${c.active ? '✅' : '❌'} |`).join('\n');
      return { success: true, message: `## 📝 Contracts (${contracts.length})\n| Client | Name | Rate | Type | Active |\n|---|---|---|---|---|\n${rows}` };
    },
  },

  // ─── 28. CREATE PICKUP ────────────────────────────────────────────────────
  CREATE_PICKUP: {
    id: 'CREATE_PICKUP',
    description: 'Schedule a pickup request',
    requiredFields: [
      { key: 'clientCode',  prompt: '👤 **Client code**?', validate: validators.clientCode },
      { key: 'pickupDate',  prompt: '📅 **Pickup date**? (YYYY-MM-DD or "today")', validate: (v) => validators.date(v) || /^(today|tomorrow)$/i.test(v) },
      { key: 'address',     prompt: '📍 **Pickup address**?', validate: validators.nonEmpty },
    ],
    optionalFields: [
      { key: 'contactPhone', prompt: '📞 **Contact phone**? (or "skip")', validate: validators.phone },
    ],
    confirmBeforeExecute: true,
    formatSummary: (p) => `## 🚚 Schedule Pickup\n| Client | **${p.clientCode}** |\n|---|---|\n| Date | ${p.pickupDate} |\n| Address | ${p.address} |`,
    executor: async (params) => {
      const pickupService = require('../services/pickup.service');
      let date = params.pickupDate;
      if (date === 'today') date = new Date().toISOString().slice(0, 10);
      if (date === 'tomorrow') { const d = new Date(); d.setDate(d.getDate()+1); date = d.toISOString().slice(0, 10); }
      const result = await pickupService.create({
        clientCode: params.clientCode.toUpperCase(),
        pickupDate: date,
        address: params.address,
        contactPhone: params.contactPhone || null,
      });
      return { success: true, message: `✅ Pickup **${result.refNo}** scheduled for ${date}!` };
    },
  },

  // ─── 29. LIST PICKUPS ─────────────────────────────────────────────────────
  LIST_PICKUPS: {
    id: 'LIST_PICKUPS',
    description: 'Show today\'s pickup requests',
    requiredFields: [],
    optionalFields: [],
    confirmBeforeExecute: false,
    executor: async () => {
      const pickupService = require('../services/pickup.service');
      const today = new Date().toISOString().slice(0, 10);
      const { items, total } = await pickupService.getAll({ date: today });
      if (!items.length) return { success: true, message: `📋 No pickups scheduled for today (${today}).` };
      const rows = items.map(p => `| ${p.refNo} | ${p.clientCode} | ${p.status} | ${p.address || '-'} |`).join('\n');
      return { success: true, message: `## 🚚 Today's Pickups (${total})\n| Ref | Client | Status | Address |\n|---|---|---|---|\n${rows}` };
    },
  },

  // ─── 30. CREATE QUOTE ─────────────────────────────────────────────────────
  CREATE_QUOTE: {
    id: 'CREATE_QUOTE',
    description: 'Create a price quote for a client',
    requiredFields: [
      { key: 'clientCode',  prompt: '👤 **Client code**?', validate: validators.clientCode },
      { key: 'courier',     prompt: '🚚 **Courier**?', validate: validators.nonEmpty },
      { key: 'weight',      prompt: '⚖️ **Weight** (kg)?', validate: validators.weight },
      { key: 'destination', prompt: '📍 **Destination**?', validate: validators.nonEmpty },
    ],
    optionalFields: [],
    confirmBeforeExecute: true,
    formatSummary: (p) => `## 💬 Quote\n| Client | ${p.clientCode} | Courier | ${p.courier} |\n|---|---|---|---|\n| Weight | ${p.weight} kg | Dest | ${p.destination} |`,
    executor: async (params) => {
      const quoteService = require('../services/quote.service');
      const result = await quoteService.createQuote({
        clientCode: params.clientCode.toUpperCase(),
        courier: params.courier,
        weight: parseFloat(params.weight),
        destination: params.destination.toUpperCase(),
      });
      return { success: true, message: `✅ Quote **${result.quoteNo}** created!` };
    },
  },

  // ─── 31. LIST QUOTES ──────────────────────────────────────────────────────
  LIST_QUOTES: {
    id: 'LIST_QUOTES',
    description: 'Show recent quotes',
    requiredFields: [],
    optionalFields: [],
    confirmBeforeExecute: false,
    executor: async () => {
      const quoteService = require('../services/quote.service');
      const { data, total } = await quoteService.listQuotes({});
      if (!data.length) return { success: true, message: '📋 No quotes found.' };
      const rows = data.slice(0, 10).map(q => `| ${q.quoteNo} | ${q.clientCode} | ${q.courier} | ${q.status} |`).join('\n');
      return { success: true, message: `## 💬 Quotes (${total})\n| Quote | Client | Courier | Status |\n|---|---|---|---|\n${rows}` };
    },
  },

  // ─── 32. RESOLVE NDR ──────────────────────────────────────────────────────
  RESOLVE_NDR: {
    id: 'RESOLVE_NDR',
    description: 'Resolve an NDR (reattempt / RTO / update address)',
    requiredFields: [
      { key: 'awb',    prompt: '📦 **AWB number** of the NDR?', validate: validators.awb },
      { key: 'action', prompt: '⚡ **Action**? (REATTEMPT / RTO / UPDATE_ADDRESS)', validate: validators.ndrAction },
    ],
    optionalFields: [
      { key: 'newAddress', prompt: '📍 **New address**? (required for UPDATE_ADDRESS, or "skip")', validate: validators.nonEmpty },
    ],
    confirmBeforeExecute: true,
    formatSummary: (p) => `## ❌ Resolve NDR\n| AWB | **${p.awb}** |\n|---|---|\n| Action | ${p.action} |\n${p.newAddress ? `| New Address | ${p.newAddress} |` : ''}`,
    executor: async (params) => {
      const shipment = await prisma.shipment.findFirst({ where: { awb: { contains: params.awb, mode: 'insensitive' } }, include: { ndrEvents: { orderBy: { createdAt: 'desc' }, take: 1 } } });
      if (!shipment) return { success: false, message: `❌ Shipment ${params.awb} not found.` };
      const ndr = shipment.ndrEvents?.[0];
      if (!ndr) return { success: false, message: `❌ No NDR event found for ${params.awb}.` };
      await ndrService.resolve(ndr.id, { adminAction: params.action.toUpperCase(), newAddress: params.newAddress || null, notes: 'Resolved via HawkAI' });
      return { success: true, message: `✅ NDR for **${params.awb}** resolved: **${params.action}**` };
    },
  },

  // ─── 33. LIST RETURNS ─────────────────────────────────────────────────────
  LIST_RETURNS: {
    id: 'LIST_RETURNS',
    description: 'Show return requests',
    requiredFields: [],
    optionalFields: [],
    confirmBeforeExecute: false,
    executor: async () => {
      const returnService = require('../services/return.service');
      const { items, total } = await returnService.listReturns({ limit: 10 });
      if (!items.length) return { success: true, message: '📋 No return requests found.' };
      const rows = items.map(r => `| ${r.id} | ${r.originalAwb} | ${r.clientCode} | ${r.status} | ${r.reason} |`).join('\n');
      return { success: true, message: `## 🔄 Returns (${total})\n| ID | AWB | Client | Status | Reason |\n|---|---|---|---|---|\n${rows}` };
    },
  },

  // ─── 34. APPROVE RETURN ───────────────────────────────────────────────────
  APPROVE_RETURN: {
    id: 'APPROVE_RETURN',
    description: 'Approve a return request',
    requiredFields: [
      { key: 'returnId', prompt: '🔢 **Return request ID**?', validate: (v) => Number.isFinite(parseInt(v)) },
    ],
    optionalFields: [],
    confirmBeforeExecute: true,
    formatSummary: (p) => `## ✅ Approve Return #${p.returnId}`,
    executor: async (params) => {
      const returnService = require('../services/return.service');
      const result = await returnService.approveReturn(params.returnId);
      return { success: true, message: `✅ Return #${params.returnId} approved! (AWB: ${result.originalAwb})` };
    },
  },

  // ─── 35. REJECT RETURN ────────────────────────────────────────────────────
  REJECT_RETURN: {
    id: 'REJECT_RETURN',
    description: 'Reject a return request',
    requiredFields: [
      { key: 'returnId',   prompt: '🔢 **Return request ID**?', validate: (v) => Number.isFinite(parseInt(v)) },
      { key: 'adminNotes', prompt: '📝 **Reason** for rejection?', validate: validators.nonEmpty },
    ],
    optionalFields: [],
    confirmBeforeExecute: true,
    formatSummary: (p) => `## ❌ Reject Return #${p.returnId}\nReason: ${p.adminNotes}`,
    executor: async (params) => {
      const returnService = require('../services/return.service');
      const result = await returnService.rejectReturn(params.returnId, { adminNotes: params.adminNotes });
      return { success: true, message: `✅ Return #${params.returnId} rejected.` };
    },
  },

  // ─── 36. RETURN STATS ─────────────────────────────────────────────────────
  RETURN_STATS: {
    id: 'RETURN_STATS',
    description: 'Show return request statistics',
    requiredFields: [],
    optionalFields: [],
    confirmBeforeExecute: false,
    executor: async () => {
      const returnService = require('../services/return.service');
      const stats = await returnService.getReturnStats();
      return { success: true, message: `## 🔄 Return Stats\n| Metric | Value |\n|---|---|\n| Pending | **${stats.pending}** |\n| Approved | **${stats.approved}** |\n| In Transit | **${stats.inTransit}** |\n| Received | **${stats.received}** |\n| Rejected | **${stats.rejected}** |\n| Total | **${stats.total}** |` };
    },
  },

  // ─── 37. CREATE DRAFT ORDER ───────────────────────────────────────────────
  CREATE_DRAFT: {
    id: 'CREATE_DRAFT',
    description: 'Create a draft order for a client',
    requiredFields: [
      { key: 'clientCode', prompt: '👤 **Client code**?', validate: validators.clientCode },
      { key: 'consignee',  prompt: '👤 **Consignee name**?', validate: validators.nonEmpty },
      { key: 'weight',     prompt: '⚖️ **Weight** (kg)?', validate: validators.weight },
    ],
    optionalFields: [
      { key: 'destination', prompt: '📍 **Destination**? (or "skip")', validate: validators.nonEmpty },
      { key: 'phone',       prompt: '📞 **Phone**? (or "skip")', validate: validators.phone },
    ],
    confirmBeforeExecute: true,
    formatSummary: (p) => `## 📋 New Draft Order\n| Client | **${p.clientCode}** |\n|---|---|\n| Consignee | ${p.consignee} |\n| Weight | ${p.weight} kg |`,
    executor: async (params) => {
      const draftService = require('../services/draftOrder.service');
      const result = await draftService.create({ clientCode: params.clientCode.toUpperCase(), consignee: params.consignee, weight: parseFloat(params.weight), destination: params.destination || '', phone: params.phone || null });
      return { success: true, message: `✅ Draft order #${result.id} created for ${params.clientCode}!` };
    },
  },

  // ─── 38. LIST DRAFTS ──────────────────────────────────────────────────────
  LIST_DRAFTS: {
    id: 'LIST_DRAFTS',
    description: 'Show pending draft orders',
    requiredFields: [],
    optionalFields: [],
    confirmBeforeExecute: false,
    executor: async () => {
      const draftService = require('../services/draftOrder.service');
      const { drafts, total } = await draftService.getAll({ status: 'PENDING' });
      if (!drafts.length) return { success: true, message: '📋 No pending draft orders.' };
      const rows = drafts.slice(0, 10).map(d => `| ${d.id} | ${d.clientCode} | ${d.consignee} | ${d.weight} kg | ${d.status} |`).join('\n');
      return { success: true, message: `## 📋 Draft Orders (${total})\n| ID | Client | Consignee | Weight | Status |\n|---|---|---|---|---|\n${rows}` };
    },
  },

  // ─── 39. RECON STATS ──────────────────────────────────────────────────────
  RECON_STATS: {
    id: 'RECON_STATS',
    description: 'Show reconciliation statistics',
    requiredFields: [],
    optionalFields: [],
    confirmBeforeExecute: false,
    executor: async () => {
      const reconService = require('../services/reconciliation.service');
      const stats = await reconService.getReconciliationStats();
      return { success: true, message: `## 🔍 Reconciliation Stats\n| Metric | Value |\n|---|---|\n| Total Invoices | **${stats.totalInvoices}** |\n| Total Billed | **₹${stats.totalBilled}** |\n| Overcharges | **₹${stats.totalOvercharges}** (${stats.overchargeCount} items) |\n| Potential Saving | **₹${stats.potentialSaving}** |\n| Leakage Alerts | **${stats.leakageAlerts}** |\n| Weight Disputes | **${stats.weightDisputeAlerts}** |` };
    },
  },

  // ─── 40. LIST DISPUTES ────────────────────────────────────────────────────
  LIST_DISPUTES: {
    id: 'LIST_DISPUTES',
    description: 'Show open billing disputes',
    requiredFields: [],
    optionalFields: [],
    confirmBeforeExecute: false,
    executor: async () => {
      const reconService = require('../services/reconciliation.service');
      const { data, total } = await reconService.getDisputes({ status: 'OPEN' });
      if (!data.length) return { success: true, message: '✅ No open disputes!' };
      const rows = data.map(d => `| ${d.disputeNo} | ${d.status} | ${new Date(d.createdAt).toLocaleDateString()} |`).join('\n');
      return { success: true, message: `## ⚖️ Open Disputes (${total})\n| Dispute | Status | Date |\n|---|---|---|\n${rows}` };
    },
  },

  // ─── 41. COURIER PERFORMANCE ──────────────────────────────────────────────
  COURIER_PERFORMANCE: {
    id: 'COURIER_PERFORMANCE',
    description: 'Compare courier performance metrics',
    requiredFields: [],
    optionalFields: [],
    confirmBeforeExecute: false,
    executor: async () => {
      const stats = await prisma.shipment.groupBy({
        by: ['courier'],
        _count: { id: true },
        _sum: { amount: true },
        where: { courier: { not: null } },
        orderBy: { _count: { id: 'desc' } },
      });
      if (!stats.length) return { success: true, message: '📊 No shipment data for courier comparison.' };
      const rows = stats.map(s => `| ${s.courier} | ${s._count.id} | ₹${(s._sum.amount || 0).toLocaleString()} |`).join('\n');
      return { success: true, message: `## 🚚 Courier Performance\n| Courier | Shipments | Revenue |\n|---|---|---|\n${rows}` };
    },
  },

  // ─── 42. SEND POD EMAIL ───────────────────────────────────────────────────
  SEND_POD: {
    id: 'SEND_POD',
    description: 'Send proof of delivery email for a shipment',
    requiredFields: [
      { key: 'awb', prompt: '📦 **AWB number**?', validate: validators.awb },
    ],
    optionalFields: [],
    confirmBeforeExecute: true,
    formatSummary: (p) => `## 📧 Send POD for AWB: **${p.awb}**`,
    executor: async (params) => {
      const notify = require('../services/notification.service');
      const shipment = await prisma.shipment.findFirst({ where: { awb: { contains: params.awb, mode: 'insensitive' } }, include: { client: true } });
      if (!shipment) return { success: false, message: `❌ Shipment ${params.awb} not found.` };
      await notify.sendPODEmail(shipment);
      return { success: true, message: `✅ POD email sent for **${shipment.awb}**!` };
    },
  },

  // ─── 43. QUOTE STATS ──────────────────────────────────────────────────────
  QUOTE_STATS: {
    id: 'QUOTE_STATS',
    description: 'Show quote conversion statistics',
    requiredFields: [],
    optionalFields: [],
    confirmBeforeExecute: false,
    executor: async () => {
      const quoteService = require('../services/quote.service');
      const stats = await quoteService.getQuoteStats();
      return { success: true, message: `## 💬 Quote Stats\n| Metric | Value |\n|---|---|\n| Total Quotes | **${stats.total}** |\n| Last 30 Days | **${stats.last30}** |\n| Conversion Rate | **${stats.conversionRate}%** |\n| Avg Margin | **${stats.avgMargin}%** |` };
    },
  },
};

function getFlow(flowId) {
  return FLOWS[flowId] || null;
}

function getAllFlowIds() {
  return Object.keys(FLOWS);
}

module.exports = { FLOWS, getFlow, getAllFlowIds, validators };

