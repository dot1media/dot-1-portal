"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  CalendarCheck, FileCheck, Camera, Upload, Scissors, Eye, PackageCheck,
  CheckCircle2, User, LayoutDashboard, Send, Play, Image as ImageIcon,
  RotateCcw, Clock, MessageSquare, Film, Music, Landmark, Package,
  Plus, Trash2, Pencil, Check, AlertTriangle, Tag, Link2, ListPlus,
  Star, CreditCard, Wallet, CalendarDays, ChevronLeft, ChevronRight,
  ArrowRight, ArrowLeft, CalendarClock, X, Copy, LogIn, Sparkles,
  MessageCircle, Smartphone, Link as LinkIcon, Ban
} from "lucide-react";

// Persist to the browser's localStorage (works in a real browser, unlike the
// chat sandbox). Same shape the app expects: get -> {value}|null, set/delete async.
const storage = {
  get: async (k) => { try { const v = typeof window !== "undefined" ? window.localStorage.getItem(k) : null; return v == null ? null : { value: v }; } catch { return null; } },
  set: async (k, v) => { try { if (typeof window !== "undefined") window.localStorage.setItem(k, v); } catch {} },
  delete: async (k) => { try { if (typeof window !== "undefined") window.localStorage.removeItem(k); } catch {} },
};

/* ---------- brand tokens ---------- */
const RED = "#e23b2e";
const INK = "#1a1a17";
const BODY = "#33322d";
const STONE = "#6f6d65";
const FAINT = "#9a988f";
const LINE = "#e2ded4";
const PAPER = "#ffffff";
const CREAM = "#faf8f3";

const display = { fontFamily: "'Bodoni Moda', Georgia, serif" };
const mono = { fontFamily: "'IBM Plex Mono', ui-monospace, monospace" };

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
  photo: { label: "Photography payment", Icon: Wallet, options: [{ key: "full", label: "Pay in full now", pct: 100 }, { key: "half", label: "Pay 50% now", pct: 50 }, { key: "reserve", label: "Reserve — pay at session", pct: 0 }], note: "No retainer required. Full session fee due at or before the session start.", reschedFee: 0 },
  music: { label: "Music payment", Icon: Wallet, options: [{ key: "quote", label: "Request a quote", pct: 0 }], note: "Custom-quoted per project. No online checkout yet.", reschedFee: 0 },
  government: { label: "Government payment", Icon: Wallet, options: [{ key: "quote", label: "Request a quote", pct: 0 }], note: "Always custom-quoted and invoiced. No online checkout.", reschedFee: 0 },
};

const STAGES = [
  { key: "scheduled", label: "Session Scheduled", Icon: CalendarCheck, desc: "Your session is on the calendar. We can't wait to work with you." },
  { key: "confirmed", label: "Booked & Confirmed", Icon: FileCheck, desc: "Your booking is confirmed and the details are locked in." },
  { key: "dayof", label: "Day of Session", Icon: Camera, desc: "It's session day. Let's create something great together." },
  { key: "post", label: "Post-Session", Icon: Upload, desc: "That's a wrap. Your files are safely backed up and selection has begun." },
  { key: "editing", label: "Editing", Icon: Scissors, desc: "Your story is being crafted, edited frame by frame." },
  { key: "predelivery", label: "Pre-Delivery Review", Icon: Eye, desc: "Your preview is ready. Take a look and let us know if you'd like any changes." },
  { key: "delivered", label: "Final Delivery", Icon: PackageCheck, desc: "Everything's ready. Your finished work is delivered below. Thank you." },
];

const GOOGLE_REVIEW_URL = "https://g.page/r/Ceb1aSxQSvm6EBM/review/";
const ADMINS = ["video@dot1.media", "photo@dot1.media"]; // studio login accounts
const PORTAL_BASE = "https://portal.dot1.media/book/";
const STORAGE_KEY = "dot1_portal_v4";
const uid = (p) => p + "_" + Math.random().toString(36).slice(2, 8);

const fmtDate = (iso) => { if (!iso) return ""; const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }); };
const fmtTime = (t) => { if (!t) return ""; const [h, m] = t.split(":").map(Number); const ap = h >= 12 ? "PM" : "AM"; const hh = ((h + 11) % 12) + 1; return `${hh}:${String(m).padStart(2, "0")} ${ap}`; };
const money = (n) => "$" + (Number(n) || 0).toLocaleString();

const DEFAULT_STATE = {
  sessions: [
    { id: "ses_wedding", clientName: "Sarah & James", clientEmail: "sarah@example.com", clientImage: "", notifyEmail: "video@dot1.media", type: "Wedding Film", serviceLine: "video", photographer: "Dennis Matthews", date: "2026-09-14", time: "10:00", location: "Palmer, AK", currentStage: 5, stageTimes: { 0: "Aug 2", 1: "Aug 4", 2: "Sep 14", 3: "Sep 15", 4: "Sep 20", 5: "Sep 24" }, comments: [], selectedAddons: [], total: 2500, payChoice: "retainer", reviewLink: "https://f.io/dot1-sarah-james-cut1", deliveryVideo: "https://f.io/dot1-sarah-james-final", deliveryPhoto: "" },
    { id: "ses_family", clientName: "The Nelson Family", clientEmail: "nelson@example.com", clientImage: "", notifyEmail: "photo@dot1.media", type: "Family Session", serviceLine: "photo", photographer: "Brittany Matthews", date: "2026-08-30", time: "14:00", location: "Eagle River, AK", currentStage: 6, stageTimes: { 0: "Aug 1", 1: "Aug 3", 2: "Aug 30", 3: "Aug 31", 4: "Sep 2", 5: "Sep 4", 6: "Sep 5" }, comments: [{ author: "client", body: "Could we get a few more of the kids down by the river?", time: "Sep 4", read: false }], selectedAddons: [], total: 450, payChoice: "full", reviewLink: "https://gallery.dot1.media/nelson-preview", deliveryVideo: "", deliveryPhoto: "https://gallery.dot1.media/nelson-family" },
  ],
  services: [],
  addons: [],
  directLinks: [],
};

const CLIENT_AGREEMENT_VERSION = "1.0";
const CLIENT_AGREEMENT_TITLE = "Dot One Media Client Services Agreement";
const CLIENT_AGREEMENT_TEXT = `By booking with Dot One Media / DOT ONE LLC, you agree to the following key terms:

Booking & retainer. Video sessions require a $750 retainer (or payment in full) to reserve your date; the balance is due 24 hours before filming. Photography may be paid in full, 50% now, or reserved and paid at the session. Music and government projects are quoted individually.

Rescheduling. Video sessions may be rescheduled for a $150 fee with reasonable notice. Photography sessions may be rescheduled at no charge with reasonable notice.

Deliverables & timeline. Your project moves through the stages shown in your portal, from booking to final delivery. Final files are delivered digitally; please download and back up your files promptly.

Cancellations. Retainers and deposits reserve your date and are non-refundable.

Media release. You grant Dot One Media permission to use the finished work for portfolio and promotional purposes unless you request otherwise in writing.

This is a summary of the full agreement. By typing your name and checking the box below, you acknowledge that you have read and agree to the full Dot One Media Client Services Agreement.`;

export default function App() {
  const [view, setView] = useState("landing");   // landing | client | admin | book | login | studiologin
  const [adminTab, setAdminTab] = useState("sessions"); // sessions | calendar | services | links
  const [state, setState] = useState(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);
  const [clientId, setClientId] = useState("ses_wedding");
  const [adminId, setAdminId] = useState("ses_wedding");
  const [directContext, setDirectContext] = useState(null);
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    (async () => {
      try { const r = await storage.get(STORAGE_KEY); if (r && r.value) { const p = JSON.parse(r.value); if (p && p.sessions) setState({ ...DEFAULT_STATE, ...p }); } } catch (e) {}
      setLoaded(true);
    })();
  }, []);
  useEffect(() => { if (!loaded) return; (async () => { try { await storage.set(STORAGE_KEY, JSON.stringify(state)); } catch (e) {} })(); }, [state, loaded]);

  const showToast = (msg) => { setToast(msg); if (toastTimer.current) clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(null), 3600); };

  const patchSession = (id, patch) => setState((s) => ({ ...s, sessions: s.sessions.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));

  const doSetStage = (id, idx) => setState((s) => ({ ...s, sessions: s.sessions.map((x) => { if (x.id !== id) return x; const times = { ...x.stageTimes }; if (times[idx] === undefined) times[idx] = "just now"; return { ...x, currentStage: idx, stageTimes: times }; }) }));

  const requestSetStage = (session, idx) => {
    if (idx === session.currentStage) return;
    const advancing = idx > session.currentStage;
    setConfirm({
      title: advancing ? "Advance this session?" : "Move this session back?",
      message: advancing ? `Advance ${session.clientName} to "${STAGES[idx].label}"? This will send a status email to the client.` : `Move ${session.clientName} back to "${STAGES[idx].label}"? No email is sent when moving backward.`,
      confirmLabel: advancing ? "Advance & notify" : "Move back", danger: !advancing,
      onYes: () => { doSetStage(session.id, idx); if (advancing) showToast(`Status email sent to ${session.clientName} — "${STAGES[idx].label}"`); setConfirm(null); },
    });
  };

  const addComment = (id, author, body, silent) => {
    if (!body.trim()) return;
    setState((s) => ({ ...s, sessions: s.sessions.map((x) => x.id === id ? { ...x, comments: [...x.comments, { author, body: body.trim(), time: "just now", read: false }] } : x) }));
    if (!silent && author === "client") showToast("Message sent — the studio has been notified by email.");
    if (!silent && author === "studio") showToast("Reply sent — the client has been notified by email.");
  };
  const markMessagesRead = (id, who) => setState((s) => ({ ...s, sessions: s.sessions.map((x) => x.id === id ? { ...x, comments: x.comments.map((c) => c.author === who ? { ...c, read: true } : c) } : x) }));
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

  const addService = (svc) => setState((s) => ({ ...s, services: [...s.services, svc] }));
  const updateService = (id, patch) => setState((s) => ({ ...s, services: s.services.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  const deleteService = (id) => setState((s) => ({ ...s, services: s.services.filter((x) => x.id !== id) }));
  const addAddon = (a) => setState((s) => ({ ...s, addons: [...s.addons, a] }));
  const updateAddon = (id, patch) => setState((s) => ({ ...s, addons: s.addons.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  const deleteAddon = (id) => setState((s) => ({ ...s, addons: s.addons.filter((x) => x.id !== id), services: s.services.map((sv) => ({ ...sv, addonIds: (sv.addonIds || []).filter((aid) => aid !== id) })) }));

  /* ---- slot availability + direct links ---- */
  const slotTaken = (date, time, exceptSessionId) => {
    if (!date || !time) return false;
    const inSessions = state.sessions.some((s) => s.id !== exceptSessionId && s.date === date && s.time === time);
    const inLinks = state.directLinks.some((l) => l.date === date && l.time === time);
    return inSessions || inLinks;
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
    const newSession = { id, clientName: booking.name, clientEmail: booking.email, clientImage: "", notifyEmail, type: booking.serviceName, serviceLine: grp, photographer: grp === "photo" ? "Brittany Matthews" : "Dennis Matthews", date: booking.date, time: booking.time, location: "", currentStage: 1, stageTimes: { 0: "just now" }, comments: [], selectedAddons: booking.addons, total: booking.total, payChoice: booking.payChoice, reviewLink: "", deliveryVideo: "", deliveryPhoto: "" };
    setState((s) => ({ ...s, sessions: [...s.sessions, newSession] }));
    if (booking.linkId) consumeDirectLink(booking.linkId);
    setDirectContext(null); setClientId(id); setView("client");
    showToast(`Booking confirmed! A new ${GROUPS[grp].label} appointment email was sent to ${notifyEmail}.`);
  };

  const loginAs = (email) => {
    const s = state.sessions.find((x) => x.clientEmail.toLowerCase() === email.trim().toLowerCase());
    if (s) { setClientId(s.id); setView("client"); showToast("Welcome back, " + s.clientName + "!"); }
    else showToast("No account found with that email. Try booking a session first.");
  };
  const loginAsStudio = (email) => {
    if (ADMINS.includes(email.trim().toLowerCase())) { setView("admin"); showToast("Signed in to the studio dashboard."); }
    else showToast("That isn't a studio account. Use your Dot One Media admin email.");
  };

  const resetDemo = () => setConfirm({ title: "Reset the demo?", message: "This clears all sessions, services, add-ons, and booking links back to the starting state.", confirmLabel: "Reset everything", danger: true, onYes: async () => { setState(DEFAULT_STATE); try { await storage.delete(STORAGE_KEY); } catch (e) {} showToast("Demo reset."); setConfirm(null); } });

  const clientSession = state.sessions.find((s) => s.id === clientId) || state.sessions[0];
  const unreadClientTotal = state.sessions.reduce((n, s) => n + s.comments.filter((c) => c.author === "client" && !c.read).length, 0);

  return (
    <div style={{ background: CREAM, minHeight: "100vh", fontFamily: "'Archivo', system-ui, sans-serif", color: BODY }}>
      <FontLoader />
      <header style={{ borderBottom: `1px solid ${LINE}`, background: PAPER }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "16px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <img src="/dot1-logo.png" alt="Dot One Media" style={{ height: 26, width: "auto", display: "block" }} />
            <span style={{ ...mono, fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: FAINT }}>Client Portal</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => setView("landing")} title="Portal home (first-use landing)" style={{ ...mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: view === "landing" ? INK : STONE, background: "transparent", border: `1px solid ${view === "landing" ? INK : LINE}`, borderRadius: 6, padding: "8px 10px", cursor: "pointer" }}>Home</button>
            <button onClick={() => { setDirectContext(null); setView("book"); }} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 7, cursor: "pointer", fontSize: 12.5, border: `1px solid ${RED}`, background: view === "book" ? RED : "#fff", color: view === "book" ? "#fff" : RED, fontWeight: 500 }}><Plus size={14} /> Book a Session</button>
            <button onClick={() => setView("login")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 7, cursor: "pointer", fontSize: 12.5, border: `1px solid ${view === "login" ? INK : LINE}`, background: view === "login" ? INK : PAPER, color: view === "login" ? "#fff" : STONE }}><LogIn size={13} /> Log in</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1120, margin: "0 auto", padding: "28px 22px 60px" }}>
        {view === "landing" && <LandingPage onBook={() => { setDirectContext(null); setView("book"); }} onClientLogin={() => setView("login")} onStudioLogin={() => setView("studiologin")} />}
        {view === "studiologin" && <StudioLogin onLogin={loginAsStudio} onBack={() => setView("landing")} />}
        {view === "book" && <BookingFlow state={state} direct={directContext} slotTaken={slotTaken} onCancel={() => { setDirectContext(null); setView("landing"); }} onComplete={createBooking} goStudio={() => { setView("admin"); setAdminTab("services"); }} onLogin={() => setView("login")} />}
        {view === "login" && <LoginView onLogin={loginAs} onBook={() => { setDirectContext(null); setView("book"); }} onStudio={() => setView("studiologin")} />}
        {view === "client" && <ClientView session={clientSession} sessions={state.sessions} clientId={clientId} setClientId={setClientId} addComment={addComment} onRescheduleRequest={clientRescheduleRequest} markMessagesRead={markMessagesRead} patchSession={patchSession} resizeImage={resizeImage} showToast={showToast} />}
        {view === "admin" && (
          <div>
            <div style={{ display: "flex", gap: 6, marginBottom: 24, borderBottom: `1px solid ${LINE}`, flexWrap: "wrap" }}>
              <SubTab active={adminTab === "sessions"} onClick={() => setAdminTab("sessions")} label="Sessions" badge={unreadClientTotal} />
              <SubTab active={adminTab === "calendar"} onClick={() => setAdminTab("calendar")} label="Calendar" />
              <SubTab active={adminTab === "links"} onClick={() => setAdminTab("links")} label="Direct Booking Link" />
              <SubTab active={adminTab === "services"} onClick={() => setAdminTab("services")} label="Services & Add-ons" />
            </div>
            {adminTab === "sessions" && <AdminSessions state={state} adminId={adminId} setAdminId={setAdminId} requestSetStage={requestSetStage} addComment={addComment} patchSession={patchSession} onReschedule={adminReschedule} slotTaken={slotTaken} markMessagesRead={markMessagesRead} />}
            {adminTab === "calendar" && <AdminCalendar state={state} onSelectSession={(id) => { setAdminId(id); setAdminTab("sessions"); }} />}
            {adminTab === "links" && <DirectLinks state={state} createDirectLink={createDirectLink} revokeDirectLink={revokeDirectLink} openDirectLink={openDirectLink} showToast={showToast} />}
            {adminTab === "services" && <ServiceCatalog state={state} addService={addService} updateService={updateService} deleteService={deleteService} addAddon={addAddon} updateAddon={updateAddon} deleteAddon={deleteAddon} showToast={showToast} />}
          </div>
        )}
      </main>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: INK, color: "#e8e6df", textAlign: "center", padding: "7px 12px", ...mono, fontSize: 10.5, letterSpacing: "0.1em" }}>PHASE 1 PROTOTYPE · mock data · not yet connected to Square / Neon / Frame.io</div>
      {toast && <div style={{ position: "fixed", bottom: 44, left: "50%", transform: "translateX(-50%)", background: INK, color: "#fff", padding: "11px 18px", borderRadius: 8, boxShadow: "0 10px 30px rgba(0,0,0,0.25)", fontSize: 13.5, maxWidth: "92%", display: "flex", alignItems: "center", gap: 9, zIndex: 60 }}><CheckCircle2 size={16} color="#7ee0a0" /> {toast}</div>}
      {confirm && <ConfirmDialog {...confirm} onCancel={() => setConfirm(null)} />}
    </div>
  );
}

/* ============================ LANDING (first-use entry) ============================ */
function LandingPage({ onBook, onClientLogin, onStudioLogin }) {
  return (
    <div style={{ maxWidth: 760, margin: "10px auto 0" }}>
      <div style={{ textAlign: "center", padding: "20px 0 4px" }}>
        <div style={{ marginBottom: 10 }}><img src="/dot1-logo-anim.gif" alt="Dot One Media" style={{ height: 186, width: "auto", margin: "0 auto", display: "block" }} /></div>
        <div style={{ ...mono, fontSize: 11, letterSpacing: "0.24em", textTransform: "uppercase", color: FAINT, marginBottom: 22 }}>Client Portal</div>
        <h1 style={{ ...display, fontWeight: 700, fontSize: 40, color: INK, lineHeight: 1.1, letterSpacing: "0", marginBottom: 14 }}>Your project,<br />start to finish.</h1>
        <p style={{ fontSize: 15.5, color: BODY, lineHeight: 1.6, maxWidth: 520, margin: "0 auto 30px" }}>
          Book a session, then follow every step from the shoot to your final delivery, all in one place. Welcome to your studio's home for the work we make together.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <button onClick={onBook} style={{ textAlign: "left", cursor: "pointer", background: RED, border: "none", borderRadius: 14, padding: "22px 24px", color: "#fff" }}>
          <Sparkles size={22} style={{ marginBottom: 12 }} />
          <div style={{ ...display, fontWeight: 700, fontSize: 20, marginBottom: 4 }}>Book a session</div>
          <div style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.92 }}>New here? Choose your service and set up your account in a couple of minutes.</div>
          <div style={{ ...mono, fontSize: 11, letterSpacing: "0.06em", marginTop: 14, display: "flex", alignItems: "center", gap: 6 }}>Get started <ArrowRight size={13} /></div>
        </button>
        <button onClick={onClientLogin} style={{ textAlign: "left", cursor: "pointer", background: PAPER, border: `1px solid ${LINE}`, borderRadius: 14, padding: "22px 24px", color: INK }}>
          <User size={22} color={STONE} style={{ marginBottom: 12 }} />
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
  return (
    <div style={{ maxWidth: 400, margin: "20px auto 0" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ width: 46, height: 46, borderRadius: "50%", background: INK, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><LayoutDashboard size={22} color="#fff" /></div>
        <div style={{ ...display, fontWeight: 700, fontSize: 26, color: INK, marginBottom: 6 }}>Studio sign in</div>
        <div style={{ fontSize: 13.5, color: STONE, lineHeight: 1.5 }}>For Dot One Media staff.</div>
      </div>
      <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, padding: "22px 24px" }}>
        <FieldLabel>Studio email</FieldLabel>
        <TextInput value={email} onChange={setEmail} placeholder="you@dot1.media" />
        <FieldLabel>Password</FieldLabel>
        <TextInput value={pw} onChange={setPw} placeholder="••••••••" />
        <button onClick={() => { if (!email.trim()) return; onLogin(email); }} style={{ ...btnSolid, background: INK, width: "100%", justifyContent: "center", marginTop: 6, padding: "11px" }}><LogIn size={15} /> Sign in to studio</button>
        <div style={{ ...mono, fontSize: 9.5, color: FAINT, textAlign: "center", marginTop: 12, lineHeight: 1.5 }}>Demo: <span style={{ color: STONE }}>video@dot1.media</span> or <span style={{ color: STONE }}>photo@dot1.media</span></div>
      </div>
      <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: STONE }}><span onClick={onBack} style={{ color: RED, cursor: "pointer" }}>← Back to portal home</span></div>
    </div>
  );
}

/* ============================ CLIENT LOGIN ============================ */
function LoginView({ onLogin, onBook, onStudio }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  return (
    <div style={{ maxWidth: 400, margin: "20px auto 0" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ ...display, fontWeight: 700, fontSize: 28, color: INK, marginBottom: 6 }}>Welcome back</div>
        <div style={{ fontSize: 13.5, color: STONE, lineHeight: 1.5 }}>Log in to check the status of your session.</div>
      </div>
      <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, padding: "22px 24px" }}>
        <FieldLabel>Email</FieldLabel>
        <TextInput value={email} onChange={setEmail} placeholder="you@example.com" />
        <FieldLabel>Password</FieldLabel>
        <TextInput value={pw} onChange={setPw} placeholder="••••••••" />
        <button onClick={() => { if (!email.trim()) return; onLogin(email); }} style={{ ...btnSolid, background: RED, width: "100%", justifyContent: "center", marginTop: 6, padding: "11px" }}><LogIn size={15} /> Log in</button>
        <div style={{ ...mono, fontSize: 9.5, color: FAINT, textAlign: "center", marginTop: 12, lineHeight: 1.5 }}>Demo: log in with <span style={{ color: STONE }}>sarah@example.com</span> or <span style={{ color: STONE }}>nelson@example.com</span></div>
      </div>
      <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: STONE }}>
        New here? <span onClick={onBook} style={{ color: RED, cursor: "pointer" }}>Book a session</span>{onStudio ? <span> · <span onClick={onStudio} style={{ color: STONE, cursor: "pointer" }}>Studio login</span></span> : null}
      </div>
    </div>
  );
}

/* ============================ BOOKING FLOW ============================ */
function BookingFlow({ state, direct, slotTaken, onCancel, onComplete, goStudio, onLogin }) {
  const [step, setStep] = useState(direct ? 2 : 0); // 0 welcome, 1 choose, 2 account, 3 confirm
  const [group, setGroup] = useState(direct?.group || "video");
  const [serviceId, setServiceId] = useState(direct?.serviceId || null);
  const [addonIds, setAddonIds] = useState([]);
  const [acct, setAcct] = useState({ name: direct?.recipient || "", email: "", phone: "", signature: "" });
  const [date, setDate] = useState(direct?.date || "");
  const [time, setTime] = useState(direct?.time || "");
  const [payChoice, setPayChoice] = useState(null);
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState("");
  const submitAccount = async () => {
    setSubmitErr("");
    if (!acct.name.trim() || !acct.email.trim()) { setSubmitErr("Please enter your name and email."); return; }
    if (!agree || !acct.signature.trim()) { setSubmitErr("Type your full legal name and check the box to sign the agreement."); return; }
    setSubmitting(true);
    try {
      const ures = await fetch("/api/users", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: acct.name.trim(), email: acct.email.trim(), phone: (acct.phone || "").trim() }) });
      const udata = await ures.json();
      if (!ures.ok) throw new Error(udata.error || "Could not create your account.");
      const ares = await fetch("/api/agreements", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: acct.email.trim(), agreementType: "client_services", version: CLIENT_AGREEMENT_VERSION, signedName: acct.signature.trim() }) });
      const adata = await ares.json();
      if (!ares.ok) throw new Error(adata.error || "Could not record your signature.");
      setStep(3);
    } catch (e) {
      setSubmitErr((e && e.message) || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const groupServices = state.services.filter((s) => s.group === group);
  const catalogService = state.services.find((s) => s.id === serviceId) || null;
  const service = catalogService || (direct ? { id: direct.serviceId, name: direct.serviceName, price: direct.price, addonMode: "group", addonIds: [] } : null);
  const groupAddons = state.addons.filter((a) => a.group === group);
  const availableAddons = service ? (service.addonMode === "custom" ? groupAddons.filter((a) => (service.addonIds || []).includes(a.id)) : groupAddons) : [];
  const chosenAddons = availableAddons.filter((a) => addonIds.includes(a.id));
  const basePrice = Number(service?.price) || 0;
  const total = basePrice + chosenAddons.reduce((s, a) => s + (Number(a.price) || 0), 0);
  const rules = PAYMENT_RULES[group];
  const A = GROUPS[group].color, AB = GROUPS[group].bg, ABD = GROUPS[group].border, AT = GROUPS[group].text;
  const taken = !direct && slotTaken(date, time);

  const stepDefs = direct ? [{ n: 2, label: "Account" }, { n: 3, label: "Confirm & Pay" }] : [{ n: 1, label: "Choose" }, { n: 2, label: "Account" }, { n: 3, label: "Confirm & Pay" }];

  /* STEP 0 — WELCOME */
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
          {groupServices.length === 0 ? (
            <div style={{ border: `1px dashed ${LINE}`, borderRadius: 10, padding: "28px", textAlign: "center", background: PAPER }}>
              <div style={{ ...display, fontSize: 17, color: INK, marginBottom: 6 }}>No {GROUPS[group].label} services yet</div>
              <div style={{ fontSize: 13, color: STONE, marginBottom: 16, lineHeight: 1.5 }}>This booking page shows the services you create in your catalog. Add some first, then they'll appear here.</div>
              <button onClick={goStudio} style={{ ...btnSolid, background: INK, margin: "0 auto" }}><Tag size={14} /> Go to Services & Add-ons</button>
            </div>
          ) : (
            <div>
              {groupServices.map((s) => { const sel = serviceId === s.id; return (
                <button key={s.id} onClick={() => { setServiceId(s.id); setAddonIds([]); }} style={{ width: "100%", textAlign: "left", marginBottom: 10, padding: "15px 17px", borderRadius: 10, cursor: "pointer", border: `1.5px solid ${sel ? GROUPS[group].color : LINE}`, background: sel ? AB : PAPER }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                    <span style={{ ...display, fontWeight: 600, fontSize: 17, color: INK }}>{s.name}</span>
                    <span style={{ ...mono, fontSize: 14, color: A, fontWeight: 500 }}>{s.price ? money(s.price) : "Quote"}</span>
                  </div>
                  {s.description && <div style={{ fontSize: 12.5, color: BODY, lineHeight: 1.5, marginTop: 5 }}>{s.description}</div>}
                </button>
              ); })}
              {service && availableAddons.length > 0 && (
                <div style={{ marginTop: 18, background: CREAM, border: `1px solid ${LINE}`, borderRadius: 10, padding: "16px 18px" }}>
                  <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: STONE, marginBottom: 12 }}>Add-ons (optional)</div>
                  {availableAddons.map((a) => { const on = addonIds.includes(a.id); return (
                    <div key={a.id} onClick={() => setAddonIds((p) => on ? p.filter((x) => x !== a.id) : [...p, a.id])} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", cursor: "pointer", borderTop: `1px solid ${LINE}` }}>
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
        <div style={{ maxWidth: 560 }}>
          <div style={{ fontSize: 13.5, color: BODY, marginBottom: 18, lineHeight: 1.5 }}>Create your account and sign the agreement to continue. Already have an account? <span onClick={onLogin} style={{ color: A, cursor: "pointer" }}>Log in</span>.</div>
          <FieldLabel>Your name</FieldLabel>
          <TextInput value={acct.name} onChange={(v) => setAcct({ ...acct, name: v })} placeholder="Sarah & James" />
          <FieldLabel>Email</FieldLabel>
          <TextInput value={acct.email} onChange={(v) => setAcct({ ...acct, email: v })} placeholder="you@example.com" />
          <FieldLabel>Phone (optional)</FieldLabel>
          <TextInput value={acct.phone} onChange={(v) => setAcct({ ...acct, phone: v })} placeholder="(907) 555-0123" />

          <div style={{ marginTop: 22, marginBottom: 6, ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE }}>{CLIENT_AGREEMENT_TITLE}</div>
          <div style={{ maxHeight: 190, overflowY: "auto", border: `1px solid ${LINE}`, borderRadius: 9, padding: "14px 16px", background: PAPER, fontSize: 12.5, lineHeight: 1.55, color: BODY, whiteSpace: "pre-wrap" }}>{CLIENT_AGREEMENT_TEXT}</div>

          <div style={{ marginTop: 14 }}>
            <FieldLabel>Type your full legal name to sign</FieldLabel>
            <TextInput value={acct.signature} onChange={(v) => setAcct({ ...acct, signature: v })} placeholder="Full legal name" />
          </div>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 12, cursor: "pointer" }}>
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ marginTop: 3, width: 16, height: 16, accentColor: A, cursor: "pointer" }} />
            <span style={{ fontSize: 12.5, color: BODY, lineHeight: 1.5 }}>I have read and agree to the {CLIENT_AGREEMENT_TITLE}, and this typed signature is legally binding.</span>
          </label>

          {submitErr && <div style={{ marginTop: 12, fontSize: 12.5, color: "#b5271b", display: "flex", alignItems: "center", gap: 7 }}><AlertTriangle size={14} /> {submitErr}</div>}

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}>
            <button onClick={() => (direct ? onCancel() : setStep(1))} disabled={submitting} style={btnGhost}><ArrowLeft size={14} /> Back</button>
            <button onClick={submitAccount} disabled={submitting} style={{ ...btnSolid, background: submitting ? FAINT : A }}>{submitting ? "Saving..." : "Create account and continue"} <ArrowRight size={15} /></button>
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
            <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <FieldLabel>Session date</FieldLabel>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
              </div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <FieldLabel>Time</FieldLabel>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={inputStyle} />
              </div>
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
          <div style={{ ...mono, fontSize: 9.5, color: FAINT, marginTop: 4, marginBottom: 18 }}>Payment is simulated in this prototype — Square is wired in a later phase.</div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button onClick={() => setStep(2)} style={btnGhost}><ArrowLeft size={14} /> Back</button>
            <button onClick={() => { if (!date || !time || !payChoice || taken) return; onComplete({ linkId: direct?.id, group, serviceName: service.name, addons: chosenAddons.map((a) => ({ name: a.name, price: Number(a.price) || 0 })), total, date, time, payChoice, name: acct.name, email: acct.email }); }} style={{ ...btnSolid, background: date && time && payChoice && !taken ? A : FAINT }}><Check size={15} /> Confirm booking</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================ DIRECT BOOKING LINKS ============================ */
function DirectLinks({ state, createDirectLink, revokeDirectLink, openDirectLink, showToast }) {
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
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
            <div style={{ background: "#fbf3f2", border: `1px solid #f2cdc9`, borderRadius: 12, padding: "18px 20px", marginBottom: 18 }}>
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
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,26,23,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 80, padding: 20 }} onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: PAPER, borderRadius: 12, padding: "24px 26px", maxWidth: 420, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
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
function ClientView({ session, sessions, clientId, setClientId, addComment, onRescheduleRequest, markMessagesRead, patchSession, resizeImage, showToast }) {
  const [draft, setDraft] = useState("");
  const [msg, setMsg] = useState("");
  const [reschedOpen, setReschedOpen] = useState(false);
  const [reschedDate, setReschedDate] = useState(session.date || "");
  const fileRef = useRef(null);
  const stage = session.currentStage;
  const grp = GROUPS[session.serviceLine] || GROUPS.video;
  const fee = PAYMENT_RULES[session.serviceLine]?.reschedFee || 0;
  const unreadReplies = session.comments.filter((c) => c.author === "studio" && !c.read).length;
  useEffect(() => { setReschedDate(session.date || ""); setReschedOpen(false); setMsg(""); }, [clientId]);

  const onPickImage = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try { const dataUrl = await resizeImage(file); patchSession(clientId, { clientImage: dataUrl }); showToast("Photo uploaded to your account."); }
    catch (err) { showToast("Sorry, that image couldn't be processed."); }
    e.target.value = "";
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22, flexWrap: "wrap" }}>
        <span style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: FAINT }}>Viewing as</span>
        {sessions.map((s) => { const sc = (GROUPS[s.serviceLine] || GROUPS.video).color; const on = clientId === s.id; return <button key={s.id} onClick={() => setClientId(s.id)} style={{ ...mono, fontSize: 11, letterSpacing: "0.04em", padding: "6px 11px", borderRadius: 20, cursor: "pointer", border: `1px solid ${on ? sc : LINE}`, background: on ? sc : PAPER, color: on ? "#fff" : STONE }}>{s.clientName}</button>; })}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
        <div style={{ position: "relative" }}>
          <Avatar name={session.clientName} src={session.clientImage} size={64} />
          <button onClick={() => fileRef.current && fileRef.current.click()} title="Upload a photo" style={{ position: "absolute", right: -4, bottom: -4, width: 24, height: 24, borderRadius: "50%", background: grp.color, border: "2px solid #fff", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Camera size={12} /></button>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPickImage} style={{ display: "none" }} />
        </div>
        <div>
          <div style={{ marginBottom: 4 }}><span style={{ ...mono, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: grp.soft }}>Welcome back</span></div>
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

      <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 10, padding: "18px 22px", marginBottom: 14, display: "flex", gap: 26, flexWrap: "wrap", alignItems: "center" }}>
        <SummaryCell label="Project" value={session.type} icon={<grp.Icon size={13} color={grp.color} />} />
        <SummaryCell label="Service" value={grp.label} />
        <SummaryCell label="Date" value={session.date ? fmtDate(session.date) + (session.time ? " · " + fmtTime(session.time) : "") : "TBD"} />
        <SummaryCell label="Your creator" value={session.photographer} />
        <div style={{ marginLeft: "auto" }}><StatusBadge stage={stage} group={session.serviceLine} /></div>
      </div>

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

      <div style={{ ...mono, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: STONE, marginBottom: 16 }}>Your session timeline</div>
      <Timeline session={session} accent={grp.color} actionPanel={<ClientActionPanel session={session} grp={grp} draft={draft} setDraft={setDraft} onSubmit={() => { addComment(session.id, "client", draft); setDraft(""); }} />} />

      <div style={{ marginTop: 26 }}>
        <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 10 }}>Messages with the studio</div>
        {session.comments.length === 0 ? (
          <div style={{ fontSize: 13, color: FAINT, fontStyle: "italic", marginBottom: 12 }}>No messages yet. Send a note below.</div>
        ) : session.comments.map((c, i) => {
          const isNew = c.author === "studio" && !c.read;
          return (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, background: c.author === "client" ? grp.bg : CREAM, border: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "center" }}>{c.author === "client" ? <User size={12} color={grp.color} /> : <Camera size={12} color={STONE} />}</div>
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
    const link = isVideo ? session.deliveryVideo : session.deliveryPhoto;
    return (
      <div style={{ marginTop: 4 }}>
        <div style={{ background: CREAM, border: `1px solid ${LINE}`, borderRadius: 10, padding: "18px" }}>
          <div style={{ ...mono, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: g.color, marginBottom: 10 }}>Your finished work is ready</div>
          {link ? <a href={link} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 9, background: g.color, color: "#fff", textDecoration: "none", padding: "12px 20px", borderRadius: 8, fontSize: 14.5 }}>{isVideo ? <Film size={17} /> : <ImageIcon size={17} />} {isVideo ? "Watch & download on Frame.io" : "View & download your gallery"}</a> : <div style={{ ...mono, fontSize: 11, color: FAINT }}>Delivery link is being prepared.</div>}
          <div style={{ ...mono, fontSize: 10, color: FAINT, marginTop: 12, letterSpacing: "0.05em" }}>{isVideo ? "Delivered via Frame.io" : "Delivered via your online gallery"} · please download and back up your files</div>
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
  return <div style={{ display: "flex", alignItems: "center", gap: 9, color: STONE, fontSize: 13, marginTop: 4, background: CREAM, border: `1px dashed ${LINE}`, borderRadius: 10, padding: "13px 16px" }}><Clock size={15} color={FAINT} /> We'll email you the moment your next update is ready.</div>;
}

/* ============================ ADMIN — SESSIONS ============================ */
function AdminSessions({ state, adminId, setAdminId, requestSetStage, addComment, patchSession, onReschedule, slotTaken, markMessagesRead }) {
  const session = state.sessions.find((s) => s.id === adminId) || state.sessions[0];
  const sg = GROUPS[session.serviceLine] || GROUPS.video;
  const [msg, setMsg] = useState("");
  const [editLinks, setEditLinks] = useState(false);
  const [videoLink, setVideoLink] = useState("");
  const [photoLink, setPhotoLink] = useState("");
  const [reviewLink, setReviewLink] = useState("");
  const [reschedOpen, setReschedOpen] = useState(false);
  const [reschedDate, setReschedDate] = useState(session.date || "");
  const [reschedTime, setReschedTime] = useState(session.time || "");
  useEffect(() => { setVideoLink(session.deliveryVideo || ""); setPhotoLink(session.deliveryPhoto || ""); setReviewLink(session.reviewLink || ""); setEditLinks(false); setReschedOpen(false); setReschedDate(session.date || ""); setReschedTime(session.time || ""); }, [adminId]);
  const saveLinks = () => { patchSession(session.id, { deliveryVideo: videoLink.trim(), deliveryPhoto: photoLink.trim(), reviewLink: reviewLink.trim() }); setEditLinks(false); };
  const reschedClash = slotTaken(reschedDate, reschedTime, session.id);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 26 }}>
      <div>
        <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase", color: RED, marginBottom: 14 }}>Sessions</div>
        {state.sessions.map((s) => { const selected = s.id === adminId; const grp = GROUPS[s.serviceLine] || GROUPS.video; const unread = s.comments.filter((c) => c.author === "client" && !c.read).length; return (
          <button key={s.id} onClick={() => { setAdminId(s.id); markMessagesRead(s.id, "client"); }} style={{ width: "100%", textAlign: "left", marginBottom: 8, padding: "12px 14px", borderRadius: 9, cursor: "pointer", border: `1px solid ${selected ? INK : LINE}`, background: selected ? INK : PAPER, color: selected ? "#fff" : BODY }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 3 }}>
              <span style={{ ...display, fontWeight: 600, fontSize: 15 }}>{s.clientName}</span>
              {unread > 0 && <span style={{ ...mono, background: RED, color: "#fff", borderRadius: 20, fontSize: 9.5, minWidth: 16, height: 16, padding: "0 5px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{unread}</span>}
            </div>
            <div style={{ ...mono, fontSize: 10, letterSpacing: "0.06em", color: selected ? "#c9c6bd" : STONE, display: "flex", alignItems: "center", gap: 6 }}><grp.Icon size={11} /> {s.type} · {STAGES[s.currentStage].label}</div>
          </button>
        ); })}
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4, flexWrap: "wrap" }}>
          <Avatar name={session.clientName} src={session.clientImage} size={40} />
          <h2 style={{ ...display, fontWeight: 700, fontSize: 26, color: INK, letterSpacing: "-0.01em" }}>{session.clientName}</h2>
          <ServicePill line={session.serviceLine} />
        </div>
        <div style={{ ...mono, fontSize: 11, color: STONE, marginBottom: session.notifyEmail ? 4 : 18, letterSpacing: "0.04em" }}>{session.type} · {fmtDate(session.date) || "date TBD"}{session.time ? " at " + fmtTime(session.time) : ""} · {session.clientEmail}</div>
        {session.notifyEmail && <div style={{ ...mono, fontSize: 10, color: FAINT, marginBottom: 18, letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 6 }}><Send size={11} /> New-booking alert routed to {session.notifyEmail}</div>}

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

        <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: STONE, marginBottom: 12 }}>Advance the session — click a stage to set it current</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          {STAGES.map((st, i) => { const done = i < session.currentStage, current = i === session.currentStage, St = st.Icon; return (
            <button key={st.key} onClick={() => requestSetStage(session, i)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12.5, border: `1px solid ${current ? sg.color : done ? sg.border : LINE}`, background: current ? sg.color : done ? sg.bg : PAPER, color: current ? "#fff" : done ? sg.text : STONE }}><St size={13} /> <span style={mono}>{i + 1}</span> {st.label}</button>
          ); })}
        </div>
        <div style={{ ...mono, fontSize: 9.5, color: FAINT, marginBottom: 26, letterSpacing: "0.04em" }}>You'll be asked to confirm — advancing sends the client a status email.</div>

        <div style={{ background: CREAM, border: `1px solid ${LINE}`, borderRadius: 9, padding: "16px 18px", marginBottom: 26 }}>
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
      <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, padding: "18px 20px" }}>
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
    <div style={{ minHeight: 80, border: `1px solid ${LINE}`, borderRadius: 7, padding: 5, background: isToday ? "#fbf3f2" : PAPER }}>
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
function ServiceCatalog({ state, addService, updateService, deleteService, addAddon, updateAddon, deleteAddon, showToast }) {
  const [group, setGroup] = useState("video");
  const [svcForm, setSvcForm] = useState(null);
  const [addonForm, setAddonForm] = useState(null);
  const groupServices = state.services.filter((s) => s.group === group);
  const groupAddons = state.addons.filter((a) => a.group === group);
  const g = GROUPS[group];
  const startNewService = () => setSvcForm({ name: "", description: "", price: "", addonMode: "group", addonIds: [] });
  const saveService = () => { if (!svcForm.name.trim()) { showToast("Give the service a name first."); return; } if (svcForm.id) { updateService(svcForm.id, svcForm); showToast("Service updated."); } else { addService({ ...svcForm, id: uid("svc"), group }); showToast("Service created."); } setSvcForm(null); };
  const startNewAddon = () => setAddonForm({ name: "", price: "", addTime: "" });
  const saveAddon = () => { if (!addonForm.name.trim()) { showToast("Give the add-on a name first."); return; } if (addonForm.id) { updateAddon(addonForm.id, addonForm); showToast("Add-on updated."); } else { addAddon({ ...addonForm, id: uid("add"), group }); showToast("Add-on created."); } setAddonForm(null); };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
        {GROUP_KEYS.map((k) => { const gg = GROUPS[k]; const active = group === k; return (
          <button key={k} onClick={() => { setGroup(k); setSvcForm(null); setAddonForm(null); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 15px", borderRadius: 8, cursor: "pointer", fontSize: 13, border: `1px solid ${active ? gg.color : LINE}`, background: active ? gg.color : PAPER, color: active ? "#fff" : STONE }}><gg.Icon size={14} /> {gg.label}</button>
        ); })}
      </div>
      <PaymentRuleBanner group={group} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ ...mono, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: g.color, display: "flex", alignItems: "center", gap: 8 }}><Tag size={13} /> {g.label} Services</div>
            {!svcForm && <button onClick={startNewService} style={{ ...mono, fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: "#fff", background: g.color, border: "none", borderRadius: 7, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Plus size={13} /> New service</button>}
          </div>
          {svcForm && <ServiceForm form={svcForm} setForm={setSvcForm} onSave={saveService} onCancel={() => setSvcForm(null)} group={group} groupAddons={groupAddons} />}
          {groupServices.length === 0 && !svcForm && <EmptyHint text={`No ${g.label.toLowerCase()} services yet. Click "New service" to create your first appointment type.`} />}
          {groupServices.map((s) => <ServiceCard key={s.id} svc={s} groupAddons={groupAddons} onEdit={() => setSvcForm({ ...s, addonIds: s.addonIds || [] })} onDelete={() => deleteService(s.id)} />)}
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ ...mono, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: g.color, display: "flex", alignItems: "center", gap: 8 }}><ListPlus size={13} /> {g.label} Add-ons</div>
            {!addonForm && <button onClick={startNewAddon} style={{ ...mono, fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: g.color, background: "transparent", border: `1px solid ${g.color}`, borderRadius: 7, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><Plus size={13} /> New add-on</button>}
          </div>
          {addonForm && <AddonForm form={addonForm} setForm={setAddonForm} onSave={saveAddon} onCancel={() => setAddonForm(null)} accent={g.color} />}
          {groupAddons.length === 0 && !addonForm && <EmptyHint text={`No ${g.label.toLowerCase()} add-ons yet. Add-ons you create here can attach to any ${g.label.toLowerCase()} service.`} />}
          {groupAddons.map((a) => <AddonCard key={a.id} addon={a} onEdit={() => setAddonForm({ ...a })} onDelete={() => deleteAddon(a.id)} />)}
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
      <FieldLabel>Price (USD)</FieldLabel>
      <TextInput value={form.price} onChange={(v) => setForm({ ...form, price: v })} placeholder="e.g. 1200" prefix="$" />
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
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 6 }}>
        <button onClick={onCancel} style={btnGhost}>Cancel</button>
        <button onClick={onSave} style={{ ...btnSolid, background: accent }}><Check size={14} /> Save add-on</button>
      </div>
    </div>
  );
}

function ServiceCard({ svc, groupAddons, onEdit, onDelete }) {
  const attached = svc.addonMode === "group" ? groupAddons : groupAddons.filter((a) => (svc.addonIds || []).includes(a.id));
  return (
    <div style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: "14px 16px", marginBottom: 10, background: PAPER }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ ...display, fontWeight: 600, fontSize: 16, color: INK }}>{svc.name}</div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>{svc.price ? <span style={{ ...mono, fontSize: 12, color: RED, fontWeight: 500 }}>${svc.price}</span> : null}<IconBtn onClick={onEdit}><Pencil size={13} /></IconBtn><IconBtn onClick={onDelete} danger><Trash2 size={13} /></IconBtn></div>
      </div>
      {svc.description ? <div style={{ fontSize: 12.5, color: BODY, lineHeight: 1.5, marginTop: 5 }}>{svc.description}</div> : null}
      <div style={{ ...mono, fontSize: 9.5, letterSpacing: "0.05em", color: FAINT, marginTop: 9, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}><Package size={11} /> {svc.addonMode === "group" ? "All group add-ons" : `${attached.length} selected`}{attached.length > 0 && <span style={{ color: STONE }}>· {attached.map((a) => a.name).join(", ")}</span>}</div>
    </div>
  );
}

function AddonCard({ addon, onEdit, onDelete }) {
  return (
    <div style={{ border: `1px solid ${LINE}`, borderRadius: 9, padding: "11px 14px", marginBottom: 8, background: PAPER, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
      <div><div style={{ fontSize: 13.5, color: INK, fontWeight: 500 }}>{addon.name}</div><div style={{ ...mono, fontSize: 10, color: STONE, marginTop: 2, letterSpacing: "0.04em" }}>{addon.price ? `+$${addon.price}` : "no charge"}{addon.addTime ? ` · +${addon.addTime} min` : ""}</div></div>
      <div style={{ display: "flex", gap: 6 }}><IconBtn onClick={onEdit}><Pencil size={13} /></IconBtn><IconBtn onClick={onDelete} danger><Trash2 size={13} /></IconBtn></div>
    </div>
  );
}

/* ============================ SHARED ============================ */
function Timeline({ session, actionPanel, accent = RED }) {
  const cur = session.currentStage;
  return (
    <div style={{ position: "relative" }}>
      {STAGES.map((st, i) => {
        const done = i < cur, current = i === cur, upcoming = i > cur, St = st.Icon, last = i === STAGES.length - 1;
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

function SummaryCell({ label, value, icon }) {
  return <div><div style={{ ...mono, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: FAINT, marginBottom: 3 }}>{label}</div><div style={{ fontSize: 14, color: INK, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>{icon}{value}</div></div>;
}

function StatusBadge({ stage, group }) {
  const st = STAGES[stage], St = st.Icon, delivered = stage === 6;
  const g = GROUPS[group] || GROUPS.video;
  const bg = delivered ? "#eaf7ef" : g.bg, bd = delivered ? "#bfe6cc" : g.border, tx = delivered ? "#2e7d4f" : g.text, ic = delivered ? "#2e9e5b" : g.color;
  return <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 24, background: bg, border: `1px solid ${bd}` }}><St size={14} color={ic} /><span style={{ ...mono, fontSize: 11, letterSpacing: "0.06em", color: tx }}>{st.label}</span></div>;
}

function Toggle({ active, onClick, Icon, label }) {
  return <button onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 13px", borderRadius: 7, cursor: "pointer", fontSize: 12.5, border: `1px solid ${active ? INK : LINE}`, background: active ? INK : PAPER, color: active ? "#fff" : STONE }}><Icon size={14} /> {label}</button>;
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

function FontLoader() {
  useEffect(() => {
    const id = "dot1-fonts"; if (document.getElementById(id)) return;
    const l = document.createElement("link"); l.id = id; l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400..700&family=Archivo:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap";
    document.head.appendChild(l);
  }, []);
  return null;
}

