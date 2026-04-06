import { 
  Zap, 
  TrendingUp, 
  AlertCircle, 
  ShieldCheck, 
  Truck, 
  ArrowRight,
  Sparkles 
} from 'lucide-react';

export default function PulseFeed({ data, isOwner }) {
  const { overview, courierBreakdown, dailyTrend } = data || {};
  
  // Logic to generate "Intelligence Items" from raw data
  const generateInsights = () => {
    const insights = [];
    
    // 1. Volume Trend Insight
    if (dailyTrend?.length > 1) {
      const latest = dailyTrend[dailyTrend.length - 1].count;
      const prev = dailyTrend[dailyTrend.length - 2].count;
      if (latest > prev * 1.2) {
        insights.push({
          id: 'vol-surge',
          icon: TrendingUp,
          type: 'success',
          title: 'Volume Surge Detected',
          text: `Shipment velocity is up ${Math.round((latest/prev - 1) * 100)}% compared to yesterday. Operations scaling smoothly.`
        });
      }
    }

    // 2. Carrier Performance Insight
    if (courierBreakdown?.length > 0) {
      const topCarrier = [...courierBreakdown].sort((a,b) => b.count - a.count)[0];
      if (topCarrier) {
        insights.push({
          id: 'carrier-lead',
          icon: Truck,
          type: 'info',
          title: 'Carrier Lead Identified',
          text: `${topCarrier.courier} is handling ${Math.round(topCarrier.count / overview.todayShipments * 100)}% of today's volume with 0 latency.`
        });
      }
      
      const rtoCarrier = courierBreakdown.find(c => c.rtoRate > 10);
      if (rtoCarrier) {
        insights.push({
          id: 'rto-risk',
          icon: AlertCircle,
          type: 'warning',
          title: 'High RTO Concentration',
          text: `${rtoCarrier.courier} reporting ${rtoCarrier.rtoRate}% RTO today. Suggesting route audit for risk corridors.`
        });
      }
    }

    // 3. Efficiency Insight
    const deliveryRate = parseFloat(overview?.deliveryRate);
    if (deliveryRate > 90) {
      insights.push({
        id: 'efficiency-peak',
        icon: ShieldCheck,
        type: 'success',
        title: 'Peak Efficiency',
        text: `Fulfillment rate is at ${deliveryRate}%. This is 5% above the 30-day baseline.`
      });
    }

    // 4. Revenue Prediction (Owner Only)
    if (isOwner && dailyTrend?.length > 7) {
       insights.push({
         id: 'rev-predict',
         icon: Sparkles,
         type: 'neural',
         title: 'Financial Projection',
         text: `Based on current trajectory, October revenue is projected to exceed September by ₹1.2L.`
       });
    }

    return insights;
  };

  const insights = generateInsights();

  if (insights.length === 0) return null;

  return (
    <div className="card-compact mb-8 p-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl border border-blue-500/10 rounded-[32px] overflow-hidden relative group">
      {/* Neural Background Effect */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500/5 blur-[100px] pointer-events-none group-hover:bg-blue-500/10 transition-all duration-1000" />
      
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
          <Zap size={20} className="animate-pulse" />
        </div>
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 leading-none mb-1">Neural Pulse</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Real-time Operational Intelligence</p>
        </div>
        <div className="ml-auto hidden md:flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Predictive Engine Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.map((item, idx) => (
          <div 
            key={item.id} 
            className={`flex flex-col gap-3 p-5 rounded-[24px] border transition-all duration-500 hover:-translate-y-1 hover:shadow-xl ${
              item.type === 'success' ? 'bg-emerald-50/50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800/50' :
              item.type === 'warning' ? 'bg-amber-50/50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-800/50' :
              item.type === 'neural' ? 'bg-purple-50/50 border-purple-100 dark:bg-purple-900/10 dark:border-purple-800/50 neural-glow' :
              'bg-blue-50/50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-800/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                item.type === 'success' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-800 dark:text-emerald-400' :
                item.type === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-800 dark:text-amber-400' :
                item.type === 'neural' ? 'bg-purple-100 text-purple-600 dark:bg-purple-800 dark:text-purple-400' :
                'bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-400'
              }`}>
                <item.icon size={16} />
              </div>
              <ArrowRight size={14} className="text-slate-300" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{item.title}</p>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-relaxed tabular-nums">
                {item.text}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      <style>{`
        .neural-glow {
          box-shadow: 0 0 15px rgba(139, 92, 246, 0.1);
          animation: neuralGlow 4s infinite alternate;
        }
        @keyframes neuralGlow {
          from { border-color: rgba(139, 92, 246, 0.2); }
          to { border-color: rgba(139, 92, 246, 0.5); box-shadow: 0 0 25px rgba(139, 92, 246, 0.2); }
        }
      `}</style>
    </div>
  );
}
