"use client";
import { money } from "./format";
import React, { useEffect, useState, useCallback } from "react";
import { Heart, Download, X, ChevronLeft, ChevronRight, Check, Share2, ShoppingBag, Plus, Minus } from "lucide-react";
import { mono, display, INK, BODY, LINE, STONE, FAINT, PAPER, CREAM } from "./theme";

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
  const [shareLink, setShareLink] = useState("");
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [ship, setShip] = useState({ name: "", address: "" });
  const [ordering, setOrdering] = useState(false);
  const [orderErr, setOrderErr] = useState("");
  useEffect(() => { fetch("/api/prints/products").then((r) => r.json()).then((d) => setProducts((d.products || []).filter((x) => x.active !== false))).catch(() => {}); }, []);
  const addToCart = (photoId, productId) => { setCart((c) => { const i = c.findIndex((x) => x.photoId === photoId && x.productId === productId); if (i >= 0) return c.map((x, j) => (j === i ? { ...x, qty: x.qty + 1 } : x)); return [...c, { photoId, productId, qty: 1 }]; }); setCartOpen(true); };
  const bump = (i, d) => setCart((c) => c.map((x, j) => (j === i ? { ...x, qty: Math.max(0, x.qty + d) } : x)).filter((x) => x.qty > 0));
  const cartTotal = cart.reduce((a, x) => { const p = products.find((y) => y.id === x.productId); return a + (p ? p.price * x.qty : 0); }, 0);
  async function placeOrder() {
    setOrdering(true); setOrderErr("");
    try { const r = await fetch("/api/prints/order", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId, galleryId: g.id, items: cart, shipping: ship }) }).then((x) => x.json()); if (r.url) { window.location.href = r.url; return; } setOrderErr(r.error || "Could not place the order."); } catch (e) { setOrderErr("Network error."); }
    setOrdering(false);
  }
  const [shareCopied, setShareCopied] = useState(false);
  async function sharePicks() {
    try { const r = await fetch("/api/gallery/share", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ galleryId: g.id }) }).then((x) => x.json()); if (r.link) { setShareLink(r.link); try { await navigator.clipboard.writeText(r.link); setShareCopied(true); setTimeout(() => setShareCopied(false), 1800); } catch (e) {} } } catch (e) {}
  }
  async function stopSharing() { try { await fetch("/api/gallery/share?galleryId=" + encodeURIComponent(g.id), { method: "DELETE" }); setShareLink(""); } catch (e) {} }
  const [releaseLocked, setReleaseLocked] = useState(false);
  const [savingRelease, setSavingRelease] = useState(false);

  const selectedCount = photos.filter((p) => p.favorite).length;
  const included = g && g.included != null ? g.included : null;
  const atLimit = included != null && selectedCount >= included;

  const load = useCallback(async () => {
    try { const r = await fetch("/api/gallery?sessionId=" + encodeURIComponent(sessionId)).then((x) => x.json()); setG(r.gallery); setPhotos(r.photos || []); setRelease(r.gallery && r.gallery.release ? r.gallery.release : { portfolio: true, social: true, advertising: true }); setReleaseLocked(!!(r.gallery && r.gallery.releaseLocked)); } catch (e) {}
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
  const [dlParts, setDlParts] = useState(null);
  function downloadSelected() {
    const sel = photos.filter((p) => p.favorite); if (!sel.length) return;
    const size = 20; const parts = [];
    for (let i = 0; i < sel.length; i += size) parts.push(sel.slice(i, i + size).map((p) => p.id));
    const urlFor = (ids, part) => "/api/gallery/download?galleryId=" + encodeURIComponent(g.id) + "&ids=" + encodeURIComponent(ids.join(",")) + (parts.length > 1 ? "&part=" + part : "");
    if (parts.length === 1) { setDl(true); window.location.href = urlFor(parts[0], 1); setTimeout(() => setDl(false), 4000); return; }
    setDlParts(parts.map((ids, i) => ({ n: i + 1, count: ids.length, url: urlFor(ids, i + 1) })));
  }
  async function requestMore() { try { await fetch("/api/gallery/request-more", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ galleryId: g.id }) }); setRequested(true); } catch (e) {} }

  function toggleRelease(key) { if (releaseLocked) return; setRelease((r) => ({ ...(r || {}), [key]: !(r && r[key]) })); }
  async function saveRelease() {
    if (savingRelease || releaseLocked) return;
    setSavingRelease(true);
    try { const r = await fetch("/api/gallery/release", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ galleryId: g.id, release }) }).then((x) => x.json()); if (r.ok) setReleaseLocked(true); } catch (e) {}
    setSavingRelease(false);
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
          <button onClick={downloadSelected} disabled={dl || !selectedCount} style={{ ...mono, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", padding: "11px 18px", borderRadius: 9, cursor: selectedCount ? "pointer" : "default", border: "none", background: selectedCount ? A : LINE, color: selectedCount ? "#fff" : FAINT, display: "inline-flex", alignItems: "center", gap: 8 }}><Download size={14} /> {dl ? "Starting download…" : "Download selected"}</button>
          <button onClick={sharePicks} disabled={!selectedCount} title="Share a view-only link to your favorites" style={{ ...mono, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", padding: "11px 14px", borderRadius: 9, cursor: selectedCount ? "pointer" : "default", border: `1px solid ${selectedCount ? A : LINE}`, background: PAPER, color: selectedCount ? A : FAINT, display: "inline-flex", alignItems: "center", gap: 8 }}><Share2 size={14} /> {shareCopied ? "Link copied" : "Share picks"}</button>
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
      {dlParts && (
        <div style={{ marginTop: 18, background: CREAM, border: `1px solid ${LINE}`, borderRadius: 12, padding: "14px 18px" }}>
          <div style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: STONE, marginBottom: 6 }}>Your download, in parts</div>
          <div style={{ fontSize: 12.5, color: BODY, marginBottom: 10, lineHeight: 1.5 }}>Full-resolution files are large, so your {photos.filter((p) => p.favorite).length} photos come as {dlParts.length} zips. Tap each one.</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {dlParts.map((pt) => <a key={pt.n} href={pt.url} style={{ ...mono, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", padding: "10px 14px", borderRadius: 9, textDecoration: "none", background: A, color: "#fff", display: "inline-flex", alignItems: "center", gap: 7 }}><Download size={13} /> Part {pt.n} of {dlParts.length} \u00b7 {pt.count} photos</a>)}
            <button onClick={() => setDlParts(null)} style={{ ...mono, fontSize: 10.5, padding: "10px 12px", borderRadius: 9, border: `1px solid ${LINE}`, background: PAPER, color: STONE, cursor: "pointer" }}>Close</button>
          </div>
        </div>
      )}
      {shareLink && (
        <div style={{ marginTop: 18, background: CREAM, border: `1px solid ${LINE}`, borderRadius: 12, padding: "14px 18px" }}>
          <div style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: STONE, marginBottom: 6 }}>Sharing your favorites</div>
          <div style={{ fontSize: 12.5, color: BODY, marginBottom: 8, lineHeight: 1.5 }}>Anyone with this link can view the photos you've selected, at preview size only. It updates as you change your picks.</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ ...mono, fontSize: 11.5, color: INK, background: PAPER, border: `1px solid ${LINE}`, borderRadius: 8, padding: "9px 12px", flex: "1 1 240px", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shareLink}</div>
            <button onClick={async () => { try { await navigator.clipboard.writeText(shareLink); setShareCopied(true); setTimeout(() => setShareCopied(false), 1800); } catch (e) {} }} style={{ ...mono, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", padding: "10px 14px", borderRadius: 9, cursor: "pointer", border: "none", background: A, color: "#fff" }}>{shareCopied ? "Copied" : "Copy"}</button>
            <button onClick={stopSharing} style={{ ...mono, fontSize: 10.5, letterSpacing: "0.05em", textTransform: "uppercase", padding: "10px 12px", borderRadius: 9, cursor: "pointer", border: `1px solid ${LINE}`, background: PAPER, color: STONE }}>Stop sharing</button>
          </div>
        </div>
      )}
      <div style={{ marginTop: 26, background: CREAM, border: `1px solid ${LINE}`, borderRadius: 12, padding: "18px 20px" }}>
        <div style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: STONE, marginBottom: 6 }}>Image usage &amp; model release</div>
        <div style={{ fontSize: 13, color: BODY, lineHeight: 1.55, marginBottom: 12 }}>{releaseLocked ? "Your model release is saved. Contact us if you'd like to change it." : "Choose how we may share your images, then save. You set this once here, so take a moment before you confirm."}</div>
        {RELEASE_OPTS.map((o) => { const on = !!(release && release[o.key]); return (
          <div key={o.key} onClick={() => toggleRelease(o.key)} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "11px 0", cursor: releaseLocked ? "default" : "pointer", borderTop: `1px solid ${LINE}`, opacity: releaseLocked ? 0.9 : 1 }}>
            <span style={{ width: 22, height: 22, borderRadius: 6, border: `1.5px solid ${on ? A : LINE}`, background: on ? A : "#fff", flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>{on ? <Check size={14} color="#fff" /> : null}</span>
            <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 14, color: INK, fontWeight: 500 }}>{o.label}</div><div style={{ fontSize: 12.5, color: STONE, lineHeight: 1.5, marginTop: 2 }}>{o.desc}</div></div>
          </div>
        ); })}
        {releaseLocked ? <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: A, marginTop: 14, display: "flex", alignItems: "center", gap: 7 }}><Check size={13} /> Saved</div>
          : <button onClick={saveRelease} disabled={savingRelease} style={{ ...mono, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 15, padding: "12px 22px", borderRadius: 9, cursor: "pointer", border: "none", background: A, color: "#fff" }}>{savingRelease ? "Saving…" : "Save my model release"}</button>}
      </div>
            {products.length > 0 && cart.length > 0 && cartOpen && (
        <div style={{ marginTop: 18, background: CREAM, border: `1px solid ${LINE}`, borderRadius: 12, padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
            <div style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: STONE, display: "flex", alignItems: "center", gap: 7 }}><ShoppingBag size={13} /> Print order</div>
            <button onClick={() => setCartOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: STONE, display: "inline-flex" }}><X size={15} /></button>
          </div>
          {cart.map((x, i) => { const p = products.find((y) => y.id === x.productId); const ph = photos.find((y) => y.id === x.photoId); return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: `1px solid ${LINE}` }}>
              {ph ? <img src={ph.thumb} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 6 }} /> : null}
              <div style={{ flex: 1, fontSize: 13, color: INK }}>{p ? p.name : "Print"} <span style={{ ...mono, fontSize: 10.5, color: FAINT }}>\u00b7 {p ? money(p.price) : ""} each</span></div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><button onClick={() => bump(i, -1)} style={{ width: 26, height: 26, borderRadius: 13, border: `1px solid ${LINE}`, background: PAPER, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Minus size={12} /></button><span style={{ ...mono, fontSize: 12, minWidth: 16, textAlign: "center" }}>{x.qty}</span><button onClick={() => bump(i, 1)} style={{ width: 26, height: 26, borderRadius: 13, border: `1px solid ${LINE}`, background: PAPER, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Plus size={12} /></button></div>
            </div>
          ); })}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
            <input value={ship.name} onChange={(e) => setShip({ ...ship, name: e.target.value })} placeholder="Ship to (name)" style={{ border: `1px solid ${LINE}`, borderRadius: 8, padding: "9px 11px", fontSize: 13, fontFamily: "inherit", background: PAPER, color: INK }} />
            <input value={ship.address} onChange={(e) => setShip({ ...ship, address: e.target.value })} placeholder="Full mailing address" style={{ border: `1px solid ${LINE}`, borderRadius: 8, padding: "9px 11px", fontSize: 13, fontFamily: "inherit", background: PAPER, color: INK }} />
          </div>
          {orderErr && <div style={{ fontSize: 12, color: "#b3261e", marginTop: 8 }}>{orderErr}</div>}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
            <button onClick={placeOrder} disabled={ordering || !ship.name.trim() || !ship.address.trim()} style={{ ...mono, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", padding: "12px 20px", borderRadius: 9, cursor: "pointer", border: "none", background: ship.name.trim() && ship.address.trim() ? A : LINE, color: ship.name.trim() && ship.address.trim() ? "#fff" : FAINT }}>{ordering ? "Opening checkout…" : "Pay " + money(cartTotal) + " & order"}</button>
            <span style={{ ...mono, fontSize: 10, color: FAINT }}>Printed from the full-resolution files. Secure checkout by Square.</span>
          </div>
        </div>
      )}
      {products.length > 0 && cart.length > 0 && !cartOpen && (
        <button onClick={() => setCartOpen(true)} style={{ position: "fixed", right: 18, bottom: 18, zIndex: 40, ...mono, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", padding: "12px 16px", borderRadius: 999, border: "none", background: A, color: "#fff", boxShadow: "0 8px 24px rgba(20,18,16,0.25)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}><ShoppingBag size={14} /> {cart.reduce((a, x) => a + x.qty, 0)} print{cart.reduce((a, x) => a + x.qty, 0) === 1 ? "" : "s"} \u00b7 {money(cartTotal)}</button>
      )}
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
              {products.length > 0 && (
                <span onClick={(e) => e.stopPropagation()} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <select defaultValue="" onChange={(e) => { if (e.target.value) { addToCart(photos[lightbox].id, e.target.value); e.target.value = ""; } }} style={{ ...mono, fontSize: 11, padding: "9px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.12)", color: "#fff", cursor: "pointer" }}>
                    <option value="" style={{ color: "#141210" }}>Order a print…</option>
                    {products.map((p) => <option key={p.id} value={p.id} style={{ color: "#141210" }}>{p.name} · {money(p.price)}</option>)}
                  </select>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
