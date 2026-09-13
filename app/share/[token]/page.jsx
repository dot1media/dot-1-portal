"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

const INK = "#141210", BONE = "#f4f0e7", STONE = "#6f6d65", LINE = "#e2ded4";
const mono = { fontFamily: "'IBM Plex Mono', monospace" };

export default function SharePage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [lb, setLb] = useState(-1);
  useEffect(() => { if (!token) return; fetch("/api/gallery/shared?token=" + encodeURIComponent(String(token))).then((r) => r.json()).then((d) => { if (d.photos) setData(d); else setErr(d.error || "This link is no longer active."); }).catch(() => setErr("Could not load this gallery.")); }, [token]);
  useEffect(() => { if (lb < 0) return; const onKey = (e) => { if (e.key === "Escape") setLb(-1); if (e.key === "ArrowRight") setLb((i) => Math.min(i + 1, data.photos.length - 1)); if (e.key === "ArrowLeft") setLb((i) => Math.max(i - 1, 0)); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [lb, data]);
  return (
    <div style={{ minHeight: "100vh", background: "#fbf8f2", color: INK, fontFamily: "Archivo, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 18px 60px" }}>
        <div style={{ ...mono, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: STONE, marginBottom: 6 }}>Dot One Media · shared favorites</div>
        {err ? <div style={{ fontSize: 15, color: STONE, padding: "40px 0" }}>{err}</div> : !data ? <div style={{ ...mono, fontSize: 11, color: STONE }}>Loading…</div> : (
          <>
            <h1 style={{ fontFamily: "'Bodoni Moda', Georgia, serif", fontWeight: 700, fontSize: 30, margin: "0 0 4px" }}>{data.title}</h1>
            <div style={{ fontSize: 13, color: STONE, marginBottom: 20 }}>{data.photos.length} photo{data.photos.length === 1 ? "" : "s"} chosen for you to see. View only.</div>
            {data.photos.length === 0 ? <div style={{ fontSize: 14, color: STONE }}>No favorites have been chosen yet.</div> : (
              <div style={{ columns: "3 220px", columnGap: 10 }}>
                {data.photos.map((p, i) => <img key={p.id} src={p.thumb} alt="" loading="lazy" onClick={() => setLb(i)} style={{ width: "100%", display: "block", borderRadius: 8, marginBottom: 10, cursor: "zoom-in", breakInside: "avoid", background: BONE }} />)}
              </div>
            )}
          </>
        )}
      </div>
      {lb >= 0 && data && (
        <div onClick={() => setLb(-1)} style={{ position: "fixed", inset: 0, background: "rgba(20,18,16,0.94)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img src={data.photos[lb].proof} alt="" onClick={(e) => e.stopPropagation()} onContextMenu={(e) => e.preventDefault()} style={{ maxWidth: "94vw", maxHeight: "88vh", objectFit: "contain", borderRadius: 6 }} />
          <button onClick={() => setLb(-1)} style={{ position: "fixed", top: 16, right: 16, background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", width: 40, height: 40, borderRadius: 20, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><X size={18} /></button>
          {lb > 0 && <button onClick={(e) => { e.stopPropagation(); setLb(lb - 1); }} style={{ position: "fixed", left: 14, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", width: 42, height: 42, borderRadius: 21, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><ChevronLeft size={20} /></button>}
          {lb < data.photos.length - 1 && <button onClick={(e) => { e.stopPropagation(); setLb(lb + 1); }} style={{ position: "fixed", right: 14, top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", width: 42, height: 42, borderRadius: 21, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center" }}><ChevronRight size={20} /></button>}
          <div style={{ position: "fixed", bottom: 16, left: 0, right: 0, textAlign: "center", ...mono, fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{lb + 1} / {data.photos.length}</div>
        </div>
      )}
    </div>
  );
}
