import React from "react";
import { Mail, Trash2, Check, Reply, Inbox as InboxIcon } from "lucide-react";
import { INK, BODY, STONE, FAINT, LINE, PAPER, CREAM, RED, OK, mono, display, card } from "./theme";

function timeAgo(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function Inbox({ inquiries, setInquiries, showToast }) {
  const list = inquiries || [];
  const unread = list.filter((i) => !i.handled).length;

  const mark = async (id, handled) => {
    try {
      const res = await fetch(`/api/inquiries/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ handled }) });
      if (!res.ok) throw new Error();
      setInquiries((prev) => prev.map((i) => (i.id === id ? { ...i, handled } : i)));
    } catch (e) { showToast && showToast("Could not update the message."); }
  };
  const del = async (id) => {
    try {
      const res = await fetch(`/api/inquiries/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setInquiries((prev) => prev.filter((i) => i.id !== id));
    } catch (e) { showToast && showToast("Could not delete the message."); }
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
        <h2 style={{ ...display, fontSize: 26, fontWeight: 700, color: INK, margin: 0 }}>Inbox</h2>
        <span style={{ ...mono, fontSize: 11, letterSpacing: "0.08em", color: unread ? RED : FAINT }}>{unread} new · {list.length} total</span>
      </div>
      <p style={{ ...mono, fontSize: 11, color: FAINT, letterSpacing: "0.04em", margin: "0 0 20px" }}>Questions and requests sent from your website land here.</p>

      {list.length === 0 && (
        <div style={{ ...card, padding: 40, textAlign: "center", color: STONE }}>
          <InboxIcon size={26} style={{ color: FAINT, marginBottom: 10 }} />
          <div style={{ fontSize: 14 }}>No messages yet.</div>
          <div style={{ ...mono, fontSize: 10.5, color: FAINT, marginTop: 6 }}>The chat bubble on dot1.media feeds this inbox.</div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {list.map((i) => (
          <div key={i.id} style={{ ...card, padding: 18, borderLeft: i.handled ? `1px solid ${LINE}` : `3px solid ${RED}`, opacity: i.handled ? 0.72 : 1 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
                  {!i.handled && <span style={{ width: 7, height: 7, borderRadius: "50%", background: RED, flexShrink: 0 }} />}
                  <span style={{ fontSize: 15, fontWeight: 600, color: INK }}>{i.name}</span>
                  <a href={`mailto:${i.email}`} style={{ ...mono, fontSize: 11.5, color: STONE, textDecoration: "none" }}>{i.email}</a>
                </div>
                <div style={{ ...mono, fontSize: 10, color: FAINT, marginTop: 3 }}>{timeAgo(i.created_at)}</div>
              </div>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <a href={`mailto:${i.email}?subject=Re: your message to Dot One Media`} title="Reply by email" style={iconBtn}><Reply size={14} /></a>
                <button onClick={() => mark(i.id, !i.handled)} title={i.handled ? "Mark unread" : "Mark handled"} style={{ ...iconBtn, color: i.handled ? OK : STONE, borderColor: i.handled ? OK : LINE }}><Check size={14} /></button>
                <button onClick={() => { if (window.confirm("Delete this message?")) del(i.id); }} title="Delete" style={{ ...iconBtn, color: RED }}><Trash2 size={14} /></button>
              </div>
            </div>
            <p style={{ fontSize: 13.5, color: BODY, lineHeight: 1.6, margin: "12px 0 0", whiteSpace: "pre-wrap" }}>{i.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const iconBtn = { display: "inline-flex", alignItems: "center", justifyContent: "center", width: 30, height: 30, borderRadius: 7, border: `1px solid ${LINE}`, background: PAPER, color: STONE, cursor: "pointer", textDecoration: "none" };
