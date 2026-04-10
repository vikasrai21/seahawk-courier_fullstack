
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ScanLine,
  Camera,
  Brain,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
  Zap,
  X,
  Clipboard,
  Package,
  History,
  Info,
  ShieldCheck,
  ChevronRight,
  FileSpreadsheet,
  Upload,
  Copy,
  ExternalLink,
  Repeat,
  Database,
  Radar,
  Smartphone,
  Wifi,
  WifiOff,
  QrCode,
  Save,
  Edit,
  Table,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { exportJsonToExcel, readExcelAsJson } from '../utils/excel';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import { generateQRCodeDataURL } from '../utils/qrcode';

const playSuccess = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {
    console.debug('Success tone failed', e);
  }
};

const playError = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (e) {
    console.debug('Error tone failed', e);
  }
};

const findAwbColumn = (row = {}) => {
  const keys = Object.keys(row);
  return keys.find((key) => /^(awb|airwaybill|tracking|trackingnumber|cnno|consignment|docket)$/i.test(String(key).replace(/\s+/g, '')));
};

const extractAwbsFromData = (rows) => {
  if (!rows || !rows.length) return [];

  const awbColumn = findAwbColumn(rows[0]);
  if (awbColumn) {
    return rows
      .map((row) => String(row[awbColumn] || '').trim())
      .filter(Boolean);
  }

  return rows
    .flatMap((row) => Object.values(row))
    .map((value) => String(value || '').trim())
    .filter(Boolean)
    .filter((value) => /^(?:\d{12,14}|[A-Z]{1,2}\d{8,10})$/i.test(value));
};

const getCaptureTone = (scan) => {
  const source = scan?.meta?.source;
  if (source === 'captured_placeholder') return 'Captured';
  if (source === 'local_existing') return 'Local Match';
  return 'Live Sync';
};

const buildScanEntry = (awb, courier, shipment, meta = {}, error = null) => ({
  awb,
  courier: shipment?.courier || courier,
  status: error ? 'error' : 'success',
  data: shipment,
  meta,
  error,
  timestamp: new Date(),
});

const extractOrderNo = (shipment = {}, meta = {}) => {
  const raw = String(
    meta?.ocrExtracted?.orderNo
    || meta?.orderNo
    || shipment?.orderNo
    || ''
  ).trim();
  if (raw) return raw;
  const remarks = String(shipment?.remarks || '');
  const match = remarks.match(/ORDER_NO:([^|]+)/i);
  return match ? String(match[1] || '').trim() : '';
};

const buildIntakeRow = (shipment = {}, meta = {}, awbValue = '') => {
  const dateStr = shipment?.date || new Date().toISOString().slice(0, 10);
  const parts = dateStr.split('-');
  const formattedDate = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : dateStr;
  return {
    date: formattedDate,
    clientCode: shipment?.clientCode || meta?.clientSuggestion?.suggestedClientCode || 'MISC',
    awb: awbValue || shipment?.awb || '',
    consignee: shipment?.consignee || '',
    destination: shipment?.destination || '',
    pincode: shipment?.pincode || meta?.ocrExtracted?.pincode || '',
    weight: Number(shipment?.weight || 0).toFixed(3),
    amount: shipment?.amount ? Number(shipment.amount) : '',
    courier: (shipment?.courier || '').toUpperCase(),
    orderNo: extractOrderNo(shipment, meta),
  };
};

const normalizeCompareValue = (value, fallback = 'Not captured') => {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
};

const reviewDiffFields = (reviewScan, reviewForm) => {
  if (!reviewScan) return [];

  const suggestedClientCode = reviewScan.meta?.clientSuggestion?.suggestedClientCode || reviewScan.shipment?.clientCode || '';
  const suggestedClientName = reviewScan.meta?.clientSuggestion?.suggestedClientName || reviewScan.shipment?.client?.company || '';

  return [
    {
      key: 'client',
      label: 'Client',
      scanned: suggestedClientName ? `${suggestedClientCode || 'MISC'} - ${suggestedClientName}` : (suggestedClientCode || 'MISC'),
      final: reviewForm.clientCode || 'MISC',
    },
    {
      key: 'consignee',
      label: 'Consignee',
      scanned: normalizeCompareValue(reviewScan.shipment?.consignee),
      final: normalizeCompareValue(reviewForm.consignee),
    },
    {
      key: 'destination',
      label: 'Destination',
      scanned: normalizeCompareValue(reviewScan.shipment?.destination),
      final: normalizeCompareValue(reviewForm.destination),
    },
    {
      key: 'weight',
      label: 'Weight',
      scanned: reviewScan.shipment?.weight ? `${reviewScan.shipment.weight} kg` : 'Not captured',
      final: reviewForm.weight ? `${reviewForm.weight} kg` : 'Not set',
    },
    {
      key: 'amount',
      label: 'Declared Value',
      scanned: reviewScan.shipment?.amount ? `₹${reviewScan.shipment.amount}` : 'Not captured',
      final: reviewForm.amount ? `₹${reviewForm.amount}` : 'Not set',
    },
  ].map((field) => ({
    ...field,
    changed: field.scanned.trim().toUpperCase() !== field.final.trim().toUpperCase(),
  }));
};

const BARCODE_FORMATS = [
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.CODE_93,
  BarcodeFormat.ITF,
  BarcodeFormat.CODABAR,
  BarcodeFormat.EAN_13,
  BarcodeFormat.EAN_8,
  BarcodeFormat.UPC_A,
  BarcodeFormat.UPC_E,
  BarcodeFormat.PDF_417,
];

const createBarcodeHints = () => {
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, BARCODE_FORMATS);
  hints.set(DecodeHintType.TRY_HARDER, true);
  hints.set(DecodeHintType.ASSUME_GS1, true);
  return hints;
};

export default function ScanAWBPage({ toast }) {
  const navigate = useNavigate();
  const { isAdmin, hasRole } = useAuth();
  const canScan = isAdmin || hasRole('OPS_MANAGER') || hasRole('STAFF');
  const [awb, setAwb] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [scanMode, setScanMode] = useState('single');
  const [courier, setCourier] = useState('AUTO');
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scannerStage, setScannerStage] = useState('idle'); // idle | barcode | document | processing
  const [recentScans, setRecentScans] = useState([]);
  const [capturedShipment, setCapturedShipment] = useState(null);
  const [capturedMeta, setCapturedMeta] = useState(null);
  const [lastFeedback, setLastFeedback] = useState(null);
  const [continuousScan, setContinuousScan] = useState(true);
  const [smartAssist, setSmartAssist] = useState(true);
  const [pendingDecoded, setPendingDecoded] = useState('');
  const [spreadsheetName, setSpreadsheetName] = useState('');
  // ── Mobile Bridge State ──────────────────────────────────────────────
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [mobilePIN, setMobilePIN] = useState('');
  const [mobileStatus, setMobileStatus] = useState('idle'); // idle | waiting | connected | disconnected
  const [mobileScanCount, setMobileScanCount] = useState(0);
  const [mobileSessionStartedAt, setMobileSessionStartedAt] = useState(null);
  const [mobileQRData, setMobileQRData] = useState('');
  const { socket, connected: socketConnected } = useSocket();
  const [reviewQueue, setReviewQueue] = useState([]);
  const [reviewForm, setReviewForm] = useState({ clientCode: '', consignee: '', destination: '', pincode: '', weight: 0, amount: 0, orderNo: '' });
  const [savingReview, setSavingReview] = useState(false);
  const [approvedRows, setApprovedRows] = useState([]);
  const inputRef = useRef(null);
  const spreadsheetInputRef = useRef(null);
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const scanBusyRef = useRef(false);
  const scanLockUntilRef = useRef(0);
  const lastDecodedRef = useRef('');

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const reviewScan = reviewQueue[0] || null;
  const pendingReviewCount = reviewQueue.length;
  const reviewComparison = reviewDiffFields(reviewScan, reviewForm);

  const notifyMobileReadyForNext = useCallback(() => {
    if (!socket || mobileStatus !== 'connected' || !mobilePIN) return;
    socket.emit('scanner:ready-for-next', { pin: mobilePIN });
  }, [socket, mobileStatus, mobilePIN]);

  useEffect(() => {
    if (!reviewScan) {
      setReviewForm({ clientCode: '', consignee: '', destination: '', pincode: '', weight: 0, amount: 0, orderNo: '' });
      return;
    }

    const suggestedCode = reviewScan.meta?.clientSuggestion?.suggestedClientCode || reviewScan.shipment?.clientCode || 'MISC';
    setReviewForm({
      clientCode: suggestedCode,
      consignee: reviewScan.shipment?.consignee || '',
      destination: reviewScan.shipment?.destination || '',
      pincode: reviewScan.shipment?.pincode || reviewScan.meta?.ocrExtracted?.pincode || '',
      weight: reviewScan.shipment?.weight || 0,
      amount: reviewScan.shipment?.amount || 0,
      orderNo: extractOrderNo(reviewScan.shipment, reviewScan.meta),
    });
  }, [reviewScan]);

  const triggerFeedback = (type) => {
    setLastFeedback(type);
    setTimeout(() => setLastFeedback(null), 1000);
  };

  const resetScannerFlow = useCallback((keepCamera = false) => {
    scanBusyRef.current = false;
    scanLockUntilRef.current = 0;
    lastDecodedRef.current = '';
    setPendingDecoded('');
    setScannerStage(keepCamera ? 'barcode' : 'idle');
    if (!keepCamera) {
      setCameraActive(false);
    }
  }, []);

  const stopCamera = async () => {
    try {
      await scannerRef.current?.reset();
    } catch (err) {
      console.debug('Camera reset failed', err);
    }
    scannerRef.current = null;
    resetScannerFlow(false);
  };

  useEffect(() => () => {
    stopCamera();
  }, []);

  const addRecentScan = (entry) => {
    setRecentScans((prev) => [entry, ...prev].slice(0, 100));
  };

  const addApprovedRow = (shipment, meta = {}, awbValue = '') => {
    const row = buildIntakeRow(shipment, meta, awbValue);
    setApprovedRows((prev) => [row, ...prev].slice(0, 120));
    return row;
  };

  const queueReviewScan = (entry) => {
    setReviewQueue((prev) => [...prev, entry]);
  };

  const buildApprovalPayload = (fields = {}, fallbackScan = null) => ({
    clientCode: String(fields.clientCode || fallbackScan?.meta?.clientSuggestion?.suggestedClientCode || fallbackScan?.shipment?.clientCode || 'MISC').trim().toUpperCase(),
    consignee: String(fields.consignee || fallbackScan?.shipment?.consignee || '').trim().toUpperCase(),
    destination: String(fields.destination || fallbackScan?.shipment?.destination || '').trim().toUpperCase(),
    pincode: String(fields.pincode || fallbackScan?.shipment?.pincode || fallbackScan?.meta?.ocrExtracted?.pincode || '').trim(),
    weight: parseFloat(fields.weight ?? fallbackScan?.shipment?.weight ?? 0) || 0,
    amount: parseFloat(fields.amount ?? fallbackScan?.shipment?.amount ?? 0) || 0,
    orderNo: String(fields.orderNo || extractOrderNo(fallbackScan?.shipment, fallbackScan?.meta) || '').trim(),
  });

  const updateShipmentFromApproval = async (approval, fallbackScan = null) => {
    const shipmentId = approval?.shipmentId || fallbackScan?.shipment?.id;
    if (!shipmentId) throw new Error('No shipment found for approval.');

    const normalized = buildApprovalPayload(approval?.fields || approval || {}, fallbackScan);
    const remarksBase = String(fallbackScan?.shipment?.remarks || '');
    const remarksWithoutOrder = remarksBase.replace(/\s*\|\s*ORDER_NO:[^|]+/gi, '').replace(/^ORDER_NO:[^|]+\s*\|?\s*/i, '').trim();
    const nextRemarks = normalized.orderNo
      ? `${remarksWithoutOrder}${remarksWithoutOrder ? ' | ' : ''}ORDER_NO:${normalized.orderNo}`
      : remarksWithoutOrder;

    const payload = await api.put(`/shipments/${shipmentId}`, {
      clientCode: normalized.clientCode,
      consignee: normalized.consignee,
      destination: normalized.destination,
      pincode: normalized.pincode,
      weight: normalized.weight,
      amount: normalized.amount,
      remarks: nextRemarks,
    });

    return {
      shipment: payload.data,
      normalized,
    };
  };

  // ── Mobile Bridge: create session & listen for remote scans ──────────
  const startMobileSession = useCallback(() => {
    if (!socket || !socketConnected) {
      toast?.('WebSocket not connected. Please refresh.', 'error');
      return;
    }
    if (mobilePIN && mobileStatus !== 'idle') {
      setShowMobileModal(true);
      return;
    }
    socket.emit('scanner:create-session', (response) => {
      if (response?.success) {
        const pin = response.pin;
        setMobilePIN(pin);
        setMobileStatus('waiting');
        setMobileScanCount(0);
        setMobileSessionStartedAt(Date.now());
        // Generate QR code with mobile scanner URL
        const baseUrl = window.location.origin;
        const scannerUrl = `${baseUrl}/mobile-scanner/${pin}`;
        try {
          setMobileQRData(generateQRCodeDataURL(scannerUrl, 280));
        } catch {
          setMobileQRData('');
        }
        setShowMobileModal(true);
      } else {
        toast?.('Could not create scan session', 'error');
      }
    });
  }, [socket, socketConnected, toast, mobilePIN, mobileStatus]);

  const hideMobileModal = useCallback(() => {
    setShowMobileModal(false);
  }, []);

  const endMobileSession = useCallback(() => {
    socket?.emit('scanner:end-session');
    setMobileStatus('idle');
    setMobilePIN('');
    setMobileQRData('');
    setMobileSessionStartedAt(null);
    setShowMobileModal(false);
  }, [socket]);

  // Listen for mobile bridge socket events
  useEffect(() => {
    if (!socket) return;

    const onPhoneConnected = ({ pin }) => {
      setMobileStatus('connected');
      setShowMobileModal(false);
      playSuccess();
      toast?.('📱 Mobile phone connected! Start scanning barcodes.', 'success');
    };

    const onPhoneDisconnected = ({ totalScans }) => {
      setMobileStatus('disconnected');
      toast?.(`📱 Phone disconnected. ${totalScans} scans completed.`, 'warning');
    };

    const onRemoteScan = async ({ awb, imageBase64, focusImageBase64, scanNumber }) => {
      if (!awb) return;
      setMobileScanCount((prev) => scanNumber || prev + 1);
      await processSingleScan(awb, imageBase64, focusImageBase64);
    };

    const onApprovalSubmitted = async (approval) => {
      const queuedScan = reviewQueue.find((item) => item.shipment?.id === approval?.shipmentId || item.awb === approval?.awb) || null;

      try {
        const { shipment, normalized } = await updateShipmentFromApproval(approval, queuedScan);
        playSuccess();
        toast?.(`Approved on mobile: ${shipment.awb}`, 'success');
        addRecentScan(buildScanEntry(shipment.awb, shipment.courier, shipment, queuedScan?.meta || {}));
        const intakeRow = addApprovedRow(shipment, queuedScan?.meta || {}, shipment.awb);
        setCapturedShipment(shipment);
        setCapturedMeta(queuedScan?.meta || null);
        setReviewQueue((prev) => prev.filter((item) => item.shipment?.id !== shipment.id && item.awb !== shipment.awb));
        socket.emit('scanner:approval-result', {
          pin: mobilePIN,
          shipmentId: shipment.id,
          awb: shipment.awb,
          success: true,
          message: 'Shipment approved and saved.',
        });
        socket.emit('scanner:intake-preview', { pin: mobilePIN, intakeRow });
        socket.emit('scanner:scan-processed', {
          pin: mobilePIN,
          awb: shipment.awb,
          shipmentId: shipment.id,
          status: 'success',
          clientCode: normalized.clientCode,
          clientName: shipment.client?.company || normalized.clientCode,
          consignee: normalized.consignee,
          destination: normalized.destination,
          pincode: normalized.pincode,
          weight: normalized.weight,
          amount: normalized.amount,
          orderNo: normalized.orderNo,
          reviewRequired: false,
        });
      } catch (err) {
        toast?.(err.message || 'Mobile approval could not be saved.', 'error');
        socket.emit('scanner:approval-result', {
          pin: mobilePIN,
          shipmentId: approval?.shipmentId || null,
          awb: approval?.awb,
          success: false,
          message: err.message || 'Desktop save failed.',
        });
      }
    };

    socket.on('scanner:phone-connected', onPhoneConnected);
    socket.on('scanner:phone-disconnected', onPhoneDisconnected);
    socket.on('scanner:remote-scan', onRemoteScan);
    socket.on('scanner:approval-submitted', onApprovalSubmitted);

    return () => {
      socket.off('scanner:phone-connected', onPhoneConnected);
      socket.off('scanner:phone-disconnected', onPhoneDisconnected);
      socket.off('scanner:remote-scan', onRemoteScan);
      socket.off('scanner:approval-submitted', onApprovalSubmitted);
    };
  }, [socket, mobilePIN, reviewQueue]);

  const captureDocumentFrames = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return null;
    try {
      const sourceWidth = video.videoWidth;
      const sourceHeight = video.videoHeight;

      const fullCanvas = document.createElement('canvas');
      fullCanvas.width = Math.min(1600, sourceWidth);
      fullCanvas.height = Math.max(1, Math.round((fullCanvas.width / sourceWidth) * sourceHeight));
      const fullCtx = fullCanvas.getContext('2d');
      if (!fullCtx) return null;
      fullCtx.drawImage(video, 0, 0, fullCanvas.width, fullCanvas.height);

      const cropRatio = 1.58;
      let cropWidth = sourceWidth;
      let cropHeight = Math.round(cropWidth / cropRatio);
      if (cropHeight > sourceHeight) {
        cropHeight = sourceHeight;
        cropWidth = Math.round(cropHeight * cropRatio);
      }

      const cropX = Math.max(0, Math.round((sourceWidth - cropWidth) / 2));
      const cropY = Math.max(0, Math.round((sourceHeight - cropHeight) / 2));
      const focusCanvas = document.createElement('canvas');
      focusCanvas.width = Math.min(1600, cropWidth);
      focusCanvas.height = Math.max(1, Math.round((focusCanvas.width / cropWidth) * cropHeight));
      const focusCtx = focusCanvas.getContext('2d');
      if (!focusCtx) return null;
      focusCtx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, focusCanvas.width, focusCanvas.height);

      return {
        imageBase64: fullCanvas.toDataURL('image/jpeg', 0.78).split(',')[1] || null,
        focusImageBase64: focusCanvas.toDataURL('image/jpeg', 0.86).split(',')[1] || null,
      };
    } catch (_err) {
      return null;
    }
  };

  const processSingleScan = async (rawAwb, imageBase64 = null, focusImageBase64 = null) => {
    const currentAwb = String(rawAwb || '').trim();
    if (!currentAwb) return null;

    setLoading(true);
    setAwb(currentAwb);
    setCameraError('');

    try {
      const payload = await api.post('/shipments/scan', {
        awb: currentAwb,
        courier,
        captureOnly: true,
        ...(smartAssist && imageBase64 ? { imageBase64 } : {}),
        ...(smartAssist && focusImageBase64 ? { focusImageBase64 } : {}),
      });
      const result = payload?.data || {};
      const shipment = result.shipment || null;
      const meta = result.meta || {};
      playSuccess();
      triggerFeedback('success');
      setCapturedShipment(shipment);
      setCapturedMeta(meta);

      if (scanMode === 'single' || imageBase64) {
        queueReviewScan({ awb: currentAwb, courier, shipment, meta });
        toast?.(`Captured ${currentAwb} - queued for review`, 'info');
        if (imageBase64 && mobileStatus === 'connected') {
          const mobileDraft = buildApprovalPayload({
            clientCode: meta?.clientSuggestion?.suggestedClientCode || shipment?.clientCode || '',
            consignee: shipment?.consignee || '',
            destination: shipment?.destination || '',
            pincode: shipment?.pincode || meta?.ocrExtracted?.pincode || '',
            weight: shipment?.weight || 0,
            amount: shipment?.amount || 0,
            orderNo: extractOrderNo(shipment, meta),
          });
          socket.emit('scanner:scan-processed', {
            pin: mobilePIN,
            awb: currentAwb,
            shipmentId: shipment?.id || null,
            status: 'pending_review',
            clientCode: mobileDraft.clientCode,
            clientName: meta?.clientSuggestion?.suggestedClientName || shipment?.client?.company || '',
            consignee: mobileDraft.consignee,
            destination: mobileDraft.destination,
            pincode: mobileDraft.pincode,
            weight: mobileDraft.weight,
            amount: mobileDraft.amount,
            orderNo: mobileDraft.orderNo,
            reviewRequired: true,
          });
        }
        return { mode: 'review', awb: currentAwb, shipment, meta };
      } else {
        addRecentScan(buildScanEntry(currentAwb, courier, shipment, meta));
        return { mode: 'captured', awb: currentAwb, shipment, meta };
      }
    } catch (err) {
      playError();
      triggerFeedback('error');
      setCameraError(err.message || 'Scan failed');
      addRecentScan(buildScanEntry(currentAwb, courier, null, {}, err.message || 'Scan failed'));
      if (imageBase64 && mobileStatus === 'connected') {
        socket.emit('scanner:scan-processed', {
          pin: mobilePIN,
          awb: currentAwb,
          status: 'error',
          error: err.message || 'Scan failed',
        });
      }
      return { mode: 'error', awb: currentAwb, error: err.message || 'Scan failed' };
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  };

  const saveActiveReview = async (e) => {
    if (e) e.preventDefault();
    if (!reviewScan || !reviewScan.shipment?.id) return;
    
    setSavingReview(true);
    try {
      const payload = await api.put(`/shipments/${reviewScan.shipment.id}`, {
        clientCode: reviewForm.clientCode,
        consignee: reviewForm.consignee,
        destination: reviewForm.destination,
        pincode: reviewForm.pincode,
        weight: parseFloat(reviewForm.weight) || 0,
        amount: parseFloat(reviewForm.amount) || 0,
        remarks: reviewForm.orderNo
          ? `${String(reviewScan.shipment?.remarks || '').replace(/\s*\|\s*ORDER_NO:[^|]+/gi, '').replace(/^ORDER_NO:[^|]+\s*\|?\s*/i, '').trim()}${String(reviewScan.shipment?.remarks || '').replace(/\s*\|\s*ORDER_NO:[^|]+/gi, '').replace(/^ORDER_NO:[^|]+\s*\|?\s*/i, '').trim() ? ' | ' : ''}ORDER_NO:${reviewForm.orderNo}`
          : String(reviewScan.shipment?.remarks || '').replace(/\s*\|\s*ORDER_NO:[^|]+/gi, '').replace(/^ORDER_NO:[^|]+\s*\|?\s*/i, '').trim(),
      });
      
      const updatedShipment = payload.data;
      if (updatedShipment) {
        playSuccess();
        toast?.(`Verified & Saved: ${reviewScan.awb}`, 'success');
        addRecentScan(buildScanEntry(reviewScan.awb, reviewScan.courier, updatedShipment, reviewScan.meta));
        addApprovedRow(updatedShipment, reviewScan.meta, reviewScan.awb);
        
        // Let the phone know it successfully finished
        if (mobileStatus === 'connected') {
           socket.emit('scanner:scan-processed', {
             pin: mobilePIN,
             awb: reviewScan.awb,
             shipmentId: updatedShipment.id,
             status: 'success',
             clientCode: reviewForm.clientCode,
             clientName: updatedShipment.client?.company || reviewForm.clientCode,
             consignee: reviewForm.consignee,
             destination: reviewForm.destination,
             pincode: reviewForm.pincode,
             weight: parseFloat(reviewForm.weight) || 0,
             amount: parseFloat(reviewForm.amount) || 0,
             orderNo: reviewForm.orderNo || '',
             reviewRequired: false,
           });
        }
        
        setReviewQueue((prev) => prev.slice(1));
        setTimeout(() => inputRef.current?.focus(), 120);
      }
    } catch (err) {
      toast?.(err.message || 'Failed to save review', 'error');
    } finally {
      setSavingReview(false);
    }
  };

  const deferActiveReview = () => {
    if (!reviewScan) return;
    setReviewQueue((prev) => (prev.length <= 1 ? prev : [...prev.slice(1), prev[0]]));
    toast?.(`Moved ${reviewScan.awb} to the back of the review queue`, 'warning');
  };

  const removeActiveReview = () => {
    if (!reviewScan) return;
    addRecentScan(buildScanEntry(
      reviewScan.awb,
      reviewScan.courier,
      reviewScan.shipment,
      { ...(reviewScan.meta || {}), reviewDeferred: true },
    ));
    if (mobileStatus === 'connected') {
      socket.emit('scanner:scan-processed', {
        pin: mobilePIN,
        awb: reviewScan.awb,
        shipmentId: reviewScan.shipment?.id || null,
        status: 'review_deferred',
        clientCode: reviewScan.meta?.clientSuggestion?.suggestedClientCode || reviewScan.shipment?.clientCode || '',
        clientName: reviewScan.meta?.clientSuggestion?.suggestedClientName || reviewScan.shipment?.client?.company || '',
        consignee: reviewScan.shipment?.consignee || '',
        destination: reviewScan.shipment?.destination || '',
        pincode: reviewScan.shipment?.pincode || reviewScan.meta?.ocrExtracted?.pincode || '',
        weight: reviewScan.shipment?.weight || 0,
        amount: reviewScan.shipment?.amount || 0,
        orderNo: extractOrderNo(reviewScan.shipment, reviewScan.meta),
        reviewRequired: true,
      });
    }
    setReviewQueue((prev) => prev.slice(1));
    toast?.(`Deferred ${reviewScan.awb} without saving changes`, 'warning');
  };

  const startCameraScan = async () => {
    setCameraError('');

    try {
      await stopCamera();
      const scanner = new BrowserMultiFormatReader(createBarcodeHints(), 80);
      scannerRef.current = scanner;
      setCameraActive(true);
      setScannerStage('barcode');
      setPendingDecoded('');

      await scanner.decodeFromVideoDevice(undefined, videoRef.current, async (result, err) => {
        if (result) {
          const scannedValue = String(result.getText() || '').trim();
          const now = Date.now();
          if (!scannedValue) return;
          if (scanBusyRef.current) return;
          if (now < scanLockUntilRef.current && scannedValue === lastDecodedRef.current) return;

          scanBusyRef.current = true;
          scanLockUntilRef.current = now + 5000;
          lastDecodedRef.current = scannedValue;
          setAwb(scannedValue);
          setPendingDecoded(scannedValue);
          setScannerStage('document');
          playSuccess();
          triggerFeedback('success');

          return;
        }

        if (err && err.name !== 'NotFoundException') {
          setCameraError(err.message || 'Unable to read barcode from camera');
        }
      });
    } catch (err) {
      setCameraError(err.message || 'Camera access failed');
      await stopCamera();
    }
  };

  const capturePendingDocument = async () => {
    if (!pendingDecoded) return;

    const frames = smartAssist ? captureDocumentFrames() : null;
    if (smartAssist && !frames?.imageBase64 && !frames?.focusImageBase64) {
      setCameraError('Could not capture the document frame. Please try again.');
      return;
    }

    setCameraError('');
    setScannerStage('processing');

    const result = await processSingleScan(pendingDecoded, frames?.imageBase64 || null, frames?.focusImageBase64 || null);
    if (result?.mode === 'error') {
      setScannerStage('document');
      return;
    }

    setPendingDecoded('');
    scanBusyRef.current = false;
    scanLockUntilRef.current = 0;
    lastDecodedRef.current = '';

    if (!continuousScan) {
      await stopCamera();
      return;
    }

    setScannerStage('barcode');
  };

  const retakePendingBarcode = () => {
    setPendingDecoded('');
    setScannerStage(cameraActive ? 'barcode' : 'idle');
    scanBusyRef.current = false;
    scanLockUntilRef.current = 0;
    lastDecodedRef.current = '';
  };
  const handleSpreadsheetUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';

    try {
      const arrayBuffer = await file.arrayBuffer();
      const { rows } = await readExcelAsJson(arrayBuffer, 0);
      const awbs = [...new Set(extractAwbsFromData(rows))];

      if (!awbs.length) {
        toast?.('No AWB column or valid AWB values found in the sheet.', 'error');
        return;
      }

      setScanMode('bulk');
      setSpreadsheetName(file.name);
      setBulkText(awbs.join('\n'));
      toast?.(`Loaded ${awbs.length} AWBs from ${file.name}`, 'success');
    } catch (err) {
      toast?.(err.message || 'Could not read the spreadsheet.', 'error');
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (scanMode === 'single') {
      if (cameraActive && pendingDecoded) {
        await capturePendingDocument();
        return;
      }
      await processSingleScan(awb);
      return;
    }

    const awbList = [...new Set(bulkText.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean))];
    if (!awbList.length) return;

    setLoading(true);
    setCameraError('');

    try {
      const payload = await api.post('/shipments/scan-bulk', {
        awbs: awbList,
        courier,
        captureOnly: true,
      });
      const result = payload?.data || {};

      if (result.jobId) {
        toast?.(`Bulk scan queued as job #${result.jobId}`, 'success');
        addRecentScan(buildScanEntry('BULK_QUEUE', courier, {
          awb: `JOB-${result.jobId}`,
          courier,
          consignee: 'Background queue',
          destination: 'Processing',
          status: 'Booked',
        }, { source: 'bulk_queue', existed: false, trackingUnavailable: false }));
        return;
      }

      const successes = (result.successful || []).map((scan) => buildScanEntry(
        scan.awb,
        courier,
        scan.data,
        scan.meta || {},
      ));
      const failed = (result.failed || []).map((scan) => buildScanEntry(scan.awb, courier, null, {}, scan.error));

      if (successes[0]?.data) {
        setCapturedShipment(successes[0].data);
        setCapturedMeta(successes[0].meta || null);
      }

      if (successes.length) {
        playSuccess();
        triggerFeedback('success');
      }
      if (failed.length && !successes.length) {
        playError();
        triggerFeedback('error');
      }

      setRecentScans((prev) => [...successes, ...failed, ...prev].slice(0, 120));
      toast?.(`Processed ${successes.length} AWBs${failed.length ? `, ${failed.length} need attention` : ''}`, failed.length ? 'warning' : 'success');
    } catch (err) {
      playError();
      triggerFeedback('error');
      toast?.(err.message || 'Bulk scan failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const exportIntakeBatch = () => {
    const rows = approvedRows.map((row, index) => ({
      'S.NO': index + 1,
      'DATE': row.date,
      'Clients': row.clientCode,
      'Awb No': row.awb,
      'CONSIGNEE': row.consignee,
      'DESTINATION': row.destination,
      'PINCODE': row.pincode,
      'WEIGHT': row.weight,
      'AMOU': '',
      'COURIERS': row.courier,
      'ORDER NO': row.orderNo,
      'VALUE': row.amount,
    }));

    if (!rows.length) {
      toast?.('There are no successful captures to export yet.', 'error');
      return;
    }

    exportJsonToExcel(rows, `scan-intake-${new Date().toISOString().slice(0, 10)}.xlsx`, 'SCAN_INTAKE');
  };

  const copyTabularLedger = () => {
    if (!approvedRows.length) {
      toast?.('No verified scans to copy', 'warning');
      return;
    }
    const headers = ['S.NO', 'DATE', 'Clients', 'Awb No', 'CONSIGNEE', 'DESTINATION', 'PINCODE', 'WEIGHT', 'AMOU', 'COURIERS', 'ORDER NO', 'VALUE'];
    const rows = approvedRows.map((row, index) => {
      return [
        index + 1,
        row.date,
        row.clientCode,
        row.awb,
        row.consignee,
        row.destination,
        row.pincode,
        row.weight,
        '',
        row.courier,
        row.orderNo,
        row.amount
      ];
    });
    const tsv = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard?.writeText(tsv);
    toast?.(`Copied ${rows.length} rows to clipboard! Ready to paste into Excel.`, 'success');
  };

  const exportFaults = () => {
    const failed = recentScans
      .filter((scan) => scan.status === 'error')
      .map((scan) => ({
        AWB: scan.awb,
        Courier: scan.courier,
        Error: scan.error,
        Time: scan.timestamp.toLocaleString(),
      }));

    if (!failed.length) {
      toast?.('No failed scans to export right now.', 'error');
      return;
    }

    exportJsonToExcel(failed, `scan-errors-${new Date().toISOString().slice(0, 10)}.xlsx`, 'SCAN_ERRORS');
  };

  const assignClient = async (clientCode) => {
    if (!capturedShipment?.id || !clientCode) return;
    try {
      const payload = await api.put(`/shipments/${capturedShipment.id}`, { clientCode });
      const updated = payload?.data || null;
      if (!updated) return;
      setCapturedShipment(updated);
      setCapturedMeta((prev) => ({
        ...(prev || {}),
        clientSuggestion: {
          ...(prev?.clientSuggestion || {}),
          suggestedClientCode: clientCode,
          suggestedClientName: updated?.client?.company || prev?.clientSuggestion?.suggestedClientName || clientCode,
          needsConfirmation: false,
          autoAssigned: true,
        },
      }));
      setRecentScans((prev) => prev.map((scan) => {
        if (scan.awb !== updated.awb) return scan;
        return {
          ...scan,
          data: { ...(scan.data || {}), ...updated },
          meta: {
            ...(scan.meta || {}),
            clientSuggestion: {
              ...(scan.meta?.clientSuggestion || {}),
              suggestedClientCode: clientCode,
              suggestedClientName: updated?.client?.company || clientCode,
              needsConfirmation: false,
              autoAssigned: true,
            },
          },
        };
      }));
      toast?.(`Client mapped: ${clientCode}`, 'success');
    } catch (err) {
      toast?.(err.message || 'Could not assign client', 'error');
    }
  };

  const successfulCaptures = recentScans.filter((scan) => scan.status === 'success').length;
  const pendingSync = recentScans.filter((scan) => scan.meta?.trackingUnavailable).length;

  if (!canScan) {
    return <div className="p-12 text-center text-[10px] font-black uppercase tracking-[0.3em] text-rose-500">Access Denied: Operational Clearance Required</div>;
  }

  return (
    <div className={`min-h-screen transition-all duration-300 ${lastFeedback === 'success' ? 'bg-emerald-500/10' : lastFeedback === 'error' ? 'bg-rose-500/10' : 'bg-slate-50 dark:bg-slate-950'}`}>
      <div className="mx-auto max-w-6xl p-6 lg:p-12 space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className={`w-14 h-14 rounded-[22px] flex items-center justify-center transition-all duration-300 ${loading ? 'bg-blue-500 animate-spin text-white shadow-xl shadow-blue-500/20' : 'bg-slate-900 text-white shadow-xl shadow-slate-900/10'}`}>
              <ScanLine size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 dark:text-white leading-none tracking-tight">Rapid Terminal</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2 justify-center md:justify-start">
                <Zap size={12} className="text-blue-500 animate-pulse" /> Scan, capture, sync, and export from one intake screen
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 w-full xl:w-auto">
            <MetricCard icon={<Database size={14} />} label="Successful" value={successfulCaptures} tone="emerald" />
            <MetricCard icon={<Radar size={14} />} label="Pending Sync" value={pendingSync} tone="amber" />
            <MetricCard icon={<History size={14} />} label="Recent Buffer" value={recentScans.length} tone="blue" />
            <MetricCard icon={<FileSpreadsheet size={14} />} label="Excel Ready" value={approvedRows.length || (spreadsheetName ? 'Loaded' : 'Idle')} tone="violet" />
            <MetricCard icon={<Edit size={14} />} label="Review Queue" value={pendingReviewCount} tone="amber" />
          </div>
        </div>

        <div className="rounded-[32px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Approved Intake Buffer</div>
              <div className="text-base font-black text-slate-900 dark:text-white mt-1">Mobile-approved rows ready for Excel paste and portal backup</div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={copyTabularLedger}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-blue-600"
              >
                <Clipboard size={12} /> Copy Rows
              </button>
              <button
                type="button"
                onClick={exportIntakeBatch}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-600"
              >
                <Download size={12} /> Export Excel
              </button>
            </div>
          </div>
          {approvedRows.length ? (
            <div className="overflow-auto rounded-3xl border border-slate-100 dark:border-slate-800">
              <table className="min-w-full text-left text-[11px]">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase tracking-widest">
                  <tr>
                    {['DATE', 'CLIENT', 'AWB', 'CONSIGNEE', 'DESTINATION', 'PIN', 'WEIGHT', 'VALUE', 'ORDER NO', 'COURIER'].map((header) => (
                      <th key={header} className="px-4 py-3 font-black">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {approvedRows.slice(0, 12).map((row) => (
                    <tr key={`${row.awb}-${row.orderNo || 'row'}`} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="px-4 py-3 font-bold text-slate-600 dark:text-slate-300">{row.date}</td>
                      <td className="px-4 py-3 font-black text-slate-900 dark:text-white">{row.clientCode}</td>
                      <td className="px-4 py-3 font-mono font-black text-slate-900 dark:text-white">{row.awb}</td>
                      <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">{row.consignee || '—'}</td>
                      <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">{row.destination || '—'}</td>
                      <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">{row.pincode || '—'}</td>
                      <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">{row.weight}</td>
                      <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">{row.amount || '—'}</td>
                      <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">{row.orderNo || '—'}</td>
                      <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200">{row.courier || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 px-4 py-6 text-[11px] font-bold text-slate-400">
              Approved mobile scans will appear here as clean Excel-ready rows the moment the operator taps approve on the phone.
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 2xl:grid-cols-[1.55fr_0.95fr] gap-8">
          <div className="rounded-[40px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/5 blur-[80px] pointer-events-none group-hover:bg-blue-500/10 transition-all duration-1000" />

            <form onSubmit={handleScan} className="flex flex-col gap-6 relative z-10">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex bg-slate-200/50 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setScanMode('single');
                      setTimeout(() => inputRef.current?.focus(), 50);
                    }}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${scanMode === 'single' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Live Scan
                  </button>
                  <button
                    type="button"
                    onClick={() => setScanMode('bulk')}
                    className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${scanMode === 'bulk' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Excel Batch
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => spreadsheetInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 dark:bg-slate-800 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-200 transition hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <Upload size={14} /> Load Excel
                  </button>
                  <button
                    type="button"
                    onClick={exportIntakeBatch}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-600 transition hover:bg-emerald-500/15"
                  >
                    <Download size={14} /> Export Intake
                  </button>
                  <input
                    type="file"
                    ref={spreadsheetInputRef}
                    className="hidden"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleSpreadsheetUpload}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 xl:grid-cols-[240px_1fr] gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Courier Mode</label>
                  <div className="relative">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                    <select
                      className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-black text-slate-800 dark:text-white appearance-none uppercase tracking-widest"
                      value={courier}
                      onChange={(e) => setCourier(e.target.value)}
                      disabled={loading}
                    >
                      <option value="AUTO">Smart Auto-Detect</option>
                      <option value="Delhivery">Delhivery</option>
                      <option value="Trackon">Trackon</option>
                      <option value="DTDC">DTDC</option>
                    </select>
                  </div>
                </div>

                {scanMode === 'single' ? (
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">AWB Input</label>
                    <div className="relative group/input">
                      <input
                        ref={inputRef}
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-3xl font-black text-slate-800 dark:text-white font-mono placeholder:text-slate-200 tabular-nums focus:ring-2 focus:ring-blue-500/10 transition-all"
                        placeholder="Scan or type AWB"
                        value={awb}
                        onChange={(e) => setAwb(e.target.value)}
                        disabled={loading}
                        autoFocus
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={startMobileSession}
                          className={`p-3 rounded-xl transition-all ${mobileStatus === 'connected' ? 'bg-blue-500 text-white animate-pulse shadow-lg shadow-blue-500/30' : 'bg-white dark:bg-slate-700 text-slate-400 hover:text-blue-500 shadow-sm'}`}
                          disabled={loading}
                          title={mobileStatus === 'connected' ? 'Mobile phone connected — scanning remotely' : 'Connect mobile phone camera'}
                        >
                          <Smartphone size={20} />
                        </button>
                        <button
                          type="button"
                          onClick={cameraActive ? stopCamera : startCameraScan}
                          className={`p-3 rounded-xl transition-all ${cameraActive ? 'bg-emerald-500 text-white animate-pulse' : 'bg-white dark:bg-slate-700 text-slate-400 hover:text-emerald-500 shadow-sm'}`}
                          disabled={loading}
                          title={cameraActive ? 'Stop camera scanner' : 'Start barcode scanner'}
                        >
                          <ScanLine size={20} />
                        </button>
                        {pendingDecoded && (
                          <button
                            type="button"
                            onClick={capturePendingDocument}
                            className="p-3 rounded-xl bg-slate-900 text-white shadow-sm hover:bg-slate-800 transition-colors"
                            disabled={loading}
                            title="Capture the aligned airwaybill"
                          >
                            <Camera size={20} />
                          </button>
                        )}
                        <button type="submit" className="hidden" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Batch Input</label>
                    <div className="relative">
                      <Clipboard className="absolute left-4 top-4 w-4 h-4 text-slate-300" />
                      <textarea
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-12 pr-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-300 font-mono min-h-[180px] focus:ring-2 focus:ring-blue-500/10 transition-all"
                        placeholder="Paste AWBs here or load an Excel sheet with an AWB column..."
                        value={bulkText}
                        onChange={(e) => setBulkText(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                    {spreadsheetName && (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-violet-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-violet-600">
                        <FileSpreadsheet size={12} /> {spreadsheetName}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {cameraActive && (
                <div className="rounded-3xl overflow-hidden border-4 border-slate-900 bg-black relative">
                  <video ref={videoRef} className="w-full max-h-[360px] object-cover" muted playsInline />
                  <div className="absolute inset-x-6 top-6 rounded-2xl bg-black/60 backdrop-blur-sm px-4 py-3 text-white flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-black tracking-widest uppercase text-xs">Live Barcode Scan</h3>
                      <div className="mt-1 text-[9px] font-black uppercase tracking-[0.35em] text-emerald-300">
                        {scannerStage === 'processing'
                          ? 'Processing extraction'
                          : scannerStage === 'document'
                            ? 'Document capture'
                            : 'Barcode acquisition'}
                      </div>
                      <p className="text-slate-300 text-[11px]">
                        {pendingDecoded
                          ? 'Barcode locked. Align the airwaybill in the rectangle and capture it manually.'
                          : 'Keep the barcode inside the frame. Once it locks, you will move to the document capture step.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {pendingDecoded && (
                        <button
                          type="button"
                          onClick={retakePendingBarcode}
                          className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-[10px] font-black uppercase tracking-widest"
                        >
                          Retake
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="pointer-events-auto absolute inset-0 flex items-center justify-center">
                    <div className="relative w-[90%] max-w-[760px] aspect-[1.62/1] rounded-[28px] border-2 border-emerald-400/90 shadow-[0_0_0_9999px_rgba(0,0,0,0.28)] overflow-hidden">
                      <div className="absolute inset-x-10 top-10 h-[2px] bg-emerald-400/60" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
                        <div className="text-[10px] font-black uppercase tracking-[0.45em] text-emerald-300/90">
                          {pendingDecoded ? 'Align airwaybill inside the frame' : 'Barcode first'}
                        </div>
                        <div className="mt-3 max-w-[320px] text-sm font-bold text-white/90">
                          {pendingDecoded
                            ? 'Now tap Capture to extract the printed and handwritten fields from the label.'
                            : 'Hold steady until the barcode is picked up. We will lock it instantly.'}
                        </div>
                      {pendingDecoded && (
                        <div className="mt-5 rounded-2xl bg-black/45 px-4 py-3 border border-white/10">
                          <div className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">Locked AWB</div>
                          <div className="mt-1 font-mono text-lg font-black text-white">{pendingDecoded}</div>
                        </div>
                      )}
                      </div>
                      <div className="absolute left-[8%] right-[8%] h-[2px] bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent animate-pulse" style={{ top: '46%' }} />
                    </div>
                  </div>
                </div>
              )}

              {cameraError && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-widest border border-rose-500/20">
                  <AlertCircle size={14} /> {cameraError}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex flex-wrap items-center gap-3 lg:gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Barcode-first intake</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setContinuousScan((prev) => !prev)}
                    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition ${continuousScan ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300'}`}
                  >
                    <Repeat size={12} /> {continuousScan ? 'Continuous ON' : 'Continuous OFF'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSmartAssist((prev) => !prev)}
                    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition ${smartAssist ? 'bg-blue-500/10 text-blue-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300'}`}
                  >
                    <Zap size={12} /> {smartAssist ? 'AI Assist ON' : 'AI Assist OFF'}
                  </button>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Barcode first + OCR hints + smart client mapping</span>
                </div>

                <button
                  type="submit"
                  disabled={loading || (scanMode === 'single' ? (!awb.trim() && !pendingDecoded) : !bulkText.trim())}
                  className="w-full sm:w-auto px-10 py-5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-[22px] shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-4 group/btn"
                >
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ScanLine size={20} className="group-hover/btn:scale-125 transition-transform" />}
                  {scanMode === 'single' ? (pendingDecoded ? 'Capture Document' : 'Capture AWB') : 'Capture Batch'}
                </button>
              </div>
            </form>
          </div>

          <div className="flex flex-col gap-8">
            {reviewScan ? (() => {
              const ocrData = reviewScan.meta?.ocrExtracted || reviewScan.meta || {};
              const intelligence = ocrData.intelligence || reviewScan.shipment?.intelligence || null;
              
              const confLevel = (score) => {
                if (score >= 0.85) return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
                if (score >= 0.55) return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
                return 'bg-rose-500 shadow-[0_0_8px_rgba(225,29,72,0.5)]';
              };

              const sourceBadge = (source) => {
                if (source === 'learned') return <span className="text-[9px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-md ml-2 border border-indigo-200">🧠 Learned</span>;
                if (source === 'fuzzy_match') return <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-md ml-2 border border-blue-200">🔍 Matched</span>;
                if (source === 'delhivery_pincode' || source === 'india_post') return <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-md ml-2 border border-emerald-200">📍 Pincode</span>;
                return null;
              };

              return (
              <div className="rounded-[32px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xl relative overflow-hidden animate-in slide-in-from-right-4">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm font-black uppercase text-slate-800 dark:text-white flex items-center gap-2">
                       <Brain size={16} className="text-violet-500" /> Intelligence Review
                    </h3>
                    <div className="text-xs font-bold text-slate-500 mt-1">Reviewing {pendingReviewCount} pending items</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-black tracking-widest text-slate-400">AWB</div>
                    <div className="font-mono text-lg font-black">{reviewScan.awb}</div>
                  </div>
                </div>

                <form onSubmit={saveActiveReview} className="space-y-3 relative z-10">
                  <div className="grid grid-cols-1 gap-3">
                    {/* Client Name */}
                    <div className="group rounded-2xl border border-slate-200 bg-slate-50 p-3 transition-colors focus-within:border-violet-500 focus-within:bg-white">
                      <div className="flex items-center justify-between mb-1">
                         <div className="flex items-center">
                           <div className={`w-2 h-2 rounded-full mr-2 ${confLevel(ocrData.clientNameConfidence || 0)}`} />
                           <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Client Code</label>
                           {sourceBadge(ocrData.clientNameSource)}
                         </div>
                      </div>
                      <input 
                        className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-900 uppercase focus:ring-0"
                        value={reviewForm.clientCode}
                        onChange={(e) => setReviewForm(p => ({ ...p, clientCode: e.target.value.toUpperCase() }))}
                        disabled={savingReview}
                        placeholder="e.g. MISC"
                      />
                      {intelligence?.clientMatches?.length > 0 && intelligence.clientNeedsConfirmation && (
                        <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-slate-200">
                          {intelligence.clientMatches.slice(0, 3).map(m => (
                            <button type="button" key={m.code} onClick={() => setReviewForm(f => ({ ...f, clientCode: m.code }))} className={`text-[10px] px-2 py-1 rounded-lg font-bold border ${reviewForm.clientCode === m.code ? 'bg-violet-100 text-violet-700 border-violet-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                              {m.code} ({Math.round(m.score * 100)}%)
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Consignee */}
                    <div className="group rounded-2xl border border-slate-200 bg-slate-50 p-3 transition-colors focus-within:border-violet-500 focus-within:bg-white">
                      <div className="flex items-center mb-1">
                         <div className={`w-2 h-2 rounded-full mr-2 ${confLevel(ocrData.consigneeConfidence || 0)}`} />
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Consignee</label>
                         {sourceBadge(ocrData.consigneeSource)}
                      </div>
                      <input 
                        className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-900 uppercase focus:ring-0"
                        value={reviewForm.consignee}
                        onChange={(e) => setReviewForm(p => ({ ...p, consignee: e.target.value.toUpperCase() }))}
                        disabled={savingReview}
                      />
                    </div>

                    {/* Destination */}
                    <div className="group rounded-2xl border border-slate-200 bg-slate-50 p-3 transition-colors focus-within:border-violet-500 focus-within:bg-white">
                      <div className="flex items-center mb-1">
                         <div className={`w-2 h-2 rounded-full mr-2 ${confLevel(ocrData.destinationConfidence || 0)}`} />
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Destination</label>
                         {sourceBadge(ocrData.destinationSource)}
                      </div>
                      <input 
                        className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-900 uppercase focus:ring-0"
                        value={reviewForm.destination}
                        onChange={(e) => setReviewForm(p => ({ ...p, destination: e.target.value.toUpperCase() }))}
                        disabled={savingReview}
                      />
                      {intelligence?.pincodeCity && intelligence.pincodeCity !== reviewForm.destination && (
                        <button type="button" onClick={() => setReviewForm(f => ({ ...f, destination: intelligence.pincodeCity }))} className="mt-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md block">
                          📍 Suggestion: {intelligence.pincodeCity}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    {/* Pincode */}
                    <div className="group rounded-2xl border border-slate-200 bg-slate-50 p-3 transition-colors focus-within:border-violet-500 focus-within:bg-white">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1 block mb-1">Pincode</label>
                      <input
                        className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-900 tabular-nums focus:ring-0"
                        value={reviewForm.pincode}
                        onChange={(e) => setReviewForm((p) => ({ ...p, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                        disabled={savingReview}
                      />
                    </div>
                    {/* Weight */}
                    <div className={`group rounded-2xl border ${intelligence?.weightAnomaly?.anomaly ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-slate-50'} p-3 transition-colors focus-within:border-violet-500 focus-within:bg-white`}>
                      <div className="flex items-center mb-1">
                        <div className={`w-2 h-2 rounded-full mr-2 ${confLevel(ocrData.weightConfidence || 0)}`} />
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Weight (kg)</label>
                      </div>
                      <input 
                        type="number" step="0.01" min="0"
                        className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-900 tabular-nums focus:ring-0"
                        value={reviewForm.weight || ''}
                        onChange={(e) => setReviewForm(p => ({ ...p, weight: e.target.value }))}
                        disabled={savingReview}
                      />
                      {intelligence?.weightAnomaly?.anomaly && (
                        <div className="text-[9px] text-amber-600 font-bold mt-1 leading-tight">⚠️ {intelligence.weightAnomaly.warning}</div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                    <button type="button" onClick={removeActiveReview} className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition" disabled={savingReview}>
                      Skip
                    </button>
                    <button type="submit" disabled={savingReview} className="px-8 py-3 rounded-[14px] bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors flex items-center gap-2">
                       {savingReview ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save size={16} />} Approve & Save
                    </button>
                  </div>
                </form>

              </div>
              );
            })() : (
              <div className="rounded-[32px] bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-slate-900 border border-blue-200/60 dark:border-blue-900/50 p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-5">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Intake Board</div>
                    <div className="text-xl font-black text-slate-900 dark:text-white mt-1">Ready for input</div>
                  </div>
                </div>
                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 px-4 py-6 text-[11px] font-bold text-slate-400">
                  Scan an AWB, point your mobile camera, or load an Excel batch to instantly start extracting.
                </div>
              </div>
            )}

            <div className="rounded-[32px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Excel Bridge</div>
                  <div className="text-base font-black text-slate-900 dark:text-white mt-1">Yes, this can work with Excel too</div>
                </div>
                <FileSpreadsheet size={18} className="text-violet-500" />
              </div>
              <div className="space-y-3 text-[12px] text-slate-600 dark:text-slate-300">
                <p>Load a client spreadsheet with an <span className="font-black">AWB</span> column, scan missing parcels live, and export the whole capture batch back into Excel whenever ops needs it.</p>
                <p>The better long-term model is still database-first, but this page now plays nicely with your Excel workflow instead of fighting it.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2">
            <div className="flex items-center gap-3">
              <History size={16} className="text-slate-400" />
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Tactical Scan Log</h3>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={exportIntakeBatch}
                className="text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:underline flex items-center gap-2"
              >
                <Download size={12} /> Export Intake
              </button>
              {recentScans.some((scan) => scan.status === 'error') && (
                <button
                  type="button"
                  onClick={exportFaults}
                  className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:underline flex items-center gap-2"
                >
                  <Download size={12} /> Export Faults
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentScans.length === 0 ? (
              <div className="md:col-span-2 p-12 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center">
                <Package size={48} className="text-slate-100 mb-4" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No scans yet. The intake buffer is standing by.</p>
              </div>
            ) : (
              recentScans.map((scan, idx) => (
                <div key={`${scan.awb}-${idx}`} className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-xl transition-all duration-500 group/log overflow-hidden relative">
                  {scan.status === 'success' && <div className="absolute right-[-20px] top-[-20px] w-16 h-16 bg-emerald-500/5 rounded-full blur-xl group-hover/log:bg-emerald-500/10 transition-all" />}

                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${scan.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {scan.status === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-800 dark:text-white font-mono tracking-tight uppercase">{scan.awb}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{scan.courier} Node</span>
                          {scan.status === 'success' && (
                            <span className={`rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-[0.24em] ${scan.meta?.trackingUnavailable ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                              {getCaptureTone(scan)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-slate-300 tabular-nums">{scan.timestamp.toLocaleTimeString()}</span>
                  </div>

                  {scan.status === 'success' && scan.data ? (
                    <div className="grid grid-cols-2 gap-4 relative z-10 pt-4 border-t border-slate-50 dark:border-slate-800">
                      <LogStat icon={<Package size={12} />} label="Consignee" value={scan.data.consignee || 'Unknown'} />
                      <LogStat icon={<Info size={12} />} label="Destination" value={scan.data.destination || 'Unknown'} />
                      <LogStat icon={<Zap size={12} />} label="Status" value={scan.data.status || 'Booked'} highlight />
                      <LogStat icon={<Database size={12} />} label="Tracking" value={scan.meta?.trackingUnavailable ? 'Pending sync' : 'Live'} />
                      <div className="col-span-2 pt-2 flex items-center justify-between gap-3">
                        <StatusBadge status={scan.data.status || 'Booked'} />
                        <button
                          type="button"
                          onClick={() => navigate(`/track/${scan.awb}`)}
                          className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 dark:bg-slate-800 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-200"
                        >
                          <ExternalLink size={11} /> Open Track
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/10 text-rose-500 text-[10px] font-bold italic relative z-10">
                      <Info size={12} /> {scan.error || 'Engagement failure on network layer.'}
                    </div>
                  )}

                  <div className="absolute bottom-0 right-0 p-2 opacity-0 group-hover/log:opacity-100 transition-opacity">
                    <ChevronRight size={14} className="text-slate-200" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Excel Ledger View (The Tabular Copiable Table) ────────────────── */}
        {recentScans.length > 0 && (
          <div className="pt-12 animate-in slide-in-from-bottom-8 duration-700">
             <div className="flex items-center justify-between mb-4 px-2">
               <div className="flex items-center gap-3">
                 <Table size={18} className="text-slate-500" />
                 <div>
                   <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-800 dark:text-white">Daily Ledger View</h3>
                   <p className="text-[10px] font-bold text-slate-400 tracking-wider">Tabular format ready for your Excel sheets</p>
                 </div>
               </div>
               <button
                 onClick={copyTabularLedger}
                 className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 hover:bg-emerald-600 transition-colors"
               >
                 <Copy size={14} /> Copy to Excel
               </button>
             </div>
             
             <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto shadow-sm">
               <table className="w-full text-left border-collapse min-w-[800px]">
                 <thead>
                   <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
                     <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">S.NO</th>
                     <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">DATE</th>
                     <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Clients</th>
                     <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Awb No</th>
                     <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">CONSIGNEE</th>
                     <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">DESTINATION</th>
                     <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">WEIGHT</th>
                     <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">AMOU</th>
                     <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 whitespace-nowrap">COURIERS</th>
                     <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">ORDER NO</th>
                     <th className="px-5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">VALUE</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                   {recentScans.filter((s) => s.status === 'success' || s.status === 'error').map((scan, idx) => {
                     const dateStr = scan.data?.date || new Date().toISOString().slice(0, 10);
                     const parts = dateStr.split('-');
                     const formattedDate = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : dateStr;
                     return (
                     <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors group">
                       <td className="px-5 py-3 text-xs font-bold text-slate-400">{idx + 1}</td>
                       <td className="px-5 py-3 text-xs font-bold text-slate-700 whitespace-nowrap">{formattedDate}</td>
                       <td className="px-5 py-3 text-[10px] font-black text-slate-700 uppercase">{scan.data?.clientCode || 'MISC'}</td>
                       <td className="px-5 py-3 font-mono text-xs font-black text-slate-900">{scan.awb}</td>
                       <td className="px-5 py-3 text-xs font-bold text-slate-600 truncate max-w-[150px] uppercase">{scan.data?.consignee || '-'}</td>
                       <td className="px-5 py-3 text-xs font-bold text-slate-700 uppercase">{scan.data?.destination || '-'}</td>
                       <td className="px-5 py-3 text-xs font-bold tabular-nums text-right text-slate-600">{Number(scan.data?.weight || 0).toFixed(3)}</td>
                       <td className="px-5 py-3 text-xs font-bold tabular-nums text-right text-slate-400">-</td>
                       <td className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase whitespace-nowrap">{(scan.data?.courier || scan.courier || '').toUpperCase()}</td>
                       <td className="px-5 py-3 text-xs font-bold text-slate-400">-</td>
                       <td className="px-5 py-3 text-xs font-bold tabular-nums text-right text-slate-600">{scan.data?.amount ? scan.data.amount : '-'}</td>
                     </tr>
                   )})}
                 </tbody>
               </table>
             </div>
          </div>
        )}

        {/* ── Mobile Session & QR Modal ──────────────────────────────────── */}
        {showMobileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300 p-4" onClick={(e) => { if (e.target === e.currentTarget) hideMobileModal(); }}>
            <div className="bg-white rounded-[32px] p-6 max-w-sm w-full shadow-2xl relative overflow-hidden">
               {/* Header */}
               <div className="flex justify-between items-start mb-6">
                 <div>
                   <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                     <Smartphone size={20} className="text-violet-500" /> Scanner Link
                   </h3>
                   <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-widest">
                     {mobileStatus === 'connected' ? 'Session Active' : 'Waiting for connection'}
                   </p>
                 </div>
                 <button onClick={hideMobileModal} className="p-2 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600">
                   <X size={16} />
                 </button>
               </div>

               {mobileStatus === 'connected' ? (
                 <div className="flex flex-col items-center gap-4 py-6">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500 animate-pulse">
                      <Wifi size={32} />
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-black">{mobileScanCount}</div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Scans this session</div>
                    </div>
                 </div>
               ) : (
                 <div className="flex flex-col items-center gap-5 pb-2">
                   <div className="p-3 bg-white rounded-3xl shadow-[0_0_20px_rgba(0,0,0,0.05)] border border-slate-100">
                     {mobileQRData ? (
                       <img src={mobileQRData} alt="Scan QR" className="w-48 h-48 rounded-2xl" />
                     ) : (
                       <div className="w-48 h-48 flex items-center justify-center bg-slate-50 rounded-2xl text-slate-300">
                         <QrCode size={40} />
                       </div>
                     )}
                   </div>
                   <div className="text-center max-w-[240px]">
                     <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                       Scan with camera to connect
                     </p>
                     <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 justify-center group cursor-pointer hover:bg-slate-100" onClick={() => { navigator.clipboard?.writeText(mobilePIN); }}>
                       <span className="text-[11px] font-mono font-black tracking-[0.2em] text-violet-600">PIN: {mobilePIN}</span>
                       <Copy size={12} className="text-slate-400 group-hover:text-violet-500" />
                     </div>
                   </div>
                 </div>
               )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, tone = 'blue' }) {
  const toneClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-600',
    amber: 'bg-amber-500/10 text-amber-600',
    blue: 'bg-blue-500/10 text-blue-600',
    violet: 'bg-violet-500/10 text-violet-600',
  };

  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.24em] text-slate-400">{label}</div>
          <div className="mt-2 text-xl font-black text-slate-900 dark:text-white">{value}</div>
        </div>
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${toneClasses[tone] || toneClasses.blue}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function LogStat({ icon, label, value, highlight }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-slate-300">{icon}</span>
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{label}</span>
      </div>
      <div className={`text-[11px] font-black truncate uppercase ${highlight ? 'text-blue-500' : 'text-slate-600 dark:text-slate-400'}`}>
        {value || 'N/A'}
      </div>
    </div>
  );
}
