import { Activity, Package2 } from 'lucide-react';
import { EmptyState } from '../ui/EmptyState';
import { StatusBadge } from '../ui/StatusBadge';

function Card({ title, icon: Icon, children }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm animate-[fadeIn_.45s_ease]">
      <div className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
        <Icon size={14} />
        {title}
      </div>
      {children}
    </div>
  );
}

export default function DashboardRecentShipments({ shipments, activity }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
      <Card title="Recent Shipments" icon={Package2}>
        {shipments?.length ? (
          <div className="space-y-3">
            {shipments.map((shipment) => (
              <div key={shipment.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div>
                  <div className="font-mono text-sm font-bold text-slate-900">{shipment.awb}</div>
                  <div className="mt-1 text-xs text-slate-500">{shipment.clientCode} · {shipment.destination || 'No destination'}</div>
                </div>
                <StatusBadge status={shipment.status} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon="📭" title="No recent shipments" message="Recent shipment cards will appear here after new activity." />
        )}
      </Card>

      <Card title="Recent Activity" icon={Activity}>
        {activity?.length ? (
          <div className="space-y-3">
            {activity.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="text-sm font-semibold text-slate-900">{item.user || 'System'}</div>
                <div className="mt-1 text-sm text-slate-600">{item.action} {item.entityId ? `· ${item.entityId}` : ''}</div>
                <div className="mt-1 text-xs text-slate-400">{item.time ? new Date(item.time).toLocaleString('en-IN') : ''}</div>
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
