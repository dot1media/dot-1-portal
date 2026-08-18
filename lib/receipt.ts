import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const KIND: Record<string, string> = { retainer: "Retainer", deposit: "Deposit", half: "Deposit", full: "Full payment", balance: "Balance payment", charge: "Add-on" };
export function kindLabel(k: any): string { return KIND[String(k || "").toLowerCase()] || "Payment"; }
export function receiptMoneyCents(cents: any): string {
  return "$" + ((Number(cents) || 0) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
export function cardLabel(p: any): string {
  if (!p || !p.card_brand) return "Card";
  const brand = String(p.card_brand).replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
  return brand + (p.card_last4 ? "  \u00b7\u00b7\u00b7\u00b7  " + p.card_last4 : "");
}
export function receiptDate(iso: any): string {
  try { return new Date(iso).toLocaleString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Anchorage" }); } catch (e) { return ""; }
}
export function receiptNo(p: any): string {
  return "No. " + String((p && p.id) || "").replace(/^rcpt_/, "").replace(/-/g, "").slice(0, 10).toUpperCase();
}

export async function receiptPdf(p: any): Promise<string> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ital = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const INK = rgb(0.1, 0.095, 0.09), GRAY = rgb(0.42, 0.4, 0.37), RED = rgb(0.886, 0.231, 0.18), LN = rgb(0.88, 0.86, 0.83);
  const M = 56, R = 612 - M;
  let y = 792 - 66;
  const t = (s: any, x: number, size: number, f: any, c: any) => page.drawText(String(s == null ? "" : s), { x, y, size, font: f, color: c });
  const tr = (s: string, size: number, f: any, c: any) => page.drawText(s, { x: R - f.widthOfTextAtSize(s, size), y, size, font: f, color: c });
  const rule = (th = 0.75) => page.drawLine({ start: { x: M, y }, end: { x: R, y }, thickness: th, color: LN });

  t("DOT ONE MEDIA", M, 22, bold, INK); y -= 17;
  t("DOT ONE LLC   \u00b7   Wasilla, Alaska   \u00b7   contact@dot1.media", M, 9, helv, GRAY); y -= 28;
  rule(1); y -= 32;

  t("RECEIPT", M, 15, bold, RED); tr(receiptNo(p), 10, helv, GRAY); y -= 15;
  tr(receiptDate(p.paid_at), 10, helv, GRAY); y -= 34;

  t("BILLED TO", M, 8, bold, GRAY); y -= 15;
  t(p.client_name || "Client", M, 13, helv, INK); y -= 14;
  if (p.client_email) { t(p.client_email, M, 10, helv, GRAY); y -= 14; }
  y -= 18;

  rule(); y -= 15;
  t("DESCRIPTION", M, 8, bold, GRAY); tr("AMOUNT", 8, bold, GRAY); y -= 18;
  const amt = receiptMoneyCents(p.amount_cents);
  t((p.service || "Session") + "  \u2014  " + kindLabel(p.kind), M, 12, helv, INK); tr(amt, 12, helv, INK); y -= 20;
  rule(); y -= 22;
  t("Amount paid", R - 210, 12, bold, INK); tr(amt, 14, bold, RED); y -= 20;
  const totalC = Number(p.total_cents) || 0;
  const remainC = totalC - (Number(p.amount_cents) || 0);
  const partial = ["retainer", "deposit", "half"].indexOf(String(p.kind || "").toLowerCase()) !== -1;
  if (partial && totalC > 0 && remainC > 0) {
    t("Session total " + receiptMoneyCents(totalC) + "  \u00b7  balance remaining " + receiptMoneyCents(remainC) + ", due per your service agreement.", M, 8.5, helv, GRAY);
  }
  y -= 24;

  t("PAYMENT METHOD", M, 8, bold, GRAY); y -= 14;
  t(cardLabel(p), M, 11, helv, INK); y -= 42;

  rule(1); y -= 20;
  t("Thank you for creating with Dot One Media.", M, 11, ital, GRAY); y -= 22;
  t("This receipt confirms payment received for the charge shown above. Please retain it for your records.", M, 8.5, helv, GRAY);

  return Buffer.from(await pdf.save()).toString("base64");
}

