// DailySheetPage.jsx — High-Density UI Polish
import { useState, useEffect } from "react";
import {
  Printer,
  MessageCircle,
  ChevronDown,
  Truck,
  AlertCircle,
  Download,
} from "lucide-react";
import api from "../services/api";
import { StatusBadge } from "../components/ui/StatusBadge";
import { PageLoader, EmptyState } from "../components/ui/Loading";
import { useFetch } from "../hooks/useFetch";
import { sendWhatsAppReport } from "../utils/whatsapp";
import { PageHeader } from "../components/ui/PageHeader";

const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function DailySheetPage({ toast }) {
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [shipments, setShip] = useState([]);
  const [manifest, setManifest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("sheet");
  const [clientFilter, setClientF] = useState("");
  const [showWA, setShowWA] = useState(false);
  const { data: clients } = useFetch("/clients");

  const load = async (d) => {
    setLoading(true);
    try {
      const [shipRes, manifestRes] = await Promise.all([
        api.get(`/shipments?date_from=${d}&date_to=${d}&limit=500`),
        api.get(`/ops/courier-manifest?date=${d}`),
      ]);
      setShip(shipRes.data || shipRes || []);
      setManifest(manifestRes);
    } catch (err) {
      toast?.(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(date);
  }, [date]);

  const filtered = clientFilter
    ? shipments.filter((s) => s.clientCode === clientFilter)
    : shipments;
  const totalAmt = filtered.reduce((a, s) => a + (s.amount || 0), 0);
  const totalWt = filtered.reduce((a, s) => a + (s.weight || 0), 0);
  const byCourier = filtered.reduce((acc, s) => {
    if (s.courier) acc[s.courier] = (acc[s.courier] || 0) + 1;
    return acc;
  }, {});
  const clientCodes = [...new Set(shipments.map((s) => s.clientCode))].filter(
    Boolean,
  );

  const printSheet = () => {
    const printContent = `
      <!DOCTYPE html><html><head>
      <title>Sea Hawk Daily Sheet — ${date}</title>
      <style>
        body { font-family: 'Inter', sans-serif; font-size: 11px; margin: 20px; }
        h1 { font-size: 16px; margin-bottom: 4px; }
        .meta { color: #666; font-size: 10px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #0b1f3a; color: white; padding: 10px 12px; text-align: left; font-size: 9px; text-transform: uppercase; }
        td { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 10px; }
        tr:nth-child(even) td { background: #f9f9f9; }
        .summary { margin-top: 16px; display: flex; gap: 24px; }
        .sum-item { background: #f3f4f6; padding: 10px 15px; border-radius: 8px; }
        .sum-label { font-size: 9px; color: #666; text-transform: uppercase; }
        .sum-val { font-size: 16px; font-weight: bold; }
        .footer { margin-top: 20px; font-size: 9px; color: #aaa; text-align: center; }
      </style></head><body>
      <h1><img src="/images/logo.png" alt="Logo" style="height: 20px; vertical-align: middle; margin-right: 8px;" /> Sea Hawk Courier — Dispatch Sheet</h1>
      <div class="meta">Date: ${date} | Total: ${filtered.length} | Generated: ${new Date().toLocaleString("en-IN")}</div>
      <table>
        <thead><tr><th>#</th><th>AWB No.</th><th>Client</th><th>Consignee</th><th>Destination</th><th>Courier</th><th>Wt (kg)</th><th>Amount</th><th>Status</th></tr></thead>
        <tbody>
          ${filtered.map((s, i) => `<tr><td>${i + 1}</td><td><b>${s.awb}</b></td><td>${s.clientCode}</td><td>${s.consignee || ""}</td><td>${s.destination || ""}</td><td>${s.courier || "—"}</td><td>${s.weight}</td><td>₹${Number(s.amount || 0).toLocaleString("en-IN")}</td><td>${s.status}</td></tr>`).join("")}
        </tbody>
      </table>
      <div class="summary">
        <div class="sum-item"><div class="sum-label">Shipments</div><div class="sum-val">${filtered.length}</div></div>
        <div class="sum-item"><div class="sum-label">Weight</div><div class="sum-val">${totalWt.toFixed(2)} kg</div></div>
        <div class="sum-item"><div class="sum-label">Total G.R</div><div class="sum-val">₹${Number(totalAmt).toLocaleString("en-IN")}</div></div>
      </div>
      <div class="footer">Sea Hawk Courier & Cargo | GSTIN: 06AJDPR0914N2Z1 | +91 99115 65523</div>
      </body></html>`;
    const win = window.open("", "_blank");
    win.document.write(printContent);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 300);
  };

  const printManifest = () => {
    if (!manifest) return;
    const printContent = `
      <!DOCTYPE html><html><head>
      <title>Manifest — ${date}</title>
      <style>
        body { font-family: 'Inter', sans-serif; font-size: 11px; margin: 20px; }
        h1 { font-size: 16px; margin-bottom: 4px; }
        h2 { font-size: 13px; margin: 20px 0 8px; color: #0b1f3a; border-left: 4px solid #e8580a; padding-left: 10px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        th { background: #1a3a6b; color: white; padding: 8px 12px; font-size: 9px; text-transform: uppercase; text-align: left; }
        td { padding: 6px 12px; border-bottom: 1px solid #eee; font-size: 10px; }
        .courier-summary { padding: 8px 12px; font-size: 10px; margin-bottom: 8px; background: #f8fafc; border-radius: 6px; }
        .footer { margin-top: 30px; font-size: 9px; color: #ccc; text-align: center; }
      </style></head><body>
      <h1>Sea Hawk Courier & Cargo — Courier Handover Manifest</h1>
      <div class="meta">Date: ${date} | Total Weight: ${manifest.totalWeight?.toFixed(2)} kg | ₹${Number(manifest.totalAmount || 0).toLocaleString("en-IN")}</div>
      ${(manifest.couriers || [])
        .map(
          (c) => `
        <h2>${c.courier} (${c.totalPieces} pcs)</h2>
        <div class="courier-summary">Weight: ${c.totalWeight?.toFixed(3)} kg | GR: ₹${Number(c.totalAmount || 0).toLocaleString("en-IN")}</div>
        <table>
          <thead><tr><th>#</th><th>AWB No.</th><th>Client</th><th>Consignee</th><th>Destination</th><th>Weight</th><th>Amount</th></tr></thead>
          <tbody>
            ${c.shipments.map((s, i) => `<tr><td>${i + 1}</td><td><b>${s.awb}</b></td><td>${s.clientCode}</td><td>${s.consignee || ""}</td><td>${s.destination || ""}</td><td>${s.weight}</td><td>₹${Number(s.amount || 0).toLocaleString("en-IN")}</td></tr>`).join("")}
          </tbody>
        </table>`,
        )
        .join("")}
      <div class="footer">Sea Hawk Courier & Cargo | Generated: ${new Date().toLocaleString()}</div>
      </body></html>`;
    const win = window.open("", "_blank");
    win.document.write(printContent);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 300);
  };

  const downloadManifestPDF = async (courierName) => {
    try {
      toast?.(`Generating manifest for ${courierName}...`, "info");
      // Import axios here or use api instance. Assuming api is setup.
      // Wait, api returns response.data directly.
      const res = await api.get("/ops/manifest/download", {
        params: { date, courier: courierName || "" },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `Manifest_${date}_${courierName.replace(/\s+/g, "")}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast?.("Manifest PDF downloaded", "success");
    } catch (err) {
      toast?.("Failed to download manifest", "error");
    }
  };

  const handleSendWA = (clientCode) => {
    const rows = clientCode
      ? shipments.filter((s) => s.clientCode === clientCode)
      : filtered;
    const client = clientCode
      ? clients?.find((c) => c.code === clientCode)
      : null;
    const phone = client?.whatsapp || client?.phone || "";
    if (clientCode && !phone) {
      toast?.("No WhatsApp number found for client.", "error");
      return;
    }
    sendWhatsAppReport({
      rows,
      client,
      phoneRaw: phone,
      dateLabel: date,
      reportType: "Daily Dispatch Report",
    });
    setShowWA(false);
    toast?.("WhatsApp relay triggered ✓", "success");
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="print:hidden">
        <PageHeader
          title="Daily Dispatch Station"
          subtitle="Same-day courier manifest and performance relay intelligence."
          icon={Truck}
          actions={
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="date"
                className="input bg-white border-slate-200 rounded-2xl px-5 py-3 text-xs font-black shadow-sm"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />

              <select
                className="input bg-white border-slate-200 rounded-2xl px-5 py-3 text-xs font-black shadow-sm"
                value={clientFilter}
                onChange={(e) => setClientF(e.target.value)}
              >
                <option value="">ALL CLIENT ENTITIES</option>
                {clientCodes.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>

              <div className="flex bg-slate-100 p-1 rounded-[1.25rem] shadow-inner">
                <button
                  onClick={() => setView("sheet")}
                  className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${view === "sheet" ? "bg-white text-blue-600 shadow-md transform scale-[1.02]" : "text-slate-400 hover:text-slate-600"}`}
                >
                  Sheet
                </button>
                <button
                  onClick={() => setView("manifest")}
                  className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${view === "manifest" ? "bg-white text-blue-600 shadow-md transform scale-[1.02]" : "text-slate-400 hover:text-slate-600"}`}
                >
                  Manifest
                </button>
              </div>

              <button
                onClick={view === "manifest" ? printManifest : printSheet}
                className="flex items-center gap-3 px-6 py-3 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-3xl hover:bg-black transition-all shadow-xl active:scale-95"
              >
                <Printer size={16} /> Print Results
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowWA(!showWA)}
                  className="flex items-center gap-3 px-6 py-3 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-3xl hover:bg-emerald-500 transition-all shadow-xl active:scale-95"
                >
                  <MessageCircle size={16} /> WA Relay <ChevronDown size={14} />
                </button>
                {showWA && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowWA(false)}
                    />
                    <div className="absolute z-20 right-0 top-full mt-4 bg-white rounded-3xl shadow-2xl border border-slate-100 py-3 min-w-[240px] animate-in slide-in-from-top-4">
                      <button
                        onClick={() => handleSendWA("")}
                        className="w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-colors border-b border-slate-50"
                      >
                        Global Dispatch Summary
                      </button>
                      {clientCodes.map((code) => (
                        <button
                          key={code}
                          onClick={() => handleSendWA(code)}
                          className="w-full text-left px-6 py-3 hover:bg-slate-50 transition-colors flex items-center justify-between group"
                        >
                          <span className="text-[11px] font-black uppercase text-slate-900">
                            {code}
                          </span>
                          <div className="h-2 w-2 rounded-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          }
        />
      </div>

      {loading ? (
        <PageLoader />
      ) : (
        <>
          {filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-2">
              {[
                {
                  label: "Shipments Handover",
                  val: filtered.length,
                  sub: "Daily Volume",
                  color: "slate",
                },
                {
                  label: "Dispatch Revenue",
                  val: fmt(totalAmt),
                  sub: "Gross Daily",
                  color: "emerald",
                },
                {
                  label: "Payload Weight",
                  val: `${totalWt.toFixed(2)}kg`,
                  sub: "Collective Mass",
                  color: "indigo",
                },
                {
                  label: "Courier Entities",
                  val: Object.keys(byCourier).length,
                  sub: "Network Mix",
                  color: "amber",
                },
              ].map((c, i) => (
                <div
                  key={i}
                  className="bg-white border-2 border-slate-50 rounded-[2.5rem] p-7 shadow-sm hover:shadow-xl hover:border-slate-100 transition-all group"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 truncate">
                    {c.label}
                  </p>
                  <div className="text-3xl font-black text-slate-900 tracking-tight">
                    {c.val}
                  </div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {c.sub}
                  </p>
                </div>
              ))}
            </div>
          )}

          {view === "sheet" ? (
            filtered.length === 0 ? (
              <EmptyState icon="📭" title="No dispatch logs for this date" />
            ) : (
              <div className="bg-white rounded-[3rem] border-4 border-slate-50 shadow-2xl overflow-hidden">
                <table className="min-w-full text-left align-middle">
                  <thead>
                    <tr className="bg-slate-50/50 border-b-2 border-slate-100">
                      <th className="px-8 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">
                        #
                      </th>
                      <th className="px-8 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">
                        AWB / Docket
                      </th>
                      <th className="px-8 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">
                        Entity
                      </th>
                      <th className="px-8 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">
                        Destination
                      </th>
                      <th className="px-8 py-8 text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">
                        Courier
                      </th>
                      <th className="px-8 py-8 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">
                        Weight
                      </th>
                      <th className="px-8 py-8 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">
                        Amount
                      </th>
                      <th className="px-8 py-8 text-center text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.map((s, i) => (
                      <tr
                        key={s.id}
                        className="hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="px-8 py-6 text-[10px] font-black text-slate-300">
                          {i + 1}
                        </td>
                        <td className="px-8 py-6">
                          <div className="font-mono text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                            {s.awb}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 truncate max-w-[150px] mt-0.5">
                            {s.consignee}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black rounded-lg uppercase tracking-tight">
                            {s.clientCode}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-[11px] font-black text-slate-700 uppercase">
                          {s.destination}
                        </td>
                        <td className="px-8 py-6 text-[11px] font-black text-slate-500 uppercase tracking-tighter">
                          {s.courier || "—"}
                        </td>
                        <td className="px-8 py-6 text-right font-black text-slate-900 text-xs">
                          {s.weight} kg
                        </td>
                        <td className="px-8 py-6 text-right">
                          {s.amount > 0 ? (
                            <span className="font-black text-slate-900 text-sm">
                              {fmt(s.amount)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase border border-slate-200">
                              <AlertCircle
                                size={12}
                                className="text-amber-500"
                              />{" "}
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-8 py-6 text-center">
                          <StatusBadge status={s.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="space-y-8 px-2">
              {manifest?.couriers?.length === 0 ? (
                <EmptyState icon="🚚" title="No manifest records" />
              ) : (
                manifest?.couriers?.map((c) => (
                  <div
                    key={c.courier}
                    className="bg-white rounded-[3rem] border-4 border-slate-50 shadow-2xl overflow-hidden group"
                  >
                    <div
                      className="px-8 py-6 flex items-center justify-between"
                      style={{ background: "#0b1f3a" }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-orange-500/20 rounded-xl">
                          <Truck className="w-5 h-5 text-orange-400" />
                        </div>
                        <div>
                          <div className="text-xl font-black text-white tracking-widest uppercase">
                            {c.courier}
                          </div>
                          <div className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">
                            {c.totalPieces} Shipments Handed Over
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <div>
                          <div className="text-2xl font-black text-orange-400">
                            {fmt(c.totalAmount)}
                          </div>
                          <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                            {c.totalWeight?.toFixed(3)} kg collective mass
                          </div>
                        </div>
                        <button
                          onClick={() => downloadManifestPDF(c.courier)}
                          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
                        >
                          <Download size={14} /> Get PDF
                        </button>
                      </div>
                    </div>
                    <table className="min-w-full text-left align-middle border-t border-slate-800">
                      <thead>
                        <tr className="bg-slate-900 border-b border-slate-800">
                          <th className="px-8 py-5 text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">
                            #
                          </th>
                          <th className="px-8 py-5 text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">
                            AWB
                          </th>
                          <th className="px-8 py-5 text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">
                            Consignee
                          </th>
                          <th className="px-8 py-5 text-right text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">
                            Weight
                          </th>
                          <th className="px-8 py-5 text-right text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">
                            Cost
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-slate-900 divide-y divide-slate-800">
                        {c.shipments.map((s, i) => (
                          <tr
                            key={s.id}
                            className="hover:bg-black/50 transition-colors"
                          >
                            <td className="px-8 py-4 text-[10px] font-black text-slate-700">
                              {i + 1}
                            </td>
                            <td className="px-8 py-4 font-mono text-xs font-black text-white">
                              {s.awb}
                            </td>
                            <td className="px-8 py-4 text-[11px] font-black text-slate-500 uppercase">
                              {s.consignee}
                            </td>
                            <td className="px-8 py-4 text-right text-xs font-bold text-slate-400">
                              {s.weight} kg
                            </td>
                            <td className="px-8 py-4 text-right text-xs font-black text-orange-400">
                              {fmt(s.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
