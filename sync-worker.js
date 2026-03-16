/**
 * Seahawk Excel Auto-Sync Worker
 * Called by auto-sync.bat whenever the Excel file changes.
 * Usage: node sync-worker.js <excel-path> <dashboard-url>
 */

const fs   = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

const excelPath   = process.argv[2];
const dashboardUrl = process.argv[3] || 'http://localhost:3001';
const apiBase      = dashboardUrl.replace(/\/$/, '') + '/api';

// ── 1. Read and parse the Excel file ─────────────────────────────────────
let XLSX;
try {
  XLSX = require('xlsx');
} catch {
  console.error('Installing xlsx package...');
  require('child_process').execSync('npm install xlsx', { stdio: 'inherit', cwd: __dirname });
  XLSX = require('xlsx');
}

function excelDateToString(val) {
  if (typeof val === 'number') {
    try {
      const d = XLSX.SSF.parse_date_code(val);
      return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;
    } catch { return new Date().toISOString().split('T')[0]; }
  }
  if (typeof val === 'string') {
    const m = val.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (m) {
      const y = m[3].length === 2 ? '20' + m[3] : m[3];
      return `${y}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
    }
    return val;
  }
  return new Date().toISOString().split('T')[0];
}

// Same patterns as the frontend
const FIELD_PATTERNS = {
  date:        [/^date$/i, /^dt$/i, /^dispatch.?date$/i, /^ship.?date$/i],
  clientCode:  [/^client/i, /^party/i, /^account/i, /^cust/i, /^company/i],
  awb:         [/^awb/i, /^airway/i, /^docket/i, /^consign.?no/i, /^tracking/i, /^cn\.?no/i, /^shipment.?no/i, /^doc.?no/i],
  consignee:   [/^consignee/i, /^receiver/i, /^recipient/i, /^deliver.?to/i, /^name/i],
  destination: [/^dest/i, /^city/i, /^to/i, /^location/i, /^place/i],
  courier:     [/^courier/i, /^carrier/i, /^vendor/i, /^service.?provider/i, /^through/i],
  department:  [/^dept/i, /^department/i, /^division/i, /^branch/i, /^ref/i],
  weight:      [/^wt/i, /^weight/i, /^kg/i, /^gross/i],
  amount:      [/^amt/i, /^amount/i, /^charges?/i, /^rate/i, /^price/i, /^freight/i, /^bill/i, /^rs/i, /^total/i],
  status:      [/^status/i, /^state/i],
  remarks:     [/^remark/i, /^note/i, /^comment/i, /^narration/i],
};

function detectField(col) {
  for (const [field, patterns] of Object.entries(FIELD_PATTERNS)) {
    if (patterns.some(p => p.test(String(col).trim()))) return field;
  }
  return null;
}

function parseExcel(filePath) {
  const wb    = XLSX.readFile(filePath, { cellDates: false });
  // Use first sheet
  const ws    = wb.Sheets[wb.SheetNames[0]];
  const rows  = XLSX.utils.sheet_to_json(ws, { defval: '' });
  if (!rows.length) return [];

  // Build column map
  const colMap = {};
  Object.keys(rows[0]).forEach(col => {
    const field = detectField(col);
    if (field && !colMap[field]) colMap[field] = col;
  });

  console.log('  Detected columns:', Object.entries(colMap).map(([f,c]) => `${f}←${c}`).join(', '));

  return rows.map(row => {
    const s = {};
    for (const [field, col] of Object.entries(colMap)) {
      if (row[col] !== undefined && row[col] !== '') s[field] = row[col];
    }
    if (s.date)        s.date        = excelDateToString(s.date);
    else               s.date        = new Date().toISOString().split('T')[0];
    if (s.awb)         s.awb         = String(s.awb).trim();
    if (s.clientCode)  s.clientCode  = String(s.clientCode).trim().toUpperCase();
    if (s.consignee)   s.consignee   = String(s.consignee).trim().toUpperCase();
    if (s.destination) s.destination = String(s.destination).trim().toUpperCase();
    if (s.weight)      s.weight      = parseFloat(s.weight)  || 0;
    if (s.amount)      s.amount      = parseFloat(s.amount)  || 0;
    return s;
  }).filter(s => s.awb && s.awb.trim() !== '');
}

// ── 2. Login and get token ────────────────────────────────────────────────
// Reads credentials from sync-config.json (created on first run)
const CONFIG_FILE = path.join(__dirname, 'sync-config.json');

function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  }
  // Default — change these in sync-config.json after first run
  const defaults = { email: 'admin@seahawk.com', password: 'admin123' };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(defaults, null, 2));
  return defaults;
}

function request(method, url, body, token) {
  return new Promise((resolve, reject) => {
    const u    = new URL(url);
    const mod  = u.protocol === 'https:' ? https : http;
    const data = body ? JSON.stringify(body) : null;
    const req  = mod.request({
      hostname: u.hostname,
      port:     u.port || (u.protocol === 'https:' ? 443 : 80),
      path:     u.pathname + u.search,
      method,
      headers: {
        'Content-Type':  'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    }, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function login(email, password) {
  const res = await request('POST', `${apiBase}/auth/login`, { email, password });
  if (res.status !== 200 || !res.body?.data?.accessToken) {
    throw new Error(`Login failed: ${res.body?.message || 'wrong credentials'}`);
  }
  return res.body.data.accessToken;
}

async function importShipments(token, shipments) {
  const res = await request('POST', `${apiBase}/shipments/import`, { shipments }, token);
  return res.body;
}

// ── 3. Main ───────────────────────────────────────────────────────────────
async function main() {
  if (!excelPath || !fs.existsSync(excelPath)) {
    console.error('ERROR: Excel file not found:', excelPath);
    process.exit(1);
  }

  console.log('  Reading:', excelPath);
  const shipments = parseExcel(excelPath);
  console.log(`  Found ${shipments.length} rows with AWB numbers`);

  if (!shipments.length) {
    console.log('  Nothing to import — no valid rows found.');
    process.exit(0);
  }

  const config = loadConfig();
  console.log(`  Logging in as ${config.email}...`);
  const token = await login(config.email, config.password);

  console.log(`  Sending ${shipments.length} rows to dashboard...`);
  const result = await importShipments(token, shipments);

  if (result.success || result.data) {
    const d = result.data || result;
    console.log(`  ✅ Imported: ${d.imported}  |  Duplicates skipped: ${d.duplicates}  |  Errors: ${d.errors?.length || 0}`);
    if (d.errors?.length) {
      d.errors.forEach(e => console.log(`     ⚠  AWB ${e.awb}: ${e.error}`));
    }
  } else {
    console.error('  ❌ Import failed:', result.message || JSON.stringify(result));
    process.exit(1);
  }
}

main().catch(err => {
  console.error('  ❌ Error:', err.message);
  process.exit(1);
});
