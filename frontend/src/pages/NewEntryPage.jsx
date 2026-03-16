import { useState, useEffect, useRef } from 'react';
import { Plus, CheckCircle, Keyboard, ChevronRight } from 'lucide-react';
import api from '../services/api';
import { StatusBadge } from '../components/ui/StatusBadge';

const COURIERS  = ['BlueDart','DTDC','FedEx','DHL','Delhivery','Ecom Express','XpressBees','Shadowfax','Other'];
const STATUSES  = ['Booked','InTransit','OutForDelivery','Delivered','Delayed','RTO','Cancelled'];
const SERVICES  = ['Standard','Express','Priority','Economy','Same Day'];

const today = () => new Date().toISOString().split('T')[0];
const blank  = () => ({
  date: today(), clientCode:'', awb:'', consignee:'',
  destination:'', courier:'', department:'', weight:'', amount:'',
  service:'Standard', status:'Booked', remarks:''
});

const fmt = n => `₹${Number(n||0).toLocaleString('en-IN')}`;

export default function NewEntryPage({ toast }) {
  const [form,    setForm]    = useState(blank());
  const [clients, setClients] = useState([]);
  const [recent,  setRecent]  = useState([]);
  const [saving,  setSaving]  = useState(false);
  const [flash,   setFlash]   = useState(null);
  const awbRef = useRef();

  useEffect(() => {
    api.get('/clients').then(r => setClients(r.data || [])).catch(() => {});
    loadRecent();
  }, []);

  const loadRecent = async () => {
    try {
      const res = await api.get('/shipments?limit=8&page=1');
      setRecent(res.data || []);
    } catch {}
  };

  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  const save = async (e) => {
    e?.preventDefault();
    if (!form.awb || !form.clientCode) {
      toast?.('AWB and Client are required', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/shipments', form);
      setFlash(res.data);
      setForm(f => ({...blank(), date: f.date, clientCode: f.clientCode, courier: f.courier}));
      await loadRecent();
      toast?.(`✓ AWB ${res.data.awb} saved`, 'success');
      setTimeout(() => awbRef.current?.focus(), 100);
    } catch (err) {
      toast?.(err.message, 'error');
    } finally { setSaving(false); }
  };

  // Tab-order: awb → consignee → destination → courier → dept → weight → amount → status → save
  const handleKeyDown = (e, nextId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextId === 'SAVE') { save(); return; }
      document.getElementById(nextId)?.focus();
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Entry</h1>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
            <Keyboard className="w-3 h-3" /> Tab between fields · Enter to move forward · Ctrl+Enter to save
          </p>
        </div>
        {flash && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm animate-pulse">
            <CheckCircle className="w-4 h-4" />
            <span>Saved: <strong>{flash.awb}</strong></span>
          </div>
        )}
      </div>

      {/* Entry form */}
      <form onSubmit={save} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        {/* Row 1: Date, Client, AWB */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
          <FieldCell label="Date *" hint="DD/MM/YYYY">
            <input id="date" type="date" className="cell-input" value={form.date}
              onChange={e => set('date', e.target.value)}
              onKeyDown={e => handleKeyDown(e, 'clientCode')} />
          </FieldCell>
          <FieldCell label="Client *" hint="Select from list">
            <select id="clientCode" className="cell-input" value={form.clientCode}
              onChange={e => set('clientCode', e.target.value)}
              onKeyDown={e => handleKeyDown(e, 'awb')}>
              <option value="">— Select Client —</option>
              {clients.map(c => <option key={c.code} value={c.code}>{c.code} · {c.company}</option>)}
            </select>
          </FieldCell>
          <FieldCell label="AWB No *" hint="Tracking number">
            <input id="awb" ref={awbRef} type="text" className="cell-input font-mono uppercase"
              placeholder="Enter AWB…" value={form.awb}
              onChange={e => set('awb', e.target.value.toUpperCase())}
              onKeyDown={e => handleKeyDown(e, 'consignee')} autoFocus />
          </FieldCell>
        </div>

        {/* Row 2: Consignee, Destination, Courier, Dept */}
        <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
          <FieldCell label="Consignee" hint="Recipient name">
            <input id="consignee" type="text" className="cell-input uppercase"
              placeholder="CONSIGNEE NAME" value={form.consignee}
              onChange={e => set('consignee', e.target.value.toUpperCase())}
              onKeyDown={e => handleKeyDown(e, 'destination')} />
          </FieldCell>
          <FieldCell label="Destination" hint="City / state">
            <input id="destination" type="text" className="cell-input uppercase"
              placeholder="CITY" value={form.destination}
              onChange={e => set('destination', e.target.value.toUpperCase())}
              onKeyDown={e => handleKeyDown(e, 'courier')} />
          </FieldCell>
          <FieldCell label="Courier" hint="Shipping company">
            <select id="courier" className="cell-input" value={form.courier}
              onChange={e => set('courier', e.target.value)}
              onKeyDown={e => handleKeyDown(e, 'department')}>
              <option value="">— Select —</option>
              {COURIERS.map(c => <option key={c}>{c}</option>)}
            </select>
          </FieldCell>
          <FieldCell label="Department" hint="Optional">
            <input id="department" type="text" className="cell-input"
              placeholder="DEPT" value={form.department}
              onChange={e => set('department', e.target.value)}
              onKeyDown={e => handleKeyDown(e, 'weight')} />
          </FieldCell>
        </div>

        {/* Row 3: Weight, Amount, Service, Status, Remarks */}
        <div className="grid grid-cols-5 divide-x divide-gray-100 border-b border-gray-100">
          <FieldCell label="Weight (kg)" hint="e.g. 1.5">
            <input id="weight" type="number" step="0.01" min="0" className="cell-input text-right"
              placeholder="0.00" value={form.weight}
              onChange={e => set('weight', e.target.value)}
              onKeyDown={e => handleKeyDown(e, 'amount')} />
          </FieldCell>
          <FieldCell label="Amount (₹)" hint="Billing amount">
            <input id="amount" type="number" step="0.01" min="0" className="cell-input text-right"
              placeholder="0.00" value={form.amount}
              onChange={e => set('amount', e.target.value)}
              onKeyDown={e => handleKeyDown(e, 'service')} />
          </FieldCell>
          <FieldCell label="Service">
            <select id="service" className="cell-input" value={form.service}
              onChange={e => set('service', e.target.value)}
              onKeyDown={e => handleKeyDown(e, 'status')}>
              {SERVICES.map(s => <option key={s}>{s}</option>)}
            </select>
          </FieldCell>
          <FieldCell label="Status">
            <select id="status" className="cell-input" value={form.status}
              onChange={e => set('status', e.target.value)}
              onKeyDown={e => handleKeyDown(e, 'remarks')}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </FieldCell>
          <FieldCell label="Remarks" hint="Optional notes">
            <input id="remarks" type="text" className="cell-input"
              placeholder="Notes…" value={form.remarks}
              onChange={e => set('remarks', e.target.value)}
              onKeyDown={e => handleKeyDown(e, 'SAVE')} />
          </FieldCell>
        </div>

        {/* Save row */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono">Tab</kbd> Next field</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono">Enter</kbd> Move forward</span>
            <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-mono">Ctrl+Enter</kbd> Save</span>
          </div>
          <button type="submit" disabled={saving}
            className="btn-primary gap-2 px-6" onKeyDown={e => e.key === 'Enter' && save()}>
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…
              </span>
            ) : (
              <><Plus className="w-4 h-4" /> Save & Continue</>
            )}
          </button>
        </div>
      </form>

      {/* Recent entries */}
      {recent.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            Recent Entries <span className="badge badge-gray">{recent.length}</span>
          </h2>
          <div className="table-wrap">
            <table className="tbl text-xs">
              <thead>
                <tr><th>Date</th><th>AWB</th><th>Client</th><th>Consignee</th><th>Destination</th><th>Courier</th><th className="text-right">Wt</th><th className="text-right">Amt</th><th>Status</th></tr>
              </thead>
              <tbody>
                {recent.map(s => (
                  <tr key={s.id}>
                    <td className="text-gray-500">{s.date}</td>
                    <td className="font-mono font-bold text-navy-600">{s.awb}</td>
                    <td className="font-semibold">{s.clientCode}</td>
                    <td className="max-w-[100px] truncate">{s.consignee}</td>
                    <td className="text-gray-500">{s.destination}</td>
                    <td>{s.courier}</td>
                    <td className="text-right text-gray-500">{s.weight}kg</td>
                    <td className="text-right font-medium">{fmt(s.amount)}</td>
                    <td><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldCell({ label, hint, children }) {
  return (
    <div className="p-0">
      <div className="px-3 pt-2.5 pb-0.5">
        <div className="flex items-center justify-between">
          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{label}</label>
          {hint && <span className="text-[9px] text-gray-300 italic">{hint}</span>}
        </div>
      </div>
      {children}
    </div>
  );
}
