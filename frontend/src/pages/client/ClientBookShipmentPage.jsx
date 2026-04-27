import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const COURIERS = ['AUTO', 'Trackon', 'DTDC', 'Delhivery'];

const initialForm = {
  courier: 'AUTO',
  dryRun: true,
  orderRef: '',
  consignee: '',
  deliveryAddress: '',
  deliveryCity: '',
  deliveryState: '',
  pincode: '',
  phone: '',
  weightKg: '0.5',
  declaredValue: '0',
  service: 'Standard',
  paymentMode: 'Prepaid',
  contents: 'Shipment',
};

export default function ClientBookShipmentPage({ toast }) {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const requestKeyByFingerprintRef = useRef(new Map());

  const weightGrams = useMemo(() => {
    const n = Number(form.weightKg || 0);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.round(n * 1000);
  }, [form.weightKg]);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const bookingFingerprint = useMemo(() => JSON.stringify({
    courier: form.courier,
    consignee: form.consignee.trim().toUpperCase(),
    deliveryAddress: form.deliveryAddress.trim().toUpperCase(),
    deliveryCity: form.deliveryCity.trim().toUpperCase(),
    deliveryState: form.deliveryState.trim().toUpperCase(),
    pincode: form.pincode.trim(),
    service: form.service,
    paymentMode: form.paymentMode,
    contents: form.contents.trim(),
    weightGrams,
    declaredValue: Number(form.declaredValue || 0),
    orderRef: form.orderRef.trim(),
  }), [form, weightGrams]);

  const getOrCreateIdempotencyKey = () => {
    const existing = requestKeyByFingerprintRef.current.get(bookingFingerprint);
    if (existing) return existing;

    const orderRef = form.orderRef.trim();
    const generated = orderRef
      ? `order-${orderRef.toUpperCase()}`
      : `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    requestKeyByFingerprintRef.current.set(bookingFingerprint, generated);
    return generated;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.consignee || !form.deliveryAddress || !form.deliveryCity || !form.pincode || !weightGrams) {
      toast?.('Please fill all required booking fields', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        courier: form.courier === 'AUTO' ? undefined : form.courier,
        dryRun: form.dryRun,
        orderRef: form.orderRef || undefined,
        consignee: form.consignee,
        deliveryAddress: form.deliveryAddress,
        deliveryCity: form.deliveryCity,
        deliveryState: form.deliveryState || undefined,
        pincode: form.pincode,
        phone: form.phone || undefined,
        service: form.service,
        paymentMode: form.paymentMode,
        cod: form.paymentMode === 'COD',
        contents: form.contents,
        declaredValue: Number(form.declaredValue || 0),
        weight: Number(form.weightKg || 0),
        weightGrams,
      };

      const idempotencyKey = getOrCreateIdempotencyKey();
      const res = await api.post('/portal/shipments/create-and-book', {
        ...payload,
        idempotencyKey,
      }, {
        headers: {
          'x-idempotency-key': idempotencyKey,
        },
      });
      const data = res?.data || res;
      setResult(data?.data || data || null);
      toast?.(data?.message || 'Booking request completed', 'success');
    } catch (err) {
      toast?.(err.message || 'Booking failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7faff_0%,#eef4fd_100%)] dark:bg-slate-950">
      <header className="client-premium-header px-6 py-4 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/portal" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:text-white">← Portal</Link>
            <div>
              <div className="text-sm font-black text-slate-900 dark:text-slate-100">Create & Book Shipment</div>
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-orange-500 dark:text-orange-300">Self-Serve Booking Flow</div>
            </div>
          </div>
          <Link to="/portal/pickups" className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.08em] text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-200">
            Pickup Queue
          </Link>
        </div>
      </header>

      <div className="mx-auto client-premium-main grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.38)] dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-5">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-orange-500 dark:text-orange-300">Booking Form</div>
            <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">Create order and book instantly</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-100">Use dry-run first to test the booking without creating a live AWB.</p>
          </div>

          <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
            <select className="input" value={form.courier} onChange={(e) => update('courier', e.target.value)}>
              {COURIERS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input className="input" placeholder="Order ref (optional)" value={form.orderRef} onChange={(e) => update('orderRef', e.target.value)} />
            <input className="input md:col-span-2" placeholder="Consignee name*" value={form.consignee} onChange={(e) => update('consignee', e.target.value)} required />
            <textarea className="input md:col-span-2 min-h-[96px]" placeholder="Delivery address*" value={form.deliveryAddress} onChange={(e) => update('deliveryAddress', e.target.value)} required />
            <input className="input" placeholder="Delivery city*" value={form.deliveryCity} onChange={(e) => update('deliveryCity', e.target.value)} required />
            <input className="input" placeholder="Delivery state" value={form.deliveryState} onChange={(e) => update('deliveryState', e.target.value)} />
            <input className="input" placeholder="Pincode*" value={form.pincode} onChange={(e) => update('pincode', e.target.value)} required />
            <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            <input className="input" type="number" step="0.1" min="0.1" placeholder="Weight (kg)*" value={form.weightKg} onChange={(e) => update('weightKg', e.target.value)} required />
            <input className="input" type="number" min="0" placeholder="Declared value" value={form.declaredValue} onChange={(e) => update('declaredValue', e.target.value)} />
            <select className="input" value={form.service} onChange={(e) => update('service', e.target.value)}>
              <option value="Standard">Standard</option>
              <option value="Express">Express</option>
            </select>
            <select className="input" value={form.paymentMode} onChange={(e) => update('paymentMode', e.target.value)}>
              <option value="Prepaid">Prepaid</option>
              <option value="COD">COD</option>
            </select>
            <input className="input" placeholder="Contents" value={form.contents} onChange={(e) => update('contents', e.target.value)} />

            <label className="md:col-span-2 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
              <input type="checkbox" checked={form.dryRun} onChange={(e) => update('dryRun', e.target.checked)} />
              Run as dry-run (safe mode, no live AWB created)
            </label>

            <button type="submit" disabled={submitting} className="md:col-span-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-sky-600 dark:hover:bg-sky-500">
              {submitting ? 'Processing…' : form.dryRun ? 'Validate Booking (Dry Run)' : 'Create & Book Live Shipment'}
            </button>
          </form>
        </section>

        <aside className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.38)] dark:border-slate-700 dark:bg-slate-900">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-orange-500 dark:text-orange-300">Result</div>
          <h3 className="mt-1 text-lg font-black text-slate-900 dark:text-white">Booking output</h3>
          {!result ? (
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-100">Run a booking request to see AWB, tracking link, and label details here.</p>
          ) : (
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-100">Mode</div>
                <div className="mt-1 font-black text-slate-900 dark:text-white">{result?.booking?.dryRun ? 'Dry Run' : 'Live Booking'}</div>
              </div>
              {result?.decision && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-900/40 dark:bg-indigo-950/30">
                  <div className="text-[10px] font-black uppercase tracking-[0.12em] text-indigo-700 dark:text-indigo-300">Decision Engine</div>
                  <div className="mt-1 font-semibold text-indigo-900 dark:text-indigo-100">
                    Recommended: {result.decision.recommendedCourier} · Fallback: {result.decision.fallbackCourier}
                  </div>
                </div>
              )}
              {(result?.shipment?.awb || result?.booking?.awb) && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/30">
                  <div className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300">AWB</div>
                  <div className="mt-1 font-mono font-black text-emerald-900 dark:text-emerald-200">{result?.shipment?.awb || result?.booking?.awb}</div>
                </div>
              )}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
                <div className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-100">Message</div>
                <div className="mt-1 font-semibold text-slate-800 dark:text-white">
                  {result?.booking?.message || 'Completed'}
                </div>
              </div>
              {(result?.booking?.trackUrl || result?.booking?.labelUrl) && (
                <div className="grid gap-2">
                  {result?.booking?.trackUrl && <a href={result.booking.trackUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-200">Open Tracking URL</a>}
                  {result?.booking?.labelUrl && <a href={result.booking.labelUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 dark:border-violet-900/40 dark:bg-violet-950/30 dark:text-violet-200">Open Label URL</a>}
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

