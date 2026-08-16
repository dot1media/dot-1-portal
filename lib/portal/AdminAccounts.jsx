import React, { useState, useEffect } from "react";
import { UserPlus, Trash2, KeyRound, ShieldCheck, AlertTriangle } from "lucide-react";
import { RED, INK, BODY, STONE, FAINT, LINE, PAPER, CREAM, OK, DANGER, display, mono, inputStyle, btnSolid } from "./theme";
import { FieldLabel, TextInput, PasswordMeter } from "./ui";

// Manage the admin accounts that sign in across the whole Dot One suite. @dot1.media only.
export function AdminAccounts({ showToast }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [resetId, setResetId] = useState(null);
  const [resetPw, setResetPw] = useState("");

  const load = async () => {
    setLoading(true);
    try { const d = await fetch("/api/admin/accounts").then((r) => r.json()); setAdmins(d.admins || []); } catch (e) {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    setErr("");
    if (!/@dot1\.media$/i.test(email.trim())) { setErr("Email must be a @dot1.media address."); return; }
    if (pw.length < 8) { setErr("Password must be at least 8 characters."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/accounts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: email.trim(), name: name.trim(), password: pw }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { showToast("Admin added."); setEmail(""); setName(""); setPw(""); load(); }
      else { setErr(data.error || "Could not add admin."); }
    } catch (e) { setErr("Network error."); }
    setBusy(false);
  };
  const remove = async (a) => {
    if (!window.confirm(`Remove ${a.email}? They will lose access to every Dot One service.`)) return;
    try {
      const res = await fetch(`/api/admin/accounts/${a.id}`, { method: "DELETE" });
      const d = await res.json().catch(() => ({}));
      if (res.ok) { showToast("Admin removed."); load(); } else showToast(d.error || "Could not remove.");
    } catch (e) { showToast("Network error."); }
  };
  const doReset = async (a) => {
    if (resetPw.length < 8) { showToast("Password must be at least 8 characters."); return; }
    try {
      const res = await fetch(`/api/admin/accounts/${a.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: resetPw }) });
      const d = await res.json().catch(() => ({}));
      if (res.ok) { showToast("Password reset."); setResetId(null); setResetPw(""); } else showToast(d.error || "Could not reset.");
    } catch (e) { showToast("Network error."); }
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ ...display, fontSize: 22, fontWeight: 700, color: INK, display: "flex", alignItems: "center", gap: 9 }}><ShieldCheck size={20} color={RED} /> Admin accounts</div>
        <div style={{ fontSize: 13, color: STONE, marginTop: 4 }}>One account signs in to every Dot One service, portal, assets, and news. Restricted to @dot1.media emails.</div>
      </div>

      <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
        {loading ? (
          <div style={{ ...mono, fontSize: 12, color: FAINT, padding: 20 }}>Loading...</div>
        ) : admins.length === 0 ? (
          <div style={{ ...mono, fontSize: 12, color: FAINT, padding: 20 }}>No admin accounts yet.</div>
        ) : admins.map((a) => (
          <div key={a.id} style={{ borderTop: `1px solid ${LINE}`, padding: "12px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, color: INK, fontWeight: 500 }}>{a.name || a.email.split("@")[0]}</div>
                <div style={{ ...mono, fontSize: 11, color: STONE }}>{a.email}</div>
              </div>
              <button onClick={() => { setResetId(resetId === a.id ? null : a.id); setResetPw(""); }} title="Reset password" style={{ ...mono, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: STONE, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 7, padding: "7px 11px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}><KeyRound size={12} /> Reset</button>
              <button onClick={() => remove(a)} title="Remove admin" style={{ background: "transparent", border: "none", cursor: "pointer", color: DANGER, padding: 5 }}><Trash2 size={15} /></button>
            </div>
            {resetId === a.id && (
              <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
                <input type="password" value={resetPw} onChange={(e) => setResetPw(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") doReset(a); }} placeholder="New password (8+ characters)" style={{ ...inputStyle, marginTop: 0, flex: 1 }} />
                <button onClick={() => doReset(a)} style={{ ...btnSolid, background: INK, padding: "9px 14px" }}>Set</button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ background: CREAM, border: `1px solid ${LINE}`, borderRadius: 12, padding: 20 }}>
        <div style={{ ...mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: STONE, marginBottom: 14, display: "flex", alignItems: "center", gap: 7 }}><UserPlus size={13} /> Add an admin</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div><FieldLabel>Email (@dot1.media)</FieldLabel><TextInput value={email} onChange={setEmail} placeholder="name@dot1.media" /></div>
          <div><FieldLabel>Name</FieldLabel><TextInput value={name} onChange={setName} placeholder="Optional" /></div>
        </div>
        <FieldLabel>Temporary password</FieldLabel>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 8 characters" style={inputStyle} />
        <PasswordMeter value={pw} />
        {err && <div style={{ marginTop: 10, fontSize: 12.5, color: DANGER, display: "flex", alignItems: "center", gap: 7 }}><AlertTriangle size={13} /> {err}</div>}
        <button onClick={add} disabled={busy} style={{ ...btnSolid, background: busy ? FAINT : RED, marginTop: 14, padding: "10px 16px" }}><UserPlus size={15} /> {busy ? "Adding..." : "Add admin"}</button>
      </div>
    </div>
  );
}
