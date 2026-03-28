import { useState, useRef, useEffect } from 'react';
import { Package, ScanLine, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../context/AuthContext';

export default function ScanAWBPage() {
  const { toast } = useToast();
  const { isAdmin, hasRole } = useAuth();
  const canScan = isAdmin || hasRole('OPS_MANAGER') || hasRole('STAFF');
  const [awb, setAwb] = useState('');
  const [courier, setCourier] = useState('Delhivery');
  const [loading, setLoading] = useState(false);
  const [recentScans, setRecentScans] = useState([]);
  const inputRef = useRef(null);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleScan = async (e) => {
    e.preventDefault();
    const currentAwb = awb.trim();
    if (!currentAwb) return;

    setLoading(true);
    setAwb(''); // Clear input for next scan immediately

    try {
      const res = await api.post('/shipments/scan', { awb: currentAwb, courier });
      toast(`AWB scanned via ${courier} successfully`, 'success');
      
      // Add to recent scans list (keep last 10)
      setRecentScans(prev => [
        { awb: currentAwb, courier, status: 'success', data: res.data.shipment, timestamp: new Date() },
        ...prev
      ].slice(0, 10));

    } catch (err) {
      toast(err.message, 'error');
      setRecentScans(prev => [
        { awb: currentAwb, status: 'error', error: err.message, timestamp: new Date() },
        ...prev
      ].slice(0, 10));
    } finally {
      setLoading(false);
      // Re-focus after scan
      inputRef.current?.focus();
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
        <form onSubmit={handleScan} className="flex flex-col md:flex-row gap-3">
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
          <button 
            type="submit" 
            className="btn-primary py-3 px-6 h-auto md:w-auto w-full flex items-center justify-center gap-2"
            disabled={loading || !awb.trim()}
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ScanLine className="w-5 h-5" />}
            Scan
          </button>
        </form>
        <p className="text-[10px] text-gray-400 mt-2">
          Select the correct courier before scanning. Make sure your scanner sends an "Enter" suffix.
        </p>
      </div>

      {recentScans.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100 font-semibold text-sm text-gray-700">
            Recent Scans
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
