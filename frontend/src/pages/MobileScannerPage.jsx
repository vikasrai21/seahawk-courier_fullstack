import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../services/api';
import { cropRectForCoverVideo } from '../utils/videoCoverCrop.js';
import { normalizeBarcodeCandidate } from '../utils/barcode.js';
import { analyzeCaptureQuality, describeCaptureIssues } from '../utils/scannerQuality.js';
import { evaluateBarcodeStability, nextBarcodeFallbackState } from '../utils/scannerStateMachine.js';
import { createBarcodeScanner } from '../utils/barcodeEngine.js';
import {
  Camera, Check, AlertCircle, RotateCcw, Send, Volume2, VolumeX,
  Wifi, WifiOff, Zap, Package, ScanLine, Shield, RefreshCw, X, Brain,
  Clock, CheckCircle2, List, ArrowLeft, Trash2, CloudUpload,
  CalendarDays
} from 'lucide-react';

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function resolveSocketUrl() {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl || apiUrl.startsWith('/')) {
    return window.location.origin;
  }

  return apiUrl.replace(/\/api\/?$/, '');
}

const SOCKET_URL = resolveSocketUrl();
// Barcode strip: wide landscape rectangle â€” Trackon/DTDC barcodes are horizontal
const BARCODE_SCAN_REGION = { w: '90vw', h: '18vw' };  // aspect ~5:1, always landscape
// Document capture: tall portrait rectangle matching a real AWB slip shape
const DOC_CAPTURE_REGION  = { w: '92vw', h: '130vw' }; // ~A4 portrait proportion
const AUTO_NEXT_DELAY = 3500;
const FAST_AUTO_NEXT_DELAY = 900;
const FAST_SCAN_TIMEOUT_MS = 10000;
const LOOKUP_DECISION_TIMEOUT_MS = 12000;
const APPROVAL_RESULT_TIMEOUT_MS = 15000;
const OFFLINE_QUEUE_KEY_PREFIX = 'mobile_scanner_offline_queue';
const SESSION_STATE_KEY_PREFIX = 'mobile_scanner_session_state';
const STICKY_CLIENT_KEY_PREFIX = 'mobile_scanner_sticky_client';
const WORKFLOW_MODE_KEY = 'mobile_scanner_workflow_mode';
const DEVICE_PROFILE_KEY = 'mobile_scanner_device_profile';
const HEARTBEAT_INTERVAL_MS = 20000;
const BARCODE_STABILITY_WINDOW_MS = 500;
const BARCODE_STABILITY_HITS = 1;
const BARCODE_FAIL_THRESHOLD = 100;
const BARCODE_REFRAME_ATTEMPTS = 2;
const DOC_STABLE_MIN_TICKS = 2;
const DOC_CAPTURE_MIN_INTERVAL_MS = 500;
const CAPTURE_MAX_WIDTH = 960;
const CAPTURE_JPEG_QUALITY = 0.68;
const SCAN_HINT_COOLDOWN_MS = 900;
const DEVICE_PROFILES = {
  phone: 'phone-camera',
  rugged: 'rugged-scanner',
};
const REVIEW_COURIERS = ['Trackon', 'DTDC', 'Delhivery', 'BlueDart'];
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const normalizeReviewCourier = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const upper = raw.toUpperCase();
  if (upper.includes('TRACKON') || upper.includes('PRIME')) return 'Trackon';
  if (upper.includes('DTDC')) return 'DTDC';
  if (upper.includes('DELHIVERY')) return 'Delhivery';
  if (upper.includes('BLUE')) return 'BlueDart';
  return raw;
};

const normalizeClientCode = (value) => String(value || '').trim().toUpperCase();

/**
 * Infer courier from AWB prefix — works offline, no API needed.
 * Called immediately when a barcode is locked so the review header
 * already shows the right courier color before OCR finishes.
 */
const inferCourierFromAwb = (awb = '') => {
  const a = String(awb || '').trim().toUpperCase();
  if (!a) return '';
  // DTDC: Z, D, X, I prefix or 7X prefix
  if (/^[ZDX][0-9]/.test(a) || /^7X[0-9]/i.test(a) || /^I[0-9]{8}/.test(a)) return 'DTDC';
  // Delhivery: 14 digits starting with 299 or 368
  if (/^(299|368)\d{11}$/.test(a)) return 'Delhivery';
  // Delhivery: exactly 14 digits
  if (/^\d{14}$/.test(a)) return 'Delhivery';
  // Trackon: 12 digits starting with 100 or 500
  if (/^(100|500)\d{9}$/.test(a)) return 'Trackon';
  // BlueDart: 11 digits
  if (/^\d{11}$/.test(a)) return 'BlueDart';
  // Primetrack: starts with 20004 or 20040
  if (/^2000[45]/.test(a)) return 'Trackon';
  return '';
};

const formatDisplayDate = (isoDate) => {
  const raw = String(isoDate || '').trim();
  if (!ISO_DATE_REGEX.test(raw)) return raw;
  try {
    return new Date(`${raw}T00:00:00`).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return raw;
  }
};

const normalizeQueueDate = (value, fallback = '') => {
  const raw = String(value || '').trim();
  if (ISO_DATE_REGEX.test(raw)) return raw;
  const fb = String(fallback || '').trim();
  if (ISO_DATE_REGEX.test(fb)) return fb;
  return new Date().toISOString().slice(0, 10);
};


const STEPS = {
  IDLE: 'IDLE',
  SCANNING: 'SCANNING',
  // BARCODE_LOCKED removed: the locked state is now a visual overlay within SCANNING,
  // not a separate step. The lifecycle is: SCANNING â†’ CAPTURING â†’ PREVIEW â†’ PROCESSING
  // â†’ REVIEWING â†’ APPROVING â†’ SUCCESS (or ERROR at any point).
  CAPTURING: 'CAPTURING',
  PREVIEW: 'PREVIEW',
  PROCESSING: 'PROCESSING',
  REVIEWING: 'REVIEWING',
  APPROVING: 'APPROVING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
};

// â”€â”€â”€ Audio/Haptics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function logNonCriticalScannerError(scope, err) {
  const message = err instanceof Error ? err.message : String(err || 'unknown error');
  if (import.meta.env.DEV) {
    console.debug(`[MobileScanner] ${scope}: ${message}`);
  }
}

const vibrate = (pattern) => {
  try {
    navigator?.vibrate?.(pattern);
  } catch (err) {
    logNonCriticalScannerError('vibrate', err);
  }
};

const HAPTIC_PATTERN = {
  tap: [20],
  lock: [400, 50, 200, 50, 100], // Extremely heavy mechanical jolt sequence
  success: [18, 28, 72],
  warning: [70, 50, 70],
  retry: [28, 40, 28],
  error: [110, 55, 110],
  duplicate: [90, 50, 90, 50, 90],
  review: [200, 40, 120],  // Heavy "thud" when review screen loads
};

const pulseHaptic = (kind = 'tap') => {
  vibrate(HAPTIC_PATTERN[kind] || HAPTIC_PATTERN.tap);
};

const playTone = (freq, duration, type = 'sine') => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (err) {
    logNonCriticalScannerError('playTone', err);
  }
};

const playSuccessBeep = () => { playTone(880, 0.12); setTimeout(() => playTone(1100, 0.10), 130); };
const playHardwareBeep = () => {
  // Realistic industrial barcode scanner beep:
  // Sharp attack, fast decay, high-pitched square wave — like a Zebra/Honeywell scanner
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(3800, ctx.currentTime);
    osc.frequency.setValueAtTime(3200, ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.005); // sharp attack
    gain.gain.setValueAtTime(0.18, ctx.currentTime + 0.055);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.13); // fast decay
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.14);
  } catch (err) {
    logNonCriticalScannerError('playHardwareBeep', err);
  }
};
const playCaptureBeep = () => playTone(600, 0.08);
const playErrorBeep = () => playTone(200, 0.25, 'sawtooth');

const speak = (text) => {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.2; u.pitch = 1.0; u.lang = 'en-IN';
    window.speechSynthesis.speak(u);
  } catch (err) {
    logNonCriticalScannerError('speak', err);
  }
};

const isProbablySecureContextForCamera = () => {
  try {
    if (typeof window === 'undefined') return false;
    if (window.isSecureContext) return true;
    const host = window.location?.hostname || '';
    return host === 'localhost' || host === '127.0.0.1';
  } catch {
    return false;
  }
};

// â”€â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const theme = {
  bg: '#F8FAFF',
  surface: '#FFFFFF',
  border: 'rgba(15,23,42,0.09)',
  text: '#0D1B2A',
  muted: '#5B6B7C',
  mutedLight: '#8FA0B0',
  primary: '#1D4ED8',
  primaryLight: '#EFF6FF',
  success: '#059669',
  successLight: '#ECFDF5',
  warning: '#D97706',
  warningLight: '#FFFBEB',
  error: '#DC2626',
  errorLight: '#FFF1F1',
  accent: '#7C3AED',
  accentLight: '#F5F3FF',
  navy: '#0D1B2A',
  navyMid: '#1E2D3D',
  navyLight: '#253545',
};

// Enterprise courier palette
const COURIER_PALETTE = {
  DTDC:      { bg: '#C8102E', light: '#FFF0F1', text: '#fff', label: 'DTDC' },
  Delhivery: { bg: '#00A0A0', light: '#E6FAFA', text: '#fff', label: 'Delhivery' },
  Trackon:   { bg: '#E65C00', light: '#FFF3EC', text: '#fff', label: 'Trackon' },
  BlueDart:  { bg: '#1A3A8C', light: '#EDF2FF', text: '#fff', label: 'BlueDart' },
};
const getCourierPalette = (name = '') => {
  const n = String(name || '').trim();
  return COURIER_PALETTE[n] || { bg: '#1D4ED8', light: '#EFF6FF', text: '#fff', label: n || 'Unknown' };
};

// Major Indian pincode -> city (offline lookup, ~700 entries)
const PIN_CITY = {'110001':'New Delhi','110002':'New Delhi','110003':'New Delhi','110004':'New Delhi','110005':'New Delhi','110006':'New Delhi','110007':'New Delhi','110008':'New Delhi','110009':'New Delhi','110010':'New Delhi','110011':'New Delhi','110012':'New Delhi','110013':'New Delhi','110014':'New Delhi','110015':'New Delhi','110016':'New Delhi','110017':'New Delhi','110018':'New Delhi','110019':'New Delhi','110020':'New Delhi','110021':'New Delhi','110022':'New Delhi','110023':'New Delhi','110024':'New Delhi','110025':'New Delhi','110026':'New Delhi','110027':'New Delhi','110028':'New Delhi','110029':'New Delhi','110030':'New Delhi','110031':'New Delhi','110032':'New Delhi','110033':'New Delhi','110034':'New Delhi','110035':'New Delhi','110036':'New Delhi','110037':'New Delhi','110038':'New Delhi','110039':'New Delhi','110040':'New Delhi','110041':'New Delhi','110042':'New Delhi','110043':'New Delhi','110044':'New Delhi','110045':'New Delhi','110046':'New Delhi','110047':'New Delhi','110048':'New Delhi','110049':'New Delhi','110051':'New Delhi','110052':'New Delhi','110053':'New Delhi','110054':'New Delhi','110055':'New Delhi','110056':'New Delhi','110057':'New Delhi','110058':'New Delhi','110059':'New Delhi','110060':'New Delhi','110061':'New Delhi','110062':'New Delhi','110063':'New Delhi','110064':'New Delhi','110065':'New Delhi','110066':'New Delhi','110067':'New Delhi','110068':'New Delhi','110069':'New Delhi','110070':'New Delhi','110071':'New Delhi','110072':'New Delhi','110073':'New Delhi','110074':'New Delhi','110075':'New Delhi','110076':'New Delhi','110077':'New Delhi','110078':'New Delhi','110081':'New Delhi','110082':'New Delhi','110083':'New Delhi','110084':'New Delhi','110085':'New Delhi','110086':'New Delhi','110087':'New Delhi','110088':'New Delhi','110089':'New Delhi','110091':'New Delhi','110092':'New Delhi','110093':'New Delhi','110094':'New Delhi','110095':'New Delhi','110096':'New Delhi','121001':'Faridabad','121002':'Faridabad','121003':'Faridabad','121004':'Faridabad','122001':'Gurugram','122002':'Gurugram','122003':'Gurugram','122004':'Gurugram','122006':'Gurugram','122007':'Gurugram','122008':'Gurugram','122009':'Gurugram','122010':'Gurugram','122011':'Gurugram','122015':'Gurugram','122016':'Gurugram','122017':'Gurugram','122018':'Gurugram','122051':'Gurugram','201001':'Ghaziabad','201002':'Ghaziabad','201003':'Ghaziabad','201004':'Ghaziabad','201005':'Ghaziabad','201006':'Ghaziabad','201007':'Ghaziabad','201008':'Ghaziabad','201009':'Ghaziabad','201010':'Ghaziabad','201011':'Ghaziabad','201012':'Ghaziabad','201013':'Ghaziabad','201014':'Ghaziabad','201015':'Ghaziabad','201016':'Ghaziabad','201017':'Ghaziabad','201301':'Noida','201302':'Noida','201303':'Noida','201304':'Noida','201305':'Noida','201306':'Noida','201307':'Noida','201308':'Noida','400001':'Mumbai','400002':'Mumbai','400003':'Mumbai','400004':'Mumbai','400005':'Mumbai','400006':'Mumbai','400007':'Mumbai','400008':'Mumbai','400009':'Mumbai','400010':'Mumbai','400011':'Mumbai','400012':'Mumbai','400013':'Mumbai','400014':'Mumbai','400015':'Mumbai','400016':'Mumbai','400017':'Mumbai','400018':'Mumbai','400019':'Mumbai','400020':'Mumbai','400050':'Mumbai','400051':'Mumbai','400052':'Mumbai','400053':'Mumbai','400054':'Mumbai','400055':'Mumbai','400056':'Mumbai','400057':'Mumbai','400058':'Mumbai','400059':'Mumbai','400060':'Mumbai','400061':'Mumbai','400062':'Mumbai','400063':'Mumbai','400064':'Mumbai','400065':'Mumbai','400066':'Mumbai','400067':'Mumbai','400068':'Mumbai','400069':'Mumbai','400070':'Mumbai','400071':'Mumbai','400072':'Mumbai','400074':'Mumbai','400075':'Mumbai','400076':'Mumbai','400077':'Mumbai','400078':'Mumbai','400079':'Mumbai','400080':'Mumbai','400081':'Mumbai','400082':'Mumbai','400083':'Mumbai','400084':'Mumbai','400085':'Mumbai','400086':'Mumbai','400087':'Mumbai','400088':'Mumbai','400089':'Mumbai','400090':'Mumbai','400091':'Mumbai','400092':'Mumbai','400093':'Mumbai','400094':'Mumbai','400095':'Mumbai','400097':'Mumbai','400098':'Mumbai','400099':'Mumbai','400101':'Mumbai','400102':'Mumbai','400103':'Mumbai','400104':'Mumbai','560001':'Bangalore','560002':'Bangalore','560003':'Bangalore','560004':'Bangalore','560005':'Bangalore','560006':'Bangalore','560007':'Bangalore','560008':'Bangalore','560009':'Bangalore','560010':'Bangalore','560011':'Bangalore','560012':'Bangalore','560013':'Bangalore','560014':'Bangalore','560015':'Bangalore','560016':'Bangalore','560017':'Bangalore','560018':'Bangalore','560019':'Bangalore','560020':'Bangalore','560021':'Bangalore','560022':'Bangalore','560023':'Bangalore','560024':'Bangalore','560025':'Bangalore','560026':'Bangalore','560027':'Bangalore','560028':'Bangalore','560029':'Bangalore','560030':'Bangalore','560032':'Bangalore','560033':'Bangalore','560034':'Bangalore','560035':'Bangalore','560036':'Bangalore','560037':'Bangalore','560038':'Bangalore','560040':'Bangalore','560041':'Bangalore','560042':'Bangalore','560043':'Bangalore','560044':'Bangalore','560045':'Bangalore','560047':'Bangalore','560048':'Bangalore','560050':'Bangalore','560051':'Bangalore','560052':'Bangalore','560053':'Bangalore','560054':'Bangalore','560055':'Bangalore','560056':'Bangalore','560057':'Bangalore','560058':'Bangalore','560059':'Bangalore','560060':'Bangalore','560061':'Bangalore','560062':'Bangalore','560063':'Bangalore','560064':'Bangalore','560065':'Bangalore','560066':'Bangalore','560067':'Bangalore','560068':'Bangalore','560069':'Bangalore','560070':'Bangalore','560071':'Bangalore','560072':'Bangalore','560073':'Bangalore','560074':'Bangalore','560075':'Bangalore','560076':'Bangalore','560077':'Bangalore','560078':'Bangalore','560079':'Bangalore','560080':'Bangalore','560081':'Bangalore','560082':'Bangalore','560083':'Bangalore','560085':'Bangalore','560086':'Bangalore','560087':'Bangalore','560088':'Bangalore','560089':'Bangalore','560090':'Bangalore','560091':'Bangalore','560092':'Bangalore','560093':'Bangalore','560094':'Bangalore','560095':'Bangalore','560096':'Bangalore','560097':'Bangalore','560098':'Bangalore','560099':'Bangalore','560100':'Bangalore','560102':'Bangalore','560103':'Bangalore','560104':'Bangalore','560105':'Bangalore','600001':'Chennai','600002':'Chennai','600003':'Chennai','600004':'Chennai','600005':'Chennai','600006':'Chennai','600007':'Chennai','600008':'Chennai','600009':'Chennai','600010':'Chennai','600011':'Chennai','600012':'Chennai','600013':'Chennai','600014':'Chennai','600015':'Chennai','600016':'Chennai','600017':'Chennai','600018':'Chennai','600019':'Chennai','600020':'Chennai','600021':'Chennai','600022':'Chennai','600023':'Chennai','600024':'Chennai','600025':'Chennai','600026':'Chennai','600028':'Chennai','600029':'Chennai','600030':'Chennai','600031':'Chennai','600032':'Chennai','600033':'Chennai','600034':'Chennai','600035':'Chennai','600036':'Chennai','600037':'Chennai','600038':'Chennai','600039':'Chennai','600040':'Chennai','600041':'Chennai','600042':'Chennai','600043':'Chennai','600044':'Chennai','600045':'Chennai','600047':'Chennai','600048':'Chennai','600049':'Chennai','600050':'Chennai','600051':'Chennai','600052':'Chennai','600053':'Chennai','600054':'Chennai','600055':'Chennai','600056':'Chennai','600057':'Chennai','600058':'Chennai','600059':'Chennai','600060':'Chennai','600061':'Chennai','600062':'Chennai','600063':'Chennai','600064':'Chennai','600065':'Chennai','600066':'Chennai','600067':'Chennai','600068':'Chennai','600069':'Chennai','600070':'Chennai','600071':'Chennai','600072':'Chennai','600073':'Chennai','600074':'Chennai','600075':'Chennai','600076':'Chennai','600077':'Chennai','600078':'Chennai','600079':'Chennai','600080':'Chennai','600081':'Chennai','600082':'Chennai','600083':'Chennai','600084':'Chennai','600085':'Chennai','600086':'Chennai','600087':'Chennai','600088':'Chennai','600089':'Chennai','600090':'Chennai','600091':'Chennai','600092':'Chennai','600093':'Chennai','600094':'Chennai','600095':'Chennai','600096':'Chennai','600097':'Chennai','600099':'Chennai','600100':'Chennai','600101':'Chennai','600102':'Chennai','600103':'Chennai','600104':'Chennai','600105':'Chennai','600106':'Chennai','600107':'Chennai','600108':'Chennai','600109':'Chennai','600110':'Chennai','600111':'Chennai','600112':'Chennai','600113':'Chennai','600114':'Chennai','600115':'Chennai','600116':'Chennai','600117':'Chennai','600119':'Chennai','600120':'Chennai','600121':'Chennai','600122':'Chennai','600123':'Chennai','600125':'Chennai','600126':'Chennai','600127':'Chennai','600128':'Chennai','700001':'Kolkata','700002':'Kolkata','700003':'Kolkata','700004':'Kolkata','700005':'Kolkata','700006':'Kolkata','700007':'Kolkata','700008':'Kolkata','700009':'Kolkata','700010':'Kolkata','700011':'Kolkata','700012':'Kolkata','700013':'Kolkata','700014':'Kolkata','700015':'Kolkata','700016':'Kolkata','700017':'Kolkata','700018':'Kolkata','700019':'Kolkata','700020':'Kolkata','500001':'Hyderabad','500002':'Hyderabad','500003':'Hyderabad','500004':'Hyderabad','500005':'Hyderabad','500006':'Hyderabad','500007':'Hyderabad','500008':'Hyderabad','500009':'Hyderabad','500010':'Hyderabad','500011':'Hyderabad','500012':'Hyderabad','500013':'Hyderabad','500014':'Hyderabad','500015':'Hyderabad','500016':'Hyderabad','500017':'Hyderabad','500018':'Hyderabad','500019':'Hyderabad','500020':'Hyderabad','380001':'Ahmedabad','380002':'Ahmedabad','380003':'Ahmedabad','380004':'Ahmedabad','380005':'Ahmedabad','380006':'Ahmedabad','380007':'Ahmedabad','380008':'Ahmedabad','380009':'Ahmedabad','380010':'Ahmedabad','380013':'Ahmedabad','380014':'Ahmedabad','380015':'Ahmedabad','380016':'Ahmedabad','380017':'Ahmedabad','380018':'Ahmedabad','380019':'Ahmedabad','380021':'Ahmedabad','380022':'Ahmedabad','380023':'Ahmedabad','380024':'Ahmedabad','380025':'Ahmedabad','380026':'Ahmedabad','380027':'Ahmedabad','380028':'Ahmedabad','302001':'Jaipur','302002':'Jaipur','302003':'Jaipur','302004':'Jaipur','302005':'Jaipur','302006':'Jaipur','302007':'Jaipur','302008':'Jaipur','302009':'Jaipur','302010':'Jaipur','302011':'Jaipur','302012':'Jaipur','302013':'Jaipur','302015':'Jaipur','302016':'Jaipur','302017':'Jaipur','302018':'Jaipur','302019':'Jaipur','302020':'Jaipur','302021':'Jaipur','302022':'Jaipur','302023':'Jaipur','302026':'Jaipur','302027':'Jaipur','302028':'Jaipur','302029':'Jaipur','302030':'Jaipur','302031':'Jaipur','302033':'Jaipur','302034':'Jaipur','302036':'Jaipur','302037':'Jaipur','226001':'Lucknow','226002':'Lucknow','226003':'Lucknow','226004':'Lucknow','226005':'Lucknow','226006':'Lucknow','226007':'Lucknow','226008':'Lucknow','226009':'Lucknow','226010':'Lucknow','226011':'Lucknow','226012':'Lucknow','226013':'Lucknow','226014':'Lucknow','226015':'Lucknow','226016':'Lucknow','226017':'Lucknow','226018':'Lucknow','226019':'Lucknow','226020':'Lucknow','226021':'Lucknow','226022':'Lucknow','226023':'Lucknow','226024':'Lucknow','226025':'Lucknow','226026':'Lucknow','226028':'Lucknow','226029':'Lucknow','411001':'Pune','411002':'Pune','411003':'Pune','411004':'Pune','411005':'Pune','411006':'Pune','411007':'Pune','411008':'Pune','411009':'Pune','411010':'Pune','411011':'Pune','411012':'Pune','411013':'Pune','411014':'Pune','411015':'Pune','411016':'Pune','411017':'Pune','411018':'Pune','411019':'Pune','411020':'Pune','411021':'Pune','411022':'Pune','411023':'Pune','411024':'Pune','411025':'Pune','411026':'Pune','411027':'Pune','411028':'Pune','411029':'Pune','411030':'Pune','411031':'Pune','411032':'Pune','411033':'Pune','411034':'Pune','411035':'Pune','411036':'Pune','411037':'Pune','411038':'Pune','411039':'Pune','411040':'Pune','411041':'Pune','411042':'Pune','411043':'Pune','411044':'Pune','411045':'Pune','411046':'Pune','411047':'Pune','411048':'Pune','411049':'Pune','411051':'Pune','411052':'Pune','411053':'Pune','411057':'Pune','411058':'Pune','411060':'Pune','411061':'Pune','411062':'Pune','411067':'Pune','160001':'Chandigarh','160002':'Chandigarh','160003':'Chandigarh','160004':'Chandigarh','160005':'Chandigarh','160006':'Chandigarh','160007':'Chandigarh','160008':'Chandigarh','160009':'Chandigarh','160010':'Chandigarh','160011':'Chandigarh','160012':'Chandigarh','160014':'Chandigarh','160015':'Chandigarh','160016':'Chandigarh','160017':'Chandigarh','160018':'Chandigarh','160019':'Chandigarh','160020':'Chandigarh','160022':'Chandigarh','160023':'Chandigarh','160024':'Chandigarh','160025':'Chandigarh','160026':'Chandigarh','160028':'Chandigarh','160030':'Chandigarh','160031':'Chandigarh','160036':'Chandigarh','160047':'Chandigarh','160059':'Chandigarh','160061':'Chandigarh','160062':'Chandigarh','160071':'Chandigarh','440001':'Nagpur','440002':'Nagpur','440003':'Nagpur','440004':'Nagpur','440005':'Nagpur','440006':'Nagpur','440007':'Nagpur','440008':'Nagpur','440009':'Nagpur','440010':'Nagpur','440011':'Nagpur','440012':'Nagpur','440013':'Nagpur','440014':'Nagpur','440015':'Nagpur','440016':'Nagpur','440017':'Nagpur','440018':'Nagpur','440019':'Nagpur','440020':'Nagpur','440021':'Nagpur','440022':'Nagpur','440023':'Nagpur','440024':'Nagpur','440025':'Nagpur','440026':'Nagpur','440027':'Nagpur','440028':'Nagpur','440032':'Nagpur','440033':'Nagpur','440034':'Nagpur','440035':'Nagpur','440036':'Nagpur','440037':'Nagpur','530001':'Visakhapatnam','530002':'Visakhapatnam','530003':'Visakhapatnam','530004':'Visakhapatnam','530005':'Visakhapatnam','530006':'Visakhapatnam','530007':'Visakhapatnam','530008':'Visakhapatnam','530009':'Visakhapatnam','530010':'Visakhapatnam','530011':'Visakhapatnam','530012':'Visakhapatnam','530013':'Visakhapatnam','530014':'Visakhapatnam','530015':'Visakhapatnam','530016':'Visakhapatnam','530017':'Visakhapatnam','530018':'Visakhapatnam','530020':'Visakhapatnam','530022':'Visakhapatnam','530023':'Visakhapatnam','530024':'Visakhapatnam','530025':'Visakhapatnam','530026':'Visakhapatnam','530027':'Visakhapatnam','530028':'Visakhapatnam','530029':'Visakhapatnam','530031':'Visakhapatnam','530032':'Visakhapatnam','530040':'Visakhapatnam','530041':'Visakhapatnam','530043':'Visakhapatnam','530044':'Visakhapatnam','530045':'Visakhapatnam','530046':'Visakhapatnam','530047':'Visakhapatnam','530048':'Visakhapatnam','530049':'Visakhapatnam','530051':'Visakhapatnam'};
const lookupPincodeCity = (pin = '') => {
  const p = String(pin || '').replace(/\D/g, '').trim();
  if (p.length !== 6) return '';
  return PIN_CITY[p] || '';
};

import './MobileScannerPage.css';
// ——— Confidence helpers ———————————————————————————————————————————————————————————
const confLevel = (score) => {
  if (score >= 0.85) return 'high';
  if (score >= 0.55) return 'med';
  return 'low';
};

const confDotClass = (score) => `conf-dot conf-${confLevel(score)}`;

const sourceLabel = (source) => {
  if (source === 'learned') return { className: 'source-badge source-learned', icon: 'AI', text: 'Learned' };
  if (source === 'awb_master') return { className: 'source-badge source-ai', icon: 'DB', text: 'Lookup' };
  if (source === 'courier_api') return { className: 'source-badge source-history', icon: 'API', text: 'Courier' };
  if (source === 'fuzzy_match') return { className: 'source-badge source-ai', icon: '🔍', text: 'Matched' };
  if (source === 'fuzzy_history' || source === 'consignee_pattern') return { className: 'source-badge source-history', icon: '📊', text: 'History' };
  if (source === 'delhivery_pincode' || source === 'india_post' || source === 'pincode_lookup' || source === 'indiapost_lookup') return { className: 'source-badge source-pincode', icon: '📍', text: 'Pincode' };
  return null;
};

const fmtDuration = (ms) => {
  const m = Math.floor(ms / 60000);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
};

// ══════════════════════════════════════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════════════════════════════════════
export default function MobileScannerPage({ standalone = false }) {
  const { pin } = useParams();
  const navigate = useNavigate();
  const isStandalone = Boolean(standalone);
  const offlineQueueKey = `${OFFLINE_QUEUE_KEY_PREFIX}:${isStandalone ? 'direct' : (pin || 'unknown')}`;
  const sessionStateKey = useMemo(
    () => `${SESSION_STATE_KEY_PREFIX}:${isStandalone ? 'direct' : (pin || 'unknown')}`,
    [isStandalone, pin]
  );
  const stickyClientStorageKey = useMemo(
    () => `${STICKY_CLIENT_KEY_PREFIX}:${isStandalone ? 'direct' : (pin || 'unknown')}`,
    [isStandalone, pin]
  );
  const TODAY_KEY = useMemo(() => `mobile_scanner_daily_count:${new Date().toISOString().slice(0, 10)}`, []);
  const mockBarcodeRaw = useMemo(() => {
    try {
      if (typeof window === 'undefined') return '';
      return new URLSearchParams(window.location.search).get('mockBarcodeRaw') || '';
    } catch {
      return '';
    }
  }, []);
  const isE2eMock = useMemo(() => {
    try {
      if (typeof window === 'undefined') return false;
      const qp = new URLSearchParams(window.location.search);
      return qp.get('mock') === '1' || qp.get('e2e') === '1';
    } catch {
      return false;
    }
  }, []);

  // ——— Connection ———
  const [socket, setSocket] = useState(null);
  const [connStatus, setConnStatus] = useState('connecting'); // connecting | paired | disconnected
  const [errorMsg, setErrorMsg] = useState('');

  // ——— State machine ———
  const [step, setStep] = useState(STEPS.IDLE);

  // ——— Scan data ———
  const [lockedAwb, setLockedAwb] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [, setProcessingFields] = useState({});
  const [reviewData, setReviewData] = useState(null);
  const [reviewForm, setReviewForm] = useState({});
  const [lastSuccess, setLastSuccess] = useState(null);
  const [flash, setFlash] = useState(null); // null | 'white' | 'success' | 'error'
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [docDetected, setDocDetected] = useState(false);
  const [docStableTicks, setDocStableTicks] = useState(0);
  const [captureQuality, setCaptureQuality] = useState({ ok: false, issues: [], metrics: null });
  const [captureMeta, setCaptureMeta] = useState({ kb: 0, width: 0, height: 0, quality: CAPTURE_JPEG_QUALITY });
  const [captureCameraReady, setCaptureCameraReady] = useState(false);
  const [sessionDuration, setSessionDuration] = useState('0m');
  const [pairedLabel, setPairedLabel] = useState('Connected');
  const [manualAwb, setManualAwb] = useState('');
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [scannerEngine, setScannerEngine] = useState('idle');
  const [lastDetectionMeta, setLastDetectionMeta] = useState(null);
  const [barcodeFailCount, setBarcodeFailCount] = useState(0);
  const [barcodeReframeCount, setBarcodeReframeCount] = useState(0);
  const [lastLockTimeMs, setLastLockTimeMs] = useState(null);

  // 'barcode' = narrow landscape strip, 'document' = full AWB slip portrait frame.
  // Auto-switches to 'document' after BARCODE_FAIL_THRESHOLD consecutive misses.
  const [scanMode, setScanMode] = useState('barcode');
  const [scanWorkflowMode, setScanWorkflowMode] = useState(() => {
    if (typeof window === 'undefined') return 'fast';
    try {
      const saved = localStorage.getItem(WORKFLOW_MODE_KEY);
      if (saved === 'fast' || saved === 'ocr') return saved;
    } catch (err) {
      logNonCriticalScannerError('read workflow mode', err);
    }
    return isE2eMock ? 'ocr' : 'fast';
  });
  const [deviceProfile, setDeviceProfile] = useState(() => {
    if (typeof window === 'undefined') return DEVICE_PROFILES.phone;
    try {
      const saved = localStorage.getItem(DEVICE_PROFILE_KEY);
      if (saved === DEVICE_PROFILES.phone || saved === DEVICE_PROFILES.rugged) return saved;
    } catch (err) {
      logNonCriticalScannerError('read device profile', err);
    }
    return DEVICE_PROFILES.phone;
  });
  // Counts consecutive frames where no barcode was found. Reset to 0 on any
  // successful detection. When it reaches BARCODE_FAIL_THRESHOLD the scanner
  // auto-switches to document mode and vibrates.
  const barcodeFailCountRef = useRef(0);

  // ——— Session context ———
  const [sessionCtx, setSessionCtx] = useState(() => {
    const base = {
      scannedAwbs: new Set(),
      clientFreq: {},
      scanNumber: 0,
      dominantClient: null,
      dominantClientCount: 0,
      startedAt: Date.now(),
      scannedItems: [],
    };
    if (typeof window === 'undefined') return base;
    try {
      const raw = localStorage.getItem(sessionStateKey);
      if (!raw) return base;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return base;
      const scannedAwbs = new Set(
        Array.isArray(parsed.scannedAwbs)
          ? parsed.scannedAwbs.map((awb) => normalizeClientCode(awb)).filter(Boolean)
          : []
      );
      return {
        ...base,
        clientFreq: parsed.clientFreq && typeof parsed.clientFreq === 'object' ? parsed.clientFreq : {},
        scanNumber: Number.isFinite(Number(parsed.scanNumber)) ? Number(parsed.scanNumber) : 0,
        dominantClient: normalizeClientCode(parsed.dominantClient || '') || null,
        dominantClientCount: Number.isFinite(Number(parsed.dominantClientCount)) ? Number(parsed.dominantClientCount) : 0,
        startedAt: Number.isFinite(Number(parsed.startedAt)) ? Number(parsed.startedAt) : base.startedAt,
        scannedItems: Array.isArray(parsed.scannedItems) ? parsed.scannedItems : [],
        scannedAwbs,
      };
    } catch (err) {
      logNonCriticalScannerError('hydrate session state', err);
      return base;
    }
  });
  const [stickyClientCode, setStickyClientCode] = useState(() => {
    if (typeof window === 'undefined') return '';
    try {
      return normalizeClientCode(localStorage.getItem(stickyClientStorageKey) || '');
    } catch (err) {
      logNonCriticalScannerError('read sticky client', err);
      return '';
    }
  });

  // ——— Settings ———
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [editingQueueItemId, setEditingQueueItemId] = useState('');
  const [editingQueueDate, setEditingQueueDate] = useState('');
  const [queueActionBusyId, setQueueActionBusyId] = useState('');

  // ── Session date (for batch scanning across dates) ──
  const [sessionDate, setSessionDate] = useState(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    try {
      const saved = localStorage.getItem('seahawk_scanner_session_date');
      // Only restore a saved date if it IS today — never carry over yesterday's date
      if (saved && ISO_DATE_REGEX.test(saved) && saved === todayIso) return saved;
    } catch (err) {
      logNonCriticalScannerError('read session date', err);
    }
    // Always start fresh with today's date
    return todayIso;
  });

  // ——— Refs ———
  const videoRef = useRef(null);
  const guideRef = useRef(null);
  const scannerRef = useRef(null); // ZXing reader
  const scanbotRef = useRef(null); // Scanbot SDK
  const scanBusyRef = useRef(false);
  const autoNextTimer = useRef(null);
  const autoCaptureTriggeredRef = useRef(false);
  const currentStepRef = useRef(STEPS.IDLE);
  const lockToCaptureTimerRef = useRef(null);
  const approvalResultTimerRef = useRef(null);
  const scannerStartedAtRef = useRef(0);
  // Stable ref to the latest handleBarcodeDetected callback.
  // startBarcodeScanner captures this ref (not the function directly) so the
  // scanner always calls the current version — fixes the stale-closure bug where
  // the scanner was locked to the first-render handleBarcodeDetected and would
  // miss sessionCtx updates (duplicate detection, scan counts, etc.).
  const handleBarcodeDetectedRef = useRef(null);
  // Stable ref for the scannedAwbs Set so duplicate detection inside the scanner
  // callback always sees the latest state, not the value at the time the callback
  // was memoized.
  const scannedAwbsRef = useRef(new Set());
  const barcodeSamplesRef = useRef([]);
  const barcodeStabilityRef = useRef({ awb: '', hits: 0, lastSeenAt: 0 });
  const barcodeReframeCountRef = useRef(0);
  const captureReadyHapticRef = useRef(false);
  const lastCaptureAtRef = useRef(0);
  const submitFastBarcodeRef = useRef(null);
  const submitLookupDecisionRef = useRef(null);
  const scanHintRef = useRef({ message: '', at: 0 });
  const lockTelemetryRef = useRef({ lockTimeMs: null, candidateCount: 1, ambiguous: false, alternatives: [] });
  const barcodeEngineRef = useRef(null); // WASM-powered barcode engine
  const reviewDataRef = useRef(null);
  const reviewFormRef = useRef({});
  const addToQueueRef = useRef(null);
  const handleLookupNeedsPhotoRef = useRef(null);
  const applyProcessedScanResultRef = useRef(null);

  // Swipe-to-approve gesture state
  const swipeStartXRef = useRef(null);
  const swipeStartYRef = useRef(null);
  const swipeDeltaXRef = useRef(0);
  const [swipeProgress, setSwipeProgress] = useState(0); // -1 (skip) to +1 (approve)
  const swipeAnimFrameRef = useRef(null);

  // Auto-detected courier from AWB prefix
  const [inferredCourier, setInferredCourier] = useState('');
  // Copy-to-clipboard flash
  const [awbCopied, setAwbCopied] = useState(false);
  // Session summary modal
  const [sessionSummaryOpen, setSessionSummaryOpen] = useState(false);
  // Lock ring animation
  const [showLockRing, setShowLockRing] = useState(false);

  const goStep = useCallback((next) => {
    setStep(next);
  }, []);

  const syncBarcodeFailCount = useCallback((nextCount) => {
    barcodeFailCountRef.current = nextCount;
    setBarcodeFailCount(nextCount);
  }, []);

  const syncBarcodeReframeCount = useCallback((nextCount) => {
    barcodeReframeCountRef.current = nextCount;
    setBarcodeReframeCount(nextCount);
  }, []);

  const showScanHint = useCallback((message, haptic = 'warning') => {
    if (!message) return;
    const now = Date.now();
    if (scanHintRef.current.message === message && (now - scanHintRef.current.at) < SCAN_HINT_COOLDOWN_MS) return;
    scanHintRef.current = { message, at: now };
    setErrorMsg(message);
    if (haptic) pulseHaptic(haptic);
  }, []);

  const switchToDocumentMode = useCallback((message) => {
    syncBarcodeFailCount(0);
    syncBarcodeReframeCount(0);
    setScanMode('document');
    setErrorMsg(
      message
      || 'No barcode lock yet. Capture label instead or tap "Back to barcode mode" and hold steady.'
    );
    pulseHaptic('warning');
  }, [syncBarcodeFailCount, syncBarcodeReframeCount]);

  const handleBarcodeFallbackAttempt = useCallback(() => {
    const fallback = nextBarcodeFallbackState({
      currentAttempts: barcodeReframeCountRef.current,
      maxReframeAttempts: BARCODE_REFRAME_ATTEMPTS,
    });
    if (fallback.action === 'reframe') {
      syncBarcodeReframeCount(fallback.attempts);
      syncBarcodeFailCount(0);
      setErrorMsg(
        `No lock yet. Reframe ${fallback.attempts}/${BARCODE_REFRAME_ATTEMPTS}: move closer, reduce glare, keep barcode horizontal.`
      );
      pulseHaptic('retry');
      return;
    }
    switchToDocumentMode('No stable barcode lock after reframe retries. Capture label for OCR fallback.');
  }, [switchToDocumentMode, syncBarcodeFailCount, syncBarcodeReframeCount]);

  const handleCaptureWithoutBarcode = useCallback(() => {
    setLockedAwb('');
    setErrorMsg('');
    goStep(STEPS.CAPTURING);
  }, [goStep]);

  const isStableBarcodeRead = useCallback((awb) => {
    const now = Date.now();
    const stability = evaluateBarcodeStability({
      samples: barcodeSamplesRef.current,
      awb,
      now,
      stabilityWindowMs: BARCODE_STABILITY_WINDOW_MS,
      requiredHits: BARCODE_STABILITY_HITS,
    });
    barcodeSamplesRef.current = stability.samples;
    barcodeStabilityRef.current = { awb, hits: stability.hits, lastSeenAt: now };
    return stability.isStable;
  }, []);

  const ensureVideoStreamPlaying = useCallback(async () => {
    if (!isProbablySecureContextForCamera()) {
      throw new Error('Camera requires HTTPS (or localhost). Open this page over https:// on your phone.');
    }
    if (!navigator?.mediaDevices?.getUserMedia) {
      throw new Error('Camera not supported on this browser/device.');
    }
    if (!videoRef.current) {
      throw new Error('Camera element not ready.');
    }

    const existing = videoRef.current.srcObject;
    if (existing && typeof existing.getTracks === 'function') {
      const tracks = existing.getTracks();
      if (tracks.some((t) => t.readyState === 'live')) {
        await videoRef.current.play();
        return;
      }
    }

    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          advanced: [{ focusMode: 'continuous' }, { exposureMode: 'continuous' }],
        },
      });
    } catch {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
    }

    videoRef.current.srcObject = stream;
    await videoRef.current.play();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSessionDuration(fmtDuration(Date.now() - sessionCtx.startedAt)), 30000);
    return () => clearInterval(t);
  }, [sessionCtx.startedAt]);

  // Auto-advance sessionDate when the clock rolls past midnight so the date
  // chip always reflects the actual current calendar day.
  useEffect(() => {
    const msUntilMidnight = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      return midnight - now;
    };
    let timer;
    const scheduleReset = () => {
      timer = setTimeout(() => {
        const todayIso = new Date().toISOString().slice(0, 10);
        setSessionDate(todayIso);
        try { localStorage.setItem('seahawk_scanner_session_date', todayIso); } catch (_) {}
        scheduleReset(); // schedule for the next midnight
      }, msUntilMidnight() + 500);
    };
    scheduleReset();
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    scannedAwbsRef.current = sessionCtx.scannedAwbs instanceof Set ? sessionCtx.scannedAwbs : new Set();
  }, [sessionCtx.scannedAwbs]);

  useEffect(() => {
    try {
      localStorage.setItem(sessionStateKey, JSON.stringify({
        scanNumber: Number(sessionCtx.scanNumber || 0),
        clientFreq: sessionCtx.clientFreq || {},
        dominantClient: sessionCtx.dominantClient || null,
        dominantClientCount: Number(sessionCtx.dominantClientCount || 0),
        startedAt: Number(sessionCtx.startedAt || Date.now()),
        scannedItems: Array.isArray(sessionCtx.scannedItems) ? sessionCtx.scannedItems : [],
        scannedAwbs: Array.from(sessionCtx.scannedAwbs || []),
      }));
    } catch (err) {
      logNonCriticalScannerError('persist session state', err);
    }
  }, [sessionCtx, sessionStateKey]);

  useEffect(() => {
    try {
      if (stickyClientCode) {
        localStorage.setItem(stickyClientStorageKey, stickyClientCode);
      } else {
        localStorage.removeItem(stickyClientStorageKey);
      }
    } catch (err) {
      logNonCriticalScannerError('persist sticky client', err);
    }
  }, [stickyClientCode, stickyClientStorageKey]);

  const saveOfflineQueue = useCallback((nextQueue) => {
    setOfflineQueue(nextQueue);
    try {
      if (nextQueue.length) {
        localStorage.setItem(offlineQueueKey, JSON.stringify(nextQueue));
      } else {
        localStorage.removeItem(offlineQueueKey);
      }
    } catch (err) {
      logNonCriticalScannerError('persist offline queue', err);
    }
  }, [offlineQueueKey]);

  const enqueueOfflineScan = useCallback((payload) => {
    const nextItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      queuedAt: Date.now(),
      payload,
    };
    saveOfflineQueue([...offlineQueue, nextItem]);
    return nextItem;
  }, [offlineQueue, saveOfflineQueue]);

  const postStandaloneScanPayload = useCallback(async (payload) => {
    const scanMode = String(payload?.scanMode || '').toLowerCase();
    if (scanMode === 'fast_barcode_only') {
      await api.post('/shipments/scan', {
        awb: payload.awb,
        courier: 'AUTO',
        captureOnly: true,
        sessionContext: payload.sessionContext || {},
      });
      return;
    }

    await api.post('/shipments/scan-mobile', {
      awb: payload.awb,
      imageBase64: payload.imageBase64,
      focusImageBase64: payload.focusImageBase64 || payload.imageBase64,
      sessionContext: payload.sessionContext || {},
    });
  }, []);

  const flushOfflineQueue = useCallback(async () => {
    if (!offlineQueue.length) return;

    if (isStandalone) {
      if (!navigator.onLine) return;
      const remaining = [];
      for (const item of offlineQueue) {
        if (!item?.payload?.awb) continue;
        try {
          await postStandaloneScanPayload(item.payload);
        } catch {
          remaining.push(item);
        }
      }
      saveOfflineQueue(remaining);
      if (remaining.length) {
        setErrorMsg(`Uploaded partially. ${remaining.length} scan(s) still queued.`);
      } else {
        setErrorMsg('');
      }
      return;
    }

    if (!socket || !socket.connected) return;
    offlineQueue.forEach((item) => {
      if (!item?.payload?.awb) return;
      socket.emit('scanner:scan', item.payload);
    });
    saveOfflineQueue([]);
  }, [isStandalone, socket, offlineQueue, saveOfflineQueue, postStandaloneScanPayload]);

  // ——— Step transition helper ———
  const addToQueue = useCallback((item) => {
    setSessionCtx((prev) => {
      const nextItem = {
        ...item,
        awb: String(item?.awb || '').trim().toUpperCase(),
        queueId: item?.queueId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        date: normalizeQueueDate(item?.date, sessionDate),
        time: item?.time || Date.now(),
      };
      const next = {
        ...prev,
        scannedItems: [nextItem, ...prev.scannedItems],
      };
      // Persist daily count to localStorage
      try {
        localStorage.setItem(TODAY_KEY, String(next.scanNumber));
      } catch (err) {
        logNonCriticalScannerError('persist daily count', err);
      }
      return next;
    });
  }, [TODAY_KEY, sessionDate]);

  const removeQueueItemById = useCallback((queueId, awbValue = '') => {
    if (!queueId) return;
    setSessionCtx((prev) => {
      const nextItems = prev.scannedItems.filter((entry) => entry.queueId !== queueId);
      const nextScannedAwbs = new Set(prev.scannedAwbs);
      const normalizedAwb = String(awbValue || '').trim().toUpperCase();
      if (normalizedAwb) nextScannedAwbs.delete(normalizedAwb);
      scannedAwbsRef.current = nextScannedAwbs;
      return {
        ...prev,
        scannedItems: nextItems,
        scannedAwbs: nextScannedAwbs,
      };
    });
    setEditingQueueItemId((current) => (current === queueId ? '' : current));
  }, []);

  const beginQueueDateEdit = useCallback((item) => {
    if (!item?.queueId) return;
    setEditingQueueItemId(item.queueId);
    setEditingQueueDate(normalizeQueueDate(item.date, sessionDate));
  }, [sessionDate]);

  const cancelQueueDateEdit = useCallback(() => {
    setEditingQueueItemId('');
    setEditingQueueDate('');
  }, []);

  const saveQueueDateEdit = useCallback(async (item) => {
    if (!item?.queueId) return;
    const nextDate = String(editingQueueDate || '').trim();
    if (!ISO_DATE_REGEX.test(nextDate)) {
      window.alert('Please select a valid date.');
      return;
    }
    setQueueActionBusyId(item.queueId);
    try {
      if (item.shipmentId) {
        await api.put(`/shipments/${item.shipmentId}`, { date: nextDate });
      }
      setSessionCtx((prev) => ({
        ...prev,
        scannedItems: prev.scannedItems.map((entry) => (
          entry.queueId === item.queueId ? { ...entry, date: nextDate } : entry
        )),
      }));
      setEditingQueueItemId('');
      setEditingQueueDate('');
    } catch (err) {
      window.alert(err?.message || 'Could not update consignment date.');
    } finally {
      setQueueActionBusyId('');
    }
  }, [editingQueueDate]);

  const deleteQueueItem = useCallback(async (item) => {
    if (!item?.queueId) return;
    const awbLabel = String(item.awb || '').trim() || 'this consignment';
    const confirmMessage = item.shipmentId
      ? `Delete ${awbLabel}? This will remove it from accepted consignments and from the server.`
      : `Remove ${awbLabel} from accepted consignments?`;
    if (!window.confirm(confirmMessage)) return;
    setQueueActionBusyId(item.queueId);
    try {
      if (item.shipmentId) {
        await api.delete(`/shipments/${item.shipmentId}`);
      }
      removeQueueItemById(item.queueId, item.awb);
    } catch (err) {
      window.alert(err?.message || 'Could not delete consignment.');
    } finally {
      setQueueActionBusyId('');
    }
  }, [removeQueueItemById]);

  useEffect(() => {
    addToQueueRef.current = addToQueue;
  }, [addToQueue]);

  useEffect(() => {
    reviewDataRef.current = reviewData;
  }, [reviewData]);

  useEffect(() => {
    reviewFormRef.current = reviewForm;
  }, [reviewForm]);

  const handleStartScanning = useCallback(() => {
    if (connStatus !== 'paired') {
      setErrorMsg(isStandalone ? 'Scanner is offline. Reconnect internet and retry.' : 'Phone is not connected to the desktop session.');
      return;
    }
    setErrorMsg('');
    if (isE2eMock) {
      goStep(STEPS.SCANNING);
      return;
    }
    // iOS Safari: starting camera from a user gesture is more reliable than
    // starting it in a React effect.
    ensureVideoStreamPlaying()
      .then(() => goStep(STEPS.SCANNING))
      .catch((err) => setErrorMsg(err?.message || 'Camera access failed.'));
  }, [connStatus, ensureVideoStreamPlaying, goStep, isE2eMock, isStandalone]);

  const handleManualAwbSubmit = useCallback((e) => {
    e?.preventDefault();
    const awb = manualAwb.trim().toUpperCase();
    if (!awb || awb.length < 6) { setErrorMsg('Enter a valid AWB number (min 6 chars)'); return; }
    if (connStatus !== 'paired') {
      setErrorMsg(isStandalone ? 'Scanner is offline. Reconnect internet and retry.' : 'Not connected to desktop session.');
      return;
    }
    setErrorMsg('');
    setManualAwb('');
    setLockedAwb(awb);
    if (isE2eMock) {
      setCaptureCameraReady(true);
      goStep(STEPS.CAPTURING);
      return;
    }
    if (scanWorkflowMode === 'fast') {
      submitFastBarcodeRef.current?.(awb);
      return;
    }
    setCaptureCameraReady(true);
    goStep(STEPS.CAPTURING);
  }, [manualAwb, connStatus, goStep, isE2eMock, isStandalone, scanWorkflowMode]);

  const terminateSession = useCallback(() => {
    if (!window.confirm(isStandalone ? 'Exit this scanner session on the phone?' : 'End this mobile scanner session on the phone?')) return;
    try {
      localStorage.removeItem(sessionStateKey);
    } catch (err) {
      logNonCriticalScannerError('clear session state on terminate', err);
    }
    if (isStandalone) {
      navigate('/app/scan');
      return;
    }
    if (socket?.connected) {
      socket.emit('scanner:end-session', { reason: 'Mobile ended the session' });
    } else {
      navigate('/');
    }
  }, [socket, navigate, isStandalone, sessionStateKey]);

  const saveAndUpload = useCallback(() => {
    if (offlineQueue.length > 0) {
      void flushOfflineQueue();
      return;
    }
    window.alert(isStandalone ? 'No queued scans to upload.' : 'Everything is already synced.');
  }, [offlineQueue.length, flushOfflineQueue, isStandalone]);

  useEffect(() => {
    currentStepRef.current = step;
  }, [step]);

  const handleLookupNeedsPhoto = useCallback((data = null) => {
    if (data) setReviewData(data);
    setProcessingFields({});
    setErrorMsg('');
    goStep(STEPS.CAPTURING);
  }, [goStep]);

  const applyProcessedScanResult = useCallback((data) => {
    if (!data) return;
    const suggestedClientCode = normalizeClientCode(data.clientCode || '');
    const effectiveClientCode = normalizeClientCode(stickyClientCode || suggestedClientCode);
    setReviewData(data);
    const stripUnknown = (v) => {
      const s = String(v || '').trim().toUpperCase();
      return (s === 'UNKNOWN' || s === 'N/A' || s === 'NA' || s === 'NONE') ? '' : String(v || '').trim();
    };
    // Auto-detect courier from AWB prefix if OCR didn't return one
    const ocrCourier = normalizeReviewCourier(data.courier || '');
    const awbInferred = inferCourierFromAwb(data.awb || lockedAwb);
    const effectiveCourier = ocrCourier || awbInferred || '';
    setInferredCourier(awbInferred);
    // Auto-fill destination from pincode if OCR couldn't read it
    const ocrDest = stripUnknown(data.destination);
    const ocrPin = data.pincode || '';
    const pinCity = !ocrDest && ocrPin.length === 6 ? lookupPincodeCity(ocrPin) : '';
    setReviewForm({
      clientCode: effectiveClientCode,
      consignee: stripUnknown(data.consignee),
      destination: ocrDest || pinCity,
      pincode: ocrPin,
      weight: data.weight || 0,
      amount: data.amount || 0,
      orderNo: data.orderNo || '',
      courier: effectiveCourier,
      date: data.date || sessionDate || new Date().toISOString().slice(0, 10),
    });
    setProcessingFields({});

    if (data.reviewRequired) {
      pulseHaptic('review');
      playHardwareBeep();
      goStep(STEPS.REVIEWING);
      return;
    }

    playSuccessBeep();
    pulseHaptic('success');
    if (voiceEnabled) speak(`Auto approved. ${data.clientName || ''}. ${data.destination || ''}.`);
    const item = {
      awb: data.awb,
      clientCode: effectiveClientCode || data.clientCode,
      clientName: data.clientName,
      destination: data.destination || '',
      weight: data.weight || 0,
      autoApproved: true,
      shipmentId: data.shipmentId || null,
      date: normalizeQueueDate(data.date, sessionDate),
    };
    setLastSuccess(item);
    addToQueue(item);
    goStep(STEPS.SUCCESS);
  }, [addToQueue, goStep, voiceEnabled, sessionDate, stickyClientCode]);

  useEffect(() => {
    handleLookupNeedsPhotoRef.current = handleLookupNeedsPhoto;
  }, [handleLookupNeedsPhoto]);

  useEffect(() => {
    applyProcessedScanResultRef.current = applyProcessedScanResult;
  }, [applyProcessedScanResult]);

  // ══════════════════════════════════════════════════════════════════════════════════
  // SOCKET CONNECTION
  // ══════════════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (isE2eMock) {
      setConnStatus('paired');
      setPairedLabel('Mock Mode');
      setErrorMsg('');
      goStep(STEPS.IDLE);
      return undefined;
    }

    if (isStandalone) {
      setSocket(null);
      setConnStatus('paired');
      setPairedLabel('Direct Mode');
      setErrorMsg('');
      goStep(STEPS.IDLE);
      return undefined;
    }

    if (!pin) { setErrorMsg('No PIN provided.'); return; }

    const s = io(SOCKET_URL, {
      auth: { scannerPin: pin },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1500,
      reconnectionAttempts: 20,
    });

    s.on('connect', () => setConnStatus('connecting'));
    s.on('scanner:paired', ({ userEmail }) => {
      setConnStatus('paired');
      setPairedLabel(userEmail ? userEmail.split('@')[0] : 'Connected');
      setErrorMsg('');
      // Don't interrupt active scan workflows — only go to IDLE if we're
      // in a state that makes sense to reset (initial connect or error recovery).
      const cs = currentStepRef.current;
      if (cs === STEPS.PROCESSING || cs === STEPS.REVIEWING || cs === STEPS.APPROVING || cs === STEPS.SUCCESS) {
        return; // Stay on current step — socket reconnected but workflow is active
      }
      goStep(STEPS.IDLE);
    });
    s.on('scanner:error', ({ message }) => {
      setErrorMsg(message);
      setConnStatus('disconnected');
    });
    s.on('scanner:session-ended', ({ reason }) => {
      setConnStatus('disconnected');
      setErrorMsg(reason || 'Session ended by desktop.');
      try {
        localStorage.removeItem(sessionStateKey);
      } catch (err) {
        logNonCriticalScannerError('clear session state on end', err);
      }
      navigate('/');
    });
    s.on('scanner:desktop-disconnected', ({ message }) => {
      setConnStatus('paired');
      setErrorMsg(message || 'Desktop disconnected. Keep scanning; approvals will resume when desktop reconnects.');
    });
    s.on('disconnect', () => setConnStatus('disconnected'));
    s.on('reconnect', () => {
      // CRITICAL: Never interrupt active scan workflows on reconnect.
      // The old code used a stale connStatus closure that always saw 'paired',
      // causing the phone to jump back to SCANNING mid-processing.
      const cs = currentStepRef.current;
      if (cs === STEPS.PROCESSING || cs === STEPS.REVIEWING || cs === STEPS.APPROVING || cs === STEPS.SUCCESS) {
        // Stay on current step — don't interrupt the workflow
        setConnStatus('paired');
        return;
      }
      setConnStatus('paired');
      goStep(STEPS.SCANNING);
    });

    // Desktop/Server processed our scan
    s.on('scanner:scan-processed', (data) => {
      const currentStep = currentStepRef.current;

      // Only process events when we're actually waiting for results (PROCESSING),
      // or when we're in REVIEWING and receive an upgrade (non-error, better data).
      // Ignore events during all other steps to prevent race conditions where
      // a late-arriving desktop error overrides a successful server result.
      if (currentStep !== STEPS.PROCESSING && currentStep !== STEPS.REVIEWING) {
        return; // Ignore — we're not expecting scan results right now
      }

      if (data.status === 'error') {
        // Only show errors if we're still in PROCESSING (waiting for ANY result).
        // If we're already in REVIEWING, a late error should NOT override it.
        if (currentStep !== STEPS.PROCESSING) return;
        setFlash('error');
        playErrorBeep();
        pulseHaptic('error');
        goStep(STEPS.ERROR);
        setErrorMsg(data.error || 'Scan failed on desktop.');
        return;
      }

      if (data.status === 'photo_required' || data.requiresImageCapture) {
        handleLookupNeedsPhotoRef.current?.(data);
        return;
      }

      applyProcessedScanResultRef.current?.(data);
    });

    // Desktop approved our mobile-submitted approval
    s.on('scanner:approval-result', ({ success, message, awb, shipmentId }) => {
      clearTimeout(approvalResultTimerRef.current);
      approvalResultTimerRef.current = null;
      const activeReviewData = reviewDataRef.current || {};
      const activeReviewForm = reviewFormRef.current || {};
      if (success) {
        playHardwareBeep();
        pulseHaptic('success');
        setFlash('success');
        const approvedClientCode = normalizeClientCode(activeReviewForm.clientCode || '');
        if (approvedClientCode) {
          setStickyClientCode(approvedClientCode === 'MISC' ? '' : approvedClientCode);
        }
        if (approvedClientCode && approvedClientCode !== 'MISC') {
          setSessionCtx((prev) => {
            const freq = { ...prev.clientFreq };
            freq[approvedClientCode] = (freq[approvedClientCode] || 0) + 1;
            const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
            return {
              ...prev,
              clientFreq: freq,
              dominantClient: sorted[0]?.[1] >= 2 ? sorted[0][0] : null,
              dominantClientCount: sorted[0]?.[1] || 0,
            };
          });
        }
        const item = {
          awb: activeReviewData?.awb || awb,
          clientCode: activeReviewForm.clientCode,
          clientName: activeReviewData?.clientName || activeReviewForm.clientCode,
          destination: activeReviewForm.destination || '',
          weight: parseFloat(activeReviewForm.weight) || 0,
          shipmentId: shipmentId || activeReviewData?.shipmentId || null,
          date: normalizeQueueDate(activeReviewForm.date || activeReviewData?.date, ''),
        };
        setLastSuccess(item);
        addToQueueRef.current?.(item);
        goStep(STEPS.SUCCESS);
        return;
      }

      if (currentStepRef.current !== STEPS.APPROVING) return;
      playErrorBeep();
      pulseHaptic('error');
      setErrorMsg(message || 'Approval failed. Please review and try again.');
      goStep(STEPS.REVIEWING);
    });

    s.on('scanner:ready-for-next', () => {
      // Desktop is ready; keep current mobile state.
    });

    setSocket(s);
    return () => { s.disconnect(); };
  }, [pin, goStep, navigate, isE2eMock, isStandalone, sessionStateKey]);

  useEffect(() => {
    if (isE2eMock || isStandalone) return undefined;
    if (!socket || connStatus !== 'paired' || !socket.connected) return undefined;

    const sendHeartbeat = () => {
      socket.emit('scanner:heartbeat', {}, () => {});
    };
    sendHeartbeat();
    const timer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [socket, connStatus, isE2eMock, isStandalone]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(offlineQueueKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        setOfflineQueue(parsed);
      }
    } catch (err) {
      logNonCriticalScannerError('hydrate offline queue', err);
    }
  }, [offlineQueueKey]);

  useEffect(() => {
    try {
      localStorage.setItem(WORKFLOW_MODE_KEY, scanWorkflowMode);
    } catch (err) {
      logNonCriticalScannerError('persist workflow mode', err);
    }
  }, [scanWorkflowMode]);

  useEffect(() => {
    try {
      localStorage.setItem(DEVICE_PROFILE_KEY, deviceProfile);
    } catch (err) {
      logNonCriticalScannerError('persist device profile', err);
    }
  }, [deviceProfile]);

  useEffect(() => {
    if (!offlineQueue.length) return;
    if (isStandalone) {
      if (connStatus === 'paired' && navigator.onLine) {
        void flushOfflineQueue();
      }
      return;
    }
    if (connStatus === 'paired' && socket?.connected) {
      void flushOfflineQueue();
    }
  }, [connStatus, socket, offlineQueue.length, flushOfflineQueue, isStandalone]);

  const stopCamera = useCallback(async () => {
    try {
      setCaptureCameraReady(false);
      // Stop WASM barcode engine
      if (barcodeEngineRef.current) { barcodeEngineRef.current.stop(); }
      if (scanbotRef.current) {
        try {
          const sdk = scanbotRef.current;
          if (sdk?.barcodeScanner) await sdk.barcodeScanner.dispose();
        } catch (err) {
          logNonCriticalScannerError('dispose scanbot camera scanner', err);
        }
        scanbotRef.current = null;
      }
      if (scannerRef.current) {
        try {
          await scannerRef.current.reset();
        } catch (err) {
          logNonCriticalScannerError('reset camera scanner', err);
        }
        scannerRef.current = null;
      }
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
    } catch (err) {
      logNonCriticalScannerError('stopCamera', err);
    }
  }, []);

  const stopBarcodeScanner = useCallback(async () => {
    try {
      setScannerEngine('idle');
      // Stop WASM barcode engine
      if (barcodeEngineRef.current) { barcodeEngineRef.current.stop(); }
      if (scanbotRef.current) {
        try {
          await scanbotRef.current.barcodeScanner.dispose();
        } catch (err) {
          logNonCriticalScannerError('dispose barcode scanner', err);
        }
        scanbotRef.current = null;
      }
      if (scannerRef.current) {
        try {
          if (scannerRef.current._type === 'native') {
            scannerRef.current.reset();
          } else {
            await scannerRef.current.reset();
          }
        } catch (err) {
          logNonCriticalScannerError('reset barcode scanner', err);
        }
        scannerRef.current = null;
      }
    } catch (err) {
      logNonCriticalScannerError('stopBarcodeScanner', err);
    }
  }, []);

  const startBarcodeScanner = useCallback(async () => {
    if (!videoRef.current) return;
    await stopBarcodeScanner();

    try {
      scannerStartedAtRef.current = Date.now();
      await ensureVideoStreamPlaying();

      // Create & start the WASM-powered barcode engine
      if (!barcodeEngineRef.current) {
        barcodeEngineRef.current = createBarcodeScanner();
      }

      await barcodeEngineRef.current.start(videoRef.current, guideRef.current, {
        onDetected: (rawValue, meta) => {
          if (scanBusyRef.current) return;
          syncBarcodeFailCount(0);
          const format = meta?.format || 'unknown';
          const engine = meta?.engine || 'unknown';
          setLastDetectionMeta({
            value: rawValue,
            format,
            engine,
            at: Date.now(),
            sinceStartMs: scannerStartedAtRef.current ? Date.now() - scannerStartedAtRef.current : null,
            candidateCount: meta?.candidateCount || 1,
            ambiguous: false,
            alternatives: meta?.alternatives || [],
          });
          setScannerEngine(engine);
          handleBarcodeDetectedRef.current?.(rawValue, {
            candidateCount: meta?.candidateCount || 1,
            ambiguous: false,
            alternatives: meta?.alternatives || [],
            format,
            engine,
          });
        },
        onFail: () => {
          const nextFailCount = barcodeFailCountRef.current + 1;
          syncBarcodeFailCount(nextFailCount);
          if (nextFailCount >= BARCODE_FAIL_THRESHOLD) {
            handleBarcodeFallbackAttempt();
          }
        },
        onEngineReady: (engineName) => {
          console.log(`[MobileScanner] Barcode engine ready: ${engineName}`);
          setScannerEngine(engineName);
        },
      });
    } catch (err) {
      setErrorMsg('Camera access failed: ' + err.message);
    }
  }, [ensureVideoStreamPlaying, stopBarcodeScanner, handleBarcodeFallbackAttempt, syncBarcodeFailCount]);
  // Note: handleBarcodeDetected is intentionally NOT in the dep array here.
  // The scanner is set up once per SCANNING entry; the ref ensures it always
  // calls the latest callback without needing to restart the scanner.

  const handleBarcodeDetected = useCallback((rawText, detectionMeta = {}) => {
    const compactRaw = String(rawText || '').trim().replace(/\s+/g, '').toUpperCase();
    const awb = normalizeBarcodeCandidate(rawText) || compactRaw;
    if (scanBusyRef.current || currentStepRef.current !== STEPS.SCANNING) return;
    if (!awb || awb.length < 8) {
      const partial = compactRaw.replace(/[^A-Z0-9]/g, '');
      if (partial.length >= 4) {
        showScanHint('Partial barcode detected. Move closer so full AWB is visible.');
      }
      return;
    }
    if (detectionMeta?.ambiguous) {
      const nextFailCount = barcodeFailCountRef.current + 1;
      syncBarcodeFailCount(nextFailCount);
      showScanHint('Multiple barcodes detected. Keep only the AWB barcode inside the strip.', 'retry');
      if (nextFailCount >= BARCODE_FAIL_THRESHOLD) {
        handleBarcodeFallbackAttempt();
      }
      return;
    }
    if (!isE2eMock && !isStableBarcodeRead(awb)) return;
    scanBusyRef.current = true;

    // Duplicate detection — read from the stable ref so this check is never stale
    // even when the scanner callback was closed over an old render.
    if (scannedAwbsRef.current.has(awb)) {
      pulseHaptic('duplicate');
      playErrorBeep();
      setDuplicateWarning(awb);
      setTimeout(() => {
        setDuplicateWarning('');
        scanBusyRef.current = false;
        barcodeStabilityRef.current = { awb: '', hits: 0, lastSeenAt: 0 };
        barcodeSamplesRef.current = [];
      }, 2500);
      return;
    }

    clearTimeout(lockToCaptureTimerRef.current);
    pulseHaptic('lock');
    playHardwareBeep(); // True hardware beep
    setShowLockRing(true);
    setLockedAwb(awb);
    const lockTimeMs = scannerStartedAtRef.current ? Date.now() - scannerStartedAtRef.current : null;
    setLastLockTimeMs(lockTimeMs);
    lockTelemetryRef.current = {
      lockTimeMs,
      candidateCount: Number(detectionMeta?.candidateCount || 1),
      ambiguous: Boolean(detectionMeta?.ambiguous),
      alternatives: Array.isArray(detectionMeta?.alternatives) ? detectionMeta.alternatives.slice(0, 3) : [],
    };
    syncBarcodeReframeCount(0);
    syncBarcodeFailCount(0);
    setErrorMsg('');

    // Update session — also keep scannedAwbsRef in sync for future duplicate checks.
      setSessionCtx(prev => {
        const next = { ...prev, scanNumber: prev.scanNumber + 1 };
        next.scannedAwbs = new Set(prev.scannedAwbs);
        next.scannedAwbs.add(awb);
        scannedAwbsRef.current = next.scannedAwbs; // keep stable ref in sync
        return next;
      });

    if (scanWorkflowMode === 'fast') {
      submitFastBarcodeRef.current?.(awb);
      return;
    }

    setCaptureCameraReady(true);
    goStep(STEPS.CAPTURING);
  }, [goStep, isStableBarcodeRead, scanWorkflowMode, isE2eMock, syncBarcodeFailCount, syncBarcodeReframeCount, showScanHint, handleBarcodeFallbackAttempt]); // sessionCtx removed from deps — duplicate check now uses scannedAwbsRef

  // Keep handleBarcodeDetectedRef pointing at the latest callback so the scanner
  // (which is set up once per SCANNING entry) always calls current logic.
  useEffect(() => {
    handleBarcodeDetectedRef.current = handleBarcodeDetected;
  }, [handleBarcodeDetected]);

  // Start scanning when step changes to SCANNING
  useEffect(() => {
    if (step === STEPS.SCANNING) {
      scanBusyRef.current = false;
      barcodeStabilityRef.current = { awb: '', hits: 0, lastSeenAt: 0 };
      barcodeSamplesRef.current = [];
      lockTelemetryRef.current = { lockTimeMs: null, candidateCount: 1, ambiguous: false, alternatives: [] };
      setLastLockTimeMs(null);
      syncBarcodeReframeCount(0);
      syncBarcodeFailCount(0);
      setScanMode('barcode'); // always start fresh in barcode mode
      startBarcodeScanner();
      if (isE2eMock && mockBarcodeRaw) {
        const timer = setTimeout(() => {
          if (currentStepRef.current === STEPS.SCANNING) {
            handleBarcodeDetectedRef.current?.(mockBarcodeRaw);
          }
        }, 50);
        return () => clearTimeout(timer);
      }
    }
    return () => {
      // When leaving SCANNING, stop only the barcode reader — keep the video stream
      // alive so CAPTURING can reuse it instantly with no black-frame flicker.
      if (step === STEPS.SCANNING) stopBarcodeScanner();
    };
  }, [step, startBarcodeScanner, stopBarcodeScanner, syncBarcodeFailCount, syncBarcodeReframeCount, isE2eMock, mockBarcodeRaw]);

  // ══════════════════════════════════════════════════════════════════════════════════
  // PHOTO CAPTURE (Document mode)
  // ══════════════════════════════════════════════════════════════════════════════════

  const startDocumentCamera = useCallback(async () => {
    if (isE2eMock) {
      setCaptureCameraReady(true);
      return;
    }
    await stopBarcodeScanner(); // ensure barcode reader is off
    try {
      await ensureVideoStreamPlaying();
      setCaptureCameraReady(true);
    } catch (err) {
      setErrorMsg('Camera access failed: ' + err.message);
    }
  }, [ensureVideoStreamPlaying, stopBarcodeScanner, isE2eMock]);

  useEffect(() => {
    if (step === STEPS.CAPTURING) startDocumentCamera();
  }, [step, startDocumentCamera]);

  const evaluateCaptureQuality = useCallback(() => {
    const video = videoRef.current;
    const guide = guideRef.current;
    return analyzeCaptureQuality(video, guide);
  }, []);

  useEffect(() => {
    if (step !== STEPS.CAPTURING) {
      setDocDetected(false);
      setDocStableTicks(0);
      setCaptureQuality({ ok: false, issues: [], metrics: null });
      autoCaptureTriggeredRef.current = false;
      captureReadyHapticRef.current = false;
      return;
    }

    // Detect capture quality live to gate blur/glare/angle before shutter.
    const tick = setInterval(() => {
      const quality = evaluateCaptureQuality();
      if (!quality) return;
      setCaptureQuality(quality);
      setDocDetected(quality.ok);
      setDocStableTicks((prev) => {
        const next = quality.ok ? Math.min(prev + 1, 8) : 0;
        const becameReady = next >= DOC_STABLE_MIN_TICKS && !captureReadyHapticRef.current;
        if (becameReady) {
          pulseHaptic('tap');
          captureReadyHapticRef.current = true;
        }
        if (!quality.ok) captureReadyHapticRef.current = false;
        return next;
      });
    }, 280);

    return () => clearInterval(tick);
  }, [step, evaluateCaptureQuality]);

  const captureDocumentRegion = useCallback((opts = {}) => {
    const video = videoRef.current;
    const guide = guideRef.current;
    if (!video || !guide || !video.videoWidth) return null;

    const crop = cropRectForCoverVideo(video, guide);
    if (!crop) return null;

    const cropX = crop.x;
    const cropY = crop.y;
    const cropW = crop.w;
    const cropH = crop.h;
    if (!cropW || !cropH) return null;

    const maxWidth = Math.max(640, Number(opts.maxWidth || CAPTURE_MAX_WIDTH));
    const jpegQuality = Math.min(0.85, Math.max(0.55, Number(opts.quality || CAPTURE_JPEG_QUALITY)));
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(maxWidth, Math.round(cropW));
    canvas.height = Math.round((canvas.width / cropW) * cropH);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', jpegQuality);
    const base64 = dataUrl.split(',')[1] || '';
    if (!base64) return null;
    const approxBytes = Math.floor((base64.length * 3) / 4);
    return {
      base64,
      width: canvas.width,
      height: canvas.height,
      approxBytes,
      quality: jpegQuality,
    };
  }, []);

  const handleCapturePhoto = useCallback(() => {
    const now = Date.now();
    if (now - lastCaptureAtRef.current < DOC_CAPTURE_MIN_INTERVAL_MS) return;
    lastCaptureAtRef.current = now;

    const quality = evaluateCaptureQuality() || captureQuality;
    if (!quality?.ok || docStableTicks < DOC_STABLE_MIN_TICKS) {
      setErrorMsg(describeCaptureIssues(quality?.issues) || 'Capture quality is low. Hold steady and align the AWB in the frame.');
      pulseHaptic('warning');
      playErrorBeep();
      return;
    }

    setFlash('white');
    playCaptureBeep();
    pulseHaptic('tap');

    const shot = captureDocumentRegion({ maxWidth: CAPTURE_MAX_WIDTH, quality: CAPTURE_JPEG_QUALITY });
    if (!shot?.base64) {
      setErrorMsg('Could not capture image. Try again.');
      scanBusyRef.current = false;
      return;
    }

    setCaptureMeta({
      kb: Math.round((shot.approxBytes || 0) / 1024),
      width: shot.width || 0,
      height: shot.height || 0,
      quality: shot.quality || CAPTURE_JPEG_QUALITY,
    });
    setCapturedImage(`data:image/jpeg;base64,${shot.base64}`);
    stopCamera();
    goStep(STEPS.PREVIEW);
  }, [captureDocumentRegion, stopCamera, goStep, evaluateCaptureQuality, captureQuality, docStableTicks]);

  const handleMockCapturePhoto = useCallback(() => {
    if (!isE2eMock) return;
    const mockImage = 'data:image/jpeg;base64,ZmFrZS1tb2NrLWltYWdl';
    setCaptureMeta({ kb: 0, width: 0, height: 0, quality: CAPTURE_JPEG_QUALITY });
    setCapturedImage(mockImage);
    stopCamera();
    goStep(STEPS.PREVIEW);
  }, [goStep, isE2eMock, stopCamera]);

  // Auto-capture is intentionally disabled — user presses the shutter button manually.

  // ══════════════════════════════════════════════════════════════════════════════════
  // SEND TO DESKTOP (OCR Pipeline)
  // ══════════════════════════════════════════════════════════════════════════════════

  const buildSessionContextPayload = useCallback(() => ({
    scanNumber: sessionCtx.scanNumber,
    recentClient: sessionCtx.dominantClient,
    dominantClient: sessionCtx.dominantClient,
    dominantClientCount: sessionCtx.dominantClientCount,
    stickyClientCode: stickyClientCode || undefined,
    sessionDurationMin: Math.round((Date.now() - sessionCtx.startedAt) / 60000),
    sessionDate,
    scanWorkflowMode,
    scanMode,
    deviceProfile,
    hardwareClass: deviceProfile === DEVICE_PROFILES.rugged ? 'rugged' : 'phone',
    captureQuality: {
      ok: Boolean(captureQuality.ok),
      issues: Array.isArray(captureQuality.issues) ? captureQuality.issues.slice(0, 8) : [],
      metrics: captureQuality.metrics || null,
    },
    captureMeta: {
      kb: captureMeta.kb || 0,
      width: captureMeta.width || 0,
      height: captureMeta.height || 0,
      quality: captureMeta.quality || CAPTURE_JPEG_QUALITY,
    },
    lockTimeMs: Number.isFinite(Number(lockTelemetryRef.current?.lockTimeMs)) ? Number(lockTelemetryRef.current.lockTimeMs) : null,
    lockCandidateCount: Number.isFinite(Number(lockTelemetryRef.current?.candidateCount)) ? Number(lockTelemetryRef.current.candidateCount) : 1,
    lockAlternatives: Array.isArray(lockTelemetryRef.current?.alternatives) ? lockTelemetryRef.current.alternatives.slice(0, 3) : [],
  }), [sessionCtx, sessionDate, scanWorkflowMode, scanMode, deviceProfile, captureQuality, captureMeta, stickyClientCode]);

  const submitFastBarcode = useCallback(async (awb) => {
    const cleanAwb = String(awb || '').trim().toUpperCase();
    if (!cleanAwb) return;

    goStep(STEPS.PROCESSING);

    if (isE2eMock) {
      setTimeout(() => {
        const item = {
          awb: cleanAwb,
          clientCode: 'MOCKCL',
          clientName: 'Mock Client',
          destination: 'Delhi',
          weight: 1.25,
          date: sessionDate,
        };
        setLastSuccess(item);
        addToQueue(item);
        goStep(STEPS.SUCCESS);
      }, 120);
      return;
    }

    const payload = {
      awb: cleanAwb,
      imageBase64: null,
      focusImageBase64: null,
      scanMode: 'fast_barcode_only',
      sessionContext: buildSessionContextPayload(),
    };

    if (isStandalone) {
      if (!navigator.onLine) {
        enqueueOfflineScan(payload);
        playSuccessBeep();
        pulseHaptic('success');
        const item = { awb: cleanAwb, clientCode: 'OFFLINE', clientName: 'Queued Offline', destination: '', weight: 0, date: sessionDate };
        setLastSuccess({ ...item, offlineQueued: true });
        addToQueue(item);
        goStep(STEPS.SUCCESS);
        return;
      }

      try {
        const res = await api.post('/shipments/scan', {
          awb: cleanAwb,
          courier: 'AUTO',
          captureOnly: true,
          sessionContext: buildSessionContextPayload(),
        });
        const shipment = res?.data?.shipment || {};
        const item = {
          awb: shipment.awb || cleanAwb,
          clientCode: shipment.clientCode || 'MISC',
          clientName: shipment.client?.company || shipment.clientCode || 'Scanned',
          destination: shipment.destination || '',
          weight: shipment.weight || 0,
          shipmentId: shipment.id || null,
          date: normalizeQueueDate(shipment.date, sessionDate),
        };
        setLastSuccess(item);
        addToQueue(item);
        playSuccessBeep();
        pulseHaptic('success');
        goStep(STEPS.SUCCESS);
      } catch (err) {
        setErrorMsg(err?.message || 'Barcode processing failed. Please try again.');
        playErrorBeep();
        pulseHaptic('error');
        goStep(STEPS.ERROR);
      }
      return;
    }

    if (!socket || !socket.connected || connStatus !== 'paired') {
      enqueueOfflineScan(payload);
      playSuccessBeep();
      pulseHaptic('success');
      const item = { awb: cleanAwb, clientCode: 'OFFLINE', clientName: 'Queued Offline', destination: '', weight: 0, date: sessionDate };
      setLastSuccess({ ...item, offlineQueued: true });
      addToQueue(item);
      goStep(STEPS.SUCCESS);
      return;
    }

    socket.emit('scanner:scan', payload);

    setTimeout(() => {
      if (currentStepRef.current === STEPS.PROCESSING) {
        setErrorMsg('Barcode processing timed out. Please try scanning again.');
        playErrorBeep();
        pulseHaptic('error');
        goStep(STEPS.ERROR);
      }
    }, FAST_SCAN_TIMEOUT_MS);
  }, [socket, connStatus, goStep, isE2eMock, enqueueOfflineScan, addToQueue, buildSessionContextPayload, isStandalone, sessionDate]);

  useEffect(() => {
    submitFastBarcodeRef.current = submitFastBarcode;
  }, [submitFastBarcode]);

  const submitLookupDecision = useCallback(async (awb) => {
    const cleanAwb = String(awb || '').trim().toUpperCase();
    if (!cleanAwb) return;

    goStep(STEPS.PROCESSING);

    if (isE2eMock) {
      goStep(STEPS.CAPTURING);
      return;
    }

    const payload = {
      awb: cleanAwb,
      scanMode: 'lookup_first',
      sessionContext: buildSessionContextPayload(),
    };

    if (isStandalone) {
      if (!navigator.onLine) {
        handleLookupNeedsPhoto({ awb: cleanAwb, status: 'photo_required', requiresImageCapture: true });
        return;
      }

      try {
        const result = await api.post('/shipments/scan-mobile', payload);
        const data = result?.data || result;
        if (data.status === 'error' || !data.success) {
          setFlash('error');
          playErrorBeep();
          pulseHaptic('error');
          goStep(STEPS.ERROR);
          setErrorMsg(data.error || data.message || 'Lookup failed.');
          return;
        }
        if (data.status === 'photo_required' || data.requiresImageCapture) {
          handleLookupNeedsPhoto(data);
          return;
        }
        applyProcessedScanResult(data);
      } catch (err) {
        setErrorMsg(err?.message || 'Lookup failed. Please try again.');
        playErrorBeep();
        pulseHaptic('error');
        goStep(STEPS.ERROR);
      }
      return;
    }

    if (!socket || !socket.connected || connStatus !== 'paired') {
      handleLookupNeedsPhoto({ awb: cleanAwb, status: 'photo_required', requiresImageCapture: true });
      return;
    }

    socket.emit('scanner:scan', payload);
    setTimeout(() => {
      if (currentStepRef.current === STEPS.PROCESSING) {
        setErrorMsg('Lookup timed out. Capture the label photo and continue.');
        goStep(STEPS.CAPTURING);
      }
    }, LOOKUP_DECISION_TIMEOUT_MS);
  }, [socket, connStatus, goStep, isE2eMock, buildSessionContextPayload, isStandalone, handleLookupNeedsPhoto, applyProcessedScanResult]);

  useEffect(() => {
    submitLookupDecisionRef.current = submitLookupDecision;
  }, [submitLookupDecision]);

  const submitForProcessing = useCallback(async () => {
    if (!capturedImage) return;
    goStep(STEPS.PROCESSING);
    if (isE2eMock) {
      setTimeout(() => {
        const item = {
          awb: lockedAwb || '100454974120',
          clientCode: 'MOCKCL',
          clientName: 'Mock Client',
          destination: 'Delhi',
          weight: 1.25,
          date: sessionDate,
        };
        setLastSuccess(item);
        addToQueue(item);
        goStep(STEPS.SUCCESS);
      }, 250);
      return;
    }

    // Extract base64 from data URL
    const imageBase64 = capturedImage.split(',')[1] || capturedImage;

    const payload = {
      awb: lockedAwb || '',
      imageBase64,
      focusImageBase64: imageBase64,
      scanMode: 'ocr_label',
      sessionContext: buildSessionContextPayload(),
    };

    if (isStandalone) {
      if (!navigator.onLine) {
        enqueueOfflineScan(payload);
        playSuccessBeep();
        pulseHaptic('success');
        const item = { awb: lockedAwb || 'PENDING_OCR', clientCode: 'OFFLINE', clientName: 'Queued Offline', destination: '', weight: 0, date: sessionDate };
        setLastSuccess({ ...item, offlineQueued: true });
        addToQueue(item);
        goStep(STEPS.SUCCESS);
        return;
      }

      try {
        const result = await api.post('/shipments/scan-mobile', payload);
        const data = result?.data || result;
        if (data.status === 'error' || !data.success) {
          setFlash('error');
          playErrorBeep();
          pulseHaptic('error');
          goStep(STEPS.ERROR);
          setErrorMsg(data.error || data.message || 'Scan failed.');
          return;
        }
        if (data.status === 'photo_required' || data.requiresImageCapture) {
          handleLookupNeedsPhoto(data);
          return;
        }
        applyProcessedScanResult(data);
      } catch (err) {
        setErrorMsg(err?.message || 'Server error. Please try again.');
        playErrorBeep();
        pulseHaptic('error');
        goStep(STEPS.ERROR);
      }
      return;
    }

    if (!socket || !socket.connected || connStatus !== 'paired') {
      enqueueOfflineScan(payload);
      playSuccessBeep();
      pulseHaptic('success');
      const item = { awb: lockedAwb || 'PENDING_OCR', clientCode: 'OFFLINE', clientName: 'Queued Offline', destination: '', weight: 0, date: sessionDate };
      setLastSuccess({ ...item, offlineQueued: true });
      addToQueue(item);
      goStep(STEPS.SUCCESS);
      return;
    }

    socket.emit('scanner:scan', payload);

    // Timeout fallback for slow OCR processing
    setTimeout(() => {
      if (currentStepRef.current === STEPS.PROCESSING) {
        setErrorMsg('OCR timed out after 40 seconds. Retake the label photo and try again.');
        playErrorBeep();
        pulseHaptic('error');
        goStep(STEPS.ERROR);
      }
    }, 40000);
  }, [socket, lockedAwb, capturedImage, goStep, connStatus, enqueueOfflineScan, addToQueue, isE2eMock, buildSessionContextPayload, isStandalone, applyProcessedScanResult, handleLookupNeedsPhoto, sessionDate]);

  // ══════════════════════════════════════════════════════════════════════════════════
  // APPROVAL
  // ══════════════════════════════════════════════════════════════════════════════════

  const submitApproval = useCallback(async () => {
    if (!reviewData) return;
    goStep(STEPS.APPROVING);
    let approvalAccepted = false;
    const approvalDate = reviewForm.date || sessionDate || new Date().toISOString().slice(0, 10);
    if (isE2eMock) {
      setTimeout(() => {
        const item = {
          awb: reviewData.awb || lockedAwb,
          clientCode: reviewForm.clientCode || 'MOCKCL',
          clientName: reviewData.clientName || reviewForm.clientCode || 'Mock Client',
          destination: reviewForm.destination || '',
          weight: parseFloat(reviewForm.weight) || 0,
          shipmentId: reviewData.shipmentId || null,
          date: approvalDate,
        };
        setLastSuccess(item);
        addToQueue(item);
        setFlash('success');
        approvalAccepted = true;
        goStep(STEPS.SUCCESS);
      }, 200);
      return;
    }
    const ocrFields = {
      clientCode: reviewData.clientCode || '',
      clientName: reviewData.clientName || '',
      consignee: reviewData.consignee || '',
      destination: reviewData.destination || '',
    };
    const approvedFields = {
      clientCode: reviewForm.clientCode || '',
      clientName: reviewForm.clientCode || '', // clientCode is our working field
      consignee: reviewForm.consignee || '',
      destination: reviewForm.destination || '',
    };

    const fields = {
      clientCode: reviewForm.clientCode,
      consignee: reviewForm.consignee,
      destination: reviewForm.destination,
      pincode: reviewForm.pincode,
      weight: parseFloat(reviewForm.weight) || 0,
      amount: parseFloat(reviewForm.amount) || 0,
      orderNo: reviewForm.orderNo || '',
      courier: reviewForm.courier || '',
      date: approvalDate,
    };

    if (isStandalone) {
      try {
        if (reviewData.ocrExtracted || reviewData) {
          await api.post('/shipments/learn-corrections', { ocrFields, approvedFields });
        }
        let savedShipment = null;
        if (reviewData.shipmentId) {
          const res = await api.put(`/shipments/${reviewData.shipmentId}`, fields);
          savedShipment = res?.data || null;
        } else {
          const res = await api.post('/shipments', { awb: reviewData.awb || lockedAwb, ...fields });
          savedShipment = res?.data || null;
        }

        playHardwareBeep();
        pulseHaptic('success');
        setFlash('success');
        const item = {
          awb: savedShipment?.awb || reviewData?.awb || lockedAwb,
          clientCode: savedShipment?.clientCode || reviewForm.clientCode,
          clientName: reviewData?.clientName || savedShipment?.client?.company || reviewForm.clientCode,
          destination: savedShipment?.destination || reviewForm.destination || '',
          weight: parseFloat(savedShipment?.weight ?? reviewForm.weight) || 0,
          shipmentId: savedShipment?.id || reviewData?.shipmentId || null,
          date: normalizeQueueDate(savedShipment?.date, approvalDate),
        };
        setLastSuccess(item);
        addToQueue(item);
        approvalAccepted = true;
        goStep(STEPS.SUCCESS);
      } catch (err) {
        goStep(STEPS.REVIEWING);
        playErrorBeep();
        pulseHaptic('error');
        setErrorMsg(err?.message || 'Approval failed.');
      }
    } else {
      if (!socket) {
        goStep(STEPS.REVIEWING);
        setErrorMsg('Not connected to desktop session.');
        return;
      }

      // Send corrections to learning system via socket
      if (reviewData.ocrExtracted || reviewData) {
        socket.emit('scanner:learn-corrections', {
          pin,
          ocrFields,
          approvedFields,
          courier: reviewData?.courier || reviewData?.ocrExtracted?.courier || '',
          deviceProfile,
        });
      }

      socket.emit('scanner:approval-submit', {
        shipmentId: reviewData.shipmentId,
        awb: reviewData.awb || lockedAwb,
        fields,
      }, (response) => {
        if (response?.success) {
          // Wait for approval-result from desktop
        } else {
          clearTimeout(approvalResultTimerRef.current);
          approvalResultTimerRef.current = null;
          goStep(STEPS.REVIEWING);
          playErrorBeep();
          pulseHaptic('error');
          setErrorMsg(response?.message || 'Approval failed.');
        }
      });

      clearTimeout(approvalResultTimerRef.current);
      approvalResultTimerRef.current = setTimeout(() => {
        if (currentStepRef.current !== STEPS.APPROVING) return;
        playErrorBeep();
        pulseHaptic('error');
        setErrorMsg('Save confirmation timed out. Please tap Approve & Save again.');
        goStep(STEPS.REVIEWING);
      }, APPROVAL_RESULT_TIMEOUT_MS);
    }

    const approvedClientCode = normalizeClientCode(reviewForm.clientCode || '');
    if (approvalAccepted && approvedClientCode) {
      setStickyClientCode(approvedClientCode === 'MISC' ? '' : approvedClientCode);
    }

    // Update session client frequency
    if (approvalAccepted && approvedClientCode && approvedClientCode !== 'MISC') {
      setSessionCtx(prev => {
        const freq = { ...prev.clientFreq };
        freq[approvedClientCode] = (freq[approvedClientCode] || 0) + 1;
        const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
        return {
          ...prev,
          clientFreq: freq,
          dominantClient: sorted[0]?.[1] >= 2 ? sorted[0][0] : null,
          dominantClientCount: sorted[0]?.[1] || 0,
        };
      });
    }
  }, [socket, reviewData, reviewForm, lockedAwb, pin, goStep, addToQueue, isE2eMock, deviceProfile, isStandalone, sessionDate]);

  // ══════════════════════════════════════════════════════════════════════════════════
  // RESET / NEXT SCAN
  // ══════════════════════════════════════════════════════════════════════════════════

  const resetForNextScan = useCallback((nextStep = STEPS.IDLE) => {
    clearTimeout(autoNextTimer.current);
    clearTimeout(lockToCaptureTimerRef.current);
    clearTimeout(approvalResultTimerRef.current);
    approvalResultTimerRef.current = null;
    setLockedAwb('');
    setCapturedImage(null);
    setCaptureMeta({ kb: 0, width: 0, height: 0, quality: CAPTURE_JPEG_QUALITY });
    setReviewData(null);
    setReviewForm({});
    setProcessingFields({});
    setLastSuccess(null);
    setLastLockTimeMs(null);
    setErrorMsg('');
    setDuplicateWarning('');
    setDocDetected(false);
    setDocStableTicks(0);
    setCaptureQuality({ ok: false, issues: [], metrics: null });
    scanBusyRef.current = false;
    barcodeStabilityRef.current = { awb: '', hits: 0, lastSeenAt: 0 };
    barcodeSamplesRef.current = [];
    lockTelemetryRef.current = { lockTimeMs: null, candidateCount: 1, ambiguous: false, alternatives: [] };
    captureReadyHapticRef.current = false;
    syncBarcodeReframeCount(0);
    // scannedAwbsRef is intentionally NOT cleared here — duplicates should be
    // tracked across the entire session, not just one scan cycle. Clear it only
    // if you add an explicit "new session" action.
    goStep(nextStep);
  }, [goStep, syncBarcodeReframeCount]);

  // Auto-return to the home screen after SUCCESS
  useEffect(() => {
    if (step === STEPS.SUCCESS) {
      const nextStep = scanWorkflowMode === 'fast' ? STEPS.SCANNING : STEPS.IDLE;
      const delayMs = scanWorkflowMode === 'fast' ? FAST_AUTO_NEXT_DELAY : AUTO_NEXT_DELAY;
      autoNextTimer.current = setTimeout(() => resetForNextScan(nextStep), delayMs);
      return () => clearTimeout(autoNextTimer.current);
    }
  }, [step, resetForNextScan, scanWorkflowMode]);

  // Voice feedback on review data & success
  useEffect(() => {
    if (!voiceEnabled) return;
    
    if (step === STEPS.REVIEWING && reviewData) {
      const parts = [reviewData.clientName || reviewData.clientCode, reviewData.destination, reviewData.weight ? `${reviewData.weight} kilograms` : ''].filter(Boolean);
      if (parts.length) speak(parts.join('. '));
    } else if (step === STEPS.SUCCESS && lastSuccess) {
      speak(`${lastSuccess.clientName || lastSuccess.clientCode || 'Shipment'} Verified.`);
    }
  }, [voiceEnabled, step, reviewData, lastSuccess]);

  // Cleanup
  useEffect(() => () => {
    stopCamera();
    clearTimeout(autoNextTimer.current);
    clearTimeout(lockToCaptureTimerRef.current);
    clearTimeout(approvalResultTimerRef.current);
  }, [stopCamera]);

  // ══════════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════════════

  const stepClass = (s) => `msp-step ${step === s ? 'active' : ''}`;
  const successAutoDelayMs = scanWorkflowMode === 'fast' ? FAST_AUTO_NEXT_DELAY : AUTO_NEXT_DELAY;
  const successAutoSeconds = Math.max(1, Math.round(successAutoDelayMs / 1000));
  const captureQualityHint = captureQuality.ok
    ? 'AWB quality looks good - press shutter'
    : (describeCaptureIssues(captureQuality.issues) || 'Fit AWB slip fully in frame and hold steady');
  const captureReadyForShutter = captureCameraReady && captureQuality.ok && docStableTicks >= DOC_STABLE_MIN_TICKS;

  // ——— Confidence data from reviewData ———
  const fieldConfidence = useMemo(() => {
    if (!reviewData) return {};
    const ocrData = reviewData.ocrExtracted || reviewData;
    return {
      clientCode: { confidence: ocrData?.clientNameConfidence || 0, source: ocrData?.clientNameSource || null },
      consignee: { confidence: ocrData?.consigneeConfidence || 0, source: ocrData?.consigneeSource || null },
      destination: { confidence: ocrData?.destinationConfidence || 0, source: ocrData?.destinationSource || null },
      pincode: { confidence: ocrData?.pincodeConfidence || 0, source: ocrData?.pincodeSource || null },
      weight: { confidence: ocrData?.weightConfidence || 0, source: ocrData?.weightSource || null },
    };
  }, [reviewData]);

  const copyAwb = useCallback(async (awb) => {
    if (!awb) return;
    try {
      await navigator.clipboard.writeText(awb);
      setAwbCopied(true);
      pulseHaptic('tap');
      setTimeout(() => setAwbCopied(false), 1800);
    } catch (_) {}
  }, []);

  const cycleReviewCourier = useCallback(() => {
    setReviewForm((prev) => {
      const current = normalizeReviewCourier(prev.courier || reviewData?.courier || '');
      const currentIndex = REVIEW_COURIERS.findIndex((name) => name.toUpperCase() === current.toUpperCase());
      const next = REVIEW_COURIERS[(currentIndex + 1 + REVIEW_COURIERS.length) % REVIEW_COURIERS.length];
      return { ...prev, courier: next };
    });
  }, [reviewData]);

  // Swipe gesture handlers for the review screen
  const handleSwipeTouchStart = useCallback((e) => {
    const t = e.touches[0];
    swipeStartXRef.current = t.clientX;
    swipeStartYRef.current = t.clientY;
    swipeDeltaXRef.current = 0;
    setSwipeProgress(0);
  }, []);

  const handleSwipeTouchMove = useCallback((e) => {
    if (swipeStartXRef.current === null) return;
    const t = e.touches[0];
    const dx = t.clientX - swipeStartXRef.current;
    const dy = t.clientY - swipeStartYRef.current;
    if (Math.abs(dy) > Math.abs(dx) * 1.4) return; // vertical scroll wins
    swipeDeltaXRef.current = dx;
    const progress = Math.max(-1, Math.min(1, dx / 140));
    cancelAnimationFrame(swipeAnimFrameRef.current);
    swipeAnimFrameRef.current = requestAnimationFrame(() => setSwipeProgress(progress));
  }, []);

  const handleSwipeTouchEnd = useCallback(() => {
    const dx = swipeDeltaXRef.current;
    swipeStartXRef.current = null;
    setSwipeProgress(0);
    if (dx > 110) {
      // Swipe right = approve
      pulseHaptic('success');
      submitApproval();
    } else if (dx < -110) {
      // Swipe left = skip
      pulseHaptic('warning');
      if (isStandalone) { navigate('/scan-mobile'); } else { resetForNextScan(); }
    }
  }, [submitApproval, resetForNextScan, isStandalone, navigate]);

  const reviewConfidence = useMemo(() => {
    const scores = Object.values(fieldConfidence)
      .map((entry) => Number(entry?.confidence || 0))
      .filter((value) => value > 0);
    const score = scores.length
      ? scores.reduce((sum, value) => sum + value, 0) / scores.length
      : 0;
    const level = confLevel(score);
    const label = level === 'high' ? 'High Confidence' : (level === 'med' ? 'Medium Confidence' : 'Low Confidence');
    return { score, level, label };
  }, [fieldConfidence]);

  const reviewCourier = normalizeReviewCourier(reviewForm.courier || reviewData?.courier || reviewData?.ocrExtracted?.courier || '');
  const reviewDateValue = reviewForm.date || reviewData?.date || sessionDate || '';
  const reviewDateLabel = useMemo(() => formatDisplayDate(reviewDateValue), [reviewDateValue]);

  const totalWeight = sessionCtx.scannedItems.reduce((sum, item) => sum + (item.weight || 0), 0);

  const intelligence = reviewData?.ocrExtracted?.intelligence || reviewData?.intelligence || null;
  const wasmError = barcodeEngineRef.current?.getDiagnostics?.()?.wasmFailReason;

  const diagnosticsRows = [
    ['Step', step],
    ['Connection', connStatus],
    ['Engine', scannerEngine],
    ...(wasmError ? [['WASM Error', wasmError]] : []),
    ['Workflow', scanWorkflowMode],
    ['Device', deviceProfile],
    ['Scan mode', scanMode],
    ['Fail count', String(barcodeFailCount)],
    ['Reframe retries', `${barcodeReframeCount}/${BARCODE_REFRAME_ATTEMPTS}`],
    ['Camera', captureCameraReady ? 'ready' : 'waiting'],
    ['Doc detect', docDetected ? `yes (${docStableTicks})` : 'no'],
    ['Capture quality', captureQuality.ok ? 'good' : (captureQuality.issues.join(', ') || 'pending')],
    ['Capture metrics', captureQuality.metrics ? `blur ${captureQuality.metrics.blurScore} | glare ${captureQuality.metrics.glareRatio}% | skew ${captureQuality.metrics.perspectiveSkew}%` : '-'],
    ['JPEG last shot', captureMeta.kb ? `${captureMeta.kb}KB ${captureMeta.width}x${captureMeta.height} q=${captureMeta.quality}` : '-'],
    ['Secure ctx', isProbablySecureContextForCamera() ? 'yes' : 'no'],
    ['AWB lock', lockedAwb || '-'],
    ['Lock ms', lastLockTimeMs != null ? String(lastLockTimeMs) : '-'],
    ['Lock candidates', String(lockTelemetryRef.current?.candidateCount || 1)],
    ['Queued', String(offlineQueue.length)],
    ['Scans', String(sessionCtx.scanNumber)],
    ['Last format', lastDetectionMeta?.format || '-'],
    ['Last code', lastDetectionMeta?.value || '-'],
    ['Decode ms', lastDetectionMeta?.sinceStartMs != null ? String(lastDetectionMeta.sinceStartMs) : '-'],
    ['False-lock', reviewData?.scanTelemetry?.falseLock ? 'yes' : 'no'],
  ];

  return (
    <>
      
      <div className="msp-root">
        {/* ——— Flash overlay ——— */}
        {flash && <div className={`flash-overlay flash-${flash}`} onAnimationEnd={() => setFlash(null)} />}

        {/* ——— Duplicate warning overlay ——— */}
        {duplicateWarning && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(220,38,38,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }} className="shake">
            <AlertCircle size={48} color="white" />
            <div style={{ color: 'white', fontSize: '1.1rem', fontWeight: 700, textAlign: 'center' }}>DUPLICATE AWB</div>
            <div className="mono" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.3rem', fontWeight: 700 }}>{duplicateWarning}</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>Already scanned in this session</div>
          </div>
        )}

        <button
          type="button"
          data-testid="scanner-diag-toggle"
          onClick={() => setDiagnosticsOpen((v) => !v)}
          style={{
            position: 'fixed',
            top: 12,
            right: 12,
            zIndex: 70,
            border: '1px solid rgba(255,255,255,0.18)',
            background: diagnosticsOpen ? 'rgba(79,70,229,0.92)' : 'rgba(15,23,42,0.72)',
            color: '#fff',
            borderRadius: 999,
            padding: '8px 12px',
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            backdropFilter: 'blur(10px)',
            cursor: 'pointer',
          }}
        >
          {diagnosticsOpen ? 'Hide Diag' : 'Show Diag'}
        </button>

        {diagnosticsOpen && (
          <div
            data-testid="scanner-diag-panel"
            style={{
              position: 'fixed',
              top: 56,
              right: 12,
              zIndex: 69,
              width: 'min(92vw, 320px)',
              background: 'rgba(15,23,42,0.88)',
              color: '#E5EEF8',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 18,
              padding: 14,
              backdropFilter: 'blur(14px)',
              boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, color: '#A5B4FC' }}>
              Scanner Diagnostics
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              {diagnosticsRows.map(([label, value]) => (
                <div key={label} style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '0.76rem' }}>
                  <div style={{ color: 'rgba(226,232,240,0.72)', minWidth: 88 }}>{label}</div>
                  <div className="mono" style={{ textAlign: 'right', wordBreak: 'break-word', maxWidth: 180 }}>{value}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: '0.68rem', color: 'rgba(226,232,240,0.7)', lineHeight: 1.4 }}>
              Use this to verify whether Trackon labels are being decoded as `ITF` and how quickly the first lock happens after scan start.
            </div>
          </div>
        )}

        {/* ═══ IDLE / CONNECTING ═══ */}
        {connStatus !== 'paired' && (
          <div className={stepClass(STEPS.IDLE)}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 24 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: theme.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {connStatus === 'connecting' ? <RefreshCw size={28} color={theme.primary} style={{ animation: 'spin 1s linear infinite' }} /> : <WifiOff size={28} color={theme.error} />}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>
                  {connStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                </div>
                <div style={{ fontSize: '0.82rem', color: theme.muted }}>
                  {errorMsg || (isStandalone ? 'Preparing direct scanner session' : `Connecting to session ${pin}`)}
                </div>
              </div>
              {connStatus === 'disconnected' && (
                <button className="btn btn-primary" onClick={() => window.location.reload()}>
                  <RefreshCw size={16} /> Reconnect
                </button>
              )}
            </div>
          </div>
        )}

        {/* ═══ PERSISTENT CAMERA VIDEO ═══ */}
        {/* Lives outside all step divs so it NEVER gets unmounted/re-mounted.
            Both SCANNING and CAPTURING phases share this same element via videoRef.
            This is what eliminates the black-screen flicker between steps.
            Hidden when Scanbot is active because Scanbot renders into its own
            container and owns its own camera stream — showing this element at
            the same time would cause a double-consumer conflict. */}
        <video
          ref={videoRef}
          autoPlay playsInline muted
          onClick={() => {
            ensureVideoStreamPlaying().catch((err) => {
              setErrorMsg(err?.message || 'Camera access failed.');
            });
          }}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover', zIndex: 0,
            display: (step === STEPS.SCANNING || step === STEPS.CAPTURING) && !scanbotRef.current
              ? 'block' : 'none',
          }}
        />

        {/* ═══ IDLE / HOME ═══ */}
        <div className={stepClass(STEPS.IDLE)}>
          <div className="home-root">
            {/* ── Hero ── */}
            <div className="home-hero">
              <div className="home-hero-top">
                <div className="home-brand">
                  <div className="home-brand-logo">
                    <img src="/images/logo.png" alt="Sea Hawk" style={{ width: 26, height: 26, objectFit: 'contain' }} />
                  </div>
                  <div>
                    <div className="home-brand-name">Sea Hawk Scanner</div>
                    <div className="home-brand-tagline">Courier Management</div>
                  </div>
                </div>
                <div className={`home-conn-pill ${connStatus === 'paired' ? 'connected' : ''}`}>
                  {connStatus === 'paired' ? <Wifi size={11} /> : <WifiOff size={11} />}
                  {connStatus === 'paired' ? 'Live' : connStatus === 'connecting' ? 'Connecting...' : 'Offline'}
                </div>
              </div>

              {/* Stats */}
              <div className="home-stats-band">
                <div className="home-stat-tile">
                  <div className="home-stat-num">{sessionCtx.scanNumber}</div>
                  <div className="home-stat-lbl">Scanned</div>
                </div>
                <div className="home-stat-tile">
                  <div className="home-stat-num">{totalWeight > 0 ? totalWeight.toFixed(1) : '0'}</div>
                  <div className="home-stat-lbl">Total kg</div>
                </div>
                <div className="home-stat-tile">
                  <div className="home-stat-num">{sessionDuration}</div>
                  <div className="home-stat-lbl">Session</div>
                </div>
              </div>

              {/* Date tile */}
              <div className="home-date-tile">
                <CalendarDays size={18} color="#60A5FA" />
                <div style={{ flex: 1 }}>
                  <div className="home-date-lbl">Scan Date</div>
                  <div className="home-date-val">
                    {new Date(sessionDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {sessionDate === new Date().toISOString().slice(0, 10) && (
                      <span className="home-date-today-badge">TODAY</span>
                    )}
                  </div>
                </div>
                <div className="home-date-change">Change ▸</div>
                <input type="date" value={sessionDate} max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && ISO_DATE_REGEX.test(val)) {
                      setSessionDate(val);
                      try { localStorage.setItem('seahawk_scanner_session_date', val); } catch (err) { logNonCriticalScannerError('persist session date', err); }
                      pulseHaptic('tap');
                    }
                  }}
                />
              </div>
            </div>

            {/* ── Scan zone ── */}
            <div className="home-scan-zone">
              <div className="home-scan-btn-wrap">
                <div className="home-scan-ring" />
                <div className="home-scan-ring home-scan-ring2" />
                <button data-testid="start-scan-btn" className="home-scan-btn" onClick={handleStartScanning}>
                  <Camera size={36} color="white" />
                  <span className="home-scan-btn-lbl">Scan</span>
                </button>
              </div>
              <div className="home-cta">{sessionCtx.scanNumber === 0 ? 'Tap to scan your first parcel' : 'Ready — tap to scan next parcel'}</div>

              {/* Mode toggles */}
              <div className="mode-toggle-row">
                <button type="button" data-testid="workflow-fast-btn"
                  className={`mode-pill ${scanWorkflowMode === 'fast' ? 'active' : ''}`}
                  onClick={() => setScanWorkflowMode('fast')}>
                  <Zap size={13} /> Fast scan
                </button>
                <button type="button" data-testid="workflow-ocr-btn"
                  className={`mode-pill ${scanWorkflowMode === 'ocr' ? 'active' : ''}`}
                  onClick={() => setScanWorkflowMode('ocr')}>
                  <Brain size={13} /> OCR label
                </button>
              </div>
              <div className="mode-toggle-row" style={{ marginTop: 7 }}>
                <button type="button" data-testid="device-profile-phone-btn"
                  className={`mode-pill ${deviceProfile === DEVICE_PROFILES.phone ? 'active' : ''}`}
                  onClick={() => setDeviceProfile(DEVICE_PROFILES.phone)}>
                  <Camera size={13} /> Phone lens
                </button>
                <button type="button" data-testid="device-profile-rugged-btn"
                  className={`mode-pill ${deviceProfile === DEVICE_PROFILES.rugged ? 'active' : ''}`}
                  onClick={() => setDeviceProfile(DEVICE_PROFILES.rugged)}>
                  <Shield size={13} /> Rugged
                </button>
              </div>

              {/* Manual AWB */}
              <div style={{ width: '100%', maxWidth: 320, marginTop: 14 }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, color: theme.mutedLight, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 7, textAlign: 'center' }}>
                  Can't scan? Enter AWB manually
                </div>
                <div className="manual-awb-row">
                  <input data-testid="manual-awb-input" className="manual-awb-input"
                    value={manualAwb}
                    onChange={e => setManualAwb(e.target.value.toUpperCase())}
                    placeholder="e.g. Z67086879"
                    inputMode="text" autoCapitalize="characters"
                    onFocus={e => e.target.style.borderColor = theme.primary}
                    onBlur={e => e.target.style.borderColor = theme.border}
                  />
                  <button type="button" data-testid="manual-awb-submit"
                    disabled={manualAwb.trim().length < 6}
                    className="btn btn-primary"
                    style={{ padding: '10px 16px', fontSize: '0.8rem', borderRadius: 12, opacity: manualAwb.trim().length >= 6 ? 1 : 0.42 }}
                    onClick={handleManualAwbSubmit}>
                    Go →
                  </button>
                </div>
              </div>

              {/* Action strip */}
              <div className="action-strip">
                <button className={`action-tile ${offlineQueue.length > 0 ? 'upload-active' : ''}`} onClick={saveAndUpload}>
                  <CloudUpload size={14} /> {offlineQueue.length > 0 ? `Upload (${offlineQueue.length})` : 'Synced'}
                </button>
                <button className="action-tile" onClick={() => setVoiceEnabled(v => !v)}>
                  {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />} Voice {voiceEnabled ? 'On' : 'Off'}
                </button>
                <button className="action-tile danger" onClick={() => setSessionSummaryOpen(true)}>
                  <Trash2 size={14} /> End
                </button>
              </div>

              {offlineQueue.length > 0 && (
                <div style={{ marginTop: 10, fontSize: '0.7rem', color: theme.warning, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Clock size={12} /> {offlineQueue.length} pending sync
                </div>
              )}
            </div>

            {/* ── Manifest / Queue ── */}
            <div className="home-manifest">
              <div className="manifest-head">
                <div className="manifest-title">
                  <List size={11} /> Accepted Consignments
                </div>
                {sessionCtx.scannedItems.length > 0 && (
                  <div className="manifest-count">{sessionCtx.scannedItems.length}</div>
                )}
              </div>

              {/* Courier breakdown chips */}
              {sessionCtx.scannedItems.length > 0 && (() => {
                const courierCounts = {};
                sessionCtx.scannedItems.forEach(item => {
                  const c = normalizeReviewCourier(item.courier || '');
                  if (c) courierCounts[c] = (courierCounts[c] || 0) + 1;
                });
                return Object.keys(courierCounts).length > 0 ? (
                  <div className="manifest-courier-bar">
                    {Object.entries(courierCounts).map(([c, n]) => {
                      const pal = getCourierPalette(c);
                      return (
                        <span key={c} className="courier-chip" style={{ background: pal.light, color: pal.bg, border: `1px solid ${pal.bg}22` }}>
                          {c} {n}
                        </span>
                      );
                    })}
                  </div>
                ) : null;
              })()}

              <div className="manifest-list">
                {sessionCtx.scannedItems.length === 0 ? (
                  <div className="manifest-empty">
                    <div className="manifest-empty-icon">
                      <Package size={28} color={theme.mutedLight} />
                    </div>
                    <div className="manifest-empty-text">
                      No consignments yet.<br />Tap the scan button above to begin.
                    </div>
                  </div>
                ) : (
                  sessionCtx.scannedItems.map((item, idx) => {
                    const pal = getCourierPalette(normalizeReviewCourier(item.courier || ''));
                    return (
                      <div key={item.queueId || `${item.awb}-${idx}`} className="manifest-item">
                        <div className="manifest-item-icon" style={{ background: pal.light, color: pal.bg }}>
                          {normalizeReviewCourier(item.courier || '') || 'PKG'}
                        </div>
                        <div className="manifest-main">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="manifest-awb">{item.awb}</div>
                            {item.weight > 0 && <div className="manifest-weight">{item.weight}kg</div>}
                          </div>
                          <div className="manifest-meta">
                            {item.clientCode === 'OFFLINE'
                              ? <span className="manifest-tag" style={{ background: theme.warningLight, color: theme.warning }}>Offline</span>
                              : item.clientCode && <span className="manifest-tag" style={{ background: theme.primaryLight, color: theme.primary }}>{item.clientCode}</span>}
                            {item.consignee && <span>{item.consignee}</span>}
                            {item.destination && <span>→ {item.destination}</span>}
                            {item.date && <span className="manifest-tag" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>{formatDisplayDate(item.date)}</span>}
                          </div>
                          {editingQueueItemId === item.queueId ? (
                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center', marginTop: 6 }}>
                              <input type="date" className="queue-date-input" value={editingQueueDate}
                                max={new Date().toISOString().slice(0, 10)}
                                onChange={(e) => setEditingQueueDate(e.target.value)}
                                disabled={queueActionBusyId === item.queueId} />
                              <button type="button" className="manifest-action-btn primary"
                                onClick={() => saveQueueDateEdit(item)}
                                disabled={queueActionBusyId === item.queueId || !ISO_DATE_REGEX.test(editingQueueDate)}>
                                {queueActionBusyId === item.queueId ? 'Saving...' : 'Save'}
                              </button>
                              <button type="button" className="manifest-action-btn"
                                onClick={cancelQueueDateEdit}
                                disabled={queueActionBusyId === item.queueId}>Cancel</button>
                            </div>
                          ) : (
                            <div className="manifest-actions">
                              <button type="button" className="manifest-action-btn"
                                onClick={() => beginQueueDateEdit(item)}
                                disabled={queueActionBusyId === item.queueId}>
                                <CalendarDays size={11} /> Date
                              </button>
                              <button type="button" className="manifest-action-btn danger"
                                onClick={() => deleteQueueItem(item)}
                                disabled={queueActionBusyId === item.queueId}>
                                <Trash2 size={11} /> {queueActionBusyId === item.queueId ? 'Removing...' : 'Remove'}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={stepClass(STEPS.SCANNING)}>
          <div className="cam-viewport" style={{ background: 'transparent' }}>
            <div id="scanbot-camera-container" style={{ position: 'absolute', inset: 0, display: scanbotRef.current ? 'block' : 'none' }} />
            <div className="cam-overlay">
              {/* Guide: narrow landscape strip in barcode mode, tall portrait in document mode */}
                <div
                  className="scan-guide"
                  style={
                    scanMode === 'barcode'
                      ? {
                        width: BARCODE_SCAN_REGION.w,
                        height: BARCODE_SCAN_REGION.h,
                        borderRadius: 10,
                        maxHeight: '20vw',
                        transition: 'all 0.4s ease',
                        borderColor: errorMsg ? 'rgba(248,113,113,0.92)' : undefined,
                        boxShadow: errorMsg ? '0 0 0 3px rgba(248,113,113,0.2)' : undefined,
                      }
                      : { width: DOC_CAPTURE_REGION.w, height: DOC_CAPTURE_REGION.h, borderRadius: 14, maxHeight: '75vh', transition: 'all 0.4s ease', borderColor: 'rgba(251,191,36,0.85)', boxShadow: '0 0 0 3px rgba(251,191,36,0.2)' }
                  }
                >
                <div className="scan-guide-corner corner-tl" />
                <div className="scan-guide-corner corner-tr" />
                <div className="scan-guide-corner corner-bl" />
                <div className="scan-guide-corner corner-br" />
                {/* Laser only in barcode mode */}
                {scanMode === 'barcode' && (
                  <div className="scan-laser">
                    <div className="scan-laser-spark" />
                  </div>
                )}
              </div>
            </div>
            <div className="cam-hud">
              <div className="cam-hud-chip">
                <Wifi size={12} /> {isStandalone ? 'DIRECT' : pin}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Amber pill when auto-switched to document mode */}
                {scanMode === 'document' && (
                  <div className="cam-hud-chip" style={{ background: 'rgba(251,191,36,0.22)', color: '#FDE68A', fontWeight: 700, fontSize: '0.65rem', gap: 4 }}>
                    <ScanLine size={11} /> LABEL MODE
                  </div>
                )}
                <div className="cam-hud-chip" style={{ gap: 4 }}>
                  <Package size={12} /> {sessionCtx.scanNumber}
                  {scannerEngine === 'native'
                    ? <span style={{ color: '#34D399', fontSize: '0.6rem', fontWeight: 800 }}>⚡ NATIVE</span>
                    : <span style={{ color: '#F59E0B', fontSize: '0.6rem', fontWeight: 800 }}>ZXING</span>
                  }
                </div>
              </div>
            </div>
            <div className="cam-bottom">
              {scanMode === 'barcode' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, color: 'rgba(255,255,255,0.85)', fontSize: '0.82rem', fontWeight: 600, textAlign: 'center' }}>
                  <div>
                    {scanWorkflowMode === 'fast'
                      ? 'Align barcode inside the strip - auto-save on lock'
                      : 'Align barcode inside the strip - camera opens for label capture after lock'}
                  </div>
                  {barcodeReframeCount > 0 && (
                    <div style={{ color: '#FDE68A', fontSize: '0.74rem', fontWeight: 700 }}>
                      Reframe retry {barcodeReframeCount}/{BARCODE_REFRAME_ATTEMPTS}
                    </div>
                  )}
                  {!!errorMsg && (
                    <div style={{ color: '#FCA5A5', fontSize: '0.72rem', fontWeight: 700 }}>
                      {errorMsg}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ color: 'rgba(251,191,36,0.95)', fontSize: '0.82rem', fontWeight: 700, textAlign: 'center' }}>
                    No barcode found - capture the label and we will read the printed AWB
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                      className="cam-hud-chip"
                      style={{ border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}
                      onClick={handleCaptureWithoutBarcode}
                    >
                      Capture label instead
                    </button>
                    <button
                      className="cam-hud-chip"
                      style={{ border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}
                      onClick={() => {
                        syncBarcodeFailCount(0);
                        syncBarcodeReframeCount(0);
                        setErrorMsg('');
                        setScanMode('barcode');
                        pulseHaptic('tap');
                      }}
                    >
                      Back to barcode mode
                    </button>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  className="cam-hud-chip"
                  onClick={() => setScanWorkflowMode((prev) => (prev === 'fast' ? 'ocr' : 'fast'))}
                  style={{ border: 'none', cursor: 'pointer', gap: 5 }}
                >
                  {scanWorkflowMode === 'fast' ? <Zap size={13} /> : <Brain size={13} />}
                  {scanWorkflowMode === 'fast' ? 'FAST' : 'OCR'}
                </button>
                <button className="cam-hud-chip" onClick={() => setVoiceEnabled(!voiceEnabled)} style={{ border: 'none', cursor: 'pointer' }}>
                  {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ═══ CAPTURING (Document mode) ═══ */}
        <div className={stepClass(STEPS.CAPTURING)}>
          <div className="cam-viewport" style={{ background: 'transparent' }}>
            {!captureCameraReady && (
              <div style={{ position: 'absolute', inset: 0, zIndex: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, background: 'rgba(15,23,42,0.82)', backdropFilter: 'blur(4px)', color: 'white' }}>
                <CheckCircle2 size={44} color="#34D399" />
                <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: '#34D399' }}>{lockedAwb || 'OCR fallback'}</div>
                <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.8rem' }}>{lockedAwb ? 'Barcode locked - Preparing camera...' : 'Preparing label capture for printed AWB OCR...'}</div>
              </div>
            )}
            <div className="cam-overlay">
              {/* Rectangular guide sized to match an actual AWB slip */}
              <div
                ref={guideRef}
                className={`scan-guide ${docDetected ? 'detected' : ''}`}
                style={{
                  width: DOC_CAPTURE_REGION.w,
                  height: DOC_CAPTURE_REGION.h,
                  maxHeight: '75vh',
                  borderRadius: 12,
                }}
              >
                <div className="scan-guide-corner corner-tl" />
                <div className="scan-guide-corner corner-tr" />
                <div className="scan-guide-corner corner-bl" />
                <div className="scan-guide-corner corner-br" />
              </div>
            </div>
            <div className="cam-hud">
              <div className="cam-hud-chip mono" style={{ fontSize: '0.68rem' }}>
                <ScanLine size={12} /> {lockedAwb || 'OCR AWB capture'}
              </div>
              {offlineQueue.length > 0 && (
                <div className="cam-hud-chip">
                  <Clock size={12} /> {offlineQueue.length} queued
                </div>
              )}
            </div>
            <div className="cam-bottom">
              <div style={{ color: docDetected ? 'rgba(16,185,129,0.95)' : 'rgba(255,255,255,0.85)', fontSize: '0.82rem', fontWeight: 600, textAlign: 'center', transition: 'color 0.3s' }}>
                {captureQualityHint}
              </div>
              {captureQuality.metrics && (
                <div style={{ color: 'rgba(255,255,255,0.66)', fontSize: '0.72rem', textAlign: 'center' }}>
                  Blur {captureQuality.metrics.blurScore} | Glare {captureQuality.metrics.glareRatio}% | Skew {captureQuality.metrics.perspectiveSkew}%
                </div>
              )}
              <button
                className="capture-btn"
                data-testid="capture-photo-btn"
                onClick={handleCapturePhoto}
                disabled={!captureReadyForShutter}
                style={{ opacity: captureReadyForShutter ? 1 : 0.4 }}
              >
                <div className="capture-btn-inner" />
              </button>
              {isE2eMock && (
                <button
                  type="button"
                  data-testid="mock-capture-btn"
                  onClick={handleMockCapturePhoto}
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', fontSize: '0.72rem', padding: '6px 12px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
                >
                  Mock capture
                </button>
              )}
              <button
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', fontSize: '0.72rem', padding: '6px 16px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
                onClick={() => {
                  setLockedAwb('');
                  setErrorMsg('');
                  syncBarcodeFailCount(0);
                  syncBarcodeReframeCount(0);
                  scanBusyRef.current = false;
                  pulseHaptic('tap');
                  goStep(STEPS.SCANNING);
                }}
              >
                ← Rescan barcode
              </button>
            </div>
          </div>
        </div>

        {/* ═══ PREVIEW ═══ */}
        <div className={stepClass(STEPS.PREVIEW)}>
          <div style={{ background: theme.bg, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '52px 20px 16px', background: 'linear-gradient(135deg, #0D1B2A, #1E2D3D)', color: 'white' }}>
              <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.45)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>CAPTURED</div>
              <div className="mono" style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>{lockedAwb || 'OCR Capture'}</div>
              {captureMeta.kb > 0 && (
                <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>
                  {captureMeta.kb}KB · {captureMeta.width}×{captureMeta.height}
                </div>
              )}
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              {capturedImage && <img src={capturedImage} alt="Captured label" className="preview-img" />}
            </div>
            <div style={{ padding: '12px 16px 28px', display: 'flex', gap: 10, background: theme.surface, borderTop: `1px solid ${theme.border}` }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setCapturedImage(null); goStep(STEPS.CAPTURING); }}>
                <RotateCcw size={15} /> Retake
              </button>
              <button data-testid="use-photo-btn" className="btn btn-primary" style={{ flex: 2 }} onClick={submitForProcessing}>
                <Send size={15} /> Read This Label
              </button>
            </div>
          </div>
        </div>

        {/* ═══ PROCESSING ═══ */}
        <div className={stepClass(STEPS.PROCESSING)}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: theme.bg }}>
            {/* Top status */}
            <div style={{ padding: '52px 24px 20px', textAlign: 'center', background: 'linear-gradient(135deg, #0D1B2A, #1E2D3D)', color: 'white' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', marginBottom: 14 }}>
                <Brain size={16} color="#93C5FD" style={{ animation: 'spin 2s linear infinite' }} />
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#93C5FD', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {capturedImage ? 'Reading Label' : 'Saving Scan'}
                </span>
              </div>
              <div className="mono" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: 6 }}>{lockedAwb || '—'}</div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>
                {capturedImage ? 'OCR engine extracting fields...' : 'Syncing with server...'}
              </div>
            </div>
            {/* Skeleton fields */}
            <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {[['Client', '55%'], ['Consignee', '80%'], ['Destination', '65%'], ['Pincode', '40%'], ['Weight (kg)', '35%'], ['Order No', '50%']].map(([label, w]) => (
                <div key={label} className="field-card" style={{ opacity: 0.8 }}>
                  <div className="conf-dot conf-none" style={{ background: '#DDE3EC' }} />
                  <div style={{ flex: 1 }}>
                    <div className="field-label">{label}</div>
                    <div className="skeleton" style={{ height: 16, width: w, marginTop: 5 }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '12px 20px 28px', textAlign: 'center' }}>
              <button className="btn btn-outline" style={{ fontSize: '0.75rem', padding: '9px 24px' }}
                onClick={() => { setErrorMsg('Cancelled by user.'); goStep(STEPS.ERROR); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* ═══ REVIEWING ═══ */}
        <div className={stepClass(STEPS.REVIEWING)}>
          <div className="review-swipe-root"
            onTouchStart={handleSwipeTouchStart}
            onTouchMove={handleSwipeTouchMove}
            onTouchEnd={handleSwipeTouchEnd}
          >
            {/* Swipe overlays */}
            <div className="swipe-action-overlay approve" style={{ opacity: Math.max(0, swipeProgress) * 1.1 }}>
              <div className="swipe-action-label">
                <Check size={44} color="white" strokeWidth={3} />
                APPROVE
              </div>
            </div>
            <div className="swipe-action-overlay skip" style={{ opacity: Math.max(0, -swipeProgress) * 1.1 }}>
              <div className="swipe-action-label">
                <X size={44} color="white" strokeWidth={3} />
                SKIP
              </div>
            </div>

            {/* Courier-colored header */}
            <div className={`review-header${reviewCourier ? ' courier-' + reviewCourier.toLowerCase() : ''}`}
              style={{ transform: `translateX(${swipeProgress * 18}px)`, transition: swipeProgress === 0 ? 'transform 0.25s ease' : 'none' }}>
              <div className="review-header-top">
                <div>
                  <div className="review-title">REVIEW CONSIGNMENT</div>
                  <div className="mono review-awb awb-copyable" onClick={() => copyAwb(reviewData?.awb || lockedAwb)}>
                    {reviewData?.awb || lockedAwb}
                    {awbCopied && <span className="copy-flash">COPIED</span>}
                  </div>
                  {inferredCourier && !reviewCourier && (
                    <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                      AWB suggests: {inferredCourier}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {intelligence?.learnedFieldCount > 0 && (
                    <div className="source-badge source-learned">AI {intelligence.learnedFieldCount} corrected</div>
                  )}
                  {reviewConfidence.score === 0 && (
                    <div style={{ fontSize: '0.6rem', background: 'rgba(220,38,38,0.22)', color: '#FCA5A5', padding: '3px 9px', borderRadius: 7, fontWeight: 800, border: '1px solid rgba(220,38,38,0.3)' }}>
                      OCR failed — fill manually
                    </div>
                  )}
                </div>
              </div>
              <div className="review-meta-row">
                <span className={`review-confidence ${reviewConfidence.level}`}>
                  <Shield size={12} />
                  {reviewConfidence.label} ({Math.round(reviewConfidence.score * 100)}%)
                </span>
                <button type="button" className="review-chip review-chip-courier" onClick={cycleReviewCourier} title="Tap to change courier">
                  <Package size={12} /> {reviewCourier || 'Set courier →'}
                </button>
                <span className="review-chip review-chip-date">
                  <CalendarDays size={12} /> {reviewDateLabel || 'No date'}
                </span>
              </div>
            </div>

            {/* Swipe hint bar */}
            <div className="swipe-hint-bar">
              <div className="swipe-hint-side" style={{ color: swipeProgress < -0.2 ? theme.error : theme.mutedLight }}>
                <X size={11} /> SKIP
              </div>
              <div style={{ fontSize: '0.6rem', color: theme.mutedLight, fontWeight: 600, letterSpacing: '0.05em' }}>
                SWIPE TO APPROVE OR SKIP
              </div>
              <div className="swipe-hint-side" style={{ color: swipeProgress > 0.2 ? theme.success : theme.mutedLight }}>
                SAVE <Check size={11} />
              </div>
            </div>

            {/* Form completion progress */}
            {(() => {
              const required = ['consignee', 'destination', 'weight'];
              const filled = required.filter(k => {
                const v = reviewForm[k];
                return v !== undefined && v !== null && String(v).trim() !== '' && String(v).trim() !== '0';
              }).length;
              const pct = Math.round((filled / required.length) * 100);
              return (
                <div className="form-progress-bar-wrap">
                  <div className="form-progress-bar-track">
                    <div className="form-progress-bar-fill" style={{ width: pct + '%' }} />
                  </div>
                  <div className="form-progress-label" style={{ color: pct === 100 ? theme.success : theme.muted }}>
                    {pct === 100 ? '✓ Ready to save' : `${filled}/${required.length} required`}
                  </div>
                </div>
              );
            })()}

            <div className="scroll-panel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* CLIENT */}
              <div className={`field-card field-card-animated ${(fieldConfidence.clientCode?.confidence || 0) < 0.55 ? 'warning' : 'conf-high'}`}>
                <div className={confDotClass(fieldConfidence.clientCode?.confidence || 0)} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                    <span className="field-label" style={{ margin: 0 }}>Client</span>
                    {fieldConfidence.clientCode?.source && (() => { const s = sourceLabel(fieldConfidence.clientCode.source); return s ? <span className={s.className}>{s.icon} {s.text}</span> : null; })()}
                  </div>
                  <input className="field-input" value={reviewForm.clientCode || ''}
                    onChange={e => setReviewForm(f => ({ ...f, clientCode: e.target.value.toUpperCase() }))}
                    placeholder="Client code"
                    autoCapitalize="characters" />
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 7, gap: 8 }}>
                    <div style={{ fontSize: '0.6rem', color: theme.muted }}>
                      {stickyClientCode
                        ? <span style={{ color: theme.primary, fontWeight: 700 }}>📌 Sticky: {stickyClientCode}</span>
                        : 'Sticky off'}
                    </div>
                    {stickyClientCode
                      ? <button type="button" className="suggest-chip" onClick={() => setStickyClientCode('')}>Clear</button>
                      : <button type="button" className="suggest-chip" onClick={() => { const c = normalizeClientCode(reviewForm.clientCode || ''); if (c && c !== 'MISC') setStickyClientCode(c); }}>Keep this client</button>
                    }
                  </div>
                  {intelligence?.clientMatches?.length > 0 && intelligence.clientNeedsConfirmation && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 7 }}>
                      {intelligence.clientMatches.slice(0, 3).map(m => (
                        <button key={m.code} type="button"
                          className={`suggest-chip ${reviewForm.clientCode === m.code ? 'active' : ''}`}
                          onClick={() => setReviewForm(f => ({ ...f, clientCode: m.code }))}>
                          {m.code} ({Math.round(m.score * 100)}%)
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* CONSIGNEE — required */}
              <div className={`field-card field-card-animated ${!reviewForm.consignee?.trim() ? 'required-empty' : 'conf-high'}`}>
                <div className={!reviewForm.consignee?.trim() ? 'conf-dot conf-low' : confDotClass(fieldConfidence.consignee?.confidence || 0)} />
                <div style={{ flex: 1 }}>
                  <div className="field-label">
                    Consignee <span className="field-required-star">*</span>
                    {fieldConfidence.consignee?.source && (() => { const s = sourceLabel(fieldConfidence.consignee.source); return s ? <span className={s.className} style={{ marginLeft: 4 }}>{s.icon} {s.text}</span> : null; })()}
                  </div>
                  <input className="field-input" value={reviewForm.consignee || ''}
                    onChange={e => setReviewForm(f => ({ ...f, consignee: e.target.value.toUpperCase() }))}
                    placeholder="Recipient name *"
                    autoCapitalize="words" />
                </div>
              </div>

              {/* DESTINATION — required */}
              <div className={`field-card field-card-animated ${!reviewForm.destination?.trim() ? 'required-empty' : 'conf-high'}`}>
                <div className={!reviewForm.destination?.trim() ? 'conf-dot conf-low' : confDotClass(fieldConfidence.destination?.confidence || 0)} />
                <div style={{ flex: 1 }}>
                  <div className="field-label">
                    Destination <span className="field-required-star">*</span>
                    {fieldConfidence.destination?.source && (() => { const s = sourceLabel(fieldConfidence.destination.source); return s ? <span className={s.className} style={{ marginLeft: 4 }}>{s.icon} {s.text}</span> : null; })()}
                  </div>
                  <input className="field-input" value={reviewForm.destination || ''}
                    onChange={e => setReviewForm(f => ({ ...f, destination: e.target.value.toUpperCase() }))}
                    placeholder="City *"
                    autoCapitalize="words" />
                  {intelligence?.pincodeCity && intelligence.pincodeCity !== reviewForm.destination && (
                    <button type="button" className="suggest-chip pincode-suggest" style={{ marginTop: 6 }}
                      onClick={() => setReviewForm(f => ({ ...f, destination: intelligence.pincodeCity }))}>
                      📍 Pincode → {intelligence.pincodeCity}
                    </button>
                  )}
                  {!intelligence?.pincodeCity && reviewForm.pincode?.length === 6 && (() => {
                    const city = lookupPincodeCity(reviewForm.pincode);
                    return city && city !== reviewForm.destination ? (
                      <button type="button" className="suggest-chip pincode-suggest" style={{ marginTop: 6 }}
                        onClick={() => setReviewForm(f => ({ ...f, destination: city }))}>
                        📍 {reviewForm.pincode} → {city}
                      </button>
                    ) : null;
                  })()}
                </div>
              </div>

              {/* PINCODE + WEIGHT */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="field-card field-card-animated">
                  <div style={{ flex: 1 }}>
                    <div className="field-label">Pincode</div>
                    <input className="field-input" value={reviewForm.pincode || ''}
                      onChange={(e) => {
                        const pin = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                        setReviewForm(f => {
                          const city = pin.length === 6 && !f.destination?.trim() ? lookupPincodeCity(pin) : '';
                          return { ...f, pincode: pin, ...(city ? { destination: city } : {}) };
                        });
                      }}
                      placeholder="6 digits" maxLength={6} inputMode="numeric" />
                  </div>
                </div>
                <div className={`field-card field-card-animated ${intelligence?.weightAnomaly?.anomaly ? 'warning' : (!reviewForm.weight || String(reviewForm.weight).trim() === '0' ? 'required-empty' : 'conf-med')}`}>
                  <div style={{ flex: 1 }}>
                    <div className="field-label">Weight (kg) <span className="field-required-star">*</span></div>
                    <input className="field-input" value={reviewForm.weight || ''}
                      onChange={(e) => setReviewForm(f => ({ ...f, weight: e.target.value }))}
                      placeholder="0.0 *" inputMode="decimal" />
                    {intelligence?.weightAnomaly?.anomaly && (
                      <div style={{ fontSize: '0.6rem', color: theme.warning, marginTop: 3, fontWeight: 700 }}>
                        {intelligence.weightAnomaly.warning}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Weight quick picks */}
              <div className="weight-quick-picks">
                {[0.5, 1, 1.5, 2, 3, 5, 10].map(w => (
                  <button key={w} type="button"
                    className={`weight-chip ${String(reviewForm.weight) === String(w) ? 'active' : ''}`}
                    onClick={() => { setReviewForm(f => ({ ...f, weight: w })); pulseHaptic('tap'); }}>
                    {w}kg
                  </button>
                ))}
              </div>

              {/* AMOUNT + ORDER NO */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="field-card field-card-animated">
                  <div style={{ flex: 1 }}>
                    <div className="field-label">COD Amount (Rs.)</div>
                    <input className="field-input" value={reviewForm.amount || ''}
                      onChange={(e) => setReviewForm(f => ({ ...f, amount: e.target.value }))}
                      placeholder="0" inputMode="decimal" />
                  </div>
                </div>
                <div className="field-card field-card-animated">
                  <div style={{ flex: 1 }}>
                    <div className="field-label">Order No</div>
                    <input className="field-input" value={reviewForm.orderNo || ''}
                      onChange={(e) => setReviewForm(f => ({ ...f, orderNo: e.target.value }))}
                      placeholder="Optional" />
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.6rem', color: theme.mutedLight, textAlign: 'center', paddingBottom: 4 }}>
                <span style={{ color: '#E11D48' }}>*</span> Required  ·  Swipe right to save instantly
              </div>
            </div>

            {/* Action bar */}
            <div style={{ padding: '10px 16px 24px', borderTop: `1px solid ${theme.border}`, display: 'flex', gap: 10, background: theme.surface }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => {
                if (isStandalone) { navigate('/scan-mobile'); return; }
                resetForNextScan();
              }}>
                <X size={15} /> Skip
              </button>
              <button data-testid="approve-save-btn" className="btn btn-success btn-lg" style={{ flex: 2 }} onClick={submitApproval} disabled={step === STEPS.APPROVING}>
                {step === STEPS.APPROVING
                  ? <><RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
                  : <><Check size={15} /> Approve &amp; Save</>}
              </button>
            </div>
          </div>
        </div>

        {/* ═══ APPROVING ═══ */}
        <div className={stepClass(STEPS.APPROVING)}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 20, background: theme.bg }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: theme.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RefreshCw size={34} style={{ animation: 'spin 1s linear infinite', color: theme.primary }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: theme.text }}>Saving Consignment</div>
              <div className="mono" style={{ fontSize: '0.95rem', marginTop: 8, color: theme.muted }}>{reviewData?.awb || lockedAwb}</div>
              <div style={{ fontSize: '0.74rem', color: theme.mutedLight, marginTop: 6, lineHeight: 1.5 }}>
                Communicating with server...<br />If this takes too long, go back and retry.
              </div>
            </div>
            <button className="btn btn-outline" onClick={() => {
              clearTimeout(approvalResultTimerRef.current);
              approvalResultTimerRef.current = null;
              setErrorMsg('Please tap Approve & Save again.');
              goStep(STEPS.REVIEWING);
            }}>
              Back to review
            </button>
          </div>
        </div>

        {/* ═══ SUCCESS ═══ */}
        <div className={stepClass(STEPS.SUCCESS)}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28, gap: 20, background: theme.bg }}>
            {/* Courier badge */}
            {lastSuccess?.courier && (() => {
              const pal = getCourierPalette(normalizeReviewCourier(lastSuccess.courier));
              return (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, background: pal.light, color: pal.bg, fontSize: '0.7rem', fontWeight: 800, border: `1px solid ${pal.bg}33`, letterSpacing: '0.04em' }}>
                  <Package size={13} /> {pal.label}
                </div>
              );
            })()}

            {/* Animated check */}
            <div style={{ position: 'relative' }}>
              <svg width="88" height="88" viewBox="0 0 88 88">
                <circle cx="44" cy="44" r="38" fill={theme.successLight} />
                <circle cx="44" cy="44" r="38" fill="none" stroke={theme.success} strokeWidth="3" className="success-check-circle" />
                <polyline points="26,46 38,58 62,32" fill="none" stroke={theme.success} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="success-check-mark" />
              </svg>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: theme.success, marginBottom: 6 }}>Saved Successfully</div>
              <div className="mono" style={{ fontSize: '1.3rem', fontWeight: 700, color: theme.text }}>{lastSuccess?.awb}</div>
              {lastSuccess?.clientCode && (
                <div style={{ marginTop: 8, display: 'inline-block', padding: '4px 16px', borderRadius: 999, background: theme.primaryLight, color: theme.primary, fontSize: '0.78rem', fontWeight: 700, border: '1px solid rgba(29,78,216,0.15)' }}>
                  {lastSuccess.clientName || lastSuccess.clientCode}
                </div>
              )}
              {lastSuccess?.destination && (
                <div style={{ marginTop: 6, fontSize: '0.78rem', color: theme.muted, fontWeight: 500 }}>
                  {lastSuccess.destination} {lastSuccess.weight ? `• ${lastSuccess.weight}kg` : ''}
                </div>
              )}
            </div>

            <div style={{ fontSize: '0.72rem', color: theme.muted, textAlign: 'center', lineHeight: 1.5 }}>
              {lastSuccess?.offlineQueued
                ? `${offlineQueue.length} queued for sync`
                : `Consignment #${sessionCtx.scanNumber} accepted`}
              <br />
              <span style={{ color: theme.mutedLight }}>Auto-continuing in {successAutoSeconds}s</span>
            </div>

            <button data-testid="scan-next-btn" className="btn btn-primary btn-lg btn-full"
              onClick={() => resetForNextScan(scanWorkflowMode === 'fast' ? STEPS.SCANNING : STEPS.IDLE)}
              style={{ maxWidth: 320 }}>
              <Camera size={18} /> {scanWorkflowMode === 'fast' ? 'Keep Scanning' : 'Scan Next Parcel'}
            </button>
          </div>
        </div>

        {/* ═══ ERROR ═══ */}
        <div className={stepClass(STEPS.ERROR)}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 20, background: theme.bg }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: theme.errorLight, border: `2px solid rgba(220,38,38,0.18)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={34} color={theme.error} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: theme.error }}>Scan Error</div>
              <div style={{ fontSize: '0.82rem', color: theme.muted, marginTop: 6, lineHeight: 1.5 }}>{errorMsg}</div>
            </div>
            <button className="btn btn-primary" onClick={resetForNextScan}>
              <RotateCcw size={16} /> Try Again
            </button>
          </div>
        </div>

        {/* ── Offline banner ── */}
        {connStatus === 'disconnected' && step !== STEPS.IDLE && (
          <div className="offline-banner">
            <WifiOff size={12} style={{ display: 'inline', verticalAlign: -2, marginRight: 4 }} />
            Offline â€” Reconnecting... {offlineQueue.length ? `(${offlineQueue.length} queued)` : ''}
          </div>
        )}

        {/* ── Lock ring flash ── */}
        {showLockRing && <div className="lock-ring-flash" onAnimationEnd={() => setShowLockRing(false)} />}

        {/* ── Session Summary Modal ── */}
        {sessionSummaryOpen && (
          <div className="session-modal-overlay" onClick={() => setSessionSummaryOpen(false)}>
            <div className="session-modal" onClick={e => e.stopPropagation()}>
              <div className="session-modal-handle" />
              <div style={{ fontSize: '1rem', fontWeight: 800, color: theme.text, marginBottom: 4 }}>End Session?</div>
              <div style={{ fontSize: '0.78rem', color: theme.muted, marginBottom: 12 }}>Summary before you go</div>
              <div className="session-summary-grid">
                <div className="session-summary-tile">
                  <div className="session-summary-num">{sessionCtx.scanNumber}</div>
                  <div className="session-summary-lbl">Parcels Scanned</div>
                </div>
                <div className="session-summary-tile">
                  <div className="session-summary-num">{totalWeight > 0 ? totalWeight.toFixed(1) : '0'}</div>
                  <div className="session-summary-lbl">Total Weight kg</div>
                </div>
                <div className="session-summary-tile">
                  <div className="session-summary-num">{sessionDuration}</div>
                  <div className="session-summary-lbl">Duration</div>
                </div>
                <div className="session-summary-tile">
                  <div className="session-summary-num">{offlineQueue.length}</div>
                  <div className="session-summary-lbl">Pending Sync</div>
                </div>
              </div>
              {sessionCtx.scannedItems.length > 0 && (() => {
                const cc = {};
                sessionCtx.scannedItems.forEach(item => {
                  const c = normalizeReviewCourier(item.courier || '') || 'Other';
                  cc[c] = (cc[c] || 0) + 1;
                });
                return (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                    {Object.entries(cc).map(([c, n]) => {
                      const pal = getCourierPalette(c);
                      return (
                        <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 999, background: pal.light, color: pal.bg, fontSize: '0.7rem', fontWeight: 800, border: `1px solid ${pal.bg}33` }}>
                          {c} × {n}
                        </span>
                      );
                    })}
                  </div>
                );
              })()}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-outline btn-full" onClick={() => setSessionSummaryOpen(false)}>
                  Keep Scanning
                </button>
                <button className="btn btn-danger btn-full" onClick={() => { setSessionSummaryOpen(false); terminateSession(); }}>
                  <Trash2 size={15} /> End Session
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Global keyframes */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}