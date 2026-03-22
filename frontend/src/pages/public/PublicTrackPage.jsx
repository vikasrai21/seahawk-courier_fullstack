// src/pages/public/PublicTrackPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

const STATUS_STEPS = ['Booked', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'];

const COURIER_COLORS = {
  DTDC:       { bg: '#7c3aed', light: '#ede9fe', text: '#5b21b6' },
  BLUEDART:   { bg: '#1d4ed8', light: '#dbeafe', text: '#1e40af' },
  DELHIVERY:  { bg: '#f97316', light: '#fff7ed', text: '#c2410c' },
  TRACKON:    { bg: '#16a34a', light: '#dcfce7', text: '#15803d' },
  PRIMETRACK: { bg: '#dc2626', light: '#fee2e2', text: '#b91c1c' },
  DHL:        { bg: '#ca8a04', light: '#fefce8', text: '#a16207' },
  UNKNOWN:    { bg: '#6b7280', light: '#f3f4f6', text: '#374151' },
};

const STATUS_STYLE = {
  'Delivered':        { color: '#15803d', bg: 'rgba(22,163,74,0.1)',  border: 'rgba(22,163,74,0.3)'  },
  'Out for Delivery': { color: '#1d4ed8', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)' },
  'In Transit':       { color: '#c2410c', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.3)' },
  'Picked Up':        { color: '#7c3aed', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.3)' },
  'Booked':           { color: '#475569', bg: 'rgba(71,85,105,0.08)', border: 'rgba(71,85,105,0.2)'  },
  'RTO':              { color: '#dc2626', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)'  },
  'default':          { color: '#475569', bg: 'rgba(71,85,105,0.08)', border: 'rgba(71,85,105,0.2)'  },
};

// ── Client-side courier detection (mirrors backend logic) ──────────────────
function detectCourierClient(awb) {
  if (!awb) return null;
  const a = awb.trim().toUpperCase();

  if (/^Z\d{8,9}$/.test(a))      return { courier: 'DTDC',       name: 'DTDC',       emoji: '🟣' };
  if (/^D\d{9,11}$/.test(a))     return { courier: 'DTDC',       name: 'DTDC',       emoji: '🟣' };
  if (/^X\d{9,10}$/.test(a))     return { courier: 'DTDC',       name: 'DTDC',       emoji: '🟣' };
  if (/^7X\d{9}$/.test(a))       return { courier: 'DTDC',       name: 'DTDC',       emoji: '🟣' };
  if (/^I\d{7,8}$/.test(a))      return { courier: 'DTDC',       name: 'DTDC COD',   emoji: '🟣' };
  if (/^(209|175|176|177|178|179)\d{8}$/.test(a)) return { courier: 'BLUEDART',  name: 'Bluedart',  emoji: '🔵' };
  if (/^(299|368|289|279)\d{11}$/.test(a))         return { courier: 'DELHIVERY', name: 'Delhivery', emoji: '🟠' };
  if (/^8\d{9,10}$/.test(a))     return { courier: 'DHL',        name: 'DHL',        emoji: '🟡' };
  if (/^100\d{9}$/.test(a))      return { courier: 'TRACKON',    name: 'Trackon',    emoji: '🟢' };
  if (/^500\d{9}$/.test(a))      return { courier: 'TRACKON',    name: 'Trackon',    emoji: '🟢' };
  if (/^200(04|40)\d{7}$/.test(a)) return { courier: 'PRIMETRACK', name: 'Primetrack', emoji: '🔴' };
  if (/^2000584[5-9]\d{4}$/.test(a)) return { courier: 'PRIMETRACK', name: 'Primetrack', emoji: '🔴' };
  if (/^200\d{9}$/.test(a))      return { courier: 'TRACKON_OR_PRIMETRACK', name: 'Trackon / Primetrack', emoji: '🔍' };

  return null;
}

export default function PublicTrackPage() {
  const { awb: paramAwb } = useParams();
  const navigate = useNavigate();
  const [query,    setQuery]   = useState(paramAwb || '');
  const [detected, setDetected] = useState(null);
  const [data,     setData]    = useState(null);
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState(null);

  // Auto-detect as user types
  useEffect(() => {
    const d = detectCourierClient(query);
    setDetected(d);
  }, [query]);

  useEffect(() => {
    if (paramAwb) fetchTracking(paramAwb);
  }, [paramAwb]);

  async function fetchTracking(awbToTrack) {
    setLoading(true); setError(null); setData(null);
    try {
      const res  = await fetch(`/api/public/track/${awbToTrack.trim().toUpperCase()}`);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || 'Shipment not found.');
      setData(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e) {
    e.preventDefault();
    if (query.trim()) navigate(`/track/${query.trim()}`);
  }

  const statusStyle = data ? (STATUS_STYLE[data.status] || STATUS_STYLE.default) : null;
  const currentStep = data ? STATUS_STEPS.findIndex(s => s.toLowerCase() === data.status?.toLowerCase()) : -1;
  const courierColor = data?.detectedCourier ? (COURIER_COLORS[data.detectedCourier] || COURIER_COLORS.UNKNOWN) : COURIER_COLORS.UNKNOWN;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Outfit', -apple-system, sans-serif" }}>

      {/* Header */}
      <header style={{ background: '#0b1f3a', borderBottom: '3px solid #f97316', padding: '16px 0' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/images/logo.png" alt="Sea Hawk" style={{ height: 36, width: 'auto' }} onError={e => e.target.style.display='none'} />
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: 15, lineHeight: 1.2 }}>Sea Hawk Courier</div>
              <div style={{ color: 'rgba(249,115,22,0.8)', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Track Your Shipment</div>
            </div>
          </Link>
          <Link to="/login" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textDecoration: 'none' }}>
            Staff Login →
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 20px' }}>

        {/* Search box */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0b1f3a', margin: '0 0 6px', letterSpacing: '-0.5px' }}>
            Track Your Shipment
          </h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: '0 0 20px' }}>
            Enter your AWB / tracking number — we'll detect the courier automatically
          </p>

          <form onSubmit={handleSearch}>
            <div style={{ display: 'flex', gap: 10, background: '#fff', borderRadius: 14, padding: 8, boxShadow: '0 4px 24px rgba(11,31,58,0.1)', border: '1.5px solid #e2e8f0' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Enter AWB number e.g. Z65539608, 20972743875, 36805810000873"
                  value={query}
                  onChange={e => setQuery(e.target.value.toUpperCase().replace(/\s/g,''))}
                  style={{
                    width: '100%', padding: '12px 16px', border: 'none', outline: 'none',
                    fontSize: 14, fontFamily: 'monospace', fontWeight: 600,
                    color: '#0b1f3a', background: 'transparent', letterSpacing: '0.05em',
                  }}
                />
                {/* Live courier detection badge */}
                {detected && query.length > 4 && (
                  <div style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '4px 10px', borderRadius: 20,
                    background: COURIER_COLORS[detected.courier]?.light || '#f3f4f6',
                    border: `1px solid ${COURIER_COLORS[detected.courier]?.bg || '#6b7280'}44`,
                    fontSize: 12, fontWeight: 700,
                    color: COURIER_COLORS[detected.courier]?.text || '#374151',
                  }}>
                    {detected.emoji} {detected.name}
                  </div>
                )}
              </div>
              <button type="submit" style={{
                padding: '12px 24px', background: '#f97316', color: '#fff',
                border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 800,
                cursor: 'pointer', whiteSpace: 'nowrap',
                boxShadow: '0 0 20px rgba(249,115,22,0.35)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 0 32px rgba(249,115,22,0.5)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 0 20px rgba(249,115,22,0.35)'; }}
              >
                🔍 Track
              </button>
            </div>
          </form>

          {/* Courier format hints */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {[
              { label: 'DTDC', hint: 'Z65539608 / D3005408' },
              { label: 'Bluedart', hint: '20972743875' },
              { label: 'Delhivery', hint: '36805810000873' },
              { label: 'Trackon', hint: '100436369735' },
              { label: 'Primetrack', hint: '200042724212' },
            ].map(({ label, hint }) => (
              <div key={label} style={{ fontSize: 11, color: '#94a3b8', padding: '3px 10px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20 }}>
                <strong style={{ color: '#475569' }}>{label}:</strong> {hint}
              </div>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ width: 40, height: 40, border: '3px solid #f97316', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: '#94a3b8', fontSize: 14 }}>Fetching tracking details...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{ background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: 16, padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
            <p style={{ color: '#dc2626', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Shipment Not Found</p>
            <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>{error}</p>
            <p style={{ color: '#64748b', fontSize: 13 }}>
              Need help? Call us at <a href="tel:+919911565523" style={{ color: '#f97316', fontWeight: 700 }}>+91 99115 65523</a>
            </p>
          </div>
        )}

        {/* No API key — detected but can't track live */}
        {data?.noApiKey && !loading && (
          <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(11,31,58,0.06)' }}>
            <div style={{ background: courierColor.bg, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 32 }}>{data.courierInfo?.logo}</div>
              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 18 }}>{data.courierInfo?.name}</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>AWB: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{data.awb}</span></div>
              </div>
            </div>
            <div style={{ padding: '24px' }}>
              <p style={{ color: '#475569', fontSize: 14, marginBottom: 20 }}>
                We detected this as a <strong>{data.courierInfo?.name}</strong> shipment. Live tracking will be available soon — for now, track directly on their website:
              </p>
              {data.externalUrl && (
                <a href={data.externalUrl} target="_blank" rel="noreferrer" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px',
                  background: courierColor.bg, color: '#fff', borderRadius: 10,
                  textDecoration: 'none', fontWeight: 700, fontSize: 14,
                }}>
                  Track on {data.courierInfo?.name} Website →
                </a>
              )}
            </div>
          </div>
        )}

        {/* Result */}
        {data && !loading && !data.noApiKey && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Main status card */}
            <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 16px rgba(11,31,58,0.06)' }}>
              {/* Courier header */}
              <div style={{ background: courierColor.bg, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ fontSize: 28 }}>{data.courierInfo?.logo || '📦'}</div>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 800, fontSize: 17 }}>{data.courier || data.courierInfo?.name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'monospace' }}>AWB: {data.awb}</div>
                  </div>
                </div>
                <span style={{
                  padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 800,
                  background: statusStyle?.bg || 'rgba(255,255,255,0.2)',
                  color: statusStyle?.color || '#fff',
                  border: `1px solid ${statusStyle?.border || 'rgba(255,255,255,0.3)'}`,
                }}>
                  {data.status}
                </span>
              </div>

              {/* Details grid */}
              <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
                {[
                  { label: 'Consignee',   value: data.consignee   || '—' },
                  { label: 'Destination', value: data.destination  || '—' },
                  { label: 'Booking Date',value: data.date         || '—' },
                  { label: 'Weight',      value: data.weight ? `${data.weight} kg` : '—' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#0b1f3a' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress bar */}
            {currentStep >= 0 && (
              <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '24px', boxShadow: '0 4px 16px rgba(11,31,58,0.06)' }}>
                <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
                  Delivery Progress
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  {STATUS_STEPS.map((step, i) => (
                    <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < STATUS_STEPS.length - 1 ? 1 : 'none' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 800,
                          background: i <= currentStep ? courierColor.bg : '#f1f5f9',
                          color: i <= currentStep ? '#fff' : '#94a3b8',
                          border: i === currentStep ? `3px solid ${courierColor.bg}` : 'none',
                          boxShadow: i === currentStep ? `0 0 0 4px ${courierColor.bg}22` : 'none',
                          transition: 'all 0.3s',
                        }}>
                          {i < currentStep ? '✓' : i + 1}
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 600, color: i <= currentStep ? '#0b1f3a' : '#94a3b8', textAlign: 'center', width: 60, lineHeight: 1.3 }}>
                          {step}
                        </div>
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div style={{ flex: 1, height: 3, marginBottom: 26, background: i < currentStep ? courierColor.bg : '#e2e8f0', borderRadius: 3, transition: 'background 0.3s' }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tracking events */}
            {data.trackingEvents?.length > 0 && (
              <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 16, padding: '24px', boxShadow: '0 4px 16px rgba(11,31,58,0.06)' }}>
                <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>
                  Tracking History
                </div>
                <div>
                  {data.trackingEvents.map((e, i) => (
                    <div key={i} style={{ display: 'flex', gap: 16, paddingBottom: i < data.trackingEvents.length - 1 ? 16 : 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: i === 0 ? courierColor.bg : '#e2e8f0', marginTop: 2, flexShrink: 0 }} />
                        {i < data.trackingEvents.length - 1 && (
                          <div style={{ width: 2, flex: 1, background: '#f1f5f9', marginTop: 4 }} />
                        )}
                      </div>
                      <div style={{ paddingBottom: i < data.trackingEvents.length - 1 ? 16 : 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#0b1f3a' }}>{e.status}</div>
                        {e.location && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>📍 {e.location}</div>}
                        {e.description && <div style={{ fontSize: 12, color: '#64748b' }}>{e.description}</div>}
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, fontFamily: 'monospace' }}>
                          {e.timestamp ? new Date(e.timestamp).toLocaleString('en-IN') : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Help footer */}
        <div style={{ marginTop: 32, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
          Need help?{' '}
          <a href="tel:+919911565523" style={{ color: '#f97316', fontWeight: 700 }}>+91 99115 65523</a>
          {' · '}
          <a href="https://wa.me/919911565523" target="_blank" rel="noreferrer" style={{ color: '#16a34a', fontWeight: 700 }}>WhatsApp</a>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input::placeholder { color: #94a3b8; }
      `}</style>
    </div>
  );
}
