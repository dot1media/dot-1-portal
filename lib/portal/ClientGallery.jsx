"use client";
import React, { useEffect, useState, useCallback } from "react";
import { Heart, Download, X, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { mono, display, INK, BODY, LINE, STONE, FAINT, CREAM } from "./theme";

const A = "#4a90d9";
const RELEASE_OPTS = [
  { key: "portfolio", label: "Portfolio & website", desc: "Feature these images in Dot One's portfolio and on their website." },
  { key: "social", label: "Social media", desc: "Share these images on Instagram and Facebook." },
  { key: "advertising", label: "Advertising & print", desc: "Use these images in ads, printed materials, and paid promotion." },
];

export function ClientGallery({ sessionId }) {
  const [g, setG] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(-1);
  const [proofUrl, setProofUrl] = useState("");
  const [busyFav, setBusyFav] = useState("");
  const [limitMsg, setLimitMsg] = useState("");
  const [dl, setDl] = useState(false);
  const [requested, setRequested] = useState(false);
  const [release, setRelease] = useState(null);

  const selectedCount = photos.filter((p) => p.favorite).length;
  const included = g && g.included != null ? g.included : null;
  const atLimit = included != null && selectedCount >= included;

  const load = useCallback(async () => {
    try { const r = await fetch("/api/gallery?sessionId=" + encodeURIComponent(sessionId)).then((x) => x.json()); setG(r.gallery); setPhotos(r.photos || []); setRelease(r.gallery && r.gallery.release ? r.gallery.release : { portfolio: true, social: true, advertising: true }); } catch (e) {}
    setLoading(false);
  }, [sessionId]);
  useEffect(() => { if (sessionId) load(); }, [sessionId, load]);

  async function toggle(photo) {
    if (busyFav) return;
    const willSelect = !photo.favorite;
    if (willSelect && atLimit) { setLimitMsg("You've selected all " + included + " of your included photos. Unselect one, or ask us to add more below."); return; }
    setBusyFav(photo.id); setLimitMsg("");
    try {
      const r = await fetch("/api/gallery/favorite", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ photoId: photo.id, favorite: willSelect }) }).then((x) => x.json());
      if (r.limit) setLimitMsg(r.error);
      else if (r.ok) setPhotos((ps) => ps.map((p) => p.id === photo.id ? { ...p, favorite: r.favorite } : p));
    } catch (e) {}
    setBusyFav("");
  }
  async function openLightbox(i) {
    setLightbox(i); setProofUrl("");
    try { const r = await fetch("/api/gallery/asset?size=proof&photoId=" + photos[i].id).then((x) => x.json()); setProofUrl(r.url || ""); } catch (e) {}
  }
  const nav = useCallback((d) => { const n = lightbox + d; if (n >= 0 && n < photos.length) { setLightbox(n); setProofUrl(""); fetch("/api/gallery/asset?size=proof&photoId=" + photos[n].id).then((x) => x.json()).then((r) => setProofUrl(r.url || "")).catch(() => {}); } }, [lightbox, photos]);
  useEffect(() => {
    if (lightbox < 0) return;
    const h = (e) => { if (e.key === "Escape") setLightbox(-1); if (e.key === "ArrowRight") nav(1); if (e.key === "ArrowLeft") nav(-1); };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [lightbox, nav]);

  async function downloadOne(photoId, filename) {
    try { const r = await fetch("/api/gallery/asset?size=download&photoId=" + photoId).then((x) => x.json()); if (r.url) { const a = document.createElement("a"); a.href = r.url; a.download = filename || "photo.jpg"; document.body.appendChild(a); a.click(); a.remove(); } } catch (e) {}
  }
  async function downloadSelected() {
    const sel = photos.filter((p) => p.favorite); if (!sel.length || dl) return;
    setDl(true);
    try {
      const JSZip = (await import("jszip")).default; const zip = new JSZip();
      for (const p of sel) { const r = await fetch("/api/gallery/asset?size=download&photoId=" + p.id).then((x) => x.json()); if (r.url) { const blob = await fetch(r.url).then((x) => x.blob()); zip.file(p.filename || (p.id + ".jpg"), blob); } }
      const out = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a"); a.href = URL.createObjectURL(out); a.download = ((g && g.title) ? g.title.replace(/[^a-z0-9]+/gi, "-") : "gallery") + ".zip"; document.body.appendChild(a); a.click(); a.remove();
    } catch (e) {}
    setDl(false);
  }
  async function requestMore() { try { await fetch("/api/gallery/request-more", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ galleryId: g.id }) }); setRequested(true); } catch (e) {} }

  async function toggleRelease(key) {
    const next = { ...(release || {}), [key]: !(release && release[key]) };
    setRelease(next);
    try { await fetch("/api/gallery/release", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ galleryId: g.id, release: next }) }); } catch (e) {}
  }

  if (loading || !g || !photos.length) return null;

  return (
    <div style={{ marginTop: 6, marginBottom: 30 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 14, marginBottom: 18 }}>
        <div>
          <div style={{ ...display, fontWeight: 700, fontSize: 26, color: INK, lineHeight: 1.1 }}>{g.title || "Your gallery"}</div>
          <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: STONE, marginTop: 6 }}>{included != null ? "Select up to " + included + " to download" : "Heart your favorites, then download"}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {included != null && <div style={{ ...mono, fontSize: 13, color: atLimit ? A : STONE }}>{selectedCount} / {included}</div>}
          <button onClick={downloadSelected} disabled={dl || !selectedCount} style={{ ...mono, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", padding: "11px 18px", borderRadius: 9, cursor: selectedCount ? "pointer" : "default", border: "none", background: selectedCount ? A : LINE, color: selectedCount ? "#fff" : FAINT, display: "inline-flex", alignItems: "center", gap: 8 }}><Download size={14} /> {dl ? "Preparing…" : "Download selected"}</button>
        </div>
      </div>
      {limitMsg && <div style={{ background: "#fff6f5", border: "1px solid #f2cdc9", borderRadius: 9, padding: "11px 14px", marginBottom: 16, fontSize: 12.5, color: "#b3261e", lineHeight: 1.5 }}>{limitMsg}</div>}
      <div style={{ columnGap: 8, columnWidth: 210 }}>
        {photos.map((p, i) => (
          <div key={p.id} style={{ breakInside: "avoid", marginBottom: 8, position: "relative", borderRadius: 7, overflow: "hidden", background: CREAM }}>
            <img src={p.thumb} alt="" loading="lazy" onClick={() => openLightbox(i)} style={{ width: "100%", display: "block", cursor: "pointer" }} />
            <button onClick={(e) => { e.stopPropagation(); toggle(p); }} aria-label={p.favorite ? "Unselect" : "Select"} style={{ position: "absolute", top: 9, right: 9, width: 36, height: 36, borderRadius: "50%", border: "none", cursor: "pointer", background: p.favorite ? A : "rgba(20,20,24,0.4)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Heart size={18} fill={p.favorite ? "#fff" : "none"} /></button>
          </div>
        ))}
      </div>
      {included != null && atLimit && (
        <div style={{ marginTop: 22, background: CREAM, border: `1px solid ${LINE}`, borderRadius: 12, padding: "20px", textAlign: "center" }}>
          <div style={{ ...display, fontWeight: 600, fontSize: 18, color: INK, marginBottom: 6 }}>Want more than {included}?</div>
          <div style={{ fontSize: 13, color: STONE, lineHeight: 1.55, marginBottom: 15, maxWidth: 420, marginLeft: "auto", marginRight: "auto" }}>Your package includes {included} images. If you love more of them, we can add the extras to your gallery.</div>
          {requested ? <div style={{ ...mono, fontSize: 12, color: A }}>Request sent. We'll be in touch shortly.</div>
            : <button onClick={requestMore} style={{ ...mono, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", padding: "12px 22px", borderRadius: 9, cursor: "pointer", border: `1px solid ${A}`, background: "#fff", color: A }}>Request additional images</button>}
        </div>
      )}
      <div style={{ marginTop: 26, background: CREAM, border: `1px solid ${LINE}`, borderRadius: 12, padding: "18px 20px" }}>
        <div style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: STONE, marginBottom: 6 }}>Image usage &amp; model release</div>
        <div style={{ fontSize: 13, color: BODY, lineHeight: 1.55, marginBottom: 12 }}>You choose how we may share your images. Adjust these any time, and we'll honor your latest choice.</div>
        {RELEASE_OPTS.map((o) => { const on = !!(release && release[o.key]); return (
          <div key={o.key} onClick={() => toggleRelease(o.key)} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "11px 0", cursor: "pointer", borderTop: `1px solid ${LINE}` }}>
            <span style={{ width: 22, height: 22, borderRadius: 6, border: `1.5px solid ${on ? A : LINE}`, background: on ? A : "#fff", flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>{on ? <Check size={14} color="#fff" /> : null}</span>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, color: INK, fontWeight: 500 }}>{o.label}</div><div style={{ fontSize: 12.5, color: STONE, lineHeight: 1.5, marginTop: 2 }}>{o.desc}</div></div>
          </div>
        ); })}
      </div>
      {lightbox >= 0 && (
        <div onClick={() => setLightbox(-1)} style={{ position: "fixed", inset: 0, background: "rgba(14,14,16,0.95)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
          <button onClick={() => setLightbox(-1)} style={{ position: "absolute", top: 16, right: 16, width: 44, height: 44, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.12)", color: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><X size={22} /></button>
          {lightbox > 0 && <button onClick={(e) => { e.stopPropagation(); nav(-1); }} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 46, height: 46, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.12)", color: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><ChevronLeft size={24} /></button>}
          {lightbox < photos.length - 1 && <button onClick={(e) => { e.stopPropagation(); nav(1); }} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 46, height: 46, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.12)", color: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><ChevronRight size={24} /></button>}
          <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            {proofUrl ? <img src={proofUrl} alt="" style={{ maxWidth: "92vw", maxHeight: "78vh", objectFit: "contain", borderRadius: 3 }} /> : <div style={{ color: "#fff", ...mono, fontSize: 12 }}>Loading…</div>}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => toggle(photos[lightbox])} style={{ ...mono, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", padding: "11px 18px", borderRadius: 9, cursor: "pointer", border: "none", background: photos[lightbox].favorite ? A : "rgba(255,255,255,0.14)", color: "#fff", display: "inline-flex", alignItems: "center", gap: 8 }}><Heart size={15} fill={photos[lightbox].favorite ? "#fff" : "none"} /> {photos[lightbox].favorite ? "Selected" : "Select"}</button>
              {photos[lightbox].favorite && <button onClick={() => downloadOne(photos[lightbox].id, photos[lightbox].filename)} style={{ ...mono, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", padding: "11px 18px", borderRadius: 9, cursor: "pointer", border: "none", background: "#fff", color: INK, display: "inline-flex", alignItems: "center", gap: 8 }}><Download size={15} /> Download</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
