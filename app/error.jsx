"use client";
import { useEffect } from "react";
// App-level error boundary. Without this, any render crash showed the client a
// blank/opaque Next.js error page ("the same error"). Now they get a calm screen
// and a reload, and the real error is logged to the console for diagnosis.
export default function Error({ error, reset }) {
  useEffect(() => { try { console.error("Portal error:", error?.message, error?.stack, "digest:", error?.digest); } catch (e) {} }, [error]);
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fbf8f2", fontFamily: "Archivo, system-ui, sans-serif", padding: 24 }}>
      <div style={{ maxWidth: 420, textAlign: "center" }}>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#a4a094", marginBottom: 14 }}>Dot One Media</div>
        <h1 style={{ fontFamily: "Georgia, 'Bodoni Moda', serif", fontSize: 26, color: "#141210", margin: "0 0 10px" }}>Something hiccupped</h1>
        <p style={{ fontSize: 14.5, color: "#57544d", lineHeight: 1.55, margin: "0 0 22px" }}>Sorry about that. This is on our end, not you. Please try again, and if it keeps happening, email <a href="mailto:contact@dot1.media" style={{ color: "#e23b2e" }}>contact@dot1.media</a>.</p>
        <button onClick={() => { try { reset(); } catch (e) { location.reload(); } }} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "#fff", background: "#e23b2e", border: "none", borderRadius: 8, padding: "13px 24px", cursor: "pointer" }}>Try again</button>
        {error?.digest ? <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#c9c4b8", marginTop: 20 }}>ref {error.digest}</div> : null}
      </div>
    </div>
  );
}
