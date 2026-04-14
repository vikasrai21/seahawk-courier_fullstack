// src/pages/client/ClientOrdersQueuePage.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { StatusBadge } from '../../components/ui/StatusBadge';

export default function ClientOrdersQueuePage({ toast }) {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // New Draft Form State
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ referenceId: '', consignee: '', destination: '', phone: '', pincode: '', weight: '1' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/drafts');
      setDrafts(res.data?.data || []);
    } catch (err) {
      toast?.(err.message || 'Failed to load order queue', 'error');
    } finally {
      setLoading(false);
    }
  };

  const createDraft = async (e) => {
    e.preventDefault();
    if (!form.consignee || !form.weight) return toast?.('Consignee and weight are required', 'error');
    setSaving(true);
    try {
      await api.post('/drafts', form);
      toast?.('Order added to queue', 'success');
      setShowForm(false);
      setForm({ referenceId: '', consignee: '', destination: '', phone: '', pincode: '', weight: '1' });
      load();
    } catch (err) {
      toast?.(err.message || 'Failed to draft order', 'error');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen client-premium-shell flex flex-col">
      <header className="client-premium-header px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/portal" className="text-gray-400 hover:text-gray-600">← Portal</Link>
          <span className="client-premium-title text-lg">Order Queue</span>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          + New Order
        </button>
      </header>

      <div className="client-premium-main flex-1">
        
        {showForm && (
          <div className="client-premium-card p-5 border-[#f97316] shadow-sm shadow-orange-100/50">
            <h2 className="font-bold text-gray-900 mb-4">Create Draft Order</h2>
            <form onSubmit={createDraft} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="label">Order Ref (Optional)</label>
                <input className="input" placeholder="#SHOP-1234" value={form.referenceId} onChange={e => setForm({...form, referenceId: e.target.value})} />
              </div>
              <div>
                <label className="label">Consignee Name*</label>
                <input className="input" placeholder="John Doe" value={form.consignee} onChange={e => setForm({...form, consignee: e.target.value})} required />
              </div>
              <div>
                <label className="label">Destination City</label>
                <input className="input" placeholder="Mumbai" value={form.destination} onChange={e => setForm({...form, destination: e.target.value})} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" placeholder="9876543210" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
              <div>
                <label className="label">Pincode</label>
                <input className="input" placeholder="400001" value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value})} />
              </div>
              <div>
                <label className="label">Weight (kg)*</label>
                <input className="input" type="number" step="0.1" min="0.1" value={form.weight} onChange={e => setForm({...form, weight: e.target.value})} required />
              </div>
              <div className="col-span-full flex justify-end mt-2">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Add to Queue'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="client-premium-card p-0 overflow-hidden">
          <div className="border-b px-4 py-3 bg-gray-50 flex items-center justify-between">
             <h3 className="font-bold text-gray-900">Pending & Fulfilled Queue</h3>
             <span className="text-xs text-gray-400">Autonomous Binding Enabled</span>
          </div>
          
          {loading ? (
             <div className="p-8 text-center text-gray-400">Loading queue...</div>
          ) : drafts.length === 0 ? (
             <div className="p-12 text-center">
                 <div className="text-4xl mb-3">📦</div>
                 <div className="text-gray-900 font-bold mb-1">Your queue is empty</div>
                 <div className="text-gray-500 text-sm">Add an order and Sea Hawk operations will assign an AWB automatically.</div>
             </div>
          ) : (
             <table className="table">
               <thead>
                 <tr>
                   <th>Date</th>
                   <th>Order No.</th>
                   <th>Consignee</th>
                   <th>Weight</th>
                   <th>Status</th>
                   <th>Tracking AWB</th>
                 </tr>
               </thead>
               <tbody>
                 {drafts.map(d => (
                   <tr key={d.id}>
                     <td className="text-xs">{new Date(d.createdAt).toLocaleDateString()}</td>
                     <td className="font-mono text-xs">{d.referenceId || '-'}</td>
                     <td>
                        <div className="font-bold text-gray-900">{d.consignee}</div>
                        <div className="text-xs text-gray-500">{d.destination}</div>
                     </td>
                     <td className="text-sm">{d.weight} kg</td>
                     <td>
                        <StatusBadge status={d.status} />
                     </td>
                     <td>
                        {d.shipment?.awb ? (
                           <div className="flex flex-col">
                             <span className="font-mono text-xs font-bold text-blue-600">{d.shipment.awb}</span>
                             <span className="text-[10px] text-gray-400">Bound via Scanner</span>
                           </div>
                        ) : (
                           <span className="text-xs text-orange-600 animate-pulse">Awaiting fulfillment...</span>
                        )}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
          )}
        </div>
      </div>
    </div>
  );
}
