import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { currentClientEmail } from "@/lib/gallery";
import { presignPut, r2Configured } from "@/lib/r2";
import { inspKey, ensureInsp, canSee } from "@/lib/inspiration";
export const runtime = "nodejs";
export async function POST(req: Request) {
  const b: any = await req.json().catch(() => ({}));
  const sid = String(b.sessionId || ""); const count = Math.max(1, Math.min(12, parseInt(String(b.count), 10) || 1));
  if (!sid || !(await canSee(sid))) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  if (!r2Configured()) return NextResponse.json({ error: "Storage not configured." }, { status: 400 });
  await ensureInsp();
  const em = await currentClientEmail();
  const existing = ((await sql`SELECT COUNT(*)::int AS n FROM inspiration WHERE session_id = ${sid}`) as any[])[0];
  if ((Number(existing?.n) || 0) + count > 30) return NextResponse.json({ error: "Up to 30 images per session." }, { status: 400 });
  const uploads: { id: string; url: string }[] = [];
  for (let i = 0; i < count; i++) { const id = "in_" + Math.random().toString(36).slice(2, 10); await sql`INSERT INTO inspiration (id, session_id, client_email) VALUES (${id}, ${sid}, ${em || null})`; uploads.push({ id, url: await presignPut(inspKey(sid, id), "image/jpeg", 900) }); }
  return NextResponse.json({ uploads });
}
