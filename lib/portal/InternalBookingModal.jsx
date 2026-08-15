// Dot One Media portal - studio-only internal booking modal (manual booking + optional Square payment request).
import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { RED, INK, STONE, FAINT, LINE, PAPER, display, mono, card, inputStyle, iconBtnStyle, btnSolid } from "./theme";
import { GROUPS, GROUP_KEYS } from "./groups";
import { money } from "./format";
import { FieldLabel, TextInput } from "./ui";

export function InternalBookingModal({ state, showToast, onClose, onCreate }) {
  const [group, setGroup] = useState("photo");
  const [serviceId, setServiceId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [total, setTotal] = useState("");
  const [deposit, setDeposit] = useState("");
  const [busy, setBusy] = useState(false);
  const groupServices = state.services.filter((s) => s.group === group);
  const svc = state.services.find((s) => s.id === serviceId);
  useEffect(() => { if (svc) setTotal(String(svc.price || "")); }, [serviceId]);
  const submit = async () => {
    if (!name.trim()) { showToast("Enter the client's name."); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) { showToast("Enter a valid client email."); return; }
    if (!svc) { showToast("Choose a service."); return; }
    if (!date || !time) { showToast("Pick a date and time."); return; }
    setBusy(true);
    await onCreate({ group, serviceName: svc.name, serviceId: svc.id, duration: svc.duration, name: name.trim(), email: email.trim(), date, time, total, deposit });
    setBusy(false); onClose();
  };
  return (
    <div className="d1-overlay" style={{ position: "fixed", inset: 0, background: "rgba(20,20,26,0.55)", zIndex: 60, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "38px 16px", overflowY: "auto" }} onClick={onClose}>
      <div className="d1-modal" style={{ ...card, width: 480, maxWidth: "100%", padding: "24px 26px" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <span style={{ ...mono, fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase", color: RED }}>Internal booking</span>
          <button onClick={onClose} style={iconBtnStyle}><X size={15} /></button>
        </div>
        <h2 style={{ ...display, fontWeight: 700, fontSize: 21, color: INK, marginBottom: 6 }}>Book a session for a client</h2>
        <p style={{ fontSize: 12.5, color: STONE, lineHeight: 1.5, marginBottom: 18 }}>You track this one yourself. The client gets the agreement and any payment request by email, and their gallery when you're done. No portal account is created for them.</p>
        <FieldLabel>Client name</FieldLabel><TextInput value={name} onChange={setName} placeholder="Sarah Miller" />
        <div style={{ height: 10 }} />
        <FieldLabel>Client email</FieldLabel><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sarah@example.com" style={inputStyle} />
        <div style={{ height: 10 }} />
        <FieldLabel>Service group</FieldLabel>
        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          {GROUP_KEYS.map((k) => { const gg = GROUPS[k]; const active = group === k; return (
            <button key={k} onClick={() => { setGroup(k); setServiceId(""); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 11px", borderRadius: 7, cursor: "pointer", fontSize: 12, border: `1px solid ${active ? gg.color : LINE}`, background: active ? gg.color : PAPER, color: active ? "#fff" : STONE }}><gg.Icon size={12} /> {gg.label}</button>
          ); })}
        </div>
        <FieldLabel>Service</FieldLabel>
        <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
          <option value="">Choose a service…</option>
          {groupServices.map((s) => <option key={s.id} value={s.id}>{s.name}{s.price ? " — " + money(s.price) : ""}</option>)}
        </select>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <div style={{ flex: 1 }}><FieldLabel>Date</FieldLabel><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} /></div>
          <div style={{ flex: 1 }}><FieldLabel>Time</FieldLabel><input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={inputStyle} /></div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <div style={{ flex: 1 }}><FieldLabel>Total price</FieldLabel><input type="number" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="0" style={inputStyle} /></div>
          <div style={{ flex: 1 }}><FieldLabel>Collect now (optional)</FieldLabel><input type="number" value={deposit} onChange={(e) => setDeposit(e.target.value)} placeholder="0" style={inputStyle} /></div>
        </div>
        <div style={{ ...mono, fontSize: 9.5, color: FAINT, marginTop: 8, lineHeight: 1.5 }}>Enter an amount to collect now and the client is emailed a secure Square payment request.</div>
        <button onClick={submit} disabled={busy} style={{ ...btnSolid, background: busy ? FAINT : RED, width: "100%", justifyContent: "center", marginTop: 16, padding: "11px" }}>{busy ? "Creating\u2026" : "Create booking & notify client"}</button>
      </div>
    </div>
  );
}

