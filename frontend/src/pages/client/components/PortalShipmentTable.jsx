import { Link } from 'react-router-dom';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { SkeletonTable } from '../../../components/ui/Skeleton';

export default function PortalShipmentTable({ loading, shipments, onSelectShipment }) {
  return (
    <section className="client-premium-card overflow-hidden p-0">
      <div className="border-b border-slate-200 px-5 py-3 dark:border-slate-700">
        <div className="text-[11px] font-black uppercase tracking-[0.12em] text-orange-500">Shipments</div>
        <h3 className="mt-1 text-lg font-black text-slate-900 dark:text-slate-100">Latest shipment activity</h3>
      </div>

      {loading && shipments.length === 0 ? (
        <div className="p-5">
          <SkeletonTable rows={6} />
        </div>
      ) : shipments.length === 0 ? (
        <div className="p-5 text-sm text-slate-500 dark:text-slate-300">
          No shipments found for this range.{' '}
          <Link to="/portal/import" className="font-bold text-orange-600 dark:text-orange-300">
            Import your first batch
          </Link>
          .
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/80">
                {['AWB', 'Consignee', 'Destination', 'Courier', 'Status', 'Action'].map((header) => (
                  <th key={header} className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.08em] text-slate-500 dark:text-slate-300">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {shipments.map((shipment) => (
                <tr
                  key={shipment.id || shipment.awb}
                  className="shipment-row cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/70"
                  onClick={() => onSelectShipment(shipment)}
                >
                  <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">{shipment.awb || '—'}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{shipment.consignee || '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{shipment.destination || '—'}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{shipment.courier || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="status-glow-wrap">
                      <StatusBadge status={shipment.status} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/portal/track?awb=${encodeURIComponent(shipment.awb || '')}`}
                      onClick={(event) => event.stopPropagation()}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
                    >
                      Track
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
