"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Film, Check, ChevronDown, Plus, Download, Upload } from "lucide-react";
import { mono, display, INK, BODY, LINE, STONE, FAINT, PAPER, CREAM } from "./theme";
import { GROUPS } from "./groups";

function fmtT(t) { const m = Math.floor((t || 0) / 60), s = Math.floor((t || 0) % 60); return m + ":" + String(s).padStart(2, "0"); }

export function VideoReview({ sessionId, isStudio }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [curTime, setCurTime] = useState(0);
  const [posting, setPosting] = useState(false);
  const [verOpen, setVerOpen] = useState(false);
  const videoRef = useRef(null);
  const [finalBusy, setFinalBusy] = useState(false);
  const [finalPct, setFinalPct] = useState(0);
  const [finalErr, setFinalErr] = useState("");
  const A = GROUPS.video.color;

  const load = useCallback(async (reviewId) => {
    try { const r = await fetch("/api/video?sessionId=" + encodeURIComponent(sessionId) + (reviewId ? "&reviewId=" + reviewId : "")).then((x) => x.json()); setData(r); } catch (e) {}
    setLoading(false);
  }, [sessionId]);
  useEffect(() => { if (sessionId) load(); }, [sessionId, load]);

  const cur = data && data.current;
  const comments = (data && data.comments) || [];
  const reviews = (data && data.reviews) || [];
  const approved = cur && cur.status === "approved";

  function seek(t) { const v = videoRef.current; if (v) { v.currentTime = t; v.play().catch(() => {}); } }
  async function addNote() {
    const body = note.trim(); if (!body || !cur || posting) return;
    setPosting(true);
    const t = videoRef.current ? videoRef.current.currentTime : curTime;
    try { const r = await fetch("/api/video/comment", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reviewId: cur.id, t, body }) }).then((x) => x.json()); if (r.ok) { setNote(""); await load(cur.id); } } catch (e) {}
    setPosting(false);
  }
  async function approve() {
    if (!cur || !window.confirm("Approve this cut? It locks this version as the final, approved version.")) return;
    try { await fetch("/api/video/approve", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reviewId: cur.id }) }); await load(cur.id); } catch (e) {}
  }

  async function onFinalPick(e) {
    const f = e.target.files && e.target.files[0]; if (e.target) e.target.value = "";
    if (!f || !cur) return;
    setFinalBusy(true); setFinalPct(0); setFinalErr("");
    try {
      const PART = 100 * 1024 * 1024;
      if (f.size > 200 * 1024 * 1024) {
        const nParts = Math.ceil(f.size / PART);
        const init = await fetch("/api/video/final/mpu/create", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reviewId: cur.id, parts: nParts, type: f.type || "video/mp4" }) }).then((x) => x.json());
        if (!init.uploadId) throw new Error(init.error || "Could not start the upload.");
        const parts = []; let uploaded = 0;
        for (let i = 0; i < nParts; i++) {
          const start = i * PART, end = Math.min(f.size, start + PART); const blob = f.slice(start, end);
          const etag = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest(); xhr.open("PUT", init.urls[i]);
            xhr.upload.onprogress = (ev) => { if (ev.lengthComputable) setFinalPct(Math.round(((uploaded + ev.loaded) / f.size) * 100)); };
            xhr.onload = () => { if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.getResponseHeader("ETag")); else reject(new Error("part " + (i + 1) + " failed")); };
            xhr.onerror = () => reject(new Error("part " + (i + 1) + " failed")); xhr.send(blob);
          });
          if (!etag) throw new Error("Upload blocked. The bucket CORS must expose the ETag header.");
          parts.push({ PartNumber: i + 1, ETag: etag }); uploaded += (end - start);
        }
        const done = await fetch("/api/video/final/mpu/complete", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reviewId: cur.id, uploadId: init.uploadId, parts, filename: f.name }) }).then((x) => x.json());
        if (!done.ok) throw new Error(done.error || "Could not finish the upload.");
      } else {
        const res = await fetch("/api/video/final/sign-upload", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reviewId: cur.id, filename: f.name, type: f.type || "video/mp4" }) }).then((x) => x.json());
        if (!res.url) throw new Error(res.error || "Could not start the upload.");
        await new Promise((resolve, reject) => { const xhr = new XMLHttpRequest(); xhr.open("PUT", res.url); xhr.setRequestHeader("Content-Type", f.type || "video/mp4"); xhr.upload.onprogress = (ev) => { if (ev.lengthComputable) setFinalPct(Math.round((ev.loaded / ev.total) * 100)); }; xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject(new Error("Upload failed. Check the bucket CORS allows PUT from this site.")); xhr.onerror = () => reject(new Error("Upload failed. Check the bucket CORS allows PUT from this site.")); xhr.send(f); });
        await fetch("/api/video/final/finalize", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reviewId: cur.id, filename: f.name }) });
      }
      await load(cur.id);
    } catch (e2) { setFinalErr((e2 && e2.message) || "Upload failed. Please try again."); }
    setFinalBusy(false); setFinalPct(0);
  }
  async function deleteCut() {
    if (!cur || !window.confirm("Delete " + cur.title + " and its files from storage? This cannot be undone.")) return;
    try { await fetch("/api/video?reviewId=" + cur.id, { method: "DELETE" }); await load(); } catch (e) {}
  }
  async function downloadFinal() {
    if (!cur) return;
    try { const r = await fetch("/api/video/final?reviewId=" + cur.id).then((x) => x.json()); if (r.url) { const a = document.createElement("a"); a.href = r.url; a.download = (cur.final && cur.final.filename) || "final.mp4"; document.body.appendChild(a); a.click(); a.remove(); } } catch (e) {}
  }

  if (loading || !cur) return null;
  return (
    <div style={{ marginTop: 6, marginBottom: 28 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
        <div style={{ ...display, fontWeight: 700, fontSize: 22, color: INK, display: "flex", alignItems: "center", gap: 9 }}><Film size={18} color={A} /> {cur.title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {reviews.length > 1 && (
            <div style={{ position: "relative" }}>
              <button onClick={() => setVerOpen((o) => !o)} style={{ ...mono, fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", padding: "8px 12px", borderRadius: 8, cursor: "pointer", border: `1px solid ${LINE}`, background: PAPER, color: STONE, display: "inline-flex", alignItems: "center", gap: 7 }}>Cut {cur.version} <ChevronDown size={14} /></button>
              {verOpen && (<><div onClick={() => setVerOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 20 }} /><div style={{ position: "absolute", top: "calc(100% + 4px)", right: 0, background: PAPER, border: `1px solid ${LINE}`, borderRadius: 9, boxShadow: "0 10px 30px rgba(20,18,16,0.14)", zIndex: 21, minWidth: 150, overflow: "hidden" }}>{reviews.map((r) => (<button key={r.id} onClick={() => { setVerOpen(false); load(r.id); }} style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "10px 13px", background: r.id === cur.id ? CREAM : "transparent", border: "none", cursor: "pointer", textAlign: "left" }}><span style={{ fontSize: 13, color: INK }}>{r.title}</span>{r.status === "approved" && <Check size={13} color={A} />}</button>))}</div></>)}
            </div>
          )}
          {approved && <span style={{ ...mono, fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: "#fff", background: A, borderRadius: 20, padding: "6px 12px", display: "inline-flex", alignItems: "center", gap: 6 }}><Check size={13} /> Approved</span>}
        </div>
      </div>
      <video ref={videoRef} src={cur.playUrl} controls playsInline onTimeUpdate={(e) => setCurTime(e.target.currentTime)} style={{ width: "100%", borderRadius: 10, background: "#000", display: "block", maxHeight: "68vh" }} />
      {!approved && (
        <div style={{ display: "flex", gap: 8, marginTop: 14, alignItems: "center" }}>
          <span style={{ ...mono, fontSize: 12.5, color: A, flexShrink: 0, minWidth: 42 }}>{fmtT(curTime)}</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addNote(); }} placeholder="Add a note at this moment…" style={{ flex: 1, border: `1px solid ${LINE}`, borderRadius: 9, padding: "11px 13px", fontFamily: "Archivo, sans-serif", fontSize: 14, color: INK, background: PAPER }} />
          <button onClick={addNote} disabled={posting || !note.trim()} style={{ width: 44, height: 44, borderRadius: 9, border: "none", cursor: note.trim() ? "pointer" : "default", background: note.trim() ? A : LINE, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Plus size={18} /></button>
        </div>
      )}
      <div style={{ marginTop: 16 }}>
        {comments.length === 0 ? (
          <div style={{ ...mono, fontSize: 11, color: FAINT, padding: "8px 0" }}>{approved ? "This cut was approved." : "No notes yet. Scrub to a moment and add one."}</div>
        ) : comments.map((c) => (
          <div key={c.id} style={{ display: "flex", gap: 12, padding: "11px 0", borderTop: `1px solid ${LINE}` }}>
            <button onClick={() => seek(c.t)} style={{ ...mono, fontSize: 11, fontWeight: 500, color: "#fff", background: A, border: "none", borderRadius: 6, padding: "5px 8px", cursor: "pointer", flexShrink: 0, alignSelf: "flex-start" }}>{fmtT(c.t)}</button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, color: INK, lineHeight: 1.5 }}>{c.body}</div>
              <div style={{ ...mono, fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", color: FAINT, marginTop: 3 }}>{c.author === "studio" ? "Studio" : "Client"}</div>
            </div>
          </div>
        ))}
      </div>
      {!approved ? (
        <button onClick={approve} style={{ ...mono, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 18, padding: "13px 22px", borderRadius: 10, cursor: "pointer", border: `1px solid ${A}`, background: PAPER, color: A, display: "inline-flex", alignItems: "center", gap: 9, width: "100%", justifyContent: "center" }}><Check size={16} /> {isStudio ? "Mark this cut approved" : "Approve this cut"}</button>
      ) : cur.final && cur.final.available ? (
        <button onClick={downloadFinal} style={{ ...mono, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 18, padding: "15px 22px", borderRadius: 11, cursor: "pointer", border: "none", background: A, color: "#fff", display: "inline-flex", alignItems: "center", gap: 10, width: "100%", justifyContent: "center" }}><Download size={17} /> Download final in high quality</button>
      ) : isStudio ? (
        <div style={{ marginTop: 18, background: CREAM, border: `1px solid ${LINE}`, borderRadius: 11, padding: "16px 18px" }}>
          <div style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: STONE, marginBottom: 10 }}>Deliver the final</div>
          {finalBusy ? <div style={{ ...mono, fontSize: 12, color: A }}>Uploading final… {finalPct}% (keep this open)</div>
            : <label style={{ ...mono, fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase", padding: "12px 18px", borderRadius: 9, cursor: "pointer", border: "none", background: A, color: "#fff", display: "inline-flex", alignItems: "center", gap: 8 }}><Upload size={14} /> Upload high-quality final<input type="file" accept="video/*" style={{ display: "none" }} onChange={onFinalPick} /></label>}
          {finalErr && <div style={{ ...mono, fontSize: 10.5, color: "#b3261e", marginTop: 9, lineHeight: 1.5 }}>{finalErr}</div>}
          <div style={{ ...mono, fontSize: 9.5, color: STONE, marginTop: 11, lineHeight: 1.55, opacity: 0.85 }}>This cut is approved. Drop your pristine export, any size, and the client gets a high-quality download here.</div>
        </div>
      ) : (
        <div style={{ marginTop: 18, ...mono, fontSize: 11, color: STONE, textAlign: "center", padding: "14px", background: CREAM, borderRadius: 10, border: `1px solid ${LINE}` }}>Approved. Your final in high quality will appear here to download shortly.</div>
      )}
      {isStudio && <button onClick={deleteCut} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, marginTop: 16, fontFamily: "'IBM Plex Mono', monospace", fontSize: 9.5, color: "#b3261e", textDecoration: "underline", display: "block" }}>Delete this cut</button>}
    </div>
  );
}
