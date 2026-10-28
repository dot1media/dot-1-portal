import React, { useEffect, useState } from "react";
import { RED, INK, STONE, LINE, PAPER, BODY } from "./theme";

// A self-contained, replayable walkthrough. Each step shows a small on-brand
// screen illustration, a title, and a line of narration, with Back / Next /
// Replay. It never touches the live UI, so it works on any screen and stays
// correct regardless of layout changes.

const btnSolid = { background: RED, color: "#fff", border: "none", borderRadius: 7, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnGhost = { background: "transparent", color: INK, border: `1px solid ${LINE}`, borderRadius: 7, padding: "9px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer" };

export default function Walkthrough({ open, onClose, title, steps }) {
  const [i, setI] = useState(0);

  useEffect(() => { if (open) setI(0); }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") setI((n) => Math.min(n + 1, steps.length - 1));
      else if (e.key === "ArrowLeft") setI((n) => Math.max(n - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, steps.length, onClose]);

  if (!open) return null;
  const s = steps[i];
  const last = i === steps.length - 1;

  return (
    <div role="dialog" aria-modal="true" aria-label={title} onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 6000, background: "rgba(20,18,16,.6)", backdropFilter: "blur(3px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 640, maxHeight: "92vh", overflowY: "auto", background: PAPER, border: `1px solid ${LINE}`, borderRadius: 14, boxShadow: "0 24px 70px rgba(0,0,0,.3)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", borderBottom: `1px solid ${LINE}`, position: "sticky", top: 0, background: PAPER }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontFamily: "'Bodoni Moda',Georgia,serif", fontWeight: 700, fontSize: 17, color: INK }}>{title}</span>
            <span style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: STONE }}>{i + 1} / {steps.length}</span>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: "transparent", border: "none", color: STONE, cursor: "pointer", fontSize: 22, lineHeight: 1 }}>&times;</button>
        </div>

        {s.art && <div style={{ padding: "18px 18px 0" }}>{s.art}</div>}

        <div style={{ padding: "16px 20px 4px" }}>
          {s.tag && <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: RED, fontWeight: 700, marginBottom: 6 }}>{s.tag}</div>}
          <div style={{ fontFamily: "'Bodoni Moda',Georgia,serif", fontWeight: 700, fontSize: 21, color: INK, marginBottom: 8 }}>{s.title}</div>
          <div style={{ fontSize: 14.5, lineHeight: 1.65, color: BODY }}>{s.body}</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "18px 20px 20px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {steps.map((_, n) => (
              <button key={n} aria-label={"Go to step " + (n + 1)} onClick={() => setI(n)}
                style={{ width: n === i ? 22 : 8, height: 8, borderRadius: 8, border: "none", cursor: "pointer", padding: 0, background: n === i ? RED : n < i ? STONE : LINE, transition: "all .2s" }} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {i > 0 && <button onClick={() => setI(i - 1)} style={btnGhost}>Back</button>}
            {!last && <button onClick={() => setI(i + 1)} style={btnSolid}>Next</button>}
            {last && <button onClick={() => setI(0)} style={btnGhost}>Replay</button>}
            {last && <button onClick={onClose} style={btnSolid}>Done</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
