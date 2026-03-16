import { useState } from 'react';
import { Plus, Edit2, Trash2, Calculator, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import api from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { PageLoader, EmptyState } from '../components/ui/Loading';
import { Modal } from '../components/ui/Modal';

const PRICING_TYPES = [
  { value: 'PER_KG',        label: 'Per KG',        desc: 'Rate × weight' },
  { value: 'FLAT',          label: 'Flat Rate',      desc: 'Fixed amount per shipment' },
  { value: 'PER_SHIPMENT',  label: 'Per Shipment',   desc: 'Fixed amount regardless of weight' },
];
const COURIERS = ['','BlueDart','DTDC','FedEx','DHL','Delhivery','Ecom Express','XpressBees','Shadowfax','Other'];
const SERVICES = ['','Standard','Express','Priority','Economy','Same Day'];

const fmt = n => `₹${Number(n||0).toLocaleString('en-IN', {minimumFractionDigits:2})}`;

const empty = {
  clientCode:'', name:'', courier:'', service:'',
  pricingType:'PER_KG', baseRate:'', minCharge:'', fuelSurcharge:'0',
  gstPercent:'18', validFrom:'', validTo:'', active:true, notes:'',
};

export default function ContractsPage({ toast }) {
  const { data: contracts, loading, refetch } = useFetch('/contracts');
  const { data: clients }                      = useFetch('/clients');
  const [edit,    setEdit]   = useState(null);
  const [saving,  setSaving] = useState(false);
  const [form,    setForm]   = useState(empty);
  const [calc,    setCalc]   = useState({ weight:'', result: null });
  const [expanded, setExpanded] = useState({});

  const open = (c = null) => {
    setEdit(c || {});
    setForm(c ? { ...c, baseRate: c.baseRate, minCharge: c.minCharge, fuelSurcharge: c.fuelSurcharge, gstPercent: c.gstPercent } : empty);
  };

  const save = async () => {
    if (!form.clientCode || !form.name || !form.baseRate) {
      toast?.('Client, contract name, and base rate are required', 'error'); return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      if (edit?.id) payload.id = edit.id;
      await api.post('/contracts', payload);
      await refetch(); setEdit(null);
      toast?.('Contract saved ✓', 'success');
    } catch (err) { toast?.(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!confirm('Delete this contract?')) return;
    try { await api.delete(`/contracts/${id}`); await refetch(); toast?.('Deleted', 'success'); }
    catch (err) { toast?.(err.message, 'error'); }
  };

  const calcPrice = async (contract) => {
    if (!calc.weight) { toast?.('Enter weight to calculate', 'error'); return; }
    try {
      const res = await api.get(`/contracts/calculate?clientCode=${contract.clientCode}&courier=${contract.courier||''}&service=${contract.service||''}&weight=${calc.weight}`);
      setCalc(c => ({ ...c, result: res.data }));
    } catch {}
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Group by client
  const grouped = (contracts || []).reduce((acc, c) => {
    if (!acc[c.clientCode]) acc[c.clientCode] = [];
    acc[c.clientCode].push(c);
    return acc;
  }, {});

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contracts & Pricing</h1>
          <p className="text-xs text-gray-500 mt-0.5">Per-client pricing rules that auto-calculate shipment amounts</p>
        </div>
        <button onClick={() => open()} className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Add Contract
        </button>
      </div>

      {loading ? <PageLoader /> : !Object.keys(grouped).length ? (
        <EmptyState icon="📋" title="No contracts yet"
          action={<button onClick={() => open()} className="btn-primary btn-sm">Add first contract</button>} />
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([code, items]) => {
            const client = clients?.find(c => c.code === code);
            const isOpen = expanded[code];
            return (
              <div key={code} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpanded(e => ({ ...e, [code]: !e[code] }))}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-navy-600 flex items-center justify-center text-white font-bold text-sm">
                      {code[0]}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-900">{code}</p>
                      <p className="text-xs text-gray-500">{client?.company || ''} · {items.length} contract{items.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {items.map(c => (
                      <div key={c.id} className="px-5 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-sm text-gray-900">{c.name}</span>
                              {!c.active && <span className="badge badge-red text-[10px]">Inactive</span>}
                              <span className="badge badge-blue text-[10px]">{c.pricingType.replace('_',' ')}</span>
                              {c.courier && <span className="badge badge-gray text-[10px]">{c.courier}</span>}
                              {c.service  && <span className="badge badge-gray text-[10px]">{c.service}</span>}
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                              <PriceCell label="Base Rate" value={`${fmt(c.baseRate)}${c.pricingType === 'PER_KG' ? '/kg' : ''}`} />
                              <PriceCell label="Min Charge" value={fmt(c.minCharge)} />
                              <PriceCell label="Fuel Surcharge" value={`${c.fuelSurcharge}%`} />
                              <PriceCell label="GST" value={`${c.gstPercent}%`} />
                            </div>
                            {(c.validFrom || c.validTo) && (
                              <p className="text-[10px] text-gray-400 mt-2">
                                Valid: {c.validFrom || '—'} to {c.validTo || '—'}
                              </p>
                            )}
                            {/* Quick calc */}
                            <div className="flex items-center gap-2 mt-3">
                              <input type="number" placeholder="Weight (kg)" className="input w-32 text-xs py-1.5"
                                value={calc.weight} onChange={e => setCalc(x => ({ ...x, weight: e.target.value, result: null }))} />
                              <button onClick={() => calcPrice(c)} className="btn-secondary btn-sm gap-1">
                                <Calculator className="w-3 h-3" /> Calculate
                              </button>
                              {calc.result && (
                                <div className="flex items-center gap-3 text-xs bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
                                  <span className="text-gray-500">Base: <strong>{fmt(calc.result.base)}</strong></span>
                                  <span className="text-gray-500">GST: <strong>{fmt(calc.result.gst)}</strong></span>
                                  <span className="text-green-700 font-bold">Total: {fmt(calc.result.total)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1.5 shrink-0">
                            <button onClick={() => open(c)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => del(c.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit Contract' : 'New Contract'}
        footer={<>
          <button onClick={() => setEdit(null)} className="btn-secondary">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save Contract'}</button>
        </>}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Client *</label>
              <select className="input" value={form.clientCode} onChange={e => set('clientCode', e.target.value)}>
                <option value="">— Select Client —</option>
                {(clients||[]).map(c => <option key={c.code} value={c.code}>{c.code} — {c.company}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Contract Name *</label>
              <input className="input" placeholder="e.g. BlueDart Standard Rate" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Applies to Courier <span className="text-gray-400 font-normal">(blank = all)</span></label>
              <select className="input" value={form.courier} onChange={e => set('courier', e.target.value)}>
                {COURIERS.map(c => <option key={c} value={c}>{c || '— All Couriers —'}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Applies to Service <span className="text-gray-400 font-normal">(blank = all)</span></label>
              <select className="input" value={form.service} onChange={e => set('service', e.target.value)}>
                {SERVICES.map(s => <option key={s} value={s}>{s || '— All Services —'}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Pricing Type *</label>
            <div className="grid grid-cols-3 gap-2">
              {PRICING_TYPES.map(pt => (
                <button key={pt.value} type="button"
                  onClick={() => set('pricingType', pt.value)}
                  className={`p-2.5 rounded-lg border text-xs text-left transition-all ${form.pricingType === pt.value ? 'border-navy-600 bg-navy-50 text-navy-700' : 'border-gray-200 hover:border-gray-300'}`}>
                  <p className="font-bold">{pt.label}</p>
                  <p className="text-gray-500 mt-0.5">{pt.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Base Rate (₹) * {form.pricingType === 'PER_KG' && <span className="text-gray-400 font-normal">per kg</span>}</label>
              <input type="number" step="0.01" min="0" className="input" placeholder="0.00" value={form.baseRate} onChange={e => set('baseRate', e.target.value)} />
            </div>
            <div>
              <label className="label">Minimum Charge (₹)</label>
              <input type="number" step="0.01" min="0" className="input" placeholder="0.00" value={form.minCharge} onChange={e => set('minCharge', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Fuel Surcharge %</label>
              <input type="number" step="0.1" min="0" className="input" placeholder="0" value={form.fuelSurcharge} onChange={e => set('fuelSurcharge', e.target.value)} />
            </div>
            <div>
              <label className="label">GST %</label>
              <input type="number" step="0.1" min="0" className="input" placeholder="18" value={form.gstPercent} onChange={e => set('gstPercent', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Valid From</label>
              <input type="date" className="input" value={form.validFrom} onChange={e => set('validFrom', e.target.value)} />
            </div>
            <div>
              <label className="label">Valid To</label>
              <input type="date" className="input" value={form.validTo} onChange={e => set('validTo', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} placeholder="Any notes about this contract…" value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} className="w-4 h-4 accent-navy-600" />
            <span className="text-sm">Contract is active</span>
          </label>
        </div>
      </Modal>
    </div>
  );
}

function PriceCell({ label, value }) {
  return (
    <div className="bg-gray-50 rounded-lg p-2.5">
      <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="font-bold text-sm text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}
