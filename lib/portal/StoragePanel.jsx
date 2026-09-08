"use client";
import React, { useEffect, useState } from "react";
import { HardDrive, Trash2, RefreshCw } from "lucide-react";
import { card, mono, display, INK, LINE, STONE, FAINT, PAPER, CREAM, RED, OK, WARN, btnGhost } from "./theme";

const fmtB = (n) => { if (!n) return "0 B"; const u = ["B", "KB", "MB", "GB", "TB"]; let i = 0, v = n; while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; } return (i >= 2 ? v.toFixed(1) : Math.round(v)) + " " + u[i]; };
const ago = (t) => { if (!t) return ""; const d = Math.round((Date.now() - t) / 86400000); return d <= 0 ? "today" : d === 1 ? "1 day ago" : d < 30 ? d + " days ago" : Math.round(d / 30) + " mo ago"; };
// R2 is ~$0.015 per GB-month; egress is free.
const costPerMonth = (bytes) => (bytes / 1073741824) * 0.015;

export function StoragePanel({ showToast }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = async () => { setBusy(true); try { const r = await fetch("/api/storage").then((x) => x.json()); if (r.galleries) setData(r); else setData({ error: r.error || "Could not read storage." }); } catch (e) { setData({ error: "Network error." }); } setBusy(false); };
  useEffect(() => { load(); }, []);
  async function delGallery(g) { if (!window.confirm(`Delete "${g.title}" (${g.photos} photos, ${fmtB(g.bytes)}) from storage? This cannot be undone.`)) return; await fetch("/api/gallery?galleryId=" + encodeURIComponent(g.id), { method: "DELETE" }); if (showToast) showToast("Gallery deleted."); load(); }
  async function delVideo(v) { if (!window.confirm(`Delete "${v.title}" (${fmtB(v.bytes)}) from storage? This cannot be undone.`)) return; await fetch("/api/video?reviewId=" + encodeURIComponent(v.id), { method: "DELETE" }); if (showToast) showToast("Video deleted."); load(); }
  const row = (label, sub, bytes, extra, onDel, warn) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderTop: `1px solid ${LINE}` }}>
      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 13.5, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}{warn ? <span style={{ ...mono, fontSize: 9.5, color: WARN, marginLeft: 8 }}>{warn}</span> : null}</div><div style={{ ...mono, fontSize: 10, color: FAINT, marginTop: 2 }}>{sub}</div></div>
      <div style={{ ...mono, fontSize: 11.5, color: INK, minWidth: 64, textAlign: "right" }}>{fmtB(bytes)}</div>
      {extra ? <div style={{ ...mono, fontSize: 10, color: FAINT, minWidth: 74, textAlign: "right" }}>{extra}</div> : null}
      <button onClick={onDel} title="Delete from storage" style={{ background: "none", border: `1px solid ${LINE}`, borderRadius: 7, width: 30, height: 30, cursor: "pointer", color: STONE, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Trash2 size={13} /></button>
    </div>
  );
  return (
    <div style={{ ...card, padding: "18px 20px", marginTop: 22 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 32, height: 32, borderRadius: 8, background: CREAM, display: "inline-flex", alignItems: "center", justifyContent: "center", color: STONE }}><HardDrive size={15} /></span>
          <div><div style={{ ...display, fontWeight: 600, fontSize: 15, color: INK }}>Storage</div><div style={{ fontSize: 12, color: STONE }}>What's actually in your bucket, largest first. Deleting here frees the space for real.</div></div>
        </div>
        <button onClick={load} disabled={busy} style={{ ...btnGhost, display: "inline-flex", alignItems: "center", gap: 6 }}><RefreshCw size={13} /> {busy ? "Measuring…" : "Refresh"}</button>
      </div>
      {!data ? <div style={{ ...mono, fontSize: 11, color: FAINT }}>Measuring…</div> : data.error ? <div style={{ ...mono, fontSize: 11, color: RED }}>{data.error}</div> : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 14 }}>
            {[["Total", fmtB(data.total), "\u2248 $" + costPerMonth(data.total).toFixed(2) + "/mo"], ["Photos", fmtB(data.galleryBytes), data.galleries.length + " galleries"], ["Video", fmtB(data.videoBytes), data.videos.length + " cuts"], ["Objects", String(data.objects), "files in R2"]].map(([l, v, sub]) => (
              <div key={l} style={{ background: CREAM, border: `1px solid ${LINE}`, borderRadius: 9, padding: "10px 12px" }}><div style={{ ...mono, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: STONE }}>{l}</div><div style={{ ...display, fontWeight: 700, fontSize: 20, color: INK, marginTop: 2 }}>{v}</div><div style={{ ...mono, fontSize: 9.5, color: FAINT }}>{sub}</div></div>
            ))}
          </div>
          {data.galleries.length > 0 && <><div style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: STONE, margin: "8px 0 2px" }}>Galleries</div>{data.galleries.map((g) => row(g.title, [g.session || g.client, g.photos + " photos", ago(g.newest)].filter(Boolean).join(" \u00b7 "), g.bytes, null, () => delGallery(g), g.orphan ? "no record" : null))}</>}
          {data.videos.length > 0 && <><div style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: STONE, margin: "14px 0 2px" }}>Video cuts</div>{data.videos.map((v) => row(v.title + (v.status === "approved" ? " \u00b7 approved" : ""), [v.session || v.client, "review " + fmtB(v.reviewBytes) + (v.finalBytes ? " + final " + fmtB(v.finalBytes) : ""), ago(v.newest)].filter(Boolean).join(" \u00b7 "), v.bytes, null, () => delVideo(v), v.orphan ? "no record" : null))}</>}
          {data.galleries.length === 0 && data.videos.length === 0 && <div style={{ ...mono, fontSize: 11, color: FAINT }}>Nothing stored yet.</div>}
        </>
      )}
    </div>
  );
}
