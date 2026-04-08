const xlsx = require('xlsx');
const workbook = xlsx.readFile('C:/Users/hp/OneDrive/Desktop/seahawk-full_stack/BILLS/SALE -MARCH_2026.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet);

const map = {};
data.forEach(r => {
  const c = (r['Clients'] || '').trim();
  if (!c) return;
  if (!map[c]) map[c] = { count: 0, couriers: new Set(), consignees: [], destinations: new Set(), awbs: [] };
  map[c].count++;
  map[c].couriers.add(r['COURIERS'] || '');
  if (r['CONSIGNEE']) map[c].consignees.push(r['CONSIGNEE']);
  if (r['DESTINATION']) map[c].destinations.add(r['DESTINATION']);
  if (r['Awb No']) map[c].awbs.push(String(r['Awb No']));
});

Object.entries(map).forEach(([k, v]) => {
  console.log(`\n=== ${k} (${v.count} shipments) ===`);
  console.log('Couriers:', [...v.couriers].join(', '));
  console.log('Sample AWBs:', v.awbs.slice(0, 3).join(', '));
  console.log('Sample Consignees:', [...new Set(v.consignees)].slice(0, 4).join(', '));
  console.log('Destinations:', [...v.destinations].slice(0, 5).join(', '));
});
