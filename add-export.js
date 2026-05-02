const fs = require('fs');

const exportFunc = `
const exportShipments = asyncHandler(async (req, res) => {
  const {
    client, clientCode, courier, status, filter, date_from, dateFrom, date_to, dateTo, q, search, sortBy, sortDir
  } = req.query;
  
  const { shipments } = await svc.getAll({
    client: client || clientCode,
    courier,
    status,
    filter,
    dateFrom: date_from || dateFrom,
    dateTo: date_to || dateTo,
    q: q || search,
    sortBy,
    sortDir,
  }, 1, 50000); // 50000 max export rows
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=shipments_export.csv');
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
});
`;

let c = fs.readFileSync('backend/src/controllers/shipment.controller.js', 'utf8');
c = c.replace('module.exports = {', exportFunc + '\nmodule.exports = { exportShipments, ');
fs.writeFileSync('backend/src/controllers/shipment.controller.js', c);
