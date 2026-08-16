"use client";

import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import { parseCsvRows, ACUITY_MONTHS, parseAcuityStart, importServiceLine } from "../lib/portal/csv";
import { uid, fmtDate, fmtTime, pad2, calDate, addMinutes, gcalLink, icsContent, money, compactMoney, MONTH_ABBR, monthShort, payKindLabel, payCardLabel, payMoney, payDateShort, sessionBucket, timeGreeting } from "../lib/portal/format";
import { RED, INK, BODY, STONE, FAINT, LINE, PAPER, CREAM, OK, WARN, DANGER, THEME_VARS, THEMES, ACCENT_SWATCHES, applyTheme, display, mono, card, cardDense, inputStyle, iconBtnStyle, navBtn, shareBtn, btnGhost, btnSolid } from "../lib/portal/theme";
import { GROUPS, GROUP_KEYS } from "../lib/portal/groups";
import { DonutChart, HBars, MiniColumns, LinkRow, LinkField, FieldLabel, TextInput, RadioPill, IconBtn, EmptyHint, MiniCalendar, FontLoader, EmptyState, Avatar, Skeleton, Row } from "../lib/portal/ui";
import { useIsMobile } from "../lib/portal/hooks";
import { LandingPage, LoginView, StudioLogin, ResetPassword } from "../lib/portal/auth";
import { NOTIFY_EMAILS, isConsult, GOOGLE_REVIEW_URL, ADMINS, PORTAL_BASE, STORAGE_KEY, DEFAULT_STATE, PHOTO_CATEGORIES, CLIENT_SERVICES_VERSION, RELEASE_VERSION, PDF_CLIENT_SERVICES, PDF_RELEASE, PDF_MINOR, DOC_META, DOC_USAGE, BRIEF_FIELDS, CLIENT_SERVICES_SUMMARY, RELEASE_SUMMARY, MINOR_SUMMARY } from "../lib/portal/constants";
import { PAYMENT_RULES, STAGES, CONSULT_STAGES, stagesFor, curStage } from "../lib/portal/stages";
import { AdminCalendar } from "../lib/portal/AdminCalendar";
import { StudioHome } from "../lib/portal/StudioHome";
import { InternalBookingModal } from "../lib/portal/InternalBookingModal";
import { ServiceForm } from "../lib/portal/ServiceForm";
import { DirectLinks } from "../lib/portal/DirectLinks";
import { AdminSessions } from "../lib/portal/AdminSessions";
import { BusinessSettings } from "../lib/portal/BusinessSettings";
import { BookingFlow } from "../lib/portal/BookingFlow";
import { ClientView } from "../lib/portal/ClientView";
import { GuidePage } from "../lib/portal/GuidePage";
import { CLIENT_GUIDE_HTML, ADMIN_GUIDE_HTML } from "../lib/portal/guides";
import { AccountManagement } from "../lib/portal/AccountManagement";
import {
  CalendarCheck, FileCheck, Camera, Upload, Scissors, Eye, PackageCheck,
  CheckCircle2, User, LayoutDashboard, Send, Play, Image as ImageIcon,
  RotateCcw, Clock, MessageSquare, Film, Music, Landmark, Package,
  Plus, Trash2, Pencil, Check, AlertTriangle, Tag, Link2, ListPlus,
  Star, CreditCard, Wallet, CalendarDays, ChevronLeft, ChevronRight,
  ArrowRight, ArrowLeft,
  Bell, RefreshCw, CalendarClock, X, Copy, LogIn, Sparkles,
  MessageCircle, Smartphone, Link as LinkIcon, Ban, EyeOff, XCircle, CalendarPlus, ChevronDown, Settings, Download, ListChecks, FileText, Palette, Mail, Search, LogOut,
} from "lucide-react";

// Persist to the browser's localStorage (works in a real browser, unlike the
// chat sandbox). Same shape the app expects: get -> {value}|null, set/delete async.
const storage = {
  get: async (k) => { try { const v = typeof window !== "undefined" ? window.localStorage.getItem(k) : null; return v == null ? null : { value: v }; } catch { return null; } },
  set: async (k, v) => { try { if (typeof window !== "undefined") window.localStorage.setItem(k, v); } catch {} },
  delete: async (k) => { try { if (typeof window !== "undefined") window.localStorage.removeItem(k); } catch {} },
};

/* ---------- brand tokens ---------- */


const useIsoEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;




/* where a new-booking notification email is routed, per group */




const downloadIcs = (session) => { try { const blob = new Blob([icsContent(session)], { type: "text/calendar;charset=utf-8" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "dot-one-media-session.ics"; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(url), 1500); } catch (e) {} };







export default function App() {
  const [view, setView] = useState("landing");   // landing | client | admin | book | login | studiologin
  const [prevTab, setPrevTab] = useState("home");
  const [adminTab, setAdminTab] = useState("home"); // home | sessions | calendar | services | links
  const [state, setState] = useState(DEFAULT_STATE);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);
  const poppingRef = useRef(false);
  const initedRef = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [installEvt, setInstallEvt] = useState(null);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientAuth, setClientAuth] = useState(null);
  const [resetToken, setResetToken] = useState("");
  const [guideSeen, setGuideSeen] = useState(true);
  const [clientGuideOpen, setClientGuideOpen] = useState(false);
  const [themeKey, setThemeKey] = useState("default");
  const [customAccent, setCustomAccent] = useState("");
  const [themeOpen, setThemeOpen] = useState(false);
  const [legalReturn, setLegalReturn] = useState("landing");
  const [adminId, setAdminId] = useState("");
  const [internalOpen, setInternalOpen] = useState(false);
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
  useEffect(() => { (async () => { try { const a = await fetch("/api/auth/me").then((r) => r.json()).catch(() => null); if (a && a.admin) { setView("admin"); const sd = await fetch("/api/sessions").then((r) => r.json()).catch(() => ({})); if (sd && sd.sessions) setState((s) => ({ ...s, sessions: sd.sessions })); return; } const c = await fetch("/api/client-me").then((r) => r.json()).catch(() => null); if (c && c.client && c.email) { setClientAuth({ name: "", email: c.email }); const sd = await fetch("/api/sessions").then((r) => r.json()).catch(() => ({})); const sess = (sd && sd.sessions) || []; if (sess.length) { setClientAuth({ name: sess[0].clientName || "", email: c.email }); setState((s) => ({ ...s, sessions: sess })); setClientId(sess[0].id); setView("client"); } } } catch (e) {} finally { setAuthChecked(true); } })(); }, []);
  useEffect(() => { (async () => { try { const res = await fetch("/api/availability"); const data = await res.json(); if (res.ok) setState((s) => ({ ...s, availability: data.availability || [] })); } catch (e) {} })(); }, []);
  useEffect(() => {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) { navigator.serviceWorker.register("/sw.js").catch(() => {}); }
    if (typeof window === "undefined") return;
    const handler = (e) => { e.preventDefault(); setInstallEvt(e); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  const doInstall = async () => { if (!installEvt) return; try { installEvt.prompt(); await installEvt.userChoice; } catch (e) {} setInstallEvt(null); };
  useEffect(() => {
    const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) { if (view === "admin") { e.preventDefault(); setPaletteOpen((o) => !o); } } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view]);
  useEffect(() => { (async () => { try { const res = await fetch("/api/sessions?slots=1"); const data = await res.json(); if (res.ok) setState((s) => ({ ...s, takenSlots: data.takenSlots || [] })); } catch (e) {} })(); }, []);
  const refreshSlots = async () => { try { const res = await fetch("/api/sessions?slots=1"); const data = await res.json(); if (res.ok) setState((s) => ({ ...s, takenSlots: data.takenSlots || [] })); } catch (e) {} };
  const reconciledRef = useRef({});
  useEffect(() => {
    const paidSid = new URLSearchParams(window.location.search).get("paid");
    if (!paidSid) return;
    (async () => {
      let res = {};
      const payKind = new URLSearchParams(window.location.search).get("kind") || "";
      const payCharge = new URLSearchParams(window.location.search).get("charge") || "";
      try { res = await fetch("/api/pay/verify?sid=" + encodeURIComponent(paidSid) + (payKind ? "&kind=" + encodeURIComponent(payKind) : "") + (payCharge ? "&charge=" + encodeURIComponent(payCharge) : "")).then((r) => r.json()).catch(() => ({})); } catch (e) {}
      try { const sd = await fetch("/api/sessions").then((r) => r.json()).catch(() => ({})); const sess = (sd && sd.sessions) || []; if (sess.length) { setState((s) => ({ ...s, sessions: sess })); const mine = sess.find((x) => x.id === paidSid) || sess[0]; setClientId(mine.id); setClientAuth({ name: mine.clientName || "", email: mine.clientEmail || "" }); setView("thankyou"); } } catch (e) {}
      showToast(res && res.paid ? "Payment received. Thank you!" : "Thanks! If your payment is still processing, your status will update shortly.");
    })();
  }, []);
  useEffect(() => {
    if (view !== "client" || !clientId) return;
    const s = (state.sessions || []).find((x) => x.id === clientId);
    if (!s || !Array.isArray(s.charges)) return;
    const pend = s.charges.filter((c) => c && c.status !== "paid" && c.squareOrderId);
    if (pend.length === 0) return;
    (async () => {
      let healed = false;
      for (const c of pend) {
        const key = clientId + ":" + c.id;
        if (reconciledRef.current[key]) continue;
        reconciledRef.current[key] = true;
        try { const r = await fetch("/api/pay/verify?sid=" + encodeURIComponent(clientId) + "&kind=charge&charge=" + encodeURIComponent(c.id)).then((x) => x.json()).catch(() => ({})); if (r && r.paid) healed = true; } catch (e) {}
      }
      if (healed) { try { const sd = await fetch("/api/sessions").then((x) => x.json()).catch(() => ({})); if (sd && sd.sessions) setState((st) => ({ ...st, sessions: sd.sessions })); } catch (e) {} }
    })();
  }, [clientId, view]);
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

  const saveSessionPatch = (id, patch, extra) => { fetch("/api/sessions", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, patch, ...(extra || {}) }) }).catch(() => {}); };
  const patchSession = (id, patch, extra) => { setState((s) => ({ ...s, sessions: s.sessions.map((x) => (x.id === id ? { ...x, ...patch } : x)) })); saveSessionPatch(id, patch, extra); };
  const setSessionGroup = (session, group) => {
    const type = (session && session.type) || "";
    const targets = (stateRef.current.sessions || []).filter((x) => (x.type || "") === type);
    const patch = { serviceLine: group, photographer: group === "photo" ? "Brittany Matthews" : "Dennis Matthews", notifyEmail: NOTIFY_EMAILS[group] || "contact@dot1.media" };
    (targets.length ? targets : [session]).forEach((t) => patchSession(t.id, patch));
    const g = GROUPS[group] || GROUPS.video;
    const n = targets.length || 1;
    showToast(n > 1 ? ("Set " + n + " \u201c" + type + "\u201d sessions to " + g.label + ".") : ("Session type set to " + g.label + "."));
  };

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
    const newSession = { id, clientName: booking.name, clientEmail: booking.email, clientImage: "", notifyEmail, type: booking.serviceName, serviceLine: grp, photographer: grp === "photo" ? "Brittany Matthews" : "Dennis Matthews", date: booking.date, time: booking.time, location: "", status: "active", durationMin: booking.duration || 60, apptMin: booking.apptMin || booking.duration || 60, padBefore: booking.padBefore || 0, padAfter: booking.padAfter || 0, currentStage: 0, stageTimes: { 0: "just now" }, comments: [], selectedAddons: booking.addons, total: booking.total, payChoice: booking.payChoice, paymentStatus: (booking.payAmount || 0) > 0 ? "pending" : "none", payAmount: booking.payAmount || 0, reviewLink: "", deliveryVideo: "", deliveryPhoto: "", deliveryMusic: "", deliveryGov: "" };
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
  const checkChargePayment = async (session, charge) => {
    showToast("Checking Square for this payment\u2026");
    try {
      const r = await fetch("/api/pay/verify?sid=" + encodeURIComponent(session.id) + "&kind=charge&charge=" + encodeURIComponent(charge.id)).then((x) => x.json()).catch(() => ({}));
      try { const sd = await fetch("/api/sessions").then((x) => x.json()).catch(() => ({})); if (sd && sd.sessions) setState((s) => ({ ...s, sessions: sd.sessions })); } catch (e) {}
      showToast(r && r.paid ? "Confirmed with Square \u2014 marked as paid." : "Square shows no completed payment for this charge yet.");
    } catch (e) { showToast("Could not reach Square. Please try again."); }
  };
  const createInternalBooking = async (b) => {
    const id = uid("ses"); const grp = b.group;
    const notifyEmail = NOTIFY_EMAILS[grp] || "contact@dot1.media";
    const newSession = { id, clientName: b.name, clientEmail: (b.email || "").toLowerCase(), clientImage: "", notifyEmail, type: b.serviceName, serviceLine: grp, photographer: grp === "photo" ? "Brittany Matthews" : "Dennis Matthews", date: b.date, time: b.time, location: "", status: "active", durationMin: Number(b.duration) || 60, apptMin: Number(b.duration) || 60, padBefore: 0, padAfter: 0, currentStage: 0, stageTimes: { 0: "just now" }, comments: [], selectedAddons: [], total: Number(b.total) || 0, payChoice: "deposit", paymentStatus: "none", payAmount: 0, reviewLink: "", deliveryVideo: "", deliveryPhoto: "", deliveryMusic: "", deliveryGov: "", internal: true };
    setState((s) => ({ ...s, sessions: [...s.sessions, newSession] }));
    await fetch("/api/sessions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ session: newSession }) }).catch(() => {});
    if ((Number(b.deposit) || 0) > 0) { await requestSendCharge(newSession, b.serviceName + " payment", Number(b.deposit)); }
    setAdminId(id);
    showToast((Number(b.deposit) || 0) > 0 ? "Internal booking created and a payment request was sent." : "Internal booking created. The client was emailed the details.");
  };
  const confirmSendDelivery = (session, kinds, linkPatch) => {
    const arr = Array.isArray(kinds) ? kinds : [kinds];
    const nameOf = { gallery: "photo gallery", video: "video", music: "audio", government: "deliverables" };
    const names = arr.map((k) => nameOf[k] || k);
    const label = names.length === 1 ? names[0] : names.slice(0, -1).join(", ") + " and " + names.slice(-1);
    const noun = arr.some((k) => k === "gallery") ? "images" : (arr.some((k) => k === "video" || k === "music") ? "files" : "deliverables");
    setConfirm({
      title: "Send this to the client?",
      message: "This emails " + (session.clientName || "the client") + " a link to their " + label + ". Please confirm the link points to the final " + noun + " before sending.",
      confirmLabel: "Confirm & send",
      onYes: () => { saveSessionPatch(session.id, linkPatch || {}, { emailDeliveryKinds: arr }); showToast("Sent to " + (session.clientName || "the client") + "."); setConfirm(null); },
    });
  };
  const requestReview = async (session) => {
    try { const r = await fetch("/api/sessions", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: session.id, patch: {}, sendReview: true }) }); if (r.ok) showToast("Review request sent to " + (session.clientName || "the client") + "."); else showToast("Could not send the review request."); } catch (e) { showToast("Network error."); }
  };
  const importSessions = async (sessions, onProgress) => {
    let done = 0;
    for (const draft of sessions) {
      const session = draft.id ? draft : { ...draft, id: uid("ses") };
      setState((s) => { const has = s.sessions.some((x) => x.id === session.id); return { ...s, sessions: has ? s.sessions.map((x) => (x.id === session.id ? session : x)) : [...s.sessions, session] }; });
      await fetch("/api/sessions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ session }) }).catch(() => {});
      done++; if (onProgress) onProgress(done);
    }
    return done;
  };
  const requestSendCharge = async (session, label, amountDollars) => { try { const res = await fetch("/api/charge", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId: session.id, label, amount: amountDollars }) }); const data = await res.json().catch(() => ({})); if (res.ok && data.charge) { showToast("Payment request sent to " + session.clientEmail + "."); setState((s) => ({ ...s, sessions: s.sessions.map((x) => x.id === session.id ? { ...x, charges: [...(x.charges || []), data.charge] } : x) })); return { ok: true }; } else { showToast(data.error || "Could not send the payment request."); return { ok: false }; } } catch (e) { showToast("Network error."); return { ok: false }; } };

  const resetDemo = () => setConfirm({ title: "Reset the demo?", message: "This clears all sessions, services, add-ons, and booking links back to the starting state.", confirmLabel: "Reset everything", danger: true, onYes: async () => { setState(DEFAULT_STATE); try { await storage.delete(STORAGE_KEY); } catch (e) {} showToast("Demo reset."); setConfirm(null); } });
  const requestCancelBooking = (session) => setConfirm({ title: "Cancel this booking?", message: "This marks " + session.clientName + "'s " + session.type + " as cancelled. The client will see it as cancelled in their portal.", confirmLabel: "Cancel booking", danger: true, onYes: () => { patchSession(session.id, { status: "cancelled" }); showToast("Booking cancelled."); setConfirm(null); } });
  const requestCloseBooking = (session) => setConfirm({ title: "Close this booking?", message: "This closes " + session.clientName + "'s " + session.type + " for a no-show or payment issue. It will be marked closed.", confirmLabel: "Close booking", danger: true, onYes: () => { patchSession(session.id, { status: "closed" }); showToast("Booking closed."); setConfirm(null); } });
  const requestReopenBooking = (session) => { patchSession(session.id, { status: "active" }); showToast("Booking reopened."); };
  const requestDeleteBooking = (session) => setConfirm({ title: "Delete this booking?", message: "This permanently removes " + session.clientName + "'s " + session.type + " from your studio. This cannot be undone.", confirmLabel: "Delete permanently", danger: true, onYes: async () => { setConfirm(null); try { const res = await fetch("/api/sessions?id=" + encodeURIComponent(session.id), { method: "DELETE" }); const data = await res.json().catch(() => ({})); if (res.ok) { setState((s) => ({ ...s, sessions: s.sessions.filter((x) => x.id !== session.id) })); if (adminId === session.id) setAdminId(""); showToast("Booking deleted."); } else { showToast(data.error || "Could not delete the booking."); } } catch (e) { showToast("Network error."); } } });

  const clientSession = state.sessions.find((s) => s.id === clientId) || state.sessions[0] || null;
  const unreadClientTotal = state.sessions.reduce((n, s) => n + s.comments.filter((c) => c.author === "client" && !c.read).length, 0);

  if (!authChecked) return <PortalSplash />;

  return (
    <div style={{ background: CREAM, minHeight: "100vh", fontFamily: "'Archivo', system-ui, sans-serif", color: BODY, WebkitFontSmoothing: "antialiased", MozOsxFontSmoothing: "grayscale" }}>
      <FontLoader />
      <header style={{ borderBottom: `1px solid ${LINE}`, background: PAPER, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <img src="/dot1-logo-gray.png" alt="Dot One Media" style={{ height: 32, width: "auto", display: "block", filter: themeKey === "midnight" ? "brightness(0) invert(1)" : "none" }} />
            <span style={{ ...mono, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: FAINT }}>Client Portal</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {(view === "admin" || view === "client" || view === "thankyou") && <button onClick={() => setThemeOpen(true)} title="Appearance" aria-label="Appearance" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 7, cursor: "pointer", color: STONE, background: "transparent", border: `1px solid ${LINE}`, padding: 0 }}><Palette size={15} /></button>}
            {view === "admin" ? (
              <>
                <NotificationBell mode="studio" sessions={state.sessions} onOpenSession={(id) => { setAdminTab("sessions"); setAdminId(id); }} />
                <button onClick={() => setPaletteOpen(true)} title="Quick search (Cmd/Ctrl + K)" style={{ display: "flex", alignItems: "center", gap: 7, ...mono, fontSize: 10.5, letterSpacing: "0.04em", color: STONE, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 6, padding: "7px 10px", cursor: "pointer" }}><Search size={13} /><span>Search</span><kbd style={{ fontSize: 8.5, border: `1px solid ${LINE}`, borderRadius: 4, padding: "1px 5px", color: FAINT }}>⌘K</kbd></button>
                <button onClick={() => { if (adminTab !== "guide") setPrevTab(adminTab); setAdminTab("guide"); }} title="Studio guide" style={{ display: "flex", alignItems: "center", gap: 7, ...mono, fontSize: 10.5, letterSpacing: "0.04em", color: adminTab === "guide" ? INK : STONE, background: "transparent", border: `1px solid ${adminTab === "guide" ? INK : LINE}`, borderRadius: 6, padding: "7px 10px", cursor: "pointer" }}><FileText size={13} /><span>Guide</span></button>
                <span style={{ ...mono, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE }}>Studio</span>
                <button onClick={adminLogout} style={{ ...mono, fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: STONE, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 6, padding: "8px 12px", cursor: "pointer" }}>Sign out</button>
              </>
            ) : (view === "client" || view === "thankyou") ? (
              <>
                <span style={{ ...mono, fontSize: 10, letterSpacing: "0.08em", color: STONE }}>{(clientSession && clientSession.clientName) || "Signed in"}</span>
                <NotificationBell mode="client" sessions={state.sessions} clientId={clientId} onMarkRead={() => markMessagesRead(clientId, "studio")} />
                <button onClick={() => { setDirectContext(null); setView("book"); }} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 7, cursor: "pointer", fontSize: 12.5, border: `1px solid ${RED}`, background: "#fff", color: RED, fontWeight: 500 }}><Plus size={14} /> Book Again</button>
                <button onClick={() => setClientGuideOpen(true)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 7, cursor: "pointer", fontSize: 12.5, border: `1px solid ${LINE}`, background: PAPER, color: STONE }}><FileText size={13} /> Guide</button>
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
        {(view === "terms" || view === "privacy") && <LegalPage kind={view} onBack={() => setView(legalReturn)} />}
        {view === "client" && clientGuideOpen && <GuidePage title="Client Guide" html={CLIENT_GUIDE_HTML} pdf="/guides/dot1-client-guide.pdf" onBack={() => setClientGuideOpen(false)} />}
        {view === "client" && !clientGuideOpen && <ClientView session={clientSession} sessions={state.sessions} clientId={clientId} setClientId={setClientId} addComment={addComment} onRescheduleRequest={clientRescheduleRequest} markMessagesRead={markMessagesRead} patchSession={patchSession} resizeImage={resizeImage} showToast={showToast} />}
        {view === "thankyou" && <ThankYou session={clientSession} onPortal={() => setView("client")} />}
        {view === "client" && !guideSeen && clientSession && <ClientGuide onClose={() => { setGuideSeen(true); try { localStorage.setItem("dot1_guide_seen", "1"); } catch (e) {} }} />}
        {themeOpen && <ThemePicker themeKey={themeKey} customAccent={customAccent} onPick={(k, a) => setTheme(k, a)} onClose={() => setThemeOpen(false)} />}
        {internalOpen && <InternalBookingModal state={state} showToast={showToast} onClose={() => setInternalOpen(false)} onCreate={createInternalBooking} />}
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
              <SubTab active={adminTab === "account"} onClick={() => setAdminTab("account")} label="Client Accounts" />
            </div>
            {adminTab === "home" && <StudioHome state={state} setAdminId={setAdminId} setAdminTab={setAdminTab} dark={themeKey === "midnight"} />}
            {adminTab === "sessions" && <AdminSessions state={state} adminId={adminId} setAdminId={setAdminId} requestSetStage={requestSetStage} addComment={addComment} patchSession={patchSession} onReschedule={adminReschedule} slotTaken={slotTaken} markMessagesRead={markMessagesRead} onCancelBooking={requestCancelBooking} onCloseBooking={requestCloseBooking} onReopenBooking={requestReopenBooking} onSendBalance={requestSendBalance} onSendCharge={requestSendCharge} onCheckPayment={checkChargePayment} onNewInternal={() => setInternalOpen(true)} onEmailDelivery={confirmSendDelivery} onRequestReview={requestReview} onSetGroup={setSessionGroup} onDeleteBooking={requestDeleteBooking} />}
            {adminTab === "calendar" && <AdminCalendar state={state} onSelectSession={(id) => { setAdminId(id); setAdminTab("sessions"); }} />}
            {adminTab === "links" && <DirectLinks state={state} createDirectLink={createDirectLink} revokeDirectLink={revokeDirectLink} openDirectLink={openDirectLink} showToast={showToast} />}
            {adminTab === "availability" && <><CalendarSync showToast={showToast} /><AvailabilityManager availability={state.availability} addAvailability={addAvailability} removeAvailability={removeAvailability} showToast={showToast} /></>}
            {adminTab === "services" && <ServiceCatalog state={state} addService={addService} updateService={updateService} deleteService={deleteService} addAddon={addAddon} updateAddon={updateAddon} deleteAddon={deleteAddon} showToast={showToast} setConfirm={setConfirm} />}
            {adminTab === "business" && <BusinessSettings sessions={state.sessions} showToast={showToast} onImport={importSessions} />}
            {adminTab === "account" && <AccountManagement state={state} showToast={showToast} />}
            {adminTab === "guide" && <GuidePage title="Studio Admin Guide" html={ADMIN_GUIDE_HTML} pdf="/guides/dot1-admin-guide.pdf" onBack={() => setAdminTab(prevTab)} />}
          </div>
        )}
      </main>
      {view !== "terms" && view !== "privacy" ? <Footer onLegal={(k) => { setLegalReturn(view); setView(k); }} /> : null}
      <PortalFooter />

      {toast && <div style={{ position: "fixed", bottom: 44, left: "50%", transform: "translateX(-50%)", background: INK, color: "#fff", padding: "11px 18px", borderRadius: 8, boxShadow: "0 10px 30px rgba(0,0,0,0.25)", fontSize: 13.5, maxWidth: "92%", display: "flex", alignItems: "center", gap: 9, zIndex: 60 }}><CheckCircle2 size={16} color="#7ee0a0" /> {toast}</div>}
      {confirm && <ConfirmDialog {...confirm} onCancel={() => setConfirm(null)} />}
      {view === "admin" && paletteOpen && <CommandPalette state={state} setAdminTab={setAdminTab} setAdminId={setAdminId} onClose={() => setPaletteOpen(false)} onSignOut={adminLogout} onTheme={() => setThemeOpen(true)} />}
      <RevealController dep={view + "|" + adminTab + "|" + clientId} />
      {installEvt && !installDismissed && (
        <div className="d1-modal" style={{ position: "fixed", bottom: 18, right: 18, zIndex: 300, display: "flex", alignItems: "center", gap: 9, background: INK, color: "#fff", borderRadius: 13, padding: "10px 12px 10px 15px", boxShadow: "0 10px 34px rgba(0,0,0,0.24)", maxWidth: "calc(100vw - 36px)" }}>
          <Download size={15} />
          <span style={{ ...mono, fontSize: 11, letterSpacing: "0.03em" }}>Install the Dot One app</span>
          <button onClick={doInstall} style={{ ...mono, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", background: "#fff", color: INK, border: "none", borderRadius: 8, padding: "6px 12px", cursor: "pointer", marginLeft: 3, fontWeight: 600 }}>Install</button>
          <button onClick={() => setInstallDismissed(true)} aria-label="Dismiss" style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.55)", cursor: "pointer", padding: "2px 4px", fontSize: 17, lineHeight: 1 }}>×</button>
        </div>
      )}
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
      {paid && <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: OK, marginBottom: 4 }}>Payment received</div>}
      <p style={{ fontSize: 14, color: BODY, lineHeight: 1.65, maxWidth: 460, margin: "14px auto 28px" }}>
        We've emailed your confirmation, and your client portal is ready. Sign in anytime with your email and password to follow your project from booking through final delivery.
      </p>
      <button onClick={onPortal} style={{ ...btnSolid, background: grp.color, fontSize: 15, padding: "13px 28px", margin: "0 auto" }}>Go to my portal <ArrowRight size={16} /></button>
      <div style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: FAINT, marginTop: 22 }}>portal.dot1.media</div>
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



/* ============================ STUDIO LOGIN ============================ */

/* ============================ CLIENT LOGIN ============================ */

/* ============================ BOOKING FLOW ============================ */


/* ============================ DIRECT BOOKING LINKS ============================ */

/* ============================ CONFIRM DIALOG ============================ */
function ConfirmDialog({ title, message, confirmLabel = "Confirm", danger, onYes, onCancel }) {
  return (
    <div className="d1-overlay" style={{ position: "fixed", inset: 0, background: "rgba(26,26,23,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 80, padding: 20 }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className="d1-modal" style={{ background: PAPER, borderRadius: 12, padding: "24px 26px", maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: danger ? `color-mix(in srgb, ${DANGER} 15%, var(--d1-paper,#fff))` : `color-mix(in srgb, ${WARN} 16%, var(--d1-paper,#fff))`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><AlertTriangle size={18} color={danger ? RED : WARN} /></div>
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
              <span style={{ ...display, fontWeight: 600, fontSize: 13.5, color: t.vars ? t.vars["--d1-ink"] : "#1a1a17" }}>{t.name}</span>
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
        <div style={{ fontSize: 12, color: STONE, lineHeight: 1.5, marginBottom: 8 }}>You can reopen this guide anytime from the <strong style={{ color: INK }}>Guide</strong> button at the top of your portal.</div>
        <button onClick={onClose} style={{ ...btnSolid, background: RED, width: "100%", justifyContent: "center", marginTop: 8, padding: "12px" }}>Got it, let's go</button>
      </div>
    </div>
  );
}



/* ============================ ADMIN — HOME ============================ */

/* ============================ ADMIN — SESSIONS ============================ */

/* ============================ ADMIN — CALENDAR ============================ */


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
  const [mode, setMode] = useState("single");
  const [date, setDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("15:00");
  const [weekdaysOnly, setWeekdaysOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (end <= start) { showToast("Close time must be after open time."); return; }
    if (mode === "single") {
      if (!date) { showToast("Pick a day."); return; }
      setBusy(true);
      const r = await addAvailability({ date, start, end });
      setBusy(false);
      if (r && r.ok) { showToast("Day opened for booking."); setDate(""); } else { showToast((r && r.error) || "Could not open that day."); }
      return;
    }
    if (!date || !endDate) { showToast("Pick a start and end date."); return; }
    if (endDate < date) { showToast("End date must be on or after the start date."); return; }
    const days = [];
    let d = new Date(date + "T00:00:00");
    const last = new Date(endDate + "T00:00:00");
    let guard = 0;
    while (d <= last && guard < 400) {
      const dow = d.getDay();
      if (!weekdaysOnly || (dow !== 0 && dow !== 6)) days.push(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"));
      d.setDate(d.getDate() + 1); guard++;
    }
    if (days.length === 0) { showToast("No days in that range."); return; }
    if (days.length > 92) { showToast("Keep the range to about three months at a time."); return; }
    setBusy(true);
    let opened = 0; let skipped = 0;
    for (const dd of days) { const r = await addAvailability({ date: dd, start, end }); if (r && r.ok) opened++; else skipped++; }
    setBusy(false);
    showToast("Opened " + opened + " day" + (opened === 1 ? "" : "s") + (skipped ? " (" + skipped + " already open or unavailable)" : "") + ".");
    if (opened > 0) { setDate(""); setEndDate(""); }
  };
  return (
    <div>
      <div style={{ ...mono, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: RED, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}><CalendarCheck size={13} /> Open availability</div>
      <div style={{ fontSize: 13, color: BODY, lineHeight: 1.5, marginBottom: 16, maxWidth: 560 }}>Open specific days with the hours you're available. Clients can only book a day and time you have opened here.</div>
      <div style={{ ...cardDense, padding: "16px", marginBottom: 24 }}>
        <div style={{ display: "inline-flex", gap: 4, padding: 3, borderRadius: 8, background: CREAM, border: `1px solid ${LINE}`, marginBottom: 14 }}>
          {[["single", "Single day"], ["range", "Date range"]].map(([m, lbl]) => (
            <button key={m} onClick={() => setMode(m)} style={{ ...mono, fontSize: 10, letterSpacing: "0.04em", textTransform: "uppercase", border: "none", borderRadius: 6, padding: "7px 12px", cursor: "pointer", background: mode === m ? PAPER : "transparent", color: mode === m ? INK : STONE, boxShadow: mode === m ? "0 1px 2px rgba(26,26,23,0.08)" : "none" }}>{lbl}</button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          {mode === "single" ? (
            <div><FieldLabel>Day</FieldLabel><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyle, width: "auto" }} /></div>
          ) : (
            <>
              <div><FieldLabel>From</FieldLabel><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyle, width: "auto" }} /></div>
              <div><FieldLabel>To</FieldLabel><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ ...inputStyle, width: "auto" }} /></div>
            </>
          )}
          <div><FieldLabel>Open from</FieldLabel><input type="time" value={start} onChange={(e) => setStart(e.target.value)} style={{ ...inputStyle, width: "auto" }} /></div>
          <div><FieldLabel>Until</FieldLabel><input type="time" value={end} onChange={(e) => setEnd(e.target.value)} style={{ ...inputStyle, width: "auto" }} /></div>
          <button onClick={submit} disabled={busy} style={{ ...btnSolid, background: busy ? FAINT : RED }}><Plus size={14} /> {busy ? "Opening…" : (mode === "single" ? "Open this day" : "Open these days")}</button>
        </div>
        {mode === "range" && (
          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 14, cursor: "pointer", fontSize: 12.5, color: BODY }}>
            <input type="checkbox" checked={weekdaysOnly} onChange={(e) => setWeekdaysOnly(e.target.checked)} style={{ width: 15, height: 15, accentColor: "var(--d1-accent, #e23b2e)", cursor: "pointer" }} /> Weekdays only (skip weekends)
          </label>
        )}
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
  const [group, setGroup] = useState("photo");
  const [svcForm, setSvcForm] = useState(null);
  const [addonForm, setAddonForm] = useState(null);
  const groupServices = state.services.filter((s) => s.group === group);
  const groupAddons = state.addons.filter((a) => a.group === group);
  const g = GROUPS[group];
  const startNewService = () => setSvcForm({ name: "", description: "", price: "", category: "", duration: "", padBefore: "", padAfter: "", addonMode: "group", addonIds: [], visible: true, image: "" });
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
          {groupServices.length === 0 && !svcForm && <EmptyState icon={g.Icon} title={"No " + g.label.toLowerCase() + " services yet"} text={'Click "New service" to create your first appointment type.'} style={{ padding: "32px 16px" }} />}
          {groupServices.map((s) => <ServiceCard key={s.id} svc={s} groupAddons={groupAddons} onEdit={() => setSvcForm({ ...s, addonIds: s.addonIds || [] })} onDelete={() => setConfirm({ title: "Delete this appointment type?", message: "\u201c" + s.name + "\u201d will be permanently removed as a bookable appointment type. This cannot be undone.", confirmLabel: "Delete", danger: true, onYes: async () => { setConfirm(null); const r = await deleteService(s.id); if (r && r.ok) showToast("Appointment type deleted."); else showToast((r && r.error) || "Could not delete the service."); } })} onToggleVisible={async () => { const r = await updateService(s.id, { visible: s.visible === false }); if (r && !r.ok) showToast(r.error || "Could not update."); }} />)}
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ ...mono, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: g.color, display: "flex", alignItems: "center", gap: 8 }}><ListPlus size={13} /> {g.label} Add-ons</div>
            {!addonForm && <button onClick={startNewAddon} style={{ ...mono, fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: g.color, background: "transparent", border: `1px solid ${g.color}`, borderRadius: 7, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Plus size={13} /> New add-on</button>}
          </div>
          {addonForm && <AddonForm form={addonForm} setForm={setAddonForm} onSave={saveAddon} onCancel={() => setAddonForm(null)} accent={g.color} />}
          {groupAddons.length === 0 && !addonForm && <EmptyState icon={Package} title={"No " + g.label.toLowerCase() + " add-ons yet"} text={"Add-ons you create here can attach to any " + g.label.toLowerCase() + " service."} style={{ padding: "30px 16px" }} />}
          {groupAddons.map((a) => <AddonCard key={a.id} addon={a} onEdit={() => setAddonForm({ ...a })} onDelete={() => setConfirm({ title: "Delete this add-on?", message: "\u201c" + a.name + "\u201d will be permanently removed. This cannot be undone.", confirmLabel: "Delete", danger: true, onYes: async () => { setConfirm(null); const r = await deleteAddon(a.id); if (r && r.ok) showToast("Add-on deleted."); else showToast((r && r.error) || "Could not delete the add-on."); } })} onToggleVisible={async () => { const r = await updateAddon(a.id, { visible: a.visible === false }); if (r && !r.ok) showToast(r.error || "Could not update."); }} />)}
        </div>
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





function SubTab({ active, onClick, label, badge }) {
  return <button onClick={onClick} style={{ ...mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", padding: "10px 4px", marginRight: 20, cursor: "pointer", background: "transparent", border: "none", color: active ? INK : FAINT, borderBottom: `2px solid ${active ? RED : "transparent"}`, marginBottom: -1, display: "inline-flex", alignItems: "center", gap: 7 }}>{label}{badge ? <span style={{ background: RED, color: "#fff", borderRadius: 20, fontSize: 9.5, minWidth: 16, height: 16, padding: "0 5px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{badge}</span> : null}</button>;
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









function CommandPalette({ state, setAdminTab, setAdminId, onClose, onSignOut, onTheme }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  useEffect(() => { const t = setTimeout(() => { if (inputRef.current) inputRef.current.focus(); }, 30); return () => clearTimeout(t); }, []);
  const go = (tab) => { setAdminTab(tab); onClose(); };
  const openSession = (id) => { setAdminId(id); setAdminTab("sessions"); onClose(); };
  const commands = [
    { icon: LayoutDashboard, label: "Home", sub: "Dashboard and overview", kws: "home dashboard overview metrics", run: () => go("home") },
    { icon: CalendarDays, label: "Sessions", sub: "Manage every booking", kws: "sessions bookings clients projects", run: () => go("sessions") },
    { icon: CalendarClock, label: "Calendar", sub: "Month view by service line", kws: "calendar schedule month", run: () => go("calendar") },
    { icon: Link2, label: "Direct Booking Link", sub: "Reserve a slot for a client", kws: "direct booking link reserve hold", run: () => go("links") },
    { icon: Clock, label: "Availability", sub: "Open days and hours", kws: "availability hours open days bookable", run: () => go("availability") },
    { icon: Package, label: "Services and Add-ons", sub: "Your catalog", kws: "services addons catalog pricing appointment types", run: () => go("services") },
    { icon: Settings, label: "Business Settings", sub: "Revenue, receipts, exports", kws: "business settings revenue receipts export payments", run: () => go("business") },
    { icon: Palette, label: "Appearance", sub: "Change the portal theme", kws: "theme appearance colour color palette", run: () => { onClose(); onTheme(); } },
    { icon: LogOut, label: "Sign out", sub: "Leave the studio dashboard", kws: "sign out log out logout leave", run: () => { onClose(); onSignOut(); } },
  ];
  const ql = q.trim().toLowerCase();
  const cmds = ql ? commands.filter((c) => (c.label + " " + c.kws).toLowerCase().includes(ql)) : commands;
  const sess = ql ? (state.sessions || []).filter((s) => ((s.clientName || "") + " " + (s.type || "")).toLowerCase().includes(ql)).slice(0, 6) : [];
  const items = [
    ...cmds.map((c) => ({ icon: c.icon, iconColor: null, label: c.label, sub: c.sub, tag: null, run: c.run })),
    ...sess.map((s) => { const g = GROUPS[s.serviceLine] || GROUPS.video; return { icon: g.Icon, iconColor: g.color, label: s.clientName, sub: s.type + (s.date ? " \u00b7 " + fmtDate(s.date) : ""), tag: "Session", run: () => openSession(s.id) }; }),
  ];
  const cur = Math.min(sel, Math.max(0, items.length - 1));
  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((i) => Math.min(i + 1, items.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); const it = items[cur]; if (it) it.run(); }
    else if (e.key === "Escape") { e.preventDefault(); onClose(); }
  };
  return (
    <div className="d1-overlay" onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,19,17,0.5)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "76px 20px 20px", zIndex: 400 }}>
      <div className="d1-modal" onClick={(e) => e.stopPropagation()} style={{ background: PAPER, borderRadius: 14, maxWidth: 560, width: "100%", border: `1px solid ${LINE}`, boxShadow: "0 24px 70px rgba(20,19,17,0.28)", overflow: "hidden", maxHeight: "72vh", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "15px 17px", borderBottom: `1px solid ${LINE}` }}>
          <Search size={17} color={FAINT} />
          <input ref={inputRef} value={q} onChange={(e) => { setQ(e.target.value); setSel(0); }} onKeyDown={onKey} placeholder="Search sessions, tabs, and actions" style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 15, color: INK, fontFamily: "inherit" }} />
          <kbd style={{ ...mono, fontSize: 9, color: FAINT, border: `1px solid ${LINE}`, borderRadius: 5, padding: "3px 6px" }}>ESC</kbd>
        </div>
        <div style={{ overflowY: "auto", padding: 7 }}>
          {items.length === 0 ? (
            <div style={{ padding: "28px 16px", textAlign: "center", color: FAINT, fontSize: 13 }}>No matches. Try a client name or a tab.</div>
          ) : items.map((it, i) => { const It = it.icon; const on = i === cur; return (
            <button key={i} onClick={() => it.run()} onMouseEnter={() => setSel(i)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "10px 12px", borderRadius: 9, border: "none", background: on ? CREAM : "transparent", cursor: "pointer" }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: on ? PAPER : CREAM, border: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><It size={15} color={it.iconColor || STONE} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.label}</div>
                {it.sub && <div style={{ ...mono, fontSize: 10, color: STONE, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.sub}</div>}
              </div>
              {it.tag && <span style={{ ...mono, fontSize: 8.5, letterSpacing: "0.1em", textTransform: "uppercase", color: FAINT, border: `1px solid ${LINE}`, borderRadius: 5, padding: "2px 6px", flexShrink: 0 }}>{it.tag}</span>}
            </button>
          ); })}
        </div>
      </div>
    </div>
  );
}

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



function PortalSplash() {
  return (
    <div style={{ minHeight: "100vh", background: CREAM, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, fontFamily: "'Archivo', system-ui, sans-serif" }}>
      <FontLoader />
      <img src="/dot1-logo.png" alt="Dot One Media" className="d1-breathe" style={{ height: 46, width: "auto" }} />
      <div style={{ width: 132, height: 3, borderRadius: 3, background: LINE, overflow: "hidden" }}>
        <div className="d1-loadbar" style={{ height: "100%", width: "40%", borderRadius: 3, background: RED }} />
      </div>
    </div>
  );
}

function LegalPage({ kind, onBack }) {
  const today = "August 13, 2026";
  const terms = [
    ["Agreement to these terms", "By booking a session, using this portal, or engaging Dot One Media (\u201cwe,\u201d \u201cus,\u201d or \u201cDot One\u201d) for services, you agree to these Terms. If you do not agree, please do not use the portal or book a session. Specific projects may also be governed by a separate written agreement, which controls if it conflicts with these Terms."],
    ["Our services", "Dot One Media is a veteran-owned media and production studio based in Wasilla, Alaska, offering photography, videography, music, and related creative and production services. The specific deliverables, timeline, and price for your project are described at booking and in any project agreement."],
    ["Booking, deposits, and payment", "Some sessions require a deposit or payment to reserve your date; your booking is confirmed once that payment is received. Any remaining balance is due as stated for your project, typically before or at delivery. Payments are processed securely through Square; we do not store your full card details. Deposits reserve time we cannot offer to other clients and are non-refundable unless stated otherwise in writing."],
    ["Rescheduling and cancellation", "We understand plans change. You may request to reschedule through this portal; depending on the service and how much notice you give, a reschedule fee may apply, as shown when you request the change. Cancellations may forfeit deposits. We reserve the right to reschedule in cases of illness, emergency, or unsafe conditions, and will work with you to find a new date."],
    ["Deliverables and usage rights", "You receive the finished deliverables agreed for your project. Unless your written agreement says otherwise, Dot One retains copyright in the work and grants you a license to use the delivered images and films for your personal or agreed-upon use. We may feature work we create in our portfolio, website, and social media unless you ask us in writing not to."],
    ["Your responsibilities", "You agree to provide accurate booking information, communicate in a timely way, secure any locations or permissions needed for your session, and make payments when due. Please keep your portal sign-in details private."],
    ["Limitation of liability", "We take great care in our work, but our services and this portal are provided \u201cas is.\u201d To the fullest extent permitted by law, Dot One\u2019s total liability for any claim relating to a project is limited to the amount you paid for that project. We are not liable for indirect or consequential losses."],
    ["Changes to these terms", "We may update these Terms from time to time. The \u201clast updated\u201d date below reflects the current version, and continued use of the portal after changes means you accept them."],
  ];
  const privacy = [
    ["Overview", "This Privacy Policy explains what information Dot One Media collects through this portal and our services, how we use it, and the choices you have. We collect only what we need to serve you well."],
    ["Information we collect", "We collect the details you provide when you book or use the portal: your name, email, phone, session and project details, and any messages or brief responses you send us. When you pay, Square processes the transaction and we receive confirmation and limited details (such as the card brand and last four digits); we do not store your full card number. We also collect the photos and files we create for you, and basic technical information needed to run the portal."],
    ["How we use your information", "We use your information to provide and deliver your services, confirm bookings, communicate with you, process payments, share your finished work, and improve our services. We send booking confirmations and, based on your preferences, project updates, replies, and payment notices."],
    ["How we share your information", "We do not sell your personal information. We share it only with the service providers that help us operate, such as Square (payments), our email provider, and our hosting and database providers, and only as needed to run the portal and deliver your project. We may disclose information if required by law."],
    ["Data retention", "We keep your information for as long as needed to provide your services and meet legal, tax, and business requirements. You may ask us to delete information we are not required to keep."],
    ["Your choices", "You can ask us to access, correct, or delete your personal information, and you can manage which emails you receive from the preferences in your portal (your project details still appear in the portal either way). To make a request, contact us using the details below."],
    ["Cookies and local storage", "The portal uses your browser\u2019s local storage to keep you signed in and remember preferences like your chosen theme. It does not use advertising trackers."],
    ["Security", "We use reasonable measures to protect your information, and payments are handled by Square using bank-level security. No system is perfectly secure, but we take safeguarding your data seriously."],
    ["Children\u2019s privacy", "The portal is intended for adults booking our services and is not directed to children under 13. We do not knowingly collect personal information from children."],
    ["Changes to this policy", "We may update this policy from time to time. The \u201clast updated\u201d date below reflects the current version."],
  ];
  const isTerms = kind === "terms";
  const sections = isTerms ? terms : privacy;
  return (
    <div style={{ maxWidth: 760, margin: "6px auto 0" }}>
      <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 6, ...mono, fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: STONE, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 7, padding: "8px 12px", cursor: "pointer", marginBottom: 22 }}><ArrowLeft size={13} /> Back</button>
      <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase", color: RED, marginBottom: 8 }}>Dot One Media</div>
      <h1 style={{ ...display, fontWeight: 700, fontSize: 32, color: INK, letterSpacing: "-0.015em", marginBottom: 6 }}>{isTerms ? "Terms of Service" : "Privacy Policy"}</h1>
      <div style={{ ...mono, fontSize: 10.5, color: FAINT, marginBottom: 26 }}>Last updated {today}</div>
      <div style={{ ...card, padding: "8px 30px 30px" }}>
        {sections.map((s, i) => (
          <div key={i} style={{ marginTop: 24 }}>
            <h2 style={{ ...display, fontWeight: 600, fontSize: 18, color: INK, marginBottom: 8 }}>{s[0]}</h2>
            <p style={{ fontSize: 14, lineHeight: 1.62, color: BODY }}>{s[1]}</p>
          </div>
        ))}
        <div style={{ marginTop: 28, paddingTop: 20, borderTop: `1px solid ${LINE}` }}>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: STONE }}>Questions about {isTerms ? "these terms" : "this policy"}? Contact us at <a href="mailto:contact@dot1.media" style={{ color: RED, textDecoration: "none" }}>contact@dot1.media</a>.</p>
        </div>
      </div>
    </div>
  );
}

function Footer({ onLegal }) {
  const year = new Date().getFullYear();
  const link = { ...mono, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: STONE, background: "transparent", border: "none", cursor: "pointer", padding: 0, textDecoration: "none" };
  return (
    <footer style={{ borderTop: `1px solid ${LINE}`, background: PAPER }}>
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "22px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
        <div style={{ ...mono, fontSize: 10, letterSpacing: "0.04em", color: FAINT }}>{"\u00a9 " + year + " Dot One Media \u00b7 Wasilla, Alaska"}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <button onClick={() => onLegal("terms")} style={link}>Terms</button>
          <button onClick={() => onLegal("privacy")} style={link}>Privacy</button>
          <a href="mailto:contact@dot1.media" style={link}>Contact</a>
        </div>
      </div>
    </footer>
  );
}

function NotificationBell({ mode, sessions, clientId, onOpenSession, onMarkRead, onOpenTab }) {
  const [open, setOpen] = useState(false);
  const items = [];
  if (mode === "studio") {
    (sessions || []).forEach((s) => {
      (s.comments || []).forEach((c, idx) => {
        if (c && c.author === "client" && !c.read) {
          const resched = /reschedul/i.test(c.text || "");
          items.push({ key: s.id + ":" + idx, Icon: resched ? CalendarClock : MessageSquare, title: (resched ? "Reschedule request" : "New message") + " \u00b7 " + (s.clientName || "Client"), sub: (c.text || "").slice(0, 70), run: () => onOpenSession && onOpenSession(s.id) });
        }
      });
    });
  } else {
    const s = (sessions || []).find((x) => x.id === clientId);
    if (s) {
      (s.comments || []).forEach((c, idx) => {
        if (c && c.author === "studio" && !c.read) items.push({ key: "m" + idx, Icon: MessageSquare, title: "New reply from the studio", sub: (c.text || "").slice(0, 70), run: () => onMarkRead && onMarkRead() });
      });
      if (s.deliveryPhoto) items.push({ key: "gal", Icon: ImageIcon, title: "Your gallery is ready", sub: "View and download your photos", run: () => onOpenTab && onOpenTab() });
      (Array.isArray(s.charges) ? s.charges : []).forEach((c, idx) => { if (c && c.status !== "paid") items.push({ key: "c" + idx, Icon: Wallet, title: "Payment request", sub: (c.label || "Charge") + " \u00b7 " + money((c.amountCents || 0) / 100) }); });
      const bal = (Number(s.total) || 0) - ((s.paymentStatus === "paid") ? (Number(s.payAmount) || 0) : 0);
      if (s.paymentStatus === "paid" && s.balanceStatus !== "paid" && bal > 0) items.push({ key: "bal", Icon: Wallet, title: "Balance due", sub: money(bal) + " remaining" });
    }
  }
  const count = items.length;
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen((o) => !o)} title="Notifications" aria-label="Notifications" style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, borderRadius: 7, cursor: "pointer", color: STONE, background: "transparent", border: `1px solid ${LINE}`, padding: 0 }}>
        <Bell size={15} />
        {count > 0 && <span style={{ position: "absolute", top: -5, right: -5, minWidth: 16, height: 16, padding: "0 4px", borderRadius: 8, background: RED, color: "#fff", fontSize: 9.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", boxSizing: "border-box", ...mono }}>{count}</span>}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
          <div className="d1-modal" style={{ position: "absolute", right: 0, top: 42, width: 322, maxWidth: "86vw", background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, boxShadow: "0 12px 40px rgba(26,26,23,0.18)", zIndex: 41, overflow: "hidden" }}>
            <div style={{ padding: "13px 16px", borderBottom: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ ...mono, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: STONE }}>Notifications</span>
              {count > 0 && <span style={{ ...mono, fontSize: 10, color: FAINT }}>{count} new</span>}
            </div>
            <div style={{ maxHeight: 358, overflowY: "auto" }}>
              {count === 0 ? (
                <div style={{ padding: "34px 20px", textAlign: "center" }}>
                  <Bell size={20} color={FAINT} />
                  <div style={{ fontSize: 13, color: STONE, marginTop: 9 }}>{"You\u2019re all caught up."}</div>
                </div>
              ) : items.map((it) => {
                const Ico = it.Icon;
                return (
                  <button key={it.key} onClick={() => { if (it.run) it.run(); setOpen(false); }} style={{ width: "100%", textAlign: "left", display: "flex", gap: 11, alignItems: "flex-start", padding: "12px 16px", background: "transparent", border: "none", borderBottom: `1px solid ${LINE}`, cursor: it.run ? "pointer" : "default" }}>
                    <span style={{ width: 30, height: 30, borderRadius: 8, background: CREAM, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: RED }}><Ico size={14} /></span>
                    <span style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: INK }}>{it.title}</span>
                      {it.sub ? <span style={{ display: "block", fontSize: 12, color: STONE, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.sub}</span> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}






