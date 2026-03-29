'use strict';

const TK_EXP = {
  delhi: { w250: 12, w500: 12.5, addl: 6 },
  ncr: { w250: 14, w500: 14.5, addl: 7 },
  north_cities: { w250: 17, w500: 18, addl: 10 },
  north_state: { w250: 19, w500: 20, addl: 13.5 },
  central_air: { w250: 29, w500: 40, addl: 38.5 },
  central_sfc: { w250: 22, w500: 22, addl: 16.5 },
  metro: { w250: 25, w500: 42.5, addl: 40 },
  south_west: { w250: 27.5, w500: 49.5, addl: 46 },
  ne: { w250: 46, w500: 63, addl: 55 },
  port_blair: { w250: 65, w500: 85, addl: 80 },
};

const TK_SFC = {
  delhi: { s3: 12, s10: 11, s25: 10.5, s50: 9, s100: 8.5 },
  ncr: { s3: 13.5, s10: 12.5, s25: 12, s50: 10, s100: 9.5 },
  north_cities_sfc: { s3: 18.5, s10: 17.5, s25: 16.5, s50: 14, s100: 13 },
  metro_patna_sfc: { s3: 23, s10: 22, s25: 21, s50: 20, s100: 18 },
  north_state_sfc: { s3: 25, s10: 24, s25: 23, s50: 22, s100: 20 },
  metro_sfc: { s3: 27, s10: 26, s25: 24, s50: 22, s100: 21 },
  rest_bihar_sfc: { s3: 30, s10: 27, s25: 25, s50: 23, s100: 22 },
  mh_guj_sfc: { s3: 30, s10: 29, s25: 28, s50: 26, s100: 25 },
  cg_jh_mp_sfc: { s3: 33, s10: 30, s25: 27, s50: 25, s100: 24 },
  roi_sfc: { s3: 37, s10: 36, s25: 35, s50: 33, s100: 30 },
  ne_sfc: { s3: 48, s10: 45, s25: 43, s50: 40, s100: 38 },
  kashmir_sfc: { s3: 35, s10: 33, s25: 31, s50: 28, s100: 27 },
  port_blair_sfc: { s3: 150, s10: 145, s25: 142, s50: 140, s100: 135 },
};

const TK_AIR = {
  srinagar_air: { lt5: 45, t10: 43, t25: 41, t50: 38, g50: 36 },
  metro_air: { lt5: 72, t10: 71, t25: 69, t50: 66, g50: 64 },
  metros_air: { lt5: 72, t10: 71, t25: 69, t50: 66, g50: 64 },
  central_mp_air: { lt5: 74, t10: 73, t25: 71, t50: 69, g50: 65 },
  bihar_jh_air: { lt5: 74, t10: 73, t25: 71, t50: 69, g50: 65 },
  mh_guj_air: { lt5: 80, t10: 78, t25: 76, t50: 74, g50: 71 },
  roi_air: { lt5: 84, t10: 81, t25: 78, t50: 75, g50: 72 },
  ne_air: { lt5: 115, t10: 113, t25: 110, t50: 108, g50: 105 },
  port_blair_air: { lt5: 150, t10: 145, t25: 142, t50: 140, g50: 135 },
};

const TK_PT = {
  city: { w250: 12, w500: 16, addl: 14, pkg: 28 },
  region: { w250: 36, w500: 40, addl: 30, pkg: 60 },
  zone: { w250: 40, w500: 44, addl: 36, pkg: 70 },
  metro: { w250: 60, w500: 66, addl: 54, pkg: 106 },
  roi: { w250: 78, w500: 86, addl: 72, pkg: 140 },
  spl: { w250: 94, w500: 103, addl: 87, pkg: 160 },
};

module.exports = { TK_EXP, TK_SFC, TK_AIR, TK_PT };
