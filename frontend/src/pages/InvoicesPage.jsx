import { SkeletonTable } from '../components/ui/Skeleton';
import { useState } from 'react';
import { Plus, Eye, Trash2, Download, MessageCircle, FileText, Mail } from 'lucide-react';
import api from '../services/api';
import { useFetch } from '../hooks/useFetch';
import { PageLoader, EmptyState } from '../components/ui/Loading';
import { Modal } from '../components/ui/Modal';

const STATUS_COLORS = {
  DRAFT:     'badge-gray',
  SENT:      'badge-blue',
  PAID:      'badge-green',
  CANCELLED: 'badge-red',
};
const fmt = n => `₹${Number(n||0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
const today = () => new Date().toISOString().split('T')[0];
const firstOfMonth = () => { const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]; };
const COMPANY_GST = '06AJDPR0914N2Z1';

function getTaxBreakdown(inv, client) {
  const gstPercent = Number(inv?.gstPercent || 18);
  const gstAmount = Number(inv?.gstAmount || 0);
  const companyState = COMPANY_GST.slice(0, 2);
  const clientState = String(client?.gst || '').slice(0, 2);
  const intraState = clientState ? clientState === companyState : /haryana/i.test(String(client?.address || ''));

  if (intraState) {
    return {
      type: 'Intra-state',
      placeOfSupply: 'Haryana',
      lines: [
        { label: `CGST (${(gstPercent / 2).toFixed(1)}%)`, amount: gstAmount / 2 },
        { label: `SGST (${(gstPercent / 2).toFixed(1)}%)`, amount: gstAmount / 2 },
      ],
    };
  }

  return {
    type: 'Inter-state',
    placeOfSupply: client?.address || 'Outside Haryana',
    lines: [{ label: `IGST (${gstPercent}%)`, amount: gstAmount }],
  };
}

export default function InvoicesPage({ toast }) {
  const { data: invoices, loading, refetch } = useFetch('/invoices');
  const { data: clients }                     = useFetch('/clients');
  const [creating,    setCreating]    = useState(false);
  const [viewing,     setViewing]     = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [emailModal,  setEmailModal]  = useState(false);
  const [emailAddr,   setEmailAddr]   = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [createError, setCreateError] = useState('');
  const [form, setForm] = useState({ clientCode:'', fromDate: firstOfMonth(), toDate: today(), gstPercent:'18', notes:'' });
  const canGenerate = Boolean(form.clientCode && form.fromDate && form.toDate) && form.fromDate <= form.toDate;
  const selectedClient = (clients || []).find(c => c.code === form.clientCode);
  const gstPreviewBase = 1000;
  const gstPreviewAmount = gstPreviewBase * ((Number(form.gstPercent || 18)) / 100);
  const gstPreview = getTaxBreakdown({ gstPercent: Number(form.gstPercent || 18), gstAmount: gstPreviewAmount }, selectedClient);

  const set = (k,v) => setForm(f => ({...f, [k]:v}));

  const create = async () => {
    if (!form.clientCode || !form.fromDate || !form.toDate) {
      const msg = 'Client and date range are required';
      setCreateError(msg);
      toast?.(msg, 'error');
      return;
    }
    if (form.fromDate > form.toDate) {
      const msg = '"From Date" cannot be after "To Date".';
      setCreateError(msg);
      toast?.(msg, 'error');
      return;
    }

    setCreateError('');
    setSaving(true);
    try {
      const res = await api.post('/invoices', form);
      await refetch();
      setCreating(false);
      toast?.(`Invoice ${res.data.invoiceNo} created ✓`, 'success');
      loadView(res.data.id);
    } catch (err) {
      let msg = err.message || 'Failed to generate invoice';
      if (msg.toLowerCase().includes('no unbilled shipments')) {
        msg = 'No unbilled shipments were found for this client/date range. Try a wider date range or another client.';
      }
      setCreateError(msg);
      toast?.(msg, 'error');
    }
    finally { setSaving(false); }
  };

  const loadView = async (id) => {
    try {
      const res = await api.get(`/invoices/${id}`);
      setViewing(res.data);
    } catch (err) { toast?.(err.message, 'error'); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/invoices/${id}/status`, { status });
      await refetch();
      if (viewing?.id === id) setViewing(v => ({...v, status}));
      toast?.(`Marked as ${status}`, 'success');
    } catch (err) { toast?.(err.message, 'error'); }
  };

  const del = async (id) => {
    if (!confirm('Delete this invoice? Shipments will become billable again.')) return;
    try { await api.delete(`/invoices/${id}`); await refetch(); setViewing(null); toast?.('Deleted', 'success'); }
    catch (err) { toast?.(err.message, 'error'); }
  };

  // ── Download PDF ──────────────────────────────────────────────────────────
  const triggerBlobDownload = (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const downloadPdf = async (inv) => {
    try {
      const blob = await api.get(`/invoices/${inv.id}/pdf`, { responseType: 'blob' });
      triggerBlobDownload(blob, `invoice-${inv.invoiceNo}.pdf`);
    } catch (err) {
      toast?.(err.message || 'Failed to download invoice PDF', 'error');
    }
  };

  // ── Send email ────────────────────────────────────────────────────────────
  const openEmailModal = (inv) => {
    const client = clients?.find(c => c.code === inv.clientCode);
    setEmailAddr(client?.email || '');
    setEmailModal(true);
  };

  const sendEmail = async () => {
    if (!emailAddr) { toast?.('Enter an email address', 'error'); return; }
    setSendingEmail(true);
    try {
      await api.post(`/invoices/${viewing.id}/send-email`, { email: emailAddr });
      toast?.(`Invoice sent to ${emailAddr} ✓`, 'success');
      setEmailModal(false);
      await refetch();
      setViewing(v => ({...v, status: v.status === 'DRAFT' ? 'SENT' : v.status}));
    } catch (err) { toast?.(err.message, 'error'); }
    finally { setSendingEmail(false); }
  };

  // ── Export Excel ──────────────────────────────────────────────────────────
  const downloadExport = async (inv, format) => {
    try {
      const endpoint = format === 'csv' ? `/invoices/${inv.id}/export.csv` : `/invoices/${inv.id}/export.xls`;
      const blob = await api.get(endpoint, { responseType: 'blob' });
      triggerBlobDownload(blob, `invoice-${inv.invoiceNo}.${format === 'csv' ? 'csv' : 'xls'}`);
    } catch (err) {
      toast?.(err.message || `Failed to export ${format.toUpperCase()}`, 'error');
    }
  };

  // ── WhatsApp ──────────────────────────────────────────────────────────────
  const sendWhatsApp = (inv) => {
    const client = clients?.find(c => c.code === inv.clientCode);
    const msg = `*Invoice ${inv.invoiceNo}*\nClient: ${client?.company || inv.clientCode}\nPeriod: ${inv.fromDate} to ${inv.toDate}\nTotal: ${fmt(inv.total)}\nStatus: ${inv.status}\n\nPlease process payment at your earliest convenience.\n\nSea Hawk Courier & Cargo\n+91 99115 65523`;
    const phone = client?.whatsapp || client?.phone || '';
    const waPhone = phone ? phone.replace(/\D/g, '').replace(/^0/, '91') : '919911565523';
    window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="mx-auto max-w-7xl p-6">
      <PageHeader
        title="Invoices"
        subtitle="Generate, download and email invoices to clients"
        icon={Receipt}
        actions={
          <button onClick={() => { setCreateError(''); setCreating(true); }} className="flex items-center gap-2 bg-slate-900 dark:bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-orange-500/10 transition-transform active:scale-95 leading-none">
            <Plus className="w-4 h-4" /> Generate Invoice
          </button>
        }
      />

      {loading ? <div className="p-6"><SkeletonTable rows={8} cols={6} /></div> : !invoices?.length ? (
        <EmptyState icon="🧾" title="No invoices yet" description="Generate your first invoice for a client" />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="tbl">
            <thead>
              <tr>
                <th className="th">Invoice No</th>
                <th className="th">Client</th>
                <th className="th">Period</th>
                <th className="th text-right">Shipments</th>
                <th className="th text-right">Total</th>
                <th className="th">Status</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(invoices||[]).map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="font-mono font-bold text-navy-600">{inv.invoiceNo}</td>
                  <td>
                    <div className="font-semibold text-sm">{inv.client?.company || inv.clientCode}</div>
                    <div className="text-xs text-gray-400">{inv.clientCode}</div>
                  </td>
                  <td className="text-sm text-gray-600">{inv.fromDate}<br/><span className="text-xs text-gray-400">to {inv.toDate}</span></td>
                  <td className="text-right text-sm">{inv._count?.items || 0}</td>
                  <td className="text-right font-bold">{fmt(inv.total)}</td>
                  <td>
                    <select
                      value={inv.status}
                      onChange={e => updateStatus(inv.id, e.target.value)}
                      className={`badge cursor-pointer border-0 ${STATUS_COLORS[inv.status]}`}
                      style={{ appearance: 'none', background: 'none', fontWeight: 700 }}
                    >
                      {['DRAFT','SENT','PAID','CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => loadView(inv.id)} title="View" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => downloadPdf(inv)} title="Download PDF" className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg">
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => sendWhatsApp(inv)} title="Send WhatsApp" className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg">
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Generate Invoice Modal ── */}
      <Modal open={creating} onClose={() => { if (!saving) { setCreateError(''); setCreating(false); } }} title="Generate Invoice"
        footer={<>
          <button onClick={() => { setCreateError(''); setCreating(false); }} disabled={saving} className="btn-secondary">Cancel</button>
          <button onClick={create} disabled={saving || !canGenerate} className="btn-primary">{saving ? 'Generating…' : 'Generate Invoice'}</button>
        </>}
      >
        <div className="space-y-3">
          <p className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-lg p-3">
            This will create an invoice from all <strong>unbilled shipments</strong> for the selected client and date range.
          </p>
          <div>
            <label className="label">Client *</label>
            <select className="input" value={form.clientCode} onChange={e => set('clientCode', e.target.value)}>
              <option value="">— Select Client —</option>
              {(clients||[]).map(c => <option key={c.code} value={c.code}>{c.code} — {c.company}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">From Date *</label>
              <input type="date" className="input" value={form.fromDate} onChange={e => set('fromDate', e.target.value)} />
            </div>
            <div>
              <label className="label">To Date *</label>
              <input type="date" className="input" value={form.toDate} onChange={e => set('toDate', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">GST %</label>
            <input type="number" className="input" value={form.gstPercent} onChange={e => set('gstPercent', e.target.value)} />
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="text-xs text-gray-400 uppercase font-bold">GST Invoice Preview</div>
                <div className="text-sm font-semibold text-gray-900 mt-1">{gstPreview.type} supply</div>
                <div className="text-xs text-gray-500 mt-1">Place of supply: {gstPreview.placeOfSupply}</div>
              </div>
              <div className="text-xs text-gray-500">Previewing split on sample taxable value {fmt(gstPreviewBase)}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              {gstPreview.lines.map((line) => (
                <div key={line.label} className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                  <div className="text-xs text-gray-400">{line.label}</div>
                  <div className="font-semibold text-gray-900 mt-1">{fmt(line.amount)}</div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Notes (optional)</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="e.g. Payment due within 30 days" />
          </div>
          {!!createError && (
            <div className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg p-3">
              {createError}
            </div>
          )}
        </div>
      </Modal>

      {/* ── Send Email Modal ── */}
      <Modal open={emailModal} onClose={() => setEmailModal(false)} title="Send Invoice by Email"
        footer={<>
          <button onClick={() => setEmailModal(false)} className="btn-secondary">Cancel</button>
          <button onClick={sendEmail} disabled={sendingEmail} className="btn-primary gap-1.5">
            <Mail className="w-3.5 h-3.5" />
            {sendingEmail ? 'Sending…' : 'Send Email'}
          </button>
        </>}
      >
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            The invoice PDF will be attached and sent to the email address below.
          </p>
          <div>
            <label className="label">Recipient Email *</label>
            <input type="email" className="input" value={emailAddr} onChange={e => setEmailAddr(e.target.value)} placeholder="client@company.com" />
            <p className="text-[10px] text-gray-400 mt-0.5">
              Auto-filled from client profile. You can change it.
            </p>
          </div>
        </div>
      </Modal>

      {/* ── View Invoice Modal ── */}
      {viewing && (
        (() => {
          const tax = getTaxBreakdown(viewing, viewing.client);
          return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src="/images/logo.png" 
                    alt="Sea Hawk Logo" 
                    style={{ height: 32, width: 'auto', objectFit: 'contain' }} 
                  />
                  <div>
                    <h2 className="font-bold text-gray-900">Sea Hawk Courier & Cargo</h2>
                    <p className="text-xs text-gray-500">Tax Invoice</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-navy-600 font-mono">{viewing.invoiceNo}</p>
                  <p className="text-xs text-gray-500 mt-1">Date: {new Date().toLocaleDateString('en-IN')}</p>
                  <span className={`badge text-xs mt-1 ${STATUS_COLORS[viewing.status]}`}>{viewing.status}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Bill To</p>
                  <p className="font-bold text-sm">{viewing.client?.company}</p>
                  <p className="text-xs text-gray-600">{viewing.client?.address}</p>
                  {viewing.client?.gst && <p className="text-xs text-gray-500 font-mono">GST: {viewing.client.gst}</p>}
                  <p className="text-xs text-gray-500 mt-1">Tax Type: {tax.type}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Period</p>
                  <p className="text-sm font-medium">{viewing.fromDate} to {viewing.toDate}</p>
                  <p className="text-xs text-gray-500 mt-1">Place of supply: {tax.placeOfSupply}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="table-wrap mb-4">
                <table className="tbl text-xs">
                  <thead>
                    <tr>
                      <th>#</th><th>Date</th><th>AWB No</th><th>Consignee</th>
                      <th>Destination</th><th>Courier</th>
                      <th className="text-right">Wt(kg)</th><th className="text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(viewing.items||[]).map((item, i) => (
                      <tr key={item.id}>
                        <td className="text-gray-400">{i+1}</td>
                        <td>{item.date}</td>
                        <td className="font-mono font-bold">{item.awb}</td>
                        <td className="max-w-[120px] truncate">{item.consignee}</td>
                        <td>{item.destination}</td>
                        <td>{item.courier}</td>
                        <td className="text-right">{item.weight}</td>
                        <td className="text-right font-medium">{fmt(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5">
                  <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{fmt(viewing.subtotal)}</span></div>
                  {tax.lines.map((line) => (
                    <div key={line.label} className="flex justify-between text-sm text-gray-600"><span>{line.label}</span><span>{fmt(line.amount)}</span></div>
                  ))}
                  <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between text-sm font-bold text-gray-900">
                    <span>Total</span><span>{fmt(viewing.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex-wrap gap-2">
              <button onClick={() => setViewing(null)} className="btn-secondary btn-sm">Close</button>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => sendWhatsApp(viewing)} className="btn-success btn-sm gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </button>
                <button onClick={() => { openEmailModal(viewing); }} className="btn-secondary btn-sm gap-1.5">
                  <Mail className="w-3.5 h-3.5" /> Email PDF
                </button>
                <button onClick={() => downloadPdf(viewing)} className="btn-secondary btn-sm gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Download PDF
                </button>
                <button onClick={() => downloadExport(viewing, 'xls')} className="btn-secondary btn-sm gap-1.5">
                  <Download className="w-3.5 h-3.5" /> Excel
                </button>
                <button onClick={() => downloadExport(viewing, 'csv')} className="btn-secondary btn-sm gap-1.5">
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
                <button onClick={() => del(viewing.id)} className="btn-danger btn-sm gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
          );
        })()
      )}
    </div>
  );
}
