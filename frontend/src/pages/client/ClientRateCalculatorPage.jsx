import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function ClientRateCalculatorPage({ toast }) {
  const [weight, setWeight] = useState('1');
  const [estimates, setEstimates] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  const loadContracts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/portal/rate-calculator/contracts');
      setContracts(res.data?.contracts || []);
    } catch (err) {
      toast?.(err.message || 'Failed to load rate contracts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculate = async () => {
    if (!Number(weight) || Number(weight) <= 0) {
      toast?.('Enter a valid shipment weight', 'error');
      return;
    }
    setCalculating(true);
    try {
      const res = await api.get(`/portal/rate-calculator/estimate?weight=${encodeURIComponent(weight)}`);
      setEstimates(res.data?.estimates || []);
    } catch (err) {
      toast?.(err.message || 'Failed to calculate rates', 'error');
    } finally {
      setCalculating(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, []);

  useEffect(() => {
    if (!loading) calculate();
  }, [loading]);

  return (
    <div className="min-h-screen client-premium-shell">
      <header className="client-premium-header px-6 py-4 flex items-center gap-3">
        <Link to="/portal" className="text-gray-400 hover:text-gray-600">← Portal</Link>
        <span className="client-premium-title text-lg">Rate Calculator</span>
      </header>

      <div className="client-premium-main max-w-6xl">
        <div className="client-premium-card p-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[180px]">
              <label className="label">Chargeable Weight (kg)</label>
              <input className="input" type="number" step="0.1" min="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={calculate} disabled={calculating}>
              {calculating ? 'Calculating…' : 'Get My Rates'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3">These estimates use your contracted client rates, surcharge rules, and GST settings.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-5">
          <div className="client-premium-card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50 font-bold text-gray-900">Rate Options</div>
            {estimates.length === 0 ? (
              <div className="p-5 text-sm text-gray-500">No active contracted rates found for this account.</div>
            ) : (
              <div className="divide-y">
                {estimates.map((row, index) => (
                  <div key={row.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{row.name}</span>
                          {index === 0 && <span className="badge badge-green">Best Price</span>}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{row.courier} · {row.service} · {row.pricingType}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">{money(row.total)}</div>
                        <div className="text-xs text-gray-500">for {row.weight} kg</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm">
                      <div><div className="text-xs text-gray-400">Base</div><div className="font-semibold">{money(row.base)}</div></div>
                      <div><div className="text-xs text-gray-400">Fuel</div><div className="font-semibold">{money(row.fuelSurcharge)}</div></div>
                      <div><div className="text-xs text-gray-400">GST</div><div className="font-semibold">{money(row.gst)}</div></div>
                      <div><div className="text-xs text-gray-400">Total</div><div className="font-semibold text-green-700">{money(row.total)}</div></div>
                    </div>
                    {row.notes && <div className="mt-3 text-xs text-gray-500">{row.notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="client-premium-card p-5">
            <h2 className="font-bold text-gray-900">Active Contracts</h2>
            <p className="text-xs text-gray-500 mt-1">Visible rates currently available to this client account.</p>
            <div className="mt-4 space-y-3">
              {contracts.length === 0 ? (
                <div className="text-sm text-gray-500">No active contracts found.</div>
              ) : contracts.map((contract) => (
                <div key={contract.id} className="rounded-xl border border-gray-100 p-3 bg-gray-50">
                  <div className="font-semibold text-gray-900">{contract.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{contract.courier || 'Any courier'} · {contract.service || 'Standard'}</div>
                  <div className="text-xs text-gray-500 mt-2">Base rate: {money(contract.baseRate)} · Min charge: {money(contract.minCharge)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
