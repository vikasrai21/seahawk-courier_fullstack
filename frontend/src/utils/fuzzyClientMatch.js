/**
 * fuzzyClientMatch.js
 * Place at: frontend/src/utils/fuzzyClientMatch.js
 *
 * Matches a partial / handwritten / OCR-read name against your client list.
 * Returns top matches sorted by score descending.
 *
 * Usage:
 *   import { fuzzyClientMatch } from '../utils/fuzzyClientMatch';
 *
 *   const matches = fuzzyClientMatch('ORM', clients);
 *   // → [{ code: 'NORMA', name: 'Norma Traders', score: 0.85 }, ...]
 *
 * Each `client` object should have at least:
 *   { code: string, name?: string, company?: string }
 */

/**
 * Score how well `needle` (OCR text) matches `haystack` (client name).
 * Returns 0–1. Higher = better match.
 */
function scoreMatch(needle, haystack) {
  if (!needle || !haystack) return 0;

  const n = needle.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const h = haystack.toUpperCase().replace(/[^A-Z0-9]/g, '');

  if (!n || !h) return 0;

  // Exact match
  if (h === n) return 1.0;

  // Haystack contains needle as a substring (e.g. "ORM" inside "NORMA")
  if (h.includes(n)) return 0.92;

  // Needle contains haystack (short client name fully visible in OCR text)
  if (n.includes(h)) return 0.88;

  // Sequential character match — checks if needle chars appear in order in haystack.
  // Handles partial reads: "NRM" could match "NORMA" (N..R..M all in order).
  let ni = 0;
  for (let hi = 0; hi < h.length && ni < n.length; hi++) {
    if (h[hi] === n[ni]) ni++;
  }
  const seqScore = ni / n.length;

  // Character overlap — what fraction of needle chars exist anywhere in haystack
  const needleSet = new Set(n);
  const haySet = new Set(h);
  const commonChars = [...needleSet].filter(c => haySet.has(c)).length;
  const overlapScore = commonChars / Math.max(needleSet.size, 1);

  // Prefix bonus — if needle matches the start of haystack (e.g. "NOR" → "NORMA")
  const prefixLen = Math.min(n.length, h.length);
  let prefixMatch = 0;
  for (let i = 0; i < prefixLen; i++) {
    if (n[i] === h[i]) prefixMatch++;
    else break;
  }
  const prefixScore = prefixMatch / Math.max(n.length, 1);

  // Levenshtein distance for short strings (under 12 chars each)
  let editScore = 0;
  if (n.length <= 12 && h.length <= 12) {
    const dist = levenshtein(n, h);
    const maxLen = Math.max(n.length, h.length);
    editScore = Math.max(0, 1 - dist / maxLen);
  }

  return Math.max(seqScore * 0.9, overlapScore * 0.75, prefixScore * 0.85, editScore * 0.8);
}

/**
 * Standard Levenshtein distance (edit distance) between two strings.
 */
function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

/**
 * Main export.
 *
 * @param {string} ocrText  - Raw text read from the AWB (e.g. "NRM", "NORMA TRAD")
 * @param {Array}  clients  - Your client list from the API/store
 * @param {Object} options
 * @param {number} options.minScore    - Minimum score to include (default 0.3)
 * @param {number} options.maxResults  - Max matches to return (default 3)
 *
 * @returns {Array<{ code, name, score }>}
 */
export function fuzzyClientMatch(ocrText, clients, { minScore = 0.3, maxResults = 3 } = {}) {
  if (!ocrText || !clients?.length) return [];

  const needle = String(ocrText).trim();

  const scored = clients
    .map((client) => {
      // Score against both the short code and the full name/company
      const code = String(client.code || client.clientCode || '');
      const name = String(client.name || client.company || client.clientName || '');

      const codeScore = scoreMatch(needle, code);
      const nameScore = scoreMatch(needle, name);
      const best = Math.max(codeScore, nameScore);

      return {
        code,
        name: name || code,
        score: best,
      };
    })
    .filter((c) => c.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  return scored;
}

/**
 * Convenience: returns only the top match, or null if nothing scores high enough.
 *
 * @param {string} ocrText
 * @param {Array}  clients
 * @param {number} minScore  - Minimum confidence to auto-assign (default 0.7)
 */
export function bestClientMatch(ocrText, clients, minScore = 0.7) {
  const results = fuzzyClientMatch(ocrText, clients, { minScore, maxResults: 1 });
  return results[0] || null;
}