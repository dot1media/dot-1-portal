import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Build a filled/signed Media Release or Minor Release by overlaying onto the real
// static PDF, using the same field coordinates as /api/signed-doc. Used for per-model
// releases (one document per person identified in a session). `unsigned` fills the
// name/email only, leaving the signature blank for a printed, hand-signed copy.

const H = 792;

const SPECS: Record<string, any> = {
  media_release: {
    file: "Dot-One-Media-Release-and-Waiver.pdf",
    fields: [
      { p: 3, x: 72, y0: 109.4, v: "name" },
      { p: 3, x: 72, y0: 178.2, v: "name", sig: true },
      { p: 3, x: 319.1, y0: 178.2, v: "date" },
      { p: 3, x: 72, y0: 200.9, v: "email" },
    ],
    checks: { A: [84.4, 149.6, 93.4, 158.6, 1], B: [84.4, 208.9, 93.4, 217.9, 1], C: [84.4, 267.4, 93.4, 276.4, 1] },
    exception: { p: 1, x: 100, y0: 292.6 },
    note: { p: 3, x: 72, y0: 228 },
  },
  minor_release: {
    file: "Dot-One-Media-Minor-Release-and-Waiver.pdf",
    fields: [
      { p: 0, x: 72, y0: 567.6, v: "childName" },
      { p: 0, x: 313.9, y0: 567.6, v: "childAge" },
      { p: 3, x: 72, y0: 306.6, v: "name" },
      { p: 3, x: 313.9, y0: 306.6, v: "relationship" },
      { p: 3, x: 72, y0: 375.4, v: "name", sig: true },
      { p: 3, x: 319.1, y0: 375.4, v: "date" },
      { p: 3, x: 72, y0: 398.1, v: "email" },
    ],
    checks: { A: [84.4, 259.1, 93.4, 268.1, 1], B: [84.4, 317.6, 93.4, 326.6, 1], C: [84.4, 376.9, 93.4, 385.9, 1] },
    exception: { p: 1, x: 100, y0: 402.1 },
    note: { p: 3, x: 72, y0: 465 },
  },
};

export function fmtDate(iso: any): string {
  try { return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "America/Anchorage" }); }
  catch (e) { return ""; }
}

export interface ReleaseVals {
  type: "media_release" | "minor_release";
  name: string;            // adult subject, or (minor) the guardian who signs
  email?: string;
  signedAt?: any;          // ISO or ms; used for the date + signed note
  usageOption?: string;    // A | B | C
  exception?: string;      // for option C
  childName?: string;
  childAge?: string;
  relationship?: string;
  unsigned?: boolean;      // print-and-sign copy: fill name/email, leave signature blank
}

export async function buildReleasePdf(origin: string, v: ReleaseVals): Promise<Uint8Array> {
  const spec = SPECS[v.type];
  if (!spec) throw new Error("Unknown release type.");
  const res = await fetch(origin + "/" + spec.file);
  if (!res.ok) throw new Error("template " + res.status);
  const tplBytes = await res.arrayBuffer();

  const pdf = await PDFDocument.load(tplBytes);
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const ital = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const INK = rgb(0.08, 0.075, 0.067);
  const GRAY = rgb(0.54, 0.52, 0.49);
  const RED = rgb(0.886, 0.231, 0.18);
  const P = pdf.getPages();

  const vals: Record<string, string> = {
    name: v.name || "",
    email: v.email || "",
    date: v.unsigned ? "" : fmtDate(v.signedAt || Date.now()),
    childName: v.childName || "",
    childAge: v.childAge || "",
    relationship: v.relationship || "",
  };

  for (const f of spec.fields) {
    if (f.sig && v.unsigned) continue;           // leave the signature line blank to sign by hand
    const t = vals[f.v] || "";
    if (!t) continue;
    if (f.sig) P[f.p].drawText(t, { x: f.x, y: H - f.y0 + 6, size: 14, font: ital, color: INK });
    else P[f.p].drawText(t, { x: f.x, y: H - f.y0 + 5, size: 10, font: helv, color: INK });
  }
  if (spec.checks && v.usageOption && spec.checks[v.usageOption]) {
    const c = spec.checks[v.usageOption];
    const x0 = c[0], y0t = c[1], x1 = c[2], y1 = c[3], pg = c[4];
    const bB = H - y1, bT = H - y0t;
    P[pg].drawLine({ start: { x: x0 + 1.4, y: bB + 4.0 }, end: { x: x0 + 3.5, y: bB + 1.6 }, thickness: 1.4, color: RED });
    P[pg].drawLine({ start: { x: x0 + 3.5, y: bB + 1.6 }, end: { x: x1 - 0.5, y: bT - 0.8 }, thickness: 1.4, color: RED });
    if (v.usageOption === "C" && v.exception && spec.exception) {
      P[spec.exception.p].drawText(String(v.exception).slice(0, 40), { x: spec.exception.x, y: H - spec.exception.y0 - 7.5, size: 10, font: helv, color: INK });
    }
  }
  if (!v.unsigned && spec.note) {
    P[spec.note.p].drawText("Signed electronically through portal.dot1.media on " + vals.date + ".", { x: spec.note.x, y: H - spec.note.y0, size: 8, font: helv, color: GRAY });
  }

  return pdf.save();
}
