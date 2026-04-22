// src/pages/client/ClientTrackPage.jsx — Tracking for client portal
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { formatStatusLabel, normalizeStatus } from '../../components/ui/StatusBadge';
import ClientPortalPageIntro from '../../components/client/ClientPortalPageIntro';

const STATUS_STEPS = ['Booked', 'PickedUp', 'InTransit', 'OutForDelivery', 'Delivered'];
const pick = (obj, ...keys) => {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return null;
};

export default function ClientTrackPage({ toast }) {
  const [searchParams] = useSearchParams();
  const [awb, setAwb]         = useState('');
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const prefillAwb = String(searchParams.get('awb') || '').trim();
    if (!prefillAwb) return;
    setAwb(prefillAwb);
    (async () => {
      setLoading(true);
      try {
        const r = await api.get(`/portal/tracking/${prefillAwb}`);
        const data = r.data || r;
        setResult({
          shipment: data.shipment || null,
          events: data.events || [],
          ndrs: data.ndrs || [],
        });
      } catch (e) {
        toast?.(e.message || 'AWB not found', 'error');
        setResult(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [searchParams, toast]);

  async function track() {
    if (!awb.trim()) return;
    setLoading(true);
    try {
      const r = await api.get(`/portal/tracking/${awb.trim()}`);
      const data = r.data || r;
      setResult({
        shipment: data.shipment || null,
        events: data.events || [],
        ndrs: data.ndrs || [],
      });
    } catch(e) {
      toast?.(e.message || 'AWB not found', 'error');
      setResult(null);
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-full">
      <div className="client-premium-main max-w-3xl">
        <ClientPortalPageIntro
          eyebrow="Single Track"
          title="Track one shipment deeply with timeline context, milestone state, and NDR history in one place."
          description="Enter an AWB or open this page from another workspace to inspect the full journey without jumping across tools."
          badges={[awb ? `AWB ${awb}` : 'Enter an AWB', result?.shipment?.status || 'Waiting for query', `${result?.events?.length || 0} events`]}
        />
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Enter AWB / tracking number"
            value={awb}
            onChange={e => setAwb(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && track()}
          />
          <button onClick={track} disabled={loading} className="client-action-btn-primary">
            {loading ? '...' : '🔍 Track'}
          </button>
        </div>

        {result && (
          <div className="client-premium-card p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">AWB</div>
                <div className="font-mono font-bold text-slate-900 dark:text-white">{result.shipment?.awb}</div>
              </div>
              <span className="badge badge-info">{result.shipment?.status}</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mt-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/60">
              <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Consignee</span> <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{result.shipment?.consignee}</span></div>
              <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Destination</span> <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{result.shipment?.destination}</span></div>
              <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Courier</span> <span className="font-bold text-orange-600 dark:text-orange-400 truncate">{result.shipment?.courier}</span></div>
              <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Pincode</span> <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{result.shipment?.pincode || '-'}</span></div>
            </div>
            {result.shipment?.service && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-[#0c1631] p-3">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Service</div>
                  <div className="mt-1 font-bold text-slate-800 dark:text-slate-100">{result.shipment?.service}</div>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-[#0c1631] p-3">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Booking Date</div>
                  <div className="mt-1 font-bold text-slate-800 dark:text-slate-100">{result.shipment?.date || '-'}</div>
                </div>
              </div>
            )}

            {(() => {
              const currentStep = STATUS_STEPS.indexOf(normalizeStatus(result.shipment?.status));
              return currentStep >= 0 ? (
                <div className="py-6 px-2 my-2 w-full mx-auto">
                  <div className="flex items-center justify-between relative px-4">
                    {/* Background line */}
                    <div className="absolute top-4 left-8 right-8 h-1 bg-slate-100 dark:bg-slate-800 -z-10 rounded-full" />
                    {/* Foreground line */}
                    <div className="absolute top-4 left-8 h-1 bg-orange-500 -z-10 rounded-full transition-all duration-700" 
                         style={{ width: `calc(${(Math.max(0, currentStep) / (STATUS_STEPS.length - 1)) * 100}% - 4rem + ${currentStep > 0 ? '2rem' : '0rem'})` }} />
                    
                    {STATUS_STEPS.map((step, i) => {
                      const isActive = i <= currentStep;
                      const isCurrent = i === currentStep;
                      
                      return (
                        <div key={step} className="flex flex-col items-center gap-2 z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-500 ${
                            isActive 
                              ? 'bg-orange-500 border-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]' 
                              : 'bg-white dark:bg-[#0c1631] border-slate-200 dark:border-slate-700 text-slate-400 shadow-sm'
                          } ${isCurrent ? 'scale-110 ring-4 ring-orange-100 dark:ring-orange-900/30' : ''}`}>
                            {isActive ? '✓' : i + 1}
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-wider text-center max-w-[80px] leading-tight ${
                            isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'
                          }`}>
                            {formatStatusLabel(step).replace(' ', '\n')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null;
            })()}

            {result.events?.length > 0 && (
              <div className="bg-white dark:bg-[#0c1631] border border-slate-200 dark:border-slate-700/60 rounded-3xl p-6 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6">Tracking History</div>
                <div className="space-y-2">
                  {result.events.map((ev, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <div className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${i===0?'bg-blue-500':'bg-slate-300 dark:bg-slate-600'}`} />
                        {i < result.events.length-1 && <div className="w-0.5 bg-slate-200 dark:bg-slate-700 flex-1 mt-1" />}
                      </div>
                      <div className="pb-3 space-y-1">
                        {(() => {
                          const raw = ev.rawData || {};
                          const eventCode = pick(raw, 'eventCode', 'TRACKING_CODE', 'strCode');
                          const hub = pick(raw, 'hubOrBranch', 'CURRENT_CITY', 'strOrigin', 'strDestination');
                          const attempt = pick(raw, 'attemptNo', 'ATTEMPT_NO', 'ATTEMPTNO');
                          const exceptionReason = pick(raw, 'exceptionReason', 'sTrRemarks', 'strRemarks', 'reason');
                          const recipient = pick(raw, 'recipientName', 'RECEIVER_NAME', 'receiverName');
                          const pod = Boolean(raw?.proofOfDelivery || raw?.POD_URL || raw?.podImageUrl || raw?.POD_SIGNATURE || raw?.podSignature);
                          return (
                            <>
                        <div className="font-medium text-slate-800 dark:text-slate-100">{ev.status}</div>
                        <div className="text-slate-500 dark:text-slate-400 text-xs">{ev.location} · {new Date(ev.timestamp).toLocaleString('en-IN')}</div>
                        {ev.description && <div className="text-slate-500 dark:text-slate-400 text-xs">{ev.description}</div>}
                              <div className="flex flex-wrap gap-1">
                                {eventCode && <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-300">Code {eventCode}</span>}
                                {hub && <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-300">{hub}</span>}
                                {attempt && <span className="rounded bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">Attempt {attempt}</span>}
                                {recipient && <span className="rounded bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">Recipient {recipient}</span>}
                                {pod && <span className="rounded bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">POD</span>}
                              </div>
                              {exceptionReason && <div className="text-[10px] text-rose-600 dark:text-rose-400">Exception: {exceptionReason}</div>}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {result.ndrs?.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300 mb-3">NDR Story</div>
                <div className="space-y-2">
                  {result.ndrs.slice(0, 6).map((ndr, i) => (
                    <div key={ndr.id || i} className="text-xs text-amber-900 dark:text-amber-200">
                      <span className="font-semibold">{new Date(ndr.createdAt).toLocaleString('en-IN')}</span> · {ndr.reason || 'Issue logged'}
                      {ndr.actionTaken ? ` · Action: ${ndr.actionTaken}` : ''}
                      {ndr.remarks ? ` · ${ndr.remarks}` : ''}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
