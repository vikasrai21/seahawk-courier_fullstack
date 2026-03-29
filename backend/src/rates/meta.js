'use strict';

const COURIERS = [
  { id: 'trackon_exp', label: 'Trackon Express', group: 'Trackon', types: ['doc'], level: 'economy' },
  { id: 'trackon_pt', label: 'Trackon Prime Track', group: 'Trackon', types: ['doc', 'surface'], level: 'premium' },
  { id: 'trackon_sfc', label: 'Trackon Surface', group: 'Trackon', types: ['surface'], level: 'economy' },
  { id: 'trackon_air', label: 'Trackon Air Cargo', group: 'Trackon', types: ['air'], level: 'economy' },
  { id: 'delhivery_exp', label: 'Delhivery Express', group: 'Delhivery', types: ['doc'], level: 'economy' },
  { id: 'delhivery_std', label: 'Delhivery Standard', group: 'Delhivery', types: ['surface'], level: 'economy' },
  { id: 'b2b', label: 'B2B Courier', group: 'B2B', types: ['surface'], level: 'economy' },
  { id: 'dtdc_7x', label: 'DTDC Ecomm 7X', group: 'DTDC', types: ['doc'], level: 'economy' },
  { id: 'dtdc_7d', label: 'DTDC Ecomm 7D', group: 'DTDC', types: ['doc', 'surface'], level: 'economy' },
  { id: 'dtdc_7g', label: 'DTDC Ecomm 7G', group: 'DTDC', types: ['surface'], level: 'economy' },
  { id: 'dtdc_xdoc', label: 'DTDC Priority X (Doc)', group: 'DTDC', types: ['doc'], level: 'premium' },
  { id: 'dtdc_xndx', label: 'DTDC Priority X (Parcel)', group: 'DTDC', types: ['surface'], level: 'premium' },
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
  dtdc_7x: 'dtdc', dtdc_7d: 'dtdc', dtdc_7g: 'dtdc', dtdc_xdoc: 'dtdc', dtdc_xndx: 'dtdc',
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
