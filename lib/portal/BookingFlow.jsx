// Dot One Media portal - client booking + payment flow (service -> add-ons -> date/time -> agreement -> payment) + private USAGE_OPTIONS + AgreementBox. MONEY MATH KEPT INLINE VERBATIM.
import React, { useState, useEffect, useRef } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, CalendarClock, Check, ChevronDown, FileCheck, Sparkles, X } from "lucide-react";
import { RED, INK, BODY, STONE, FAINT, LINE, PAPER, CREAM, DANGER, display, mono, card, inputStyle, btnGhost, btnSolid } from "./theme";
import { GROUPS, GROUP_KEYS } from "./groups";
import { fmtDate, fmtTime, money } from "./format";
import { PHOTO_CATEGORIES, CLIENT_SERVICES_VERSION, RELEASE_VERSION, PDF_CLIENT_SERVICES, PDF_RELEASE, PDF_MINOR, CLIENT_SERVICES_SUMMARY, clientServicesSummary, RELEASE_SUMMARY, MINOR_SUMMARY } from "./constants";
import { PAYMENT_RULES, STAGES } from "./stages";
import { bookingTotal, optionAmount } from "./pricing";
import { FieldLabel, TextInput, EmptyState, Skeleton, Row, PasswordMeter } from "./ui";

export const USAGE_OPTIONS = [
  { key: "A", label: "Portfolio & Marketing (default)", desc: "Dot One Media may use the content to promote its own business, including its website, social media, portfolio, samples, competition entries, and its own advertising. It will not sell or license your images to unrelated third parties." },
  { key: "B", label: "Full Commercial Use", desc: "In addition to Option A, Dot One Media may license, sell, or assign the content to third parties for commercial purposes, without further compensation." },
  { key: "C", label: "Private / Limited Use", desc: "Dot One Media may use the content only to deliver your finished project, and may not publish your images publicly, except as you note below." },
];

export function AgreementBox({ title, text, pdf, A }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 6 }}>{title}</div>
      <div style={{ maxHeight: 170, overflowY: "auto", border: `1px solid ${LINE}`, borderRadius: 9, padding: "13px 15px", background: PAPER, fontSize: 12.5, lineHeight: 1.55, color: BODY, whiteSpace: "pre-wrap" }}>{text}</div>
      <a href={pdf} target="_blank" rel="noopener noreferrer" style={{ ...mono, fontSize: 10.5, letterSpacing: "0.04em", color: A, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginTop: 6 }}><FileCheck size={12} /> Read the full agreement (PDF)</a>
    </div>
  );
}

export function BookingFlow({ state, direct, slotTaken, onCancel, onComplete, onLogin, catalogLoaded, catalogError, availability, authedClient, refreshSlots }) {
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
      if (!acct.password || acct.password.length < 8) { setSubmitErr("Create a password of at least 8 characters."); return; }
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
  const total = bookingTotal(basePrice, chosenAddons);
  const rules = PAYMENT_RULES[group];
  const A = GROUPS[group].color, AB = GROUPS[group].bg, ABD = GROUPS[group].border, AT = GROUPS[group].text;
  const taken = !direct && slotTaken(date, time);

  const stepLabel2 = authedClient ? "Sign Release" : "Account";
  const stepDefs = direct ? [{ n: 2, label: stepLabel2 }, { n: 3, label: "Confirm & Pay" }] : [{ n: 1, label: "Choose" }, { n: 2, label: stepLabel2 }, { n: 3, label: "Confirm & Pay" }];

  /* STEP 0 — WELCOME */
  const renderServiceBtn = (s) => { const sel = serviceId === s.id; const dOpen = !!openDesc[s.id]; return (
    <div key={s.id} role="button" tabIndex={0} onClick={() => { setServiceId(s.id); setAddonIds([]); }} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setServiceId(s.id); setAddonIds([]); } }} style={{ width: "100%", textAlign: "left", marginBottom: 10, padding: "15px 17px", borderRadius: 10, cursor: "pointer", border: `1.5px solid ${sel ? GROUPS[group].color : LINE}`, background: sel ? AB : PAPER }}>
      {s.image && <img src={s.image} alt="" style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 8, marginBottom: 12, display: "block" }} />}
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
          {group === "photo" && (
            <div style={{ textAlign: "center", margin: "2px auto 24px", maxWidth: 470 }}>
              <img src="/dot1-photo-logo.png" alt="Dot One Photography" style={{ height: 54, width: "auto", display: "block", margin: "0 auto 11px" }} />
              <div style={{ ...display, fontStyle: "italic", fontSize: 17, color: GROUPS.photo.color }}>Timeless portraits, Alaska</div>
              <div style={{ ...mono, fontSize: 8.5, letterSpacing: "0.28em", textTransform: "uppercase", color: FAINT, marginTop: 8 }}>Choose your session below</div>
            </div>
          )}
          {!catalogLoaded ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{[0, 1, 2].map((i) => (<div key={i} style={{ ...card, padding: "18px 20px" }}><Skeleton w="42%" h={16} style={{ marginBottom: 11 }} /><Skeleton w="72%" h={11} style={{ marginBottom: 8 }} /><Skeleton w="28%" h={11} /></div>))}</div>
          ) : catalogError ? (
            <div style={{ ...card }}><EmptyState icon={AlertTriangle} title="We couldn't load services right now" text="Please refresh the page, or reach out to us directly and we'll help you book." /></div>
          ) : (
            <div>
              {groupServices.length === 0 ? (
                <div style={{ ...card }}><EmptyState icon={GROUPS[group].Icon} title={"No " + GROUPS[group].label + " services yet"} text="Please check back soon, or reach out to us directly and we'll help you book." /></div>
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
              <input type="password" value={acct.password} onChange={(e) => setAcct({ ...acct, password: e.target.value })} placeholder="At least 8 characters" style={{ ...inputStyle, marginBottom: 2 }} />
              <PasswordMeter value={acct.password} />
              <div style={{ ...mono, fontSize: 10, color: FAINT, marginTop: 4, lineHeight: 1.4 }}>You'll use your email and this password to sign in later and check your session.</div>
            </>
          ) : (
            <div style={{ fontSize: 13.5, color: BODY, marginBottom: 4, lineHeight: 1.5 }}>You're signed in as <strong style={{ color: INK }}>{authedClient.name || authedClient.email}</strong>. Please sign the release for this session below.</div>
          )}

          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 20, cursor: "pointer", background: CREAM, border: `1px solid ${LINE}`, borderRadius: 9, padding: "12px 14px" }}>
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

          {submitErr && <div style={{ marginTop: 12, fontSize: 12.5, color: DANGER, display: "flex", alignItems: "center", gap: 7 }}><AlertTriangle size={14} /> {submitErr}</div>}

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
          {taken && <div style={{ background: "#fbeeed", border: "1px solid #f2cdc9", borderRadius: 8, padding: "9px 13px", marginBottom: 14, fontSize: 12.5, color: DANGER, display: "flex", alignItems: "center", gap: 8 }}><AlertTriangle size={14} /> That date and time is already booked. Please pick another.</div>}

          <FieldLabel>Payment</FieldLabel>
          <div style={{ background: CREAM, border: `1px solid ${LINE}`, borderLeft: `3px solid ${GROUPS[group].color}`, borderRadius: 8, padding: "10px 14px", marginBottom: 12 }}><div style={{ fontSize: 12, color: STONE, lineHeight: 1.45 }}>{rules.note}</div></div>
          {rules.options.map((o) => { const amt = optionAmount(o, total); const sel = payChoice === o.key; return (
            <div key={o.key} onClick={() => setPayChoice(o.key)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 14px", marginBottom: 8, borderRadius: 9, cursor: "pointer", border: `1.5px solid ${sel ? GROUPS[group].color : LINE}`, background: sel ? AB : PAPER }}>
              <span style={{ width: 17, height: 17, borderRadius: "50%", border: `1.5px solid ${sel ? GROUPS[group].color : LINE}`, background: sel ? GROUPS[group].color : PAPER, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{sel && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />}</span>
              <span style={{ flex: 1, fontSize: 13.5, color: INK }}>{o.label}</span>
              {o.key !== "quote" && <span style={{ ...mono, fontSize: 13, color: A }}>{o.pct === 0 && o.fixed == null ? "$0 today" : money(amt) + " today"}</span>}
            </div>
          ); })}
          <div style={{ ...mono, fontSize: 9.5, color: FAINT, marginTop: 4, marginBottom: 18 }}>Payments are processed securely through Square.</div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button onClick={() => setStep(2)} style={btnGhost}><ArrowLeft size={14} /> Back</button>
            <button onClick={() => { if (!date || !time || !payChoice || taken) return; const payAmount = optionAmount(rules.options.find((o) => o.key === payChoice), total); onComplete({ linkId: direct?.id, group, serviceName: service.name, duration: apptLen, apptMin: apptLen, padBefore: padB, padAfter: padA, addons: chosenAddons.map((a) => ({ name: a.name, price: Number(a.price) || 0, addTime: Number(a.addTime) || 0 })), total, payAmount, date, time, payChoice, name: acct.name, email: acct.email }); }} style={{ ...btnSolid, background: date && time && payChoice && !taken ? A : FAINT }}><Check size={15} /> {(() => { const amt = optionAmount(rules.options.find((o) => o.key === payChoice), total); return amt > 0 ? "Continue to payment · " + money(amt) : "Confirm booking"; })()}</button>
          </div>
        </div>
      )}
    </div>
  );
}


