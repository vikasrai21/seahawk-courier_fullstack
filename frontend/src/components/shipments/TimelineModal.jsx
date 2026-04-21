import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Box, Truck, User, ShieldCheck } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { normalizeStatus, formatStatusLabel } from '../ui/StatusBadge';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const STEPS = ['Booked', 'PickedUp', 'InTransit', 'OutForDelivery', 'Delivered'];
const fmt = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const pick = (obj, ...keys) => {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return null;
};

function getEventMeta(event = {}) {
  const raw = event.rawData || {};
  const eventCode = pick(raw, 'eventCode', 'TRACKING_CODE', 'strCode');
  const hubOrBranch = pick(raw, 'hubOrBranch', 'CURRENT_CITY', 'strOrigin', 'strDestination');
  const attemptNo = pick(raw, 'attemptNo', 'ATTEMPT_NO', 'ATTEMPTNO', 'attemptNo');
  const exceptionReason = pick(raw, 'exceptionReason', 'sTrRemarks', 'strRemarks', 'reason');
  const recipientName = pick(raw, 'recipientName', 'RECEIVER_NAME', 'receiverName');
  const eventType = pick(raw, 'eventType');
  const proofOfDelivery = Boolean(raw?.proofOfDelivery || raw?.POD_URL || raw?.podImageUrl || raw?.POD_SIGNATURE || raw?.podSignature);
  return { eventCode, hubOrBranch, attemptNo, exceptionReason, recipientName, eventType, proofOfDelivery };
}

export default function TimelineModal({ shipment, shipmentId, onClose }) {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shipmentData, setShipmentData] = useState(shipment);

  const isClient = user?.role === 'CLIENT';
  const targetId = shipment?.id || shipmentId;

  useEffect(() => {
    if (!targetId) return;
    setLoading(true);
    api.get(isClient ? `/portal/shipments/${targetId}` : `/shipments/${targetId}`)
      .then(r => {
        setEvents(r.trackingEvents || []);
        if (!shipmentData) setShipmentData(r.data || r);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [targetId, isClient]);

  const displayShipment = shipmentData || shipment;
  const currentIdx = STEPS.indexOf(normalizeStatus(displayShipment?.status || 'Booked'));

  return (
    <Modal open onClose={onClose} title={`Shipment Journey — ${displayShipment?.awb || '...'}`}>
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="relative flex items-center justify-between px-2 pt-2">
          <div className="absolute top-[26px] left-10 right-10 h-[2px] bg-slate-100 dark:bg-slate-800 z-0" />
          {STEPS.map((step, i) => (
            <div key={step} className="flex flex-col items-center z-10 flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black border-4 transition-all duration-500
                ${i <= currentIdx 
                  ? 'bg-blue-600 border-blue-100 dark:border-blue-900/30 text-white shadow-lg shadow-blue-500/20' 
                  : 'bg-white dark:bg-slate-900 border-slate-50 dark:border-slate-800 text-slate-300'}`}>
                {i < currentIdx ? <ShieldCheck size={16} /> : i === currentIdx ? <div className="w-2 h-2 rounded-full bg-white animate-pulse" /> : i + 1}
              </div>
              <span className={`text-[10px] mt-2 text-center font-bold tracking-tight uppercase
                ${i <= currentIdx ? 'text-slate-900 dark:text-white' : 'text-slate-300'}`}>
                {formatStatusLabel(step).split(' ')[0]}
              </span>
            </div>
          ))}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-1 text-slate-400">
              <User size={12} /> <span className="text-[10px] font-bold uppercase tracking-wider">Consignee</span>
            </div>
            <div className="text-xs font-black text-slate-800 dark:text-white truncate">{displayShipment?.consignee}</div>
            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5"><MapPin size={10} /> {displayShipment?.destination}</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-1 text-slate-400">
              <Truck size={12} /> <span className="text-[10px] font-bold uppercase tracking-wider">Courier</span>
            </div>
            <div className="text-xs font-black text-slate-800 dark:text-white">{displayShipment?.courier || 'TBD'}</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-tight mt-0.5">{displayShipment?.service}</div>
          </div>
        </div>

        {/* Detailed Timeline */}
        <div className="space-y-4">
          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Clock size={12} /> Detailed History
          </h4>
          
          {loading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/30 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <Box size={24} className="mx-auto text-slate-300 mb-2" />
              <div className="text-xs font-medium text-slate-500">No events logged yet</div>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100 dark:before:bg-slate-800">
              {events.map((e, idx) => (
                <div key={e.id || idx} className="relative">
                  {(() => {
                    const meta = getEventMeta(e);
                    return (
                      <>
                  <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 transition-colors
                    ${idx === 0 ? 'bg-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.15)]' : 'bg-slate-300'}`} />
                  <div className="flex justify-between items-start">
                    <div>
                      <div className={`text-xs font-black ${idx === 0 ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                        {e.status}
                      </div>
                      {e.location && <div className="text-[10px] text-slate-400 mt-0.5">📍 {e.location}</div>}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
                      {new Date(e.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {meta.eventCode && <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-500">Code {meta.eventCode}</span>}
                    {meta.eventType && <span className="rounded-md bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 text-[10px] font-semibold text-blue-600">{meta.eventType}</span>}
                    {meta.hubOrBranch && <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-500">{meta.hubOrBranch}</span>}
                    {meta.attemptNo && <span className="rounded-md bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Attempt {meta.attemptNo}</span>}
                    {meta.recipientName && <span className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Recipient {meta.recipientName}</span>}
                    {meta.proofOfDelivery && <span className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">POD</span>}
                  </div>
                  {e.description && e.description !== `Status updated to ${e.status}` && (
                    <div className="mt-1.5 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-[10px] text-slate-500 leading-relaxed border border-slate-100 dark:border-slate-800">
                      {e.description}
                    </div>
                  )}
                  {meta.exceptionReason && (
                    <div className="mt-1 p-2 bg-rose-50 dark:bg-rose-950/20 rounded-xl text-[10px] text-rose-700 border border-rose-100 dark:border-rose-900/30">
                      Exception: {meta.exceptionReason}
                    </div>
                  )}
                      </>
                    );
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Meta */}
        <div className={`pt-4 border-t border-slate-100 dark:border-slate-800 grid gap-2 ${isClient ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {!isClient && (
            <div className="text-center">
              <div className="text-[9px] font-bold text-slate-400 uppercase">Weight</div>
              <div className="text-xs font-black text-slate-800 dark:text-white">{displayShipment?.weight} kg</div>
            </div>
          )}
          <div className={`text-center ${isClient ? '' : 'border-x border-slate-50 dark:border-slate-800'}`}>
            <div className="text-[9px] font-bold text-slate-400 uppercase">{isClient ? 'Route Type' : 'Amount'}</div>
            <div className="text-xs font-black text-slate-800 dark:text-white">
              {isClient ? (displayShipment?.service || 'Surface') : fmt(displayShipment?.amount)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[9px] font-bold text-slate-400 uppercase">Date</div>
            <div className="text-xs font-black text-slate-800 dark:text-white">{displayShipment?.date}</div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
