'use strict';

const prisma = require('../config/prisma');
const logger = require('../utils/logger');
const analyticsService = require('./analytics.service');
const { fetchTracking } = require('./carrier.service');

const ACTION_TYPES = new Set([
  'GET_PENDING_NDRS',
  'CHECK_COURIER_PERFORMANCE',
  'GET_WALLET_BALANCES',
  'TRACK_SHIPMENT',
  'LOOKUP_SHIPMENT',
  'GET_OVERVIEW',
]);

function extractAwb(text) {
  const matches = String(text || '').toUpperCase().match(/[A-Z0-9]{6,}/g) || [];
  return matches[0] || '';
}

function includesAny(text, words) {
  return words.some((word) => text.includes(word));
}

function recentHistoryText(history = []) {
  return (Array.isArray(history) ? history : [])
    .slice(-6)
    .map((item) => String(item?.content || item?.text || ''))
    .join(' ');
}

function findRecentAwb(history = []) {
  const joined = recentHistoryText(history);
  return extractAwb(joined);
}

function suggestionForAction(actionType) {
  switch (actionType) {
    case 'TRACK_SHIPMENT':
      return 'Next you can ask for the shipment lookup, NDR status, or courier performance.';
    case 'GET_PENDING_NDRS':
      return 'Next you can ask for the oldest NDR AWB or track one of those shipments live.';
    case 'GET_WALLET_BALANCES':
      return 'Next you can ask for a specific client code or compare today’s bookings.';
    case 'CHECK_COURIER_PERFORMANCE':
      return 'Next you can ask for delayed shipments or track a specific AWB from that courier.';
    case 'LOOKUP_SHIPMENT':
      return 'Next you can ask to track the AWB live for the latest courier scan.';
    default:
      return 'Try: track an AWB, show pending NDRs, negative wallets, or courier performance.';
  }
}

async function getSnapshot() {
  const [activeShipments, pendingNDRs, overview] = await Promise.all([
    prisma.shipment.count({
      where: {
        status: { notIn: ['Delivered', 'RTO Delivered', 'Cancelled'] },
      },
    }),
    prisma.shipment.count({
      where: {
        status: 'NDR',
        ndrStatus: 'Action Required',
      },
    }),
    analyticsService.getOverview(),
  ]).catch((err) => {
    logger.warn(`Failed to fetch analytics for SkyAI: ${err.message}`);
    return [0, 0, {}];
  });

  const todayBookings = overview?.stats?.find((s) => s.title === "Today's Bookings")?.value || 0;
  const todayRevenue = overview?.stats?.find((s) => s.title === "Today's Revenue")?.value || '₹0';

  return {
    activeShipments,
    pendingNDRs,
    todayBookings,
    todayRevenue,
  };
}

function detectAction(message, history = []) {
  const raw = String(message || '').trim();
  const msg = raw.toLowerCase();
  const explicitAwb = extractAwb(raw);
  const rememberedAwb = findRecentAwb(history);
  const awb = explicitAwb || (includesAny(msg, ['this', 'it', 'same awb', 'same shipment', 'this one', 'that one']) ? rememberedAwb : '');

  if (awb && includesAny(msg, ['track', 'status', 'where', 'movement', 'scan'])) {
    return { type: 'TRACK_SHIPMENT', requiresData: true, params: { awb } };
  }
  if (awb) {
    return { type: 'LOOKUP_SHIPMENT', requiresData: true, params: { awb } };
  }
  if (includesAny(msg, ['pending ndr', 'ndr', 'undelivered response'])) {
    return { type: 'GET_PENDING_NDRS', requiresData: true, params: null };
  }
  if (includesAny(msg, ['negative wallet', 'wallet balance', 'wallet issue', 'wallet'])) {
    return { type: 'GET_WALLET_BALANCES', requiresData: true, params: null };
  }
  if (includesAny(msg, ['courier performance', 'courier stats', 'courier metric', 'performance by courier'])) {
    return { type: 'CHECK_COURIER_PERFORMANCE', requiresData: true, params: null };
  }
  if (includesAny(msg, ['overview', 'dashboard', 'today summary', 'system summary', 'summary'])) {
    return { type: 'GET_OVERVIEW', requiresData: false, params: null };
  }
  return null;
}

function buildIntroReply(action, snapshot) {
  switch (action?.type) {
    case 'TRACK_SHIPMENT':
      return `Tracking ${action.params.awb} live now and pulling the latest courier movement.\nRecommended next step: ${suggestionForAction('TRACK_SHIPMENT')}`;
    case 'LOOKUP_SHIPMENT':
      return `Looking up shipment ${action.params.awb} in the portal records now.\nRecommended next step: ${suggestionForAction('LOOKUP_SHIPMENT')}`;
    case 'GET_PENDING_NDRS':
      return `Checking pending NDRs now. Current live count is ${snapshot.pendingNDRs}.\nRecommended next step: ${suggestionForAction('GET_PENDING_NDRS')}`;
    case 'GET_WALLET_BALANCES':
      return `Checking clients with negative wallet balances now.\nRecommended next step: ${suggestionForAction('GET_WALLET_BALANCES')}`;
    case 'CHECK_COURIER_PERFORMANCE':
      return `Pulling courier performance stats now so you can compare current activity.\nRecommended next step: ${suggestionForAction('CHECK_COURIER_PERFORMANCE')}`;
    case 'GET_OVERVIEW':
      return `Live snapshot: ${snapshot.activeShipments} active shipments, ${snapshot.pendingNDRs} pending NDRs, ${snapshot.todayBookings} bookings today, revenue ${snapshot.todayRevenue}.\nRecommended next step: ${suggestionForAction('GET_OVERVIEW')}`;
    default:
      return `SkyAI can track AWBs, show pending NDRs, check negative wallets, compare courier performance, and summarize today’s operations. Right now you have ${snapshot.activeShipments} active shipments and ${snapshot.pendingNDRs} pending NDRs.\nRecommended next step: ${suggestionForAction()}`;
  }
}

function formatCurrency(value) {
  if (value === null || value === undefined) return '₹0';
  const num = Number(value) || 0;
  return `₹${num.toLocaleString('en-IN')}`;
}

function summarizeAction(action, data, snapshot) {
  if (!action) return buildIntroReply(null, snapshot);
  if (!data) return buildIntroReply(action, snapshot);

  switch (action.type) {
    case 'GET_PENDING_NDRS': {
      const items = data.items || [];
      if (!items.length) return 'No pending NDRs need action right now.';
      const preview = items
        .slice(0, 3)
        .map((item) => `${item.awb} for ${item.destination || 'destination'} (${item.clientCode || 'client'})`)
        .join('; ');
      return `You have ${data.total || items.length} pending NDR cases. Top cases: ${preview}.\nRecommended next step: ${suggestionForAction('GET_PENDING_NDRS')}`;
    }

    case 'GET_WALLET_BALANCES': {
      const items = data.negativeBalances || [];
      if (!items.length) return 'No clients are currently in negative wallet balance.';
      const preview = items
        .slice(0, 3)
        .map((item) => `${item.company || item.code} at ${formatCurrency(item.walletBalance)}`)
        .join('; ');
      return `Found ${items.length} clients with negative wallet balance. Top cases: ${preview}.\nRecommended next step: ${suggestionForAction('GET_WALLET_BALANCES')}`;
    }

    case 'CHECK_COURIER_PERFORMANCE': {
      const items = (data.performance || []).filter((row) => row.courier);
      if (!items.length) return 'I could not find courier performance rows yet.';
      const top = items
        .sort((a, b) => (b?._count?.status || 0) - (a?._count?.status || 0))
        .slice(0, 3)
        .map((row) => `${row.courier}: ${row._count?.status || 0} shipments`)
        .join('; ');
      return `Courier activity snapshot is ready. Highest volume couriers right now: ${top}.\nRecommended next step: ${suggestionForAction('CHECK_COURIER_PERFORMANCE')}`;
    }

    case 'LOOKUP_SHIPMENT': {
      if (data.error) return data.error;
      const ship = data.shipment;
      if (!ship) return 'I could not find that shipment in the database.';
      return `${ship.awb} is currently ${ship.status || 'Unknown'} with ${ship.courier || 'unknown courier'} for ${ship.destination || 'unknown destination'}.\nRecommended next step: ${suggestionForAction('LOOKUP_SHIPMENT')}`;
    }

    case 'TRACK_SHIPMENT': {
      if (data.error) return data.error;
      const ship = data.shipment || {};
      const track = data.tracking || {};
      const currentLocation = track.currentLocation || track.events?.[0]?.location || 'Unknown location';
      const lastUpdate = track.lastUpdate || track.events?.[0]?.description || 'Latest scan available';
      return `${ship.awb || action.params?.awb} is ${track.status || ship.status || 'in progress'} at ${currentLocation}. Latest update: ${lastUpdate}.\nRecommended next step: ${suggestionForAction('TRACK_SHIPMENT')}`;
    }

    default:
      return buildIntroReply(action, snapshot);
  }
}

exports.chat = async ({ message, history = [] }) => {
  const snapshot = await getSnapshot();
  const action = detectAction(message, history);
  return {
    reply: buildIntroReply(action, snapshot),
    action,
  };
};

exports.summarizeAction = summarizeAction;

exports.resolveAction = async (action) => {
  if (!action || !action.type) return null;

  try {
    switch (action.type) {
      case 'GET_PENDING_NDRS': {
        const ndrs = await prisma.shipment.findMany({
          where: { status: 'NDR', ndrStatus: 'Action Required' },
          select: { awb: true, clientCode: true, amount: true, destination: true },
          take: 5,
        });
        return { items: ndrs, total: ndrs.length };
      }

      case 'CHECK_COURIER_PERFORMANCE': {
        const performance = await prisma.shipment.groupBy({
          by: ['courier'],
          _count: { status: true },
          where: { courier: { not: null } },
        });
        return { performance };
      }

      case 'GET_WALLET_BALANCES': {
        const negativeWallets = await prisma.client.findMany({
          where: { walletBalance: { lt: 0 } },
          select: { code: true, company: true, walletBalance: true },
          take: 10,
        });
        return { negativeBalances: negativeWallets };
      }

      case 'TRACK_SHIPMENT': {
        const awb = action.params?.awb;
        if (!awb) return { error: 'No AWB number provided' };

        const shipment = await prisma.shipment.findFirst({
          where: { awb: { contains: awb, mode: 'insensitive' } },
          select: {
            awb: true,
            courier: true,
            status: true,
            consignee: true,
            destination: true,
            date: true,
            weight: true,
            clientCode: true,
          },
        });

        const courier = shipment?.courier || 'Trackon';
        try {
          const tracking = await fetchTracking(courier, awb, { bypassCache: true });
          return {
            shipment: shipment || { awb },
            tracking: {
              status: tracking.status,
              currentLocation: tracking.events?.[0]?.location || 'Unknown',
              lastUpdate: tracking.events?.[0]?.description || '',
              lastTimestamp: tracking.events?.[0]?.timestamp || null,
              totalEvents: tracking.events?.length || 0,
              events: (tracking.events || []).slice(0, 5).map((e) => ({
                status: e.status,
                location: e.location,
                description: e.description,
                timestamp: e.timestamp,
              })),
            },
          };
        } catch (trackErr) {
          logger.warn(`SkyAI tracking failed for ${awb}: ${trackErr.message}`);
          return {
            shipment,
            tracking: null,
            error: `Could not fetch live tracking: ${trackErr.message}`,
          };
        }
      }

      case 'LOOKUP_SHIPMENT': {
        const awb = action.params?.awb;
        if (!awb) return { error: 'No AWB number provided' };
        const found = await prisma.shipment.findFirst({
          where: { awb: { contains: awb, mode: 'insensitive' } },
          select: {
            awb: true,
            courier: true,
            status: true,
            consignee: true,
            destination: true,
            date: true,
            weight: true,
            amount: true,
            clientCode: true,
            pincode: true,
          },
        });
        if (!found) return { error: `No shipment found with AWB ${awb}` };
        return { shipment: found };
      }

      case 'GET_OVERVIEW':
        return { snapshot: await getSnapshot() };

      default:
        return null;
    }
  } catch (err) {
    logger.error(`Error resolving action ${action.type}: ${err.message}`);
    return null;
  }
};
