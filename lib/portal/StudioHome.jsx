// Dot One Media portal - studio dashboard home (stats, upcoming list, calendar).
import React from "react";
import { CalendarClock, ChevronRight, Wallet } from "lucide-react";
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
  // Sessions with money still owed: a requested deposit/retainer not yet paid
  // (full amount due), or a partial payment with a balance remaining that
  // hasn't been settled. Cancelled sessions are excluded.
  const pendingPay = live.map((sq) => {
    const total = Number(sq.total) || 0;
    const paid = sq.paymentStatus === "paid" ? (Number(sq.payAmount) || 0) : 0;
    let due = 0, kind = "";
    if (sq.paymentStatus === "pending") { due = total > 0 ? total : (Number(sq.payAmount) || 0); kind = "Awaiting payment"; }
    else if (sq.paymentStatus === "paid" && total - paid > 0 && sq.balanceStatus !== "paid") { due = total - paid; kind = sq.balanceStatus === "sent" ? "Balance link sent" : "Balance due"; }
    return { sq, due, kind };
  }).filter((x) => x.due > 0).sort((a, b) => ((a.sq.date || "9999") + (a.sq.time || "")).localeCompare((b.sq.date || "9999") + (b.sq.time || "")));
  const pendingTotal = pendingPay.reduce((n, x) => n + x.due, 0);
  const next = upcoming[0];
  // Business insights: average booking value and volume per service line, plus recent pace.
  // These are exactly the inputs the financial model needs.
  const byLine = {};
  live.forEach((s) => { const k = s.serviceLine || "other"; if (!byLine[k]) byLine[k] = { count: 0, total: 0 }; byLine[k].count += 1; byLine[k].total += Number(s.total) || 0; });
  const lineRows = Object.keys(byLine).map((k) => ({ k, count: byLine[k].count, total: byLine[k].total, avg: byLine[k].count ? byLine[k].total / byLine[k].count : 0 })).sort((a, b) => b.total - a.total);
  const d90 = new Date(now.getTime() - 90 * 86400000).toISOString().slice(0, 10);
  const recent = live.filter((s) => s.date && s.date >= d90 && s.date <= todayStr).length;
  const perMonth = recent / 3;
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
        <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 4 }}>Business insights</div>
        <div style={{ fontSize: 12, color: FAINT, marginBottom: 14 }}>Your real numbers, ready for planning. Recent pace: about {perMonth < 10 ? perMonth.toFixed(1) : Math.round(perMonth)} {perMonth === 1 ? "session" : "sessions"} per month (last 90 days).</div>
        {lineRows.length === 0 ? (
          <div style={{ fontSize: 13, color: STONE }}>No bookings yet. Insights appear here as clients book.</div>
        ) : (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1.5fr 0.8fr 1fr 1fr", ...mono, fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: FAINT, padding: "0 4px 7px" }}>
              <span>Service line</span><span style={{ textAlign: "right" }}>Bookings</span><span style={{ textAlign: "right" }}>Avg value</span><span style={{ textAlign: "right" }}>Booked</span>
            </div>
            {lineRows.map((r) => { const g = GROUPS[r.k] || GROUPS.video; return (
              <div key={r.k} style={{ display: "grid", gridTemplateColumns: "1.5fr 0.8fr 1fr 1fr", alignItems: "center", padding: "9px 4px", borderTop: `1px solid ${LINE}` }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: INK }}><span style={{ width: 8, height: 8, borderRadius: 2, background: g.color, flexShrink: 0 }} />{g.label}</span>
                <span style={{ ...mono, fontSize: 12, color: STONE, textAlign: "right" }}>{r.count}</span>
                <span style={{ ...mono, fontSize: 12.5, color: INK, textAlign: "right" }}>{money(Math.round(r.avg))}</span>
                <span style={{ ...mono, fontSize: 12, color: STONE, textAlign: "right" }}>{money(Math.round(r.total))}</span>
              </div>
            ); })}
          </div>
        )}
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
      {pendingPay.length > 0 && (
        <div style={{ ...cardDense, padding: "18px 20px", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, display: "inline-flex", alignItems: "center", gap: 8 }}><Wallet size={13} color={WARN} /> Pending payment</div>
            <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.04em", color: WARN }}>{pendingPay.length} {pendingPay.length === 1 ? "session" : "sessions"} {"\u00b7"} {money(Math.round(pendingTotal))} owed</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pendingPay.slice(0, 6).map(({ sq, due, kind }) => { const grp = GROUPS[sq.serviceLine] || GROUPS.video; return (
              <button key={sq.id} className="d1-lift" onClick={() => goTo(sq.id)} style={{ display: "flex", alignItems: "center", gap: 14, textAlign: "left", cursor: "pointer", background: CREAM, border: `1px solid ${LINE}`, borderRadius: 10, padding: "12px 14px", width: "100%" }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: grp.bg, border: `1px solid ${grp.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><grp.Icon size={17} color={grp.color} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...display, fontWeight: 600, fontSize: 15.5, color: INK }}>{sq.clientName}</div>
                  <div style={{ ...mono, fontSize: 10, color: STONE, marginTop: 2, letterSpacing: "0.04em" }}>{sq.type}{sq.date ? " " + "\u00b7" + " " + fmtDate(sq.date) : ""}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ ...mono, fontSize: 12, color: WARN, letterSpacing: "0.04em" }}>{money(Math.round(due))}</div>
                  <div style={{ ...mono, fontSize: 9, color: FAINT, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.06em" }}>{kind}</div>
                </div>
                <ChevronRight size={16} color={FAINT} />
              </button>
            ); })}
          </div>
          {pendingPay.length > 6 && <div style={{ ...mono, fontSize: 10, color: FAINT, marginTop: 10, textAlign: "center", letterSpacing: "0.04em" }}>+{pendingPay.length - 6} more in Sessions</div>}
        </div>
      )}

      <AdminCalendar state={state} onSelectSession={(id) => { setAdminId(id); setAdminTab("sessions"); }} />
    </div>
  );
}

