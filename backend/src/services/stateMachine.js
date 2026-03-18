'use strict';
// src/services/stateMachine.js
// Enforces valid shipment status transitions
// Any attempt to transition outside these rules returns a 400 error

const TRANSITIONS = {
  'Booked':           ['Picked Up', 'Cancelled'],
  'Picked Up':        ['In Transit', 'RTO', 'Cancelled'],
  'In Transit':       ['Out for Delivery', 'RTO', 'Failed'],
  'Out for Delivery': ['Delivered', 'Failed', 'RTO'],
  'Delivered':        [],   // terminal
  'Failed':           ['In Transit', 'RTO'],
  'RTO':              ['RTO Delivered', 'In Transit'],
  'RTO Delivered':    [],   // terminal
  'Cancelled':        [],   // terminal
};

// Statuses that trigger wallet refund
const REFUND_ON = new Set(['Cancelled', 'RTO', 'RTO Delivered']);

// Statuses that trigger customer notification
const NOTIFY_ON = new Set(['Picked Up', 'In Transit', 'Out for Delivery', 'Delivered', 'Failed', 'RTO']);

/**
 * Validate that a status transition is allowed.
 * Throws an error with a clear message if not.
 */
function assertValidTransition(currentStatus, newStatus) {
  // If same status — always OK (idempotent update)
  if (currentStatus === newStatus) return;

  const allowed = TRANSITIONS[currentStatus];

  // Unknown current status — allow (legacy data)
  if (!allowed) return;

  if (!allowed.includes(newStatus)) {
    throw new Error(
      `Invalid status transition: "${currentStatus}" → "${newStatus}". ` +
      `Allowed: ${allowed.length ? allowed.join(', ') : 'none (terminal status)'}`
    );
  }
}

/**
 * Check if a status change should trigger a wallet refund
 */
function shouldRefund(newStatus) {
  return REFUND_ON.has(newStatus);
}

/**
 * Check if a status change should trigger a customer notification
 */
function shouldNotify(newStatus) {
  return NOTIFY_ON.has(newStatus);
}

/**
 * Get all valid next statuses from current status
 */
function getValidTransitions(currentStatus) {
  return TRANSITIONS[currentStatus] || [];
}

/**
 * Check if a status is terminal (no further transitions allowed)
 */
function isTerminal(status) {
  const transitions = TRANSITIONS[status];
  return transitions !== undefined && transitions.length === 0;
}

module.exports = {
  TRANSITIONS,
  assertValidTransition,
  shouldRefund,
  shouldNotify,
  getValidTransitions,
  isTerminal,
};
