"use client";
import React, { useState } from "react";
import { Copy, Check, Link2, ChevronDown } from "lucide-react";
import { GROUPS, GROUP_KEYS } from "./groups";
import { PORTAL_ROOT } from "./constants";
import { card, mono, display, INK, LINE, STONE, FAINT, PAPER, CREAM } from "./theme";

const cleanSlug = (v) => String(v || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
const shortHost = PORTAL_ROOT.replace(/^https?:\/\//, "");

export function ServiceLinks({ state, showToast, updateService }) {
  const [openGroups, setOpenGroups] = useState({});
  const [copied, setCopied] = useState("");
  const [edits, setEdits] = useState({});
  const toggle = (k) => setOpenGroups((o) => ({ ...o, [k]: !o[k] }));
  const linkFor = (s) => (s.slug ? PORTAL_ROOT + "b/" + s.slug : PORTAL_ROOT + "?s=" + s.id);
  const copy = async (s) => {
    try { await navigator.clipboard.writeText(linkFor(s)); setCopied(s.id); if (showToast) showToast("Booking link copied."); setTimeout(() => setCopied(""), 1600); }
    catch (e) { if (showToast) showToast("Select the link to copy it."); }
  };
  const slugVal = (s) => (edits[s.id] !== undefined ? edits[s.id] : s.slug || "");
  const saveSlug = async (s) => {
    const v = cleanSlug(edits[s.id]);
    setEdits((e) => { const n = { ...e }; delete n[s.id]; return n; });
    if (v === (s.slug || "") || !updateService) return;
    const r = await updateService(s.id, { slug: v });
    if (r && r.ok) { if (showToast) showToast(v ? "Link name saved." : "Custom name cleared."); }
    else if (showToast) showToast((r && r.error) || "Could not save the link name.");
  };
  const services = (state.services || []).filter((s) => s.visible !== false);
  const groupsWithServices = GROUP_KEYS.filter((k) => services.some((s) => s.group === k));

  return (
    <div style={{ ...card, marginBottom: 26, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ width: 32, height: 32, borderRadius: 8, background: CREAM, display: "inline-flex", alignItems: "center", justifyContent: "center", color: STONE, flexShrink: 0 }}><Link2 size={15} /></span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ ...display, fontWeight: 600, fontSize: 15, color: INK, display: "block" }}>Direct booking links</span>
          <span style={{ fontSize: 12, color: STONE, lineHeight: 1.45, display: "block", marginTop: 1 }}>Give each session type a short name for ads (like /mini). Clients pick a time from your availability, add extras, sign, and pay.</span>
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
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 2px 11px 24px", borderTop: `1px solid ${LINE}`, flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                      <div style={{ display: "inline-flex", alignItems: "center", marginTop: 5, border: `1px solid ${LINE}`, borderRadius: 7, overflow: "hidden", background: CREAM, maxWidth: "100%" }}>
                        <span style={{ ...mono, fontSize: 11, color: STONE, padding: "6px 2px 6px 9px", whiteSpace: "nowrap" }}>{shortHost}b/</span>
                        <input value={slugVal(s)} onChange={(e) => setEdits((ed) => ({ ...ed, [s.id]: e.target.value }))} onBlur={() => saveSlug(s)} placeholder={s.slug ? "" : "mini"} spellCheck={false} style={{ ...mono, fontSize: 11, color: INK, border: "none", outline: "none", background: "transparent", padding: "6px 9px 6px 0", width: 96 }} />
                      </div>
                    </div>
                    <button onClick={() => copy(s)} title="Copy booking link" style={{ ...mono, fontSize: 10.5, letterSpacing: "0.04em", textTransform: "uppercase", padding: "8px 13px", borderRadius: 7, cursor: "pointer", border: `1px solid ${copied === s.id ? g.color : LINE}`, background: copied === s.id ? g.color : PAPER, color: copied === s.id ? "#fff" : STONE, display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0 }}>{copied === s.id ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
      {groupsWithServices.length > 0 && <div style={{ ...mono, fontSize: 9.5, color: FAINT, marginTop: 12, lineHeight: 1.5 }}>Type a short name and it saves automatically. Leave it blank and the link still works with its longer form.</div>}
    </div>
  );
}
