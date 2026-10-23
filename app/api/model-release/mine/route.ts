import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sql } from "@/lib/db";
import { verifyClientToken, CLIENT_COOKIE } from "@/lib/auth";
import { ensureModelReleases, publicRow } from "@/lib/model-release";

export const runtime = "nodejs";

// Client-facing: the model releases for one of the signed-in client's own sessions,
// so they can forward the e-sign links to the other people in their shoot.
export async function GET(request: Request) {
  const store = await cookies();
  const v = verifyClientToken(store.get(CLIENT_COOKIE)?.value);
  const email = v?.email ? String(v.email).toLowerCase() : "";
  if (!email) return NextResponse.json({ models: [] });
  await ensureModelReleases();
  const sessionId = new URL(request.url).searchParams.get("sessionId") || "";
  if (!sessionId) return NextResponse.json({ models: [] });
  const owns = (await sql`SELECT 1 FROM portal_sessions WHERE id = ${sessionId} AND lower(client_email) = ${email} LIMIT 1`) as any[];
  if (!owns.length) return NextResponse.json({ models: [] });
  const rows = (await sql`SELECT * FROM model_releases WHERE session_id = ${sessionId} ORDER BY created_at ASC`) as any[];
  return NextResponse.json({ models: rows.map(publicRow) });
}
