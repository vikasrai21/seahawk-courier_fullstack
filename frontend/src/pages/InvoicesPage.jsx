import { useState } from 'react';
import { Plus, Eye, Trash2, Download, MessageCircle, FileText, Send, Mail } from 'lucide-react';
import * as XLSX from 'xlsx';
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

export default function InvoicesPage({ toast }) {
  const { data: invoices, loading, refetch } = useFetch('/invoices');
  const { data: clients }                     = useFetch('/clients');
  const [creating,    setCreating]    = useState(false);
  const [viewing,     setViewing]     = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [emailModal,  setEmailModal]  = useState(false);
  const [emailAddr,   setEmailAddr]   = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [form, setForm] = useState({ clientCode:'', fromDate: firstOfMonth(), toDate: today(), gstPercent:'18', notes:'' });

  const set = (k,v) => setForm(f => ({...f, [k]:v}));

  const create = async () => {
    if (!form.clientCode || !form.fromDate || !form.toDate) {
      toast?.('Client and date range are required', 'error'); return;
    }
    setSaving(true);
    try {
      const res = await api.post('/invoices', form);
      await refetch();
      setCreating(false);
      toast?.(`Invoice ${res.data.invoiceNo} created ✓`, 'success');
      loadView(res.data.id);
    } catch (err) { toast?.(err.message, 'error'); }
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
  const downloadPdf = (inv) => {
    // Open in new tab — browser handles download via Content-Disposition header
    window.open(`/api/invoices/${inv.id}/pdf`, '_blank');
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
  const exportExcel = (inv) => {
    const rows = (inv.items || []).map((item, i) => ({
      'Sr.': i + 1, 'Date': item.date, 'AWB No': item.awb,
      'Consignee': item.consignee, 'Destination': item.destination,
      'Courier': item.courier, 'Weight (kg)': item.weight, 'Amount (₹)': item.amount,
    }));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Invoice');
    // Summary sheet
    const summary = [
      ['Invoice No', inv.invoiceNo],
      ['Client', inv.clientCode],
      ['Period', `${inv.fromDate} to ${inv.toDate}`],
      ['Subtotal', inv.subtotal],
      [`GST (${inv.gstPercent}%)`, inv.gstAmount],
      ['Total', inv.total],
      ['Status', inv.status],
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(summary);
    XLSX.utils.book_append_sheet(wb, ws2, 'Summary');
    XLSX.writeFile(wb, `invoice-${inv.invoiceNo}.xlsx`);
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
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-xs text-gray-500 mt-0.5">Generate, download and email invoices to clients</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary btn-sm gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Generate Invoice
        </button>
      </div>

      {loading ? <PageLoader /> : !invoices?.length ? (
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
      <Modal open={creating} onClose={() => setCreating(false)} title="Generate Invoice"
        footer={<>
          <button onClick={() => setCreating(false)} className="btn-secondary">Cancel</button>
          <button onClick={create} disabled={saving} className="btn-primary">{saving ? 'Generating…' : 'Generate Invoice'}</button>
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
          <div>
            <label className="label">Notes (optional)</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="e.g. Payment due within 30 days" />
          </div>
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
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🦅</span>
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
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Period</p>
                  <p className="text-sm font-medium">{viewing.fromDate} to {viewing.toDate}</p>
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
                  <div className="flex justify-between text-sm text-gray-600"><span>GST ({viewing.gstPercent}%)</span><span>{fmt(viewing.gstAmount)}</span></div>
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
                <button onClick={() => exportExcel(viewing)} className="btn-secondary btn-sm gap-1.5">
                  <Download className="w-3.5 h-3.5" /> Excel
                </button>
                <button onClick={() => del(viewing.id)} className="btn-danger btn-sm gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
