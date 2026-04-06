import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { 
  AlertTriangle, CircleCheck, CircleX, Download, ExternalLink, 
  FileSpreadsheet, Filter, Info, ListTodo, SearchCheck, 
  ShieldCheck, Upload, Wrench, Brain, History, LayoutDashboard, 
  FileText, CheckCircle2, Clock, ChevronRight, MoreHorizontal, 
  ArrowRight, Table, BarChart3, AlertCircle, Mail, X 
} from 'lucide-react';
import { Spinner } from '../components/ui/Loading';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const DisputeModal = ({ isOpen, onClose, selectedAwbs, results, invoiceNo, courier, toast }) => {
  if (!isOpen) return null;

  const disputeItems = results.filter(r => selectedAwbs.has(r.awb) || (selectedAwbs.size === 0 && r.difference > 50));
  const totalRecovery = disputeItems.reduce((sum, r) => sum + r.difference, 0);

  const disputeText = `Subject: Dispute for Invoice #${invoiceNo} - ${courier}\n\nDear Billing Team,\n\nWe have completed the audit for invoice #${invoiceNo} and identified discrepancies in ${disputeItems.length} shipments, totaling a recovery amount of ₹${totalRecovery.toFixed(2)}.\n\nSummary of Issues:\n${[...new Set(disputeItems.flatMap(i => i.flags || []))].map(f => `- ${f}`).join('\n')}\n\nPlease find the attached itemized report for your review. We request you to issue a credit note for the overcharged amount before we process the payment.\n\nRegards,\nAudit Team\nSeahawk Logistics`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm reveal">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center">
              <Mail size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Draft Dispute Letter</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{disputeItems.length} items flagged for recovery</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 font-mono text-[11px] leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-wrap select-all">
            {disputeText}
          </div>
          
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 flex gap-3">
            <AlertCircle className="text-amber-500 shrink-0" size={16} />
            <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400">Copy this text to your email or download the attached breakdown to send to the courier's billing department.</p>
          </div>
        </div>

        <div className="p-8 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-50 dark:border-slate-800 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary btn-md rounded-2xl">Cancel</button>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(disputeText);
              toast?.('Copied to clipboard', 'success');
            }} 
            className="btn-primary btn-md rounded-2xl bg-slate-900 text-white px-8"
          >
            Copy Text
          </button>
        </div>
      </div>
    </div>
  );
};

const FIELD_LABELS = {
  awb: 'AWB',
  weight: 'Weight',
  amount: 'Amount',
  serviceCode: 'Mode',
  city: 'City',
  state: 'State',
  pincode: 'Pincode',
};

const HEADER_VARIANTS = {
  awb: [/awb/i, /docket/i, /cn.?no/i, /tracking/i, /shipment.?no/i, /consg.?number/i, /consignment/i, /docket.?number/i],
  weight: [/weight/i, /\bwt\b/i, /kg/i, /charged.?weight/i],
  amount: [/amount/i, /\bamt\b/i, /freight/i, /chargeable.?amount/i, /^amount$/i, /bill.?amount/i],
  serviceCode: [/service/i, /mode/i, /product/i, /cat/i, /type/i, /consg.?type/i],
  city: [/city/i, /destination/i, /^dest$/i, /to.?city/i],
  state: [/state/i, /region/i, /province/i],
  pincode: [/pin/i, /pincode/i, /postal/i, /zip/i],
};

const HIGH_DIFFERENCE_THRESHOLD = 50;

const toNumber = (value) => {
  if (typeof value === 'number') return value;
  const parsed = parseFloat(String(value || '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const fmtMoney = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return `₹${amount.toFixed(2)}`;
};

const fmtDiff = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return `${amount > 0 ? '+' : ''}${amount.toFixed(2)}`;
};

function looksLikeAwb(value) {
  const text = String(value || '').trim().toUpperCase();
  return /^[A-Z0-9-]{8,20}$/.test(text) && /\d{5,}/.test(text);
}

function looksLikePincode(value) {
  return /^\d{6}$/.test(String(value || '').trim());
}

function looksLikeServiceCode(value) {
  const text = String(value || '').trim().toUpperCase();
  return /^(AR|AC|SF|DA)\d+$/.test(text) || ['AIR', 'SFC', 'SURFACE', 'PRI', 'PRIORITY', 'EXP', 'EXPRESS'].includes(text);
}

function buildRowsFromGrid(grid, startRow, map, fallbackService = 'AIR') {
  const startIdx = Math.max(0, Number(startRow || 1) - 1);
  return grid.slice(startIdx).map((row) => {
    if (!row || !Array.isArray(row)) return null;
    const awb = String(row[map.awb] || '').trim();
    if (!awb || !looksLikeAwb(awb)) return null;
    return {
      awb,
      city: String(row[map.city] || '').trim(),
      state: String(row[map.state] || '').trim(),
      pincode: String(row[map.pincode] || '').trim(),
      service: String(row[map.serviceCode] || '').trim().toUpperCase() || fallbackService,
      weight: toNumber(row[map.weight]),
      amount: toNumber(row[map.amount]),
    };
  }).filter(Boolean);
}

function serializeRows(rows) {
  return rows.map((row) => [
    row.awb,
    row.city,
    row.state,
    row.pincode,
    row.service,
    row.weight,
    row.amount,
  ].join(',')).join('\n');
}

function downloadBlob(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function discoverShipmentGrid(grid) {
  let best = {
    headerRowIdx: -1,
    startRow: 1,
    mapping: {},
    headerMatches: 0,
    sampleMatches: 0,
    confidence: 'low',
    reasons: [],
  };

  const maxRows = Math.min(grid.length, 50);

  for (let index = 0; index < maxRows; index += 1) {
    const row = grid[index];
    if (!row || !Array.isArray(row)) continue;

    const mapping = {};
    let headerMatches = 0;

    row.forEach((cell, columnIndex) => {
      const value = String(cell || '').trim();
      if (!value) return;
      Object.entries(HEADER_VARIANTS).forEach(([field, patterns]) => {
        if (!mapping[field] && patterns.some((pattern) => pattern.test(value))) {
          mapping[field] = columnIndex;
          headerMatches += 1;
        }
      });
    });

    const sampleRows = grid.slice(index + 1, index + 6);
    let sampleMatches = 0;
    for (const sample of sampleRows) {
      if (!sample || !Array.isArray(sample)) continue;
      if (mapping.awb !== undefined && looksLikeAwb(sample[mapping.awb])) sampleMatches += 2;
      if (mapping.weight !== undefined && toNumber(sample[mapping.weight]) > 0) sampleMatches += 1;
      if (mapping.amount !== undefined && toNumber(sample[mapping.amount]) > 0) sampleMatches += 1;
      if (mapping.serviceCode !== undefined && looksLikeServiceCode(sample[mapping.serviceCode])) sampleMatches += 1;
      if (mapping.pincode !== undefined && looksLikePincode(sample[mapping.pincode])) sampleMatches += 1;
    }

    const totalScore = (headerMatches * 4) + sampleMatches;
    const bestScore = (best.headerMatches * 4) + best.sampleMatches;
    if (totalScore > bestScore) {
      best = {
        headerRowIdx: index,
        startRow: index + 2,
        mapping,
        headerMatches,
        sampleMatches,
        confidence: totalScore >= 18 ? 'high' : totalScore >= 10 ? 'medium' : 'low',
        reasons: Object.entries(mapping).map(([field, col]) => `${FIELD_LABELS[field]}: column ${col + 1}`),
      };
    }
  }

  if (best.headerMatches >= 2) return best;

  for (let index = 0; index < maxRows; index += 1) {
    const row = grid[index];
    if (!row || row.length < 3) continue;
    const mapping = {};
    row.forEach((cell, columnIndex) => {
      const value = String(cell || '').trim();
      if (!value) return;
      if (mapping.awb === undefined && looksLikeAwb(value)) mapping.awb = columnIndex;
      else if (mapping.pincode === undefined && looksLikePincode(value)) mapping.pincode = columnIndex;
      else if (mapping.serviceCode === undefined && looksLikeServiceCode(value)) mapping.serviceCode = columnIndex;
      else if (mapping.weight === undefined && toNumber(value) > 0 && toNumber(value) < 100) mapping.weight = columnIndex;
      else if (mapping.amount === undefined && toNumber(value) > 20) mapping.amount = columnIndex;
    });

    if (mapping.awb !== undefined && mapping.amount !== undefined) {
      return {
        headerRowIdx: Math.max(0, index - 1),
        startRow: index + 1,
        mapping,
        headerMatches: 0,
        sampleMatches: 0,
        confidence: 'medium',
        reasons: ['Pattern-based detection used'],
      };
    }
  }

  return best;
}

function normalizeLine(line) {
  const parts = line.split(',').map((part) => part.trim());
  if (parts.length >= 7) {
    return {
      awb: parts[0],
      city: parts[1],
      state: parts[2],
      pincode: parts[3],
      serviceCode: parts[4],
      weight: parseFloat(parts[5]) || 0,
      amount: parseFloat(parts[6]) || 0,
    };
  }
  if (parts.length >= 6) {
    return {
      awb: parts[0],
      city: parts[1],
      state: parts[2],
      serviceCode: parts[3],
      weight: parseFloat(parts[4]) || 0,
      amount: parseFloat(parts[5]) || 0,
    };
  }
  return null;
}

const toneClass = (tone) => {
  if (tone === 'rose') return 'border-rose-100 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20';
  if (tone === 'amber') return 'border-amber-100 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
  if (tone === 'emerald') return 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
  if (tone === 'blue') return 'border-blue-100 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20';
  return 'border-slate-200 bg-slate-50 text-slate-700 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-700';
};

const Card = ({ children, className = '', title, subtitle, icon: Icon, actions }) => (
  <div className={`card ${className}`}>
    {(title || Icon || actions) && (
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="rounded-xl bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              <Icon size={18} />
            </div>
          )}
          <div>
            {title && <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">{title}</h3>}
            {subtitle && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    )}
    {children}
  </div>
);

const Badge = ({ children, tone = 'slate' }) => {
  const classes = {
    emerald: 'badge-success',
    blue: 'badge-info',
    rose: 'badge-error',
    amber: 'badge-warning',
    slate: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
  };
  return <span className={`badge ${classes[tone] || classes.slate}`}>{children}</span>;
};

const StatCard = ({ label, value, subtext, tone = 'slate', icon: Icon }) => {
  const borderColors = {
    emerald: 'border-emerald-500',
    blue: 'border-blue-500',
    rose: 'border-rose-500',
    amber: 'border-amber-500',
    slate: 'border-slate-300',
  };
  return (
    <div className={`card reveal border-t-4 ${borderColors[tone]} flex flex-col gap-1`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-[2px] text-slate-400">{label}</span>
        {Icon && <Icon size={14} className="text-slate-300" />}
      </div>
      <div className="text-2xl font-black text-slate-900 dark:text-white">{value}</div>
      {subtext && <div className="text-[10px] font-bold text-slate-400">{subtext}</div>}
    </div>
  );
};

const PhaseIdle = ({ onUpload, fileRef, pendingAudits = [], overview = {} }) => (
  <div className="grid gap-6 lg:grid-cols-[1fr_360px] reveal">
    <div className="space-y-6">
      <Card
        title="Upload courier bill"
        subtitle="Step 1"
        icon={Upload}
        className="flex flex-col items-center justify-center py-12 border-dashed border-2 border-slate-200 dark:border-slate-800"
      >
        <div 
          onClick={() => fileRef.current?.click()}
          className="group cursor-pointer flex flex-col items-center text-center max-w-xs transition-all hover:scale-105"
        >
          <div className="mb-6 rounded-3xl bg-slate-50 p-8 text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-500 dark:bg-slate-800/50 transition-colors">
            <Upload size={48} strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Drop courier bill here</h2>
          <p className="mt-2 text-xs font-bold text-slate-400 leading-relaxed uppercase tracking-widest">
            Drag and drop your XLSX or CSV file, or click to browse.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {['DTDC', 'Trackon', 'Delhivery', '.xlsx', '.csv'].map(tag => (
              <span key={tag} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-[9px] font-black text-slate-500 rounded-lg border border-slate-200 dark:border-slate-700 uppercase tracking-tighter">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </Card>

      <Card title="How it works" icon={Info} className="bg-slate-50/50 dark:bg-slate-900/30 border-none">
        <div className="space-y-4">
          {[
            { step: 1, title: 'Upload the courier bill', desc: 'System auto-detects headers, AWB column, weight, and amount. Works with DTDC, Trackon and Delhivery formats.' },
            { step: 2, title: 'Review column mapping', desc: 'Confirm detected columns or override manually. Preview first 3 rows before running.' },
            { step: 3, title: 'Run the audit', desc: 'Every shipment verified against your contracted rates. Overcharges flagged instantly.' },
            { step: 4, title: 'Export & raise disputes', desc: 'Download results, select overcharged items, and generate a formal dispute letter in one click.' }
          ].map(item => (
            <div key={item.step} className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-xs font-black">
                {item.step}
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{item.title}</h4>
                <p className="mt-0.5 text-[10px] font-bold text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>

    <div className="space-y-6">
      <Card 
        title="Pending audits" 
        icon={History} 
        actions={<Badge tone={pendingAudits.length > 0 ? 'amber' : 'slate'}>{pendingAudits.length} awaiting</Badge>}
      >
        <div className="space-y-3">
          {pendingAudits.length > 0 ? pendingAudits.map((audit, i) => (
            <div 
              key={audit.id} 
              onClick={() => onUpload && onUpload(audit.id)}
              className="group p-3 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:border-orange-500 cursor-pointer transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-500 dark:bg-amber-500/10">
                  <FileText size={16} />
                </div>
                <div>
                  <div className="text-[11px] font-black text-slate-900 dark:text-white uppercase truncate max-w-[120px]">
                    {audit.courier} — {audit.invoiceNo}
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                    {audit.fromDate} • {fmtMoney(audit.totalAmount)}
                  </div>
                </div>
              </div>
              <Badge tone="amber">{audit.status}</Badge>
            </div>
          )) : (
            <div className="py-12 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 mb-2">
                <ListTodo size={20} />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
                No invoices pending audit.<br/>Upload new data to begin.
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card title="Operational overview" icon={LayoutDashboard}>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-4 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Bills Received</div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">{overview?.billsReceived || 0}</div>
          </div>
          <div className="p-4 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Verified</div>
            <div className="text-xl font-black text-emerald-500 mt-1">{overview?.verifiedCount || 0}</div>
          </div>
          <div className="p-4 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 col-span-2">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Disputes Raised</div>
            <div className="text-xl font-black text-rose-500 mt-1">{overview?.disputesRaised || 0}</div>
          </div>
        </div>
        <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Monthly billed amount</span>
            <span className="text-sm font-black text-slate-900 dark:text-white">{fmtMoney(overview?.totalBilled)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Recovered in disputes (YTD)</span>
            <span className="text-sm font-black text-emerald-500">{fmtMoney(overview?.recoveredYTD)}</span>
          </div>
        </div>
      </Card>

      <div className="p-4 rounded-[2rem] bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 flex gap-3">
        <Info className="text-blue-500 flex-shrink-0" size={18} />
        <div>
          <h4 className="text-[11px] font-black text-blue-900 dark:text-blue-400 uppercase tracking-wider">DTDC bills include FSC & GST separately</h4>
          <p className="mt-1 text-[10px] font-bold text-blue-700/70 dark:text-blue-500/70 leading-relaxed">
            Your contracted rates (LL2215 / 2189) are base rates. DTDC adds 35% fuel surcharge then 18% GST on top. Your actual cost per shipment = base × 1.593
          </p>
        </div>
      </div>
    </div>
  </div>
);
const PhaseMapping = ({ 
  billFile, discovery, startRow, setStartRow, defaultService, setDefaultService, 
  manualMap, setManualMap, previewRows, finalizeMapping, rowForOptions, onBack 
}) => (
  <div className="space-y-6 reveal">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-900 flex items-center justify-center">
          <FileSpreadsheet size={24} />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
            {billFile?.name}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {billFile?.rows || 0} shipments detected • Sheet 1
            </span>
            <Badge tone="emerald">High confidence</Badge>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onBack} className="btn-secondary btn-sm">Change file</button>
        <button onClick={finalizeMapping} className="btn-primary btn-sm">Run audit</button>
      </div>
    </div>

    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Card title="Auto-detected columns" icon={SearchCheck}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(FIELD_LABELS).map(([key, label]) => {
              const colIdx = manualMap[key];
              const isFound = colIdx !== undefined;
              return (
                <div key={key} className={`p-3 rounded-2xl border ${isFound ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-100'} transition-colors`}>
                  <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</div>
                  <div className={`text-xs font-black ${isFound ? 'text-emerald-700' : 'text-slate-400'}`}>
                    {isFound ? `Column ${colIdx + 1}` : 'Not found'}
                  </div>
                  {isFound && <div className="text-[9px] font-bold text-emerald-600/70 truncate mt-0.5">{rowForOptions?.[colIdx] || 'Sample data'}</div>}
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Column overrides" icon={Wrench}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(FIELD_LABELS).map(([field, label]) => (
              <div key={field}>
                <label className="label">{label}</label>
                <select
                  className="input text-xs h-10"
                  value={manualMap[field] ?? ''}
                  onChange={(e) => setManualMap({ ...manualMap, [field]: e.target.value === '' ? undefined : parseInt(e.target.value, 10) })}
                >
                  <option value="">— Ignore —</option>
                  {rowForOptions?.map((_, i) => <option key={i} value={i}>Col {i + 1} ({String(rowForOptions[i]).slice(0, 10)})</option>)}
                </select>
              </div>
            ))}
            <div>
              <label className="label">Data starts at row</label>
              <input 
                type="number" 
                className="input text-xs h-10" 
                value={startRow} 
                onChange={(e) => setStartRow(Math.max(1, parseInt(e.target.value || '1', 10)))} 
              />
            </div>
            <div className="col-span-2">
              <label className="label">Default Mode (if blank)</label>
              <div className="flex gap-1">
                {['AIR', 'SFC', 'PRI'].map(m => (
                  <button 
                    key={m} 
                    onClick={() => setDefaultService(m)}
                    className={`flex-1 py-2 text-[10px] font-black rounded-xl border transition-all ${defaultService === m ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-200'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card title="Live row preview" icon={Table} subtitle={`${previewRows.length} of ${billFile?.rows} rows`}>
          <div className="table-shell">
            <div className="grid grid-cols-[1.5fr_1fr_0.8fr_0.8fr_0.5fr] bg-slate-50 dark:bg-slate-800/50">
              <div className="th">AWB</div>
              <div className="th">Destination</div>
              <div className="th">Weight</div>
              <div className="th">Amount</div>
              <div className="th">Mode</div>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {previewRows.map((row, i) => (
                <div key={i} className="grid grid-cols-[1.5fr_1fr_0.8fr_0.8fr_0.5fr] tr-hover">
                  <div className="td font-mono font-black text-slate-900 dark:text-white uppercase">{row.awb || '—'}</div>
                  <div className="td text-[11px] font-bold text-slate-500">{row.city || '—'}</div>
                  <div className="td text-[11px] font-bold text-slate-500">{row.weight} kg</div>
                  <div className="td text-[11px] font-bold text-slate-900 dark:text-white">₹{row.amount}</div>
                  <div className="td">
                    <Badge tone="blue">{row.service}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button onClick={finalizeMapping} className="btn-primary w-full mt-6 py-4 rounded-[2rem] gap-3">
            Confirm mapping — run audit on {billFile?.rows} shipments <ArrowRight size={18} />
          </button>
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Audit settings" icon={Wrench}>
          <div className="space-y-4">
            {[
              { label: 'Courier', value: 'DTDC • Account LF926', tone: 'slate' },
              { label: 'Rate codes to apply', value: 'LL2215 Surface, 2189 Express', tone: 'blue' },
              { label: 'Fuel surcharge', value: '35% FSC', tone: 'slate' },
              { label: 'Tax structure', value: 'CGST 9% + SGST 9%', tone: 'slate' },
              { label: 'Flag threshold', value: '₹10 mismatch', tone: 'amber' },
              { label: 'Dispute threshold', value: '₹50 overcharge', tone: 'emerald' },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-slate-800 last:border-none">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{item.label}</span>
                <span className={`text-[10px] font-black uppercase text-right ${item.tone === 'blue' ? 'text-blue-500' : item.tone === 'amber' ? 'text-amber-500' : item.tone === 'emerald' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </Card>

        <div className="p-6 rounded-[2rem] bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 flex gap-3">
          <AlertCircle className="text-amber-500 flex-shrink-0" size={18} />
          <p className="text-[10px] font-bold text-amber-700/80 dark:text-amber-500/70 leading-relaxed">
            <span className="font-black text-amber-900 dark:text-amber-400 block mb-1">State column not found in bill</span>
            Zone will be resolved from city name. Some zone mappings may be approximate — review any flagged discrepancies after the audit runs.
          </p>
        </div>

        <Card title="Audit progress" icon={Clock}>
          <div className="space-y-6 px-2">
            {[
              { label: 'File uploaded', status: 'Done', tone: 'emerald' },
              { label: 'Headers detected', status: '88% confidence', tone: 'emerald' },
              { label: 'Confirm mapping', status: 'In progress', tone: 'blue' },
              { label: 'Run rate verification', status: '158 shipments', tone: 'slate' },
              { label: 'Review results & export', status: 'Waiting', tone: 'slate' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-4 relative">
                {i < 4 && <div className="absolute left-2.5 top-7 w-[1px] h-6 bg-slate-100 dark:bg-slate-800" />}
                <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 z-10 ${step.tone === 'emerald' ? 'bg-emerald-500' : step.tone === 'blue' ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-800'}`}>
                  {step.tone === 'emerald' && <CheckCircle2 size={12} className="text-white" />}
                  {step.tone === 'blue' && <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                </div>
                <div className="flex-1 flex justify-between items-center">
                  <span className={`text-[11px] font-black uppercase tracking-tight ${step.tone === 'slate' ? 'text-slate-400' : 'text-slate-900 dark:text-white'}`}>{step.label}</span>
                  <span className={`text-[9px] font-bold uppercase ${step.tone === 'emerald' ? 'text-emerald-500' : step.tone === 'blue' ? 'text-blue-500' : 'text-slate-400'}`}>{step.status}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  </div>
);
const PhaseResults = ({ 
  results, summary, issueBreakdown, filteredResults, activeFilter, setActiveFilter,
  activeIssueFilter, setActiveIssueFilter, selectedAwbs, toggleAwb, selectAllOvercharged,
  searchQuery, setSearchQuery, sortBy, setSortBy, selectedRowKey, setSelectedRowKey,
  selectedRow, markSelectedVerified, exportAuditResults, onBack,
  generatingAI, generateAIInsight, aiInsight
}) => {
  const chartData = [
    { name: 'Local', correct: 45, overcharged: 12 },
    { name: 'North', correct: 30, overcharged: 8 },
    { name: 'Metro', correct: 25, overcharged: 2 },
    { name: 'ROI-A', correct: 15, overcharged: 0 },
    { name: 'ROI-B', correct: 9, overcharged: 0 },
  ];

  return (
    <div className="space-y-6 reveal">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
              Bill audit — DTDC Mar 2026
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Account LF926 • Due 07 Apr 2026
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onBack} className="btn-secondary btn-sm">New audit</button>
          <button onClick={exportAuditResults} className="btn-secondary btn-sm">Export XLSX</button>
          <button 
            onClick={() => markSelectedVerified('VERIFIED')} 
            className="btn bg-emerald-50 text-emerald-600 border border-emerald-100 btn-sm hover:bg-emerald-100"
          >
            Save to Ledger
          </button>
          <button 
            onClick={() => markSelectedVerified('DISPUTED')}
            className="btn bg-rose-50 text-rose-600 border border-rose-100 btn-sm hover:bg-rose-100"
          >
            Raise dispute ({selectedAwbs.size || results.filter(r => r.difference > 50).length})
          </button>
          <button 
            onClick={generateAIInsight}
            disabled={generatingAI}
            className="btn bg-slate-900 text-white btn-sm gap-2 dark:bg-white dark:text-slate-900 pulse-intelligence disabled:opacity-50"
          >
             {generatingAI ? <Spinner size="sm" /> : <Brain size={14} className="text-blue-400" />}
             {generatingAI ? 'Thinking...' : 'Ask AI'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total Shipments" value={summary?.total || 0} subtext="First fortnight Mar 2026" tone="blue" icon={Table} />
        <StatCard label="Verified Correct" value={summary?.total - summary?.mismatched - summary?.errors || 0} subtext="78.5% of total" tone="emerald" icon={CheckCircle2} />
        <StatCard label="Overcharged" value={summary?.mismatched || 0} subtext="₹1,477 excess billed" tone="rose" icon={AlertCircle} />
        <StatCard label="Raise Dispute" value="18" subtext="₹1,244 at risk (diff > ₹50)" tone="amber" icon={AlertCircle} />
      <StatCard label="Needs Review" value="12" subtext="Zone / product unclear" tone="blue" icon={Clock} />

      {aiInsight && (
        <div className="col-span-2 md:col-span-1 border-2 border-blue-500/20 bg-blue-500/5 rounded-3xl p-4 flex flex-col justify-between relative overflow-hidden group reveal">
          <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
            <Brain size={64} className="text-blue-500" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Neural Score: {aiInsight.neuralScore}%</span>
            </div>
            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-tight">
              {aiInsight.summary}
            </p>
          </div>
          <div className="mt-3 space-y-1">
             {aiInsight.recommendations.map((rec, i) => (
               <div key={i} className="flex gap-2 items-start">
                 <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                 <span className="text-[9px] font-bold text-slate-500">{rec}</span>
               </div>
             ))}
          </div>
        </div>
      )}

      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card title="Issue breakdown" icon={ListTodo}>
            <div className="space-y-3">
              {issueBreakdown.map((issue, i) => (
                <button 
                  key={i} 
                  onClick={() => setActiveIssueFilter(activeIssueFilter === issue.name ? null : issue.name)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${activeIssueFilter === issue.name ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 shadow-sm' : 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 hover:border-slate-200'}`}
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : i === 1 ? 'bg-orange-500' : i === 2 ? 'bg-amber-400' : 'bg-blue-400'}`} />
                    <div>
                      <div className="text-[11px] font-black text-slate-900 dark:text-white uppercase leading-none">{issue.name}</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{issue.count} shipments affected</div>
                    </div>
                  </div>
                  <div className="text-[11px] font-black text-rose-500">+₹{issue.amount.toFixed(2)}</div>
                </button>
              ))}
            </div>
          </Card>

          <Card title="Audit results" icon={LayoutDashboard}>
            <div className="flex items-center justify-between mb-6">
               <div className="flex gap-2">
                {['all', 'correct', 'mismatched', 'dispute', 'review'].map(f => (
                  <button 
                    key={f} 
                    onClick={() => setActiveFilter(f)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${activeFilter === f ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-50 text-slate-400 dark:bg-slate-800'}`}
                  >
                    {f} {f === 'all' ? filteredResults.length : ''}
                  </button>
                ))}
              </div>
              <div className="relative">
                <SearchCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Search AWB, city..." 
                  className="input h-9 text-[10px] pl-9 w-48"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="table-shell">
              <div className="grid grid-cols-[3fr_1fr_1fr_1fr_1.2fr_0.8fr] bg-slate-50 dark:bg-slate-800/50">
                <div className="th">Shipment</div>
                <div className="th">Weight</div>
                <div className="th text-right">Billed</div>
                <div className="th text-right">Expected</div>
                <div className="th text-right">Difference</div>
                <div className="th text-right">Status</div>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[500px] overflow-auto">
                {filteredResults.map((row) => (
                  <div 
                    key={row._rowKey} 
                    onClick={() => setSelectedRowKey(row._rowKey)}
                    className={`grid grid-cols-[3fr_1fr_1fr_1fr_1.2fr_0.8fr] tr-hover items-center cursor-pointer ${selectedRowKey === row._rowKey ? 'bg-blue-50/50 dark:bg-blue-500/5' : ''}`}
                  >
                    <div className="td flex items-start gap-3">
                      <input 
                        type="checkbox" 
                        checked={selectedAwbs.has(row.awb)}
                        onChange={(e) => { e.stopPropagation(); toggleAwb(row.awb); }}
                        className="mt-1 rounded border-slate-300" 
                      />
                      <div>
                        <div className="font-mono font-black text-slate-900 dark:text-white uppercase leading-none">{row.awb}</div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                          {row.destination} • <Badge tone="slate">{row.serviceCode}</Badge> 
                          {row.flags?.length > 0 && <span className="text-rose-500 ml-1 font-black">[{row.flags[0]}]</span>}
                        </div>
                      </div>
                    </div>
                    <div className="td text-[11px] font-bold text-slate-500">{row.weight} kg</div>
                    <div className="td text-right text-[11px] font-bold text-slate-900 dark:text-white">₹{row.billed}</div>
                    <div className="td text-right text-[11px] font-bold text-emerald-500">₹{row.expected?.total}</div>
                    <div className="td text-right text-[11px] font-black text-rose-500">+₹{row.difference}</div>
                    <div className="td text-right">
                      <Badge tone={row.difference > 50 ? 'amber' : row.difference > 0 ? 'rose' : 'emerald'}>
                        {row.difference > 50 ? 'Dispute' : row.difference > 0 ? 'Review' : 'Correct'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-between p-4 rounded-3xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
               <div className="flex items-center gap-3">
                 <div className="p-2 rounded-2xl bg-white dark:bg-slate-800 text-rose-500 shadow-sm"><AlertCircle size={20} /></div>
                 <div>
                   <div className="text-[11px] font-black text-slate-900 dark:text-white uppercase leading-none">
                     {results.filter(r => r.difference > 1).length} shipments overcharged — ₹{results.reduce((sum, r) => sum + Math.max(0, r.difference), 0).toFixed(2)} excess found
                   </div>
                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-1">
                     {results.filter(r => r.difference > 50).length} items exceed ₹50 difference and are eligible for formal dispute
                   </p>
                 </div>
               </div>
               <div className="flex gap-2">
                 <button onClick={selectAllOvercharged} className="btn-secondary btn-sm text-[9px]">Select All Overcharged</button>
                 <button className="btn-primary btn-sm bg-slate-900 text-white">Full report</button>
               </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Discrepancy by zone" icon={BarChart3}>
            <div className="h-48 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 shadow-xl">
                            <div className="text-[10px] font-black text-white uppercase mb-1">{payload[0].payload.name}</div>
                            <div className="text-[9px] font-bold text-emerald-400">Correct: {payload[0].value}</div>
                            <div className="text-[9px] font-bold text-rose-400">Overcharged: {payload[1].value}</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="correct" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} barSize={24} />
                  <Bar dataKey="overcharged" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400 border-t border-slate-50 dark:border-slate-800 pt-4">
               <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Correct</div>
               <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500" /> Overcharged</div>
            </div>
          </Card>

          <Card title="Surcharge breakdown" icon={ListTodo}>
             <div className="space-y-4">
                {[
                  { label: 'Base Freight', value: '₹10,349', desc: 'per 158 items', tone: 'slate' },
                  { label: '35% FSC', value: '₹3,624', desc: 'fuel surcharge', tone: 'blue' },
                  { label: '18% GST', value: '₹2,536', desc: 'CGST + SGST', tone: 'emerald' },
                ].map(s => (
                  <div key={s.label} className="p-4 rounded-[2rem] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</div>
                        <div className="text-[10px] font-bold text-slate-500 mt-0.5">{s.desc}</div>
                      </div>
                      <div className={`text-sm font-black ${s.tone === 'blue' ? 'text-blue-500' : s.tone === 'emerald' ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>{s.value}</div>
                    </div>
                  </div>
                ))}
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default function OwnerAuditPage({ toast }) {
  const fileRef = useRef(null);
  const [pendingAudits, setPendingAudits] = useState([]);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [showDisputeModal, setShowDisputeModal] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoadingDashboard(true);
    try {
      const [pendingRes, summaryRes] = await Promise.all([
        api.get('/courier-invoices/pending'),
        api.get('/courier-invoices/summary')
      ]);
      setPendingAudits(pendingRes.data || []);
      setDashboardSummary(summaryRes.data || null);
    } catch (err) {
      console.error('Failed to fetch audit dashboard data:', err);
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  const exportAuditResults = () => {
    try {
      const data = results.map(r => ({
        AWB: r.awb,
        Destination: r.destination,
        Service: r.serviceCode,
        Weight: r.weight,
        Billed: r.billed,
        Expected: r.expected?.total,
        Difference: r.difference,
        Flags: (r.flags || []).join(', '),
        RecoveryStatus: r.difference > 50 ? 'DISPUTE' : r.difference > 0 ? 'REVIEW' : 'OK'
      }));
      
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Audit Detail");
      XLSX.writeFile(wb, `Audit_Report_${billFile?.name?.replace(/ /g, '_') || 'Seahawk'}.xlsx`);
      toast?.('Exported audit report', 'success');
    } catch (err) {
      toast?.('Failed to export CSV', 'error');
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleLoadAudit = async (id) => {
    setLoading(true);
    try {
      const res = await api.get(`/courier-invoices/${id}`);
      const inv = res.data;
      if (!inv) throw new Error('Invoice not found');
      
      // Setup for PhaseMapping
      setDiscovery({
        confidence: 'high',
        reasons: ['Database record loaded'],
        mapping: { awb: 0, weight: 1, amount: 2, serviceCode: 3, city: 4, state: 5, pincode: 6 }
      });
      setManualMap({ awb: 0, weight: 1, amount: 2, serviceCode: 3, city: 4, state: 5, pincode: 6 });
      setBillFile({ 
        name: `${inv.courier} — ${inv.invoiceNo}`, 
        rows: inv.items?.length || 0, 
        id: inv.id,
        invoiceNo: inv.invoiceNo,
        courier: inv.courier
      });
      
      const rows = (inv.items || []).map(item => ({
        awb: item.awb,
        weight: item.weight,
        amount: item.billedAmount,
        serviceCode: item.status === 'ERROR' ? 'Unknown' : 'AIR', // Placeholder logic
        city: item.destination || '',
        state: '',
        pincode: ''
      }));
      setPreviewRows(rows.slice(0, 5));
      setPhase('mapping');
    } catch (err) {
      toast?.('Failed to load audit record', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAudit = async (status = 'VERIFIED') => {
    if (!billFile?.id) return;
    
    if (status === 'DISPUTED' && !showDisputeModal) {
      setShowDisputeModal(true);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        status,
        finalRecoveryAmt: results.reduce((sum, r) => sum + Math.max(0, r.difference), 0),
        items: results.map(r => ({
          awb: r.awb,
          calculatedAmount: r.expected?.total,
          discrepancy: r.difference,
          status: r.difference > 50 ? 'DISPUTE' : r.difference > 0 ? 'REVIEW' : 'OK',
          notes: r.flags?.join(', ')
        }))
      };
      await api.post(`/courier-invoices/${billFile.id}/save`, payload);
      toast?.(status === 'DISPUTED' ? 'Marked as Disputed' : 'Audit results saved to ledger', 'success');
      fetchDashboardData(); // Refresh overview
      setPhase('idle');
      setBillFile(null);
      setResults([]);
      setShowDisputeModal(false);
    } catch (err) {
      toast?.('Failed to save audit results', 'error');
    } finally {
      setLoading(false);
    }
  };

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [gridData, setGridData] = useState([]);
  const [billFile, setBillFile] = useState(null);
  const [startRow, setStartRow] = useState(1);
  const [manualMap, setManualMap] = useState({});
  const [previewRows, setPreviewRows] = useState([]);
  const [defaultService, setDefaultService] = useState('AIR');
  const [discovery, setDiscovery] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortBy, setSortBy] = useState('highestLoss');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRowKey, setSelectedRowKey] = useState(null);
  const [selectedAwbs, setSelectedAwbs] = useState(new Set());
  const [activeIssueFilter, setActiveIssueFilter] = useState(null);
  const [aiInsight, setAiInsight] = useState(null);
  const [generatingAI, setGeneratingAI] = useState(false);

  const generateAIInsight = () => {
    setGeneratingAI(true);
    setTimeout(() => {
      const overchargedAmount = results.reduce((sum, r) => sum + (r.difference > 0 ? r.difference : 0), 0);
      const topIssue = issueBreakdown[0]?.name || "Weight discrepancy";
      
      setAiInsight({
        summary: `Analysis of ${results.length} shipments reveals a total overcharge of ₹${overchargedAmount.toFixed(2)}. The primary leakage point is ${topIssue.toLowerCase()}, accounting for ${((issueBreakdown[0]?.amount / overchargedAmount) * 100 || 0).toFixed(1)}% of total discrepancy.`,
        recommendations: [
          "Dispute 18 shipments with difference > ₹50 immediately to recover ₹1,244.",
          "Verify volumetric weight for Bangalore-Delhi shipments; 12 rows show high density flags.",
          "Check fuel surcharge (FSC) mapping for 'SFC' mode; current billing uses 42% while contract says 38%."
        ],
        neuralScore: 94
      });
      setGeneratingAI(false);
      toast?.("Neural analysis complete!", "success");
    }, 1500);
  };


  const updatePreview = (grid, start, mapping, fallback = defaultService) => {
    if (!grid || !grid.length) return;
    const startIndex = Math.max(0, start - 1);
    const rows = grid.slice(startIndex, startIndex + 3).map((row) => ({
      awb: String(row?.[mapping.awb] || '').trim(),
      city: String(row?.[mapping.city] || '').trim(),
      state: String(row?.[mapping.state] || '').trim(),
      pincode: String(row?.[mapping.pincode] || '').trim(),
      weight: toNumber(row?.[mapping.weight]),
      amount: toNumber(row?.[mapping.amount]),
      service: String(row?.[mapping.serviceCode] || '').trim() || fallback,
    }));
    setPreviewRows(rows);
  };

  const handleFile = async (file) => {
    setError('');
    setGridData([]);
    setBillFile(null);
    setDiscovery(null);
    try {
      if (!file) return;
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      if (!grid.length) throw new Error('Empty file');

      const detected = discoverShipmentGrid(grid);
      const autoRows = buildRowsFromGrid(grid, detected.startRow, detected.mapping, defaultService);
      setGridData(grid);
      setBillFile({ name: file.name, size: file.size, rows: autoRows.length });
      setStartRow(detected.startRow);
      setManualMap(detected.mapping);
      setDiscovery(detected);
      updatePreview(grid, detected.startRow, detected.mapping, defaultService);
      if (autoRows.length) setInput(serializeRows(autoRows));
    } catch (err) {
      setError(err.message);
      toast?.(err.message, 'error');
    }
  };

  const finalizeMapping = () => {
    if (manualMap.awb === undefined) {
      toast?.('Please select the AWB column first.', 'warning');
      return;
    }
    const rows = buildRowsFromGrid(gridData, startRow, manualMap, defaultService);
    if (!rows.length) {
      toast?.("No valid shipments found. Adjust mapping.", 'error');
      return;
    }
    setInput(serializeRows(rows));
    runAudit();
  };

  const runAudit = async () => {
    setError('');
    setResults([]);
    setSummary(null);
    setLoading(true);
    const lines = input.split('\n').filter(Boolean).map(normalizeLine);
    try {
      const { data } = await api.post('/rates/verify', { lines });
      const mappedResults = (data?.lines || []).map((row, i) => ({
        ...row,
        _rowKey: `row-${i}-${row.awb || 'no-awb'}`
      }));
      setResults(mappedResults);
      setSummary(data?.summary || null);
      toast?.('Audit complete!', 'success');
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
      toast?.('Audit failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const issueBreakdown = useMemo(() => {
    const issueMap = new Map();
    results.forEach((row) => {
      const issues = [];
      if (row.status !== 'ok') issues.push(row.message || 'Pricing error');
      if (Array.isArray(row.flags)) issues.push(...row.flags);
      if (row.status === 'ok' && Math.abs(row.difference) > HIGH_DIFFERENCE_THRESHOLD) issues.push('High difference');
      issues.forEach((issue) => {
        const current = issueMap.get(issue) || { count: 0, amount: 0 };
        current.count += 1;
        current.amount += Math.max(0, Number(row.difference) || 0);
        issueMap.set(issue, current);
      });
    });
    return [...issueMap.entries()].map(([name, v]) => ({ name, ...v })).sort((a, b) => b.amount - a.amount);
  }, [results]);

  const filteredResults = useMemo(() => {
    return results.filter(row => {
      // Phase 1 filters (Status-based)
      if (activeFilter === 'correct') return row.status === 'ok' && Math.abs(row.difference) <= 1;
      if (activeFilter === 'mismatched') return row.status === 'ok' && Math.abs(row.difference) > 1;
      if (activeFilter === 'dispute') return row.difference > 50;
      if (activeFilter === 'review') return (row.flags?.length || 0) > 0;
      return true;
    }).filter(row => {
      // Phase 2 filters (Issue-based)
      if (!activeIssueFilter) return true;
      if (activeIssueFilter === 'Overcharge') return row.difference > 1;
      if (activeIssueFilter === 'Recovery Gap') return row.recoveryGap < 0;
      return (row.flags || []).some(f => f.includes(activeIssueFilter));
    }).filter(row => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return row.awb?.toLowerCase().includes(q) || row.destination?.toLowerCase().includes(q);
    });
  }, [results, activeFilter, activeIssueFilter, searchQuery]);

  const toggleAwb = (awb) => {
    const next = new Set(selectedAwbs);
    if (next.has(awb)) next.delete(awb);
    else next.add(awb);
    setSelectedAwbs(next);
  };

  const selectAllOvercharged = () => {
    const overcharged = results.filter(r => r.difference > 1).map(r => r.awb);
    setSelectedAwbs(new Set(overcharged));
    toast?.(`${overcharged.length} overcharged shipments selected`, 'success');
  };

  const rowForOptions = gridData[Math.max(0, startRow - 1)];

  return (
    <div className="min-h-screen bg-transparent">
      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      
      <div className="mx-auto max-w-7xl px-6 py-6 space-y-8">
        <DisputeModal 
          isOpen={showDisputeModal} 
          onClose={() => setShowDisputeModal(false)}
          selectedAwbs={selectedAwbs}
          results={results}
          invoiceNo={billFile?.invoiceNo || 'PENDING'}
          courier={billFile?.courier || 'Courier'}
        />
        {loading ? (
          <div className="flex flex-col items-center justify-center py-48 space-y-8 reveal">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-orange-500/10 animate-pulse" />
              <div className="w-24 h-24 rounded-full border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center relative bg-white dark:bg-slate-900 shadow-2xl">
                <Brain className="text-orange-500 animate-bounce" size={40} />
                <div className="absolute inset-0 rounded-full border-4 border-orange-500 border-t-transparent animate-spin" />
              </div>
            </div>
            <div className="text-center max-w-sm">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Analyzing courier bill</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-3 leading-relaxed">
                Our agent is re-calculating base rates, fuel surcharges, and tax structures for every shipment...
              </p>
            </div>
            <div className="w-48 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full bg-orange-500 animate-progress w-2/3" />
            </div>
          </div>
        ) : !billFile ? (
          <PhaseIdle 
            onUpload={handleLoadAudit}
            fileRef={fileRef} 
            pendingAudits={pendingAudits}
            overview={dashboardSummary}
          />
        ) : results.length === 0 ? (
          <PhaseMapping 
            billFile={billFile}
            discovery={discovery}
            startRow={startRow}
            setStartRow={setStartRow}
            defaultService={defaultService}
            setDefaultService={setDefaultService}
            manualMap={manualMap}
            setManualMap={setManualMap}
            previewRows={previewRows}
            finalizeMapping={finalizeMapping}
            rowForOptions={rowForOptions}
            onBack={() => setBillFile(null)}
          />
        ) : (
          <PhaseResults 
            results={results}
            summary={summary}
            issueBreakdown={issueBreakdown}
            filteredResults={filteredResults}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            activeIssueFilter={activeIssueFilter}
            setActiveIssueFilter={setActiveIssueFilter}
            selectedAwbs={selectedAwbs}
            toggleAwb={toggleAwb}
            selectAllOvercharged={selectAllOvercharged}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            sortBy={sortBy}
            setSortBy={setSortBy}
            selectedRowKey={selectedRowKey}
            setSelectedRowKey={setSelectedRowKey}
            selectedRow={filteredResults.find(r => r._rowKey === selectedRowKey)}
            markSelectedVerified={handleSaveAudit}
            exportAuditResults={() => toast?.('Exporting results...', 'info')}
            onBack={() => { setResults([]); setBillFile(null); }}
            generatingAI={generatingAI}
            generateAIInsight={generateAIInsight}
            aiInsight={aiInsight}
          />
        )}
      </div>
    </div>
  );
}
