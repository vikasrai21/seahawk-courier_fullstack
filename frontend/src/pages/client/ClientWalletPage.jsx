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

  useEffect(() => {
    api.get('/wallet/my')
      .then(r => { setWallet(r.data?.wallet); setTxns(r.data?.txns || []); })
      .catch(e => toast?.(e.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

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

        <div>
          <h2 className="font-semibold text-gray-800 mb-3">Transaction History</h2>
          {txns.length === 0
            ? <EmptyState icon="💸" title="No transactions yet" />
            : (
              <div className="card p-0 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {['Date','Type','Description','Amount','Balance'].map(h =>
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
