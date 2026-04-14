import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Modal } from '../../components/ui/Modal';

const ACTION_OPTIONS = [
  { value: 'REATTEMPT', label: 'Request reattempt' },
  { value: 'UPDATE_ADDRESS', label: 'Update address' },
  { value: 'RTO', label: 'Return to origin' },
];

export default function ClientNDRPage({ toast }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ action: 'REATTEMPT', newAddress: '', newPhone: '', rescheduleDate: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [bridgeSending, setBridgeSending] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/portal/ndr');
      setItems(res.data?.ndrs || []);
    } catch (e) {
      toast?.(e.message || 'Failed to load NDRs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const open = (item) => {
    setSelected(item);
    setForm({ action: 'REATTEMPT', newAddress: item.shipment?.destination || '', newPhone: item.shipment?.phone || '', rescheduleDate: '', notes: '' });
  };

  const submit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await api.post(`/portal/ndr/${selected.id}/respond`, form);
      toast?.(res.message || 'NDR request submitted', 'success');
      setSelected(null);
      await load();
    } catch (e) {
      toast?.(e.message || 'Failed to submit NDR request', 'error');
    } finally {
      setSaving(false);
    }
  };

  const sendWhatsAppBridge = async () => {
    if (!selected) return;
    setBridgeSending(true);
    try {
      const res = await api.post(`/portal/ndr/${selected.id}/whatsapp-bridge`, {
        phone: form.newPhone || selected.shipment?.phone || '',
        preferredDate: form.rescheduleDate || '',
        mapHint: form.newAddress || '',
        note: form.notes || '',
      });
      toast?.(res.message || 'WhatsApp bridge sent', 'success');
    } catch (e) {
      toast?.(e.message || 'Failed to send WhatsApp bridge', 'error');
    } finally {
      setBridgeSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7faff_0%,#eef4fd_100%)]">
      <header className="client-premium-header px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/portal" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:text-slate-700">← Portal</Link>
            <div>
              <div className="text-sm font-black text-slate-900">NDR Self-Service</div>
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-orange-500">Exception Handling</div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto client-premium-main">
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_320px]">
          <div className="overflow-hidden rounded-[28px] border border-slate-200/60 bg-[linear-gradient(145deg,#fff7f5_0%,#ffffff_70%)] p-6 shadow-[0_22px_44px_-30px_rgba(220,38,38,0.25)]">
            <div className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-orange-600">
              Delivery Exceptions
            </div>
            <h1 className="mt-4 max-w-2xl text-3xl font-black leading-tight text-slate-900">Failed-delivery recovery now feels clearer and more action-oriented.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
              Review exception cases, open the shipment, and send the next instruction directly to operations from one cleaner queue.
            </p>
          </div>
          <div className="rounded-[26px] border border-amber-200 bg-[linear-gradient(180deg,#fffbea_0%,#ffffff_100%)] p-5 shadow-[0_18px_40px_-28px_rgba(202,138,4,0.35)]">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-amber-600">Open Cases</div>
            <div className="mt-2 text-4xl font-black text-slate-900">{items.length}</div>
            <p className="mt-2 text-sm text-slate-500">Every case here needs a client-side decision or confirmation.</p>
          </div>
        </section>

        {loading ? (
          <div className="rounded-[26px] border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">Loading NDRs…</div>
        ) : items.length === 0 ? (
          <div className="rounded-[26px] border border-slate-200 bg-white py-12 text-center shadow-sm">
            <div className="text-4xl">✅</div>
            <div className="mt-3 font-semibold text-slate-800">No active NDR cases</div>
            <div className="mt-1 text-sm text-slate-500">Failed deliveries will appear here if they need your action.</div>
          </div>
        ) : (
          <div className="grid gap-3">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => open(item)}
                className="rounded-[24px] border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-orange-200 hover:bg-orange-50/30"
              >
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <div className="font-mono text-xs font-black text-sky-700">{item.awb}</div>
                    <div className="mt-2 text-base font-black text-slate-900">{item.reason}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {item.shipment?.consignee || 'Consignee'} · {item.shipment?.destination || 'Destination'}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="badge badge-yellow">{item.action}</span>
                    <div className="mt-2 text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString('en-IN')}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Respond to ${selected.awb}` : 'Respond to NDR'}
        footer={(
          <>
            <button className="btn-secondary" onClick={() => setSelected(null)}>Cancel</button>
            <button className="btn-secondary" onClick={sendWhatsAppBridge} disabled={bridgeSending}>
              {bridgeSending ? 'Sending…' : 'Send WhatsApp Link'}
            </button>
            <button className="btn-primary" onClick={submit} disabled={saving}>{saving ? 'Submitting…' : 'Submit Request'}</button>
          </>
        )}
      >
        <div className="space-y-3">
          <select className="input" value={form.action} onChange={(e) => setForm((prev) => ({ ...prev, action: e.target.value }))}>
            {ACTION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          {form.action === 'UPDATE_ADDRESS' && (
            <textarea className="input min-h-[90px]" value={form.newAddress} onChange={(e) => setForm((prev) => ({ ...prev, newAddress: e.target.value }))} placeholder="Correct delivery address" />
          )}
          <input className="input" value={form.newPhone} onChange={(e) => setForm((prev) => ({ ...prev, newPhone: e.target.value }))} placeholder="Updated phone number (optional)" />
          <input className="input" type="date" value={form.rescheduleDate} onChange={(e) => setForm((prev) => ({ ...prev, rescheduleDate: e.target.value }))} />
          <textarea className="input min-h-[100px]" value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Extra instructions for the delivery team" />
        </div>
      </Modal>
    </div>
  );
}

