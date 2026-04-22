import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import ClientPortalPageIntro from '../../components/client/ClientPortalPageIntro';

function Toggle({ checked, onChange, icon, label, hint, sample }) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 p-4 bg-slate-50 cursor-pointer transition hover:bg-slate-100">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white text-base shadow-sm">{icon}</span>
          <div className="font-black text-slate-900">{label}</div>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.08em] ${checked ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-100 text-slate-500'}`}>
            {checked ? 'On' : 'Off'}
          </span>
        </div>
        <div className="mt-1 text-sm text-slate-500">{hint}</div>
        <div className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">{sample}</div>
      </div>
      <input type="checkbox" checked={checked} onChange={onChange} className="mt-1 h-4 w-4" />
    </label>
  );
}

const DEFAULT_PREFS = {
  whatsapp: {
    booked: false,
    inTransit: false,
    outForDelivery: true,
    delivered: true,
    delay: true,
    exceptionDigest: true,
  },
  email: {
    booked: false,
    inTransit: false,
    outForDelivery: false,
    delivered: true,
    ndr: true,
    rto: true,
    pod: true,
    dispute: true,
    webhookFailure: true,
  },
  templates: {
    sms: {
      booked: '',
      inTransit: '',
      outForDelivery: '',
      delivered: '',
      ndr: '',
      delay: '',
    },
    email: {
      ndrSubject: '',
      ndrBody: '',
      deliveredSubject: '',
      deliveredBody: '',
      disputeSubject: '',
      disputeBody: '',
    },
    journeys: {
      postOrderEnabled: true,
      ndrRecoveryEnabled: true,
      postDeliveryEnabled: true,
    },
  },
  retention: {
    auditLogDays: 180,
    webhookEventDays: 90,
    notificationDays: 90,
  },
};

export default function ClientNotificationsPage({ toast }) {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await api.get('/portal/notification-preferences');
      setPrefs({
        whatsapp: { ...DEFAULT_PREFS.whatsapp, ...(res.data?.preferences?.whatsapp || {}) },
        email: { ...DEFAULT_PREFS.email, ...(res.data?.preferences?.email || {}) },
        templates: {
          sms: { ...DEFAULT_PREFS.templates.sms, ...(res.data?.preferences?.templates?.sms || {}) },
          email: { ...DEFAULT_PREFS.templates.email, ...(res.data?.preferences?.templates?.email || {}) },
          journeys: { ...DEFAULT_PREFS.templates.journeys, ...(res.data?.preferences?.templates?.journeys || {}) },
        },
        retention: { ...DEFAULT_PREFS.retention, ...(res.data?.preferences?.retention || {}) },
      });
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
  const setTemplateValue = (channel, key, value) => {
    setPrefs((prev) => ({
      ...prev,
      templates: {
        ...prev.templates,
        [channel]: {
          ...prev.templates[channel],
          [key]: value,
        },
      },
    }));
  };
  const setJourney = (key, value) => {
    setPrefs((prev) => ({
      ...prev,
      templates: {
        ...prev.templates,
        journeys: {
          ...prev.templates.journeys,
          [key]: value,
        },
      },
    }));
  };
  const setRetention = (key, value) => {
    setPrefs((prev) => ({
      ...prev,
      retention: {
        ...prev.retention,
        [key]: value,
      },
    }));
  };

  const setPreset = (preset) => {
    if (preset === 'recommended') {
      setPrefs({
        ...DEFAULT_PREFS,
        whatsapp: { booked: false, inTransit: false, outForDelivery: true, delivered: true, delay: true, exceptionDigest: true },
        email: { booked: false, inTransit: false, outForDelivery: false, delivered: true, ndr: true, rto: true, pod: true, dispute: true, webhookFailure: true },
      });
      return;
    }
    if (preset === 'all_off') {
      setPrefs({
        ...DEFAULT_PREFS,
        whatsapp: { booked: false, inTransit: false, outForDelivery: false, delivered: false, delay: false, exceptionDigest: false },
        email: { booked: false, inTransit: false, outForDelivery: false, delivered: false, ndr: false, rto: false, pod: false, dispute: false, webhookFailure: false },
      });
      return;
    }
    if (preset === 'movement_only') {
      setPrefs({
        ...DEFAULT_PREFS,
        whatsapp: { booked: true, inTransit: true, outForDelivery: true, delivered: true, delay: false, exceptionDigest: false },
        email: { booked: true, inTransit: true, outForDelivery: true, delivered: true, ndr: false, rto: false, pod: false, dispute: false, webhookFailure: false },
      });
    }
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
      <header className="client-premium-header px-6 py-4">
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
        <ClientPortalPageIntro
          eyebrow="Notification Controls"
          title="Choose which shipment moments deserve attention and keep alert fatigue under control."
          description="Tune WhatsApp, email, journeys, and template defaults in one place so your team gets the right operational signal at the right time."
          badges={['WhatsApp and email', prefs.whatsapp.delivered ? 'Delivery alerts on' : 'Delivery alerts off', prefs.email.ndr ? 'NDR emails on' : 'NDR emails off']}
        />
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.08fr)_320px]">
          <div className="overflow-hidden rounded-[28px] border border-slate-200/60 bg-[linear-gradient(145deg,#fffaf5_0%,#ffffff_70%)] p-6 shadow-[0_22px_44px_-30px_rgba(194,65,12,0.35)]">
            <div className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-orange-600">
              Alert Control
            </div>
            <h1 className="mt-4 max-w-2xl text-3xl font-black leading-tight text-slate-900">Choose exactly which shipment events should trigger your alerts.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
              Tune movement updates separately from exception alerts, so your team gets the right signal without notification fatigue.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-extrabold text-emerald-700" onClick={() => setPreset('recommended')}>Recommended Defaults</button>
              <button className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-extrabold text-blue-700" onClick={() => setPreset('movement_only')}>Movement Only</button>
              <button className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-extrabold text-slate-600" onClick={() => setPreset('all_off')}>Mute All</button>
            </div>
          </div>
          <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.38)]">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-orange-500">Channels</div>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-black text-slate-900">WhatsApp</div>
                <div className="mt-1 text-sm text-slate-500">Instant updates for shipment movement and delivery moments.</div>
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
            <div className="text-lg font-black text-slate-900">Movement Alerts</div>
            <Toggle checked={prefs.whatsapp.booked} onChange={(e) => setValue('whatsapp', 'booked', e.target.checked)} icon="📦" label="Booked" hint="Alert when shipment gets created in system." sample="Sample: AWB SHK1234 booked successfully." />
            <Toggle checked={prefs.whatsapp.inTransit} onChange={(e) => setValue('whatsapp', 'inTransit', e.target.checked)} icon="🚛" label="In Transit" hint="Alert when shipment starts moving between hubs." sample="Sample: AWB SHK1234 is now in transit." />
            <Toggle checked={prefs.whatsapp.outForDelivery} onChange={(e) => setValue('whatsapp', 'outForDelivery', e.target.checked)} icon="🚚" label="Out for Delivery" hint="Alert for final-mile run." sample="Sample: AWB SHK1234 is out for delivery today." />
            <Toggle checked={prefs.whatsapp.delivered} onChange={(e) => setValue('whatsapp', 'delivered', e.target.checked)} icon="✅" label="Delivered" hint="Delivery confirmation alert." sample="Sample: AWB SHK1234 delivered successfully." />
            <Toggle checked={prefs.whatsapp.delay} onChange={(e) => setValue('whatsapp', 'delay', e.target.checked)} icon="⏳" label="Delay Alerts" hint="Proactive delay prediction signals." sample="Sample: AWB SHK1234 may be delayed by 2 days." />
            <Toggle checked={prefs.whatsapp.exceptionDigest} onChange={(e) => setValue('whatsapp', 'exceptionDigest', e.target.checked)} icon="🧾" label="Exception Digest" hint="Daily summary of risky shipments." sample="Sample: 14 shipments need exception action today." />
          </div>

          <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.38)] space-y-3">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-orange-500">Email</div>
            <div className="text-lg font-black text-slate-900">Movement + Exception Alerts</div>
            <Toggle checked={prefs.email.booked} onChange={(e) => setValue('email', 'booked', e.target.checked)} icon="📦" label="Booked" hint="Email confirmation on shipment creation." sample="Subject: Shipment Booked — AWB SHK1234" />
            <Toggle checked={prefs.email.inTransit} onChange={(e) => setValue('email', 'inTransit', e.target.checked)} icon="🚛" label="In Transit" hint="Email when shipment enters linehaul movement." sample="Subject: Shipment In Transit — AWB SHK1234" />
            <Toggle checked={prefs.email.outForDelivery} onChange={(e) => setValue('email', 'outForDelivery', e.target.checked)} icon="🚚" label="Out for Delivery" hint="Email before final delivery attempt." sample="Subject: Out For Delivery — AWB SHK1234" />
            <Toggle checked={prefs.email.delivered} onChange={(e) => setValue('email', 'delivered', e.target.checked)} icon="✅" label="Delivered" hint="Email delivery confirmation." sample="Subject: Delivered — AWB SHK1234" />
            <Toggle checked={prefs.email.ndr} onChange={(e) => setValue('email', 'ndr', e.target.checked)} icon="⚠️" label="NDR Alerts" hint="Delivery failure requiring action." sample="Subject: Delivery Attempt Failed — AWB SHK1234" />
            <Toggle checked={prefs.email.rto} onChange={(e) => setValue('email', 'rto', e.target.checked)} icon="↩️" label="RTO Alerts" hint="Return-to-origin updates." sample="Subject: RTO Alert — AWB SHK1234" />
            <Toggle checked={prefs.email.pod} onChange={(e) => setValue('email', 'pod', e.target.checked)} icon="📸" label="Delivery Proof / POD" hint="POD link after final delivery." sample="Subject: Delivery Confirmation — AWB SHK1234" />
            <Toggle checked={prefs.email.dispute} onChange={(e) => setValue('email', 'dispute', e.target.checked)} icon="🧾" label="Dispute Workflow" hint="Updates on billing dispute lifecycle." sample="Subject: Dispute Opened — DSP-20260412-1101-421" />
            <Toggle checked={prefs.email.webhookFailure} onChange={(e) => setValue('email', 'webhookFailure', e.target.checked)} icon="🔌" label="Webhook Failure" hint="Integration ingestion or retry failures." sample="Subject: Integration Event Failed — Flipkart" />
          </div>
        </div>

        <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.38)] space-y-3">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-orange-500">Branded CX Kit</div>
          <div className="text-lg font-black text-slate-900">Template Manager + Journeys</div>
          <div className="grid gap-3 lg:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-slate-600">SMS Delivered Template</label>
              <textarea className="input min-h-[70px]" value={prefs.templates.sms.delivered} onChange={(e) => setTemplateValue('sms', 'delivered', e.target.value)} placeholder="Hi {{consignee}}, AWB {{awb}} delivered. Track: {{trackUrl}}" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">SMS NDR Template</label>
              <textarea className="input min-h-[70px]" value={prefs.templates.sms.ndr} onChange={(e) => setTemplateValue('sms', 'ndr', e.target.value)} placeholder="Delivery attempt failed for {{awb}}. Please update instructions." />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Email Delivered Subject</label>
              <input className="input" value={prefs.templates.email.deliveredSubject} onChange={(e) => setTemplateValue('email', 'deliveredSubject', e.target.value)} placeholder="Delivered — AWB {{awb}}" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Email Dispute Subject</label>
              <input className="input" value={prefs.templates.email.disputeSubject} onChange={(e) => setTemplateValue('email', 'disputeSubject', e.target.value)} placeholder="Dispute Opened — {{disputeNo}}" />
            </div>
          </div>
          <div className="grid gap-2 lg:grid-cols-3">
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={!!prefs.templates.journeys.postOrderEnabled} onChange={(e) => setJourney('postOrderEnabled', e.target.checked)} /> Post-order journey</label>
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={!!prefs.templates.journeys.ndrRecoveryEnabled} onChange={(e) => setJourney('ndrRecoveryEnabled', e.target.checked)} /> NDR recovery journey</label>
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={!!prefs.templates.journeys.postDeliveryEnabled} onChange={(e) => setJourney('postDeliveryEnabled', e.target.checked)} /> Post-delivery journey</label>
          </div>
        </section>

        <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.38)] space-y-3">
          <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-orange-500">Compliance</div>
          <div className="text-lg font-black text-slate-900">Data Retention Controls (days)</div>
          <div className="grid gap-3 lg:grid-cols-3">
            <div>
              <label className="text-xs font-bold text-slate-600">Audit logs</label>
              <input type="number" className="input" value={prefs.retention.auditLogDays} onChange={(e) => setRetention('auditLogDays', Number(e.target.value || 180))} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Webhook events</label>
              <input type="number" className="input" value={prefs.retention.webhookEventDays} onChange={(e) => setRetention('webhookEventDays', Number(e.target.value || 90))} />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600">Notifications</label>
              <input type="number" className="input" value={prefs.retention.notificationDays} onChange={(e) => setRetention('notificationDays', Number(e.target.value || 90))} />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}

