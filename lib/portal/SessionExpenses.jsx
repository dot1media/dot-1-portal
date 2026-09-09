"use client";
import React, { useEffect, useState } from "react";
import { Receipt, X, Plus } from "lucide-react";
import { mono, INK, BODY, LINE, STONE, FAINT, PAPER, CREAM, OK, WARN, inputStyle, btnSolid, RED } from "./theme";
import { money } from "./format";

const CATS = [["mileage", "Mileage"], ["props", "Props & styling"], ["crew", "Second shooter / crew"], ["gear", "Gear & rentals"], ["location", "Location / permits"], ["other", "Other"]];

export function SessionExpenses({ sessionId, revenue }) {
  const [items, setItems] = useState([]);
  const [f, setF] = useState({ label: "", amount: "", category: "other" });
  const [open, setOpen] = useState(false);
  const load = () => fetch("/api/expenses?sessionId=" + encodeURIComponent(sessionId)).then((r) => r.json()).then((d) => setItems(d.expenses || [])).catch(() => {});
  useEffect(() => { if (sessionId) load(); }, [sessionId]);
  const total = items.reduce((a, r) => a + (Number(r.amount_cents) || 0), 0) / 100;
  const net = (Number(revenue) || 0) - total;
  async function add() { const amt = Number(f.amount); if (!f.label.trim() || !(amt > 0)) return; await fetch("/api/expenses", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId, label: f.label.trim(), amount: amt, category: f.category }) }); setF({ label: "", amount: "", category: f.category }); load(); }
  async function remove(id) { await fetch("/api/expenses?id=" + encodeURIComponent(id), { method: "DELETE" }); load(); }
  return (
    <div style={{ background: CREAM, border: `1px solid ${LINE}`, borderRadius: 10, padding: "14px 16px", marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ ...mono, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, display: "flex", alignItems: "center", gap: 7 }}><Receipt size={13} /> Expenses & profit</div>
        <div style={{ ...mono, fontSize: 11, color: INK }}>{money(Number(revenue) || 0)} booked <span style={{ color: FAINT }}>−</span> {money(total)} costs <span style={{ color: FAINT }}>=</span> <b style={{ color: net >= 0 ? OK : WARN }}>{money(net)} net</b>{revenue > 0 ? <span style={{ color: FAINT }}> · {Math.round((net / revenue) * 100)}% margin</span> : null}</div>
      </div>
      {items.length > 0 && <div style={{ marginTop: 10 }}>{items.map((e) => (
        <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", borderTop: `1px solid ${LINE}` }}>
          <span style={{ ...mono, fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", color: FAINT, minWidth: 74 }}>{(CATS.find(([k]) => k === e.category) || ["", "Other"])[1]}</span>
          <span style={{ flex: 1, fontSize: 13, color: INK }}>{e.label}</span>
          <span style={{ ...mono, fontSize: 11.5, color: INK }}>{money((Number(e.amount_cents) || 0) / 100)}</span>
          <button onClick={() => remove(e.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: FAINT, display: "inline-flex" }}><X size={13} /></button>
        </div>
      ))}</div>}
      {!open ? <button onClick={() => setOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 10, ...mono, fontSize: 10.5, letterSpacing: "0.05em", color: RED, display: "inline-flex", alignItems: "center", gap: 5 }}><Plus size={12} /> Add expense</button> : (
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} style={{ ...inputStyle, width: 170 }}>{CATS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <input value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") add(); }} placeholder="What was it" style={{ ...inputStyle, flex: "1 1 160px" }} />
          <input type="number" min="0" step="0.01" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} onKeyDown={(e) => { if (e.key === "Enter") add(); }} placeholder="0.00" style={{ ...inputStyle, width: 96 }} />
          <button onClick={add} style={{ ...btnSolid, background: RED }}>Add</button>
        </div>
      )}
    </div>
  );
}
