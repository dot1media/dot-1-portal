"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const INK = "#1a1a17", BODY = "#33322d", STONE = "#6f6d65", FAINT = "#9a988f", LINE = "#e2ded4", RED = "#e23b2e", CREAM = "#f6f1e8", PAPER = "#fbf8f2";
const money = (c) => "$" + ((Number(c) || 0) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function QuoteAcceptPage() {
  const params = useParams();
  const token = params && params.token ? String(params.token) : "";
  const [state, setState] = useState("loading"); // loading | ready | accepted | expired | error
  const [err, setErr] = useState("");
  const [q, setQ] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) { setState("error"); setErr("Missing link."); return; }
    fetch("/api/quotes/public?token=" + encodeURIComponent(token))
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setState("error"); setErr(d.error); return; }
        setQ(d.quote);
        if (d.status === "converted") setState("accepted");
        else if (d.expired) setState("expired");
        else setState("ready");
      })
      .catch(() => { setState("error"); setErr("Could not load this quote."); });
  }, [token]);

  const accept = async () => {
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/quotes/public", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(d.error || "Could not accept the quote."); setBusy(false); return; }
      if (d.payUrl) { window.location.href = d.payUrl; return; }
      setState("accepted");
    } catch (e) { setErr("Could not accept. Please try again."); setBusy(false); }
  };

  const wrap = { minHeight: "100vh", background: PAPER, fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif", paddingBottom: 60 };
  const shell = { maxWidth: 620, margin: "0 auto", padding: "0 18px" };
  const box = { background: "#fff", border: `1px solid ${LINE}`, borderRadius: 12, padding: "24px 26px", marginTop: 16 };

  return (
    <div style={wrap}>
      <div style={{ borderBottom: `2px solid ${RED}`, background: "#fff", padding: "18px 0", marginBottom: 8 }}>
        <div style={shell}><img src="/dot1-logo.png" alt="Dot One Media" style={{ height: 38 }} /></div>
      </div>
      <div style={shell}>
        {state === "loading" && <p style={{ color: STONE, marginTop: 24 }}>Loading your quote&hellip;</p>}
        {state === "error" && <div style={box}><h1 style={{ fontFamily: "Georgia,serif", fontSize: 22, color: INK, margin: "0 0 8px" }}>This quote isn&rsquo;t available</h1><p style={{ color: BODY }}>{err}</p></div>}
        {state === "expired" && <div style={box}><h1 style={{ fontFamily: "Georgia,serif", fontSize: 22, color: INK, margin: "0 0 8px" }}>This quote has expired</h1><p style={{ color: BODY }}>Please reach out and we&rsquo;ll send you a fresh one. Email <a href="mailto:contact@dot1.media" style={{ color: RED }}>contact@dot1.media</a>.</p></div>}
        {state === "accepted" && <div style={box}><div style={{ fontFamily: "Georgia,serif", fontSize: 24, color: INK, margin: "0 0 8px" }}>Thank you</div><p style={{ color: BODY, lineHeight: 1.6 }}>This quote has been accepted. Check your email for the invoice and secure payment link. Paying reserves your date and opens your Dot One client portal.</p></div>}

        {(state === "ready" || state === "accepted") && q && (
          <div style={box}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: `2px solid ${RED}`, paddingBottom: 14, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: FAINT }}>Quote {q.no}</div>
                <h1 style={{ fontFamily: "Georgia,serif", fontSize: 24, color: INK, margin: "6px 0 0" }}>{q.service ? q.service.name : "Your session"}</h1>
                {q.service && (q.service.date || q.service.time) && <div style={{ color: STONE, fontSize: 13, marginTop: 4 }}>{q.service.date || "Date TBD"}{q.service.time ? " at " + q.service.time : ""}</div>}
              </div>
              {q.client && q.client.name && <div style={{ textAlign: "right", fontSize: 13, color: BODY }}>Prepared for<br /><b style={{ color: INK }}>{q.client.name}</b></div>}
            </div>
            <div>
              {(q.items || []).map((it, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: `1px solid ${LINE}`, fontSize: 14 }}>
                  <span style={{ color: BODY }}>{it.label}</span><span style={{ color: INK }}>{money(it.cents)}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 18, padding: "12px 0 2px", fontSize: 14, color: STONE }}>Estimated total&nbsp;&nbsp;<b style={{ color: INK }}>{money(q.totalCents)}</b></div>
            <div style={{ background: CREAM, borderLeft: `3px solid ${RED}`, padding: "9px 12px", marginTop: 8 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: RED }}>Retainer to reserve (50%)</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: INK, marginTop: 2 }}>{money(q.retainerCents)}</div>
            </div>
            {q.notes && <p style={{ fontSize: 13, color: BODY, marginTop: 12, whiteSpace: "pre-wrap", borderTop: `1px solid ${LINE}`, paddingTop: 10 }}>{q.notes}</p>}

            {state === "ready" && (
              <>
                {err && <p style={{ color: RED, fontSize: 13, marginTop: 14 }}>{err}</p>}
                <button onClick={accept} disabled={busy} style={{ marginTop: 18, width: "100%", background: RED, color: "#fff", border: "none", borderRadius: 9, padding: "15px", fontSize: 15.5, fontWeight: 700, cursor: busy ? "default" : "pointer", opacity: busy ? 0.7 : 1 }}>
                  {busy ? "Preparing your invoice…" : "Accept & continue to payment"}
                </button>
                <p style={{ fontSize: 12, color: FAINT, marginTop: 10, textAlign: "center", lineHeight: 1.5 }}>Accepting creates your invoice and takes you to secure payment for the 50% retainer. Paying reserves your date and opens your Dot One client portal, where you&rsquo;ll sign agreements and track your session.</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
