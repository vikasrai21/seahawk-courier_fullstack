import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import ClientPortalPageIntro from '../../components/client/ClientPortalPageIntro';

export default function ClientPODPage({ toast }) {
  const [pods, setPods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get('/portal/pods');
        setPods(res.data?.pods || []);
      } catch (err) {
        toast?.(err.message || 'Failed to load POD records', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7faff_0%,#eef4fd_100%)]">
      <header className="client-premium-header px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/portal" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:text-slate-700">← Portal</Link>
            <div>
              <div className="text-sm font-black text-slate-900">Digital POD Viewer</div>
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-orange-500">Delivery Proof Desk</div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto client-premium-main">
        <ClientPortalPageIntro
          eyebrow="Proof of Delivery"
          title="Review proof-of-delivery records."
          description="See delivered rows with proof availability, open POD links faster, and verify final delivery place and time in one scrollable workspace."
          badges={[`${pods.length} delivered records`, loading ? 'Loading evidence' : 'Evidence loaded']}
        />
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.12fr)_320px]">
          <div className="overflow-hidden rounded-[28px] border border-slate-200/60 bg-[linear-gradient(145deg,#eff6ff_0%,#ffffff_70%)] p-6 shadow-[0_22px_44px_-30px_rgba(37,99,235,0.25)]">
            <div className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-sky-600">
              Delivery Proof
            </div>
            <h1 className="mt-4 max-w-2xl text-3xl font-black leading-tight text-slate-900">Proof-of-delivery records.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
              Open proof links when available, review the delivery place and time, and scan the list faster.
            </p>
          </div>
          <div className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_18px_42px_-32px_rgba(15,23,42,0.38)]">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-orange-500">Delivered Records</div>
            <div className="mt-2 text-4xl font-black text-slate-900">{pods.length}</div>
            <p className="mt-2 text-sm text-slate-500">Shipment rows with proof availability and final scan context.</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_18px_42px_-32px_rgba(15,23,42,0.38)]">
          {loading ? (
            <div className="p-5 text-sm text-slate-500">Loading POD records…</div>
          ) : pods.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              <div className="text-4xl">📸</div>
              <div className="mt-3 font-semibold text-slate-800">No delivered shipments found yet.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="border-b bg-slate-50">
                  <tr>
                    {['AWB', 'Consignee', 'Destination', 'Delivered At', 'Location', 'Proof'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pods.map((row, index) => (
                    <tr key={row.awb} className={index % 2 ? 'bg-slate-50/40' : 'bg-white'}>
                      <td className="px-4 py-3 font-mono text-xs font-black text-slate-900">{row.awb}</td>
                      <td className="px-4 py-3 text-slate-700">{row.consignee || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{row.destination || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{new Date(row.deliveredAt).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-slate-600">{row.deliveredLocation || '—'}</td>
                      <td className="px-4 py-3">
                        {row.hasProof ? (
                          <a href={row.proofUrl} target="_blank" rel="noreferrer" className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 transition hover:bg-sky-100">
                            Open proof
                          </a>
                        ) : (
                          <span className="text-slate-400">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

