import { useMemo, useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, MapPin, Settings2, Search, Truck, Zap, ShieldCheck, 
  ChevronRight, Scale, Info, ChevronDown, ChevronUp, Box, CheckCircle2, 
  Save, AlertCircle, FileSpreadsheet, UploadCloud, Users, ArrowRight, Copy, Check, Circle
} from 'lucide-react';
import api from '../../services/api';

const COURIERS = [
  { id: 'AUTO', name: 'Sea Hawk AI Routing', speed: 'Fastest', reliability: '99.8%', tag: 'Recommended' },
  { id: 'Delhivery', name: 'Delhivery', speed: '2-3 Days', reliability: '98.5%' },
  { id: 'DTDC', name: 'DTDC', speed: '3-4 Days', reliability: '97.2%' },
  { id: 'Trackon', name: 'Trackon', speed: '4-5 Days', reliability: '95.0%' },
];

const RECENT_CUSTOMERS = [
  { phone: '9876543210', name: 'Aditya Raj', address: 'B-14, Vasant Vihar', city: 'New Delhi', state: 'Delhi', pincode: '110057' },
  { phone: '9123456789', name: 'Priya Sharma', address: '402, Seawood Estates', city: 'Navi Mumbai', state: 'Maharashtra', pincode: '400706' },
  { phone: '9988776655', name: 'Rahul Verma', address: 'Sector 14, Plot 89', city: 'Gurugram', state: 'Haryana', pincode: '122001' },
];

const initialForm = {
  courier: 'AUTO',
  dryRun: false,
  orderRef: '',
  consignee: '',
  deliveryAddress: '',
  deliveryCity: '',
  deliveryState: '',
  pincode: '',
  phone: '',
  weightKg: '',
  length: '',
  width: '',
  height: '',
  packageType: 'Box',
  declaredValue: '',
  service: 'Standard',
  paymentMode: 'Prepaid',
  codAmount: '',
  contents: '',
};

function FormGroup({ label, required, children, tooltip, error, hint }) {
  return (
    <div className="space-y-1.5 flex flex-col relative group">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          {label} {required && <span className="text-red-500">*</span>}
          {hint && <span className="text-[9px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded tracking-normal normal-case font-semibold">{hint}</span>}
        </label>
        {tooltip && (
          <div className="relative flex items-center justify-center text-slate-400 hover:text-sky-500 transition-colors cursor-help">
            <Info size={14} />
            <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-20 shadow-xl font-normal leading-relaxed text-left">
              {tooltip}
            </div>
          </div>
        )}
      </div>
      <div className="relative">
        {children}
      </div>
      {error && <p className="text-[10px] font-bold text-red-500 mt-1 flex items-center gap-1 absolute -bottom-5"><AlertCircle size={10} /> {error}</p>}
    </div>
  );
}

export default function ClientBookShipmentPage({ toast }) {
  const [mode, setMode] = useState('single'); 
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCouriers, setShowCouriers] = useState(false);
  
  const [searchCustomer, setSearchCustomer] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const filteredCustomers = useMemo(() => {
    if (!searchCustomer) return [];
    const q = searchCustomer.toLowerCase();
    return RECENT_CUSTOMERS.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q));
  }, [searchCustomer]);

  const requestKeyByFingerprintRef = useRef(new Map());

  // Keyboard UX
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (mode === 'single') document.getElementById('submit-booking-btn')?.click();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        toast?.('Draft saved locally', 'success');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, toast]);

  // Pincode auto-fetch
  useEffect(() => {
    const pin = form.pincode.replace(/\D/g, '');
    if (pin.length === 6 && !form.deliveryCity) {
      fetch(`https://api.postalpincode.in/pincode/${pin}`)
        .then(r => r.json())
        .then(data => {
          if (data && data[0].Status === 'Success') {
            const po = data[0].PostOffice[0];
            setForm(f => ({ ...f, deliveryCity: po.District || po.Region, deliveryState: po.State }));
            setErrors(e => ({ ...e, pincode: null }));
          } else {
            setErrors(e => ({ ...e, pincode: 'Invalid pincode' }));
          }
        }).catch(() => {});
    }
  }, [form.pincode, form.deliveryCity]);

  const validateField = (k, v) => {
    let err = null;
    if (k === 'phone' && v && !/^\d{10}$/.test(v)) err = 'Must be 10 digits';
    if (k === 'pincode' && v && !/^\d{6}$/.test(v)) err = 'Must be 6 digits';
    if (k === 'weightKg' && v && Number(v) <= 0) err = 'Invalid weight';
    if (k === 'codAmount' && form.paymentMode === 'COD' && Number(v) < 1) err = 'Required for COD';
    setErrors(prev => ({ ...prev, [k]: err }));
    return err === null;
  };

  const update = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    validateField(key, value);
  };

  const selectCustomer = (c) => {
    setForm(f => ({
      ...f, consignee: c.name, phone: c.phone, deliveryAddress: c.address, 
      deliveryCity: c.city, deliveryState: c.state, pincode: c.pincode
    }));
    setSearchCustomer('');
    setShowSuggestions(false);
  };

  const weightGrams = useMemo(() => {
    const n = Number(form.weightKg || 0);
    return Number.isFinite(n) && n > 0 ? Math.round(n * 1000) : 0;
  }, [form.weightKg]);

  const bookingFingerprint = useMemo(() => JSON.stringify({
    courier: form.courier, consignee: form.consignee.trim().toUpperCase(), pincode: form.pincode.trim(), weightGrams,
  }), [form, weightGrams]);

  const getOrCreateIdempotencyKey = () => {
    const existing = requestKeyByFingerprintRef.current.get(bookingFingerprint);
    if (existing) return existing;
    const generated = `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    requestKeyByFingerprintRef.current.set(bookingFingerprint, generated);
    return generated;
  };

  const submit = async (e) => {
    e.preventDefault();
    const reqs = ['consignee', 'phone', 'deliveryAddress', 'deliveryCity', 'pincode', 'weightKg'];
    let valid = true;
    const newErrs = { ...errors };
    reqs.forEach(k => { if (!form[k]) { newErrs[k] = 'Required'; valid = false; } });
    if (form.paymentMode === 'COD' && !form.codAmount) { newErrs.codAmount = 'Required'; valid = false; }
    setErrors(newErrs);
    if (!valid) return toast?.('Please fix form errors', 'error');

    setSubmitting(true);
    try {
      const payload = {
        courier: form.courier === 'AUTO' ? undefined : form.courier,
        dryRun: form.dryRun, orderRef: form.orderRef || undefined, consignee: form.consignee,
        deliveryAddress: form.deliveryAddress, deliveryCity: form.deliveryCity, deliveryState: form.deliveryState || undefined,
        pincode: form.pincode, phone: form.phone || undefined, service: form.service,
        paymentMode: form.paymentMode, cod: form.paymentMode === 'COD',
        codAmount: form.paymentMode === 'COD' ? Number(form.codAmount) : undefined,
        contents: form.contents, declaredValue: Number(form.declaredValue || 0),
        weight: Number(form.weightKg || 0), weightGrams,
      };

      const idempotencyKey = getOrCreateIdempotencyKey();
      const res = await api.post('/portal/shipments/create-and-book', { ...payload, idempotencyKey }, { headers: { 'x-idempotency-key': idempotencyKey } });
      
      setResult(res?.data?.data || res?.data || null);
      toast?.('Booking completed', 'success');
      if (window.innerWidth < 1024) window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } catch (err) {
      toast?.(err.message || 'Booking failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // System Status Calculation
  const isAddressValid = Boolean(form.consignee && form.phone && form.pincode.length === 6 && form.deliveryAddress);
  const isPackageValid = Boolean(form.weightKg && Number(form.weightKg) > 0);
  const isRouteValid = Boolean(form.courier);
  const isReady = isAddressValid && isPackageValid && isRouteValid;

  return (
    <div className="min-h-full dark:bg-slate-950 pb-12">
      <div className="mx-auto client-premium-main max-w-[1280px] space-y-6">
        
        {/* Unified Top Header - MINIMAL */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 pb-4 border-b border-slate-100 dark:border-slate-800/60">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Shipment Creation</h1>
          
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg w-full md:w-auto">
            <button onClick={() => setMode('single')} className={`flex-1 flex items-center justify-center gap-2 px-5 py-2 rounded-md text-xs font-bold transition-all ${mode === 'single' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700' : 'text-slate-500 hover:text-slate-700'}`}>
              <Package size={14} /> Single
            </button>
            <button onClick={() => setMode('bulk')} className={`flex-1 flex items-center justify-center gap-2 px-5 py-2 rounded-md text-xs font-bold transition-all ${mode === 'bulk' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200/50 dark:ring-slate-700' : 'text-slate-500 hover:text-slate-700'}`}>
              <FileSpreadsheet size={14} /> Bulk Grid
            </button>
          </div>
        </div>

        {mode === 'single' ? (
          // Reduced width on right panel to keep focus on form
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px] items-start">
            
            {/* LEFT: FORM (DOMINANT) */}
            <form onSubmit={submit} className="space-y-6">
              
              <section className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-sky-500 rounded-l-[20px]"></div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 flex items-center justify-center">
                      <Users size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Receiver Details</h3>
                    </div>
                  </div>
                  
                  {/* Smart Autofill Dropdown - Cleaned up */}
                  <div className="relative w-full sm:w-64 z-50">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold outline-none focus:border-sky-500 transition-all placeholder:text-slate-400" 
                      placeholder="Autofill (Phone/Name)..." 
                      value={searchCustomer}
                      onChange={(e) => { setSearchCustomer(e.target.value); setShowSuggestions(true); }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    />
                    {showSuggestions && filteredCustomers.length > 0 && (
                      <div className="absolute top-full mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
                        {filteredCustomers.map((c, i) => (
                          <div key={i} onClick={() => selectCustomer(c)} className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 last:border-0 transition-colors">
                            <div className="text-sm font-bold text-slate-900 dark:text-white">{c.name}</div>
                            <div className="text-[10px] font-semibold text-slate-500">{c.phone} • {c.city}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                  <FormGroup label="Consignee Name" required error={errors.consignee}>
                    <input className={`input bg-slate-50 dark:bg-slate-800 ${errors.consignee ? 'border-red-300 focus:border-red-500 ring-4 ring-red-500/10' : ''}`} placeholder="e.g. Rahul Sharma" value={form.consignee} onChange={(e) => update('consignee', e.target.value)} required tabIndex={1} />
                  </FormGroup>
                  <FormGroup label="Phone Number" required error={errors.phone}>
                    <input className={`input bg-slate-50 dark:bg-slate-800 font-mono ${errors.phone ? 'border-red-300 focus:border-red-500 ring-4 ring-red-500/10' : ''}`} type="tel" placeholder="10 Digits" value={form.phone} onChange={(e) => update('phone', e.target.value)} required tabIndex={2} />
                  </FormGroup>
                  
                  <div className="sm:col-span-2">
                    <FormGroup label="Delivery Address" required error={errors.deliveryAddress}>
                      <textarea className={`input bg-slate-50 dark:bg-slate-800 min-h-[60px] resize-none py-2.5 ${errors.deliveryAddress ? 'border-red-300 focus:border-red-500 ring-4 ring-red-500/10' : ''}`} placeholder="House/Flat No., Building, Area" value={form.deliveryAddress} onChange={(e) => update('deliveryAddress', e.target.value)} required tabIndex={3} />
                    </FormGroup>
                  </div>
                  
                  <FormGroup label="Pincode" required tooltip="Auto-detects City & State" error={errors.pincode}>
                    <input className={`input bg-slate-50 dark:bg-slate-800 font-mono ${errors.pincode ? 'border-red-300 focus:border-red-500 ring-4 ring-red-500/10' : ''}`} placeholder="000000" value={form.pincode} onChange={(e) => update('pincode', e.target.value)} maxLength={6} required tabIndex={4} />
                  </FormGroup>
                  <div className="grid grid-cols-2 gap-3">
                    <FormGroup label="City" required error={errors.deliveryCity}>
                      <input className={`input bg-slate-50 dark:bg-slate-800 ${errors.deliveryCity ? 'border-red-300 focus:border-red-500 ring-4 ring-red-500/10' : ''}`} placeholder="City" value={form.deliveryCity} onChange={(e) => update('deliveryCity', e.target.value)} required tabIndex={5} />
                    </FormGroup>
                    <FormGroup label="State">
                      <input className="input bg-slate-50 dark:bg-slate-800" placeholder="State" value={form.deliveryState} onChange={(e) => update('deliveryState', e.target.value)} tabIndex={6} />
                    </FormGroup>
                  </div>
                </div>
              </section>

              <section className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l-[20px]"></div>
                
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                    <Box size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Shipment Properties</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-6">
                  <FormGroup label="Weight" required error={errors.weightKg}>
                    <div className="relative flex items-center">
                      <input className={`input bg-slate-50 dark:bg-slate-800 pr-8 font-mono ${errors.weightKg ? 'border-red-300 ring-4 ring-red-500/10' : ''}`} type="number" step="0.01" min="0.01" placeholder="0.5" value={form.weightKg} onChange={(e) => update('weightKg', e.target.value)} required tabIndex={7} />
                      <span className="absolute right-3 text-[10px] font-bold text-slate-400">KG</span>
                    </div>
                  </FormGroup>
                  
                  <div className="lg:col-span-2">
                    <FormGroup label="Dimensions" hint="L × W × H">
                      <div className="flex items-center gap-1.5">
                        <div className="relative flex-1"><input className="input bg-slate-50 text-center px-1 font-mono pr-5" type="number" placeholder="10" value={form.length} onChange={(e) => update('length', e.target.value)} tabIndex={8} /><span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">CM</span></div>
                        <span className="text-slate-300 font-black">×</span>
                        <div className="relative flex-1"><input className="input bg-slate-50 text-center px-1 font-mono pr-5" type="number" placeholder="10" value={form.width} onChange={(e) => update('width', e.target.value)} tabIndex={9} /><span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">CM</span></div>
                        <span className="text-slate-300 font-black">×</span>
                        <div className="relative flex-1"><input className="input bg-slate-50 text-center px-1 font-mono pr-5" type="number" placeholder="10" value={form.height} onChange={(e) => update('height', e.target.value)} tabIndex={10} /><span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">CM</span></div>
                      </div>
                    </FormGroup>
                  </div>

                  <FormGroup label="Type">
                    <select className="input bg-slate-50 dark:bg-slate-800 cursor-pointer" value={form.packageType} onChange={(e) => update('packageType', e.target.value)} tabIndex={11}>
                      <option value="Box">Box</option>
                      <option value="Flyer">Flyer</option>
                    </select>
                  </FormGroup>
                </div>
              </section>

              <section className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-l-[20px]"></div>
                
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <Zap size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Fulfillment</h3>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-6">
                  <FormGroup label="Service Mode" required>
                    <select className="input bg-slate-50 dark:bg-slate-800 font-bold cursor-pointer" value={form.service} onChange={(e) => update('service', e.target.value)} tabIndex={12}>
                      <option value="Standard">Standard (Surface)</option>
                      <option value="Express">Express (Air)</option>
                    </select>
                  </FormGroup>
                  
                  <FormGroup label="Payment Mode" required>
                    <select className="input bg-slate-50 dark:bg-slate-800 font-bold cursor-pointer" value={form.paymentMode} onChange={(e) => update('paymentMode', e.target.value)} tabIndex={13}>
                      <option value="Prepaid">Prepaid (Wallet)</option>
                      <option value="COD">Cash on Delivery</option>
                    </select>
                  </FormGroup>

                  {form.paymentMode === 'COD' ? (
                    <FormGroup label="Collect Amount" required error={errors.codAmount}>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                        <input className={`input bg-slate-50 dark:bg-slate-800 pl-8 font-mono font-bold ${errors.codAmount ? 'border-red-300 ring-4 ring-red-500/10' : ''}`} type="number" min="1" placeholder="e.g. 1500" value={form.codAmount} onChange={(e) => update('codAmount', e.target.value)} required tabIndex={14} />
                      </div>
                    </FormGroup>
                  ) : (
                    <div className="hidden sm:block" /> 
                  )}
                </div>
              </section>

              <section className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200 dark:border-slate-800 shadow-sm relative transition-all">
                <button type="button" onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-between p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors outline-none focus:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 flex items-center justify-center">
                      <Settings2 size={20} strokeWidth={2.5} />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Advanced Options</h3>
                  </div>
                  {showAdvanced ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                </button>
                
                {showAdvanced && (
                  <div className="p-8 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6 border-t border-slate-100 dark:border-slate-800 mt-2">
                    <FormGroup label="Order Reference">
                      <input className="input bg-slate-50 dark:bg-slate-800" placeholder="e.g. ORD-1234" value={form.orderRef} onChange={(e) => update('orderRef', e.target.value)} tabIndex={15} />
                    </FormGroup>
                    <FormGroup label="Declared Value (₹)" tooltip="For insurance">
                      <input className="input bg-slate-50 dark:bg-slate-800" type="number" min="0" placeholder="e.g. 2000" value={form.declaredValue} onChange={(e) => update('declaredValue', e.target.value)} tabIndex={16} />
                    </FormGroup>
                  </div>
                )}
              </section>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-between pt-2 pb-8">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button type="button" onClick={() => toast?.('Draft saved', 'success')} className="btn-secondary w-full sm:w-auto flex items-center justify-center gap-2" tabIndex={17}>
                    <Save size={16} /> Save Draft
                  </button>
                  <label className="flex items-center gap-2 cursor-pointer px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors select-none group">
                    <input type="checkbox" className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500" checked={form.dryRun} onChange={(e) => update('dryRun', e.target.checked)} tabIndex={18} />
                    <span className="text-[13px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 group-hover:text-sky-600 transition-colors">Test Booking (Dry Run)</span>
                  </label>
                </div>
                
                <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
                  <button id="submit-booking-btn" type="submit" disabled={submitting} className="w-full sm:w-auto rounded-xl bg-slate-900 dark:bg-white px-10 py-4 text-[13px] font-black uppercase tracking-widest text-white dark:text-slate-900 transition hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-70 shadow-xl shadow-slate-900/20 flex items-center justify-center gap-2 active:scale-95" tabIndex={19}>
                    {submitting ? 'Processing...' : 'Create Shipment'}
                    {!submitting && <ArrowRight size={16} />}
                  </button>
                  <span className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Press Ctrl+Enter</span>
                </div>
              </div>
            </form>

            {/* RIGHT: SYSTEM STATUS & ROUTING (REDUCED PADDING/WIDTH) */}
            <aside className="sticky top-24 self-start space-y-4 hidden lg:block">
              
              {/* Intelligent System Status */}
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 dark:bg-slate-800/50 p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-slate-200 dark:bg-slate-700"></div>
                <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-4 text-center">
                  System Status
                </h3>
                
                {!result ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      {isAddressValid ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Circle size={14} className="text-slate-300" />}
                      <span className={isAddressValid ? 'text-slate-900 dark:text-white' : 'text-slate-400'}>Address Validated</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold">
                      {isPackageValid ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Circle size={14} className="text-slate-300" />}
                      <span className={isPackageValid ? 'text-slate-900 dark:text-white' : 'text-slate-400'}>Package Profiled</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold">
                      {isRouteValid ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Circle size={14} className="text-slate-300" />}
                      <span className={isRouteValid ? 'text-slate-900 dark:text-white' : 'text-slate-400'}>Route Optimized</span>
                    </div>
                    <div className={`mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/50 flex items-center justify-between text-[10px] font-black uppercase tracking-widest ${isReady ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                      <span>Ready to Dispatch</span>
                      {isReady && <span className="bg-emerald-100 dark:bg-emerald-900/50 px-1.5 py-0.5 rounded">OK</span>}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in zoom-in-95">
                    <div className="p-3 bg-emerald-100/50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-center rounded-lg">
                      <span className="text-xs font-black uppercase tracking-widest">Dispatched</span>
                    </div>
                    {(result?.shipment?.awb || result?.booking?.awb) && (
                      <div className="text-center">
                        <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Generated AWB</div>
                        <div className="text-xl font-mono font-black text-slate-900 dark:text-white tracking-tight">
                          {result?.shipment?.awb || result?.booking?.awb}
                        </div>
                      </div>
                    )}
                    <div className="space-y-2 pt-2">
                      {result?.booking?.labelUrl && (
                        <a href={result.booking.labelUrl} target="_blank" rel="noreferrer" className="flex justify-center w-full rounded-xl bg-slate-900 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
                          Print Label
                        </a>
                      )}
                      <button onClick={() => {setResult(null); setForm(initialForm);}} className="flex justify-center w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700">
                        New Order
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Collapsible Routing Engine */}
              <div className="rounded-[20px] border border-slate-200 bg-white dark:bg-slate-900 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <ShieldCheck size={14} className="text-sky-500" strokeWidth={3} />
                  <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Routing Engine</h3>
                </div>
                
                <div className="space-y-2">
                  {/* Always show the selected courier */}
                  {COURIERS.filter(c => c.id === form.courier).map((c) => (
                    <div key={c.id} className="p-3 rounded-[12px] border border-sky-500 bg-sky-50 dark:bg-sky-500/10 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-xs text-sky-900 dark:text-sky-100 flex items-center gap-1.5">
                          {c.name}
                          {c.tag && <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1 py-0.5 rounded-sm uppercase tracking-widest">{c.tag}</span>}
                        </span>
                        <CheckCircle2 size={12} className="text-sky-500" />
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-sky-700 dark:text-sky-400 uppercase tracking-wide">
                        <span className="flex items-center gap-1"><Truck size={10}/> {c.speed}</span>
                        <span>{c.reliability}</span>
                      </div>
                    </div>
                  ))}

                  {!showCouriers ? (
                    <button type="button" onClick={() => setShowCouriers(true)} className="w-full text-center text-[10px] font-bold text-slate-400 hover:text-slate-600 mt-2 py-1 flex items-center justify-center gap-1">
                      Show alternatives <ChevronDown size={10} />
                    </button>
                  ) : (
                    <div className="pt-2 space-y-2 border-t border-slate-100 mt-2">
                      {COURIERS.filter(c => c.id !== form.courier).map((c) => (
                        <div key={c.id} onClick={() => { update('courier', c.id); setShowCouriers(false); }} className="p-3 rounded-[12px] border border-slate-100 hover:border-slate-300 bg-white cursor-pointer">
                          <div className="font-bold text-xs text-slate-700 mb-1">{c.name}</div>
                          <div className="flex gap-3 text-[10px] font-semibold text-slate-500">
                            <span>{c.speed}</span>
                            <span>{c.reliability}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </aside>
          </div>
        ) : (
          /* BULK GRID MODE */
          <div className="bg-white dark:bg-slate-900 rounded-[20px] border border-slate-200 dark:border-slate-800 p-8 min-h-[500px] shadow-sm flex flex-col">
            <h2 className="text-xl font-black text-slate-900 tracking-tight mb-2">Bulk Upload Interface</h2>
            <div className="flex-1 border-2 border-dashed border-slate-200 rounded-[16px] flex flex-col items-center justify-center text-center p-10 bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer group mt-6">
              <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <FileSpreadsheet size={28} className="text-sky-500" />
              </div>
              <h3 className="text-sm font-black text-slate-800 mb-1">Drag and drop spreadsheet</h3>
              <p className="text-xs text-slate-500 max-w-sm mb-6">.csv, .xlsx, .xls</p>
              <button className="px-6 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:bg-slate-800">
                Browse Files
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
