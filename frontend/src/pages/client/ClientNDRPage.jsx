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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link to="/portal" className="text-gray-400 hover:text-gray-600">← Portal</Link>
        <span className="font-bold text-gray-900">NDR Self-Service</span>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-5">
        <div className="card">
          <h1 className="text-xl font-black text-gray-900">Delivery Exception Actions</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review failed deliveries and send reattempt or correction instructions directly to the operations team.
          </p>
        </div>

        {loading ? (
          <div className="card text-gray-500">Loading NDRs…</div>
        ) : items.length === 0 ? (
          <div className="card text-center text-gray-500 py-12">
            <div className="text-4xl mb-3">✅</div>
            <div className="font-semibold text-gray-800">No active NDR cases</div>
            <div className="text-sm mt-1">Failed deliveries will appear here if they need your action.</div>
          </div>
        ) : (
          <div className="grid gap-3">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => open(item)}
                className="card text-left hover:border-orange-200 transition-colors"
              >
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <div className="font-mono text-xs font-bold text-navy-700">{item.awb}</div>
                    <div className="text-sm font-semibold text-gray-900 mt-1">{item.reason}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {item.shipment?.consignee || 'Consignee'} · {item.shipment?.destination || 'Destination'}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="badge badge-yellow">{item.action}</span>
                    <div className="text-xs text-gray-400 mt-2">{new Date(item.createdAt).toLocaleDateString('en-IN')}</div>
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
