// Dot One Media portal - admin switch for the live client experience.
// Flips the whole client portal + booking flow between the new "redesign" and the
// previous "classic" look. Revertible at any time while we keep revising the redesign.
import React, { useEffect, useState } from "react";
import { Sparkles, RotateCcw } from "lucide-react";
import { RED, INK, BODY, STONE, FAINT, LINE, PAPER, CREAM, OK, display, mono, card } from "./theme";

export function ClientUiToggle({ showToast, onChange }) {
  const [mode, setMode] = useState(null); // "redesign" | "classic" | null (loading)
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let stop = false;
    fetch("/api/client-ui").then((r) => r.json()).then((d) => { if (!stop && d && d.mode) setMode(d.mode); }).catch(() => { if (!stop) setMode("redesign"); });
    return () => { stop = true; };
  }, []);

  const set = async (next) => {
    if (busy || next === mode) return;
    setBusy(true);
    const prev = mode;
    setMode(next); // optimistic
    try {
      const r = await fetch("/api/client-ui", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode: next }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setMode(prev); if (showToast) showToast(d.error || "Could not change the client experience."); }
      else { setMode(d.mode); if (onChange) onChange(d.mode); if (showToast) showToast(d.mode === "redesign" ? "Clients now see the new redesign." : "Reverted clients to the current design."); }
    } catch (e) { setMode(prev); if (showToast) showToast("Network error. Please try again."); }
    setBusy(false);
  };

  const redesign = mode === "redesign";
  const opt = (key, Icon, label, sub) => {
    const on = mode === key;
    return (
      <button key={key} onClick={() => set(key)} disabled={busy} style={{ flex: 1, minWidth: 190, textAlign: "left", cursor: busy ? "default" : "pointer", borderRadius: 12, padding: "14px 16px", border: `1.5px solid ${on ? RED : LINE}`, background: on ? `color-mix(in srgb, ${RED} 6%, ${PAPER})` : PAPER, boxShadow: on ? `0 0 0 3px color-mix(in srgb, ${RED} 14%, transparent)` : "none", transition: "all .2s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
          <span style={{ width: 24, height: 24, borderRadius: 7, display: "grid", placeItems: "center", background: on ? RED : CREAM, color: on ? "#fff" : STONE, flexShrink: 0 }}><Icon size={14} /></span>
          <span style={{ ...display, fontWeight: 600, fontSize: 15, color: INK }}>{label}</span>
          {on && <span style={{ ...mono, fontSize: 8.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "#fff", background: OK, borderRadius: 20, padding: "2px 8px", marginLeft: "auto" }}>Live</span>}
        </div>
        <div style={{ fontSize: 12, color: STONE, lineHeight: 1.45 }}>{sub}</div>
      </button>
    );
  };

  return (
    <div style={{ ...card, padding: "20px 22px", marginBottom: 28 }}>
      <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 5 }}>Client experience</div>
      <div style={{ fontSize: 13, color: BODY, lineHeight: 1.5, marginBottom: 14 }}>Choose what clients see across the portal and the booking flow. You can switch back anytime while we keep refining the redesign.</div>
      {mode === null ? (
        <div style={{ ...mono, fontSize: 11.5, color: FAINT }}>Loading…</div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {opt("redesign", Sparkles, "Redesign", "The new next-action dashboard and guided, one-step-at-a-time booking flow.")}
            {opt("classic", RotateCcw, "Current design", "The previous client portal and booking flow, exactly as it was.")}
          </div>
          <div style={{ ...mono, fontSize: 9.5, color: FAINT, marginTop: 12, letterSpacing: "0.04em" }}>Takes effect immediately. Clients already on a page see it the next time it loads.</div>
        </>
      )}
    </div>
  );
}
