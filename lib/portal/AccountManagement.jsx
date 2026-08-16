import React, { useState } from "react";
import { Search, KeyRound, AtSign, UserCog } from "lucide-react";
import { RED, INK, BODY, STONE, FAINT, LINE, CREAM, display, mono, card, inputStyle, btnSolid, btnGhost } from "./theme";
import { FieldLabel, PasswordMeter } from "./ui";

// Studio screen to help a client with their account: reset their password or change their login email.
// Talks to /api/users (lookup) and /api/client-account (both admin-guarded server-side).
export function AccountManagement({ state, showToast }) {
  const [query, setQuery] = useState("");
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const emails = Array.from(new Set((state.sessions || []).map((s) => (s.clientEmail || "").toLowerCase()).filter(Boolean))).sort();

  const lookup = async () => {
    const e = query.trim().toLowerCase();
    if (!e) { showToast("Enter a client email to look up."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/users?email=" + encodeURIComponent(e));
      const data = await res.json().catch(() => ({}));
      if (data.user) { setClient(data.user); setNewPw(""); setNewEmail(""); }
      else { setClient(null); showToast("No account found with that email."); }
    } catch (err) { showToast("Could not look up that client."); }
    setLoading(false);
  };

  const resetPw = async () => {
    if (newPw.length < 8) { showToast("Password must be at least 8 characters."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/client-account", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "reset-password", email: client.email, password: newPw }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { showToast("Password updated. Share it with " + (client.name || "the client") + " and ask them to change it after signing in."); setNewPw(""); }
      else showToast(data.error || "Could not update the password.");
    } catch (err) { showToast("Could not update the password."); }
    setBusy(false);
  };

  const changeEmail = async () => {
    const ne = newEmail.trim().toLowerCase();
    if (!ne) { showToast("Enter the new email address."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/client-account", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "change-email", email: client.email, newEmail: ne }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { showToast("Email changed to " + ne + "."); setClient({ ...client, email: ne }); setQuery(ne); setNewEmail(""); }
      else showToast(data.error || "Could not change the email.");
    } catch (err) { showToast("Could not change the email."); }
    setBusy(false);
  };

  return (
    <div style={{ maxWidth: 620 }}>
      <div style={{ ...mono, fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: RED, marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}><UserCog size={15} /> Client Accounts</div>
      <div style={{ fontSize: 13.5, color: BODY, lineHeight: 1.55, marginBottom: 20 }}>Look up a client by email to reset their password or change the email on their account. Use this when a client is locked out or needs to switch the email they sign in with.</div>

      <FieldLabel>Find a client by email</FieldLabel>
      <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
        <input list="dot1-client-emails" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") lookup(); }} placeholder="client@example.com" style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
        <button onClick={lookup} disabled={loading} style={{ ...btnSolid, background: INK, whiteSpace: "nowrap" }}><Search size={14} /> {loading ? "Finding..." : "Find"}</button>
      </div>
      <datalist id="dot1-client-emails">{emails.map((e) => <option key={e} value={e} />)}</datalist>

      {client && (
        <div style={{ ...card, marginTop: 20, padding: 20 }}>
          <div style={{ ...display, fontWeight: 700, fontSize: 18, color: INK }}>{client.name || "Client"}</div>
          <div style={{ ...mono, fontSize: 12, color: STONE, marginTop: 2, marginBottom: 18 }}>{client.email}</div>

          <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: STONE, marginBottom: 8, display: "flex", alignItems: "center", gap: 7 }}><KeyRound size={13} /> Reset password</div>
          <input type="text" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="New password (at least 8 characters)" style={{ ...inputStyle, marginBottom: 2 }} />
          <PasswordMeter value={newPw} />
          <button onClick={resetPw} disabled={busy || newPw.length < 8} style={{ ...btnSolid, background: RED, marginTop: 10, opacity: (busy || newPw.length < 8) ? 0.6 : 1 }}>Set new password</button>

          <div style={{ height: 1, background: LINE, margin: "22px 0" }} />

          <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: STONE, marginBottom: 8, display: "flex", alignItems: "center", gap: 7 }}><AtSign size={13} /> Change login email</div>
          <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="new-email@example.com" style={{ ...inputStyle, marginBottom: 2 }} />
          <div style={{ ...mono, fontSize: 10, color: FAINT, marginTop: 4, lineHeight: 1.4 }}>Moves the account and all of this client's bookings to the new email. They will sign in with it from then on.</div>
          <button onClick={changeEmail} disabled={busy} style={{ ...btnGhost, marginTop: 10 }}>Change email</button>
        </div>
      )}
    </div>
  );
}

