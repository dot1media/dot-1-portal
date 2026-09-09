"use client";
import React, { useEffect, useState } from "react";
import { FileSignature } from "lucide-react";
import { card, mono, display, INK, BODY, LINE, STONE, FAINT, PAPER, CREAM, RED, WARN, inputStyle, btnSolid } from "./theme";
import { DOC_META } from "./constants";

export function AgreementVersions({ showToast }) {
  const [data, setData] = useState(null);
  const [edit, setEdit] = useState({});
  const load = () => fetch("/api/agreements/versions").then((r) => r.json()).then((d) => { setData(d); const e = {}; for (const k of Object.keys(d.versions || {})) e[k] = { version: d.versions[k].version, note: d.versions[k].note }; setEdit(e); }).catch(() => {});
  useEffect(() => { load(); }, []);
  async function save(k) { const r = await fetch("/api/agreements/versions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ docType: k, version: edit[k].version, note: edit[k].note }) }).then((x) => x.json()); if (r.ok) { if (showToast) showToast("Version saved. Clients on older versions will be asked to re-sign."); load(); } else if (showToast) showToast(r.error || "Could not save."); }
  if (!data) return null;
  return (
    <div style={{ ...card, padding: "18px 20px", marginTop: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ width: 32, height: 32, borderRadius: 8, background: CREAM, display: "inline-flex", alignItems: "center", justifyContent: "center", color: STONE }}><FileSignature size={15} /></span>
        <div><div style={{ ...display, fontWeight: 600, fontSize: 15, color: INK }}>Agreements</div><div style={{ fontSize: 12, color: STONE }}>When you update a document, bump its version here and say what changed. Clients who signed an older version see a re-sign prompt in their portal; new bookings sign the current one.</div></div>
      </div>
      {Object.keys(data.versions).map((k) => { const o = (data.outstanding || {})[k] || []; return (
        <div key={k} style={{ borderTop: `1px solid ${LINE}`, padding: "12px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ ...mono, fontSize: 11.5, color: INK, minWidth: 220 }}>{(DOC_META[k] || {}).label || k}</div>
            <span style={{ ...mono, fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: STONE }}>Version</span>
            <input value={(edit[k] || {}).version || ""} onChange={(e) => setEdit({ ...edit, [k]: { ...edit[k], version: e.target.value } })} style={{ ...inputStyle, width: 80 }} />
            <input value={(edit[k] || {}).note || ""} onChange={(e) => setEdit({ ...edit, [k]: { ...edit[k], note: e.target.value } })} placeholder="What changed (shown to clients asked to re-sign)" style={{ ...inputStyle, flex: "1 1 260px" }} />
            <button onClick={() => save(k)} style={{ ...btnSolid, background: RED, padding: "9px 14px" }}>Save</button>
          </div>
          {o.length > 0 && <div style={{ ...mono, fontSize: 10.5, color: WARN, marginTop: 8 }}>{o.length} client{o.length === 1 ? "" : "s"} still on an older version: {o.slice(0, 6).map((x) => x.name || x.email).join(", ")}{o.length > 6 ? ", …" : ""}</div>}
        </div>
      ); })}
    </div>
  );
}
