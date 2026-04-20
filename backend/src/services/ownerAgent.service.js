'use strict';
/**
 * ownerAgent.service.js — HawkAI Enterprise Owner Agent
 *
 * A full autonomous agent that performs owner-level tasks.
 * - Detects intent from natural language
 * - Executes actions (shipment entry, invoice, rate decisions, etc.)
 * - Learns from owner decisions and applies patterns
 * - Maintains conversation context
 */

const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const analyticsService = require('./analytics.service');
const { fetchTracking } = require('./carrier.service');

// ── Action Types ────────────────────────────────────────────────────────────
const ACTION_TYPES = {
  CREATE_SHIPMENT:    'CREATE_SHIPMENT',
  BACKLOG_ENTRY:      'BACKLOG_ENTRY',
  GENERATE_INVOICE:   'GENERATE_INVOICE',
  AUDIT_BILL:         'AUDIT_BILL',
  MANAGE_CLIENT:      'MANAGE_CLIENT',
  SEND_NOTIFICATION:  'SEND_NOTIFICATION',
  RATE_DECISION:      'RATE_DECISION',
  NDR_RESOLVE:        'NDR_RESOLVE',
  RECONCILE:          'RECONCILE',
  DAILY_REPORT:       'DAILY_REPORT',
  TRACK_SHIPMENT:     'TRACK_SHIPMENT',
  LOOKUP_SHIPMENT:    'LOOKUP_SHIPMENT',
  CLIENT_ANALYTICS:   'CLIENT_ANALYTICS',
  WALLET_STATUS:      'WALLET_STATUS',
  PENDING_NDRS:       'PENDING_NDRS',
  SYSTEM_OVERVIEW:    'SYSTEM_OVERVIEW',
  COURIER_PERFORMANCE:'COURIER_PERFORMANCE',
  SEARCH_SHIPMENTS:   'SEARCH_SHIPMENTS',
};

// ── Helpers ─────────────────────────────────────────────────────────────────
function extractAwb(text) {
  const matches = String(text || '').toUpperCase().match(/[A-Z0-9]{6,}/g) || [];
  return matches[0] || '';
}

function includesAny(text, words) {
  return words.some((w) => text.includes(w));
}

function extractDate(text) {
  // Matches: 18 april, april 18, 18/04, 18-04-2026, 2026-04-18, etc.
  const isoMatch = text.match(/\d{4}-\d{2}-\d{2}/);
  if (isoMatch) return isoMatch[0];

  const slashMatch = text.match(/(\d{1,2})[-/](\d{1,2})(?:[-/](\d{2,4}))?/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, '0');
    const month = slashMatch[2].padStart(2, '0');
    const year = slashMatch[3] ? (slashMatch[3].length === 2 ? `20${slashMatch[3]}` : slashMatch[3]) : new Date().getFullYear();
    return `${year}-${month}-${day}`;
  }

  const months = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
  for (const [name, num] of Object.entries(months)) {
    const re = new RegExp(`(\\d{1,2})\\s*(?:st|nd|rd|th)?\\s*${name}|${name}\\w*\\s+(\\d{1,2})`, 'i');
    const m = text.match(re);
    if (m) {
      const day = (m[1] || m[2]).padStart(2, '0');
      return `${new Date().getFullYear()}-${num}-${day}`;
    }
  }

  // "today", "yesterday"
  if (text.includes('today')) {
    return new Date().toISOString().slice(0, 10);
  }
  if (text.includes('yesterday')) {
    const d = new Date(); d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }
  return null;
}

function extractClientCode(text) {
  const upper = text.toUpperCase();
  const match = upper.match(/\b(CLIENT|FOR)\s+([A-Z]{2,10})\b/);
  return match ? match[2] : null;
}

function extractWeight(text) {
  const match = text.match(/(\d+(?:\.\d+)?)\s*(?:kg|kgs|kilo)/i);
  return match ? parseFloat(match[1]) : null;
}

function extractCourier(text) {
  const lower = text.toLowerCase();
  if (lower.includes('dtdc')) return 'DTDC';
  if (lower.includes('trackon')) return 'Trackon';
  if (lower.includes('delhivery')) return 'Delhivery';
  if (lower.includes('bluedart') || lower.includes('blue dart')) return 'BlueDart';
  if (lower.includes('prime track') || lower.includes('primetrack')) return 'Prime Track';
  return null;
}

function extractDestination(text) {
  const match = text.match(/(?:to|destination|dest|for)\s+([A-Za-z\s]{3,25}?)(?:\s*,|\s+via|\s+by|\s+\d|$)/i);
  return match ? match[1].trim().toUpperCase() : null;
}

function extractField(text, label) {
  const re = new RegExp(`${label}\\s*[:\\-]\\s*([^,;\\n]+)`, 'i');
  const m = text.match(re);
  return m ? m[1].trim() : null;
}

function formatCurrency(value) {
  const num = Number(value) || 0;
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
}

function recentHistoryText(history = []) {
  return (Array.isArray(history) ? history : [])
    .slice(-6)
    .map((item) => String(item?.content || item?.text || ''))
    .join(' ');
}

// ── Memory / Learning Engine ────────────────────────────────────────────────

async function recordDecision(category, contextKey, decision, metadata = null) {
  try {
    await prisma.agentMemory.upsert({
      where: { category_contextKey_decision: { category, contextKey, decision } },
      update: {
        frequency: { increment: 1 },
        lastUsedAt: new Date(),
        metadata: metadata || undefined,
      },
      create: { category, contextKey, decision, metadata, frequency: 1 },
    });
  } catch (err) {
    logger.warn(`[HawkAI] Memory write failed: ${err.message}`);
  }
}

async function recallDecision(category, contextKey) {
  try {
    const memories = await prisma.agentMemory.findMany({
      where: { category, contextKey },
      orderBy: { frequency: 'desc' },
      take: 3,
    });
    return memories;
  } catch {
    return [];
  }
}

async function getMemorySummary() {
  try {
    const [totalMemories, topCategories, recentLearnings] = await Promise.all([
      prisma.agentMemory.count(),
      prisma.agentMemory.groupBy({
        by: ['category'],
        _count: { id: true },
        _sum: { frequency: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      prisma.agentMemory.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: { category: true, contextKey: true, decision: true, frequency: true, lastUsedAt: true },
      }),
    ]);
    return { totalMemories, topCategories, recentLearnings };
  } catch {
    return { totalMemories: 0, topCategories: [], recentLearnings: [] };
  }
}

// ── Action Logging ──────────────────────────────────────────────────────────

async function logAction(actionType, params, confidence = 0) {
  try {
    return await prisma.agentActionLog.create({
      data: { actionType, params, confidence, status: 'PENDING' },
    });
  } catch (err) {
    logger.warn(`[HawkAI] Action log failed: ${err.message}`);
    return null;
  }
}

async function completeAction(logId, result, status = 'DONE') {
  if (!logId) return;
  try {
    await prisma.agentActionLog.update({
      where: { id: logId },
      data: { result, status, completedAt: new Date() },
    });
  } catch { /* non-blocking */ }
}

async function getActionHistory(limit = 20) {
  try {
    return await prisma.agentActionLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  } catch {
    return [];
  }
}

// ── System Snapshot ─────────────────────────────────────────────────────────

async function getSnapshot() {
  const [activeShipments, pendingNDRs, overview, negativeWallets, todayShipments] = await Promise.all([
    prisma.shipment.count({ where: { status: { notIn: ['Delivered', 'RTO Delivered', 'Cancelled'] } } }),
    prisma.shipment.count({ where: { status: 'NDR', ndrStatus: 'Action Required' } }),
    analyticsService.getOverview().catch(() => ({})),
    prisma.client.count({ where: { walletBalance: { lt: 0 } } }),
    prisma.shipment.count({ where: { date: new Date().toISOString().slice(0, 10) } }),
  ]).catch(() => [0, 0, {}, 0, 0]);

  const todayBookings = overview?.stats?.find((s) => s.title === "Today's Bookings")?.value || 0;
  const todayRevenue = overview?.stats?.find((s) => s.title === "Today's Revenue")?.value || '₹0';

  return { activeShipments, pendingNDRs, todayBookings, todayRevenue, negativeWallets, todayShipments };
}

// ── Intent Detection ────────────────────────────────────────────────────────

function detectIntent(message, history = []) {
  const raw = String(message || '').trim();
  const msg = raw.toLowerCase();
  const awb = extractAwb(raw);
  const date = extractDate(msg);
  const clientCode = extractClientCode(raw);
  const courier = extractCourier(msg);
  const weight = extractWeight(msg);
  const destination = extractDestination(raw);

  // Create / Enter shipment (including backlog)
  if (includesAny(msg, ['create shipment', 'enter shipment', 'add shipment', 'book shipment', 'new shipment', 'enter entry', 'add entry', 'new entry'])) {
    const isBacklog = date && date !== new Date().toISOString().slice(0, 10);
    return {
      type: isBacklog ? ACTION_TYPES.BACKLOG_ENTRY : ACTION_TYPES.CREATE_SHIPMENT,
      confidence: 0.85,
      params: { date, clientCode, awb, courier, weight, destination },
      requiresConfirmation: true,
    };
  }

  // Backlog entry
  if (includesAny(msg, ['backlog', 'backdated', 'back-dated', 'past date entry', 'enter for'])) {
    return {
      type: ACTION_TYPES.BACKLOG_ENTRY,
      confidence: 0.85,
      params: { date, clientCode, awb, courier, weight, destination },
      requiresConfirmation: true,
    };
  }

  // Invoice
  if (includesAny(msg, ['generate invoice', 'create invoice', 'make invoice', 'send invoice', 'bill client'])) {
    return {
      type: ACTION_TYPES.GENERATE_INVOICE,
      confidence: 0.80,
      params: { clientCode, dateFrom: extractField(msg, 'from'), dateTo: extractField(msg, 'to') },
      requiresConfirmation: true,
    };
  }

  // Audit bill
  if (includesAny(msg, ['audit', 'verify bill', 'check bill', 'bill audit', 'reconcile bill'])) {
    return { type: ACTION_TYPES.AUDIT_BILL, confidence: 0.80, params: { courier }, requiresConfirmation: true };
  }

  // Send notification
  if (includesAny(msg, ['send notification', 'notify client', 'send update', 'email client', 'whatsapp client', 'send digest', 'daily digest'])) {
    return {
      type: ACTION_TYPES.SEND_NOTIFICATION,
      confidence: 0.85,
      params: { clientCode, date, awb },
      requiresConfirmation: true,
    };
  }

  // Rate query
  if (includesAny(msg, ['rate for', 'best rate', 'cheapest rate', 'compare rate', 'rate check', 'what rate', 'how much'])) {
    return {
      type: ACTION_TYPES.RATE_DECISION,
      confidence: 0.80,
      params: { destination, weight, courier },
      requiresConfirmation: false,
    };
  }

  // NDR actions
  if (includesAny(msg, ['ndr', 'pending ndr', 'resolve ndr', 'ndr action', 'delivery failed'])) {
    if (awb) {
      return { type: ACTION_TYPES.NDR_RESOLVE, confidence: 0.80, params: { awb }, requiresConfirmation: true };
    }
    return { type: ACTION_TYPES.PENDING_NDRS, confidence: 0.90, params: {}, requiresConfirmation: false };
  }

  // Manage client
  if (includesAny(msg, ['create client', 'add client', 'new client', 'update client', 'client details'])) {
    return {
      type: ACTION_TYPES.MANAGE_CLIENT,
      confidence: 0.75,
      params: { clientCode, name: extractField(msg, 'name'), phone: extractField(msg, 'phone') },
      requiresConfirmation: true,
    };
  }

  // Reconciliation
  if (includesAny(msg, ['reconcile', 'reconciliation', 'compare charges'])) {
    return { type: ACTION_TYPES.RECONCILE, confidence: 0.80, params: { dateFrom: date }, requiresConfirmation: false };
  }

  // Daily report
  if (includesAny(msg, ['daily report', 'today report', 'day summary', 'operations report', 'daily summary'])) {
    return { type: ACTION_TYPES.DAILY_REPORT, confidence: 0.90, params: { date: date || new Date().toISOString().slice(0, 10) }, requiresConfirmation: false };
  }

  // Track shipment
  if (awb && includesAny(msg, ['track', 'status', 'where', 'movement', 'scan'])) {
    return { type: ACTION_TYPES.TRACK_SHIPMENT, confidence: 0.95, params: { awb }, requiresConfirmation: false };
  }

  // Lookup shipment
  if (awb) {
    return { type: ACTION_TYPES.LOOKUP_SHIPMENT, confidence: 0.90, params: { awb }, requiresConfirmation: false };
  }

  // Search shipments
  if (includesAny(msg, ['search', 'find shipment', 'find order', 'look up'])) {
    return { type: ACTION_TYPES.SEARCH_SHIPMENTS, confidence: 0.75, params: { query: msg }, requiresConfirmation: false };
  }

  // Wallet status
  if (includesAny(msg, ['wallet', 'balance', 'negative wallet', 'wallet issue'])) {
    return { type: ACTION_TYPES.WALLET_STATUS, confidence: 0.90, params: {}, requiresConfirmation: false };
  }

  // Courier performance
  if (includesAny(msg, ['courier performance', 'courier stats', 'which courier', 'courier comparison'])) {
    return { type: ACTION_TYPES.COURIER_PERFORMANCE, confidence: 0.90, params: {}, requiresConfirmation: false };
  }

  // Client analytics
  if (includesAny(msg, ['client analytics', 'client revenue', 'top client', 'client summary'])) {
    return { type: ACTION_TYPES.CLIENT_ANALYTICS, confidence: 0.85, params: { clientCode }, requiresConfirmation: false };
  }

  // System overview (fallback to useful info)
  if (includesAny(msg, ['overview', 'dashboard', 'summary', 'status', 'how are things', 'what\'s happening'])) {
    return { type: ACTION_TYPES.SYSTEM_OVERVIEW, confidence: 0.90, params: {}, requiresConfirmation: false };
  }

  return null;
}

// ── Action Resolver ─────────────────────────────────────────────────────────

async function resolveAction(action) {
  if (!action || !action.type) return null;

  try {
    switch (action.type) {
      case ACTION_TYPES.SYSTEM_OVERVIEW: {
        const snap = await getSnapshot();
        return { snapshot: snap };
      }

      case ACTION_TYPES.PENDING_NDRS: {
        const ndrs = await prisma.shipment.findMany({
          where: { status: 'NDR', ndrStatus: 'Action Required' },
          select: { awb: true, clientCode: true, amount: true, destination: true, consignee: true, date: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
        });
        return { items: ndrs, total: ndrs.length };
      }

      case ACTION_TYPES.WALLET_STATUS: {
        const negativeWallets = await prisma.client.findMany({
          where: { walletBalance: { lt: 0 }, active: true },
          select: { code: true, company: true, walletBalance: true },
          orderBy: { walletBalance: 'asc' },
          take: 15,
        });
        const totalNegative = negativeWallets.reduce((s, c) => s + c.walletBalance, 0);
        return { negativeBalances: negativeWallets, totalNegative, count: negativeWallets.length };
      }

      case ACTION_TYPES.COURIER_PERFORMANCE: {
        const performance = await prisma.shipment.groupBy({
          by: ['courier', 'status'],
          _count: { id: true },
          where: { courier: { not: null } },
        });
        // Group by courier
        const byCourier = {};
        for (const row of performance) {
          const c = row.courier || 'Unknown';
          if (!byCourier[c]) byCourier[c] = { total: 0, delivered: 0, ndr: 0, inTransit: 0 };
          byCourier[c].total += row._count.id;
          if (row.status === 'Delivered') byCourier[c].delivered += row._count.id;
          if (row.status === 'NDR') byCourier[c].ndr += row._count.id;
          if (row.status === 'InTransit') byCourier[c].inTransit += row._count.id;
        }
        return { byCourier };
      }

      case ACTION_TYPES.TRACK_SHIPMENT: {
        const awb = action.params?.awb;
        if (!awb) return { error: 'No AWB provided' };
        const shipment = await prisma.shipment.findFirst({
          where: { awb: { contains: awb, mode: 'insensitive' } },
          select: { awb: true, courier: true, status: true, consignee: true, destination: true, date: true, weight: true, clientCode: true, amount: true },
        });
        const courier = shipment?.courier || 'Trackon';
        try {
          const tracking = await fetchTracking(courier, awb, { bypassCache: true });
          // Learn from this tracking
          if (shipment) {
            await recordDecision('courier_preference', `destination:${(shipment.destination || '').toUpperCase()}`, courier);
          }
          return {
            shipment: shipment || { awb },
            tracking: {
              status: tracking.status,
              currentLocation: tracking.events?.[0]?.location || 'Unknown',
              lastUpdate: tracking.events?.[0]?.description || '',
              events: (tracking.events || []).slice(0, 8).map((e) => ({
                status: e.status, location: e.location, description: e.description, timestamp: e.timestamp,
              })),
            },
          };
        } catch (err) {
          return { shipment, tracking: null, error: `Tracking failed: ${err.message}` };
        }
      }

      case ACTION_TYPES.LOOKUP_SHIPMENT: {
        const awb = action.params?.awb;
        if (!awb) return { error: 'No AWB provided' };
        const found = await prisma.shipment.findFirst({
          where: { awb: { contains: awb, mode: 'insensitive' } },
          select: { awb: true, courier: true, status: true, consignee: true, destination: true, date: true, weight: true, amount: true, clientCode: true, pincode: true, phone: true, remarks: true },
        });
        if (!found) return { error: `No shipment found with AWB ${awb}` };
        return { shipment: found };
      }

      case ACTION_TYPES.DAILY_REPORT: {
        const date = action.params?.date || new Date().toISOString().slice(0, 10);
        const [shipments, byCourier, byClient, revenue] = await Promise.all([
          prisma.shipment.count({ where: { date } }),
          prisma.shipment.groupBy({ by: ['courier'], _count: { id: true }, where: { date, courier: { not: null } } }),
          prisma.shipment.groupBy({ by: ['clientCode'], _count: { id: true }, _sum: { amount: true }, where: { date } }),
          prisma.shipment.aggregate({ where: { date }, _sum: { amount: true } }),
        ]);
        return {
          date,
          totalShipments: shipments,
          totalRevenue: revenue._sum?.amount || 0,
          byCourier: byCourier.map((r) => ({ courier: r.courier, count: r._count.id })),
          byClient: byClient.map((r) => ({ client: r.clientCode, count: r._count.id, revenue: r._sum?.amount || 0 })).sort((a, b) => b.count - a.count),
        };
      }

      case ACTION_TYPES.CREATE_SHIPMENT:
      case ACTION_TYPES.BACKLOG_ENTRY: {
        // Just prepare — actual creation requires owner confirmation
        const params = action.params || {};
        const missing = [];
        if (!params.date) missing.push('date');
        if (!params.clientCode) missing.push('clientCode');
        if (!params.awb) missing.push('AWB');
        if (!params.destination) missing.push('destination');

        // Check learned courier preference for this destination
        let suggestedCourier = params.courier;
        if (!suggestedCourier && params.destination) {
          const memories = await recallDecision('courier_preference', `destination:${params.destination.toUpperCase()}`);
          if (memories.length > 0) {
            suggestedCourier = memories[0].decision;
          }
        }

        return {
          prepared: true,
          missing,
          data: { ...params, courier: suggestedCourier || params.courier },
          suggestedCourier,
          courierFromMemory: !!suggestedCourier && !params.courier,
          requiresConfirmation: true,
        };
      }

      case ACTION_TYPES.GENERATE_INVOICE: {
        const { clientCode, dateFrom, dateTo } = action.params || {};
        if (!clientCode) return { error: 'Need a client code to generate invoice' };
        const shipmentCount = await prisma.shipment.count({
          where: {
            clientCode,
            ...(dateFrom || dateTo ? { date: { ...(dateFrom ? { gte: dateFrom } : {}), ...(dateTo ? { lte: dateTo } : {}) } } : {}),
          },
        });
        return { clientCode, dateFrom, dateTo, shipmentCount, requiresConfirmation: true };
      }

      case ACTION_TYPES.SEND_NOTIFICATION: {
        const { clientCode, date, awb } = action.params || {};
        if (awb) {
          const shipment = await prisma.shipment.findFirst({
            where: { awb: { contains: awb, mode: 'insensitive' } },
            select: { awb: true, status: true, clientCode: true, consignee: true },
          });
          return { mode: 'single', shipment, requiresConfirmation: true };
        }
        if (clientCode && date) {
          const count = await prisma.shipment.count({ where: { clientCode, date } });
          return { mode: 'digest', clientCode, date, shipmentCount: count, requiresConfirmation: true };
        }
        return { error: 'Need client code + date, or AWB to send notification' };
      }

      case ACTION_TYPES.CLIENT_ANALYTICS: {
        const code = action.params?.clientCode;
        if (!code) {
          const topClients = await prisma.shipment.groupBy({
            by: ['clientCode'],
            _count: { id: true },
            _sum: { amount: true },
            orderBy: { _count: { id: 'desc' } },
            take: 10,
          });
          return { mode: 'top', clients: topClients.map((c) => ({ code: c.clientCode, shipments: c._count.id, revenue: c._sum?.amount || 0 })) };
        }
        const [count, revenue, recent] = await Promise.all([
          prisma.shipment.count({ where: { clientCode: code } }),
          prisma.shipment.aggregate({ where: { clientCode: code }, _sum: { amount: true } }),
          prisma.shipment.findMany({ where: { clientCode: code }, orderBy: { createdAt: 'desc' }, take: 5, select: { awb: true, date: true, status: true, destination: true, amount: true } }),
        ]);
        return { clientCode: code, totalShipments: count, totalRevenue: revenue._sum?.amount || 0, recentShipments: recent };
      }

      case ACTION_TYPES.RATE_DECISION: {
        const { destination, weight, courier } = action.params || {};
        // Check learned preferences
        const memories = destination
          ? await recallDecision('courier_preference', `destination:${destination}`)
          : [];
        return {
          destination, weight, courier,
          learnedPreferences: memories.map((m) => ({ courier: m.decision, usedTimes: m.frequency })),
          note: 'Use the Rate Calculator page for exact rate comparison. I can suggest based on past patterns.',
        };
      }

      default:
        return null;
    }
  } catch (err) {
    logger.error(`[HawkAI] Action resolve failed: ${err.message}`);
    return { error: err.message };
  }
}

// ── Reply Builder ───────────────────────────────────────────────────────────

function buildReply(intent, data, snapshot) {
  if (!intent) {
    return {
      reply: `I'm **HawkAI**, your enterprise logistics agent. I can manage shipments, generate invoices, audit courier bills, send client notifications, resolve NDRs, and more — all from this chat.\n\n📊 **Live Status**: ${snapshot.activeShipments} active shipments, ${snapshot.pendingNDRs} pending NDRs, ${snapshot.todayBookings} bookings today.\n\nTry: *"enter shipment for April 18, client ABC, AWB X123, to Mumbai, 2kg via Trackon"* or *"show daily report"*`,
      suggestions: ['Show daily report', 'Pending NDRs', 'Wallet status', 'Courier performance'],
    };
  }

  if (!data) {
    return { reply: 'Processing your request...', suggestions: [] };
  }

  if (data.error) {
    return { reply: `⚠️ ${data.error}`, suggestions: ['Try again', 'Show overview'] };
  }

  switch (intent.type) {
    case ACTION_TYPES.SYSTEM_OVERVIEW: {
      const s = data.snapshot || {};
      return {
        reply: `## 📊 System Overview\n\n| Metric | Value |\n|---|---|\n| Active Shipments | **${s.activeShipments}** |\n| Today's Bookings | **${s.todayBookings}** |\n| Today's Revenue | **${s.todayRevenue}** |\n| Pending NDRs | **${s.pendingNDRs}** |\n| Negative Wallets | **${s.negativeWallets}** |`,
        suggestions: ['Daily report', 'Pending NDRs', 'Courier performance', 'Top clients'],
      };
    }

    case ACTION_TYPES.PENDING_NDRS: {
      if (!data.items?.length) return { reply: '✅ No pending NDRs requiring action.', suggestions: ['Show overview'] };
      const lines = data.items.slice(0, 5).map((n) => `• **${n.awb}** → ${n.destination || '?'} (${n.clientCode})`).join('\n');
      return {
        reply: `## ⚠️ ${data.total} Pending NDRs\n\n${lines}${data.total > 5 ? `\n\n_...and ${data.total - 5} more_` : ''}`,
        suggestions: data.items.slice(0, 3).map((n) => `Track ${n.awb}`),
      };
    }

    case ACTION_TYPES.WALLET_STATUS: {
      if (!data.negativeBalances?.length) return { reply: '✅ All client wallets are healthy.', suggestions: ['Show overview'] };
      const lines = data.negativeBalances.slice(0, 5).map((c) => `• **${c.company || c.code}**: ${formatCurrency(c.walletBalance)}`).join('\n');
      return {
        reply: `## 💰 ${data.count} Clients with Negative Balance\n\nTotal exposure: **${formatCurrency(data.totalNegative)}**\n\n${lines}`,
        suggestions: ['Show overview', 'Client analytics'],
      };
    }

    case ACTION_TYPES.COURIER_PERFORMANCE: {
      const entries = Object.entries(data.byCourier || {}).sort((a, b) => b[1].total - a[1].total);
      if (!entries.length) return { reply: 'No courier data available yet.', suggestions: ['Show overview'] };
      const lines = entries.map(([c, s]) => `| ${c} | ${s.total} | ${s.delivered} | ${s.ndr} | ${s.total > 0 ? Math.round(s.delivered / s.total * 100) : 0}% |`).join('\n');
      return {
        reply: `## 🚚 Courier Performance\n\n| Courier | Total | Delivered | NDR | Delivery % |\n|---|---|---|---|---|\n${lines}`,
        suggestions: entries.slice(0, 3).map(([c]) => `${c} details`),
      };
    }

    case ACTION_TYPES.TRACK_SHIPMENT: {
      const s = data.shipment || {};
      const t = data.tracking || {};
      const events = (t.events || []).slice(0, 4).map((e) => `• **${e.status}** at ${e.location} — ${e.description || ''}`).join('\n');
      return {
        reply: `## 📦 Tracking: ${s.awb || intent.params?.awb}\n\n**Status**: ${t.status || s.status || 'Unknown'}\n**Location**: ${t.currentLocation || 'Unknown'}\n**Courier**: ${s.courier || 'Unknown'} | **Destination**: ${s.destination || 'Unknown'}\n\n### Recent Events\n${events || '_No tracking events available_'}`,
        suggestions: ['Show overview', `Lookup ${s.awb || ''}`],
      };
    }

    case ACTION_TYPES.LOOKUP_SHIPMENT: {
      const s = data.shipment || {};
      return {
        reply: `## 📋 Shipment: ${s.awb}\n\n| Field | Value |\n|---|---|\n| Status | **${s.status}** |\n| Client | ${s.clientCode} |\n| Date | ${s.date} |\n| Courier | ${s.courier || 'N/A'} |\n| Consignee | ${s.consignee || 'N/A'} |\n| Destination | ${s.destination || 'N/A'} |\n| Weight | ${s.weight || 0} kg |\n| Amount | ${formatCurrency(s.amount)} |\n| Phone | ${s.phone || 'N/A'} |`,
        suggestions: [`Track ${s.awb}`, 'Show overview'],
      };
    }

    case ACTION_TYPES.DAILY_REPORT: {
      const d = data;
      const courierLines = (d.byCourier || []).map((c) => `• ${c.courier}: ${c.count}`).join('\n');
      const clientLines = (d.byClient || []).slice(0, 5).map((c) => `• ${c.client}: ${c.count} shipments (${formatCurrency(c.revenue)})`).join('\n');
      return {
        reply: `## 📅 Daily Report — ${d.date}\n\n**Total Shipments**: ${d.totalShipments}\n**Total Revenue**: ${formatCurrency(d.totalRevenue)}\n\n### By Courier\n${courierLines || '_No data_'}\n\n### Top Clients\n${clientLines || '_No data_'}`,
        suggestions: ['Show overview', 'Courier performance'],
      };
    }

    case ACTION_TYPES.CREATE_SHIPMENT:
    case ACTION_TYPES.BACKLOG_ENTRY: {
      if (data.missing?.length) {
        return {
          reply: `I need more details to create this shipment. Missing: **${data.missing.join(', ')}**.\n\nPlease provide: *"date: 2026-04-18, client: ABC, AWB: X123, destination: Mumbai, weight: 2kg, courier: DTDC"*`,
          suggestions: [],
          requiresInput: true,
        };
      }
      const s = data.data || {};
      return {
        reply: `## ✏️ Ready to Create Shipment\n\n| Field | Value |\n|---|---|\n| Date | ${s.date} |\n| Client | ${s.clientCode} |\n| AWB | ${s.awb} |\n| Destination | ${s.destination || 'N/A'} |\n| Weight | ${s.weight || 'N/A'} kg |\n| Courier | ${s.courier || 'N/A'} ${data.courierFromMemory ? '_(learned from past)_' : ''} |\n\n⚡ **Confirm to create this shipment.**`,
        suggestions: ['Confirm', 'Cancel'],
        requiresConfirmation: true,
        actionData: data.data,
      };
    }

    case ACTION_TYPES.GENERATE_INVOICE: {
      return {
        reply: `## 🧾 Invoice Preparation\n\nClient: **${data.clientCode}**\nPeriod: ${data.dateFrom || 'All'} → ${data.dateTo || 'Now'}\nShipments: **${data.shipmentCount}**\n\n⚡ **Confirm to generate the invoice.**`,
        suggestions: ['Confirm', 'Cancel'],
        requiresConfirmation: true,
      };
    }

    case ACTION_TYPES.SEND_NOTIFICATION: {
      if (data.mode === 'single') {
        const s = data.shipment || {};
        return {
          reply: `## 📧 Send Notification\n\nAWB: **${s.awb}** | Status: **${s.status}** | Client: **${s.clientCode}**\nConsignee: ${s.consignee || 'N/A'}\n\n⚡ **Confirm to send update notification.**`,
          suggestions: ['Confirm', 'Cancel'],
          requiresConfirmation: true,
        };
      }
      return {
        reply: `## 📧 Daily Digest\n\nClient: **${data.clientCode}** | Date: **${data.date}**\nShipments: **${data.shipmentCount}**\n\n⚡ **Confirm to send digest email.**`,
        suggestions: ['Confirm', 'Cancel'],
        requiresConfirmation: true,
      };
    }

    case ACTION_TYPES.CLIENT_ANALYTICS: {
      if (data.mode === 'top') {
        const lines = (data.clients || []).map((c) => `| ${c.code} | ${c.shipments} | ${formatCurrency(c.revenue)} |`).join('\n');
        return {
          reply: `## 👥 Top Clients\n\n| Code | Shipments | Revenue |\n|---|---|---|\n${lines}`,
          suggestions: data.clients?.slice(0, 3).map((c) => `Client ${c.code} details`) || [],
        };
      }
      const recent = (data.recentShipments || []).map((s) => `• ${s.awb} → ${s.destination} (${s.status})`).join('\n');
      return {
        reply: `## 👤 Client: ${data.clientCode}\n\nTotal Shipments: **${data.totalShipments}**\nTotal Revenue: **${formatCurrency(data.totalRevenue)}**\n\n### Recent Shipments\n${recent}`,
        suggestions: [`${data.clientCode} wallet`, 'Show overview'],
      };
    }

    case ACTION_TYPES.RATE_DECISION: {
      const prefs = (data.learnedPreferences || []).map((p) => `• **${p.courier}** — used ${p.usedTimes} times`).join('\n');
      return {
        reply: `## 💡 Rate Suggestion\n\nDestination: **${data.destination || 'Not specified'}**\nWeight: **${data.weight || 'Not specified'}** kg\n\n${prefs ? `### Your Past Preferences\n${prefs}\n` : ''}${data.note}`,
        suggestions: ['Show rate calculator'],
      };
    }

    default:
      return { reply: 'Action completed.', suggestions: ['Show overview'] };
  }
}

// ── Main Chat Handler ───────────────────────────────────────────────────────

async function chat({ message, history = [] }) {
  const snapshot = await getSnapshot();
  const intent = detectIntent(message, history);
  const log = intent ? await logAction(intent.type, intent.params || {}, intent.confidence) : null;

  let data = null;
  if (intent) {
    data = await resolveAction(intent);
    if (log) await completeAction(log.id, data, data?.error ? 'FAILED' : 'DONE');
  }

  const response = buildReply(intent, data, snapshot);

  return {
    reply: response.reply,
    action: intent,
    data,
    suggestions: response.suggestions || [],
    requiresConfirmation: response.requiresConfirmation || false,
    actionData: response.actionData || null,
    snapshot,
  };
}

// ── Execute Confirmed Action ────────────────────────────────────────────────

async function executeConfirmedAction(action, params = {}) {
  const log = await logAction(action.type || action, params, 1.0);

  try {
    switch (action.type || action) {
      case ACTION_TYPES.CREATE_SHIPMENT:
      case ACTION_TYPES.BACKLOG_ENTRY: {
        const shipmentData = {
          date: params.date || new Date().toISOString().slice(0, 10),
          clientCode: params.clientCode,
          awb: params.awb,
          consignee: params.consignee || '',
          destination: params.destination || '',
          weight: parseFloat(params.weight) || 0,
          courier: params.courier || '',
          status: 'Booked',
          service: params.service || 'Standard',
        };

        const created = await prisma.shipment.create({ data: shipmentData });

        // Learn from this decision
        if (shipmentData.courier && shipmentData.destination) {
          await recordDecision('courier_preference', `destination:${shipmentData.destination.toUpperCase()}`, shipmentData.courier);
        }
        if (shipmentData.clientCode) {
          await recordDecision('client_preference', `client:${shipmentData.clientCode}`, `courier:${shipmentData.courier || 'any'}`);
        }

        if (log) await completeAction(log.id, { shipmentId: created.id }, 'DONE');
        return { success: true, shipment: created, message: `Shipment ${created.awb} created successfully for ${shipmentData.date}` };
      }

      case ACTION_TYPES.SEND_NOTIFICATION: {
        const notifEngine = require('./notificationEngine.service');
        if (params.awb) {
          const result = await notifEngine.sendShipmentUpdate(params.awb);
          if (log) await completeAction(log.id, result, 'DONE');
          return { success: true, ...result };
        }
        if (params.clientCode && params.date) {
          const result = await notifEngine.sendDailyDigest(params.clientCode, params.date);
          if (log) await completeAction(log.id, result, 'DONE');
          return { success: true, ...result };
        }
        return { error: 'Need AWB or clientCode+date for notification' };
      }

      default:
        if (log) await completeAction(log.id, { error: 'Action type not executable yet' }, 'FAILED');
        return { error: `Action type "${action.type || action}" is not yet executable. Use the portal for this.` };
    }
  } catch (err) {
    if (log) await completeAction(log.id, { error: err.message }, 'FAILED');
    return { error: err.message };
  }
}

// ── Teach / Manual Memory ───────────────────────────────────────────────────

async function teach({ category, contextKey, decision, metadata }) {
  await recordDecision(category, contextKey, decision, metadata);
  return { success: true, message: `Learned: when ${contextKey}, prefer ${decision}` };
}

module.exports = {
  chat,
  resolveAction,
  executeConfirmedAction,
  getMemorySummary,
  getActionHistory,
  teach,
  getSnapshot,
  ACTION_TYPES,
};
