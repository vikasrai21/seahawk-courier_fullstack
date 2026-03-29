import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-xl border border-gray-100 p-4 bg-gray-50 cursor-pointer">
      <div>
        <div className="font-semibold text-gray-900">{label}</div>
        <div className="text-sm text-gray-500 mt-1">{hint}</div>
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link to="/portal" className="text-gray-400 hover:text-gray-600">← Portal</Link>
        <span className="font-bold text-gray-900">Notification Preferences</span>
      </header>

      <div className="max-w-3xl mx-auto p-6 space-y-5">
        <div className="card">
          <h1 className="font-bold text-gray-900">Choose What Reaches You</h1>
          <p className="text-sm text-gray-500 mt-1">Reduce noise and only get the delivery events your team actually cares about.</p>
        </div>

        <div className="card space-y-3">
          <div className="font-bold text-gray-900">WhatsApp</div>
          <Toggle checked={prefs.whatsapp.outForDelivery} onChange={(e) => setValue('whatsapp', 'outForDelivery', e.target.checked)} label="Out for Delivery" hint="Get a WhatsApp alert when a shipment is on the last-mile run." />
          <Toggle checked={prefs.whatsapp.delivered} onChange={(e) => setValue('whatsapp', 'delivered', e.target.checked)} label="Delivered" hint="Get a WhatsApp confirmation as soon as a package is delivered." />
        </div>

        <div className="card space-y-3">
          <div className="font-bold text-gray-900">Email</div>
          <Toggle checked={prefs.email.ndr} onChange={(e) => setValue('email', 'ndr', e.target.checked)} label="NDR Alerts" hint="Receive email alerts for delivery failures that need a re-attempt or correction." />
          <Toggle checked={prefs.email.rto} onChange={(e) => setValue('email', 'rto', e.target.checked)} label="RTO Alerts" hint="Receive email alerts when a shipment moves into return-to-origin." />
          <Toggle checked={prefs.email.pod} onChange={(e) => setValue('email', 'pod', e.target.checked)} label="Delivery Proof / POD" hint="Receive delivery confirmation emails with proof links when available." />
        </div>

        <div className="flex justify-end">
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}
