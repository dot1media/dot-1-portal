"use client";
import React, { useMemo, useState } from "react";
import { Zap, X } from "lucide-react";
import { card, mono, display, INK, BODY, LINE, STONE, FAINT, PAPER, CREAM, RED, inputStyle, btnSolid, btnGhost } from "./theme";
import { GROUPS, GROUP_KEYS } from "./groups";
import { NOTIFY_EMAILS } from "./constants";
import { money } from "./format";

const uid = (p) => p + "_" + Math.random().toString(36).slice(2, 10);

export function QuickBook({ state, onCreated, showToast }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", email: "", serviceId: "", date: "", time: "", pay: "pending", note: "", invite: true });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const services = (state.services || []).filter((s) => s.visible !== false);
  const recent = useMemo(() => { const m = new Map(); for (const s of state.sessions || []) { const e = (s.clientEmail || "").toLowerCase(); if (e && !m.has(e)) m.set(e, s.clientName || ""); } return Array.from(m.entries()); }, [state.sessions]);
  const svc = services.find((s) => String(s.id) === String(f.serviceId));
  const set = (k, v) => { setF((p) => ({ ...p, [k]: v })); setErr(""); };
  const pickRecent = (email) => { const hit = recent.find(([e]) => e === email.toLowerCase()); if (hit) setF((p) => ({ ...p, email: hit[0], name: p.name || hit[1] })); };

  async function create() {
    if (!f.name.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) { setErr("Client name and a valid email are required."); return; }
    if (!svc) { setErr("Pick a session type."); return; }
    if (!f.date) { setErr("Pick a date."); return; }
    setBusy(true);
    const grp = svc.group; const total = Number(svc.price) || 0;
    const payAmount = f.pay === "paid" ? total : f.pay === "deposit" ? Math.round(total * 0.5 * 100) / 100 : 0;
    const session = {
      id: uid("ses"), clientName: f.name.trim(), clientEmail: f.email.trim().toLowerCase(), clientImage: "", notifyEmail: NOTIFY_EMAILS[grp] || "contact@dot1.media",
      type: svc.name, serviceLine: grp, serviceId: svc.id, photographer: grp === "photo" ? "Brittany Matthews" : "Dennis Matthews",
      date: f.date, time: f.time || "", location: svc.locationName || "", locationName: svc.locationName || "", locationUrl: svc.locationUrl || "", confirmationMessage: svc.confirmationMessage || "",
      status: "active", durationMin: svc.durationMin || 60, apptMin: svc.durationMin || 60, padBefore: svc.padBefore || 0, padAfter: svc.padAfter || 0,
      currentStage: 0, stageTimes: { 0: "just now" }, comments: f.note.trim() ? [{ author: "studio", body: "Booked by the studio: " + f.note.trim(), time: "just now", read: true }] : [],
      selectedAddons: [], total, payChoice: f.pay === "deposit" ? "deposit" : "full", paymentStatus: f.pay === "pending" ? "pending" : "paid", payAmount, balanceStatus: f.pay === "paid" ? "paid" : undefined,
      reviewLink: "", deliveryVideo: "", deliveryPhoto: "", deliveryMusic: "", deliveryGov: "", inviteAccount: !!f.invite, bookedBy: "studio",
    };
    try {
      const r = await fetch("/api/sessions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ session }) });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || "Could not create the session."); }
      onCreated(session); if (showToast) showToast("Booked " + session.clientName + " for " + svc.name + ".");
      setOpen(false); setF({ name: "", email: "", serviceId: "", date: "", time: "", pay: "pending", note: "", invite: true });
    } catch (e) { setErr(e.message || "Could not create the session."); }
    setBusy(false);
  }

  if (!open) return <button onClick={() => setOpen(true)} style={{ ...btnSolid, background: RED, marginBottom: 16 }}><Zap size={14} /> Quick book</button>;
  return (
    <div style={{ ...card, padding: "18px 20px", marginBottom: 18, borderLeft: `4px solid ${RED}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div><div style={{ ...display, fontWeight: 600, fontSize: 15, color: INK }}>Quick book</div><div style={{ fontSize: 12, color: STONE }}>Book a client directly, for phone bookings and repeat clients. The client gets a confirmation and portal access.</div></div>
        <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: STONE, display: "inline-flex" }}><X size={16} /></button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
        <div><div style={{ ...mono, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: STONE, marginBottom: 5 }}>Client email</div><input list="qb-recent" value={f.email} onChange={(e) => { set("email", e.target.value); pickRecent(e.target.value); }} placeholder="client@example.com" style={inputStyle} /><datalist id="qb-recent">{recent.map(([e, n]) => <option key={e} value={e}>{n}</option>)}</datalist></div>
        <div><div style={{ ...mono, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: STONE, marginBottom: 5 }}>Client name</div><input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Full name" style={inputStyle} /></div>
        <div style={{ gridColumn: "1 / -1" }}><div style={{ ...mono, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: STONE, marginBottom: 5 }}>Session type</div>
          <select value={f.serviceId} onChange={(e) => set("serviceId", e.target.value)} style={inputStyle}><option value="">Choose…</option>{GROUP_KEYS.map((k) => { const list = services.filter((s) => s.group === k); return list.length ? <optgroup key={k} label={(GROUPS[k] || {}).label || k}>{list.map((s) => <option key={s.id} value={s.id}>{s.name} · {money(s.price)}{s.durationMin ? " · " + s.durationMin + " min" : ""}</option>)}</optgroup> : null; })}</select></div>
        <div><div style={{ ...mono, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: STONE, marginBottom: 5 }}>Date</div><input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} style={inputStyle} /></div>
        <div><div style={{ ...mono, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: STONE, marginBottom: 5 }}>Time</div><input type="time" value={f.time} onChange={(e) => set("time", e.target.value)} style={inputStyle} /></div>
        <div style={{ gridColumn: "1 / -1" }}><div style={{ ...mono, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: STONE, marginBottom: 6 }}>Payment</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{[["pending", "Not yet, client pays in portal"], ["deposit", "Deposit collected (50%)"], ["paid", "Paid in full"]].map(([v, l]) => <button key={v} onClick={() => set("pay", v)} style={{ ...mono, fontSize: 10.5, padding: "8px 12px", borderRadius: 999, cursor: "pointer", border: `1px solid ${f.pay === v ? RED : LINE}`, background: f.pay === v ? RED : PAPER, color: f.pay === v ? "#fff" : STONE }}>{l}</button>)}</div></div>
        <div style={{ gridColumn: "1 / -1" }}><input value={f.note} onChange={(e) => set("note", e.target.value)} placeholder="Internal note (optional), e.g. booked by phone, wants sunset light" style={inputStyle} /></div>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 12.5, color: BODY, cursor: "pointer" }}><input type="checkbox" checked={f.invite} onChange={(e) => set("invite", e.target.checked)} /> Email the client a confirmation and an invite to their portal</label>
      {err && <div style={{ ...mono, fontSize: 10.5, color: "#b3261e", marginTop: 8 }}>{err}</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }}>
        <button onClick={create} disabled={busy} style={{ ...btnSolid, background: RED }}>{busy ? "Booking…" : "Create booking"}{svc ? " \u00b7 " + money(svc.price) : ""}</button>
        <button onClick={() => setOpen(false)} style={btnGhost}>Cancel</button>
      </div>
    </div>
  );
}
