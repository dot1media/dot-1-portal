// Transactional email via Resend. Fail-soft: if RESEND_API_KEY is unset, this does nothing
// (the app keeps working, no emails send), so it is safe to ship before you configure Resend.

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
const PORTAL = "https://portal.dot1.media";

function esc(v: any): string {
  return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function dollars(n: any): string {
  return "$" + (Number(n) || 0).toLocaleString();
}

function shell(heading: string, bodyHtml: string): string {
  return `<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;color:#2b2926;padding:8px;">
    <div style="border-bottom:3px solid ${RED};padding-bottom:14px;margin-bottom:22px;">
      <div style="font-size:20px;font-weight:700;color:#141311;">Dot One Media</div>
      <div style="font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#8a857c;margin-top:3px;">Productions</div>
    </div>
    <h1 style="font-size:19px;color:#141311;margin:0 0 14px;">${heading}</h1>
    ${bodyHtml}
    <div style="border-top:1px solid #eee;margin-top:26px;padding-top:14px;font-size:11px;color:#a8a29a;line-height:1.6;">
      Dot One Media · DOT ONE LLC · Wasilla, Alaska · contact@dot1.media
    </div>
  </div>`;
}

export function bookingStudioEmail(s: any): string {
  const body = `<p style="font-size:14px;line-height:1.6;">A new booking just came in.</p>
    <table style="font-size:14px;line-height:1.9;margin:8px 0;border-collapse:collapse;">
      <tr><td style="color:#8a857c;padding-right:18px;">Client</td><td>${esc(s.clientName)} (${esc(s.clientEmail)})</td></tr>
      <tr><td style="color:#8a857c;padding-right:18px;">Service</td><td>${esc(s.type)}</td></tr>
      <tr><td style="color:#8a857c;padding-right:18px;">Date</td><td>${esc(s.date) || "TBD"} ${esc(s.time)}</td></tr>
      <tr><td style="color:#8a857c;padding-right:18px;">Total</td><td>${dollars(s.total)}</td></tr>
    </table>
    <p style="font-size:13px;margin-top:16px;"><a href="${PORTAL}" style="color:${RED};text-decoration:none;font-weight:600;">Open the studio dashboard</a></p>`;
  return shell("New booking received", body);
}

export function bookingClientEmail(s: any): string {
  const body = `<p style="font-size:14px;line-height:1.6;">Thank you for booking with Dot One Media. Your session is confirmed.</p>
    <table style="font-size:14px;line-height:1.9;margin:8px 0;border-collapse:collapse;">
      <tr><td style="color:#8a857c;padding-right:18px;">Service</td><td>${esc(s.type)}</td></tr>
      <tr><td style="color:#8a857c;padding-right:18px;">Date</td><td>${esc(s.date) || "TBD"} ${esc(s.time)}</td></tr>
    </table>
    <p style="font-size:14px;line-height:1.6;margin-top:14px;">Sign in anytime with your email and password to follow your session's progress.</p>
    <p style="font-size:13px;margin-top:12px;"><a href="${PORTAL}" style="color:${RED};text-decoration:none;font-weight:600;">Open your client portal</a></p>`;
  return shell("Your booking is confirmed", body);
}

export function stageClientEmail(s: any, stageIdx: number): string {
  const label = STAGE_LABELS[stageIdx] || "Update";
  const body = `<p style="font-size:14px;line-height:1.6;">There is an update on your ${esc(s.type) || "session"}.</p>
    <div style="background:#faf9f6;border:1px solid #eee;border-radius:8px;padding:14px 16px;margin:12px 0;">
      <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#8a857c;">Current status</div>
      <div style="font-size:17px;font-weight:700;color:#141311;margin-top:3px;">${label}</div>
    </div>
    <p style="font-size:13px;margin-top:12px;"><a href="${PORTAL}" style="color:${RED};text-decoration:none;font-weight:600;">View your session</a></p>`;
  return shell("Your session status updated", body);
}

export function messageEmail(s: any, toStudio: boolean, msg: string): string {
  const who = toStudio ? (esc(s.clientName) || "Your client") : "Dot One Media";
  const inner = `<p style="font-size:14px;line-height:1.6;">New message from <strong>${who}</strong> about the ${esc(s.type) || "session"}:</p>
    <div style="background:#faf9f6;border-left:3px solid ${RED};padding:12px 16px;margin:12px 0;font-size:14px;line-height:1.6;color:#4a463f;">${esc(msg)}</div>
    <p style="font-size:13px;margin-top:12px;"><a href="${PORTAL}" style="color:${RED};text-decoration:none;font-weight:600;">Reply in the portal</a></p>`;
  return shell("New message", inner);
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

