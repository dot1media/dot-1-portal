"use client";
import React, { useEffect, useState } from "react";
import { Image as ImageIcon, Upload } from "lucide-react";
import { mono, INK, LINE, STONE, CREAM, RED, btnSolid } from "./theme";

function resize(file, max, q) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => { const img = new Image(); img.onload = () => {
      let w = img.width, h = img.height;
      if (w >= h) { if (w > max) { h = Math.round(h * max / w); w = max; } } else { if (h > max) { w = Math.round(w * max / h); h = max; } }
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      const ctx = c.getContext("2d"); ctx.drawImage(img, 0, 0, w, h);
      c.toBlob((b) => b ? resolve(b) : reject(new Error("resize")), "image/jpeg", q || 0.85);
    }; img.onerror = () => reject(new Error("load")); img.src = r.result; };
    r.onerror = () => reject(new Error("read")); r.readAsDataURL(file);
  });
}

export function GalleryUploader({ sessionId, showToast }) {
  const [count, setCount] = useState(null);
  const [gid, setGid] = useState("");
  const [included, setIncluded] = useState("");
  const [busy, setBusy] = useState(false);
  const [prog, setProg] = useState({ done: 0, total: 0 });
  const [err, setErr] = useState("");

  const load = async () => { try { const r = await fetch("/api/gallery?sessionId=" + encodeURIComponent(sessionId)).then((x) => x.json()); setCount(r.gallery ? r.gallery.count : 0); if (r.gallery) { setGid(r.gallery.id); setIncluded(r.gallery.included == null ? "" : String(r.gallery.included)); } } catch (e) { setCount(0); } };
  useEffect(() => { if (sessionId) load(); }, [sessionId]);

  async function saveIncluded(v) { const gg = gid; if (!gg) return; try { await fetch("/api/gallery/settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ galleryId: gg, included: v === "" ? null : v }) }); } catch (e) {} }

  async function deleteGallery() {
    if (!gid || !window.confirm("Delete this whole gallery and all its photos from storage? This cannot be undone.")) return;
    try { await fetch("/api/gallery?galleryId=" + gid, { method: "DELETE" }); setCount(0); setGid(""); setIncluded(""); if (showToast) showToast("Gallery deleted."); } catch (e) {}
  }

  async function onPick(e) {
    const files = Array.from(e.target.files || []); if (e.target) e.target.value = "";
    if (!files.length) return;
    setBusy(true); setErr(""); setProg({ done: 0, total: files.length });
    try {
      const meta = files.map((f) => ({ name: f.name, type: f.type }));
      const res = await fetch("/api/gallery/sign-upload", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId, files: meta, included: included !== "" ? included : undefined }) }).then((x) => x.json());
      if (!res.galleryId) throw new Error(res.error || "Could not start the upload.");
      const done = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i], u = res.uploads[i];
        const thumb = await resize(f, 400, 0.82), proof = await resize(f, 2048, 0.92);
        await fetch(u.thumbUrl, { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: thumb });
        await fetch(u.proofUrl, { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: proof });
        await fetch(u.fullUrl, { method: "PUT", headers: { "Content-Type": f.type || "image/jpeg" }, body: f });
        done.push({ id: u.id, name: u.name });
        setProg({ done: i + 1, total: files.length });
      }
      await fetch("/api/gallery/finalize", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ galleryId: res.galleryId, photos: done }) });
      if (showToast) showToast(files.length + " photo" + (files.length === 1 ? "" : "s") + " uploaded.");
      await load();
    } catch (e2) { setErr(e2.message || "Upload failed. Please try again."); }
    setBusy(false); setProg({ done: 0, total: 0 });
  }

  return (
    <div style={{ background: CREAM, border: `1px solid ${LINE}`, borderRadius: 10, padding: "16px 18px", marginBottom: 18 }}>
      <div style={{ ...mono, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}><ImageIcon size={13} /> Client photo gallery</div>
      {count !== null && count > 0 ? <div style={{ fontSize: 13, color: INK, marginBottom: 12 }}>{count} photo{count === 1 ? "" : "s"} in this gallery. Your client can view, favorite, and download them in their portal.</div>
        : <div style={{ fontSize: 12.5, color: STONE, marginBottom: 12, lineHeight: 1.5 }}>Upload the client's photos here. They review, favorite, and download them right in their portal, no third-party gallery needed.</div>}
      {busy ? (
        <div style={{ ...mono, fontSize: 12, color: RED }}>Uploading {prog.done} / {prog.total}… please keep this open.</div>
      ) : (
        <label style={{ ...btnSolid, background: RED, cursor: "pointer", display: "inline-flex" }}><Upload size={14} /> {count > 0 ? "Add more photos" : "Upload photos"}<input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={onPick} /></label>
      )}
      {(count !== null && count > 0) ? <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 14 }}><span style={{ ...mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: STONE }}>Images included</span><input value={included} onChange={(e) => setIncluded(e.target.value.replace(/[^0-9]/g, ""))} onBlur={(e) => saveIncluded(e.target.value)} placeholder="all" inputMode="numeric" style={{ width: 64, border: `1px solid ${LINE}`, borderRadius: 7, padding: "7px 9px", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: INK, background: "#fff" }} /><span style={{ fontSize: 11, color: STONE }}>the client can select this many to download</span></div> : null}
      {err && <div style={{ ...mono, fontSize: 10.5, color: "#b3261e", marginTop: 8, lineHeight: 1.5 }}>{err}</div>}
      <div style={{ ...mono, fontSize: 9.5, color: STONE, marginTop: 13, lineHeight: 1.55, opacity: 0.85 }}>Prefer CloudSpot or another gallery? Skip this and paste your link under Delivery &amp; review links below. The client sees whichever you use, or both.</div>
      {(count !== null && count > 0 && gid) ? <button onClick={deleteGallery} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 11, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: "#b3261e", textDecoration: "underline" }}>Delete this gallery and all its photos</button> : null}
    </div>
  );
}
