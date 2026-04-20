import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, RefreshCw, ShieldCheck, Zap } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { formatStatusLabel } from '../ui/StatusBadge';
import api from '../../services/api';

const STATUS_TRANSITIONS = ['PickedUp', 'InTransit', 'OutForDelivery', 'Delivered', 'Failed', 'RTO', 'Cancelled'];

export default function BulkStatusModal({ selectedIds, onDone, onClose, toast }) {
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const apply = async () => {
    if (!status) { toast?.('Please select a target status', 'error'); return; }
    setSaving(true);
    try {
      const res = await api.post('/ops/bulk-status', { ids: selectedIds, status });
      setResult(res);
      toast?.(`${res.updated} shipments moved to ${formatStatusLabel(status)}`, 'success');
    } catch (err) {
      toast?.(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const isDone = !!result;

  return (
    <Modal 
      open 
      onClose={onClose} 
      title={isDone ? 'Bulk Update Results' : `Update ${selectedIds.length} Shipments`}
      footer={
        <div className="flex gap-2 w-full">
          {!isDone ? (
            <>
              <button 
                onClick={onClose}
                className="flex-1 px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button 
                onClick={apply} 
                disabled={saving || !status} 
                className="flex-1 px-4 py-2 text-xs font-bold bg-slate-900 text-white rounded-xl shadow-lg shadow-slate-900/10 hover:bg-black disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <>
                    <Zap size={14} /> Update to {status || '...'}
                  </>
                )}
              </button>
            </>
          ) : (
            <button 
              onClick={() => { onDone(status); onClose(); }} 
              className="w-full px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700"
            >
              Done & Refresh List
            </button>
          )}
        </div>
      }
    >
      {!isDone ? (
        <div className="space-y-5 py-2">
          {/* Summary Box */}
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 animate-pulse">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="text-xs font-black text-blue-900 dark:text-blue-300 uppercase tracking-wider mb-1">Attention Required</div>
              <p className="text-[11px] text-blue-700 dark:text-blue-400 leading-relaxed font-medium">
                You are about to update <span className="font-black text-blue-900 dark:text-blue-200 underline">{selectedIds.length}</span> shipments globally. Only valid transitions will be processed; conflicting states will be automatically skipped.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 pl-1">Target Status</label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_TRANSITIONS.map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-[11px] font-bold transition-all ${
                    status === s 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 shadow-sm' 
                      : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${status === s ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'}`} />
                    {formatStatusLabel(s)}
                  </span>
                  {status === s && <CheckCircle2 size={12} className="text-blue-500" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4 py-4 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-100 dark:border-emerald-900/30">
            <CheckCircle2 size={32} />
          </div>
          
          <div className="space-y-1">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Batch Complete</h3>
            <p className="text-[11px] text-slate-500 font-medium">Results for your bulk operation</p>
          </div>

          <div className="flex justify-center gap-4 py-2">
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 min-w-[100px]">
              <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">Success</div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{result.updated}</div>
            </div>
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 min-w-[100px]">
              <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">Skipped</div>
              <div className="text-xl font-black text-slate-400 dark:text-slate-500">{result.failed || 0}</div>
            </div>
          </div>
          
          {result.failed > 0 && (
            <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
              <AlertCircle size={10} /> Skipped records had invalid state transitions
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
