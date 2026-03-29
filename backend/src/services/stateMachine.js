'use strict';
// src/services/stateMachine.js
// Enforces valid shipment status transitions
// Any attempt to transition outside these rules returns a 400 error

const ALIASES = {
  'PICKED UP': 'PickedUp',
  'PICKEDUP': 'PickedUp',
  'IN TRANSIT': 'InTransit',
  'INTRANSIT': 'InTransit',
  'OUT FOR DELIVERY': 'OutForDelivery',
  'OUTFORDELIVERY': 'OutForDelivery',
  'RTO DELIVERED': 'RTODelivered',
  'RTODELIVERED': 'RTODelivered',
};

const LABELS = {
  Booked: 'Booked',
  PickedUp: 'Picked Up',
  InTransit: 'In Transit',
  OutForDelivery: 'Out for Delivery',
  Delivered: 'Delivered',
  Failed: 'Failed',
  RTO: 'RTO',
  RTODelivered: 'RTO Delivered',
  Cancelled: 'Cancelled',
};

const TRANSITIONS = {
  Booked: ['PickedUp', 'Cancelled'],
  PickedUp: ['InTransit', 'RTO', 'Cancelled'],
  InTransit: ['OutForDelivery', 'RTO', 'Failed'],
  OutForDelivery: ['Delivered', 'Failed', 'RTO'],
  Delivered: [],
  Failed: ['InTransit', 'RTO'],
  RTO: ['RTODelivered', 'InTransit'],
  RTODelivered: [],
  Cancelled: [],
};

// Statuses that trigger wallet refund
const REFUND_ON = new Set(['Cancelled', 'RTO', 'RTODelivered']);

// Statuses that trigger customer notification
const NOTIFY_ON = new Set(['PickedUp', 'InTransit', 'OutForDelivery', 'Delivered', 'Failed', 'RTO']);

function normalizeStatus(status) {
  const raw = String(status || '').trim();
  if (!raw) return raw;
  return ALIASES[raw.toUpperCase()] || raw;
}

function displayStatus(status) {
  const canonical = normalizeStatus(status);
  return LABELS[canonical] || canonical || 'Unknown';
}

/**
 * Validate that a status transition is allowed.
 * Throws an error with a clear message if not.
 */
function assertValidTransition(currentStatus, newStatus) {
  const current = normalizeStatus(currentStatus);
  const next = normalizeStatus(newStatus);

  // If same status — always OK (idempotent update)
  if (current === next) return;

  const allowed = TRANSITIONS[current];

  // Unknown current status — allow (legacy data)
  if (!allowed) return;

  if (!allowed.includes(next)) {
    throw new Error(
      `Invalid status transition: "${displayStatus(currentStatus)}" → "${displayStatus(newStatus)}". ` +
      `Allowed: ${allowed.length ? allowed.map(displayStatus).join(', ') : 'none (terminal status)'}`
    );
  }
}

/**
 * Check if a status change should trigger a wallet refund
 */
function shouldRefund(newStatus) {
  return REFUND_ON.has(normalizeStatus(newStatus));
}

/**
 * Check if a status change should trigger a customer notification
 */
function shouldNotify(newStatus) {
  return NOTIFY_ON.has(normalizeStatus(newStatus));
}

/**
 * Get all valid next statuses from current status
 */
function getValidTransitions(currentStatus) {
  return (TRANSITIONS[normalizeStatus(currentStatus)] || []).map(displayStatus);
}

/**
 * Check if a status is terminal (no further transitions allowed)
 */
function isTerminal(status) {
  const transitions = TRANSITIONS[normalizeStatus(status)];
  return transitions !== undefined && transitions.length === 0;
}

module.exports = {
  TRANSITIONS,
  assertValidTransition,
  shouldRefund,
  shouldNotify,
  getValidTransitions,
  isTerminal,
  normalizeStatus,
  displayStatus,
};
