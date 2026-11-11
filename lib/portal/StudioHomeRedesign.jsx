// Dot One Media portal - studio dashboard, redesigned (Big-I-Do layout).
// Same live data as StudioHome; airy card-led layout driven by the active
// palette tokens, so it wears whatever theme is selected (incl. Declared).
import React from "react";
import { ChevronRight, Wallet, CalendarClock } from "lucide-react";
import { RED, INK, STONE, FAINT, LINE, CREAM, PAPER, OK, WARN, display, mono, card, cardDense } from "./theme";
import { GROUPS } from "./groups";
import { fmtDate, fmtTime, money, timeGreeting } from "./format";
import { curStage } from "./stages";
import { EmptyState } from "./ui";
import { AdminCalendar } from "./AdminCalendar";

export function StudioHomeRedesign({ state, setAdminId, setAdminTab, dark }) {
  const sessions = state.sessions || [];
  const now = new Date();
  const todayStr = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
  const live = sessions.filter((s) => { const st = s.status || "active"; return st !== "cancelled" && st !== "closed"; });
  const upcoming = live.filter((s) => s.date && s.date >= todayStr).sort((a, b) => ((a.date || "") + (a.time || "")).localeCompare((b.date || "") + (b.time || "")));
  const collected = sessions.reduce((sum, s) => sum + (s.paymentStatus === "paid" ? (Number(s.payAmount) || 0) : 0), 0);
  const outstanding = sessions.reduce((sum, s) => { if ((s.status || "active") === "cancelled") return sum; const paid = s.paymentStatus === "paid" ? (Number(s.payAmount) || 0) : 0; return sum + Math.max(0, (Number(s.total) || 0) - paid); }, 0);
  const activeCount = sessions.filter((s) => (s.status || "active") !== "cancelled").length;
  const next = upcoming[0];
  const dayOffset = (d) => { const [y, m, dd] = String(d).slice(0, 10).split("-").map(Number); const t = new Date(y, m - 1, dd); const n = new Date(); const a = new Date(n.getFullYear(), n.getMonth(), n.getDate()); return Math.round((t - a) / 86400000); };
  const daysToNext = next && next.date ? dayOffset(next.date) : null;

  const pendingPay = live.map((sq) => {
    const total = Number(sq.total) || 0;
    const paid = sq.paymentStatus === "paid" ? (Number(sq.payAmount) || 0) : 0;
    let due = 0, kind = "";
    if (sq.paymentStatus === "pending") { due = total > 0 ? total : (Number(sq.payAmount) || 0); kind = "Awaiting payment"; }
    else if (sq.paymentStatus === "paid" && total - paid > 0 && sq.balanceStatus !== "paid") { due = total - paid; kind = sq.balanceStatus === "sent" ? "Balance link sent" : "Balance due"; }
    return { sq, due, kind };
  }).filter((x) => x.due > 0).sort((a, b) => ((a.sq.date || "9999") + (a.sq.time || "")).localeCompare((b.sq.date || "9999") + (b.sq.time || "")));
  const pendingTotal = pendingPay.reduce((n, x) => n + x.due, 0);

  const activeDated = sessions.filter((s) => (s.status || "active") !== "cancelled" && !s.internal && s.date);
  const agUnread = sessions.filter((s) => (s.comments || []).some((c) => c && c.author === "client" && !c.read));
  const agBalances = activeDated.filter((s) => { const total = Number(s.total) || 0; const paid = s.paymentStatus === "paid" ? (Number(s.payAmount) || 0) : 0; return total - paid > 0 && s.paymentStatus === "paid" && s.balanceStatus !== "paid" && dayOffset(s.date) <= 7; });

  const byLine = {};
  live.forEach((s) => { const k = s.serviceLine || "other"; if (!byLine[k]) byLine[k] = { count: 0, total: 0 }; byLine[k].count += 1; byLine[k].total += Number(s.total) || 0; });
  const lineRows = Object.keys(byLine).map((k) => ({ k, count: byLine[k].count, total: byLine[k].total, avg: byLine[k].count ? byLine[k].total / byLine[k].count : 0 })).sort((a, b) => b.total - a.total);
  const lineMax = Math.max(1, ...lineRows.map((r) => r.total));

  const goTo = (id) => { setAdminId(id); setAdminTab("sessions"); };
  const grpOf = (s) => GROUPS[s.serviceLine] || GROUPS.video;

  // Attention feed: unread messages + balances due, then production-ish items.
  const attention = [
    ...agUnread.map((s) => ({ key: "u" + s.id, s, dot: RED, name: s.clientName || "A client", sub: "Unread message", right: "New", warn: false })),
    ...agBalances.map((s) => ({ key: "b" + s.id, s, dot: WARN, name: s.clientName || "Client", sub: (s.type || "Session") + (s.date ? " · " + fmtDate(s.date) : ""), right: money(Math.round((Number(s.total) || 0) - (Number(s.payAmount) || 0))), warn: true })),
  ];

  const pill = (bg, color, text) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, background: bg, color, padding: "5px 10px", borderRadius: 999 }}>{text}</span>
  );

  const Ring = ({ n, unit }) => {
    const C = 2 * Math.PI * 25;
    const frac = n == null ? 0 : Math.max(0.08, Math.min(1, 1 - Math.min(n, 30) / 30));
    return (
      <div style={{ position: "relative", width: 60, height: 60, flexShrink: 0 }}>
        <svg width="60" height="60" viewBox="0 0 60 60" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="30" cy="30" r="25" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="5" />
          <circle cx="30" cy="30" r="25" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - frac)} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "grid", placeContent: "center", textAlign: "center", lineHeight: 1 }}>
          <div style={{ ...display, fontSize: 18, fontWeight: 700, color: "#fff" }}>{n}</div>
          <div style={{ ...mono, fontSize: 8, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.8)" }}>{unit}</div>
        </div>
      </div>
    );
  };

  const stat = (val, label, sub, color, onClick) => (
    <div onClick={onClick} className={onClick ? "d1-lift" : undefined} style={{ ...cardDense, padding: "16px 18px", borderRadius: 16, cursor: onClick ? "pointer" : "default" }}>
      <div style={{ ...mono, fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: FAINT }}>{label}</div>
      <div style={{ ...display, fontSize: 28, fontWeight: 700, color: color || INK, letterSpacing: "-0.02em", margin: "4px 0 1px" }}>{val}</div>
      <div style={{ fontSize: 12, color: STONE, display: "flex", alignItems: "center", gap: 4 }}>{sub}{onClick ? <ChevronRight size={12} color={FAINT} /> : null}</div>
    </div>
  );

  const heroGrp = next ? grpOf(next) : GROUPS.video;
  const daysLabel = daysToNext === 0 ? "today" : daysToNext === 1 ? "tomorrow" : daysToNext + " days";

  return (
    <div className="d1-stagger">
      {/* Greeting */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ ...mono, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: RED, marginBottom: 5 }}>{timeGreeting()}</div>
        <h2 style={{ ...display, fontWeight: 700, fontSize: 28, color: INK, letterSpacing: "-0.015em" }}>Studio Dashboard</h2>
      </div>

      {/* Hero + stat grid */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)", gap: 16, marginBottom: 16, alignItems: "stretch" }} className="d1-home-top">
        {/* Hero */}
        {next ? (
          <button onClick={() => goTo(next.id)} style={{ position: "relative", minHeight: 232, borderRadius: 20, overflow: "hidden", border: `1px solid ${LINE}`, cursor: "pointer", textAlign: "left", padding: 0, color: "#fff", background: `linear-gradient(155deg, #1b1915 0%, color-mix(in srgb, ${heroGrp.color} 60%, #171318) 115%)` }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(8,7,6,0.12) 0%, rgba(8,7,6,0.1) 45%, rgba(8,7,6,0.72) 100%)" }} />
            <div style={{ position: "relative", padding: "18px 20px", display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", minHeight: 232 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <span style={{ ...mono, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.85)", background: "rgba(0,0,0,0.28)", padding: "5px 9px", borderRadius: 999 }}>Next session · 1 of {upcoming.length}</span>
                <Ring n={daysToNext} unit={daysToNext === 1 ? "day" : "days"} />
              </div>
              <div>
                <div style={{ ...display, fontWeight: 600, fontSize: 30, lineHeight: 1.02, letterSpacing: "0.005em", textShadow: "0 1px 18px rgba(0,0,0,0.4)" }}>{next.clientName}</div>
                <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.92)", marginTop: 5, fontWeight: 500 }}>{fmtDate(next.date)}{next.time ? " · " + fmtTime(next.time) : ""} · {next.type}</div>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 11 }}>
                  {pill("rgba(255,255,255,0.16)", "#fff", curStage(next).label)}
                  {next.paymentStatus === "paid"
                    ? pill("rgba(255,255,255,0.16)", "#fff", (Number(next.total) || 0) - (Number(next.payAmount) || 0) > 0 ? "Deposit paid" : "Paid in full")
                    : pill("rgba(255,255,255,0.16)", "#fff", "Payment pending")}
                </div>
              </div>
            </div>
          </button>
        ) : (
          <div style={{ ...card, borderRadius: 20, padding: "24px 22px", display: "flex", flexDirection: "column", justifyContent: "center", minHeight: 232 }}>
            <CalendarClock size={26} color={FAINT} />
            <div style={{ ...display, fontWeight: 700, fontSize: 20, color: INK, marginTop: 12 }}>No upcoming sessions</div>
            <div style={{ fontSize: 13.5, color: STONE, marginTop: 6, lineHeight: 1.5 }}>Your next booking appears here with a countdown. A good time to line up a shoot.</div>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignContent: "stretch" }}>
          {stat(upcoming.length, "Upcoming", daysToNext != null ? "Next · " + daysLabel : "Nothing scheduled", INK)}
          {stat(activeCount, "Active bookings", "On the books", INK)}
          {stat(money(Math.round(collected)), "Collected", "To date", OK)}
          {stat(money(Math.round(outstanding)), "Outstanding", outstanding > 0 ? (pendingPay.length + (pendingPay.length === 1 ? " session" : " sessions")) : "All settled", outstanding > 0 ? WARN : INK, pendingPay.length > 0 ? () => goTo(pendingPay[0].sq.id) : undefined)}
        </div>
      </div>

      {/* Needs attention + Upcoming */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 16, marginBottom: 16 }} className="d1-home-mid">
        <div style={{ ...card, borderRadius: 18, padding: "18px 20px" }}>
          <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><Wallet size={13} color={WARN} /> Needs attention</div>
          {attention.length === 0 ? (
            <div style={{ fontSize: 13, color: STONE, padding: "6px 2px" }}>You're all caught up. Nothing needs you right now.</div>
          ) : (
            <div>
              {attention.slice(0, 6).map((a) => (
                <button key={a.key} onClick={() => goTo(a.s.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 2px", background: "transparent", border: "none", borderTop: `1px solid ${LINE}`, cursor: "pointer", textAlign: "left" }}>
                  <span style={{ width: 9, height: 9, borderRadius: "50%", background: a.dot, flexShrink: 0 }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.name}</span>
                    <span style={{ display: "block", fontSize: 11.5, color: FAINT, marginTop: 1 }}>{a.sub}</span>
                  </span>
                  <span style={{ ...mono, fontSize: 11.5, fontWeight: 600, color: a.warn ? WARN : STONE, flexShrink: 0 }}>{a.right}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ ...card, borderRadius: 18, padding: "18px 20px" }}>
          <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 12 }}>Upcoming sessions</div>
          {upcoming.length === 0 ? (
            <EmptyState icon={CalendarClock} title="Nothing scheduled" text="New bookings appear here as clients book." style={{ padding: "18px 10px" }} />
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {upcoming.slice(0, 5).map((s) => { const grp = grpOf(s); return (
                <button key={s.id} onClick={() => goTo(s.id)} style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left", cursor: "pointer", background: "transparent", border: "none", borderTop: `1px solid ${LINE}`, padding: "11px 2px", width: "100%" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: grp.bg, border: `1px solid ${grp.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><grp.Icon size={16} color={grp.color} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.clientName}</div>
                    <div style={{ ...mono, fontSize: 10, color: FAINT, marginTop: 1, letterSpacing: "0.03em" }}>{s.type} · {curStage(s).label}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ ...mono, fontSize: 11, color: INK }}>{fmtDate(s.date)}</div>
                    {s.time && <div style={{ ...mono, fontSize: 10, color: FAINT, marginTop: 1 }}>{fmtTime(s.time)}</div>}
                  </div>
                </button>
              ); })}
            </div>
          )}
        </div>
      </div>

      {/* Business insights */}
      {lineRows.length > 0 && (
        <div style={{ ...card, borderRadius: 18, padding: "18px 20px", marginBottom: 16 }}>
          <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 14 }}>By service line</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {lineRows.map((r) => { const g = GROUPS[r.k] || GROUPS.video; return (
              <div key={r.k}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 5, gap: 10 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 600, color: INK }}><span style={{ width: 9, height: 9, borderRadius: 3, background: g.color, flexShrink: 0 }} />{g.label}</span>
                  <span style={{ ...mono, fontSize: 12, color: STONE }}>{money(Math.round(r.total))} · {r.count} {r.count === 1 ? "booking" : "bookings"} · {money(Math.round(r.avg))} avg</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: CREAM, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: Math.max(4, Math.round((r.total / lineMax) * 100)) + "%", borderRadius: 999, background: g.color }} />
                </div>
              </div>
            ); })}
          </div>
        </div>
      )}

      <AdminCalendar state={state} onSelectSession={(id) => { setAdminId(id); setAdminTab("sessions"); }} />

      <style>{`@media (max-width: 760px){ .d1-home-top, .d1-home-mid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
