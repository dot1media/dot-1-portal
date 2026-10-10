import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { cookies } from "next/headers";
import { verifyToken, ADMIN_COOKIE } from "@/lib/auth";
import { hasStudio } from "@/lib/studioGuard";
import { putObject, r2Configured } from "@/lib/r2";

export const runtime = "nodejs";

const ALLOWED: Record<string, true> = { client_services: true, media_release: true, minor_release: true };
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB is plenty for a signed PDF or photo of one

// Studio-only: attach a manually-signed agreement (a PDF or image the client signed offline) to a
// client's account. Records a normal agreements row so the account counts as signed (clearing the
// first-login gate) and the signed copy can be viewed/downloaded via /api/signed-doc.
export async function POST(request: Request) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  if (!r2Configured()) return NextResponse.json({ error: "File storage isn't configured, so uploads can't be saved yet." }, { status: 400 });

  let form: FormData;
  try { form = await request.formData(); } catch { return NextResponse.json({ error: "Could not read the upload." }, { status: 400 }); }

  const email = String(form.get("email") || "").trim().toLowerCase();
  const agreementType = String(form.get("agreementType") || "client_services").trim();
  const signedName = String(form.get("signedName") || "").trim() || "Signed offline";
  const version = String(form.get("version") || "1.0").trim();
  const file = form.get("file");

  if (!email) return NextResponse.json({ error: "A client email is required." }, { status: 400 });
  if (!ALLOWED[agreementType]) return NextResponse.json({ error: "Unknown agreement type." }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "Please choose a file to upload." }, { status: 400 });

  const ct = file.type || "application/octet-stream";
  const okType = ct === "application/pdf" || ct.startsWith("image/");
  if (!okType) return NextResponse.json({ error: "Upload a PDF or an image of the signed agreement." }, { status: 400 });

  const buf = new Uint8Array(await file.arrayBuffer());
  if (buf.byteLength === 0) return NextResponse.json({ error: "That file appears to be empty." }, { status: 400 });
  if (buf.byteLength > MAX_BYTES) return NextResponse.json({ error: "That file is too large (max 25 MB)." }, { status: 400 });

  const users = (await sql`SELECT id FROM users WHERE email = ${email} LIMIT 1`) as any[];
  if (!users.length) return NextResponse.json({ error: "No account found with that email. Create the account first, then upload." }, { status: 404 });
  const userId = users[0].id as string;

  const admin = verifyToken((await cookies()).get(ADMIN_COOKIE)?.value);
  const ext = ct === "application/pdf" ? "pdf" : (ct.split("/")[1] || "bin").replace(/[^a-z0-9]/gi, "").slice(0, 5);
  const safeBase = (file.name || agreementType).replace(/[^\w.-]+/g, "-").slice(0, 60);
  const key = `agreements/${userId}/${Date.now()}-${safeBase || agreementType}.${ext}`;
  try { await putObject(key, buf, ct); } catch { return NextResponse.json({ error: "Could not save the file. Please try again." }, { status: 502 }); }

  const details = JSON.stringify({ uploaded: true, key, fileName: file.name || `${agreementType}.${ext}`, contentType: ct, uploadedBy: admin?.email || null });
  const rows = (await sql`
    INSERT INTO agreements (user_id, agreement_type, version, signed_name, usage_option, details)
    VALUES (${userId}, ${agreementType}, ${version}, ${signedName}, ${null}, ${details}::jsonb)
    RETURNING id, agreement_type, version, signed_name, usage_option, signed_at
  `) as any[];

  return NextResponse.json({ ok: true, agreement: rows[0] });
}
