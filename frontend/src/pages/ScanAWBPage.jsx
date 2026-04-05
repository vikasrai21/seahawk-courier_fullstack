import { useState, useRef, useEffect } from 'react';
import { ScanLine, CheckCircle2, AlertCircle, RefreshCw, Download } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import * as XLSX from 'xlsx';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

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
    console.debug('Unable to play success tone', e);
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
    console.debug('Unable to play error tone', e);
  }
};

export default function ScanAWBPage({ toast }) {
  const { isAdmin, hasRole } = useAuth();
  const canScan = isAdmin || hasRole('OPS_MANAGER') || hasRole('STAFF');
  const [awb, setAwb] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [scanMode, setScanMode] = useState('single');
  const [courier, setCourier] = useState('Delhivery');
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [recentScans, setRecentScans] = useState([]);
  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const scannerRef = useRef(null);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const stopCamera = async () => {
    try {
      await scannerRef.current?.reset();
    } catch {
      // Scanner reset can fail if the camera stream was never initialized.
    }

    scannerRef.current = null;
    setCameraActive(false);
  };

  useEffect(() => () => { stopCamera(); }, []);

  const processSingleScan = async (rawAwb) => {
      const currentAwb = String(rawAwb || '').trim();
      if (!currentAwb) return;

      setLoading(true);
      setAwb('');

      try {
        const res = await api.post('/shipments/scan', { awb: currentAwb, courier });
        playSuccess();
        toast(`AWB scanned via ${courier} successfully`, 'success');

        setRecentScans(prev => [
          { awb: currentAwb, courier, status: 'success', data: res.data.shipment, timestamp: new Date() },
          ...prev
        ].slice(0, 50));
      } catch (err) {
        playError();
        toast(err.message, 'error');
        setRecentScans(prev => [
          { awb: currentAwb, courier, status: 'error', error: err.message, timestamp: new Date() },
          ...prev
        ].slice(0, 50));
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
  };

  const startCamera = async () => {
    setCameraError('');

    try {
      await stopCamera();
      const reader = new BrowserMultiFormatReader();
      scannerRef.current = reader;

      await reader.decodeFromVideoDevice(undefined, videoRef.current, async (result, error) => {
        if (result) {
          const scannedAwb = result.getText();
          await stopCamera();
          setAwb(scannedAwb);
          await processSingleScan(scannedAwb);
        } else if (error && error.name !== 'NotFoundException') {
          setCameraError(error.message || 'Unable to scan barcode');
        }
      });

      setCameraActive(true);
    } catch (err) {
      setCameraError(err.message || 'Camera access failed');
      await stopCamera();
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (scanMode === 'single') {
      await processSingleScan(awb);
    } else {
      const awbList = bulkText.split(/[\n,]+/).map(a => a.trim()).filter(Boolean);
      if (!awbList.length) return;
      
      setLoading(true);
      setBulkText(''); // Clear text area
  
      try {
        const res = await api.post('/shipments/scan-bulk', { awbs: awbList, courier });
        // After backend refactor, res.data.jobId is returned instead.
        if (res.data.jobId) {
          toast(`Bulk scan queued in background (Job ID: ${res.data.jobId})`, 'success');
          setRecentScans([{ awb: 'BULK BATCH', status: 'success', data: { status: 'Processing in Background', consignee: 'Queue', destination: 'Worker' }, timestamp: new Date() }, ...recentScans]);
          return;
        }

        // Fallback for sync return
        playSuccess();
        toast(`Bulk scan completed (${res.data.successful.length} success, ${res.data.failed.length} failed)`, 'success');
        
        const newScans = [];
        for (const s of res.data.successful) {
           newScans.push({ awb: s.awb, courier, status: 'success', data: s.data, timestamp: new Date() });
        }
        for (const f of res.data.failed) {
           newScans.push({ awb: f.awb, courier, status: 'error', error: f.error, timestamp: new Date() });
        }
        if (res.data.failed.length > 0) playError();
        
        setRecentScans(prev => [...newScans, ...prev].slice(0, 100));
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  if (!canScan) {
    return <div className="p-6 text-center text-red-500">Access Denied</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ScanLine className="w-6 h-6 text-blue-600" />
          Rapid AWB Scanner
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Scan or type an AWB to instantly fetch and update shipment details from Courier APIs.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        
        {/* Tabs for mode selection */}
        <div className="flex border-b border-gray-200 mb-5">
          <button 
            type="button"
            className={`px-4 py-2 font-semibold text-sm border-b-2 transition-colors ${scanMode === 'single' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => { setScanMode('single'); setTimeout(() => inputRef.current?.focus(), 50); }}
          >
            Single Scan
          </button>
          <button 
            type="button"
            className={`px-4 py-2 font-semibold text-sm border-b-2 transition-colors ${scanMode === 'bulk' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setScanMode('bulk')}
          >
            Bulk Paste (Excel)
          </button>
        </div>

        <form onSubmit={handleScan} className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-3">
            <select 
              className="input md:w-48 text-lg py-3 px-4 font-semibold text-gray-700 h-auto"
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
              disabled={loading}
            >
              <option value="Delhivery">Delhivery</option>
              <option value="Trackon">Trackon (Prime Track)</option>
              <option value="DTDC">DTDC</option>
            </select>
            
            {scanMode === 'single' ? (
              <div className="flex-1 flex flex-col gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  className="input flex-1 text-lg py-3 px-4 font-mono h-auto"
                  placeholder={`Scan ${courier} AWB...`}
                  value={awb}
                  onChange={(e) => setAwb(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={cameraActive ? stopCamera : startCamera}
                    className="btn-secondary"
                    disabled={loading}
                  >
                    {cameraActive ? 'Stop Camera' : 'Scan With Camera'}
                  </button>
                  {cameraError && <span className="text-xs text-red-500">{cameraError}</span>}
                </div>
                {cameraActive && (
                  <div className="rounded-xl overflow-hidden border border-gray-200 bg-black">
                    <video ref={videoRef} className="w-full max-h-72 object-cover" muted playsInline />
                  </div>
                )}
              </div>
            ) : (
              <textarea
                className="input flex-1 text-sm py-3 px-4 font-mono min-h-[120px]"
                placeholder={`Paste multiple ${courier} AWBs here (one per line or comma-separated)...`}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                disabled={loading}
              />
            )}
          </div>
          
          <button 
            type="submit" 
            className="btn-primary py-3 px-6 h-auto w-full md:w-auto md:self-end flex items-center justify-center gap-2"
            disabled={loading || (scanMode === 'single' ? !awb.trim() : !bulkText.trim())}
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ScanLine className="w-5 h-5" />}
            {scanMode === 'single' ? 'Scan AWB' : 'Process Bulk Scans'}
          </button>
        </form>
        
        <p className="text-[10px] text-gray-400 mt-3">
          {scanMode === 'single' 
            ? 'Make sure your barcode scanner is configured to send an "Enter" suffix.' 
            : 'Copy and paste a column of AWBs directly from Excel. Up to 200 AWBs per request.'}
        </p>
      </div>

      {recentScans.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100 font-semibold text-sm text-gray-700 flex justify-between items-center">
            <span>Recent Scans</span>
            {recentScans.some(s => s.status === 'error') && (
              <button 
                onClick={() => {
                  const failed = recentScans.filter(s => s.status === 'error').map(s => ({ AWB: s.awb, Courier: s.courier, Error: s.error, Time: s.timestamp.toLocaleString() }));
                  const ws = XLSX.utils.json_to_sheet(failed);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, "Failed Scans");
                  XLSX.writeFile(wb, "Failed_Scans_Report.xlsx");
                }}
                className="btn-secondary py-1 px-3 text-xs flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
              >
                <Download className="w-3 h-3" /> Export Failed
              </button>
            )}
          </div>
          <div className="divide-y divide-gray-50">
            {recentScans.map((scan, idx) => (
              <div key={idx} className="p-4 flex items-start gap-3 hover:bg-gray-50/50 transition-colors">
                <div className={'mt-0.5 ' + (scan.status === 'success' ? 'text-green-500' : 'text-red-500')}>
                  {scan.status === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold font-mono text-gray-900">{scan.awb} <span className="text-xs text-gray-400 font-sans ml-1">({scan.courier})</span></p>
                    <span className="text-[10px] text-gray-400">
                      {scan.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  {scan.status === 'success' && scan.data ? (
                    <div className="mt-1 flex gap-4 text-xs text-gray-500">
                      <span>👤 {scan.data.consignee || 'Unknown'}</span>
                      <span>📍 {scan.data.destination || 'Unknown'}</span>
                      <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                        {scan.data.status}
                      </span>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-red-500">{scan.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
