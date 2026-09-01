import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { ensureVideoSchema, videoKey } from "@/lib/video";
import { deleteObject } from "@/lib/r2";
export const runtime = "nodejs";
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Cron not configured." }, { status: 503 });
  if (req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  const days = parseInt(process.env.MEDIA_REVIEW_RETENTION_DAYS || "0", 10);
  if (!days || days < 1) return NextResponse.json({ ok: true, skipped: "retention not enabled (set MEDIA_REVIEW_RETENTION_DAYS)" });
  await ensureVideoSchema();
  const stale = (await sql`
    SELECT r.id FROM video_reviews r
    WHERE r.uploaded = true AND r.status <> 'approved' AND r.created_at < now() - (${String(days)} || ' days')::interval
      AND EXISTS (SELECT 1 FROM video_reviews r2 WHERE r2.session_id = r.session_id AND r2.version > r.version)`) as any[];
  let cleaned = 0;
  for (const r of stale) { await deleteObject(videoKey(r.id)); await sql`UPDATE video_reviews SET uploaded = false WHERE id = ${r.id}`; cleaned++; }
  return NextResponse.json({ ok: true, cleaned, retentionDays: days });
}
