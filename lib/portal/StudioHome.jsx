// Dot One Media portal - studio dashboard home (stats, upcoming list, calendar).
import React from "react";
import { CalendarClock, ChevronRight } from "lucide-react";
import { RED, INK, STONE, FAINT, LINE, CREAM, OK, WARN, display, mono, card, cardDense } from "./theme";
import { GROUPS } from "./groups";
import { fmtDate, fmtTime, money, timeGreeting } from "./format";
import { curStage } from "./stages";
import { EmptyState } from "./ui";
import { AdminCalendar } from "./AdminCalendar";

export function StudioHome({ state, setAdminId, setAdminTab, dark }) {
  const sessions = state.sessions || [];
  const now = new Date();
  const todayStr = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
  const live = sessions.filter((s) => { const st = s.status || "active"; return st !== "cancelled" && st !== "closed"; });
  const upcoming = live.filter((s) => s.date && s.date >= todayStr).sort((a, b) => ((a.date || "") + (a.time || "")).localeCompare((b.date || "") + (b.time || "")));
  const collected = sessions.reduce((sum, s) => sum + (s.paymentStatus === "paid" ? (Number(s.payAmount) || 0) : 0), 0);
  const outstanding = sessions.reduce((sum, s) => { if ((s.status || "active") === "cancelled") return sum; const paid = s.paymentStatus === "paid" ? (Number(s.payAmount) || 0) : 0; return sum + Math.max(0, (Number(s.total) || 0) - paid); }, 0);
  const activeCount = sessions.filter((s) => (s.status || "active") !== "cancelled").length;
  const next = upcoming[0];
  const goTo = (id) => { setAdminId(id); setAdminTab("sessions"); };
  const stat = (val, label, color) => (
    <div style={{ ...cardDense, padding: "16px 18px" }}>
      <div style={{ ...display, fontSize: 26, color: color || INK }}>{val}</div>
      <div style={{ ...mono, fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: STONE, marginTop: 3 }}>{label}</div>
    </div>
  );
  return (
    <div className="d1-stagger">
      <div style={{ ...card, padding: "26px 28px", marginBottom: 18, display: "flex", alignItems: "center", gap: 26, flexWrap: "wrap" }}>
        <img src={dark ? "/dot1-logo-white.png" : "/dot1-logo.png"} alt="Dot One Media" style={{ height: 46, width: "auto", display: "block" }} />
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ ...mono, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: RED, marginBottom: 6 }}>{timeGreeting()}</div>
          <h2 style={{ ...display, fontWeight: 700, fontSize: 24, color: INK, letterSpacing: "-0.01em" }}>Studio Dashboard</h2>
          <div style={{ fontSize: 13.5, color: STONE, marginTop: 6, lineHeight: 1.5 }}>{upcoming.length === 0 ? "No upcoming sessions on the calendar right now. A good time to line up your next shoot." : "You have " + upcoming.length + " upcoming " + (upcoming.length === 1 ? "session" : "sessions") + "." + (next ? " Next up: " + next.clientName + "'s " + next.type + " on " + fmtDate(next.date) + (next.time ? " at " + fmtTime(next.time) : "") + "." : "")}</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(148px, 1fr))", gap: 12, marginBottom: 18 }}>
        {stat(upcoming.length, "Upcoming")}
        {stat(activeCount, "Active bookings")}
        {stat(money(Math.round(collected)), "Collected", OK)}
        {stat(money(Math.round(outstanding)), "Outstanding", outstanding > 0 ? WARN : INK)}
      </div>
      <div style={{ ...cardDense, padding: "18px 20px", marginBottom: 18 }}>
        <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 14 }}>Upcoming sessions</div>
        {upcoming.length === 0 ? (
          <EmptyState icon={CalendarClock} title="Nothing scheduled" text="New bookings appear here automatically as clients book." style={{ padding: "22px 14px" }} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {upcoming.slice(0, 5).map((s) => { const grp = GROUPS[s.serviceLine] || GROUPS.video; return (
              <button key={s.id} className="d1-lift" onClick={() => goTo(s.id)} style={{ display: "flex", alignItems: "center", gap: 14, textAlign: "left", cursor: "pointer", background: CREAM, border: `1px solid ${LINE}`, borderRadius: 10, padding: "12px 14px", width: "100%" }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: grp.bg, border: `1px solid ${grp.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><grp.Icon size={17} color={grp.color} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...display, fontWeight: 600, fontSize: 15.5, color: INK }}>{s.clientName}</div>
                  <div style={{ ...mono, fontSize: 10, color: STONE, marginTop: 2, letterSpacing: "0.04em" }}>{s.type} {"\u00b7"} {curStage(s).label}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ ...mono, fontSize: 11, color: INK, letterSpacing: "0.04em" }}>{fmtDate(s.date)}</div>
                  {s.time && <div style={{ ...mono, fontSize: 10, color: FAINT, marginTop: 2 }}>{fmtTime(s.time)}</div>}
                </div>
                <ChevronRight size={16} color={FAINT} />
              </button>
            ); })}
          </div>
        )}
      </div>
      <AdminCalendar state={state} onSelectSession={(id) => { setAdminId(id); setAdminTab("sessions"); }} />
    </div>
  );
}

