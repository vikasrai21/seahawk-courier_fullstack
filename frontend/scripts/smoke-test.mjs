import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const requiredFiles = [
  'src/main.jsx',
  'src/App.jsx',
  'src/pages/DashboardPage.jsx',
  'src/pages/ScanAWBPage.jsx',
  'src/pages/InvoicesPage.jsx',
  'src/pages/client/ClientPortalPage.jsx',
];

for (const relPath of requiredFiles) {
  const fullPath = path.join(root, relPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Smoke test failed: missing ${relPath}`);
  }
}

const appSource = fs.readFileSync(path.join(root, 'src/App.jsx'), 'utf8');
const checks = [
  ['path="/bookings"', 'Bookings route is not registered'],
  ['path="/change-password"', 'Change password route is not registered'],
  ['/portal/invoices', 'Client invoices route is not registered'],
];

for (const [needle, message] of checks) {
  if (!appSource.includes(needle)) {
    throw new Error(`Smoke test failed: ${message}`);
  }
}

console.log('Frontend smoke test passed.');
