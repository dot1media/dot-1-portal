// Dot One Media portal - pure formatting & session helpers.
// No React, no browser APIs. Unit-tested in tests/portal/format.test.js

export function sessionBucket(s, today) {
  const st = (s && s.status) || "active";
  if (st === "cancelled" || st === "closed") return "completed";
  const d = (s && s.date) || "";
  if (!d) return "upcoming";
  if (d < today) return "completed";
  if (d === today) return "today";
  return "upcoming";
}


export const uid = (p) => p + "_" + Math.random().toString(36).slice(2, 8);

export const fmtDate = (iso) => { if (!iso) return ""; const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }); };

export const fmtTime = (t) => { if (!t) return ""; const [h, m] = t.split(":").map(Number); const ap = h >= 12 ? "PM" : "AM"; const hh = ((h + 11) % 12) + 1; return `${hh}:${String(m).padStart(2, "0")} ${ap}`; };

export const pad2 = (n) => String(n).padStart(2, "0");

export const calDate = (date, time) => { if (!date) return ""; const [y, m, d] = date.split("-").map(Number); const [hh, mm] = (time || "00:00").split(":").map(Number); return `${y}${pad2(m)}${pad2(d)}T${pad2(hh)}${pad2(mm)}00`; };

export const addMinutes = (time, mins) => { const [h, m] = (time || "00:00").split(":").map(Number); let t = h * 60 + m + (mins || 0); t = ((t % 1440) + 1440) % 1440; return `${pad2(Math.floor(t / 60))}:${pad2(t % 60)}`; };

export const gcalLink = (session) => { const s = calDate(session.date, session.time); const e = calDate(session.date, addMinutes(session.time, session.durationMin || 60)); const text = encodeURIComponent("Dot One Media · " + (session.type || "Session")); const details = encodeURIComponent("Your session with Dot One Media. Questions? contact@dot1.media"); const loc = encodeURIComponent(session.location || ""); return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + text + "&dates=" + s + "/" + e + "&details=" + details + "&location=" + loc; };

export const icsContent = (session) => { const s = calDate(session.date, session.time); const e = calDate(session.date, addMinutes(session.time, session.durationMin || 60)); return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Dot One Media//Portal//EN", "CALSCALE:GREGORIAN", "BEGIN:VEVENT", "UID:" + (session.id || "ses") + "@dot1.media", "DTSTAMP:" + s, "DTSTART:" + s, "DTEND:" + e, "SUMMARY:Dot One Media - " + (session.type || "Session"), "DESCRIPTION:Your session with Dot One Media. Questions? contact@dot1.media", "LOCATION:" + (session.location || ""), "END:VEVENT", "END:VCALENDAR"].join("\r\n"); };

export const money = (n) => "$" + (Number(n) || 0).toLocaleString();

export const compactMoney = (n) => { n = Number(n) || 0; if (n >= 10000) return "$" + Math.round(n / 1000) + "k"; if (n >= 1000) return "$" + (n / 1000).toFixed(1) + "k"; return "$" + Math.round(n); };

export const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const monthShort = (k) => { const p = String(k).split("-"); return (MONTH_ABBR[parseInt(p[1], 10) - 1] || p[1] || "") + " " + (p[0] || "").slice(2); };

export const payKindLabel = (k) => ({ retainer: "Retainer", deposit: "Deposit", half: "Deposit", full: "Full payment", balance: "Balance", charge: "Add-on" }[String(k || "").toLowerCase()] || "Payment");

export const payCardLabel = (p) => (p && p.card_brand) ? (String(p.card_brand).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) + (p.card_last4 ? " \u00b7\u00b7\u00b7\u00b7 " + p.card_last4 : "")) : "Card";

export const payMoney = (cents) => "$" + ((Number(cents) || 0) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const payDateShort = (iso) => { try { return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Anchorage" }); } catch (e) { return ""; } };

