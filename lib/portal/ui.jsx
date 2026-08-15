// Dot One Media portal - reusable presentational UI components.
// Depend only on theme/groups/format + React + lucide (no page state). Verified by render harness.
import React, { useState, useEffect } from "react";
import { RED, INK, BODY, STONE, FAINT, LINE, PAPER, CREAM, display, mono, cardDense } from "./theme";
import { GROUPS } from "./groups";
import { fmtDate, fmtTime } from "./format";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function DonutChart({ segments, size = 148, thickness = 24, centerLabel, centerSub }) {
  const total = segments.reduce((s, x) => s + (x.value || 0), 0);
  const r = (size - thickness) / 2, cx = size / 2, cy = size / 2, circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={"0 0 " + size + " " + size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={LINE} strokeWidth={thickness} />
        {total > 0 && segments.map((seg, i) => { const len = ((seg.value || 0) / total) * circ; const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth={thickness} strokeDasharray={len + " " + (circ - len)} strokeDashoffset={-offset} transform={"rotate(-90 " + cx + " " + cy + ")"} />; offset += len; return el; })}
      </svg>
      {centerLabel !== undefined && <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}><div style={{ ...display, fontSize: 19, fontWeight: 600, color: INK }}>{centerLabel}</div>{centerSub && <div style={{ ...mono, fontSize: 8.5, letterSpacing: "0.1em", textTransform: "uppercase", color: STONE, marginTop: 1 }}>{centerSub}</div>}</div>}
    </div>
  );
}

export function HBars({ items }) {
  const max = Math.max(1, ...items.map((x) => x.value || 0));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      {items.map((x, i) => (
        <div key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 5, alignItems: "baseline" }}>
            <span style={{ ...display, fontSize: 13.5, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{x.label}</span>
            <span style={{ ...mono, fontSize: 10.5, color: STONE, flexShrink: 0, letterSpacing: "0.02em" }}>{x.right}</span>
          </div>
          <div style={{ height: 9, borderRadius: 5, background: LINE, overflow: "hidden" }}>
            <div style={{ height: "100%", width: (100 * (x.value || 0) / max) + "%", background: x.color || RED, borderRadius: 5 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MiniColumns({ items }) {
  const max = Math.max(1, ...items.map((x) => x.value || 0));
  const barArea = 96;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
      {items.map((x, i) => (
        <div key={i} style={{ flex: "1 0 36px", minWidth: 36, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
          <div style={{ ...mono, fontSize: 8.5, color: STONE, whiteSpace: "nowrap" }}>{x.top}</div>
          <div style={{ display: "flex", alignItems: "flex-end", height: barArea, width: "100%", maxWidth: 44 }}>
            <div style={{ width: "100%", background: x.color || RED, borderRadius: "4px 4px 0 0", height: Math.max(3, Math.round(barArea * (x.value || 0) / max)) }} />
          </div>
          <div style={{ ...mono, fontSize: 8.5, color: FAINT, whiteSpace: "nowrap" }}>{x.label}</div>
        </div>
      ))}
    </div>
  );
}

export function LinkRow({ label, url }) {
  return <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "5px 0", borderTop: `1px solid ${LINE}` }}><span style={{ ...mono, fontSize: 10.5, color: STONE, letterSpacing: "0.04em" }}>{label}</span>{url ? <a href={url} target="_blank" rel="noopener noreferrer" style={{ ...mono, fontSize: 10.5, color: RED, textDecoration: "none", maxWidth: "58%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</a> : <span style={{ ...mono, fontSize: 10.5, color: FAINT }}>— not set —</span>}</div>;
}

export function LinkField({ label, value, onChange, placeholder }) {
  return <div><div style={{ ...mono, fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", color: STONE, marginBottom: 4 }}>{label}</div><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", border: `1px solid ${LINE}`, borderRadius: 7, padding: "8px 11px", fontSize: 12.5, fontFamily: "'IBM Plex Mono', monospace", background: PAPER, color: BODY, boxSizing: "border-box" }} /></div>;
}

export function FieldLabel({ children }) {
  return <div style={{ ...mono, fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: STONE, marginBottom: 5, marginTop: 4 }}>{children}</div>;
}

export function TextInput({ value, onChange, placeholder, prefix }) {
  return <div style={{ display: "flex", alignItems: "center", border: `1px solid ${LINE}`, borderRadius: 8, background: PAPER, marginBottom: 12, overflow: "hidden" }}>{prefix && <span style={{ ...mono, fontSize: 13, color: STONE, padding: "0 4px 0 11px" }}>{prefix}</span>}<input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ flex: 1, border: "none", outline: "none", padding: prefix ? "9px 11px 9px 2px" : "9px 11px", fontSize: 13, fontFamily: "inherit", background: "transparent", color: BODY }} /></div>;
}

export function RadioPill({ active, onClick, label, accent }) {
  return <button onClick={onClick} style={{ ...mono, fontSize: 10.5, letterSpacing: "0.04em", padding: "7px 12px", borderRadius: 20, cursor: "pointer", border: `1px solid ${active ? accent : LINE}`, background: active ? accent : PAPER, color: active ? "#fff" : STONE }}>{label}</button>;
}

export function IconBtn({ children, onClick, danger }) {
  return <button onClick={onClick} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${LINE}`, background: PAPER, color: danger ? RED : STONE, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</button>;
}

export function EmptyHint({ text }) {
  return <div style={{ border: `1px dashed ${LINE}`, borderRadius: 10, padding: "18px", textAlign: "center", color: FAINT, fontSize: 12.5, lineHeight: 1.55, background: CREAM }}>{text}</div>;
}

export function MiniCalendar({ sessions, onSelectSession }) {
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [openDay, setOpenDay] = useState(null);
  const GOLD = "#d4a017";
  const byDay = {};
  for (const s of (sessions || [])) {
    if (!s.date || (s.status && s.status !== "active")) continue;
    const parts = s.date.split("-").map(Number);
    if (parts[0] === ym.y && parts[1] - 1 === ym.m) { const d = parts[2]; (byDay[d] = byDay[d] || []).push(s); }
  }
  for (const k in byDay) byDay[k].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  const startDow = new Date(ym.y, ym.m, 1).getDay();
  const daysIn = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysIn; d++) cells.push(d);
  const dayColor = (d) => { const arr = byDay[d]; if (!arr || arr.length === 0) return null; const lines = new Set(arr.map((s) => s.serviceLine || "video")); if (lines.size >= 2) return GOLD; return (GROUPS[Array.from(lines)[0]] || GROUPS.video).color; };
  const todayD = (now.getFullYear() === ym.y && now.getMonth() === ym.m) ? now.getDate() : -1;
  const monthName = new Date(ym.y, ym.m, 1).toLocaleString("en-US", { month: "long", year: "numeric" });
  const step = (n) => { setOpenDay(null); setYm((o) => { let m = o.m + n, y = o.y; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } return { y, m }; }); };
  const arrow = { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, borderRadius: 6, cursor: "pointer", background: "transparent", border: "1px solid " + LINE, color: STONE };
  const openList = openDay ? (byDay[openDay] || []) : [];
  return (
    <div style={{ ...cardDense, padding: "12px 13px", marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <button onClick={() => step(-1)} style={arrow} aria-label="Previous month"><ChevronLeft size={14} /></button>
        <span style={{ ...mono, fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", color: INK }}>{monthName}</span>
        <button onClick={() => step(1)} style={arrow} aria-label="Next month"><ChevronRight size={14} /></button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={"h" + i} style={{ ...mono, fontSize: 8, color: FAINT, textAlign: "center", paddingBottom: 2 }}>{d}</div>)}
        {cells.map((d, i) => {
          if (d === null) return <div key={"e" + i} />;
          const col = dayColor(d); const has = !!col; const isOpen = openDay === d;
          return <div key={"d" + i} onClick={has ? () => setOpenDay(isOpen ? null : d) : undefined} title={has ? "View sessions on this day" : ""} style={{ position: "relative", aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, borderRadius: 6, ...mono, color: col ? "#fff" : (d === todayD ? INK : STONE), background: col || "transparent", fontWeight: col ? 700 : 400, cursor: has ? "pointer" : "default", boxShadow: isOpen ? "0 0 0 2px var(--d1-ink, #1a1a17)" : "none", border: d === todayD && !col ? "1px solid " + STONE : "1px solid transparent" }}>{d}</div>;
        })}
      </div>
      {openList.length > 0 && (
        <div style={{ marginTop: 11, borderTop: "1px solid " + LINE, paddingTop: 10 }}>
          <div style={{ ...mono, fontSize: 8.5, letterSpacing: "0.1em", textTransform: "uppercase", color: STONE, marginBottom: 7 }}>{fmtDate(openList[0].date)}{openList.length > 1 ? " " + "\u00b7" + " " + openList.length + " sessions" : ""}</div>
          {openList.map((s) => { const gg = GROUPS[s.serviceLine] || GROUPS.video; return (
            <button key={s.id} onClick={() => { if (onSelectSession) onSelectSession(s.id); }} className="d1-lift" style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", borderRadius: 7, cursor: "pointer", background: CREAM, border: "1px solid " + LINE, marginBottom: 5, textAlign: "left" }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: gg.color, flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 11.5, color: INK, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.clientName}</span>
                <span style={{ display: "block", ...mono, fontSize: 8, color: STONE, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.time ? fmtTime(s.time) + " " + "\u00b7" + " " : ""}{s.type}</span>
              </span>
              <ChevronRight size={12} color={FAINT} style={{ flexShrink: 0 }} />
            </button>
          ); })}
        </div>
      )}
    </div>
  );
}

export function FontLoader() {
  useEffect(() => {
    const id = "dot1-fonts"; if (document.getElementById(id)) return;
    const l = document.createElement("link"); l.id = id; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400..700&family=Archivo:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap";
    document.head.appendChild(l);
    if (!document.getElementById("dot1-global")) {
      const s = document.createElement("style"); s.id = "dot1-global";
      s.textContent = "@keyframes d1-pop{from{opacity:0;transform:scale(.96) translateY(6px)}to{opacity:1;transform:none}}@keyframes d1-fade{from{opacity:0}to{opacity:1}}@keyframes d1-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}@keyframes d1-breathe{0%,100%{opacity:.5}50%{opacity:.95}}@keyframes d1-loadbar{0%{transform:translateX(-120%)}100%{transform:translateX(330%)}}.d1-skel{background:linear-gradient(90deg,var(--d1-line,#e2ded4),color-mix(in srgb,var(--d1-line,#e2ded4) 45%,var(--d1-paper,#fff)),var(--d1-line,#e2ded4));background-size:200% 100%;animation:d1-shimmer 1.4s ease-in-out infinite;}.d1-breathe{animation:d1-breathe 1.7s ease-in-out infinite;}.d1-loadbar{animation:d1-loadbar 1.15s cubic-bezier(.5,.1,.5,.9) infinite;}::selection{background:color-mix(in srgb, var(--d1-accent,#e23b2e) 22%, transparent);}input::placeholder,textarea::placeholder{color:var(--d1-faint,#9a988f);opacity:1;}.d1-reveal{opacity:0;transform:translateY(14px);transition:opacity .55s cubic-bezier(.2,.7,.2,1),transform .55s cubic-bezier(.2,.7,.2,1);will-change:opacity,transform;}.d1-reveal.d1-in{opacity:1;transform:none;}.d1-modal{animation:d1-pop .3s cubic-bezier(.2,.85,.3,1) both;}.d1-overlay{animation:d1-fade .22s ease both;}.d1-lift{transition:transform .16s cubic-bezier(.2,.7,.2,1),box-shadow .18s ease,border-color .16s ease;}.d1-lift:hover{transform:translateY(-2px);box-shadow:0 3px 10px rgba(26,26,23,.05),0 16px 34px rgba(26,26,23,.09);}button{transition:background-color .16s ease,border-color .16s ease,color .16s ease,box-shadow .16s ease,transform .12s ease;}button:active{transform:translateY(1px);}button:focus-visible,a:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible,[role=switch]:focus-visible{outline:2px solid color-mix(in srgb, var(--d1-accent,#e23b2e) 55%, transparent);outline-offset:2px;}@media (prefers-reduced-motion: reduce){.d1-reveal{opacity:1!important;transform:none!important;transition:none!important;}.d1-modal,.d1-overlay{animation:none!important;}.d1-lift{transition:none!important;}.d1-lift:hover{transform:none!important;}button{transition:none!important;}button:active{transform:none!important;}.d1-skel,.d1-breathe,.d1-loadbar{animation:none!important;}}";
      document.head.appendChild(s);
    }
  }, []);
  return null;
}

export function EmptyState({ icon: Icon, title, text, action, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "40px 22px", ...style }}>
      {Icon && <div style={{ width: 54, height: 54, borderRadius: 15, background: CREAM, border: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}><Icon size={23} color={STONE} /></div>}
      <div style={{ ...display, fontWeight: 600, fontSize: 18, color: INK, marginBottom: text ? 6 : 0 }}>{title}</div>
      {text && <div style={{ fontSize: 13.5, color: STONE, lineHeight: 1.55, maxWidth: 380, marginBottom: action ? 18 : 0 }}>{text}</div>}
      {action}
    </div>
  );
}

export function Avatar({ name, src, size = 40 }) {
  const initials = (name || "?").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  if (src) return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: `1px solid ${LINE}`, flexShrink: 0 }} />;
  return <div style={{ width: size, height: size, borderRadius: "50%", background: CREAM, border: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: Math.round(size * 0.32), color: STONE }}>{initials}</div>;
}

export function Skeleton({ w = "100%", h = 14, r = 8, style }) {
  return <div aria-hidden="true" className="d1-skel" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}

export function Row({ k, v, bold, sub, red }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: sub ? "3px 0" : "5px 0" }}>
      <span style={{ fontSize: sub ? 12.5 : 13.5, color: sub ? STONE : BODY, fontWeight: bold ? 600 : 400 }}>{k}</span>
      <span style={{ ...mono, fontSize: sub ? 12 : 13.5, color: red ? RED : INK, fontWeight: bold ? 600 : 400 }}>{v}</span>
    </div>
  );
}

