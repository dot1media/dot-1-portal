// Dot One Media portal - client project dashboard (timeline, payments, deliverables, messages, brief, usage rights) + private ProgressBar, SummaryCell, StatusBadge, Timeline, ClientActionPanel. resizeImage is an App-level prop.
import React, { useState, useEffect, useRef } from "react";
import { AlertTriangle, CalendarClock, CalendarPlus, Camera, CheckCircle2, ChevronDown, Clock, Download, FileCheck, FileText, Film, Image as ImageIcon, MessageSquare, Play, Send, Star, Upload, User, X, Paperclip} from "lucide-react";
import { RED, INK, BODY, STONE, FAINT, LINE, PAPER, CREAM, OK, DANGER, display, mono, card, inputStyle, btnGhost, btnSolid } from "./theme";
import { GROUPS } from "./groups";
import { fmtDate, fmtTime, gcalLink, money, timeGreeting } from "./format";
import { isConsult, GOOGLE_REVIEW_URL, DOC_META, DOC_USAGE, BRIEF_FIELDS } from "./constants";
import { PAYMENT_RULES, STAGES, CONSULT_STAGES, stagesFor, curStage } from "./stages";
import { EmptyState, Avatar, Row } from "./ui";
import { useIsMobile } from "./hooks";

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

function SummaryCell({ label, value, icon }) {
  return <div><div style={{ ...mono, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: FAINT, marginBottom: 3 }}>{label}</div><div style={{ fontSize: 14, color: INK, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>{icon}{value}</div></div>;
}

function StatusBadge({ stage, group, consult }) {
  const stArr = consult ? CONSULT_STAGES : STAGES;
  const st = stArr[Math.min(stage, stArr.length - 1)] || stArr[0], St = st.Icon, delivered = stage >= stArr.length - 1;
  const g = GROUPS[group] || GROUPS.video;
  const bg = delivered ? "#eaf7ef" : g.bg, bd = delivered ? "#bfe6cc" : g.border, tx = delivered ? OK : g.text, ic = delivered ? "#2e9e5b" : g.color;
  return <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 24, background: bg, border: `1px solid ${bd}` }}><St size={14} color={ic} /><span style={{ ...mono, fontSize: 11, letterSpacing: "0.06em", color: tx }}>{st.label}</span></div>;
}

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

function ClientActionPanel({ session, grp, draft, setDraft, onSubmit }) {
  const g = grp || GROUPS[session.serviceLine] || GROUPS.video;
  const stage = session.currentStage;
  const isVideo = session.serviceLine === "video";
  if (stage === 5) {
    const reviewLabel = isVideo ? "Review your cut" : "Preview your gallery";
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
      ...(session.deliveryVideo ? [{ label: "Final Film", url: session.deliveryVideo, note: isVideo ? "Watch & download your film" : "Video file", kind: "film" }] : []),
      ...(session.deliveryPhoto ? [{ label: "Full Gallery", url: session.deliveryPhoto, note: "View & download your photos", kind: "image" }] : []),
      ...(session.deliveryMusic ? [{ label: "Audio", url: session.deliveryMusic, note: "Listen & download your tracks", kind: "film" }] : []),
      ...(session.deliveryGov ? [{ label: "Deliverables", url: session.deliveryGov, note: "Access your deliverables", kind: "image" }] : []),
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

export function ClientView({ session, sessions, clientId, setClientId, addComment, onRescheduleRequest, markMessagesRead, patchSession, resizeImage, uploadMessageImage, showToast }) {
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
  const fileRef = useRef(null);
  useEffect(() => { if (!session) return; setReschedDate(session.date || ""); setReschedOpen(false); setMsg(""); setPendingImg(""); setBrief(session.brief || {}); setBriefMsg(""); }, [clientId]);
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
      {session.serviceLine === "photo" && <div style={{ textAlign: "center", margin: "8px auto 34px", maxWidth: 460 }}><img src="/dot1-photo-logo.png" alt="Dot One Photography" style={{ height: 62, width: "auto", display: "block", margin: "0 auto 14px" }} /><div style={{ ...display, fontStyle: "italic", fontSize: 18, color: GROUPS.photo.color, letterSpacing: "0.01em" }}>Timeless portraits</div><div style={{ ...mono, fontSize: 8.5, letterSpacing: "0.3em", textTransform: "uppercase", color: FAINT, marginTop: 9 }}>Every stage of life, every season of light</div></div>}
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
          <div style={{ ...display, fontSize: 16, color: DANGER, marginBottom: 3 }}>This booking was cancelled</div>
          <div style={{ fontSize: 13, color: BODY, lineHeight: 1.5 }}>If this wasn't expected, please reach out to us at contact@dot1.media and we'll help.</div>
        </div>
      )}
      {status === "closed" && (
        <div style={{ background: CREAM, border: `1px solid ${LINE}`, borderRadius: 10, padding: "14px 18px", marginBottom: 18 }}>
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

      {isMobile ? (
        <div style={{ ...card, padding: "18px 20px", marginBottom: 16 }}>
          <div style={{ marginBottom: 16 }}><StatusBadge stage={stage} group={session.serviceLine} consult={isConsult(session)} /></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, rowGap: 16 }}>
            <SummaryCell label="Project" value={session.type} icon={<grp.Icon size={13} color={grp.color} />} />
            <SummaryCell label="Service" value={grp.label} />
            <SummaryCell label="Date" value={session.date ? fmtDate(session.date) + (session.time ? " · " + fmtTime(session.time) : "") : "TBD"} />
            <SummaryCell label="Your creator" value={session.photographer} />
          </div>
        </div>
      ) : (
        <div style={{ ...card, padding: "20px 24px", marginBottom: 16, display: "flex", gap: 26, flexWrap: "wrap", alignItems: "center" }}>
          <SummaryCell label="Project" value={session.type} icon={<grp.Icon size={13} color={grp.color} />} />
          <SummaryCell label="Service" value={grp.label} />
          <SummaryCell label="Date" value={session.date ? fmtDate(session.date) + (session.time ? " · " + fmtTime(session.time) : "") : "TBD"} />
          <SummaryCell label="Your creator" value={session.photographer} />
          <div style={{ marginLeft: "auto" }}><StatusBadge stage={stage} group={session.serviceLine} consult={isConsult(session)} /></div>
        </div>
      )}

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
            <div style={{ marginTop: 13, display: "flex", alignItems: "center", gap: 8 }}><CheckCircle2 size={15} color="#2e9e5b" /><span style={{ ...mono, fontSize: 11.5, letterSpacing: "0.05em", color: OK }}>{"PAID IN FULL \u00b7 THANK YOU"}</span></div>
          ) : balanceDue > 0 ? (
            <>
              <button onClick={payBalance} disabled={payingBalance} style={{ ...btnSolid, background: grp.color, marginTop: 15, width: "100%", justifyContent: "center", opacity: payingBalance ? 0.7 : 1, cursor: payingBalance ? "default" : "pointer" }}>{payingBalance ? "Starting secure checkout\u2026" : "Pay balance securely \u00b7 " + money(balanceDue)}</button>
              {payErr && <div style={{ marginTop: 10, fontSize: 12.5, color: DANGER, display: "flex", alignItems: "center", gap: 7 }}><AlertTriangle size={14} /> {payErr}</div>}
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
                <div style={{ ...mono, fontSize: 10, color: c.status === "paid" ? OK : FAINT, marginTop: 3 }}>{c.status === "paid" ? ("Paid" + (c.cardLast4 ? " \u00b7 " + (c.cardBrand ? String(c.cardBrand).replace(/_/g, " ") : "Card") + " \u00b7\u00b7\u00b7\u00b7 " + c.cardLast4 : "")) : "Requested by Dot One Media"}</div>
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

      {status === "active" && (
        <div style={{ ...card, marginTop: 18, padding: 0, overflow: "hidden" }}>
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

      <div style={{ marginBottom: 26 }}>
        {!reschedOpen ? (
          <button onClick={() => setReschedOpen(true)} style={{ ...mono, fontSize: 10.5, letterSpacing: "0.06em", color: STONE, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 7, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}><CalendarClock size={13} /> Need to reschedule?</button>
        ) : (
          <div style={{ background: CREAM, border: `1px solid ${LINE}`, borderRadius: 9, padding: "14px 16px", maxWidth: 460 }}>
            <div style={{ ...mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: STONE, marginBottom: 8 }}>Request a new date</div>
            <div style={{ fontSize: 12.5, color: fee > 0 ? DANGER : OK, marginBottom: 10, lineHeight: 1.45 }}>{fee > 0 ? `A ${money(fee)} reschedule fee applies for video sessions.` : "Photography reschedules are free with reasonable notice."}</div>
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
          <div style={{ marginBottom: 12 }}><EmptyState icon={MessageSquare} title="No messages yet" text="Send a note below and we'll get right back to you." style={{ padding: "22px 14px" }} /></div>
        ) : session.comments.map((c, i) => {
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
          <button onClick={sendMsg} disabled={uploadingImg} style={{ ...btnSolid, background: grp.color, whiteSpace: "nowrap" }}><Send size={14} /> {uploadingImg ? "Uploading\u2026" : "Send"}</button>
        </div>
      </div>

      {lightbox ? (
        <div onClick={() => setLightbox("")} style={{ position: "fixed", inset: 0, background: "rgba(20,20,26,0.82)", zIndex: 90, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, cursor: "zoom-out" }}>
          <img src={lightbox} alt="Attached" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 8, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }} />
        </div>
      ) : null}

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
                  <span style={{ ...mono, fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase", color: OK, background: `color-mix(in srgb, ${OK} 15%, var(--d1-paper,#fff))`, border: "1px solid #bfe6cc", borderRadius: 20, padding: "4px 9px", flexShrink: 0 }}>Signed</span>
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

