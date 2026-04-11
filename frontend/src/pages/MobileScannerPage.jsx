import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import {
  Camera, Check, AlertCircle, RotateCcw, Send, ChevronRight, Volume2, VolumeX,
  Wifi, WifiOff, Zap, Package, ScanLine, Shield, RefreshCw, X, Brain,
  BarChart3, History, Clock, CheckCircle2, List, ArrowLeft, Trash2, CloudUpload
} from 'lucide-react';

// ─── Constants ──────────────────────────────────────────────────────────────
const SOCKET_URL = import.meta.env.VITE_API_URL || window.location.origin;
const SCANBOT_LICENSE = import.meta.env.VITE_SCANBOT_LICENSE_KEY || '';
// Barcode strip: wide landscape rectangle — Trackon/DTDC barcodes are horizontal
const BARCODE_SCAN_REGION = { w: '90vw', h: '18vw' };  // aspect ~5:1, always landscape
// Document capture: tall portrait rectangle matching a real AWB slip shape
const DOC_CAPTURE_REGION  = { w: '92vw', h: '130vw' }; // ~A4 portrait proportion
const AUTO_NEXT_DELAY = 3500;
const OFFLINE_QUEUE_KEY_PREFIX = 'mobile_scanner_offline_queue';
const LOCK_TO_CAPTURE_DELAY = 80; // fast transition after barcode lock

// Native BarcodeDetector formats (supported on Chrome Android + iOS 17+)
const NATIVE_BARCODE_FORMATS = [
  'code_128', 'code_39', 'code_93', 'codabar',
  'ean_13', 'ean_8', 'itf', 'qr_code',
];

const STEPS = {
  IDLE: 'IDLE',
  SCANNING: 'SCANNING',
  // BARCODE_LOCKED removed: the locked state is now a visual overlay within SCANNING,
  // not a separate step. The lifecycle is: SCANNING → CAPTURING → PREVIEW → PROCESSING
  // → REVIEWING → APPROVING → SUCCESS (or ERROR at any point).
  CAPTURING: 'CAPTURING',
  PREVIEW: 'PREVIEW',
  PROCESSING: 'PROCESSING',
  REVIEWING: 'REVIEWING',
  APPROVING: 'APPROVING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
};

// ─── Audio/Haptics ──────────────────────────────────────────────────────────
const vibrate = (pattern) => {
  try { navigator?.vibrate?.(pattern); } catch {}
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
  } catch {}
};

const playSuccessBeep = () => { playTone(880, 0.12); setTimeout(() => playTone(1100, 0.10), 130); };
const playCaptureBeep = () => playTone(600, 0.08);
const playErrorBeep = () => playTone(200, 0.25, 'sawtooth');

const speak = (text) => {
  try {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.2; u.pitch = 1.0; u.lang = 'en-IN';
    window.speechSynthesis.speak(u);
  } catch {}
};

// ─── Styles ─────────────────────────────────────────────────────────────────
const theme = {
  bg: '#FAFBFD',
  surface: '#FFFFFF',
  border: 'rgba(0,0,0,0.06)',
  text: '#111827',
  muted: '#6B7280',
  mutedLight: '#9CA3AF',
  primary: '#4F46E5',
  primaryLight: '#EEF2FF',
  success: '#059669',
  successLight: '#ECFDF5',
  warning: '#D97706',
  warningLight: '#FFFBEB',
  error: '#DC2626',
  errorLight: '#FEF2F2',
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');

.msp-root {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: ${theme.bg};
  color: ${theme.text};
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  user-select: none;
  -webkit-user-select: none;
}
.msp-root * { box-sizing: border-box; }

/* ── Monospace for AWB ── */
.mono { font-family: 'JetBrains Mono', 'SF Mono', monospace; letter-spacing: -0.02em; }

/* ── Step wrapper (full-screen transitions) ── */
.msp-step {
  position: absolute; inset: 0;
  display: none; flex-direction: column;
  opacity: 0; transform: none;
  transition: none;
  pointer-events: none;
  z-index: 1;
}
.msp-step.active {
  display: flex;
  opacity: 1; transform: none;
  pointer-events: all; z-index: 2;
}
.msp-step.exiting {
  opacity: 0; transform: none;
  pointer-events: none;
}

/* ── Camera viewport ── */
.cam-viewport {
  position: relative; width: 100%; flex: 1;
  /* Use the full screen height as the sizing context so the scan-guide
     height-percentages always reference the actual screen, not the element's
     own unknown height (which can collapse when the <video> is outside). */
  min-height: 100dvh;
  background: transparent; overflow: hidden;
}
.cam-viewport video {
  width: 100%; height: 100%; object-fit: cover;
}
.cam-overlay {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  /* Must sit ABOVE the persistent background video (z-index 0) */
  z-index: 3;
}

/* ── Scan guide rectangle ── */
.scan-guide {
  border: 2.5px solid rgba(255,255,255,0.7);
  border-radius: 16px;
  position: relative;
  transition: border-color 0.3s, box-shadow 0.3s;
}
.scan-guide.detected {
  border-color: #10B981;
  box-shadow: 0 0 0 3px rgba(16,185,129,0.25), inset 0 0 30px rgba(16,185,129,0.05);
}
.scan-guide-corner {
  position: absolute; width: 24px; height: 24px;
  border: 3px solid rgba(255,255,255,0.9);
  transition: border-color 0.3s;
}
.scan-guide.detected .scan-guide-corner { border-color: #10B981; }
.corner-tl { top: -2px; left: -2px; border-right: none; border-bottom: none; border-radius: 8px 0 0 0; }
.corner-tr { top: -2px; right: -2px; border-left: none; border-bottom: none; border-radius: 0 8px 0 0; }
.corner-bl { bottom: -2px; left: -2px; border-right: none; border-top: none; border-radius: 0 0 0 8px; }
.corner-br { bottom: -2px; right: -2px; border-left: none; border-top: none; border-radius: 0 0 8px 0; }

/* ── Scan laser ── */
@keyframes laserScan {
  0%, 100% { top: 15%; } 50% { top: 82%; }
}
.scan-laser {
  position: absolute; left: 8%; right: 8%; height: 2px;
  background: linear-gradient(90deg, transparent, rgba(79,70,229,0.6), transparent);
  animation: laserScan 2.5s ease-in-out infinite;
}

/* ── HUD (top bar on camera) ── */
.cam-hud {
  position: absolute; top: 0; left: 0; right: 0;
  padding: 16px 20px;
  background: linear-gradient(to bottom, rgba(0,0,0,0.55), transparent);
  display: flex; justify-content: space-between; align-items: flex-start;
  z-index: 3;
}
.cam-hud-chip {
  padding: 5px 12px; border-radius: 20px;
  background: rgba(255,255,255,0.15); backdrop-filter: blur(8px);
  color: white; font-size: 0.72rem; font-weight: 600;
  display: flex; align-items: center; gap: 5px;
}

/* ── Bottom bar on camera ── */
.cam-bottom {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 20px;
  background: linear-gradient(to top, rgba(0,0,0,0.65), transparent);
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  z-index: 3;
}

/* ── Cards ── */
.card {
  background: ${theme.surface}; border: 1px solid ${theme.border};
  border-radius: 16px; padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

/* ── Buttons ── */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 14px 24px; border-radius: 12px; border: none;
  font-family: inherit; font-size: 0.9rem; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.btn:active { transform: scale(0.97); }
.btn-primary {
  background: linear-gradient(135deg, #4F46E5, #6366F1);
  color: white;
}
.btn-primary:hover { box-shadow: 0 4px 14px rgba(79,70,229,0.35); }
.btn-success {
  background: linear-gradient(135deg, #059669, #10B981);
  color: white;
}
.btn-outline {
  background: ${theme.surface}; border: 1.5px solid ${theme.border};
  color: ${theme.text};
}
.btn-danger { background: ${theme.errorLight}; color: ${theme.error}; }
.btn-lg { padding: 16px 32px; font-size: 1rem; border-radius: 14px; }
.btn-full { width: 100%; }
.btn:disabled {
  opacity: 0.5; cursor: default;
}

/* ── Capture button (circular) ── */
.capture-btn {
  width: 72px; height: 72px; border-radius: 50%;
  background: white; border: 4px solid rgba(255,255,255,0.4);
  cursor: pointer; position: relative;
  transition: transform 0.15s;
  box-shadow: 0 4px 20px rgba(0,0,0,0.25);
}
.capture-btn:active { transform: scale(0.92); }
.capture-btn-inner {
  position: absolute; inset: 4px; border-radius: 50%;
  background: white; border: 2px solid #E5E7EB;
}

/* ── Preview image ── */
.preview-img {
  width: 100%; border-radius: 12px;
  object-fit: contain; max-height: 50vh;
  background: #F1F5F9;
}

/* ── Field card in review ── */
.field-card {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 12px 14px;
  background: ${theme.surface}; border: 1px solid ${theme.border};
  border-radius: 12px;
}
.field-card.warning { border-color: ${theme.warning}; background: ${theme.warningLight}; }
.field-card.error-field { border-color: ${theme.error}; background: ${theme.errorLight}; }
.field-label {
  font-size: 0.65rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.05em;
  color: ${theme.muted}; margin-bottom: 2px;
}
.field-value {
  font-size: 0.85rem; font-weight: 600;
  color: ${theme.text};
}
.field-input {
  width: 100%; background: ${theme.bg}; border: 1px solid ${theme.border};
  border-radius: 8px; padding: 8px 10px;
  font-family: inherit; font-size: 0.82rem; font-weight: 500;
  color: ${theme.text}; outline: none;
}
.field-input:focus { border-color: ${theme.primary}; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }

/* ── Confidence dot ── */
.conf-dot {
  width: 8px; height: 8px; border-radius: 50%;
  flex-shrink: 0; margin-top: 4px;
}
.conf-high { background: ${theme.success}; }
.conf-med { background: ${theme.warning}; }
.conf-low { background: ${theme.error}; }

/* ── Source badge ── */
.source-badge {
  font-size: 0.6rem; padding: 2px 6px; border-radius: 6px;
  font-weight: 600; display: inline-flex; align-items: center; gap: 3px;
}
.source-learned { background: #F5F3FF; color: #7C3AED; }
.source-ai { background: ${theme.primaryLight}; color: ${theme.primary}; }
.source-history { background: ${theme.warningLight}; color: ${theme.warning}; }
.source-pincode { background: ${theme.successLight}; color: ${theme.success}; }

/* ── Shimmer skeleton ── */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton {
  background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: 8px;
}

/* ── Success checkmark ── */
@keyframes checkDraw {
  0% { stroke-dashoffset: 48; }
  100% { stroke-dashoffset: 0; }
}
@keyframes circleDraw {
  0% { stroke-dashoffset: 200; }
  100% { stroke-dashoffset: 0; }
}
.success-check-circle {
  stroke-dasharray: 200; stroke-dashoffset: 200;
  animation: circleDraw 0.6s ease-out 0.1s forwards;
}
.success-check-mark {
  stroke-dasharray: 48; stroke-dashoffset: 48;
  animation: checkDraw 0.5s ease-out 0.5s forwards;
}

/* ── Flash overlay ── */
@keyframes flash { 0% { opacity: 0.8; } 100% { opacity: 0; } }
.flash-overlay {
  position: fixed; inset: 0; z-index: 50;
  pointer-events: none;
  animation: flash 0.3s ease-out forwards;
}
.flash-white { background: white; }
.flash-success { background: rgba(5,150,105,0.2); }
.flash-error { background: rgba(220,38,38,0.2); }

/* ── Duplicate warning ── */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-6px); }
  40%, 80% { transform: translateX(6px); }
}
.shake { animation: shake 0.5s ease-in-out; }

/* ── Offline banner ── */
.offline-banner {
  background: ${theme.warningLight}; color: ${theme.warning};
  text-align: center; padding: 6px; font-size: 0.72rem; font-weight: 600;
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 99;
}

/* ── Scrollable panel ── */
.scroll-panel {
  flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
  padding: 16px 20px;
}

/* ════════════════════════════════════════════════════════
   HOME SCREEN (aligned with direct mobile scanner)
   ════════════════════════════════════════════════════════ */
.home-root {
  display: flex; flex-direction: column;
  min-height: 100dvh; overflow-y: auto;
  background: #F8FAFC;
}
.home-header {
  background: linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 100%);
  padding: 20px 20px 36px; position: relative; overflow: hidden;
  border-bottom: 1px solid #E2E8F0;
}
.home-header::before {
  content: ''; position: absolute; top: -40px; right: -40px;
  width: 180px; height: 180px; border-radius: 50%;
  background: rgba(79,70,229,0.03);
}
.home-header::after {
  content: ''; position: absolute;
  bottom: -22px; left: 0; right: 0; height: 44px;
  background: #F8FAFC;
  border-radius: 60% 60% 0 0 / 22px 22px 0 0;
  border-top: 1px solid #E2E8F0;
}
.home-logo-row {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px;
}
.home-logo-text {
  font-size: 1.08rem; font-weight: 800; color: #0F172A; letter-spacing: -0.01em;
  display: flex; align-items: center; gap: 8px;
}
.home-logo-badge {
  background: #FFFFFF;
  border: 1px solid #E2E8F0; border-radius: 20px;
  padding: 5px 12px; font-size: 0.72rem; font-weight: 600; color: #475569;
  display: flex; align-items: center; gap: 5px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}
.home-stats-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
.home-stat-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0; border-radius: 12px;
  padding: 11px 10px; text-align: center;
  box-shadow: 0 2px 6px rgba(0,0,0,0.02);
}
.home-stat-val { font-size: 1.3rem; font-weight: 800; color: #0F172A; line-height: 1; }
.home-stat-label { font-size: 0.58rem; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 3px; }
.home-scan-section { display: flex; flex-direction: column; align-items: center; padding: 36px 20px 28px; }
@keyframes pulseRing { 0% { transform: scale(1); opacity: 0.55; } 100% { transform: scale(1.6); opacity: 0; } }
.home-scan-btn-wrap { position: relative; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; }
.home-scan-ring {
  position: absolute; width: 120px; height: 120px; border-radius: 50%;
  border: 2.5px solid #6366F1;
  animation: pulseRing 2.2s ease-out infinite;
}
.home-scan-ring2 { animation-delay: 0.8s; }
.home-scan-btn {
  width: 104px; height: 104px; border-radius: 50%;
  background: linear-gradient(145deg, #4F46E5, #6366F1);
  border: none; cursor: pointer; touch-action: manipulation;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
  box-shadow: 0 8px 36px rgba(79,70,229,0.35), 0 0 0 6px rgba(79,70,229,0.12);
  transition: transform 0.15s, box-shadow 0.15s;
  position: relative; z-index: 1;
}
.home-scan-btn:active { transform: scale(0.93); box-shadow: 0 4px 18px rgba(79,70,229,0.25); }
.home-scan-btn-label { font-size: 0.6rem; font-weight: 800; color: white; text-transform: uppercase; letter-spacing: 0.06em; }
.home-cta-text { font-size: 0.82rem; color: #64748B; font-weight: 500; }
.action-buttons-row {
  display: flex; gap: 12px; margin-top: 24px; width: 100%; max-width: 300px;
}
.action-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 10px; border-radius: 12px; border: 1px solid #E2E8F0;
  background: #FFFFFF; color: #475569; font-size: 0.75rem; font-weight: 600;
  cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}
.action-btn:active { transform: scale(0.96); background: #F8FAFC; }
.action-btn.danger { color: #DC2626; border-color: #FECACA; background: #FEF2F2; }
.home-queue-section {
  flex: 1; background: #FFFFFF; border-radius: 20px 20px 0 0;
  overflow: hidden; display: flex; flex-direction: column; min-height: 280px;
  border-top: 1px solid #E2E8F0; box-shadow: 0 -4px 20px rgba(0,0,0,0.02);
}
.home-queue-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px 12px; border-bottom: 1px solid #E2E8F0;
}
.home-queue-title-text {
  font-size: 0.65rem; font-weight: 700; color: #64748B;
  text-transform: uppercase; letter-spacing: 0.08em;
  display: flex; align-items: center; gap: 6px;
}
.home-queue-badge {
  font-size: 0.65rem; font-weight: 700;
  background: #EEF2FF; color: #4F46E5;
  padding: 2px 9px; border-radius: 10px;
}
.home-queue-list { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; }
@keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
.queue-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 20px; border-bottom: 1px solid #F1F5F9;
  animation: slideIn 0.3s ease-out;
}
.queue-item:active { background: #F8FAFC; }
.queue-check {
  width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
  background: #ECFDF5; border: 1.5px solid #10B981;
  display: flex; align-items: center; justify-content: center;
}
.queue-awb { font-family: 'JetBrains Mono', 'SF Mono', monospace; font-size: 0.8rem; font-weight: 600; color: #0F172A; }
.queue-meta { font-size: 0.64rem; color: #64748B; margin-top: 2px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.queue-client-tag { background: #EEF2FF; color: #4F46E5; padding: 1px 6px; border-radius: 4px; }
.queue-offline-tag { background: #FFFBEB; color: #D97706; padding: 1px 6px; border-radius: 4px; }
.queue-weight { font-size: 0.72rem; font-weight: 700; color: #4F46E5; margin-left: auto; flex-shrink: 0; }
.queue-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 44px 20px; gap: 12px; }
.queue-empty-text { font-size: 0.8rem; color: #94A3B8; font-weight: 500; text-align: center; line-height: 1.5; }
`;

// ─── Confidence helpers ─────────────────────────────────────────────────────
const confLevel = (score) => {
  if (score >= 0.85) return 'high';
  if (score >= 0.55) return 'med';
  return 'low';
};

const confDotClass = (score) => `conf-dot conf-${confLevel(score)}`;

const sourceLabel = (source) => {
  if (source === 'learned') return { className: 'source-badge source-learned', icon: '🧠', text: 'Learned' };
  if (source === 'fuzzy_match') return { className: 'source-badge source-ai', icon: '🔍', text: 'Matched' };
  if (source === 'fuzzy_history' || source === 'consignee_pattern') return { className: 'source-badge source-history', icon: '📊', text: 'History' };
  if (source === 'delhivery_pincode' || source === 'india_post' || source === 'pincode_lookup' || source === 'indiapost_lookup') return { className: 'source-badge source-pincode', icon: '📍', text: 'Pincode' };
  return null;
};

const fmtDuration = (ms) => {
  const m = Math.floor(ms / 60000);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
};

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════
export default function MobileScannerPage() {
  const { pin } = useParams();
  const navigate = useNavigate();
  const offlineQueueKey = `${OFFLINE_QUEUE_KEY_PREFIX}:${pin || 'unknown'}`;

  // ── Connection ──
  const [socket, setSocket] = useState(null);
  const [connStatus, setConnStatus] = useState('connecting'); // connecting | paired | disconnected
  const [errorMsg, setErrorMsg] = useState('');

  // ── State machine ──
  const [step, setStep] = useState(STEPS.IDLE);

  // ── Scan data ──
  const [lockedAwb, setLockedAwb] = useState('');
  const [capturedImage, setCapturedImage] = useState(null);
  const [processingFields, setProcessingFields] = useState({});
  const [reviewData, setReviewData] = useState(null);
  const [reviewForm, setReviewForm] = useState({});
  const [lastSuccess, setLastSuccess] = useState(null);
  const [flash, setFlash] = useState(null); // null | 'white' | 'success' | 'error'
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [docDetected, setDocDetected] = useState(false);
  const [docStableTicks, setDocStableTicks] = useState(0);
  const [captureCameraReady, setCaptureCameraReady] = useState(false);
  const [sessionDuration, setSessionDuration] = useState('0m');
  const [pairedLabel, setPairedLabel] = useState('Connected');

  // ── Session context ──
  const [sessionCtx, setSessionCtx] = useState({
    scannedAwbs: new Set(),
    clientFreq: {},
    scanNumber: 0,
    dominantClient: null,
    dominantClientCount: 0,
    startedAt: Date.now(),
    scannedItems: [],
  });

  // ── Settings ──
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  // ── Refs ──
  const videoRef = useRef(null);
  const guideRef = useRef(null);
  const scannerRef = useRef(null); // ZXing reader
  const scanbotRef = useRef(null); // Scanbot SDK
  const scanBusyRef = useRef(false);
  const autoNextTimer = useRef(null);
  const autoCaptureTriggeredRef = useRef(false);
  const currentStepRef = useRef(STEPS.IDLE);
  const lockToCaptureTimerRef = useRef(null);
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

  useEffect(() => {
    const t = setInterval(() => setSessionDuration(fmtDuration(Date.now() - sessionCtx.startedAt)), 30000);
    return () => clearInterval(t);
  }, [sessionCtx.startedAt]);

  const saveOfflineQueue = useCallback((nextQueue) => {
    setOfflineQueue(nextQueue);
    try {
      if (nextQueue.length) {
        localStorage.setItem(offlineQueueKey, JSON.stringify(nextQueue));
      } else {
        localStorage.removeItem(offlineQueueKey);
      }
    } catch {}
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

  const flushOfflineQueue = useCallback(() => {
    if (!socket || !socket.connected || !offlineQueue.length) return;
    offlineQueue.forEach((item) => {
      if (!item?.payload?.awb || !item?.payload?.imageBase64) return;
      socket.emit('scanner:scan', item.payload);
    });
    saveOfflineQueue([]);
  }, [socket, offlineQueue, saveOfflineQueue]);

  // ── Step transition helper ──
  const goStep = useCallback((next) => {
    setStep(next);
  }, []);

  const addToQueue = useCallback((item) => {
    setSessionCtx((prev) => ({
      ...prev,
      scannedItems: [{ ...item, time: Date.now() }, ...prev.scannedItems],
    }));
  }, []);

  const handleStartScanning = useCallback(() => {
    if (connStatus !== 'paired') {
      setErrorMsg('Phone is not connected to the desktop session.');
      return;
    }
    setErrorMsg('');
    goStep(STEPS.SCANNING);
  }, [connStatus, goStep]);

  const terminateSession = useCallback(() => {
    if (!window.confirm('End this mobile scanner session on the phone?')) return;
    if (socket?.connected) {
      socket.emit('scanner:end-session', { reason: 'Mobile ended the session' });
    } else {
      navigate('/');
    }
  }, [socket, navigate]);

  const saveAndUpload = useCallback(() => {
    if (offlineQueue.length > 0) {
      flushOfflineQueue();
      return;
    }
    window.alert('Everything is already synced.');
  }, [offlineQueue.length, flushOfflineQueue]);

  useEffect(() => {
    currentStepRef.current = step;
  }, [step]);

  // ════════════════════════════════════════════════════════════════════════
  // SOCKET CONNECTION
  // ════════════════════════════════════════════════════════════════════════
  useEffect(() => {
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
      goStep(STEPS.IDLE);
    });
    s.on('scanner:error', ({ message }) => {
      setErrorMsg(message);
      setConnStatus('disconnected');
    });
    s.on('scanner:session-ended', ({ reason }) => {
      setConnStatus('disconnected');
      setErrorMsg(reason || 'Session ended by desktop.');
      navigate('/');
    });
    s.on('disconnect', () => setConnStatus('disconnected'));
    s.on('reconnect', () => { if (connStatus === 'paired') goStep(STEPS.SCANNING); });

    // Desktop processed our scan
    s.on('scanner:scan-processed', (data) => {
      if (data.status === 'error') {
        setFlash('error');
        playErrorBeep();
        vibrate([100, 50, 100]);
        goStep(STEPS.ERROR);
        setErrorMsg(data.error || 'Scan failed on desktop.');
        return;
      }

      setReviewData(data);
      setReviewForm({
        clientCode: data.clientCode || '',
        consignee: data.consignee || '',
        destination: data.destination || '',
        pincode: data.pincode || '',
        weight: data.weight || 0,
        amount: data.amount || 0,
        orderNo: data.orderNo || '',
      });
      setProcessingFields({});

      if (data.reviewRequired) {
        goStep(STEPS.REVIEWING);
      } else {
        // Auto-approved
        playSuccessBeep();
        vibrate([50, 30, 50]);
        const item = {
          awb: data.awb,
          clientCode: data.clientCode,
          clientName: data.clientName,
          destination: data.destination || '',
          weight: data.weight || 0,
        };
        setLastSuccess(item);
        addToQueue(item);
        goStep(STEPS.SUCCESS);
      }
    });

    // Desktop approved our mobile-submitted approval
    s.on('scanner:approval-result', ({ success, message, awb }) => {
      if (success) {
        playSuccessBeep();
        vibrate([50, 30, 50]);
        setFlash('success');
        const item = {
          awb: reviewData?.awb || awb,
          clientCode: reviewForm.clientCode,
          clientName: reviewData?.clientName || reviewForm.clientCode,
          destination: reviewForm.destination || '',
          weight: parseFloat(reviewForm.weight) || 0,
        };
        setLastSuccess(item);
        addToQueue(item);
        goStep(STEPS.SUCCESS);
      } else {
        playErrorBeep();
        setErrorMsg(message || 'Approval failed.');
      }
    });

    s.on('scanner:ready-for-next', () => {
      // Desktop is ready — ensure we're in a state to scan again
    });

    setSocket(s);
    return () => { s.disconnect(); };
  }, [pin, addToQueue, reviewData, reviewForm, goStep, navigate]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(offlineQueueKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) {
        setOfflineQueue(parsed);
      }
    } catch {}
  }, [offlineQueueKey]);

  useEffect(() => {
    if (connStatus === 'paired' && socket?.connected && offlineQueue.length) {
      flushOfflineQueue();
    }
  }, [connStatus, socket, offlineQueue.length, flushOfflineQueue]);

  // ════════════════════════════════════════════════════════════════════════
  // CAMERA (Barcode Scanning)
  // ════════════════════════════════════════════════════════════════════════

  const stopCamera = useCallback(async () => {
    try {
      setCaptureCameraReady(false);
      if (scanbotRef.current) {
        try {
          const sdk = scanbotRef.current;
          if (sdk?.barcodeScanner) await sdk.barcodeScanner.dispose();
        } catch {}
        scanbotRef.current = null;
      }
      if (scannerRef.current) {
        try { await scannerRef.current.reset(); } catch {}
        scannerRef.current = null;
      }
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
    } catch {}
  }, []);

  // Stops only the barcode scanner/reader — leaves the video stream running.
  // Use this when transitioning from SCANNING → CAPTURING so there is no black-screen flicker.
  const stopBarcodeScanner = useCallback(async () => {
    try {
      if (scanbotRef.current) {
        try { await scanbotRef.current.barcodeScanner.dispose(); } catch {}
        scanbotRef.current = null;
      }
      if (scannerRef.current) {
        try {
          if (scannerRef.current._type === 'native') {
            scannerRef.current.reset();
          } else {
            await scannerRef.current.reset();
          }
        } catch {}
        scannerRef.current = null;
      }
    } catch {}
  }, []);

  const startBarcodeScanner = useCallback(async () => {
    if (!videoRef.current) return;
    await stopBarcodeScanner();

    try {
      // ── Ensure camera stream is running ──────────────────────────────────
      if (!videoRef.current.srcObject) {
        let stream = null;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'environment',
              width:  { ideal: 1920 },
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
      }

      // ── Path 1: Native BarcodeDetector (Chrome Android, iOS 17+) ─────────
      // ITF support check is critical — Trackon uses 12-digit ITF numeric barcodes.
      // If the device doesn't support ITF natively, we fall through to ZXing which
      // handles it correctly on all platforms.
      if (typeof window.BarcodeDetector !== 'undefined') {
        let useNative = true;

        let supportedFormats = NATIVE_BARCODE_FORMATS;
        try {
          const available = await window.BarcodeDetector.getSupportedFormats();
          supportedFormats = NATIVE_BARCODE_FORMATS.filter(f => available.includes(f));
          if (!supportedFormats.length) supportedFormats = NATIVE_BARCODE_FORMATS;
        } catch { /* use defaults */ }

        if (!supportedFormats.includes('itf')) {
          // This device's native detector can't read Trackon barcodes — use ZXing.
          console.log('[MobileScanner] Native BarcodeDetector lacks ITF — falling back to ZXing');
          useNative = false;
        }

        if (useNative) {
          const detector = new window.BarcodeDetector({ formats: supportedFormats });
          let rafId = null;

          const tick = async () => {
            if (scanBusyRef.current || currentStepRef.current !== STEPS.SCANNING) return;
            const video = videoRef.current;
            if (!video || video.readyState < 2) {
              rafId = requestAnimationFrame(tick);
              return;
            }
            try {
              const barcodes = await detector.detect(video);
              if (barcodes.length > 0 && barcodes[0].rawValue) {
                handleBarcodeDetectedRef.current?.(barcodes[0].rawValue);
              }
            } catch { /* frame not ready */ }
            // ~15ms between frames = ~60fps scanning
            if (currentStepRef.current === STEPS.SCANNING) {
              rafId = requestAnimationFrame(() => setTimeout(tick, 15));
            }
          };

          scannerRef.current = {
            _type: 'native',
            reset: () => {
              if (rafId) cancelAnimationFrame(rafId);
              rafId = null;
            },
          };

          setTimeout(tick, 300);
          return; // ← native path active, skip ZXing
        }
        // useNative=false: fall through to ZXing below
      }

      // ── Path 2: ZXing (Safari iOS < 17, or native path lacked ITF) ───────
      // ZXing handles ITF (Trackon), Code128 (DTDC/Delhivery) and more.
      // 40ms interval ≈ 25fps — fast enough without hammering the CPU.
      const [{ BrowserMultiFormatReader }, zxingCore] = await Promise.all([
        import('@zxing/browser'),
        import('@zxing/library'),
      ]);

      const hints = new Map([
        [zxingCore.DecodeHintType.POSSIBLE_FORMATS, [
          zxingCore.BarcodeFormat.CODE_128,  // Trackon, DTDC primary format
          zxingCore.BarcodeFormat.ITF,        // Trackon 12-digit numeric AWBs
          zxingCore.BarcodeFormat.CODE_39,
          zxingCore.BarcodeFormat.CODE_93,
          zxingCore.BarcodeFormat.CODABAR,
          zxingCore.BarcodeFormat.EAN_13,
          zxingCore.BarcodeFormat.EAN_8,
        ]],
        [zxingCore.DecodeHintType.TRY_HARDER, true],
        [zxingCore.DecodeHintType.ASSUME_GS1, false],
        [zxingCore.DecodeHintType.CHARACTER_SET, 'UTF-8'],
      ]);

      // 40ms scan interval ≈ 25fps — fast for real-world barcodes, easy on the battery
      const reader = new BrowserMultiFormatReader(hints, 40);
      scannerRef.current = reader;

      reader.decodeFromVideoElement(videoRef.current, (result) => {
        if (scanBusyRef.current) return;
        if (result) handleBarcodeDetectedRef.current?.(result.getText());
      });
    } catch (err) {
      setErrorMsg('Camera access failed: ' + err.message);
    }
  }, [stopBarcodeScanner]);
  // Note: handleBarcodeDetected is intentionally NOT in the dep array here.
  // The scanner is set up once per SCANNING entry; the ref ensures it always
  // calls the latest callback without needing to restart the scanner.

  const handleBarcodeDetected = useCallback((rawText) => {
    const awb = String(rawText || '').trim().replace(/\s+/g, '').toUpperCase();
    if (!awb || awb.length < 6 || scanBusyRef.current || currentStepRef.current !== STEPS.SCANNING) return;
    scanBusyRef.current = true;

    // Duplicate detection — read from the stable ref so this check is never stale
    // even when the scanner callback was closed over an old render.
    if (scannedAwbsRef.current.has(awb)) {
      vibrate([100, 50, 100, 50, 100]);
      playErrorBeep();
      setDuplicateWarning(awb);
      setTimeout(() => { setDuplicateWarning(''); scanBusyRef.current = false; }, 2500);
      return;
    }

    clearTimeout(lockToCaptureTimerRef.current);
    vibrate([50]);
    playCaptureBeep();
    setLockedAwb(awb);

    // Update session — also keep scannedAwbsRef in sync for future duplicate checks.
      setSessionCtx(prev => {
        const next = { ...prev, scanNumber: prev.scanNumber + 1 };
        next.scannedAwbs = new Set(prev.scannedAwbs);
        next.scannedAwbs.add(awb);
        scannedAwbsRef.current = next.scannedAwbs; // keep stable ref in sync
        return next;
      });

    // Jump straight into document capture and keep the lock message as an overlay.
    lockToCaptureTimerRef.current = setTimeout(() => {
      if (currentStepRef.current === STEPS.SCANNING) {
        goStep(STEPS.CAPTURING);
      }
    }, LOCK_TO_CAPTURE_DELAY);
  }, [goStep]); // sessionCtx removed from deps — duplicate check now uses scannedAwbsRef

  // Keep handleBarcodeDetectedRef pointing at the latest callback so the scanner
  // (which is set up once per SCANNING entry) always calls current logic.
  useEffect(() => {
    handleBarcodeDetectedRef.current = handleBarcodeDetected;
  }, [handleBarcodeDetected]);

  // Start scanning when step changes to SCANNING
  useEffect(() => {
    if (step === STEPS.SCANNING) {
      scanBusyRef.current = false;
      startBarcodeScanner();
    }
    return () => {
      // When leaving SCANNING, stop only the barcode reader — keep the video stream
      // alive so CAPTURING can reuse it instantly with no black-frame flicker.
      if (step === STEPS.SCANNING) stopBarcodeScanner();
    };
  }, [step, startBarcodeScanner, stopBarcodeScanner]);

  // ════════════════════════════════════════════════════════════════════════
  // PHOTO CAPTURE (Document mode)
  // ════════════════════════════════════════════════════════════════════════

  const startDocumentCamera = useCallback(async () => {
    await stopBarcodeScanner(); // ensure barcode reader is off
    try {
      // Reuse the stream that was already started by startBarcodeScanner.
      // This is the key anti-flicker fix: the video element never goes dark
      // between the barcode-scan phase and the document-capture phase.
      if (videoRef.current?.srcObject) {
        setCaptureCameraReady(true);
        return;
      }
      // Fallback: start fresh stream if somehow the stream was lost
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCaptureCameraReady(true);
      }
    } catch (err) {
      setErrorMsg('Camera access failed: ' + err.message);
    }
  }, [stopBarcodeScanner]);

  useEffect(() => {
    if (step === STEPS.CAPTURING) startDocumentCamera();
  }, [step, startDocumentCamera]);

  useEffect(() => {
    if (step !== STEPS.CAPTURING) {
      setDocDetected(false);
      setDocStableTicks(0);
      autoCaptureTriggeredRef.current = false;
      return;
    }

    // Just detect whether a document is in frame to give visual feedback.
    // We do NOT auto-capture — user must press the shutter button.
    const tick = setInterval(() => {
      const video = videoRef.current;
      const guide = guideRef.current;
      if (!video || !guide || !video.videoWidth || !video.videoHeight) return;

      const videoRect = video.getBoundingClientRect();
      const guideRect = guide.getBoundingClientRect();
      const scaleX = video.videoWidth / Math.max(videoRect.width, 1);
      const scaleY = video.videoHeight / Math.max(videoRect.height, 1);
      const sx = Math.max(0, Math.floor((guideRect.left - videoRect.left) * scaleX));
      const sy = Math.max(0, Math.floor((guideRect.top - videoRect.top) * scaleY));
      const sw = Math.max(24, Math.floor(guideRect.width * scaleX));
      const sh = Math.max(24, Math.floor(guideRect.height * scaleY));

      const sampleCanvas = document.createElement('canvas');
      const sampleW = 96; const sampleH = 72;
      sampleCanvas.width = sampleW; sampleCanvas.height = sampleH;
      const ctx = sampleCanvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(video, sx, sy, Math.min(sw, video.videoWidth - sx), Math.min(sh, video.videoHeight - sy), 0, 0, sampleW, sampleH);
      const img = ctx.getImageData(0, 0, sampleW, sampleH).data;

      let sum = 0, sumSq = 0, edgeCount = 0, px = 0;
      for (let i = 0; i < img.length; i += 4) {
        const lum = 0.2126 * img[i] + 0.7152 * img[i + 1] + 0.0722 * img[i + 2];
        sum += lum; sumSq += lum * lum;
        if (i > 0 && Math.abs(lum - px) > 26) edgeCount++;
        px = lum;
      }
      const total = sampleW * sampleH;
      const mean = sum / total;
      const contrast = Math.sqrt(Math.max(0, sumSq / total - mean * mean));
      const edgeRatio = edgeCount / Math.max(total, 1);
      const detected = mean > 35 && mean < 225 && contrast > 24 && edgeRatio > 0.12;

      setDocDetected(detected);
      setDocStableTicks(prev => detected ? Math.min(prev + 1, 8) : 0);
    }, 320);

    return () => clearInterval(tick);
  }, [step]);

  const captureDocumentRegion = useCallback(() => {
    const video = videoRef.current;
    const guide = guideRef.current;
    if (!video || !guide || !video.videoWidth) return null;

    const videoRect = video.getBoundingClientRect();
    const guideRect = guide.getBoundingClientRect();

    const scaleX = video.videoWidth / videoRect.width;
    const scaleY = video.videoHeight / videoRect.height;

    const cropX = Math.max(0, (guideRect.left - videoRect.left) * scaleX);
    const cropY = Math.max(0, (guideRect.top - videoRect.top) * scaleY);
    const cropW = Math.min(video.videoWidth - cropX, guideRect.width * scaleX);
    const cropH = Math.min(video.videoHeight - cropY, guideRect.height * scaleY);

    const canvas = document.createElement('canvas');
    canvas.width = Math.min(1200, Math.round(cropW));
    canvas.height = Math.round((canvas.width / cropW) * cropH);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL('image/jpeg', 0.75).split(',')[1] || null;
  }, []);

  const handleCapturePhoto = useCallback(() => {
    setFlash('white');
    playCaptureBeep();
    vibrate([30]);

    const image = captureDocumentRegion();
    if (!image) {
      setErrorMsg('Could not capture image. Try again.');
      scanBusyRef.current = false;
      return;
    }

    setCapturedImage(`data:image/jpeg;base64,${image}`);
    stopCamera();
    goStep(STEPS.PREVIEW);
  }, [captureDocumentRegion, stopCamera, goStep]);

  // Auto-capture is intentionally disabled — user presses the shutter button manually.

  // ════════════════════════════════════════════════════════════════════════
  // SEND TO DESKTOP (OCR Pipeline)
  // ════════════════════════════════════════════════════════════════════════

  const submitForProcessing = useCallback(() => {
    if (!lockedAwb || !capturedImage) return;
    goStep(STEPS.PROCESSING);

    // Build session context for the intelligence engine
    const ctxPayload = {
      scanNumber: sessionCtx.scanNumber,
      recentClient: sessionCtx.dominantClient,
      dominantClient: sessionCtx.dominantClient,
      dominantClientCount: sessionCtx.dominantClientCount,
      sessionDurationMin: Math.round((Date.now() - sessionCtx.startedAt) / 60000),
    };

    // Extract base64 from data URL
    const imageBase64 = capturedImage.split(',')[1] || capturedImage;

    const payload = {
      awb: lockedAwb,
      imageBase64,
      focusImageBase64: imageBase64,
      sessionContext: ctxPayload,
    };

    if (!socket || !socket.connected || connStatus !== 'paired') {
      enqueueOfflineScan(payload);
      playSuccessBeep();
      const item = { awb: lockedAwb, clientCode: 'OFFLINE', clientName: 'Queued Offline', destination: '', weight: 0 };
      setLastSuccess({ ...item, offlineQueued: true });
      addToQueue(item);
      goStep(STEPS.SUCCESS);
      return;
    }

    socket.emit('scanner:scan', payload);

    // Timeout fallback — 40s to give Gemini Vision enough time on slow connections
    setTimeout(() => {
      if (currentStepRef.current === STEPS.PROCESSING) {
        setErrorMsg('OCR timed out after 40 seconds. Check that GEMINI_API_KEY is set on Railway, then try again.');
        goStep(STEPS.ERROR);
      }
    }, 40000);
  }, [socket, lockedAwb, capturedImage, sessionCtx, goStep, connStatus, enqueueOfflineScan, addToQueue]);

  // ════════════════════════════════════════════════════════════════════════
  // APPROVAL
  // ════════════════════════════════════════════════════════════════════════

  const submitApproval = useCallback(() => {
    if (!socket || !reviewData) return;
    goStep(STEPS.APPROVING);

    // Record corrections for learning system
    if (reviewData.ocrExtracted || reviewData) {
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

      // Send corrections to learning system via socket
      socket.emit('scanner:learn-corrections', {
        pin,
        ocrFields,
        approvedFields,
      });
    }

    socket.emit('scanner:approval-submit', {
      shipmentId: reviewData.shipmentId,
      awb: reviewData.awb || lockedAwb,
      fields: {
        clientCode: reviewForm.clientCode,
        consignee: reviewForm.consignee,
        destination: reviewForm.destination,
        pincode: reviewForm.pincode,
        weight: parseFloat(reviewForm.weight) || 0,
        amount: parseFloat(reviewForm.amount) || 0,
        orderNo: reviewForm.orderNo || '',
      },
    }, (response) => {
      if (response?.success) {
        // Wait for approval-result from desktop
      } else {
        goStep(STEPS.REVIEWING);
        setErrorMsg(response?.message || 'Approval failed.');
      }
    });

    // Update session client frequency
    if (reviewForm.clientCode && reviewForm.clientCode !== 'MISC') {
      setSessionCtx(prev => {
        const freq = { ...prev.clientFreq };
        freq[reviewForm.clientCode] = (freq[reviewForm.clientCode] || 0) + 1;
        const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
        return {
          ...prev,
          clientFreq: freq,
          dominantClient: sorted[0]?.[1] >= 2 ? sorted[0][0] : null,
          dominantClientCount: sorted[0]?.[1] || 0,
        };
      });
    }
  }, [socket, reviewData, reviewForm, lockedAwb, pin, goStep]);

  // ════════════════════════════════════════════════════════════════════════
  // RESET / NEXT SCAN
  // ════════════════════════════════════════════════════════════════════════

  const resetForNextScan = useCallback(() => {
    clearTimeout(autoNextTimer.current);
    clearTimeout(lockToCaptureTimerRef.current);
    setLockedAwb('');
    setCapturedImage(null);
    setReviewData(null);
    setReviewForm({});
    setProcessingFields({});
    setLastSuccess(null);
    setErrorMsg('');
    setDuplicateWarning('');
    scanBusyRef.current = false;
    // scannedAwbsRef is intentionally NOT cleared here — duplicates should be
    // tracked across the entire session, not just one scan cycle. Clear it only
    // if you add an explicit "new session" action.
    goStep(STEPS.IDLE);
  }, [goStep]);

  // Auto-return to the home screen after SUCCESS
  useEffect(() => {
    if (step === STEPS.SUCCESS) {
      autoNextTimer.current = setTimeout(resetForNextScan, AUTO_NEXT_DELAY);
      return () => clearTimeout(autoNextTimer.current);
    }
  }, [step, resetForNextScan]);

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
  }, [stopCamera]);

  // ════════════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════════════

  const isStepActive = (s) => step === s;
  const stepClass = (s) => `msp-step ${step === s ? 'active' : ''}`;

  // ── Confidence data from reviewData ──
  const fieldConfidence = useMemo(() => {
    if (!reviewData) return {};
    const ocrData = reviewData.ocrExtracted || reviewData;
    return {
      clientCode: { confidence: ocrData?.clientNameConfidence || 0, source: ocrData?.clientNameSource || null },
      consignee: { confidence: ocrData?.consigneeConfidence || 0, source: ocrData?.consigneeSource || null },
      destination: { confidence: ocrData?.destinationConfidence || 0, source: ocrData?.destinationSource || null },
      pincode: { confidence: ocrData?.pincodeConfidence || 0, source: null },
      weight: { confidence: ocrData?.weightConfidence || 0, source: null },
    };
  }, [reviewData]);

  const totalWeight = sessionCtx.scannedItems.reduce((sum, item) => sum + (item.weight || 0), 0);

  const intelligence = reviewData?.ocrExtracted?.intelligence || reviewData?.intelligence || null;

  return (
    <>
      <style>{css}</style>
      <div className="msp-root">
        {/* ── Flash overlay ── */}
        {flash && <div className={`flash-overlay flash-${flash}`} onAnimationEnd={() => setFlash(null)} />}

        {/* ── Duplicate warning overlay ── */}
        {duplicateWarning && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(220,38,38,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }} className="shake">
            <AlertCircle size={48} color="white" />
            <div style={{ color: 'white', fontSize: '1.1rem', fontWeight: 700, textAlign: 'center' }}>DUPLICATE AWB</div>
            <div className="mono" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.3rem', fontWeight: 700 }}>{duplicateWarning}</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>Already scanned in this session</div>
          </div>
        )}

        {/* ═══ IDLE / CONNECTING ═══ */}
        <div className={stepClass(STEPS.IDLE)}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: theme.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {connStatus === 'connecting' ? <RefreshCw size={28} color={theme.primary} style={{ animation: 'spin 1s linear infinite' }} /> : <WifiOff size={28} color={theme.error} />}
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>
                {connStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
              </div>
              <div style={{ fontSize: '0.82rem', color: theme.muted }}>{errorMsg || `Connecting to session ${pin}`}</div>
            </div>
            {connStatus === 'disconnected' && (
              <button className="btn btn-primary" onClick={() => window.location.reload()}>
                <RefreshCw size={16} /> Reconnect
              </button>
            )}
          </div>
        </div>

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
            <div className="home-header">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <button
                  onClick={() => navigate('/app/scan')}
                  style={{ background: 'white', border: '1px solid #E2E8F0', padding: '6px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}
                >
                  <ArrowLeft size={14} /> Go Back
                </button>
                <div className="home-logo-badge">
                  <Wifi size={11} color={connStatus === 'paired' && navigator.onLine ? '#10B981' : '#EF4444'} />
                  {pairedLabel}
                </div>
              </div>
              <div className="home-logo-row">
                <div className="home-logo-text">
                  <img src="/images/logo.png" alt="Sea Hawk Logo" style={{ height: 28, width: 'auto', objectFit: 'contain', padding: 2, background: 'white', borderRadius: 6, border: '1px solid #E2E8F0' }} />
                  <span>Seahawk Scanner</span>
                </div>
              </div>
              <div className="home-stats-row">
                <div className="home-stat-card">
                  <div className="home-stat-val">{sessionCtx.scanNumber}</div>
                  <div className="home-stat-label">Scanned</div>
                </div>
                <div className="home-stat-card">
                  <div className="home-stat-val">{totalWeight > 0 ? totalWeight.toFixed(1) : '0'}</div>
                  <div className="home-stat-label">Total kg</div>
                </div>
                <div className="home-stat-card">
                  <div className="home-stat-val">{sessionDuration}</div>
                  <div className="home-stat-label">Session</div>
                </div>
              </div>
            </div>

            <div className="home-scan-section">
              <div className="home-scan-btn-wrap">
                <div className="home-scan-ring" />
                <div className="home-scan-ring home-scan-ring2" />
                <button className="home-scan-btn" onClick={handleStartScanning}>
                  <Camera size={34} color="white" />
                  <span className="home-scan-btn-label">Scan</span>
                </button>
              </div>
              <div className="home-cta-text">
                {sessionCtx.scanNumber === 0 ? 'Tap to start your first scan' : 'Tap to scan next parcel'}
              </div>

              <div className="action-buttons-row">
                <button className="action-btn" onClick={saveAndUpload}>
                  <CloudUpload size={14} /> {offlineQueue.length > 0 ? `Upload (${offlineQueue.length})` : 'Synced'}
                </button>
                <button className="action-btn danger" onClick={terminateSession}>
                  <Trash2 size={14} /> End Session
                </button>
              </div>

              {offlineQueue.length > 0 && (
                <div style={{ marginTop: 14, fontSize: '0.7rem', color: theme.warning, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Clock size={12} /> {offlineQueue.length} offline scan{offlineQueue.length > 1 ? 's' : ''} pending sync
                </div>
              )}
            </div>

            <div className="home-queue-section">
              <div className="home-queue-head">
                <div className="home-queue-title-text">
                  <List size={11} />
                  Accepted Consignments
                </div>
                {sessionCtx.scannedItems.length > 0 && (
                  <div className="home-queue-badge">{sessionCtx.scannedItems.length}</div>
                )}
              </div>
              <div className="home-queue-list">
                {sessionCtx.scannedItems.length === 0 ? (
                  <div className="queue-empty">
                    <Package size={36} color="rgba(255,255,255,0.12)" />
                    <div className="queue-empty-text">No consignments scanned yet.<br />Tap the button above to begin.</div>
                  </div>
                ) : (
                  sessionCtx.scannedItems.map((item, idx) => (
                    <div key={`${item.awb}-${idx}`} className="queue-item">
                      <div className="queue-check">
                        <Check size={13} color="#10B981" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="queue-awb">{item.awb}</div>
                        <div className="queue-meta">
                          {item.clientCode === 'OFFLINE'
                            ? <span className="queue-offline-tag">Offline</span>
                            : item.clientCode && <span className="queue-client-tag">{item.clientCode}</span>}
                          {item.destination && <span>{item.destination}</span>}
                        </div>
                      </div>
                      {item.weight > 0 && <div className="queue-weight">{item.weight}kg</div>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ SCANNING ═══ */}
        <div className={stepClass(STEPS.SCANNING)}>
          <div className="cam-viewport" style={{ background: 'transparent' }}>
            <div id="scanbot-camera-container" style={{ position: 'absolute', inset: 0, display: scanbotRef.current ? 'block' : 'none' }} />
            <div className="cam-overlay">
              {/* Wide landscape strip — matches how Trackon/DTDC barcodes are oriented */}
              <div
                className="scan-guide"
                style={{
                  width: BARCODE_SCAN_REGION.w,
                  height: BARCODE_SCAN_REGION.h,
                  borderRadius: 10,
                  maxHeight: '20vw',
                }}
              >
                <div className="scan-guide-corner corner-tl" />
                <div className="scan-guide-corner corner-tr" />
                <div className="scan-guide-corner corner-bl" />
                <div className="scan-guide-corner corner-br" />
                <div className="scan-laser" />
              </div>
            </div>
            <div className="cam-hud">
              <div className="cam-hud-chip">
                <Wifi size={12} /> {pin}
              </div>
              <div className="cam-hud-chip" style={{ gap: 4 }}>
                <Package size={12} /> {sessionCtx.scanNumber}
                {typeof window !== 'undefined' && typeof window.BarcodeDetector !== 'undefined'
                  ? <span style={{ color: '#34D399', fontSize: '0.6rem', fontWeight: 800 }}>⚡ NATIVE</span>
                  : <span style={{ color: '#F59E0B', fontSize: '0.6rem', fontWeight: 800 }}>ZXING</span>
                }
              </div>
            </div>
            <div className="cam-bottom">
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.82rem', fontWeight: 600, textAlign: 'center' }}>
                Align barcode inside the strip
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
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
                <div className="mono" style={{ fontSize: '1.4rem', fontWeight: 700, color: '#34D399' }}>{lockedAwb}</div>
                <div style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.8rem' }}>Barcode locked · Preparing camera…</div>
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
                <ScanLine size={12} /> {lockedAwb}
              </div>
              {offlineQueue.length > 0 && (
                <div className="cam-hud-chip">
                  <Clock size={12} /> {offlineQueue.length} queued
                </div>
              )}
            </div>
            <div className="cam-bottom">
              <div style={{ color: docDetected ? 'rgba(16,185,129,0.95)' : 'rgba(255,255,255,0.85)', fontSize: '0.82rem', fontWeight: 600, textAlign: 'center', transition: 'color 0.3s' }}>
                {docDetected ? '✓ AWB in frame — press shutter' : 'Fit the AWB slip inside the frame'}
              </div>
              <button
                className="capture-btn"
                onClick={handleCapturePhoto}
                disabled={!captureCameraReady}
                style={{ opacity: captureCameraReady ? 1 : 0.4 }}
              >
                <div className="capture-btn-inner" />
              </button>
              <button
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', fontSize: '0.72rem', padding: '6px 16px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
                onClick={() => { setLockedAwb(''); scanBusyRef.current = false; goStep(STEPS.SCANNING); }}
              >
                ← Rescan barcode
              </button>
            </div>
          </div>
        </div>

        {/* ═══ PREVIEW ═══ */}
        <div className={stepClass(STEPS.PREVIEW)}>
          <div style={{ background: theme.bg, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${theme.border}` }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: theme.muted, fontWeight: 600 }}>CAPTURED</div>
                <div className="mono" style={{ fontSize: '1rem', fontWeight: 700 }}>{lockedAwb}</div>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              {capturedImage && <img src={capturedImage} alt="Captured label" className="preview-img" />}
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', gap: 12 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setCapturedImage(null); goStep(STEPS.CAPTURING); }}>
                <RotateCcw size={16} /> Retake
              </button>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={submitForProcessing}>
                <Send size={16} /> Use Photo
              </button>
            </div>
          </div>
        </div>

        {/* ═══ PROCESSING ═══ */}
        <div className={stepClass(STEPS.PROCESSING)}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 20, gap: 16 }}>
            <div style={{ textAlign: 'center', paddingTop: 24, paddingBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                <Brain size={22} color={theme.primary} style={{ animation: 'spin 2s linear infinite' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: theme.primary }}>Intelligence Engine</span>
              </div>
              <div className="mono" style={{ fontSize: '0.82rem', color: theme.muted }}>{lockedAwb}</div>
              <div style={{ fontSize: '0.72rem', color: theme.mutedLight, marginTop: 6 }}>
                Reading AWB label with Gemini Vision…
              </div>
            </div>
            {['Client', 'Consignee', 'Destination', 'Pincode', 'Weight', 'Order No'].map((label) => (
              <div key={label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div className="field-label">{label}</div>
                  <div className="skeleton" style={{ height: 18, width: `${60 + Math.random() * 30}%`, marginTop: 4 }} />
                </div>
                <div className="skeleton" style={{ width: 8, height: 8, borderRadius: '50%' }} />
              </div>
            ))}
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <button
                className="btn btn-outline"
                style={{ fontSize: '0.75rem', padding: '8px 20px' }}
                onClick={() => { setErrorMsg('Cancelled by user.'); goStep(STEPS.ERROR); }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        {/* ═══ REVIEWING ═══ */}
        <div className={stepClass(STEPS.REVIEWING)}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: theme.muted, fontWeight: 600 }}>REVIEW EXTRACTION</div>
                <div className="mono" style={{ fontSize: '0.95rem', fontWeight: 700 }}>{reviewData?.awb || lockedAwb}</div>
              </div>
              {intelligence?.learnedFieldCount > 0 && (
                <div className="source-badge source-learned">🧠 {intelligence.learnedFieldCount} auto-corrected</div>
              )}
            </div>
            <div className="scroll-panel" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Client */}
              <div className={`field-card ${(fieldConfidence.clientCode?.confidence || 0) < 0.55 ? 'warning' : ''}`}>
                <div className={confDotClass(fieldConfidence.clientCode?.confidence || 0)} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span className="field-label" style={{ margin: 0 }}>Client</span>
                    {fieldConfidence.clientCode?.source && (() => { const s = sourceLabel(fieldConfidence.clientCode.source); return s ? <span className={s.className}>{s.icon} {s.text}</span> : null; })()}
                  </div>
                  <input className="field-input" value={reviewForm.clientCode || ''} onChange={e => setReviewForm(f => ({ ...f, clientCode: e.target.value.toUpperCase() }))} placeholder="Client code" />
                  {intelligence?.clientMatches?.length > 0 && intelligence.clientNeedsConfirmation && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                      {intelligence.clientMatches.slice(0, 3).map(m => (
                        <button key={m.code} onClick={() => setReviewForm(f => ({ ...f, clientCode: m.code }))} style={{ fontSize: '0.65rem', padding: '3px 8px', borderRadius: 6, border: `1px solid ${theme.border}`, background: reviewForm.clientCode === m.code ? theme.primaryLight : theme.surface, color: theme.text, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
                          {m.code} ({Math.round(m.score * 100)}%)
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Consignee */}
              <div className="field-card">
                <div className={confDotClass(fieldConfidence.consignee?.confidence || 0)} />
                <div style={{ flex: 1 }}>
                  <div className="field-label">Consignee</div>
                  <input className="field-input" value={reviewForm.consignee || ''} onChange={e => setReviewForm(f => ({ ...f, consignee: e.target.value.toUpperCase() }))} placeholder="Recipient name" />
                </div>
              </div>

              {/* Destination */}
              <div className="field-card">
                <div className={confDotClass(fieldConfidence.destination?.confidence || 0)} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span className="field-label" style={{ margin: 0 }}>Destination</span>
                    {fieldConfidence.destination?.source && (() => { const s = sourceLabel(fieldConfidence.destination.source); return s ? <span className={s.className}>{s.icon} {s.text}</span> : null; })()}
                  </div>
                  <input className="field-input" value={reviewForm.destination || ''} onChange={e => setReviewForm(f => ({ ...f, destination: e.target.value.toUpperCase() }))} placeholder="City" />
                  {intelligence?.pincodeCity && intelligence.pincodeCity !== reviewForm.destination && (
                    <button onClick={() => setReviewForm(f => ({ ...f, destination: intelligence.pincodeCity }))} style={{ fontSize: '0.62rem', marginTop: 4, padding: '2px 8px', borderRadius: 6, border: 'none', background: theme.successLight, color: theme.success, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                      📍 Pincode suggests: {intelligence.pincodeCity}
                    </button>
                  )}
                </div>
              </div>

              {/* Pincode + Weight row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="field-card">
                  <div style={{ flex: 1 }}>
                    <div className="field-label">Pincode</div>
                    <input className="field-input" value={reviewForm.pincode || ''} onChange={(e) => setReviewForm(f => ({ ...f, pincode: e.target.value }))} placeholder="6 digits" maxLength={6} inputMode="numeric" />
                  </div>
                </div>
                <div className={`field-card ${intelligence?.weightAnomaly?.anomaly ? 'warning' : ''}`}>
                  <div style={{ flex: 1 }}>
                    <div className="field-label">Weight (kg)</div>
                    <input className="field-input" value={reviewForm.weight || ''} onChange={(e) => setReviewForm(f => ({ ...f, weight: e.target.value }))} placeholder="0.0" inputMode="decimal" />
                    {intelligence?.weightAnomaly?.anomaly && (
                      <div style={{ fontSize: '0.6rem', color: theme.warning, marginTop: 2, fontWeight: 500 }}>⚠️ {intelligence.weightAnomaly.warning}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Amount + Order No */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="field-card">
                  <div style={{ flex: 1 }}>
                    <div className="field-label">Amount (₹)</div>
                    <input className="field-input" value={reviewForm.amount || ''} onChange={(e) => setReviewForm(f => ({ ...f, amount: e.target.value }))} placeholder="0" inputMode="decimal" />
                  </div>
                </div>
                <div className="field-card">
                  <div style={{ flex: 1 }}>
                    <div className="field-label">Order No</div>
                    <input className="field-input" value={reviewForm.orderNo || ''} onChange={(e) => setReviewForm(f => ({ ...f, orderNo: e.target.value }))} placeholder="Optional" />
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ padding: '12px 20px', borderTop: `1px solid ${theme.border}`, display: 'flex', gap: 10 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={resetForNextScan}>
                <X size={16} /> Skip
              </button>
              <button className="btn btn-success btn-lg" style={{ flex: 2 }} onClick={submitApproval} disabled={step === STEPS.APPROVING}>
                {step === STEPS.APPROVING ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} />}
                {step === STEPS.APPROVING ? 'Saving...' : 'Approve & Save'}
              </button>
            </div>
          </div>
        </div>

        {/* ═══ APPROVING (transparent) ═══ */}
        <div className={stepClass(STEPS.APPROVING)} />

        {/* ═══ SUCCESS ═══ */}
        <div className={stepClass(STEPS.SUCCESS)}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 20 }}>
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" fill="none" stroke={theme.success} strokeWidth="3" className="success-check-circle" />
              <polyline points="24,42 35,53 56,30" fill="none" stroke={theme.success} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="success-check-mark" />
            </svg>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: theme.success, marginBottom: 4 }}>Saved Successfully</div>
              <div className="mono" style={{ fontSize: '1.2rem', fontWeight: 700 }}>{lastSuccess?.awb}</div>
              {lastSuccess?.clientCode && (
                <div style={{ marginTop: 6, display: 'inline-block', padding: '4px 14px', borderRadius: 20, background: theme.primaryLight, color: theme.primary, fontSize: '0.78rem', fontWeight: 600 }}>
                  {lastSuccess.clientName || lastSuccess.clientCode}
                </div>
              )}
            </div>
            <div style={{ fontSize: '0.72rem', color: theme.muted }}>
              {lastSuccess?.offlineQueued
                ? `${offlineQueue.length} queued for sync • Auto-continuing in 3s`
                : `#${sessionCtx.scanNumber} scanned • Auto-continuing in 3s`}
            </div>
            <button className="btn btn-primary btn-lg btn-full" onClick={resetForNextScan} style={{ maxWidth: 320 }}>
              <Camera size={18} /> Scan Next Parcel
            </button>
          </div>
        </div>

        {/* ═══ ERROR ═══ */}
        <div className={stepClass(STEPS.ERROR)}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 20 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: theme.errorLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={32} color={theme.error} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: theme.error }}>Scan Error</div>
              <div style={{ fontSize: '0.82rem', color: theme.muted, marginTop: 4 }}>{errorMsg}</div>
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
            Offline — Reconnecting... {offlineQueue.length ? `(${offlineQueue.length} queued)` : ''}
          </div>
        )}
      </div>

      {/* Global keyframes */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
