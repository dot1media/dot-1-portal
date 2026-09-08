"use client";
import React, { useEffect, useState } from "react";
import { UserRound, X, Plus } from "lucide-react";
import { mono, INK, BODY, LINE, STONE, FAINT, PAPER, CREAM, RED } from "./theme";

const PRESETS = ["VIP", "Repeat", "Referral", "Corporate", "Rush", "Needs follow-up"];

export function ClientNotes({ email, showToast }) {
  const [tags, setTags] = useState([]);
  const [note, setNote] = useState("");
  const [count, setCount] = useState(0);
  const [tagIn, setTagIn] = useState("");
  const [loaded, setLoaded] = useState(false);
  const em = String(email || "").toLowerCase();
  useEffect(() => { setLoaded(false); if (!em) return; fetch("/api/clients/notes?email=" + encodeURIComponent(em)).then((r) => r.json()).then((d) => { setTags(d.tags || []); setNote(d.note || ""); setCount(d.sessionCount || 0); setLoaded(true); }).catch(() => setLoaded(true)); }, [em]);
  async function persist(nextTags, nextNote) {
    try { await fetch("/api/clients/notes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: em, tags: nextTags, note: nextNote }) }); } catch (e) { if (showToast) showToast("Could not save client notes."); }
  }
  const addTag = (t) => { const v = String(t || "").trim(); if (!v || tags.includes(v)) { setTagIn(""); return; } const next = [...tags, v]; setTags(next); setTagIn(""); persist(next, note); };
  const removeTag = (t) => { const next = tags.filter((x) => x !== t); setTags(next); persist(next, note); };
  if (!em || !loaded) return null;
  return (
    <div style={{ background: CREAM, border: `1px solid ${LINE}`, borderRadius: 10, padding: "14px 16px", marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
        <div style={{ ...mono, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, display: "flex", alignItems: "center", gap: 7 }}><UserRound size={13} /> Client notes <span style={{ color: FAINT }}>\u00b7 private</span></div>
        <div style={{ ...mono, fontSize: 10, color: FAINT }}>{count} session{count === 1 ? "" : "s"} with this client</div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        {tags.map((t) => <span key={t} style={{ ...mono, fontSize: 10.5, padding: "5px 9px", borderRadius: 999, background: RED, color: "#fff", display: "inline-flex", alignItems: "center", gap: 6 }}>{t}<button onClick={() => removeTag(t)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#fff", display: "inline-flex" }}><X size={11} /></button></span>)}
        {PRESETS.filter((p) => !tags.includes(p)).map((p) => <button key={p} onClick={() => addTag(p)} style={{ ...mono, fontSize: 10.5, padding: "5px 9px", borderRadius: 999, background: PAPER, border: `1px solid ${LINE}`, color: STONE, cursor: "pointer" }}>+ {p}</button>)}
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <input value={tagIn} onChange={(e) => setTagIn(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addTag(tagIn); }} placeholder="Custom tag" style={{ ...mono, fontSize: 10.5, padding: "5px 9px", borderRadius: 999, border: `1px dashed ${LINE}`, background: PAPER, color: INK, width: 110 }} />
          {tagIn && <button onClick={() => addTag(tagIn)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: STONE, display: "inline-flex" }}><Plus size={13} /></button>}
        </span>
      </div>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => persist(tags, note)} rows={2} placeholder="Private notes about this client (preferences, history, anything the team should know). Never shown to the client." style={{ width: "100%", border: `1px solid ${LINE}`, borderRadius: 8, padding: "8px 10px", fontSize: 12.5, fontFamily: "inherit", resize: "vertical", background: PAPER, color: BODY, boxSizing: "border-box" }} />
    </div>
  );
}
