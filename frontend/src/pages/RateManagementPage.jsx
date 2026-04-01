import { useState, useEffect, useCallback } from 'react';
import { Shield, AlertTriangle, CheckCircle, Plus, Edit3, Trash2, Loader, Clock, Package, X } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';

const COURIERS_LIST = ['','trackon_exp','trackon_pt','trackon_sfc','trackon_air','delhivery_exp','delhivery_std','b2b','dtdc_7x','dtdc_7d','dtdc_7g','dtdc_xdoc','dtdc_xndx','gec_sfc','ltl_road','bluedart_exp','bluedart_air','bluedart_sfc'];
const ZONES_LIST = ['','Delhi & NCR','North India','Metro Cities','Rest of India','North East','Diplomatic / Port Blair'];
const TYPES_LIST = ['','doc','surface','air'];

export default function RateManagementPage({ toast }) {
  const { isAdmin } = useAuth();
  const [tab, setTab]             = useState('health');
  const [rateHealth, setRateHealth] = useState([]);
  const [marginRules, setMarginRules] = useState([]);
  const [rateVersions, setRateVersions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [editRule, setEditRule]   = useState(null);
  const [form, setForm]           = useState({ name:'', courier:'', zone:'', shipType:'', minMarginPct:'15', minProfitAbs:'', active:true });
  const [saving, setSaving]       = useState(false);

  const [vForm, setVForm]         = useState({ courier:'trackon', effectiveDate:'', notes:'' });
  const [showVForm, setShowVForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [hRes, mRes, vRes] = await Promise.all([
        api.get('/rates/health'),
        api.get('/rates/margin-rules'),
        api.get('/rates/versions'),
      ]);
      setRateHealth(hRes.data?.data || []);
      setMarginRules(mRes.data?.data || []);
      setRateVersions(vRes.data?.data || []);
    } catch { toast?.('Failed to load rate management data', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNewRule = () => {
    setEditRule(null);
    setForm({ name:'', courier:'', zone:'', shipType:'', minMarginPct:'15', minProfitAbs:'', active:true });
    setShowForm(true);
  };

  const openEditRule = r => {
    setEditRule(r);
    setForm({ name:r.name, courier:r.courier||'', zone:r.zone||'', shipType:r.shipType||'', minMarginPct:String(r.minMarginPct), minProfitAbs:r.minProfitAbs?String(r.minProfitAbs):'', active:r.active });
    setShowForm(true);
  };

  const saveRule = async () => {
    if (!form.name || !form.minMarginPct) { toast?.('Name and margin % are required', 'error'); return; }
    setSaving(true);
    try {
      const data = {
        name: form.name,
        courier: form.courier || null,
        zone: form.zone || null,
        shipType: form.shipType || null,
        minMarginPct: parseFloat(form.minMarginPct),
        minProfitAbs: form.minProfitAbs ? parseFloat(form.minProfitAbs) : null,
        active: form.active,
      };
      if (editRule) await api.put(`/rates/margin-rules/${editRule.id}`, data);
      else await api.post('/rates/margin-rules', data);
      toast?.(`Margin rule ${editRule ? 'updated' : 'created'}`, 'success');
      setShowForm(false);
      load();
    } catch { toast?.('Save failed', 'error'); }
    finally { setSaving(false); }
  };

  const deleteRule = async id => {
    if (!window.confirm('Delete this margin rule?')) return;
    try { await api.delete(`/rates/margin-rules/${id}`); toast?.('Rule deleted', 'success'); load(); }
    catch { toast?.('Delete failed', 'error'); }
  };

  const addRateVersion = async () => {
    if (!vForm.effectiveDate) { toast?.('Select effective date', 'error'); return; }
    setSaving(true);
    try {
      await api.post('/rates/versions', { ...vForm, dataJson: {} });
      toast?.('Rate version logged', 'success');
      setShowVForm(false);
      setVForm({ courier:'trackon', effectiveDate:'', notes:'' });
      load();
    } catch { toast?.('Failed to log version', 'error'); }
    finally { setSaving(false); }
  };

  if (loading && !rateHealth.length) return (
    <div className="p-6 text-center"><Loader className="w-6 h-6 animate-spin mx-auto text-gray-400 mb-3" /><p className="text-gray-400">Loading rate management…</p></div>
  );

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <PageHeader
        title="Rate Management"
        subtitle="Monitor partner rate health, margin floors, and version history from one cleaner admin workspace."
        icon={Shield}
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-white p-1 rounded-full w-fit border border-slate-200 shadow-sm">
        {[['health','Rate Health'],['margin','Margin Rules'],['versions','Version History']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${tab === id ? 'bg-slate-900 text-white shadow-[0_10px_20px_rgba(15,23,42,0.14)]' : 'text-gray-500 hover:text-gray-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* RATE HEALTH TAB */}
      {tab === 'health' && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {rateHealth.map(r => (
              <div key={r.partner} className={`rounded-2xl border p-4 shadow-sm ${r.critical ? 'border-red-200 bg-red-50' : r.stale ? 'border-amber-200 bg-amber-50' : 'border-green-100 bg-green-50/40'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${r.critical ? 'bg-red-500' : r.stale ? 'bg-amber-500' : 'bg-green-500'}`} />
                  <span className="font-bold text-sm text-gray-800 capitalize">{r.partner}</span>
                </div>
                <p className="text-xs text-gray-500">Effective: {r.label}</p>
                <p className={`text-lg font-bold mt-1 ${r.critical ? 'text-red-700' : r.stale ? 'text-amber-700' : 'text-green-700'}`}>
                  {r.ageInDays} days old
                </p>
                <p className={`text-[9px] font-bold mt-0.5 ${r.critical ? 'text-red-600' : r.stale ? 'text-amber-600' : 'text-green-600'}`}>
                  {r.critical ? '⚠️ CRITICAL — UPDATE IMMEDIATELY' : r.stale ? '⚠️ Stale — verify with partner' : '✓ Within acceptable range'}
                </p>
              </div>
            ))}
          </div>

          <div className="card-compact bg-blue-50 border-blue-100">
            <h3 className="font-bold text-sm text-blue-800 mb-2">Rate Update Protocol</h3>
            <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
              <li>Receive new rate sheet from courier partner (PDF/Excel)</li>
              <li>Update the corresponding rate table in <code className="bg-blue-100 px-1 rounded">rateEngine.js</code></li>
              <li>Log the version update below using "Version History" tab</li>
              <li>Rebuild frontend: run <code className="bg-blue-100 px-1 rounded">rebuild-frontend.bat</code></li>
              <li>Verify calculation using Rate Calculator with a known shipment</li>
            </ol>
          </div>
        </div>
      )}

      {/* MARGIN RULES TAB */}
      {tab === 'margin' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">Define minimum margin rules — the Rate Calculator will warn when below threshold.</p>
            {isAdmin && (
              <button onClick={openNewRule}
                className="flex items-center gap-1.5 bg-slate-800 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-700">
                <Plus className="w-3.5 h-3.5" />Add Rule
              </button>
            )}
          </div>

          {showForm && (
            <div className="card mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm">{editRule ? 'Edit Rule' : 'New Margin Rule'}</h3>
                <button onClick={() => setShowForm(false)} className="text-gray-300 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Rule Name *</label>
                  <input className="input"
                    placeholder="e.g. Minimum All Couriers" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Courier (blank = all)</label>
                  <select className="input"
                    value={form.courier} onChange={e => setForm(f => ({ ...f, courier: e.target.value }))}>
                    {COURIERS_LIST.map(c => <option key={c} value={c}>{c || 'All Couriers'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Zone (blank = all)</label>
                  <select className="input"
                    value={form.zone} onChange={e => setForm(f => ({ ...f, zone: e.target.value }))}>
                    {ZONES_LIST.map(z => <option key={z} value={z}>{z || 'All Zones'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Ship Type (blank = all)</label>
                  <select className="input"
                    value={form.shipType} onChange={e => setForm(f => ({ ...f, shipType: e.target.value }))}>
                    {TYPES_LIST.map(t => <option key={t} value={t}>{t || 'All Types'}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Min Margin % *</label>
                  <input type="number" min="0" max="100" step="0.5"
                    className="input"
                    value={form.minMarginPct} onChange={e => setForm(f => ({ ...f, minMarginPct: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Min Absolute Profit ₹</label>
                  <input type="number" min="0" step="10"
                    className="input"
                    placeholder="Optional" value={form.minProfitAbs} onChange={e => setForm(f => ({ ...f, minProfitAbs: e.target.value }))} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-600 mb-3 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
                Rule is active
              </label>
              <div className="flex gap-2">
                <button onClick={saveRule} disabled={saving}
                  className="flex-1 bg-slate-800 text-white py-2 rounded-xl text-xs font-bold hover:bg-slate-700 disabled:opacity-50">
                  {saving ? 'Saving…' : editRule ? 'Update Rule' : 'Create Rule'}
                </button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold hover:border-gray-400">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {marginRules.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 py-12 text-center">
              <Shield className="w-10 h-10 mx-auto mb-3 text-gray-200" />
              <p className="text-gray-400">No margin rules yet — add your first rule above</p>
              <p className="text-xs text-gray-300 mt-1">e.g. "Minimum 15% margin on all couriers"</p>
            </div>
          ) : (
            <div className="table-shell">
              <table className="w-full text-xs">
                <thead className="table-head">
                  <tr>
                    {['Name','Courier','Zone','Type','Min Margin','Min Profit ₹','Status','Actions'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {marginRules.map(r => (
                    <tr key={r.id} className="border-t border-gray-50 hover:bg-amber-50/30 transition-colors">
                      <td className="px-3 py-2.5 font-bold text-gray-800">{r.name}</td>
                      <td className="px-3 py-2.5 text-gray-500">{r.courier || 'All'}</td>
                      <td className="px-3 py-2.5 text-gray-500">{r.zone || 'All'}</td>
                      <td className="px-3 py-2.5 text-gray-500">{r.shipType || 'All'}</td>
                      <td className="px-3 py-2.5 font-bold text-slate-700">{r.minMarginPct}%</td>
                      <td className="px-3 py-2.5 text-gray-500">{r.minProfitAbs ? `₹${r.minProfitAbs}` : '—'}</td>
                      <td className="px-3 py-2.5">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${r.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                          {r.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        {isAdmin && (
                          <div className="flex gap-1">
                            <button onClick={() => openEditRule(r)} className="p-1 text-gray-400 hover:text-slate-700"><Edit3 className="w-3 h-3" /></button>
                            <button onClick={() => deleteRule(r.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VERSION HISTORY TAB */}
      {tab === 'versions' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-gray-600">Log every time partner rates are updated — creates an audit trail.</p>
            {isAdmin && (
              <button onClick={() => setShowVForm(!showVForm)}
                className="flex items-center gap-1.5 bg-slate-800 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-700">
                <Plus className="w-3.5 h-3.5" />Log Rate Update
              </button>
            )}
          </div>

          {showVForm && (
            <div className="card mb-4">
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Partner</label>
                  <select className="input"
                    value={vForm.courier} onChange={e => setVForm(f => ({ ...f, courier: e.target.value }))}>
                    {['trackon','primetrack','delhivery','dtdc','gec','ltl','b2b','bluedart'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Effective Date *</label>
                  <input type="date" className="input"
                    value={vForm.effectiveDate} onChange={e => setVForm(f => ({ ...f, effectiveDate: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Notes</label>
                  <input className="input"
                    placeholder="Rate revision details…" value={vForm.notes} onChange={e => setVForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
              <button onClick={addRateVersion} disabled={saving}
                className="bg-slate-800 text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-slate-700 disabled:opacity-50">
                {saving ? 'Saving…' : 'Log Rate Update'}
              </button>
            </div>
          )}

          {rateVersions.length === 0 ? (
            <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 py-12 text-center">
              <Clock className="w-10 h-10 mx-auto mb-3 text-gray-200" />
              <p className="text-gray-400">No rate versions logged yet</p>
            </div>
          ) : (
            <div className="table-shell divide-y divide-gray-50">
              {rateVersions.map(v => (
                <div key={v.id} className="px-4 py-3 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0 capitalize">
                    {v.courier.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-gray-800 capitalize">{v.courier} — w.e.f. {v.effectiveDate}</p>
                    {v.notes && <p className="text-xs text-gray-400">{v.notes}</p>}
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    <p>Logged by {v.uploadedBy?.name || 'Admin'}</p>
                    <p>{new Date(v.createdAt).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
