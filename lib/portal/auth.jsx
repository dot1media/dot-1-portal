// Dot One Media portal - entry / auth screens (landing, client login, studio login, reset).
import React, { useState } from "react";
import { AlertTriangle, ArrowRight, Check, LayoutDashboard, LogIn, Send, Sparkles, User } from "lucide-react";
import { RED, INK, BODY, STONE, FAINT, LINE, PAPER, CREAM, OK, DANGER, display, mono, inputStyle, btnSolid } from "./theme";
import { FieldLabel, TextInput, PasswordMeter } from "./ui";
import { useIsMobile } from "./hooks";

export function ResetPassword({ token, onDone, showToast }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (pw.length < 8) { showToast("Password must be at least 8 characters."); return; }
    if (pw !== pw2) { showToast("Those passwords don't match."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/reset", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, password: pw }) });
      const data = await res.json().catch(() => ({}));
      setBusy(false);
      if (res.ok) { showToast("Password updated. You can sign in now."); onDone(); }
      else { showToast(data.error || "Could not reset your password."); }
    } catch (e) { setBusy(false); showToast("Network error."); }
  };
  return (
    <div style={{ maxWidth: 400, margin: "20px auto 0" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ ...display, fontWeight: 700, fontSize: 28, color: INK, marginBottom: 6 }}>Set a new password</div>
        <div style={{ fontSize: 13.5, color: STONE, lineHeight: 1.5 }}>Choose a new password for your portal.</div>
      </div>
      <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, padding: "22px 24px" }}>
        <FieldLabel>New password</FieldLabel>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 8 characters" style={inputStyle} />
        <PasswordMeter value={pw} />
        <FieldLabel>Confirm password</FieldLabel>
        <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} placeholder="Re-enter your password" style={inputStyle} />
        <button onClick={submit} disabled={busy} style={{ ...btnSolid, background: busy ? FAINT : RED, width: "100%", justifyContent: "center", marginTop: 14, padding: "11px" }}>{busy ? "Saving..." : "Update password"}</button>
      </div>
    </div>
  );
}

export function LandingPage({ onBook, onClientLogin, onStudioLogin }) {
  const isMobile = useIsMobile();
  return (
    <div className="d1-stagger" style={{ maxWidth: 760, margin: "10px auto 0" }}>
      <div style={{ textAlign: "center", padding: "20px 0 4px" }}>
        <div style={{ marginBottom: 10 }}><img src={isMobile ? "/dot1-logo.png" : "/dot1-logo-anim.gif"} alt="Dot One Media" style={{ height: isMobile ? 84 : 186, width: "auto", margin: "0 auto", display: "block" }} /></div>
        <div style={{ ...mono, fontSize: 11, letterSpacing: "0.24em", textTransform: "uppercase", color: FAINT, marginBottom: 22 }}>Client Portal</div>
        <h1 style={{ ...display, fontWeight: 700, fontSize: isMobile ? 29 : 40, color: INK, lineHeight: 1.1, letterSpacing: "0", marginBottom: 14 }}>Your project,<br />start to finish.</h1>
        <p style={{ fontSize: 15.5, color: BODY, lineHeight: 1.6, maxWidth: 520, margin: "0 auto 30px" }}>
          Book a session, then follow every step from the shoot to your final delivery, all in one place. Welcome to your studio's home for the work we make together.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <button onClick={onBook} style={{ textAlign: "left", cursor: "pointer", background: RED, border: "none", borderRadius: 14, padding: "22px 24px", color: "#fff" }}>
          <Sparkles size={22} style={{ marginBottom: 12 }} />
          <div style={{ ...display, fontWeight: 700, fontSize: 20, marginBottom: 4 }}>Book a session</div>
          <div style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.92 }}>New here? Choose your service and set up your account in a couple of minutes.</div>
          <div style={{ ...mono, fontSize: 11, letterSpacing: "0.06em", marginTop: 14, display: "flex", alignItems: "center", gap: 6 }}>Get started <ArrowRight size={13} /></div>
        </button>
        <button onClick={onClientLogin} style={{ textAlign: "left", cursor: "pointer", background: PAPER, border: `1px solid ${LINE}`, borderRadius: 14, padding: "22px 24px", color: INK }}>
          <User size={22} color="#6f6d65" style={{ marginBottom: 12 }} />
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

export function StudioLogin({ onLogin, onBack }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [pw, setPw] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  React.useEffect(() => {
    let alive = true;
    fetch("/api/auth/needs-setup").then((r) => r.json()).then((d) => { if (alive && d && d.needsSetup) setMode("setup"); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  const submitLogin = async () => {
    if (!email.trim() || !pw) { setErr("Enter your studio email and password."); return; }
    setErr(""); setBusy(true);
    const r = await onLogin(email, pw);
    setBusy(false);
    if (r && !r.ok) setErr(r.error || "Sign in failed.");
  };
  const submitSetup = async () => {
    if (!email.trim() || !pw) { setErr("Enter an email and a new password."); return; }
    if (pw.length < 8) { setErr("Password must be at least 8 characters."); return; }
    if (!code) { setErr("Enter your current studio password to authorize setup."); return; }
    setErr(""); setBusy(true);
    try {
      const res = await fetch("/api/auth/setup", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: email.trim(), name: name.trim(), password: pw, setupCode: code }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) { window.location.reload(); } else { setErr(data.error || "Setup failed."); setBusy(false); }
    } catch (e) { setErr("Network error."); setBusy(false); }
  };
  const pwStyle = { width: "100%", border: `1px solid ${LINE}`, borderRadius: 8, padding: "10px 12px", fontSize: 14, fontFamily: "inherit", background: PAPER, color: BODY, boxSizing: "border-box" };
  if (mode === "setup") {
    return (
      <div style={{ maxWidth: 400, margin: "20px auto 0" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ width: 46, height: 46, borderRadius: "50%", background: INK, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><LayoutDashboard size={22} color="#fff" /></div>
          <div style={{ ...display, fontWeight: 700, fontSize: 26, color: INK, marginBottom: 6 }}>Create your admin account</div>
          <div style={{ fontSize: 13.5, color: STONE, lineHeight: 1.5 }}>First-time setup for the shared Dot One login. Authorize it with the studio password you use now.</div>
        </div>
        <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, padding: "22px 24px" }}>
          <FieldLabel>Studio email (@dot1.media)</FieldLabel>
          <TextInput value={email} onChange={setEmail} placeholder="you@dot1.media" />
          <FieldLabel>Your name</FieldLabel>
          <TextInput value={name} onChange={setName} placeholder="Optional" />
          <FieldLabel>New password</FieldLabel>
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 8 characters" style={pwStyle} />
          <PasswordMeter value={pw} />
          <FieldLabel>Current studio password</FieldLabel>
          <input type="password" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submitSetup(); }} placeholder="The password you sign in with today" style={pwStyle} />
          {err && <div style={{ marginTop: 10, fontSize: 12.5, color: DANGER, display: "flex", alignItems: "center", gap: 7 }}><AlertTriangle size={13} /> {err}</div>}
          <button onClick={submitSetup} disabled={busy} style={{ ...btnSolid, background: busy ? FAINT : INK, width: "100%", justifyContent: "center", marginTop: 14, padding: "11px" }}><LogIn size={15} /> {busy ? "Creating..." : "Create admin account"}</button>
        </div>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: STONE }}><span onClick={onBack} style={{ color: RED, cursor: "pointer" }}>← Back to portal home</span></div>
      </div>
    );
  }
  return (
    <div style={{ maxWidth: 400, margin: "20px auto 0" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ width: 46, height: 46, borderRadius: "50%", background: INK, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}><LayoutDashboard size={22} color="#fff" /></div>
        <div style={{ ...display, fontWeight: 700, fontSize: 26, color: INK, marginBottom: 6 }}>Studio Login</div>
        <div style={{ fontSize: 13.5, color: STONE, lineHeight: 1.5 }}>For Dot One Media staff only.</div>
      </div>
      <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, padding: "22px 24px" }}>
        <FieldLabel>Studio email</FieldLabel>
        <TextInput value={email} onChange={setEmail} placeholder="you@dot1.media" />
        <FieldLabel>Password</FieldLabel>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submitLogin(); }} placeholder="Your password" style={pwStyle} />
        {err && <div style={{ marginTop: 10, fontSize: 12.5, color: DANGER, display: "flex", alignItems: "center", gap: 7 }}><AlertTriangle size={13} /> {err}</div>}
        <button onClick={submitLogin} disabled={busy} style={{ ...btnSolid, background: busy ? FAINT : INK, width: "100%", justifyContent: "center", marginTop: 14, padding: "11px" }}><LogIn size={15} /> {busy ? "Signing in..." : "Sign in to studio"}</button>
      </div>
      <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: STONE }}><span onClick={onBack} style={{ color: RED, cursor: "pointer" }}>← Back to portal home</span></div>
    </div>
  );
}

export function LoginView({ onLogin, onBook, onStudio, onForgot }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [mode, setMode] = useState("login");
  const [sent, setSent] = useState(false);
  if (mode === "forgot") {
    return (
      <div style={{ maxWidth: 400, margin: "20px auto 0" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ ...display, fontWeight: 700, fontSize: 28, color: INK, marginBottom: 6 }}>Reset your password</div>
          <div style={{ fontSize: 13.5, color: STONE, lineHeight: 1.5 }}>Enter your email and we'll send you a reset link.</div>
        </div>
        <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, padding: "22px 24px" }}>
          {sent ? (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <Check size={26} color={OK} style={{ marginBottom: 10 }} />
              <div style={{ fontSize: 13.5, color: BODY, lineHeight: 1.6 }}>If that email is registered, a reset link is on its way. Check your inbox (and spam) — the link works for one hour.</div>
            </div>
          ) : (
            <>
              <FieldLabel>Email</FieldLabel>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && email.trim()) { onForgot(email); setSent(true); } }} placeholder="you@example.com" style={inputStyle} />
              <button onClick={() => { if (!email.trim()) return; onForgot(email); setSent(true); }} style={{ ...btnSolid, background: RED, width: "100%", justifyContent: "center", marginTop: 14, padding: "11px" }}>Send reset link</button>
            </>
          )}
        </div>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: STONE }}>
          <span onClick={() => { setMode("login"); setSent(false); }} style={{ color: RED, cursor: "pointer" }}>Back to login</span>
        </div>
      </div>
    );
  }
  return (
    <div style={{ maxWidth: 400, margin: "20px auto 0" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ ...display, fontWeight: 700, fontSize: 28, color: INK, marginBottom: 6 }}>Client Login</div>
        <div style={{ fontSize: 13.5, color: STONE, lineHeight: 1.5 }}>Sign in to check the status of your session.</div>
      </div>
      <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, padding: "22px 24px" }}>
        <FieldLabel>Email</FieldLabel>
        <TextInput value={email} onChange={setEmail} placeholder="you@example.com" />
        <FieldLabel>Password</FieldLabel>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && email.trim() && pw) onLogin(email, pw); }} placeholder="Your password" style={inputStyle} />
        <button onClick={() => { if (!email.trim() || !pw) return; onLogin(email, pw); }} style={{ ...btnSolid, background: RED, width: "100%", justifyContent: "center", marginTop: 14, padding: "11px" }}><LogIn size={15} /> Log in</button>
        <div style={{ textAlign: "center", marginTop: 12 }}><span onClick={() => { setMode("forgot"); setSent(false); }} style={{ ...mono, fontSize: 10.5, letterSpacing: "0.04em", color: STONE, cursor: "pointer" }}>Forgot password?</span></div>
      </div>
      <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: STONE }}>
        New here? <span onClick={onBook} style={{ color: RED, cursor: "pointer" }}>Book a session</span>{onStudio ? <span> · <span onClick={onStudio} style={{ color: STONE, cursor: "pointer" }}>Studio login</span></span> : null}
      </div>
    </div>
  );
}



export function InviteAccept({ token, showToast }) {
  const [name, setName] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (pw.length < 8) { showToast("Password must be at least 8 characters."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/invite", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token, name: name.trim(), password: pw }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { showToast("Welcome! Setting up your portal..."); window.location.href = "/"; }
      else { setBusy(false); showToast(data.error || "Could not create your account."); }
    } catch (e) { setBusy(false); showToast("Network error."); }
  };
  return (
    <div style={{ maxWidth: 400, margin: "20px auto 0" }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ ...display, fontWeight: 700, fontSize: 28, color: INK, marginBottom: 6 }}>Create your account</div>
        <div style={{ fontSize: 13.5, color: STONE, lineHeight: 1.5 }}>Set a password to track your session and any future ones, all in one place.</div>
      </div>
      <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, padding: "22px 24px" }}>
        <FieldLabel>Your name</FieldLabel>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name (optional)" style={inputStyle} />
        <FieldLabel>Choose a password</FieldLabel>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} placeholder="At least 8 characters" style={inputStyle} />
        <PasswordMeter value={pw} />
        <button onClick={submit} disabled={busy} style={{ ...btnSolid, background: busy ? FAINT : RED, width: "100%", justifyContent: "center", marginTop: 14, padding: "11px" }}>{busy ? "Creating..." : "Create account"}</button>
      </div>
    </div>
  );
}

