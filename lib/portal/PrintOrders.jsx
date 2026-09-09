"use client";
import React, { useEffect, useState } from "react";
import { Package, Check } from "lucide-react";
import { card, mono, display, INK, BODY, LINE, STONE, FAINT, PAPER, CREAM, OK, WARN, RED, inputStyle, btnSolid, btnGhost } from "./theme";
import { money } from "./format";

export function PrintCatalog({ showToast }) {
  const [list, setList] = useState(null);
  useEffect(() => { fetch("/api/prints/products").then((r) => r.json()).then((d) => setList(d.products || [])).catch(() => setList([])); }, []);
  if (!list) return null;
  const set = (i, patch) => setList(list.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  async function save() { await fetch("/api/prints/products", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ products: list }) }); if (showToast) showToast("Print catalog saved."); }
  return (
    <div style={{ ...card, padding: "18px 20px", marginTop: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span style={{ width: 32, height: 32, borderRadius: 8, background: CREAM, display: "inline-flex", alignItems: "center", justifyContent: "center", color: STONE }}><Package size={15} /></span>
        <div><div style={{ ...display, fontWeight: 600, fontSize: 15, color: INK }}>Print products</div><div style={{ fontSize: 12, color: STONE }}>What clients can order from their gallery. Uncheck to hide a product without deleting it.</div></div>
      </div>
      {list.map((p, i) => (
        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderTop: `1px solid ${LINE}` }}>
          <input type="checkbox" checked={p.active !== false} onChange={(e) => set(i, { active: e.target.checked })} />
          <input value={p.name} onChange={(e) => set(i, { name: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
          <span style={{ ...mono, fontSize: 11, color: FAINT }}>$</span><input type="number" min="0" step="0.5" value={p.price} onChange={(e) => set(i, { price: e.target.value })} style={{ ...inputStyle, width: 90 }} />
        </div>
      ))}
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button onClick={() => setList([...list, { id: "pr_" + Math.random().toString(36).slice(2, 8), name: "", price: 0, active: true }])} style={btnGhost}>Add product</button>
        <button onClick={save} style={{ ...btnSolid, background: RED }}>Save catalog</button>
      </div>
    </div>
  );
}

export function PrintOrdersPanel({ sessionId, showToast }) {
  const [orders, setOrders] = useState(null);
  const load = () => fetch("/api/prints/orders" + (sessionId ? "?sessionId=" + encodeURIComponent(sessionId) : "")).then((r) => r.json()).then((d) => setOrders(d.orders || [])).catch(() => setOrders([]));
  useEffect(() => { load(); }, [sessionId]);
  if (!orders || orders.length === 0) return null;
  async function fulfil(o, v) { await fetch("/api/prints/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ orderId: o.id, fulfilled: v }) }); if (showToast && v) showToast("Marked fulfilled. The client has been emailed."); load(); }
  return (
    <div style={{ background: CREAM, border: `1px solid ${LINE}`, borderRadius: 10, padding: "14px 16px", marginBottom: 18 }}>
      <div style={{ ...mono, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 10, display: "flex", alignItems: "center", gap: 7 }}><Package size={13} /> Print orders</div>
      {orders.map((o) => (
        <div key={o.id} style={{ borderTop: `1px solid ${LINE}`, padding: "10px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, color: INK }}>{!sessionId && o.client ? o.client + " · " : ""}{money(o.total)} <span style={{ ...mono, fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", color: o.fulfilledAt ? OK : o.paid ? WARN : FAINT, marginLeft: 6 }}>{o.fulfilledAt ? "fulfilled" : o.paid ? "paid, to fulfil" : "awaiting payment"}</span></div><div style={{ ...mono, fontSize: 10, color: FAINT, marginTop: 2 }}>Ship to {o.shipping.name}, {o.shipping.address}</div></div>
            {o.paid && (o.fulfilledAt ? <button onClick={() => fulfil(o, false)} style={btnGhost}>Undo</button> : <button onClick={() => fulfil(o, true)} style={{ ...btnSolid, background: OK, padding: "8px 12px" }}><Check size={13} /> Mark fulfilled</button>)}
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            {o.items.map((it, i) => <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, background: PAPER, border: `1px solid ${LINE}`, borderRadius: 8, padding: 5 }}>{it.thumb ? <img src={it.thumb} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 5 }} /> : null}<div style={{ ...mono, fontSize: 10.5, color: INK, paddingRight: 6 }}>{it.qty}× {it.name}</div></div>)}
          </div>
        </div>
      ))}
    </div>
  );
}
