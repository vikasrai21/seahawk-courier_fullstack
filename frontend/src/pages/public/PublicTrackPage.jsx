// src/pages/public/PublicTrackPage.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

const STATUS_STEPS = ['Booked', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'];

const STATUS_COLOR = {
  'Delivered':        'text-green-400 bg-green-500/10 border-green-500/30',
  'Out for Delivery': 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  'In Transit':       'text-orange-400 bg-orange-500/10 border-orange-500/30',
  'Picked Up':        'text-purple-400 bg-purple-500/10 border-purple-500/30',
  'Booked':           'text-gray-400 bg-gray-500/10 border-gray-500/30',
  'RTO':              'text-red-400 bg-red-500/10 border-red-500/30',
  'Cancelled':        'text-red-400 bg-red-500/10 border-red-500/30',
  'Failed':           'text-red-400 bg-red-500/10 border-red-500/30',
};

export default function PublicTrackPage() {
  const { awb: paramAwb } = useParams();
  const navigate = useNavigate();
  const [query, setQuery]   = useState(paramAwb || '');
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  useEffect(() => {
    if (paramAwb) fetchTracking(paramAwb);
  }, [paramAwb]);

  async function fetchTracking(awbToTrack) {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res  = await fetch(`/api/public/track/${awbToTrack.trim().toUpperCase()}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Shipment not found.');
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

  const currentStep = data ? STATUS_STEPS.findIndex(s =>
    s.toLowerCase() === data.status?.toLowerCase()
  ) : -1;

  return (
    <div className="min-h-screen bg-[#0a1628] text-white">

      {/* Header */}
      <header className="border-b border-white/10 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/images/logo.png" alt="Sea Hawk" className="h-8 w-auto" onError={e => e.target.style.display='none'} />
            <span className="font-bold text-sm">Sea Hawk Courier</span>
          </Link>
          <Link to="/login" className="text-sm text-white/60 hover:text-white transition-colors">
            Staff Login →
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Search */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black mb-2">Track Your Shipment</h1>
          <p className="text-white/50 mb-8">Enter your AWB / tracking number</p>
          <form onSubmit={handleSearch} className="flex gap-3 bg-white rounded-2xl p-2 shadow-2xl max-w-xl mx-auto">
            <input
              type="text"
              placeholder="Enter AWB number e.g. DEL1234567890"
              value={query}
              onChange={e => setQuery(e.target.value.toUpperCase())}
              className="flex-1 px-4 py-3 text-gray-900 bg-transparent outline-none font-semibold"
            />
            <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl transition-colors">
              Track
            </button>
          </form>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/50">Fetching tracking details...</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-3">📦</div>
            <p className="text-red-400 font-semibold mb-2">Shipment Not Found</p>
            <p className="text-white/50 text-sm">{error}</p>
          </div>
        )}

        {/* Result */}
        {data && !loading && (
          <div className="space-y-6">

            {/* Status card */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-white/50 text-sm mb-1">AWB Number</p>
                  <p className="font-mono font-bold text-lg">{data.awb}</p>
                </div>
                <span className={`text-sm font-semibold px-3 py-1.5 rounded-full border ${STATUS_COLOR[data.status] || STATUS_COLOR['Booked']}`}>
                  {data.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-white/40">Consignee</p><p className="font-medium">{data.consignee || '—'}</p></div>
                <div><p className="text-white/40">Destination</p><p className="font-medium">{data.destination || '—'}</p></div>
                <div><p className="text-white/40">Courier</p><p className="font-medium">{data.courier || '—'}</p></div>
                <div><p className="text-white/40">Booking Date</p><p className="font-medium">{data.date || '—'}</p></div>
              </div>
            </div>

            {/* Progress bar */}
            {currentStep >= 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <p className="text-sm text-white/50 mb-4">Delivery Progress</p>
                <div className="flex items-center gap-0">
                  {STATUS_STEPS.map((step, i) => (
                    <div key={step} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                          i <= currentStep
                            ? 'bg-orange-500 border-orange-500 text-white'
                            : 'border-white/20 text-white/30'
                        }`}>
                          {i < currentStep ? '✓' : i + 1}
                        </div>
                        <p className={`text-xs mt-2 text-center w-16 leading-tight ${i <= currentStep ? 'text-white/70' : 'text-white/30'}`}>
                          {step}
                        </p>
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 mb-5 ${i < currentStep ? 'bg-orange-500' : 'bg-white/10'}`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tracking events */}
            {data.trackingEvents?.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <p className="text-sm text-white/50 mb-4">Tracking History</p>
                <div className="space-y-3">
                  {data.trackingEvents.map((e, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full mt-0.5 ${i === 0 ? 'bg-orange-500' : 'bg-white/20'}`} />
                        {i < data.trackingEvents.length - 1 && <div className="w-px flex-1 bg-white/10 my-1" />}
                      </div>
                      <div className="pb-3">
                        <p className="font-medium text-sm">{e.status}</p>
                        {e.location && <p className="text-white/50 text-xs mt-0.5">📍 {e.location}</p>}
                        {e.description && <p className="text-white/50 text-xs">{e.description}</p>}
                        <p className="text-white/30 text-xs mt-1">
                          {new Date(e.timestamp).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* Help */}
        <div className="mt-10 text-center text-white/40 text-sm">
          Need help? Call us at{' '}
          <a href="tel:+919911565523" className="text-orange-400 hover:underline">+91 99115 65523</a>
          {' '}or{' '}
          <a href="https://wa.me/919911565523" target="_blank" className="text-green-400 hover:underline">WhatsApp</a>
        </div>

      </div>
    </div>
  );
}
