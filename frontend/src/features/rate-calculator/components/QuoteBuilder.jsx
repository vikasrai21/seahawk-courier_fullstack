import React from 'react';
import { CheckCircle, FileText, Loader, Printer, X } from 'lucide-react';

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
  selClient,
  chargeWt,
  pColor,
}) {
  if (!results.length) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h2 className="font-bold text-sm text-gray-700 mb-3">Build Quote</h2>
        <div className="space-y-2">
          <div>
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wide block mb-1">Select Courier</label>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => setQuoteCourier(result)}
                  className={`w-full text-left px-3 py-2 rounded-xl border text-xs transition-all flex items-center justify-between ${quoteCourier?.id === result.id ? 'border-slate-700 bg-slate-50' : 'border-gray-100 hover:border-gray-300'}`}
                >
                  <span><strong>{result.label}</strong> <span className="text-gray-400">({result.mode})</span></span>
                  <span className={result.profit > 0 ? 'text-green-700 font-bold' : 'text-red-500 font-bold'}>{fmt(result.profit)} · {fmtP(result.margin)}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wide block mb-1">Additional Notes (optional)</label>
            <textarea className="input text-xs h-16 resize-none" placeholder="Transit time, special handling, terms…" value={quoteNote} onChange={(e) => setQuoteNote(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrint} disabled={!quoteCourier && !best} className="flex-1 bg-slate-800 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center gap-2">
              <Printer className="w-4 h-4" />Print PDF
            </button>
            <button onClick={handleSaveQuote} disabled={(!quoteCourier && !best) || savingQuote} className="flex-1 bg-green-700 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2">
              {savingQuote ? <><Loader className="w-4 h-4 animate-spin" />Saving…</> : <><CheckCircle className="w-4 h-4" />Save to DB</>}
            </button>
          </div>
          {quoteSaved && (
            <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-green-800">Quote saved — {quoteSaved.quoteNo}</p>
                <p className="text-[10px] text-green-600">View in <a href="/quotes" className="underline">Quote History</a></p>
              </div>
              <button onClick={() => setQuoteSaved(null)} className="ml-auto text-green-400 hover:text-green-600"><X className="w-3 h-3" /></button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <h2 className="font-bold text-sm text-gray-700 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" />Quote Preview
        </h2>
        {(quoteCourier || best) && (() => {
          const selected = quoteCourier || best;
          return (
            <div className="text-xs space-y-2">
              <div className="bg-slate-800 text-white rounded-xl p-3">
                <p className="font-bold text-base">Seahawk Logistics</p>
                <p className="opacity-60 text-[10px]">{new Date().toLocaleDateString('en-IN')} · Valid 30 days</p>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  ['Destination', locInfo?.label || query],
                  ['Client', selClient?.company || '—'],
                  ['Courier', selected.label],
                  ['Mode', selected.mode],
                  ['Weight', `${chargeWt} kg`],
                  ['Courier Cost', fmt(selected.bk.total)],
                ].map(([label, value]) => (
                  <div key={label} className="bg-gray-50 rounded-lg px-2.5 py-2">
                    <p className="text-[9px] text-gray-400 uppercase">{label}</p>
                    <p className="font-semibold text-gray-800">{value}</p>
                  </div>
                ))}
              </div>
              <div className={`rounded-xl p-3 flex justify-between items-center ${selected.profit > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Your Selling Price</p>
                  <p className="text-2xl font-bold text-slate-800">{fmt(selected.sell)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-gray-500">Profit</p>
                  <p className={`text-lg font-bold ${selected.profit > 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(selected.profit)}</p>
                  <p className={`text-xs font-semibold ${pColor(selected.margin)}`}>{fmtP(selected.margin)} margin</p>
                </div>
              </div>
              {quoteNote && <p className="text-[10px] text-gray-500 italic">{quoteNote}</p>}
            </div>
          );
        })()}
      </div>
    </div>
  );
}
