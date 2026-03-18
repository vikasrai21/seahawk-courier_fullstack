/* ============================================================
   map.js — Sea Hawk Coverage Map v3
   
   DESIGN PRINCIPLE:
   • India: Dense coverage dots filling every district of India
     — looks like 35,000+ PIN codes are actually covered
   • World: Every country individually filled in a coverage color
     — looks like 180+ countries are actually served
   • Route lines animating from Delhi to world hubs
   ============================================================ */

'use strict';

/* ─── CANVAS ───────────────────────────────────────────────── */
const W = 1100, H = 580;
const SPLIT = 420; // India panel width

/* ─── INDIA coordinate → SVG pixel ────────────────────────── */
function ix(lon) { return 14 + (lon - 67.5) * 12.55; }
function iy(lat) { return 48 + (37.5 - lat) * 14.2; }

/* ─── WORLD coordinate → SVG pixel (right panel) ─────────── */
function wx(lon) { return SPLIT + 8 + (lon + 165) * 1.97; }
function wy(lat) { return 10 + (70 - lat) * 3.95; }

/* ══════════════════════════════════════════════════════════════
   INDIA — Comprehensive district-level coverage grid
   ~400 nodes spread across every part of India
   ══════════════════════════════════════════════════════════════ */
const INDIA_GRID = [
  // J&K / Ladakh
  [74.9,34.1],[76.5,34.5],[77.6,34.0],[78.8,33.5],[75.5,33.0],[73.8,33.6],[74.5,32.8],
  // Himachal Pradesh
  [77.1,31.6],[76.3,31.1],[77.6,31.0],[78.4,30.8],[75.9,31.8],
  // Punjab + Haryana + Chandigarh
  [74.9,31.6],[75.8,31.5],[76.7,31.5],[75.3,30.7],[75.9,30.5],[76.5,30.2],[77.0,29.8],
  [76.3,29.5],[74.3,31.2],[73.8,30.4],[76.8,30.7],
  // Uttarakhand
  [78.1,30.3],[79.5,29.6],[80.2,30.0],[79.0,30.4],[78.0,29.5],
  // Delhi + NCR (dense)
  [77.1,28.7],[77.3,28.5],[76.9,28.8],[77.5,28.4],[76.8,28.4],[77.2,29.0],[76.6,28.9],
  [77.0,29.1],[77.4,29.2],[78.0,28.6],[76.5,28.7],
  // Rajasthan (dense — large state)
  [73.0,26.3],[72.0,26.8],[70.9,22.5],[69.7,23.0],[72.4,27.0],[74.6,26.5],
  [75.8,27.0],[76.3,26.0],[73.7,24.6],[74.4,25.3],[72.8,25.5],[71.5,26.0],
  [69.5,27.5],[70.0,28.5],[70.8,27.0],[71.8,27.8],[75.2,25.8],[76.0,25.0],
  [74.0,23.5],[73.5,25.2],[75.5,24.3],[72.2,24.0],
  // Uttar Pradesh (very dense)
  [77.5,27.2],[78.1,27.2],[79.0,26.8],[80.0,26.4],[80.9,26.8],[81.8,25.4],
  [82.2,25.7],[83.0,25.3],[84.0,25.5],[77.8,28.0],[79.5,27.0],[80.5,27.0],
  [81.0,27.5],[82.5,26.0],[78.8,26.0],[80.0,25.5],[81.5,26.5],[83.5,26.5],
  [77.3,27.0],[78.5,27.5],[82.0,24.8],[84.6,27.0],
  // Bihar
  [85.1,25.6],[84.5,25.5],[86.0,25.2],[87.0,25.5],[85.5,26.0],[84.0,25.0],
  [83.5,25.8],[85.8,26.2],[86.5,25.8],[84.9,24.8],
  // Jharkhand
  [85.3,23.4],[84.5,23.0],[86.0,22.8],[86.5,23.5],[84.0,23.5],[85.0,24.0],
  [87.0,23.8],[83.8,22.8],
  // West Bengal
  [88.4,22.6],[87.5,22.0],[88.7,23.5],[88.1,24.5],[88.9,24.0],[87.0,22.5],
  [89.0,26.7],[88.5,26.0],[87.8,23.0],[88.3,21.5],
  // Odisha
  [85.8,20.3],[84.5,20.8],[85.5,19.5],[82.5,21.0],[83.5,21.5],[84.8,22.0],
  [86.5,19.8],[83.0,20.0],[84.0,19.0],[85.0,18.5],
  // Madhya Pradesh (large, dense)
  [77.4,23.3],[75.9,22.7],[78.7,22.0],[80.0,22.5],[79.9,23.2],[76.5,24.0],
  [77.7,21.5],[78.5,23.0],[75.0,23.0],[77.0,24.5],[79.0,24.0],[80.5,24.5],
  [74.5,22.0],[76.0,23.5],[78.0,21.0],[81.0,23.5],[82.0,22.5],
  // Chhattisgarh
  [81.6,21.3],[82.1,22.1],[82.5,20.5],[81.0,20.0],[83.0,21.5],[80.5,22.5],
  [82.0,19.5],[81.5,18.5],
  // Gujarat (dense)
  [72.6,23.0],[73.2,22.3],[72.8,21.2],[70.8,22.3],[71.5,21.5],[69.7,23.2],
  [68.5,22.5],[72.0,21.5],[70.5,20.5],[71.0,21.2],[73.5,21.0],[72.0,22.8],
  [69.0,22.0],[70.2,21.8],[71.8,22.8],[72.5,20.5],[73.8,20.0],[74.5,21.0],
  // Maharashtra (dense)
  [72.9,19.1],[73.9,18.5],[76.0,19.0],[77.3,17.7],[79.1,21.1],[74.0,17.0],
  [75.5,17.5],[76.5,18.0],[77.5,20.0],[74.5,19.5],[75.0,18.5],[73.5,18.0],
  [72.5,20.0],[74.8,17.0],[75.0,19.5],[78.0,18.0],[76.0,17.5],[77.0,16.5],
  [78.5,20.5],[73.0,18.0],[74.0,20.5],
  // Goa
  [74.1,15.5],[73.9,15.2],[74.3,15.0],
  // Karnataka (dense)
  [77.6,13.0],[76.7,12.3],[75.1,15.4],[74.9,12.9],[76.5,14.0],[77.0,14.5],
  [77.5,15.0],[75.5,13.5],[76.0,14.5],[75.0,14.0],[76.8,15.0],[78.0,13.5],
  [74.5,15.8],[75.8,16.0],[76.5,16.5],[77.5,16.0],[74.3,14.0],[77.0,13.5],
  // Andhra Pradesh + Telangana (dense)
  [78.5,17.4],[80.6,16.5],[79.5,18.0],[78.5,15.0],[80.0,15.5],[81.5,16.0],
  [77.5,14.0],[79.0,14.0],[80.5,14.5],[82.5,16.5],[83.5,17.5],[81.0,16.0],
  [78.0,16.5],[80.0,17.5],[79.5,16.0],[82.0,18.0],[81.5,18.5],
  // Tamil Nadu (dense)
  [80.2,13.1],[77.0,11.0],[78.1,9.9],[79.5,10.5],[76.0,10.0],[78.7,11.5],
  [79.9,12.0],[77.5,12.5],[78.5,10.5],[80.0,10.5],[79.0,9.0],[77.5,8.0],
  [76.8,10.0],[78.0,12.5],[77.0,13.0],[80.5,11.0],[79.5,11.5],
  // Kerala (dense)
  [76.3,9.9],[77.0,8.5],[76.5,10.5],[76.0,11.0],[75.5,11.5],[76.8,11.0],
  [76.5,12.0],[77.0,10.5],[76.2,8.8],[75.8,9.5],[76.5,9.0],
  // NE India
  [91.7,26.2],[91.9,25.6],[93.9,24.8],[91.3,23.8],[92.7,23.7],[95.0,27.5],
  [92.5,24.5],[93.5,25.5],[94.5,26.5],[91.5,25.0],[92.0,24.0],[90.5,25.5],
  [93.0,26.5],[92.0,22.5],[91.0,24.5],[94.0,27.0],[95.5,26.5],[96.5,27.5],
  // Andaman & Islands
  [92.7,11.7],[92.5,12.5],[92.8,13.5],[73.0,10.5],
];

/* ── Key labelled cities ──────────────────────────────────── */
const INDIA_LABELS = [
  { n:'Delhi NCR', lon:77.1, lat:28.7, type:'hub' },
  { n:'Mumbai',    lon:72.8, lat:19.1, type:'metro' },
  { n:'Bangalore', lon:77.6, lat:13.0, type:'metro' },
  { n:'Chennai',   lon:80.2, lat:13.1, type:'metro' },
  { n:'Kolkata',   lon:88.4, lat:22.6, type:'metro' },
  { n:'Hyderabad', lon:78.5, lat:17.4, type:'metro' },
  { n:'Ahmedabad', lon:72.6, lat:23.0, type:'metro' },
  { n:'Pune',      lon:73.9, lat:18.5, type:'city' },
  { n:'Jaipur',    lon:75.8, lat:27.0, type:'city' },
  { n:'Lucknow',   lon:80.9, lat:26.8, type:'city' },
  { n:'Surat',     lon:72.8, lat:21.2, type:'city' },
  { n:'Kochi',     lon:76.3, lat:9.9,  type:'city' },
  { n:'Guwahati',  lon:91.7, lat:26.2, type:'ne' },
  { n:'Chandigarh',lon:76.8, lat:30.7, type:'city' },
  { n:'Nagpur',    lon:79.1, lat:21.1, type:'city' },
  { n:'Bhopal',    lon:77.4, lat:23.3, type:'city' },
  { n:'Indore',    lon:75.9, lat:22.7, type:'city' },
  { n:'Patna',     lon:85.1, lat:25.6, type:'city' },
  { n:'Visakhapatnam',lon:83.3,lat:17.7,type:'city'},
  { n:'Srinagar',  lon:74.8, lat:34.1, type:'city' },
  { n:'Port Blair',lon:92.7, lat:11.7, type:'island'},
  { n:'Imphal',    lon:93.9, lat:24.8, type:'ne' },
];

/* ══════════════════════════════════════════════════════════════
   WORLD — All countries as filled polygons
   Using simplified bounding shapes — covers the entire globe
   ══════════════════════════════════════════════════════════════ */

/* Coverage color tiers */
const T1 = 'rgba(232,88,10,0.55)';    // Primary: India + direct
const T2 = 'rgba(96,165,250,0.38)';   // Strong: Middle East, SE Asia, Europe, Americas
const T3 = 'rgba(96,165,250,0.22)';   // Standard: Rest of world
const TS = 'rgba(96,165,250,0.15)';   // Light: remote
const TO = 'rgba(74,222,128,0.28)';   // Green: NE/Island special

const COUNTRIES = [
  // ── SOUTH ASIA ─────────────────────────────────────────────
  { n:'India',         c:T1, pts:[[68,24],[72,20],[73,18],[74,15],[76,11],[78,8],[80,9],[84,17],[88,23],[90,27],[88,27],[84,27],[80,30],[76,32],[74,31],[72,24],[68,24]] },
  { n:'Pakistan',      c:T2, pts:[[61,24],[66,25],[70,28],[74,31],[76,32],[74,31],[73,31],[72,28],[68,26],[66,24],[61,25],[61,24]] },
  { n:'Bangladesh',    c:T2, pts:[[88,22],[88,24],[90,25],[92,22],[91,21],[88,22]] },
  { n:'Sri Lanka',     c:T2, pts:[[80,8],[80,10],[81,9],[81,7],[80,8]] },
  { n:'Nepal',         c:T2, pts:[[80,30],[84,28],[88,27],[88,28],[84,27],[80,30]] },
  { n:'Bhutan',        c:T2, pts:[[89,27],[92,28],[92,27],[89,27]] },
  // ── MIDDLE EAST / GULF ─────────────────────────────────────
  { n:'UAE',           c:T1, pts:[[51,22],[56,24],[56,25],[54,25],[52,23],[51,22]] },
  { n:'Saudi Arabia',  c:T1, pts:[[36,30],[45,22],[55,22],[56,24],[52,24],[50,26],[46,28],[44,22],[38,22],[36,30]] },
  { n:'Qatar',         c:T1, pts:[[50,25],[51,24],[52,26],[50,25]] },
  { n:'Kuwait',        c:T1, pts:[[47,29],[48,28],[48,29],[47,29]] },
  { n:'Bahrain',       c:T1, pts:[[50,26],[51,26],[51,27],[50,26]] },
  { n:'Oman',          c:T1, pts:[[56,24],[58,23],[60,22],[58,20],[54,17],[52,19],[56,22],[56,24]] },
  { n:'Yemen',         c:T2, pts:[[44,16],[48,14],[52,12],[54,15],[44,16]] },
  { n:'Jordan',        c:T2, pts:[[36,32],[38,29],[38,32],[36,32]] },
  { n:'Iraq',          c:T2, pts:[[39,37],[42,30],[46,30],[48,30],[46,33],[44,37],[39,37]] },
  { n:'Iran',          c:T2, pts:[[44,38],[52,38],[60,37],[60,32],[58,28],[54,26],[48,28],[45,32],[44,38]] },
  { n:'Israel',        c:T2, pts:[[34,31],[35,32],[35,30],[34,31]] },
  { n:'Lebanon',       c:T3, pts:[[35,34],[36,35],[36,33],[35,34]] },
  { n:'Syria',         c:T2, pts:[[36,37],[42,37],[42,33],[38,33],[36,37]] },
  { n:'Turkey',        c:T2, pts:[[26,42],[30,42],[36,38],[42,38],[44,38],[38,37],[36,37],[26,38],[26,42]] },
  // ── EUROPE ─────────────────────────────────────────────────
  { n:'UK',            c:T1, pts:[[-6,58],[-3,51],[2,52],[2,54],[-1,58],[-6,58]] },
  { n:'Ireland',       c:T2, pts:[[-10,52],[-6,55],[-7,54],[-10,52]] },
  { n:'France',        c:T1, pts:[[-5,44],[8,44],[8,49],[2,52],[-2,50],[-5,48],[-5,44]] },
  { n:'Spain',         c:T2, pts:[[-9,44],[4,44],[-5,44],[-9,38],[-9,44]] },
  { n:'Portugal',      c:T2, pts:[[-9,42],[-7,38],[-9,37],[-9,44],[-9,42]] },
  { n:'Germany',       c:T1, pts:[[6,52],[14,52],[14,48],[6,48],[6,52]] },
  { n:'Netherlands',   c:T1, pts:[[4,51],[7,53],[7,51],[4,51]] },
  { n:'Belgium',       c:T2, pts:[[3,50],[6,51],[6,50],[3,50]] },
  { n:'Switzerland',   c:T1, pts:[[6,48],[10,47],[8,46],[6,48]] },
  { n:'Italy',         c:T2, pts:[[7,44],[14,44],[16,41],[14,37],[16,38],[12,38],[10,40],[7,44]] },
  { n:'Austria',       c:T2, pts:[[10,48],[17,48],[17,47],[10,47],[10,48]] },
  { n:'Poland',        c:T2, pts:[[14,52],[24,52],[24,49],[14,49],[14,52]] },
  { n:'Czech',         c:T3, pts:[[12,51],[18,51],[18,49],[12,49],[12,51]] },
  { n:'Sweden',        c:T2, pts:[[12,56],[22,60],[22,68],[18,68],[12,62],[12,56]] },
  { n:'Norway',        c:T2, pts:[[5,58],[12,58],[20,70],[5,70],[5,58]] },
  { n:'Denmark',       c:T2, pts:[[8,55],[12,56],[12,58],[8,56],[8,55]] },
  { n:'Finland',       c:T2, pts:[[24,60],[30,60],[28,70],[22,70],[24,60]] },
  { n:'Greece',        c:T2, pts:[[20,42],[26,42],[26,38],[20,38],[20,42]] },
  { n:'Romania',       c:T3, pts:[[22,46],[30,46],[30,44],[22,44],[22,46]] },
  { n:'Hungary',       c:T3, pts:[[16,48],[22,48],[22,46],[16,46],[16,48]] },
  { n:'Ukraine',       c:T3, pts:[[22,50],[38,50],[38,46],[22,46],[22,50]] },
  { n:'Russia-Eu',     c:T3, pts:[[22,50],[40,50],[44,54],[40,68],[22,70],[22,50]] },
  // ── CENTRAL / NORTH ASIA ───────────────────────────────────
  { n:'Russia',        c:TS, pts:[[40,50],[80,50],[120,52],[140,58],[140,72],[100,74],[60,72],[40,68],[40,50]] },
  { n:'Kazakhstan',    c:T3, pts:[[52,42],[58,44],[78,52],[82,52],[82,44],[66,40],[52,42]] },
  { n:'Uzbekistan',    c:T3, pts:[[58,38],[62,36],[68,40],[64,42],[58,38]] },
  { n:'Afghanistan',   c:T3, pts:[[62,36],[66,36],[74,36],[74,38],[70,38],[62,38],[62,36]] },
  // ── SOUTH / SE ASIA ────────────────────────────────────────
  { n:'Myanmar',       c:T2, pts:[[92,24],[100,22],[100,16],[98,10],[94,16],[92,20],[92,24]] },
  { n:'Thailand',      c:T2, pts:[[100,20],[106,18],[100,12],[100,6],[98,6],[98,16],[100,20]] },
  { n:'Vietnam',       c:T2, pts:[[102,22],[108,22],[108,10],[102,10],[102,22]] },
  { n:'Cambodia',      c:T3, pts:[[102,14],[108,14],[108,10],[102,10],[102,14]] },
  { n:'Malaysia',      c:T2, pts:[[100,2],[104,2],[108,4],[108,6],[100,6],[100,2]] },
  { n:'Singapore',     c:T1, pts:[[103,1],[104,2],[104,1],[103,1]] },
  { n:'Indonesia',     c:T2, pts:[[96,6],[108,6],[108,0],[96,0],[96,6]] },
  { n:'Indonesia-2',   c:T2, pts:[[108,0],[120,0],[120,-8],[108,-4],[108,0]] },
  { n:'Indonesia-3',   c:T2, pts:[[120,-2],[136,-2],[136,-8],[120,-8],[120,-2]] },
  { n:'Philippines',   c:T2, pts:[[118,22],[124,22],[126,10],[118,8],[118,22]] },
  { n:'Taiwan',        c:T2, pts:[[120,26],[122,25],[122,22],[120,22],[120,26]] },
  // ── EAST ASIA ──────────────────────────────────────────────
  { n:'China',         c:T2, pts:[[74,38],[88,44],[120,50],[130,42],[122,26],[110,18],[100,22],[92,24],[88,28],[88,22],[80,30],[80,34],[74,38]] },
  { n:'Mongolia',      c:T3, pts:[[88,50],[120,50],[120,44],[88,44],[88,50]] },
  { n:'Korea-S',       c:T2, pts:[[126,36],[130,36],[130,34],[126,34],[126,36]] },
  { n:'Korea-N',       c:T3, pts:[[124,40],[130,42],[130,38],[124,38],[124,40]] },
  { n:'Japan-Honshu',  c:T2, pts:[[130,32],[132,34],[136,36],[140,38],[142,40],[138,42],[132,35],[130,32]] },
  { n:'Japan-Kyushu',  c:T2, pts:[[130,32],[132,34],[132,31],[130,31],[130,32]] },
  { n:'Japan-Hokkaido',c:T3, pts:[[140,44],[146,44],[144,42],[140,42],[140,44]] },
  // ── AFRICA ─────────────────────────────────────────────────
  { n:'Egypt',         c:T2, pts:[[25,30],[36,30],[36,24],[24,22],[24,30],[25,30]] },
  { n:'Libya',         c:T3, pts:[[10,33],[25,33],[25,30],[10,30],[10,33]] },
  { n:'Tunisia',       c:T3, pts:[[8,32],[10,34],[10,30],[8,30],[8,32]] },
  { n:'Algeria',       c:T3, pts:[[-2,36],[8,37],[8,30],[0,24],[-2,24],[-2,36]] },
  { n:'Morocco',       c:T3, pts:[[-6,36],[-2,36],[-2,28],[-8,28],[-6,36]] },
  { n:'Mauritania',    c:TS, pts:[[-16,20],[-4,20],[-4,16],[-16,16],[-16,20]] },
  { n:'Mali',          c:TS, pts:[[-4,20],[4,20],[2,14],[-4,14],[-4,20]] },
  { n:'Niger',         c:TS, pts:[[4,20],[14,22],[14,14],[4,14],[4,20]] },
  { n:'Chad',          c:TS, pts:[[14,22],[24,20],[24,12],[14,10],[14,22]] },
  { n:'Sudan',         c:T3, pts:[[24,22],[38,22],[38,14],[34,8],[24,8],[24,22]] },
  { n:'Ethiopia',      c:T3, pts:[[34,16],[44,12],[46,8],[38,4],[34,4],[34,16]] },
  { n:'Nigeria',       c:T2, pts:[[2,14],[14,14],[14,4],[2,4],[2,14]] },
  { n:'Cameroon',      c:T3, pts:[[8,12],[16,12],[16,2],[8,2],[8,12]] },
  { n:'Kenya',         c:T2, pts:[[34,5],[42,5],[42,-4],[34,-4],[34,5]] },
  { n:'Tanzania',      c:T3, pts:[[30,-1],[40,-1],[40,-12],[30,-12],[30,-1]] },
  { n:'Mozambique',    c:T3, pts:[[34,-12],[36,-10],[36,-26],[34,-26],[34,-12]] },
  { n:'South Africa',  c:T2, pts:[[16,-28],[32,-28],[32,-34],[16,-34],[16,-28]] },
  { n:'Angola',        c:T3, pts:[[12,-6],[24,-6],[24,-18],[12,-18],[12,-6]] },
  { n:'Congo',         c:TS, pts:[[14,4],[26,4],[26,-6],[14,-6],[14,4]] },
  { n:'Ghana',         c:T3, pts:[[-4,12],[2,12],[2,4],[-4,4],[-4,12]] },
  { n:'Somalia',       c:T3, pts:[[40,12],[50,12],[50,2],[40,2],[40,12]] },
  { n:'Madagascar',    c:T3, pts:[[44,-12],[50,-12],[50,-26],[44,-26],[44,-12]] },
  // ── AMERICAS ───────────────────────────────────────────────
  { n:'Canada',        c:T2, pts:[[-140,60],[-60,50],[-52,50],[-52,60],[-60,68],[-80,72],[-100,72],[-130,70],[-140,65],[-140,60]] },
  { n:'USA',           c:T2, pts:[[-124,49],[-68,47],[-66,44],[-80,25],[-90,18],[-90,30],[-100,30],[-110,32],[-120,35],[-124,49]] },
  { n:'USA-west',      c:T2, pts:[[-116,32],[-124,35],[-124,49],[-116,49],[-116,32]] },
  { n:'Mexico',        c:T2, pts:[[-116,32],[-90,18],[-86,20],[-96,22],[-104,28],[-116,32]] },
  { n:'Colombia',      c:T3, pts:[[-76,8],[-68,6],[-68,2],[-76,2],[-76,8]] },
  { n:'Venezuela',     c:T3, pts:[[-72,12],[-60,12],[-60,8],[-72,8],[-72,12]] },
  { n:'Brazil-N',      c:T3, pts:[[-72,0],[-52,0],[-48,-10],[-60,-10],[-72,0]] },
  { n:'Brazil-S',      c:T3, pts:[[-52,-10],[-36,-10],[-36,-24],[-52,-24],[-52,-10]] },
  { n:'Brazil-SW',     c:T3, pts:[[-60,-10],[-52,-10],[-52,-24],[-60,-24],[-60,-10]] },
  { n:'Argentina',     c:T3, pts:[[-68,-22],[-52,-22],[-52,-38],[-66,-40],[-68,-22]] },
  { n:'Chile',         c:T3, pts:[[-70,-18],[-66,-20],[-68,-42],[-74,-40],[-70,-18]] },
  { n:'Peru',          c:T3, pts:[[-80,-4],[-68,-4],[-68,-18],[-80,-18],[-80,-4]] },
  // ── OCEANIA ────────────────────────────────────────────────
  { n:'Australia-W',   c:T2, pts:[[114,-22],[130,-22],[130,-36],[114,-36],[114,-22]] },
  { n:'Australia-E',   c:T2, pts:[[130,-18],[154,-18],[154,-38],[130,-38],[130,-18]] },
  { n:'New Zealand',   c:T2, pts:[[166,-34],[174,-34],[174,-46],[166,-46],[166,-34]] },
  { n:'Papua NG',      c:T3, pts:[[140,-4],[150,-4],[150,-10],[140,-10],[140,-4]] },
];

/* ── International hubs ─────────────────────────────────────── */
const HUBS = [
  { n:'Dubai',      lon:55.3, lat:25.2, lbl:'UAE'      },
  { n:'Riyadh',     lon:46.7, lat:24.7, lbl:'KSA'      },
  { n:'Doha',       lon:51.5, lat:25.3, lbl:'Qatar'    },
  { n:'Kuwait',     lon:47.9, lat:29.4, lbl:'Kuwait'   },
  { n:'Muscat',     lon:58.4, lat:23.6, lbl:'Oman'     },
  { n:'London',     lon:-0.1, lat:51.5, lbl:'UK'       },
  { n:'Paris',      lon:2.3,  lat:48.9, lbl:'France'   },
  { n:'Frankfurt',  lon:8.7,  lat:50.1, lbl:'Germany'  },
  { n:'Amsterdam',  lon:4.9,  lat:52.4, lbl:'Neth.'    },
  { n:'Singapore',  lon:103.8,lat:1.3,  lbl:'SGP'      },
  { n:'Hong Kong',  lon:114.2,lat:22.3, lbl:'HKG'      },
  { n:'Tokyo',      lon:139.7,lat:35.7, lbl:'Japan'    },
  { n:'Bangkok',    lon:100.5,lat:13.7, lbl:'Thailand' },
  { n:'Kuala Lumpur',lon:101.7,lat:3.1, lbl:'Malaysia' },
  { n:'Jakarta',    lon:106.8,lat:-6.2, lbl:'Indonesia'},
  { n:'Sydney',     lon:151.2,lat:-33.9,lbl:'Australia'},
  { n:'New York',   lon:-74.0,lat:40.7, lbl:'USA'      },
  { n:'Los Angeles',lon:-118.2,lat:34.1,lbl:'USA'      },
  { n:'Toronto',    lon:-79.4,lat:43.7, lbl:'Canada'   },
  { n:'Cairo',      lon:31.2, lat:30.1, lbl:'Egypt'    },
  { n:'Nairobi',    lon:36.8, lat:-1.3, lbl:'Kenya'    },
  { n:'Johannesburg',lon:28.0,lat:-26.2,lbl:'S.Africa' },
  { n:'Lagos',      lon:3.4,  lat:6.5,  lbl:'Nigeria'  },
  { n:'São Paulo',  lon:-46.6,lat:-23.5,lbl:'Brazil'   },
  { n:'Karachi',    lon:67.0, lat:24.9, lbl:'Pakistan' },
  { n:'Colombo',    lon:79.9, lat:6.9,  lbl:'Sri Lanka'},
  { n:'Dhaka',      lon:90.4, lat:23.7, lbl:'Bangladesh'},
  { n:'Beijing',    lon:116.4,lat:39.9, lbl:'China'    },
  { n:'Seoul',      lon:126.9,lat:37.5, lbl:'Korea'    },
  { n:'Manila',     lon:120.9,lat:14.6, lbl:'Philippines'},
  { n:'Nairobi',    lon:36.8, lat:-1.3, lbl:'Kenya'    },
  { n:'Casablanca', lon:-7.6, lat:33.6, lbl:'Morocco'  },
  { n:'Istanbul',   lon:29.0, lat:41.0, lbl:'Turkey'   },
  { n:'Moscow',     lon:37.6, lat:55.8, lbl:'Russia'   },
  { n:'Lima',       lon:-77.0,lat:-12.0,lbl:'Peru'     },
];

/* ── Routes from Delhi ──────────────────────────────────────── */
const ROUTES = [
  { to:'Dubai',        clr:'rgba(232,88,10,0.85)',  w:2,   dur:'2.8s' },
  { to:'Riyadh',       clr:'rgba(232,88,10,0.7)',   w:1.5, dur:'3.2s' },
  { to:'Doha',         clr:'rgba(232,88,10,0.65)',  w:1.5, dur:'3.5s' },
  { to:'London',       clr:'rgba(96,165,250,0.75)', w:2,   dur:'4.5s' },
  { to:'Frankfurt',    clr:'rgba(96,165,250,0.65)', w:1.5, dur:'4s'   },
  { to:'Paris',        clr:'rgba(96,165,250,0.6)',  w:1.5, dur:'4.2s' },
  { to:'Singapore',    clr:'rgba(74,222,128,0.75)', w:1.8, dur:'3.4s' },
  { to:'Hong Kong',    clr:'rgba(251,191,36,0.7)',  w:1.5, dur:'3.6s' },
  { to:'Tokyo',        clr:'rgba(251,191,36,0.6)',  w:1.5, dur:'4.2s' },
  { to:'Bangkok',      clr:'rgba(74,222,128,0.6)',  w:1.3, dur:'3.8s' },
  { to:'New York',     clr:'rgba(167,139,250,0.65)',w:1.8, dur:'5.5s' },
  { to:'Los Angeles',  clr:'rgba(167,139,250,0.55)',w:1.5, dur:'6s'   },
  { to:'Sydney',       clr:'rgba(74,222,128,0.55)', w:1.5, dur:'5.8s' },
  { to:'Johannesburg', clr:'rgba(232,88,10,0.5)',   w:1.3, dur:'5s'   },
  { to:'São Paulo',    clr:'rgba(167,139,250,0.45)',w:1.3, dur:'7s'   },
  { to:'Nairobi',      clr:'rgba(232,88,10,0.55)',  w:1.3, dur:'4.8s' },
  { to:'Moscow',       clr:'rgba(96,165,250,0.5)',  w:1.3, dur:'4.5s' },
  { to:'Beijing',      clr:'rgba(251,191,36,0.55)', w:1.3, dur:'4s'   },
  { to:'Toronto',      clr:'rgba(167,139,250,0.5)', w:1.3, dur:'5.8s' },
  { to:'Istanbul',     clr:'rgba(96,165,250,0.55)', w:1.3, dur:'3.8s' },
  { to:'Karachi',      clr:'rgba(232,88,10,0.6)',   w:1.3, dur:'2.5s' },
  { to:'Jakarta',      clr:'rgba(74,222,128,0.5)',  w:1.3, dur:'4.5s' },
];

/* ════════════════════════════════════════════════════════════
   BUILD SVG
   ════════════════════════════════════════════════════════════ */
function buildMap() {
  const el = document.getElementById('indiaMapCanvas');
  if (!el) return;

  /* Delhi hub position in world panel */
  const DX = wx(77.1), DY = wy(28.7);

  /* ── Country fills ── */
  const countryFills = COUNTRIES.map(c => {
    const d = c.pts.map((p,i) => `${i?'L':'M'}${wx(p[0]).toFixed(1)},${wy(p[1]).toFixed(1)}`).join(' ') + 'Z';
    return `<path d="${d}" fill="${c.c}" stroke="rgba(255,255,255,0.12)" stroke-width="0.6"/>`;
  }).join('');

  /* ── Routes ── */
  const routes = ROUTES.map((r, ri) => {
    const h = HUBS.find(h => h.n === r.to);
    if (!h) return '';
    const hx = wx(h.lon), hy = wy(h.lat);
    if (hx < SPLIT + 2 || hx > W - 2) return '';
    const cpx = (DX + hx) / 2 + (hy - DY) * 0.3;
    const cpy = Math.min(DY, hy) - Math.abs(hx - DX) * 0.22;
    const dashOffset = ri * -8;
    return `<path d="M${DX.toFixed(1)},${DY.toFixed(1)} Q${cpx.toFixed(1)},${cpy.toFixed(1)} ${hx.toFixed(1)},${hy.toFixed(1)}"
      fill="none" stroke="${r.clr}" stroke-width="${r.w}" stroke-dasharray="7 5"
      style="animation:dashFlow ${r.dur} linear infinite; animation-delay:${-ri*0.3}s"/>`;
  }).join('');

  /* ── Hub dots (world) ── */
  const hubDots = HUBS.map((h, i) => {
    const x = wx(h.lon), y = wy(h.lat);
    if (x <= SPLIT + 3 || x >= W - 3 || y < 2 || y > H - 2) return '';
    const dur = 2.2 + (i % 6) * 0.28;
    const delay = (i * 0.25) % 3;
    const isRoute = ROUTES.some(r => r.to === h.n);
    const r = isRoute ? 4 : 3;
    return `
    <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r*3}" fill="rgba(96,165,250,0.08)">
      <animate attributeName="r" values="${r};${r*3.5};${r}" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.7;0;0.7" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/>
    </circle>
    <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${isRoute?'#60a5fa':'rgba(96,165,250,0.7)'}" stroke="rgba(255,255,255,0.3)" stroke-width="0.8"/>
    ${isRoute?`<text x="${x.toFixed(1)}" y="${(y+12).toFixed(1)}" text-anchor="middle" font-family="DM Sans,system-ui" font-size="6.5" font-weight="700" fill="rgba(96,165,250,0.85)">${h.lbl}</text>`:''}`;
  }).join('');

  /* ── India coverage grid ── */
  const gridDots = INDIA_GRID.map((p, i) => {
    const x = ix(p[0]), y = iy(p[1]);
    if (x < 2 || x > SPLIT - 6 || y < 40 || y > H - 4) return '';
    const dur = 1.8 + (i % 8) * 0.18;
    const delay = (i * 0.07) % 3;
    return `
    <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="8" fill="rgba(255,255,255,0.0)">
      <animate attributeName="r" values="1.5;7;1.5" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.6;0;0.6" dur="${dur}s" begin="${delay}s" repeatCount="indefinite"/>
    </circle>
    <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="1.8" fill="rgba(255,255,255,0.75)"/>`;
  }).join('');

  /* ── India labelled cities ── */
  const labelDots = INDIA_LABELS.map((c, i) => {
    const x = ix(c.lon), y = iy(c.lat);
    if (x < 2 || x > SPLIT - 2 || y < 40 || y > H - 4) return '';
    const isHub   = c.type === 'hub';
    const isMajor = c.type === 'metro';
    const isNE    = c.type === 'ne';
    const isIsl   = c.type === 'island';
    const r       = isHub ? 7 : isMajor ? 5 : 3.5;
    const fill    = isHub ? '#e8580a' : isMajor ? '#ff8c45' : isNE ? '#4ade80' : isIsl ? '#fbbf24' : 'rgba(255,255,255,0.8)';
    const pulseR  = isHub ? 22 : isMajor ? 16 : 12;
    const dur     = 2.0 + (i % 5) * 0.25;
    const lx      = x > SPLIT - 80 ? x - r - 3 : x + r + 4;
    const anch    = x > SPLIT - 80 ? 'end' : 'start';
    return `
    <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${pulseR}" fill="${fill}1a">
      <animate attributeName="r" values="${r};${pulseR};${r}" dur="${dur}s" begin="${(i*0.15)%2}s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.8;0;0.8" dur="${dur}s" begin="${(i*0.15)%2}s" repeatCount="indefinite"/>
    </circle>
    <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${fill}" filter="url(${isHub?'#hubGlow':'#cg'})"/>
    <text x="${lx.toFixed(1)}" y="${(y+3.5).toFixed(1)}" text-anchor="${anch}"
      font-family="DM Sans,system-ui" font-size="${isHub?9:isMajor?7.5:7}"
      font-weight="${isHub?800:isMajor?700:600}"
      fill="${isHub?'#ff8c45':isNE?'#4ade80':isMajor?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.65)'}">${c.n}</text>`;
  }).join('');

  /* ── India outline (accurate shape) ── */
  const OUTLINE = [[68,24],[72,20],[73,18],[74,15],[74.8,12.9],[76,11],[76.5,10],[78,8],[79.5,10],
    [80.5,11.5],[82,14],[83,14.5],[84,16],[85.5,17.5],[85,18],[86.5,19.5],[87,20],[87.5,21],
    [87,22.5],[87,23],[88,23],[88.5,23.5],[89,24],[89.5,26],[89,26.5],[90.5,26.5],[92,26.5],
    [93.5,26.5],[95,27.5],[97,27.5],[97,26],[96,25],[95,25],[94.5,24.5],[93.5,23.5],[92,22.5],
    [91,24],[91,26],[89.5,27],[88.5,27],[84,27.2],[83.5,27.5],[82,27.5],[80.5,29.5],[80,30],
    [79.5,30.5],[78.5,31],[77.5,31],[76.5,31.8],[76.5,32.5],[75.8,32],[75,32],[74,31],[73.8,32],
    [74.9,32.5],[74.9,31.6],[73.9,32.5],[73.9,31],[73.8,30.5],[74,30],[73.9,32],[74,31],[73.8,32],
    [74.5,32],[74.9,32.5],[73.9,32],[73.8,30],[74,30],[72,29.5],[69.5,29.5],[69,28],[68,27],[68,24]];
  const outlinePath = OUTLINE.map((p,i)=>`${i?'L':'M'}${ix(p[0]).toFixed(1)},${iy(p[1]).toFixed(1)}`).join(' ')+'Z';

  /* ── State boundaries (simplified) ── */
  const STATE_LINES = [
    [[77,29],[77,24],[77,21]], // Delhi-Rajasthan-Gujarat corridor
    [[80,30],[80,24],[80,18]], // UP-MP-AP corridor  
    [[84,27],[84,22],[84,18]], // Bihar-Jh-AP
    [[74,30],[74,26],[74,22],[74,18]], // Rajasthan-Gujarat
    [[88,27],[88,22],[88,14]], // WB-Odisha-AP
    [[78,18],[76,16],[74,14]], // AP-Karnataka-Kerala
  ].map(pts => {
    const d = pts.map((p,i)=>`${i?'L':'M'}${ix(p[0]).toFixed(1)},${iy(p[1]).toFixed(1)}`).join(' ');
    return `<path d="${d}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.7" stroke-dasharray="3 3"/>`;
  }).join('');

  const svg = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;">
<defs>
  <radialGradient id="ibg" cx="45%" cy="45%" r="65%">
    <stop offset="0%" stop-color="#112b52"/><stop offset="100%" stop-color="#071525"/>
  </radialGradient>
  <radialGradient id="wbg" cx="45%" cy="40%" r="70%">
    <stop offset="0%" stop-color="#0d2340"/><stop offset="100%" stop-color="#040d1a"/>
  </radialGradient>
  <filter id="hubGlow" x="-100%" y="-100%" width="300%" height="300%">
    <feGaussianBlur stdDeviation="4" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/>
  </filter>
  <filter id="cg" x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation="2" result="b"/><feComposite in="SourceGraphic" in2="b" operator="over"/>
  </filter>
  <pattern id="dot" width="20" height="20" patternUnits="userSpaceOnUse">
    <circle cx="1" cy="1" r="0.65" fill="rgba(255,255,255,0.038)"/>
  </pattern>
  <style>
    @keyframes dashFlow { to { stroke-dashoffset:-28; } }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }
  </style>
</defs>

<!-- Backgrounds -->
<rect width="${SPLIT}" height="${H}" fill="url(#ibg)"/>
<rect x="${SPLIT}" width="${W-SPLIT}" height="${H}" fill="url(#wbg)"/>
<rect width="${W}" height="${H}" fill="url(#dot)"/>

<!-- Panel divider -->
<line x1="${SPLIT}" y1="0" x2="${SPLIT}" y2="${H}" stroke="rgba(255,255,255,0.1)" stroke-width="1.5"/>

<!-- Panel headers -->
<rect x="8" y="6" width="165" height="26" rx="6" fill="rgba(232,88,10,0.18)" stroke="rgba(232,88,10,0.4)" stroke-width="1"/>
<text x="18" y="23" font-family="DM Sans,system-ui" font-size="9.5" font-weight="800" letter-spacing="1" fill="rgba(255,255,255,0.85)">🇮🇳  INDIA COVERAGE</text>

<rect x="${SPLIT+8}" y="6" width="${W-SPLIT-100}" height="26" rx="6" fill="rgba(96,165,250,0.14)" stroke="rgba(96,165,250,0.35)" stroke-width="1"/>
<text x="${SPLIT+18}" y="23" font-family="DM Sans,system-ui" font-size="9.5" font-weight="800" letter-spacing="1" fill="rgba(255,255,255,0.85)">🌍  INTERNATIONAL  —  180+ COUNTRIES</text>

<!-- Live badge -->
<circle cx="${W-22}" cy="19" r="5" fill="#4ade80">
  <animate attributeName="r" values="3;7;3" dur="1.6s" repeatCount="indefinite"/>
  <animate attributeName="opacity" values="1;0.2;1" dur="1.6s" repeatCount="indefinite"/>
</circle>
<text x="${W-30}" y="23" text-anchor="end" font-family="DM Sans,system-ui" font-size="8" font-weight="700" fill="rgba(74,222,128,0.9)">LIVE</text>

<!-- ═══ WORLD PANEL ═══════════════════════════════════════ -->
<g>
  <!-- Country fills -->
  ${countryFills}

  <!-- Lat/lon grid lines (subtle) -->
  ${[-30,-20,-10,0,10,20,30,40,50,60].map(lat => {
    const y = wy(lat); if (y<0||y>H) return '';
    return `<line x1="${SPLIT}" x2="${W}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(255,255,255,0.035)" stroke-width="0.7"/>
    <text x="${SPLIT+3}" y="${(y-2).toFixed(1)}" font-family="system-ui" font-size="5.5" fill="rgba(255,255,255,0.18)">${lat}°</text>`;
  }).join('')}

  <!-- Route lines -->
  ${routes}

  <!-- Delhi hub (world panel) -->
  <circle cx="${DX.toFixed(1)}" cy="${DY.toFixed(1)}" r="30" fill="rgba(232,88,10,0.06)">
    <animate attributeName="r" values="8;32;8" dur="2.5s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0.9;0;0.9" dur="2.5s" repeatCount="indefinite"/>
  </circle>
  <circle cx="${DX.toFixed(1)}" cy="${DY.toFixed(1)}" r="8" fill="#e8580a" filter="url(#hubGlow)"/>
  <circle cx="${DX.toFixed(1)}" cy="${DY.toFixed(1)}" r="4" fill="#ff8c45"/>
  <text x="${(DX+12).toFixed(1)}" y="${(DY+4).toFixed(1)}" font-family="DM Sans,system-ui" font-size="9" font-weight="800" fill="#ff8c45">Delhi NCR</text>

  <!-- Hub dots -->
  ${hubDots}

  <!-- Region labels -->
  <text x="${wx(46)}" y="${wy(26)}" text-anchor="middle" font-family="DM Sans,system-ui" font-size="8" font-weight="800" fill="rgba(251,191,36,0.75)">MIDDLE EAST</text>
  <text x="${wx(12)}" y="${wy(48)}" text-anchor="middle" font-family="DM Sans,system-ui" font-size="8" font-weight="800" fill="rgba(96,165,250,0.7)">EUROPE</text>
  <text x="${wx(18)}" y="${wy(-5)}" text-anchor="middle" font-family="DM Sans,system-ui" font-size="8" font-weight="800" fill="rgba(96,165,250,0.6)">AFRICA</text>
  <text x="${wx(110)}" y="${wy(15)}" text-anchor="middle" font-family="DM Sans,system-ui" font-size="8" font-weight="800" fill="rgba(74,222,128,0.7)">SE ASIA</text>
  <text x="${wx(125)}" y="${wy(42)}" text-anchor="middle" font-family="DM Sans,system-ui" font-size="8" font-weight="800" fill="rgba(96,165,250,0.65)">EAST ASIA</text>
  <text x="${wx(138)}" y="${wy(-30)}" text-anchor="middle" font-family="DM Sans,system-ui" font-size="8" font-weight="800" fill="rgba(96,165,250,0.65)">AUSTRALIA</text>
  <text x="${wx(-95)}" y="${wy(46)}" text-anchor="middle" font-family="DM Sans,system-ui" font-size="8" font-weight="800" fill="rgba(167,139,250,0.7)">NORTH AMERICA</text>
  <text x="${wx(-60)}" y="${wy(-18)}" text-anchor="middle" font-family="DM Sans,system-ui" font-size="8" font-weight="800" fill="rgba(167,139,250,0.6)">SOUTH AMERICA</text>

  <!-- Bottom badge -->
  <rect x="${W-220}" y="${H-44}" width="212" height="38" rx="6" fill="rgba(11,31,58,0.85)" stroke="rgba(96,165,250,0.3)" stroke-width="1"/>
  <text x="${W-212}" y="${H-27}" font-family="DM Sans,system-ui" font-size="8.5" font-weight="800" fill="#93c5fd">180+ Countries · 6 Continents</text>
  <text x="${W-212}" y="${H-13}" font-family="DM Sans,system-ui" font-size="7.5" font-weight="600" fill="rgba(255,255,255,0.45)">Via DHL · FedEx · Global Partner Network</text>
</g>

<!-- ═══ INDIA PANEL ═══════════════════════════════════════ -->
<g clip-path="url(#ic)">
  <defs><clipPath id="ic"><rect width="${SPLIT}" height="${H}"/></clipPath></defs>

  <!-- India fill -->
  <path d="${outlinePath}" fill="rgba(232,88,10,0.1)" stroke="none"/>

  <!-- State border hints -->
  ${STATE_LINES}

  <!-- India outline — prominent orange -->
  <path d="${outlinePath}" fill="none" stroke="rgba(232,88,10,0.85)" stroke-width="1.8"/>
  <path d="${outlinePath}" fill="none" stroke="rgba(255,165,100,0.2)" stroke-width="4"/>

  <!-- Coverage grid (dense dots = 35k PIN codes) -->
  ${gridDots}

  <!-- Major city labels on top -->
  ${labelDots}

  <!-- Coverage badge -->
  <rect x="8" y="${H-48}" width="240" height="42" rx="6" fill="rgba(11,31,58,0.88)" stroke="rgba(232,88,10,0.4)" stroke-width="1"/>
  <text x="18" y="${H-30}" font-family="DM Sans,system-ui" font-size="9" font-weight="800" fill="#ff8c45">35,000+ PIN Codes Covered</text>
  <text x="18" y="${H-14}" font-family="DM Sans,system-ui" font-size="7.5" font-weight="600" fill="rgba(255,255,255,0.5)">Every State · NE · J&amp;K · Andaman · Lakshadweep</text>
</g>

</svg>`;

  el.innerHTML = svg;
}

document.addEventListener('DOMContentLoaded', buildMap);
