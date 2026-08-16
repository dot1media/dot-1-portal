// Dot One Media portal - studio session management view (list + detail: stages, comments, delivery, payment) + private ServicePill.
import React, { useState, useEffect } from "react";
import { AlertTriangle, ArrowRight, Ban, CalendarClock, Check, ChevronDown, Download, FileText, Film, Image as ImageIcon, Landmark, Link2, MessageSquare, Music, PackageCheck, Pencil, Plus, RefreshCw, Send, Star, Trash2, UserPlus, Wallet, XCircle } from "lucide-react";
import { RED, INK, BODY, STONE, FAINT, LINE, PAPER, CREAM, OK, WARN, DANGER, display, mono, card, cardDense, inputStyle, btnGhost, btnSolid } from "./theme";
import { GROUPS, GROUP_KEYS } from "./groups";
import { fmtDate, fmtTime, money, sessionBucket } from "./format";
import { BRIEF_FIELDS } from "./constants";
import { stagesFor, curStage } from "./stages";
import { LinkRow, LinkField, MiniCalendar, EmptyState, Avatar } from "./ui";
import { useIsMobile } from "./hooks";

function ServicePill({ line }) {
  const g = GROUPS[line] || GROUPS.video;
  return <span style={{ ...mono, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", padding: "3px 9px", borderRadius: 20, background: g.color, color: "#fff", display: "inline-flex", alignItems: "center", gap: 5 }}><g.Icon size={11} /> {g.label}</span>;
}

export function AdminSessions({ state, adminId, setAdminId, requestSetStage, addComment, patchSession, onReschedule, slotTaken, markMessagesRead, onCancelBooking, onCloseBooking, onReopenBooking, onSendBalance, onSendCharge, onCheckPayment, onNewInternal, onEmailDelivery, onRequestReview, onSendInvite, onSetGroup, onDeleteBooking }) {
  const [chgLabel, setChgLabel] = useState("");
  const [collapsed, setCollapsed] = useState({ completed: true });
  const [editType, setEditType] = useState(false);
  const [chgAmt, setChgAmt] = useState("");
  useEffect(() => { setChgLabel(""); setChgAmt(""); }, [adminId]);
  const isMobile = useIsMobile();
  const session = state.sessions.find((s) => s.id === adminId) || state.sessions[0] || null;
  const [msg, setMsg] = useState("");
  const [editLinks, setEditLinks] = useState(false);
  const [videoLink, setVideoLink] = useState("");
  const [photoLink, setPhotoLink] = useState("");
  const [reviewLink, setReviewLink] = useState("");
  const [musicLink, setMusicLink] = useState("");
  const [govLink, setGovLink] = useState("");
  const [delivLabel, setDelivLabel] = useState("");
  const [delivUrl, setDelivUrl] = useState("");
  const [delivNote, setDelivNote] = useState("");
  const [reschedOpen, setReschedOpen] = useState(false);
  const [reschedDate, setReschedDate] = useState("");
  const [reschedTime, setReschedTime] = useState("");
  useEffect(() => { if (!session) return; setVideoLink(session.deliveryVideo || ""); setPhotoLink(session.deliveryPhoto || ""); setReviewLink(session.reviewLink || ""); setMusicLink(session.deliveryMusic || ""); setGovLink(session.deliveryGov || ""); setEditLinks(false); setEditType(false); setReschedOpen(false); setReschedDate(session.date || ""); setReschedTime(session.time || ""); }, [adminId]);
  if (!session) return <div style={{ ...card, marginTop: 4 }}><EmptyState icon={CalendarClock} title="No bookings yet" text="When a client books a session, it appears here automatically. Share your Direct Booking Link to bring in your first one." /></div>;
  const sg = GROUPS[session.serviceLine] || GROUPS.video;
  const status = session.status || "active";
  const saveLinks = () => {
    const linkPatch = { deliveryVideo: videoLink.trim(), deliveryPhoto: photoLink.trim(), deliveryMusic: musicLink.trim(), deliveryGov: govLink.trim(), reviewLink: reviewLink.trim() };
    const changed = [["deliveryPhoto", "gallery"], ["deliveryVideo", "video"], ["deliveryMusic", "music"], ["deliveryGov", "government"]].filter(([f]) => linkPatch[f] && linkPatch[f] !== (session[f] || "").trim()).map(([, k]) => k);
    patchSession(session.id, linkPatch);
    setEditLinks(false);
    if (changed.length) onEmailDelivery(session, changed, linkPatch);
  };
  const addDeliverable = () => { if (!delivLabel.trim() || !delivUrl.trim()) return; const item = { id: "d" + Date.now(), label: delivLabel.trim(), url: delivUrl.trim(), note: delivNote.trim() }; patchSession(session.id, { deliverables: [...(session.deliverables || []), item] }); setDelivLabel(""); setDelivUrl(""); setDelivNote(""); };
  const reschedClash = slotTaken(reschedDate, reschedTime, session.id);

  return (
    <div className="d1-stagger" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "260px 1fr", gap: isMobile ? 20 : 26 }}>
      <div>
        <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase", color: RED, marginBottom: 14 }}>Sessions</div>
        <button onClick={onNewInternal} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginBottom: 16, padding: "10px", borderRadius: 9, cursor: "pointer", border: `1px dashed ${LINE}`, background: CREAM, color: STONE, ...mono, fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase" }}><Plus size={13} /> New internal booking</button>
        <MiniCalendar sessions={state.sessions} onSelectSession={(id) => { setAdminId(id); markMessagesRead(id, "client"); }} />
        {(() => {
          const now = new Date();
          const todayStr = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
          const groups = { today: [], upcoming: [], completed: [] };
          for (const s of (state.sessions || [])) groups[sessionBucket(s, todayStr)].push(s);
          groups.today.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
          groups.upcoming.sort((a, b) => ((a.date || "") + (a.time || "")).localeCompare((b.date || "") + (b.time || "")));
          groups.completed.sort((a, b) => ((b.date || "") + (b.time || "")).localeCompare((a.date || "") + (a.time || "")));
          const renderBtn = (s) => { const selected = s.id === adminId; const grp = GROUPS[s.serviceLine] || GROUPS.video; const unread = s.comments.filter((c) => c.author === "client" && !c.read).length; return (
            <button key={s.id} className="d1-lift" onClick={() => { setAdminId(s.id); markMessagesRead(s.id, "client"); }} style={{ width: "100%", textAlign: "left", marginBottom: 8, padding: "12px 14px", borderRadius: 9, cursor: "pointer", border: `1px solid ${selected ? grp.color : LINE}`, background: selected ? grp.color : PAPER, color: selected ? "#fff" : BODY }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 3 }}>
                <span style={{ ...display, fontWeight: 600, fontSize: 15 }}>{s.clientName}</span>
                {unread > 0 && <span style={{ ...mono, background: selected ? "#fff" : RED, color: selected ? grp.color : "#fff", borderRadius: 20, fontSize: 9.5, minWidth: 16, height: 16, padding: "0 5px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{unread}</span>}
              </div>
              <div style={{ ...mono, fontSize: 10, letterSpacing: "0.06em", color: selected ? "rgba(255,255,255,0.85)" : STONE, display: "flex", alignItems: "center", gap: 6 }}><grp.Icon size={11} /> {s.internal ? "Internal · " : ""}{s.type} · {(s.status && s.status !== "active") ? (s.status === "cancelled" ? "Cancelled" : "Closed") : curStage(s).label}</div>
              {s.date && <div style={{ ...mono, fontSize: 9.5, letterSpacing: "0.04em", color: selected ? "rgba(255,255,255,0.72)" : FAINT, marginTop: 3 }}>{fmtDate(s.date)}{s.time ? " \u00b7 " + fmtTime(s.time) : ""}</div>}
            </button>
          ); };
          if (!(state.sessions || []).length) return null;
          const sections = [["today", "Today"], ["upcoming", "Upcoming"], ["completed", "Completed"]];
          return sections.map(([key, label]) => groups[key].length === 0 ? null : (
            <div key={key} style={{ marginBottom: 16 }}>
              <button onClick={() => setCollapsed((c) => ({ ...c, [key]: !c[key] }))} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: "transparent", border: "none", padding: 0, cursor: "pointer", marginBottom: 8 }}>
                <span style={{ ...mono, fontSize: 9.5, letterSpacing: "0.16em", textTransform: "uppercase", color: key === "today" ? RED : STONE }}>{label} <span style={{ color: FAINT }}>{"\u00b7 "}{groups[key].length}</span></span>
                <ChevronDown size={13} color={FAINT} style={{ transform: collapsed[key] ? "rotate(-90deg)" : "none", transition: "transform 180ms" }} />
              </button>
              {!collapsed[key] && groups[key].map(renderBtn)}
            </div>
          ));
        })()}
      </div>

      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4, flexWrap: "wrap" }}>
          <Avatar name={session.clientName} src={session.clientImage} size={40} />
          <h2 style={{ ...display, fontWeight: 700, fontSize: 26, color: INK, letterSpacing: "-0.01em" }}>{session.clientName}</h2>
          <div style={{ position: "relative" }}>
            <button onClick={() => setEditType((v) => !v)} title="Change the session type" style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}>
              <ServicePill line={session.serviceLine} />
              <ChevronDown size={12} color={STONE} style={{ transform: editType ? "rotate(180deg)" : "none", transition: "transform 160ms" }} />
            </button>
            {editType && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 30, background: PAPER, border: `1px solid ${LINE}`, borderRadius: 10, padding: 8, boxShadow: "0 10px 28px rgba(26,26,23,0.14)", display: "flex", flexWrap: "wrap", gap: 6, width: 208 }}>
                {GROUP_KEYS.map((k) => { const gg = GROUPS[k]; const active = session.serviceLine === k; return (
                  <button key={k} onClick={() => { onSetGroup(session, k); setEditType(false); }} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 10px", borderRadius: 7, cursor: "pointer", fontSize: 11.5, border: `1px solid ${active ? gg.color : LINE}`, background: active ? gg.color : PAPER, color: active ? "#fff" : STONE }}><gg.Icon size={11} /> {gg.label}</button>
                ); })}
              </div>
            )}
          </div>
        </div>
        <div style={{ ...mono, fontSize: 11, color: STONE, marginBottom: session.notifyEmail ? 4 : 18, letterSpacing: "0.04em" }}>{session.type} · {fmtDate(session.date) || "date TBD"}{session.time ? " at " + fmtTime(session.time) : ""} · {session.clientEmail}</div>
        {session.notifyEmail && <div style={{ ...mono, fontSize: 10, color: FAINT, marginBottom: 18, letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 6 }}><Send size={11} /> New-booking alert routed to {session.notifyEmail}</div>}
        {(session.paymentStatus === "paid" || session.paymentStatus === "pending") && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: session.paymentStatus === "paid" ? "#eef6ee" : "#fbf4e9", border: `1px solid ${session.paymentStatus === "paid" ? "#cfe6cf" : "#f0e2c4"}`, borderRadius: 8, padding: "7px 12px", marginBottom: 16 }}>
            <span style={{ ...mono, fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: session.paymentStatus === "paid" ? OK : WARN }}>{session.paymentStatus === "paid" ? "Paid" : "Payment pending"}{session.payAmount ? " · " + money(session.payAmount) : ""}</span>
          </div>
        )}
        {(() => {
          const balanceDue = (Number(session.total) || 0) - (Number(session.payAmount) || 0);
          if (session.paymentStatus !== "paid" || balanceDue <= 0) return null;
          if (session.balanceStatus === "paid") return <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: OK, marginBottom: 16 }}>Paid in full</div>;
          return (
            <div style={{ marginBottom: 16 }}>
              <button onClick={() => onSendBalance(session)} style={{ ...mono, fontSize: 10.5, letterSpacing: "0.06em", color: WARN, background: "transparent", border: "1px solid #f0e2c4", borderRadius: 7, padding: "8px 12px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7 }}><Wallet size={13} /> {session.balanceStatus === "sent" ? "Resend balance link" : "Email balance link"} · {money(balanceDue)}</button>
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
                      <span style={{ ...mono, fontSize: 9, letterSpacing: "0.06em", textTransform: "uppercase", color: c.status === "paid" ? OK : WARN }}>{c.status === "paid" ? "Paid" : "Pending"}</span>
                      {c.status !== "paid" && c.squareOrderId ? <button onClick={() => onCheckPayment && onCheckPayment(session, c)} title="Check Square and mark this paid if the client has already paid" style={{ ...mono, fontSize: 8.5, letterSpacing: "0.05em", textTransform: "uppercase", color: STONE, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 6, padding: "5px 8px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}><RefreshCw size={10} /> Check</button> : null}
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
            <button onClick={() => onCancelBooking(session)} style={{ ...mono, fontSize: 10.5, letterSpacing: "0.06em", color: DANGER, background: "transparent", border: "1px solid #f2cdc9", borderRadius: 7, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}><XCircle size={13} /> Cancel booking</button>
            <button onClick={() => onCloseBooking(session)} style={{ ...mono, fontSize: 10.5, letterSpacing: "0.06em", color: STONE, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 7, padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 7 }}><Ban size={13} /> Close (no-show / unpaid)</button>
          </div>
        ) : (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: status === "cancelled" ? "#fbeeed" : "#f3f1ec", border: `1px solid ${status === "cancelled" ? "#f2cdc9" : LINE}`, borderRadius: 8, padding: "8px 13px", marginBottom: 16 }}>
            <span style={{ ...mono, fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: status === "cancelled" ? DANGER : STONE }}>{status === "cancelled" ? "Booking cancelled" : "Booking closed"}</span>
            <button onClick={() => onReopenBooking(session)} style={{ ...mono, fontSize: 10, letterSpacing: "0.06em", color: STONE, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>Reopen</button>
            <button onClick={() => onDeleteBooking(session)} style={{ ...mono, fontSize: 10, letterSpacing: "0.06em", color: DANGER, background: "transparent", border: "1px solid #f2cdc9", borderRadius: 6, padding: "4px 10px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}><Trash2 size={11} /> Delete</button>
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
              {reschedClash && <div style={{ fontSize: 11.5, color: DANGER, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={12} /> That slot conflicts with another booking.</div>}
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
          <div style={{ ...mono, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 12, display: "flex", alignItems: "center", gap: 7 }}><FileText size={13} /> Production brief{session.brief && session.brief.submitted && <span style={{ ...mono, fontSize: 8.5, letterSpacing: "0.08em", color: OK, background: `color-mix(in srgb, ${OK} 15%, var(--d1-paper,#fff))`, border: "1px solid #bfe6cc", borderRadius: 20, padding: "3px 8px" }}>SUBMITTED</span>}</div>
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
                <button onClick={() => { setEditLinks(false); setVideoLink(session.deliveryVideo || ""); setPhotoLink(session.deliveryPhoto || ""); setReviewLink(session.reviewLink || ""); setMusicLink(session.deliveryMusic || ""); setGovLink(session.deliveryGov || ""); }} style={{ ...mono, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: STONE, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 6, padding: "6px 10px", cursor: "pointer" }}>Cancel</button>
              </div>
            )}
          </div>
          {(() => {
            const DELIVERY = [
              { key: "deliveryPhoto", kind: "gallery", line: "photo", label: "Photo gallery link", val: photoLink, set: setPhotoLink, color: GROUPS.photo.color, Icon: ImageIcon, btn: "Email gallery to client", ph: "https://gallery.dot1.media/…" },
              { key: "deliveryVideo", kind: "video", line: "video", label: "Final video link", val: videoLink, set: setVideoLink, color: GROUPS.video.color, Icon: Film, btn: "Email video link to client", ph: "https://…" },
              { key: "deliveryMusic", kind: "music", line: "music", label: "Audio / tracks link", val: musicLink, set: setMusicLink, color: GROUPS.music.color, Icon: Music, btn: "Email audio link to client", ph: "https://…" },
              { key: "deliveryGov", kind: "government", line: "government", label: "Deliverables link", val: govLink, set: setGovLink, color: GROUPS.government.color, Icon: Landmark, btn: "Email deliverables to client", ph: "https://…" },
            ];
            const shown = DELIVERY.filter((d) => d.line === session.serviceLine || (session[d.key] || "").trim());
            const withLink = shown.filter((d) => (session[d.key] || "").trim());
            return editLinks ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <LinkField label="Preview / review link" value={reviewLink} onChange={setReviewLink} placeholder="https://f.io/… or https://gallery…" />
                {shown.map((d) => <LinkField key={d.key} label={d.label} value={d.val} onChange={d.set} placeholder={d.ph} />)}
              </div>
            ) : (
              <>
                <div><LinkRow label="Preview / review" url={session.reviewLink} />{shown.map((d) => <LinkRow key={d.key} label={d.label} url={session[d.key]} />)}</div>
                {withLink.length ? (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                    {withLink.map((d) => <button key={d.key} onClick={() => onEmailDelivery(session, d.kind)} style={{ ...mono, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", color: "#fff", background: d.color, border: "none", borderRadius: 7, padding: "9px 13px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}><d.Icon size={13} /> {d.btn}</button>)}
                  </div>
                ) : null}
                <button onClick={() => onRequestReview(session)} title="Email the client a warm thank-you with your Google review link" style={{ ...mono, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", color: OK, background: "transparent", border: `1px solid ${OK}`, borderRadius: 7, padding: "9px 13px", cursor: "pointer", marginTop: 12, display: "inline-flex", alignItems: "center", gap: 6 }}><Star size={13} /> Request a Google review</button>
                <button onClick={() => onSendInvite(session)} title="Email the client an invite to create a portal account that includes this session and any future ones" style={{ ...mono, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", color: STONE, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 7, padding: "9px 13px", cursor: "pointer", marginTop: 12, marginLeft: 8, display: "inline-flex", alignItems: "center", gap: 6 }}><UserPlus size={13} /> Invite to portal</button>
              </>
            );
          })()}
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
                  <button onClick={() => patchSession(session.id, { deliverables: (session.deliverables || []).filter((_, j) => j !== i) })} style={{ ...mono, fontSize: 9.5, letterSpacing: "0.06em", textTransform: "uppercase", color: DANGER, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 6, padding: "5px 9px", cursor: "pointer", flexShrink: 0 }}>Remove</button>
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
        {session.comments.filter((c) => c.author === "client").length === 0 ? <div style={{ marginBottom: 20 }}><EmptyState icon={MessageSquare} title="No messages yet" text="Client messages and requests will show up here." style={{ padding: "24px 14px" }} /></div> : session.comments.filter((c) => c.author === "client").map((c, i) => (
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


