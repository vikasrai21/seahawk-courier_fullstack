import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { cropRectForCoverVideo } from '../utils/videoCoverCrop.js';
import { normalizeBarcodeCandidate } from '../utils/barcode.js';
import {
  Camera, Check, AlertCircle, RotateCcw, Send, ChevronRight, Volume2, VolumeX,
  Wifi, WifiOff, Zap, Package, ScanLine, Shield, RefreshCw, X, Brain,
  BarChart3, History, Clock, CheckCircle2, List, ArrowLeft, Trash2, CloudUpload
} from 'lucide-react';

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const SOCKET_URL = import.meta.env.VITE_API_URL || window.location.origin;
const SCANBOT_LICENSE = import.meta.env.VITE_SCANBOT_LICENSE_KEY || '';
// Barcode strip: wide landscape rectangle â€” Trackon/DTDC barcodes are horizontal
const BARCODE_SCAN_REGION = { w: '90vw', h: '18vw' };  // aspect ~5:1, always landscape
// Document capture: tall portrait rectangle matching a real AWB slip shape
const DOC_CAPTURE_REGION  = { w: '92vw', h: '130vw' }; // ~A4 portrait proportion
const AUTO_NEXT_DELAY = 3500;
const OFFLINE_QUEUE_KEY_PREFIX = 'mobile_scanner_offline_queue';
const LOCK_TO_CAPTURE_DELAY = 80; // fast transition after barcode lock

// After this many consecutive frames with no barcode detected, auto-switch the
// scan region to document mode and vibrate to alert the operator.
// Keep this high enough to avoid premature fallback on slightly blurred frames.
const BARCODE_FAIL_THRESHOLD = 90;

// Native BarcodeDetector formats (supported on Chrome Android + iOS 17+)
const NATIVE_BARCODE_FORMATS = [
  'code_128', 'code_39', 'code_93', 'codabar',
  'ean_13', 'ean_8', 'itf', 'qr_code',
];
const PREFER_ZXING_FOR_TRACKON = true;

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
@keyframes laserScan {
  0%, 100% { top: 15%; } 50% { top: 82%; }
}
.scan-laser {
  position: absolute; left: 8%; right: 8%; height: 2px;
  background: linear-gradient(90deg, transparent, rgba(79,70,229,0.6), transparent);
  animation: laserScan 2.5s ease-in-out infinite;
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
  if (source === 'learned') return { className: 'source-badge source-learned', icon: 'ðŸ§ ', text: 'Learned' };
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
export default function MobileScannerPage() {
  const { pin } = useParams();
  const navigate = useNavigate();
  const offlineQueueKey = `${OFFLINE_QUEUE_KEY_PREFIX}:${pin || 'unknown'}`;
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
  const [captureCameraReady, setCaptureCameraReady] = useState(false);
  const [sessionDuration, setSessionDuration] = useState('0m');
  const [pairedLabel, setPairedLabel] = useState('Connected');
  const [manualAwb, setManualAwb] = useState('');
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [scannerEngine, setScannerEngine] = useState('idle');
  const [lastDetectionMeta, setLastDetectionMeta] = useState(null);
  const [barcodeFailCount, setBarcodeFailCount] = useState(0);

  // 'barcode' = narrow landscape strip, 'document' = full AWB slip portrait frame.
  // Auto-switches to 'document' after BARCODE_FAIL_THRESHOLD consecutive misses.
  const [scanMode, setScanMode] = useState('barcode');
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

  const goStep = useCallback((next) => {
    setStep(next);
  }, []);

  const syncBarcodeFailCount = useCallback((nextCount) => {
    barcodeFailCountRef.current = nextCount;
    setBarcodeFailCount(nextCount);
  }, []);

  const switchToDocumentMode = useCallback(() => {
    syncBarcodeFailCount(0);
    setScanMode('document');
    setErrorMsg('No barcode lock yet. Capture label instead or tap "Back to barcode mode" and hold steady.');
    vibrate([80, 60, 80]);
  }, [syncBarcodeFailCount]);

  const handleCaptureWithoutBarcode = useCallback(() => {
    setLockedAwb('');
    setErrorMsg('');
    goStep(STEPS.CAPTURING);
  }, [goStep]);

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

  const flushOfflineQueue = useCallback(() => {
    if (!socket || !socket.connected || !offlineQueue.length) return;
    offlineQueue.forEach((item) => {
      if (!item?.payload?.awb || !item?.payload?.imageBase64) return;
      socket.emit('scanner:scan', item.payload);
    });
    saveOfflineQueue([]);
  }, [socket, offlineQueue, saveOfflineQueue]);

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
      setErrorMsg('Phone is not connected to the desktop session.');
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
  }, [connStatus, ensureVideoStreamPlaying, goStep, isE2eMock]);

  const handleManualAwbSubmit = useCallback((e) => {
    e?.preventDefault();
    const awb = manualAwb.trim().toUpperCase();
    if (!awb || awb.length < 6) { setErrorMsg('Enter a valid AWB number (min 6 chars)'); return; }
    if (connStatus !== 'paired') { setErrorMsg('Not connected to desktop session.'); return; }
    setErrorMsg('');
    setManualAwb('');
    setLockedAwb(awb);
    if (isE2eMock) {
      setCaptureCameraReady(true);
      goStep(STEPS.CAPTURING);
      return;
    }
    // Same iOS gesture reliability: prime the camera stream immediately.
    ensureVideoStreamPlaying()
      .then(() => goStep(STEPS.CAPTURING))
      .catch((err) => setErrorMsg(err?.message || 'Camera access failed.'));
  }, [manualAwb, connStatus, ensureVideoStreamPlaying, goStep, isE2eMock]);

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
      // Desktop is ready â€” ensure we're in a state to scan again
    });

    setSocket(s);
    return () => { s.disconnect(); };
  }, [pin, addToQueue, reviewData, reviewForm, goStep, navigate, isE2eMock]);

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

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // CAMERA (Barcode Scanning)
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

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

  // Stops only the barcode scanner/reader â€” leaves the video stream running.
  // Use this when transitioning from SCANNING â†’ CAPTURING so there is no black-screen flicker.
  const stopBarcodeScanner = useCallback(async () => {
    try {
      setScannerEngine('idle');
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

      // â”€â”€ Path 1: Prefer ZXing for Trackon-style labels â”€â”€â”€â”€â”€â”€â”€â”€â”€
      // Real phones often report native ITF support but still miss Trackon labels.
      // ZXing is consistently better on these narrow 12-digit barcodes.
      if (PREFER_ZXING_FOR_TRACKON) {
        const [{ BrowserMultiFormatReader }, zxingCore] = await Promise.all([
          import('@zxing/browser'),
          import('@zxing/library'),
        ]);

        const hints = new Map([
          [zxingCore.DecodeHintType.POSSIBLE_FORMATS, [
            zxingCore.BarcodeFormat.CODE_128,  // Trackon, DTDC primary format
            zxingCore.BarcodeFormat.ITF,       // Trackon 12-digit numeric AWBs
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

        const reader = new BrowserMultiFormatReader(hints, 40);
        setScannerEngine('zxing');
        scannerRef.current = reader;

        reader.decodeFromVideoElement(videoRef.current, (result) => {
          if (scanBusyRef.current) return;
          if (result) {
            syncBarcodeFailCount(0); // reset on successful detection
            let format = 'unknown';
            try {
              format = String(result.getBarcodeFormat?.() || 'unknown');
            } catch {}
            setLastDetectionMeta({
              value: result.getText?.() || '',
              format,
              engine: 'zxing',
              at: Date.now(),
              sinceStartMs: scannerStartedAtRef.current ? Date.now() - scannerStartedAtRef.current : null,
            });
            handleBarcodeDetectedRef.current?.(result.getText());
          } else {
            // ZXing fires the callback with null on every failed frame
            const nextFailCount = barcodeFailCountRef.current + 1;
            syncBarcodeFailCount(nextFailCount);
            if (nextFailCount >= BARCODE_FAIL_THRESHOLD) {
              switchToDocumentMode();
            }
          }
        });
        return;
      }

      // â”€â”€ Path 2: Native BarcodeDetector fallback (Chrome Android, iOS 17+) â”€â”€â”€â”€â”€â”€â”€â”€â”€
      if (typeof window.BarcodeDetector !== 'undefined') {
        let useNative = true;

        let supportedFormats = NATIVE_BARCODE_FORMATS;
        try {
          const available = await window.BarcodeDetector.getSupportedFormats();
          supportedFormats = NATIVE_BARCODE_FORMATS.filter(f => available.includes(f));
          if (!supportedFormats.length) supportedFormats = NATIVE_BARCODE_FORMATS;
        } catch { /* use defaults */ }

        if (!supportedFormats.includes('itf')) {
          // This device's native detector can't read Trackon barcodes â€” use ZXing.
          console.log('[MobileScanner] Native BarcodeDetector lacks ITF â€” falling back to ZXing');
          useNative = false;
        }

      if (useNative) {
          setScannerEngine('native');
          const detector = new window.BarcodeDetector({ formats: supportedFormats });
          let timerId = null;
          let stopped = false;

          const tick = async () => {
            if (stopped) return;
            if (scanBusyRef.current || currentStepRef.current !== STEPS.SCANNING) return;
            const video = videoRef.current;
            if (!video || video.readyState < 2) {
              timerId = setTimeout(tick, 60);
              return;
            }
            try {
              const barcodes = await detector.detect(video);
              if (barcodes.length > 0 && barcodes[0].rawValue) {
                syncBarcodeFailCount(0); // reset on successful detection
                setLastDetectionMeta({
                  value: barcodes[0].rawValue,
                  format: String(barcodes[0].format || 'unknown'),
                  engine: 'native',
                  at: Date.now(),
                  sinceStartMs: scannerStartedAtRef.current ? Date.now() - scannerStartedAtRef.current : null,
                });
                handleBarcodeDetectedRef.current?.(barcodes[0].rawValue);
              } else {
                // No barcode in this frame — count consecutive misses
                const nextFailCount = barcodeFailCountRef.current + 1;
                syncBarcodeFailCount(nextFailCount);
                if (nextFailCount >= BARCODE_FAIL_THRESHOLD) {
                  switchToDocumentMode();
                }
              }
            } catch { /* frame not ready */ }
            // ~50-70ms between frames keeps CPU reasonable while still fast enough.
            if (currentStepRef.current === STEPS.SCANNING) {
              timerId = setTimeout(tick, 60);
            }
          };

          scannerRef.current = {
            _type: 'native',
            reset: () => {
              stopped = true;
              if (timerId) clearTimeout(timerId);
              timerId = null;
            },
          };

          setTimeout(tick, 300);
          return; // â† native path active, skip ZXing
        }
        // useNative=false: surface the init error below
      }
      throw new Error('Unable to initialize a barcode scanner on this device.');
    } catch (err) {
      setErrorMsg('Camera access failed: ' + err.message);
    }
  }, [ensureVideoStreamPlaying, stopBarcodeScanner, switchToDocumentMode, syncBarcodeFailCount]);
  // Note: handleBarcodeDetected is intentionally NOT in the dep array here.
  // The scanner is set up once per SCANNING entry; the ref ensures it always
  // calls the latest callback without needing to restart the scanner.

  const handleBarcodeDetected = useCallback((rawText) => {
    const awb = normalizeBarcodeCandidate(rawText) || String(rawText || '').trim().replace(/\s+/g, '').toUpperCase();
    if (!awb || awb.length < 6 || scanBusyRef.current || currentStepRef.current !== STEPS.SCANNING) return;
    scanBusyRef.current = true;

    // Duplicate detection â€” read from the stable ref so this check is never stale
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

    // Update session â€” also keep scannedAwbsRef in sync for future duplicate checks.
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
  }, [goStep]); // sessionCtx removed from deps â€” duplicate check now uses scannedAwbsRef

  // Keep handleBarcodeDetectedRef pointing at the latest callback so the scanner
  // (which is set up once per SCANNING entry) always calls current logic.
  useEffect(() => {
    handleBarcodeDetectedRef.current = handleBarcodeDetected;
  }, [handleBarcodeDetected]);

  // Start scanning when step changes to SCANNING
  useEffect(() => {
    if (step === STEPS.SCANNING) {
      scanBusyRef.current = false;
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
  }, [step, startBarcodeScanner, stopBarcodeScanner, syncBarcodeFailCount, isE2eMock, mockBarcodeRaw]);

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

  useEffect(() => {
    if (step !== STEPS.CAPTURING) {
      setDocDetected(false);
      setDocStableTicks(0);
      autoCaptureTriggeredRef.current = false;
      return;
    }

    // Just detect whether a document is in frame to give visual feedback.
    // We do NOT auto-capture â€” user must press the shutter button.
    const tick = setInterval(() => {
      const video = videoRef.current;
      const guide = guideRef.current;
      if (!video || !guide || !video.videoWidth || !video.videoHeight) return;

      const crop = cropRectForCoverVideo(video, guide);
      if (!crop) return;
      const sx = Math.max(0, Math.floor(crop.x));
      const sy = Math.max(0, Math.floor(crop.y));
      const sw = Math.max(24, Math.floor(crop.w));
      const sh = Math.max(24, Math.floor(crop.h));

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

    const crop = cropRectForCoverVideo(video, guide);
    if (!crop) return null;

    const cropX = crop.x;
    const cropY = crop.y;
    const cropW = crop.w;
    const cropH = crop.h;
    if (!cropW || !cropH) return null;

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

  const handleMockCapturePhoto = useCallback(() => {
    if (!isE2eMock) return;
    const mockImage = 'data:image/jpeg;base64,ZmFrZS1tb2NrLWltYWdl';
    setCapturedImage(mockImage);
    stopCamera();
    goStep(STEPS.PREVIEW);
  }, [goStep, isE2eMock, stopCamera]);

  // Auto-capture is intentionally disabled â€” user presses the shutter button manually.

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // SEND TO DESKTOP (OCR Pipeline)
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  const submitForProcessing = useCallback(() => {
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
      awb: lockedAwb || '',
      imageBase64,
      focusImageBase64: imageBase64,
      sessionContext: ctxPayload,
    };

    if (!socket || !socket.connected || connStatus !== 'paired') {
      enqueueOfflineScan(payload);
      playSuccessBeep();
      const item = { awb: lockedAwb || 'PENDING_OCR', clientCode: 'OFFLINE', clientName: 'Queued Offline', destination: '', weight: 0 };
      setLastSuccess({ ...item, offlineQueued: true });
      addToQueue(item);
      goStep(STEPS.SUCCESS);
      return;
    }

    socket.emit('scanner:scan', payload);

    // Timeout fallback â€” 40s to give Gemini Vision enough time on slow connections
    setTimeout(() => {
      if (currentStepRef.current === STEPS.PROCESSING) {
        setErrorMsg('OCR timed out after 40 seconds. Check that GEMINI_API_KEY is set on Railway, then try again.');
        goStep(STEPS.ERROR);
      }
    }, 40000);
  }, [socket, lockedAwb, capturedImage, sessionCtx, goStep, connStatus, enqueueOfflineScan, addToQueue, isE2eMock]);

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // APPROVAL
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  const submitApproval = useCallback(() => {
    if (!reviewData) return;
    goStep(STEPS.APPROVING);
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
        goStep(STEPS.SUCCESS);
      }, 200);
      return;
    }
    if (!socket) return;

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
  }, [socket, reviewData, reviewForm, lockedAwb, pin, goStep, addToQueue, isE2eMock]);

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // RESET / NEXT SCAN
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

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
    // scannedAwbsRef is intentionally NOT cleared here â€” duplicates should be
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

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // RENDER
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  const isStepActive = (s) => step === s;
  const stepClass = (s) => `msp-step ${step === s ? 'active' : ''}`;

  // â”€â”€ Confidence data from reviewData â”€â”€
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
  const diagnosticsRows = [
    ['Step', step],
    ['Connection', connStatus],
    ['Engine', scannerEngine],
    ['Scan mode', scanMode],
    ['Fail count', String(barcodeFailCount)],
    ['Camera', captureCameraReady ? 'ready' : 'waiting'],
    ['Doc detect', docDetected ? `yes (${docStableTicks})` : 'no'],
    ['Secure ctx', isProbablySecureContextForCamera() ? 'yes' : 'no'],
    ['AWB lock', lockedAwb || '-'],
    ['Queued', String(offlineQueue.length)],
    ['Scans', String(sessionCtx.scanNumber)],
    ['Last format', lastDetectionMeta?.format || '-'],
    ['Last code', lastDetectionMeta?.value || '-'],
    ['Decode ms', lastDetectionMeta?.sinceStartMs != null ? String(lastDetectionMeta.sinceStartMs) : '-'],
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
                <div style={{ fontSize: '0.82rem', color: theme.muted }}>{errorMsg || `Connecting to session ${pin}`}</div>
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
                    ? { width: BARCODE_SCAN_REGION.w, height: BARCODE_SCAN_REGION.h, borderRadius: 10, maxHeight: '20vw', transition: 'all 0.4s ease' }
                    : { width: DOC_CAPTURE_REGION.w, height: DOC_CAPTURE_REGION.h, borderRadius: 14, maxHeight: '75vh', transition: 'all 0.4s ease', borderColor: 'rgba(251,191,36,0.85)', boxShadow: '0 0 0 3px rgba(251,191,36,0.2)' }
                }
              >
                <div className="scan-guide-corner corner-tl" />
                <div className="scan-guide-corner corner-tr" />
                <div className="scan-guide-corner corner-bl" />
                <div className="scan-guide-corner corner-br" />
                {/* Laser only in barcode mode */}
                {scanMode === 'barcode' && <div className="scan-laser" />}
              </div>
            </div>
            <div className="cam-hud">
              <div className="cam-hud-chip">
                <Wifi size={12} /> {pin}
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
                <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.82rem', fontWeight: 600, textAlign: 'center' }}>
                  Align barcode inside the strip
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
                      onClick={() => { syncBarcodeFailCount(0); setScanMode('barcode'); }}
                    >
                      Back to barcode mode
                    </button>
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 12 }}>
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
                {docDetected ? 'AWB area in frame - press shutter' : 'Fit the AWB slip inside the frame so we can read the printed AWB'}
              </div>
              <button
                className="capture-btn"
                data-testid="capture-photo-btn"
                onClick={handleCapturePhoto}
                disabled={!captureCameraReady}
                style={{ opacity: captureCameraReady ? 1 : 0.4 }}
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
                onClick={() => { setLockedAwb(''); scanBusyRef.current = false; goStep(STEPS.SCANNING); }}
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
                Reading AWB label with Gemini Visionâ€¦
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
                <div className="source-badge source-learned">ðŸ§  {intelligence.learnedFieldCount} auto-corrected</div>
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
                      <div style={{ fontSize: '0.6rem', color: theme.warning, marginTop: 2, fontWeight: 500 }}>âš ï¸ {intelligence.weightAnomaly.warning}</div>
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
                ? `${offlineQueue.length} queued for sync â€¢ Auto-continuing in 3s`
                : `#${sessionCtx.scanNumber} scanned â€¢ Auto-continuing in 3s`}
            </div>
            <button data-testid="scan-next-btn" className="btn btn-primary btn-lg btn-full" onClick={resetForNextScan} style={{ maxWidth: 320 }}>
              <Camera size={18} /> Scan Next Parcel
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
