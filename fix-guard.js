const fs = require('fs');
let c = fs.readFileSync('frontend/src/pages/MobileScannerPage.jsx', 'utf8');

const old = "  if (!step) {\r\n    return <div>Loading...</div>;\r\n  }";

const rep = "  // Guard: no pin and not standalone — show fallback (AFTER all hooks)\r\n  if (!pin && !isStandalone) {\r\n    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0B1120', color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>Initializing scanner\u2026</div>;\r\n  }\r\n\r\n  if (!step) {\r\n    return <div>Loading...</div>;\r\n  }";

if (!c.includes(old)) {
  console.log('ERROR: target not found');
  process.exit(1);
}
c = c.replace(old, rep);
fs.writeFileSync('frontend/src/pages/MobileScannerPage.jsx', c);
console.log('Guard added. Lines:', c.split('\n').length);
