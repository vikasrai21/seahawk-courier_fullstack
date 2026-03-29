// src/pages/client/ClientWalletPage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { PageLoader } from '../../components/ui/Loading';
import { EmptyState } from '../../components/ui/EmptyState';

const fmt = n => `₹${Number(n||0).toLocaleString('en-IN')}`;

export default function ClientWalletPage({ toast }) {
  const [wallet, setWallet]   = useState(null);
  const [txns,   setTxns]     = useState([]);
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
      .then(r => { setWallet(r.data?.wallet); setTxns(r.data?.txns || []); })
      .catch(e => toast?.(e.message, 'error'))
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center gap-3">
        <Link to="/portal" className="text-gray-400 hover:text-gray-600">← Portal</Link>
        <span className="font-bold text-gray-900">My Wallet</span>
      </header>
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div className="card bg-navy text-white" style={{ background: '#0b1f3a' }}>
          <div className="text-sm opacity-70 mb-1">Current Balance</div>
          <div className="text-4xl font-bold">{fmt(wallet?.walletBalance)}</div>
          <div className="text-sm opacity-60 mt-1">{wallet?.company}</div>
        </div>

        <div className="card">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[180px]">
              <div className="label">Top-up Amount</div>
              <input className="input" type="number" min="100" step="100" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={startTopup} disabled={toppingUp}>
              {toppingUp ? 'Processing…' : 'Add Funds'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3">Use Razorpay to add funds online and keep shipments moving without manual payment follow-up.</p>
        </div>

        <div>
          <h2 className="font-semibold text-gray-800 mb-3">Transaction History</h2>
          {txns.length === 0
            ? <EmptyState icon="💸" title="No transactions yet" />
            : (
              <div className="card p-0 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {['Date','Type','Description','Amount','Balance','Receipt'].map(h =>
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">{h}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {txns.map(t => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500 text-xs">{new Date(t.createdAt).toLocaleDateString('en-IN')}</td>
                        <td className="px-4 py-3">
                          <span className={`badge badge-${t.type==='CREDIT'?'green':'red'}`}>{t.type}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{t.description}</td>
                        <td className={`px-4 py-3 font-semibold ${t.type==='CREDIT'?'text-green-600':'text-red-600'}`}>
                          {t.type==='CREDIT'?'+':'-'}{fmt(t.amount)}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{fmt(t.balance)}</td>
                        <td className="px-4 py-3 text-xs">
                          {t.type === 'CREDIT' ? (
                            <button className="text-blue-600 hover:underline font-semibold" onClick={() => downloadReceipt(t)}>
                              GST Receipt
                            </button>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}
