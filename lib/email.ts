import { sql } from "@/lib/db";
import { GOOGLE_REVIEW_URL } from "@/lib/portal/constants";

// Transactional email via Resend. Fail-soft: if RESEND_API_KEY is unset, this does nothing.
// Brand-aware: client-facing photography emails use the Dot One Photography logo + blue accent.

export const STAGE_LABELS = [
  "Session Scheduled",
  "Booked & Confirmed",
  "Day of Session",
  "Post-Session",
  "Editing",
  "Pre-Delivery Review",
  "Final Delivery",
];

const INK = "#141311";
const CREAM = "#fbf8f2";
const STONE = "#8a857c";
const FAINT = "#b5b0a6";
const LINE = "#ece8e0";
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const PORTAL = "https://portal.dot1.media";

const BRAND_MAIN = { accent: "#e23b2e", logo: PORTAL + "/dot1-logo.png", logoH: 42, tagline: "Create with purpose" };
const BRAND_PHOTO = { accent: "#2f74c0", logo: PORTAL + "/dot1-photo-logo.png", logoH: 46, tagline: "Timeless Portraits" };

function brandFor(s: any, forStudio?: boolean) {
  if (!forStudio && s && s.serviceLine === "photo") return BRAND_PHOTO;
  return BRAND_MAIN;
}

function esc(v: any): string {
  return String(v == null ? "" : v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function dollars(n: any): string {
  return "$" + (Number(n) || 0).toLocaleString();
}

function button(brand: any, href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${brand.accent};color:#ffffff;text-decoration:none;font-family:${SANS};font-size:13px;font-weight:600;letter-spacing:0.02em;padding:13px 24px;border-radius:8px;margin-top:6px;">${label}</a>`;
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

function para(text: string): string {
  return `<p style="font-family:${SANS};font-size:14px;line-height:1.65;color:#4a463f;margin:0 0 16px;">${text}</p>`;
}

function messageHtml(text: string, accent: string): string {
  const lines = String(text || "").split(/\r?\n/).map((line) =>
    esc(line).replace(/(https?:\/\/[^\s<]+)/g, (u) => `<a href="${u}" style="color:${accent};text-decoration:underline;">${u}</a>`)
  );
  return `<div style="font-family:${SANS};font-size:14px;line-height:1.7;color:#4a463f;margin:0 0 18px;">${lines.join("<br>")}</div>`;
}

function shell(brand: any, eyebrow: string, heading: string, bodyHtml: string): string {
  return `<div style="margin:0;padding:0;background:${CREAM};">
  <div style="max-width:600px;margin:0 auto;padding:40px 22px;font-family:${SANS};color:#2b2926;">
    <div style="text-align:center;margin-bottom:30px;">
      <img src="${brand.logo}" alt="Dot One Media" style="height:${brand.logoH}px;width:auto;display:inline-block;" />
      <div style="font-family:${SANS};font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:${FAINT};margin-top:11px;">${brand.tagline || "Create with purpose"}</div>
    </div>
    <div style="background:#ffffff;border:1px solid ${LINE};border-radius:14px;padding:36px 34px;">
      <div style="font-family:${SANS};font-size:10.5px;letter-spacing:0.22em;text-transform:uppercase;color:${brand.accent};margin-bottom:13px;">${eyebrow}</div>
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

export function bookingStudioEmail(s: any): string {
  const brand = brandFor(s, true);
  const body = para("A new booking just came in through the portal.") +
    detailRows([
      ["Client", `${esc(s.clientName)} &lt;${esc(s.clientEmail)}&gt;`],
      ["Service", esc(s.type)],
      ["Date", `${esc(s.date) || "TBD"} ${esc(s.time)}`],
      ["Total", dollars(s.total)],
    ]) + button(brand, PORTAL, "Open the studio dashboard");
  return shell(brand, "New Booking", "A new booking has arrived", body);
}

export function bookingClientEmail(s: any): string {
  const brand = brandFor(s);
  const isConsultBooking = /consult/i.test((s && s.type) || "");
  const paid = s && s.paymentStatus === "paid" && Number(s.payAmount) > 0;
  const first = s && s.clientName ? esc(String(s.clientName).split(" ")[0]) : "";
  const rows: Array<[string, string]> = [["Service", esc(s.type)], ["Date", esc(s.date) || "To be confirmed"]];
  if (s && s.time) rows.push(["Time", esc(s.time)]);
  if (s && s.photographer) rows.push(["Your creator", esc(s.photographer)]);
  if (paid) rows.push(["Paid", dollars(s.payAmount)]);
  if (s && s.location) {
    const locName = esc(s.location);
    rows.push(["Location", s.locationUrl ? `<a href="${esc(s.locationUrl)}" style="color:${brand.accent};text-decoration:underline;">${locName}</a>` : locName]);
  }

  const steps = isConsultBooking
    ? [["1", "We confirm", "We review your request and lock in the details."], ["2", "We meet", "We connect for your consultation and talk through your vision."]]
    : [["1", "We confirm", "We review your details and prepare for your session."], ["2", "Session day", "We capture your session, then move into post-production."], ["3", "Delivery", "Your finished work arrives in your portal to view and keep."]];
  const nextBlock = `<div style="margin:6px 0 22px;">
    <div style="font-family:${SANS};font-size:10.5px;letter-spacing:0.16em;text-transform:uppercase;color:${STONE};margin-bottom:13px;">What happens next</div>
    ${steps.map(([n, t, d]) => `<table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:11px;"><tr>
      <td style="width:30px;vertical-align:top;"><div style="width:26px;height:26px;border-radius:50%;background:${brand.accent};color:#ffffff;font-family:${SANS};font-size:12px;font-weight:700;text-align:center;line-height:26px;">${n}</div></td>
      <td style="vertical-align:top;padding-left:13px;">
        <div style="font-family:${SERIF};font-size:15px;font-weight:600;color:${INK};line-height:1.3;">${t}</div>
        <div style="font-family:${SANS};font-size:12.5px;color:#6b665e;line-height:1.5;">${d}</div>
      </td></tr></table>`).join("")}
  </div>`;

  const hasMsg = !!(s && s.confirmationMessage && String(s.confirmationMessage).trim());
  const body = hasMsg
    ? messageHtml(s.confirmationMessage, brand.accent) +
      detailRows(rows) +
      para("Sign in anytime with your email and password to follow your session and, when it's ready, receive your finished work.") +
      button(brand, PORTAL, "Open your client portal")
    : para(`Thank you for booking with Dot One Media${first ? ", " + first : ""}. Your ${isConsultBooking ? "consultation" : "session"} is confirmed, and we can't wait to create with you.`) +
      detailRows(rows) +
      nextBlock +
      para("Sign in anytime with your email and password to follow your progress and, when it's ready, receive your finished work.") +
      button(brand, PORTAL, "Open your client portal");
  return shell(brand, "Booking Confirmed", isConsultBooking ? "Your consultation is confirmed" : "Your session is confirmed", body);
}

export function briefStudioEmail(s: any): string {
  const brand = BRAND_MAIN;
  const body = para(esc(s.clientName || "A client") + " has submitted their production brief for " + esc(s.type || "their project") + ". Open the studio dashboard to review the details and start preparing.") +
    button(brand, PORTAL, "Open the studio dashboard");
  return shell(brand, "Production Brief", "A production brief is ready to review", body);
}
export const CONSULT_STAGE_LABELS = ["Consultation Scheduled", "Confirmed", "Consultation Complete"];
export function stageLabelFor(s: any, idx: number): string {
  const L = /consult/i.test((s && s.type) || "") ? CONSULT_STAGE_LABELS : STAGE_LABELS;
  return L[idx] || "Update";
}
export function stageClientEmail(s: any, stageIdx: number): string {
  const brand = brandFor(s);
  const label = stageLabelFor(s, stageIdx);
  const body = para(`There's an update on your <strong style="color:${INK};">${esc(s.type) || "session"}</strong>.`) +
    `<div style="background:${CREAM};border:1px solid ${LINE};border-radius:10px;padding:16px 18px;margin:6px 0 20px;">
      <div style="font-family:${SANS};font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:${STONE};">Current status</div>
      <div style="font-family:${SERIF};font-size:19px;font-weight:700;color:${INK};margin-top:5px;">${label}</div>
    </div>` +
    button(brand, PORTAL, "View your session");
  return shell(brand, "Session Update", "Your session moved forward", body);
}

export function isFinalStage(s: any, idx: number): boolean {
  const L = /consult/i.test((s && s.type) || "") ? CONSULT_STAGE_LABELS : STAGE_LABELS;
  return idx >= L.length - 1;
}
export function reviewEmail(s: any, link: string): string {
  const brand = brandFor(s);
  const first = s && s.clientName ? esc(String(s.clientName).split(" ")[0]) : "";
  const body =
    para(`Hi${first ? " " + first : ""}, it was such a joy creating your ${esc(s.type) || "session"} with you, and we hope you love how everything turned out.`) +
    para("If you have a moment, a short review would mean the world to a small studio like ours. It helps other families and clients find us, and it truly makes our day.") +
    button(brand, link, "Leave a quick review") +
    para("Thank you for trusting us with your story. With gratitude, the whole Dot One Media team.");
  return shell(brand, "Thank You", "We would love your feedback", body);
}
export function messageEmail(s: any, toStudio: boolean, msg: string, image?: string): string {
  const brand = brandFor(s, toStudio);
  const who = toStudio ? (esc(s.clientName) || "Your client") : "Dot One Media";
  const quote = msg && msg.trim()
    ? `<div style="background:${CREAM};border-left:3px solid ${brand.accent};padding:14px 18px;margin:6px 0 ${image ? "12" : "20"}px;font-family:${SANS};font-size:14px;line-height:1.65;color:#4a463f;">${esc(msg)}</div>`
    : "";
  const pic = image
    ? `<div style="margin:6px 0 20px;"><a href="${esc(image)}" target="_blank" style="display:inline-block;"><img src="${esc(image)}" alt="Attached image" style="max-width:100%;width:420px;border:1px solid ${LINE};border-radius:8px;display:block;" /></a><div style="font-family:${SANS};font-size:12px;color:${STONE};margin-top:6px;">${toStudio ? "Your client attached an image." : "Dot One Media attached an image."} Tap it to view full size.</div></div>`
    : "";
  const body = para(`New message from <strong style="color:${INK};">${who}</strong> about the ${esc(s.type) || "session"}:`) +
    quote + pic +
    button(brand, PORTAL, "Reply in the portal");
  return shell(brand, "New Message", "You have a new message", body);
}

export function resetEmail(link: string): string {
  const brand = BRAND_MAIN;
  const body = para("We received a request to reset your Dot One Media portal password. Use the button below to set a new one. This link expires in one hour.") +
    button(brand, link, "Reset your password") +
    para("If you didn't request this, you can safely ignore this email and your password will stay the same.");
  return shell(brand, "Password Reset", "Reset your password", body);
}

export function inviteEmail(s: any, link: string): string {
  const brand = brandFor(s);
  const first = s && s.clientName ? esc(String(s.clientName).split(" ")[0]) : "";
  const body =
    para(`Hi${first ? " " + first : ""}, you have a ${esc(s.type) || "session"} with Dot One Media, and we would love for you to have your own portal to follow it from start to finish, along with any future sessions, all in one place.`) +
    para("Creating your account takes less than a minute. Just choose a password and you are in.") +
    button(brand, link, "Create your portal account") +
    para("Everything about your work with us will live in your portal, all yours to keep.");
  return shell(brand, "Your Portal", "Create your account to track your session", body);
}

export function balanceEmail(s: any, link: string, balance: number): string {
  const brand = brandFor(s);
  const body = para(`The remaining balance for your <strong style="color:${INK};">${esc(s.type) || "session"}</strong> is ready to pay.`) +
    detailRows([
      ["Service", esc(s.type)],
      ["Date", `${esc(s.date) || "TBD"} ${esc(s.time)}`],
      ["Balance due", dollars(balance)],
    ]) +
    button(brand, link, "Pay your balance") +
    para("Once this is paid, your booking is settled in full. Thank you!");
  return shell(brand, "Balance Due", "Your balance is ready to pay", body);
}

export function chargeRequestEmail(s: any, charge: any, link: string): string {
  const brand = brandFor(s);
  const amt = "$" + ((Number(charge.amountCents) || 0) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const body = para(`Dot One Media has added an item to your <strong style="color:${INK};">${esc(s.type) || "project"}</strong> and sent you a request to pay for it.`) +
    detailRows([
      ["For", esc(charge.label)],
      ["Amount", amt],
    ]) +
    button(brand, link, "Pay this request") +
    para("You can also pay it any time from your client portal. Once it\u2019s paid, we\u2019ll email you a receipt.");
  return shell(brand, "Payment Request", "You have a payment request", body);
}

export function receiptEmail(p: any): string {
  const KL: Record<string, string> = { retainer: "Retainer", deposit: "Deposit", half: "Deposit", full: "Full payment", balance: "Balance payment", charge: "Add-on" };
  const kindLabel = KL[String(p.kind || "").toLowerCase()] || "Payment";
  const amt = "$" + ((Number(p.amount_cents) || 0) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  let dt = "";
  try { dt = new Date(p.paid_at).toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Anchorage" }); } catch (e) {}
  const card = p.card_brand ? (esc(String(p.card_brand).replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())) + (p.card_last4 ? " \u00b7\u00b7\u00b7\u00b7 " + esc(p.card_last4) : "")) : "Card";
  const totalC = Number(p.total_cents) || 0;
  const remainC = totalC - (Number(p.amount_cents) || 0);
  const partial = ["retainer", "deposit", "half"].indexOf(String(p.kind || "").toLowerCase()) !== -1;
  const rows2: string[][] = [
    ["Amount paid", amt],
    ["For", esc(p.service || "Session") + " \u00b7 " + kindLabel],
    ["Date", esc(dt)],
    ["Payment method", card],
  ];
  if (partial && totalC > 0 && remainC > 0) {
    rows2.push(["Balance remaining", "$" + (remainC / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })]);
  }
  const body = para("Thank you, " + esc(p.client_name || "there") + ". We\u2019ve received your payment. Your receipt is below, and a PDF copy is attached for your records.")
    + detailRows(rows2);
  return shell(BRAND_MAIN, "Payment Receipt", "Payment received", body);
}

export async function clientAllows(email: string | undefined | null, category: string): Promise<boolean> {
  if (!email) return false;
  try {
    const rows = (await sql`SELECT prefs FROM email_prefs WHERE email = ${String(email).toLowerCase()} LIMIT 1`) as any[];
    if (!rows.length) return true;
    const prefs = (rows[0].prefs || {}) as any;
    return prefs[category] !== false;
  } catch (e) { return true; }
}

export async function sendToClient(email: string | undefined | null, category: string, opts: { subject: string; html: string; replyTo?: string; attachments?: Array<{ filename: string; content: string }> }): Promise<void> {
  if (!email) return;
  if (!(await clientAllows(email, category))) return;
  await sendEmail({ to: String(email), ...opts });
}

export function paymentStudioEmail(s: any, info: { amountCents: number; kind: string; cardBrand?: string | null; cardLast4?: string | null }): string {
  const brand = brandFor(s, true);
  const amt = "$" + ((Number(info.amountCents) || 0) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const KL: Record<string, string> = { retainer: "Retainer", deposit: "Deposit", half: "Deposit", full: "Full payment", balance: "Balance payment", charge: "Add-on" };
  const rows: Array<[string, string]> = [["Client", esc(s.clientName)], ["Service", esc(s.type)], ["Payment", KL[String(info.kind || "").toLowerCase()] || "Payment"], ["Amount", amt]];
  if (info.cardLast4) rows.push(["Method", (info.cardBrand ? String(info.cardBrand).replace(/_/g, " ") : "Card") + " \u00b7\u00b7\u00b7\u00b7 " + info.cardLast4]);
  const body = para(`<strong style="color:${INK};">${esc(s.clientName) || "A client"}</strong> just sent a payment.`) + detailRows(rows) + para("The receipt has been emailed to the client and saved in your Receipts.");
  return shell(brand, "Payment Received", "You got paid", body);
}

export function cancelClientEmail(s: any): string {
  const brand = brandFor(s);
  const body = para(`Your <strong style="color:${INK};">${esc(s.type) || "session"}</strong>${s.date ? " on " + esc(s.date) : ""} has been cancelled.`) + para("If this wasn\u2019t expected, or you\u2019d like to find a new date, just reply to this email or reach us at contact@dot1.media and we\u2019ll take care of you.");
  return shell(brand, "Booking Update", "Your booking was cancelled", body);
}

export function internalBookingEmail(s: any): string {
  const brand = brandFor(s);
  const first = s && s.clientName ? esc(String(s.clientName).split(" ")[0]) : "";
  const rows: Array<[string, string]> = [["Service", esc(s.type)], ["Date", esc(s.date) || "To be confirmed"]];
  if (s && s.time) rows.push(["Time", esc(s.time)]);
  if (s && s.photographer) rows.push(["Your creator", esc(s.photographer)]);
  if (s && Number(s.total) > 0) rows.push(["Total", dollars(s.total)]);
  const agree = `<div style="margin:2px 0 20px;">
    <div style="font-family:${SANS};font-size:10.5px;letter-spacing:0.16em;text-transform:uppercase;color:${STONE};margin-bottom:11px;">Please review before your session</div>
    <div style="margin-bottom:7px;"><a href="https://www.dot1.media/Dot-One-Media-Client-Services-Agreement.pdf" style="font-family:${SANS};font-size:13.5px;color:${brand.accent};text-decoration:none;">Client Services Agreement (PDF)</a></div>
    <div><a href="https://www.dot1.media/Dot-One-Media-Release-and-Waiver.pdf" style="font-family:${SANS};font-size:13.5px;color:${brand.accent};text-decoration:none;">Release &amp; Liability Waiver (PDF)</a></div>
  </div>`;
  const body =
    para(`Hi${first ? " " + first : ""}, your ${esc(s.type) || "session"} with Dot One Media is reserved. Here are your details.`) +
    detailRows(rows) +
    agree +
    para("Please review the agreement and release above. If a payment is due, you'll receive a separate secure payment request. Completing that payment confirms your booking and your acceptance of these terms.") +
    para("Just reply to this email with any questions. We can't wait to create with you.");
  return shell(brand, "Your Booking", "Your session is reserved", body);
}

export function videoEmail(s: any, url: string): string {
  const brand = brandFor(s);
  const first = s && s.clientName ? esc(String(s.clientName).split(" ")[0]) : "";
  const body =
    para(`Hi${first ? " " + first : ""}, your video from your ${esc(s.type) || "session"} with Dot One Media is ready to view.`) +
    button(brand, url, "Watch your video") +
    para("Open the link to watch, review, and download your video. It's yours to keep and share.");
  return shell(brand, "Your Video", "Your video is ready", body);
}

export function galleryEmail(s: any, url: string): string {
  const brand = brandFor(s);
  const first = s && s.clientName ? esc(String(s.clientName).split(" ")[0]) : "";
  const body =
    para(`Hi${first ? " " + first : ""}, your gallery from your ${esc(s.type) || "session"} with Dot One Media is ready to view and download.`) +
    button(brand, url, "View & download your gallery") +
    para("Open the gallery to view, favorite, and download your photos. The link is yours to keep and share with family.");
  return shell(brand, "Your Gallery", "Your photos are ready", body);
}

export function deliveryEmail(s: any, kind: string, url: string): string {
  const brand = brandFor(s);
  const first = s && s.clientName ? esc(String(s.clientName).split(" ")[0]) : "";
  const cfg: Record<string, { title: string; heading: string; noun: string; cta: string; tail: string }> = {
    gallery: { title: "Your Gallery", heading: "Your photos are ready", noun: "photo gallery", cta: "View & download your gallery", tail: "Open the gallery to view, favorite, and download your photos. The link is yours to keep and share with family." },
    video: { title: "Your Video", heading: "Your video is ready", noun: "video", cta: "Watch & download your video", tail: "Open the link to watch and download your finished video. The link is yours to keep." },
    music: { title: "Your Audio", heading: "Your audio is ready", noun: "audio", cta: "Listen & download your audio", tail: "Open the link to listen to and download your finished tracks. The link is yours to keep." },
    government: { title: "Your Deliverables", heading: "Your deliverables are ready", noun: "project deliverables", cta: "Open your deliverables", tail: "Open the link to access and download your project deliverables." },
  };
  const c = cfg[kind] || cfg.gallery;
  const reviewLink = (process.env.GOOGLE_REVIEW_LINK || GOOGLE_REVIEW_URL || "").trim();
  const body =
    para(`Hi${first ? " " + first : ""}, your ${c.noun} from your ${esc(s.type) || "project"} with Dot One Media is ready.`) +
    button(brand, url, c.cta) +
    para(c.tail) +
    (reviewLink ? para("If you love how everything turned out, a quick review would mean the world to a small studio like ours.") + button(brand, reviewLink, "Leave a Google review") : "");
  return shell(brand, c.title, c.heading, body);
}

export async function sendEmail(opts: { to?: string; subject: string; html: string; replyTo?: string; attachments?: Array<{ filename: string; content: string }> }): Promise<{ ok: boolean; id?: string; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "Email is not configured (RESEND_API_KEY is missing)." };
  if (!opts.to) return { ok: false, error: "No recipient address." };
  const from = process.env.EMAIL_FROM || "Dot One Media <notifications@dot1.media>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [opts.to], subject: opts.subject, html: opts.html, reply_to: opts.replyTo, ...(opts.attachments && opts.attachments.length ? { attachments: opts.attachments } : {}) }),
    });
    const data: any = await res.json().catch(() => ({}));
    if (!res.ok || (data && data.error)) {
      const reason = (data && (data.error?.message || data.message)) || ("Resend HTTP " + res.status);
      console.error("[email] send failed to", opts.to, "-", reason);
      return { ok: false, error: String(reason) };
    }
    return { ok: true, id: data && data.id };
  } catch (e: any) {
    const reason = e && e.message ? e.message : String(e);
    console.error("[email] send threw for", opts.to, "-", reason);
    return { ok: false, error: reason };
  }
}


