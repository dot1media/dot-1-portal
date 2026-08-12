"use client";

import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import {
  CalendarCheck, FileCheck, Camera, Upload, Scissors, Eye, PackageCheck,
  CheckCircle2, User, LayoutDashboard, Send, Play, Image as ImageIcon,
  RotateCcw, Clock, MessageSquare, Film, Music, Landmark, Package,
  Plus, Trash2, Pencil, Check, AlertTriangle, Tag, Link2, ListPlus,
  Star, CreditCard, Wallet, CalendarDays, ChevronLeft, ChevronRight,
  ArrowRight, ArrowLeft, CalendarClock, X, Copy, LogIn, Sparkles,
  MessageCircle, Smartphone, Link as LinkIcon, Ban, EyeOff, XCircle, CalendarPlus, ChevronDown, Settings, Download, ListChecks, FileText, Palette, Mail,
} from "lucide-react";

// Persist to the browser's localStorage (works in a real browser, unlike the
// chat sandbox). Same shape the app expects: get -> {value}|null, set/delete async.
const storage = {
  get: async (k) => { try { const v = typeof window !== "undefined" ? window.localStorage.getItem(k) : null; return v == null ? null : { value: v }; } catch { return null; } },
  set: async (k, v) => { try { if (typeof window !== "undefined") window.localStorage.setItem(k, v); } catch {} },
  delete: async (k) => { try { if (typeof window !== "undefined") window.localStorage.removeItem(k); } catch {} },
};

/* ---------- brand tokens ---------- */
const RED = "var(--d1-accent, #e23b2e)";
const INK = "var(--d1-ink, #1a1a17)";
const BODY = "var(--d1-body, #33322d)";
const STONE = "var(--d1-stone, #6f6d65)";
const FAINT = "var(--d1-faint, #9a988f)";
const LINE = "var(--d1-line, #e2ded4)";
const PAPER = "var(--d1-paper, #ffffff)";
const CREAM = "var(--d1-cream, #f4f0e7)";

const THEME_VARS = ["--d1-accent", "--d1-cream", "--d1-paper", "--d1-line", "--d1-ink", "--d1-body", "--d1-stone", "--d1-faint"];
const THEMES = {
  default:  { name: "Warm Paper", swatch: "#e23b2e", bg: "#f4f0e7", vars: null },
  slate:    { name: "Cool Slate", swatch: "#4f5b93", bg: "#f3f4f7", vars: { "--d1-accent": "#4f5b93", "--d1-cream": "#f3f4f7", "--d1-paper": "#ffffff", "--d1-line": "#e0e2e9", "--d1-ink": "#1b1d26", "--d1-body": "#343642", "--d1-stone": "#666a78", "--d1-faint": "#9a9dab" } },
  sand:     { name: "Warm Sand", swatch: "#c26b3e", bg: "#f7f2ea", vars: { "--d1-accent": "#c26b3e", "--d1-cream": "#f7f2ea", "--d1-paper": "#fffdf9", "--d1-line": "#e8e0d2", "--d1-ink": "#241f18", "--d1-body": "#3b3529", "--d1-stone": "#726a5b", "--d1-faint": "#a49c8b" } },
  forest:   { name: "Forest", swatch: "#3f7d4f", bg: "#f1f4ef", vars: { "--d1-accent": "#3f7d4f", "--d1-cream": "#f1f4ef", "--d1-paper": "#ffffff", "--d1-line": "#dde5da", "--d1-ink": "#18201a", "--d1-body": "#313a32", "--d1-stone": "#65705f", "--d1-faint": "#9aa593" } },
  graphite: { name: "Graphite", swatch: "#2f2f2f", bg: "#f5f5f4", vars: { "--d1-accent": "#2f2f2f", "--d1-cream": "#f5f5f4", "--d1-paper": "#ffffff", "--d1-line": "#e4e4e2", "--d1-ink": "#161616", "--d1-body": "#333333", "--d1-stone": "#6a6a68", "--d1-faint": "#9c9c99" } },
  plum:     { name: "Plum", swatch: "#7c4a94", bg: "#f5f2f6", vars: { "--d1-accent": "#7c4a94", "--d1-cream": "#f5f2f6", "--d1-paper": "#ffffff", "--d1-line": "#e7e0ea", "--d1-ink": "#1f1922", "--d1-body": "#39303e", "--d1-stone": "#6e6474", "--d1-faint": "#a29aa8" } },
};
const ACCENT_SWATCHES = ["#e23b2e", "#2f74c0", "#3f7d4f", "#7c4a94", "#c26b3e", "#2f2f2f", "#0d9488", "#d4348a"];
function applyTheme(key, accent) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const t = THEMES[key] || THEMES.default;
  if (t.vars) { for (const k of THEME_VARS) root.style.setProperty(k, t.vars[k]); }
  else { for (const k of THEME_VARS) root.style.removeProperty(k); }
  if (accent) root.style.setProperty("--d1-accent", accent);
}

const display = { fontFamily: "'Bodoni Moda', Georgia, serif" };
const mono = { fontFamily: "'IBM Plex Mono', ui-monospace, monospace" };
const card = { background: PAPER, border: `1px solid ${LINE}`, borderRadius: 16, boxShadow: "0 1px 2px rgba(26,26,23,0.03), 0 12px 34px rgba(26,26,23,0.05)" };
const cardDense = { background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, boxShadow: "0 1px 2px rgba(26,26,23,0.03), 0 6px 16px rgba(26,26,23,0.045)" };
const useIsoEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const GROUPS = {
  video: { label: "Video", color: "#e23b2e", soft: "#e23b2e", bg: "#fbeeed", border: "#f2cdc9", text: "#b5271b", Icon: Film },
  photo: { label: "Photography", color: "#2f74c0", soft: "#5b9bd5", bg: "#eef5fb", border: "#cfe0f2", text: "#2f6aa0", Icon: ImageIcon },
  music: { label: "Music", color: "#9163cc", soft: "#a586d6", bg: "#f4eefb", border: "#e2d3f2", text: "#6f4aa8", Icon: Music },
  government: { label: "Government", color: "#586b2e", soft: "#6b7d40", bg: "#eef2e5", border: "#d7e0c2", text: "#47581f", Icon: Landmark },
};
const GROUP_KEYS = ["video", "photo", "music", "government"];

/* where a new-booking notification email is routed, per group */
const NOTIFY_EMAILS = {
  video: "video@dot1.media",
  photo: "photo@dot1.media",
  music: "contact@dot1.media",
  government: "contact@dot1.media",
};

const PAYMENT_RULES = {
  video: { label: "Video payment", Icon: CreditCard, options: [{ key: "retainer", label: "Pay $750 retainer now", fixed: 750 }, { key: "full", label: "Pay in full", pct: 100 }], note: "Balance due 24 hours before filming. Retainer is non-refundable.", reschedFee: 150 },
  photo: { label: "Photography payment", Icon: Wallet, options: [{ key: "full", label: "Pay in full now", pct: 100 }, { key: "half", label: "Pay 50% deposit now", pct: 50 }], note: "Payment is due before your session. A 50% deposit holds your date; the balance is due before the session start.", reschedFee: 0 },
  music: { label: "Music payment", Icon: Wallet, options: [{ key: "quote", label: "Request a quote", pct: 0 }], note: "Custom-quoted per project. No online checkout yet.", reschedFee: 0 },
  government: { label: "Government payment", Icon: Wallet, options: [{ key: "quote", label: "Request a quote", pct: 0 }], note: "Always custom-quoted and invoiced. No online checkout.", reschedFee: 0 },
};

const STAGES = [
  { key: "scheduled", label: "Session Scheduled", Icon: CalendarCheck, desc: "Your session is on the calendar. We'll review the details and confirm everything with you shortly." },
  { key: "confirmed", label: "Booked & Confirmed", Icon: FileCheck, desc: "Everything's confirmed and locked in. Next, we prepare for your session day." },
  { key: "dayof", label: "Day of Session", Icon: Camera, desc: "It's session day, when we capture everything. Afterward, we move into post-production." },
  { key: "post", label: "Post-Session", Icon: Upload, desc: "That's a wrap. Your files are safely backed up while we select the strongest moments to edit." },
  { key: "editing", label: "Editing", Icon: Scissors, desc: "The creative work is underway. We're editing and crafting your final pieces frame by frame." },
  { key: "predelivery", label: "Pre-Delivery Review", Icon: Eye, desc: "Your preview is ready to review. Take a look and tell us if you'd like any changes before final delivery." },
  { key: "delivered", label: "Final Delivery", Icon: PackageCheck, desc: "All done. Your finished work is ready and delivered below. Thank you for trusting us with your story." },
];

const CONSULT_STAGES = [
  { key: "scheduled", label: "Consultation Scheduled", Icon: CalendarCheck, desc: "Your consultation is on the calendar. We'll confirm the details with you shortly." },
  { key: "confirmed", label: "Confirmed", Icon: FileCheck, desc: "Your consultation is confirmed. We're looking forward to speaking with you." },
  { key: "complete", label: "Consultation Complete", Icon: CheckCircle2, desc: "Your consultation is complete. Thank you for meeting with us. If we discussed a project, we'll follow up with next steps." },
];
function isConsult(s) { return !!(s && /consult/i.test(s.type || "")); }
function stagesFor(s) { return isConsult(s) ? CONSULT_STAGES : STAGES; }
function curStage(s) { const st = stagesFor(s); return st[Math.min(Math.max((s && s.currentStage) || 0, 0), st.length - 1)] || st[0]; }
function sessionBucket(s, today) {
  const st = (s && s.status) || "active";
  if (st === "cancelled" || st === "closed") return "completed";
  const d = (s && s.date) || "";
  if (!d) return "upcoming";
  if (d < today) return "completed";
  if (d === today) return "today";
  return "upcoming";
}

const GOOGLE_REVIEW_URL = "https://g.page/r/Ceb1aSxQSvm6EBM/review/";
const ADMINS = ["video@dot1.media", "photo@dot1.media"]; // studio login accounts
const PORTAL_BASE = "https://portal.dot1.media/book/";
const STORAGE_KEY = "dot1_portal_v4";
const uid = (p) => p + "_" + Math.random().toString(36).slice(2, 8);

const fmtDate = (iso) => { if (!iso) return ""; const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }); };
const fmtTime = (t) => { if (!t) return ""; const [h, m] = t.split(":").map(Number); const ap = h >= 12 ? "PM" : "AM"; const hh = ((h + 11) % 12) + 1; return `${hh}:${String(m).padStart(2, "0")} ${ap}`; };
const pad2 = (n) => String(n).padStart(2, "0");
const calDate = (date, time) => { if (!date) return ""; const [y, m, d] = date.split("-").map(Number); const [hh, mm] = (time || "00:00").split(":").map(Number); return `${y}${pad2(m)}${pad2(d)}T${pad2(hh)}${pad2(mm)}00`; };
const addMinutes = (time, mins) => { const [h, m] = (time || "00:00").split(":").map(Number); let t = h * 60 + m + (mins || 0); t = ((t % 1440) + 1440) % 1440; return `${pad2(Math.floor(t / 60))}:${pad2(t % 60)}`; };
const gcalLink = (session) => { const s = calDate(session.date, session.time); const e = calDate(session.date, addMinutes(session.time, session.durationMin || 60)); const text = encodeURIComponent("Dot One Media · " + (session.type || "Session")); const details = encodeURIComponent("Your session with Dot One Media. Questions? contact@dot1.media"); const loc = encodeURIComponent(session.location || ""); return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + text + "&dates=" + s + "/" + e + "&details=" + details + "&location=" + loc; };
const icsContent = (session) => { const s = calDate(session.date, session.time); const e = calDate(session.date, addMinutes(session.time, session.durationMin || 60)); return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Dot One Media//Portal//EN", "CALSCALE:GREGORIAN", "BEGIN:VEVENT", "UID:" + (session.id || "ses") + "@dot1.media", "DTSTAMP:" + s, "DTSTART:" + s, "DTEND:" + e, "SUMMARY:Dot One Media - " + (session.type || "Session"), "DESCRIPTION:Your session with Dot One Media. Questions? contact@dot1.media", "LOCATION:" + (session.location || ""), "END:VEVENT", "END:VCALENDAR"].join("\r\n"); };
const downloadIcs = (session) => { try { const blob = new Blob([icsContent(session)], { type: "text/calendar;charset=utf-8" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "dot-one-media-session.ics"; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 1500); } catch (e) {} };
const money = (n) => "$" + (Number(n) || 0).toLocaleString();
const compactMoney = (n) => { n = Number(n) || 0; if (n >= 10000) return "$" + Math.round(n / 1000) + "k"; if (n >= 1000) return "$" + (n / 1000).toFixed(1) + "k"; return "$" + Math.round(n); };
const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthShort = (k) => { const p = String(k).split("-"); return (MONTH_ABBR[parseInt(p[1], 10) - 1] || p[1] || "") + " " + (p[0] || "").slice(2); };
const payKindLabel = (k) => ({ retainer: "Retainer", deposit: "Deposit", half: "Deposit", full: "Full payment", balance: "Balance", charge: "Add-on" }[String(k || "").toLowerCase()] || "Payment");
const payCardLabel = (p) => (p && p.card_brand) ? (String(p.card_brand).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) + (p.card_last4 ? " \u00b7\u00b7\u00b7\u00b7 " + p.card_last4 : "")) : "Card";
const payMoney = (cents) => "$" + ((Number(cents) || 0) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const payDateShort = (iso) => { try { return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Anchorage" }); } catch (e) { return ""; } };

const DEFAULT_STATE = {
  sessions: [],
  takenSlots: [],
  services: [],
  addons: [],
  availability: [],
  directLinks: [],
};

const PHOTO_CATEGORIES = ["Destination Photography", "Event Photography", "Portrait Photography"];
const CLIENT_SERVICES_VERSION = "1.0";
const RELEASE_VERSION = "1.0";
const PDF_CLIENT_SERVICES = "/Dot-One-Media-Client-Services-Agreement.pdf";
const PDF_RELEASE = "/Dot-One-Media-Release-and-Waiver.pdf";
const PDF_MINOR = "/Dot-One-Media-Minor-Release-and-Waiver.pdf";
const DOC_META = {
  client_services: { label: "Client Services Agreement", pdf: PDF_CLIENT_SERVICES },
  media_release: { label: "Media Release & Waiver", pdf: PDF_RELEASE },
  minor_release: { label: "Minor Release & Waiver", pdf: PDF_MINOR },
};
const DOC_USAGE = { A: "Portfolio Use", B: "Full Commercial Use", C: "Private Use" };
const BRIEF_FIELDS = [
  { key: "objective", label: "Project objective", help: "What should this project accomplish?" },
  { key: "audience", label: "Audience", help: "Who needs to see this, and what should they feel or do?" },
  { key: "keyMessages", label: "Key messages", help: "What must viewers understand or remember?" },
  { key: "visualDirection", label: "Visual direction", help: "Look and feel, tone, and any references or examples." },
  { key: "participants", label: "People / participants", help: "Who will be filmed or photographed? Names and roles." },
  { key: "locations", label: "Locations", help: "Where will we work? Address, parking, and access notes." },
  { key: "requirements", label: "Special requirements", help: "Wardrobe, accessibility, safety, timing, or anything else." },
];

const CLIENT_SERVICES_SUMMARY = `Key terms for your booking. The full agreement is linked below.

Payment. Full payment is due no later than the start of your session; for video, the balance is due at least 24 hours before the filming date. We don't begin work or deliver until the payment due at that stage is paid in full.

Video sessions. A non-refundable $750 retainer is due at booking to reserve your date. Reschedule with at least 3 days' notice for a $150 fee (your retainer transfers). Fewer than 3 days' notice is treated as a cancellation.

Photography sessions. No retainer; the full session fee is due at or before your session. You may reschedule once with at least 24 hours' notice at no charge. Less notice, or cancelling, forfeits the fee.

No-shows & late payment. Missing a session without notice forfeits payments made. If we proceed despite an unpaid balance, a $100/day late fee (up to 7 days) may apply.

Travel. Video includes travel within 50 miles of the Mat-Su Valley; photography includes within 25 minutes of Eagle River. Beyond that, a travel add-on or $0.52/mile applies.

Deliverables & style. You're booking our creative style. We deliver the strongest images and footage, not every frame. Photography images may be purged after 6 months, so please download promptly.

Copyright. Dot One Media retains copyright; you receive a personal-use license unless a commercial license is arranged.

Liability is limited to the amount you paid for the project. Governed by Alaska law.`;

const RELEASE_SUMMARY = `Media release and liability waiver for adults (18 and over). The full document is linked below.

You consent to being photographed and filmed, and to the capture of your name, likeness, image, and voice.

Dot One Media owns the copyright in the content; you receive use rights according to the choice you make below.

You choose how your images and video may be used (Option A, B, or C below).

You waive the right to pre-approve the finished content, and you release Dot One Media from claims arising from the permitted uses and from ordinary session risks.

Liability is limited to the amount paid for the session. Governed by Alaska law.

If the person being photographed is under 18, check the box above and a parent or guardian will sign the Minor Release instead.`;

const MINOR_SUMMARY = `Media release and liability waiver for a child under 18, signed by the parent or legal guardian. The full document is linked below.

You confirm you are the parent or legal guardian, with authority to sign for the child.

You consent, on the child's behalf, to the child being photographed and filmed.

Dot One Media owns the copyright; use of the child's images follows the choice you make below.

Dot One Media will not publish the child's full name or identifying details without your separate permission, and will use only a first name or no name in permitted uses.

You release Dot One Media, on your and the child's behalf, from claims arising from the permitted uses and ordinary session risks. Liability is limited to the amount paid.`;

const USAGE_OPTIONS = [
  { key: "A", label: "Portfolio & Marketing (default)", desc: "Dot One Media may use the content to promote its own business, including its website, social media, portfolio, samples, competition entries, and its own advertising. It will not sell or license your images to unrelated third parties." },
  { key: "B", label: "Full Commercial Use", desc: "In addition to Option A, Dot One Media may license, sell, or assign the content to third parties for commercial purposes, without further compensation." },
  { key: "C", label: "Private / Limited Use", desc: "Dot One Media may use the content only to deliver your finished project, and may not publish your images publicly, except as you note below." },
];

export default function App() {
  const [view, setView] = useState("landing");   // landing | client | admin | book | login | studiologin
  const [adminTab, setAdminTab] = useState("home"); // home | sessions | calendar | services | links
  const [state, setState] = useState(DEFAULT_STATE);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);
  const poppingRef = useRef(false);
  const initedRef = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientAuth, setClientAuth] = useState(null);
  const [resetToken, setResetToken] = useState("");
  const [guideSeen, setGuideSeen] = useState(true);
  const [themeKey, setThemeKey] = useState("default");
  const [customAccent, setCustomAccent] = useState("");
  const [themeOpen, setThemeOpen] = useState(false);
  const [adminId, setAdminId] = useState("");
  const [directContext, setDirectContext] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    (async () => {
      try { const r = await storage.get(STORAGE_KEY); if (r && r.value) { const p = JSON.parse(r.value); if (p) { const { sessions, takenSlots, ...rest } = p; setState((prev) => ({ ...prev, ...rest })); } } } catch (e) {}
      setLoaded(true);
    })();
  }, []);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [catalogError, setCatalogError] = useState(false);
  useEffect(() => { if (!loaded) return; (async () => { try { const { services, addons, availability, sessions, takenSlots, ...rest } = state; await storage.set(STORAGE_KEY, JSON.stringify(rest)); } catch (e) {} })(); }, [state, loaded]);
  useEffect(() => { (async () => { try { const res = await fetch("/api/services"); const data = await res.json(); if (!res.ok) throw new Error(); setState((s) => ({ ...s, services: data.services || [], addons: data.addons || [] })); setCatalogError(false); } catch (e) { setCatalogError(true); } finally { setCatalogLoaded(true); } })(); }, []);
  useEffect(() => { (async () => { try { const a = await fetch("/api/auth/me").then((r) => r.json()).catch(() => null); if (a && a.admin) { setView("admin"); const sd = await fetch("/api/sessions").then((r) => r.json()).catch(() => ({})); if (sd && sd.sessions) setState((s) => ({ ...s, sessions: sd.sessions })); return; } const c = await fetch("/api/client-me").then((r) => r.json()).catch(() => null); if (c && c.client && c.email) { setClientAuth({ name: "", email: c.email }); const sd = await fetch("/api/sessions").then((r) => r.json()).catch(() => ({})); const sess = (sd && sd.sessions) || []; if (sess.length) { setClientAuth({ name: sess[0].clientName || "", email: c.email }); setState((s) => ({ ...s, sessions: sess })); setClientId(sess[0].id); setView("client"); } } } catch (e) {} })(); }, []);
  useEffect(() => { (async () => { try { const res = await fetch("/api/availability"); const data = await res.json(); if (res.ok) setState((s) => ({ ...s, availability: data.availability || [] })); } catch (e) {} })(); }, []);
  useEffect(() => { (async () => { try { const res = await fetch("/api/sessions?slots=1"); const data = await res.json(); if (res.ok) setState((s) => ({ ...s, takenSlots: data.takenSlots || [] })); } catch (e) {} })(); }, []);
  const refreshSlots = async () => { try { const res = await fetch("/api/sessions?slots=1"); const data = await res.json(); if (res.ok) setState((s) => ({ ...s, takenSlots: data.takenSlots || [] })); } catch (e) {} };
  useEffect(() => {
    const paidSid = new URLSearchParams(window.location.search).get("paid");
    if (!paidSid) return;
    (async () => {
      let res = {};
      const payKind = new URLSearchParams(window.location.search).get("kind") || "";
      try { res = await fetch("/api/pay/verify?sid=" + encodeURIComponent(paidSid) + (payKind ? "&kind=" + encodeURIComponent(payKind) : "")).then((r) => r.json()).catch(() => ({})); } catch (e) {}
      try { const sd = await fetch("/api/sessions").then((r) => r.json()).catch(() => ({})); const sess = (sd && sd.sessions) || []; if (sess.length) { setState((s) => ({ ...s, sessions: sess })); const mine = sess.find((x) => x.id === paidSid) || sess[0]; setClientId(mine.id); setClientAuth({ name: mine.clientName || "", email: mine.clientEmail || "" }); setView("thankyou"); } } catch (e) {}
      showToast(res && res.paid ? "Payment received. Thank you!" : "Thanks! If your payment is still processing, your status will update shortly.");
    })();
  }, []);
  useEffect(() => {
    const rt = new URLSearchParams(window.location.search).get("reset");
    if (rt) { setResetToken(rt); setView("resetpw"); }
  }, []);
  useEffect(() => { try { setGuideSeen(localStorage.getItem("dot1_guide_seen") === "1"); } catch (e) {} }, []);
  useEffect(() => { try { const k = localStorage.getItem("dot1_theme_key") || "default"; const a = localStorage.getItem("dot1_theme_accent") || ""; setThemeKey(k); setCustomAccent(a); applyTheme(k, a); } catch (e) {} }, []);
  useEffect(() => { applyServerTheme(); }, []);
  useEffect(() => {
    if (poppingRef.current) { poppingRef.current = false; return; }
    const st = { view };
    if (!initedRef.current) { initedRef.current = true; try { window.history.replaceState(st, "", "/"); } catch (e) {} }
    else { try { window.history.pushState(st, "", "/"); } catch (e) {} }
  }, [view]);
  useEffect(() => {
    const onPop = (e) => { poppingRef.current = true; setView((e.state && e.state.view) || "landing"); };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const showToast = (msg) => { setToast(msg); if (toastTimer.current) clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(null), 3600); };

  const saveSessionPatch = (id, patch) => { fetch("/api/sessions", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, patch }) }).catch(() => {}); };
  const patchSession = (id, patch) => { setState((s) => ({ ...s, sessions: s.sessions.map((x) => (x.id === id ? { ...x, ...patch } : x)) })); saveSessionPatch(id, patch); };

  const doSetStage = (id, idx) => { const cur = stateRef.current.sessions.find((x) => x.id === id); if (!cur) return; const times = { ...cur.stageTimes }; if (times[idx] === undefined) times[idx] = "just now"; patchSession(id, { currentStage: idx, stageTimes: times }); };

  const requestSetStage = (session, idx) => {
    if (idx === session.currentStage) return;
    const advancing = idx > session.currentStage;
    setConfirm({
      title: advancing ? "Advance this session?" : "Move this session back?",
      message: advancing ? `Advance ${session.clientName} to "${(stagesFor(session)[idx] || {}).label}"? This will send a status email to the client.` : `Move ${session.clientName} back to "${(stagesFor(session)[idx] || {}).label}"? No email is sent when moving backward.`,
      confirmLabel: advancing ? "Advance & notify" : "Move back", danger: !advancing,
      onYes: () => { doSetStage(session.id, idx); if (advancing) showToast(`Status email sent to ${session.clientName} — "${(stagesFor(session)[idx] || {}).label}"`); setConfirm(null); },
    });
  };

  const addComment = (id, author, body, silent) => {
    if (!body.trim()) return;
    const cur = stateRef.current.sessions.find((x) => x.id === id);
    if (!cur) return;
    const comments = [...cur.comments, { author, body: body.trim(), time: "just now", read: false }];
    patchSession(id, { comments });
    if (!silent && author === "client") showToast("Message sent — the studio has been notified by email.");
    if (!silent && author === "studio") showToast("Reply sent — the client has been notified by email.");
  };
  const markMessagesRead = (id, who) => { const cur = stateRef.current.sessions.find((x) => x.id === id); if (!cur || !cur.comments.some((c) => c.author === who && !c.read)) return; const comments = cur.comments.map((c) => (c.author === who ? { ...c, read: true } : c)); patchSession(id, { comments }); };
  const resizeImage = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 320; let w = img.width, h = img.height;
        if (w > h && w > max) { h = Math.round(h * max / w); w = max; }
        else if (h > max) { w = Math.round(w * max / h); h = max; }
        const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject; img.src = reader.result;
    };
    reader.onerror = reject; reader.readAsDataURL(file);
  });

  const adminReschedule = (session, newIso, newTime) => { patchSession(session.id, { date: newIso, time: newTime || session.time }); addComment(session.id, "studio", `Session rescheduled to ${fmtDate(newIso)}${newTime ? " at " + fmtTime(newTime) : ""}.`, true); showToast(`Reschedule confirmation email sent to ${session.clientName}.`); };

  const clientRescheduleRequest = (session, newIso) => { const fee = PAYMENT_RULES[session.serviceLine]?.reschedFee || 0; const feeText = fee > 0 ? ` (a ${money(fee)} reschedule fee applies)` : " (no fee)"; addComment(session.id, "client", `Reschedule requested for ${fmtDate(newIso)}${feeText}.`, true); showToast(fee > 0 ? `Request sent — a ${money(fee)} reschedule fee applies.` : "Reschedule request sent (no fee)."); };

  const addService = async (svc) => { try { const res = await fetch("/api/services", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(svc) }); const data = await res.json().catch(() => ({})); if (res.ok && data.service) { setState((s) => ({ ...s, services: [...s.services, data.service] })); return { ok: true }; } return { ok: false, error: data.error || "Could not save the service." }; } catch (e) { return { ok: false, error: "Network error." }; } };
  const updateService = async (id, patch) => { try { const res = await fetch("/api/services", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, ...patch }) }); const data = await res.json().catch(() => ({})); if (res.ok && data.service) { setState((s) => ({ ...s, services: s.services.map((x) => (x.id === id ? data.service : x)) })); return { ok: true }; } return { ok: false, error: data.error || "Could not update the service." }; } catch (e) { return { ok: false, error: "Network error." }; } };
  const deleteService = async (id) => { try { const res = await fetch("/api/services?id=" + encodeURIComponent(id), { method: "DELETE" }); const data = await res.json().catch(() => ({})); if (res.ok) { setState((s) => ({ ...s, services: s.services.filter((x) => x.id !== id) })); return { ok: true }; } return { ok: false, error: data.error || "Could not delete the service." }; } catch (e) { return { ok: false, error: "Network error." }; } };
  const addAddon = async (a) => { try { const res = await fetch("/api/addons", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(a) }); const data = await res.json().catch(() => ({})); if (res.ok && data.addon) { setState((s) => ({ ...s, addons: [...s.addons, data.addon] })); return { ok: true }; } return { ok: false, error: data.error || "Could not save the add-on." }; } catch (e) { return { ok: false, error: "Network error." }; } };
  const updateAddon = async (id, patch) => { try { const res = await fetch("/api/addons", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, ...patch }) }); const data = await res.json().catch(() => ({})); if (res.ok && data.addon) { setState((s) => ({ ...s, addons: s.addons.map((x) => (x.id === id ? data.addon : x)) })); return { ok: true }; } return { ok: false, error: data.error || "Could not update the add-on." }; } catch (e) { return { ok: false, error: "Network error." }; } };
  const deleteAddon = async (id) => { try { const res = await fetch("/api/addons?id=" + encodeURIComponent(id), { method: "DELETE" }); const data = await res.json().catch(() => ({})); if (res.ok) { setState((s) => ({ ...s, addons: s.addons.filter((x) => x.id !== id) })); return { ok: true }; } return { ok: false, error: data.error || "Could not delete the add-on." }; } catch (e) { return { ok: false, error: "Network error." }; } };

  /* ---- slot availability + direct links ---- */
  const addAvailability = async (slot) => { try { const res = await fetch("/api/availability", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(slot) }); const data = await res.json().catch(() => ({})); if (res.ok && data.slot) { setState((s) => ({ ...s, availability: [...s.availability, data.slot].sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)) })); return { ok: true }; } return { ok: false, error: data.error || "Could not open that day." }; } catch (e) { return { ok: false, error: "Network error." }; } };
  const removeAvailability = async (id) => { try { const res = await fetch("/api/availability?id=" + encodeURIComponent(id), { method: "DELETE" }); const data = await res.json().catch(() => ({})); if (res.ok) { setState((s) => ({ ...s, availability: s.availability.filter((x) => x.id !== id) })); return { ok: true }; } return { ok: false, error: data.error || "Could not remove that day." }; } catch (e) { return { ok: false, error: "Network error." }; } };
  const slotTaken = (date, time, exceptSessionId) => {
    if (!date || !time) return false;
    const inSlots = (state.takenSlots || []).some((t) => t.id !== exceptSessionId && t.date === date && t.time === time);
    const inLinks = state.directLinks.some((l) => l.date === date && l.time === time);
    return inSlots || inLinks;
  };

  const createDirectLink = (payload) => {
    if (slotTaken(payload.date, payload.time)) return { ok: false, error: "That date and time is already reserved. Choose another slot." };
    const link = { id: uid("dl"), token: "dl_" + Math.random().toString(36).slice(2, 9).toUpperCase(), status: "active", createdAt: Date.now(), ...payload };
    setState((s) => ({ ...s, directLinks: [link, ...s.directLinks] }));
    return { ok: true, link };
  };
  const revokeDirectLink = (id) => setState((s) => ({ ...s, directLinks: s.directLinks.filter((l) => l.id !== id) }));
  const consumeDirectLink = (id) => setState((s) => ({ ...s, directLinks: s.directLinks.map((l) => (l.id === id ? { ...l, status: "used" } : l)) }));
  const openDirectLink = (link) => { setDirectContext(link); setView("book"); };

  const createBooking = (booking) => {
    const id = uid("ses"); const grp = booking.group;
    const notifyEmail = NOTIFY_EMAILS[grp] || "contact@dot1.media";
    const newSession = { id, clientName: booking.name, clientEmail: booking.email, clientImage: "", notifyEmail, type: booking.serviceName, serviceLine: grp, photographer: grp === "photo" ? "Brittany Matthews" : "Dennis Matthews", date: booking.date, time: booking.time, location: "", status: "active", durationMin: booking.duration || 60, apptMin: booking.apptMin || booking.duration || 60, padBefore: booking.padBefore || 0, padAfter: booking.padAfter || 0, currentStage: 0, stageTimes: { 0: "just now" }, comments: [], selectedAddons: booking.addons, total: booking.total, payChoice: booking.payChoice, paymentStatus: (booking.payAmount || 0) > 0 ? "pending" : "none", payAmount: booking.payAmount || 0, reviewLink: "", deliveryVideo: "", deliveryPhoto: "" };
    setState((s) => ({ ...s, sessions: [...s.sessions, newSession] }));
    fetch("/api/sessions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ session: newSession }) }).catch(() => {});
    if (booking.linkId) consumeDirectLink(booking.linkId);
    setDirectContext(null); setClientId(id); setClientAuth({ name: booking.name, email: (booking.email || "").toLowerCase() });
    if ((booking.payAmount || 0) > 0) { payForBooking(id, booking.payAmount, booking.serviceName || GROUPS[grp].label, booking.payChoice); }
    else { setView("thankyou"); }
  };
  const payForBooking = async (sessionId, amount, label, payChoice) => {
    try {
      const res = await fetch("/api/pay", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId, amount, label, payChoice }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) { window.location.href = data.url; return; }
      setView("client");
      showToast(data.configured === false ? "Booking confirmed. We'll reach out to arrange payment." : (data.error ? ("Payment could not start. " + data.error) : "Booking confirmed. Checkout could not start."));
    } catch (e) { setView("client"); showToast("Booking confirmed."); }
  };

  const loginAs = async (email, password) => {
    const res = await fetch("/api/client-login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: (email || "").trim(), password: password || "" }) }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    if (!res || !res.ok) { showToast(data.error || "Incorrect email or password."); return; }
    const sd = await fetch("/api/sessions").then((r) => r.json()).catch(() => ({}));
    const sess = (sd && sd.sessions) || [];
    setState((s) => ({ ...s, sessions: sess }));
    setClientAuth({ name: (data.name) || (sess[0] && sess[0].clientName) || "", email: (email || "").trim().toLowerCase() });
    if (sess.length) { setClientId(sess[0].id); setView("client"); showToast("Welcome back, " + sess[0].clientName + "!"); }
    else { setClientId(""); setView("client"); showToast("Signed in. You don't have any sessions yet."); }
    applyServerTheme();
  };
  const loginAsStudio = async (email, password) => {
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: (email || "").trim(), password: password || "" }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) { setView("admin"); const sd = await fetch("/api/sessions").then((r) => r.json()).catch(() => ({})); if (sd && sd.sessions) setState((s) => ({ ...s, sessions: sd.sessions })); applyServerTheme(); showToast("Signed in to the studio dashboard."); return { ok: true }; }
      return { ok: false, error: data.error || "Incorrect email or password." };
    } catch (e) {
      return { ok: false, error: "Could not reach the server. Please try again." };
    }
  };
  const adminLogout = async () => { try { await fetch("/api/auth/logout", { method: "POST" }); } catch (e) {} setState((s) => ({ ...s, sessions: [] })); setAdminId(""); setView("landing"); resetThemeLocal(); showToast("Signed out of the studio."); };
  const clientLogout = async () => { try { await fetch("/api/client-logout", { method: "POST" }); } catch (e) {} setState((s) => ({ ...s, sessions: [] })); setClientId(""); setClientAuth(null); resetThemeLocal(); setView("landing"); showToast("Signed out."); };
  const setTheme = (key, accent) => { setThemeKey(key); setCustomAccent(accent || ""); applyTheme(key, accent || ""); try { localStorage.setItem("dot1_theme_key", key); localStorage.setItem("dot1_theme_accent", accent || ""); } catch (e) {} try { fetch("/api/theme", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ key, accent: accent || "" }) }); } catch (e) {} };
  const applyServerTheme = async () => { try { const r = await fetch("/api/theme"); const d = await r.json().catch(() => ({})); if (r.ok && d && d.theme) { const k = d.theme.key || "default"; const a = d.theme.accent || ""; setThemeKey(k); setCustomAccent(a); applyTheme(k, a); try { localStorage.setItem("dot1_theme_key", k); localStorage.setItem("dot1_theme_accent", a); } catch (e) {} } } catch (e) {} };
  const resetThemeLocal = () => { applyTheme("default", ""); setThemeKey("default"); setCustomAccent(""); try { localStorage.removeItem("dot1_theme_key"); localStorage.removeItem("dot1_theme_accent"); } catch (e) {} };
  const requestReset = async (email) => { try { await fetch("/api/reset-request", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: (email || "").trim() }) }); } catch (e) {} };
  const requestSendBalance = async (session) => { try { const res = await fetch("/api/pay-balance", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId: session.id }) }); const data = await res.json().catch(() => ({})); if (res.ok) { showToast("Balance payment link emailed to " + session.clientEmail + "."); setState((s) => ({ ...s, sessions: s.sessions.map((x) => x.id === session.id ? { ...x, balanceStatus: "sent" } : x) })); } else { showToast(data.error || "Could not send the balance link."); } } catch (e) { showToast("Network error."); } };
  const requestSendCharge = async (session, label, amountDollars) => { try { const res = await fetch("/api/charge", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId: session.id, label, amount: amountDollars }) }); const data = await res.json().catch(() => ({})); if (res.ok && data.charge) { showToast("Payment request sent to " + session.clientEmail + "."); setState((s) => ({ ...s, sessions: s.sessions.map((x) => x.id === session.id ? { ...x, charges: [...(x.charges || []), data.charge] } : x) })); return { ok: true }; } else { showToast(data.error || "Could not send the payment request."); return { ok: false }; } } catch (e) { showToast("Network error."); return { ok: false }; } };

  const resetDemo = () => setConfirm({ title: "Reset the demo?", message: "This clears all sessions, services, add-ons, and booking links back to the starting state.", confirmLabel: "Reset everything", danger: true, onYes: async () => { setState(DEFAULT_STATE); try { await storage.delete(STORAGE_KEY); } catch (e) {} showToast("Demo reset."); setConfirm(null); } });
  const requestCancelBooking = (session) => setConfirm({ title: "Cancel this booking?", message: "This marks " + session.clientName + "'s " + session.type + " as cancelled. The client will see it as cancelled in their portal.", confirmLabel: "Cancel booking", danger: true, onYes: () => { patchSession(session.id, { status: "cancelled" }); showToast("Booking cancelled."); setConfirm(null); } });
  const requestCloseBooking = (session) => setConfirm({ title: "Close this booking?", message: "This closes " + session.clientName + "'s " + session.type + " for a no-show or payment issue. It will be marked closed.", confirmLabel: "Close booking", danger: true, onYes: () => { patchSession(session.id, { status: "closed" }); showToast("Booking closed."); setConfirm(null); } });
  const requestReopenBooking = (session) => { patchSession(session.id, { status: "active" }); showToast("Booking reopened."); };
  const requestDeleteBooking = (session) => setConfirm({ title: "Delete this booking?", message: "This permanently removes " + session.clientName + "'s " + session.type + " from your studio. This cannot be undone.", confirmLabel: "Delete permanently", danger: true, onYes: async () => { setConfirm(null); try { const res = await fetch("/api/sessions?id=" + encodeURIComponent(session.id), { method: "DELETE" }); const data = await res.json().catch(() => ({})); if (res.ok) { setState((s) => ({ ...s, sessions: s.sessions.filter((x) => x.id !== session.id) })); if (adminId === session.id) setAdminId(""); showToast("Booking deleted."); } else { showToast(data.error || "Could not delete the booking."); } } catch (e) { showToast("Network error."); } } });

  const clientSession = state.sessions.find((s) => s.id === clientId) || state.sessions[0] || null;
  const unreadClientTotal = state.sessions.reduce((n, s) => n + s.comments.filter((c) => c.author === "client" && !c.read).length, 0);

  return (
    <div style={{ background: CREAM, minHeight: "100vh", fontFamily: "'Archivo', system-ui, sans-serif", color: BODY, WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}>
      <FontLoader />
      <header style={{ borderBottom: `1px solid ${LINE}`, background: PAPER, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <img src="/dot1-logo-gray.png" alt="Dot One Media" style={{ height: 32, width: "auto", display: "block" }} />
            <span style={{ ...mono, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: FAINT }}>Client Portal</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {(view === "admin" || view === "client" || view === "thankyou") && <button onClick={() => setThemeOpen(true)} title="Appearance" aria-label="Appearance" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 7, cursor: "pointer", color: STONE, background: "transparent", border: `1px solid ${LINE}`, padding: 0 }}><Palette size={15} /></button>}
            {view === "admin" ? (
              <>
                <span style={{ ...mono, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE }}>Studio</span>
                <button onClick={adminLogout} style={{ ...mono, fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: STONE, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 6, padding: "8px 12px", cursor: "pointer" }}>Sign out</button>
              </>
            ) : (view === "client" || view === "thankyou") ? (
              <>
                <span style={{ ...mono, fontSize: 10, letterSpacing: "0.08em", color: STONE }}>{(clientSession && clientSession.clientName) || "Signed in"}</span>
                <button onClick={() => { setDirectContext(null); setView("book"); }} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 7, cursor: "pointer", fontSize: 12.5, border: `1px solid ${RED}`, background: "#fff", color: RED, fontWeight: 500 }}><Plus size={14} /> Book Again</button>
                <button onClick={clientLogout} style={{ ...mono, fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: STONE, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 6, padding: "8px 12px", cursor: "pointer" }}>Sign out</button>
              </>
            ) : (
              <>
                <button onClick={() => setView("landing")} title="Portal home" style={{ ...mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: view === "landing" ? INK : STONE, background: "transparent", border: `1px solid ${view === "landing" ? INK : LINE}`, borderRadius: 6, padding: "8px 10px", cursor: "pointer" }}>Home</button>
                <button onClick={() => { setDirectContext(null); setView("book"); }} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 7, cursor: "pointer", fontSize: 12.5, border: `1px solid ${RED}`, background: view === "book" ? RED : "#fff", color: view === "book" ? "#fff" : RED, fontWeight: 500 }}><Plus size={14} /> Book a Session</button>
                <button onClick={() => setView("login")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 7, cursor: "pointer", fontSize: 12.5, border: `1px solid ${view === "login" ? INK : LINE}`, background: view === "login" ? INK : PAPER, color: view === "login" ? "#fff" : STONE }}><LogIn size={13} /> Log in</button>
              </>
            )}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "28px 22px 60px" }}>
        {view === "landing" && <LandingPage onBook={() => { setDirectContext(null); setView("book"); }} onClientLogin={() => setView("login")} onStudioLogin={() => setView("studiologin")} />}
        {view === "studiologin" && <StudioLogin onLogin={loginAsStudio} onBack={() => setView("landing")} />}
        {view === "book" && <BookingFlow state={state} direct={directContext} slotTaken={slotTaken} onCancel={() => { setDirectContext(null); setView("landing"); }} onComplete={createBooking} onLogin={() => setView("login")} catalogLoaded={catalogLoaded} catalogError={catalogError} availability={state.availability} authedClient={clientAuth} refreshSlots={refreshSlots} />}
        {view === "login" && <LoginView onLogin={loginAs} onBook={() => { setDirectContext(null); setView("book"); }} onStudio={() => setView("studiologin")} onForgot={requestReset} />}
        {view === "resetpw" && <ResetPassword token={resetToken} onDone={() => setView("login")} showToast={showToast} />}
        {view === "client" && <ClientView session={clientSession} sessions={state.sessions} clientId={clientId} setClientId={setClientId} addComment={addComment} onRescheduleRequest={clientRescheduleRequest} markMessagesRead={markMessagesRead} patchSession={patchSession} resizeImage={resizeImage} showToast={showToast} />}
        {view === "thankyou" && <ThankYou session={clientSession} onPortal={() => setView("client")} />}
        {view === "client" && !guideSeen && clientSession && <ClientGuide onClose={() => { setGuideSeen(true); try { localStorage.setItem("dot1_guide_seen", "1"); } catch (e) {} }} />}
        {themeOpen && <ThemePicker themeKey={themeKey} customAccent={customAccent} onPick={(k, a) => setTheme(k, a)} onClose={() => setThemeOpen(false)} />}
        {view === "admin" && (
          <div>
            <div style={{ display: "flex", gap: 6, marginBottom: 24, borderBottom: `1px solid ${LINE}`, flexWrap: "wrap" }}>
              <SubTab active={adminTab === "home"} onClick={() => setAdminTab("home")} label="Home" />
              <SubTab active={adminTab === "sessions"} onClick={() => setAdminTab("sessions")} label="Sessions" badge={unreadClientTotal} />
              <SubTab active={adminTab === "calendar"} onClick={() => setAdminTab("calendar")} label="Calendar" />
              <SubTab active={adminTab === "links"} onClick={() => setAdminTab("links")} label="Direct Booking Link" />
              <SubTab active={adminTab === "availability"} onClick={() => setAdminTab("availability")} label="Availability" />
              <SubTab active={adminTab === "services"} onClick={() => setAdminTab("services")} label="Services & Add-ons" />
              <SubTab active={adminTab === "business"} onClick={() => setAdminTab("business")} label="Business Settings" />
            </div>
            {adminTab === "home" && <StudioHome state={state} setAdminId={setAdminId} setAdminTab={setAdminTab} />}
            {adminTab === "sessions" && <AdminSessions state={state} adminId={adminId} setAdminId={setAdminId} requestSetStage={requestSetStage} addComment={addComment} patchSession={patchSession} onReschedule={adminReschedule} slotTaken={slotTaken} markMessagesRead={markMessagesRead} onCancelBooking={requestCancelBooking} onCloseBooking={requestCloseBooking} onReopenBooking={requestReopenBooking} onSendBalance={requestSendBalance} onSendCharge={requestSendCharge} onDeleteBooking={requestDeleteBooking} />}
            {adminTab === "calendar" && <AdminCalendar state={state} onSelectSession={(id) => { setAdminId(id); setAdminTab("sessions"); }} />}
            {adminTab === "links" && <DirectLinks state={state} createDirectLink={createDirectLink} revokeDirectLink={revokeDirectLink} openDirectLink={openDirectLink} showToast={showToast} />}
            {adminTab === "availability" && <><CalendarSync showToast={showToast} /><AvailabilityManager availability={state.availability} addAvailability={addAvailability} removeAvailability={removeAvailability} showToast={showToast} /></>}
            {adminTab === "services" && <ServiceCatalog state={state} addService={addService} updateService={updateService} deleteService={deleteService} addAddon={addAddon} updateAddon={updateAddon} deleteAddon={deleteAddon} showToast={showToast} setConfirm={setConfirm} />}
            {adminTab === "business" && <BusinessSettings sessions={state.sessions} showToast={showToast} />}
          </div>
        )}
      </main>
      <PortalFooter />

      {toast && <div style={{ position: "fixed", bottom: 44, left: "50%", transform: "translateX(-50%)", background: INK, color: "#fff", padding: "11px 18px", borderRadius: 8, boxShadow: "0 10px 30px rgba(0,0,0,0.25)", fontSize: 13.5, maxWidth: "92%", display: "flex", alignItems: "center", gap: 9, zIndex: 60 }}><CheckCircle2 size={16} color="#7ee0a0" /> {toast}</div>}
      {confirm && <ConfirmDialog {...confirm} onCancel={() => setConfirm(null)} />}
      <RevealController dep={view + "|" + adminTab + "|" + clientId} />
    </div>
  );
}

/* ============================ LANDING (first-use entry) ============================ */
function ThankYou({ session, onPortal }) {
  const grp = session ? (GROUPS[session.serviceLine] || GROUPS.video) : GROUPS.video;
  const paid = session && session.paymentStatus === "paid";
  const isPhoto = session && session.serviceLine === "photo";
  return (
    <div style={{ maxWidth: 580, margin: "0 auto", padding: "44px 24px 40px", textAlign: "center" }}>
      <div style={{ marginBottom: 26 }}><img src={isPhoto ? "/dot1-photo-logo.png" : "/dot1-logo.png"} alt="Dot One Media" style={{ height: isPhoto ? 52 : 44, width: "auto", margin: "0 auto", display: "block" }} />{isPhoto && <div style={{ ...mono, fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: "#2f74c0", textAlign: "center", marginTop: 6 }}>Timeless Portraits</div>}</div>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: grp.bg, border: `1.5px solid ${grp.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
        <Check size={27} color={grp.color} />
      </div>
      <div style={{ ...mono, fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: grp.color, marginBottom: 14 }}>Booking Confirmed</div>
      <h1 style={{ ...display, fontWeight: 700, fontSize: 31, color: INK, lineHeight: 1.15, marginBottom: 14 }}>Thank you for booking with Dot One Media</h1>
      {session && (
        <div style={{ fontSize: 15, color: BODY, lineHeight: 1.6, marginBottom: paid ? 8 : 4 }}>
          Your <strong style={{ color: INK }}>{session.type}</strong> is booked{session.date ? " for " + fmtDate(session.date) : ""}{session.time ? " at " + fmtTime(session.time) : ""}.
        </div>
      )}
      {paid && <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "#3f7a3f", marginBottom: 4 }}>Payment received</div>}
      <p style={{ fontSize: 14, color: BODY, lineHeight: 1.65, maxWidth: 460, margin: "14px auto 28px" }}>
        We've emailed your confirmation, and your client portal is ready. Sign in anytime with your email and password to follow your project from booking through final delivery.
      </p>
      <button onClick={onPortal} style={{ ...btnSolid, background: grp.color, fontSize: 15, padding: "13px 28px", margin: "0 auto" }}>Go to my portal <ArrowRight size={16} /></button>
      <div style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: FAINT, marginTop: 22 }}>portal.dot1.media</div>
    </div>
  );
}

function ResetPassword({ token, onDone, showToast }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (pw.length < 6) { showToast("Password must be at least 6 characters."); return; }
    if (pw !== pw2) { showToast("Those passwords don't match."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/reset", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, password: pw }) });
      const data = await res.json().catch(() => ({}));
      setBusy(false);
      if (res.ok) { showToast("Password updated. You can sign in now."); onDone(); }
      else { showToast(data.error || "Could not reset your password."); }
    } catch (e) { setBusy(false); showToast("Network error."); }
  };
  return (
    <div style={{ maxWidth: 400, margin: "20px auto 0" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ ...display, fontWeight: 700, fontSize: 28, color: INK, marginBottom: 6 }}>Set a new password</div>
        <div style={{ fontSize: 13.5, color: STONE, lineHeight: 1.5 }}>Choose a new password for your portal.</div>
      </div>
      <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, padding: "22px 24px" }}>
        <FieldLabel>New password</FieldLabel>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 6 characters" style={inputStyle} />
        <FieldLabel>Confirm password</FieldLabel>
        <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} placeholder="Re-enter your password" style={inputStyle} />
        <button onClick={submit} disabled={busy} style={{ ...btnSolid, background: busy ? FAINT : RED, width: "100%", justifyContent: "center", marginTop: 14, padding: "11px" }}>{busy ? "Saving..." : "Update password"}</button>
      </div>
    </div>
  );
}

function PortalFooter() {
  const link = { color: STONE, textDecoration: "none" };
  const A = (href, label) => <a href={href} target="_blank" rel="noopener noreferrer" style={link}>{label}</a>;
  return (
    <footer style={{ borderTop: `1px solid ${LINE}`, marginTop: 54, padding: "40px 24px 34px", textAlign: "center" }}>
      <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 16 }}>Wasilla, Alaska · USA</div>
      <div style={{ ...mono, fontSize: 11, letterSpacing: "0.04em", display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap", marginBottom: 26 }}>
        {A("https://instagram.com/dot1media", "Instagram · @dot1media")}
        {A("https://instagram.com/dot1photo", "Instagram · @dot1photo")}
        {A("https://apps.apple.com/us/app/dot-1-news/id6757212352", "Dot 1 News · App Store")}
      </div>
      <img src="/dot1-logo.png" alt="Dot One Media" style={{ height: 34, width: "auto", margin: "0 auto 10px", display: "block" }} />
      <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: INK, marginBottom: 24 }}>Dot One Media · Create with purpose.</div>
      <div style={{ fontSize: 11.5, display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        {A("https://www.dot1.media/privacy-policy", "Privacy Policy")}
        {A("https://www.dot1.media/Dot-One-Media-Client-Services-Agreement.pdf", "Client Services Agreement")}
        {A("https://www.dot1.media/Dot-One-Media-Release-and-Waiver.pdf", "Media Release")}
        {A("https://www.dot1.media/Dot-One-Media-Minor-Release-and-Waiver.pdf", "Minor Release")}
      </div>
      <div style={{ fontSize: 10.5, color: FAINT, lineHeight: 1.65, maxWidth: 660, margin: "0 auto" }}>
        Copyright © 2026 DOT ONE LLC. All Rights Reserved. DOT ONE®, DOT ONE MEDIA PRODUCTIONS™, and associated logos are trademarks or registered trademarks of DOT ONE LLC and/or its affiliates. Unauthorized use, reproduction, or distribution of this material, in whole or in part, without written permission from DOT ONE LLC or its parent company Dot One Media Inc. is strictly prohibited.
      </div>
    </footer>
  );
}

function useIsMobile() {
  const [m, setM] = useState(typeof window !== "undefined" && window.innerWidth < 640);
  useEffect(() => {
    const on = () => setM(window.innerWidth < 640);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return m;
}

function LandingPage({ onBook, onClientLogin, onStudioLogin }) {
  const isMobile = useIsMobile();
  return (
    <div className="d1-stagger" style={{ maxWidth: 760, margin: "10px auto 0" }}>
      <div style={{ textAlign: "center", padding: "20px 0 4px" }}>
        <div style={{ marginBottom: 10 }}><img src={isMobile ? "/dot1-logo.png" : "/dot1-logo-anim.gif"} alt="Dot One Media" style={{ height: isMobile ? 84 : 186, width: "auto", margin: "0 auto", display: "block" }} /></div>
        <div style={{ ...mono, fontSize: 11, letterSpacing: "0.24em", textTransform: "uppercase", color: FAINT, marginBottom: 22 }}>Client Portal</div>
        <h1 style={{ ...display, fontWeight: 700, fontSize: isMobile ? 29 : 40, color: INK, lineHeight: 1.1, letterSpacing: "0", marginBottom: 14 }}>Your project,<br />start to finish.</h1>
        <p style={{ fontSize: 15.5, color: BODY, lineHeight: 1.6, maxWidth: 520, margin: "0 auto 30px" }}>
          Book a session, then follow every step from the shoot to your final delivery, all in one place. Welcome to your studio's home for the work we make together.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <button onClick={onBook} style={{ textAlign: "left", cursor: "pointer", background: RED, border: "none", borderRadius: 14, padding: "22px 24px", color: "#fff" }}>
          <Sparkles size={22} style={{ marginBottom: 12 }} />
          <div style={{ ...display, fontWeight: 700, fontSize: 20, marginBottom: 4 }}>Book a session</div>
          <div style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.92 }}>New here? Choose your service and set up your account in a couple of minutes.</div>
          <div style={{ ...mono, fontSize: 11, letterSpacing: "0.06em", marginTop: 14, display: "flex", alignItems: "center", gap: 6 }}>Get started <ArrowRight size={13} /></div>
        </button>
        <button onClick={onClientLogin} style={{ textAlign: "left", cursor: "pointer", background: PAPER, border: `1px solid ${LINE}`, borderRadius: 14, padding: "22px 24px", color: INK }}>
          <User size={22} color="#6f6d65" style={{ marginBottom: 12 }} />
          <div style={{ ...display, fontWeight: 700, fontSize: 20, marginBottom: 4 }}>Client login</div>
          <div style={{ fontSize: 13, lineHeight: 1.5, color: STONE }}>Already booked with us? Sign in to check the status of your session.</div>
          <div style={{ ...mono, fontSize: 11, letterSpacing: "0.06em", marginTop: 14, color: STONE, display: "flex", alignItems: "center", gap: 6 }}>Sign in <ArrowRight size={13} /></div>
        </button>
      </div>

      <button onClick={onStudioLogin} style={{ width: "100%", textAlign: "center", cursor: "pointer", background: CREAM, border: `1px solid ${LINE}`, borderRadius: 12, padding: "13px", color: STONE, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, ...mono, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        <LayoutDashboard size={14} /> Studio login
      </button>
    </div>
  );
}

/* ============================ STUDIO LOGIN ============================ */
function StudioLogin({ onLogin, onBack }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const submit = async () => {
    if (!email.trim() || !pw) { setErr("Enter your studio email and password."); return; }
    setErr(""); setBusy(true);
    const r = await onLogin(email, pw);
    setBusy(false);
    if (r && !r.ok) setErr(r.error || "Sign in failed.");
  };
  return (
    <div style={{ maxWidth: 400, margin: "20px auto 0" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ width: 46, height: 46, borderRadius: "50%", background: INK, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><LayoutDashboard size={22} color="#fff" /></div>
        <div style={{ ...display, fontWeight: 700, fontSize: 26, color: INK, marginBottom: 6 }}>Studio Login</div>
        <div style={{ fontSize: 13.5, color: STONE, lineHeight: 1.5 }}>For Dot One Media staff only.</div>
      </div>
      <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, padding: "22px 24px" }}>
        <FieldLabel>Studio email</FieldLabel>
        <TextInput value={email} onChange={setEmail} placeholder="you@dot1.media" />
        <FieldLabel>Password</FieldLabel>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} placeholder="Your password" style={{ width: "100%", border: `1px solid ${LINE}`, borderRadius: 8, padding: "10px 12px", fontSize: 14, fontFamily: "inherit", background: PAPER, color: BODY, boxSizing: "border-box" }} />
        {err && <div style={{ marginTop: 10, fontSize: 12.5, color: "#b5271b", display: "flex", alignItems: "center", gap: 7 }}><AlertTriangle size={13} /> {err}</div>}
        <button onClick={submit} disabled={busy} style={{ ...btnSolid, background: busy ? FAINT : INK, width: "100%", justifyContent: "center", marginTop: 14, padding: "11px" }}><LogIn size={15} /> {busy ? "Signing in..." : "Sign in to studio"}</button>
      </div>
      <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: STONE }}><span onClick={onBack} style={{ color: RED, cursor: "pointer" }}>← Back to portal home</span></div>
    </div>
  );
}

/* ============================ CLIENT LOGIN ============================ */
function LoginView({ onLogin, onBook, onStudio, onForgot }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [mode, setMode] = useState("login");
  const [sent, setSent] = useState(false);
  if (mode === "forgot") {
    return (
      <div style={{ maxWidth: 400, margin: "20px auto 0" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ ...display, fontWeight: 700, fontSize: 28, color: INK, marginBottom: 6 }}>Reset your password</div>
          <div style={{ fontSize: 13.5, color: STONE, lineHeight: 1.5 }}>Enter your email and we'll send you a reset link.</div>
        </div>
        <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, padding: "22px 24px" }}>
          {sent ? (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <Check size={26} color="#3f7a3f" style={{ marginBottom: 10 }} />
              <div style={{ fontSize: 13.5, color: BODY, lineHeight: 1.6 }}>If that email is registered, a reset link is on its way. Check your inbox (and spam) — the link works for one hour.</div>
            </div>
          ) : (
            <>
              <FieldLabel>Email</FieldLabel>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && email.trim()) { onForgot(email); setSent(true); } }} placeholder="you@example.com" style={inputStyle} />
              <button onClick={() => { if (!email.trim()) return; onForgot(email); setSent(true); }} style={{ ...btnSolid, background: RED, width: "100%", justifyContent: "center", marginTop: 14, padding: "11px" }}>Send reset link</button>
            </>
          )}
        </div>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: STONE }}>
          <span onClick={() => { setMode("login"); setSent(false); }} style={{ color: RED, cursor: "pointer" }}>Back to login</span>
        </div>
      </div>
    );
  }
  return (
    <div style={{ maxWidth: 400, margin: "20px auto 0" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ ...display, fontWeight: 700, fontSize: 28, color: INK, marginBottom: 6 }}>Client Login</div>
        <div style={{ fontSize: 13.5, color: STONE, lineHeight: 1.5 }}>Sign in to check the status of your session.</div>
      </div>
      <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, padding: "22px 24px" }}>
        <FieldLabel>Email</FieldLabel>
        <TextInput value={email} onChange={setEmail} placeholder="you@example.com" />
        <FieldLabel>Password</FieldLabel>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && email.trim() && pw) onLogin(email, pw); }} placeholder="Your password" style={inputStyle} />
        <button onClick={() => { if (!email.trim() || !pw) return; onLogin(email, pw); }} style={{ ...btnSolid, background: RED, width: "100%", justifyContent: "center", marginTop: 14, padding: "11px" }}><LogIn size={15} /> Log in</button>
        <div style={{ textAlign: "center", marginTop: 12 }}><span onClick={() => { setMode("forgot"); setSent(false); }} style={{ ...mono, fontSize: 10.5, letterSpacing: "0.04em", color: STONE, cursor: "pointer" }}>Forgot password?</span></div>
      </div>
      <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: STONE }}>
        New here? <span onClick={onBook} style={{ color: RED, cursor: "pointer" }}>Book a session</span>{onStudio ? <span> · <span onClick={onStudio} style={{ color: STONE, cursor: "pointer" }}>Studio login</span></span> : null}
      </div>
    </div>
  );
}

/* ============================ BOOKING FLOW ============================ */
function AgreementBox({ title, text, pdf, A }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 6 }}>{title}</div>
      <div style={{ maxHeight: 170, overflowY: "auto", border: `1px solid ${LINE}`, borderRadius: 9, padding: "13px 15px", background: PAPER, fontSize: 12.5, lineHeight: 1.55, color: BODY, whiteSpace: "pre-wrap" }}>{text}</div>
      <a href={pdf} target="_blank" rel="noopener noreferrer" style={{ ...mono, fontSize: 10.5, letterSpacing: "0.04em", color: A, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginTop: 6 }}><FileCheck size={12} /> Read the full agreement (PDF)</a>
    </div>
  );
}

function BookingFlow({ state, direct, slotTaken, onCancel, onComplete, onLogin, catalogLoaded, catalogError, availability, authedClient, refreshSlots }) {
  const [step, setStep] = useState(direct ? 2 : 0); // 0 welcome, 1 choose, 2 account, 3 confirm
  const [group, setGroup] = useState(direct?.group || "video");
  const [serviceId, setServiceId] = useState(direct?.serviceId || null);
  const [addonIds, setAddonIds] = useState([]);
  const [openCats, setOpenCats] = useState({});
  const [openDesc, setOpenDesc] = useState({});
  const [holdId, setHoldId] = useState("");
  const holdRef = useRef("");
  const [acct, setAcct] = useState({ name: (authedClient && authedClient.name) || direct?.recipient || "", email: (authedClient && authedClient.email) || "", phone: "", password: "", signature: "" });
  const [date, setDate] = useState(direct?.date || "");
  const [time, setTime] = useState(direct?.time || "");
  const [payChoice, setPayChoice] = useState(null);
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState("");
  const [isMinor, setIsMinor] = useState(false);
  const [usage, setUsage] = useState("A");
  const [child, setChild] = useState({ name: "", age: "", relationship: "" });
  const [exception, setException] = useState("");
  const submitAccount = async () => {
    setSubmitErr("");
    if (!authedClient) {
      if (!acct.name.trim() || !acct.email.trim()) { setSubmitErr("Please enter your name and email."); return; }
      if (!acct.password || acct.password.length < 6) { setSubmitErr("Create a password of at least 6 characters."); return; }
    }
    if (isMinor && (!child.name.trim() || !child.age.trim() || !child.relationship.trim())) { setSubmitErr("Please add the child's name, age, and your relationship to the child."); return; }
    if (!agree || !acct.signature.trim()) { setSubmitErr("Type your full legal name and check the box to sign."); return; }
    setSubmitting(true);
    try {
      if (!authedClient) {
        const ures = await fetch("/api/users", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: acct.name.trim(), email: acct.email.trim(), phone: (acct.phone || "").trim(), password: acct.password }) });
        const udata = await ures.json();
        if (!ures.ok) throw new Error(udata.error || "Could not create your account.");
      }
      const releaseType = isMinor ? "minor_release" : "media_release";
      const details = isMinor
        ? { childName: child.name.trim(), childAge: child.age.trim(), relationship: child.relationship.trim(), exception: usage === "C" ? exception.trim() : "" }
        : { exception: usage === "C" ? exception.trim() : "" };
      const signEmail = authedClient ? authedClient.email : acct.email.trim();
      const agreements = authedClient
        ? [ { type: releaseType, version: RELEASE_VERSION, usageOption: usage, details } ]
        : [ { type: "client_services", version: CLIENT_SERVICES_VERSION }, { type: releaseType, version: RELEASE_VERSION, usageOption: usage, details } ];
      const ares = await fetch("/api/agreements", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: signEmail, signedName: acct.signature.trim(), agreements }) });
      if (!ares.ok) { const d = await ares.json().catch(() => ({})); throw new Error(d.error || "Could not record your signature."); }
      setStep(3);
    } catch (e) {
      setSubmitErr((e && e.message) || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const groupServices = state.services.filter((s) => s.group === group && s.visible !== false);
  const catalogService = state.services.find((s) => s.id === serviceId) || null;
  const service = catalogService || (direct ? { id: direct.serviceId, name: direct.serviceName, price: direct.price, addonMode: "group", addonIds: [] } : null);
  const groupAddons = state.addons.filter((a) => a.group === group && a.visible !== false);
  const availableAddons = service ? (service.addonMode === "custom" ? groupAddons.filter((a) => (service.addonIds || []).includes(a.id)) : groupAddons) : [];
  const chosenAddons = availableAddons.filter((a) => addonIds.includes(a.id));
  const basePrice = Number(service?.price) || 0;
  const addonMinutes = chosenAddons.reduce((s, a) => s + (Number(a.addTime) || 0), 0);
  const apptLen = ((Number(service?.duration) || 0) + addonMinutes) || 30;
  const padB = Number(service?.padBefore) || 0;
  const padA = Number(service?.padAfter) || 0;
  const acquireHold = async (d, t) => {
    try {
      const res = await fetch("/api/hold", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ date: d, time: t, apptMin: apptLen, padBefore: padB, padAfter: padA, holdId }) });
      const data = await res.json().catch(() => ({}));
      if (data && data.holdId) setHoldId(data.holdId);
    } catch (e) {}
  };
  const releaseHold = () => { if (holdId) { try { fetch("/api/hold?id=" + encodeURIComponent(holdId), { method: "DELETE" }); } catch (e) {} setHoldId(""); } };
  useEffect(() => { holdRef.current = holdId; }, [holdId]);
  useEffect(() => { return () => { if (holdRef.current) { try { fetch("/api/hold?id=" + encodeURIComponent(holdRef.current), { method: "DELETE", keepalive: true }); } catch (e) {} } }; }, []);
  useEffect(() => { if (step === 3 && refreshSlots) refreshSlots(); }, [step]);
  const total = basePrice + chosenAddons.reduce((s, a) => s + (Number(a.price) || 0), 0);
  const rules = PAYMENT_RULES[group];
  const A = GROUPS[group].color, AB = GROUPS[group].bg, ABD = GROUPS[group].border, AT = GROUPS[group].text;
  const taken = !direct && slotTaken(date, time);

  const stepLabel2 = authedClient ? "Sign Release" : "Account";
  const stepDefs = direct ? [{ n: 2, label: stepLabel2 }, { n: 3, label: "Confirm & Pay" }] : [{ n: 1, label: "Choose" }, { n: 2, label: stepLabel2 }, { n: 3, label: "Confirm & Pay" }];

  /* STEP 0 — WELCOME */
  const renderServiceBtn = (s) => { const sel = serviceId === s.id; const dOpen = !!openDesc[s.id]; return (
    <div key={s.id} role="button" tabIndex={0} onClick={() => { setServiceId(s.id); setAddonIds([]); }} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setServiceId(s.id); setAddonIds([]); } }} style={{ width: "100%", textAlign: "left", marginBottom: 10, padding: "15px 17px", borderRadius: 10, cursor: "pointer", border: `1.5px solid ${sel ? GROUPS[group].color : LINE}`, background: sel ? AB : PAPER }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <span style={{ ...display, fontWeight: 600, fontSize: 17, color: INK }}>{s.name}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span style={{ ...mono, fontSize: 14, color: A, fontWeight: 500 }}>{s.price ? money(s.price) : "Quote"}</span>
          {s.description && <button onClick={(e) => { e.stopPropagation(); setOpenDesc((o) => ({ ...o, [s.id]: !o[s.id] })); }} aria-label={dOpen ? "Hide details" : "Show details"} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 7, cursor: "pointer", color: STONE, background: dOpen ? LINE : "transparent", border: "none", padding: 0 }}><ChevronDown size={16} style={{ transform: dOpen ? "rotate(180deg)" : "none", transition: "transform 200ms" }} /></button>}
        </div>
      </div>
      {s.description && dOpen && <div style={{ fontSize: 12.5, color: BODY, lineHeight: 1.5, marginTop: 9 }}>{s.description}</div>}
    </div>
  ); };

  const availDates = Array.from(new Set((availability || []).map((a) => a.date)));
  const slotsForDate = (d) => {
    const wins = (availability || []).filter((a) => a.date === d);
    const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
    const fromMin = (mm) => String(Math.floor(mm / 60)).padStart(2, "0") + ":" + String(mm % 60).padStart(2, "0");
    const blocked = (state.takenSlots || []).filter((b) => b.date === d).map((b) => { const bs = toMin(b.time); return [bs - (Number(b.padBefore) || 0), bs + (Number(b.apptMin) || 30) + (Number(b.padAfter) || 0)]; }).concat((state.directLinks || []).filter((l) => l.date === d).map((l) => { const ls = toMin(l.time); return [ls, ls + apptLen]; }));
    const out = [];
    wins.forEach((w) => { const ws = toMin(w.start), we = toMin(w.end); for (let T = ws; T + apptLen <= we; T += 15) { const occStart = T - padB, occEnd = T + apptLen + padA; if (!blocked.some((iv) => occStart < iv[1] && occEnd > iv[0])) out.push(fromMin(T)); } });
    return Array.from(new Set(out)).sort();
  };

  if (step === 0) {
    return (
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ ...mono, fontSize: 10.5, color: STONE, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><X size={13} /> Close</button>
        </div>
        <div style={{ textAlign: "center", padding: "10px 0 6px" }}>
          <div style={{ ...mono, fontSize: 11, letterSpacing: "0.24em", textTransform: "uppercase", color: RED, marginBottom: 14 }}>Dot One Media</div>
          <h1 style={{ ...display, fontWeight: 700, fontSize: 40, color: INK, lineHeight: 1.05, letterSpacing: "-0.02em", marginBottom: 16 }}>Let's create<br />something worth keeping.</h1>
          <p style={{ fontSize: 15, color: BODY, lineHeight: 1.6, maxWidth: 500, margin: "0 auto 8px" }}>
            Booking with us takes just a couple of minutes. You'll choose your session, set up an account, and from that moment you can follow your project every step of the way, right through to final delivery.
          </p>
        </div>

        <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, padding: "20px 22px", margin: "22px 0" }}>
          <div style={{ ...mono, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 16, textAlign: "center" }}>What to expect after you book</div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 6, flexWrap: "wrap" }}>
            {STAGES.map((st, i) => { const St = st.Icon; return (
              <div key={st.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: "1 1 12%", minWidth: 74 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: i === 0 ? RED : CREAM, border: `1.5px solid ${i === 0 ? RED : LINE}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <St size={17} color={i === 0 ? "#fff" : STONE} />
                </div>
                <span style={{ ...mono, fontSize: 8.5, letterSpacing: "0.03em", textAlign: "center", color: STONE, lineHeight: 1.3 }}>{st.label}</span>
              </div>
            ); })}
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <button onClick={() => setStep(1)} style={{ ...btnSolid, background: RED, fontSize: 13, padding: "13px 28px", margin: "0 auto", display: "inline-flex" }}><Sparkles size={16} /> Book your session</button>
          <div style={{ marginTop: 14, fontSize: 13, color: STONE }}>Already a client? <span onClick={onLogin} style={{ color: RED, cursor: "pointer" }}>Log in to see your status</span></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ ...mono, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: A }}>{direct ? "Complete your booking" : "Book a Session"}</span>
        <button onClick={onCancel} style={{ ...mono, fontSize: 10.5, color: STONE, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><X size={13} /> Close</button>
      </div>
      <h1 style={{ ...display, fontWeight: 700, fontSize: 30, color: INK, marginBottom: 20, letterSpacing: "-0.015em" }}>{direct ? "You've been invited to book" : "Let's plan your project"}</h1>

      {direct && (
        <div style={{ background: AB, border: `1px solid ${ABD}`, borderRadius: 10, padding: "14px 18px", marginBottom: 22, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <CalendarClock size={18} color={A} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ ...display, fontWeight: 600, fontSize: 16, color: INK }}>{direct.serviceName}</div>
            <div style={{ ...mono, fontSize: 11, color: AT, marginTop: 2 }}>{fmtDate(direct.date)} at {fmtTime(direct.time)} · this slot is held for you</div>
          </div>
        </div>
      )}

      {/* stepper */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 26, flexWrap: "wrap" }}>
        {stepDefs.map((sd, i) => { const active = step === sd.n, done = step > sd.n; return (
          <React.Fragment key={sd.n}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: done || active ? A : CREAM, border: `1.5px solid ${done || active ? A : LINE}`, color: done || active ? "#fff" : FAINT, ...mono, fontSize: 11 }}>{done ? <Check size={13} /> : i + 1}</div>
              <span style={{ ...mono, fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: active ? INK : FAINT }}>{sd.label}</span>
            </div>
            {i < stepDefs.length - 1 && <div style={{ width: 26, height: 1, background: LINE }} />}
          </React.Fragment>
        ); })}
      </div>

      {/* STEP 1 — CHOOSE */}
      {step === 1 && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {GROUP_KEYS.map((k) => { const gg = GROUPS[k]; const active = group === k; return (
              <button key={k} onClick={() => { setGroup(k); setServiceId(null); setAddonIds([]); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 15px", borderRadius: 8, cursor: "pointer", fontSize: 13, border: `1px solid ${active ? gg.color : LINE}`, background: active ? gg.color : PAPER, color: active ? "#fff" : STONE }}><gg.Icon size={14} /> {gg.label}</button>
            ); })}
          </div>
          {!catalogLoaded ? (
            <div style={{ textAlign: "center", padding: "44px", color: STONE, fontSize: 13 }}>Loading services…</div>
          ) : catalogError ? (
            <div style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: "26px", textAlign: "center", background: PAPER }}>
              <div style={{ ...display, fontSize: 16, color: INK, marginBottom: 6 }}>We couldn't load services right now</div>
              <div style={{ fontSize: 13, color: STONE, lineHeight: 1.5 }}>Please refresh the page, or reach out to us directly and we'll help you book.</div>
            </div>
          ) : (
            <div>
              {groupServices.length === 0 ? (
                <div style={{ border: `1px dashed ${LINE}`, borderRadius: 10, padding: "28px", textAlign: "center", background: PAPER }}>
                  <div style={{ ...display, fontSize: 17, color: INK, marginBottom: 6 }}>No {GROUPS[group].label} services available yet</div>
                  <div style={{ fontSize: 13, color: STONE, lineHeight: 1.5 }}>Please check back soon, or reach out to us directly and we'll help you book.</div>
                </div>
              ) : group === "photo" ? (
                PHOTO_CATEGORIES.concat(["__other"]).map((cat) => {
                  const inCat = groupServices.filter((s) => cat === "__other" ? !PHOTO_CATEGORIES.includes(s.category) : s.category === cat);
                  if (inCat.length === 0) return null;
                  const label = cat === "__other" ? "More Sessions" : cat;
                  const open = !!openCats[cat];
                  return (
                    <div key={cat} style={{ marginTop: 10, border: `1px solid ${LINE}`, borderRadius: 10, overflow: "hidden" }}>
                      <div onClick={() => setOpenCats((pp) => ({ ...pp, [cat]: !pp[cat] }))} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 15px", cursor: "pointer", background: open ? CREAM : PAPER }}>
                        <div style={{ ...mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: INK }}>{label} <span style={{ color: FAINT }}>· {inCat.length}</span></div>
                        <ChevronDown size={16} color="#6f6d65" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                      </div>
                      {open && <div style={{ padding: "4px 12px 12px" }}>{inCat.map(renderServiceBtn)}</div>}
                    </div>
                  );
                })
              ) : (
                groupServices.map(renderServiceBtn)
              )}
              {service && availableAddons.length > 0 && (
                <div style={{ marginTop: 18, background: CREAM, border: `1px solid ${LINE}`, borderRadius: 10, padding: "16px 18px" }}>
                  <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: STONE, marginBottom: 12 }}>Add-ons (optional)</div>
                  {availableAddons.map((a) => { const on = addonIds.includes(a.id); return (
                    <div key={a.id} onClick={() => setAddonIds((pp) => on ? pp.filter((x) => x !== a.id) : [...pp, a.id])} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", cursor: "pointer", borderTop: `1px solid ${LINE}` }}>
                      <span style={{ width: 17, height: 17, borderRadius: 4, border: `1.5px solid ${on ? GROUPS[group].color : LINE}`, background: on ? GROUPS[group].color : PAPER, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{on && <Check size={12} color="#fff" />}</span>
                      <span style={{ flex: 1, fontSize: 13.5, color: INK }}>{a.name}{a.addTime ? <span style={{ ...mono, fontSize: 10, color: FAINT }}>  · +{a.addTime} min</span> : null}</span>
                      <span style={{ ...mono, fontSize: 12.5, color: a.price ? A : FAINT }}>{a.price ? "+" + money(a.price) : "free"}</span>
                    </div>
                  ); })}
                </div>
              )}
              {service && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
                  <div style={{ ...display, fontSize: 18, color: INK }}>Total: <span style={{ color: A }}>{money(total)}</span></div>
                  <button onClick={() => setStep(2)} style={{ ...btnSolid, background: A }}>Continue <ArrowRight size={15} /></button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* STEP 2 — ACCOUNT */}
      {step === 2 && (
        <div style={{ maxWidth: 600 }}>
          {!authedClient ? (
            <>
              <div style={{ fontSize: 13.5, color: BODY, marginBottom: 18, lineHeight: 1.5 }}>Create your account and sign to continue. Already have an account? <span onClick={onLogin} style={{ color: A, cursor: "pointer" }}>Log in</span>.</div>
              <FieldLabel>Your name</FieldLabel>
              <TextInput value={acct.name} onChange={(v) => setAcct({ ...acct, name: v })} placeholder="Sarah & James" />
              <FieldLabel>Email</FieldLabel>
              <TextInput value={acct.email} onChange={(v) => setAcct({ ...acct, email: v })} placeholder="you@example.com" />
              <FieldLabel>Phone (optional)</FieldLabel>
              <TextInput value={acct.phone} onChange={(v) => setAcct({ ...acct, phone: v })} placeholder="(907) 555-0123" />
              <FieldLabel>Create a password</FieldLabel>
              <input type="password" value={acct.password} onChange={(e) => setAcct({ ...acct, password: e.target.value })} placeholder="At least 6 characters" style={{ ...inputStyle, marginBottom: 2 }} />
              <div style={{ ...mono, fontSize: 10, color: FAINT, marginTop: 4, lineHeight: 1.4 }}>You'll use your email and this password to sign in later and check your session.</div>
            </>
          ) : (
            <div style={{ fontSize: 13.5, color: BODY, marginBottom: 4, lineHeight: 1.5 }}>You're signed in as <strong style={{ color: INK }}>{authedClient.name || authedClient.email}</strong>. Please sign the release for this session below.</div>
          )}

          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 20, cursor: "pointer", background: CREAM, border: `1px solid ${LINE}`, borderRadius: 9, padding: "12px 14px" }}>
            <input type="checkbox" checked={isMinor} onChange={(e) => setIsMinor(e.target.checked)} style={{ marginTop: 2, width: 16, height: 16, accentColor: A, cursor: "pointer" }} />
            <span style={{ fontSize: 12.5, color: BODY, lineHeight: 1.5 }}>This session is for a child under 18. I am the parent or legal guardian and will sign on their behalf.</span>
          </label>

          {!authedClient && <AgreementBox title="1 - Client Services Agreement" text={CLIENT_SERVICES_SUMMARY} pdf={PDF_CLIENT_SERVICES} A={A} />}
          <AgreementBox title={authedClient ? (isMinor ? "Minor Release & Liability Waiver" : "Release & Liability Waiver") : (isMinor ? "2 - Minor Release & Liability Waiver" : "2 - Release & Liability Waiver")} text={isMinor ? MINOR_SUMMARY : RELEASE_SUMMARY} pdf={isMinor ? PDF_MINOR : PDF_RELEASE} A={A} />

          {isMinor && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
              <div style={{ flex: "1 1 200px" }}><FieldLabel>Child's full name</FieldLabel><TextInput value={child.name} onChange={(v) => setChild({ ...child, name: v })} placeholder="Child's name" /></div>
              <div style={{ flex: "0 1 90px" }}><FieldLabel>Age</FieldLabel><TextInput value={child.age} onChange={(v) => setChild({ ...child, age: v })} placeholder="e.g. 6" /></div>
              <div style={{ flex: "1 1 160px" }}><FieldLabel>Your relationship</FieldLabel><TextInput value={child.relationship} onChange={(v) => setChild({ ...child, relationship: v })} placeholder="Parent / Guardian" /></div>
            </div>
          )}

          <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginTop: 20, marginBottom: 8 }}>How may we use the images and video?</div>
          {USAGE_OPTIONS.map((o) => (
            <label key={o.key} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8, cursor: "pointer", border: `1.5px solid ${usage === o.key ? A : LINE}`, background: usage === o.key ? A + "0e" : PAPER, borderRadius: 9, padding: "11px 13px" }}>
              <input type="radio" name="usage" checked={usage === o.key} onChange={() => setUsage(o.key)} style={{ marginTop: 2, accentColor: A, cursor: "pointer" }} />
              <span><span style={{ fontSize: 13, fontWeight: 600, color: INK }}>{o.label}</span><span style={{ display: "block", fontSize: 12, color: STONE, lineHeight: 1.45, marginTop: 2 }}>{o.desc}</span></span>
            </label>
          ))}
          {usage === "C" && <TextInput value={exception} onChange={setException} placeholder="Optional: any specific use you allow (e.g. website portfolio only)" />}

          <div style={{ marginTop: 18 }}>
            <FieldLabel>Type your full legal name to sign</FieldLabel>
            <TextInput value={acct.signature} onChange={(v) => setAcct({ ...acct, signature: v })} placeholder="Full legal name" />
          </div>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 12, cursor: "pointer" }}>
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ marginTop: 3, width: 16, height: 16, accentColor: A, cursor: "pointer" }} />
            <span style={{ fontSize: 12.5, color: BODY, lineHeight: 1.5 }}>I have read and agree to {authedClient ? "" : "the Client Services Agreement and "}the {isMinor ? "Minor " : ""}Release and Liability Waiver above. This typed signature is legally binding.</span>
          </label>

          {submitErr && <div style={{ marginTop: 12, fontSize: 12.5, color: "#b5271b", display: "flex", alignItems: "center", gap: 7 }}><AlertTriangle size={14} /> {submitErr}</div>}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
            <button onClick={() => (direct ? onCancel() : setStep(1))} disabled={submitting} style={btnGhost}><ArrowLeft size={14} /> Back</button>
            <button onClick={submitAccount} disabled={submitting} style={{ ...btnSolid, background: submitting ? FAINT : A }}>{submitting ? "Saving..." : "Sign and continue"} <ArrowRight size={15} /></button>
          </div>
        </div>
      )}

      {/* STEP 3 — CONFIRM & PAY */}
      {step === 3 && (
        <div>
          <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 10, padding: "18px 20px", marginBottom: 18 }}>
            <div style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: STONE, marginBottom: 12 }}>Your booking</div>
            <Row k={service?.name || ""} v={money(basePrice)} bold />
            {chosenAddons.map((a) => <Row key={a.id} k={a.name} v={"+" + money(a.price)} sub />)}
            <div style={{ borderTop: `1px solid ${LINE}`, marginTop: 8, paddingTop: 8 }}><Row k="Total" v={money(total)} bold red /></div>
          </div>

          {direct ? (
            <div style={{ background: CREAM, border: `1px solid ${LINE}`, borderRadius: 9, padding: "12px 16px", marginBottom: 16 }}>
              <div style={{ ...mono, fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: STONE, marginBottom: 4 }}>Your reserved session</div>
              <div style={{ fontSize: 14, color: INK, fontWeight: 500 }}>{fmtDate(direct.date)} at {fmtTime(direct.time)}</div>
            </div>
          ) : (
            <div style={{ marginBottom: 16 }}>
              <FieldLabel>Choose an available day</FieldLabel>
              {availDates.length === 0 ? (
                <div style={{ border: `1px dashed ${LINE}`, borderRadius: 9, padding: "18px", textAlign: "center", background: PAPER, fontSize: 13, color: STONE, lineHeight: 1.5 }}>No open dates right now. Please check back soon, or contact us and we'll find a time.</div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {availDates.map((d) => { const on = date === d; return (
                    <button key={d} onClick={() => { setDate(d); setTime(""); releaseHold(); }} style={{ ...mono, fontSize: 12, padding: "9px 13px", borderRadius: 8, cursor: "pointer", border: `1.5px solid ${on ? A : LINE}`, background: on ? A : PAPER, color: on ? "#fff" : INK }}>{fmtDate(d)}</button>
                  ); })}
                </div>
              )}
              {date && (
                <div style={{ marginTop: 14 }}>
                  <FieldLabel>Choose a time</FieldLabel>
                  {slotsForDate(date).length === 0 ? (
                    <div style={{ fontSize: 12.5, color: STONE }}>Every time on this day is booked. Please choose another day.</div>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {slotsForDate(date).map((t) => { const on = time === t; return (
                        <button key={t} onClick={() => { setTime(t); acquireHold(date, t); }} style={{ ...mono, fontSize: 12, padding: "9px 13px", borderRadius: 8, cursor: "pointer", border: `1.5px solid ${on ? A : LINE}`, background: on ? A : PAPER, color: on ? "#fff" : INK }}>{fmtTime(t)}</button>
                      ); })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {taken && <div style={{ background: "#fbeeed", border: "1px solid #f2cdc9", borderRadius: 8, padding: "9px 13px", marginBottom: 14, fontSize: 12.5, color: "#b5271b", display: "flex", alignItems: "center", gap: 8 }}><AlertTriangle size={14} /> That date and time is already booked. Please pick another.</div>}

          <FieldLabel>Payment</FieldLabel>
          <div style={{ background: CREAM, border: `1px solid ${LINE}`, borderLeft: `3px solid ${GROUPS[group].color}`, borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}><div style={{ fontSize: 12, color: STONE, lineHeight: 1.45 }}>{rules.note}</div></div>
          {rules.options.map((o) => { const amt = o.fixed != null ? o.fixed : Math.round(total * (o.pct / 100)); const sel = payChoice === o.key; return (
            <div key={o.key} onClick={() => setPayChoice(o.key)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 14px", marginBottom: 8, borderRadius: 9, cursor: "pointer", border: `1.5px solid ${sel ? GROUPS[group].color : LINE}`, background: sel ? AB : PAPER }}>
              <span style={{ width: 17, height: 17, borderRadius: "50%", border: `1.5px solid ${sel ? GROUPS[group].color : LINE}`, background: sel ? GROUPS[group].color : PAPER, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{sel && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />}</span>
              <span style={{ flex: 1, fontSize: 13.5, color: INK }}>{o.label}</span>
              {o.key !== "quote" && <span style={{ ...mono, fontSize: 13, color: A }}>{o.pct === 0 && o.fixed == null ? "$0 today" : money(amt) + " today"}</span>}
            </div>
          ); })}
          <div style={{ ...mono, fontSize: 9.5, color: FAINT, marginTop: 4, marginBottom: 18 }}>Payments are processed securely through Square.</div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button onClick={() => setStep(2)} style={btnGhost}><ArrowLeft size={14} /> Back</button>
            <button onClick={() => { if (!date || !time || !payChoice || taken) return; const so = rules.options.find((o) => o.key === payChoice); const payAmount = so ? (so.fixed != null ? so.fixed : Math.round(total * ((so.pct || 0) / 100))) : 0; onComplete({ linkId: direct?.id, group, serviceName: service.name, duration: apptLen, apptMin: apptLen, padBefore: padB, padAfter: padA, addons: chosenAddons.map((a) => ({ name: a.name, price: Number(a.price) || 0, addTime: Number(a.addTime) || 0 })), total, payAmount, date, time, payChoice, name: acct.name, email: acct.email }); }} style={{ ...btnSolid, background: date && time && payChoice && !taken ? A : FAINT }}><Check size={15} /> {(() => { const so = rules.options.find((o) => o.key === payChoice); const amt = so ? (so.fixed != null ? so.fixed : Math.round(total * ((so.pct || 0) / 100))) : 0; return amt > 0 ? "Continue to payment · " + money(amt) : "Confirm booking"; })()}</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================ DIRECT BOOKING LINKS ============================ */
function DirectLinks({ state, createDirectLink, revokeDirectLink, openDirectLink, showToast }) {
  const isMobile = useIsMobile();
  const [group, setGroup] = useState("video");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [recipient, setRecipient] = useState("");
  const [justMade, setJustMade] = useState(null);
  const g = GROUPS[group];
  const groupServices = state.services.filter((s) => s.group === group);
  const svc = state.services.find((s) => s.id === serviceId);

  const generate = () => {
    if (!svc) { showToast("Choose a service first."); return; }
    if (!date || !time) { showToast("Pick a date and time."); return; }
    const res = createDirectLink({ group, serviceId: svc.id, serviceName: svc.name, price: Number(svc.price) || 0, date, time, recipient: recipient.trim() });
    if (!res.ok) { showToast(res.error); return; }
    setJustMade(res.link);
    setServiceId(""); setDate(""); setTime(""); setRecipient("");
    showToast("Direct booking link created and slot reserved.");
  };

  const copy = async (url) => { try { await navigator.clipboard.writeText(url); showToast("Link copied to clipboard."); } catch (e) { showToast("Select the link text to copy it."); } };
  const linkUrl = (l) => PORTAL_BASE + l.token;

  return (
    <div>
      <div style={{ marginBottom: 4 }}><span style={{ ...mono, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: RED }}>Send Direct Booking Link</span></div>
      <h2 style={{ ...display, fontWeight: 700, fontSize: 24, color: INK, marginBottom: 8, letterSpacing: "-0.01em" }}>Reserve a slot for one specific client</h2>
      <p style={{ fontSize: 13.5, color: BODY, lineHeight: 1.55, maxWidth: 640, marginBottom: 24 }}>
        Pick a service and an exact date and time, then generate a private link to text or send through Messenger. The slot is held the moment you create the link, so no one else can take it. The link works once, for one client.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24 }}>
        {/* generator */}
        <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, padding: "18px 20px", alignSelf: "start" }}>
          <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 14 }}>Create a link</div>

          <FieldLabel>Service group</FieldLabel>
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {GROUP_KEYS.map((k) => { const gg = GROUPS[k]; const active = group === k; return (
              <button key={k} onClick={() => { setGroup(k); setServiceId(""); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 11px", borderRadius: 7, cursor: "pointer", fontSize: 12, border: `1px solid ${active ? gg.color : LINE}`, background: active ? gg.color : PAPER, color: active ? "#fff" : STONE }}><gg.Icon size={12} /> {gg.label}</button>
            ); })}
          </div>

          <FieldLabel>Service / project type</FieldLabel>
          {groupServices.length === 0 ? (
            <div style={{ ...mono, fontSize: 10.5, color: FAINT, marginBottom: 12, lineHeight: 1.5 }}>No {g.label.toLowerCase()} services yet. Create one in Services & Add-ons first.</div>
          ) : (
            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} style={{ ...inputStyle, marginBottom: 12, cursor: "pointer" }}>
              <option value="">Choose a service…</option>
              {groupServices.map((s) => <option key={s.id} value={s.id}>{s.name}{s.price ? ` — ${money(s.price)}` : ""}</option>)}
            </select>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}><FieldLabel>Date</FieldLabel><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyle, marginBottom: 12 }} /></div>
            <div style={{ flex: 1 }}><FieldLabel>Time</FieldLabel><input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ ...inputStyle, marginBottom: 12 }} /></div>
          </div>

          <FieldLabel>Who is this for? (optional)</FieldLabel>
          <TextInput value={recipient} onChange={setRecipient} placeholder="e.g. Sarah M." />

          <button onClick={generate} style={{ ...btnSolid, background: RED, width: "100%", justifyContent: "center", marginTop: 4, padding: "11px" }}><LinkIcon size={15} /> Generate booking link</button>
        </div>

        {/* just-made + share */}
        <div>
          {justMade ? (
            <div style={{ background: `color-mix(in srgb, ${RED} 7%, ${PAPER})`, border: `1px solid color-mix(in srgb, ${RED} 22%, ${LINE})`, borderRadius: 12, padding: "18px 20px", marginBottom: 18 }}>
              <div style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: RED, marginBottom: 10, display: "flex", alignItems: "center", gap: 7 }}><Check size={13} /> Link ready — slot reserved</div>
              <div style={{ fontSize: 13, color: BODY, marginBottom: 4 }}>{justMade.serviceName}</div>
              <div style={{ ...mono, fontSize: 11, color: "#b5271b", marginBottom: 12 }}>{fmtDate(justMade.date)} at {fmtTime(justMade.time)}{justMade.recipient ? ` · for ${justMade.recipient}` : ""}</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                <input readOnly value={linkUrl(justMade)} onClick={(e) => e.target.select()} style={{ ...inputStyle, marginBottom: 0, fontSize: 11, color: STONE }} />
                <button onClick={() => copy(linkUrl(justMade))} style={{ ...btnSolid, background: INK, padding: "9px 12px" }}><Copy size={13} /></button>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <a href={`sms:?&body=${encodeURIComponent("Here's your booking link for Dot One Media: " + linkUrl(justMade))}`} style={{ ...shareBtn }}><Smartphone size={13} /> Text</a>
                <a href={`https://www.facebook.com/dialog/send?link=${encodeURIComponent(linkUrl(justMade))}&app_id=0&redirect_uri=${encodeURIComponent(linkUrl(justMade))}`} target="_blank" rel="noopener noreferrer" style={{ ...shareBtn }}><MessageCircle size={13} /> Messenger</a>
                <button onClick={() => openDirectLink(justMade)} style={{ ...shareBtn, cursor: "pointer", background: PAPER }}><Eye size={13} /> Preview as client</button>
              </div>
              <div style={{ ...mono, fontSize: 9, color: FAINT, marginTop: 10, lineHeight: 1.5 }}>Tip: "Text" and "Messenger" open your device's apps on a real phone. "Preview as client" shows exactly what your client will see.</div>
            </div>
          ) : (
            <div style={{ border: `1px dashed ${LINE}`, borderRadius: 12, padding: "24px", textAlign: "center", color: FAINT, fontSize: 12.5, lineHeight: 1.55, background: CREAM, marginBottom: 18 }}>
              Your generated link and share options will appear here.
            </div>
          )}
        </div>
      </div>

      {/* existing links */}
      <div style={{ marginTop: 8 }}>
        <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, margin: "18px 0 12px" }}>Sent & reserved links</div>
        {state.directLinks.length === 0 ? (
          <div style={{ fontSize: 13, color: FAINT, fontStyle: "italic" }}>No booking links yet.</div>
        ) : (
          state.directLinks.map((l) => { const used = l.status === "used"; return (
            <div key={l.id} style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 10, padding: "13px 16px", marginBottom: 8, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div style={{ width: 30, height: 30, borderRadius: 7, background: CREAM, border: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{React.createElement(GROUPS[l.group].Icon, { size: 14, color: GROUPS[l.group].color })}</div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ ...display, fontWeight: 600, fontSize: 15, color: INK }}>{l.serviceName}</div>
                <div style={{ ...mono, fontSize: 10.5, color: STONE, marginTop: 2 }}>{fmtDate(l.date)} at {fmtTime(l.time)}{l.recipient ? ` · ${l.recipient}` : ""}</div>
              </div>
              <span style={{ ...mono, fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 20, background: used ? "#eaf7ef" : "#fff4e8", color: used ? "#2e7d4f" : "#c47f1a", border: `1px solid ${used ? "#bfe6cc" : "#f0dcc0"}` }}>{used ? "Booked" : "Active · held"}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => copy(linkUrl(l))} title="Copy link" style={iconBtnStyle}><Copy size={13} /></button>
                {!used && <button onClick={() => openDirectLink(l)} title="Preview as client" style={iconBtnStyle}><Eye size={13} /></button>}
                {!used && <button onClick={() => revokeDirectLink(l.id)} title="Revoke & free the slot" style={{ ...iconBtnStyle, color: RED }}><Ban size={13} /></button>}
              </div>
            </div>
          ); })
        )}
      </div>
    </div>
  );
}

/* ============================ CONFIRM DIALOG ============================ */
function ConfirmDialog({ title, message, confirmLabel = "Confirm", danger, onYes, onCancel }) {
  return (
    <div className="d1-overlay" style={{ position: "fixed", inset: 0, background: "rgba(26,26,23,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 80, padding: 20 }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className="d1-modal" style={{ background: PAPER, borderRadius: 12, padding: "24px 26px", maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: danger ? "#fbeeed" : "#fff4e8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><AlertTriangle size={18} color={danger ? RED : "#c47f1a"} /></div>
          <h3 style={{ ...display, fontWeight: 700, fontSize: 19, color: INK }}>{title}</h3>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.55, color: BODY, marginBottom: 20 }}>{message}</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={btnGhost}>Cancel</button>
          <button onClick={onYes} style={{ ...btnSolid, background: danger ? RED : INK }}><Check size={14} /> {confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}

/* ============================ CLIENT VIEW ============================ */
function timeGreeting() { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; }

function ProgressBar({ stages, current, accent }) {
  const target = stages.length > 1 ? Math.max(0, Math.min(1, current / (stages.length - 1))) * 100 : 0;
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(target), 90); return () => clearTimeout(t); }, [target]);
  return (
    <div>
      <div style={{ position: "relative", height: 8, background: LINE, borderRadius: 5, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: w + "%", background: `linear-gradient(90deg, ${accent}bb, ${accent})`, borderRadius: 5, transition: "width 1100ms cubic-bezier(0.22, 1, 0.36, 1)" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 4, marginTop: 9 }}>
        {stages.map((s, i) => (
          <span key={s.key} style={{ ...mono, fontSize: 8.5, letterSpacing: "0.06em", textTransform: "uppercase", color: i <= current ? accent : FAINT, fontWeight: i === current ? 700 : 500, flex: 1, textAlign: i === 0 ? "left" : i === stages.length - 1 ? "right" : "center", whiteSpace: "nowrap", overflow: "hidden" }}>{s.label.split(" ")[0]}</span>
        ))}
      </div>
    </div>
  );
}

function ThemePicker({ themeKey, customAccent, onPick, onClose }) {
  const acc = customAccent || "";
  return (
    <div onClick={onClose} className="d1-overlay" style={{ position: "fixed", inset: 0, background: "rgba(20,19,17,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 250 }}>
      <div onClick={(e) => e.stopPropagation()} className="d1-modal" style={{ background: CREAM, borderRadius: 16, maxWidth: 470, width: "100%", padding: "26px 26px 24px", border: `1px solid ${LINE}`, maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase", color: RED, marginBottom: 6 }}>Appearance</div>
        <div style={{ ...display, fontWeight: 700, fontSize: 22, color: INK, marginBottom: 4 }}>Portal color theme</div>
        <div style={{ fontSize: 12.5, color: STONE, lineHeight: 1.5, marginBottom: 18 }}>Choose a palette for your portal. Your choice is saved on this device.</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 22 }}>
          {Object.keys(THEMES).map((k) => { const t = THEMES[k]; const sel = themeKey === k; return (
            <button key={k} onClick={() => onPick(k, "")} style={{ display: "flex", alignItems: "center", gap: 11, textAlign: "left", cursor: "pointer", border: `1.5px solid ${sel ? t.swatch : LINE}`, borderRadius: 11, padding: "11px 13px", background: t.bg }}>
              <span style={{ width: 26, height: 26, borderRadius: "50%", background: t.swatch, flexShrink: 0, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)" }} />
              <span style={{ ...display, fontWeight: 600, fontSize: 13.5, color: "#1a1a17" }}>{t.name}</span>
              {sel && <Check size={15} color={t.swatch} style={{ marginLeft: "auto", flexShrink: 0 }} />}
            </button>
          ); })}
        </div>
        <div style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: STONE, marginBottom: 11 }}>Custom accent</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          {ACCENT_SWATCHES.map((c) => { const sel = acc.toLowerCase() === c.toLowerCase(); return (
            <button key={c} onClick={() => onPick(themeKey, c)} aria-label={"Accent " + c} style={{ width: 30, height: 30, borderRadius: "50%", background: c, cursor: "pointer", border: sel ? "2px solid #1a1a17" : "2px solid transparent", boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)", padding: 0 }} />
          ); })}
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", ...mono, fontSize: 10.5, color: STONE, border: `1px dashed ${LINE}`, borderRadius: 8, padding: "6px 10px" }}>
            <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(acc) ? acc : "#e23b2e"} onChange={(e) => onPick(themeKey, e.target.value)} style={{ width: 18, height: 18, border: "none", background: "transparent", padding: 0, cursor: "pointer" }} /> Custom
          </label>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 22, flexWrap: "wrap" }}>
          <button onClick={() => onPick("default", "")} style={{ ...mono, fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: STONE, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 8, padding: "10px 14px", cursor: "pointer" }}>Reset to default</button>
          <button onClick={onClose} style={{ ...btnSolid, background: RED, flex: 1, justifyContent: "center" }}>Done</button>
        </div>
      </div>
    </div>
  );
}

function ClientGuide({ onClose }) {
  const items = [
    { Icon: ListChecks, title: "Your project timeline", body: "Follow your session from booking to final delivery. Each step updates here, and we'll email you along the way." },
    { Icon: MessageCircle, title: "Message us anytime", body: "Have a question? Send a note right from your project. Everything stays in one place." },
    { Icon: CalendarCheck, title: "Add it to your calendar", body: "Save your session to Google or Apple Calendar so you never miss it." },
    { Icon: Download, title: "Receive your work", body: "When your project is ready, your finished photos and films appear here to view and download." },
  ];
  return (
    <div onClick={onClose} className="d1-overlay" style={{ position: "fixed", inset: 0, background: "rgba(20,19,17,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 200 }}>
      <div onClick={(e) => e.stopPropagation()} className="d1-modal" style={{ background: CREAM, borderRadius: 16, maxWidth: 440, width: "100%", padding: "28px 26px", border: `1px solid ${LINE}`, maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase", color: RED, marginBottom: 8 }}>Welcome</div>
        <div style={{ ...display, fontWeight: 700, fontSize: 24, color: INK, lineHeight: 1.15, marginBottom: 8 }}>Welcome to your Dot One portal</div>
        <div style={{ fontSize: 13.5, color: BODY, lineHeight: 1.55, marginBottom: 22 }}>This is your home for everything we create together. Here's what you can do:</div>
        {items.map((it, i) => { const It = it.Icon; return (
          <div key={i} style={{ display: "flex", gap: 13, marginBottom: 16 }}>
            <div style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 9, background: PAPER, border: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "center" }}><It size={16} color={RED} /></div>
            <div><div style={{ ...display, fontWeight: 600, fontSize: 14.5, color: INK, marginBottom: 2 }}>{it.title}</div><div style={{ fontSize: 12.5, color: BODY, lineHeight: 1.5 }}>{it.body}</div></div>
          </div>
        ); })}
        <button onClick={onClose} style={{ ...btnSolid, background: RED, width: "100%", justifyContent: "center", marginTop: 8, padding: "12px" }}>Got it, let's go</button>
      </div>
    </div>
  );
}

function ClientView({ session, sessions, clientId, setClientId, addComment, onRescheduleRequest, markMessagesRead, patchSession, resizeImage, showToast }) {
  const [draft, setDraft] = useState("");
  const [msg, setMsg] = useState("");
  const [reschedOpen, setReschedOpen] = useState(false);
  const [reschedDate, setReschedDate] = useState("");
  const fileRef = useRef(null);
  useEffect(() => { if (!session) return; setReschedDate(session.date || ""); setReschedOpen(false); setMsg(""); setBrief(session.brief || {}); setBriefMsg(""); }, [clientId]);
  const [docs, setDocs] = useState([]);
  const [emailPrefs, setEmailPrefs] = useState({ updates: true, messages: true, payments: true });
  const [payingBalance, setPayingBalance] = useState(false);
  const [payErr, setPayErr] = useState("");
  const [briefOpen, setBriefOpen] = useState(false);
  const [brief, setBrief] = useState({});
  const [briefMsg, setBriefMsg] = useState("");
  useEffect(() => { (async () => { try { const r = await fetch("/api/agreements"); const d = await r.json(); if (r.ok) setDocs(Array.isArray(d.agreements) ? d.agreements : []); } catch (e) {} })(); }, []);
  useEffect(() => { (async () => { try { const r = await fetch("/api/email-prefs"); const d = await r.json(); if (r.ok && d.prefs) setEmailPrefs({ updates: d.prefs.updates !== false, messages: d.prefs.messages !== false, payments: d.prefs.payments !== false }); } catch (e) {} })(); }, [clientId]);
  const toggleEmailPref = (cat) => { const next = { ...emailPrefs, [cat]: !emailPrefs[cat] }; setEmailPrefs(next); fetch("/api/email-prefs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prefs: next }) }).catch(() => {}); };
  if (!session) return <div style={{ ...mono, fontSize: 13, color: STONE, padding: "48px 4px", textAlign: "center" }}>No session to show yet. When you book, it will appear here.</div>;
  const stage = session.currentStage;
  const grp = GROUPS[session.serviceLine] || GROUPS.video;
  const fee = PAYMENT_RULES[session.serviceLine]?.reschedFee || 0;
  const status = session.status || "active";
  const unreadReplies = session.comments.filter((c) => c.author === "studio" && !c.read).length;
  const today = new Date().toISOString().slice(0, 10);
  const sortedSessions = [...(sessions || [])].sort((a, b) => { const ad = a.date || "9999-99", bd = b.date || "9999-99"; const aUp = ad >= today, bUp = bd >= today; if (aUp !== bUp) return aUp ? -1 : 1; if (aUp) return ad.localeCompare(bd); return bd.localeCompare(ad); });
  const payTotal = Number(session.total) || 0;
  const depositPaid = session.paymentStatus === "paid";
  const paymentPending = session.paymentStatus === "pending";
  const payPaid = depositPaid ? (Number(session.payAmount) || 0) : 0;
  const balancePaid = session.balanceStatus === "paid";
  const balanceDue = (depositPaid && !balancePaid) ? Math.max(0, payTotal - payPaid) : 0;
  const fullyPaid = payTotal > 0 && (balancePaid || (depositPaid && payPaid >= payTotal));
  const briefSubmitted = !!(session.brief && session.brief.submitted);
  const briefHasContent = !!(session.brief && BRIEF_FIELDS.some((f) => (session.brief[f.key] || "").trim()));
  const briefStatusText = briefSubmitted ? "Submitted \u00b7 thank you" : briefHasContent ? "Draft saved \u00b7 not yet submitted" : "Tell us about your project so we can prepare";
  const isLastStage = session.currentStage >= stagesFor(session).length - 1;
  const statusLine = session.status === "cancelled" ? "This booking has been cancelled." : session.status === "closed" ? "This booking has been closed." : isLastStage ? ("Your " + session.type + " is complete. Thank you for creating with Dot One.") : ("Your " + session.type + " is currently at \u201c" + curStage(session).label + ".\u201d We\u2019ll notify you when the next step is ready. No action is needed from you right now.");

  const payBalance = async () => {
    setPayErr(""); setPayingBalance(true);
    try {
      const r = await fetch("/api/pay-balance-client", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId: session.id }) });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.url) { window.location.href = d.url; return; }
      setPayErr((d && d.error) || "Could not start checkout. Please try again.");
    } catch (e) { setPayErr("Could not start checkout. Please try again."); }
    setPayingBalance(false);
  };
  const saveBrief = (submit) => {
    const already = !!(session.brief && session.brief.submitted);
    const now = new Date().toISOString();
    const next = { ...brief, submitted: submit ? true : already, submittedAt: (submit && !already) ? now : ((session.brief && session.brief.submittedAt) || ""), updatedAt: now };
    patchSession(session.id, { brief: next });
    setBriefMsg(submit ? "Brief submitted \u00b7 thank you! We\u2019ll be in touch." : "Draft saved.");
  };
  const onPickImage = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try { const dataUrl = await resizeImage(file); patchSession(clientId, { clientImage: dataUrl }); showToast("Photo uploaded to your account."); }
    catch (err) { showToast("Sorry, that image couldn't be processed."); }
    e.target.value = "";
  };

  return (
    <div className="d1-stagger">
      {session.serviceLine === "photo" && <div style={{ textAlign: "center", marginBottom: 22 }}><img src="/dot1-photo-logo.png" alt="Dot One Photography" style={{ height: 52, width: "auto", display: "block", margin: "2px auto 6px" }} /><div style={{ ...mono, fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: "#2f74c0" }}>Timeless Portraits</div></div>}
      {sortedSessions.length > 1 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ ...mono, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 10 }}>Your bookings · {sortedSessions.length}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {sortedSessions.map((s) => {
              const active = s.id === clientId;
              const sg = GROUPS[s.serviceLine] || GROUPS.video;
              const tag = s.status === "cancelled" ? "cancelled" : (s.status === "closed" ? "closed" : (s.currentStage >= 6 ? "delivered" : ((s.date && s.date >= today) ? "upcoming" : "in progress")));
              return (
                <button key={s.id} onClick={() => setClientId(s.id)} style={{ textAlign: "left", cursor: "pointer", border: `1.5px solid ${active ? sg.color : LINE}`, background: active ? sg.bg : PAPER, borderRadius: 9, padding: "9px 13px", minWidth: 148, opacity: s.status === "cancelled" ? 0.65 : 1 }}>
                  <div style={{ ...display, fontWeight: 600, fontSize: 13.5, color: active ? sg.text : INK, lineHeight: 1.2 }}>{s.type}</div>
                  <div style={{ ...mono, fontSize: 9.5, color: STONE, marginTop: 3 }}>{s.date ? fmtDate(s.date) : "Date TBD"} · {tag}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {status === "cancelled" && (
        <div style={{ background: "#fbeeed", border: "1px solid #f2cdc9", borderRadius: 10, padding: "14px 18px", marginBottom: 18 }}>
          <div style={{ ...display, fontSize: 16, color: "#b5271b", marginBottom: 3 }}>This booking was cancelled</div>
          <div style={{ fontSize: 13, color: BODY, lineHeight: 1.5 }}>If this wasn't expected, please reach out to us at contact@dot1.media and we'll help.</div>
        </div>
      )}
      {status === "closed" && (
        <div style={{ background: "#f3f1ec", border: `1px solid ${LINE}`, borderRadius: 10, padding: "14px 18px", marginBottom: 18 }}>
          <div style={{ ...display, fontSize: 16, color: INK, marginBottom: 3 }}>This booking is closed</div>
          <div style={{ fontSize: 13, color: BODY, lineHeight: 1.5 }}>Questions about your session? Reach out to us at contact@dot1.media.</div>
        </div>
      )}
      {status === "active" && (session.currentStage || 0) <= 1 && (
        <div style={{ background: grp.bg, border: `1px solid ${grp.border}`, borderRadius: 10, padding: "14px 18px", marginBottom: 18 }}>
          <div style={{ ...display, fontSize: 16, color: INK, marginBottom: 3 }}>You're all set, {(session.clientName || "").split(" ")[0]}!</div>
          <div style={{ fontSize: 13, color: BODY, lineHeight: 1.5, marginBottom: 12 }}>Your {session.type} is booked{session.date ? " for " + fmtDate(session.date) : ""}{session.time ? " at " + fmtTime(session.time) : ""}. We've set up your account under {session.clientEmail}. Sign in with that email anytime to track your session's progress below.</div>
          {session.date && session.time && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <a href={gcalLink(session)} target="_blank" rel="noopener noreferrer" style={{ ...btnSolid, background: grp.color, textDecoration: "none", display: "inline-flex" }}><CalendarPlus size={15} /> Google Calendar</a>
              <button onClick={() => downloadIcs(session)} style={{ ...btnGhost, display: "inline-flex", alignItems: "center", gap: 7 }}><CalendarPlus size={15} /> Apple Calendar</button>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
        <div style={{ position: "relative" }}>
          <Avatar name={session.clientName} src={session.clientImage} size={64} />
          <button onClick={() => fileRef.current && fileRef.current.click()} title="Upload a photo" style={{ position: "absolute", right: -4, bottom: -4, width: 24, height: 24, borderRadius: "50%", background: grp.color, border: "2px solid #fff", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Camera size={12} /></button>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPickImage} style={{ display: "none" }} />
        </div>
        <div>
          <div style={{ marginBottom: 4 }}><span style={{ ...mono, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: grp.soft }}>{timeGreeting()}</span></div>
          <h1 style={{ ...display, fontWeight: 700, fontSize: 32, color: INK, lineHeight: 1.05, letterSpacing: "-0.015em" }}>{session.clientName}</h1>
        </div>
      </div>

      {unreadReplies > 0 && (
        <div style={{ background: grp.bg, border: `1px solid ${grp.border}`, borderRadius: 10, padding: "12px 16px", marginBottom: 18, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <MessageSquare size={16} color={grp.color} />
          <span style={{ flex: 1, fontSize: 13.5, color: grp.text }}>You have {unreadReplies} new {unreadReplies === 1 ? "reply" : "replies"} from the studio.</span>
          <button onClick={() => markMessagesRead(clientId, "studio")} style={{ ...mono, fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: "#fff", background: grp.color, border: "none", borderRadius: 7, padding: "7px 12px", cursor: "pointer" }}>Mark as read</button>
        </div>
      )}

      <div style={{ ...card, padding: "20px 24px", marginBottom: 16, display: "flex", gap: 26, flexWrap: "wrap", alignItems: "center" }}>
        <SummaryCell label="Project" value={session.type} icon={<grp.Icon size={13} color={grp.color} />} />
        <SummaryCell label="Service" value={grp.label} />
        <SummaryCell label="Date" value={session.date ? fmtDate(session.date) + (session.time ? " · " + fmtTime(session.time) : "") : "TBD"} />
        <SummaryCell label="Your creator" value={session.photographer} />
        <div style={{ marginLeft: "auto" }}><StatusBadge stage={stage} group={session.serviceLine} consult={isConsult(session)} /></div>
      </div>

      {status === "active" && (
        <div style={{ background: grp.bg, border: `1px solid ${grp.border}`, borderRadius: 16, padding: "20px 22px", marginBottom: 18, boxShadow: "0 1px 2px rgba(26,26,23,0.03), 0 12px 34px rgba(26,26,23,0.05)" }}>
          <div style={{ fontSize: 13.5, color: grp.text, lineHeight: 1.5, marginBottom: 15 }}>{statusLine}</div>
          <ProgressBar stages={stagesFor(session)} current={session.currentStage} accent={grp.color} />
        </div>
      )}

      {payTotal > 0 && status === "active" && (
        <div style={{ ...card, marginTop: 18, padding: "22px 24px" }}>
          <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 12 }}>Payment</div>
          <Row k="Project total" v={money(payTotal)} />
          {payPaid > 0 && balanceDue > 0 && <Row k="Deposit paid" v={money(payPaid)} sub />}
          {balanceDue > 0 && <Row k="Balance due" v={money(balanceDue)} bold red />}
          {fullyPaid ? (
            <div style={{ marginTop: 13, display: "flex", alignItems: "center", gap: 8 }}><CheckCircle2 size={15} color="#2e9e5b" /><span style={{ ...mono, fontSize: 11.5, letterSpacing: "0.05em", color: "#2e7d4f" }}>{"PAID IN FULL \u00b7 THANK YOU"}</span></div>
          ) : balanceDue > 0 ? (
            <>
              <button onClick={payBalance} disabled={payingBalance} style={{ ...btnSolid, background: grp.color, marginTop: 15, width: "100%", justifyContent: "center", opacity: payingBalance ? 0.7 : 1, cursor: payingBalance ? "default" : "pointer" }}>{payingBalance ? "Starting secure checkout\u2026" : "Pay balance securely \u00b7 " + money(balanceDue)}</button>
              {payErr && <div style={{ marginTop: 10, fontSize: 12.5, color: "#b5271b", display: "flex", alignItems: "center", gap: 7 }}><AlertTriangle size={14} /> {payErr}</div>}
            </>
          ) : paymentPending ? (
            <div style={{ marginTop: 12, ...mono, fontSize: 11.5, letterSpacing: "0.04em", color: STONE }}>{"We\u2019re confirming your payment. This will update automatically."}</div>
          ) : null}
          <div style={{ ...mono, fontSize: 9, color: FAINT, marginTop: 11 }}>Payments are processed securely through Square.</div>
        </div>
      )}

      {Array.isArray(session.charges) && session.charges.length > 0 && status === "active" && (
        <div style={{ ...card, marginTop: 18, padding: "22px 24px", border: `1px solid ${session.charges.some((c) => c.status !== "paid") ? `color-mix(in srgb, ${grp.color} 32%, transparent)` : LINE}` }}>
          <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: session.charges.some((c) => c.status !== "paid") ? grp.color : STONE, marginBottom: 5, display: "flex", alignItems: "center", gap: 8 }}>{session.charges.some((c) => c.status !== "paid") && <span style={{ width: 6, height: 6, borderRadius: "50%", background: grp.color, display: "inline-block" }} />}Payment requests</div>
          <div style={{ fontSize: 12.5, color: STONE, marginBottom: 4 }}>Extra items your studio has added to this project.</div>
          {session.charges.map((c) => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "13px 0", borderTop: `1px solid ${LINE}`, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0, flex: "1 1 auto" }}>
                <div style={{ fontSize: 14.5, color: c.status === "paid" ? STONE : INK, fontWeight: 600 }}>{c.label}</div>
                <div style={{ ...mono, fontSize: 10, color: c.status === "paid" ? "#3f7a3f" : FAINT, marginTop: 3 }}>{c.status === "paid" ? ("Paid" + (c.cardLast4 ? " \u00b7 " + (c.cardBrand ? String(c.cardBrand).replace(/_/g, " ") : "Card") + " \u00b7\u00b7\u00b7\u00b7 " + c.cardLast4 : "")) : "Requested by Dot One Media"}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                <span style={{ fontSize: 17, color: c.status === "paid" ? STONE : INK, fontWeight: 600 }}>{money((Number(c.amountCents) || 0) / 100)}</span>
                {c.status === "paid" ? (
                  <span style={{ ...mono, fontSize: 10, letterSpacing: "0.05em", textTransform: "uppercase", color: "#3f7a3f", border: "1px solid rgba(63,122,63,0.3)", borderRadius: 20, padding: "5px 12px" }}>Paid</span>
                ) : (
                  <button onClick={() => { if (c.squareLink) window.location.href = c.squareLink; }} style={{ ...btnSolid, background: grp.color, padding: "9px 15px" }}>Pay now</button>
                )}
              </div>
            </div>
          ))}
          <div style={{ ...mono, fontSize: 9, color: FAINT, marginTop: 11 }}>Payments are processed securely through Square.</div>
        </div>
      )}

      {status === "active" && (
        <div style={{ ...card, marginTop: 18, padding: 0, overflow: "hidden" }}>
          <button onClick={() => setBriefOpen(!briefOpen)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, background: "transparent", border: "none", padding: "16px 20px", cursor: "pointer", textAlign: "left" }}>
            <FileText size={17} color={grp.color} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...display, fontWeight: 600, fontSize: 15, color: INK }}>Production brief</div>
              <div style={{ ...mono, fontSize: 10, color: briefSubmitted ? "#2e7d4f" : STONE, marginTop: 2 }}>{briefStatusText}</div>
            </div>
            <ChevronDown size={18} color="#6f6d65" style={{ flexShrink: 0, transform: briefOpen ? "rotate(180deg)" : "none", transition: "transform 200ms" }} />
          </button>
          {briefOpen && (
            <div style={{ borderTop: `1px solid ${LINE}`, padding: "18px 20px 20px" }}>
              <div style={{ fontSize: 13, color: BODY, lineHeight: 1.55, marginBottom: 18 }}>Help us prepare for your project. The more you share, the better we can bring your vision to life. You can save a draft and finish later.</div>
              {BRIEF_FIELDS.map((f) => (
                <div key={f.key} style={{ marginBottom: 16 }}>
                  <div style={{ ...display, fontWeight: 600, fontSize: 13.5, color: INK }}>{f.label}</div>
                  <div style={{ fontSize: 11.5, color: STONE, marginTop: 1, marginBottom: 7, lineHeight: 1.4 }}>{f.help}</div>
                  <textarea value={brief[f.key] || ""} onChange={(e) => setBrief({ ...brief, [f.key]: e.target.value })} rows={3} style={{ width: "100%", border: `1px solid ${LINE}`, borderRadius: 8, padding: "10px 12px", fontSize: 13.5, fontFamily: "inherit", resize: "vertical", background: CREAM, color: BODY, boxSizing: "border-box" }} />
                </div>
              ))}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 4 }}>
                <button onClick={() => saveBrief(false)} style={{ ...mono, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", color: STONE, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 8, padding: "11px 16px", cursor: "pointer" }}>Save draft</button>
                <button onClick={() => saveBrief(true)} style={{ ...btnSolid, background: grp.color }}>{briefSubmitted ? "Save & update studio" : "Submit brief"}</button>
              </div>
              {briefMsg && <div style={{ ...mono, fontSize: 11.5, color: "#2e7d4f", marginTop: 12, display: "flex", alignItems: "center", gap: 7 }}><CheckCircle2 size={14} /> {briefMsg}</div>}
            </div>
          )}
        </div>
      )}

      <div style={{ marginBottom: 26 }}>
        {!reschedOpen ? (
          <button onClick={() => setReschedOpen(true)} style={{ ...mono, fontSize: 10.5, letterSpacing: "0.06em", color: STONE, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 7, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}><CalendarClock size={13} /> Need to reschedule?</button>
        ) : (
          <div style={{ background: CREAM, border: `1px solid ${LINE}`, borderRadius: 9, padding: "14px 16px", maxWidth: 460 }}>
            <div style={{ ...mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: STONE, marginBottom: 8 }}>Request a new date</div>
            <div style={{ fontSize: 12.5, color: fee > 0 ? "#b5271b" : "#2e7d4f", marginBottom: 10, lineHeight: 1.45 }}>{fee > 0 ? `A ${money(fee)} reschedule fee applies for video sessions.` : "Photography reschedules are free with reasonable notice."}</div>
            <input type="date" value={reschedDate} onChange={(e) => setReschedDate(e.target.value)} style={{ ...inputStyle, marginBottom: 10 }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { if (!reschedDate) return; onRescheduleRequest(session, reschedDate); setReschedOpen(false); }} style={{ ...btnSolid, background: grp.color }}><Send size={13} /> Send request</button>
              <button onClick={() => setReschedOpen(false)} style={btnGhost}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      <div style={{ ...card, marginTop: 18, padding: "22px 24px" }}>
        <div style={{ ...mono, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: STONE, marginBottom: 16 }}>Your session timeline</div>
        <Timeline session={session} accent={grp.color} actionPanel={<ClientActionPanel session={session} grp={grp} draft={draft} setDraft={setDraft} onSubmit={() => { addComment(session.id, "client", draft); setDraft(""); }} />} />
      </div>

      <div style={{ ...card, marginTop: 18, padding: "22px 24px" }}>
        <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 14 }}>Messages with the studio</div>
        {session.comments.length === 0 ? (
          <div style={{ fontSize: 13, color: FAINT, fontStyle: "italic", marginBottom: 12 }}>No messages yet. Send a note below.</div>
        ) : session.comments.map((c, i) => {
          const isNew = c.author === "studio" && !c.read;
          return (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, background: c.author === "client" ? grp.bg : CREAM, border: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "center" }}>{c.author === "client" ? <User size={12} color={grp.color} /> : <Camera size={12} color="#6f6d65" />}</div>
              <div style={{ background: isNew ? grp.bg : PAPER, border: `1px solid ${isNew ? grp.border : LINE}`, borderRadius: 8, padding: "8px 12px", flex: 1 }}>
                <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{c.body}</div>
                <div style={{ ...mono, fontSize: 9.5, color: isNew ? grp.text : FAINT, marginTop: 3, letterSpacing: "0.06em" }}>{c.author === "client" ? "You" : "Studio"} · {c.time}{isNew ? " · new" : ""}</div>
              </div>
            </div>
          );
        })}
        <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "flex-start" }}>
          <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Message the studio…" style={{ flex: 1, border: `1px solid ${LINE}`, borderRadius: 8, padding: "10px 12px", fontSize: 13.5, fontFamily: "inherit", background: PAPER, color: BODY }} />
          <button onClick={() => { addComment(session.id, "client", msg); setMsg(""); }} style={{ ...btnSolid, background: grp.color, whiteSpace: "nowrap" }}><Send size={14} /> Send</button>
        </div>
      </div>

      {docs.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 12 }}>Your documents</div>
          <div style={{ ...card, borderRadius: 14, overflow: "hidden", padding: 0 }}>
            {docs.map((d, i) => {
              const meta = DOC_META[d.agreement_type] || { label: String(d.agreement_type || "Document").replace(/_/g, " "), pdf: null };
              const usage = d.usage_option ? (DOC_USAGE[d.usage_option] || d.usage_option) : null;
              const when = d.signed_at ? new Date(d.signed_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "";
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, padding: "13px 16px", borderTop: i === 0 ? "none" : `1px solid ${LINE}`, background: PAPER }}>
                  <FileCheck size={16} color={grp.color} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ ...display, fontWeight: 600, fontSize: 14, color: INK }}>{meta.label}</div>
                    <div style={{ ...mono, fontSize: 9.5, color: STONE, marginTop: 2 }}>Signed{when ? " " + when : ""}{d.signed_name ? " by " + d.signed_name : ""}{usage ? " \u00b7 " + usage : ""}</div>
                  </div>
                  <span style={{ ...mono, fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: "#2e7d4f", background: "#eaf7ef", border: "1px solid #bfe6cc", borderRadius: 20, padding: "4px 9px", flexShrink: 0 }}>Signed</span>
                  {d.id && <a href={"/api/signed-doc?id=" + encodeURIComponent(d.id)} target="_blank" rel="noopener noreferrer" style={{ ...mono, fontSize: 10.5, letterSpacing: "0.04em", color: grp.color, textDecoration: "none", flexShrink: 0 }}>View</a>}
                </div>
              );
            })}
          </div>
          <div style={{ ...mono, fontSize: 9.5, color: FAINT, marginTop: 8, lineHeight: 1.5 }}>These are the agreements on file for your account. Keep this for your records.</div>
        </div>
      )}

      <div style={{ ...card, marginTop: 18, padding: "22px 24px" }}>
        <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 5 }}>Email preferences</div>
        <div style={{ fontSize: 12.5, color: STONE, marginBottom: 6 }}>Choose which emails you'd like from us. Everything still shows here in your portal either way.</div>
        {[["updates", "Project updates", "Status changes and reschedules"], ["messages", "Messages", "Replies from the studio"], ["payments", "Payments & receipts", "Balance reminders, payment requests, and receipts"]].map(([key, label, sub]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "13px 0", borderTop: `1px solid ${LINE}` }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, color: INK, fontWeight: 500 }}>{label}</div>
              <div style={{ ...mono, fontSize: 10, color: FAINT, marginTop: 2 }}>{sub}</div>
            </div>
            <button onClick={() => toggleEmailPref(key)} role="switch" aria-checked={!!emailPrefs[key]} style={{ position: "relative", width: 44, height: 24, borderRadius: 20, border: "none", cursor: "pointer", flexShrink: 0, background: emailPrefs[key] ? grp.color : "#d8d4ca", transition: "background 0.15s", padding: 0 }}>
              <span style={{ position: "absolute", top: 3, left: emailPrefs[key] ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.15s", boxShadow: "0 1px 2px rgba(0,0,0,0.25)" }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClientActionPanel({ session, grp, draft, setDraft, onSubmit }) {
  const g = grp || GROUPS[session.serviceLine] || GROUPS.video;
  const stage = session.currentStage;
  const isVideo = session.serviceLine === "video";
  if (stage === 5) {
    const reviewLabel = isVideo ? "Review your cut on Frame.io" : "Preview your gallery";
    return (
      <div style={{ background: CREAM, border: `1px solid ${LINE}`, borderRadius: 10, padding: "16px 18px", marginTop: 4 }}>
        <div style={{ ...mono, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: g.color, marginBottom: 10 }}>Your preview is ready</div>
        {session.reviewLink ? <a href={session.reviewLink} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: INK, color: "#fff", textDecoration: "none", padding: "10px 16px", borderRadius: 8, fontSize: 13.5, marginBottom: 14 }}>{isVideo ? <Play size={15} /> : <ImageIcon size={15} />} {reviewLabel}</a> : <div style={{ ...mono, fontSize: 11, color: FAINT, marginBottom: 12 }}>Preview link coming shortly.</div>}
        <div style={{ fontSize: 13, color: BODY, marginBottom: 8, lineHeight: 1.5 }}>Watched it? If you'd like any changes, tell us here and we'll take care of them.</div>
        <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Suggest an edit…" rows={3} style={{ width: "100%", border: `1px solid ${LINE}`, borderRadius: 8, padding: "10px 12px", fontSize: 13.5, fontFamily: "inherit", resize: "vertical", background: PAPER, color: BODY, boxSizing: "border-box" }} />
        <button onClick={onSubmit} style={{ marginTop: 10, ...btnSolid, background: g.color, textTransform: "none", letterSpacing: 0, fontSize: 13 }}><Send size={14} /> Send edit request</button>
      </div>
    );
  }
  if (stage === 6) {
    const vault = [
      ...(session.deliveryVideo ? [{ label: "Final Film", url: session.deliveryVideo, note: isVideo ? "Watch & download on Frame.io" : "Video file", kind: "film" }] : []),
      ...(session.deliveryPhoto ? [{ label: "Full Gallery", url: session.deliveryPhoto, note: "View & download your photos", kind: "image" }] : []),
      ...((Array.isArray(session.deliverables) ? session.deliverables : []).filter((d) => d && d.url).map((d) => ({ label: d.label || "Deliverable", url: d.url, note: d.note || "", kind: "file" }))),
    ];
    return (
      <div style={{ marginTop: 4 }}>
        <div style={{ background: CREAM, border: `1px solid ${LINE}`, borderRadius: 10, padding: "18px" }}>
          <div style={{ ...mono, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: g.color, marginBottom: 14 }}>Your finished work is ready</div>
          {vault.length ? (
            <div style={{ display: "grid", gap: 10 }}>
              {vault.map((it, i) => {
                const Ic = it.kind === "film" ? Film : it.kind === "image" ? ImageIcon : Download;
                return (
                  <a key={i} href={it.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 13, background: PAPER, border: `1px solid ${LINE}`, borderRadius: 10, padding: "13px 15px", textDecoration: "none" }}>
                    <div style={{ width: 38, height: 38, borderRadius: 9, background: g.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Ic size={18} color={g.color} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ ...display, fontWeight: 600, fontSize: 15, color: INK }}>{it.label}</div>
                      {it.note && <div style={{ ...mono, fontSize: 10, color: STONE, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.note}</div>}
                    </div>
                    <div style={{ ...mono, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", color: "#fff", background: g.color, borderRadius: 7, padding: "8px 12px", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}><Download size={13} /> Get</div>
                  </a>
                );
              })}
            </div>
          ) : <div style={{ ...mono, fontSize: 11, color: FAINT }}>Your files are being prepared. We'll email you the moment they're ready.</div>}
          <div style={{ ...mono, fontSize: 10, color: FAINT, marginTop: 14, letterSpacing: "0.05em" }}>Please download and back up your files. Galleries may be removed after 6 months.</div>
        </div>
        <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 10, padding: "16px 18px", marginTop: 12, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <Star size={22} color="#f5b301" fill="#f5b301" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ ...display, fontWeight: 600, fontSize: 15.5, color: INK }}>Loved working with us?</div>
            <div style={{ fontSize: 12.5, color: STONE, lineHeight: 1.45, marginTop: 2 }}>A Google review means the world to a small studio, and helps other Alaska families find us.</div>
          </div>
          <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: INK, color: "#fff", textDecoration: "none", padding: "10px 16px", borderRadius: 8, fontSize: 13, whiteSpace: "nowrap" }}><Star size={14} /> Leave a review</a>
        </div>
      </div>
    );
  }
  return <div style={{ display: "flex", alignItems: "center", gap: 9, color: STONE, fontSize: 13, marginTop: 4, background: CREAM, border: `1px dashed ${LINE}`, borderRadius: 10, padding: "13px 16px" }}><Clock size={15} color="#9a988f" /> We'll email you the moment your next update is ready.</div>;
}

/* ============================ ADMIN — HOME ============================ */
function StudioHome({ state, setAdminId, setAdminTab }) {
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
        <img src="/dot1-logo.png" alt="Dot One Media" style={{ height: 46, width: "auto", display: "block" }} />
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ ...mono, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: RED, marginBottom: 6 }}>{timeGreeting()}</div>
          <h2 style={{ ...display, fontWeight: 700, fontSize: 24, color: INK, letterSpacing: "-0.01em" }}>Studio Dashboard</h2>
          <div style={{ fontSize: 13.5, color: STONE, marginTop: 6, lineHeight: 1.5 }}>{upcoming.length === 0 ? "No upcoming sessions on the calendar right now. A good time to line up your next shoot." : "You have " + upcoming.length + " upcoming " + (upcoming.length === 1 ? "session" : "sessions") + "." + (next ? " Next up: " + next.clientName + "'s " + next.type + " on " + fmtDate(next.date) + (next.time ? " at " + fmtTime(next.time) : "") + "." : "")}</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(148px, 1fr))", gap: 12, marginBottom: 18 }}>
        {stat(upcoming.length, "Upcoming")}
        {stat(activeCount, "Active bookings")}
        {stat(money(Math.round(collected)), "Collected", "#3f7a3f")}
        {stat(money(Math.round(outstanding)), "Outstanding", outstanding > 0 ? "#a97a2e" : INK)}
      </div>
      <div style={{ ...cardDense, padding: "18px 20px", marginBottom: 18 }}>
        <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 14 }}>Upcoming sessions</div>
        {upcoming.length === 0 ? (
          <div style={{ fontSize: 13, color: FAINT, fontStyle: "italic" }}>Nothing scheduled yet. New bookings show up here automatically.</div>
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

/* ============================ ADMIN — SESSIONS ============================ */
function AdminSessions({ state, adminId, setAdminId, requestSetStage, addComment, patchSession, onReschedule, slotTaken, markMessagesRead, onCancelBooking, onCloseBooking, onReopenBooking, onSendBalance, onSendCharge, onDeleteBooking }) {
  const [chgLabel, setChgLabel] = useState("");
  const [chgAmt, setChgAmt] = useState("");
  useEffect(() => { setChgLabel(""); setChgAmt(""); }, [adminId]);
  const isMobile = useIsMobile();
  const session = state.sessions.find((s) => s.id === adminId) || state.sessions[0] || null;
  const [msg, setMsg] = useState("");
  const [editLinks, setEditLinks] = useState(false);
  const [videoLink, setVideoLink] = useState("");
  const [photoLink, setPhotoLink] = useState("");
  const [reviewLink, setReviewLink] = useState("");
  const [delivLabel, setDelivLabel] = useState("");
  const [delivUrl, setDelivUrl] = useState("");
  const [delivNote, setDelivNote] = useState("");
  const [reschedOpen, setReschedOpen] = useState(false);
  const [reschedDate, setReschedDate] = useState("");
  const [reschedTime, setReschedTime] = useState("");
  useEffect(() => { if (!session) return; setVideoLink(session.deliveryVideo || ""); setPhotoLink(session.deliveryPhoto || ""); setReviewLink(session.reviewLink || ""); setEditLinks(false); setReschedOpen(false); setReschedDate(session.date || ""); setReschedTime(session.time || ""); }, [adminId]);
  if (!session) return <div style={{ ...mono, fontSize: 13, color: STONE, padding: "48px 4px", textAlign: "center" }}>No bookings yet. When a client books a session, it will show up here.</div>;
  const sg = GROUPS[session.serviceLine] || GROUPS.video;
  const status = session.status || "active";
  const saveLinks = () => { patchSession(session.id, { deliveryVideo: videoLink.trim(), deliveryPhoto: photoLink.trim(), reviewLink: reviewLink.trim() }); setEditLinks(false); };
  const addDeliverable = () => { if (!delivLabel.trim() || !delivUrl.trim()) return; const item = { id: "d" + Date.now(), label: delivLabel.trim(), url: delivUrl.trim(), note: delivNote.trim() }; patchSession(session.id, { deliverables: [...(session.deliverables || []), item] }); setDelivLabel(""); setDelivUrl(""); setDelivNote(""); };
  const reschedClash = slotTaken(reschedDate, reschedTime, session.id);

  return (
    <div className="d1-stagger" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "260px 1fr", gap: isMobile ? 20 : 26 }}>
      <div>
        <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase", color: RED, marginBottom: 14 }}>Sessions</div>
        {(() => {
          const now = new Date();
          const todayStr = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
          const groups = { today: [], upcoming: [], completed: [] };
          for (const s of (state.sessions || [])) groups[sessionBucket(s, todayStr)].push(s);
          groups.today.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
          groups.upcoming.sort((a, b) => ((a.date || "") + (a.time || "")).localeCompare((b.date || "") + (b.time || "")));
          groups.completed.sort((a, b) => ((b.date || "") + (b.time || "")).localeCompare((a.date || "") + (a.time || "")));
          const renderBtn = (s) => { const selected = s.id === adminId; const grp = GROUPS[s.serviceLine] || GROUPS.video; const unread = s.comments.filter((c) => c.author === "client" && !c.read).length; return (
            <button key={s.id} className="d1-lift" onClick={() => { setAdminId(s.id); markMessagesRead(s.id, "client"); }} style={{ width: "100%", textAlign: "left", marginBottom: 8, padding: "12px 14px", borderRadius: 9, cursor: "pointer", border: `1px solid ${selected ? INK : LINE}`, background: selected ? INK : PAPER, color: selected ? "#fff" : BODY }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <span style={{ ...display, fontWeight: 600, fontSize: 15 }}>{s.clientName}</span>
                {unread > 0 && <span style={{ ...mono, background: RED, color: "#fff", borderRadius: 20, fontSize: 9.5, minWidth: 16, height: 16, padding: "0 5px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{unread}</span>}
              </div>
              <div style={{ ...mono, fontSize: 10, letterSpacing: "0.06em", color: selected ? "#c9c6bd" : STONE, display: "flex", alignItems: "center", gap: 6 }}><grp.Icon size={11} /> {s.type} · {(s.status && s.status !== "active") ? (s.status === "cancelled" ? "Cancelled" : "Closed") : curStage(s).label}</div>
              {s.date && <div style={{ ...mono, fontSize: 9.5, letterSpacing: "0.04em", color: selected ? "#b3b0a7" : FAINT, marginTop: 3 }}>{fmtDate(s.date)}{s.time ? " \u00b7 " + fmtTime(s.time) : ""}</div>}
            </button>
          ); };
          if (!(state.sessions || []).length) return null;
          const sections = [["today", "Today"], ["upcoming", "Upcoming"], ["completed", "Completed"]];
          return sections.map(([key, label]) => groups[key].length === 0 ? null : (
            <div key={key} style={{ marginBottom: 16 }}>
              <div style={{ ...mono, fontSize: 9.5, letterSpacing: "0.16em", textTransform: "uppercase", color: key === "today" ? RED : STONE, marginBottom: 8 }}>{label} <span style={{ color: FAINT }}>{"\u00b7 "}{groups[key].length}</span></div>
              {groups[key].map(renderBtn)}
            </div>
          ));
        })()}
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4, flexWrap: "wrap" }}>
          <Avatar name={session.clientName} src={session.clientImage} size={40} />
          <h2 style={{ ...display, fontWeight: 700, fontSize: 26, color: INK, letterSpacing: "-0.01em" }}>{session.clientName}</h2>
          <ServicePill line={session.serviceLine} />
        </div>
        <div style={{ ...mono, fontSize: 11, color: STONE, marginBottom: session.notifyEmail ? 4 : 18, letterSpacing: "0.04em" }}>{session.type} · {fmtDate(session.date) || "date TBD"}{session.time ? " at " + fmtTime(session.time) : ""} · {session.clientEmail}</div>
        {session.notifyEmail && <div style={{ ...mono, fontSize: 10, color: FAINT, marginBottom: 18, letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 6 }}><Send size={11} /> New-booking alert routed to {session.notifyEmail}</div>}
        {(session.paymentStatus === "paid" || session.paymentStatus === "pending") && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: session.paymentStatus === "paid" ? "#eef6ee" : "#fbf4e9", border: `1px solid ${session.paymentStatus === "paid" ? "#cfe6cf" : "#f0e2c4"}`, borderRadius: 8, padding: "7px 12px", marginBottom: 16 }}>
            <span style={{ ...mono, fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: session.paymentStatus === "paid" ? "#3f7a3f" : "#a97a2e" }}>{session.paymentStatus === "paid" ? "Paid" : "Payment pending"}{session.payAmount ? " · " + money(session.payAmount) : ""}</span>
          </div>
        )}
        {(() => {
          const balanceDue = (Number(session.total) || 0) - (Number(session.payAmount) || 0);
          if (session.paymentStatus !== "paid" || balanceDue <= 0) return null;
          if (session.balanceStatus === "paid") return <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "#3f7a3f", marginBottom: 16 }}>Paid in full</div>;
          return (
            <div style={{ marginBottom: 16 }}>
              <button onClick={() => onSendBalance(session)} style={{ ...mono, fontSize: 10.5, letterSpacing: "0.06em", color: "#a97a2e", background: "transparent", border: "1px solid #f0e2c4", borderRadius: 7, padding: "8px 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7 }}><Wallet size={13} /> {session.balanceStatus === "sent" ? "Resend balance link" : "Email balance link"} · {money(balanceDue)}</button>
            </div>
          );
        })()}

        {(status === "active" || (Array.isArray(session.charges) && session.charges.length > 0)) && (
          <div style={{ marginBottom: 22, ...cardDense, padding: "15px 16px" }}>
            <div style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: STONE, marginBottom: 12 }}>Payment requests</div>
            {Array.isArray(session.charges) && session.charges.length > 0 && (
              <div style={{ marginBottom: status === "active" ? 14 : 0 }}>
                {session.charges.map((c) => (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "8px 0", borderTop: `1px solid ${LINE}` }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: INK, fontWeight: 500 }}>{c.label}</div>
                      <div style={{ ...mono, fontSize: 9.5, color: FAINT }}>{c.status === "paid" ? ("Paid" + (c.cardLast4 ? " \u00b7 " + (c.cardBrand ? String(c.cardBrand).replace(/_/g, " ") : "Card") + " \u00b7\u00b7\u00b7\u00b7 " + c.cardLast4 : "")) : "Awaiting payment"}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, flexShrink: 0 }}>
                      <span style={{ fontSize: 13, color: c.status === "paid" ? STONE : INK, fontWeight: 500 }}>{money((Number(c.amountCents) || 0) / 100)}</span>
                      <span style={{ ...mono, fontSize: 9, letterSpacing: "0.06em", textTransform: "uppercase", color: c.status === "paid" ? "#3f7a3f" : "#a97a2e" }}>{c.status === "paid" ? "Paid" : "Pending"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {status === "active" && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <input value={chgLabel} onChange={(e) => setChgLabel(e.target.value)} placeholder={"What's it for? (USB of files, overtime\u2026)"} style={{ flex: "1 1 200px", minWidth: 0, border: `1px solid ${LINE}`, borderRadius: 7, padding: "9px 11px", fontSize: 13, color: INK, background: PAPER, fontFamily: "inherit" }} />
                <input value={chgAmt} onChange={(e) => setChgAmt(e.target.value.replace(/[^0-9.]/g, ""))} inputMode="decimal" placeholder="$0.00" style={{ width: 92, border: `1px solid ${LINE}`, borderRadius: 7, padding: "9px 11px", fontSize: 13, color: INK, background: PAPER, fontFamily: "inherit" }} />
                <button onClick={async () => { const amt = parseFloat(chgAmt); if (!chgLabel.trim() || !(amt > 0)) { showToast("Add a description and an amount."); return; } await onSendCharge(session, chgLabel.trim(), amt); }} style={{ ...mono, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", color: "#fff", background: RED, border: "none", borderRadius: 7, padding: "9px 14px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}><Wallet size={12} /> Send request</button>
              </div>
            )}
          </div>
        )}

        {status === "active" ? (
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <button onClick={() => onCancelBooking(session)} style={{ ...mono, fontSize: 10.5, letterSpacing: "0.06em", color: "#b5271b", background: "transparent", border: "1px solid #f2cdc9", borderRadius: 7, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}><XCircle size={13} /> Cancel booking</button>
            <button onClick={() => onCloseBooking(session)} style={{ ...mono, fontSize: 10.5, letterSpacing: "0.06em", color: STONE, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 7, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}><Ban size={13} /> Close (no-show / unpaid)</button>
          </div>
        ) : (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: status === "cancelled" ? "#fbeeed" : "#f3f1ec", border: `1px solid ${status === "cancelled" ? "#f2cdc9" : LINE}`, borderRadius: 8, padding: "8px 13px", marginBottom: 16 }}>
            <span style={{ ...mono, fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: status === "cancelled" ? "#b5271b" : STONE }}>{status === "cancelled" ? "Booking cancelled" : "Booking closed"}</span>
            <button onClick={() => onReopenBooking(session)} style={{ ...mono, fontSize: 10, letterSpacing: "0.06em", color: STONE, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>Reopen</button>
            <button onClick={() => onDeleteBooking(session)} style={{ ...mono, fontSize: 10, letterSpacing: "0.06em", color: "#b5271b", background: "transparent", border: "1px solid #f2cdc9", borderRadius: 6, padding: "4px 10px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}><Trash2 size={11} /> Delete</button>
          </div>
        )}

        <div style={{ marginBottom: 22 }}>
          {!reschedOpen ? (
            <button onClick={() => setReschedOpen(true)} style={{ ...mono, fontSize: 10.5, letterSpacing: "0.06em", color: STONE, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 7, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}><CalendarClock size={13} /> Reschedule session</button>
          ) : (
            <div style={{ background: CREAM, border: `1px solid ${LINE}`, borderRadius: 9, padding: "14px 16px", maxWidth: 480 }}>
              <div style={{ ...mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: STONE, marginBottom: 8 }}>Move to a new date & time</div>
              <div style={{ display: "flex", gap: 10 }}>
                <input type="date" value={reschedDate} onChange={(e) => setReschedDate(e.target.value)} style={{ ...inputStyle, marginBottom: 10 }} />
                <input type="time" value={reschedTime} onChange={(e) => setReschedTime(e.target.value)} style={{ ...inputStyle, marginBottom: 10 }} />
              </div>
              {reschedClash && <div style={{ fontSize: 11.5, color: "#b5271b", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={12} /> That slot conflicts with another booking.</div>}
              <div style={{ fontSize: 11.5, color: STONE, marginBottom: 10 }}>A reschedule confirmation email will be sent to the client.</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { if (!reschedDate || reschedClash) return; onReschedule(session, reschedDate, reschedTime); setReschedOpen(false); }} style={{ ...btnSolid, background: reschedClash ? FAINT : sg.color }}><Check size={13} /> Confirm & email</button>
                <button onClick={() => setReschedOpen(false)} style={btnGhost}>Cancel</button>
              </div>
            </div>
          )}
        </div>

        {status === "active" && (session.currentStage < stagesFor(session).length - 1 ? (
          <button onClick={() => requestSetStage(session, session.currentStage + 1)} style={{ ...btnSolid, background: sg.color, marginBottom: 18, fontSize: 14, padding: "12px 20px" }}>{session.currentStage === 0 ? "Confirm booking" : "Advance to: " + stagesFor(session)[session.currentStage + 1].label} <ArrowRight size={16} /></button>
        ) : (
          <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: sg.color, marginBottom: 18 }}>Final delivery reached. This session is complete.</div>
        ))}
        <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: STONE, marginBottom: 12 }}>Advance the session — click a stage to set it current</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          {stagesFor(session).map((st, i) => { const done = i < session.currentStage, current = i === session.currentStage, St = st.Icon; return (
            <button key={st.key} onClick={() => requestSetStage(session, i)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12.5, border: `1px solid ${current ? sg.color : done ? sg.border : LINE}`, background: current ? sg.color : done ? sg.bg : PAPER, color: current ? "#fff" : done ? sg.text : STONE }}><St size={13} /> <span style={mono}>{i + 1}</span> {st.label}</button>
          ); })}
        </div>
        <div style={{ ...mono, fontSize: 9.5, color: FAINT, marginBottom: 26, letterSpacing: "0.04em" }}>You'll be asked to confirm — advancing sends the client a status email.</div>

        <div style={{ ...cardDense, padding: "16px 18px", marginBottom: 22 }}>
          <div style={{ ...mono, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 12, display: "flex", alignItems: "center", gap: 7 }}><FileText size={13} /> Production brief{session.brief && session.brief.submitted && <span style={{ ...mono, fontSize: 8.5, letterSpacing: "0.08em", color: "#2e7d4f", background: "#eaf7ef", border: "1px solid #bfe6cc", borderRadius: 20, padding: "3px 8px" }}>SUBMITTED</span>}</div>
          {session.brief && BRIEF_FIELDS.some((f) => (session.brief[f.key] || "").trim()) ? (
            BRIEF_FIELDS.filter((f) => (session.brief[f.key] || "").trim()).map((f) => (
              <div key={f.key} style={{ marginBottom: 13 }}>
                <div style={{ ...mono, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: FAINT, marginBottom: 3 }}>{f.label}</div>
                <div style={{ fontSize: 13, color: BODY, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{session.brief[f.key]}</div>
              </div>
            ))
          ) : <div style={{ fontSize: 12.5, color: FAINT, fontStyle: "italic" }}>The client hasn't filled out their production brief yet.</div>}
        </div>

        <div style={{ ...cardDense, padding: "16px 18px", marginBottom: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ ...mono, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, display: "flex", alignItems: "center", gap: 7 }}><Link2 size={13} /> Delivery & review links</div>
            {!editLinks ? <button onClick={() => setEditLinks(true)} style={{ ...mono, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: sg.color, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 6, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Pencil size={11} /> Edit</button> : (
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={saveLinks} style={{ ...mono, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#fff", background: sg.color, border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><Check size={11} /> Save</button>
                <button onClick={() => { setEditLinks(false); setVideoLink(session.deliveryVideo || ""); setPhotoLink(session.deliveryPhoto || ""); setReviewLink(session.reviewLink || ""); }} style={{ ...mono, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: STONE, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 6, padding: "6px 10px", cursor: "pointer" }}>Cancel</button>
              </div>
            )}
          </div>
          {editLinks ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <LinkField label="Preview / review link" value={reviewLink} onChange={setReviewLink} placeholder="https://f.io/… or https://gallery…" />
              <LinkField label="Final video delivery (Frame.io)" value={videoLink} onChange={setVideoLink} placeholder="https://f.io/…" />
              <LinkField label="Final photo delivery (gallery)" value={photoLink} onChange={setPhotoLink} placeholder="https://gallery.dot1.media/…" />
            </div>
          ) : (
            <div><LinkRow label="Preview / review" url={session.reviewLink} /><LinkRow label="Final video (Frame.io)" url={session.deliveryVideo} /><LinkRow label="Final photos (gallery)" url={session.deliveryPhoto} /></div>
          )}
        </div>

        <div style={{ ...cardDense, padding: "16px 18px", marginBottom: 22 }}>
          <div style={{ ...mono, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 4, display: "flex", alignItems: "center", gap: 7 }}><PackageCheck size={13} /> Deliverables vault</div>
          <div style={{ ...mono, fontSize: 9.5, color: FAINT, marginBottom: 12, lineHeight: 1.5 }}>Extra labeled downloads the client sees in their vault (the Final video and photo links above appear there automatically).</div>
          {(session.deliverables || []).length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              {(session.deliverables || []).map((d, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: CREAM, border: `1px solid ${LINE}`, borderRadius: 8, padding: "9px 12px" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: INK }}>{d.label}</div>
                    <div style={{ ...mono, fontSize: 9.5, color: STONE, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.note ? d.note + " \u00b7 " : ""}{d.url}</div>
                  </div>
                  <button onClick={() => patchSession(session.id, { deliverables: (session.deliverables || []).filter((_, j) => j !== i) })} style={{ ...mono, fontSize: 9.5, letterSpacing: "0.06em", textTransform: "uppercase", color: "#b5271b", background: "transparent", border: `1px solid ${LINE}`, borderRadius: 6, padding: "5px 9px", cursor: "pointer", flexShrink: 0 }}>Remove</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input value={delivLabel} onChange={(e) => setDelivLabel(e.target.value)} placeholder={"Label (e.g. Social Cut \u00b7 1080\u00d71920)"} style={{ border: `1px solid ${LINE}`, borderRadius: 7, padding: "9px 11px", fontSize: 12.5, fontFamily: "inherit", background: PAPER, color: BODY, boxSizing: "border-box" }} />
            <input value={delivUrl} onChange={(e) => setDelivUrl(e.target.value)} placeholder="Download URL" style={{ border: `1px solid ${LINE}`, borderRadius: 7, padding: "9px 11px", fontSize: 12.5, fontFamily: "inherit", background: PAPER, color: BODY, boxSizing: "border-box" }} />
            <input value={delivNote} onChange={(e) => setDelivNote(e.target.value)} placeholder={"Note (optional, e.g. ProRes 422 \u00b7 18.7 GB)"} style={{ border: `1px solid ${LINE}`, borderRadius: 7, padding: "9px 11px", fontSize: 12.5, fontFamily: "inherit", background: PAPER, color: BODY, boxSizing: "border-box" }} />
            <button onClick={addDeliverable} disabled={!delivLabel.trim() || !delivUrl.trim()} style={{ ...mono, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#fff", background: (delivLabel.trim() && delivUrl.trim()) ? sg.color : FAINT, border: "none", borderRadius: 7, padding: "9px 13px", cursor: (delivLabel.trim() && delivUrl.trim()) ? "pointer" : "default", alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6 }}><Plus size={12} /> Add deliverable</button>
          </div>
        </div>

        <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: STONE, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><MessageSquare size={13} /> Client messages & requests</div>
        {session.comments.filter((c) => c.author === "client").length === 0 ? <div style={{ fontSize: 13, color: FAINT, fontStyle: "italic", marginBottom: 20 }}>No messages yet.</div> : session.comments.filter((c) => c.author === "client").map((c, i) => (
          <div key={i} style={{ background: sg.bg, border: `1px solid ${sg.border}`, borderRadius: 8, padding: "10px 13px", marginBottom: 8 }}>
            <div style={{ fontSize: 13.5, lineHeight: 1.5, color: BODY }}>{c.body}</div>
            <div style={{ ...mono, fontSize: 9.5, color: sg.text, marginTop: 3, letterSpacing: "0.06em" }}>{session.clientName} · {c.time}</div>
          </div>
        ))}
        <div style={{ marginTop: 18, display: "flex", gap: 8, alignItems: "flex-start" }}>
          <input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Send a note to the client…" style={{ flex: 1, border: `1px solid ${LINE}`, borderRadius: 8, padding: "10px 12px", fontSize: 13.5, fontFamily: "inherit", background: PAPER, color: BODY }} />
          <button onClick={() => { addComment(session.id, "studio", msg); setMsg(""); }} style={{ ...btnSolid, background: INK, whiteSpace: "nowrap" }}><Send size={14} /> Send</button>
        </div>
      </div>
    </div>
  );
}

/* ============================ ADMIN — CALENDAR ============================ */
function AdminCalendar({ state, onSelectSession }) {
  const [group, setGroup] = useState("video");
  const today = new Date();
  const [ym, setYm] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const g = GROUPS[group];
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
      <div style={{ ...cardDense, padding: "18px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}><g.Icon size={17} color={g.color} /><span style={{ ...display, fontWeight: 700, fontSize: 20, color: INK }}>{g.label} Calendar</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button onClick={prev} style={navBtn}><ChevronLeft size={16} /></button>
            <span style={{ ...mono, fontSize: 12, letterSpacing: "0.06em", color: INK, minWidth: 140, textAlign: "center" }}>{monthName}</span>
            <button onClick={next} style={navBtn}><ChevronRight size={16} /></button>
          </div>
        </div>
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
        <div style={{ display: "flex", gap: 16, marginTop: 14, flexWrap: "wrap", ...mono, fontSize: 9.5, color: FAINT }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: g.color }} /> Booked session</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, border: `1.5px dashed ${g.color}` }} /> Held slot (direct link)</span>
          <span>· Click a session to manage it</span>
        </div>
      </div>
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

/* ============================ SERVICE CATALOG ============================ */
function CalendarSync({ showToast }) {
  const [url, setUrl] = useState("");
  useEffect(() => { fetch("/api/calendar-url").then((r) => r.json()).then((d) => { if (d && d.url) setUrl(d.url); }).catch(() => {}); }, []);
  const copy = () => { if (!url) return; try { navigator.clipboard.writeText(url); showToast("Calendar link copied."); } catch (e) { showToast("Select the link and copy it manually."); } };
  return (
    <div style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: "18px 20px", marginBottom: 26, background: PAPER }}>
      <div style={{ ...mono, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: RED, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}><CalendarCheck size={13} /> Sync bookings to your calendar</div>
      <div style={{ fontSize: 13, color: BODY, lineHeight: 1.5, marginBottom: 14, maxWidth: 620 }}>Add this private link to Google or Apple Calendar and your bookings appear there automatically. Keep it private: anyone with the link can see your booking schedule.</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}>
        <input readOnly value={url || "Loading..."} onFocus={(e) => e.target.select()} style={{ ...inputStyle, flex: 1, minWidth: 260, fontFamily: "monospace", fontSize: 11.5 }} />
        <button onClick={copy} style={{ ...btnSolid, background: RED }}><Copy size={14} /> Copy link</button>
      </div>
      <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: STONE, marginBottom: 6 }}>Google Calendar</div>
          <div style={{ fontSize: 12, color: BODY, lineHeight: 1.6 }}>Open Google Calendar on the web. Next to "Other calendars," click + then "From URL." Paste the link and click "Add calendar."</div>
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: STONE, marginBottom: 6 }}>Apple Calendar</div>
          <div style={{ fontSize: 12, color: BODY, lineHeight: 1.6 }}>In the Calendar app, choose File, then "New Calendar Subscription." Paste the link, click Subscribe, and set your refresh interval.</div>
        </div>
      </div>
    </div>
  );
}

function AvailabilityManager({ availability, addAvailability, removeAvailability, showToast }) {
  const [date, setDate] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("15:00");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!date || !start || !end) { showToast("Pick a day and open/close times."); return; }
    if (end <= start) { showToast("Close time must be after open time."); return; }
    setBusy(true);
    const r = await addAvailability({ date, start, end });
    setBusy(false);
    if (r && r.ok) { showToast("Day opened for booking."); setDate(""); } else { showToast((r && r.error) || "Could not open that day."); }
  };
  return (
    <div>
      <div style={{ ...mono, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: RED, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}><CalendarCheck size={13} /> Open availability</div>
      <div style={{ fontSize: 13, color: BODY, lineHeight: 1.5, marginBottom: 16, maxWidth: 560 }}>Open specific days with the hours you're available. Clients can only book a day and time you have opened here.</div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", ...cardDense, padding: "16px", marginBottom: 24 }}>
        <div><FieldLabel>Day</FieldLabel><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyle, width: "auto" }} /></div>
        <div><FieldLabel>Open from</FieldLabel><input type="time" value={start} onChange={(e) => setStart(e.target.value)} style={{ ...inputStyle, width: "auto" }} /></div>
        <div><FieldLabel>Until</FieldLabel><input type="time" value={end} onChange={(e) => setEnd(e.target.value)} style={{ ...inputStyle, width: "auto" }} /></div>
        <button onClick={submit} disabled={busy} style={{ ...btnSolid, background: busy ? FAINT : RED }}><Plus size={14} /> {busy ? "Opening..." : "Open this day"}</button>
      </div>
      <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 10 }}>Upcoming open days</div>
      {(!availability || availability.length === 0) ? (
        <EmptyHint text="No open days yet. Open one above and it becomes bookable right away." />
      ) : (
        availability.map((a) => (
          <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, border: `1px solid ${LINE}`, borderRadius: 9, padding: "12px 15px", marginBottom: 8, background: PAPER }}>
            <div>
              <div style={{ ...display, fontWeight: 600, fontSize: 15, color: INK }}>{fmtDate(a.date)}</div>
              <div style={{ ...mono, fontSize: 11, color: STONE, marginTop: 2 }}>{fmtTime(a.start)} to {fmtTime(a.end)}</div>
            </div>
            <IconBtn onClick={async () => { const r = await removeAvailability(a.id); if (r && !r.ok) showToast(r.error || "Could not remove."); }} danger><Trash2 size={13} /></IconBtn>
          </div>
        ))
      )}
    </div>
  );
}

function ServiceCatalog({ state, addService, updateService, deleteService, addAddon, updateAddon, deleteAddon, showToast, setConfirm }) {
  const isMobile = useIsMobile();
  const [group, setGroup] = useState("video");
  const [svcForm, setSvcForm] = useState(null);
  const [addonForm, setAddonForm] = useState(null);
  const groupServices = state.services.filter((s) => s.group === group);
  const groupAddons = state.addons.filter((a) => a.group === group);
  const g = GROUPS[group];
  const startNewService = () => setSvcForm({ name: "", description: "", price: "", category: "", duration: "", padBefore: "", padAfter: "", addonMode: "group", addonIds: [], visible: true });
  const saveService = async () => { if (!svcForm.name.trim()) { showToast("Give the service a name first."); return; } const r = svcForm.id ? await updateService(svcForm.id, svcForm) : await addService({ ...svcForm, group }); if (r && r.ok) { showToast(svcForm.id ? "Service updated." : "Service created."); setSvcForm(null); } else { showToast((r && r.error) || "Could not save the service."); } };
  const startNewAddon = () => setAddonForm({ name: "", price: "", addTime: "", visible: true });
  const saveAddon = async () => { if (!addonForm.name.trim()) { showToast("Give the add-on a name first."); return; } const r = addonForm.id ? await updateAddon(addonForm.id, addonForm) : await addAddon({ ...addonForm, group }); if (r && r.ok) { showToast(addonForm.id ? "Add-on updated." : "Add-on created."); setAddonForm(null); } else { showToast((r && r.error) || "Could not save the add-on."); } };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
        {GROUP_KEYS.map((k) => { const gg = GROUPS[k]; const active = group === k; return (
          <button key={k} onClick={() => { setGroup(k); setSvcForm(null); setAddonForm(null); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 15px", borderRadius: 8, cursor: "pointer", fontSize: 13, border: `1px solid ${active ? gg.color : LINE}`, background: active ? gg.color : PAPER, color: active ? "#fff" : STONE }}><gg.Icon size={14} /> {gg.label}</button>
        ); })}
      </div>
      <PaymentRuleBanner group={group} />
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24 }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ ...mono, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: g.color, display: "flex", alignItems: "center", gap: 8 }}><Tag size={13} /> {g.label} Services</div>
            {!svcForm && <button onClick={startNewService} style={{ ...mono, fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: "#fff", background: g.color, border: "none", borderRadius: 7, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Plus size={13} /> New service</button>}
          </div>
          {svcForm && <ServiceForm form={svcForm} setForm={setSvcForm} onSave={saveService} onCancel={() => setSvcForm(null)} group={group} groupAddons={groupAddons} />}
          {groupServices.length === 0 && !svcForm && <EmptyHint text={`No ${g.label.toLowerCase()} services yet. Click "New service" to create your first appointment type.`} />}
          {groupServices.map((s) => <ServiceCard key={s.id} svc={s} groupAddons={groupAddons} onEdit={() => setSvcForm({ ...s, addonIds: s.addonIds || [] })} onDelete={() => setConfirm({ title: "Delete this appointment type?", message: "\u201c" + s.name + "\u201d will be permanently removed as a bookable appointment type. This cannot be undone.", confirmLabel: "Delete", danger: true, onYes: async () => { setConfirm(null); const r = await deleteService(s.id); if (r && r.ok) showToast("Appointment type deleted."); else showToast((r && r.error) || "Could not delete the service."); } })} onToggleVisible={async () => { const r = await updateService(s.id, { visible: s.visible === false }); if (r && !r.ok) showToast(r.error || "Could not update."); }} />)}
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ ...mono, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: g.color, display: "flex", alignItems: "center", gap: 8 }}><ListPlus size={13} /> {g.label} Add-ons</div>
            {!addonForm && <button onClick={startNewAddon} style={{ ...mono, fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: g.color, background: "transparent", border: `1px solid ${g.color}`, borderRadius: 7, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Plus size={13} /> New add-on</button>}
          </div>
          {addonForm && <AddonForm form={addonForm} setForm={setAddonForm} onSave={saveAddon} onCancel={() => setAddonForm(null)} accent={g.color} />}
          {groupAddons.length === 0 && !addonForm && <EmptyHint text={`No ${g.label.toLowerCase()} add-ons yet. Add-ons you create here can attach to any ${g.label.toLowerCase()} service.`} />}
          {groupAddons.map((a) => <AddonCard key={a.id} addon={a} onEdit={() => setAddonForm({ ...a })} onDelete={() => setConfirm({ title: "Delete this add-on?", message: "\u201c" + a.name + "\u201d will be permanently removed. This cannot be undone.", confirmLabel: "Delete", danger: true, onYes: async () => { setConfirm(null); const r = await deleteAddon(a.id); if (r && r.ok) showToast("Add-on deleted."); else showToast((r && r.error) || "Could not delete the add-on."); } })} onToggleVisible={async () => { const r = await updateAddon(a.id, { visible: a.visible === false }); if (r && !r.ok) showToast(r.error || "Could not update."); }} />)}
        </div>
      </div>
    </div>
  );
}

function ServiceForm({ form, setForm, onSave, onCancel, group, groupAddons }) {
  const g = GROUPS[group];
  return (
    <div style={{ border: `1px solid ${g.color}`, borderRadius: 10, padding: "16px", marginBottom: 14, background: PAPER }}>
      <FieldLabel>Service name</FieldLabel>
      <TextInput value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Legacy Story Video" />
      <FieldLabel>Description</FieldLabel>
      <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="What this service includes…" style={{ width: "100%", border: `1px solid ${LINE}`, borderRadius: 8, padding: "9px 11px", fontSize: 13, fontFamily: "inherit", resize: "vertical", background: PAPER, color: BODY, boxSizing: "border-box", marginBottom: 12 }} />
      <FieldLabel>Sub-category (optional, groups this under a client-facing heading)</FieldLabel>
      <TextInput value={form.category || ""} onChange={(v) => setForm({ ...form, category: v })} placeholder="e.g. Destination Photography" />
      <FieldLabel>Price (USD)</FieldLabel>
      <TextInput value={form.price} onChange={(v) => setForm({ ...form, price: v })} placeholder="e.g. 1200" prefix="$" />
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}><FieldLabel>Duration (min)</FieldLabel><TextInput value={form.duration || ""} onChange={(v) => setForm({ ...form, duration: v })} placeholder="90" /></div>
        <div style={{ flex: 1 }}><FieldLabel>Pad before</FieldLabel><TextInput value={form.padBefore || ""} onChange={(v) => setForm({ ...form, padBefore: v })} placeholder="0" /></div>
        <div style={{ flex: 1 }}><FieldLabel>Pad after</FieldLabel><TextInput value={form.padAfter || ""} onChange={(v) => setForm({ ...form, padAfter: v })} placeholder="0" /></div>
      </div>
      <div style={{ ...mono, fontSize: 10, color: FAINT, margin: "4px 0 12px", lineHeight: 1.5 }}>Duration plus padding is the total time this booking reserves on the calendar. Add-on minutes stack on top.</div>
      <FieldLabel>Add-on availability</FieldLabel>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <RadioPill active={form.addonMode === "group"} onClick={() => setForm({ ...form, addonMode: "group" })} label={`All ${g.label} add-ons`} accent={g.color} />
        <RadioPill active={form.addonMode === "custom"} onClick={() => setForm({ ...form, addonMode: "custom" })} label="Choose specific add-ons" accent={g.color} />
      </div>
      {form.addonMode === "group" && <div style={{ ...mono, fontSize: 10, color: FAINT, marginBottom: 12, lineHeight: 1.5 }}>Every {g.label.toLowerCase()} add-on you create will be offered on this service automatically.</div>}
      {form.addonMode === "custom" && (
        <div style={{ marginBottom: 12 }}>
          {groupAddons.length === 0 ? <div style={{ ...mono, fontSize: 10, color: FAINT }}>No {g.label.toLowerCase()} add-ons exist yet — create some first, then pick them here.</div> : groupAddons.map((a) => { const on = (form.addonIds || []).includes(a.id); return (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "6px 0", cursor: "pointer" }} onClick={() => { const set = new Set(form.addonIds || []); on ? set.delete(a.id) : set.add(a.id); setForm({ ...form, addonIds: Array.from(set) }); }}>
              <span style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${on ? g.color : LINE}`, background: on ? g.color : PAPER, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{on && <Check size={11} color="#fff" />}</span>
              <span style={{ fontSize: 12.5 }}>{a.name} {a.price ? <span style={{ color: STONE }}>· ${a.price}</span> : null}</span>
            </div>
          ); })}
        </div>
      )}
      <label style={{ display: "flex", alignItems: "center", gap: 9, margin: "4px 0 12px", cursor: "pointer" }}>
        <input type="checkbox" checked={form.visible !== false} onChange={(e) => setForm({ ...form, visible: e.target.checked })} style={{ width: 16, height: 16, accentColor: g.color, cursor: "pointer" }} />
        <span style={{ fontSize: 12, color: BODY, lineHeight: 1.4 }}>Show on the public booking page (uncheck to keep it bookable by direct link only)</span>
      </label>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
        <button onClick={onCancel} style={btnGhost}>Cancel</button>
        <button onClick={onSave} style={{ ...btnSolid, background: g.color }}><Check size={14} /> Save service</button>
      </div>
    </div>
  );
}

function AddonForm({ form, setForm, onSave, onCancel, accent }) {
  return (
    <div style={{ border: `1px solid ${accent}`, borderRadius: 10, padding: "16px", marginBottom: 14, background: PAPER }}>
      <FieldLabel>Add-on name</FieldLabel>
      <TextInput value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="e.g. Additional Camera Angle" />
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><FieldLabel>Price (USD)</FieldLabel><TextInput value={form.price} onChange={(v) => setForm({ ...form, price: v })} placeholder="350" prefix="$" /></div>
        <div style={{ flex: 1 }}><FieldLabel>Adds time (min)</FieldLabel><TextInput value={form.addTime} onChange={(v) => setForm({ ...form, addTime: v })} placeholder="30" /></div>
      </div>
      <label style={{ display: "flex", alignItems: "center", gap: 9, margin: "4px 0 12px", cursor: "pointer" }}>
        <input type="checkbox" checked={form.visible !== false} onChange={(e) => setForm({ ...form, visible: e.target.checked })} style={{ width: 16, height: 16, accentColor: accent, cursor: "pointer" }} />
        <span style={{ fontSize: 12, color: BODY, lineHeight: 1.4 }}>Show on the public booking page (uncheck to keep it direct-link only)</span>
      </label>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
        <button onClick={onCancel} style={btnGhost}>Cancel</button>
        <button onClick={onSave} style={{ ...btnSolid, background: accent }}><Check size={14} /> Save add-on</button>
      </div>
    </div>
  );
}

function ServiceCard({ svc, groupAddons, onEdit, onDelete, onToggleVisible }) {
  const attached = svc.addonMode === "group" ? groupAddons : groupAddons.filter((a) => (svc.addonIds || []).includes(a.id));
  return (
    <div style={{ ...cardDense, padding: "14px 16px", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div>
          <div style={{ ...display, fontWeight: 600, fontSize: 16, color: INK }}>{svc.name}{svc.visible === false && <span style={{ ...mono, fontSize: 8.5, letterSpacing: "0.08em", textTransform: "uppercase", color: STONE, background: CREAM, border: `1px solid ${LINE}`, borderRadius: 4, padding: "2px 6px", marginLeft: 8, verticalAlign: "middle" }}>Hidden</span>}</div>
          {svc.category ? <div style={{ ...mono, fontSize: 9, letterSpacing: "0.06em", color: FAINT, marginTop: 3 }}>{svc.category}</div> : null}
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>{svc.price ? <span style={{ ...mono, fontSize: 12, color: RED, fontWeight: 500 }}>${svc.price}</span> : null}<IconBtn onClick={onToggleVisible}>{svc.visible === false ? <EyeOff size={13} /> : <Eye size={13} />}</IconBtn><IconBtn onClick={onEdit}><Pencil size={13} /></IconBtn><IconBtn onClick={onDelete} danger><Trash2 size={13} /></IconBtn></div>
      </div>
      {svc.description ? <div style={{ fontSize: 12.5, color: BODY, lineHeight: 1.5, marginTop: 5 }}>{svc.description}</div> : null}
      <div style={{ ...mono, fontSize: 9.5, letterSpacing: "0.05em", color: FAINT, marginTop: 9, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}><Package size={11} /> {svc.addonMode === "group" ? "All group add-ons" : `${attached.length} selected`}{attached.length > 0 && <span style={{ color: STONE }}>· {attached.map((a) => a.name).join(", ")}</span>}</div>
    </div>
  );
}

function AddonCard({ addon, onEdit, onDelete, onToggleVisible }) {
  return (
    <div style={{ ...cardDense, borderRadius: 11, padding: "11px 14px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
      <div><div style={{ fontSize: 13.5, color: INK, fontWeight: 500 }}>{addon.name}{addon.visible === false && <span style={{ ...mono, fontSize: 8, letterSpacing: "0.08em", textTransform: "uppercase", color: STONE, marginLeft: 6 }}>Hidden</span>}</div><div style={{ ...mono, fontSize: 10, color: STONE, marginTop: 2, letterSpacing: "0.04em" }}>{addon.price ? `+$${addon.price}` : "no charge"}{addon.addTime ? ` · +${addon.addTime} min` : ""}</div></div>
      <div style={{ display: "flex", gap: 6 }}><IconBtn onClick={onToggleVisible}>{addon.visible === false ? <EyeOff size={13} /> : <Eye size={13} />}</IconBtn><IconBtn onClick={onEdit}><Pencil size={13} /></IconBtn><IconBtn onClick={onDelete} danger><Trash2 size={13} /></IconBtn></div>
    </div>
  );
}

/* ============================ SHARED ============================ */
function Timeline({ session, actionPanel, accent = RED }) {
  const cur = session.currentStage;
  return (
    <div style={{ position: "relative" }}>
      {stagesFor(session).map((st, i) => {
        const done = i < cur, current = i === cur, upcoming = i > cur, St = st.Icon, last = i === stagesFor(session).length - 1;
        return (
          <div key={st.key} style={{ display: "flex", gap: 16, position: "relative", paddingBottom: last ? 0 : 22 }}>
            {!last && <div style={{ position: "absolute", left: 17, top: 36, bottom: 0, width: 2, background: done ? accent : LINE }} />}
            <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: "50%", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: done ? accent : current ? PAPER : CREAM, border: `2px solid ${done ? accent : current ? accent : LINE}`, boxShadow: current ? `0 0 0 4px ${accent}22` : "none" }}>{done ? <CheckCircle2 size={18} color="#fff" /> : <St size={16} color={current ? accent : FAINT} />}</div>
            <div style={{ flex: 1, paddingTop: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
                <span style={{ ...display, fontWeight: 600, fontSize: 16.5, color: upcoming ? FAINT : INK }}>{st.label}</span>
                {current && <span style={{ ...mono, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "#fff", background: accent, padding: "2px 7px", borderRadius: 20 }}>In progress</span>}
                {session.stageTimes[i] !== undefined && <span style={{ ...mono, fontSize: 10, color: FAINT, letterSpacing: "0.05em" }}>{session.stageTimes[i]}</span>}
              </div>
              <div style={{ fontSize: 13.5, lineHeight: 1.55, color: upcoming ? FAINT : BODY, marginTop: 3, maxWidth: "56ch" }}>{st.desc}</div>
              {current && actionPanel}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Row({ k, v, bold, sub, red }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: sub ? "3px 0" : "5px 0" }}>
      <span style={{ fontSize: sub ? 12.5 : 13.5, color: sub ? STONE : BODY, fontWeight: bold ? 600 : 400 }}>{k}</span>
      <span style={{ ...mono, fontSize: sub ? 12 : 13.5, color: red ? RED : INK, fontWeight: bold ? 600 : 400 }}>{v}</span>
    </div>
  );
}

function SummaryCell({ label, value, icon }) {
  return <div><div style={{ ...mono, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: FAINT, marginBottom: 3 }}>{label}</div><div style={{ fontSize: 14, color: INK, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>{icon}{value}</div></div>;
}

function StatusBadge({ stage, group, consult }) {
  const stArr = consult ? CONSULT_STAGES : STAGES;
  const st = stArr[Math.min(stage, stArr.length - 1)] || stArr[0], St = st.Icon, delivered = stage >= stArr.length - 1;
  const g = GROUPS[group] || GROUPS.video;
  const bg = delivered ? "#eaf7ef" : g.bg, bd = delivered ? "#bfe6cc" : g.border, tx = delivered ? "#2e7d4f" : g.text, ic = delivered ? "#2e9e5b" : g.color;
  return <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 24, background: bg, border: `1px solid ${bd}` }}><St size={14} color={ic} /><span style={{ ...mono, fontSize: 11, letterSpacing: "0.06em", color: tx }}>{st.label}</span></div>;
}

function Toggle({ active, onClick, Icon, label }) {
  return <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 13px", borderRadius: 7, cursor: "pointer", fontSize: 12.5, border: `1px solid ${active ? INK : LINE}`, background: active ? INK : PAPER, color: active ? "#fff" : STONE }}><Icon size={14} /> {label}</button>;
}

function csvCell(v) { const s = String(v == null ? "" : v); return /[",]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
function downloadCsv(rows, filename) {
  try {
    const csv = rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  } catch (e) {}
}

function DonutChart({ segments, size = 148, thickness = 24, centerLabel, centerSub }) {
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

function HBars({ items }) {
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

function MiniColumns({ items }) {
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

function BusinessSettings({ sessions, showToast }) {
  const isMobile = useIsMobile();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [status, setStatus] = useState(null);
  useEffect(() => { fetch("/api/business-status").then((r) => r.json()).then((d) => setStatus(d || {})).catch(() => {}); }, []);
  const [payments, setPayments] = useState([]);
  const [payLoaded, setPayLoaded] = useState(false);
  const [emailing, setEmailing] = useState("");
  useEffect(() => { (async () => { try { const r = await fetch("/api/payments"); const d = await r.json().catch(() => ({})); if (d && Array.isArray(d.payments)) setPayments(d.payments); } catch (e) {} setPayLoaded(true); })(); }, []);
  const emailReceipt = async (p) => { setEmailing(p.id); try { const r = await fetch("/api/payments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: p.id }) }); const d = await r.json().catch(() => ({})); if (r.ok && d.ok) showToast("Receipt emailed to " + (p.client_email || "the client") + "."); else showToast(d.error || "Could not send the receipt."); } catch (e) { showToast("Network error."); } setEmailing(""); };

  const inRange = (s) => { if (!s.date) return false; if (start && s.date < start) return false; if (end && s.date > end) return false; return true; };
  const rows = (sessions || []).filter(inRange).sort((a, b) => (a.date + (a.time || "")).localeCompare(b.date + (b.time || "")));
  const collected = rows.reduce((sum, s) => sum + (s.paymentStatus === "paid" ? (Number(s.payAmount) || 0) : 0), 0);
  const outstanding = rows.reduce((sum, s) => { if (s.status === "cancelled") return sum; const paid = s.paymentStatus === "paid" ? (Number(s.payAmount) || 0) : 0; return sum + Math.max(0, (Number(s.total) || 0) - paid); }, 0);
  const activeCount = rows.filter((s) => s.status !== "cancelled").length;
  const arows = rows.filter((s) => s.status !== "cancelled");
  const bookedRevenue = arows.reduce((sum, s) => sum + (Number(s.total) || 0), 0);
  const avgValue = arows.length ? bookedRevenue / arows.length : 0;
  const typeAgg = {}; arows.forEach((s) => { const k = s.type || "Other"; if (!typeAgg[k]) typeAgg[k] = { label: k, line: s.serviceLine || "video", count: 0, revenue: 0 }; typeAgg[k].count++; typeAgg[k].revenue += Number(s.total) || 0; });
  const byType = Object.values(typeAgg).sort((a, b) => b.count - a.count || b.revenue - a.revenue);
  const lineAgg = {}; arows.forEach((s) => { const k = GROUP_KEYS.indexOf(s.serviceLine) >= 0 ? s.serviceLine : "video"; if (!lineAgg[k]) lineAgg[k] = { key: k, count: 0, revenue: 0 }; lineAgg[k].count++; lineAgg[k].revenue += Number(s.total) || 0; });
  const byLine = GROUP_KEYS.map((k) => lineAgg[k]).filter(Boolean);
  const monthAgg = {}; arows.forEach((s) => { if (!s.date) return; const k = s.date.slice(0, 7); if (!monthAgg[k]) monthAgg[k] = { key: k, count: 0, revenue: 0 }; monthAgg[k].count++; monthAgg[k].revenue += Number(s.total) || 0; });
  const byMonth = Object.keys(monthAgg).sort().slice(-12).map((k) => monthAgg[k]);
  const lineSegments = byLine.map((l) => ({ label: GROUPS[l.key].label, value: l.revenue, count: l.count, color: GROUPS[l.key].color }));
  const typeItems = byType.slice(0, 10).map((t) => ({ label: t.label, value: t.count, right: t.count + (t.count === 1 ? " booking" : " bookings") + " \u00b7 " + money(t.revenue), color: (GROUPS[t.line] || GROUPS.video).color }));
  const monthItems = byMonth.map((m) => ({ label: monthShort(m.key), value: m.revenue, top: compactMoney(m.revenue), color: RED }));

  const exportSessions = () => {
    if (rows.length === 0) { showToast("No sessions in that date range."); return; }
    const out = [["Date", "Time", "Client", "Email", "Service", "Group", "Status", "Stage", "Total ($)", "Collected ($)", "Payment", "Add-ons"]];
    rows.forEach((s) => out.push([s.date || "", s.time || "", s.clientName || "", s.clientEmail || "", s.type || "", s.serviceLine || "", s.status || "active", curStage(s).label || "", (Number(s.total) || 0).toFixed(2), (s.paymentStatus === "paid" ? (Number(s.payAmount) || 0) : 0).toFixed(2), s.paymentStatus || "none", (s.selectedAddons || []).map((a) => a.name).join("; ")]));
    downloadCsv(out, "dot-one-media-sessions" + ((start || end) ? "_" + (start || "start") + "_to_" + (end || "end") : "_all") + ".csv");
    showToast("Exported " + rows.length + " sessions.");
  };
  const exportClients = () => {
    const seen = {}; const clients = [];
    (sessions || []).forEach((s) => { const key = (s.clientEmail || "").toLowerCase(); if (!key || seen[key]) return; seen[key] = true; clients.push(s); });
    if (clients.length === 0) { showToast("No clients yet."); return; }
    const out = [["Client", "Email", "First booking", "Total bookings"]];
    clients.forEach((c) => { const theirs = (sessions || []).filter((x) => (x.clientEmail || "").toLowerCase() === (c.clientEmail || "").toLowerCase()); const first = theirs.map((x) => x.date).filter(Boolean).sort()[0] || ""; out.push([c.clientName || "", c.clientEmail || "", first, String(theirs.length)]); });
    downloadCsv(out, "dot-one-media-clients.csv");
    showToast("Exported " + clients.length + " clients.");
  };
  const exportAnalytics = () => {
    if (arows.length === 0) { showToast("No booking data to export yet."); return; }
    const out = [];
    out.push(["Dot One Media \u00b7 Booking analytics"]);
    out.push(["Period", (start || "all time") + (end ? " to " + end : (start ? " onward" : ""))]);
    out.push(["Bookings", String(arows.length), "Booked revenue ($)", bookedRevenue.toFixed(2), "Avg per booking ($)", avgValue.toFixed(2), "Collected ($)", collected.toFixed(2), "Outstanding ($)", outstanding.toFixed(2)]);
    out.push([]);
    out.push(["Session type", "Bookings", "Revenue ($)", "Avg per booking ($)"]);
    byType.forEach((t) => out.push([t.label, String(t.count), t.revenue.toFixed(2), (t.count ? t.revenue / t.count : 0).toFixed(2)]));
    out.push([]);
    out.push(["Service line", "Bookings", "Revenue ($)"]);
    byLine.forEach((l) => out.push([GROUPS[l.key].label, String(l.count), l.revenue.toFixed(2)]));
    out.push([]);
    out.push(["Month", "Bookings", "Revenue ($)"]);
    Object.keys(monthAgg).sort().forEach((k) => out.push([k, String(monthAgg[k].count), monthAgg[k].revenue.toFixed(2)]));
    downloadCsv(out, "dot-one-media-analytics" + ((start || end) ? "_" + (start || "start") + "_to_" + (end || "end") : "_all") + ".csv");
    showToast("Analytics exported.");
  };
  const statCard = (val, label, color) => (
    <div style={{ ...cardDense, borderRadius: 11, padding: "14px 16px" }}>
      <div style={{ ...display, fontSize: 24, color: color || INK }}>{val}</div>
      <div style={{ ...mono, fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: STONE, marginTop: 2 }}>{label}</div>
    </div>
  );
  const modeBadge = (label, value, ok) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", border: `1px solid ${LINE}`, borderRadius: 9, background: PAPER }}>
      <span style={{ ...mono, fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: STONE }}>{label}</span>
      <span style={{ ...mono, fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: ok ? "#3f7a3f" : "#a97a2e", fontWeight: 600 }}>{value}</span>
    </div>
  );
  return (
    <div className="d1-stagger">
      <div style={{ ...mono, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: RED, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}><Settings size={13} /> Business settings</div>
      <div style={{ fontSize: 13, color: BODY, lineHeight: 1.5, marginBottom: 24, maxWidth: 600 }}>See which service lines and session types drive your bookings and revenue, review any period, export your records, and confirm payments and email are live.</div>

      <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 10 }}>System status</div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10, marginBottom: 28 }}>
        {modeBadge("Payments", status ? (status.squareMode === "production" ? "Live (production)" : status.squareMode === "sandbox" ? "Test (sandbox)" : "Off") : "\u2026", !!(status && status.squareMode === "production"))}
        {modeBadge("Email", status ? (status.emailOn ? "On" : "Off") : "\u2026", !!(status && status.emailOn))}
      </div>

      <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 10 }}>Revenue &amp; records by period</div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 16 }}>
        <div><FieldLabel>From</FieldLabel><input type="date" value={start} onChange={(e) => setStart(e.target.value)} style={{ ...inputStyle, width: "auto" }} /></div>
        <div><FieldLabel>To</FieldLabel><input type="date" value={end} onChange={(e) => setEnd(e.target.value)} style={{ ...inputStyle, width: "auto" }} /></div>
        {(start || end) && <button onClick={() => { setStart(""); setEnd(""); }} style={{ ...mono, fontSize: 10.5, letterSpacing: "0.06em", color: STONE, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 7, padding: "9px 12px", cursor: "pointer" }}>All time</button>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr 1fr 1fr", gap: 10, marginBottom: 26 }}>
        {statCard(activeCount, "Bookings")}
        {statCard(money(bookedRevenue), "Booked revenue")}
        {statCard(money(Math.round(avgValue)), "Avg value")}
        {statCard(money(collected), "Collected", "#3f7a3f")}
        {statCard(money(outstanding), "Outstanding", "#a97a2e")}
      </div>

      <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 12 }}>Insights</div>
      {arows.length === 0 ? (
        <div style={{ marginBottom: 28 }}><EmptyHint text="Charts will appear here as bookings come in. They update automatically and follow the date range above." /></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 28 }}>
          <div style={{ ...cardDense, padding: "16px 18px" }}>
            <div style={{ ...mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: STONE, marginBottom: 16 }}>Revenue by service line</div>
            <div style={{ display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap" }}>
              <DonutChart segments={lineSegments} centerLabel={compactMoney(bookedRevenue)} centerSub="booked" />
              <div style={{ flex: 1, minWidth: 190, display: "flex", flexDirection: "column", gap: 9 }}>
                {lineSegments.map((seg) => { const pct = bookedRevenue > 0 ? Math.round(100 * seg.value / bookedRevenue) : 0; return (
                  <div key={seg.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 11, height: 11, borderRadius: 3, background: seg.color, flexShrink: 0 }} />
                    <span style={{ ...display, fontSize: 13, color: INK, flex: 1 }}>{seg.label}</span>
                    <span style={{ ...mono, fontSize: 11, color: STONE }}>{money(seg.value)}{" \u00b7 "}{pct}%</span>
                  </div>
                ); })}
              </div>
            </div>
          </div>

          <div style={{ ...cardDense, padding: "16px 18px" }}>
            <div style={{ ...mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: STONE, marginBottom: 16 }}>Bookings by session type</div>
            <HBars items={typeItems} />
            {byType.length > typeItems.length && <div style={{ ...mono, fontSize: 9.5, color: FAINT, marginTop: 12 }}>Showing top {typeItems.length} of {byType.length} types{" \u00b7 "}full list in the analytics export.</div>}
          </div>

          {byMonth.length >= 2 && (
            <div style={{ ...cardDense, padding: "16px 18px" }}>
              <div style={{ ...mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: STONE, marginBottom: 16 }}>Revenue by month</div>
              <MiniColumns items={monthItems} />
            </div>
          )}
        </div>
      )}

      <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 12 }}>Receipts</div>
      {!payLoaded ? (
        <div style={{ marginBottom: 28 }}><EmptyHint text={"Loading receipts\u2026"} /></div>
      ) : payments.length === 0 ? (
        <div style={{ marginBottom: 28 }}><EmptyHint text="A receipt is saved here automatically each time a client pays by card, and emailed to the client with a PDF copy. Each one can be viewed, exported as a PDF, or re-sent from here." /></div>
      ) : (
        <div style={{ ...cardDense, overflow: "hidden", marginBottom: 28 }}>
          {payments.map((p, i) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderTop: i === 0 ? "none" : `1px solid ${LINE}`, background: PAPER, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 210 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 9, flexWrap: "wrap" }}>
                  <span style={{ ...display, fontSize: 14, fontWeight: 600, color: INK }}>{p.client_name || "Client"}</span>
                  <span style={{ ...mono, fontSize: 13, color: RED, fontWeight: 500 }}>{payMoney(p.amount_cents)}</span>
                </div>
                <div style={{ ...mono, fontSize: 10, color: STONE, marginTop: 3, letterSpacing: "0.02em" }}>{payDateShort(p.paid_at)}{" \u00b7 "}{p.service || "Session"}{" \u00b7 "}{payKindLabel(p.kind)}{" \u00b7 "}{payCardLabel(p)}</div>
              </div>
              <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
                <a href={"/api/receipt?id=" + encodeURIComponent(p.id)} target="_blank" rel="noopener noreferrer" style={{ ...mono, fontSize: 10, letterSpacing: "0.04em", textTransform: "uppercase", color: INK, textDecoration: "none", border: `1px solid ${LINE}`, borderRadius: 7, padding: "7px 11px", display: "inline-flex", alignItems: "center", gap: 5 }}><FileText size={12} /> Receipt</a>
                <button onClick={() => emailReceipt(p)} disabled={emailing === p.id} style={{ ...mono, fontSize: 10, letterSpacing: "0.04em", textTransform: "uppercase", color: emailing === p.id ? FAINT : "#fff", background: emailing === p.id ? LINE : "#3f7a3f", border: "none", borderRadius: 7, padding: "7px 11px", cursor: emailing === p.id ? "default" : "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}><Mail size={12} /> {emailing === p.id ? "Sending\u2026" : "Email"}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 10 }}>Export</div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={exportSessions} style={{ ...btnSolid, background: RED }}><Download size={14} /> Export sessions (CSV)</button>
        <button onClick={exportClients} style={{ ...btnGhost, display: "inline-flex", alignItems: "center", gap: 7 }}><Download size={14} /> Export clients (CSV)</button>
        <button onClick={exportAnalytics} style={{ ...btnGhost, display: "inline-flex", alignItems: "center", gap: 7 }}><Download size={14} /> Export analytics (CSV)</button>
      </div>
      <div style={{ ...mono, fontSize: 10, color: FAINT, marginTop: 12, lineHeight: 1.5, maxWidth: 560 }}>The sessions export uses the date range above (all-time if blank). Each row lists the total, what you collected, and payment status, ready for bookkeeping and taxes.</div>
    </div>
  );
}

function SubTab({ active, onClick, label, badge }) {
  return <button onClick={onClick} style={{ ...mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", padding: "10px 4px", marginRight: 20, cursor: "pointer", background: "transparent", border: "none", color: active ? INK : FAINT, borderBottom: `2px solid ${active ? RED : "transparent"}`, marginBottom: -1, display: "inline-flex", alignItems: "center", gap: 7 }}>{label}{badge ? <span style={{ background: RED, color: "#fff", borderRadius: 20, fontSize: 9.5, minWidth: 16, height: 16, padding: "0 5px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{badge}</span> : null}</button>;
}

function Avatar({ name, src, size = 40 }) {
  const initials = (name || "?").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  if (src) return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: `1px solid ${LINE}`, flexShrink: 0 }} />;
  return <div style={{ width: size, height: size, borderRadius: "50%", background: CREAM, border: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "'IBM Plex Mono', monospace", fontSize: Math.round(size * 0.32), color: STONE }}>{initials}</div>;
}

function ServicePill({ line }) {
  const g = GROUPS[line] || GROUPS.video;
  return <span style={{ ...mono, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", padding: "3px 9px", borderRadius: 20, background: g.color, color: "#fff", display: "inline-flex", alignItems: "center", gap: 5 }}><g.Icon size={11} /> {g.label}</span>;
}

function PaymentRuleBanner({ group }) {
  const r = PAYMENT_RULES[group], g = GROUPS[group];
  if (!r) return null;
  return (
    <div style={{ background: CREAM, border: `1px solid ${LINE}`, borderLeft: `3px solid ${g.color}`, borderRadius: 8, padding: "12px 16px", marginBottom: 22, display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
      <r.Icon size={16} color={g.color} style={{ marginTop: 2, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ ...mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: g.color, marginBottom: 5 }}>{r.label} — what clients see at booking</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 5 }}>{r.options.map((o, i) => <span key={i} style={{ ...mono, fontSize: 10.5, color: BODY, background: PAPER, border: `1px solid ${LINE}`, borderRadius: 20, padding: "3px 10px" }}>{o.label}</span>)}</div>
        <div style={{ fontSize: 11.5, color: STONE, lineHeight: 1.45 }}>{r.note}</div>
      </div>
    </div>
  );
}

function LinkRow({ label, url }) {
  return <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "5px 0", borderTop: `1px solid ${LINE}` }}><span style={{ ...mono, fontSize: 10.5, color: STONE, letterSpacing: "0.04em" }}>{label}</span>{url ? <a href={url} target="_blank" rel="noopener noreferrer" style={{ ...mono, fontSize: 10.5, color: RED, textDecoration: "none", maxWidth: "58%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url}</a> : <span style={{ ...mono, fontSize: 10.5, color: FAINT }}>— not set —</span>}</div>;
}

function LinkField({ label, value, onChange, placeholder }) {
  return <div><div style={{ ...mono, fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", color: STONE, marginBottom: 4 }}>{label}</div><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", border: `1px solid ${LINE}`, borderRadius: 7, padding: "8px 11px", fontSize: 12.5, fontFamily: "'IBM Plex Mono', monospace", background: PAPER, color: BODY, boxSizing: "border-box" }} /></div>;
}

function FieldLabel({ children }) {
  return <div style={{ ...mono, fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: STONE, marginBottom: 5, marginTop: 4 }}>{children}</div>;
}

function TextInput({ value, onChange, placeholder, prefix }) {
  return <div style={{ display: "flex", alignItems: "center", border: `1px solid ${LINE}`, borderRadius: 8, background: PAPER, marginBottom: 12, overflow: "hidden" }}>{prefix && <span style={{ ...mono, fontSize: 13, color: STONE, padding: "0 4px 0 11px" }}>{prefix}</span>}<input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ flex: 1, border: "none", outline: "none", padding: prefix ? "9px 11px 9px 2px" : "9px 11px", fontSize: 13, fontFamily: "inherit", background: "transparent", color: BODY }} /></div>;
}

function RadioPill({ active, onClick, label, accent }) {
  return <button onClick={onClick} style={{ ...mono, fontSize: 10.5, letterSpacing: "0.04em", padding: "7px 12px", borderRadius: 20, cursor: "pointer", border: `1px solid ${active ? accent : LINE}`, background: active ? accent : PAPER, color: active ? "#fff" : STONE }}>{label}</button>;
}

function IconBtn({ children, onClick, danger }) {
  return <button onClick={onClick} style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${LINE}`, background: PAPER, color: danger ? RED : STONE, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</button>;
}

function EmptyHint({ text }) {
  return <div style={{ border: `1px dashed ${LINE}`, borderRadius: 10, padding: "18px", textAlign: "center", color: FAINT, fontSize: 12.5, lineHeight: 1.55, background: CREAM }}>{text}</div>;
}

const inputStyle = { width: "100%", border: `1px solid ${LINE}`, borderRadius: 8, padding: "10px 12px", fontSize: 13.5, fontFamily: "inherit", background: PAPER, color: BODY, boxSizing: "border-box" };
const iconBtnStyle = { width: 30, height: 30, borderRadius: 7, border: `1px solid ${LINE}`, background: PAPER, color: STONE, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
const navBtn = { width: 30, height: 30, borderRadius: 7, border: `1px solid ${LINE}`, background: PAPER, color: STONE, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" };
const shareBtn = { display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", background: PAPER, border: `1px solid ${LINE}`, borderRadius: 7, padding: "8px 12px", fontSize: 11.5, color: INK, fontFamily: "'IBM Plex Mono', monospace" };
const btnGhost = { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", padding: "9px 14px", borderRadius: 8, border: `1px solid ${LINE}`, background: PAPER, color: STONE, cursor: "pointer", display: "flex", alignItems: "center", gap: 7 };
const btnSolid = { fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", padding: "9px 14px", borderRadius: 8, border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 7 };

function RevealController({ dep }) {
  useIsoEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    const targets = Array.from(document.querySelectorAll(".d1-stagger > *"));
    if (!targets.length) return;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) { targets.forEach((t) => t.classList.add("d1-in")); return; }
    targets.forEach((t) => { t.classList.add("d1-reveal"); t.classList.remove("d1-in"); t.style.transitionDelay = ""; });
    let shown = 0;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        el.style.transitionDelay = Math.min(shown, 6) * 55 + "ms";
        el.classList.add("d1-in");
        shown++;
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [dep]);
  return null;
}

function FontLoader() {
  useEffect(() => {
    const id = "dot1-fonts"; if (document.getElementById(id)) return;
    const l = document.createElement("link"); l.id = id; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400..700&family=Archivo:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap";
    document.head.appendChild(l);
    if (!document.getElementById("dot1-global")) {
      const s = document.createElement("style"); s.id = "dot1-global";
      s.textContent = "@keyframes d1-pop{from{opacity:0;transform:scale(.96) translateY(6px)}to{opacity:1;transform:none}}@keyframes d1-fade{from{opacity:0}to{opacity:1}}::selection{background:color-mix(in srgb, var(--d1-accent,#e23b2e) 22%, transparent);}input::placeholder,textarea::placeholder{color:var(--d1-faint,#9a988f);opacity:1;}.d1-reveal{opacity:0;transform:translateY(14px);transition:opacity .55s cubic-bezier(.2,.7,.2,1),transform .55s cubic-bezier(.2,.7,.2,1);will-change:opacity,transform;}.d1-reveal.d1-in{opacity:1;transform:none;}.d1-modal{animation:d1-pop .3s cubic-bezier(.2,.85,.3,1) both;}.d1-overlay{animation:d1-fade .22s ease both;}.d1-lift{transition:transform .16s cubic-bezier(.2,.7,.2,1),box-shadow .18s ease,border-color .16s ease;}.d1-lift:hover{transform:translateY(-2px);box-shadow:0 3px 10px rgba(26,26,23,.05),0 16px 34px rgba(26,26,23,.09);}button{transition:background-color .16s ease,border-color .16s ease,color .16s ease,box-shadow .16s ease,transform .12s ease;}button:active{transform:translateY(1px);}button:focus-visible,a:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible,[role=switch]:focus-visible{outline:2px solid color-mix(in srgb, var(--d1-accent,#e23b2e) 55%, transparent);outline-offset:2px;}@media (prefers-reduced-motion: reduce){.d1-reveal{opacity:1!important;transform:none!important;transition:none!important;}.d1-modal,.d1-overlay{animation:none!important;}.d1-lift{transition:none!important;}.d1-lift:hover{transform:none!important;}button{transition:none!important;}button:active{transform:none!important;}}";
      document.head.appendChild(s);
    }
  }, []);
  return null;
}

