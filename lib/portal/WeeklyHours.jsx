"use client";
import React, { useEffect, useState } from "react";
import { CalendarRange, Plus, X, Check } from "lucide-react";
import { card, mono, display, INK, LINE, STONE, FAINT, PAPER, CREAM, RED, inputStyle, btnSolid, btnGhost } from "./theme";
import { GROUPS, GROUP_KEYS } from "./groups";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function WeeklyHours({ services, showToast, onApplied }) {
  const [t, setT] = useState(null);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [blackIn, setBlackIn] = useState("");
  const [result, setResult] = useState("");

  useEffect(() => { fetch("/api/availability/template").then((r) => r.json()).then((d) => { if (d.template) setT(d.template); }).catch(() => {}); }, []);

  const setDay = (i, patch) => setT((x) => ({ ...x, weekly: { ...x.weekly, [String(i)]: { ...(x.weekly[String(i)] || { on: false, start: "09:00", end: "17:00" }), ...patch } } }));
  const toggleSvc = (id) => setT((x) => { const cur = (x.serviceIds || []).map(String); const s = String(id); return { ...x, serviceIds: cur.includes(s) ? cur.filter((v) => v !== s) : [...cur, s] }; });
  async function save(silent) {
    setSaving(true);
    try { const r = await fetch("/api/availability/template", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ template: t }) }).then((x) => x.json()); if (r.ok) { setT(r.template); if (!silent && showToast) showToast("Weekly hours saved."); return true; } } catch (e) {}
    setSaving(false); return false;
  }
  async function apply() {
    setApplying(true); setResult("");
    const ok = await save(true); setSaving(false);
    if (ok) { try { const r = await fetch("/api/availability/template/apply", { method: "POST" }).then((x) => x.json()); if (r.ok) { setResult("Opened " + r.opened + " day" + (r.opened === 1 ? "" : "s") + " across the next " + r.weeks + " weeks" + (r.skipped ? " (" + r.skipped + " skipped: already open or blacked out)" : "") + "."); if (onApplied) onApplied(); if (showToast) showToast("Calendar filled from your weekly hours."); } else setResult(r.error || "Could not apply."); } catch (e) { setResult("Network error."); } }
    setApplying(false);
  }
  if (!t) return null;
  const svcList = (services || []).filter((s) => s.visible !== false);
  const onCount = Object.values(t.weekly || {}).filter((d) => d && d.on).length;

  return (
    <div style={{ ...card, padding: "18px 20px", marginBottom: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <span style={{ width: 32, height: 32, borderRadius: 8, background: CREAM, display: "inline-flex", alignItems: "center", justifyContent: "center", color: STONE }}><CalendarRange size={15} /></span>
        <div><div style={{ ...display, fontWeight: 600, fontSize: 15, color: INK }}>Weekly hours</div><div style={{ fontSize: 12, color: STONE }}>Set your regular hours once and fill the calendar ahead automatically. Days you already opened are left untouched.</div></div>
      </div>
      <div style={{ marginTop: 14, borderTop: `1px solid ${LINE}` }}>
        {DAYS.map((name, i) => { const d = (t.weekly || {})[String(i)] || { on: false, start: "09:00", end: "17:00" }; return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: `1px solid ${LINE}`, flexWrap: "wrap" }}>
            <button onClick={() => setDay(i, { on: !d.on })} style={{ width: 22, height: 22, borderRadius: 6, border: `1.5px solid ${d.on ? RED : LINE}`, background: d.on ? RED : PAPER, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{d.on ? <Check size={13} color="#fff" /> : null}</button>
            <span style={{ ...mono, fontSize: 11.5, letterSpacing: "0.08em", textTransform: "uppercase", color: d.on ? INK : FAINT, width: 42 }}>{name}</span>
            <input type="time" value={d.start} disabled={!d.on} onChange={(e) => setDay(i, { start: e.target.value })} style={{ ...inputStyle, width: 118, opacity: d.on ? 1 : 0.45 }} />
            <span style={{ ...mono, fontSize: 10, color: FAINT }}>to</span>
            <input type="time" value={d.end} disabled={!d.on} onChange={(e) => setDay(i, { end: e.target.value })} style={{ ...inputStyle, width: 118, opacity: d.on ? 1 : 0.45 }} />
          </div>
        ); })}
      </div>
      <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginTop: 14 }}>
        <div style={{ flex: "1 1 260px" }}>
          <div style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: STONE, marginBottom: 7 }}>Blackout dates (skipped)</div>
          <div style={{ display: "flex", gap: 7 }}>
            <input type="date" value={blackIn} onChange={(e) => setBlackIn(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            <button onClick={() => { if (blackIn && !(t.blackouts || []).includes(blackIn)) setT((x) => ({ ...x, blackouts: [...(x.blackouts || []), blackIn].sort() })); setBlackIn(""); }} style={{ ...btnGhost, display: "inline-flex", alignItems: "center", gap: 6 }}><Plus size={13} /> Add</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {(t.blackouts || []).map((b) => <span key={b} style={{ ...mono, fontSize: 10.5, padding: "5px 9px", borderRadius: 999, background: CREAM, border: `1px solid ${LINE}`, color: INK, display: "inline-flex", alignItems: "center", gap: 6 }}>{b}<button onClick={() => setT((x) => ({ ...x, blackouts: (x.blackouts || []).filter((v) => v !== b) }))} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: STONE, display: "inline-flex" }}><X size={12} /></button></span>)}
            {!(t.blackouts || []).length && <span style={{ ...mono, fontSize: 10, color: FAINT }}>None yet. Add holidays or days off.</span>}
          </div>
        </div>
        <div style={{ flex: "1 1 260px" }}>
          <div style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: STONE, marginBottom: 7 }}>Session types (none = every type)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {GROUP_KEYS.flatMap((k) => svcList.filter((s) => s.group === k).map((s) => { const on = (t.serviceIds || []).map(String).includes(String(s.id)); const col = (GROUPS[k] || {}).color || RED; return (
              <button key={s.id} onClick={() => toggleSvc(s.id)} style={{ ...mono, fontSize: 10, padding: "6px 10px", borderRadius: 999, cursor: "pointer", border: `1px solid ${on ? col : LINE}`, background: on ? col : PAPER, color: on ? "#fff" : STONE }}>{s.name}</button>
            ); }))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
            <span style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: STONE }}>Fill the next</span>
            <input type="number" min="1" max="26" value={t.horizonWeeks} onChange={(e) => setT((x) => ({ ...x, horizonWeeks: e.target.value }))} style={{ ...inputStyle, width: 64 }} />
            <span style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: STONE }}>weeks</span>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 16, flexWrap: "wrap" }}>
        <button onClick={() => save(false)} disabled={saving} style={btnGhost}>{saving ? "Saving…" : "Save weekly hours"}</button>
        <button onClick={apply} disabled={applying || onCount === 0} style={{ ...btnSolid, background: onCount ? RED : FAINT }}><CalendarRange size={14} /> {applying ? "Filling calendar…" : "Apply to calendar"}</button>
        {result && <span style={{ ...mono, fontSize: 10.5, color: STONE }}>{result}</span>}
      </div>
    </div>
  );
}
