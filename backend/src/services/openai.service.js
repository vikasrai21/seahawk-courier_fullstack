'use strict';

const config = require('../config');
const logger = require('../utils/logger');

function hasOpenAI() {
  return Boolean(config.openai.apiKey);
}

function buildInstruction() {
  return [
    'You are the Sea Hawk client portal assistant.',
    'Write in a professional enterprise tone (clear, concise, confident), similar to top logistics brands.',
    'Be proactive: include a short “Recommended next steps” section when appropriate.',
    'If you propose an action, keep it explicit and ask for confirmation.',
    'Return JSON only with keys: reply (string) and optional action (object).',
    'Action types allowed:',
    '- SHIPMENT_LIST',
    '- TRACK_AWB (fields: awb)',
    '- PICKUP_LIST',
    '- PICKUP_CREATE (fields: contactName, contactPhone, pickupAddress, pickupCity, pickupPin, scheduledDate, timeSlot, packageType, weightGrams, pieces, notes)',
    '- NDR_LIST',
    '- NDR_RESPOND (fields: awb, ndrAction, newAddress, newPhone, rescheduleDate, notes)',
    '- SUPPORT_TICKET_LIST',
    '- SUPPORT_TICKET (fields: subject, message, awb, priority)',
    'If you choose an action that creates or updates data, include action.confirmRequired=true.',
    'If unsure, ask a clarifying question in reply and do not include action.',
  ].join('\n');
}

function parseOutputText(response) {
  if (!response) return '';
  if (typeof response.output_text === 'string' && response.output_text.trim()) return response.output_text.trim();
  const output = response.output || [];
  for (const item of output) {
    if (item.type === 'message' && Array.isArray(item.content)) {
      const textParts = item.content.filter((c) => c.type === 'output_text').map((c) => c.text);
      if (textParts.length) return textParts.join('\n').trim();
    }
  }
  return '';
}

async function inferAssistantAction({ message, history = [] }) {
  if (!hasOpenAI()) return null;
  if (!global.fetch) {
    logger.warn('OpenAI: fetch unavailable, skipping');
    return null;
  }

  const historyText = history
    .slice(-6)
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
    .join('\n');

  const input = [
    historyText ? `Conversation:\n${historyText}` : '',
    `User: ${String(message || '').trim()}`,
  ].filter(Boolean).join('\n');

  try {
    const res = await fetch(`${config.openai.baseUrl}/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.openai.apiKey}`,
      },
      body: JSON.stringify({
        model: config.openai.model,
        instructions: buildInstruction(),
        input,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      logger.warn(`OpenAI: response error ${res.status}: ${errText}`);
      return null;
    }

    const data = await res.json();
    const text = parseOutputText(data);
    if (!text) return null;
    const firstJson = text.match(/\{[\s\S]*\}/);
    const payload = JSON.parse(firstJson ? firstJson[0] : text);
    return payload;
  } catch (err) {
    logger.warn(`OpenAI: failed to infer action: ${err.message}`);
    return null;
  }
}

module.exports = { hasOpenAI, inferAssistantAction };
