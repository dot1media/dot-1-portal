import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { putObject, r2Configured } from "@/lib/r2";
import { ensureModelReleases } from "@/lib/model-release";
import { buildReleasePdf } from "@/lib/release-pdf";

export const runtime = "nodejs";

// Public (token-gated): record a model's signature, generate the signed release PDF
// from the real document, store it, and mark the release signed.
export async function POST(request: Request) {
  await ensureModelReleases();
  const origin = new URL(request.url).origin;
  const b = await request.json().catch(() => ({}));
  const token = String(b.token || "");
  const signedName = String(b.signedName || "").trim().slice(0, 120);
  const usageOption = ["A", "B", "C"].includes(String(b.usageOption)) ? String(b.usageOption) : "A";
  const exception = String(b.exception || "").trim().slice(0, 120);
  const childAge = String(b.childAge || "").trim().slice(0, 10);
  const relationship = String(b.relationship || "").trim().slice(0, 60);
  const email = String(b.email || "").trim().toLowerCase().slice(0, 200);
  if (!token || !signedName) return NextResponse.json({ error: "A typed signature is required." }, { status: 400 });

  const rows = (await sql`SELECT * FROM model_releases WHERE token = ${token} LIMIT 1`) as any[];
  if (!rows.length) return NextResponse.json({ error: "This link is not valid." }, { status: 404 });
  const r = rows[0];
  if (r.status === "signed" || r.status === "uploaded") return NextResponse.json({ error: "This release has already been completed." }, { status: 409 });
  if (r.minor && !relationship) return NextResponse.json({ error: "Please state your relationship to the child." }, { status: 400 });

  const signedAt = new Date().toISOString();
  const type = r.minor ? "minor_release" : "media_release";
  let docKey = "";
  if (r2Configured()) {
    try {
      const pdf = await buildReleasePdf(origin, {
        type: type as any,
        name: signedName,                       // adult subject, or guardian (minor)
        email: email || r.email || "",
        signedAt, usageOption, exception,
        childName: r.minor ? r.name : "",
        childAge: r.minor ? childAge : "",
        relationship: r.minor ? relationship : "",
      });
      docKey = `model-releases/${r.session_id}/${r.id}-${Date.now()}.pdf`;
      await putObject(docKey, new Uint8Array(pdf), "application/pdf");
    } catch (e) {
      return NextResponse.json({ error: "Could not generate the signed document. Please try again." }, { status: 502 });
    }
  }

  await sql`UPDATE model_releases SET status = 'signed', signed_name = ${signedName}, signed_at = ${signedAt},
    usage_option = ${usageOption}, child_age = ${r.minor ? childAge : null}, relationship = ${r.minor ? relationship : null},
    guardian_name = ${r.minor ? signedName : null}, email = ${email || r.email || null}, doc_key = ${docKey || null}, uploaded = false
    WHERE token = ${token}`;

  return NextResponse.json({ ok: true });
}
