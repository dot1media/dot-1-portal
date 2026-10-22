import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
import { putObject, r2Configured } from "@/lib/r2";
import { ensureModelReleases } from "@/lib/model-release";

export const runtime = "nodejs";
const MAX_BYTES = 25 * 1024 * 1024;

// Studio-only: attach a hand-signed release (PDF or photo) for a person who signed on paper.
export async function POST(request: Request) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  if (!r2Configured()) return NextResponse.json({ error: "File storage isn't configured, so uploads can't be saved yet." }, { status: 400 });
  await ensureModelReleases();

  let form: FormData;
  try { form = await request.formData(); } catch { return NextResponse.json({ error: "Could not read the upload." }, { status: 400 }); }
  const id = String(form.get("id") || "");
  const signedName = String(form.get("signedName") || "").trim().slice(0, 120) || "Signed on paper";
  const file = form.get("file");
  if (!id) return NextResponse.json({ error: "Missing release id." }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "Please choose a file to upload." }, { status: 400 });

  const ct = file.type || "application/octet-stream";
  if (!(ct === "application/pdf" || ct.startsWith("image/"))) return NextResponse.json({ error: "Upload a PDF or an image of the signed release." }, { status: 400 });
  const buf = new Uint8Array(await file.arrayBuffer());
  if (buf.byteLength === 0) return NextResponse.json({ error: "That file appears to be empty." }, { status: 400 });
  if (buf.byteLength > MAX_BYTES) return NextResponse.json({ error: "That file is too large (max 25 MB)." }, { status: 400 });

  const rows = (await sql`SELECT session_id FROM model_releases WHERE id = ${id} LIMIT 1`) as any[];
  if (!rows.length) return NextResponse.json({ error: "Release not found." }, { status: 404 });
  const ext = ct === "application/pdf" ? "pdf" : (ct.split("/")[1] || "bin").replace(/[^a-z0-9]/gi, "").slice(0, 5);
  const key = `model-releases/${rows[0].session_id}/${id}-upload-${Date.now()}.${ext}`;
  try { await putObject(key, buf, ct); } catch { return NextResponse.json({ error: "Could not save the file." }, { status: 502 }); }

  await sql`UPDATE model_releases SET status = 'uploaded', uploaded = true, signed_name = ${signedName}, signed_at = now(), doc_key = ${key} WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
