const fs = require('fs');
let css = fs.readFileSync('src/pages/MobileScannerPage.css', 'utf8');

const theme = {
  bg: '#F8FAFF',
  surface: '#FFFFFF',
  border: 'rgba(15,23,42,0.09)',
  text: '#0D1B2A',
  muted: '#5B6B7C',
  mutedLight: '#8FA0B0',
  primary: '#1D4ED8',
  primaryLight: '#EFF6FF',
  success: '#059669',
  successLight: '#ECFDF5',
  warning: '#D97706',
  warningLight: '#FFFBEB',
  error: '#DC2626',
  errorLight: '#FFF1F1',
  accent: '#7C3AED',
  accentLight: '#F5F3FF',
  navy: '#0D1B2A',
  navyMid: '#1E2D3D',
  navyLight: '#253545',
};

// Remove const css = `
css = css.replace(/^const css = `/m, '');
// Remove the ending `;
css = css.replace(/`;\s*$/m, '');

// Replace ${theme.xxx} with the actual value
for (const [key, value] of Object.entries(theme)) {
  const regex = new RegExp('\\$\\{theme\\.' + key + '\\}', 'g');
  css = css.replace(regex, value);
}

fs.writeFileSync('src/pages/MobileScannerPage.css', css);
console.log('Fixed CSS');
