import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";

// Dot One Media quote (estimate) PDF. Mirrors the invoice look, but it is a quote,
// not a bill: no payment link, a validity date, and a note that approving it starts
// the invoice + booking. q: { no, createdAt, validUntil, client:{name,email,phone},
// service:{name,date,time,duration}, items:[{label,cents}], totalCents, retainerCents, notes }

const INK = rgb(0.102, 0.102, 0.09);
const BODY = rgb(0.2, 0.196, 0.176);
const STONE = rgb(0.435, 0.427, 0.396);
const FAINT = rgb(0.604, 0.596, 0.561);
const LINE = rgb(0.886, 0.871, 0.831);
const RED = rgb(0.886, 0.231, 0.18);

const money = (cents: number) => "$" + (cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export async function buildQuotePdf(q: any): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const helv = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const M = 54;
  const W = 612 - M * 2;
  let y = 792 - 56;

  try {
    const bytes = fs.readFileSync(path.join(process.cwd(), "public", "dot1-logo-print.png"));
    const img = await doc.embedPng(bytes);
    const h = 44;
    const w = (img.width / img.height) * h;
    page.drawImage(img, { x: M, y: y - h + 6, width: w, height: h });
  } catch (e) {}

  const title = "QUOTE";
  page.drawText(title, { x: 612 - M - bold.widthOfTextAtSize(title, 21), y: y - 8, size: 21, font: bold, color: INK });
  const no = String(q.no || "");
  page.drawText(no, { x: 612 - M - helv.widthOfTextAtSize(no, 10), y: y - 24, size: 10, font: helv, color: STONE });
  const dt = new Date(q.createdAt || Date.now()).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  page.drawText(dt, { x: 612 - M - helv.widthOfTextAtSize(dt, 9), y: y - 38, size: 9, font: helv, color: FAINT });
  y -= 62;
  page.drawRectangle({ x: M, y, width: W, height: 2, color: RED });
  y -= 30;

  const colB = M, colS = M + W / 2 + 10;
  page.drawText("PREPARED FOR", { x: colB, y, size: 8, font: bold, color: FAINT });
  page.drawText("SESSION", { x: colS, y, size: 8, font: bold, color: FAINT });
  y -= 15;
  const c = q.client || {};
  const sv = q.service || {};
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

  page.drawText("DESCRIPTION", { x: M, y, size: 8, font: bold, color: FAINT });
  const amtHdr = "AMOUNT";
  page.drawText(amtHdr, { x: 612 - M - bold.widthOfTextAtSize(amtHdr, 8), y, size: 8, font: bold, color: FAINT });
  y -= 8;
  page.drawRectangle({ x: M, y, width: W, height: 0.8, color: INK });
  y -= 17;
  for (const it of q.items || []) {
    const label = String(it.label || "").slice(0, 72);
    page.drawText(label, { x: M, y, size: 10, font: helv, color: BODY });
    const amt = money(Number(it.cents) || 0);
    page.drawText(amt, { x: 612 - M - helv.widthOfTextAtSize(amt, 10), y, size: 10, font: helv, color: INK });
    y -= 8;
    page.drawRectangle({ x: M, y, width: W, height: 0.5, color: LINE });
    y -= 15;
  }

  // estimated total box
  y -= 6;
  page.drawRectangle({ x: 612 - M - 236, y: y - 12, width: 236, height: 34, color: rgb(0.98, 0.955, 0.935) });
  page.drawRectangle({ x: 612 - M - 236, y: y - 12, width: 2.5, height: 34, color: RED });
  page.drawText("ESTIMATED TOTAL", { x: 612 - M - 224, y: y + 8, size: 7.5, font: bold, color: RED });
  const tot = money(Number(q.totalCents) || 0);
  page.drawText(tot, { x: 612 - M - helv.widthOfTextAtSize(tot, 14) - 12, y: y - 6, size: 14, font: bold, color: INK });
  y -= 34;
  const ret = money(Number(q.retainerCents != null ? q.retainerCents : Math.round((Number(q.totalCents) || 0) / 2)));
  page.drawText("A 50% retainer (" + ret + ") reserves your date once you approve this quote.", { x: M, y, size: 8.5, font: helv, color: STONE });
  y -= 15;
  const valid = q.validUntil ? new Date(q.validUntil).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "";
  page.drawText(valid ? "This quote is valid until " + valid + ". Prices may change after that date." : "This is an estimate, not a bill. No payment is due yet.", { x: M, y, size: 8.5, font: helv, color: STONE });
  y -= 22;

  if (q.notes) {
    page.drawText("NOTES", { x: M, y, size: 8, font: bold, color: FAINT });
    y -= 13;
    const words = String(q.notes).split(/\s+/);
    let line = "";
    for (const w of words) {
      const t = line ? line + " " + w : w;
      if (helv.widthOfTextAtSize(t, 9) > W) { page.drawText(line, { x: M, y, size: 9, font: helv, color: BODY }); y -= 12; line = w; }
      else line = t;
      if (y < 90) break;
    }
    if (line && y >= 90) { page.drawText(line, { x: M, y, size: 9, font: helv, color: BODY }); y -= 12; }
  }

  page.drawRectangle({ x: M, y: 64, width: W, height: 0.8, color: LINE });
  const foot = "Dot One Media  ·  Create with purpose  ·  dot1.media  ·  Wasilla, Alaska  ·  Veteran-Owned";
  page.drawText(foot, { x: (612 - helv.widthOfTextAtSize(foot, 8)) / 2, y: 48, size: 8, font: helv, color: FAINT });

  return doc.save();
}
