import { useState, useRef, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType, NotFoundException } from '@zxing/library';
import { useParams } from 'react-router-dom';
import {
  ScanLine, CheckCircle2, AlertCircle, Wifi, WifiOff,
  Smartphone, Zap, X, Camera, Aperture, Save,
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
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [pendingBarcode, setPendingBarcode] = useState('');
  const [awaitingLabelCapture, setAwaitingLabelCapture] = useState(false);
  const [labelCaptureBusy, setLabelCaptureBusy] = useState(false);
  const [labelCaptureHint, setLabelCaptureHint] = useState('');
  const [approvalDraft, setApprovalDraft] = useState(null);
  const [approvalBusy, setApprovalBusy] = useState(false);
  const [approvalMessage, setApprovalMessage] = useState('');

  const socketRef = useRef(null);
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const scanBusyRef = useRef(false);
  const scannerPausedRef = useRef(false);
  const lastDecodedRef = useRef('');
  const scanLockUntilRef = useRef(0);
  const lastDecodeErrorAtRef = useRef(0);

  const waitForVideoReady = async (video) => new Promise((resolve, reject) => {
    if (!video) {
      reject(new Error('Video element unavailable'));
      return;
    }

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      video.removeEventListener('loadedmetadata', onReady);
      video.removeEventListener('canplay', onReady);
      clearTimeout(timeoutId);
      resolve();
    };

    const fail = () => {
      if (settled) return;
      settled = true;
      video.removeEventListener('loadedmetadata', onReady);
      video.removeEventListener('canplay', onReady);
      clearTimeout(timeoutId);
      reject(new Error('Camera preview did not become ready'));
    };

    const onReady = () => finish();
    const timeoutId = setTimeout(fail, 5000);

    if (video.readyState >= 2) {
      finish();
      return;
    }

    video.addEventListener('loadedmetadata', onReady, { once: true });
    video.addEventListener('canplay', onReady, { once: true });
  });

  const waitForVideoElement = async () => new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const tick = () => {
      const video = videoRef.current;
      if (video) {
        resolve(video);
        return;
      }
      if (Date.now() - startedAt > 2500) {
        reject(new Error('Camera surface unavailable'));
        return;
      }
      requestAnimationFrame(tick);
    };
    tick();
  });

  const normalizeApprovalDraft = (feedback = {}) => ({
    shipmentId: feedback.shipmentId || null,
    awb: String(feedback.awb || '').trim(),
    clientCode: String(feedback.clientCode || '').trim().toUpperCase(),
    clientName: String(feedback.clientName || '').trim(),
    consignee: String(feedback.consignee || '').trim().toUpperCase(),
    destination: String(feedback.destination || '').trim().toUpperCase(),
    pincode: String(feedback.pincode || '').replace(/\D/g, '').slice(0, 6),
    weight: feedback.weight || 0,
    amount: feedback.amount || 0,
    orderNo: String(feedback.orderNo || '').trim().toUpperCase(),
  });

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
      if (feedback.status === 'pending_review') {
        setApprovalDraft(normalizeApprovalDraft(feedback));
        setApprovalMessage('Review the extracted fields, adjust anything wrong, then approve.');
      }
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

    socket.on('scanner:approval-result', ({ success, message }) => {
      setApprovalBusy(false);
      setApprovalMessage(message || '');
      if (success) {
        setApprovalDraft(null);
        setFlashFeedback('success');
      } else {
        setFlashFeedback('error');
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

  const submitApproval = () => {
    if (!approvalDraft || !socketRef.current) return;
    setApprovalBusy(true);
    setApprovalMessage('Sending approved intake to desktop...');
    socketRef.current.emit('scanner:approval-submit', {
      shipmentId: approvalDraft.shipmentId,
      awb: approvalDraft.awb,
      fields: {
        clientCode: approvalDraft.clientCode,
        consignee: approvalDraft.consignee,
        destination: approvalDraft.destination,
        pincode: approvalDraft.pincode,
        weight: approvalDraft.weight,
        amount: approvalDraft.amount,
        orderNo: approvalDraft.orderNo,
      },
    }, (response) => {
      if (!response?.success) {
        setApprovalBusy(false);
        setApprovalMessage(response?.message || 'Desktop did not accept the approval.');
      }
    });
  };

  // ── Camera scanner ──────────────────────────────────────────────────────
  const stopCamera = async () => {
    try { await scannerRef.current?.reset(); } catch { /* silent */ }
    scannerRef.current = null;
    try {
      mediaStreamRef.current?.getTracks?.().forEach((track) => track.stop());
    } catch { /* silent */ }
    mediaStreamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.pause?.();
    }
    scanBusyRef.current = false;
    scannerPausedRef.current = false;
    lastDecodedRef.current = '';
    scanLockUntilRef.current = 0;
    setCameraActive(false);
    setCameraReady(false);
    setCameraStarting(false);
    setPendingBarcode('');
    setAwaitingLabelCapture(false);
    setLabelCaptureBusy(false);
    setLabelCaptureHint('');
  };

  const captureFrame = ({ quality = 0.82, maxWidth = 1920 } = {}) => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = Math.min(maxWidth, video.videoWidth);
      canvas.height = Math.round((canvas.width / video.videoWidth) * video.videoHeight);
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', quality).split(',')[1] || null;
    } catch { return null; }
  };

  const submitLockedBarcode = async (withPhoto = true) => {
    if (!pendingBarcode || !socketRef.current) return;
    setLabelCaptureBusy(true);
    setLabelCaptureHint(withPhoto ? 'Capturing label for OCR...' : 'Sending barcode only...');

    try {
      const imageBase64 = withPhoto ? captureFrame({ quality: 0.86, maxWidth: 1920 }) : null;
      socketRef.current.emit('scanner:scan', { awb: pendingBarcode, imageBase64 });
      setScanCount((c) => c + 1);
      setLastAwb(pendingBarcode);
      setAwaitingLabelCapture(false);
      setPendingBarcode('');
      scannerPausedRef.current = false;
      scanLockUntilRef.current = Date.now() + 700;
      setLabelCaptureHint('Sent to desktop. Keep scanning.');
      setTimeout(() => setLabelCaptureHint(''), 1400);
    } finally {
      setLabelCaptureBusy(false);
    }
  };

  const startCamera = async () => {
    if (!socketRef.current || status !== 'paired') return;
    try {
      setCameraError('');
      setCameraStarting(true);
      await stopCamera();
      setCameraActive(true);
      const video = await waitForVideoElement();
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('This browser is not allowing camera access.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      mediaStreamRef.current = stream;
      const hints = new Map();
      hints.set(DecodeHintType.TRY_HARDER, true);
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.CODE_93,
        BarcodeFormat.CODABAR,
        BarcodeFormat.ITF,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.QR_CODE,
      ]);

      const scanner = new BrowserMultiFormatReader(hints, {
        delayBetweenScanAttempts: 60,
        delayBetweenScanSuccess: 350,
      });
      scannerRef.current = scanner;
      setCameraReady(false);
      video.srcObject = stream;
      video.muted = true;
      video.defaultMuted = true;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      await video.play();
      await waitForVideoReady(video);
      setCameraReady(true);
      setCameraStarting(false);

      await scanner.decodeFromVideoElement(video, async (result, error) => {
        if (scannerPausedRef.current) return;
        if (!result) {
          if (error && !(error instanceof NotFoundException)) {
            const now = Date.now();
            if (now - lastDecodeErrorAtRef.current > 1500) {
              setCameraError('Scanner is active but cannot decode yet. Try moving closer and hold steady.');
              lastDecodeErrorAtRef.current = now;
            }
          }
          return;
        }
        setCameraError('');
        const awb = String(result.getText() || '').trim();
        const now = Date.now();
        if (!awb) return;
        if (scanBusyRef.current) return;
        if (now < scanLockUntilRef.current && awb === lastDecodedRef.current) return;

        scanBusyRef.current = true;
        scanLockUntilRef.current = now + 2000;
        lastDecodedRef.current = awb;
        scannerPausedRef.current = true;

        setFlashFeedback('success');
        vibrate([50]);
        playBeep(880, 0.06);
        setTimeout(() => setFlashFeedback(null), 400);
        setLastAwb(awb);
        setPendingBarcode(awb);
        setAwaitingLabelCapture(true);
        setLabelCaptureHint('Barcode locked. Now capture the full AWB label photo.');

        scanBusyRef.current = false;
      });
    } catch (err) {
      const message = err?.message || 'Camera failed';
      setCameraError(message);
      setErrorMsg(message);
      setCameraStarting(false);
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
        <video
          ref={videoRef}
          className={`msc-video ${cameraActive ? 'msc-video-active' : 'msc-video-idle'}`}
          muted
          playsInline
          autoPlay
          disablePictureInPicture
        />
        {cameraActive ? (
          <>
            <div className="msc-scan-overlay">
              <div className="msc-overlay-head">
                <div className="msc-overlay-chip">
                  <Camera size={14} />
                  {cameraReady ? 'Rear camera live' : 'Opening rear camera'}
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
              <div className="msc-overlay-tip">
                {awaitingLabelCapture
                  ? 'Barcode locked. Hold full AWB in view and tap Capture Label.'
                  : 'Point to barcode first. After lock, capture full AWB for client, consignee, destination, pincode, weight, and value.'}
              </div>
            </div>
          </>
        ) : (
          <div className="msc-camera-placeholder">
            <ScanLine size={48} className="msc-placeholder-icon" />
            <p>Tap below to start scanning</p>
          </div>
        )}
      </div>

      {approvalDraft && (
        <div className="msc-approval-sheet">
          <div className="msc-sheet-handle" />
          <div className="msc-sheet-head">
            <div>
              <div className="msc-sheet-kicker">Final Approval</div>
              <div className="msc-sheet-title">Review this shipment before it reaches desktop and portal</div>
            </div>
            <button className="msc-sheet-close" type="button" onClick={() => setApprovalDraft(null)} disabled={approvalBusy}>
              <X size={16} />
            </button>
          </div>

          <div className="msc-sheet-awb">{approvalDraft.awb}</div>
          {approvalMessage ? <div className="msc-sheet-message">{approvalMessage}</div> : null}

          <div className="msc-sheet-grid">
            <label>
              <span>Client code</span>
              <input value={approvalDraft.clientCode} onChange={(e) => setApprovalDraft((prev) => ({ ...prev, clientCode: e.target.value.toUpperCase() }))} />
            </label>
            <label>
              <span>Client name</span>
              <input value={approvalDraft.clientName} onChange={(e) => setApprovalDraft((prev) => ({ ...prev, clientName: e.target.value }))} />
            </label>
            <label>
              <span>Consignee</span>
              <input value={approvalDraft.consignee} onChange={(e) => setApprovalDraft((prev) => ({ ...prev, consignee: e.target.value.toUpperCase() }))} />
            </label>
            <label>
              <span>Destination</span>
              <input value={approvalDraft.destination} onChange={(e) => setApprovalDraft((prev) => ({ ...prev, destination: e.target.value.toUpperCase() }))} />
            </label>
            <label>
              <span>Pincode</span>
              <input value={approvalDraft.pincode} onChange={(e) => setApprovalDraft((prev) => ({ ...prev, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))} />
            </label>
            <label>
              <span>Weight</span>
              <input type="number" step="0.01" value={approvalDraft.weight} onChange={(e) => setApprovalDraft((prev) => ({ ...prev, weight: e.target.value }))} />
            </label>
            <label>
              <span>Value</span>
              <input type="number" step="0.01" value={approvalDraft.amount} onChange={(e) => setApprovalDraft((prev) => ({ ...prev, amount: e.target.value }))} />
            </label>
            <label>
              <span>Order no</span>
              <input value={approvalDraft.orderNo} onChange={(e) => setApprovalDraft((prev) => ({ ...prev, orderNo: e.target.value.toUpperCase() }))} />
            </label>
          </div>

          <div className="msc-sheet-actions">
            <button type="button" className="msc-sheet-secondary" onClick={() => setApprovalDraft(null)} disabled={approvalBusy}>Keep scanning</button>
            <button type="button" className="msc-sheet-primary" onClick={submitApproval} disabled={approvalBusy}>
              {approvalBusy ? <><Aperture size={16} /> Saving...</> : <><Save size={16} /> Approve & Send</>}
            </button>
          </div>
        </div>
      )}

      {cameraActive && awaitingLabelCapture && (
        <div className="msc-capture-panel">
          <div className="msc-capture-title">Barcode: {pendingBarcode || 'LOCKED'}</div>
          <div className="msc-capture-sub">Take one clear full-label photo so OCR can extract all fields.</div>
          <div className="msc-capture-actions">
            <button type="button" className="msc-capture-primary" onClick={() => submitLockedBarcode(true)} disabled={labelCaptureBusy}>
              {labelCaptureBusy ? <><Aperture size={16} /> Capturing...</> : <><Camera size={16} /> Capture Label</>}
            </button>
            <button type="button" className="msc-capture-secondary" onClick={() => submitLockedBarcode(false)} disabled={labelCaptureBusy}>
              Send Barcode Only
            </button>
          </div>
        </div>
      )}

      {!awaitingLabelCapture && !!labelCaptureHint && (
        <div className="msc-capture-toast">{labelCaptureHint}</div>
      )}

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
      {(cameraError || (errorMsg && status === 'error')) && (
        <div className="msc-error msc-error-banner">
          <AlertCircle size={14} /> {cameraError || errorMsg}
        </div>
      )}

      {/* Controls */}
      <div className="msc-controls">
        <button
          className={`msc-cam-btn ${cameraActive ? 'msc-cam-active' : ''}`}
          disabled={cameraStarting}
          onClick={cameraActive ? stopCamera : startCamera}
        >
          {cameraActive ? (
            <><X size={22} /> Stop Camera</>
          ) : cameraStarting ? (
            <><Aperture size={22} /> Starting Camera...</>
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
          isolation: isolate;
        }
        .msc-capture-panel {
          position: absolute;
          left: 0.75rem;
          right: 0.75rem;
          bottom: calc(0.65rem + env(safe-area-inset-bottom));
          z-index: 35;
          border-radius: 18px;
          border: 1px solid rgba(52,211,153,0.4);
          background: rgba(2,6,23,0.9);
          backdrop-filter: blur(10px);
          padding: 0.8rem;
          box-shadow: 0 10px 30px rgba(2,6,23,0.45);
        }
        .msc-capture-title {
          color: #bbf7d0;
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-family: 'SF Mono', 'Fira Code', monospace;
        }
        .msc-capture-sub {
          margin-top: 0.35rem;
          color: #cbd5e1;
          font-size: 0.68rem;
          font-weight: 700;
          line-height: 1.4;
        }
        .msc-capture-actions {
          display: flex;
          gap: 0.6rem;
          margin-top: 0.7rem;
        }
        .msc-capture-primary,
        .msc-capture-secondary {
          flex: 1;
          min-height: 2.6rem;
          border-radius: 14px;
          border: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          font-size: 0.7rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }
        .msc-capture-primary {
          color: #fff;
          background: linear-gradient(135deg, #16a34a, #22c55e);
          box-shadow: 0 12px 24px rgba(34,197,94,0.22);
        }
        .msc-capture-secondary {
          color: #cbd5e1;
          background: rgba(148,163,184,0.16);
        }
        .msc-capture-toast {
          position: absolute;
          bottom: calc(6rem + env(safe-area-inset-bottom));
          left: 1rem;
          right: 1rem;
          z-index: 45;
          padding: 0.62rem 0.85rem;
          border-radius: 12px;
          border: 1px solid rgba(56,189,248,0.32);
          background: rgba(15,23,42,0.9);
          color: #bae6fd;
          font-size: 0.68rem;
          font-weight: 800;
          text-align: center;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .msc-approval-sheet {
          position: absolute;
          left: 0;
          right: 0;
          bottom: calc(4.9rem + env(safe-area-inset-bottom));
          z-index: 40;
          margin: 0 0.85rem;
          padding: 0.9rem 0.9rem 1rem;
          border-radius: 26px 26px 22px 22px;
          background: rgba(15,23,42,0.96);
          border: 1px solid rgba(148,163,184,0.18);
          box-shadow: 0 18px 48px rgba(2,6,23,0.46);
          backdrop-filter: blur(20px);
        }
        .msc-sheet-handle {
          width: 54px;
          height: 5px;
          border-radius: 999px;
          background: rgba(148,163,184,0.34);
          margin: 0 auto 0.75rem;
        }
        .msc-sheet-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }
        .msc-sheet-kicker {
          color: #38bdf8;
          font-size: 0.62rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.22em;
        }
        .msc-sheet-title {
          margin-top: 0.35rem;
          color: #f8fafc;
          font-size: 0.92rem;
          font-weight: 800;
          line-height: 1.35;
        }
        .msc-sheet-close {
          width: 2rem;
          height: 2rem;
          border-radius: 999px;
          border: none;
          background: rgba(148,163,184,0.14);
          color: #e2e8f0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .msc-sheet-awb {
          color: #f8fafc;
          font-size: 1rem;
          font-weight: 900;
          font-family: 'SF Mono', 'Fira Code', monospace;
          margin-bottom: 0.55rem;
        }
        .msc-sheet-message {
          margin-bottom: 0.75rem;
          color: #94a3b8;
          font-size: 0.7rem;
          font-weight: 700;
          line-height: 1.45;
        }
        .msc-sheet-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.65rem;
        }
        .msc-sheet-grid label {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .msc-sheet-grid label span {
          color: #94a3b8;
          font-size: 0.58rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.16em;
        }
        .msc-sheet-grid label input {
          width: 100%;
          border-radius: 14px;
          border: 1px solid rgba(148,163,184,0.14);
          background: rgba(2,6,23,0.6);
          color: #f8fafc;
          padding: 0.72rem 0.8rem;
          font-size: 0.78rem;
          font-weight: 700;
          outline: none;
        }
        .msc-sheet-actions {
          display: flex;
          gap: 0.7rem;
          margin-top: 0.9rem;
        }
        .msc-sheet-secondary,
        .msc-sheet-primary {
          flex: 1;
          min-height: 3rem;
          border-radius: 16px;
          border: none;
          font-size: 0.78rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        .msc-sheet-secondary {
          background: rgba(148,163,184,0.12);
          color: #cbd5e1;
        }
        .msc-sheet-primary {
          background: linear-gradient(135deg, #16a34a, #22c55e);
          color: #fff;
          box-shadow: 0 14px 30px rgba(34,197,94,0.22);
        }
        .msc-video {
          width: 100%; height: 100%;
          object-fit: cover;
          display: block;
          background: #000;
          position: absolute;
          inset: 0;
          z-index: 0;
        }
        .msc-video-idle {
          opacity: 0;
          pointer-events: none;
        }
        .msc-video-active {
          opacity: 1;
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
          z-index: 1;
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
          border-radius: 20px;
          margin: auto 0;
          background: transparent;
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
        .msc-cam-btn:disabled {
          opacity: 0.7;
        }
        .msc-cam-btn:active { transform: scale(0.97); }
        .msc-cam-active {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          box-shadow: 0 4px 20px rgba(239,68,68,0.3);
        }
        .msc-capture-panel + .msc-controls {
          padding-top: 0.5rem;
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
          .msc-approval-sheet {
            margin: 0 0.55rem;
            bottom: calc(4.7rem + env(safe-area-inset-bottom));
            padding: 0.85rem 0.8rem 0.95rem;
          }
          .msc-capture-panel {
            left: 0.55rem;
            right: 0.55rem;
            bottom: calc(0.45rem + env(safe-area-inset-bottom));
            padding: 0.72rem;
          }
          .msc-capture-actions {
            flex-direction: column;
          }
          .msc-sheet-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
