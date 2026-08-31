"use client";
import React, { useState } from "react";
import { Copy, Check, Link2, ChevronDown } from "lucide-react";
import { GROUPS, GROUP_KEYS } from "./groups";
import { PORTAL_ROOT } from "./constants";
import { card, mono, display, INK, LINE, STONE, FAINT, PAPER, CREAM } from "./theme";

export function ServiceLinks({ state, showToast }) {
  const [openGroups, setOpenGroups] = useState({});
  const [copied, setCopied] = useState("");
  const toggle = (k) => setOpenGroups((o) => ({ ...o, [k]: !o[k] }));
  const linkFor = (id) => PORTAL_ROOT + "?s=" + id;
  const copy = async (id) => {
    try { await navigator.clipboard.writeText(linkFor(id)); setCopied(id); if (showToast) showToast("Booking link copied."); setTimeout(() => setCopied(""), 1600); }
    catch (e) { if (showToast) showToast("Select the link to copy it."); }
  };
  const services = (state.services || []).filter((s) => s.visible !== false);
  const groupsWithServices = GROUP_KEYS.filter((k) => services.some((s) => s.group === k));

  return (
    <div style={{ ...card, marginBottom: 26, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: groupsWithServices.length ? 4 : 0 }}>
        <span style={{ width: 32, height: 32, borderRadius: 8, background: CREAM, display: "inline-flex", alignItems: "center", justifyContent: "center", color: STONE, flexShrink: 0 }}><Link2 size={15} /></span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ ...display, fontWeight: 600, fontSize: 15, color: INK, display: "block" }}>Direct booking links</span>
          <span style={{ fontSize: 12, color: STONE, lineHeight: 1.45, display: "block", marginTop: 1 }}>A permanent link per session type. Clients pick a time from your availability, add extras, sign, and pay.</span>
        </span>
      </div>
      {groupsWithServices.length === 0 ? (
        <div style={{ fontSize: 12.5, color: STONE, padding: "12px 0 2px" }}>No services yet. Add them in Services and Add-ons and a booking link appears for each here.</div>
      ) : groupsWithServices.map((k) => {
        const g = GROUPS[k]; const list = services.filter((s) => s.group === k); const open = !!openGroups[k];
        return (
          <div key={k} style={{ borderTop: `1px solid ${LINE}`, marginTop: 10, paddingTop: 4 }}>
            <button onClick={() => toggle(k)} style={{ width: "100%", background: "transparent", border: "none", cursor: "pointer", padding: "10px 2px", display: "flex", alignItems: "center", gap: 9, textAlign: "left" }}>
              <span style={{ color: g.color, display: "inline-flex", flexShrink: 0 }}><g.Icon size={15} /></span>
              <span style={{ ...mono, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: INK, flex: 1 }}>{g.label}</span>
              <span style={{ ...mono, fontSize: 10, color: FAINT }}>{list.length}</span>
              <ChevronDown size={15} color={FAINT} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }} />
            </button>
            {open && (
              <div style={{ paddingBottom: 6 }}>
                {list.map((s) => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 2px 9px 24px", borderTop: `1px solid ${LINE}` }}>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</span>
                    <button onClick={() => copy(s.id)} title="Copy booking link" style={{ ...mono, fontSize: 10.5, letterSpacing: "0.04em", textTransform: "uppercase", padding: "7px 12px", borderRadius: 7, cursor: "pointer", border: `1px solid ${copied === s.id ? g.color : LINE}`, background: copied === s.id ? g.color : PAPER, color: copied === s.id ? "#fff" : STONE, display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0 }}>{copied === s.id ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy link</>}</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      {groupsWithServices.length > 0 && <div style={{ ...mono, fontSize: 9.5, color: FAINT, marginTop: 12, lineHeight: 1.5 }}>Times come from Availability. Set global hours there, and tag a session type's own windows to give it separate hours.</div>}
    </div>
  );
}
