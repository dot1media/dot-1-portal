import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyClientToken, CLIENT_COOKIE } from "@/lib/auth";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const runtime = "nodejs";

const H = 792;
const SPECS: Record<string, any> = {
  client_services: {
    file: "Dot-One-Media-Client-Services-Agreement.pdf",
    fields: [
      { p: 6, x: 72, y0: 109.4, v: "name" },
      { p: 6, x: 72, y0: 218.7, v: "name", sig: true },
      { p: 6, x: 319.1, y0: 218.7, v: "date" },
      { p: 6, x: 72, y0: 241.4, v: "email" },
      { p: 6, x: 72, y0: 308.7, v: "studio", sig: true },
      { p: 6, x: 319.1, y0: 308.7, v: "date" },
    ],
    note: { p: 6, x: 72, y0: 330 },
  },
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

function fmtDate(iso: any): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "America/Anchorage" });
  } catch (e) {
    return "";
  }
}

export async function GET(request: Request) {
  const store = await cookies();
  const client = verifyClientToken(store.get(CLIENT_COOKIE)?.value);
  if (!client || !client.email) return new NextResponse("Please sign in again.", { status: 401 });
  const u = new URL(request.url);
  const id = String(u.searchParams.get("id") || "");
  if (!id) return new NextResponse("Missing document id.", { status: 400 });

  let rows: any[];
  try {
    rows = (await sql`
      SELECT a.agreement_type, a.signed_name, a.usage_option, a.details, a.signed_at, u.email
      FROM agreements a JOIN users u ON a.user_id = u.id
      WHERE a.id = ${id} AND lower(u.email) = ${String(client.email).toLowerCase()} LIMIT 1`) as any[];
  } catch (e) {
    return new NextResponse("Could not load the document.", { status: 500 });
  }
  if (!rows || rows.length === 0) return new NextResponse("Document not found.", { status: 404 });
  const a = rows[0];
  const spec = SPECS[a.agreement_type];
  if (!spec) return new NextResponse("This document type cannot be generated.", { status: 400 });

  const details = a.details || {};
  const vals: Record<string, string> = {
    name: a.signed_name || "",
    email: a.email || "",
    date: fmtDate(a.signed_at),
    studio: "Dot One Media",
    childName: details.childName || "",
    childAge: details.childAge || "",
    relationship: details.relationship || "",
  };

  let tplBytes: ArrayBuffer;
  try {
    const res = await fetch(u.origin + "/" + spec.file);
    if (!res.ok) throw new Error("template " + res.status);
    tplBytes = await res.arrayBuffer();
  } catch (e) {
    return new NextResponse("The document template is unavailable.", { status: 502 });
  }

  const pdf = await PDFDocument.load(tplBytes);
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const ital = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const INK = rgb(0.08, 0.075, 0.067);
  const GRAY = rgb(0.54, 0.52, 0.49);
  const RED = rgb(0.886, 0.231, 0.18);
  const P = pdf.getPages();

  for (const f of spec.fields) {
    const t = vals[f.v] || "";
    if (!t) continue;
    if (f.sig) P[f.p].drawText(t, { x: f.x, y: H - f.y0 + 6, size: 14, font: ital, color: INK });
    else P[f.p].drawText(t, { x: f.x, y: H - f.y0 + 5, size: 10, font: helv, color: INK });
  }
  if (spec.checks && a.usage_option && spec.checks[a.usage_option]) {
    const c = spec.checks[a.usage_option];
    const x0 = c[0], y0t = c[1], x1 = c[2], y1 = c[3], pg = c[4];
    const bB = H - y1, bT = H - y0t;
    P[pg].drawLine({ start: { x: x0 + 1.4, y: bB + 4.0 }, end: { x: x0 + 3.5, y: bB + 1.6 }, thickness: 1.4, color: RED });
    P[pg].drawLine({ start: { x: x0 + 3.5, y: bB + 1.6 }, end: { x: x1 - 0.5, y: bT - 0.8 }, thickness: 1.4, color: RED });
    if (a.usage_option === "C" && details.exception && spec.exception) {
      P[spec.exception.p].drawText(String(details.exception).slice(0, 40), { x: spec.exception.x, y: H - spec.exception.y0 - 7.5, size: 10, font: helv, color: INK });
    }
  }
  if (spec.note) {
    P[spec.note.p].drawText("Signed electronically through portal.dot1.media on " + vals.date + ".", { x: spec.note.x, y: H - spec.note.y0, size: 8, font: helv, color: GRAY });
  }

  const out = await pdf.save();
  return new NextResponse(Buffer.from(out), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="' + spec.file.replace(/\.pdf$/, "") + '-signed.pdf"',
      "Cache-Control": "private, no-store",
    },
  });
}

