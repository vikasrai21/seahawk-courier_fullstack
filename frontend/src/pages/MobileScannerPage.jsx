import { useState, useRef, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { useParams } from 'react-router-dom';
import {
  ScanLine, CheckCircle2, AlertCircle, Wifi, WifiOff,
  Smartphone, Zap, X, Camera, Aperture,
} from 'lucide-react';

function resolveSocketUrl() {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl || apiUrl.startsWith('/')) return window.location.origin;
  return apiUrl.replace(/\/api\/?$/, '');
}

const playBeep = (freq = 880, duration = 0.08) => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) { /* silent */ }
};

const vibrate = (pattern = [50]) => {
  try { navigator.vibrate?.(pattern); } catch { /* silent */ }
};

export default function MobileScannerPage() {
  const { pin: urlPin } = useParams();
  const [pin, setPin] = useState(urlPin || '');
  const [pinInput, setPinInput] = useState(urlPin || '');
  const [status, setStatus] = useState('idle'); // idle | connecting | paired | error | ended
  const [errorMsg, setErrorMsg] = useState('');
  const [pairedUser, setPairedUser] = useState('');
  const [scanCount, setScanCount] = useState(0);
  const [lastAwb, setLastAwb] = useState('');
  const [lastFeedback, setLastFeedback] = useState(null); // { awb, status, clientCode, clientName, consignee, destination, weight, reviewRequired }
  const [flashFeedback, setFlashFeedback] = useState(null); // 'success' | 'error'
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  const socketRef = useRef(null);
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const scanBusyRef = useRef(false);
  const lastDecodedRef = useRef('');
  const scanLockUntilRef = useRef(0);

  // ── Connect to desktop via PIN ──────────────────────────────────────────
  const connectToDesktop = useCallback((connectPin) => {
    const trimmedPin = String(connectPin || '').trim();
    if (trimmedPin.length !== 6) {
      setErrorMsg('Please enter a valid 6-digit PIN');
      setStatus('error');
      return;
    }

    setPin(trimmedPin);
    setStatus('connecting');
    setErrorMsg('');

    const socket = io(resolveSocketUrl(), {
      auth: { scannerPin: trimmedPin },
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      // Wait for scanner:paired event for actual confirmation
    });

    socket.on('scanner:paired', ({ message, userEmail }) => {
      setStatus('paired');
      setPairedUser(userEmail || 'Desktop');
      setErrorMsg('');
      vibrate([100, 50, 100]);
      playBeep(1200, 0.1);
    });

    socket.on('scanner:scan-feedback', (feedback) => {
      setLastFeedback(feedback);
      if (feedback.status === 'success') {
        setFlashFeedback('success');
        vibrate([30]);
        playBeep(1400, 0.06);
      } else {
        setFlashFeedback('error');
        vibrate([100, 50, 100]);
        playBeep(200, 0.2);
      }
      setTimeout(() => setFlashFeedback(null), 600);
    });

    socket.on('scanner:session-ended', ({ reason }) => {
      setStatus('ended');
      setErrorMsg(reason || 'Session ended');
      stopCamera();
    });

    socket.on('scanner:error', ({ message }) => {
      setStatus('error');
      setErrorMsg(message);
    });

    socket.on('disconnect', () => {
      if (status !== 'ended') {
        setStatus('error');
        setErrorMsg('Connection lost. Trying to reconnect...');
      }
    });

    socket.on('reconnect', () => {
      setStatus('paired');
      setErrorMsg('');
    });

    socket.on('connect_error', () => {
      setStatus('error');
      setErrorMsg('Could not connect to server. Check your network.');
    });
  }, []);

  // Auto-connect if PIN is in URL
  useEffect(() => {
    if (urlPin && urlPin.length === 6) {
      connectToDesktop(urlPin);
    }
    return () => {
      socketRef.current?.disconnect();
      stopCamera();
    };
  }, []);

  // ── Camera scanner ──────────────────────────────────────────────────────
  const stopCamera = async () => {
    try { await scannerRef.current?.reset(); } catch { /* silent */ }
    scannerRef.current = null;
    scanBusyRef.current = false;
    lastDecodedRef.current = '';
    scanLockUntilRef.current = 0;
    setCameraActive(false);
    setCameraReady(false);
  };

  const captureFrame = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(800, video.videoWidth);
      canvas.height = Math.round((canvas.width / video.videoWidth) * video.videoHeight);
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.5).split(',')[1] || null;
    } catch { return null; }
  };

  const startCamera = async () => {
    if (!socketRef.current || status !== 'paired') return;
    try {
      await stopCamera();
      const scanner = new BrowserMultiFormatReader();
      scannerRef.current = scanner;
      setCameraActive(true);
      setCameraReady(false);
      if (videoRef.current) {
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
      }

      await scanner.decodeFromConstraints(
        {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        },
        videoRef.current,
        async (result, err) => {
          if (!result) return;
          const awb = String(result.getText() || '').trim();
          const now = Date.now();
          if (!awb) return;
          if (scanBusyRef.current) return;
          if (now < scanLockUntilRef.current && awb === lastDecodedRef.current) return;

          scanBusyRef.current = true;
          scanLockUntilRef.current = now + 2000;
          lastDecodedRef.current = awb;

          // Quick visual + haptic feedback on scan
          setFlashFeedback('success');
          vibrate([50]);
          playBeep(880, 0.06);
          setTimeout(() => setFlashFeedback(null), 400);

          setScanCount((c) => c + 1);
          setLastAwb(awb);

          // Capture frame for OCR hints
          const imageBase64 = captureFrame();

          // Send to desktop via socket
          socketRef.current?.emit('scanner:scan', { awb, imageBase64 });

          scanBusyRef.current = false;
        }
      );
    } catch (err) {
      setErrorMsg(err.message || 'Camera failed');
      await stopCamera();
    }
  };

  // ── Heartbeat ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'paired') return;
    const interval = setInterval(() => {
      socketRef.current?.emit('scanner:heartbeat');
    }, 5000);
    return () => clearInterval(interval);
  }, [status]);

  // ── Render: PIN entry screen ──────────────────────────────────────────
  if (status === 'idle' || (status === 'error' && !pin)) {
    return (
      <div className="msc-root">
        <div className="msc-container">
          <div className="msc-logo-ring">
            <Smartphone size={36} />
          </div>
          <h1 className="msc-title">Seahawk Remote Scanner</h1>
          <p className="msc-subtitle">Enter the 6-digit PIN shown on your desktop</p>

          <div className="msc-pin-group">
            <input
              className="msc-pin-input"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="● ● ● ● ● ●"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
              autoFocus
            />
            <button
              className="msc-connect-btn"
              disabled={pinInput.length !== 6}
              onClick={() => connectToDesktop(pinInput)}
            >
              <Zap size={18} /> Connect
            </button>
          </div>

          {errorMsg && (
            <div className="msc-error">
              <AlertCircle size={14} /> {errorMsg}
            </div>
          )}

          <p className="msc-hint">
            Open <strong>Rapid Terminal</strong> on your desktop and click <strong>"Connect Mobile"</strong> to get the PIN.
          </p>
        </div>
      </div>
    );
  }

  // ── Render: Connecting ────────────────────────────────────────────────
  if (status === 'connecting') {
    return (
      <div className="msc-root">
        <div className="msc-container">
          <div className="msc-logo-ring msc-pulse">
            <Wifi size={36} />
          </div>
          <h1 className="msc-title">Connecting...</h1>
          <p className="msc-subtitle">Pairing with desktop via PIN {pin}</p>
        </div>
      </div>
    );
  }

  // ── Render: Session ended ─────────────────────────────────────────────
  if (status === 'ended') {
    return (
      <div className="msc-root">
        <div className="msc-container">
          <div className="msc-logo-ring msc-ended">
            <WifiOff size={36} />
          </div>
          <h1 className="msc-title">Session Ended</h1>
          <p className="msc-subtitle">{errorMsg || 'The scanning session has been closed.'}</p>
          <p className="msc-stat">Total scans: <strong>{scanCount}</strong></p>
          <button className="msc-connect-btn" onClick={() => { setStatus('idle'); setPin(''); setPinInput(''); setErrorMsg(''); setScanCount(0); }}>
            Start New Session
          </button>
        </div>
      </div>
    );
  }

  // ── Render: Paired + Camera scanner ───────────────────────────────────
  return (
    <div className={`msc-root ${flashFeedback === 'success' ? 'msc-flash-success' : flashFeedback === 'error' ? 'msc-flash-error' : ''}`}>
      {/* Status bar */}
      <div className="msc-status-bar">
        <div className="msc-status-left">
          <div className="msc-dot msc-dot-live" />
          <span>LIVE</span>
          <span className="msc-status-pin">PIN {pin}</span>
        </div>
        <div className="msc-status-right">
          <span className="msc-scan-count">{scanCount} scans</span>
          <button className="msc-end-btn" onClick={() => {
            socketRef.current?.disconnect();
            stopCamera();
            setStatus('ended');
          }}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Camera viewport */}
      <div className="msc-camera-wrap">
        {cameraActive ? (
          <>
            <video ref={videoRef} className="msc-video" muted playsInline autoPlay disablePictureInPicture />
            <div className="msc-scan-overlay">
              <div className="msc-overlay-head">
                <div className="msc-overlay-chip">
                  <Camera size={14} />
                  Rear camera live
                </div>
                <div className={`msc-overlay-chip ${cameraReady ? 'ready' : ''}`}>
                  <Aperture size={14} />
                  {cameraReady ? 'Aim at AWB barcode' : 'Waking camera'}
                </div>
              </div>
              <div className="msc-scan-frame">
                <div className="msc-corner msc-tl" />
                <div className="msc-corner msc-tr" />
                <div className="msc-corner msc-bl" />
                <div className="msc-corner msc-br" />
                <div className="msc-scan-line" />
              </div>
              <div className="msc-overlay-tip">Fill this box with the barcode first. Desktop review will then confirm client, consignee, destination, and weight.</div>
            </div>
          </>
        ) : (
          <div className="msc-camera-placeholder">
            <ScanLine size={48} className="msc-placeholder-icon" />
            <p>Tap below to start scanning</p>
          </div>
        )}
      </div>

      {/* Last scan feedback */}
      {lastAwb && (
        <div className="msc-last-scan">
          <div className="msc-last-awb-wrap">
            <div className="msc-last-awb">
              <CheckCircle2 size={16} className="msc-check" />
              <span className="msc-awb-text">{lastAwb}</span>
            </div>
            {lastFeedback?.status && (
              <div className={`msc-feedback-pill ${lastFeedback.status}`}>
                {lastFeedback.status === 'pending_review' ? 'Pending desktop review' : lastFeedback.status === 'success' ? 'Verified' : lastFeedback.status === 'review_deferred' ? 'Deferred' : 'Needs attention'}
              </div>
            )}
          </div>
          {(lastFeedback?.clientCode || lastFeedback?.consignee || lastFeedback?.destination || lastFeedback?.weight) && (
            <div className="msc-feedback-card">
              {lastFeedback?.clientCode && (
                <div className="msc-client-badge">
                  <Zap size={12} /> {lastFeedback.clientCode}
                  {lastFeedback.clientName ? ` · ${lastFeedback.clientName}` : ''}
                </div>
              )}
              <div className="msc-feedback-details">
                {lastFeedback?.consignee ? <div><span>Consignee</span><strong>{lastFeedback.consignee}</strong></div> : null}
                {lastFeedback?.destination ? <div><span>Destination</span><strong>{lastFeedback.destination}</strong></div> : null}
                {lastFeedback?.weight ? <div><span>Weight</span><strong>{lastFeedback.weight} kg</strong></div> : null}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error banner */}
      {errorMsg && status === 'error' && (
        <div className="msc-error msc-error-banner">
          <AlertCircle size={14} /> {errorMsg}
        </div>
      )}

      {/* Controls */}
      <div className="msc-controls">
        <button
          className={`msc-cam-btn ${cameraActive ? 'msc-cam-active' : ''}`}
          onClick={cameraActive ? stopCamera : startCamera}
        >
          {cameraActive ? (
            <><X size={22} /> Stop Camera</>
          ) : (
            <><ScanLine size={22} /> Start Scanning</>
          )}
        </button>
      </div>

      <style>{`
        /* ── Mobile Scanner Styles ─────────────────────────────────────── */
        .msc-root {
          min-height: 100vh;
          min-height: 100dvh;
          background: #080d18;
          color: #fff;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: background 0.3s;
          position: relative;
        }
        .msc-flash-success { background: #064e3b !important; }
        .msc-flash-error { background: #7f1d1d !important; }

        .msc-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          text-align: center;
          gap: 1.25rem;
        }

        .msc-logo-ring {
          width: 80px; height: 80px;
          border-radius: 24px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          box-shadow: 0 8px 32px rgba(59,130,246,0.3);
        }
        .msc-pulse { animation: msc-pulse 1.5s ease-in-out infinite; }
        .msc-ended { background: linear-gradient(135deg, #6b7280, #374151); box-shadow: none; }

        @keyframes msc-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }

        .msc-title {
          font-size: 1.5rem;
          font-weight: 900;
          letter-spacing: -0.02em;
          margin: 0;
        }
        .msc-subtitle {
          font-size: 0.8rem;
          color: #94a3b8;
          margin: 0;
          max-width: 280px;
          line-height: 1.5;
        }
        .msc-stat {
          font-size: 0.85rem;
          color: #64748b;
        }
        .msc-hint {
          font-size: 0.7rem;
          color: #475569;
          max-width: 260px;
          line-height: 1.6;
        }

        .msc-pin-group {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          width: 100%;
          max-width: 280px;
        }
        .msc-pin-input {
          width: 100%;
          text-align: center;
          font-size: 2rem;
          font-weight: 900;
          font-family: 'SF Mono', 'Fira Code', monospace;
          letter-spacing: 0.5em;
          padding: 1rem;
          border-radius: 20px;
          border: 2px solid #1e293b;
          background: #0f172a;
          color: #fff;
          outline: none;
          transition: border-color 0.2s;
        }
        .msc-pin-input:focus { border-color: #3b82f6; }
        .msc-pin-input::placeholder {
          color: #334155;
          letter-spacing: 0.3em;
          font-size: 1.2rem;
        }

        .msc-connect-btn {
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          width: 100%;
          padding: 1rem;
          border-radius: 18px;
          border: none;
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          color: #fff;
          font-size: 0.9rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
          box-shadow: 0 4px 20px rgba(59,130,246,0.3);
        }
        .msc-connect-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .msc-connect-btn:active { transform: scale(0.97); }

        .msc-error {
          display: flex; align-items: center; gap: 0.4rem;
          padding: 0.6rem 1rem;
          border-radius: 12px;
          background: rgba(239,68,68,0.15);
          color: #f87171;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .msc-error-banner {
          position: absolute;
          bottom: 80px;
          left: 1rem; right: 1rem;
          z-index: 50;
        }

        /* ── Status bar ─────────────────────────────────────────── */
        .msc-status-bar {
          display: flex; align-items: center; justify-content: space-between;
          padding: max(0.7rem, env(safe-area-inset-top)) 1rem 0.65rem;
          background: #0f172a;
          border-bottom: 1px solid #1e293b;
          z-index: 20;
        }
        .msc-status-left, .msc-status-right {
          display: flex; align-items: center; gap: 0.5rem;
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: #94a3b8;
        }
        .msc-dot {
          width: 6px; height: 6px; border-radius: 50%;
        }
        .msc-dot-live { background: #22c55e; box-shadow: 0 0 8px #22c55e; animation: msc-blink 1.5s infinite; }
        @keyframes msc-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .msc-status-pin { color: #3b82f6; }
        .msc-scan-count { color: #22c55e; font-variant-numeric: tabular-nums; }
        .msc-end-btn {
          background: rgba(239,68,68,0.15);
          border: none; border-radius: 8px;
          color: #f87171; padding: 4px; cursor: pointer;
          display: flex; align-items: center;
        }

        /* ── Camera ─────────────────────────────────────────────── */
        .msc-camera-wrap {
          flex: 1;
          position: relative;
          background: #000;
          overflow: hidden;
          min-height: 0;
        }
        .msc-video {
          width: 100%; height: 100%;
          object-fit: cover;
          display: block;
          background: #020617;
        }
        .msc-camera-placeholder {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          height: 100%; gap: 1rem; color: #334155;
        }
        .msc-placeholder-icon { opacity: 0.3; }
        .msc-camera-placeholder p { font-size: 0.8rem; font-weight: 600; }

        /* ── Scanning overlay ───────────────────────────────────── */
        .msc-scan-overlay {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: space-between;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem 1rem 1.35rem;
          pointer-events: none;
        }
        .msc-overlay-head {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 0.65rem;
          flex-wrap: wrap;
        }
        .msc-overlay-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.55rem 0.8rem;
          border-radius: 999px;
          background: rgba(15,23,42,0.74);
          border: 1px solid rgba(148,163,184,0.2);
          color: #dbeafe;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .msc-overlay-chip.ready {
          color: #86efac;
          border-color: rgba(34,197,94,0.3);
        }
        .msc-scan-frame {
          width: min(88vw, 420px);
          aspect-ratio: 2.2 / 1;
          position: relative;
          box-shadow: 0 0 0 9999px rgba(2,6,23,0.22);
          border-radius: 20px;
          margin: auto 0;
        }
        .msc-overlay-tip {
          padding: 0.55rem 0.9rem;
          border-radius: 18px;
          background: rgba(15,23,42,0.76);
          border: 1px solid rgba(148,163,184,0.18);
          color: #cbd5e1;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-align: center;
          max-width: min(92%, 32rem);
        }
        .msc-corner {
          position: absolute; width: 24px; height: 24px;
          border-color: #22c55e; border-style: solid; border-width: 0;
        }
        .msc-tl { top: -2px; left: -2px; border-top-width: 3px; border-left-width: 3px; border-top-left-radius: 12px; }
        .msc-tr { top: -2px; right: -2px; border-top-width: 3px; border-right-width: 3px; border-top-right-radius: 12px; }
        .msc-bl { bottom: -2px; left: -2px; border-bottom-width: 3px; border-left-width: 3px; border-bottom-left-radius: 12px; }
        .msc-br { bottom: -2px; right: -2px; border-bottom-width: 3px; border-right-width: 3px; border-bottom-right-radius: 12px; }

        .msc-scan-line {
          position: absolute;
          left: 8px; right: 8px; height: 2px;
          background: linear-gradient(90deg, transparent, #22c55e, transparent);
          animation: msc-scanline 2s ease-in-out infinite;
          border-radius: 2px;
          box-shadow: 0 0 12px #22c55e;
        }
        @keyframes msc-scanline {
          0% { top: 10%; opacity: 0.4; }
          50% { top: 85%; opacity: 1; }
          100% { top: 10%; opacity: 0.4; }
        }

        /* ── Last scan feedback ─────────────────────────────────── */
        .msc-last-scan {
          padding: 0.85rem 1rem calc(0.85rem + env(safe-area-inset-bottom));
          background: #0f172a;
          border-top: 1px solid #1e293b;
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 0.75rem;
          z-index: 20;
          flex-wrap: wrap;
        }
        .msc-last-awb-wrap {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          min-width: 0;
        }
        .msc-last-awb {
          display: flex; align-items: center; gap: 0.4rem;
          font-size: 0.8rem; font-weight: 800;
          font-family: 'SF Mono', 'Fira Code', monospace;
        }
        .msc-check { color: #22c55e; }
        .msc-awb-text { color: #e2e8f0; }
        .msc-client-badge {
          display: flex; align-items: center; gap: 0.25rem;
          padding: 0.25rem 0.6rem;
          border-radius: 8px;
          background: rgba(59,130,246,0.15);
          color: #60a5fa;
          font-size: 0.65rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .msc-feedback-card {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          align-items: flex-end;
          max-width: none;
          flex: 1 1 100%;
          padding-top: 0.15rem;
        }
        .msc-feedback-details {
          display: grid;
          gap: 0.3rem;
          width: 100%;
        }
        .msc-feedback-details div {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.08rem;
        }
        .msc-feedback-details span {
          color: #64748b;
          font-size: 0.58rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }
        .msc-feedback-details strong {
          color: #e2e8f0;
          font-size: 0.72rem;
          font-weight: 800;
          text-align: right;
        }
        .msc-feedback-pill {
          display: inline-flex;
          align-items: center;
          align-self: flex-start;
          padding: 0.24rem 0.55rem;
          border-radius: 999px;
          font-size: 0.58rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }
        .msc-feedback-pill.pending_review,
        .msc-feedback-pill.review_deferred {
          background: rgba(245,158,11,0.18);
          color: #fbbf24;
        }
        .msc-feedback-pill.success {
          background: rgba(34,197,94,0.18);
          color: #4ade80;
        }
        .msc-feedback-pill.error {
          background: rgba(239,68,68,0.18);
          color: #f87171;
        }

        /* ── Controls ───────────────────────────────────────────── */
        .msc-controls {
          padding: 1rem;
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
          background: linear-gradient(180deg, rgba(8,13,24,0) 0%, rgba(8,13,24,0.9) 30%, #0f172a 100%);
          border-top: 1px solid #1e293b;
          z-index: 20;
        }
        .msc-cam-btn {
          display: flex; align-items: center; justify-content: center; gap: 0.6rem;
          width: 100%;
          padding: 1rem;
          border-radius: 18px;
          border: none;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: #fff;
          font-size: 0.85rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          cursor: pointer;
          transition: transform 0.1s;
          box-shadow: 0 4px 20px rgba(34,197,94,0.3);
        }
        .msc-cam-btn:active { transform: scale(0.97); }
        .msc-cam-active {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          box-shadow: 0 4px 20px rgba(239,68,68,0.3);
        }
        @media (max-width: 480px) {
          .msc-status-left, .msc-status-right {
            font-size: 0.58rem;
            letter-spacing: 0.16em;
          }
          .msc-scan-frame {
            width: min(90vw, 360px);
            aspect-ratio: 2 / 1;
          }
          .msc-overlay-tip {
            font-size: 0.68rem;
          }
          .msc-feedback-details {
            grid-template-columns: 1fr;
          }
          .msc-feedback-details div {
            align-items: flex-start;
          }
          .msc-feedback-details strong {
            text-align: left;
          }
        }
      `}</style>
    </div>
  );
}
