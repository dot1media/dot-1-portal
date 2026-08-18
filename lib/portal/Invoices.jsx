import React, { useEffect, useMemo, useState } from "react";
import { X, FileText, Plus, Trash2, Send, Eye, RefreshCw, Copy, ChevronLeft, Download } from "lucide-react";
import { INK, BODY, STONE, FAINT, LINE, PAPER, CREAM, RED, OK, mono, display, card, inputStyle, btnSolid } from "./theme";
import { GROUPS } from "./groups";

const fmt = (n) => "$" + (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function InvoicePreview({ inv }) {
  const total = inv.items.reduce((s, it) => s + (Number(it.price) || 0), 0);
  const retainer = Math.round(total * 50) / 100;
  return (
    <div style={{ background: "#fff", border: `1px solid ${LINE}`, borderRadius: 10, padding: "26px 28px", fontSize: 13 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: `2px solid ${RED}`, paddingBottom: 16, marginBottom: 18 }}>
        <img src="/dot1-logo.png" alt="Dot One Media" style={{ height: 40 }} />
        <div style={{ textAlign: "right" }}>
          <div style={{ ...display, fontSize: 19, fontWeight: 700, color: INK }}>INVOICE</div>
          <div style={{ ...mono, fontSize: 10, color: STONE, marginTop: 3 }}>{inv.no || "Draft"}</div>
          <div style={{ ...mono, fontSize: 9.5, color: FAINT, marginTop: 2 }}>{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 18 }}>
        <div>
          <div style={{ ...mono, fontSize: 8.5, letterSpacing: "0.12em", color: FAINT, marginBottom: 6 }}>BILLED TO</div>
          <div style={{ fontWeight: 600, color: INK }}>{inv.name || "Client name"}</div>
          <div style={{ color: BODY, fontSize: 12, marginTop: 2 }}>{inv.email || "email"}</div>
          {inv.phone ? <div style={{ color: BODY, fontSize: 12 }}>{inv.phone}</div> : null}
        </div>
        <div>
          <div style={{ ...mono, fontSize: 8.5, letterSpacing: "0.12em", color: FAINT, marginBottom: 6 }}>SESSION</div>
          <div style={{ fontWeight: 600, color: INK }}>{inv.serviceName || "Service"}</div>
          <div style={{ color: BODY, fontSize: 12, marginTop: 2 }}>{inv.date || "date"}{inv.time ? " at " + inv.time : ""}</div>
        </div>
      </div>
      <div style={{ borderTop: `1.5px solid ${INK}` }}>
        {inv.items.map((it, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${LINE}` }}>
            <span style={{ color: BODY }}>{it.label}</span><span style={{ color: INK }}>{fmt(it.price)}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 22, padding: "10px 0 4px", color: STONE, fontSize: 12.5 }}>Total&nbsp;&nbsp;<span style={{ color: INK }}>{fmt(total)}</span></div>
      <div style={{ marginLeft: "auto", maxWidth: 250, background: "#faf3ef", borderLeft: `3px solid ${RED}`, padding: "9px 12px", marginTop: 4 }}>
        <div style={{ ...mono, fontSize: 8.5, letterSpacing: "0.1em", color: RED }}>RETAINER DUE NOW (50%)</div>
        <div style={{ fontSize: 17, fontWeight: 700, color: INK, marginTop: 2 }}>{fmt(retainer)}</div>
      </div>
      <div style={{ fontSize: 11, color: STONE, marginTop: 10 }}>Remaining balance of {fmt(total - retainer)} is due per your service agreement.</div>
      {inv.notes ? <div style={{ marginTop: 12, fontSize: 12, color: BODY, borderTop: `1px solid ${LINE}`, paddingTop: 10, whiteSpace: "pre-wrap" }}>{inv.notes}</div> : null}
      <div style={{ ...mono, fontSize: 9, color: FAINT, textAlign: "center", borderTop: `1px solid ${LINE}`, marginTop: 16, paddingTop: 10 }}>Dot One Media · Create with purpose · dot1.media · Wasilla, Alaska · Veteran-Owned</div>
    </div>
  );
}

export function InvoiceArchive({ showToast }) {
  const [list, setList] = useState(null);
  const load = async () => { try { const d = await fetch("/api/invoices").then((r) => r.json()); setList(d.invoices || []); } catch (e) { setList([]); } };
  useEffect(() => { load(); }, []);
  const resend = async (inv) => {
    try { const r = await fetch("/api/invoices/" + inv.token, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "resend" }) }); if (!r.ok) throw new Error(); showToast("Invoice " + inv.no + " re-sent to " + (inv.client && inv.client.email) + "."); } catch (e) { showToast("Could not resend."); }
  };
  const removeInv = async (inv) => {
    if (!window.confirm("Delete invoice " + inv.no + " from the archive? The booked session is kept.")) return;
    try { const r = await fetch("/api/invoices/" + inv.token, { method: "DELETE" }); if (!r.ok) throw new Error(); setList((p) => (p || []).filter((x) => x.token !== inv.token)); } catch (e) { showToast("Could not delete."); }
  };
  const copyLink = async (inv) => { try { await navigator.clipboard.writeText(inv.payUrl || ""); showToast("Payment link copied."); } catch (e) { showToast("Could not copy the link."); } };
  const download = (inv) => { try { window.open("/api/invoices/" + encodeURIComponent(inv.token) + "/pdf", "_blank"); } catch (e) {} };
  return (
    <div>
      {list === null && <div style={{ ...mono, fontSize: 11, color: FAINT, padding: 20, textAlign: "center" }}>Loading&hellip;</div>}
      {list && list.length === 0 && <div style={{ ...mono, fontSize: 11, color: FAINT, padding: 20, textAlign: "center" }}>No invoices sent yet. Create one from the Sessions tab.</div>}
      {(list || []).map((inv) => (
        <div key={inv.token} style={{ border: `1px solid ${LINE}`, borderRadius: 9, padding: "12px 14px", marginBottom: 10, background: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 6 }}>
            <div>
              <span style={{ fontWeight: 600, color: INK, fontSize: 14 }}>{inv.no}</span>
              <span style={{ ...mono, fontSize: 8.5, letterSpacing: "0.08em", textTransform: "uppercase", padding: "3px 7px", borderRadius: 5, marginLeft: 8, background: inv.status === "paid" ? "#eaf5ec" : CREAM, color: inv.status === "paid" ? OK : STONE, border: `1px solid ${inv.status === "paid" ? "#cfe6d4" : LINE}` }}>{inv.status === "paid" ? "Paid" : "Sent"}</span>
              <span style={{ ...mono, fontSize: 10.5, color: STONE, marginLeft: 9 }}>{inv.client && inv.client.name}</span>
            </div>
            <span style={{ ...mono, fontSize: 10, color: STONE }}>{fmt((inv.totalCents || 0) / 100)} · retainer {fmt((inv.retainerCents || 0) / 100)}</span>
          </div>
          <div style={{ ...mono, fontSize: 10, color: FAINT, marginTop: 3 }}>{inv.service && inv.service.name} · {inv.service && inv.service.date} at {inv.service && inv.service.time}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 9, flexWrap: "wrap" }}>
            <button onClick={() => download(inv)} style={miniBtn}><Download size={12} /> Download PDF</button>
            <button onClick={() => resend(inv)} style={miniBtn}><RefreshCw size={12} /> Resend email</button>
            {inv.payUrl ? <button onClick={() => copyLink(inv)} style={miniBtn}><Copy size={12} /> Payment link</button> : null}
            <button onClick={() => removeInv(inv)} style={{ ...miniBtn, color: RED, borderColor: "#f0d4cf" }}><Trash2 size={12} /> Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function InvoiceModal({ state, showToast, onClose, onSessionsRefresh }) {
  const [tab, setTab] = useState("new"); // new | saved
  const [preview, setPreview] = useState(false);
  const [sending, setSending] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [group, setGroup] = useState("video");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [addonQty, setAddonQty] = useState({});
  const [custom, setCustom] = useState([]);
  const [cLabel, setCLabel] = useState("");
  const [cPrice, setCPrice] = useState("");
  const [notes, setNotes] = useState("");

  const services = (state.services || []).filter((s) => s.group === group && s.visible !== false);
  const svc = services.find((s) => s.id === serviceId) || null;
  const addons = (state.addons || []).filter((a) => a.group === group && a.visible !== false);

  useEffect(() => { if (services.length && !services.find((s) => s.id === serviceId)) setServiceId(services[0].id); }, [group, state.services]);

  const items = useMemo(() => {
    const arr = [];
    if (svc) arr.push({ label: svc.name + " (session)", price: Number(svc.price) || 0 });
    Object.keys(addonQty).forEach((id) => { const q = addonQty[id] || 0; if (!q) return; const a = addons.find((x) => x.id === id); if (a) arr.push({ label: a.name + " (add-on" + (q > 1 ? " x" + q : "") + ")", price: (Number(a.price) || 0) * q }); });
    custom.forEach((c) => arr.push({ label: c.label, price: Number(c.price) || 0 }));
    return arr;
  }, [svc, addonQty, custom, addons]);
  const total = items.reduce((s, it) => s + it.price, 0);
  const retainer = Math.round(total * 50) / 100;


  const send = async () => {
    if (!name.trim() || !email.trim() || !svc || !date || !time) { showToast("Name, email, service, date, and time are required."); return; }
    setSending(true);
    try {
      const res = await fetch("/api/invoices", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, email, phone, serviceId: svc.id, date, time, addons: Object.entries(addonQty).filter(([, q]) => q > 0).map(([id, q]) => ({ id, qty: q })), custom, notes }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { showToast(d.error || "Could not send the invoice."); setSending(false); return; }
      showToast("Invoice " + (d.invoice && d.invoice.no ? d.invoice.no : "") + " sent to " + name + " with the payment link and PDF.");
      onSessionsRefresh && onSessionsRefresh();
      setTab("saved");
      setName(""); setEmail(""); setPhone(""); setAddonQty({}); setCustom([]); setNotes(""); setDate(""); setTime(""); setPreview(false);
    } catch (e) { showToast("Could not send the invoice."); }
    setSending(false);
  };

  const invDraft = { no: "", name, email, phone, serviceName: svc ? svc.name : "", date, time, items, notes };
  const lbl = { ...mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: STONE, display: "block", margin: "12px 0 6px" };

  return (
    <div className="d1-overlay" style={{ position: "fixed", inset: 0, background: "rgba(20,20,26,0.55)", zIndex: 60, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "34px 16px", overflowY: "auto" }} onClick={onClose}>
      <div className="d1-modal" style={{ ...card, width: 560, maxWidth: "100%", padding: "22px 24px" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <FileText size={17} style={{ color: RED }} />
            <h3 style={{ ...display, fontSize: 19, fontWeight: 700, color: INK, margin: 0 }}>Invoices</h3>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: STONE }}><X size={18} /></button>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {[["new", "New invoice"], ["saved", "Sent invoices"]].map(([k, t]) => (
            <button key={k} onClick={() => { setTab(k); setPreview(false); }} style={{ ...mono, fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", padding: "8px 13px", borderRadius: 7, cursor: "pointer", border: `1px solid ${tab === k ? RED : LINE}`, background: tab === k ? RED : PAPER, color: tab === k ? "#fff" : STONE }}>{t}</button>
          ))}
        </div>

        {tab === "new" && !preview && (
          <div>
            <label style={lbl}>Client full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="First and last name" style={{ ...inputStyle, marginBottom: 0 }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div><label style={lbl}>Email</label><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@email.com" style={{ ...inputStyle, marginBottom: 0 }} /></div>
              <div><label style={lbl}>Phone</label><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(907) 555-0100" style={{ ...inputStyle, marginBottom: 0 }} /></div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={lbl}>Service line</label>
                <select value={group} onChange={(e) => { setGroup(e.target.value); setAddonQty({}); }} style={{ ...inputStyle, marginBottom: 0 }}>
                  {Object.keys(GROUPS).map((g) => <option key={g} value={g}>{GROUPS[g].label}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Session type</label>
                <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} style={{ ...inputStyle, marginBottom: 0 }}>
                  {services.map((s) => <option key={s.id} value={s.id}>{s.name} ({fmt(s.price)})</option>)}
                  {!services.length && <option value="">No services in this line</option>}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div><label style={lbl}>Session date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} /></div>
              <div><label style={lbl}>Start time</label><input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} /></div>
            </div>
            {addons.length > 0 && (<div>
              <label style={lbl}>Add-ons</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {addons.map((a) => {
                  const q = addonQty[a.id] || 0;
                  const setQ = (n) => setAddonQty((p) => { const nx = { ...p }; if (n <= 0) delete nx[a.id]; else nx[a.id] = Math.min(20, n); return nx; });
                  if (!q) return <button key={a.id} onClick={() => setQ(1)} style={{ ...mono, fontSize: 10, padding: "7px 11px", borderRadius: 7, cursor: "pointer", border: `1px solid ${LINE}`, background: "#fff", color: STONE }}>{a.name} · {fmt(a.price)}</button>;
                  return (
                    <div key={a.id} style={{ display: "inline-flex", alignItems: "center", gap: 7, ...mono, fontSize: 10, padding: "4px 7px 4px 11px", borderRadius: 7, border: `1px solid ${RED}`, background: "#fdf1ee", color: RED }}>
                      <span>{a.name} · {fmt(a.price)}</span>
                      <span style={{ display: "inline-flex", alignItems: "center", borderLeft: "1px solid #f0d4cf", paddingLeft: 6, gap: 2 }}>
                        <button onClick={() => setQ(q - 1)} aria-label={"Fewer " + a.name} style={qtyBtn}>{"\u2212"}</button>
                        <span style={{ minWidth: 24, textAlign: "center", color: INK, fontWeight: 600 }}>x{q}</span>
                        <button onClick={() => setQ(q + 1)} aria-label={"More " + a.name} style={qtyBtn}>+</button>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>)}
            <label style={lbl}>Custom line items</label>
            {custom.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 12.5, color: BODY }}>
                <span style={{ flex: 1 }}>{c.label}</span><span>{fmt(c.price)}</span>
                <button onClick={() => setCustom((p) => p.filter((_, j) => j !== i))} style={{ background: "transparent", border: "none", cursor: "pointer", color: RED }}><Trash2 size={13} /></button>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8 }}>
              <input value={cLabel} onChange={(e) => setCLabel(e.target.value)} placeholder="Custom request (e.g. Drone coverage, extra hour)" style={{ ...inputStyle, marginBottom: 0, flex: 2 }} />
              <input value={cPrice} onChange={(e) => setCPrice(e.target.value)} placeholder="$" inputMode="decimal" style={{ ...inputStyle, marginBottom: 0, width: 90 }} />
              <button onClick={() => { const p = parseFloat(cPrice); if (!cLabel.trim() || !(p >= 0)) { showToast("Add a label and a price for the custom item."); return; } setCustom((x) => [...x, { label: cLabel.trim(), price: p }]); setCLabel(""); setCPrice(""); }} style={{ ...btnSolid, background: INK, padding: "9px 12px" }}><Plus size={14} /></button>
            </div>
            <label style={lbl}>Notes on the invoice (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Anything the client should know" style={{ ...inputStyle, marginBottom: 0, resize: "vertical" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: CREAM, border: `1px solid ${LINE}`, borderRadius: 9, padding: "12px 14px", margin: "16px 0 14px" }}>
              <div style={{ ...mono, fontSize: 10.5, color: STONE }}>TOTAL {fmt(total)}</div>
              <div style={{ textAlign: "right" }}>
                <div style={{ ...mono, fontSize: 9, letterSpacing: "0.1em", color: RED }}>RETAINER DUE (50%)</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: INK }}>{fmt(retainer)}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setPreview(true)} disabled={!items.length} style={{ ...btnSolid, background: "#fff", color: INK, border: `1px solid ${LINE}`, flex: 1, justifyContent: "center" }}><Eye size={14} /> Preview</button>
              <button onClick={send} disabled={sending} style={{ ...btnSolid, background: RED, flex: 2, justifyContent: "center" }}><Send size={14} /> {sending ? "Sending\u2026" : "Send invoice & payment link"}</button>
            </div>
            <p style={{ ...mono, fontSize: 9.5, color: FAINT, margin: "10px 0 0", lineHeight: 1.5 }}>Sending books the session for the chosen date, emails the client this invoice as a PDF, and includes a secure Square link for the 50% retainer. Paying drops them into the portal to create their account.</p>
          </div>
        )}

        {tab === "new" && preview && (
          <div>
            <button onClick={() => setPreview(false)} style={{ ...mono, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: "none", cursor: "pointer", color: STONE, padding: 0, marginBottom: 12 }}><ChevronLeft size={13} /> Back to editing</button>
            <InvoicePreview inv={invDraft} />
            <button onClick={send} disabled={sending} style={{ ...btnSolid, background: RED, width: "100%", justifyContent: "center", marginTop: 14 }}><Send size={14} /> {sending ? "Sending\u2026" : "Looks right, send it"}</button>
          </div>
        )}

        {tab === "saved" && <InvoiceArchive showToast={showToast} />}
      </div>
    </div>
  );
}

const qtyBtn = { width: 20, height: 20, borderRadius: 5, border: "1px solid #f0d4cf", background: "#fff", color: "#e23b2e", cursor: "pointer", fontSize: 12, lineHeight: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: 0 };
const miniBtn = { display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.04em", padding: "7px 10px", borderRadius: 7, border: "1px solid #e2ded4", background: "#fbf8f2", color: "#6f6d65", cursor: "pointer" };
