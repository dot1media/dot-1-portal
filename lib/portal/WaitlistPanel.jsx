"use client";
import React, { useEffect, useState } from "react";
import { BellRing, X } from "lucide-react";
import { card, mono, display, INK, LINE, STONE, FAINT, PAPER, CREAM, RED, btnSolid } from "./theme";
import { fmtDate } from "./format";

export function WaitlistPanel({ showToast }) {
  const [entries, setEntries] = useState(null);
  const load = () => fetch("/api/waitlist").then((r) => r.json()).then((d) => setEntries(d.entries || [])).catch(() => setEntries([]));
  useEffect(() => { load(); }, []);
  if (!entries || entries.length === 0) return null;
  const dates = Array.from(new Set(entries.map((e) => e.date)));
  async function notify(date) { try { const r = await fetch("/api/waitlist/notify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ date }) }).then((x) => x.json()); if (showToast) showToast(r.notified ? "Notified " + r.notified + " waiting client" + (r.notified === 1 ? "" : "s") + "." : "Everyone on that date was already notified."); load(); } catch (e) {} }
  async function remove(id) { try { await fetch("/api/waitlist?id=" + encodeURIComponent(id), { method: "DELETE" }); load(); } catch (e) {} }
  return (
    <div style={{ ...card, padding: "18px 20px", marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ width: 32, height: 32, borderRadius: 8, background: CREAM, display: "inline-flex", alignItems: "center", justifyContent: "center", color: STONE }}><BellRing size={15} /></span>
        <div><div style={{ ...display, fontWeight: 600, fontSize: 15, color: INK }}>Waitlist</div><div style={{ fontSize: 12, color: STONE }}>Clients hoping for a full date. They're emailed automatically when a window opens or a booking moves off that day; you can also notify by hand.</div></div>
      </div>
      {dates.map((d) => { const list = entries.filter((e) => e.date === d); const pending = list.filter((e) => !e.notified_at).length; return (
        <div key={d} style={{ borderTop: `1px solid ${LINE}`, padding: "10px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <div style={{ ...mono, fontSize: 11.5, color: INK }}>{fmtDate(d)} <span style={{ color: FAINT }}>· {list.length} waiting{pending ? " · " + pending + " not yet notified" : ""}</span></div>
            {pending > 0 && <button onClick={() => notify(d)} style={{ ...btnSolid, background: RED, padding: "7px 12px", fontSize: 10.5 }}>Notify {pending}</button>}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {list.map((e) => <span key={e.id} style={{ ...mono, fontSize: 10.5, padding: "5px 9px", borderRadius: 999, background: e.notified_at ? PAPER : CREAM, border: `1px solid ${LINE}`, color: e.notified_at ? FAINT : INK, display: "inline-flex", alignItems: "center", gap: 6 }} title={e.email + (e.service_name ? " · " + e.service_name : "")}>{e.name || e.email}{e.notified_at ? " · notified" : ""}<button onClick={() => remove(e.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: STONE, display: "inline-flex" }}><X size={11} /></button></span>)}
          </div>
        </div>
      ); })}
    </div>
  );
}
