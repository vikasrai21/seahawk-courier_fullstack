'use strict';

const ACTION_TYPES = new Set([
  'SHIPMENT_LIST',
  'TRACK_AWB',
  'PICKUP_LIST',
  'PICKUP_CREATE',
  'NDR_LIST',
  'NDR_RESPOND',
  'SUPPORT_TICKET_LIST',
  'SUPPORT_TICKET',
]);

function hasOpenAI() {
  return true;
}

function normalize(text) {
  return String(text || '').trim();
}

function lower(text) {
  return normalize(text).toLowerCase();
}

function extractAwb(text) {
  const matches = String(text || '').toUpperCase().match(/[A-Z0-9]{6,}/g) || [];
  return matches[0] || '';
}

function findRecentAwb(history = []) {
  const items = Array.isArray(history) ? history.slice().reverse() : [];
  for (const item of items) {
    const awb = extractAwb(item?.text || item?.content || '');
    if (awb) return awb;
  }
  return '';
}

function findRecentIntent(history = []) {
  const items = Array.isArray(history) ? history.slice().reverse() : [];
  for (const item of items) {
    const msg = lower(item?.text || item?.content || '');
    if (includesAny(msg, ['track', 'status'])) return 'TRACK_AWB';
    if (includesAny(msg, ['pickup'])) return 'PICKUP';
    if (includesAny(msg, ['ndr'])) return 'NDR';
    if (includesAny(msg, ['support', 'ticket', 'issue'])) return 'SUPPORT';
    if (includesAny(msg, ['shipment'])) return 'SHIPMENT_LIST';
  }
  return '';
}

function extractField(text, label) {
  const re = new RegExp(`${label}\\s*:\\s*([^\\n;]+)`, 'i');
  const m = String(text || '').match(re);
  return m ? String(m[1]).trim() : '';
}

function includesAny(text, words) {
  return words.some((word) => text.includes(word));
}

function pickupFields(message) {
  return {
    contactName: extractField(message, 'name'),
    contactPhone: extractField(message, 'phone'),
    pickupAddress: extractField(message, 'address'),
    pickupCity: extractField(message, 'city'),
    pickupPin: extractField(message, 'pin'),
    scheduledDate: extractField(message, 'date'),
    timeSlot: extractField(message, 'slot') || extractField(message, 'time'),
    packageType: extractField(message, 'package') || extractField(message, 'packageType'),
    weightGrams: extractField(message, 'weight'),
    pieces: extractField(message, 'pieces'),
    notes: extractField(message, 'notes'),
  };
}

function ndrFields(message) {
  return {
    awb: extractAwb(message),
    ndrAction: extractField(message, 'action'),
    newAddress: extractField(message, 'address'),
    newPhone: extractField(message, 'phone'),
    rescheduleDate: extractField(message, 'date'),
    notes: extractField(message, 'notes'),
  };
}

function supportFields(message) {
  return {
    subject: extractField(message, 'subject'),
    message: extractField(message, 'message') || extractField(message, 'details'),
    awb: extractAwb(message),
    priority: extractField(message, 'priority'),
  };
}

function sanitizeFields(fields) {
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
  );
}

function buildPayload(reply, action = null) {
  return { reply, action };
}

function withSuggestion(reply, suggestion) {
  return suggestion ? `${reply}\nRecommended next step: ${suggestion}` : reply;
}

async function inferAssistantAction({ message, history = [] }) {
  const msg = lower(message);
  const explicitAwb = extractAwb(message);
  const recentAwb = findRecentAwb(history);
  const awb = explicitAwb || (includesAny(msg, ['this', 'it', 'same awb', 'same shipment', 'that one', 'this one']) ? recentAwb : '');
  const lastAssistant = history.slice().reverse().find((item) => item.role === 'assistant')?.text || '';
  const lastUser = history.slice().reverse().find((item) => item.role === 'user')?.text || '';
  const context = `${lower(lastAssistant)} ${lower(lastUser)}`.trim();
  const recentIntent = findRecentIntent(history);

  if ((includesAny(msg, ['track', 'status', 'where is', 'where\'s']) && awb) || (awb && includesAny(context, ['awb', 'shipment', 'track']))) {
    return buildPayload(
      withSuggestion(
        `I’m pulling the latest movement for ${awb} now.`,
        'Ask for NDR status or support help if the shipment looks stuck.'
      ),
      { type: 'TRACK_AWB', awb }
    );
  }

  if (awb && recentIntent === 'SUPPORT' && includesAny(msg, ['do it', 'create', 'raise it', 'open it'])) {
    return buildPayload(
      'Please share `subject:` and `message:` for the support ticket so I can prepare it correctly.',
      null
    );
  }

  if (includesAny(msg, ['shipment list', 'list shipments', 'my shipments', 'recent shipments', 'show shipments'])) {
    return buildPayload(
      withSuggestion('I’ll pull your latest shipments and highlight anything that needs attention.', 'Ask me to track any AWB from the list for live movement.'),
      { type: 'SHIPMENT_LIST' }
    );
  }

  if (includesAny(msg, ['pickup list', 'list pickups', 'my pickups', 'recent pickups'])) {
    return buildPayload(
      withSuggestion('I’ll show your latest pickup requests now.', 'You can also say `create pickup` to schedule a new one.'),
      { type: 'PICKUP_LIST' }
    );
  }

  if (includesAny(msg, ['ndr list', 'show ndr', 'list ndr', 'ndr cases', 'pending ndr'])) {
    return buildPayload(
      withSuggestion('I’ll pull your latest NDR cases and highlight the ones needing action.', 'If needed, send an AWB with a new address or phone to respond to an NDR.'),
      { type: 'NDR_LIST' }
    );
  }

  if (includesAny(msg, ['support tickets', 'ticket list', 'my tickets', 'open tickets'])) {
    return buildPayload(
      withSuggestion('I’ll show your recent support tickets now.', 'You can also say `raise support ticket` for a shipment issue.'),
      { type: 'SUPPORT_TICKET_LIST' }
    );
  }

  if (includesAny(msg, ['pickup', 'schedule pickup', 'create pickup', 'book pickup'])) {
    const fields = sanitizeFields(pickupFields(message));
    const missing = ['contactName', 'contactPhone', 'pickupAddress', 'pickupCity', 'pickupPin', 'scheduledDate']
      .filter((key) => !fields[key]);

    if (missing.length) {
      return buildPayload(
        'I can create a pickup request. Please share name, phone, address, city, pin, and date. Example: `name: Ajay; phone: 98xxxx; address: ...; city: Delhi; pin: 110001; date: 2026-04-09`.',
        null
      );
    }

    return buildPayload(
      withSuggestion(
        `Pickup details are ready for ${fields.contactName} in ${fields.pickupCity}. Confirm once and I’ll submit it.`,
        'Double-check the pickup date and phone number before confirming.'
      ),
      { type: 'PICKUP_CREATE', confirmRequired: true, ...fields }
    );
  }

  if (includesAny(msg, ['ndr respond', 'respond ndr', 'reattempt', 'reschedule delivery', 'change address for ndr', 'ndr action'])) {
    const fields = sanitizeFields(ndrFields(message));
    if (!fields.awb) {
      return buildPayload('Please share the AWB number for the NDR response so I can prepare the action correctly.', null);
    }

    return buildPayload(
      withSuggestion(
        `I’m ready to submit the NDR response for ${fields.awb}. Please confirm once and I’ll proceed.`,
        'Add a new address or phone if the delivery details need correction.'
      ),
      { type: 'NDR_RESPOND', confirmRequired: true, ...fields }
    );
  }

  if (includesAny(msg, ['support', 'ticket', 'issue', 'complaint', 'raise case'])) {
    const fields = sanitizeFields(supportFields(message));
    if (!fields.subject || !fields.message) {
      return buildPayload(
        'I can raise a support ticket. Please share `subject:` and `message:`. Add an AWB if the issue is shipment-specific.',
        null
      );
    }

    return buildPayload(
      withSuggestion(
        `Your support ticket draft is ready${fields.awb ? ` for AWB ${fields.awb}` : ''}. Confirm once and I’ll create it.`,
        'Include a short issue summary so the ops team can move faster.'
      ),
      { type: 'SUPPORT_TICKET', confirmRequired: true, ...fields }
    );
  }

  if (awb) {
    return buildPayload(
      withSuggestion(
        `I found shipment number ${awb}. I’ll track it directly so you get the latest status instead of a generic lookup.`,
        'After tracking, you can ask for support or NDR help for the same AWB.'
      ),
      { type: 'TRACK_AWB', awb }
    );
  }

  return buildPayload(
    'I can help with shipments, AWB tracking, pickups, NDR responses, and support tickets. Try something like `track X1000280525`, `show my shipments`, or `create pickup`.',
    { type: 'SHIPMENT_LIST' }
  );
}

module.exports = {
  hasOpenAI,
  inferAssistantAction,
  model: 'internal-rule-engine',
  ACTION_TYPES,
};
