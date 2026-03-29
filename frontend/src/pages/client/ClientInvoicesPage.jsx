import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { PageLoader } from '../../components/ui/Loading';
import { EmptyState } from '../../components/ui/EmptyState';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const STATUS_COLORS = { DRAFT: 'gray', SENT: 'blue', PAID: 'green', OVERDUE: 'red' };

function InvoiceStat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-orange-500">{label}</div>
      <div className="mt-2 text-2xl font-black text-slate-900">{value}</div>
      <div className="mt-2 text-xs text-slate-500">{hint}</div>
    </div>
  );
}

export default function ClientInvoicesPage({ toast }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

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
                        <span className={`badge badge-${STATUS_COLORS[inv.status] || 'gray'}`}>{inv.status}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <button className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 transition hover:bg-sky-100" onClick={() => downloadInvoice(inv)}>
                            {downloadingId === inv.id ? 'Preparing…' : 'PDF'}
                          </button>
                          <button className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700 transition hover:bg-orange-100" onClick={() => downloadExport(inv, 'xls')}>
                            Excel
                          </button>
                          <button className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100" onClick={() => downloadExport(inv, 'csv')}>
                            CSV
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
    </div>
  );
}
