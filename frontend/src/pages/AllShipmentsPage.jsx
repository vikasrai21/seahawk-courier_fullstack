// AllShipmentsPage.jsx — High-Performance Shipment Management
import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  CheckSquare, 
  Square, 
  RefreshCw, 
  Clock, 
  Scan, 
  Zap, 
  Box, 
  FileText, 
  LayoutGrid, 
  List,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';
import { StatusBadge, STATUSES, formatStatusLabel, normalizeStatus } from '../components/ui/StatusBadge';
import { EmptyState, SkeletonTable } from '../components/ui/Loading';
import { Modal } from '../components/ui/Modal';
import ShipmentForm from '../components/ShipmentForm';
import { PageHeader } from '../components/ui/PageHeader';
import { CourierBadge } from '../components/ui/CourierBadge';
import QuickStatus from '../components/ui/QuickStatus';
import TimelineModal from '../components/shipments/TimelineModal';
import BulkStatusModal from '../components/shipments/BulkStatusModal';

const fmt = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;

const STATUS_TRANSITIONS = {
  Booked: ['PickedUp', 'Cancelled'],
  PickedUp: ['InTransit', 'RTO', 'Cancelled'],
  InTransit: ['OutForDelivery', 'RTO', 'Failed'],
  OutForDelivery: ['Delivered', 'Failed', 'RTO'],
  Failed: ['InTransit', 'RTO'],
  RTO: ['RTODelivered', 'InTransit'],
};

// ── Industrial Barcode Scanner (Rebuilt for Trackon) ───────────────────────
function BarcodeScanner({ onScan, scanning, lastScanned }) {
  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [value, setValue] = useState('');
  const [pulse, setPulse] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [frameEdges, setFrameEdges] = useState(0);
  const scannerRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Initialize ZXing for Trackon-optimized barcode detection
  const initCamera = useCallback(async () => {
    if (cameraActive) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          advanced: [
            { focusMode: 'continuous' },
            { exposureMode: 'continuous' },
            { zoom: { ideal: 1 } },
          ],
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);

        // Load ZXing for CODE_128 & ITF detection (Trackon formats)
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        const { DecodeHintType, BarcodeFormat } = await import('@zxing/library');

        const hints = new Map([
          [DecodeHintType.POSSIBLE_FORMATS, [
            BarcodeFormat.CODE_128,
            BarcodeFormat.ITF,
            BarcodeFormat.CODE_39,
            BarcodeFormat.EAN_13,
          ]],
          [DecodeHintType.TRY_HARDER, true],
          [DecodeHintType.CHARACTER_SET, 'UTF-8'],
        ]);

        const reader = new BrowserMultiFormatReader(hints, 50);
        scannerRef.current = reader;

        let lastDetected = 0;
        reader.decodeFromVideoElement(videoRef.current, (result) => {
          if (result && Date.now() - lastDetected > 800) {
            lastDetected = Date.now();
            const text = result.getText();
            const normalized = text.replace(/[^0-9]/g, '').slice(-12); // Get last 12 digits for Trackon

            // Validate Trackon format: 12 digits starting with 100, 200, or 500
            if (/^(100|200|500)\d{9}$/.test(normalized)) {
              setValue(normalized);
              handleScan(normalized);
              setPulse(true);
              setTimeout(() => setPulse(false), 600);
            }
          }
        });
      }
    } catch (err) {
      console.error('Camera failed:', err);
    }
  }, [cameraActive]);

  const stopCamera = useCallback(() => {
    setCameraActive(false);
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    if (scannerRef.current) {
      try {
        scannerRef.current.reset?.();
      } catch (err) {
        // Ignore scanner reset errors
        console.debug('Scanner reset error:', err);
      }
      scannerRef.current = null;
    }
  }, []);

  // Frame quality detection for visual feedback
  useEffect(() => {
    if (!cameraActive || !videoRef.current || !canvasRef.current) return;

    const detectFrameQuality = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!canvas || !video || video.readyState !== 2) return;

      try {
        const ctx = canvas.getContext('2d');
        canvas.width = 160;
        canvas.height = 90;
        ctx.drawImage(video, 0, 0, 160, 90);

        const imageData = ctx.getImageData(0, 0, 160, 90);
        const data = imageData.data;
        
        // Count high-contrast edges (good for barcode detection)
        let edges = 0;
        let lastPixel = 0;
        for (let i = 0; i < data.length; i += 4) {
          const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          if (Math.abs(gray - lastPixel) > 50) edges++;
          lastPixel = gray;
        }
        setFrameEdges(Math.min(100, (edges / (160 * 90)) * 1000));
      } catch (err) {
        console.debug('Frame quality detection error:', err);
      }
    };

    const interval = setInterval(detectFrameQuality, 200);
    return () => clearInterval(interval);
  }, [cameraActive]);

  const handleScan = (barcode) => {
    onScan(barcode.trim());
    setValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && value.trim()) {
      // Validate Trackon format before scanning
      const normalized = value.replace(/[^0-9]/g, '').slice(-12);
      if (/^(100|200|500)\d{9}$/.test(normalized)) {
        handleScan(normalized);
        setPulse(true);
        setTimeout(() => setPulse(false), 600);
      } else if (value.length >= 6) {
        // Allow manual entry for other formats
        handleScan(value);
        setPulse(true);
        setTimeout(() => setPulse(false), 600);
      }
    }
  };

  return (
    <>
      <div
        className={`mb-6 rounded-[28px] border-2 transition-all duration-500 overflow-hidden ${
          pulse
            ? 'border-emerald-500 bg-emerald-50/10'
            : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50'
        } ${scanning ? 'ring-4 ring-blue-500/10' : ''}`}
      >
        <div className="flex items-center gap-4 px-5 py-4">
          <div
            className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 cursor-pointer ${
              scanning
                ? 'bg-blue-600 text-white animate-pulse'
                : pulse
                ? 'bg-emerald-500 text-white translate-y-[-2px] shadow-lg shadow-emerald-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            onClick={() => (cameraActive ? stopCamera() : initCamera())}
          >
            {scanning ? <RefreshCw size={24} className="animate-spin" /> : <Scan size={24} />}
          </div>

          <div className="flex-1">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1 leading-none">
              {cameraActive ? '📹 Camera Active' : scanning ? 'Processing...' : 'Ready to Scan'}
            </label>
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="12-digit Trackon AWB (100/200/500...)"
              className="w-full bg-transparent outline-none text-lg font-mono font-black text-slate-800 dark:text-white placeholder-slate-300 dark:placeholder-slate-700 h-7"
              autoComplete="off"
              spellCheck={false}
              disabled={scanning}
            />
          </div>

          {lastScanned && (
            <div
              className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl text-[11px] font-black uppercase tracking-wider animate-in slide-in-from-right-4 duration-300 ${
                lastScanned.found ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  lastScanned.found
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                    : 'bg-red-500'
                }`}
              />
              {lastScanned.awb}
            </div>
          )}
        </div>

        {cameraActive && (
          <div className="relative bg-black/90 aspect-video overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            {/* Scan guide overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={`border-2 transition-all ${
                  frameEdges > 30 ? 'border-emerald-400' : 'border-orange-400'
                }`}
                style={{ width: '70%', aspectRatio: '16/9' }}
              >
                <div className="absolute top-2 left-2 right-2 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-60 animate-pulse" />
              </div>
            </div>

            {/* Frame quality indicator */}
            <div className="absolute top-4 right-4 bg-black/50 px-3 py-1 rounded text-white text-xs font-mono">
              {frameEdges.toFixed(0)}%
            </div>

            {/* Close camera button */}
            <button
              onClick={stopCamera}
              className="absolute top-4 left-4 bg-red-500/80 hover:bg-red-600 text-white p-2 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ── Scanned Detail Modal ───────────────────────────────────────────────────
function ScannedShipmentModal({ shipment, onClose, onStatusUpdate, toast }) {
  const transitions = STATUS_TRANSITIONS[normalizeStatus(shipment.status)] || [];
  const [saving, setSaving] = useState(false);

  const update = async (newStatus) => {
    setSaving(true);
    try {
      await api.patch(`/shipments/${shipment.id}/status`, { status: newStatus });
      onStatusUpdate(shipment.id, newStatus);
      toast?.(`Updated to ${newStatus}`, 'success');
      onClose();
    } catch (err) {
      toast?.(err.message, 'error');
    } finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title={`Shipment Identified`}>
      <div className="space-y-6">
        <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/50 rounded-[32px] border border-slate-100 dark:border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
             <Box size={80} />
          </div>
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">AWB Number</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tighter mb-4">{shipment.awb}</div>
          <StatusBadge status={shipment.status} />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl">
            <div className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Client</div>
            <div className="text-sm font-black text-slate-800 dark:text-white truncate">{shipment.clientCode}</div>
            <div className="text-[10px] text-slate-400 truncate">{shipment.client?.company}</div>
          </div>
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl">
            <div className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Recipient</div>
            <div className="text-sm font-black text-slate-800 dark:text-white truncate">{shipment.consignee}</div>
            <div className="text-[10px] text-slate-400 truncate">📍 {shipment.destination}</div>
          </div>
        </div>

        {transitions.length > 0 && (
          <div className="space-y-4 pt-2">
            <div className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Process Next State</div>
            <div className="flex flex-col gap-2">
              {transitions.map(s => (
                <button
                  key={s}
                  onClick={() => update(s)}
                  disabled={saving}
                  className="w-full flex items-center justify-between p-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-900/10 hover:translate-x-1 active:scale-95 transition-all disabled:opacity-50"
                >
                  <span className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    Set to {formatStatusLabel(s)}
                  </span>
                  <ArrowRight size={16} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function AllShipmentsPage({ toast }) {
  const [shipments,      setShipments]      = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [filters,        setFilters]        = useState({ q: '', status: '', courier: '', date_from: '', date_to: '' });
  const [editShip,       setEditShip]       = useState(null);
  const [timeline,       setTimeline]       = useState(null);
  const [editLoading,    setEditLoading]    = useState(false);
  const [total,          setTotal]          = useState(0);
  const [selected,       setSelected]       = useState(new Set());
  const [bulkModal,      setBulkModal]      = useState(false);
  const [showScanner,    setShowScanner]    = useState(false);
  const [scanning,       setScanning]       = useState(false);
  const [lastScanned,    setLastScanned]    = useState(null);   
  const [scannedShip,    setScannedShip]    = useState(null);   
  const [highlightId,    setHighlightId]    = useState(null);   
  const [density,        setDensity]        = useState(() => localStorage.getItem('sh-density') || 'Normal'); 
  const rowRefs = useRef({});                                    

  useEffect(() => {
    localStorage.setItem('sh-density', density);
  }, [density]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const res = await api.get(`/shipments?${params.toString()}&limit=200`);
      setShipments(res.data || res || []);
      setTotal(res.pagination?.total || res.data?.length || res.length || 0);
      setSelected(new Set());
    } catch (err) { toast?.(err.message, 'error'); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const handleScan = useCallback(async (awb) => {
    setScanning(true);
    try {
      const existing = shipments.find(s => s.awb?.toLowerCase() === awb.toLowerCase());
      if (existing) {
        setHighlightId(existing.id);
        setLastScanned({ awb, found: true });
        setScannedShip(existing);
        setTimeout(() => {
          rowRefs.current[existing.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
        setTimeout(() => setHighlightId(null), 3000);
      } else {
        const res = await api.get(`/shipments?q=${encodeURIComponent(awb)}&limit=5`);
        const results = res.data || res || [];
        const match = results.find(s => s.awb?.toLowerCase() === awb.toLowerCase()) || results[0];
        if (match) {
          setLastScanned({ awb, found: true });
          setScannedShip(match);
          toast?.(`Identified: ${match.awb}`, 'success');
        } else {
          setLastScanned({ awb, found: false });
          toast?.(`"${awb}" not found`, 'error');
        }
      }
    } catch (err) {
      setLastScanned({ awb, found: false });
      toast?.(err.message, 'error');
    } finally { setScanning(false); }
  }, [shipments, toast]);

  const handleDelete = async (s) => {
    if (!confirm(`Permanently delete AWB ${s.awb}?`)) return;
    try {
      await api.delete(`/shipments/${s.id}`);
      setShipments(prev => prev.filter(x => x.id !== s.id));
      toast?.('Record purged', 'success');
    } catch (err) { toast?.(err.message, 'error'); }
  };

  const handleEdit = async (form) => {
    setEditLoading(true);
    try {
      const res = await api.put(`/shipments/${editShip.id}`, form);
      setShipments(prev => prev.map(s => s.id === editShip.id ? (res.data || res) : s));
      setEditShip(null);
      toast?.('Update verified', 'success');
    } catch (err) { toast?.(err.message, 'error'); }
    finally { setEditLoading(false); }
  };

  const handleQuickStatusUpdate = (id, newStatus) => {
    setShipments(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
  };

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const clearFilters = () => setFilters({ q: '', status: '', courier: '', date_from: '', date_to: '' });
  const hasFilters = Object.values(filters).some(Boolean);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleAll = () => {
    if (selected.size === shipments.length) setSelected(new Set());
    else setSelected(new Set(shipments.map(s => s.id)));
  };

  const totalAmt = shipments.reduce((a, s) => a + (s.amount || 0), 0);
  const totalWt  = shipments.reduce((a, s) => a + (s.weight || 0), 0);

  return (
    <div className="mx-auto max-w-7xl p-6">
      <PageHeader
        title="Operation Control"
        subtitle={`${total} global shipment records managed`}
        icon={Box}
        actions={
          <div className="flex items-center gap-3">
             {/* Density Toggle */}
             <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
                <button onClick={() => setDensity('Normal')} className={`p-2 rounded-xl transition-all ${density === 'Normal' ? 'bg-white dark:bg-slate-800 text-blue-500 shadow-sm' : 'text-slate-400'}`} title="Normal View">
                  <LayoutGrid size={16} />
                </button>
                <button onClick={() => setDensity('Compact')} className={`p-2 rounded-xl transition-all ${density === 'Compact' ? 'bg-white dark:bg-slate-800 text-blue-500 shadow-sm' : 'text-slate-400'}`} title="High Density View">
                  <List size={16} />
                </button>
             </div>

            <button
              onClick={() => setShowScanner(s => !s)}
              className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all ${
                showScanner
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-900/20 active:scale-95'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50'
              }`}
            >
              <Scan size={14} className={showScanner ? 'animate-pulse text-blue-400' : ''} />
              {showScanner ? 'Live Cam Active' : 'Initialize Scanner'}
            </button>
          </div>
        }
      />

      {showScanner && (
        <BarcodeScanner
          onScan={handleScan}
          scanning={scanning}
          lastScanned={lastScanned}
        />
      )}

      {/* Modern Filter Strip */}
      <div className="card-compact mb-6 bg-white/50 backdrop-blur-xl border-slate-200/60">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="relative col-span-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="input pl-11 w-full text-xs font-bold !rounded-2xl" 
              placeholder="Search by AWB, Client, or Recipient..."
              value={filters.q} onChange={e => setFilter('q', e.target.value)} />
          </div>
          <select className="input text-xs font-bold !rounded-2xl" 
            value={filters.status} onChange={e => setFilter('status', e.target.value)}>
            <option value="">Global Statuses</option>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <input type="date" className="input text-xs font-bold !rounded-2xl" 
            value={filters.date_from} onChange={e => setFilter('date_from', e.target.value)} />
          <input type="date" className="input text-xs font-bold !rounded-2xl" 
            value={filters.date_to} onChange={e => setFilter('date_to', e.target.value)} />
          
          <div className="flex gap-2">
            <button onClick={load} className="btn-primary flex-1 !rounded-2xl text-[10px] font-black uppercase tracking-widest">
              Refresh List
            </button>
            {hasFilters && (
              <button onClick={clearFilters} className="w-11 flex items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {shipments.length > 0 && (
        <div className="flex flex-wrap items-center gap-6 mb-4 px-2">
           <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              {shipments.length} Records
           </div>
           <div className="flex items-center gap-4 text-[11px] font-bold text-slate-500">
              <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800">
                💰 {fmt(totalAmt)}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800">
                ⚖️ {totalWt.toFixed(1)} kg
              </span>
           </div>
           <div className="hidden lg:block ml-auto text-[10px] font-bold text-slate-300 uppercase tracking-widest">
              Shift + Click to Select Multiple · Inline Update Active
           </div>
        </div>
      )}

      {loading ? <SkeletonTable rows={12} cols={8} /> : shipments.length === 0 ? (
        <EmptyState icon="📦" title="No matching data" description="Try broadening your search parameters." />
      ) : (
        <div className={`table-shell overflow-visible ${density === 'Compact' ? 'density-compact' : ''}`}>
          <table className="tbl w-full border-collapse">
            <thead className="table-head">
              <tr>
                <th className="w-10 p-3">
                  <button onClick={toggleAll} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                    {selected.size === shipments.length
                      ? <CheckSquare size={16} className="text-blue-600" />
                      : <Square size={16} className="text-slate-300" />}
                  </button>
                </th>
                <th className="text-left p-3">Lifecycle / AWB</th>
                <th className="text-left p-3">Originator</th>
                <th className="text-left p-3">Consignee Path</th>
                <th className="text-left p-3">Contractor</th>
                <th className="text-right p-3">Financials</th>
                <th className="text-center p-3">Execution</th>
                <th className="text-right p-3 pr-6">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {shipments.map(s => {
                const isSelected = selected.has(s.id);
                const isHighlighted = highlightId === s.id;
                return (
                  <tr
                    key={s.id}
                    ref={el => rowRefs.current[s.id] = el}
                    className={`table-row cursor-pointer group transition-all duration-300 ${
                      isSelected ? 'bg-blue-50/50 dark:bg-blue-900/10' :
                      isHighlighted ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''
                    }`}
                    onClick={() => toggleSelect(s.id)}
                  >
                    <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                      <button onClick={() => toggleSelect(s.id)} className="p-1 transition-transform active:scale-90">
                        {isSelected
                          ? <CheckSquare size={16} className="text-blue-600" />
                          : <Square size={16} className="text-slate-200 group-hover:text-slate-300" />}
                      </button>
                    </td>
                    <td className="p-3">
                      <div className="text-[9px] text-slate-400 font-black uppercase tracking-tight mb-0.5">{s.date}</div>
                      <div className={`font-mono font-black text-sm tracking-tight ${isHighlighted ? 'text-amber-600' : 'text-slate-800 dark:text-white'}`}>
                        {s.awb}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-xs font-black text-slate-700 dark:text-slate-300">{s.clientCode}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[100px]">{s.client?.company}</div>
                    </td>
                    <td className="p-3">
                      <div className="text-xs font-black text-slate-700 dark:text-slate-300 truncate max-w-[140px]">{s.consignee}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">📍 {s.destination}</div>
                    </td>
                    <td className="p-3">
                      <CourierBadge name={s.courier} />
                      <div className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-1 ml-8">{s.service}</div>
                    </td>
                    <td className="p-3 text-right">
                      <div className="text-xs font-black text-slate-800 dark:text-white">{fmt(s.amount)}</div>
                      <div className="text-[10px] font-bold text-slate-400">{s.weight} kg</div>
                    </td>
                    <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                      <QuickStatus 
                        shipment={s} 
                        onUpdate={handleQuickStatusUpdate} 
                        toast={toast}
                      />
                    </td>
                    <td className="p-3 text-right pr-6" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1 opacity-20 group-hover:opacity-100 transition-all duration-300">
                        <button onClick={() => setTimeline(s)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors" title="Journey Timeline">
                          <Clock size={16} />
                        </button>
                        <button onClick={() => setEditShip(s)} className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-colors" title="Edit Properties">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(s)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors" title="Purge Record">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Floating Global Action Bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-full flex justify-center animate-in slide-in-from-bottom-10 duration-700">
          <div className="pointer-events-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[32px] p-2.5 flex items-center gap-6 shadow-[0_40px_100px_rgba(15,23,42,0.5)] border border-white/10 dark:border-slate-200">
            <div className="flex items-center gap-4 pl-4 pr-6 border-r border-white/10 dark:border-slate-100">
               <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-black shadow-lg shadow-blue-600/40">
                  {selected.size}
               </div>
               <div className="text-[11px] font-black uppercase tracking-[0.2em]">Batch Controls</div>
            </div>

            <div className="flex items-center gap-2 pr-2">
              <button 
                onClick={() => setBulkModal(true)}
                className="group flex items-center gap-3 px-6 py-3 bg-white/10 dark:bg-slate-100 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm"
              >
                <Zap size={16} className="text-blue-500" /> Set Progress Status
              </button>
              
              <button 
                className="group flex items-center gap-3 px-6 py-3 bg-white/10 dark:bg-slate-100 hover:bg-blue-600 dark:hover:bg-indigo-600 hover:text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-sm"
                onClick={() => toast.info('Industrial Label Print Service under development')}
              >
                <FileText size={16} className="text-indigo-500" /> Print Master Labels
              </button>

              <button 
                onClick={() => setSelected(new Set())}
                className="ml-2 w-12 h-12 flex items-center justify-center bg-white/5 dark:bg-slate-50 hover:bg-red-600 dark:hover:bg-red-600 hover:text-white rounded-2xl transition-all"
                title="Discard Selection"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistence Modals */}
      {scannedShip && (
        <ScannedShipmentModal
          shipment={scannedShip}
          onClose={() => setScannedShip(null)}
          onStatusUpdate={(id, status) => {
            handleQuickStatusUpdate(id, status);
            setScannedShip(null);
          }}
          toast={toast}
        />
      )}

      {bulkModal && (
        <BulkStatusModal
          selectedIds={[...selected]}
          onDone={load}
          onClose={() => setBulkModal(false)}
          toast={toast}
        />
      )}

      {timeline && <TimelineModal shipment={timeline} onClose={() => setTimeline(null)} />}

      {editShip && (
        <Modal open onClose={() => setEditShip(null)} title={`Modify Record • ${editShip.awb}`}
          footer={<div className="flex gap-2 w-full">
            <button onClick={() => setEditShip(null)} className="flex-1 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Abort</button>
            <button onClick={() => document.getElementById('shipment-form-submit')?.click()} disabled={editLoading} 
              className="flex-3 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl px-6 py-3 text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
              {editLoading ? 'Committing...' : 'Commit Changes'}
            </button>
          </div>}
        >
          <ShipmentForm initialData={editShip} onSubmit={handleEdit} />
        </Modal>
      )}
      
      <style>{`
        .density-compact .table-row { height: 40px !important; }
        .density-compact .p-3 { padding: 4px 12px !important; }
        .density-compact .CourierBadge { transform: scale(0.85); transform-origin: left; }
      `}</style>
    </div>
  );
}
