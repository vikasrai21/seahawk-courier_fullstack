import { useState } from 'react';
import { Plus, Edit2, Trash2, MessageCircle, Phone, Mail, MapPin, Package, Building2, Search } from 'lucide-react';
import api from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { PageLoader, EmptyState } from '../components/ui/Loading';
import { Modal } from '../components/ui/Modal';

export default function ClientsPage({ toast }) {
  const { data: rawClients, loading, refetch } = useFetch('/clients');
  const [editClient, setEdit] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [search, setSearch]   = useState('');
  const empty = { code:'', company:'', contact:'', phone:'', whatsapp:'', email:'', gst:'', address:'', notes:'' };
  const [form, setForm] = useState(empty);

  const clients = (rawClients || []).filter(c =>
    !search || c.company?.toLowerCase().includes(search.toLowerCase()) ||
    c.code?.toLowerCase().includes(search.toLowerCase()) ||
    c.contact?.toLowerCase().includes(search.toLowerCase())
  );

  const open = (c = null) => { setEdit(c || {}); setForm(c ? {...c} : empty); };

  const save = async () => {
    if (!form.code || !form.company) return toast?.('Code and Company are required', 'error');
    setSaving(true);
    try {
      await api.post('/clients', form);
      await refetch();
      setEdit(null);
      toast?.('Client saved ✓', 'success');
    } catch (err) { toast?.(err.message, 'error'); }
    finally { setSaving(false); }
  };

  const del = async (code) => {
    if (!confirm(`Delete client ${code}? This cannot be undone.`)) return;
    try {
      await api.delete(`/clients/${code}`);
      await refetch();
      toast?.('Client deleted', 'success');
    } catch (err) { toast?.(err.message, 'error'); }
  };

  const sendWhatsApp = (client, msg) => {
    const num = (client.whatsapp || client.phone || '').replace(/\D/g, '');
    if (!num) return toast?.('No WhatsApp number saved for this client', 'error');
    const text = encodeURIComponent(msg);
    window.open(`https://wa.me/${num.startsWith('91') ? num : '91' + num}?text=${text}`, '_blank');
  };

  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-xs text-gray-500 mt-0.5">{(rawClients||[]).length} clients registered</p>
        </div>
        <button onClick={() => open()} className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="input pl-9 max-w-sm" placeholder="Search by name, code, contact…"
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? <PageLoader /> : !clients?.length ? (
        <EmptyState icon="🏢" title={search ? 'No clients match your search' : 'No clients yet'}
          action={!search && <button onClick={() => open()} className="btn-primary btn-sm">Add first client</button>} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map(c => (
            <ClientCard key={c.id} client={c} onEdit={() => open(c)} onDelete={() => del(c.code)} onWhatsApp={sendWhatsApp} />
          ))}
        </div>
      )}

      {/* Edit / Add Modal */}
      <Modal open={!!editClient} onClose={() => setEdit(null)}
        title={editClient?.id ? `Edit — ${editClient.code}` : 'Add New Client'}
        footer={<>
          <button onClick={() => setEdit(null)} className="btn-secondary">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save Client'}</button>
        </>}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Code *</label>
              <input className="input font-mono uppercase" placeholder="ABC" value={form.code}
                onChange={e => set('code', e.target.value)} disabled={!!editClient?.id} />
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
              <input className="input" placeholder="Full name" value={form.contact}
                onChange={e => set('contact', e.target.value)} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" placeholder="98765 43210" value={form.phone}
                onChange={e => set('phone', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">WhatsApp Number</label>
              <input className="input" placeholder="91XXXXXXXXXX or 98765 43210" value={form.whatsapp}
                onChange={e => set('whatsapp', e.target.value)} />
              <p className="text-[10px] text-gray-400 mt-0.5">Used for sending reports directly</p>
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="billing@company.com" value={form.email}
                onChange={e => set('email', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">GST Number</label>
              <input className="input font-mono uppercase" placeholder="22AAAAA0000A1Z5" value={form.gst}
                onChange={e => set('gst', e.target.value)} />
            </div>
            <div>
              <label className="label">Address</label>
              <input className="input" placeholder="City, State" value={form.address}
                onChange={e => set('address', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} placeholder="Any notes about this client…"
              value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  );
}

function ClientCard({ client: c, onEdit, onDelete, onWhatsApp }) {
  const initials = (c.company || c.code).split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  const colors = ['bg-navy-600','bg-blue-600','bg-purple-600','bg-emerald-600','bg-amber-600','bg-rose-600'];
  const color  = colors[c.code.charCodeAt(0) % colors.length];

  const shareText = `Hi ${c.contact || c.company},\n\nHere is your shipment summary from *Seahawk Courier & Cargo*.\n\nPlease contact us for any queries.\n\nThank you! 🦅`;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all group overflow-hidden">
      {/* Card header */}
      <div className="p-4 flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 font-mono tracking-widest">{c.code}</span>
            {!c.active && <span className="badge badge-red text-[9px]">INACTIVE</span>}
          </div>
          <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">{c.company}</h3>
          {c.contact && <p className="text-xs text-gray-500 truncate mt-0.5">{c.contact}</p>}
        </div>
      </div>

      {/* Details */}
      <div className="px-4 pb-3 space-y-1.5">
        {c.phone && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Phone className="w-3 h-3 text-gray-400 shrink-0" />
            <span>{c.phone}</span>
          </div>
        )}
        {(c.whatsapp || c.phone) && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <MessageCircle className="w-3 h-3 text-green-500 shrink-0" />
            <span className="text-green-700">{c.whatsapp || c.phone}</span>
            <span className="text-[9px] text-gray-400">(WhatsApp)</span>
          </div>
        )}
        {c.email && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Mail className="w-3 h-3 text-gray-400 shrink-0" />
            <span className="truncate">{c.email}</span>
          </div>
        )}
        {c.gst && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Building2 className="w-3 h-3 text-gray-400 shrink-0" />
            <span className="font-mono text-[10px]">{c.gst}</span>
          </div>
        )}
        {c.address && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
            <span className="truncate">{c.address}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-gray-50 p-3 flex gap-2">
        <button onClick={() => onWhatsApp(c, shareText)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold transition-colors">
          <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
        </button>
        <button onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors">
          <Edit2 className="w-3.5 h-3.5" /> Edit
        </button>
        <button onClick={onDelete}
          className="w-8 flex items-center justify-center py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
