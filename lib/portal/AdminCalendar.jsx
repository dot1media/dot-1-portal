// Dot One Media portal - studio month calendar (per service group) + its day cell.
import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { RED, INK, STONE, FAINT, LINE, PAPER, display, mono, cardDense, navBtn } from "./theme";
import { GROUPS, GROUP_KEYS } from "./groups";
import { fmtTime } from "./format";
import { useIsMobile } from "./hooks";

export function AdminCalendar({ state, onSelectSession }) {
  const [group, setGroup] = useState("photo");
  const today = new Date();
  const [ym, setYm] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const g = GROUPS[group];
  const isMobile = useIsMobile();
  const groupSessions = state.sessions.filter((s) => s.serviceLine === group && s.date);
  const groupHolds = state.directLinks.filter((l) => l.group === group && l.status === "active");
  const monthName = new Date(ym.y, ym.m, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const firstDow = new Date(ym.y, ym.m, 1).getDay();
  const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const iso = (d) => `${ym.y}-${String(ym.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const prev = () => setYm((p) => p.m === 0 ? { y: p.y - 1, m: 11 } : { y: p.y, m: p.m - 1 });
  const next = () => setYm((p) => p.m === 11 ? { y: p.y + 1, m: 0 } : { y: p.y, m: p.m + 1 });

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {GROUP_KEYS.map((k) => { const gg = GROUPS[k]; const active = group === k; const count = state.sessions.filter((s) => s.serviceLine === k && s.date).length; return (
          <button key={k} onClick={() => setGroup(k)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 15px", borderRadius: 8, cursor: "pointer", fontSize: 13, border: `1px solid ${active ? gg.color : LINE}`, background: active ? gg.color : PAPER, color: active ? "#fff" : STONE }}><gg.Icon size={14} /> {gg.label} <span style={{ ...mono, fontSize: 10, opacity: 0.8 }}>{count}</span></button>
        ); })}
      </div>
      <div style={{ ...cardDense, padding: isMobile ? "16px 13px" : "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><g.Icon size={17} color={g.color} /><span style={{ ...display, fontWeight: 700, fontSize: 20, color: INK }}>{g.label} Calendar</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={prev} style={navBtn}><ChevronLeft size={16} /></button>
            <span style={{ ...mono, fontSize: 12, letterSpacing: "0.06em", color: INK, minWidth: isMobile ? 96 : 140, textAlign: "center" }}>{monthName}</span>
            <button onClick={next} style={navBtn}><ChevronRight size={16} /></button>
          </div>
        </div>
        {isMobile ? (
          <AgendaList ym={ym} today={today} daysInMonth={daysInMonth} iso={iso} groupSessions={groupSessions} groupHolds={groupHolds} accent={g.color} onSelect={onSelectSession} />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} style={{ ...mono, fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", color: FAINT, textAlign: "center", padding: "4px 0 8px" }}>{d}</div>)}
            {cells.map((d, i) => {
              if (d === null) return <div key={i} style={{ minHeight: 80 }} />;
              const daySessions = groupSessions.filter((s) => s.date === iso(d));
              const dayHolds = groupHolds.filter((l) => l.date === iso(d));
              const isToday = ym.y === today.getFullYear() && ym.m === today.getMonth() && d === today.getDate();
              return <DayCell key={i} day={d} isToday={isToday} sessions={daySessions} holds={dayHolds} accent={g.color} onSelect={onSelectSession} />;
            })}
          </div>
        )}
        <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap", ...mono, fontSize: 9.5, color: FAINT }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: g.color }} /> Booked session</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, border: `1.5px dashed ${g.color}` }} /> Held slot (direct link)</span>
          <span>· Click a session to manage it</span>
        </div>
      </div>
    </div>
  );
}

function AgendaList({ ym, today, daysInMonth, iso, groupSessions, groupHolds, accent, onSelect }) {
  const rows = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const key = iso(d);
    const daySessions = groupSessions.filter((s) => s.date === key);
    const dayHolds = groupHolds.filter((l) => l.date === key);
    if (!daySessions.length && !dayHolds.length) continue;
    rows.push({ d, key, daySessions, dayHolds });
  }
  if (!rows.length) {
    return <div style={{ ...mono, fontSize: 11, color: FAINT, textAlign: "center", padding: "26px 0" }}>No sessions or held slots this month.</div>;
  }
  const dow = (d) => new Date(ym.y, ym.m, d).toLocaleDateString("en-US", { weekday: "short" });
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map(({ d, key, daySessions, dayHolds }) => {
        const isToday = ym.y === today.getFullYear() && ym.m === today.getMonth() && d === today.getDate();
        return (
          <div key={key} style={{ display: "flex", gap: 12, alignItems: "flex-start", border: `1px solid ${LINE}`, borderRadius: 9, padding: "10px 12px", background: isToday ? `color-mix(in srgb, ${accent} 8%, ${PAPER})` : PAPER }}>
            <div style={{ flexShrink: 0, width: 42, textAlign: "center" }}>
              <div style={{ ...mono, fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: FAINT }}>{dow(d)}</div>
              <div style={{ ...display, fontWeight: 700, fontSize: 20, color: isToday ? RED : INK, lineHeight: 1.1 }}>{d}</div>
            </div>
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
              {daySessions.map((sq) => (
                <button key={sq.id} onClick={() => onSelect(sq.id)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, textAlign: "left", width: "100%", cursor: "pointer", background: accent, color: "#fff", border: "none", borderRadius: 6, padding: "7px 10px" }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sq.clientName}</span>
                  {sq.time ? <span style={{ ...mono, fontSize: 9.5, opacity: 0.9, flexShrink: 0 }}>{fmtTime(sq.time)}</span> : null}
                </button>
              ))}
              {dayHolds.map((h, i) => (
                <div key={"h" + i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: PAPER, color: accent, border: `1px dashed ${accent}`, borderRadius: 6, padding: "6px 10px" }}>
                  <span style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>◌ {h.recipient || h.serviceName || "Held"}</span>
                  {h.time ? <span style={{ ...mono, fontSize: 9.5, flexShrink: 0 }}>{fmtTime(h.time)}</span> : null}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DayCell({ day, isToday, sessions, holds, accent, onSelect }) {
  const [open, setOpen] = useState(false);
  const items = [...sessions.map((s) => ({ type: "session", s })), ...(holds || []).map((h) => ({ type: "hold", h }))];
  const many = items.length > 2;
  const shown = many && !open ? items.slice(0, 1) : items;
  return (
    <div style={{ minHeight: 80, border: `1px solid ${LINE}`, borderRadius: 7, padding: 5, background: isToday ? `color-mix(in srgb, ${accent} 8%, ${PAPER})` : PAPER }}>
      <div style={{ ...mono, fontSize: 10.5, color: isToday ? RED : STONE, fontWeight: isToday ? 600 : 400, marginBottom: 3 }}>{day}</div>
      {shown.map((it, idx) => it.type === "session" ? (
        <div key={"s" + idx} onClick={() => onSelect(it.s.id)} title={it.s.clientName + " — " + it.s.type + (it.s.time ? " @ " + fmtTime(it.s.time) : "")} style={{ background: accent, color: "#fff", borderRadius: 4, padding: "2px 5px", marginBottom: 3, cursor: "pointer", fontSize: 9.5, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.s.clientName}</div>
      ) : (
        <div key={"h" + idx} title={"Held: " + it.h.serviceName + (it.h.recipient ? " for " + it.h.recipient : "") + (it.h.time ? " @ " + fmtTime(it.h.time) : "")} style={{ background: PAPER, color: accent, border: `1px dashed ${accent}`, borderRadius: 4, padding: "1px 5px", marginBottom: 3, fontSize: 9, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>◌ {it.h.recipient || "Held"}</div>
      ))}
      {many && <button onClick={() => setOpen((o) => !o)} style={{ ...mono, fontSize: 8.5, letterSpacing: "0.04em", color: accent, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>{open ? "▴ less" : `▾ ${items.length - 1} more`}</button>}
    </div>
  );
}

