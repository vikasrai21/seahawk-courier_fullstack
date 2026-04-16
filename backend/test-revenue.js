const s = require('./src/services/smartRevenue.service');
s.getSummary('2026-03-01', '2026-04-16').then(console.log).catch(console.error);
