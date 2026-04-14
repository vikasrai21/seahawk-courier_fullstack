import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import api from '../../services/api';

export default function ClientRTOIntelligencePage({ toast }) {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(90);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/portal/rto-intelligence?days=${days}`);
        setData(res.data || null);
      } catch (err) {
        toast?.(err.message || 'Failed to load RTO intelligence', 'error');
      }
    };
    load();
  }, [days]);

  const renderTable = (title, rows, keyLabel) => (
    <div className="client-premium-card p-0 overflow-hidden">
      <div className="px-4 py-3 border-b bg-gray-50 font-bold text-gray-900">{title}</div>
      {(rows || []).length === 0 ? (
        <div className="p-4 text-sm text-gray-500">No RTO data found for this period.</div>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {[keyLabel, 'RTO', 'Total', 'Rate'].map((h) => <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.key}>
                <td className="px-4 py-3 font-medium text-gray-900">{row.key}</td>
                <td className="px-4 py-3">{row.rto}</td>
                <td className="px-4 py-3">{row.total}</td>
                <td className="px-4 py-3">{row.rate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className="min-h-screen client-premium-shell">
      <header className="client-premium-header px-6 py-4 flex items-center gap-3">
        <Link to="/portal" className="text-gray-400 hover:text-gray-600">← Portal</Link>
        <span className="client-premium-title text-lg">RTO Intelligence</span>
      </header>

      <div className="client-premium-main">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="client-premium-card p-5 flex-1">
            <h1 className="font-bold text-gray-900">Return-to-Origin Insights</h1>
            <p className="text-sm text-gray-500 mt-1">Spot weak pin codes, destinations, and categories driving return behavior.</p>
          </div>
          <div className="flex gap-2">
            {[60, 90, 180].map((value) => (
              <button key={value} className={`btn-secondary ${days === value ? 'ring-2 ring-orange-200' : ''}`} onClick={() => setDays(value)}>
                {value} Days
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="client-premium-card p-5"><div className="text-xs text-gray-400 uppercase">Total Shipments</div><div className="mt-2 text-3xl font-bold text-gray-900">{data?.summary?.totalShipments || 0}</div></div>
          <div className="client-premium-card p-5"><div className="text-xs text-gray-400 uppercase">RTO Shipments</div><div className="mt-2 text-3xl font-bold text-red-700">{data?.summary?.totalRto || 0}</div></div>
          <div className="client-premium-card p-5"><div className="text-xs text-gray-400 uppercase">RTO Rate</div><div className="mt-2 text-3xl font-bold text-orange-600">{data?.summary?.rtoRate || 0}%</div></div>
        </div>

        <div className="client-premium-card p-5">
          <div className="font-bold text-gray-900 mb-3">Monthly RTO Trend</div>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.monthlyTrend || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line dataKey="rto" stroke="#dc2626" strokeWidth={2} />
                <Line dataKey="total" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {renderTable('Highest-Risk Pincodes', data?.topPincodes, 'Pincode')}
          {renderTable('Highest-Risk Destinations', data?.topDestinations, 'Destination')}
          {renderTable('Top Returned Categories', data?.topCategories, 'Category')}
        </div>
      </div>
    </div>
  );
}
