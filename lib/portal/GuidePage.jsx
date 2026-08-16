import React from "react";
import { ArrowLeft, Download } from "lucide-react";
import { RED, INK, STONE, LINE, PAPER } from "./theme";

// Renders a guide (client or studio) inside the portal, styled to match, with a Download PDF button.
// The HTML comes from lib/portal/guides.js; the PDF is a static file under public/guides/.
const GUIDE_CSS = `.dot1-guide{color:#33322d;font-family:'Archivo',system-ui,sans-serif;font-size:15px;line-height:1.65;}
.dot1-guide h2{font-family:'Bodoni Moda',Georgia,serif;font-weight:700;font-size:24px;color:#1a1a17;margin:30px 0 10px;padding-bottom:7px;border-bottom:2px solid #e2ded4;}
.dot1-guide h2:first-child{margin-top:4px;}
.dot1-guide h2 .hn{color:#e23b2e;font-style:italic;margin-right:4px;}
.dot1-guide h3{font-family:'Bodoni Moda',Georgia,serif;font-weight:700;font-size:17px;color:#1a1a17;margin:20px 0 6px;}
.dot1-guide p{margin:0 0 10px;}
.dot1-guide a{color:#e23b2e;text-decoration:none;}
.dot1-guide strong{font-weight:600;color:#1a1a17;}
.dot1-guide ul,.dot1-guide ol{margin:0 0 12px;padding-left:22px;}
.dot1-guide li{margin:0 0 6px;}
.dot1-guide code{font-family:'IBM Plex Mono',monospace;font-size:13px;background:#f4f0e7;padding:1px 5px;border-radius:3px;color:#1a1a17;}
.dot1-guide table{width:100%;border-collapse:collapse;margin:10px 0 18px;font-size:13.5px;}
.dot1-guide th{font-family:'IBM Plex Mono',monospace;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;text-align:left;background:#1a1a17;color:#fff;padding:8px 10px;}
.dot1-guide td{padding:8px 10px;border-bottom:1px solid #e2ded4;vertical-align:top;}
.dot1-guide tbody tr:nth-child(even) td{background:#faf8f3;}
.dot1-guide hr{border:none;border-top:1px solid #e2ded4;margin:22px 0;}
.dot1-guide blockquote{margin:16px 0;padding:10px 14px;background:#f4f0e7;border-left:3px solid #e23b2e;color:#6f6d65;font-size:13.5px;}
.dot1-guide blockquote p{margin:0;font-style:italic;}
.dot1-guide h1{display:none;}
.dot1-guide em{font-style:italic;}`;

export function GuidePage({ title, html, pdf, onBack }) {
  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <style dangerouslySetInnerHTML={{ __html: GUIDE_CSS }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 22, paddingBottom: 14, borderBottom: `1px solid ${LINE}`, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {onBack ? (
            <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: STONE, background: "transparent", border: `1px solid ${LINE}`, borderRadius: 7, padding: "8px 12px", cursor: "pointer" }}><ArrowLeft size={14} /> Back</button>
          ) : null}
          <span style={{ fontFamily: "'Bodoni Moda', Georgia, serif", fontWeight: 700, fontSize: 23, color: INK }}>{title}</span>
        </div>
        <a href={pdf} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 7, padding: "9px 15px", borderRadius: 7, background: RED, color: "#fff", fontSize: 12.5, fontWeight: 500, textDecoration: "none" }}><Download size={14} /> Download PDF</a>
      </div>
      <div className="dot1-guide" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

