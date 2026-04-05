import { useState } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import api from '../../services/api';

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
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
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
      const res = await api.post('/portal/import', { shipments: rows });
      setResult(res.data || {});
      toast?.(res.message || 'Import completed', 'success');
    } catch (err) {
      toast?.(err.message || 'Import failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link to="/portal" className="text-gray-400 hover:text-gray-600">← Portal</Link>
        <span className="font-bold text-gray-900">Order Import</span>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-5">
        <div className="card">
          <h1 className="font-bold text-gray-900">Upload Excel / CSV</h1>
          <p className="text-sm text-gray-500 mt-1">Shopify exports and basic order sheets work best. We’ll auto-map common columns and import them into your account only.</p>
          <input className="mt-4 block w-full text-sm" type="file" accept=".xlsx,.xls,.csv" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <div className="mt-4 flex justify-end">
            <button className="btn-primary" onClick={importRows} disabled={loading || !rows.length}>
              {loading ? 'Importing…' : `Import ${rows.length || 0} Orders`}
            </button>
          </div>
        </div>

        {result && (
          <div className="card bg-green-50 border-green-100">
            <div className="font-semibold text-green-800">Import Summary</div>
            <div className="text-sm text-green-700 mt-2">
              Rows saved: {result.imported || 0}
              {' · '}
              Operational shipments: {result.operationalCreated || 0}
              {' · '}
              Repeated AWBs linked: {result.duplicates || 0}
            </div>
            {(result.errors || []).length > 0 && (
              <div className="mt-3 text-xs text-red-600 space-y-1">
                {result.errors.map((err, idx) => <div key={idx}>{err.awb}: {err.error}</div>)}
              </div>
            )}
          </div>
        )}

        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 font-bold text-gray-900">Preview</div>
          {rows.length === 0 ? (
            <div className="p-5 text-sm text-gray-500">No rows loaded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['AWB', 'Date', 'Consignee', 'Destination', 'Pincode', 'Courier', 'Weight', 'Amount'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.slice(0, 15).map((row) => (
                    <tr key={row.awb}>
                      <td className="px-4 py-3 font-mono text-xs">{row.awb}</td>
                      <td className="px-4 py-3">{row.date}</td>
                      <td className="px-4 py-3">{row.consignee || '—'}</td>
                      <td className="px-4 py-3">{row.destination || '—'}</td>
                      <td className="px-4 py-3">{row.pincode || '—'}</td>
                      <td className="px-4 py-3">{row.courier || '—'}</td>
                      <td className="px-4 py-3">{row.weight || 0}</td>
                      <td className="px-4 py-3">₹{Number(row.amount || 0).toLocaleString('en-IN')}</td>
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
