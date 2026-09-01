"use client";
import React, { useEffect, useState } from "react";
import { Film, Upload } from "lucide-react";
import { mono, INK, LINE, STONE, CREAM, btnSolid } from "./theme";
import { GROUPS } from "./groups";

export function VideoUploader({ sessionId, showToast }) {
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [err, setErr] = useState("");
  const [reviews, setReviews] = useState([]);
  const A = GROUPS.video.color;
  const load = async () => { try { const r = await fetch("/api/video?sessionId=" + encodeURIComponent(sessionId)).then((x) => x.json()); setReviews(r.reviews || []); } catch (e) {} };
  useEffect(() => { if (sessionId) load(); }, [sessionId]);

  async function onPick(e) {
    const f = e.target.files && e.target.files[0]; if (e.target) e.target.value = "";
    if (!f) return;
    setBusy(true); setErr(""); setPct(0);
    try {
      const res = await fetch("/api/video/sign-upload", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId, filename: f.name, type: f.type || "video/mp4" }) }).then((x) => x.json());
      if (!res.reviewId) throw new Error(res.error || "Could not start the upload.");
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", res.url);
        xhr.setRequestHeader("Content-Type", f.type || "video/mp4");
        xhr.upload.onprogress = (ev) => { if (ev.lengthComputable) setPct(Math.round((ev.loaded / ev.total) * 100)); };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve() : reject(new Error("Upload failed (" + xhr.status + ")"));
        xhr.onerror = () => reject(new Error("Upload failed."));
        xhr.send(f);
      });
      await fetch("/api/video/finalize", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reviewId: res.reviewId }) });
      if (showToast) showToast("Cut " + res.version + " uploaded.");
      await load();
    } catch (e2) { setErr(e2.message || "Upload failed. Please try again."); }
    setBusy(false); setPct(0);
  }

  return (
    <div style={{ background: CREAM, border: `1px solid ${LINE}`, borderRadius: 10, padding: "16px 18px", marginBottom: 18 }}>
      <div style={{ ...mono, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}><Film size={13} /> Video review</div>
      {reviews.length > 0 && <div style={{ fontSize: 13, color: INK, marginBottom: 12 }}>{reviews.length} cut{reviews.length === 1 ? "" : "s"}. Latest: {reviews[0].title}{reviews[0].status === "approved" ? " · approved" : " · in review"}.</div>}
      {busy ? (
        <div style={{ ...mono, fontSize: 12, color: A }}>Uploading… {pct}% (keep this open)</div>
      ) : (
        <label style={{ ...btnSolid, background: A, cursor: "pointer", display: "inline-flex" }}><Upload size={14} /> {reviews.length ? "Upload a new cut" : "Upload a cut"}<input type="file" accept="video/*" style={{ display: "none" }} onChange={onPick} /></label>
      )}
      {err && <div style={{ ...mono, fontSize: 10.5, color: "#b3261e", marginTop: 8, lineHeight: 1.5 }}>{err}</div>}
      <div style={{ ...mono, fontSize: 9.5, color: STONE, marginTop: 12, lineHeight: 1.55, opacity: 0.85 }}>Upload a compressed review copy. The client watches it, leaves notes pinned to the exact moment, and approves. Each new upload is its own version.</div>
    </div>
  );
}
