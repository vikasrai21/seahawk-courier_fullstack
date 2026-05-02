const fs = require('fs');

const etaFuncs = `
function slaDaysFor(service) {
  const s = String(service || '').toLowerCase();
  if (s.includes('express')) return 2;
  if (s.includes('priority')) return 3;
  if (s.includes('standard')) return 4;
  return 5;
}
`;

let c = fs.readFileSync('backend/src/services/shipment.service.js', 'utf8');

if (!c.includes('function slaDaysFor')) {
  c = c.replace(/function buildFilters/, etaFuncs + '\nfunction buildFilters');
}

c = c.replace(
  "return { shipments, total, stats };",
  `const enrichedShipments = shipments.map(s => {
    const sla = slaDaysFor(s.service);
    const d = new Date(s.date);
    if (!isNaN(d.getTime())) {
      d.setDate(d.getDate() + sla);
      return { ...s, eta: d.toISOString().split('T')[0] };
    }
    return s;
  });
  return { shipments: enrichedShipments, total, stats };`
);

fs.writeFileSync('backend/src/services/shipment.service.js', c);
