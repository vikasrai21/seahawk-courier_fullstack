import { useEffect, useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Spinner } from '../components/ui/Loading';
import api from '../services/api';
import {
  AlertTriangle,
  CircleCheck,
  CircleX,
  FileSearch,
  RefreshCw,
  ShieldCheck,
  Upload,
} from 'lucide-react';

const DEFAULT_SAMPLE = `100436369612,Kolkata,West Bengal,AR1,0.1,40.45
100436369613,Bangalore,Karnataka,AC1,4.42,694.51
100436369614,Chennai,Tamil Nadu,SF1,1.03,153.32`;

const BILL_FIELD_PATTERNS = {
  awb: [/^awb/i, /^airway/i, /^docket/i, /^cn\.?no/i, /^tracking/i, /^shipment.?no/i],
  city: [/^city$/i, /^destination.?city$/i, /^dest.?city$/i, /^to$/i, /^place$/i],
  state: [/^state$/i, /^destination.?state$/i, /^dest.?state$/i],
  district: [/^district$/i, /^destination.?district$/i, /^dest.?district$/i],
  destination: [/^destination$/i, /^dest$/i, /^location$/i, /^consignee.?city$/i],
  serviceCode: [/^service/i, /^service.?code$/i, /^cn.?type$/i, /^type$/i, /^mode$/i, /^product$/i],
  weight: [/^weight$/i, /^wt$/i, /^actual.?weight$/i, /^charge.?weight$/i, /^kg$/i],
  amount: [/^amount$/i, /^amt$/i, /^freight$/i, /^charges?$/i, /^bill.?amount$/i, /^total$/i],
};

function detectBillField(header) {
  const value = String(header || '').trim();
  for (const [field, patterns] of Object.entries(BILL_FIELD_PATTERNS)) {
    if (patterns.some((pattern) => pattern.test(value))) return field;
  }
  return null;
}

function buildBillColumnMap(headers) {
  const map = {};
  headers.forEach((header) => {
    const field = detectBillField(header);
    if (field && !map[field]) map[field] = header;
  });
  return map;
}

function toNumber(value) {
  if (typeof value === 'number') return value;
  const normalized = String(value || '').replace(/[^\d.-]/g, '');
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function splitDestination(value) {
  const text = String(value || '').trim();
  if (!text) return { city: '', state: '' };

  const commaParts = text.split(',').map((part) => part.trim()).filter(Boolean);
  if (commaParts.length >= 2) {
    return {
      city: commaParts[0],
      state: commaParts[commaParts.length - 1],
    };
  }

  return { city: text, state: '' };
}

function normalizeBillRows(rawRows) {
  if (!rawRows.length) return [];
  const columnMap = buildBillColumnMap(Object.keys(rawRows[0] || {}));

  return rawRows.map((row) => {
    const raw = {};
    Object.entries(columnMap).forEach(([field, column]) => {
      raw[field] = row[column];
    });

    const destination = raw.destination || '';
    const split = splitDestination(destination);
    const city = String(raw.city || split.city || '').trim();
    const state = String(raw.state || split.state || '').trim();

    return {
      awb: String(raw.awb || '').trim(),
      city,
      state,
      district: String(raw.district || '').trim(),
      serviceCode: String(raw.serviceCode || '').trim().toUpperCase(),
      weight: toNumber(raw.weight),
      amount: toNumber(raw.amount),
    };
  }).filter((row) => row.awb || (row.city && row.state && row.serviceCode && row.weight > 0));
}

function formatRowsForTextarea(rows) {
  return rows.map((row) => [
    row.awb || '',
    row.city || '',
    row.state || '',
    row.serviceCode || '',
    row.weight || '',
    row.amount || '',
    row.district || '',
  ].join(',')).join('\n');
}

function normalizeLine(line) {
  const cells = line.split(',').map((cell) => cell.trim());
  if (cells.length < 5) return null;

  let awb = '';
  let city = '';
  let state = '';
  let serviceCode = '';
  let weight = '';
  let amount = '';
  let rest = [];

  if (cells.length >= 6) {
    [awb, city, state, serviceCode, weight, amount, ...rest] = cells;
  } else {
    [city, state, serviceCode, weight, amount, ...rest] = cells;
  }

  return {
    awb,
    city,
    state,
    district: rest[0] || '',
    serviceCode,
    weight: parseFloat(weight),
    amount: parseFloat(amount),
  };
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function monthStartString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export default function OwnerAuditPage({ toast }) {
  const fileRef = useRef(null);
  const [input, setInput] = useState(DEFAULT_SAMPLE);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState('');
  const [billFile, setBillFile] = useState(null);
  const [parsedBillRows, setParsedBillRows] = useState([]);

  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerRows, setLedgerRows] = useState([]);
  const [ledgerSummary, setLedgerSummary] = useState(null);
  const [ledgerPagination, setLedgerPagination] = useState(null);
  const [ledgerFilters, setLedgerFilters] = useState({
    dateFrom: monthStartString(),
    dateTo: todayString(),
    q: '',
    page: 1,
  });

  const verifiedCount = useMemo(() => {
    if (!summary) return 0;
    return summary.total - summary.errors;
  }, [summary]);

  const fetchLedger = async (nextFilters = ledgerFilters) => {
    setLedgerLoading(true);
    try {
      const params = {
        date_from: nextFilters.dateFrom || undefined,
        date_to: nextFilters.dateTo || undefined,
        q: nextFilters.q || undefined,
        page: nextFilters.page || 1,
        limit: 25,
      };
      const res = await api.get('/shipments/import-ledger', { params });
      setLedgerRows(res.data?.rows || []);
      setLedgerSummary(res.data?.summary || null);
      setLedgerPagination(res.pagination || null);
    } catch (err) {
      setLedgerRows([]);
      setLedgerSummary(null);
      setLedgerPagination(null);
      toast?.(err?.message || 'Could not load imported audit rows.', 'error');
    } finally {
      setLedgerLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger(ledgerFilters);
  }, []);

  const handleBillFile = async (file) => {
    setError('');
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      const normalizedRows = normalizeBillRows(rawRows);

      if (!normalizedRows.length) {
        setError('Could not detect bill rows from this file. Please check the header names.');
        setParsedBillRows([]);
        setBillFile(null);
        return;
      }

      setBillFile({ name: file.name, rows: normalizedRows.length });
      setParsedBillRows(normalizedRows);
      setInput(formatRowsForTextarea(normalizedRows));
      toast?.(`Loaded ${normalizedRows.length} bill rows from ${file.name}`, 'success');
    } catch (err) {
      setBillFile(null);
      setParsedBillRows([]);
      setError(err?.message || 'Could not read bill file.');
      toast?.(err?.message || 'Could not read bill file.', 'error');
    }
  };

  const handleVerify = async () => {
    setError('');
    setResults([]);
    setSummary(null);

    const lines = input
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map(normalizeLine);

    if (lines.some((line) => !line)) {
      setError('Each row must be AWB, City, State, Service Code, Weight, Amount or City, State, Service Code, Weight, Amount.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/rates/verify', { lines });
      setResults(data?.lines || []);
      setSummary(data?.summary || null);
      if (!data?.lines?.length) toast?.('No rows were verified.', 'warning');
    } catch (err) {
      setError(err?.message || 'Rate verification failed.');
      toast?.(err?.message || 'Rate verification failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderDiff = (diff) => {
    if (diff === null || diff === undefined) return 'N/A';
    const sign = diff > 0 ? '+' : '';
    const cls = Math.abs(diff) > 1 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400';
    return <span className={cls}>{sign}{diff.toFixed(2)}</span>;
  };

  const renderRecovery = (gap) => {
    if (gap === null || gap === undefined) return 'N/A';
    const sign = gap > 0 ? '+' : '';
    const cls = gap < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400';
    return <span className={cls}>{sign}{gap.toFixed(2)}</span>;
  };

  const applyLedgerFilters = () => {
    const next = { ...ledgerFilters, page: 1 };
    setLedgerFilters(next);
    fetchLedger(next);
  };

  const previewRows = parsedBillRows.slice(0, 6);

  const goToPage = (page) => {
    const next = { ...ledgerFilters, page };
    setLedgerFilters(next);
    fetchLedger(next);
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="text-2xl font-bold mb-1">Audit</h1>
        <p className="text-sm text-slate-500">
          Owner-only audit center for imported billing rows and courier bill reconciliation.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">Courier Bill Audit</h2>
              <p className="text-xs text-slate-500">Upload a courier bill file or paste rows manually. The audit checks AWBs against your database and compares billed cost vs expected contract cost.</p>
            </div>
          </div>

          <div
            className={`rounded-2xl border-2 border-dashed p-4 transition cursor-pointer ${billFile ? 'border-emerald-300 bg-emerald-50/60' : 'border-slate-300 hover:border-slate-400 bg-slate-50'}`}
            onClick={() => fileRef.current?.click()}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleBillFile(file);
              }}
            />
            <div className="flex items-start gap-3">
              <Upload className="mt-0.5 h-5 w-5 text-slate-600" />
              <div className="space-y-1">
                <div className="font-semibold text-slate-900 dark:text-white">
                  {billFile ? `Loaded ${billFile.name}` : 'Upload courier bill (.xlsx, .xls, .csv)'}
                </div>
                <div className="text-xs text-slate-500">
                  We read AWB, destination, state, service code, weight, and amount from the bill and prepare it for audit.
                </div>
                {billFile && (
                  <div className="text-xs text-emerald-700">
                    {billFile.rows} rows detected from the uploaded bill.
                  </div>
                )}
              </div>
            </div>
          </div>

          {previewRows.length > 0 && (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">AWB</th>
                    <th className="px-3 py-2 text-left">City</th>
                    <th className="px-3 py-2 text-left">State</th>
                    <th className="px-3 py-2 text-left">Service</th>
                    <th className="px-3 py-2 text-left">Weight</th>
                    <th className="px-3 py-2 text-left">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, index) => (
                    <tr key={`${row.awb || 'row'}-${index}`} className="border-t border-slate-100">
                      <td className="px-3 py-2 font-mono text-xs">{row.awb || '—'}</td>
                      <td className="px-3 py-2">{row.city || '—'}</td>
                      <td className="px-3 py-2">{row.state || '—'}</td>
                      <td className="px-3 py-2">{row.serviceCode || '—'}</td>
                      <td className="px-3 py-2">{row.weight ? row.weight.toFixed(2) : '—'}</td>
                      <td className="px-3 py-2">{row.amount ? row.amount.toFixed(2) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <label className="font-semibold text-slate-600 dark:text-slate-200">Paste invoice rows</label>
          <textarea
            className="w-full h-36 rounded-2xl border border-slate-200 bg-white p-4 font-mono text-sm leading-relaxed shadow-sm focus:border-orange-400 focus:outline-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="AWB, City, State, Service, Weight, Amount"
          />
          <p className="text-xs text-slate-500">
            Use either `AWB, City, State, Service Code, Weight, Amount` or `City, State, Service Code, Weight, Amount`. Upload is supported for Excel/CSV bills; PDF automation can be added next.
          </p>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          <button
            className="rounded-2xl bg-slate-900 px-4 py-2 text-white font-semibold inline-flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
            onClick={handleVerify}
            disabled={loading}
          >
            {loading ? <Spinner size="sm" /> : 'Run bill audit'}
          </button>

          {summary && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300">
              <div className="flex flex-wrap gap-4">
                <div><strong className="text-slate-900 dark:text-white">{summary.total}</strong> rows submitted</div>
                <div><strong className="text-emerald-600 dark:text-emerald-400">{verifiedCount}</strong> verified</div>
                <div><strong className="text-red-600 dark:text-red-400">{summary.errors}</strong> errors</div>
                <div><strong className="text-amber-600 dark:text-amber-400">{summary.mismatched}</strong> rate mismatches</div>
                <div><strong className="text-red-600 dark:text-red-400">{summary.underRecovered || 0}</strong> under-recovered</div>
                <div><strong className="text-sky-600 dark:text-sky-400">{summary.flagged || 0}</strong> flagged rows</div>
                <div><strong className="text-red-600 dark:text-red-400">{summary.unmatchedAwbs || 0}</strong> unmatched AWBs</div>
              </div>
            </div>
          )}
        </div>

        <div className="card space-y-4">
          <div className="flex items-center gap-2">
            <FileSearch className="h-5 w-5 text-sky-600" />
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">Imported Rows Audit</h2>
              <p className="text-xs text-slate-500">This shows every imported billing line, including repeated AWBs.</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            <input
              type="date"
              className="input"
              value={ledgerFilters.dateFrom}
              onChange={(e) => setLedgerFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
            />
            <input
              type="date"
              className="input"
              value={ledgerFilters.dateTo}
              onChange={(e) => setLedgerFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
            />
            <input
              type="text"
              className="input md:col-span-2"
              placeholder="Search AWB, client, consignee, destination, courier"
              value={ledgerFilters.q}
              onChange={(e) => setLedgerFilters((prev) => ({ ...prev, q: e.target.value }))}
            />
          </div>

          <button
            className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 inline-flex w-fit items-center gap-2 hover:bg-slate-50"
            onClick={applyLedgerFilters}
            disabled={ledgerLoading}
          >
            {ledgerLoading ? <Spinner size="sm" /> : <RefreshCw size={15} />}
            Refresh audit rows
          </button>

          {ledgerSummary && (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Rows</div>
                <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{ledgerSummary.totalRows}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Unique AWBs</div>
                <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{ledgerSummary.uniqueAwbs}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Repeated rows</div>
                <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{ledgerSummary.repeatedRows}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="text-xs uppercase tracking-wide text-slate-500">Batches</div>
                <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{ledgerSummary.batches}</div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4 sm:col-span-2 xl:col-span-2">
                <div className="text-xs uppercase tracking-wide text-slate-500">Imported amount</div>
                <div className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">₹{Number(ledgerSummary.totalAmount || 0).toLocaleString('en-IN')}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {results.length > 0 && (
        <div className="card overflow-x-auto">
          <div className="mb-3">
            <h3 className="font-semibold text-slate-900 dark:text-white">Bill audit results</h3>
          </div>
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="text-xs uppercase text-slate-500">
                <th className="px-3 py-2">AWB</th>
                <th className="px-3 py-2">Destination</th>
                <th className="px-3 py-2">Service</th>
                <th className="px-3 py-2">Weight</th>
                <th className="px-3 py-2">Billed</th>
                <th className="px-3 py-2">Client charged</th>
                <th className="px-3 py-2">DB match</th>
                <th className="px-3 py-2">Expected</th>
                <th className="px-3 py-2">Rate diff</th>
                <th className="px-3 py-2">Recovery gap</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((row, idx) => (
                <tr key={idx} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-3 py-3 font-mono text-xs">{row.awb || '—'}</td>
                  <td className="px-3 py-3">{row.destination}</td>
                  <td className="px-3 py-3 text-slate-500">{row.serviceCode} / {row.courierId}</td>
                  <td className="px-3 py-3">{row.weight?.toFixed(2)}</td>
                  <td className="px-3 py-3">{row.billed != null ? row.billed.toFixed(2) : '—'}</td>
                  <td className="px-3 py-3">{row.chargedToClient != null ? row.chargedToClient.toFixed(2) : '—'}</td>
                  <td className="px-3 py-3 text-xs">
                    {row.matchedImport ? (
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-900 dark:text-white">{row.matchedImport.clientCode}</div>
                        <div className="text-slate-500">{row.matchedImport.destination || '—'}</div>
                        <div className="text-slate-500">wt {Number(row.matchedImport.weight || 0).toFixed(2)} · amt {Number(row.matchedImport.amount || 0).toFixed(2)}</div>
                        {row.matchedImportCount > 1 && (
                          <div className="text-amber-600">matched rows: {row.matchedImportCount}</div>
                        )}
                      </div>
                    ) : row.dbShipment ? (
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-900 dark:text-white">{row.dbShipment.clientCode}</div>
                        <div className="text-slate-500">{row.dbShipment.destination || '—'}</div>
                      </div>
                    ) : (
                      <span className="text-red-600">No DB match</span>
                    )}
                  </td>
                  <td className="px-3 py-3">{row.expected?.base?.toFixed(2) || '—'}</td>
                  <td className="px-3 py-3">{renderDiff(row.difference)}</td>
                  <td className="px-3 py-3">{renderRecovery(row.recoveryGap)}</td>
                  <td className="px-3 py-3">
                    <div className="space-y-1">
                      {row.status === 'ok' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-300">
                          <CircleCheck size={14} /> Valid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600">
                          <CircleX size={14} /> {row.message || 'Error'}
                        </span>
                      )}
                      {Array.isArray(row.flags) && row.flags.length > 0 && (
                        <div className="text-xs text-amber-600">
                          {row.flags.join(' · ')}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card overflow-x-auto">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">Imported audit rows</h3>
            <p className="text-xs text-slate-500">Every imported row is preserved here, even when the same AWB repeats.</p>
          </div>
          {ledgerPagination && (
            <div className="text-xs text-slate-500">
              Page {ledgerPagination.page} of {ledgerPagination.pages || 1}
            </div>
          )}
        </div>

        {ledgerLoading ? (
          <div className="py-10 text-center"><Spinner /></div>
        ) : ledgerRows.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500">No imported rows found for this filter.</div>
        ) : (
          <>
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="text-xs uppercase text-slate-500">
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">AWB</th>
                  <th className="px-3 py-2">Client</th>
                  <th className="px-3 py-2">Consignee / Dest.</th>
                  <th className="px-3 py-2">Courier</th>
                  <th className="px-3 py-2">Wt</th>
                  <th className="px-3 py-2">Amt</th>
                  <th className="px-3 py-2">Batch</th>
                </tr>
              </thead>
              <tbody>
                {ledgerRows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-3 py-3 font-mono text-xs">{row.date}</td>
                    <td className="px-3 py-3 font-mono text-xs">{row.awb}</td>
                    <td className="px-3 py-3">{row.clientCode}</td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-slate-900 dark:text-white">{row.consignee || '—'}</div>
                      <div className="text-xs text-slate-500">{row.destination || '—'}</div>
                    </td>
                    <td className="px-3 py-3">{row.courier || '—'}</td>
                    <td className="px-3 py-3">{Number(row.weight || 0).toFixed(2)}</td>
                    <td className="px-3 py-3">₹{Number(row.amount || 0).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-3 text-xs text-slate-500">{row.batchKey}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {ledgerPagination?.pages > 1 && (
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
                  disabled={ledgerPagination.page <= 1}
                  onClick={() => goToPage(ledgerPagination.page - 1)}
                >
                  Previous
                </button>
                <button
                  className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-50"
                  disabled={ledgerPagination.page >= ledgerPagination.pages}
                  onClick={() => goToPage(ledgerPagination.page + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
