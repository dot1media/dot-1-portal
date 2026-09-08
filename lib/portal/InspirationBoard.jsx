"use client";
import React, { useEffect, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { card, mono, INK, LINE, STONE, FAINT, PAPER, CREAM } from "./theme";

function resize(file, max, q) {
  return new Promise((resolve, reject) => { const img = new Image(); const u = URL.createObjectURL(file); img.onload = () => { const s = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement("canvas"); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s); c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(u); c.toBlob((b) => (b ? resolve(b) : reject(new Error("resize"))), "image/jpeg", q || 0.86); }; img.onerror = () => { URL.revokeObjectURL(u); reject(new Error("read")); }; img.src = u; });
}

export function InspirationBoard({ sessionId, editable, accent, compact }) {
  const [items, setItems] = useState(null);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const load = () => fetch("/api/inspiration?sessionId=" + encodeURIComponent(sessionId)).then((r) => r.json()).then((d) => setItems(d.items || [])).catch(() => setItems([]));
  useEffect(() => { if (sessionId) load(); }, [sessionId]);
  async function onPick(e) {
    const files = Array.from(e.target.files || []).filter((f) => /^image\//.test(f.type)).slice(0, 12); if (e.target) e.target.value = "";
    if (!files.length) return; setErr(""); setBusy("Uploading 0 / " + files.length);
    try {
      const res = await fetch("/api/inspiration/sign", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId, count: files.length }) }).then((x) => x.json());
      if (!res.uploads) throw new Error(res.error || "Could not start the upload.");
      for (let i = 0; i < files.length; i++) { const blob = await resize(files[i], 1600, 0.86); const r = await fetch(res.uploads[i].url, { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: blob }); if (!r.ok) throw new Error("Upload failed."); setBusy("Uploading " + (i + 1) + " / " + files.length); }
      await load();
    } catch (e2) { setErr(e2.message || "Upload failed."); }
    setBusy("");
  }
  async function remove(id) { await fetch("/api/inspiration?sessionId=" + encodeURIComponent(sessionId) + "&id=" + encodeURIComponent(id), { method: "DELETE" }); load(); }
  if (items === null) return null;
  if (!editable && items.length === 0) return null;
  const A = accent || INK;
  return (
    <div style={compact ? { background: CREAM, border: `1px solid ${LINE}`, borderRadius: 10, padding: "14px 16px", marginBottom: 18 } : { ...card, marginTop: 18, padding: "22px 24px" }}>
      <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 5 }}>{editable ? "Inspiration board" : "Client's inspiration board"}</div>
      {editable && <div style={{ fontSize: 12.5, color: STONE, marginBottom: 12 }}>Poses, places, colors, or looks you love. Drop in screenshots and photos; we plan around them.</div>}
      {items.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 8, marginBottom: editable ? 12 : 0 }}>
          {items.map((it) => (
            <div key={it.id} style={{ position: "relative", aspectRatio: "1", borderRadius: 8, overflow: "hidden", background: PAPER, border: `1px solid ${LINE}` }}>
              <a href={it.url} target="_blank" rel="noopener noreferrer"><img src={it.url} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /></a>
              {editable && <button onClick={() => remove(it.id)} aria-label="Remove" style={{ position: "absolute", top: 5, right: 5, width: 24, height: 24, borderRadius: 12, border: "none", background: "rgba(20,18,16,0.7)", color: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><X size={12} /></button>}
            </div>
          ))}
        </div>
      )}
      {editable && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <label style={{ ...mono, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", padding: "11px 16px", borderRadius: 9, cursor: busy ? "default" : "pointer", border: "none", background: busy ? LINE : A, color: busy ? FAINT : "#fff", display: "inline-flex", alignItems: "center", gap: 8 }}><ImagePlus size={14} /> {busy || (items.length ? "Add more" : "Add images")}<input type="file" accept="image/*" multiple disabled={!!busy} style={{ display: "none" }} onChange={onPick} /></label>
          <span style={{ ...mono, fontSize: 10, color: FAINT }}>{items.length}/30 \u00b7 resized before upload, so they're quick</span>
          {err && <span style={{ ...mono, fontSize: 10.5, color: "#b3261e" }}>{err}</span>}
        </div>
      )}
    </div>
  );
}
