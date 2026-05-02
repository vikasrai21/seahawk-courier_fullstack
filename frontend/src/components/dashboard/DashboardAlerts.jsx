import { BellRing, ChevronRight, Info, Zap, ShieldAlert } from 'lucide-react';

function AlertCard({ icon: Icon, title, description, badge, tone = 'blue', onClick }) {
  const tones = {
    blue: {
      bg: 'bg-blue-50/50 dark:bg-blue-900/10',
      border: 'border-blue-100 dark:border-blue-800',
      iconBg: 'bg-blue-100 dark:bg-blue-800',
      iconColor: 'text-blue-600 dark:text-blue-400',
      badge: 'bg-blue-600 text-white',
      hover: 'hover:border-blue-300 dark:hover:border-blue-700'
    },
    amber: {
      bg: 'bg-amber-50/50 dark:bg-amber-900/10',
      border: 'border-amber-100 dark:border-amber-800',
      iconBg: 'bg-amber-100 dark:bg-amber-800',
      iconColor: 'text-amber-600 dark:text-amber-400',
      badge: 'bg-amber-600 text-white',
      hover: 'hover:border-amber-300 dark:hover:border-amber-700'
    },
    rose: {
      bg: 'bg-rose-50/50 dark:bg-rose-900/10',
      border: 'border-rose-100 dark:border-rose-800',
      iconBg: 'bg-rose-100 dark:bg-rose-800',
      iconColor: 'text-rose-600 dark:text-rose-400',
      badge: 'bg-rose-600 text-white',
      hover: 'hover:border-rose-300 dark:hover:border-rose-700'
    },
    emerald: {
      bg: 'bg-emerald-50/50 dark:bg-emerald-900/10',
      border: 'border-emerald-100 dark:border-emerald-800',
      iconBg: 'bg-emerald-100 dark:bg-emerald-800',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      badge: 'bg-emerald-600 text-white',
      hover: 'hover:border-emerald-300 dark:hover:border-emerald-700'
    }
  };

  const T = tones[tone];

  return (
    <div 
      onClick={onClick}
      className={`group relative flex items-center gap-4 p-4 rounded-[24px] border transition-all duration-300 cursor-pointer ${T.bg} ${T.border} ${T.hover} shadow-sm active:scale-[0.98]`}
    >
      <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${T.iconBg} ${T.iconColor}`}>
        <Icon size={20} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white truncate">
            {title}
          </h4>
          {badge && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${T.badge}`}>
              {badge}
            </span>
          )}
        </div>
        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate tracking-tight">
          {description}
        </p>
      </div>

      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all text-slate-400">
        <ChevronRight size={16} />
      </div>

      {/* Decorative pulse for high priority */}
      {tone === 'rose' && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-pulse border-2 border-white dark:border-slate-900" />
      )}
    </div>
  );
}

export default function DashboardAlerts({ actions, rtoAlerts, navigate }) {
  const hasAlerts = (actions?.total > 0) || (rtoAlerts?.length > 0);

  if (!hasAlerts) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 fade-in-up">
      {/* SLA Interventions */}
      {actions?.overdueShipments > 0 && (
        <AlertCard
          icon={ShieldAlert}
          tone="rose"
          title="SLA Breach Risk"
          description={`${actions.overdueShipments} shipments past expected delivery`}
          badge={actions.overdueShipments}
          onClick={() => navigate?.('/app/shipments?filter=sla_breach')}
        />
      )}

      {/* RTO Concentration */}
      {rtoAlerts?.length > 0 && (
        <AlertCard
          icon={Zap}
          tone="amber"
          title="RTO Heatmap Alert"
          description={`${rtoAlerts[0].courier} reporting ${rtoAlerts[0].rate}% failure rate`}
          badge="High Risk"
          onClick={() => navigate?.('/app/analytics')}
        />
      )}

      {/* Operational NDRs */}
      {actions?.pendingNDRs > 0 && (
        <AlertCard
          icon={BellRing}
          tone="blue"
          title="Actionable NDRs"
          description="Consignee issues requiring urgent resolution"
          badge={actions.pendingNDRs}
          onClick={() => navigate?.('/app/ndr')}
        />
      )}

      {/* Pipeline Pickups */}
      {actions?.todayPickups > 0 && (
        <AlertCard
          icon={Info}
          tone="emerald"
          title="Pickup Volume"
          description={`${actions.todayPickups} assigned for carrier pickup today`}
          badge={actions.todayPickups}
          onClick={() => navigate?.('/app/pickups')}
        />
      )}
    </div>
  );
}
