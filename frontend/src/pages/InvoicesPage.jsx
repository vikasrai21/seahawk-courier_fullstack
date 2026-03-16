import { useState } from 'react';
import { Plus, Eye, Trash2, Download, MessageCircle, FileText, CheckCircle, Send, XCircle } from 'lucide-react';
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
  const [creating, setCreating] = useState(false);
  const [viewing,  setViewing]  = useState(null);   // full invoice object
  const [saving,   setSaving]   = useState(false);
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

  const exportExcel = (inv) => {
    const client = clients?.find(c => c.code === inv.clientCode);
    const rows = (inv.items || []).map((item, i) => ({
      'Sr.': i + 1,
      'Date': item.date,
      'AWB No': item.awb,
      'Consignee': item.consignee,
      'Destination': item.destination,
      'Courier': item.courier,
      'Weight (kg)': item.weight,
      'Amount (₹)': item.amount,
    }));

    const wb = XLSX.utils.book_new();

    // Header sheet info
    const headerRows = [
      ['SEAHAWK COURIER & CARGO'],
      ['Invoice No:', inv.invoiceNo],
      ['Client:', `${inv.clientCode} — ${client?.company || ''}`],
      ['GST No:', client?.gst || ''],
      ['Period:', `${inv.fromDate} to ${inv.toDate}`],
      ['Date:', new Date().toLocaleDateString('en-IN')],
      [],
    ];
    const ws = XLSX.utils.aoa_to_sheet(headerRows);

    // Append item rows
    XLSX.utils.sheet_add_json(ws, rows, { origin: { r: headerRows.length, c: 0 } });

    // Summary rows
    const summaryRows = [
      [],
      ['', '', '', '', '', '', 'Subtotal:', inv.subtotal],
      ['', '', '', '', '', '', `GST (${inv.gstPercent}%):`, inv.gstAmount],
      ['', '', '', '', '', '', 'TOTAL:', inv.total],
    ];
    const startRow = headerRows.length + rows.length + 1;
    XLSX.utils.sheet_add_aoa(ws, summaryRows, { origin: { r: startRow, c: 0 } });

    ws['!cols'] = [{ wch: 5 }, { wch: 12 }, { wch: 16 }, { wch: 25 }, { wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 12 }];

    XLSX.utils.book_append_sheet(wb, ws, 'Invoice');
    XLSX.writeFile(wb, `${inv.invoiceNo}-${inv.clientCode}.xlsx`);
    toast?.('Excel downloaded', 'success');
  };

  const printInvoice = () => window.print();

  const sendWhatsApp = (inv) => {
    const client = clients?.find(c => c.code === inv.clientCode);
    const num = (client?.whatsapp || client?.phone || '').replace(/\D/g,'');
    if (!num) { toast?.('No WhatsApp number for this client', 'error'); return; }
    const msg = [
      `🦅 *Seahawk Courier & Cargo*`,
      `📄 *Invoice: ${inv.invoiceNo}*`,
      `👤 Client: ${client?.company || inv.clientCode}`,
      `📅 Period: ${inv.fromDate} to ${inv.toDate}`,
      ``,
      `📦 Shipments: *${inv.items?.length || inv._count?.items || 0}*`,
      `💰 Subtotal: *${fmt(inv.subtotal)}*`,
      `🏷️ GST (${inv.gstPercent}%): *${fmt(inv.gstAmount)}*`,
      `✅ *Total Due: ${fmt(inv.total)}*`,
      ``,
      `Please confirm receipt. Thank you! 🙏`,
    ].join('\n');
    window.open(`https://wa.me/${num.startsWith('91')?num:'91'+num}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-xs text-gray-500 mt-0.5">Generate client-wise billing from shipment data</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Generate Invoice
        </button>
      </div>

      {loading ? <PageLoader /> : !(invoices||[]).length ? (
        <EmptyState icon="🧾" title="No invoices yet"
          action={<button onClick={() => setCreating(true)} className="btn-primary btn-sm">Generate first invoice</button>} />
      ) : (
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr><th>Invoice No</th><th>Client</th><th>Period</th><th>Shipments</th><th>Subtotal</th><th>GST</th><th>Total</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {(invoices||[]).map(inv => {
                const client = clients?.find(c => c.code === inv.clientCode);
                return (
                  <tr key={inv.id}>
                    <td className="font-mono font-bold text-navy-600">{inv.invoiceNo}</td>
                    <td>
                      <p className="font-semibold text-xs">{inv.clientCode}</p>
                      <p className="text-[10px] text-gray-400">{inv._count?.items} shipments</p>
                    </td>
                    <td className="text-xs text-gray-500">{inv.fromDate} → {inv.toDate}</td>
                    <td className="text-xs text-center font-semibold">{inv._count?.items || 0}</td>
                    <td className="text-xs font-medium text-right">{fmt(inv.subtotal)}</td>
                    <td className="text-xs text-right text-gray-500">{fmt(inv.gstAmount)}</td>
                    <td className="font-bold text-right text-green-700">{fmt(inv.total)}</td>
                    <td>
                      <select value={inv.status}
                        onChange={e => updateStatus(inv.id, e.target.value)}
                        className={`text-[10px] font-bold px-2 py-1 rounded border-0 outline-none cursor-pointer ${
                          inv.status === 'PAID' ? 'bg-green-100 text-green-700' :
                          inv.status === 'SENT' ? 'bg-blue-100 text-blue-700' :
                          inv.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                        {['DRAFT','SENT','PAID','CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => loadView(inv.id)} title="View" className="p-1.5 text-navy-600 hover:bg-navy-50 rounded-lg">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => sendWhatsApp(inv)} title="WhatsApp" className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg">
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => del(inv.id)} title="Delete" className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create invoice modal */}
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

      {/* View invoice modal */}
      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
            {/* Invoice header */}
            <div className="p-6 border-b border-gray-100 print:block">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-2xl">🦅</span>
                    <div>
                      <h2 className="font-bold text-gray-900">Seahawk Courier & Cargo</h2>
                      <p className="text-xs text-gray-500">Tax Invoice</p>
                    </div>
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

            {/* Items table */}
            <div className="p-6">
              <div className="table-wrap mb-4">
                <table className="tbl text-xs">
                  <thead>
                    <tr><th>#</th><th>Date</th><th>AWB No</th><th>Consignee</th><th>Destination</th><th>Courier</th><th className="text-right">Wt(kg)</th><th className="text-right">Amount</th></tr>
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

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5">
                  <TotalRow label="Subtotal" value={fmt(viewing.subtotal)} />
                  <TotalRow label={`GST (${viewing.gstPercent}%)`} value={fmt(viewing.gstAmount)} />
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <TotalRow label="Total" value={fmt(viewing.total)} bold />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl print:hidden">
              <button onClick={() => setViewing(null)} className="btn-secondary btn-sm">Close</button>
              <div className="flex gap-2">
                <button onClick={() => sendWhatsApp(viewing)} className="btn-success btn-sm gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </button>
                <button onClick={() => exportExcel(viewing)} className="btn-secondary btn-sm gap-1.5">
                  <Download className="w-3.5 h-3.5" /> Excel
                </button>
                <button onClick={printInvoice} className="btn-secondary btn-sm gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Print / PDF
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

function TotalRow({ label, value, bold }) {
  return (
    <div className={`flex justify-between text-sm ${bold ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
