import React, { useState, useEffect, useMemo } from "react";
import { Search, KeyRound, AtSign, UserCog, Users, RefreshCw, CheckCircle2, CircleDashed, UserPlus, X } from "lucide-react";
import { RED, INK, BODY, STONE, FAINT, LINE, CREAM, display, mono, card, inputStyle, btnSolid, btnGhost } from "./theme";
import { FieldLabel, PasswordMeter } from "./ui";

// Studio screen to help a client with their account: reset their password or change their login email.
// Talks to /api/users (lookup + list) and /api/client-account (both admin-guarded server-side).
export function AccountManagement({ state, showToast }) {
  const [query, setQuery] = useState("");
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [all, setAll] = useState(null); // null = not loaded yet
  const [listLoading, setListLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPhone, setCPhone] = useState("");
  const [cPw, setCPw] = useState("");

  const emails = Array.from(new Set((state.sessions || []).map((s) => (s.clientEmail || "").toLowerCase()).filter(Boolean))).sort();

  // Bookings per client email, so the list can show how many sessions each account has.
  const bookingsByEmail = useMemo(() => {
    const m = {};
    for (const s of state.sessions || []) {
      const e = (s.clientEmail || "").toLowerCase();
      if (e) m[e] = (m[e] || 0) + 1;
    }
    return m;
  }, [state.sessions]);

  const loadAll = async () => {
    setListLoading(true);
    try {
      const res = await fetch("/api/users?all=1");
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.users)) setAll(data.users);
      else { setAll([]); showToast(data.error || "Could not load accounts."); }
    } catch (err) { setAll([]); showToast("Could not load accounts."); }
    setListLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  const select = (u) => { setClient(u); setNewPw(""); setNewEmail(""); setQuery(u.email || ""); };

  const shown = (all || []).filter((u) => {
    const f = filter.trim().toLowerCase();
    if (!f) return true;
    return (u.email || "").toLowerCase().includes(f) || (u.name || "").toLowerCase().includes(f);
  });

  const fmtDate = (d) => { if (!d) return null; try { return new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }); } catch { return null; } };

  const createAccount = async () => {
    const em = cEmail.trim().toLowerCase();
    if (!cName.trim()) { showToast("Enter the client's name."); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { showToast("Enter a valid email address."); return; }
    if (cPw && cPw.length < 8) { showToast("Password must be at least 8 characters."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/client-account", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "create", name: cName.trim(), email: em, phone: cPhone.trim(), password: cPw }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.user) {
        showToast("Account created for " + em + (cPw ? ". Share the password and ask them to change it after signing in." : ". They can set a password via the sign-in page."));
        setAll((prev) => prev ? [data.user, ...prev.filter((u) => u.id !== data.user.id)] : [data.user]);
        select(data.user);
        setCreateOpen(false); setCName(""); setCEmail(""); setCPhone(""); setCPw("");
      } else showToast(data.error || "Could not create the account.");
    } catch (err) { showToast("Could not create the account."); }
    setBusy(false);
  };

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
      if (res.ok) { showToast("Email changed to " + ne + "."); setClient({ ...client, email: ne }); setQuery(ne); setNewEmail(""); setAll((prev) => prev ? prev.map((u) => u.id === client.id ? { ...u, email: ne } : u) : prev); }
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

      {/* Full list of every client account, so nothing has to be guessed by email. */}
      <div style={{ ...card, marginTop: 22, padding: 0, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 16px", borderBottom: `1px solid ${LINE}`, background: CREAM }}>
          <Users size={15} color={RED} />
          <div style={{ ...mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: INK }}>All accounts{all ? ` · ${all.length}` : ""}</div>
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by name or email" style={{ ...inputStyle, marginBottom: 0, flex: 1, maxWidth: 220, marginLeft: "auto", fontSize: 12.5, padding: "7px 10px" }} />
          <button onClick={() => setCreateOpen((v) => !v)} title="Create an account" style={{ ...btnSolid, background: INK, padding: "7px 11px", whiteSpace: "nowrap" }}><UserPlus size={13} /> New</button>
          <button onClick={loadAll} disabled={listLoading} title="Refresh" style={{ ...btnGhost, padding: "7px 10px", whiteSpace: "nowrap", opacity: listLoading ? 0.6 : 1 }}><RefreshCw size={13} /></button>
        </div>

        {createOpen && (
          <div style={{ padding: 16, borderBottom: `1px solid ${LINE}`, background: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", color: RED }}>Create a client account</div>
              <button onClick={() => setCreateOpen(false)} style={{ ...btnGhost, padding: "4px 7px" }}><X size={13} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <input value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Client name" style={{ ...inputStyle, marginBottom: 0 }} />
              <input type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} placeholder="client@example.com" style={{ ...inputStyle, marginBottom: 0 }} />
              <input value={cPhone} onChange={(e) => setCPhone(e.target.value)} placeholder="Phone (optional)" style={{ ...inputStyle, marginBottom: 0 }} />
              <input type="text" value={cPw} onChange={(e) => setCPw(e.target.value)} placeholder="Temp password (optional)" style={{ ...inputStyle, marginBottom: 0 }} />
            </div>
            <div style={{ ...mono, fontSize: 10, color: FAINT, marginTop: 7, lineHeight: 1.45 }}>Leave the password blank to let the client set their own from the sign-in page. Any bookings under this email link to the account automatically.</div>
            <button onClick={createAccount} disabled={busy} style={{ ...btnSolid, background: RED, marginTop: 11, opacity: busy ? 0.6 : 1 }}><UserPlus size={14} /> Create account</button>
          </div>
        )}
        <div style={{ maxHeight: 340, overflowY: "auto" }}>
          {all === null || listLoading ? (
            <div style={{ padding: 20, fontSize: 13, color: STONE }}>Loading accounts…</div>
          ) : shown.length === 0 ? (
            <div style={{ padding: 20, fontSize: 13, color: STONE }}>{all.length === 0 ? "No client accounts yet." : "No accounts match that filter."}</div>
          ) : shown.map((u) => {
            const active = client && client.id === u.id;
            const created = fmtDate(u.created_at);
            const bk = bookingsByEmail[(u.email || "").toLowerCase()] || 0;
            return (
              <button key={u.id} onClick={() => select(u)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", padding: "11px 16px", border: "none", borderBottom: `1px solid ${LINE}`, background: active ? CREAM : "transparent", cursor: "pointer" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...display, fontWeight: 650, fontSize: 14.5, color: INK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.name || "Client"}</div>
                  <div style={{ ...mono, fontSize: 11.5, color: STONE, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{u.email}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                  <div title={u.has_password ? "Finished sign-up (password set)" : "Invited — hasn't set a password yet"} style={{ ...mono, fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", color: u.has_password ? "#2e7d32" : FAINT, display: "flex", alignItems: "center", gap: 4 }}>
                    {u.has_password ? <CheckCircle2 size={12} /> : <CircleDashed size={12} />}{u.has_password ? "Active" : "Invited"}
                  </div>
                  <div style={{ ...mono, fontSize: 10, color: FAINT }}>{bk > 0 ? `${bk} booking${bk === 1 ? "" : "s"}` : "—"}{created ? ` · ${created}` : ""}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

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

