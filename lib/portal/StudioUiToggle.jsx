// Studio dashboard design toggle (classic vs redesign). Stored per device in
// localStorage, so it only affects this admin's own studio home. Default is
// classic, so the live dashboard is unchanged until the studio opts in.
import React, { useState, useEffect } from "react";
import { LayoutDashboard, LayoutGrid } from "lucide-react";
import { RED, INK, STONE, LINE, CREAM, PAPER, display, mono } from "./theme";

const KEY = "dot1_studio_ui";

export function StudioUiToggle({ onChange }) {
  const [mode, setMode] = useState("classic");
  useEffect(() => { try { const m = localStorage.getItem(KEY); if (m === "redesign" || m === "classic") { setMode(m); if (onChange) onChange(m); } } catch (e) {} }, []);
  const set = (next) => {
    if (next === mode) return;
    setMode(next);
    try { localStorage.setItem(KEY, next); } catch (e) {}
    if (onChange) onChange(next);
  };
  const opt = (key, Icon, label, sub) => {
    const on = mode === key;
    return (
      <button key={key} onClick={() => set(key)} style={{ flex: 1, minWidth: 190, textAlign: "left", cursor: "pointer", borderRadius: 12, padding: "14px 16px", border: `1.5px solid ${on ? RED : LINE}`, background: on ? `color-mix(in srgb, ${RED} 6%, ${PAPER})` : PAPER, boxShadow: on ? `0 0 0 3px color-mix(in srgb, ${RED} 14%, transparent)` : "none", transition: "all .2s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
          <span style={{ width: 24, height: 24, borderRadius: 7, display: "grid", placeItems: "center", background: on ? RED : CREAM, color: on ? "#fff" : STONE, flexShrink: 0 }}><Icon size={14} /></span>
          <span style={{ ...display, fontWeight: 700, fontSize: 15, color: INK }}>{label}</span>
        </div>
        <div style={{ fontSize: 12.5, color: STONE, lineHeight: 1.5 }}>{sub}</div>
      </button>
    );
  };
  return (
    <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 14, padding: "18px 20px", marginBottom: 18 }}>
      <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 4 }}>Studio dashboard design</div>
      <div style={{ fontSize: 12.5, color: STONE, marginBottom: 14, lineHeight: 1.5 }}>Changes your studio home only, on this device. Switch back anytime. Pick the Declared palette in Appearance to match the mockup.</div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {opt("classic", LayoutDashboard, "Current design", "The dashboard you have now.")}
        {opt("redesign", LayoutGrid, "New design", "Airy, card-led layout with a next-session hero and countdown.")}
      </div>
    </div>
  );
}
