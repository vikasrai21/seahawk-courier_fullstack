import { Activity, Package2 } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { StatusBadge } from '../ui/StatusBadge';
import { useNavigate } from 'react-router-dom';

function Card({ title, icon: Icon, children, delay = 0 }) {
  return (
    <div
      className="rounded-3xl border border-slate-200 dark:border-[rgba(99,130,191,0.1)] bg-white dark:bg-[rgba(13,20,37,0.65)] p-5 shadow-sm dark:shadow-[0_8px_24px_rgba(0,0,0,0.3)] animate-in dark:backdrop-blur-xl"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mb-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
        <Icon size={14} />
        {title}
      </div>
      {children}
    </div>
  );
}

export default function DashboardRecentShipments({ shipments, activity }) {
  const navigate = useNavigate();

  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
      <Card title="Recent Shipments" icon={Package2} delay={100}>
        {shipments?.length ? (
          <div className="space-y-2.5">
            {shipments.map((shipment, i) => (
              <div
                key={shipment.id}
                onClick={() => navigate('/app/shipments')}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 dark:border-[rgba(99,130,191,0.08)] bg-slate-50/50 dark:bg-[rgba(13,20,37,0.4)] px-4 py-3 cursor-pointer transition-all hover:border-orange-200 dark:hover:border-orange-500/20 hover:shadow-sm hover:-translate-y-px active:scale-[0.99] animate-in"
                style={{ animationDelay: `${150 + i * 40}ms` }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-900 dark:text-white truncate">{shipment.awb}</span>
                    {shipment.courier && (
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">{shipment.courier}</span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">{shipment.clientCode}</span>
                    {shipment.client?.company && <span className="mx-1">·</span>}
                    {shipment.client?.company && <span>{shipment.client.company}</span>}
                    {shipment.destination && <span className="mx-1">→</span>}
                    {shipment.destination && <span>{shipment.destination}</span>}
                  </div>
                </div>
                <StatusBadge status={shipment.status} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon="📭" title="No recent shipments" message="Recent shipment cards will appear here after new activity." />
        )}
      </Card>

      <Card title="Recent Activity" icon={Activity} delay={200}>
        {activity?.length ? (
          <div className="space-y-2.5">
            {activity.map((item, i) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-100 dark:border-[rgba(99,130,191,0.08)] bg-slate-50/50 dark:bg-[rgba(13,20,37,0.4)] px-4 py-3 animate-in"
                style={{ animationDelay: `${250 + i * 40}ms` }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{item.user || 'System'}</span>
                  <span className="text-[10px] text-slate-400 tabular-nums whitespace-nowrap">
                    {item.time ? new Date(item.time).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : ''}
                  </span>
                </div>
                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {item.action} {item.entityId ? <span className="font-mono font-bold text-slate-600 dark:text-slate-300">#{item.entityId}</span> : ''}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon="🕒" title="No activity yet" message="Audit activity will populate here after operational changes." />
        )}
      </Card>
    </div>
  );
}
