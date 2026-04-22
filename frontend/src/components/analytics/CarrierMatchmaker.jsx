import { 
  Trophy, 
  Zap, 
  ShieldCheck, 
  ArrowRight,
  Crown
} from 'lucide-react';

export default function CarrierMatchmaker({ couriers }) {
  if (!couriers || couriers.length === 0) return null;

  // Intelligence Logic: Benchmarking
  const sortedByRate = [...couriers].sort((a,b) => b.deliveryRate - a.deliveryRate);
  const sortedBySpeed = [...couriers].filter(c => c.avgDeliveryDays).sort((a,b) => a.avgDeliveryDays - b.avgDeliveryDays);
  
  const reliabilityChamp = sortedByRate[0];
  const speedKing = sortedBySpeed[0];
  
  // Overall Pick (Balanced Score: Rate * (1/Speed))
  const overallPick = [...couriers]
    .filter(c => c.avgDeliveryDays && c.deliveryRate)
    .sort((a,b) => {
      const scoreA = (a.deliveryRate / a.avgDeliveryDays);
      const scoreB = (b.deliveryRate / b.avgDeliveryDays);
      return scoreB - scoreA;
    })[0] || reliabilityChamp;

  const RecommendationCard = ({ title, carrier, icon: Icon, color, metric, sub }) => (
    <div className={`p-6 rounded-[28px] border transition-all duration-500 hover:-translate-y-1 hover:shadow-xl group relative overflow-hidden ${
      color === 'blue' ? 'bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-800/50' :
      color === 'emerald' ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800/50' :
      'bg-purple-50/50 border-purple-100 dark:bg-purple-900/10 dark:border-purple-800/50'
    }`}>
      {/* Decorative Glow */}
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 blur-3xl opacity-20 pointer-events-none ${
        color === 'blue' ? 'bg-blue-500' : color === 'emerald' ? 'bg-emerald-500' : 'bg-purple-500'
      }`} />

      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
          color === 'blue' ? 'bg-blue-100 text-blue-600' : color === 'emerald' ? 'bg-emerald-100 text-emerald-600' : 'bg-purple-100 text-purple-600'
        }`}>
          <Icon size={20} />
        </div>
        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</div>
      </div>

      <div className="space-y-1">
        <h4 className="text-lg font-black text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
          {carrier.carrier || carrier.courier}
        </h4>
        <div className="flex items-center gap-2">
          <span className={`text-xl font-black tabular-nums transition-all ${
             color === 'emerald' ? 'text-emerald-500' : color === 'blue' ? 'text-blue-500' : 'text-purple-500'
          }`}>
            {metric}
          </span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{sub}</span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all">
         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">View Details</span>
         <ArrowRight size={14} className="text-slate-300" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 mb-12 animate-in fade-in slide-in-from-top-6 duration-700">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-slate-900 dark:bg-white flex items-center justify-center text-white dark:text-slate-900">
           <Crown size={20} />
        </div>
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 leading-none mb-1">Carrier Performance</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Carrier benchmarking and ranking</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reliabilityChamp && (
          <RecommendationCard 
            title="Highest Success Rate"
            carrier={reliabilityChamp}
            icon={ShieldCheck}
            color="emerald"
            metric={`${reliabilityChamp.deliveryRate || 0}%`}
            sub="Success Rate"
          />
        )}
        {speedKing && (
          <RecommendationCard 
            title="Fastest Delivery"
            carrier={speedKing}
            icon={Zap}
            color="blue"
            metric={`${(speedKing.avgDeliveryDays || 0).toFixed(1)}d`}
            sub="Avg Lead Time"
          />
        )}
        {overallPick && (
          <RecommendationCard 
            title="Top Recommended"
            carrier={overallPick}
            icon={Trophy}
            color="purple"
            metric={overallPick.carrier || overallPick.courier || 'N/A'}
            sub="Highest Efficiency Score"
          />
        )}
      </div>
    </div>
  );
}
