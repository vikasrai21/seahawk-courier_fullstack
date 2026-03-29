'use strict';

const B2B_RATE = { N1: 6, N2: 6, E: 11.5, NE: 16, W1: 8.5, W2: 9.5, S1: 11.5, S2: 14.5, Central: 8.5 };

const GEC_RATES = {
  north_i: 6.25, north_ii: 6.5, north_iii: 7.75,
  west_i: 10.5, west_ii: 11.25,
  central_i: 10.5, central_ii: 12,
  south_i: 11.5, south_ii: 12.5, south_iii: 13.5,
  east_i: 10.5, east_ii: 11.25,
  ne_i: 12, ne_ii: 12, ne_iii: 12,
};

const LTL_RATES = {
  n1: 7.25, n2: 7.7, n3: 7.9, c1: 9.8, c2: 10.8, e1: 13.6, e2: 14.1,
  w1: 11.25, w2: 11.75, s1: 13.5, s2: 13.8, s3: 13.8, ne1: 22.5, ne2: 24.5,
};

const BD_EXP = {
  local: { w250: 13.5, w500: 13.5, addl: 6.5 },
  ncr: { w250: 15.5, w500: 16, addl: 8.5 },
  north: { w250: 19.5, w500: 20, addl: 15 },
  srinagar: { w250: 23.5, w500: 27.5, addl: 23 },
  bihar_jh: { w250: 23.5, w500: 45.5, addl: 42 },
  metros: { w250: 28, w500: 48.5, addl: 46 },
  roi: { w250: 31, w500: 53.5, addl: 51 },
};

const BD_AIR = {
  srinagar_air: { lt5: 51, t10: 49, t25: 47, t50: 44, g50: 41 },
  bihar_jh_air: { lt5: 80, t10: 77, t25: 69, t50: 65, g50: 58 },
  metros_air: { lt5: 85, t10: 81, t25: 78, t50: 71, g50: 65 },
  roi_air: { lt5: 96, t10: 93, t25: 90, t50: 85, g50: 80 },
};

const BD_SFC = {
  local_sfc: { lt5: 14.5, t10: 14, t25: 12, t50: 11.5, g50: 10 },
  ncr_sfc: { lt5: 16, t10: 15.5, t25: 13.5, t50: 13, g50: 12 },
  north_sfc: { lt5: 28.5, t10: 27.5, t25: 23.5, t50: 21.5, g50: 18.5 },
  metros_sfc: { lt5: 41, t10: 40, t25: 33, t50: 30, g50: 27 },
  roi_sfc: { lt5: 46, t10: 45, t25: 38, t50: 36, g50: 34 },
};

module.exports = { B2B_RATE, GEC_RATES, LTL_RATES, BD_EXP, BD_AIR, BD_SFC };
