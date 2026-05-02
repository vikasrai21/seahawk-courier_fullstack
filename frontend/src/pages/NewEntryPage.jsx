import { useState, useEffect, useRef } from 'react';
import { Plus, CheckCircle, Keyboard, ChevronRight, MapPin, Loader2, AlertCircle, PackagePlus, IndianRupee } from 'lucide-react';
import api from '../services/api';
import { StatusBadge } from '../components/ui/StatusBadge';
import { PageHeader } from '../components/ui/PageHeader';
import AutoRateSuggestion from '../components/shipment/AutoRateSuggestion';


const COURIERS  = ['BlueDart','DTDC','FedEx','DHL','Delhivery','Ecom Express','XpressBees','Shadowfax','Other'];
const STATUSES  = ['Booked','InTransit','OutForDelivery','Delivered','Delayed','RTO','Cancelled'];
const SERVICES  = ['Standard','Express','Priority','Economy','Same Day'];

const today = () => new Date().toISOString().split('T')[0];
const blank  = () => ({
  date: today(), clientCode:'', awb:'', consignee:'',
  pincode: '', destination:'', courier:'', department:'', weight:'', amount:'',
  service:'Standard', status:'Booked', remarks:''
});

const fmt = n => `₹${Number(n||0).toLocaleString('en-IN')}`;

export default function NewEntryPage({ toast }) {
  const [form,    setForm]    = useState(blank());
  const [clients, setClients] = useState([]);
  const [recent,  setRecent]  = useState([]);
  const [saving,  setSaving]  = useState(false);
  const [flash,   setFlash]   = useState(null);
  const [pinLoading, setPinLoading] = useState(false);
  const [touched, setTouched] = useState({});
  const [rateContext, setRateContext] = useState(null);
  const awbRef = useRef();

  useEffect(() => {
    api.get('/clients').then(r => setClients(r.data || [])).catch(() => undefined);
    loadRecent();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search || '');
    const destination = params.get('destination') || '';
    const pincode = params.get('pincode') || '';
    const weight = params.get('weight') || '';
    const amount = params.get('amount') || '';
    const courier = params.get('courier') || '';
    const courierMode = params.get('courierMode') || '';
    const quoteSource = params.get('quoteSource') || '';
    const margin = params.get('margin') || '';
    const profit = params.get('profit') || '';
    const serviceability = params.get('serviceability') || '';
    const rateDecision = params.get('rateDecision') || '';

    if (!destination && !pincode && !weight && !amount && !courier) return;

    setForm((current) => ({
      ...current,
      destination: destination ? destination.toUpperCase() : current.destination,
      pincode: pincode || current.pincode,
      weight: weight || current.weight,
      amount: amount || current.amount,
      courier: courier || current.courier,
      service: courierMode.toLowerCase().includes('priority') || courier.toLowerCase().includes('priority') ? 'Priority' : current.service,
      remarks: rateDecision ? `RATE: ${rateDecision}`.toUpperCase() : current.remarks,
    }));
    setRateContext({ courier, courierMode, quoteSource, margin, profit, serviceability, rateDecision, amount, weight, destination, pincode });
  }, []);

  const loadRecent = async () => {
    try {
      const res = await api.get('/shipments?limit=8&page=1');
      setRecent(res.data || []);
    } catch {
      // Recent shipments are optional for the quick-entry flow.
    }
  };

  const set = (k, v) => setForm(f => ({...f, [k]: v}));
  const handleBlur = (k) => setTouched(t => ({...t, [k]: true}));
  const courierOptions = form.courier && !COURIERS.includes(form.courier) ? [form.courier, ...COURIERS] : COURIERS;

  // ── Pincode Auto-fill ───────────────────────────────────────────────────
  useEffect(() => {
    const fetchLocation = async (pin) => {
      if (pin.length !== 6) return;
      setPinLoading(true);
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        const data = await res.json();
        if (data[0]?.Status === 'Success' && data[0]?.PostOffice?.length) {
          const po = data[0].PostOffice[0];
          const location = `${po.District}, ${po.State}`;
          setForm(f => ({...f, destination: location.toUpperCase()}));
          toast?.(`Location set to ${location} ✓`, 'info');
        }
      } catch (err) {
        console.error('Pincode fetch error:', err);
      } finally {
        setPinLoading(false);
      }
    };
    if (form.pincode.length === 6) fetchLocation(form.pincode);
  }, [form.pincode, toast]);

  const save = async (e) => {
    e?.preventDefault();
    if (!form.awb || !form.clientCode) {
      toast?.('AWB and Client are required', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/shipments', form);
      setFlash(res.data);
      setForm(f => ({...blank(), date: f.date, clientCode: f.clientCode, courier: f.courier, pincode: ''}));
      setTouched({});
      await loadRecent();
      toast?.(`✓ AWB ${res.data.awb} saved`, 'success');
      setTimeout(() => awbRef.current?.focus(), 100);
    } catch (err) {
      toast?.(err.message, 'error');
    } finally { setSaving(false); }
  };

  const handleKeyDown = (e, nextId) => {
    if (e.key === 'Enter') {
      if (e.ctrlKey || nextId === 'SAVE') { 
        save(); 
        return; 
      }
      e.preventDefault();
      document.getElementById(nextId)?.focus();
    }
  };

  const errors = {
    awb: touched.awb && !form.awb,
    clientCode: touched.clientCode && !form.clientCode,
    pincode: touched.pincode && form.pincode && form.pincode.length !== 6,
  };

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6">
      <PageHeader
        title="Quick Entry"
        subtitle="Rapid shipment booking with pincode auto-fill and keyboard shortcuts."
        icon={PackagePlus}
        actions={
          <div className="flex items-center gap-3">
            {flash && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 text-[10px] font-bold uppercase tracking-wider animate-in fade-in slide-in-from-right-4 duration-500">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Last Saved: {flash.awb}</span>
              </div>
            )}
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <Keyboard className="w-3 h-3" />
              <span>Enter to move · Ctrl+Enter to save</span>
            </div>
          </div>
        }
      />

      {rateContext && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-bold text-slate-700 shadow-sm dark:border-orange-500/20 dark:bg-orange-500/10 dark:text-slate-200">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <span>
              Rate calculator quote loaded: <strong className="text-slate-950 dark:text-white">{rateContext.courier}</strong> · {fmt(rateContext.amount)} · {rateContext.weight} kg · {rateContext.destination}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {rateContext.serviceability || 'Serviceability'} · Profit {fmt(rateContext.profit)} · Margin {Number(rateContext.margin || 0).toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      <form onSubmit={save} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden group/form transition-all hover:shadow-md">
        {/* Step 1: Core Identity */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800">
          <FieldCell label="Shipment Date" icon={ChevronRight} error={errors.date}>
            <input id="date" type="date" className="cell-input" value={form.date}
              onChange={e => set('date', e.target.value)}
              onKeyDown={e => handleKeyDown(e, 'clientCode')} />
          </FieldCell>
          
          <FieldCell label="Client Account" icon={ChevronRight} error={errors.clientCode}>
            <select id="clientCode" className="cell-input pr-8" value={form.clientCode}
              onChange={e => set('clientCode', e.target.value)}
              onBlur={() => handleBlur('clientCode')}
              onKeyDown={e => handleKeyDown(e, 'awb')}>
              <option value="">— Choose Client —</option>
              {clients.map(c => <option key={c.code} value={c.code}>{c.code} · {c.company}</option>)}
            </select>
          </FieldCell>
          
          <FieldCell label="AWB Number" icon={ChevronRight} error={errors.awb} hint="Unique tracking ID">
            <input id="awb" ref={awbRef} type="text" className="cell-input font-mono font-bold uppercase tracking-wider pr-10"
              placeholder="XXXXXXXXXXXX" value={form.awb}
              onChange={e => set('awb', e.target.value.toUpperCase())}
              onBlur={() => handleBlur('awb')}
              onKeyDown={e => handleKeyDown(e, 'consignee')} autoFocus />
            {errors.awb && <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500" />}
          </FieldCell>
        </div>

        {/* Step 2: Destination & Route */}
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/40">
          <FieldCell label="Consignee Name" icon={ChevronRight}>
            <input id="consignee" type="text" className="cell-input font-bold uppercase"
              placeholder="RECIPIENT NAME" value={form.consignee}
              onChange={e => set('consignee', e.target.value.toUpperCase())}
              onKeyDown={e => handleKeyDown(e, 'pincode')} />
          </FieldCell>

          <FieldCell label="Pincode" icon={MapPin} error={errors.pincode} hint="6 digits for auto-fill">
            <div className="relative w-full">
              <input id="pincode" type="text" maxLength={6} className="cell-input font-mono tracking-widest"
                placeholder="000000" value={form.pincode}
                onChange={e => set('pincode', e.target.value.replace(/\D/g, ''))}
                onBlur={() => handleBlur('pincode')}
                onKeyDown={e => handleKeyDown(e, 'destination')} />
              {pinLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500 animate-spin" />}
            </div>
          </FieldCell>

          <FieldCell label="City / State" icon={MapPin}>
            <input id="destination" type="text" className="cell-input uppercase font-semibold text-slate-600 dark:text-slate-300"
              placeholder="SEARCH OR RADIUS" value={form.destination}
              onChange={e => set('destination', e.target.value.toUpperCase())}
              onKeyDown={e => handleKeyDown(e, 'courier')} />
          </FieldCell>

          <FieldCell label="Carrier Partner" icon={ChevronRight}>
            <select id="courier" className="cell-input font-bold text-orange-600 dark:text-orange-400 pr-8" value={form.courier}
              onChange={e => set('courier', e.target.value)}
              onKeyDown={e => handleKeyDown(e, 'weight')}>
              <option value="">— Select —</option>
              {courierOptions.map(c => <option key={c}>{c}</option>)}
            </select>
          </FieldCell>
        </div>

        {/* Smart Rate Suggestion */}
        <AutoRateSuggestion
          pincode={form.pincode}
          weight={form.weight}
          clientCode={form.clientCode}
          shipType={form.service === 'Express' || form.service === 'Priority' ? 'exp' : 'doc'}
          onSelectCourier={(courier) => {
            const match = COURIERS.find(c => c.toLowerCase().includes(courier.toLowerCase().split(' ')[0]));
            if (match) set('courier', match);
          }}
          onSelectAmount={(amount) => set('amount', String(amount))}
        />

        {/* Step 3: Logistics & Billing */}
        <div className="grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800">
          <FieldCell label="Actual Wt" hint="Kilograms">
            <input id="weight" type="number" step="0.01" min="0" className="cell-input text-right font-bold"
              placeholder="0.00" value={form.weight}
              onChange={e => set('weight', e.target.value)}
              onKeyDown={e => handleKeyDown(e, 'amount')} />
          </FieldCell>
          
          <FieldCell label="Billing Amt" icon={IndianRupee} hint="Indian Rupees">
            <input id="amount" type="number" step="0.01" min="0" className="cell-input text-right font-bold text-emerald-600"
              placeholder="0.00" value={form.amount}
              onChange={e => set('amount', e.target.value)}
              onKeyDown={e => handleKeyDown(e, 'service')} />
          </FieldCell>

          <FieldCell label="Service Lvl">
            <select id="service" className="cell-input" value={form.service}
              onChange={e => set('service', e.target.value)}
              onKeyDown={e => handleKeyDown(e, 'status')}>
              {SERVICES.map(s => <option key={s}>{s}</option>)}
            </select>
          </FieldCell>

          <FieldCell label="Current Status">
            <select id="status" className="cell-input font-bold" value={form.status}
              onChange={e => set('status', e.target.value)}
              onKeyDown={e => handleKeyDown(e, 'remarks')}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </FieldCell>

          <FieldCell label="Ref / Notes" hint="Optional">
            <input id="remarks" type="text" className="cell-input"
              placeholder="..." value={form.remarks}
              onChange={e => set('remarks', e.target.value)}
              onKeyDown={e => handleKeyDown(e, 'SAVE')} />
          </FieldCell>
        </div>

        {/* Action Row */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 dark:bg-slate-900">
           <div className="hidden lg:block text-[10px] items-center gap-6 font-bold text-slate-400 uppercase tracking-widest text-center">
              Automated Data Validation Active
           </div>
          <button type="submit" disabled={saving || errors.awb || errors.clientCode}
            className="group relative flex items-center gap-3 bg-slate-900 dark:bg-orange-600 text-white px-8 py-3 rounded-2xl font-bold transition-all hover:scale-[1.02] active:scale-95 disabled:grayscale disabled:opacity-50 shadow-xl shadow-slate-900/10 overflow-hidden">
             {saving && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
             {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />}
             <span>{saving ? 'Processing...' : 'Complete Booking'}</span>
          </button>
        </div>
      </form>

      {/* Recent Activity Mini-List */}
      {recent.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Session Activity Log</h2>
            <div className="h-[1px] flex-1 mx-6 bg-slate-100 dark:bg-slate-800" />
            <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-500 uppercase">{recent.length} Operations</span>
          </div>
          
          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Carrier & AWB</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Consignee Info</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Weight</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Revenue</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Lifecycle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {recent.map(s => (
                  <tr key={s.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1">{s.courier}</span>
                        <span className="text-sm font-black text-slate-900 dark:text-white font-mono tracking-wider">{s.awb}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{s.consignee}</span>
                        <span className="text-[10px] font-medium text-slate-400">{s.destination}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-xs font-black text-slate-600 dark:text-slate-400 tabular-nums">{s.weight} KG</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-black text-slate-900 dark:text-white tabular-nums">{fmt(s.amount)}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={s.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <style>{`
        .cell-input { 
          width: 100%;
          background: transparent;
          padding: 1rem;
          font-size: 0.875rem;
          transition: all 0.2s;
          border: none;
        }
        .cell-input:focus {
           outline: none;
           background: white;
           box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
        }
        .dark .cell-input:focus {
          background: rgba(30, 41, 59, 0.5);
        }
      `}</style>
    </div>
  );
}

function FieldCell({ label, hint, error, children }) {
  return (
    <div className={`relative flex flex-col min-h-[90px] transition-colors ${error ? 'bg-rose-50/50 dark:bg-rose-950/10' : ''}`}>
      <div className="px-4 pt-4 pb-1 flex items-center justify-between">
        <label className={`text-[9px] font-black uppercase tracking-[0.15em] ${error ? 'text-rose-500' : 'text-slate-400'}`}>
          {label}
        </label>
        {hint && !error && <span className="text-[8px] text-slate-300 dark:text-slate-600 font-bold uppercase tracking-widest">{hint}</span>}
      </div>
      <div className="relative flex-1 flex items-center">
        {children}
      </div>
    </div>
  );
}
