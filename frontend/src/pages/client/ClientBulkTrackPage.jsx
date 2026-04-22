import { useState } from 'react';
import api from '../../services/api';
import ClientPortalPageIntro from '../../components/client/ClientPortalPageIntro';

export default function ClientBulkTrackPage({ toast }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const submit = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      toast?.('Paste at least one AWB number', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/portal/bulk-track', { text: trimmed });
      setResult(res.data);
      toast?.(`Tracked ${res.data?.found || 0} shipments`, 'success');
    } catch (e) {
      toast?.(e.message || 'Bulk tracking failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full">
      <div className="mx-auto client-premium-main">
        <ClientPortalPageIntro
          eyebrow="Bulk Tracking"
          title="Paste a full AWB list once and turn it into a clean, action-ready tracking table."
          description="Use commas, spaces, or line breaks. This workspace is tuned for operations teams who need a fast scan across many shipments without opening them one by one."
          badges={['Multi search', `${result?.total || 0} submitted`, `${result?.found || 0} found`]}
          actions={(
            <>
              <button onClick={submit} disabled={loading} className="client-action-btn-primary">
                {loading ? 'Tracking…' : 'Run bulk track'}
              </button>
              <button onClick={() => { setText(''); setResult(null); }} className="client-action-btn-secondary">
                Clear list
              </button>
            </>
          )}
        />
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_320px]">
          <div className="overflow-hidden rounded-[28px] border border-slate-200/60 bg-[linear-gradient(145deg,#0f2748_0%,#123563_55%,#174576_100%)] p-6 text-white shadow-[0_22px_50px_-30px_rgba(15,39,72,0.9)]">
            <div className="inline-flex rounded-full border border-sky-200/20 bg-sky-300/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-sky-100">
              Multi Search
            </div>
            <h1 className="mt-4 max-w-2xl text-3xl font-black leading-tight">Paste a full AWB list once and get a clean status table back instantly.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
              Use commas, spaces, or line breaks. This page is now optimized to feel like a true operations tool, not just a textarea with a button.
            </p>
          </div>
          <div className="rounded-[26px] border border-orange-200 bg-[linear-gradient(180deg,#fff8f2_0%,#ffffff_100%)] p-5 shadow-[0_18px_40px_-28px_rgba(194,65,12,0.45)] dark:border-orange-500/40 dark:bg-[linear-gradient(180deg,rgba(124,45,18,0.35)_0%,rgba(15,23,42,0.94)_100%)]">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-orange-500">Format Tips</div>
            <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Paste however you have it</div>
            <div className="mt-4 grid gap-3 text-sm text-slate-600 dark:text-slate-100">
              <div className="rounded-2xl border border-orange-100 bg-white px-4 py-3 dark:border-orange-400/30 dark:bg-slate-900/80">One AWB per line from spreadsheets or chat exports.</div>
              <div className="rounded-2xl border border-orange-100 bg-white px-4 py-3 dark:border-orange-400/30 dark:bg-slate-900/80">Comma-separated values from CSV or reports.</div>
              <div className="rounded-2xl border border-orange-100 bg-white px-4 py-3 dark:border-orange-400/30 dark:bg-slate-900/80">Mixed spacing works too when copied from emails.</div>
            </div>
          </div>
        </section>

        <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.38)] dark:border-slate-700/60 dark:bg-[#0c1631]">
          <div className="mb-4">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-orange-500">Input</div>
            <h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">Track multiple shipments</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-100">Paste AWB numbers separated by commas, spaces, or line breaks.</p>
          </div>
          <textarea
            className="input min-h-[180px]"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'e.g.\n1234567890\n2345678901\n3456789012'}
          />
          <div className="mt-4 flex gap-3">
            <button onClick={submit} disabled={loading} className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70">
              {loading ? 'Tracking…' : 'Track Shipments'}
            </button>
            <button onClick={() => { setText(''); setResult(null); }} className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
              Clear
            </button>
          </div>
        </section>

        {result && (
          <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_18px_42px_-32px_rgba(15,23,42,0.38)] dark:border-slate-700/60 dark:bg-[#0c1631]">
            <div className="flex flex-wrap gap-3 border-b border-slate-100 px-5 py-4 text-sm dark:border-slate-700">
              <span className="rounded-full bg-slate-100 px-3 py-1.5 font-semibold text-slate-700 dark:bg-slate-800 dark:text-white"><strong>{result.total}</strong> submitted</span>
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700"><strong>{result.found}</strong> found</span>
              <span className="rounded-full bg-rose-50 px-3 py-1.5 font-semibold text-rose-700"><strong>{result.missing}</strong> missing</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="border-b bg-slate-50 dark:border-slate-700/60 dark:bg-[#0a1228]">
                  <tr>
                    {['AWB', 'Status', 'Courier', 'Destination', 'Consignee', 'Latest Event', 'Updated'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-100">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {(result.results || []).map((row, index) => (
                    <tr key={row.awb} className={`${index % 2 ? 'bg-slate-50/40 dark:bg-slate-800/40' : 'bg-white dark:bg-transparent'} hover:bg-orange-50/30 dark:hover:bg-slate-800/70`}>
                      <td className="px-4 py-3 font-mono text-xs font-black text-slate-900 dark:text-white">{row.awb}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${row.found ? 'badge-info' : 'badge-error'}`}>{row.status}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-100">{row.courier || '—'}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-100">{row.destination || '—'}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-white">{row.consignee || '—'}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-100">{row.latestEvent?.status || '—'}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-100">
                        {row.lastUpdatedAt ? new Date(row.lastUpdatedAt).toLocaleString('en-IN') : '—'}
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

