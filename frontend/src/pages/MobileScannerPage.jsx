import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../services/api';
import { cropRectForCoverVideo } from '../utils/videoCoverCrop.js';
import { normalizeBarcodeCandidate, rankBarcodeCandidates } from '../utils/barcode.js';
import { analyzeCaptureQuality, describeCaptureIssues } from '../utils/scannerQuality.js';
import { evaluateBarcodeStability, nextBarcodeFallbackState } from '../utils/scannerStateMachine.js';
import { createBarcodeScanner } from '../utils/barcodeEngine.js';
import {
  Camera, Check, AlertCircle, RotateCcw, Send, ChevronRight, Volume2, VolumeX,
  Wifi, WifiOff, Zap, Package, ScanLine, Shield, RefreshCw, X, Brain,
  BarChart3, History, Clock, CheckCircle2, List, ArrowLeft, Trash2, CloudUpload,
  CalendarDays
} from 'lucide-react';

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SOCKET_URL = import.meta.env.VITE_API_URL || window.location.origin;
const SCANBOT_LICENSE = import.meta.env.VITE_SCANBOT_LICENSE_KEY || '';
// Barcode strip: wide landscape rectangle â€” Trackon/DTDC barcodes are horizontal
const BARCODE_SCAN_REGION = { w: '90vw', h: '18vw' };  // aspect ~5:1, always landscape
// Document capture: tall portrait rectangle matching a real AWB slip shape
const DOC_CAPTURE_REGION  = { w: '92vw', h: '130vw' }; // ~A4 portrait proportion
const AUTO_NEXT_DELAY = 3500;
const FAST_AUTO_NEXT_DELAY = 900;
const FAST_SCAN_TIMEOUT_MS = 10000;
const LOOKUP_DECISION_TIMEOUT_MS = 12000;
const OFFLINE_QUEUE_KEY_PREFIX = 'mobile_scanner_offline_queue';
const WORKFLOW_MODE_KEY = 'mobile_scanner_workflow_mode';
const DEVICE_PROFILE_KEY = 'mobile_scanner_device_profile';
const LOCK_TO_CAPTURE_DELAY = 80; // fast transition after barcode lock
const BARCODE_STABILITY_WINDOW_MS = 500;
const BARCODE_STABILITY_HITS = 1;
const BARCODE_FAIL_THRESHOLD = 100;
const BARCODE_REFRAME_ATTEMPTS = 2;
const BARCODE_POLL_INTERVAL_MS = 45;
const DOC_STABLE_MIN_TICKS = 2;
const DOC_CAPTURE_MIN_INTERVAL_MS = 500;
const CAPTURE_MAX_WIDTH = 960;
const CAPTURE_JPEG_QUALITY = 0.68;
const SCAN_HINT_COOLDOWN_MS = 900;
const DEVICE_PROFILES = {
  phone: 'phone-camera',
  rugged: 'rugged-scanner',
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
const vibrate = (pattern) => {
  try { navigator?.vibrate?.(pattern); } catch {}
};

const HAPTIC_PATTERN = {
  tap: [20],
  lock: [400, 50, 200, 50, 100], // Extremely heavy mechanical jolt sequence
  success: [18, 28, 72],
  warning: [70, 50, 70],
  retry: [28, 40, 28],
  error: [110, 55, 110],
  duplicate: [90, 50, 90, 50, 90],
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
  } catch {}
};

const playSuccessBeep = () => { playTone(880, 0.12); setTimeout(() => playTone(1100, 0.10), 130); };
const playHardwareBeep = () => { 
  playTone(2700, 0.08, 'square'); 
  setTimeout(() => playTone(3100, 0.05, 'square'), 60); 
}; // Ultra-sharp piercing Zebra-style double chirp
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

/* â”€â”€ Monospace for AWB â”€â”€ */
.mono { font-family: 'JetBrains Mono', 'SF Mono', monospace; letter-spacing: -0.02em; }

/* â”€â”€ Step wrapper (full-screen transitions) â”€â”€ */
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

/* â”€â”€ Camera viewport â”€â”€ */
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

/* â”€â”€ Scan guide rectangle â”€â”€ */
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

/* â”€â”€ Scan laser â”€â”€ */
@keyframes laserSparkMove {
  0% { left: 2%; transform: translateX(-50%) scale(1); opacity: 0.8; }
  25% { box-shadow: 0 0 15px 4px #fff, 0 0 30px 10px #ff0000; opacity: 1; }
  50% { left: 50%; transform: translateX(-50%) scale(1.8); box-shadow: 0 0 25px 6px #fff, 0 0 45px 15px #ff0000; opacity: 1; }
  75% { box-shadow: 0 0 15px 4px #fff, 0 0 30px 10px #ff0000; opacity: 1; }
  100% { left: 98%; transform: translateX(-50%) scale(1); opacity: 0.8; }
}
@keyframes sparkScatter {
  0% { transform: scale(1.5) translate(0, 0) rotate(0deg); opacity: 1; }
  100% { transform: scale(0) translate(15px, -20px) rotate(90deg); opacity: 0; }
}
@keyframes sparkScatterReverse {
  0% { transform: scale(1.5) translate(0, 0) rotate(0deg); opacity: 1; }
  100% { transform: scale(0) translate(-15px, 20px) rotate(-90deg); opacity: 0; }
}
@keyframes laserPulse {
  0%, 100% { opacity: 0.5; box-shadow: 0 0 4px rgba(255, 0, 0, 0.8), 0 0 8px rgba(255, 0, 0, 0.4); }
  50% { opacity: 1; box-shadow: 0 0 8px rgba(255, 0, 0, 1), 0 0 20px rgba(255, 0, 0, 0.8); }
}
.scan-laser {
  position: absolute; left: 2%; right: 2%; height: 2px;
  top: 50%; transform: translateY(-50%);
  background: rgba(255, 0, 0, 0.95);
  animation: laserPulse 1.5s ease-in-out infinite;
}
.scan-laser-spark {
  position: absolute; top: 50%; margin-top: -3px;
  width: 6px; height: 6px; border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 0 12px 3px #ffffff, 0 0 25px 8px #ff0000;
  animation: laserSparkMove 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite alternate;
}
.scan-laser-spark::before, .scan-laser-spark::after {
  content: ''; position: absolute;
  width: 3px; height: 3px; background: #fff; border-radius: 50%;
  box-shadow: 0 0 5px #ff0000, 0 0 10px #ff0000;
}
.scan-laser-spark::before {
  left: -8px; top: -6px;
  animation: sparkScatter 0.6s infinite ease-out;
}
.scan-laser-spark::after {
  right: -8px; top: 6px;
  animation: sparkScatterReverse 0.7s infinite alternate ease-out;
  animation-delay: 0.15s;
}

/* â”€â”€ HUD (top bar on camera) â”€â”€ */
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

/* â”€â”€ Bottom bar on camera â”€â”€ */
.cam-bottom {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 20px;
  background: linear-gradient(to top, rgba(0,0,0,0.65), transparent);
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  z-index: 3;
}

/* â”€â”€ Cards â”€â”€ */
.card {
  background: ${theme.surface}; border: 1px solid ${theme.border};
  border-radius: 16px; padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}

/* â”€â”€ Buttons â”€â”€ */
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

/* â”€â”€ Capture button (circular) â”€â”€ */
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

/* â”€â”€ Preview image â”€â”€ */
.preview-img {
  width: 100%; border-radius: 12px;
  object-fit: contain; max-height: 50vh;
  background: #F1F5F9;
}

/* â”€â”€ Field card in review â”€â”€ */
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

/* â”€â”€ Confidence dot â”€â”€ */
.conf-dot {
  width: 8px; height: 8px; border-radius: 50%;
  flex-shrink: 0; margin-top: 4px;
}
.conf-high { background: ${theme.success}; }
.conf-med { background: ${theme.warning}; }
.conf-low { background: ${theme.error}; }

/* â”€â”€ Source badge â”€â”€ */
.source-badge {
  font-size: 0.6rem; padding: 2px 6px; border-radius: 6px;
  font-weight: 600; display: inline-flex; align-items: center; gap: 3px;
}
.source-learned { background: #F5F3FF; color: #7C3AED; }
.source-ai { background: ${theme.primaryLight}; color: ${theme.primary}; }
.source-history { background: ${theme.warningLight}; color: ${theme.warning}; }
.source-pincode { background: ${theme.successLight}; color: ${theme.success}; }

/* â”€â”€ Shimmer skeleton â”€â”€ */
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

/* â”€â”€ Success checkmark â”€â”€ */
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

/* â”€â”€ Flash overlay â”€â”€ */
@keyframes flash { 0% { opacity: 0.8; } 100% { opacity: 0; } }
.flash-overlay {
  position: fixed; inset: 0; z-index: 50;
  pointer-events: none;
  animation: flash 0.3s ease-out forwards;
}
.flash-white { background: white; }
.flash-success { background: rgba(5,150,105,0.2); }
.flash-error { background: rgba(220,38,38,0.2); }

/* â”€â”€ Duplicate warning â”€â”€ */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-6px); }
  40%, 80% { transform: translateX(6px); }
}
.shake { animation: shake 0.5s ease-in-out; }

/* â”€â”€ Offline banner â”€â”€ */
.offline-banner {
  background: ${theme.warningLight}; color: ${theme.warning};
  text-align: center; padding: 6px; font-size: 0.72rem; font-weight: 600;
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 99;
}

/* â”€â”€ Scrollable panel â”€â”€ */
.scroll-panel {
  flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;
  padding: 16px 20px;
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   HOME SCREEN (aligned with direct mobile scanner)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
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
.home-date-chip {
  display: flex; align-items: center; gap: 6px;
  background: linear-gradient(135deg, #1E293B, #334155);
  border: 1px solid #475569; border-radius: 12px;
  padding: 10px 14px; margin-bottom: 12px;
  cursor: pointer; position: relative;
  transition: all 0.2s ease;
}
.home-date-chip:active { transform: scale(0.97); }
.home-date-label {
  font-size: 0.68rem; font-weight: 500; color: #94A3B8;
  text-transform: uppercase; letter-spacing: 0.5px;
}
.home-date-value {
  font-size: 1rem; font-weight: 700; color: #F8FAFC;
  line-height: 1.2;
}
.home-date-change {
  font-size: 0.65rem; font-weight: 500; color: #38BDF8;
  margin-left: auto;
}
.home-date-chip input[type="date"] {
  position: absolute; inset: 0; opacity: 0;
  width: 100%; height: 100%; cursor: pointer;
  -webkit-appearance: none;
}
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

// â”€â”€â”€ Confidence helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  if (source === 'fuzzy_match') return { className: 'source-badge source-ai', icon: 'ðŸ”', text: 'Matched' };
  if (source === 'fuzzy_history' || source === 'consignee_pattern') return { className: 'source-badge source-history', icon: 'ðŸ“Š', text: 'History' };
  if (source === 'delhivery_pincode' || source === 'india_post' || source === 'pincode_lookup' || source === 'indiapost_lookup') return { className: 'source-badge source-pincode', icon: 'ðŸ“', text: 'Pincode' };
  return null;
};

const fmtDuration = (ms) => {
  const m = Math.floor(ms / 60000);
  return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// Component
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
export default function MobileScannerPage({ standalone = false }) {
  const { pin } = useParams();
  const navigate = useNavigate();
  const isStandalone = Boolean(standalone);
  const offlineQueueKey = `${OFFLINE_QUEUE_KEY_PREFIX}:${isStandalone ? 'direct' : (pin || 'unknown')}`;
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

  // â”€â”€ Connection â”€â”€
  const [socket, setSocket] = useState(null);
  const [connStatus, setConnStatus] = useState('connecting'); // connecting | paired | disconnected
  const [errorMsg, setErrorMsg] = useState('');

  // â”€â”€ State machine â”€â”€
  const [step, setStep] = useState(STEPS.IDLE);

  // â”€â”€ Scan data â”€â”€
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
    } catch {}
    return isE2eMock ? 'ocr' : 'fast';
  });
  const [deviceProfile, setDeviceProfile] = useState(() => {
    if (typeof window === 'undefined') return DEVICE_PROFILES.phone;
    try {
      const saved = localStorage.getItem(DEVICE_PROFILE_KEY);
      if (saved === DEVICE_PROFILES.phone || saved === DEVICE_PROFILES.rugged) return saved;
    } catch {}
    return DEVICE_PROFILES.phone;
  });
  // Counts consecutive frames where no barcode was found. Reset to 0 on any
  // successful detection. When it reaches BARCODE_FAIL_THRESHOLD the scanner
  // auto-switches to document mode and vibrates.
  const barcodeFailCountRef = useRef(0);

  // â”€â”€ Session context â”€â”€
  const [sessionCtx, setSessionCtx] = useState({
    scannedAwbs: new Set(),
    clientFreq: {},
    scanNumber: 0,
    dominantClient: null,
    dominantClientCount: 0,
    startedAt: Date.now(),
    scannedItems: [],
  });

  // â”€â”€ Settings â”€â”€
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  // ── Session date (for batch scanning across dates) ──
  const [sessionDate, setSessionDate] = useState(() => {
    try {
      const saved = localStorage.getItem('seahawk_scanner_session_date');
      if (saved && /^\d{4}-\d{2}-\d{2}$/.test(saved)) return saved;
    } catch {}
    return new Date().toISOString().slice(0, 10);
  });

  // â”€â”€ Refs â”€â”€
  const videoRef = useRef(null);
  const guideRef = useRef(null);
  const scannerRef = useRef(null); // ZXing reader
  const scanbotRef = useRef(null); // Scanbot SDK
  const scanBusyRef = useRef(false);
  const autoNextTimer = useRef(null);
  const autoCaptureTriggeredRef = useRef(false);
  const currentStepRef = useRef(STEPS.IDLE);
  const lockToCaptureTimerRef = useRef(null);
  const scannerStartedAtRef = useRef(0);
  // Stable ref to the latest handleBarcodeDetected callback.
  // startBarcodeScanner captures this ref (not the function directly) so the
  // scanner always calls the current version â€” fixes the stale-closure bug where
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

  const postStandaloneScanPayload = useCallback(async (payload) => {
    const scanMode = String(payload?.scanMode || '').toLowerCase();
    if (scanMode === 'fast_barcode_only') {
      await api.post('/shipments/scan', {
        awb: payload.awb,
        courier: 'AUTO',
        captureOnly: true,
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

  // â”€â”€ Step transition helper â”€â”€
  const addToQueue = useCallback((item) => {
    setSessionCtx((prev) => {
      const next = {
        ...prev,
        scannedItems: [{ ...item, time: Date.now() }, ...prev.scannedItems],
      };
      // Persist daily count to localStorage
      try { localStorage.setItem(TODAY_KEY, String(next.scanNumber)); } catch {}
      return next;
    });
  }, [TODAY_KEY]);

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
    submitLookupDecisionRef.current?.(awb);
  }, [manualAwb, connStatus, goStep, isE2eMock, isStandalone, scanWorkflowMode]);

  const terminateSession = useCallback(() => {
    if (!window.confirm(isStandalone ? 'Exit this scanner session on the phone?' : 'End this mobile scanner session on the phone?')) return;
    if (isStandalone) {
      navigate('/app/scan');
      return;
    }
    if (socket?.connected) {
      socket.emit('scanner:end-session', { reason: 'Mobile ended the session' });
    } else {
      navigate('/');
    }
  }, [socket, navigate, isStandalone]);

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

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // SOCKET CONNECTION
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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
      navigate('/');
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
        handleLookupNeedsPhoto(data);
        return;
      }

      applyProcessedScanResult(data);
    });

    // Desktop approved our mobile-submitted approval
    s.on('scanner:approval-result', ({ success, message, awb }) => {
      if (success) {
        playSuccessBeep();
        pulseHaptic('success');
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
        pulseHaptic('error');
        setErrorMsg(message || 'Approval failed.');
      }
    });

    s.on('scanner:ready-for-next', () => {
      // Desktop is ready; keep current mobile state.
    });

    setSocket(s);
    return () => { s.disconnect(); };
  }, [pin, addToQueue, reviewData, reviewForm, goStep, navigate, isE2eMock, isStandalone, applyProcessedScanResult, handleLookupNeedsPhoto]);

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
    try {
      localStorage.setItem(WORKFLOW_MODE_KEY, scanWorkflowMode);
    } catch {}
  }, [scanWorkflowMode]);

  useEffect(() => {
    try {
      localStorage.setItem(DEVICE_PROFILE_KEY, deviceProfile);
    } catch {}
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

  const stopBarcodeScanner = useCallback(async () => {
    try {
      setScannerEngine('idle');
      // Stop WASM barcode engine
      if (barcodeEngineRef.current) { barcodeEngineRef.current.stop(); }
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

    // Duplicate detection â€” read from the stable ref so this check is never stale
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

    // Update session â€” also keep scannedAwbsRef in sync for future duplicate checks.
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

    submitLookupDecisionRef.current?.(awb);
  }, [isStableBarcodeRead, scanWorkflowMode, isE2eMock, syncBarcodeFailCount, syncBarcodeReframeCount, showScanHint, handleBarcodeFallbackAttempt]); // sessionCtx removed from deps â€” duplicate check now uses scannedAwbsRef

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
      // When leaving SCANNING, stop only the barcode reader â€” keep the video stream
      // alive so CAPTURING can reuse it instantly with no black-frame flicker.
      if (step === STEPS.SCANNING) stopBarcodeScanner();
    };
  }, [step, startBarcodeScanner, stopBarcodeScanner, syncBarcodeFailCount, syncBarcodeReframeCount, isE2eMock, mockBarcodeRaw]);

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // PHOTO CAPTURE (Document mode)
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

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

  // Auto-capture is intentionally disabled â€” user presses the shutter button manually.

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // SEND TO DESKTOP (OCR Pipeline)
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  const buildSessionContextPayload = useCallback(() => ({
    scanNumber: sessionCtx.scanNumber,
    recentClient: sessionCtx.dominantClient,
    dominantClient: sessionCtx.dominantClient,
    dominantClientCount: sessionCtx.dominantClientCount,
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
  }), [sessionCtx, sessionDate, scanWorkflowMode, scanMode, deviceProfile, captureQuality, captureMeta]);

  const handleLookupNeedsPhoto = useCallback((data = null) => {
    if (data) setReviewData(data);
    setProcessingFields({});
    setErrorMsg('');
    goStep(STEPS.CAPTURING);
  }, [goStep]);

  const applyProcessedScanResult = useCallback((data) => {
    if (!data) return;
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
      return;
    }

    playSuccessBeep();
    pulseHaptic('success');
    if (voiceEnabled) speak(`Auto approved. ${data.clientName || ''}. ${data.destination || ''}.`);
    const item = {
      awb: data.awb,
      clientCode: data.clientCode,
      clientName: data.clientName,
      destination: data.destination || '',
      weight: data.weight || 0,
      autoApproved: true,
    };
    setLastSuccess(item);
    addToQueue(item);
    goStep(STEPS.SUCCESS);
  }, [addToQueue, goStep, voiceEnabled]);

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
        const item = { awb: cleanAwb, clientCode: 'OFFLINE', clientName: 'Queued Offline', destination: '', weight: 0 };
        setLastSuccess({ ...item, offlineQueued: true });
        addToQueue(item);
        goStep(STEPS.SUCCESS);
        return;
      }

      try {
        const res = await api.post('/shipments/scan', { awb: cleanAwb, courier: 'AUTO', captureOnly: true });
        const shipment = res?.data?.shipment || {};
        const item = {
          awb: shipment.awb || cleanAwb,
          clientCode: shipment.clientCode || 'MISC',
          clientName: shipment.client?.company || shipment.clientCode || 'Scanned',
          destination: shipment.destination || '',
          weight: shipment.weight || 0,
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
      const item = { awb: cleanAwb, clientCode: 'OFFLINE', clientName: 'Queued Offline', destination: '', weight: 0 };
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
  }, [socket, connStatus, goStep, isE2eMock, enqueueOfflineScan, addToQueue, buildSessionContextPayload, isStandalone]);

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
        const item = { awb: lockedAwb || 'PENDING_OCR', clientCode: 'OFFLINE', clientName: 'Queued Offline', destination: '', weight: 0 };
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
      const item = { awb: lockedAwb || 'PENDING_OCR', clientCode: 'OFFLINE', clientName: 'Queued Offline', destination: '', weight: 0 };
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
  }, [socket, lockedAwb, capturedImage, goStep, connStatus, enqueueOfflineScan, addToQueue, isE2eMock, buildSessionContextPayload, isStandalone, applyProcessedScanResult, handleLookupNeedsPhoto]);

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // APPROVAL
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  const submitApproval = useCallback(async () => {
    if (!reviewData) return;
    goStep(STEPS.APPROVING);
    let approvalAccepted = !isStandalone;
    if (isE2eMock) {
      setTimeout(() => {
        const item = {
          awb: reviewData.awb || lockedAwb,
          clientCode: reviewForm.clientCode || 'MOCKCL',
          clientName: reviewData.clientName || reviewForm.clientCode || 'Mock Client',
          destination: reviewForm.destination || '',
          weight: parseFloat(reviewForm.weight) || 0,
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
    };

    if (isStandalone) {
      try {
        if (reviewData.ocrExtracted || reviewData) {
          await api.post('/shipments/learn-corrections', { ocrFields, approvedFields });
        }
        if (reviewData.shipmentId) {
          await api.put(`/shipments/${reviewData.shipmentId}`, fields);
        } else {
          await api.post('/shipments', { awb: reviewData.awb || lockedAwb, ...fields });
        }

        playSuccessBeep();
        pulseHaptic('success');
        setFlash('success');
        const item = {
          awb: reviewData?.awb || lockedAwb,
          clientCode: reviewForm.clientCode,
          clientName: reviewData?.clientName || reviewForm.clientCode,
          destination: reviewForm.destination || '',
          weight: parseFloat(reviewForm.weight) || 0,
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
          goStep(STEPS.REVIEWING);
          playErrorBeep();
          pulseHaptic('error');
          setErrorMsg(response?.message || 'Approval failed.');
        }
      });
    }

    // Update session client frequency
    if (approvalAccepted && reviewForm.clientCode && reviewForm.clientCode !== 'MISC') {
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
  }, [socket, reviewData, reviewForm, lockedAwb, pin, goStep, addToQueue, isE2eMock, deviceProfile, isStandalone]);

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // RESET / NEXT SCAN
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  const resetForNextScan = useCallback((nextStep = STEPS.IDLE) => {
    clearTimeout(autoNextTimer.current);
    clearTimeout(lockToCaptureTimerRef.current);
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
    // scannedAwbsRef is intentionally NOT cleared here â€” duplicates should be
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
  }, [stopCamera]);

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // RENDER
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  const isStepActive = (s) => step === s;
  const stepClass = (s) => `msp-step ${step === s ? 'active' : ''}`;
  const successAutoDelayMs = scanWorkflowMode === 'fast' ? FAST_AUTO_NEXT_DELAY : AUTO_NEXT_DELAY;
  const successAutoSeconds = Math.max(1, Math.round(successAutoDelayMs / 1000));
  const captureQualityHint = captureQuality.ok
    ? 'AWB quality looks good - press shutter'
    : (describeCaptureIssues(captureQuality.issues) || 'Fit AWB slip fully in frame and hold steady');
  const captureReadyForShutter = captureCameraReady && captureQuality.ok && docStableTicks >= DOC_STABLE_MIN_TICKS;

  // â”€â”€ Confidence data from reviewData â”€â”€
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
      <style>{css}</style>
      <div className="msp-root">
        {/* â”€â”€ Flash overlay â”€â”€ */}
        {flash && <div className={`flash-overlay flash-${flash}`} onAnimationEnd={() => setFlash(null)} />}

        {/* â”€â”€ Duplicate warning overlay â”€â”€ */}
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

        {/* â•â•â• IDLE / CONNECTING â•â•â• */}
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

        {/* â•â•â• PERSISTENT CAMERA VIDEO â•â•â• */}
        {/* Lives outside all step divs so it NEVER gets unmounted/re-mounted.
            Both SCANNING and CAPTURING phases share this same element via videoRef.
            This is what eliminates the black-screen flicker between steps.
            Hidden when Scanbot is active because Scanbot renders into its own
            container and owns its own camera stream â€” showing this element at
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

        {/* â•â•â• IDLE / HOME â•â•â• */}
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

              {/* Session Date Selector */}
              <div className="home-date-chip">
                <CalendarDays size={18} color="#38BDF8" />
                <div>
                  <div className="home-date-label">Scan Date</div>
                  <div className="home-date-value">
                    {new Date(sessionDate + 'T00:00:00').toLocaleDateString('en-IN', {
                      day: '2-digit', month: 'short', year: 'numeric'
                    })}
                    {sessionDate === new Date().toISOString().slice(0, 10) && (
                      <span style={{ fontSize: '0.65rem', color: '#10B981', marginLeft: 6, fontWeight: 500 }}>TODAY</span>
                    )}
                  </div>
                </div>
                <div className="home-date-change">Change ▸</div>
                <input
                  type="date"
                  value={sessionDate}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
                      setSessionDate(val);
                      try { localStorage.setItem('seahawk_scanner_session_date', val); } catch {}
                      pulseHaptic('light');
                    }
                  }}
                />
              </div>

            </div>

            <div className="home-scan-section">
              <div className="home-scan-btn-wrap">
                <div className="home-scan-ring" />
                <div className="home-scan-ring home-scan-ring2" />
                <button data-testid="start-scan-btn" className="home-scan-btn" onClick={handleStartScanning}>
                  <Camera size={34} color="white" />
                  <span className="home-scan-btn-label">Scan</span>
                </button>
              </div>
              <div className="home-cta-text">
                {sessionCtx.scanNumber === 0 ? 'Tap to start your first scan' : 'Tap to scan next parcel'}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 14, width: '100%', maxWidth: 320 }}>
                <button
                  type="button"
                  data-testid="workflow-fast-btn"
                  onClick={() => setScanWorkflowMode('fast')}
                  style={{
                    flex: 1,
                    borderRadius: 999,
                    border: `1px solid ${scanWorkflowMode === 'fast' ? theme.primary : theme.border}`,
                    background: scanWorkflowMode === 'fast' ? theme.primaryLight : theme.surface,
                    color: scanWorkflowMode === 'fast' ? theme.primary : theme.muted,
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    padding: '9px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                >
                  <Zap size={13} /> Fast scan
                </button>
                <button
                  type="button"
                  data-testid="workflow-ocr-btn"
                  onClick={() => setScanWorkflowMode('ocr')}
                  style={{
                    flex: 1,
                    borderRadius: 999,
                    border: `1px solid ${scanWorkflowMode === 'ocr' ? theme.primary : theme.border}`,
                    background: scanWorkflowMode === 'ocr' ? theme.primaryLight : theme.surface,
                    color: scanWorkflowMode === 'ocr' ? theme.primary : theme.muted,
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    padding: '9px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                >
                  <Brain size={13} /> OCR label
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8, width: '100%', maxWidth: 320 }}>
                <button
                  type="button"
                  data-testid="device-profile-phone-btn"
                  onClick={() => setDeviceProfile(DEVICE_PROFILES.phone)}
                  style={{
                    flex: 1,
                    borderRadius: 999,
                    border: `1px solid ${deviceProfile === DEVICE_PROFILES.phone ? theme.primary : theme.border}`,
                    background: deviceProfile === DEVICE_PROFILES.phone ? theme.primaryLight : theme.surface,
                    color: deviceProfile === DEVICE_PROFILES.phone ? theme.primary : theme.muted,
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                >
                  <Camera size={13} /> Phone lens
                </button>
                <button
                  type="button"
                  data-testid="device-profile-rugged-btn"
                  onClick={() => setDeviceProfile(DEVICE_PROFILES.rugged)}
                  style={{
                    flex: 1,
                    borderRadius: 999,
                    border: `1px solid ${deviceProfile === DEVICE_PROFILES.rugged ? theme.primary : theme.border}`,
                    background: deviceProfile === DEVICE_PROFILES.rugged ? theme.primaryLight : theme.surface,
                    color: deviceProfile === DEVICE_PROFILES.rugged ? theme.primary : theme.muted,
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                >
                  <Shield size={13} /> Rugged
                </button>
              </div>

              {/* Manual AWB Entry */}
              <form
                onSubmit={handleManualAwbSubmit}
                style={{ width: '100%', maxWidth: 300, marginTop: 20 }}
              >
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: theme.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, textAlign: 'center' }}>Can't scan? Enter AWB manually</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    data-testid="manual-awb-input"
                    value={manualAwb}
                    onChange={e => setManualAwb(e.target.value.toUpperCase())}
                    placeholder="e.g. 1234567890"
                    inputMode="text"
                    autoCapitalize="characters"
                    style={{
                      flex: 1, padding: '9px 12px', border: `1.5px solid ${theme.border}`,
                      borderRadius: 10, fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.82rem', fontWeight: 600, background: theme.surface,
                      color: theme.text, outline: 'none',
                    }}
                    onFocus={e => e.target.style.borderColor = theme.primary}
                    onBlur={e => e.target.style.borderColor = theme.border}
                  />
                  <button
                    type="submit"
                    data-testid="manual-awb-submit"
                    disabled={manualAwb.trim().length < 6}
                    className="btn btn-primary"
                    style={{ padding: '9px 14px', fontSize: '0.78rem', borderRadius: 10, opacity: manualAwb.trim().length >= 6 ? 1 : 0.45 }}
                  >
                    Go â†’
                  </button>
                </div>
              </form>

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

        {/* â•â•â• CAPTURING (Document mode) â•â•â• */}
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
                â† Rescan barcode
              </button>
            </div>
          </div>
        </div>

        {/* â•â•â• PREVIEW â•â•â• */}
        <div className={stepClass(STEPS.PREVIEW)}>
          <div style={{ background: theme.bg, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${theme.border}` }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: theme.muted, fontWeight: 600 }}>CAPTURED</div>
                <div className="mono" style={{ fontSize: '1rem', fontWeight: 700 }}>{lockedAwb || 'Printed AWB OCR'}</div>
                {captureMeta.kb > 0 && (
                  <div style={{ fontSize: '0.68rem', color: theme.mutedLight }}>
                    {captureMeta.kb}KB • {captureMeta.width}×{captureMeta.height}
                  </div>
                )}
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              {capturedImage && <img src={capturedImage} alt="Captured label" className="preview-img" />}
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', gap: 12 }}>
              <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setCapturedImage(null); goStep(STEPS.CAPTURING); }}>
                <RotateCcw size={16} /> Retake
              </button>
              <button data-testid="use-photo-btn" className="btn btn-primary" style={{ flex: 2 }} onClick={submitForProcessing}>
                <Send size={16} /> Use Photo
              </button>
            </div>
          </div>
        </div>

        {/* â•â•â• PROCESSING â•â•â• */}
        <div className={stepClass(STEPS.PROCESSING)}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 20, gap: 16 }}>
            <div style={{ textAlign: 'center', paddingTop: 24, paddingBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                <Brain size={22} color={theme.primary} style={{ animation: 'spin 2s linear infinite' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: theme.primary }}>Intelligence Engine</span>
              </div>
              <div className="mono" style={{ fontSize: '0.82rem', color: theme.muted }}>{lockedAwb}</div>
              <div style={{ fontSize: '0.72rem', color: theme.mutedLight, marginTop: 6 }}>
                {capturedImage ? 'Reading AWB label with local OCR...' : 'Saving barcode scan...'}
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

        {/* â•â•â• REVIEWING â•â•â• */}
        <div className={stepClass(STEPS.REVIEWING)}>
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '14px 20px', borderBottom: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.65rem', color: theme.muted, fontWeight: 600 }}>REVIEW EXTRACTION</div>
                <div className="mono" style={{ fontSize: '0.95rem', fontWeight: 700 }}>{reviewData?.awb || lockedAwb}</div>
              </div>
              {intelligence?.learnedFieldCount > 0 && (
                <div className="source-badge source-learned">AI {intelligence.learnedFieldCount} auto-corrected</div>
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
                      ðŸ“ Pincode suggests: {intelligence.pincodeCity}
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
                      <div style={{ fontSize: '0.6rem', color: theme.warning, marginTop: 2, fontWeight: 500 }}>Warning: {intelligence.weightAnomaly.warning}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Amount + Order No */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div className="field-card">
                  <div style={{ flex: 1 }}>
                    <div className="field-label">Amount (â‚¹)</div>
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
              <button data-testid="approve-save-btn" className="btn btn-success btn-lg" style={{ flex: 2 }} onClick={submitApproval} disabled={step === STEPS.APPROVING}>
                {step === STEPS.APPROVING ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} />}
                {step === STEPS.APPROVING ? 'Saving...' : 'Approve & Save'}
              </button>
            </div>
          </div>
        </div>

        {/* â•â•â• APPROVING (transparent) â•â•â• */}
        <div className={stepClass(STEPS.APPROVING)} />

        {/* â•â•â• SUCCESS â•â•â• */}
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
                ? `${offlineQueue.length} queued for sync - Auto-continuing in ${successAutoSeconds}s`
                : `#${sessionCtx.scanNumber} scanned - Auto-continuing in ${successAutoSeconds}s`}
            </div>
            <button
              data-testid="scan-next-btn"
              className="btn btn-primary btn-lg btn-full"
              onClick={() => resetForNextScan(scanWorkflowMode === 'fast' ? STEPS.SCANNING : STEPS.IDLE)}
              style={{ maxWidth: 320 }}
            >
              <Camera size={18} /> {scanWorkflowMode === 'fast' ? 'Keep Scanning' : 'Scan Next Parcel'}
            </button>
          </div>
        </div>

        {/* â•â•â• ERROR â•â•â• */}
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

        {/* â”€â”€ Offline banner â”€â”€ */}
        {connStatus === 'disconnected' && step !== STEPS.IDLE && (
          <div className="offline-banner">
            <WifiOff size={12} style={{ display: 'inline', verticalAlign: -2, marginRight: 4 }} />
            Offline â€” Reconnecting... {offlineQueue.length ? `(${offlineQueue.length} queued)` : ''}
          </div>
        )}
      </div>

      {/* Global keyframes */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
