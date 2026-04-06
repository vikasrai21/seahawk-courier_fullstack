import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Clock, 
  FileText,
  CreditCard,
  History
} from 'lucide-react';

const fmt    = n => `₹${Number(n||0).toLocaleString('en-IN')}`;
const fmtDt  = d => new Date(d).toLocaleDateString('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

export default function TransactionList({ transactions, loading, emptyMessage }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <div className="w-8 h-8 rounded-full border-2 border-orange-500/20 border-t-orange-500 animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Ledger Delta</p>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-300 mb-4 border border-slate-100 dark:border-slate-800">
           <History size={24} />
        </div>
        <p className="text-sm font-bold text-slate-500">{emptyMessage || 'No recent activity detected'}</p>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Immutable Financial Record</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {transactions.map((t, idx) => {
        const isCredit = t.type === 'CREDIT' || t.type === 'RECHARGE';
        const isDebit = t.type === 'DEBIT' || t.type === 'SHIPMENT_CHARGE';
        
        return (
          <div 
            key={t.id || idx} 
            className="group flex items-center gap-4 p-4 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:border-orange-200 dark:hover:border-orange-500/30 hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300 backdrop-blur-sm"
          >
            {/* Icon Status */}
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              isCredit ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
              isDebit ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400' :
              'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
            }`}>
              {isCredit ? <ArrowUpCircle size={18} /> : isDebit ? <ArrowDownCircle size={18} /> : <FileText size={18} />}
            </div>

            {/* Description & Metadata */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-black text-slate-800 dark:text-white truncate">
                  {t.description || 'Logistics Transaction'}
                </span>
                {t.reference && (
                  <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase tracking-widest">
                    Ref: {t.reference}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <Clock size={10} />
                  {fmtDt(t.createdAt)}
                </div>
                <div className="flex items-center gap-1 text-[10px] font-black text-orange-500/70 uppercase tracking-widest">
                  <CreditCard size={10} />
                  {t.payment_method || 'Wallet'}
                </div>
              </div>
            </div>

            {/* Amount & Remaining Balance */}
            <div className="text-right shrink-0">
               <div className={`text-sm font-black tabular-nums ${isCredit ? 'text-emerald-500' : isDebit ? 'text-rose-500' : 'text-blue-500'}`}>
                 {isCredit ? '+' : isDebit ? '-' : ''}{fmt(t.amount)}
               </div>
               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest tabular-nums">
                 Bal: {fmt(t.balance)}
               </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
