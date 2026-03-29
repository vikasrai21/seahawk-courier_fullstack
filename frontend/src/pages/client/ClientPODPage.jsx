import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function ClientPODPage({ toast }) {
  const [pods, setPods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/portal/pods');
        setPods(res.data?.pods || []);
      } catch (err) {
        toast?.(err.message || 'Failed to load POD records', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link to="/portal" className="text-gray-400 hover:text-gray-600">← Portal</Link>
        <span className="font-bold text-gray-900">Digital POD Viewer</span>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-5">
        <div className="card">
          <h1 className="font-bold text-gray-900">Delivered Shipment Proofs</h1>
          <p className="text-sm text-gray-500 mt-1">Open delivery proof links when available and see the last delivery scan instantly.</p>
        </div>

        <div className="card p-0 overflow-hidden">
          {loading ? (
            <div className="p-5 text-sm text-gray-500">Loading POD records…</div>
          ) : pods.length === 0 ? (
            <div className="p-5 text-sm text-gray-500">No delivered shipments found yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['AWB', 'Consignee', 'Destination', 'Delivered At', 'Location', 'Proof'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {pods.map((row) => (
                  <tr key={row.awb}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-900">{row.awb}</td>
                    <td className="px-4 py-3">{row.consignee || '—'}</td>
                    <td className="px-4 py-3">{row.destination || '—'}</td>
                    <td className="px-4 py-3">{new Date(row.deliveredAt).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">{row.deliveredLocation || '—'}</td>
                    <td className="px-4 py-3">
                      {row.hasProof ? (
                        <a href={row.proofUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Open proof</a>
                      ) : (
                        <span className="text-gray-400">Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
