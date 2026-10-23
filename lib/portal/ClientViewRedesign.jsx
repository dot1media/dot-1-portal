import { ClientGallery } from "./ClientGallery";
import { VideoReview } from "./VideoReview";
import { BookingCalendar } from "./BookingFlow";
import { InspirationBoard } from "./InspirationBoard";
import { Timeline, ClientActionPanel, SessionReleases, StatusBadge } from "./ClientView";
// Dot One Media portal - REDESIGNED client dashboard. Same data + handlers as the classic
// ClientView (reuses its Timeline / ClientActionPanel / SessionReleases), restructured around
// a next-action hero and a horizontal stage timeline. Clean black & white; the service line
// supplies the accent, and the photo line gets a lighter, more refined blue treatment.
import React, { useState, useEffect, useRef } from "react";
import { AlertTriangle, ArrowRight, CalendarClock, CalendarPlus, Camera, CheckCircle2, ChevronDown, Clock, CreditCard, Download, ExternalLink, FileCheck, FileText, Film, Image as ImageIcon, MessageSquare, Play, Send, Sparkles, Star, Upload, User, X } from "lucide-react";
import { RED, INK, BODY, STONE, FAINT, LINE, PAPER, CREAM, OK, WARN, DANGER, display, mono, card, inputStyle, btnGhost, btnSolid } from "./theme";
import { GROUPS } from "./groups";
import { fmtDate, fmtTime, gcalLink, money, timeGreeting } from "./format";
import { isConsult, GOOGLE_REVIEW_URL, DOC_META, DOC_USAGE, BRIEF_FIELDS } from "./constants";
import { PAYMENT_RULES, STAGES, CONSULT_STAGES, stagesFor, curStage } from "./stages";
import { EmptyState, Avatar, Row } from "./ui";
import { useIsMobile } from "./hooks";

/* A compact horizontal walk of the project stages — the "where am I" glance. */
function HorizontalTimeline({ session, accent }) {
  const stages = stagesFor(session);
  const cur = session.currentStage;
  return (
    <div style={{ display: "flex", gap: 0, alignItems: "flex-start", overflowX: "auto", padding: "4px 2px 2px", WebkitOverflowScrolling: "touch" }}>
      {stages.map((st, i) => {
        const done = i < cur, current = i === cur, St = st.Icon;
        return (
          <div key={st.key} style={{ flex: "1 0 0", minWidth: 72, textAlign: "center", position: "relative" }}>
            {i > 0 && <div style={{ position: "absolute", top: 14, right: "50%", width: "100%", height: 2, background: (done || current) ? accent : LINE }} />}
            <div style={{ position: "relative", zIndex: 1, width: 30, height: 30, borderRadius: "50%", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", background: done ? accent : PAPER, border: `2px solid ${done || current ? accent : LINE}`, boxShadow: current ? `0 0 0 4px ${accent}22` : "none" }}>
              {done ? <CheckCircle2 size={15} color="#fff" /> : <St size={13} color={current ? accent : FAINT} />}
            </div>
            <div style={{ ...mono, fontSize: 8.5, letterSpacing: "0.05em", textTransform: "uppercase", marginTop: 7, color: current ? INK : FAINT, fontWeight: current ? 700 : 500, lineHeight: 1.3 }}>{st.label.split(" ")[0]}</div>
          </div>
        );
      })}
    </div>
  );
}

/* The single most important thing for the client to see/do right now, as a bold hero.
   Dark ink block for video/music/gov; a lighter, airy white-and-blue block for photo. */
function NextActionHero({ session, grp, photo, action, firstName }) {
  const accent = grp.color;
  const dark = !photo;
  const bg = dark ? INK : PAPER;
  const fg = dark ? "#fff" : INK;
  const sub = dark ? "rgba(255,255,255,0.72)" : STONE;
  const eyebrowColor = dark ? "rgba(255,255,255,0.5)" : accent;
  return (
    <div style={{
      position: "relative", overflow: "hidden", borderRadius: 20, padding: photo ? "30px 30px 28px" : "30px 32px 28px",
      background: bg, color: fg,
      border: photo ? `1px solid ${GROUPS.photo.border}` : "none",
      borderTop: photo ? `3px solid ${accent}` : "none",
      boxShadow: dark ? "0 2px 6px rgba(20,20,18,0.12), 0 26px 60px rgba(20,20,18,0.22)" : "0 1px 2px rgba(26,26,23,0.04), 0 18px 48px rgba(74,144,217,0.10)",
      marginBottom: 18,
    }}>
      <div style={{ ...mono, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: eyebrowColor, marginBottom: 10 }}>{action.eyebrow}</div>
      <h2 style={{ ...display, fontWeight: 700, fontSize: photo ? 27 : 29, lineHeight: 1.08, letterSpacing: "-0.015em", color: fg, margin: "0 0 9px", maxWidth: "20ch" }}>{action.title}</h2>
      <p style={{ fontSize: 14, lineHeight: 1.55, color: sub, margin: "0 0 18px", maxWidth: "58ch" }}>{action.body}</p>
      {action.cta && (
        <button onClick={action.cta.onClick} style={{ display: "inline-flex", alignItems: "center", gap: 9, border: "none", borderRadius: 11, padding: "13px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", background: accent, color: "#fff" }}>
          {action.cta.icon} {action.cta.label}
        </button>
      )}
      {action.secondary && (
        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>{action.secondary}</div>
      )}
      {dark && <div style={{ position: "absolute", right: -26, bottom: -52, ...display, fontWeight: 700, fontSize: 230, lineHeight: 1, color: "rgba(255,255,255,0.05)", pointerEvents: "none", userSelect: "none" }}>1</div>}
    </div>
  );
}

export function ClientViewRedesign(props) {
  const { session, sessions, clientId, setClientId, addComment, onRescheduleRequest, markMessagesRead, patchSession, resizeImage, uploadMessageImage, showToast, onOpenSession, onRebook } = props;
  const isMobile = useIsMobile();
  const [draft, setDraft] = useState("");
  const [msg, setMsg] = useState("");
  const [pendingImg, setPendingImg] = useState("");
  const [uploadingImg, setUploadingImg] = useState(false);
  const [lightbox, setLightbox] = useState("");
  const onPickMsgImage = async (e) => {
    const file = e.target.files && e.target.files[0]; e.target.value = "";
    if (!file) return;
    setUploadingImg(true);
    try { const url = await uploadMessageImage(file, session.id); setPendingImg(url); }
    catch (err) { showToast((err && err.message) || "Could not attach that image."); }
    setUploadingImg(false);
  };
  const sendMsg = () => {
    if (!msg.trim() && !pendingImg) return;
    addComment(session.id, "client", msg, false, pendingImg || undefined);
    setMsg(""); setPendingImg("");
  };
  const [reschedOpen, setReschedOpen] = useState(false);
  const [reschedDate, setReschedDate] = useState("");
  const [reschedInfo, setReschedInfo] = useState(null);
  const [prepNotes, setPrepNotes] = useState("");
  const [referral, setReferral] = useState(null);
  const [downloads, setDownloads] = useState(null);
  const [shotIn, setShotIn] = useState("");
  const [profile, setProfile] = useState(null);
  const [profileSaved, setProfileSaved] = useState(false);
  useEffect(() => { fetch("/api/profile").then((r) => r.json()).then((d) => { if (d && d.profile) setProfile(d.profile); }).catch(() => {}); }, [session.clientEmail]);
  async function saveProfile() { if (!profile) return; try { const r = await fetch("/api/profile", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ profile }) }).then((x) => x.json()); if (r.ok) { setProfileSaved(true); setTimeout(() => setProfileSaved(false), 1600); } } catch (e) {} }
  const PROFILE_FIELDS = [["locations", "Favorite locations", "Places you love or want to shoot at"], ["style", "Style & outfits", "Colors, moods, looks you're drawn to, or want to avoid"], ["people", "People to include", "Names and ages, so we get them right (kids, parents, pets)"], ["accessibility", "Comfort & accessibility", "Mobility, sensory, or anything that helps us plan"], ["notes", "Anything else", "Allergies to locations, timing, traditions, surprises"]];
  const shotList = Array.isArray(session.shotList) ? session.shotList : [];
  const saveShots = (list) => patchSession(session.id, { shotList: list });
  const addShot = () => { const t = shotIn.trim(); if (!t) return; saveShots([...shotList, { id: "sh_" + Math.random().toString(36).slice(2, 8), text: t, done: false }]); setShotIn(""); };
  useEffect(() => { fetch("/api/deliverables").then((r) => r.json()).then((d) => { if (d && Array.isArray(d.items)) setDownloads(d); }).catch(() => {}); }, [session.id, session.currentStage]);
  async function openFinal(href) { try { const r = await fetch(href).then((x) => x.json()); if (r.url) { const a = document.createElement("a"); a.href = r.url; a.download = ""; document.body.appendChild(a); a.click(); a.remove(); } } catch (e) {} }
  const [refCopied, setRefCopied] = useState(false);
  useEffect(() => { fetch("/api/referral").then((r) => r.json()).then((d) => { if (d && d.link) setReferral(d); }).catch(() => {}); }, [session.id]);
  useEffect(() => { let stop = false; setPrepNotes(""); if (session.prepNotes) { setPrepNotes(session.prepNotes); return; } if (!session.serviceId) return; fetch("/api/services").then((r) => r.json()).then((d) => { if (stop) return; const sv = (d.services || []).find((x) => String(x.id) === String(session.serviceId)); if (sv && sv.prepNotes) setPrepNotes(sv.prepNotes); }).catch(() => {}); return () => { stop = true; }; }, [session.id, session.serviceId, session.prepNotes]);
  const daysToSession = (() => { if (!session.date) return null; const [y, m, d] = String(session.date).slice(0, 10).split("-").map(Number); const t = new Date(y, m - 1, d); const n = new Date(); const a = new Date(n.getFullYear(), n.getMonth(), n.getDate()); return Math.round((t - a) / 86400000); })();
  const [reschedTime, setReschedTime] = useState("");
  const [reschedBusy, setReschedBusy] = useState(false);
  const [reschedErr, setReschedErr] = useState("");
  useEffect(() => { if (!reschedOpen) { setReschedInfo(null); return; } setReschedErr(""); setReschedTime(""); fetch("/api/sessions/reschedule?sessionId=" + encodeURIComponent(session.id)).then((r) => r.json()).then((d) => setReschedInfo(d && d.slots ? d : { dates: [], slots: {}, withinCutoff: true, cutoffHours: 48 })).catch(() => setReschedInfo({ dates: [], slots: {}, withinCutoff: true, cutoffHours: 48 })); }, [reschedOpen, session.id]);
  async function doReschedule() {
    if (!reschedDate || !reschedTime || reschedBusy) return;
    setReschedBusy(true); setReschedErr("");
    try {
      const r = await fetch("/api/sessions/reschedule", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId: session.id, date: reschedDate, time: reschedTime }) }).then((x) => x.json());
      if (r.ok) { patchSession(session.id, { date: r.date, time: r.time, ...(r.session ? { total: r.session.total, rescheduleFee: r.session.rescheduleFee, comments: r.session.comments } : {}) }); if (showToast) showToast("Moved to " + fmtDate(r.date) + " at " + fmtTime(r.time) + "."); setReschedOpen(false); setReschedDate(""); setReschedTime(""); }
      else setReschedErr(r.error || "Could not move the session.");
    } catch (e) { setReschedErr("Network error. Please try again."); }
    setReschedBusy(false);
  }
  const fileRef = useRef(null);
  useEffect(() => { if (!session) return; setReschedDate(session.date || ""); setReschedOpen(false); setMsg(""); setPendingImg(""); setBrief(session.brief || {}); setBriefMsg(""); }, [clientId]);
  const [docs, setDocs] = useState([]);
  const [emailPrefs, setEmailPrefs] = useState({ updates: true, messages: true, payments: true });
  const [payingBalance, setPayingBalance] = useState(false);
  const [payErr, setPayErr] = useState("");
  const [briefOpen, setBriefOpen] = useState(false);
  const [brief, setBrief] = useState({});
  const [briefMsg, setBriefMsg] = useState("");
  const [versions, setVersions] = useState(null);
  const [resignDone, setResignDone] = useState(0);
  const [resign, setResign] = useState({ name: "", agree: false, busy: false, err: "" });
  useEffect(() => { (async () => { try { const r = await fetch("/api/agreements"); const d = await r.json(); if (r.ok) setDocs(Array.isArray(d.agreements) ? d.agreements : []); } catch (e) {} })(); }, [resignDone]);
  useEffect(() => { fetch("/api/agreements/versions").then((r) => r.json()).then((d) => setVersions(d.versions || null)).catch(() => {}); }, [resignDone]);
  const needsResign = (() => { if (!versions || !docs.length) return []; const latest = {}; for (const d of docs) { const k = d.agreement_type; if (!latest[k] || new Date(d.signed_at) > new Date(latest[k].signed_at)) latest[k] = d; } return Object.keys(latest).filter((k) => versions[k] && String(latest[k].version) !== String(versions[k].version)).map((k) => ({ type: k, signed: latest[k].version, current: versions[k].version, note: versions[k].note, usage: latest[k].usage_option })); })();
  async function doResign() {
    if (!resign.agree || !resign.name.trim()) { setResign({ ...resign, err: "Type your full legal name and check the box to sign." }); return; }
    setResign({ ...resign, busy: true, err: "" });
    try { const r = await fetch("/api/agreements", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: session.clientEmail, signedName: resign.name.trim(), agreements: needsResign.map((n) => ({ type: n.type, version: n.current, usageOption: n.usage || undefined })) }) }); if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error || "Could not record your signature."); } setResign({ name: "", agree: false, busy: false, err: "" }); setResignDone((n) => n + 1); if (showToast) showToast("Thank you. Your updated agreement is on file."); }
    catch (e) { setResign({ ...resign, busy: false, err: e.message }); }
  }
  const [releaseList, setReleaseList] = useState(null);
  useEffect(() => { let stop = false; if (!session || !session.id) return; fetch("/api/model-release/mine?sessionId=" + encodeURIComponent(session.id)).then((r) => r.json()).then((d) => { if (!stop) setReleaseList(d.models || []); }).catch(() => { if (!stop) setReleaseList([]); }); return () => { stop = true; }; }, [session && session.id]);
  useEffect(() => { (async () => { try { const r = await fetch("/api/email-prefs"); const d = await r.json(); if (r.ok && d.prefs) setEmailPrefs({ updates: d.prefs.updates !== false, messages: d.prefs.messages !== false, payments: d.prefs.payments !== false }); } catch (e) {} })(); }, [clientId]);
  const toggleEmailPref = (cat) => { const next = { ...emailPrefs, [cat]: !emailPrefs[cat] }; setEmailPrefs(next); fetch("/api/email-prefs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ prefs: next }) }).catch(() => {}); };
  if (!session) return <div style={{ ...mono, fontSize: 13, color: STONE, padding: "48px 4px", textAlign: "center" }}>No session to show yet. When you book, it will appear here.</div>;
  const stage = session.currentStage;
  const grp = GROUPS[session.serviceLine] || GROUPS.video;
  const photo = session.serviceLine === "photo";
  const fee = PAYMENT_RULES[session.serviceLine]?.reschedFee || 0;
  const status = session.status || "active";
  const comments = Array.isArray(session.comments) ? session.comments : [];
  const unreadReplies = comments.filter((c) => c.author === "studio" && !c.read).length;
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
  const briefStatusText = briefSubmitted ? "Submitted · thank you" : briefHasContent ? "Draft saved · not yet submitted" : "Tell us about your project so we can prepare";
  const isLastStage = session.currentStage >= stagesFor(session).length - 1;
  const pendingReleases = (releaseList || []).filter((m) => m.status === "pending").length;
  const firstName = (session.clientName || "").split(" ")[0] || "there";

  const scrollTo = (id) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth", block: "center" }); };

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
    setBriefMsg(submit ? "Brief submitted · thank you! We’ll be in touch." : "Draft saved.");
  };
  const onPickImage = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try { const dataUrl = await resizeImage(file); patchSession(clientId, { clientImage: dataUrl }); showToast("Photo uploaded to your account."); }
    catch (err) { showToast("Sorry, that image couldn't be processed."); }
    e.target.value = "";
  };

  /* Decide the single hero action (most urgent first). */
  const nextAction = (() => {
    if (balanceDue > 0) return { eyebrow: session.type + " · balance due", title: "Your balance is ready to pay.", body: "A balance of " + money(balanceDue) + " remains on your " + session.type + ". Paying it secures your delivery — it's quick and processed securely through Square.", cta: { label: "Pay " + money(balanceDue) + " securely", icon: <CreditCard size={16} />, onClick: () => scrollTo("d1-payment") } };
    if (pendingReleases > 0) return { eyebrow: session.type + " · signatures needed", title: pendingReleases === 1 ? "One release still needs a signature." : pendingReleases + " releases still need signatures.", body: "Everyone photographed or filmed signs a quick release. Share each person's link below — minors are signed by a parent or guardian.", cta: { label: "Go to releases", icon: <FileCheck size={16} />, onClick: () => scrollTo("d1-releases") } };
    if (status === "active" && stage === 5) return { eyebrow: session.type + " · ready for you", title: photo ? "Your gallery preview is ready." : "Your preview is ready to review.", body: "Take a look and tell us what you'd like changed. We'll fold your notes in before locking the final delivery.", cta: { label: photo ? "Preview your gallery" : "Review your preview", icon: <Play size={16} />, onClick: () => scrollTo("d1-timeline") } };
    if (status === "active" && isLastStage) return { eyebrow: session.type + " · delivered", title: "Your finished work is ready.", body: "Everything we created together is waiting for you. Please download and back up your files — galleries may be removed after six months.", cta: { label: "Open your deliverables", icon: <Download size={16} />, onClick: () => scrollTo("d1-timeline") } };
    if (status === "active" && stage <= 1 && !briefSubmitted) return { eyebrow: session.type + " · let's prepare", title: "You're all set, " + firstName + ".", body: "Your " + session.type + " is booked" + (session.date ? " for " + fmtDate(session.date) : "") + ". Tell us about your vision so we can make the most of our time together.", cta: { label: "Fill out your brief", icon: <FileText size={16} />, onClick: () => { setBriefOpen(true); setTimeout(() => scrollTo("d1-brief"), 60); } }, secondary: session.date && session.time ? [<a key="g" href={gcalLink(session)} target="_blank" rel="noopener noreferrer" style={{ ...mono, fontSize: 10.5, letterSpacing: "0.05em", textTransform: "uppercase", color: photo ? grp.color : "#fff", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, opacity: photo ? 1 : 0.85 }}><CalendarPlus size={14} /> Add to calendar</a>] : null };
    if (daysToSession !== null && daysToSession >= 0 && status === "active" && stage < 6) return { eyebrow: "until your " + session.type, title: daysToSession === 0 ? "Today's the day." : daysToSession === 1 ? "Tomorrow's the day." : daysToSession + " days to go.", body: (prepNotes ? prepNotes : "We're looking forward to your " + session.type + (session.time ? " at " + fmtTime(session.time) : "") + ". We'll be in touch with anything you need beforehand."), cta: session.date && session.time ? { label: "Add to calendar", icon: <CalendarPlus size={16} />, onClick: () => { window.open(gcalLink(session), "_blank"); } } : null };
    return { eyebrow: session.type + " · in progress", title: "We're on it, " + firstName + ".", body: isLastStage ? "Your " + session.type + " is complete. Thank you for creating with Dot One." : "Your " + session.type + " is at “" + curStage(session).label + ".” We'll notify you the moment the next step is ready — nothing is needed from you right now.", cta: null };
  })();

  const sectionTitle = (t) => <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: STONE, marginBottom: 14 }}>{t}</div>;

  return (
    <div className="d1-stagger">
      <style>{`
        .d1-stagger{--e:cubic-bezier(.22,1,.36,1)}
        @keyframes d1cardIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
        @media (prefers-reduced-motion:no-preference){
          .d1-stagger > div{animation:d1cardIn .8s var(--e) both}
          .d1-stagger > div:nth-child(2){animation-delay:0s}
          .d1-stagger > div:nth-child(3){animation-delay:.08s}
          .d1-stagger > div:nth-child(4){animation-delay:.14s}
          .d1-stagger > div:nth-child(5){animation-delay:.20s}
          .d1-stagger > div:nth-child(6){animation-delay:.26s}
          .d1-stagger > div:nth-child(n+7){animation-delay:.32s}
        }
        .d1-stagger > div{transition:transform .55s var(--e),box-shadow .55s var(--e),border-color .4s ease}
        .d1-stagger button,.d1-stagger a{transition:transform .5s var(--e),background-color .4s ease,color .4s ease,border-color .4s ease,box-shadow .4s ease}
        .d1-stagger button:not(:disabled):hover{transform:translateY(-1.5px)}
        .d1-stagger button:not(:disabled):active{transform:translateY(0);transition-duration:.1s}
        .d1-stagger input:focus,.d1-stagger textarea:focus,.d1-stagger select:focus{outline:none;border-color:var(--d1-accent,#111)!important;box-shadow:0 0 0 3px color-mix(in srgb,var(--d1-accent,#111) 14%,transparent)}
        @media (prefers-reduced-motion:reduce){ .d1-stagger > div{animation:none!important} .d1-stagger *{transition-duration:.001ms!important} }
      `}</style>

      {/* Masthead + identity */}
      <div style={{ display: "flex", alignItems: "center", gap: 15, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ position: "relative" }}>
          <Avatar name={session.clientName} src={session.clientImage} size={58} />
          <button onClick={() => fileRef.current && fileRef.current.click()} title="Upload a photo" style={{ position: "absolute", right: -4, bottom: -4, width: 23, height: 23, borderRadius: "50%", background: grp.color, border: "2px solid #fff", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Camera size={11} /></button>
          <input ref={fileRef} type="file" accept="image/*" onChange={onPickImage} style={{ display: "none" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase", color: grp.soft }}>{timeGreeting()}</div>
          <h1 style={{ ...display, fontWeight: 700, fontSize: 30, color: INK, lineHeight: 1.05, letterSpacing: "-0.015em", margin: "2px 0 0" }}>{session.clientName}</h1>
        </div>
        {photo && <img src="/dot1-photo-logo.png" alt="Dot One Photography" style={{ height: 40, width: "auto", display: "block", opacity: 0.9 }} />}
      </div>

      {/* Multi-booking switcher */}
      {sortedSessions.length > 1 && (
        <div style={{ marginBottom: 18 }}>
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

      {/* Status banners */}
      {status === "cancelled" && (
        <div style={{ background: "#fbeeed", border: "1px solid #f2cdc9", borderRadius: 14, padding: "16px 20px", marginBottom: 18 }}>
          <div style={{ ...display, fontSize: 17, color: DANGER, marginBottom: 3 }}>This booking was cancelled</div>
          <div style={{ fontSize: 13, color: BODY, lineHeight: 1.5 }}>If this wasn't expected, please reach out to us at support@dot1.media and we will help.</div>
        </div>
      )}
      {status === "closed" && (
        <div style={{ background: CREAM, border: `1px solid ${LINE}`, borderRadius: 14, padding: "16px 20px", marginBottom: 18 }}>
          <div style={{ ...display, fontSize: 17, color: INK, marginBottom: 3 }}>This booking is closed</div>
          <div style={{ fontSize: 13, color: BODY, lineHeight: 1.5 }}>Questions about your session? Reach out to us at support@dot1.media.</div>
        </div>
      )}

      {/* NEXT-ACTION HERO */}
      {status === "active" && <NextActionHero session={session} grp={grp} photo={photo} action={nextAction} firstName={firstName} />}

      {/* HORIZONTAL STAGE TIMELINE */}
      {status === "active" && (
        <div style={{ ...card, padding: "20px 22px 16px", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
            <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: STONE }}>Project progress</div>
            <StatusBadge stage={stage} group={session.serviceLine} consult={isConsult(session)} />
          </div>
          <HorizontalTimeline session={session} accent={grp.color} />
        </div>
      )}

      {/* Unread replies nudge */}
      {unreadReplies > 0 && (
        <div style={{ background: grp.bg, border: `1px solid ${grp.border}`, borderRadius: 14, padding: "13px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <MessageSquare size={16} color={grp.color} />
          <span style={{ flex: 1, fontSize: 13.5, color: grp.text }}>You have {unreadReplies} new {unreadReplies === 1 ? "reply" : "replies"} from the studio.</span>
          <button onClick={() => markMessagesRead(clientId, "studio")} style={{ ...mono, fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: "#fff", background: grp.color, border: "none", borderRadius: 7, padding: "7px 12px", cursor: "pointer" }}>Mark as read</button>
        </div>
      )}

      {/* At-a-glance summary */}
      <div style={{ ...card, padding: isMobile ? "18px 20px" : "20px 24px", marginBottom: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 16 }}>
          {[["Project", session.type], ["Service", grp.label], ["Date", session.date ? fmtDate(session.date) + (session.time ? " · " + fmtTime(session.time) : "") : "TBD"], ["Your creator", session.photographer]].map(([k, v], i) => (
            <div key={i}><div style={{ ...mono, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: FAINT, marginBottom: 4 }}>{k}</div><div style={{ fontSize: 14, color: INK, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>{i === 0 ? <grp.Icon size={13} color={grp.color} /> : null}{v}</div></div>
          ))}
        </div>
      </div>

      {/* Model releases */}
      <div id="d1-releases"><SessionReleases session={session} /></div>

      {/* Payment */}
      {payTotal > 0 && status === "active" && (
        <div id="d1-payment" style={{ ...card, padding: "22px 24px", marginBottom: 18 }}>
          {sectionTitle("Payment")}
          <Row k="Project total" v={money(payTotal)} />
          {payPaid > 0 && balanceDue > 0 && <Row k="Deposit paid" v={money(payPaid)} sub />}
          {balanceDue > 0 && <Row k="Balance due" v={money(balanceDue)} bold red />}
          {fullyPaid ? (
            <div style={{ marginTop: 13, display: "flex", alignItems: "center", gap: 8 }}><CheckCircle2 size={15} color="#2e9e5b" /><span style={{ ...mono, fontSize: 11.5, letterSpacing: "0.05em", color: OK }}>{"PAID IN FULL · THANK YOU"}</span></div>
          ) : balanceDue > 0 ? (
            <>
              <button onClick={payBalance} disabled={payingBalance} style={{ ...btnSolid, background: grp.color, marginTop: 15, width: "100%", justifyContent: "center", opacity: payingBalance ? 0.7 : 1, cursor: payingBalance ? "default" : "pointer" }}>{payingBalance ? "Starting secure checkout…" : "Pay balance securely · " + money(balanceDue)}</button>
              {payErr && <div style={{ marginTop: 10, fontSize: 12.5, color: DANGER, display: "flex", alignItems: "center", gap: 7 }}><AlertTriangle size={14} /> {payErr}</div>}
            </>
          ) : paymentPending ? (
            <div style={{ marginTop: 12, ...mono, fontSize: 11.5, letterSpacing: "0.04em", color: STONE }}>{"We’re confirming your payment. This will update automatically."}</div>
          ) : null}
          <div style={{ ...mono, fontSize: 9, color: FAINT, marginTop: 11 }}>Payments are processed securely through Square.</div>
        </div>
      )}

      {/* Extra charges */}
      {Array.isArray(session.charges) && session.charges.length > 0 && status === "active" && (
        <div style={{ ...card, padding: "22px 24px", marginBottom: 18, border: `1px solid ${session.charges.some((c) => c.status !== "paid") ? `color-mix(in srgb, ${grp.color} 32%, transparent)` : LINE}` }}>
          <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: session.charges.some((c) => c.status !== "paid") ? grp.color : STONE, marginBottom: 5, display: "flex", alignItems: "center", gap: 8 }}>{session.charges.some((c) => c.status !== "paid") && <span style={{ width: 6, height: 6, borderRadius: "50%", background: grp.color, display: "inline-block" }} />}Payment requests</div>
          <div style={{ fontSize: 12.5, color: STONE, marginBottom: 4 }}>Extra items your studio has added to this project.</div>
          {session.charges.map((c) => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "13px 0", borderTop: `1px solid ${LINE}`, flexWrap: "wrap" }}>
              <div style={{ minWidth: 0, flex: "1 1 auto" }}>
                <div style={{ fontSize: 14.5, color: c.status === "paid" ? STONE : INK, fontWeight: 600 }}>{c.label}</div>
                <div style={{ ...mono, fontSize: 10, color: c.status === "paid" ? OK : FAINT, marginTop: 3 }}>{c.status === "paid" ? ("Paid" + (c.cardLast4 ? " · " + (c.cardBrand ? String(c.cardBrand).replace(/_/g, " ") : "Card") + " ···· " + c.cardLast4 : "")) : "Requested by Dot One Media"}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                <span style={{ fontSize: 17, color: c.status === "paid" ? STONE : INK, fontWeight: 600 }}>{money((Number(c.amountCents) || 0) / 100)}</span>
                {c.status === "paid" ? (
                  <span style={{ ...mono, fontSize: 10, letterSpacing: "0.05em", textTransform: "uppercase", color: OK, border: "1px solid rgba(63,122,63,0.3)", borderRadius: 20, padding: "5px 12px" }}>Paid</span>
                ) : (
                  <button onClick={() => { if (c.squareLink) window.location.href = c.squareLink; }} style={{ ...btnSolid, background: grp.color, padding: "9px 15px" }}>Pay now</button>
                )}
              </div>
            </div>
          ))}
          <div style={{ ...mono, fontSize: 9, color: FAINT, marginTop: 11 }}>Payments are processed securely through Square.</div>
        </div>
      )}

      {/* Production brief */}
      {status === "active" && (
        <div id="d1-brief" style={{ ...card, padding: 0, overflow: "hidden", marginBottom: 18 }}>
          <button onClick={() => setBriefOpen(!briefOpen)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, background: "transparent", border: "none", padding: "16px 20px", cursor: "pointer", textAlign: "left" }}>
            <FileText size={17} color={grp.color} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...display, fontWeight: 600, fontSize: 15, color: INK }}>Production brief</div>
              <div style={{ ...mono, fontSize: 10, color: briefSubmitted ? OK : STONE, marginTop: 2 }}>{briefStatusText}</div>
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
              {briefMsg && <div style={{ ...mono, fontSize: 11.5, color: OK, marginTop: 12, display: "flex", alignItems: "center", gap: 7 }}><CheckCircle2 size={14} /> {briefMsg}</div>}
            </div>
          )}
        </div>
      )}

      {/* Reschedule */}
      {status === "active" && stage < 6 && (
        <div id="d1-reschedule" style={{ marginBottom: 18 }}>
          {!reschedOpen ? (
            <button onClick={() => setReschedOpen(true)} style={{ ...btnSolid, background: grp.color, display: "inline-flex", alignItems: "center", gap: 8, padding: "13px 20px", fontSize: 12 }}><CalendarClock size={16} /> Need to reschedule? Pick a new time</button>
          ) : (
            <div style={{ background: CREAM, border: `1px solid ${LINE}`, borderRadius: 12, padding: "16px 18px", maxWidth: 520 }}>
              {!reschedInfo ? (
                <div style={{ ...mono, fontSize: 11, color: STONE }}>Checking open times…</div>
              ) : reschedInfo.withinCutoff ? (
                <>
                  <div style={{ ...mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: STONE, marginBottom: 8 }}>Request a new date</div>
                  <div style={{ fontSize: 12.5, color: BODY, marginBottom: 10, lineHeight: 1.45 }}>Your session is within {reschedInfo.cutoffHours} hours, so let's handle this together. Tell us a date that works and we'll confirm.</div>
                  <input type="date" value={reschedDate} onChange={(e) => setReschedDate(e.target.value)} style={{ ...inputStyle, marginBottom: 10 }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { if (!reschedDate) return; onRescheduleRequest(session, reschedDate); setReschedOpen(false); }} style={{ ...btnSolid, background: grp.color }}><Send size={13} /> Send request</button>
                    <button onClick={() => setReschedOpen(false)} style={btnGhost}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ ...mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: STONE, marginBottom: 8 }}>Pick a new time</div>
                  <div style={{ fontSize: 12.5, color: fee > 0 ? DANGER : OK, marginBottom: 12, lineHeight: 1.45 }}>{fee > 0 ? `A ${money(fee)} reschedule fee will be added to your balance.` : "Rescheduling is free with reasonable notice. Pick any open time and it moves instantly."}</div>
                  {reschedInfo.dates.length === 0 ? <div style={{ fontSize: 12.5, color: STONE }}>No open times right now. Send us a request and we'll find one together.</div> : (
                    <>
                      <BookingCalendar availDates={reschedInfo.dates} value={reschedDate} onPick={(d) => { setReschedDate(d); setReschedTime(""); }} A={grp.color} />
                      {reschedDate && (reschedInfo.slots[reschedDate] || []).length > 0 && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 12 }}>
                          {(reschedInfo.slots[reschedDate] || []).map((t) => <button key={t} onClick={() => setReschedTime(t)} style={{ ...mono, fontSize: 11.5, padding: "8px 12px", borderRadius: 8, cursor: "pointer", border: `1.5px solid ${reschedTime === t ? grp.color : LINE}`, background: reschedTime === t ? grp.color : PAPER, color: reschedTime === t ? "#fff" : INK }}>{fmtTime(t)}</button>)}
                        </div>
                      )}
                    </>
                  )}
                  {reschedErr && <div style={{ fontSize: 12, color: DANGER, marginTop: 10 }}>{reschedErr}</div>}
                  <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                    <button onClick={doReschedule} disabled={!reschedDate || !reschedTime || reschedBusy} style={{ ...btnSolid, background: reschedDate && reschedTime ? grp.color : FAINT }}><CalendarClock size={13} /> {reschedBusy ? "Moving…" : "Move my session"}</button>
                    <button onClick={() => setReschedOpen(false)} style={btnGhost}>Cancel</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Detailed timeline + stage actions (deliverables, review, final vault, review request) */}
      <div id="d1-timeline" style={{ ...card, padding: "22px 24px", marginBottom: 18 }}>
        {sectionTitle("Your session timeline")}
        <Timeline session={session} accent={grp.color} actionPanel={<ClientActionPanel session={session} grp={grp} draft={draft} setDraft={setDraft} onSubmit={() => { addComment(session.id, "client", draft); setDraft(""); }} />} />
      </div>

      {/* Messages */}
      <div style={{ ...card, padding: "22px 24px", marginBottom: 18 }}>
        {sectionTitle("Messages with the studio")}
        {comments.length === 0 ? (
          <div style={{ marginBottom: 12 }}><EmptyState icon={MessageSquare} title="No messages yet" text="Send a note below and we'll get right back to you." style={{ padding: "22px 14px" }} /></div>
        ) : comments.map((c, i) => {
          const isNew = c.author === "studio" && !c.read;
          return (
            <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, background: c.author === "client" ? grp.bg : CREAM, border: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "center" }}>{c.author === "client" ? <User size={12} color={grp.color} /> : <Camera size={12} color="#6f6d65" />}</div>
              <div style={{ background: isNew ? grp.bg : PAPER, border: `1px solid ${isNew ? grp.border : LINE}`, borderRadius: 8, padding: "8px 12px", flex: 1 }}>
                {c.body ? <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{c.body}</div> : null}
                {c.image ? <img src={c.image} alt="Attached" onClick={() => setLightbox(c.image)} style={{ marginTop: c.body ? 8 : 0, maxWidth: "100%", width: 220, borderRadius: 8, border: `1px solid ${LINE}`, cursor: "zoom-in", display: "block" }} /> : null}
                <div style={{ ...mono, fontSize: 9.5, color: isNew ? grp.text : FAINT, marginTop: 3, letterSpacing: "0.06em" }}>{c.author === "client" ? "You" : "Studio"} · {c.time}{isNew ? " · new" : ""}</div>
              </div>
            </div>
          );
        })}
        {pendingImg ? (
          <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 10, background: PAPER, border: `1px solid ${LINE}`, borderRadius: 8, padding: "8px 10px" }}>
            <img src={pendingImg} alt="To send" style={{ width: 42, height: 42, objectFit: "cover", borderRadius: 6 }} />
            <span style={{ ...mono, fontSize: 10.5, color: STONE }}>Image ready to send</span>
            <button onClick={() => setPendingImg("")} aria-label="Remove image" style={{ background: "transparent", border: "none", cursor: "pointer", color: STONE, display: "flex" }}><X size={15} /></button>
          </div>
        ) : null}
        <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "flex-start" }}>
          <input value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") sendMsg(); }} placeholder="Message the studio…" style={{ flex: 1, border: `1px solid ${LINE}`, borderRadius: 8, padding: "10px 12px", fontSize: 13.5, fontFamily: "inherit", background: PAPER, color: BODY }} />
          <label title="Attach an image" style={{ ...btnSolid, background: PAPER, color: STONE, border: `1px solid ${LINE}`, cursor: uploadingImg ? "default" : "pointer", whiteSpace: "nowrap" }}>
            <ImageIcon size={15} />
            <input type="file" accept="image/*" disabled={uploadingImg} onChange={onPickMsgImage} style={{ display: "none" }} />
          </label>
          <button onClick={sendMsg} disabled={uploadingImg} style={{ ...btnSolid, background: grp.color, whiteSpace: "nowrap" }}><Send size={14} /> {uploadingImg ? "Uploading…" : "Send"}</button>
        </div>
      </div>

      {lightbox ? (
        <div className="d1-overlay" onClick={() => setLightbox("")} style={{ position: "fixed", inset: 0, background: "rgba(20,20,26,0.82)", zIndex: 90, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, cursor: "zoom-out" }}>
          <img src={lightbox} alt="Attached" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 8, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }} />
        </div>
      ) : null}

      {/* Updated agreements to re-sign */}
      {needsResign.length > 0 && (
        <div style={{ ...card, padding: "20px 24px", marginBottom: 18, borderLeft: `4px solid ${WARN}` }}>
          <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 5 }}>Updated agreement to sign</div>
          {needsResign.map((n) => (
            <div key={n.type} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 14, color: INK, fontWeight: 600 }}>{(DOC_META[n.type] || {}).label || n.type} <span style={{ ...mono, fontSize: 10, color: FAINT, fontWeight: 400 }}>v{n.signed} → v{n.current}</span></div>
              {n.note && <div style={{ fontSize: 13, color: BODY, lineHeight: 1.5, marginTop: 3 }}>What changed: {n.note}</div>}
              {(DOC_META[n.type] || {}).pdf && <a href={DOC_META[n.type].pdf} target="_blank" rel="noopener noreferrer" style={{ ...mono, fontSize: 10.5, color: grp.color }}>Read the updated document</a>}
            </div>
          ))}
          <input value={resign.name} onChange={(e) => setResign({ ...resign, name: e.target.value })} placeholder="Type your full legal name to sign" style={{ ...inputStyle, marginTop: 6, maxWidth: 360 }} />
          <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12.5, color: BODY, marginTop: 10, cursor: "pointer" }}><input type="checkbox" checked={resign.agree} onChange={(e) => setResign({ ...resign, agree: e.target.checked })} style={{ marginTop: 2 }} /> I have read the updated agreement{needsResign.length > 1 ? "s" : ""} and agree to {needsResign.length > 1 ? "them" : "it"}.</label>
          {resign.err && <div style={{ fontSize: 12, color: DANGER, marginTop: 8 }}>{resign.err}</div>}
          <button onClick={doResign} disabled={resign.busy} style={{ ...btnSolid, background: grp.color, marginTop: 12 }}>{resign.busy ? "Signing…" : "Sign updated agreement"}</button>
        </div>
      )}

      {/* Documents on file */}
      {docs.length > 0 && (
        <div style={{ marginBottom: 18 }}>
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
                    <div style={{ ...mono, fontSize: 9.5, color: STONE, marginTop: 2 }}>Signed{when ? " " + when : ""}{d.signed_name ? " by " + d.signed_name : ""}{usage ? " · " + usage : ""}</div>
                  </div>
                  <span style={{ ...mono, fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: OK, background: `color-mix(in srgb, ${OK} 15%, var(--d1-paper,#fff))`, border: "1px solid #bfe6cc", borderRadius: 20, padding: "4px 9px", flexShrink: 0 }}>Signed</span>
                  {d.id && <a href={"/api/signed-doc?id=" + encodeURIComponent(d.id)} target="_blank" rel="noopener noreferrer" style={{ ...mono, fontSize: 10.5, letterSpacing: "0.04em", color: grp.color, textDecoration: "none", flexShrink: 0 }}>View</a>}
                </div>
              );
            })}
          </div>
          <div style={{ ...mono, fontSize: 9.5, color: FAINT, marginTop: 8, lineHeight: 1.5 }}>These are the agreements on file for your account. Keep this for your records.</div>
        </div>
      )}

      {/* Shot list */}
      {stage < 6 && status === "active" && (
        <div style={{ ...card, padding: "22px 24px", marginBottom: 18 }}>
          {sectionTitle("Your shot list")}
          <div style={{ fontSize: 12.5, color: STONE, marginBottom: 10, marginTop: -6 }}>Moments and shots you don't want missed. We see this before your session.</div>
          {shotList.map((sh) => (
            <div key={sh.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: `1px solid ${LINE}` }}>
              <span style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${sh.done ? grp.color : LINE}`, background: sh.done ? grp.color : "transparent", flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{sh.done ? <CheckCircle2 size={12} color="#fff" /> : null}</span>
              <span style={{ flex: 1, fontSize: 13.5, color: INK, textDecoration: sh.done ? "line-through" : "none", opacity: sh.done ? 0.6 : 1 }}>{sh.text}</span>
              {!sh.done && <button onClick={() => saveShots(shotList.filter((x) => x.id !== sh.id))} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: FAINT, display: "inline-flex" }} aria-label="Remove"><X size={14} /></button>}
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <input value={shotIn} onChange={(e) => setShotIn(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addShot(); }} placeholder="e.g. Grandma holding the baby, the ring close-up" style={{ ...inputStyle, flex: 1 }} />
            <button onClick={addShot} disabled={!shotIn.trim()} style={{ ...btnSolid, background: shotIn.trim() ? grp.color : FAINT }}>Add</button>
          </div>
        </div>
      )}

      {/* Rebook */}
      {(stage >= 6 || session.status === "closed") && session.serviceId && onRebook && (
        <div style={{ ...card, padding: "20px 24px", marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", borderLeft: `4px solid ${grp.color}` }}>
          <div><div style={{ ...display, fontWeight: 600, fontSize: 16, color: INK }}>Loved this one?</div><div style={{ fontSize: 12.5, color: STONE, marginTop: 2 }}>Book another {session.type} in a few taps. Your details carry over.</div></div>
          <button onClick={() => onRebook(session.serviceId)} style={{ ...btnSolid, background: grp.color }}><CalendarPlus size={14} /> Book again</button>
        </div>
      )}

      {/* Download center */}
      {downloads && downloads.items.length > 0 && (
        <div style={{ ...card, padding: "22px 24px", marginBottom: 18 }}>
          {sectionTitle("Download center")}
          <div style={{ fontSize: 12.5, color: STONE, marginBottom: 10, marginTop: -6 }}>Everything we've delivered to you{downloads.sessions > 1 ? ", across all " + downloads.sessions + " of your sessions" : ""}, in one place.</div>
          {downloads.items.map((it, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: `1px solid ${LINE}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, color: INK, fontWeight: 500 }}>{it.label}</div>
                <div style={{ ...mono, fontSize: 10, color: FAINT, marginTop: 2 }}>{it.session}{it.note ? " · " + it.note : ""}</div>
              </div>
              {it.direct ? <button onClick={() => openFinal(it.href)} style={{ ...btnSolid, background: grp.color }}><Download size={13} /> Download</button>
                : it.open ? (it.sessionId === session.id ? <span style={{ ...mono, fontSize: 10, color: STONE }}>Above in this session</span> : <button onClick={() => onOpenSession && onOpenSession(it.sessionId)} style={btnGhost}>View</button>)
                : <a href={it.href} target="_blank" rel="noopener noreferrer" style={{ ...btnGhost, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}><ExternalLink size={13} /> Open</a>}
            </div>
          ))}
        </div>
      )}

      {/* Inspiration */}
      {stage < 6 && status === "active" && <InspirationBoard sessionId={session.id} editable accent={grp.color} />}

      {/* Profile */}
      {profile && (
        <div style={{ ...card, padding: "22px 24px", marginBottom: 18 }}>
          {sectionTitle("Your profile")}
          <div style={{ fontSize: 12.5, color: STONE, marginBottom: 12, marginTop: -6 }}>Tell us once, and every future session starts with this in hand.</div>
          {PROFILE_FIELDS.map(([k, label, hint]) => (
            <div key={k} style={{ marginBottom: 10 }}>
              <div style={{ ...mono, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: STONE, marginBottom: 4 }}>{label}</div>
              <textarea value={profile[k] || ""} onChange={(e) => setProfile({ ...profile, [k]: e.target.value })} onBlur={saveProfile} rows={2} placeholder={hint} style={{ width: "100%", border: `1px solid ${LINE}`, borderRadius: 8, padding: "9px 11px", fontSize: 13, fontFamily: "inherit", resize: "vertical", background: PAPER, color: BODY, boxSizing: "border-box" }} />
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={saveProfile} style={{ ...btnSolid, background: grp.color }}>{profileSaved ? "Saved" : "Save profile"}</button>
            <span style={{ ...mono, fontSize: 10, color: FAINT }}>Also saves automatically when you leave a field.</span>
          </div>
        </div>
      )}

      {/* Referral */}
      {referral && (
        <div style={{ ...card, padding: "22px 24px", marginBottom: 18, borderLeft: `4px solid ${grp.color}` }}>
          {sectionTitle("Refer a friend")}
          <div style={{ fontSize: 13, color: BODY, lineHeight: 1.55, marginBottom: 12, marginTop: -6 }}>Know someone who'd love a session? Share your link. When they book, you earn <b>${referral.credit}</b> toward your next session.{referral.count > 0 ? ` You've referred ${referral.count} so far, ${money(referral.earned)} earned.` : ""}</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ ...mono, fontSize: 11.5, color: INK, background: CREAM, border: `1px solid ${LINE}`, borderRadius: 8, padding: "9px 12px", flex: "1 1 220px", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{referral.link}</div>
            <button onClick={async () => { try { await navigator.clipboard.writeText(referral.link); setRefCopied(true); setTimeout(() => setRefCopied(false), 1600); } catch (e) {} }} style={{ ...btnSolid, background: grp.color }}>{refCopied ? "Copied" : "Copy link"}</button>
            {typeof navigator !== "undefined" && navigator.share ? <button onClick={() => { navigator.share({ title: "Dot One Media", text: "Book a session with Dot One Media", url: referral.link }).catch(() => {}); }} style={btnGhost}>Share</button> : null}
          </div>
        </div>
      )}

      {/* Email preferences */}
      <div style={{ ...card, padding: "22px 24px", marginBottom: 18 }}>
        {sectionTitle("Email preferences")}
        <div style={{ fontSize: 12.5, color: STONE, marginBottom: 6, marginTop: -6 }}>Choose which emails you'd like from us. Everything still shows here in your portal either way.</div>
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
