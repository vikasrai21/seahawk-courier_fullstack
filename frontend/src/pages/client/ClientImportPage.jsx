import { useState } from 'react';
import { readExcelAsJson } from '../../utils/excel';
import api from '../../services/api';
import ClientPortalPageIntro from '../../components/client/ClientPortalPageIntro';

const FIELD_MAP = {
  awb: ['awb', 'airway', 'tracking', 'shipment'],
  date: ['date', 'dispatch'],
  consignee: ['consignee', 'receiver', 'recipient', 'name'],
  destination: ['destination', 'city', 'location'],
  pincode: ['pincode', 'pin', 'zip'],
  courier: ['courier', 'carrier'],
  department: ['department', 'product', 'category'],
  service: ['service', 'mode'],
  weight: ['weight', 'kg', 'wt'],
  amount: ['amount', 'price', 'rate'],
  remarks: ['remarks', 'notes'],
};

function detectField(header) {
  const value = String(header || '').toLowerCase();
  return Object.entries(FIELD_MAP).find(([, patterns]) => patterns.some((p) => value.includes(p)))?.[0] || null;
}

function normalizeRows(rows) {
  return rows.map((row) => {
    const item = {};
    for (const [header, value] of Object.entries(row || {})) {
      const field = detectField(header);
      if (field && value !== '') item[field] = value;
    }
    return {
      awb: String(item.awb || '').trim().toUpperCase(),
      date: String(item.date || new Date().toISOString().slice(0, 10)).slice(0, 10),
      consignee: String(item.consignee || '').trim(),
      destination: String(item.destination || '').trim(),
      pincode: String(item.pincode || '').trim(),
      courier: String(item.courier || '').trim(),
      department: String(item.department || '').trim(),
      service: String(item.service || 'Standard').trim(),
      weight: Number(item.weight || 0),
      amount: Number(item.amount || 0),
      remarks: String(item.remarks || '').trim(),
      status: 'Booked',
    };
  }).filter((row) => row.awb);
}

export default function ClientImportPage({ toast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFile = async (file) => {
    try {
      const buf = await file.arrayBuffer();
      const { rows: rawRows } = await readExcelAsJson(buf, 0);
      setRows(normalizeRows(rawRows).slice(0, 500));
      setResult(null);
    } catch (err) {
      toast?.(err.message || 'Failed to read file', 'error');
    }
  };

  const importRows = async () => {
    if (!rows.length) {
      toast?.('Upload a CSV or Excel file first', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/portal/import', { shipments: rows }, { timeout: 600_000 });
      setResult(res.data || {});
      toast?.(`Import completed. Tracking sync started for ${res.data?.trackingQueued || 0} shipments.`, 'success');
    } catch (err) {
      toast?.(err.message || 'Import failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full">
      <div className="client-premium-main max-w-6xl">
        <ClientPortalPageIntro
          eyebrow="Order Import"
          title="Upload spreadsheets, auto-map the columns, and bring bulk orders into the client workspace safely."
          description="Shopify exports and basic CSV sheets work best. We detect common headers, preview the normalized rows, and then import them into your client account only."
          badges={['Excel and CSV', `${rows.length} rows staged`, `${result?.imported || 0} rows saved`]}
          actions={(
            <button className="client-action-btn-primary" onClick={importRows} disabled={loading || !rows.length}>
              {loading ? 'Importing…' : `Import ${rows.length || 0} orders`}
            </button>
          )}
        />
        <div className="client-premium-card p-5">
          <h1 className="font-bold text-slate-900 dark:text-white">Upload Excel / CSV</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Shopify exports and basic order sheets work best. We'll auto-map common columns and import them into your account only.</p>
          <input className="mt-4 block w-full text-sm text-slate-700 dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-orange-500/10 file:text-orange-600 dark:file:bg-orange-500/20 dark:file:text-orange-300 hover:file:bg-orange-500/20" type="file" accept=".xlsx,.xls,.csv" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <div className="mt-4 flex justify-end">
            <button className="client-action-btn-primary" onClick={importRows} disabled={loading || !rows.length}>
              {loading ? 'Importing…' : `Import ${rows.length || 0} Orders`}
            </button>
          </div>
        </div>

        {result && (
          <div className="client-premium-card p-5 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20">
            <div className="font-semibold text-emerald-800 dark:text-emerald-300">Import Summary</div>
            <div className="text-sm text-emerald-700 dark:text-emerald-200 mt-2">
              Rows saved: {result.imported || 0}
              {' · '}
              Operational shipments: {result.operationalCreated || 0}
              {' · '}
              Repeated AWBs linked: {result.duplicates || 0}
              {' · '}
              Tracking sync queued: {result.trackingQueued || 0}
            </div>
            {(result.errors || []).length > 0 && (
              <div className="mt-3 text-xs text-rose-600 dark:text-rose-400 space-y-1">
                {result.errors.map((err, idx) => <div key={idx}>{err.awb}: {err.error}</div>)}
              </div>
            )}
          </div>
        )}

        <div className="client-premium-card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-[#0a1228] font-bold text-slate-900 dark:text-white">Preview</div>
          {rows.length === 0 ? (
            <div className="p-5 text-sm text-slate-500 dark:text-slate-400">No rows loaded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-[#0a1228] border-b border-slate-200 dark:border-slate-700/60">
                  <tr>
                    {['AWB', 'Date', 'Consignee', 'Destination', 'Pincode', 'Courier', 'Weight', 'Amount'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {rows.slice(0, 15).map((row) => (
                    <tr key={row.awb} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3 font-mono text-xs text-slate-900 dark:text-white">{row.awb}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{row.date}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{row.consignee || '—'}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{row.destination || '—'}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{row.pincode || '—'}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{row.courier || '—'}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{row.weight || 0}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">₹{Number(row.amount || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
