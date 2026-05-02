import { SkeletonTable } from '../components/ui/Skeleton';
import { useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, Calculator, ChevronDown, ChevronUp, Grid3X3, Layers, SlidersHorizontal } from 'lucide-react';
import api from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { EmptyState } from '../components/ui/Loading';
import { Modal } from '../components/ui/Modal';
import { PageHeader } from '../components/ui/PageHeader';

const MODES = [
  { value: 'surface', label: 'Surface' },
  { value: 'air', label: 'Air' },
  { value: 'express', label: 'Express' },
  { value: 'premium', label: 'Premium' },
];
const ZONES = [
  { value: 'local', label: 'Local' },
  { value: 'zonal', label: 'Zonal' },
  { value: 'metro', label: 'Metro' },
  { value: 'roi', label: 'Rest of India' },
];
const SLABS = ['0-500g', '500g-1kg', '1-5kg', '5kg+'];
const COURIERS = ['', 'BlueDart', 'DTDC', 'FedEx', 'DHL', 'Delhivery', 'Ecom Express', 'XpressBees', 'Shadowfax', 'Other'];

const fmt = n => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const buildMatrix = () => MODES.flatMap(mode => ZONES.flatMap(zone => SLABS.map(weightSlab => ({
  mode: mode.value,
  zone: zone.value,
  weightSlab,
  rate: 0,
  minCharge: 0,
  baseCharge: 0,
  perKgRate: 0,
}))));

const buildSimpleRules = () => [
  { zone: 'local', mode: '', rate: 0, minCharge: 0, baseCharge: 0 },
  { zone: 'roi', mode: 'air', rate: 0, minCharge: 0, baseCharge: 0 },
];

const empty = {
  clientCode: '',
  name: '',
  courier: '',
  service: '',
  pricingType: 'MATRIX',
  baseRate: 0,
  baseCharge: 0,
  minCharge: 0,
  fuelSurcharge: 0,
  gstPercent: 18,
  pricingRules: buildMatrix(),
  simpleRules: buildSimpleRules(),
  contractMode: 'detailed',
  validFrom: '',
  validTo: '',
  active: true,
  notes: '',
};

function mergeMatrix(rules = []) {
  const byKey = new Map((rules || []).map(rule => [`${rule.mode}:${rule.zone}:${rule.weightSlab}`, rule]));
  return buildMatrix().map(rule => ({ ...rule, ...(byKey.get(`${rule.mode}:${rule.zone}:${rule.weightSlab}`) || {}) }));
}

function readSimpleRules(contract) {
  if (contract?.pricingRules && !Array.isArray(contract.pricingRules) && contract.pricingRules.type === 'simple') {
    return contract.pricingRules.rules?.length ? contract.pricingRules.rules : buildSimpleRules();
  }
  return buildSimpleRules();
}

function contractMode(contract) {
  return contract?.pricingRules && !Array.isArray(contract.pricingRules) && contract.pricingRules.type === 'simple'
    ? 'simple'
    : 'detailed';
}

export default function ContractsPage({ toast }) {
  const { data: contracts, loading, refetch } = useFetch('/contracts');
  const { data: clients } = useFetch('/clients');
  const [edit, setEdit] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(empty);
  const [calc, setCalc] = useState({ weight: '', mode: 'air', zone: 'metro', result: null });
  const [expanded, setExpanded] = useState({});
  const [matrixMode, setMatrixMode] = useState('air');

  const grouped = useMemo(() => (contracts || []).reduce((acc, c) => {
    if (!acc[c.clientCode]) acc[c.clientCode] = [];
    acc[c.clientCode].push(c);
    return acc;
  }, {}), [contracts]);

  const open = (contract = null) => {
    setEdit(contract || {});
    setMatrixMode('air');
    setForm(contract ? {
      ...empty,
      ...contract,
      contractMode: contractMode(contract),
      pricingType: contractMode(contract) === 'simple' ? 'SIMPLE' : (Array.isArray(contract.pricingRules) && contract.pricingRules.length ? 'MATRIX' : contract.pricingType || 'PER_KG'),
      simpleRules: readSimpleRules(contract),
      pricingRules: mergeMatrix(Array.isArray(contract.pricingRules) ? contract.pricingRules : []),
    } : empty);
  };

  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const setRule = (index, key, value) => setForm(current => ({
    ...current,
    pricingRules: current.pricingRules.map((rule, i) => i === index ? { ...rule, [key]: Number(value || 0) } : rule),
  }));
  const setSimpleRule = (index, key, value) => setForm(current => ({
    ...current,
    simpleRules: current.simpleRules.map((rule, i) => i === index ? { ...rule, [key]: key === 'rate' || key === 'minCharge' || key === 'baseCharge' ? Number(value || 0) : value } : rule),
  }));
  const addSimpleRule = () => setForm(current => ({
    ...current,
    simpleRules: [...current.simpleRules, { zone: 'local', mode: '', rate: 0, minCharge: 0, baseCharge: 0 }],
  }));
  const removeSimpleRule = (index) => setForm(current => ({
    ...current,
    simpleRules: current.simpleRules.filter((_, i) => i !== index),
  }));

  const save = async () => {
    if (!form.clientCode || !form.name) {
      toast?.('Client and contract name are required', 'error');
      return;
    }
    setSaving(true);
    try {
      const activeRules = form.pricingRules.filter(rule => Number(rule.rate || 0) || Number(rule.minCharge || 0) || Number(rule.baseCharge || 0) || Number(rule.perKgRate || 0));
      const activeSimpleRules = form.simpleRules.filter(rule => Number(rule.rate || 0));
      const payload = form.contractMode === 'simple'
        ? { ...form, pricingRules: { type: 'simple', rules: activeSimpleRules }, pricingType: 'SIMPLE', contractMode: 'simple' }
        : { ...form, pricingRules: activeRules, pricingType: activeRules.length ? 'MATRIX' : form.pricingType, contractMode: 'detailed' };
      if (edit?.id) payload.id = edit.id;
      await api.post('/contracts', payload);
      await refetch();
      setEdit(null);
      toast?.('Contract saved', 'success');
    } catch (err) {
      toast?.(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const del = async (id) => {
    if (!confirm('Delete this contract?')) return;
    try {
      await api.delete(`/contracts/${id}`);
      await refetch();
      toast?.('Deleted', 'success');
    } catch (err) {
      toast?.(err.message, 'error');
    }
  };

  const calcPrice = async (contract) => {
    if (!calc.weight) {
      toast?.('Enter weight to calculate', 'error');
      return;
    }
    try {
      const params = new URLSearchParams({
        clientCode: contract.clientCode,
        courier: contract.courier || '',
        service: contract.service || calc.mode,
        mode: calc.mode,
        zone: calc.zone,
        weight: calc.weight,
      });
      const res = await api.get(`/contracts/calculate?${params}`);
      setCalc(current => ({ ...current, result: res.data }));
    } catch {
      toast?.('Could not calculate sample contract price', 'error');
    }
  };

  const matrixRows = form.pricingRules
    .map((rule, index) => ({ ...rule, index }))
    .filter(rule => rule.mode === matrixMode);

  return (
    <div className="mx-auto max-w-7xl p-6">
      <PageHeader
        title="Contracts & Pricing"
        subtitle="Per-client logistics pricing with mode, zone and weight-slab matrices."
        icon={Grid3X3}
        actions={<button onClick={() => open()} className="btn-primary gap-2"><Plus className="w-4 h-4" /> Add Contract</button>}
      />

      {loading ? <div className="p-6"><SkeletonTable rows={8} cols={6} /></div> : !Object.keys(grouped).length ? (
        <EmptyState icon="📋" title="No contracts yet" action={<button onClick={() => open()} className="btn-primary btn-sm">Add first contract</button>} />
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([code, items]) => {
            const client = clients?.find(c => c.code === code);
            const isOpen = expanded[code];
            return (
              <div key={code} className="card overflow-hidden !p-0">
                <button onClick={() => setExpanded(e => ({ ...e, [code]: !e[code] }))} className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-black text-white dark:bg-orange-600">{code[0]}</div>
                    <div className="text-left">
                      <p className="font-black text-slate-900 dark:text-white">{code}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-300">{client?.company || ''} · {items.length} contract{items.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {isOpen && (
                  <div className="divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800">
                    {items.map(c => (
                      <div key={c.id} className="px-5 py-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-slate-900 dark:text-white">{c.name}</span>
                              {!c.active && <span className="badge-error">Inactive</span>}
                              <span className="badge-info">{contractMode(c) === 'simple' ? `${c.pricingRules?.rules?.length || 0} simple rules` : Array.isArray(c.pricingRules) && c.pricingRules.length ? `${c.pricingRules.length} matrix rules` : c.pricingType?.replace('_', ' ')}</span>
                              {c.courier && <span className="badge">{c.courier}</span>}
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                              <PriceCell label="Base" value={fmt(c.baseCharge || c.baseRate)} />
                              <PriceCell label="Minimum" value={fmt(c.minCharge)} />
                              <PriceCell label="Fuel" value={`${c.fuelSurcharge || 0}%`} />
                              <PriceCell label="GST" value={`${c.gstPercent || 18}%`} />
                              <PriceCell label="Updated" value={c.updatedAt ? new Date(c.updatedAt).toLocaleDateString('en-IN') : '—'} />
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-2">
                              <input type="number" placeholder="Weight kg" className="input w-32 py-2 text-xs" value={calc.weight} onChange={e => setCalc(x => ({ ...x, weight: e.target.value, result: null }))} />
                              <select className="input w-32 py-2 text-xs" value={calc.mode} onChange={e => setCalc(x => ({ ...x, mode: e.target.value, result: null }))}>
                                {MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                              </select>
                              <select className="input w-40 py-2 text-xs" value={calc.zone} onChange={e => setCalc(x => ({ ...x, zone: e.target.value, result: null }))}>
                                {ZONES.map(z => <option key={z.value} value={z.value}>{z.label}</option>)}
                              </select>
                              <button onClick={() => calcPrice(c)} className="btn-secondary btn-sm gap-1"><Calculator className="w-3 h-3" /> Calculate</button>
                              {calc.result && <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">Total {fmt(calc.result.total)}</span>}
                            </div>
                          </div>
                          <div className="flex gap-1.5">
                            <button onClick={() => open(c)} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10"><Edit2 className="h-4 w-4" /></button>
                            <button onClick={() => del(c.id)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button>
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

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.id ? 'Edit Contract' : 'New Contract'} footer={<>
        <button onClick={() => setEdit(null)} className="btn-secondary">Cancel</button>
        <button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Contract'}</button>
      </>}>
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="label">Client *</label>
              <select className="input" value={form.clientCode} onChange={e => set('clientCode', e.target.value)}>
                <option value="">Select client</option>
                {(clients || []).map(c => <option key={c.code} value={c.code}>{c.code} - {c.company}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Contract Name *</label>
              <input className="input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. DTDC FY26 matrix" />
            </div>
            <div>
              <label className="label">Courier</label>
              <select className="input" value={form.courier || ''} onChange={e => set('courier', e.target.value)}>
                {COURIERS.map(c => <option key={c} value={c}>{c || 'All couriers'}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Fuel %</label>
                <input type="number" className="input" value={form.fuelSurcharge} onChange={e => set('fuelSurcharge', e.target.value)} />
              </div>
              <div>
                <label className="label">GST %</label>
                <input type="number" className="input" value={form.gstPercent} onChange={e => set('gstPercent', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950">
            <div className="grid grid-cols-2 gap-1">
              {[
                { id: 'simple', label: 'Simple Contract', icon: SlidersHorizontal, help: 'Flat pricing per zone and optional mode.' },
                { id: 'detailed', label: 'Detailed Contract', icon: Layers, help: 'Mode, zone and weight-slab matrix.' },
              ].map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => set('contractMode', option.id)}
                  className={`rounded-xl px-3 py-3 text-left transition-all ${form.contractMode === option.id ? 'bg-white text-slate-900 shadow-sm ring-1 ring-orange-500/20 dark:bg-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'}`}
                  title={option.help}
                >
                  <span className="flex items-center gap-2 text-sm font-black"><option.icon className="h-4 w-4" /> {option.label}</span>
                  <span className="mt-1 block text-xs font-medium opacity-70">{option.help}</span>
                </button>
              ))}
            </div>
          </div>

          {form.contractMode === 'simple' ? (
            <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-3 dark:border-slate-800">
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">Simple Rules</p>
                  <p className="text-xs text-slate-500 dark:text-slate-300">Flat price by zone, with optional mode-specific overrides.</p>
                </div>
                <button type="button" onClick={addSimpleRule} className="btn-secondary btn-sm"><Plus className="h-3 w-3" /> Add Rule</button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                    <tr>
                      <th className="px-3 py-2 text-left">Zone</th>
                      <th className="px-3 py-2 text-left">Mode</th>
                      <th className="px-3 py-2 text-right">Rate</th>
                      <th className="px-3 py-2 text-right">Base</th>
                      <th className="px-3 py-2 text-right">Min</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {form.simpleRules.map((rule, index) => (
                      <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                        <td className="px-3 py-2">
                          <select className="input w-36 py-2 text-xs" value={rule.zone} onChange={e => setSimpleRule(index, 'zone', e.target.value)}>
                            {ZONES.map(z => <option key={z.value} value={z.value}>{z.label}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select className="input w-36 py-2 text-xs" value={rule.mode || ''} onChange={e => setSimpleRule(index, 'mode', e.target.value)}>
                            <option value="">Any mode</option>
                            {MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                          </select>
                        </td>
                        {['rate', 'baseCharge', 'minCharge'].map(field => (
                          <td key={field} className="px-3 py-2">
                            <input type="number" min="0" step="0.01" className="input ml-auto w-24 rounded-xl px-3 py-2 text-right text-xs" value={rule[field] || ''} onChange={e => setSimpleRule(index, field, e.target.value)} />
                          </td>
                        ))}
                        <td className="px-3 py-2 text-right">
                          <button type="button" onClick={() => removeSimpleRule(index)} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"><Trash2 className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-3 dark:border-slate-800">
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white">Pricing Matrix</p>
                <p className="text-xs text-slate-500 dark:text-slate-300">Base charge + slab rate, with optional per-kg charge for 5kg+ excess.</p>
              </div>
              <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                {MODES.map(mode => (
                  <button key={mode.value} type="button" onClick={() => setMatrixMode(mode.value)} className={`rounded-lg px-3 py-1.5 text-xs font-bold ${matrixMode === mode.value ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 dark:text-slate-300'}`}>
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  <tr>
                    <th className="px-3 py-2 text-left">Zone</th>
                    <th className="px-3 py-2 text-left">Slab</th>
                    <th className="px-3 py-2 text-right">Slab Rate</th>
                    <th className="px-3 py-2 text-right">Base</th>
                    <th className="px-3 py-2 text-right">Min</th>
                    <th className="px-3 py-2 text-right">Per Kg</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {matrixRows.map(rule => (
                    <tr key={`${rule.mode}-${rule.zone}-${rule.weightSlab}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <td className="px-3 py-2 font-semibold text-slate-700 dark:text-slate-200">{ZONES.find(z => z.value === rule.zone)?.label}</td>
                      <td className="px-3 py-2 font-mono text-xs text-slate-500 dark:text-slate-300">{rule.weightSlab}</td>
                      {['rate', 'baseCharge', 'minCharge', 'perKgRate'].map(field => (
                        <td key={field} className="px-3 py-2">
                          <input type="number" min="0" step="0.01" className="input ml-auto w-24 rounded-xl px-3 py-2 text-right text-xs" value={form.pricingRules[rule.index]?.[field] || ''} onChange={e => setRule(rule.index, field, e.target.value)} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="label">Valid From</label>
              <input type="date" className="input" value={form.validFrom || ''} onChange={e => set('validFrom', e.target.value)} />
            </div>
            <div>
              <label className="label">Valid To</label>
              <input type="date" className="input" value={form.validTo || ''} onChange={e => set('validTo', e.target.value)} />
            </div>
          </div>
          <textarea className="input" rows={2} value={form.notes || ''} onChange={e => set('notes', e.target.value)} placeholder="Notes" />
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input type="checkbox" checked={!!form.active} onChange={e => set('active', e.target.checked)} className="h-4 w-4 accent-orange-600" />
            Contract is active
          </label>
        </div>
      </Modal>
    </div>
  );
}

function PriceCell({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/70">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}
