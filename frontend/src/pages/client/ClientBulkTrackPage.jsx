import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function ClientBulkTrackPage({ toast }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      toast?.('Paste at least one AWB number', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/portal/bulk-track', { text: trimmed });
      setResult(res.data);
      toast?.(`Tracked ${res.data?.found || 0} shipments`, 'success');
    } catch (e) {
      toast?.(e.message || 'Bulk tracking failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link to="/portal" className="text-gray-400 hover:text-gray-600">← Portal</Link>
        <span className="font-bold text-gray-900">Bulk AWB Tracking</span>
      </header>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="card space-y-4">
          <div>
            <h1 className="text-xl font-black text-gray-900">Track Multiple Shipments</h1>
            <p className="text-sm text-gray-500 mt-1">
              Paste AWB numbers separated by commas, spaces, or new lines to get a live status table.
            </p>
          </div>
          <textarea
            className="input min-h-[180px]"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'e.g.\n1234567890\n2345678901\n3456789012'}
          />
          <div className="flex gap-3">
            <button onClick={submit} disabled={loading} className="btn-primary">
              {loading ? 'Tracking…' : 'Track Shipments'}
            </button>
            <button onClick={() => { setText(''); setResult(null); }} className="btn-secondary">
              Clear
            </button>
          </div>
        </div>

        {result && (
          <div className="card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap gap-4 text-sm">
              <span><strong>{result.total}</strong> submitted</span>
              <span><strong className="text-green-600">{result.found}</strong> found</span>
              <span><strong className="text-red-600">{result.missing}</strong> missing</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['AWB', 'Status', 'Courier', 'Destination', 'Consignee', 'Latest Event', 'Updated'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {(result.results || []).map((row) => (
                    <tr key={row.awb} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs font-bold">{row.awb}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${row.found ? 'badge-blue' : 'badge-red'}`}>{row.status}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{row.courier || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{row.destination || '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{row.consignee || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{row.latestEvent?.status || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {row.lastUpdatedAt ? new Date(row.lastUpdatedAt).toLocaleString('en-IN') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
