import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function ClientWarehousesPage({ toast }) {
  const [warehouses, setWarehouses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', contactName: '', contactPhone: '', contactEmail: '', address: '', city: '', state: '', pincode: '', isDefault: false });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try { const res = await api.get('/features/warehouses'); setWarehouses(res.data || []); } catch (e) { toast?.(e.message, 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try { await api.post('/features/warehouses', form); toast?.('Warehouse created', 'success'); setShowForm(false); setForm({ name: '', code: '', contactName: '', contactPhone: '', contactEmail: '', address: '', city: '', state: '', pincode: '', isDefault: false }); load(); }
    catch (e) { toast?.(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this warehouse?')) return;
    try { await api.delete(`/features/warehouses/${id}`); toast?.('Deleted', 'success'); load(); } catch (e) { toast?.(e.message, 'error'); }
  };

  if (loading) return <div className="client-premium-main"><div className="card animate-pulse h-48" /></div>;

  return (
    <div className="client-premium-main">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Warehouses</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage pickup locations for your shipments.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Add Warehouse'}</button>
      </div>

      {showForm && (
        <div className="client-premium-card p-5 mb-6 animate-in">
          <h2 className="font-bold text-slate-900 dark:text-white mb-4">New Warehouse</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              ['Warehouse Name', 'name', 'e.g. Mumbai Hub'], ['Code', 'code', 'e.g. MUM-01'],
              ['Contact Name', 'contactName', 'Warehouse manager'], ['Contact Phone', 'contactPhone', '+91 ...'],
              ['Email', 'contactEmail', 'warehouse@company.com'], ['Full Address', 'address', 'Street, Area'],
              ['City', 'city', 'Mumbai'], ['State', 'state', 'Maharashtra'],
              ['Pincode', 'pincode', '400001'],
            ].map(([label, key, ph]) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input className="input" placeholder={ph} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} />
              </div>
            ))}
            <div className="flex items-center gap-2 col-span-full">
              <input type="checkbox" checked={form.isDefault} onChange={e => setForm(p => ({ ...p, isDefault: e.target.checked }))} id="isDefault" />
              <label htmlFor="isDefault" className="text-sm text-slate-600 dark:text-slate-300">Set as default pickup location</label>
            </div>
          </div>
          <button className="btn-primary mt-4" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Create Warehouse'}</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {warehouses.map((wh, i) => (
          <div key={wh.id} className="client-premium-card p-5 animate-in" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-slate-900 dark:text-white">{wh.name}</div>
                <div className="text-xs font-mono text-slate-500 mt-0.5">{wh.code}</div>
              </div>
              {wh.isDefault && <span className="badge badge-success">Default</span>}
            </div>
            <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">{wh.address}, {wh.city}, {wh.state} - {wh.pincode}</div>
            <div className="mt-2 text-xs text-slate-500">{wh.contactName} · {wh.contactPhone}</div>
            <div className="mt-3 flex gap-2">
              <button className="btn-ghost btn-sm text-rose-500" onClick={() => remove(wh.id)}>Delete</button>
            </div>
          </div>
        ))}
        {!warehouses.length && <div className="col-span-full text-center text-slate-400 py-12">No warehouses yet. Add your first pickup location above.</div>}
      </div>
    </div>
  );
}
