// ClientsPage.jsx — Enhanced with pin/star feature for dashboard
import { useState } from 'react';
import { Plus, Edit2, Star, Search, Phone, Mail } from 'lucide-react';
import api from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { PageLoader, EmptyState } from '../components/ui/Loading';
import { Modal } from '../components/ui/Modal';

// ── Pinned Clients (synced with DashboardPage) ────────────────────────────
function usePinnedClients() {
  const [pinned, setPinned] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pinnedClients') || '[]'); } catch { return []; }
  });
  const toggle = (code) => {
    const next = pinned.includes(code) ? pinned.filter(c => c !== code) : [...pinned, code].slice(0, 6);
    setPinned(next);
    localStorage.setItem('pinnedClients', JSON.stringify(next));
  };
  return { pinned, toggle };
}

const empty = { code:'', company:'', contact:'', phone:'', whatsapp:'', email:'', gst:'', address:'', notes:'' };

export default function ClientsPage({ toast }) {
  const { data: clients, loading, refetch } = useFetch('/clients');
  const { pinned, toggle: togglePin } = usePinnedClients();
  const [editClient, setEdit]   = useState(null);
  const [saving,     setSaving] = useState(false);
  const [search,     setSearch] = useState('');
  const [form, setForm] = useState(empty);

  const open = (c = null) => { setEdit(c || {}); setForm(c ? {...c} : empty); };
  const set  = (k, v) => setForm(f => ({...f, [k]: v}));

  const save = async () => {
    if (!form.code || !form.company) { toast?.('Code and company are required', 'error'); return; }
    setSaving(true);
    try {
      if (editClient?.id) {
        await api.put(`/clients/${editClient.code}`, form);
      } else {
        await api.post('/clients', { ...form, code: form.code.toUpperCase() });
      }
      await refetch();
      setEdit(null);
      toast?.(editClient?.id ? 'Client updated ✓' : 'Client added ✓', 'success');
    } catch (err) { toast?.(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const filtered = (clients || []).filter(c =>
    !search ||
    c.code?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase()) ||
    c.contact?.toLowerCase().includes(search.toLowerCase())
  );

  // Sort: pinned first
  const sorted = [
    ...filtered.filter(c => pinned.includes(c.code)),
    ...filtered.filter(c => !pinned.includes(c.code)),
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {(clients||[]).length} clients · ⭐ Star up to 6 to pin on dashboard
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
            <input className="input pl-8 w-48" placeholder="Search clients…"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <button onClick={() => open()} className="btn-primary btn-sm gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add Client
          </button>
        </div>
      </div>

      {loading ? <PageLoader /> : sorted.length === 0 ? (
        <EmptyState icon="👤" title="No clients yet" description="Add your first client to get started" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sorted.map(c => {
            const isPinned = pinned.includes(c.code);
            return (
              <div key={c.code}
                className={`bg-white rounded-2xl border shadow-sm p-4 flex flex-col gap-3 transition-all ${isPinned ? 'border-amber-300 ring-1 ring-amber-200' : 'border-gray-100 hover:border-gray-200'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg text-white flex-shrink-0"
                      style={{ background: '#1a2b5e' }}>
                      {c.code[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-gray-900 truncate">{c.company}</p>
                      <p className="text-xs text-gray-400 font-mono">{c.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => togglePin(c.code)}
                      title={isPinned ? 'Unpin from dashboard' : 'Pin to dashboard'}
                      className="p-1.5 rounded-lg hover:bg-amber-50 transition-colors">
                      <Star className={`w-4 h-4 ${isPinned ? 'text-amber-400 fill-amber-400' : 'text-gray-300 hover:text-amber-300'}`} />
                    </button>
                    <button onClick={() => open(c)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1 text-xs text-gray-600">
                  {c.contact && <div className="flex items-center gap-1.5"><span className="text-gray-400">👤</span>{c.contact}</div>}
                  {c.phone   && <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-gray-400" /><a href={`tel:${c.phone}`} className="hover:text-blue-600">{c.phone}</a></div>}
                  {c.email   && <div className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-gray-400" /><a href={`mailto:${c.email}`} className="hover:text-blue-600 truncate">{c.email}</a></div>}
                  {c.gst     && <div className="flex items-center gap-1.5"><span className="text-gray-400">🏢</span><span className="font-mono">{c.gst}</span></div>}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                  <div>
                    <span className={`badge text-[10px] ${c.active ? 'badge-green' : 'badge-red'}`}>{c.active ? 'Active' : 'Inactive'}</span>
                    {isPinned && <span className="badge badge-yellow text-[10px] ml-1">⭐ Pinned</span>}
                  </div>
                  <div className="text-xs font-bold text-navy-600">
                    Bal: ₹{Number(c.walletBalance || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={!!editClient} onClose={() => setEdit(null)}
        title={editClient?.id ? `Edit — ${editClient.company}` : 'Add Client'}
        footer={<>
          <button onClick={() => setEdit(null)} className="btn-secondary">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save'}</button>
        </>}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Client Code * <span className="text-gray-400">(max 20 chars)</span></label>
              <input className="input uppercase" placeholder="e.g. OMNICOM" value={form.code}
                onChange={e => set('code', e.target.value.toUpperCase())}
                disabled={!!editClient?.id} maxLength={20} />
            </div>
            <div>
              <label className="label">Company Name *</label>
              <input className="input" placeholder="Company Pvt Ltd" value={form.company}
                onChange={e => set('company', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Contact Person</label>
              <input className="input" placeholder="Rahul Sharma" value={form.contact}
                onChange={e => set('contact', e.target.value)} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" placeholder="+91 98765 43210" value={form.phone}
                onChange={e => set('phone', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">WhatsApp</label>
              <input className="input" placeholder="+91 98765 43210" value={form.whatsapp}
                onChange={e => set('whatsapp', e.target.value)} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="billing@company.com" value={form.email}
                onChange={e => set('email', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">GST Number</label>
            <input className="input uppercase font-mono" placeholder="22ABCDE1234F1Z5" value={form.gst}
              onChange={e => set('gst', e.target.value.toUpperCase())} />
          </div>
          <div>
            <label className="label">Address</label>
            <textarea className="input" rows={2} placeholder="Full billing address" value={form.address}
              onChange={e => set('address', e.target.value)} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} placeholder="Any internal notes" value={form.notes}
              onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
