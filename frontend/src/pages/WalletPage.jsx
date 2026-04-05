import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import { EmptyState } from '../components/ui/EmptyState';
import { CreditCard, RefreshCw, ArrowUpCircle, ArrowDownCircle, Plus, Search, TrendingUp, Wallet, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';

const fmt    = n => `₹${Number(n||0).toLocaleString('en-IN')}`;
const fmtDt  = d => new Date(d).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});

export default function WalletPage({ toast }) {
  const { isAdmin, hasRole } = useAuth();
  const [wallets,    setWallets]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState(null);
  const [txns,       setTxns]       = useState([]);
  const [txLoading,  setTxLoading]  = useState(false);
  const [search,     setSearch]     = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [showRecharge, setShowRecharge] = useState(false);
  const [showAdjust,   setShowAdjust]   = useState(false);
  const [rechargeClient, setRechargeClient] = useState(null);

  const canManage = isAdmin || hasRole('OPS_MANAGER');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Admin: see all wallets. Client: see own wallet
      if (canManage) {
        const r = await api.get('/wallet');
        setWallets(r.data?.wallets || r.data || []);
      } else {
        // Find client code for current user
        const r = await api.get('/wallet/me');
        setWallets([r.data]);
        setSelected(r.data);
      }
    } catch(e) { toast?.(e.message,'error'); }
    finally { setLoading(false); }
  }, [canManage]);

  useEffect(() => { load(); }, [load]);

  const loadTxns = async (clientCode) => {
    setTxLoading(true);
    try {
      const r = await api.get(`/wallet/${clientCode}/transactions?limit=50`);
      setTxns(r.data?.transactions || r.data || []);
    } catch(e) { toast?.(e.message,'error'); }
    finally { setTxLoading(false); }
  };

  const selectWallet = (w) => {
    setSelected(w);
    loadTxns(w.clientCode);
  };

  const filtered = wallets.filter(w =>
    !debouncedSearch || w.clientCode?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    w.company?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const totalBalance = wallets.reduce((s,w) => s + (w.walletBalance || w.balance || 0), 0);

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6">
      <PageHeader
        title="Wallet & Payments"
        subtitle="Manage client balances and track real-time transaction history."
        icon={Wallet}
        actions={
          <div className="flex items-center gap-2">
            {canManage && (
              <button 
                onClick={() => setShowAdjust(true)} 
                className="btn-secondary btn-sm"
              >
                <TrendingUp className="w-3.5 h-3.5" /> Manual Adjust
              </button>
            )}
            <button 
              onClick={() => setShowRecharge(true)} 
              className="btn-primary"
            >
              <Plus className="w-4 h-4" /> Recharge Wallet
            </button>
            <button 
              onClick={load} 
              disabled={loading}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        }
      />

      {/* Total balance strip (admin) */}
      {canManage && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card interactive-lift overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
              <Wallet size={80} />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Total Client Balances</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-3">{fmt(totalBalance)}</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Across all active accounts</span>
            </div>
          </div>
          
          <div className="card interactive-lift overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
              <CheckCircle2 size={80} />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Positive Balances</p>
            <p className="text-3xl font-black text-green-500 mt-3">{wallets.filter(w=>(w.walletBalance||w.balance||0)>0).length}</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Healthy accounts</span>
            </div>
          </div>

          <div className="card interactive-lift overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
              <AlertCircle size={80} />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Zero / Low Balance</p>
            <p className="text-3xl font-black text-slate-400 mt-3">{wallets.filter(w=>(w.walletBalance||w.balance||0)<=0).length}</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Requires attention</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4 flex-col md:flex-row">
        {/* Wallet list */}
        {canManage && (
          <div className="w-full md:w-72 shrink-0">
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"/>
              <input className="input pl-8 text-sm h-9 rounded-2xl" placeholder="Search client…"
                value={search} onChange={e=>setSearch(e.target.value)}/>
            </div>
            <div className="space-y-1 max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-8"><RefreshCw className="w-5 h-5 animate-spin text-gray-300"/></div>
              ) : filtered.map(w => {
                const bal = w.walletBalance || w.balance || 0;
                return (
                  <button key={w.clientCode}
                    onClick={() => selectWallet(w)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all ${
                      selected?.clientCode === w.clientCode
                        ? 'bg-orange-50 border-orange-200 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-orange-200'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{w.company || w.clientCode}</p>
                        <p className="text-[10px] text-gray-400">{w.clientCode}</p>
                      </div>
                      <span className={`text-sm font-black ${bal > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                        {fmt(bal)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Transaction panel */}
        <div className="flex-1">
          {!selected ? (
            <div className="card text-center text-gray-400">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-20"/>
              <p className="font-medium text-gray-500">Select a client to view transactions</p>
            </div>
          ) : (
            <div className="table-shell overflow-hidden">
              {/* Wallet header */}
              <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-900 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold opacity-70">{selected.company || selected.clientCode}</p>
                    <p className="text-3xl font-black mt-1">{fmt(selected.walletBalance || selected.balance || 0)}</p>
                    <p className="text-xs opacity-50 mt-0.5">Current Balance</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setRechargeClient(selected); setShowRecharge(true); }}
                      className="bg-white/12 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5 border border-white/10">
                      <ArrowUpCircle className="w-3.5 h-3.5"/> Recharge
                    </button>
                  </div>
                </div>
              </div>

              {/* Transactions */}
              <div className="p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Transaction History</p>
                {txLoading ? (
                  <div className="flex justify-center py-8"><RefreshCw className="w-5 h-5 animate-spin text-gray-300"/></div>
                ) : txns.length === 0 ? (
                  <EmptyState icon="💸" title="No transactions yet" message="Transactions will appear here once wallet activity begins." />
                ) : (
                  <div className="space-y-2">
                    {txns.map(t => (
                      <div key={t.id} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-amber-50/40 transition-colors border border-transparent hover:border-amber-100">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          t.type==='CREDIT' ? 'bg-green-100' : 'bg-red-50'
                        }`}>
                          {t.type==='CREDIT'
                            ? <ArrowUpCircle className="w-4 h-4 text-green-600"/>
                            : <ArrowDownCircle className="w-4 h-4 text-red-400"/>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-700 truncate">{t.description}</p>
                          <p className="text-xs text-gray-400">{fmtDt(t.createdAt)}</p>
                          {t.reference && <p className="text-[10px] font-mono text-gray-300">{t.reference}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-sm font-bold ${t.type==='CREDIT' ? 'text-green-600' : 'text-red-500'}`}>
                            {t.type==='CREDIT' ? '+' : '-'}{fmt(t.amount)}
                          </p>
                          <p className="text-[10px] text-gray-400">Bal: {fmt(t.balance)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recharge Modal */}
      {showRecharge && (
        <RechargeModal
          clientCode={rechargeClient?.clientCode || selected?.clientCode}
          company={rechargeClient?.company || selected?.company}
          toast={toast}
          onClose={() => { setShowRecharge(false); setRechargeClient(null); }}
          onSuccess={() => { setShowRecharge(false); setRechargeClient(null); load(); if(selected) loadTxns(selected.clientCode); }}
        />
      )}

      {/* Manual Adjust Modal */}
      {showAdjust && canManage && (
        <AdjustModal
          wallets={wallets}
          toast={toast}
          onClose={() => setShowAdjust(false)}
          onSuccess={() => { setShowAdjust(false); load(); if(selected) loadTxns(selected.clientCode); }}
        />
      )}
    </div>
  );
}

/* ── Razorpay Recharge Modal ─────────────────────────────────────────────── */
function RechargeModal({ clientCode, company, toast, onClose, onSuccess }) {
  const [amount,  setAmount]  = useState('');
  const [loading, setLoading] = useState(false);

  const presets = [500, 1000, 2000, 5000, 10000];

  const initRecharge = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 100) { toast?.('Minimum recharge ₹100','error'); return; }
    setLoading(true);
    try {
      const r = await api.post('/wallet/recharge/order', { clientCode, amount: amt });
      const { order, key, devMode } = r.data;

      if (devMode) {
        // Dev/test mode — simulate success
        toast?.(`Dev mode: simulating ₹${amt} payment success`,'info');
        await api.post('/wallet/recharge/verify', {
          razorpay_order_id:   order.id,
          razorpay_payment_id: `pay_dev_${Date.now()}`,
          razorpay_signature:  'dev_signature',
          clientCode, amount: amt,
        });
        toast?.(`₹${amt} credited to ${company || clientCode}`,'success');
        onSuccess();
        return;
      }

      // Load Razorpay checkout
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        const rzp = new window.Razorpay({
          key,
          amount:      order.amount,
          currency:    'INR',
          name:        'Sea Hawk Courier',
          description: `Wallet Recharge — ${company || clientCode}`,
          order_id:    order.id,
          handler: async (response) => {
            try {
              await api.post('/wallet/recharge/verify', {
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                clientCode, amount: amt,
              });
              toast?.(`₹${amt} credited successfully!`,'success');
              onSuccess();
            } catch(e) { toast?.(e.message,'error'); }
          },
          prefill: { name: company || clientCode },
          theme: { color: '#0b1f3a' },
        });
        rzp.open();
      };
      document.body.appendChild(script);
    } catch(e) { toast?.(e.message,'error'); }
    finally { setLoading(false); }
  };

  return (
      <Modal open onClose={onClose} title={`Recharge — ${company || clientCode}`}>
      <div className="space-y-4">
        <div className="p-3 bg-navy-50 rounded-lg border border-navy-100 text-center">
          <p className="text-sm text-navy-600 font-semibold">{company || clientCode}</p>
        </div>
        <div>
          <label className="label">Amount (₹) *</label>
          <input type="number" className="input text-lg font-bold" placeholder="0"
            min={100} value={amount} onChange={e=>setAmount(e.target.value)}/>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-2">Quick amounts</p>
          <div className="flex gap-2 flex-wrap">
            {presets.map(p => (
              <button key={p} onClick={()=>setAmount(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  +amount===p ? 'bg-navy-600 text-white border-navy-600' : 'border-gray-200 text-gray-600 hover:border-navy-400'
                }`}>
                {fmt(p)}
              </button>
            ))}
          </div>
        </div>
        <div className="text-xs text-gray-400 bg-gray-50 rounded-lg p-3">
          🔒 Secure payment via Razorpay. Wallet will be credited instantly after successful payment.
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={initRecharge} disabled={loading || !amount} className="btn-primary flex-1">
            {loading ? 'Processing…' : `Pay ${amount ? fmt(amount) : ''}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Manual Adjust Modal (admin) ─────────────────────────────────────────── */
function AdjustModal({ wallets, toast, onClose, onSuccess }) {
  const [form, setForm] = useState({ clientCode:'', type:'CREDIT', amount:'', description:'' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.clientCode || !form.amount || !form.description) {
      toast?.('All fields required','error'); return;
    }
    setSaving(true);
    try {
      await api.post('/wallet/adjust', form);
      toast?.(`Wallet ${form.type.toLowerCase()}ed`,'success');
      onSuccess();
    } catch(e) { toast?.(e.message,'error'); }
    finally { setSaving(false); }
  };

  return (
      <Modal open onClose={onClose} title="Manual Wallet Adjustment">
      <div className="space-y-3">
        <div>
          <label className="label">Client *</label>
          <select className="input" value={form.clientCode} onChange={e=>setForm(f=>({...f,clientCode:e.target.value}))}>
            <option value="">— Select client —</option>
            {wallets.map(w=><option key={w.clientCode} value={w.clientCode}>{w.company||w.clientCode} ({fmt(w.walletBalance||w.balance||0)})</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="label">Type *</label>
            <select className="input" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
              <option value="CREDIT">Credit (Add)</option>
              <option value="DEBIT">Debit (Deduct)</option>
            </select>
          </div>
          <div>
            <label className="label">Amount (₹) *</label>
            <input type="number" className="input" placeholder="0" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/>
          </div>
        </div>
        <div>
          <label className="label">Description *</label>
          <input className="input" placeholder="Reason for adjustment…" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving?'Saving…':'Apply Adjustment'}</button>
        </div>
      </div>
    </Modal>
  );
}
