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
      if (prev > 0 && latest > prev * 1.2) {
        insights.push({
          id: 'vol-surge',
          icon: TrendingUp,
          type: 'success',
          title: 'Volume Surge Detected',
          text: `Shipment volume is up ${Math.round((latest/prev - 1) * 100)}% compared to yesterday. Operations scaling smoothly.`
        });
      }
    }

    // 2. Carrier Performance Insight
    if (courierBreakdown?.length > 0) {
      const topCarrier = [...courierBreakdown].sort((a,b) => b.count - a.count)[0];
      const totalVolume = overview?.totalShipments || 1; // Prevent division by zero
      if (topCarrier && topCarrier.count > 0) {
        insights.push({
          id: 'carrier-lead',
          icon: Truck,
          type: 'info',
          title: 'Carrier Lead Identified',
          text: `${topCarrier.courier} is handling ${Math.round((topCarrier.count / totalVolume) * 100)}% of the selected volume with optimal latency.`
        });
      }
      
      const rtoCarrier = courierBreakdown.find(c => c.rtoRate > 10);
      if (rtoCarrier) {
        insights.push({
          id: 'rto-risk',
          icon: AlertCircle,
          type: 'warning',
          title: 'High RTO Concentration',
          text: `${rtoCarrier.courier} reporting ${rtoCarrier.rtoRate}% RTO. Suggesting route audit for risk corridors.`
        });
      }
    }

    // 3. Efficiency Insight
    const deliveryRate = parseFloat(overview?.deliveryRate || 0);
    if (deliveryRate > 90) {
      insights.push({
        id: 'efficiency-peak',
        icon: ShieldCheck,
        type: 'success',
        title: 'Peak Efficiency',
        text: `Fulfillment rate is at ${deliveryRate}%. Operations are running efficiently above baseline.`
      });
    }

    // 4. Revenue Prediction (Owner Only)
    if (isOwner && dailyTrend?.length > 7) {
       // Real dynamic projection based on recent trend average
       const recentAvg = dailyTrend.slice(-7).reduce((acc, curr) => acc + (curr.revenue || 0), 0) / 7;
       const projectedMonthly = recentAvg * 30;
       
       if (projectedMonthly > 0) {
         insights.push({
           id: 'rev-predict',
           icon: Sparkles,
           type: 'neural',
           title: 'Financial Projection',
           text: `Based on the 7-day moving average, projected monthly revenue is tracking at ₹${projectedMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}.`
         });
       }
    }

    return insights;
  };

  const insights = generateInsights();

  if (insights.length === 0) return null;

  return (
    <div className="card-compact mb-8 p-6 bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden relative group dark:bg-slate-900 dark:border-slate-800">
      
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          <Zap size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-0.5">System Alerts & Insights</h3>
          <p className="text-xs font-medium text-slate-500">Real-time Operational Intelligence</p>
        </div>
        <div className="ml-auto hidden md:flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-emerald-500" />
           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Engine Online</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights.map((item) => (
          <div 
            key={item.id} 
            className={`flex flex-col gap-3 p-5 rounded-xl border ${
              item.type === 'success' ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-800/30' :
              item.type === 'warning' ? 'bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-800/30' :
              item.type === 'neural' ? 'bg-purple-50 border-purple-100 dark:bg-purple-900/10 dark:border-purple-800/30' :
              'bg-blue-50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-800/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                item.type === 'success' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-800 dark:text-emerald-400' :
                item.type === 'warning' ? 'bg-amber-100 text-amber-600 dark:bg-amber-800 dark:text-amber-400' :
                item.type === 'neural' ? 'bg-purple-100 text-purple-600 dark:bg-purple-800 dark:text-purple-400' :
                'bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-400'
              }`}>
                <item.icon size={16} />
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">{item.title}</p>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {item.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
