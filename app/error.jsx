"use client";
import { useEffect } from "react";
export default function Error({ error, reset }) {
  useEffect(() => {
    try { console.error("Portal error:", error?.message, error?.stack, "digest:", error?.digest); } catch (e) {}
    try { fetch("/api/clientlog", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ msg: error?.message || String(error), stack: error?.stack || "", url: (typeof location !== "undefined" ? location.href : ""), ua: (typeof navigator !== "undefined" ? navigator.userAgent : "") }) }); } catch (e) {}
  }, [error]);
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fbf8f2", fontFamily: "Archivo, system-ui, sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 440, textAlign: "center" }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#a4a094", marginBottom: 14 }}>Dot One Media</div>
        <h1 style={{ fontFamily: "Georgia, 'Bodoni Moda', serif", fontSize: 26, color: "#141210", margin: "0 0 10px" }}>Something hiccupped</h1>
        <p style={{ fontSize: 14.5, color: "#57544d", lineHeight: 1.55, margin: "0 0 20px" }}>Sorry about that. This is on our end, not you. Please try again, and if it keeps happening, email <a href="mailto:contact@dot1.media" style={{ color: "#e23b2e" }}>contact@dot1.media</a>.</p>
        <button onClick={() => { try { reset(); } catch (e) { location.reload(); } }} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "#fff", background: "#e23b2e", border: "none", borderRadius: 8, padding: "13px 24px", cursor: "pointer" }}>Try again</button>
        <details style={{ marginTop: 22, textAlign: "left" }}>
          <summary style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "#a4a094", cursor: "pointer", letterSpacing: "0.06em" }}>Show technical details</summary>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: "#8a5a2b", background: "#f4efe6", border: "1px solid #e2ded4", borderRadius: 6, padding: "10px 12px", marginTop: 8 }}>{(error?.message || String(error) || "unknown") + (error?.digest ? "\n\nref " + error.digest : "")}</pre>
        </details>
      </div>
    </div>
  );
}
