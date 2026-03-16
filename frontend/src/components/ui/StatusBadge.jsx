const STATUS_STYLES = {
  Booked:          'badge-blue',
  InTransit:       'badge-yellow',
  OutForDelivery:  'badge bg-purple-100 text-purple-800',
  Delivered:       'badge-green',
  Delayed:         'badge-red',
  RTO:             'badge bg-orange-100 text-orange-800',
  Cancelled:       'badge-gray',
};

const STATUS_LABELS = {
  InTransit: 'In Transit',
  OutForDelivery: 'Out For Delivery',
};

export function StatusBadge({ status }) {
  return (
    <span className={STATUS_STYLES[status] || 'badge-gray'}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

export const STATUSES = Object.keys(STATUS_STYLES);
