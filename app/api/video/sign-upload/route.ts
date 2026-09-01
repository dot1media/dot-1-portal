import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hasStudio } from "@/lib/studioGuard";
import { ensureVideoSchema, videoKey, newId } from "@/lib/video";
import { presignPut, r2Configured } from "@/lib/r2";
export const runtime = "nodejs";
export async function POST(req: Request) {
  if (!(await hasStudio())) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  if (!r2Configured()) return NextResponse.json({ error: "R2 storage is not configured." }, { status: 400 });
  const b: any = await req.json().catch(() => ({}));
  const sessionId = String(b.sessionId || "");
  await ensureVideoSchema();
  let clientEmail = "";
  if (sessionId) { const r = (await sql`SELECT client_email FROM portal_sessions WHERE id = ${sessionId} LIMIT 1`) as any[]; clientEmail = String(r[0]?.client_email || "").toLowerCase(); }
  const vmax = (await sql`SELECT COALESCE(MAX(version), 0) AS v FROM video_reviews WHERE session_id = ${sessionId}`) as any[];
  const version = Number(vmax[0]?.v || 0) + 1;
  const id = newId("v_");
  await sql`INSERT INTO video_reviews (id, session_id, client_email, version, title) VALUES (${id}, ${sessionId || null}, ${clientEmail || null}, ${version}, ${b.title || ("Cut " + version)})`;
  return NextResponse.json({ reviewId: id, version, url: await presignPut(videoKey(id), String(b.type || "video/mp4"), 3600) });
}
