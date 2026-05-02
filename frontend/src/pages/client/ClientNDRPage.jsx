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
  const [escalating, setEscalating] = useState(false);

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

  const escalateCase = async () => {
    if (!selected) return;
    setEscalating(true);
    try {
      const res = await api.post(`/portal/ndr/${selected.id}/escalate`, {
        notes: form.notes || '',
      });
      toast?.(res.message || 'NDR escalated successfully', 'success');
      setSelected(null);
      await load();
    } catch (e) {
      toast?.(e.message || 'Failed to escalate NDR', 'error');
    } finally {
      setEscalating(false);
    }
  };

  return (
    <div className="min-h-full">
      <div className="mx-auto client-premium-main">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Review and resolve failed deliveries.</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Send the next instruction to operations from one focused queue.</p>
        </div>
      </div>


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
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.08em]">
                      <span className={`rounded-full px-2 py-1 ${
                        item?.automation?.urgency?.severity === 'critical'
                          ? 'bg-rose-100 text-rose-700'
                          : item?.automation?.urgency?.severity === 'high'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                      }`}>
                        {item?.automation?.urgency?.severity || 'normal'} urgency
                      </span>
                      {item?.automation?.sla?.breach && (
                        <span className="rounded-full bg-red-100 px-2 py-1 text-red-700">
                          SLA breach {item?.automation?.sla?.breachHours || 0}h
                        </span>
                      )}
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
            <button className="btn-secondary" onClick={escalateCase} disabled={escalating}>
              {escalating ? 'Escalating…' : 'Escalate to Ops'}
            </button>
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
