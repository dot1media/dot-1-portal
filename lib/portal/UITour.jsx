import React, { useEffect, useLayoutEffect, useState } from "react";
import { RED, INK, STONE, LINE, PAPER, BODY } from "./theme";

// A live, replayable coach-mark tour. It finds real elements by selector,
// spotlights each, and shows a tooltip with Back / Next. If a target is not on
// screen, the step still explains what that area does rather than breaking.

const TW = 300;
const btnSolid = { background: RED, color: "#fff", border: "none", borderRadius: 7, padding: "8px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" };
const btnGhost = { background: "transparent", color: INK, border: `1px solid ${LINE}`, borderRadius: 7, padding: "8px 14px", fontSize: 12.5, fontWeight: 500, cursor: "pointer" };

export default function UITour({ open, onClose, steps, title }) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => { if (open) setI(0); }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    const step = steps[i];
    const el = step ? document.querySelector(step.selector) : null;
    if (!el) { setMissing(true); setRect(null); return; }
    setMissing(false);
    el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    const t = setTimeout(() => setRect(el.getBoundingClientRect()), 200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, i]);

  useEffect(() => {
    if (!open) return;
    const reflow = () => {
      const step = steps[i];
      const el = step ? document.querySelector(step.selector) : null;
      if (el) setRect(el.getBoundingClientRect());
    };
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") setI((n) => Math.min(n + 1, steps.length - 1));
      else if (e.key === "ArrowLeft") setI((n) => Math.max(n - 1, 0));
    };
    window.addEventListener("resize", reflow);
    window.addEventListener("scroll", reflow, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", reflow);
      window.removeEventListener("scroll", reflow, true);
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, i]);

  if (!open) return null;
  const step = steps[i];
  const last = i === steps.length - 1;
  const next = () => (last ? onClose() : setI(i + 1));
  const prev = () => setI(Math.max(0, i - 1));

  const pad = 6;
  const box = rect ? { left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 } : null;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const clampX = (x) => Math.max(12, Math.min(x, vw - TW - 12));

  let tip = { left: 20, top: 20 };
  if (box) {
    const vh = window.innerHeight, place = step.placement || "auto";
    const below = box.top + box.height + 12;
    if (place === "right") tip = { left: Math.min(box.left + box.width + 12, vw - TW - 12), top: Math.max(12, box.top) };
    else if (place === "left") tip = { left: Math.max(12, box.left - TW - 12), top: Math.max(12, box.top) };
    else if (place === "top" || (place === "auto" && below > vh - 170)) tip = { left: clampX(box.left), top: Math.max(12, box.top - 156) };
    else tip = { left: clampX(box.left), top: below };
  } else {
    tip = { left: clampX(vw / 2 - TW / 2), top: 90 };
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 6500 }}>
      <div style={{ position: "absolute", inset: 0, background: box ? "transparent" : "rgba(20,18,16,.5)" }} />
      {box && (
        <div style={{ position: "fixed", left: box.left, top: box.top, width: box.width, height: box.height, borderRadius: 10, boxShadow: "0 0 0 9999px rgba(20,18,16,.55)", border: `2px solid ${RED}`, pointerEvents: "none", transition: "all .2s ease" }} />
      )}
      <div style={{ position: "fixed", left: tip.left, top: tip.top, width: TW, background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, padding: "14px 16px", boxShadow: "0 18px 50px rgba(0,0,0,.28)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          <span style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: RED, fontWeight: 700 }}>{title ? title + " · " : ""}{i + 1}/{steps.length}</span>
          <button onClick={onClose} aria-label="End tour" style={{ background: "transparent", border: "none", color: STONE, cursor: "pointer", fontSize: 18, lineHeight: 1 }}>&times;</button>
        </div>
        <div style={{ fontFamily: "'Bodoni Moda',Georgia,serif", fontWeight: 700, fontSize: 17, color: INK, marginBottom: 6 }}>{step.title}</div>
        <div style={{ fontSize: 13.5, lineHeight: 1.6, color: BODY, marginBottom: 12 }}>
          {missing ? "Not on screen right now, but here is what it does: " + step.body : step.body}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
          <button onClick={onClose} style={{ fontSize: 12, color: STONE, background: "transparent", border: "none", cursor: "pointer" }}>Skip</button>
          <div style={{ display: "flex", gap: 8 }}>
            {i > 0 && <button onClick={prev} style={btnGhost}>Back</button>}
            <button onClick={next} style={btnSolid}>{last ? "Done" : "Next"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
