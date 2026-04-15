import { useEffect, useState } from 'react';
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
    <div className="min-h-full">
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
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">These estimates use your contracted client rates, surcharge rules, and GST settings.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr,320px] gap-5">
          <div className="client-premium-card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700/60 bg-slate-50 dark:bg-[#0a1228] font-bold text-slate-900 dark:text-white">Rate Options</div>
            {estimates.length === 0 ? (
              <div className="p-5 text-sm text-slate-500 dark:text-slate-400">No active contracted rates found for this account.</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {estimates.map((row, index) => (
                  <div key={row.id} className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{row.name}</span>
                          {index === 0 && <span className="badge badge-success">Best Price</span>}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{row.courier} · {row.service} · {row.pricingType}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-slate-900 dark:text-white">{money(row.total)}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">for {row.weight} kg</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm">
                      <div><div className="text-xs text-slate-400 dark:text-slate-500">Base</div><div className="font-semibold text-slate-800 dark:text-slate-200">{money(row.base)}</div></div>
                      <div><div className="text-xs text-slate-400 dark:text-slate-500">Fuel</div><div className="font-semibold text-slate-800 dark:text-slate-200">{money(row.fuelSurcharge)}</div></div>
                      <div><div className="text-xs text-slate-400 dark:text-slate-500">GST</div><div className="font-semibold text-slate-800 dark:text-slate-200">{money(row.gst)}</div></div>
                      <div><div className="text-xs text-slate-400 dark:text-slate-500">Total</div><div className="font-semibold text-emerald-700 dark:text-emerald-400">{money(row.total)}</div></div>
                    </div>
                    {row.notes && <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">{row.notes}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="client-premium-card p-5">
            <h2 className="font-bold text-slate-900 dark:text-white">Active Contracts</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Visible rates currently available to this client account.</p>
            <div className="mt-4 space-y-3">
              {contracts.length === 0 ? (
                <div className="text-sm text-slate-500 dark:text-slate-400">No active contracts found.</div>
              ) : contracts.map((contract) => (
                <div key={contract.id} className="rounded-xl border border-slate-200 dark:border-slate-700/60 p-3 bg-slate-50 dark:bg-[#0a1228]">
                  <div className="font-semibold text-slate-900 dark:text-white">{contract.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{contract.courier || 'Any courier'} · {contract.service || 'Standard'}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">Base rate: {money(contract.baseRate)} · Min charge: {money(contract.minCharge)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
