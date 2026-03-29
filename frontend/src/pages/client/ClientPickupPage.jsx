import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

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
      setForm((prev) => ({ ...prev, notes: '', deliveryAddress: '', deliveryCity: '', deliveryState: '', preferredCarrier: '' }));
      await load();
    } catch (e) {
      toast?.(e.message || 'Failed to create pickup request', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link to="/portal" className="text-gray-400 hover:text-gray-600">← Portal</Link>
        <span className="font-bold text-gray-900">Pickup Requests</span>
      </header>

      <div className="max-w-6xl mx-auto p-6 grid lg:grid-cols-[1fr_1.1fr] gap-6">
        <div className="card space-y-3">
          <div>
            <h1 className="text-xl font-black text-gray-900">Book a Pickup</h1>
            <p className="text-sm text-gray-500 mt-1">Choose the pickup date, slot, and package details. Your request goes straight to the ops team.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <input className="input" placeholder="Contact name" value={form.contactName} onChange={(e) => setForm((prev) => ({ ...prev, contactName: e.target.value }))} />
            <input className="input" placeholder="Phone number" value={form.contactPhone} onChange={(e) => setForm((prev) => ({ ...prev, contactPhone: e.target.value }))} />
            <input className="input md:col-span-2" placeholder="Email (optional)" value={form.contactEmail} onChange={(e) => setForm((prev) => ({ ...prev, contactEmail: e.target.value }))} />
            <textarea className="input md:col-span-2 min-h-[90px]" placeholder="Pickup address" value={form.pickupAddress} onChange={(e) => setForm((prev) => ({ ...prev, pickupAddress: e.target.value }))} />
            <input className="input" placeholder="Pickup city" value={form.pickupCity} onChange={(e) => setForm((prev) => ({ ...prev, pickupCity: e.target.value }))} />
            <input className="input" placeholder="PIN code" value={form.pickupPin} onChange={(e) => setForm((prev) => ({ ...prev, pickupPin: e.target.value }))} />
            <textarea className="input md:col-span-2 min-h-[70px]" placeholder="Delivery address (optional)" value={form.deliveryAddress} onChange={(e) => setForm((prev) => ({ ...prev, deliveryAddress: e.target.value }))} />
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
            <textarea className="input md:col-span-2 min-h-[80px]" placeholder="Special notes" value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} />
          </div>
          <button onClick={submit} disabled={saving} className="btn-primary w-full justify-center">
            {saving ? 'Submitting…' : 'Create Pickup Request'}
          </button>
        </div>

        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Recent Pickup Requests</h2>
          </div>
          {loading ? (
            <div className="p-5 text-gray-500">Loading pickups…</div>
          ) : pickups.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No pickup requests yet.</div>
          ) : (
            <div className="divide-y">
              {pickups.map((pickup) => (
                <div key={pickup.id} className="p-5">
                  <div className="flex justify-between gap-3 flex-wrap">
                    <div>
                      <div className="font-mono text-xs font-bold text-navy-700">{pickup.requestNo}</div>
                      <div className="font-semibold text-gray-900 mt-1">{pickup.pickupCity} · {pickup.timeSlot}</div>
                      <div className="text-xs text-gray-500 mt-1">{pickup.scheduledDate} · {pickup.packageType} · {pickup.pieces} pcs</div>
                    </div>
                    <span className={`badge ${
                      pickup.status === 'COMPLETED' ? 'badge-green'
                        : pickup.status === 'CANCELLED' ? 'badge-red'
                          : pickup.status === 'ASSIGNED' ? 'badge-blue'
                            : 'badge-yellow'
                    }`}>
                      {pickup.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
