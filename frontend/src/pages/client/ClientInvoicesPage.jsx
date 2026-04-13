import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, FileText, Download, Receipt, X } from 'lucide-react';
import api from '../../services/api';
import { PageLoader } from '../../components/ui/Loading';
import { EmptyState } from '../../components/ui/EmptyState';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const STATUS_COLORS = { DRAFT: 'bg-gray-100 text-gray-700', SENT: 'bg-blue-100 text-blue-700', PAID: 'bg-green-100 text-green-700', OVERDUE: 'bg-red-100 text-red-700' };

function InvoiceStat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm">
      <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-400">{label}</div>
      <div className="mt-2 text-3xl font-black text-slate-900">{value}</div>
      <div className="mt-1 text-xs leading-5 text-slate-500">{hint}</div>
    </div>
  );
}

function getTaxBreakdown(inv, client) {
  const gstPercent = Number(inv?.gstPercent || 18);
  const gstAmount = Number(inv?.gstAmount || 0);
  const companyState = '06'; // Haryana
  const clientState = String(client?.gst || '').slice(0, 2);
  const intraState = clientState ? clientState === companyState : /haryana/i.test(String(client?.address || ''));

  if (intraState) {
    return {
      type: 'Intra-state',
      lines: [
        { label: `CGST (${(gstPercent / 2).toFixed(1)}%)`, amount: gstAmount / 2 },
        { label: `SGST (${(gstPercent / 2).toFixed(1)}%)`, amount: gstAmount / 2 },
      ],
    };
  }
  return {
    type: 'Inter-state',
    lines: [{ label: `IGST (${gstPercent}%)`, amount: gstAmount }],
  };
}

export default function ClientInvoicesPage({ toast }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [ledgerMonth, setLedgerMonth] = useState(new Date().toISOString().slice(0, 7));
  const [ledgerFormat, setLedgerFormat] = useState('csv');

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

  useEffect(() => {
    api.get('/portal/invoices')
      .then((r) => setInvoices(r.data?.invoices || r.data || []))
      .catch((e) => toast?.(e.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  const downloadInvoice = async (invoice) => {
    setDownloadingId(invoice.id);
    try {
      const blob = await api.get(`/portal/invoices/${invoice.id}/pdf`, { responseType: 'blob' });
      triggerBlobDownload(blob, `invoice-${invoice.invoiceNo}.pdf`);
    } catch (e) {
      toast?.(e.message || 'Failed to download invoice PDF', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  const downloadExport = async (invoice, format) => {
    setDownloadingId(invoice.id);
    try {
      const endpoint = format === 'csv'
        ? `/portal/invoices/${invoice.id}/export.csv`
        : `/portal/invoices/${invoice.id}/export.xls`;
      const blob = await api.get(endpoint, { responseType: 'blob' });
      triggerBlobDownload(blob, `invoice-${invoice.invoiceNo}.${format === 'csv' ? 'csv' : 'xls'}`);
    } catch (e) {
      toast?.(e.message || `Failed to export ${format.toUpperCase()}`, 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  const downloadMonthlyLedger = async () => {
    if (!ledgerMonth) {
      toast?.('Select a month first', 'error');
      return;
    }
    try {
      const endpoint = `/portal/invoices/monthly-export?month=${encodeURIComponent(ledgerMonth)}&format=${encodeURIComponent(ledgerFormat)}`;
      const blob = await api.get(endpoint, { responseType: 'blob' });
      triggerBlobDownload(blob, `invoice-ledger-${ledgerMonth}.${ledgerFormat === 'csv' ? 'csv' : 'xls'}`);
      toast?.('Monthly ledger downloaded', 'success');
    } catch (e) {
      toast?.(e.message || 'Failed to export monthly ledger', 'error');
    }
  };

  if (loading) return <PageLoader />;

  const totalValue = invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
  const paidCount = invoices.filter((inv) => inv.status === 'PAID').length;
  const openCount = invoices.length - paidCount;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7faff_0%,#eef4fd_100%)]">
      <header className="border-b border-slate-200/70 bg-white/90 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/portal" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:text-slate-700">← Portal</Link>
            <div>
              <div className="text-sm font-black text-slate-900">Invoices & Exports</div>
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-orange-500">Client Billing Desk</div>
            </div>
          </div>
          <Link to="/portal/wallet" className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.08em] text-sky-700">
            Open Wallet
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl p-6 space-y-6">
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_320px]">
          <div className="overflow-hidden rounded-[28px] border border-slate-200/60 bg-[linear-gradient(145deg,#fffaf5_0%,#ffffff_70%)] p-6 shadow-[0_22px_44px_-30px_rgba(194,65,12,0.35)]">
            <div className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-orange-600">
              Finance Snapshot
            </div>
            <h1 className="mt-4 max-w-2xl text-3xl font-black leading-tight text-slate-900">Download invoices faster and keep tax-ready exports in one clean workspace.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
              Pull PDFs for records, export line items for finance teams, and keep visibility on paid versus open billing.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <InvoiceStat label="Invoices" value={invoices.length} hint="Total documents available" />
              <InvoiceStat label="Paid" value={paidCount} hint="Settled invoices in this account" />
              <InvoiceStat label="Open" value={openCount} hint="Draft, sent, or overdue documents" />
            </div>
          </div>

          <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.36)]">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-sky-600">Total Billed</div>
            <div className="mt-2 text-4xl font-black text-slate-900">{fmt(totalValue)}</div>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Use PDF for formal records, Excel for finance reconciliation, and CSV for accounting imports.
            </p>
            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Recommended Flow</div>
                <div className="mt-2 text-sm font-semibold text-slate-800">PDF for archive, Excel for team review, CSV for system ingestion.</div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-emerald-600">GST Ledger Export Center</div>
              <div className="mt-1 text-sm text-slate-600">Download a month-wise invoice ledger for your finance and CA workflows.</div>
            </div>
            <div className="flex items-center gap-2">
              <input type="month" className="input" value={ledgerMonth} onChange={(e) => setLedgerMonth(e.target.value)} />
              <select className="input" value={ledgerFormat} onChange={(e) => setLedgerFormat(e.target.value)}>
                <option value="csv">CSV</option>
                <option value="xls">Excel (XLS)</option>
              </select>
              <button className="btn-secondary" onClick={downloadMonthlyLedger}>Download</button>
            </div>
          </div>
        </section>

        {invoices.length === 0 ? (
          <div className="rounded-[26px] border border-slate-200 bg-white p-8 shadow-sm">
            <EmptyState icon="🧾" title="No invoices yet" message="Invoices will appear here once generated by Sea Hawk." />
          </div>
        ) : (
          <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_18px_42px_-32px_rgba(15,23,42,0.38)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div>
                <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-orange-500">Invoices</div>
                <h2 className="mt-1 text-lg font-black text-slate-900">Billing history</h2>
                <p className="mt-1 text-sm text-slate-500">Every invoice with period, status, and one-click export actions.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead className="border-b bg-slate-50">
                  <tr>
                    {['Invoice No', 'Period', 'Total', 'Status', 'Downloads'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((inv, index) => (
                    <tr key={inv.id} className={index % 2 ? 'bg-slate-50/40' : 'bg-white'}>
                      <td className="px-4 py-4 font-mono text-xs font-bold text-slate-800">{inv.invoiceNo}</td>
                      <td className="px-4 py-4 text-slate-600">{inv.fromDate} → {inv.toDate}</td>
                      <td className="px-4 py-4 text-sm font-black text-slate-900">{fmt(inv.total)}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${STATUS_COLORS[inv.status] || STATUS_COLORS.DRAFT}`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" onClick={() => setViewing(inv)}>
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg disabled:opacity-50"
                            onClick={() => downloadInvoice(inv)}
                            disabled={downloadingId === inv.id}
                            title="Download PDF"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-50"
                            onClick={() => downloadExport(inv, 'csv')}
                            disabled={downloadingId === inv.id}
                            title="Export CSV"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 hover:border-slate-300 hover:text-slate-700 disabled:opacity-50"
                            onClick={() => downloadExport(inv, 'xls')}
                            disabled={downloadingId === inv.id}
                          >
                            XLS
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>

      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 leading-none">View Invoice {viewing.invoiceNo}</h2>
              <button onClick={() => setViewing(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors leading-none">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-8">
              <div className="flex justify-between items-start mb-8">
                <div className="space-y-4">
                  <div className="h-10 flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-900 flex items-center justify-center rounded-lg">
                      <Receipt className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-lg font-black text-slate-900">Sea Hawk Courier & Cargo</span>
                  </div>
                  <div className="text-sm text-slate-500 max-w-xs leading-relaxed">
                    Shop 6 & 7, Rao Lal Singh Market, Sector-18, Gurugram – 122015, Haryana
                    <br/>GSTIN: 06AJDPR0914N2Z1
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${STATUS_COLORS[viewing.status]}`}>
                    {viewing.status}
                  </span>
                  <div className="text-xs text-slate-400 uppercase font-black tracking-widest">Amount Due</div>
                  <div className="text-3xl font-black text-slate-900">{fmt(viewing.total)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8 pt-8 border-t border-slate-100">
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bill To</div>
                  <div className="text-base font-bold text-slate-900">{viewing.client?.company || viewing.clientCode}</div>
                  <div className="text-sm text-slate-500 leading-relaxed">{viewing.client?.address || '—'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Period</div>
                  <div className="text-base font-bold text-slate-900">{viewing.fromDate} to {viewing.toDate}</div>
                  <div className="text-sm text-slate-500">Tax Type: {getTaxBreakdown(viewing, viewing.client).type}</div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 overflow-hidden mb-6">
                <table className="w-full text-left text-sm border-collapse">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">AWB No</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(viewing.items || []).slice(0, 5).map((item, i) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-slate-600">{item.date}</td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">{item.awb}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">{fmt(item.amount)}</td>
                      </tr>
                    ))}
                    {viewing.items?.length > 5 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-2 text-center text-xs text-slate-400 bg-slate-50/50">
                          ... and {(viewing.items.length - 5)} more shipments. Download PDF for full list.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <div className="w-full max-w-xs space-y-3">
                  <div className="flex justify-between text-sm text-slate-500 font-medium">
                    <span>Subtotal</span>
                    <span className="text-slate-900 font-bold">{fmt(viewing.subtotal)}</span>
                  </div>
                  {getTaxBreakdown(viewing, viewing.client).lines.map(line => (
                    <div key={line.label} className="flex justify-between text-sm text-slate-500 font-medium">
                      <span>{line.label}</span>
                      <span className="text-slate-900 font-bold">{fmt(line.amount)}</span>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-400">Total Charged</span>
                    <span className="text-2xl font-black text-slate-900 leading-none">{fmt(viewing.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between rounded-b-2xl">
              <button onClick={() => setViewing(null)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition">Close Preview</button>
              <div className="flex gap-2">
                <button onClick={() => downloadInvoice(viewing)} title="Download PDF" className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-transform active:scale-95 leading-none">
                  <FileText className="w-4 h-4" /> Download PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
