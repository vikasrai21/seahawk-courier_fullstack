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
const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

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

const nlp = require('../utils/agentNlp');
nlp.initNlp().catch(err => logger.error(`[HawkAI] Failed to init NLP: ${err.message}`));

// ── Intent Detection (NLP Based) ────────────────────────────────────────────

async function detectIntent(message, history = []) {
  const nlpResult = await nlp.processMessage(message);
  
  if (!nlpResult.intent || nlpResult.intent === 'None') return null;

  // Extract entities from NLP or fallback to history memory
  let { date, clientCode, awb, courier, weight, destination, dateRelative } = nlpResult.entities;
  
  // Basic Context/Memory matching (if entity is missing, check recent history)
  if (!awb && history.length > 0) {
     const lastMsg = history[history.length - 1]?.content || '';
     const match = String(lastMsg).toUpperCase().match(/[A-Z0-9]{6,16}/);
     if (match) awb = match[0];
  }

  // Resolve relative dates
  if (dateRelative && !date) {
     const d = new Date();
     if (dateRelative === 'yesterday') d.setDate(d.getDate() - 1);
     if (dateRelative === 'tomorrow') d.setDate(d.getDate() + 1);
     date = d.toISOString().slice(0, 10);
  }

  const baseParams = { date, clientCode, awb, courier, weight: weight ? parseFloat(weight) : null, destination };

  // Map NLP Intents to ACTION_TYPES
  switch(nlpResult.intent) {
    case 'intent.shipment.create':
      return { type: ACTION_TYPES.CREATE_SHIPMENT, confidence: nlpResult.confidence, params: baseParams, requiresConfirmation: true };
    
    case 'intent.shipment.track':
      return { type: ACTION_TYPES.TRACK_SHIPMENT, confidence: nlpResult.confidence, params: { awb }, requiresConfirmation: false };

    case 'intent.invoice.generate':
      return { type: ACTION_TYPES.GENERATE_INVOICE, confidence: nlpResult.confidence, params: { clientCode }, requiresConfirmation: true };

    case 'intent.notification.digest':
      return { type: ACTION_TYPES.SEND_NOTIFICATION, confidence: nlpResult.confidence, params: { clientCode, date }, requiresConfirmation: true };
      
    case 'intent.notification.single':
      return { type: ACTION_TYPES.SEND_NOTIFICATION, confidence: nlpResult.confidence, params: { awb }, requiresConfirmation: true };

    case 'intent.report.client_monthly':
      return { type: ACTION_TYPES.CLIENT_ANALYTICS, confidence: nlpResult.confidence, params: { clientCode }, requiresConfirmation: false };

    case 'intent.report.daily_overview':
      return { type: ACTION_TYPES.DAILY_REPORT, confidence: nlpResult.confidence, params: { date: date || new Date().toISOString().slice(0, 10) }, requiresConfirmation: false };

    case 'intent.system.wallets':
      return { type: ACTION_TYPES.WALLET_STATUS, confidence: nlpResult.confidence, params: {}, requiresConfirmation: false };

    case 'intent.system.overview':
      return { type: ACTION_TYPES.SYSTEM_OVERVIEW, confidence: nlpResult.confidence, params: {}, requiresConfirmation: false };

    case 'intent.system.ndrs':
      return { type: ACTION_TYPES.PENDING_NDRS, confidence: nlpResult.confidence, params: {}, requiresConfirmation: false };

    case 'intent.client.manage':
      return { type: ACTION_TYPES.MANAGE_CLIENT, confidence: nlpResult.confidence, params: { clientCode }, requiresConfirmation: true };

    case 'intent.audit.reconcile':
      return { type: ACTION_TYPES.RECONCILE, confidence: nlpResult.confidence, params: { dateFrom: date }, requiresConfirmation: false };

    case 'intent.audit.bill':
      return { type: ACTION_TYPES.AUDIT_BILL, confidence: nlpResult.confidence, params: { courier }, requiresConfirmation: true };

    default:
      return null;
  }
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

// ── Main Chat Handler (Flow-Aware) ──────────────────────────────────────────

const flowRegistry     = require('../utils/agentFlows');
const sessionManager   = require('../utils/agentSession');

// Map NLP intents to Flow IDs
const INTENT_TO_FLOW = {
  // Client
  'intent.client.create':       'CREATE_CLIENT',
  'intent.client.update':       'UPDATE_CLIENT',
  'intent.client.deactivate':   'DEACTIVATE_CLIENT',
  'intent.client.stats':        'CLIENT_STATS',
  'intent.client.list':         'LIST_CLIENTS',
  // Shipment
  'intent.shipment.create':     'CREATE_SHIPMENT',
  'intent.shipment.track':      'TRACK_SHIPMENT',
  'intent.shipment.status':     'UPDATE_SHIPMENT_STATUS',
  'intent.shipment.delete':     'DELETE_SHIPMENT',
  'intent.shipment.search':     'SEARCH_SHIPMENTS',
  'intent.shipment.monthly':    'MONTHLY_STATS',
  // Invoice
  'intent.invoice.generate':    'GENERATE_INVOICE',
  'intent.invoice.list':        'LIST_INVOICES',
  'intent.invoice.paid':        'MARK_INVOICE_PAID',
  // Wallet
  'intent.wallet.credit':       'WALLET_CREDIT',
  'intent.wallet.balance':      'WALLET_BALANCE',
  'intent.wallet.debit':        'WALLET_DEBIT',
  'intent.wallet.adjust':       'WALLET_ADJUST',
  'intent.wallet.history':      'WALLET_HISTORY',
  'intent.wallet.negative':     'NEGATIVE_WALLETS',
  // Contracts
  'intent.contract.create':     'CREATE_CONTRACT',
  'intent.contract.list':       'LIST_CONTRACTS',
  'intent.contract.rate':       'CALCULATE_RATE',
  // Notifications
  'intent.notification.digest': 'SEND_DAILY_DIGEST',
  'intent.notification.pod':    'SEND_POD',
  // NDR
  'intent.ndr.list':            'LIST_NDRS',
  'intent.ndr.resolve':         'RESOLVE_NDR',
  // Returns
  'intent.return.list':         'LIST_RETURNS',
  'intent.return.approve':      'APPROVE_RETURN',
  'intent.return.reject':       'REJECT_RETURN',
  'intent.return.stats':        'RETURN_STATS',
  // Drafts
  'intent.draft.create':        'CREATE_DRAFT',
  'intent.draft.list':          'LIST_DRAFTS',
  // Pickups
  'intent.pickup.create':       'CREATE_PICKUP',
  'intent.pickup.list':         'LIST_PICKUPS',
  // Quotes
  'intent.quote.create':        'CREATE_QUOTE',
  'intent.quote.list':          'LIST_QUOTES',
  'intent.quote.stats':         'QUOTE_STATS',
  // Reconciliation
  'intent.recon.stats':         'RECON_STATS',
  'intent.recon.disputes':      'LIST_DISPUTES',
  // System
  'intent.system.overview':     'SYSTEM_OVERVIEW',
  'intent.system.courier_perf': 'COURIER_PERFORMANCE',
  'intent.report.daily':        'DAILY_REPORT',
};

// Legacy intents kept only for edge-case backward compat (almost empty now)
const LEGACY_INTENTS = [
  'intent.audit.bill',
];

async function chat({ message, history = [], sessionId = 'default' }) {
  const snapshot = await getSnapshot();
  const msg = String(message || '').trim();
  const lowerMsg = msg.toLowerCase();

  // ── Step 0: Handle "cancel" at any time ─────────────────────────────────
  if (/^(cancel|stop|nevermind|abort|exit)$/i.test(msg)) {
    sessionManager.clearSession(sessionId);
    return {
      reply: '🚫 Cancelled. What else can I do for you?',
      suggestions: ['Show overview', 'Create client', 'Daily report'],
      requiresConfirmation: false,
      snapshot,
    };
  }

  // ── Step 1: Check for ACTIVE FLOW session ───────────────────────────────
  const session = sessionManager.getSession(sessionId);

  if (session) {
    const flow = flowRegistry.getFlow(session.flowId);
    if (!flow) {
      sessionManager.clearSession(sessionId);
    } else {
      // ── 1a: Awaiting confirmation? ────────────────────────────────────
      if (session.awaitingConfirmation) {
        if (/^(yes|confirm|ok|do it|go|sure|yeah|yep|y)$/i.test(msg)) {
          // EXECUTE!
          sessionManager.clearSession(sessionId);
          try {
            const result = await flow.executor(session.collectedParams);
            return {
              reply: result.message,
              suggestions: ['Show overview', 'Create another'],
              requiresConfirmation: false,
              snapshot,
            };
          } catch (err) {
            return {
              reply: `❌ Execution failed: ${err.message}`,
              suggestions: ['Try again', 'Show overview'],
              requiresConfirmation: false,
              snapshot,
            };
          }
        } else {
          sessionManager.clearSession(sessionId);
          return {
            reply: '🚫 Cancelled.',
            suggestions: ['Show overview'],
            requiresConfirmation: false,
            snapshot,
          };
        }
      }

      // ── 1b: Collecting a field answer ─────────────────────────────────
      if (session.pendingField) {
        const allFields = [...flow.requiredFields, ...(flow.optionalFields || [])];
        const fieldDef = allFields.find(f => f.key === session.pendingField);

        // Handle "skip" for optional fields
        const isOptional = (flow.optionalFields || []).some(f => f.key === session.pendingField);
        if (isOptional && /^(skip|no|none|na|n\/a)$/i.test(msg)) {
          // Skip this optional field — mark as visited with null
          session.collectedParams[session.pendingField] = null;
        } else if (fieldDef && fieldDef.validate && !fieldDef.validate(msg)) {
          // Validation failed — ask again
          return {
            reply: `⚠️ That doesn't look right. ${fieldDef.prompt}`,
            suggestions: isOptional ? ['Skip'] : [],
            requiresConfirmation: false,
            snapshot,
          };
        } else {
          // Store the answer
          session.collectedParams[session.pendingField] = msg;
        }
        session.pendingField = null;
        sessionManager.updateSession(sessionId, session);
      }

      // ── 1c: Find next missing field ───────────────────────────────────
      const nextRequired = flow.requiredFields.find(f => !session.collectedParams[f.key]);
      if (nextRequired) {
        sessionManager.updateSession(sessionId, { pendingField: nextRequired.key });
        return {
          reply: nextRequired.prompt,
          suggestions: [],
          requiresConfirmation: false,
          snapshot,
        };
      }

      const nextOptional = (flow.optionalFields || []).find(f => !session.collectedParams.hasOwnProperty(f.key));
      if (nextOptional) {
        sessionManager.updateSession(sessionId, { pendingField: nextOptional.key });
        return {
          reply: nextOptional.prompt,
          suggestions: ['Skip'],
          requiresConfirmation: false,
          snapshot,
        };
      }

      // ── 1d: All fields collected! ─────────────────────────────────────
      if (flow.confirmBeforeExecute) {
        sessionManager.updateSession(sessionId, { awaitingConfirmation: true });
        const summary = flow.formatSummary ? flow.formatSummary(session.collectedParams) : '📋 Ready to execute.';
        return {
          reply: `${summary}\n\n⚡ **Confirm?** Type **yes** to proceed or **cancel** to abort.`,
          suggestions: ['Yes', 'Cancel'],
          requiresConfirmation: true,
          snapshot,
        };
      }

      // No confirmation needed — just execute
      sessionManager.clearSession(sessionId);
      try {
        const result = await flow.executor(session.collectedParams);
        return {
          reply: result.message,
          suggestions: ['Show overview'],
          requiresConfirmation: false,
          snapshot,
        };
      } catch (err) {
        return {
          reply: `❌ Error: ${err.message}`,
          suggestions: ['Show overview'],
          requiresConfirmation: false,
          snapshot,
        };
      }
    }
  }

  // ── Step 2: No active session — detect intent via NLP ───────────────────
  const nlpResult = await nlp.processMessage(message);

  if (!nlpResult.intent || nlpResult.intent === 'None' || nlpResult.confidence < 0.4) {
    nlpResult.intent = 'None';
  }

  // ── Step 2a: Check if it maps to a Flow ─────────────────────────────────
  const flowId = INTENT_TO_FLOW[nlpResult.intent];

  if (flowId) {
    const flow = flowRegistry.getFlow(flowId);
    if (flow) {
      // Pre-fill any entities the NLP already extracted from the message
      const prefilled = {};
      if (nlpResult.entities.clientCode) prefilled.clientCode = nlpResult.entities.clientCode;
      if (nlpResult.entities.awb) prefilled.awb = nlpResult.entities.awb;
      if (nlpResult.entities.date) prefilled.date = nlpResult.entities.date;
      if (nlpResult.entities.dateRelative) {
        const rel = nlpResult.entities.dateRelative.toLowerCase();
        const d = new Date();
        if (rel === 'yesterday') d.setDate(d.getDate() - 1);
        if (rel === 'tomorrow') d.setDate(d.getDate() + 1);
        prefilled.date = d.toISOString().slice(0, 10);
      }
      if (nlpResult.entities.amount) prefilled.amount = nlpResult.entities.amount;
      if (nlpResult.entities.courier) prefilled.courier = nlpResult.entities.courier;
      if (nlpResult.entities.weight) prefilled.weight = nlpResult.entities.weight;

      // Map some aliases
      if (prefilled.clientCode && !prefilled.code) prefilled.code = prefilled.clientCode;

      // If flow has NO required fields, just execute immediately
      if (!flow.requiredFields.length) {
        try {
          const result = await flow.executor(prefilled);
          return {
            reply: result.message,
            suggestions: ['Show overview'],
            requiresConfirmation: false,
            snapshot,
          };
        } catch (err) {
          return { reply: `❌ Error: ${err.message}`, suggestions: ['Show overview'], snapshot };
        }
      }

      // Start a session with prefilled data
      const newSession = sessionManager.startSession(sessionId, flowId);
      newSession.collectedParams = prefilled;

      // Find the first missing required field
      const firstMissing = flow.requiredFields.find(f => !newSession.collectedParams[f.key]);
      if (!firstMissing) {
        // All required already provided! Check optionals or go to confirm
        const nextOpt = (flow.optionalFields || []).find(f => !newSession.collectedParams.hasOwnProperty(f.key));
        if (nextOpt) {
          sessionManager.updateSession(sessionId, { pendingField: nextOpt.key });
          return { reply: `${flow.description}...\n\n${nextOpt.prompt}`, suggestions: ['Skip'], snapshot };
        }
        if (flow.confirmBeforeExecute) {
          sessionManager.updateSession(sessionId, { awaitingConfirmation: true });
          const summary = flow.formatSummary ? flow.formatSummary(newSession.collectedParams) : '📋 Ready.';
          return { reply: `${summary}\n\n⚡ **Confirm?**`, suggestions: ['Yes', 'Cancel'], requiresConfirmation: true, snapshot };
        }
        // Execute immediately
        sessionManager.clearSession(sessionId);
        try {
          const result = await flow.executor(newSession.collectedParams);
          return { reply: result.message, suggestions: ['Show overview'], snapshot };
        } catch (err) {
          return { reply: `❌ Error: ${err.message}`, suggestions: ['Show overview'], snapshot };
        }
      }

      sessionManager.updateSession(sessionId, { pendingField: firstMissing.key });
      return {
        reply: `Sure! Let's **${flow.description.toLowerCase()}**.\n\n${firstMissing.prompt}`,
        suggestions: [],
        requiresConfirmation: false,
        snapshot,
      };
    }
  }

  // ── Step 2b: Legacy intent handling (non-flow actions) ──────────────────
  if (LEGACY_INTENTS.includes(nlpResult.intent)) {
    // Map to old ACTION_TYPES and use resolveAction
    const legacyMapping = {
      'intent.client.list':       { type: ACTION_TYPES.SYSTEM_OVERVIEW, params: {} },
      'intent.client.stats':      { type: ACTION_TYPES.CLIENT_ANALYTICS, params: { clientCode: nlpResult.entities.clientCode } },
      'intent.client.analytics':  { type: ACTION_TYPES.CLIENT_ANALYTICS, params: { clientCode: nlpResult.entities.clientCode } },
      'intent.wallet.negative':   { type: ACTION_TYPES.WALLET_STATUS, params: {} },
      'intent.system.courier_perf': { type: ACTION_TYPES.COURIER_PERFORMANCE, params: {} },
      'intent.recon.stats':       { type: ACTION_TYPES.RECONCILE, params: {} },
      'intent.recon.disputes':    { type: ACTION_TYPES.RECONCILE, params: {} },
      'intent.audit.bill':        { type: ACTION_TYPES.AUDIT_BILL, params: {} },
    };

    const intent = legacyMapping[nlpResult.intent] || { type: ACTION_TYPES.SYSTEM_OVERVIEW, params: {} };
    intent.confidence = nlpResult.confidence;
    intent.requiresConfirmation = false;

    const data = await resolveAction(intent);
    const response = buildReply(intent, data, snapshot);

    return {
      reply: response.reply,
      action: intent,
      data,
      suggestions: response.suggestions || [],
      requiresConfirmation: response.requiresConfirmation || false,
      snapshot,
    };
  }

  // ── Hybrid LLM Fallback ──────────────────────────────────────────────────
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const prompt = `You are HawkAI, the internal Enterprise Owner Command Center Agent for Seahawk Logistics.
You communicate securely with the Owner of the company. Keep your answer brief, highly analytical, responsive, and professional. Use markdown formatting. Do not hallucinate shipments.

Current System Snapshot:
- Active Shipments: ${snapshot.activeShipments}
- Bookings Today: ${snapshot.todayBookings}
- Revenue Today: ${snapshot.todayRevenue}
- Pending NDRs: ${snapshot.pendingNDRs}
- Clients with Negative Wallets: ${snapshot.negativeWallets}

Conversation History (Latest):
${history.map(h => `${h.role}: ${h.text}`).join('\n')}

Owner Request: ${msg}`;

      const result = await model.generateContent(prompt);
      let text = result.response.text();
      
      return {
        reply: text,
        suggestions: ['Show overview', 'Daily report'],
        requiresConfirmation: false,
        snapshot,
      };
    } catch (err) {
      logger.warn(`[HawkAI] Gemini LLM fallback failed: ${err.message}`);
    }
  }

  // ── Native Fallback ─────────────────────────────────────────────────────
  return {
    reply: "🤔 I understood parts of that but couldn't map it to an action. Try being more specific, like: **create client ABC** or **track AWB 123456**.",
    suggestions: ['Show overview', 'Create client', 'Daily report'],
    requiresConfirmation: false,
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
