// src/pages/BookingsPage.jsx — Dashboard pickup requests management
import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const STATUS_COLORS = {
    PENDING: { bg: 'rgba(234,179,8,0.1)', text: '#ca8a04', border: 'rgba(234,179,8,0.3)' },
    CONFIRMED: { bg: 'rgba(59,130,246,0.1)', text: '#2563eb', border: 'rgba(59,130,246,0.3)' },
    ASSIGNED: { bg: 'rgba(168,85,247,0.1)', text: '#7c3aed', border: 'rgba(168,85,247,0.3)' },
    COMPLETED: { bg: 'rgba(34,197,94,0.1)', text: '#16a34a', border: 'rgba(34,197,94,0.3)' },
    CANCELLED: { bg: 'rgba(239,68,68,0.1)', text: '#dc2626', border: 'rgba(239,68,68,0.3)' },
};

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'ASSIGNED', 'COMPLETED', 'CANCELLED'];

export default function BookingsPage() {
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
            setBookings(res.data?.data || res.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [filter, search]);

    useEffect(() => { fetchBookings(); }, [fetchBookings]);

    async function updateStatus(id, status) {
        setUpdating(true);
        try {
            await api.patch(`/pickups/${id}/status`, { status });
            fetchBookings();
            if (selected?.id === id) setSelected(p => ({ ...p, status }));
        } catch (e) {
            alert('Failed to update status');
        } finally {
            setUpdating(false);
        }
    }

    const filtered = bookings.filter(b => {
        if (filter !== 'ALL' && b.status !== filter) return false;
        if (search) {
            const q = search.toLowerCase();
            return b.requestNo?.toLowerCase().includes(q) ||
                b.contactName?.toLowerCase().includes(q) ||
                b.contactPhone?.includes(q) ||
                b.pickupCity?.toLowerCase().includes(q);
        }
        return true;
    });

    const counts = STATUS_OPTIONS.reduce((acc, s) => {
        acc[s] = bookings.filter(b => b.status === s).length;
        return acc;
    }, {});

    const tk = s => STATUS_COLORS[s] || STATUS_COLORS.PENDING;

    return (
        <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>Pickup Requests</h1>
                    <p style={{ color: 'var(--shk-text-mid,#94a3b8)', fontSize: 13, margin: '4px 0 0' }}>
                        {bookings.length} total · {counts.PENDING || 0} pending
                    </p>
                </div>
                <button onClick={fetchBookings} style={{ padding: '8px 16px', background: 'var(--shk-surface-hi,#1a2236)', border: '1px solid var(--shk-border,#1f2d45)', borderRadius: 8, color: 'inherit', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    ↻ Refresh
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 12, marginBottom: 24 }}>
                {[['ALL', bookings.length, '#f97316'], ...STATUS_OPTIONS.map(s => [s, counts[s] || 0, tk(s).text])].map(([s, c, color]) => (
                    <div
                        key={s} onClick={() => setFilter(s)}
                        style={{ padding: '14px 16px', background: filter === s ? 'rgba(249,115,22,0.1)' : 'var(--shk-surface,#111827)', border: `1.5px solid ${filter === s ? '#f97316' : 'var(--shk-border,#1f2d45)'}`, borderRadius: 12, cursor: 'pointer', transition: 'all 0.15s' }}
                    >
                        <div style={{ fontSize: 22, fontWeight: 900, color, fontFamily: 'monospace' }}>{c}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--shk-text-mid,#94a3b8)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 2 }}>{s}</div>
                    </div>
                ))}
            </div>

            {/* Search */}
            <div style={{ marginBottom: 20 }}>
                <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name, phone, request no, city..."
                    style={{ width: '100%', maxWidth: 400, padding: '10px 14px', borderRadius: 10, background: 'var(--shk-surface,#111827)', border: '1px solid var(--shk-border,#1f2d45)', color: 'inherit', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                />
            </div>

            {/* Table */}
            <div style={{ background: 'var(--shk-surface,#111827)', border: '1px solid var(--shk-border,#1f2d45)', borderRadius: 14, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: 'var(--shk-text-mid,#94a3b8)' }}>Loading...</div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: '48px', textAlign: 'center', color: 'var(--shk-text-mid,#94a3b8)' }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
                        No pickup requests found
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--shk-border,#1f2d45)' }}>
                                    {['Ref No', 'Customer', 'Pickup City', 'Delivery', 'Package', 'Date / Slot', 'Status', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--shk-text-mid,#94a3b8)', textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(b => (
                                    <tr key={b.id} style={{ borderBottom: '1px solid var(--shk-border,#1f2d45)', cursor: 'pointer', transition: 'background 0.1s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--shk-surface-hi,#1a2236)'}
                                        onMouseLeave={e => e.currentTarget.style.background = ''}
                                        onClick={() => setSelected(b)}
                                    >
                                        <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#f97316' }}>{b.requestNo}</td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ fontWeight: 700, fontSize: 13 }}>{b.contactName}</div>
                                            <div style={{ fontSize: 12, color: 'var(--shk-text-mid,#94a3b8)' }}>{b.contactPhone}</div>
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: 13 }}>{b.pickupCity}</td>
                                        <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--shk-text-mid,#94a3b8)' }}>{b.deliveryCity || '—'}, {b.deliveryCountry}</td>
                                        <td style={{ padding: '12px 16px', fontSize: 12 }}>
                                            <div>{b.packageType}</div>
                                            <div style={{ color: 'var(--shk-text-mid,#94a3b8)' }}>{b.weightGrams}kg · {b.pieces}pc</div>
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: 12 }}>
                                            <div style={{ fontWeight: 600 }}>{b.scheduledDate}</div>
                                            <div style={{ color: 'var(--shk-text-mid,#94a3b8)' }}>{b.timeSlot}</div>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: tk(b.status).bg, color: tk(b.status).text, border: `1px solid ${tk(b.status).border}`, whiteSpace: 'nowrap' }}>
                                                {b.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                                            <select
                                                value={b.status}
                                                onChange={e => updateStatus(b.id, e.target.value)}
                                                disabled={updating}
                                                style={{ padding: '5px 8px', borderRadius: 6, background: 'var(--shk-surface-hi,#1a2236)', border: '1px solid var(--shk-border,#1f2d45)', color: 'inherit', fontSize: 12, cursor: 'pointer' }}
                                            >
                                                {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detail panel */}
            {selected && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}
                    onClick={() => setSelected(null)}
                >
                    <div style={{ width: '100%', maxWidth: 460, height: '100%', background: 'var(--shk-surface,#111827)', borderLeft: '1px solid var(--shk-border,#1f2d45)', overflowY: 'auto', padding: 28 }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                            <div>
                                <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#f97316' }}>{selected.requestNo}</div>
                                <div style={{ fontSize: 18, fontWeight: 800, marginTop: 2 }}>{selected.contactName}</div>
                            </div>
                            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'var(--shk-text-mid,#94a3b8)', fontSize: 20, cursor: 'pointer', padding: 4 }}>✕</button>
                        </div>

                        <span style={{ padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: tk(selected.status).bg, color: tk(selected.status).text, border: `1px solid ${tk(selected.status).border}` }}>
                            {selected.status}
                        </span>

                        {[
                            ['👤 Contact', `${selected.contactName}\n${selected.contactPhone}${selected.contactEmail ? '\n' + selected.contactEmail : ''}`],
                            ['📍 Pickup', `${selected.pickupAddress}\n${selected.pickupCity} — ${selected.pickupPin}`],
                            ['🚚 Delivery', `${selected.deliveryAddress || ''}\n${selected.deliveryCity || '—'}, ${selected.deliveryCountry}`],
                            ['📦 Package', `${selected.packageType} · ${selected.weightGrams}kg · ${selected.pieces} piece(s)\nService: ${selected.service}${selected.declaredValue ? `\nDeclared: ₹${selected.declaredValue}` : ''}`],
                            ['📅 Schedule', `${selected.scheduledDate} · ${selected.timeSlot}`],
                            ...(selected.notes ? [['📝 Notes', selected.notes]] : []),
                        ].map(([title, val]) => (
                            <div key={title} style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--shk-border,#1f2d45)' }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--shk-text-mid,#94a3b8)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{title}</div>
                                <div style={{ fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-line' }}>{val}</div>
                            </div>
                        ))}

                        <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--shk-border,#1f2d45)' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--shk-text-mid,#94a3b8)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Update Status</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {STATUS_OPTIONS.map(s => (
                                    <button key={s} onClick={() => updateStatus(selected.id, s)} disabled={updating || selected.status === s}
                                        style={{ padding: '7px 14px', borderRadius: 8, border: `1px solid ${s === selected.status ? tk(s).border : 'var(--shk-border,#1f2d45)'}`, background: s === selected.status ? tk(s).bg : 'transparent', color: s === selected.status ? tk(s).text : 'var(--shk-text-mid,#94a3b8)', fontWeight: 700, fontSize: 12, cursor: s === selected.status ? 'default' : 'pointer', opacity: updating ? 0.5 : 1 }}
                                    >{s}</button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginTop: 20 }}>
                            <a
                                href={`https://wa.me/${(selected.contactPhone || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${selected.contactName}, your pickup request ${selected.requestNo} is ${selected.status}. Thank you for choosing Sea Hawk Courier!`)}`}
                                target="_blank" rel="noreferrer"
                                style={{ display: 'block', textAlign: 'center', padding: '11px', background: '#16a34a', color: '#fff', borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: 13 }}
                            >
                                💬 WhatsApp Customer
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
