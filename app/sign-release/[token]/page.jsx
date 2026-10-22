"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const INK = "#1a1a17", BODY = "#33322d", STONE = "#6f6d65", FAINT = "#9a988f", LINE = "#e2ded4", RED = "#e23b2e", CREAM = "#f6f1e8", PAPER = "#fbf8f2";

const USAGE = [
  { key: "A", label: "Portfolio & Marketing (default)", desc: "Dot One Media may use the content to promote its own business: website, social media, portfolio, samples, and its own advertising. It will not sell or license your images to unrelated third parties." },
  { key: "B", label: "Full Commercial Use", desc: "In addition to Option A, Dot One Media may license, sell, or assign the content to third parties for commercial purposes, without further compensation." },
  { key: "C", label: "Private / Limited Use", desc: "Dot One Media may use the content only to deliver your finished project, and may not publish your images publicly, except as you note below." },
];

export default function SignReleasePage() {
  const params = useParams();
  const token = params && params.token ? String(params.token) : "";
  const [state, setState] = useState("loading"); // loading | ready | done | error
  const [err, setErr] = useState("");
  const [model, setModel] = useState(null);
  const [session, setSession] = useState(null);

  const [signedName, setSignedName] = useState("");
  const [email, setEmail] = useState("");
  const [usage, setUsage] = useState("A");
  const [exception, setException] = useState("");
  const [childAge, setChildAge] = useState("");
  const [relationship, setRelationship] = useState("");
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) { setState("error"); setErr("Missing link."); return; }
    fetch("/api/model-release/public?token=" + encodeURIComponent(token))
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setState("error"); setErr(d.error); return; }
        setModel(d.model); setSession(d.session || null);
        setEmail(d.model.email || "");
        if (d.model.status === "signed" || d.model.status === "uploaded") setState("done");
        else setState("ready");
      })
      .catch(() => { setState("error"); setErr("Could not load this release."); });
  }, [token]);

  const minor = model && model.minor;
  const pdf = minor ? "/Dot-One-Media-Minor-Release-and-Waiver.pdf" : "/Dot-One-Media-Release-and-Waiver.pdf";

  const submit = async () => {
    if (!signedName.trim()) { setErr("Please type your full name as your signature."); return; }
    if (minor && !relationship.trim()) { setErr("Please state your relationship to the child."); return; }
    if (!agree) { setErr("Please check the box to confirm you agree."); return; }
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/model-release/sign", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, signedName, email, usageOption: usage, exception, childAge, relationship }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(d.error || "Could not submit."); setBusy(false); return; }
      setState("done");
    } catch (e) { setErr("Could not submit. Please try again."); setBusy(false); }
  };

  const wrap = { minHeight: "100vh", background: PAPER, fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif", padding: "0 0 60px" };
  const card = { maxWidth: 620, margin: "0 auto", padding: "0 18px" };
  const box = { background: "#fff", border: `1px solid ${LINE}`, borderRadius: 12, padding: "22px 24px", marginTop: 16 };
  const label = { display: "block", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: STONE, margin: "14px 0 6px", fontWeight: 600 };
  const input = { width: "100%", boxSizing: "border-box", padding: "11px 13px", border: `1px solid ${LINE}`, borderRadius: 9, fontSize: 15, color: INK, background: "#fff", fontFamily: "inherit" };

  return (
    <div style={wrap}>
      <div style={{ borderBottom: `2px solid ${RED}`, background: "#fff", padding: "18px 0", marginBottom: 8 }}>
        <div style={card}><img src="/dot1-logo.png" alt="Dot One Media" style={{ height: 38 }} /></div>
      </div>
      <div style={card}>
        {state === "loading" && <p style={{ color: STONE, fontSize: 14, marginTop: 24 }}>Loading your release&hellip;</p>}
        {state === "error" && <div style={box}><h1 style={{ fontFamily: "Georgia,serif", fontSize: 22, color: INK, margin: "0 0 8px" }}>This link isn&rsquo;t available</h1><p style={{ color: BODY, fontSize: 14 }}>{err}</p></div>}

        {state === "done" && (
          <div style={box}>
            <h1 style={{ fontFamily: "Georgia,serif", fontSize: 24, color: INK, margin: "0 0 10px" }}>Thank you</h1>
            <p style={{ color: BODY, fontSize: 14.5, lineHeight: 1.6 }}>Your release has been recorded. Nothing else is needed. You may close this page.</p>
            {model && model.hasDoc && <a href={"/api/model-release/doc?token=" + encodeURIComponent(token)} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 14, fontSize: 13, color: RED, fontWeight: 600 }}>Download your signed copy (PDF)</a>}
          </div>
        )}

        {state === "ready" && model && (
          <>
            <div style={box}>
              <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: FAINT }}>{minor ? "Minor Media Release & Waiver" : "Media Release & Waiver"}</div>
              <h1 style={{ fontFamily: "Georgia,serif", fontSize: 23, color: INK, margin: "6px 0 10px" }}>{minor ? "Release for " + model.name : "Hi " + (model.name.split(" ")[0] || "there")}</h1>
              <p style={{ color: BODY, fontSize: 14.5, lineHeight: 1.65, margin: 0 }}>
                {minor
                  ? "You are signing, as a parent or legal guardian, the media release for " + model.name + "."
                  : "Please review and sign your media release."}
                {session && (session.type || session.date) ? " This is for your Dot One Media session" + (session.type ? " (" + session.type + ")" : "") + (session.date ? " on " + session.date : "") + "." : ""}
              </p>
              <a href={pdf} target="_blank" rel="noreferrer" style={{ display: "inline-block", marginTop: 12, fontSize: 12.5, color: RED, fontWeight: 600 }}>Read the full release (PDF) &rsaquo;</a>
            </div>

            <div style={box}>
              <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: STONE, fontWeight: 600, marginBottom: 4 }}>How your images &amp; video may be used</div>
              {USAGE.map((o) => (
                <label key={o.key} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0", borderBottom: `1px solid ${LINE}`, cursor: "pointer" }}>
                  <input type="radio" name="usage" checked={usage === o.key} onChange={() => setUsage(o.key)} style={{ marginTop: 3 }} />
                  <span><span style={{ fontWeight: 600, color: INK, fontSize: 14 }}>{o.label}</span><br /><span style={{ color: STONE, fontSize: 12.5, lineHeight: 1.5 }}>{o.desc}</span></span>
                </label>
              ))}
              {usage === "C" && <input value={exception} onChange={(e) => setException(e.target.value)} placeholder="Any public use you DO allow (optional)" style={{ ...input, marginTop: 10 }} />}
            </div>

            <div style={box}>
              {minor && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div><label style={label}>Child&rsquo;s age</label><input value={childAge} onChange={(e) => setChildAge(e.target.value)} placeholder="e.g. 9" style={input} /></div>
                  <div><label style={label}>Your relationship</label><input value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="e.g. Mother" style={input} /></div>
                </div>
              )}
              <label style={label}>Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" style={input} />
              <label style={label}>{minor ? "Parent / guardian signature (type full name)" : "Signature (type your full name)"}</label>
              <input value={signedName} onChange={(e) => setSignedName(e.target.value)} placeholder="Type your full legal name" style={{ ...input, fontFamily: "Georgia,serif", fontStyle: "italic", fontSize: 17 }} />
              <label style={{ display: "flex", gap: 9, alignItems: "flex-start", marginTop: 14, color: BODY, fontSize: 13, lineHeight: 1.5, cursor: "pointer" }}>
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} style={{ marginTop: 2 }} />
                <span>I have read and agree to the {minor ? "Minor " : ""}Media Release &amp; Waiver, and my typed name is my legal electronic signature.</span>
              </label>
              {err && <p style={{ color: RED, fontSize: 13, marginTop: 12 }}>{err}</p>}
              <button onClick={submit} disabled={busy} style={{ marginTop: 16, width: "100%", background: RED, color: "#fff", border: "none", borderRadius: 9, padding: "14px", fontSize: 15, fontWeight: 700, cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1 }}>{busy ? "Submitting…" : "Sign & submit release"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
