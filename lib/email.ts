// Transactional email via Resend. Fail-soft: if RESEND_API_KEY is unset, this does nothing.
// Design echoes dot1.media: cream canvas, editorial serif headings, red accent, "Create with purpose".

export const STAGE_LABELS = [
  "Session Scheduled",
  "Booked & Confirmed",
  "Day of Session",
  "Post-Session",
  "Editing",
  "Pre-Delivery Review",
  "Final Delivery",
];

const RED = "#e23b2e";
const INK = "#141311";
const CREAM = "#fbf8f2";
const STONE = "#8a857c";
const FAINT = "#b5b0a6";
const LINE = "#ece8e0";
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const PORTAL = "https://portal.dot1.media";

function esc(v: any): string {
  return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function dollars(n: any): string {
  return "$" + (Number(n) || 0).toLocaleString();
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${RED};color:#ffffff;text-decoration:none;font-family:${SANS};font-size:13px;font-weight:600;letter-spacing:0.02em;padding:13px 24px;border-radius:8px;margin-top:6px;">${label}</a>`;
}

function detailRows(pairs: Array<[string, string]>): string {
  const rows = pairs.map(([k, v], i) => {
    const border = i === pairs.length - 1 ? "" : `border-bottom:1px solid ${LINE};`;
    return `<tr>
      <td style="padding:10px 0;${border}font-family:${SANS};font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:${FAINT};width:36%;vertical-align:top;">${k}</td>
      <td style="padding:10px 0;${border}font-family:${SANS};font-size:14px;color:#2b2926;">${v}</td>
    </tr>`;
  }).join("");
  return `<table style="width:100%;border-collapse:collapse;margin:4px 0 22px;">${rows}</table>`;
}

function shell(eyebrow: string, heading: string, bodyHtml: string): string {
  return `<div style="margin:0;padding:0;background:${CREAM};">
  <div style="max-width:600px;margin:0 auto;padding:40px 22px;font-family:${SANS};color:#2b2926;">
    <div style="text-align:center;margin-bottom:30px;">
      <div style="font-family:${SERIF};font-size:27px;font-weight:700;color:${INK};letter-spacing:-0.01em;">Dot One Media<span style="color:${RED};">.</span></div>
      <div style="font-family:${SANS};font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:${FAINT};margin-top:9px;">Create with purpose</div>
    </div>
    <div style="background:#ffffff;border:1px solid ${LINE};border-radius:14px;padding:36px 34px;">
      <div style="font-family:${SANS};font-size:10.5px;letter-spacing:0.22em;text-transform:uppercase;color:${RED};margin-bottom:13px;">${eyebrow}</div>
      <h1 style="font-family:${SERIF};font-size:25px;font-weight:700;color:${INK};margin:0 0 18px;line-height:1.2;">${heading}</h1>
      ${bodyHtml}
    </div>
    <div style="text-align:center;margin-top:28px;font-family:${SANS};font-size:11px;color:${FAINT};line-height:1.85;">
      <div style="letter-spacing:0.18em;text-transform:uppercase;color:${STONE};">Dot One Media · DOT ONE LLC</div>
      <div>Wasilla, Alaska · <a href="mailto:contact@dot1.media" style="color:${FAINT};text-decoration:none;">contact@dot1.media</a></div>
      <div style="margin-top:9px;font-family:${SERIF};font-style:italic;color:${FAINT};">The dot is the point of light. The one is the singular truth.</div>
    </div>
  </div>
</div>`;
}

function para(text: string): string {
  return `<p style="font-family:${SANS};font-size:14px;line-height:1.65;color:#4a463f;margin:0 0 16px;">${text}</p>`;
}

export function bookingStudioEmail(s: any): string {
  const body = para("A new booking just came in through the portal.") +
    detailRows([
      ["Client", `${esc(s.clientName)} &lt;${esc(s.clientEmail)}&gt;`],
      ["Service", esc(s.type)],
      ["Date", `${esc(s.date) || "TBD"} ${esc(s.time)}`],
      ["Total", dollars(s.total)],
    ]) + button(PORTAL, "Open the studio dashboard");
  return shell("New Booking", "A new booking has arrived", body);
}

export function bookingClientEmail(s: any): string {
  const body = para("Thank you for booking with Dot One Media. Your session is confirmed, and we can't wait to create with you.") +
    detailRows([
      ["Service", esc(s.type)],
      ["Date", `${esc(s.date) || "TBD"} ${esc(s.time)}`],
    ]) +
    para("Sign in anytime with your email and password to follow your session's progress from booking through final delivery.") +
    button(PORTAL, "Open your client portal");
  return shell("Booking Confirmed", "Your session is confirmed", body);
}

export function stageClientEmail(s: any, stageIdx: number): string {
  const label = STAGE_LABELS[stageIdx] || "Update";
  const body = para(`There's an update on your <strong style="color:${INK};">${esc(s.type) || "session"}</strong>.`) +
    `<div style="background:${CREAM};border:1px solid ${LINE};border-radius:10px;padding:16px 18px;margin:6px 0 20px;">
      <div style="font-family:${SANS};font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${STONE};">Current status</div>
      <div style="font-family:${SERIF};font-size:19px;font-weight:700;color:${INK};margin-top:5px;">${label}</div>
    </div>` +
    button(PORTAL, "View your session");
  return shell("Session Update", "Your session moved forward", body);
}

export function messageEmail(s: any, toStudio: boolean, msg: string): string {
  const who = toStudio ? (esc(s.clientName) || "Your client") : "Dot One Media";
  const body = para(`New message from <strong style="color:${INK};">${who}</strong> about the ${esc(s.type) || "session"}:`) +
    `<div style="background:${CREAM};border-left:3px solid ${RED};padding:14px 18px;margin:6px 0 20px;font-family:${SANS};font-size:14px;line-height:1.65;color:#4a463f;">${esc(msg)}</div>` +
    button(PORTAL, "Reply in the portal");
  return shell("New Message", "You have a new message", body);
}

export async function sendEmail(opts: { to?: string; subject: string; html: string; replyTo?: string }): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !opts.to) return;
  const from = process.env.EMAIL_FROM || "Dot One Media <notifications@dot1.media>";
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [opts.to], subject: opts.subject, html: opts.html, reply_to: opts.replyTo }),
    });
  } catch (e) {
    /* fail-soft */
  }
}

