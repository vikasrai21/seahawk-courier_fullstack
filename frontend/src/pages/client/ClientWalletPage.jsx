import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { PageLoader } from '../../components/ui/Loading';
import { EmptyState } from '../../components/ui/EmptyState';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

function WalletStat({ label, value, hint, tone }) {
  return (
    <div className="rounded-2xl border p-4 shadow-sm" style={{ background: '#fff', borderColor: '#e5edf8' }}>
      <div className="text-[11px] font-extrabold uppercase tracking-[0.14em]" style={{ color: tone }}>{label}</div>
      <div className="mt-2 text-2xl font-black text-slate-900">{value}</div>
      <div className="mt-2 text-xs text-slate-500">{hint}</div>
    </div>
  );
}

export default function ClientWalletPage({ toast }) {
  const [wallet, setWallet] = useState(null);
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(1000);
  const [toppingUp, setToppingUp] = useState(false);

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

  const load = () => {
    api.get('/portal/wallet')
      .then((r) => {
        setWallet(r.data?.wallet);
        setTxns(r.data?.txns || []);
      })
      .catch((e) => toast?.(e.message, 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const loadRazorpayScript = () => new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  const startTopup = async () => {
    if (!wallet?.code || !Number.isFinite(Number(amount)) || Number(amount) < 100) {
      toast?.('Enter an amount of at least ₹100', 'error');
      return;
    }

    setToppingUp(true);
    try {
      const orderRes = await api.post('/wallet/recharge/order', {
        clientCode: wallet.code,
        amount: Number(amount),
      });
      const payload = orderRes.data || {};

      if (payload.devMode) {
        await api.post('/wallet/recharge/verify', {
          clientCode: wallet.code,
          amount: Number(amount),
          razorpay_order_id: payload.order?.id,
          razorpay_payment_id: `devpay_${Date.now()}`,
        });
        toast?.('Wallet topped up in dev mode', 'success');
        load();
        return;
      }

      const ok = await loadRazorpayScript();
      if (!ok || !window.Razorpay) {
        throw new Error('Unable to load Razorpay checkout');
      }

      const razorpay = new window.Razorpay({
        key: payload.key,
        amount: payload.order?.amount,
        currency: payload.order?.currency || 'INR',
        name: 'Sea Hawk Courier',
        description: 'Wallet top-up',
        order_id: payload.order?.id,
        handler: async (response) => {
          await api.post('/wallet/recharge/verify', {
            clientCode: wallet.code,
            amount: Number(amount),
            ...response,
          });
          toast?.('Wallet topped up successfully', 'success');
          load();
        },
        theme: { color: '#0b1f3a' },
      });
      razorpay.open();
    } catch (e) {
      toast?.(e.message || 'Wallet top-up failed', 'error');
    } finally {
      setToppingUp(false);
    }
  };

  const downloadReceipt = async (txn) => {
    try {
      const blob = await api.get(`/portal/wallet/transactions/${txn.id}/receipt`, { responseType: 'blob' });
      triggerBlobDownload(blob, `wallet-receipt-${txn.receiptNo || txn.id}.pdf`);
    } catch (e) {
      toast?.(e.message || 'Failed to download receipt', 'error');
    }
  };

  if (loading) return <PageLoader />;

  const creditCount = txns.filter((t) => t.type === 'CREDIT').length;
  const debitCount = txns.filter((t) => t.type !== 'CREDIT').length;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7faff_0%,#eef4fd_100%)]">
      <header className="border-b border-slate-200/70 bg-white/90 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/portal" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:text-slate-700">← Portal</Link>
            <div>
              <div className="text-sm font-black text-slate-900">Wallet & Payments</div>
              <div className="text-xs font-semibold uppercase tracking-[0.12em] text-orange-500">Client Finance Desk</div>
            </div>
          </div>
          <Link to="/portal/invoices" className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-extrabold uppercase tracking-[0.08em] text-orange-700">
            Open Invoices
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl p-6 space-y-6">
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_340px]">
          <div className="overflow-hidden rounded-[28px] border border-slate-200/60 bg-[linear-gradient(145deg,#0f2748_0%,#123563_55%,#174576_100%)] p-6 text-white shadow-[0_22px_50px_-30px_rgba(15,39,72,0.9)]">
            <div className="inline-flex rounded-full border border-sky-200/20 bg-sky-300/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-sky-100">
              Wallet Snapshot
            </div>
            <h1 className="mt-4 max-w-xl text-3xl font-black leading-tight">Keep dispatch moving with a cleaner view of balance, receipts, and recharge activity.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-200">
              Add funds, track credits and debits, and pull GST receipts without leaving the client portal.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                <div className="text-xs font-semibold text-slate-300">Available Balance</div>
                <div className="mt-2 text-3xl font-black">{fmt(wallet?.walletBalance)}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                <div className="text-xs font-semibold text-slate-300">Credits Logged</div>
                <div className="mt-2 text-3xl font-black">{creditCount}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                <div className="text-xs font-semibold text-slate-300">Debits Logged</div>
                <div className="mt-2 text-3xl font-black">{debitCount}</div>
              </div>
            </div>
          </div>

          <div className="rounded-[26px] border border-orange-200 bg-[linear-gradient(180deg,#fff8f2_0%,#ffffff_100%)] p-5 shadow-[0_18px_40px_-28px_rgba(194,65,12,0.45)]">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-orange-500">Recharge Wallet</div>
            <div className="mt-2 text-2xl font-black text-slate-900">Top up in seconds</div>
            <p className="mt-2 text-sm leading-6 text-slate-500">Use Razorpay for quick balance adds and keep booking flow uninterrupted.</p>
            <div className="mt-5 space-y-3">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.1em] text-slate-500">Amount</span>
                <input className="input" type="number" min="100" step="100" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[1000, 2500, 5000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(preset)}
                    className="rounded-xl border border-orange-200 bg-white px-3 py-2 text-sm font-bold text-orange-700 transition hover:bg-orange-50"
                  >
                    {fmt(preset)}
                  </button>
                ))}
              </div>
              <button className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70" onClick={startTopup} disabled={toppingUp}>
                {toppingUp ? 'Processing…' : 'Add Funds'}
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <WalletStat label="Client Code" value={wallet?.code || '—'} hint="Mapped to your billing account" tone="#2563eb" />
          <WalletStat label="Company" value={wallet?.company || '—'} hint="Billing entity shown on receipts" tone="#f97316" />
          <WalletStat label="Ledger Entries" value={txns.length} hint="Complete transaction history below" tone="#7c3aed" />
        </section>

        <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_18px_42px_-32px_rgba(15,23,42,0.38)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-orange-500">Ledger</div>
              <h2 className="mt-1 text-lg font-black text-slate-900">Transaction history</h2>
              <p className="mt-1 text-sm text-slate-500">Credits, debits, balance after each entry, and downloadable GST receipts.</p>
            </div>
          </div>
          {txns.length === 0 ? (
            <div className="p-8">
              <EmptyState icon="💸" title="No transactions yet" message="Once wallet activity starts, credits and debits will appear here." />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    {['Date', 'Type', 'Description', 'Amount', 'Balance', 'Receipt'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-extrabold uppercase tracking-[0.1em] text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {txns.map((t, index) => (
                    <tr key={t.id} className={index % 2 ? 'bg-slate-50/40' : 'bg-white'}>
                      <td className="px-4 py-3 text-xs text-slate-500">{new Date(t.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <span className={`badge badge-${t.type === 'CREDIT' ? 'green' : 'red'}`}>{t.type}</span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">{t.description}</td>
                      <td className={`px-4 py-3 font-extrabold ${t.type === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.type === 'CREDIT' ? '+' : '-'}{fmt(t.amount)}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{fmt(t.balance)}</td>
                      <td className="px-4 py-3 text-xs">
                        {t.type === 'CREDIT' ? (
                          <button className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 font-bold text-sky-700 transition hover:bg-sky-100" onClick={() => downloadReceipt(t)}>
                            GST Receipt
                          </button>
                        ) : (
                          <span className="text-slate-400">-</span>
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
