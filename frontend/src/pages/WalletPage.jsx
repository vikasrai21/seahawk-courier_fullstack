import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  CreditCard, 
  RefreshCw, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Plus, 
  Search, 
  TrendingUp, 
  Wallet, 
  CheckCircle2, 
  AlertCircle,
  PiggyBank,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/ui/PageHeader';
import TransactionList from '../components/wallet/TransactionList';
import { useDebounce } from '../hooks/useDebounce';

const fmt    = n => `₹${Number(n||0).toLocaleString('en-IN')}`;

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
      if (canManage) {
        const r = await api.get('/wallet');
        const data = Array.isArray(r.data?.wallets) ? r.data.wallets : Array.isArray(r.data) ? r.data : [];
        setWallets(data);
      } else {
        const r = await api.get('/wallet/me');
        setWallets([r.data]);
        setSelected(r.data);
      }
    } catch(e) { toast?.(e.message, 'error'); }
    finally { setLoading(false); }
  }, [canManage, toast]);

  useEffect(() => { load(); }, [load]);

  const loadTxns = useCallback(async (clientCode) => {
    setTxLoading(true);
    try {
      const r = await api.get(`/wallet/${clientCode}/transactions?limit=50`);
      setTxns(Array.isArray(r.data?.transactions) ? r.data.transactions : Array.isArray(r.data) ? r.data : []);
    } catch(e) { toast?.(e.message, 'error'); }
    finally { setTxLoading(false); }
  }, [toast]);

  const selectWallet = (w) => {
    setSelected(w);
    loadTxns(w.clientCode);
  };

  const filtered = wallets.filter(w =>
    !debouncedSearch || 
    w.clientCode?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    w.company?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const totalBalance = useMemo(() => wallets.reduce((s,w) => s + (w.walletBalance || w.balance || 0), 0), [wallets]);
  const healthyCount = useMemo(() => wallets.filter(w => (w.walletBalance || w.balance || 0) > 0).length, [wallets]);
  const lowCount = useMemo(() => wallets.filter(w => (w.walletBalance || w.balance || 0) <= 500).length, [wallets]);

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-8 min-h-screen">
      <PageHeader
        title="Financial Control"
        subtitle="Manage client credit liquidity and track real-time logistics settlements"
        icon={PiggyBank}
        actions={
          <div className="flex items-center gap-3">
            {canManage && (
              <button onClick={() => setShowAdjust(true)} className="px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white text-xs font-black uppercase tracking-widest rounded-2xl border border-slate-700 hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2">
                <TrendingUp size={14} /> Manual Adjustment
              </button>
            )}
            <button 
              onClick={() => setShowRecharge(true)} 
              className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2"
            >
              <Plus size={14} /> Global Recharge
            </button>
            <button onClick={load} className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:text-blue-500 transition-all active:scale-90">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        }
      />

      {/* Global Financial Health Strip */}
      {canManage && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="rounded-[32px] border border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-8 shadow-sm backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute right-0 bottom-0 pointer-events-none opacity-[0.03] translate-x-1/4 translate-y-1/4 group-hover:scale-110 transition-transform duration-1000">
               <Wallet size={160} />
            </div>
            <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Wallet size={20} />
               </div>
               <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Aggregated Liquidity</h4>
            </div>
            <div className="text-4xl font-black text-slate-900 dark:text-white tabular-nums mb-1">{fmt(totalBalance)}</div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Across {wallets.length} active client accounts</p>
          </div>

          <div className="rounded-[32px] border border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-8 shadow-sm backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute right-0 bottom-0 pointer-events-none opacity-[0.03] translate-x-1/4 translate-y-1/4 group-hover:scale-110 transition-transform duration-1000 text-emerald-500">
               <ShieldCheck size={160} />
            </div>
            <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <ShieldCheck size={20} />
               </div>
               <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Health Quotient</h4>
            </div>
            <div className="text-4xl font-black text-emerald-500 tabular-nums mb-1">{healthyCount}</div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Wallets with positive credit runway</p>
          </div>

          <div className="rounded-[32px] border border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-8 shadow-sm backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute right-0 bottom-0 pointer-events-none opacity-[0.04] translate-x-1/4 translate-y-1/4 group-hover:scale-110 transition-transform duration-1000 text-rose-500">
               <AlertCircle size={160} />
            </div>
            <div className="flex items-center gap-3 mb-6">
               <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <AlertCircle size={20} />
               </div>
               <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Risk Mitigation</h4>
            </div>
            <div className="text-4xl font-black text-rose-500 tabular-nums mb-1">{lowCount}</div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Accounts requiring immediate top-up</p>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Wallet Selection Side Ledger */}
        {canManage && (
          <div className="w-full lg:w-80 shrink-0 space-y-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-2xl pl-11 pr-4 py-3 text-sm font-bold placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 transition-all" 
                placeholder="Search Client Node…" 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>
            
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {filtered.map(w => {
                 const bal = w.walletBalance || w.balance || 0;
                 const isActive = selected?.clientCode === w.clientCode;
                 return (
                   <button 
                     key={w.clientCode} 
                     onClick={() => selectWallet(w)}
                     className={`w-full text-left p-4 rounded-3xl border transition-all duration-300 relative overflow-hidden group ${
                       isActive ? 'bg-slate-900 border-slate-800 text-white shadow-xl shadow-slate-900/10' : 'bg-white dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 hover:border-blue-500/30 dark:hover:border-blue-500/30'
                     }`}
                   >
                     {isActive && <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/10 blur-3xl pointer-events-none" />}
                     <div className="flex items-center justify-between gap-3 relative z-10">
                        <div className="min-w-0">
                           <p className={`text-xs font-black uppercase tracking-widest truncate ${isActive ? 'text-blue-400' : 'text-slate-400'}`}>{w.clientCode}</p>
                           <p className={`text-sm font-black truncate max-w-[140px] ${isActive ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>{w.company || 'Unnamed Partner'}</p>
                        </div>
                        <div className="text-right">
                           <p className={`text-lg font-black tabular-nums leading-none mb-1 ${isActive ? 'text-white' : bal > 500 ? 'text-emerald-500' : 'text-rose-500'}`}>{fmt(bal)}</p>
                           {isActive && <div className="w-1 h-1 rounded-full bg-blue-500 ml-auto animate-pulse" />}
                        </div>
                     </div>
                   </button>
                 );
              })}
            </div>
          </div>
        )}

        {/* Dynamic Ledger Workstation */}
        <div className="flex-1 min-w-0">
          {!selected ? (
            <div className="h-full min-h-[400px] rounded-[40px] border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-12 text-center">
               <div className="w-20 h-20 rounded-[30px] bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-300 mb-8 border border-slate-100 dark:border-slate-800">
                  <History size={32} />
               </div>
               <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">Financial Hub Inactive</h3>
               <p className="text-sm text-slate-500 max-w-sm leading-relaxed">Select a client node from the left to engage the real-time financial ledger and reconciliation engine.</p>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
               {/* Selected Asset Header */}
               <div className="rounded-[40px] bg-slate-900 border border-slate-800 p-8 shadow-2xl shadow-slate-900/20 relative overflow-hidden group">
                  <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 blur-[100px] pointer-events-none group-hover:bg-blue-500/20 transition-all duration-1000" />
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                     <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-[24px] bg-white/5 border border-white/10 flex items-center justify-center text-white">
                           <Zap size={32} className="text-blue-500 animate-pulse" />
                        </div>
                        <div>
                           <div className="flex items-center gap-3 mb-1">
                              <h2 className="text-2xl font-black text-white leading-none">{selected.company || selected.clientCode}</h2>
                              <div className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-black text-slate-400 uppercase tracking-widest">{selected.clientCode}</div>
                           </div>
                           <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Operational Funding Node</p>
                        </div>
                     </div>
                     <div className="text-left md:text-right">
                        <div className="text-5xl font-black text-white tabular-nums tracking-tighter mb-2">{fmt(selected.walletBalance || selected.balance || 0)}</div>
                        <div className="flex items-center md:justify-end gap-3">
                           <button 
                             onClick={() => { setRechargeClient(selected); setShowRecharge(true); }}
                             className="px-5 py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all flex items-center gap-2 group/btn active:scale-95"
                           >
                             <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" /> Engage Recharge
                           </button>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Activity Ledger */}
               <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                     <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Sub-ledger Audit Log</h3>
                     <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Last {txns.length} Settlements</span>
                  </div>
                  <TransactionList transactions={txns} loading={txLoading} />
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showRecharge && (
        <RechargeModal
          clientCode={rechargeClient?.clientCode || selected?.clientCode}
          company={rechargeClient?.company || selected?.company}
          toast={toast}
          onClose={() => { setShowRecharge(false); setRechargeClient(null); }}
          onSuccess={() => { setShowRecharge(false); setRechargeClient(null); load(); if(selected) loadTxns(selected.clientCode); }}
        />
      )}

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

function RechargeModal({ clientCode, company, toast, onClose, onSuccess }) {
  const [amount,  setAmount]  = useState('');
  const [loading, setLoading] = useState(false);
  const presets = [1000, 2000, 5000, 10000, 25000];

  const initRecharge = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 100) { toast?.('Minimum recharge ₹100','error'); return; }
    setLoading(true);
    try {
      const r = await api.post('/wallet/recharge/order', { clientCode, amount: amt });
      const { order, key, devMode } = r.data;
      if (devMode) {
        toast?.(`Dev mode: simulating ₹${amt} payment success`,'info');
        await api.post('/wallet/recharge/verify', { razorpay_order_id: order.id, razorpay_payment_id: `pay_dev_${Date.now()}`, razorpay_signature: 'dev_signature', clientCode, amount: amt });
        toast?.(`₹${amt} credited successfully!`,'success');
        onSuccess();
      } else {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          const rzp = new window.Razorpay({
            key, amount: order.amount, currency: 'INR',
            name: 'Sea Hawk Logistics',
            description: `Wallet Funding — ${company || clientCode}`,
            order_id: order.id,
            handler: async (response) => {
              try {
                await api.post('/wallet/recharge/verify', { razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature, clientCode, amount: amt });
                toast?.(`₹${amt} engagement successful!`,'success');
                onSuccess();
              } catch(e) { toast?.(e.message,'error'); }
            },
            prefill: { name: company || clientCode },
            theme: { color: '#0f172a' }
          });
          rzp.open();
        };
        document.body.appendChild(script);
      }
    } catch(e) { toast?.(e.message,'error'); }
    finally { setLoading(false); }
  };

  return (
    <Modal open onClose={onClose} title="Engage Funding Hub">
      <div className="p-6 space-y-6">
        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Authenticated Client Node</p>
            <p className="text-sm font-black text-slate-800 dark:text-white uppercase">{company || clientCode}</p>
        </div>
        
        <div>
           <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Engagement Quantum (₹)</label>
           <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400">₹</span>
              <input type="number" className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-3xl pl-10 pr-4 py-4 text-3xl font-black text-slate-900 dark:text-white tabular-nums placeholder:text-slate-200" placeholder="0" value={amount} onChange={e=>setAmount(e.target.value)}/>
           </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
           {presets.map(p => (
             <button key={p} onClick={()=>setAmount(p)} className={`py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${+amount===p ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-slate-200'}`}>
                {fmt(p)}
             </button>
           ))}
        </div>

        <div className="flex gap-2 pt-4">
           <button onClick={onClose} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest rounded-3xl text-slate-500 hover:bg-slate-200">Cancel</button>
           <button onClick={initRecharge} disabled={loading || !amount} className="flex-1 py-4 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-3xl shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
              <Zap size={14} className={loading ? 'animate-pulse' : ''} /> {loading ? 'ENGAGING…' : `Recharge ${amount ? fmt(amount) : ''}`}
           </button>
        </div>
      </div>
    </Modal>
  );
}

function AdjustModal({ wallets, toast, onClose, onSuccess }) {
  const [form, setForm] = useState({ clientCode:'', type:'CREDIT', amount:'', description:'' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.clientCode || !form.amount || !form.description) { toast?.('All fields required','error'); return; }
    setSaving(true);
    try {
      await api.post('/wallet/adjust', form);
      toast?.(`Engagement ${form.type.toLowerCase()}ed successfully`,'success');
      onSuccess();
    } catch(e) { toast?.(e.message,'error'); }
    finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title="Manual Intelligence Adjustment">
      <div className="p-6 space-y-4">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Target Client</label>
          <select className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-bold" value={form.clientCode} onChange={e=>setForm(f=>({...f,clientCode:e.target.value}))}>
            <option value="">Select target node…</option>
            {wallets.map(w=><option key={w.clientCode} value={w.clientCode}>{w.company||w.clientCode} ({fmt(w.walletBalance||w.balance||0)})</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
           <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Atomic Action</label>
              <select className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-bold" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                <option value="CREDIT">Credit (Add)</option>
                <option value="DEBIT">Debit (Deduct)</option>
              </select>
           </div>
           <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Quantum (₹)</label>
              <input type="number" className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-bold" placeholder="0" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}/>
           </div>
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Audit Description</label>
          <input className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl p-4 text-sm font-bold" placeholder="Reason for adjustment…" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
        </div>
        <div className="flex gap-2 pt-4">
           <button onClick={onClose} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest rounded-3xl text-slate-500">Cancel</button>
           <button onClick={save} disabled={saving} className="flex-1 py-4 bg-slate-900 dark:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest rounded-3xl shadow-xl shadow-slate-900/10 hover:bg-black transition-all">
              {saving ? 'UPDATING LEDGER…' : 'Finalize Adjustment'}
           </button>
        </div>
      </div>
    </Modal>
  );
}
