'use strict';

const DTDC_D71 = {
  local:  { w500: 12.47, addl: 11.11, pkg: 14.81 },
  region: { w500: 16.91, addl: 14.81, pkg: 17.78 },
  zone:   { w500: 21.36, addl: 18.52, pkg: 21.48 },
  metro:  { w500: 25.06, addl: 21.48, pkg: 25.93 },
  roi_a:  { w500: 27.28, addl: 25.93, pkg: 31.11 },
  roi_b:  { w500: 33.21, addl: 29.63, pkg: 37.04 },
  ne:     { w500: 36.91, addl: 34.07, pkg: 44.44 },
};

const DTDC_V71 = {
  local:  { w500: 30.99, addl: 22.22 },
  region: { w500: 48.02, addl: 25.93 },
  zone:   { w500: 62.84, addl: 34.07 },
  metro:  { w500: 81.36, addl: 62.96 },
  roi_a:  { w500: 97.65, addl: 74.07 },
  roi_b:  { w500: 101.36, addl: 77.78 },
  ne:     { w500: 105.06, addl: 81.48 },
};

const DTDC_P7X = {
  local:  { w500: 16.91, addl: 12.59, pkg: 17.78 },
  region: { w500: 21.36, addl: 14.07, pkg: 20.74 },
  zone:   { w500: 25.06, addl: 17.78, pkg: 28.89 },
  metro:  { w500: 36.91, addl: 34.81, pkg: 66.67 },
  roi_a:  { w500: 39.87, addl: 35.56, pkg: 69.63 },
  roi_b:  { w500: 40.62, addl: 37.04, pkg: 70.37 },
  ne:     { w500: 51.73, addl: 44.44, pkg: 81.48 },
};

const DTDC_EXP = {
  local:  { w250: 16, w500: 16, addl: 10 },
  region: { w250: 17, w500: 18, addl: 12 },
  zone:   { w250: 21, w500: 23, addl: 17 },
  metro:  { w250: 36, w500: 48, addl: 45 },
  roi:    { w250: 40, w500: 53, addl: 48 },
  ne:     { w250: 45, w500: 58, addl: 53 },
  spl:    { w250: 46, w500: 61, addl: 60 },
};

const DTDC_DSFC = {
  local:  14,
  region: 18,
  zone:   26,
  metro:  35,
  roi:    37,
  ne:     46,
  spl:    55,
};

const DTDC_DAIR = {
  metro:  77,
  roi:    85,
  ne:     95,
  spl:    114,
};

module.exports = { DTDC_D71, DTDC_V71, DTDC_P7X, DTDC_EXP, DTDC_DSFC, DTDC_DAIR };
