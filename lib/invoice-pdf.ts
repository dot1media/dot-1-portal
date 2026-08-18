import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";

// Dot One Media invoice PDF. Letter, brand ink/cream/red, hi-res logo.
// inv: { no, createdAt, client:{name,email,phone}, service:{name,date,time,duration},
//        items:[{label, cents}], totalCents, retainerCents, payUrl, notes }

const INK = rgb(0.102, 0.102, 0.09);       // #1a1a17
const BODY = rgb(0.2, 0.196, 0.176);       // #33322d
const STONE = rgb(0.435, 0.427, 0.396);    // #6f6d65
const FAINT = rgb(0.604, 0.596, 0.561);    // #9a988f
const LINE = rgb(0.886, 0.871, 0.831);     // #e2ded4
const RED = rgb(0.886, 0.231, 0.18);       // #e23b2e

const money = (cents: number) => "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export async function buildInvoicePdf(inv: any): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const helv = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const M = 54;
  const W = 612 - M * 2;
  let y = 792 - 56;

  // logo
  try {
    const bytes = fs.readFileSync(path.join(process.cwd(), "public", "dot1-logo-print.png"));
    const img = await doc.embedPng(bytes);
    const h = 44;
    const w = (img.width / img.height) * h;
    page.drawImage(img, { x: M, y: y - h + 6, width: w, height: h });
  } catch (e) {}

  // header right
  const title = "INVOICE";
  page.drawText(title, { x: 612 - M - bold.widthOfTextAtSize(title, 21), y: y - 8, size: 21, font: bold, color: INK });
  const no = String(inv.no || "");
  page.drawText(no, { x: 612 - M - helv.widthOfTextAtSize(no, 10), y: y - 24, size: 10, font: helv, color: STONE });
  const dt = new Date(inv.createdAt || Date.now()).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  page.drawText(dt, { x: 612 - M - helv.widthOfTextAtSize(dt, 9), y: y - 38, size: 9, font: helv, color: FAINT });
  y -= 62;
  page.drawRectangle({ x: M, y, width: W, height: 2, color: RED });
  y -= 30;

  // bill to | session
  const colB = M, colS = M + W / 2 + 10;
  page.drawText("BILLED TO", { x: colB, y, size: 8, font: bold, color: FAINT });
  page.drawText("SESSION", { x: colS, y, size: 8, font: bold, color: FAINT });
  y -= 15;
  const c = inv.client || {};
  const sv = inv.service || {};
  const leftLines = [c.name || "", c.email || "", c.phone || ""].filter(Boolean);
  const when = [sv.date || "", sv.time || ""].filter(Boolean).join(" at ");
  const rightLines = [sv.name || "", when, sv.duration ? sv.duration + " minutes" : ""].filter(Boolean);
  const rows = Math.max(leftLines.length, rightLines.length);
  for (let i = 0; i < rows; i++) {
    if (leftLines[i]) page.drawText(leftLines[i], { x: colB, y, size: i === 0 ? 11 : 9.5, font: i === 0 ? bold : helv, color: i === 0 ? INK : BODY });
    if (rightLines[i]) page.drawText(rightLines[i], { x: colS, y, size: i === 0 ? 11 : 9.5, font: i === 0 ? bold : helv, color: i === 0 ? INK : BODY });
    y -= i === 0 ? 16 : 13;
  }
  y -= 18;

  // items table
  page.drawText("DESCRIPTION", { x: M, y, size: 8, font: bold, color: FAINT });
  const amtHdr = "AMOUNT";
  page.drawText(amtHdr, { x: 612 - M - bold.widthOfTextAtSize(amtHdr, 8), y, size: 8, font: bold, color: FAINT });
  y -= 8;
  page.drawRectangle({ x: M, y, width: W, height: 0.8, color: INK });
  y -= 17;
  for (const it of inv.items || []) {
    const label = String(it.label || "").slice(0, 72);
    page.drawText(label, { x: M, y, size: 10, font: helv, color: BODY });
    const amt = money(Number(it.cents) || 0);
    page.drawText(amt, { x: 612 - M - helv.widthOfTextAtSize(amt, 10), y, size: 10, font: helv, color: INK });
    y -= 8;
    page.drawRectangle({ x: M, y, width: W, height: 0.5, color: LINE });
    y -= 15;
  }

  // totals
  y -= 6;
  const totLabel = "Total";
  const tot = money(Number(inv.totalCents) || 0);
  page.drawText(totLabel, { x: 612 - M - 170, y, size: 10, font: helv, color: STONE });
  page.drawText(tot, { x: 612 - M - helv.widthOfTextAtSize(tot, 10), y, size: 10, font: helv, color: INK });
  y -= 24;
  // retainer box
  page.drawRectangle({ x: 612 - M - 236, y: y - 12, width: 236, height: 34, color: rgb(0.98, 0.955, 0.935) });
  page.drawRectangle({ x: 612 - M - 236, y: y - 12, width: 2.5, height: 34, color: RED });
  page.drawText("RETAINER DUE NOW (50%)", { x: 612 - M - 224, y: y + 8, size: 7.5, font: bold, color: RED });
  const ret = money(Number(inv.retainerCents) || 0);
  page.drawText(ret, { x: 612 - M - helv.widthOfTextAtSize(ret, 14) - 12, y: y - 6, size: 14, font: bold, color: INK });
  y -= 34;
  const remain = money((Number(inv.totalCents) || 0) - (Number(inv.retainerCents) || 0));
  page.drawText("Remaining balance of " + remain + " is due per your service agreement.", { x: M, y, size: 8.5, font: helv, color: STONE });
  y -= 22;

  // pay line
  if (inv.payUrl) {
    page.drawText("Pay your retainer securely online:", { x: M, y, size: 9, font: bold, color: INK });
    y -= 13;
    page.drawText(String(inv.payUrl).slice(0, 96), { x: M, y, size: 8, font: helv, color: RED });
    y -= 12;
    page.drawText("Paying the retainer reserves your date and opens your Dot One client portal account.", { x: M, y, size: 8, font: helv, color: STONE });
    y -= 20;
  } else {
    page.drawText("We will send a secure payment link separately to complete your reservation.", { x: M, y, size: 8.5, font: helv, color: STONE });
    y -= 20;
  }

  // notes
  if (inv.notes) {
    page.drawText("NOTES", { x: M, y, size: 8, font: bold, color: FAINT });
    y -= 13;
    const words = String(inv.notes).split(/\s+/);
    let line = "";
    for (const w of words) {
      const t = line ? line + " " + w : w;
      if (helv.widthOfTextAtSize(t, 9) > W) { page.drawText(line, { x: M, y, size: 9, font: helv, color: BODY }); y -= 12; line = w; }
      else line = t;
      if (y < 90) break;
    }
    if (line && y >= 90) { page.drawText(line, { x: M, y, size: 9, font: helv, color: BODY }); y -= 12; }
  }

  // footer
  page.drawRectangle({ x: M, y: 64, width: W, height: 0.8, color: LINE });
  const foot = "Dot One Media  \u00b7  Create with purpose  \u00b7  dot1.media  \u00b7  Wasilla, Alaska  \u00b7  Veteran-Owned";
  page.drawText(foot, { x: (612 - helv.widthOfTextAtSize(foot, 8)) / 2, y: 48, size: 8, font: helv, color: FAINT });

  return doc.save();
}

export function invoiceEmailHtml(inv: any): string {
  const rows = (inv.items || []).map((it: any) =>
    `<tr><td style="padding:9px 0;border-bottom:1px solid #ece8e0;font-size:13.5px;color:#33322d">${it.label}</td><td align="right" style="padding:9px 0;border-bottom:1px solid #ece8e0;font-size:13.5px;color:#1a1a17">${money(it.cents)}</td></tr>`).join("");
  const payBtn = inv.payUrl
    ? `<a href="${inv.payUrl}" style="display:inline-block;background:#e23b2e;color:#ffffff;text-decoration:none;padding:14px 26px;border-radius:8px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;font-weight:bold">Pay retainer &amp; reserve your date</a>`
    : `<span style="font-size:13px;color:#6f6d65">We will send a secure payment link separately.</span>`;
  return `<div style="background:#fbf8f2;padding:34px 16px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #ece8e0;border-radius:12px;overflow:hidden">
    <div style="padding:26px 30px;border-bottom:2px solid #e23b2e"><img src="https://portal.dot1.media/dot1-logo.png" alt="Dot One Media" style="height:40px"></div>
    <div style="padding:28px 30px">
      <p style="margin:0 0 4px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#9a988f">Invoice ${inv.no}</p>
      <h1 style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:23px;color:#1a1a17">Your session reservation</h1>
      <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#33322d">Hi ${inv.client && inv.client.name ? inv.client.name.split(" ")[0] : "there"}, here is your invoice for <b>${inv.service ? inv.service.name : "your session"}</b>${inv.service && inv.service.date ? " on <b>" + inv.service.date + (inv.service.time ? " at " + inv.service.time : "") + "</b>" : ""}. Your full invoice is attached as a PDF.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 6px">${rows}
        <tr><td style="padding:12px 0 2px;font-size:13px;color:#6f6d65">Total</td><td align="right" style="padding:12px 0 2px;font-size:13px;color:#1a1a17">${money(inv.totalCents)}</td></tr>
        <tr><td style="padding:6px 0;font-size:13.5px;font-weight:bold;color:#e23b2e">Retainer due now (50%)</td><td align="right" style="padding:6px 0;font-size:16px;font-weight:bold;color:#1a1a17">${money(inv.retainerCents)}</td></tr>
      </table>
      <p style="margin:4px 0 22px;font-size:12px;color:#9a988f">Paying the retainer reserves your date. The remaining ${money(inv.totalCents - inv.retainerCents)} is due per your service agreement.</p>
      <div style="text-align:center;margin:0 0 8px">${payBtn}</div>
      <p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:#6f6d65;text-align:center">After payment you will land in your Dot One client portal, where your session is booked and you can create your account to track everything to final delivery.</p>
    </div>
    <div style="padding:16px 30px;border-top:1px solid #ece8e0;text-align:center">
      <p style="margin:0;font-size:11px;color:#9a988f">Dot One Media &middot; Create with purpose &middot; Wasilla, Alaska &middot; contact@dot1.media</p>
    </div>
  </div>
</div>`;
}

