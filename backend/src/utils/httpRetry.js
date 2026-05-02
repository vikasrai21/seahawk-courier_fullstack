'use strict';

const RETRYABLE_HTTP_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const RETRYABLE_ERROR_CODES = new Set([
  'ETIMEDOUT',
  'ECONNRESET',
  'ECONNREFUSED',
  'ENOTFOUND',
  'EAI_AGAIN',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_BODY_TIMEOUT',
]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffMs(attempt, baseMs = 300) {
  return baseMs * (2 ** attempt) + Math.floor(Math.random() * 150);
}

function isRetryableError(err) {
  if (!err) return false;
  if (err.name === 'AbortError') return true;
  if (err.status && RETRYABLE_HTTP_STATUS.has(err.status)) return true;
  if (err.code && RETRYABLE_ERROR_CODES.has(err.code)) return true;
  return false;
}

const circuits = new Map();

function getCircuit(host) {
  if (!circuits.has(host)) {
    circuits.set(host, { failures: 0, state: 'CLOSED', nextAttempt: 0 });
  }
  return circuits.get(host);
}

async function fetchWithRetry(url, init = {}, options = {}) {
  const {
    attempts = 3,
    timeoutMs = 10000,
    baseDelayMs = 300,
  } = options;

  let host = 'unknown';
  try { host = new URL(url).host; } catch (e) { /* ignore invalid url */ }
  const circuit = getCircuit(host);

  if (circuit.state === 'OPEN') {
    if (Date.now() < circuit.nextAttempt) {
      throw new Error(`Circuit breaker OPEN for ${host} - skipping request to prevent cascading failure`);
    }
    circuit.state = 'HALF_OPEN';
  }

  let lastError = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        const err = new Error(`HTTP ${response.status}${text ? `: ${text.slice(0, 400)}` : ''}`);
        err.status = response.status;
        err.body = text;
        throw err;
      }

      // Success resets circuit
      if (circuit.state !== 'CLOSED') {
        circuit.failures = 0;
        circuit.state = 'CLOSED';
      }

      return response;
    } catch (err) {
      lastError = err;
      if (attempt >= attempts - 1 || !isRetryableError(err)) break;
      await sleep(backoffMs(attempt, baseDelayMs));
    }
  }

  // Final failure updates circuit
  if (isRetryableError(lastError)) {
    circuit.failures += 1;
    if (circuit.failures >= 5) {
      circuit.state = 'OPEN';
      circuit.nextAttempt = Date.now() + 60000; // Open for 60 seconds
    }
  }

  throw lastError || new Error('Request failed');
}

async function fetchJsonWithRetry(url, init = {}, options = {}) {
  const response = await fetchWithRetry(url, init, options);
  return response.json();
}

async function fetchBufferWithRetry(url, init = {}, options = {}) {
  const response = await fetchWithRetry(url, init, options);
  return Buffer.from(await response.arrayBuffer());
}

module.exports = {
  fetchWithRetry,
  fetchJsonWithRetry,
  fetchBufferWithRetry,
};
