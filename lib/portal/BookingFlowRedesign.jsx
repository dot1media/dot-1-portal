// Dot One Media portal - REDESIGNED client booking + payment flow. Identical logic, handlers,
// money math and API calls to the classic BookingFlow (holds, waitlist, agreements, minor
// release, usage options, payment). Restructured as one calm focus per step with a bold
// progress stepper and a sticky running-total action bar. Service line supplies the accent;
// the photo line gets a lighter, more refined treatment. MONEY MATH KEPT INLINE VERBATIM.
import React, { useState, useEffect, useRef } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, CalendarClock, Check, ChevronDown, Sparkles, X } from "lucide-react";
import { RED, INK, BODY, STONE, FAINT, LINE, PAPER, CREAM, DANGER, display, mono, card, inputStyle, btnGhost, btnSolid } from "./theme";
import { GROUPS, GROUP_KEYS } from "./groups";
import { fmtDate, fmtTime, money } from "./format";
import { PHOTO_CATEGORIES, CLIENT_SERVICES_VERSION, RELEASE_VERSION, PDF_CLIENT_SERVICES, PDF_RELEASE, PDF_MINOR, clientServicesSummary, RELEASE_SUMMARY, MINOR_SUMMARY } from "./constants";
import { PAYMENT_RULES, STAGES } from "./stages";
import { bookingTotal, optionAmount } from "./pricing";
import { FieldLabel, TextInput, EmptyState, Skeleton, Row, PasswordMeter } from "./ui";
import { USAGE_OPTIONS, AgreementBox, BookingCalendar } from "./BookingFlow";

export function BookingFlowRedesign({ state, direct, slotTaken, onCancel, onComplete, onLogin, catalogLoaded, catalogError, availability, authedClient, refreshSlots, onGroupChange, preService }) {
  const [step, setStep] = useState(direct ? 3 : preService ? 1 : 0); // 0 welcome, 1 choose, 2 date, 3 account, 4 confirm
  const [group, setGroup] = useState(preService?.group || direct?.group || "video");
  const [serviceId, setServiceId] = useState(preService?.id || direct?.serviceId || null);
  const [wlOpen, setWlOpen] = useState(false);
  const [wl, setWl] = useState({ date: "", name: "", email: "" });
  const [wlDone, setWlDone] = useState("");
  async function joinWaitlist() {
    const svc = (state.services || []).find((x) => String(x.id) === String(serviceId));
    const email = (wl.email || acct.email || "").trim(), name = (wl.name || acct.name || "").trim();
    if (!wl.date || !email) { setWlDone("Please add the date and your email."); return; }
    try { const r = await fetch("/api/waitlist", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ date: wl.date, email, name, serviceId, serviceName: svc ? svc.name : "" }) }).then((x) => x.json()); setWlDone(r.ok ? "You're on the list. We'll email you the moment that day opens." : (r.error || "Could not join the waitlist.")); } catch (e) { setWlDone("Network error. Please try again."); }
  }
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
  const [wantAccount, setWantAccount] = useState(true);
  const inviteAccount = direct ? (direct.inviteAccount !== false) : wantAccount;
  const submitAccount = async () => {
    setSubmitErr("");
    if (!authedClient) {
      if (!acct.name.trim() || !acct.email.trim()) { setSubmitErr("Please enter your name and email."); return; }
      if (inviteAccount && (!acct.password || acct.password.length < 8)) { setSubmitErr("Create a password of at least 8 characters."); return; }
    }
    if (isMinor && (!child.name.trim() || !child.age.trim() || !child.relationship.trim())) { setSubmitErr("Please add the child's name, age, and your relationship to the child."); return; }
    if (!agree || !acct.signature.trim()) { setSubmitErr("Type your full legal name and check the box to sign."); return; }
    setSubmitting(true);
    try {
      if (!authedClient && inviteAccount) {
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
      setStep(4);
    } catch (e) {
      setSubmitErr((e && e.message) || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const groupServices = preService ? state.services.filter((s) => String(s.id) === String(preService.id)) : state.services.filter((s) => s.group === group && s.visible !== false);
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
  useEffect(() => { if (step === 2 && refreshSlots) refreshSlots(); }, [step]);
  const total = bookingTotal(basePrice, chosenAddons);
  const rules = PAYMENT_RULES[group];
  const A = GROUPS[group].color, AB = GROUPS[group].bg, ABD = GROUPS[group].border, AT = GROUPS[group].text;
  const photo = group === "photo";
  useEffect(() => { if (onGroupChange) onGroupChange(group); }, [group]);
  useEffect(() => { if (preService && String(serviceId) !== String(preService.id)) { setGroup(preService.group); setServiceId(preService.id); if (step === 0) setStep(1); } }, [preService]);
  const taken = !direct && slotTaken(date, time);

  const stepLabel2 = authedClient ? "Sign release" : "Account";
  const stepDefs = direct ? [{ n: 3, label: stepLabel2 }, { n: 4, label: "Review & pay" }] : [{ n: 1, label: "Choose" }, { n: 2, label: "Date" }, { n: 3, label: stepLabel2 }, { n: 4, label: "Review & pay" }];

  const isAllWindow = (a) => !Array.isArray(a.serviceIds) || a.serviceIds.length === 0;
  const specificAvail = serviceId ? (availability || []).filter((a) => Array.isArray(a.serviceIds) && a.serviceIds.map(String).includes(String(serviceId))) : [];
  const useAvail = specificAvail.length > 0 ? specificAvail : (availability || []).filter(isAllWindow);
  const availDates = Array.from(new Set(useAvail.map((a) => a.date)));
  const slotsForDate = (d) => {
    const wins = useAvail.filter((a) => a.date === d);
    const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
    const fromMin = (mm) => String(Math.floor(mm / 60)).padStart(2, "0") + ":" + String(mm % 60).padStart(2, "0");
    const blocked = (state.takenSlots || []).filter((b) => b.date === d).map((b) => { const bs = toMin(b.time); return [bs - (Number(b.padBefore) || 0), bs + (Number(b.apptMin) || 30) + (Number(b.padAfter) || 0)]; }).concat((state.directLinks || []).filter((l) => l.date === d).map((l) => { const ls = toMin(l.time); return [ls, ls + apptLen]; }));
    const out = [];
    wins.forEach((w) => { const ws = toMin(w.start), we = toMin(w.end); for (let T = ws; T + apptLen <= we; T += 15) { const occStart = T - padB, occEnd = T + apptLen + padA; if (!blocked.some((iv) => occStart < iv[1] && occEnd > iv[0])) out.push(fromMin(T)); } });
    return Array.from(new Set(out)).sort();
  };

  /* ---------- WELCOME (step 0) ---------- */
  if (step === 0) {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{ ...mono, fontSize: 10.5, color: STONE, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><X size={13} /> Close</button>
        </div>
        <div style={{ textAlign: "center", padding: "6px 0 2px" }}>
          <div style={{ ...mono, fontSize: 11, letterSpacing: "0.24em", textTransform: "uppercase", color: RED, marginBottom: 16 }}>Dot One Media</div>
          <h1 style={{ ...display, fontWeight: 700, fontSize: 42, color: INK, lineHeight: 1.03, letterSpacing: "-0.02em", marginBottom: 16 }}>Let's create<br />something worth keeping.</h1>
          <p style={{ fontSize: 15, color: BODY, lineHeight: 1.6, maxWidth: 480, margin: "0 auto" }}>
            Booking takes a couple of minutes. Choose your session, set up your account, and from that moment you can follow your project every step of the way, right through to final delivery.
          </p>
        </div>

        <div style={{ ...card, padding: "22px 24px", margin: "26px 0" }}>
          <div style={{ ...mono, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 18, textAlign: "center" }}>What to expect after you book</div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 6, flexWrap: "wrap" }}>
            {STAGES.map((st, i) => { const St = st.Icon; return (
              <div key={st.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7, flex: "1 1 12%", minWidth: 74 }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: i === 0 ? RED : CREAM, border: `1.5px solid ${i === 0 ? RED : LINE}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <St size={18} color={i === 0 ? "#fff" : STONE} />
                </div>
                <span style={{ ...mono, fontSize: 8.5, letterSpacing: "0.03em", textAlign: "center", color: STONE, lineHeight: 1.3 }}>{st.label}</span>
              </div>
            ); })}
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <button onClick={() => setStep(1)} style={{ ...btnSolid, background: RED, fontSize: 13.5, padding: "15px 30px", margin: "0 auto", display: "inline-flex", borderRadius: 12 }}><Sparkles size={16} /> Book your session</button>
          <div style={{ marginTop: 15, fontSize: 13, color: STONE }}>Already a client? <span onClick={onLogin} style={{ color: RED, cursor: "pointer" }}>Log in to see your status</span></div>
        </div>
      </div>
    );
  }

  /* ---------- service card (choose step) ---------- */
  const renderServiceCard = (s) => {
    const sel = serviceId === s.id; const dOpen = !!openDesc[s.id];
    return (
      <div key={s.id} role="button" tabIndex={0} onClick={() => { setServiceId(s.id); setAddonIds([]); }} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setServiceId(s.id); setAddonIds([]); } }}
        style={{ width: "100%", textAlign: "left", marginBottom: 12, padding: "16px 18px", borderRadius: 16, cursor: "pointer", border: `1.5px solid ${sel ? A : LINE}`, background: PAPER, boxShadow: sel ? `0 0 0 3px ${A}1e` : "0 1px 2px rgba(26,26,23,0.03)", transition: "border-color .25s, box-shadow .25s, transform .25s" }}>
        {s.image && <img src={s.image} alt="" style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 11, marginBottom: 13, display: "block" }} />}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ width: 20, height: 20, borderRadius: "50%", border: `1.5px solid ${sel ? A : LINE}`, flexShrink: 0, display: "grid", placeItems: "center" }}>{sel && <span style={{ width: 10, height: 10, borderRadius: "50%", background: A }} />}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ ...display, fontWeight: 600, fontSize: 17.5, color: INK }}>{s.name}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <span style={{ ...mono, fontSize: 14.5, color: A, fontWeight: 500 }}>{s.price ? money(s.price) : "Quote"}</span>
            {s.description && <button onClick={(e) => { e.stopPropagation(); setOpenDesc((o) => ({ ...o, [s.id]: !o[s.id] })); }} aria-label={dOpen ? "Hide details" : "Show details"} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 7, cursor: "pointer", color: STONE, background: dOpen ? LINE : "transparent", border: "none", padding: 0 }}><ChevronDown size={16} style={{ transform: dOpen ? "rotate(180deg)" : "none", transition: "transform 200ms" }} /></button>}
          </div>
        </div>
        {s.description && dOpen && <div style={{ fontSize: 12.5, color: BODY, lineHeight: 1.55, marginTop: 11, paddingLeft: 34 }}>{s.description}</div>}
      </div>
    );
  };
  const renderServiceHero = (s) => (
    <div key={s.id} style={{ marginBottom: 4 }}>
      {s.image && <img src={s.image} alt={s.name} style={{ width: "100%", maxHeight: 320, objectFit: "cover", borderRadius: 14, marginBottom: 16, display: "block" }} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12, marginBottom: s.description ? 10 : 0 }}>
        <span style={{ ...display, fontWeight: 700, fontSize: 26, color: INK, lineHeight: 1.12 }}>{s.name}</span>
        <span style={{ ...mono, fontSize: 16, color: A, fontWeight: 500, flexShrink: 0 }}>{s.price ? money(s.price) : "Quote"}</span>
      </div>
      {s.description && <div style={{ fontSize: 14, color: BODY, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{s.description}</div>}
    </div>
  );

  /* ---------- progress stepper ---------- */
  const Stepper = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 28 }}>
      {stepDefs.map((sd, i) => { const active = step === sd.n, done = step > sd.n; return (
        <React.Fragment key={sd.n}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, flex: "0 0 auto" }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", display: "grid", placeItems: "center", background: done || active ? INK : PAPER, border: `1.5px solid ${done || active ? INK : LINE}`, color: done || active ? "#fff" : FAINT, ...mono, fontSize: 11 }}>{done ? <Check size={13} /> : i + 1}</div>
            <span style={{ ...mono, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: active ? INK : FAINT }}>{sd.label}</span>
          </div>
          {i < stepDefs.length - 1 && <div style={{ flex: 1, height: 1.5, background: done ? INK : LINE, margin: "0 10px", borderRadius: 2, minWidth: 14 }} />}
        </React.Fragment>
      ); })}
    </div>
  );

  /* ---------- sticky action bar ---------- */
  const ActionBar = ({ left, right, showTotal }) => (
    <div style={{ position: "sticky", bottom: 0, zIndex: 5, background: "linear-gradient(to top, var(--d1-paper,#fff) 68%, rgba(255,255,255,0))", padding: "16px 0 6px", marginTop: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {left}
        {showTotal && service && basePrice > 0 && (
          <div>
            <div style={{ ...mono, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: FAINT }}>Estimated total</div>
            <div style={{ ...display, fontWeight: 700, fontSize: 23, color: INK, lineHeight: 1 }}>{money(total)}</div>
          </div>
        )}
      </div>
      {right}
    </div>
  );

  const lead = { ...display, fontWeight: 700, fontSize: 28, color: INK, lineHeight: 1.1, letterSpacing: "-0.015em", margin: "0 0 6px" };
  const subLead = { fontSize: 14.5, color: STONE, margin: "0 0 22px", lineHeight: 1.5 };

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <span style={{ ...mono, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: A }}>{direct ? "Complete your booking" : "Book a session"}</span>
        <button onClick={onCancel} style={{ ...mono, fontSize: 10.5, color: STONE, background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}><X size={13} /> Close</button>
      </div>

      <Stepper />

      {direct && (
        <div style={{ background: AB, border: `1px solid ${ABD}`, borderRadius: 14, padding: "15px 18px", marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <CalendarClock size={18} color={A} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ ...display, fontWeight: 600, fontSize: 16, color: INK }}>{direct.serviceName}</div>
              <div style={{ ...mono, fontSize: 11, color: AT, marginTop: 2 }}>{fmtDate(direct.date)} at {fmtTime(direct.time)} · this slot is held for you</div>
            </div>
          </div>
          {direct.details ? (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${ABD}` }}>
              <div style={{ ...mono, fontSize: 9.5, letterSpacing: "0.14em", textTransform: "uppercase", color: AT, marginBottom: 5 }}>About this session</div>
              <div style={{ fontSize: 13.5, color: INK, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{direct.details}</div>
            </div>
          ) : null}
        </div>
      )}

      {/* running context chip once a service + date are chosen */}
      {service && step >= 2 && (
        <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "12px 14px", marginBottom: 20, border: `1px solid ${LINE}`, borderRadius: 12, background: CREAM }}>
          {service.image ? <img src={service.image} alt="" style={{ width: 50, height: 50, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} /> : null}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...display, fontWeight: 600, fontSize: 15.5, color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{service.name}</div>
            <div style={{ ...mono, fontSize: 11, color: STONE, marginTop: 3 }}>{date ? fmtDate(date) + (time ? " at " + fmtTime(time) : "") : "Choose a date and time"}</div>
          </div>
          {basePrice > 0 ? <div style={{ ...mono, fontSize: 13, color: A, fontWeight: 500, flexShrink: 0 }}>{money(total)}</div> : null}
        </div>
      )}

      {/* ===== STEP 1 — CHOOSE ===== */}
      {step === 1 && (
        <div>
          <h1 style={lead}>What are we creating?</h1>
          <p style={subLead}>Pick a session to begin. You can fine-tune the details next.</p>

          {!preService && (
            <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
              {GROUP_KEYS.map((k) => { const gg = GROUPS[k]; const activeG = group === k; return (
                <button key={k} onClick={() => { setGroup(k); setServiceId(null); setAddonIds([]); }} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 999, cursor: "pointer", fontSize: 13, border: `1px solid ${activeG ? gg.color : LINE}`, background: activeG ? gg.color : PAPER, color: activeG ? "#fff" : STONE }}><gg.Icon size={14} /> {gg.label}</button>
              ); })}
            </div>
          )}
          {photo && (
            <div style={{ textAlign: "center", margin: "2px auto 24px", maxWidth: 470 }}>
              <img src="/dot1-photo-logo.png" alt="Dot One Photography" style={{ height: 52, width: "auto", display: "block", margin: "0 auto 11px" }} />
              <div style={{ ...display, fontStyle: "italic", fontSize: 17, color: GROUPS.photo.color }}>Timeless portraits, Alaska</div>
            </div>
          )}

          {!catalogLoaded ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{[0, 1, 2].map((i) => (<div key={i} style={{ ...card, padding: "18px 20px" }}><Skeleton w="42%" h={16} style={{ marginBottom: 11 }} /><Skeleton w="72%" h={11} style={{ marginBottom: 8 }} /><Skeleton w="28%" h={11} /></div>))}</div>
          ) : catalogError ? (
            <div style={{ ...card, padding: 20 }}><EmptyState icon={AlertTriangle} title="We couldn't load services right now" text="Please refresh the page, or reach out to us directly and we'll help you book." /></div>
          ) : (
            <div>
              {preService ? renderServiceHero(preService)
                : groupServices.length === 0 ? (
                  <div style={{ ...card, padding: 20 }}><EmptyState icon={GROUPS[group].Icon} title={"No " + GROUPS[group].label + " services yet"} text="Please check back soon, or reach out to us directly and we'll help you book." /></div>
                ) : photo ? (
                  PHOTO_CATEGORIES.concat(["__other"]).map((cat) => {
                    const inCat = groupServices.filter((s) => cat === "__other" ? !PHOTO_CATEGORIES.includes(s.category) : s.category === cat);
                    if (inCat.length === 0) return null;
                    const label = cat === "__other" ? "More Sessions" : cat;
                    const open = !!openCats[cat];
                    return (
                      <div key={cat} style={{ marginTop: 10, border: `1px solid ${LINE}`, borderRadius: 14, overflow: "hidden" }}>
                        <div onClick={() => setOpenCats((pp) => ({ ...pp, [cat]: !pp[cat] }))} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", cursor: "pointer", background: open ? CREAM : PAPER }}>
                          <div style={{ ...mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: INK }}>{label} <span style={{ color: FAINT }}>· {inCat.length}</span></div>
                          <ChevronDown size={16} color="#6f6d65" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                        </div>
                        {open && <div style={{ padding: "6px 12px 12px" }}>{inCat.map(renderServiceCard)}</div>}
                      </div>
                    );
                  })
                ) : (
                  groupServices.map(renderServiceCard)
                )}

              {service && availableAddons.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 11 }}>Add-ons (optional)</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
                    {availableAddons.map((a) => { const on = addonIds.includes(a.id); return (
                      <button key={a.id} onClick={() => setAddonIds((pp) => on ? pp.filter((x) => x !== a.id) : [...pp, a.id])} style={{ display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 10, padding: "10px 13px", cursor: "pointer", fontSize: 12.5, border: `1px solid ${on ? A : LINE}`, background: on ? AB : PAPER, color: on ? AT : STONE }}>
                        {on ? <span style={{ width: 16, height: 16, borderRadius: 5, background: A, color: "#fff", display: "grid", placeItems: "center" }}><Check size={11} /></span> : null}
                        {a.name}{a.addTime ? <span style={{ ...mono, fontSize: 10, color: FAINT }}> · +{a.addTime}m</span> : null} <span style={{ ...mono, fontSize: 11.5, color: a.price ? A : FAINT }}>{a.price ? "+" + money(a.price) : "free"}</span>
                      </button>
                    ); })}
                  </div>
                </div>
              )}

              <ActionBar showTotal right={service ? <button onClick={() => setStep(2)} style={{ ...btnSolid, background: A, borderRadius: 11, padding: "14px 24px", fontSize: 14, textTransform: "none", letterSpacing: 0 }}>Continue <ArrowRight size={15} /></button> : null} />
            </div>
          )}
        </div>
      )}

      {/* ===== STEP 2 — DATE & TIME ===== */}
      {step === 2 && !direct && (
        <div>
          <h1 style={lead}>When works for you?</h1>
          <p style={subLead}>Open dates are highlighted. Pick a day, then a start time.</p>
          <div style={{ maxWidth: 360 }}>
            {availDates.length === 0 ? (
              <div style={{ border: `1px dashed ${LINE}`, borderRadius: 12, padding: "18px", textAlign: "center", background: PAPER, fontSize: 13, color: STONE, lineHeight: 1.5 }}>No open dates right now. Please check back soon, or contact us and we'll find a time.</div>
            ) : (
              <BookingCalendar availDates={availDates} value={date} onPick={(d) => { setDate(d); setTime(""); releaseHold(); }} A={A} />
            )}
            <div style={{ marginTop: 14 }}>
              {!wlOpen ? (
                <button onClick={() => { setWlOpen(true); setWlDone(""); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, ...mono, fontSize: 10.5, letterSpacing: "0.05em", color: STONE, textDecoration: "underline" }}>Don't see your date? Join the waitlist</button>
              ) : (
                <div style={{ border: `1px solid ${LINE}`, borderRadius: 12, padding: "12px 14px", background: PAPER, maxWidth: 460 }}>
                  <div style={{ ...mono, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: STONE, marginBottom: 8 }}>Waitlist for a full day</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <input type="date" value={wl.date} onChange={(e) => setWl({ ...wl, date: e.target.value })} style={{ ...inputStyle, gridColumn: "1 / -1" }} />
                    <input value={wl.name || acct.name} onChange={(e) => setWl({ ...wl, name: e.target.value })} placeholder="Your name" style={inputStyle} />
                    <input type="email" value={wl.email || acct.email} onChange={(e) => setWl({ ...wl, email: e.target.value })} placeholder="Email" style={inputStyle} />
                  </div>
                  {wlDone && <div style={{ fontSize: 12.5, color: STONE, marginTop: 8 }}>{wlDone}</div>}
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button onClick={joinWaitlist} style={{ ...btnSolid, background: A }}>Join waitlist</button>
                    <button onClick={() => setWlOpen(false)} style={btnGhost}>Close</button>
                  </div>
                </div>
              )}
            </div>
            {date && (
              <div style={{ marginTop: 20 }}>
                <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: STONE, marginBottom: 10 }}>Available start times</div>
                {slotsForDate(date).length === 0 ? (
                  <div style={{ fontSize: 12.5, color: STONE }}>Every time on this day is booked. Please choose another day.</div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {slotsForDate(date).map((t) => { const on = time === t; return (
                      <button key={t} onClick={() => { setTime(t); acquireHold(date, t); }} style={{ ...mono, fontSize: 12.5, padding: "10px 15px", borderRadius: 10, cursor: "pointer", border: `1.5px solid ${on ? A : LINE}`, background: on ? A : PAPER, color: on ? "#fff" : INK }}>{fmtTime(t)}</button>
                    ); })}
                  </div>
                )}
              </div>
            )}
          </div>
          {taken && <div style={{ background: "#fbeeed", border: "1px solid #f2cdc9", borderRadius: 10, padding: "9px 13px", marginTop: 16, fontSize: 12.5, color: DANGER, display: "flex", alignItems: "center", gap: 8 }}><AlertTriangle size={14} /> That date and time is already booked. Please pick another.</div>}
          <ActionBar left={<button onClick={() => setStep(1)} style={{ ...btnGhost, borderRadius: 11, padding: "13px 18px" }}><ArrowLeft size={14} /> Back</button>} right={<button onClick={() => { if (!date || !time || taken) return; setStep(3); }} style={{ ...btnSolid, background: date && time && !taken ? A : FAINT, borderRadius: 11, padding: "14px 24px", fontSize: 14, textTransform: "none", letterSpacing: 0 }}>Continue <ArrowRight size={15} /></button>} />
        </div>
      )}

      {/* ===== STEP 3 — ACCOUNT + SIGN ===== */}
      {step === 3 && (
        <div>
          <h1 style={lead}>{authedClient ? "Sign your release." : direct ? "A few details." : "Your details."}</h1>
          <p style={subLead}>{authedClient ? "Confirm the release for this session below." : "Set up your account and sign to continue. It takes a moment."}</p>

          {!authedClient ? (
            <>
              {!direct && (
                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 16, cursor: "pointer", background: CREAM, border: `1px solid ${LINE}`, borderRadius: 12, padding: "12px 14px" }}>
                  <input type="checkbox" checked={wantAccount} onChange={(e) => setWantAccount(e.target.checked)} style={{ marginTop: 2, width: 16, height: 16, accentColor: A, cursor: "pointer" }} />
                  <span style={{ fontSize: 12.5, color: BODY, lineHeight: 1.5 }}>Create an account to follow your session and receive your finished work. Leave unchecked to just book with your details.</span>
                </label>
              )}
              {inviteAccount && <div style={{ fontSize: 13, color: BODY, marginBottom: 16, lineHeight: 1.5 }}>Already have an account? <span onClick={onLogin} style={{ color: A, cursor: "pointer" }}>Log in</span>.</div>}
              <FieldLabel>Your name</FieldLabel>
              <TextInput value={acct.name} onChange={(v) => setAcct({ ...acct, name: v })} placeholder="Sarah & James" />
              <FieldLabel>Email</FieldLabel>
              <TextInput value={acct.email} onChange={(v) => setAcct({ ...acct, email: v })} placeholder="you@example.com" />
              <FieldLabel>Phone (optional)</FieldLabel>
              <TextInput value={acct.phone} onChange={(v) => setAcct({ ...acct, phone: v })} placeholder="(907) 555-0123" />
              {inviteAccount && (<>
                <FieldLabel>Create a password</FieldLabel>
                <input type="password" value={acct.password} onChange={(e) => setAcct({ ...acct, password: e.target.value })} placeholder="At least 8 characters" style={{ ...inputStyle, marginBottom: 2 }} />
                <PasswordMeter value={acct.password} />
                <div style={{ ...mono, fontSize: 10, color: FAINT, marginTop: 4, lineHeight: 1.4 }}>You'll use your email and this password to sign in later and check your session.</div>
              </>)}
            </>
          ) : (
            <div style={{ fontSize: 13.5, color: BODY, marginBottom: 4, lineHeight: 1.5 }}>You're signed in as <strong style={{ color: INK }}>{authedClient.name || authedClient.email}</strong>.</div>
          )}

          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 20, cursor: "pointer", background: CREAM, border: `1px solid ${LINE}`, borderRadius: 12, padding: "12px 14px" }}>
            <input type="checkbox" checked={isMinor} onChange={(e) => setIsMinor(e.target.checked)} style={{ marginTop: 2, width: 16, height: 16, accentColor: A, cursor: "pointer" }} />
            <span style={{ fontSize: 12.5, color: BODY, lineHeight: 1.5 }}>This session is for a child under 18. I am the parent or legal guardian and will sign on their behalf.</span>
          </label>

          {!authedClient && <AgreementBox title="1 - Client Services Agreement" text={clientServicesSummary(group)} pdf={PDF_CLIENT_SERVICES} A={A} />}
          <AgreementBox title={authedClient ? (isMinor ? "Minor Release & Liability Waiver" : "Release & Liability Waiver") : (isMinor ? "2 - Minor Release & Liability Waiver" : "2 - Release & Liability Waiver")} text={isMinor ? MINOR_SUMMARY : RELEASE_SUMMARY} pdf={isMinor ? PDF_MINOR : PDF_RELEASE} A={A} />

          {isMinor && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 6 }}>
              <div style={{ flex: "1 1 200px" }}><FieldLabel>Child's full name</FieldLabel><TextInput value={child.name} onChange={(v) => setChild({ ...child, name: v })} placeholder="Child's name" /></div>
              <div style={{ flex: "0 1 90px" }}><FieldLabel>Age</FieldLabel><TextInput value={child.age} onChange={(v) => setChild({ ...child, age: v })} placeholder="e.g. 6" /></div>
              <div style={{ flex: "1 1 160px" }}><FieldLabel>Your relationship</FieldLabel><TextInput value={child.relationship} onChange={(v) => setChild({ ...child, relationship: v })} placeholder="Parent / Guardian" /></div>
            </div>
          )}

          <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginTop: 22, marginBottom: 10 }}>How may we use the images and video?</div>
          {USAGE_OPTIONS.map((o) => (
            <label key={o.key} style={{ display: "flex", alignItems: "flex-start", gap: 11, marginBottom: 9, cursor: "pointer", border: `1.5px solid ${usage === o.key ? A : LINE}`, background: usage === o.key ? A + "0e" : PAPER, borderRadius: 11, padding: "12px 14px" }}>
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

          {submitErr && <div style={{ marginTop: 12, fontSize: 12.5, color: DANGER, display: "flex", alignItems: "center", gap: 7 }}><AlertTriangle size={14} /> {submitErr}</div>}

          <ActionBar left={<button onClick={() => (direct ? onCancel() : setStep(2))} disabled={submitting} style={{ ...btnGhost, borderRadius: 11, padding: "13px 18px" }}><ArrowLeft size={14} /> Back</button>} right={<button onClick={submitAccount} disabled={submitting} style={{ ...btnSolid, background: submitting ? FAINT : A, borderRadius: 11, padding: "14px 24px", fontSize: 14, textTransform: "none", letterSpacing: 0 }}>{submitting ? "Saving…" : "Sign and continue"} <ArrowRight size={15} /></button>} />
        </div>
      )}

      {/* ===== STEP 4 — REVIEW & PAY ===== */}
      {step === 4 && (
        <div>
          <h1 style={lead}>One last look.</h1>
          <p style={subLead}>Confirm the details, choose how to pay, and reserve your date.</p>

          <div style={{ ...card, padding: "20px 22px", marginBottom: 16 }}>
            <Row k={service?.name || ""} v={money(basePrice)} bold />
            {chosenAddons.map((a) => <Row key={a.id} k={a.name} v={"+" + money(a.price)} sub />)}
            <div style={{ borderTop: `2px solid ${INK}`, marginTop: 10, paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: FAINT }}>Total</span>
              <span style={{ ...display, fontWeight: 700, fontSize: 22, color: INK }}>{money(total)}</span>
            </div>
          </div>

          <div style={{ background: CREAM, border: `1px solid ${LINE}`, borderRadius: 12, padding: "13px 16px", marginBottom: 16 }}>
            <div style={{ ...mono, fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: STONE, marginBottom: 4 }}>Your session</div>
            <div style={{ fontSize: 14, color: INK, fontWeight: 500 }}>{fmtDate(direct ? direct.date : date)} at {fmtTime(direct ? direct.time : time)}</div>
          </div>
          {taken && <div style={{ background: "#fbeeed", border: "1px solid #f2cdc9", borderRadius: 10, padding: "9px 13px", marginBottom: 14, fontSize: 12.5, color: DANGER, display: "flex", alignItems: "center", gap: 8 }}><AlertTriangle size={14} /> That date and time is already booked. Please pick another.</div>}

          <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 10 }}>Reserve your date</div>
          <div style={{ background: CREAM, border: `1px solid ${LINE}`, borderLeft: `3px solid ${A}`, borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}><div style={{ fontSize: 12, color: STONE, lineHeight: 1.45 }}>{rules.note}</div></div>
          {rules.options.map((o) => { const amt = optionAmount(o, total); const sel = payChoice === o.key; return (
            <div key={o.key} onClick={() => setPayChoice(o.key)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 15px", marginBottom: 9, borderRadius: 12, cursor: "pointer", border: `1.5px solid ${sel ? A : LINE}`, background: sel ? AB : PAPER }}>
              <span style={{ width: 18, height: 18, borderRadius: "50%", border: `1.5px solid ${sel ? A : LINE}`, background: sel ? A : PAPER, display: "grid", placeItems: "center", flexShrink: 0 }}>{sel && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}</span>
              <span style={{ flex: 1, fontSize: 13.5, color: INK }}>{o.label}</span>
              {o.key !== "quote" && <span style={{ ...mono, fontSize: 13, color: A }}>{o.pct === 0 && o.fixed == null ? "$0 today" : money(amt) + " today"}</span>}
            </div>
          ); })}
          <div style={{ ...mono, fontSize: 9.5, color: FAINT, marginTop: 4 }}>Payments are processed securely through Square.</div>

          <ActionBar left={<button onClick={() => setStep(3)} style={{ ...btnGhost, borderRadius: 11, padding: "13px 18px" }}><ArrowLeft size={14} /> Back</button>} right={<button onClick={() => { if (!date || !time || !payChoice || taken) return; const payAmount = optionAmount(rules.options.find((o) => o.key === payChoice), total); onComplete({ linkId: direct?.id, bookingDetails: direct?.details || "", group, serviceName: service.name, location: service.location || "", locationUrl: service.locationUrl || "", confirmationMessage: service.confirmationMessage || "", duration: apptLen, apptMin: apptLen, padBefore: padB, padAfter: padA, addons: chosenAddons.map((a) => ({ name: a.name, price: Number(a.price) || 0, addTime: Number(a.addTime) || 0 })), total, payAmount, date, time, payChoice, name: acct.name, email: acct.email }); }} style={{ ...btnSolid, background: date && time && payChoice && !taken ? A : FAINT, borderRadius: 11, padding: "14px 24px", fontSize: 14, textTransform: "none", letterSpacing: 0 }}><Check size={15} /> {(() => { const amt = optionAmount(rules.options.find((o) => o.key === payChoice), total); return amt > 0 ? "Pay " + money(amt) + " & reserve" : "Confirm booking"; })()}</button>} />
        </div>
      )}
    </div>
  );
}
