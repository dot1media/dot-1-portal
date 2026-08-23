import React, { useState, useEffect } from "react";
import { UserPlus, Trash2, KeyRound, ShieldCheck, AlertTriangle, ChevronDown, ChevronUp, Ban, CheckCircle2 } from "lucide-react";
import { RED, INK, BODY, STONE, FAINT, LINE, PAPER, CREAM, OK, DANGER, display, mono, inputStyle, btnSolid } from "./theme";
import { FieldLabel, TextInput, PasswordMeter } from "./ui";

// The three suite apps and their valid roles, mirrored from lib/suite.ts so the UI can build the
// per-app access controls. Kept here (not imported) because this is a client component.
const APPS = [
  { id: "studio", name: "Studio", roles: ["admin", "manager", "viewer"] },
  { id: "assets", name: "Assets", roles: ["admin", "manager", "viewer"] },
  { id: "editorial", name: "Editorial", roles: ["owner", "editor", "reporter", "producer", "viewer"] },
];
const TIERS = [
  { id: "owner", label: "Owner", blurb: "Full control of every app and every account." },
  { id: "admin", label: "Admin", blurb: "Manages user accounts. Reaches granted apps." },
  { id: "user", label: "User", blurb: "Reaches only granted apps. No account management." },
];

function emptyGrants() {
  const g = {};
  for (const a of APPS) g[a.id] = { access: false, role: a.roles[a.roles.length - 1] };
  return g;
}
function normalize(raw) {
  const base = emptyGrants();
  if (raw && typeof raw === "object") {
    for (const a of APPS) {
      const r = raw[a.id];
      if (r && typeof r === "object") base[a.id] = { access: !!r.access, role: a.roles.includes(r.role) ? r.role : a.roles[a.roles.length - 1] };
    }
  }
  return base;
}

// Reusable per-app access editor: a row per app with an access toggle and a role dropdown.
function GrantEditor({ grants, setGrants, disabled }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {APPS.map((app) => {
        const g = grants[app.id] || { access: false, role: app.roles[app.roles.length - 1] };
        return (
          <div key={app.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", border: `1px solid ${LINE}`, borderRadius: 9, background: g.access ? "#fff" : CREAM, opacity: disabled ? 0.55 : 1 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: disabled ? "default" : "pointer", flex: 1 }}>
              <input type="checkbox" checked={g.access} disabled={disabled}
                onChange={(e) => setGrants({ ...grants, [app.id]: { ...g, access: e.target.checked } })} />
              <span style={{ fontSize: 13, color: INK, fontWeight: 500 }}>{app.name}</span>
            </label>
            <select value={g.role} disabled={disabled || !g.access}
              onChange={(e) => setGrants({ ...grants, [app.id]: { ...g, role: e.target.value } })}
              style={{ ...mono, fontSize: 11, padding: "6px 8px", borderRadius: 7, border: `1px solid ${LINE}`, background: PAPER, color: STONE, textTransform: "capitalize", opacity: g.access ? 1 : 0.5 }}>
              {app.roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        );
      })}
    </div>
  );
}

function TierPicker({ tier, setTier }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
      {TIERS.map((t) => (
        <button key={t.id} onClick={() => setTier(t.id)} type="button"
          style={{ textAlign: "left", padding: "10px 12px", borderRadius: 9, cursor: "pointer",
            border: `1.5px solid ${tier === t.id ? RED : LINE}`, background: tier === t.id ? "#fff" : CREAM }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: tier === t.id ? RED : INK }}>{t.label}</div>
          <div style={{ fontSize: 10.5, color: STONE, marginTop: 3, lineHeight: 1.35 }}>{t.blurb}</div>
        </button>
      ))}
    </div>
  );
}

export function AdminAccounts({ showToast }) {
  const [admins, setAdmins] = useState([]);
  const [meTier, setMeTier] = useState("user");
  const [meEmail, setMeEmail] = useState("");
  const [loading, setLoading] = useState(true);

  // Add form
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [pw, setPw] = useState("");
  const [tier, setTier] = useState("user");
  const [grants, setGrants] = useState(emptyGrants());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // Per-row edit state
  const [openId, setOpenId] = useState(null);
  const [editTier, setEditTier] = useState("user");
  const [editGrants, setEditGrants] = useState(emptyGrants());
  const [resetId, setResetId] = useState(null);
  const [resetPw, setResetPw] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const d = await fetch("/api/admin/accounts").then((r) => r.json());
      setAdmins(d.admins || []);
      setMeTier(d.meTier || "user");
      setMeEmail(d.meEmail || "");
    } catch (e) {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const canEditTarget = (targetTier) => meTier === "owner" || (meTier === "admin" && targetTier === "user");

  const add = async () => {
    setErr("");
    if (!/@dot1\.media$/i.test(email.trim())) { setErr("Email must be a @dot1.media address."); return; }
    if (pw.length < 8) { setErr("Password must be at least 8 characters."); return; }
    if (!canEditTarget(tier)) { setErr("Only an owner can create owners or admins."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/accounts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: email.trim(), name: name.trim(), password: pw, tier, grants }) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { showToast("Account added."); setEmail(""); setName(""); setPw(""); setTier("user"); setGrants(emptyGrants()); load(); }
      else { setErr(data.error || "Could not add account."); }
    } catch (e) { setErr("Network error."); }
    setBusy(false);
  };

  const openEdit = (a) => {
    if (openId === a.id) { setOpenId(null); return; }
    setOpenId(a.id); setResetId(null);
    setEditTier(a.tier || "user");
    setEditGrants(normalize(a.grants));
  };
  const saveAccess = async (a) => {
    try {
      const res = await fetch(`/api/admin/accounts/${a.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ tier: editTier, grants: editGrants, disabled: !!a.disabled }) });
      const d = await res.json().catch(() => ({}));
      if (res.ok) { showToast("Access updated."); setOpenId(null); load(); } else showToast(d.error || "Could not update.");
    } catch (e) { showToast("Network error."); }
  };
  const toggleDisabled = async (a) => {
    try {
      const res = await fetch(`/api/admin/accounts/${a.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ tier: a.tier, grants: normalize(a.grants), disabled: !a.disabled }) });
      const d = await res.json().catch(() => ({}));
      if (res.ok) { showToast(a.disabled ? "Account enabled." : "Account disabled."); load(); } else showToast(d.error || "Could not change.");
    } catch (e) { showToast("Network error."); }
  };
  const remove = async (a) => {
    if (!window.confirm(`Remove ${a.email}? They will lose access to every Dot One service.`)) return;
    try {
      const res = await fetch(`/api/admin/accounts/${a.id}`, { method: "DELETE" });
      const d = await res.json().catch(() => ({}));
      if (res.ok) { showToast("Account removed."); load(); } else showToast(d.error || "Could not remove.");
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

  const tierChip = (t) => {
    const c = t === "owner" ? RED : t === "admin" ? INK : STONE;
    return <span style={{ ...mono, fontSize: 9.5, letterSpacing: "0.1em", textTransform: "uppercase", color: c, border: `1px solid ${c}33`, borderRadius: 20, padding: "3px 9px" }}>{t}</span>;
  };

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ ...display, fontSize: 22, fontWeight: 700, color: INK, display: "flex", alignItems: "center", gap: 9 }}><ShieldCheck size={20} color={RED} /> Suite accounts</div>
        <div style={{ fontSize: 13, color: STONE, marginTop: 4 }}>One account signs in to the whole suite. Set each person's tier and which apps they reach, with a role per app. @dot1.media only.</div>
      </div>

      <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
        {loading ? (
          <div style={{ ...mono, fontSize: 12, color: FAINT, padding: 20 }}>Loading...</div>
        ) : admins.length === 0 ? (
          <div style={{ ...mono, fontSize: 12, color: FAINT, padding: 20 }}>No accounts yet.</div>
        ) : admins.map((a) => (
          <div key={a.id} style={{ borderTop: `1px solid ${LINE}`, padding: "12px 16px", opacity: a.disabled ? 0.6 : 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, color: INK, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>{a.name || a.email.split("@")[0]} {tierChip(a.tier)} {a.disabled && <span style={{ ...mono, fontSize: 9.5, color: DANGER, textTransform: "uppercase" }}>disabled</span>}</div>
                <div style={{ ...mono, fontSize: 11, color: STONE }}>{a.email}</div>
              </div>
              {canEditTarget(a.tier) && <button onClick={() => openEdit(a)} title="Edit access" style={{ ...mono, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: STONE, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 7, padding: "7px 11px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}>{openId === a.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />} Access</button>}
              {canEditTarget(a.tier) && <button onClick={() => { setResetId(resetId === a.id ? null : a.id); setResetPw(""); setOpenId(null); }} title="Reset password" style={{ ...mono, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em", color: STONE, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 7, padding: "7px 11px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 5 }}><KeyRound size={12} /> Reset</button>}
              {canEditTarget(a.tier) && a.email !== meEmail && <button onClick={() => toggleDisabled(a)} title={a.disabled ? "Enable" : "Disable"} style={{ background: "transparent", border: "none", cursor: "pointer", color: a.disabled ? OK : STONE, padding: 5 }}>{a.disabled ? <CheckCircle2 size={15} /> : <Ban size={15} />}</button>}
              {canEditTarget(a.tier) && a.email !== meEmail && <button onClick={() => remove(a)} title="Remove" style={{ background: "transparent", border: "none", cursor: "pointer", color: DANGER, padding: 5 }}><Trash2 size={15} /></button>}
            </div>

            {resetId === a.id && (
              <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
                <input type="password" value={resetPw} onChange={(e) => setResetPw(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") doReset(a); }} placeholder="New password (8+ characters)" style={{ ...inputStyle, marginTop: 0, flex: 1 }} />
                <button onClick={() => doReset(a)} style={{ ...btnSolid, background: INK, padding: "9px 14px" }}>Set</button>
              </div>
            )}

            {openId === a.id && (
              <div style={{ marginTop: 12, padding: 14, background: CREAM, border: `1px solid ${LINE}`, borderRadius: 10 }}>
                <FieldLabel>Tier</FieldLabel>
                <TierPicker tier={editTier} setTier={setEditTier} />
                <div style={{ height: 14 }} />
                <FieldLabel>App access and role</FieldLabel>
                <GrantEditor grants={editGrants} setGrants={setEditGrants} disabled={editTier === "owner"} />
                {editTier === "owner" && <div style={{ fontSize: 11.5, color: STONE, marginTop: 8 }}>Owners reach every app automatically.</div>}
                <button onClick={() => saveAccess(a)} style={{ ...btnSolid, background: RED, marginTop: 14, padding: "9px 16px" }}><CheckCircle2 size={14} /> Save access</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {(meTier === "owner" || meTier === "admin") && (
        <div style={{ background: CREAM, border: `1px solid ${LINE}`, borderRadius: 12, padding: 20 }}>
          <div style={{ ...mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: STONE, marginBottom: 14, display: "flex", alignItems: "center", gap: 7 }}><UserPlus size={13} /> Add an account</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div><FieldLabel>Email (@dot1.media)</FieldLabel><TextInput value={email} onChange={setEmail} placeholder="name@dot1.media" /></div>
            <div><FieldLabel>Name</FieldLabel><TextInput value={name} onChange={setName} placeholder="Optional" /></div>
          </div>
          <FieldLabel>Temporary password</FieldLabel>
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="At least 8 characters" style={inputStyle} />
          <PasswordMeter value={pw} />
          <div style={{ height: 14 }} />
          <FieldLabel>Tier</FieldLabel>
          <TierPicker tier={tier} setTier={setTier} />
          <div style={{ height: 14 }} />
          <FieldLabel>App access and role</FieldLabel>
          <GrantEditor grants={grants} setGrants={setGrants} disabled={tier === "owner"} />
          {tier === "owner" && <div style={{ fontSize: 11.5, color: STONE, marginTop: 8 }}>Owners reach every app automatically.</div>}
          {err && <div style={{ marginTop: 12, fontSize: 12.5, color: DANGER, display: "flex", alignItems: "center", gap: 7 }}><AlertTriangle size={13} /> {err}</div>}
          <button onClick={add} disabled={busy} style={{ ...btnSolid, background: busy ? FAINT : RED, marginTop: 14, padding: "10px 16px" }}><UserPlus size={15} /> {busy ? "Adding..." : "Add account"}</button>
        </div>
      )}
    </div>
  );
}
