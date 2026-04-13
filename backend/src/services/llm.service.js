'use strict';

const config = require('../config');
const logger = require('../utils/logger');

const DEFAULT_TIMEOUT_MS = 45000;

function hasLLM() {
  return Boolean(config.openai.apiKey);
}

function buildUrl(pathname) {
  const base = String(config.openai.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
  return `${base}${pathname.startsWith('/') ? pathname : `/${pathname}`}`;
}

function normalizeContent(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item?.type === 'text') return item.text || '';
        return '';
      })
      .join('\n')
      .trim();
  }
  return '';
}

function extractJsonObject(text) {
  const raw = String(text || '').trim();
  if (!raw) throw new Error('LLM returned an empty response');

  try {
    return JSON.parse(raw);
  } catch {}

  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('LLM response was not valid JSON');
  }

  return JSON.parse(raw.slice(start, end + 1));
}

async function doRequest(payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(buildUrl('/chat/completions'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.openai.apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const rawText = await res.text();
    let json;
    try {
      json = rawText ? JSON.parse(rawText) : {};
    } catch {
      json = null;
    }

    if (!res.ok) {
      const apiMessage = json?.error?.message || rawText || `HTTP ${res.status}`;
      throw new Error(apiMessage);
    }

    const content = normalizeContent(json?.choices?.[0]?.message?.content);
    if (!content) throw new Error('LLM response did not include message content');
    return extractJsonObject(content);
  } finally {
    clearTimeout(timer);
  }
}

function shouldRetryWithoutSchema(error) {
  const msg = String(error?.message || '').toLowerCase();
  return msg.includes('response_format') || msg.includes('json_schema') || msg.includes('structured output');
}

async function completeJson({ messages, schemaName = 'assistant_response', schema = null, temperature = 0.2, maxTokens = 900 }) {
  if (!hasLLM()) return null;

  const payload = {
    model: config.openai.model || 'gpt-4o',
    messages,
    temperature,
    max_completion_tokens: maxTokens,
    reasoning_effort: process.env.OPENAI_REASONING_EFFORT || 'high',
  };

  if (schema) {
    payload.response_format = {
      type: 'json_schema',
      json_schema: {
        name: schemaName,
        strict: true,
        schema,
      },
    };
  } else {
    payload.response_format = { type: 'json_object' };
  }

  try {
    return await doRequest(payload);
  } catch (error) {
    if (schema && shouldRetryWithoutSchema(error)) {
      logger.warn(`LLM structured output unsupported, retrying with JSON mode: ${error.message}`);
      const retryPayload = {
        ...payload,
        response_format: { type: 'json_object' },
      };
      return doRequest(retryPayload);
    }
    throw error;
  }
}

module.exports = {
  hasLLM,
  completeJson,
};
