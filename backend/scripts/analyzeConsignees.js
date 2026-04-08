const xlsx = require('xlsx');
const path = require('path');

const EXCEL_PATH = 'C:/Users/hp/OneDrive/Desktop/seahawk-full_stack/BILLS/SALE -MARCH_2026.xlsx';
const workbook = xlsx.readFile(EXCEL_PATH);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = xlsx.utils.sheet_to_json(sheet);

console.log(`Read ${data.length} rows.`);

const locations = new Set();
const consignees = new Set();
const pairs = [];

data.forEach(r => {
  const csg = (r['CONSIGNEE'] || '').trim().toUpperCase();
  const dst = (r['DESTINATION'] || '').trim().toUpperCase();
  
  if (csg) consignees.add(csg);
  if (dst) locations.add(dst);
  if (csg && dst) pairs.push({ consignee: csg, destination: dst });
});

console.log(`Unique Consignees: ${consignees.size}`);
console.log(`Unique Destinations: ${locations.size}`);

// Print top 20 destinations
const destCount = {};
pairs.forEach(p => {
  destCount[p.destination] = (destCount[p.destination] || 0) + 1;
});
const topDests = Object.entries(destCount).sort((a,b) => b[1] - a[1]).slice(0, 20);
console.log('\nTop 20 Destinations:', topDests);

// Save unique lists for AI training context
const fs = require('fs');
fs.writeFileSync('consignees_destinations.json', JSON.stringify({
  destinations: Array.from(locations),
  samples: pairs.slice(0, 50)
}, null, 2));

console.log('Saved to consignees_destinations.json');
