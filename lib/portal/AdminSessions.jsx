// Dot One Media portal - studio session management view (list + detail: stages, comments, delivery, payment) + private ServicePill.
import React, { useState, useEffect } from "react";
import { AlertTriangle, ArrowRight, Ban, CalendarClock, Check, ChevronDown, Download, FileText, Film, Image as ImageIcon, Landmark, Link2, MessageSquare, Music, PackageCheck, Pencil, Plus, RefreshCw, Send, Star, Trash2, UserPlus, Wallet, XCircle } from "lucide-react";
import { RED, INK, BODY, STONE, FAINT, LINE, PAPER, CREAM, OK, WARN, DANGER, display, mono, card, cardDense, inputStyle, btnGhost, btnSolid } from "./theme";
import { GROUPS, GROUP_KEYS } from "./groups";
import { fmtDate, fmtTime, money, sessionBucket } from "./format";
import { BRIEF_FIELDS } from "./constants";
import { GalleryUploader } from "./GalleryUploader";
import { ClientNotes } from "./ClientNotes";
import { SessionExpenses } from "./SessionExpenses";
import { InspirationBoard } from "./InspirationBoard";
import { PrintOrdersPanel } from "./PrintOrders";
import { VideoUploader } from "./VideoUploader";
import { VideoReview } from "./VideoReview";
import { stagesFor, curStage } from "./stages";
import { LinkRow, LinkField, MiniCalendar, EmptyState, Avatar } from "./ui";
import { useIsMobile } from "./hooks";

function ServicePill({ line }) {
  const g = GROUPS[line] || GROUPS.video;
  return <span style={{ ...mono, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", padding: "3px 9px", borderRadius: 20, background: g.color, color: "#fff", display: "inline-flex", alignItems: "center", gap: 5 }}><g.Icon size={11} /> {g.label}</span>;
}

// "Gear for this shoot": if the session's service type has a camera package attached (in the
// assets app), show the kit and a one-tap "Check out in Assets" button. Silent when there's no
// package, or when the portal→assets link isn't configured.
function GearCard({ session, services }) {
  const svc = (services || []).find((s) => s && s.name === session.type);
  const packageId = svc && svc.packageId != null ? svc.packageId : null;
  const [data, setData] = useState(null);
  useEffect(() => {
    if (packageId == null) { setData(null); return; }
    let live = true;
    fetch("/api/camera-packages/" + packageId).then((r) => r.json()).then((d) => { if (live) setData(d); }).catch(() => {});
    return () => { live = false; };
  }, [packageId]);
  if (packageId == null || !data || !data.configured || !data.package) return null;
  const pkg = data.package;
  const items = data.items || [];
  const types = String(pkg.session_types || "").split(",").map((t) => t.trim()).filter(Boolean);
  const label = [session.clientName || "", fmtDate(session.date) || ""].filter(Boolean).join(" · ");
  const href = "https://assets.dot1.media/?checkout=" + encodeURIComponent(pkg.id) + (label ? "&for=" + encodeURIComponent(label) : "");
  return (
    <div style={{ ...card, marginTop: 18, padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, display: "flex", alignItems: "center", gap: 8 }}><PackageCheck size={14} /> Gear for this shoot</div>
        <a href={href} target="_blank" rel="noopener noreferrer" style={{ ...mono, fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", textDecoration: "none", padding: "9px 14px", borderRadius: 9, background: INK, color: "#fff", display: "inline-flex", alignItems: "center", gap: 7 }}><ArrowRight size={13} /> Check out in Assets</a>
      </div>
      <div style={{ ...display, fontSize: 17, color: INK, marginTop: 10 }}>{pkg.name}</div>
      {types.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 7 }}>{types.map((t, i) => <span key={i} style={{ ...mono, fontSize: 9.5, letterSpacing: "0.04em", color: RED, background: CREAM, border: `1px solid ${LINE}`, borderRadius: 999, padding: "2px 9px" }}>{t}</span>)}</div>}
      {items.length > 0 ? (
        <div style={{ marginTop: 13, border: `1px solid ${LINE}`, borderRadius: 10, overflow: "hidden" }}>
          {items.map((it, idx) => {
            const short = it.in_stock != null && Number(it.in_stock) < Number(it.quantity);
            return (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderTop: idx ? `1px solid ${LINE}` : "none" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.name}</div>
                  {it.category ? <div style={{ ...mono, fontSize: 10, color: short ? DANGER : STONE }}>{it.category}{short ? ` · only ${it.in_stock} in stock` : ""}</div> : null}
                </div>
                <span style={{ ...mono, fontSize: 12, color: STONE, flexShrink: 0 }}>×{it.quantity}</span>
              </div>
            );
          })}
        </div>
      ) : <div style={{ ...mono, fontSize: 11.5, color: FAINT, marginTop: 10 }}>This kit has no gear in it yet — add items in the Assets app.</div>}
    </div>
  );
}

// Signed agreements for this booking's client. Agreements are recorded against the client's account
// (by email), so this shows every agreement that client has signed and lets the studio view or
// download each as the finished, signed PDF. Admin access is enforced server-side in /api/signed-doc.
const AGREEMENT_LABELS = { client_services: "Client Services Agreement", media_release: "Media Release & Waiver", minor_release: "Minor Release & Waiver" };
function SignedAgreements({ email, showToast }) {
  const [rows, setRows] = useState(null);
  const [dl, setDl] = useState("");
  useEffect(() => {
    const e = (email || "").trim().toLowerCase();
    if (!e) { setRows([]); return; }
    let live = true;
    fetch("/api/users?email=" + encodeURIComponent(e)).then((r) => r.json()).then((d) => { if (live) setRows(Array.isArray(d.agreements) ? d.agreements : []); }).catch(() => { if (live) setRows([]); });
    return () => { live = false; };
  }, [email]);
  if (rows === null) return null;

  const download = async (a) => {
    setDl(a.id);
    try {
      const res = await fetch("/api/signed-doc?id=" + encodeURIComponent(a.id));
      if (!res.ok) { showToast && showToast("Could not generate that document."); setDl(""); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a2 = document.createElement("a");
      a2.href = url;
      a2.download = (AGREEMENT_LABELS[a.agreement_type] || "Agreement").replace(/[^\w]+/g, "-") + "-signed.pdf";
      document.body.appendChild(a2); a2.click(); a2.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch (e) { showToast && showToast("Could not download that document."); }
    setDl("");
  };

  return (
    <div style={{ ...card, marginTop: 18, padding: "18px 20px" }}>
      <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, display: "flex", alignItems: "center", gap: 8, marginBottom: rows.length ? 12 : 0 }}><FileText size={14} /> Signed agreements</div>
      {rows.length === 0 ? (
        <div style={{ ...mono, fontSize: 11.5, color: FAINT, marginTop: 10 }}>This client hasn't signed any agreements yet.</div>
      ) : (
        <div style={{ border: `1px solid ${LINE}`, borderRadius: 10, overflow: "hidden" }}>
          {rows.map((a, idx) => {
            const canDoc = !!AGREEMENT_LABELS[a.agreement_type];
            return (
              <div key={a.id || idx} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 13px", borderTop: idx ? `1px solid ${LINE}` : "none" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, color: INK }}>{AGREEMENT_LABELS[a.agreement_type] || a.agreement_type}</div>
                  <div style={{ ...mono, fontSize: 10.5, color: STONE }}>Signed by {a.signed_name || "—"}{a.signed_at ? " · " + (fmtDate(a.signed_at) || "") : ""}{a.version ? " · v" + a.version : ""}</div>
                </div>
                {canDoc ? (
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <a href={"/api/signed-doc?id=" + encodeURIComponent(a.id)} target="_blank" rel="noopener noreferrer" style={{ ...mono, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", textDecoration: "none", color: STONE, border: `1px solid ${LINE}`, borderRadius: 6, padding: "6px 10px", display: "inline-flex", alignItems: "center", gap: 5 }}><FileText size={11} /> View</a>
                    <button onClick={() => download(a)} disabled={dl === a.id} style={{ ...mono, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", color: "#fff", background: INK, border: "none", borderRadius: 6, padding: "6px 10px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5, opacity: dl === a.id ? 0.6 : 1 }}><Download size={11} /> {dl === a.id ? "..." : "Download"}</button>
                  </div>
                ) : <span style={{ ...mono, fontSize: 10, color: FAINT, flexShrink: 0 }}>Recorded</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Create (or confirm) the client's portal account for this specific booking, so they can sign in and
// track this session. Prefilled from the booking. On first sign-in they're prompted to sign any
// unsigned agreements (handled by the login gate). Shows live account status.
function ClientAccountForSession({ session, onSendInvite, patchSession, showToast }) {
  const email = (session.clientEmail || "").trim().toLowerCase();
  const [status, setStatus] = useState(null); // {hasAccount, hasPassword, signedServices}
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [editEmail, setEditEmail] = useState(false);
  const [emailVal, setEmailVal] = useState("");

  const load = () => {
    if (!email) { setStatus({ hasAccount: false }); return; }
    fetch("/api/client-onboard-status?email=" + encodeURIComponent(email)).then((r) => r.json()).then((d) => setStatus(d || { hasAccount: false })).catch(() => setStatus({ hasAccount: false }));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [email]);
  if (!email || status === null) return null;

  const saveEmail = async () => {
    const ne = emailVal.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(ne)) { showToast && showToast("Enter a valid email address."); return; }
    if (ne === email) { setEditEmail(false); return; }
    setBusy(true);
    try {
      // If an account already exists under the current email, move the account + all its bookings so
      // nothing is orphaned. Otherwise just reassign this booking's email.
      if (status.hasAccount) {
        const res = await fetch("/api/client-account", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "change-email", email, newEmail: ne }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { showToast && showToast(data.error || "Could not change the email."); setBusy(false); return; }
      }
      if (patchSession) patchSession(session.id, { clientEmail: ne });
      showToast && showToast("Session email updated to " + ne + ".");
      setEditEmail(false); setEmailVal("");
    } catch (e) { showToast && showToast("Could not update the email."); }
    setBusy(false);
  };

  const create = async () => {
    if (pw && pw.length < 8) { showToast && showToast("Password must be at least 8 characters."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/client-account", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "create", name: (session.clientName || "").trim() || email, email, phone: (session.clientPhone || "").trim(), password: pw }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showToast && showToast(pw ? "Account created. Share the password; they'll be asked to sign the agreement on first sign-in." : "Account created. They can set a password from the sign-in page, then sign the agreement.");
        setOpen(false); setPw(""); load();
      } else showToast && showToast(data.error || "Could not create the account.");
    } catch (e) { showToast && showToast("Could not create the account."); }
    setBusy(false);
  };

  const active = status.hasAccount && status.hasPassword;
  return (
    <div style={{ ...card, marginTop: 18, padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, display: "flex", alignItems: "center", gap: 8 }}><UserPlus size={14} /> Client account</div>
        <div style={{ ...mono, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", color: status.hasAccount ? (active ? OK : WARN) : FAINT }}>
          {status.hasAccount ? (active ? (status.signedServices ? "Active · signed" : "Active · not signed") : "Invited · no password") : "No account yet"}
        </div>
      </div>

      {/* The email this session uses — also the email the account is created under. Editable. */}
      <div style={{ marginTop: 11, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {!editEmail ? (
          <>
            <span style={{ ...mono, fontSize: 12, color: INK }}>{email}</span>
            <button onClick={() => { setEmailVal(email); setEditEmail(true); }} style={{ ...mono, fontSize: 9.5, letterSpacing: "0.06em", textTransform: "uppercase", color: STONE, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 6, padding: "4px 9px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}><Pencil size={10} /> Change email</button>
          </>
        ) : (
          <div style={{ display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap", width: "100%" }}>
            <input type="email" value={emailVal} onChange={(e) => setEmailVal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveEmail(); }} placeholder="client@example.com" style={{ ...inputStyle, marginBottom: 0, flex: 1, minWidth: 200 }} />
            <button onClick={saveEmail} disabled={busy} style={{ ...btnSolid, background: INK, padding: "8px 12px", opacity: busy ? 0.6 : 1 }}><Check size={13} /> Save</button>
            <button onClick={() => { setEditEmail(false); setEmailVal(""); }} style={{ ...btnGhost, padding: "8px 12px" }}>Cancel</button>
          </div>
        )}
      </div>
      {editEmail && <div style={{ ...mono, fontSize: 9.5, color: FAINT, marginTop: 6, lineHeight: 1.45 }}>{status.hasAccount ? "This client already has an account — changing the email moves the account and all their bookings to the new address." : "Reassigns this booking to the new email. The account will be created under it."}</div>}

      {!status.hasAccount ? (
        <>
          <div style={{ fontSize: 12.5, color: BODY, lineHeight: 1.55, marginTop: 10 }}>{session.clientName ? session.clientName + " (" : ""}{email}{session.clientName ? ")" : ""} doesn't have a portal account yet. Create one so they can sign in and track this session. They'll be asked to sign the agreement the first time they sign in.</div>
          {!open ? (
            <div style={{ display: "flex", gap: 8, marginTop: 13, flexWrap: "wrap" }}>
              <button onClick={() => setOpen(true)} style={{ ...btnSolid, background: INK }}><UserPlus size={14} /> Create account</button>
              {onSendInvite && <button onClick={() => onSendInvite(session)} style={{ ...btnGhost }}><Send size={13} /> Send portal invite</button>}
            </div>
          ) : (
            <div style={{ marginTop: 13, border: `1px solid ${LINE}`, borderRadius: 10, padding: 14, background: PAPER }}>
              <div style={{ ...mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: STONE, marginBottom: 8 }}>Temp password (optional)</div>
              <input type="text" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Leave blank to let them set their own" style={{ ...inputStyle, marginBottom: 0 }} />
              <div style={{ ...mono, fontSize: 9.5, color: FAINT, marginTop: 6, lineHeight: 1.45 }}>Blank → they set a password from the sign-in page. With a temp password, share it and have them change it after signing in.</div>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button onClick={create} disabled={busy} style={{ ...btnSolid, background: RED, opacity: busy ? 0.6 : 1 }}><UserPlus size={14} /> {busy ? "Creating…" : "Create account"}</button>
                <button onClick={() => { setOpen(false); setPw(""); }} style={{ ...btnGhost }}>Cancel</button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ fontSize: 12.5, color: BODY, lineHeight: 1.55, marginTop: 10 }}>
          {active
            ? (status.signedServices ? "They have an account and have signed the agreement. They can sign in to track this session." : "They have an account but haven't signed the agreement yet — they'll be prompted to sign the next time they sign in.")
            : "An account exists but no password is set. They can set one from the sign-in page (or use \"Send portal invite\"), then they'll be asked to sign the agreement."}
          {!active && onSendInvite && <div style={{ marginTop: 11 }}><button onClick={() => onSendInvite(session)} style={{ ...btnGhost }}><Send size={13} /> Send portal invite</button></div>}
        </div>
      )}
    </div>
  );
}

export function AdminSessions({ state, adminId, setAdminId, requestSetStage, addComment, uploadMessageImage, patchSession, onReschedule, slotTaken, markMessagesRead, onCancelBooking, onCloseBooking, onReopenBooking, onSendBalance, onSendCharge, onCheckPayment, onNewInternal, onNewInvoice, onEmailDelivery, onRequestReview, onSendInvite, onSetGroup, onDeleteBooking, showToast }) {
  const [chgLabel, setChgLabel] = useState("");
  const [collapsed, setCollapsed] = useState({ completed: true });
  const [editType, setEditType] = useState(false);
  const [chgAmt, setChgAmt] = useState("");
  useEffect(() => { setChgLabel(""); setChgAmt(""); }, [adminId]);
  const isMobile = useIsMobile();
  const session = state.sessions.find((s) => s.id === adminId) || state.sessions[0] || null;
  const [msg, setMsg] = useState("");
  const [pendingImg, setPendingImg] = useState("");
  const [uploadingImg, setUploadingImg] = useState(false);
  const [lightbox, setLightbox] = useState("");
  const onPickMsgImage = async (e, sessionId) => {
    const file = e.target.files && e.target.files[0]; e.target.value = "";
    if (!file) return;
    setUploadingImg(true);
    try { const url = await uploadMessageImage(file, sessionId); setPendingImg(url); }
    catch (err) { showToast((err && err.message) || "Could not attach that image."); }
    setUploadingImg(false);
  };
  const sendStudioMsg = (sessionId) => {
    if (!msg.trim() && !pendingImg) return;
    addComment(sessionId, "studio", msg, false, pendingImg || undefined);
    setMsg(""); setPendingImg("");
  };
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
    <div className="d1-stagger" style={{ maxWidth: 760 }}>
      <div>
        <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.2em", textTransform: "uppercase", color: RED, marginBottom: 14 }}>Sessions</div>
        <button onClick={onNewInternal} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginBottom: 16, padding: "10px", borderRadius: 9, cursor: "pointer", border: `1px dashed ${LINE}`, background: CREAM, color: STONE, ...mono, fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase" }}><Plus size={13} /> New internal booking</button>
        <button onClick={onNewInvoice} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginBottom: 16, padding: "10px", borderRadius: 9, cursor: "pointer", border: `1px dashed ${RED}`, background: "#fdf3f0", color: RED, ...mono, fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase" }}><FileText size={13} /> New invoice</button>
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
              {s.date && <div style={{ ...mono, fontSize: 9.5, letterSpacing: "0.04em", color: selected ? "rgba(255,255,255,0.72)" : FAINT, marginTop: 3 }}>{fmtDate(s.date)}{s.time ? " · " + fmtTime(s.time) : ""}</div>}
            </button>
          ); };
          if (!(state.sessions || []).length) return null;
          const sections = [["today", "Today"], ["upcoming", "Upcoming"], ["completed", "Completed"]];
          return sections.map(([key, label]) => groups[key].length === 0 ? null : (
            <div key={key} style={{ marginBottom: 16 }}>
              <button onClick={() => setCollapsed((c) => ({ ...c, [key]: !c[key] }))} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, background: "transparent", border: "none", padding: 0, cursor: "pointer", marginBottom: 8 }}>
                <span style={{ ...mono, fontSize: 9.5, letterSpacing: "0.16em", textTransform: "uppercase", color: key === "today" ? RED : STONE }}>{label} <span style={{ color: FAINT }}>{"· "}{groups[key].length}</span></span>
                <ChevronDown size={13} color={FAINT} style={{ transform: collapsed[key] ? "rotate(-90deg)" : "none", transition: "transform 180ms" }} />
              </button>
              {!collapsed[key] && groups[key].map(renderBtn)}
            </div>
          ));
        })()}
      </div>

      {adminId && session ? (
      <div className="d1-overlay" style={{ position: "fixed", inset: 0, background: "rgba(20,20,26,0.55)", zIndex: 60, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "38px 16px", overflowY: "auto" }} onClick={() => setAdminId("")}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: PAPER, borderRadius: 14, border: `1px solid ${LINE}`, width: "100%", maxWidth: 720, padding: "30px 30px 34px", position: "relative", boxShadow: "0 30px 80px rgba(20,18,16,0.28)" }}>
        <button onClick={() => setAdminId("")} title="Close" aria-label="Close" style={{ position: "absolute", top: 14, right: 14, background: CREAM, border: `1px solid ${LINE}`, borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", color: STONE, zIndex: 3 }}><XCircle size={16} /></button>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4, flexWrap: "wrap", paddingRight: 40 }}>
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
        {session.notifyEmail && <div style={{ ...mono, fontSize: 10, color: FAINT, marginBottom: 10, letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 6 }}><Send size={11} /> New-booking alert routed to {session.notifyEmail}</div>}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
          <span style={{ ...mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: STONE, display: "inline-flex", alignItems: "center", gap: 6 }}><Send size={11} /> Client emails</span>
          <div style={{ display: "inline-flex", border: `1px solid ${LINE}`, borderRadius: 8, overflow: "hidden" }}>
            {[{ k: "default", v: null, label: "Default" }, { k: "on", v: true, label: "On" }, { k: "off", v: false, label: "Off" }].map(({ k, v, label }, i) => {
              const cur = session.clientEmails === true ? "on" : session.clientEmails === false ? "off" : "default";
              const active = cur === k;
              const col = k === "off" ? DANGER : k === "on" ? OK : INK;
              return <button key={k} onClick={() => patchSession(session.id, { clientEmails: v })} style={{ ...mono, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", padding: "6px 12px", cursor: "pointer", border: "none", borderLeft: i === 0 ? "none" : `1px solid ${LINE}`, background: active ? col : PAPER, color: active ? "#fff" : STONE }}>{label}</button>;
            })}
          </div>
          <span style={{ ...mono, fontSize: 9.5, color: FAINT }}>{session.clientEmails === true ? "On for this session, even before cutover" : session.clientEmails === false ? "Off for this session" : "Follows the global cutover switch"}</span>
        </div>
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
                      <div style={{ ...mono, fontSize: 9.5, color: FAINT }}>{c.status === "paid" ? ("Paid" + (c.cardLast4 ? " · " + (c.cardBrand ? String(c.cardBrand).replace(/_/g, " ") : "Card") + " ···· " + c.cardLast4 : "")) : "Awaiting payment"}</div>
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
                <input value={chgLabel} onChange={(e) => setChgLabel(e.target.value)} placeholder={"What's it for? (USB of files, overtime…)"} style={{ flex: "1 1 200px", minWidth: 0, border: `1px solid ${LINE}`, borderRadius: 7, padding: "9px 11px", fontSize: 13, color: INK, background: PAPER, fontFamily: "inherit" }} />
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
        <div style={{ ...mono, fontSize: 9.5, color: FAINT, marginBottom: 26, letterSpacing: "0.04em" }}>You'll be asked to confirm, and can choose whether to email the client.</div>

        <div style={{ ...cardDense, padding: "16px 18px", marginBottom: 22 }}>
          {Array.isArray(session.shotList) && session.shotList.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ ...mono, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 8 }}>Client shot list <span style={{ color: FAINT }}>· {session.shotList.filter((x) => x.done).length}/{session.shotList.length} done</span></div>
              {session.shotList.map((sh) => (
                <button key={sh.id} onClick={() => patchSession(session.id, { shotList: session.shotList.map((x) => x.id === sh.id ? { ...x, done: !x.done } : x) })} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", background: "none", border: "none", cursor: "pointer", padding: "6px 0", textAlign: "left" }}>
                  <span style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${sh.done ? OK : LINE}`, background: sh.done ? OK : "transparent", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: INK, textDecoration: sh.done ? "line-through" : "none", opacity: sh.done ? 0.6 : 1 }}>{sh.text}</span>
                </button>
              ))}
            </div>
          )}
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

        <GearCard session={session} services={state.services} />
        <ClientAccountForSession session={session} onSendInvite={onSendInvite} patchSession={patchSession} showToast={showToast} />
        <SignedAgreements email={session.clientEmail} showToast={showToast} />
        <ClientNotes email={session.clientEmail} showToast={showToast} />
        <SessionExpenses sessionId={session.id} revenue={Number(session.total) || 0} />
        <InspirationBoard sessionId={session.id} compact />
        <PrintOrdersPanel sessionId={session.id} showToast={showToast} />
        <GalleryUploader sessionId={session.id} />
        <VideoUploader sessionId={session.id} />
        <VideoReview sessionId={session.id} isStudio />

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
                    <div style={{ ...mono, fontSize: 9.5, color: STONE, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.note ? d.note + " · " : ""}{d.url}</div>
                  </div>
                  <button onClick={() => patchSession(session.id, { deliverables: (session.deliverables || []).filter((_, j) => j !== i) })} style={{ ...mono, fontSize: 9.5, letterSpacing: "0.06em", textTransform: "uppercase", color: DANGER, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 6, padding: "5px 9px", cursor: "pointer", flexShrink: 0 }}>Remove</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input value={delivLabel} onChange={(e) => setDelivLabel(e.target.value)} placeholder={"Label (e.g. Social Cut · 1080×1920)"} style={{ border: `1px solid ${LINE}`, borderRadius: 7, padding: "9px 11px", fontSize: 12.5, fontFamily: "inherit", background: PAPER, color: BODY, boxSizing: "border-box" }} />
            <input value={delivUrl} onChange={(e) => setDelivUrl(e.target.value)} placeholder="Download URL" style={{ border: `1px solid ${LINE}`, borderRadius: 7, padding: "9px 11px", fontSize: 12.5, fontFamily: "inherit", background: PAPER, color: BODY, boxSizing: "border-box" }} />
            <input value={delivNote} onChange={(e) => setDelivNote(e.target.value)} placeholder={"Note (optional, e.g. ProRes 422 · 18.7 GB)"} style={{ border: `1px solid ${LINE}`, borderRadius: 7, padding: "9px 11px", fontSize: 12.5, fontFamily: "inherit", background: PAPER, color: BODY, boxSizing: "border-box" }} />
            <button onClick={addDeliverable} disabled={!delivLabel.trim() || !delivUrl.trim()} style={{ ...mono, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#fff", background: (delivLabel.trim() && delivUrl.trim()) ? sg.color : FAINT, border: "none", borderRadius: 7, padding: "9px 13px", cursor: (delivLabel.trim() && delivUrl.trim()) ? "pointer" : "default", alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 6 }}><Plus size={12} /> Add deliverable</button>
          </div>
        </div>

        <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", color: STONE, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}><MessageSquare size={13} /> Client messages & requests</div>
        {session.comments.length === 0 ? <div style={{ marginBottom: 20 }}><EmptyState icon={MessageSquare} title="No messages yet" text="Client messages and your replies will show up here." style={{ padding: "24px 14px" }} /></div> : session.comments.map((c, i) => {
          const studio = c.author === "studio";
          return (
          <div key={i} style={{ background: studio ? CREAM : sg.bg, border: `1px solid ${studio ? LINE : sg.border}`, borderRadius: 8, padding: "10px 13px", marginBottom: 8, marginLeft: studio ? 24 : 0 }}>
            {c.body ? <div style={{ fontSize: 13.5, lineHeight: 1.5, color: BODY }}>{c.body}</div> : null}
            {c.image ? <img src={c.image} alt="Attached" onClick={() => setLightbox(c.image)} style={{ marginTop: c.body ? 8 : 0, maxWidth: "100%", width: 220, borderRadius: 8, border: `1px solid ${LINE}`, cursor: "zoom-in", display: "block" }} /> : null}
            <div style={{ ...mono, fontSize: 9.5, color: studio ? FAINT : sg.text, marginTop: 3, letterSpacing: "0.06em" }}>{studio ? "You (studio)" : session.clientName} · {c.time}</div>
          </div>
          );
        })}
        {pendingImg ? (
          <div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 10, background: PAPER, border: `1px solid ${LINE}`, borderRadius: 8, padding: "8px 10px" }}>
            <img src={pendingImg} alt="To send" style={{ width: 42, height: 42, objectFit: "cover", borderRadius: 6 }} />
            <span style={{ ...mono, fontSize: 10.5, color: STONE }}>Image ready to send</span>
            <button onClick={() => setPendingImg("")} aria-label="Remove image" style={{ background: "transparent", border: "none", cursor: "pointer", color: STONE, display: "flex" }}><XCircle size={15} /></button>
          </div>
        ) : null}
        <div style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "flex-start" }}>
          <input value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") sendStudioMsg(session.id); }} placeholder="Send a note to the client…" style={{ flex: 1, border: `1px solid ${LINE}`, borderRadius: 8, padding: "10px 12px", fontSize: 13.5, fontFamily: "inherit", background: PAPER, color: BODY }} />
          <label title="Attach an image" style={{ ...btnSolid, background: PAPER, color: STONE, border: `1px solid ${LINE}`, cursor: uploadingImg ? "default" : "pointer", whiteSpace: "nowrap" }}>
            <ImageIcon size={15} />
            <input type="file" accept="image/*" disabled={uploadingImg} onChange={(e) => onPickMsgImage(e, session.id)} style={{ display: "none" }} />
          </label>
          <button onClick={() => sendStudioMsg(session.id)} disabled={uploadingImg} style={{ ...btnSolid, background: INK, whiteSpace: "nowrap" }}><Send size={14} /> {uploadingImg ? "Uploading…" : "Send"}</button>
        </div>
      </div>
      </div>
      ) : null}
      {lightbox ? (
        <div onClick={() => setLightbox("")} style={{ position: "fixed", inset: 0, background: "rgba(20,20,26,0.82)", zIndex: 90, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, cursor: "zoom-out" }}>
          <img src={lightbox} alt="Attached" style={{ maxWidth: "100%", maxHeight: "100%", borderRadius: 8, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }} />
        </div>
      ) : null}
    </div>
  );
}


