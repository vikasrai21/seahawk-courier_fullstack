import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ScanLine, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Download, 
  Zap, 
  Camera, 
  X, 
  Clipboard, 
  Package,
  History,
  Info,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import * as XLSX from 'xlsx';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/ui/StatusBadge';

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
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.1);
  } catch (e) { console.debug('Success tone failed', e); }
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
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.3);
  } catch (e) { console.debug('Error tone failed', e); }
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
  const [lastFeedback, setLastFeedback] = useState(null); // 'success' | 'error'
  const inputRef = useRef(null);
  const videoRef = useRef(null);
  const scannerRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const stopCamera = useCallback(async () => {
    try { await scannerRef.current?.reset(); } catch {}
    scannerRef.current = null;
    setCameraActive(false);
  }, []);

  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  const triggerFeedback = (type) => {
     setLastFeedback(type);
     setTimeout(() => setLastFeedback(null), 1000);
  };

  const processSingleScan = async (rawAwb) => {
      const currentAwb = String(rawAwb || '').trim();
      if (!currentAwb) return;
      setLoading(true);
      setAwb('');
      try {
        const res = await api.post('/shipments/scan', { awb: currentAwb, courier });
        playSuccess();
        triggerFeedback('success');
        setRecentScans(prev => [
          { awb: currentAwb, courier, status: 'success', data: res.data.shipment, timestamp: new Date() },
          ...prev
        ].slice(0, 50));
      } catch (err) {
        playError();
        triggerFeedback('error');
        setRecentScans(prev => [
          { awb: currentAwb, courier, status: 'error', error: err.message, timestamp: new Date() },
          ...prev
        ].slice(0, 50));
      } finally {
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
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
          setCameraError(error.message || 'Sensor failure');
        }
      });
      setCameraActive(true);
    } catch (err) {
      setCameraError(err.message || 'Camera access denied');
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
      setBulkText('');
      try {
        const res = await api.post('/shipments/scan-bulk', { awbs: awbList, courier });
        if (res.data.jobId) {
          toast(`Bulk Engine: Processing Job Node #${res.data.jobId}`, 'success');
          setRecentScans([{ awb: 'BULK_BATCH_NODE', status: 'success', data: { status: 'Processing', consignee: 'Internal Queue', destination: 'Worker' }, timestamp: new Date() }, ...recentScans]);
          return;
        }
        playSuccess();
        triggerFeedback('success');
        const newScans = (res.data.successful || []).map(s => ({ awb: s.awb, courier, status: 'success', data: s.data, timestamp: new Date() }));
        const failed = (res.data.failed || []).map(f => ({ awb: f.awb, courier, status: 'error', error: f.error, timestamp: new Date() }));
        setRecentScans(prev => [...newScans, ...failed, ...prev].slice(0, 100));
      } catch (err) {
        toast(err.message, 'error');
        triggerFeedback('error');
      } finally {
        setLoading(false);
      }
    }
  };

  if (!canScan) return <div className="p-12 text-center text-[10px] font-black uppercase tracking-[0.3em] text-rose-500">Access Denied: Operational Clearance Required</div>;

  return (
    <div className={`min-h-screen transition-all duration-300 ${lastFeedback === 'success' ? 'bg-emerald-500/10' : lastFeedback === 'error' ? 'bg-rose-500/10' : 'bg-slate-50 dark:bg-slate-950'}`}>
      <div className="mx-auto max-w-4xl p-6 lg:p-12 space-y-8 animate-in fade-in duration-700">
        
        {/* Header Command Strip */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-4 text-center md:text-left">
              <div className={`w-14 h-14 rounded-[22px] flex items-center justify-center transition-all duration-300 ${loading ? 'bg-blue-500 animate-spin text-white shadow-xl shadow-blue-500/20' : 'bg-slate-900 text-white shadow-xl shadow-slate-900/10'}`}>
                 <ScanLine size={28} />
              </div>
              <div>
                 <h1 className="text-2xl font-black text-slate-800 dark:text-white leading-none tracking-tight">Rapid Terminal</h1>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center gap-2 justify-center md:justify-start">
                    <Zap size={12} className="text-blue-500 animate-pulse" /> High-Velocity AWB Engagement
                 </p>
              </div>
           </div>
           
           <div className="flex bg-slate-200/50 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
              <button 
                onClick={() => { setScanMode('single'); setTimeout(() => inputRef.current?.focus(), 50); }}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${scanMode === 'single' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                 Quantum Mono
              </button>
              <button 
                onClick={() => setScanMode('bulk')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${scanMode === 'bulk' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                 Batch Array
              </button>
           </div>
        </div>

        {/* Scanner Deck */}
        <div className="rounded-[40px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-sm relative overflow-hidden group">
           <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/5 blur-[80px] pointer-events-none group-hover:bg-blue-500/10 transition-all duration-1000" />
           
           <form onSubmit={handleScan} className="flex flex-col gap-6 relative z-10">
              <div className="flex flex-col lg:flex-row gap-4">
                 <div className="lg:w-64">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Network Node</label>
                    <div className="relative">
                       <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                       <select 
                         className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-black text-slate-800 dark:text-white appearance-none uppercase tracking-widest"
                         value={courier}
                         onChange={(e) => setCourier(e.target.value)}
                         disabled={loading}
                       >
                          <option value="Delhivery">Delhivery Alpha</option>
                          <option value="Trackon">Trackon Prime</option>
                          <option value="DTDC">DTDC Global</option>
                       </select>
                    </div>
                 </div>

                 <div className="flex-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">
                       {scanMode === 'single' ? 'Terminal Entry' : 'Array Input (CSV/Excel)'}
                    </label>
                    {scanMode === 'single' ? (
                       <div className="relative group/input">
                          <input
                            ref={inputRef}
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-3xl font-black text-slate-800 dark:text-white font-mono placeholder:text-slate-200 tabular-nums focus:ring-2 focus:ring-blue-500/10 transition-all"
                            placeholder="000000000000"
                            value={awb}
                            onChange={(e) => setAwb(e.target.value)}
                            disabled={loading}
                            autoFocus
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                             <button
                               type="button"
                               onClick={cameraActive ? stopCamera : startCamera}
                               className={`p-3 rounded-xl transition-all ${cameraActive ? 'bg-rose-500 text-white animate-pulse' : 'bg-white dark:bg-slate-700 text-slate-400 hover:text-blue-500 shadow-sm'}`}
                               disabled={loading}
                             >
                                {cameraActive ? <X size={20} /> : <Camera size={20} />}
                             </button>
                             <button type="submit" className="hidden" />
                          </div>
                       </div>
                    ) : (
                       <div className="relative">
                          <Clipboard className="absolute left-4 top-4 w-4 h-4 text-slate-300" />
                          <textarea
                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-12 pr-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-300 font-mono min-h-[160px] focus:ring-2 focus:ring-blue-500/10 transition-all"
                            placeholder="Paste multiple AWBs here (Line separated)..."
                            value={bulkText}
                            onChange={(e) => setBulkText(e.target.value)}
                            disabled={loading}
                          />
                       </div>
                    )}
                 </div>
              </div>

              {cameraActive && (
                <div className="rounded-3xl overflow-hidden border-4 border-slate-900 bg-black relative group/camera">
                   <video ref={videoRef} className="w-full max-h-96 object-cover" muted playsInline />
                   <div className="absolute inset-0 pointer-events-none border-[40px] border-black/40 flex items-center justify-center">
                      <div className="w-64 h-32 border-2 border-white/50 rounded-xl relative">
                         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-rose-500/50 animate-[scan_2s_infinite]" />
                      </div>
                   </div>
                </div>
              )}

              {cameraError && (
                 <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-widest border border-rose-500/20">
                    <AlertCircle size={14} /> {cameraError}
                 </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                 <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scanner Ready</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manual Input: ON</span>
                    </div>
                 </div>
                 
                 <button 
                   type="submit"
                   disabled={loading || (scanMode === 'single' ? !awb.trim() : !bulkText.trim())}
                   className="w-full sm:w-auto px-10 py-5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-[22px] shadow-xl shadow-slate-900/20 active:scale-95 transition-all flex items-center justify-center gap-4 group/btn"
                 >
                    {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ScanLine size={20} className="group-hover/btn:scale-125 transition-transform" />}
                    {scanMode === 'single' ? 'Engage AWB' : 'Execute Batch Push'}
                 </button>
              </div>
           </form>
        </div>

        {/* Interaction Ledger */}
        <div className="space-y-4">
           <div className="flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                 <History size={16} className="text-slate-400" />
                 <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Tactical Scan Log</h3>
              </div>
              {recentScans.some(s => s.status === 'error') && (
                 <button 
                   onClick={() => {
                     const failed = recentScans.filter(s => s.status === 'error').map(s => ({ AWB: s.awb, Courier: s.courier, Error: s.error, Time: s.timestamp.toLocaleString() }));
                     const ws = XLSX.utils.json_to_sheet(failed);
                     const wb = XLSX.utils.book_new();
                     XLSX.utils.book_append_sheet(wb, ws, "FAILED_DELTA");
                     XLSX.writeFile(wb, "LOGISTICS_ERROR_REPORT.xlsx");
                   }}
                   className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:underline flex items-center gap-2"
                 >
                    <Download size={12} /> Export Faults
                 </button>
              )}
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentScans.length === 0 ? (
                <div className="md:col-span-2 p-12 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center">
                   <Package size={48} className="text-slate-100 mb-4" />
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No activity in buffer. Terminal standby.</p>
                </div>
              ) : (
                recentScans.map((scan, idx) => (
                  <div key={idx} className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-xl transition-all duration-500 group/log overflow-hidden relative">
                     {scan.status === 'success' && <div className="absolute right-[-20px] top-[-20px] w-16 h-16 bg-emerald-500/5 rounded-full blur-xl group-hover/log:bg-emerald-500/10 transition-all" />}
                     
                     <div className="flex items-start justify-between mb-4 relative z-10">
                        <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${scan.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                              {scan.status === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                           </div>
                           <div>
                              <div className="text-xs font-black text-slate-800 dark:text-white font-mono tracking-tight uppercase">{scan.awb}</div>
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{scan.courier} Node</div>
                           </div>
                        </div>
                        <span className="text-[9px] font-bold text-slate-300 tabular-nums">{scan.timestamp.toLocaleTimeString()}</span>
                     </div>

                     {scan.status === 'success' && scan.data ? (
                       <div className="grid grid-cols-2 gap-4 relative z-10 pt-4 border-t border-slate-50 dark:border-slate-800">
                          <LogStat icon={<Package size={12}/>} label="Consignee" value={scan.data.consignee || 'Unknown'} />
                          <LogStat icon={<Zap size={12}/>} label="Current Flux" value={scan.data.status} highlight />
                          <div className="col-span-2 pt-2">
                             <StatusBadge status={scan.data.status} />
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
      </div>
      
      {/* Neural Feedback Overlay */}
      <style>{`
         @keyframes scan {
           0% { top: 0; }
           50% { top: 100%; }
           100% { top: 0; }
         }
      `}</style>
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
