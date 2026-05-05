const fs = require('fs');
let c = fs.readFileSync('frontend/src/pages/MobileScannerPage.jsx', 'utf8');

// The old pattern — early returns BEFORE hooks (React violation)
const old = [
  'export default function MobileScannerPage({ standalone = false }) {',
  '  // CHANGE: prevent crash on missing data',
  '  if (typeof window === \'undefined\' || typeof document === \'undefined\') {',
  '    return <div>Loading...</div>;',
  '  }',
  '',
  '  const { pin: pathPin } = useParams();',
  '  const searchParams = new URLSearchParams(window.location.search);',
  '  const sessionPin = searchParams.get(\'sessionId\');',
  '  const pin = pathPin || sessionPin;',
  '  const navigate = useNavigate();',
  '  const isStandalone = Boolean(standalone) && !sessionPin;',
  '',
  '  // CHANGE: fallback UI if no pin and not standalone',
  '  if (!pin && !isStandalone) {',
  '    return <div>Initializing scanner...</div>;',
  '  }',
].join('\r\n');

// The new pattern — hooks FIRST, no early returns
const rep = [
  'export default function MobileScannerPage({ standalone = false }) {',
  '  // Hooks MUST be called unconditionally (React Rules of Hooks).',
  '  // NEVER return before all hooks — doing so causes a blank white screen.',
  '  const { pin: pathPin } = useParams();',
  '  const navigate = useNavigate();',
  '',
  '  const searchParams = typeof window !== \'undefined\'',
  '    ? new URLSearchParams(window.location.search)',
  '    : new URLSearchParams();',
  '  const sessionPin = searchParams.get(\'sessionId\');',
  '  const pin = pathPin || sessionPin;',
  '  const isStandalone = Boolean(standalone) && !sessionPin;',
].join('\r\n');

if (!c.includes(old)) {
  console.log('ERROR: target block not found. Searching for fragments...');
  console.log('Has "prevent crash":', c.includes('prevent crash on missing data'));
  console.log('Has "Initializing scanner":', c.includes('Initializing scanner'));
  console.log('Has "useParams":', c.includes('useParams'));
  process.exit(1);
}

c = c.replace(old, rep);
fs.writeFileSync('frontend/src/pages/MobileScannerPage.jsx', c);
console.log('DONE. New line count:', c.split('\n').length);
