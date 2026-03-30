'use strict';

const COURIERS = [
  { id: 'trackon_exp', label: 'Trackon Express', group: 'Trackon', types: ['doc'], level: 'economy' },
  { id: 'trackon_pt', label: 'Trackon Prime Track', group: 'Trackon', types: ['doc', 'surface'], level: 'premium' },
  { id: 'trackon_sfc', label: 'Trackon Surface', group: 'Trackon', types: ['surface'], level: 'economy' },
  { id: 'trackon_air', label: 'Trackon Air Cargo', group: 'Trackon', types: ['air'], level: 'economy' },
  { id: 'delhivery_exp', label: 'Delhivery Express', group: 'Delhivery', types: ['doc'], level: 'economy' },
  { id: 'delhivery_std', label: 'Delhivery Standard', group: 'Delhivery', types: ['surface'], level: 'economy' },
  { id: 'b2b', label: 'B2B Courier', group: 'B2B', types: ['surface'], level: 'economy' },
  { id: 'dtdc_d71', label: 'DTDC Surface D71', group: 'DTDC', types: ['doc', 'surface'], level: 'economy' },
  { id: 'dtdc_v71', label: 'DTDC PEP V71', group: 'DTDC', types: ['doc'], level: 'premium' },
  { id: 'dtdc_p7x', label: 'DTDC Priority P7X', group: 'DTDC', types: ['doc', 'surface'], level: 'premium' },
  { id: 'dtdc_exp', label: 'DTDC Express', group: 'DTDC', types: ['doc'], level: 'economy' },
  { id: 'dtdc_dsfc', label: 'DTDC D-Surface', group: 'DTDC', types: ['surface'], level: 'economy' },
  { id: 'dtdc_dair', label: 'DTDC D-Air', group: 'DTDC', types: ['air'], level: 'economy' },
  { id: 'gec_sfc', label: 'GEC Surface', group: 'GEC', types: ['surface'], level: 'economy' },
  { id: 'ltl_road', label: 'LTL Road Express', group: 'LTL', types: ['surface'], level: 'economy' },
  { id: 'bluedart_exp', label: 'BlueDart Express', group: 'BlueDart', types: ['doc'], level: 'premium' },
  { id: 'bluedart_air', label: 'BlueDart Air Cargo', group: 'BlueDart', types: ['air'], level: 'premium' },
  { id: 'bluedart_sfc', label: 'BlueDart Surface', group: 'BlueDart', types: ['surface'], level: 'premium' },
];

const RATE_VALIDITY = {
  trackon: { date: '2025-04-01', label: '01 Apr 2025' },
  primetrack: { date: '2025-04-01', label: '01 Apr 2025' },
  dtdc: { date: '2024-01-01', label: '01 Jan 2024' },
  delhivery: { date: '2024-06-01', label: 'Current' },
  gec: { date: '2024-01-16', label: '16 Jan 2024' },
  ltl: { date: '2024-06-01', label: 'Current' },
  b2b: { date: '2024-06-01', label: 'Current' },
  bluedart: { date: '2024-06-01', label: 'Current' },
};

const COURIER_TO_PARTNER = {
  trackon_exp: 'trackon', trackon_pt: 'primetrack', trackon_sfc: 'trackon', trackon_air: 'trackon',
  delhivery_exp: 'delhivery', delhivery_std: 'delhivery',
  b2b: 'b2b',
  dtdc_d71: 'dtdc', dtdc_v71: 'dtdc', dtdc_p7x: 'dtdc', dtdc_exp: 'dtdc', dtdc_dsfc: 'dtdc', dtdc_dair: 'dtdc',
  gec_sfc: 'gec', ltl_road: 'ltl',
  bluedart_exp: 'bluedart', bluedart_air: 'bluedart', bluedart_sfc: 'bluedart',
};

function getRateAge(courierId) {
  const partner = COURIER_TO_PARTNER[courierId];
  const validity = RATE_VALIDITY[partner];
  if (!validity) return { days: 0, stale: false };
  const days = Math.floor((Date.now() - new Date(validity.date)) / 86400000);
  return { days, stale: days > 90, label: validity.label };
}

module.exports = { COURIERS, RATE_VALIDITY, COURIER_TO_PARTNER, getRateAge };
