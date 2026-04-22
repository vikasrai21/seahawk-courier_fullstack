import { useState, useEffect } from 'react';
import { Package, Truck, User, MapPin, Calendar, Clock, Info, ShieldCheck, Zap, Activity, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { STATUSES } from './ui/StatusBadge';

const COURIERS = ['BlueDart', 'DTDC', 'FedEx', 'DHL', 'Delhivery', 'Ecom Express', 'XpressBees', 'Shadowfax', 'Other'];

export default function ShipmentForm({ initial = {}, onSave, onCancel, loading }) {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    date: today, clientCode: '', awb: '', consignee: '', destination: '',
    weight: '', amount: '', courier: '', department: '', service: 'Standard',
    status: 'Booked', remarks: '', ...initial,
  });
  const [clients, setClients] = useState([]);

  useEffect(() => {
    api.get('/auth/users?role=CLIENT').then(() => {
       // Assuming clients are users with role CLIENT or we fetch from /clients
       api.get('/clients').then(r2 => setClients(r2.data || [])).catch(() => {});
    }).catch(() => {});
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form); // Changed from onSubmit to onSave to match ShipmentDashboard usage
  };

  const Field = ({ label, icon: Icon, children, req }) => (
    <div className="space-y-1.5">
       <div className="flex items-center gap-1.5 ml-1">
          {Icon && <Icon size={12} className="text-slate-400" />}
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}{req && <span className="text-rose-500 ml-1">*</span>}</label>
       </div>
       {children}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Shipment Date" icon={Calendar} req>
           <input type="date" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3.5 text-xs font-black uppercase tracking-tight text-slate-800 dark:text-white" value={form.date} onChange={(e) => set('date', e.target.value)} required />
        </Field>
        <Field label="AWB Number" icon={ShieldCheck} req>
           <input type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3.5 text-sm font-black tracking-tight text-slate-800 dark:text-white font-mono" placeholder="AWB123456" value={form.awb}
             onChange={(e) => set('awb', e.target.value)} required />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Client" icon={User} req>
           <select className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3.5 text-xs font-black uppercase tracking-widest text-slate-700 dark:text-white appearance-none" value={form.clientCode} onChange={(e) => set('clientCode', e.target.value)} required>
             <option value="">Select Client...</option>
             {clients.map((c) => (
               <option key={c.code} value={c.code}>{c.code.toUpperCase()} — {c.company.toUpperCase()}</option>
             ))}
           </select>
        </Field>
        <Field label="Courier" icon={Truck}>
           <select className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3.5 text-xs font-black uppercase tracking-widest text-slate-700 dark:text-white appearance-none" value={form.courier} onChange={(e) => set('courier', e.target.value)}>
             <option value="">Select Courier...</option>
             {COURIERS.map((c) => <option key={c}>{c.toUpperCase()}</option>)}
           </select>
        </Field>
      </div>

      <Field label="Consignee" icon={Package}>
         <input type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-tight text-slate-800 dark:text-white" placeholder="Recipient Name" value={form.consignee}
           onChange={(e) => set('consignee', e.target.value)} />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Destination" icon={MapPin}>
           <input type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3.5 text-xs font-black uppercase tracking-tight text-slate-800 dark:text-white" placeholder="City / State" value={form.destination}
             onChange={(e) => set('destination', e.target.value)} />
        </Field>
        <Field label="Department" icon={Info}>
           <input type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3.5 text-xs font-black uppercase tracking-tight text-slate-800 dark:text-white" placeholder="Optional" value={form.department}
             onChange={(e) => set('department', e.target.value)} />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Weight (KG)" icon={Zap}>
           <input type="number" step="0.01" min="0" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3.5 text-[11px] font-black text-slate-800 dark:text-white" placeholder="0.00" value={form.weight}
             onChange={(e) => set('weight', e.target.value)} />
        </Field>
        <Field label="Amount (₹)" icon={Activity}>
           <input type="number" step="0.01" min="0" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3.5 text-[11px] font-black text-slate-800 dark:text-white" placeholder="0.00" value={form.amount}
             onChange={(e) => set('amount', e.target.value)} />
        </Field>
        <Field label="Status">
           <select className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-white appearance-none" value={form.status} onChange={(e) => set('status', e.target.value)}>
             {STATUSES.map((s) => <option key={s}>{s.toUpperCase()}</option>)}
           </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Service Type" icon={Clock}>
           <select className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-white appearance-none" value={form.service} onChange={(e) => set('service', e.target.value)}>
             {['Standard', 'Express', 'Priority', 'Economy', 'Same Day'].map((s) => <option key={s}>{s.toUpperCase()}</option>)}
           </select>
        </Field>
        <Field label="Notes">
           <input type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-3.5 text-[10px] font-black uppercase tracking-tight text-slate-400 dark:text-white" placeholder="Optional notes" value={form.remarks}
             onChange={(e) => set('remarks', e.target.value)} />
        </Field>
      </div>

      <div className="flex gap-4 pt-4">
        {onCancel && (
          <button type="button" onClick={onCancel} className="flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-all">Cancel</button>
        )}
        <button type="submit" disabled={loading} className="flex-[2] py-5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-[24px] shadow-xl shadow-slate-900/10 active:scale-95 transition-all flex items-center justify-center gap-3">
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck size={16} />}
          {loading ? 'Saving...' : 'Save Shipment'}
        </button>
      </div>
    </form>
  );
}
