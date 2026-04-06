import { useState, useEffect, useCallback } from 'react';
import { Zap, TrendingUp, Loader2, ChevronRight, Star, IndianRupee, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

const fmt = n => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function AutoRateSuggestion({ pincode, weight, clientCode, shipType = 'doc', onSelectCourier, onSelectAmount }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const fetchSuggestion = useCallback(async () => {
    if (!pincode || pincode.length !== 6 || !weight || parseFloat(weight) <= 0) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/rates/auto-suggest', {
        pincode,
        weight: parseFloat(weight),
        shipType,
        clientCode: clientCode || undefined,
      });
      setData(res.data || res);
    } catch (err) {
      setError(err.message || 'Rate engine unavailable');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [pincode, weight, clientCode, shipType]);

  useEffect(() => {
    const timer = setTimeout(fetchSuggestion, 600);
    return () => clearTimeout(timer);
  }, [fetchSuggestion]);

  if (!pincode || pincode.length !== 6 || !weight || parseFloat(weight) <= 0) return null;

  if (loading) {
    return (
      <div className="mx-6 mb-4 flex items-center gap-3 rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50/80 to-orange-50/50 dark:from-amber-900/10 dark:to-orange-900/5 dark:border-amber-800/30 px-5 py-3.5 animate-pulse">
        <Loader2 size={16} className="text-amber-500 animate-spin" />
        <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Calculating best courier rates...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-6 mb-4 flex items-center gap-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 px-5 py-3">
        <AlertTriangle size={14} className="text-slate-400" />
        <span className="text-xs text-slate-400">{error}</span>
      </div>
    );
  }

  if (!data?.recommended) return null;

  const { recommended, suggestions = [], zone, location, sellSource } = data;
  const marginColor = recommended.margin >= 20 ? 'text-emerald-600' : recommended.margin >= 10 ? 'text-amber-600' : 'text-rose-600';
  const marginBg = recommended.margin >= 20 ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800/30' : recommended.margin >= 10 ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800/30' : 'bg-rose-50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-800/30';

  return (
    <div className="mx-6 mb-4 space-y-2 animate-in fade-in slide-in-from-top-2 duration-500">
      {/* Main recommendation banner */}
      <div className={`relative overflow-hidden rounded-2xl border ${marginBg} transition-all`}>
        <div className="flex flex-wrap items-center gap-4 px-5 py-3.5">
          {/* AI badge */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-sm">
              <Zap size={14} className="text-white" strokeWidth={3} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Smart Rate Engine</p>
              <p className="text-[10px] font-semibold text-slate-500">Zone {zone} · {location}</p>
            </div>
          </div>

          {/* Recommended courier */}
          <div className="flex items-center gap-1.5 bg-white/80 dark:bg-slate-800/80 rounded-xl px-3.5 py-2 border border-slate-100 dark:border-slate-700 shadow-sm">
            <Star size={12} className="text-amber-500 fill-amber-500" />
            <span className="text-xs font-black text-slate-800 dark:text-white">{recommended.courier}</span>
          </div>

          {/* Metrics */}
          <div className="flex items-center gap-4 ml-auto">
            <div className="text-right hidden sm:block">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Cost</p>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 tabular-nums">{fmt(recommended.cost)}</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Sell</p>
              <p className="text-xs font-black text-slate-900 dark:text-white tabular-nums">{fmt(recommended.sell)}</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Profit</p>
              <p className={`text-xs font-black tabular-nums ${marginColor}`}>
                {fmt(recommended.profit)} <span className="text-[9px]">({recommended.margin}%)</span>
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                onSelectCourier?.(recommended.courier);
                onSelectAmount?.(recommended.sell);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-orange-600 text-white text-[10px] font-black uppercase tracking-wider hover:scale-105 active:scale-95 transition-transform shadow-md"
            >
              Use This <ChevronRight size={10} strokeWidth={3} />
            </button>
            {suggestions.length > 1 && (
              <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {expanded ? 'Less' : `+${suggestions.length - 1}`}
              </button>
            )}
          </div>
        </div>

        {/* Rate source */}
        <div className="px-5 pb-2 pt-0">
          <p className="text-[9px] text-slate-400 font-semibold">
            Pricing via: <span className="font-bold text-slate-500">{sellSource}</span>
          </p>
        </div>
      </div>

      {/* Expanded alternatives */}
      {expanded && suggestions.length > 1 && (
        <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 overflow-hidden divide-y divide-slate-50 dark:divide-slate-800/50 animate-in fade-in slide-in-from-top-1 duration-300">
          {suggestions.slice(1).map((s, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-300 w-5">{i + 2}</span>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{s.label}</span>
                <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">{s.level}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-500 tabular-nums">{fmt(s.cost)}</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 tabular-nums">{fmt(s.sell)}</span>
                <span className={`text-xs font-black tabular-nums ${s.margin >= 20 ? 'text-emerald-600' : s.margin >= 10 ? 'text-amber-600' : 'text-rose-600'}`}>
                  {fmt(s.profit)} ({s.margin}%)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onSelectCourier?.(s.label);
                    onSelectAmount?.(s.sell);
                  }}
                  className="opacity-0 group-hover:opacity-100 px-2 py-1 text-[9px] font-black text-orange-600 bg-orange-50 dark:bg-orange-900/20 rounded-lg transition-opacity"
                >
                  USE
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
