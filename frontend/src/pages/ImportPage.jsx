import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { readExcelAsJson, getSheetAsJson } from '../utils/excel';
import {
  Upload, FileSpreadsheet, CheckCircle, AlertCircle,
  RefreshCw, Eye, EyeOff, Columns, Zap, Info
} from 'lucide-react';
import api from '../services/api';

// ── Column auto-detection ─────────────────────────────────────────────────
// Maps any variation of a column name to our internal field name
const FIELD_PATTERNS = {
  date:        [/^date$/i, /^dt$/i, /^dispatch.?date$/i, /^ship.?date$/i],
  clientCode:  [/^client/i, /^party/i, /^account/i, /^cust/i, /^company/i],
  awb:         [/^awb/i, /^airway/i, /^docket/i, /^consign.?no/i, /^tracking/i, /^cn\.?no/i, /^shipment.?no/i, /^doc.?no/i],
  consignee:   [/^consignee/i, /^receiver/i, /^recipient/i, /^deliver.?to/i, /^name/i],
  destination: [/^dest/i, /^city/i, /^to/i, /^location/i, /^place/i, /^pin/i],
  courier:     [/^courier/i, /^carrier/i, /^vendor/i, /^service.?provider/i, /^through/i],
  department:  [/^dept/i, /^department/i, /^division/i, /^branch/i, /^ref/i],
  weight:      [/^wt/i, /^weight/i, /^kg/i, /^gross/i, /^we?g?h?t$/i],
  amount:      [/^amt/i, /^amount/i, /^charges?/i, /^rate/i, /^price/i, /^freight/i, /^bill/i, /^rs/i, /^₹/i, /^total/i],
  status:      [/^status/i, /^state/i, /^delivery.?status/i],
  remarks:     [/^remark/i, /^note/i, /^comment/i, /^narration/i, /^description/i],
  service:     [/^service/i, /^mode/i, /^type/i, /^product/i],
};

function detectField(colName) {
  const name = String(colName).trim();
  for (const [field, patterns] of Object.entries(FIELD_PATTERNS)) {
    if (patterns.some(p => p.test(name))) return field;
  }
  return null;
}

function buildColumnMap(headers) {
  const map = {};
  const unmapped = [];
  headers.forEach(h => {
    const field = detectField(h);
    if (field && !map[field]) map[field] = h; // first match wins
    else if (!field) unmapped.push(h);
  });
  return { map, unmapped };
}

function excelDateToString(val, ambiguousFormat = 'DMY') {
  if (typeof val === 'number') {
    return new Date().toISOString().split('T')[0];
  }
  if (typeof val === 'string') {
    // DD/MM/YYYY or DD-MM-YYYY
    const m = val.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
    if (m) {
      const first = Number(m[1]);
      const second = Number(m[2]);
      const y = m[3].length === 2 ? '20' + m[3] : m[3];
      let month = second;
      let day = first;

      if (first <= 12 && second <= 12 && ambiguousFormat === 'MDY') {
        month = first;
        day = second;
      } else if (first > 12 && second <= 12) {
        day = first;
        month = second;
      } else if (second > 12 && first <= 12) {
        month = first;
        day = second;
      }

      return `${y}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    }
    // YYYY-MM-DD already
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    return val;
  }
  return new Date().toISOString().split('T')[0];
}

function smartNormalizeDates(rows) {
  const isoRows = rows.filter((row) => /^\d{4}-\d{2}-\d{2}$/.test(String(row.date || '')));
  if (!isoRows.length) return rows;

  const monthCounts = isoRows.reduce((acc, row) => {
    const ym = row.date.slice(0, 7);
    acc[ym] = (acc[ym] || 0) + 1;
    return acc;
  }, {});

  const dominantMonth = Object.entries(monthCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0];

  if (!dominantMonth) return rows;
  const dominantMonthNo = Number(dominantMonth.slice(5, 7));

  return rows.map((row) => {
    const m = String(row.date || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return row;

    const year = Number(m[1]);
    const month = Number(m[2]);
    const day = Number(m[3]);

    if (row.date.slice(0, 7) === dominantMonth) return row;
    if (month > 12 || day > 12) return row;
    if (day !== dominantMonthNo) return row;

    return {
      ...row,
      date: `${year}-${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}`,
      _dateCorrected: true,
    };
  });
}

function mapRows(rawRows, colMap, dateFormat = 'DMY') {
  const rows = rawRows.map(row => {
    const s = {};
    for (const [field, col] of Object.entries(colMap)) {
      if (col && row[col] !== undefined && row[col] !== '') {
        s[field] = row[col];
      }
    }
    // Sanitise
    if (s.date)        s.date        = excelDateToString(s.date, dateFormat);
    else               s.date        = new Date().toISOString().split('T')[0];
    if (s.awb)         s.awb         = String(s.awb).trim();
    if (s.clientCode)  s.clientCode  = String(s.clientCode).trim().toUpperCase();
    if (s.consignee)   s.consignee   = String(s.consignee).trim().toUpperCase();
    if (s.destination) s.destination = String(s.destination).trim().toUpperCase();
    if (s.courier)     s.courier     = String(s.courier).trim();
    if (s.department)  s.department  = String(s.department).trim();
    if (s.remarks)     s.remarks     = String(s.remarks).trim();
    if (s.weight)      s.weight      = parseFloat(s.weight)  || 0;
    if (s.amount)      s.amount      = parseFloat(s.amount)  || 0;
    return s;
  }).filter(s => s.awb && String(s.awb).trim() !== '' && String(s.awb).trim() !== 'undefined');

  return smartNormalizeDates(rows);
}

const PREVIEW_FIELDS = ['date','clientCode','awb','consignee','destination','courier','weight','amount','status'];

export default function ImportPage({ toast }) {
  const [file,      setFile]      = useState(null);  // { name, rawRows, headers }
  const [colMap,    setColMap]    = useState({});
  const setUnmapped = useCallback(() => {}, []);
  const [preview,   setPreview]   = useState([]);
  const [mappedRows,setMapped]    = useState([]);
  const [result,    setResult]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [showMap,   setShowMap]   = useState(false);
  const [sheetIdx,  setSheetIdx]  = useState(0);
  const [sheets,    setSheets]    = useState([]);
  const [rawWb,     setRawWb]     = useState(null);
  const [dateFormat, setDateFormat] = useState('DMY');
  const fileRef = useRef();

  const audit = useMemo(() => {
    const awbCounts = new Map();
    mappedRows.forEach((row) => {
      const awb = String(row.awb || '').trim();
      if (awb) awbCounts.set(awb, (awbCounts.get(awb) || 0) + 1);
    });

    const duplicateAwbs = [...awbCounts.entries()].filter(([, count]) => count > 1);
    const monthCounts = mappedRows.reduce((acc, row) => {
      const ym = /^\d{4}-\d{2}-\d{2}$/.test(String(row.date || '')) ? row.date.slice(0, 7) : 'unknown';
      acc[ym] = (acc[ym] || 0) + 1;
      return acc;
    }, {});
    const dominantMonth = Object.entries(monthCounts)
      .filter(([month]) => month !== 'unknown')
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    const correctedDates = mappedRows.filter((row) => row._dateCorrected).length;
    const outsideDominant = dominantMonth
      ? mappedRows.filter((row) => row.date?.slice(0, 7) !== dominantMonth).length
      : 0;

    return {
      totalRows: mappedRows.length,
      uniqueAwbs: awbCounts.size,
      duplicateCount: duplicateAwbs.length,
      duplicateSamples: duplicateAwbs.slice(0, 10),
      monthCounts,
      dominantMonth,
      outsideDominant,
      correctedDates,
    };
  }, [mappedRows]);

  const parseSheet = useCallback((rawRows, idx) => {
    if (!rawRows.length) { setError('Sheet is empty.'); return; }

    const headers        = Object.keys(rawRows[0]);
    const { map, unmapped: ump } = buildColumnMap(headers);

    setColMap(map);
    setUnmapped(ump);

    const rows = mapRows(rawRows, map, dateFormat);
    setMapped(rows);
    setPreview(rows.slice(0, 8));
    setError('');
    if (ump.length > 0 && Object.keys(map).length < 3) setShowMap(true);
  }, [dateFormat]);

  const parseFile = (f) => {
    setResult(null); setError(''); setFile(null); setPreview([]);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const { rows, sheetNames, rawWorkbook } = await readExcelAsJson(e.target.result, 0);
        setRawWb(rawWorkbook);
        setSheets(sheetNames);
        setSheetIdx(0);
        setFile({ name: f.name });
        parseSheet(rows, 0);
      } catch (err) {
        setError('Could not read file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(f);
  };

  const handleSheetChange = (idx) => {
    setSheetIdx(idx);
    if (rawWb) {
      const { rows } = getSheetAsJson(rawWb, idx);
      parseSheet(rows, idx);
    }
  };

  const handleColMapChange = (field, col) => {
    const newMap = { ...colMap, [field]: col || undefined };
    setColMap(newMap);
    const { rows } = getSheetAsJson(rawWb, sheetIdx);
    const mapped = mapRows(
      rows,
      newMap,
      dateFormat
    );
    setMapped(mapped);
    setPreview(mapped.slice(0, 8));
  };

  useEffect(() => {
    if (!rawWb || !sheets.length) return;
    const { rows } = getSheetAsJson(rawWb, sheetIdx);
    const mapped = mapRows(
      rows,
      colMap,
      dateFormat
    );
    setMapped(mapped);
    setPreview(mapped.slice(0, 8));
  }, [dateFormat, rawWb, sheets, sheetIdx, colMap]);

  const handleImport = async () => {
    if (!mappedRows.length) return;
    setLoading(true);
    try {
      const shipments = mappedRows.map(({ _dateCorrected, ...row }) => row);
      const res = await api.post('/shipments/import', { shipments });
      setResult(res.data);
      toast?.(`Imported ${res.data.imported} rows. Tracking sync started for ${res.data.trackingQueued || 0} shipments.`, 'success');
    } catch (err) {
      setError(err.message);
      toast?.(err.message, 'error');
    } finally { setLoading(false); }
  };

  const allHeaders = rawWb && sheets[sheetIdx]
    ? Object.keys(getSheetAsJson(rawWb, sheetIdx).rows[0] || {})
    : [];

  const detectedCount = Object.keys(colMap).length;
  const totalFields   = Object.keys(FIELD_PATTERNS).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Import Excel</h1>
        <p className="text-sm text-gray-500 mt-1">
          Upload your .xlsx file — column names are detected automatically
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5 flex gap-3">
        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">Your Excel columns are auto-detected.</p>
          <p className="text-xs text-blue-600">Works with any column names — Date, AWB No, Docket No, Consignee, DEST, WT, AMOU, Couriers, etc. If amount is blank or zero, the system now auto-prices it from the active client contract during import.</p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-2xl cursor-pointer transition-all mb-4 ${
          file ? 'border-navy-400 bg-navy-50/40' : 'border-gray-200 hover:border-navy-400 hover:bg-navy-50/20'
        }`}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); if (e.dataTransfer.files[0]) parseFile(e.dataTransfer.files[0]); }}
        onClick={() => fileRef.current?.click()}
      >
        <div className="text-center py-10">
          <FileSpreadsheet className={`w-12 h-12 mx-auto mb-3 ${file ? 'text-navy-500' : 'text-gray-300'}`} />
          {file ? (
            <>
              <p className="font-bold text-navy-700">📄 {file.name}</p>
              <p className="text-sm text-gray-500 mt-1">{mappedRows.length} rows ready to import</p>
              <p className="text-xs text-gray-400 mt-0.5">Click to change file</p>
            </>
          ) : (
            <>
              <p className="font-semibold text-gray-600">Drag & drop your Excel file here</p>
              <p className="text-sm text-gray-400 mt-1">or click to browse · .xlsx, .xls</p>
            </>
          )}
        </div>
        <input type="file" accept=".xlsx,.xls,.csv" ref={fileRef} className="hidden"
          onChange={e => { if (e.target.files[0]) parseFile(e.target.files[0]); }} />
      </div>

      {/* Sheet selector */}
      {sheets.length > 1 && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-gray-500 font-semibold">Sheet:</span>
          {sheets.map((s, i) => (
            <button key={i} onClick={() => handleSheetChange(i)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${sheetIdx === i ? 'bg-navy-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Column detection status */}
      {file && (
        <div className="bg-white border border-gray-100 rounded-xl p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Columns className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-bold text-gray-700">Column Detection</span>
              <span className={`badge text-[10px] ${detectedCount >= 4 ? 'badge-green' : detectedCount >= 2 ? 'badge-yellow' : 'badge-red'}`}>
                {detectedCount}/{totalFields} detected
              </span>
            </div>
            <button onClick={() => setShowMap(!showMap)}
              className="text-xs text-navy-600 hover:underline flex items-center gap-1">
              {showMap ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {showMap ? 'Hide' : 'View / Fix'} mapping
            </button>
          </div>

          {/* Detected fields summary */}
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(FIELD_PATTERNS).map(([field]) => {
              const mapped = colMap[field];
              return (
                <span key={field}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                    mapped ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200'
                  }`}>
                  {field}{mapped ? ` ← ${mapped}` : ' —'}
                </span>
              );
            })}
          </div>

          {/* Manual mapping override */}
          {showMap && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="mb-4">
                <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide block mb-1">Ambiguous date format</label>
                <select className="input text-xs py-1.5 max-w-xs" value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}>
                  <option value="DMY">DD-MM-YYYY / DD-MM-YY</option>
                  <option value="MDY">MM-DD-YYYY / MM-DD-YY</option>
                </select>
                <p className="mt-1 text-[11px] text-gray-400">Use this only when dates like 03-05-2026 could mean either 5 March or 3 May.</p>
              </div>
              <p className="text-xs font-bold text-gray-600 mb-3 uppercase tracking-wide">
                Manually assign columns (override auto-detection)
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.keys(FIELD_PATTERNS).map(field => (
                  <div key={field}>
                    <label className="text-[10px] text-gray-500 font-semibold uppercase tracking-wide block mb-1">{field}</label>
                    <select className="input text-xs py-1.5"
                      value={colMap[field] || ''}
                      onChange={e => handleColMapChange(field, e.target.value)}>
                      <option value="">— not mapped —</option>
                      {allHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {file && mappedRows.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <div className="flex flex-wrap gap-4 text-sm text-amber-900">
            <span>Total rows: <strong>{audit.totalRows}</strong></span>
            <span>Unique AWBs: <strong>{audit.uniqueAwbs}</strong></span>
            <span>Repeated AWBs in file: <strong>{audit.duplicateCount}</strong></span>
            <span>Dominant month: <strong>{audit.dominantMonth || '—'}</strong></span>
            <span>Dates auto-corrected: <strong>{audit.correctedDates}</strong></span>
            <span>Rows outside dominant month: <strong>{audit.outsideDominant}</strong></span>
          </div>
          {audit.duplicateSamples.length > 0 && (
            <p className="mt-2 text-xs text-amber-700">
              Repeated AWB samples: {audit.duplicateSamples.map(([awb, count]) => `${awb}×${count}`).join(', ')}
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Preview table */}
      {preview.length > 0 && (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm mb-4 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide">
              Preview — first {preview.length} of {mappedRows.length} rows
            </p>
            <span className="badge badge-blue text-[10px]">{mappedRows.length} total rows</span>
          </div>
          <div className="overflow-x-auto">
            <table className="tbl text-xs">
              <thead>
                <tr>
                  {PREVIEW_FIELDS.filter(f => preview.some(r => r[f])).map(f => (
                    <th key={f}>{f}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i}>
                    {PREVIEW_FIELDS.filter(f => preview.some(r => r[f])).map(f => (
                      <td key={f} className={!row[f] ? 'text-gray-300' : ''}>
                        {row[f] || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mb-4 p-4 rounded-xl bg-green-50 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-bold text-green-800">Import complete!</span>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-green-700">✅ Rows saved: <strong>{result.imported}</strong></span>
            <span className="text-indigo-700">📦 Operational shipments: <strong>{result.operationalCreated || 0}</strong></span>
            <span className="text-yellow-700">♻️ Repeated AWBs linked: <strong>{result.duplicates}</strong></span>
            <span className="text-blue-700">💸 Auto-priced: <strong>{result.autoPriced || 0}</strong></span>
            <span className="text-sky-700">🚚 Tracking sync queued: <strong>{result.trackingQueued || 0}</strong></span>
            {result.errors?.length > 0 && (
              <span className="text-red-700">❌ Errors: <strong>{result.errors.length}</strong></span>
            )}
          </div>
          <p className="mt-2 text-xs text-green-700">
            New and active courier shipments start background tracking sync immediately after import, so clients can see movement sooner.
          </p>
          {result.errors?.length > 0 && (
            <div className="mt-2 text-xs text-red-600 space-y-0.5">
              {result.errors.map((e, i) => <p key={i}>• AWB {e.awb}: {e.error}</p>)}
            </div>
          )}
        </div>
      )}

      {/* Import button */}
      <button
        onClick={handleImport}
        disabled={!mappedRows.length || loading}
        className="btn-primary w-full justify-center py-3 text-base gap-3"
      >
        {loading
          ? <><RefreshCw className="w-5 h-5 animate-spin" /> Importing {mappedRows.length} rows…</>
          : <><Upload className="w-5 h-5" /> Import {mappedRows.length || 0} Shipments</>
        }
      </button>

      {/* Auto-sync instructions */}
      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-amber-900">Auto-Sync: Keep working in Excel, dashboard updates automatically</h3>
            <p className="text-sm text-amber-800 mt-1">
              Instead of waiting 3-4 days for manual entry, you can push rows into Seahawk automatically from Google Sheets, Power Automate, or any system that can call an API.
            </p>
            <p className="text-sm text-amber-800 mt-2">
              <strong>Setup:</strong> use <code className="bg-amber-100 px-1 rounded text-xs">POST /api/public/integrations/excel/import</code> with <code className="bg-amber-100 px-1 rounded text-xs">x-sync-key</code>. A ready-to-use Apps Script template is included in <code className="bg-amber-100 px-1 rounded text-xs">scripts/google-apps-script-sync.gs</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
