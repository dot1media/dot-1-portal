// Dot One Media portal - business analytics + settings (revenue/bookings charts, CSV import) + private ImportSessions.
import React, { useState, useEffect } from "react";
import { Download, FileText, Mail, RefreshCw, Settings, Upload } from "lucide-react";
import { RED, INK, BODY, STONE, FAINT, LINE, PAPER, CREAM, OK, WARN, display, mono, card, cardDense, inputStyle, btnGhost, btnSolid } from "./theme";
import { GROUPS, GROUP_KEYS } from "./groups";
import { money, compactMoney, monthShort, payKindLabel, payCardLabel, payMoney, payDateShort } from "./format";
import { parseCsvRows, parseAcuityStart, importServiceLine } from "./csv";
import { NOTIFY_EMAILS } from "./constants";
import { STAGES, curStage } from "./stages";
import { DonutChart, HBars, MiniColumns, FieldLabel, EmptyHint, EmptyState, Skeleton } from "./ui";
import { useIsMobile } from "./hooks";
import { InvoiceArchive } from "./Invoices";

function ImportSessions({ existing, onImport, showToast }) {
  const [drafts, setDrafts] = useState(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const exByAcuity = new Map();
  for (const s of (existing || [])) { if (s.acuityId) exByAcuity.set(String(s.acuityId), s); }
  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const rows = parseCsvRows(String(reader.result || ""));
        if (rows.length < 2) { showToast("That file has no rows."); return; }
        const head = rows[0].map((x) => String(x).trim().toLowerCase());
        const idx = (n) => head.indexOf(n.toLowerCase());
        const iF = idx("First Name"), iL = idx("Last Name"), iE = idx("Email"), iT = idx("Type"), iS = idx("Start Time"), iP = idx("Appointment Price"), iPd = idx("Paid?"), iId = idx("Appointment ID");
        const out = [];
        for (let r = 1; r < rows.length; r++) {
          const row = rows[r]; if (!row || row.every((c) => !String(c).trim())) continue;
          const name = ((iF >= 0 ? row[iF] : "") + " " + (iL >= 0 ? row[iL] : "")).trim();
          const email = String(iE >= 0 ? row[iE] : "").trim().toLowerCase();
          if (!name && !email) continue;
          const type = String(iT >= 0 ? row[iT] : "").trim() || "Session";
          const parsed = parseAcuityStart(iS >= 0 ? row[iS] : "");
          const price = parseFloat(String(iP >= 0 ? row[iP] : "").replace(/[^0-9.]/g, "")) || 0;
          const paid = /^y/i.test(String(iPd >= 0 ? row[iPd] : "").trim());
          const acuityId = String(iId >= 0 ? row[iId] : "").trim();
          const ex = acuityId ? exByAcuity.get(acuityId) : null;
          let mode = "new";
          if (ex) mode = (!ex.date && parsed.date) ? "repair" : "skip";
          out.push({ name, email, type, date: parsed.date, time: parsed.time, price, paid, acuityId, mode, existing: ex || null });
        }
        if (out.length === 0) { showToast("No importable rows found in that file."); return; }
        setDrafts(out);
      } catch (e) { showToast("Could not read that CSV file."); }
    };
    reader.onerror = () => showToast("Could not read that file.");
    reader.readAsText(file);
  };
  const runImport = async () => {
    const todo = (drafts || []).filter((d) => d.mode !== "skip");
    if (todo.length === 0) { showToast("Nothing new to import."); return; }
    setImporting(true); setProgress(0);
    const today = new Date().toISOString().slice(0, 10);
    const stageFor = (date) => (date && date < today) ? Math.max(0, STAGES.length - 1) : 0;
    const sessions = todo.map((d) => {
      if (d.mode === "repair" && d.existing) return { ...d.existing, date: d.date, time: d.time, currentStage: stageFor(d.date) };
      return {
        clientName: d.name, clientEmail: d.email, clientImage: "",
        notifyEmail: NOTIFY_EMAILS.photo || "contact@dot1.media",
        type: d.type, serviceLine: importServiceLine(d.type), photographer: importServiceLine(d.type) === "photo" ? "Brittany Matthews" : "Dennis Matthews",
        date: d.date, time: d.time, location: "", status: "active",
        durationMin: 60, apptMin: 60, padBefore: 0, padAfter: 0,
        currentStage: stageFor(d.date), stageTimes: {}, comments: [], selectedAddons: [],
        total: d.price, payChoice: "full", paymentStatus: d.paid ? "paid" : "none", payAmount: d.paid ? d.price : 0,
        reviewLink: "", deliveryVideo: "", deliveryPhoto: "", deliveryMusic: "", deliveryGov: "", imported: true, acuityId: d.acuityId,
      };
    });
    await onImport(sessions, (n) => setProgress(n));
    setImporting(false); setDrafts(null);
    showToast("Done. " + sessions.length + " session" + (sessions.length === 1 ? "" : "s") + " updated in your history.");
  };
  const newCount = (drafts || []).filter((d) => d.mode === "new").length;
  const repairCount = (drafts || []).filter((d) => d.mode === "repair").length;
  const skipCount = (drafts || []).filter((d) => d.mode === "skip").length;
  const todoCount = newCount + repairCount;
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 12 }}>Import past sessions</div>
      {!drafts ? (
        <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: "26px", borderRadius: 12, border: "1.5px dashed " + LINE, background: CREAM, cursor: "pointer", textAlign: "center" }}>
          <Upload size={20} color={STONE} />
          <div style={{ fontSize: 13.5, color: BODY, fontWeight: 500 }}>Upload your Acuity CSV export</div>
          <div style={{ ...mono, fontSize: 9.5, color: FAINT, letterSpacing: "0.04em", maxWidth: 320, lineHeight: 1.5 }}>Past appointments are added as completed sessions in your history. No emails are sent to anyone.</div>
          <input type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={(e) => { const f = e.target.files && e.target.files[0]; handleFile(f); if (e.target) e.target.value = ""; }} />
        </label>
      ) : (
        <div style={{ ...card, padding: "16px 18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 10 }}>
            <div style={{ fontSize: 13, color: BODY }}><strong style={{ color: INK }}>{newCount}</strong> to import{repairCount > 0 ? <span style={{ color: WARN }}> {"\u00b7"} {repairCount} to fix</span> : null}{skipCount > 0 ? <span style={{ color: STONE }}> {"\u00b7"} {skipCount} already imported</span> : null}</div>
            {!importing && <button onClick={() => setDrafts(null)} style={{ ...mono, fontSize: 9, letterSpacing: "0.06em", textTransform: "uppercase", color: STONE, background: "transparent", border: "1px solid " + LINE, borderRadius: 6, padding: "6px 10px", cursor: "pointer" }}>Choose another file</button>}
          </div>
          <div style={{ maxHeight: 260, overflowY: "auto", border: "1px solid " + LINE, borderRadius: 8 }}>
            {drafts.map((d, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderBottom: i < drafts.length - 1 ? "1px solid " + LINE : "none", opacity: d.mode === "skip" ? 0.5 : 1 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: INK, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.name || "(no name)"}</div>
                  <div style={{ ...mono, fontSize: 9.5, color: STONE, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{d.type} {"\u00b7"} {d.date || "no date"}</div>
                </div>
                <div style={{ ...mono, fontSize: 11, color: d.paid ? OK : STONE, flexShrink: 0 }}>{d.price ? money(d.price) : ""}{d.paid ? " " + "\u00b7" + " paid" : ""}</div>
                {d.mode === "skip" ? <span style={{ ...mono, fontSize: 8.5, letterSpacing: "0.06em", textTransform: "uppercase", color: FAINT, flexShrink: 0 }}>imported</span> : (d.mode === "repair" ? <span style={{ ...mono, fontSize: 8.5, letterSpacing: "0.06em", textTransform: "uppercase", color: WARN, flexShrink: 0 }}>fix date</span> : null)}
              </div>
            ))}
          </div>
          <button onClick={runImport} disabled={importing || todoCount === 0} style={{ ...btnSolid, background: (importing || todoCount === 0) ? FAINT : RED, width: "100%", justifyContent: "center", marginTop: 14, padding: "11px" }}>{importing ? ("Working " + progress + " of " + todoCount + "\u2026") : (repairCount > 0 && newCount > 0 ? ("Import " + newCount + " " + "\u00b7" + " fix " + repairCount) : (repairCount > 0 ? ("Fix " + repairCount + " session" + (repairCount === 1 ? "" : "s")) : ("Import " + newCount + " session" + (newCount === 1 ? "" : "s"))))}</button>
        </div>
      )}
    </div>
  );
}

export function BusinessSettings({ sessions, showToast, onImport }) {
  const isMobile = useIsMobile();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [status, setStatus] = useState(null);
  useEffect(() => { fetch("/api/business-status").then((r) => r.json()).then((d) => setStatus(d || {})).catch(() => {}); }, []);
  const [payments, setPayments] = useState([]);
  const [payLoaded, setPayLoaded] = useState(false);
  const [emailing, setEmailing] = useState("");
  const [syncing, setSyncing] = useState(false);
  useEffect(() => { (async () => { try { const r = await fetch("/api/payments"); const d = await r.json().catch(() => ({})); if (d && Array.isArray(d.payments)) setPayments(d.payments); } catch (e) {} setPayLoaded(true); })(); }, []);
  const emailReceipt = async (p) => { setEmailing(p.id); try { const r = await fetch("/api/payments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: p.id }) }); const d = await r.json().catch(() => ({})); if (r.ok && d.ok) showToast("Receipt emailed to " + (p.client_email || "the client") + "."); else showToast(d.error || "Could not send the receipt."); } catch (e) { showToast("Network error."); } setEmailing(""); };
  const syncReceipts = async () => {
    setSyncing(true);
    const list = [];
    (sessions || []).forEach((s) => {
      if (s.paymentStatus === "paid" && s.squareOrderId) list.push(["deposit", s.id, ""]);
      if (s.balanceStatus === "paid" && s.balanceOrderId) list.push(["balance", s.id, ""]);
      (Array.isArray(s.charges) ? s.charges : []).forEach((c) => { if (c && c.status === "paid" && c.squareOrderId) list.push(["charge", s.id, c.id]); });
    });
    let recorded = 0; let lastErr = "";
    for (const item of list) {
      try {
        const r = await fetch("/api/pay/verify?sid=" + encodeURIComponent(item[1]) + "&kind=" + item[0] + (item[2] ? "&charge=" + encodeURIComponent(item[2]) : "")).then((x) => x.json()).catch(() => ({}));
        if (r && typeof r.receipt === "string") { if (r.receipt.indexOf("recorded") === 0) recorded++; else if (r.receipt.indexOf("error") === 0) lastErr = r.receipt; }
      } catch (e) {}
    }
    try { const r = await fetch("/api/payments"); const d = await r.json().catch(() => ({})); if (d && Array.isArray(d.payments)) setPayments(d.payments); } catch (e) {}
    setSyncing(false);
    if (lastErr) showToast(lastErr);
    else if (recorded > 0) showToast("Recorded " + recorded + " receipt" + (recorded === 1 ? "" : "s") + " from Square.");
    else showToast("Receipts are already up to date.");
  };

  const inRange = (s) => { if (start && (!s.date || s.date < start)) return false; if (end && (!s.date || s.date > end)) return false; return true; };
  const rows = (sessions || []).filter(inRange).sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")));
  const collected = rows.reduce((sum, s) => sum + (s.paymentStatus === "paid" ? (Number(s.payAmount) || 0) : 0), 0);
  const outstanding = rows.reduce((sum, s) => { if (s.status === "cancelled") return sum; const paid = s.paymentStatus === "paid" ? (Number(s.payAmount) || 0) : 0; return sum + Math.max(0, (Number(s.total) || 0) - paid); }, 0);
  const activeCount = rows.filter((s) => s.status !== "cancelled").length;
  const arows = rows.filter((s) => s.status !== "cancelled");
  const bookedRevenue = arows.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  const avgValue = arows.length ? bookedRevenue / arows.length : 0;
  const typeAgg = {}; arows.forEach((s) => { const k = s.type || "Other"; if (!typeAgg[k]) typeAgg[k] = { label: k, line: s.serviceLine || "video", count: 0, revenue: 0 }; typeAgg[k].count++; typeAgg[k].revenue += Number(s.total) || 0; });
  const byType = Object.values(typeAgg).sort((a, b) => b.count - a.count || b.revenue - a.revenue);
  const lineAgg = {}; arows.forEach((s) => { const k = GROUP_KEYS.indexOf(s.serviceLine) >= 0 ? s.serviceLine : "video"; if (!lineAgg[k]) lineAgg[k] = { key: k, count: 0, revenue: 0 }; lineAgg[k].count++; lineAgg[k].revenue += Number(s.total) || 0; });
  const byLine = GROUP_KEYS.map((k) => lineAgg[k]).filter(Boolean);
  const monthAgg = {}; arows.forEach((s) => { if (!s.date) return; const k = s.date.slice(0, 7); if (!monthAgg[k]) monthAgg[k] = { key: k, count: 0, revenue: 0 }; monthAgg[k].count++; monthAgg[k].revenue += Number(s.total) || 0; });
  const byMonth = Object.keys(monthAgg).sort().slice(-12).map((k) => monthAgg[k]);
  const lineSegments = byLine.map((l) => ({ label: GROUPS[l.key].label, value: l.revenue, count: l.count, color: GROUPS[l.key].color }));
  const typeItems = byType.slice(0, 10).map((t) => ({ label: t.label, value: t.count, right: t.count + (t.count === 1 ? " booking" : " bookings") + " \u00b7 " + money(t.revenue), color: (GROUPS[t.line] || GROUPS.video).color }));
  const monthItems = byMonth.map((m) => ({ label: monthShort(m.key), value: m.revenue, top: compactMoney(m.revenue), color: RED }));

  const exportSessions = () => {
    if (rows.length === 0) { showToast("No sessions in that date range."); return; }
    const out = [["Date", "Time", "Client", "Email", "Service", "Group", "Status", "Stage", "Total ($)", "Collected ($)", "Payment", "Add-ons"]];
    rows.forEach((s) => out.push([s.date || "", s.time || "", s.clientName || "", s.clientEmail || "", s.type || "", s.serviceLine || "", s.status || "active", curStage(s).label || "", (Number(s.total) || 0).toFixed(2), (s.paymentStatus === "paid" ? (Number(s.payAmount) || 0) : 0).toFixed(2), s.paymentStatus || "none", (s.selectedAddons || []).map((a) => a.name).join("; ")]));
    downloadCsv(out, "dot-one-media-sessions" + ((start || end) ? "_" + (start || "start") + "_to_" + (end || "end") : "_all") + ".csv");
    showToast("Exported " + rows.length + " sessions.");
  };
  const exportClients = () => {
    const seen = {}; const clients = [];
    (sessions || []).forEach((s) => { const key = (s.clientEmail || "").toLowerCase(); if (!key || seen[key]) return; seen[key] = true; clients.push(s); });
    if (clients.length === 0) { showToast("No clients yet."); return; }
    const out = [["Client", "Email", "First booking", "Total bookings"]];
    clients.forEach((c) => { const theirs = (sessions || []).filter((x) => (x.clientEmail || "").toLowerCase() === (c.clientEmail || "").toLowerCase()); const first = theirs.map((x) => x.date).filter(Boolean).sort()[0] || ""; out.push([c.clientName || "", c.clientEmail || "", first, String(theirs.length)]); });
    downloadCsv(out, "dot-one-media-clients.csv");
    showToast("Exported " + clients.length + " clients.");
  };
  const exportAnalytics = () => {
    if (arows.length === 0) { showToast("No booking data to export yet."); return; }
    const out = [];
    out.push(["Dot One Media \u00b7 Booking analytics"]);
    out.push(["Period", (start || "all time") + (end ? " to " + end : (start ? " onward" : ""))]);
    out.push(["Bookings", String(arows.length), "Booked revenue ($)", bookedRevenue.toFixed(2), "Avg per booking ($)", avgValue.toFixed(2), "Collected ($)", collected.toFixed(2), "Outstanding ($)", outstanding.toFixed(2)]);
    out.push([]);
    out.push(["Session type", "Bookings", "Revenue ($)", "Avg per booking ($)"]);
    byType.forEach((t) => out.push([t.label, String(t.count), t.revenue.toFixed(2), (t.count ? t.revenue / t.count : 0).toFixed(2)]));
    out.push([]);
    out.push(["Service line", "Bookings", "Revenue ($)"]);
    byLine.forEach((l) => out.push([GROUPS[l.key].label, String(l.count), l.revenue.toFixed(2)]));
    out.push([]);
    out.push(["Month", "Bookings", "Revenue ($)"]);
    Object.keys(monthAgg).sort().forEach((k) => out.push([k, String(monthAgg[k].count), monthAgg[k].revenue.toFixed(2)]));
    downloadCsv(out, "dot-one-media-analytics" + ((start || end) ? "_" + (start || "start") + "_to_" + (end || "end") : "_all") + ".csv");
    showToast("Analytics exported.");
  };
  const statCard = (val, label, color) => (
    <div style={{ ...cardDense, borderRadius: 11, padding: "14px 16px" }}>
      <div style={{ ...display, fontSize: 24, color: color || INK }}>{val}</div>
      <div style={{ ...mono, fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: STONE, marginTop: 2 }}>{label}</div>
    </div>
  );
  const modeBadge = (label, value, ok) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", border: `1px solid ${LINE}`, borderRadius: 9, background: PAPER }}>
      <span style={{ ...mono, fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: STONE }}>{label}</span>
      <span style={{ ...mono, fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: ok ? OK : WARN, fontWeight: 600 }}>{value}</span>
    </div>
  );
  return (
    <div className="d1-stagger">
      <div style={{ ...mono, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: RED, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}><Settings size={13} /> Business settings</div>
      <div style={{ fontSize: 13, color: BODY, lineHeight: 1.5, marginBottom: 24, maxWidth: 600 }}>See which service lines and session types drive your bookings and revenue, review any period, export your records, and confirm payments and email are live.</div>

      <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 10 }}>System status</div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 28 }}>
        {modeBadge("Payments", status ? (status.squareMode === "production" ? "Live (production)" : status.squareMode === "sandbox" ? "Test (sandbox)" : "Off") : "\u2026", !!(status && status.squareMode === "production"))}
        {modeBadge("Email", status ? (status.emailOn ? "On" : "Off") : "\u2026", !!(status && status.emailOn))}
      </div>

      <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 10 }}>Revenue &amp; records by period</div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 16 }}>
        <div><FieldLabel>From</FieldLabel><input type="date" value={start} onChange={(e) => setStart(e.target.value)} style={{ ...inputStyle, width: "auto" }} /></div>
        <div><FieldLabel>To</FieldLabel><input type="date" value={end} onChange={(e) => setEnd(e.target.value)} style={{ ...inputStyle, width: "auto" }} /></div>
        {(start || end) && <button onClick={() => { setStart(""); setEnd(""); }} style={{ ...mono, fontSize: 10.5, letterSpacing: "0.06em", color: STONE, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 7, padding: "9px 12px", cursor: "pointer" }}>All time</button>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 10, marginBottom: 26 }}>
        {statCard(activeCount, "Bookings")}
        {statCard(money(bookedRevenue), "Booked revenue")}
        {statCard(money(Math.round(avgValue)), "Avg value")}
        {statCard(money(collected), "Collected", OK)}
        {statCard(money(outstanding), "Outstanding", WARN)}
      </div>

      <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 12 }}>Insights</div>
      {arows.length === 0 ? (
        <div style={{ marginBottom: 28 }}><EmptyHint text="Charts will appear here as bookings come in. They update automatically and follow the date range above." /></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
          <div style={{ ...cardDense, padding: "16px 18px" }}>
            <div style={{ ...mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: STONE, marginBottom: 16 }}>Revenue by service line</div>
            <div style={{ display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap" }}>
              <DonutChart segments={lineSegments} centerLabel={compactMoney(bookedRevenue)} centerSub="booked" />
              <div style={{ flex: 1, minWidth: 190, display: "flex", flexDirection: "column", gap: 9 }}>
                {lineSegments.map((seg) => { const pct = bookedRevenue > 0 ? Math.round(100 * seg.value / bookedRevenue) : 0; return (
                  <div key={seg.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 11, height: 11, borderRadius: 3, background: seg.color, flexShrink: 0 }} />
                    <span style={{ ...display, fontSize: 13, color: INK, flex: 1 }}>{seg.label}</span>
                    <span style={{ ...mono, fontSize: 11, color: STONE }}>{money(seg.value)}{" \u00b7 "}{pct}%</span>
                  </div>
                ); })}
              </div>
            </div>
          </div>

          <div style={{ ...cardDense, padding: "16px 18px" }}>
            <div style={{ ...mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: STONE, marginBottom: 16 }}>Bookings by session type</div>
            <HBars items={typeItems} />
            {byType.length > typeItems.length && <div style={{ ...mono, fontSize: 9.5, color: FAINT, marginTop: 12 }}>Showing top {typeItems.length} of {byType.length} types{" \u00b7 "}full list in the analytics export.</div>}
          </div>

          {byMonth.length >= 2 && (
            <div style={{ ...cardDense, padding: "16px 18px" }}>
              <div style={{ ...mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: STONE, marginBottom: 16 }}>Revenue by month</div>
              <MiniColumns items={monthItems} />
            </div>
          )}
        </div>
      )}

      <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 10 }}>Invoice archive</div>
      <div style={{ fontSize: 12.5, color: STONE, lineHeight: 1.55, marginBottom: 12, maxWidth: 600 }}>Every invoice you have sent, newest first. Download the PDF, resend the email with its payment link, or delete a record. Deleting an invoice never touches the booked session.</div>
      <div style={{ marginBottom: 30, maxWidth: 680 }}><InvoiceArchive showToast={showToast} /></div>

      <ImportSessions existing={sessions} onImport={onImport} showToast={showToast} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE }}>Receipts</div>
        <button onClick={syncReceipts} disabled={syncing} title="Re-check Square for every paid session and record any missing receipts" style={{ ...mono, fontSize: 9, letterSpacing: "0.05em", textTransform: "uppercase", color: STONE, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 7, padding: "7px 11px", cursor: syncing ? "default" : "pointer", opacity: syncing ? 0.6 : 1, display: "inline-flex", alignItems: "center", gap: 6 }}><RefreshCw size={11} /> {syncing ? "Syncing\u2026" : "Sync from Square"}</button>
      </div>
      {!payLoaded ? (
        <div style={{ ...cardDense, overflow: "hidden", marginBottom: 28 }}>{[0, 1, 2].map((i) => (<div key={i} style={{ padding: "14px 16px", borderTop: i === 0 ? "none" : `1px solid ${LINE}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}><div style={{ flex: 1 }}><Skeleton w="38%" h={13} style={{ marginBottom: 7 }} /><Skeleton w="62%" h={10} /></div><Skeleton w={64} h={26} r={7} /></div>))}</div>
      ) : payments.length === 0 ? (
        <div style={{ ...cardDense, marginBottom: 28 }}><EmptyState icon={FileText} title="No receipts yet" text={"A receipt is saved here automatically each time a client pays by card, and emailed to them as a PDF. You'll be able to view, export, or re-send each one."} style={{ padding: "34px 20px" }} /></div>
      ) : (
        <div style={{ ...cardDense, overflow: "hidden", marginBottom: 28 }}>
          {payments.map((p, i) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderTop: i === 0 ? "none" : `1px solid ${LINE}`, background: PAPER, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 210 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 9, flexWrap: "wrap" }}>
                  <span style={{ ...display, fontSize: 14, fontWeight: 600, color: INK }}>{p.client_name || "Client"}</span>
                  <span style={{ ...mono, fontSize: 13, color: RED, fontWeight: 500 }}>{payMoney(p.amount_cents)}</span>
                </div>
                <div style={{ ...mono, fontSize: 10, color: STONE, marginTop: 3, letterSpacing: "0.02em" }}>{payDateShort(p.paid_at)}{" \u00b7 "}{p.service || "Session"}{" \u00b7 "}{payKindLabel(p.kind)}{" \u00b7 "}{payCardLabel(p)}</div>
              </div>
              <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
                <a href={"/api/receipt?id=" + encodeURIComponent(p.id)} target="_blank" rel="noopener noreferrer" style={{ ...mono, fontSize: 10, letterSpacing: "0.04em", textTransform: "uppercase", color: INK, textDecoration: "none", border: `1px solid ${LINE}`, borderRadius: 7, padding: "7px 11px", display: "inline-flex", alignItems: "center", gap: 5 }}><FileText size={12} /> Receipt</a>
                <button onClick={() => emailReceipt(p)} disabled={emailing === p.id} style={{ ...mono, fontSize: 10, letterSpacing: "0.04em", textTransform: "uppercase", color: emailing === p.id ? FAINT : "#fff", background: emailing === p.id ? LINE : OK, border: "none", borderRadius: 7, padding: "7px 11px", cursor: emailing === p.id ? "default" : "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}><Mail size={12} /> {emailing === p.id ? "Sending\u2026" : "Email"}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 10 }}>Export</div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={exportSessions} style={{ ...btnSolid, background: RED }}><Download size={14} /> Export sessions (CSV)</button>
        <button onClick={exportClients} style={{ ...btnGhost, display: "inline-flex", alignItems: "center", gap: 7 }}><Download size={14} /> Export clients (CSV)</button>
        <button onClick={exportAnalytics} style={{ ...btnGhost, display: "inline-flex", alignItems: "center", gap: 7 }}><Download size={14} /> Export analytics (CSV)</button>
      </div>
      <div style={{ ...mono, fontSize: 10, color: FAINT, marginTop: 12, lineHeight: 1.5, maxWidth: 560 }}>The sessions export uses the date range above (all-time if blank). Each row lists the total, what you collected, and payment status, ready for bookkeeping and taxes.</div>
    </div>
  );
}

