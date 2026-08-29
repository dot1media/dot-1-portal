// Dot One Media portal - direct booking links panel (generate/revoke shareable held-slot links).
import React, { useState } from "react";
import { Ban, Check, Copy, Eye, Link as LinkIcon, Link2, MessageCircle, Send, Smartphone } from "lucide-react";
import { RED, INK, BODY, STONE, FAINT, LINE, PAPER, CREAM, WARN, DANGER, display, mono, inputStyle, iconBtnStyle, shareBtn, btnSolid } from "./theme";
import { GROUPS, GROUP_KEYS } from "./groups";
import { fmtDate, fmtTime, money } from "./format";
import { PORTAL_BASE } from "./constants";
import { FieldLabel, TextInput, EmptyState } from "./ui";
import { useIsMobile } from "./hooks";

export function DirectLinks({ state, createDirectLink, revokeDirectLink, openDirectLink, showToast }) {
  const isMobile = useIsMobile();
  const [group, setGroup] = useState("photo");
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [recipient, setRecipient] = useState("");
  const [justMade, setJustMade] = useState(null);
  const [inviteAccount, setInviteAccount] = useState(true);
  const g = GROUPS[group];
  const groupServices = state.services.filter((s) => s.group === group);
  const svc = state.services.find((s) => s.id === serviceId);

  const generate = () => {
    if (!svc) { showToast("Choose a service first."); return; }
    if (!date || !time) { showToast("Pick a date and time."); return; }
    const res = createDirectLink({ group, serviceId: svc.id, serviceName: svc.name, price: Number(svc.price) || 0, date, time, recipient: recipient.trim(), inviteAccount });
    if (!res.ok) { showToast(res.error); return; }
    setJustMade(res.link);
    setServiceId(""); setDate(""); setTime(""); setRecipient("");
    showToast("Direct booking link created and slot reserved.");
  };

  const copy = async (url) => { try { await navigator.clipboard.writeText(url); showToast("Link copied to clipboard."); } catch (e) { showToast("Select the link text to copy it."); } };
  const linkUrl = (l) => PORTAL_BASE + l.token;

  return (
    <div>
      <div style={{ marginBottom: 4 }}><span style={{ ...mono, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: RED }}>Send Direct Booking Link</span></div>
      <h2 style={{ ...display, fontWeight: 700, fontSize: 24, color: INK, marginBottom: 8, letterSpacing: "-0.01em" }}>Reserve a slot for one specific client</h2>
      <p style={{ fontSize: 13.5, color: BODY, lineHeight: 1.55, maxWidth: 640, marginBottom: 24 }}>
        Pick a service and an exact date and time, then generate a private link to text or send through Messenger. The slot is held the moment you create the link, so no one else can take it. The link works once, for one client.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24 }}>
        {/* generator */}
        <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, padding: "18px 20px", alignSelf: "start" }}>
          <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, marginBottom: 14 }}>Create a link</div>

          <FieldLabel>Service group</FieldLabel>
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {GROUP_KEYS.map((k) => { const gg = GROUPS[k]; const active = group === k; return (
              <button key={k} onClick={() => { setGroup(k); setServiceId(""); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 11px", borderRadius: 7, cursor: "pointer", fontSize: 12, border: `1px solid ${active ? gg.color : LINE}`, background: active ? gg.color : PAPER, color: active ? "#fff" : STONE }}><gg.Icon size={12} /> {gg.label}</button>
            ); })}
          </div>

          <FieldLabel>Service / project type</FieldLabel>
          {groupServices.length === 0 ? (
            <div style={{ ...mono, fontSize: 10.5, color: FAINT, marginBottom: 12, lineHeight: 1.5 }}>No {g.label.toLowerCase()} services yet. Create one in Services & Add-ons first.</div>
          ) : (
            <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} style={{ ...inputStyle, marginBottom: 12, cursor: "pointer" }}>
              <option value="">Choose a service…</option>
              {groupServices.map((s) => <option key={s.id} value={s.id}>{s.name}{s.price ? ` — ${money(s.price)}` : ""}</option>)}
            </select>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}><FieldLabel>Date</FieldLabel><input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyle, marginBottom: 12 }} /></div>
            <div style={{ flex: 1 }}><FieldLabel>Time</FieldLabel><input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ ...inputStyle, marginBottom: 12 }} /></div>
          </div>

          <FieldLabel>Who is this for? (optional)</FieldLabel>
          <TextInput value={recipient} onChange={setRecipient} placeholder="e.g. Sarah M." />

          <label style={{ display: "flex", alignItems: "flex-start", gap: 9, margin: "14px 0 4px", cursor: "pointer" }}>
            <input type="checkbox" checked={inviteAccount} onChange={(e) => setInviteAccount(e.target.checked)} style={{ marginTop: 2, width: 16, height: 16, accentColor: g.color, cursor: "pointer" }} />
            <span style={{ fontSize: 12.5, color: BODY, lineHeight: 1.45 }}>Invite them to create an account while booking. Uncheck to let them book with just their details, no password.</span>
          </label>

          <button onClick={generate} style={{ ...btnSolid, background: RED, width: "100%", justifyContent: "center", marginTop: 4, padding: "11px" }}><LinkIcon size={15} /> Generate booking link</button>
        </div>

        {/* just-made + share */}
        <div>
          {justMade ? (
            <div style={{ background: `color-mix(in srgb, ${RED} 7%, ${PAPER})`, border: `1px solid color-mix(in srgb, ${RED} 22%, ${LINE})`, borderRadius: 12, padding: "18px 20px", marginBottom: 18 }}>
              <div style={{ ...mono, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: RED, marginBottom: 10, display: "flex", alignItems: "center", gap: 7 }}><Check size={13} /> Link ready — slot reserved</div>
              <div style={{ fontSize: 13, color: BODY, marginBottom: 4 }}>{justMade.serviceName}</div>
              <div style={{ ...mono, fontSize: 11, color: DANGER, marginBottom: 12 }}>{fmtDate(justMade.date)} at {fmtTime(justMade.time)}{justMade.recipient ? ` · for ${justMade.recipient}` : ""}</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                <input readOnly value={linkUrl(justMade)} onClick={(e) => e.target.select()} style={{ ...inputStyle, marginBottom: 0, fontSize: 11, color: STONE }} />
                <button onClick={() => copy(linkUrl(justMade))} style={{ ...btnSolid, background: INK, padding: "9px 12px" }}><Copy size={13} /></button>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <a href={`sms:?&body=${encodeURIComponent("Here's your booking link for Dot One Media: " + linkUrl(justMade))}`} style={{ ...shareBtn }}><Smartphone size={13} /> Text</a>
                <a href={`https://www.facebook.com/dialog/send?link=${encodeURIComponent(linkUrl(justMade))}&app_id=0&redirect_uri=${encodeURIComponent(linkUrl(justMade))}`} target="_blank" rel="noopener noreferrer" style={{ ...shareBtn }}><MessageCircle size={13} /> Messenger</a>
                <button onClick={() => openDirectLink(justMade)} style={{ ...shareBtn, cursor: "pointer", background: PAPER }}><Eye size={13} /> Preview as client</button>
              </div>
              <div style={{ ...mono, fontSize: 9, color: FAINT, marginTop: 10, lineHeight: 1.5 }}>Tip: "Text" and "Messenger" open your device's apps on a real phone. "Preview as client" shows exactly what your client will see.</div>
            </div>
          ) : (
            <div style={{ border: `1px dashed ${LINE}`, borderRadius: 12, padding: "24px", textAlign: "center", color: FAINT, fontSize: 12.5, lineHeight: 1.55, background: CREAM, marginBottom: 18 }}>
              Your generated link and share options will appear here.
            </div>
          )}
        </div>
      </div>

      {/* existing links */}
      <div style={{ marginTop: 8 }}>
        <div style={{ ...mono, fontSize: 10.5, letterSpacing: "0.16em", textTransform: "uppercase", color: STONE, margin: "18px 0 12px" }}>Sent & reserved links</div>
        {state.directLinks.length === 0 ? (
          <EmptyState icon={Link2} title="No booking links yet" text="Create a link above to reserve a slot for a client and let them book it directly." style={{ padding: "30px 16px" }} />
        ) : (
          state.directLinks.map((l) => { const used = l.status === "used"; return (
            <div key={l.id} style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 10, padding: "13px 16px", marginBottom: 8, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div style={{ width: 30, height: 30, borderRadius: 7, background: CREAM, border: `1px solid ${LINE}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{React.createElement(GROUPS[l.group].Icon, { size: 14, color: GROUPS[l.group].color })}</div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ ...display, fontWeight: 600, fontSize: 15, color: INK }}>{l.serviceName}</div>
                <div style={{ ...mono, fontSize: 10.5, color: STONE, marginTop: 2 }}>{fmtDate(l.date)} at {fmtTime(l.time)}{l.recipient ? ` · ${l.recipient}` : ""}</div>
              </div>
              <span style={{ ...mono, fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 10px", borderRadius: 20, background: used ? "#eaf7ef" : "#fff4e8", color: used ? OK : WARN, border: `1px solid ${used ? "#bfe6cc" : "#f0dcc0"}` }}>{used ? "Booked" : "Active · held"}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => copy(linkUrl(l))} title="Copy link" style={iconBtnStyle}><Copy size={13} /></button>
                {!used && <button onClick={() => openDirectLink(l)} title="Preview as client" style={iconBtnStyle}><Eye size={13} /></button>}
                {!used && <button onClick={() => revokeDirectLink(l.id)} title="Revoke & free the slot" style={{ ...iconBtnStyle, color: RED }}><Ban size={13} /></button>}
              </div>
            </div>
          ); })
        )}
      </div>
    </div>
  );
}

