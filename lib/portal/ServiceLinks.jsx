"use client";
import React, { useState } from "react";
import { Copy, Check, Link2, ChevronDown } from "lucide-react";
import { GROUPS, GROUP_KEYS } from "./groups";
import { PORTAL_ROOT } from "./constants";
import { card, mono, display, INK, LINE, STONE, FAINT, PAPER, CREAM } from "./theme";

export function ServiceLinks({ state, showToast }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState("");
  const linkFor = (id) => PORTAL_ROOT + "?s=" + id;
  const copy = async (id) => {
    try { await navigator.clipboard.writeText(linkFor(id)); setCopied(id); if (showToast) showToast("Booking link copied."); setTimeout(() => setCopied(""), 1600); }
    catch (e) { if (showToast) showToast("Select the link to copy it."); }
  };
  const services = (state.services || []).filter((s) => s.visible !== false);
  const groupsWithServices = GROUP_KEYS.filter((k) => services.some((s) => s.group === k));

  return (
    <div style={{ ...card, marginBottom: 26 }}>
      <button onClick={() => setOpen((o) => !o)} style={{ width: "100%", background: "transparent", border: "none", cursor: "pointer", padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, textAlign: "left" }}>
        <span style={{ width: 32, height: 32, borderRadius: 8, background: CREAM, display: "inline-flex", alignItems: "center", justifyContent: "center", color: STONE, flexShrink: 0 }}><Link2 size={15} /></span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ ...display, fontWeight: 600, fontSize: 15, color: INK, display: "block" }}>Direct booking links</span>
          <span style={{ fontSize: 12, color: STONE, lineHeight: 1.45, display: "block", marginTop: 1 }}>A permanent link for each session type. Share it and clients pick a time from your availability, add extras, sign, and pay.</span>
        </span>
        <ChevronDown size={16} color={FAINT} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{ borderTop: `1px solid ${LINE}`, padding: "4px 18px 14px" }}>
          {groupsWithServices.length === 0 ? (
            <div style={{ fontSize: 12.5, color: STONE, padding: "14px 0" }}>No services yet. Add services in Services and Add-ons, and a booking link appears for each one here.</div>
          ) : groupsWithServices.map((k) => {
            const g = GROUPS[k]; const list = services.filter((s) => s.group === k);
            return (
              <div key={k} style={{ marginTop: 14 }}>
                <div style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: g.color, marginBottom: 6, display: "flex", alignItems: "center", gap: 7 }}><g.Icon size={13} /> {g.label}</div>
                {list.map((s) => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${LINE}` }}>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                    <button onClick={() => copy(s.id)} title="Copy booking link" style={{ ...mono, fontSize: 10.5, letterSpacing: "0.04em", textTransform: "uppercase", padding: "7px 12px", borderRadius: 7, cursor: "pointer", border: `1px solid ${copied === s.id ? g.color : LINE}`, background: copied === s.id ? g.color : PAPER, color: copied === s.id ? "#fff" : STONE, display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0 }}>{copied === s.id ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy link</>}</button>
                  </div>
                ))}
              </div>
            );
          })}
          <div style={{ ...mono, fontSize: 9.5, color: FAINT, marginTop: 14, lineHeight: 1.5 }}>Times come from your Availability settings, so set your open days and hours there and every link respects them.</div>
        </div>
      )}
    </div>
  );
}
