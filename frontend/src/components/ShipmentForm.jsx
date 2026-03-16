import { useState, useEffect } from 'react';
import api from '../services/api';
import { STATUSES } from './ui/StatusBadge';

const COURIERS = ['BlueDart', 'DTDC', 'FedEx', 'DHL', 'Delhivery', 'Ecom Express', 'XpressBees', 'Shadowfax', 'Other'];

export default function ShipmentForm({ initial = {}, onSubmit, onCancel, loading }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    date: today, clientCode: '', awb: '', consignee: '', destination: '',
    weight: '', amount: '', courier: '', department: '', service: 'Standard',
    status: 'Booked', remarks: '', ...initial,
  });
  const [clients, setClients] = useState([]);

  useEffect(() => {
    api.get('/clients').then((r) => setClients(r.data || [])).catch(() => {});
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Date *</label>
          <input type="date" className="input" value={form.date} onChange={(e) => set('date', e.target.value)} required />
        </div>
        <div>
          <label className="label">AWB No *</label>
          <input type="text" className="input" placeholder="AWB123456" value={form.awb}
            onChange={(e) => set('awb', e.target.value)} required />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Client *</label>
          <select className="input" value={form.clientCode} onChange={(e) => set('clientCode', e.target.value)} required>
            <option value="">Select client…</option>
            {clients.map((c) => (
              <option key={c.code} value={c.code}>{c.code} — {c.company}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Courier</label>
          <select className="input" value={form.courier} onChange={(e) => set('courier', e.target.value)}>
            <option value="">Select courier…</option>
            {COURIERS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Consignee</label>
        <input type="text" className="input" placeholder="Consignee name" value={form.consignee}
          onChange={(e) => set('consignee', e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Destination</label>
          <input type="text" className="input" placeholder="City/State" value={form.destination}
            onChange={(e) => set('destination', e.target.value)} />
        </div>
        <div>
          <label className="label">Department</label>
          <input type="text" className="input" placeholder="Dept" value={form.department}
            onChange={(e) => set('department', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Weight (kg)</label>
          <input type="number" step="0.01" min="0" className="input" placeholder="0.00" value={form.weight}
            onChange={(e) => set('weight', e.target.value)} />
        </div>
        <div>
          <label className="label">Amount (₹)</label>
          <input type="number" step="0.01" min="0" className="input" placeholder="0.00" value={form.amount}
            onChange={(e) => set('amount', e.target.value)} />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={(e) => set('status', e.target.value)}>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Service</label>
          <select className="input" value={form.service} onChange={(e) => set('service', e.target.value)}>
            {['Standard', 'Express', 'Priority', 'Economy', 'Same Day'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Remarks</label>
          <input type="text" className="input" placeholder="Any notes…" value={form.remarks}
            onChange={(e) => set('remarks', e.target.value)} />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
          {loading ? 'Saving…' : 'Save Shipment'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        )}
      </div>
    </form>
  );
}
