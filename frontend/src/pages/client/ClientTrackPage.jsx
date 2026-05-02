// src/pages/client/ClientTrackPage.jsx — Animated Tracking Journey
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { formatStatusLabel, normalizeStatus } from '../../components/ui/StatusBadge';

import { Package, MapPin, Truck, Navigation, CheckCircle2, Copy, Check } from 'lucide-react';

const STATUS_STEPS = ['Booked', 'PickedUp', 'InTransit', 'OutForDelivery', 'Delivered'];
const STEP_ICONS = [Package, MapPin, Truck, Navigation, CheckCircle2];

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
  const [animate, setAnimate] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyTrackingLink = async () => {
    if (!result?.shipment?.awb) return;
    try {
      const link = `${window.location.origin}/track?awb=${result.shipment.awb}`;
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast?.('Tracking link copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast?.('Failed to copy link', 'error');
    }
  };

  useEffect(() => {
    const prefillAwb = String(searchParams.get('awb') || '').trim();
    if (!prefillAwb) return;
    setAwb(prefillAwb);
    (async () => {
      setLoading(true);
      setAnimate(false);
      try {
        const r = await api.get(`/portal/tracking/${prefillAwb}`);
        const data = r.data || r;
        setResult({
          shipment: data.shipment || null,
          events: data.events || [],
          ndrs: data.ndrs || [],
        });
        requestAnimationFrame(() => setAnimate(true));
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
    setAnimate(false);
    try {
      const r = await api.get(`/portal/tracking/${awb.trim()}`);
      const data = r.data || r;
      setResult({
        shipment: data.shipment || null,
        events: data.events || [],
        ndrs: data.ndrs || [],
      });
      requestAnimationFrame(() => setAnimate(true));
    } catch(e) {
      toast?.(e.message || 'AWB not found', 'error');
      setResult(null);
    } finally { setLoading(false); }
  }

  const currentStep = result?.shipment ? STATUS_STEPS.indexOf(normalizeStatus(result.shipment.status)) : -1;
  const isRTO = normalizeStatus(result?.shipment?.status) === 'RTO';
  const isNDR = normalizeStatus(result?.shipment?.status) === 'NDR';

  return (
    <div className="min-h-full">
      <div className="client-premium-main max-w-3xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Single Track</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Enter an AWB to inspect the full journey with milestone state and timeline.</p>
          </div>
        </div>

        {/* ── Search Bar ── */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              className="input w-full pl-10 text-sm"
              placeholder="Enter AWB / tracking number"
              value={awb}
              onChange={e => setAwb(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && track()}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          </div>
          <button onClick={track} disabled={loading} className="client-action-btn-primary px-5">
            {loading ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Tracking…
              </span>
            ) : 'Track'}
          </button>
        </div>

        {result && (
          <div className={`client-premium-card p-5 space-y-4 mt-3 transition-all duration-500 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

            {/* ── Header ── */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">AWB</div>
                  <div className="font-mono font-bold text-lg text-slate-900 dark:text-white">{result.shipment?.awb}</div>
                </div>
                <button
                  onClick={copyTrackingLink}
                  className="mt-3.5 p-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 hover:text-sky-600 hover:border-sky-300 dark:hover:text-sky-400 dark:hover:border-sky-500/50 transition-all shadow-sm"
                  title="Copy Tracking Link"
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border ${
                isRTO ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                isNDR ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                currentStep >= 4 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                'bg-blue-500/10 text-blue-500 border-blue-500/20'
              }`}>
                {result.shipment?.status}
              </span>
            </div>

            {/* ── Info Grid ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/60">
              <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Consignee</span> <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{result.shipment?.consignee}</span></div>
              <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Destination</span> <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{result.shipment?.destination}</span></div>
              <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Courier</span> <span className="font-bold text-orange-600 dark:text-orange-400 truncate">{result.shipment?.courier}</span></div>
              <div className="flex flex-col"><span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Pincode</span> <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{result.shipment?.pincode || '-'}</span></div>
            </div>

            {/* ── Animated Milestone Stepper ── */}
            {currentStep >= 0 && (
              <div className="py-6 px-2 my-2 w-full mx-auto animated-stepper">
                <div className="flex items-center justify-between relative px-4">
                  {/* Background track */}
                  <div className="absolute top-5 left-8 right-8 h-1.5 bg-slate-100 dark:bg-slate-800 -z-10 rounded-full overflow-hidden" />
                  {/* Animated fill line */}
                  <div
                    className="absolute top-5 left-8 h-1.5 -z-10 rounded-full stepper-fill-line"
                    style={{
                      width: animate ? `calc(${(Math.max(0, currentStep) / (STATUS_STEPS.length - 1)) * 100}% - 4rem + ${currentStep > 0 ? '2rem' : '0rem'})` : '0%',
                      background: 'linear-gradient(90deg, #f97316, #fb923c)',
                      transition: 'width 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    {/* Shimmer effect */}
                    <div className="stepper-shimmer" />
                  </div>

                  {STATUS_STEPS.map((step, i) => {
                    const isActive = i <= currentStep;
                    const isCurrent = i === currentStep;
                    const delay = `${i * 150}ms`;

                    return (
                      <div key={step} className="flex flex-col items-center gap-2 z-10">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm border-2 stepper-node ${
                            isActive
                              ? 'bg-orange-500 border-orange-500 text-white'
                              : 'bg-white dark:bg-[#0c1631] border-slate-200 dark:border-slate-700 text-slate-400'
                          } ${isCurrent ? 'stepper-node-active' : ''}`}
                          style={{
                            transitionDelay: delay,
                            opacity: animate ? 1 : 0,
                            transform: animate ? 'scale(1)' : 'scale(0.5)',
                            transition: `all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}`,
                          }}
                        >
                          {isActive ? (() => {
                            const Icon = STEP_ICONS[i];
                            return <Icon size={18} strokeWidth={2.5} />;
                          })() : i + 1}
                        </div>
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider text-center max-w-[80px] leading-tight ${
                            isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'
                          }`}
                          style={{
                            opacity: animate ? 1 : 0,
                            transition: `opacity 0.4s ease ${parseInt(delay) + 200}ms`,
                          }}
                        >
                          {formatStatusLabel(step)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Exception Banner ── */}
            {(isRTO || isNDR) && (
              <div className={`rounded-2xl p-4 border ${isRTO ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/50' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50'}`}>
                <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isRTO ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {isRTO ? '↩️ Return to Origin' : '⚠️ Non-Delivery Report'}
                </div>
                <p className={`text-xs ${isRTO ? 'text-rose-700 dark:text-rose-300' : 'text-amber-700 dark:text-amber-300'}`}>
                  {isRTO ? 'This shipment is being returned to the origin. Contact support for details.' : 'Delivery was attempted but unsuccessful. Our team is working on re-delivery.'}
                </p>
              </div>
            )}

            {/* ── Animated Timeline Events ── */}
            {result.events?.length > 0 && (
              <div className="bg-white dark:bg-[#0c1631] border border-slate-200 dark:border-slate-700/60 rounded-3xl p-6 shadow-sm">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-6">Tracking History</div>
                <div className="space-y-0">
                  {result.events.map((ev, i) => {
                    const raw = ev.rawData || {};
                    const eventCode = pick(raw, 'eventCode', 'TRACKING_CODE', 'strCode');
                    const hub = pick(raw, 'hubOrBranch', 'CURRENT_CITY', 'strOrigin', 'strDestination');
                    const attempt = pick(raw, 'attemptNo', 'ATTEMPT_NO', 'ATTEMPTNO');
                    const exceptionReason = pick(raw, 'exceptionReason', 'sTrRemarks', 'strRemarks', 'reason');
                    const recipient = pick(raw, 'recipientName', 'RECEIVER_NAME', 'receiverName');
                    const pod = Boolean(raw?.proofOfDelivery || raw?.POD_URL || raw?.podImageUrl || raw?.POD_SIGNATURE || raw?.podSignature);
                    const isFirst = i === 0;

                    return (
                      <div
                        key={i}
                        className="flex gap-3 text-sm timeline-event"
                        style={{
                          opacity: animate ? 1 : 0,
                          transform: animate ? 'translateX(0)' : 'translateX(-12px)',
                          transition: `all 0.4s ease ${600 + i * 80}ms`,
                        }}
                      >
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full mt-1.5 border-2 transition-all duration-500 ${
                            isFirst
                              ? 'bg-orange-500 border-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)] scale-125'
                              : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                          }`} />
                          {i < result.events.length - 1 && (
                            <div className={`w-0.5 flex-1 mt-1 transition-colors duration-300 ${isFirst ? 'bg-orange-300 dark:bg-orange-700' : 'bg-slate-200 dark:bg-slate-700'}`} />
                          )}
                        </div>
                        <div className="pb-4 space-y-1 min-w-0 flex-1">
                          <div className={`font-semibold ${isFirst ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{ev.status}</div>
                          <div className="text-slate-500 dark:text-slate-400 text-xs">{ev.location} · {new Date(ev.timestamp).toLocaleString('en-IN')}</div>
                          {ev.description && <div className="text-slate-500 dark:text-slate-400 text-xs">{ev.description}</div>}
                          <div className="flex flex-wrap gap-1">
                            {eventCode && <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-300">Code {eventCode}</span>}
                            {hub && <span className="rounded bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-300">{hub}</span>}
                            {attempt && <span className="rounded bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">Attempt {attempt}</span>}
                            {recipient && <span className="rounded bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">Recipient {recipient}</span>}
                            {pod && <span className="rounded bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">POD ✓</span>}
                          </div>
                          {exceptionReason && <div className="text-[10px] text-rose-600 dark:text-rose-400">⚠ {exceptionReason}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── NDR Section ── */}
            {result.ndrs?.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300 mb-3">NDR History</div>
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

      {/* ── CSS Animations (zero bundle cost) ── */}
      <style>{`
        .stepper-node-active {
          animation: stepperPulse 2s ease-in-out infinite;
          box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.4);
        }
        @keyframes stepperPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.4); }
          50% { box-shadow: 0 0 0 8px rgba(249, 115, 22, 0); }
        }
        .stepper-fill-line {
          position: relative;
          overflow: hidden;
        }
        .stepper-shimmer {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          animation: shimmer 2.5s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% { left: -100%; }
          50% { left: 100%; }
          100% { left: 100%; }
        }
        .timeline-event:hover {
          background: rgba(248,250,252,0.5);
          border-radius: 12px;
          margin: 0 -8px;
          padding: 0 8px;
        }
        @media (prefers-color-scheme: dark) {
          .timeline-event:hover {
            background: rgba(15,23,42,0.5);
          }
        }
      `}</style>
    </div>
  );
}
