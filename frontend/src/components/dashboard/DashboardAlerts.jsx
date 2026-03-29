import { AlertTriangle, BellRing } from 'lucide-react';

function AlertPill({ children, tone = 'amber' }) {
  const tones = {
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export default function DashboardAlerts({ actions, rtoAlerts }) {
  if ((!actions?.total && !rtoAlerts?.length)) return null;

  return (
    <div className="space-y-3">
      {rtoAlerts?.length > 0 && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 text-sm font-bold text-rose-700">
              <AlertTriangle size={16} />
              High RTO corridors need intervention
            </div>
            {rtoAlerts.map((a) => (
              <AlertPill key={a.courier} tone="red">{a.courier} · {a.rate}% RTO</AlertPill>
            ))}
          </div>
        </div>
      )}

      {actions?.total > 0 && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 text-sm font-bold text-amber-700">
              <BellRing size={16} />
              {actions.total} operational items need attention
            </div>
            {actions.pendingNDRs > 0 && <AlertPill>{actions.pendingNDRs} NDRs</AlertPill>}
            {actions.draftInvoices > 0 && <AlertPill>{actions.draftInvoices} draft invoices</AlertPill>}
            {actions.todayPickups > 0 && <AlertPill>{actions.todayPickups} pickups</AlertPill>}
            {actions.rtoShipments > 0 && <AlertPill>{actions.rtoShipments} RTOs</AlertPill>}
            {actions.overdueShipments > 0 && <AlertPill>{actions.overdueShipments} overdue in-transit</AlertPill>}
          </div>
        </div>
      )}
    </div>
  );
}
