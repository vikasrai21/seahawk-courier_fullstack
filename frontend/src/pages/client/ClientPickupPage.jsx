import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import ClientPortalPageIntro from '../../components/client/ClientPortalPageIntro';

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

function StatusPill({ status }) {
  const tones = {
    COMPLETED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    CANCELLED: 'border-rose-200 bg-rose-50 text-rose-700',
    ASSIGNED: 'border-sky-200 bg-sky-50 text-sky-700',
  };
  return <span className={`rounded-full border px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em] ${tones[status] || 'border-amber-200 bg-amber-50 text-amber-700'}`}>{status}</span>;
}

export default function ClientPickupPage({ toast }) {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    pickupAddress: '',
    pickupCity: '',
    pickupPin: '',
    deliveryAddress: '',
    deliveryCity: '',
    deliveryState: '',
    packageType: 'Parcel',
    weightGrams: 500,
    pieces: 1,
    service: 'Standard',
    preferredCarrier: '',
    scheduledDate: tomorrow(),
    timeSlot: 'Morning',
    notes: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/portal/pickups');
      setPickups(res.data?.pickups || []);
    } catch (e) {
      toast?.(e.message || 'Failed to load pickups', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    if (!form.contactName || !form.contactPhone || !form.pickupAddress || !form.pickupCity || !form.pickupPin) {
      toast?.('Fill in the required pickup fields', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/portal/pickups', form);
      toast?.(res.message || 'Pickup request created', 'success');
      setForm((prev) => ({
        ...prev,
        notes: '',
        deliveryAddress: '',
        deliveryCity: '',
        deliveryState: '',
        preferredCarrier: '',
      }));
      await load();
    } catch (e) {
      toast?.(e.message || 'Failed to create pickup request', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7faff_0%,#eef4fd_100%)]">
      <header className="client-premium-header px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/portal" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:text-slate-700">← Portal</Link>
            <div>
              <div className="text-sm font-black text-slate-900">Pickup Requests</div>
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-orange-500">Dispatch Coordination</div>
            </div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.08em] text-emerald-700">
            {pickups.length} requests tracked
          </div>
        </div>
      </header>

      <div className="mx-auto client-premium-main">
        <ClientPortalPageIntro
          eyebrow="Pickup Coordination"
          title="Schedule pickups with a clearer handoff between your team and Sea Hawk operations."
          description="Set the slot, package profile, and destination context in one pass, then keep the recent request timeline visible beside the form."
          badges={[`${pickups.length} requests tracked`, form.timeSlot, form.packageType]}
        />
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.18fr)_320px]">
          <div className="overflow-hidden rounded-[28px] border border-slate-200/60 bg-[linear-gradient(145deg,#0f2748_0%,#123563_55%,#174576_100%)] p-6 text-white shadow-[0_22px_50px_-30px_rgba(15,39,72,0.9)]">
            <div className="inline-flex rounded-full border border-sky-200/20 bg-sky-300/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-sky-100">
              Pickup Command
            </div>
            <h1 className="mt-4 max-w-2xl text-3xl font-black leading-tight">Schedule pickups with a clearer handoff between your team and ops.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
              Choose the slot, package details, and service level in one pass. The request goes straight into the ops workflow.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                <div className="text-xs font-semibold text-slate-300">Scheduled</div>
                <div className="mt-2 text-3xl font-black">{pickups.length}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                <div className="text-xs font-semibold text-slate-300">Preferred Slot</div>
                <div className="mt-2 text-3xl font-black">{form.timeSlot}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                <div className="text-xs font-semibold text-slate-300">Package Type</div>
                <div className="mt-2 text-3xl font-black">{form.packageType}</div>
              </div>
            </div>
          </div>

          <div className="rounded-[26px] border border-orange-200 bg-[linear-gradient(180deg,#fff8f2_0%,#ffffff_100%)] p-5 shadow-[0_18px_40px_-28px_rgba(194,65,12,0.45)]">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-orange-500">Checklist</div>
            <div className="mt-2 text-2xl font-black text-slate-900">Before you submit</div>
            <div className="mt-4 grid gap-3 text-sm text-slate-600">
              <div className="rounded-2xl border border-orange-100 bg-white px-4 py-3">Share a reachable phone number for pickup coordination.</div>
              <div className="rounded-2xl border border-orange-100 bg-white px-4 py-3">Keep pickup PIN and address exact to reduce assignment delays.</div>
              <div className="rounded-2xl border border-orange-100 bg-white px-4 py-3">Add notes if the parcel is fragile, bulk, or timing-sensitive.</div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,.9fr)]">
          <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.38)]">
            <div className="mb-5">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-orange-500">Request Form</div>
              <h2 className="mt-1 text-xl font-black text-slate-900">Book a pickup</h2>
              <p className="mt-1 text-sm text-slate-500">Cleaned up into grouped fields so the form feels less like a wall of inputs.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input className="input" placeholder="Contact name" value={form.contactName} onChange={(e) => setForm((prev) => ({ ...prev, contactName: e.target.value }))} />
              <input className="input" placeholder="Phone number" value={form.contactPhone} onChange={(e) => setForm((prev) => ({ ...prev, contactPhone: e.target.value }))} />
              <input className="input md:col-span-2" placeholder="Email (optional)" value={form.contactEmail} onChange={(e) => setForm((prev) => ({ ...prev, contactEmail: e.target.value }))} />
              <textarea className="input md:col-span-2 min-h-[100px]" placeholder="Pickup address" value={form.pickupAddress} onChange={(e) => setForm((prev) => ({ ...prev, pickupAddress: e.target.value }))} />
              <input className="input" placeholder="Pickup city" value={form.pickupCity} onChange={(e) => setForm((prev) => ({ ...prev, pickupCity: e.target.value }))} />
              <input className="input" placeholder="PIN code" value={form.pickupPin} onChange={(e) => setForm((prev) => ({ ...prev, pickupPin: e.target.value }))} />
              <textarea className="input md:col-span-2 min-h-[80px]" placeholder="Delivery address (optional)" value={form.deliveryAddress} onChange={(e) => setForm((prev) => ({ ...prev, deliveryAddress: e.target.value }))} />
              <input className="input" placeholder="Delivery city" value={form.deliveryCity} onChange={(e) => setForm((prev) => ({ ...prev, deliveryCity: e.target.value }))} />
              <input className="input" placeholder="Delivery state" value={form.deliveryState} onChange={(e) => setForm((prev) => ({ ...prev, deliveryState: e.target.value }))} />
              <select className="input" value={form.packageType} onChange={(e) => setForm((prev) => ({ ...prev, packageType: e.target.value }))}>
                <option value="Parcel">Parcel</option>
                <option value="Document">Document</option>
                <option value="Fragile">Fragile</option>
                <option value="Cargo">Cargo</option>
              </select>
              <input className="input" type="number" placeholder="Weight (grams)" value={form.weightGrams} onChange={(e) => setForm((prev) => ({ ...prev, weightGrams: Number(e.target.value) }))} />
              <input className="input" type="number" placeholder="Pieces" value={form.pieces} onChange={(e) => setForm((prev) => ({ ...prev, pieces: Number(e.target.value) }))} />
              <select className="input" value={form.timeSlot} onChange={(e) => setForm((prev) => ({ ...prev, timeSlot: e.target.value }))}>
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
              </select>
              <input className="input" type="date" value={form.scheduledDate} onChange={(e) => setForm((prev) => ({ ...prev, scheduledDate: e.target.value }))} />
              <input className="input" placeholder="Preferred carrier (optional)" value={form.preferredCarrier} onChange={(e) => setForm((prev) => ({ ...prev, preferredCarrier: e.target.value }))} />
              <select className="input" value={form.service} onChange={(e) => setForm((prev) => ({ ...prev, service: e.target.value }))}>
                <option value="Standard">Standard</option>
                <option value="Express">Express</option>
              </select>
              <textarea className="input md:col-span-2 min-h-[90px]" placeholder="Special notes" value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
            </div>
            <button onClick={submit} disabled={saving} className="mt-5 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70">
              {saving ? 'Submitting…' : 'Create Pickup Request'}
            </button>
          </div>

          <div className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_18px_42px_-32px_rgba(15,23,42,0.38)]">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-orange-500">Recent Requests</div>
              <h2 className="mt-1 text-lg font-black text-slate-900">Pickup timeline</h2>
              <p className="mt-1 text-sm text-slate-500">Recent requests are easier to scan now, with stronger request numbers and status pills.</p>
            </div>
            {loading ? (
              <div className="p-5 text-slate-500">Loading pickups…</div>
            ) : pickups.length === 0 ? (
              <div className="p-10 text-center text-slate-500">
                <div className="text-4xl">📦</div>
                <div className="mt-3 font-semibold">No pickup requests yet.</div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pickups.map((pickup) => (
                  <div key={pickup.id} className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="font-mono text-xs font-black text-sky-700">{pickup.requestNo}</div>
                        <div className="mt-2 text-base font-black text-slate-900">{pickup.pickupCity} · {pickup.timeSlot}</div>
                        <div className="mt-1 text-xs text-slate-500">{pickup.scheduledDate} · {pickup.packageType} · {pickup.pieces} pcs</div>
                        <div className="mt-3 text-sm text-slate-600">{pickup.pickupAddress}</div>
                      </div>
                      <StatusPill status={pickup.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

