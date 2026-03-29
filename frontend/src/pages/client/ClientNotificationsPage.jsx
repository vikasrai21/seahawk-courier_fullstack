import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 p-4 bg-slate-50 cursor-pointer transition hover:bg-slate-100">
      <div>
        <div className="font-black text-slate-900">{label}</div>
        <div className="mt-1 text-sm text-slate-500">{hint}</div>
      </div>
      <input type="checkbox" checked={checked} onChange={onChange} />
    </label>
  );
}

export default function ClientNotificationsPage({ toast }) {
  const [prefs, setPrefs] = useState({
    whatsapp: { outForDelivery: true, delivered: true },
    email: { ndr: true, rto: true, pod: true },
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await api.get('/portal/notification-preferences');
      setPrefs(res.data?.preferences || prefs);
    } catch (err) {
      toast?.(err.message || 'Failed to load notification preferences', 'error');
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setValue = (group, key, value) => {
    setPrefs((prev) => ({ ...prev, [group]: { ...prev[group], [key]: value } }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.post('/portal/notification-preferences', prefs);
      toast?.('Notification preferences saved', 'success');
    } catch (err) {
      toast?.(err.message || 'Failed to save notification preferences', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7faff_0%,#eef4fd_100%)]">
      <header className="border-b border-slate-200/70 bg-white/90 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/portal" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:text-slate-700">← Portal</Link>
            <div>
              <div className="text-sm font-black text-slate-900">Notification Preferences</div>
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-orange-500">Alert Controls</div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl p-6 space-y-6">
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_320px]">
          <div className="overflow-hidden rounded-[28px] border border-slate-200/60 bg-[linear-gradient(145deg,#fffaf5_0%,#ffffff_70%)] p-6 shadow-[0_22px_44px_-30px_rgba(194,65,12,0.35)]">
            <div className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-orange-600">
              Signal Control
            </div>
            <h1 className="mt-4 max-w-2xl text-3xl font-black leading-tight text-slate-900">Alerts now live in a calmer settings page instead of a plain checklist.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
              Reduce noise and keep only the shipping events that matter to your team across WhatsApp and email.
            </p>
          </div>
          <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.38)]">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-orange-500">Channels</div>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-black text-slate-900">WhatsApp</div>
                <div className="mt-1 text-sm text-slate-500">Fast operational updates for movement and delivery.</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-black text-slate-900">Email</div>
                <div className="mt-1 text-sm text-slate-500">Exception, return, and proof-focused communication.</div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.38)] space-y-3">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-orange-500">WhatsApp</div>
            <div className="text-lg font-black text-slate-900">Delivery movement alerts</div>
            <Toggle checked={prefs.whatsapp.outForDelivery} onChange={(e) => setValue('whatsapp', 'outForDelivery', e.target.checked)} label="Out for Delivery" hint="Get a WhatsApp alert when a shipment is on the last-mile run." />
            <Toggle checked={prefs.whatsapp.delivered} onChange={(e) => setValue('whatsapp', 'delivered', e.target.checked)} label="Delivered" hint="Get a WhatsApp confirmation as soon as a package is delivered." />
          </div>

          <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.38)] space-y-3">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-orange-500">Email</div>
            <div className="text-lg font-black text-slate-900">Exception and proof alerts</div>
            <Toggle checked={prefs.email.ndr} onChange={(e) => setValue('email', 'ndr', e.target.checked)} label="NDR Alerts" hint="Receive email alerts for delivery failures that need a re-attempt or correction." />
            <Toggle checked={prefs.email.rto} onChange={(e) => setValue('email', 'rto', e.target.checked)} label="RTO Alerts" hint="Receive email alerts when a shipment moves into return-to-origin." />
            <Toggle checked={prefs.email.pod} onChange={(e) => setValue('email', 'pod', e.target.checked)} label="Delivery Proof / POD" hint="Receive delivery confirmation emails with proof links when available." />
          </div>
        </div>

        <div className="flex justify-end">
          <button className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}
