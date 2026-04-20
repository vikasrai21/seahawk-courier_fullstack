import { readdirSync, statSync } from 'node:fs';
import { basename, join } from 'node:path';

const ASSET_DIR_CANDIDATES = [join(process.cwd(), 'dist', 'assets')];
if (process.env.BUNDLE_CHECK_BACKEND_PUBLIC === '1') {
  ASSET_DIR_CANDIDATES.push(join(process.cwd(), '..', 'backend', 'public', 'assets'));
}
const MAX_JS_KB = Number(process.env.BUNDLE_MAX_JS_KB || 500);
const MAX_CSS_KB = Number(process.env.BUNDLE_MAX_CSS_KB || 190);
const EXEMPT_JS_PREFIXES = String(process.env.BUNDLE_EXEMPT_JS_PREFIXES || 'vendor-excel-')
  .split(',')
  .map((prefix) => prefix.trim())
  .filter(Boolean);

function bytesToKb(bytes) {
  return Number((bytes / 1024).toFixed(2));
}

function collectFiles(dir) {
  try {
    return readdirSync(dir).map((name) => join(dir, name));
  } catch {
    return [];
  }
}

const files = ASSET_DIR_CANDIDATES.flatMap((dir) => collectFiles(dir));
if (!files.length) {
  console.error('[budget] No built assets found. Run vite build first.');
  process.exit(1);
}

let failed = false;

for (const file of files) {
  const size = statSync(file).size;
  const kb = bytesToKb(size);
  const isJsExempt = file.endsWith('.js') && EXEMPT_JS_PREFIXES.some((prefix) => basename(file).startsWith(prefix));
  if (file.endsWith('.js') && kb > MAX_JS_KB && !isJsExempt) {
    console.error(`[budget] JS bundle exceeded: ${file} -> ${kb}KB (max ${MAX_JS_KB}KB)`);
    failed = true;
  }
  if (file.endsWith('.css') && kb > MAX_CSS_KB) {
    console.error(`[budget] CSS bundle exceeded: ${file} -> ${kb}KB (max ${MAX_CSS_KB}KB)`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log('[budget] Bundle budgets passed');
