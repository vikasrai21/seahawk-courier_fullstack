import { useState, useRef, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType, NotFoundException } from '@zxing/library';
import { useParams } from 'react-router-dom';
import {
  ScanLine, CheckCircle2, AlertCircle, Wifi, WifiOff,
  Smartphone, Zap, X, Camera, Aperture, Save,
} from 'lucide-react';

const SCANBOT_ENGINE_PATH = '/wasm/';
const SCANBOT_LICENSE_KEY = import.meta.env.VITE_SCANBOT_LICENSE_KEY || '';
const COURIER_SCAN_REGEX = '^(?:[A-Z0-9]{8,18})$';

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

const BARCODE_PATTERNS = [
  /^Z\d{8,9}$/,
  /^D\d{9,11}$/,
  /^X\d{9,10}$/,
  /^7X\d{9}$/,
  /^I\d{7,8}$/,
  /^JD\d{18}$/,
  /^\d{12,14}$/,
  /^[A-Z]{1,3}\d{7,14}$/,
];

function normalizeDetectedBarcode(value) {
  const cleaned = String(value || '')
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9]/g, '');

  if (cleaned.length < 8) return '';
  if (BARCODE_PATTERNS.some((pattern) => pattern.test(cleaned))) return cleaned;

  const digitCount = (cleaned.match(/\d/g) || []).length;
  if (/^(?=.*\d)[A-Z0-9]{8,18}$/.test(cleaned) && digitCount >= 7) {
    return cleaned;
  }

  return '';
}

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
  const [capturedLabelPreview, setCapturedLabelPreview] = useState('');
  const [capturedLabelPayload, setCapturedLabelPayload] = useState(null);
  const [approvalDraft, setApprovalDraft] = useState(null);
  const [approvalBusy, setApprovalBusy] = useState(false);
  const [approvalMessage, setApprovalMessage] = useState('');

  const socketRef = useRef(null);
  const videoRef = useRef(null);
  const cameraWrapRef = useRef(null);
  const scanbotContainerRef = useRef(null);
  const scanFrameRef = useRef(null);
  const scannerRef = useRef(null);
  const scanbotSdkRef = useRef(null);
  const scanbotHandleRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const scanBusyRef = useRef(false);
  const scannerPausedRef = useRef(false);
  const lastDecodedRef = useRef('');
  const scanLockUntilRef = useRef(0);
  const lastDecodeErrorAtRef = useRef(0);
  const [scannerEngine, setScannerEngine] = useState('scanbot');

  const bindPreviewVideo = useCallback(() => {
    const scanbotVideo = scanbotContainerRef.current?.querySelector?.('video');
    if (scanbotVideo) {
      videoRef.current = scanbotVideo;
      return scanbotVideo;
    }
    return videoRef.current;
  }, []);

  const ensureScanbotSdk = useCallback(async () => {
    if (scanbotSdkRef.current) return scanbotSdkRef.current;

    const mod = await import('scanbot-web-sdk');
    const ScanbotSDK = mod.default;
    const sdk = await ScanbotSDK.initialize({
      licenseKey: SCANBOT_LICENSE_KEY,
      enginePath: SCANBOT_ENGINE_PATH,
      userAgentAppId: 'seahawk-mobile-scanner',
    });

    const licenseInfo = await sdk.getLicenseInfo().catch(() => null);
    if (licenseInfo && !licenseInfo.isValid()) {
      throw new Error(licenseInfo.licenseStatusMessage || 'Scanbot license is not valid.');
    }

    scanbotSdkRef.current = sdk;
    return sdk;
  }, []);

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

  const waitForScanbotVideo = async () => new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const tick = () => {
      const video = bindPreviewVideo();
      if (video) {
        resolve(video);
        return;
      }
      if (Date.now() - startedAt > 5000) {
        reject(new Error('Premium scanner camera surface unavailable'));
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
    try { scanbotHandleRef.current?.dispose?.(); } catch { /* silent */ }
    scanbotHandleRef.current = null;
    try { await scannerRef.current?.reset(); } catch { /* silent */ }
    scannerRef.current = null;
    try {
      mediaStreamRef.current?.getTracks?.().forEach((track) => track.stop());
    } catch { /* silent */ }
    mediaStreamRef.current = null;
    if (scanbotContainerRef.current) {
      scanbotContainerRef.current.innerHTML = '';
    }
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
    setCapturedLabelPreview('');
    setCapturedLabelPayload(null);
  };

  const captureFrame = ({ quality = 0.82, maxWidth = 1920, target = 'full' } = {}) => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    try {
      let sx = 0;
      let sy = 0;
      let sw = video.videoWidth;
      let sh = video.videoHeight;

      if (target === 'focus' && cameraWrapRef.current && scanFrameRef.current) {
        const videoRect = video.getBoundingClientRect();
        const frameRect = scanFrameRef.current.getBoundingClientRect();
        const displayWidth = videoRect.width;
        const displayHeight = videoRect.height;
        const sourceWidth = video.videoWidth;
        const sourceHeight = video.videoHeight;
        const videoAspect = sourceWidth / sourceHeight;
        const displayAspect = displayWidth / displayHeight;

        let renderedWidth = displayWidth;
        let renderedHeight = displayHeight;
        let offsetX = 0;
        let offsetY = 0;

        if (videoAspect > displayAspect) {
          renderedHeight = displayHeight;
          renderedWidth = renderedHeight * videoAspect;
          offsetX = (renderedWidth - displayWidth) / 2;
        } else {
          renderedWidth = displayWidth;
          renderedHeight = renderedWidth / videoAspect;
          offsetY = (renderedHeight - displayHeight) / 2;
        }

        const expandX = frameRect.width * 0.55;
        const expandY = frameRect.height * 0.9;
        const cropLeft = Math.max(0, frameRect.left - videoRect.left - expandX);
        const cropTop = Math.max(0, frameRect.top - videoRect.top - expandY);
        const cropWidth = Math.min(displayWidth - cropLeft, frameRect.width + expandX * 2);
        const cropHeight = Math.min(displayHeight - cropTop, frameRect.height + expandY * 2);

        sx = Math.max(0, ((cropLeft + offsetX) / renderedWidth) * sourceWidth);
        sy = Math.max(0, ((cropTop + offsetY) / renderedHeight) * sourceHeight);
        sw = Math.min(sourceWidth - sx, (cropWidth / renderedWidth) * sourceWidth);
        sh = Math.min(sourceHeight - sy, (cropHeight / renderedHeight) * sourceHeight);
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.min(maxWidth, sw);
      canvas.height = Math.round((canvas.width / sw) * sh);
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', quality).split(',')[1] || null;
    } catch { return null; }
  };

  const captureLabelPhoto = async () => {
    if (!pendingBarcode) return;
    setLabelCaptureBusy(true);
    setLabelCaptureHint('Capturing still photo...');

    try {
      const imageBase64 = captureFrame({ quality: 0.9, maxWidth: 2200, target: 'full' });
      const focusImageBase64 = captureFrame({ quality: 0.94, maxWidth: 1800, target: 'focus' });

      if (!imageBase64) {
        setLabelCaptureHint('Could not capture photo. Hold steady and try again.');
        return;
      }

      setCapturedLabelPayload({
        imageBase64,
        focusImageBase64,
      });
      setCapturedLabelPreview(`data:image/jpeg;base64,${imageBase64}`);
      setLabelCaptureHint('Photo captured. Use it or retake it.');
    } finally {
      setLabelCaptureBusy(false);
    }
  };

  const retakeLabelPhoto = () => {
    setCapturedLabelPreview('');
    setCapturedLabelPayload(null);
    setLabelCaptureHint('Retake the full AWB photo.');
  };

  const submitLockedBarcode = async (withPhoto = true) => {
    if (!pendingBarcode || !socketRef.current) return;
    if (withPhoto && !capturedLabelPayload?.imageBase64) {
      setLabelCaptureHint('Capture the label photo first.');
      return;
    }
    setLabelCaptureBusy(true);
    setLabelCaptureHint(withPhoto ? 'Sending captured photo to OCR...' : 'Sending barcode only...');

    try {
      const imageBase64 = withPhoto ? capturedLabelPayload?.imageBase64 || null : null;
      const focusImageBase64 = withPhoto ? capturedLabelPayload?.focusImageBase64 || null : null;
      socketRef.current.emit('scanner:scan', { awb: pendingBarcode, imageBase64, focusImageBase64 });
      setScanCount((c) => c + 1);
      setLastAwb(pendingBarcode);
      setAwaitingLabelCapture(false);
      setPendingBarcode('');
      setCapturedLabelPreview('');
      setCapturedLabelPayload(null);
      scannerPausedRef.current = false;
      scanbotHandleRef.current?.resumeDetection?.();
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
      setCameraReady(false);
      setScannerEngine('scanbot');

      try {
        const sdk = await ensureScanbotSdk();
        const container = scanbotContainerRef.current;
        if (!container) throw new Error('Premium scanner surface unavailable.');

        const handle = await sdk.createBarcodeScanner({
          container,
          preferredCamera: 'environment',
          previewMode: 'FIT_IN',
          captureDelay: 80,
          fpsLimit: 120,
          enable4kStream: true,
          desiredRecognitionResolution: 1440,
          videoConstraints: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          onError: (error) => {
            const message = error?.message || 'Premium scanner hit a camera error.';
            setCameraError(message);
          },
          onBarcodesDetected: ({ barcodes = [] }) => {
            if (scannerPausedRef.current) return;
            const detected = barcodes
              .map((item) => normalizeDetectedBarcode(item?.text))
              .find(Boolean);
            if (!detected) return;

            const now = Date.now();
            if (scanBusyRef.current) return;
            if (now < scanLockUntilRef.current && detected === lastDecodedRef.current) return;

            scanBusyRef.current = true;
            scanLockUntilRef.current = now + 350;
            lastDecodedRef.current = detected;
            scannerPausedRef.current = true;
            handle.pauseDetection();

            setCameraError('');
            setFlashFeedback('success');
            vibrate([40]);
            playBeep(1050, 0.05);
            setTimeout(() => setFlashFeedback(null), 320);
            setLastAwb(detected);
            setPendingBarcode(detected);
            setAwaitingLabelCapture(true);
            setLabelCaptureHint('Barcode locked. Capture the AWB photo next.');

            scanBusyRef.current = false;
          },
          scannerConfiguration: {
            engineMode: 'NEXT_GEN',
            minimumTextLength: 8,
            maximumTextLength: 18,
            barcodeFormatConfigurations: [
              {
                _type: 'BarcodeFormatCommonOneDConfiguration',
                formats: ['CODE_128', 'CODE_39', 'CODE_93', 'CODABAR', 'ITF'],
                regexFilter: COURIER_SCAN_REGEX,
                minimumNumberOfRequiredFramesWithEqualRecognitionResult: 1,
                minimumTextLength: 8,
                maximumTextLength: 18,
                oneDConfirmationMode: 'MINIMAL',
              },
            ],
          },
        });

        scanbotHandleRef.current = handle;
        handle.setFinderVisible(false);
        const liveVideo = await waitForScanbotVideo();
        await waitForVideoReady(liveVideo);
        setCameraReady(true);
        setCameraStarting(false);
        return liveVideo;
      } catch (scanbotError) {
        console.debug('Scanbot unavailable, falling back to ZXing', scanbotError);
        setScannerEngine('zxing');
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
          BarcodeFormat.CODABAR,
          BarcodeFormat.ITF,
          BarcodeFormat.CODE_93,
        ]);

        const scanner = new BrowserMultiFormatReader(hints, {
          delayBetweenScanAttempts: 25,
          delayBetweenScanSuccess: 80,
        });
        scannerRef.current = scanner;
        video.srcObject = stream;
        video.muted = true;
        video.defaultMuted = true;
        video.setAttribute('playsinline', 'true');
        video.setAttribute('webkit-playsinline', 'true');
        await video.play();
        await waitForVideoReady(video);
        setCameraReady(true);
        setCameraStarting(false);
        setCameraError('Premium scanner unavailable right now. Running compatibility mode.');

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
          const awb = normalizeDetectedBarcode(result.getText());
          const now = Date.now();
          if (!awb) return;
          if (scanBusyRef.current) return;
          if (now < scanLockUntilRef.current && awb === lastDecodedRef.current) return;

          scanBusyRef.current = true;
          scanLockUntilRef.current = now + 450;
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
      }
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
      <div className="msc-camera-wrap" ref={cameraWrapRef}>
        <div
          ref={scanbotContainerRef}
          className={`msc-scanbot-host ${cameraActive && scannerEngine === 'scanbot' ? 'msc-scanbot-host-active' : ''}`}
        />
        <video
          ref={videoRef}
          className={`msc-video ${cameraActive && scannerEngine === 'zxing' ? 'msc-video-active' : 'msc-video-idle'}`}
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
                  {cameraReady ? (scannerEngine === 'scanbot' ? 'Premium camera live' : 'Compatibility camera live') : 'Opening rear camera'}
                </div>
                <div className={`msc-overlay-chip ${cameraReady ? 'ready' : ''}`}>
                  <Aperture size={14} />
                  {cameraReady ? (scannerEngine === 'scanbot' ? 'Fast barcode lock' : 'Aim at AWB barcode') : 'Waking camera'}
                </div>
              </div>
              <div className="msc-scan-frame" ref={scanFrameRef}>
                <div className="msc-corner msc-tl" />
                <div className="msc-corner msc-tr" />
                <div className="msc-corner msc-bl" />
                <div className="msc-corner msc-br" />
                <div className="msc-scan-line" />
              </div>
              <div className="msc-overlay-tip">
                {awaitingLabelCapture
                  ? capturedLabelPreview
                    ? 'Still photo captured. Use it or retake it before OCR.'
                    : 'Barcode locked. Hold full AWB in view and tap Capture Label.'
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
          <div className="msc-sheet-body">
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
        </div>
      )}

      {cameraActive && awaitingLabelCapture && (
        <div className="msc-capture-panel">
          <div className="msc-capture-title">Barcode: {pendingBarcode || 'LOCKED'}</div>
          <div className="msc-capture-sub">
            {capturedLabelPreview
              ? 'This still image will be sent to OCR. Retake if the label is blurry or cropped.'
              : 'Take one clear full-label photo so OCR can extract all fields.'}
          </div>
          {capturedLabelPreview ? (
            <div className="msc-preview-shell">
              <img src={capturedLabelPreview} alt="Captured AWB label" className="msc-preview-image" />
            </div>
          ) : null}
          <div className="msc-capture-actions">
            {capturedLabelPreview ? (
              <>
                <button type="button" className="msc-capture-secondary" onClick={retakeLabelPhoto} disabled={labelCaptureBusy}>
                  Retake Photo
                </button>
                <button type="button" className="msc-capture-primary" onClick={() => submitLockedBarcode(true)} disabled={labelCaptureBusy}>
                  {labelCaptureBusy ? <><Aperture size={16} /> Sending...</> : <><Save size={16} /> Use Photo</>}
                </button>
              </>
            ) : (
              <button type="button" className="msc-capture-primary" onClick={captureLabelPhoto} disabled={labelCaptureBusy}>
                {labelCaptureBusy ? <><Aperture size={16} /> Capturing...</> : <><Camera size={16} /> Capture Label</>}
              </button>
            )}
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
          background:
            radial-gradient(circle at top, rgba(14,165,233,0.12), transparent 28%),
            linear-gradient(180deg, #f8fbff 0%, #eef6ff 100%);
          color: #0f172a;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: background 0.3s;
          position: relative;
        }
        .msc-flash-success {
          background:
            radial-gradient(circle at top, rgba(34,197,94,0.16), transparent 28%),
            linear-gradient(180deg, #f3fff7 0%, #eafff1 100%) !important;
        }
        .msc-flash-error {
          background:
            radial-gradient(circle at top, rgba(248,113,113,0.14), transparent 28%),
            linear-gradient(180deg, #fff7f7 0%, #fff1f1 100%) !important;
        }

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
          background: rgba(15,23,42,0.92);
          border-bottom: 1px solid rgba(148,163,184,0.2);
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
          background: linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%);
          overflow: hidden;
          min-height: 0;
          isolation: isolate;
        }
        .msc-scanbot-host {
          position: absolute;
          inset: 0;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.18s ease;
          z-index: 0;
        }
        .msc-scanbot-host-active {
          opacity: 1;
          pointer-events: auto;
        }
        .msc-scanbot-host video,
        .msc-scanbot-host canvas {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          display: block;
        }
        .msc-capture-panel {
          position: absolute;
          left: 0.75rem;
          right: 0.75rem;
          bottom: calc(0.5rem + env(safe-area-inset-bottom));
          z-index: 35;
          border-radius: 24px;
          border: 1px solid rgba(125,211,252,0.28);
          background: linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(241,245,249,0.98) 100%);
          backdrop-filter: blur(18px);
          padding: 0.85rem;
          box-shadow: 0 24px 60px rgba(15,23,42,0.18);
          max-height: min(44vh, 360px);
          overflow-y: auto;
        }
        .msc-capture-title {
          color: #0f4c81;
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-family: 'SF Mono', 'Fira Code', monospace;
        }
        .msc-capture-sub {
          margin-top: 0.35rem;
          color: #334155;
          font-size: 0.68rem;
          font-weight: 700;
          line-height: 1.4;
        }
        .msc-capture-actions {
          display: flex;
          gap: 0.6rem;
          margin-top: 0.7rem;
          flex-wrap: wrap;
        }
        .msc-preview-shell {
          margin-top: 0.75rem;
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(148,163,184,0.2);
          background: #ffffff;
          max-height: 240px;
        }
        .msc-preview-image {
          width: 100%;
          display: block;
          object-fit: contain;
          max-height: 240px;
          background: #f8fafc;
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
          background: linear-gradient(135deg, #0ea5e9, #22c55e);
          box-shadow: 0 12px 24px rgba(14,165,233,0.22);
        }
        .msc-capture-secondary {
          color: #334155;
          background: rgba(226,232,240,0.9);
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
          background: rgba(255,255,255,0.96);
          color: #0369a1;
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
          bottom: calc(4.7rem + env(safe-area-inset-bottom));
          z-index: 40;
          margin: 0 0.85rem;
          border-radius: 26px 26px 22px 22px;
          background: linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.98) 100%);
          border: 1px solid rgba(125,211,252,0.24);
          box-shadow: 0 24px 64px rgba(15,23,42,0.18);
          backdrop-filter: blur(20px);
          max-height: min(62vh, 560px);
          overflow: hidden;
        }
        .msc-sheet-body {
          padding: 0.2rem 0.9rem 1rem;
          max-height: calc(min(62vh, 560px) - 12px);
          overflow-y: auto;
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
          color: #0284c7;
          font-size: 0.62rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.22em;
        }
        .msc-sheet-title {
          margin-top: 0.35rem;
          color: #0f172a;
          font-size: 0.92rem;
          font-weight: 800;
          line-height: 1.35;
        }
        .msc-sheet-close {
          width: 2rem;
          height: 2rem;
          border-radius: 999px;
          border: none;
          background: rgba(226,232,240,0.9);
          color: #475569;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .msc-sheet-awb {
          color: #0f172a;
          font-size: 1rem;
          font-weight: 900;
          font-family: 'SF Mono', 'Fira Code', monospace;
          margin-bottom: 0.55rem;
        }
        .msc-sheet-message {
          margin-bottom: 0.75rem;
          color: #64748b;
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
          color: #64748b;
          font-size: 0.58rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.16em;
        }
        .msc-sheet-grid label input {
          width: 100%;
          border-radius: 14px;
          border: 1px solid rgba(148,163,184,0.18);
          background: rgba(255,255,255,0.96);
          color: #0f172a;
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
          color: #475569;
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
          background: #cbd5e1;
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
          height: 100%; gap: 1rem; color: #64748b;
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
          background: rgba(255,255,255,0.88);
          border: 1px solid rgba(148,163,184,0.22);
          color: #334155;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .msc-overlay-chip.ready {
          color: #047857;
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
          background: rgba(255,255,255,0.9);
          border: 1px solid rgba(148,163,184,0.18);
          color: #334155;
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
          background: rgba(255,255,255,0.92);
          border-top: 1px solid rgba(148,163,184,0.18);
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
        .msc-awb-text { color: #0f172a; }
        .msc-client-badge {
          display: flex; align-items: center; gap: 0.25rem;
          padding: 0.25rem 0.6rem;
          border-radius: 8px;
          background: rgba(14,165,233,0.12);
          color: #0369a1;
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
          color: #0f172a;
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
          background: linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(248,250,252,0.96) 30%, #ffffff 100%);
          border-top: 1px solid rgba(148,163,184,0.18);
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
            bottom: calc(4.5rem + env(safe-area-inset-bottom));
            max-height: min(58vh, 520px);
          }
          .msc-sheet-body {
            padding: 0.15rem 0.8rem 0.95rem;
            max-height: calc(min(58vh, 520px) - 12px);
          }
          .msc-capture-panel {
            left: 0.55rem;
            right: 0.55rem;
            bottom: calc(0.35rem + env(safe-area-inset-bottom));
            padding: 0.72rem;
            max-height: min(42vh, 340px);
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
