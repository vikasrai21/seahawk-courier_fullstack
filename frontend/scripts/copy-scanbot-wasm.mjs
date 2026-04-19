import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(process.cwd());
const targetDir = path.join(rootDir, 'public', 'wasm');

fs.mkdirSync(targetDir, { recursive: true });

// Copy Scanbot WASM files (if present)
const scanbotDir = path.join(rootDir, 'node_modules', 'scanbot-web-sdk', 'bundle', 'bin', 'barcode-scanner');
if (fs.existsSync(scanbotDir)) {
  fs.cpSync(scanbotDir, targetDir, { recursive: true, force: true });
  console.log('[copy-scanbot-wasm] copied Scanbot barcode engine files to public/wasm');
} else {
  console.warn('[copy-scanbot-wasm] Scanbot source missing, skipping');
}

// Copy zxing-wasm WASM binary for ITF barcode detection
const zxingWasm = path.join(rootDir, 'node_modules', 'zxing-wasm', 'dist', 'reader', 'zxing_reader.wasm');
if (fs.existsSync(zxingWasm)) {
  fs.copyFileSync(zxingWasm, path.join(targetDir, 'zxing_reader.wasm'));
  console.log('[copy-scanbot-wasm] copied zxing_reader.wasm to public/wasm');
} else {
  console.warn('[copy-scanbot-wasm] zxing_reader.wasm not found, WASM barcode engine will use CDN fallback');
}
