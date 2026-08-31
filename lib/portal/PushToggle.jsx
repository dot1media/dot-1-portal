"use client";
import React, { useEffect, useState } from "react";

const MONO = { fontFamily: "'IBM Plex Mono', ui-monospace, monospace" };

function urlB64ToUint8Array(b64) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const base = (b64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export default function PushToggle({ accent = "#b81616", line = "#e2ded4", stone = "#6f6d65", ink = "#141210" }) {
  const [supported, setSupported] = useState(true);
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setSupported(false); return;
    }
    navigator.serviceWorker.ready.then((reg) => reg.pushManager.getSubscription()).then((sub) => setOn(!!sub)).catch(() => {});
  }, []);

  async function enable() {
    setBusy(true); setMsg("");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setMsg("Notifications are blocked. Turn them on for this app in your phone's settings."); setBusy(false); return; }
      const reg = await navigator.serviceWorker.ready;
      const keyRes = await fetch("/api/push/key").then((r) => r.json());
      if (!keyRes.key) { setMsg("Push is not configured yet on the server."); setBusy(false); return; }
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8Array(keyRes.key) });
      const r = await fetch("/api/push/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(sub) });
      if (r.status === 401) { setMsg("Sign in as the studio admin first."); setBusy(false); return; }
      if (!r.ok) { setMsg("Could not turn on notifications. Try again."); setBusy(false); return; }
      setOn(true);
    } catch (e) { setMsg("Could not turn on notifications on this device."); }
    setBusy(false);
  }

  async function disable() {
    setBusy(true); setMsg("");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) { try { await fetch("/api/push/subscribe", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) }); } catch (e) {} await sub.unsubscribe(); }
      setOn(false);
    } catch (e) {}
    setBusy(false);
  }

  if (!supported) return (
    <div style={{ ...MONO, fontSize: 10.5, color: stone, lineHeight: 1.5, padding: "10px 4px" }}>
      Phone notifications need this portal installed to your home screen. Tap Share, then Add to Home Screen, and open it from there.
    </div>
  );

  return (
    <div style={{ padding: "6px 2px 10px" }}>
      <button onClick={on ? disable : enable} disabled={busy} style={{ ...MONO, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", width: "100%", padding: "10px 12px", borderRadius: 8, cursor: "pointer", border: `1px solid ${on ? line : accent}`, background: on ? "transparent" : accent, color: on ? stone : "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        {busy ? "..." : on ? "Phone notifications on \u00b7 tap to turn off" : "Turn on phone notifications"}
      </button>
      {msg && <div style={{ ...MONO, fontSize: 10, color: accent, marginTop: 7, lineHeight: 1.5 }}>{msg}</div>}
    </div>
  );
}
