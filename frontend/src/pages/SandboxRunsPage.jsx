import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Copy,
  Download,
  Filter,
  Layers,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  TerminalSquare,
  Trash2,
  XCircle,
} from "lucide-react";
import api from "../services/api";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";

const PLATFORMS = ["all", "shopify", "amazon", "flipkart", "custom"];
const ERROR_SCENARIOS = [
  { label: "None (Success)", value: "" },
  { label: "Invalid Address", value: "invalid_address" },
  { label: "Courier Unavailable", value: "courier_unavailable" },
  { label: "API Failure", value: "api_failure" },
  { label: "Delivery Failure", value: "delivery_failure" },
];
const STATUS_FILTERS = [
  { label: "All", value: "" },
  { label: "Success", value: "success" },
  { label: "Partial", value: "partial" },
  { label: "Failed", value: "failed" },
];
const LOG_LEVELS = ["all", "info", "error"];
const LOG_STEPS = ["all", "api", "order", "shipment", "tracking"];
const FLOW_FALLBACK = [
  { key: "api_received", label: "API Received", step: "api", status: "success" },
  { key: "order_created", label: "Order Created", step: "order", status: "pending" },
  { key: "shipment_created", label: "Shipment Created", step: "shipment", status: "pending" },
  { key: "tracking_active", label: "Tracking Active", step: "tracking", status: "pending" },
];

function statusClass(status) {
  const value = String(status || "").toLowerCase();
  if (value === "success") return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-500/10 dark:text-emerald-300";
  if (value === "failed") return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-500/10 dark:text-rose-300";
  return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-500/10 dark:text-amber-300";
}

function fmtTime(value) {
  if (!value) return "not recorded";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
}

function fmtClock(value) {
  if (!value) return "--:--";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "--:--" : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function fmtMs(value) {
  const ms = Number(value);
  if (!Number.isFinite(ms)) return "-";
  if (ms < 1000) return `${Math.max(0, Math.round(ms))} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

function fmtDuration(start, end) {
  if (!start) return "-";
  const startedAt = new Date(start).getTime();
  const endedAt = new Date(end || Date.now()).getTime();
  if (!Number.isFinite(startedAt) || !Number.isFinite(endedAt)) return "-";
  return fmtMs(endedAt - startedAt);
}

function supportedRetryCount(count) {
  const failed = Math.max(1, Number(count) || 1);
  if (failed >= 100) return 100;
  if (failed >= 10) return 10;
  return 1;
}

function getApiData(res, fallback = null) {
  return res?.data ?? fallback;
}

function flowSteps(row) {
  if (Array.isArray(row?.trace?.steps) && row.trace.steps.length) return row.trace.steps;
  const failedAt = row?.flow?.failedAt;
  return FLOW_FALLBACK.map((step) => {
    if (step.key === "order_created") return { ...step, status: row?.flow?.orderReceived ? "success" : failedAt === "order_received" ? "failed" : "pending", failureReason: row?.error?.errorMessage || null };
    if (step.key === "shipment_created") return { ...step, status: row?.flow?.shipmentCreated ? "success" : ["shipment_created", "courier_simulated"].includes(failedAt) ? "failed" : "pending", failureReason: row?.error?.errorMessage || null };
    if (step.key === "tracking_active") return { ...step, status: row?.flow?.trackingActive ? "success" : failedAt === "tracking_active" ? "failed" : "pending", failureReason: row?.error?.errorMessage || null };
    return step;
  });
}

function stepTone(status) {
  if (status === "success") return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-500/10 dark:text-emerald-300";
  if (status === "failed") return "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-500/10 dark:text-rose-300";
  return "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400";
}

function JsonBlock({ value }) {
  return (
    <pre className="max-h-80 overflow-auto rounded-lg border border-slate-200 bg-slate-950 p-3 text-xs leading-relaxed text-slate-100 dark:border-slate-700">
      {JSON.stringify(value || {}, null, 2)}
    </pre>
  );
}

function FlowStep({ step }) {
  const failed = step.status === "failed";
  return (
    <div className={`min-w-[160px] flex-1 rounded-lg border p-3 ${stepTone(step.status)}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-black uppercase tracking-wide">{step.label}</span>
        {step.status === "success" ? <CheckCircle2 size={16} /> : failed ? <XCircle size={16} /> : <Clock3 size={16} />}
      </div>
      <div className="mt-2 text-[11px] font-semibold opacity-80">{fmtClock(step.timestamp)}</div>
      <div className="mt-1 text-[11px] font-black">{fmtMs(step.durationMs)}</div>
      {failed && step.failureReason && <div className="mt-2 text-[11px] font-semibold leading-snug">{step.failureReason}</div>}
    </div>
  );
}

function PerformanceTimeline({ orders, details }) {
  const steps = ["api_received", "order_created", "shipment_created", "tracking_active"].map((key) => {
    const values = orders
      .map((row) => flowSteps(row).find((step) => step.key === key)?.durationMs)
      .filter((value) => Number.isFinite(Number(value)));
    const avg = values.length ? values.reduce((sum, value) => sum + Number(value), 0) / values.length : null;
    const label = FLOW_FALLBACK.find((step) => step.key === key)?.label || key;
    return { key, label, avg };
  });
  const max = Math.max(1, ...steps.map((step) => Number(step.avg) || 0));

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
          <Activity size={16} className="text-blue-500" /> Performance Timeline
        </h3>
        <span className="text-xs font-bold text-slate-500">Run duration {fmtDuration(details?.createdAt, details?.updatedAt)}</span>
      </div>
      <div className="space-y-3">
        {steps.map((step) => (
          <div key={step.key} className="grid grid-cols-[110px_minmax(0,1fr)_72px] items-center gap-3 text-xs">
            <span className="font-black text-slate-700 dark:text-slate-200">{step.label.replace(" Created", "")}</span>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.max(4, ((Number(step.avg) || 0) / max) * 100)}%` }} />
            </div>
            <span className="text-right font-mono font-bold text-slate-600 dark:text-slate-300">{fmtMs(step.avg)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorPanel({ errors }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
      <div className="flex items-center gap-2 border-b border-slate-200 p-4 dark:border-slate-800">
        <ShieldAlert size={16} className="text-rose-500" />
        <h3 className="text-sm font-black text-slate-900 dark:text-white">Error Intelligence</h3>
        <span className="ml-auto rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">
          {errors.length} errors
        </span>
      </div>
      <div className="max-h-[420px] overflow-y-auto p-4">
        {errors.length === 0 ? (
          <div className="flex h-36 flex-col items-center justify-center text-center text-sm text-slate-500">
            <CheckCircle2 size={34} className="mb-2 text-emerald-400" />
            No errors in this run.
          </div>
        ) : errors.map((err, index) => (
          <div key={`${err.at}-${index}`} className="mb-3 rounded-lg border border-rose-200 bg-rose-50/60 p-3 dark:border-rose-900/60 dark:bg-rose-500/10">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-600 dark:text-rose-300" />
              <div className="min-w-0 flex-1">
                <div className="font-mono text-[11px] font-black uppercase text-rose-700 dark:text-rose-300">{err.errorType || "sandbox_error"}</div>
                <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{err.errorMessage}</div>
                <div className="mt-2 rounded-md bg-white/80 p-2 text-xs font-semibold text-slate-700 dark:bg-slate-950/40 dark:text-slate-300">
                  Suggested fix: {err.suggestedFix || "Inspect the failed step, payload, and logs before retrying."}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                  {err.requestId && <span>requestId: {err.requestId}</span>}
                  {err.orderId && <span>orderId: {err.orderId}</span>}
                  {err.shipmentId && <span>shipmentId: {err.shipmentId}</span>}
                  {err.step && <span>step: {err.step}</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LogsPanel({ logs, logsLoaded, logsLoading, logMode, setLogMode, logFilters, setLogFilters, onLoad }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
      <div className="border-b border-slate-200 p-4 dark:border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
            <TerminalSquare size={16} className="text-slate-500" /> Structured Logs
          </h3>
          <div className="inline-flex rounded-lg border border-slate-200 p-1 dark:border-slate-700">
            {["timeline", "json"].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setLogMode(mode)}
                className={`rounded-md px-3 py-1.5 text-xs font-black capitalize ${logMode === mode ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" : "text-slate-500"}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-[120px_140px_minmax(0,1fr)_92px]">
          <select className="input h-9 px-2 py-1 text-xs" value={logFilters.level} onChange={(e) => setLogFilters((p) => ({ ...p, level: e.target.value }))}>
            {LOG_LEVELS.map((level) => <option key={level} value={level}>{level.toUpperCase()}</option>)}
          </select>
          <select className="input h-9 px-2 py-1 text-xs" value={logFilters.step} onChange={(e) => setLogFilters((p) => ({ ...p, step: e.target.value }))}>
            {LOG_STEPS.map((step) => <option key={step} value={step}>{step.toUpperCase()}</option>)}
          </select>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input h-9 pl-8 text-xs" value={logFilters.search} onChange={(e) => setLogFilters((p) => ({ ...p, search: e.target.value }))} placeholder="Filter by requestId, orderId, AWB, or event" />
          </div>
          <button type="button" className="btn-secondary h-9 text-xs" onClick={onLoad} disabled={logsLoading}>
            <RefreshCw size={14} className={logsLoading ? "animate-spin" : ""} /> Load
          </button>
        </div>
      </div>
      <div className="h-[420px] overflow-y-auto bg-slate-50/60 p-4 font-mono text-xs dark:bg-black/20">
        {!logsLoaded ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-500">
            <TerminalSquare size={28} className="text-slate-300" />
            <button type="button" className="btn-secondary h-9" onClick={onLoad} disabled={logsLoading}>
              {logsLoading ? <RefreshCw size={15} className="animate-spin" /> : <Download size={15} />} Load logs
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex h-full items-center justify-center text-slate-500">No logs match these filters.</div>
        ) : logMode === "json" ? (
          <JsonBlock value={logs} />
        ) : logs.map((log, index) => (
          <div key={`${log.at}-${index}`} className={`mb-2 rounded-lg border p-3 ${String(log.level).toLowerCase() === "error" ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/50 dark:bg-rose-500/10 dark:text-rose-300" : "border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="opacity-60">{fmtClock(log.at)}</span>
              <span className="font-black">{log.event || log.message}</span>
              <span className="rounded border border-slate-200 px-1.5 py-0.5 text-[10px] uppercase dark:border-slate-700">{log.level || "info"}</span>
              {log.step && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] dark:bg-slate-800">{log.step}</span>}
            </div>
            <div className="mt-1 text-slate-600 dark:text-slate-400">{log.message}</div>
            <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-500">
              {log.requestId && <span>requestId: {log.requestId}</span>}
              {log.orderId && <span>orderId: {log.orderId}</span>}
              {log.awb && <span>awb: {log.awb}</span>}
              {Number.isFinite(Number(log.durationMs)) && <span>{fmtMs(log.durationMs)}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderTraceCard({ row, expanded, onToggle }) {
  const steps = flowSteps(row);
  const failed = row.error || row.status === "FAILED";
  return (
    <div className={`rounded-lg border bg-white shadow-sm dark:bg-slate-900/40 ${failed ? "border-rose-200 dark:border-rose-900/60" : "border-slate-200 dark:border-slate-800"}`}>
      <button type="button" onClick={onToggle} className="flex w-full items-start justify-between gap-4 p-4 text-left">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {expanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
            <span className="font-mono text-sm font-black text-slate-900 dark:text-white">{row.orderId || "unknown-order"}</span>
            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${failed ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/60 dark:bg-rose-500/10 dark:text-rose-300" : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-500/10 dark:text-emerald-300"}`}>{row.status || (failed ? "FAILED" : "OK")}</span>
            {row.awb && <span className="rounded bg-blue-50 px-2 py-0.5 font-mono text-[11px] font-bold text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">{row.awb}</span>}
          </div>
          <div className="mt-1 flex flex-wrap gap-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
            <span>requestId: {row.requestId || "not recorded"}</span>
            {row.shipmentId && <span>shipmentId: {row.shipmentId}</span>}
          </div>
        </div>
      </button>
      <div className="grid grid-cols-1 gap-2 px-4 pb-4 md:grid-cols-4">
        {steps.map((step) => <FlowStep key={step.key} step={step} />)}
      </div>
      {expanded && (
        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div>
              <h4 className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">API Request Payload</h4>
              <JsonBlock value={row.apiExchange?.request || { requestId: row.requestId, orderId: row.orderId }} />
            </div>
            <div>
              <h4 className="mb-2 text-xs font-black uppercase tracking-wide text-slate-500">API Response</h4>
              <JsonBlock value={row.apiExchange?.response || { status: row.status, shipmentId: row.shipmentId, awb: row.awb }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AnimatedCounter({ value }) {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    const end = Number.parseInt(value, 10) || 0;
    if (displayValue === end) return undefined;
    const step = end > displayValue ? 1 : -1;
    const timer = setInterval(() => {
      setDisplayValue((current) => {
        if (current === end) {
          clearInterval(timer);
          return current;
        }
        return current + step;
      });
    }, 20);
    return () => clearInterval(timer);
  }, [displayValue, value]);
  return <span>{displayValue}</span>;
}

export default function SandboxRunsPage({ toast }) {
  const [runs, setRuns] = useState([]);
  const [selectedRunId, setSelectedRunId] = useState("");
  const [details, setDetails] = useState(null);
  const [logsData, setLogsData] = useState({ logs: [], errors: [] });
  const [logsLoaded, setLogsLoaded] = useState(false);
  const [loadingRuns, setLoadingRuns] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [rowFilter, setRowFilter] = useState("all");
  const [logMode, setLogMode] = useState("timeline");
  const [logFilters, setLogFilters] = useState({ level: "all", step: "all", search: "" });
  const [expandedOrderId, setExpandedOrderId] = useState("");
  const [simCount, setSimCount] = useState(1);
  const [simPlatform, setSimPlatform] = useState("custom");
  const [clientCode, setClientCode] = useState("");
  const [simError, setSimError] = useState("");
  const [running, setRunning] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const pollInterval = useRef(null);

  const loadDetails = async (runId, silent = false) => {
    if (!runId) return;
    if (!silent) setLoadingDetails(true);
    try {
      const qs = clientCode.trim() ? `?clientCode=${encodeURIComponent(clientCode.trim().toUpperCase())}` : "";
      const detailRes = await api.get(`/sandbox/runs/${encodeURIComponent(runId)}${qs}`);
      const payload = getApiData(detailRes, detailRes);
      setDetails(payload || null);
      setLogsLoaded(false);
      setLogsData({ logs: [], errors: payload?.errors || [] });
      setExpandedOrderId(payload?.orders?.[0]?.orderId || "");
      if (payload?.status === "partial") startPolling(runId);
      else stopPolling();
    } catch (err) {
      if (!silent) toast?.(err.message || "Failed to load sandbox run", "error");
    } finally {
      if (!silent) setLoadingDetails(false);
    }
  };

  const loadRuns = async (nextSelected = selectedRunId, silent = false) => {
    if (!silent) setLoadingRuns(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "50");
      if (statusFilter) params.set("status", statusFilter);
      if (platformFilter !== "all") params.set("platformType", platformFilter);
      if (clientCode.trim()) params.set("clientCode", clientCode.trim().toUpperCase());
      const res = await api.get(`/sandbox/runs?${params.toString()}`);
      const payload = getApiData(res, res);
      const list = payload?.runs || [];
      setRuns(list);
      const chosen = nextSelected || list[0]?.runId || "";
      setSelectedRunId(chosen);
      if (chosen) await loadDetails(chosen, silent);
      else setDetails(null);
    } catch (err) {
      if (!silent) toast?.(err.message || "Failed to load sandbox runs", "error");
    } finally {
      if (!silent) setLoadingRuns(false);
    }
  };

  const loadLogs = async () => {
    if (!selectedRunId) return;
    setLogsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("limit", "200");
      if (clientCode.trim()) params.set("clientCode", clientCode.trim().toUpperCase());
      if (logFilters.level !== "all") params.set("level", logFilters.level);
      if (logFilters.step !== "all") params.set("step", logFilters.step);
      if (logFilters.search.trim()) params.set("search", logFilters.search.trim());
      const res = await api.get(`/sandbox/runs/${encodeURIComponent(selectedRunId)}/logs?${params.toString()}`);
      setLogsData(getApiData(res, res) || { logs: [], errors: [] });
      setLogsLoaded(true);
    } catch (err) {
      toast?.(err.message || "Failed to load sandbox logs", "error");
    } finally {
      setLogsLoading(false);
    }
  };

  const startPolling = (runId) => {
    stopPolling();
    pollInterval.current = setInterval(() => loadRuns(runId, true), 2500);
  };

  const stopPolling = () => {
    if (pollInterval.current) clearInterval(pollInterval.current);
    pollInterval.current = null;
  };

  useEffect(() => {
    loadRuns();
    return stopPolling;
  }, [statusFilter, platformFilter]);

  const runSimulation = async () => {
    if (!clientCode.trim()) {
      toast?.("Client code is required for sandbox simulations", "error");
      return;
    }
    setRunning(true);
    try {
      const payload = { clientCode: clientCode.trim().toUpperCase(), platformType: simPlatform };
      const res = simError
        ? await api.post("/sandbox/simulate-error", { ...payload, scenario: simError })
        : await api.post("/sandbox/bulk-orders", { ...payload, count: Number(simCount), createShipments: true });
      const data = getApiData(res, res);
      const runId = data?.runId || data?.result?.sandboxRunId || data?.result?.runId;
      toast?.("Sandbox run created", "success");
      setStatusFilter("");
      setPlatformFilter("all");
      await loadRuns(runId);
    } catch (err) {
      toast?.(err.message || "Simulation failed", "error");
    } finally {
      setRunning(false);
    }
  };

  const cleanupRuns = async () => {
    setConfirmDialog({
      message: "Clean up sandbox runs older than 7 days?",
      confirmLabel: "Clean up",
      onConfirm: async () => {
        setConfirmDialog(null);
        setCleaning(true);
        try {
          const res = await api.post("/sandbox/cleanup", { olderThanDays: 7, clientCode: clientCode.trim().toUpperCase() || undefined });
          const data = getApiData(res, res);
          toast?.(`Cleaned up ${data?.totalDeleted || 0} runs`, "success");
          loadRuns();
        } catch (err) {
          toast?.(err.message || "Cleanup failed", "error");
        } finally {
          setCleaning(false);
        }
      },
    });
  };

  const deleteRun = async (runId) => {
    setConfirmDialog({
      message: `Delete sandbox run ${runId}?`,
      confirmLabel: "Delete",
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await api.delete(`/sandbox/runs/${encodeURIComponent(runId)}?clientCode=${encodeURIComponent(clientCode.trim().toUpperCase())}`);
          toast?.("Run deleted successfully", "success");
          loadRuns();
        } catch (err) {
          toast?.(err.message || "Failed to delete run", "error");
        }
      },
    });
  };

  const exportRunData = async (runId) => {
    try {
      const res = await api.get(`/sandbox/runs/${encodeURIComponent(runId)}/export?clientCode=${encodeURIComponent(clientCode.trim().toUpperCase())}`);
      const data = getApiData(res, res);
      const url = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
      const node = document.createElement("a");
      node.setAttribute("href", url);
      node.setAttribute("download", `sandbox_run_${runId}.json`);
      document.body.appendChild(node);
      node.click();
      node.remove();
    } catch (err) {
      toast?.(err.message || "Failed to export run", "error");
    }
  };

  const copyRunPayload = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify({ run: details, logs: logsData }, null, 2));
      toast?.("Sandbox payload copied", "success");
    } catch {
      toast?.("Unable to copy payload", "error");
    }
  };

  const retryFailedOrders = async () => {
    if (!details?.failedOrders) {
      toast?.("No failed orders to retry", "success");
      return;
    }
    const code = details.clientCode || clientCode.trim().toUpperCase();
    if (!code) {
      toast?.("Client code is required to retry failed sandbox orders", "error");
      return;
    }
    setRunning(true);
    try {
      const count = supportedRetryCount(details.failedOrders);
      const res = await api.post("/sandbox/bulk-orders", { clientCode: code, count, platformType: details.platformType || "custom", createShipments: true });
      const data = getApiData(res, res);
      toast?.(`Retry run created for ${count} sandbox order${count === 1 ? "" : "s"}`, "success");
      await loadRuns(data?.runId);
    } catch (err) {
      toast?.(err.message || "Retry failed", "error");
    } finally {
      setRunning(false);
    }
  };

  const visibleOrders = useMemo(() => {
    const rows = details?.orders || [];
    if (rowFilter === "success") return rows.filter((row) => !row.error && row.status !== "FAILED");
    if (rowFilter === "failed") return rows.filter((row) => row.error || row.status === "FAILED");
    return rows;
  }, [details, rowFilter]);

  const selectedRun = runs.find((run) => run.runId === selectedRunId);
  const successCount = Math.max(0, Number(details?.totalOrders || 0) - Number(details?.failedOrders || 0));
  const errors = logsData?.errors?.length ? logsData.errors : details?.errors || [];

  return (
    <div className="min-h-full">
      <ConfirmDialog
        open={Boolean(confirmDialog)}
        message={confirmDialog?.message}
        confirmLabel={confirmDialog?.confirmLabel || "Confirm"}
        onConfirm={confirmDialog?.onConfirm}
        onCancel={() => setConfirmDialog(null)}
      />
      <main className="client-premium-main max-w-7xl">
        <section className="card-premium mb-6 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                  <TerminalSquare size={20} />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl font-black text-slate-900 dark:text-white">Sandbox Run Inspector</h1>
                    <span className="rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300">
                      SANDBOX MODE
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">Request traces, structured logs, payload snapshots, and failure intelligence for simulations.</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <label className="label">Client Code</label>
                  <input className="input h-10 px-3 py-2" value={clientCode} onChange={(e) => setClientCode(e.target.value.toUpperCase())} placeholder="E.g. CLI123" />
                </div>
                <div>
                  <label className="label">Orders</label>
                  <select className="input h-10 px-3 py-2" value={simCount} onChange={(e) => setSimCount(Number(e.target.value))} disabled={!!simError}>
                    {[1, 10, 100].map((count) => <option key={count} value={count}>{count} orders</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Platform</label>
                  <select className="input h-10 px-3 py-2" value={simPlatform} onChange={(e) => setSimPlatform(e.target.value)}>
                    {PLATFORMS.filter((p) => p !== "all").map((platform) => <option key={platform} value={platform}>{platform}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Error Scenario</label>
                  <select className="input h-10 px-3 py-2" value={simError} onChange={(e) => { setSimError(e.target.value); if (e.target.value) setSimCount(1); }}>
                    {ERROR_SCENARIOS.map((sc) => <option key={sc.value} value={sc.value}>{sc.label}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <button type="button" className="btn-primary h-10 w-full" onClick={runSimulation} disabled={running}>
                    {running ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
                    {running ? "Running..." : simError ? "Simulate Error" : "Run Bulk"}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex shrink-0 gap-2 pt-4 lg:pt-0">
              <button type="button" className="btn-secondary h-10" onClick={() => loadRuns()} disabled={loadingRuns}><RefreshCw size={16} className={loadingRuns ? "animate-spin" : ""} /></button>
              <button type="button" className="btn-secondary h-10 text-rose-600" onClick={cleanupRuns} disabled={cleaning}><Trash2 size={16} /> Cleanup</button>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="card flex h-[760px] flex-col overflow-hidden p-0">
            <div className="shrink-0 border-b border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/30">
              <div className="mb-3 flex items-center gap-2"><Filter size={14} className="text-slate-400" /><span className="text-xs font-bold uppercase tracking-wider text-slate-500">Filters</span></div>
              <div className="grid grid-cols-2 gap-2">
                <select className="input h-9 px-2 py-1 text-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>{STATUS_FILTERS.map((item) => <option key={item.label} value={item.value}>{item.label}</option>)}</select>
                <select className="input h-9 px-2 py-1 text-xs" value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)}>{PLATFORMS.map((platform) => <option key={platform} value={platform}>{platform}</option>)}</select>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {loadingRuns && runs.length === 0 ? (
                <div className="flex h-32 items-center justify-center text-sm text-slate-500"><RefreshCw size={20} className="animate-spin text-slate-300" /></div>
              ) : runs.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center text-center text-sm text-slate-500"><TerminalSquare size={24} className="mb-2 text-slate-300" /><p>No sandbox runs found.</p></div>
              ) : runs.map((run) => (
                <button key={run.runId} type="button" onClick={() => { setSelectedRunId(run.runId); loadDetails(run.runId); }} className={`mb-2 w-full rounded-lg border p-3 text-left transition-all ${selectedRunId === run.runId ? "border-orange-300 bg-orange-50 shadow-sm dark:border-orange-500/50 dark:bg-orange-500/10" : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 dark:hover:bg-slate-800"}`}>
                  <div className="flex items-center justify-between gap-2"><span className="truncate font-mono text-xs font-bold text-slate-800 dark:text-slate-100">{run.runId}</span><span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${statusClass(run.status)}`}>{run.status}</span></div>
                  <div className="mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">{fmtTime(run.createdAt)}</div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300"><span className="uppercase tracking-wider opacity-80">{run.platformType || "custom"}</span><span>{(run.totalOrders || 0) - (run.failedOrders || 0)} ok {run.failedOrders > 0 ? ` / ${run.failedOrders} err` : ""}</span></div>
                </button>
              ))}
            </div>
          </aside>

          <section className="card flex min-h-[760px] flex-col overflow-hidden p-0">
            {!selectedRun ? (
              <div className="flex flex-1 flex-col items-center justify-center text-slate-400"><Play size={48} className="mb-4 opacity-20" /><p>Select a run to inspect details.</p></div>
            ) : loadingDetails && !details ? (
              <div className="flex flex-1 items-center justify-center"><RefreshCw size={24} className="animate-spin text-orange-500" /></div>
            ) : (
              <div className="flex h-full flex-col overflow-hidden">
                <div className="sticky top-0 z-10 shrink-0 border-b border-slate-200 bg-white/95 p-5 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="font-mono text-lg font-black text-slate-900 dark:text-white">{details?.runId}</h2>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-black uppercase tracking-wider ${statusClass(details?.status)}`}>{details?.status}</span>
                        {details?.status === "partial" && <span className="flex items-center gap-1 rounded border border-orange-200 bg-orange-50 px-2 py-1 text-xs font-semibold text-orange-600 dark:border-orange-500/30 dark:bg-orange-500/10"><RefreshCw size={12} className="animate-spin" /> In Progress</span>}
                      </div>
                      <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{details?.clientCode || "NO CLIENT"}</span>
                        <span>request traces: {details?.orders?.length || 0}</span>
                        <span>{fmtTime(details?.createdAt)}</span>
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <button onClick={retryFailedOrders} className="btn-secondary btn-sm h-9" disabled={!details?.failedOrders || running}>{running ? <RefreshCw size={14} className="animate-spin" /> : <RotateCcw size={14} />} Retry Failed</button>
                      <button onClick={copyRunPayload} className="btn-secondary btn-sm h-9"><Copy size={14} /> Copy Payload</button>
                      <button onClick={() => exportRunData(details?.runId)} className="btn-secondary btn-sm h-9"><Download size={14} /> Export JSON</button>
                      <button onClick={() => deleteRun(details?.runId)} className="btn-secondary btn-sm h-9 text-rose-600"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3 text-center md:grid-cols-4">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50"><div className="text-2xl font-black text-slate-900 dark:text-white"><AnimatedCounter value={details?.totalOrders || 0} /></div><div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Orders</div></div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/50"><div className="text-2xl font-black text-blue-600 dark:text-blue-400"><AnimatedCounter value={details?.totalShipments || 0} /></div><div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Shipments</div></div>
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/50 dark:bg-emerald-500/10"><div className="text-2xl font-black text-emerald-600 dark:text-emerald-400"><AnimatedCounter value={successCount} /></div><div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-500">Success</div></div>
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 dark:border-rose-900/50 dark:bg-rose-500/10"><div className="text-2xl font-black text-rose-600 dark:text-rose-400"><AnimatedCounter value={details?.failedOrders || 0} /></div><div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-500">Failed</div></div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-white p-5 dark:bg-transparent">
                  <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
                    <PerformanceTimeline orders={details?.orders || []} details={details} />
                    <ErrorPanel errors={errors} />
                  </div>

                  <div className="mb-6">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <h3 className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white"><Layers size={16} className="text-orange-500" /> Flow Trace</h3>
                      <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800/50">
                        {["all", "success", "failed"].map((item) => <button key={item} type="button" className={`rounded-md px-3 py-1.5 text-xs font-bold capitalize transition-colors ${rowFilter === item ? "bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-white" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"}`} onClick={() => setRowFilter(item)}>{item}</button>)}
                      </div>
                    </div>
                    <div className="space-y-3">
                      {visibleOrders.length === 0 ? <div className="rounded-lg border border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-800">No orders match this filter.</div> : visibleOrders.map((row) => (
                        <OrderTraceCard key={`${row.orderId}-${row.shipmentId || "none"}`} row={row} expanded={expandedOrderId === row.orderId} onToggle={() => setExpandedOrderId((current) => current === row.orderId ? "" : row.orderId)} />
                      ))}
                    </div>
                  </div>

                  <LogsPanel logs={logsData?.logs || []} logsLoaded={logsLoaded} logsLoading={logsLoading} logMode={logMode} setLogMode={setLogMode} logFilters={logFilters} setLogFilters={setLogFilters} onLoad={loadLogs} />
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
