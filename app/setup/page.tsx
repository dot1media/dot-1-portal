"use client";
import { useEffect, useState } from "react";

const DEFAULTS = { orgName: "", tagline: "", accent: "#b81616", background: "#f4f0e7", paper: "#ffffff", ink: "#1a1a17", line: "#e2ded4", logo: "" };

export default function Setup() {
  const [f, setF] = useState<any>({ ...DEFAULTS });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [needLogin, setNeedLogin] = useState(false);

  useEffect(() => {
    fetch("/api/brand").then((r) => r.json()).then((b) => {
      if (b && b.configured) setF((p: any) => ({ ...p, orgName: b.orgName || "", tagline: b.tagline || "", accent: b.accent || p.accent, background: b.background || p.background, paper: b.paper || p.paper, ink: b.ink || p.ink, line: b.line || p.line }));
    }).catch(() => {});
  }, []);

  const set = (k: string) => (e: any) => setF((p: any) => ({ ...p, [k]: e.target.value }));
  const onLogo = (e: any) => { const file = e.target.files?.[0]; if (!file) return; const r = new FileReader(); r.onload = () => setF((p: any) => ({ ...p, logo: r.result })); r.readAsDataURL(file); };

  async function save() {
    setBusy(true); setMsg(""); setNeedLogin(false);
    try {
      const r = await fetch("/api/brand", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
      if (r.status === 401) { setNeedLogin(true); setBusy(false); return; }
      const d = await r.json();
      if (d.ok) { window.location.href = "/"; } else setMsg(d.error || "Could not save.");
    } catch { setMsg("Could not save. Please try again."); }
    setBusy(false);
  }

  const label: any = { display: "block", fontSize: 11, letterSpacing: ".06em", textTransform: "uppercase", color: "#6f6d65", marginBottom: 6, marginTop: 18 };
  const input: any = { width: "100%", border: "1px solid #e2ded4", borderRadius: 8, padding: "10px 12px", fontSize: 14, boxSizing: "border-box", fontFamily: "inherit" };
  const swatch: any = { width: 46, height: 40, border: "1px solid #e2ded4", borderRadius: 8, padding: 2, background: "#fff", cursor: "pointer" };
  const colorRow = (k: string, name: string) => (
    <div><label style={label}>{name}</label><div style={{ display: "flex", gap: 10, alignItems: "center" }}><input type="color" style={swatch} value={f[k]} onChange={set(k)} /><input style={input} value={f[k]} onChange={set(k)} /></div></div>
  );

  return (
    <div style={{ maxWidth: 580, margin: "6vh auto", padding: "0 24px 60px", fontFamily: "Archivo, system-ui, sans-serif", color: "#141210" }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: ".28em", textTransform: "uppercase", color: f.accent, marginBottom: 10 }}>Set up your studio</div>
      <h1 style={{ fontFamily: "'Bodoni Moda', Georgia, serif", fontWeight: 700, fontSize: 32, margin: "0 0 6px" }}>Make it yours</h1>
      <p style={{ color: "#6f6d65", margin: 0 }}>A few details and your studio takes on your brand. You can change these any time.</p>

      <label style={label}>Organization name</label>
      <input style={input} value={f.orgName} onChange={set("orgName")} placeholder="Your Organization" />
      <label style={label}>Tagline</label>
      <input style={input} value={f.tagline} onChange={set("tagline")} placeholder="Your tagline" />

      <label style={label}>Logo</label>
      <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={onLogo} />
      {f.logo ? <div style={{ marginTop: 12, padding: "12px 14px", border: "1px solid #e2ded4", borderRadius: 8, display: "inline-block" }}><img src={f.logo} alt="logo preview" style={{ height: 46, display: "block" }} /></div> : null}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 4 }}>
        {colorRow("accent", "Accent")}
        {colorRow("background", "Background")}
        {colorRow("paper", "Surface")}
        {colorRow("ink", "Text")}
      </div>

      <button onClick={save} disabled={busy} style={{ marginTop: 28, padding: "13px 24px", borderRadius: 999, border: 0, background: f.accent, color: "#fff", fontWeight: 600, cursor: "pointer", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, letterSpacing: ".06em", textTransform: "uppercase" }}>{busy ? "Saving..." : "Save and open my studio"}</button>
      {needLogin && <p style={{ marginTop: 16, color: "#b3261e" }}>Please sign in as your studio admin first, then come back to <a href="/setup" style={{ color: f.accent }}>this page</a>.</p>}
      {msg && <p style={{ marginTop: 16, color: "#b3261e" }}>{msg}</p>}
    </div>
  );
}
