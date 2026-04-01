import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CalendarDays, Phone, Package, MapPin } from 'lucide-react';
import api from '../services/api';
import { PageHeader } from '../components/ui/PageHeader';
import { PageLoader, EmptyState } from '../components/ui/Loading';
import { Modal } from '../components/ui/Modal';

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'ASSIGNED', 'COMPLETED', 'CANCELLED'];

const STATUS_STYLES = {
  PENDING: 'badge-amber',
  CONFIRMED: 'badge-blue',
  ASSIGNED: 'badge-blue',
  COMPLETED: 'badge-green',
  CANCELLED: 'badge-rose',
};

function BookingStatus({ status }) {
  return <span className={`badge ${STATUS_STYLES[status] || 'badge-gray'}`}>{status}</span>;
}

export default function BookingsPage({ toast }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'ALL') params.set('status', filter);
      if (search) params.set('search', search);
      const res = await api.get(`/pickups?${params}`);
      setBookings(res.data?.pickups || []);
    } catch (e) {
      toast?.('Failed to load pickup requests', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, search, toast]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  async function updateStatus(id, status) {
    setUpdating(true);
    try {
      await api.patch(`/pickups/${id}/status`, { status });
      await fetchBookings();
      if (selected?.id === id) setSelected((p) => ({ ...p, status }));
      toast?.('Pickup status updated', 'success');
    } catch (e) {
      toast?.('Failed to update pickup status', 'error');
    } finally {
      setUpdating(false);
    }
  }

  const filtered = bookings.filter((b) => {
    if (filter !== 'ALL' && b.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        b.requestNo?.toLowerCase().includes(q) ||
        b.contactName?.toLowerCase().includes(q) ||
        b.contactPhone?.includes(q) ||
        b.pickupCity?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = bookings.filter((b) => b.status === s).length;
    return acc;
  }, {});

  const totalPending = counts.PENDING || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Pickup Requests"
        subtitle={`${bookings.length} total requests · ${totalPending} pending confirmation`}
        icon={CalendarDays}
        actions={(
          <button onClick={fetchBookings} className="btn-secondary btn-sm">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        )}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
        {[['ALL', bookings.length], ...STATUS_OPTIONS.map((s) => [s, counts[s] || 0])].map(([label, count]) => (
          <button
            key={label}
            onClick={() => setFilter(label)}
            className={`card-compact text-left interactive-lift ${filter === label ? 'border-orange-200 bg-orange-50/70' : ''}`}
          >
            <div className="section-eyebrow">{label}</div>
            <div className="mt-2 text-2xl font-black text-slate-900">{count}</div>
            <div className="mt-1 text-xs text-slate-500">pickup requests</div>
          </button>
        ))}
      </div>

      <div className="card-compact mb-5">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer, phone, request number, or city"
            className="input"
          />
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="badge badge-gray">{filtered.length} shown</span>
          </div>
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <EmptyState icon="📭" title="No pickup requests found" message="Try a different status filter or search term." />
      ) : (
        <div className="table-shell overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[1080px]">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-3 text-left">Ref No</th>
                  <th className="px-4 py-3 text-left">Customer</th>
                  <th className="px-4 py-3 text-left">Pickup City</th>
                  <th className="px-4 py-3 text-left">Delivery</th>
                  <th className="px-4 py-3 text-left">Package</th>
                  <th className="px-4 py-3 text-left">Date / Slot</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Update</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((b) => (
                  <tr key={b.id} className="table-row cursor-pointer" onClick={() => setSelected(b)}>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-orange-600">{b.requestNo}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{b.contactName}</div>
                      <div className="text-xs text-slate-500">{b.contactPhone}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{b.pickupCity}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{b.deliveryCity || '—'}, {b.deliveryCountry}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      <div>{b.packageType}</div>
                      <div className="text-xs text-slate-400">{b.weightGrams}kg · {b.pieces}pc</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      <div className="font-semibold text-slate-900">{b.scheduledDate}</div>
                      <div className="text-xs text-slate-400">{b.timeSlot}</div>
                    </td>
                    <td className="px-4 py-3"><BookingStatus status={b.status} /></td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={b.status}
                        onChange={(e) => updateStatus(b.id, e.target.value)}
                        disabled={updating}
                        className="input !w-auto !py-2 text-xs min-w-[150px]"
                      >
                        {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Pickup ${selected.requestNo}` : 'Pickup Details'}
        size="lg"
        footer={selected ? (
          <>
            <a
              href={`https://wa.me/${(selected.contactPhone || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${selected.contactName}, your pickup request ${selected.requestNo} is ${selected.status}. Thank you for choosing Sea Hawk Courier!`)}`}
              target="_blank"
              rel="noreferrer"
              className="btn-success"
            >
              <Phone className="w-4 h-4" /> WhatsApp Customer
            </a>
            <button onClick={() => setSelected(null)} className="btn-secondary">Close</button>
          </>
        ) : null}
      >
        {selected && (
          <div className="grid gap-4">
            <div className="flex items-center justify-between">
              <BookingStatus status={selected.status} />
              <div className="text-xs text-slate-500">Request raised for {selected.scheduledDate}</div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <DetailCard icon={<Phone className="w-4 h-4 text-sky-600" />} title="Contact" value={`${selected.contactName}\n${selected.contactPhone}${selected.contactEmail ? `\n${selected.contactEmail}` : ''}`} />
              <DetailCard icon={<MapPin className="w-4 h-4 text-orange-600" />} title="Pickup" value={`${selected.pickupAddress}\n${selected.pickupCity} — ${selected.pickupPin}`} />
              <DetailCard icon={<TruckIcon />} title="Delivery" value={`${selected.deliveryAddress || '—'}\n${selected.deliveryCity || '—'}, ${selected.deliveryCountry}`} />
              <DetailCard icon={<Package className="w-4 h-4 text-emerald-600" />} title="Package" value={`${selected.packageType} · ${selected.weightGrams}kg · ${selected.pieces} piece(s)\nService: ${selected.service}${selected.declaredValue ? `\nDeclared: ₹${selected.declaredValue}` : ''}`} />
            </div>

            <div className="card-compact">
              <div className="section-eyebrow">Update Status</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(selected.id, s)}
                    disabled={updating || selected.status === s}
                    className={`btn-sm ${selected.status === s ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {selected.notes && (
              <div className="card-compact">
                <div className="section-eyebrow">Notes</div>
                <div className="mt-2 text-sm text-slate-600 whitespace-pre-line">{selected.notes}</div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function DetailCard({ icon, title, value }) {
  return (
    <div className="card-compact">
      <div className="flex items-center gap-2">
        {icon}
        <div className="section-eyebrow">{title}</div>
      </div>
      <div className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{value}</div>
    </div>
  );
}

function TruckIcon() {
  return <span className="inline-flex text-base text-violet-600">🚚</span>;
}
