import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Zap, 
  TrendingUp,
  History,
  ArrowLeft,
  ShieldCheck,
  FileDown
} from 'lucide-react';
import api from '../../services/api';
import { PageLoader } from '../../components/ui/Loading';
import TransactionList from '../../components/wallet/TransactionList';

const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export default function ClientWalletPage({ toast }) {
  const [wallet, setWallet] = useState(null);
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(2500);
  const [toppingUp, setToppingUp] = useState(false);
  const [autoTopup, setAutoTopup] = useState({ enabled: false, threshold: 2000, amount: 5000, channel: 'WHATSAPP', whatsapp: '' });
  const [savingAutoTopup, setSavingAutoTopup] = useState(false);
  const [triggeringAutoTopup, setTriggeringAutoTopup] = useState(false);
  const [ledgerMonth, setLedgerMonth] = useState(new Date().toISOString().slice(0, 7));

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

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/portal/wallet'),
      api.get('/portal/wallet/auto-topup'),
    ])
      .then(([r, auto]) => {
        setWallet(r.data?.wallet);
        setTxns(r.data?.txns || []);
        if (auto?.data?.rule) setAutoTopup((prev) => ({ ...prev, ...auto.data.rule }));
      })
      .catch((e) => toast?.(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

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
        toast?.('Neural Funding: Simulation Successful', 'success');
        load();
        return;
      }

      const scriptData = await new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });

      if (!scriptData) throw new Error('Payment gateway initialisation failed');

      const razorpay = new window.Razorpay({
        key: payload.key,
        amount: payload.order?.amount,
        currency: 'INR',
        name: 'Sea Hawk Logistics',
        description: `Wallet Funding — ${wallet.company || wallet.code}`,
        order_id: payload.order?.id,
        handler: async (response) => {
          await api.post('/wallet/recharge/verify', {
            clientCode: wallet.code,
            amount: Number(amount),
            ...response,
          });
          toast?.('Funds Engaged Successfully', 'success');
          load();
        },
        theme: { color: '#0f172a' },
      });
      razorpay.open();
    } catch (e) {
      toast?.(e.message || 'Payment engine error', 'error');
    } finally {
      setToppingUp(false);
    }
  };

  const saveAutoTopupRule = async () => {
    if (autoTopup.enabled && (Number(autoTopup.threshold) < 100 || Number(autoTopup.amount) < 100)) {
      toast?.('Threshold and top-up amount must be at least ₹100', 'error');
      return;
    }
    setSavingAutoTopup(true);
    try {
      const res = await api.post('/portal/wallet/auto-topup', autoTopup);
      setAutoTopup((prev) => ({ ...prev, ...(res.data?.rule || {}) }));
      toast?.(res.message || 'Auto-topup rule saved', 'success');
    } catch (e) {
      toast?.(e.message || 'Failed to save auto-topup rule', 'error');
    } finally {
      setSavingAutoTopup(false);
    }
  };

  const triggerAutoTopupAlert = async () => {
    setTriggeringAutoTopup(true);
    try {
      const res = await api.post('/portal/wallet/auto-topup/trigger', {});
      toast?.(res.message || 'Auto-topup alert sent', 'success');
    } catch (e) {
      toast?.(e.message || 'Failed to trigger auto-topup alert', 'error');
    } finally {
      setTriggeringAutoTopup(false);
    }
  };

  const downloadMonthlyLedger = async () => {
    if (!ledgerMonth) {
      toast?.('Select a month first', 'error');
      return;
    }
    try {
      const blob = await api.get(`/portal/wallet/ledger-export?month=${encodeURIComponent(ledgerMonth)}`, { responseType: 'blob' });
      triggerBlobDownload(blob, `wallet-ledger-${wallet?.code || 'client'}-${ledgerMonth}.csv`);
      toast?.('Ledger export downloaded', 'success');
    } catch (e) {
      toast?.(e.message || 'Failed to export monthly ledger', 'error');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-12">
      {/* Premium Compact Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl sticky top-0 z-50 px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
             <Link to="/portal" className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all">
                <ArrowLeft size={18} />
             </Link>
             <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 leading-none mb-1">Financial Desk</h4>
                <div className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">Wallet Control Center</div>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <Link to="/portal/invoices" className="hidden sm:flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-500 transition-colors">
                <FileDown size={14} /> Settlement History
             </Link>
             <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
             <div className="text-[11px] font-black text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-lg uppercase tracking-widest border border-blue-100 dark:border-blue-500/20">
                LTD #{wallet?.code}
             </div>
          </div>
        </div>
      </header>

      <div className="mx-auto client-premium-main animate-in fade-in duration-700">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           {/* LEFT: Balance & Recharge Command Center */}
           <div className="lg:col-span-4 space-y-6">
              {/* Main Balance Card (Glassmorphic Deep Blue) */}
              <div className="rounded-[40px] bg-slate-900 border border-slate-800 p-8 shadow-2xl shadow-slate-900/40 relative overflow-hidden group">
                 <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 blur-[80px] pointer-events-none group-hover:bg-blue-500/20 transition-all duration-1000" />
                 <div className="flex items-center gap-3 mb-10 relative z-10">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-500 animate-pulse">
                       <Zap size={20} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Liquid Capital</span>
                 </div>
                 <div className="text-5xl font-black text-white tabular-nums tracking-tighter mb-2 relative z-10">{fmt(wallet?.walletBalance)}</div>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest relative z-10">Available credit for bookings</p>
                 
                 <div className="mt-8 flex items-center gap-3 relative z-10">
                    <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500 w-[70%]" />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase">Buffer: OK</span>
                 </div>
              </div>

              {/* Quick Recharge Card */}
               <div className="rounded-[32px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 shadow-sm">
                 <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Neural Funding Bolt</h4>
                 <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                       {[1000, 2500, 5000].map((p) => (
                         <button key={p} onClick={() => setAmount(p)} className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${+amount === p ? 'bg-slate-900 border-slate-800 text-white shadow-xl shadow-slate-900/10' : 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-500 hover:bg-slate-100'}`}>
                            {fmt(p)}
                         </button>
                       ))}
                    </div>
                    <div className="relative">
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-300">₹</span>
                       <input type="number" min="100" className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl pl-10 pr-4 py-4 text-2xl font-black text-slate-800 dark:text-white tabular-nums placeholder:text-slate-200" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    </div>
                    <button onClick={startTopup} disabled={toppingUp} className="w-full py-4 bg-blue-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-3xl shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 group/btn active:scale-95">
                       <Zap size={14} className={toppingUp ? 'animate-pulse' : 'group-hover/btn:animate-bounce'} />
                       {toppingUp ? 'Engaging Flow…' : 'Top Up Wallet'}
                    </button>
                    <p className="text-[9px] text-center font-bold text-slate-400 uppercase tracking-widest mt-2">🔐 Encrypted via Razorpay Secured Stack</p>
               </div>

               <div className="rounded-[32px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-8 shadow-sm space-y-4">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Auto Top-up Rule</h4>
                  <label className="flex items-center justify-between rounded-2xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700">
                    Enable auto-topup alerts
                    <input
                      type="checkbox"
                      checked={!!autoTopup.enabled}
                      onChange={(e) => setAutoTopup((prev) => ({ ...prev, enabled: e.target.checked }))}
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      min="100"
                      className="input"
                      value={autoTopup.threshold}
                      onChange={(e) => setAutoTopup((prev) => ({ ...prev, threshold: Number(e.target.value || 0) }))}
                      placeholder="Threshold ₹"
                    />
                    <input
                      type="number"
                      min="100"
                      className="input"
                      value={autoTopup.amount}
                      onChange={(e) => setAutoTopup((prev) => ({ ...prev, amount: Number(e.target.value || 0) }))}
                      placeholder="Top-up ₹"
                    />
                  </div>
                  <select
                    className="input"
                    value={autoTopup.channel}
                    onChange={(e) => setAutoTopup((prev) => ({ ...prev, channel: e.target.value }))}
                  >
                    <option value="WHATSAPP">WhatsApp Alert</option>
                    <option value="EMAIL">Email Alert</option>
                  </select>
                  {autoTopup.channel === 'WHATSAPP' && (
                    <input
                      className="input"
                      value={autoTopup.whatsapp || ''}
                      onChange={(e) => setAutoTopup((prev) => ({ ...prev, whatsapp: e.target.value }))}
                      placeholder="WhatsApp number"
                    />
                  )}
                  <div className="flex gap-2">
                    <button onClick={saveAutoTopupRule} disabled={savingAutoTopup} className="btn-primary">
                      {savingAutoTopup ? 'Saving…' : 'Save Rule'}
                    </button>
                    <button onClick={triggerAutoTopupAlert} disabled={triggeringAutoTopup} className="btn-secondary">
                      {triggeringAutoTopup ? 'Triggering…' : 'Send Alert'}
                    </button>
                  </div>
               </div>
            </div>
           </div>

           {/* RIGHT: Detailed Ledger & Visuals */}
           <div className="lg:col-span-8 space-y-8">
              {/* Info Widgets Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="p-6 rounded-[32px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5">
                    <div className="w-12 h-12 rounded-[20px] bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                       <ShieldCheck size={24} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Billing Entity</p>
                       <p className="text-sm font-black text-slate-800 dark:text-white truncate max-w-[180px] uppercase">{wallet?.company || 'Verified Account'}</p>
                    </div>
                 </div>
                 <div className="p-6 rounded-[32px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 group">
                    <div className="w-12 h-12 rounded-[20px] bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:rotate-12 transition-transform">
                       <TrendingUp size={24} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Delta Tracking</p>
                       <p className="text-sm font-black text-slate-800 dark:text-white uppercase">{txns.length} Settlements active</p>
                    </div>
                 </div>
              </div>

              {/* Real-time Sub-ledger */}
              <div className="space-y-4">
                 <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                       <History size={16} className="text-slate-400" />
                       <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Activity Sub-ledger</h3>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                       Audited Record
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-100 bg-white dark:bg-slate-900 p-4 shadow-sm flex flex-wrap items-center gap-3 justify-between">
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-black uppercase tracking-[0.15em] text-slate-400">Monthly Ledger</label>
                      <input
                        type="month"
                        className="input"
                        value={ledgerMonth}
                        onChange={(e) => setLedgerMonth(e.target.value)}
                      />
                    </div>
                    <button onClick={downloadMonthlyLedger} className="btn-secondary">
                      Export CSV
                    </button>
                  </div>
                  
                  <div className="rounded-[40px] border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-2 shadow-sm backdrop-blur-sm overflow-hidden min-h-[400px]">
                    <div className="p-4">
                       <TransactionList transactions={txns} loading={loading} />
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

