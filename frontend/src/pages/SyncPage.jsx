import { useState } from 'react';
import { Download, DatabaseBackup, Info, FileSpreadsheet } from 'lucide-react';
import { advancedExportToExcel } from '../utils/excel';
import api from '../services/api';
import { useFetch } from '../hooks/useFetch';

const today = () => new Date().toISOString().split('T')[0];
const firstOfMonth = () => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; };
export default function SyncPage({ toast }) {
  const [exporting, setExporting] = useState(false);
  const [clientFilter, setClient] = useState('');
  const [fromDate,  setFrom]  = useState(firstOfMonth());
  const [toDate,    setTo]    = useState(today());
  const { data: clients } = useFetch('/clients');

  const exportExcel = async (mode = 'all') => {
    setExporting(true);
    try {
      const params = new URLSearchParams({ limit: 10000 });
      if (mode === 'filtered') {
        if (clientFilter) params.set('client', clientFilter);
        if (fromDate)     params.set('date_from', fromDate);
        if (toDate)       params.set('date_to', toDate);
      }

      const res = await api.get(`/shipments?${params}`);
      const data = res.data || [];

      if (!data.length) { toast?.('No shipments found for this filter', 'error'); return; }

      const rows = data.map((s, i) => ({
        'Sr.':         i + 1,
        'Date':        s.date,
        'Client':      s.clientCode,
        'AWB No':      s.awb,
        'Consignee':   s.consignee,
        'Destination': s.destination,
        'Courier':     s.courier,
        'Department':  s.department,
        'Service':     s.service,
        'Weight (kg)': s.weight,
        'Amount (₹)':  s.amount,
        'Status':      s.status,
        'Remarks':     s.remarks,
      }));

      const exportConfig = { sheets: [] };

      // If filtered by client, also add a summary sheet
      if (mode === 'filtered' && clientFilter) {
        const client  = clients?.find(c => c.code === clientFilter);
        const sumRows = [
          ['Seahawk Courier & Cargo — Shipment Report'],
          [`Client: ${clientFilter} — ${client?.company || ''}`],
          [`Period: ${fromDate} to ${toDate}`],
          [`Generated: ${new Date().toLocaleDateString('en-IN')}`],
          [],
          [`Total Shipments`, data.length],
          [`Total Amount (₹)`, data.reduce((a,s) => a + (s.amount||0), 0).toFixed(2)],
          [`Total Weight (kg)`, data.reduce((a,s) => a + (s.weight||0), 0).toFixed(2)],
        ];
        exportConfig.sheets.push({
          name: 'Summary',
          mode: 'aoa',
          data: sumRows,
          columnWidths: [40, 20]
        });
      }

      exportConfig.sheets.push({
        name: 'Shipments',
        mode: 'json',
        data: rows,
        columnWidths: [8, 15, 12, 20, 30, 20, 15, 12, 15, 12, 12, 15, 25],
        columns: Object.keys(rows[0]).map(k => ({ header: k, key: k }))
      });

      const fname = mode === 'filtered' && clientFilter
        ? `seahawk-${clientFilter}-${fromDate}-to-${toDate}.xlsx`
        : `seahawk-all-${today()}.xlsx`;

      await advancedExportToExcel(exportConfig, fname);
      toast?.(`Exported ${rows.length} shipments ✓`, 'success');
    } catch (err) { toast?.(err.message, 'error'); }
    finally { setExporting(false); }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Export & Backup</h1>
        <p className="text-sm text-gray-500 mt-1">Download your data as Excel files</p>
      </div>

      {/* Filtered export */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        <div className="flex items-start gap-4 mb-4">
          <div className="text-3xl">📊</div>
          <div>
            <h3 className="font-bold text-gray-900">Export Filtered Report</h3>
            <p className="text-xs text-gray-500 mt-0.5">Export by client, date range, or both — great for sending reports to clients</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="label">Client</label>
            <select className="input" value={clientFilter} onChange={e => setClient(e.target.value)}>
              <option value="">All Clients</option>
              {(clients||[]).map(c => <option key={c.code} value={c.code}>{c.code} — {c.company}</option>)}
            </select>
          </div>
          <div>
            <label className="label">From Date</label>
            <input type="date" className="input" value={fromDate} onChange={e => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">To Date</label>
            <input type="date" className="input" value={toDate} onChange={e => setTo(e.target.value)} />
          </div>
        </div>
        <button onClick={() => exportExcel('filtered')} disabled={exporting} className="btn-primary btn-sm gap-2">
          <FileSpreadsheet className="w-3.5 h-3.5" />
          {exporting ? 'Exporting…' : 'Export Filtered Report'}
        </button>
      </div>

      {/* Full backup export */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
        <div className="flex items-start gap-4">
          <div className="text-3xl">📥</div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900">Export All Shipments (Full Backup)</h3>
            <p className="text-xs text-gray-500 mt-0.5">Downloads every shipment in the database — use as a full backup</p>
            <button onClick={() => exportExcel('all')} disabled={exporting} className="btn-secondary btn-sm mt-3 gap-2">
              <Download className="w-3.5 h-3.5" />
              {exporting ? 'Exporting…' : 'Export All to Excel'}
            </button>
          </div>
        </div>
      </div>

      {/* Info cards */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-blue-900 text-sm">Multi-Computer Access</h3>
            <p className="text-sm text-blue-800 mt-1">All computers on the same network share the same live data — no sync needed. Open the Network IP shown in <code className="bg-blue-100 px-1 rounded">start-seahawk.bat</code> on any other computer.</p>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-100 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <DatabaseBackup className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-yellow-900 text-sm">Automatic Database Backup</h3>
            <p className="text-sm text-yellow-800 mt-1">Daily backups run at 2 AM automatically, saved to <code className="bg-yellow-100 px-1 rounded">seahawk/backups/</code>.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
