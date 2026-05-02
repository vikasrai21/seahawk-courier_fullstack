const fs = require('fs');

let r = fs.readFileSync('backend/src/routes/client-portal.routes.js', 'utf8');
r = r.replace("router.get('/shipments', protect, clientOnly, asyncHandler(portalStats.shipments));", "router.get('/shipments', protect, clientOnly, asyncHandler(portalStats.shipments));\nrouter.get('/shipments/export', protect, clientOnly, asyncHandler(portalStats.exportShipments));");
fs.writeFileSync('backend/src/routes/client-portal.routes.js', r);

let c = fs.readFileSync('backend/src/controllers/client-portal/portal.stats.js', 'utf8');
const exportFunc = `
exports.exportShipments = async (req, res) => {
  const code = await shared.resolveClientCode(req);
  const { range = '90d', status, search } = req.query;
  const { startDate, endDate } = shared.parseRange(range);

  const baseWhere = {
    clientCode: code,
    date: { gte: startDate, lte: endDate },
  };

  if (status) baseWhere.status = status;
  if (search) {
    baseWhere.OR = [
      { awb: { contains: search, mode: 'insensitive' } },
      { consignee: { contains: search, mode: 'insensitive' } },
      { destination: { contains: search, mode: 'insensitive' } },
    ];
  }

  const shipments = await prisma.shipment.findMany({
    where: baseWhere,
    orderBy: { date: 'desc' },
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=client_shipments.csv');
  const headers = ['Date', 'AWB', 'Consignee', 'Destination', 'Courier', 'Weight', 'Amount', 'Status'];
  const csvRows = [headers.join(',')];
  for (const s of shipments) {
    csvRows.push([
      \`"\${s.date || ''}"\`,
      \`"\${s.awb || ''}"\`,
      \`"\${(s.consignee || '').replace(/"/g, '""')}"\`,
      \`"\${(s.destination || '').replace(/"/g, '""')}"\`,
      \`"\${s.courier || ''}"\`,
      s.weight || 0,
      s.amount || 0,
      \`"\${s.status || ''}"\`,
    ].join(','));
  }
  res.send(csvRows.join('\\n'));
};
`;

c += '\n' + exportFunc;
fs.writeFileSync('backend/src/controllers/client-portal/portal.stats.js', c);
