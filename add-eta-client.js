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

let c = fs.readFileSync('backend/src/controllers/client-portal/portal.stats.js', 'utf8');

if (!c.includes('function slaDaysFor')) {
  c = c.replace(/async function shipments/, etaFuncs + '\nasync function shipments');
}

c = c.replace(
  "R.ok(res, { shipments: shipmentsList, pagination: { total, page: safePage, limit: safeLimit }, range: { from: startStr, to: endStr } });",
  `const enrichedShipments = shipmentsList.map(s => {
    const sla = slaDaysFor(s.service);
    const d = new Date(s.date);
    if (!isNaN(d.getTime())) {
      d.setDate(d.getDate() + sla);
      return { ...s, eta: d.toISOString().split('T')[0] };
    }
    return s;
  });
  R.ok(res, { shipments: enrichedShipments, pagination: { total, page: safePage, limit: safeLimit }, range: { from: startStr, to: endStr } });`
);

c = c.replace(
  "  if (!shipment) return R.notFound(res, 'Shipment not found.');",
  `  if (!shipment) return R.notFound(res, 'Shipment not found.');
  const sla = slaDaysFor(shipment.service);
  const d = new Date(shipment.date);
  if (!isNaN(d.getTime())) {
    d.setDate(d.getDate() + sla);
    shipment.eta = d.toISOString().split('T')[0];
  }`
);

fs.writeFileSync('backend/src/controllers/client-portal/portal.stats.js', c);
