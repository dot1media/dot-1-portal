import React, { useState } from "react";
import { Check, ArrowRight, AlertTriangle } from "lucide-react";
import { INK, BODY, STONE, FAINT, LINE, PAPER, CREAM, RED, OK, DANGER, display, mono, card, btnSolid, inputStyle } from "./theme";
import { GROUPS } from "./groups";
import { FieldLabel, TextInput, PasswordMeter } from "./ui";
import { fmtDate, fmtTime } from "./format";
import { AgreementBox, USAGE_OPTIONS } from "./BookingFlow";
import { clientServicesSummary, CLIENT_SERVICES_VERSION, RELEASE_VERSION, PDF_CLIENT_SERVICES, PDF_RELEASE, PDF_MINOR, RELEASE_SUMMARY, MINOR_SUMMARY } from "./constants";

// Shown after an invoice client pays. Their session is already booked and paid;
// here they sign the agreements and set a portal password, then continue to the
// dashboard. Mirrors the booking flow's sign step so the records match exactly.
export function InvoiceOnboarding({ session, onDone }) {
  const group = session?.serviceLine || "video";
  const grp = GROUPS[group] || GROUPS.video;
  const A = grp.color;
  const email = (session?.clientEmail || "").toLowerCase();
  const name = session?.clientName || "";

  const [isMinor, setIsMinor] = useState(false);
  const [child, setChild] = useState({ name: "", age: "", relationship: "" });
  const [usage, setUsage] = useState("A");
  const [exception, setException] = useState("");
  const [signature, setSignature] = useState(name);
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState("");

  const submit = async () => {
    setErr("");
    if (!signature.trim()) { setErr("Type your full legal name to sign."); return; }
    if (!agree) { setErr("Please check the box to agree and sign."); return; }
    if (!password || password.length < 8) { setErr("Choose a password of at least 8 characters."); return; }
    if (isMinor && (!child.name.trim() || !child.age.trim() || !child.relationship.trim())) { setErr("Please add the child's name, age, and your relationship to the child."); return; }
    setSubmitting(true);
    try {
      // create/attach the account + password (idempotent on email; sets the client cookie)
      const ures = await fetch("/api/users", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: name.trim() || signature.trim(), email, phone: (session?.clientPhone || "").trim(), password }) });
      const udata = await ures.json().catch(() => ({}));
      if (!ures.ok) throw new Error(udata.error || "Could not set up your account.");

      const releaseType = isMinor ? "minor_release" : "media_release";
      const details = isMinor
        ? { childName: child.name.trim(), childAge: child.age.trim(), relationship: child.relationship.trim(), exception: usage === "C" ? exception.trim() : "" }
        : { exception: usage === "C" ? exception.trim() : "" };
      const agreements = [
        { type: "client_services", version: CLIENT_SERVICES_VERSION },
        { type: releaseType, version: RELEASE_VERSION, usageOption: usage, details },
      ];
      const ares = await fetch("/api/agreements", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, signedName: signature.trim(), agreements }) });
      if (!ares.ok) { const d = await ares.json().catch(() => ({})); throw new Error(d.error || "Could not record your signature."); }
      onDone && onDone();
    } catch (e) {
      setErr((e && e.message) || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 620, margin: "0 auto", padding: "34px 20px 40px" }}>
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <div style={{ width: 54, height: 54, borderRadius: "50%", background: grp.bg, border: `1.5px solid ${grp.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}><Check size={26} color={A} /></div>
        <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.22em", textTransform: "uppercase", color: OK, marginBottom: 12 }}>Payment received</div>
        <h1 style={{ ...display, fontWeight: 700, fontSize: 26, color: INK, lineHeight: 1.18, margin: "0 0 10px" }}>Two quick steps to finish</h1>
        {session && <div style={{ fontSize: 14, color: BODY, lineHeight: 1.6 }}>Your <strong style={{ color: INK }}>{session.type}</strong> is booked{session.date ? " for " + fmtDate(session.date) : ""}{session.time ? " at " + fmtTime(session.time) : ""}. Please sign your agreements and set a password so you can sign in to your portal.</div>}
      </div>

      <div style={{ ...card, padding: "22px 22px 24px" }}>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 4, cursor: "pointer", background: CREAM, border: `1px solid ${LINE}`, borderRadius: 9, padding: "12px 14px" }}>
          <input type="checkbox" checked={isMinor} onChange={(e) => setIsMinor(e.target.checked)} style={{ marginTop: 2, width: 16, height: 16, accentColor: A, cursor: "pointer" }} />
          <span style={{ fontSize: 12.5, color: BODY, lineHeight: 1.5 }}>This session is for a child under 18. I am the parent or legal guardian and will sign on their behalf.</span>
        </label>

        <AgreementBox title="1 - Client Services Agreement" text={clientServicesSummary(group)} pdf={PDF_CLIENT_SERVICES} A={A} />
        <AgreementBox title={isMinor ? "2 - Minor Release & Liability Waiver" : "2 - Release & Liability Waiver"} text={isMinor ? MINOR_SUMMARY : RELEASE_SUMMARY} pdf={isMinor ? PDF_MINOR : PDF_RELEASE} A={A} />

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
          <TextInput value={signature} onChange={setSignature} placeholder="Full legal name" />
        </div>
        <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 12, cursor: "pointer" }}>
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ marginTop: 3, width: 16, height: 16, accentColor: A, cursor: "pointer" }} />
          <span style={{ fontSize: 12.5, color: BODY, lineHeight: 1.5 }}>I have read and agree to the Client Services Agreement and the {isMinor ? "Minor " : ""}Release and Liability Waiver above. This typed signature is legally binding.</span>
        </label>

        <div style={{ marginTop: 20, borderTop: `1px solid ${LINE}`, paddingTop: 18 }}>
          <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 8 }}>Set your portal password</div>
          <div style={{ fontSize: 12.5, color: STONE, marginBottom: 8, lineHeight: 1.5 }}>You'll sign in with <strong style={{ color: INK }}>{email}</strong> and this password.</div>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" style={{ ...inputStyle, marginBottom: 2 }} />
          <PasswordMeter value={password} />
        </div>

        {err && <div style={{ marginTop: 14, fontSize: 12.5, color: DANGER, display: "flex", alignItems: "center", gap: 7 }}><AlertTriangle size={14} /> {err}</div>}

        <button onClick={submit} disabled={submitting} style={{ ...btnSolid, background: A, width: "100%", justifyContent: "center", marginTop: 18, fontSize: 15, padding: "13px 20px" }}>{submitting ? "Finishing\u2026" : "Sign & enter my portal"} <ArrowRight size={16} /></button>
      </div>
    </div>
  );
}
