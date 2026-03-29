'use strict';

const DTDC_XDOC = {
  local: { w250: 13, w500: 15, addl: 15 },
  region: { w250: 16, w500: 19, addl: 19 },
  zone: { w250: 19, w500: 24, addl: 22 },
  metro: { w250: 26, w500: 39, addl: 44 },
  roi_a: { w250: 33, w500: 46, addl: 53 },
  roi_b: { w250: 36, w500: 52, addl: 57 },
  spl: { w250: 43, w500: 65, addl: 72 },
};

const DTDC_XNDX = {
  local: [27, 25, 23, 21],
  region: [32, 29, 27, 26],
  zone: [41, 39, 37, 34],
  metro: [82, 79, 76, 74],
  roi_a: [93, 88, 86, 84],
  roi_b: [103, 99, 97, 95],
  spl: [140, 134, 129, 124],
};

const DTDC_7X = {
  local: { w500: 18, addl: 13 },
  region: { w500: 23, addl: 15 },
  zone: { w500: 30, addl: 27 },
  metro: { w500: 39, addl: 42 },
  roi_a: { w500: 41, addl: 47 },
  roi_b: { w500: 45, addl: 50 },
  spl: { w500: 55, addl: 60 },
};

const DTDC_7D = {
  local: { w500: 18, addl: 13, pkg: 16 },
  region: { w500: 23, addl: 15, pkg: 19 },
  zone: { w500: 25, addl: 18, pkg: 23 },
  metro: { w500: 28, addl: 25, pkg: 38 },
  roi_a: { w500: 31, addl: 27, pkg: 44 },
  roi_b: { w500: 37, addl: 29, pkg: 47 },
  spl: { w500: 47, addl: 37, pkg: 52 },
};

const DTDC_7G = {
  local: { lt10: 14, gt10: 13 },
  region: { lt10: 15, gt10: 14 },
  zone: { lt10: 18, gt10: 16 },
  metro: { lt10: 23, gt10: 20 },
  roi_a: { lt10: 24, gt10: 21 },
  roi_b: { lt10: 25, gt10: 23 },
  spl: { lt10: 29, gt10: 27 },
};

module.exports = { DTDC_XDOC, DTDC_XNDX, DTDC_7X, DTDC_7D, DTDC_7G };
