import React from 'react';
import { CheckCircle, FileText, Loader, Printer, X, ClipboardCheck, ArrowUpRight, Save, Target, AlertTriangle, Activity } from 'lucide-react';

export default function QuoteBuilder({
  results,
  quoteCourier,
  setQuoteCourier,
  fmt,
  fmtP,
  quoteNote,
  setQuoteNote,
  handlePrint,
  best,
  handleSaveQuote,
  savingQuote,
  quoteSaved,
  setQuoteSaved,
  locInfo,
  query,
  chargeWt,
}) {
  if (!results.length) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-3 reveal">
      <div className="card-premium p-8 h-full flex flex-col">
        <div className="flex items-center gap-3 mb-8">
           <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
              <ClipboardCheck size={20} />
           </div>
           <div>
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5 leading-none">Parameters</h2>
              <p className="text-sm font-black text-slate-800 dark:text-white uppercase leading-none">Build Engagement</p>
           </div>
        </div>
        
        <div className="space-y-8 flex-1">
          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-3 opacity-60">1. Target Channel Selection</label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
              {results.map((result) => {
                const active = quoteCourier?.id === result.id;
                return (
                  <button
                    key={result.id}
                    onClick={() => setQuoteCourier(result)}
                    className={`w-full text-left px-4 py-3.5 rounded-[22px] border transition-all duration-300 flex items-center justify-between group/item ${
                      active 
                        ? 'border-blue-500/30 bg-blue-500/[0.03] shadow-lg shadow-blue-500/5' 
                        : 'border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                       <div className={`w-2 h-2 rounded-full ${active ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-200'}`} />
                       <div className="flex flex-col">
                          <span className={`text-xs font-black transition-colors ${active ? 'text-blue-600' : 'text-slate-800 dark:text-slate-200'}`}>{result.label}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{result.mode}</span>
                       </div>
                    </div>
                    <div className="text-right">
                       <span className={`text-[11px] font-black tabular-nums block ${result.profit > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{fmt(result.profit)}</span>
                       <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter opacity-60">{fmtP(result.margin)} Margin</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-3 opacity-60">2. Mission Directives</label>
            <textarea 
               className="input py-4 text-xs h-24 resize-none border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-black/20 focus:bg-white dark:focus:bg-black transition-all" 
               placeholder="Specify transit timelines, handling protocols, or contractual nuances…" 
               value={quoteNote} 
               onChange={(e) => setQuoteNote(e.target.value)} 
            />
          </div>

          <div className="flex gap-4">
            <button 
               onClick={handlePrint} 
               disabled={!quoteCourier && !best} 
               className="flex-1 bg-slate-900 hover:bg-black text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-3 border border-white/5"
            >
              <Printer size={16} className="text-orange-400" /> Dispatch PDF
            </button>
            <button 
               onClick={handleSaveQuote} 
               disabled={(!quoteCourier && !best) || savingQuote} 
               className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20"
            >
              {savingQuote ? (
                 <Loader size={16} className="animate-spin" />
              ) : (
                 <Save size={16} />
              )}
              Archive to Ledger
            </button>
          </div>

          {quoteSaved && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                 <CheckCircle size={20} />
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">Sequence Logged — {quoteSaved.quoteNo}</p>
                <div className="flex items-center gap-2 mt-0.5">
                   <p className="text-[10px] font-bold text-emerald-600/60 uppercase">Registry Updated</p>
                   <div className="w-1 h-1 rounded-full bg-emerald-300" />
                   <a href="/quotes" className="text-[10px] font-black text-emerald-500 uppercase underline underline-offset-2 hover:text-emerald-700 transition-colors">History</a>
                </div>
              </div>
              <button onClick={() => setQuoteSaved(null)} className="p-2 text-emerald-400 hover:text-emerald-700 transition-colors">
                 <X size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card-premium p-8 h-full flex flex-col bg-slate-900 border-slate-800 text-white overflow-hidden relative group/prev">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[100px]" />
        
        <div className="flex items-center justify-between mb-8 relative z-10">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/5 text-slate-300 flex items-center justify-center border border-white/10 shrink-0">
                 <FileText size={20} />
              </div>
              <div>
                 <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5 leading-none">Visualization</h2>
                 <p className="text-sm font-black text-white uppercase leading-none">Draft Manifest</p>
              </div>
           </div>
           <div className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
              Live Capture
           </div>
        </div>

        {(quoteCourier || best) && (() => {
          const selected = quoteCourier || best;
          return (
            <div className="flex-1 flex flex-col space-y-6 relative z-10">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Terminal', value: locInfo?.label || query, icon: Target },
                  { label: 'Network', value: selected.label, icon: Activity },
                  { label: 'Protocol', value: selected.mode, icon: Target },
                  { label: 'Payload', value: `${chargeWt.toFixed(2)} KG`, icon: Target },
                ].map((item) => (
                  <div key={item.label} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 group-hover/prev:border-white/10 transition-colors">
                    <div className="flex items-center gap-2 mb-2 opacity-40">
                       <item.icon size={10} />
                       <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                    </div>
                    <p className="font-black text-sm text-slate-200 tracking-tight truncate">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex-1 p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-4">
                 <div className="flex items-center justify-between text-slate-500 border-b border-white/5 pb-4 mb-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Operational Delta</span>
                    <div className="flex items-center gap-4">
                       <div className="flex flex-col items-end">
                          <span className="text-[9px] font-black opacity-40 uppercase mb-1">Contract Cost</span>
                          <span className="text-sm font-bold tabular-nums text-slate-400">{fmt(selected.bk.total)}</span>
                       </div>
                    </div>
                 </div>

                 <div className="flex items-center justify-between pt-2">
                    <div className="flex flex-col">
                       <span className="text-[11px] font-black text-blue-400/80 uppercase tracking-[0.25em] mb-2">Selling Directive</span>
                       <span className="text-5xl font-black tabular-nums tracking-tighter text-white">{fmt(selected.sell)}</span>
                    </div>
                    <div className="text-right">
                       <div className="flex items-center gap-2 justify-end mb-2">
                          <ArrowUpRight size={16} className={selected.profit > 0 ? 'text-emerald-500' : 'text-rose-500'} />
                          <span className={`text-2xl font-black tabular-nums ${selected.profit > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                             {fmt(selected.profit)}
                          </span>
                       </div>
                       <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest inline-block ${selected.profit > 0 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
                          {fmtP(selected.margin)} Yield
                       </div>
                    </div>
                 </div>
              </div>

              {quoteNote && (
                 <div className="relative p-6 rounded-2xl bg-amber-500/[0.03] border border-amber-500/10 flex gap-4">
                    <div className="shrink-0 w-5 h-5 rounded-md bg-amber-500/20 flex items-center justify-center">
                       <AlertTriangle size={12} className="text-amber-500" />
                    </div>
                    <div className="flex-1">
                       <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1 block">Logistial Notes</span>
                       <p className="text-xs font-bold text-amber-600/80 italic leading-relaxed">"{quoteNote}"</p>
                    </div>
                 </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
