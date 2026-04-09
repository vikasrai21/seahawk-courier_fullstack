import fs from 'node:fs';
import path from 'node:path';

const rootDir = path.resolve(process.cwd());
const sourceDir = path.join(rootDir, 'node_modules', 'scanbot-web-sdk', 'bundle', 'bin', 'barcode-scanner');
const targetDir = path.join(rootDir, 'public', 'wasm');

if (!fs.existsSync(sourceDir)) {
  console.warn('[copy-scanbot-wasm] source missing, skipping:', sourceDir);
  process.exit(0);
}

fs.mkdirSync(targetDir, { recursive: true });
fs.cpSync(sourceDir, targetDir, { recursive: true, force: true });
console.log('[copy-scanbot-wasm] copied barcode engine files to public/wasm');
