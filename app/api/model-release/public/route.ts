import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ensureModelReleases, publicRow } from "@/lib/model-release";

export const runtime = "nodejs";

// Public (token-gated): the info the signing page needs. No auth; the token is the key.
export async function GET(request: Request) {
  await ensureModelReleases();
  const token = new URL(request.url).searchParams.get("token") || "";
  if (!token) return NextResponse.json({ error: "Missing link token." }, { status: 400 });
  const rows = (await sql`SELECT * FROM model_releases WHERE token = ${token} LIMIT 1`) as any[];
  if (!rows.length) return NextResponse.json({ error: "This link is not valid." }, { status: 404 });
  const r = rows[0];

  let session: any = null;
  try {
    const s = (await sql`SELECT data FROM portal_sessions WHERE id = ${r.session_id} LIMIT 1`) as any[];
    if (s.length) { const d = s[0].data || {}; session = { type: d.type || "", date: d.date || "", photographer: d.photographer || "" }; }
  } catch (e) {}

  return NextResponse.json({ model: publicRow(r), session });
}
